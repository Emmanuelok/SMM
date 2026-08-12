import type { MediaRef } from './content.js';
import type { NetworkId } from './networks.js';

/**
 * Per-network extras and per-locale bodies: the two things a shared draft
 * cannot express on its own.
 *
 * ── Why extras are typed rather than a bag ───────────────────────────────────
 *
 * The tempting shape for this is `Record<string, unknown>` on the target, or a
 * jsonb column mirrored straight into TypeScript. It is the wrong shape for one
 * reason: most of these fields are not decoration, they are *mandatory*. A
 * Reddit submission with no subreddit has nowhere to go. A Discord message with
 * no channel has nobody to reach. A YouTube upload without the made-for-kids
 * declaration is refused outright, and TikTok refuses a direct post that does
 * not state a privacy level.
 *
 * A stringly-typed bag pushes the discovery of every one of those to the
 * moment we call the platform — which, for a scheduling product, is 02:00 on a
 * date the customer chose, with nobody watching. A typed union moves the same
 * discovery to the composer, at the moment somebody is looking at the screen
 * and can fix it. That is the entire argument: the failure is identical, only
 * the timing and the audience differ, and both of those decide whether the post
 * goes out at all.
 *
 * The secondary argument is that a bag cannot be renamed. `subreddit` typed in
 * one place is a rename away from correctness everywhere; `extras['subreddit']`
 * spelled across eight adapters, three validators and a UI form is not.
 *
 * ── Why locale variants live on the content, not in separate posts ───────────
 *
 * A brand running one campaign in six languages could model it as six posts.
 * Reporting is where that falls apart: the six are then six unrelated rows, and
 * nothing can answer "how did the spring campaign do" without someone manually
 * re-associating them — every time, in every export, forever. Approval has the
 * same problem in reverse, since the six would each need approving as though
 * they were unrelated ideas. Keeping the translations as variants of one post
 * means the campaign is one object everywhere it matters, and the language
 * split is a rendering decision made per destination.
 *
 * This module imports types from `./content.js` while `content.ts` imports
 * types from here. The cycle is type-only in both directions and erases at
 * compile time under `verbatimModuleSyntax`, so no module-load cycle exists at
 * runtime.
 */

/* -------------------------------------------------------------------------- */
/* Per-network extras                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A product attached to an Instagram post, optionally pinned to a point on the
 * image.
 */
export interface ProductTag {
  readonly productId: string;
  /** Horizontal position, 0-1 from the left edge. Required for feed images. */
  readonly x?: number | undefined;
  /** Vertical position, 0-1 from the top edge. */
  readonly y?: number | undefined;
}

/**
 * TikTok's own privacy vocabulary, kept in its wire spelling.
 *
 * Deliberately not translated into friendlier names. A mapping table would be a
 * second place for the values to be wrong, and TikTok returns the permitted
 * subset per creator at query time, so our list has to compare equal to theirs
 * without a translation step in between.
 */
export type TikTokPrivacyLevel =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'FOLLOWER_OF_CREATOR'
  | 'SELF_ONLY';

/**
 * TikTok's commercial content declaration.
 *
 * Required whenever the post promotes anything, and the two flags are not
 * interchangeable: `yourBrand` is the creator promoting themselves, while
 * `brandedContent` is a paid third-party promotion, which additionally forbids
 * `SELF_ONLY` privacy. Getting the pair wrong is a disclosure failure rather
 * than a formatting one, so it is modelled explicitly instead of as one boolean.
 */
export interface TikTokCommercialDisclosure {
  readonly enabled: boolean;
  readonly yourBrand: boolean;
  readonly brandedContent: boolean;
}

/** A call-to-action button on a Google Business Profile post. */
export interface GoogleBusinessCta {
  readonly type: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
  /** Ignored for `CALL`, which uses the location's own number. */
  readonly url?: string | undefined;
}

/**
 * Reddit extras.
 *
 * `subreddit` is required because Reddit has no default destination — there is
 * no equivalent of "my feed" that a submission falls back to. Flair is optional
 * here and mandatory in a large minority of subreddits; which ones is only
 * knowable from a live fetch, so it is enforced by the destination rules rather
 * than by this type.
 */
export interface RedditExtras {
  readonly network: 'reddit';
  /** Bare name, without the `r/` prefix. */
  readonly subreddit: string;
  readonly flairId?: string | undefined;
  /** Only settable when the chosen flair is editable. */
  readonly flairText?: string | undefined;
  readonly nsfw?: boolean | undefined;
  readonly spoiler?: boolean | undefined;
  /** Whether replies land in the author's inbox. */
  readonly sendReplies?: boolean | undefined;
}

