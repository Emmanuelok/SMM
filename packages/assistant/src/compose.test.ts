import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { draftInstruction, draftPosts, noveltyAgainst, splitCandidates } from './compose.js';
import type { AssistantProvider, CompletionRequest } from './provider.js';
import type { BrandVoice } from './voice.js';

/**
 * The assistant is only worth having if what it hands back is publishable.
 *
 * Most of what is tested here is the checking, not the generating: that a
 * caption too long for the network never reaches the user, that a banned term
 * is caught after generation rather than merely asked about, and that the
 * deployment without a model key still works.
 */

/** A model that says whatever the test says, and records what it was asked. */
function stubProvider(reply: string): AssistantProvider & { last?: CompletionRequest } {
  const provider = {
    name: 'stub',
    async complete(request: CompletionRequest) {
      provider.last = request;
      return { texts: [reply] };
    },
  } as AssistantProvider & { last?: CompletionRequest };
  return provider;
}

const NO_VOICE: BrandVoice = {};

test('nothing over the network limit is offered', async () => {
  // Bluesky's limit is 300. A model asked for "under 300" routinely returns
  // 340 — and the failure would otherwise surface hours later at publish time.
  const tooLong = 'x'.repeat(340);
  const fine = 'A post that comfortably fits.';

  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 3 },
    { provider: stubProvider(`${tooLong}\n${fine}`) },
  );

  assert.ok(result.ok);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0]?.text, fine);
  assert.ok(result.drafts[0]!.length <= result.drafts[0]!.limit);
});

test('length is measured by the network’s rules, not by String.length', async () => {
  // X counts CJK as two characters. Two hundred CJK characters is 200 by
  // JavaScript's reckoning and 400 by X's — over its 280 limit either way it
  // is counted, but only one of those two numbers is the one X applies.
  const cjk = '字'.repeat(200);
  const result = await draftPosts(
    { brief: 'anything', network: 'x', voice: NO_VOICE, variants: 1 },
    { provider: stubProvider(cjk) },
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'no_usable_draft');
});

test('a banned term is caught after generation, not just asked about', async () => {
  // The field most likely to carry a compliance constraint somebody signed
  // off on. A model told not to say a word says it anyway often enough that
  // treating the instruction as the control would be negligent.
  const voice: BrandVoice = { bannedTerms: ['guaranteed', 'risk free'] };
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice, variants: 3 },
    {
      provider: stubProvider(
        'Returns are guaranteed.\nThis is risk free.\nA claim we can actually stand behind.',
      ),
    },
  );

  assert.ok(result.ok);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0]?.text, 'A claim we can actually stand behind.');
});

test('a banned term is matched as a word, not as a substring', async () => {
  // Banning "AI" must not reject "said" or "again". The constraint is about
  // the word; a substring match would make the feature unusable.
  const voice: BrandVoice = { bannedTerms: ['AI'] };
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice, variants: 2 },
    { provider: stubProvider('She said it again yesterday.\nOur AI does the work.') },
  );

  assert.ok(result.ok);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0]?.text, 'She said it again yesterday.');
});

test('near-identical variants are collapsed', async () => {
  // A model asked for five options routinely returns two that differ by a
  // comma. Offering both spends the reader's attention for nothing.
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 3 },
    { provider: stubProvider('Ship it today.\nShip it today.\nShip it tomorrow.') },
  );

  assert.ok(result.ok);
  assert.equal(result.drafts.length, 2);
});

test('list markers and wrapping quotes are stripped', () => {
  // A caption that ships with a leading "1. " looks like a bug to whoever
  // sees it on the feed.
  assert.deepEqual(splitCandidates('1. First\n2) Second\n- Third\n• Fourth'), [
    'First',
    'Second',
    'Third',
    'Fourth',
  ]);
  assert.deepEqual(splitCandidates('"Quoted whole"'), ['Quoted whole']);
});

test('a post that legitimately opens and closes with quoted speech survives', () => {
  // Only wrapping quotes are stripped, and only when they wrap everything.
  assert.deepEqual(splitCandidates('She said "yes" and left'), ['She said "yes" and left']);
});

