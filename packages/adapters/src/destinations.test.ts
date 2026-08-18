import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { InvariantError, unsafeId } from '@smm/shared';

import type { MediaRef } from './content.js';
import {
  DEFAULT_RULE_TTL_SECONDS,
  blockedByRules,
  destinationLabel,
  groupByConnection,
  postableDestinations,
  rulesExpired,
  validateAgainstRules,
  type Destination,
  type DestinationRule,
  type DestinationRuleKind,
  type DestinationRuleSet,
  type DestinationTarget,
} from './destinations.js';

/**
 * Destination rules are fetched live because whoever runs the destination
 * changes them without notice. What is tested here is the composer's half of
 * that bargain: a machine-enforced rule has to block before the post is queued,
 * a human-enforced one has to warn rather than block, and a rule set that
 * belongs to a different destination has to be an error rather than a silent
 * pass — because a silent pass publishes content nothing checked.
 */

const destinationId = unsafeId<'DestinationId'>('dest0001');
const otherDestination = unsafeId<'DestinationId'>('dest0002');
const connectionId = unsafeId<'ConnectionId'>('conn0001');
const profileId = unsafeId<'SocialProfileId'>('profile01');

function target(overrides: Partial<DestinationTarget> = {}): DestinationTarget {
  return {
    network: 'reddit',
    profileId,
    destinationId,
    format: 'text',
    body: 'hello',
    media: [],
    ...overrides,
  };
}

function image(): MediaRef {
  return {
    assetId: unsafeId<'MediaAssetId'>('asset001'),
    kind: 'image',
    bytes: 1000,
    mimeType: 'image/jpeg',
  };
}

function rule(kind: DestinationRuleKind, overrides: Partial<DestinationRule> = {}): DestinationRule {
  return {
    destinationId,
    kind,
    required: true,
    remediation: 'Pick a flair before scheduling.',
    ...overrides,
  };
}

/* ── Rules the user answers with a choice ──────────────────────────────────── */

