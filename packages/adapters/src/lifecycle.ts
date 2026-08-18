import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

import type { Brand, PostTargetId, RemoteId, Result } from '@smm/shared';
import { err, ok, remoteId, unsafeId } from '@smm/shared';

import type { NetworkId } from './networks.js';
import { isNetworkId } from './networks.js';

/**
 * The publishing lifecycle: how a post gets from submitted to live, and what
 * has to survive in between.
 *
 * Publishing is five verbs — validate, submit, poll, finalize, cancel — rather
 * than a single `publish()`, because on Meta, TikTok, Pinterest, LinkedIn and
 * YouTube a publish genuinely is three separate conversations with the
 * platform. We hand over content or bytes; the platform transcodes for an
 * indeterminate time, which is seconds for a photo and many minutes for a long
 * video on a queue that is behind; only then does a separate call make the
 * thing public.
 *
 * Collapsing that into one blocking call fails in two ways and both are
 * expensive. It holds a worker for the entire transcode, so a handful of large
 * videos starves every other post in the queue at exactly the hour when the
 * queue is busiest. And it keeps the only record of the in-flight work — the
 * container id, the upload session URI, how many bytes the platform has
 * confirmed — in the memory of one process, so a deploy, a crash or an
 * autoscaler taking that instance away destroys it. What is destroyed is worse
 * than progress: it is the ability to answer "did that post go out", which
 * leaves the pipeline choosing between re-uploading a gigabyte and
 * double-posting to a customer's audience.
 *
 * So the work is cut into verbs a worker can walk away from, and everything
 * needed to walk back to it lives in a `PublishHandle` that is written to the
 * database after every step.
 */

/**
 * The five verbs of a publish, as they appear in logs, the retry ledger and
 * per-step telemetry.
 *
 * Named as a type because "the publish failed" is not an actionable statement.
 * A failure at `submit` means nothing was created and a retry is safe; the same
 * platform error at `finalize` may mean the post is already live and a retry
 * duplicates it. The verb is what separates those two, so it has to be recorded
 * with every attempt rather than reconstructed afterwards.
 */
export type PublishVerb =
  /** Pre-flight checks against declared capabilities and live destination rules. No platform write. */
  | 'validate'
  /** Create the remote work: a container, an upload session, or the post itself. */
  | 'submit'
  /** Ask the platform whether its own processing has finished. Read-only, repeatable, cheap. */
  | 'poll'
  /** Turn accepted work into a public post. The only verb that can double-post. */
  | 'finalize'
  /** Abandon in-flight work so the platform stops holding it. Optional; several networks offer no way. */
  | 'cancel';

/**
 * The shape of a network's publish flow.
 *
 * Every tier-1 platform's publishing API is one of exactly three shapes, which
 * is the reason roughly sixty adapters can share three flows instead of writing
 * sixty. Which archetype a network uses is declared once, on its adapter, and
 * is deliberately not repeated here as a lookup table: a second list of the
 * same fact eventually disagrees with the first.
 *
 * These are publish shapes, not auth shapes. A network's authentication
 * archetype is a separate taxonomy and the two are independent — Telegram is a
 * bot token and a single shot, TikTok is OAuth 2.0 and a chunked upload.
 */
