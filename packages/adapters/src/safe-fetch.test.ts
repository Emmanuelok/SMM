import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { BlockedHostError, checkHost, isBlockedAddress, safeFetch } from './safe-fetch.js';

/**
 * The Mastodon server address is typed by the user and fetched by the server,
 * so every one of these is an address an attacker can ask us to contact.
 */

test('cloud metadata is refused', () => {
  // The single highest-value SSRF target: unauthenticated, hands out instance
  // credentials to anything that asks from inside the machine.
  assert.equal(isBlockedAddress('169.254.169.254'), true);
  assert.equal(isBlockedAddress('169.254.0.1'), true);
});

test('loopback and private ranges are refused', () => {
  for (const address of [
    '127.0.0.1',
    '127.1.2.3',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '0.0.0.0',
    '100.64.0.1',
  ]) {
    assert.equal(isBlockedAddress(address), true, `${address} must be refused`);
  }
});

test('addresses just outside the private ranges are allowed', () => {
  // A mask computed wrongly by one bit blocks real public hosts, which is a
  // silent outage rather than a security failure — so both edges are checked.
  for (const address of ['9.255.255.255', '11.0.0.1', '172.15.255.255', '172.32.0.1', '192.167.255.255', '192.169.0.1']) {
    assert.equal(isBlockedAddress(address), false, `${address} must be allowed`);
  }
});

test('IPv4-mapped IPv6 does not smuggle a private address through', () => {
  // Checking this as opaque IPv6 text is exactly how metadata gets reached.
  assert.equal(isBlockedAddress('::ffff:169.254.169.254'), true);
  assert.equal(isBlockedAddress('::ffff:127.0.0.1'), true);
  assert.equal(isBlockedAddress('::ffff:10.0.0.1'), true);
  // The same form carrying a public address is still fine.
  assert.equal(isBlockedAddress('::ffff:93.184.216.34'), false);
});

test('IPv6 loopback and local ranges are refused', () => {
  assert.equal(isBlockedAddress('::1'), true);
  assert.equal(isBlockedAddress('::'), true);
  assert.equal(isBlockedAddress('fc00::1'), true);
  assert.equal(isBlockedAddress('fd12:3456::1'), true);
  assert.equal(isBlockedAddress('fe80::1'), true);
  assert.equal(isBlockedAddress('2606:4700:4700::1111'), false);
});

test('anything unclassifiable is refused rather than allowed', () => {
  // Failing closed: a string we cannot parse is not a string we will contact.
  assert.equal(isBlockedAddress('not-an-address'), true);
  assert.equal(isBlockedAddress(''), true);
  assert.equal(isBlockedAddress('999.999.999.999'), true);
});

test('a literal private address as the hostname is refused without resolution', async () => {
  const check = await checkHost('127.0.0.1');
  assert.equal(check.ok, false);
  assert.ok(!check.ok && /not a public address/.test(check.reason));
});

test('a private hostname on the platform network is refused', async () => {
  // localhost resolves to loopback, which is the same class of target as a
  // managed platform's postgres.railway.internal.
  const check = await checkHost('localhost');
  assert.equal(check.ok, false);
});

test('an empty host is refused', async () => {
  assert.equal((await checkHost('')).ok, false);
});

test('safeFetch refuses a non-HTTP protocol', async () => {
  // file: and similar would read local resources rather than make a request.
  await assert.rejects(
    () => safeFetch('file:///etc/passwd'),
    BlockedHostError,
  );
});

test('safeFetch refuses a private destination before making the request', async () => {
  // Nothing listens on this port; a BlockedHostError rather than a connection
  // error proves the check ran first and no request left the process.
  await assert.rejects(
    () => safeFetch('http://127.0.0.1:59999/'),
    (error: unknown) => error instanceof BlockedHostError,
  );
});

test('safeFetch refuses the metadata service', async () => {
  await assert.rejects(
    () => safeFetch('http://169.254.169.254/latest/meta-data/'),
    (error: unknown) => error instanceof BlockedHostError,
  );
});
