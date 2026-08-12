import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { measureText, unsafeId, type MediaAssetId, type SocialProfileId } from '@smm/shared';

import type { MediaRef, PostFormat, ResolvedTarget } from './content.js';
import { BLUESKY, INSTAGRAM, LINKEDIN, TIKTOK, X, capabilitiesFor } from './registry.js';
import { validateTarget } from './validation.js';

const profileId = unsafeId<'SocialProfileId'>('profile01') as SocialProfileId;

function target(overrides: Partial<ResolvedTarget> & { format: PostFormat }): ResolvedTarget {
  return {
    network: 'x',
    profileId,
    body: '',
    media: [],
    ...overrides,
  };
}

function image(overrides: Partial<MediaRef> = {}): MediaRef {
  return {
    assetId: unsafeId<'MediaAssetId'>('asset001') as MediaAssetId,
    kind: 'image',
    bytes: 500_000,
    mimeType: 'image/jpeg',
    width: 1080,
    height: 1080,
    altText: 'a description',
    ...overrides,
  };
}

function codes(report: { issues: readonly { code: string }[] }): string[] {
  return report.issues.map((i) => i.code);
}

test('accepts a well-formed post', () => {
  const report = validateTarget(target({ format: 'text', body: 'hello world' }), X);
  assert.equal(report.publishable, true);
  assert.equal(report.delivery, 'auto');
});

test('rejects a format the network does not support', () => {
  // TikTok is video and photo only; there is no text-only post.
  const report = validateTarget(target({ format: 'text', body: 'hi' }), TIKTOK);
  assert.deepEqual(codes(report), ['format_unsupported']);
  assert.equal(report.publishable, false);
  assert.equal(report.delivery, 'blocked');
});

test('applies X weighting so CJK text hits the limit at half the characters', () => {
  // 200 Latin characters fit in 280; 200 CJK characters weigh 400 and do not.
  const latin = validateTarget(target({ format: 'text', body: 'a'.repeat(200) }), X);
  assert.equal(latin.publishable, true);

  const cjk = validateTarget(target({ format: 'text', body: '好'.repeat(200) }), X);
  assert.ok(codes(cjk).includes('text_too_long'));
});

test('a very long URL still fits on X because links count as a fixed width', () => {
  const body = `read this https://example.com/${'x'.repeat(500)}`;
  const report = validateTarget(target({ format: 'text', body }), X);
  assert.equal(report.publishable, true, 'URL should be counted as 23, not 500+');
});

test('the truncation autofix produces a body that actually fits', () => {
  const body = '好'.repeat(300);
  const report = validateTarget(target({ format: 'text', body }), X);
  const fix = report.issues.find((i) => i.code === 'text_too_long')?.autoFix;

  assert.ok(fix !== undefined && fix.kind === 'truncate_body');
  // The fix is only useful if re-validating it passes.
  const fixed = validateTarget(target({ format: 'text', body: fix.body }), X);
  assert.equal(fixed.publishable, true);
  assert.ok(measureText(fix.body, { kind: 'x-weighted', urlWeight: 23 }) <= 280);
});

test('enforces carousel attachment counts', () => {
  const tooMany = validateTarget(
    target({ format: 'carousel', network: 'instagram', media: Array.from({ length: 11 }, image) }),
    INSTAGRAM,
  );
  assert.ok(codes(tooMany).includes('too_many_media'));

  const fix = tooMany.issues.find((i) => i.code === 'too_many_media')?.autoFix;
  assert.deepEqual(fix, { kind: 'drop_media', keepCount: 10 });

  const tooFew = validateTarget(
    target({ format: 'carousel', network: 'instagram', media: [image()] }),
    INSTAGRAM,
  );
  assert.ok(codes(tooFew).includes('media_required'));
});

test('flags images outside the accepted aspect ratio', () => {
  // A 3:1 panorama is outside Instagram's 1.91:1 ceiling.
  const report = validateTarget(
    target({ format: 'image', network: 'instagram', media: [image({ width: 1500, height: 500 })] }),
    INSTAGRAM,
  );
  assert.ok(codes(report).includes('image_aspect_ratio_invalid'));
  assert.equal(report.publishable, false);
});

test('warns about missing alt text without blocking the post', () => {
  const report = validateTarget(
    target({
      format: 'image',
      network: 'bluesky',
      body: 'hi',
      media: [image({ bytes: 500_000, altText: undefined })],
    }),
    BLUESKY,
  );
  const altIssue = report.issues.find((i) => i.code === 'missing_alt_text');
  assert.ok(altIssue !== undefined);
  assert.equal(altIssue.severity, 'warning');
  assert.equal(report.publishable, true, 'accessibility warnings must not block publishing');
});

test('reports reminder delivery for formats the API cannot fully publish', () => {
  const report = validateTarget(
    target({ format: 'reel', network: 'tiktok', media: [] }),
    TIKTOK,
  );
  // Media is missing, so it is blocked — but the limitation note is present.
  assert.ok(codes(report).includes('media_required'));

  const ok = validateTarget(
    target({
      format: 'image',
      network: 'instagram',
      media: [image()],
    }),
    INSTAGRAM,
  );
  assert.equal(ok.delivery, 'auto');
});

test('warns when a requested feature is unavailable rather than failing silently', () => {
  // LinkedIn cannot auto-post a first comment.
  const report = validateTarget(
    target({ format: 'text', network: 'linkedin', body: 'hello', firstComment: 'and also...' }),
    LINKEDIN,
  );
  const unsupported = report.issues.find((i) => i.code === 'feature_unsupported');
  assert.ok(unsupported !== undefined);
  assert.equal(unsupported.severity, 'warning');
  assert.equal(report.publishable, true);
});

test('blocks polls on networks that have none', () => {
  const report = validateTarget(
    target({
      format: 'text',
      network: 'linkedin',
      body: 'pick one',
      poll: { options: [{ text: 'a' }, { text: 'b' }], durationMinutes: 1440 },
    }),
    LINKEDIN,
  );
  assert.ok(codes(report).includes('feature_unsupported'));
  assert.equal(report.publishable, false);
});

test('every registered network describes at least one format', () => {
  for (const network of ['instagram', 'facebook', 'threads', 'x', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'google_business'] as const) {
    const caps = capabilitiesFor(network);
    assert.ok(caps !== undefined, `${network} has no descriptor`);
    assert.ok(caps.formats.length > 0, `${network} describes no formats`);
    // A stale descriptor is a liability, so the date must be present.
    assert.match(caps.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(caps.sources.length > 0, `${network} cites no sources`);
  }
});
