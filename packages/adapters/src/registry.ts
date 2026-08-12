import type { ImageSpec, PlatformCapabilities, VideoSpec } from './capabilities.js';
import type { NetworkId } from './networks.js';

/**
 * Capability descriptors for each network.
 *
 * PROVISIONAL. These numbers are drawn from platform documentation and the
 * research in `research/06-platform-apis-tier1.md`. Platform APIs in this
 * category change frequently and often without announcement, so every
 * descriptor carries a `verifiedOn` date and its sources. Treat anything older
 * than a quarter as needing re-checking before it becomes load-bearing.
 *
 * A descriptor that is wrong in the permissive direction (claiming a limit is
 * higher than it is) causes publish failures; wrong in the restrictive
 * direction it merely blocks content the network would have accepted. When
 * uncertain, prefer the restrictive figure.
 */

const JPEG_PNG: readonly string[] = ['image/jpeg', 'image/png'];
const JPEG_PNG_WEBP: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
const MP4_MOV: readonly string[] = ['video/mp4', 'video/quicktime'];

const MB = 1_048_576;

/** Square-ish through landscape, the range most feed images fall into. */
const FEED_IMAGE: ImageSpec = {
  maxBytes: 8 * MB,
  minWidth: 320,
  minHeight: 320,
  maxWidth: 1440,
  maxHeight: 1440,
  minAspectRatio: 0.8, // 4:5 portrait
  maxAspectRatio: 1.91, // 1.91:1 landscape
  mimeTypes: JPEG_PNG,
};

/** Vertical short-form video: Reels, Shorts, TikTok. */
const VERTICAL_VIDEO: VideoSpec = {
  maxBytes: 1024 * MB,
  minDurationSec: 3,
  maxDurationSec: 900,
  minWidth: 540,
  minHeight: 960,
  minAspectRatio: 0.5,
  maxAspectRatio: 0.6,
  mimeTypes: MP4_MOV,
};

export const INSTAGRAM: PlatformCapabilities = {
  network: 'instagram',
  verifiedOn: '2026-08-12',
  sources: [
    'https://developers.facebook.com/docs/instagram-platform/content-publishing',
    'research/06-platform-apis-tier1.md',
  ],
  publishing: {
    maxPostsPer24h: 100,
    rejectsDuplicateContent: false,
  },
  read: {
    comments: true,
    directMessages: true,
    analytics: true,
    keywordSearch: false,
    webhooks: true,
    deletePost: false,
    editPost: false,
    maxDataRetentionDays: null,
    // Instagram only permits replying within 24h of the user's last message,
    // extended to 7 days when the conversation is tagged as human-handled.
    dmReplyWindowHours: 24,
  },
  formats: [
    {
      format: 'image',
      delivery: 'auto',
      text: {
        maxLength: 2200,
        counting: { kind: 'grapheme' },
        required: false,
        maxHashtags: 30,
        linksClickable: false,
      },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, image: FEED_IMAGE },
      features: ['first_comment', 'alt_text', 'location_tag', 'user_tag', 'product_tag', 'collaborator_tag'],
    },
    {
      format: 'carousel',
      delivery: 'auto',
      text: {
        maxLength: 2200,
        counting: { kind: 'grapheme' },
        required: false,
        maxHashtags: 30,
        linksClickable: false,
      },
      media: {
        minCount: 2,
        maxCount: 10,
        mixedTypesAllowed: true,
        image: FEED_IMAGE,
        video: { ...VERTICAL_VIDEO, minAspectRatio: 0.8, maxAspectRatio: 1.91, maxDurationSec: 60 },
      },
      features: ['first_comment', 'alt_text', 'location_tag', 'user_tag', 'product_tag', 'collaborator_tag'],
    },
    {
      format: 'reel',
      delivery: 'auto',
      text: {
        maxLength: 2200,
        counting: { kind: 'grapheme' },
        required: false,
        maxHashtags: 30,
        linksClickable: false,
      },
      media: {
        minCount: 1,
        maxCount: 1,
        mixedTypesAllowed: false,
        // The API accepts 0.01:1 to 10:1; 9:16 is a recommendation, not a rule.
        video: { ...VERTICAL_VIDEO, minAspectRatio: 0.01, maxAspectRatio: 10 },
      },
      features: ['first_comment', 'location_tag', 'user_tag', 'product_tag', 'collaborator_tag', 'custom_thumbnail'],
      // Audio baked into the file is fine; a track from Instagram's catalogue
      // is not, and that is what most trending Reels use.
      reminderTriggers: ['native_audio'],
    },
    {
      format: 'story',
      delivery: 'auto',
      text: {
        maxLength: 2200,
        counting: { kind: 'grapheme' },
        required: false,
        linksClickable: false,
      },
      media: {
        minCount: 1,
        maxCount: 1,
        mixedTypesAllowed: false,
        image: { ...FEED_IMAGE, minAspectRatio: 0.5, maxAspectRatio: 0.6 },
        video: { ...VERTICAL_VIDEO, maxDurationSec: 60, maxBytes: 100 * MB },
      },
      features: [],
      // Plain Stories publish fine; every interactive element forces the
      // reminder path. This is the single largest source of manual publishing
      // in the product, because Stories are Instagram's most-used format.
      reminderTriggers: ['any_sticker', 'native_audio', 'poll_attached'],
      limitationNote:
        'Instagram publishes plain image and video Stories through the API, but link stickers, polls, questions, music and other interactive stickers cannot be added programmatically.',
    },
  ],
};

