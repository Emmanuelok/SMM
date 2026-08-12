/**
 * Branded identifier types.
 *
 * Every one of these is a string at runtime, but the brand stops an
 * OrganizationId being passed where a SocialProfileId is expected. In a system
 * whose whole job is routing content between tenants and third-party accounts,
 * that class of mix-up is a data leak across tenants, so it is worth the
 * ceremony.
 */
declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type OrganizationId = Brand<string, 'OrganizationId'>;
export type ProfileGroupId = Brand<string, 'ProfileGroupId'>;
export type SocialProfileId = Brand<string, 'SocialProfileId'>;
export type UserId = Brand<string, 'UserId'>;
export type UserGroupId = Brand<string, 'UserGroupId'>;
export type PostId = Brand<string, 'PostId'>;
export type PostTargetId = Brand<string, 'PostTargetId'>;
export type MediaAssetId = Brand<string, 'MediaAssetId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ApprovalWorkflowId = Brand<string, 'ApprovalWorkflowId'>;
export type QueueId = Brand<string, 'QueueId'>;
export type CredentialId = Brand<string, 'CredentialId'>;

/**
 * The identifier a network itself assigns (a Facebook page id, a TikTok open
 * id). Deliberately distinct from our own ids — these are foreign keys into
 * systems we do not control and must never be treated as trusted or stable.
 */
export type RemoteId = Brand<string, 'RemoteId'>;

const ID_PATTERN = /^[0-9a-z]{8,64}$/i;

/** Assert an untrusted string is a plausible internal id, then brand it. */
export function asId<B extends string>(value: string, kind: B): Brand<string, B> {
  if (!ID_PATTERN.test(value)) {
    throw new TypeError(`Invalid ${kind}: expected 8-64 alphanumeric characters`);
  }
  return value as Brand<string, B>;
}

/**
 * Brand a value with no validation.
 *
 * For values already known to be well-formed — rows read back from our own
 * database, ids minted internally. Never call this on user input.
 */
export function unsafeId<B extends string>(value: string): Brand<string, B> {
  return value as Brand<string, B>;
}

/** Brand an identifier received from a third-party network. */
export function remoteId(value: string): RemoteId {
  return value as RemoteId;
}
