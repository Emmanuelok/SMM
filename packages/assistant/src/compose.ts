import { capabilitiesFor, type NetworkId } from '@smm/adapters';
import { measureText, similarity, truncateToLimit, type TextCountingStrategy } from '@smm/shared';

import { bannedTermsIn, voicePrefix, type BrandVoice } from './voice.js';
import type { AssistantProvider } from './provider.js';

/**
 * Writing a post that the network will actually accept.
 *
 * The reason this is not a thin wrapper around a chat box is that a caption is
 * not free text — it is text that has to survive a specific network's counting
 * rules. A model asked for "under 300 characters" will hand back something
 * that is 300 characters by its own reckoning and 340 by X's, because X counts
 * CJK and emoji as two and rewrites every URL to a fixed 23. Discovering that
 * at publish time, hours later, is the failure mode.
 *
 * So every candidate is measured with exactly the same function the composer
 * and the pre-publish check use, and one that does not fit is rejected here
 * rather than shipped hopefully. What the caller gets back is text that is
 * already known to be publishable.
 */

export interface DraftRequest {
  /** What the post should be about, in the user's own words. */
  readonly brief: string;
  readonly network: NetworkId;
  readonly voice: BrandVoice;
  /** How many options to offer. */
  readonly variants: number;
  /**
   * Recent posts from this brand, for novelty.
   *
   * Passed in rather than fetched, so this stays pure and testable. The caller
   * decides what "recent" means — it is a product question, not this one.
   */
  readonly recentPosts?: readonly string[] | undefined;
}

export interface Draft {
  readonly text: string;
  /** Length by the network's own counting rules, not by `String.length`. */
  readonly length: number;
  readonly limit: number;
  /**
   * How close this is to the most similar recent post, 0 to 1.
   *
   * Reported rather than enforced. An agency reposting an evergreen tip on
   * purpose is not making a mistake, and a tool that silently refuses it is
   * wrong more often than the tool that mentions it.
   */
  readonly novelty: number;
  /** The recent post this most resembles, when that is worth knowing. */
  readonly closestTo?: string | undefined;
}

export type DraftFailure =
  /** No model configured. Every other feature still works. */
  | 'not_configured'
  /** The network is not one we hold a capability descriptor for. */
  | 'unknown_network'
  /** The model answered, but nothing it produced was publishable. */
  | 'no_usable_draft'
  /** The model call itself failed. */
  | 'provider_failed';

export type DraftResult =
  | { readonly ok: true; readonly drafts: readonly Draft[]; readonly model: string }
  | { readonly ok: false; readonly reason: DraftFailure; readonly message: string };

/**
 * Novelty against a corpus: 1 is entirely new, 0 is a verbatim repeat.
 *
 * Built on the same similarity function the duplicate check uses, so "this is
 * a near-duplicate" means the same thing here as it does at publish time. Two
 * different notions of similarity in one product is how a post gets suggested
 * by one screen and refused by the next.
 */
export function noveltyAgainst(
  text: string,
  corpus: readonly string[],
): { novelty: number; closest?: string | undefined } {
  let worst = 0;
  let closest: string | undefined;

  for (const existing of corpus) {
    const score = similarity(text, existing);
    if (score > worst) {
      worst = score;
      closest = existing;
    }
  }

  return {
    novelty: 1 - worst,
    // Only named when it is close enough to be worth looking at. Reporting the
    // "closest" of a set of unrelated posts is noise dressed as insight.
    ...(worst >= 0.5 && closest !== undefined ? { closest } : {}),
  };
}

/** The counting rule and ceiling this network applies to a plain post. */
function textBudget(
  network: NetworkId,
): { limit: number; strategy: TextCountingStrategy } | undefined {
  const caps = capabilitiesFor(network);
  if (caps === undefined) return undefined;

  const format = caps.formats.find((f) => f.format === 'text') ?? caps.formats[0];
  if (format === undefined) return undefined;

  return { limit: format.text.maxLength, strategy: format.text.counting };
}

/**
 * Build the instruction. Everything here varies per request by construction —
 * anything stable belongs in the prefix, or the prompt cache never hits.
 */