export type Archetype =
  /**
   * One call creates the post. Media, where there is any, was uploaded
   * beforehand and is referenced by handle.
   *
   * X (`media/upload` INIT/APPEND/FINALIZE, then `POST /2/tweets` carrying the
   * media ids), Pinterest image pins, Facebook photos, and every text-only
   * network — Bluesky, Mastodon, Telegram.
   *
   * The trap is that single-shot is not stateless. Media handles are
   * short-lived — X's lapse after roughly 24 hours if unused — so a post held
   * behind an approval or a lateness budget can find its media gone by the time
   * it is released. The adapter has to re-upload rather than report a failure
   * the user cannot act on.
   */
  | 'single_shot'
  /**
   * Create a container, poll it until the platform has finished processing,
   * then publish the container by id.
   *
   * Instagram in every format, Threads, and TikTok when posting via
   * `PULL_FROM_URL`.
   *
   * Meta pulls the media from a URL we host rather than accepting bytes from
   * us, which puts a hard requirement on our own CDN: unauthenticated,
   * range-capable, correctly-typed responses for the whole processing window. A
   * CDN that expires a signed URL after five minutes produces a steady stream
   * of processing failures that look like Meta's fault and are not.
   *
   * Containers expire — 24 hours on Instagram — and an expired container can be
   * neither published nor resumed, only rebuilt. That is why `expired` is a
   * phase rather than a kind of failure: the remedy is "create a new
   * container", which is a different action from "retry the publish call".
   */
  | 'async_container'
  /**
   * Initialise an upload session, push bytes in resumable chunks, then finalize
   * and poll the platform's own processing.
   *
   * Facebook Reels and Stories, LinkedIn images, videos and documents, TikTok
   * `FILE_UPLOAD`, YouTube's resumable `videos.insert`, and Pinterest video.
   *
   * This archetype is what makes a durable handle non-negotiable. We are
   * pushing the bytes, so losing the session means re-sending the whole file
   * over someone else's bandwidth and quota — YouTube charges 1,600 quota units
   * per upload whether or not it ever completes. Resuming needs the session URI
   * and the confirmed byte offset, and LinkedIn's multipart flow additionally
   * needs every part's ETag echoed back at finalize, so all of it has to be
   * durable before the next chunk goes out, not after the upload succeeds.
   */
  | 'resumable_upload';

/** Every archetype, for validating a decoded handle against a closed set. */
export const ARCHETYPES: readonly Archetype[] = [
  'single_shot',
  'async_container',
  'resumable_upload',
];

const ARCHETYPE_SET: ReadonlySet<string> = new Set(ARCHETYPES);

export function isArchetype(value: string): value is Archetype {
  return ARCHETYPE_SET.has(value);
}

/**
 * Whether the flow has a waiting period the pipeline must observe rather than
 * assume away.
 *
 * A worker that skips polling on an archetype that needs it calls finalize
 * against work the platform has not finished, which returns a precondition
 * failure that reads exactly like a transient error and gets retried into a
 * rate limit.
 */
export function requiresPolling(archetype: Archetype): boolean {
  switch (archetype) {
    case 'single_shot':
      return false;
    case 'async_container':
    case 'resumable_upload':
      return true;
  }
}

/**
 * Whether making the post public is a separate call from creating the work.
 *
 * Where this is false, submit already produced the post, and calling finalize
 * as though it were a publish step is the double-post.
 */
export function requiresSeparateFinalize(archetype: Archetype): boolean {
  switch (archetype) {
    case 'single_shot':
      return false;
    case 'async_container':
    case 'resumable_upload':
      return true;
  }
}

/**
 * Where a publish has got to, from our side.
 *
 * This is a state machine and not a status string because the transitions carry
 * the safety properties. Which phase a handle is in decides whether finalize may
 * be called at all, and the illegal transitions are precisely the ones that
 * publish something twice or abandon something that is already live.
 */
export type PublishPhase =
  /**
   * Submitted; the platform is still working. Bytes may still be going up.
   * Nothing exists that anyone outside can see.
   */
  | 'pending'
  /**
   * The platform has finished processing and is waiting for us to finalize.
   *
   * Kept apart from `completed` because nothing is public yet, and apart from
   * `pending` because readiness has a deadline attached: an Instagram container
   * that becomes ready still expires 24 hours after it was created. A handle
   * sitting in `ready` is work we have already paid for and are about to lose.
   */
  | 'ready'
  /**
   * The platform looked at the content and refused it. Terminal.
   *
   * Different in kind from a transport failure: the same bytes will get the
   * same answer, so the only path forward is an edit or a different
   * destination.
   */
  | 'rejected'
  /** The post is live and we hold its remote id. Terminal. */
  | 'completed'
  /**
   * The platform discarded the work before we finalized it. Terminal for this
   * handle only.
   *
   * The post itself has not failed and must not be reported as rejected — the
   * content was never judged. Recovery is a fresh submit, which is why this
   * cannot be folded into `rejected` without telling users to fix a file that
   * nothing was ever wrong with.
   */
  | 'expired';

