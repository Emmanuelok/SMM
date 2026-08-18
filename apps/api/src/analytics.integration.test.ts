import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import { createDatabase, type Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

import { postPerformance, readingHistory } from './analytics.js';

/**
 * Reading the numbers back.
 *
 * The tests that matter here are the ones that catch confident nonsense rather
 * than an error: a cumulative counter summed across its readings, a metric
 * nobody published shown as zero, and another tenant's numbers appearing in
 * your totals. All three produce a plausible-looking chart.
 */

const url = process.env['TEST_DATABASE_URL'];

describe('analytics, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: OrganizationId;
  let profileGroupId: string;
  let profileId: string;

  before(() => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 4 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  async function fixture(network = 'bluesky'): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Analytics Test', ${'analytics-' + Math.random().toString(36).slice(2, 10)})
      RETURNING id
    `;
    if (org === undefined) throw new Error('no organization');
    organizationId = org.id as OrganizationId;

    const [group] = await sql<{ id: string }[]>`
      INSERT INTO profile_groups (organization_id, name, timezone)
      VALUES (${organizationId}, 'Brand', 'UTC') RETURNING id
    `;
    if (group === undefined) throw new Error('no profile group');
    profileGroupId = group.id;

    const [profile] = await sql<{ id: string }[]>`
      INSERT INTO social_profiles (
        organization_id, profile_group_id, network, remote_account_id, handle, display_name
      )
      VALUES (${organizationId}, ${profileGroupId}, ${network}, ${'did:test:' + Math.random()},
              'tester.example', 'Tester')
      RETURNING id
    `;
    if (profile === undefined) throw new Error('no social profile');
    profileId = profile.id;
  }

  async function cleanup(): Promise<void> {
    await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
  }

  async function published(body: string, network = 'bluesky'): Promise<string> {
    const [post] = await sql<{ id: string }[]>`
      INSERT INTO posts (organization_id, profile_group_id, format, body, status)
      VALUES (${organizationId}, ${profileGroupId}, 'text', ${body}, 'published')
      RETURNING id
    `;
    if (post === undefined) throw new Error('no post');

    const [version] = await sql<{ id: string }[]>`
      INSERT INTO post_versions (organization_id, post_id, version, content_hash, body)
      VALUES (${organizationId}, ${post.id}, 1, ${'h' + Math.random()}, ${body}) RETURNING id
    `;
    if (version === undefined) throw new Error('no version');

    const [target] = await sql<{ id: string }[]>`
      INSERT INTO post_targets (
        organization_id, post_id, post_version_id, social_profile_id,
        network, format, status, dispatch, published_at, remote_post_id, remote_url
      )
      VALUES (
        ${organizationId}, ${post.id}, ${version.id}, ${profileId},
        ${network}, 'text', 'published', 'our_dispatcher', now() - interval '2 hours',
        ${'at://' + Math.random()}, 'https://bsky.app/post/1'
      )
      RETURNING id
    `;
    if (target === undefined) throw new Error('no target');
    return target.id;
  }

  async function reading(
    targetId: string,
    field: string,
    value: number,
    collectedAt: Date,
  ): Promise<void> {
    await sql`
      INSERT INTO metric_facts (
        organization_id, social_profile_id, post_target_id,
        metric_key, value, measured_at, collected_at,
        source_endpoint, source_field, api_version
      )
      VALUES (
        ${organizationId}, ${profileId}, ${targetId},
        ${field}, ${value}, ${collectedAt}, ${collectedAt},
        'app.bsky.feed.getPosts', ${field}, 'app.bsky.feed.defs#postView'
      )
    `;
  }

  test('a cumulative counter shows its latest reading, never the sum', async () => {
    await fixture();
    try {
      const targetId = await published('A post people liked');
      // Three readings of a running total as it climbed. Summing them gives 45,
      // which is not a quantity of anything — and it would look entirely
      // plausible on a chart.
      await reading(targetId, 'likeCount', 10, new Date(Date.now() - 3 * 3_600_000));
      await reading(targetId, 'likeCount', 15, new Date(Date.now() - 2 * 3_600_000));
      await reading(targetId, 'likeCount', 20, new Date(Date.now() - 3_600_000));

      const summary = await postPerformance(sql, organizationId);
      assert.equal(summary.posts.length, 1);
      assert.equal(summary.posts[0]?.metrics['likes'], 20);
      assert.equal(summary.totals['likes'], 20);
    } finally {
      await cleanup();
    }
  });

  test("a metric the platform never published is absent, not zero", async () => {
    await fixture();
    try {
      const targetId = await published('A post');
      await reading(targetId, 'likeCount', 5, new Date());

      const summary = await postPerformance(sql, organizationId);
      const metrics = summary.posts[0]?.metrics ?? {};
      // Bluesky publishes no impressions at any tier. A zero here would read as
      // "nobody saw it" rather than "we were never told", and that is a
      // difference somebody makes decisions on.
      assert.equal('impressions' in metrics, false);
      assert.equal(summary.columns.includes('impressions'), false);
      assert.deepEqual(summary.columns, ['likes']);
    } finally {
      await cleanup();
    }
  });

  test("platform field names are mapped to a vocabulary people can read", async () => {
    await fixture();
    try {
      const targetId = await published('A post');
      const now = new Date();
      await reading(targetId, 'likeCount', 7, now);
      await reading(targetId, 'repostCount', 2, now);
      await reading(targetId, 'replyCount', 1, now);
      await reading(targetId, 'quoteCount', 3, now);

      const summary = await postPerformance(sql, organizationId);
      assert.deepEqual(summary.posts[0]?.metrics, {
        likes: 7,
        shares: 2,
        comments: 1,
        quotes: 3,
      });
      // Shown most-used first, not in whatever order the rows came back.
      assert.deepEqual(summary.columns, ['likes', 'comments', 'shares', 'quotes']);
      assert.equal(summary.posts[0]?.engagement, 13);
    } finally {
      await cleanup();
    }
  });

  test('a field with no canonical name yet is collected but not charted', async () => {
    await fixture();
    try {
      const targetId = await published('A post');
      // Something the platform introduced this morning. Storing it is right;
      // showing a column headed "someNewCount" is not.
      await reading(targetId, 'someNewCount', 42, new Date());

      const summary = await postPerformance(sql, organizationId);
      assert.deepEqual(summary.columns, []);
      assert.deepEqual(summary.posts[0]?.metrics, {});

      // But it is still there, and still traceable.
      const history = await readingHistory(sql, organizationId, targetId);
      assert.equal(history.length, 1);
      assert.equal(history[0]?.field, 'someNewCount');
      assert.equal(history[0]?.canonical, undefined);
    } finally {
      await cleanup();
    }
  });

  test('the reading history is the answer to "why did this number change"', async () => {
    await fixture();
    try {
      const targetId = await published('A post');
      await reading(targetId, 'likeCount', 30, new Date(Date.now() - 86_400_000));
      await reading(targetId, 'likeCount', 24, new Date());

      const history = await readingHistory(sql, organizationId, targetId);
      assert.equal(history.length, 2);
      // Newest first, and each carries the call that produced it.
      assert.equal(history[0]?.value, 24);
      assert.equal(history[1]?.value, 30);
      assert.equal(history[0]?.endpoint, 'app.bsky.feed.getPosts');
      assert.equal(history[0]?.apiVersion, 'app.bsky.feed.defs#postView');
    } finally {
      await cleanup();
    }
  });

  test('a network that publishes nothing is named rather than shown as empty', async () => {
    await fixture('mastodon');
    try {
      await published('A Mastodon post', 'mastodon');

      const summary = await postPerformance(sql, organizationId);
      assert.equal(summary.publishedCount, 1);
      // An empty row must not read as "this post did nothing" when the truth is
      // "this network tells us nothing".
      assert.deepEqual(summary.unmeasuredNetworks, ['mastodon']);
    } finally {
      await cleanup();
    }
  });

  test('another tenant’s numbers never appear in your totals', async () => {
    await fixture();
    try {
      const targetId = await published('A post');
      await reading(targetId, 'likeCount', 11, new Date());

      const other = '00000000-0000-4000-8000-00000000000a' as OrganizationId;
      const summary = await postPerformance(sql, other);
      assert.equal(summary.publishedCount, 0);
      assert.deepEqual(summary.totals, {});

      assert.deepEqual(await readingHistory(sql, other, targetId), []);
    } finally {
      await cleanup();
    }
  });

  test('an unpublished post has no performance to report', async () => {
    await fixture();
    try {
      const [post] = await sql<{ id: string }[]>`
        INSERT INTO posts (organization_id, profile_group_id, format, body, status)
        VALUES (${organizationId}, ${profileGroupId}, 'text', 'Not out yet', 'scheduled')
        RETURNING id
      `;
      assert.ok(post);
      await sql`
        INSERT INTO post_targets (
          organization_id, post_id, social_profile_id, network, format, status,
          dispatch, scheduled_at, scheduled_local, scheduled_timezone
        )
        VALUES (
          ${organizationId}, ${post.id}, ${profileId}, 'bluesky', 'text', 'scheduled',
          'our_dispatcher', now() + interval '1 day', '2026-06-12 09:00', 'UTC'
        )
      `;

      const summary = await postPerformance(sql, organizationId);
      assert.equal(summary.publishedCount, 0);
    } finally {
      await cleanup();
    }
  });
});
