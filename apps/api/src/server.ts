import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { z } from 'zod';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkDatabase, createDatabase, pendingMigrations, shouldUseSsl, type Sql } from '@smm/db';
import { describedNetworks, capabilitiesFor } from '@smm/adapters';
import { EnvKeyProvider, Vault } from '@smm/vault';

import { allowInsecureCookies, type Config } from './config.js';
import { registerRoutes } from './routes.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  login,
  logout,
  passwordProblem,
  resolveSession,
  setSessionCookie,
  signup,
  tokenFromRequest,
  type AuthenticatedUser,
} from './auth.js';

/**
 * HTTP surface.
 *
 * Deliberately thin: it validates input, resolves who is asking, and delegates.
 * Business rules live in packages that can be tested without a socket.
 */

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser | undefined;
  }
}

const signupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(512),
  name: z.string().min(1).max(200),
  organizationName: z.string().min(1).max(200),
  timezone: z.string().max(64).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(512),
});

export interface BuildOptions {
  readonly config: Config;
  readonly sql?: Sql | undefined;
  readonly migrationsDir?: string | undefined;
  /**
   * Set when migrations failed at startup.
   *
   * The service still runs — a crash loop explains nothing — but it must not
   * claim to be ready, because the schema it expects is not there.
   */
  readonly migrationError?: string | undefined;
}

