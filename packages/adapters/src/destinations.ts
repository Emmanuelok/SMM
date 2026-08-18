import { invariant, measureText } from '@smm/shared';

import type { RemoteId } from '@smm/shared';

import type { ConnectionId, DestinationId } from './connection.js';
import type { ResolvedTarget } from './content.js';
import type { NetworkId } from './networks.js';
import type { IssueCode, IssueSeverity, ValidationIssue } from './validation.js';

/**
 * Destinations: the thing inside an account that a post actually lands on.
 *
 * ── One connection yields many destinations ──────────────────────────────────
 *
 * The single most consequential modelling decision in this package is that a
 * connection and a destination are not the same object. One OAuth grant
 * routinely returns many places to publish:
 *
 *   - a Google Business Profile token returns every location the granting
 *     human manages, which for a franchise is hundreds;
 *   - a Meta grant returns every Page under the Business Portfolio, and each
 *     Page may have an Instagram professional account behind it;
 *   - a LinkedIn token returns the member plus every organisation they
 *     administer;
 *   - a Pinterest token returns every board, and boards have sections;
 *   - a Discord bot token returns every channel in every guild it was added to.
 *
 * So `completeAuth` returns a list and the user picks from it. Treating one
 * authorisation as one account is the error that makes multi-location and
 * franchise customers unservable: the first location wins, the other 349 are
 * invisible, and the only workaround is to re-authorise once per location with
 * a separate login — which is exactly the manual work the product exists to
 * remove. The mistake is also expensive to undo later, because by then every
 * post, metric and permission row is keyed to the connection rather than to the
 * place the post went.
 *
 * Every connection has at least one destination, including on networks with no
 * sub-objects at all. On X the destination is the account itself. Keeping that
 * uniform means the publish path never branches on "does this network have
 * destinations" — a branch that would otherwise appear in every adapter.
 */

/**
 * What kind of place a destination is.
 *
 * Not a per-network enum: the picker, the permission model and the analytics
 * grouping all care about the shape of the thing (is it a location? a
 * community?) rather than which network it came from. A subreddit and a
 * Facebook Group behave alike in every way this product cares about.
 */
export type DestinationKind =
  /** The connected account itself, on networks with nothing beneath it. */
  | 'profile'
  /** A Facebook Page. */
  | 'page'
  /** An Instagram professional account, usually reached through a Page. */
  | 'professional_account'
  /** A LinkedIn organisation, or any company identity distinct from a person. */
  | 'organisation'
  /** A subreddit, a Facebook Group — a place with its own membership and rules. */
  | 'community'
  /** A Pinterest board. */
  | 'board'
  /** A physical place: a Google Business location, a Yelp or Apple business. */
  | 'location'
  /** A Discord channel, a Telegram channel, a YouTube channel. */
  | 'channel'
  /** A Mastodon account, which is only meaningful together with its host. */
  | 'instance_account'
  /** An owned publication: a WordPress or Ghost site, a Substack. */
  | 'site';

/**
 * One place a post can land.
 *
 * Deliberately thin. What a destination *permits* is not here — that splits
 * between the network's static capability descriptor and the live rules below,
 * and a third copy on this record would be a third thing to keep in sync.
 */
export interface Destination {
  readonly id: DestinationId;
  /** The grant that reaches this place. Many destinations share one. */
  readonly connectionId: ConnectionId;
  readonly network: NetworkId;
  readonly kind: DestinationKind;
  /** The network's own identifier, sent back verbatim when publishing. */
  readonly remoteId: RemoteId;
  readonly name: string;
  /** Public handle, where the network has one distinct from the name. */
  readonly handle?: string | undefined;
  readonly avatarUrl?: string | undefined;
  /**
   * The destination this one sits under, where the network nests them: the
   * Page behind an Instagram account, the account group above a Google
   * Business location. Held as the remote id because the parent is frequently
   * a thing we do not publish to and therefore never gave an id of our own.
   */
  readonly parentRemoteId?: RemoteId | undefined;
  /**
   * Whatever tells two identically named destinations apart — a street
   * address, a guild name, an instance host.
   *
   * Not cosmetic. A franchise's destination list is four hundred rows all
   * called the same thing, and a picker without this is a coin toss that
   * publishes a store opening to the wrong city.
   */
  readonly disambiguator?: string | undefined;
  /**
   * IANA zone of the place itself, where the destination has a physical
   * location. Multi-location scheduling is expressed as "09:00 local to each
   * store", and local is a property of the store, not of the agency posting.
   */
  readonly timeZone?: string | undefined;
  /**
   * Whether we can publish here at all.
   *
   * A destination that is readable but not postable is still worth returning:
   * an unverified Google Business location or a Page where the granting human
   * holds Editor rather than Admin must appear in the list, greyed out and
   * explained, or the user concludes the connection failed and reconnects it
   * repeatedly to no effect.
   */
  readonly postable: boolean;
  /** Why not, in words the user can act on. Present when `postable` is false. */
  readonly notPostableReason?: string | undefined;
  readonly discoveredAt: Date;
}

