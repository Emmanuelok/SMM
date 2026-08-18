import { strict as assert } from 'node:assert';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';

import { isErr, isOk, remoteId, unsafeId } from '@smm/shared';

import {
  ARCHETYPES,
  PUBLISH_PHASES,
  PublishHandleCodec,
  canTransition,
  hasExpired,
  idempotencyKeyFor,
  isArchetype,
  isPublishPhase,
  isTerminalPhase,
  requiresPolling,
  requiresSeparateFinalize,
  type ContainerHandle,
  type PublishHandle,
  type PublishPhase,
  type ResumableUploadHandle,
  type SingleShotHandle,
} from './lifecycle.js';

/**
 * The publish lifecycle exists so that a worker can walk away from an upload and
 * a different machine can walk back to it. Two things have to hold for that:
 * a handle must survive the round trip through storage byte for byte, and the
 * phase machine must refuse the transitions that publish something twice.
 */

const targetId = unsafeId<'PostTargetId'>('target01');
const idem = idempotencyKeyFor(targetId, 'a'.repeat(64));

const SUBMITTED = new Date('2026-08-12T09:00:00.000Z');
const EXPIRES = new Date('2026-08-13T09:00:00.000Z');

function roundTrip(handle: PublishHandle): PublishHandle {
  const decoded = PublishHandleCodec.decode(PublishHandleCodec.encode(handle));
  assert.ok(isOk(decoded), `decode failed: ${JSON.stringify(decoded)}`);
  return decoded.value;
}

/* ── Handle codec ──────────────────────────────────────────────────────────── */

test('a single-shot handle survives encoding and decoding', () => {
  const handle: SingleShotHandle = {
    network: 'x',
    archetype: 'single_shot',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    mediaIds: [remoteId('media-1'), remoteId('media-2')],
  };
  assert.deepEqual(roundTrip(handle), handle);
});

test('an optional field that was absent stays absent, rather than becoming null', () => {
  // A handle that gains a `remotePostId: undefined` key on every round trip
  // would compare unequal to the one in memory and defeat any equality check a
  // reconciler tries to make.
  const handle: SingleShotHandle = {
    network: 'x',
    archetype: 'single_shot',
    idempotencyKey: idem,
    phase: 'completed',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    mediaIds: [],
    remotePostId: remoteId('1234567890'),
  };
  assert.deepEqual(roundTrip(handle), handle);

  const withoutPost: SingleShotHandle = { ...handle, remotePostId: undefined };
  const decoded = roundTrip(withoutPost);
  assert.equal(Object.hasOwn(decoded, 'remotePostId'), false);
});

test('a container handle keeps its child ids, which are the only way to clean them up', () => {
  // A carousel can half-succeed: children created, parent failed. Without their
  // ids the children are orphaned on Meta's side, counting against quota, with
  // nothing left that can name them.
  const handle: ContainerHandle = {
    network: 'instagram',
    archetype: 'async_container',
    idempotencyKey: idem,
    phase: 'ready',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    containerId: remoteId('17900000000000000'),
    childContainerIds: [remoteId('17900000000000001'), remoteId('17900000000000002')],
  };
  assert.deepEqual(roundTrip(handle), handle);
});

test('a resumable upload keeps the session, the offset and every part etag', () => {
  // LinkedIn rejects the finalize call unless every part etag is echoed back in
  // order, and those values exist only in the responses to the chunk uploads.
  const handle: ResumableUploadHandle = {
    network: 'linkedin',
    archetype: 'resumable_upload',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    uploadUri: 'https://upload.example.com/session?token=abc%2Fdef&part=1',
    uploadId: 'urn:li:digitalmediaUpload:9999',
    bytesTotal: 1_073_741_824,
    bytesConfirmed: 268_435_456,
    parts: [
      { partNumber: 1, etag: '"aaa-1"' },
      { partNumber: 2, etag: '"bbb-2"' },
    ],
  };
  const decoded = roundTrip(handle);
  assert.deepEqual(decoded, handle);
  assert.ok(decoded.archetype === 'resumable_upload');
  assert.equal(decoded.parts[1]?.etag, '"bbb-2"');
});

test('timestamps come back as the same instants, not as strings', () => {
  const handle: ContainerHandle = {
    network: 'threads',
    archetype: 'async_container',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    containerId: remoteId('c1'),
    childContainerIds: [],
  };
  const decoded = roundTrip(handle);
  assert.ok(decoded.submittedAt instanceof Date);
  assert.equal(decoded.submittedAt.getTime(), SUBMITTED.getTime());
  assert.equal(decoded.expiresAt.getTime(), EXPIRES.getTime());
});

test('the encoded form is one opaque token safe for a column, a queue or a URL', () => {
  const handle: ResumableUploadHandle = {
    network: 'youtube',
    archetype: 'resumable_upload',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    uploadUri: 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&id=x/y+z',
    bytesTotal: 10,
    bytesConfirmed: 0,
    parts: [],
  };
  const encoded = PublishHandleCodec.encode(handle);
  assert.match(encoded, /^ph1\.[A-Za-z0-9_-]+$/);
  assert.equal(PublishHandleCodec.version, 'ph1');
});

