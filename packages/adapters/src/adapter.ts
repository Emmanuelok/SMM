import type { PublishFailure, RemoteId, Result } from '@smm/shared';

import type { PlatformCapabilities } from './capabilities.js';
import type {
  AuthContext,
  Connection,
  ConnectionAssertion,
  DestinationId,
  HealthReport,
  Instruction,
  RevocationReceipt,
} from './connection.js';
import type { PostFormat, ResolvedTarget } from './content.js';
import type { Destination, DestinationRule } from './destinations.js';
import type { Archetype, IdempotencyKey, PublishHandle, PublishPhase } from './lifecycle.js';
import type { DateRange, PostVisibility, RawMetric } from './metrics.js';
import type { NetworkId } from './networks.js';
import type { ValidationContext, ValidationReport } from './validation.js';

/**
 * The contract every network integration implements.
 *
 * Keeping this narrow is still the point. Networks differ enormously and the
 * temptation is to leak each one's quirks upward into the scheduler; instead
 * they live in two places only — the capability descriptor, which is data, and
 * the adapter implementation, which is the sole owner of that network's HTTP
 * calls. Nothing above this interface knows what an Instagram container id is.
 *
 * Three things changed from the single-`publish()` version this replaces, and
 * each of them was forced by a failure the old shape could not represent.
 *
 * ── The unit of authorisation is a `Connection`, not a credential ────────────
 *
 * Every verb takes a `Connection` rather than a bag of decrypted tokens. A
 * connection carries a `credentialId` that the vault resolves at the moment of
 * the call, so the object that gets logged, cached, queued and serialised into
 * job payloads never contains a secret. It also carries the things a token
 * cannot tell you — which developer app minted it and therefore whose quota
 * this call spends, which destination underneath the account it publishes to,
 * and who granted it with what platform role. Those are exactly the facts
 * needed to explain a failure, and none of them survive being reduced to an
 * access token string.
 *
 * ── Publishing is several verbs, because the domain has several ──────────────
 *
 * On Meta, TikTok, Pinterest, LinkedIn and YouTube a publish genuinely is
 * several separate conversations with the platform: hand over content, push
 * bytes a chunk at a time where the upload is resumable, wait out an
 * indeterminate transcode, then make the thing public. A single blocking
 * call holds a worker for the whole transcode — starving the queue at precisely
 * the busiest hour — and keeps the only record of the in-flight work in one
 * process's memory, where a deploy destroys it. See `lifecycle.ts` for the full
 * argument and for `PublishHandle`, the durable record that lets a different
 * worker on a different machine walk back to work it never started.
 *
 * ── Errors are values, and are interpreted exactly once ──────────────────────
 *
 * `classify` is the only function in the system permitted to read a platform's
 * error strings. See its own documentation for why that is a hard rule rather
 * than a stylistic preference.
 *
 * ── Which verbs return `Result` and which may throw ──────────────────────────
 *
 * The verbs that can create or publish something — `submit`, `finalize`,
 * `cancel`, `comment`, `deletePost`, `refresh` — return a
 * `Result`, because their failure is a fact the retry ledger has to record
 * against a specific attempt, and an exception escaping one of those loses the
 * one thing that knows a publish is in flight.
 *
 * The read-only verbs — `poll`, `readBack`, `probe`, `listDestinations`,
 * `fetchMetrics` — may throw a transport error, and the caller runs `classify`
 * on it. That asymmetry is deliberate: wrapping a read in a `Result` obliges
 * every call site to unwrap something that carries no safety property, whereas
 * a write must never leave the ledger guessing.
 *
 * ── Why there is no `AbortSignal` on these signatures ────────────────────────
 *
 * Cancelling a scheduled post mid-flight is handled between verbs, not inside
 * one. That is the whole reason the work is cut this way: each verb is short by
 * construction, so the scheduler's cancellation point is the gap before the
 * next call rather than an interrupt in the middle of a transcode.
 *
 * A large upload is the case that would otherwise force a long-running call,
 * and `advance` is what keeps it short: it pushes one chunk and returns, so a
 * gigabyte moves as a sequence of interruptible steps whose progress survives
 * the worker. Threading a signal through a contract the other sixty networks do
 * not need would buy nothing.
 *
 * ── The inbound and review read surface is deliberately absent ───────────────
 *
 * `fetchInbound` and `fetchReviews` are named in the upgrade spec and are not
 * here yet, because their payload types are not a detail of this contract.
 * "Review" means five materially different things across Google Business,
 * Trustpilot, Yelp, the app stores and Facebook — ratings that are stars on one
 * source, a thumbs up/down on another and a ten-point scale on a third, bodies
 * that are absent on one and always truncated on another. Declaring a
 * placeholder shape here would fix that model before it is understood, and
 * every adapter written against the placeholder would have to be rewritten.
 * They arrive with the module that owns those types.
 */