/**
 * Pinterest extras.
 *
 * One board, not a list. A pin published to several boards is several pins with
 * several remote ids, which the one-target-one-remote-post model cannot
 * represent, and Pinterest treats rapid identical pins across boards as spam.
 * Multi-board campaigns are therefore multiple targets, which also gives each
 * board its own metrics.
 */
export interface PinterestExtras {
  readonly network: 'pinterest';
  readonly boardId: string;
  readonly boardSectionId?: string | undefined;
  /** Where the pin sends the user. Usually the entire point of pinning. */
  readonly destinationUrl?: string | undefined;
  /** Pinterest carries alt text on the pin, not on the media object. */
  readonly altText?: string | undefined;
}

/**
 * TikTok extras.
 *
 * `privacyLevel` is required and has no safe default. An unaudited app is
 * restricted to `SELF_ONLY`, and the permitted set is per creator, so assuming
 * public either fails the call or — worse, on an audited app — publishes
 * something the creator meant to keep private.
 */
export interface TikTokExtras {
  readonly network: 'tiktok';
  readonly privacyLevel: TikTokPrivacyLevel;
  readonly disableComment?: boolean | undefined;
  readonly disableDuet?: boolean | undefined;
  readonly disableStitch?: boolean | undefined;
  readonly commercial?: TikTokCommercialDisclosure | undefined;
  /** Frame to use as the cover, in milliseconds from the start. */
  readonly coverTimestampMs?: number | undefined;
  /** Declares AI-generated or materially altered footage. */
  readonly aiGenerated?: boolean | undefined;
}

/**
 * YouTube extras.
 *
 * Two required fields, both because the alternative is guessing on the
 * customer's behalf. `madeForKids` is a legal declaration under COPPA that
 * YouTube demands on every upload, and `visibility` decides whether a launch
 * video is announced to every subscriber or sits invisible — a wrong guess is
 * damaging in both directions, so neither gets a default.
 */
export interface YouTubeExtras {
  readonly network: 'youtube';
  readonly visibility: 'public' | 'unlisted' | 'private';
  readonly madeForKids: boolean;
  /** Numeric category id; the valid set is region-dependent. */
  readonly categoryId?: string | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly playlistId?: string | undefined;
  /**
   * Hand the schedule to YouTube instead of holding it ourselves.
   *
   * Only honoured alongside `visibility: 'private'` — YouTube silently ignores
   * it otherwise, which reads as a scheduled post that published immediately.
   * When this is set our dispatcher must not also publish, or the video goes
   * out twice.
   */
  readonly publishAt?: Date | undefined;
  /** Declares synthetic or materially altered content. */
  readonly alteredContent?: boolean | undefined;
}

/**
 * LinkedIn extras.
 *
 * `authorOrganizationId` is the difference between a post on a person's feed
 * and a post on a company page. One token routinely grants both, so the choice
 * cannot be inferred from the connection and has to be carried with the
 * content. Absent means posting as the member who authorised us.
 */
export interface LinkedInExtras {
  readonly network: 'linkedin';
  readonly authorOrganizationId?: string | undefined;
  /** Filename shown above a PDF carousel. LinkedIn requires one for documents. */
  readonly documentTitle?: string | undefined;
  readonly visibility?: 'public' | 'connections' | 'logged_in' | undefined;
}

/**
 * Mastodon extras.
 *
 * `visibility` is required because the server-side default is set per instance
 * and per account. Omitting it means the same campaign is public on one
 * instance and followers-only on another, with nothing in our records
 * explaining the difference.
 */
export interface MastodonExtras {
  readonly network: 'mastodon';
  readonly visibility: 'public' | 'unlisted' | 'private' | 'direct';
  /**
   * Spoiler text shown in place of the body until the reader opts in. Many
   * instances make this a rule for whole topics, and ignoring it is the fastest
   * way to get an account defederated.
   */
  readonly contentWarning?: string | undefined;
  /** Hides attached media behind a click. Implied by a content warning. */
  readonly sensitive?: boolean | undefined;
}

/**
 * Discord extras.
 *
 * A bot token addresses a guild, not a place to speak, so a channel is
 * required. Permissions are per channel: a channel the bot can see is not
 * necessarily one it may post in, which is checked against the destination
 * rules rather than here.
 */
