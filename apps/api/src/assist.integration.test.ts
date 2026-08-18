import { strict as assert } from 'node:assert';
import { after, before, describe, test } from 'node:test';

import type { AssistantProvider } from '@smm/assistant';
import { createDatabase, type Sql } from '@smm/db';
import type { OrganizationId } from '@smm/shared';

import { assistDraft, getBrandVoice, setBrandVoice } from './assist.js';

/**
 * The assistant against a real database.
 *
 * The generation itself is covered without a database in `@smm/assistant`.
 * What needs Postgres is the part that made it wrong once already: brand voice
 * lives in a jsonb column, and pre-stringifying an object bound to jsonb stores
 * a quoted blob that reads back as a string parsing to nothing. That failed
 * silently — the write succeeded and the voice was simply gone.
 */

const url = process.env['TEST_DATABASE_URL'];

describe('the writing assistant, against Postgres', { skip: url === undefined ? 'TEST_DATABASE_URL not set' : false }, () => {
  let sql: Sql;
  let organizationId: OrganizationId;
  let profileGroupId: string;

  before(() => {
    sql = createDatabase({ url: url ?? '', ssl: false, poolSize: 4 });
  });

  after(async () => {
    await sql?.end({ timeout: 5 });
  });

  async function fixture(): Promise<void> {
    const [org] = await sql<{ id: string }[]>`
      INSERT INTO organizations (name, slug)
      VALUES ('Assist Test', ${'assist-' + Math.random().toString(36).slice(2, 10)})
      RETURNING id
    `;
    if (org === undefined) throw new Error('no organization');
    organizationId = org.id as OrganizationId;

    const [group] = await sql<{ id: string }[]>`
      INSERT INTO profile_groups (organization_id, name, timezone)
      VALUES (${organizationId}, 'Brand', 'UTC') RETURNING id
    `;
    if (group === undefined) throw new Error('no profile group');
    profileGroupId = group.id;
  }

  async function cleanup(): Promise<void> {
    await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
  }

  function stubProvider(reply: string): AssistantProvider {
    return { name: 'stub', async complete() { return { texts: [reply] }; } };
  }

  test('a brand voice survives the round trip through jsonb', async () => {
    await fixture();
    try {
      assert.equal(
        await setBrandVoice(sql, organizationId, profileGroupId, {
          description: 'Warm, plain-spoken, never salesy.',
          formality: 'conversational',
          traits: ['warm', 'precise'],
          bannedTerms: ['synergy'],
        }),
        true,
      );

      const voice = await getBrandVoice(sql, organizationId, profileGroupId);
      assert.equal(voice?.description, 'Warm, plain-spoken, never salesy.');
      assert.deepEqual(voice?.traits, ['warm', 'precise']);

      // The column must hold an object. Pre-stringifying stores a quoted blob
      // that reads back as a string, and the whole voice silently disappears
      // while the write reports success.
      const [row] = await sql<{ kind: string }[]>`
        SELECT jsonb_typeof(brand_voice) AS kind FROM profile_groups WHERE id = ${profileGroupId}
      `;
      assert.equal(row?.kind, 'object');
    } finally {
      await cleanup();
    }
  });

  test('unrecognised fields are not stored', async () => {
    await fixture();
    try {
      await setBrandVoice(sql, organizationId, profileGroupId, {
        description: 'Fine.',
        somethingElse: 'should not persist',
      });

      const [row] = await sql<{ keys: string[] }[]>`
        SELECT ARRAY(SELECT jsonb_object_keys(brand_voice)) AS keys
        FROM profile_groups WHERE id = ${profileGroupId}
      `;
      // The column outlives this code; storing only what is recognised keeps
      // it from accumulating whatever a future client happens to send.
      assert.deepEqual(row?.keys, ['description']);
    } finally {
      await cleanup();
    }
  });

  test('a brand in another tenant cannot be read or written', async () => {
    await fixture();
    try {
      await setBrandVoice(sql, organizationId, profileGroupId, { description: 'Mine.' });
      const other = '00000000-0000-4000-8000-00000000000b' as OrganizationId;

      assert.equal(await setBrandVoice(sql, other, profileGroupId, { description: 'Theirs.' }), false);
      assert.equal(await getBrandVoice(sql, other, profileGroupId), undefined);

      // And the write must not have landed.
      const mine = await getBrandVoice(sql, organizationId, profileGroupId);
      assert.equal(mine?.description, 'Mine.');
    } finally {
      await cleanup();
    }
  });

  test('drafting refuses a brand that is not yours', async () => {
    await fixture();
    try {
      const other = '00000000-0000-4000-8000-00000000000c' as OrganizationId;
      const result = await assistDraft(
        sql,
        other,
        { profileGroupId, brief: 'anything', network: 'bluesky', variants: 1 },
        stubProvider('A post.'),
      );
      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.reason, 'unknown_profile_group');
    } finally {
      await cleanup();
    }
  });

  test('the brand’s own recent posts are what novelty is judged against', async () => {
    await fixture();
    try {
      const [post] = await sql<{ id: string }[]>`
        INSERT INTO posts (organization_id, profile_group_id, format, body, status)
        VALUES (${organizationId}, ${profileGroupId}, 'text',
                'Our summer sale starts today. Twenty percent off everything.', 'published')
        RETURNING id
      `;
      assert.ok(post);

      const result = await assistDraft(
        sql,
        organizationId,
        { profileGroupId, brief: 'summer sale', network: 'bluesky', variants: 2 },
        stubProvider(
          'Our summer sale starts today. Twenty percent off everything.\n' +
            'We rebuilt the checkout this year. Here is what changed.',
        ),
      );

      assert.ok(result.ok, result.ok ? '' : result.message);
      // The repeat is still offered — reposting on purpose is allowed — but it
      // is ranked last and named.
      assert.ok(result.drafts[0]!.novelty > result.drafts[1]!.novelty);
      assert.ok(result.drafts[1]!.novelty < 0.2);
    } finally {
      await cleanup();
    }
  });

  test('a stored banned term is enforced on what comes back', async () => {
    await fixture();
    try {
      await setBrandVoice(sql, organizationId, profileGroupId, { bannedTerms: ['guaranteed'] });

      const result = await assistDraft(
        sql,
        organizationId,
        { profileGroupId, brief: 'returns policy', network: 'bluesky', variants: 2 },
        stubProvider('Returns are guaranteed.\nReturns take about a week.'),
      );

      assert.ok(result.ok, result.ok ? '' : result.message);
      assert.equal(result.drafts.length, 1);
      assert.equal(result.drafts[0]?.text, 'Returns take about a week.');
    } finally {
      await cleanup();
    }
  });
});
