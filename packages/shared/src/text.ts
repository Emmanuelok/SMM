/**
 * Network-accurate text measurement.
 *
 * "Character count" means something different on every network, and getting it
 * wrong is one of the most visible failures a scheduling tool can have — a post
 * that looked fine in the composer is rejected by the API, or silently
 * truncated mid-word, hours later when nobody is watching.
 *
 * Three things make a naive `text.length` wrong:
 *
 *  - `.length` counts UTF-16 code units, so an emoji counts 2 and a flag emoji
 *    counts 4. Users count them as one.
 *  - X weights characters: Latin text counts 1, CJK and emoji count 2.
 *  - X rewrites every URL to a fixed-width t.co link, so a 300-character URL
 *    costs the same as a short one.
 *
 * Counting is therefore a per-network strategy rather than a single function.
 */

/** How a given network counts the length of a post body. */
export type TextCountingStrategy =
  /** User-perceived characters. Correct for most networks. */
  | { readonly kind: 'grapheme' }
  /** Raw UTF-16 code units — what `String.prototype.length` returns. */
  | { readonly kind: 'utf16' }
  /** Unicode code points. */
  | { readonly kind: 'codepoint' }
  /**
   * X/Twitter's weighted count: characters in the Latin-ish ranges cost 1,
   * everything else (CJK, emoji) costs 2, and URLs collapse to a fixed width.
   */
  | { readonly kind: 'x-weighted'; readonly urlWeight: number };

/**
 * Code point ranges X assigns a weight of 1. Everything outside them weighs 2.
 * Ranges are inclusive and taken from X's published counting rules.
 */
const X_LIGHT_RANGES: readonly (readonly [number, number])[] = [
  [0x0000, 0x10ff],
  [0x2000, 0x200d],
  [0x2010, 0x201f],
  [0x2032, 0x2037],
];

/**
 * Matches http(s) URLs and bare `www.`/domain-style links.
 *
 * Deliberately conservative: over-matching would under-count a post and let an
 * over-length body reach the API, which is the failure we are trying to avoid.
 */
const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>"'`]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(?:com|net|org|io|co|ai|app|dev|me|ly|gg|tv|xyz|info|biz|edu|gov)\b(?:\/[^\s<>"'`]*)?/gi;

let graphemeSegmenter: Intl.Segmenter | undefined;

function segmenter(): Intl.Segmenter {
  graphemeSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return graphemeSegmenter;
}

/** Split text into user-perceived characters. */
export function toGraphemes(text: string): string[] {
  const out: string[] = [];
  for (const { segment } of segmenter().segment(text)) out.push(segment);
  return out;
}

/** Count user-perceived characters. An emoji is 1, a ZWJ family emoji is 1. */
export function countGraphemes(text: string): number {
  let n = 0;
  for (const _ of segmenter().segment(text)) n += 1;
  return n;
}

