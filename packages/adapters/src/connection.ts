import type {
  Brand,
  CredentialId,
  OrganizationId,
  RemoteId,
  SocialProfileId,
  UserId,
} from '@smm/shared';

import type { NetworkId } from './networks.js';

/**
 * Connections, their health, and the evidence that they were taken away again.
 *
 * A connection is not a token. It is the whole answer to "may we post this, to
 * that account, right now, and if not, who has to do what about it". The thin
 * credential record this replaces could only say yes or no, and "no" was
 * indistinguishable from "the token is fine but the human who granted it holds
 * Editor rather than Admin on the Page". Every type here exists to make one of
 * those distinctions representable, because a distinction the type system
 * cannot express becomes a support ticket.
 */

/** Our identifier for one connected account-plus-destination pairing. */
export type ConnectionId = Brand<string, 'ConnectionId'>;

/**
 * A page, board, subreddit, location, playlist, channel or group *underneath* a
 * connected account. One Google Business auth returns hundreds of these, and a
 * Pinterest pin is meaningless without one.
 */
export type DestinationId = Brand<string, 'DestinationId'>;

/**
 * A registered developer application on a network — ours, or a customer's.
 *
 * Quota is attached to the app, not to the connection, which is why this needs
 * an identity of its own rather than being a boolean on the connection.
 */
export type PlatformAppId = Brand<string, 'PlatformAppId'>;

/**
 * The mechanism by which we hold the credential.
 *
 * These are not interchangeable at the storage or refresh layer: an OAuth1a
 * signature is computed per request from a secret we keep forever, a bot token
 * never expires and has no refresh path, and a webhook URL is itself the
 * secret. Collapsing them into "a token string" is what forces every adapter to
 * re-invent its own special case.
 */
export type CredentialKind =
  /** Standard authorization-code OAuth 2.0 against a pre-registered app. */
  | 'oauth2'
  /** OAuth 2.0 where the client is registered per host at connect time (Mastodon, self-hosted Ghost). */
  | 'oauth2_dynamic'
  /** Request-signing OAuth 1.0a. No bearer token exists to expire. */
  | 'oauth1a'
  /** A long-lived key issued from a settings page, not a consent screen. */
  | 'api_key'
  /** A bot identity rather than a user's, as on Telegram and Discord. */
  | 'bot_token'
  /** The endpoint is the credential; possession is authorisation. */
  | 'webhook_url'
  /** Per-application password on a basic-auth host (self-hosted WordPress). */
  | 'basic_app_password'
  /** Signed assertion exchanged for short-lived access (Apple Business Connect). */
  | 'jwt_asymmetric'
  /** A machine identity with no granting human at all. */
  | 'service_account'
  /** OAuth 2.0 against the customer's own developer app. See `ConnectionApp`. */
  | 'byo_app'
  /** Held on our behalf by a platform partner or reseller programme. */
  | 'partner_managed';

/**
 * Which developer application minted this credential.
 *
 * This has to exist from the first commit, and the reason is rate limits.
 * Platform quotas are almost never per connected account — YouTube's daily unit
 * budget and Google Business Profile's per-minute ceiling are consumed by every
 * tenant sharing the app. On our shared app, one customer backfilling a large
 * channel exhausts the pool for everybody else on the platform that day, and
 * the customers who suffer did nothing and can do nothing. Bring-your-own-app
 * is the only escape hatch: the large customer registers their own developer
 * app, draws from their own quota, and stops being everyone else's outage.
 *
 * Retrofitting this later is not a schema migration. Which app minted a token
 * determines how it is stored, how it is encrypted, which secret refreshes it,
 * which bucket rate limiting debits and who is billed for the call, so adding
 * it afterwards means touching auth, storage, encryption, rate limiting and
 * billing in one change. It is far cheaper as a union from day one — and being
 * a union rather than a nullable field forces every quota-accounting site to
 * state which pool it is drawing from.
 *
 * There is also a forcing function: platforms have begun mandating BYO keys for
 * aggregators, so on some networks this is the only mode that will exist.
 */
export type ConnectionApp =
  /** Our application. Quota is pooled across all customers on this network. */
  | { readonly kind: 'shared'; readonly appId: PlatformAppId }
  /** The customer's own application. Quota, and any platform sanction, are theirs alone. */
  | {
      readonly kind: 'byo_app';
      readonly appId: PlatformAppId;
      readonly ownerOrganizationId: OrganizationId;
    };

