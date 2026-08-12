import {
  NEAR_DUPLICATE_THRESHOLD,
  extractHashtags,
  measureText,
  similarity,
  truncateToLimit,
} from '@smm/shared';

import type { PostTargetId, SocialProfileId } from '@smm/shared';

import type { FormatCapability, ImageSpec, PlatformCapabilities, VideoSpec } from './capabilities.js';
import { formatCapability } from './capabilities.js';
import type { DestinationId, HealthReport } from './connection.js';
import { isPublishable } from './connection.js';
import type { MediaRef, ResolvedTarget } from './content.js';
import type {
  DestinationRule,
  DestinationRuleViolation,
  DestinationSelections,
  DestinationTarget,
} from './destinations.js';
import { validateAgainstRules } from './destinations.js';

/**
 * Pre-flight validation, in two layers.
 *
 * `validateTarget` is the static layer: one resolved target against one
 * network's declared capabilities, pure, synchronous, no I/O. It runs in the
 * composer on a keystroke, which is why it must stay that way.
 *
 * `validateWithContext` is the layer that knows about the world — this
 * connection's health, this destination's live rules, what this account has
 * published lately, and how much publish budget is left. Everything it checks
 * is something the static layer structurally cannot know, and something that
 * otherwise surfaces as a failed publish at 02:00 on a date the customer chose,
 * with nobody watching.
 *
 * Catching a violation here turns a silent 2am failure into an inline warning
 * while the user is still looking at the post, which is the single
 * highest-leverage reliability feature a scheduling tool has.
 *
 * ── On the import of `destinations.js` ───────────────────────────────────────
 *
 * `destinations.ts` imports `IssueCode`, `IssueSeverity` and `ValidationIssue`
 * from this module, and this module imports `validateAgainstRules` from it. The
 * direction that closes the loop is type-only and erases under
 * `verbatimModuleSyntax`, so there is no module-load cycle at runtime — the
 * same arrangement `content.ts` and `variants.ts` already document.
 */

export type IssueSeverity =
  /** Publishing will fail. Blocks scheduling. */
  | 'error'
  /** Publishing will succeed but the result is degraded. */
  | 'warning'
  /** Worth knowing; no action required. */
  | 'info';

export type IssueCode =
  | 'format_unsupported'
  | 'delivery_is_reminder'
  | 'text_required'
  | 'text_too_long'
  | 'title_too_long'
  | 'too_many_hashtags'
  | 'links_not_clickable'
  | 'media_required'
  | 'too_many_media'
  | 'mixed_media_not_allowed'
  | 'media_type_unsupported'
  | 'media_too_large'
  | 'media_format_unsupported'
  | 'image_dimensions_invalid'
  | 'image_aspect_ratio_invalid'
  | 'video_too_long'
  | 'video_too_short'
  | 'video_dimensions_invalid'
  | 'video_aspect_ratio_invalid'
  | 'missing_alt_text'
  | 'feature_unsupported'
  /* ── Context-dependent codes. Only `validateWithContext` produces these. ── */
  /**
   * Close enough to something this account published or queued recently that a
   * platform is likely to refuse it. Always a warning — see `findDuplicate`
   * for why this must never block on its own.
   */
  | 'near_duplicate_content'
  /**
   * The connection cannot publish in its current state: revoked, expired,
   * missing a scope, or the account is restricted.
   */
  | 'connection_not_ready'
  /**
   * No publishing headroom left — the 24-hour cap, the minimum interval between
   * posts, or a shared developer app's daily unit budget.
   *
   * Distinct from the upgrade spec's `quota_breach_in_calendar`, which is a
   * simulation of a whole calendar against every cap and belongs to the
   * scheduler. This one is about the single post in front of the user, now.
   */
  | 'quota_exhausted'
  /** A per-write charge would take the tenant past their own spend cap. */
  | 'cost_exceeds_cap';

/*
 * The upgrade spec also names `destination_rule_violation`. It is deliberately
 * not here: `destinations.ts` maps every breached rule onto the existing codes
 * (see `codeFor` there) so that a flair requirement and a caption limit light
 * up the same part of the composer, and carries the specifics in the
 * violation's `rule` and `remediation` fields instead. A second code for the
 * same class of issue would split the UI's handling of it in two.
 */

/**
 * A fix the system can apply on the user's behalf.
 *
 * Offered rather than applied silently: quietly rewriting someone's copy is a
 * worse failure than telling them it is too long.
 */
