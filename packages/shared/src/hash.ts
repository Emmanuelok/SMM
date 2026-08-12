import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';

import type { MediaAssetId } from './ids.js';

/**
 * Content hashing that binds an approval to exactly what will be published.
 *
 * An approval is a claim about a specific piece of content, not about a row id.
 * Without a hash, "approved" is just a boolean on a mutable record, and anyone
 * with edit rights can change the body after sign-off and still publish under
 * the reviewer's name. Hashing the content and storing that hash alongside the
 * approval turns the claim into something checkable at dispatch time: if the
 * hash of what we are about to send does not match the hash that was approved,
 * the content changed and the approval no longer applies.
 *
 * Two properties have to hold, and they pull in opposite directions.
 *
 *  - Stability. Two runs over the same content must produce the same hash. If
 *    an incidental difference — a CRLF from a Windows paste, a decomposed
 *    accent from a macOS keyboard, an absent field arriving as `null` on one
 *    read and `undefined` on another — changes the hash, approvals invalidate
 *    for no reason a user can see. Teams that get re-approval prompts they
 *    consider spurious stop trusting the approval system and start routing
 *    around it, which costs far more than the feature was worth.
 *
 *  - Separation. Two contents that differ in anything the audience will see
 *    must never produce the same hash. A collision here is an edit sneaking
 *    past an approval, which is the exact failure the mechanism exists to
 *    prevent. That is why the canonical form is length-framed rather than
 *    delimiter-joined: with a plain separator, a body ending in the separator
 *    could shift text into the next field and produce the same byte string as a
 *    different post.
 *
 * Canonicalisation is where both properties are decided, so it is written out
 * explicitly here rather than delegated to `JSON.stringify`, whose output
 * depends on property insertion order and is therefore not stable across code
 * paths that build the same content differently.
 */

/**
 * One attachment, reduced to the parts an audience perceives.
 *
 * Bytes, mime type and dimensions are deliberately absent: re-encoding an image
 * to a smaller file, or regenerating a rendition, does not change what the
 * reader sees and must not invalidate an approval. The asset id stands in for
 * the visual content, and the pipeline's own guarantee that an asset id is
 * immutable is what makes that sound. Alt text is included because it is
 * published text that a reviewer is accountable for.
 */
export interface PublishableMedia {
  readonly assetId: MediaAssetId;
  /** Accessibility description. Published content, so it is part of the hash. */
  readonly altText?: string | null | undefined;
}

/** A poll as the audience sees it: the options, in order, and how long it runs. */
export interface PublishablePoll {
  readonly options: readonly string[];
  readonly durationMinutes: number;
}

/**
 * The audience-visible content of a post, and nothing else.
 *
 * The excluded fields are listed in the interface rather than omitted from it,
 * because "we thought about this field and decided it does not count" is a
 * decision that has to be visible to whoever adds the next field.
 */
/**
 * Why the optional fields accept `null` as well as `undefined`.
 *
 * This content is hashed both on its way out of the composer, where an unset
 * field is `undefined`, and again at dispatch from a row read back out of the
 * database, where the same unset field is `null`. The normaliser already folds
 * the two onto one absent marker, so a type
 * that admitted only `undefined` would force every caller reading a row to strip
 * nulls first. That stripping is the failure mode this module exists to prevent:
 * it is code between the stored content and the hash of it, written separately
 * at each call site, and the day one of them misses a field the approval
 * silently invalidates for content nobody edited.
 */
export interface PublishableContent {
  /** Changing format changes the post materially, so it is hashed. */
  readonly format: string;
  readonly body: string;
  readonly title?: string | null | undefined;
  /** Ordered. Reordering a carousel changes the post, so position is hashed. */
  readonly media: readonly PublishableMedia[];
  /** Published immediately after the post, so it is part of what was approved. */
  readonly firstComment?: string | null | undefined;
  readonly link?: string | null | undefined;
  readonly poll?: PublishablePoll | null | undefined;

  /**
   * Internal-only annotation. NOT hashed.
   *
   * Nobody outside the organisation ever sees this, so a change to it cannot
   * make an approval wrong. Invalidating an approval because someone corrected
   * a typo in an internal label is precisely the friction that trains teams to
   * treat approvals as an obstacle and to batch-approve without reading.
   */
  readonly internalNotes?: string | undefined;
  /** Organisational taxonomy, invisible to the audience. NOT hashed. */
  readonly tags?: readonly string[] | undefined;
  /** Reporting grouping, invisible to the audience. NOT hashed. */
  readonly campaign?: string | undefined;
}

/**
 * ASCII unit and record separators.
 *
 * Chosen because they are control characters that cannot appear in a post body
 * after normalisation, but the framing below does not rely on that: every value
 * is preceded by its byte length, so even a value containing a separator cannot
 * be misread as a field boundary.
 */
const UNIT = '\u001f';
const RECORD = '\u001e';

/**
 * Written in a field's *length* slot when the field carries no content.
 *
 * `undefined`, `null` and `''` all mean the same thing to a reader — nothing is
 * there — but they arrive differently depending on whether the content came
 * from the composer, from a JSON round-trip through the database, or from a
 * partial update. Folding all three onto one marker is what stops a hash from
 * changing when a row is merely re-serialised.
 *
 * The marker sits in the length slot rather than standing in as a value, and
 * that placement is the whole of its safety. A sentinel value — which is what
 * this was — is forgeable: a body set to exactly the sentinel's bytes
 * canonicalises identically to an absent body, so content approved with an empty
 * field could be published with a visible one under an unchanged hash. That is
 * the edit-past-approval this module exists to stop, and the exotic-ness of the
 * bytes is no defence, because whoever wants the collision chooses the string. A
 * present value always writes a non-negative decimal byte length here, so one
 * non-digit character is a marker no value can produce.
 */