export interface DiscordExtras {
  readonly network: 'discord';
  readonly channelId: string;
  /** Post into a thread under the channel rather than the channel itself. */
  readonly threadId?: string | undefined;
  /** Suppresses link previews, which otherwise dominate a short message. */
  readonly suppressEmbeds?: boolean | undefined;
}

/**
 * Telegram extras.
 *
 * `chatId` accepts either the `@name` form or the numeric id. Both are kept as
 * strings: the numeric ids exceed the safe integer range for some chat types,
 * and a silently rounded id addresses a different chat.
 */
export interface TelegramExtras {
  readonly network: 'telegram';
  readonly chatId: string;
  /** Topic id, for supergroups with topics enabled. */
  readonly messageThreadId?: string | undefined;
  /** Deliver without a notification sound. */
  readonly disableNotification?: boolean | undefined;
  /** Blocks forwarding and saving. */
  readonly protectContent?: boolean | undefined;
}

/** Instagram extras. */
export interface InstagramExtras {
  readonly network: 'instagram';
  /**
   * Invited co-authors. The post only appears on their profiles once they
   * accept, so a collaborator post publishes successfully and still looks
   * missing to the customer until then.
   */
  readonly collaborators?: readonly string[] | undefined;
  readonly productTags?: readonly ProductTag[] | undefined;
  /** Whether a Reel also appears in the main feed grid. */
  readonly shareToFeed?: boolean | undefined;
}

/**
 * Google Business Profile extras.
 *
 * `locationId` is required and is the reason this network exists in the
 * product: one grant returns every location a franchise operates, and a post
 * with no location named is a post for all of them or none.
 */
export interface GoogleBusinessExtras {
  readonly network: 'google_business';
  readonly locationId: string;
  readonly topicType: 'STANDARD' | 'EVENT' | 'OFFER' | 'ALERT';
  readonly callToAction?: GoogleBusinessCta | undefined;
}

/** Networks whose extras are individually modelled above. */
export type TypedExtrasNetwork =
  | 'reddit'
  | 'pinterest'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'mastodon'
  | 'discord'
  | 'telegram'
  | 'instagram'
  | 'google_business';

/**
 * Everything else. Excluding the modelled networks is what keeps narrowing
 * exact — see `GenericExtras`.
 */
export type UntypedExtrasNetwork = Exclude<NetworkId, TypedExtrasNetwork>;

/**
 * The escape hatch for networks nobody has modelled yet.
 *
 * Two deliberate constraints. The discriminant excludes every modelled network,
 * because an arm that accepts any network id destroys narrowing on all the
 * others: `extras.network === 'reddit'` would leave this arm in the union and
 * `extras.subreddit` would come back `unknown`, which is precisely the outcome
 * the typed union exists to prevent. And the loose values are nested under
 * `fields` rather than sitting in an index signature, so a stray key can never
 * shadow a discriminant or a future typed field.
 *
 * Adding an arm above is cheap. Reaching for this one should feel like a
 * shortcut, because it is.
 */
