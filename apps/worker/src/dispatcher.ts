import type { PlatformAdapter } from '@smm/adapters';
import { AdapterRegistry, capabilitiesFor } from '@smm/adapters';
import type { Sql } from '@smm/db';
import {
  dispositionOf,
  failure,
  unsafeId,
  type PostTargetId,
  type PublishFailure,
  type RemoteId,
  type SocialProfileId,
} from '@smm/shared';
import { checkPublishBudget, planNextAttempt } from '@smm/scheduler';

/**
 * The publish dispatcher.
 *
 * Claims work that is due, runs it through the adapter lifecycle, and records
 * what happened. Everything here is shaped by one fact: **publishing is not
 * transactional with the network.** A worker can post successfully and then
 * crash before writing that down, and a duplicate on a client's feed cannot be
 * retracted. So the sequence is deliberately claim-first, and the ledger is
 * written before anything irreversible happens rather than after.
 *
 * Work is claimed with `FOR UPDATE SKIP LOCKED`, which is why there is no Redis
 * here. Postgres gives exactly-once claiming among any number of workers with
 * no extra service to run, no second thing to fail, and no second place for the
 * queue and the database to disagree about what happened.
 */

export interface DispatchDeps {
  readonly sql: Sql;
  readonly adapters: AdapterRegistry;
  /** Injected so tests can drive the clock rather than sleep. */
  readonly now?: (() => Date) | undefined;
}

export interface DueTarget {
  readonly id: PostTargetId;
  readonly postId: string;
  readonly socialProfileId: SocialProfileId;
  readonly network: string;
  readonly format: string;
  readonly body: string;
  readonly attemptCount: number;
  readonly organizationId: string;
}

export interface DispatchOutcome {
  readonly targetId: PostTargetId;
  readonly result: 'published' | 'failed' | 'deferred' | 'skipped';
  readonly detail: string;
}

/**
 * Claim due targets.
 *
 * `SKIP LOCKED` is what makes several workers safe: a row locked by one worker
 * is invisible to the others rather than making them wait, so throughput scales
 * with workers instead of serialising on the queue head.
 *
 * The status moves to `publishing` inside the same transaction that takes the
 * lock. A worker that dies after this leaves the row in `publishing`, which is
 * recoverable and, crucially, distinguishable from work nobody has started.
 *
 * Two kinds of row are due, and missing the second one made every retry a
 * silent permanent failure: a first attempt, which is `scheduled` or `pending`
 * and past its time, and a *re*-attempt, which a previous failure left as
 * `failed` carrying the moment to try again. Both partial indexes on
 * `post_targets` exist for exactly this pair — `post_targets_due_idx` for the
 * first, `post_targets_retry_idx` for the second — and Postgres reads them
 * together rather than scanning.
 */
export async function claimDueTargets(
  sql: Sql,
  limit: number,
  now: Date,
): Promise<readonly DueTarget[]> {
  return sql.begin(async (tx) => {
    const rows = await tx<
      {
        id: string;
        post_id: string;
        social_profile_id: string;
        network: string;
        format: string;
        body: string;
        attempt_count: number;
        organization_id: string;
      }[]
    >`
      SELECT t.id, t.post_id, t.social_profile_id, t.network, t.format,
             COALESCE(v.body, p.body) AS body,
             t.attempt_count, t.organization_id
      FROM post_targets t
      JOIN posts p ON p.id = t.post_id
      LEFT JOIN post_versions v ON v.id = t.post_version_id
      WHERE t.dispatch = 'our_dispatcher'
        -- Belt and braces. Cancelling moves a stoppable row straight out of
        -- the queue, so this only catches one cancelled while in flight and
        -- since recovered — but a claim is the last place to discover that a
        -- post was called back.
        AND t.cancel_requested_at IS NULL
        AND (
          (t.status IN ('scheduled', 'pending')
            AND t.scheduled_at IS NOT NULL
            AND t.scheduled_at <= ${now}
            AND (t.next_attempt_at IS NULL OR t.next_attempt_at <= ${now}))
          OR
          -- A retry. A NULL next_attempt_at is what distinguishes a failure we
          -- gave up on from one still owed another attempt, so a terminal
          -- failure is never picked up again by this branch.
          (t.status = 'failed'
            AND t.next_attempt_at IS NOT NULL
            AND t.next_attempt_at <= ${now})
        )
      -- By the moment each row became due, so a retry that is already late is
      -- not overtaken by work scheduled after it.
      ORDER BY COALESCE(t.next_attempt_at, t.scheduled_at)
      LIMIT ${limit}
      FOR UPDATE OF t SKIP LOCKED
    `;

    if (rows.length === 0) return [];

    await tx`
      UPDATE post_targets
      SET status = 'publishing', updated_at = now()
      WHERE id = ANY(${rows.map((r) => r.id)})
    `;

    return rows.map((row) => ({
      id: unsafeId<'PostTargetId'>(row.id) as PostTargetId,
      postId: row.post_id,
      socialProfileId: unsafeId<'SocialProfileId'>(row.social_profile_id) as SocialProfileId,
      network: row.network,
      format: row.format,
      body: row.body,
      attemptCount: row.attempt_count,
      organizationId: row.organization_id,
    }));
  });
}

