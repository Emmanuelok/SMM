import {
  countGraphemes,
  err,
  extractUrls,
  failure,
  ok,
  remoteId,
  type CredentialId,
  type PublishFailure,
  type RemoteId,
  type Result,
} from '@smm/shared';

import type { AuthStart, PlatformAdapter, PublishSuccess } from '../adapter.js';
import type { PlatformCapabilities } from '../capabilities.js';
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
import {
  type IdempotencyKey,
  type PublishHandle,
  type PublishPhase,
  type SingleShotHandle,
} from '../lifecycle.js';
import type { DateRange, PostVisibility, RawMetric } from '../metrics.js';
import type { NetworkId } from '../networks.js';
import { BLUESKY } from '../registry.js';

/**
 * Bluesky, over the AT Protocol.
 *
 * The first adapter deliberately, because it is the only major network that
 * needs no approved developer application. Everything else in this system —
 * the publish lifecycle, budgets, retry classification, read-back — can be
 * proven end to end against a real network while Meta, TikTok and LinkedIn
 * reviews are still pending.
 *
 * Bluesky is `single_shot`: one call creates the post. There is no container to
 * poll and nothing to finalize, so `poll` reports the handle's own phase and
 * `finalize` is a lookup rather than a second publish. Calling it as though it
 * were a publish step is exactly the double-post the contract warns about.
 */

const DEFAULT_SERVICE = 'https://bsky.social';
const POST_COLLECTION = 'app.bsky.feed.post';

/**
 * How `getPosts` versions itself.
 *
 * The AT Protocol versions by lexicon rather than by a number in the path, so
 * there is no `v2` to record. Stored as the lexicon id because that is the
 * thing that actually changes when the shape of the response changes — and
 * "unversioned" recorded explicitly beats an empty column nobody can interpret
 * in two years.
 */
const BLUESKY_API_VERSION = 'app.bsky.feed.defs#postView';

/** `getPosts` accepts at most 25 URIs per call. */
const GET_POSTS_LIMIT = 25;

/**
 * The counters a post view carries.
 *
 * Named exactly as Bluesky names them, because the stored field is the join key
 * back to what the number meant. Bluesky publishes no impressions or reach at
 * any tier; inventing them from these would be a guess wearing a metric's name.
 */
const COUNT_FIELDS = ['likeCount', 'repostCount', 'replyCount', 'quoteCount'] as const;

/** Only the parts of `app.bsky.feed.defs#postView` that carry numbers. */
interface PostView {
  readonly uri: string;
  readonly likeCount?: number;
  readonly repostCount?: number;
  readonly replyCount?: number;
  readonly quoteCount?: number;
}

/**
 * Resolves a credential reference to the secret it stands for.
 *
 * Adapters never hold secrets and never see the vault. They are handed a
 * function, so the decrypted value exists for the duration of one call and
 * never lands in a queued job payload, a log line, or a serialised connection.
 */
export interface CredentialStore {
  /** Open the secret behind a connection, for the duration of one call. */
  resolve(connection: Connection): Promise<BlueskyCredential>;
  /**
   * Seal a newly collected secret and return the reference to it.
   *
   * Needed because `completeAuth` must return a `Connection`, and a connection
   * names a `credentialId` that only the vault can mint. Without this seam the
   * adapter would either have to hold the secret itself or hand back a
   * connection pointing at nothing.
   */
  store(organizationId: Connection['organizationId'], secret: BlueskyCredential): Promise<CredentialId>;
}

export interface BlueskyCredential {
  /** Handle or DID used to open a session. */
  readonly identifier: string;
  /**
   * An app password, never the account password.
   *
   * Bluesky issues revocable, scoped app passwords precisely so a third party
   * never holds the real one. Accepting an account password would also hand us
   * the ability to change it.
   */
  readonly appPassword: string;
}

interface AtpSession {
  readonly accessJwt: string;
  readonly refreshJwt: string;
  readonly did: string;
  readonly handle: string;
}