/** Label for a picker row, carrying enough context to choose correctly. */
export function destinationLabel(destination: Destination): string {
  return destination.disambiguator === undefined
    ? destination.name
    : `${destination.name} — ${destination.disambiguator}`;
}

/** The subset a user may be offered as a publishing target. */
export function postableDestinations(
  destinations: readonly Destination[],
): readonly Destination[] {
  return destinations.filter((d) => d.postable);
}

/**
 * Bucket destinations by the grant that produced them.
 *
 * The post-auth picker is organised this way because the consequences of
 * revoking are: pulling one connection takes every destination under it down
 * together, and the user has to be shown that before they confirm.
 */
export function groupByConnection(
  destinations: readonly Destination[],
): ReadonlyMap<ConnectionId, readonly Destination[]> {
  const grouped = new Map<ConnectionId, Destination[]>();
  for (const destination of destinations) {
    const existing = grouped.get(destination.connectionId);
    if (existing === undefined) grouped.set(destination.connectionId, [destination]);
    else existing.push(destination);
  }
  return grouped;
}

/**
 * ── Why destination rules are not in the registry ────────────────────────────
 *
 * The capability registry describes a network: how long a caption may be on
 * LinkedIn, which codecs Instagram accepts. Those facts change a few times a
 * year and are the same for every customer, so baking them into code and
 * dating them works.
 *
 * Destination rules are the opposite on both axes. They are set per
 * destination by whoever runs it — a subreddit's moderators, a Pinterest
 * account's owner, a LinkedIn organisation's admin — and they change without
 * announcement, notice, or any version we could pin to. A subreddit can add a
 * mandatory flair at 2am; there is no changelog and nobody tells us.
 *
 * A static table of them is therefore not merely incomplete, it is actively
 * misleading: it would state a constraint that was true when someone wrote it
 * down and is now wrong, and the user would find out when a queued post is
 * rejected at the moment it mattered. So rules are fetched live per
 * destination and cached with a short TTL — see `DestinationRuleSet` — and the
 * composer validates against the fetched set, never against a compiled-in one.
 */

/** One value a destination will accept for a rule that takes a choice. */
export interface DestinationRuleValue {
  /** The identifier the platform expects back, verbatim. Never a display name. */
  readonly id: string;
  /** What the user sees in the picker. */
  readonly label: string;
  /**
   * Whether the choice carries user-supplied text alongside its id, as
   * editable Reddit flair templates do. Sending the id alone for one of those
   * publishes a blank flair.
   */
  readonly editable?: boolean | undefined;
}

/**
 * What a rule constrains.
 *
 * Split by what the composer must *do* about it: ask the user for a value,
 * refuse a shape of post, or report a precondition the adapter checked
 * upstream. Two rules handled identically would be one kind.
 */
export type DestinationRuleKind =
  /** A tag the destination attaches to posts. Reddit's post flair. */
  | 'flair'
  /** A grouping within the destination. A section of a Pinterest board. */
  | 'board_section'
  /** A mandatory content marker: NSFW, spoiler, promotional disclosure. */
  | 'content_warning'
  /** The destination refuses posts whose point is an outbound link. */
  | 'link_posts_forbidden'
  /** The destination refuses posts carrying images or video. */
  | 'media_posts_forbidden'
  /** The destination refuses posts that are only text. */
  | 'text_posts_forbidden'
  /** A title limit stricter than the network's own, set by the destination. */
  | 'title_length'
  /**
   * The destination restricts who may post to it. A LinkedIn organisation can
   * limit posting to named admins, so a token that publishes fine to the
   * member's own feed is refused here.
   */
  | 'posting_authorisation'
  /**
   * The bot identity needs specific grants in this channel. Discord permissions
   * are per channel, so a bot that posts in one channel of a guild may have no
   * rights at all in the next.
   */
  | 'bot_permission'
  /** A minimum gap between posts, enforced by the destination rather than the network. */
  | 'post_interval'
  /** Posts are queued for a human moderator rather than going live. */
  | 'moderation_hold'
  /** An account threshold: age, karma, verification. */
  | 'account_standing';