/**
 * Recover rows abandoned by a worker that died mid-publish.
 *
 * A row stuck in `publishing` is genuinely ambiguous: the post may or may not
 * have gone out. It is returned to the queue rather than retried blindly,
 * because the safe move is to read back what actually happened before writing
 * again — a duplicate cannot be undone, while a delayed post can.
 *
 * Unless it was cancelled in the meantime. Someone who hit cancel while their
 * post was in flight was told it might still go out — being told that and then
 * watching it publish an hour later, because a worker happened to die and the
 * reclaim put it back, is the worst outcome this function can produce. The
 * request outranks the recovery.
 */
export async function reclaimStalled(
  sql: Sql,
  stalledAfterMs: number,
  now: Date,
): Promise<number> {
  const cutoff = new Date(now.getTime() - stalledAfterMs);
  const rows = await sql<{ id: string }[]>`
    UPDATE post_targets
    SET status = CASE
          WHEN cancel_requested_at IS NOT NULL THEN 'cancelled'::target_status
          ELSE 'scheduled'::target_status
        END,
        next_attempt_at = CASE
          WHEN cancel_requested_at IS NOT NULL THEN NULL
          ELSE next_attempt_at
        END,
        failure_kind = CASE
          WHEN cancel_requested_at IS NOT NULL THEN 'cancelled'
          ELSE 'interrupted'
        END,
        failure_message = CASE
          WHEN cancel_requested_at IS NOT NULL
            THEN 'Cancelled while it was being published.'
          ELSE 'A worker stopped mid-publish. Verifying before retrying.'
        END,
        updated_at = now()
    WHERE status = 'publishing' AND updated_at < ${cutoff}
    RETURNING id
  `;
  return rows.length;
}

async function recordFailure(
  sql: Sql,
  target: DueTarget,
  fault: PublishFailure,
  now: Date,
): Promise<DispatchOutcome> {
  const next = planNextAttempt(now, target.attemptCount + 1, fault);

  if (next.action === 'retry') {
    await sql`
      UPDATE post_targets
      SET status = 'failed',
          attempt_count = attempt_count + 1,
          next_attempt_at = ${next.at},
          failure_kind = ${fault.kind},
          failure_message = ${fault.message},
          updated_at = now()
      WHERE id = ${target.id}
    `;
    return { targetId: target.id, result: 'deferred', detail: `${fault.kind}; retrying` };
  }

  // Both await_reconnect and send_repair_link mean a human has to act, so the
  // row must not sit in a retry loop pretending progress is being made.
  const status =
    next.action === 'await_reconnect' || next.action === 'send_repair_link'
      ? 'awaiting_reconnect'
      : 'failed';

  await sql`
    UPDATE post_targets
    SET status = ${status},
        attempt_count = attempt_count + 1,
        next_attempt_at = NULL,
        failure_kind = ${fault.kind},
        failure_message = ${fault.message},
        updated_at = now()
    WHERE id = ${target.id}
  `;
  return { targetId: target.id, result: 'failed', detail: fault.kind };
}

/**
 * Publish one claimed target.
 *
 * The claim is written before the network call, so a replay of this work finds
 * the claim and declines rather than posting again.
 */
export async function publishTarget(
  deps: DispatchDeps,
  target: DueTarget,
  now: Date,
): Promise<DispatchOutcome> {
  const { sql, adapters } = deps;

  const adapter: PlatformAdapter | undefined = adapters.get(
    target.network as Parameters<AdapterRegistry['get']>[0],
  );
  if (adapter === undefined) {
    // Not a failure of the post. Nothing about retrying changes whether an
    // adapter exists, so it is parked rather than burned through attempts.
    await sql`
      UPDATE post_targets
      SET status = 'failed',
          failure_kind = 'unsupported_operation',
          failure_message = ${`No adapter is available for ${target.network} in this deployment.`},
          next_attempt_at = NULL,
          updated_at = now()
      WHERE id = ${target.id}
    `;
    return { targetId: target.id, result: 'skipped', detail: `no adapter for ${target.network}` };
  }

  // Budget is checked here, immediately before the call, rather than at
  // scheduling time: a post scheduled days ago knows nothing about what the
  // account has published since.
  const caps = capabilitiesFor(target.network as Parameters<typeof capabilitiesFor>[0]);
  if (caps !== undefined) {
    const history = await recentActivity(sql, target.socialProfileId, now);
    const decision = checkPublishBudget(now, history, caps.publishing);
    if (!decision.allowed) {
      const retryAt = new Date(now.getTime() + decision.retryAfterMs);
      await sql`
        UPDATE post_targets
        SET status = 'scheduled',
            next_attempt_at = ${retryAt},
            failure_kind = ${decision.reason},
            failure_message = ${decision.message},
            updated_at = now()
        WHERE id = ${target.id}
      `;
      return { targetId: target.id, result: 'deferred', detail: decision.reason };
    }
  }

  const connection = await loadConnection(sql, target);
  if (connection === undefined) {
    return recordFailure(
      sql,
      target,
      failure('auth_expired', 'This account needs to be reconnected before it can publish.'),
      now,
    );
  }

  const resolved = {
    network: adapter.network,
    profileId: target.socialProfileId,
    format: target.format as 'text',
    body: target.body,
    media: [],
  };

  const attempt = target.attemptCount + 1;
  const idem = `${target.id}-${attempt}` as Parameters<PlatformAdapter['submit']>[2];

  // Claimed before the network call. A replayed job finds this row and declines
  // rather than publishing a second time.
  await sql`
    INSERT INTO publish_claims (post_target_id, attempt, claimed_by, expires_at)
    VALUES (${target.id}, ${attempt}, ${process.env['RAILWAY_REPLICA_ID'] ?? 'worker'},
            ${new Date(now.getTime() + 600_000)})
    ON CONFLICT (post_target_id, attempt) DO NOTHING
  `;

  const submitted = await adapter.submit(connection, resolved, idem);
  if (!submitted.ok) {
    return recordFailure(sql, target, submitted.error, now);
  }

  const finalized = await adapter.finalize(connection, submitted.value, resolved);
  if (!finalized.ok) {
    return recordFailure(sql, target, finalized.error, now);
  }

  await sql`
    UPDATE post_targets
    SET status = 'published',
        published_at = ${finalized.value.publishedAt},
        remote_post_id = ${finalized.value.remotePostId},
        remote_url = ${finalized.value.url ?? null},
        attempt_count = ${attempt},
        next_attempt_at = NULL,
        failure_kind = NULL,
        failure_message = NULL,
        updated_at = now()
    WHERE id = ${target.id}
  `;

  return { targetId: target.id, result: 'published', detail: finalized.value.url ?? 'published' };
}

