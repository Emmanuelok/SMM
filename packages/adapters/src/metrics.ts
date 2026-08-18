import type { NetworkId } from './networks.js';

/**
 * The read surface: raw platform numbers, the vocabulary we translate them
 * into, and the verification states a published post can be found in.
 *
 * Analytics is layered deliberately. L1 is what the platform said, verbatim.
 * L2 is our canonical vocabulary, produced by mapping L1 upward. L3 is anything
 * derived — rates, growth, blended figures. Adapters live entirely at L1 and
 * return `RawMetric` values; they never map, never rename, never sum, never
 * fill a gap with a plausible substitute.
 *
 * The reason is provenance, and it is not a preference. The only moment at
 * which we know which endpoint produced a number, what the platform called the
 * field, and which API version answered, is the moment the response arrives. An
 * adapter that normalises on the way in discards all three at exactly the point
 * they existed and can never be recovered: the response is gone, and no amount
 * of later work reconstructs which of two possible fields a number came from.
 *
 * What that costs is concrete. Platforms redefine metrics without renaming
 * them — Instagram's move from "impressions" to "views" is the well-known one,
 * and it is not the last. If every stored number carries its endpoint, field
 * name and API version, a redefinition is a dated annotation on a chart and a
 * sentence in a report. If it does not, the client sees a cliff in a number
 * they have been shown every month for two years, asks what happened, and the
 * only honest answer available is that we do not know. At that point they stop
 * believing that number, then they stop believing the report, then they stop
 * believing every report we have ever sent them. Recovering from that is not a
 * data-engineering problem.
 *
 * Everything in this module is pure: types and total functions over them. No
 * I/O belongs here — these are the shapes that cross the adapter boundary.
 */

/**
 * A closed window of time a caller wants data for.
 *
 * Half-open: `from` is included, `to` is excluded. Inclusive-inclusive ranges
 * are the standard way abutting reports double-count their shared boundary —
 * a January report ending 31 Jan and a February report starting 31 Jan report
 * that day's numbers twice, and the year total then disagrees with the sum of
 * its months by twelve days.
 */
export interface DateRange {
  readonly from: Date;
  /** Exclusive. A single day is `from` = 00:00, `to` = the next 00:00. */
  readonly to: Date;
}

/**
 * One page of a cursor-paginated platform listing.
 *
 * `nextCursor` is opaque. It is the platform's own token — sometimes an offset,
 * sometimes a signed blob, sometimes a whole URL — and callers must never
 * parse it, construct one, compare two, or persist one as a stable key. Every
 * network reserves the right to change its shape, and code that reads meaning
 * out of a cursor breaks silently and stops paginating rather than erroring.
 */
export interface Page<T> {
  readonly items: readonly T[];
  /**
   * Token for the following page; absent when the listing is exhausted.
   *
   * Exhaustion is signalled by this field alone. An empty `items` does not mean
   * the end — several networks return empty pages mid-listing when the rows
   * they would have contained were filtered after paging was computed, and
   * stopping on an empty page silently truncates the result.
   */
  readonly nextCursor?: string | undefined;
}

/** What a raw metric is about. Account-level and post-level numbers are not interchangeable. */
export type MetricSubjectType = 'post' | 'profile' | 'story' | 'video' | 'link';

/**
 * What a number describes about time, which decides what may be done with it.
 *
 * Conflating these is the most common way an analytics product produces
 * confident nonsense. The three kinds are not variants of one another: each
 * supports a different set of operations, and applying the wrong one yields a
 * figure that is arithmetically clean and semantically meaningless, which is
 * the hardest kind of error to notice.
 */
export type MeasureKind =
  /**
   * A reading of a level at an instant: follower count, subscriber count.
   *
   * Snapshots may be differenced and averaged. They must never be summed.
   * Adding a follower count of 10,000 across thirty days yields 300,000, which
   * is not a quantity of anything — it is thirty readings of the same standing
   * value, and shipping it to a client as "monthly followers" is indefensible.
   */
  | 'snapshot'
  /**
   * A count of events occurring inside a bounded window: impressions on a day,
   * likes in an hour.
   *
   * The only kind that may be summed, and only across non-overlapping windows.
   * Reach is the trap here: it is reported per period but is a deduplicated
   * count of accounts, so summing daily reach counts anyone who returned on a
   * second day twice. Only the platform can deduplicate across days, so a
   * multi-day reach figure must be fetched, never computed.
   */
  | 'period'
  /**
   * A running total since some origin the platform chose: lifetime views on a
   * video, all-time post count.
   *
   * Differencing two cumulative readings gives a period figure. Summing them
   * gives a triangular number that grows with how often we happened to poll,
   * which means the same account produces a different "total" depending on our
   * collection schedule.
   */
  | 'cumulative';

