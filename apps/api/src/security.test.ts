import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { loadConfig } from './config.js';

/**
 * Regressions for defects found by adversarial security review.
 *
 * Both were confirmed by tracing a working exploit against this code, not by
 * inspection, so each test names the attack it prevents.
 */

const BASE_ENV = {
  DATABASE_URL: 'postgres://u:p@db.example.com/app',
  CREDENTIAL_KEYS: 'k1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

test('proxy trust is a hop count, never a boolean', () => {
  // The defect: `trustProxy: true` makes Fastify trust the whole
  // X-Forwarded-For chain and take its LEFTMOST entry as the client address. A
  // proxy appends to that header, so the leftmost entry is whatever the client
  // wrote — request.ip becomes attacker-controlled, and every rate limit and
  // per-IP throttle keyed on it stops working. Sending a different value each
  // request lands every attempt in a fresh bucket.
  const result = loadConfig(BASE_ENV);
  assert.ok(result.ok);

  const hops: unknown = result.config.TRUST_PROXY_HOPS;
  assert.equal(typeof hops, 'number', 'a boolean here hands request.ip to the client');
  assert.equal(hops, 1, 'one proxy is what Railway, Render and Fly each put in front');
});

test('the proxy hop count can be turned off and tuned', () => {
  // Zero is correct with nothing trusted in front; the header is then ignored
  // entirely rather than believed.
  const off = loadConfig({ ...BASE_ENV, TRUST_PROXY_HOPS: '0' });
  assert.ok(off.ok);
  assert.equal(off.config.TRUST_PROXY_HOPS, 0);

  const two = loadConfig({ ...BASE_ENV, TRUST_PROXY_HOPS: '2' });
  assert.ok(two.ok);
  assert.equal(two.config.TRUST_PROXY_HOPS, 2);
});

test('a nonsensical hop count is rejected rather than coerced', () => {
  for (const value of ['-1', 'true', 'yes', '99']) {
    const result = loadConfig({ ...BASE_ENV, TRUST_PROXY_HOPS: value });
    assert.equal(result.ok, false, `${value} must not be accepted`);
  }
});

test('the config no longer exposes a boolean proxy switch', () => {
  // Named explicitly: reintroducing TRUST_PROXY as a boolean would silently
  // restore the vulnerability, and the variable name is the tell.
  const result = loadConfig({ ...BASE_ENV, TRUST_PROXY: 'true' });
  assert.ok(result.ok);
  assert.equal(
    (result.config as Record<string, unknown>)['TRUST_PROXY'],
    undefined,
    'a boolean proxy setting must not exist',
  );
});
