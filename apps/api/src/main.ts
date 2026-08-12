import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDatabase, migrate, shouldUseSsl } from '@smm/db';

import { loadConfig, portFrom } from './config.js';
import { buildServer } from './server.js';
import { buildSetupServer } from './setup.js';

/**
 * Entry point.
 *
 * The rule this file exists to enforce: **the process always starts, and always
 * listens.** Four deploys were lost to the opposite arrangement, where a
 * missing variable or an unreachable database killed the container and the
 * platform reported only that the deploy had failed. The application knew
 * exactly what was wrong every time and had no way to say so.
 *
 * So a misconfigured process serves a page explaining itself, and a failed
 * migration is reported through the readiness probe rather than by exiting.
 * Nothing unsafe is exposed by starting: without configuration there is no
 * database connection and no key with which to read a credential, and the
 * degraded server refuses every real route.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, '..', '..', '..', 'packages', 'db', 'migrations');

async function main(): Promise<void> {
  const result = loadConfig();

  if (!result.ok) {
    const app = buildSetupServer(result.problems, process.env['LOG_LEVEL'] ?? 'info');
    const port = portFrom();
    await app.listen({ port, host: '0.0.0.0' });
    app.log.error(
      { missing: result.problems.map((p) => p.variable) },
      'started in setup mode: configuration is incomplete',
    );
    return;
  }

  const { config } = result;

  const sql = createDatabase({
    url: config.DATABASE_URL,
    ssl: shouldUseSsl(config.DATABASE_URL),
    poolSize: config.DATABASE_POOL_SIZE,
  });

  /**
   * Migrate at startup rather than as a separate release step.
   *
   * The earlier arrangement ran migrations as a platform pre-deploy command,
   * which is architecturally tidier and, in practice, worse: it is a second
   * place to fail, it gets applied to services that have no business migrating,
   * and when it fails the deploy dies before anything can explain why.
   *
   * Running here is safe because `migrate` takes a Postgres advisory lock on a
   * reserved connection, so several instances starting at once — which is the
   * normal case during a rolling deploy — serialise rather than race. That is
   * verified: two concurrent runners against an empty database produce one set
   * of migrations, not two.
   *
   * A failure does not stop the server. It is recorded, reported by `/ready`,
   * and retried on the next boot; a crash-looping container explains nothing.
   */
  let migrationError: string | undefined;
  try {
    const applied = await migrate(sql, MIGRATIONS_DIR, {
      log: (message) => console.log(message),
    });
    if (applied.applied.length > 0) {
      console.log(`Applied ${applied.applied.length} migration(s).`);
    }
  } catch (error) {
    migrationError = error instanceof Error ? error.message : String(error);
    console.error('Migration failed:', migrationError);
    console.error(
      'The service will still start and report this on /ready, rather than crash-looping.',
    );
  }

  const app = await buildServer({
    config,
    sql,
    migrationsDir: MIGRATIONS_DIR,
    ...(migrationError === undefined ? {} : { migrationError }),
  });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ err: reason }, 'unhandled rejection');
    process.exit(1);
  });

  await app.listen({ port: config.PORT, host: config.HOST });
}

try {
  await main();
} catch (error) {
  // Reaching here means the process could not even listen, which is the one
  // failure it cannot report over HTTP.
  console.error('Failed to start:', error instanceof Error ? error.message : error);
  process.exit(1);
}