/**
 * One number exactly as a platform returned it, with the provenance that makes
 * it defensible later.
 *
 * This is the adapter's entire analytics output. Note what is absent: our
 * metric names, our units, our time buckets, any arithmetic. The adapter's job
 * is to record what was said and by whom, not to decide what it means.
 */
export interface RawMetric {
  readonly subjectType: MetricSubjectType;
  /** The platform's own id for the subject, verbatim. Never our internal id. */
  readonly subjectId: string;
  /**
   * The upstream field name, character for character, including the platform's
   * own casing and typos.
   *
   * Never cleaned up. This is the join key back to `metric_definitions`, which
   * is how a report can state that this number came from a field that was
   * redefined on a given date. Tidying `plays` into `video_views` here destroys
   * that link, and the tidy name is available at L2 anyway.
   */
  readonly fieldAsReturned: string;
  readonly value: number;
  /** The exact endpoint path that produced the value. Two endpoints on the same platform routinely disagree. */
  readonly endpoint: string;
  /**
   * The API version that answered, as the platform versions itself.
   *
   * Required, not optional. A number whose API version is unknown cannot be
   * compared with confidence to a number collected after a version bump, and
   * "unversioned" is itself worth recording explicitly rather than leaving the
   * field empty and unexplained.
   */
  readonly apiVersion: string;
  readonly measureKind: MeasureKind;
  /** Start of the window, for `period` measures. Required in practice — see `measurementProblem`. */
  readonly periodStart?: Date | undefined;
  readonly periodEnd?: Date | undefined;
  /**
   * When we fetched it, which is not when it was measured.
   *
   * Platforms restate figures for days after the fact as spam filtering and
   * deduplication catch up. Keeping collection time separate from measurement
   * time is what lets us hold both readings and show a client that a number
   * moved because the platform revised it, not because we changed anything.
   */
  readonly collectedAt: Date;
}

/**
 * Whether values of this kind may be added together across time.
 *
 * Decided here, once, so that no chart, export or roll-up query re-litigates
 * it. A summing rule scattered across call sites becomes a summing rule that is
 * right in most of them.
 */
export function isAdditiveAcrossTime(kind: MeasureKind): boolean {
  return kind === 'period';
}

/**
 * The single instant this number describes, for `metric_facts.measured_at`.
 *
 * A period metric is stamped at the end of its window, because that is when the
 * count became final. The window width does not survive into that column, which
 * is precisely why `measureKind` has to be carried alongside: without it a
 * daily and an hourly figure are indistinguishable rows and get summed together.
 */
export function measuredAtOf(raw: RawMetric): Date {
  return raw.periodEnd ?? raw.periodStart ?? raw.collectedAt;
}

/**
 * Why a raw metric cannot be stored, or `undefined` if it can.
 *
 * Rejecting a malformed reading is better than storing it, because an
 * unbounded "period" value is indistinguishable from a well-formed one once it
 * is a row, and it will be summed with its neighbours by something downstream.
 * The returned string is for operators and logs, not end users.
 */
export function measurementProblem(raw: RawMetric): string | undefined {
  if (!Number.isFinite(raw.value)) {
    return `${raw.fieldAsReturned} is not a finite number`;
  }
  if (raw.measureKind === 'period') {
    if (raw.periodStart === undefined || raw.periodEnd === undefined) {
      return `${raw.fieldAsReturned} is a period measure without a bounded window`;
    }
    if (raw.periodEnd.getTime() < raw.periodStart.getTime()) {
      return `${raw.fieldAsReturned} has a window that ends before it starts`;
    }
  }
  if (raw.fieldAsReturned === '' || raw.endpoint === '' || raw.apiVersion === '') {
    return 'provenance is incomplete: field, endpoint and API version are all required';
  }
  return undefined;
}

