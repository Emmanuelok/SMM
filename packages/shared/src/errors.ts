/**
 * A taxonomy of the ways publishing to a social network fails.
 *
 * Sixty-odd networks report failure in sixty-odd different shapes. Adapters
 * translate whatever the platform said into one of these kinds, and everything
 * downstream — retry policy, alerting, whether we ask the user to reconnect —
 * keys off the kind rather than off the platform's own message. That way retry
 * behaviour is decided once, here, instead of being re-litigated in every
 * adapter.
 */
export type FailureKind =
  /** Token expired or was revoked; the user must reconnect the account. */
  | 'auth_expired'
  /** Authenticated, but the granted scopes do not cover this operation. */
  | 'permission_denied'
  /** Platform rate limit hit. Retry after the supplied delay. */
  | 'rate_limited'
  /** A hard periodic quota is exhausted (e.g. YouTube's daily unit budget). */
  | 'quota_exhausted'
  /** The content violates a platform rule we can detect. User must fix it. */
  | 'validation_failed'
  /** Media rejected — codec, dimensions, duration, or file size. */
  | 'media_rejected'
  /** Platform refused a near-identical post it has seen before. */
  | 'duplicate_content'
  /** The account is suspended, restricted, or otherwise not postable to. */
  | 'account_restricted'
  /** The network's API is down or returned a server error. Retry. */
  | 'platform_unavailable'
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
  | { readonly action: 'await_reconnect' };

export interface PublishFailure {
  readonly kind: FailureKind;
  /** Message safe to show an end user. Must not contain tokens or PII. */
  readonly message: string;
  /** The platform's own error code, kept verbatim for support and debugging. */
  readonly platformCode?: string | undefined;
  /** The platform's own message, kept verbatim. May contain platform jargon. */
  readonly platformMessage?: string | undefined;
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
};

/**
 * Decide what to do about a failure.
 *
 * A platform-supplied `retryAfterMs` always wins over our defaults — the
 * platform knows its own limits, and ignoring an explicit backoff is how an
 * integration earns a suspension.
 */
export function dispositionOf(failure: PublishFailure): RetryDisposition {
  switch (failure.kind) {
    case 'auth_expired':
      return { action: 'await_reconnect' };

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

    case 'rate_limited':
    case 'quota_exhausted':
    case 'platform_unavailable':
    case 'unknown':
      return {
        action: 'retry',
        retryAfterMs: failure.retryAfterMs ?? DEFAULT_RETRY_MS[failure.kind] ?? 60_000,
      };
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