export const FACEBOOK: PlatformCapabilities = {
  network: 'facebook',
  verifiedOn: '2026-08-12',
  sources: ['https://developers.facebook.com/docs/pages-api', 'research/06-platform-apis-tier1.md'],
  publishing: {
    // Advisory rather than a hard API ceiling, but exceeding it reliably
    // attracts spam classification.
    maxPostsPer24h: 25,
    rejectsDuplicateContent: true,
  },
  read: {
    comments: true,
    directMessages: true,
    analytics: true,
    keywordSearch: false,
    webhooks: true,
    deletePost: true,
    editPost: true,
    maxDataRetentionDays: null,
    dmReplyWindowHours: 24,
  },
  formats: [
    {
      format: 'text',
      delivery: 'auto',
      text: { maxLength: 63_206, counting: { kind: 'grapheme' }, required: true, linksClickable: true },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: ['first_comment', 'link_in_body', 'native_scheduling'],
    },
    {
      format: 'image',
      delivery: 'auto',
      text: { maxLength: 63_206, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 4 * MB, maxWidth: 2048, maxHeight: 2048, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['first_comment', 'alt_text', 'location_tag', 'link_in_body', 'native_scheduling'],
    },
    {
      format: 'video',
      delivery: 'auto',
      text: { maxLength: 63_206, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: {
        minCount: 1,
        maxCount: 1,
        mixedTypesAllowed: false,
        video: { ...VERTICAL_VIDEO, maxBytes: 10_240 * MB, maxDurationSec: 14_400, minAspectRatio: 0.1, maxAspectRatio: 10 },
      },
      features: ['first_comment', 'custom_thumbnail', 'link_in_body', 'native_scheduling'],
    },
  ],
};

export const THREADS: PlatformCapabilities = {
  network: 'threads',
  verifiedOn: '2026-08-12',
  sources: ['https://developers.facebook.com/docs/threads', 'research/06-platform-apis-tier1.md'],
  publishing: {
    // Replies are exempt from this ceiling.
    maxPostsPer24h: 250,
    rejectsDuplicateContent: false,
  },
  read: {
    comments: true,
    directMessages: false,
    analytics: true,
    keywordSearch: false,
    webhooks: false,
    deletePost: true,
    editPost: false,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'text',
      delivery: 'auto',
      text: { maxLength: 500, counting: { kind: 'grapheme' }, required: true, linksClickable: true },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: ['link_in_body', 'reply_controls'],
      limitationNote: 'Threads has no API for quote posts, GIFs, or native scheduling.',
    },
    {
      format: 'image',
      delivery: 'auto',
      text: { maxLength: 500, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, image: { ...FEED_IMAGE, minAspectRatio: 0.01, maxAspectRatio: 10 } },
      features: ['alt_text', 'link_in_body', 'reply_controls'],
    },
    {
      format: 'carousel',
      delivery: 'auto',
      text: { maxLength: 500, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 2, maxCount: 20, mixedTypesAllowed: true, image: { ...FEED_IMAGE, minAspectRatio: 0.01, maxAspectRatio: 10 }, video: { ...VERTICAL_VIDEO, maxDurationSec: 300, minAspectRatio: 0.01, maxAspectRatio: 10 } },
      features: ['alt_text', 'link_in_body'],
    },
  ],
};

export const X: PlatformCapabilities = {
  network: 'x',
  verifiedOn: '2026-08-12',
  sources: ['https://docs.x.com/x-api', 'research/06-platform-apis-tier1.md'],
  publishing: {
    rejectsDuplicateContent: true,
    // X is the only major network that charges per write, which makes the
    // figure load-bearing for both scheduling and pricing.
    //
    // UNVERIFIED, and flagged as the single highest-consequence unconfirmed
    // fact in the research: at 100k link-posts a month the difference between
    // these numbers and the real ones is roughly $20k of monthly cost. They are
    // recorded so the scheduler can warn about spend, and marked so billing
    // refuses to read them until someone confirms them against the developer
    // portal.
    costPerPostUsd: 0.015,
    costPerPostWithLinkUsd: 0.2,
    costConfidence: 'unverified',
  },
  read: {
    comments: true,
    directMessages: true,
    analytics: true,
    keywordSearch: true,
    webhooks: false,
    deletePost: true,
    editPost: false,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'text',
      delivery: 'auto',
      text: {
        maxLength: 280,
        counting: { kind: 'x-weighted', urlWeight: 23 },
        required: true,
        linksClickable: true,
      },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: ['link_in_body', 'poll', 'quote_post', 'reply_controls'],
    },
    {
      format: 'image',
      delivery: 'auto',
      text: {
        maxLength: 280,
        counting: { kind: 'x-weighted', urlWeight: 23 },
        required: false,
        linksClickable: true,
      },
      media: { minCount: 1, maxCount: 4, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 5 * MB, minWidth: 4, minHeight: 4, maxWidth: 8192, maxHeight: 8192, minAspectRatio: 0.1, maxAspectRatio: 10, mimeTypes: JPEG_PNG_WEBP } },
      features: ['alt_text', 'link_in_body', 'reply_controls'],
    },
    {
      format: 'video',
      delivery: 'auto',
      text: {
        maxLength: 280,
        counting: { kind: 'x-weighted', urlWeight: 23 },
        required: false,
        linksClickable: true,
      },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, video: { ...VERTICAL_VIDEO, maxBytes: 512 * MB, minDurationSec: 0.5, maxDurationSec: 140, minWidth: 32, minHeight: 32, minAspectRatio: 0.33, maxAspectRatio: 3 } },
      features: ['alt_text', 'link_in_body', 'reply_controls'],
    },
    {
      format: 'thread',
      delivery: 'auto',
      text: {
        maxLength: 280,
        counting: { kind: 'x-weighted', urlWeight: 23 },
        required: true,
        linksClickable: true,
      },
      media: { minCount: 0, maxCount: 4, mixedTypesAllowed: false, image: FEED_IMAGE },
      features: ['link_in_body', 'reply_controls'],
    },
  ],
};

