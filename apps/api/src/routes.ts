import { BlueskyAdapter } from '@smm/adapters';
import { CredentialVault, blueskyCredentials } from '@smm/credentials';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { Sql } from '@smm/db';
import { unsafeId, type OrganizationId } from '@smm/shared';
import type { Vault } from '@smm/vault';

import type { AuthenticatedUser } from './auth.js';
import { schedulePost } from './publishing.js';

/**
 * Connecting accounts, and composing posts.
 *
 * The connect flow is driven by the adapter rather than by this file. An
 * adapter describes what it needs as data — a redirect, or a list of steps and
 * fields — and the generic flow renders it. A network with an unusual
 * connection process therefore costs no work here, which matters when the
 * roadmap is sixty networks and several of them do not use OAuth at all.
 */

const connectSchema = z.object({
  profileGroupId: z.string().uuid(),
  identifier: z.string().min(1).max(300),
  appPassword: z.string().min(1).max(300),
});

const scheduleSchema = z.object({
  profileGroupId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
  format: z.enum(['text', 'image']).default('text'),
  socialProfileIds: z.array(z.string().uuid()).min(1).max(50),
  scheduledLocal: z.string().min(10).max(20),
  timezone: z.string().min(1).max(64),
});

export interface RouteDeps {
  readonly sql: Sql;
  readonly vault: Vault;
  readonly requireUser: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<AuthenticatedUser | undefined>;
}

export function registerRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { sql, vault, requireUser } = deps;
  const credentials = new CredentialVault(sql, vault);
  const bluesky = new BlueskyAdapter(blueskyCredentials(credentials));

  /**
   * What a network needs in order to be connected.
   *
   * Read straight off the adapter, so the connect UI never hard-codes a
   * network's flow. Bluesky answers with instructions rather than a redirect,
   * because it has no third-party consent screen.
   */
  app.get('/api/networks/:network/connect', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { network } = request.params as { network: string };
    if (network !== 'bluesky') {
      return reply.code(404).send({
        error: 'network_unavailable',
        message: `${network} cannot be connected in this deployment yet.`,
      });
    }

    const start = await bluesky.beginAuth({
      network: 'bluesky',
      organizationId: user.organizationId,
      app: { kind: 'shared', appId: unsafeId('sharedapp') },
      requestedScopes: [],
      redirectUri: '',
      state: '',
    });
    return reply.send(start);
  });

  /**
   * Complete a Bluesky connection.
   *
   * The credential is verified against the network before anything is stored, so
   * a typo is reported now rather than becoming an account that fails silently
   * at its first scheduled post.
   */
  app.post(
    '/api/networks/bluesky/connect',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (user === undefined) return reply;

      const parsed = connectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      }

      const [group] = await sql<{ id: string }[]>`
        SELECT id FROM profile_groups
        WHERE id = ${parsed.data.profileGroupId}
          AND organization_id = ${user.organizationId}
          AND deleted_at IS NULL
      `;
      if (group === undefined) {
        return reply.code(404).send({ error: 'unknown_profile_group' });
      }

      try {
        const connections = await bluesky.completeAuth({
          network: 'bluesky',
          organizationId: user.organizationId,
          app: { kind: 'shared', appId: unsafeId('sharedapp') },
          requestedScopes: [],
          redirectUri: '',
          state: '',
          inputs: {
            identifier: parsed.data.identifier,
            appPassword: parsed.data.appPassword,
          },
        });

        const connection = connections[0];
        if (connection === undefined) {
          return reply.code(502).send({ error: 'no_account_returned' });
        }

        // Re-connecting an account already present updates it rather than
        // creating a second row, so a reconnect after an expired credential
        // does not silently duplicate the account in the picker.
        const [profile] = await sql<{ id: string }[]>`
          INSERT INTO social_profiles (
            organization_id, profile_group_id, network, remote_account_id,
            handle, display_name, credential_id, status
          )
          VALUES (
            ${user.organizationId}, ${group.id}, 'bluesky', ${connection.account.id},
            ${connection.account.handle ?? null}, ${connection.account.displayName},
            ${connection.credentialId}, 'active'
          )
          ON CONFLICT (organization_id, network, remote_account_id)
          DO UPDATE SET
            credential_id = EXCLUDED.credential_id,
            display_name  = EXCLUDED.display_name,
            handle        = EXCLUDED.handle,
            status        = 'active',
            updated_at    = now()
          RETURNING id
        `;
        if (profile === undefined) throw new Error('Profile upsert returned no row');

        return reply.code(201).send({
          socialProfileId: profile.id,
          handle: connection.account.handle,
          displayName: connection.account.displayName,
        });
      } catch (error) {
        const fault = bluesky.classify(error);
        request.log.warn({ kind: fault.kind }, 'bluesky connect failed');

        // Re-worded for this flow. `auth_expired` during publishing means
        // "reconnect the account"; during connect there is no account yet, and
        // telling someone to reconnect something they are in the middle of
        // connecting is the kind of message that generates support tickets.
        const message =
          fault.kind === 'auth_expired'
            ? 'Bluesky did not accept that handle and app password. Check the handle has no @ ' +
              'and that the app password was copied whole — it is only shown once.'
            : fault.message;

        return reply.code(400).send({ error: fault.kind, message });
      }
    },
  );

  app.get('/api/social-profiles', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const profiles = await sql<
      {
        id: string;
        network: string;
        handle: string | null;
        display_name: string;
        status: string;
        profile_group_id: string;
      }[]
    >`
      SELECT id, network, handle, display_name, status, profile_group_id
      FROM social_profiles
      WHERE organization_id = ${user.organizationId} AND deleted_at IS NULL
      ORDER BY connected_at
    `;
    return reply.send({ socialProfiles: profiles });
  });

  /**
   * Compose and schedule.
   *
   * Validation runs here rather than in the worker, so an over-length post is
   * refused while its author is looking at it instead of failing overnight.
   */
  app.post('/api/posts', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const parsed = scheduleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }

    try {
      const result = await schedulePost(sql, user.organizationId as OrganizationId, parsed.data);
      if (!result.ok) {
        return reply.code(400).send({
          error: result.reason,
          message: result.message,
          issues: result.issues,
        });
      }
      return reply.code(201).send(result);
    } catch (error) {
      // A wall clock inside a daylight-saving gap reaches here. It is a real
      // user error with an actionable message, not an internal fault.
      const message = error instanceof Error ? error.message : 'Could not schedule this post.';
      if (/does not exist in/.test(message)) {
        return reply.code(400).send({ error: 'unschedulable_time', message });
      }
      throw error;
    }
  });

  app.get('/api/posts', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const posts = await sql<
      {
        id: string;
        body: string;
        status: string;
        network: string;
        scheduled_at: Date | null;
        scheduled_local: Date | null;
        scheduled_timezone: string | null;
        target_status: string;
        remote_url: string | null;
        failure_message: string | null;
      }[]
    >`
      SELECT p.id, p.body, p.status, t.network, t.scheduled_at,
             t.scheduled_local, t.scheduled_timezone,
             t.status AS target_status, t.remote_url, t.failure_message
      FROM posts p
      JOIN post_targets t ON t.post_id = p.id
      WHERE p.organization_id = ${user.organizationId} AND p.deleted_at IS NULL
      ORDER BY t.scheduled_at DESC NULLS LAST
      LIMIT 100
    `;
    return reply.send({ posts });
  });
}
