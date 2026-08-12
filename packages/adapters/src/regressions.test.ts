import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  dispositionOf,
  failure,
  measureText,
  similarity,
  truncateToLimit,
  unsafeId,
  type MediaAssetId,
  type PostId,
  type SocialProfileId,
  type TextCountingStrategy,
} from '@smm/shared';

import type { MediaRef, PostDraft, ResolvedTarget } from './content.js';
import { resolveTarget } from './content.js';
import { X, YOUTUBE } from './registry.js';
import { validateTarget } from './validation.js';

/**
 * Regressions for defects found by adversarial review of the adapter surgery.
 *
 * Each test names the failure it prevents. They are grouped here rather than
 * scattered because every one of them is a case where the code looked correct,
 * passed its own unit tests, and was wrong on realistic input.
 */

const X_WEIGHTED: TextCountingStrategy = { kind: 'x-weighted', urlWeight: 23 };
const profileId = unsafeId<'SocialProfileId'>('profile01') as SocialProfileId;

function target(overrides: Partial<ResolvedTarget> = {}): ResolvedTarget {
  return {
    network: 'x',
    profileId,
    format: 'text',
    body: '',
    media: [],
    ...overrides,
  };
}

function video(overrides: Partial<MediaRef> = {}): MediaRef {
  return {
    assetId: unsafeId<'MediaAssetId'>('asset001') as MediaAssetId,
    kind: 'video',
    bytes: 1_000_000,
    mimeType: 'video/mp4',
    width: 1080,
    height: 1920,
    durationSec: 30,
    ...overrides,
  };
}

test('truncating through a URL still lands within the limit', () => {
  // The truncation loop charges each grapheme separately, but X collapses a URL
  // to a fixed 23. Cutting through the middle of a link leaves a fragment that
  // still matches as a link and is charged the full 23, so the "shorten it for
  // me" fix used to hand back a string that failed the very check that offered
  // it.
  const body = `${'a'.repeat(260)} https://example.com/${'b'.repeat(60)}`;
  assert.ok(measureText(body, X_WEIGHTED) > 280, 'precondition: over the limit');

  const fixed = truncateToLimit(body, 280, X_WEIGHTED, '…');
  assert.ok(
    measureText(fixed, X_WEIGHTED) <= 280,
    `truncated body still measures ${measureText(fixed, X_WEIGHTED)}`,
  );
});

test('the truncate autoFix produces a body that passes revalidation', () => {
  const body = `${'a'.repeat(260)} https://example.com/${'b'.repeat(60)}`;
  const report = validateTarget(target({ body }), X);
  const fix = report.issues.find((i) => i.code === 'text_too_long')?.autoFix;

  assert.ok(fix !== undefined && fix.kind === 'truncate_body');
  const after = validateTarget(target({ body: fix.body }), X);
  assert.equal(after.publishable, true, 'applying the offered fix must resolve the issue');
});

test('truncation through a URL holds across a range of limits', () => {
  const body = `${'x'.repeat(200)} https://example.com/${'y'.repeat(80)} tail`;
  for (let limit = 20; limit <= 300; limit += 7) {
    const out = truncateToLimit(body, limit, X_WEIGHTED, '…');
    assert.ok(
      measureText(out, X_WEIGHTED) <= limit,
      `limit ${limit}: got ${measureText(out, X_WEIGHTED)}`,
    );
  }
});

test('posts that normalise to nothing are not all duplicates of each other', () => {
  // Normalisation strips URLs, hashtags, mentions and emoji. Two link-only
  // posts both reduce to an empty string, and comparing those as equal reported
  // entirely different product links as a 100% match — the fastest way to train
  // a team to ignore the warning.
  assert.equal(
    similarity('https://example.com/product-a', 'https://example.com/completely-different-b'),
    0,
  );
  assert.equal(similarity('#MondayMotivation', '#FridayFeeling'), 0);
  assert.equal(similarity('@alice', '@bob'), 0);

  // An identical body is still a duplicate, even with nothing left to compare.
  assert.equal(similarity('https://example.com/a', 'https://example.com/a'), 1);
});

test('an exhausted quota waits for its reset rather than a generic backoff', () => {
  // Quota windows refill at a wall-clock moment, not after an elapsed delay.
  // Retrying hourly against YouTube's daily budget spends nine more attempts on
  // a limit that has not moved, each costing quota it does not have.
  const now = new Date('2026-06-15T09:00:00Z');
  const resetAt = new Date('2026-06-15T18:00:00Z');

  const disposition = dispositionOf(
    failure('quota_exhausted', 'Daily units used up.', { quotaResetAt: resetAt }),
    now,
  );

  assert.equal(disposition.action, 'retry');
  assert.ok(disposition.action === 'retry');
  assert.equal(disposition.retryAfterMs, 9 * 3_600_000);
});

test('a quota with no stated reset still falls back to a sane wait', () => {
  const disposition = dispositionOf(failure('quota_exhausted', 'Used up.'));
  assert.ok(disposition.action === 'retry');
  assert.equal(disposition.retryAfterMs, 3_600_000);
});

test('extras belonging to another network are dropped, not carried through', () => {
  // Duplicating a target onto another network is the ordinary way a mismatch
  // arises. ResolvedTarget.extras promises its contents match the network, and
  // adapters read it on that basis, so a Pinterest board id must never reach a
  // Reddit adapter.
  const draft: PostDraft = {
    id: unsafeId<'PostId'>('post0001') as PostId,
    format: 'text',
    body: 'hello',
    media: [],
  };

  const resolved = resolveTarget(draft, 'reddit', profileId, {
    extras: { network: 'pinterest', boardId: 'board-123' },
  });
  assert.equal(resolved.extras, undefined);

  const matching = resolveTarget(draft, 'reddit', profileId, {
    extras: { network: 'reddit', subreddit: 'programming' },
  });
  assert.deepEqual(matching.extras, { network: 'reddit', subreddit: 'programming' });
});

test('an under-sized video is rejected', () => {
  // Every VideoSpec declares a minimum resolution and the registry populates it,
  // but nothing read it — so an undersized upload validated cleanly and was
  // rejected at publish time instead.
  const report = validateTarget(
    target({
      network: 'youtube',
      format: 'video',
      title: 'A video',
      media: [video({ width: 64, height: 64, durationSec: 60 })],
    }),
    YOUTUBE,
  );
  assert.ok(report.issues.some((i) => i.code === 'video_dimensions_invalid'));
  assert.equal(report.publishable, false);
});

test('an unsupported attachment kind is rejected rather than ignored', () => {
  // Documents and audio fell through the kind check entirely, so a 999 MB
  // archive attached to an image post validated as publishable.
  const report = validateTarget(
    target({
      format: 'image',
      body: 'hi',
      media: [
        {
          assetId: unsafeId<'MediaAssetId'>('asset002') as MediaAssetId,
          kind: 'document',
          bytes: 999 * 1_048_576,
          mimeType: 'application/zip',
        },
      ],
    }),
    X,
  );
  assert.ok(report.issues.some((i) => i.code === 'media_type_unsupported'));
  assert.equal(report.publishable, false);
});
