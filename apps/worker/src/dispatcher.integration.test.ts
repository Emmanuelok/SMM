import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import { AdapterRegistry, type PlatformAdapter } from '@smm/adapters';
import { createDatabase, type Sql } from '@smm/db';
import { failure, ok, err, unsafeId, type PublishFailure } from '@smm/shared';

import { claimDueTargets, reclaimStalled, runOnce } from './dispatcher.js';

/**
 * The dispatcher against a real database.
 *
 * Every interesting claim it makes is about Postgres semantics, and none of
 * them can be checked without Postgres: that `FOR UPDATE SKIP LOCKED` gives two
 * concurrent workers disjoint work rather than a deadlock or a duplicate, that
 * a worker dying mid-publish leaves a row that is recoverable and
 * distinguishable from untouched work, and that the publish claim is written
 * before the network call so a replay declines instead of posting twice.
 *
 * Skipped without TEST_DATABASE_URL, so the ordinary run stays hermetic.
 *
 * The dispatcher claims work across the whole database by design — that is what
 * a worker does — so a suite running beside this one, with due rows of its own,
 * competes for the same batches. `npm test` runs files one at a time for that
 * reason; the assertions below are still written to tolerate company.
 */

const url = process.env['TEST_DATABASE_URL'];

/**
 * A network that does whatever the test says.
 *
 * Typed through a cast rather than implemented in full. The dispatcher uses
 * exactly four members of the adapter contract, and a stub with sixteen
 * throwing stubs around them would hide which four those are — this way the
 * object *is* the list of what the dispatcher depends on.
 */
function stubAdapter(behaviour: {
  onSubmit?: () => PublishFailure | undefined;
  submitted?: () => void;
}): PlatformAdapter {
  return {
    network: 'bluesky',
    async submit(_conn: unknown, _target: unknown, idem: unknown) {
      behaviour.submitted?.();
      const fault = behaviour.onSubmit?.();
      if (fault !== undefined) return err(fault);
      return ok({
        network: 'bluesky',
        archetype: 'single_shot',
        idempotencyKey: idem,
        phase: 'ready',
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 3_600_000),
        mediaIds: [],
      });
    },
    async finalize() {
      return ok({
        remotePostId: unsafeId('at://post/1'),
        url: 'https://bsky.app/post/1',
        publishedAt: new Date(),
      });
    },
    classify(error: unknown): PublishFailure {
      return failure('internal', error instanceof Error ? error.message : 'unknown');
    },
  } as unknown as PlatformAdapter;
}

