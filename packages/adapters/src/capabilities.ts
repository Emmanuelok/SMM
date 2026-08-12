import type { TextCountingStrategy } from '@smm/shared';

import type { DeliveryMode, PostFeature, PostFormat } from './content.js';
import type { NetworkId } from './networks.js';

/**
 * Declarative descriptions of what each network permits.
 *
 * These are data, not code. Every network expresses the same handful of
 * constraints — how long the text can be, how many images, which video codecs,
 * how many posts a day — so the validator that enforces them is written once
 * and each network supplies its numbers. Adding a network becomes a matter of
 * describing it rather than writing another bespoke validator, and the same
 * descriptors drive the composer UI, so what the editor allows and what the API
 * accepts cannot drift apart.
 */

/**
 * How well established a figure is.
 *
 * Not every number in a descriptor is equally solid. Some are documented and
 * queryable; others are pieced together from changelogs and third-party
 * reports that contradict each other. Recording which is which stops a figure
 * that was a best guess from being read months later as though it were fact —
 * particularly for pricing, where a wrong number becomes a wrong invoice.
 */
export type Confidence =
  /** Confirmed against the platform's own documentation or API. */
  | 'verified'
  /** Sources disagree. Usable for warnings, never for money. */
  | 'contested'
  /** Believed but unconfirmed. */
  | 'unverified';

export interface TextCapability {
  /** Maximum body length, measured with `counting`. */
  readonly maxLength: number;
  /** How this network counts length. X's weighting differs from everyone's. */
  readonly counting: TextCountingStrategy;
  /** Whether a body is mandatory (some formats are media-only). */
  readonly required: boolean;
  /** Cap on hashtags, where the network enforces one. */
  readonly maxHashtags?: number | undefined;
  /** Whether links in the body are clickable. */
  readonly linksClickable: boolean;
  /** Separate title field, where the network has one. */
  readonly maxTitleLength?: number | undefined;
}

export interface ImageSpec {
  readonly maxBytes: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Narrowest permitted width/height ratio. */
  readonly minAspectRatio: number;
  readonly maxAspectRatio: number;
  readonly mimeTypes: readonly string[];
}

export interface VideoSpec {
  readonly maxBytes: number;
  readonly minDurationSec: number;
  readonly maxDurationSec: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly minAspectRatio: number;
  readonly maxAspectRatio: number;
  readonly mimeTypes: readonly string[];
}

export interface MediaCapability {
  readonly minCount: number;
  readonly maxCount: number;
  /** Whether images and video can be combined in one post. */
  readonly mixedTypesAllowed: boolean;
  readonly image?: ImageSpec | undefined;
  readonly video?: VideoSpec | undefined;
}

/**
 * A content characteristic that forces reminder-based publishing.
 *
 * Delivery mode is not a property of the format alone. A plain Instagram Story
 * publishes automatically; the same Story with a link sticker cannot be
 * published at all, because Meta exposes no sticker API. A Reel with audio
 * mixed into the file publishes; one using a track from Instagram's catalogue
 * cannot, because the music libraries are closed to third parties for rights
 * reasons.
 *
 * Modelling these as triggers rather than baking them into the format keeps the
 * composer honest: it can tell the user *the moment they add a link sticker*
 * that this post will now need to be published by hand, instead of discovering
 * it when the job fails.
 */
export type ReminderTrigger =
  /** Any interactive sticker at all. */
  | 'any_sticker'
  /** Audio taken from the network's own catalogue. */
  | 'native_audio'
  /** A poll attached to a format that otherwise auto-publishes. */
  | 'poll_attached';

export interface FormatCapability {
  readonly format: PostFormat;
  /**
   * Delivery when nothing in `reminderTriggers` applies. The effective mode is
   * computed per post by the validator.
   */
  readonly delivery: DeliveryMode;
  readonly text: TextCapability;
  readonly media: MediaCapability;
  readonly features: readonly PostFeature[];
  /**
   * Content characteristics that downgrade this format to reminder delivery.
   * Empty for formats whose delivery never depends on their content.
   */
  readonly reminderTriggers?: readonly ReminderTrigger[] | undefined;
  /**
   * Why a format is `reminder` or `unsupported`.
   *
   * Surfaced directly to users, so it must explain the limitation in terms
   * they can act on rather than restating an API restriction.
   */
  readonly limitationNote?: string | undefined;
}

/**
 * Publishing volume limits.
 *
 * Enforced on our side, before we call the platform. Discovering a limit by
 * being rejected costs the user a missed posting slot and costs us standing
 * with the platform, so budgeting locally is strictly better than finding out.
 */
export interface PublishingLimits {
  /** Rolling 24-hour cap on posts to a single account. */
  readonly maxPostsPer24h?: number | undefined;
  /** Minimum spacing between posts to one account. */
  readonly minIntervalSec?: number | undefined;
  /** Request-rate ceiling per connected account. */
  readonly maxRequestsPerMinute?: number | undefined;
  /** Whether the network rejects re-posted identical content. */
  readonly rejectsDuplicateContent: boolean;
  /**
   * Marginal cost of a post, in USD, where a platform charges per write.
   * X is the notable case; most networks are zero.
   */
  readonly costPerPostUsd?: number | undefined;
  /** Surcharge when the post contains a link, where one applies. */
  readonly costPerPostWithLinkUsd?: number | undefined;
  /**
   * Confidence in the cost figures above.
   *
   * Billing must refuse anything that is not `verified`. Charging a customer
   * based on a number we guessed is worse than not charging them.
   */
  readonly costConfidence?: Confidence | undefined;
  /**
   * Days a brand-new account must age before publishing reliably succeeds.
   * Pinterest is the known case.
   */
  readonly newAccountWarmupDays?: number | undefined;
}

/** Non-publishing capabilities, which drive which product modules light up. */
export interface ReadCapability {
  readonly comments: boolean;
  readonly directMessages: boolean;
  readonly analytics: boolean;
  /** Open keyword search, as required for social listening. */
  readonly keywordSearch: boolean;
  readonly webhooks: boolean;
  readonly deletePost: boolean;
  readonly editPost: boolean;
  /**
   * Longest period the platform's terms permit caching its data.
   * Directly constrains what our analytics store may retain.
   * `null` means no stated limit.
   */
  readonly maxDataRetentionDays: number | null;
  /**
   * Reply window for direct messages, in hours. Several platforms only allow a
   * response within a fixed period of the user's last message.
   */
  readonly dmReplyWindowHours?: number | undefined;
}

export interface PlatformCapabilities {
  readonly network: NetworkId;
  readonly formats: readonly FormatCapability[];
  readonly publishing: PublishingLimits;
  readonly read: ReadCapability;
  /**
   * When these numbers were last checked against the platform's documentation.
   * Platform APIs in this category change without much notice, so a stale
   * descriptor is a liability and its age should be visible.
   */
  readonly verifiedOn: string;
  /** Documentation the descriptor was derived from. */
  readonly sources: readonly string[];
}

/** Look up one format's capability, if the network supports it at all. */
export function formatCapability(
  caps: PlatformCapabilities,
  format: PostFormat,
): FormatCapability | undefined {
  return caps.formats.find((f) => f.format === format);
}

/** How a given format reaches this network. */
export function deliveryModeFor(caps: PlatformCapabilities, format: PostFormat): DeliveryMode {
  return formatCapability(caps, format)?.delivery ?? 'unsupported';
}

export function supportsFeature(
  caps: PlatformCapabilities,
  format: PostFormat,
  feature: PostFeature,
): boolean {
  return formatCapability(caps, format)?.features.includes(feature) ?? false;
}