/**
 * A consent URL to send the user to.
 *
 * Not every flow can produce one on the first pass — see `AuthInstructions`.
 */
export interface AuthRedirect {
  readonly redirectUrl: string;
}

/**
 * Steps the connect UI must complete before a redirect is possible, or instead
 * of one.
 *
 * A fediverse or self-hosted host cannot be redirected to until we know which
 * host it is, and registering a client there needs the URL first; other
 * networks expect a token pasted from a developer console, or a setting
 * switched on in the platform's own UI before consent is even offered. The
 * adapter names the steps as data and the generic connect UI renders them, so a
 * new network with an unusual flow costs no front-end work.
 */
export interface AuthInstructions {
  readonly instructions: readonly Instruction[];
}

/** What `beginAuth` can hand back: somewhere to send the user, or work to do first. */
export type AuthStart = AuthRedirect | AuthInstructions;

/**
 * Narrow an `AuthStart`.
 *
 * A helper rather than a `kind` discriminant on the two arms, because they are
 * already disjoint by shape: adding a discriminant would put a second,
 * redundant answer to "which arm is this" into every adapter that constructs
 * one, and the two answers can disagree. A named guard also gives the connect
 * UI one place to change if a third arm ever appears.
 */
export function isAuthRedirect(start: AuthStart): start is AuthRedirect {
  return 'redirectUrl' in start;
}

/**
 * A post that is live, and the identifiers needed to find it again.
 *
 * `publishedAt` is the platform's own timestamp where it returns one, not our
 * clock. Reporting uses it, and a post recorded an hour off because our worker
 * stamped it after a slow finalize is a discrepancy nobody can later explain.
 */
export interface PublishSuccess {
  readonly remotePostId: RemoteId;
  /** Public permalink, where the network returns one. */
  readonly url?: string | undefined;
  readonly publishedAt: Date;
  /**
   * Set when a first comment was requested and posted.
   *
   * Absent is not a failure: on the networks with no comment-write API the
   * composer already warned that the first comment would be skipped.
   */
  readonly firstCommentId?: RemoteId | undefined;
}

export interface PlatformAdapter {
  readonly network: NetworkId;
  /**
   * The publish flows this network uses, by format.
   *
   * Not one value per adapter, because for several networks the flow depends on
   * what is being posted. A Facebook text post is a single call, while a
   * Facebook Reel is a chunked upload; a Pinterest image pin is one call and a
   * Pinterest video is upload-then-poll-then-create; TikTok differs between
   * `PULL_FROM_URL` and `FILE_UPLOAD`. Declaring one archetype per adapter
   * forces a wrong answer for one of them, and both wrong answers are bad: a
   * text post treated as resumable gets a `finalize` call it must not receive,
   * which is the double-post, while a Reel treated as single-shot is never
   * finalized and silently never appears.
   *
   * This is advisory, for planning work before anything has been submitted.
   * Once a handle exists its own discriminant is authoritative, since it
   * describes the flow the platform actually gave us rather than the one we
   * predicted.
   */
  readonly archetypes: Readonly<Partial<Record<PostFormat, Archetype>>>;

  /**
   * What this network can do — for this connection, right now.
   *
   * Async and connection-aware, which looks like overkill until you try to
   * write the static version. A static descriptor is a claim about a network,
   * and for two large classes of network that claim is not true of every
   * customer:
   *
   *  - Mastodon has no single answer. `max_toot_chars` is set per instance and
   *    routinely differs from the 500 everyone assumes; attachment counts,
   *    accepted MIME types and poll limits are all per host. A composer that
   *    validates a 900-character post against a hardcoded 500 refuses content
   *    that instance would have accepted, and one that assumes 500 everywhere
   *    truncates for no reason.
   *  - Several networks vary by the customer's own plan. Vimeo, Flickr and
   *    Trustpilot gate formats and endpoints behind their paid tiers, so the
   *    same code path is supported for one tenant and `plan_insufficient` for
   *    the next.
   *
   * Passing the connection lets the adapter answer for the instance the token
   * belongs to and the plan that account holds. Omitting it asks for the
   * network's general shape, which is the right question for a marketing page
   * or a network picker and the wrong one for validating a draft.
   *
   * Implementations are expected to cache. This is called from the composer on
   * a keystroke, and a per-instance fetch on every call would spend the rate
   * limit the publish path needs.
   */
  capabilities(conn?: Connection): Promise<PlatformCapabilities>;