/** Every phase, for validating a decoded handle against a closed set. */
export const PUBLISH_PHASES: readonly PublishPhase[] = [
  'pending',
  'ready',
  'rejected',
  'completed',
  'expired',
];

const PUBLISH_PHASE_SET: ReadonlySet<string> = new Set(PUBLISH_PHASES);

export function isPublishPhase(value: string): value is PublishPhase {
  return PUBLISH_PHASE_SET.has(value);
}

/**
 * The legal moves, written as a table because every entry is a decision.
 *
 * Self-transitions are legal for the two non-terminal phases and only those.
 * Polling a container that is still transcoding returns `pending` for the tenth
 * time, and that is a normal observation, not an error; polling something we
 * already recorded as `completed` is not, and the check is worth keeping
 * because the caller that does it is usually a worker about to finalize a
 * second time.
 */
const PHASE_TRANSITIONS: Readonly<Record<PublishPhase, readonly PublishPhase[]>> = {
  // `pending` reaches `completed` directly on the flows where the call that
  // finishes the work also returns a live resource — single-shot everywhere,
  // and YouTube, where the final chunk of the upload yields the video. There is
  // no `ready` moment to observe on those, and requiring one would strand them.
  pending: ['pending', 'ready', 'completed', 'rejected', 'expired'],
  // Nothing goes back to `pending`. A regression here would re-arm finalize
  // against a container we may already have published, and re-arming finalize
  // is how the same video appears on a channel twice. When a platform appears
  // to flap backwards, the far likelier explanation is that we polled the wrong
  // id, and that is a bug to surface rather than a state to accommodate.
  ready: ['ready', 'completed', 'rejected', 'expired'],
  // Terminal. A publish that has been judged, published or discarded does not
  // reopen; the next attempt is a new handle with a new idempotency key, so
  // that the ledger keeps both attempts instead of overwriting the first.
  rejected: [],
  completed: [],
  expired: [],
};

/** Whether a phase change is one the machine allows. */
export function canTransition(from: PublishPhase, to: PublishPhase): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}

/**
 * Whether a phase is an end state.
 *
 * Derived from the transition table rather than listed separately, so the two
 * cannot drift apart when a phase is added.
 */
export function isTerminalPhase(phase: PublishPhase): boolean {
  return PHASE_TRANSITIONS[phase].length === 0;
}

/**
 * The value sent to a platform so that the same publish, attempted twice, does
 * not produce two posts.
 *
 * Branded because it is a derived value with rules attached and must never be
 * confused with the content hash it is derived from — one is safe to show a
 * third party, the other identifies our own content across the system.
 */
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>;

/** Format marker on every key, so a key from an older derivation is recognisable in a platform's logs. */
const IDEMPOTENCY_KEY_VERSION = 'k1';

/**
 * How much of the digest is kept.
 *
 * 128 bits. Several platforms cap the header at 64 characters and at least one
 * validates the character class, so the full 64-character digest plus a prefix
 * is not universally safe to send. The truncation costs nothing that matters:
 * collisions only have meaning inside one target's own retry history, and 128
 * bits is far past the volume this system will ever generate.
 */
const IDEMPOTENCY_KEY_HEX_CHARS = 32;

/**
 * ASCII unit and record separators, written as escapes so that a tool which
 * strips control characters from source cannot silently change every key this
 * function has ever derived.
 */
const UNIT = '\u001f';
const RECORD = '\u001e';

/**
 * Emit one length-framed field.
 *
 * Framed by byte length rather than joined with a separator so that no value
 * containing the separator can shift bytes into the next field and derive the
 * same key as a different input.
 */
function frame(name: string, value: string): string {
  return `${name}${UNIT}${String(Buffer.byteLength(value, 'utf8'))}${UNIT}${value}${RECORD}`;
}

