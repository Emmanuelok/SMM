import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  DEFAULT_WEEK,
  nextFreeSlot,
  nextOccurrences,
  parseLocalTime,
  type PostingSchedule,
  type QueueSlot,
} from './queue.js';

/**
 * A queue is only worth having if its times survive a year.
 *
 * Most of what is tested here is daylight saving, because that is where a
 * weekly grid quietly stops matching the week its owner set up — and it fails
 * in a way nobody notices for months, since a post going out an hour early
 * still goes out.
 */

function slot(partial: Partial<QueueSlot> & Pick<QueueSlot, 'dayOfWeek' | 'localTime'>): QueueSlot {
  return {
    id: `${partial.dayOfWeek}-${partial.localTime}`,
    categoryId: null,
    acceptsFormats: [],
    ...partial,
  };
}

function schedule(timezone: string, slots: readonly QueueSlot[]): PostingSchedule {
  return { id: 'sched1', timezone, slots };
}

test('the next occurrence of a weekly slot lands on the right weekday', () => {
  // Wednesday 2026-06-10, 12:00 UTC.
  const after = new Date('2026-06-10T12:00:00Z');
  const result = nextOccurrences(
    schedule('UTC', [slot({ dayOfWeek: 5, localTime: '09:00' })]),
    { after, limit: 1 },
  );

  assert.ok(result.ok);
  assert.equal(result.occurrences[0]?.local, '2026-06-12T09:00');
  assert.equal(result.occurrences[0]?.at.toISOString(), '2026-06-12T09:00:00.000Z');
});

test('a slot later the same day is used before next week', () => {
  const after = new Date('2026-06-10T06:00:00Z');
  const result = nextOccurrences(
    schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00' })]),
    { after, limit: 1 },
  );

  assert.ok(result.ok);
  assert.equal(result.occurrences[0]?.local, '2026-06-10T09:00');
});

test('an occurrence exactly at the cutoff is not offered', () => {
  // Otherwise "queue this now" can hand back an instant already in the past by
  // the time the row is written, and the dispatcher fires it immediately.
  const after = new Date('2026-06-10T09:00:00Z');
  const result = nextOccurrences(
    schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00' })]),
    { after, limit: 1 },
  );

  assert.ok(result.ok);
  assert.equal(result.occurrences[0]?.local, '2026-06-17T09:00');
});

test('slots come back in chronological order however they were declared', () => {
  const result = nextOccurrences(
    schedule('UTC', [
      slot({ dayOfWeek: 3, localTime: '17:00' }),
      slot({ dayOfWeek: 3, localTime: '08:00' }),
      slot({ dayOfWeek: 3, localTime: '12:30' }),
    ]),
    { after: new Date('2026-06-10T00:00:00Z'), limit: 3 },
  );

  assert.ok(result.ok);
  assert.deepEqual(
    result.occurrences.map((o) => o.local),
    ['2026-06-10T08:00', '2026-06-10T12:30', '2026-06-10T17:00'],
  );
});

test('a weekly slot keeps its wall-clock time across a DST change', () => {
  // The whole point. London moves to BST on 2026-03-29; a 09:00 Sunday slot
  // must stay 09:00 rather than becoming 10:00 or drifting to 08:00 local.
  const result = nextOccurrences(
    schedule('Europe/London', [slot({ dayOfWeek: 0, localTime: '09:00' })]),
    { after: new Date('2026-03-15T12:00:00Z'), limit: 3 },
  );

  assert.ok(result.ok);
  assert.deepEqual(
    result.occurrences.map((o) => o.local),
    ['2026-03-22T09:00', '2026-03-29T09:00', '2026-04-05T09:00'],
  );

  // Same wall clock, different instants: the second is an hour earlier in UTC
  // because the clocks went forward. Adding seven days of milliseconds would
  // have produced 09:00Z and published an hour late.
  assert.equal(result.occurrences[0]?.at.toISOString(), '2026-03-22T09:00:00.000Z');
  assert.equal(result.occurrences[1]?.at.toISOString(), '2026-03-29T08:00:00.000Z');
});

