import { extractHashtags, measureText, truncateToLimit } from '@smm/shared';

import type { FormatCapability, ImageSpec, PlatformCapabilities, VideoSpec } from './capabilities.js';
import { formatCapability } from './capabilities.js';
import type { MediaRef, ResolvedTarget } from './content.js';

/**
 * Pre-flight validation against a network's declared capabilities.
 *
 * This runs in the composer as the user types and again immediately before
 * publishing. Catching a violation here turns a silent 2am failure into an
 * inline warning while the user is still looking at the post, which is the
 * single highest-leverage reliability feature a scheduling tool has.
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
  | 'video_aspect_ratio_invalid'
  | 'missing_alt_text'
  | 'feature_unsupported';

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
