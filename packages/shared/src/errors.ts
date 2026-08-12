import type { SocialProfileId } from './ids.js';

/**
 * A taxonomy of the ways publishing to a social network fails.
 *
 * Sixty-odd networks report failure in sixty-odd different shapes. Adapters
 * translate whatever the platform said into one of these kinds, and everything
 * downstream — retry policy, alerting, whether we ask the user to reconnect —
 * keys off the kind rather than off the platform's own message. That way retry
 * behaviour is decided once, here, instead of being re-litigated in every
 * adapter.
 *
 * The taxonomy is deliberately finer-grained than it looks like it needs to be.
 * Each distinction earns its place by producing a different action: a different
 * retry decision, a different thing we ask the user to do, or a different
 * answer to whether the failure counts against our own reliability numbers.
 * Two kinds that would always be handled identically should be one kind.
 */
export type FailureKind =
  /** Token expired or was revoked; the user must reconnect the account. */
  | 'auth_expired'
  /**
   * The user or the platform withdrew our access outright.
   *
   * Distinct from `auth_expired` because a refresh token cannot fix it. The
   * difference decides whether the pipeline quietly refreshes or interrupts a
   * human, so collapsing the two would either spam users or stall silently.
   */
  | 'auth_revoked'
  /** Authenticated, but the granted scopes do not cover this operation. */
  | 'permission_denied'
  /**
   * A specific named scope is missing and can be granted by re-consenting.
   *
   * Separate from `permission_denied` because we know exactly which scope to
   * ask for, which is the difference between "reconnect your account" and a
   * consent screen that adds one permission. The vaguer message is the one
   * that gets ignored.
   */
  | 'scope_missing'
  /** Platform rate limit hit. Retry after the supplied delay. */
  | 'rate_limited'
  /** A hard periodic quota is exhausted (e.g. YouTube's daily unit budget). */
  | 'quota_exhausted'
  /**
   * The customer's own plan on the network does not include this capability.
   *
   * Vimeo, Flickr and Trustpilot gate features behind their own paid tiers.
   * Nothing we do fixes it and it is not our outage, so it must not be filed
   * alongside our own failures.
   */
  | 'plan_insufficient'
  /** The content violates a platform rule we can detect. User must fix it. */
  | 'validation_failed'
  /**
   * The platform refused the content and told us why, in its own words.
   *
   * Distinct from `validation_failed`, which is a rule we checked ourselves
   * before sending. This one is the rule we did not know about, so every
   * occurrence is a candidate for a new local check.
   */
  | 'content_rejected'
  /**
   * The content breaches a published platform policy — moderation, restricted
   * industry, prohibited claim.
   *
   * Kept apart from `content_rejected` because a policy breach is a legal and
   * account-standing matter rather than a formatting one. It must reach a human
   * with the policy text attached, it must never be retried automatically, and
   * it must not count against our delivery reliability, since the platform
   * behaved exactly as documented.
   */
  | 'content_policy_violation'
  /** Media rejected — codec, dimensions, duration, or file size. */
  | 'media_rejected'
  /**
   * The platform accepted the media and then failed to process it.
   *
   * Different from `media_rejected` in the only way that matters: the file may
   * be fine. Meta, TikTok and YouTube transcode asynchronously on queues that
   * drop work under load, and re-uploading an identical file frequently
   * succeeds. Treating this as a rejection would tell users to fix a file that
   * was never broken.
   */
  | 'media_processing_failed'
  /** Platform refused a near-identical post it has seen before. */
  | 'duplicate_content'
  /** The account is suspended, restricted, or otherwise not postable to. */
  | 'account_restricted'
  /**
   * The target we were told to publish to is not a thing we can publish to —
   * a malformed board id, a channel of the wrong type, a page the account does
   * not administer.
   *
   * This is a configuration error rather than a content error, and it is fixed
   * by choosing a different destination, not by editing the post.
   */
  | 'destination_invalid'
  /**
   * The destination existed and no longer does: a deleted board, a removed
   * page, a group that closed.
   *
   * Split from `destination_invalid` because the remedy differs. An invalid
   * destination was probably never right; a gone one was right until someone
   * deleted it, which means every schedule still pointing at it needs
   * re-targeting rather than correcting.
   */
  | 'destination_gone'
  /**
   * A state we asserted before publishing did not hold — the parent post in a
   * thread is not live yet, an async media container is not ready, an account
   * has not finished its warm-up period.
   *
   * The request was well-formed; the world was not in the expected shape.
   */
  | 'precondition_failed'
  /**
   * The platform has already seen this idempotency key, attached to a
   * different request, or we have already used it ourselves.
   *
   * Almost always means the post already exists. This is the one failure where
   * the obvious response — try again — is the actively dangerous one.
   */
  | 'idempotency_conflict'
  /** The network's API is down or returned a server error. Retry. */
  | 'platform_unavailable'
  /**
   * A connection reset, a DNS blip, a timeout with no response at all.
   *
   * Named separately from `platform_unavailable` because nothing about the
   * platform is known to be wrong; the request never landed. It gets the
   * shortest backoff in the taxonomy for that reason.
   */
  | 'transient'
  /** The network cannot do this at all; fall back or degrade. */
  | 'unsupported_operation'
  /** Our own bug, or a response we could not interpret. */
  | 'internal'
  /** Anything an adapter could not classify. Treated as retryable-once. */
  | 'unknown';