/**
 * Our canonical metric vocabulary — the L2 names.
 *
 * These are names for things we are prepared to define and defend in front of a
 * client. Each definition below is the one that governs; where a platform's
 * field means something narrower or wider, the honest outcome is that it does
 * not map, not that we stretch the definition to make a chart look complete.
 *
 * None of these are comparable across networks by default. Two platforms both
 * returning "impressions" are counting different events under different
 * thresholds, and a cross-network total is a number with no referent. Comparing
 * within one network is only safe between definition changes, which is what
 * `metric_definitions` records.
 */
export type CanonicalMetricKey =
  /**
   * Times the content was rendered, including repeat views by the same account.
   * A count of renderings, never of people. The threshold that makes a
   * rendering count — pixels on screen, milliseconds visible — is set by the
   * platform and varies between them.
   */
  | 'impressions'
  /**
   * Distinct accounts that saw the content at least once, deduplicated by the
   * platform over the platform's own window. Never summed across periods: the
   * same account returning on a second day would be counted twice, and only the
   * platform holds the identity data needed to deduplicate. A multi-day reach
   * figure must be fetched for that span, not assembled from daily ones.
   */
  | 'reach'
  /**
   * The primary approval action: like, favourite, heart, upvote.
   * Where a network exposes several reaction types, collapsing them into this
   * key is a decision that must be recorded in the definition, because a
   * collapsed "likes" is a strictly larger number than the pre-collapse one and
   * the step change will otherwise read as growth.
   */
  | 'likes'
  /**
   * Replies on the content, top-level and threaded where the platform counts
   * them together. This metric legitimately decreases: deleted, hidden and
   * moderated comments drop out retroactively, so anything treating it as
   * monotonic will report negative growth as a bug.
   */
  | 'comments'
  /**
   * Redistributions of the content into another feed: shares, reposts,
   * retweets, share-to-story. Excludes copy-link sharing, which no platform API
   * reports and which is a large fraction of real sharing — this number is a
   * floor, not a total.
   */
  | 'shares'
  /**
   * Private bookmarks. Only some networks report it, and where they do it is
   * often the strongest available signal of usefulness, because it costs the
   * viewer something and is invisible to their followers.
   */
  | 'saves'
  /**
   * Clicks on the content as counted by the platform. Networks disagree
   * sharply about what counts: some include profile taps, caption expansion
   * and carousel swipes, others count outbound link clicks only.
   * Never reconciled against our own redirect counts as though they were the
   * same measurement — ours are server-side and bot-filtered, theirs are
   * neither, and presenting the two as one metric guarantees a discrepancy we
   * cannot explain.
   */
  | 'clicks'
  /**
   * Views counted under the network's own threshold — three seconds here, one
   * second there, thirty seconds or a completed watch elsewhere. The least
   * comparable metric in this list, both across networks and across time on a
   * single network, and the one most often redefined.
   */
  | 'video_views'
  /**
   * Audience size at the instant of reading. Always a snapshot. Growth is the
   * difference between two snapshots and is computed at L3, never stored here
   * as though the platform had reported it.
   */
  | 'followers'
  /** Visits to the account's profile page, as distinct from views of any post on it. */
  | 'profile_views'
  /**
   * Engagement as a proportion. Derived at L3 and never accepted from a
   * platform field unless its denominator is known to match ours: the same
   * interactions over reach, over impressions, over followers, or over
   * followers-reached differ by an order of magnitude. A rate without its named
   * denominator attached is not a metric, it is a number with a percent sign.
   */
  | 'engagement_rate';

/**
 * Presence map for the canonical keys.
 *
 * Exists so that adding a key to the union without adding it here fails the
 * build. The alternative — a hand-maintained array — silently omits new keys
 * from validation, and the symptom is rows that pass through normalisation and
 * then fail to render months later.
 */
const CANONICAL_KEY_PRESENCE: Readonly<Record<CanonicalMetricKey, true>> = {
  impressions: true,
  reach: true,
  likes: true,
  comments: true,
  shares: true,
  saves: true,
  clicks: true,
  video_views: true,
  followers: true,
  profile_views: true,
  engagement_rate: true,
};

/** Every canonical metric key. */
export const CANONICAL_METRIC_KEYS = Object.keys(
  CANONICAL_KEY_PRESENCE,
) as readonly CanonicalMetricKey[];

/**
 * Narrow a string to a canonical key.
 *
 * `metric_facts.metric_key` is a text column, not an enum, so every row read
 * back is an untrusted string as far as the type system is concerned. Without a
 * guard at that boundary a typo written by one code path becomes a metric that
 * exists in the database and in no chart.
 */
