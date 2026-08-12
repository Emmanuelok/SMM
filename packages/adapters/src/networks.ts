/**
 * The set of networks the platform can address.
 *
 * Membership here does not imply a working integration — it is the vocabulary.
 * What a network can actually do is declared separately, in its capability
 * descriptor, because the answer changes as platforms revise their APIs.
 */
export const NETWORK_IDS = [
  // Tier 1 — the mainstream Western networks.
  'instagram',
  'facebook',
  'threads',
  'x',
  'linkedin',
  'tiktok',
  'youtube',
  'pinterest',

  // Tier 2 — long tail, open protocols, messaging.
  'reddit',
  'bluesky',
  'mastodon',
  'telegram',
  'snapchat',
  'discord',
  'twitch',
  'tumblr',
  'whatsapp',

  // Local presence and reputation.
  'google_business',
  'apple_business',
  'yelp',
  'trustpilot',
  'tripadvisor',

  // Long-form and owned channels.
  'substack',
  'medium',
  'ghost',
  'wordpress',

  // Regionally dominant networks. Western tools largely ignore these, which
  // is precisely why they matter.
  'wechat',
  'weibo',
  'douyin',
  'xiaohongshu',
  'kuaishou',
  'bilibili',
  'line',
  'kakao',
  'naver',
  'vk',
  'zalo',
  'sharechat',
  'kwai',
] as const;

export type NetworkId = (typeof NETWORK_IDS)[number];

const NETWORK_ID_SET: ReadonlySet<string> = new Set(NETWORK_IDS);

export function isNetworkId(value: string): value is NetworkId {
  return NETWORK_ID_SET.has(value);
}

/**
 * How far along an integration is.
 *
 * Tracked in the type system because most networks gate production access
 * behind a review process, and the product must not offer a network it cannot
 * actually publish to.
 */
export type IntegrationStatus =
  /** Live for all customers. */
  | 'general_availability'
  /** Built and working, but the platform has us on restricted/dev access. */
  | 'limited_access'
  /** Implemented, not yet approved by the platform. */
  | 'pending_review'
  /** Researched and specified, not yet built. */
  | 'planned'
  /** Investigated and deliberately not pursued; `note` says why. */
  | 'not_viable';

export interface NetworkMeta {
  readonly id: NetworkId;
  readonly displayName: string;
  /** Primary regions where this network holds meaningful share. */
  readonly regions: readonly string[];
  readonly status: IntegrationStatus;
  /** Why a network is `not_viable`, or what blocks it from going live. */
  readonly note?: string | undefined;
}