function isLightCodePoint(cp: number): boolean {
  for (const [lo, hi] of X_LIGHT_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

/**
 * Weight of a single grapheme under X's rules.
 *
 * A multi-code-point cluster is always an emoji sequence or a combining
 * sequence; X charges 2 for those regardless of the constituent code points.
 */
function xGraphemeWeight(grapheme: string): number {
  const codePoints = [...grapheme];
  if (codePoints.length !== 1) return 2;
  const cp = grapheme.codePointAt(0);
  if (cp === undefined) return 2;
  return isLightCodePoint(cp) ? 1 : 2;
}

/**
 * X's weighted length, with URLs collapsed to their shortened width.
 *
 * URLs are extracted first so their contents are never weighted per-character.
 */
function measureXWeighted(text: string, urlWeight: number): number {
  let total = 0;
  let cursor = 0;

  URL_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index;
    if (start > cursor) {
      total += measurePlainXWeighted(text.slice(cursor, start));
    }
    total += urlWeight;
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    total += measurePlainXWeighted(text.slice(cursor));
  }
  return total;
}

function measurePlainXWeighted(text: string): number {
  let total = 0;
  for (const { segment } of segmenter().segment(text)) {
    total += xGraphemeWeight(segment);
  }
  return total;
}

/** Measure `text` the way the given network would. */
export function measureText(text: string, strategy: TextCountingStrategy): number {
  switch (strategy.kind) {
    case 'grapheme':
      return countGraphemes(text);
    case 'utf16':
      return text.length;
    case 'codepoint': {
      let n = 0;
      for (const _ of text) n += 1;
      return n;
    }
    case 'x-weighted':
      return measureXWeighted(text, strategy.urlWeight);
  }
}

/**
 * Truncate to at most `limit` units under `strategy`, never splitting a
 * grapheme.
 *
 * When `ellipsis` is supplied its own measured cost is reserved, so the result
 * including the ellipsis still fits. Returns the input unchanged when it
 * already fits.
 */
export function truncateToLimit(
  text: string,
  limit: number,
  strategy: TextCountingStrategy,
  ellipsis = '',
): string {
  if (limit <= 0) return '';
  if (measureText(text, strategy) <= limit) return text;

  const reserve = ellipsis === '' ? 0 : measureText(ellipsis, strategy);
  // Only give up entirely when the ellipsis alone cannot fit. A budget of
  // exactly zero still leaves room for it, and emitting it preserves the
  // signal that content was cut.
  if (reserve > limit) return '';
  const budget = limit - reserve;

  let out = '';
  let used = 0;
  for (const { segment } of segmenter().segment(text)) {
    const cost = measureText(segment, strategy);
    if (used + cost > budget) break;
    out += segment;
    used += cost;
  }

  // The loop above charges each grapheme on its own, which is exact only when
  // cost is additive. Under X's rules it is not: a URL collapses to a fixed
  // width however long it is, so cutting through the middle of one leaves a
  // shorter string that measures MORE than the budget the loop thought it was
  // spending — the truncated fragment still matches as a link and is charged
  // the full fixed width. The appended ellipsis can be absorbed into that match
  // too, spending the room reserved for it.
  //
  // Rather than special-case URLs, re-measure the actual candidate and shrink
  // until it genuinely fits. Without this the "shorten it for me" button hands
  // back a string that fails the very check that offered it.
  let candidate = out + ellipsis;
  while (out.length > 0 && measureText(candidate, strategy) > limit) {
    const graphemes = toGraphemes(out);
    graphemes.pop();
    out = graphemes.join('');
    candidate = out + ellipsis;
  }
  return candidate;
}

/**
 * Extract every URL from a body, in order of appearance.
 *
 * Used for link shortening, UTM tagging, and detecting the presence of a link
 * on networks that price or rank posts differently when one is present.
 */
export function extractUrls(text: string): string[] {
  URL_PATTERN.lastIndex = 0;
  return [...text.matchAll(URL_PATTERN)].map((m) => m[0]);
}

/** Whether a body contains at least one link. */
export function containsUrl(text: string): boolean {
  URL_PATTERN.lastIndex = 0;
  return URL_PATTERN.test(text);
}

/**
 * Extract `@mentions`.
 *
 * Handle syntax differs by network; this covers the common
 * `@` + alphanumeric/underscore/dot/hyphen form and is refined per adapter
 * where a network needs it.
 */
export function extractMentions(text: string): string[] {
  return [...text.matchAll(/(?:^|[^\w@])@([a-z0-9._-]{1,64})/gi)]
    .map((m) => m[1])
    .filter((h): h is string => h !== undefined);
}

/**
 * Extract `#hashtags`, including non-Latin scripts.
 *
 * Arabic, Japanese and Hindi hashtags are ordinary usage in most of the world,
 * so this matches any Unicode letter or mark rather than `[a-z]`.
 */
export function extractHashtags(text: string): string[] {
  return [...text.matchAll(/(?:^|[^\p{L}\p{N}_#])#([\p{L}\p{M}\p{N}_]{1,140})/gu)]
    .map((m) => m[1])
    .filter((h): h is string => h !== undefined);
}

/*
 * Near-duplicate detection.
 *
 * X and Facebook reject posts that are close enough to something the account
 * has already published, and neither publishes the rule they use. A scheduling
 * tool whose entire value proposition includes recycling evergreen content will
 * walk into that rule constantly: the same testimonial reposted quarterly, the
 * same product blurb with a rotated hashtag block, a queue refilled from a
 * library of fifty posts.
 *
 * Hitting it at publish time is expensive. The post is already scheduled, the
 * slot is already gone, and the failure arrives as a platform error code hours
 * later with nobody watching. Scoring similarity locally, in the composer,
 * turns that into a warning next to a body the user is already editing — the
 * cheapest possible moment to fix it.
 *
 * The score is a prediction, not a verdict. We do not know the platforms'
 * thresholds and they change them, so this is tuned to be useful rather than
 * exact, and it must never block a publish on its own.
 */

/**
 * Sequences that carry no meaning for duplicate comparison.
 *
 * Emoji are stripped along with punctuation because swapping one emoji for
 * another is the most common way a recycled post is "changed" before reposting,
 * and platforms are not fooled by it either.
 */
const EMOJI_PATTERN =
  /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1f3fb}-\u{1f3ff}\u{fe0f}\u{200d}\u{20e3}]/gu;

/** Hashtags and @mentions, including the leading sigil. */
const TAG_PATTERN = /[@#][\p{L}\p{M}\p{N}_.-]+/gu;

/** Punctuation, symbols, and invisible formatting characters. */
const NOISE_PATTERN = /[\p{P}\p{S}\p{C}]/gu;

/**
 * Reduce text to the form used for similarity comparison.
 *
 * Everything removed here is something a platform's duplicate check is known
 * or strongly believed to look past, or something that varies between two
 * copies of what a reader would call the same post:
 *
 *  - URLs, because link shorteners and UTM parameters make every repost of the
 *    same content textually distinct while changing nothing a reader sees.
 *  - Hashtags and mentions, because rotating the tag block is the standard
 *    workaround people try, and it does not work on the platforms either.
 *  - Case, punctuation, emoji and whitespace runs, because they are the
 *    difference between two drafts of the same sentence.
 *
 * NFKC here, unlike the content hash, which uses NFC. For comparison we want
 * fullwidth and halfwidth Latin, ligatures and styled letters to fold together:
 * a post retyped with fullwidth characters is the same post to a reader and to
 * a duplicate filter. For hashing we deliberately do not, because those forms
 * look different when published and an approval covers what was seen.
 *
 * Lowercasing is locale-independent by choice. `toLocaleLowerCase` under a
 * Turkish locale maps I differently, which would make two users get different
 * similarity scores for identical text.
 */
export function normalizeForComparison(text: string): string {
  URL_PATTERN.lastIndex = 0;
  return text
    .normalize('NFKC')
    .replace(URL_PATTERN, ' ')
    .replace(TAG_PATTERN, ' ')
    .toLowerCase()
    .replace(EMOJI_PATTERN, ' ')
    .replace(NOISE_PATTERN, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** Trigrams are the usual compromise: long enough to be specific, short enough to survive edits. */
const SHINGLE_SIZE = 3;

/**
 * Distinct grapheme trigrams of already-normalised text.
 *
 * Graphemes, not UTF-16 units, for the same reason the counting code uses them:
 * slicing a surrogate pair or a ZWJ sequence produces trigrams that correspond
 * to nothing, and for CJK — where three characters is roughly a phrase rather
 * than three letters — a code-unit window would straddle characters and make
 * the score meaningless on exactly the languages where duplicate detection
 * matters most.
 *
 * The single space left by normalisation is kept inside the window so that word
 * boundaries are part of the signal.
 */
function trigrams(normalized: string): ReadonlySet<string> {
  const graphemes = toGraphemes(normalized);
  const out = new Set<string>();
  for (let i = 0; i + SHINGLE_SIZE <= graphemes.length; i += 1) {
    out.add(graphemes.slice(i, i + SHINGLE_SIZE).join(''));
  }
  return out;
}

/**
 * How alike two bodies are, from 0 (nothing in common) to 1 (identical after
 * normalisation).
 *
 * Jaccard rather than Dice. Both rank pairs in the same order, so the choice
 * does not change which posts get flagged once a threshold is calibrated; what
 * it changes is the number shown to the user. Dice counts the intersection
 * twice, so two posts sharing half their trigrams read as 67% similar, whereas
 * Jaccard reports the 50% that people actually mean by "how much overlaps".
 * Since this figure appears in the composer as plain overlap, the measure that
 * matches the plain reading is the right one.
 *
 * Texts shorter than one trigram have no shingles at all, so they fall back to
 * exact comparison of the normalised form. Returning 0 for them instead would
 * miss the case of two identical one-word posts, which platforms do reject.
 */
export function similarity(a: string, b: string): number {
  const left = normalizeForComparison(a);
  const right = normalizeForComparison(b);

  // Normalisation strips URLs, hashtags, mentions and emoji, so a link-drop or
  // a hashtag-only post reduces to nothing. Two such posts are then equal as
  // empty strings and would score a perfect match despite sharing no content —
  // two entirely different product links reported as identical.
  //
  // With no prose to compare, fall back to the raw text: identical bodies are
  // still duplicates, different ones are not. Guessing similarity from an empty
  // signal is how a warning gets trained out of a team.
  if (left === '' && right === '') return a === b ? 1 : 0;

  if (left === right) return 1;

  const leftGrams = trigrams(left);
  const rightGrams = trigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) return 0;

  // Walk the smaller set: membership tests are constant time, so the cost is
  // set by whichever side we iterate.
  const leftIsSmaller = leftGrams.size <= rightGrams.size;
  const smaller = leftIsSmaller ? leftGrams : rightGrams;
  const larger = leftIsSmaller ? rightGrams : leftGrams;

  let intersection = 0;
  for (const gram of smaller) {
    if (larger.has(gram)) intersection += 1;
  }

  const union = leftGrams.size + rightGrams.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Default warning threshold.
 *
 * Set from the observed behaviour of X and Facebook rather than from theory,
 * and set low enough to be worth a warning rather than high enough to be
 * certain. Being wrong in the cautious direction costs a dismissible notice;
 * being wrong the other way costs a missed posting slot.
 */
export const NEAR_DUPLICATE_THRESHOLD = 0.85;

/**
 * Whether two bodies are close enough that a platform is likely to refuse the
 * second one.
 *
 * A predicate rather than a rule: callers warn on it, and must not block on it.
 * A tool that refuses to publish something the platform would have accepted is
 * worse than one that lets a duplicate through.
 */
export function isNearDuplicate(
  a: string,
  b: string,
  threshold = NEAR_DUPLICATE_THRESHOLD,
): boolean {
  return similarity(a, b) >= threshold;
}
