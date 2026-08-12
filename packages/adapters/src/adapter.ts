import type { CredentialId, PublishFailure, RemoteId, Result, SocialProfileId } from '@smm/shared';

import type { PlatformCapabilities } from './capabilities.js';
import type { ResolvedTarget } from './content.js';
import type { NetworkId } from './networks.js';

/**
 * The contract every network integration implements.
 *
 * Keeping this narrow is the point. Networks differ enormously, and the
 * temptation is to leak each one's quirks upward into the scheduler. Instead
 * the quirks live in two places only: the capability descriptor, which is data,
 * and the adapter implementation, which is the sole owner of that network's
 * HTTP calls. Nothing above this interface knows what an Instagram container id
 * is.
 */

/** An opaque handle to decrypted credentials, resolved from the token vault. */
export interface Credentials {
  readonly id: CredentialId;
  readonly accessToken: string;
  readonly refreshToken?: string | undefined;
  readonly expiresAt?: Date | undefined;
  readonly scopes: readonly string[];
  /** Network-specific extras: page ids, business ids, actor URNs. */
  readonly metadata: Readonly<Record<string, string>>;
}

export interface PublishContext {
  readonly profileId: SocialProfileId;
  readonly credentials: Credentials;
  /**
   * The account's identifier on the network — a page id, channel id, or DID.
   * Distinct from our own profile id.
   */
  readonly remoteAccountId: RemoteId;
  /** Aborts in-flight work when a scheduled post is cancelled mid-publish. */
  readonly signal: AbortSignal;
}

export interface PublishSuccess {
  readonly remotePostId: RemoteId;
  /** Public permalink, where the network returns one. */
  readonly url?: string | undefined;
  readonly publishedAt: Date;
  /** Set when a first comment was requested and posted. */
  readonly firstCommentId?: RemoteId | undefined;
}

export interface MetricSnapshot {
  readonly remotePostId: RemoteId;
  readonly collectedAt: Date;
  /**
   * Normalised metrics. Networks disagree on names and definitions, so
   * adapters map into a shared vocabulary — `impressions`, `reach`,
   * `likes`, `comments`, `shares`, `saves`, `clicks`, `video_views`.
   * Anything without a faithful equivalent is omitted rather than guessed at.
   */
  readonly metrics: Readonly<Record<string, number>>;
}

export interface RefreshedCredentials {
  readonly accessToken: string;
  readonly refreshToken?: string | undefined;
  readonly expiresAt?: Date | undefined;
}

export interface SocialAdapter {
  readonly network: NetworkId;
  readonly capabilities: PlatformCapabilities;

  /**
   * Publish one resolved target.
   *
   * Implementations must translate platform errors into a `PublishFailure`
   * rather than throwing, so the scheduler can apply a uniform retry policy.
   * Throwing is reserved for genuine bugs.
   */
  publish(
    target: ResolvedTarget,
    context: PublishContext,
  ): Promise<Result<PublishSuccess, PublishFailure>>;

  /** Remove a published post, where the network permits it. */
  deletePost?(
    remotePostId: RemoteId,
    context: PublishContext,
  ): Promise<Result<void, PublishFailure>>;

  /** Collect post-level metrics. Called on a decaying schedule after publish. */
  fetchMetrics?(
    remotePostIds: readonly RemoteId[],
    context: PublishContext,
  ): Promise<Result<readonly MetricSnapshot[], PublishFailure>>;

  /**
   * Exchange a refresh token for a new access token.
   *
   * Absent when a network issues long-lived credentials that must instead be
   * re-granted by the user.
   */
  refresh?(
    credentials: Credentials,
  ): Promise<Result<RefreshedCredentials, PublishFailure>>;

  /**
   * Confirm the credentials still work and the account is postable to.
   *
   * Run on a schedule so a revoked token surfaces as a prompt to reconnect
   * before it costs someone a scheduled campaign, rather than after.
   */
  verifyCredentials(
    context: PublishContext,
  ): Promise<Result<void, PublishFailure>>;
}

/** Registry of live adapter implementations. */
export class AdapterRegistry {
  readonly #adapters = new Map<NetworkId, SocialAdapter>();

  register(adapter: SocialAdapter): this {
    this.#adapters.set(adapter.network, adapter);
    return this;
  }

  get(network: NetworkId): SocialAdapter | undefined {
    return this.#adapters.get(network);
  }

  /** Networks with a working implementation, not merely a descriptor. */
  available(): readonly NetworkId[] {
    return [...this.#adapters.keys()];
  }
}