/**
 * One constraint a specific destination imposes, as fetched from it.
 *
 * Rules are data returned by a live call, not a hand-written table. Anything
 * knowable from the network's static descriptor belongs in that descriptor
 * instead; duplicating it here creates two answers to one question.
 */
export interface DestinationRule {
  readonly destinationId: DestinationId;
  readonly kind: DestinationRuleKind;
  /**
   * Whether the destination enforces this itself.
   *
   * True means the API rejects a post that breaches it, so the composer blocks.
   * False means the destination states the rule but enforcement is human and
   * after the fact — a subreddit sidebar rule its moderators apply unevenly —
   * which is a warning, not a block. Blocking on a rule nobody machine-enforces
   * would stop posts the destination would have accepted.
   */
  readonly required: boolean;
  /**
   * The values the destination accepts, where the set is enumerable and was
   * returned. Drives the picker, and lets us catch a choice that has since been
   * deleted before the publish attempt does.
   */
  readonly allowedValues?: readonly DestinationRuleValue[] | undefined;
  /**
   * Named grants the destination requires, for `bot_permission` and
   * `posting_authorisation`. Naming them is the whole value: "grant Send
   * Messages and Embed Links in #announcements" is actionable where "the bot
   * lacks permission" is not.
   */
  readonly requiredGrants?: readonly string[] | undefined;
  /** The numeric bound, for the kinds that have one — characters, seconds. */
  readonly limit?: number | undefined;
  /**
   * Whether the adapter could already establish that the rule holds.
   *
   * Only meaningful for preconditions about the connection rather than the
   * draft — permissions, standing, intervals. `undefined` means it was not
   * evaluated, which is different from "it fails", and the two must not be
   * collapsed or every unevaluated rule becomes a false alarm.
   */
  readonly satisfied?: boolean | undefined;
  /** What the user must do about it. Imperative, and it names the fix. */
  readonly remediation: string;
  /**
   * The destination's own wording, where it publishes one. Kept verbatim
   * because a moderator's phrasing is what the user will be judged against.
   */
  readonly sourceText?: string | undefined;
}

/**
 * A destination's rules as of one fetch, with the freshness to decide whether
 * to fetch again.
 *
 * The TTL is on the set rather than on each rule because the fetch is per
 * destination: rules do not expire individually, the answer does.
 */
export interface DestinationRuleSet {
  readonly destinationId: DestinationId;
  readonly rules: readonly DestinationRule[];
  readonly fetchedAt: Date;
  readonly ttlSeconds: number;
  /**
   * True when the live fetch failed and these are the last known rules.
   *
   * Kept as a flag rather than discarding the cache, because stale rules are
   * better than none — but the composer must say so, since validating against
   * them proves nothing.
   */
  readonly stale: boolean;
}

/**
 * Default cache lifetime for a rule set.
 *
 * An hour is a compromise between two real costs. Longer and a flair added
 * this morning is still missing when the evening queue drains. Shorter and
 * every composer keystroke spends a request against a rate limit that the
 * publish path needs — Reddit's in particular is small enough that validation
 * traffic can starve publishing.
 */
export const DEFAULT_RULE_TTL_SECONDS = 3_600;

/** Whether a cached rule set should be re-fetched before it is trusted. */
export function rulesExpired(set: DestinationRuleSet, now: Date): boolean {
  return now.getTime() - set.fetchedAt.getTime() >= set.ttlSeconds * 1_000;
}

/**
 * The user's answers to the rules that take a value, one per rule kind.
 *
 * Keyed by kind rather than by a fixed field list because the rules are
 * fetched, not compiled in: a per-network struct of `flairId` and
 * `boardSectionId` would need editing every time a destination gains a
 * mandatory field, which is the coupling this module exists to avoid.
 */
export type DestinationSelections = {
  readonly [K in DestinationRuleKind]?: string | undefined;
};

/**
 * A resolved draft aimed at one specific destination.
 *
 * Extends `ResolvedTarget` so the same object feeds both validators: the
 * capability check that knows about the network, and the rule check that knows
 * about this place inside it.
 */
