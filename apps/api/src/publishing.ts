import {
  BLUESKY,
  resolveTarget,
  validateTarget,
  type PostFormat,
  type ValidationIssue,
} from '@smm/adapters';
import type { Sql } from '@smm/db';
import { contentHash, unsafeId, type OrganizationId, type PostId, type SocialProfileId } from '@smm/shared';
import { zonedTimeToInstant, type WallClock } from '@smm/scheduler';

/**
 * Composing and scheduling.
 *
 * Two things happen here that are easy to skip and expensive to add later.
 *
 * A post is validated against the target network's capabilities before it is
 * accepted, not when the worker eventually picks it up. Rejecting a 400-character
 * Bluesky post at 09:00 while the author is looking at it is worth far more than
 * failing at 02:00 on the day it was meant to run.
 *
 * Scheduling records the wall-clock time and zone the user chose, not just the
 * instant they resolve to. Timezone rules change several times a year, and an
 * instant alone makes the resulting drift undetectable.
 */

export interface ScheduleRequest {
  readonly profileGroupId: string;
  readonly body: string;
  readonly format: PostFormat;
  readonly socialProfileIds: readonly string[];
  /** Local wall-clock time, e.g. "2026-09-01T09:00". Never an instant. */
  readonly scheduledLocal: string;
  readonly timezone: string;
}

export type ScheduleResult =
  | {
      readonly ok: true;
      readonly postId: PostId;
      readonly targets: readonly { readonly profileId: string; readonly scheduledAt: Date }[];
    }
  | {
      readonly ok: false;
      readonly reason: 'validation_failed' | 'unknown_profile' | 'unschedulable_time';
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

export async function schedulePost(
  sql: Sql,
  organizationId: OrganizationId,
  request: ScheduleRequest,
): Promise<ScheduleResult> {
  const wall = parseWallClock(request.scheduledLocal);
  if (wall === undefined) {
    return {
      ok: false,
      reason: 'unschedulable_time',
      message: 'Give the time as a local wall clock, for example 2026-09-01T09:00.',
    };
  }

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
      AND p.id = ANY(${[...request.socialProfileIds]})
      AND p.deleted_at IS NULL
  `;

  if (profiles.length !== request.socialProfileIds.length) {
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

  return sql.begin(async (tx) => {
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

    const targets: { profileId: string; scheduledAt: Date }[] = [];

    for (const profile of profiles) {
      // The account's own zone wins over the brand's, which is what makes
      // "09:00 local to each audience" expressible at all.
      const zone = request.timezone || profile.timezone || profile.group_timezone;
      const resolution = zonedTimeToInstant(wall, zone);

      if (resolution.kind === 'skipped') {
        throw new Error(`${request.scheduledLocal} does not exist in ${zone}.`);
      }

      await tx`
        INSERT INTO post_targets (
          organization_id, post_id, post_version_id, social_profile_id,
          network, format, status, dispatch,
          scheduled_at, scheduled_local, scheduled_timezone, scheduled_resolution
        )
        VALUES (
          ${organizationId}, ${post.id}, ${version.id}, ${profile.id},
          ${profile.network}, ${request.format}, 'scheduled', 'our_dispatcher',
          ${resolution.instant}, ${request.scheduledLocal.replace('T', ' ')}, ${zone}, ${resolution.kind}
        )
      `;
      targets.push({ profileId: profile.id, scheduledAt: resolution.instant });
    }

    return {
      ok: true as const,
      postId: unsafeId<'PostId'>(post.id) as PostId,
      targets,
    };
  });
}
