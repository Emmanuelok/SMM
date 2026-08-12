import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { unsafeId } from '@smm/shared';

import type { HealthReport } from './connection.js';
import type { PostFormat, ResolvedTarget } from './content.js';
import { LINKEDIN, X } from './registry.js';
import {
  DEFAULT_DUPLICATE_WINDOW_HOURS,
  HEALTH_REPORT_STALE_AFTER_HOURS,
  validateWithContext,
  type RecentPost,
  type ValidationContext,
} from './validation.js';

/**
 * The contextual layer catches what a capability descriptor structurally cannot
 * know: a connection that lost a scope yesterday, a destination that added a
 * mandatory flair this morning, a body that reads identically to one queued on
 * five other profiles. Each of those is otherwise a post that fails at 02:00 on
 * a date the customer chose, with nobody watching.
 */

const profileId = unsafeId<'SocialProfileId'>('profile01');
const NOW = new Date('2026-08-12T09:00:00.000Z');

const HEALTHY: HealthReport = {
  status: 'healthy',
  checkedAt: NOW,
  message: 'Connected.',
};

function target(overrides: Partial<ResolvedTarget> & { format: PostFormat }): ResolvedTarget {
  return {
    network: 'x',
    profileId,
    body: '',
    media: [],
    ...overrides,
  };
}

function context(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    now: NOW,
    connectionHealth: HEALTHY,
    quota: {},
    ...overrides,
  };
}

function recent(body: string, hoursAgo: number, id = 'target01'): RecentPost {
  return {
    targetId: unsafeId<'PostTargetId'>(id),
    body,
    at: new Date(NOW.getTime() - hoursAgo * 3_600_000),
  };
}

const BODY =
  'Our spring sale starts on Monday with 20% off everything in store. Come early, because the best pieces go first.';

/* ── Near-duplicate detection ──────────────────────────────────────────────── */

test('a near-duplicate warns and never blocks on its own', () => {
  // We do not know the platforms' thresholds and they change them. Refusing to
  // publish something the platform would have accepted costs a posting slot and
  // the user's trust in the check; letting a duplicate through costs a
  // dismissible notice.
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [recent(`${BODY} #sale #shopping`, 2)] }),
  );

  const issue = report.issues.find((i) => i.code === 'near_duplicate_content');
  assert.ok(issue !== undefined);
  assert.equal(issue.severity, 'warning');
  assert.equal(issue.field, 'body');
  assert.equal(report.publishable, true);
  assert.equal(report.delivery, 'auto');
});

test('the finding is structured, not a sentence the composer has to re-parse', () => {
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [recent(BODY, 1, 'target01'), recent(BODY, 5, 'target02')] }),
  );

  assert.ok(report.duplicate !== undefined);
  assert.equal(report.duplicate.score, 1);
  // The threshold travels with the score: "94% similar" alone does not tell the
  // user whether that is close to the line or far past it.
  assert.equal(report.duplicate.threshold, 0.85);
  assert.equal(report.duplicate.windowHours, DEFAULT_DUPLICATE_WINDOW_HOURS);
  assert.deepEqual([...report.duplicate.conflictingTargets], ['target01', 'target02']);
});

test('a dozen conflicts produce one warning rather than a dozen', () => {
  // A queue refilled from a small library trips against everything in it, and a
  // dozen identical warnings is noise the user learns to scroll past.
  const posts = Array.from({ length: 12 }, (_, i) => recent(BODY, i + 1, `target${String(i)}`));
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: posts }),
  );

  assert.equal(report.issues.filter((i) => i.code === 'near_duplicate_content').length, 1);
  assert.equal(report.duplicate?.conflictingTargets.length, 12);
  assert.match(report.duplicate?.message ?? '', /12 posts/);
});

test('a cross-post is described as profiles, not as a count of posts', () => {
  // "queued on 6 profiles" is something a user recognises as their own
  // cross-post; "6 posts" is something they wonder about.
  const posts: readonly RecentPost[] = [
    { ...recent(BODY, 1, 'target01'), profileId },
    { ...recent(BODY, 1, 'target02'), profileId: unsafeId<'SocialProfileId'>('profile02') },
  ];
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: posts }),
  );
  assert.match(report.duplicate?.message ?? '', /across 2 profiles/);
});

test('a queued post counts as much as a published one', () => {
  // Publishing a near-duplicate an hour before its twin goes out is the same
  // collision, so future-dated entries are not skipped.
  const queued: RecentPost = {
    targetId: unsafeId<'PostTargetId'>('target09'),
    body: BODY,
    at: new Date(NOW.getTime() + 3_600_000),
  };
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [queued] }),
  );
  assert.ok(report.duplicate !== undefined);
});

test('a post older than the window is not a duplicate', () => {
  // A quarterly evergreen repost is a deliberate and legitimate act.
  const old = recent(BODY, DEFAULT_DUPLICATE_WINDOW_HOURS + 1);
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [old] }),
  );
  assert.equal(report.duplicate, undefined);

  const widened = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [old], duplicateWindowHours: DEFAULT_DUPLICATE_WINDOW_HOURS + 24 }),
  );
  assert.ok(widened.duplicate !== undefined);
  assert.equal(widened.duplicate.windowHours, DEFAULT_DUPLICATE_WINDOW_HOURS + 24);
});

