import { isIP } from 'node:net';

import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Sql } from '@smm/db';
import { unsafeId, type OrganizationId, type UserId } from '@smm/shared';
import {
  generateToken,
  hashPassword,
  hashToken,
  needsRehash,
  stripPrefix,
  verifyPassword,
  withPrefix,
} from '@smm/vault';

/**
 * Signup, login and session handling.
 *
 * The rules that shape this file are all about not telling an attacker things
 * they have not earned: identical responses whether or not an account exists,
 * constant work regardless, and throttling that survives a redeploy because it
 * lives in the database rather than in process memory.
 */

export const SESSION_COOKIE = 'smm_session';
const SESSION_PREFIX = 'smm_sess';

/** Per-address attempt ceiling within the window. */
const MAX_ATTEMPTS_PER_EMAIL = 10;
/** Per-IP ceiling, higher because an office shares one address. */
const MAX_ATTEMPTS_PER_IP = 40;
const THROTTLE_WINDOW_MINUTES = 15;

export interface AuthenticatedUser {
  readonly userId: UserId;
  readonly email: string;
  readonly name: string;
  readonly organizationId: OrganizationId;
  readonly role: string;
}

export interface SignupInput {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly organizationName: string;
  readonly timezone?: string | undefined;
}

export type SignupResult =
  | { readonly ok: true; readonly userId: UserId; readonly organizationId: OrganizationId }
  | { readonly ok: false; readonly reason: 'email_taken' | 'weak_password' };

/**
 * Minimum password policy.
 *
 * Length only. Composition rules — a digit, a symbol, mixed case — measurably
 * push people towards `Password1!` and towards reuse, while length is what
 * actually costs an attacker. Twelve characters with no other constraint is
 * both stronger and easier to comply with.
 */
export function passwordProblem(password: string): string | undefined {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (password.length > 512) return 'Password must be at most 512 characters.';
  return undefined;
}

/**
 * Create a user, their organization, and their membership.
 *
 * One transaction: a user with no organization cannot do anything and would
 * have to be cleaned up by hand, and an organization with no owner is
 * unreachable.
 */
export async function signup(sql: Sql, input: SignupInput): Promise<SignupResult> {
  const problem = passwordProblem(input.password);
  if (problem !== undefined) return { ok: false, reason: 'weak_password' };

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(sql, input.organizationName);

  try {
    return await sql.begin(async (tx) => {
      const [user] = await tx<{ id: string }[]>`
        INSERT INTO users (email, name, timezone)
        VALUES (${input.email}, ${input.name}, ${input.timezone ?? 'UTC'})
        RETURNING id
      `;
      if (user === undefined) throw new Error('User insert returned no row');

      await tx`
        INSERT INTO user_passwords (user_id, password_hash)
        VALUES (${user.id}, ${passwordHash})
      `;

      const [org] = await tx<{ id: string }[]>`
        INSERT INTO organizations (name, slug)
        VALUES (${input.organizationName}, ${slug})
        RETURNING id
      `;
      if (org === undefined) throw new Error('Organization insert returned no row');

      await tx`
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (${org.id}, ${user.id}, 'owner')
      `;

      // Every organization gets a first brand container, because an account
      // with nowhere to connect a profile cannot do anything at all and the
      // empty state is otherwise a dead end.
      await tx`
        INSERT INTO profile_groups (organization_id, name, timezone)
        VALUES (${org.id}, ${input.organizationName}, ${input.timezone ?? 'UTC'})
      `;

      return {
        ok: true as const,
        userId: unsafeId<'UserId'>(user.id) as UserId,
        organizationId: unsafeId<'OrganizationId'>(org.id) as OrganizationId,
      };
    });
  } catch (error) {
    // 23505 is a unique violation; the only one reachable here is the email.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return { ok: false, reason: 'email_taken' };
    }
    throw error;
  }
}