/** What the pipeline should do next with a failed attempt. */
export type RetryDisposition =
  /** Safe to retry; `retryAfterMs` gives the earliest sensible moment. */
  | { readonly action: 'retry'; readonly retryAfterMs: number }
  /** Retrying cannot help. Surface to the user. */
  | { readonly action: 'fail' }
  /** Retrying cannot help until the user reconnects the account. */
  | { readonly action: 'await_reconnect' }
  /**
   * Retrying cannot help, but we know precisely what consent is missing and
   * for which account, so we can hand the user a link that fixes it.
   *
   * This exists so an agency can forward a repair link to the client who owns
   * the account, rather than a red dot in a dashboard the client cannot see.
   * A broken connection that only shows up as an error state stays broken.
   */
  | { readonly action: 'repair_link'; readonly profileId: SocialProfileId };

export interface PublishFailure {
  readonly kind: FailureKind;
  /** Message safe to show an end user. Must not contain tokens or PII. */
  readonly message: string;
  /** The platform's own error code, kept verbatim for support and debugging. */
  readonly platformCode?: string | undefined;
  /** The platform's own message, kept verbatim. May contain platform jargon. */
  readonly platformMessage?: string | undefined;
  /**
   * The platform's message rendered in the operator's language.
   *
   * Chinese and Korean APIs answer in Chinese and Korean. Keeping the original
   * alongside the translation matters because support cases are searched
   * against the platform's own wording.
   */
  readonly platformMessageTranslated?: string | undefined;
  /**
   * The exact scope to request, for `scope_missing`.
   *
   * Naming it is the whole value of the kind: a consent screen can be built
   * for one named scope, whereas "reconnect your account" makes the user redo
   * a working connection.
   */
  readonly missingScope?: string | undefined;
  /**
   * When an exhausted quota refills, for `quota_exhausted`.
   *
   * Quota windows are fixed, so retrying inside the window cannot succeed. A
   * generic backoff would burn attempts against a limit that has not moved.
   */
  readonly quotaResetAt?: Date | undefined;
  /**
   * The account this failure concerns.
   *
   * Required to mint a repair link; without it the pipeline can only show an
   * error, because it does not know which connection to send the user to.
   */
  readonly profileId?: SocialProfileId | undefined;
  /** Honour a platform-supplied backoff when it gives us one. */
  readonly retryAfterMs?: number | undefined;
  /** Correlates our logs with the platform's, where one is returned. */
  readonly traceId?: string | undefined;
}

const DEFAULT_RETRY_MS: Partial<Record<FailureKind, number>> = {
  rate_limited: 60_000,
  platform_unavailable: 30_000,
  unknown: 120_000,
  // Quotas are near-universally daily, so there is no point retrying sooner.
  quota_exhausted: 3_600_000,
  // Nothing is known to be wrong with the platform, so wait only long enough
  // for a reset connection or a DNS flap to clear.
  transient: 5_000,
  // Transcoding queues drain in minutes, not seconds. Re-uploading sooner adds
  // load to the queue that is already behind.
  media_processing_failed: 120_000,
};

/**
 * Decide what to do about a failure.
 *
 * A platform-supplied `retryAfterMs` always wins over our defaults — the
 * platform knows its own limits, and ignoring an explicit backoff is how an
 * integration earns a suspension.
 *
 * The switch is exhaustive on purpose. Adding a kind without deciding its
 * disposition should stop the build, because the alternative is a new failure
 * mode silently inheriting whatever the default branch happened to be.
 */