export function isCanonicalMetricKey(value: string): value is CanonicalMetricKey {
  return Object.hasOwn(CANONICAL_KEY_PRESENCE, value);
}

/**
 * A pure mapping from one platform field to our vocabulary.
 *
 * Returns `undefined` when the platform has no faithful equivalent, and that is
 * the correct, expected outcome for a large share of fields. Omitting a metric
 * leaves a visible gap that someone can ask about; inventing an approximation
 * produces a plausible number that nobody questions, that is quietly wrong in
 * one direction, and that gets compared month over month, put in a deck, and
 * used to justify spend. A missing number costs a conversation. A confident
 * wrong number costs the client's judgement, and by the time anyone checks it
 * has been wrong for a year.
 *
 * Concretely: a platform that reports "profile visits including visits from
 * ads" does not map to `profile_views`; a "plays" count with a zero-second
 * threshold does not map to `video_views`; an engagement rate over an unknown
 * denominator does not map to `engagement_rate`. Each of those maps to
 * `undefined`, and the platform's field survives untouched at L1 for the day we
 * learn what it actually means.
 *
 * Implementations must be total, deterministic and free of I/O — the same raw
 * metric must map to the same key forever, because a mapping that changes
 * silently reclassifies history.
 */
export type MetricNormalization = (raw: RawMetric) => CanonicalMetricKey | undefined;

/**
 * A raw metric that has been mapped to our vocabulary, shaped for one
 * `metric_facts` row.
 *
 * Provenance travels with the value rather than being looked up later. The
 * organisation, profile and target ids are supplied by the caller, which is the
 * only layer that knows them.
 */
export interface NormalizedMetric {
  /** `metric_facts.metric_key`. */
  readonly metricKey: CanonicalMetricKey;
  /** `metric_facts.value`. */
  readonly value: number;
  /** `metric_facts.measured_at` — the instant described, not the instant fetched. */
  readonly measuredAt: Date;
  /** `metric_facts.collected_at`. */
  readonly collectedAt: Date;
  /** `metric_facts.source_endpoint`. */
  readonly sourceEndpoint: string;
  /** `metric_facts.source_field` — still the upstream name, not ours. */
  readonly sourceField: string;
  /** `metric_facts.api_version`. */
  readonly apiVersion: string;
  /**
   * Carried alongside the row because migration 0002 has no column for it, and
   * the value is unusable without it: a stored number gives no indication of
   * whether it may be summed. Until `metric_facts` gains the column, callers
   * must persist this in `raw_value` rather than drop it — a fact table whose
   * rows cannot say whether they are addable will eventually be added up.
   */
  readonly measureKind: MeasureKind;
}

/**
 * Apply a normalisation to one raw metric.
 *
 * Returns `undefined` when the mapping declines the field or the reading is
 * malformed. Both are ordinary outcomes on every collection run and neither is
 * an error condition; a run that maps every field it received is more likely to
 * have a permissive mapping than a complete one.
 */
export function normalizeMetric(
  raw: RawMetric,
  normalization: MetricNormalization,
): NormalizedMetric | undefined {
  if (measurementProblem(raw) !== undefined) return undefined;

  const metricKey = normalization(raw);
  if (metricKey === undefined) return undefined;

  return {
    metricKey,
    value: raw.value,
    measuredAt: measuredAtOf(raw),
    collectedAt: raw.collectedAt,
    sourceEndpoint: raw.endpoint,
    sourceField: raw.fieldAsReturned,
    apiVersion: raw.apiVersion,
    measureKind: raw.measureKind,
  };
}

/**
 * What one platform field meant, and over which dates, mirroring one
 * `metric_definitions` row.
 *
 * This is the record a raw metric's `fieldAsReturned`, `endpoint` and
 * `apiVersion` point at. It is what turns a step change in a chart from an
 * apparent data error into an annotated, dated fact with a source link
 * attached.
 */
export interface MetricDefinition {
  readonly network: NetworkId;
  readonly metricKey: CanonicalMetricKey;
  /** The upstream field this definition describes, verbatim. */
  readonly sourceField: string;
  readonly apiVersion?: string | undefined;
  /** What the platform counts, in plain language, as documented at the time. */
  readonly definition: string;
  readonly effectiveFrom: Date;
  /** Absent means current. */
  readonly effectiveTo?: Date | undefined;
  /** Where the wording came from, so it can be re-checked when it changes again. */
  readonly sourceUrl?: string | undefined;
}