test('a stricter network can raise the threshold it is checked against', () => {
  const nearly = `${BODY} A few pieces are excluded.`;
  const lenient = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [recent(nearly, 1)] }),
  );
  assert.ok(lenient.duplicate !== undefined, 'the default threshold should flag this pair');

  const strict = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [recent(nearly, 1)], duplicateThreshold: 0.99 }),
  );
  assert.equal(strict.duplicate, undefined);
});

test('unrelated recent posts produce no finding', () => {
  const report = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({
      recentPosts: [recent('We are hiring a senior backend engineer for the payments team.', 1)],
    }),
  );
  assert.equal(report.duplicate, undefined);
  assert.equal(report.issues.some((i) => i.code === 'near_duplicate_content'), false);
});

test('an empty body is not compared against anything', () => {
  // Every media-only post would otherwise be a duplicate of every other one.
  const report = validateWithContext(
    target({ format: 'image', body: '', media: [] }),
    X,
    context({ recentPosts: [recent('', 1)] }),
  );
  assert.equal(report.duplicate, undefined);
});

test('a network that refuses repeats says so in the warning', () => {
  const onX = validateWithContext(
    target({ format: 'text', body: BODY }),
    X,
    context({ recentPosts: [recent(BODY, 1)] }),
  );
  const message = onX.issues.find((i) => i.code === 'near_duplicate_content')?.message ?? '';
  assert.match(message, /refuses posts it considers repeats/);

  const onLinkedIn = validateWithContext(
    target({ format: 'text', network: 'linkedin', body: BODY }),
    LINKEDIN,
    context({ recentPosts: [recent(BODY, 1)] }),
  );
  const lenient = onLinkedIn.issues.find((i) => i.code === 'near_duplicate_content')?.message ?? '';
  assert.doesNotMatch(lenient, /refuses posts it considers repeats/);
});

/* ── The static layer is layered on, not rewritten ─────────────────────────── */

test('the static report survives the contextual pass unchanged', () => {
  // The two layers must not contradict each other about the same fact, so
  // issues are added rather than edited or removed.
  const overLong = target({ format: 'text', body: 'x'.repeat(400) });
  const report = validateWithContext(overLong, X, context());
  assert.ok(report.issues.some((i) => i.code === 'text_too_long'));
  assert.equal(report.publishable, false);
  assert.equal(report.delivery, 'blocked');
  assert.deepEqual(report.ruleViolations, []);
});

test('a connection that cannot publish blocks, and an ageing check only warns', () => {
  const revoked = validateWithContext(
    target({ format: 'text', body: 'hello' }),
    X,
    context({
      connectionHealth: {
        status: 'scope_insufficient',
        checkedAt: NOW,
        message: 'This account no longer grants permission to publish.',
        missingScopes: ['tweet.write'],
      },
    }),
  );
  const blocked = revoked.issues.find((i) => i.code === 'connection_not_ready');
  assert.equal(blocked?.severity, 'error');
  // Naming the scope is the difference between "reconnect your account" and a
  // consent screen that adds one permission.
  assert.match(blocked?.message ?? '', /tweet\.write/);
  assert.equal(revoked.publishable, false);

  const stale = validateWithContext(
    target({ format: 'text', body: 'hello' }),
    X,
    context({
      connectionHealth: {
        ...HEALTHY,
        checkedAt: new Date(NOW.getTime() - (HEALTH_REPORT_STALE_AFTER_HOURS + 1) * 3_600_000),
      },
    }),
  );
  // A stale green is worse than a red, because nobody looks at it twice.
  assert.equal(stale.issues.find((i) => i.code === 'connection_not_ready')?.severity, 'warning');
  assert.equal(stale.publishable, true);
});

test('destination rules arrive merged into the issues and separately', () => {
  const destinationId = unsafeId<'DestinationId'>('dest0001');
  const report = validateWithContext(
    target({ format: 'text', body: 'hello' }),
    X,
    context({
      destination: {
        destinationId,
        rules: [
          {
            destinationId,
            kind: 'flair',
            required: true,
            remediation: 'Choose a flair.',
            allowedValues: [{ id: 'f1', label: 'Discussion' }],
          },
        ],
      },
    }),
  );

  assert.equal(report.ruleViolations.length, 1);
  const violation = report.ruleViolations[0];
  assert.ok(violation !== undefined);
  assert.equal(violation.rule, 'flair');
  // A user does not care that the caption limit came from a static descriptor
  // and the flair requirement from a live fetch; it is one list of problems.
  assert.ok(report.issues.includes(violation));
  assert.equal(report.publishable, false);
});

test('spend caps block only on a price we have actually confirmed', () => {
  // X's per-post pricing is recorded as unverified, and stopping somebody's
  // campaign on a figure we inferred is the same mistake as invoicing for one.
  const report = validateWithContext(
    target({ format: 'text', body: 'hello', link: 'https://example.com' }),
    X,
    context({ quota: { tenantSpendRemainingUsd: 0.01 } }),
  );
  const cost = report.issues.find((i) => i.code === 'cost_exceeds_cap');
  assert.equal(cost?.severity, 'warning');
  assert.match(cost?.message ?? '', /best estimate/);
  assert.equal(report.publishable, true);
});