test('a handle written by a newer deploy is reported as a version, not as corruption', () => {
  // During a rolling upgrade the older worker meets handles it cannot read.
  // Treating those as garbage discards an upload that is progressing fine, so
  // the two cases must stay distinguishable.
  const handle: SingleShotHandle = {
    network: 'bluesky',
    archetype: 'single_shot',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    mediaIds: [],
  };
  const future = PublishHandleCodec.encode(handle).replace(/^ph1\./, 'ph2.');
  const decoded = PublishHandleCodec.decode(future);
  assert.ok(isErr(decoded));
  assert.equal(decoded.error.reason, 'unsupported_version');
  assert.ok(decoded.error.reason === 'unsupported_version');
  assert.equal(decoded.error.version, 'ph2');
});

test('genuinely unreadable handles are malformed, and say what was wrong', () => {
  const cases: readonly (readonly [string, string])[] = [
    ['', 'missing version prefix'],
    ['no-separator-at-all', 'missing version prefix'],
    ['zz1.abcd', 'unrecognised version prefix'],
    ['ph1.!!!not base64!!!', 'payload is not valid JSON'],
    [`ph1.${Buffer.from('[1,2,3]', 'utf8').toString('base64url')}`, 'payload is not an object'],
  ];
  for (const [encoded, detail] of cases) {
    const decoded = PublishHandleCodec.decode(encoded);
    assert.ok(isErr(decoded), `expected a failure for ${JSON.stringify(encoded)}`);
    assert.equal(decoded.error.reason, 'malformed');
    assert.ok(decoded.error.reason === 'malformed');
    assert.equal(decoded.error.detail, detail);
  }
});

/**
 * Build an encoded handle from a hand-written wire object, so that decoding can
 * be tested against rows this codec would never write — which is exactly the
 * class of row a rolling deploy or a truncated column produces.
 */
function encodeWire(wire: Readonly<Record<string, unknown>>): string {
  return `ph1.${Buffer.from(JSON.stringify(wire), 'utf8').toString('base64url')}`;
}

test('a decoded handle is checked against the closed sets, not cast', () => {
  const base = {
    network: 'x',
    archetype: 'single_shot',
    idempotencyKey: idem,
    phase: 'pending',
    submittedAt: SUBMITTED.getTime(),
    expiresAt: EXPIRES.getTime(),
    mediaIds: [],
  };

  const bad: readonly (readonly [Readonly<Record<string, unknown>>, string])[] = [
    // A network we no longer support has to be reported here rather than handed
    // to an adapter lookup that returns undefined three frames later.
    [{ ...base, network: 'friendster' }, 'network'],
    [{ ...base, archetype: 'telepathy' }, 'archetype'],
    [{ ...base, phase: 'nearly' }, 'phase'],
    [{ ...base, idempotencyKey: 42 }, 'idempotencyKey'],
    [{ ...base, submittedAt: 'yesterday' }, 'submittedAt'],
    // A fractional byte offset would go straight into a Content-Range header.
    [
      {
        ...base,
        archetype: 'resumable_upload',
        uploadUri: 'https://example.com/s',
        bytesTotal: 10,
        bytesConfirmed: 1.5,
        parts: [],
      },
      'bytesConfirmed',
    ],
    [
      {
        ...base,
        archetype: 'resumable_upload',
        uploadUri: 'https://example.com/s',
        bytesTotal: 10,
        bytesConfirmed: 0,
        parts: [{ partNumber: 1 }],
      },
      'parts',
    ],
    [{ ...base, mediaIds: [1, 2] }, 'mediaIds'],
    [{ ...base, archetype: 'async_container', childContainerIds: [] }, 'containerId'],
  ];

  for (const [wire, detail] of bad) {
    const decoded = PublishHandleCodec.decode(encodeWire(wire));
    assert.ok(isErr(decoded), `expected a failure for ${detail}`);
    assert.ok(decoded.error.reason === 'malformed');
    assert.equal(decoded.error.detail, detail);
  }
});

/* ── Idempotency keys ──────────────────────────────────────────────────────── */

test('the same publish derives the same key, so a replay is one post', () => {
  const hash = 'b'.repeat(64);
  assert.equal(idempotencyKeyFor(targetId, hash), idempotencyKeyFor(targetId, hash));
});

test('an edit derives a different key, so a corrected typo is not swallowed', () => {
  const first = idempotencyKeyFor(targetId, 'b'.repeat(64));
  const second = idempotencyKeyFor(targetId, 'c'.repeat(64));
  assert.notEqual(first, second);
});

test('the same content aimed at a different target derives a different key', () => {
  const hash = 'b'.repeat(64);
  assert.notEqual(
    idempotencyKeyFor(targetId, hash),
    idempotencyKeyFor(unsafeId<'PostTargetId'>('target02'), hash),
  );
});