  /* ---------------------------------------------------------------------- */
  /* Auth                                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Start a connection flow.
   *
   * May be called more than once for one connection. A network that needs a
   * host or a pasted secret first returns `AuthInstructions`; the answers come
   * back in `AuthContext.inputs` and this is called again, and that second call
   * is the one that can redirect, because by then the client is registered.
   */
  beginAuth(ctx: AuthContext): Promise<AuthStart>;

  /**
   * Finish a connection flow — and return every connection it produced.
   *
   * Plural, and this is the single most consequential signature in the package.
   * One authorisation routinely yields many places to publish: a Google
   * Business Profile grant returns every location the granting human manages,
   * which for a franchise is hundreds; a Meta grant returns every Page under
   * the Business Portfolio, each with a possible Instagram professional account
   * behind it; a LinkedIn token returns the member plus every organisation they
   * administer; a Discord bot token returns every channel in every guild.
   *
   * Returning one connection per auth is the error that makes multi-location
   * and franchise customers unservable. The first location wins, the other 349
   * are invisible, and the only workaround is to re-authorise once per location
   * with a separate login — which is precisely the manual work the product
   * exists to remove. It is also expensive to undo later, because by then every
   * post, metric and permission row is keyed to the connection rather than to
   * the place the post went.
   *
   * Networks with nothing beneath the account return a single-element array
   * rather than a bare connection, so the caller never branches on "does this
   * network have destinations" — a branch that would otherwise appear in every
   * adapter and every screen.
   */
  completeAuth(ctx: AuthContext): Promise<readonly Connection[]>;

  /**
   * Exchange a refresh token for a live one, returning the updated connection.
   *
   * OPTIONAL, and absent wherever there is no bearer token to exchange:
   *
   *  - `bot_token` networks — Telegram and Discord — issue an identity that
   *    never expires and publish no refresh endpoint at all.
   *  - `oauth1a` networks sign every request from a secret we keep
   *    indefinitely, so nothing is ever exchanged.
   *  - `api_key`, `basic_app_password` and `webhook_url` credentials are minted
   *    from a settings page and are replaced by a human, not by a call.
   *  - Mastodon's tokens do not expire by default on most instances.
   *
   * Where it exists, it is the ONLY path that may perform a refresh, and it
   * must be serialised per connection. X and TikTok issue single-use refresh
   * tokens: exchanging one retires it and returns a replacement, so two
   * concurrent refreshes leave us holding a token the platform has already
   * invalidated and every subsequent refresh fails. That is why `probe` is
   * read-only — see below.
   */
  refresh?(conn: Connection): Promise<Result<Connection, PublishFailure>>;

  /**
   * Destroy the grant at the platform and return evidence that we did.
   *
   * Not optional, and not a row delete. Deleting our row deletes our copy of
   * the key, not the lock: the grant stays live for its natural lifetime, so an
   * offboarded client's account remains reachable by credentials we issued and
   * still hold in backups, logs and replicas. If that client asks us to prove
   * their data is no longer accessible, an absent record proves nothing.
   *
   * It stays required even on the networks that publish no revocation endpoint,
   * because `RevocationOutcome` has a `no_endpoint` arm and saying so plainly is
   * the honest receipt. A customer who must revoke from their side needs to be
   * told that, and an optional method would let it be silently skipped.
   */
  revoke(conn: Connection): Promise<RevocationReceipt>;

  /**
   * Read-only identity call. NEVER a speculative refresh.
   *
   * This is a hard rule with a specific failure behind it. If a scheduled
   * health check refreshes a token that looks close to expiry at the same
   * moment the publish path does, one of the two writes back a refresh token
   * that X or TikTok has already retired, and an account that was working
   * perfectly is disconnected by the very check meant to protect it. The
   * symptom arrives in bulk when the health sweep runs, looks exactly like a
   * platform outage, and cannot be reproduced by hand.
   *
   * So a probe reports `expiring` or `expired` and stops there. Reporting is
   * cheap and reversible; a speculative repair is neither.
   */
  probe(conn: Connection): Promise<HealthReport>;

