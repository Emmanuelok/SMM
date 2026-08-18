import type {
  BlueskyCredential,
  Connection,
  CredentialStore,
  MastodonCredential,
  MastodonCredentialStore,
} from '@smm/adapters';
import type { Sql } from '@smm/db';
import { unsafeId, type CredentialId, type OrganizationId } from '@smm/shared';
import { Vault, decodeSealed, encodeSealed } from '@smm/vault';

/**
 * The bridge between adapters, which need a secret for the duration of one
 * call, and the vault, which is the only thing permitted to hold one.
 *
 * This lives in its own package because both the API and the worker need it and
 * neither should own it. It previously lived inside the API, which is why the
 * worker started with an empty adapter registry and would have parked every
 * scheduled post with "no adapter available" even on a perfectly configured
 * deployment.
 *
 * The decrypted value exists only inside the call that asked for it. It is
 * never attached to a `Connection` — which gets serialised into job payloads
 * and log lines — and never cached.
 */
export class CredentialVault {
  readonly #sql: Sql;
  readonly #vault: Vault;

  constructor(sql: Sql, vault: Vault) {
    this.#sql = sql;
    this.#vault = vault;
  }

  /**
   * Seal a secret and return the reference to it.
   *
   * Stored as one JSON document rather than as separate columns: the parts of a
   * credential are useless apart, so keeping them together means there is
   * exactly one thing to encrypt, rotate and destroy.
   */
  async seal(organizationId: OrganizationId, secret: unknown): Promise<CredentialId> {
    const sealed = await this.#vault.seal(JSON.stringify(secret));
    const [row] = await this.#sql<{ id: string }[]>`
      INSERT INTO credentials (organization_id, access_token_enc, key_id, scopes)
      VALUES (${organizationId}, ${encodeSealed(sealed)}, ${sealed.keyId}, ${[]})
      RETURNING id
    `;
    if (row === undefined) throw new Error('Credential insert returned no row');
    return unsafeId<'CredentialId'>(row.id) as CredentialId;
  }

  /**
   * Open the secret behind a connection.
   *
   * The caller supplies a guard, and a credential that decrypts to the wrong
   * shape is rejected rather than handed over. That happens when a row was
   * written by a different network's adapter or an older format, and passing it
   * on would let an adapter misinterpret fields it does not recognise.
   */
  async open<T>(connection: Connection, isValid: (value: unknown) => value is T): Promise<T> {
    const [row] = await this.#sql<{ access_token_enc: Buffer; key_id: string }[]>`
      SELECT access_token_enc, key_id
      FROM credentials
      WHERE id = ${connection.credentialId} AND revoked_at IS NULL
    `;
    if (row === undefined) {
      throw new Error('This connection has no usable credential. It needs reconnecting.');
    }

    const plaintext = await this.#vault.open(decodeSealed(row.access_token_enc, row.key_id));
    const parsed: unknown = JSON.parse(plaintext);
    if (!isValid(parsed)) {
      throw new Error('The stored credential is not in the shape this network expects.');
    }
    return parsed;
  }
}

function hasStrings(value: unknown, keys: readonly string[]): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === 'string' && record[key] !== '');
}

function isBlueskyCredential(value: unknown): value is BlueskyCredential {
  return hasStrings(value, ['identifier', 'appPassword']);
}

function isMastodonCredential(value: unknown): value is MastodonCredential {
  return hasStrings(value, ['instance', 'accessToken']);
}

/** Credential store for the Bluesky adapter. */
export function blueskyCredentials(vault: CredentialVault): CredentialStore {
  return {
    resolve: (connection) => vault.open(connection, isBlueskyCredential),
    store: (organizationId, secret) => vault.seal(organizationId, secret),
  };
}

/** Credential store for the Mastodon adapter. */
export function mastodonCredentials(vault: CredentialVault): MastodonCredentialStore {
  return {
    resolve: (connection) => vault.open(connection, isMastodonCredential),
    store: (organizationId, secret) => vault.seal(organizationId, secret),
  };
}