export async function buildServer(options: BuildOptions): Promise<FastifyInstance> {
  const { config } = options;

  const sql =
    options.sql ??
    createDatabase({
      url: config.DATABASE_URL,
      // Resolved from the host rather than read straight from the variable, so
      // a private-network database is not asked for TLS it cannot terminate.
      ssl: shouldUseSsl(config.DATABASE_URL),
      poolSize: config.DATABASE_POOL_SIZE,
    });

  // Constructed at startup so a bad key configuration fails the deploy rather
  // than the first attempt to connect a social account.
  const vault = new Vault(
    EnvKeyProvider.fromEnv({
      CREDENTIAL_KEYS: config.CREDENTIAL_KEYS,
      ...(config.CREDENTIAL_CURRENT_KEY === undefined
        ? {}
        : { CREDENTIAL_CURRENT_KEY: config.CREDENTIAL_CURRENT_KEY }),
    }),
  );

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      // Secrets reach the logger through headers and bodies more often than
      // through explicit logging, so redaction is set here rather than trusted
      // to every call site.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.password',
        ],
        remove: true,
      },
    },
    // A hop count, not a boolean. See TRUST_PROXY_HOPS in config.ts: a boolean
    // hands request.ip to the client, and every limit keyed on it stops working.
    trustProxy: config.TRUST_PROXY_HOPS,
    // Bounds a slow-client attack: a request body that trickles in forever
    // otherwise holds a connection indefinitely.
    requestTimeout: 30_000,
    bodyLimit: 1_048_576,
  });

  await app.register(helmet, {
    // The API serves JSON and a small amount of HTML; a restrictive default
    // policy costs nothing here.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameAncestors: ["'none'"],
      },
    },
  });

  await app.register(cookie);

  // The web client. Served by the API rather than from a separate host so the
  // session cookie is same-origin — a cross-origin front end would need CORS
  // and SameSite=None, which trades a real CSRF protection for a deployment
  // convenience.
  await app.register(fastifyStatic, {
    root: join(dirname(fileURLToPath(import.meta.url)), '..', 'public'),
    // Assets carry no secrets and change only on deploy.
    cacheControl: true,
    maxAge: '5m',
  });

  await app.register(rateLimit, {
    global: false,
    // Fastify's default keying uses the socket address; with a proxy in front
    // that is the proxy, so every client shares one bucket.
    keyGenerator: (request: FastifyRequest) => request.ip,
  });

  const cookieSecure = !allowInsecureCookies(config);

  // --- health ---------------------------------------------------------------

  /**
   * Liveness. Answers "is this process running", nothing more.
   *
   * Deliberately does not touch the database: a liveness probe that fails
   * during a database blip gets the container killed and restarted, which
   * cannot help and removes capacity exactly when it is scarcest.
   */
  app.get('/health', async () => ({ status: 'ok' }));

  /**
   * Readiness. Answers "should traffic be sent here".
   *
   * Reports not-ready when migrations are pending, because code running against
   * an older schema fails in ways that look like application bugs.
   */
  app.get('/ready', async (_request, reply) => {
    if (options.migrationError !== undefined) {
      return reply
        .code(503)
        .send({ status: 'migration_failed', detail: options.migrationError });
    }

    const databaseOk = await checkDatabase(sql);
    if (!databaseOk) {
      return reply.code(503).send({ status: 'unavailable', database: false });
    }

    if (options.migrationsDir !== undefined) {
      const pending = await pendingMigrations(sql, options.migrationsDir);
      if (pending.length > 0) {
        return reply.code(503).send({ status: 'migrations_pending', pending });
      }
    }
    return reply.send({ status: 'ready' });
  });

  // --- authentication -------------------------------------------------------

  app.post(
    '/api/auth/signup',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = signupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      }

      // Checked separately so the response can name the actual rule rather than
      // saying "invalid" and leaving the user guessing.
      const problem = passwordProblem(parsed.data.password);
      if (problem !== undefined) {
        return reply.code(400).send({ error: 'weak_password', message: problem });
      }

      const result = await signup(sql, parsed.data);
      if (!result.ok) {
        if (result.reason === 'email_taken') {
          // Signup cannot hide that an address is registered — the user has to
          // be told they already have an account. The mitigation is the rate
          // limit above, which makes enumeration slow rather than impossible.
          return reply
            .code(409)
            .send({ error: 'email_taken', message: 'An account with that email already exists.' });
        }
        return reply.code(400).send({ error: result.reason });
      }

      const session = await login(
        sql,
        parsed.data.email,
        parsed.data.password,
        { ip: request.ip, userAgent: request.headers['user-agent'] },
        config.SESSION_TTL_HOURS,
      );
      if (session.ok) {
        setSessionCookie(reply, session.token, {
          secure: cookieSecure,
          maxAgeSeconds: config.SESSION_TTL_HOURS * 3600,
        });
      }

      return reply.code(201).send({
        userId: result.userId,
        organizationId: result.organizationId,
      });
    },
  );

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_request' });
      }

      const result = await login(
        sql,
        parsed.data.email,
        parsed.data.password,
        { ip: request.ip, userAgent: request.headers['user-agent'] },
        config.SESSION_TTL_HOURS,
      );

      if (!result.ok) {
        if (result.reason === 'throttled') {
          return reply.code(429).send({
            error: 'too_many_attempts',
            message: 'Too many failed sign-in attempts. Try again in 15 minutes.',
          });
        }
        // One message for both a missing account and a wrong password, so login
        // cannot be used to discover which addresses are registered.
        return reply
          .code(401)
          .send({ error: 'invalid_credentials', message: 'Email or password is incorrect.' });
      }

      setSessionCookie(reply, result.token, {
        secure: cookieSecure,
        maxAgeSeconds: config.SESSION_TTL_HOURS * 3600,
      });
      return reply.send({ userId: result.userId });
    },
  );

  app.post('/api/auth/logout', async (request, reply) => {
    const token = tokenFromRequest(request);
    if (token !== undefined) await logout(sql, token);
    clearSessionCookie(reply, cookieSecure);
    return reply.send({ status: 'signed_out' });
  });

  // --- session-guarded routes ----------------------------------------------

  async function requireUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<AuthenticatedUser | undefined> {
    const token = tokenFromRequest(request);
    if (token === undefined) {
      void reply.code(401).send({ error: 'not_authenticated' });
      return undefined;
    }
    const user = await resolveSession(sql, token);
    if (user === undefined) {
      clearSessionCookie(reply, cookieSecure);
      void reply.code(401).send({ error: 'not_authenticated' });
      return undefined;
    }
    return user;
  }

  app.get('/api/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;
    return reply.send({
      user: { id: user.userId, email: user.email, name: user.name },
      organization: { id: user.organizationId, role: user.role },
    });
  });

  app.get('/api/profile-groups', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (user === undefined) return reply;

    const groups = await sql<{ id: string; name: string; timezone: string }[]>`
      SELECT id, name, timezone
      FROM profile_groups
      WHERE organization_id = ${user.organizationId} AND deleted_at IS NULL
      ORDER BY created_at
    `;
    return reply.send({ profileGroups: groups });
  });

  /**
   * The networks this deployment can address, and what each supports.
   *
   * Public and unauthenticated on purpose: it is the honest answer to "can it
   * post to X", it needs no account to be useful, and it is the kind of page
   * that gets linked to.
   */
  app.get('/api/networks', async (_request, reply) => {
    const networks = describedNetworks().map((id) => {
      const caps = capabilitiesFor(id);
      return {
        id,
        formats: caps?.formats.map((f) => ({
          format: f.format,
          delivery: f.delivery,
          // Named plainly, because "we cannot publish this automatically" is
          // something a buyer deserves before signing up rather than after.
          limitation: f.limitationNote ?? null,
        })),
        verifiedOn: caps?.verifiedOn,
      };
    });
    return reply.send({ networks });
  });

  // Connecting accounts and composing posts live in their own module; they need
  // `requireUser`, so they are registered once it exists.
  registerRoutes(app, { sql, vault, requireUser, publicUrl: config.PUBLIC_URL });

  // --- errors ---------------------------------------------------------------

  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({ err: error }, 'request failed');
    const status = error.statusCode ?? 500;
    // Internal messages can carry query fragments and connection strings, so
    // only client errors are echoed back.
    return reply
      .code(status)
      .send(status >= 500 ? { error: 'internal_error' } : { error: error.message });
  });

  app.addHook('onClose', async () => {
    await sql.end({ timeout: 5 });
  });

  return app;
}
