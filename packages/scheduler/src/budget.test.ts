import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import type { PublishingLimits } from '@smm/adapters';
import { failure } from '@smm/shared';

import {
  billableCostUsd,
  checkPublishBudget,
  estimatePostCostUsd,
  remainingDailyBudget,
} from './budget.js';
import { DEFAULT_ATTEMPT_POLICY, planNextAttempt } from './retry.js';

const NOW = new Date('2026-06-15T12:00:00Z');
const MINUTE = 60_000;
const HOUR = 3_600_000;

function ago(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

const TIKTOK_LIMITS: PublishingLimits = {
  maxPostsPer24h: 15,
  maxRequestsPerMinute: 6,
  rejectsDuplicateContent: false,
};

test('permits a publish when no limit binds', () => {
  const decision = checkPublishBudget(NOW, { publishes: [], requests: [] }, TIKTOK_LIMITS);
  assert.deepEqual(decision, { allowed: true });
});

test('blocks once the rolling 24-hour cap is used up', () => {
  const publishes = Array.from({ length: 15 }, (_, i) => ago((i + 1) * HOUR));
  const decision = checkPublishBudget(NOW, { publishes, requests: [] }, TIKTOK_LIMITS);

  assert.equal(decision.allowed, false);
  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'daily_cap_reached');
  // The oldest post was 15h ago, so capacity returns 9h from now.
  assert.equal(decision.retryAfterMs, 9 * HOUR);
});

test('the 24-hour window is rolling, not a calendar day', () => {
  // Fifteen posts, but all older than 24h — they no longer count.
  const publishes = Array.from({ length: 15 }, (_, i) => ago(25 * HOUR + i * MINUTE));
  const decision = checkPublishBudget(NOW, { publishes, requests: [] }, TIKTOK_LIMITS);
  assert.equal(decision.allowed, true);
});

test('blocks on the per-minute request ceiling', () => {
  const requests = Array.from({ length: 6 }, (_, i) => ago(i * 1000 + 1000));
  const decision = checkPublishBudget(NOW, { publishes: [], requests }, TIKTOK_LIMITS);

  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'request_rate');
  // The oldest of the six was 6s ago, so a slot frees in 54s.
  assert.equal(decision.retryAfterMs, 54_000);
});

test('enforces minimum spacing between posts', () => {
  const limits: PublishingLimits = { minIntervalSec: 600, rejectsDuplicateContent: false };
  const decision = checkPublishBudget(
    NOW,
    { publishes: [ago(2 * MINUTE)], requests: [] },
    limits,
  );

  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'min_interval');
  assert.equal(decision.retryAfterMs, 8 * MINUTE);
});

test('holds back posts from an account too new to publish', () => {
  const limits: PublishingLimits = { newAccountWarmupDays: 14, rejectsDuplicateContent: false };
  const decision = checkPublishBudget(
    NOW,
    { publishes: [], requests: [], connectedAt: ago(3 * 24 * HOUR) },
    limits,
  );

  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'account_warming_up');
  assert.equal(decision.retryAfterMs, 11 * 24 * HOUR);
});

test('an aged account is no longer held back', () => {
  const limits: PublishingLimits = { newAccountWarmupDays: 14, rejectsDuplicateContent: false };
  const decision = checkPublishBudget(
    NOW,
    { publishes: [], requests: [], connectedAt: ago(20 * 24 * HOUR) },
    limits,
  );
  assert.equal(decision.allowed, true);
});

test('reports remaining daily budget for the composer', () => {
  const publishes = Array.from({ length: 4 }, (_, i) => ago((i + 1) * HOUR));
  assert.equal(remainingDailyBudget(NOW, { publishes, requests: [] }, TIKTOK_LIMITS), 11);
  assert.equal(
    remainingDailyBudget(NOW, { publishes: [], requests: [] }, { rejectsDuplicateContent: false }),
    null,
  );
});

test('a stricter self-imposed cap binds before the platform cap', () => {
  const publishes = Array.from({ length: 10 }, (_, i) => ago((i + 1) * 30 * MINUTE));
  const decision = checkPublishBudget(
    NOW,
    { publishes, requests: [] },
    TIKTOK_LIMITS, // platform allows 15
    { safetyCapPer24h: 10 },
  );

  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'safety_cap_reached');
  // The message must point at the setting, since the user can change this one.
  assert.match(decision.message, /settings/i);
});

