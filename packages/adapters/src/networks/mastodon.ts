import {
  countGraphemes,
  err,
  failure,
  ok,
  remoteId,
  type CredentialId,
  type PublishFailure,
  type RemoteId,
  type Result,
} from '@smm/shared';

import type { AuthStart, PlatformAdapter, PublishSuccess } from '../adapter.js';
import type { FormatCapability, PlatformCapabilities } from '../capabilities.js';
import type {
  AuthContext,
  Connection,
  ConnectionAssertion,
  ConnectionId,
  DestinationId,
  HealthReport,
  RevocationReceipt,
} from '../connection.js';
import type { ResolvedTarget } from '../content.js';
import type { Destination } from '../destinations.js';
import type { IdempotencyKey, PublishHandle, PublishPhase, SingleShotHandle } from '../lifecycle.js';
import type { PostVisibility } from '../metrics.js';
import type { NetworkId } from '../networks.js';
import { MASTODON } from '../registry.js';

/**
 * Mastodon, and any server speaking its API.
 *
 * The second adapter, chosen because it is different from Bluesky in the two
 * ways most likely to break a contract built around one network.
 *
 * There is no single Mastodon. Every server sets its own limits — 500
 * characters is only the default, and 1,000 or 5,000 are common — and disables
 * features at will. A static capability descriptor is therefore a starting
 * guess rather than the truth, which is exactly why `capabilities()` takes a
 * connection and returns a promise. This is the first adapter that genuinely
 * needs that, and it works without changing the contract.
 *
 * There is also no central app registration. A client is registered on each
 * server at connect time, so `beginAuth` has to ask which server first and can
 * only produce a redirect on its second call — which `AuthInstructions` and the
 * `inputs` round trip already allow for.
 */

const STATUS_PATH = '/api/v1/statuses';

export interface MastodonCredential {
  /** Origin of the server, e.g. `https://mastodon.social`. */
  readonly instance: string;
  readonly accessToken: string;
}

export interface MastodonCredentialStore {
  resolve(connection: Connection): Promise<MastodonCredential>;
  store(
    organizationId: Connection['organizationId'],
    secret: MastodonCredential,
  ): Promise<CredentialId>;
}

interface InstanceConfig {
  readonly domain?: string;
  readonly title?: string;
  readonly configuration?: {
    readonly statuses?: {
      readonly max_characters?: number;
      readonly max_media_attachments?: number;
    };
    readonly media_attachments?: {
      readonly image_size_limit?: number;
      readonly video_size_limit?: number;
      readonly supported_mime_types?: readonly string[];
    };
  };
}

interface Account {
  readonly id: string;
  readonly username: string;
  readonly acct: string;
  readonly display_name: string;
  readonly avatar?: string;
}

interface Status {
  readonly id: string;
  readonly url: string | null;
  readonly created_at: string;
}

interface HttpFailure {
  readonly status: number;
  readonly error?: string | undefined;
  readonly detail?: string | undefined;
}

function isHttpFailure(value: unknown): value is HttpFailure {
  return typeof value === 'object' && value !== null && 'status' in value;
}

/**
 * Normalise a user-typed server into an origin.
 *
 * People supply this three ways: a bare domain, a pasted profile URL, and a
 * full fediverse handle. The last two both contain an `@`, which is the trap:
 * treating `https://mastodon.social/@someone` as a handle and taking the text
 * after the `@` yields `https://someone`, a host that does not exist. So a
 * URL is parsed as a URL, and only a bare string is read as a handle.
 */
export function normalizeInstance(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('/')) {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).origin;
  }

  // `@user@server` or `user@server`; the server is what follows the last `@`.
  const host = trimmed.includes('@') ? (trimmed.split('@').pop() ?? trimmed) : trimmed;
  return new URL(`https://${host}`).origin;
}

export class MastodonAdapter implements PlatformAdapter {
  readonly network: NetworkId = 'mastodon';
  readonly archetypes = { text: 'single_shot', image: 'single_shot', video: 'single_shot' } as const;

  readonly #credentials: MastodonCredentialStore;
  /** Instance limits, cached per server rather than per connection. */
  readonly #instanceCache = new Map<string, InstanceConfig>();

  constructor(credentials: MastodonCredentialStore) {
    this.#credentials = credentials;
  }