test('two slots that collapse into one instant across a gap produce one occurrence', () => {
  // New York springs forward on 2026-03-08: 02:30 never happens and resolves to
  // the transition, which is exactly when the 03:00 slot fires. Issuing both
  // would queue two posts to one account at the same moment.
  const result = nextOccurrences(
    schedule('America/New_York', [
      slot({ dayOfWeek: 0, localTime: '02:30' }),
      slot({ dayOfWeek: 0, localTime: '03:00' }),
    ]),
    { after: new Date('2026-03-08T05:00:00Z'), limit: 3 },
  );

  assert.ok(result.ok);
  const instants = result.occurrences.map((o) => o.at.toISOString());
  assert.equal(new Set(instants).size, instants.length, 'no two occurrences share an instant');

  assert.equal(instants[0], '2026-03-08T07:00:00.000Z');
  // The following Sunday is an ordinary day and both slots survive.
  assert.equal(instants[1], '2026-03-15T06:30:00.000Z');
  assert.equal(instants[2], '2026-03-15T07:00:00.000Z');
});

test('a slot in the hour that runs twice takes the first occurrence', () => {
  // New York falls back on 2026-11-01: 01:30 happens at 05:30Z and again at
  // 06:30Z. The earlier one is nearer the time that was asked for.
  const result = nextOccurrences(
    schedule('America/New_York', [slot({ dayOfWeek: 0, localTime: '01:30' })]),
    { after: new Date('2026-11-01T04:00:00Z'), limit: 1 },
  );

  assert.ok(result.ok);
  assert.equal(result.occurrences[0]?.at.toISOString(), '2026-11-01T05:30:00.000Z');
  assert.equal(result.occurrences[0]?.resolution, 'ambiguous');
});

test('a gapped slot is reported as shifted rather than silently moved', () => {
  const result = nextOccurrences(
    schedule('America/New_York', [slot({ dayOfWeek: 0, localTime: '02:30' })]),
    { after: new Date('2026-03-08T05:00:00Z'), limit: 1 },
  );

  assert.ok(result.ok);
  // Stored on the target, so a support question about "why did this go out at
  // 3am" has an answer in the row rather than in someone's memory of DST.
  assert.equal(result.occurrences[0]?.resolution, 'shifted');
});

test('taken instants are skipped, not reused', () => {
  const after = new Date('2026-06-10T00:00:00Z');
  const grid = schedule('UTC', [
    slot({ dayOfWeek: 3, localTime: '09:00' }),
    slot({ dayOfWeek: 3, localTime: '17:00' }),
  ]);

  const first = nextFreeSlot(grid, { after });
  assert.ok(first.ok);
  assert.equal(first.occurrence.local, '2026-06-10T09:00');

  const second = nextFreeSlot(grid, { after, taken: [first.occurrence.at] });
  assert.ok(second.ok);
  assert.equal(second.occurrence.local, '2026-06-10T17:00');

  const third = nextFreeSlot(grid, {
    after,
    taken: [first.occurrence.at, second.occurrence.at],
  });
  assert.ok(third.ok);
  assert.equal(third.occurrence.local, '2026-06-17T09:00');
});

test('a slot restricted to a format refuses everything else', () => {
  const grid = schedule('UTC', [
    slot({ dayOfWeek: 3, localTime: '09:00', acceptsFormats: ['image'] }),
    slot({ dayOfWeek: 3, localTime: '17:00' }),
  ]);
  const after = new Date('2026-06-10T00:00:00Z');

  const image = nextFreeSlot(grid, { after, format: 'image' });
  assert.ok(image.ok);
  assert.equal(image.occurrence.local, '2026-06-10T09:00');

  // A text post cannot take the image slot, so it falls through to the open one.
  const text = nextFreeSlot(grid, { after, format: 'text' });
  assert.ok(text.ok);
  assert.equal(text.occurrence.local, '2026-06-10T17:00');
});

test('an empty format list means any format, not no format', () => {
  // The distinction is worth a test: the database column defaults to '{}', and
  // reading that as "accepts nothing" would make every default slot unusable.
  const result = nextFreeSlot(schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00' })]), {
    after: new Date('2026-06-10T00:00:00Z'),
    format: 'video',
  });
  assert.ok(result.ok);
});

