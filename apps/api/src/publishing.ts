import {
  BLUESKY,
  resolveTarget,
  validateTarget,
  type PostFormat,
  type ValidationIssue,
} from '@smm/adapters';
import type { Sql } from '@smm/db';
import { contentHash, unsafeId, type OrganizationId, type PostId, type SocialProfileId } from '@smm/shared';
import {
  explainQueueFailure,
  nextFreeSlot,
  zonedTimeToInstant,
  type WallClock,
} from '@smm/scheduler';

import {
  QUEUE_HORIZON_DAYS,
  ensureSchedule,
  takenInstants,
  toPostingSchedule,
} from './queues.js';

/**
 * Composing and scheduling.
 *
 * Three things happen here that are easy to skip and expensive to add later.
 *
 * A post is validated against the target network's capabilities before it is
 * accepted, not when the worker eventually picks it up. Rejecting a 400-character
 * Bluesky post at 09:00 while the author is looking at it is worth far more than
 * failing at 02:00 on the day it was meant to run.
 *
 * Scheduling records the wall-clock time and zone the user chose, not just the
 * instant they resolve to. Timezone rules change several times a year, and an
 * instant alone makes the resulting drift undetectable.
 *
 * And a time can come from a queue instead of from a person. That is a
 * different resolution path per account — each has its own week and its own
 * zone — but the same insert, which is why the timing is a parameter here
 * rather than a second copy of this function.
 */

/** Where a target's instant comes from. */
export type Timing =
  /** A time the user chose, as a local wall clock plus the zone they meant. */
  | { readonly mode: 'at'; readonly scheduledLocal: string; readonly timezone: string }
  /** The next free slot in each account's own posting queue. */
  | { readonly mode: 'queue'; readonly categoryId?: string | null | undefined };

export interface ScheduleRequest {
  readonly profileGroupId: string;
  readonly body: string;
  readonly format: PostFormat;
  readonly socialProfileIds: readonly string[];
  readonly timing: Timing;
}

export interface ScheduledTarget {
  readonly profileId: string;
  readonly scheduledAt: Date;
  readonly scheduledLocal: string;
  readonly timezone: string;
  /** `shifted` means the chosen wall clock fell in a daylight-saving gap. */
  readonly resolution: 'exact' | 'ambiguous' | 'shifted';
  readonly fromQueue: boolean;
}

export type ScheduleResult =
  | {
      readonly ok: true;
      readonly postId: PostId;
      readonly targets: readonly ScheduledTarget[];
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'validation_failed'
        | 'unknown_profile'
        | 'unschedulable_time'
        | 'queue_unavailable';
      readonly issues?: readonly ValidationIssue[] | undefined;
      readonly message: string;
    };

/** Parse "YYYY-MM-DDTHH:MM" into a wall clock. Rejects anything else. */
export function parseWallClock(value: string): WallClock | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(value);
  if (match === null) return undefined;

  const [, year, month, day, hour, minute] = match;
  const wall: WallClock = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
  if (wall.month < 1 || wall.month > 12) return undefined;
  if (wall.day < 1 || wall.day > 31) return undefined;
  if (wall.hour > 23 || wall.minute > 59) return undefined;
  return wall;
}

/** A profile plus the instant this post will go out on it. */
interface Placement {
  readonly profileId: string;
  readonly network: string;
  readonly instant: Date;
  readonly local: string;
  readonly timezone: string;
  readonly resolution: 'exact' | 'ambiguous' | 'shifted';
  readonly slotId: string | null;
}

/**
 * Where each account's copy of this post lands.
 *
 * Per account rather than per post, because the two modes both vary by account:
 * a chosen wall clock is interpreted in the account's own zone, and a queue is
 * literally the account's own week. "09:00 local to each audience" is the
 * feature that falls out of doing this per account, and it is the reason the
 * loop is not hoisted out.
 */
async function placeTargets(
  sql: Sql,
  organizationId: OrganizationId,
  request: ScheduleRequest,
  profiles: readonly { id: string; network: string; timezone: string | null; group_timezone: string }[],
  now: Date,
): Promise<{ ok: true; placements: readonly Placement[] } | { ok: false; result: ScheduleResult }> {
  const placements: Placement[] = [];

  for (const profile of profiles) {
    // The account's own zone wins over the brand's, which is what makes
    // "09:00 local to each audience" expressible at all.
    const zone = profile.timezone ?? profile.group_timezone;

    if (request.timing.mode === 'at') {
      const wall = parseWallClock(request.timing.scheduledLocal);
      if (wall === undefined) {
        return {
          ok: false,
          result: {
            ok: false,
            reason: 'unschedulable_time',
            message: 'Give the time as a local wall clock, for example 2026-09-01T09:00.',
          },
        };
      }

      const chosen = request.timing.timezone || zone;
      const resolution = zonedTimeToInstant(wall, chosen);
      if (resolution.kind === 'skipped') {
        return {
          ok: false,
          result: {
            ok: false,
            reason: 'unschedulable_time',
            message: `${request.timing.scheduledLocal} does not exist in ${chosen} — the clocks skip over it.`,
          },
        };
      }

      placements.push({
        profileId: profile.id,
        network: profile.network,
        instant: resolution.instant,
        local: request.timing.scheduledLocal,
        timezone: chosen,
        resolution: resolution.kind,
        slotId: null,
      });
      continue;
    }

    const schedule = await ensureSchedule(sql, organizationId, profile.id);
    if (schedule === undefined) {
      return {
        ok: false,
        result: {
          ok: false,
          reason: 'unknown_profile',
          message: 'One or more of those accounts do not exist in this brand.',
        },
      };
    }

    // Per account, so two accounts sharing a 09:00 slot both get 09:00 rather
    // than the second one being pushed to 15:00. Cross-posting at the same
    // moment is the normal case, not a collision.
    const taken = await takenInstants(sql, profile.id, now);

    const slot = nextFreeSlot(toPostingSchedule(schedule), {
      after: now,
      taken,
      horizonDays: QUEUE_HORIZON_DAYS,
      format: request.format,
      categoryId: request.timing.categoryId ?? null,
    });

    if (!slot.ok) {
      return {
        ok: false,
        result: {
          ok: false,
          reason: 'queue_unavailable',
          message: explainQueueFailure(slot.reason),
        },
      };
    }

    placements.push({
      profileId: profile.id,
      network: profile.network,
      instant: slot.occurrence.at,
      local: slot.occurrence.local,
      timezone: schedule.timezone,
      resolution: slot.occurrence.resolution,
      slotId: slot.occurrence.slot.id,
    });
  }

  return { ok: true, placements };
}

