import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { countsAgainstSla, dispositionOf, failure, isRetryable, unsafeId } from '@smm/shared';

import { DEFAULT_ATTEMPT_POLICY, planNextAttempt } from './retry.js';

/**
 * Retry policy, which is the one place in the pipeline where getting it wrong
 * is expensive in both directions: retrying what cannot succeed hammers a
 * platform that has already said no, and retrying what already succeeded
 * double-posts to a customer's audience.
 *
 * The decision of *whether* to retry lives in the failure taxonomy; this module
 * decides *when*, and when to stop. These tests hold the seam between them.
 */

const NOW = new Date('2026-08-12T09:00:00.000Z');
const profileId = unsafeId<'SocialProfileId'>('profile01');

/** A deterministic stand-in for the jitter source. */
const noJitter = () => 1;

test('a rate limit is retried no sooner than the platform said', () => {
  // Our jittered schedule is a guess; the platform's own backoff is fact, and
  // ignoring an explicit one is how an integration earns a suspension.
  const next = planNextAttempt(
    NOW,
    1,
    failure('rate_limited', 'Too many requests.', { retryAfterMs: 900_000 }),
    DEFAULT_ATTEMPT_POLICY,
    noJitter,
  );
  assert.ok(next.action === 'retry');
  assert.equal(next.at.getTime(), NOW.getTime() + 900_000);
  assert.equal(next.attempt, 2);
});

test('our own backoff wins when it is the longer of the two', () => {
  const next = planNextAttempt(
    NOW,
    4,
    failure('platform_unavailable', 'Bad gateway.', { retryAfterMs: 1_000 }),
    DEFAULT_ATTEMPT_POLICY,
    noJitter,
  );
  assert.ok(next.action === 'retry');
  // 30s base doubled three times, with jitter pinned to its maximum.
  assert.equal(next.at.getTime() - NOW.getTime(), 240_000);
});

test('a failure that cannot succeed is given up on immediately', () => {
  const next = planNextAttempt(NOW, 1, failure('validation_failed', 'Caption too long.'));
  assert.ok(next.action === 'give_up');
  assert.equal(next.reason, 'Caption too long.');
});

test('an idempotency conflict is never retried', () => {
  // A conflict nearly always means the post is already live, so the obvious
  // response — try again — is the one that double-posts.
  assert.equal(isRetryable(failure('idempotency_conflict', 'Key already used.')), false);
  const next = planNextAttempt(NOW, 1, failure('idempotency_conflict', 'Key already used.'));
  assert.ok(next.action === 'give_up');
});

test('an expired token waits for a human rather than burning attempts', () => {
  const next = planNextAttempt(NOW, 1, failure('auth_expired', 'Token expired.'));
  assert.equal(next.action, 'await_reconnect');
});

test('a missing scope on a known account produces a repair link, not an alert', () => {
  // The whole value of naming the account is that an agency can forward a link
  // to the client who owns it. A connection that only shows up as an error
  // state stays broken.
  const next = planNextAttempt(
    NOW,
    1,
    failure('scope_missing', 'This account has not granted permission to publish.', {
      profileId,
      missingScope: 'tweet.write',
    }),
  );
  assert.ok(next.action === 'send_repair_link');
  assert.equal(next.profileId, profileId);
});

test('a missing scope on an unknown account falls back to waiting', () => {
  // Without the profile there is no connection to send anyone to, so the honest
  // outcome is the weaker one rather than a link that goes nowhere.
  const next = planNextAttempt(NOW, 1, failure('scope_missing', 'Permission withdrawn.'));
  assert.equal(next.action, 'await_reconnect');
});

test('a repair link is offered on the first attempt, not after the retries run out', () => {
  // Waiting for the attempt budget to drain only delays the moment somebody is
  // asked to fix it; consent does not become granted by the passage of time.
  const withProfile = failure('auth_revoked', 'Access revoked.', { profileId });
  for (const attempts of [1, DEFAULT_ATTEMPT_POLICY.maxAttempts + 5]) {
    assert.equal(planNextAttempt(NOW, attempts, withProfile).action, 'send_repair_link');
  }
});

test('a retryable failure stops once the attempt budget is spent', () => {
  // Few enough attempts that a genuinely broken post surfaces to the user the
  // same day rather than retrying into silence.
  const next = planNextAttempt(
    NOW,
    DEFAULT_ATTEMPT_POLICY.maxAttempts,
    failure('transient', 'Connection reset.'),
  );
  assert.ok(next.action === 'give_up');
  assert.match(next.reason, /Gave up after 6 attempts/);
});

test('every disposition the taxonomy can produce is handled here', () => {
  // The arm this file gained exists because the taxonomy grew one. If it grows
  // another, this is the test that should notice.
  const actions = new Set(
    [
      failure('rate_limited', 'x'),
      failure('validation_failed', 'x'),
      failure('auth_expired', 'x'),
      failure('scope_missing', 'x', { profileId }),
    ].map((f) => planNextAttempt(NOW, 1, f).action),
  );
  assert.deepEqual(
    [...actions].sort(),
    ['await_reconnect', 'give_up', 'retry', 'send_repair_link'],
  );
});

test('a platform outage is not counted against our own reliability', () => {
  // Counting it makes the metric useless for finding the failures that are ours.
  assert.equal(countsAgainstSla(failure('platform_unavailable', 'x')), false);
  assert.equal(countsAgainstSla(failure('plan_insufficient', 'x')), false);
  assert.equal(countsAgainstSla(failure('internal', 'x')), true);
  // `unknown` counts deliberately: making the unclassified case free would
  // remove the pressure to classify it.
  assert.equal(countsAgainstSla(failure('unknown', 'x')), true);
});

test('a quota with no stated reset time falls back to an hour', () => {
  // Only the fallback. The behaviour that matters — waiting until the window
  // actually refills — needs a quotaResetAt and is covered in
  // adapters/src/regressions.test.ts, where it belongs alongside the defect it
  // was introduced to prevent.
  const disposition = dispositionOf(failure('quota_exhausted', 'Daily units used up.'));
  assert.ok(disposition.action === 'retry');
  assert.equal(disposition.retryAfterMs, 3_600_000);
});
