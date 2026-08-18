import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import { createDatabase, type Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

import { cancelPost, deletePost, reschedulePost } from './posts.js';
import { schedulePost } from './publishing.js';

/**
 * Changing your mind, against a real database.
 *
 * Two things here can only be checked with Postgres. The cancel path is a
 * conditional UPDATE whose WHERE clause *is* the safety argument — that a row a
 * worker has already claimed does not get quietly stopped — and `posts.status`
 * is now maintained by a trigger, so whether it tells the truth is a property
 * of the schema rather than of any code path.
 */

const url = process.env['TEST_DATABASE_URL'];

describe('post lifecycle, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: OrganizationId;
  let profileGroupId: string;
  let profileId: string;
  let secondProfileId: string;

  before(() => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 4 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  async function fixture(): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Lifecycle Test', ${'lifecycle-' + Math.random().toString(36).slice(2, 10)})
      RETURNING id
    `;
    if (org === undefined) throw new Error('no organization');
    organizationId = org.id as OrganizationId;

    const [group] = await sql<{ id: string }[]>`
      INSERT INTO profile_groups (organization_id, name, timezone)
      VALUES (${organizationId}, 'Brand', 'Europe/London')
      RETURNING id
    `;
    if (group === undefined) throw new Error('no profile group');
    profileGroupId = group.id;

    const made: string[] = [];
    for (const handle of ['one.bsky.social', 'two.bsky.social']) {
      const [profile] = await sql<{ id: string }[]>`
        INSERT INTO social_profiles (
          organization_id, profile_group_id, network, remote_account_id, handle, display_name
        )
        VALUES (${organizationId}, ${profileGroupId}, 'bluesky', ${'did:test:' + Math.random()},
                ${handle}, 'Tester')
        RETURNING id
      `;
      if (profile === undefined) throw new Error('no social profile');
      made.push(profile.id);
    }
    profileId = made[0] ?? '';
    secondProfileId = made[1] ?? '';
  }

  async function cleanup(): Promise<void> {
    await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
  }

  const NOW = new Date('2026-06-10T06:00:00Z');

  async function schedule(
    profiles: readonly string[] = [profileId],
    local = '2026-06-12T14:15',
  ): Promise<string> {
    const result = await schedulePost(
      sql,
      organizationId,
      {
        profileGroupId,
        body: 'A post that may change its mind',
        format: 'text',
        socialProfileIds: profiles,
        timing: { mode: 'at', scheduledLocal: local, timezone: 'Europe/London' },
      },
      NOW,
    );
    if (!result.ok) throw new Error(`could not schedule: ${result.message}`);
    return result.postId;
  }

  async function postStatus(postId: string): Promise<string> {
    const [row] = await sql<{ status: string }[]>`SELECT status FROM posts WHERE id = ${postId}`;
    return row?.status ?? 'missing';
  }

  async function targetStatuses(postId: string): Promise<string[]> {
    const rows = await sql<{ status: string }[]>`
      SELECT status FROM post_targets WHERE post_id = ${postId} ORDER BY social_profile_id
    `;
    return rows.map((r) => r.status);
  }

  test('a scheduled post can be cancelled', async () => {
    await fixture();
    try {
      const postId = await schedule();
      assert.equal(await postStatus(postId), 'scheduled');

      const result = await cancelPost(sql, organizationId, postId);
      assert.ok(result.ok);
      assert.equal(result.value.cancelled, 1);
      assert.equal(result.value.inFlight, 0);
      assert.equal(result.value.alreadyPublished, 0);

      assert.deepEqual(await targetStatuses(postId), ['cancelled']);
      // Maintained by the trigger, not by the cancel code — so this asserts the
      // schema keeps the summary honest whoever wrote the targets.
      assert.equal(await postStatus(postId), 'cancelled');
    } finally {
      await cleanup();
    }
  });

  test('cancelling frees the time for something else', async () => {
    await fixture();
    try {
      const postId = await schedule();
      await cancelPost(sql, organizationId, postId);

      // The same wall clock is available again, which is the point of
      // cancelling rather than merely hiding.
      const replacement = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Took the freed time',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'at', scheduledLocal: '2026-06-12T14:15', timezone: 'Europe/London' },
        },
        NOW,
      );
      assert.ok(replacement.ok, replacement.ok ? '' : replacement.message);
    } finally {
      await cleanup();
    }
  });

  test('a post already publishing is not stopped, and says so', async () => {
    await fixture();
    try {
      const postId = await schedule();
      // Exactly what a worker's claim leaves behind.
      await sql`UPDATE post_targets SET status = 'publishing' WHERE post_id = ${postId}`;

      const result = await cancelPost(sql, organizationId, postId);
      assert.ok(result.ok);
      assert.equal(result.value.cancelled, 0);
      assert.equal(result.value.inFlight, 1, 'an in-flight copy must be reported, not silently claimed');

      // Still publishing: the network call may already have been made, and
      // pretending otherwise would be a lie the user acts on.
      assert.deepEqual(await targetStatuses(postId), ['publishing']);

      // But the intent is recorded where the reclaim will find it.
      const [row] = await sql<{ cancel_requested_at: Date | null }[]>`
        SELECT cancel_requested_at FROM post_targets WHERE post_id = ${postId}
      `;
      assert.ok(row?.cancel_requested_at, 'the request must outlive the failed attempt to stop it');
    } finally {
      await cleanup();
    }
  });

  test('a published copy cannot be cancelled and is reported separately', async () => {
    await fixture();
    try {
      const postId = await schedule([profileId, secondProfileId]);
      await sql`
        UPDATE post_targets
        SET status = 'published', published_at = now(), remote_post_id = 'at://done'
        WHERE post_id = ${postId} AND social_profile_id = ${profileId}
      `;

      const result = await cancelPost(sql, organizationId, postId);
      assert.ok(result.ok);
      assert.equal(result.value.cancelled, 1, 'the copy that had not gone out is stopped');
      assert.equal(result.value.alreadyPublished, 1, 'the one that had is reported, not hidden');

      // One out in the world, one stopped: neither "published" nor "cancelled"
      // describes the post, and the trigger picks the honest one.
      assert.equal(await postStatus(postId), 'published');
    } finally {
      await cleanup();
    }
  });

  test('a failure awaiting retry can still be called off', async () => {
    await fixture();
    try {
      const postId = await schedule();
      await sql`
        UPDATE post_targets
        SET status = 'failed', next_attempt_at = now() + interval '5 minutes',
            failure_kind = 'transient'
        WHERE post_id = ${postId}
      `;
      // A retrying post is the one people most want to stop — it is going to
      // try again on its own, and the retry clock is not visible to them.
      assert.equal(await postStatus(postId), 'scheduled');

      const result = await cancelPost(sql, organizationId, postId);
      assert.ok(result.ok);
      assert.equal(result.value.cancelled, 1);

      const [row] = await sql<{ next_attempt_at: Date | null }[]>`
        SELECT next_attempt_at FROM post_targets WHERE post_id = ${postId}
      `;
      assert.equal(row?.next_attempt_at, null, 'the retry must not survive the cancellation');
    } finally {
      await cleanup();
    }
  });

  test('a post in another tenant cannot be cancelled', async () => {
    await fixture();
    try {
      const postId = await schedule();
      const other = '00000000-0000-4000-8000-000000000009' as OrganizationId;

      const result = await cancelPost(sql, other, postId);
      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.reason, 'unknown_post');
      assert.deepEqual(await targetStatuses(postId), ['scheduled']);
    } finally {
      await cleanup();
    }
  });

  test('a scheduled post can be moved to a different time', async () => {
    await fixture();
    try {
      const postId = await schedule();

      const moved = await reschedulePost(
        sql,
        organizationId,
        postId,
        { mode: 'at', scheduledLocal: '2026-06-15T09:30', timezone: 'Europe/London' },
        NOW,
      );
      assert.ok(moved.ok, moved.ok ? '' : moved.message);
      assert.equal(moved.value.moved[0]?.scheduledLocal, '2026-06-15T09:30');
      assert.equal(moved.value.moved[0]?.scheduledAt.toISOString(), '2026-06-15T08:30:00.000Z');

      const [row] = await sql<{ scheduled_at: Date; status: string }[]>`
        SELECT scheduled_at, status FROM post_targets WHERE post_id = ${postId}
      `;
      assert.equal(row?.scheduled_at.toISOString(), '2026-06-15T08:30:00.000Z');
      assert.equal(row?.status, 'scheduled');
    } finally {
      await cleanup();
    }
  });

  test('rescheduling onto a queue takes the next free slot', async () => {
    await fixture();
    try {
      const postId = await schedule();

      const moved = await reschedulePost(sql, organizationId, postId, { mode: 'queue' }, NOW);
      assert.ok(moved.ok, moved.ok ? '' : moved.message);
      // The starter week is weekdays at 09:00 and 15:00; 06:00 UTC on a
      // Wednesday is before London's 09:00.
      assert.equal(moved.value.moved[0]?.scheduledLocal, '2026-06-10T09:00');
      assert.equal(moved.value.moved[0]?.fromQueue, true);

      const [row] = await sql<{ queue_slot_id: string | null }[]>`
        SELECT queue_slot_id FROM post_targets WHERE post_id = ${postId}
      `;
      assert.ok(row?.queue_slot_id, 'a queued reschedule must record the slot that placed it');
    } finally {
      await cleanup();
    }
  });

  test('rescheduling clears a stale failure rather than carrying it forward', async () => {
    await fixture();
    try {
      const postId = await schedule();
      await sql`
        UPDATE post_targets
        SET status = 'failed', next_attempt_at = now() + interval '1 hour',
            failure_kind = 'transient', failure_message = 'The network hiccuped.'
        WHERE post_id = ${postId}
      `;

      const moved = await reschedulePost(
        sql,
        organizationId,
        postId,
        { mode: 'at', scheduledLocal: '2026-06-15T09:30', timezone: 'Europe/London' },
        NOW,
      );
      assert.ok(moved.ok, moved.ok ? '' : moved.message);

      const [row] = await sql<
        { status: string; next_attempt_at: Date | null; failure_message: string | null }[]
      >`
        SELECT status, next_attempt_at, failure_message
        FROM post_targets WHERE post_id = ${postId}
      `;
      assert.equal(row?.status, 'scheduled');
      // An old retry time firing at the *old* moment would publish this at a
      // time nobody chose, an hour after they moved it somewhere else.
      assert.equal(row?.next_attempt_at, null);
      assert.equal(row?.failure_message, null);
    } finally {
      await cleanup();
    }
  });

  test('rescheduling leaves published and in-flight copies alone', async () => {
    await fixture();
    try {
      const postId = await schedule([profileId, secondProfileId]);
      await sql`
        UPDATE post_targets
        SET status = 'published', published_at = now(), remote_post_id = 'at://done'
        WHERE post_id = ${postId} AND social_profile_id = ${profileId}
      `;

      const moved = await reschedulePost(
        sql,
        organizationId,
        postId,
        { mode: 'at', scheduledLocal: '2026-06-15T09:30', timezone: 'Europe/London' },
        NOW,
      );
      assert.ok(moved.ok, moved.ok ? '' : moved.message);
      assert.equal(moved.value.moved.length, 1, 'only the copy that had not gone out moves');
      assert.equal(moved.value.untouched, 1);

      const [published] = await sql<{ remote_post_id: string | null }[]>`
        SELECT remote_post_id FROM post_targets
        WHERE post_id = ${postId} AND social_profile_id = ${profileId}
      `;
      assert.equal(published?.remote_post_id, 'at://done', 'a published copy must not be rewritten');
    } finally {
      await cleanup();
    }
  });

  test('a post with nothing left to move says so rather than succeeding emptily', async () => {
    await fixture();
    try {
      const postId = await schedule();
      await sql`
        UPDATE post_targets SET status = 'published', published_at = now(),
          remote_post_id = 'at://done' WHERE post_id = ${postId}
      `;

      const moved = await reschedulePost(
        sql,
        organizationId,
        postId,
        { mode: 'at', scheduledLocal: '2026-06-15T09:30', timezone: 'Europe/London' },
        NOW,
      );
      assert.equal(moved.ok, false);
      assert.equal(moved.ok === false && moved.reason, 'nothing_to_move');
    } finally {
      await cleanup();
    }
  });

  test('a draft has accounts, no time, and is invisible to the dispatcher', async () => {
    await fixture();
    try {
      const result = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Not ready yet',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'draft' },
        },
        NOW,
      );
      assert.ok(result.ok, result.ok ? '' : result.message);
      assert.equal(result.targets.length, 0, 'a draft has no scheduled targets to report');
      assert.equal(await postStatus(result.postId), 'draft');

      const [row] = await sql<{ status: string; scheduled_at: Date | null }[]>`
        SELECT status, scheduled_at FROM post_targets WHERE post_id = ${result.postId}
      `;
      assert.equal(row?.status, 'pending');
      // The dispatcher's claim requires a time, so an undated row is already
      // invisible to it — no extra guard needed anywhere.
      assert.equal(row?.scheduled_at, null);
    } finally {
      await cleanup();
    }
  });

  test('a draft becomes a scheduled post through the same path as a reschedule', async () => {
    await fixture();
    try {
      const draft = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Ready now',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'draft' },
        },
        NOW,
      );
      assert.ok(draft.ok);

      const scheduled = await reschedulePost(
        sql,
        organizationId,
        draft.postId,
        { mode: 'queue' },
        NOW,
      );
      assert.ok(scheduled.ok, scheduled.ok ? '' : scheduled.message);
      assert.equal(scheduled.value.moved[0]?.scheduledLocal, '2026-06-10T09:00');

      assert.equal(await postStatus(draft.postId), 'scheduled');
      assert.deepEqual(await targetStatuses(draft.postId), ['scheduled']);
    } finally {
      await cleanup();
    }
  });

  test('deleting a post cancels it and takes it out of the listing', async () => {
    await fixture();
    try {
      const postId = await schedule();

      const result = await deletePost(sql, organizationId, postId);
      assert.ok(result.ok);
      assert.equal(result.value.cancelled, 1);

      const [row] = await sql<{ deleted_at: Date | null }[]>`
        SELECT deleted_at FROM posts WHERE id = ${postId}
      `;
      assert.ok(row?.deleted_at, 'the row survives as a record, hidden rather than erased');
      assert.deepEqual(await targetStatuses(postId), ['cancelled']);
    } finally {
      await cleanup();
    }
  });

  test('the post status follows its targets through a whole life', async () => {
    await fixture();
    try {
      const postId = await schedule([profileId, secondProfileId]);
      assert.equal(await postStatus(postId), 'scheduled');

      await sql`UPDATE post_targets SET status = 'publishing' WHERE social_profile_id = ${profileId} AND post_id = ${postId}`;
      assert.equal(await postStatus(postId), 'publishing');

      await sql`
        UPDATE post_targets SET status = 'published', published_at = now(),
          remote_post_id = 'at://one' WHERE social_profile_id = ${profileId} AND post_id = ${postId}
      `;
      // One published, one still scheduled: the work is not finished.
      assert.equal(await postStatus(postId), 'scheduled');

      await sql`
        UPDATE post_targets SET status = 'failed', next_attempt_at = NULL,
          failure_kind = 'content_rejected'
        WHERE social_profile_id = ${secondProfileId} AND post_id = ${postId}
      `;
      // Out on one network, refused on the other. Reporting this as either
      // "published" or "failed" would be false in a way somebody acts on.
      assert.equal(await postStatus(postId), 'partially_failed');
    } finally {
      await cleanup();
    }
  });
});
