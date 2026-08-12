import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  NEAR_DUPLICATE_THRESHOLD,
  isNearDuplicate,
  normalizeForComparison,
  similarity,
} from './text.js';

/**
 * Near-duplicate detection.
 *
 * The thing being tested is a prediction, not a rule: X and Facebook refuse
 * posts close enough to something the account already published, and neither
 * publishes the threshold it uses. So these tests pin the behaviour that the
 * check is designed around — that the edits people actually make when recycling
 * a post do not hide it — rather than exact scores, which are tuning.
 */

test('identical text scores 1', () => {
  assert.equal(similarity('Our spring sale starts on Monday.', 'Our spring sale starts on Monday.'), 1);
});

test('similarity is symmetric', () => {
  const a = 'Our spring sale starts on Monday, with 20% off everything.';
  const b = 'Our spring sale starts on Tuesday, with 20% off everything.';
  assert.equal(similarity(a, b), similarity(b, a));
});

test('scores stay within 0 and 1', () => {
  const pairs: readonly (readonly [string, string])[] = [
    ['', ''],
    ['a', ''],
    ['hello world', 'goodbye moon'],
    ['同じ投稿です', '同じ投稿です'],
  ];
  for (const [a, b] of pairs) {
    const score = similarity(a, b);
    assert.ok(score >= 0 && score <= 1, `${score} out of range for ${a}/${b}`);
  }
});

test('a rotated hashtag block does not hide a repost', () => {
  // The standard workaround people try. It does not work on the platforms
  // either, so a checker fooled by it would be worse than useless: it would
  // tell the user the post is safe immediately before the platform refuses it.
  const original = 'New guide on onboarding remote teams. #remotework #hiring #hr';
  const rotated = 'New guide on onboarding remote teams. #distributedteams #talent #people';
  assert.equal(similarity(original, rotated), 1);
  assert.equal(isNearDuplicate(original, rotated), true);
});

test('a fresh UTM parameter does not hide a repost', () => {
  const first = 'Read the full write-up here https://example.com/post?utm_campaign=jan';
  const second = 'Read the full write-up here https://example.com/post?utm_campaign=feb';
  assert.equal(similarity(first, second), 1);
});

test('a link swapped for its shortened form does not hide a repost', () => {
  const long = 'Our results are in: https://example.com/2026/annual-report';
  const short = 'Our results are in: https://exmpl.co/x7Fq2';
  assert.equal(similarity(long, short), 1);
});

test('swapping emoji does not hide a repost', () => {
  const first = '🎉 Doors open at nine. See you there 🙌';
  const second = '🚀 Doors open at nine. See you there 👋';
  assert.equal(similarity(first, second), 1);
});

test('retyping in fullwidth characters does not hide a repost', () => {
  // NFKC folding is applied for comparison — unlike the content hash, where the
  // same fold would let a visible edit pass as approved content.
  assert.equal(similarity('SALE TODAY', 'ＳＡＬＥ ＴＯＤＡＹ'), 1);
});

test('case and punctuation differences do not hide a repost', () => {
  assert.equal(similarity('Doors open at nine!', 'doors open at nine'), 1);
});

test('genuinely different posts score far below the threshold', () => {
  const score = similarity(
    'Our spring sale starts on Monday with 20% off everything in store.',
    'We are hiring a senior backend engineer to join the payments team.',
  );
  assert.ok(score < 0.2, `expected an unrelated pair to score low, got ${score}`);
});

test('changing one detail of a recycled post does not defeat the check', () => {
  const monday =
    'Our spring sale starts on Monday with 20% off everything in store. Come early, because the best pieces go first and we cannot hold stock over the weekend.';
  const tuesday = monday.replace('Monday', 'Tuesday');
  assert.ok(
    isNearDuplicate(monday, tuesday),
    `a date swap must not defeat the check (scored ${similarity(monday, tuesday)})`,
  );
});

test('the same edit to a one-line post falls under the threshold, by construction', () => {
  // Trigram overlap is proportional: swapping a six-letter word out of 66
  // characters removes roughly a sixth of the shingles, which lands at ~0.83 and
  // does not warn at the default 0.85.
  //
  // Pinned deliberately rather than tuned away. The threshold is calibrated
  // against observed platform behaviour, and lowering it so that this case
  // warns would make every second post in a campaign of short, formulaic
  // announcements warn too — which is how a warning gets trained out of a team.
  // A missed warning costs a dismissible notice's worth of value; a warning
  // nobody reads costs the whole feature.
  const monday = 'Our spring sale starts on Monday with 20% off everything in store.';
  const tuesday = monday.replace('Monday', 'Tuesday');
  const score = similarity(monday, tuesday);
  assert.ok(score > 0.8, `expected a high but sub-threshold score, got ${score}`);
  assert.ok(score < NEAR_DUPLICATE_THRESHOLD);
});

test('a rewrite of the same idea is not treated as a duplicate', () => {
  // The check must leave room for genuinely new copy on the same subject,
  // otherwise it fires on every post in a campaign and gets ignored.
  const first = 'Our spring sale starts on Monday with 20% off everything in store.';
  const rewritten =
    'Everything is a fifth off from Monday. Come and see us before the week is out.';
  assert.equal(isNearDuplicate(first, rewritten), false);
});

test('texts too short to shingle fall back to exact comparison', () => {
  // Two identical one-word posts are a duplicate platforms do reject, so
  // returning 0 for anything shorter than a trigram would miss them.
  assert.equal(similarity('hi', 'hi'), 1);
  assert.equal(similarity('hi', 'ho'), 0);
});

test('CJK is shingled by grapheme, not by code unit', () => {
  // Three CJK characters are roughly a phrase rather than three letters, and a
  // UTF-16 window would straddle characters and make the score meaningless on
  // exactly the languages where duplicate detection matters most.
  const same = '新商品の発売を開始しました。ぜひご覧ください。';
  assert.equal(similarity(same, same), 1);
  const different = '本日は臨時休業とさせていただきます。';
  assert.ok(similarity(same, different) < NEAR_DUPLICATE_THRESHOLD);
});

test('the threshold is a parameter, so a stricter network can tighten it', () => {
  const a = 'Our spring sale starts on Monday with 20% off everything in store.';
  const b = 'Our spring sale starts on Tuesday with 20% off everything in stock.';
  const score = similarity(a, b);
  assert.equal(isNearDuplicate(a, b, score), true, 'the threshold is inclusive');
  assert.equal(isNearDuplicate(a, b, score + 0.01), false);
});

test('normalisation keeps the words and drops everything incidental', () => {
  const normalized = normalizeForComparison(
    '  🎉 BIG News!! Read it at https://example.com/x #launch @acme  ',
  );
  assert.equal(normalized, 'big news read it at');
});
