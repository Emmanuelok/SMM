import { z } from 'zod';

/**
 * Configuration, validated once at startup.
 *
 * Every value the service needs is checked before it accepts a request. A
 * process that boots with a missing secret and fails on the first signup has
 * turned a deploy-time error into a customer-facing one, and on a platform that
 * routes traffic to whatever is healthy, "healthy" has to mean "actually able
 * to work".
 */

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Railway routes to 0.0.0.0; binding to localhost makes the container
  // unreachable while looking perfectly healthy from inside.
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().max(50).default(10),

  CREDENTIAL_KEYS: z.string().min(1, 'CREDENTIAL_KEYS is required'),
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
   * Trust `X-Forwarded-*`.
   *
   * On behind Railway's proxy, which terminates TLS — without it every client
   * appears to come from the proxy's address and per-IP rate limiting protects
   * nothing. It must stay off when not behind a trusted proxy, since the header
   * is then attacker-controlled and rate limits become trivially evadable.
   */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type Config = Readonly<z.infer<typeof schema>>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${problems}`);
  }
  return Object.freeze(parsed.data);
}

/** Whether cookies may be sent over plain HTTP. Only ever true locally. */
export function allowInsecureCookies(config: Config): boolean {
  return config.NODE_ENV !== 'production' && config.PUBLIC_URL.startsWith('http://');
}