  /**
   * Enumerate what this token actually grants, one precondition at a time.
   *
   * Readiness is not one boolean. "Can publish to this Page" decomposes into:
   * the Instagram account is a Professional account, it is linked to a Facebook
   * Page, that Page sits in a Business Portfolio, our app holds
   * `pages_manage_posts`, and the granting human is an Admin rather than an
   * Editor. Each can fail alone, each has a different fix, and each fix is
   * performed by a different person.
   *
   * Collapsed into one flag they produce "reconnect your account", which is not
   * an instruction: the user reconnects, the same precondition fails, and they
   * conclude the product is broken. Enumerated, they produce "ask the Page
   * admin to grant the pages_manage_posts permission", which somebody can
   * actually complete — before a campaign rather than at publish time.
   */
  assertReadiness(conn: Connection): Promise<readonly ConnectionAssertion[]>;

  /* ---------------------------------------------------------------------- */
  /* Destinations                                                            */
  /* ---------------------------------------------------------------------- */

  /**
   * Every place this connection can publish to.
   *
   * Includes destinations that are not currently postable, with
   * `notPostableReason` set. An unverified Google Business location or a Page
   * where the granting human holds Editor must appear in the list, greyed out
   * and explained, or the user concludes the connection failed and reconnects
   * it repeatedly to no effect.
   */
  listDestinations(conn: Connection): Promise<readonly Destination[]>;

  /**
   * Fetch this destination's own rules, live.
   *
   * Not a compiled-in table, and the distinction matters. The capability
   * descriptor states facts about a network that change a few times a year and
   * are the same for every customer. Destination rules are set by whoever runs
   * the destination — a subreddit's moderators, a board's owner, an
   * organisation's admin — and change without announcement or any version we
   * could pin to. A subreddit can add a mandatory flair at 2am and there is no
   * changelog. A static copy of these would not merely be incomplete, it would
   * confidently state a constraint that is no longer true.
   *
   * Callers cache the result with a short TTL; see `DestinationRuleSet`.
   */
  destinationRules(conn: Connection, dest: DestinationId): Promise<readonly DestinationRule[]>;

  /* ---------------------------------------------------------------------- */
  /* Publish — five verbs                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Pre-flight the post. No platform write happens here.
   *
   * The context is what makes this real rather than a repeat of the static
   * check: the connection's health, the destination's live rules, what this
   * account has published recently, and how much publish budget is left. A
   * validator that knows only the network's limits passes a draft that will be
   * refused as a duplicate, or aimed at a connection that lost its scope
   * yesterday.
   *
   * Adapters may add network-specific checks here that only a live call can
   * answer — Reddit's `post_requirements`, an instance's `max_toot_chars` — and
   * should return the base report unchanged when they have nothing to add.
   */
  validate(
    conn: Connection,
    target: ResolvedTarget,
    ctx: ValidationContext,
  ): Promise<ValidationReport>;

  /**
   * Create the remote work: a container, an upload session, or the post itself.
   *
   * Returns a handle durable enough to survive the worker that made it. The
   * handle must be persisted before the next call, not after the flow
   * succeeds — the whole point is that a crash between two verbs leaves
   * something that can answer "did that post go out".
   *
   * `idem` is derived from the content, so an ambiguous timeout — request
   * landed, response did not — replays to one post rather than two. See
   * `idempotencyKeyFor`.
   */
  submit(
    conn: Connection,
    target: ResolvedTarget,
    idem: IdempotencyKey,
  ): Promise<Result<PublishHandle, PublishFailure>>;

  /**
   * Ask the platform whether its own processing has finished.
   *
   * Read-only, repeatable and cheap; the platform is authoritative and the
   * handle's stored phase is only a cache of the last answer.
   *
   * Returns the full `PublishPhase` including `expired`, which the four-state
   * list in the upgrade spec cannot express. An Instagram container that dies
   * before we publish it is neither pending nor rejected: the content was never
   * judged, so reporting it as rejected tells the user to fix a file nothing
   * was wrong with, and the remedy is a fresh submit rather than a retry of the
   * publish call.
   */
  poll(conn: Connection, handle: PublishHandle): Promise<PublishPhase>;