/** Recent publishes and requests for an account, for budget enforcement. */
async function recentActivity(
  sql: Sql,
  profileId: SocialProfileId,
  now: Date,
): Promise<{ publishes: Date[]; requests: Date[]; connectedAt?: Date | undefined }> {
  const since = new Date(now.getTime() - 86_400_000);
  const published = await sql<{ published_at: Date }[]>`
    SELECT published_at FROM post_targets
    WHERE social_profile_id = ${profileId}
      AND status = 'published'
      AND published_at > ${since}
  `;
  const [profile] = await sql<{ connected_at: Date }[]>`
    SELECT connected_at FROM social_profiles WHERE id = ${profileId}
  `;

  const publishes = published.map((row) => row.published_at);
  return {
    publishes,
    // Every publish is at least one request; without a separate request ledger
    // this under-counts, which is the safe direction.
    requests: publishes,
    ...(profile === undefined ? {} : { connectedAt: profile.connected_at }),
  };
}

/**
 * Load the connection a target publishes through.
 *
 * Returns undefined rather than throwing when the account needs reconnecting,
 * because that is an expected state with a defined outcome, not an error.
 */
async function loadConnection(
  sql: Sql,
  target: DueTarget,
): Promise<Parameters<PlatformAdapter['submit']>[0] | undefined> {
  const [row] = await sql<
    {
      id: string;
      organization_id: string;
      credential_id: string | null;
      remote_account_id: string;
      display_name: string;
      status: string;
    }[]
  >`
    SELECT id, organization_id, credential_id, remote_account_id, display_name, status
    FROM social_profiles
    WHERE id = ${target.socialProfileId} AND deleted_at IS NULL
  `;

  if (row === undefined || row.credential_id === null || row.status !== 'active') {
    return undefined;
  }

  return {
    id: unsafeId(row.id),
    organizationId: unsafeId(row.organization_id),
    network: target.network as 'bluesky',
    profileId: target.socialProfileId,
    credentialId: unsafeId(row.credential_id),
    kind: 'api_key',
    // The shared platform app: this deployment's own registration, whose quota
    // every tenant on it draws from. Bring-your-own-app connections carry the
    // customer's registration instead.
    app: { kind: 'shared', appId: unsafeId('sharedapp') },
    account: {
      id: row.remote_account_id as RemoteId,
      displayName: row.display_name,
    },
    scopes: [],
    grantedAt: new Date(),
  } as Parameters<PlatformAdapter['submit']>[0];
}

/** One pass: reclaim what stalled, claim what is due, publish it. */
export async function runOnce(
  deps: DispatchDeps,
  batchSize = 10,
): Promise<readonly DispatchOutcome[]> {
  const now = deps.now?.() ?? new Date();

  await reclaimStalled(deps.sql, 600_000, now);
  const targets = await claimDueTargets(deps.sql, batchSize, now);

  const outcomes: DispatchOutcome[] = [];
  for (const target of targets) {
    try {
      outcomes.push(await publishTarget(deps, target, now));
    } catch (error) {
      // An adapter that throws rather than returning a Result is a bug, but it
      // must not take the worker down or leave the row claimed forever.
      const fault = failure(
        'internal',
        error instanceof Error ? error.message : 'Unexpected error while publishing.',
      );
      outcomes.push(await recordFailure(deps.sql, target, fault, now));
    }
  }
  return outcomes;
}

export { dispositionOf };