/** Postgres' unique-violation code. */
const UNIQUE_VIOLATION = '23505';

export async function schedulePost(
  sql: Sql,
  organizationId: OrganizationId,
  request: ScheduleRequest,
  now = new Date(),
): Promise<ScheduleResult> {
  // Deduplicated before the count check below, so a client that sends the same
  // account twice gets one post rather than "that account does not exist".
  const requested = [...new Set(request.socialProfileIds)];

  // Scoped to the caller's organization, so a profile id from another tenant
  // resolves to nothing rather than to someone else's account.
  const profiles = await sql<
    { id: string; network: string; timezone: string | null; group_timezone: string }[]
  >`
    SELECT p.id, p.network, p.timezone, g.timezone AS group_timezone
    FROM social_profiles p
    JOIN profile_groups g ON g.id = p.profile_group_id
    WHERE p.organization_id = ${organizationId}
      AND p.profile_group_id = ${request.profileGroupId}
      AND p.id = ANY(${requested})
      AND p.deleted_at IS NULL
  `;

  if (profiles.length !== requested.length) {
    return {
      ok: false,
      reason: 'unknown_profile',
      message: 'One or more of those accounts do not exist in this brand.',
    };
  }

  // Validated once per network rather than once per account: the capability
  // descriptor is a property of the network, not of the connection.
  const issues: ValidationIssue[] = [];
  for (const network of new Set(profiles.map((p) => p.network))) {
    if (network !== 'bluesky') continue;
    const draft = {
      id: unsafeId<'PostId'>('pending0') as PostId,
      format: request.format,
      body: request.body,
      media: [],
    };
    const target = resolveTarget(
      draft,
      'bluesky',
      unsafeId<'SocialProfileId'>('pending0') as SocialProfileId,
    );
    const report = validateTarget(target, BLUESKY);
    if (!report.publishable) {
      issues.push(...report.issues.filter((i) => i.severity === 'error'));
    }
  }

  if (issues.length > 0) {
    return {
      ok: false,
      reason: 'validation_failed',
      issues,
      message: issues[0]?.message ?? 'This post cannot be published as written.',
    };
  }

  const hash = contentHash({
    body: request.body,
    format: request.format,
    media: [],
  });

  // Two people adding to the same queue at the same moment both see the same
  // free slot. The database refuses the second one; the fix is to look again
  // rather than to fail, because by then the next slot really is free. Bounded,
  // because a loop that retries forever turns a contended queue into a hang.
  const attempts = request.timing.mode === 'queue' ? 3 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const placed = await placeTargets(sql, organizationId, request, profiles, now);
    if (!placed.ok) return placed.result;

    try {
      return await sql.begin(async (tx) => {
        const [post] = await tx<{ id: string }[]>`
          INSERT INTO posts (organization_id, profile_group_id, format, body, status)
          VALUES (${organizationId}, ${request.profileGroupId}, ${request.format}, ${request.body}, 'scheduled')
          RETURNING id
        `;
        if (post === undefined) throw new Error('Post insert returned no row');

        // The immutable artefact an approval could bind to, and what the worker
        // publishes. Editing the post creates a new version rather than mutating
        // what was approved.
        const [version] = await tx<{ id: string }[]>`
          INSERT INTO post_versions (organization_id, post_id, version, content_hash, body)
          VALUES (${organizationId}, ${post.id}, 1, ${hash}, ${request.body})
          RETURNING id
        `;
        if (version === undefined) throw new Error('Version insert returned no row');

        for (const placement of placed.placements) {
          await tx`
            INSERT INTO post_targets (
              organization_id, post_id, post_version_id, social_profile_id,
              network, format, status, dispatch,
              scheduled_at, scheduled_local, scheduled_timezone, scheduled_resolution,
              queue_slot_id
            )
            VALUES (
              ${organizationId}, ${post.id}, ${version.id}, ${placement.profileId},
              ${placement.network}, ${request.format}, 'scheduled', 'our_dispatcher',
              ${placement.instant}, ${placement.local.replace('T', ' ')}, ${placement.timezone},
              ${placement.resolution}, ${placement.slotId}
            )
          `;
        }

        return {
          ok: true as const,
          postId: unsafeId<'PostId'>(post.id) as PostId,
          targets: placed.placements.map((p) => ({
            profileId: p.profileId,
            scheduledAt: p.instant,
            scheduledLocal: p.local,
            timezone: p.timezone,
            resolution: p.resolution,
            fromQueue: p.slotId !== null,
          })),
        };
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== UNIQUE_VIOLATION || attempt === attempts) throw error;
      // Someone took the slot between the read and the write. Round again.
    }
  }

  return {
    ok: false,
    reason: 'queue_unavailable',
    message: 'This queue is busy right now. Try again in a moment.',
  };
}
