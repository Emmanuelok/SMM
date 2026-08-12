# Blueprint A — The Pragmatic Modular Monolith

**Angle: speed to market and day-one global traction.**
A single deployable, one language, boring datastores, a small team, and a
deliberately small number of irreversible decisions taken correctly on day one.

> Status: architecture proposal. Everything here that cites a platform behaviour inherits
> the confidence grade of the dossier it came from. Items marked **[VERIFY]** are
> load-bearing and unverified; they appear consolidated in §16.

---

## 0. The argument in one page

The category's hard problems are not distributed-systems problems. They are:

1. **Calendar-time problems.** Meta App Review, TikTok's content-posting audit, LinkedIn
   Community Management approval and Google OAuth verification are measured in weeks to
   months (`06 §1.3`, `§10`). Nothing about them goes faster because our services are
   smaller.
2. **Correctness-under-fragility problems.** Seven of nine tier-1 surfaces have no native
   scheduling, so our scheduler is the system of record and a missed cron is a missed post
   (`06 §1.2`). Publishing is not transactional with the network; the damaging bug class is
   the duplicate post, not the slow query.
3. **Irreversible-schema problems.** Per-tenant key hierarchy, the region seam, the
   hierarchy data model, and the metric provenance columns cannot be retrofitted cheaply
   (`11 §10.3`, `§4.4`; `12 §17.4`).
4. **Coverage-breadth problems.** ~60 networks with wildly different capabilities, of which
   roughly a third cannot be auto-published to at all (`07 §3`, `§17`; `08 §3`).

None of those are solved by microservices, and all of them are made *harder* by a
distributed topology maintained by a team of six. So:

**Decision: one modular monolith (`api`), one worker binary (`worker`), one Postgres per
region, one language (TypeScript), deployed as containers on AWS.** Module boundaries are
enforced in the build, not by the network. Extraction to separate services happens along
pre-cut seams (§10.6) when a specific pressure appears, and not before.

### 0.1 The nine decisions that are expensive to reverse

| # | Decision | Taken now because | Cost if deferred |
|---|---|---|---|
| D1 | **Per-tenant KEK envelope encryption** for all credentials and encrypted content | `11 §10.3` — retrofit means online re-encryption of every row while publishing continues | ~1 quarter + incident risk. Now: ~2 weeks |
| D2 | **Global control plane / regional data planes seam** | `11 §4.4`, `08 §14.6` | ~2 quarters. Now: 4–8 weeks (routing layer + key scoping + CI lint) |
| D3 | **Scheduled time stored as `(wall_clock, iana_zone)`**, UTC resolved at dispatch | tzdb changes silently drift stored-UTC instants; also forces the deliberate choice *not* to delegate to platform-native scheduling | Silent mis-sends, unfixable retroactively |
| D4 | **Hierarchy-native profile groups** (`parent_id` + `ltree` path, typed nodes) | `03` marks org hierarchy a moat; permissions/approvals/reporting/timezone must all resolve through it | Permission model rewrite |
| D5 | **Metric provenance columns** (`api_version`, `metric_name_as_returned`, `collected_at`, comparability class) and **daily snapshots from connect** | `06 §7.2`, `12 §17.4` — Pinterest 90d, X non-public 30d, TikTok ~60d are gone forever if not captured | Permanent data loss |
| D6 | **Capability descriptors as data, not code** | `06 §19.2` — a limit change must be a config deploy | Every network change becomes a release |
| D7 | **Typed error taxonomy + idempotency + read-back reconciliation** in the publish path | `06 §19.1`, `07 §16.4` | The duplicate-post bug is unrecoverable on the network |
| D8 | **Policy kernel in front of every write**, human or agent or MCP | `01:1358` P0-EXCEED; retrofitting a gate onto shipped agent surfaces is a rewrite | Rewrite of the agent surface |
| D9 | **Merchant-of-record billing** (Paddle) for self-serve | Day-one global sales without 40 tax registrations | Months of tax/entity work before first non-US revenue |

Everything else in this document is reversible and should be built the cheapest way that
works.

### 0.2 What we deliberately do not build in the first year

Stated up front because the honesty posture is load-bearing throughout: listings
syndication (a publisher-data licensing cost floor, not engineering — `03` verifier note);
WFM shift scheduling/forecasting; a general-purpose workflow builder; our own SAML/SCIM
implementation (buy it); our own video transcoding pipeline beyond ffmpeg presets; China
(a separate legal entity, `11 §8.3`); Yelp/TripAdvisor review *response* (no owner OAuth
exists, `07 §11.3`); logged-out scrape verification (replaced by authenticated read-back,
§5.7); manual metric capture (contaminates metric provenance — reminder-publish verifier
note).

---

## 1. Constraints that shape everything downstream

| Constraint | Source | Architectural consequence |
|---|---|---|
| 7 of 9 tier-1 surfaces have no native scheduling | `06 §1.2` | Durable, timezone-correct, idempotent scheduler is the core product, not a feature |
| FB Pages, FB Reels, YouTube, VK, Mastodon **do** have native scheduling | `06 §1.2`, `08 §14.2` | A second delivery mode (`NATIVE_SCHEDULED`) with daily reconciliation — and holds must be able to *unschedule upstream* |
| ~20 of ~70 tier-2 surfaces have no write API at all | `07 §17` | Reminder-publish is a first-class delivery mode in the core state machine, not a UI affordance |
| Platform data retention ceilings differ per network | `11 §12.8`, `06 §7.2` | **Never one undifferentiated `post_metrics` table.** Partition by source; separate raw entity store from derived aggregate store |
| X reads are metered in dollars | `06 §8.3`, `§19.5` | Poll frequency is a pricing decision expressed in config, per plan, per tenant |
| Google Business Profile quota is per-project, shared across tenants | `07 §16.2` | Fair-share admission control with priority lanes is required, not optional |
| Meta 24h messaging window; IG comment→private reply is a separate 7-day one-shot | `06 §8.2` | Two clocks in the conversation state machine, not one |
| Rotating single-use refresh tokens on X and TikTok | `11 §10.5` | Single-writer refresh behind a per-connection lock; **health probes must be read-only identity calls, never speculative refreshes** |
| Meta ~2yr Graph deprecation; LinkedIn 12-month version window | `06 §7.3` | Version pinning per adapter + a deprecation calendar with owned dates |
| EU personal data must be able to stay in the EEA | `11 §4` | Region seam from day one, CI lint against cross-plane PII |

---

## 2. Product surface

### 2.1 Module map

Modules are TypeScript packages with an enforced dependency direction. **Kernel modules may
not import product modules.** A product module may import kernel modules and may import
another product module only through its published `contract` sub-path, never its internals.
This is checked by an ESLint import-boundary rule in CI — the cheapest available substitute
for network boundaries.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EDGE                                                                         │
│  web (Next.js: app shell + public surfaces)   mobile (React Native)          │
│  public REST API (OpenAPI)   MCP server   webhooks-in   Slack/Teams apps     │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │  all writes → command bus → POLICY KERNEL
┌───────────────────────────────▼─────────────────────────────────────────────┐
│ PRODUCT MODULES                                                              │
│                                                                              │
│  compose      calendar      publish       inbox        reviews               │
│  listening    analytics     reports       links(bio)   ai-studio             │
│  approvals    governance    advocacy      paid         rights                │
│  experiments  migration     integrations  billing      offboarding           │
└───────────────────────────────┬─────────────────────────────────────────────┘
┌───────────────────────────────▼─────────────────────────────────────────────┐
│ KERNEL                                                                       │
│  tenancy/authz   policy(autonomy+holds)   audit   jobs   adapters            │
│  vault(tokens)   media   notify           meter   flags  time                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 The complete module list, with parity mapping

Every row of the `01 §30` parity checklist lands in exactly one module. Numbers in brackets
are that checklist's item numbers.

| # | Module | Owns | Parity items |
|---|---|---|---|
| K1 | **tenancy** | orgs, hierarchy nodes, users, roles, per-feature permissions, user groups, connect links, client portals, white-label config | 17, 18, 51, 52, 63 |
| K2 | **policy** | autonomy policies, publishing holds, blackout windows, brand-safety and disclosure policy, evaluation at the publish gate | 60 (+ crisis hold) |
| K3 | **audit** | hash-chained append-only log, decision traces, exports, attribution-preserving deactivation | 65 |
| K4 | **jobs** | durable job runner, schedules, claim/lease, priority lanes, dead-letter | — |
| K5 | **adapters** | capability descriptors, archetype base classes, per-network adapters, error taxonomy, destination rules | — |
| K6 | **vault** | OAuth flows, per-tenant KEK envelope encryption, refresh single-writer, connection health probes, repair links | 57 |
| K7 | **media** | upload, transcode, derivatives, alt text, perceptual hashing, cloud-drive sync, Canva | 9, 10 |
| K8 | **notify** | push/email/in-app/Slack/Teams fanout, digests, escalation ladders, quiet hours | 55 |
| K9 | **meter** | usage metering, AI credits, plan entitlements, rate budgets, cost ledger | — |
| K10 | **time** | IANA zone resolution, tzdb pipeline, CLDR week data, dual-time rendering, blackout primitive | — |
| P1 | **compose** | drafts, per-network variations, apply-to-all, first comment + comment chains, polls, threads, hashtag groups, link shortening + UTM + per-message link IDs, merge fields, ideas library | 1, 3, 11, 12, 13, 68, 70, 71 |
| P2 | **calendar** | calendar views/filters, drag-drop, queues with labelled slots, evergreen recycling + ROI attribution, bulk CSV, IG grid + TikTok planners, shared calendar links, notes | 4, 5, 6, 7, 8 |
| P3 | **publish** | scheduler, pre-flight, delivery modes incl. reminder, retry ledger, verification/reconciliation, per-network SLO | 2 |
| P4 | **approvals** | routing rules, SLA ladders, digests, OOO delegation, Slack/Teams decisions, decision-by-link, immutable approval records | 15, 16 |
| P5 | **inbox** | unified conversations, saved replies, macros, sentiment w/ rationale, assignment, moderation, automation rules, coverage/SLA, rosters, handover digest | 20–28 |
| P6 | **reviews** | GBP + Facebook + app-store review ingest and response, AI replies, review requests (email/SMS/QR/widget), Google Q&A | 29, 30, 31, 32 |
| P7 | **listening** | queries (Boolean), sources, mention pipeline, sentiment/SOV/influencers, backfill, crisis signals, coverage disclosure | 33–36 |
| P8 | **analytics** | 3-layer metric model, daily snapshots, competitor analytics, benchmarks, custom metrics, GA integration, warehouse export | 40, 41, 42 |
| P9 | **reports** | catalogue, custom templates, white-label PDF, scheduled delivery, live share links | 37, 38, 39 |
| P10 | **links** | link-in-bio microsite, custom domains, blocks, embeds, QR, analytics, competitor import, short-link domain | 14 |
| P11 | **ai-studio** | generation surfaces, brand voice, RAG knowledge + test tab, conversational surface, agents, shadow mode, replay QA, credits | 45–49 |
| P12 | **paid** | ad account connect, boost configs, dark posts, paid-vs-organic reporting, whitelisting authorisations | 43, 44 |
| P13 | **advocacy** | curation, leaderboard w/ EMV, badges, Slack alerts, advocacy report | 50 |
| P14 | **rights** | rights grants, expiry, live-dependency join, AI provenance, override records | — |
| P15 | **experiments** | fleet feature-level bandit, cross-location RCT, MDE reporting, exploration scheduler | — |
| P16 | **migration** | vendor CSV importers, platform re-fetch backfill, bulk OAuth wizard, reconciliation report | — |
| P17 | **integrations** | public REST API, MCP server, Zapier/Make, webhooks-out, Slack/Teams apps, warehouse shares | 54, 56, 58, 59 |
| P18 | **billing** | plans, MoR checkout, per-client billing/reselling, usage invoicing | 53 |
| P19 | **offboarding** | client exit as one audited transaction, authenticated expiring export | — |
| P20 | **trust** | SSO/SCIM, audit surfacing, DPA/subprocessor pages, residency selection, BYOK | 64, 66, 67 |
| P21 | **mobile** | publishing, inbox, approvals, reminder-publish handoff, offline queue | 61 |
| P22 | **extension** | Chrome/Firefox: schedule-this-page, save-inspiration, competitor stats | 62 |
| P23 | **discovery** | onboarding journeys, activation nudges, command palette, capability matrix surface | 75 |

`P23` looks like a nice-to-have and is not: "the product's own modules are invisible" is
Vista's most-cited complaint (`01 §29.1` item 15). A command palette and per-module
activation journeys are cheap and change perceived quality more than any single feature.

### 2.3 How the modules compose — the three spines

Everything meaningful is one of three flows.

**Spine 1 — intent to published artefact.**

```
compose(draft) ──▶ policy.evaluate(publish-gate) ──▶ approvals(route) ──▶ calendar(slot)
      │                                                                       │
      │                        adapters.negotiate(capabilities) ◀─────────────┘
      ▼                                    │
  media(derivatives)                       ▼
                              publish.preflight ──▶ jobs(due) ──▶ adapters.publish
                                                        │              │
                                     reminder path ◀────┤              ▼
                                     (mobile handoff)   │      verify.readback(+1m/+10m/+1h/+24h)
                                                        ▼              │
                                                   retry ledger ◀──────┘
                                                        │
                                                     audit + analytics.snapshot
```

**Spine 2 — inbound signal to answered conversation.**

```
webhooks-in / pollers ──▶ normalize(canonical Event) ──▶ inbox(conversation state machine)
                                     │                            │
                                     ├─▶ listening(mention)       ├─▶ sla(timers, escalation)
                                     └─▶ reviews(review)          ├─▶ ai(draft reply, gated)
                                                                  └─▶ notify(digest, handover)
```

**Spine 3 — observation to decision.**

```
analytics.snapshot(daily, per profile+post) ──▶ metric model L1→L2→L3
        │                                             │
        ├─▶ reports / share links                     ├─▶ experiments (fleet priors, RCT)
        ├─▶ warehouse export (Parquet/Iceberg, dbt)   └─▶ ai (context for generation)
        └─▶ benchmarks (cross-tenant, k-anonymous)
```

Two invariants hold across all three: **every write passes the policy kernel** (§8.4) and
**every consequential write emits an audit entry** (§9.5).

---

## 3. The universal platform adapter

This is the abstraction the whole product rests on, so it gets the most space. The existing
`packages/adapters` already has the right shape (capabilities-as-data, a narrow adapter
interface, `DeliveryMode` including `reminder`). What follows extends it to span ~60
networks without the interface widening every time a network is added.

### 3.1 Three layers, and why

```
Layer 3  NETWORK ADAPTER      ~60 of these. Mostly configuration + a content mapper.
         (instagram.ts)       Owns: that network's HTTP calls and nothing else.
              │
Layer 2  ARCHETYPE            9 of these. Owns the auth ceremony, the token lifecycle,
         (OAuth2Publisher,    the upload choreography, the polling loop, the pagination
          AsyncReviewed…)     shape, the rate-limiter model.
              │
Layer 1  CAPABILITY DESCRIPTOR  Pure data. Versioned. Drives the composer UI, the
         (data, not code)       validator, the degradation ladder, and the honesty matrix.
```

The archetypes come from `07 §3` (nine integration shapes across ~70 platforms) reconciled
with `08 §3` (five regional archetypes). The reconciled set:

| Archetype | Auth shape | Members (illustrative) | Effort |
|---|---|---|---|
| **A. Single-secret REST** | user-pasted long-lived key | Telegram bot, Discord webhook, Ghost, Dev.to, Hashnode, WordPress app password | S |
| **B. OAuth2 authorization-code** | our client id/secret, per-user tokens | Meta family, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Tumblr, Twitch, GBP, Snapchat Marketing, VK, Kakao, Naver | M — *the framework case* |
| **C. Instance-scoped OAuth + dynamic client registration** | per-host client registration | Mastodon family, Pleroma, Pixelfed, self-hosted Ghost/WordPress, Lemmy, Misskey | L once, M per family member |
| **D. Bot/server identity** | app is the identity; invite ceremony | Telegram, Discord, Slack, Viber, Teams | S API / M onboarding |
| **E. Asymmetric-JWT enterprise** | we hold a private key, mint short JWTs | Apple Business Connect, App Store Connect, Apple Messages for Business | M + key custody |
| **F. BSP/aggregator-mediated messaging** | via a Business Solution Provider | WhatsApp, RCS, Apple Messages for Business, LINE (partly), Zalo ZNS, Kakao AlimTalk | L–XL, calendar-dominated |
| **G. Feed in/out** | none | RSS/JSON Feed/sitemaps, Substack read, Medium read, podcast distribution | S framework, ~0 per source |
| **H. Read-only review ingestion** | key or OAuth, asymmetric capability | Yelp Fusion, TripAdvisor Content API, Google Places, G2 | S–M each |
| **I. No write API — assisted publish** | none | Snapchat organic, Xiaohongshu, LINE VOOM, Substack write, Truth Social, Nextdoor, Quora, IG Stories with stickers, TikTok creative layer | S per platform once the pipeline exists |

`08 §3.2`'s "component/third-party-platform delegation" (WeChat Open Platform) is archetype
B with an extra token-minting hop and is modelled as a B variant, not a tenth archetype.

**The leverage claim, stated precisely:** archetype G is the highest value-per-hour work in
the corpus (`07 §3`) because one framework powers content-library import, RSS-to-social,
podcast surfaces and competitor content tracking simultaneously. Archetype I is the second,
because it is the only honest answer for roughly a third of the surface area and it is
built once.

### 3.2 Delivery modes — the state machine must know all six

`06 §1.2` and `08 §14.2` between them force six, not two. Most schedulers model one.

| Mode | Semantics | Members | Scheduler responsibility |
|---|---|---|---|
| `SYNC` | one call, immediate result | X, LinkedIn, Telegram, Bluesky, VK immediate, Mastodon immediate | fire at T, confirm |
| `ASYNC_POLL` | create container → poll → publish | Instagram, Threads, TikTok, Pinterest video, Douyin | staged state machine with container TTL awareness (Meta 24h) |
| `NATIVE_SCHEDULED` | platform holds it | FB Pages feed, FB Reels, YouTube `publishAt`, VK `publish_date`, Mastodon `scheduled_at` | **hand off at schedule time; our clock is a verifier; reconcile daily; holds must unschedule upstream** |
| `ASYNC_REVIEWED` | submit → platform human/auto review → accept or reject | WeChat `freepublish`, LINE narrowcast, Douyin/Kuaishou/Bilibili uploads | poll with backoff; `rejected` is a first-class terminal state that notifies a human |
| `REMINDER` | no write API; a human posts | Snapchat, Xiaohongshu, IG Stories w/ stickers, TikTok creative layer, Substack write, VOOM | notify → transfer → confirm → reconcile; never silently drop the slot |
| `UNSUPPORTED` | we will not pretend | Signal, Amazon reviews, Glassdoor | composer refuses with a reason string |

The `NATIVE_SCHEDULED` row is where two real bugs live and both are called out in the
corpus: double-posting when a natively-scheduled post is *also* fired locally, and a crisis
hold that appears to work in our UI while Meta publishes on schedule anyway. §5.9 specifies
the reconciliation.

### 3.3 Capability negotiation — the algorithm

One canonical `ContentIntent` fans out to N targets. Negotiation is a pure function:
`(intent, capability_descriptor, destination_rules, policy) → ResolvedTarget | Degradation | Refusal`.

```
1. FORMAT RESOLUTION
   intent.format → network format via a format lattice
   (short vertical video → reel | short | tiktok | story; carousel → carousel | album | thread)
   No mapping ⇒ candidate for degradation, else Refusal with reason.

2. HARD CONSTRAINT CHECK   (from the descriptor: text, media, feature)
   text length under the network's counting strategy (grapheme / UTF-16 / X-weighted)
   media count, bytes, dimensions, aspect ratio, codec, duration
   required fields (YouTube title, Reddit flair, Pinterest board)

3. DESTINATION RULES       (live, per-destination, not per-network)
   Reddit  GET /r/{sub}/api/post_requirements  → title regex, flair required, domain bans
   TikTok  GET creator_info                    → max_video_post_duration_sec, privacy options
   Meta    content_publishing_limit             → remaining 24h quota
   X       GET /2/usage/tweets                  → remaining metered writes
   plus the OBSERVED-FAILURE CORPUS (§3.6) for networks with no rules endpoint.

4. FEATURE NEGOTIATION
   alt text, first comment, user/product/location tags, collaborators, music, reply controls,
   AI-label flags. Unsupported features are dropped with an explicit, listed receipt —
   never silently.

5. DEGRADATION LADDER  (first rule that applies wins)
   a. transform      — truncate at a grapheme boundary with a configured suffix; move
                       hashtags to first comment; re-encode media to a compliant preset;
                       generate a 1:1 crop for a network that refuses 9:16
   b. downgrade      — carousel of 20 → carousel of 10 (LinkedIn); video → video+thumbnail
   c. split          — long text → thread (X, Bluesky, Mastodon, Threads)
   d. reroute        — same content, different format on the same network
   e. reminder       — the format exists on the network but not in its API
   f. refuse         — with the network's own reason, in the user's language

6. DEGRADATION RECEIPT
   Every applied step is persisted on the target and rendered in the composer BEFORE
   scheduling, and in the post detail after. "We cropped your 9:16 video to 1:1 for
   LinkedIn" is a trust event; discovering it after publish is a churn event.
```

Rule 5(a)'s "re-encode to a compliant preset" is the single highest-yield item: media
format rejection is one of the five causes of the publishing-reliability bucket that
`12 §33.1` identifies as the #1 addressable churn driver.

### 3.4 Interface sketch

Extending the existing `SocialAdapter` rather than replacing it. Additions in **bold**.

```ts
export interface SocialAdapter {
  readonly network: NetworkId;
  readonly archetype: Archetype;                         // ← new
  readonly capabilities: PlatformCapabilities;

  // ── identity & health ────────────────────────────────────────────────
  authorizeUrl(req: AuthorizeRequest): URL;              // ← new
  exchangeCode(code: string, ctx: AuthCtx): Promise<Result<Credentials, AuthFailure>>;
  refresh?(c: Credentials): Promise<Result<RefreshedCredentials, PublishFailure>>;
  revokeUpstream?(c: Credentials): Promise<Result<void, PublishFailure>>;  // ← new: real revocation
  verifyCredentials(ctx: PublishContext): Promise<Result<void, PublishFailure>>;
  /** READ-ONLY identity call. Never a speculative refresh — see §9.3. */
  probe(ctx: PublishContext): Promise<Result<ConnectionHealth, PublishFailure>>;  // ← new

  // ── publishing ───────────────────────────────────────────────────────
  /** Live, per-destination rules. Cached with a per-network TTL. */
  destinationRules?(ctx: PublishContext, dest: DestinationRef)
      : Promise<Result<DestinationRules, PublishFailure>>;                  // ← new
  publish(t: ResolvedTarget, ctx: PublishContext): Promise<Result<PublishSuccess, PublishFailure>>;
  /** ASYNC_POLL / ASYNC_REVIEWED only. */
  pollPublish?(h: PublishHandle, ctx: PublishContext): Promise<Result<PublishState, PublishFailure>>;
  /** NATIVE_SCHEDULED only: hand off, and be able to take it back. */
  scheduleNative?(t: ResolvedTarget, at: Date, ctx: PublishContext)
      : Promise<Result<PublishHandle, PublishFailure>>;                     // ← new
  cancelNative?(h: PublishHandle, ctx: PublishContext)
      : Promise<Result<void, PublishFailure>>;                              // ← new — crisis hold needs this
  deletePost?(id: RemoteId, ctx: PublishContext): Promise<Result<void, PublishFailure>>;

  // ── verification ─────────────────────────────────────────────────────
  /** Authenticated re-fetch of the object we created, for reconciliation. §5.7 */
  readBack?(id: RemoteId, ctx: PublishContext)
      : Promise<Result<RemoteObjectState, PublishFailure>>;                 // ← new

  // ── read ─────────────────────────────────────────────────────────────
  fetchMetrics?(ids: readonly RemoteId[], ctx: PublishContext)
      : Promise<Result<readonly MetricSnapshot[], PublishFailure>>;
  fetchInbound?(cursor: Cursor, ctx: PublishContext)
      : Promise<Result<InboundPage, PublishFailure>>;                       // ← new
  fetchAccountMetrics?(window: DateRange, ctx: PublishContext)
      : Promise<Result<readonly MetricSnapshot[], PublishFailure>>;         // ← new
}
```

Deliberately **not** on the interface: retry policy, backoff, rate limiting, key management,
scheduling, notification. Those are the engine's job; an adapter that implements them is a
bug. The adapter's only privilege is knowing that network's HTTP.

### 3.5 Capability descriptors: two additions to what exists

The current `PlatformCapabilities` covers formats, limits, read capability, `verifiedOn`
and `sources`. Two fields must be added, both because of honesty obligations:

```ts
interface PlatformCapabilities {
  // …existing…
  readonly delivery: DeliveryMode;              // per format already; also a network default
  readonly quotaModel: QuotaModel;              // ← new: rate | post-count | metered | token-refresh-capped
  readonly detectionLatency: {                  // ← new: drives the SLA floor, §7.5
    readonly comments: LatencyClass;            // 'webhook' | 'poll:5m' | 'poll:6h' | 'none'
    readonly dms: LatencyClass;
    readonly mentions: LatencyClass;
    readonly reviews: LatencyClass;
  };
}
```

`quotaModel` exists because WeChat 订阅号 is 1 post/day and 服务号 is 4/month — the composer
must show remaining slots, which is a capability question, not a rate-limiter question.
`detectionLatency` exists because a customer must be *prevented* from configuring a 1-hour
SLA on a channel we poll every 6 hours (`02` coverage verifier note item 8).

Descriptors carry `verifiedOn`. **A descriptor older than 90 days raises a warning in the
admin dashboard and older than 180 days fails the nightly capability-drift check** (§11.4).
A stale descriptor is a liability, and its age must be visible.

### 3.6 The destination-rules engine and the observed-failure corpus

Reddit's `post_requirements` and TikTok's `creator_info` are table stakes (both are shipped
by Postiz and mandatory for TikTok audit respectively). The unclaimed ground is generalising
that pattern to the ~55 networks with **no machine-readable rules endpoint**.

```
destination_rules
  network, destination_ref (subreddit / page / board / channel / location),
  rule_kind      ('title_regex'|'flair_required'|'banned_domain'|'min_account_age'|
                  'media_required'|'link_disallowed'|'duplicate_window'|'quota_remaining'),
  value jsonb, source ('api'|'observed'|'documented'|'manual'),
  confidence, observed_count, first_seen, last_confirmed, expires_at
```

Rules with `source='observed'` are mined from our own failure ledger: when a
`CONTENT_REJECTED` recurs ≥ N times for the same `(network, destination, error_signature)`,
a candidate rule is proposed to an internal review queue, and once approved it becomes a
pre-flight check that fires **in the composer** rather than at publish time. This corpus is
the only genuinely defensible asset in the publish-verification differentiator: it compounds
with volume and cannot be copied from documentation.

### 3.7 Error taxonomy — normalised once, at the archetype layer

Straight from `08 §14.4` and `07 §16.4`, unified:

| Class | Retry? | User-visible? | Notes |
|---|---|---|---|
| `AUTH_EXPIRED` | refresh once, then retry once | no | if refresh fails → `AUTH_REVOKED` |
| `AUTH_REVOKED` | never | yes — reconnect CTA + repair link | |
| `SCOPE_MISSING` | never | yes — names the exact scope | full re-auth link (incremental consent is Google-only) |
| `RATE_LIMITED(retryAfter)` | yes, honour header | only if it threatens the slot | not counted as a failure in SLO |
| `QUOTA_EXHAUSTED` | never within window | yes — shows quota + reset time | |
| `CONTENT_REJECTED(reason)` | never | yes — platform reason verbatim **and** translated | |
| `PLATFORM_POLICY` | never | yes | distinct from content rejection for reporting |
| `VALIDATION_FAILED` | never | yes | **also logged as a validator gap — this is a bug in us** |
| `PLAN_INSUFFICIENT` | never | yes | e.g. LinkedIn/TikTok tier |
| `TRANSIENT` | yes, jittered, bounded | no | |
| `PLATFORM_DOWN` | long backoff | status banner | |
| `NOT_FOUND` | never | yes | |
| `UNKNOWN` | once, then alert | no | **every `UNKNOWN` is a taxonomy bug and pages an engineer** |

Plus one terminal state no generic taxonomy anticipates: **`PUBLISHED_THEN_REMOVED`** —
Reddit AutoModerator removals occur seconds after an HTTP 200, and platform takedowns occur
later. §5.7.

Non-English error messages (Chinese, Korean, Japanese platform APIs) are stored raw **and**
translated. Never show only the raw string to an English speaker; never show only a
translation to a native speaker.

### 3.8 Graceful degradation to reminder-publish — the honest version

Reminder-publish is a **delivery mode of the same scheduler**, sharing the same
`post_targets` row, the same approval record, the same audit trail and the same calendar
slot. It is not a notification feature.

What we ship, narrowed per the verifier note:

| Ship | Do not ship |
|---|---|
| **Never-drop-the-slot semantics**: offline queue, re-notify on reconnect, escalation ladder, missed-post digest | "Media already on the device and clipboard staged at 9:00" — iOS does not guarantee silent-push delivery, caps it at 2–3/hour, and no app can foreground itself or write the clipboard on a schedule |
| **Device-targeted routing** (notify a named device/person, matching Vista's capability) wired to a confirmation loop that reconciles the calendar | A "new product category" framing |
| **Best-effort prefetch** when the OS permits, then **one-tap transfer** once the user opens the notification | "4–6 weeks unlocks 10 networks" coverage inflation |
| **Per-network caption transforms at handoff** — grapheme-correct counting, hashtag block placement, first-comment split | Manual metric capture in v1 (contaminates metric provenance; near-zero sustained adoption) |
| **The honest capability matrix**: every network labelled `auto` / `assisted` / `unsupported` **with the reason**, in the channel picker and on the public site | TikTok send-to-inbox as a *differentiator* — it is table stakes; ship it, do not claim it |

Engineering scope for v1 is exactly three surfaces: **IG Stories with stickers, IG personal
accounts, and the TikTok creative layer.** That is where the volume and the pain are.
Snapchat and the regional set (Xiaohongshu, LINE VOOM, ShareChat, Kwai, Naver Blog) ship as
a cheap byproduct of the pipeline, never as a coverage claim.

Deep-link recipes are budgeted as a **permanent per-app-version QA line on real devices**,
not a one-time build (`07 §17.2` labels every recipe C3-and-changing). A device farm of
four phones running the handoff for the top recipes weekly is cheaper than the support load
of a broken recipe.

**Before building:** install and instrument Later, Planoly, Plann, Preview and Buffer
mobile and time the actual handoff. `04` Appendix A shows the mobile-first planner segment
was never covered by the research, and the realistic gain is one tap and a few seconds —
worth knowing precisely before funding it.

---

## 4. Data model and multi-tenancy

### 4.1 Containment, extended for hierarchy

The existing schema's `organization → profile_group → social_profile` is right. One change
makes it hierarchy-native at near-zero cost — decision **D4**:

```sql
ALTER TABLE profile_groups
  ADD COLUMN parent_id  uuid REFERENCES profile_groups (id) ON DELETE RESTRICT,
  ADD COLUMN kind       text NOT NULL DEFAULT 'brand',   -- client|brand|region|market|location
  ADD COLUMN path       ltree NOT NULL,                  -- materialised ancestry
  ADD COLUMN locale     text,                            -- CLDR: week data, formatting
  ADD COLUMN settings   jsonb NOT NULL DEFAULT '{}';     -- inherited with override semantics

CREATE INDEX profile_groups_path_gist ON profile_groups USING gist (path);
```

Everything resolves through `path`:

| Resolves through the tree | Rule |
|---|---|
| **Permissions** | a grant at node N applies to N and descendants; the most specific grant wins |
| **Approvals** | a routing rule may be attached at any node; rules compose from root to leaf; a node may declare `bypass` or `require_legal` |
| **Reporting** | roll-up is `path <@ :node`; the compliance view ("which of my 340 locations posted this month, which are dark") is one query |
| **Timezone** | nearest ancestor with a non-null `timezone`; `social_profiles` may override — profile-level timezone is the sellable item (`02:376`, `02:440`) |
| **Brand voice / knowledge** | inherited with per-node override |
| **Holds** | a hold at node N covers the subtree; §12.1 |
| **Templates and locked zones** | corporate publishes at a node; descendants may edit only designated fields; enforced at publish time by a diff check |

This is one column, one index and a recursive resolver — and it is the difference between
being sellable to a 5–75-location multi-unit operator and not. Note the buyer narrowing
from the verifier: **the 5–75 band and agencies managing several multi-location clients**,
not 340-location enterprises (SOCi/Birdeye/Sprinklr accounts sold through franchisor channel
relationships we do not have). **[VERIFY]** SOCi, Rallio, Birdeye Social, Uberall/MomentFeed,
Reputation, Chatmeter, Hearsay, Denim Social, Promoboxx, Tiger Pistol, Evocalize,
BrandMuscle and Ansira are entirely absent from the corpus and must be audited before this
segment strategy is funded.

### 4.2 New core tables

Beyond the shipped `0001_core.sql`. Abbreviated to the columns that carry a decision.

**Content labels and holds** (§12.1):

```sql
CREATE TABLE content_labels (            -- promotional, service-status, legal, evergreen…
  id uuid PK, organization_id uuid, key text, name text,
  is_service_status boolean NOT NULL DEFAULT false,   -- the allowlist flag
  UNIQUE (organization_id, key));

CREATE TABLE post_labels (post_id uuid, label_id uuid, PRIMARY KEY (post_id, label_id));

CREATE TYPE hold_window_policy AS ENUM ('skip','defer_next_slot','defer_past_window');

CREATE TABLE publishing_holds (
  id uuid PK, organization_id uuid NOT NULL,
  scope_kind text NOT NULL,        -- organization|node|profile|label
  scope_ref  uuid,                 -- profile_group.id | social_profile.id | label.id
  label_mode text NOT NULL DEFAULT 'fail_closed',  -- fail_closed | allowlist
  allowed_labels uuid[] NOT NULL DEFAULT '{}',     -- e.g. {service-status}
  policy hold_window_policy NOT NULL,
  reason text NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz,
  created_by uuid, released_by uuid, released_at timestamptz,
  preset text,                     -- 'crisis' when applied as the preset
  CONSTRAINT hold_has_reason CHECK (length(reason) > 0));

CREATE TABLE hold_captures (       -- the restore review queue — the demo moment
  hold_id uuid, post_target_id uuid, original_scheduled_at timestamptz,
  applied_policy hold_window_policy, proposed_new_at timestamptz,
  outcome text,                    -- held|skipped|deferred|released|discarded
  upstream_action text,            -- none|cancelled_native|FAILED_TO_CANCEL
  PRIMARY KEY (hold_id, post_target_id));
```

`label_mode='fail_closed'` is the engineering requirement that makes the feature safe:
**unlabeled content is held by default**, with an explicit allowlist for service-status.
`upstream_action` is the second requirement: for `NATIVE_SCHEDULED` targets the hold must
call `cancelNative` and a failure must be surfaced loudly, not reported as success.

**Approvals as routing** (§12.5):

```sql
CREATE TABLE approval_rules (
  id uuid PK, organization_id uuid, node_id uuid,     -- attaches anywhere in the tree
  priority int NOT NULL,
  conditions jsonb NOT NULL,   -- closed vocabulary: network, label, brand, spend,
                               -- region, ai_generated, first_time_poster, policy_keyword_hit
  action jsonb NOT NULL,       -- route_to | parallel | quorum(n,of) | skip | auto_approve_below
  sla jsonb,                   -- {target_minutes, ladder:[{after_minutes, notify}]}
  enabled boolean NOT NULL DEFAULT true);

CREATE TABLE approval_records (            -- the exportable compliance artefact
  id uuid PK, organization_id uuid, post_id uuid NOT NULL,
  content_version_hash bytea NOT NULL,     -- binds the decision to exact bytes
  step_ref uuid, decision approval_decision NOT NULL,
  decider_user_id uuid, decider_identity_source text NOT NULL,  -- 'sso'|'password'|'link'
  decider_idp_subject text,                -- SSO subject; a raw Slack user id is NOT enough
  decided_at timestamptz NOT NULL, comment text,
  surface text NOT NULL);                  -- web|slack|teams|email_link|mobile
```

`content_version_hash` + `decider_identity_source='sso'` are what make the record a
defensible principal approval under FINRA 2210 / SEC 206(4)-1 — the binding regulatory
driver, with the EU AI Act as supporting evidence, not the driver.

**Conversations** (§7):

```sql
CREATE TABLE conversations (
  id uuid PK, organization_id uuid, node_id uuid, social_profile_id uuid,
  channel text NOT NULL,          -- dm|comment|mention|review|ad_comment
  remote_thread_id text NOT NULL,
  participant jsonb NOT NULL,     -- pseudonymised where the platform requires
  state text NOT NULL,            -- open|pending|snoozed|closed
  assignee_user_id uuid, assignment_locked_at timestamptz,
  -- the two clocks, per 06 §8.2 — a comment does NOT reset the DM window
  dm_window_expires_at        timestamptz,   -- 24h from last inbound MESSAGE
  human_agent_window_expires_at timestamptz, -- 7d, support content only
  comment_reply_deadline_at   timestamptz,   -- 7d one-shot, per comment
  comment_reply_used boolean NOT NULL DEFAULT false,
  first_response_due_at timestamptz, resolution_due_at timestamptz,
  sla_policy_id uuid, breached_at timestamptz,
  UNIQUE (social_profile_id, channel, remote_thread_id));
```

**Metrics** — deliberately *not* one table (`11 §12.8` rule 1):

```sql
-- Raw layer: one partition per source network, retention enforced per partition.
CREATE TABLE metric_facts (
  organization_id uuid NOT NULL, network text NOT NULL,
  entity_type text NOT NULL,          -- post|profile|story|video|conversation
  entity_id text NOT NULL,            -- remote id
  metric_name_as_returned text NOT NULL,   -- D5: never normalised away
  metric_value numeric NOT NULL,
  observed_for date NOT NULL,         -- the day the metric describes
  collected_at timestamptz NOT NULL,
  api_version text NOT NULL,          -- D5: provenance
  canonical_metric text,              -- L2 mapping, nullable when none is faithful
  comparability_class char(1),        -- 'A' | 'B'
  raw_payload_ref text)               -- object-storage pointer for re-derivation
PARTITION BY LIST (network);
```

Plus `follower_snapshots(social_profile_id, date, followers)` — because computing historical
engagement rate against today's follower count silently rewrites history every day, a bug
present in a surprising number of shipped products (`12 §17.3`).

**Rights**, **autonomy policy**, **decision traces**, **connection health**, **share links**,
**offboarding transactions**, **reminder deliveries**, **verification checks** and **rate
budgets** each get a table; they are specified in their own sections below rather than
enumerated here.

### 4.3 Multi-tenancy and isolation

Four layers, because the corpus is explicit that the real failure mode is authorization, not
cryptography (`11 §10.7`).

1. **Physical:** one Postgres cluster per region plane. A tenant lives in exactly one.
   `organizations.data_region` is set at creation and never changed; moving a tenant is a
   migration, not an update.
2. **Row-level security:** every tenant-owned table carries `organization_id` and has an RLS
   policy reading exactly that column. The API sets `SET LOCAL app.organization_id` at the
   start of every transaction from the authenticated context. PgBouncer runs in transaction
   mode, which is compatible with `SET LOCAL`. **The application role has no `BYPASSRLS`.**
   Migrations and the vault run under separate roles.
3. **Cryptographic:** AAD on every ciphertext binds it to
   `tenant_id | connection_id | platform | key_version`. A missed tenant filter that would
   have leaked data becomes a decryption failure instead (`11 §10.2` #4).
4. **Test:** a CI property test generated from the route table — tenant A's session, tenant
   B's object id, assert 403/404 — so new endpoints are covered by default rather than by
   discipline.

**The RLS escape hatch is the risk.** Background workers legitimately act across tenants
(the scheduler scans all due targets). They run under a `worker` role that may read the
*scheduling* tables unscoped but must assume a tenant context before touching content,
credentials or conversations. The transition is a single helper (`withTenant(orgId, fn)`)
and calling a repository outside it is a lint error.

### 4.4 Retention, deletion and the data classes

Retention is driven by the **strictest** of platform ToS ceiling, legal bound and tenant
configuration — per tenant, per data class, not globally (`11 §5.6`).

| Class | Default | Driver | Mechanism |
|---|---|---|---|
| D1 credentials | life of connection; **immediate upstream revoke + delete on disconnect** | platform ToS | vault delete + `revokeUpstream` |
| D2 tenant account | contract + 7y for billing | tax law | billing records excluded from crypto-shred |
| D3 content/drafts | contract + 30–90d grace | tenant | tenant KEK |
| D4 audience | **90d rolling, adjustable downward only** | GDPR minimisation | partition drop |
| D5 metrics identifiable | match platform ceiling | platform ToS | partition-level retention per network |
| D5 aggregates | indefinite | — | only if genuinely anonymous (k-anonymity enforced in the benchmark job) |
| D6 listening raw | 30–90d; aggregates longer | GDPR + terms | Parquet lifecycle rules |
| D7 inbox | tenant-configurable, default 12mo | may be *extended* by FINRA/SEC | compliance-mode override |
| D8 embeddings | match source | inherits | per-tenant pgvector namespace; **audience/listening content not embedded by default** |
| D9 telemetry | 30–90d detail, 13mo aggregate | security vs minimisation | log retention policy |
| Audit | 12mo minimum, 7y enterprise | SOC 2 + customer demand | append-only, outside the shred |

**Upstream deletion propagation** is a platform-terms obligation people skip: if a post is
deleted on Instagram, our copy must go too (`11 §12.1` rule 5). The read-back reconciler
(§5.7) already re-fetches published objects; a `404`/`deleted` result triggers a tombstone
and a cascade over derived rows. Same job, two purposes.

---

## 5. Scheduling and publishing engine

### 5.1 Time — decision D3, and its price

Scheduled time is stored as `(scheduled_local timestamp, scheduled_zone text)` plus a
**materialised** `next_fire_at timestamptz` used only as an index. When tzdb changes, a job
recomputes `next_fire_at` for all future targets in affected zones and emits a diff report.

```sql
ALTER TABLE post_targets
  ADD COLUMN scheduled_local timestamp,
  ADD COLUMN scheduled_zone  text,
  ADD COLUMN next_fire_at    timestamptz;   -- derived; never authoritative
```

**The price, stated deliberately:** this is incompatible with delegating to platform-native
scheduling, because Meta's `scheduled_publish_time` and YouTube's `publishAt` take an
instant and will not re-derive it if a government changes a DST rule. We therefore
self-dispatch by default and use `NATIVE_SCHEDULED` only where it buys reliability that
outweighs the drift risk — currently: never for user-visible scheduling, and optionally as a
*fallback* if our dispatcher is degraded (§5.10). The choice is deliberate rather than
accidental, which is the point.

The rest of the time substrate, scoped to the ~3–4 engineer-weeks the verifier allows:

1. tzdb update pipeline with staleness alerts, treated as a correctness bug when late.
2. Timezone on the **profile**, with a node default and a "publish at 9am local per profile"
   mode. This is the sellable item: "multi-region without splitting your groups."
3. Dual-time rendering in the composer — "09:00 for the profile / 14:00 for you". Cheapest
   item on the list and the one that actually prevents 3am posts, because the cause is UI
   confusion, not tzdb drift.
4. First-day-of-week and weekend shading from CLDR `weekData.json`. Two JSON lookups; ship
   it for the MENA demo moment. (Weekends are Fri–Sat across nine countries, Fri-only in
   Iran, Thu–Fri in Afghanistan; first day is Sunday in Saudi Arabia but Monday in the UAE.)
5. A **generic recurring blackout-window primitive** (per profile, per weekday, per time
   range, with a zone). This one object subsumes Fri–Sat weekends, Friday prayers, Shabbat
   and Iftar — and doubles as the recurring half of the crisis-hold feature.
6. Ramadan/Eid **campaign-planning overlay** with country-selectable dates showing the ±1-day
   moon-sighting variance explicitly. Never assert one global date.

Cut, per the verifier: Persian calendar (sanctions-blocked markets, zero addressable
revenue), Hebrew sunset-to-nightfall interval modelling (contested halachic definitions;
item 5 serves Israeli marketers at 2% of the cost), Hijri *date entry*. Buddhist/ROC/Japanese
era display is one `Intl.DateTimeFormat` option implemented silently in the formatting
layer and never mentioned in positioning.

### 5.2 Queueing — Postgres, not a broker

**Decision: the job runner is Postgres.** `SELECT … FOR UPDATE SKIP LOCKED` over a
`jobs` table plus `LISTEN/NOTIFY` for low-latency wakeups. Rationale for a small team:
transactional enqueue with the business write (no dual-write problem), one datastore to
operate and back up, trivially inspectable ("why didn't my post go out" is a SQL query), and
proven to five-figure jobs/minute on a single primary — far beyond what this workload needs
at the scale where a broker would pay for itself.

Redis/Valkey is present but for a different job: rate-limit token buckets, distributed
locks, websocket fanout and ephemeral presence. **Nothing durable lives in Redis.**

Migration path if volume demands it: the job table becomes a producer into Kafka/Redpanda
for the *ingestion* stream only (§6.2). Publishing stays in Postgres because its cardinality
is small and its correctness requirements are high.

Priority lanes, per `07 §16.2`: `interactive > scheduled_publish > sync > backfill`.
Backfill is preemptible; a scheduled publish is not.

### 5.3 The publish state machine

```
                     ┌──── hold applied ────▶ HELD ──(release)──▶ back to SCHEDULED/RESLOT
                     │
DRAFT ─▶ VALIDATED ─▶ SCHEDULED ─▶ CLAIMED ─▶ MEDIA_STAGED ─▶ CONTAINER_CREATED ─▶ PROCESSING
                                       │                                              │
                                       │                                              ▼
                                       │                                            READY
                                       │                                              │
                                       ▼                                              ▼
                              REMINDER_SENT ──(confirm)──────────────────────────▶ PUBLISHING
                                       │                                              │
                                       └─(missed)─▶ MISSED                            ▼
                                                                                  PUBLISHED
                                                                                      │
   FAILED_RETRYABLE ◀──┐                                              read-back ──────┤
        │              │                                                              ▼
     (backoff within   │                                                    PUBLISHED_THEN_REMOVED
      lateness budget)─┘                                                              │
        │                                                                             ▼
        ▼                                                                        RECONCILED
   FAILED_TERMINAL ─▶ user-actionable error + retry ledger entry
   CONTAINER_EXPIRED ─▶ back to MEDIA_STAGED (Meta 24h TTL)
   AWAITING_RECONNECT ─▶ repair link sent; slot preserved within the lateness budget
```

Every transition writes an audit row with the actor (a user, a job, or an agent identity).

### 5.4 "Exactly-once", stated honestly

Exactly-once delivery to a third-party network is not achievable. What is achievable:

**At-most-once publish, plus reconcile-to-truth.**

1. **Claim before call.** `publish_claims (post_target_id, attempt)` is inserted in the same
   transaction that flips the target to `CLAIMED`, with a lease. A replayed job finds the
   claim and declines. (This table already exists in `0001_core.sql`.)
2. **Idempotency key per attempt** where the platform supports one, derived from
   `(target_id, content_hash)` so a retry of the *same* content reuses the key and a genuine
   edit does not.
3. **Uncertain outcomes are never retried blindly.** A timeout or a 5xx after the request was
   sent moves to `VERIFY_PENDING`, not `FAILED_RETRYABLE`. The read-back reconciler asks the
   network what actually happened — search the account's recent objects for our
   `content_hash` or client-supplied key — and only then decides. This is the single
   mechanism that kills the duplicate-post bug, which `06 §19.1` names the most damaging bug
   class in the category.
4. **Lease expiry** reclaims work from dead workers, and reclamation always routes through
   `VERIFY_PENDING`, never straight to a re-publish.

### 5.5 Rate-limit budgeting: three nested buckets

```
        ┌───────────────────────────────────────────────────────────────┐
        │ APP BUDGET   (our app id's quota with the platform)           │
        │  e.g. YouTube 10,000 units/day; GBP ~300 QPM; Meta app-level  │
        │  ── fair-share allocation across tenants, weighted by plan ── │
        │      ┌─────────────────────────────────────────────────┐     │
        │      │ TENANT BUDGET  (plan entitlement + cost ceiling) │     │
        │      │   X: metered reads/writes in DOLLARS             │     │
        │      │      ┌───────────────────────────────────┐       │     │
        │      │      │ CONNECTION BUDGET                 │       │     │
        │      │      │  TikTok 15 posts/24h (shared with │       │     │
        │      │      │  every other client the user has) │       │     │
        │      │      │  IG 25/24h · min interval · etc.  │       │     │
        │      │      └───────────────────────────────────┘       │     │
        │      └─────────────────────────────────────────────────┘     │
        └───────────────────────────────────────────────────────────────┘
```

Implementation: Redis token buckets with a Lua CAS script, seeded from response headers
where the platform reports them (Reddit, Mastodon, Twitch, Discord bucket hashes) and from
static config otherwise. Cost-based models (Bluesky points, Twitch 800pts/min, Shopify
`extensions.cost`) pre-compute the cost per call and reconcile from the response.

**Slot reservation at T-60s.** A scheduled publish reserves its rate-limit slot before the
fire time. Discovering at T+0 that we are rate-limited means a late post. If reservation
fails, the user is told *before* the slot passes, with an ETA — honesty as a feature.

**The X cost model is a first-class budget, not a limiter.** `06 §19.5`:
`monthly_reads ≈ accounts × (mention_polls/day × 30 × results/poll + dm_polls × 30 × dm_results)`.
Poll frequency is a per-plan config value; the tenant sees their own consumption in the
usage dashboard; a tenant may bring their own X credentials on higher plans. **[VERIFY]**
`12 §35.2` flags per-post X pricing ($0.015 base / $0.20 with a URL) as the single unverified
fact that could invalidate the whole pricing table.

**Fair share for project-level quotas.** GBP's quota belongs to our *project*, shared across
all tenants. One customer's bulk location sync can starve everyone. Admission control:
per-tenant allocation weighted by plan, priority lanes, backfill preemptible, and honest
queue ETAs rather than silent delay.

### 5.6 Pre-flight validation

Runs three times, for three different reasons:

| When | Where | Purpose |
|---|---|---|
| **As you type** | browser, from the capability descriptor shipped to the client | grapheme-correct counting, media specs, required fields — the composer and the API cannot drift because they read the same data |
| **At schedule time** | server | destination rules (Reddit `post_requirements`, TikTok `creator_info`, Meta `content_publishing_limit`), token scope check, rate-limit headroom, hold/policy evaluation, rights check |
| **At T-60s** | worker | re-check quota and token validity; anything that changed since scheduling |

Failures at schedule time surface **while the human is still in the composer**. A
`VALIDATION_FAILED` at publish time is recorded as a *validator gap* and feeds the
observed-failure corpus (§3.6) — it is our bug, not the user's.

Positioning note, per the verifier: pre-flight is **complete and generalised**, not first.
Reddit `post_requirements` and TikTok `creator_info` are table stakes.

### 5.7 Publish verification and reconciliation

**Authenticated read-back, not logged-out fetching.** We re-fetch the object we created,
through the same API that created it, and diff against expected state.

| Network | Read-back | Detects |
|---|---|---|
| Reddit | `/api/info` → `removed_by_category`, `banned_by`, `approved` | AutoModerator removal (occurs seconds after HTTP 200) |
| Meta | media-node `GET` | deletion, policy takedown |
| TikTok | status/fetch | rejection after acceptance |
| X | compliance-job events | deleted / deactivated / suspended |
| YouTube | `videos.list` status | takedown, processing failure |
| LinkedIn | UGC post `GET` | deletion |
| Everything else | **"removal detection unavailable on this network"**, stated in the UI | — |

Schedule: **+1m, +10m, +1h, +24h**, then folded into the daily metrics sync. An admitted
blind spot is itself differentiation in a category that hides them.

Third-party corroboration, if ever wanted, goes through licensed providers (Apify,
ScrapeCreators, EnsembleData) as an explicitly priced, contractually fenced option — never
through our own app id, which risks the app suspension that kills every tenant's connections
at once (`11 §11.4`).

**Two artefacts, two buyers** (verifier item 3):

- **(a) A contractual SLA with service credits.** `03:1314` names "no SLA with service
  credits" as a procurement blocker. This is the version that appears in an RFP.
- **(b) A per-tenant reliability ledger** — this customer's success rate, retries, latency
  and removal events, exportable, so an agency can forward it to a client.

An aggregate public marketing page ships **only** if we are prepared to keep publishing it
during a Meta outage. Otherwise it is a hostage handed to competitors.

Positioning, honestly: no single vendor assembles pre-flight + typed taxonomy + backoff
within a lateness budget + idempotency + authenticated reconciliation + a visible retry
ledger + a contractual SLA into one system. Ayrshare has the pieces as unrelated SDK
methods; Postiz has the pipeline with no ledger, SLA or product surface; Upload-Post has
idempotency alone. That integration gap is real, and it is a "we did the boring thing
completely" story — **retention infrastructure, not the acquisition wedge.**

### 5.8 Retry, lateness budget and reauth

Retry policy is a function of error class (§3.7) bounded by a **user-configurable lateness
budget** per post ("this may go out up to 30 minutes late; after that, tell me instead of
posting"). Time-sensitive content — a live event, a flash sale — sets the budget to zero.
The budget is what makes retry safe: unbounded retry publishes a Black Friday post on
Sunday.

`AWAITING_RECONNECT` preserves the slot inside the lateness budget and triggers a repair
link (§9.3). On expiry the target moves to `MISSED` and appears in the missed-post digest.

### 5.9 Holds, and the two engineering requirements that make them safe

The hold evaluation runs at three points: at schedule time, at T-60s, and at claim time.
It is not a UI state.

```
evaluateHold(target) →
  holds ← active holds whose scope covers (org, node-path, profile, label)
  if none → PROCEED
  if target has no label and any covering hold has label_mode='fail_closed' → HOLD   ← fail closed
  if target's labels ⊆ hold.allowed_labels → PROCEED                                  ← service-status
  apply hold.policy:
     skip               → outcome='skipped', record in hold_captures
     defer_next_slot    → next free queue slot after ends_at
     defer_past_window  → ends_at + configured offset, preserving relative order
  if target.delivery = NATIVE_SCHEDULED:
     r ← adapter.cancelNative(handle)
     if r.err → outcome='held', upstream_action='FAILED_TO_CANCEL',
                RAISE loud partial-hold failure — never report success        ← requirement 2
```

**Requirement 1 (fail closed):** unlabeled content is held. An "everything is frozen except
service-status" hold that silently lets unlabeled promotional content through is worse than
no hold at all.

**Requirement 2 (reconcile Meta's server-side queue):** posts already handed to Meta via
`scheduled_publish_time` are on *their* clock. The hold must cancel upstream, and a partial
failure must be surfaced loudly, with the affected posts listed.

**The restore review queue is the demo moment** and the strongest single element: on
release, show exactly what was held, what was skipped, what was deferred and where to, and
offer bulk re-slotting. The pain is not stopping; it is rebuilding the calendar afterwards
from memory.

### 5.10 Degraded modes

| Failure | Behaviour |
|---|---|
| Dispatcher down | targets accumulate; on recovery, anything inside its lateness budget fires, anything past it goes to `MISSED` with a digest. Never a silent flood of late posts |
| One network down | per-network circuit breaker; breaker state **visible in the customer UI** ("Reddit is rate-limiting us; your 10:00 post is queued") |
| One connection broken | per-connection circuit breaker so one dead token cannot starve the queue |
| Region degraded | control plane serves a status page; the other planes are unaffected by construction |
| Our app suspended by a platform | `11 §11.4`'s unplanned scenario: a pre-written runbook, a per-network kill switch, and customer comms drafted in advance |

---

## 6. Ingestion and analytics

### 6.1 Webhooks vs polling — the map

| Source | Mechanism | Notes |
|---|---|---|
| Meta (FB/IG/Threads) | **webhooks**, rich | the only real-time tier-1 surface |
| TikTok | webhooks, narrow (publish status) | comments require polling |
| Twitch | EventSub | free, real-time |
| Bluesky | **Jetstream firehose** | open, complete, cheap — the one place we can honestly claim complete coverage |
| YouTube | PubSubHubbub (uploads only) + polling | comments poll; quota-bound (an upload costs ~1600 of 10,000 daily units) |
| X | polling, **metered in dollars** | poll frequency is a pricing decision |
| LinkedIn | polling only | **no organic webhooks, no DM API at all** |
| Pinterest | polling | no webhooks |
| Reddit, Mastodon, GBP, review sites | polling with cursors | conditional GET / ETag where supported |
| RSS/feeds | polite polling | ETag + Last-Modified + GUID dedupe |

Adaptive cadence: poll interval per connection scales with observed activity and plan tier,
floors from `detectionLatency`, and every poll decrements the tenant's budget.

### 6.2 Pipeline shape

```
webhooks ─┐
pollers  ─┼─▶ normalize (canonical Event / Mention / Review / MetricSnapshot)
crawlers ─┘        │  · dedupe: canonical URL + content hash + near-dup embedding
                   │  · provenance_class + licence_class as FIRST-CLASS FIELDS
                   ▼
        ┌──────────────────────┐
        │ durable log          │  Phase 1: Postgres table + NOTIFY
        │ (Redpanda in Ph. 3)  │  Phase 3: Redpanda when listening volume justifies it
        └──────┬───────────────┘
   ┌───────────┼─────────────────────┬─────────────────────┐
   ▼           ▼                     ▼                     ▼
inbox      enrichment          realtime scoring        raw archive
(OLTP)     · language          · burst detection       S3 Parquet
           · sentiment         · anomaly z-score       partitioned dt/source
           · entities/topics   · crisis composite      (re-enrichment source)
           · embeddings        · alert dedupe
              │                      │
              ▼                      ▼
      search index            notification fanout
      (PG FTS → OpenSearch)
              │
              ▼
        OLAP aggregates (ClickHouse) ──▶ warehouse share (Parquet/Iceberg, dbt, native apps)
```

**Enrichment is hybrid, and that is the whole trick** (`12 §16.3`): cheap self-hosted
encoders over 100% of the stream (~$5–20 per million mentions), routing to an LLM only for
(a) high-reach authors, (b) low encoder confidence, (c) mentions inside an active anomaly
window, (d) a ~1% audit sample. That is 2–5% of volume on the expensive path — a $3,000
problem becomes a $60 problem while keeping frontier quality exactly where a human looks.

### 6.3 Backfill — the migration weapon

On connect, immediately backfill to the maximum depth each platform allows: Instagram ~2
years, Facebook ~2 years, YouTube full history, LinkedIn ~12 months, TikTok whatever the API
permits, Pinterest 90 days. This is `12 §33.4` — "the move nobody has made" — and it
converts the incumbent's strongest lock-in ("I'd lose three years of analytics") into a
20-minute job producing a populated dashboard *before* the customer cancels anything.

Backfill runs in the lowest priority lane and is preemptible. The user watches a progress UI
reconstructing their history. It is also the honest replacement for the deleted "exit-pack
as a viral public link" thesis: the acquisition value of the switcher is a strict subset of
platform re-fetch, and re-fetch does not violate platform terms.

Paired with it: CSV importers for Hootsuite, Buffer, Later, Sprout, Sendible, Agorapulse,
Loomly, Publer and Metricool with a generic column-mapper fallback; a bulk OAuth wizard with
per-network troubleshooting for the known failures (IG not converted to Business, FB Page not
linked, TikTok app not approved for the region) and resumability; and a **side-by-side
reconciliation report** — "your Hootsuite numbers vs ours, and precisely why they differ" —
which preempts the #1 post-migration support ticket.

### 6.4 Metric normalisation — three layers

```
L1 RAW           L2 CANONICAL                       L3 DERIVED
per-network,     cross-network with an explicit     ratios computed only
exact platform   comparability class                within a class,
field names,     A = comparable                     with the formula
never altered    B = directional only               exposed on the number
```

L2 canonical set: `served` (B), `reached` (A), `video_started` (B), `video_completed` (A),
`watch_time_seconds` (A — the single most comparable video metric), `reactions` (A),
`comments` (A), `shares` (B), `saves` (A), `link_clicks` (A), `profile_actions` (B).

**Rules enforced in the query layer, not by convention:**

- A cross-network roll-up must carry its comparability class. Summing a TikTok "view"
  (auto-play, immediate) with a YouTube "view" (thresholded, bot-filtered) produces a number
  whose only honest interpretation is "a number".
- Engagement rate: ship all four definitions (by reach, by impressions, by followers, by
  views), default to by-reach where available and by-followers otherwise, and **put the
  formula in a tooltip on the number.** Vendors that hide the formula generate support
  tickets forever.
- `followers_at_post_time` comes from the daily snapshot table, never read live.
- When Instagram folded `impressions`/`plays`/`video_views` into `views` (~Apr 2025), every
  chart spanning the cutover became a lie. Provenance columns let us render a **discontinuity
  marker** instead of silently splicing two different quantities.

### 6.5 Storage engines

| Store | Purpose | Phase |
|---|---|---|
| **PostgreSQL** (per region) | OLTP: everything transactional; also Phase-1 analytics via partitioned `metric_facts` and materialised rollups | 0 |
| **S3-compatible object storage** | media, raw API payloads, Parquet archive, exports, report PDFs | 0 |
| **ClickHouse** | OLAP: metric facts at scale, listening aggregates, benchmark panels | 2 |
| **pgvector** (in the regional Postgres) | embeddings, namespaced per tenant so deletion is a partition operation, not an index rebuild | 1 |
| **Valkey** | rate budgets, locks, websocket fanout, ephemeral state | 0 |
| **OpenSearch** | listening full-text + kNN at volume | 3 |
| **Redpanda** | durable ingestion log when listening volume justifies it | 3 |

Postgres carries analytics until it visibly hurts. The trigger for ClickHouse is a specific,
measurable one — p95 on the standard report exceeding 2s at 90-day range, or `metric_facts`
exceeding ~500M rows per region — not a date.

### 6.6 Warehouse access — the largest single unclaimed gap

`12 §25.2` is unambiguous: **no SMM vendor ships a real warehouse-native model.** The
warehouse world built serious models for *paid* social (`fivetran/dbt_ad_reporting`, 218
stars) and essentially nothing for organic (`dbt_social_media_reporting`, 24 stars, five
metrics, an ETL vendor's package). We ship four things, in this order:

1. **Row-level export to the customer's own bucket** — Parquet/Iceberg, incremental, with
   the conformed metric layer and its comparability classes as columns. Includes mentions
   and enrichments, not just aggregate CSVs.
2. **A published, versioned, documented dbt package** over that export, with a semantic
   layer and documented metric definitions.
3. **Snowflake Native App / BigQuery Analytics Hub / Delta Sharing** listings (Phase 3).
4. **Reverse ETL hooks**: warehouse-defined content triggers, audience suppression lists,
   `predicted_ltv` shipped through CAPI, warehouse-driven approval routing.

This is a Business/enterprise-tier feature, it commoditises our own dashboard, and that is
precisely why incumbents will not do it.

---

## 7. Inbox and engagement

### 7.1 The wedge, narrowed

Per the verifier, exactly three things are the wedge; the rest is parity.

1. **SLA as a managed object, not a metric** — configurable targets per brand/channel/
   conversation type, alerts **before** breach, escalation ladders, SLA-based routing.
   Genuinely absent below ~$50k/yr.
2. **The timezone-aware handover digest** — no competitor evidence anywhere in twelve
   dossiers, no platform dependency, cheap. The demo moment.
3. **The Instagram send-eligibility state machine**, spec'd correctly (§7.3).

Demoted: agent capacity/concurrency (post-PMF; only enterprises ask, and they already own
it). Rosters are a **thin input** — who is on shift now, in what timezone — not a WFM
product. No scheduling, forecasting or adherence; that is Assembled/Deputy/PagerDuty
territory and the 3-person ICP will never use it.

Positioning correction: this is a **price and packaging divide**, not "the largest functional
divide in the market". The honest pitch is "contact-centre SLA discipline at agency price,
without adding a Zendesk seat per social manager", and the competitor to beat is the buyer's
existing helpdesk plus a spreadsheet. **[VERIFY]** whether Zendesk/Front/Gorgias/Intercom
social-channel SLA is close enough to kill the wedge — the single highest-risk unverified
assumption in that analysis — and whether Statusbrew's rules engine can already express
"if unassigned > 2h then reassign and notify".

### 7.2 Real-time architecture

No separate realtime service. The API process holds websockets; fanout is Valkey pub/sub
keyed by `org:{id}:node:{path}`; Postgres `LISTEN/NOTIFY` bridges worker-side writes into the
same channel. At the scale where this breaks (~50k concurrent sockets per process family) we
extract a socket gateway — a pre-cut seam, not a day-one build.

Assignment races are settled with an optimistic `UPDATE … WHERE assignee IS NULL` and a
short claim lock, not a distributed coordinator.

### 7.3 The Instagram two-clock state machine

Both clocks in one row; three states in the UI:

| State | Meaning | Send affordance |
|---|---|---|
| `open` | inside 24h of the last inbound **message** | anything |
| `human_agent` | inside the 7-day `HUMAN_AGENT` extension | support content only, labelled as such |
| `closed` | outside both | template path only, or nothing |

Plus the **separate one-shot path**: comment → private reply, **one** per comment, within
7 days of the comment. A comment does **not** reset the 24h DM window; a Story reply does,
because it is a message. This distinction is where competitors get it wrong and where a
support ticket becomes a lost customer.

The UI shows a live countdown per conversation and hard-blocks sends outside the window
rather than letting the API throw.

### 7.4 SLA engine

Timers live in Postgres (`first_response_due_at`, `resolution_due_at`) with a sweeper on a
30-second tick; escalation ladders are `notify` jobs scheduled at ladder offsets and cancelled
on response. Breach *warnings* fire before breach — that is the product.

Routing conditions reuse the approvals condition vocabulary (§12.5), so there is one rules
engine in the codebase, not two.

### 7.5 The mandatory honesty constraint

**Publish a per-channel SLA floor in-product, derived from actual detection latency.** Meta
is webhook-real-time; X requires paid polling whose interval is a pricing decision; LinkedIn
has no organic webhooks and no DM API at all; TikTok and YouTube have no comment webhooks.
A customer must never be able to configure a 1-hour SLA on a channel we poll every 6 hours.
The floor is read from the capability descriptor's `detectionLatency` and rendered as a
constraint in the SLA editor, with the reason. Sell the floor as a trust feature.

### 7.6 The small mechanics, shipped where they work

Like a comment: FB/LinkedIn/TikTok yes, IG unverified, YouTube/Threads no. Block a user:
**Facebook Pages only** (`blocked_users`); Instagram has no block endpoint. Ad and dark-post
comment moderation: shipped, but as table stakes to *reach* — NapoleonCat got there first and
Statusbrew and NapoleonCat are rule-based ad-moderation specialists. Ship these where they
work, say so where they do not, and never put them in the headline.

---

## 8. AI layer

### 8.1 Model routing — where the margin lives

A `job_class → model_tier` routing table in config, not code:

| Job class | Tier | Rationale |
|---|---|---|
| caption, hashtags, rewrite, translate, alt text, reply draft | cheapest capable (flash-lite class) | $0.0002–0.008 per call; **the customer cannot tell on a 200-character caption** |
| brand-voice judging, safety, novelty, fatigue | small judge model | <$0.01/brand/month; always on, free |
| sentiment, entities, embeddings, listening classification | self-hosted encoder | ~$5–20 per million |
| long-context reasoning, report narratives, agent planning | frontier | rare, high value |
| image / video / avatar / dub | specialised providers | metered |

**Publish the fact that we route; do not publish which model handles which job**, because
that changes weekly. The routing policy *is* the gross margin: a product billing a flat
credit for a caption served from a flash-lite model has a structurally better cost base than
one serving everything from a frontier model.

Full-stack cost per brand per month at aggressive usage: **≈$26 without GEO monitoring,
≈$52 with it, ≈$210 if every video is premium-tier.** At $99/brand that is ~74% / ~47% /
negative. **Video tier and GEO frequency are explicit plan dimensions, never buried in a
credit pool.**

### 8.2 Credits, priced honestly

- **Meter what costs money; make free what is free.** Text generation is *unlimited on every
  paid plan* with a fair-use ceiling. That is a marketing weapon, not a cost risk — the
  competitive set meters it and users resent it.
- **One credit = one cent of underlying cost, published**, with a rate card and a 3–5×
  markup embedded in the credit price.
- **Pre-flight cost estimate in the UI**: "this 20-second clip will use 160 credits". Nobody
  does this, and surprise is the primary source of credit resentment.
- **Per-brand and per-workspace consumption reporting, exportable** — agencies rebill.
- **Budget caps and alerts** per workspace/brand/month with a hard-stop option.
- **Rollover one month, self-serve top-ups at a published price, no expiry games.**

### 8.3 Brand voice and knowledge

Brand voice is a **structured policy object**, not a prompt string: tone attributes,
lexicon (preferred/banned terms with alternatives), required disclosures, claim allowlist,
reading level, emoji policy, hashtag conventions, language variants, plus 5–20 exemplar
posts. It resolves through the hierarchy (§4.1) with per-node override, and it is consumed
in three places: as generation context, as a judge rubric, and as a pre-publish check.

Knowledge (RAG) is per-node, chunked, embedded into a **per-tenant pgvector namespace** so
deletion is a partition operation. A "Test" surface — ask a question, see what the model
retrieves and answers — is parity with Vista and disproportionately builds trust.

Default: **audience and listening content are not embedded**, because embeddings of personal
data are derived personal data and inherit erasure obligations (`11 §5.5`). Tenant content
is embedded freely; embedding third-party content is an explicit, off-by-default choice
with its own retention setting.

### 8.4 The policy kernel — decision D8

One gate, every write, regardless of origin: UI, public API, MCP, first-party agent,
scheduled job.

```
Command ─▶ POLICY KERNEL ─▶ effect
             │
             ├─ 1. authz          (tenancy, node path, per-feature permission)
             ├─ 2. entitlement    (plan, quota, credit balance)
             ├─ 3. holds          (§5.9 — fail closed on unlabeled content)
             ├─ 4. autonomy policy (mode, budgets, guardrails, escalation, reversibility)
             ├─ 5. content policy (brand safety, banned terms, disclosures, claim allowlist)
             ├─ 6. rights         (§12.8 — hard block on paid/gallery, warn+log on organic)
             └─ 7. approval gate  (§12.5 routing)
                     │
                     ▼
              audit + decision trace (always, including denials)
```

The autonomy policy object, scoped per workspace/node/channel/action:

```
autonomy_policy {
  scope: organization | node | profile | channel
  action: draft | schedule | publish | reply | escalate | boost | delete
  mode: off | propose | approve_required | auto_within_budget | auto
  budget: { posts_per_day, replies_per_hour, spend_per_day }
  guardrails: [brand_voice_id, brand_safety_id, banned_terms_regex,
               required_disclosures[], claim_allowlist, competitor_mention: deny]
  escalation: { sentiment_below, follower_count_above, keyword_match[],
                legal_topic_detected, crisis_signal }
  reversibility: { window_minutes, auto_delete_on_breach }
}
```

Honest framing, per the verifier: **this is a distribution gap, not a capability gap.**
Sprinklr has the capability; what it does not have is a way to buy it. The defensible
sentence is "governance is unbuyable below ~$50k, self-serve was killed on 30 Apr 2026, and
not one of fourteen enterprise vendors lets you enable identity or governance with a credit
card" (`03:285–286`). Budget **12 months of lead, not a moat**, and sell it to the agency or
multi-location operator publishing under someone else's brand name with direct client
liability — not to a CISO who cannot transact at $99/brand.

Of the five kernel elements, three are competent table stakes (policy object, decision
trace, kill switches) and **three are the differentiation budget**:

1. **MCP/API write-safety enforced server-side.** Dry-run by default, propose→confirm token
   handshake, scoped per-node agent tokens, publish and spend caps a headless agent cannot
   argue with. The correct threat model is *not* "an agent hallucination is a live brand
   post" — MCP has had `destructiveHint` annotations since spec 2025-03-26 and elicitation
   since 2025-06-18, and Claude/ChatGPT gate tool calls by default. It is: **client-side
   consent is advisory, unenforceable, and absent entirely for headless agents, so the
   publish gate must live on the server.** Rated P0-EXCEED in the corpus's own parity table
   and shipped by no commercial vendor.
2. **Shadow mode with a published agreement rate.** For N days the agent emits what it
   *would* have done beside what the human did; the product reports agreement. Autonomy is
   enabled from evidence, not a toggle. No commercial or open-source precedent found.
3. **A per-tenant exportable AI compliance report** — AI inventory, disclosure config,
   approval records, model providers and their roles, provenance. `11 §6.2` calls this the
   single highest-leverage AI Act build and says nobody ships it. **This is the sellable
   artefact; the decision trace is merely its substrate.**

### 8.5 Decision traces, split for GDPR

An immutable trace containing user content is unshippable under GDPR Art. 17. So the trace
is two rows:

```
decision_skeleton  (immutable, non-personal, hash-chained)
  trace_id, org_id, actor_kind (human|agent|integration), actor_ref,
  policy_ids_evaluated[], decision, model_id, model_version, prompt_hash,
  candidate_count, ranking_function_id, approver_ref, reversal_path, created_at

decision_payload   (erasable, tombstoned on erasure)
  trace_id, inputs_consulted jsonb, candidates jsonb, selected jsonb
```

Erasure removes the payload and leaves the skeleton, so the audit remains provable while the
content obligation is met.

### 8.6 Evaluation, replay QA and human-in-the-loop

- **Replay harness**: run a configured agent over historical inbox threads, comments and
  reviews, score against a rubric, before it touches a live account.
- **Seedable without customer history**: ship a curated **synthetic corpus per vertical**,
  because the customer's real history is not in our system on day one and platform APIs will
  not give it to us. This is the detail that makes replay QA shippable rather than aspirational.
- **Golden sets in CI**: prompt or model changes run against fixed inputs with judge scores;
  a regression blocks the deploy.
- **Human-in-the-loop by default**: `propose` is the default mode for every new tenant on
  every action. `auto` requires shadow-mode evidence plus an explicit, audited opt-in.
- **Kill switches** at action / node / global level, with automatic pause on anomaly (reply
  volume spike, sentiment collapse, flagged keyword) and a visible "agent is paused" state.

### 8.7 MCP as a product surface

Outbound MCP (our product exposed to the customer's Claude/ChatGPT/Gemini/Copilot) is the
strategic direction: as users move their working surface into general assistants, a product
that is not addressable from them becomes invisible. Every MCP tool is a thin wrapper over
the same command bus the UI uses, so the policy kernel applies identically. Read tools are
open; write tools are dry-run by default and require the confirm handshake.

Inbound MCP (we consume external MCP servers for trend feeds, ads, CRM, commerce) reduces
integration cost and is a Phase 3 nicety.

---

## 9. Security

### 9.1 Threat model, stated plainly

A breach of a normal SaaS leaks data. **A breach of our vault leaks the ability to act** — to
post, delete, message customers, run ads and change page settings, in the customer's name, at
scale, immediately, and publicly. Adversaries in descending order of realism: compromised
sub-processor; compromised engineer endpoint or CI/CD; social engineering of internal support
tooling; application-layer flaws (IDOR, SSRF, log leakage); insider misuse; platform-side
mass token invalidation (not an attack, operationally identical).

### 9.2 Token vault

```
KMS (per region — keys never leave their plane)
 └── regional root key
      ├── tenant_KEK[A]  ─┐  KMS-resident, never exported
      ├── tenant_KEK[B]   │
      └── tenant_KEK[C]  ─┘
              │  KMS.Decrypt(wrapped_dek) → DEK (memory only, short TTL)
              ▼
   credential row: tenant_id, connection_id, platform, key_version,
                   wrapped_dek, ciphertext(AES-256-GCM), nonce, auth_tag,
                   aad = tenant_id|connection_id|platform|key_version
```

Non-negotiables: plaintext tokens never touch logs, traces, support tools, analytics events
or CI artifacts; AEAD only; the app never holds a KEK; DEK cache TTL is a documented,
deliberate number (5–15 min); KMS IAM is a separate trust domain the database credentials
cannot satisfy; least-privilege scopes requested per feature, not maximally at connect.

Cost control: cache the unwrapped DEK per tenant, and make the scheduler **tenant-affine** so
publishing 50 posts for one tenant unwraps one DEK rather than fifty.

Detection signals, all cheap: KMS decrypt volume per tenant vs baseline; decrypts from an
unexpected role/region; publishing-rate anomaly per connection; **content-similarity spike
across unrelated tenants** (the Buffer 2013 mass-spam signature); `reauth_required`
transitions clustering in time; and the high-signal one — **any decrypt not attributable to a
scheduled job or an authenticated user action**, which requires an attribution field on the
decrypt path from day one.

Kill switches built before launch, not during an incident: global publish pause; per-tenant
pause; per-platform pause; mass revocation + forced re-auth; per-connection quarantine.

### 9.3 Connection health — reliability engineering, not a priced feature

Scope correction first: token/reconnection friction is **5% of churn, rank 8 of 8**
(`12 §33.1`). The "#1 addressable" label belongs to **publishing reliability overall**, of
which token death is one of five causes alongside API deprecations, media format rejections,
rate limits and policy blocks. So this is one workstream inside a publishing-reliability
project, funded from the reliability budget, and **never tier-gated** — "pay more and our
software keeps working" reads as extortion.

The probe is a **read-only identity call per network**, never a speculative refresh. On X and
TikTok the refresh token is single-use and rotating; a health check built on refresh attempts
manufactures the exact orphaning failure the feature exists to prevent. Budget nine bespoke
probes plus X's metered read cost against the same app quota used for publishing.

Split the promise in two and market only the honest half:

| Predictable expiry | Unpredictable revocation |
|---|---|
| LinkedIn 60d, Meta `data_access_expires_at`, TikTok 365d refresh, Pinterest 30d | X refresh-orphaning; Meta password change / 2FA / checkpoint / app removal — **no webhook fires** |
| Supports T-14 / T-3 warnings and "3 of your 47 connections will break before your next scheduled post" | Caught only by a daily liveness probe, i.e. hours after the fact |
| Market this | Market as "we catch it before your post does, not before it happens" |

Drop "incremental re-consent" as a capability claim — only Google supports true incremental
auth; Meta's `rerequest` only re-prompts declined permissions; LinkedIn/X/TikTok replace the
grant wholesale. Ship it as **"early scope-delta detection triggering a full re-auth link
before publish time."** Same value, deliverable name.

Refresh is single-writer behind a per-connection distributed lock, with jitter, never on the
request path and never thundering at midnight UTC.

**Repair links**: the seat-free client connect link (which Vista already ships) applied to
the repair case, with the delta being the workflow, the trigger and the batching ("send
repair links to 3 clients"). Expect it to remove roughly one of five friction steps — it
cannot fix a departed employee, a lost Business Manager role, or a Meta security checkpoint,
which is where agency repair conversations actually die.

Do not argue "competitors cannot match our published reliability numbers": the denominator is
uncontrolled, any rival can publish a friendlier one tomorrow, and disclosure invites SLA
obligations. The **contractual SLA with credits** (§5.7) is the version that closes deals.

### 9.4 Application isolation and the boring controls

SSRF is a real and structural exposure because tier-2 platforms require server-side fetches
of user-supplied URLs (Mastodon instances, WordPress sites, RSS feeds, webhook URLs, media
`sourceUrl`s). Defence: scheme allowlist, block link-local/metadata/private ranges,
resolve-then-pin DNS to defeat rebinding, no redirects into private space, a dedicated egress
proxy with its own policy, and per-host rate limits.

Webhook URLs (Discord/Slack/Teams) are bearer credentials: encrypted, never logged, masked in
the UI.

Admin/support tooling is a first-class attack surface: impersonation requires a justification
string, is time-limited, and writes a **tenant-visible** audit entry; bulk export requires
two-person approval.

### 9.5 Audit log

Append-only, hash-chained per organization (`prev_hash` + `entry_hash`), so tampering is
detectable and the chain head can be published periodically. Every consequential action:
publish, approve, connect, disconnect, permission change, export, impersonation, policy
change, hold applied/released, agent action.

Attribution-preserving deactivation ships here, not as a product: a departed employee's
posts, replies and approvals remain attributable after their seat is gone. Sprout, Sprinklr
and Khoros already do this — **we are matching, not exceeding**.

Retention: 12 months minimum, 7 years for enterprise, **excluded from crypto-shred** along
with billing records and anonymous aggregates. This exclusion is stated in the DPA, not
implied.

### 9.6 SOC 2 readiness, built in rather than bolted on

| Control area | Implementation from day one |
|---|---|
| Logical access | SSO for staff, WebAuthn MFA, IAM roles for workloads, no long-lived bootstrap secret anywhere |
| Change management | PRs required, CI gates, signed images, deploy audit trail |
| Monitoring | OpenTelemetry traces/metrics/logs with token scrubbing at the SDK layer |
| Incident response | runbooks per kill switch, on-call rota, the clock table for breach notification |
| Vendor management | published, versioned sub-processor list with RSS + 30 days' notice; **AI providers are sub-processors** and their zero-retention configuration is contractually confirmed, never assumed |
| Data classification | D1–D9 tags on columns; the CI lint that fails a build referencing a PII-tagged column from a control-plane service |

Timeline: Type I readiness at the end of Phase 2, observation window through Phase 3.
Buy SSO/SCIM (WorkOS or equivalent) rather than building SAML — it is two weeks of
integration versus a quarter of edge cases, and procurement cares that it works, not who
wrote it.

### 9.7 Crypto-shredding, with the asterisks stated

Destroying a tenant KEK renders that tenant's ciphertext — including in backups —
unrecoverable. This is the cleanest available answer to the backup-deletion problem, and it
makes the "beyond use" argument cryptographic rather than procedural.

**The asterisks, which are stated in the DPA rather than hidden:** the KMS scheduled-deletion
window (typically 7–30 days) is the real deletion SLA bound; audit logs, billing records and
genuinely anonymous aggregates are deliberately outside the shred; and keys retired by
*rotation* are retained while keys destroyed for *erasure* are destroyed irrevocably. Do not
market a "deletion certificate" without them.

Sell this as **BYOK/HYOK in enterprise procurement** — `11 §864` records that nobody in the
category offers BYOK, and that is a real gap. Do not sell it as a consumer-facing promise.

---

## 10. Infrastructure

### 10.1 The stack, and why each choice is the boring one

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| Language | **TypeScript, Node 22 LTS** | One language across API, workers, adapters, web and React Native. For a team of six, a second runtime costs more than it saves. The repo already is this |
| API | **Fastify + zod + generated OpenAPI** | The public REST API is a product requirement (P1-EXCEED, self-serve). Contract-first means the SDK, the docs and the MCP tool schemas generate from one source |
| Web | **Next.js (App Router)** | Public surfaces — link-in-bio, share links, programmatic SEO landing pages, report links — need SSR and are the acquisition strategy. The app shell is a thin client over the same REST API |
| Mobile | **React Native (Expo)** | One team, one language; the reminder-publish handoff needs native share/notification APIs but not a native codebase |
| OLTP | **PostgreSQL 17** (RDS/Aurora, one per region) | RLS, `ltree`, partitioning, `pgvector`, `LISTEN/NOTIFY`, `SKIP LOCKED`. Five products in one operable database |
| Jobs | **Postgres-backed queue** (`SKIP LOCKED` + NOTIFY) | Transactional enqueue with the business write. No dual-write problem. Debuggable with SQL |
| Cache/locks | **Valkey** | Token buckets, per-connection locks, pub/sub. Nothing durable |
| Objects | **S3-compatible, per region** (R2 for media/CDN economics, S3 where residency demands) | Egress dominates media cost; R2's zero-egress and EU jurisdiction option are the two facts that matter |
| CDN | **Cloudflare** | Media, link-in-bio, short links, WAF, bot control at the edge |
| Transcode | **ffmpeg in a scale-to-zero worker pool**, presets per network | Social video is short; a managed video platform is 10–30× the cost for outputs we fully control |
| OLAP | **ClickHouse** (Phase 2) | Cheapest credible engine for metric facts + listening aggregates at this shape |
| Search | **Postgres FTS → OpenSearch** (Phase 3) | Do not run OpenSearch until listening volume justifies it |
| Vectors | **pgvector** | Deletion-friendly namespacing beats a dedicated vector DB at our scale |
| Compute | **ECS Fargate + Terraform** | No Kubernetes. Two task definitions (`api`, `worker`) per region, autoscaled |
| Identity (staff+customers) | own auth + **WorkOS** for SAML/SCIM | Buy the enterprise identity surface |
| Billing | **Paddle (MoR)** self-serve; Stripe invoicing for enterprise | Decision D9: global VAT/GST handled from day one |
| Email/push | SES/Postmark + FCM/APNs | — |
| Observability | **OpenTelemetry → Grafana Cloud**, Sentry with scrubbing | One vendor, one query language |
| CI/CD | GitHub Actions → ECR → ECS rolling deploy | — |

### 10.2 Multi-region and residency — decision D2

```
        GLOBAL CONTROL PLANE  (one region; NO end-user PII)
        tenant registry · entitlements · flags · billing · release orchestration
                              │  tenant_id + region routing only
      ┌───────────────────────┼───────────────────────┬────────────────────┐
      ▼                       ▼                       ▼                    ▼
  EU PLANE               US PLANE               APAC PLANE          (CN PLANE — later,
  eu-central-1           us-east-1              ap-southeast-1       separate entity,
  PG · Valkey · S3 · KMS · workers · webhooks endpoints              ICP-filed callbacks)
```

Rules, all enforced mechanically:

1. **Keys never leave their plane.** An EU tenant's KEK lives in an EU KMS. This is the
   supplementary measure that makes the transfer impact assessment defensible.
2. **No cross-plane PII** — a CI lint fails the build if a PII-tagged column is referenced
   from a control-plane service. Policy without a technical control is not a control.
3. **Regional webhook/callback endpoints on region-appropriate domains** — required for
   China, useful everywhere for latency and for the "data never left" claim.
4. **Support tooling is in scope.** A US support engineer viewing an EU tenant's inbox is a
   transfer: either regionalise support access or paper it under SCCs with access logging.

Phase 0 ships **one plane (EU) plus the control plane**, because the seam — not the second
region — is the irreversible part. The US plane follows in Phase 1, APAC in Phase 3.

Run **SCCs in parallel with DPF certification** regardless of DPF's status, because the
historical half-life of these mechanisms is 4–5 years.

### 10.3 Cost model at three scales

Order-of-magnitude, US/EU cloud pricing, excluding salaries and platform data licences.

| Component | 1k tenants / 10k profiles | 10k / 120k | 50k / 600k |
|---|---|---|---|
| Compute (api+worker, 2 regions) | $900 | $4,500 | $18,000 |
| PostgreSQL (multi-AZ + replica) | $700 | $3,800 | $14,000 |
| Valkey | $150 | $600 | $2,200 |
| Object storage + CDN egress | $400 | $3,000 | $14,000 |
| Transcode (ffmpeg, scale-to-zero) | $200 | $1,600 | $7,000 |
| ClickHouse | — | $900 | $4,000 |
| OpenSearch (listening) | — | $700 | $3,500 |
| KMS (with DEK caching) | $60 | $400 | $1,800 |
| Observability | $300 | $1,200 | $4,000 |
| AI inference (routed; text free, media metered) | $2,500 | $22,000 | $95,000 |
| X API tier | $200 | $5,000 | $42,000+ |
| **Total / month** | **≈$5,400** | **≈$43,700** | **≈$205,500** |
| **Per profile / month** | **$0.54** | **$0.36** | **$0.34** |

Three observations. **AI inference dominates** and is controlled by routing, not by
negotiating cloud discounts. **X is a step function** and must be a metered add-on or a
plan gate, not a bundled cost. **Per-profile cost falls slowly**, so gross margin comes from
price architecture (`12 §35.2`: charge for volume and intelligence, give away seats and
channels), not from infrastructure efficiency.

### 10.4 Media pipeline

Upload → virus scan → probe (ffprobe) → perceptual hash (dedupe + "you already used this
creative") → derivative generation per **target network preset**, lazily on first target
resolution and cached by `(asset_id, preset_id)`. Presets are derived from the same capability
descriptors that drive validation, so a spec change regenerates derivatives rather than
producing publish failures.

Large uploads go direct-to-S3 with presigned URLs; the API never proxies bytes.

### 10.5 Environments

Four: `dev` (per-engineer, ephemeral), `ci`, `staging` (a full region plane with platform
sandbox apps and dedicated test accounts), `prod`. Staging holds the **canary tenant** (§11.3)
that publishes real posts to accounts we own.

### 10.6 Pre-cut extraction seams

The monolith is designed to be broken along known lines, when a *measured* pressure appears:

| Seam | Extraction trigger |
|---|---|
| `worker` (already separate) | independent scaling — already done on day one |
| transcode pool | CPU contention with API |
| ingestion/enrichment | listening volume > ~5M mentions/month |
| websocket gateway | > ~50k concurrent sockets |
| MCP/public API edge | separate rate-limiting and abuse profile |
| a region plane | regulatory requirement, not load |

No seam is crossed pre-emptively. Each is a boundary in the module graph today, so extraction
is a deployment change plus an HTTP hop, not a refactor.

---

## 11. Deployment, testing, observability and keeping 60+ integrations alive

### 11.1 The integration health problem, stated

Sixty-plus third-party APIs, each of which can change without notice, and several of which
change on a schedule (Meta ~2-year version deprecation, LinkedIn 12-month version window).
The failure mode is not "an integration breaks" — it is "an integration breaks and we find
out from a customer".

Five mechanisms, in ascending cost:

### 11.2 Contract tests against recorded fixtures

Every adapter has a fixture set recorded from real API responses (scrubbed). Tests run
offline in CI on every commit and assert request shape, response parsing, error mapping and
capability conformance. **Cheap, fast, and catches our regressions — not theirs.**

### 11.3 Synthetic canaries — the mechanism that catches theirs

A dedicated **canary tenant** with accounts we own on every network, running a scheduled
matrix continuously in production:

```
per network, per format, hourly (or at the tightest cadence quota allows):
  publish → read back → verify shape and metrics → delete → record latency and outcome
```

Outputs feed the same per-network SLO dashboard customers see and page on-call when a
network's success rate drops below its baseline. This is the only mechanism that detects a
silent platform behaviour change before customers do, and its cost is a handful of test
accounts plus quota.

Cadence is quota-aware: YouTube's 10,000 units/day means an upload canary runs a few times
daily, not hourly. X canaries cost money and run at the minimum useful rate.

### 11.4 Capability drift detection

Nightly, per network: fetch whatever the platform exposes about its own limits
(`content_publishing_limit`, `creator_info`, `post_requirements`, documented rate headers)
and diff against the capability descriptor. A mismatch opens an issue with the diff attached.
Descriptors older than 90 days warn; older than 180 days fail the check. Combined with a
**deprecation calendar** — Meta version dates, LinkedIn version window, announced metric
removals — each with an owner and a due date.

### 11.5 Self-healing behaviours

| Symptom | Automatic response |
|---|---|
| token nearing expiry | proactive refresh with jitter, single-writer |
| refresh fails | mark `AUTH_REVOKED`, send repair link, preserve slots inside the lateness budget |
| scope missing | scope-delta detection → re-auth link before publish time |
| network 5xx rate spike | circuit breaker opens, breaker state visible in the customer UI |
| repeated `CONTENT_REJECTED` on one destination | candidate destination rule proposed to the review queue |
| repeated `UNKNOWN` | pages an engineer; every `UNKNOWN` is a taxonomy bug |
| container expired (Meta 24h) | restart from `MEDIA_STAGED`, not from `PUBLISHING` |
| media format rejection | re-encode with the fallback preset and retry once |

### 11.6 Observability

Traces span the full publish path (`compose → policy → schedule → claim → adapter → verify`)
with `org_id`, `node_path`, `network`, `target_id` and `attempt` as span attributes, so "why
was this post late" is one trace. Token values are scrubbed at the SDK layer, not by
convention.

The SLO set that matters:

| SLO | Target | Why |
|---|---|---|
| Scheduled post fires within 60s of its slot | 99.5% | the core promise |
| Publish success rate per network | tracked per network, no single global number | a global number hides the broken network |
| Duplicate publish rate | **0** | any occurrence is a Sev-1 |
| Inbox message visible within its channel's detection floor | 99% | honesty about the floor is the feature |
| Metric snapshot completeness per day | 99.9% | missed snapshots are unrecoverable data loss |
| p95 API latency | < 300ms | — |

### 11.7 Deployment

Trunk-based, feature-flagged, rolling ECS deploys per region, migrations
expand/contract so a rollback never needs a down migration. Adapters are versioned
independently of the app and can be pinned per tenant, so a bad adapter release can be rolled
back for one tenant without a full deploy.

---

## 12. Differentiator implementation specs

Each of the eleven verified differentiators, with the verifier's narrowing applied, mapped to
the architecture above. **Positioning language here is the honest version, not the pitch
version.**

### 12.1 Crisis hold — a Gate, priced into the governance plan

Build order, by value per unit cost:

1. **Composite hold object with reason + audit + restore queue** (§4.2, §5.9). The restore
   queue is the strongest single element and the best demo moment.
2. **Crisis preset, organic only** — freezes outbound publishing, suppresses DM automations,
   evergreen recycling and boost triggers, flips the inbox to triage, posts a notice to
   Slack/Teams, pins an in-app banner.
3. **Recurring blackout windows** from a holiday/events calendar — cheap, low value, ship it
   because it is trivial and it reuses the §5.1 blackout primitive.
4. **Boost suppression**, once Meta `ads_management` Advanced Access lands.
5. **Listening trigger, LAST**, scoped to owned-channel comment/DM sentiment velocity only,
   and always a *proposal a human confirms* — never an unattended automation. Do not build
   cross-platform mention-velocity triggering until enterprise ARR funds X/Reddit data.

Positioning: **"everyone has an on/off switch; nobody below enterprise has a hold you can
reason about."** Buffer has had per-channel Pause Queue with automatic defer-forward for a
decade at entry pricing; Sprout, Agorapulse and SocialBee ship some pause; Sprinklr and
Khoros ship real freeze windows. The unserved core is the composite: label-scoped fail-closed
holds, an explicit per-window policy choice, a restore review queue with bulk re-slot, and a
crisis preset that also freezes the automations. Price it into the governance plan alongside
approvals, audit log and SSO. **Expect it to close deals, not to carry a price.**

**[VERIFY]** The Vista "no pause switch" finding and the competitor matrix row at
`02:1329` are unverified (`04` contains zero mentions of "pause"), and whether competitors
support bulk move-to-draft — if they do, the "bulk delete destroys the queue" narrative is
overstated.

### 12.2 Client offboarding — one component, built properly

**Build: the access teardown as a single audited transaction.** Ships inside the
agency/white-label tier.

```sql
CREATE TABLE offboarding_transactions (
  id uuid PK, organization_id uuid, node_id uuid NOT NULL,
  operator_user_id uuid NOT NULL, started_at timestamptz, completed_at timestamptz,
  items jsonb NOT NULL,   -- itemised: every profile, token, share link, portal user, CNAME
  outcome text NOT NULL); -- completed | partial(reasons) | rolled_back
```

Steps, all inside one logical transaction with per-item outcomes recorded:
disconnect every profile with **real upstream OAuth revocation** (`adapter.revokeUpstream`,
not a local row delete) → invalidate every outstanding report, calendar and approval share
link → remove client-side portal users → rescind white-label domain/CNAME mapping → destroy
connection DEKs → emit one immutable audit record with operator, timestamp and the itemised
list. Partial failure is reported as partial, never as success.

**Reframed (a):** the exit pack folds into the already-planned migration engineering (§6.3)
and ships as an **authenticated, expiring, account-owner-only export** — not a public URL,
not a hosted permanent bundle. `11 §12.1` rules #2 (do not transfer platform data to third
parties), #4 (delete platform data on disconnect) and #5 (honour upstream deletions) are
each violated by a frozen bundle that survives disconnect and is handed to the next agency.
A one-time authenticated export delivered to the authorised account owner while the
connection is still live is defensible.

**Downgraded (c):** attribution-preserving deactivation is a property of the audit log
(§9.5), not a product. **Demoted (d):** crypto-shredding is built because the architecture
requires it and sold as BYOK/HYOK, with the §9.7 asterisks. **Deleted entirely:** the
PLG/distribution thesis — it contradicts the "exactly four surfaces" finding, fires at peak
negative affect, and its acquisition value is a strict subset of platform re-fetch (§6.3).

### 12.3 Reminder-publish as a first-class mobile product

Specified in §3.8. Positioned as **retention and support-cost reduction inside the plan**,
never as an acquisition wedge: it is invisible in a trial and un-representable in the
comparison table the claim itself says buyers use. Validate willingness-to-pay against the
consumer/prosumer prices Planoly, Plann and Preview command, not a B2B-suite premium.

### 12.4 Connection health as an operational surface

Specified in §9.3. Funded from the reliability budget, **never tier-gated**, and expected to
be copied within a quarter of being marketed (2–4 engineer-weeks of work for an incumbent).
Scope it as publishing reliability with token health as one workstream of five.

### 12.5 Approvals as a routing engine — ship time-and-place first

**Sequence, per the verifier:** the escalation/SLA/digest/OOO layer and the real Slack and
Teams apps are the parts genuinely absent at this price and the parts buyers feel in week one.
The full conditions-and-quorum rules engine is the part most likely to be configured once and
never understood.

1. **SLA ladders, digest batching, OOO delegation, interactive Slack and Teams apps.** Treat
   **Teams as the enterprise-opening half**, and budget for Teams Store validation and for
   tenants that block third-party app installs by admin policy.
2. **Rules engine second**, with a **small closed condition vocabulary plus templates** — not
   a general-purpose builder. The durable part is not the engine (Ziflow, Workfront, Wrike,
   Power Automate all have one) but its fusion to **social-native conditions** evaluated at
   the publish gate: network, ad spend, AI-generated flag, content label, first-time poster,
   policy-keyword hit.

**The pricing mechanic is a hard requirement, not a nicety.** The value of routing scales with
reviewer count and per-seat pricing taxes exactly that. Ship a **free or near-free
reviewer/approver seat class**, plus **decision-by-link** for external clients who will never
install a Slack app. Kontentino won on approve-by-emailed-link with no account; agencies share
logins specifically to avoid seat pricing. Without this, adoption dies at procurement.

**Legal framing:** FINRA 2210 principal pre-approval and SEC 206(4)-1 are the binding drivers;
the EU AI Act is supporting evidence (Art. 50(4b) bites only on AI-generated text on matters
of public interest, and Art. 50(4a) deepfake disclosure is not satisfied by an approval
record). For the regulated buyer the record must bind to an immutable content version hash,
attest reviewer identity through **SSO rather than a raw Slack user id**, and export/journal
into the customer's existing archive of record (Smarsh, Global Relay, Proofpoint, Hearsay).
**Integrate, do not replace.**

Positioning: a **Gate, not a Moat.** "Conditional approval routing with SLA escalation exists
only above roughly $50k ACV; nobody at $10–60/user/mo ships it." Nobody switches suites for an
approvals engine; it unblocks RFPs and prevents churn.

### 12.6 Time and calendar correctness — §5.1

Hygiene plus demo credibility, never the headline: a qualifier that loses deals when absent
and closes none when present. Budget 8–12 weeks for the full scope. Treat it as a wedge into a
**MENA-focused positioning bundled with RTL layout, Arabic grapheme counting and Arabic-native
AI**, never as a standalone reason to buy. Do not claim category-wide absence of per-profile
timezone (Buffer's per-channel schedule carries its own zone; the project's own matrix marks
eight competitors ⚠️, not ❌), and do not claim every incumbent's calendar is visibly wrong —
enterprise incumbents ship multi-region publishing; what they lack is CLDR-correct week data
and Ramadan planning. The inverted-heatmap argument is deleted: best-time engines are computed
from observed engagement, so a Gulf account's heatmap is already correct; only the weekend
shading is wrong.

### 12.7 Publish verification

Specified in §5.6 and §5.7. **Retention infrastructure, not the acquisition wedge** — it
defends 10–15% of SMB churn (below price-at-renewal at 15–20%) and clears an
enterprise/agency procurement gate. Lead with something else; make this the reason customers
stay and the thing agencies renew on. **[VERIFY]** the 10–15% figure with actual win/loss and
cancellation interviews before it becomes load-bearing in any deck or pricing decision.

### 12.8 Rights ledger — a live-permission-to-live-spend ledger

**Scope:** not "a rights ledger that blocks the publish" — that category exists (AEM Assets,
Bynder, Brandfolder, Acquia DAM, Aprimo, FADEL Rights Cloud, Rightsline, CrowdRiff). The
differentiator is **the join between an expiring grant and the ad groups, gallery slots and
scheduled posts that currently depend on it** — reach across the scheduler, the UGC gallery
and the ad account, not the rights object.

```sql
CREATE TABLE rights_grants (
  id uuid PK, organization_id uuid, asset_id uuid,
  origin text NOT NULL,          -- own_consent_capture | own_creator_contract |
                                 -- redeemed_spark_auth | imported (UNENFORCED)
  scope jsonb NOT NULL,          -- organic|paid|web|print, territory, channels
  starts_at, expires_at timestamptz,
  expiry_source text,            -- 'platform_api' | 'creator_asserted'  ← label it
  terms_snapshot jsonb NOT NULL, -- the consent terms AS THEY WERE at consent time
  state text NOT NULL);          -- active | expiring | expired | unverified

CREATE TABLE rights_dependencies (  -- the actual differentiator
  grant_id uuid, dependent_kind text,  -- ad_group | gallery_slot | scheduled_post
  dependent_ref text, live boolean, detected_at timestamptz);
```

**Population:** enforce only over rights the system itself originated — its own consent
capture, its own generated creator contract, its own redeemed Spark/Partnership
authorisation. Never promise enforcement over imported stock or agency PDFs; offer those as
an unenforced attachment in an explicit **"unverified rights"** state. An empty ledger blocks
nothing.

**Enforcement:** per-rights-class policy, not a blanket block. **Hard block on paid promotion
and gallery serving; warn-with-logged-override on organic**, always attributed and audited.
Blocking a launch on customer-supplied data that turns out stale is a vendor-owned incident,
and hard-blocking asserts we are the legal arbiter. **The sellable primitive is the override
record, not the block.**

**Sharpest wedge:** the whitelisting-expiry → live-ad-dependency alert with 7-day lead, plus
auto-pause-with-confirmation. Requires `ads_management` Advanced Access. **[VERIFY]** whether
`tt_video/authorize` actually returns an expiry timestamp; if it does not, we are storing a
creator-asserted duration and must label it as such (hence `expiry_source`).

**Dropped or downgraded:** C2PA *writing* (generators already sign, platforms strip or
re-sign — the honest feature is metadata preservation through transcode); AI-label propagation
*as a differentiator* (Postiz and other OSS already set TikTok `is_aigc` and YouTube
`containsSyntheticMedia`, and Meta exposes no API field at all — table stakes on two surfaces,
impossible on the third); the music check (a standing warning on platform-sourced assets, not
a detection capability); EU AI Act fine figures (the whole dating chain is second-hand).

**GTM:** pitch the **paid-media and creator-programme owner** on the money case — paid-usage
rights cost 3–10× organic, and a lapsed authorisation kills a scaling ad mid-flight. Legal is
a veto, not a budget. Regulated-industry compliance budget in this category goes to archiving
and supervision, not rights expiry.

### 12.9 Coverage — who is on duty, what broke overnight, what breached SLA

Specified in §7.1, §7.3 and §7.5. The research's own plan puts care depth at months 9–18
behind procurability; if the module is pulled forward, pull forward **only** SLA-as-an-object,
the handover digest and the Instagram send-eligibility state machine. The case object, QA
scoring and CRM bidirectional sync stay in Phase 3.

### 12.10 The autonomy kernel

Specified in §8.4. Three unclaimed elements carry the differentiation budget — server-side
MCP/API write-safety, shadow mode with a published agreement rate, and the per-tenant
exportable AI compliance report. The policy object and the decision trace ship as competent
table stakes. Note that this claim restates the corpus's own build recommendation
(`09 §4.3`); the corpus agreeing with itself is not market validation. The independent
evidence is `03:285` (no self-serve governance anywhere) and `01:1269`/`01:1358` (MCP
write-safety unclaimed, P0).

### 12.11 Bandit allocation — narrow to mechanism 2, fix the unit of inference

| Decision | Specification |
|---|---|
| **Single-account queue-slot bandit** | **Not a headline feature.** At <200 lifetime posts and CV≈0.8 it cannot resolve realistic effects. Keep sequential allocation only as an **exploration scheduler** that prevents send-time selection bias |
| **Arms** | **Creative FEATURES** (hook archetype, format, length, CTA presence, face-in-thumbnail), not specific assets — learned in a hierarchical/contextual model pooled across the entire customer fleet with per-account partial pooling. This moves n from per-account (hopeless) to fleet-wide (thousands of posts/day), makes cold-start work, and compounds with the benchmark panel |
| **Randomised trials** | **Franchise / multi-location only.** An agency manages 5–200 *heterogeneous* client brands; a creative variant is not applicable across two unrelated clients, so there is no valid randomisation. Eligibility gate: **≥30 actively-posting comparable locations**. Use **crossover/within-location designs**, not the parallel 50-vs-50 split — parallel assignment at n=50 detects only ~45% lift |
| **MDE up front** | "With your 42 locations posting weekly, this test can detect a 30% difference in 6 weeks; smaller differences will return *inconclusive*." **This is the feature that makes the honest version sellable against the dishonest one** |
| **Paid bridge** | Optional add-on, described truthfully as a **paid-audience creative signal correlated with** — not an unbiased estimator of — organic quality. If shipped, a real split test with equal-delivery enforcement, not a boost. Must not gate the core product on the 8–12 week `ads_management` Standard approval |
| **Anti-duplication** | Engineered from day one: per-location token substitution in copy, staggered publish windows, rate shaping. **Never publish byte-identical creative to 50 accounts through one app id** |
| **Reward** | Multi-objective (engagement AND sentiment AND brand-voice adherence AND follower retention), brand safety as a hard feasibility constraint not a penalty; fixed 48h window; discounted/sliding-window statistics for non-stationarity; normalised by reach; hierarchical partial pooling so a two-arm result on six posts is reported as uncertainty, never as a winner |

**[VERIFY]** Audit SOCi, Rallio, Chatmeter and Birdeye before building — they own this segment
and the corpus never checked them.

---

## 13. Roadmap

Sequencing logic, stated once: **calendar-time dependencies start on day one; irreversible
decisions are taken in Phase 0; the acquisition surface ships before the product that needs
OAuth; parity ships before differentiation; differentiation ships in the order of
value-per-unit-cost, not in the order of how interesting it is.**

### Phase 0 — Weeks 1–4: the irreversible decisions and the un-gated surface

**Day 1, before any code: file every platform application.** Meta Business Verification +
App Review, LinkedIn Community Management, TikTok content-posting audit, Google OAuth
verification + YouTube quota extension, Pinterest Standard access. These are weeks-to-months
of calendar time and nothing about them gets faster by starting later. Assign one owner with
a named date per application.

| Workstream | Deliverable |
|---|---|
| **Kernel** | tenancy + hierarchy (`ltree`) + RLS; per-tenant KEK vault (D1); control plane / EU plane seam + CI PII lint (D2); Postgres job runner; audit log with hash chain; policy kernel skeleton |
| **Adapters** | archetype base classes A, B, G; capability descriptor loader + validator (extend the shipped `packages/adapters`); error taxonomy; destination-rules table |
| **Time** | `(wall_clock, zone)` storage (D3), tzdb pipeline, CLDR week data, dual-time composer rendering |
| **Acquisition surface** | **link-in-bio + short links + QR shipped publicly**, with its own domain and free tier. No OAuth, no App Review, no approval — a working page in 60 seconds while the platform applications are pending. The URL is the highest switching cost in the category |
| **Micro-tools** | 3–4 programmatic-SEO lead magnets (engagement-rate calculator, UTM builder, best-time calculator, IG audit via `business_discovery`) |
| **Commercial** | Paddle MoR checkout (D9), plan/entitlement model, usage meter |
| **Ops** | Terraform, ECS, CI, OTel, Sentry with scrubbing, staging plane |

Phase 0's purpose is that **the two things with the longest lead times — platform approvals
and the acquisition loop — are both already running while the product is being built.**

### Phase 1 — Weeks 5–16: parity core and the switch story

| Area | Ships |
|---|---|
| **Publishing** | Meta family (FB Pages, Instagram, Threads) + Pinterest + YouTube; full state machine with claims, idempotency, lateness budget, retry ledger; pre-flight at all three points; **read-back reconciliation**; per-network SLO dashboard |
| **Compose/calendar** | multi-network composer with per-network variations and apply-to-all, first comment + comment chains, alt text everywhere it is supported, hashtag groups, link shortening + UTM + per-message link ids, calendar with drag-drop and filters, queues with labelled slots, bulk CSV import, shared calendar links |
| **Media** | library with folders/labels/alt text, transcode presets, perceptual hashing, cloud-drive sync |
| **Analytics** | **daily snapshots from connect (D5)** — non-negotiable, data lost otherwise; 3-layer metric model; core report catalogue; white-label PDFs; scheduled delivery |
| **Migration** | platform re-fetch backfill on connect; vendor CSV importers; bulk OAuth wizard; reconciliation report; "switch in 20 minutes" as a named marketed flow |
| **Inbox v1** | Meta comments + DMs with the two-clock state machine; saved replies; assignment; moderation |
| **Governance v1** | linear approvals + **decision-by-link + free reviewer seats**; hold object with reason, audit and **restore queue**; connection health with T-14/T-3 and repair links |
| **Reminder v1** | mobile app with IG Stories, IG personal, TikTok creative layer; never-drop-the-slot semantics; capability matrix published |
| **Developer** | public REST API (self-serve, no sales gate) + **MCP server with server-side write-safety** (dry-run default, confirm handshake, scoped tokens, caps) |

Exit criterion for Phase 1: **an agency can run a real client on it without a spreadsheet.**

### Phase 2 — Weeks 17–32: the agency and multi-location wedge

| Area | Ships |
|---|---|
| **Networks** | LinkedIn, TikTok, X (gated/metered), Reddit, Bluesky (complete listening), Mastodon, Telegram, Discord, GBP |
| **Hierarchy** | locked templates with editable zones enforced by a publish-time diff check; per-node approval rules; merge fields; roll-up + compliance view ("which of my 340 locations are dark"); per-profile timezone rollouts |
| **Approvals** | SLA ladders, digests, OOO delegation, **real Slack and Teams apps** with interactive decisions; rules engine with a closed vocabulary; approval records bound to content hashes and SSO identity |
| **Inbox** | SLA as a managed object; handover digest; per-channel SLA floors; automation rules; reviews (GBP + Facebook + app stores) |
| **Analytics** | competitor analytics across ≥6 networks; benchmarks; custom metrics; **warehouse export (Parquet/Iceberg) + dbt package**; ClickHouse behind it |
| **Listening v1** | Bluesky complete, Reddit, YouTube comments, RSS/news; Boolean query language; versioned queries; **honest per-source coverage disclosure** |
| **Agency** | white-label incl. domains and branded reports; client portals; per-client billing/reselling; **offboarding as one audited transaction** |
| **Trust** | SSO + SCIM (bought); audit surfacing; DPA + sub-processor pages; **SOC 2 Type I readiness**; US plane live |
| **AI** | brand voice + RAG knowledge with test surface; generation surfaces; shadow mode; credits with published rate card |

### Phase 3 — Months 8–18: depth, autonomy and global

| Area | Ships |
|---|---|
| **Autonomy** | full policy kernel modes; decision traces split skeleton/payload; replay QA with synthetic vertical corpora; **per-tenant exportable AI compliance report** |
| **Experiments** | fleet-wide creative-feature model; franchise crossover RCTs with MDE reporting; exploration scheduler |
| **Regional** | LINE (Japan/Thailand), VK, Kakao, Naver, Zalo; APAC plane; RTL + Arabic grapheme counting + Arabic-native AI as a MENA bundle |
| **Rights** | live-permission-to-live-spend ledger; whitelisting expiry alerts; override records |
| **Paid** | ad account connect, boost configs, dark posts, paid-vs-organic |
| **Advocacy** | curation, leaderboard with EMV, Slack alerts |
| **Enterprise** | BYOK/HYOK; contractual SLA with service credits; residency selection; archive-of-record integrations (Smarsh, Global Relay, Proofpoint, Hearsay); SOC 2 Type II report |
| **Warehouse** | Snowflake Native App / BigQuery Analytics Hub / Delta Sharing; reverse ETL |
| **GEO** | AI-answer visibility monitoring, metered |

### 13.1 Team shape

Six to eight people through Phase 1: two on the publishing/adapter spine, one on
data/analytics, one on web, one on mobile+reminder, one on infra/security, one product
engineer across inbox and governance. Adding people to the platform-approval workstream does
not make it faster; adding them to the adapter workstream does, because archetypes
parallelise cleanly once the base classes exist.

---

## 14. Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Platform approvals slip** (Meta App Review, TikTok audit, LinkedIn CMA) and Phase 1 has no networks | High | Severe | File on day 1; sequence Phase 1 around the Meta family, which is one auth ceremony for three networks; ship link-in-bio and micro-tools as revenue-neutral but pipeline-positive surfaces meanwhile; use TikTok send-to-inbox (no audit for public content) as the interim path |
| R2 | **Our app is suspended by a platform**, killing every tenant's connections at once | Low | Catastrophic | Never scrape through our app id; per-network kill switch; pre-written runbook and customer comms; canary detection; licensed providers for any third-party data |
| R3 | **X pricing invalidates the plan table** (per-post $0.015 / $0.20 with a link is unverified) | Medium | High | X is a metered add-on or a plan gate from day one, never bundled into a flat volume allowance. **[VERIFY] first** |
| R4 | **Duplicate publishing** reaches a customer's audience | Medium without design; near-zero with | Severe, unrecoverable | Claim-before-call, idempotency keys, `VERIFY_PENDING` instead of blind retry, read-back reconciliation. Any occurrence is Sev-1 |
| R5 | **A hold appears applied while Meta publishes anyway** (server-side `scheduled_publish_time`) | Medium | Severe — it is a trust feature failing in the trust moment | `cancelNative` on hold; `FAILED_TO_CANCEL` surfaced loudly with the affected posts listed; canary coverage for the hold path |
| R6 | **Label-scoped hold leaks unlabeled promotional content** | Medium | Severe | Fail closed by construction (`label_mode='fail_closed'`); property tests assert unlabeled content is held |
| R7 | **Metric data lost forever** because snapshots did not start on day one (Pinterest 90d, X 30d, TikTok 60d) | Medium | High, irreversible | Snapshot job is a Phase 1 launch gate, not a feature; alert on snapshot completeness < 99.9% |
| R8 | **Retention violation** — a shared metrics table inherits the union of every platform's restriction | Medium | High (platform + regulator) | Partition by network; separate raw entity store from aggregate store; retention enforced per partition; deletion replay log |
| R9 | **The differentiators are copied in a quarter** (connection health, crisis hold, approvals engine) | High | Moderate | Price them as Gates, not moats; expect 12 months of lead on the kernel; put the durable investment in the observed-failure corpus, the fleet creative-feature model and the hierarchy data model |
| R10 | **The franchise segment is already owned** by SOCi/Rallio/Birdeye/Chatmeter and the corpus never checked | Medium-High | High — invalidates a whole wedge | **[VERIFY] before funding.** Narrow to the 5–75-location band and to agencies with multi-location clients; compete on suite depth, not local-marketing breadth |
| R11 | **Zendesk/Front/Gorgias/Intercom already ship social SLA** close enough to kill the coverage wedge | Medium | High | **[VERIFY] — the highest-risk unverified assumption** in the inbox analysis. Fall back to positioning as "no extra helpdesk seat per social manager" |
| R12 | **AI cost overruns** — premium video and GEO monitoring at a $99 price point | Medium | High | Routing table is the margin lever; video tier and GEO frequency are explicit plan dimensions; hard budget caps per workspace; pre-flight cost estimates |
| R13 | **Reminder-publish under-delivers** versus the pitch because iOS will not allow pre-staging | High if over-promised | Moderate | Promise "best-effort prefetch, one-tap transfer", never "clipboard staged at 9:00"; instrument competitors' handoffs before building; price as retention, not acquisition |
| R14 | **Deep-link recipes rot** with every app version | Certain | Moderate | Permanent per-app-version QA line on a small device farm; recipes are config, not code; degrade to copy-paste with an explicit notice |
| R15 | **DPF is invalidated** mid-build | Medium (4–5yr historical half-life) | High | SCCs in parallel from day one; current TIA; EU plane means "EU data does not leave the EEA" is a configuration, not a project |
| R16 | **RLS bypassed by a worker path**, causing cross-tenant leakage | Medium | Catastrophic | `withTenant()` wrapper as the only repository entry point; lint against direct access; generated cross-tenant property tests over the route table; AAD turns a missed filter into a decryption failure |
| R17 | **Modular monolith degrades into a big ball of mud** | Medium | Moderate | Import-boundary lint in CI from week 1; contract sub-paths; pre-cut extraction seams with measured triggers |
| R18 | **Postgres job queue outgrown** | Low at target scale | Moderate | Measured trigger (queue depth p95, claim latency) → move ingestion to Redpanda, keep publishing in Postgres |
| R19 | **Rights ledger creates vendor-owned incidents** by hard-blocking on stale customer data | Medium | High | Hard block only on paid and gallery serving; warn-with-logged-override on organic; enforce only over system-originated rights; label creator-asserted expiries |
| R20 | **Bandit ships dishonest results** — declaring winners off six posts | Medium | High (credibility) | MDE reported before the test runs; hierarchical pooling; "inconclusive" is a first-class outcome; franchise eligibility gate at ≥30 comparable locations |
| R21 | **Agent action causes a brand incident** | Low with the kernel; high without | Severe | `propose` is the default mode; shadow-mode evidence required before `auto`; reversibility windows; anomaly auto-pause; server-side caps that headless agents cannot argue with |
| R22 | **Small team burnout across 60 integrations** | High | High | Nine archetypes, not sixty implementations; capability descriptors as data; contract tests offline; canaries catch platform changes so humans do not have to watch |

---

## 15. What this architecture explicitly trades away

Honesty about the shape of the bet:

- **A monolith caps single-region throughput** at what one Postgres primary plus read replicas
  can serve. At ~50k tenants that is comfortable; at 500k it is not. We accept that ceiling in
  exchange for a team of six shipping parity in four months.
- **Postgres-as-queue** will not do a million jobs a minute. Our workload peaks in the low
  thousands. We accept the ceiling for transactional enqueue and SQL debuggability.
- **One language** means no best-in-class ML tooling in-process. Enrichment models run as
  separate Python inference services behind HTTP — a deliberate, contained exception.
- **Buying SSO/SCIM and billing** means vendor dependency in the procurement path. Cheaper
  than a quarter of SAML edge cases.
- **The EU plane first** costs us US-latency optimality early. It buys the harder compliance
  story first, which is the one that closes enterprise deals.

---

## 16. Verification backlog — what must be checked before it becomes load-bearing

Ordered by blast radius. **No item below may appear in a deck, a price, or a contract until
it is verified.**

| # | Item | Blocks |
|---|---|---|
| V1 | X API per-post pricing ($0.015 / $0.20 with URL) and tier read caps | The entire pricing table; whether X ships at all below Business tier |
| V2 | SOCi, Rallio, Birdeye Social, Uberall/MomentFeed, Reputation, Chatmeter, Hearsay, Denim Social, Promoboxx, Tiger Pistol, Evocalize, BrandMuscle, Ansira | The multi-location wedge and every conclusion in `03 §2.2` |
| V3 | Zendesk/Front/Gorgias/Intercom social-channel SLA depth | The coverage/SLA wedge |
| V4 | Statusbrew rules engine — can it already express an escalation ladder? | Whether item 1 of the coverage wedge is a capability gap or a UX gap |
| V5 | Vista "no pause switch" + the `02:1329` competitor matrix row; whether competitors ship bulk move-to-draft | The crisis-hold narrative |
| V6 | Whether `tt_video/authorize` returns an expiry timestamp | Whether the whitelisting alert is fact or creator-assertion |
| V7 | Meta App Review / TikTok audit / LinkedIn CMA current timelines and requirements | Phase 1 scheduling |
| V8 | Platform retention ceilings per network, in current terms | The retention matrix and every partition policy |
| V9 | DPF status as of build date | Transfer mechanism and the TIA |
| V10 | The 10–15% reliability churn-defence figure, via win/loss and cancellation interviews | Whether reliability is priced or merely retained |
| V11 | Mobile handoff timings for Later, Planoly, Plann, Preview, Buffer on real devices | Whether reminder-publish is worth funding at the proposed level |
| V12 | Current deep-link recipes per platform, per app version | The reminder pipeline's per-network recipes |
| V13 | Meta `ads_management` Advanced Access timeline | Boost suppression, whitelisting alerts, the paid bridge |
| V14 | Instagram like-as-brand and ad-comment moderation availability | Inbox mechanics claims |

---

## 17. Summary

One deployable, one language, one database per region, nine adapter archetypes covering
sixty-plus networks, six delivery modes including reminder as a first-class citizen, and nine
irreversible decisions taken correctly in the first four weeks.

Parity in sixteen weeks because the parity surface is mostly composition over a correct
kernel. Differentiation after that, in the order of value per unit cost, positioned as what it
actually is: **a set of gates that close deals and retain customers, plus three genuinely
unclaimed assets** — server-side agent write-safety, an accumulating observed-failure corpus,
and a fleet-wide creative-feature model that no competitor with ten customers can bootstrap.

The honesty posture is not decoration. A published capability matrix, a per-channel SLA floor,
an admitted removal-detection blind spot, a comparability class on every cross-network number,
and an MDE reported before a test runs are each individually a small engineering cost and
collectively the only durable differentiation available in a category where every vendor
implies omniscience.