/**
 * A span of the post text carrying a link, a mention, or a tag.
 *
 * Offsets are indices into the UTF-8 **bytes** of the text, not into characters
 * and not into UTF-16 code units. This is the detail that breaks naive
 * implementations: any emoji or non-Latin script before a link shifts the byte
 * offset away from the character offset, and a facet computed the obvious way
 * points at the wrong span. The link then renders over the wrong text, or the
 * server rejects the record outright.
 */
export interface Facet {
  readonly index: { readonly byteStart: number; readonly byteEnd: number };
  readonly features: readonly { readonly $type: string; readonly uri: string }[];
}

const encoder = new TextEncoder();

/** UTF-8 byte length of a string. */
function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/**
 * Build link facets for a post body.
 *
 * Each URL is located by character index and converted to a byte offset by
 * measuring the text that precedes it. Occurrences are found left to right with
 * a moving cursor, so a URL repeated in one post produces two correct facets
 * rather than two copies of the first.
 */
export function buildLinkFacets(text: string): readonly Facet[] {
  const facets: Facet[] = [];
  let searchFrom = 0;

  for (const url of extractUrls(text)) {
    const charIndex = text.indexOf(url, searchFrom);
    if (charIndex === -1) continue;
    searchFrom = charIndex + url.length;

    const byteStart = byteLength(text.slice(0, charIndex));
    facets.push({
      index: { byteStart, byteEnd: byteStart + byteLength(url) },
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          // A bare domain still needs an absolute URI or the record is rejected.
          uri: url.startsWith('http') ? url : `https://${url}`,
        },
      ],
    });
  }

  return facets;
}

interface XrpcError {
  readonly status: number;
  readonly error?: string | undefined;
  readonly message?: string | undefined;
}

function isXrpcError(value: unknown): value is XrpcError {
  return typeof value === 'object' && value !== null && 'status' in value;
}

export class BlueskyAdapter implements PlatformAdapter {
  readonly network: NetworkId = 'bluesky';
  readonly archetypes = { text: 'single_shot', image: 'single_shot' } as const;

  readonly #credentials: CredentialStore;
  readonly #service: string;
  /**
   * Sessions cached per connection.
   *
   * An access JWT lasts minutes, so opening a session per call would double
   * every request during a publishing burst. Cached in memory only: a session
   * is derived from a credential we already hold, so losing the cache on
   * restart costs one extra call and never a failure.
   */
  readonly #sessions = new Map<string, AtpSession>();

  constructor(credentials: CredentialStore, service: string = DEFAULT_SERVICE) {
    this.#credentials = credentials;
    this.#service = service;
  }

  async capabilities(): Promise<PlatformCapabilities> {
    return BLUESKY;
  }

  /**
   * Bluesky has no consent screen for third parties, so there is nowhere to
   * redirect to.
   *
   * The account holder creates a revocable app password in their own settings
   * and pastes it. This is the case `AuthInstructions` exists for, and it is
   * worth noting the flow is in some ways stronger than OAuth here: the
   * credential is scoped, revocable from the platform's own UI without our
   * involvement, and never the account password.
   */
  async beginAuth(_ctx: AuthContext): Promise<AuthStart> {
    return {
      instructions: [
        {
          kind: 'external_action',
          label: 'Create an app password in Bluesky',
          detail:
            'Open Settings, then App Passwords, and add one named for this tool. ' +
            'It can be revoked from that same screen at any time without changing your account password.',
          url: 'https://bsky.app/settings/app-passwords',
        },
        {
          kind: 'collect_input',
          field: 'identifier',
          label: 'Your Bluesky handle',
          inputType: 'text',
          placeholder: 'yourname.bsky.social',
          help: 'The handle shown on your profile, without the @.',
        },
        {
          kind: 'collect_secret',
          field: 'appPassword',
          label: 'App password',
          help: 'The value Bluesky showed when you created the app password. It is not shown again.',
        },
      ],
    };
  }