export const LINKEDIN: PlatformCapabilities = {
  network: 'linkedin',
  verifiedOn: '2026-08-12',
  sources: [
    'https://learn.microsoft.com/en-us/linkedin/marketing/',
    'research/06-platform-apis-tier1.md',
  ],
  publishing: { maxPostsPer24h: 150, rejectsDuplicateContent: false },
  read: {
    comments: true,
    // LinkedIn exposes no generic messaging permission to third parties at all.
    directMessages: false,
    analytics: true,
    keywordSearch: false,
    webhooks: false,
    deletePost: true,
    editPost: true,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'text',
      delivery: 'auto',
      text: { maxLength: 3000, counting: { kind: 'grapheme' }, required: true, linksClickable: true },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: ['link_in_body'],
    },
    {
      format: 'image',
      delivery: 'auto',
      text: { maxLength: 3000, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 1, maxCount: 20, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 10 * MB, maxWidth: 7680, maxHeight: 7680, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['alt_text', 'link_in_body'],
    },
    {
      format: 'video',
      delivery: 'auto',
      text: { maxLength: 3000, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, video: { ...VERTICAL_VIDEO, maxBytes: 500 * MB, maxDurationSec: 1800, minWidth: 256, minHeight: 144, minAspectRatio: 0.417, maxAspectRatio: 2.4 } },
      features: ['custom_thumbnail', 'link_in_body'],
    },
    {
      format: 'document',
      delivery: 'auto',
      text: { maxLength: 3000, counting: { kind: 'grapheme' }, required: false, linksClickable: true, maxTitleLength: 100 },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false },
      features: ['title', 'link_in_body'],
    },
  ],
};

