import { BlueskyAdapter, MastodonAdapter, isAuthRedirect, normalizeInstance } from '@smm/adapters';
import { CredentialVault, blueskyCredentials, mastodonCredentials } from '@smm/credentials';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { Sql } from '@smm/db';
import { unsafeId, type OrganizationId } from '@smm/shared';
import type { Vault } from '@smm/vault';

import type { AuthenticatedUser } from './auth.js';
import { OAuthStateStore, saveConnection } from './oauth.js';
import { postPerformance, readingHistory } from './analytics.js';
import { cancelPost, deletePost, reschedulePost } from './posts.js';
import { schedulePost, type RequestedTiming, type Timing } from './publishing.js';
import { ensureSchedule, previewQueue, replaceSlots, setPaused } from './queues.js';

/**
 * Route parameters reach Postgres as uuids. An unparseable one would raise a
 * type error from the driver — a 500 for what is really a 404.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The wire shape of a timing choice, turned into the internal one. */
function timingFrom(body: {
  mode: 'at' | 'queue' | 'draft';
  scheduledLocal?: string | undefined;
  timezone?: string | undefined;
  categoryId?: string | undefined;
}): RequestedTiming {
  if (body.mode === 'draft') return { mode: 'draft' };
  if (body.mode === 'queue') return { mode: 'queue', categoryId: body.categoryId ?? null };
  return {
    mode: 'at',
    // Both are present: the schema refuses `at` without them.
    scheduledLocal: body.scheduledLocal ?? '',
    timezone: body.timezone ?? '',
  };
}

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

/**
 * Composing.
 *
 * The time is a discriminated union rather than two optional fields, so
 * "queued" and "scheduled for 09:00" cannot both be half-specified. `at` stays
 * the default, which keeps every existing caller working unchanged.
 */
const scheduleSchema = z
  .object({
    profileGroupId: z.string().uuid(),
    body: z.string().min(1).max(10_000),
    format: z.enum(['text', 'image']).default('text'),
    socialProfileIds: z.array(z.string().uuid()).min(1).max(50),
    mode: z.enum(['at', 'queue', 'draft']).default('at'),
    scheduledLocal: z.string().min(10).max(20).optional(),
    timezone: z.string().min(1).max(64).optional(),
    categoryId: z.string().uuid().optional(),
  })
  .refine(
    (value) => value.mode !== 'at' || (value.scheduledLocal !== undefined && value.timezone !== undefined),
    { message: 'A scheduled post needs both a local time and a timezone.', path: ['scheduledLocal'] },
  );

/** Rescheduling takes the same timing choices, minus "not yet". */
const retimeSchema = z
  .object({
    mode: z.enum(['at', 'queue']).default('at'),
    scheduledLocal: z.string().min(10).max(20).optional(),
    timezone: z.string().min(1).max(64).optional(),
    categoryId: z.string().uuid().optional(),
  })
  .refine(
    (value) => value.mode !== 'at' || (value.scheduledLocal !== undefined && value.timezone !== undefined),
    { message: 'A scheduled post needs both a local time and a timezone.', path: ['scheduledLocal'] },
  );

const slotsSchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        localTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM.'),
        categoryId: z.string().uuid().nullable().optional(),
        acceptsFormats: z.array(z.string().max(40)).max(10).optional(),
      }),
    )
    // A cap, because a slot is cheap to add and a week with ten thousand of them
    // makes every queue read slow for everyone sharing the database.
    .max(200),
});