  /**
   * Push the next part of a resumable upload and return the advanced handle.
   *
   * OPTIONAL, and required precisely by the networks whose uploads are chunked:
   * YouTube, LinkedIn video and documents, TikTok's `FILE_UPLOAD`, Facebook
   * Reels and video, Pinterest video.
   *
   * Without this verb a resumable upload is durable in its data and not in its
   * control flow. A handle sitting at a partial byte offset on a different
   * machine after a deploy would have no method to call: `submit` takes no
   * handle, so calling it again opens a second session and re-sends the whole
   * file — on YouTube that also re-spends 1,600 quota units. The alternative,
   * having `submit` block until the upload completes, is the very thing
   * splitting publish into separate verbs exists to avoid.
   *
   * The adapter chooses the chunk size and returns the handle with its
   * confirmed offset moved on, and its phase moved to `ready` once the platform
   * has everything. The caller loops while the phase is still `pending`.
   */
  advance?(
    conn: Connection,
    handle: PublishHandle,
    target: ResolvedTarget,
  ): Promise<Result<PublishHandle, PublishFailure>>;

  /**
   * Turn accepted work into a public post.
   *
   * Takes the target as well as the handle, because on several networks this
   * call is where the content itself goes. A Pinterest video is uploaded first
   * and the pin created afterwards, carrying the title, description, link, alt
   * text and board id; LinkedIn finalises an upload to a URN and then posts the
   * commentary separately; a Facebook Reel's finish step carries its publish
   * state. Passing only the handle would force all of that to be serialised
   * into the handle itself — a 3,000-character LinkedIn commentary living in a
   * base64 blob in a database column — or make those formats unpublishable.
   *
   * The only verb that can double-post, so it is the only one whose
   * preconditions are worth restating: the caller must have observed a phase
   * that permits it (`canTransition`), and on a `single_shot` flow there is
   * nothing to finalize at all — submit already produced the post, and calling
   * this as though it were a publish step is the double-post.
   */
  finalize(
    conn: Connection,
    handle: PublishHandle,
    target: ResolvedTarget,
  ): Promise<Result<PublishSuccess, PublishFailure>>;

  /**
   * Abandon in-flight work so the platform stops holding it.
   *
   * OPTIONAL, and absent on most networks because most offer no way. Instagram
   * and Threads containers cannot be cancelled — they are simply abandoned and
   * expire 24 hours later, still counting against quota in the meantime — and
   * an unused X media handle lapses the same way. It exists where a session can
   * genuinely be torn down: YouTube's resumable upload and TikTok's publish
   * job.
   *
   * Where it is absent, the caller lets the handle expire and records that it
   * did. Where it exists, calling it returns quota that would otherwise be
   * held, which on YouTube's 1,600-unit-per-upload budget is worth the call.
   */
  cancel?(conn: Connection, handle: PublishHandle): Promise<Result<void, PublishFailure>>;

  /**
   * Post a comment on a post we own — the "first comment" feature.
   *
   * OPTIONAL, and absent wherever the network exposes no comment-write API to
   * third parties: Google Business Profile, Pinterest and TikTok among them.
   * Its absence is not a bug to work around; it is why `first_comment` must not
   * appear in those networks' declared features, so the composer warns while
   * somebody is looking at the screen rather than dropping the comment
   * silently at publish time.
   */
  comment?(
    conn: Connection,
    remotePostId: RemoteId,
    body: string,
  ): Promise<Result<RemoteId, PublishFailure>>;

  /**
   * Remove a published post.
   *
   * OPTIONAL, and absent wherever the network has no delete endpoint —
   * Google Business Profile's older post types, most webhook destinations, and
   * anything published through a reminder, where nothing of ours ever touched
   * the platform. `ReadCapability.deletePost` declares which networks have it;
   * a descriptor field with no verb to act on it would be a dead field.
   */
  deletePost?(conn: Connection, remotePostId: RemoteId): Promise<Result<void, PublishFailure>>;

  /* ---------------------------------------------------------------------- */
  /* Verify                                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Look for a post we believe we published, and report what is actually there.
   *
   * A 200 at publish time is not evidence that a post is live. Networks accept
   * a post and then remove it, restrict its distribution without telling
   * anyone, or fail to finish transcoding hours later.
   *
   * Required rather than optional, because `PostVisibility` has an
   * `unavailable` arm and the networks with no read-back path are exactly the
   * ones where a verification badge would otherwise be decoration. An adapter
   * that cannot check says so, and the UI says so too. Telling a client we do
   * not know is survivable; telling them a post is live when it was taken down
   * a week ago is not.
   */
  readBack(conn: Connection, remotePostId: RemoteId): Promise<PostVisibility>;

