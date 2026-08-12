import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  addDays,
  dayOfWeekAt,
  isValidTimeZone,
  offsetMsAt,
  toInstant,
  wallClockAt,
  zonedTimeToInstant,
  type WallClock,
} from './timezone.js';

const HOUR = 3_600_000;

function wall(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): WallClock {
  return { year, month, day, hour, minute };
}

test('resolves an ordinary local time to the right instant', () => {
  // 09:00 in New York on a winter date is 14:00 UTC (UTC-5).
  const instant = toInstant(wall(2026, 1, 15, 9), 'America/New_York');
  assert.equal(instant?.toISOString(), '2026-01-15T14:00:00.000Z');
});

test('accounts for daylight saving without being told about it', () => {
  // The same 09:00 in July is 13:00 UTC, because the offset is now UTC-4.
  const instant = toInstant(wall(2026, 7, 15, 9), 'America/New_York');
  assert.equal(instant?.toISOString(), '2026-07-15T13:00:00.000Z');
});

test('handles zones with sub-hour offsets', () => {
  // Kathmandu is UTC+05:45 — a naive hour-based offset gets this wrong.
  const instant = toInstant(wall(2026, 6, 1, 12), 'Asia/Kathmandu');
  assert.equal(instant?.toISOString(), '2026-06-01T06:15:00.000Z');

  // Chatham Islands is UTC+12:45 in winter.
  const chatham = toInstant(wall(2026, 6, 1, 12), 'Pacific/Chatham');
  assert.equal(chatham?.toISOString(), '2026-05-31T23:15:00.000Z');
});

test('handles the far side of the date line', () => {
  // Kiritimati is UTC+14, so local noon is the previous day in UTC.
  const instant = toInstant(wall(2026, 6, 1, 12), 'Pacific/Kiritimati');
  assert.equal(instant?.toISOString(), '2026-05-31T22:00:00.000Z');
});

test('a time inside the spring-forward gap does not exist and is shifted', () => {
  // On 8 March 2026 New York jumps 02:00 -> 03:00. 02:30 never happens.
  const result = zonedTimeToInstant(wall(2026, 3, 8, 2, 30), 'America/New_York');
  assert.equal(result.kind, 'shifted');
  assert.ok(result.kind === 'shifted');
  // It must land at the first real instant after the gap: 03:00 EDT = 07:00Z.
  assert.equal(result.instant.toISOString(), '2026-03-08T07:00:00.000Z');
  // And the local reading must be a time that genuinely exists.
  const local = wallClockAt(result.instant, 'America/New_York');
  assert.equal(local.hour, 3);
});

test('the skip policy declines to schedule a nonexistent time', () => {
  const result = zonedTimeToInstant(wall(2026, 3, 8, 2, 30), 'America/New_York', {
    gap: 'skip',
    ambiguous: 'earlier',
  });
  assert.equal(result.kind, 'skipped');
  assert.equal(toInstant(wall(2026, 3, 8, 2, 30), 'America/New_York', {
    gap: 'skip',
    ambiguous: 'earlier',
  }), null);
});

test('a time that happens twice on fall-back day is reported as ambiguous', () => {
  // On 1 November 2026 New York repeats 01:00-02:00. 01:30 occurs twice.
  const result = zonedTimeToInstant(wall(2026, 11, 1, 1, 30), 'America/New_York');
  assert.equal(result.kind, 'ambiguous');
  assert.ok(result.kind === 'ambiguous');

  // The two occurrences are exactly one hour apart.
  assert.equal(Math.abs(result.other.getTime() - result.instant.getTime()), HOUR);
  // Default policy picks the earlier one, which is still EDT (UTC-4).
  assert.equal(result.instant.toISOString(), '2026-11-01T05:30:00.000Z');
  assert.ok(result.instant < result.other);
});

test('the later policy picks the second occurrence', () => {
  const result = zonedTimeToInstant(wall(2026, 11, 1, 1, 30), 'America/New_York', {
    gap: 'after',
    ambiguous: 'later',
  });
  assert.ok(result.kind === 'ambiguous');
  assert.equal(result.instant.toISOString(), '2026-11-01T06:30:00.000Z');
  assert.ok(result.instant > result.other);
});

test('handles southern-hemisphere transitions, which run the other way', () => {
  // Sydney springs forward on 4 October 2026: 02:00 -> 03:00.
  const gap = zonedTimeToInstant(wall(2026, 10, 4, 2, 30), 'Australia/Sydney');
  assert.equal(gap.kind, 'shifted');

  // And falls back on 5 April 2026, repeating 02:00-03:00.
  const ambiguous = zonedTimeToInstant(wall(2026, 4, 5, 2, 30), 'Australia/Sydney');
  assert.equal(ambiguous.kind, 'ambiguous');
});

test('reports zone offsets including half-hour zones', () => {
  assert.equal(offsetMsAt(new Date('2026-01-15T12:00:00Z'), 'America/New_York'), -5 * HOUR);
  assert.equal(offsetMsAt(new Date('2026-07-15T12:00:00Z'), 'America/New_York'), -4 * HOUR);
  assert.equal(offsetMsAt(new Date('2026-06-01T12:00:00Z'), 'Asia/Kolkata'), 5.5 * HOUR);
  assert.equal(offsetMsAt(new Date('2026-06-01T12:00:00Z'), 'UTC'), 0);
});

test('round-trips a wall clock through an instant and back', () => {
  const zones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Africa/Lagos', 'Asia/Kathmandu'];
  for (const zone of zones) {
    const requested = wall(2026, 6, 15, 14, 30);
    const instant = toInstant(requested, zone);
    assert.ok(instant !== null);
    const back = wallClockAt(instant, zone);
    assert.equal(back.hour, 14, `hour mismatch in ${zone}`);
    assert.equal(back.minute, 30, `minute mismatch in ${zone}`);
    assert.equal(back.day, 15, `day mismatch in ${zone}`);
  }
});

test('adding days follows the calendar, not elapsed hours', () => {
  // Crossing a DST boundary, "next day at 09:00" is still 09:00 local even
  // though only 23 hours have elapsed.
  const before = wall(2026, 3, 7, 9);
  const next = addDays(before, 1);
  assert.deepEqual(next, wall(2026, 3, 8, 9));

  const beforeInstant = toInstant(before, 'America/New_York');
  const nextInstant = toInstant(next, 'America/New_York');
  assert.ok(beforeInstant !== null && nextInstant !== null);
  assert.equal(nextInstant.getTime() - beforeInstant.getTime(), 23 * HOUR);
  assert.equal(wallClockAt(nextInstant, 'America/New_York').hour, 9);
});

test('addDays rolls over month and year boundaries', () => {
  assert.deepEqual(addDays(wall(2026, 1, 31, 9), 1), wall(2026, 2, 1, 9));
  assert.deepEqual(addDays(wall(2026, 12, 31, 9), 1), wall(2027, 1, 1, 9));
  // 2028 is a leap year.
  assert.deepEqual(addDays(wall(2028, 2, 28, 9), 1), wall(2028, 2, 29, 9));
});

test('day of week is computed in the target zone, not the server zone', () => {
  // 22:00 Sunday UTC is already Monday in Tokyo.
  const instant = new Date('2026-06-14T22:00:00Z');
  assert.equal(dayOfWeekAt(instant, 'UTC'), 0);
  assert.equal(dayOfWeekAt(instant, 'Asia/Tokyo'), 1);
});

test('rejects zones the runtime does not know', () => {
  assert.equal(isValidTimeZone('America/New_York'), true);
  assert.equal(isValidTimeZone('Mars/Olympus_Mons'), false);
});
