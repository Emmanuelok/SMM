import type { AdapterRegistry, PlatformAdapter, RawMetric } from '@smm/adapters';
import type { Sql } from '@smm/db';
import { unsafeId, type RemoteId, type SocialProfileId } from '@smm/shared';

/**
 * Metrics collection.
 *
 * The counterpart to publishing: a post that goes out and is never measured is
 * half a product. It runs as its own loop rather than as a step after
 * publishing, because the interesting numbers do not exist yet at publish time
 * — engagement accrues for days — and because a metrics outage must never be
 * able to stop a post going out.
 *
 * Two rules shape everything here, and both are about being able to defend a
 * number to a client two years later.
 *
 * **Nothing is normalised on the way in.** The adapter returns the platform's
 * own field name, endpoint and API version, and all three are stored beside the
 * value. That is what turns a platform redefining a metric into a dated
 * annotation on a chart rather than an unexplainable cliff in a number somebody
 * has been shown every month.
 *
 * **Readings are appended, never updated.** Platforms restate figures for days
 * afterwards as spam filtering catches up. Overwriting yesterday's reading with
 * today's would destroy the evidence that the platform changed its mind, and
 * that evidence is the only answer to "why is last month's report different
 * now".
 */

export interface CollectorDeps {
  readonly sql: Sql;
  readonly adapters: AdapterRegistry;
  readonly now?: (() => Date) | undefined;
}

export interface CollectionOutcome {
  readonly socialProfileId: string;
  readonly network: string;
  readonly posts: number;
  readonly readings: number;
  readonly failed?: string | undefined;
}

/**
 * How long a published post keeps being measured.
 *
 * Engagement on most networks is effectively over within a fortnight, and every
 * further call spends quota that a fresher post has a better claim on. Thirty
 * days is generous enough to catch the long tail on a post that gets picked up
 * late.
 */
const MEASURE_FOR_DAYS = 30;

/**
 * The gap between readings of the same post.
 *
 * Not a fixed interval, because a post's numbers move fastest in its first
 * hours and barely at all after a week. Re-reading an old post every hour
 * spends quota to write the same value repeatedly, and quota spent there is
 * quota unavailable when something takes off.
 */
export function nextReadingDueAfterMs(ageMs: number): number {
  const hour = 3_600_000;
  if (ageMs < 6 * hour) return hour;
  if (ageMs < 48 * hour) return 6 * hour;
  return 24 * hour;
}

interface MeasurableTarget {
  readonly targetId: string;
  readonly organizationId: string;
  readonly socialProfileId: string;
  readonly network: string;
  readonly remotePostId: string;
  readonly publishedAt: Date;
  readonly lastCollectedAt: Date | null;
}

/**
 * Published posts whose numbers are worth reading again.
 *
 * The freshness decision is made in SQL rather than by fetching everything and
 * filtering in memory: an account with two years of posts would otherwise pull
 * every row it has ever published on every pass.
 */
export async function findMeasurable(
  sql: Sql,
  now: Date,
  limit = 200,
): Promise<readonly MeasurableTarget[]> {
  const horizon = new Date(now.getTime() - MEASURE_FOR_DAYS * 86_400_000);

  const rows = await sql<
    {
      target_id: string;
      organization_id: string;
      social_profile_id: string;
      network: string;
      remote_post_id: string;
      published_at: Date;
      last_collected_at: Date | null;
    }[]
  >`
    SELECT t.id AS target_id, t.organization_id, t.social_profile_id, t.network,
           t.remote_post_id, t.published_at,
           (SELECT max(collected_at) FROM metric_facts f WHERE f.post_target_id = t.id)
             AS last_collected_at
    FROM post_targets t
    JOIN social_profiles p ON p.id = t.social_profile_id
    WHERE t.status = 'published'
      AND t.remote_post_id IS NOT NULL
      AND t.published_at > ${horizon}
      AND p.deleted_at IS NULL
      AND p.status = 'active'
      AND p.credential_id IS NOT NULL
    -- Never-measured posts first; then whatever has waited longest.
    ORDER BY (SELECT max(collected_at) FROM metric_facts f WHERE f.post_target_id = t.id)
      ASC NULLS FIRST
    LIMIT ${limit}
  `;

  return rows
    .map((row) => ({
      targetId: row.target_id,
      organizationId: row.organization_id,
      socialProfileId: row.social_profile_id,
      network: row.network,
      remotePostId: row.remote_post_id,
      publishedAt: row.published_at,
      lastCollectedAt: row.last_collected_at,
    }))
    .filter((target) => {
      if (target.lastCollectedAt === null) return true;
      const age = now.getTime() - target.publishedAt.getTime();
      return now.getTime() - target.lastCollectedAt.getTime() >= nextReadingDueAfterMs(age);
    });
}

/**
 * Store readings, with the provenance that makes them defensible.
 *
 * `ON CONFLICT DO NOTHING` against the reading index rather than an upsert: two
 * collectors racing on the same post must produce one row, and neither should
 * overwrite the other's. The conflict is not an error — it is two workers
 * agreeing.
 */
