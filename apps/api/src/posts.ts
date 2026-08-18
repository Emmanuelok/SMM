import type { Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

import { placeTargets, type Timing } from './publishing.js';

/**
 * Changing your mind about a post.
 *
 * Everything here exists because the first thing a real person does after
 * scheduling something is misspell a word, pick the wrong account, or decide
 * not to post it after all. A scheduler that can only add is not a scheduler
 * anyone trusts with a brand.
 *
 * The recurring shape is a single conditional UPDATE rather than a read
 * followed by a write. A worker can claim a target at any moment, so checking
 * "is this still cancellable?" and then cancelling it is a race with a
 * publish — and the losing outcome is a post that goes out after someone was
 * told it would not. Letting the WHERE clause do the checking makes the
 * decision and the change the same event.
 */

/** Statuses a target can still be moved out of by its owner. */
const STOPPABLE = ['pending', 'scheduled', 'failed', 'awaiting_reconnect'] as const;

export interface CancelOutcome {
  /** Stopped for certain. */
  readonly cancelled: number;
  /** Already out in the world. Nothing here can retract those. */
  readonly alreadyPublished: number;
  /**
   * Claimed by a worker at the moment of asking.
   *
   * The network call may already have been made, so this is honest rather than
   * reassuring: it may still appear. What *is* guaranteed is that it will not
   * be attempted again — the request is recorded, and the reclaim honours it.
   */
  readonly inFlight: number;
}

export type PostActionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: 'unknown_post'; readonly message: string };

const UNKNOWN_POST = {
  ok: false as const,
  reason: 'unknown_post' as const,
  message: 'That post does not exist, or is not yours.',
};

/** Confirm the post belongs to the caller before anything touches it. */
async function ownedPost(
  sql: Sql,
  organizationId: OrganizationId,
  postId: string,
): Promise<boolean> {
  const [row] = await sql<{ id: string }[]>`
    SELECT id FROM posts
    WHERE id = ${postId} AND organization_id = ${organizationId} AND deleted_at IS NULL
  `;
  return row !== undefined;
}

/**
 * Stop a post going out.
 *
 * Cancels every target that can still be stopped, and records the intent on
 * the ones that cannot. `posts.status` follows from the targets by a database
 * trigger, so it is not set here — setting it would be a second opinion about
 * the same fact.
 */
export async function cancelPost(
  sql: Sql,
  organizationId: OrganizationId,
  postId: string,
): Promise<PostActionResult<CancelOutcome>> {
  if (!(await ownedPost(sql, organizationId, postId))) return UNKNOWN_POST;

  return sql.begin(async (tx) => {
    const stopped = await tx<{ id: string }[]>`
      UPDATE post_targets
      SET status = 'cancelled',
          next_attempt_at = NULL,
          cancel_requested_at = now(),
          updated_at = now()
      WHERE post_id = ${postId}
        AND organization_id = ${organizationId}
        AND status::text = ANY(${[...STOPPABLE]})
      RETURNING id
    `;

    // Recorded even though the status cannot be moved: the reclaim reads this
    // when deciding whether a worker's abandoned row goes back in the queue.
    const inFlight = await tx<{ id: string }[]>`
      UPDATE post_targets
      SET cancel_requested_at = now(), updated_at = now()
      WHERE post_id = ${postId}
        AND organization_id = ${organizationId}
        AND status = 'publishing'
      RETURNING id
    `;

    const [counts] = await tx<{ published: string }[]>`
      SELECT count(*) FILTER (WHERE status = 'published') AS published
      FROM post_targets
      WHERE post_id = ${postId} AND organization_id = ${organizationId}
    `;

    return {
      ok: true as const,
      value: {
        cancelled: stopped.length,
        inFlight: inFlight.length,
        alreadyPublished: Number(counts?.published ?? 0),
      },
    };
  });
}

export interface RescheduleOutcome {
  readonly moved: readonly {
    readonly profileId: string;
    readonly scheduledAt: Date;
    readonly scheduledLocal: string;
    readonly timezone: string;
    readonly resolution: 'exact' | 'ambiguous' | 'shifted';
    readonly fromQueue: boolean;
  }[];
  /** Targets left alone because they are published, in flight or cancelled. */
  readonly untouched: number;
}

export type RescheduleFailure =
  | 'unknown_post'
  | 'nothing_to_move'
  | 'unschedulable_time'
  | 'queue_unavailable';

