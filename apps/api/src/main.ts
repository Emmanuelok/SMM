import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.js';
import { buildServer } from './server.js';

/**
 * Entry point.
 *
 * Two things beyond starting a server, both of which are the difference between
 * a deploy that is invisible to users and one that is not.
 *
 * Configuration is validated before the port is bound, so a missing secret
 * fails the deploy rather than the first request.
 *
 * Shutdown is graceful. A platform rolling a deploy sends SIGTERM and then
 * waits; a process that exits immediately drops every request in flight, which
 * on the publish path can mean a post that was mid-submit. Fastify's close
 * stops accepting new connections and lets existing ones finish.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, '..', '..', '..', 'packages', 'db', 'migrations');

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer({ config, migrationsDir: MIGRATIONS_DIR });

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

  // An unhandled rejection leaves the process in an unknown state. Logging and
  // exiting lets the platform restart it cleanly, which is better than serving
  // traffic from a process that may be half-broken.
  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ err: reason }, 'unhandled rejection');
    process.exit(1);
  });

  await app.listen({ port: config.PORT, host: config.HOST });
}

try {
  await main();
} catch (error) {
  console.error('Failed to start:', error instanceof Error ? error.message : error);
  process.exit(1);
}