/** Derive a URL-safe slug, appending a suffix until it is free. */
async function uniqueSlug(sql: Sql, name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'workspace';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const rows = await sql<{ slug: string }[]>`
      SELECT slug FROM organizations WHERE slug = ${candidate} LIMIT 1
    `;
    if (rows.length === 0) return candidate;
  }
  // Falls back to something guaranteed free rather than looping forever.
  return `${base}-${Date.now().toString(36)}`;
}

export type LoginResult =
  | { readonly ok: true; readonly token: string; readonly userId: UserId }
  | { readonly ok: false; readonly reason: 'invalid_credentials' | 'throttled' };

/**
 * Verify credentials and open a session.
 *
 * A wrong email and a wrong password are indistinguishable in both the response
 * and roughly in timing: when no user exists, a hash is still verified against
 * a dummy so the request does not return noticeably faster. Otherwise login
 * doubles as an oracle for which addresses have accounts.
 */
export async function login(
  sql: Sql,
  email: string,
  password: string,
  context: { readonly ip?: string | undefined; readonly userAgent?: string | undefined },
  sessionTtlHours: number,
): Promise<LoginResult> {
  // Measured, but not acted on yet. Refusing here would mean a correct password
  // is rejected because someone else spent the account's attempt budget — ten
  // wrong guesses against a known address would lock its owner out indefinitely,
  // renewable every fifteen minutes. Throttling exists to slow down wrong
  // answers, and it must never block a right one.
  const throttled = await isThrottled(sql, email, normalizeIp(context.ip));

  const rows = await sql<{ id: string; password_hash: string; status: string }[]>`
    SELECT u.id, p.password_hash, u.status
    FROM users u
    JOIN user_passwords p ON p.user_id = u.id
    WHERE u.email = ${email} AND u.deleted_at IS NULL
    LIMIT 1
  `;

  const record = rows[0];
  if (record === undefined) {
    // Burn comparable work so a missing account is not detectable by timing.
    await verifyPassword(password, DUMMY_HASH);
    await recordAttempt(sql, email, normalizeIp(context.ip), false);
    return { ok: false, reason: throttled ? 'throttled' : 'invalid_credentials' };
  }

  const valid = await verifyPassword(password, record.password_hash);
  await recordAttempt(sql, email, normalizeIp(context.ip), valid);

  if (!valid || record.status === 'suspended') {
    // Only a wrong answer is refused for being throttled. A right one proceeds.
    return { ok: false, reason: throttled ? 'throttled' : 'invalid_credentials' };
  }

  // The password was correct, so the failures that accumulated against this
  // address were somebody else guessing. Clearing them stops an attacker
  // holding the account at its limit forever.
  await sql`
    DELETE FROM login_attempts
    WHERE email = ${email} AND successful = false
  `;

  // The plaintext is only available here, so this is the one moment an old hash
  // can be upgraded without involving the user.
  if (needsRehash(record.password_hash)) {
    const upgraded = await hashPassword(password);
    await sql`
      UPDATE user_passwords
      SET password_hash = ${upgraded}, updated_at = now()
      WHERE user_id = ${record.id}
    `;
  }

  const { token, hash } = generateToken();
  const expiresAt = new Date(Date.now() + sessionTtlHours * 3_600_000);

  await sql`
    INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
    VALUES (
      ${record.id},
      ${hash},
      ${context.userAgent ?? null},
      ${context.ip ?? null},
      ${expiresAt}
    )
  `;

  return {
    ok: true,
    token: withPrefix(SESSION_PREFIX, token),
    userId: unsafeId<'UserId'>(record.id) as UserId,
  };
}

/**
 * A hash of a random value, used only to spend time on a missing account.
 *
 * Generated once at module load so the cost matches a real verification.
 */
const DUMMY_HASH =
  'scrypt$65536$8$1$64$AAAAAAAAAAAAAAAAAAAAAA$' +
  'ZGVsaWJlcmF0ZWx5LW5vdC1hLXJlYWwtaGFzaC1qdXN0LXNvbWV0aGluZy10by1jb21wYXJl';

