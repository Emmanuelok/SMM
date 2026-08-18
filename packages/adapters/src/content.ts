import type { MediaAssetId, PostId, SocialProfileId } from '@smm/shared';

import type { NetworkId } from './networks.js';
import type { LocalisedVariant, NetworkExtras } from './variants.js';
import { extrasFor } from './variants.js';

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
 * A per-target override value, with three states rather than two.
 *
 * `undefined` means the target said nothing and inherits the draft. `null`
 * means the target said "not here": the draft has a value and this network must
 * publish without it.
 *
 * The third state is not decoration. Without it there is no way to express the
 * cases that come up constantly — no poll on the network where a poll changes
 * the post format, no bare link on Instagram where links are not clickable and
 * a URL in the caption reads as spam, no location tag on the network that
 * publishes it to an audience the customer did not intend. A two-state override
 * silently turns every one of those into "inherit", which is the opposite of
 * what the user asked for.
 *
 * Fields that can express emptiness on their own do not use this: an empty
 * string body and an empty media array already mean "none".
 */
export type Overridable<T> = T | null | undefined;

/**
 * Network-specific overrides for a single target.
 *
 * The whole point of a cross-posting tool is that the same idea should read
 * natively on each network. A caption tuned for LinkedIn should not be the one
 * that goes to TikTok, so any field here replaces the shared draft's version.
 *
 * Every field of the draft that a network renders differently appears here.
 * What is deliberately absent is the draft's identity — `PostDraft.id` cannot
 * be overridden, because approval, reporting and the duplicate-content check
 * all key on it. A target that could change the post id would produce two posts
 * that nothing downstream can reconcile into the one campaign they are.
 */
export interface TargetOverride {
  readonly format?: PostFormat | undefined;
  readonly body?: string | undefined;
  readonly title?: Overridable<string>;
  readonly media?: readonly MediaRef[] | undefined;
  readonly poll?: Overridable<Poll>;
  readonly firstComment?: Overridable<string>;
  readonly link?: Overridable<string>;
  readonly locationRemoteId?: Overridable<string>;
  readonly taggedAccounts?: Overridable<readonly string[]>;
  readonly collaborators?: Overridable<readonly string[]>;
  readonly stickers?: Overridable<readonly StickerRef[]>;
  readonly nativeAudio?: Overridable<NativeAudioRef>;
  /**
   * Options that exist on this network and nowhere else.
   *
   * No draft counterpart to inherit from: a subreddit or a made-for-kids
   * declaration is meaningless on a network-agnostic draft, so extras are
   * authored per target by construction.
   */
  readonly extras?: NetworkExtras | undefined;
  /** Language of `body`, overriding the draft's. BCP 47. */
  readonly locale?: Overridable<string>;
  /**
   * Translations for this network specifically. `null` drops the draft's
   * translations, for a network where only the original language is wanted.
   */
  readonly localisedVariants?: Overridable<readonly LocalisedVariant[]>;
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
  /** Language `body` is written in. BCP 47. */
  readonly locale?: string | undefined;
  /**
   * The same post in other languages.
   *
   * Held on the draft so a campaign running in six languages is one post with
   * six bodies rather than six posts. Six posts cannot be reported on as one
   * campaign without someone re-associating them by hand, and they need six
   * separate approvals for what the author wrote as one idea.
   */
  readonly localisedVariants?: readonly LocalisedVariant[] | undefined;
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
  /** Per-network options, already checked to belong to `network`. */
  readonly extras?: NetworkExtras | undefined;
  /** Language of `body`. BCP 47. */
  readonly locale?: string | undefined;
  /**
   * Translations still to be chosen between.
   *
   * Carried through resolution rather than collapsed here because the audience
   * locale belongs to the destination, which is picked after the network: one
   * LinkedIn target can serve a French page and a German one. The final choice
   * is made by `resolveLocalisedContent`.
   */
  readonly localisedVariants?: readonly LocalisedVariant[] | undefined;
}

/**
 * Apply one override value over the draft's.
 *
 * `null` is the only way to say "the draft has this and this network must not",
 * so it has to be distinguished from silence before `??` collapses them.
 */
function applied<T>(value: Overridable<T>, base: T | undefined): T | undefined {
  return value === null ? undefined : (value ?? base);
}

/**
 * Apply a target's overrides over the shared draft.
 *
 * Every field the draft carries is overridable except its identity. The
 * previous version copied poll, link, location, tags, stickers and audio
 * straight from the draft, which meant a network that cannot accept them —
 * or a customer who simply wanted a different link per network — had no way to
 * say so, and the composer's per-network editor silently discarded the edit.
 *
 * The result is content resolved for a network, not yet for an audience.
 * `resolveLocalisedContent` applies the third layer once a destination and its
 * locale are known.
 */
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
    title: applied(override.title, draft.title),
    media: override.media ?? draft.media,
    poll: applied(override.poll, draft.poll),
    firstComment: applied(override.firstComment, draft.firstComment),
    link: applied(override.link, draft.link),
    locationRemoteId: applied(override.locationRemoteId, draft.locationRemoteId),
    taggedAccounts: applied(override.taggedAccounts, draft.taggedAccounts),
    collaborators: applied(override.collaborators, draft.collaborators),
    stickers: applied(override.stickers, draft.stickers),
    nativeAudio: applied(override.nativeAudio, draft.nativeAudio),
    // Nothing to inherit: extras only exist per network. Extras belonging to a
    // different network are dropped rather than carried, because
    // `ResolvedTarget.extras` promises its contents match `network` and adapters
    // read it on that basis. Duplicating a target onto another network is the
    // ordinary way a mismatch arises, and passing a Pinterest board id through
    // to a Reddit adapter would hand it a field it has no way to recognise as
    // wrong.
    extras: extrasFor(override.extras, network),
    locale: applied(override.locale, draft.locale),
    localisedVariants: applied(override.localisedVariants, draft.localisedVariants),
  };
}