/**
 * Derive the idempotency key for one publish attempt.
 *
 * Keyed on content, not on the attempt, and that is the whole design. A retry
 * after an ambiguous timeout — the request landed, the response did not — sends
 * the identical key, so the platform recognises the replay and we get one post
 * rather than two. A genuine edit changes `contentHash` and therefore changes
 * the key, so a corrected typo publishes instead of being swallowed as a
 * duplicate. Keying on the target alone would block the edit; keying on the
 * attempt alone would make every retry a fresh post.
 *
 * The cost of that choice is real and should be stated: a deliberate republish
 * of byte-identical content to the same target is indistinguishable from a
 * retry and will be deduplicated. Recycling an evergreen post therefore has to
 * mint a new target rather than replay an old one.
 *
 * `attempt` exists for the platforms that treat a reused key as a hard conflict
 * instead of replaying the original response. On those, sending the same key
 * again turns a benign retry into an error that looks exactly like a real
 * double-submit, so the attempt number is folded in to keep each try distinct.
 * The tradeoff is that idempotency then protects only against the platform's
 * own internal retries and no longer against ours, and the double-post guard
 * moves entirely onto claim-before-call plus read-back reconciliation. Prefer
 * omitting it. Whichever mode a network uses is a fixed property of that
 * network: switching modes while posts are in flight changes the key mid-retry,
 * which is the one way to get a duplicate out of this scheme.
 *
 * Hashed rather than concatenated so that our internal target ids are not
 * handed to third parties in a header they log, and so the output length is
 * fixed regardless of how long an id gets.
 */
export function idempotencyKeyFor(
  postTargetId: PostTargetId,
  contentHash: string,
  attempt?: number | undefined,
): IdempotencyKey {
  // An omitted attempt and attempt zero must not collide, so absence is framed
  // as an empty value rather than being rendered as a number.
  const digest = createHash('sha256')
    .update(frame('target', postTargetId), 'utf8')
    .update(frame('content', contentHash), 'utf8')
    .update(frame('attempt', attempt === undefined ? '' : String(attempt)), 'utf8')
    .digest('hex')
    .slice(0, IDEMPOTENCY_KEY_HEX_CHARS);

  return unsafeId<'IdempotencyKey'>(`${IDEMPOTENCY_KEY_VERSION}_${digest}`);
}

/**
 * One uploaded chunk the platform acknowledged.
 *
 * LinkedIn's multipart upload returns an ETag per part and rejects the finalize
 * call unless every one of them is echoed back in order. Those values exist
 * only in the responses to the individual chunk uploads, so if they are not on
 * the handle when the worker dies, the bytes are on LinkedIn's servers, unusable
 * and unreachable, and the whole file has to go up again.
 */
export interface UploadPart {
  /** 1-based, in the order the platform expects them at finalize. */
  readonly partNumber: number;
  readonly etag: string;
}

interface PublishHandleBase {
  readonly network: NetworkId;
  /**
   * Carried on the handle rather than looked up, because the key must be
   * identical across every attempt at this publish, including the attempt made
   * by a worker that has never seen the original content.
   */
  readonly idempotencyKey: IdempotencyKey;
  /**
   * The last phase we observed.
   *
   * A cache, not the truth — the platform is authoritative and `poll` is how we
   * ask. It is stored so that a worker resuming after a restart can choose
   * between polling and finalizing without a round trip, and so the ledger can
   * show how long a post sat in each phase.
   */
  readonly phase: PublishPhase;
  readonly submittedAt: Date;
  /**
   * When the remote work stops being usable: container TTL, upload session
   * lifetime, media handle lifetime.
   *
   * Every archetype has one and they are short — 24 hours on an Instagram
   * container and on an unused X media id. Recording it is what lets the
   * scheduler decide between resuming and rebuilding without spending a call to
   * find out, and what stops a retry loop from politely backing off against a
   * container that died an hour ago.
   */
  readonly expiresAt: Date;
}

/**
 * A single-shot publish in flight.
 *
 * There is a window here even though there is only one call: the media handles
 * were minted before it, and the post id arrives from it. A crash between the
 * platform creating the post and us committing the row leaves this handle as
 * the only evidence that the post exists.
 */