  /**
   * What this particular server allows.
   *
   * Falls back to the conservative defaults when the server cannot be reached
   * or omits a field. Guessing high would produce posts the server rejects;
   * guessing low only refuses content it would have taken, which is the
   * cheaper error.
   */
  async capabilities(connection?: Connection): Promise<PlatformCapabilities> {
    if (connection === undefined) return MASTODON;

    let info: InstanceConfig;
    try {
      const credential = await this.#credentials.resolve(connection);
      info = await this.#instance(credential.instance);
    } catch {
      return MASTODON;
    }

    const maxCharacters = info.configuration?.statuses?.max_characters;
    const maxAttachments = info.configuration?.statuses?.max_media_attachments;
    const imageBytes = info.configuration?.media_attachments?.image_size_limit;

    if (maxCharacters === undefined && maxAttachments === undefined) return MASTODON;

    return {
      ...MASTODON,
      formats: MASTODON.formats.map((format): FormatCapability => ({
        ...format,
        text: { ...format.text, maxLength: maxCharacters ?? format.text.maxLength },
        media: {
          ...format.media,
          maxCount:
            format.media.maxCount === 0
              ? 0
              : (maxAttachments ?? format.media.maxCount),
          ...(format.media.image === undefined || imageBytes === undefined
            ? {}
            : { image: { ...format.media.image, maxBytes: imageBytes } }),
        },
      })),
    };
  }

  classify(error: unknown): PublishFailure {
    if (!isHttpFailure(error)) {
      if (error instanceof Error && /fetch failed|ECONNRESET|ETIMEDOUT/i.test(error.message)) {
        return failure('transient', 'Could not reach the Mastodon server. Retrying shortly.');
      }
      return failure('unknown', 'The Mastodon server returned something unreadable.');
    }

    const detail = error.detail ?? error.error ?? '';

    if (error.status === 401) {
      return failure('auth_expired', 'This Mastodon connection needs to be reauthorised.', {
        platformMessage: detail,
      });
    }
    if (error.status === 403) {
      return failure('permission_denied', 'This token is not allowed to post here.', {
        platformMessage: detail,
      });
    }
    if (error.status === 429) {
      return failure('rate_limited', 'The server is rate limiting this account.', {
        platformMessage: detail,
        retryAfterMs: 300_000,
      });
    }
    if (error.status === 422) {
      // Mastodon uses 422 for content it will not accept, including a status
      // over the instance's own limit.
      return failure('content_rejected', 'The server rejected this post.', {
        platformMessage: detail,
      });
    }
    if (error.status === 404) {
      return failure('destination_gone', 'That Mastodon server or account is gone.', {
        platformMessage: detail,
      });
    }
    if (error.status >= 500) {
      return failure('platform_unavailable', 'The Mastodon server is having trouble.', {
        platformMessage: detail,
      });
    }
    return failure('unknown', 'The Mastodon server returned an unexpected error.', {
      platformMessage: detail,
    });
  }

  async #call<T>(
    instance: string,
    path: string,
    options: {
      readonly method?: 'GET' | 'POST' | 'DELETE';
      readonly token?: string | undefined;
      readonly body?: unknown;
      readonly idempotencyKey?: string | undefined;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (options.token !== undefined) headers['authorization'] = `Bearer ${options.token}`;
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    // Mastodon honours this natively: a replayed request with the same key
    // returns the original status instead of creating a second one. That is a
    // stronger guarantee than our own claim table, so it is always sent.
    if (options.idempotencyKey !== undefined) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const response = await fetch(new URL(path, instance), {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        error_description?: string;
      };
      throw {
        status: response.status,
        error: payload.error,
        detail: payload.error_description ?? payload.error,
      } satisfies HttpFailure;
    }
    return (await response.json()) as T;
  }