test('a mandatory flair with nothing chosen blocks the post', () => {
  const violations = validateAgainstRules(target(), [
    rule('flair', {
      allowedValues: [
        { id: 'f1', label: 'Discussion' },
        { id: 'f2', label: 'News' },
      ],
    }),
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.severity, 'error');
  assert.equal(violations[0]?.rule, 'flair');
  assert.equal(violations[0]?.destinationId, destinationId);
  // The remediation travels with the violation, so the UI never has to invent
  // an instruction of its own.
  assert.equal(violations[0]?.remediation, 'Pick a flair before scheduling.');
  // And the choices come with it, so the fix is a picker rather than a hunt.
  assert.equal(violations[0]?.allowedValues?.length, 2);
  assert.equal(blockedByRules(violations), true);
});

test('a chosen flair that satisfies the rule produces nothing', () => {
  const violations = validateAgainstRules(
    target({ selections: { flair: 'f1' } }),
    [rule('flair', { allowedValues: [{ id: 'f1', label: 'Discussion' }] })],
  );
  assert.deepEqual(violations, []);
});

test('a flair deleted since the post was scheduled is caught before it goes out', () => {
  // A moderator can delete a flair between scheduling and publishing. Catching
  // it here turns a rejected post into a prompt while somebody is still looking
  // at the screen.
  const violations = validateAgainstRules(
    target({ selections: { flair: 'gone' } }),
    [rule('flair', { allowedValues: [{ id: 'f1', label: 'Discussion' }] })],
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.severity, 'error');
  assert.match(violations[0]?.message ?? '', /no longer exists/);
});

test('an optional choice left unanswered is not a problem', () => {
  const violations = validateAgainstRules(target(), [
    rule('board_section', { required: false, allowedValues: [{ id: 's1', label: 'Recipes' }] }),
  ]);
  assert.deepEqual(violations, []);
});

test('an empty string counts as no choice at all', () => {
  const violations = validateAgainstRules(target({ selections: { content_warning: '' } }), [
    rule('content_warning'),
  ]);
  assert.equal(violations.length, 1);
  assert.match(violations[0]?.message ?? '', /content warning/);
});

/* ── Rules about the shape of the post ─────────────────────────────────────── */

test('a destination that refuses link posts blocks one', () => {
  const violations = validateAgainstRules(
    target({ link: 'https://example.com' }),
    [rule('link_posts_forbidden', { remediation: 'Post the text without a link.' })],
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.code, 'format_unsupported');
  assert.equal(violations[0]?.field, 'body');

  assert.deepEqual(validateAgainstRules(target(), [rule('link_posts_forbidden')]), []);
});

test('a destination that refuses media blocks a post carrying it', () => {
  const violations = validateAgainstRules(
    target({ media: [image()] }),
    [rule('media_posts_forbidden', { remediation: 'Remove the image.' })],
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.code, 'media_type_unsupported');
});

test('a post carrying a link is not a text-only post', () => {
  // Nowhere that draws this distinction counts a link post as text-only, so
  // only a bare body trips the rule.
  const bare = validateAgainstRules(target(), [rule('text_posts_forbidden')]);
  assert.equal(bare.length, 1);
  assert.equal(bare[0]?.code, 'media_required');

  assert.deepEqual(
    validateAgainstRules(target({ link: 'https://example.com' }), [rule('text_posts_forbidden')]),
    [],
  );
  assert.deepEqual(
    validateAgainstRules(target({ media: [image()] }), [rule('text_posts_forbidden')]),
    [],
  );
});

test("a destination's own title limit is counted in characters a person can see", () => {
  // Destinations state their limits the way a person counts, so an emoji is one
  // character here even though it is two UTF-16 units.
  const title = '👍'.repeat(6);
  assert.equal(title.length, 12);

  const over = validateAgainstRules(target({ title }), [rule('title_length', { limit: 5 })]);
  assert.equal(over.length, 1);
  assert.equal(over[0]?.code, 'title_too_long');
  assert.equal(over[0]?.field, 'title');
  assert.match(over[0]?.message ?? '', /is 6 characters/);

  assert.deepEqual(validateAgainstRules(target({ title }), [rule('title_length', { limit: 6 })]), []);
  // No title, or no stated limit, is nothing to check.
  assert.deepEqual(validateAgainstRules(target(), [rule('title_length', { limit: 5 })]), []);
  assert.deepEqual(validateAgainstRules(target({ title }), [rule('title_length')]), []);
});

/* ── Rules about the connection rather than the draft ──────────────────────── */

test('a precondition the adapter confirmed produces nothing', () => {
  assert.deepEqual(
    validateAgainstRules(target(), [rule('bot_permission', { satisfied: true })]),
    [],
  );
});

test('a failed precondition names the grants that are missing', () => {
  // "Grant Send Messages and Embed Links in #announcements" is actionable;
  // "the bot lacks permission" is not.
  const violations = validateAgainstRules(target(), [
    rule('bot_permission', {
      satisfied: false,
      requiredGrants: ['Send Messages', 'Embed Links'],
      sourceText: 'This bot cannot post in this channel.',
      remediation: 'Grant the bot Send Messages in this channel.',
    }),
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.severity, 'error');
  assert.match(violations[0]?.message ?? '', /Send Messages, Embed Links/);
});

test('an unevaluated precondition warns rather than blocking or staying silent', () => {
  // Silence would let a post look schedulable and fail at 2am with nobody
  // watching. An error would cost the user a posting slot over a guess.
  const unevaluated = validateAgainstRules(target(), [rule('account_standing')]);
  assert.equal(unevaluated.length, 1);
  assert.equal(unevaluated[0]?.severity, 'warning');
  assert.equal(blockedByRules(unevaluated), false);

  // Where the destination does not machine-enforce it, there is nothing to say.
  assert.deepEqual(
    validateAgainstRules(target(), [rule('post_interval', { required: false })]),
    [],
  );
});

test('a moderation hold is information, never a failure', () => {
  // The post is accepted; it simply does not appear until a human approves it,
  // which somebody scheduling an announcement around 09:00 needs to know.
  const violations = validateAgainstRules(target(), [
    rule('moderation_hold', { remediation: 'Expect a delay before it appears.' }),
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.severity, 'info');
  assert.equal(blockedByRules(violations), false);
});

/* ── Enforcement strength and cache identity ───────────────────────────────── */

test('a rule the destination does not machine-enforce warns instead of blocking', () => {
  // Blocking on a sidebar rule moderators apply unevenly would stop posts the
  // destination would have accepted.
  const violations = validateAgainstRules(
    target({ link: 'https://example.com' }),
    [rule('link_posts_forbidden', { required: false })],
  );
  assert.equal(violations[0]?.severity, 'warning');
  assert.equal(blockedByRules(violations), false);
});

test('every rule is reported, not just the first', () => {
  // A user fixing one problem per attempt gives up before the third.
  const violations = validateAgainstRules(target({ link: 'https://example.com', media: [image()] }), [
    rule('link_posts_forbidden'),
    rule('media_posts_forbidden'),
    rule('flair'),
  ]);
  assert.equal(violations.length, 3);
});

test('a rule set fetched for another destination is an error, not a skip', () => {
  // Rules are cached per destination, so this means a cache key is wrong.
  // Skipping quietly would publish content that was never checked.
  assert.throws(
    () => validateAgainstRules(target(), [rule('flair', { destinationId: otherDestination })]),
    InvariantError,
  );
});

test('a cached rule set expires so a flair added this morning is not missed', () => {
  const fetchedAt = new Date('2026-08-12T09:00:00.000Z');
  const set: DestinationRuleSet = {
    destinationId,
    rules: [],
    fetchedAt,
    ttlSeconds: DEFAULT_RULE_TTL_SECONDS,
    stale: false,
  };
  assert.equal(DEFAULT_RULE_TTL_SECONDS, 3_600);
  assert.equal(rulesExpired(set, new Date(fetchedAt.getTime() + 3_599_000)), false);
  // The boundary counts as expired: a TTL that has elapsed exactly has elapsed.
  assert.equal(rulesExpired(set, new Date(fetchedAt.getTime() + 3_600_000)), true);
});

/* ── Picking a destination ─────────────────────────────────────────────────── */

function destination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: destinationId,
    connectionId,
    network: 'google_business',
    kind: 'location',
    remoteId: unsafeId<'RemoteId'>('locations/1'),
    name: 'Bakery',
    postable: true,
    discoveredAt: new Date('2026-08-12T09:00:00.000Z'),
    ...overrides,
  };
}

test('a picker row is disambiguated, because a franchise list is 400 identical names', () => {
  assert.equal(destinationLabel(destination()), 'Bakery');
  assert.equal(
    destinationLabel(destination({ disambiguator: '14 High Street, Leeds' })),
    'Bakery — 14 High Street, Leeds',
  );
});

test('unpostable destinations are kept but not offered as targets', () => {
  // They must still appear in the list, greyed out and explained, or the user
  // concludes the connection failed and reconnects it repeatedly to no effect.
  const all = [
    destination(),
    destination({
      id: otherDestination,
      postable: false,
      notPostableReason: 'This location is not verified with Google yet.',
    }),
  ];
  assert.equal(all.length, 2);
  assert.deepEqual(
    postableDestinations(all).map((d) => d.id),
    [destinationId],
  );
});

test('destinations group under the grant that would take them all down', () => {
  const other = unsafeId<'ConnectionId'>('conn0002');
  const grouped = groupByConnection([
    destination(),
    destination({ id: otherDestination }),
    destination({ id: unsafeId<'DestinationId'>('dest0003'), connectionId: other }),
  ]);
  assert.equal(grouped.size, 2);
  assert.equal(grouped.get(connectionId)?.length, 2);
  assert.equal(grouped.get(other)?.length, 1);
});
