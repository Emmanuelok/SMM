import type { BlueskyCredential, Connection, CredentialStore } from '@smm/adapters';
import type { Sql } from '@smm/db';
import { unsafeId, type CredentialId, type OrganizationId } from '@smm/shared';
import { Vault, decodeSealed, encodeSealed } from '@smm/vault';

/**
 * The credential store adapters are handed.
 *
 * Sits between the adapter, which needs a secret for the duration of one call,
 * and the vault, which is the only thing that may hold one. Adapters never see
 * the vault and never see a key: they receive an object that answers "give me
 * the secret behind this connection" and nothing more.
 *
 * The decrypted value exists only inside the call that asked for it. It is
 * never attached to a Connection, which is serialised into job payloads and
 * logs, and never cached, so the window in which a heap dump is worth stealing
 * is as short as it can be.
 */
export class VaultCredentialStore implements CredentialStore {
  readonly #sql: Sql;
  readonly #vault: Vault;

  constructor(sql: Sql, vault: Vault) {
    this.#sql = sql;
    this.#vault = vault;
  }

  async resolve(connection: Connection): Promise<BlueskyCredential> {
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
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as BlueskyCredential).identifier !== 'string' ||
      typeof (parsed as BlueskyCredential).appPassword !== 'string'
    ) {
      // A credential that decrypts to the wrong shape means the row was written
      // by a different version or a different network's adapter. Failing here
      // is better than handing an adapter something it will misinterpret.
      throw new Error('Stored credential is not in the expected format.');
    }
    return parsed as BlueskyCredential;
  }

  async store(organizationId: OrganizationId, secret: BlueskyCredential): Promise<CredentialId> {
    // Sealed as one JSON document rather than as separate columns: the two
    // halves are useless apart, and keeping them together means there is only
    // one thing to encrypt, rotate and destroy.
    const sealed = await this.#vault.seal(JSON.stringify(secret));

    const [row] = await this.#sql<{ id: string }[]>`
      INSERT INTO credentials (organization_id, access_token_enc, key_id, scopes)
      VALUES (${organizationId}, ${encodeSealed(sealed)}, ${sealed.keyId}, ${[]})
      RETURNING id
    `;
    if (row === undefined) throw new Error('Credential insert returned no row');
    return unsafeId<'CredentialId'>(row.id) as CredentialId;
  }
}