export type AutoFix =
  | { readonly kind: 'truncate_body'; readonly body: string }
  | { readonly kind: 'drop_media'; readonly keepCount: number }
  | { readonly kind: 'switch_delivery'; readonly to: 'reminder' };

export interface ValidationIssue {
  readonly code: IssueCode;
  readonly severity: IssueSeverity;
  /** Written for the end user, naming the network and the concrete limit. */
  readonly message: string;
  /** Which part of the draft is at fault, for inline display. */
  readonly field?: 'body' | 'title' | 'media' | 'poll' | 'format' | undefined;
  /** Index into `media`, when the issue concerns one asset. */
  readonly mediaIndex?: number | undefined;
  readonly autoFix?: AutoFix | undefined;
}

export interface ValidationReport {
  readonly issues: readonly ValidationIssue[];
  /** True when nothing blocks publishing. Warnings do not block. */
  readonly publishable: boolean;
  /** How this post will actually be delivered, after degradation. */
  readonly delivery: 'auto' | 'reminder' | 'blocked';
}

function issue(
  code: IssueCode,
  severity: IssueSeverity,
  message: string,
  extra: Omit<ValidationIssue, 'code' | 'severity' | 'message'> = {},
): ValidationIssue {
  return { code, severity, message, ...extra };
}

function aspectRatio(media: MediaRef): number | undefined {
  if (media.width === undefined || media.height === undefined) return undefined;
  if (media.height === 0) return undefined;
  return media.width / media.height;
}

function round(value: number): string {
  return value.toFixed(2);
}