export interface SingleShotHandle extends PublishHandleBase {
  readonly archetype: 'single_shot';
  /** Handles for media already accepted by the platform, in post order. */
  readonly mediaIds: readonly RemoteId[];
  /** Present once the platform has returned the post. Makes finalize a lookup rather than a second call. */
  readonly remotePostId?: RemoteId | undefined;
}

/** A container-based publish in flight: created, awaiting processing, not yet published. */
export interface ContainerHandle extends PublishHandleBase {
  readonly archetype: 'async_container';
  /** The creation id polled for status and passed to the publish call. */
  readonly containerId: RemoteId;
  /**
   * Child containers of a carousel, in slide order. Empty for everything else.
   *
   * Recorded because a carousel can half-succeed: children created, parent
   * fails. Without their ids the children are orphaned on Meta's side, counting
   * against quota, with nothing left that can name them for cleanup.
   */
  readonly childContainerIds: readonly RemoteId[];
}

/** A resumable byte upload in flight. */
export interface ResumableUploadHandle extends PublishHandleBase {
  readonly archetype: 'resumable_upload';
  /**
   * The session endpoint bytes are pushed to.
   *
   * Treat as a secret. It authorises writes to the session without any further
   * credential, so an encoded handle containing one belongs in the same storage
   * class as a token and must never reach a log line or an error message shown
   * to a user.
   */
  readonly uploadUri: string;
  /**
   * The platform's own name for the job — TikTok's `publish_id`, LinkedIn's
   * upload urn, Meta's upload session id. Status is polled against this, not
   * against the upload URI. Absent on YouTube, where the session URI is the
   * only identifier there is.
   */
  readonly uploadId?: string | undefined;
  readonly bytesTotal: number;
  /**
   * Bytes the platform has confirmed receiving.
   *
   * A hint for choosing where to resume, not an authority. On resumption the
   * session must be queried for its real offset and that answer must win:
   * trusting our own number after a crash either re-sends bytes the platform
   * already has or skips bytes it does not, and the second one produces a video
   * that uploads cleanly and plays as garbage.
   */
  readonly bytesConfirmed: number;
  /** Acknowledged parts, for the multipart flows that require them at finalize. Empty elsewhere. */
  readonly parts: readonly UploadPart[];
}

/**
 * In-flight publish work, in a form that outlives the worker that started it.
 *
 * Opaque above the adapter layer. The scheduler moves these around, stores them
 * and hands them back; it must never read `containerId` or branch on
 * `uploadUri`, because the moment it does, a platform changing its flow becomes
 * a change to the scheduler. Adapters see the fields, everything above sees the
 * encoded string.
 *
 * Serialisable by construction: plain data, no functions, no class instances,
 * no references to anything in process memory. That constraint is the entire
 * point. An upload routinely outlives the worker that began it, so the handle
 * has to fit in a database column and come back intact on another machine, on
 * another deploy, hours later.
 */
export type PublishHandle = SingleShotHandle | ContainerHandle | ResumableUploadHandle;

/**
 * Whether the remote work is already dead.
 *
 * The clock is a parameter because handles arrive from queues that can be older
 * than the process reading them, and because the reconciler needs to ask the
 * question about a past moment — "was this already expired when we last polled"
 * — which a call to `Date.now()` inside cannot answer.
 */
export function hasExpired(handle: PublishHandle, now: Date): boolean {
  return handle.expiresAt.getTime() <= now.getTime();
}

/**
 * Why a stored handle could not be read back.
 *
 * The two cases demand opposite responses, which is the reason they are
 * distinguished. A handle written by a newer deploy during a rolling upgrade is
 * not corrupt and must be left alone for a newer worker to pick up; treating it
 * as garbage discards an upload that is progressing perfectly well. Malformed
 * means the row is genuinely unrecoverable, and the only safe move then is
 * read-back reconciliation against the network, never a blind resubmit.
 */
export type HandleDecodeError =
  | { readonly reason: 'malformed'; readonly detail: string }
  | { readonly reason: 'unsupported_version'; readonly version: string };