export const TIKTOK: PlatformCapabilities = {
  network: 'tiktok',
  verifiedOn: '2026-08-12',
  sources: [
    'https://developers.tiktok.com/doc/content-posting-api-get-started',
    'research/06-platform-apis-tier1.md',
  ],
  publishing: {
    // Shared across every third-party client the user has connected, not just
    // ours — so our own accounting is necessarily an upper bound.
    maxPostsPer24h: 15,
    maxRequestsPerMinute: 6,
    rejectsDuplicateContent: false,
  },
  read: {
    comments: true,
    directMessages: true,
    analytics: true,
    // Open keyword search is confined to the Research API, which is not
    // available for commercial use.
    keywordSearch: false,
    webhooks: true,
    deletePost: false,
    editPost: false,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'reel',
      delivery: 'auto',
      text: { maxLength: 2200, counting: { kind: 'grapheme' }, required: false, linksClickable: false },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, video: { ...VERTICAL_VIDEO, maxBytes: 4096 * MB, maxDurationSec: 600, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['custom_thumbnail', 'reply_controls'],
      reminderTriggers: ['native_audio', 'any_sticker', 'poll_attached'],
      limitationNote:
        'TikTok has no API for its sound library, stickers, polls or Q&A; posts needing those must be published manually.',
    },
    {
      format: 'carousel',
      delivery: 'auto',
      text: { maxLength: 2200, counting: { kind: 'grapheme' }, required: false, linksClickable: false },
      media: { minCount: 1, maxCount: 35, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 20 * MB, minAspectRatio: 0.1, maxAspectRatio: 10, mimeTypes: ['image/jpeg', 'image/webp'] } },
      features: ['reply_controls'],
    },
  ],
};

