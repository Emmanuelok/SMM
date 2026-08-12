import { AdapterRegistry, BlueskyAdapter, MastodonAdapter } from '@smm/adapters';
import { CredentialVault, blueskyCredentials, mastodonCredentials } from '@smm/credentials';
import { createDatabase, databaseUrlFromEnv, shouldUseSsl } from '@smm/db';
import { EnvKeyProvider, Vault } from '@smm/vault';

import { runOnce } from './dispatcher.js';

/**
 * Worker entry point.
 *
 * A polling loop rather than a subscription. Postgres `LISTEN/NOTIFY` would
 * remove a second or two of latency and add a delivery guarantee we would then
 * have to reason about: a missed notification is a post that never goes out.
 * Polling a partial index is cheap and cannot lose work, and social scheduling
 * is not a latency-sensitive domain — nobody notices a post arriving two
 * seconds after its slot.
 */

const POLL_INTERVAL_MS = Number(process.env['WORKER_POLL_INTERVAL_MS'] ?? 5_000);
const BATCH_SIZE = Number(process.env['WORKER_BATCH_SIZE'] ?? 10);

function log(level: 'info' | 'error', message: string, extra: Record<string, unknown> = {}): void {
  // Structured single-line JSON, because Railway's log view is line-oriented and
  // a multi-line dump becomes unsearchable.
  console.log(JSON.stringify({ level, message, at: new Date().toISOString(), ...extra }));
}

async function main(): Promise<void> {
  // Waits rather than exits. A worker that dies on a missing variable gets
  // restarted by the platform every few seconds, and the resulting log is a
  // wall of identical crashes rather than one clear statement of the problem.
  let url: string | undefined;
  while (url === undefined) {
    try {
      url = databaseUrlFromEnv();
    } catch {
      log('error', 'DATABASE_URL is not set; waiting for it to be configured', {
        hint: 'Set DATABASE_URL on this service, referencing ${{Postgres.DATABASE_URL}}.',
      });
      await new Promise((resolve) => setTimeout(resolve, 30_000));
    }
  }

  const sql = createDatabase({
    url,
    ssl: shouldUseSsl(url),
    // Smaller than the API's: this process runs one batch at a time and a large
    // idle pool just consumes backends the API could be using.
    poolSize: 4,
  });

  // The registry is what the dispatcher consults, so a network missing from it
  // parks its posts with a clear reason rather than publishing them. This was
  // empty at first, which would have silently parked every post on an otherwise
  // perfectly configured deployment.
  //
  // The worker needs the same CREDENTIAL_KEYS as the API, because it opens the
  // credentials the API sealed. A different key here is not a degraded mode —
  // nothing can be decrypted at all.
  let vault: Vault;
  while (true) {
    try {
      vault = new Vault(EnvKeyProvider.fromEnv());
      break;
    } catch (error) {
      log('error', 'credential keys are not usable; waiting for configuration', {
        detail: error instanceof Error ? error.message : String(error),
        hint: 'CREDENTIAL_KEYS must be set here and must match the API exactly.',
      });
      await new Promise((resolve) => setTimeout(resolve, 30_000));
    }
  }

  const credentials = new CredentialVault(sql, vault);
  const adapters = new AdapterRegistry()
    .register(new BlueskyAdapter(blueskyCredentials(credentials)))
    .register(new MastodonAdapter(mastodonCredentials(credentials)));

  log('info', 'adapters registered', { networks: adapters.available() });

  let running = true;
  const stop = (signal: string): void => {
    log('info', 'shutdown requested', { signal });
    running = false;
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));

  log('info', 'worker started', { pollIntervalMs: POLL_INTERVAL_MS, batchSize: BATCH_SIZE });

  while (running) {
    try {
      const outcomes = await runOnce({ sql, adapters }, BATCH_SIZE);
      for (const outcome of outcomes) {
        log('info', 'dispatch', {
          target: outcome.targetId,
          result: outcome.result,
          detail: outcome.detail,
        });
      }
    } catch (error) {
      // A failed pass must not end the loop. The most likely cause is the
      // database briefly going away during a deploy, and the correct response
      // is to wait and try again rather than exit and be restarted.
      log('error', 'dispatch pass failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Sleep in short slices so a shutdown signal is honoured promptly instead
    // of after a full interval — the platform's grace period is finite.
    const wakeAt = Date.now() + POLL_INTERVAL_MS;
    while (running && Date.now() < wakeAt) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  await sql.end({ timeout: 10 });
  log('info', 'worker stopped');
}

try {
  await main();
} catch (error) {
  log('error', 'worker failed to start', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
}
