import type { Sql } from '@smm/db';
import {
  DEFAULT_WEEK,
  nextOccurrences,
  parseLocalTime,
  type PostingSchedule,
  type QueueSlot,
  type SlotOccurrence,
} from '@smm/scheduler';
import type { OrganizationId } from '@smm/shared';

/**
 * Posting queues, as the database sees them.
 *
 * The arithmetic lives in `@smm/scheduler`, which knows nothing about tables;
 * this file is the part that loads a week, works out what is already spoken
 * for, and writes the result back. Keeping the split means the DST behaviour is
 * testable without a database, which is what made it testable at all.
 */

/** Statuses that still occupy a slot. A cancelled post frees its time. */
const LIVE_STATUSES = ['pending', 'scheduled', 'publishing'] as const;

/** How far ahead a queue will place a post before declaring itself full. */
export const QUEUE_HORIZON_DAYS = 120;

export interface ScheduleRow {
  readonly id: string;
  readonly socialProfileId: string;
  readonly name: string;
  readonly timezone: string;
  readonly pausedAt: Date | null;
  readonly pauseReason: string | null;
  readonly slots: readonly QueueSlot[];
}

export interface SlotInput {
  readonly dayOfWeek: number;
  readonly localTime: string;
  readonly categoryId?: string | null | undefined;
  readonly acceptsFormats?: readonly string[] | undefined;
}

/**
 * Load a profile's schedule, creating the default week the first time.
 *
 * Lazy rather than created at connect time, because a schedule created eagerly
 * for every connected account would need backfilling for the accounts that
 * already exist, and because an account nobody has queued to does not need one.
 *
 * The zone is resolved once, here, and then stored. Re-deriving it on every read
 * would mean that changing an account's timezone silently reinterprets every
 * slot in its week — the same 09:00 slot quietly becoming a different instant.
 */
export async function ensureSchedule(
  sql: Sql,
  organizationId: OrganizationId,
  socialProfileId: string,
): Promise<ScheduleRow | undefined> {
  const existing = await loadSchedule(sql, organizationId, socialProfileId);
  if (existing !== undefined) return existing;

  const [profile] = await sql<{ id: string; timezone: string | null; group_timezone: string }[]>`
    SELECT p.id, p.timezone, g.timezone AS group_timezone
    FROM social_profiles p
    JOIN profile_groups g ON g.id = p.profile_group_id
    WHERE p.id = ${socialProfileId}
      AND p.organization_id = ${organizationId}
      AND p.deleted_at IS NULL
  `;
  if (profile === undefined) return undefined;

  const timezone = profile.timezone ?? profile.group_timezone;

  await sql.begin(async (tx) => {
    const [schedule] = await tx<{ id: string }[]>`
      INSERT INTO posting_schedules (organization_id, social_profile_id, name, timezone)
      VALUES (${organizationId}, ${socialProfileId}, 'default', ${timezone})
      -- Two requests can reach here at once for an account nobody has queued
      -- to yet. The unique key makes that harmless instead of a 500.
      ON CONFLICT (social_profile_id, name) DO NOTHING
      RETURNING id
    `;
    if (schedule === undefined) return;

    for (const slot of DEFAULT_WEEK) {
      await tx`
        INSERT INTO schedule_slots (organization_id, schedule_id, day_of_week, local_time)
        VALUES (${organizationId}, ${schedule.id}, ${slot.dayOfWeek}, ${slot.localTime})
      `;
    }
  });

  return loadSchedule(sql, organizationId, socialProfileId);
}

export async function loadSchedule(
  sql: Sql,
  organizationId: OrganizationId,
  socialProfileId: string,
): Promise<ScheduleRow | undefined> {
  const [schedule] = await sql<
    {
      id: string;
      social_profile_id: string;
      name: string;
      timezone: string;
      paused_at: Date | null;
      pause_reason: string | null;
    }[]
  >`
    SELECT s.id, s.social_profile_id, s.name, s.timezone, s.paused_at, s.pause_reason
    FROM posting_schedules s
    JOIN social_profiles p ON p.id = s.social_profile_id
    WHERE s.social_profile_id = ${socialProfileId}
      AND s.organization_id = ${organizationId}
      AND s.name = 'default'
      AND p.deleted_at IS NULL
  `;
  if (schedule === undefined) return undefined;

  const slots = await sql<
    {
      id: string;
      day_of_week: number;
      local_time: string;
      category_id: string | null;
      accepts_formats: string[];
    }[]
  >`
    SELECT id, day_of_week, local_time, category_id, accepts_formats
    FROM schedule_slots
    WHERE schedule_id = ${schedule.id}
    ORDER BY day_of_week, local_time
  `;

  return {
    id: schedule.id,
    socialProfileId: schedule.social_profile_id,
    name: schedule.name,
    timezone: schedule.timezone,
    pausedAt: schedule.paused_at,
    pauseReason: schedule.pause_reason,
    slots: slots.map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      localTime: row.local_time,
      categoryId: row.category_id,
      acceptsFormats: row.accepts_formats,
    })),
  };
}

/** The shape `@smm/scheduler` works in. */
export function toPostingSchedule(row: ScheduleRow): PostingSchedule {
  return {
    id: row.id,
    timezone: row.timezone,
    pausedAt: row.pausedAt,
    slots: row.slots,
  };
}

export type SlotProblem = { readonly index: number; readonly message: string };

/**
 * Replace a schedule's week.
 *
 * Wholesale rather than incremental, because the editor is a grid: the client
 * knows the week it wants and expressing that as a diff would put the burden of
 * getting it right in the least reliable place. Existing queued posts keep the
 * instants they were given — a slot moving from 09:00 to 10:00 changes where
 * *future* posts land, not where the already-promised ones do.
 */