export interface DestinationTarget extends ResolvedTarget {
  readonly destinationId: DestinationId;
  readonly selections?: DestinationSelections | undefined;
}

/**
 * A breached destination rule, in the composer's issue shape.
 *
 * Extends `ValidationIssue` rather than paralleling it so the two lists
 * concatenate into one report and the UI renders one list of problems. A user
 * does not care that the caption limit came from a static descriptor and the
 * flair requirement from a live fetch.
 */
export interface DestinationRuleViolation extends ValidationIssue {
  readonly destinationId: DestinationId;
  /** The precise rule breached. `code` is deliberately coarser — see below. */
  readonly rule: DestinationRuleKind;
  readonly remediation: string;
  /** Offered so the UI can render a picker inline with the error. */
  readonly allowedValues?: readonly DestinationRuleValue[] | undefined;
}

/**
 * Map a rule kind onto the composer's existing issue codes.
 *
 * `IssueCode` enumerates violations of a network's static capabilities and is
 * intentionally not extended per destination rule: destinations invent
 * constraints continuously, so the union would grow without bound and every
 * exhaustive switch over it downstream would go stale. The code therefore only
 * decides which part of the composer lights up, while `rule` and `remediation`
 * carry the specifics. Where an existing code already describes the fix
 * exactly — a title over length, a post that needs media — it is used.
 */
function codeFor(kind: DestinationRuleKind): IssueCode {
  switch (kind) {
    case 'link_posts_forbidden':
      return 'format_unsupported';
    case 'media_posts_forbidden':
      return 'media_type_unsupported';
    case 'text_posts_forbidden':
      return 'media_required';
    case 'title_length':
      return 'title_too_long';
    case 'flair':
    case 'board_section':
    case 'content_warning':
    case 'posting_authorisation':
    case 'bot_permission':
    case 'post_interval':
    case 'moderation_hold':
    case 'account_standing':
      return 'feature_unsupported';
  }
}

/**
 * A machine-enforced rule blocks; a human-enforced one warns.
 *
 * The distinction is the difference between refusing to schedule a post the
 * destination would have accepted and letting one through that it will reject.
 */
function severityOf(rule: DestinationRule): IssueSeverity {
  return rule.required ? 'error' : 'warning';
}

function violation(
  rule: DestinationRule,
  severity: IssueSeverity,
  message: string,
  extra: Omit<
    DestinationRuleViolation,
    'code' | 'severity' | 'message' | 'destinationId' | 'rule' | 'remediation'
  > = {},
): DestinationRuleViolation {
  return {
    code: codeFor(rule.kind),
    severity,
    message,
    destinationId: rule.destinationId,
    rule: rule.kind,
    remediation: rule.remediation,
    ...(rule.allowedValues === undefined ? {} : { allowedValues: rule.allowedValues }),
    ...extra,
  };
}

const SELECTION_NOUN: Readonly<Record<'flair' | 'board_section' | 'content_warning', string>> = {
  flair: 'post flair',
  board_section: 'board section',
  content_warning: 'content warning',
};

/**
 * Check a rule the user answers with a choice.
 *
 * The second branch is the one that earns its keep: a choice that was valid
 * when the post was scheduled can be deleted by a moderator before it goes
 * out, and catching that here turns a rejected post into a prompt while
 * somebody is still looking at the screen.
 */
function checkSelection(
  target: DestinationTarget,
  rule: DestinationRule,
  kind: 'flair' | 'board_section' | 'content_warning',
): DestinationRuleViolation[] {
  const noun = SELECTION_NOUN[kind];
  const chosen = target.selections?.[kind];

  if (chosen === undefined || chosen === '') {
    if (!rule.required) return [];
    return [violation(rule, 'error', `This destination requires a ${noun} on every post.`)];
  }

  const allowed = rule.allowedValues;
  if (allowed !== undefined && !allowed.some((value) => value.id === chosen)) {
    return [
      violation(
        rule,
        'error',
        `The ${noun} chosen for this destination no longer exists. Pick one of the ${allowed.length} currently offered.`,
      ),
    ];
  }

  return [];
}

/**
 * Check a rule about the connection rather than the draft.
 *
 * An unevaluated precondition on a destination that machine-enforces it is
 * reported as a warning, not silence: the alternative is a post that looks
 * schedulable and fails at 2am with nobody watching. It is not an error,
 * because we did not observe a failure and blocking on a guess costs the user
 * a posting slot.
 */