export function draftInstruction(request: DraftRequest, limit: number): string {
  const lines = [
    `Write ${request.variants} different social media posts about this:`,
    '',
    request.brief,
    '',
    `Each must be under ${limit} characters as ${request.network} counts them.`,
    'Return only the posts themselves, one per line, with no numbering, no labels, ' +
      'no surrounding quotes and no commentary.',
  ];

  if (request.recentPosts !== undefined && request.recentPosts.length > 0) {
    lines.push(
      '',
      'This brand recently published the posts below. Do not repeat their angle or ' +
        'their opening — say something the brand has not just said:',
      ...request.recentPosts.slice(0, 10).map((post) => `— ${post}`),
    );
  }

  return lines.join('\n');
}

/**
 * Split a model's reply into candidate posts.
 *
 * Models add numbering, bullets and wrapping quotes however firmly they are
 * told not to, and a caption that ships with a leading "1. " is worse than no
 * caption at all — it looks like a bug to whoever sees it on the feed.
 */
export function splitCandidates(reply: string): readonly string[] {
  return reply
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    // Leading list markers of every shape a model reaches for.
    .map((line) => line.replace(/^(?:[-*•]|\d+[.)])\s+/, ''))
    // Wrapping quotes, but only when they wrap the whole line — a post that
    // legitimately opens and closes with quoted speech must survive.
    .map((line) =>
      /^["'“”]/.test(line) && /["'“”]$/.test(line) && line.length > 2
        ? line.slice(1, -1).trim()
        : line,
    )
    .filter((line) => line !== '');
}

export interface DraftOptions {
  readonly provider?: AssistantProvider | undefined;
  /**
   * Whether an over-length draft may be trimmed rather than discarded.
   *
   * Off by default. A truncated caption reads as broken, and offering three
   * good options beats offering five of which two end mid-sentence.
   */
  readonly trimOverLength?: boolean;
}

export async function draftPosts(
  request: DraftRequest,
  options: DraftOptions = {},
): Promise<DraftResult> {
  const { provider } = options;
  if (provider === undefined) {
    return {
      ok: false,
      reason: 'not_configured',
      message:
        'No writing model is configured for this deployment. Everything else works; ' +
        'set ASSISTANT_API_KEY to turn this on.',
    };
  }

  const budget = textBudget(request.network);
  if (budget === undefined) {
    return {
      ok: false,
      reason: 'unknown_network',
      message: `Nothing is known about ${request.network}'s limits, so a draft cannot be checked against them.`,
    };
  }

  let reply: string;
  try {
    const result = await provider.complete({
      prefix: voicePrefix(request.voice),
      instruction: draftInstruction(request, budget.limit),
      // Room for the requested variants plus the overhead models add. Generous
      // because truncating the *response* costs a whole variant.
      maxOutputTokens: Math.min(4_000, 200 + request.variants * 200),
      variants: request.variants,
    });
    reply = result.texts.join('\n');
  } catch (error) {
    return {
      ok: false,
      reason: 'provider_failed',
      message: error instanceof Error ? error.message : 'The writing model did not answer.',
    };
  }

  const corpus = request.recentPosts ?? [];
  const drafts: Draft[] = [];
  const seen = new Set<string>();

  for (const candidate of splitCandidates(reply)) {
    // Banned terms are enforced here, not merely requested in the prompt. A
    // model told not to say a word says it anyway often enough that treating
    // the instruction as the control would be negligent.
    if (bannedTermsIn(candidate, request.voice).length > 0) continue;

    let text = candidate;
    let length = measureText(text, budget.strategy);

    if (length > budget.limit) {
      if (options.trimOverLength !== true) continue;
      text = truncateToLimit(text, budget.limit, budget.strategy);
      length = measureText(text, budget.strategy);
    }

    // A model asked for five variants routinely returns two that differ by a
    // comma. Offering both wastes the reader's attention.
    const key = text.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);

    const { novelty, closest } = noveltyAgainst(text, corpus);
    drafts.push({
      text,
      length,
      limit: budget.limit,
      novelty,
      ...(closest === undefined ? {} : { closestTo: closest }),
    });

    if (drafts.length >= request.variants) break;
  }

  if (drafts.length === 0) {
    return {
      ok: false,
      reason: 'no_usable_draft',
      message:
        `Nothing the model wrote fits ${request.network}'s limits or this brand's rules. ` +
        'Try a more specific brief.',
    };
  }

  // Most novel first: the reason to ask for options is to find the one that is
  // not the thing you would have written anyway.
  return {
    ok: true,
    drafts: [...drafts].sort((a, b) => b.novelty - a.novelty),
    model: provider.name,
  };
}
