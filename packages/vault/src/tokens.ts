import { createHash, randomBytes } from 'node:crypto';

/**
 * Opaque tokens for sessions, invitations, password resets, and the links that
 * let a client approve a post without an account.
 *
 * Two rules, both of which exist because they are routinely broken:
 *
 * The token is generated from a CSPRNG and never derived from anything
 * meaningful. A token containing a user id or a timestamp invites forgery
 * attempts and leaks information into logs and browser history.
 *
 * Only the hash is stored. A session table holding live tokens is a table of
 * live logins, and a database dump then hands over every signed-in account. The
 * argument is identical to password hashing, and gets skipped because a session
 * feels temporary.
 *
 * SHA-256 without a work factor is correct here, unlike for passwords: the
 * input is 256 bits of entropy rather than something a human chose, so there is
 * no dictionary to run and nothing for a slow hash to defend against.
 */

const TOKEN_BYTES = 32;

export interface GeneratedToken {
  /** Sent to the user. Never stored, never logged. */
  readonly token: string;
  /** Stored. Safe in a database dump. */
  readonly hash: string;
}

export function generateToken(): GeneratedToken {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('base64url');
}

/**
 * Separator between a token's label and its random part.
 *
 * A dot, not an underscore. base64url's alphabet is `A-Za-z0-9-_`, so an
 * underscore appears inside roughly every token and inside readable prefixes
 * like `smm_sess` — splitting on one is ambiguous in both directions and
 * silently returns a corrupted token. A dot appears in neither.
 */
const SEPARATOR = '.';

/**
 * Prefix a token so it is identifiable in a leak.
 *
 * A distinctive prefix lets secret scanners recognise one in a commit or a
 * support ticket, which is how a leaked credential gets revoked in minutes
 * rather than never. The cost is a few bytes.
 */
export function withPrefix(prefix: string, token: string): string {
  if (prefix.includes(SEPARATOR)) {
    throw new Error(`Token prefix must not contain "${SEPARATOR}": ${prefix}`);
  }
  return `${prefix}${SEPARATOR}${token}`;
}

/** Recover the random part of a prefixed token. */
export function stripPrefix(prefixed: string): string {
  const separator = prefixed.indexOf(SEPARATOR);
  return separator === -1 ? prefixed : prefixed.slice(separator + 1);
}
