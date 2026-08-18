import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  CANONICAL_METRIC_KEYS,
  definitionChangesWithin,
  definitionInEffect,
  isAdditiveAcrossTime,
  isCanonicalMetricKey,
  isConfirmedLive,
  measuredAtOf,
  measurementProblem,
  normalizeMetric,
  verificationOutcomeOf,
  type CanonicalMetricKey,
  type MetricDefinition,
  type MetricNormalization,
  type RawMetric,
} from './metrics.js';

/**
 * The rule these tests exist to hold: a metric that has no faithful equivalent
 * in our vocabulary maps to nothing.
 *
 * Omitting a number leaves a visible gap someone can ask about. Inventing an
 * approximation produces a plausible figure nobody questions, that is quietly
 * wrong in one direction, and that gets compared month over month, put in a deck
 * and used to justify spend. The first costs a conversation; the second costs
 * the client's judgement, and by the time anyone checks it has been wrong for a
 * year.
 */

const COLLECTED = new Date('2026-08-12T06:00:00.000Z');
const PERIOD_START = new Date('2026-08-11T00:00:00.000Z');
const PERIOD_END = new Date('2026-08-12T00:00:00.000Z');

function raw(overrides: Partial<RawMetric> = {}): RawMetric {
  return {
    subjectType: 'post',
    subjectId: '17900000000000000',
    fieldAsReturned: 'impressions',
    value: 1234,
    endpoint: '/{ig-media-id}/insights',
    apiVersion: 'v21.0',
    measureKind: 'period',
    periodStart: PERIOD_START,
    periodEnd: PERIOD_END,
    collectedAt: COLLECTED,
    ...overrides,
  };
}

/** A deliberately narrow mapping: it maps what it understands and nothing else. */
const mapping: MetricNormalization = (metric) =>
  metric.fieldAsReturned === 'impressions' ? 'impressions' : undefined;

/* ── Declining to map ──────────────────────────────────────────────────────── */

test('a field with no faithful equivalent maps to nothing', () => {
  assert.equal(normalizeMetric(raw({ fieldAsReturned: 'plays' }), mapping), undefined);
});

test('declining is an ordinary outcome, not an error, and leaves the raw reading intact', () => {
  const metric = raw({ fieldAsReturned: 'profile_visits_including_ads' });
  assert.equal(normalizeMetric(metric, mapping), undefined);
  // The platform's own field survives at L1 for the day we learn what it means.
  assert.equal(metric.fieldAsReturned, 'profile_visits_including_ads');
});

test('a mapping that declines everything produces no rows at all', () => {
  const declineAll: MetricNormalization = () => undefined;
  const metrics = [raw(), raw({ fieldAsReturned: 'reach' }), raw({ fieldAsReturned: 'saved' })];
  const mapped = metrics.map((m) => normalizeMetric(m, declineAll)).filter((m) => m !== undefined);
  assert.deepEqual(mapped, []);
});

/* ── Refusing malformed readings ───────────────────────────────────────────── */

test('a period measure with no bounded window is refused even when it would map', () => {
  // An unbounded "period" value is indistinguishable from a well-formed one once
  // it is a row, and something downstream will sum it with its neighbours.
  const noWindow = raw({ periodStart: undefined, periodEnd: undefined });
  assert.match(measurementProblem(noWindow) ?? '', /without a bounded window/);
  assert.equal(normalizeMetric(noWindow, mapping), undefined);

  assert.equal(normalizeMetric(raw({ periodEnd: undefined }), mapping), undefined);
});

test('a window that ends before it starts is refused', () => {
  const backwards = raw({ periodStart: PERIOD_END, periodEnd: PERIOD_START });
  assert.match(measurementProblem(backwards) ?? '', /ends before it starts/);
  assert.equal(normalizeMetric(backwards, mapping), undefined);
});

test('a value that is not a finite number is refused', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
    const metric = raw({ value });
    assert.match(measurementProblem(metric) ?? '', /not a finite number/);
    assert.equal(normalizeMetric(metric, mapping), undefined);
  }
});

test('a reading with incomplete provenance is refused', () => {
  // Provenance is the entire justification for storing the number at all.
  for (const missing of [{ endpoint: '' }, { apiVersion: '' }, { fieldAsReturned: '' }]) {
    const metric = raw(missing);
    assert.match(measurementProblem(metric) ?? '', /provenance is incomplete/);
    assert.equal(normalizeMetric(metric, mapping), undefined);
  }
});

test('a well-formed snapshot needs no window', () => {
  const followers = raw({
    subjectType: 'profile',
    fieldAsReturned: 'followers_count',
    measureKind: 'snapshot',
    periodStart: undefined,
    periodEnd: undefined,
  });
  assert.equal(measurementProblem(followers), undefined);
});

/* ── Mapping, and what travels with the row ────────────────────────────────── */

test('a mapped reading carries its provenance and its measure kind', () => {
  const normalized = normalizeMetric(raw(), mapping);
  assert.ok(normalized !== undefined);
  assert.equal(normalized.metricKey, 'impressions');
  assert.equal(normalized.value, 1234);
  // The source field stays the upstream name, not ours: it is the join key back
  // to the definition that says what the platform was counting.
  assert.equal(normalized.sourceField, 'impressions');
  assert.equal(normalized.sourceEndpoint, '/{ig-media-id}/insights');
  assert.equal(normalized.apiVersion, 'v21.0');
  // Without the measure kind a stored number gives no indication of whether it
  // may be summed, and a fact table like that will eventually be added up.
  assert.equal(normalized.measureKind, 'period');
});