function validateImage(
  media: MediaRef,
  index: number,
  spec: ImageSpec,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (media.bytes > spec.maxBytes) {
    issues.push(
      issue(
        'media_too_large',
        'error',
        `Image is ${(media.bytes / 1_048_576).toFixed(1)} MB; ${network} allows up to ${(spec.maxBytes / 1_048_576).toFixed(0)} MB.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  if (!spec.mimeTypes.includes(media.mimeType)) {
    issues.push(
      issue(
        'media_format_unsupported',
        'error',
        `${network} does not accept ${media.mimeType}. Supported: ${spec.mimeTypes.join(', ')}.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  const { width, height } = media;
  if (width !== undefined && height !== undefined) {
    if (width < spec.minWidth || height < spec.minHeight) {
      issues.push(
        issue(
          'image_dimensions_invalid',
          'error',
          `Image is ${width}x${height}; ${network} requires at least ${spec.minWidth}x${spec.minHeight}.`,
          { field: 'media', mediaIndex: index },
        ),
      );
    } else if (width > spec.maxWidth || height > spec.maxHeight) {
      // Oversized images are downscaled by most networks rather than rejected.
      issues.push(
        issue(
          'image_dimensions_invalid',
          'warning',
          `Image is ${width}x${height}; ${network} will downscale it to fit ${spec.maxWidth}x${spec.maxHeight}.`,
          { field: 'media', mediaIndex: index },
        ),
      );
    }

    const ratio = aspectRatio(media);
    if (ratio !== undefined && (ratio < spec.minAspectRatio || ratio > spec.maxAspectRatio)) {
      issues.push(
        issue(
          'image_aspect_ratio_invalid',
          'error',
          `Image aspect ratio ${round(ratio)}:1 is outside the ${round(spec.minAspectRatio)}:1 to ${round(spec.maxAspectRatio)}:1 range ${network} accepts. It will be cropped or rejected.`,
          { field: 'media', mediaIndex: index },
        ),
      );
    }
  }

  return issues;
}

function validateVideo(
  media: MediaRef,
  index: number,
  spec: VideoSpec,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (media.bytes > spec.maxBytes) {
    issues.push(
      issue(
        'media_too_large',
        'error',
        `Video is ${(media.bytes / 1_048_576).toFixed(0)} MB; ${network} allows up to ${(spec.maxBytes / 1_048_576).toFixed(0)} MB.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  if (!spec.mimeTypes.includes(media.mimeType)) {
    issues.push(
      issue(
        'media_format_unsupported',
        'error',
        `${network} does not accept ${media.mimeType}. Supported: ${spec.mimeTypes.join(', ')}.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  const duration = media.durationSec;
  if (duration !== undefined) {
    if (duration > spec.maxDurationSec) {
      issues.push(
        issue(
          'video_too_long',
          'error',
          `Video is ${Math.round(duration)}s; ${network} allows up to ${spec.maxDurationSec}s.`,
          { field: 'media', mediaIndex: index },
        ),
      );
    }
    if (duration < spec.minDurationSec) {
      issues.push(
        issue(
          'video_too_short',
          'error',
          `Video is ${Math.round(duration)}s; ${network} requires at least ${spec.minDurationSec}s.`,
          { field: 'media', mediaIndex: index },
        ),
      );
    }
  }

  // Minimum resolution is declared by every VideoSpec and populated by the
  // registry — YouTube at 256x144, X at 32x32 — but was going unchecked, so an
  // under-sized upload sailed through validation and was rejected at publish.
  const { width, height } = media;
  if (width !== undefined && height !== undefined && (width < spec.minWidth || height < spec.minHeight)) {
    issues.push(
      issue(
        'video_dimensions_invalid',
        'error',
        `Video is ${width}x${height}; ${network} requires at least ${spec.minWidth}x${spec.minHeight}.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  const ratio = aspectRatio(media);
  if (ratio !== undefined && (ratio < spec.minAspectRatio || ratio > spec.maxAspectRatio)) {
    issues.push(
      issue(
        'video_aspect_ratio_invalid',
        'error',
        `Video aspect ratio ${round(ratio)}:1 is outside the ${round(spec.minAspectRatio)}:1 to ${round(spec.maxAspectRatio)}:1 range ${network} accepts.`,
        { field: 'media', mediaIndex: index },
      ),
    );
  }

  return issues;
}

function validateText(
  target: ResolvedTarget,
  cap: FormatCapability,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { text } = cap;

  const length = measureText(target.body, text.counting);

  if (text.required && target.body.trim() === '') {
    issues.push(
      issue('text_required', 'error', `${network} requires text for this post type.`, {
        field: 'body',
      }),
    );
  }

  if (length > text.maxLength) {
    const note =
      text.counting.kind === 'x-weighted'
        ? ` (${network} counts CJK characters and emoji as two, and every link as ${text.counting.urlWeight})`
        : '';
    issues.push(
      issue(
        'text_too_long',
        'error',
        `Text is ${length} of ${text.maxLength} characters allowed on ${network}${note}.`,
        {
          field: 'body',
          autoFix: {
            kind: 'truncate_body',
            body: truncateToLimit(target.body, text.maxLength, text.counting, '…'),
          },
        },
      ),
    );
  }

  if (target.title !== undefined && target.title !== '') {
    if (text.maxTitleLength === undefined) {
      issues.push(
        issue('feature_unsupported', 'warning', `${network} has no title field; it will be ignored.`, {
          field: 'title',
        }),
      );
    } else if (measureText(target.title, text.counting) > text.maxTitleLength) {
      issues.push(
        issue(
          'title_too_long',
          'error',
          `Title exceeds the ${text.maxTitleLength} characters ${network} allows.`,
          { field: 'title' },
        ),
      );
    }
  }

  if (text.maxHashtags !== undefined) {
    const count = extractHashtags(target.body).length;
    if (count > text.maxHashtags) {
      issues.push(
        issue(
          'too_many_hashtags',
          'error',
          `${count} hashtags; ${network} allows at most ${text.maxHashtags}.`,
          { field: 'body' },
        ),
      );
    }
  }

  if (!text.linksClickable && target.link !== undefined) {
    issues.push(
      issue(
        'links_not_clickable',
        'warning',
        `Links are not clickable on ${network} for this post type — consider directing people to your bio link instead.`,
        { field: 'body' },
      ),
    );
  }

  return issues;
}

function validateMedia(
  target: ResolvedTarget,
  cap: FormatCapability,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { media: mediaCap } = cap;
  const media = target.media;

  if (media.length < mediaCap.minCount) {
    issues.push(
      issue(
        'media_required',
        'error',
        `This post type needs at least ${mediaCap.minCount} attachment${mediaCap.minCount === 1 ? '' : 's'} on ${network}.`,
        { field: 'media' },
      ),
    );
  }

  if (media.length > mediaCap.maxCount) {
    issues.push(
      issue(
        'too_many_media',
        'error',
        `${media.length} attachments; ${network} allows ${mediaCap.maxCount}.`,
        {
          field: 'media',
          autoFix: { kind: 'drop_media', keepCount: mediaCap.maxCount },
        },
      ),
    );
  }

  const kinds = new Set(media.map((m) => (m.kind === 'gif' ? 'image' : m.kind)));
  if (!mediaCap.mixedTypesAllowed && kinds.size > 1) {
    issues.push(
      issue(
        'mixed_media_not_allowed',
        'error',
        `${network} cannot mix images and video in one post.`,
        { field: 'media' },
      ),
    );
  }

  media.forEach((m, i) => {
    if (m.kind === 'image' || m.kind === 'gif') {
      if (mediaCap.image === undefined) {
        issues.push(
          issue('media_type_unsupported', 'error', `${network} does not accept images here.`, {
            field: 'media',
            mediaIndex: i,
          }),
        );
      } else {
        issues.push(...validateImage(m, i, mediaCap.image, network));
      }
    } else if (m.kind === 'video') {
      if (mediaCap.video === undefined) {
        issues.push(
          issue('media_type_unsupported', 'error', `${network} does not accept video here.`, {
            field: 'media',
            mediaIndex: i,
          }),
        );
      } else {
        issues.push(...validateVideo(m, i, mediaCap.video, network));
      }
    } else {
      // Documents and audio reached this point unchecked, so a 999 MB archive
      // attached to an image post validated cleanly. No capability descriptor
      // declares specs for them yet, and a kind we cannot check is a kind we
      // cannot promise will publish — saying so is better than staying silent
      // and failing later.
      issues.push(
        issue(
          'media_type_unsupported',
          'error',
          `${network} does not accept ${m.kind} attachments on this post type.`,
          { field: 'media', mediaIndex: i },
        ),
      );
    }

    // Alt text is never required by a platform, but omitting it excludes
    // users of screen readers, so it is always worth surfacing.
    if (
      (m.kind === 'image' || m.kind === 'gif') &&
      cap.features.includes('alt_text') &&
      (m.altText === undefined || m.altText.trim() === '')
    ) {
      issues.push(
        issue('missing_alt_text', 'warning', `Image has no alt text. ${network} supports it.`, {
          field: 'media',
          mediaIndex: i,
        }),
      );
    }
  });

  return issues;
}

function validateFeatures(
  target: ResolvedTarget,
  cap: FormatCapability,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (target.firstComment !== undefined && !cap.features.includes('first_comment')) {
    issues.push(
      issue(
        'feature_unsupported',
        'warning',
        `${network} cannot auto-post a first comment; it will be skipped.`,
      ),
    );
  }

  if (
    target.collaborators !== undefined &&
    target.collaborators.length > 0 &&
    !cap.features.includes('collaborator_tag')
  ) {
    issues.push(
      issue('feature_unsupported', 'warning', `${network} does not support collaborator tags.`),
    );
  }

  if (target.locationRemoteId !== undefined && !cap.features.includes('location_tag')) {
    issues.push(
      issue('feature_unsupported', 'warning', `${network} does not support location tagging here.`),
    );
  }

  // A poll the network cannot post is only an error when there is no fallback.
  // Where reminder delivery can carry it, the trigger handles it instead.
  const pollFallsBackToReminder = (cap.reminderTriggers ?? []).includes('poll_attached');
  if (target.poll !== undefined && !cap.features.includes('poll') && !pollFallsBackToReminder) {
    issues.push(issue('feature_unsupported', 'error', `${network} does not support polls.`, {
      field: 'poll',
    }));
  }

  return issues;
}

/**
 * Which of this network's reminder triggers this particular post trips.
 *
 * Returns user-facing explanations rather than trigger names, because the
 * message is the whole value: "add the link sticker yourself" is actionable,
 * "any_sticker" is not.
 */
function reminderTriggersFor(
  target: ResolvedTarget,
  cap: FormatCapability,
  network: string,
): string[] {
  const triggers = cap.reminderTriggers ?? [];
  const reasons: string[] = [];

  if (
    triggers.includes('any_sticker') &&
    target.stickers !== undefined &&
    target.stickers.length > 0
  ) {
    const kinds = [...new Set(target.stickers.map((s) => s.kind))].join(', ');
    reasons.push(
      `${network} has no API for stickers (${kinds}), so this post will be sent to you as a reminder to publish by hand.`,
    );
  }

  if (triggers.includes('native_audio') && target.nativeAudio !== undefined) {
    reasons.push(
      `${network} does not open its audio library to other apps, so a post using a track from it has to be published in the app. Mixing the audio into the video file instead lets it publish automatically.`,
    );
  }

  if (triggers.includes('poll_attached') && target.poll !== undefined) {
    reasons.push(`${network} has no API for polls, so this post needs to be published by hand.`);
  }

  return reasons;
}

/**
 * Validate one resolved target against its network's capabilities.
 *
 * Every violation is collected rather than failing on the first, so the user
 * fixes everything in one pass instead of playing whack-a-mole.
 */
export function validateTarget(
  target: ResolvedTarget,
  caps: PlatformCapabilities,
  networkName = caps.network,
): ValidationReport {
  const cap = formatCapability(caps, target.format);

  if (cap === undefined || cap.delivery === 'unsupported') {
    return {
      issues: [
        issue(
          'format_unsupported',
          'error',
          `${networkName} does not support ${target.format} posts.`,
          { field: 'format' },
        ),
      ],
      publishable: false,
      delivery: 'blocked',
    };
  }

  const issues: ValidationIssue[] = [
    ...validateText(target, cap, networkName),
    ...validateMedia(target, cap, networkName),
    ...validateFeatures(target, cap, networkName),
  ];

  const forced = reminderTriggersFor(target, cap, networkName);
  const effectiveDelivery: 'auto' | 'reminder' =
    cap.delivery === 'reminder' || forced.length > 0 ? 'reminder' : 'auto';

  if (effectiveDelivery === 'reminder') {
    const explanation =
      forced.length > 0
        ? forced.join(' ')
        : (cap.limitationNote ??
          `${networkName} cannot publish this automatically. You will get a reminder to post it at the scheduled time.`);
    issues.unshift(
      issue('delivery_is_reminder', 'info', explanation, {
        field: 'format',
        autoFix: { kind: 'switch_delivery', to: 'reminder' },
      }),
    );
  }

  const blocked = issues.some((i) => i.severity === 'error');

  return {
    issues,
    publishable: !blocked,
    delivery: blocked ? 'blocked' : effectiveDelivery,
  };
}

/* -------------------------------------------------------------------------- */
/* The context that makes pre-flight real                                      */
/* -------------------------------------------------------------------------- */

/**
 * One post this account already published or has queued, reduced to the parts
 * duplicate detection needs.
 *
 * Bodies rather than content hashes, because the check is for *near*
 * duplicates. A recycled evergreen post with a rotated hashtag block and a
 * fresh UTM parameter hashes differently and reads identically, and it is the
 * second property the platforms act on.
 */
export interface RecentPost {
  readonly targetId: PostTargetId;
  readonly body: string;
  /** When it went out, or when it is due to. Both count against a platform's window. */
  readonly at: Date;
  /**
   * Which profile it belongs to, where the caller knows.
   *
   * Only used to say "queued on 6 profiles" rather than "6 posts", which is the
   * difference between a user recognising their own cross-post and wondering
   * what the tool is talking about.
   */
  readonly profileId?: SocialProfileId | undefined;
}

/**
 * What the similarity index found, in a form the composer can show.
 *
 * The threshold travels with the score deliberately. A bare "94% similar" is
 * not actionable — the user cannot tell whether that is close to the line or
 * far past it — and the threshold is tunable per network, so hardcoding it into
 * the message would put a number in the UI that disagrees with the one the
 * check actually used.
 */
export interface DuplicateFinding {
  /** 0 to 1, from `similarity`. */
  readonly score: number;
  /** The score at or above which this was reported. */
  readonly threshold: number;
  /** Every recent post that scored at or above the threshold. */
  readonly conflictingTargets: readonly PostTargetId[];
  readonly windowHours: number;
  readonly message: string;
}

/**
 * Remaining publish headroom at all three levels that can independently run out.
 *
 * Three, not one, because they fail for different reasons and are fixed by
 * different people. The account cap is the customer's own posting volume. The
 * app budget is shared with every other tenant on our developer app, so one
 * customer backfilling a large channel can exhaust it for people who did
 * nothing — which is the entire argument for bring-your-own-app. The spend cap
 * is the tenant's own money on the networks that charge per write.
 *
 * Every field is optional because most networks impose none of them, and an
 * absent field means "no known limit", never "zero left".
 */
export interface QuotaHeadroom {
  /** Posts left against the network's rolling 24-hour cap for this account. */
  readonly postsRemainingIn24h?: number | undefined;
  /** Earliest moment the network's minimum interval permits another post. */
  readonly nextAllowedAt?: Date | undefined;
  /**
   * Units left in the developer app's periodic budget — YouTube's daily units,
   * a shared app's per-project ceiling. Pooled across tenants on a shared app.
   */
  readonly appUnitsRemaining?: number | undefined;
  /** Headroom under the tenant's own spend cap, for networks that charge per post. */
  readonly tenantSpendRemainingUsd?: number | undefined;
}

/**
 * The destination this draft is aimed at, together with the rules fetched from
 * it and the user's answers to them.
 *
 * All three travel as one object because none of them is checkable alone: a
 * rule set can only be validated against the destination it was fetched for
 * (`validateAgainstRules` asserts exactly that), and a mandatory-flair rule is
 * only satisfied or breached relative to what the user chose.
 */
export interface DestinationContext {
  readonly destinationId: DestinationId;
  readonly rules: readonly DestinationRule[];
  readonly selections?: DestinationSelections | undefined;
}

/**
 * Everything `validateWithContext` needs that a static descriptor cannot supply.
 *
 * `now` is a parameter rather than a call to `Date.now()` inside, for the usual
 * reason and one specific one: validation runs both in the composer and again
 * from the scheduler against a post due later, and the answer to "is there
 * headroom" and "is this within the duplicate window" is different at those two
 * instants. A function that reads the clock itself cannot be asked about the
 * second one, and cannot be tested at all.
 *
 * The upgrade spec's context additionally names link probing, rights state,
 * rendition readiness, voice adherence, calendar simulation and a cost
 * estimate. Those are deliberately absent until the modules that own them
 * exist. A field declared here and never populated is worse than a missing
 * one: the composer would read it as "checked and fine", which is a claim we
 * would not be entitled to make.
 */
export interface ValidationContext {
  readonly now: Date;
  /**
   * The most recent read-only probe of the connection.
   *
   * Required, not optional. An absent health report and a healthy one are
   * indistinguishable at the call site once the field is optional, and the
   * whole point of `HealthStatus.unknown` is that assuming health from a check
   * that did not happen is how a dead connection stays green for a week.
   */
  readonly connectionHealth: HealthReport;
  readonly quota: QuotaHeadroom;
  readonly destination?: DestinationContext | undefined;
  /**
   * Recent bodies to compare against. Callers should supply the window the
   * platform is believed to care about; anything outside `duplicateWindowHours`
   * is ignored here anyway.
   */
  readonly recentPosts?: readonly RecentPost[] | undefined;
  /** Overrides `NEAR_DUPLICATE_THRESHOLD`, for a network known to be stricter. */
  readonly duplicateThreshold?: number | undefined;
  readonly duplicateWindowHours?: number | undefined;
}

/**
 * A report that also carries the structured duplicate finding.
 *
 * Extends `ValidationReport` rather than replacing it, so a contextual report
 * is assignable everywhere a static one is and nothing downstream has to know
 * which layer produced it. The finding is surfaced separately as well as in an
 * issue because the composer renders the score and the conflicting posts, and
 * re-parsing them out of a sentence is not a design.
 */
export interface ContextualValidationReport extends ValidationReport {
  readonly duplicate?: DuplicateFinding | undefined;
  /** Destination rule breaches, also merged into `issues`. */
  readonly ruleViolations: readonly DestinationRuleViolation[];
}

/**
 * How far back to look for duplicates by default.
 *
 * Three days. The platforms publish nothing about their windows, and this is
 * set from the behaviour people actually hit: the same post going out to
 * several profiles across a couple of days, and a queue refilled from a small
 * library. Longer would flag a quarterly evergreen repost, which is a
 * deliberate act and a legitimate one.
 */
export const DEFAULT_DUPLICATE_WINDOW_HOURS = 72;

/**
 * How old a health report may be before it is worth mentioning.
 *
 * A day. Shorter would nag on every post for accounts probed on a nightly
 * sweep, which is the normal cadence; longer and a token revoked on Monday is
 * still being reported as healthy on Thursday.
 */
export const HEALTH_REPORT_STALE_AFTER_HOURS = 24;

const MS_PER_HOUR = 3_600_000;

/**
 * Turn the connection's health into issues the person composing can act on.
 *
 * The error/no-error split is delegated to `isPublishable` rather than decided
 * again here. That function is the one place that states which statuses may
 * publish, and a second opinion in the validator would eventually disagree with
 * the publisher — which shows up as the composer blocking posts the pipeline
 * would have sent, or clearing posts it then refuses.
 *
 * `unknown` therefore blocks, and that is intentional despite looking harsh: an
 * unverified connection is not a working one, and the alternative is a campaign
 * scheduled against a connection nobody has successfully checked.
 */
function checkConnection(health: HealthReport, now: Date, network: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isPublishable(health)) {
    const missing = health.missingScopes;
    const detail =
      missing !== undefined && missing.length > 0
        ? ` Missing permission${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`
        : '';
    issues.push(issue('connection_not_ready', 'error', `${health.message}${detail}`));
  } else if (health.status === 'expiring') {
    // A warning, never a block: the token still works, and refusing to schedule
    // on a warning cancels campaigns that would have published fine.
    const when = health.predictedExpiryAt ?? health.expiresAt;
    const by =
      when === undefined ? '' : ` It stops working around ${when.toISOString().slice(0, 10)}.`;
    issues.push(
      issue(
        'connection_not_ready',
        'warning',
        `This ${network} connection needs reconnecting soon.${by}`,
      ),
    );
  }

  // Age of the evidence, separately from what the evidence said. A stale green
  // is worse than a red, because nobody looks at it twice.
  const ageMs = now.getTime() - health.checkedAt.getTime();
  if (ageMs > HEALTH_REPORT_STALE_AFTER_HOURS * MS_PER_HOUR) {
    issues.push(
      issue(
        'connection_not_ready',
        'warning',
        `This ${network} connection was last checked ${Math.floor(ageMs / MS_PER_HOUR)} hours ago, so its status may be out of date.`,
      ),
    );
  }

  return issues;
}

/**
 * The marginal cost of publishing this particular post, where the network
 * charges per write.
 *
 * A post carrying a link is priced separately on the network that does this at
 * all, so the link surcharge wins where both are declared.
 */
function estimatedCostUsd(target: ResolvedTarget, caps: PlatformCapabilities): number | undefined {
  const { costPerPostUsd, costPerPostWithLinkUsd } = caps.publishing;
  if (target.link !== undefined && costPerPostWithLinkUsd !== undefined) {
    return costPerPostWithLinkUsd;
  }
  return costPerPostUsd;
}

/**
 * Check the three budgets that can independently run out.
 *
 * All of these are enforced on our side before the platform sees the request,
 * because discovering a limit by being rejected costs the user a posting slot
 * and costs us standing with the platform.
 */
function checkQuota(
  target: ResolvedTarget,
  caps: PlatformCapabilities,
  quota: QuotaHeadroom,
  now: Date,
  network: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (quota.postsRemainingIn24h !== undefined && quota.postsRemainingIn24h <= 0) {
    issues.push(
      issue(
        'quota_exhausted',
        'error',
        `This account has used its ${network} allowance for the next 24 hours. Move this post to a later slot.`,
      ),
    );
  }

  if (quota.nextAllowedAt !== undefined && quota.nextAllowedAt.getTime() > now.getTime()) {
    const minutes = Math.ceil((quota.nextAllowedAt.getTime() - now.getTime()) / 60_000);
    issues.push(
      issue(
        'quota_exhausted',
        'error',
        `${network} requires a gap between posts to one account. The next one can go out in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      ),
    );
  }

  if (quota.appUnitsRemaining !== undefined && quota.appUnitsRemaining <= 0) {
    // Worded around what the customer can do about it, because on a shared app
    // the cause is usually somebody else entirely and "try again tomorrow" is
    // the only honest instruction that does not blame them.
    issues.push(
      issue(
        'quota_exhausted',
        'error',
        `Our ${network} API budget for today is used up. This post can go out after the daily reset, or sooner if this organisation connects its own ${network} app.`,
      ),
    );
  }

  const cost = estimatedCostUsd(target, caps);
  const remaining = quota.tenantSpendRemainingUsd;
  if (cost !== undefined && remaining !== undefined && cost > remaining) {
    // Only a verified price may block. The descriptor's own rule is that
    // billing must refuse anything softer than `verified`, and stopping
    // somebody's campaign on a figure we inferred is the same mistake as
    // charging them for one.
    const verified = caps.publishing.costConfidence === 'verified';
    issues.push(
      issue(
        'cost_exceeds_cap',
        verified ? 'error' : 'warning',
        `Publishing to ${network} costs about $${cost.toFixed(2)} and this organisation has $${remaining.toFixed(2)} left under its spend cap${verified ? '' : ' (that price is our best estimate, not a confirmed figure)'}.`,
      ),
    );
  }

  return issues;
}

/**
 * Compare this body against what the account published or queued recently.
 *
 * Always a warning, never an error, and that is a rule rather than a default.
 * We do not know the platforms' thresholds, they change them, and the score is
 * a prediction tuned to be useful rather than exact. A tool that refuses to
 * publish something the platform would have accepted is worse than one that
 * lets a duplicate through — the first costs a posting slot and the user's
 * trust in the check, the second costs a dismissible notice.
 *
 * One aggregated finding rather than one per conflict: a queue refilled from a
 * small library trips against a dozen posts at once, and a dozen identical
 * warnings is noise the user learns to scroll past.
 */
function findDuplicate(
  target: ResolvedTarget,
  context: ValidationContext,
): DuplicateFinding | undefined {
  const recent = context.recentPosts;
  if (recent === undefined || recent.length === 0) return undefined;
  if (target.body.trim() === '') return undefined;

  const threshold = context.duplicateThreshold ?? NEAR_DUPLICATE_THRESHOLD;
  const windowHours = context.duplicateWindowHours ?? DEFAULT_DUPLICATE_WINDOW_HOURS;
  const earliest = context.now.getTime() - windowHours * MS_PER_HOUR;

  const conflicts: PostTargetId[] = [];
  const profiles = new Set<SocialProfileId>();
  let best = 0;

  for (const post of recent) {
    // Future-dated entries are queued posts, which count: publishing a
    // near-duplicate an hour before its twin goes out is the same collision.
    if (post.at.getTime() < earliest) continue;
    const score = similarity(target.body, post.body);
    if (score < threshold) continue;
    conflicts.push(post.targetId);
    if (post.profileId !== undefined) profiles.add(post.profileId);
    if (score > best) best = score;
  }

  if (conflicts.length === 0) return undefined;

  const where = profiles.size > 1 ? ` across ${profiles.size} profiles` : '';
  const message = `${Math.round(best * 100)}% similar to ${conflicts.length} post${conflicts.length === 1 ? '' : 's'}${where} in the last ${windowHours} hours.`;

  return { score: best, threshold, conflictingTargets: conflicts, windowHours, message };
}

/**
 * Layer the context-dependent checks on top of the static ones.
 *
 * `validateTarget` is called first and its result is never rewritten — issues
 * are added, not edited or removed. That keeps the two layers independently
 * testable and means the composer's on-keystroke report and this one cannot
 * contradict each other about the same fact.
 *
 * Everything checked here has the same shape of justification: it is knowable
 * before publishing, unknowable from a capability descriptor, and expensive to
 * discover at 02:00. A connection that lost a scope yesterday, a subreddit that
 * added a mandatory flair this morning, a body 94% identical to one queued on
 * five other profiles, an account with no posting allowance left — each of
 * those is a post that fails after the slot is gone, and each is a sentence
 * next to the editor if we ask the question here instead.
 */
export function validateWithContext(
  target: ResolvedTarget,
  caps: PlatformCapabilities,
  context: ValidationContext,
  networkName = caps.network,
): ContextualValidationReport {
  const base = validateTarget(target, caps, networkName);
  const issues: ValidationIssue[] = [...base.issues];

  issues.push(...checkConnection(context.connectionHealth, context.now, networkName));
  issues.push(...checkQuota(target, caps, context.quota, context.now, networkName));

  let ruleViolations: readonly DestinationRuleViolation[] = [];
  const destination = context.destination;
  if (destination !== undefined) {
    // Assembled here rather than asked of the caller, so that the target passed
    // in stays a plain `ResolvedTarget` and nothing upstream has to know that
    // rule checking wants a different shape of the same draft.
    const destinationTarget: DestinationTarget = {
      ...target,
      destinationId: destination.destinationId,
      selections: destination.selections,
    };
    ruleViolations = validateAgainstRules(destinationTarget, destination.rules);
    issues.push(...ruleViolations);
  }

  const duplicate = findDuplicate(target, context);
  if (duplicate !== undefined) {
    const stricter = caps.publishing.rejectsDuplicateContent
      ? ` ${networkName} refuses posts it considers repeats, so this one will probably be rejected.`
      : '';
    issues.push(
      issue('near_duplicate_content', 'warning', `${duplicate.message}${stricter}`, {
        field: 'body',
      }),
    );
  }

  const blocked = issues.some((i) => i.severity === 'error');

  return {
    issues,
    publishable: !blocked,
    // A newly blocked post is blocked; an unblocked one keeps whatever delivery
    // the static layer worked out, because nothing here changes how a post
    // reaches a network, only whether it may go at all.
    delivery: blocked ? 'blocked' : base.delivery,
    duplicate,
    ruleViolations,
  };
}