  /* ---------------------------------------------------------------------- */
  /* Read — L1 raw only                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Collect metrics exactly as the platform returned them.
   *
   * OPTIONAL, and absent on every network that publishes no analytics to third
   * parties — Telegram and Discord return nothing about a message once it is
   * sent, webhook destinations have no read surface at all, and Mastodon
   * exposes no insights API.
   *
   * Where it exists, it returns `RawMetric` and nothing else: no renaming, no
   * summing, no filling a gap with a plausible substitute. The only moment we
   * know which endpoint produced a number, what the platform called the field
   * and which API version answered is the moment the response arrives, and an
   * adapter that normalises on the way in destroys all three at exactly that
   * point. Normalisation happens above this boundary, or provenance is lost —
   * and provenance is what turns Instagram renaming "impressions" to "views"
   * into a dated annotation on a chart instead of an unexplainable cliff in a
   * number a client has been shown every month for two years.
   */
  fetchMetrics?(
    conn: Connection,
    ids: readonly RemoteId[],
    window: DateRange,
  ): Promise<readonly RawMetric[]>;

  /**
   * Walk historical metrics for a connection, oldest data first.
   *
   * OPTIONAL, and absent almost everywhere, because almost no network lets you
   * walk backwards: most expose a rolling window only — a few weeks of post
   * insights, nothing at all on the cheaper API tiers — and a "backfill" over
   * those is just a fetch. It exists where a genuine archive endpoint does,
   * such as YouTube Analytics.
   *
   * An `AsyncIterable` rather than an array because a backfill is unbounded in
   * a way a fetch is not: a channel with four years of daily figures is
   * millions of readings, and materialising them costs the memory of the
   * process doing it. Yielding batches also means a run that dies halfway has
   * still written everything it yielded.
   *
   * The depth is a `DateRange` rather than a relative duration so that a resumed
   * or re-run backfill covers exactly the span it did last time; "the last two
   * years" means something different depending on when it is evaluated, and a
   * reconciler needs to ask about a fixed window.
   */
  backfill?(conn: Connection, depth: DateRange): AsyncIterable<readonly RawMetric[]>;

  /* ---------------------------------------------------------------------- */
  /* Failure interpretation                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Turn whatever the platform threw at us into a `PublishFailure`.
   *
   * THE ONLY PLACE PLATFORM ERROR STRINGS ARE INTERPRETED. Not "the preferred
   * place" — the only one. No scheduler, retry loop, dashboard query, alert
   * rule or UI component may look at a platform code, match on a message, or
   * branch on an HTTP status. They branch on `FailureKind`, and on the
   * `dispositionOf` and `countsAgainstSla` decisions derived from it.
   *
   * The rule is absolute because the alternative decays predictably. Error
   * matching leaks outward one urgent fix at a time — a substring check in the
   * retry loop for a Meta code that means "already published", a status check
   * in a dashboard — and each copy is written against the platform's behaviour
   * on the day it was written. When the platform rewords a message or splits a
   * code in two, the adapter is updated and the copies are not, because nobody
   * knows they exist. What they then do is the expensive part: an
   * `idempotency_conflict` that stops being recognised is retried, and a retry
   * of an idempotency conflict double-posts to a customer's audience.
   *
   * Concentrating it here also makes the taxonomy improvable. Every
   * `unknown` this returns is a visible gap with one file to fix, rather than a
   * behaviour spread across a codebase.
   *
   * Total by construction: `err` is `unknown` because it may be an `Error`, a
   * parsed JSON body, a string, or something a third-party client threw, and
   * this must return a `PublishFailure` for every one of them — falling back to
   * `kind: 'unknown'`, which is retried once and counts against our own
   * reliability numbers precisely so that leaving it unclassified is not free.
   * It must never throw.
   */
  classify(err: unknown): PublishFailure;
}

/**
 * Registry of live adapter implementations.
 *
 * Deliberately holds implementations rather than descriptors: a network with a
 * capability descriptor and no adapter is a network we can describe and cannot
 * publish to, and `available()` is the question the scheduler actually asks.
 */
export class AdapterRegistry {
  readonly #adapters = new Map<NetworkId, PlatformAdapter>();

  register(adapter: PlatformAdapter): this {
    this.#adapters.set(adapter.network, adapter);
    return this;
  }

  get(network: NetworkId): PlatformAdapter | undefined {
    return this.#adapters.get(network);
  }

  /** Networks with a working implementation, not merely a descriptor. */
  available(): readonly NetworkId[] {
    return [...this.#adapters.keys()];
  }
}
