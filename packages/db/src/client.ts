import postgres from 'postgres';

/**
 * Database connection.
 *
 * Tagged-template SQL rather than an ORM. The migrations are the schema
 * contract, and an ORM's model definitions would become a second description of
 * the same thing that drifts from the first. Interpolated values are always
 * parameterised by the driver, so the ordinary way to write a query here is
 * also the safe one.
 */

export type Sql = postgres.Sql<Record<string, never>>;

/**
 * A connection checked out of the pool for exclusive use.
 *
 * Needed wherever connection identity matters rather than just connectivity:
 * session-scoped advisory locks, and SQL that manages its own transactions.
 */
export type ReservedSql = Awaited<ReturnType<Sql['reserve']>>;

export interface DatabaseOptions {
  readonly url: string;
  /**
   * Pool size.
   *
   * Deliberately small by default. Postgres allocates a backend process per
   * connection, so a pool sized for imagined concurrency exhausts the server
   * long before it helps — and on a managed platform the connection ceiling is
   * lower than people expect. The API and the worker each hold their own pool,
   * so this is per-process rather than per-system.
   */
  readonly poolSize?: number | undefined;
  /** Seconds an idle connection is kept before being closed. */
  readonly idleTimeoutSec?: number | undefined;
  /**
   * Seconds a single statement may run before being cancelled.
   *
   * A runaway query holding a connection is how one slow report takes down the
   * publish path; the cap is a circuit breaker, not an optimisation.
   */
  readonly statementTimeoutSec?: number | undefined;
  /** Whether to require TLS. Managed Postgres always should. */
  readonly ssl?: boolean | undefined;
}

/**
 * Open a connection pool.
 *
 * Connects lazily, so a service starts even if the database is briefly
 * unavailable and recovers on its own rather than crash-looping through a
 * platform's restart backoff.
 */
export function createDatabase(options: DatabaseOptions): Sql {
  return postgres(options.url, {
    max: options.poolSize ?? 10,
    idle_timeout: options.idleTimeoutSec ?? 30,
    // Applied to every connection as it is established.
    connection: {
      statement_timeout: (options.statementTimeoutSec ?? 30) * 1000,
      // Names this service in pg_stat_activity, which is the difference between
      // diagnosing a connection leak in minutes and in an afternoon.
      application_name: process.env['SERVICE_NAME'] ?? 'smm',
    },
    ssl: options.ssl === true ? 'require' : false,
    // Errors carry the failing query. Useful in development, and a leak of
    // schema detail and possibly user data into logs in production.
    debug: false,
    transform: { undefined: null },
    // Postgres notices ("relation already exists, skipping") are routine during
    // migration and drown the output that matters.
    onnotice: () => {},
  });
}

/**
 * Read the database URL from the environment.
 *
 * Railway supplies `DATABASE_URL`. Failing loudly at startup is deliberate: a
 * service that boots without a database and fails on first request is
 * discovered by a customer rather than by a deploy.
 */
export function databaseUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  const url = env['DATABASE_URL'];
  if (url === undefined || url.trim() === '') {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

/**
 * Whether TLS should be required.
 *
 * On by default, off only for an explicitly local database. Defaulting the
 * other way would mean forgetting one environment variable silently sends
 * credentials in clear text.
 */
export function shouldUseSsl(url: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (env['DATABASE_SSL'] === 'false') return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
}

/** Whether the database is reachable and responsive. Used by the readiness probe. */
export async function checkDatabase(sql: Sql): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