/**
 * Version marker on the encoded form.
 *
 * Encoded handles sit in database rows and queue messages while the work they
 * describe is still running, so a deploy that changes the format meets handles
 * written by the previous one. The prefix is what lets the new code recognise
 * an old handle and decide, rather than misparse it and lose an upload that was
 * halfway done.
 */
const HANDLE_FORMAT_PREFIX = 'ph1';

/** Matches any version marker we have used or might use, so an unknown one is reported as a version rather than as corruption. */
const VERSION_PREFIX_PATTERN = /^ph[0-9]+$/;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Read a whole, finite number.
 *
 * Timestamps and byte offsets are both integers here, and a non-integer in
 * either is a sign the row was written by something other than this codec.
 * Accepting it would put a fractional byte offset into a Content-Range header.
 */
function readInteger(record: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function readStringArray(
  record: Readonly<Record<string, unknown>>,
  key: string,
): readonly string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') return undefined;
    out.push(entry);
  }
  return out;
}

function readParts(record: Readonly<Record<string, unknown>>): readonly UploadPart[] | undefined {
  const value = record['parts'];
  if (!Array.isArray(value)) return undefined;
  const out: UploadPart[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return undefined;
    const partNumber = readInteger(entry, 'partNumber');
    const etag = readString(entry, 'etag');
    if (partNumber === undefined || etag === undefined) return undefined;
    out.push({ partNumber, etag });
  }
  return out;
}

function malformed(detail: string): Result<PublishHandle, HandleDecodeError> {
  return err({ reason: 'malformed', detail });
}

function toWire(handle: PublishHandle): Readonly<Record<string, unknown>> {
  // Epoch milliseconds, because a Date does not survive JSON on its own and a
  // handle that round-trips into a string date silently loses its expiry check.
  const base = {
    network: handle.network,
    archetype: handle.archetype,
    idempotencyKey: handle.idempotencyKey,
    phase: handle.phase,
    submittedAt: handle.submittedAt.getTime(),
    expiresAt: handle.expiresAt.getTime(),
  };

  switch (handle.archetype) {
    case 'single_shot':
      return {
        ...base,
        mediaIds: [...handle.mediaIds],
        ...(handle.remotePostId === undefined ? {} : { remotePostId: handle.remotePostId }),
      };
    case 'async_container':
      return {
        ...base,
        containerId: handle.containerId,
        childContainerIds: [...handle.childContainerIds],
      };
    case 'resumable_upload':
      return {
        ...base,
        uploadUri: handle.uploadUri,
        bytesTotal: handle.bytesTotal,
        bytesConfirmed: handle.bytesConfirmed,
        parts: handle.parts.map((part) => ({ partNumber: part.partNumber, etag: part.etag })),
        ...(handle.uploadId === undefined ? {} : { uploadId: handle.uploadId }),
      };
  }
}

/**
 * Turn a handle into one string that can be stored, queued and passed around.
 *
 * Base64url rather than raw JSON for two reasons. It survives a database
 * column, a URL, a queue payload and a log line without anyone having to think
 * about escaping. And it is inconvenient enough to read that a caller above the
 * adapter layer will ask for an accessor instead of parsing it, which keeps the
 * handle opaque in practice and not merely in documentation.
 *
 * The wire field names match the interface field names deliberately. Compact
 * keys would save bytes nobody is short of, at the cost of the one moment this
 * format is read by hand: an engineer decoding a stuck handle during an
 * incident, who should not also need a key map.
 */
function encode(handle: PublishHandle): string {
  const json = JSON.stringify(toWire(handle));
  // '.' is outside the base64url alphabet, so the prefix can never be confused
  // with payload no matter what the payload contains.
  return `${HANDLE_FORMAT_PREFIX}.${Buffer.from(json, 'utf8').toString('base64url')}`;
}