/**
 * The account as the network itself describes it.
 *
 * Cached deliberately rather than fetched for display. After a token is revoked
 * we can no longer ask the platform who it belonged to, and an offboarding
 * audit record naming only an opaque numeric id cannot be read by the human who
 * has to sign it off.
 */
export interface RemoteAccount {
  readonly id: RemoteId;
  readonly displayName: string;
  /** The @-name, where the network has a distinct one. */
  readonly handle?: string | undefined;
  /**
   * The account class the network reports. Instagram's personal/creator/business
   * split decides whether publishing is possible at all, so it is not cosmetic.
   */
  readonly accountType?:
    | 'personal'
    | 'creator'
    | 'business'
    | 'page'
    | 'channel'
    | 'location'
    | 'group'
    | undefined;
  readonly avatarUrl?: string | undefined;
}

/**
 * The human who granted the credential and the authority they held when they
 * did.
 *
 * Kept because the commonest connection failure is not a bad token: it is a
 * real token granted by someone holding Editor rather than Admin on the Page.
 * Nothing about the token itself reveals that, so it has to be recorded at
 * grant time or the diagnosis is impossible later.
 */
export interface GrantingPrincipal {
  /** Our user, when an agency seat performed the connect. */
  readonly userId?: UserId | undefined;
  /** The granting identity on the network, for connects done by a client with no seat. */
  readonly remoteUserId?: RemoteId | undefined;
  /** The platform's own role string, kept verbatim — 'ADMIN', 'EDITOR', 'MANAGER'. */
  readonly platformRole?: string | undefined;
}

/**
 * A self-hosted or federated host.
 *
 * On the fediverse and on self-hosted blogs the client credentials belong to
 * the *host*, not to the user, so two accounts on two Mastodon instances cannot
 * share an app registration. Treating the host as part of the connection is
 * what keeps that a base case rather than a per-network hack.
 */
export interface InstanceInfo {
  readonly url: string;
  /** Reported server software and version, where it is advertised. */
  readonly software?: string | undefined;
}

/**
 * One authorised route from us to one place on one network.
 *
 * The credential itself is absent by design: this carries a `credentialId` that
 * the vault resolves at the moment of the call. Connections are logged, cached,
 * passed between services and serialised into job payloads, and a plaintext
 * token on such an object leaks into all of those places at once.
 */
export interface Connection {
  readonly id: ConnectionId;
  readonly organizationId: OrganizationId;
  readonly network: NetworkId;
  /** Our profile this connection serves. Several connections may serve one profile. */
  readonly profileId: SocialProfileId;
  /** Reference into the token vault. Never the secret. */
  readonly credentialId: CredentialId;
  readonly kind: CredentialKind;
  readonly app: ConnectionApp;
  readonly account: RemoteAccount;
  /**
   * The destination this connection publishes to, where the network has
   * sub-destinations. Bound per connection rather than chosen per post: one
   * auth can yield hundreds of Google Business locations, and two LinkedIn
   * Pages under one grant must be separately targetable and separately
   * tailorable.
   */
  readonly destinationId?: DestinationId | undefined;
  /**
   * Scopes the platform actually granted, as returned — not the ones we asked
   * for. Users deselect permissions on the consent screen, and platforms
   * silently drop scopes an app is not approved for, so the requested set is
   * not evidence of anything.
   */
  readonly scopes: readonly string[];
  readonly instance?: InstanceInfo | undefined;
  readonly grantedBy?: GrantingPrincipal | undefined;
  readonly grantedAt: Date;
  /** Expiry as the platform stated it, where it states one. */
  readonly expiresAt?: Date | undefined;
  /**
   * When we expect this to stop working, which is often sooner than
   * `expiresAt`. Some networks impose a hard re-consent wall regardless of
   * refresh activity, and others expire the refresh token rather than the
   * access token. Those are policy facts about the network, not fields on the
   * token, so they have to be predicted and stored separately — and it is the
   * prediction, not the stated expiry, that a repair link should be scheduled
   * against.
   */
  readonly predictedExpiryAt?: Date | undefined;
  readonly lastProbedAt?: Date | undefined;
  /** Set once revoked upstream. A connection is never silently deleted. */
  readonly revokedAt?: Date | undefined;
}