export interface GenericExtras {
  readonly network: UntypedExtrasNetwork;
  readonly fields: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Per-network publishing options that have no equivalent on any other network.
 *
 * Discriminated on `network`, so the composer, the validator and the adapter
 * all see the same required fields for the same network, and a missing
 * subreddit or an absent made-for-kids declaration is a type error rather than
 * a 02:00 publish failure.
 */
export type NetworkExtras =
  | RedditExtras
  | PinterestExtras
  | TikTokExtras
  | YouTubeExtras
  | LinkedInExtras
  | MastodonExtras
  | DiscordExtras
  | TelegramExtras
  | InstagramExtras
  | GoogleBusinessExtras
  | GenericExtras;

/**
 * The extras type belonging to one network.
 *
 * Written as a conditional rather than an `Extract`, because `Extract` returns
 * `never` for the unmodelled networks — their arm's discriminant is a union
 * that contains the literal without being assignable to it.
 */
export type NetworkExtrasFor<N extends NetworkId> = N extends TypedExtrasNetwork
  ? Extract<NetworkExtras, { readonly network: N }>
  : GenericExtras;

/**
 * Read extras only if they belong to the network being published to.
 *
 * The mismatch case is real rather than defensive: targets get duplicated when
 * a user copies a post to another network, and extras carried across would
 * otherwise be read positionally — a Pinterest board id landing where a
 * subreddit was expected. Returning `undefined` makes the adapter treat it as
 * absent, which its required-field checks already handle.
 */
export function extrasFor<N extends NetworkId>(
  extras: NetworkExtras | undefined,
  network: N,
): NetworkExtrasFor<N> | undefined {
  if (extras === undefined || extras.network !== network) return undefined;
  // The comparison above establishes the arm, but the checker cannot prove a
  // conditional type over an unresolved type parameter, so the assertion stands
  // in for a proof it will not construct.
  return extras as unknown as NetworkExtrasFor<N>;
}

/* -------------------------------------------------------------------------- */
/* Locale variants                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One post body in one language.
 *
 * `media` absent means the variant reuses the target's media, which is the
 * common case — the footage is the same and only the words change. An empty
 * array is the different, deliberate statement that this language ships without
 * media, for a locale whose creative was never produced.
 */
export interface LocalisedVariant {
  /** BCP 47 tag, e.g. `pt-BR`, `zh-Hant`, `es`. Matched case-insensitively. */
  readonly locale: string;
  readonly body: string;
  readonly title?: string | undefined;
  readonly firstComment?: string | undefined;
  readonly media?: readonly MediaRef[] | undefined;
  readonly link?: string | undefined;
}

/**
 * The minimum shape variant selection needs.
 *
 * Structural on purpose, so drafts, targets and anything else carrying
 * translations can be passed without this module depending on their full
 * definitions.
 */
export interface LocalisableContent {
  /** Language of the base body. Used to judge whether a variant is an improvement. */
  readonly locale?: string | undefined;
  readonly localisedVariants?: readonly LocalisedVariant[] | undefined;
}

/** A target's content before a locale has been chosen. */
export interface LocalisableTarget extends LocalisableContent {
  readonly body: string;
  readonly media: readonly MediaRef[];
  readonly title?: string | undefined;
  readonly firstComment?: string | undefined;
  readonly link?: string | undefined;
}

/** The content that will actually be published, after locale selection. */
export interface LocalisedContent {
  /** The locale finally used, for reporting and for the post's language field. */
  readonly locale?: string | undefined;
  readonly body: string;
  readonly media: readonly MediaRef[];
  readonly title?: string | undefined;
  readonly firstComment?: string | undefined;
  readonly link?: string | undefined;
}

interface ParsedLocale {
  readonly language: string;
  readonly script?: string | undefined;
  readonly region?: string | undefined;
}

const LANGUAGE_PATTERN = /^[a-z]{2,3}$/;
const SCRIPT_PATTERN = /^[a-z]{4}$/;
const REGION_PATTERN = /^([a-z]{2}|\d{3})$/;

/**
 * Regions that imply Traditional Chinese, and those that imply Simplified.
 *
 * Needed because most real-world tags say `zh-TW` rather than `zh-Hant`, and
 * the script is the part that decides whether the text is readable. Treating
 * `zh-TW` and `zh-CN` as the same language with a different region — which is
 * what plain BCP 47 matching does — serves Simplified text to a Traditional
 * audience, which is worse than serving them the untranslated original.
 */
const TRADITIONAL_ZH_REGIONS: ReadonlySet<string> = new Set(['tw', 'hk', 'mo']);
const SIMPLIFIED_ZH_REGIONS: ReadonlySet<string> = new Set(['cn', 'sg', 'my']);

/**
 * Split a tag into the three subtags that affect matching.
 *
 * Extensions, private-use subtags and variants are dropped rather than
 * rejected: they never change which translation is right, and rejecting a tag
 * over one would cost a matching translation for a cosmetic reason.
 */
function parseLocale(tag: string): ParsedLocale | undefined {
  const parts = tag.trim().toLowerCase().split(/[-_]/);
  const language = parts[0];
  if (language === undefined || !LANGUAGE_PATTERN.test(language)) return undefined;

  let script: string | undefined;
  let region: string | undefined;
  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    if (part === undefined) continue;
    if (script === undefined && region === undefined && SCRIPT_PATTERN.test(part)) {
      script = part;
      continue;
    }
    if (region === undefined && REGION_PATTERN.test(part)) {
      region = part;
    }
  }
  return { language, script, region };
}

/** The script a tag implies, whether or not it names one. */
function effectiveScript(locale: ParsedLocale): string | undefined {
  if (locale.script !== undefined) return locale.script;
  if (locale.language !== 'zh' || locale.region === undefined) return undefined;
  if (TRADITIONAL_ZH_REGIONS.has(locale.region)) return 'hant';
  if (SIMPLIFIED_ZH_REGIONS.has(locale.region)) return 'hans';
  return undefined;
}

