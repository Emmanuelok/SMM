import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { canonicalContent, contentHash, hashesEqual, type PublishableContent } from './hash.js';
import { unsafeId } from './ids.js';

/**
 * The two properties an approval-binding hash has to hold, tested separately
 * because they pull in opposite directions:
 *
 *  - stability, so an approval does not invalidate for a difference nobody can
 *    see, which is what teaches teams to route around approvals;
 *  - separation, so an edit cannot pass as the content that was signed off,
 *    which is the failure the mechanism exists to prevent.
 */

const asset = (id: string) => unsafeId<'MediaAssetId'>(id);

function content(overrides: Partial<PublishableContent> = {}): PublishableContent {
  return {
    format: 'image',
    body: 'Spring sale starts Monday.',
    media: [],
    ...overrides,
  };
}

/* ── Stability ─────────────────────────────────────────────────────────────── */

test('the same content hashes the same twice', () => {
  assert.equal(contentHash(content()), contentHash(content()));
});

test('property insertion order does not change the hash', () => {
  // Two code paths building the same post — one from the composer, one from a
  // database row — produce objects whose keys are in different orders.
  // `JSON.stringify` would hash those differently; canonicalisation must not.
  const composed: PublishableContent = {
    format: 'image',
    body: 'hello',
    title: 'a title',
    media: [{ assetId: asset('asset001'), altText: 'a cat' }],
    link: 'https://example.com',
  };
  const readBack: PublishableContent = {
    link: 'https://example.com',
    media: [{ altText: 'a cat', assetId: asset('asset001') }],
    title: 'a title',
    body: 'hello',
    format: 'image',
  };
  assert.equal(contentHash(composed), contentHash(readBack));
});

test('line-ending style does not change the hash', () => {
  // CRLF is a property of the pasting client, not of the post.
  const lf = content({ body: 'line one\nline two' });
  const crlf = content({ body: 'line one\r\nline two' });
  const cr = content({ body: 'line one\rline two' });
  assert.equal(contentHash(lf), contentHash(crlf));
  assert.equal(contentHash(lf), contentHash(cr));
});

test('trailing newlines do not change the hash', () => {
  assert.equal(contentHash(content({ body: 'done' })), contentHash(content({ body: 'done\n\n' })));
});

test('unicode normalisation form does not change the hash', () => {
  // A macOS keyboard produces a decomposed accent, a Windows one a precomposed
  // accent, and they render identically.
  const precomposed = content({ body: 'café' });
  const decomposed = content({ body: 'café' });
  assert.notEqual(precomposed.body, decomposed.body);
  assert.equal(contentHash(precomposed), contentHash(decomposed));
});

test('absent, null and empty mean the same thing for an optional field', () => {
  // The composer sends `undefined`, a JSONB round-trip sends `null`, and a
  // cleared form field sends `''`. Nothing the reader sees differs.
  const absent = contentHash(content());
  assert.equal(contentHash(content({ title: undefined })), absent);
  assert.equal(contentHash(content({ title: null })), absent);
  assert.equal(contentHash(content({ title: '' })), absent);
  assert.equal(contentHash(content({ firstComment: null })), absent);
  assert.equal(contentHash(content({ link: '' })), absent);
  // A poll read back as null must fold the same way rather than throwing on the
  // dispatch path.
  assert.equal(contentHash(content({ poll: null })), absent);
});

test('internal-only fields are excluded from the hash', () => {
  // Invalidating an approval because someone fixed a typo in an internal label
  // is exactly the friction that trains teams to batch-approve without reading.
  const base = content();
  assert.equal(contentHash(content({ internalNotes: 'ask legal' })), contentHash(base));
  assert.equal(contentHash(content({ tags: ['q3', 'promo'] })), contentHash(base));
  assert.equal(contentHash(content({ campaign: 'spring-2026' })), contentHash(base));
});

test('NFKC folding is deliberately not applied', () => {
  // Fullwidth Latin renders visibly differently from ASCII, so it is a real
  // edit. Using NFKC here — as the duplicate comparison does — would let it
  // publish under an approval of the ASCII version.
  const ascii = content({ body: 'SALE' });
  const fullwidth = content({ body: 'ＳＡＬＥ' });
  assert.notEqual(contentHash(ascii), contentHash(fullwidth));
});

/* ── Separation ────────────────────────────────────────────────────────────── */