/**
 * ── Probes must never refresh ────────────────────────────────────────────────
 *
 * A probe is a read-only identity call and nothing else. It must not refresh a
 * token, not even when the token looks close to expiry and a refresh seems
 * helpful.
 *
 * Several networks — X and TikTok among them — issue single-use refresh tokens:
 * exchanging one invalidates it and returns a replacement. If a scheduled
 * health check performs that exchange at the same moment the publish path does,
 * one of the two writes back a refresh token the platform has already retired.
 * From then on every refresh fails, and an account that was working perfectly
 * is disconnected by the very check meant to protect it. The failure looks like
 * a platform outage, arrives in bulk when the health sweep runs, and is
 * unreproducible by hand.
 *
 * So refresh belongs on exactly one path, driven by the publisher, serialised
 * per connection. `HealthReport` therefore reports a token as expiring or
 * expired rather than quietly fixing it — reporting is cheap and reversible,
 * and a speculative repair is neither.
 */

/** The distinct states a connection can be found in by a read-only probe. */
export type HealthStatus =
  /** Valid, sufficiently scoped, and the account is postable to. */
  | 'healthy'
  /** Still valid, but inside the window where we should be repairing it. */
  | 'expiring'
  /** Past expiry. Recoverable by refresh on the publish path, or by re-consent. */
  | 'expired'
  /**
   * Killed at the platform — the user disconnected our app, changed their
   * password, or an admin removed us. Distinct from `expired` because no
   * refresh can help and only a human re-grant will do.
   */
  | 'revoked'
  /**
   * The token works, but does not carry a scope some operation needs. Usually
   * means the platform added a required scope, or the granting user unticked
   * one. The account is not broken, so telling the user to reconnect is the
   * wrong instruction.
   */
  | 'scope_insufficient'
  /**
   * Credentials are fine; the account is suspended, appeal-locked, region-
   * blocked or otherwise not postable to. Nothing we or the customer can do to
   * the connection changes this.
   */
  | 'account_restricted'
  /**
   * The probe could not reach a verdict — the network was down, or answered in
   * a way we do not recognise. Explicitly not `healthy`: assuming health from a
   * failed check is how a dead connection stays green for a week.
   */
  | 'unknown';

/** The outcome of one read-only probe of a connection. */
export interface HealthReport {
  readonly status: HealthStatus;
  /**
   * When the probe ran. Every consumer needs this: a report with no age is
   * indistinguishable from a fresh one, and a stale green is worse than a red.
   */
  readonly checkedAt: Date;
  /**
   * Shown to the person who has to act. Written in terms of what is wrong and
   * what happens next, never as a restatement of an API error, and never
   * containing tokens or PII.
   */
  readonly message: string;
  readonly expiresAt?: Date | undefined;
  readonly predictedExpiryAt?: Date | undefined;
  /**
   * Scopes an operation needs that this token does not carry. Present on
   * `scope_insufficient`, and the difference between "reconnect" and a
   * re-consent that asks for exactly the missing permission.
   */
  readonly missingScopes?: readonly string[] | undefined;
  /** The platform's own code, kept verbatim for support. */
  readonly platformCode?: string | undefined;
  /** The platform's own message, kept verbatim. May contain platform jargon. */
  readonly platformMessage?: string | undefined;
}

/**
 * Who is able to fix a failing precondition.
 *
 * Recorded because most preconditions cannot be fixed by the person looking at
 * the screen. An agency operator cannot make themselves an admin of a client's
 * Page, and routing the task to the wrong human is how a broken connection sits
 * untouched for a fortnight.
 */
export type RemediationActor =
  /** Us, or the agency operating the account. */
  | 'agency'
  /** Someone holding admin rights on the client's page or account. */
  | 'client_page_admin'
  /** The owner of the underlying account or business portfolio. */
  | 'client_account_owner'
  /** Only the platform can resolve it — review, appeal, region approval. */
  | 'platform';

/**
 * One verifiable precondition for publishing, checked independently.
 *
 * A connection's readiness is not one boolean. "Can publish to this Page"
 * decomposes into: the Instagram account is a Professional account, it is
 * linked to a Facebook Page, that Page sits in a Business Portfolio, our app
 * holds `pages_manage_posts`, and the granting human is an Admin rather than an
 * Editor. Any one of those can fail on its own, and each fails for a different
 * reason with a different fix and a different person to perform it.
 *
 * Collapsing them into a single flag produces "reconnect your account", which
 * is not an instruction — the user reconnects, the same precondition fails
 * again, and they conclude the product is broken. Enumerating them produces
 * "ask the Page admin to grant the pages_manage_posts permission", which is a
 * task someone can complete. It is also the only form in which readiness can be
 * checked *before* a campaign rather than discovered at publish time.
 */
