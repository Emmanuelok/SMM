import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { bannedTermsIn, hasVoice, parseBrandVoice, voicePrefix } from './voice.js';

/**
 * Brand voice comes out of a jsonb column that has been writable since the
 * first migration, so it may hold anything — including whatever an older
 * version of this code put there. Every test here is about surviving that.
 */

test('a well-formed voice round-trips', () => {
  const voice = parseBrandVoice({
    description: 'Warm, plain-spoken, never salesy.',
    formality: 'conversational',
    traits: ['warm', 'precise'],
    bannedTerms: ['guaranteed'],
    emoji: 'sparing',
    samples: ['We shipped the new checkout today.'],
  });

  assert.equal(voice.description, 'Warm, plain-spoken, never salesy.');
  assert.equal(voice.formality, 'conversational');
  assert.deepEqual(voice.traits, ['warm', 'precise']);
  assert.equal(voice.emoji, 'sparing');
});

test('nothing at all is a valid voice', () => {
  // "No house style stated" is the common case and must not be an error.
  for (const input of [null, undefined, 'a string', 42, []]) {
    const voice = parseBrandVoice(input);
    assert.equal(hasVoice(voice), false);
  }
  assert.match(voicePrefix(parseBrandVoice(null)), /No house style/);
});

test('one malformed field costs that field, not the whole voice', () => {
  // A bad traits array should not take the description with it — the
  // description is the highest-signal field and the one a person actually
  // wrote.
  const voice = parseBrandVoice({
    description: 'Warm and direct.',
    traits: 'not an array',
    formality: 'jaunty',
    emoji: 'yes please',
  });

  assert.equal(voice.description, 'Warm and direct.');
  assert.equal(voice.traits, undefined);
  assert.equal(voice.formality, undefined, 'an unknown formality is dropped, not passed through');
  assert.equal(voice.emoji, undefined);
});

test('non-string entries inside an array are dropped individually', () => {
  const voice = parseBrandVoice({ traits: ['warm', 42, null, '  precise  ', ''] });
  assert.deepEqual(voice.traits, ['warm', 'precise']);
});

test('samples are capped', () => {
  // Samples go into a cached prompt prefix. An operator who pastes their
  // entire back catalogue would make every request expensive for everyone
  // sharing that cache.
  const voice = parseBrandVoice({ samples: Array.from({ length: 50 }, (_, i) => `Post ${i}`) });
  assert.equal(voice.samples?.length, 10);
});

test('the prefix carries every stated part of the voice', () => {
  const prefix = voicePrefix(
    parseBrandVoice({
      description: 'Warm, plain-spoken, never salesy.',
      formality: 'formal',
      traits: ['precise'],
      bannedTerms: ['synergy'],
      emoji: 'none',
      samples: ['A sample post.'],
    }),
  );

  assert.match(prefix, /Warm, plain-spoken/);
  assert.match(prefix, /precise/);
  assert.match(prefix, /no contractions/i);
  assert.match(prefix, /no emoji at all/i);
  assert.match(prefix, /synergy/);
  assert.match(prefix, /A sample post/);
});

test('banned terms match whole words, case-insensitively', () => {
  const voice = parseBrandVoice({ bannedTerms: ['AI', 'free trial'] });

  assert.deepEqual(bannedTermsIn('Our ai writes the copy', voice), ['AI']);
  assert.deepEqual(bannedTermsIn('Start your FREE TRIAL today', voice), ['free trial']);

  // The reason word boundaries matter: banning "AI" must not reject ordinary
  // English containing those letters.
  assert.deepEqual(bannedTermsIn('She said it again, plainly', voice), []);
  assert.deepEqual(bannedTermsIn('The trial was free of charge', voice), []);
});

test('a banned term containing regex characters is treated as text', () => {
  // Someone will ban "C++" or "50% off", and a naive regex build would either
  // throw or match something unrelated.
  const voice = parseBrandVoice({ bannedTerms: ['C++', '50% off'] });
  assert.deepEqual(bannedTermsIn('We rewrote it in C++ last year', voice), ['C++']);
  assert.deepEqual(bannedTermsIn('Everything 50% off', voice), ['50% off']);
  assert.deepEqual(bannedTermsIn('We rewrote it in Rust', voice), []);
});

test('no banned terms means nothing to check', () => {
  assert.deepEqual(bannedTermsIn('anything at all', parseBrandVoice({})), []);
});