describe('the publish dispatcher, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: string;
  let profileGroupId: string;
  let profileId: string;

  before(() => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 6 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  async function fixture(options: { credential?: boolean } = {}): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Dispatch Test', ${'dispatch-' + Math.random().toString(36).slice(2, 10)})
      RETURNING id
    `;
    if (org === undefined) throw new Error('no organization');
    organizationId = org.id;

    const [group] = await sql<{ id: string }[]>`
      INSERT INTO profile_groups (organization_id, name, timezone)
      VALUES (${organizationId}, 'Brand', 'UTC')
      RETURNING id
    `;
    if (group === undefined) throw new Error('no profile group');
    profileGroupId = group.id;

    let credentialId: string | null = null;
    if (options.credential !== false) {
      const [credential] = await sql<{ id: string }[]>`
        INSERT INTO credentials (organization_id, access_token_enc, key_id)
        VALUES (${organizationId}, ${Buffer.from('sealed')}, 'k1')
        RETURNING id
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

  /** A target due at `scheduledAt`, with its post and version. */
  async function dueTarget(scheduledAt: Date, body = 'Ready to go'): Promise<string> {
    const [post] = await sql<{ id: string }[]>`
      INSERT INTO posts (organization_id, profile_group_id, format, body, status)
      VALUES (${organizationId}, ${profileGroupId}, 'text', ${body}, 'scheduled')
      RETURNING id
    `;
    if (post === undefined) throw new Error('no post');

    const [version] = await sql<{ id: string }[]>`
      INSERT INTO post_versions (organization_id, post_id, version, content_hash, body)
      VALUES (${organizationId}, ${post.id}, 1, ${'hash-' + Math.random()}, ${body})
      RETURNING id
    `;
    if (version === undefined) throw new Error('no version');

    const [target] = await sql<{ id: string }[]>`
      INSERT INTO post_targets (
        organization_id, post_id, post_version_id, social_profile_id,
        network, format, status, dispatch,
        scheduled_at, scheduled_local, scheduled_timezone, scheduled_resolution
      )
      VALUES (
        ${organizationId}, ${post.id}, ${version.id}, ${profileId},
        'bluesky', 'text', 'scheduled', 'our_dispatcher',
        ${scheduledAt}, ${'2026-06-10 09:00'}, 'UTC', 'exact'
      )
      RETURNING id
    `;
    if (target === undefined) throw new Error('no target');
    return target.id;
  }

  async function statusOf(targetId: string): Promise<{
    status: string;
    attempt_count: number;
    next_attempt_at: Date | null;
    failure_kind: string | null;
    remote_post_id: string | null;
  }> {
    const [row] = await sql<
      {
        status: string;
        attempt_count: number;
        next_attempt_at: Date | null;
        failure_kind: string | null;
        remote_post_id: string | null;
      }[]
    >`
      SELECT status, attempt_count, next_attempt_at, failure_kind, remote_post_id
      FROM post_targets WHERE id = ${targetId}
    `;
    if (row === undefined) throw new Error('target vanished');
    return row;
  }

  test('a due post is claimed, published and recorded', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      let submits = 0;
      const adapters = new AdapterRegistry().register(
        stubAdapter({ submitted: () => (submits += 1) }),
      );

      const outcomes = await runOnce({ sql, adapters, now: () => now });
      const mine = outcomes.filter((o) => o.targetId === targetId);
      assert.equal(mine.length, 1);
      assert.equal(mine[0]?.result, 'published');
      assert.equal(submits, 1);

      const after = await statusOf(targetId);
      assert.equal(after.status, 'published');
      assert.equal(after.remote_post_id, 'at://post/1');
      assert.equal(after.next_attempt_at, null);

      // The claim is what makes a replay safe, so it has to exist.
      const claims = await sql<{ attempt: number }[]>`
        SELECT attempt FROM publish_claims WHERE post_target_id = ${targetId}
      `;
      assert.equal(claims.length, 1);
      assert.equal(claims[0]?.attempt, 1);
    } finally {
      await cleanup();
    }
  });

  test('a post scheduled for later is left alone', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() + 3_600_000));

      const outcomes = await runOnce({ sql, adapters: new AdapterRegistry().register(stubAdapter({})), now: () => now });
      assert.equal(outcomes.filter((o) => o.targetId === targetId).length, 0);
      assert.equal((await statusOf(targetId)).status, 'scheduled');
    } finally {
      await cleanup();
    }
  });

  test('two workers claiming at once get disjoint work', async () => {
    await fixture();
    try {
      const now = new Date();
      const ids = new Set<string>();
      for (let i = 0; i < 6; i += 1) {
        ids.add(await dueTarget(new Date(now.getTime() - 60_000), `Post ${i}`));
      }

      // The point of SKIP LOCKED: concurrent claims must not block each other
      // and must not hand the same row to both. Sequential claims would pass
      // this test trivially, so they are genuinely started together.
      const [a, b] = await Promise.all([
        claimDueTargets(sql, 3, now),
        claimDueTargets(sql, 3, now),
      ]);

      const mineA = a.filter((t) => ids.has(t.id));
      const mineB = b.filter((t) => ids.has(t.id));
      const overlap = mineA.filter((t) => mineB.some((o) => o.id === t.id));
      assert.equal(overlap.length, 0, 'the same post must never be claimed twice');

      // Every post claimed exactly once, checked by draining rather than by
      // arithmetic on one round: another suite's due rows can take part of a
      // batch, and the claim being *exclusive* is the property under test, not
      // how many rows one call happened to reach.
      const claimed = new Set([...mineA, ...mineB].map((t) => t.id));
      for (let round = 0; round < 10 && claimed.size < ids.size; round += 1) {
        for (const target of await claimDueTargets(sql, 10, now)) {
          if (!ids.has(target.id)) continue;
          assert.ok(!claimed.has(target.id), 'a claimed post was handed out again');
          claimed.add(target.id);
        }
      }
      assert.equal(claimed.size, ids.size, 'every post must be claimed');

      // Claiming moves the row out of the queue in the same transaction, so a
      // worker arriving now finds nothing of ours left.
      const empty = await claimDueTargets(sql, 10, now);
      assert.equal(empty.filter((t) => ids.has(t.id)).length, 0);
    } finally {
      await cleanup();
    }
  });

  test('a worker that dies mid-publish leaves recoverable work', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      // Claim it and then stop, which is exactly what a killed worker leaves.
      const claimed = await claimDueTargets(sql, 10, now);
      assert.ok(claimed.some((t) => t.id === targetId));
      assert.equal((await statusOf(targetId)).status, 'publishing');

      // Not yet stale: reclaiming immediately would fight a worker that is
      // simply taking its time, and re-publishing a post cannot be undone.
      assert.equal(await reclaimStalled(sql, 600_000, now), 0);
      assert.equal((await statusOf(targetId)).status, 'publishing');

      // Once the row is older than the stall window it goes back to the queue.
      const later = new Date(now.getTime() + 700_000);
      assert.ok((await reclaimStalled(sql, 600_000, later)) >= 1);

      const recovered = await statusOf(targetId);
      assert.equal(recovered.status, 'scheduled');
      assert.equal(recovered.failure_kind, 'interrupted');
    } finally {
      await cleanup();
    }
  });

  test('a post cancelled while in flight is not resurrected by the reclaim', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      // The exact sequence that produces the worst outcome a scheduler can
      // produce: claimed by a worker, cancelled by its owner while claimed,
      // then the worker dies. Without the request being honoured here, the
      // reclaim puts it back and it publishes an hour after being called off.
      await claimDueTargets(sql, 10, now);
      await sql`
        UPDATE post_targets SET cancel_requested_at = now() WHERE id = ${targetId}
      `;

      const later = new Date(now.getTime() + 700_000);
      await reclaimStalled(sql, 600_000, later);

      const after = await statusOf(targetId);
      assert.equal(after.status, 'cancelled', 'a cancelled post must not go back in the queue');
      assert.equal(after.next_attempt_at, null);

      // And nothing picks it up even if something else puts it back.
      let submits = 0;
      await sql`UPDATE post_targets SET status = 'scheduled' WHERE id = ${targetId}`;
      await runOnce({
        sql,
        adapters: new AdapterRegistry().register(stubAdapter({ submitted: () => (submits += 1) })),
        now: () => later,
      });
      assert.equal(submits, 0, 'the claim must refuse a row whose cancellation was recorded');
    } finally {
      await cleanup();
    }
  });

  test('an ordinary stalled row still goes back in the queue', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));
      await claimDueTargets(sql, 10, now);

      // No cancellation: the recovery must still work, or honouring the
      // cancellation would have cost the crash-safety it sits inside.
      await reclaimStalled(sql, 600_000, new Date(now.getTime() + 700_000));

      const after = await statusOf(targetId);
      assert.equal(after.status, 'scheduled');
      assert.equal(after.failure_kind, 'interrupted');
    } finally {
      await cleanup();
    }
  });

  test('a transient failure is deferred with a time to try again', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      const adapters = new AdapterRegistry().register(
        stubAdapter({ onSubmit: () => failure('transient', 'The network hiccuped.') }),
      );

      const outcomes = await runOnce({ sql, adapters, now: () => now });
      assert.equal(outcomes.find((o) => o.targetId === targetId)?.result, 'deferred');

      const after = await statusOf(targetId);
      assert.equal(after.status, 'failed');
      assert.equal(after.attempt_count, 1);
      const retryAt = after.next_attempt_at;
      assert.ok(retryAt, 'a retryable failure needs a time to retry at');
      assert.ok(retryAt.getTime() > now.getTime());

      // And it is genuinely picked up again once that time arrives.
      const resumed = await runOnce({
        sql,
        adapters: new AdapterRegistry().register(stubAdapter({})),
        now: () => new Date(retryAt.getTime() + 1000),
      });
      assert.equal(resumed.find((o) => o.targetId === targetId)?.result, 'published');
      assert.equal((await statusOf(targetId)).attempt_count, 2);
    } finally {
      await cleanup();
    }
  });

  test('an expired credential parks the post for a human instead of retrying', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      const adapters = new AdapterRegistry().register(
        stubAdapter({ onSubmit: () => failure('auth_expired', 'Reconnect this account.') }),
      );

      await runOnce({ sql, adapters, now: () => now });

      const after = await statusOf(targetId);
      // A retry loop here would burn attempts against a wall: nothing changes
      // until a person reconnects the account.
      assert.equal(after.status, 'awaiting_reconnect');
      assert.equal(after.next_attempt_at, null);
    } finally {
      await cleanup();
    }
  });

  test('an account with no credential is reported, not crashed on', async () => {
    await fixture({ credential: false });
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      let submits = 0;
      const adapters = new AdapterRegistry().register(
        stubAdapter({ submitted: () => (submits += 1) }),
      );

      await runOnce({ sql, adapters, now: () => now });
      assert.equal(submits, 0, 'nothing should be sent for an account that cannot authenticate');
      assert.equal((await statusOf(targetId)).status, 'awaiting_reconnect');
    } finally {
      await cleanup();
    }
  });

  test('a network with no adapter parks the post rather than burning attempts', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));
      await sql`UPDATE post_targets SET network = 'linkedin' WHERE id = ${targetId}`;
      await sql`UPDATE social_profiles SET network = 'linkedin' WHERE id = ${profileId}`;

      const outcomes = await runOnce({
        sql,
        adapters: new AdapterRegistry().register(stubAdapter({})),
        now: () => now,
      });
      assert.equal(outcomes.find((o) => o.targetId === targetId)?.result, 'skipped');

      const after = await statusOf(targetId);
      assert.equal(after.status, 'failed');
      assert.equal(after.failure_kind, 'unsupported_operation');
      // Nothing about retrying changes whether an adapter exists.
      assert.equal(after.next_attempt_at, null);
    } finally {
      await cleanup();
    }
  });

  test('an adapter that throws does not take the worker down', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      const adapters = new AdapterRegistry().register({
        network: 'bluesky',
        async submit() {
          throw new Error('adapter bug');
        },
        classify: (error: unknown) =>
          failure('internal', error instanceof Error ? error.message : 'unknown'),
      } as unknown as PlatformAdapter);

      // The row must not stay claimed forever because an adapter misbehaved.
      const outcomes = await runOnce({ sql, adapters, now: () => now });
      assert.equal(outcomes.find((o) => o.targetId === targetId)?.result, 'failed');

      const after = await statusOf(targetId);
      assert.equal(after.status, 'failed');
      // Recorded as ours rather than the network's, and not retried: a bug in
      // this codebase does not become correct by being run again, and burning
      // attempts against it only delays somebody looking at it.
      assert.equal(after.failure_kind, 'internal');
      assert.equal(after.next_attempt_at, null);
    } finally {
      await cleanup();
    }
  });

  test('a failure that gave up is not picked up again', async () => {
    await fixture();
    try {
      const now = new Date();
      const targetId = await dueTarget(new Date(now.getTime() - 60_000));

      // A terminal failure: `failed` with no time to try again. The retry
      // branch of the claim query keys on exactly that distinction, so this is
      // the row that proves it does not sweep up everything marked failed.
      await sql`
        UPDATE post_targets
        SET status = 'failed', next_attempt_at = NULL, failure_kind = 'content_rejected'
        WHERE id = ${targetId}
      `;

      let submits = 0;
      const adapters = new AdapterRegistry().register(
        stubAdapter({ submitted: () => (submits += 1) }),
      );
      await runOnce({ sql, adapters, now: () => new Date(now.getTime() + 86_400_000) });

      assert.equal(submits, 0);
      assert.equal((await statusOf(targetId)).status, 'failed');
    } finally {
      await cleanup();
    }
  });
});