export interface ConnectionAssertion {
  /** Stable machine key, e.g. 'ig_is_professional' or 'page_role_is_admin'. */
  readonly key: string;
  /** Short human statement of what was checked, phrased as the desired state. */
  readonly label: string;
  /**
   * `unknown` is a real outcome, not a failure to check: some preconditions are
   * unverifiable without an API we lack, and claiming a pass we did not observe
   * is worse than admitting the gap.
   */
  readonly outcome: 'pass' | 'fail' | 'unknown';
  /**
   * Whether publishing is impossible while this fails, as opposed to degraded.
   * Drives whether the UI blocks scheduling or merely warns.
   */
  readonly blocking: boolean;
  readonly checkedAt: Date;
  /** What we observed, when it helps the reader understand the verdict. */
  readonly detail?: string | undefined;
  /** The concrete next action, naming the platform's own UI terms. */
  readonly remediation?: string | undefined;
  readonly remediationActor?: RemediationActor | undefined;
  /** Deep link into the platform's settings page where the fix is performed. */
  readonly remediationUrl?: string | undefined;
}

/**
 * How a revocation attempt ended at the platform.
 *
 * `no_endpoint` and `refused` are deliberately not failures to hide. A receipt
 * that cannot claim upstream revocation must say so plainly, because the whole
 * value of the record is that it is honest about what we could and could not
 * prove.
 */
export type RevocationOutcome =
  /** The platform accepted an explicit revoke call. The grant is gone. */
  | 'revoked_upstream'
  /** The platform reported the credential already unknown or invalid. Equally final. */
  | 'already_invalid'
  /** The network publishes no revocation endpoint; the grant can only be removed by the user. */
  | 'no_endpoint'
  /** The endpoint exists and rejected us. The grant may well still be live. */
  | 'refused';

/**
 * Evidence that a credential was destroyed at the platform, not merely dropped
 * from our database.
 *
 * Deleting our row deletes our copy of the key, not the lock. The grant stays
 * live on the platform for as long as its natural lifetime, which means an
 * offboarded client's account remains reachable by credentials we issued and
 * still hold in backups, logs and replicas. If that client asks us to prove
 * their data is no longer accessible, a deleted row proves nothing — the
 * absence of a record is not evidence of an action.
 *
 * So offboarding calls the platform's revoke endpoint and keeps what came back.
 * The receipt outlives the connection, and where the platform offers no
 * revocation endpoint at all, it records that fact explicitly so the customer
 * can be told the truth and asked to revoke from their side.
 */
export interface RevocationReceipt {
  readonly connectionId: ConnectionId;
  readonly credentialId: CredentialId;
  readonly network: NetworkId;
  readonly outcome: RevocationOutcome;
  /** When we called the platform, not when we deleted our row. */
  readonly revokedAt: Date;
  /** The endpoint called, so an auditor can check we called the right one. */
  readonly endpoint?: string | undefined;
  /** HTTP status returned, kept as the primary artefact of the exchange. */
  readonly httpStatus?: number | undefined;
  /** The platform's response body, truncated and stripped of secrets. */
  readonly platformResponse?: string | undefined;
  /**
   * Result of a read-only probe run *after* revoking, where the network allows
   * one. A revoke call that returns 200 and leaves a working token is not
   * unheard of, and this is the only way to catch it.
   */
  readonly confirmedDeadAt?: Date | undefined;
  /** Human-readable summary for the offboarding audit record. */
  readonly message: string;
}

/**
 * A step in a connection flow that is not a redirect.
 *
 * Not every network hands us a consent URL. A fediverse or self-hosted host
 * cannot be redirected to until we know which host it is, and registering a
 * client there requires the URL first. Others expect a token generated by hand
 * in a developer console and pasted in, or require the user to switch something
 * on in the platform's own settings before consent will even be offered.
 *
 * Returning these as data rather than a per-network wizard is what keeps the
 * connect UI generic: it renders whatever steps the adapter names, and a new
 * network with an unusual flow needs no front-end work.
 */