test('a period measure is stamped at the end of its window, not when it was fetched', () => {
  const normalized = normalizeMetric(raw(), mapping);
  assert.equal(normalized?.measuredAt.getTime(), PERIOD_END.getTime());
  assert.equal(normalized?.collectedAt.getTime(), COLLECTED.getTime());
});

test('measurement time falls back only as far as it has to', () => {
  assert.equal(measuredAtOf(raw()).getTime(), PERIOD_END.getTime());
  assert.equal(measuredAtOf(raw({ periodEnd: undefined })).getTime(), PERIOD_START.getTime());
  assert.equal(
    measuredAtOf(raw({ periodStart: undefined, periodEnd: undefined })).getTime(),
    COLLECTED.getTime(),
  );
});

test('only period measures may be summed across time', () => {
  // Adding thirty daily follower counts yields a number that is not a quantity
  // of anything, and summing cumulative readings yields a triangular number
  // that grows with how often we happened to poll.
  assert.equal(isAdditiveAcrossTime('period'), true);
  assert.equal(isAdditiveAcrossTime('snapshot'), false);
  assert.equal(isAdditiveAcrossTime('cumulative'), false);
});

test('the canonical key guard covers exactly the published vocabulary', () => {
  for (const key of CANONICAL_METRIC_KEYS) assert.equal(isCanonicalMetricKey(key), true);
  assert.equal(isCanonicalMetricKey('engagement'), false);
  assert.equal(isCanonicalMetricKey('constructor'), false);
  // The presence map is derived from the union, so a key added to one and not
  // the other cannot exist.
  const expected: readonly CanonicalMetricKey[] = [
    'impressions',
    'reach',
    'likes',
    'comments',
    'shares',
    'saves',
    'clicks',
    'video_views',
    'followers',
    'profile_views',
    'engagement_rate',
  ];
  assert.deepEqual([...CANONICAL_METRIC_KEYS].sort(), [...expected].sort());
});

/* ── Definitions, which are what make a number defensible ──────────────────── */

const definitions: readonly MetricDefinition[] = [
  {
    network: 'instagram',
    metricKey: 'impressions',
    sourceField: 'impressions',
    definition: 'Times the media was on screen.',
    effectiveFrom: new Date('2024-01-01T00:00:00.000Z'),
    effectiveTo: new Date('2026-04-21T00:00:00.000Z'),
  },
  {
    network: 'instagram',
    metricKey: 'impressions',
    sourceField: 'views',
    definition: 'Replaces impressions; counts plays and renderings together.',
    effectiveFrom: new Date('2026-04-21T00:00:00.000Z'),
  },
];

test('a March report is annotated with what the metric meant in March', () => {
  // Describing historical numbers with the current definition is how a report
  // ends up confidently describing figures collected under different rules.
  const inMarch = definitionInEffect(definitions, 'impressions', new Date('2026-03-01T00:00:00.000Z'));
  assert.equal(inMarch?.definition, 'Times the media was on screen.');

  // The end of a window is exclusive, so the successor takes over cleanly.
  assert.equal(
    definitionInEffect(definitions, 'impressions', new Date('2026-04-21T00:00:00.000Z')),
    undefined,
  );
  assert.equal(
    definitionInEffect(definitions, 'views', new Date('2026-04-21T00:00:00.000Z'))?.metricKey,
    'impressions',
  );
  assert.equal(
    definitionInEffect(definitions, 'impressions', new Date('2023-01-01T00:00:00.000Z')),
    undefined,
  );
});

test('a delta spanning a redefinition is reported so it can be badged', () => {
  // Reporting a 40% drop without mentioning that the platform changed what it
  // was counting halfway through is how a client concludes their campaign
  // failed when nothing about it changed.
  const changes = definitionChangesWithin(definitions, 'views', {
    from: new Date('2026-01-01T00:00:00.000Z'),
    to: new Date('2026-12-31T00:00:00.000Z'),
  });
  assert.deepEqual(
    changes.map((d) => d.toISOString()),
    ['2026-04-21T00:00:00.000Z'],
  );

  assert.deepEqual(
    definitionChangesWithin(definitions, 'views', {
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-12-31T00:00:00.000Z'),
    }),
    [],
  );
});

/* ── Read-back ─────────────────────────────────────────────────────────────── */

test('a read-back we could not perform is never reported as a live post', () => {
  // Telling a client we do not know is survivable. Telling them a post is live
  // when it was taken down a week ago is not.
  assert.equal(verificationOutcomeOf({ state: 'unavailable', reason: 'no read API' }), 'unavailable');
  assert.equal(isConfirmedLive({ state: 'unavailable', reason: 'no read API' }), false);

  assert.equal(verificationOutcomeOf({ state: 'live' }), 'present');
  assert.equal(isConfirmedLive({ state: 'live' }), true);

  assert.equal(verificationOutcomeOf({ state: 'removed' }), 'missing');
  // Restricted maps to altered: the post exists but is not what we published in
  // the sense that matters, which is its audience.
  assert.equal(verificationOutcomeOf({ state: 'restricted', detail: 'age-gated' }), 'altered');
  assert.equal(isConfirmedLive({ state: 'restricted', detail: 'age-gated' }), false);
});