export async function recordReadings(
  sql: Sql,
  target: MeasurableTarget,
  metrics: readonly RawMetric[],
): Promise<number> {
  if (metrics.length === 0) return 0;

  let written = 0;
  await sql.begin(async (tx) => {
    for (const metric of metrics) {
      // `measured_at` is when the number describes, not when we asked. A
      // cumulative counter describes the moment it was read; a windowed figure
      // describes the end of its window.
      const measuredAt = metric.periodEnd ?? metric.collectedAt;

      const rows = await tx<{ id: string }[]>`
        INSERT INTO metric_facts (
          organization_id, social_profile_id, post_target_id,
          metric_key, value, measured_at, collected_at,
          source_endpoint, source_field, api_version, raw_value
        )
        VALUES (
          ${target.organizationId}, ${target.socialProfileId}, ${target.targetId},
          ${metric.fieldAsReturned}, ${metric.value}, ${measuredAt}, ${metric.collectedAt},
          ${metric.endpoint}, ${metric.fieldAsReturned}, ${metric.apiVersion},
          ${JSON.stringify({ value: metric.value, measureKind: metric.measureKind })}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      written += rows.length;
    }
  });

  return written;
}

/**
 * One collection pass.
 *
 * Grouped by account rather than by post, because every network that publishes
 * metrics takes a batch of post ids per call. Reading them one at a time would
 * multiply the quota cost by the number of posts for no benefit.
 */
export async function collectOnce(
  deps: CollectorDeps,
  batchSize = 200,
): Promise<readonly CollectionOutcome[]> {
  const now = deps.now?.() ?? new Date();
  const due = await findMeasurable(deps.sql, now, batchSize);
  if (due.length === 0) return [];

  const byProfile = new Map<string, MeasurableTarget[]>();
  for (const target of due) {
    const list = byProfile.get(target.socialProfileId);
    if (list === undefined) byProfile.set(target.socialProfileId, [target]);
    else list.push(target);
  }

  const outcomes: CollectionOutcome[] = [];

  for (const [profileId, targets] of byProfile) {
    const first = targets[0];
    if (first === undefined) continue;

    const adapter: PlatformAdapter | undefined = deps.adapters.get(
      first.network as Parameters<AdapterRegistry['get']>[0],
    );
    // A network with no adapter, or one that publishes nothing about a post
    // once sent, is not a failure to report — it is a fact about the network.
    if (adapter?.fetchMetrics === undefined) continue;

    const connection = await loadConnection(deps.sql, profileId, first.network);
    if (connection === undefined) {
      outcomes.push({
        socialProfileId: profileId,
        network: first.network,
        posts: targets.length,
        readings: 0,
        failed: 'This account needs reconnecting before its numbers can be read.',
      });
      continue;
    }

    try {
      const ids = targets.map((t) => unsafeId<'RemoteId'>(t.remotePostId) as RemoteId);
      const window = { from: new Date(now.getTime() - MEASURE_FOR_DAYS * 86_400_000), to: now };
      const metrics = await adapter.fetchMetrics(connection, ids, window);

      // Returned against the platform's own id, so they are matched back that
      // way. Assuming the response preserves request order would silently
      // attribute one post's numbers to another whenever a post was deleted.
      const byRemoteId = new Map<string, RawMetric[]>();
      for (const metric of metrics) {
        const list = byRemoteId.get(metric.subjectId);
        if (list === undefined) byRemoteId.set(metric.subjectId, [metric]);
        else list.push(metric);
      }

      let readings = 0;
      for (const target of targets) {
        readings += await recordReadings(
          deps.sql,
          target,
          byRemoteId.get(target.remotePostId) ?? [],
        );
      }

      outcomes.push({
        socialProfileId: profileId,
        network: first.network,
        posts: targets.length,
        readings,
      });
    } catch (error) {
      // Collection failing must never stop publishing, and must never take the
      // worker down. The account is simply measured on the next pass.
      const fault = adapter.classify(error);
      outcomes.push({
        socialProfileId: profileId,
        network: first.network,
        posts: targets.length,
        readings: 0,
        failed: fault.message,
      });
    }
  }

  return outcomes;
}

/** The connection metrics are read through. Mirrors the dispatcher's. */
async function loadConnection(
  sql: Sql,
  profileId: string,
  network: string,
): Promise<Parameters<NonNullable<PlatformAdapter['fetchMetrics']>>[0] | undefined> {
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
    WHERE id = ${profileId} AND deleted_at IS NULL
  `;

  if (row === undefined || row.credential_id === null || row.status !== 'active') {
    return undefined;
  }

  return {
    id: unsafeId(row.id),
    organizationId: unsafeId(row.organization_id),
    network: network as 'bluesky',
    profileId: unsafeId<'SocialProfileId'>(row.id) as SocialProfileId,
    credentialId: unsafeId(row.credential_id),
    kind: 'api_key',
    app: { kind: 'shared', appId: unsafeId('sharedapp') },
    account: { id: row.remote_account_id as RemoteId, displayName: row.display_name },
    scopes: [],
    grantedAt: new Date(),
  } as Parameters<NonNullable<PlatformAdapter['fetchMetrics']>>[0];
}