/**
 * Keep only a value Postgres will accept in an `inet` column.
 *
 * `request.ip` is derived from a header. Even with the proxy hop count set
 * correctly it is worth not trusting: an unparseable value reaches an `inet`
 * column and the insert throws, turning a malformed header into a failed login
 * for everyone whose request happens to carry one.
 */
function normalizeIp(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return isIP(value) === 0 ? undefined : value;
}

async function isThrottled(
  sql: Sql,
  email: string,
  ip: string | undefined,
): Promise<boolean> {
  const since = new Date(Date.now() - THROTTLE_WINDOW_MINUTES * 60_000);

  const [byEmail] = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM login_attempts
    WHERE email = ${email} AND successful = false AND attempted_at > ${since}
  `;
  if (byEmail !== undefined && Number(byEmail.count) >= MAX_ATTEMPTS_PER_EMAIL) return true;

  if (ip === undefined) return false;
  const [byIp] = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM login_attempts
    WHERE ip_address = ${ip} AND successful = false AND attempted_at > ${since}
  `;
  return byIp !== undefined && Number(byIp.count) >= MAX_ATTEMPTS_PER_IP;
}

async function recordAttempt(
  sql: Sql,
  email: string,
  ip: string | undefined,
  successful: boolean,
): Promise<void> {
  await sql`
    INSERT INTO login_attempts (email, ip_address, successful)
    VALUES (${email}, ${ip ?? null}, ${successful})
  `;
}

/**
 * Resolve a session token to a user.
 *
 * Sliding expiry: `last_seen_at` moves on every request, so an active session
 * does not expire mid-task, while an abandoned one still dies on schedule.
 */
export async function resolveSession(
  sql: Sql,
  presentedToken: string,
): Promise<AuthenticatedUser | undefined> {
  const hash = hashToken(stripPrefix(presentedToken));

  const rows = await sql<
    {
      user_id: string;
      email: string;
      name: string;
      organization_id: string;
      role: string;
    }[]
  >`
    SELECT s.user_id, u.email, u.name, m.organization_id, m.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN organization_members m ON m.user_id = u.id
    WHERE s.token_hash = ${hash}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.deleted_at IS NULL
      AND u.status <> 'suspended'
    ORDER BY m.created_at
    LIMIT 1
  `;

  const row = rows[0];
  if (row === undefined) return undefined;

  await sql`UPDATE sessions SET last_seen_at = now() WHERE token_hash = ${hash}`;

  return {
    userId: unsafeId<'UserId'>(row.user_id) as UserId,
    email: row.email,
    name: row.name,
    organizationId: unsafeId<'OrganizationId'>(row.organization_id) as OrganizationId,
    role: row.role,
  };
}

/** Revoke a session. Kept rather than deleted, so "signed out" is auditable. */
export async function logout(sql: Sql, presentedToken: string): Promise<void> {
  const hash = hashToken(stripPrefix(presentedToken));
  await sql`UPDATE sessions SET revoked_at = now() WHERE token_hash = ${hash} AND revoked_at IS NULL`;
}

/** Read the session token from the cookie or an Authorization header. */
export function tokenFromRequest(request: FastifyRequest): string | undefined {
  const cookies = (request as FastifyRequest & { cookies?: Record<string, string | undefined> })
    .cookies;
  const cookie = cookies?.[SESSION_COOKIE];
  if (cookie !== undefined && cookie !== '') return cookie;

  const header = request.headers.authorization;
  if (header !== undefined && header.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

export interface CookieOptions {
  readonly secure: boolean;
  readonly maxAgeSeconds: number;
}

/** Set the session cookie. */
export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  options: CookieOptions,
): void {
  void reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    // Unreadable from JavaScript, so an XSS bug cannot exfiltrate the session.
    httpOnly: true,
    secure: options.secure,
    // 'lax' rather than 'strict': strict drops the cookie on links arriving from
    // email, so a user following an approval link appears signed out.
    sameSite: 'lax',
    maxAge: options.maxAgeSeconds,
  });
}

export function clearSessionCookie(reply: FastifyReply, secure: boolean): void {
  void reply.setCookie(SESSION_COOKIE, '', {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
  });
}
