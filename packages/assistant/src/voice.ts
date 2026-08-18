/**
 * Brand voice, as data.
 *
 * Stored per profile group rather than per organization, because the customer
 * this is built for is an agency: one workspace, twelve clients, and a voice
 * that must not leak between them. A voice defined at the organization level
 * would make "write like our client" mean "write like whichever client we
 * described last", and the first time a law firm's post reads like a
 * skateboard brand's is the last time that agency uses the feature.
 *
 * Everything here is pure. Turning a voice into a prompt is a total function
 * over data, which means the exact text sent to a model is inspectable in a
 * test rather than assembled somewhere inside a network call.
 */

/** How formal the writing should be, on a scale people can actually answer. */
export type Formality = 'casual' | 'conversational' | 'professional' | 'formal';

export interface BrandVoice {
  /** A sentence or two in the operator's own words. The highest-signal field. */
  readonly description?: string | undefined;
  readonly formality?: Formality | undefined;
  /** Adjectives the writing should earn: "warm", "precise", "irreverent". */
  readonly traits?: readonly string[] | undefined;
  /**
   * Words and phrases that must never appear.
   *
   * Enforced after generation as well as asked for in the prompt. A model
   * instructed not to say something still says it often enough that treating
   * the instruction as the control would be negligent — this is the field most
   * likely to carry a legal or compliance constraint.
   */
  readonly bannedTerms?: readonly string[] | undefined;
  /** Whether emoji are welcome. Absent means the model decides. */
  readonly emoji?: 'none' | 'sparing' | 'liberal' | undefined;
  /** Examples of past posts that read right. Worth more than any adjective. */
  readonly samples?: readonly string[] | undefined;
}

/** An empty voice is valid: it means "no house style stated". */
export const NO_VOICE: BrandVoice = {};

/**
 * Read a voice out of the jsonb column without trusting its shape.
 *
 * The column is `jsonb` and has been writable since the first migration, so it
 * may hold anything — including data written by an older version of this code.
 * Every field is checked individually and a bad one is dropped rather than
 * failing the whole read: a malformed `traits` array should cost the traits,
 * not the description.
 */
export function parseBrandVoice(value: unknown): BrandVoice {
  if (typeof value !== 'object' || value === null) return NO_VOICE;
  const raw = value as Record<string, unknown>;

  const strings = (input: unknown, max: number): readonly string[] | undefined => {
    if (!Array.isArray(input)) return undefined;
    const items = input
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .slice(0, max);
    return items.length > 0 ? items : undefined;
  };

  const formality =
    raw['formality'] === 'casual' ||
    raw['formality'] === 'conversational' ||
    raw['formality'] === 'professional' ||
    raw['formality'] === 'formal'
      ? raw['formality']
      : undefined;

  const emoji =
    raw['emoji'] === 'none' || raw['emoji'] === 'sparing' || raw['emoji'] === 'liberal'
      ? raw['emoji']
      : undefined;

  const description =
    typeof raw['description'] === 'string' && raw['description'].trim() !== ''
      ? raw['description'].trim().slice(0, 2_000)
      : undefined;

  return {
    ...(description === undefined ? {} : { description }),
    ...(formality === undefined ? {} : { formality }),
    ...(emoji === undefined ? {} : { emoji }),
    ...(strings(raw['traits'], 12) === undefined ? {} : { traits: strings(raw['traits'], 12) }),
    ...(strings(raw['bannedTerms'], 200) === undefined
      ? {}
      : { bannedTerms: strings(raw['bannedTerms'], 200) }),
    // Capped hard: samples go into a cached prompt prefix, and an operator who
    // pastes their entire back catalogue would make every request expensive
    // for everyone sharing that cache.
    ...(strings(raw['samples'], 10) === undefined ? {} : { samples: strings(raw['samples'], 10) }),
  };
}

/** Whether a voice says anything at all. */
export function hasVoice(voice: BrandVoice): boolean {
  return (
    voice.description !== undefined ||
    voice.formality !== undefined ||
    voice.emoji !== undefined ||
    (voice.traits?.length ?? 0) > 0 ||
    (voice.samples?.length ?? 0) > 0
  );
}

const FORMALITY_GUIDANCE: Readonly<Record<Formality, string>> = {
  casual: 'Write the way you would text a friend. Contractions, short sentences, no throat-clearing.',
  conversational: 'Write the way you would speak to a colleague you like. Plain, warm, unstuffy.',
  professional: 'Write clearly and precisely, without jargon or slang. Assume a busy, informed reader.',
  formal: 'Write in complete, measured sentences. No contractions, no slang, no exclamation marks.',
};

const EMOJI_GUIDANCE: Readonly<Record<NonNullable<BrandVoice['emoji']>, string>> = {
  none: 'Use no emoji at all.',
  sparing: 'At most one emoji, and only where it genuinely adds something.',
  liberal: 'Emoji are welcome where they fit naturally.',
};

/**
 * The stable part of the prompt for a given brand.
 *
 * Deliberately separated from the request-specific part so it can be sent as a
 * cached prefix. The economics depend on it: the same 2,000-token brand block
 * is re-sent on every generation for that brand, and caching it is the
 * difference between a caption costing a rounding error and costing enough to
 * meter. Anything that varies per request must stay out of this string, or the
 * cache never hits.
 */
export function voicePrefix(voice: BrandVoice): string {
  if (!hasVoice(voice)) {
    return 'No house style has been described for this brand. Write plainly and avoid marketing clichés.';
  }

  const parts: string[] = ['You are writing social media posts for one specific brand.'];

  if (voice.description !== undefined) {
    parts.push(`The brand describes its own voice like this:\n${voice.description}`);
  }
  if (voice.traits !== undefined && voice.traits.length > 0) {
    parts.push(`The writing should read as: ${voice.traits.join(', ')}.`);
  }
  if (voice.formality !== undefined) {
    parts.push(FORMALITY_GUIDANCE[voice.formality]);
  }
  if (voice.emoji !== undefined) {
    parts.push(EMOJI_GUIDANCE[voice.emoji]);
  }
  if (voice.bannedTerms !== undefined && voice.bannedTerms.length > 0) {
    parts.push(`Never use these words or phrases: ${voice.bannedTerms.join(', ')}.`);
  }
  if (voice.samples !== undefined && voice.samples.length > 0) {
    parts.push(
      'Here are posts this brand has published before. Match their rhythm and register, ' +
        'not their subject matter:\n' +
        voice.samples.map((sample) => `— ${sample}`).join('\n'),
    );
  }

  return parts.join('\n\n');
}

/**
 * Banned terms actually present in a piece of text.
 *
 * Checked after generation, not merely asked for in the prompt. A model told
 * not to say a word says it anyway often enough that relying on the instruction
 * would be negligent — and this is the field most likely to carry a compliance
 * constraint somebody signed off on.
 *
 * Matched on word boundaries so that banning "AI" does not flag "said", and
 * case-insensitively because the constraint is about the word, not its casing.
 */
export function bannedTermsIn(text: string, voice: BrandVoice): readonly string[] {
  const banned = voice.bannedTerms ?? [];
  if (banned.length === 0) return [];

  const found: string[] = [];
  for (const term of banned) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A multi-word phrase gets boundaries at each end rather than around each
    // word, so "free trial" matches the phrase and not either word alone.
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
    if (pattern.test(text)) found.push(term);
  }
  return found;
}
