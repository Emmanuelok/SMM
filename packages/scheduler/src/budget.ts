import type { PublishingLimits } from '@smm/adapters';

/**
 * Local enforcement of platform publishing limits.
 *
 * Every check here could be skipped by simply calling the API and handling the
 * rejection, and that would be the wrong trade. A rejected publish costs the
 * user a posting slot they cannot get back, and a pattern of them costs us
 * standing with the platform — several networks treat repeated limit breaches
 * as a signal to restrict or suspend an integration. Budgeting locally turns a
 * missed post into a deferred one.
 *
 * These are deliberately pure functions over an observed history. Where that
 * history comes from — a database query, a Redis counter — is the caller's
 * problem, which keeps the policy testable against exact clock values.
 */

export type BudgetReason =
  /** The rolling 24-hour post cap for this account is used up. */
  | 'daily_cap_reached'
  /** Posts to this account must be spaced further apart. */
  | 'min_interval'
  /** The per-minute request ceiling is reached. */
  | 'request_rate'
  /** The account is too new to publish reliably. */
  | 'account_warming_up';

export type BudgetDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: BudgetReason;
      /** How long until this would be permitted. */
      readonly retryAfterMs: number;
      /** Explanation suitable for showing the user. */
      readonly message: string;
    };

export interface AccountHistory {
  /** When posts were published to this account. Order is irrelevant. */
  readonly publishes: readonly Date[];
  /** When API requests of any kind were made for this account. */
  readonly requests: readonly Date[];
  /** When the account was connected, for warm-up purposes. */
  readonly connectedAt?: Date | undefined;
}

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

function within(times: readonly Date[], now: Date, windowMs: number): Date[] {
  const cutoff = now.getTime() - windowMs;
  return times.filter((t) => t.getTime() > cutoff).sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Whether a publish to this account is permitted right now.
 *
 * Checks are ordered cheapest-first, and the first failure short-circuits, so
 * the returned `retryAfterMs` is the wait for the nearest binding constraint
 * rather than the furthest.
 */
export function checkPublishBudget(
  now: Date,
  history: AccountHistory,
  limits: PublishingLimits,
): BudgetDecision {
  if (limits.newAccountWarmupDays !== undefined && history.connectedAt !== undefined) {
    const postableFrom = history.connectedAt.getTime() + limits.newAccountWarmupDays * DAY_MS;
    if (now.getTime() < postableFrom) {
      return {
        allowed: false,
        reason: 'account_warming_up',
        retryAfterMs: postableFrom - now.getTime(),
        message: `This account was connected recently. The network rejects posts from accounts newer than ${limits.newAccountWarmupDays} days, so publishing resumes once it has aged.`,
      };
    }
  }

  if (limits.minIntervalSec !== undefined && history.publishes.length > 0) {
    const last = Math.max(...history.publishes.map((d) => d.getTime()));
    const earliestNext = last + limits.minIntervalSec * 1000;
    if (now.getTime() < earliestNext) {
      return {
        allowed: false,
        reason: 'min_interval',
        retryAfterMs: earliestNext - now.getTime(),
        message: `Posts to this account must be at least ${limits.minIntervalSec} seconds apart.`,
      };
    }
  }

  if (limits.maxRequestsPerMinute !== undefined) {
    const recent = within(history.requests, now, MINUTE_MS);
    if (recent.length >= limits.maxRequestsPerMinute) {
      const oldest = recent[0];
      // Capacity frees up when the oldest request leaves the window.
      const retryAfterMs =
        oldest === undefined ? MINUTE_MS : oldest.getTime() + MINUTE_MS - now.getTime();
      return {
        allowed: false,
        reason: 'request_rate',
        retryAfterMs: Math.max(1, retryAfterMs),
        message: `The network allows ${limits.maxRequestsPerMinute} requests per minute for this account.`,
      };
    }
  }

  if (limits.maxPostsPer24h !== undefined) {
    const recent = within(history.publishes, now, DAY_MS);
    if (recent.length >= limits.maxPostsPer24h) {
      const oldest = recent[0];
      const retryAfterMs =
        oldest === undefined ? DAY_MS : oldest.getTime() + DAY_MS - now.getTime();
      return {
        allowed: false,
        reason: 'daily_cap_reached',
        retryAfterMs: Math.max(1, retryAfterMs),
        message: `This account has used its ${limits.maxPostsPer24h} posts for the last 24 hours. The next slot frees up shortly.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Remaining posts in the rolling 24-hour window.
 *
 * Surfaced in the composer so a user scheduling a burst can see they are about
 * to exceed the cap while they can still do something about it.
 */
export function remainingDailyBudget(
  now: Date,
  history: AccountHistory,
  limits: PublishingLimits,
): number | null {
  if (limits.maxPostsPer24h === undefined) return null;
  const used = within(history.publishes, now, DAY_MS).length;
  return Math.max(0, limits.maxPostsPer24h - used);
}

/**
 * Marginal cost in USD of publishing one post.
 *
 * X is currently the only major network charging per write, and it charges
 * substantially more when the post contains a link. Surfacing the number lets
 * the scheduler reason about spend, and lets us price a plan that includes X
 * without losing money on it.
 */
export function estimatePostCostUsd(limits: PublishingLimits, containsLink: boolean): number {
  if (containsLink && limits.costPerPostWithLinkUsd !== undefined) {
    return limits.costPerPostWithLinkUsd;
  }
  return limits.costPerPostUsd ?? 0;
}