export const YOUTUBE: PlatformCapabilities = {
  network: 'youtube',
  verifiedOn: '2026-08-12',
  sources: ['https://developers.google.com/youtube/v3', 'research/06-platform-apis-tier1.md'],
  publishing: {
    // The binding constraint is the 10,000-unit daily quota rather than a post
    // count; an upload costs ~1600 units.
    maxPostsPer24h: 6,
    rejectsDuplicateContent: false,
  },
  read: {
    comments: true,
    directMessages: false,
    analytics: true,
    keywordSearch: true,
    webhooks: false,
    deletePost: true,
    editPost: true,
    // YouTube's API terms cap how long its data may be stored.
    maxDataRetentionDays: 30,
  },
  formats: [
    {
      format: 'video',
      delivery: 'auto',
      text: {
        maxLength: 5000,
        counting: { kind: 'utf16' },
        required: false,
        linksClickable: true,
        maxTitleLength: 100,
      },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, video: { ...VERTICAL_VIDEO, maxBytes: 262_144 * MB, maxDurationSec: 43_200, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['title', 'custom_thumbnail', 'link_in_body', 'native_scheduling'],
    },
    {
      format: 'reel',
      delivery: 'auto',
      text: {
        maxLength: 5000,
        counting: { kind: 'utf16' },
        required: false,
        linksClickable: true,
        maxTitleLength: 100,
      },
      media: { minCount: 1, maxCount: 1, mixedTypesAllowed: false, video: { ...VERTICAL_VIDEO, maxBytes: 262_144 * MB, maxDurationSec: 180, maxAspectRatio: 1 } },
      features: ['title', 'custom_thumbnail', 'link_in_body', 'native_scheduling'],
    },
  ],
};

export const PINTEREST: PlatformCapabilities = {
  network: 'pinterest',
  verifiedOn: '2026-08-12',
  sources: ['https://developers.pinterest.com/docs/api/v5/', 'research/06-platform-apis-tier1.md'],
  publishing: {
    rejectsDuplicateContent: false,
    // Newly created accounts are reported to fail publishing until aged.
    newAccountWarmupDays: 14,
  },
  read: {
    comments: true,
    directMessages: false,
    analytics: true,
    keywordSearch: false,
    webhooks: false,
    deletePost: true,
    editPost: true,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'pin',
      delivery: 'auto',
      text: {
        maxLength: 800,
        counting: { kind: 'grapheme' },
        required: false,
        linksClickable: true,
        maxTitleLength: 100,
      },
      media: { minCount: 1, maxCount: 5, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 20 * MB, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['title', 'alt_text', 'link_in_body'],
    },
  ],
};

export const BLUESKY: PlatformCapabilities = {
  network: 'bluesky',
  verifiedOn: '2026-08-12',
  sources: ['https://docs.bsky.app/', 'research/06-platform-apis-tier1.md'],
  publishing: { rejectsDuplicateContent: false },
  read: {
    comments: true,
    directMessages: true,
    analytics: false,
    // The AT Protocol firehose is open, which makes Bluesky uniquely cheap to
    // support for listening.
    keywordSearch: true,
    webhooks: true,
    deletePost: true,
    editPost: false,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'text',
      delivery: 'auto',
      text: { maxLength: 300, counting: { kind: 'grapheme' }, required: true, linksClickable: true },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: ['link_in_body', 'quote_post', 'reply_controls'],
    },
    {
      format: 'image',
      delivery: 'auto',
      text: { maxLength: 300, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      media: { minCount: 1, maxCount: 4, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 1 * MB, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['alt_text', 'link_in_body', 'quote_post'],
    },
  ],
};

export const GOOGLE_BUSINESS: PlatformCapabilities = {
  network: 'google_business',
  verifiedOn: '2026-08-12',
  sources: [
    'https://developers.google.com/my-business/reference/rest',
    'research/07-platform-apis-tier2.md',
  ],
  publishing: { rejectsDuplicateContent: false },
  read: {
    comments: true,
    directMessages: true,
    analytics: true,
    keywordSearch: false,
    webhooks: false,
    deletePost: true,
    editPost: true,
    maxDataRetentionDays: null,
  },
  formats: [
    {
      format: 'image',
      delivery: 'auto',
      text: { maxLength: 1500, counting: { kind: 'grapheme' }, required: false, linksClickable: true },
      // Google accepts only one image per post; extra images are dropped.
      media: { minCount: 0, maxCount: 1, mixedTypesAllowed: false, image: { ...FEED_IMAGE, maxBytes: 5 * MB, minAspectRatio: 0.1, maxAspectRatio: 10 } },
      features: ['link_in_body'],
      limitationNote: 'Google Business Profile posts support a single image; only the first is published.',
    },
    {
      format: 'review_reply',
      delivery: 'auto',
      text: { maxLength: 4096, counting: { kind: 'grapheme' }, required: true, linksClickable: false },
      media: { minCount: 0, maxCount: 0, mixedTypesAllowed: false },
      features: [],
    },
  ],
};

const REGISTRY = new Map<NetworkId, PlatformCapabilities>([
  ['instagram', INSTAGRAM],
  ['facebook', FACEBOOK],
  ['threads', THREADS],
  ['x', X],
  ['linkedin', LINKEDIN],
  ['tiktok', TIKTOK],
  ['youtube', YOUTUBE],
  ['pinterest', PINTEREST],
  ['bluesky', BLUESKY],
  ['google_business', GOOGLE_BUSINESS],
]);

/** Capabilities for a network, or undefined if not yet described. */
export function capabilitiesFor(network: NetworkId): PlatformCapabilities | undefined {
  return REGISTRY.get(network);
}

/** Networks with a capability descriptor, i.e. those the composer can target. */
export function describedNetworks(): readonly NetworkId[] {
  return [...REGISTRY.keys()];
}