  /**
   * Verify the pasted credential works, then seal it.
   *
   * Opening a session first means a typo is reported immediately rather than
   * becoming a connection that fails at the first scheduled post. Returns a
   * list because the contract does — Bluesky yields exactly one account per
   * credential, unlike Google Business or LinkedIn.
   */
  async completeAuth(ctx: AuthContext): Promise<readonly Connection[]> {
    const identifier = ctx.inputs?.['identifier'];
    const appPassword = ctx.inputs?.['appPassword'];
    if (identifier === undefined || appPassword === undefined) {
      throw new Error('Bluesky connect needs both a handle and an app password.');
    }

    const secret: BlueskyCredential = { identifier, appPassword };
    const session = await this.#call<AtpSession>('POST', 'com.atproto.server.createSession', {
      body: { identifier: secret.identifier, password: secret.appPassword },
    });

    const credentialId = await this.#credentials.store(ctx.organizationId, secret);

    return [
      {
        // The DID is stable across handle changes, which a handle is not, so it
        // is what our own identity for the connection is derived from.
        id: `bluesky:${session.did}` as ConnectionId,
        organizationId: ctx.organizationId,
        network: 'bluesky',
        profileId: session.did as Connection['profileId'],
        credentialId,
        kind: 'api_key',
        app: ctx.app,
        account: {
          id: remoteId(session.did),
          displayName: session.handle,
          handle: session.handle,
        },
        // An app password carries no scope system; it grants what the account can do.
        scopes: [],
        grantedAt: new Date(),
        ...(ctx.initiatedBy === undefined ? {} : { grantedBy: ctx.initiatedBy }),
      },
    ];
  }

  /**
   * Bluesky publishes no revocation endpoint for app passwords.
   *
   * Reported as `no_endpoint` rather than pretending success. Deleting our row
   * deletes our copy of the key, not the lock: the app password stays live
   * until the account holder removes it, and claiming otherwise would put a
   * false assurance into an offboarding record that exists precisely to be
   * relied on.
   */
  async revoke(connection: Connection): Promise<RevocationReceipt> {
    return {
      connectionId: connection.id,
      credentialId: connection.credentialId,
      network: 'bluesky',
      outcome: 'no_endpoint',
      revokedAt: new Date(),
      message:
        'Bluesky has no API to revoke an app password. Our stored copy is destroyed, but the ' +
        'password remains valid until the account holder deletes it under Settings, App Passwords.',
    };
  }

  /**
   * Interpret whatever the network returned.
   *
   * The only place in the system permitted to read Bluesky's error strings.
   * Everything downstream keys off the returned `kind`, so a platform rewording
   * a message changes this function and nothing else.
   */
  classify(error: unknown): PublishFailure {
    if (!isXrpcError(error)) {
      if (error instanceof Error && /fetch failed|ECONNRESET|ETIMEDOUT/i.test(error.message)) {
        return failure('transient', 'Could not reach Bluesky. Retrying shortly.');
      }
      return failure('unknown', 'Bluesky returned something we could not interpret.');
    }

    const code = error.error ?? '';
    const detail = error.message ?? '';

    if (
      error.status === 401 ||
      code === 'ExpiredToken' ||
      code === 'InvalidToken' ||
      code === 'AuthenticationRequired'
    ) {
      // Covers both a rejected app password at connect time and a credential
      // that stopped working later. The caller knows which flow it is in and
      // words it accordingly; the kind is the same either way because the
      // remedy is the same — supply a working app password.
      return failure('auth_expired', 'Bluesky did not accept this app password.', {
        platformCode: code,
        platformMessage: detail,
      });
    }
    if (code === 'AccountTakedown' || code === 'AccountDeactivated') {
      return failure('account_restricted', 'This Bluesky account cannot currently post.', {
        platformCode: code,
        platformMessage: detail,
      });
    }
    if (error.status === 403) {
      // Also what an egress proxy returns when the host is not allowed, which
      // is worth naming: the alternative is an opaque "unexpected error" while
      // the real cause is a network policy nobody thought to check.
      return failure(
        'permission_denied',
        'The request to Bluesky was refused. If this service runs behind an egress ' +
          'allowlist, bsky.social needs to be on it.',
        { platformCode: code, platformMessage: detail },
      );
    }
    if (error.status === 429 || code === 'RateLimitExceeded') {
      return failure('rate_limited', 'Bluesky is rate limiting this account.', {
        platformCode: code,
        platformMessage: detail,
        retryAfterMs: 60_000,
      });
    }
    if (error.status === 400 && /blob|image|mime/i.test(detail)) {
      return failure('media_rejected', 'Bluesky rejected the attached image.', {
        platformCode: code,
        platformMessage: detail,
      });
    }
    if (error.status === 400) {
      // A 400 that is not about media is a rule we did not check ourselves, so
      // it is a candidate for a new local pre-flight check.
      return failure('content_rejected', 'Bluesky rejected this post.', {
        platformCode: code,
        platformMessage: detail,
      });
    }
    if (error.status >= 500) {
      return failure('platform_unavailable', 'Bluesky is having trouble. Retrying shortly.', {
        platformCode: code,
        platformMessage: detail,
      });
    }
    return failure('unknown', 'Bluesky returned an unexpected error.', {
      platformCode: code,
      platformMessage: detail,
    });
  }

  async #call<T>(
    method: 'GET' | 'POST',
    procedure: string,
    options: {
      readonly body?: unknown;
      readonly token?: string | undefined;
      readonly query?: Readonly<Record<string, string>> | undefined;
      /**
       * Parameters XRPC takes as an array, sent as a repeated key.
       *
       * Separate from `query` because the two need different methods on
       * URLSearchParams — `set` replaces, `append` accumulates — and using the
       * wrong one turns a request for twenty-five posts into a request for one.
       */
      readonly repeatedQuery?: Readonly<Record<string, readonly string[]>> | undefined;
    } = {},
  ): Promise<T> {
    const url = new URL(`/xrpc/${procedure}`, this.#service);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }
    for (const [key, values] of Object.entries(options.repeatedQuery ?? {})) {
      for (const value of values) url.searchParams.append(key, value);
    }

    const headers: Record<string, string> = { accept: 'application/json' };
    if (options.token !== undefined) headers['authorization'] = `Bearer ${options.token}`;
    if (options.body !== undefined) headers['content-type'] = 'application/json';

    const response = await fetch(url, {
      method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      // Without a timeout a hung connection holds a worker indefinitely.
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw {
        status: response.status,
        error: payload.error,
        message: payload.message,
      } satisfies XrpcError;
    }

    return (await response.json()) as T;
  }

  async #session(connection: Connection): Promise<AtpSession> {
    const cached = this.#sessions.get(connection.id);
    if (cached !== undefined) return cached;

    const credential = await this.#credentials.resolve(connection);
    const session = await this.#call<AtpSession>('POST', 'com.atproto.server.createSession', {
      body: { identifier: credential.identifier, password: credential.appPassword },
    });
    this.#sessions.set(connection.id, session);
    return session;
  }

  /**
   * Read-only identity check.
   *
   * Never refreshes. A health sweep that refreshes tokens races the publish
   * path, and on networks issuing single-use refresh tokens that orphans the
   * credential and disconnects an account that was working.
   */
  async probe(connection: Connection): Promise<HealthReport> {
    const checkedAt = new Date();
    try {
      const session = await this.#session(connection);
      await this.#call('GET', 'com.atproto.server.getSession', { token: session.accessJwt });
      return { status: 'healthy', checkedAt, message: 'Connected.' };
    } catch (error) {
      const classified = this.classify(error);
      // A cached session that no longer works must not be reused.
      this.#sessions.delete(connection.id);
      return {
        status: classified.kind === 'auth_expired' ? 'expired' : 'unknown',
        checkedAt,
        message: classified.message,
        platformCode: classified.platformCode,
        platformMessage: classified.platformMessage,
      };
    }
  }

  async assertReadiness(connection: Connection): Promise<readonly ConnectionAssertion[]> {
    const health = await this.probe(connection);
    return [
      {
        key: 'bluesky_session_opens',
        label: 'The app password still opens a session',
        outcome: health.status === 'healthy' ? 'pass' : 'fail',
        // Nothing publishes without a session, so a failure here blocks rather
        // than degrades.
        blocking: true,
        checkedAt: health.checkedAt,
        detail: health.message,
        ...(health.status === 'healthy'
          ? {}
          : {
              remediation:
                'Create a new app password under Settings, App Passwords in Bluesky, then reconnect.',
              remediationUrl: 'https://bsky.app/settings/app-passwords',
            }),
      },
    ];
  }

  /**
   * Bluesky has one destination per account: the account's own repository.
   *
   * Returned as a single-item list rather than as a special case, so the
   * generic connect flow needs no knowledge of which networks have
   * sub-destinations.
   */
  async listDestinations(connection: Connection): Promise<readonly Destination[]> {
    const session = await this.#session(connection);
    return [
      {
        id: session.did as DestinationId,
        connectionId: connection.id,
        network: 'bluesky',
        kind: 'profile',
        remoteId: remoteId(session.did),
        name: session.handle,
        handle: session.handle,
        postable: true,
        discoveredAt: new Date(),
      },
    ];
  }

  async destinationRules(): Promise<readonly []> {
    // Nothing is fetched live: Bluesky imposes no per-destination rules of the
    // kind a subreddit or a LinkedIn organisation does.
    return [];
  }

  async validate(): Promise<never> {
    // Validation is pure and lives in validation.ts against the capability
    // descriptor; an adapter re-implementing it would be a second answer free
    // to disagree with the composer's.
    throw new Error('Use validateTarget from @smm/adapters with the Bluesky capabilities.');
  }

  async submit(
    connection: Connection,
    target: ResolvedTarget,
    idem: IdempotencyKey,
  ): Promise<Result<PublishHandle, PublishFailure>> {
    try {
      const session = await this.#session(connection);

      // Checked here as well as in the composer because a scheduled post can be
      // edited after it was validated, and the platform's own error would be a
      // generic 400.
      if (countGraphemes(target.body) > 300) {
        return err(
          failure('validation_failed', 'Bluesky posts are limited to 300 characters.'),
        );
      }

      const record = {
        $type: POST_COLLECTION,
        text: target.body,
        createdAt: new Date().toISOString(),
        facets: buildLinkFacets(target.body),
        ...(target.locale === undefined ? {} : { langs: [target.locale] }),
      };

      const created = await this.#call<{ uri: string; cid: string }>(
        'POST',
        'com.atproto.repo.createRecord',
        {
          token: session.accessJwt,
          body: { repo: session.did, collection: POST_COLLECTION, record },
        },
      );

      const handle: SingleShotHandle = {
        network: 'bluesky',
        archetype: 'single_shot',
        idempotencyKey: idem,
        // The post exists the moment this call returns; there is nothing to wait for.
        phase: 'completed',
        submittedAt: new Date(),
        // Nothing expires, but the field is required and a distant value is
        // more honest than a fabricated near one.
        expiresAt: new Date(Date.now() + 365 * 24 * 3_600_000),
        mediaIds: [],
        remotePostId: remoteId(created.uri),
      };
      return ok(handle);
    } catch (error) {
      return err(this.classify(error));
    }
  }

  /** Nothing to wait for on a single-shot network; the handle already knows. */
  async poll(_connection: Connection, handle: PublishHandle): Promise<PublishPhase> {
    return handle.phase;
  }

  /**
   * A lookup, not a second publish.
   *
   * `submit` already created the post. Issuing another write here is precisely
   * the double-post the contract warns about, so this only reads what the
   * handle recorded.
   */
  async finalize(
    connection: Connection,
    handle: PublishHandle,
  ): Promise<Result<PublishSuccess, PublishFailure>> {
    if (handle.archetype !== 'single_shot' || handle.remotePostId === undefined) {
      return err(
        failure('internal', 'Bluesky finalize was called with a handle that has no post.'),
      );
    }

    try {
      const session = await this.#session(connection);
      const rkey = rkeyFromUri(handle.remotePostId);
      return ok({
        remotePostId: handle.remotePostId,
        url: `https://bsky.app/profile/${session.handle}/post/${rkey}`,
        publishedAt: handle.submittedAt,
      });
    } catch (error) {
      return err(this.classify(error));
    }
  }

  /**
   * Confirm the post is actually there.
   *
   * A successful write is not proof of a live post: records can be deleted by
   * the account owner or removed by moderation, and reporting what we sent
   * rather than what is present is how a report drifts from reality.
   */
  async readBack(connection: Connection, remotePostId: RemoteId): Promise<PostVisibility> {
    try {
      const session = await this.#session(connection);
      await this.#call('GET', 'com.atproto.repo.getRecord', {
        token: session.accessJwt,
        query: {
          repo: session.did,
          collection: POST_COLLECTION,
          rkey: rkeyFromUri(remotePostId),
        },
      });
      return { state: 'live' };
    } catch (error) {
      const classified = this.classify(error);
      if (isXrpcError(error) && error.status === 400 && /not found/i.test(error.message ?? '')) {
        return { state: 'removed' };
      }
      return { state: 'unavailable', reason: classified.message };
    }
  }

  /**
   * Engagement counts, exactly as Bluesky returns them.
   *
   * `getPosts` takes up to 25 AT URIs at a time and answers with the post views
   * including their counters, so a whole day's posts usually cost one call.
   *
   * Everything Bluesky publishes here is **cumulative**: `likeCount` is the
   * running total on the record, not likes in a window. Recording that
   * correctly matters more than it looks — a cumulative reading summed across
   * thirty days produces a number thirty times too large, and it is the exact
   * mistake that makes an analytics product confidently wrong. The window
   * argument is therefore ignored rather than pretended to be honoured: filter
   * a cumulative counter by date and you get a smaller wrong number instead of
   * an obviously wrong one.
   *
   * The field names are passed through unchanged, typos and all. Bluesky has no
   * impressions or reach API at any tier, so those are absent rather than
   * approximated from what is here.
   */
  async fetchMetrics(
    connection: Connection,
    ids: readonly RemoteId[],
    _window: DateRange,
  ): Promise<readonly RawMetric[]> {
    if (ids.length === 0) return [];

    const session = await this.#session(connection);
    const collectedAt = new Date();
    const metrics: RawMetric[] = [];

    for (let start = 0; start < ids.length; start += GET_POSTS_LIMIT) {
      const batch = ids.slice(start, start + GET_POSTS_LIMIT);
      const response = await this.#call<{ posts?: readonly PostView[] }>(
        'GET',
        'app.bsky.feed.getPosts',
        {
          token: session.accessJwt,
          // Repeated key, which is how XRPC takes an array. URLSearchParams.set
          // would keep only the last one and silently fetch a single post.
          query: {},
          repeatedQuery: { uris: [...batch] },
        },
      );

      for (const post of response.posts ?? []) {
        for (const field of COUNT_FIELDS) {
          const value = post[field];
          // Absent is not zero. Bluesky omits a counter it has not computed,
          // and writing a zero would put a real dip on a client's chart.
          if (typeof value !== 'number') continue;

          metrics.push({
            subjectType: 'post',
            subjectId: post.uri,
            fieldAsReturned: field,
            value,
            endpoint: 'app.bsky.feed.getPosts',
            apiVersion: BLUESKY_API_VERSION,
            measureKind: 'cumulative',
            collectedAt,
          });
        }
      }
    }

    return metrics;
  }

  async deletePost(
    connection: Connection,
    remotePostId: RemoteId,
  ): Promise<Result<void, PublishFailure>> {
    try {
      const session = await this.#session(connection);
      await this.#call('POST', 'com.atproto.repo.deleteRecord', {
        token: session.accessJwt,
        body: {
          repo: session.did,
          collection: POST_COLLECTION,
          rkey: rkeyFromUri(remotePostId),
        },
      });
      return ok(undefined);
    } catch (error) {
      return err(this.classify(error));
    }
  }
}

/**
 * Extract the record key from an AT URI.
 *
 * `at://did:plc:abc/app.bsky.feed.post/3k2b...` — the key is the final segment,
 * and it is what every record-level call takes.
 */
export function rkeyFromUri(uri: string): string {
  const segments = uri.split('/');
  return segments[segments.length - 1] ?? '';
}