  async #instance(instance: string): Promise<InstanceConfig> {
    const cached = this.#instanceCache.get(instance);
    if (cached !== undefined) return cached;
    const info = await this.#call<InstanceConfig>(instance, '/api/v2/instance');
    this.#instanceCache.set(instance, info);
    return info;
  }

  /**
   * Two passes: ask which server, then register a client there and redirect.
   *
   * A redirect cannot be produced on the first call because there is no central
   * app registration — the client id only exists once it has been created on
   * that specific server.
   */
  async beginAuth(ctx: AuthContext): Promise<AuthStart> {
    const typed = ctx.inputs?.['instance'];
    if (typed === undefined || typed.trim() === '') {
      return {
        instructions: [
          {
            kind: 'collect_input',
            field: 'instance',
            label: 'Your Mastodon server',
            inputType: 'text',
            placeholder: 'mastodon.social',
            help: 'The server your account lives on. Anything Mastodon-compatible works.',
          },
        ],
      };
    }

    const instance = normalizeInstance(typed);
    const app = await this.#call<{ client_id: string; client_secret: string }>(
      instance,
      '/api/v1/apps',
      {
        method: 'POST',
        body: {
          client_name: 'SMM',
          redirect_uris: ctx.redirectUri,
          scopes: 'read write',
          website: ctx.redirectUri,
        },
      },
    );

    const authorize = new URL('/oauth/authorize', instance);
    authorize.searchParams.set('client_id', app.client_id);
    authorize.searchParams.set('redirect_uri', ctx.redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', 'read write');
    authorize.searchParams.set('state', ctx.state);

    return { redirectUrl: authorize.toString() };
  }

  async completeAuth(ctx: AuthContext): Promise<readonly Connection[]> {
    const typed = ctx.inputs?.['instance'];
    const code = ctx.callbackParams?.['code'];
    const clientId = ctx.inputs?.['clientId'];
    const clientSecret = ctx.inputs?.['clientSecret'];

    if (typed === undefined || code === undefined || clientId === undefined || clientSecret === undefined) {
      throw new Error('Mastodon connect needs the server, the authorisation code and the client it was issued to.');
    }

    const instance = normalizeInstance(typed);
    const token = await this.#call<{ access_token: string }>(instance, '/oauth/token', {
      method: 'POST',
      body: {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: ctx.redirectUri,
        scope: 'read write',
      },
    });

    const account = await this.#call<Account>(instance, '/api/v1/accounts/verify_credentials', {
      token: token.access_token,
    });

    const credentialId = await this.#credentials.store(ctx.organizationId, {
      instance,
      accessToken: token.access_token,
    });

    return [
      {
        // Namespaced by server: the same username on two servers is two
        // entirely unrelated accounts.
        id: `mastodon:${new URL(instance).host}:${account.id}` as ConnectionId,
        organizationId: ctx.organizationId,
        network: 'mastodon',
        profileId: account.id as Connection['profileId'],
        credentialId,
        kind: 'oauth2_dynamic',
        app: ctx.app,
        account: {
          id: remoteId(account.id),
          displayName: account.display_name || account.username,
          handle: account.acct,
          ...(account.avatar === undefined ? {} : { avatarUrl: account.avatar }),
        },
        scopes: ['read', 'write'],
        instance: { url: instance, software: 'mastodon' },
        grantedAt: new Date(),
        ...(ctx.initiatedBy === undefined ? {} : { grantedBy: ctx.initiatedBy }),
      },
    ];
  }

  async revoke(connection: Connection): Promise<RevocationReceipt> {
    const base = {
      connectionId: connection.id,
      credentialId: connection.credentialId,
      network: 'mastodon' as const,
      revokedAt: new Date(),
    };

    try {
      const credential = await this.#credentials.resolve(connection);
      // Mastodon does publish a revocation endpoint, unlike Bluesky, so the
      // grant can genuinely be destroyed rather than merely forgotten.
      await this.#call(credential.instance, '/oauth/revoke', {
        method: 'POST',
        token: credential.accessToken,
        body: { token: credential.accessToken },
      });
      return {
        ...base,
        outcome: 'revoked_upstream',
        endpoint: '/oauth/revoke',
        message: 'The access token was revoked at the server.',
      };
    } catch (error) {
      const fault = this.classify(error);
      if (fault.kind === 'auth_expired') {
        return {
          ...base,
          outcome: 'already_invalid',
          endpoint: '/oauth/revoke',
          message: 'The server reported the token already invalid.',
        };
      }
      return {
        ...base,
        outcome: 'refused',
        endpoint: '/oauth/revoke',
        message: `The server refused the revocation: ${fault.message}`,
      };
    }
  }

  async probe(connection: Connection): Promise<HealthReport> {
    const checkedAt = new Date();
    try {
      const credential = await this.#credentials.resolve(connection);
      await this.#call<Account>(credential.instance, '/api/v1/accounts/verify_credentials', {
        token: credential.accessToken,
      });
      return { status: 'healthy', checkedAt, message: 'Connected.' };
    } catch (error) {
      const fault = this.classify(error);
      return {
        status:
          fault.kind === 'auth_expired'
            ? 'revoked'
            : fault.kind === 'permission_denied'
              ? 'scope_insufficient'
              : 'unknown',
        checkedAt,
        message: fault.message,
        platformMessage: fault.platformMessage,
      };
    }
  }

  async assertReadiness(connection: Connection): Promise<readonly ConnectionAssertion[]> {
    const health = await this.probe(connection);
    return [
      {
        key: 'mastodon_token_valid',
        label: 'The access token is still accepted by the server',
        outcome: health.status === 'healthy' ? 'pass' : 'fail',
        blocking: true,
        checkedAt: health.checkedAt,
        detail: health.message,
        ...(health.status === 'healthy'
          ? {}
          : { remediation: 'Reconnect the account to obtain a new token.' }),
      },
    ];
  }

  async listDestinations(connection: Connection): Promise<readonly Destination[]> {
    const credential = await this.#credentials.resolve(connection);
    const account = await this.#call<Account>(
      credential.instance,
      '/api/v1/accounts/verify_credentials',
      { token: credential.accessToken },
    );
    const host = new URL(credential.instance).host;

    return [
      {
        id: `mastodon:${host}:${account.id}` as DestinationId,
        connectionId: connection.id,
        network: 'mastodon',
        kind: 'profile',
        remoteId: remoteId(account.id),
        name: account.display_name || account.username,
        handle: account.acct,
        // Two accounts can share a display name across servers, so the host is
        // what actually tells them apart in a picker.
        disambiguator: host,
        postable: true,
        discoveredAt: new Date(),
      },
    ];
  }

  async destinationRules(): Promise<readonly []> {
    return [];
  }

  async validate(): Promise<never> {
    throw new Error('Use validateTarget from @smm/adapters with this connection\'s capabilities.');
  }

  async submit(
    connection: Connection,
    target: ResolvedTarget,
    idem: IdempotencyKey,
  ): Promise<Result<PublishHandle, PublishFailure>> {
    try {
      const credential = await this.#credentials.resolve(connection);

      // Checked against this server's own limit rather than the default, since
      // the whole point of Mastodon is that the limit varies.
      const caps = await this.capabilities(connection);
      const limit = caps.formats[0]?.text.maxLength ?? 500;
      if (countGraphemes(target.body) > limit) {
        return err(
          failure(
            'validation_failed',
            `This server allows ${limit} characters and the post is ${countGraphemes(target.body)}.`,
          ),
        );
      }

      const extras = target.extras?.network === 'mastodon' ? target.extras : undefined;

      const status = await this.#call<Status>(credential.instance, STATUS_PATH, {
        method: 'POST',
        token: credential.accessToken,
        idempotencyKey: idem,
        body: {
          status: target.body,
          visibility: extras?.visibility ?? 'public',
          // A content warning collapses the post behind a summary. Honoured
          // rather than ignored because posting without one where the audience
          // expects it is a genuine breach of local norms.
          ...(extras?.contentWarning === undefined
            ? {}
            : { spoiler_text: extras.contentWarning }),
          ...(target.locale === undefined ? {} : { language: target.locale }),
        },
      });

      const handle: SingleShotHandle = {
        network: 'mastodon',
        archetype: 'single_shot',
        idempotencyKey: idem,
        phase: 'completed',
        submittedAt: new Date(status.created_at),
        expiresAt: new Date(Date.now() + 365 * 24 * 3_600_000),
        mediaIds: [],
        remotePostId: remoteId(status.id),
      };
      return ok(handle);
    } catch (error) {
      return err(this.classify(error));
    }
  }

  async poll(_connection: Connection, handle: PublishHandle): Promise<PublishPhase> {
    return handle.phase;
  }

  async finalize(
    connection: Connection,
    handle: PublishHandle,
  ): Promise<Result<PublishSuccess, PublishFailure>> {
    if (handle.archetype !== 'single_shot' || handle.remotePostId === undefined) {
      return err(failure('internal', 'Mastodon finalize was called with a handle that has no post.'));
    }
    try {
      const credential = await this.#credentials.resolve(connection);
      const status = await this.#call<Status>(
        credential.instance,
        `${STATUS_PATH}/${handle.remotePostId}`,
        { token: credential.accessToken },
      );
      return ok({
        remotePostId: handle.remotePostId,
        ...(status.url === null ? {} : { url: status.url }),
        publishedAt: new Date(status.created_at),
      });
    } catch (error) {
      return err(this.classify(error));
    }
  }

  async readBack(connection: Connection, remotePostId: RemoteId): Promise<PostVisibility> {
    try {
      const credential = await this.#credentials.resolve(connection);
      await this.#call<Status>(credential.instance, `${STATUS_PATH}/${remotePostId}`, {
        token: credential.accessToken,
      });
      return { state: 'live' };
    } catch (error) {
      if (isHttpFailure(error) && error.status === 404) return { state: 'removed' };
      return { state: 'unavailable', reason: this.classify(error).message };
    }
  }

  async deletePost(
    connection: Connection,
    remotePostId: RemoteId,
  ): Promise<Result<void, PublishFailure>> {
    try {
      const credential = await this.#credentials.resolve(connection);
      await this.#call(credential.instance, `${STATUS_PATH}/${remotePostId}`, {
        method: 'DELETE',
        token: credential.accessToken,
      });
      return ok(undefined);
    } catch (error) {
      return err(this.classify(error));
    }
  }
}
