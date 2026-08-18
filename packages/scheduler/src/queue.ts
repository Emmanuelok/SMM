import {
  DEFAULT_POLICY,
  addDays,
  wallClockAt,
  zonedTimeToInstant,
  type ResolutionPolicy,
  type WallClock,
} from './timezone.js';

/**
 * Posting queues: a weekly grid of slots, filled in order.
 *
 * The alternative — making someone pick a date and time for every post — is
 * what scheduling tools started with and every one of them has since moved
 * away from. A person who posts five times a week does not want to make 260
 * scheduling decisions a year; they want to say "these are my times" once and
 * then add content to the end of a line.
 *
 * The grid is weekly and expressed in wall-clock time, so "09:00 Tuesday" stays
 * 09:00 Tuesday across a DST change instead of drifting an hour twice a year.
 * That means every occurrence has to be resolved through the zone rules rather
 * than produced by adding 604,800,000 milliseconds, which is the shortcut that
 * makes a queue slowly desynchronise from the week its owner thinks they set up.
 *
 * Two DST cases fall out of that and are handled here rather than left to the
 * caller:
 *
 *  - A slot inside a spring-forward gap resolves to the transition instant. Two
 *    slots can therefore land on the *same* instant — 02:30 and 03:00 both
 *    become 03:00 — and one of them has to be dropped, or the queue would
 *    schedule two posts to the same account at the same moment.
 *  - A slot on a fall-back day happens twice. The earlier occurrence is used,
 *    which keeps the post nearest the time that was asked for.
 */

/** A single recurring position in the week. */
export interface QueueSlot {
  readonly id: string;
  /** 0 is Sunday, matching `schedule_slots.day_of_week`. */
  readonly dayOfWeek: number;
  /** Wall-clock time as `HH:MM` or `HH:MM:SS`. Never an instant. */
  readonly localTime: string;
  /**
   * The category this slot is reserved for. A slot with no category takes
   * anything; a slot with one takes only that category, which is what makes
   * "Thursdays are for case studies" hold even when the queue is busy.
   */
  readonly categoryId?: string | null | undefined;
  /**
   * Formats this slot will accept. Empty means any format — the common case,
   * and the one that must not be confused with "accepts nothing".
   */
  readonly acceptsFormats: readonly string[];
}

export interface PostingSchedule {
  readonly id: string;
  /** Resolved when the schedule was created, and stored, so later edits to the
   * profile's zone do not silently reinterpret every slot. */
  readonly timezone: string;
  readonly pausedAt?: Date | null | undefined;
  readonly slots: readonly QueueSlot[];
}

export interface SlotOccurrence {
  readonly slot: QueueSlot;
  /** The absolute instant this occurrence fires at. */
  readonly at: Date;
  /** The wall clock it was resolved from, as `YYYY-MM-DDTHH:MM`. */
  readonly local: string;
  /** How the zone rules treated it. `shifted` means it fell inside a DST gap. */
  readonly resolution: 'exact' | 'ambiguous' | 'shifted';
}

export interface OccurrenceOptions {
  /** Only occurrences strictly after this instant. Defaults to now. */
  readonly after?: Date;
  /** How many to produce. */
  readonly limit: number;
  /**
   * How far ahead to look before giving up. Bounds the work when a schedule's
   * slots are all filtered out, and stops a queue from scheduling into a future
   * so distant that the account may not still exist.
   */
  readonly horizonDays?: number;
  /** Only slots that accept this format. */
  readonly format?: string | undefined;
  /** Only slots reserved for this category, plus uncategorised ones. */
  readonly categoryId?: string | null | undefined;
  /** Instants already spoken for, which an occurrence must not reuse. */
  readonly taken?: Iterable<Date | number>;
  readonly policy?: ResolutionPolicy;
}

export type QueueFailure =
  /** The schedule exists but is paused, so it deliberately produces nothing. */
  | 'paused'
  /** No slots at all: the week has never been set up. */
  | 'no_slots'
  /** Slots exist, but none accepts this format or category. */
  | 'no_matching_slots'
  /** Every matching slot inside the horizon is already occupied. */
  | 'queue_full';

export type QueueResult =
  | { readonly ok: true; readonly occurrences: readonly SlotOccurrence[] }
  | { readonly ok: false; readonly reason: QueueFailure };

const DEFAULT_HORIZON_DAYS = 120;

/** Parse `HH:MM` or `HH:MM:SS`. Returns undefined for anything else. */
export function parseLocalTime(value: string): { hour: number; minute: number } | undefined {
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());
  if (match === null) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return { hour, minute };
}

/** Render a wall clock the way the API and the database both expect it. */
function formatLocal(wall: WallClock): string {
  const pad = (n: number, width = 2): string => String(n).padStart(width, '0');
  return `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`;
}

/** Day of week for a calendar date, independent of any zone. 0 is Sunday. */
function dayOfWeekOf(wall: WallClock): number {
  return new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay();
}

/**
 * Whether a slot will take this post.
 *
 * A slot with no category is general-purpose. A slot *with* one is reserved:
 * an uncategorised post must not consume the Thursday case-study slot, because
 * reserving it is the entire reason someone set a category on it.
 */