test('novelty reports repetition rather than refusing it', async () => {
  const recent = ['Our summer sale starts today. Twenty percent off everything.'];
  const result = await draftPosts(
    {
      brief: 'summer sale',
      network: 'bluesky',
      voice: NO_VOICE,
      variants: 2,
      recentPosts: recent,
    },
    {
      provider: stubProvider(
        'Our summer sale starts today. Twenty percent off everything.\n' +
          'We spent a year rebuilding the checkout. Here is what changed.',
      ),
    },
  );

  assert.ok(result.ok);
  // An agency reposting an evergreen tip on purpose is not making a mistake,
  // so the repeat is still offered — ranked last, and named.
  assert.equal(result.drafts.length, 2);
  assert.ok(result.drafts[0]!.novelty > result.drafts[1]!.novelty, 'the fresh one ranks first');
  assert.ok(result.drafts[1]!.novelty < 0.2, 'a verbatim repeat scores near zero');
  assert.equal(result.drafts[1]?.closestTo, recent[0]);
});

test('novelty against an empty corpus is total', () => {
  const { novelty, closest } = noveltyAgainst('Anything at all', []);
  assert.equal(novelty, 1);
  assert.equal(closest, undefined);
});

test('an unrelated closest post is not named', () => {
  // Reporting the "closest" of a set of unrelated posts is noise dressed as
  // insight, so it is only named once it is close enough to look at.
  const { novelty, closest } = noveltyAgainst('The checkout is faster now', [
    'Happy Friday everyone',
  ]);
  assert.ok(novelty > 0.5);
  assert.equal(closest, undefined);
});

test('a deployment with no model configured still answers, and says why', async () => {
  // The AI panel being off must not look like a broken product. Everything
  // else in this system works without a model key.
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 3 },
    {},
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'not_configured');
  assert.match(result.ok === false ? result.message : '', /ASSISTANT_API_KEY/);
});

test('a network we know nothing about is refused rather than guessed at', async () => {
  const result = await draftPosts(
    { brief: 'anything', network: 'nonesuch' as 'bluesky', voice: NO_VOICE, variants: 1 },
    { provider: stubProvider('Something') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'unknown_network');
});

test('a model that fails is reported, not thrown', async () => {
  const provider: AssistantProvider = {
    name: 'broken',
    async complete() {
      throw new Error('the model is having a day');
    },
  };
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 1 },
    { provider },
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'provider_failed');
  assert.match(result.ok === false ? result.message : '', /having a day/);
});

test('over-length drafts can be trimmed when the caller asks for it', async () => {
  const result = await draftPosts(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 1 },
    { provider: stubProvider('y'.repeat(400)), trimOverLength: true },
  );

  assert.ok(result.ok);
  assert.ok(result.drafts[0]!.length <= 300);
});

test('the brand block and the request are sent as separate spans', async () => {
  // The prefix is identical on every request for a brand, and keeping it
  // separate is what lets a provider cache it. Anything request-specific
  // leaking into it means the cache never hits and every caption pays full
  // price for the same 2,000 tokens.
  const provider = stubProvider('A post.');
  await draftPosts(
    {
      brief: 'launch day',
      network: 'bluesky',
      voice: { description: 'Warm and direct.' },
      variants: 1,
    },
    { provider },
  );

  assert.ok(provider.last);
  assert.match(provider.last.prefix, /Warm and direct/);
  assert.equal(/launch day/.test(provider.last.prefix), false, 'the brief must stay out of the prefix');
  assert.match(provider.last.instruction, /launch day/);
});

test('the instruction states the network’s real limit', () => {
  const instruction = draftInstruction(
    { brief: 'anything', network: 'bluesky', voice: NO_VOICE, variants: 2 },
    300,
  );
  assert.match(instruction, /under 300 characters/);
  assert.match(instruction, /bluesky/);
});

test('recent posts are given to the model so it does not repeat them', () => {
  const instruction = draftInstruction(
    {
      brief: 'anything',
      network: 'bluesky',
      voice: NO_VOICE,
      variants: 1,
      recentPosts: ['We shipped the new checkout'],
    },
    300,
  );
  assert.match(instruction, /We shipped the new checkout/);
});
