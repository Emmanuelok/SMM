import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Envelope encryption for third-party credentials.
 *
 * Every OAuth token we hold belongs to somebody else's account. A breach here
 * is not "our users' data leaked" — it is write access to thousands of brands'
 * social presences, which is a materially worse outcome than most SaaS
 * breaches and deserves more than a column and a hope.
 *
 * Envelope encryption means the database never holds anything decryptable on
 * its own. Each secret is sealed with a freshly generated data key; that data
 * key is itself sealed with a root key held outside the database. Stealing a
 * dump yields ciphertext and wrapped keys and nothing else.
 *
 * The `KeyProvider` seam is the entire point of this module. Today the root key
 * comes from an environment variable, which is honest for a platform without a
 * managed KMS. That is a real weakness — an environment variable cannot be
 * rotated without a redeploy, cannot be audited, and is visible to anyone with
 * dashboard access. It is survivable at launch and is not survivable at the
 * first security review, so the swap to a managed KMS has to be a provider
 * change rather than a migration of every stored token. Hence this interface,
 * built before there is a single credential to protect: it is cheap now and
 * expensive once the table is full.
 */

/** Wraps and unwraps data keys. The root key never leaves an implementation. */
export interface KeyProvider {
  /** Stable identifier for the root key in force, recorded with each secret. */
  readonly keyId: string;
  /** Seal a freshly generated data key. */
  wrap(dataKey: Buffer): Promise<Buffer>;
  /**
   * Unseal a data key.
   *
   * Takes the id the secret was sealed under, because a rotated provider must
   * still open secrets written under the previous root key.
   */
  unwrap(wrapped: Buffer, keyId: string): Promise<Buffer>;
}

/**
 * A sealed secret, as stored.
 *
 * Self-describing on purpose: everything needed to open it, except the root
 * key, travels with it. A ciphertext whose parameters live somewhere else
 * becomes unreadable the moment that somewhere else is edited.
 */
export interface SealedSecret {
  /** Format version, so the scheme can change without stranding stored data. */
  readonly v: 1;
  /** Which root key sealed the data key. */
  readonly keyId: string;
  /** The data key, sealed by the root key. */
  readonly wrappedKey: Buffer;
  readonly iv: Buffer;
  readonly ciphertext: Buffer;
  /** GCM authentication tag — detects tampering as well as corruption. */
  readonly tag: Buffer;
}

const ALGORITHM = 'aes-256-gcm';
const DATA_KEY_BYTES = 32;
const IV_BYTES = 12;

export class Vault {
  readonly #keys: KeyProvider;

  constructor(keys: KeyProvider) {
    this.#keys = keys;
  }