test('an omitted attempt is not the same as attempt zero', () => {
  // Absence is framed as an empty value rather than rendered as a number, so
  // switching a network into per-attempt mode cannot silently reuse a key.
  const hash = 'b'.repeat(64);
  assert.notEqual(idempotencyKeyFor(targetId, hash), idempotencyKeyFor(targetId, hash, 0));
  assert.notEqual(idempotencyKeyFor(targetId, hash, 0), idempotencyKeyFor(targetId, hash, 1));
});

test('a key is short enough for the platforms that cap the header', () => {
  // Several cap it at 64 characters and at least one validates the class.
  const key = idempotencyKeyFor(targetId, 'b'.repeat(64));
  assert.match(key, /^k1_[0-9a-f]{32}$/);
  assert.ok(key.length <= 64);
});

test('separator characters in the inputs cannot collide two different publishes', () => {
  // Fields are framed by byte length rather than joined by a separator, so a
  // value carrying the separator cannot shift its own bytes into the next field
  // and derive the key belonging to a different publish.
  const RECORD = '\u001e';
  const inTarget = idempotencyKeyFor(unsafeId<'PostTargetId'>(`a${RECORD}`), 'content');
  const shifted = idempotencyKeyFor(unsafeId<'PostTargetId'>('a'), `${RECORD}content`);
  assert.notEqual(inTarget, shifted);
});

/* ── Phase machine ─────────────────────────────────────────────────────────── */

test('polling a container that is still working is a normal observation', () => {
  assert.equal(canTransition('pending', 'pending'), true);
  assert.equal(canTransition('ready', 'ready'), true);
});

test('a publish never goes backwards', () => {
  // A regression to `pending` would re-arm finalize against a container we may
  // already have published, which is how the same video appears on a channel
  // twice. When a platform appears to flap backwards the likelier explanation
  // is that we polled the wrong id, and that is a bug to surface.
  assert.equal(canTransition('ready', 'pending'), false);
  assert.equal(canTransition('completed', 'ready'), false);
  assert.equal(canTransition('completed', 'pending'), false);
});

test('pending can reach completed directly, for the flows with no ready moment', () => {
  // Single-shot everywhere, and YouTube, where the final chunk yields the video.
  assert.equal(canTransition('pending', 'completed'), true);
  assert.equal(canTransition('pending', 'ready'), true);
  assert.equal(canTransition('pending', 'rejected'), true);
  assert.equal(canTransition('pending', 'expired'), true);
});

test('the terminal phases are terminal in every direction', () => {
  const terminal: readonly PublishPhase[] = ['rejected', 'completed', 'expired'];
  for (const from of terminal) {
    assert.equal(isTerminalPhase(from), true, `${from} should be terminal`);
    for (const to of PUBLISH_PHASES) {
      assert.equal(canTransition(from, to), false, `${from} -> ${to} must be refused`);
    }
  }
  assert.equal(isTerminalPhase('pending'), false);
  assert.equal(isTerminalPhase('ready'), false);
});

test('an expired container is not a rejected one', () => {
  // The content was never judged, so the remedy is a fresh submit rather than
  // telling the user to fix a file nothing was wrong with.
  assert.equal(canTransition('ready', 'expired'), true);
  assert.equal(canTransition('expired', 'completed'), false);
});

test('every phase and archetype is covered by its guard', () => {
  for (const phase of PUBLISH_PHASES) assert.equal(isPublishPhase(phase), true);
  for (const archetype of ARCHETYPES) assert.equal(isArchetype(archetype), true);
  assert.equal(isPublishPhase('almost'), false);
  assert.equal(isArchetype('single-shot'), false);
  // Guarding against inherited properties as well as absent ones.
  assert.equal(isPublishPhase('toString'), false);
});

test('expiry is judged against a supplied clock, not the process one', () => {
  const handle: ContainerHandle = {
    network: 'instagram',
    archetype: 'async_container',
    idempotencyKey: idem,
    phase: 'ready',
    submittedAt: SUBMITTED,
    expiresAt: EXPIRES,
    containerId: remoteId('c1'),
    childContainerIds: [],
  };
  assert.equal(hasExpired(handle, new Date(EXPIRES.getTime() - 1)), false);
  // The deadline itself counts as expired: a container at its TTL is not usable.
  assert.equal(hasExpired(handle, EXPIRES), true);
  assert.equal(hasExpired(handle, new Date(EXPIRES.getTime() + 1)), true);
});

test('only the two-call archetypes need polling and a separate finalize', () => {
  assert.equal(requiresPolling('single_shot'), false);
  assert.equal(requiresPolling('async_container'), true);
  assert.equal(requiresPolling('resumable_upload'), true);

  // On single-shot, submit already produced the post, and calling finalize as
  // though it were a publish step is the double-post.
  assert.equal(requiresSeparateFinalize('single_shot'), false);
  assert.equal(requiresSeparateFinalize('async_container'), true);
  assert.equal(requiresSeparateFinalize('resumable_upload'), true);
});
