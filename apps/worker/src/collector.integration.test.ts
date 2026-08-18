import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import { AdapterRegistry, type PlatformAdapter, type RawMetric } from '@smm/adapters';
import { createDatabase, type Sql } from '@smm/db';
import { failure, unsafeId } from '@smm/shared';

import { collectOnce, findMeasurable, nextReadingDueAfterMs, recordReadings } from './collector.js';

/**
 * Metrics collection, against a real database.
 *
 * The claims worth testing here are all about *not* losing information: that
 * every reading is kept rather than overwritten, that two collectors racing
 * produce one row rather than two, and that provenance survives the trip. None
 * of those can be checked without the unique index and the numeric column doing
 * their part.
 */

const url = process.env['TEST_DATABASE_URL'];

function metric(overrides: Partial<RawMetric> = {}): RawMetric {
  return {
    subjectType: 'post',
    subjectId: 'at://did:test/app.bsky.feed.post/one',
    fieldAsReturned: 'likeCount',
    value: 12,
    endpoint: 'app.bsky.feed.getPosts',
    apiVersion: 'app.bsky.feed.defs#postView',
    measureKind: 'cumulative',
    collectedAt: new Date('2026-06-10T10:00:00Z'),
    ...overrides,
  };
}

/** A network that returns whatever the test says, or refuses to. */
function stubAdapter(behaviour: {
  metrics?: (ids: readonly string[]) => readonly RawMetric[];
  throws?: () => never;
  omitFetchMetrics?: boolean;
}): PlatformAdapter {
  const base = {
    network: 'bluesky',
    classify: (error: unknown) =>
      failure('transient', error instanceof Error ? error.message : 'unknown'),
  };
  if (behaviour.omitFetchMetrics === true) return base as unknown as PlatformAdapter;

  return {
    ...base,
    async fetchMetrics(_conn: unknown, ids: readonly string[]) {
      behaviour.throws?.();
      return behaviour.metrics?.(ids) ?? [];
    },
  } as unknown as PlatformAdapter;
}

