import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';

import { hashPassword, needsRehash, verifyPassword, type ScryptParams } from './password.js';
import { generateToken, hashToken, stripPrefix, withPrefix } from './tokens.js';
import { EnvKeyProvider, Vault, decodeSealed, encodeSealed, safeEqual } from './vault.js';

function provider(currentKeyId = 'k1', ids: readonly string[] = ['k1']): EnvKeyProvider {
  const keys = new Map(ids.map((id) => [id, randomBytes(32)]));
  return new EnvKeyProvider(keys, currentKeyId);
}

// Password hashing at the real cost factor is intentionally slow, so the tests
// that exercise it use reduced parameters. The default is checked once,
// separately, so the shipped cost is still covered.
const FAST: ScryptParams = { N: 1024, r: 8, p: 1, keyLength: 64 };

test('a sealed secret round-trips', async () => {
  const vault = new Vault(provider());
  const sealed = await vault.seal('access-token-value');
  assert.equal(await vault.open(sealed), 'access-token-value');
});

test('ciphertext reveals nothing about the plaintext', async () => {
  const vault = new Vault(provider());
  const sealed = await vault.seal('super-secret-token');
  assert.ok(!sealed.ciphertext.toString('utf8').includes('secret'));
  assert.ok(!sealed.ciphertext.toString('base64').includes('super'));
});

test('each seal uses a fresh data key and IV', async () => {
  const vault = new Vault(provider());
  const a = await vault.seal('same');
  const b = await vault.seal('same');
  // Identical plaintext must not produce identical ciphertext, or an observer
  // learns which accounts share a token.
  assert.notEqual(a.ciphertext.toString('base64'), b.ciphertext.toString('base64'));
  assert.notEqual(a.iv.toString('base64'), b.iv.toString('base64'));
  assert.notEqual(a.wrappedKey.toString('base64'), b.wrappedKey.toString('base64'));
});

test('tampered ciphertext is rejected rather than silently decrypted', async () => {
  const vault = new Vault(provider());
  const sealed = await vault.seal('token');
  const corrupted = Buffer.from(sealed.ciphertext);
  corrupted[0] = (corrupted[0] ?? 0) ^ 0xff;

  await assert.rejects(() => vault.open({ ...sealed, ciphertext: corrupted }));
});

test('a tampered authentication tag is rejected', async () => {
  const vault = new Vault(provider());
  const sealed = await vault.seal('token');
  const tag = Buffer.from(sealed.tag);
  tag[0] = (tag[0] ?? 0) ^ 0xff;

  await assert.rejects(() => vault.open({ ...sealed, tag }));
});

test('encoding round-trips through a single column', async () => {
  const vault = new Vault(provider());
  const sealed = await vault.seal('a token with unicode 🔐 and 日本語');

  const encoded = encodeSealed(sealed);
  const decoded = decodeSealed(encoded, sealed.keyId);
  assert.equal(await vault.open(decoded), 'a token with unicode 🔐 and 日本語');
});

test('a truncated stored secret fails loudly', () => {
  const buffer = Buffer.alloc(40);
  buffer.writeUInt8(1, 0);
  buffer.writeUInt32BE(1000, 1); // claims more than the buffer holds
  assert.throws(() => decodeSealed(buffer, 'k1'), /truncated/i);
});

test('rotation re-seals under the new key while old secrets still open', async () => {
  const keys = new Map([
    ['k1', randomBytes(32)],
    ['k2', randomBytes(32)],
  ]);

  const oldVault = new Vault(new EnvKeyProvider(keys, 'k1'));
  const sealed = await oldVault.seal('long-lived-token');
  assert.equal(sealed.keyId, 'k1');

  // After rotation the provider seals under k2 but must still open k1 secrets,
  // or rotation would mean a flag day and an outage.
  const rotated = new Vault(new EnvKeyProvider(keys, 'k2'));
  assert.equal(await rotated.open(sealed), 'long-lived-token');
  assert.equal(rotated.needsRotation(sealed), true);

  const resealed = await rotated.reseal(sealed);
  assert.equal(resealed.keyId, 'k2');
  assert.equal(rotated.needsRotation(resealed), false);
  assert.equal(await rotated.open(resealed), 'long-lived-token');
});

test('a secret sealed under a discarded key reports precisely why it cannot open', async () => {
  const sealedUnderK1 = await new Vault(provider('k1', ['k1'])).seal('token');
  const withoutK1 = new Vault(provider('k2', ['k2']));

  await assert.rejects(
    () => withoutK1.open(sealedUnderK1),
    /not available/i,
    'must name the missing key rather than report a generic decryption failure',
  );
});

