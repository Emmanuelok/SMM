import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { buildLinkFacets, rkeyFromUri } from './bluesky.js';

/**
 * Facet offsets are the part of an AT Protocol post that is easy to get wrong
 * and hard to notice: a link whose span is off by a few bytes renders over the
 * wrong words rather than failing loudly.
 */

const encoder = new TextEncoder();

/** What the span actually covers, decoded back from the byte offsets. */
function sliceByBytes(text: string, start: number, end: number): string {
  return new TextDecoder().decode(encoder.encode(text).slice(start, end));
}

test('a link in plain ASCII gets the right span', () => {
  const text = 'read this https://example.com now';
  const [facet] = buildLinkFacets(text);

  assert.ok(facet !== undefined);
  assert.equal(sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd), 'https://example.com');
  assert.equal(facet.features[0]?.uri, 'https://example.com');
});

test('emoji before a link shift the byte offset away from the character index', () => {
  // The failure this pins: an emoji is one character, two UTF-16 units, and
  // four UTF-8 bytes. Using a character index here points the facet several
  // bytes short and the link renders over the wrong text.
  const text = '🎉🎉 https://example.com';
  const [facet] = buildLinkFacets(text);

  assert.ok(facet !== undefined);
  assert.equal(sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd), 'https://example.com');
  // Two 4-byte emoji plus a space.
  assert.equal(facet.index.byteStart, 9);
  assert.notEqual(facet.index.byteStart, text.indexOf('https'));
});

test('CJK text before a link shifts the offset too', () => {
  const text = '今日のリンク https://example.com';
  const [facet] = buildLinkFacets(text);

  assert.ok(facet !== undefined);
  assert.equal(sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd), 'https://example.com');
});

test('right-to-left text does not disturb the offsets', () => {
  const text = 'مرحبا https://example.com';
  const [facet] = buildLinkFacets(text);

  assert.ok(facet !== undefined);
  assert.equal(sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd), 'https://example.com');
});

test('the same link twice produces two distinct spans', () => {
  // A moving cursor is what makes this work; searching from zero each time
  // would return two copies of the first occurrence.
  const text = 'https://example.com and again https://example.com';
  const facets = buildLinkFacets(text);

  assert.equal(facets.length, 2);
  assert.notEqual(facets[0]?.index.byteStart, facets[1]?.index.byteStart);
  for (const facet of facets) {
    assert.equal(
      sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd),
      'https://example.com',
    );
  }
});

test('several different links each get their own span', () => {
  const text = 'one https://a.example.com two https://b.example.com three';
  const facets = buildLinkFacets(text);

  assert.equal(facets.length, 2);
  assert.equal(facets[0]?.features[0]?.uri, 'https://a.example.com');
  assert.equal(facets[1]?.features[0]?.uri, 'https://b.example.com');
});

test('a bare domain is given an absolute URI', () => {
  // The record is rejected without a scheme, so the facet has to add one even
  // though the visible text has none.
  const text = 'see example.com for more';
  const [facet] = buildLinkFacets(text);

  assert.ok(facet !== undefined);
  assert.equal(facet.features[0]?.uri, 'https://example.com');
  // The span still covers exactly what the reader sees.
  assert.equal(sliceByBytes(text, facet.index.byteStart, facet.index.byteEnd), 'example.com');
});

test('text with no links produces no facets', () => {
  assert.deepEqual(buildLinkFacets('just some words'), []);
  assert.deepEqual(buildLinkFacets(''), []);
});

test('a link at the very start and very end are both handled', () => {
  const atStart = buildLinkFacets('https://example.com trailing');
  assert.equal(atStart[0]?.index.byteStart, 0);

  const text = 'leading https://example.com';
  const [facet] = buildLinkFacets(text);
  assert.ok(facet !== undefined);
  assert.equal(facet.index.byteEnd, encoder.encode(text).length);
});

test('record keys are extracted from AT URIs', () => {
  assert.equal(
    rkeyFromUri('at://did:plc:abc123/app.bsky.feed.post/3k2bxyzabc'),
    '3k2bxyzabc',
  );
  assert.equal(rkeyFromUri('nonsense'), 'nonsense');
});