function decode(encoded: string): Result<PublishHandle, HandleDecodeError> {
  const separator = encoded.indexOf('.');
  if (separator <= 0) return malformed('missing version prefix');

  const prefix = encoded.slice(0, separator);
  if (prefix !== HANDLE_FORMAT_PREFIX) {
    return VERSION_PREFIX_PATTERN.test(prefix)
      ? err({ reason: 'unsupported_version', version: prefix })
      : malformed('unrecognised version prefix');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded.slice(separator + 1), 'base64url').toString('utf8'));
  } catch {
    return malformed('payload is not valid JSON');
  }
  if (!isRecord(parsed)) return malformed('payload is not an object');

  const network = readString(parsed, 'network');
  const archetype = readString(parsed, 'archetype');
  const phase = readString(parsed, 'phase');
  const idempotencyKey = readString(parsed, 'idempotencyKey');
  const submittedAt = readInteger(parsed, 'submittedAt');
  const expiresAt = readInteger(parsed, 'expiresAt');

  // Every field is checked against a closed set rather than cast. The row is
  // ours, but it was written by a different version of this code, and a handle
  // naming a network we no longer support has to be reported rather than
  // handed to an adapter lookup that returns undefined three frames later.
  if (network === undefined || !isNetworkId(network)) return malformed('network');
  if (archetype === undefined || !isArchetype(archetype)) return malformed('archetype');
  if (phase === undefined || !isPublishPhase(phase)) return malformed('phase');
  if (idempotencyKey === undefined) return malformed('idempotencyKey');
  if (submittedAt === undefined) return malformed('submittedAt');
  if (expiresAt === undefined) return malformed('expiresAt');

  const base = {
    network,
    idempotencyKey: unsafeId<'IdempotencyKey'>(idempotencyKey),
    phase,
    submittedAt: new Date(submittedAt),
    expiresAt: new Date(expiresAt),
  } as const;

  switch (archetype) {
    case 'single_shot': {
      const mediaIds = readStringArray(parsed, 'mediaIds');
      if (mediaIds === undefined) return malformed('mediaIds');
      const remotePostId = readString(parsed, 'remotePostId');
      const handle: SingleShotHandle = {
        ...base,
        archetype: 'single_shot',
        mediaIds: mediaIds.map(remoteId),
        ...(remotePostId === undefined ? {} : { remotePostId: remoteId(remotePostId) }),
      };
      return ok(handle);
    }

    case 'async_container': {
      const containerId = readString(parsed, 'containerId');
      const childContainerIds = readStringArray(parsed, 'childContainerIds');
      if (containerId === undefined) return malformed('containerId');
      if (childContainerIds === undefined) return malformed('childContainerIds');
      const handle: ContainerHandle = {
        ...base,
        archetype: 'async_container',
        containerId: remoteId(containerId),
        childContainerIds: childContainerIds.map(remoteId),
      };
      return ok(handle);
    }

    case 'resumable_upload': {
      const uploadUri = readString(parsed, 'uploadUri');
      const bytesTotal = readInteger(parsed, 'bytesTotal');
      const bytesConfirmed = readInteger(parsed, 'bytesConfirmed');
      const parts = readParts(parsed);
      if (uploadUri === undefined) return malformed('uploadUri');
      if (bytesTotal === undefined) return malformed('bytesTotal');
      if (bytesConfirmed === undefined) return malformed('bytesConfirmed');
      if (parts === undefined) return malformed('parts');
      const uploadId = readString(parsed, 'uploadId');
      const handle: ResumableUploadHandle = {
        ...base,
        archetype: 'resumable_upload',
        uploadUri,
        bytesTotal,
        bytesConfirmed,
        parts,
        ...(uploadId === undefined ? {} : { uploadId }),
      };
      return ok(handle);
    }
  }
}

/**
 * The only sanctioned way to move a handle between memory and storage.
 *
 * Grouped as one object so that call sites hold a codec rather than two loose
 * functions: when the format version changes, the migration is a second codec
 * and a choice of which one to hand over, not an edit to every caller.
 *
 * `decode` returns a `Result` because a handle that will not parse is an
 * ordinary operational event — a rolling deploy, a truncated column — arriving
 * on the path that is trying to work out whether a customer's post went live.
 * Throwing there loses the one thing that knows a publish is in flight.
 */
export const PublishHandleCodec = {
  version: HANDLE_FORMAT_PREFIX,
  encode,
  decode,
} as const;
