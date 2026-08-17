import type { Connection } from '@smm/adapters';
import { CredentialVault } from '@smm/credentials';
import type { Sql } from '@smm/db';
import { unsafeId, type OrganizationId, type UserId } from '@smm/shared';
import { Vault, decodeSealed, encodeSealed, generateToken, hashToken } from '@smm/vault';

/**
 * State for an OAuth authorisation that is in flight.
 *
 * A redirect leaves our control and returns as an unauthenticated GET from a
 * third party. Two things follow, and both are the source of well-known
 * vulnerabilities when skipped.
 *
 * The `state` parameter is the only thing tying the response to a request we
 * made. Without checking it, anyone can send a victim a callback URL carrying
 * *their own* authorisation code and silently attach their account to the
 * victim's workspace — after which everything the victim posts goes to an
 * account the attacker controls. So state is minted from a CSPRNG, stored as a
 * hash, single-use, short-lived, and bound to the organisation that began the
 * flow.
 *
 * Nothing else in the callback is trusted either. The organisation, brand and
 * server all come from this row rather than from the query string.
 */

const STATE_TTL_MS = 10 * 60_000;

export interface PendingAuth {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly profileGroupId: string;
  readonly network: string;
  readonly instance?: string | undefined;
  readonly clientId?: string | undefined;
  readonly clientSecret?: string | undefined;
  readonly redirectUri: string;
}

export type ConsumeResult =
  | { readonly ok: true; readonly pending: PendingAuth }
  | {
      readonly ok: false;
      readonly reason: 'unknown' | 'expired' | 'already_used' | 'wrong_organization';
    };

export class OAuthStateStore {
  readonly #sql: Sql;
  readonly #vault: Vault;

  constructor(sql: Sql, vault: Vault) {
    this.#sql = sql;
    this.#vault = vault;
  }

  /** Begin a flow, returning the state value to put in the authorise URL. */
  async begin(pending: PendingAuth): Promise<string> {
    const { token, hash } = generateToken();

    const sealed =
      pending.clientSecret === undefined
        ? undefined
        : await this.#vault.seal(pending.clientSecret);

    await this.#sql`
      INSERT INTO oauth_states (
        state_hash, organization_id, user_id, profile_group_id,
        network, instance, client_id, client_secret_enc, key_id,
        redirect_uri, expires_at
      )
      VALUES (
        ${hash}, ${pending.organizationId}, ${pending.userId}, ${pending.profileGroupId},
        ${pending.network}, ${pending.instance ?? null}, ${pending.clientId ?? null},
        ${sealed === undefined ? null : encodeSealed(sealed)},
        ${sealed?.keyId ?? null},
        ${pending.redirectUri}, ${new Date(Date.now() + STATE_TTL_MS)}
      )
    `;

    return token;
  }

  /**
   * Redeem a state value exactly once.
   *
   * The organisation is checked against the session that arrives with the
   * callback. A mismatch is the attack this parameter exists to stop: a
   * callback carrying someone else's code, opened by a logged-in victim, would
   * otherwise attach the attacker's account to the victim's workspace.
   */
  async consume(state: string, organizationId: OrganizationId): Promise<ConsumeResult> {
    const hash = hashToken(state);

    // Claimed in one statement so two simultaneous callbacks cannot both
    // succeed: the second matches no row because the first already set
    // consumed_at.
    const [row] = await this.#sql<
      {
        organization_id: string;
        user_id: string | null;
        profile_group_id: string;
        network: string;
        instance: string | null;
        client_id: string | null;
        client_secret_enc: Buffer | null;
        key_id: string | null;
        redirect_uri: string;
        expires_at: Date;
        was_consumed: boolean;
      }[]
    >`
      UPDATE oauth_states
      SET consumed_at = now()
      WHERE state_hash = ${hash} AND consumed_at IS NULL
      RETURNING organization_id, user_id, profile_group_id, network, instance,
                client_id, client_secret_enc, key_id, redirect_uri, expires_at,
                false AS was_consumed
    `;

    if (row === undefined) {
      // Either it never existed or it has already been redeemed. Distinguished
      // so a double-click reads as "already connected" rather than as an
      // attack, while a forged value still gets nothing.
      const [seen] = await this.#sql<{ state_hash: string }[]>`
        SELECT state_hash FROM oauth_states WHERE state_hash = ${hash}
      `;
      return { ok: false, reason: seen === undefined ? 'unknown' : 'already_used' };
    }

    if (row.expires_at.getTime() < Date.now()) {
      return { ok: false, reason: 'expired' };
    }

    if (row.organization_id !== organizationId) {
      return { ok: false, reason: 'wrong_organization' };
    }

    const clientSecret =
      row.client_secret_enc === null || row.key_id === null
        ? undefined
        : await this.#vault.open(decodeSealed(row.client_secret_enc, row.key_id));

    return {
      ok: true,
      pending: {
        organizationId: unsafeId<'OrganizationId'>(row.organization_id) as OrganizationId,
        userId: unsafeId<'UserId'>(row.user_id ?? '') as UserId,
        profileGroupId: row.profile_group_id,
        network: row.network,
        instance: row.instance ?? undefined,
        clientId: row.client_id ?? undefined,
        clientSecret,
        redirectUri: row.redirect_uri,
      },
    };
  }

  /**
   * Remove states that were never completed.
   *
   * Most are: a consent screen is abandoned far more often than it is finished.
   */
  async sweepExpired(): Promise<number> {
    const rows = await this.#sql<{ state_hash: string }[]>`
      DELETE FROM oauth_states
      WHERE expires_at < now() - interval '1 day'
      RETURNING state_hash
    `;
    return rows.length;
  }
}

/**
 * Persist a connected account.
 *
 * Shared by every network, because the row is the same shape whatever the
 * connect flow was. Re-connecting updates in place rather than inserting a
 * second row, so repairing an expired credential does not leave two copies of
 * the same account in the picker.
 */
export async function saveConnection(
  sql: Sql,
  profileGroupId: string,
  connection: Connection,
): Promise<string> {
  const [profile] = await sql<{ id: string }[]>`
    INSERT INTO social_profiles (
      organization_id, profile_group_id, network, remote_account_id,
      handle, display_name, credential_id, status
    )
    VALUES (
      ${connection.organizationId}, ${profileGroupId}, ${connection.network},
      ${connection.account.id}, ${connection.account.handle ?? null},
      ${connection.account.displayName}, ${connection.credentialId}, 'active'
    )
    ON CONFLICT (organization_id, network, remote_account_id)
    DO UPDATE SET
      credential_id = EXCLUDED.credential_id,
      display_name  = EXCLUDED.display_name,
      handle        = EXCLUDED.handle,
      status        = 'active',
      updated_at    = now()
    RETURNING id
  `;
  if (profile === undefined) throw new Error('Profile upsert returned no row');
  return profile.id;
}

export { CredentialVault };