/**
 * The definition in force for a field on a given date.
 *
 * Looked up by date rather than by "latest", because a report about March must
 * be annotated with what the metric meant in March. Using the current
 * definition to describe historical numbers is how a report ends up confidently
 * describing figures that were collected under different rules.
 */
export function definitionInEffect(
  definitions: readonly MetricDefinition[],
  sourceField: string,
  on: Date,
): MetricDefinition | undefined {
  const at = on.getTime();
  return definitions.find(
    (d) =>
      d.sourceField === sourceField &&
      d.effectiveFrom.getTime() <= at &&
      (d.effectiveTo === undefined || d.effectiveTo.getTime() > at),
  );
}

/**
 * Dates within the range at which a field's definition changed.
 *
 * A delta that spans one of these is not a like-for-like comparison and must be
 * badged as such wherever it is shown. Reporting a 40% drop without mentioning
 * that the platform changed what it was counting halfway through is how a
 * client concludes their campaign failed when nothing about it changed.
 */
export function definitionChangesWithin(
  definitions: readonly MetricDefinition[],
  sourceField: string,
  range: DateRange,
): readonly Date[] {
  const from = range.from.getTime();
  const to = range.to.getTime();
  return definitions
    .filter((d) => d.sourceField === sourceField)
    .map((d) => d.effectiveFrom)
    .filter((start) => start.getTime() > from && start.getTime() < to)
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * What a read-back found when it looked for a post we believe we published.
 *
 * A 200 response at publish time is not evidence that a post is live. Networks
 * accept a post and then remove it, restrict its distribution without telling
 * anyone, or fail to finish transcoding hours later. Reading it back is the
 * only way to report what is actually on the account rather than what we sent.
 */
export type PostVisibility =
  /** Found, publicly visible, as published. */
  | { readonly state: 'live' }
  /**
   * Gone. `by` and `category` are populated only where the network says so —
   * they are frequently unknown, and guessing at who removed a client's post is
   * an accusation, not a datum.
   */
  | {
      readonly state: 'removed';
      readonly by?: string | undefined;
      readonly category?: string | undefined;
    }
  /**
   * Present but limited: age-gated, geo-blocked, demoted, excluded from
   * recommendations. The distinction from `live` matters because engagement
   * will be far below normal and the cause is not the content's quality.
   */
  | { readonly state: 'restricted'; readonly detail: string }
  /**
   * We cannot tell. The network offers no read-back path, the token lacks the
   * scope, or the endpoint is down.
   *
   * This has to be its own state, and it must never be collapsed into `live` on
   * the reasoning that we have no evidence of a problem. Several networks
   * expose no way to read a post back at all, so "no evidence of a problem" is
   * their permanent condition, and reporting those posts as verified-live would
   * mean the verification badge is decoration on exactly the networks where it
   * is most needed. Telling a client we do not know is a small, survivable
   * admission. Telling them a post is live when it was taken down a week ago,
   * and being found out, is not.
   */
  | { readonly state: 'unavailable'; readonly reason: string };

/** The `publish_verifications.outcome` values, which are narrower than `PostVisibility`. */
export type VerificationOutcome = 'present' | 'missing' | 'altered' | 'unavailable';

/**
 * Reduce a read-back to the column value.
 *
 * The mapping is lossy by design — the column records the outcome, and the
 * detail that justified it belongs in `publish_verifications.detail` where it
 * stays readable. `restricted` maps to `altered` because the post exists but is
 * not what we published in the sense that matters: its audience.
 */
export function verificationOutcomeOf(visibility: PostVisibility): VerificationOutcome {
  switch (visibility.state) {
    case 'live':
      return 'present';
    case 'removed':
      return 'missing';
    case 'restricted':
      return 'altered';
    case 'unavailable':
      return 'unavailable';
  }
}

/**
 * Whether a read-back confirms the post is where we said it is.
 *
 * `unavailable` answers `false`. An unverified post is not a verified one, and
 * a helper that treats "we could not check" as success would put the
 * distinction back exactly where the type was written to remove it.
 */
export function isConfirmedLive(visibility: PostVisibility): boolean {
  return visibility.state === 'live';
}
