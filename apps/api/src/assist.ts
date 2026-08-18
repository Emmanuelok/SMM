import type { NetworkId } from '@smm/adapters';
import {
  draftPosts,
  parseBrandVoice,
  type AssistantProvider,
  type DraftResult,
} from '@smm/assistant';
import type { Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

/**
 * The writing assistant, connected to this workspace's own data.
 *
 * The package it calls is pure and knows nothing about tables. This is the
 * layer that fetches the two things that make a draft specific to a brand
 * rather than generic: the voice that brand wrote down, and what it has
 * actually been posting.
 *
 * The second is what most tools skip. A model with no idea what you published
 * last week will cheerfully write you last week's post again, and the person
 * reviewing it has to remember that themselves — every time, forever.
 */

export interface AssistRequest {
  readonly profileGroupId: string;
  readonly brief: string;
  readonly network: NetworkId;
  readonly variants: number;
}

export type AssistOutcome =
  | { readonly ok: false; readonly reason: 'unknown_profile_group'; readonly message: string }
  | DraftResult;

/**
 * How much recent history to show the model.
 *
 * Enough to stop it repeating itself, few enough to stay inside the prompt
 * budget. Twenty is roughly a month for an active brand, which is the window
 * in which a repeat is noticeable to a follower.
 */
const RECENT_POSTS = 20;

export async function assistDraft(
  sql: Sql,
  organizationId: OrganizationId,
  request: AssistRequest,
  provider: AssistantProvider | undefined,
): Promise<AssistOutcome> {
  const [group] = await sql<{ id: string; brand_voice: unknown }[]>`
    SELECT id, brand_voice FROM profile_groups
    WHERE id = ${request.profileGroupId}
      AND organization_id = ${organizationId}
      AND deleted_at IS NULL
  `;

  if (group === undefined) {
    return {
      ok: false,
      reason: 'unknown_profile_group',
      message: 'That brand does not exist, or is not yours.',
    };
  }

  // Scoped to the brand rather than the whole workspace. An agency's twelve
  // clients must not lend each other their history — the point of asking is
  // "have *we* said this", and the answer is per client.
  const recent = await sql<{ body: string }[]>`
    SELECT DISTINCT ON (p.id) COALESCE(v.body, p.body) AS body
    FROM posts p
    LEFT JOIN post_versions v ON v.post_id = p.id
    WHERE p.organization_id = ${organizationId}
      AND p.profile_group_id = ${request.profileGroupId}
      AND p.deleted_at IS NULL
      AND p.status IN ('published', 'scheduled', 'partially_failed')
    ORDER BY p.id, v.version DESC
    LIMIT ${RECENT_POSTS}
  `;

  return draftPosts(
    {
      brief: request.brief,
      network: request.network,
      voice: parseBrandVoice(group.brand_voice),
      variants: request.variants,
      recentPosts: recent.map((row) => row.body).filter((body) => body.trim() !== ''),
    },
    { ...(provider === undefined ? {} : { provider }) },
  );
}

/**
 * Update the voice a brand writes in.
 *
 * Parsed on the way in as well as on the way out. The column is jsonb and will
 * outlive this code; storing only fields we recognise keeps the shape from
 * accumulating whatever a future client happens to post.
 */
export async function setBrandVoice(
  sql: Sql,
  organizationId: OrganizationId,
  profileGroupId: string,
  value: unknown,
): Promise<boolean> {
  const voice = parseBrandVoice(value);
  const rows = await sql<{ id: string }[]>`
    UPDATE profile_groups
    -- sql.json, not JSON.stringify. The driver serialises objects bound to a
    -- jsonb column itself, so pre-stringifying stores a JSON *string*: the
    -- column ends up holding a quoted blob rather than an object, and it reads
    -- back as a string that parses to nothing.
    SET brand_voice = ${sql.json({ ...voice })}, updated_at = now()
    WHERE id = ${profileGroupId}
      AND organization_id = ${organizationId}
      AND deleted_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

export async function getBrandVoice(
  sql: Sql,
  organizationId: OrganizationId,
  profileGroupId: string,
): Promise<ReturnType<typeof parseBrandVoice> | undefined> {
  const [row] = await sql<{ brand_voice: unknown }[]>`
    SELECT brand_voice FROM profile_groups
    WHERE id = ${profileGroupId} AND organization_id = ${organizationId} AND deleted_at IS NULL
  `;
  return row === undefined ? undefined : parseBrandVoice(row.brand_voice);
}