export type Instruction =
  /**
   * Ask the user for a value we need before the flow can continue. The answer
   * comes back through `AuthContext.inputs` and `beginAuth` is called again —
   * for a self-hosted host, that second call is the one that can redirect,
   * because by then the client can be registered.
   */
  | {
      readonly kind: 'collect_input';
      /** Key the answer is returned under in `AuthContext.inputs`. */
      readonly field: string;
      readonly label: string;
      readonly inputType: 'url' | 'text';
      readonly placeholder?: string | undefined;
      /** Client-side format check, to catch a typo before a network round trip. */
      readonly pattern?: string | undefined;
      readonly help?: string | undefined;
    }
  /**
   * Ask for a value that must never be echoed back, logged, or stored outside
   * the vault — a pasted access token or app password. Separate from
   * `collect_input` so that secrecy is a property of the type rather than a
   * flag every renderer has to remember to honour.
   */
  | {
      readonly kind: 'collect_secret';
      readonly field: string;
      readonly label: string;
      readonly help?: string | undefined;
    }
  /**
   * Something the user must do in the platform's own interface before we can
   * proceed: enable advanced features, create a developer app, verify a
   * location. We cannot perform it or observe it directly.
   */
  | {
      readonly kind: 'external_action';
      readonly label: string;
      readonly detail: string;
      readonly url?: string | undefined;
    };

/**
 * Everything an adapter needs to start or finish a connection flow.
 *
 * One context serves both halves of the flow. The alternative — separate begin
 * and complete contexts — falls apart on the networks that need several passes
 * through `beginAuth`, where the second pass is the first one plus the answers
 * collected in between.
 */
export interface AuthContext {
  readonly network: NetworkId;
  readonly organizationId: OrganizationId;
  /**
   * Which app to authorise against. Chosen before the flow begins, because the
   * consent screen the user sees is the customer's own app under BYO and
   * switching afterwards means asking them to consent twice.
   */
  readonly app: ConnectionApp;
  /** Scopes to request. What is actually granted is read back off the response. */
  readonly requestedScopes: readonly string[];
  readonly redirectUri: string;
  /** Opaque anti-forgery value. Must be compared on return, never trusted from the query string. */
  readonly state: string;
  /** PKCE verifier, on networks that require it. */
  readonly codeVerifier?: string | undefined;
  /** Known host for a federated or self-hosted flow, once collected. */
  readonly instance?: InstanceInfo | undefined;
  /**
   * Answers to `collect_input` and `collect_secret` instructions, keyed by
   * `field`. Typed as strings rather than a per-network shape so the transport
   * stays generic; the adapter that asked for them is the one that reads them.
   */
  readonly inputs?: Readonly<Record<string, string>> | undefined;
  /**
   * Query parameters the platform sent back to `redirectUri`. Untrusted input
   * from a third party — validate before use.
   */
  readonly callbackParams?: Readonly<Record<string, string>> | undefined;
  /**
   * Set when this flow repairs one specific broken connection rather than
   * connecting something new. A repair link is scoped to a single profile and
   * must not silently attach a different account than the one it was sent for.
   */
  readonly repairing?: ConnectionId | undefined;
  /** The identity performing the grant, when we know it. */
  readonly initiatedBy?: GrantingPrincipal | undefined;
}

/**
 * Whether this connection draws on quota shared with every other customer.
 *
 * The rate limiter needs this to pick a bucket: shared-app calls are debited
 * against a pool, BYO calls against the owning organisation alone.
 */
export function usesSharedApp(connection: Connection): boolean {
  return connection.app.kind === 'shared';
}

/**
 * Whether a publish may be attempted against this connection.
 *
 * `expiring` passes: the token still works, and blocking on a warning would
 * cancel campaigns that would have published fine. Everything else, including
 * `unknown`, does not — an unverified connection is not a working one.
 */
export function isPublishable(health: HealthReport): boolean {
  return health.status === 'healthy' || health.status === 'expiring';
}

/**
 * The preconditions that make publishing impossible, worst first in the sense
 * that only definite failures are returned.
 *
 * `unknown` assertions are excluded deliberately: they are worth showing a
 * human, but blocking a campaign on a check we were unable to perform punishes
 * the customer for our missing API coverage.
 */
export function blockingFailures(
  assertions: readonly ConnectionAssertion[],
): readonly ConnectionAssertion[] {
  return assertions.filter((a) => a.blocking && a.outcome === 'fail');
}

/**
 * Whether a receipt actually proves the upstream grant is gone.
 *
 * Only two outcomes do. A missing endpoint or a refused call means the grant
 * may still be live, and an offboarding report must not claim otherwise.
 */
export function provesUpstreamRevocation(receipt: RevocationReceipt): boolean {
  return receipt.outcome === 'revoked_upstream' || receipt.outcome === 'already_invalid';
}
