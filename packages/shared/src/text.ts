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
  return out + ellipsis;
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
