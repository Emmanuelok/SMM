import { z } from 'zod';

/**
 * Configuration, validated once at startup.
 *
 * Validation is strict, but a failure does NOT kill the process. That
 * distinction was learned the hard way: a service that exits on a missing
 * variable produces, on a platform, a container that dies and a deploy that
 * reports "failed" with no visible reason. The operator is left reading build
 * logs to discover a fact the application knew perfectly well.
 *
 * So the process starts either way. With valid configuration it serves the
 * product; without, it serves a page naming exactly what is missing. A deploy
 * that comes up and tells you what is wrong beats one that dies silently, and
 * the degraded mode refuses every real route, so nothing unsafe is exposed by
 * starting.
 */

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Railway routes to 0.0.0.0; binding to localhost makes the container
  // unreachable while looking perfectly healthy from inside.
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().min(1, 'required — add a Postgres database and reference ${{Postgres.DATABASE_URL}}'),
  DATABASE_SSL: z.enum(['true', 'false']).optional(),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().max(50).default(10),

  CREDENTIAL_KEYS: z
    .string()
    .min(1, 'required — generate with: node -e "console.log(\'k1:\' + require(\'crypto\').randomBytes(32).toString(\'base64\'))"'),
  CREDENTIAL_CURRENT_KEY: z.string().optional(),

  /**
   * Public origin, used for links in email and for cookie and CORS decisions.
   * A wrong value here produces password-reset links that go nowhere.
   */
  PUBLIC_URL: z.string().url().default('http://localhost:3000'),

  /** Session lifetime. Refreshed on use, so this bounds inactivity. */
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 14),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /**
   * How many proxies sit in front of this service.
   *
   * A count, never a boolean. `trustProxy: true` tells Fastify to trust the
   * whole `X-Forwarded-For` chain, and it then takes the **leftmost** entry as
   * the client address. A proxy appends to that header, so the leftmost entry
   * is whatever the client wrote — `request.ip` becomes an arbitrary
   * attacker-supplied string, and every rate limit and per-IP throttle keyed on
   * it silently protects nothing. Worse, an attacker can set it to someone
   * else's address and get them throttled.
   *
   * A count makes Fastify skip exactly that many entries from the right and use
   * the address the proxy itself observed, which the client cannot forge. One
   * is correct behind a single proxy, which is what Railway, Render and Fly
   * each provide. Zero disables the header entirely and is correct when nothing
   * trusted sits in front.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(1),
});

export type Config = Readonly<z.infer<typeof schema>>;

export interface ConfigProblem {
  readonly variable: string;
  readonly message: string;
}

export type ConfigResult =
  | { readonly ok: true; readonly config: Config }
  | { readonly ok: false; readonly problems: readonly ConfigProblem[] };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ConfigResult {
  const parsed = schema.safeParse(env);
  if (parsed.success) return { ok: true, config: Object.freeze(parsed.data) };

  return {
    ok: false,
    problems: parsed.error.issues.map((issue) => ({
      variable: issue.path.join('.') || '(unknown)',
      message: issue.message,
    })),
  };
}

/**
 * The port to listen on even when configuration is invalid.
 *
 * Read separately and permissively, because binding the right port is what
 * makes the failure visible at all. A degraded process on the wrong port is
 * indistinguishable from one that never started.
 */
export function portFrom(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env['PORT']);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}

/** Whether cookies may be sent over plain HTTP. Only ever true locally. */
export function allowInsecureCookies(config: Config): boolean {
  return config.NODE_ENV !== 'production' && config.PUBLIC_URL.startsWith('http://');
}

/**
 * Whether TLS to the database should be required.
 *
 * Duplicated from `@smm/db` rather than imported so the degraded-mode server,
 * which never opens a database connection, does not depend on the database
 * package to explain itself.
 */
export function describeSsl(config: Config): string {
  if (config.DATABASE_SSL === 'false') return 'disabled explicitly';
  if (config.DATABASE_SSL === 'true') return 'required explicitly';
  return 'automatic (off for private-network hosts)';
}
