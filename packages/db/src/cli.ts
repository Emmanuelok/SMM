import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { createDatabase, databaseUrlFromEnv, shouldUseSsl } from './client.js';
import { migrate, pendingMigrations } from './migrate.js';

/**
 * Migration entry point, run as a release step before a deploy goes live.
 *
 * A separate process rather than something the API does at startup. Migrating
 * on boot means every instance races every other one, and a failed migration
 * takes down the service that was trying to apply it — the deploy should fail
 * instead, leaving the previous version serving traffic.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
// Migrations sit beside the compiled output, at the package root.
export const MIGRATIONS_DIR = join(HERE, '..', 'migrations');

/**
 * Turn a driver error into the thing to actually go and do.
 *
 * A migration failing during a deploy is diagnosed from a log line and nothing
 * else, and the driver's own message names the symptom rather than the cause.
 * These four account for nearly every first-deploy failure.
 */
function hintFor(message: string): string {
  if (/does not support SSL|SSL.*not enabled|server does not support/i.test(message)) {
    return (
      '\nThe database refused a TLS connection. Managed Postgres on a private network ' +
      '(a *.railway.internal address) does not terminate TLS, and its traffic never leaves ' +
      'that network. Set DATABASE_SSL=false for this service, or use the public database URL.'
    );
  }
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(message)) {
    return (
      '\nThe database was unreachable. Check DATABASE_URL is set on this service and ' +
      'references the database rather than being pasted — ${{Postgres.DATABASE_URL}} follows ' +
      'the database if it is recreated.'
    );
  }
  if (/password authentication failed|role .* does not exist/i.test(message)) {
    return '\nThe credentials in DATABASE_URL were rejected. Re-copy it from the database service.';
  }
  if (message.includes('current transaction is aborted')) {
    // Once a statement fails, every later one in the same transaction returns
    // this instead of the real error, so the reported message is not the cause.
    return (
      '\nThis message comes from a statement that ran after the real failure. ' +
      'To find the actual error, apply the file directly:\n' +
      '  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/migrations/<file>.sql'
    );
  }
  return '';
}

/**
 * Report which required variables this process can see.
 *
 * Names and presence only — never values, since this output goes to a build log
 * that is far more widely readable than the variables themselves.
 *
 * Printed before anything is attempted because a migration failing during a
 * deploy is diagnosed from a log line and nothing else, and "which variables
 * did the container actually have" is the first question worth answering. A
 * variable set on the service but not on the pre-deploy step looks identical to
 * one never set at all, until you can see the list.
 */
function reportEnvironment(env: NodeJS.ProcessEnv): void {
  const present = (name: string): string =>
    env[name] === undefined || env[name] === '' ? 'MISSING' : 'set';
  console.log(
    `environment: DATABASE_URL=${present('DATABASE_URL')} ` +
      `DATABASE_SSL=${env['DATABASE_SSL'] ?? 'unset'} ` +
      `NODE_ENV=${env['NODE_ENV'] ?? 'unset'}`,
  );
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'up';
  reportEnvironment(process.env);

  let url: string;
  try {
    url = databaseUrlFromEnv();
  } catch {
    // The single most common first-deploy failure, and previously an unhandled
    // rejection with a stack trace rather than an instruction.
    console.error(
      'DATABASE_URL is not set for this process.\n\n' +
        'On Railway: add a Postgres database to the project, then set the variable on\n' +
        'this service as a reference rather than a pasted value:\n\n' +
        '  railway variables --set "DATABASE_URL=${{Postgres.DATABASE_URL}}"\n\n' +
        'A reference follows the database if it is ever recreated; a pasted value does not.',
    );
    process.exitCode = 1;
    return;
  }

  const sql = createDatabase({ url, ssl: shouldUseSsl(url), poolSize: 2 });

  try {
    if (command === 'status') {
      const pending = await pendingMigrations(sql, MIGRATIONS_DIR);
      if (pending.length === 0) {
        console.log('Database is up to date.');
      } else {
        console.log(`${pending.length} pending migration(s):`);
        for (const name of pending) console.log(`  ${name}`);
      }
      // A non-zero exit lets CI gate on a database being current.
      process.exitCode = pending.length === 0 ? 0 : 1;
      return;
    }

    if (command !== 'up') {
      console.error(`Unknown command: ${command}. Expected "up" or "status".`);
      process.exitCode = 2;
      return;
    }

    const result = await migrate(sql, MIGRATIONS_DIR, {
      log: (message) => console.log(message),
    });
    console.log(
      result.applied.length === 0
        ? 'Nothing to apply.'
        : `Applied ${result.applied.length} migration(s).`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Migration failed:', message);
    console.error(hintFor(message));
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

try {
  await main();
} catch (error) {
  // Nothing above should reach here, but an unhandled rejection in a pre-deploy
  // step prints a stack trace and no instruction, which is the least useful
  // thing a failing deploy can do.
  console.error('Migration failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