  /**
   * Seal a secret.
   *
   * A new data key per secret, deliberately. Reusing one key across every token
   * would make a single key compromise total; per-secret keys also mean a
   * future per-tenant provider can be dropped in without re-encrypting anything
   * that already exists.
   */
  async seal(plaintext: string): Promise<SealedSecret> {
    const dataKey = randomBytes(DATA_KEY_BYTES);
    const iv = randomBytes(IV_BYTES);

    const cipher = createCipheriv(ALGORITHM, dataKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const wrappedKey = await this.#keys.wrap(dataKey);
    // The data key has served its purpose; leaving it in memory extends the
    // window in which a heap dump is worth stealing.
    dataKey.fill(0);

    return { v: 1, keyId: this.#keys.keyId, wrappedKey, iv, ciphertext, tag };
  }

  /** Open a sealed secret. Throws if it was tampered with or the key is wrong. */
  async open(secret: SealedSecret): Promise<string> {
    if (secret.v !== 1) {
      throw new Error(`Unsupported sealed secret version: ${String(secret.v)}`);
    }

    const dataKey = await this.#keys.unwrap(secret.wrappedKey, secret.keyId);
    try {
      const decipher = createDecipheriv(ALGORITHM, dataKey, secret.iv);
      decipher.setAuthTag(secret.tag);
      return Buffer.concat([
        decipher.update(secret.ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } finally {
      dataKey.fill(0);
    }
  }

  /** Whether a secret was sealed under a key that is no longer current. */
  needsRotation(secret: SealedSecret): boolean {
    return secret.keyId !== this.#keys.keyId;
  }

  /**
   * Re-seal under the current root key.
   *
   * Rotation is only real if old secrets are actually moved. A provider that
   * can decrypt under the old key indefinitely is a provider that never
   * finished rotating.
   */
  async reseal(secret: SealedSecret): Promise<SealedSecret> {
    return this.seal(await this.open(secret));
  }
}

/**
 * Encode a sealed secret for a single `bytea` column.
 *
 * One column rather than five keeps the ciphertext and the parameters needed to
 * read it inseparable — they cannot be partially copied, partially restored, or
 * partially migrated.
 *
 * Layout: version, then each field length-prefixed as a big-endian uint32.
 */
export function encodeSealed(secret: SealedSecret): Buffer {
  const parts = [secret.wrappedKey, secret.iv, secret.tag, secret.ciphertext];
  const header = Buffer.alloc(1 + 4 * parts.length);
  header.writeUInt8(secret.v, 0);
  parts.forEach((part, i) => header.writeUInt32BE(part.length, 1 + i * 4));
  return Buffer.concat([header, ...parts]);
}

export function decodeSealed(buffer: Buffer, keyId: string): SealedSecret {
  const version = buffer.readUInt8(0);
  if (version !== 1) throw new Error(`Unsupported sealed secret version: ${version}`);

  const lengths = [0, 1, 2, 3].map((i) => buffer.readUInt32BE(1 + i * 4));
  let offset = 1 + 4 * lengths.length;
  const fields = lengths.map((length) => {
    const slice = buffer.subarray(offset, offset + length);
    if (slice.length !== length) {
      throw new Error('Sealed secret is truncated');
    }
    offset += length;
    return slice;
  });

  const [wrappedKey, iv, tag, ciphertext] = fields;
  if (
    wrappedKey === undefined ||
    iv === undefined ||
    tag === undefined ||
    ciphertext === undefined
  ) {
    throw new Error('Sealed secret is malformed');
  }
  return { v: 1, keyId, wrappedKey, iv, ciphertext, tag };
}

/**
 * Root keys from the environment.
 *
 * The starting position, and explicitly a compromise. It supports more than one
 * key so that rotation is possible at all: the newest is used for sealing while
 * older ones stay available to open existing secrets, which is what lets a
 * rotation proceed gradually instead of as a flag day.
 *
 * Wrapping uses AES-256-GCM rather than a key-wrap mode so that a tampered
 * wrapped key fails loudly instead of yielding a plausible wrong key and a
 * confusing downstream error.
 */
export class EnvKeyProvider implements KeyProvider {
  readonly #keys: ReadonlyMap<string, Buffer>;
  readonly keyId: string;

  /**
   * @param keys Root keys by id, each 32 bytes.
   * @param currentKeyId The key new secrets are sealed under.
   */
  constructor(keys: ReadonlyMap<string, Buffer>, currentKeyId: string) {
    const current = keys.get(currentKeyId);
    if (current === undefined) {
      throw new Error(`Current key "${currentKeyId}" is not among the provided keys`);
    }
    for (const [id, key] of keys) {
      if (key.length !== DATA_KEY_BYTES) {
        throw new Error(`Root key "${id}" must be ${DATA_KEY_BYTES} bytes, got ${key.length}`);
      }
    }
    this.#keys = keys;
    this.keyId = currentKeyId;
  }

  /**
   * Build from `CREDENTIAL_KEYS`, formatted as `id:base64,id:base64`, and
   * `CREDENTIAL_CURRENT_KEY`.
   *
   * Fails at startup rather than at first use. A service that boots healthy and
   * cannot decrypt anything is far worse than one that refuses to boot: the
   * first is discovered when a customer's post fails.
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): EnvKeyProvider {
    const raw = env['CREDENTIAL_KEYS'];
    if (raw === undefined || raw.trim() === '') {
      throw new Error(
        'CREDENTIAL_KEYS is not set. Generate one with: ' +
          'node -e "console.log(\'k1:\' + require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      );
    }

    const keys = new Map<string, Buffer>();
    for (const entry of raw.split(',')) {
      const separator = entry.indexOf(':');
      if (separator === -1) {
        throw new Error(`Malformed CREDENTIAL_KEYS entry: expected "id:base64"`);
      }
      const id = entry.slice(0, separator).trim();
      const material = Buffer.from(entry.slice(separator + 1).trim(), 'base64');
      if (id === '') throw new Error('CREDENTIAL_KEYS contains an entry with an empty id');
      keys.set(id, material);
    }

    const currentKeyId = env['CREDENTIAL_CURRENT_KEY'] ?? [...keys.keys()].at(-1);
    if (currentKeyId === undefined) {
      throw new Error('CREDENTIAL_KEYS is empty');
    }
    return new EnvKeyProvider(keys, currentKeyId);
  }

  async wrap(dataKey: Buffer): Promise<Buffer> {
    const root = this.#keys.get(this.keyId);
    if (root === undefined) throw new Error(`Root key "${this.keyId}" is unavailable`);

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, root, iv);
    const sealed = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), sealed]);
  }

  async unwrap(wrapped: Buffer, keyId: string): Promise<Buffer> {
    const root = this.#keys.get(keyId);
    if (root === undefined) {
      // A key that has been removed from the environment while secrets sealed
      // under it remain is unrecoverable, so say so precisely rather than
      // letting it surface as a decryption failure.
      throw new Error(
        `Root key "${keyId}" is not available; secrets sealed under it cannot be opened`,
      );
    }

    const iv = wrapped.subarray(0, IV_BYTES);
    const tag = wrapped.subarray(IV_BYTES, IV_BYTES + 16);
    const ciphertext = wrapped.subarray(IV_BYTES + 16);

    const decipher = createDecipheriv(ALGORITHM, root, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}

/** Constant-time comparison, for tokens and hashes reached by untrusted input. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  // Length is not secret, but comparing different-length buffers throws, and a
  // short-circuit on length is not a meaningful leak for fixed-width digests.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