test('every audience-visible field changes the hash', () => {
  const base = contentHash(content());
  const changed: PublishableContent[] = [
    content({ format: 'carousel' }),
    content({ body: 'Spring sale starts Tuesday.' }),
    content({ title: 'Spring sale' }),
    content({ link: 'https://example.com' }),
    content({ firstComment: 'Details in the link.' }),
    content({ media: [{ assetId: asset('asset001') }] }),
    content({ poll: { options: ['a', 'b'], durationMinutes: 1440 } }),
  ];
  for (const variant of changed) {
    assert.notEqual(contentHash(variant), base);
  }
});

test('alt text is published content and is hashed', () => {
  const withAlt = content({ media: [{ assetId: asset('asset001'), altText: 'a red bicycle' }] });
  const without = content({ media: [{ assetId: asset('asset001') }] });
  assert.notEqual(contentHash(withAlt), contentHash(without));
});

test('reordering carousel slides changes the hash', () => {
  // On a carousel the order is the story; a reviewer approved a sequence.
  const forward = content({
    media: [{ assetId: asset('asset001') }, { assetId: asset('asset002') }],
  });
  const reversed = content({
    media: [{ assetId: asset('asset002') }, { assetId: asset('asset001') }],
  });
  assert.notEqual(contentHash(forward), contentHash(reversed));
});

test('reordering poll options changes the hash', () => {
  const forward = content({ poll: { options: ['yes', 'no'], durationMinutes: 60 } });
  const reversed = content({ poll: { options: ['no', 'yes'], durationMinutes: 60 } });
  assert.notEqual(contentHash(forward), contentHash(reversed));
  const longer = content({ poll: { options: ['yes', 'no'], durationMinutes: 120 } });
  assert.notEqual(contentHash(forward), contentHash(longer));
});

test('a post with one image does not collide with a post with none', () => {
  // The media count is framed separately so an empty list is distinguishable
  // from a list whose single entry canonicalises to nothing much.
  assert.notEqual(
    contentHash(content({ media: [{ assetId: asset('asset001') }] })),
    contentHash(content({ media: [] })),
  );
});

test('a body cannot forge a second field by embedding the field separators', () => {
  // The attack the length framing exists to stop: if fields were merely joined
  // by a separator, a body ending in one could shift its own text into the next
  // field and hash identically to a differently-approved post.
  const UNIT = '\u001f';
  const RECORD = '\u001e';

  const honest = content({ body: 'buy now', title: 'Sale' });
  const forged = content({ body: `buy now${RECORD}title${UNIT}4${UNIT}Sale`, title: undefined });

  assert.notEqual(contentHash(honest), contentHash(forged));
});

test('a body cannot impersonate an absent field', () => {
  // Absence is marked in the length slot, not spelled as a value, so no body —
  // including one that spells out the marker this module used to use — can
  // canonicalise the way an empty field does.
  assert.notEqual(contentHash(content({ body: '\u0000absent' })), contentHash(content({ body: '' })));
});

test('moving text between adjacent fields changes the hash', () => {
  const split = content({ body: 'hello', title: 'world' });
  const joined = content({ body: 'helloworld', title: undefined });
  assert.notEqual(contentHash(split), contentHash(joined));
});

test('the canonical form is readable, so a surprising mismatch can be diffed', () => {
  const canonical = canonicalContent(content({ title: 'Sale' }));
  assert.ok(canonical.includes('Spring sale starts Monday.'));
  assert.ok(canonical.includes('Sale'));
  // Excluded fields must not appear even in the diffable form.
  assert.ok(!canonicalContent(content({ campaign: 'spring-2026' })).includes('spring-2026'));
});

/* ── Comparison ────────────────────────────────────────────────────────────── */

test('hashes compare equal only to themselves', () => {
  const a = contentHash(content());
  const b = contentHash(content({ body: 'something else' }));
  assert.equal(hashesEqual(a, a), true);
  assert.equal(hashesEqual(a, b), false);
});

test('comparing hashes of different lengths is false rather than a throw', () => {
  // `timingSafeEqual` throws on a length mismatch, and a truncated column must
  // not take down the dispatch path.
  assert.equal(hashesEqual(contentHash(content()), 'deadbeef'), false);
  assert.equal(hashesEqual('', contentHash(content())), false);
});

test('a hash is a full SHA-256 hex digest', () => {
  assert.match(contentHash(content()), /^[0-9a-f]{64}$/);
});