test('the platform cap still binds when it is the stricter of the two', () => {
  const publishes = Array.from({ length: 15 }, (_, i) => ago((i + 1) * 30 * MINUTE));
  const decision = checkPublishBudget(
    NOW,
    { publishes, requests: [] },
    TIKTOK_LIMITS,
    { safetyCapPer24h: 50 },
  );
  assert.ok(!decision.allowed);
  assert.equal(decision.reason, 'daily_cap_reached');
});

test('remaining budget reflects whichever cap is stricter', () => {
  const publishes = Array.from({ length: 4 }, (_, i) => ago((i + 1) * HOUR));
  assert.equal(
    remainingDailyBudget(NOW, { publishes, requests: [] }, TIKTOK_LIMITS, { safetyCapPer24h: 10 }),
    6,
  );
});

test('billing refuses a cost figure we have not confirmed', () => {
  // X's per-post pricing is the highest-consequence unverified number in the
  // research. Charging a customer from it would be an incorrect invoice.
  const unverified: PublishingLimits = {
    rejectsDuplicateContent: true,
    costPerPostUsd: 0.015,
    costPerPostWithLinkUsd: 0.2,
    costConfidence: 'unverified',
  };
  assert.equal(billableCostUsd(unverified, false), null);
  // It is still shown to the user as an estimate.
  assert.equal(estimatePostCostUsd(unverified, false), 0.015);

  const verified: PublishingLimits = { ...unverified, costConfidence: 'verified' };
  assert.equal(billableCostUsd(verified, true), 0.2);

  // A network that charges nothing is a fact, not a guess.
  assert.equal(billableCostUsd(TIKTOK_LIMITS, true), 0);
});

test('prices a post, including the surcharge for links', () => {
  const xLimits: PublishingLimits = {
    rejectsDuplicateContent: true,
    costPerPostUsd: 0.015,
    costPerPostWithLinkUsd: 0.2,
  };
  assert.equal(estimatePostCostUsd(xLimits, false), 0.015);
  assert.equal(estimatePostCostUsd(xLimits, true), 0.2);
  // Networks that do not charge cost nothing, link or not.
  assert.equal(estimatePostCostUsd(TIKTOK_LIMITS, true), 0);
});

// --- retry policy -----------------------------------------------------------

test('an expired token waits for the user, not for a timer', () => {
  const next = planNextAttempt(NOW, 1, failure('auth_expired', 'Token expired'));
  assert.deepEqual(next, { action: 'await_reconnect' });
});

test('content the network will never accept is not retried', () => {
  for (const kind of ['validation_failed', 'media_rejected', 'duplicate_content'] as const) {
    const next = planNextAttempt(NOW, 1, failure(kind, 'nope'));
    assert.equal(next.action, 'give_up', `${kind} should not retry`);
  }
});

test('transient failures are retried with backoff', () => {
  // Fixed random so the jitter is deterministic.
  const next = planNextAttempt(
    NOW,
    1,
    failure('platform_unavailable', 'API down'),
    DEFAULT_ATTEMPT_POLICY,
    () => 1,
  );
  assert.equal(next.action, 'retry');
  assert.ok(next.action === 'retry');
  assert.equal(next.attempt, 2);
  assert.ok(next.at > NOW);
});

test("a platform's own backoff wins over our shorter guess", () => {
  const next = planNextAttempt(
    NOW,
    1,
    failure('rate_limited', 'Slow down', { retryAfterMs: 15 * MINUTE }),
    DEFAULT_ATTEMPT_POLICY,
    () => 0, // our jitter would suggest waiting no time at all
  );
  assert.ok(next.action === 'retry');
  assert.equal(next.at.getTime() - NOW.getTime(), 15 * MINUTE);
});

test('gives up once the attempt budget is spent', () => {
  const next = planNextAttempt(NOW, 6, failure('platform_unavailable', 'still down'));
  assert.equal(next.action, 'give_up');
  assert.ok(next.action === 'give_up');
  assert.match(next.reason, /6 attempts/);
});

test('backoff grows with each attempt', () => {
  // With random fixed at 1, jitter returns the full exponential value.
  const delays = [1, 2, 3, 4].map((attempt) => {
    const next = planNextAttempt(
      NOW,
      attempt,
      failure('platform_unavailable', 'down'),
      DEFAULT_ATTEMPT_POLICY,
      () => 1,
    );
    assert.ok(next.action === 'retry');
    return next.at.getTime() - NOW.getTime();
  });

  for (let i = 1; i < delays.length; i += 1) {
    const prev = delays[i - 1];
    const cur = delays[i];
    assert.ok(prev !== undefined && cur !== undefined);
    assert.ok(cur > prev, `delay should grow: ${prev} -> ${cur}`);
  }
});
