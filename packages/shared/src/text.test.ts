import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  containsUrl,
  countGraphemes,
  extractHashtags,
  extractMentions,
  extractUrls,
  measureText,
  toGraphemes,
  truncateToLimit,
  type TextCountingStrategy,
} from './text.js';

const GRAPHEME: TextCountingStrategy = { kind: 'grapheme' };
const X: TextCountingStrategy = { kind: 'x-weighted', urlWeight: 23 };

test('counts user-perceived characters, not UTF-16 units', () => {
  // A single emoji is two UTF-16 code units but one character to a user.
  assert.equal('👍'.length, 2);
  assert.equal(countGraphemes('👍'), 1);

  // A ZWJ family sequence is many code points but still one character.
  const family = '👨‍👩‍👧‍👦';
  assert.ok(family.length > 4);
  assert.equal(countGraphemes(family), 1);

  // Flags are surrogate pairs of regional indicators.
  assert.equal(countGraphemes('🇳🇬'), 1);

  // Combining marks attach to their base character.
  assert.equal(countGraphemes('é'), 1); // precomposed
  assert.equal(countGraphemes('é'), 1); // e + combining acute
});

test('splits graphemes without tearing emoji apart', () => {
  assert.deepEqual(toGraphemes('a👍b'), ['a', '👍', 'b']);
});

test('X weighting charges 1 for Latin and 2 for CJK and emoji', () => {
  assert.equal(measureText('hello', X), 5);
  // CJK sits outside the light ranges, so each character costs 2.
  assert.equal(measureText('你好', X), 4);
  assert.equal(measureText('👍', X), 2);
  // Arabic is inside the light ranges and costs 1 per character.
  assert.equal(measureText('مرحبا', X), 5);
});

test('X collapses every URL to a fixed width regardless of length', () => {
  const short = 'see https://a.co';
  const long = `see https://example.com/${'x'.repeat(300)}`;
  assert.equal(measureText(short, X), measureText(long, X));
  // "see " is 4 characters, plus the fixed 23 for the link.
  assert.equal(measureText(short, X), 27);
});

test('grapheme counting ignores URL shortening', () => {
  // Only X rewrites links; everyone else counts them literally.
  assert.equal(measureText('https://a.co', GRAPHEME), 12);
});

test('truncation never splits a grapheme', () => {
  // Truncating at 2 must not emit half a surrogate pair.
  const out = truncateToLimit('a👍b', 2, GRAPHEME);
  assert.equal(out, 'a👍');
  assert.equal(countGraphemes(out), 2);
});

test('truncation reserves room for the ellipsis', () => {
  const out = truncateToLimit('abcdefghij', 5, GRAPHEME, '…');
  assert.equal(out, 'abcd…');
  assert.equal(countGraphemes(out), 5);
});

test('truncation leaves text that already fits untouched', () => {
  assert.equal(truncateToLimit('short', 100, GRAPHEME, '…'), 'short');
});

test('truncation degrades safely at tiny limits', () => {
  assert.equal(truncateToLimit('abc', 0, GRAPHEME), '');
  // No room for anything but the ellipsis itself.
  assert.equal(truncateToLimit('abc', 1, GRAPHEME, '…'), '…');
});

test('extracts URLs in order of appearance', () => {
  assert.deepEqual(extractUrls('a https://one.com b www.two.org c'), [
    'https://one.com',
    'www.two.org',
  ]);
  assert.equal(containsUrl('no links here'), false);
  assert.equal(containsUrl('bare domain example.com counts'), true);
});

test('extracts hashtags in non-Latin scripts', () => {
  // Most of the world does not hashtag in ASCII.
  assert.deepEqual(extractHashtags('#hello #مرحبا #日本 #привет'), [
    'hello',
    'مرحبا',
    '日本',
    'привет',
  ]);
});

test('does not treat an email address as a mention', () => {
  assert.deepEqual(extractMentions('mail me at bob@example.com'), []);
  assert.deepEqual(extractMentions('hi @alice and @bob_2'), ['alice', 'bob_2']);
});