export function dispositionOf(failure: PublishFailure, now: Date = new Date()): RetryDisposition {
  switch (failure.kind) {
    case 'auth_expired':
      return { action: 'await_reconnect' };

    case 'auth_revoked':
    case 'scope_missing':
      // Nothing is broken that a retry touches: the platform is answering
      // correctly and will keep answering the same way until a human grants
      // access again. We know the account, so the pipeline can hand out a
      // repair link instead of an error state somebody has to notice.
      return failure.profileId === undefined
        ? { action: 'await_reconnect' }
        : { action: 'repair_link', profileId: failure.profileId };

    case 'permission_denied':
    case 'account_restricted':
      // Both need a human: re-grant scopes, or resolve a platform-side
      // restriction. Retrying on a timer just burns quota.
      return { action: 'await_reconnect' };

    case 'validation_failed':
    case 'media_rejected':
    case 'duplicate_content':
    case 'unsupported_operation':
    case 'internal':
      return { action: 'fail' };

    case 'content_rejected':
      // The platform applied a rule to this exact text. The same text will get
      // the same answer, so the only path forward is an edit.
      return { action: 'fail' };

    case 'content_policy_violation':
      // Never retried, and not only because it cannot succeed. Repeated
      // attempts to publish content a platform has flagged read as evasion,
      // and enforcement lands on the app, which would take every other
      // customer's connection down with it.
      return { action: 'fail' };

    case 'plan_insufficient':
      // The customer's subscription on the network is the blocker. We cannot
      // buy it for them and it will not lapse into working.
      return { action: 'fail' };

    case 'destination_invalid':
    case 'destination_gone':
      // The target is wrong or no longer exists. Retrying publishes nowhere;
      // someone has to re-point the schedule at a destination that exists.
      return { action: 'fail' };

    case 'precondition_failed':
      // Tempting to retry, because the precondition often does become true. It
      // is still a failure, because the pipeline must re-derive the state
      // rather than replay the old request: a blind retry of a thread reply
      // whose parent has since changed attaches it to the wrong post.
      return { action: 'fail' };

    case 'idempotency_conflict':
      // The single most important entry here. A conflict means this key has
      // already been used, which nearly always means the post is already live.
      // Retrying is the exact action that double-posts to a customer's
      // audience, so the pipeline must read back and reconcile instead.
      return { action: 'fail' };

    case 'quota_exhausted': {
      // A quota window is fixed: it refills at a wall-clock moment, not after
      // an elapsed delay. When the platform tells us when that is, waiting
      // until then is the only thing that can succeed. A generic hourly
      // backoff against YouTube's daily unit budget exhausted at 09:00 spends
      // nine more attempts on a limit that has not moved, and each one costs
      // quota it does not have.
      const untilReset =
        failure.quotaResetAt === undefined
          ? undefined
          : failure.quotaResetAt.getTime() - now.getTime();
      const waits = [failure.retryAfterMs, untilReset].filter(
        (w): w is number => w !== undefined && w > 0,
      );
      return {
        action: 'retry',
        retryAfterMs: waits.length > 0 ? Math.max(...waits) : DEFAULT_RETRY_MS.quota_exhausted ?? 3_600_000,
      };
    }

    case 'media_processing_failed':
    case 'rate_limited':
    case 'platform_unavailable':
    case 'transient':
    case 'unknown':
      return {
        action: 'retry',
        retryAfterMs: failure.retryAfterMs ?? DEFAULT_RETRY_MS[failure.kind] ?? 60_000,
      };
  }
}

/**
 * Whether a failure belongs in the numerator of our own reliability figures.
 *
 * Decided here for the same reason retry policy is: if each adapter or each
 * dashboard query answered it separately, the number would mean something
 * different depending on who asked. A platform outage, a rate limit, or a
 * customer's own plan limit are not our failures to publish, and counting them
 * makes the metric useless for finding the failures that are ours.
 */
export function countsAgainstSla(failure: PublishFailure): boolean {
  switch (failure.kind) {
    case 'rate_limited':
    case 'quota_exhausted':
    case 'platform_unavailable':
    case 'transient':
    case 'plan_insufficient':
    case 'content_policy_violation':
    case 'account_restricted':
    case 'auth_expired':
    case 'auth_revoked':
    case 'scope_missing':
    case 'permission_denied':
    case 'destination_gone':
      return false;

    case 'validation_failed':
    case 'content_rejected':
    case 'media_rejected':
    case 'media_processing_failed':
    case 'duplicate_content':
    case 'destination_invalid':
    case 'precondition_failed':
    case 'idempotency_conflict':
    case 'unsupported_operation':
    case 'internal':
    case 'unknown':
      // All of these are ours. Content we should have checked before sending,
      // media we should have transcoded ourselves, state we got wrong, or a
      // response we failed to classify. `unknown` counts deliberately: making
      // the unclassified case free would remove the pressure to classify it.
      return true;
  }
}

/** Whether a failure is worth another attempt. */
export function isRetryable(failure: PublishFailure): boolean {
  return dispositionOf(failure).action === 'retry';
}

/**
 * Full-jitter exponential backoff.
 *
 * Jitter matters more than usual here: a rate limit typically trips every
 * pending post for an account at once, and un-jittered backoff would march them
 * all back into the same limit together.
 */
export function backoffMs(
  attempt: number,
  baseMs = 1_000,
  maxMs = 900_000,
  random: () => number = Math.random,
): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(random() * exponential);
}

export function failure(
  kind: FailureKind,
  message: string,
  extra: Omit<PublishFailure, 'kind' | 'message'> = {},
): PublishFailure {
  return { kind, message, ...extra };
}

/** Thrown for programmer error — never for an expected platform failure. */
export class InvariantError extends Error {
  override readonly name = 'InvariantError';
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InvariantError(message);
}
