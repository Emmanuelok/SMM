import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { unsafeId } from '@smm/shared';

import type { Connection } from '../connection.js';
import { MASTODON } from '../registry.js';
import { MastodonAdapter, normalizeInstance, type MastodonCredential } from './mastodon.js';

/**
 * Mastodon is the adapter that proves the contract generalises: its limits are
 * per server rather than per network, and there is no central app to register
 * against. Both of those are tested here because both were assumptions the
 * contract had to accommodate rather than features of Bluesky.
 */

function connection(): Connection {
  return {
    id: unsafeId('mastodon1'),
    organizationId: unsafeId('org00001'),
    network: 'mastodon',
    profileId: unsafeId('profile1'),
    credentialId: unsafeId('cred0001'),
    kind: 'oauth2_dynamic',
    app: { kind: 'shared', appId: unsafeId('sharedapp') },
    account: { id: unsafeId('acct0001'), displayName: 'Test' },
    scopes: ['read', 'write'],
    grantedAt: new Date(),
  } as Connection;
}

/**
 * A literal public address rather than a hostname.
 *
 * The adapter now resolves the server before contacting it, so a made-up
 * hostname would fail DNS and the test would exercise the fallback instead of
 * what it is about. A literal address needs no lookup, keeping the test
 * hermetic while still passing through the real guard.
 */
const CREDENTIAL: MastodonCredential = {
  instance: 'https://93.184.216.34',
  accessToken: 'token',
};

function adapterWith(instancePayload: unknown): MastodonAdapter {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(instancePayload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
  // Restored by the test runner between files; each test sets its own.
  void original;

  return new MastodonAdapter({
    resolve: async () => CREDENTIAL,
    store: async () => unsafeId('cred0001'),
  });
}

test('a typed server name becomes an origin', () => {
  // Every one of these is something a real person types or pastes.
  assert.equal(normalizeInstance('mastodon.social'), 'https://mastodon.social');
  assert.equal(normalizeInstance('https://mastodon.social'), 'https://mastodon.social');
  assert.equal(normalizeInstance('https://mastodon.social/'), 'https://mastodon.social');
  assert.equal(normalizeInstance('  mastodon.social  '), 'https://mastodon.social');
  assert.equal(normalizeInstance('https://mastodon.social/@someone'), 'https://mastodon.social');
  // A full fediverse handle: only the server part is the origin.
  assert.equal(normalizeInstance('@someone@mastodon.social'), 'https://mastodon.social');
  // A non-standard port is part of the origin and must survive.
  assert.equal(normalizeInstance('https://social.example.com:8443'), 'https://social.example.com:8443');
});

test('capabilities without a connection are the conservative defaults', async () => {
  const adapter = new MastodonAdapter({
    resolve: async () => CREDENTIAL,
    store: async () => unsafeId('cred0001'),
  });
  const caps = await adapter.capabilities();
  assert.equal(caps.formats[0]?.text.maxLength, 500);
});

test("capabilities follow the server's own limit, not the default", async () => {
  // The point of the whole exercise: a 5,000-character server must not have its
  // posts refused at 500 by a descriptor that describes a different server.
  const adapter = adapterWith({
    configuration: { statuses: { max_characters: 5000, max_media_attachments: 8 } },
  });

  const caps = await adapter.capabilities(connection());
  assert.equal(caps.formats[0]?.text.maxLength, 5000);

  const image = caps.formats.find((f) => f.format === 'image');
  assert.equal(image?.media.maxCount, 8);
});

test('a text-only format keeps zero attachments even when the server allows many', async () => {
  // Raising maxCount from 0 would make a text post claim it can carry media.
  const adapter = adapterWith({
    configuration: { statuses: { max_characters: 500, max_media_attachments: 8 } },
  });
  const caps = await adapter.capabilities(connection());
  assert.equal(caps.formats.find((f) => f.format === 'text')?.media.maxCount, 0);
});

test('an unreachable server falls back to the defaults rather than failing', async () => {
  globalThis.fetch = (async () => {
    throw new Error('fetch failed');
  }) as typeof fetch;

  const adapter = new MastodonAdapter({
    resolve: async () => CREDENTIAL,
    store: async () => unsafeId('cred0001'),
  });

  // Guessing low only refuses content the server would have accepted; guessing
  // high produces posts it rejects. The cheaper error is the right default.
  const caps = await adapter.capabilities(connection());
  assert.equal(caps.formats[0]?.text.maxLength, MASTODON.formats[0]?.text.maxLength);
});

test('connect asks which server before it can redirect anywhere', async () => {
  const adapter = new MastodonAdapter({
    resolve: async () => CREDENTIAL,
    store: async () => unsafeId('cred0001'),
  });

  // There is no central app registration, so the client id does not exist until
  // it has been created on a specific server — the first call cannot redirect.
  const start = await adapter.beginAuth({
    network: 'mastodon',
    organizationId: unsafeId('org00001'),
    app: { kind: 'shared', appId: unsafeId('sharedapp') },
    requestedScopes: [],
    redirectUri: 'https://app.example.com/callback',
    state: 'xyz',
  });

  assert.ok('instructions' in start);
  assert.equal(start.instructions[0]?.kind, 'collect_input');
});

test('classify maps the server responses that mean different things', async () => {
  const adapter = new MastodonAdapter({
    resolve: async () => CREDENTIAL,
    store: async () => unsafeId('cred0001'),
  });

  assert.equal(adapter.classify({ status: 401 }).kind, 'auth_expired');
  assert.equal(adapter.classify({ status: 403 }).kind, 'permission_denied');
  assert.equal(adapter.classify({ status: 429 }).kind, 'rate_limited');
  // 422 is what a server returns for a status over its own limit.
  assert.equal(adapter.classify({ status: 422 }).kind, 'content_rejected');
  assert.equal(adapter.classify({ status: 404 }).kind, 'destination_gone');
  assert.equal(adapter.classify({ status: 503 }).kind, 'platform_unavailable');
  assert.equal(adapter.classify(new Error('fetch failed')).kind, 'transient');

  // A rate limit must carry a wait, or the retry policy has nothing to honour.
  assert.ok((adapter.classify({ status: 429 }).retryAfterMs ?? 0) > 0);
});
