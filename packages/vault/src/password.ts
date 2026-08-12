import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/**
 * Password hashing with scrypt.
 *
 * scrypt rather than argon2 because it ships in Node's standard library.
 * Argon2id is the better algorithm on paper, but every implementation is a
 * native module, and a native build failure on a deploy platform is a very
 * expensive way to discover a dependency. scrypt is memory-hard, well
 * understood, and specifically recommended for password storage — the gap
 * between it and argon2id is far smaller than the gap between either and a
 * deployment that will not build.
 *
 * Parameters are stored with each hash rather than fixed in code. Hardware gets
 * faster, the cost factor has to rise, and a hash that does not record what it
 * used cannot be verified after that change without locking everyone out.
 */

/**
 * Promise wrapper written out rather than produced by `promisify`, whose types
 * resolve to the overload without an options argument — and the options are
 * where the cost parameters live.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export interface ScryptParams {
  /** CPU/memory cost. Must be a power of two. */
  readonly N: number;
  /** Block size. */
  readonly r: number;
  /** Parallelisation. */
  readonly p: number;
  readonly keyLength: number;
}

/**
 * Current cost.
 *
 * N=2^16 with r=8 needs roughly 64 MB per hash. That is deliberately
 * uncomfortable: it is the number that makes offline cracking of a stolen table
 * expensive, and it is only paid on login. Raising it later is safe — old
 * hashes carry their own parameters and are upgraded on next successful login.
 */
export const DEFAULT_PARAMS: ScryptParams = {
  N: 65_536,
  r: 8,
  p: 1,
  keyLength: 64,
};

// Node's scrypt refuses to allocate beyond a default ceiling well below what
// N=65536, r=8 needs, so the budget is stated explicitly.
const MAX_MEMORY = 256 * 1024 * 1024;

const SALT_BYTES = 16;

/**
 * Hash a password.
 *
 * Encoded as `scrypt$N$r$p$keyLength$salt$hash`, base64url for the binary
 * fields. Self-describing so verification never has to guess, and greppable so
 * an operator can tell at a glance which hashes are due for an upgrade.
 */
export async function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password.normalize('NFKC'), salt, params.keyLength, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: MAX_MEMORY,
  });

  return [
    'scrypt',
    params.N,
    params.r,
    params.p,
    params.keyLength,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

/**
 * Verify a password against a stored hash.
 *
 * Returns false rather than throwing on a malformed hash. A corrupt row must
 * not become an authentication bypass, and it must not crash the login path
 * either — the correct outcome for "we cannot verify this" is "not verified".
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 7 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const keyLength = Number(parts[4]);
  const saltPart = parts[5];
  const hashPart = parts[6];

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    !Number.isInteger(keyLength) ||
    saltPart === undefined ||
    hashPart === undefined
  ) {
    return false;
  }

  // A hash claiming absurd parameters would otherwise let a poisoned row turn
  // one login attempt into a denial of service.
  if (N > 1 << 20 || r > 32 || p > 16 || keyLength > 128) return false;

  try {
    const salt = Buffer.from(saltPart, 'base64url');
    const expected = Buffer.from(hashPart, 'base64url');
    const derived = await scrypt(password.normalize('NFKC'), salt, keyLength, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Whether a stored hash was made with weaker parameters than current policy.
 *
 * Checked on successful login, where the plaintext is briefly available and the
 * hash can be upgraded without involving the user. Skipping this leaves hashes
 * at whatever cost was adequate on the day the account was created.
 */
export function needsRehash(stored: string, params: ScryptParams = DEFAULT_PARAMS): boolean {
  const parts = stored.split('$');
  if (parts.length !== 7 || parts[0] !== 'scrypt') return true;
  return (
    Number(parts[1]) < params.N ||
    Number(parts[2]) < params.r ||
    Number(parts[4]) < params.keyLength
  );
}
