import { backoffMs, dispositionOf, type PublishFailure } from '@smm/shared';

/**
 * Retry policy for failed publish attempts.
 *
 * The decision of *whether* a failure is worth retrying belongs to the failure
 * taxonomy in `@smm/shared`; this module decides *when*, and when to stop.
 * Separating them keeps adapters from each inventing their own retry
 * behaviour, which is how integrations end up hammering a platform that has
 * already said no.
 */

export interface AttemptPolicy {
  /** Total attempts including the first. */
  readonly maxAttempts: number;
  readonly baseMs: number;
  readonly maxMs: number;
}

export const DEFAULT_ATTEMPT_POLICY: AttemptPolicy = {
  // Enough to ride out a transient outage; few enough that a genuinely broken
  // post surfaces to the user the same day rather than retrying into silence.
  maxAttempts: 6,
  baseMs: 30_000,
  maxMs: 3_600_000,
};

export type NextAttempt =
  | { readonly action: 'retry'; readonly at: Date; readonly attempt: number }
  /** Retrying will not help. The user is told what happened. */
  | { readonly action: 'give_up'; readonly reason: string }
  /** Blocked until the account is re-authorised. */
  | { readonly action: 'await_reconnect' };

/**
 * Decide what happens after a failed attempt.
 *
 * When the platform supplies its own backoff we wait at least that long. Our
 * jittered exponential schedule is a guess; the platform's `Retry-After` is
 * fact, and ignoring it is how an integration gets suspended.
 */
export function planNextAttempt(
  now: Date,
  attemptsSoFar: number,
  failure: PublishFailure,
  policy: AttemptPolicy = DEFAULT_ATTEMPT_POLICY,
  random: () => number = Math.random,
): NextAttempt {
  const disposition = dispositionOf(failure);

  if (disposition.action === 'await_reconnect') return { action: 'await_reconnect' };

  if (disposition.action === 'fail') {
    return { action: 'give_up', reason: failure.message };
  }

  if (attemptsSoFar >= policy.maxAttempts) {
    return {
      action: 'give_up',
      reason: `Gave up after ${attemptsSoFar} attempts. Last error: ${failure.message}`,
    };
  }

  const jittered = backoffMs(attemptsSoFar, policy.baseMs, policy.maxMs, random);
  const waitMs = Math.max(jittered, disposition.retryAfterMs);

  return {
    action: 'retry',
    at: new Date(now.getTime() + waitMs),
    attempt: attemptsSoFar + 1,
  };
}
