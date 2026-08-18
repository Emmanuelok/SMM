import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { shouldUseSsl } from './client.js';

/**
 * Which hosts get TLS.
 *
 * Both directions matter and both are expensive to get wrong: demanding TLS
 * from a private-network database means the service simply cannot connect, and
 * not demanding it from a public one sends credentials in clear text.
 */

test('a public host requires TLS', () => {
  assert.equal(shouldUseSsl('postgres://u:p@db.example.com:5432/app', {}), true);
  assert.equal(shouldUseSsl('postgres://u:p@containers-us-west-1.railway.app:6543/railway', {}), true);
});

test('a private-network host does not', () => {
  // The failure this prevents: Railway's internal Postgres does not terminate
  // TLS, so requiring it fails the pre-deploy migration with a message that
  // says nothing about TLS.
  assert.equal(shouldUseSsl('postgres://u:p@postgres.railway.internal:5432/railway', {}), false);
  assert.equal(shouldUseSsl('postgres://u:p@db.internal:5432/app', {}), false);
  assert.equal(shouldUseSsl('postgres://u:p@postgres.local:5432/app', {}), false);
});

test('local development does not', () => {
  assert.equal(shouldUseSsl('postgres://postgres@localhost:5432/app', {}), false);
  assert.equal(shouldUseSsl('postgres://postgres@127.0.0.1:5432/app', {}), false);
  assert.equal(shouldUseSsl('postgres://postgres@[::1]:5432/app', {}), false);
});

test('the environment overrides in both directions', () => {
  assert.equal(
    shouldUseSsl('postgres://u:p@db.example.com/app', { DATABASE_SSL: 'false' }),
    false,
  );
  // Needed for a private host that does terminate TLS and that the pattern
  // cannot recognise.
  assert.equal(
    shouldUseSsl('postgres://u:p@postgres.railway.internal/app', { DATABASE_SSL: 'true' }),
    true,
  );
});

test('a hostname merely containing a private suffix still requires TLS', () => {
  // "internal.example.com" is a public host whose name happens to start with
  // the word; matching loosely here would silently disable TLS on it.
  assert.equal(shouldUseSsl('postgres://u:p@internal.example.com/app', {}), true);
  assert.equal(shouldUseSsl('postgres://u:p@railway.internal.example.com/app', {}), true);
});
