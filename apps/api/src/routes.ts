import { BlueskyAdapter, MastodonAdapter, isAuthRedirect, normalizeInstance } from '@smm/adapters';
import { CredentialVault, blueskyCredentials, mastodonCredentials } from '@smm/credentials';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { Sql } from '@smm/db';
import { unsafeId, type OrganizationId } from '@smm/shared';
import type { Vault } from '@smm/vault';

import type { AuthenticatedUser } from './auth.js';
import { OAuthStateStore, saveConnection } from './oauth.js';
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
  /** Public origin, used to build the OAuth redirect a network must return to. */
  readonly publicUrl: string;
  readonly requireUser: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<AuthenticatedUser | undefined>;
}

export function registerRoutes(app: FastifyInstance, deps: RouteDeps): void {
  const { sql, vault, requireUser } = deps;
  const credentials = new CredentialVault(sql, vault);
  const bluesky = new BlueskyAdapter(blueskyCredentials(credentials));
  const mastodon = new MastodonAdapter(mastodonCredentials(credentials));
  const oauthStates = new OAuthStateStore(sql, vault);

  /** Where a network sends the user back. Must match what was registered. */
  const callbackUrl = (network: string): string =>
    new URL(`/api/networks/${network}/callback`, deps.publicUrl).toString();

  /** Confirm a brand belongs to the caller before anything is attached to it. */
  async function ownedGroup(
    organizationId: AuthenticatedUser['organizationId'],
    profileGroupId: string,
  ): Promise<string | undefined> {
    const [group] = await sql<{ id: string }[]>`
      SELECT id FROM profile_groups
      WHERE id = ${profileGroupId} AND organization_id = ${organizationId}
        AND deleted_at IS NULL
    `;
    return group?.id;
  }

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

    if (network === 'bluesky') {
      return reply.send(
        await bluesky.beginAuth({
          network: 'bluesky',
          organizationId: user.organizationId,
          app: { kind: 'shared', appId: unsafeId('sharedapp') },
          requestedScopes: [],
          redirectUri: '',
          state: '',
        }),
      );
    }

    if (network === 'mastodon') {
      const query = request.query as { instance?: string; profileGroupId?: string };
      const typed = query.instance;

      // First pass: no server yet, so the adapter can only ask which one. It
      // cannot produce a redirect because the client does not exist until it is
      // registered on a specific server.
      if (typed === undefined || typed.trim() === '') {
        return reply.send(
          await mastodon.beginAuth({
            network: 'mastodon',
            organizationId: user.organizationId,
            app: { kind: 'shared', appId: unsafeId('sharedapp') },
            requestedScopes: [],
            redirectUri: callbackUrl('mastodon'),
            state: '',
          }),
        );
      }

      const profileGroupId = query.profileGroupId;
      if (profileGroupId === undefined) {
        return reply.code(400).send({ error: 'profile_group_required' });
      }
      const group = await ownedGroup(user.organizationId, profileGroupId);
      if (group === undefined) return reply.code(404).send({ error: 'unknown_profile_group' });

      try {
        const instance = normalizeInstance(typed);
        const redirectUri = callbackUrl('mastodon');

        // Second pass: the adapter registers a client on that server and hands
        // back a consent URL. The client credentials exist nowhere else, so
        // they are stored with the state or the callback cannot redeem the code.
        const started = await mastodon.beginAuth({
          network: 'mastodon',
          organizationId: user.organizationId,
          app: { kind: 'shared', appId: unsafeId('sharedapp') },
          requestedScopes: ['read', 'write'],
          redirectUri,
          state: '',
          inputs: { instance },
        });

        if (!isAuthRedirect(started)) return reply.send(started);

        const authorize = new URL(started.redirectUrl);
        const state = await oauthStates.begin({
          organizationId: user.organizationId,
          userId: user.userId,
          profileGroupId: group,
          network: 'mastodon',
          instance,
          clientId: authorize.searchParams.get('client_id') ?? undefined,
          clientSecret: authorize.searchParams.get('client_secret') ?? undefined,
          redirectUri,
        });

        // The adapter cannot mint the state — only this layer knows what it has
        // to be bound to — so it is substituted after the URL is built.
        authorize.searchParams.set('state', state);
        // A registration secret must never travel in a URL the browser follows.
        authorize.searchParams.delete('client_secret');

        return reply.send({ redirectUrl: authorize.toString() });
      } catch (error) {
        const fault = mastodon.classify(error);
        request.log.warn({ kind: fault.kind }, 'mastodon connect start failed');
        return reply.code(400).send({ error: fault.kind, message: fault.message });
      }
    }

    return reply.code(404).send({
      error: 'network_unavailable',
      message: `${network} cannot be connected in this deployment yet.`,
    });
  });

  /**
   * Where a network returns the user after consent.
   *
   * Everything except the code comes from our own stored state. The query
   * string is a third party's input arriving in the victim's browser, and
   * trusting the organisation or brand from it is exactly how an attacker
   * attaches their own account to someone else's workspace.
   */
  app.get('/api/networks/mastodon/callback', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const query = request.query as { code?: string; state?: string; error?: string };

    if (query.error !== undefined) {
      // The user declined, which is not a failure worth an error page.
      return reply.redirect('/?connect=cancelled');
    }
    if (query.code === undefined || query.state === undefined) {
      return reply.code(400).send({ error: 'invalid_callback' });
    }

    const claimed = await oauthStates.consume(query.state, user.organizationId);
    if (!claimed.ok) {
      request.log.warn({ reason: claimed.reason }, 'mastodon callback rejected');
      return reply.redirect(`/?connect=failed&reason=${claimed.reason}`);
    }

    const pending = claimed.pending;
    try {
      const connections = await mastodon.completeAuth({
        network: 'mastodon',
        organizationId: pending.organizationId,
        app: { kind: 'shared', appId: unsafeId('sharedapp') },
        requestedScopes: ['read', 'write'],
        redirectUri: pending.redirectUri,
        state: query.state,
        inputs: {
          instance: pending.instance ?? '',
          clientId: pending.clientId ?? '',
          clientSecret: pending.clientSecret ?? '',
        },
        callbackParams: { code: query.code },
      });

      const connection = connections[0];
      if (connection === undefined) return reply.redirect('/?connect=failed&reason=no_account');

      await saveConnection(sql, pending.profileGroupId, connection);
      return reply.redirect('/?connect=ok');
    } catch (error) {
      const fault = mastodon.classify(error);
      request.log.warn({ kind: fault.kind }, 'mastodon callback failed');
      return reply.redirect(`/?connect=failed&reason=${fault.kind}`);
    }
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

      const group = await ownedGroup(user.organizationId, parsed.data.profileGroupId);
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

        const socialProfileId = await saveConnection(sql, group, connection);

        return reply.code(201).send({
          socialProfileId,
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