test('the key provider refuses to start with bad configuration', () => {
  assert.throws(() => EnvKeyProvider.fromEnv({}), /CREDENTIAL_KEYS is not set/);
  assert.throws(
    () => EnvKeyProvider.fromEnv({ CREDENTIAL_KEYS: 'no-separator' }),
    /Malformed/,
  );
  // A short key must be caught at boot, not on first decrypt.
  assert.throws(
    () => EnvKeyProvider.fromEnv({ CREDENTIAL_KEYS: `k1:${Buffer.alloc(8).toString('base64')}` }),
    /must be 32 bytes/,
  );
  assert.throws(
    () =>
      EnvKeyProvider.fromEnv({
        CREDENTIAL_KEYS: `k1:${randomBytes(32).toString('base64')}`,
        CREDENTIAL_CURRENT_KEY: 'k9',
      }),
    /not among the provided keys/,
  );
});

test('a valid environment configuration starts', async () => {
  const env = {
    CREDENTIAL_KEYS: `k1:${randomBytes(32).toString('base64')},k2:${randomBytes(32).toString('base64')}`,
    CREDENTIAL_CURRENT_KEY: 'k2',
  };
  const vault = new Vault(EnvKeyProvider.fromEnv(env));
  assert.equal(await vault.open(await vault.seal('ok')), 'ok');
});

// --- passwords --------------------------------------------------------------

test('a password verifies against its own hash', async () => {
  const hash = await hashPassword('correct horse battery staple', FAST);
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
});

test('the same password hashes differently each time', async () => {
  const a = await hashPassword('same', FAST);
  const b = await hashPassword('same', FAST);
  assert.notEqual(a, b, 'a missing salt would make identical passwords visible');
  assert.equal(await verifyPassword('same', a), true);
  assert.equal(await verifyPassword('same', b), true);
});

test('the default cost is applied when no parameters are given', async () => {
  const hash = await hashPassword('default-cost-check');
  assert.match(hash, /^scrypt\$65536\$8\$1\$64\$/);
  assert.equal(await verifyPassword('default-cost-check', hash), true);
});

test('unicode passwords normalise so the same typing always works', async () => {
  // The same character composed two ways must not lock a user out.
  const composed = 'café';
  const decomposed = 'café';
  const hash = await hashPassword(composed, FAST);
  assert.equal(await verifyPassword(decomposed, hash), true);
});

test('a malformed stored hash is a failed login, not a crash or a bypass', async () => {
  for (const bad of ['', 'garbage', 'scrypt$1$2$3', 'bcrypt$a$b$c$d$e$f', 'scrypt$x$y$z$w$q$r']) {
    assert.equal(await verifyPassword('anything', bad), false, `should reject: ${bad}`);
  }
});

test('an absurd cost claim in a stored hash cannot be used to stall a login', async () => {
  const hostile = `scrypt$${1 << 25}$99$99$64$${Buffer.from('salt').toString('base64url')}$${Buffer.from('x').toString('base64url')}`;
  assert.equal(await verifyPassword('anything', hostile), false);
});

test('weaker stored parameters are flagged for upgrade on next login', async () => {
  assert.equal(needsRehash(await hashPassword('p', FAST)), true);
  assert.equal(needsRehash(await hashPassword('p')), false);
  assert.equal(needsRehash('not-a-hash'), true);
});

// --- tokens -----------------------------------------------------------------

test('generated tokens are unique and their hash matches', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const { token, hash } = generateToken();
    assert.equal(seen.has(token), false, 'tokens must not repeat');
    seen.add(token);
    assert.equal(hashToken(token), hash);
    // Must be URL-safe: these travel in links sent by email.
    assert.match(token, /^[A-Za-z0-9_-]+$/);
  }
});

test('the stored hash does not reveal the token', () => {
  const { token, hash } = generateToken();
  assert.notEqual(token, hash);
  assert.ok(!hash.includes(token));
});

test('prefixes survive a round-trip even when both sides contain underscores', () => {
  // The failure this pins: base64url tokens contain underscores and so do
  // readable prefixes, so an underscore separator silently returns a corrupted
  // token that then never matches a stored hash.
  const { token } = generateToken();
  const prefixed = withPrefix('smm_sess', token);
  assert.ok(prefixed.startsWith('smm_sess.'));
  assert.equal(stripPrefix(prefixed), token);
  assert.equal(stripPrefix('no-prefix-here'), 'no-prefix-here');

  // Exercised against a token known to contain an underscore.
  const underscored = 'aa_bb-cc_dd';
  assert.equal(stripPrefix(withPrefix('smm_sess', underscored)), underscored);

  // A prefix containing the separator is rejected rather than silently wrong.
  assert.throws(() => withPrefix('bad.prefix', token), /must not contain/);
});

test('constant-time comparison still compares correctly', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual('', ''), true);
});