test('a slot reserved for a category is not consumed by other posts', () => {
  const grid = schedule('UTC', [
    slot({ dayOfWeek: 3, localTime: '09:00', categoryId: 'case-studies' }),
    slot({ dayOfWeek: 3, localTime: '17:00' }),
  ]);
  const after = new Date('2026-06-10T00:00:00Z');

  const uncategorised = nextFreeSlot(grid, { after });
  assert.ok(uncategorised.ok);
  assert.equal(uncategorised.occurrence.local, '2026-06-10T17:00');

  const wrongCategory = nextFreeSlot(grid, { after, categoryId: 'promos' });
  assert.ok(wrongCategory.ok);
  assert.equal(wrongCategory.occurrence.local, '2026-06-10T17:00');

  const right = nextFreeSlot(grid, { after, categoryId: 'case-studies' });
  assert.ok(right.ok);
  assert.equal(right.occurrence.local, '2026-06-10T09:00');
});

test('a paused queue produces nothing and says so', () => {
  const result = nextOccurrences(
    { ...schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00' })]), pausedAt: new Date() },
    { after: new Date('2026-06-10T00:00:00Z'), limit: 1 },
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'paused');
});

test('the failures are distinguishable, because the fixes differ', () => {
  const after = new Date('2026-06-10T00:00:00Z');

  const empty = nextOccurrences(schedule('UTC', []), { after, limit: 1 });
  assert.equal(empty.ok === false && empty.reason, 'no_slots');

  const mismatched = nextOccurrences(
    schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00', acceptsFormats: ['image'] })]),
    { after, limit: 1, format: 'text' },
  );
  assert.equal(mismatched.ok === false && mismatched.reason, 'no_matching_slots');

  // Every occurrence inside the horizon is spoken for.
  const taken = [0, 7, 14].map((d) => new Date(`2026-06-${10 + d}T09:00:00Z`));
  const full = nextOccurrences(schedule('UTC', [slot({ dayOfWeek: 3, localTime: '09:00' })]), {
    after,
    limit: 1,
    horizonDays: 15,
    taken,
  });
  assert.equal(full.ok === false && full.reason, 'queue_full');
});

test('a slot with an unreadable time is skipped rather than guessed at', () => {
  const result = nextOccurrences(
    schedule('UTC', [
      slot({ dayOfWeek: 3, localTime: 'noon' }),
      slot({ dayOfWeek: 3, localTime: '17:00' }),
    ]),
    { after: new Date('2026-06-10T00:00:00Z'), limit: 2 },
  );

  assert.ok(result.ok);
  assert.equal(result.occurrences.length, 2);
  assert.equal(result.occurrences[0]?.local, '2026-06-10T17:00');
});

test('a time with seconds parses, because that is what Postgres returns', () => {
  assert.deepEqual(parseLocalTime('09:00:00'), { hour: 9, minute: 0 });
  assert.deepEqual(parseLocalTime('23:59'), { hour: 23, minute: 59 });
  assert.equal(parseLocalTime('24:00'), undefined);
  assert.equal(parseLocalTime('9:00'), undefined);
  assert.equal(parseLocalTime(''), undefined);
});

test('the starting week is a working week, not an empty one', () => {
  // A queue with no slots is a dead end, and inventing posting times before you
  // have posted anything is a question nobody can answer.
  assert.equal(DEFAULT_WEEK.length, 10);
  assert.ok(DEFAULT_WEEK.every((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5));

  const grid = schedule(
    'UTC',
    DEFAULT_WEEK.map((s, i) => ({ ...s, id: `d${i}` })),
  );
  const result = nextOccurrences(grid, { after: new Date('2026-06-10T00:00:00Z'), limit: 4 });
  assert.ok(result.ok);
  assert.deepEqual(
    result.occurrences.map((o) => o.local),
    ['2026-06-10T09:00', '2026-06-10T15:00', '2026-06-11T09:00', '2026-06-11T15:00'],
  );
});

test('a southern-hemisphere queue transitions the other way', () => {
  // Sydney goes *back* on 2026-04-05, so the same wall clock moves an hour
  // later in UTC. A northern-only test would pass with a sign error.
  const result = nextOccurrences(
    schedule('Australia/Sydney', [slot({ dayOfWeek: 1, localTime: '09:00' })]),
    { after: new Date('2026-03-25T00:00:00Z'), limit: 3 },
  );

  assert.ok(result.ok);
  assert.deepEqual(
    result.occurrences.map((o) => o.at.toISOString()),
    ['2026-03-29T22:00:00.000Z', '2026-04-05T23:00:00.000Z', '2026-04-12T23:00:00.000Z'],
  );
});
