import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ReservedSql, Sql } from './client.js';

/**
 * Migration runner.
 *
 * Plain SQL files applied in filename order, with a ledger of what has run.
 * Three properties matter more than features:
 *
 * It takes an advisory lock, so two instances deploying at once cannot both
 * apply the same migration. Railway starts a new instance before stopping the
 * old one, which makes concurrent migration the normal case rather than a rare
 * race.
 *
 * It records a checksum, so a migration edited after it was applied is caught.
 * That is the failure that makes two environments diverge while both look
 * healthy — the file says one thing, the deployed database says another, and
 * nothing reports a problem until a query fails on one environment only.
 *
 * It stops on the first failure and leaves the rest unapplied. A half-migrated
 * database with no record of where it stopped is far harder to recover than one
 * that failed cleanly at a known point.
 */

/** Namespaced lock id, so it cannot collide with an application lock. */
const MIGRATION_LOCK_ID = 4_919_001;

export interface Migration {
  readonly filename: string;
  readonly sql: string;
  readonly checksum: string;
}

export interface MigrationResult {
  readonly applied: readonly string[];
  readonly alreadyApplied: readonly string[];
}

function checksum(contents: string): string {
  // Line endings are normalised so a file checked out on Windows does not read
  // as modified.
  return createHash('sha256').update(contents.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
}

/** Read migrations from disk, ordered by filename. */
export async function loadMigrations(directory: string): Promise<readonly Migration[]> {
  const entries = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();

  return Promise.all(
    entries.map(async (filename) => {
      const sql = await readFile(join(directory, filename), 'utf8');
      return { filename, sql, checksum: checksum(sql) };
    }),
  );
}

/**
 * Ensure the ledger exists.
 *
 * Created outside the migration files themselves so the runner can adopt a
 * database that was migrated by hand before the runner existed.
 */
async function ensureLedger(sql: Sql | ReservedSql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      checksum   text        NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export interface MigrateOptions {
  /**
   * Fail if an already-applied migration's contents have changed.
   *
   * On by default. Turning it off is for adopting a database whose files were
   * reformatted before the ledger existed, and it should not be left off.
   */
  readonly verifyChecksums?: boolean | undefined;
  readonly log?: ((message: string) => void) | undefined;
}

/**
 * Apply every migration that has not run yet.
 *
 * Each migration runs in its own transaction. The files carry their own
 * BEGIN/COMMIT, and rather than nesting, each is executed as a single
 * multi-statement command — Postgres runs one of those as a single implicit
 * transaction when the file does not manage its own.
 */
export async function migrate(
  sql: Sql,
  directory: string,
  options: MigrateOptions = {},
): Promise<MigrationResult> {
  const log = options.log ?? (() => {});
  const migrations = await loadMigrations(directory);

  // Everything below runs on one reserved connection, for two reasons that both
  // produce silent corruption otherwise.
  //
  // An advisory lock is session-scoped. Taken from a pool, the lock and the work
  // it is meant to protect can land on different connections — the lock guards
  // nothing and the unlock warns that it never held it.
  //
  // And the migration files manage their own transactions. postgres.js refuses
  // to run BEGIN over a pooled connection precisely because it cannot track
  // where the transaction ends up, which is the right call.
  const db = await sql.reserve();

  // Serialise concurrent deploys: Railway starts a new instance before stopping
  // the old one, so two processes migrating at once is the normal case.
  await db`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`;

  try {
    await ensureLedger(db);

    const ledger = await db<{ filename: string; checksum: string }[]>`
      SELECT filename, checksum FROM schema_migrations
    `;
    const applied = new Map(ledger.map((row) => [row.filename, row.checksum]));

    if (options.verifyChecksums !== false) {
      for (const migration of migrations) {
        const recorded = applied.get(migration.filename);
        if (recorded !== undefined && recorded !== migration.checksum) {
          throw new Error(
            `Migration ${migration.filename} was modified after it was applied. ` +
              `The database does not match the file. Write a new migration instead of editing this one.`,
          );
        }
      }
    }

    const pending = migrations.filter((m) => !applied.has(m.filename));
    if (pending.length === 0) {
      log('No pending migrations.');
      return { applied: [], alreadyApplied: [...applied.keys()] };
    }

    const justApplied: string[] = [];
    for (const migration of pending) {
      log(`Applying ${migration.filename}...`);
      // `.simple()` allows the multiple statements a migration file contains;
      // the parameterised path only permits one statement per call.
      await db.unsafe(migration.sql).simple();
      await db`
        INSERT INTO schema_migrations (filename, checksum)
        VALUES (${migration.filename}, ${migration.checksum})
      `;
      justApplied.push(migration.filename);
      log(`Applied ${migration.filename}`);
    }

    return { applied: justApplied, alreadyApplied: [...applied.keys()] };
  } finally {
    await db`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`;
    // Returning the connection to the pool also releases any lock still held,
    // so a crash between these two lines cannot wedge future deploys.
    db.release();
  }
}

/**
 * Report pending migrations without applying them.
 *
 * Used by the readiness probe: a service running against a database older than
 * its own code will fail in ways that look like bugs, so it should say so
 * plainly instead.
 */
export async function pendingMigrations(
  sql: Sql,
  directory: string,
): Promise<readonly string[]> {
  const migrations = await loadMigrations(directory);
  try {
    const ledger = await sql<{ filename: string }[]>`SELECT filename FROM schema_migrations`;
    const applied = new Set(ledger.map((row) => row.filename));
    return migrations.filter((m) => !applied.has(m.filename)).map((m) => m.filename);
  } catch {
    // No ledger means nothing has been applied.
    return migrations.map((m) => m.filename);
  }
}