const ABSENT_LENGTH = '-';

/** A field's canonical value, or `null` when the field carries nothing. */
type FieldValue = string | null;

/**
 * Normalise a text field to its canonical form.
 *
 * NFC and not NFKC. NFC only unifies encodings of the same visible character,
 * such as a precomposed é against e plus a combining acute, which is exactly
 * the kind of difference that must not invalidate an approval. NFKC would go
 * further and fold characters that look different when published — fullwidth
 * Latin, the fi ligature, superscripts — so using it would let a visible edit
 * pass as unchanged.
 *
 * Line endings collapse to `\n` because CRLF versus LF depends on the pasting
 * client, not on the content. Trailing newlines are dropped because a reader
 * cannot see them on any network. Internal whitespace is left alone: a blank
 * line between paragraphs and a run of spaces used for layout are both visible
 * in the rendered post, so collapsing them would let a real edit through.
 */
function normalizeField(value: string | null | undefined): FieldValue {
  if (value === undefined || value === null) return null;
  const normalized = value.replace(/\r\n?/g, '\n').replace(/\n+$/, '').normalize('NFC');
  return normalized === '' ? null : normalized;
}

/**
 * Emit one length-framed field.
 *
 * The byte length, not the character count, because the hash is taken over
 * bytes and two different strings with the same character count must still be
 * unambiguously framed.
 *
 * An absent field emits its name and the absent marker with no value at all,
 * which is why absence cannot be spelled by any value: there is no value slot
 * to spell it in.
 */
function field(name: string, value: FieldValue): string {
  return value === null
    ? `${name}${UNIT}${ABSENT_LENGTH}${RECORD}`
    : `${name}${UNIT}${String(Buffer.byteLength(value, 'utf8'))}${UNIT}${value}${RECORD}`;
}

/**
 * The exact byte string that gets hashed.
 *
 * Exported because the first question asked when an approval invalidates
 * unexpectedly is "what actually differed", and comparing two canonical forms
 * answers it in seconds. Diffing two hex digests answers nothing.
 *
 * Field order is fixed here and must not be reordered: the order is part of the
 * hash, so changing it silently invalidates every approval already stored.
 */
export function canonicalContent(input: PublishableContent): string {
  let out = '';

  out += field('format', normalizeField(input.format));
  out += field('body', normalizeField(input.body));
  out += field('title', normalizeField(input.title));
  out += field('link', normalizeField(input.link));
  out += field('firstComment', normalizeField(input.firstComment));

  // The count is framed separately from the entries so that a post with one
  // image cannot canonicalise to the same bytes as a post with none.
  out += field('mediaCount', String(input.media.length));
  for (const [index, item] of input.media.entries()) {
    // Position is emitted explicitly rather than left implicit in the ordering,
    // so that swapping two carousel slides changes the hash. On a carousel the
    // order is the story; a reviewer approved a specific sequence.
    out += field(`media.${String(index)}.assetId`, normalizeField(item.assetId));
    out += field(`media.${String(index)}.altText`, normalizeField(item.altText));
  }

  // `null` is checked alongside `undefined` for the same reason the text fields
  // fold them together: a post with no poll arrives as one or the other
  // depending on whether it came from the composer or from a database row, and
  // reading `.durationMinutes` off the null would throw on the dispatch path —
  // the one place this function is called when it matters most.
  if (input.poll === undefined || input.poll === null) {
    out += field('poll', null);
  } else {
    out += field('poll.durationMinutes', String(input.poll.durationMinutes));
    out += field('poll.optionCount', String(input.poll.options.length));
    for (const [index, option] of input.poll.options.entries()) {
      // Poll options are order-sensitive for the same reason carousels are:
      // the first option is the one most people click.
      out += field(`poll.${String(index)}`, normalizeField(option));
    }
  }

  // internalNotes, tags and campaign are intentionally not emitted. See the
  // field documentation on PublishableContent for why.
  return out;
}

/**
 * Hash the audience-visible content of a post.
 *
 * SHA-256, hex. The output is stored on the approval record and recomputed at
 * dispatch; a mismatch means the content moved after sign-off and the post must
 * not go out on the strength of that approval.
 */
export function contentHash(input: PublishableContent): string {
  return createHash('sha256').update(canonicalContent(input), 'utf8').digest('hex');
}

/**
 * Compare two content hashes in constant time.
 *
 * The comparison is not merely an equality check on internal data. It gates a
 * compliance decision — whether reviewed content may be published — and it is
 * reachable from an unauthenticated reviewer link, so an attacker can drive it
 * as often as they like without an account. `===` on strings stops at the first
 * differing character, and that timing difference is enough to recover a target
 * hash character by character over many attempts. With the hash recovered,
 * edited content can be presented as approved content.
 *
 * Lengths are compared first and non-constant-time, which is safe: a SHA-256
 * hex digest is always 64 characters, so the length carries no secret. Doing so
 * is also required, because `timingSafeEqual` throws on differing lengths.
 */
export function hashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