describe('metrics collection, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: string;
  let profileGroupId: string;
  let profileId: string;

  before(() => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 4 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  async function fixture(options: { credential?: boolean } = {}): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Metrics Test', ${'metrics-' + Math.random().toString(36).slice(2, 10)})
      RETURNING id
    `;
    if (org === undefined) throw new Error('no organization');
    organizationId = org.id;

    const [group] = await sql<{ id: string }[]>`
      INSERT INTO profile_groups (organization_id, name, timezone)
      VALUES (${organizationId}, 'Brand', 'UTC') RETURNING id
    `;
    if (group === undefined) throw new Error('no profile group');
    profileGroupId = group.id;

    let credentialId: string | null = null;
    if (options.credential !== false) {
      const [credential] = await sql<{ id: string }[]>`
        INSERT INTO credentials (organization_id, access_token_enc, key_id)
        VALUES (${organizationId}, ${Buffer.from('sealed')}, 'k1') RETURNING id
      `;
      credentialId = credential?.id ?? null;
    }

    const [profile] = await sql<{ id: string }[]>`
      INSERT INTO social_profiles (
        organization_id, profile_group_id, network, remote_account_id,
        handle, display_name, credential_id
      )
      VALUES (${organizationId}, ${profileGroupId}, 'bluesky', ${'did:test:' + Math.random()},
              'tester.bsky.social', 'Tester', ${credentialId})
      RETURNING id
    `;
    if (profile === undefined) throw new Error('no social profile');
    profileId = profile.id;
  }

  async function cleanup(): Promise<void> {
    await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
  }

  /** A published post with a known remote id. */
  async function published(
    remotePostId: string,
    publishedAt: Date,
  ): Promise<{ targetId: string; organizationId: string; socialProfileId: string; network: string; remotePostId: string; publishedAt: Date; lastCollectedAt: null }> {
    const [post] = await sql<{ id: string }[]>`
      INSERT INTO posts (organization_id, profile_group_id, format, body, status)
      VALUES (${organizationId}, ${profileGroupId}, 'text', 'A published post', 'published')
      RETURNING id
    `;
    if (post === undefined) throw new Error('no post');

    const [version] = await sql<{ id: string }[]>`
      INSERT INTO post_versions (organization_id, post_id, version, content_hash, body)
      VALUES (${organizationId}, ${post.id}, 1, ${'h' + Math.random()}, 'A published post')
      RETURNING id
    `;
    if (version === undefined) throw new Error('no version');

    const [target] = await sql<{ id: string }[]>`
      INSERT INTO post_targets (
        organization_id, post_id, post_version_id, social_profile_id,
        network, format, status, dispatch, published_at, remote_post_id
      )
      VALUES (
        ${organizationId}, ${post.id}, ${version.id}, ${profileId},
        'bluesky', 'text', 'published', 'our_dispatcher', ${publishedAt}, ${remotePostId}
      )
      RETURNING id
    `;
    if (target === undefined) throw new Error('no target');

    return {
      targetId: target.id,
      organizationId,
      socialProfileId: profileId,
      network: 'bluesky',
      remotePostId,
      publishedAt,
      lastCollectedAt: null,
    };
  }

  test('a published post is measured, with its provenance intact', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T12:00:00Z');
      const target = await published('at://one', new Date('2026-06-10T09:00:00Z'));

      const adapters = new AdapterRegistry().register(
        stubAdapter({
          metrics: () => [
            metric({ subjectId: 'at://one', fieldAsReturned: 'likeCount', value: 12 }),
            metric({ subjectId: 'at://one', fieldAsReturned: 'repostCount', value: 3 }),
          ],
        }),
      );

      const outcomes = await collectOnce({ sql, adapters, now: () => now });
      const mine = outcomes.find((o) => o.socialProfileId === profileId);
      assert.equal(mine?.readings, 2);

      const rows = await sql<
        { source_field: string; value: string; source_endpoint: string; api_version: string }[]
      >`
        SELECT source_field, value, source_endpoint, api_version
        FROM metric_facts WHERE post_target_id = ${target.targetId}
        ORDER BY source_field
      `;
      assert.equal(rows.length, 2);
      // The platform's own field name, not ours. This is the join key back to
      // what the number meant when a platform later redefines it.
      assert.equal(rows[0]?.source_field, 'likeCount');
      assert.equal(rows[0]?.source_endpoint, 'app.bsky.feed.getPosts');
      assert.equal(rows[0]?.api_version, 'app.bsky.feed.defs#postView');
      assert.equal(Number(rows[0]?.value), 12);
    } finally {
      await cleanup();
    }
  });

  test('a later reading is added, never written over the first', async () => {
    await fixture();
    try {
      const target = await published('at://one', new Date('2026-06-10T09:00:00Z'));

      await recordReadings(sql, target, [
        metric({ subjectId: 'at://one', value: 12, collectedAt: new Date('2026-06-10T10:00:00Z') }),
      ]);
      await recordReadings(sql, target, [
        metric({ subjectId: 'at://one', value: 9, collectedAt: new Date('2026-06-11T10:00:00Z') }),
      ]);

      const rows = await sql<{ value: string; collected_at: Date }[]>`
        SELECT value, collected_at FROM metric_facts
        WHERE post_target_id = ${target.targetId} ORDER BY collected_at
      `;
      // The platform revised 12 down to 9 — spam filtering catching up. Both
      // readings survive, because "why is last month's report different now"
      // has no other answer.
      assert.equal(rows.length, 2);
      assert.equal(Number(rows[0]?.value), 12);
      assert.equal(Number(rows[1]?.value), 9);
    } finally {
      await cleanup();
    }
  });

  test('the same reading collected twice writes one row', async () => {
    await fixture();
    try {
      const target = await published('at://one', new Date('2026-06-10T09:00:00Z'));
      const reading = metric({ subjectId: 'at://one' });

      const first = await recordReadings(sql, target, [reading]);
      // Two collectors racing on the same post is agreement, not an error.
      const second = await recordReadings(sql, target, [reading]);

      assert.equal(first, 1);
      assert.equal(second, 0, 'a duplicate reading must not double-count');

      const [count] = await sql<{ n: string }[]>`
        SELECT count(*) AS n FROM metric_facts WHERE post_target_id = ${target.targetId}
      `;
      assert.equal(Number(count?.n), 1);
    } finally {
      await cleanup();
    }
  });

  test("numbers are matched by the platform's id, not by response order", async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T12:00:00Z');
      const one = await published('at://one', new Date('2026-06-10T09:00:00Z'));
      const two = await published('at://two', new Date('2026-06-10T09:30:00Z'));

      // Reversed, and short one entry — exactly what happens when a post has
      // been deleted since. Positional matching would attribute two's numbers
      // to one and silently mislabel a client's best-performing post.
      const adapters = new AdapterRegistry().register(
        stubAdapter({
          metrics: () => [metric({ subjectId: 'at://two', value: 99 })],
        }),
      );

      await collectOnce({ sql, adapters, now: () => now });

      const [forTwo] = await sql<{ value: string }[]>`
        SELECT value FROM metric_facts WHERE post_target_id = ${two.targetId}
      `;
      assert.equal(Number(forTwo?.value), 99);

      const [count] = await sql<{ n: string }[]>`
        SELECT count(*) AS n FROM metric_facts WHERE post_target_id = ${one.targetId}
      `;
      assert.equal(Number(count?.n), 0, 'a post the platform said nothing about gets no row');
    } finally {
      await cleanup();
    }
  });

  test('a post measured recently is not measured again immediately', async () => {
    await fixture();
    try {
      const publishedAt = new Date('2026-06-10T09:00:00Z');
      const target = await published('at://one', publishedAt);
      await recordReadings(sql, target, [
        metric({ subjectId: 'at://one', collectedAt: new Date('2026-06-10T09:30:00Z') }),
      ]);

      // Ten minutes later: nothing has changed enough to be worth a call.
      const soon = await findMeasurable(sql, new Date('2026-06-10T09:40:00Z'));
      assert.equal(soon.filter((t) => t.targetId === target.targetId).length, 0);

      // Two hours later, on a post this young, it is.
      const later = await findMeasurable(sql, new Date('2026-06-10T11:00:00Z'));
      assert.equal(later.filter((t) => t.targetId === target.targetId).length, 1);
    } finally {
      await cleanup();
    }
  });

  test('an old post is left alone entirely', async () => {
    await fixture();
    try {
      const target = await published('at://old', new Date('2026-01-01T09:00:00Z'));
      const due = await findMeasurable(sql, new Date('2026-06-10T12:00:00Z'));
      // Every call spent on a post nobody is still engaging with is a call a
      // fresher post had a better claim on.
      assert.equal(due.filter((t) => t.targetId === target.targetId).length, 0);
    } finally {
      await cleanup();
    }
  });

  test('re-reading slows down as a post ages', async () => {
    const hour = 3_600_000;
    assert.equal(nextReadingDueAfterMs(hour), hour);
    assert.equal(nextReadingDueAfterMs(12 * hour), 6 * hour);
    assert.equal(nextReadingDueAfterMs(10 * 24 * hour), 24 * hour);
  });

  test('a network that publishes nothing measurable is skipped, not failed', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T12:00:00Z');
      await published('at://one', new Date('2026-06-10T09:00:00Z'));

      // Telegram, Discord and Mastodon are all in this category: no metrics API
      // at all. That is a fact about the network, not an error to report.
      const adapters = new AdapterRegistry().register(stubAdapter({ omitFetchMetrics: true }));
      const outcomes = await collectOnce({ sql, adapters, now: () => now });

      assert.equal(outcomes.filter((o) => o.socialProfileId === profileId).length, 0);
    } finally {
      await cleanup();
    }
  });

  test('a platform error is reported and does not stop the pass', async () => {
    await fixture();
    try {
      const now = new Date('2026-06-10T12:00:00Z');
      await published('at://one', new Date('2026-06-10T09:00:00Z'));

      const adapters = new AdapterRegistry().register(
        stubAdapter({
          throws: () => {
            throw new Error('the platform is having a day');
          },
        }),
      );

      const outcomes = await collectOnce({ sql, adapters, now: () => now });
      const mine = outcomes.find((o) => o.socialProfileId === profileId);
      assert.ok(mine?.failed, 'a failure must be reported rather than swallowed');
      assert.equal(mine?.readings, 0);
    } finally {
      await cleanup();
    }
  });

  test('an account that needs reconnecting is reported without a platform call', async () => {
    await fixture({ credential: false });
    try {
      const now = new Date('2026-06-10T12:00:00Z');
      await published('at://one', new Date('2026-06-10T09:00:00Z'));

      let called = false;
      const adapters = new AdapterRegistry().register(
        stubAdapter({
          metrics: () => {
            called = true;
            return [];
          },
        }),
      );

      // findMeasurable excludes it up front, so there is nothing to report and
      // nothing is sent. Either way, no call is made with no credential.
      await collectOnce({ sql, adapters, now: () => now });
      assert.equal(called, false);
    } finally {
      await cleanup();
    }
  });
});
