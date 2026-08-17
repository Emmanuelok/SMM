import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import { createDatabase, type Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

import { schedulePost } from './publishing.js';
import { ensureSchedule, loadSchedule, previewQueue, replaceSlots, setPaused, takenInstants } from './queues.js';

/**
 * The queue against a real database.
 *
 * Everything here is a claim the unit tests cannot make: that the migration
 * applies, that the unique index actually refuses the race it was written for,
 * that `time` comes back in a shape the parser accepts, and that a queued post
 * ends up in `post_targets` pointing at the slot that placed it.
 *
 * Skipped rather than failed when there is no database, so the ordinary test
 * run stays hermetic. Point TEST_DATABASE_URL at a scratch database — every
 * table it touches is truncated before each test.
 */

const url = process.env['TEST_DATABASE_URL'];

describe('posting queues, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: OrganizationId;
  let profileGroupId: string;
  let profileId: string;

  before(async () => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 4 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  /**
   * A fresh tenant per test rather than a truncate.
   *
   * Truncating would race any other suite pointed at the same database, and
   * these rows all cascade from the organization anyway — deleting one row
   * cleans up everything the test made.
   */
  async function fixture(): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Queue Test', ${'queue-test-' + Math.random().toString(36).slice(2, 10)})
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

    const [profile] = await sql<{ id: string }[]>`
      INSERT INTO social_profiles (
        organization_id, profile_group_id, network, remote_account_id, handle, display_name
      )
      VALUES (${organizationId}, ${profileGroupId}, 'bluesky', ${'did:test:' + Math.random()},
              'tester.bsky.social', 'Tester')
      RETURNING id
    `;
    if (profile === undefined) throw new Error('no social profile');
    profileId = profile.id;
  }

  async function cleanup(): Promise<void> {
    await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
  }

  test('a first read creates a working week', async () => {
    await fixture();
    try {
      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);
      assert.equal(schedule.slots.length, 10);
      // Inherited from the group, because the profile has no zone of its own.
      assert.equal(schedule.timezone, 'Europe/London');

      // Postgres renders `time` as HH:MM:SS. The parser has to accept that, or
      // every slot silently disappears from the queue.
      assert.ok(/^\d{2}:\d{2}:\d{2}$/.test(schedule.slots[0]?.localTime ?? ''));

      // Idempotent: a second read must not double the week.
      const again = await ensureSchedule(sql, organizationId, profileId);
      assert.equal(again?.slots.length, 10);
      assert.equal(again?.id, schedule.id);
    } finally {
      await cleanup();
    }
  });

  test('an account in another tenant has no schedule to create', async () => {
    await fixture();
    try {
      const other = '00000000-0000-4000-8000-000000000001' as OrganizationId;
      assert.equal(await ensureSchedule(sql, other, profileId), undefined);
      assert.equal(await loadSchedule(sql, other, profileId), undefined);
    } finally {
      await cleanup();
    }
  });

  test('a queued post lands in the next free slot and records which one', async () => {
    await fixture();
    try {
      // Wednesday 2026-06-10, 06:00 UTC — before the 09:00 London slot.
      const now = new Date('2026-06-10T06:00:00Z');

      const first = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'First queued post',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );

      assert.ok(first.ok, first.ok ? '' : first.message);
      assert.equal(first.targets[0]?.scheduledLocal, '2026-06-10T09:00');
      assert.equal(first.targets[0]?.fromQueue, true);
      // 09:00 in London in June is BST, so 08:00 UTC. A naive implementation
      // would have written 09:00Z and published an hour late.
      assert.equal(first.targets[0]?.scheduledAt.toISOString(), '2026-06-10T08:00:00.000Z');

      const [row] = await sql<{ queue_slot_id: string | null; scheduled_timezone: string }[]>`
        SELECT queue_slot_id, scheduled_timezone FROM post_targets
        WHERE post_id = ${first.postId}
      `;
      assert.ok(row?.queue_slot_id, 'the slot that placed this must be recorded');
      assert.equal(row?.scheduled_timezone, 'Europe/London');

      // The second post cannot reuse the first one's slot.
      const second = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Second queued post',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );
      assert.ok(second.ok, second.ok ? '' : second.message);
      assert.equal(second.targets[0]?.scheduledLocal, '2026-06-10T15:00');
    } finally {
      await cleanup();
    }
  });

  test('the database refuses two queued posts at the same instant', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T06:00:00Z');
      const post = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Holds the slot',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );
      assert.ok(post.ok);

      const [existing] = await sql<
        { post_version_id: string; queue_slot_id: string; scheduled_at: Date }[]
      >`
        SELECT post_version_id, queue_slot_id, scheduled_at FROM post_targets
        WHERE post_id = ${post.postId}
      `;
      assert.ok(existing);

      // A second account row, so the (post_id, social_profile_id) key is not
      // what refuses this — the partial unique index has to be what does.
      const [otherPost] = await sql<{ id: string }[]>`
        INSERT INTO posts (organization_id, profile_group_id, format, body, status)
        VALUES (${organizationId}, ${profileGroupId}, 'text', 'Wants the same slot', 'scheduled')
        RETURNING id
      `;
      assert.ok(otherPost);

      await assert.rejects(
        () => sql`
          INSERT INTO post_targets (
            organization_id, post_id, post_version_id, social_profile_id,
            network, format, status, dispatch,
            scheduled_at, scheduled_local, scheduled_timezone, scheduled_resolution, queue_slot_id
          )
          VALUES (
            ${organizationId}, ${otherPost.id}, ${existing.post_version_id}, ${profileId},
            'bluesky', 'text', 'scheduled', 'our_dispatcher',
            ${existing.scheduled_at}, '2026-06-10 09:00', 'Europe/London', 'exact',
            ${existing.queue_slot_id}
          )
        `,
        (error: { code?: string }) => error.code === '23505',
        'the queue race must be refused by the database, not just by the read',
      );
    } finally {
      await cleanup();
    }
  });

  test('cancelling a post frees its slot', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T06:00:00Z');
      const post = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'To be cancelled',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );
      assert.ok(post.ok);

      assert.equal((await takenInstants(sql, profileId, now)).length, 1);

      await sql`UPDATE post_targets SET status = 'cancelled' WHERE post_id = ${post.postId}`;
      assert.equal((await takenInstants(sql, profileId, now)).length, 0);

      // And the slot is genuinely reusable, not merely unlisted.
      const next = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Takes the freed slot',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );
      assert.ok(next.ok, next.ok ? '' : next.message);
      assert.equal(next.targets[0]?.scheduledLocal, '2026-06-10T09:00');
    } finally {
      await cleanup();
    }
  });

  test('a paused queue refuses new posts and says why', async () => {
    await fixture();
    try {
      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);
      assert.equal(await setPaused(sql, organizationId, schedule.id, true, 'Product recall'), true);

      const result = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Should not be queued',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        new Date('2026-06-10T06:00:00Z'),
      );

      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.reason, 'queue_unavailable');

      // The slots survive the pause: a hold that made someone rebuild their
      // week would not get used.
      const held = await loadSchedule(sql, organizationId, profileId);
      assert.equal(held?.slots.length, 10);
      assert.equal(held?.pauseReason, 'Product recall');

      assert.equal(await setPaused(sql, organizationId, schedule.id, false), true);
      const resumed = await loadSchedule(sql, organizationId, profileId);
      assert.equal(resumed?.pausedAt, null);
    } finally {
      await cleanup();
    }
  });

  test('replacing the week replaces it, and normalises the times', async () => {
    await fixture();
    try {
      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);

      const result = await replaceSlots(sql, organizationId, schedule.id, [
        { dayOfWeek: 1, localTime: '07:30' },
        { dayOfWeek: 4, localTime: '18:00:00', acceptsFormats: ['image'] },
      ]);
      assert.ok(result.ok);
      assert.equal(result.slots.length, 2);

      const reloaded = await loadSchedule(sql, organizationId, profileId);
      assert.equal(reloaded?.slots.length, 2);
      assert.deepEqual(reloaded?.slots[1]?.acceptsFormats, ['image']);
    } finally {
      await cleanup();
    }
  });

  test('two slots at the same time are reported, not thrown', async () => {
    await fixture();
    try {
      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);

      // The database's unique key would raise a 23505 here. A duplicate row in
      // a grid editor is a mistake to point at, not a 500.
      const result = await replaceSlots(sql, organizationId, schedule.id, [
        { dayOfWeek: 1, localTime: '07:30' },
        { dayOfWeek: 1, localTime: '07:30:00' },
      ]);
      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.problems[0]?.index, 1);

      // And the existing week is untouched by the rejected edit.
      assert.equal((await loadSchedule(sql, organizationId, profileId))?.slots.length, 10);
    } finally {
      await cleanup();
    }
  });

  test('a schedule from another tenant cannot be edited', async () => {
    await fixture();
    try {
      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);

      const other = '00000000-0000-4000-8000-000000000002' as OrganizationId;
      await assert.rejects(
        () => replaceSlots(sql, other, schedule.id, [{ dayOfWeek: 1, localTime: '07:30' }]),
        /unknown_schedule/,
      );

      // The delete inside that transaction must have rolled back with it.
      assert.equal((await loadSchedule(sql, organizationId, profileId))?.slots.length, 10);
    } finally {
      await cleanup();
    }
  });

  test('the preview marks taken times rather than hiding them', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T06:00:00Z');
      const post = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Occupies 09:00',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'queue' },
        },
        now,
      );
      assert.ok(post.ok);

      const schedule = await ensureSchedule(sql, organizationId, profileId);
      assert.ok(schedule);

      const upcoming = await previewQueue(sql, schedule, 3, now);
      assert.equal(upcoming.length, 3);
      // Hiding it would make the calendar disagree with the queue settings for
      // no visible reason.
      assert.equal(upcoming[0]?.local, '2026-06-10T09:00');
      assert.equal(upcoming[0]?.free, false);
      assert.equal(upcoming[1]?.free, true);
    } finally {
      await cleanup();
    }
  });

  test('a manually chosen time still works and is not marked as queued', async () => {
    await fixture();
    try {
      const result = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Pinned to a moment',
          format: 'text',
          socialProfileIds: [profileId],
          timing: { mode: 'at', scheduledLocal: '2026-06-12T14:15', timezone: 'Europe/London' },
        },
        new Date('2026-06-10T06:00:00Z'),
      );

      assert.ok(result.ok, result.ok ? '' : result.message);
      assert.equal(result.targets[0]?.fromQueue, false);
      assert.equal(result.targets[0]?.scheduledAt.toISOString(), '2026-06-12T13:15:00.000Z');

      const [row] = await sql<{ queue_slot_id: string | null }[]>`
        SELECT queue_slot_id FROM post_targets WHERE post_id = ${result.postId}
      `;
      assert.equal(row?.queue_slot_id, null);
    } finally {
      await cleanup();
    }
  });

  test('a wall clock inside a daylight-saving gap is moved, and says so', async () => {
    await fixture();
    try {
      const result = await schedulePost(
        sql,
        organizationId,
        {
          profileGroupId,
          body: 'Never happens',
          format: 'text',
          socialProfileIds: [profileId],
          // London springs forward at 01:00 on 2027-03-28; 01:30 does not exist.
          timing: { mode: 'at', scheduledLocal: '2027-03-28T01:30', timezone: 'Europe/London' },
        },
        new Date('2027-03-01T06:00:00Z'),
      );

      // Refusing would be defensible, but it makes the tool argue with someone
      // about a calendar quirk they did not cause. Publishing at the first
      // instant that exists, and saying that is what happened, is the better
      // trade — as long as it is actually said.
      assert.ok(result.ok, result.ok ? '' : result.message);
      assert.equal(result.targets[0]?.resolution, 'shifted');
      assert.equal(result.targets[0]?.scheduledAt.toISOString(), '2027-03-28T01:00:00.000Z');

      const [row] = await sql<{ scheduled_resolution: string }[]>`
        SELECT scheduled_resolution FROM post_targets WHERE post_id = ${result.postId}
      `;
      // Persisted, so "why did this go out at 2am" has an answer in the row
      // rather than in someone's memory of daylight saving.
      assert.equal(row?.scheduled_resolution, 'shifted');
    } finally {
      await cleanup();
    }
  });
});
