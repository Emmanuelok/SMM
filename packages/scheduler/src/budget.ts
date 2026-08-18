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
  /** Our own configured cap, which is stricter than the platform's. */
  | 'safety_cap_reached'
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
export interface BudgetOptions {
  /**
   * A stricter self-imposed daily cap for this account.
   *
   * Publishing right up to a platform's stated ceiling is a good way to be
   * classified as spam, so a margin is prudent. It belongs to the tenant rather
   * than the descriptor: the right margin for a news desk posting hourly is not
   * the right margin for a dentist, and a competitor's fixed, unchangeable cap
   * is a documented source of customer frustration.
   */
  readonly safetyCapPer24h?: number | undefined;
}

export function checkPublishBudget(
  now: Date,
  history: AccountHistory,
  limits: PublishingLimits,
  options: BudgetOptions = {},
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

  // The binding cap is whichever is stricter: the platform's, or ours.
  const platformCap = limits.maxPostsPer24h;
  const safetyCap = options.safetyCapPer24h;
  const effectiveCap =
    platformCap === undefined
      ? safetyCap
      : safetyCap === undefined
        ? platformCap
        : Math.min(platformCap, safetyCap);

  if (effectiveCap !== undefined) {
    const recent = within(history.publishes, now, DAY_MS);
    if (recent.length >= effectiveCap) {
      const oldest = recent[0];
      const retryAfterMs =
        oldest === undefined ? DAY_MS : oldest.getTime() + DAY_MS - now.getTime();
      const isOurs = safetyCap !== undefined && effectiveCap === safetyCap
        && (platformCap === undefined || safetyCap < platformCap);
      return {
        allowed: false,
        reason: isOurs ? 'safety_cap_reached' : 'daily_cap_reached',
        retryAfterMs: Math.max(1, retryAfterMs),
        message: isOurs
          ? `This account has hit your ${effectiveCap} posts per day limit. You can raise it in the account's settings.`
          : `This account has used its ${effectiveCap} posts for the last 24 hours. The next slot frees up shortly.`,
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
  options: BudgetOptions = {},
): number | null {
  const caps = [limits.maxPostsPer24h, options.safetyCapPer24h].filter(
    (c): c is number => c !== undefined,
  );
  if (caps.length === 0) return null;
  const used = within(history.publishes, now, DAY_MS).length;
  return Math.max(0, Math.min(...caps) - used);
}

/**
 * Indicative cost in USD of publishing one post.
 *
 * X is currently the only major network charging per write, and it charges
 * substantially more when the post contains a link. This figure is for display
 * and forecasting — showing a user what a scheduled burst will cost. It may be
 * based on an unconfirmed number, so it must not reach an invoice. Use
 * `billableCostUsd` for anything that charges someone.
 */
export function estimatePostCostUsd(limits: PublishingLimits, containsLink: boolean): number {
  if (containsLink && limits.costPerPostWithLinkUsd !== undefined) {
    return limits.costPerPostWithLinkUsd;
  }
  return limits.costPerPostUsd ?? 0;
}

/**
 * Cost in USD that may be charged to a customer, or null if we do not know.
 *
 * Returns null unless the figure is marked `verified`. Billing a customer from
 * a number we inferred from a changelog is not a rounding error, it is an
 * incorrect invoice, and the correct behaviour when the input is uncertain is
 * to refuse rather than to guess. Callers must handle null by declining to
 * bill and raising the gap for a human, not by falling back to zero.
 */
export function billableCostUsd(limits: PublishingLimits, containsLink: boolean): number | null {
  if (limits.costPerPostUsd === undefined && limits.costPerPostWithLinkUsd === undefined) {
    // The network does not charge for writes at all; zero is a fact.
    return 0;
  }
  if (limits.costConfidence !== 'verified') return null;
  return estimatePostCostUsd(limits, containsLink);
}