/**
 * How well a candidate serves an audience. Higher is better; `undefined` means
 * it must not be used at all.
 *
 * A different script is a rejection rather than a low score. Simplified and
 * Traditional Chinese, and Latin and Cyrillic Serbian, are not degraded
 * versions of each other — they are unreadable to the wrong audience, so
 * falling back on language alone would publish text nobody can read while
 * reporting a successful locale match.
 */
function matchScore(candidate: ParsedLocale, audience: ParsedLocale): number | undefined {
  if (candidate.language !== audience.language) return undefined;

  const candidateScript = effectiveScript(candidate);
  const audienceScript = effectiveScript(audience);
  if (
    candidateScript !== undefined &&
    audienceScript !== undefined &&
    candidateScript !== audienceScript
  ) {
    return undefined;
  }

  if (candidate.region !== undefined && candidate.region === audience.region) return 3;
  // A region-neutral variant beats one written for the wrong country: `es`
  // reads correctly in Buenos Aires and Madrid, whereas `es-AR` reads as
  // foreign in Madrid.
  if (candidate.region === undefined) return 2;
  return 1;
}

/**
 * Pick the variant to publish for an audience, or `undefined` to use the
 * target's own body.
 *
 * Fallback order, best first:
 *
 *  1. Same language and script, same region — `pt-BR` for a `pt-BR` audience.
 *  2. Same language and script, region-neutral variant — `pt` for `pt-PT`.
 *  3. Same language and script, any other region — `pt-PT` for `pt-AO`. Ties
 *     are broken by declaration order, so the first translation authored wins.
 *  4. The target's base body, when nothing scores higher than it does.
 *
 * The base body is the floor rather than a last resort: a variant must beat it
 * strictly. That keeps an `en-GB` campaign from being swapped for an `en-AU`
 * variant when addressing `en-US`, where both are equally distant and the base
 * is the text a human actually approved.
 *
 * A missing, unparseable or unknown audience locale also returns `undefined`.
 * Publishing the approved original is always defensible; guessing a language
 * from a destination we could not read is not.
 */
export function selectLocalisedVariant(
  content: LocalisableContent,
  audienceLocale: string | undefined,
): LocalisedVariant | undefined {
  const variants = content.localisedVariants;
  if (variants === undefined || variants.length === 0) return undefined;
  if (audienceLocale === undefined) return undefined;

  const audience = parseLocale(audienceLocale);
  if (audience === undefined) return undefined;

  const base = content.locale === undefined ? undefined : parseLocale(content.locale);
  let bestScore = base === undefined ? 0 : (matchScore(base, audience) ?? 0);
  let best: LocalisedVariant | undefined;

  for (const variant of variants) {
    const parsed = parseLocale(variant.locale);
    if (parsed === undefined) continue;
    const score = matchScore(parsed, audience);
    if (score === undefined) continue;
    // Strict improvement only, so equal scores leave the earlier declaration —
    // or the base body — in place.
    if (score > bestScore) {
      bestScore = score;
      best = variant;
    }
  }

  return best;
}

/**
 * Resolve a target's content for one audience locale.
 *
 * This is the third and last layer of resolution: shared draft, then the
 * network override (`resolveTarget`), then the locale variant here. Keeping it
 * separate from `resolveTarget` matters because the audience locale is a
 * property of the destination, which is chosen later than the network — one
 * LinkedIn override can serve a French page and a German page.
 *
 * Fields the variant leaves unset fall through to the target rather than being
 * dropped. A translator who supplied only a body should not silently lose the
 * campaign's link.
 */
export function resolveLocalisedContent(
  target: LocalisableTarget,
  audienceLocale: string | undefined,
): LocalisedContent {
  const variant = selectLocalisedVariant(target, audienceLocale);
  if (variant === undefined) {
    return {
      locale: target.locale,
      body: target.body,
      media: target.media,
      title: target.title,
      firstComment: target.firstComment,
      link: target.link,
    };
  }

  return {
    locale: variant.locale,
    // The body is taken whole. A partially translated body is not a thing that
    // exists, so there is nothing to merge here.
    body: variant.body,
    media: variant.media ?? target.media,
    title: variant.title ?? target.title,
    firstComment: variant.firstComment ?? target.firstComment,
    link: variant.link ?? target.link,
  };
}