export async function replaceSlots(
  sql: Sql,
  organizationId: OrganizationId,
  scheduleId: string,
  slots: readonly SlotInput[],
): Promise<{ ok: true; slots: readonly QueueSlot[] } | { ok: false; problems: readonly SlotProblem[] }> {
  const problems: SlotProblem[] = [];
  const seen = new Set<string>();

  slots.forEach((slot, index) => {
    if (!Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      problems.push({ index, message: 'Day must be 0 (Sunday) through 6 (Saturday).' });
    }
    const time = parseLocalTime(slot.localTime);
    if (time === undefined) {
      problems.push({ index, message: `"${slot.localTime}" is not a time. Use HH:MM.` });
      return;
    }
    // Normalised before the duplicate check so 09:00 and 09:00:00 collide the
    // way the database's unique key would, but with a message instead of a 500.
    const key = `${slot.dayOfWeek}-${time.hour}:${time.minute}`;
    if (seen.has(key)) {
      problems.push({ index, message: 'That day already has a slot at this time.' });
    }
    seen.add(key);
  });

  if (problems.length > 0) return { ok: false, problems };

  const categoryIds = [
    ...new Set(slots.map((s) => s.categoryId).filter((id): id is string => typeof id === 'string')),
  ];
  if (categoryIds.length > 0) {
    const known = await sql<{ id: string }[]>`
      SELECT id FROM content_categories
      WHERE organization_id = ${organizationId} AND id = ANY(${categoryIds}) AND deleted_at IS NULL
    `;
    if (known.length !== categoryIds.length) {
      return { ok: false, problems: [{ index: -1, message: 'Unknown content category.' }] };
    }
  }

  await sql.begin(async (tx) => {
    // Ownership re-checked inside the transaction: the id arrived from the
    // client, and a schedule from another tenant must delete nothing.
    const [owned] = await tx<{ id: string }[]>`
      SELECT id FROM posting_schedules
      WHERE id = ${scheduleId} AND organization_id = ${organizationId}
    `;
    if (owned === undefined) throw new Error('unknown_schedule');

    await tx`DELETE FROM schedule_slots WHERE schedule_id = ${scheduleId}`;

    for (const slot of slots) {
      const time = parseLocalTime(slot.localTime);
      if (time === undefined) continue;
      const normalised = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
      await tx`
        INSERT INTO schedule_slots (
          organization_id, schedule_id, day_of_week, local_time, category_id, accepts_formats
        )
        VALUES (
          ${organizationId}, ${scheduleId}, ${slot.dayOfWeek}, ${normalised},
          ${slot.categoryId ?? null}, ${[...(slot.acceptsFormats ?? [])]}
        )
      `;
    }
  });

  const stored = await sql<
    {
      id: string;
      day_of_week: number;
      local_time: string;
      category_id: string | null;
      accepts_formats: string[];
    }[]
  >`
    SELECT id, day_of_week, local_time, category_id, accepts_formats
    FROM schedule_slots WHERE schedule_id = ${scheduleId}
    ORDER BY day_of_week, local_time
  `;

  return {
    ok: true,
    slots: stored.map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      localTime: row.local_time,
      categoryId: row.category_id,
      acceptsFormats: row.accepts_formats,
    })),
  };
}

export async function setPaused(
  sql: Sql,
  organizationId: OrganizationId,
  scheduleId: string,
  paused: boolean,
  reason?: string,
): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    UPDATE posting_schedules
    SET paused_at = ${paused ? new Date() : null},
        pause_reason = ${paused ? (reason ?? null) : null}
    WHERE id = ${scheduleId} AND organization_id = ${organizationId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Instants this account is already committed to.
 *
 * Includes manually pinned posts as well as queued ones. A queue that placed a
 * post on top of a time its owner had chosen themselves would be worse than one
 * that skipped a slot.
 */
export async function takenInstants(
  sql: Sql,
  socialProfileId: string,
  from: Date,
): Promise<readonly Date[]> {
  const rows = await sql<{ scheduled_at: Date }[]>`
    SELECT scheduled_at FROM post_targets
    WHERE social_profile_id = ${socialProfileId}
      AND scheduled_at IS NOT NULL
      AND scheduled_at >= ${from}
      -- Compared as text rather than cast to the enum: the driver sends a text
      -- array, and casting it to target_status[] would fail the moment a value
      -- here stops matching a label exactly.
      AND status::text = ANY(${[...LIVE_STATUSES]})
  `;
  return rows.map((row) => row.scheduled_at);
}

export type PreviewedOccurrence = SlotOccurrence & { readonly free: boolean };

/**
 * The next occurrences of a queue, with the taken ones marked rather than
 * hidden.
 *
 * Hiding them would make the calendar disagree with the queue settings for no
 * visible reason. Marking them answers the question people actually ask, which
 * is "when will the thing I just added go out".
 *
 * Takes a loaded schedule rather than an id, so the caller that already has one
 * — every caller, so far — does not read it twice.
 */
export async function previewQueue(
  sql: Sql,
  row: ScheduleRow,
  limit: number,
  now = new Date(),
): Promise<readonly PreviewedOccurrence[]> {
  const taken = new Set(
    (await takenInstants(sql, row.socialProfileId, now)).map((d) => d.getTime()),
  );

  // Resolved as if not paused, so a held queue still shows the week it will
  // resume into. The pause is reported alongside rather than by an empty list.
  const result = nextOccurrences(
    { ...toPostingSchedule(row), pausedAt: null },
    { after: now, limit, horizonDays: QUEUE_HORIZON_DAYS },
  );

  return result.ok ? result.occurrences.map((o) => ({ ...o, free: !taken.has(o.at.getTime()) })) : [];
}
