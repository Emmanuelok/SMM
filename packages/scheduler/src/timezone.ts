/**
 * Timezone arithmetic for scheduling.
 *
 * A scheduling product lives or dies on this. Users think in local wall-clock
 * time — "post at 9am" — and the queue thinks in absolute instants. Converting
 * between the two is where scheduling tools quietly get things wrong, usually
 * twice a year.
 *
 * Two cases have to be handled deliberately rather than by accident:
 *
 *  - **Spring forward** creates a gap. In New York on 8 March 2026, 02:30 never
 *    happens; the clock jumps 02:00 to 03:00. A slot scheduled for 02:30 has to
 *    resolve to something.
 *  - **Fall back** creates an ambiguity. On 1 November 2026, 01:30 happens
 *    twice, an hour apart. One of them has to be chosen.
 *
 * Naively adding a fixed offset gets both wrong and, worse, gets them wrong
 * silently — the post goes out an hour late and nobody notices until a client
 * does.
 *
 * Implemented against `Intl` rather than a date library: the IANA rules ship
 * with the runtime and stay current, and a dependency here would be carrying
 * its own copy of the timezone database.
 */

export interface WallClock {
  readonly year: number;
  /** 1-12, not the 0-11 the Date constructor uses. */
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

/** How to resolve a wall-clock time that does not exist or happens twice. */
export interface ResolutionPolicy {
  /**
   * A time inside a spring-forward gap.
   * `after` moves to the first valid instant following the gap — a 02:30 slot
   * fires at 03:00. `skip` declines to schedule at all.
   */
  readonly gap: 'after' | 'skip';
  /**
   * A time that occurs twice on a fall-back day.
   * `earlier` picks the first occurrence, which keeps the post nearer the time
   * the user was thinking of.
   */
  readonly ambiguous: 'earlier' | 'later';
}

export const DEFAULT_POLICY: ResolutionPolicy = { gap: 'after', ambiguous: 'earlier' };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (f === undefined) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** Whether the runtime recognises an IANA zone identifier. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock reading in `timeZone` at a given instant. */
export function wallClockAt(instant: Date, timeZone: string): WallClock & { second: number } {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (part === undefined) throw new Error(`Missing ${type} from formatted date`);
    return Number(part.value);
  };
  // Some locales render midnight as hour 24; normalise it to 0.
  const hour = get('hour') % 24;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * The zone's UTC offset in milliseconds at a given instant.
 *
 * Derived by asking what the local clock reads at that instant and comparing it
 * to UTC, which works for any offset the zone database contains — including the
 * 45-minute ones people forget exist.
 */
export function offsetMsAt(instant: Date, timeZone: string): number {
  const local = wallClockAt(instant, timeZone);
  const asUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  // Discard sub-second precision so the comparison is exact.
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

function wallClockEquals(a: WallClock, b: WallClock & { second: number }): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

export type ZonedResult =
  | { readonly kind: 'exact'; readonly instant: Date }
  /** The requested time happens twice; `instant` is the chosen occurrence. */
  | { readonly kind: 'ambiguous'; readonly instant: Date; readonly other: Date }
  /** The requested time does not exist; `instant` is the shifted result. */
  | { readonly kind: 'shifted'; readonly instant: Date }
  /** The requested time does not exist and the policy declined to shift. */
  | { readonly kind: 'skipped' };

const DAY_MS = 86_400_000;

/**
 * The instant at which the zone's offset changes, somewhere in `(lo, hi]`.
 *
 * Binary search rather than arithmetic, because transitions are not always a
 * whole hour — Lord Howe Island shifts by thirty minutes, and historical
 * transitions are stranger still.
 */
function findTransition(lo: Date, hi: Date, timeZone: string): Date {
  const targetOffset = offsetMsAt(hi, timeZone);
  let low = lo.getTime();
  let high = hi.getTime();

  while (high - low > 1) {
    const mid = low + Math.floor((high - low) / 2);
    if (offsetMsAt(new Date(mid), timeZone) === targetOffset) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return new Date(high);
}

/**
 * Convert a local wall-clock time in `timeZone` to an absolute instant.
 *
 * The offsets in force a day either side of the target are used as the two
 * candidate offsets, which is wide enough to straddle any transition while
 * staying narrow enough to catch only one. Applying each and checking whether
 * the result reads back as the requested wall clock is what distinguishes the
 * three cases: both work and differ (the hour ran twice), one works (ordinary),
 * or neither works (the time never happened).
 *
 * Deriving the candidates from the naive instant rather than from a previous
 * guess matters — on a fall-back day, correcting a guess converges on the same
 * offset twice and the second occurrence is never discovered.
 */
export function zonedTimeToInstant(
  wall: WallClock,
  timeZone: string,
  policy: ResolutionPolicy = DEFAULT_POLICY,
): ZonedResult {
  const naiveUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, 0);

  const offsetBefore = offsetMsAt(new Date(naiveUtc - DAY_MS), timeZone);
  const offsetAfter = offsetMsAt(new Date(naiveUtc + DAY_MS), timeZone);

  const candidateA = new Date(naiveUtc - offsetBefore);
  const candidateB = new Date(naiveUtc - offsetAfter);

  const aMatches = wallClockEquals(wall, wallClockAt(candidateA, timeZone));
  const bMatches = wallClockEquals(wall, wallClockAt(candidateB, timeZone));

  if (aMatches && bMatches && candidateA.getTime() !== candidateB.getTime()) {
    // Both are real: the clock was turned back and this hour ran twice.
    const earlier = candidateA <= candidateB ? candidateA : candidateB;
    const later = candidateA <= candidateB ? candidateB : candidateA;
    return policy.ambiguous === 'earlier'
      ? { kind: 'ambiguous', instant: earlier, other: later }
      : { kind: 'ambiguous', instant: later, other: earlier };
  }

  if (aMatches) return { kind: 'exact', instant: candidateA };
  if (bMatches) return { kind: 'exact', instant: candidateB };

  // Neither candidate reads back as the requested time, so it falls inside a
  // gap and never occurs.
  if (policy.gap === 'skip') return { kind: 'skipped' };

  // Fire at the first instant that does exist — the transition itself. A slot
  // the clock skipped over should go out as soon as it legally can, rather
  // than drifting by however wide the gap happened to be.
  const lo = candidateA <= candidateB ? candidateA : candidateB;
  const hi = candidateA <= candidateB ? candidateB : candidateA;
  return { kind: 'shifted', instant: findTransition(lo, hi, timeZone) };
}

/** Convenience wrapper returning just the instant, or null when skipped. */
export function toInstant(
  wall: WallClock,
  timeZone: string,
  policy: ResolutionPolicy = DEFAULT_POLICY,
): Date | null {
  const result = zonedTimeToInstant(wall, timeZone, policy);
  return result.kind === 'skipped' ? null : result.instant;
}

/**
 * Advance a wall-clock date by whole days.
 *
 * Deliberately operates on the calendar rather than on elapsed milliseconds:
 * "tomorrow at 9am" means the next calendar day at 9am, which is not always 24
 * hours later.
 */
export function addDays(wall: WallClock, days: number): WallClock {
  const d = new Date(Date.UTC(wall.year, wall.month - 1, wall.day));
  d.setUTCDate(d.getUTCDate() + days);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: wall.hour,
    minute: wall.minute,
  };
}

/** Day of week in the given zone. 0 is Sunday. */
export function dayOfWeekAt(instant: Date, timeZone: string): number {
  const local = wallClockAt(instant, timeZone);
  return new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
}