const pauseSchema = z.object({
  paused: z.boolean(),
  reason: z.string().max(200).optional(),
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

    const body = parsed.data;
    const timing: RequestedTiming = timingFrom(body);

    const result = await schedulePost(sql, user.organizationId as OrganizationId, {
      profileGroupId: body.profileGroupId,
      body: body.body,
      format: body.format,
      socialProfileIds: body.socialProfileIds,
      timing,
    });

    if (!result.ok) {
      return reply.code(400).send({
        error: result.reason,
        message: result.message,
        issues: result.issues,
      });
    }
    return reply.code(201).send(result);
  });

  /**
   * The posting queue for one account.
   *
   * A GET creates the default week if there is none, so the editor always has
   * something to show. An empty grid with an "add your first time" prompt is a
   * question nobody can answer before they have posted anything.
   */
  app.get('/api/social-profiles/:id/queue', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_profile' });

    const query = request.query as { limit?: string };
    const requested = Number(query.limit ?? 20);
    const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 20;

    const schedule = await ensureSchedule(sql, user.organizationId as OrganizationId, id);
    if (schedule === undefined) return reply.code(404).send({ error: 'unknown_profile' });

    return reply.send({
      schedule: {
        id: schedule.id,
        timezone: schedule.timezone,
        paused: schedule.pausedAt != null,
        pauseReason: schedule.pauseReason,
        slots: schedule.slots,
      },
      upcoming: await previewQueue(sql, schedule, limit),
    });
  });

  /** Replace the week. Wholesale, because the editor is a grid. */
  app.put('/api/social-profiles/:id/queue/slots', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_profile' });

    const parsed = slotsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }

    const schedule = await ensureSchedule(sql, user.organizationId as OrganizationId, id);
    if (schedule === undefined) return reply.code(404).send({ error: 'unknown_profile' });

    const result = await replaceSlots(
      sql,
      user.organizationId as OrganizationId,
      schedule.id,
      parsed.data.slots,
    );
    if (!result.ok) {
      return reply.code(400).send({ error: 'invalid_slots', problems: result.problems });
    }

    return reply.send({ slots: result.slots });
  });

  /**
   * Hold, or resume.
   *
   * Pausing keeps the slots. A crisis hold that made someone rebuild their week
   * afterwards would not get used, and the posts that should have been held
   * would go out instead.
   */
  app.post('/api/social-profiles/:id/queue/pause', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_profile' });

    const parsed = pauseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }

    const schedule = await ensureSchedule(sql, user.organizationId as OrganizationId, id);
    if (schedule === undefined) return reply.code(404).send({ error: 'unknown_profile' });

    const updated = await setPaused(
      sql,
      user.organizationId as OrganizationId,
      schedule.id,
      parsed.data.paused,
      parsed.data.reason,
    );
    if (!updated) return reply.code(404).send({ error: 'unknown_profile' });

    return reply.send({ paused: parsed.data.paused });
  });

  /**
   * How published posts are doing.
   *
   * Only what a platform actually published: a metric no network reports is
   * absent rather than zero, because a zero in an impressions column reads as
   * "nobody saw it" instead of "we were never told".
   */
  app.get('/api/analytics', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const query = request.query as { days?: string; limit?: string };
    const days = Number(query.days ?? 30);
    const limit = Number(query.limit ?? 50);

    return reply.send(
      await postPerformance(sql, user.organizationId as OrganizationId, {
        sinceDays: Number.isFinite(days) ? days : 30,
        limit: Number.isFinite(limit) ? limit : 50,
      }),
    );
  });

  /**
   * Every reading ever taken of one published post.
   *
   * The answer to "why is last month's number different now" — platforms
   * restate figures for days afterwards, and without the history the only
   * honest reply is that we do not know.
   */
  app.get('/api/analytics/targets/:id/history', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_target' });

    return reply.send({
      readings: await readingHistory(sql, user.organizationId as OrganizationId, id),
    });
  });

  /**
   * Stop a post going out.
   *
   * Answers with what actually happened per copy rather than a bare 204,
   * because "cancelled" and "too late, it is already publishing" are different
   * facts and the person who just clicked cancel is entitled to know which one
   * they got.
   */
  app.post('/api/posts/:id/cancel', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_post' });

    const result = await cancelPost(sql, user.organizationId as OrganizationId, id);
    if (!result.ok) return reply.code(404).send({ error: result.reason, message: result.message });

    return reply.send(result.value);
  });

  /**
   * Give a post a new time — or a draft its first one.
   *
   * One route for both, because they are the same operation on rows that
   * differ only in whether they already carry a time.
   */
  app.post('/api/posts/:id/schedule', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_post' });

    const parsed = retimeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
    }

    const timing = timingFrom(parsed.data) as Timing;
    const result = await reschedulePost(sql, user.organizationId as OrganizationId, id, timing);

    if (!result.ok) {
      const code = result.reason === 'unknown_post' ? 404 : 400;
      return reply.code(code).send({ error: result.reason, message: result.message });
    }
    return reply.send(result.value);
  });

  /** Remove a post from view, cancelling anything still pending first. */
  app.delete('/api/posts/:id', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const { id } = request.params as { id: string };
    if (!UUID.test(id)) return reply.code(404).send({ error: 'unknown_post' });

    const result = await deletePost(sql, user.organizationId as OrganizationId, id);
    if (!result.ok) return reply.code(404).send({ error: result.reason, message: result.message });

    return reply.send(result.value);
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
        next_attempt_at: Date | null;
        from_queue: boolean;
      }[]
    >`
      SELECT p.id, p.body, p.status, t.network, t.scheduled_at,
             t.scheduled_local, t.scheduled_timezone,
             t.status AS target_status, t.remote_url, t.failure_message,
             -- A failed target still owed an attempt is not the same thing as
             -- one that gave up, and showing both as "failed" tells someone to
             -- go and fix something that is already fixing itself.
             t.next_attempt_at,
             (t.queue_slot_id IS NOT NULL) AS from_queue
      FROM posts p
      JOIN post_targets t ON t.post_id = p.id
      WHERE p.organization_id = ${user.organizationId} AND p.deleted_at IS NULL
      ORDER BY t.scheduled_at DESC NULLS LAST
      LIMIT 100
    `;
    return reply.send({ posts });
  });
}