function checkPrecondition(rule: DestinationRule): DestinationRuleViolation[] {
  if (rule.satisfied === true) return [];

  if (rule.satisfied === false) {
    const grants = rule.requiredGrants;
    const detail =
      grants === undefined || grants.length === 0 ? '' : ` Missing: ${grants.join(', ')}.`;
    return [
      violation(
        rule,
        severityOf(rule),
        `${rule.sourceText ?? 'This destination refuses posts from this connection.'}${detail}`,
      ),
    ];
  }

  return rule.required
    ? [
        violation(
          rule,
          'warning',
          'This destination enforces a precondition we could not confirm before publishing.',
        ),
      ]
    : [];
}

function checkTitleLength(
  target: DestinationTarget,
  rule: DestinationRule,
): DestinationRuleViolation[] {
  const limit = rule.limit;
  if (limit === undefined || target.title === undefined) return [];

  // Counted in graphemes because destinations state their limits in characters
  // as a person sees them. The network's own weighting applies to the
  // network-wide limit, which the capability validator has already checked.
  const length = measureText(target.title, { kind: 'grapheme' });
  if (length <= limit) return [];

  return [
    violation(
      rule,
      severityOf(rule),
      `Title is ${length} characters; this destination allows ${limit}.`,
      { field: 'title' },
    ),
  ];
}

function checkRule(
  target: DestinationTarget,
  rule: DestinationRule,
): DestinationRuleViolation[] {
  switch (rule.kind) {
    case 'flair':
    case 'board_section':
    case 'content_warning':
      return checkSelection(target, rule, rule.kind);

    case 'link_posts_forbidden':
      return target.link === undefined
        ? []
        : [
            violation(rule, severityOf(rule), 'This destination does not accept link posts.', {
              field: 'body',
            }),
          ];

    case 'media_posts_forbidden':
      return target.media.length === 0
        ? []
        : [
            violation(
              rule,
              severityOf(rule),
              'This destination does not accept posts with images or video.',
              { field: 'media' },
            ),
          ];

    case 'text_posts_forbidden':
      // A post carrying a link is not a text post anywhere that draws this
      // distinction, so only a bare body trips it.
      return target.media.length > 0 || target.link !== undefined
        ? []
        : [
            violation(
              rule,
              severityOf(rule),
              'This destination does not accept text-only posts. Attach an image, video, or link.',
              { field: 'media' },
            ),
          ];

    case 'title_length':
      return checkTitleLength(target, rule);

    case 'posting_authorisation':
    case 'bot_permission':
    case 'account_standing':
    case 'post_interval':
      // None of these are decidable from the draft. They are answered upstream
      // by the adapter, which is why they carry `satisfied` and the draft rules
      // do not.
      return checkPrecondition(rule);

    case 'moderation_hold':
      // Never a failure. The post is accepted; it simply does not appear until
      // a human approves it, and a user who expects it live at 09:00 needs to
      // know that before they schedule an announcement around it.
      return [
        violation(
          rule,
          'info',
          'Posts here are held for moderator approval and will not appear immediately.',
        ),
      ];
  }
}

/**
 * Validate a draft against the rules fetched for its destination.
 *
 * Returns issues that concatenate directly onto a `ValidationReport`'s, so the
 * composer shows one list. Every rule is checked rather than stopping at the
 * first breach, for the same reason the capability validator does: a user
 * fixing one problem per attempt gives up before the third.
 *
 * The switch inside is exhaustive on purpose. Adding a rule kind without
 * deciding how it is checked should stop the build, because the alternative is
 * a newly modelled constraint that silently validates as satisfied.
 */
export function validateAgainstRules(
  target: DestinationTarget,
  rules: readonly DestinationRule[],
): readonly DestinationRuleViolation[] {
  const violations: DestinationRuleViolation[] = [];

  for (const rule of rules) {
    // Rules are cached per destination, so a set belonging to another one means
    // a cache key is wrong. Skipping quietly would publish content that was
    // never checked, which is the failure this whole module exists to prevent.
    invariant(
      rule.destinationId === target.destinationId,
      'Destination rule does not belong to the target destination',
    );
    violations.push(...checkRule(target, rule));
  }

  return violations;
}

/**
 * Whether anything blocks publishing to this destination.
 *
 * Mirrors `ValidationReport.publishable`: warnings and information do not stop
 * a post, only errors do.
 */
export function blockedByRules(violations: readonly DestinationRuleViolation[]): boolean {
  return violations.some((v) => v.severity === 'error');
}
