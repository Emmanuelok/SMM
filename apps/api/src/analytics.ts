import type { Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

/**
 * Reading the numbers back.
 *
 * The collector stores L1 — what the platform said, verbatim, with the endpoint
 * and API version that said it. This is the layer that maps L1 up into a
 * vocabulary a person can compare across networks, and it is deliberately the
 * *only* place that mapping happens. Doing it on the way in would discard the
 * provenance at the one moment it existed.
 *
 * Two rules survive from the collection side and are worth restating, because
 * breaking either produces confident nonsense rather than an error:
 *
 * A cumulative counter is the latest reading, never a sum. Bluesky's
 * `likeCount` is the running total on the record; adding thirty daily readings
 * gives a number thirty times too large that still looks plausible on a chart.
 *
 * A metric nobody published is absent, not zero. Bluesky exposes no impressions
 * at any tier, and a zero in that column reads as "nobody saw it" rather than
 * "we were never told".
 */

/**
 * Platform field names, mapped to the vocabulary shown to people.
 *
 * Keyed by the field exactly as the platform returned it, which is what the
 * fact table stores. A field missing from this map is still collected and still
 * queryable — it simply has no cross-network name yet, which is the honest
 * state for something newly introduced.
 */
const CANONICAL: Readonly<Record<string, string>> = {
  // Bluesky, from app.bsky.feed.getPosts
  likeCount: 'likes',
  repostCount: 'shares',
  replyCount: 'comments',
  quoteCount: 'quotes',
};

/** The order engagement metrics are shown in. Most-used first. */
const DISPLAY_ORDER = ['likes', 'comments', 'shares', 'quotes'];

export interface PostPerformance {
  readonly postId: string;
  readonly targetId: string;
  readonly network: string;
  readonly handle: string | null;
  readonly body: string;
  readonly publishedAt: Date;
  readonly remoteUrl: string | null;
  /** Canonical name to latest value. Absent means the platform never said. */
  readonly metrics: Readonly<Record<string, number>>;
  /** When these numbers were last read from the platform. */
  readonly measuredAt: Date | null;
  /** Total engagement, for ranking. Only ever a sum across distinct metrics. */
  readonly engagement: number;
}

export interface AnalyticsSummary {
  readonly posts: readonly PostPerformance[];
  /** Totals across the posts above, by canonical name. */
  readonly totals: Readonly<Record<string, number>>;
  readonly publishedCount: number;
  /** Canonical names present in this data, in display order. */
  readonly columns: readonly string[];
  /**
   * Networks in this data that publish nothing measurable.
   *
   * Named explicitly so an empty row reads as "this network tells us nothing"
   * rather than "this post did nothing".
   */
  readonly unmeasuredNetworks: readonly string[];
}

/** Networks with no third-party metrics API at all. */
const PUBLISHES_NO_METRICS = new Set(['mastodon']);

/**
 * Performance of recently published posts.
 *
 * The latest reading per (target, field) is picked in SQL with DISTINCT ON,
 * which is the whole point of keeping every reading: the history stays
 * available for showing that a platform restated a figure, while the default
 * view shows only what is currently true.
 */
/**
 * A whole number inside a range, whatever arrived.
 *
 * Truncation is the part that matters, not the clamping: `LIMIT 1.5` is a type
 * error in Postgres, so a query string of `?limit=1.5` reached the driver and
 * came back as a 500. Clamping the range alone let it through, because 1.5 is
 * perfectly within bounds.
 */
function boundedInt(value: number | undefined, fallback: number, min: number, max: number): number {
  const whole = Math.trunc(Number(value));
  if (!Number.isFinite(whole)) return fallback;
  return Math.min(Math.max(whole, min), max);
}

export async function postPerformance(
  sql: Sql,
  organizationId: OrganizationId,
  options: { readonly sinceDays?: number; readonly limit?: number } = {},
): Promise<AnalyticsSummary> {
  const sinceDays = boundedInt(options.sinceDays, 30, 1, 365);
  const limit = boundedInt(options.limit, 50, 1, 200);
  const since = new Date(Date.now() - sinceDays * 86_400_000);

  const targets = await sql<
    {
      post_id: string;
      target_id: string;
      network: string;
      handle: string | null;
      body: string;
      published_at: Date;
      remote_url: string | null;
    }[]
  >`
    SELECT t.post_id, t.id AS target_id, t.network, sp.handle,
           COALESCE(v.body, p.body) AS body,
           t.published_at, t.remote_url
    FROM post_targets t
    JOIN posts p ON p.id = t.post_id
    JOIN social_profiles sp ON sp.id = t.social_profile_id
    LEFT JOIN post_versions v ON v.id = t.post_version_id
    WHERE t.organization_id = ${organizationId}
      AND t.status = 'published'
      AND t.published_at > ${since}
      AND p.deleted_at IS NULL
    ORDER BY t.published_at DESC
    LIMIT ${limit}
  `;

  if (targets.length === 0) {
    return { posts: [], totals: {}, publishedCount: 0, columns: [], unmeasuredNetworks: [] };
  }

  const ids = targets.map((t) => t.target_id);

  // DISTINCT ON gives the newest reading of each field on each post. The older
  // readings stay in the table — that is what makes a restatement visible
  // later — but showing them all here would double-count every number.
  const readings = await sql<
    { post_target_id: string; source_field: string; value: string; collected_at: Date }[]
  >`
    SELECT DISTINCT ON (post_target_id, source_field)
           post_target_id, source_field, value, collected_at
    FROM metric_facts
    WHERE post_target_id = ANY(${ids})
      AND organization_id = ${organizationId}
    ORDER BY post_target_id, source_field, collected_at DESC
  `;

  const byTarget = new Map<string, { metrics: Record<string, number>; measuredAt: Date | null }>();
  for (const reading of readings) {
    const canonical = CANONICAL[reading.source_field];
    // Collected but not yet named. Kept out of the summary rather than shown
    // under its raw platform name, which would be a column nobody can read.
    if (canonical === undefined) continue;

    let entry = byTarget.get(reading.post_target_id);
    if (entry === undefined) {
      entry = { metrics: {}, measuredAt: null };
      byTarget.set(reading.post_target_id, entry);
    }
    entry.metrics[canonical] = Number(reading.value);
    if (entry.measuredAt === null || reading.collected_at > entry.measuredAt) {
      entry.measuredAt = reading.collected_at;
    }
  }

  const totals: Record<string, number> = {};
  const present = new Set<string>();
  const unmeasured = new Set<string>();

  const posts = targets.map((target) => {
    const entry = byTarget.get(target.target_id);
    const metrics = entry?.metrics ?? {};

    if (Object.keys(metrics).length === 0 && PUBLISHES_NO_METRICS.has(target.network)) {
      unmeasured.add(target.network);
    }

    let engagement = 0;
    for (const [key, value] of Object.entries(metrics)) {
      present.add(key);
      totals[key] = (totals[key] ?? 0) + value;
      engagement += value;
    }

    return {
      postId: target.post_id,
      targetId: target.target_id,
      network: target.network,
      handle: target.handle,
      body: target.body,
      publishedAt: target.published_at,
      remoteUrl: target.remote_url,
      metrics,
      measuredAt: entry?.measuredAt ?? null,
      engagement,
    };
  });

  return {
    posts,
    totals,
    publishedCount: targets.length,
    columns: DISPLAY_ORDER.filter((name) => present.has(name)),
    unmeasuredNetworks: [...unmeasured],
  };
}

export interface ReadingHistory {
  readonly field: string;
  readonly canonical: string | undefined;
  readonly value: number;
  readonly collectedAt: Date;
  readonly endpoint: string;
  readonly apiVersion: string | null;
}

/**
 * Every reading ever taken of one post, newest first.
 *
 * This is the answer to "why is last month's number different now". Without it
 * the only available response is that we do not know, and a client who hears
 * that once stops believing the next report too.
 */
export async function readingHistory(
  sql: Sql,
  organizationId: OrganizationId,
  targetId: string,
): Promise<readonly ReadingHistory[]> {
  const rows = await sql<
    {
      source_field: string;
      value: string;
      collected_at: Date;
      source_endpoint: string;
      api_version: string | null;
    }[]
  >`
    SELECT source_field, value, collected_at, source_endpoint, api_version
    FROM metric_facts
    WHERE post_target_id = ${targetId} AND organization_id = ${organizationId}
    ORDER BY collected_at DESC, source_field
    LIMIT 500
  `;

  return rows.map((row) => ({
    field: row.source_field,
    canonical: CANONICAL[row.source_field],
    value: Number(row.value),
    collectedAt: row.collected_at,
    endpoint: row.source_endpoint,
    apiVersion: row.api_version,
  }));
}
