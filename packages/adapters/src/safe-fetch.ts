import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Outbound requests to addresses a user supplied.
 *
 * Most networks are fixed hosts we control the URL of. The fediverse is not:
 * the user types a server and we make requests to it. That is a
 * server-side request forgery primitive handed to anyone who can reach the
 * connect form.
 *
 * The consequences are worst on exactly the platforms this runs on. Cloud
 * providers expose an unauthenticated metadata service on 169.254.169.254 that
 * hands out credentials to anything that asks from inside the instance, and a
 * managed platform's private network reaches the database and every sibling
 * service on names like `postgres.railway.internal`. A user who types one of
 * those as their "Mastodon server" makes our server fetch it and, depending on
 * the endpoint, returns some of the answer to them.
 *
 * So the address is resolved before the request is made and the result checked
 * against the ranges that are never a legitimate public server. Redirects are
 * not followed automatically either: a public host that answers with a 302 to
 * an internal address defeats a check performed only on the first URL, which is
 * the standard way this protection is bypassed.
 */

/** IPv4 ranges that are never a public internet host. */
const BLOCKED_V4: readonly (readonly [string, number])[] = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, and cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
];

function v4ToInt(address: string): number | undefined {
  const parts = address.split('.');
  if (parts.length !== 4) return undefined;

  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return undefined;
    value = value * 256 + octet;
  }
  return value;
}

function inV4Range(address: string, base: string, bits: number): boolean {
  const target = v4ToInt(address);
  const network = v4ToInt(base);
  if (target === undefined || network === undefined) return false;
  // A /0 would shift by 32, which is a no-op in JavaScript rather than zero.
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (target & mask) >>> 0 === (network & mask) >>> 0;
}

/** Whether an already-resolved address is one we refuse to contact. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return BLOCKED_V4.some(([base, bits]) => inV4Range(address, base, bits));
  }

  if (family === 6) {
    const normalised = address.toLowerCase();

    // An IPv4-mapped address is an IPv4 address wearing a hat. Checking it as
    // opaque IPv6 text is how ::ffff:169.254.169.254 slips through.
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalised);
    if (mapped?.[1] !== undefined) return isBlockedAddress(mapped[1]);

    if (normalised === '::1' || normalised === '::') return true;
    // fc00::/7 unique local, fe80::/10 link-local.
    if (/^f[cd]/.test(normalised)) return true;
    if (/^fe[89ab]/.test(normalised)) return true;
    return false;
  }

  // Not an address we can classify, so not one we will contact.
  return true;
}

export type HostCheck =
  | { readonly ok: true; readonly addresses: readonly string[] }
  | { readonly ok: false; readonly reason: string };

/**
 * Resolve a hostname and confirm every address it maps to is public.
 *
 * Every address, not just the first: a name that resolves to one public and one
 * internal address would otherwise be reachable roughly half the time, which is
 * worse than reachable always because it looks like flakiness.
 *
 * This narrows but does not close the DNS rebinding window — the name could
 * resolve differently between this check and the connection. Closing it fully
 * means pinning the socket to a verified address, which Node's fetch does not
 * expose. The residual risk is small for this use, and worth stating plainly
 * rather than implying the check is airtight.
 */
export async function checkHost(hostname: string): Promise<HostCheck> {
  if (hostname === '') return { ok: false, reason: 'The server address is empty.' };

  // A literal address needs no resolution and must not be trusted to be public.
  if (isIP(hostname) !== 0) {
    return isBlockedAddress(hostname)
      ? { ok: false, reason: `${hostname} is not a public address.` }
      : { ok: true, addresses: [hostname] };
  }

  let resolved: readonly { address: string }[];
  try {
    resolved = await lookup(hostname, { all: true });
  } catch {
    return { ok: false, reason: `${hostname} could not be resolved.` };
  }

  if (resolved.length === 0) {
    return { ok: false, reason: `${hostname} resolved to no addresses.` };
  }

  const blocked = resolved.filter((entry) => isBlockedAddress(entry.address));
  if (blocked.length > 0) {
    return {
      ok: false,
      reason: `${hostname} resolves to a private or reserved address and will not be contacted.`,
    };
  }

  return { ok: true, addresses: resolved.map((entry) => entry.address) };
}

export class BlockedHostError extends Error {
  override readonly name = 'BlockedHostError';
}

/** Maximum redirects followed, each re-checked. */
const MAX_REDIRECTS = 3;

/**
 * `fetch`, with the destination verified and redirects checked individually.
 *
 * Only for requests whose address came from a user. Requests to hosts fixed in
 * our own code do not need it and should not pay for the DNS lookup.
 */
export async function safeFetch(
  url: string | URL,
  init: RequestInit = {},
  redirectsRemaining = MAX_REDIRECTS,
): Promise<Response> {
  const target = new URL(url);

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    throw new BlockedHostError(`${target.protocol} is not a protocol we will request.`);
  }

  const check = await checkHost(target.hostname);
  if (!check.ok) throw new BlockedHostError(check.reason);

  const response = await fetch(target, { ...init, redirect: 'manual' });

  // A public host answering with a redirect to an internal address is the
  // standard bypass for a check done only on the first URL.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location === null) return response;
    if (redirectsRemaining <= 0) {
      throw new BlockedHostError('Too many redirects while contacting that server.');
    }
    return safeFetch(new URL(location, target), init, redirectsRemaining - 1);
  }

  return response;
}