function slotAccepts(
  slot: QueueSlot,
  format: string | undefined,
  categoryId: string | null | undefined,
): boolean {
  if (format !== undefined && slot.acceptsFormats.length > 0) {
    if (!slot.acceptsFormats.includes(format)) return false;
  }

  const reserved = slot.categoryId ?? null;
  if (reserved !== null && reserved !== (categoryId ?? null)) return false;

  return true;
}

/**
 * The next occurrences of a schedule's slots.
 *
 * Walks the calendar a day at a time in the schedule's zone rather than adding
 * fixed intervals, so a week containing a transition still produces exactly the
 * slots that were configured, at the wall-clock times they were configured for.
 */
export function nextOccurrences(
  schedule: PostingSchedule,
  options: OccurrenceOptions,
): QueueResult {
  if (schedule.pausedAt != null) return { ok: false, reason: 'paused' };
  if (schedule.slots.length === 0) return { ok: false, reason: 'no_slots' };

  const eligible = schedule.slots.filter((slot) =>
    slotAccepts(slot, options.format, options.categoryId),
  );
  if (eligible.length === 0) return { ok: false, reason: 'no_matching_slots' };

  const after = options.after ?? new Date();
  const horizon = options.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const policy = options.policy ?? DEFAULT_POLICY;

  const taken = new Set<number>();
  for (const value of options.taken ?? []) {
    taken.add(typeof value === 'number' ? value : value.getTime());
  }

  // Group by weekday once; the day loop then looks up rather than scanning.
  const byDay = new Map<number, QueueSlot[]>();
  for (const slot of eligible) {
    const list = byDay.get(slot.dayOfWeek);
    if (list === undefined) byDay.set(slot.dayOfWeek, [slot]);
    else list.push(slot);
  }

  const start = wallClockAt(after, schedule.timezone);
  const found: SlotOccurrence[] = [];
  // Instants already produced in this run. Distinct from `taken`: two slots can
  // collapse onto one instant across a spring-forward gap, and issuing both
  // would queue two posts to the same account at the same moment.
  const claimed = new Set<number>(taken);

  for (let dayOffset = 0; dayOffset <= horizon; dayOffset += 1) {
    const date = addDays({ ...start, hour: 0, minute: 0 }, dayOffset);
    const slots = byDay.get(dayOfWeekOf(date));
    if (slots === undefined) continue;

    const forDay: SlotOccurrence[] = [];

    for (const slot of slots) {
      const time = parseLocalTime(slot.localTime);
      // A slot whose time is unparseable is skipped rather than guessed at:
      // inventing a time would publish at an hour nobody chose.
      if (time === undefined) continue;

      const wall: WallClock = { ...date, hour: time.hour, minute: time.minute };
      const resolved = zonedTimeToInstant(wall, schedule.timezone, policy);
      if (resolved.kind === 'skipped') continue;

      const ms = resolved.instant.getTime();
      if (ms <= after.getTime()) continue;
      if (claimed.has(ms)) continue;
      claimed.add(ms);

      forDay.push({
        slot,
        at: resolved.instant,
        local: formatLocal(wall),
        resolution: resolved.kind,
      });
    }

    // Sorted per day rather than globally: slots are declared in whatever order
    // the database returned them, and on a fall-back day two later wall-clock
    // times can resolve closer together than they read.
    forDay.sort((a, b) => a.at.getTime() - b.at.getTime());
    found.push(...forDay);

    // Break only on a day boundary. Stopping mid-day could return the 17:00
    // slot while a 09:00 slot later in the same list was never considered.
    if (found.length >= options.limit) break;
  }

  if (found.length === 0) return { ok: false, reason: 'queue_full' };
  return { ok: true, occurrences: found.slice(0, options.limit) };
}

/** The single next free occurrence, which is what "add to queue" needs. */
export function nextFreeSlot(
  schedule: PostingSchedule,
  options: Omit<OccurrenceOptions, 'limit'>,
): { ok: true; occurrence: SlotOccurrence } | { ok: false; reason: QueueFailure } {
  const result = nextOccurrences(schedule, { ...options, limit: 1 });
  if (!result.ok) return result;

  const occurrence = result.occurrences[0];
  if (occurrence === undefined) return { ok: false, reason: 'queue_full' };
  return { ok: true, occurrence };
}

/** What to tell someone whose post could not be queued. */
export function explainQueueFailure(reason: QueueFailure): string {
  switch (reason) {
    case 'paused':
      return 'This queue is paused. Resume it, or pick a time yourself.';
    case 'no_slots':
      return 'This account has no posting times yet. Add some to use the queue.';
    case 'no_matching_slots':
      return 'No posting time accepts this kind of post. Add a slot for it, or pick a time yourself.';
    case 'queue_full':
      return 'Every posting time is already taken for the next few months. Add more times, or pick one yourself.';
  }
}

/**
 * A sensible starting week.
 *
 * An empty queue is a dead end — the feature only works once times exist, and
 * asking someone to invent them before they have posted anything is asking a
 * question they cannot answer yet. These are weekday mid-morning and
 * mid-afternoon, which is the shape most published guidance converges on and,
 * more importantly, is easy to edit into something better.
 */
export const DEFAULT_WEEK: readonly Omit<QueueSlot, 'id'>[] = [1, 2, 3, 4, 5].flatMap((day) => [
  { dayOfWeek: day, localTime: '09:00', categoryId: null, acceptsFormats: [] },
  { dayOfWeek: day, localTime: '15:00', categoryId: null, acceptsFormats: [] },
]);