/**
 * Move a post to a different time, or give a draft its first one.
 *
 * The same operation either way: a draft is a post whose targets have no time
 * yet, so "schedule this draft" and "reschedule this post" differ only in what
 * the rows currently say. Treating them as one thing means the timing logic —
 * zone resolution, queue placement, the daylight-saving cases — has exactly one
 * implementation rather than one per entry point.
 */
export async function reschedulePost(
  sql: Sql,
  organizationId: OrganizationId,
  postId: string,
  timing: Timing,
  now = new Date(),
): Promise<
  | { readonly ok: true; readonly value: RescheduleOutcome }
  | { readonly ok: false; readonly reason: RescheduleFailure; readonly message: string }
> {
  if (!(await ownedPost(sql, organizationId, postId))) return UNKNOWN_POST;

  // Only movable targets, with the timezone inputs the placement needs.
  const movable = await sql<
    { id: string; network: string; timezone: string | null; group_timezone: string; format: string }[]
  >`
    SELECT p.id, p.network, p.timezone, g.timezone AS group_timezone, t.format
    FROM post_targets t
    JOIN social_profiles p ON p.id = t.social_profile_id
    JOIN profile_groups g ON g.id = p.profile_group_id
    WHERE t.post_id = ${postId}
      AND t.organization_id = ${organizationId}
      AND t.status::text = ANY(${[...STOPPABLE]})
      AND p.deleted_at IS NULL
  `;

  if (movable.length === 0) {
    return {
      ok: false,
      reason: 'nothing_to_move',
      message: 'Every copy of this post has already gone out, or is going out now.',
    };
  }

  const [post] = await sql<{ format: string }[]>`
    SELECT format FROM posts WHERE id = ${postId}
  `;

  const placed = await placeTargets(
    sql,
    organizationId,
    { format: (post?.format ?? 'text') as 'text', timing },
    movable,
    now,
  );
  if (!placed.ok) {
    return {
      ok: false,
      reason: placed.result.reason === 'queue_unavailable' ? 'queue_unavailable' : 'unschedulable_time',
      message: placed.result.message,
    };
  }

  const [remaining] = await sql<{ untouched: string }[]>`
    SELECT count(*) AS untouched FROM post_targets
    WHERE post_id = ${postId} AND NOT (status::text = ANY(${[...STOPPABLE]}))
  `;

  await sql.begin(async (tx) => {
    for (const placement of placed.placements) {
      // Scoped by status as well as by id: between the read above and this
      // write a worker may have claimed the row, and moving a target that is
      // mid-publish would rewrite the time of a post already going out.
      await tx`
        UPDATE post_targets
        SET scheduled_at = ${placement.instant},
            scheduled_local = ${placement.local.replace('T', ' ')},
            scheduled_timezone = ${placement.timezone},
            scheduled_resolution = ${placement.resolution},
            queue_slot_id = ${placement.slotId},
            status = 'scheduled',
            -- A previous failure is history now; the retry clock restarts with
            -- the new time rather than firing at the old one.
            next_attempt_at = NULL,
            failure_kind = NULL,
            failure_message = NULL,
            cancel_requested_at = NULL,
            updated_at = now()
        WHERE post_id = ${postId}
          AND social_profile_id = ${placement.profileId}
          AND status::text = ANY(${[...STOPPABLE]})
      `;
    }
  });

  return {
    ok: true,
    value: {
      moved: placed.placements.map((p) => ({
        profileId: p.profileId,
        scheduledAt: p.instant,
        scheduledLocal: p.local,
        timezone: p.timezone,
        resolution: p.resolution,
        fromQueue: p.slotId !== null,
      })),
      untouched: Number(remaining?.untouched ?? 0),
    },
  };
}

/**
 * Remove a post from view.
 *
 * Soft, and cancelling first. A hard delete would take the publishing ledger
 * with it — including the record of what was already posted to a live account,
 * which is the one part that stays true whatever the user wants to forget.
 */
export async function deletePost(
  sql: Sql,
  organizationId: OrganizationId,
  postId: string,
): Promise<PostActionResult<CancelOutcome>> {
  const cancelled = await cancelPost(sql, organizationId, postId);
  if (!cancelled.ok) return cancelled;

  await sql`
    UPDATE posts SET deleted_at = now(), updated_at = now()
    WHERE id = ${postId} AND organization_id = ${organizationId} AND deleted_at IS NULL
  `;

  return cancelled;
}
