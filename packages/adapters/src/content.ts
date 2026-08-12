import type { MediaAssetId, PostId, SocialProfileId } from '@smm/shared';

import type { NetworkId } from './networks.js';

/**
 * The shapes a post can take.
 *
 * Deliberately a shared vocabulary rather than per-network types: one draft
 * fans out to many networks, and the composer needs to reason about "this is a
 * short vertical video" without knowing whether it lands as a Reel, a Short, or
 * a TikTok.
 */
export type PostFormat =
  | 'text'
  | 'image'
  | 'carousel'
  | 'video'
  /** Short vertical video: Reels, Shorts, TikToks. */
  | 'reel'
  /** Ephemeral 24-hour content. */
  | 'story'
  | 'poll'
  /** Long-form native writing: LinkedIn articles, Substack posts. */
  | 'article'
  /** An uploaded file, e.g. a LinkedIn PDF carousel. */
  | 'document'
  /** A connected sequence of short posts. */
  | 'thread'
  /** Pinterest pin. */
  | 'pin'
  /** A reply to a review on a reputation platform. */
  | 'review_reply';

/** Optional behaviours a network may or may not expose through its API. */
export type PostFeature =
  /** Post a comment on our own post immediately after publishing. */
  | 'first_comment'
  | 'alt_text'
  | 'location_tag'
  /** Tag other accounts in the media itself, not just the caption. */
  | 'user_tag'
  | 'product_tag'
  /** Co-author a post so it appears on both accounts. */
  | 'collaborator_tag'
  /** The network can hold a future-dated post itself. */
  | 'native_scheduling'
  /** Links are clickable in the body. */
  | 'link_in_body'
  /** Choose the video cover frame. */
  | 'custom_thumbnail'
  /** Attach licensed audio. */
  | 'music'
  | 'quote_post'
  /** A separate title field distinct from the body. */
  | 'title'
  /** A poll can be attached to an otherwise ordinary post. */
  | 'poll'
  /** Restrict who can reply. */
  | 'reply_controls';

/**
 * How a post reaches a network.
 *
 * `reminder` exists because several networks simply cannot be posted to
 * programmatically for certain formats — Instagram Stories with link stickers
 * being the canonical case. Rather than pretend otherwise, the platform
 * notifies the user to post manually at the scheduled moment. Modelling this
 * explicitly keeps the limitation visible in the UI instead of surfacing as a
 * mysterious failure.
 */
export type DeliveryMode = 'auto' | 'reminder' | 'unsupported';

export interface MediaRef {
  readonly assetId: MediaAssetId;
  readonly kind: 'image' | 'video' | 'gif' | 'document' | 'audio';
  readonly bytes: number;
  readonly mimeType: string;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly durationSec?: number | undefined;
  /** Accessibility description. Networks that support it should always get it. */
  readonly altText?: string | undefined;
  /** Cover frame for video, where the network allows choosing one. */
  readonly thumbnailAssetId?: MediaAssetId | undefined;
}

/**
 * An interactive overlay on an ephemeral post.
 *
 * Stickers are the entire engagement mechanic of Instagram Stories and none of
 * them can be applied through the API — which makes them the single largest
 * driver of reminder-based publishing in this product.
 */
export interface StickerRef {
  readonly kind:
    | 'link'
    | 'poll'
    | 'question'
    | 'quiz'
    | 'countdown'
    | 'location'
    | 'mention'
    | 'music'
    | 'gif'
    | 'add_yours';
  readonly payload?: Readonly<Record<string, string>> | undefined;
}

/**
 * Audio chosen from a network's own catalogue.
 *
 * Distinct from audio already mixed into the uploaded file. Meta and TikTok do
 * not expose their music libraries to third parties for rights reasons, so a
 * post depending on trending audio cannot be published programmatically at all
 * — the distinction decides whether a Reel can go out automatically.
 */
export interface NativeAudioRef {
  readonly remoteId: string;
  readonly title?: string | undefined;
}

export interface PollOption {
  readonly text: string;
}

export interface Poll {
  readonly options: readonly PollOption[];
  readonly durationMinutes: number;
}

/**
 * Network-specific overrides for a single target.
 *
 * The whole point of a cross-posting tool is that the same idea should read
 * natively on each network. A caption tuned for LinkedIn should not be the one
 * that goes to TikTok, so any field here replaces the shared draft's version.
 */
export interface TargetOverride {
  readonly body?: string | undefined;
  readonly title?: string | undefined;
  readonly media?: readonly MediaRef[] | undefined;
  readonly firstComment?: string | undefined;
  readonly format?: PostFormat | undefined;
}

/** The network-agnostic content a user composed. */
export interface PostDraft {
  readonly id: PostId;
  readonly format: PostFormat;
  readonly body: string;
  readonly title?: string | undefined;
  readonly media: readonly MediaRef[];
  readonly poll?: Poll | undefined;
  readonly firstComment?: string | undefined;
  readonly link?: string | undefined;
  readonly locationRemoteId?: string | undefined;
  readonly taggedAccounts?: readonly string[] | undefined;
  readonly collaborators?: readonly string[] | undefined;
  readonly stickers?: readonly StickerRef[] | undefined;
  readonly nativeAudio?: NativeAudioRef | undefined;
}

/** A draft aimed at one connected account, with its overrides resolved. */
export interface ResolvedTarget {
  readonly network: NetworkId;
  readonly profileId: SocialProfileId;
  readonly format: PostFormat;
  readonly body: string;
  readonly title?: string | undefined;
  readonly media: readonly MediaRef[];
  readonly poll?: Poll | undefined;
  readonly firstComment?: string | undefined;
  readonly link?: string | undefined;
  readonly locationRemoteId?: string | undefined;
  readonly taggedAccounts?: readonly string[] | undefined;
  readonly collaborators?: readonly string[] | undefined;
  readonly stickers?: readonly StickerRef[] | undefined;
  readonly nativeAudio?: NativeAudioRef | undefined;
}

/** Apply a target's overrides over the shared draft. */
export function resolveTarget(
  draft: PostDraft,
  network: NetworkId,
  profileId: SocialProfileId,
  override: TargetOverride = {},
): ResolvedTarget {
  return {
    network,
    profileId,
    format: override.format ?? draft.format,
    body: override.body ?? draft.body,
    title: override.title ?? draft.title,
    media: override.media ?? draft.media,
    poll: draft.poll,
    firstComment: override.firstComment ?? draft.firstComment,
    link: draft.link,
    locationRemoteId: draft.locationRemoteId,
    taggedAccounts: draft.taggedAccounts,
    collaborators: draft.collaborators,
    stickers: draft.stickers,
    nativeAudio: draft.nativeAudio,
  };
}
