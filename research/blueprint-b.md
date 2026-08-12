# Blueprint B — The Ceiling Architecture

**A global, AI-native social media management platform: event-driven, multi-region,
warehouse-native, engineered for millions of connected profiles and for enterprise and
regulated buyers from the first commit.**

---

## 0. How to read this document

### 0.1 What this is

This is a full technical architecture and product blueprint for a platform that must
simultaneously satisfy three constraints that pull in different directions:

| Constraint | What it forces |
|---|---|
| **(a) 100% of Vista Social's functionality** | A very wide product surface — 75 parity items across publishing, calendar, media, inbox, listening, reviews, analytics, AI, advocacy, agency/white-label, API/MCP, mobile. Breadth is not optional; it is the price of entry. |
| **(b) Exceed the market on the seven verified differentiators** | Depth in specific places — a publishing hold object, an offboarding transaction, reminder-publish semantics, connection health, org hierarchy, an approvals routing engine, time correctness, publish verification, a rights ledger, coverage/SLA, an autonomy kernel, and fleet-scale experimentation. |
| **(c) Serve every region on earth** | Regional networks, residency shards, CLDR-correct time and text, local payment rails, and a compliance surface that spans GDPR, PIPL, PIPA, LGPD, FINRA and the EU AI Act. |

The angle taken here is deliberately the **ceiling** one: design for the largest system this
product could ever need to be, and then be disciplined about which parts are actually built
first. Every architectural decision below is scored on one question — *is this cheap now and
impossible later?* Where the answer is yes, it goes in Phase 0 even if the feature that needs
it ships in Phase 3.

### 0.2 The five decisions that cannot be retrofitted

Everything else in this document is negotiable. These five are not, because each one is a
rewrite rather than a migration if deferred:

| # | Decision | Section | Why it cannot wait |
|---|---|---|---|
| **1** | **Per-tenant KEK envelope encryption**, from the first credential written | §9.2 | Re-encrypting every credential and content row for every tenant, online, while publishing on a schedule, is a quarter of work and a Sev-1 risk. Doing it at the start costs ~2 weeks. It is also the only mechanism that makes residency mechanical rather than procedural, and the only one that makes BYOK a product rather than a promise. `11 §10.3` |
| **2** | **Scheduled time stored as `(local wall-clock, IANA zone)`**, UTC resolved at dispatch | §5.1 | A stored UTC instant silently drifts when a government changes DST rules. There is no back-fix: the intent (`9am local`) was destroyed at write time. This decision also **forecloses delegating to platform-native scheduling**, which must therefore be a deliberate, documented choice. `08 §17.1` |
| **3** | **The hierarchy is a tree, not two levels** — `org → workspace → brand-node* → profile`, with permissions, approvals, reporting, timezone, holds and policy all resolving *through* it | §4.2 | Hierarchy and permission models are the canonical non-retrofittable thing. The franchise/multi-location product and the agency product are the *same* data model; building the two-level version first means rebuilding both. |
| **4** | **Capability, destination rules and error taxonomy as versioned data**, not code | §3 | With 60+ networks, `if (network === 'x')` branching in the composer, validator, scheduler and analytics layers means adding network #61 is a cross-cutting change forever. |
| **5** | **The residency seam** — regional data plane, global control plane, PII never crossing | §10.4 | Retrofitting residency into a single-region monolith is a rewrite. Build the seam in Phase 0 even if the second region ships in Phase 3. `08 §14.6` |

### 0.3 Evidence posture

This blueprint is derived from the research corpus in `/home/user/SMM/research/`. That corpus
grades its own claims (`C1`/`C2`/`C3`, `[V]`, `[F]`, `[K]`, `UNVERIFIED`) and this document
**inherits those grades rather than smoothing them over**. Where a number is load-bearing for
an architectural decision and is graded `C3` or `UNVERIFIED`, the design must tolerate the
number being wrong. Those points are flagged inline as **`[FRAGILE]`** and collected in §14.

Three examples of how that changes the design rather than merely annotating it:

- X's per-tier read caps are `C3` and its per-post pricing is `UNVERIFIED` (`12 §35.2` flags
  that one unverified fact could invalidate the entire pricing table). Therefore **X is
  modelled as a metered platform with a per-tenant cost ledger from day one**, so that if the
  price is real the product degrades gracefully rather than the company absorbing it.
- LinkedIn's caching/retention limit is `UNVERIFIED` and is the platform "most reputed to have
  a strict one" (`11 §12.4`). Therefore **retention is per-source-partition and tunable
  independently**, so tightening LinkedIn to 24h does not require touching any other source.
- Meta's current Graph API version as of Aug 2026 is `UNVERIFIED` (`06 §12.1`). Therefore
  **the API version is per-integration config with a migration flag**, not a constant.

### 0.4 Explicit non-goals

Stating these prevents the architecture from being designed around capabilities that are
either illegal, unbuyable, or strategically wrong:

| Non-goal | Reason |
|---|---|
| **Cookie-session / browser-driven publishing or reading** | `09 §4.2.3` documents a mature ecosystem doing this. It is a direct ToS breach on every major network, it endangers the approval portfolio which is the actual moat (`05 §12.1`), and it must never share a code path with first-party OAuth tokens. Never ship it. |
| **In-house scraping of any platform** | `07 §18` is blunt: never scrape in-house, and *never* scrape Google, because it endangers GBP API access. Third-party data enters only through licensed, contractually-fenced providers, labelled with `ingestedVia` in the UI. |
| **Training models on platform data** | Near-universal platform prohibition (`11 §12.1 #7`), a GDPR purpose-limitation problem, and a contractual problem with our own customers. Requires a hard, *tested* boundary between inference-time context (permitted) and training pipelines (prohibited). |
| **A cross-platform identity graph** | `11 §5.2` — it would create a larger privacy problem than the DSAR problem it solves, and breaches several platforms' terms. |
| **A public, permanent, shareable "exit pack" URL** | `11 §12.1` rules #2, #4 and #5 make a frozen bundle that survives disconnect and is handed to the next agency a three-way violation. Replaced by an authenticated, expiring, owner-only export (§9.6). |
| **Firehose data licensing, TikTok Research API, Meta Content Library, face recognition** | `12 §35.1` marks these "Never" on cost, ineligibility or legal grounds. |
| **A standalone premium price on the safety/governance features** | The corpus is consistent that crisis hold, approvals routing and connection health are **gates, not moats**. They remove RFP disqualifiers, win demos and reduce churn. They do not carry a price. |

---

## 1. Thesis: why this shape

### 1.1 The four structural bets

**Bet 1 — Event-driven, because the domain is asynchronous and partially-failing.**
Nine tier-1 platforms, three publishing archetypes, none transactional (`06 §19.1`). Instagram,
TikTok, Pinterest, Bluesky, LinkedIn video, Facebook video and YouTube all use an async
container/job pattern where the platform transcodes for seconds to minutes before a separate
publish call (`05 §4.1.2`). A synchronous request/response design either blocks a worker for
nine minutes or reports success before the post exists. The corpus calls the three-state
pending model "the single most important design lesson" in the reference OSS implementation.
Everything in this platform — publish, ingest, enrich, verify, reconcile — is therefore modelled
as **durable state machines driven by an event log**, not as jobs that call SDKs.

**Bet 2 — Warehouse-native, because it is the largest unclaimed gap and it inverts lock-in.**
`12 §25.2` is unambiguous: no SMM vendor ships a dbt package, a Snowflake Native App, a
BigQuery Analytics Hub listing, Delta Sharing, customer-owned Iceberg tables, a conformed
metric layer as SQL views, or row-level mention export. The demand signal is the 218-star
`dbt_ad_reporting` package versus the 24-star organic-social one — the warehouse world built
serious models for **paid** social and essentially nothing for **organic**. `12 §33.2` names
the tension honestly: the strongest switching costs in this category are data-custody costs,
and warehouse-native gives those away. The resolution adopted here: **give away the raw data,
keep the derived intelligence** — export every metric, mention and enrichment; retain the
benchmark panel, the models, the alerting and the workflow.

**Bet 3 — Multi-region with a hard control/data plane seam, because residency is a
procurement gate and China is a separate legal entity.**
Three independent drivers converge on the same design — EU GDPR residency demands, China's
PIPL plus ICP-filed callbacks, and Korea's PIPA (`08 §14.6`). Regional data plane holds tokens,
message content and end-user PII; global control plane holds accounts, billing, feature flags
and non-identifying aggregates; **no cross-shard PII, enforced at the schema and CI level**.

**Bet 4 — Reliability as the product, because it is the only differentiator the corpus grades
"strong by accumulation" and it is what regulated buyers actually procure.**
`05 §12.5` ranks reliability and observability (token health, quota simulation, idempotency,
silent-failure detection, published metrics) as **the strongest available differentiated
position**. `12 §33.1` corrects the churn arithmetic: publishing failure is 10–15% of SMB churn
and token friction is 5% (rank 8 of 8) — so the project must be scoped as *publishing
reliability*, of which token health is one of five workstreams alongside API deprecations,
media format rejections, rate limits and policy blocks.

### 1.2 What "ceiling" means numerically

The architecture is sized against these targets. They are design constraints, not forecasts.

| Dimension | Target | Implication |
|---|---|---|
| Connected profiles | **10M** | Per-profile state must be ~1 row in hot storage; profile-scoped work must be shardable by profile id. Rules out any design with a per-profile process or per-profile cron entry. |
| Tenants | **500k** | Per-tenant KMS keys at 500k tenants is ~$500k/yr at $1/key/mo — so KEKs are per-tenant but **lazily created and hierarchically derived** for small tenants (§9.2.4). |
| Scheduled publishes | **50M/day peak** (≈580/s avg, ≈5,000/s at the top of the hour) | Scheduling is *extremely* peaky — humans schedule at :00 and :30. The dispatcher must smear within a tolerance budget and must reserve rate-limit capacity ahead of the minute. |
| Ingest events | **5B/day** (webhooks + polls + listening) | A durable log, not a database queue. Partitioned by tenant for fair-share and by source for retention. |
| Metric rows | **~100B/yr** in the raw layer | Columnar, partitioned by `(source, dt)`, with per-partition retention. Never one undifferentiated `post_metrics` table (`11 §12.8` rule 1). |
| Regions | **6 data planes** (us, eu, uk, apac-sg, apac-au, and a legally separate cn entity) + 1 control plane | Region is chosen at tenant creation and is immutable; changing it is a migration, not an update. |
| Publish success SLO | **99.9%** excluding platform outage and customer content rejection, measured per network | Requires the error taxonomy to distinguish *our* failures from *theirs* precisely enough to defend the number contractually (§11.5). |

### 1.3 The composition principle

The product is large. It stays coherent because **eleven services own the eleven nouns**, and
every module is a view over those nouns rather than a silo with its own copy.

```
                       ┌────────────────────────────────────────────┐
                       │  IDENTITY & TENANCY  (org, node tree, user,│
                       │  role, entitlement, residency binding)     │
                       └───────────────┬────────────────────────────┘
                                       │ every other service resolves through it
   ┌───────────────┬───────────────┬───┴───────────┬───────────────┬───────────────┐
   ▼               ▼               ▼               ▼               ▼               ▼
┌────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐
│CONNECT.│  │  CONTENT    │  │ SCHEDULE │  │  INGEST    │  │ CONVERSE  │  │  ASSET +   │
│(conn., │  │(post, var., │  │(slot,    │  │(webhook,   │  │(thread,   │  │  RIGHTS    │
│ token, │  │ target,     │  │ queue,   │  │ poll, event│  │ message,  │  │ (media,    │
│ health)│  │ label,hold) │  │ budget)  │  │ backfill)  │  │ SLA, duty)│  │  grant)    │
└───┬────┘  └──────┬──────┘  └────┬─────┘  └─────┬──────┘  └─────┬─────┘  └─────┬──────┘
    │              │              │              │               │              │
    └──────────────┴──────────────┴──────┬───────┴───────────────┴──────────────┘
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  PLATFORM ADAPTER FABRIC  (§3)             │
                    │  capability data · destination rules ·     │
                    │  error taxonomy · rate budget · transport  │
                    └────────────────────┬───────────────────────┘
                                         ▼
                             60+ heterogeneous networks
                                         ▲
   ┌───────────────┬───────────────┬─────┴─────────┬───────────────┬───────────────┐
   │  MEASURE      │  INTELLIGENCE │  AI RUNTIME   │  GOVERNANCE   │  DELIVERY     │
   │ (metric 3-lyr │ (listening,   │ (router,      │ (policy,      │ (report,      │
   │  warehouse,   │  benchmark,   │  brand voice, │  approval,    │  share link,  │
   │  attribution) │  experiment)  │  agent, eval) │  audit, hold) │  export, API) │
   └───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
```

Two rules keep this from decaying:

1. **No module owns a second copy of a noun.** The inbox does not have its own contact table;
   the advocacy module does not have its own post table; the ads module does not have its own
   asset table. This is precisely the failure the corpus identifies in incumbents: every one
   of them *acquired* its creator/UGC capability as a separate product with a separate data
   model (Tribe→CreatorIQ, Mavrck→Later, Klear→Meltwater, Tagger→Sprout, Olapic→Social Native,
   Pixlee→Emplifi, Stackla→Nosto, Curalate→Bazaarvoice), which is why none of them can enforce
   a rights grant across surfaces they do not jointly own.
2. **Every write goes through the governance kernel** (§8.6). Human, first-party agent, public
   API and inbound MCP call all hit the same server-side gate. Client-side consent is advisory
   and absent entirely for headless agents.

---

## 2. Product surface

### 2.1 The module list

Thirty-one modules in eight families. Parity items are marked `P` (must match Vista), exceed
items `E`, and infrastructure-only modules `I`.

#### Family A — Compose & Publish

| # | Module | Contents | Class |
|---|---|---|---|
| A1 | **Composer** | Multi-network composition, per-network variants with "apply to all", grapheme-correct counting per network's own unit, alt text on every surface that supports it, first comment + up to 10 scheduled comments, link/UTM insertion, mentions/tagging, preview per network, per-network required-field branches (TikTok's mandatory disclosure UI is a *dedicated branch*, not a config toggle — `06 §10.2`) | P |
| A2 | **Calendar & planners** | Drag-drop calendar, week/month/list/grid views, filters by status/label/network/node, Instagram grid preview, TikTok planner, calendar notes, CLDR-correct first-day-of-week and weekend shading, dual-time rendering | P+E |
| A3 | **Queues & recycling** | Time-slot queues with labelled slots and four label namespaces, categories owning their own schedule, evergreen recycling with max-reuse + interval + expiry **and incremental-impression ROI attribution** (a Vista *strength* to match, not a gap), RSS/Smart Publishing with first-import guard | P |
| A4 | **Bulk operations** | CSV import with arbitrary column order ≥500 rows, bulk edit, bulk re-slot, bulk move-to-draft, bulk delete with an undo window | P+E |
| A5 | **Publishing Hold & Crisis Mode** | The `PublishingHold` object, per-window policy, restore review queue, crisis preset, recurring blackout windows | **E — differentiator 1** |
| A6 | **Reminder & assisted publish** | Device-targeted routing, never-drop-the-slot semantics, confirmation loop, per-network caption transforms at handoff, honest capability matrix | **E — differentiator 3** |
| A7 | **Publish verification & reliability ledger** | Pre-flight validation, typed errors, lateness budget, idempotency, authenticated read-back reconciliation, `PUBLISHED_THEN_REMOVED`, per-tenant reliability ledger | **E — differentiator 8** |

#### Family B — Assets & Rights

| # | Module | Contents | Class |
|---|---|---|---|
| B1 | **Media library** | Folders, labels, alt text, ≥2 GB files, node-scoped restrictions, perceptual dedupe, cloud sync (Drive/OneDrive/Dropbox), Canva, stock providers | P |
| B2 | **Ideas / content library** | Folders, labels, notes, convert-to-post, prompt library | P |
| B3 | **Rights & usage ledger** | Structured grant objects, consent-terms snapshot, whitelisting authorisations as expiring credentials, live-permission→live-spend join, override record | **E — differentiator 9** |
| B4 | **Provenance & AI labelling** | AI-generated flags, model/version/prompt-hash lineage, per-network AI-label propagation where the API exists, C2PA *preservation through transcode* | E (narrowed) |
| B5 | **Transcode & rendition service** | Per-network renditions from one master, codec/aspect/duration normalisation, thumbnail extraction, long→short clip extraction | I |

#### Family C — Engage

| # | Module | Contents | Class |
|---|---|---|---|
| C1 | **Unified inbox** | Comments, DMs, mentions, tags, shares, reviews, ad/dark-post comments, assignment, labels, saved replies + groups, macros, sentiment with rationale, moderation (hide/delete/like/block where the API exists — and *only* where it exists) | P+E |
| C2 | **Coverage & SLA** | SLA as a managed object, breach-*before*-breach alerts, escalation ladders, SLA-based routing, timezone-aware duty roster, handover digest, per-channel SLA floor | **E — differentiator 10** |
| C3 | **Send-eligibility engine** | The two-clock Instagram messaging state machine, per-network window semantics, template paths | **E — differentiator 10** |
| C4 | **Automation rules** | DM/comment/review triggers × conditions × actions, AI dynamic reply, all gated by the autonomy kernel | P |
| C5 | **Reviews & reputation** | Multi-source review ingestion, reply where the API permits, deep-link where it does not, review-request campaigns (email/SMS/QR/widget) **excluding** anything that constitutes review gating | P+E |

#### Family D — Measure

| # | Module | Contents | Class |
|---|---|---|---|
| D1 | **Metric engine** | Three-layer model (raw/canonical/derived), comparability classes, four engagement-rate definitions with the formula exposed, `followers_at_post_time` snapshotting | P+E |
| D2 | **Reports & delivery** | Full report catalogue, custom templates, white-label PDFs, scheduled delivery, share links with expiry/password, **custom calculated metrics formula builder** | P+E |
| D3 | **Warehouse-native layer** | Iceberg tables the customer owns, dbt package, Snowflake Native App, BigQuery Analytics Hub listing, Delta Share, conformed metric SQL views, row-level mention export, reverse-ETL hooks | **E — the largest gap in the corpus** |
| D4 | **Attribution** | Owned shortener, `utm_content = post_id` auto-tagging, per-message unique link IDs, server-side conversion APIs behind one internal event schema, self-reported attribution alongside click attribution | P+E |
| D5 | **Benchmarks & competitors** | Fleet-derived percentile benchmarks with k-anonymity, public-profile panel, competitor tracking across ≥6 networks | P+E |

#### Family E — Intelligence

| # | Module | Contents | Class |
|---|---|---|---|
| E1 | **Listening** | Tiered coverage (L0–L3) with **per-source coverage class and quota meter visible on every result set**, versioned queries, Boolean+proximity+regex query language, backfill where legal | P+E |
| E2 | **Crisis & anomaly detection** | Composite scoring, burst detection, alert dedupe/state, backtest onboarding, and the *proposal* path into A5 | E |
| E3 | **Experimentation** | Fleet-wide hierarchical creative-feature model, multi-location randomised trials with MDE disclosure, exploration scheduler | **E — differentiator 12** |
| E4 | **Prediction & optimisation** | Cold-start best-time model (hierarchical pooling, not 90-post minimum), creative-fatigue/novelty scoring, calibrated engagement prediction with published reliability | E |

#### Family F — Govern

| # | Module | Contents | Class |
|---|---|---|---|
| F1 | **Hierarchy & permissions** | The node tree, per-node role grants, locked templates with editable zones enforced by publish-time diff, merge-field substitution, compliance roll-up ("which of my 340 locations are dark") | **E — differentiator 5** |
| F2 | **Approvals routing** | SLA ladders, digests, OOO delegation, real Slack + Teams apps with interactive decisions, then the conditions/quorum rules engine, immutable approval records bound to content version hash and SSO identity | **E — differentiator 6** |
| F3 | **Autonomy kernel** | Server-side write safety for MCP/API, shadow mode with agreement rate, per-tenant exportable AI compliance report, policy objects, decision traces | **E — differentiator 11** |
| F4 | **Audit & compliance** | Immutable decision skeleton + erasable content payload, DSAR console, retention engine, data-use register, archive journalling to Smarsh/Global Relay/Proofpoint/Hearsay | E |
| F5 | **Connection health** | Proactive introspection, T-14/T-3 warnings for *scheduled* expiries, daily liveness probe for unpredictable revocation, batched repair links, single-writer refresh | **E — differentiator 4** |
| F6 | **Client & employee offboarding** | The single audited revocation transaction | **E — differentiator 2** |

#### Family G — Grow

| # | Module | Contents | Class |
|---|---|---|---|
| G1 | **Link-in-bio** | Custom domain + SSL, blocks, embeds, QR, analytics, competitor import | P |
| G2 | **Employee advocacy** | Curation, leaderboard with EMV, badges, Slack alerts, advocacy report | P |
| G3 | **Paid amplification** | Ad account connect, boost configurations, dark posts, paid-vs-organic reporting, whitelisting/Spark auth redemption | P |
| G4 | **Commerce & creator** | Product tagging, creator/UGC contact graph, contract references — one contact graph, one asset ledger, one codebase | E |
| G5 | **Migration engine** | Vendor CSV parsers, **platform re-fetch backfill**, bulk OAuth wizard with per-network troubleshooting, Boolean query translator, side-by-side reconciliation report | **E — the switcher weapon** |

#### Family H — Platform

| # | Module | Contents | Class |
|---|---|---|---|
| H1 | **Public API + webhooks** | Self-serve, no sales gate, OAuth2 + PKCE, scoped tokens, per-tenant rate budget | P+E |
| H2 | **MCP server (outbound)** | Tool surface mirroring the API, dry-run default, propose→confirm handshake | P+E |
| H3 | **Mobile apps** | iOS + Android: publishing, inbox, approvals, AI, and the reminder-publish runtime | P |
| H4 | **Integrations** | Zapier, Make, n8n node, Pipedream, Slack, Teams, Google Analytics, CRM (HubSpot first, then Salesforce) | P+E |
| H5 | **Admin & support console** | Impersonation with justification + tenant-visible audit + time limit, two-person approval for bulk export | I |

### 2.2 Parity map

The 75-item checklist in `01 §30` maps onto the modules above as follows. Nothing in that
checklist is unallocated.

| Checklist items | Module | Note |
|---|---|---|
| 1–8, 69, 70, 71 | A1, A3, A4 | TikTok/IG required-field branches are separate work items, not composer config |
| 4, 5, 68 | A2, D2, F1 | Shared-calendar link is a *share-link primitive* (§9.6) reused by reports and approvals |
| 9, 10 | B1 | |
| 11, 12 | B2, A1 | |
| 13 | D4 | Per-message unique link IDs are the attribution primitive, not a link feature |
| 14 | G1 | |
| 15, 16, 19 | F2 | 16 is the exceed item |
| 17, 18, 52 | F1 | Profile connect links and repair links are the same primitive (§7.4) |
| 20–28 | C1, C4 | 24/25/26 exceed, scoped to where the API exists |
| 27 | C2 | |
| 29, 30, 31, 32 | C5 | 31/32 exceed; review *gating* is prohibited and must not be built |
| 33–36 | E1 | 34/35 exceed |
| 37–42 | D1, D2, D5 | 40/41 exceed |
| 43, 44 | G3 | |
| 45–49 | §8 | |
| 50 | G2 | |
| 51, 53 | F1, §9.6 | 53 (per-client billing) exceed |
| 54, 55 | H4 | |
| 56–60 | H1, H2, F3 | 58/60 exceed; 60 is the P0-EXCEED write-safety item |
| 61, 62 | H3 | |
| 63–67 | §9 | 64/65/66 exceed |
| 72–75 | pricing + onboarding | 75 (discoverability) is a product-design commitment, not a module: command palette, activation journeys, "you're not using X" nudges |

### 2.3 The differentiators, in their narrowed form

Each verified differentiator survived adversarial review only in a specific, narrowed shape.
This table records what is actually being built, and — as importantly — what is being
*declined*. The architecture serves the middle column, not the original claim.

| # | Differentiator | **Build this** | **Do not build / do not claim** |
|---|---|---|---|
| 1 | **Crisis hold** (§5.6) | Composite hold object with reason + audit + **restore review queue with bulk re-slot** (the strongest single element and the best demo moment); per-window policy choice among skip / defer-next-slot / defer-past-window; **label scoping that fails closed on unlabeled content** with an explicit service-status allowlist; crisis preset that also freezes DM automations, evergreen recycling and boost triggers and flips the inbox to triage; recurring blackout windows; **mandatory reconciliation of posts held on Meta's servers via `scheduled_publish_time`, surfacing partial-hold failure loudly** | Any "nobody has a pause switch" claim — Buffer has had per-channel Pause Queue with automatic defer-forward for a decade at entry pricing; the atomic pause is commodity. Any standalone premium price. Cross-platform mention-velocity triggering before enterprise ARR funds X/Reddit data. |
| 2 | **Offboarding** (§9.6) | **"Remove client" as one audited transaction**: real upstream OAuth revocation (not a local row delete), invalidation of every outstanding report/calendar/approval share link, removal of client-side portal users, rescinding white-label domain/CNAME, one immutable audit record with operator + timestamp + itemised revocation list. Ships inside the agency/white-label tier. | The viral public exit-pack link (violates platform rules #2/#4/#5). "Deletion certificate" marketing without the KMS scheduled-deletion-window asterisk and the aggregates/audit/billing carve-outs. Attribution-preserving deactivation as a *product* — it is a property of the audit log we already owe, and incumbents already do it. |
| 3 | **Reminder publish** (§3.6) | **Never-drop-the-slot semantics** — offline queue, re-notify on reconnect, escalation ladder, missed-post digest; device-targeted routing wired to a **confirmation loop that reconciles the calendar**; per-network caption transforms applied at handoff; the honest capability matrix. Scoped to IG Stories-with-stickers, IG personal, and TikTok creative-layer formats. | "Media already on device and caption in clipboard at 9:00" — iOS does not guarantee silent-push delivery, caps it at 2–3/hour with a 30s budget, and no app can foreground itself or write the clipboard at a scheduled minute. The realistic gain is **one tap and a few seconds**. "4–6 weeks unlocks 10 networks" coverage inflation. TikTok send-to-inbox as a differentiator (table stakes). Manual metric capture in v1 (near-zero adoption, contaminates metric provenance). |
| 4 | **Connection health** (§7.4) | Proactive introspection; **T-14/T-3 warnings restricted strictly to *scheduled* expiries** (LinkedIn 60d, Meta `data_access_expires_at`, TikTok 365d, Pinterest 30d); **daily read-only identity probe** for unpredictable revocation, marketed as "we catch it before your post does, not before it happens"; single-writer refresh behind a per-connection distributed lock; **batched** repair links. Funded from the reliability budget; **never tier-gated**. | "Incremental re-consent" as a capability — only Google supports true incremental auth; ship "early scope-delta detection triggering a full re-auth link before publish time". A health check built on speculative refresh — on X and TikTok the refresh token is single-use and rotating, so that *manufactures* the orphaning failure. "#1 churn cause" (it is 5%, rank 8 of 8). Published aggregate reliability numbers as a competitive argument. |
| 5 | **Hierarchy** (§4.2) | The node tree as a first-class object with permissions, approvals, reporting, timezone and policy all resolving through it; locked templates with editable zones enforced at publish time by a **diff check**; per-level approval rules; per-location merge fields; compliance roll-up. Target the **5–75 location band** and, equally, **agencies** — same data model, warmer buyer, self-serve reachable. | "Abandoned segment" framing before auditing SOCi, Rallio, Birdeye, Uberall, Reputation, Chatmeter, Hearsay, Denim, Promoboxx, Tiger Pistol, Evocalize, BrandMuscle, Ansira — the corpus has zero mentions of SOCi. Listings syndication (a publisher-data licensing cost floor, not engineering). Yelp/TripAdvisor review response (no owner OAuth, no response API). Per-location timezone and merge fields as "moat" — they are days of work. |
| 6 | **Approvals routing** (§6.4) | **Time-and-place first**: SLA ladders, escalation, digest batching, OOO delegation, real interactive Slack **and Teams** apps. Rules engine second, with a small closed condition vocabulary plus templates. Approval record bound to an **immutable content version hash**, reviewer identity attested via **SSO** not a raw Slack user ID, and **exported/journalled into the customer's existing archive of record**. **Free reviewer/approver seat class + decision-by-link for external clients.** | "Every vendor ships linear chains" (false). Standalone wedge positioning — nobody switches suites for an approvals engine. EU AI Act as the driver — the binding driver is FINRA 2210 principal pre-approval / SEC 206(4)-1. A general-purpose rule builder. |
| 7 | **Time correctness** (§5.1) | `(wall-clock + IANA)` storage with dispatch-time resolution and an automated tzdb pipeline with staleness alerts; **timezone on the profile with a group default** plus "publish at 9am local per profile"; dual-time rendering in the composer; CLDR `weekData` for first-day and weekend; **one generic recurring blackout-window primitive** that subsumes Fri–Sat weekends, Friday prayers, Shabbat and Iftar *and* doubles as the hold mechanism. Ramadan/Eid campaign overlay with explicit ±1-day country variance. | Persian calendar (Iran + Afghanistan are sanctions-blocked; zero addressable revenue). Hebrew sunset-to-nightfall interval modelling (contested halachic definitions; item 5 serves the need at 2% of cost). Buddhist/ROC/Japanese-era as "features" (one-line `Intl.DateTimeFormat` options — implement silently). Hijri *date entry*. The "inverted heatmap" argument (best-time engines are computed from observed engagement, so a Gulf heatmap is already correct; only the shading is wrong). Any claim of category-wide absence of per-profile timezone. |
| 8 | **Publish verification** (§5.7) | **Authenticated read-back reconciliation** — re-fetch via the same API that created the post (Reddit `/api/info` → `removed_by_category`/`banned_by`/`approved` at +1m/+10m/+1h/+24h; Meta media-node GET; TikTok status/fetch; X compliance-job events) and diff against expected state, yielding `PUBLISHED_THEN_REMOVED`. Where no read-back exists, **say so in the UI**. A **general destination-rules engine** built from an accumulated observed-failure corpus. A **contractual SLA with service credits** (a named procurement blocker) and a **per-tenant** reliability ledger. | Logged-out verification (scraping). "First to do pre-flight" — Reddit `post_requirements` and TikTok `creator_info` are table stakes. A public aggregate p95 page (a hostage you hand to competitors, and it must keep publishing during a Meta outage). Positioning it as the acquisition wedge. |
| 9 | **Rights ledger** (§4.7) | A **live-permission-to-live-spend ledger**: the join between an expiring grant and the ad groups, gallery slots and scheduled posts that depend on it. Enforce **only over rights the system itself originated**; imported PDFs attach as explicitly "unverified rights". **Per-rights-class policy** — hard block on paid promotion and gallery serving, warn-with-logged-override on organic. The sellable primitive is the **override record**, not the block. Sharpest wedge: whitelisting-expiry → live-ad-dependency alert with 7-day lead and auto-pause-with-confirmation. | "A rights ledger that blocks the publish" as a category claim — AEM, Bynder, Brandfolder, Aprimo, FADEL, Rightsline, CrowdRiff exist. C2PA *writing* (generators already sign, platforms strip or re-sign — the honest feature is preservation through transcode). AI-label propagation as a differentiator (OSS tools already set TikTok `is_aigc` and YouTube `containsSyntheticMedia`; Meta exposes no API field). Music detection. Pitching legal as the buyer — legal is a veto, not a budget. |
| 10 | **Coverage / SLA** (§7) | SLA as a managed object; the **timezone-aware handover digest** (no competitor evidence in twelve dossiers — this is the demo moment); the IG send-eligibility state machine **spec'd correctly as two clocks**: (a) DM window = 24h from last user *message*, extendable to 7 days via `HUMAN_AGENT`; (b) comment→private-reply = **one** reply per comment within 7 days, a separate one-shot path — **a comment does not reset the DM window**. Three states: "can send anything" / "human-agent window, support content only" / "closed, template path only". **Publish a per-channel SLA floor derived from actual detection latency** and refuse to let a customer configure a 1-hour SLA on a channel polled every 6 hours. | "Ad-comment moderation is first-class only at Agorapulse" (Statusbrew and NapoleonCat are rule-based ad-moderation specialists; NapoleonCat got there first). Agent capacity/concurrency before PMF. A WFM product — rosters are a thin input (who is on shift, in what timezone), not scheduling/forecasting/adherence. "Block a user" in the headline (Facebook Pages only; Instagram has no block endpoint). "The largest functional divide in the market" — it is a price and packaging divide. |
| 11 | **Autonomy kernel** (§8.6) | Three unclaimed pieces only: **(i) MCP/API write-safety enforced server-side** — dry-run by default, propose→confirm token handshake, scoped per-brand agent tokens, publish and spend caps a headless agent cannot argue with (P0-EXCEED, cheap, no commercial vendor has it); **(ii) shadow mode with a published agreement rate** (no commercial or OSS precedent found); **(iii) a per-tenant exportable AI compliance report** (AI inventory, disclosure config, approval records, model providers and roles, provenance). Policy objects and decision traces ship as competent **table stakes**. Trace split into an immutable non-personal **decision skeleton** plus an erasable, tombstoned **content payload**. Replay QA seeded with a **curated synthetic corpus per vertical**. | "Nobody has built the evaluator" — Sprinklr shipped Autonomous Evaluation and Agent QA. The CISO/enterprise framing — the buyer who has this pain at a self-serve price is the agency or franchise operator with direct client liability. "An agent hallucination is a live brand post" — restate as "client-side consent is advisory, unenforceable, and absent for headless agents, so the gate must live on the server". |
| 12 | **Experimentation** (§8.7) | **Mechanism 2 only**: multi-location randomised trials, sold to **franchise/multi-location, not "agencies"** (an agency's 5–200 client brands are not an exchangeable population — a creative variant is not even applicable across two unrelated clients). Eligibility gate of **≥30 actively-posting comparable locations**; **crossover/within-location designs**, not parallel 50-vs-50 (parallel at n=50 only detects ~45% lift). **Arms = creative FEATURES** (hook archetype, format, length, CTA presence, face-in-thumbnail) in a hierarchical model pooled across the whole fleet with per-account partial pooling. **MDE reported before the test runs.** Anti-duplication engineering from day one: per-location token substitution, staggered windows, rate shaping — never byte-identical creative to 50 accounts through one app ID. | The single-account queue-slot bandit as a headline (at <200 lifetime posts and CV≈0.8 it cannot resolve realistic effects) — keep sequential allocation only as an **exploration scheduler** that removes send-time selection bias. The paid bridge as an "unbiased estimator" — it is a *paid-audience* signal correlated with organic quality, an optional add-on, and must not gate the core product on 8–12 week `ads_management` approval. |

### 2.4 How the modules compose — three worked traces

**Trace 1 — a scheduled post, from intent to proof.**
`A1 Composer` resolves the target set through `F1 Hierarchy` (which nodes may this user publish
to?) → `A7` pre-flight validates against the adapter's **capability descriptor** and
**destination rules**, including a `creator_info` call for TikTok and a `post_requirements` call
for Reddit → `B3 Rights` checks every attached asset's grant class and blocks or warns per
policy → `F2 Approvals` evaluates routing conditions and, if required, emits interactive cards
into Slack/Teams and binds the decision to the content version hash → `A3 Queues` assigns a
slot in `(wall-clock, IANA)` → at T−60s the `SCHEDULE` service **reserves rate-limit capacity**
→ `A5 Holds` is consulted as the final gate → the adapter publishes with an idempotency key →
`A7` reconciles by authenticated read-back at +1m/+10m/+1h/+24h → `D1` begins the decaying
metric-collection schedule → every step writes to `F4 Audit`.

**Trace 2 — a crisis, from signal to restore.**
`E2 Anomaly` detects negative-sentiment velocity on **owned-channel comments and DMs only** →
raises a *proposal*, not an action → a human confirms in-app or from the Slack card → `A5`
creates a `PublishingHold` scoped to `brand=X, label≠service-status`, policy
`defer-past-window`, with the crisis preset also suspending `C4 Automation`, `A3 Recycling`
and `G3 Boost triggers`, flipping `C1 Inbox` to triage and pinning the banner → the
`SCHEDULE` service marks every affected target `HELD`, and for targets already handed to Meta
with a `scheduled_publish_time` it issues a delete-or-unschedule and **raises a loud partial-hold
failure if the platform refuses** → when the hold lifts, the **restore review queue** shows
exactly what was caught and offers bulk re-slot → `F4` holds the compliance record of what was
held, by whom, and what it caught.

**Trace 3 — a client leaves.**
`F6 Offboarding` opens a single transaction → enumerates every connection under the node
subtree → calls each adapter's `revoke()` for **upstream** revocation → destroys the
connection DEKs → invalidates every outstanding share link issued under that subtree (reports,
calendars, approval links, repair links) → removes client-side portal users → rescinds the
white-label CNAME → offers the account owner an **authenticated, expiring, one-time export**
generated *while the connections are still live* → emits one immutable audit record itemising
every revocation → and, on contract end rather than client removal, schedules the tenant KEK
for destruction with the KMS window documented as the deletion SLA bound.

---

## 3. The universal platform adapter

### 3.1 The problem, stated precisely

Sixty-plus networks disagree on almost everything: how they authenticate, whether publishing is
synchronous, whether media is pushed or pulled, how text is counted, whether a post can be
edited, whether the platform will schedule for you, how rate limits are expressed, whether
errors arrive as HTTP status codes or as `200 OK` with an error envelope, and whether the
platform will even tell you the post was removed thirty seconds after it accepted it.

Three prior art sources converge on the same answer and it is worth taking seriously:

- `07 §3` collapses ~70 platforms into **nine integration archetypes** — "build nine base
  classes; everything else is configuration plus a content mapper."
- `08 §14.2` identifies **four publishing modes** — `SYNC`, `NATIVE_SCHEDULED`,
  `ASYNC_REVIEWED`, `REMINDER` — and notes that most schedulers model only the first, which
  produces exactly the bugs that destroy trust: double-posting when a native-scheduled post is
  also fired locally, treating an async submission as success, silently swallowing a
  content-review rejection.
- `05 §4.1.2` extracts the **three-state pending model** (`pending` → `ready` → `completed`)
  from the reference OSS implementation and calls it "the single most important design lesson
  in this codebase."

This design takes all three and adds the two things none of them have: a **capability
negotiation** step that is explicit rather than implicit, and a **graceful degradation ladder**
that ends in reminder-publish rather than in an error.

### 3.2 The layer cake

An adapter is not one object. It is five layers, only the innermost of which is bespoke per
network — which is what makes network #61 a description rather than a project.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ L5  CAPABILITY DESCRIPTOR        pure data · versioned · dated · signed       │
│     formats, limits, counting unit, features, quotas, retention, cost model   │
│     → drives the composer UI, the validator, the scheduler, the analytics     │
│       retention policy, and the public capability matrix. ONE source.         │
├──────────────────────────────────────────────────────────────────────────────┤
│ L4  DESTINATION RULES ENGINE     data + live probes                           │
│     Reddit post_requirements/flair · TikTok creator_info · GBP post rules ·   │
│     Mastodon per-instance max_chars · LinkedIn page admin state ·             │
│     + the OBSERVED-FAILURE COROLLARY for networks with no rules endpoint      │
├──────────────────────────────────────────────────────────────────────────────┤
│ L3  ARCHETYPE BASE CLASS         nine of them (07 §3)                         │
│     A single-secret · B oauth2 · C instance-scoped dynamic registration ·     │
│     D bot identity · E asymmetric-JWT · F BSP-mediated · G feed-in/out ·      │
│     H read-only review ingestion · I no-API assisted                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ L2  NETWORK IMPLEMENTATION       the only bespoke code                        │
│     HTTP calls, payload shapes, pagination, the platform's own error strings  │
├──────────────────────────────────────────────────────────────────────────────┤
│ L1  TRANSPORT                    one hardened client for all adapters         │
│     SSRF guard · DNS pin · redirect revalidation · size caps · timeouts ·     │
│     no credential forwarding across hosts · per-network circuit breaker ·     │
│     rate-limit budget enforcement · request/response recording for tests      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Nothing above L5 knows what an Instagram container id is. Nothing above L4 knows that Reddit
needs a flair. Nothing above L3 knows that Mastodon requires per-host client registration.

### 3.3 The capability descriptor (L5)

The descriptor is **data, not code**: a versioned document per `(network, format)` stored in a
config repository, deployed independently of application releases, and carrying its own
provenance. The existing `packages/adapters/src/capabilities.ts` already has the right shape —
`verifiedOn` and `sources` on every descriptor is exactly the discipline required, because
"platform APIs in this category change without much notice, so a stale descriptor is a
liability and its age should be visible."

Extensions required beyond what exists today:

```ts
interface PlatformCapabilities {
  network: NetworkId;
  apiVersion: string;                    // per-integration config with a migration flag (06 §12.1)

  // --- how content reaches the network ---
  formats: FormatCapability[];           // per PostFormat: delivery mode, text, media, features
  publishMode: 'sync' | 'async_poll' | 'native_scheduled' | 'async_reviewed' | 'reminder';
  idempotency: 'platform_header'         // Mastodon Idempotency-Key — a rare gift
             | 'read_back_check'         // Reddit: check /user/{me}/submitted before retry
             | 'local_lock_only';        // Telegram, Discord webhooks
  nativeSchedule: false | { minLead: Duration; maxLead: Duration; cancellable: boolean };

  // --- how it counts and renders ---
  textCounting: 'chars' | 'graphemes' | 'utf16' | 'bytes' | 'x_weighted';
  richText: 'none'|'markdown'|'html'|'facets'|'npf'|'blockkit'|'adaptivecard'|'ricos'|'lexical';

  // --- what it demands before it will accept a post ---
  requiredPreflightCalls: PreflightCall[];   // tiktok:creator_info, ig:content_publishing_limit,
                                             // reddit:post_requirements, x:usage/tweets
  requiredFields: FieldSpec[];               // TikTok's seven, YouTube's three
  requiresDedicatedComposerBranch: boolean;  // TikTok: true — an audit requirement, not a toggle

  // --- what it costs and how fast we may go ---
  limits: {
    model: 'fixed_window_header' | 'route_bucket' | 'points' | 'method_tier'
         | 'daily_cap' | 'session_window' | 'project_quota' | 'opaque';
    maxConcurrentPerConnection: number;   // Reddit 1 · Threads 2 · Bluesky 2 · Pinterest 3
                                          // Telegram 3 · GBP 3 · X 10 · YouTube 200 · FB 500
    postsPer24hPerAccount?: number;       // IG 100 · Threads 250 · TikTok ~15-30
    quotaUnitsPerOperation?: Record<string, number>;  // YouTube: videos.insert = 1600
    quotaScope: 'per_connection' | 'per_app' | 'per_project';  // <-- drives fair-share
    marginalCostUsd?: { perPost?: number; perPostWithLink?: number; perRead?: number };
  };

  // --- what we may keep ---
  retention: {
    rawEntityMaxDays: number | null;      // null = no stated limit; LinkedIn = assume shortest
    privateMetricsCaptureWindowDays?: number;  // X = 30, HARD, unbackfillable
    honourUpstreamDeletion: boolean;      // always true in practice
    deleteOnDisconnect: boolean;          // always true in practice
  };

  // --- what we can read back ---
  readBack: {
    postFetch: boolean;                   // can we GET the object we created?
    removalSignal: 'explicit_field' | 'absence' | 'compliance_stream' | 'none';
    // 'none' → the UI must say "removal detection unavailable on this network"
  };

  // --- provenance ---
  verifiedOn: string;                     // ISO date
  verifiedBy: 'doc' | 'probe' | 'production_observation';
  sources: string[];
  stalenessBudgetDays: number;            // exceeded → CI warns, dashboard flags, canary escalates
}
```

**Why `quotaScope` is load-bearing.** YouTube's 10,000 units/day is per *Google Cloud project*,
not per user — `videos.insert` at 1,600 units means **six video uploads per day for the entire
platform**. Google Business Profile's ~300 QPM is likewise project-scoped. A quota that is
project-scoped requires **fair-share scheduling with per-tenant allocation and priority
classes** (§5.4), and it makes "bring your own Google Cloud project" an architectural escape
hatch that must exist in the credential model from day one, not be bolted on later.

### 3.4 Capability negotiation

Negotiation happens at four distinct moments, and conflating them is the classic mistake.

| Moment | What is negotiated | Failure handling |
|---|---|---|
| **Connect** | `completeAuth` returns an **array** of connections — GBP returns hundreds of locations, Meta returns many Pages, Shopify a shop, Webflow sites and collections. Any adapter that assumes one connection per auth gets rewritten. Instance-scoped networks additionally probe software + version (`/api/v1/instance`, `/wp-json/`, `/ghost/api/admin/site/`) and store `instanceCapabilities` on the connection. | Distinct, actionable errors per known failure: instance requires app approval, registrations closed, behind Cloudflare, fork missing an endpoint, self-signed TLS, app-registration rate limit. |
| **Compose** | The union of `PlatformCapabilities` across the selected targets drives the UI: the counter switches unit per network, unsupported features grey out with the *reason*, and a target whose format is `reminder` shows an amber badge explaining why. | The composer never offers what the API cannot accept. This is the single highest-ROI feature in the corpus's judgment (`06 §19.2`). |
| **Schedule** | Live destination rules are fetched and cached with a short TTL — Reddit `post_requirements` + flair list, TikTok `creator_info` (nickname, avatar, `privacy_level_options`, `comment_disabled`/`duet_disabled`/`stitch_disabled`, `max_video_post_duration_sec`), IG `content_publishing_limit`, X `usage/tweets`. Quota headroom is checked. | Failures surface **while the human is still in the composer**, not at 09:00 on Tuesday. |
| **Dispatch** | Final gates: hold check, rate-limit reservation, token liveness, scope sufficiency, rights validity, and a re-check of any rule with a TTL shorter than the schedule horizon. | A gate failure at dispatch is a *typed* failure that either retries within the lateness budget or degrades (§3.5). |

### 3.5 The degradation ladder

This is what makes 60+ networks tractable. Instead of "supported / unsupported", every
`(network, format, connection)` triple resolves to a rung, and the product is honest about
which rung it is on.

```
RUNG 0  NATIVE AUTO-PUBLISH
        Full API support. We create the post. We verify it. We measure it.
            │  capability missing? feature unsupported on this format?
            ▼
RUNG 1  AUTO-PUBLISH WITH DECLARED DEGRADATION
        Publish succeeds but something the user asked for cannot be carried:
        no alt text on this network, link not clickable, hashtags moved to
        first comment, carousel truncated to the network max, sticker dropped.
        → The composer states each degradation BEFORE scheduling and the
          published record stores what was dropped.
            │  format fundamentally unreachable by API (IG Stories w/ stickers,
            ▼  TikTok creative layer, YouTube Community Posts, Snapchat organic)
RUNG 2  ASSISTED / REMINDER PUBLISH
        Slot is real, the calendar entry is real, the reporting is real —
        but a human taps publish. Never-drop-the-slot semantics apply (§3.6).
            │  no write path at all AND no human path (read-only sources)
            ▼
RUNG 3  MONITOR ONLY
        Reviews we can read but not answer (Yelp, TripAdvisor); listening-only
        sources. The UI says "read-only — {reason}".
            │  platform is dead, closed, or legally unavailable to us
            ▼
RUNG 4  DECLINED, WITH A REASON
        Published in the capability matrix as declined and why.
        e.g. "Snapchat has no organic posting API for anyone."
```

**The honesty pillar has a cost that must be stated.** An honest matrix labels ten networks
"assisted" and therefore yields a *shorter* checkmark column than competitors who collapse
"true API auto-publish" and "mobile push reminder" into one tick. That is a deliberate
positioning trade: the amber badge with a tooltip explaining *why* turns the biggest
limitation into evidence of expertise, but it will lose a naive feature-count bake-off. Price
and market accordingly; do not pretend it is free.

### 3.6 Reminder publish, specified against OS reality

The corpus's verifier note is the binding constraint here, and it kills two promises that
sound great and cannot be delivered: **iOS does not guarantee silent-push delivery, caps it at
roughly 2–3/hour with a 30-second execution budget, and no app can foreground itself or write
the clipboard at a scheduled minute.** Pre-staging and deep-linking are therefore *best-effort*,
not guarantees, and the realistic gain over Later/Planoly/Preview is **one tap and a few
seconds**, not a new experience.

What is genuinely unbuilt and OS-legal is the **reliability semantics**, and that is what gets
engineered:

| Property | Mechanism |
|---|---|
| **Never drop the slot** | The slot is a durable state machine (`ARMED → NOTIFIED → OPENED → CONFIRMED`/`MISSED`), not a notification. If the device is offline, the slot stays `ARMED` and re-notifies on reconnect. If the notification is dismissed, escalation fires at +10/+30/+120 min through push, then email, then Slack/Teams DM. A missed slot appears in a **missed-post digest**, never silently vanishes. |
| **Device-targeted routing** | A reminder is addressed to a *named device* registered by a named user, not broadcast to a team. Vista ships this and it is parity. |
| **Best-effort prefetch** | Media is prefetched into the app's container **when the OS permits** (background-refresh windows, opportunistic silent push), so the transfer at open time is usually instant. When it has not prefetched, the app downloads on open with a progress indicator and says so. No claim is made about the scheduled minute. |
| **One-tap transfer at open** | On notification open: media saved to camera roll (one permission-gated tap), caption copied with **per-network transforms already applied** — grapheme-correct counting, hashtag block placement, first-comment split — and the native composer opened via deep link where a recipe exists. |
| **Confirmation loop** | "Did it post?" writes back into the calendar. Where the user pastes a URL, the post is linked and, if the network has a read API, metrics reconcile from that point. Assisted posts are **visually distinct in the calendar and excluded from auto-published counts**. |
| **Deep links as a permanent QA line** | Every recipe is graded `C3-and-changing`. Deep links are re-tested on real devices **per app version**, as a standing budget item — not a one-time build. A broken recipe degrades to "copy and open the app" rather than failing. |

**Scope:** IG Stories-with-stickers, IG personal accounts, and TikTok creative-layer formats
first — that is where the volume and the pain are. Snapchat and the regional set (Xiaohongshu,
LINE VOOM, ShareChat, Kwai, Naver Blog, note, Ameba) ship as a cheap byproduct of the same
pipeline and are **never** presented as a coverage claim. Manual metric capture is out of v1:
adoption is near-zero and it contaminates metric provenance by mixing self-reported numbers
with API-sourced ones.

**Positioning:** retention and support-cost reduction inside the plan. It is invisible in a
trial and unrepresentable in a comparison table. Willingness-to-pay must be validated against
the consumer/prosumer prices Planoly/Plann/Preview command, not a B2B-suite premium. Before
building, install and instrument Later, Planoly, Plann, Preview and Buffer mobile and **time
the actual handoff** — the corpus never covered the mobile-first planner segment.

### 3.7 The destination-rules engine (L4)

Pre-flight against machine-readable rules is table stakes: Reddit exposes `post_requirements`
and `link_flair_v2` and OSS tools already use them; TikTok's `creator_info` call is *mandatory*
for audit approval. The unclaimed ground (`05 §11 G8`) is **generalising that pattern to
networks with no rules endpoint**.

```
                    ┌──────────────────────────────────────────────┐
   declared rules ──▶│                                              │
   (capability data) │      DESTINATION RULES ENGINE                │
                     │                                              │──▶ ValidationResult[]
   probed rules ────▶│  rule = { scope, predicate, severity,        │    (hard_fail | warn |
   (live API calls)  │           message, source, confidence,       │     info) with the
                     │           observedFailureCount, lastSeen }   │     platform's own
   observed rules ──▶│                                              │     wording preserved
   (failure corpus)  └──────────────────────────────────────────────┘
```

**The observed-failure corpus is the only defensible asset in this whole area**, because it
compounds with volume and cannot be copied from documentation. Its lifecycle:

1. Every `CONTENT_REJECTED` and `PLATFORM_POLICY` failure is written to a corpus row with the
   full (redacted) request shape, the platform's verbatim error, the network, the format, and
   the connection's characteristics.
2. A weekly offline job clusters these and proposes candidate rules
   ("posts to `page_category=X` with >4 hashtags rejected 63/64 times").
3. A human promotes a candidate to a `warn` rule; after N clean weeks a `warn` can be promoted
   to `hard_fail`. **Nothing is auto-promoted to `hard_fail`** — a false hard-fail blocks a
   customer's launch and that is a vendor-owned incident.
4. Rules carry `confidence` and `source`, and the composer shows "we've seen this rejected"
   differently from "the platform documents this".

This also feeds a **validator-gap alarm**: any `VALIDATION_FAILED` error class returned by a
platform means our pre-flight should have caught it and did not. Every such event is a bug
with an owner.

### 3.8 The adapter interface

The interface below is the union of what the three most complete public implementations agree
on, plus the additions this architecture requires (holds, read-back, revocation, cost).

```ts
interface PlatformAdapter {
  readonly network: NetworkId;
  readonly archetype: Archetype;                    // A..I
  capabilities(conn?: Connection): Promise<PlatformCapabilities>;   // may probe the instance

  // ---- auth ----
  beginAuth(ctx): Promise<{ redirectUrl: string } | { instructions: Instruction[] }>;
  completeAuth(ctx): Promise<Connection[]>;         // PLURAL. GBP returns hundreds.
  refresh(conn): Promise<Connection>;               // MUST persist rotated tokens atomically
  revoke(conn): Promise<RevocationReceipt>;         // UPSTREAM revocation, not a row delete
  probe(conn): Promise<HealthReport>;               // read-only identity call. NEVER a
                                                    // speculative refresh — on X and TikTok
                                                    // that manufactures token orphaning.

  // ---- destination discovery ----
  listDestinations(conn): Promise<Destination[]>;   // pages | boards | subreddits | locations
  destinationRules(conn, dest): Promise<Rule[]>;    // live probe where one exists

  // ---- publish: five verbs, because the domain has five ----
  validate(conn, draft): Promise<ValidationResult[]>;         // pre-flight, at compose time
  submit(conn, payload, idem): Promise<PublishHandle>;        // returns handle, not a post
  poll(conn, handle): Promise<'pending'|'ready'|'rejected'|'completed'>;
  finalize(conn, handle): Promise<PublishResult>;             // container → publish
  cancel?(conn, handle): Promise<void>;                       // native-scheduled unschedule
  comment?(conn, postId, text): Promise<CommentResult>;       // first-comment / comment chain

  // ---- verify ----
  readBack(conn, postId): Promise<PostState>;       // → live | removed | shadow-suppressed
                                                    //   | unavailable(reason)

  // ---- read ----
  fetchMetrics?(conn, ids, window): Promise<RawMetric[]>;     // Layer-1 raw, never normalised here
  fetchInbound?(conn, cursor?): Promise<Page<InboundItem>>;
  fetchReviews?(conn, cursor?): Promise<Page<Review>>;
  replyToReview?(conn, reviewId, body): Promise<void>;
  backfill?(conn, depth): AsyncIterable<RawMetric[]>;         // the migration weapon (§6.3)

  // ---- errors ----
  classify(err: unknown): TypedError;               // the ONLY place platform strings are read
}
```

**Five design rules that fall out of the research and are not negotiable:**

1. **`completeAuth` returns an array.** Adapters that assume one connection per auth get
   rewritten when GBP or Meta shows up.
2. **`validate` is separate from `submit`.** Reddit's flair, Mastodon's per-instance limits,
   GBP's post rules, Bluesky's grapheme count and Webflow's required fields all mean we can and
   should fail in the composer.
3. **`submit`/`poll`/`finalize` are separate.** A synchronous `post()` either blocks a worker
   for nine minutes or reports success before the post exists.
4. **`probe` is a read-only identity call, never a refresh.** Nine bespoke probes, budgeted
   against the *same* app quota used for publishing and analytics, and X's read cost is metered.
5. **`classify` is the sole reader of platform error strings.** Several networks return
   `200 OK` with an error envelope; string-matching on response bodies belongs in exactly one
   function per network and nowhere else.

### 3.9 The error taxonomy

One taxonomy, mapped by every adapter, because retry policy and user messaging depend on the
class rather than the platform.

| Class | Retry? | User sees | Notes |
|---|---|---|---|
| `TRANSIENT` | Yes, jittered, bounded | Nothing unless the lateness budget is exceeded | |
| `RATE_LIMITED(retryAfter)` | Yes, honour `Retry-After` | "Queued — {network} is rate-limiting us" with the ETA | Not counted as a failure in the SLA numerator |
| `QUOTA_EXHAUSTED(resetAt)` | No | The quota and its reset time | Distinct from rate limiting: waiting does not help within the window |
| `AUTH_EXPIRED` | Refresh once, then retry once | Silent if refresh works | |
| `AUTH_REVOKED` | No | "Reconnect {account}" + repair link | Drives `F5 Connection Health` |
| `SCOPE_MISSING(scope)` | No | Exactly which permission and how to grant it | |
| `CONTENT_REJECTED(reason)` | No | The platform's reason **verbatim plus translated** | Feeds the observed-failure corpus |
| `PLATFORM_POLICY` | No | Verbatim + translated | Feeds the corpus; excluded from our SLA |
| `VALIDATION_FAILED` | No | Should never reach the user | **Every occurrence is a pre-flight bug with an owner** |
| `PLAN_INSUFFICIENT` | No | "Your {network} plan does not include {capability}" | Real and frequent: Trustpilot tier, Vimeo tier, Flickr Pro, G2 |
| `DESTINATION_GONE` | No | "The page/board/subreddit no longer exists or we lost access" | |
| `PLATFORM_DOWN` | Yes, long backoff | Status banner | Excluded from our SLA numerator |
| `UNKNOWN` | Retry once, then alert | Generic | **Every `UNKNOWN` is a taxonomy bug**; alert an engineer |

Two terminal states that no generic taxonomy anticipates and both of which are required:

- **`PUBLISHED_THEN_REMOVED`** — the post succeeded and was then removed by AutoModerator, a
  policy takedown, or the platform silently. Discovered by read-back (§5.7), not by the
  publish call.
- **`PARTIALLY_PUBLISHED`** — carousels, X/Bluesky/Mastodon threads, and multi-destination
  Reddit crossposts can succeed for some items and fail for others. Reporting this as success
  is a lie the customer discovers in public.

**Chinese and Korean APIs return error messages in Chinese and Korean.** Store the raw message
*and* a translation; never show only the raw string to an English speaker, and never show only
the translation to a Chinese speaker.

### 3.10 Credential model

`CredentialKind` is a closed enum because each kind implies a different vault path, a different
rotation policy and a different threat profile.

| Kind | Members | Vault implication |
|---|---|---|
| `oauth2` | Most of tier 1 and 2 | Access + refresh under our client credentials |
| `oauth2_dynamic` | Mastodon and every Mastodon-API-compatible server, WordPress self-hosted, Ghost self-hosted | **Per-host client secrets** keyed by host, registered once per host and reused across users |
| `oauth1a` | Flickr, Tumblr legacy | Token + secret with HMAC signing |
| `api_key` | Dev.to, Hashnode, Yelp, Viber, Trustpilot partial | User-pasted; validate on save, detect revocation, never log |
| `bot_token` | Telegram, Discord, Slack, Viber, Teams | The app is the identity; the hard part is the invite ceremony and detecting removal |
| `webhook_url` | Discord, Teams Workflows, Slack incoming | **The URL is a bearer credential** — encrypt it, never log it, mask it in the UI |
| `basic_app_password` | WordPress self-hosted | |
| `jwt_asymmetric` | Apple App Store Connect / Business Connect / Podcasts, Ghost Admin | We hold a private key and mint short-lived JWTs at request time, never stored. `exp` ≤ 20 min (ASC) / 5 min (Ghost). **Materially higher security burden than OAuth tokens** — an ASC key with App Manager role can change app pricing. Onboarding must guide users to create least-privilege keys. |
| `service_account` | Google Play | GCP SA JSON |
| `byo_app` | Any network where the customer supplies their own developer app | **Must exist from the first commit.** Ayrshare's X BYO mandate is the first domino; retrofitting BYO touches auth, storage, encryption, rate limiting and billing simultaneously. Also the escape hatch for YouTube quota and GBP QPM. |
| `partner_managed` | RCS, Apple Messages for Business, Booking | Credentials live at a BSP |

### 3.11 Keeping 60+ fragile integrations honest

Covered in full in §11.3, but the adapter contract carries three obligations that make it
possible:

1. **Every adapter ships a conformance suite** it must pass — a shared test battery
   parameterised by capability descriptor, so a network that declares `editPost: true` is
   *tested* for edit, and a network that declares `removalSignal: 'explicit_field'` is tested
   for read-back detection.
2. **Every adapter ships recorded cassettes** of real request/response pairs, refreshed on a
   schedule, so a platform's shape change fails CI rather than production.
3. **Every capability descriptor carries a staleness budget.** Exceeding it flags the network
   on an internal dashboard and, at 2× the budget, downgrades the network's public status from
   `general_availability` to `limited_access` until re-verified. The existing
   `IntegrationStatus` enum is exactly right for this and should be wired to it.

---

## 4. Data model

### 4.1 Principles

| # | Principle | Consequence |
|---|---|---|
| 1 | **Every tenant-owned row carries `org_id` directly**, never through a join | RLS policies must be cheap and *obviously correct*. A policy reading one column on the row it protects is far harder to get wrong than one traversing two joins. Already established in `0001_core.sql`; extended to every new table. |
| 2 | **The hierarchy is a tree, and everything resolves through it** | Permissions, approvals, reporting, timezone, brand voice, policy, holds and locked templates all resolve by walking to the nearest ancestor that defines them. |
| 3 | **Raw platform data and derived aggregates live in different stores with different retention classes** | The binding constraint on a table is the strictest rule touching any column in it. Never one undifferentiated `post_metrics` table across platforms. |
| 4 | **Provenance and licence class are first-class columns, not metadata** | They drive retention, deletion propagation, export permission, and what may be joined with what. |
| 5 | **Every store that receives personal data registers a deletion handler at build time** | A store with no deletion handler **fails a CI check**. This is the only pattern that survives feature growth. |
| 6 | **Content is versioned and hashed** | The approval record binds to an immutable content version hash; the locked-template diff check compares versions; the audit trail references versions rather than mutable rows. |

### 4.2 Tenancy and the node tree

The corpus's containment model is `organization → profile group → social profile`. That is
correct for an SMB and **insufficient** for the two segments with the highest ACV. An agency
managing 5–200 client brands and a multi-unit operator managing 5–75 locations need the same
thing: an arbitrary-depth tree with per-node permissions, per-node policy inheritance and
roll-up reporting. Building the two-level version first means rebuilding both.

```
organization                     billing, plan, residency binding, tenant KEK
   └── workspace                 the isolation boundary a customer perceives; white-label unit
         └── node (tree)         brand │ region │ market │ client │ location │ project
               └── node …        arbitrary depth, materialised path for cheap subtree queries
                     └── social_profile      one connected account
```

`profile_group` in the existing schema becomes a `node` with `kind='brand'` — a rename plus a
tree, not a redesign, and it is the last moment at which that is true.

```sql
CREATE TABLE nodes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id    uuid NOT NULL REFERENCES workspaces(id)    ON DELETE CASCADE,
    parent_id       uuid REFERENCES nodes(id) ON DELETE RESTRICT,
    kind            node_kind NOT NULL,     -- brand|region|market|client|location|project
    name            text NOT NULL,
    -- Materialised path: '/root_uuid/child_uuid/…'. Subtree queries become a prefix scan,
    -- which is what makes "roll up 340 locations" a single index range rather than a
    -- recursive CTE per report.
    path            ltree NOT NULL,
    depth           smallint NOT NULL,
    -- Inheritable settings. NULL means "inherit from nearest ancestor that sets it".
    timezone        text,                   -- IANA; profile-level override exists too
    locale          text,
    brand_voice_id  uuid,
    policy_set_id   uuid,                   -- autonomy + approval + brand-safety policies
    external_ref    text,                   -- franchisee id, client code, store number
    merge_fields    jsonb NOT NULL DEFAULT '{}'::jsonb,   -- address, phone, offer, local imagery
    created_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT nodes_root_has_no_parent CHECK ((depth = 0) = (parent_id IS NULL))
);
CREATE INDEX nodes_path_gist ON nodes USING gist (path);
CREATE INDEX nodes_org_ws    ON nodes (organization_id, workspace_id) WHERE deleted_at IS NULL;
```

**Resolution rule.** For any inheritable setting `S` and node `N`, `resolve(S, N)` walks
`N.path` from the deepest segment upward and returns the first non-null value, falling back to
the workspace default. This one function serves timezone, brand voice, approval policy,
autonomy policy, brand safety, retention override, and locked-template lineage. Its result is
cached per `(node, setting, version)` and invalidated by a version counter on the workspace,
because it is on the hot path of every publish.

**Permissions.** A grant attaches a role to a `(user, node)` pair and applies to the entire
subtree unless a deeper grant overrides it. Absence of any grant means the node is *absent from
the user's dashboard*, not shown-and-locked.

```sql
CREATE TABLE node_grants (
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_id         uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    subject_kind    text NOT NULL,          -- 'user' | 'user_group' | 'agent' | 'api_client'
    subject_id      uuid NOT NULL,
    role_id         uuid NOT NULL REFERENCES roles(id),
    -- Seat class matters commercially: reviewers must be free or adoption dies on procurement.
    seat_class      seat_class NOT NULL DEFAULT 'full',  -- full | reviewer | client_portal | agent
    granted_by      uuid REFERENCES users(id),
    granted_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz,            -- time-boxed access for contractors and support
    PRIMARY KEY (node_id, subject_kind, subject_id)
);
```

The `seat_class` column is a **pricing mechanic, not a detail**. The value of an approvals
routing engine scales with reviewer count, and per-seat pricing taxes exactly that — agencies
share logins to avoid it, and at least one competitor won deals on approve-by-emailed-link with
no account at all. `reviewer` and `client_portal` seats are free or near-free by construction.

**Locked templates.** A template is a content version marked `locked` with an explicit set of
editable zones. A child node may create a derived post from it; at publish time a **diff check**
compares the derived content against the template outside the editable zones and rejects on
mismatch. The lock is enforced by code, not by a policy document. This plus per-node approval
overrides plus merge-field substitution plus the compliance roll-up is the whole franchise
product; per-location timezone and merge fields are days of work and are **table stakes, not
moat**.

### 4.3 Identity, roles, and the residency binding

```sql
CREATE TABLE organizations (
    id uuid PRIMARY KEY,
    ...
    -- Set at creation, immutable. Moving a tenant across regions is a migration with an
    -- explicit runbook, not an UPDATE.
    data_region     text NOT NULL,
    -- Which KMS key hierarchy protects this tenant. 'byok' points at a customer-held key.
    key_policy      text NOT NULL DEFAULT 'platform',   -- platform | byok | hyok
    kek_arn         text,
    -- Per-tenant, per-data-class retention with a compliance-mode override, because GDPR
    -- pushes retention down and FINRA/SEC push it up, and they reconcile per tenant.
    retention_profile_id uuid REFERENCES retention_profiles(id),
    compliance_mode text NOT NULL DEFAULT 'standard'    -- standard | finra | hipaa_adjacent
);
```

Roles are a fixed vocabulary of **capabilities** (not a free-form ACL), composed into named
roles per workspace. The vocabulary is deliberately small — around 60 capabilities such as
`content.publish`, `content.approve`, `connection.create`, `connection.revoke`, `inbox.reply`,
`inbox.moderate`, `report.share_external`, `billing.manage`, `audit.export`, `hold.apply`,
`autonomy.raise` — because a general-purpose ACL builder is configured once and never
understood.

### 4.4 Connections

Extends the existing `credentials` + `social_profiles` split, which is already correct in
keeping ciphertext out of tables ordinary queries touch.

```sql
CREATE TABLE connections (
    id                  uuid PRIMARY KEY,
    organization_id     uuid NOT NULL,
    workspace_id        uuid NOT NULL,
    node_id             uuid NOT NULL REFERENCES nodes(id),
    network             text NOT NULL,
    credential_kind     text NOT NULL,          -- §3.10
    -- Instance-scoped networks. The field most competitors omit, and the reason their
    -- Mastodon and WordPress support is bad.
    instance_url        text,
    instance_software   text,                   -- 'mastodon 4.3.2' | 'ghost 5.x' | 'wordpress 6.5'
    instance_caps       jsonb,
    -- Hierarchy on the platform side: GBP accounts→locations, Meta business→pages.
    parent_external_id  text,
    external_id         text NOT NULL,
    display_name        text NOT NULL,
    handle              text,
    -- Timezone lives on the PROFILE with a group default. This is the one genuinely sellable
    -- item in the time-correctness set, because incumbents sit at group/brand level.
    timezone            text,
    credential_id       uuid REFERENCES credentials(id),
    scopes              text[] NOT NULL DEFAULT '{}',
    scopes_required     text[] NOT NULL DEFAULT '{}',   -- drives scope-delta detection
    health              connection_health NOT NULL DEFAULT 'ok',
        -- ok | expiring_soon | scope_missing | reauth_required | revoked
        -- | insufficient_plan | quarantined
    health_detail       text,                   -- "Trustpilot plan lacks the Invitations API"
    expires_at          timestamptz,            -- scheduled expiry — drives T-14/T-3 ONLY
    refresh_after       timestamptz,            -- ~50% of TTL, jittered
    last_probed_at      timestamptz,
    probe_failures      smallint NOT NULL DEFAULT 0,
    api_version         text,                   -- per-integration, with a migration flag
    postable_from       timestamptz,            -- account-age warmup (Pinterest)
    connected_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, network, external_id)
);
```

`health='insufficient_plan'` is a real and frequent state and surfacing it precisely prevents a
class of support tickets competitors answer with "it's broken."

### 4.5 Content

Three levels, because one draft routinely becomes materially different posts per network, and
because the approval record must bind to something immutable.

```
post              the intent: one campaign-level idea, owned by a node
 └── variant      the per-network composition (text, media set, features, network-specific fields)
       └── target one (variant, connection) delivery, with its own schedule and state machine
```

```sql
CREATE TABLE posts (
    id, organization_id, workspace_id, node_id,
    campaign_id      uuid REFERENCES campaigns(id),
    -- Four independent label namespaces (parity with Vista): content pillar, campaign,
    -- internal workflow, and CONTENT CLASS. The last one is load-bearing for holds.
    labels           jsonb NOT NULL DEFAULT '{}'::jsonb,
    content_class    text,                 -- 'promotional' | 'service_status' | 'editorial' | NULL
    origin           text NOT NULL,        -- human | ai_assisted | ai_generated | recycled | rss
    template_id      uuid REFERENCES content_versions(id),  -- locked-template lineage
    status           post_status NOT NULL,
    created_by       uuid, created_at, updated_at, deleted_at
);

CREATE TABLE content_versions (
    id              uuid PRIMARY KEY,
    post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    variant_id      uuid,
    seq             integer NOT NULL,
    body            text NOT NULL DEFAULT '',
    fields          jsonb NOT NULL DEFAULT '{}'::jsonb,   -- title, link, first_comment, network extras
    media_ref       jsonb NOT NULL DEFAULT '[]'::jsonb,   -- ordered asset ids + per-target crops
    -- The hash the approval record binds to. An approval that does not bind to an immutable
    -- content hash is not a defensible principal approval under FINRA 2210.
    content_hash    bytea NOT NULL,
    authored_by     uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, seq)
);

CREATE TABLE post_targets (
    id, organization_id, post_id, variant_id, connection_id, network,
    content_version_id uuid NOT NULL REFERENCES content_versions(id),
    delivery        delivery_mode NOT NULL,      -- auto | assisted | native_scheduled
    -- THE TIME MODEL. Never a bare UTC instant. §5.1.
    scheduled_local timestamp NOT NULL,          -- wall-clock, no zone
    scheduled_zone  text NOT NULL,               -- IANA
    dst_policy      text NOT NULL DEFAULT 'compatible',  -- compatible|earlier|later|reject
    -- Materialised for the dispatcher's index only. Recomputed on every tzdb update.
    dispatch_at_utc timestamptz NOT NULL,
    tzdb_version    text NOT NULL,               -- which rules produced dispatch_at_utc
    state           target_state NOT NULL,       -- §5.3
    hold_id         uuid REFERENCES publishing_holds(id),
    lateness_budget interval NOT NULL DEFAULT '15 minutes',
    idempotency_key text NOT NULL,
    attempt         integer NOT NULL DEFAULT 0,
    external_post_id text, external_url text,
    -- Native-scheduled reconciliation: what the platform thinks it will do.
    platform_scheduled_at timestamptz,
    platform_handle text,
    failure_class   text, failure_detail jsonb,
    UNIQUE (post_id, connection_id)
);
```

**Why `dispatch_at_utc` is materialised but not authoritative.** The dispatcher needs a cheap
range index on a timestamp. But the *intent* is `(scheduled_local, scheduled_zone)`, and when
IANA ships a rules change, a background job recomputes `dispatch_at_utc` for every future
target whose zone was affected and records the new `tzdb_version`. A drift between
`tzdb_version` and the current tzdb on any future row is a **correctness alarm**, not a
cosmetic issue.

### 4.6 Publishing holds

```sql
CREATE TABLE publishing_holds (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    workspace_id    uuid NOT NULL,
    -- Scope is a union, evaluated as: does this target fall inside ANY active hold?
    scope_kind      text NOT NULL,   -- org|workspace|node_subtree|connection|content_class
    scope_ref       uuid,
    content_class_filter text[],     -- e.g. ['promotional'] — see fail-closed rule below
    -- Per-window policy. This choice is the differentiator, not the pause itself.
    policy          hold_policy NOT NULL,   -- skip | defer_next_slot | defer_past_window
    window_start    timestamptz NOT NULL,
    window_end      timestamptz,     -- NULL = open-ended, requires explicit lift
    recurrence      jsonb,           -- the generic recurring blackout primitive
    preset          text,            -- 'crisis' applies the compound suppression set
    reason          text NOT NULL,   -- mandatory. A hold with no reason is not auditable.
    created_by      uuid NOT NULL,
    lifted_by       uuid, lifted_at timestamptz,
    CONSTRAINT holds_reason_present CHECK (length(btrim(reason)) > 0)
);

CREATE TABLE hold_captures (          -- the RESTORE REVIEW QUEUE — the strongest single element
    hold_id         uuid NOT NULL REFERENCES publishing_holds(id) ON DELETE CASCADE,
    post_target_id  uuid NOT NULL REFERENCES post_targets(id) ON DELETE CASCADE,
    original_local  timestamp NOT NULL,
    original_zone   text NOT NULL,
    action_taken    text NOT NULL,   -- skipped | deferred_next_slot | deferred_past_window
    restored_to     timestamp,
    restored_at     timestamptz,
    -- Loud partial-hold failure. If the platform already holds this post server-side and
    -- refuses to unschedule it, this is NOT a success and must not be reported as one.
    platform_hold_result text NOT NULL DEFAULT 'not_applicable',
        -- not_applicable | unscheduled_ok | unschedule_failed | published_before_hold
    PRIMARY KEY (hold_id, post_target_id)
);
```

**Two engineering requirements without which this feature is actively dangerous:**

1. **Meta reconciliation.** Any target delegated to a platform's own scheduler
   (`scheduled_publish_time`, `publishAt`) is held on *their* servers, not ours. Applying a hold
   must call the platform's unschedule/delete path, record the result in
   `platform_hold_result`, and **surface partial-hold failure loudly** — a banner and a per-item
   badge in the restore queue, never a silent success. This is a strong secondary argument for
   self-dispatch as the default (§5.1).
2. **Label scoping fails closed.** When a hold specifies `content_class_filter`, **unlabeled
   content is held**, and only an explicit allowlist (typically `service_status`) is released.
   The inverse — releasing anything not explicitly marked promotional — means the first
   unlabeled post during a crisis is the one that goes out.

The **crisis preset** is a compound object, not a flag: it creates the hold, suspends
`automation_rules` in the scope, pauses evergreen recycling, disables boost triggers, switches
the inbox to triage view, posts a notice to the configured Slack/Teams channels, and pins an
in-app banner. Every one of those is a reversible, audited sub-action, and lifting the preset
restores each with a per-item confirmation of what was re-enabled.

### 4.7 Assets and the rights ledger

One asset ledger and one contact graph in one codebase. That is exactly the thing an
acquisition cannot produce, and it is the reason every incumbent — which acquired its
creator/UGC capability as a separate product with a separate data model — cannot enforce a
grant across surfaces it does not jointly own.

```sql
CREATE TABLE assets (
    id, organization_id, workspace_id, node_id,
    kind, storage_key, mime_type, bytes, width, height, duration_sec,
    alt_text, perceptual_hash, exact_hash,
    -- Provenance, first-class.
    origin          text NOT NULL,   -- upload|ai_generated|ugc_capture|stock|creator_delivery
    ai_model        text, ai_prompt_hash bytea, ai_generated_at timestamptz,
    -- C2PA: we PRESERVE credentials through transcode; we do not claim to sign.
    c2pa_present    boolean NOT NULL DEFAULT false,
    c2pa_preserved_through_transcode boolean,
    created_by, created_at, deleted_at
);

CREATE TABLE rights_grants (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    -- ENFORCEMENT POPULATION: only rights the system itself originated are enforceable.
    -- Imported PDFs and agency paperwork attach as 'unverified' and are never enforced.
    origination     text NOT NULL,   -- own_consent_capture | own_creator_contract
                                     -- | redeemed_spark_auth | redeemed_partnership_ad
                                     -- | imported_unverified
    grant_scope     text[] NOT NULL, -- organic | paid | web | print
    territories     text[],
    channels        text[],
    starts_at       timestamptz, expires_at timestamptz,
    model_release   boolean, music_licence_status text,
    creator_contact_id uuid, contract_ref text,
    -- The snapshot of the consent TERMS as they existed at the moment of consent.
    consent_terms_snapshot jsonb,
    -- For whitelisting: TikTok Spark auth codes expire at 7/30/60/365 days and silently kill
    -- live, scaling ads mid-flight. UNVERIFIED whether tt_video/authorize returns an expiry
    -- timestamp; if it does not, this is a CREATOR-ASSERTED duration and is labelled as such.
    expiry_source   text,            -- platform_asserted | creator_asserted | contract
    created_at, revoked_at
);

-- THE DIFFERENTIATOR: the join between an expiring grant and the live things depending on it.
CREATE TABLE rights_dependencies (
    grant_id        uuid NOT NULL REFERENCES rights_grants(id) ON DELETE CASCADE,
    dependent_kind  text NOT NULL,   -- ad_group | gallery_slot | scheduled_target | live_post
    dependent_ref   text NOT NULL,
    spend_per_day   numeric(12,2),   -- what stops if this lapses — the money case
    detected_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (grant_id, dependent_kind, dependent_ref)
);

CREATE TABLE rights_overrides (      -- the sellable primitive is the override record
    id, grant_id, dependent_ref, overridden_by uuid NOT NULL,
    justification text NOT NULL, created_at timestamptz NOT NULL
);
```

**Enforcement policy is per rights class, not a blanket block.** Hard block on paid promotion
and gallery serving; **warn-with-logged-override on organic**, always attributed and audited.
Hard-blocking on customer-supplied data that turns out stale is a vendor-owned incident, and
blocking asserts that we are the legal arbiter. The GTM follows from that: pitch the paid-media
and creator-programme owner on the money case — paid usage rights cost 3–10× organic, and a
lapsed authorisation kills a scaling ad mid-flight — and let legal ratify.

### 4.8 The metric model

Three layers, per `12 §17.2`, because a cross-network "total impressions" number is
arithmetically meaningless and every vendor publishes one anyway.

```
LAYER 1  RAW              per-network, exact platform field names, never altered,
                          partitioned by (source, dt), retention enforced per partition
      ▼   deterministic, versioned mapping functions with the mapping id stored on the row
LAYER 2  CANONICAL        cross-network metric with an explicit COMPARABILITY CLASS
                          A = genuinely comparable · B = directional only · C = network-only
      ▼   ratios computed ONLY within a class and within a network
LAYER 3  DERIVED          engagement rates (all four definitions, formula exposed in the UI),
                          growth, share of voice, benchmarks
```

```sql
-- Layer 1. One table PER SOURCE FAMILY, never one shared table — a shared table inherits
-- the union of every platform's restrictions.
CREATE TABLE metrics_raw_meta   ( ... ) PARTITION BY RANGE (dt);
CREATE TABLE metrics_raw_x      ( ... ) PARTITION BY RANGE (dt);
CREATE TABLE metrics_raw_linkedin ( ... ) PARTITION BY RANGE (dt);
-- columns: organization_id, connection_id, entity_kind, entity_id, metric_name_as_returned,
--          metric_value, dt, api_version, collected_at, raw_payload_ref, mapping_version

-- Layer 2.
CREATE TABLE metrics_canonical (
    organization_id, connection_id, network, entity_kind, entity_id,
    canonical_metric text NOT NULL,     -- served|reached|video_started|video_completed|
                                        -- watch_time_seconds|reactions|comments|shares|saves|
                                        -- link_clicks|profile_actions
    comparability    char(1) NOT NULL,  -- A | B | C
    value            numeric NOT NULL,
    dt               date NOT NULL,
    mapping_version  text NOT NULL,     -- provenance: which mapping produced this
    source_metric    text NOT NULL      -- what the platform actually called it
) PARTITION BY RANGE (dt);

-- Required for honest historical engagement rate. Computing historical ER against today's
-- follower count silently rewrites history every day — a bug present in a surprising number
-- of shipped products.
CREATE TABLE follower_snapshots (
    connection_id uuid, dt date, followers bigint, PRIMARY KEY (connection_id, dt)
);
```

**Non-negotiable capture rule.** X `non_public_metrics` and `organic_metrics` are available
only to the post owner and only for posts under 30 days old — impressions on a 31-day-old post
are gone forever, and backfill is impossible. This is captured by a **scheduled job, not an
on-demand fetch**, and it is the only irreversible data-loss risk in the analytics design.

### 4.9 Conversations

```sql
CREATE TABLE conversations (
    id, organization_id, workspace_id, node_id, connection_id, network,
    kind            text NOT NULL,   -- comment_thread | dm | mention | review | ad_comment | share
    external_ref    text NOT NULL,
    participant     jsonb NOT NULL,  -- platform user id, display name, follower count if known
    -- The SEND-ELIGIBILITY state machine. Two clocks, not one. §7.3.
    dm_window_expires_at        timestamptz,   -- 24h from last user MESSAGE
    human_agent_window_expires_at timestamptz, -- 7d, via HUMAN_AGENT tag
    private_reply_token         jsonb,         -- ONE reply per comment, within 7d of the comment
    send_state      text NOT NULL,  -- open | human_agent_only | closed_template_only | none
    -- SLA as a managed object, not a metric.
    sla_policy_id   uuid REFERENCES sla_policies(id),
    first_response_due_at  timestamptz,
    resolution_due_at      timestamptz,
    breach_state    text NOT NULL DEFAULT 'ok',  -- ok | approaching | breached | waived
    assignee_id     uuid, assignee_set_at timestamptz,
    labels          text[], sentiment numeric, sentiment_rationale text,
    status          text NOT NULL,  -- open | pending | resolved | spam
    -- Provenance and licence class drive retention and export permission.
    provenance      text NOT NULL,  -- first_party_api | aggregator | manual
    last_inbound_at timestamptz, last_outbound_at timestamptz
);
```

### 4.10 Mentions (listening)

One canonical `Mention` record from day one. Retro-fitting this is the single most expensive
mistake in listening engineering.

```
mention {
  mention_id, source, source_native_id,
  provenance_class,          -- owned | open_network | metered_api | licensed | aggregator
  licence_class,             -- what we may store, export, join and for how long
  coverage_class,            -- complete | sampled | quota_limited | unavailable  ← shown in UI
  author { id, handle, display, followers, verified },
  content { text, lang, media[] , ocr_text?, asr_text? },
  url, published_at, ingested_at,
  engagement { … }, parent_ref,
  brand_matches[], enrichment { sentiment, aspect_sentiment, emotion, entities, topics, embed_ref }
}
```

`coverage_class` on every record is what allows the UI to show, on every result set:
`Bluesky: complete · YouTube: complete · X: sampled (18% of your quota used) ·
Instagram: hashtag-limited (12/30 this week) · Facebook: unavailable — no public search API`.
That is more trustworthy, more useful and cheaper to operate than an opaque unified number, and
**nobody in the category ships it**.

### 4.11 Audit, decision traces, and the immutability/erasure conflict

The immutability promise and GDPR Art. 17 collide unless the record is split.

```sql
-- IMMUTABLE, NON-PERSONAL. Append-only, hash-chained, exportable, retained 7 years.
CREATE TABLE audit_skeleton (
    seq             bigserial PRIMARY KEY,
    organization_id uuid NOT NULL,
    occurred_at     timestamptz NOT NULL,
    actor_kind      text NOT NULL,     -- user | agent | api_client | system | support
    actor_ref       uuid,              -- pseudonymous; resolves via a separately-erasable map
    actor_identity_source text,        -- 'sso:okta' | 'password' | 'agent_token' — FINRA needs this
    action          text NOT NULL,
    subject_kind    text NOT NULL, subject_id uuid,
    node_path       ltree,
    outcome         text NOT NULL,
    content_hash    bytea,             -- binds to the immutable content version
    policy_version  text,
    payload_ref     uuid,              -- → audit_payload, which IS erasable
    prev_hash       bytea NOT NULL, this_hash bytea NOT NULL
);

-- ERASABLE, TOMBSTONED. Holds anything that could be personal data.
CREATE TABLE audit_payload (
    id uuid PRIMARY KEY, organization_id uuid NOT NULL,
    body jsonb, erased_at timestamptz, erasure_reason text
);
```

An agent action additionally writes a **decision trace** into `audit_payload`: inputs consulted,
policy evaluated, model + version + prompt hash, all candidates generated, the ranking function
that selected one, approver identity, and the reversal path. The trace is the *substrate*; the
sellable artifact is the per-tenant AI compliance report assembled from it (§8.6).

### 4.12 Multi-tenancy and isolation

Defence in depth, because encryption is necessary and insufficient — the more common real
failure is **authorization**, not cryptography.

| Layer | Control | Failure mode it stops |
|---|---|---|
| **1. Structural** | Postgres **row-level security** on every tenant table, with `org_id` set from a connection-scoped session variable that application code cannot forge. A data-access layer where an un-scoped query is *impossible to express*. Not "remember to add `WHERE org_id = ?`" — that fails eventually, and once is enough. | IDOR, missing filter, ORM footgun |
| **2. Cryptographic** | **AAD binds ciphertext to context** — `tenant_id \| connection_id \| platform \| key_version` as Additional Authenticated Data. A missed tenant filter becomes a *decryption failure* rather than a data leak. This is why AAD is worth the effort. | Cross-tenant ciphertext replay |
| **3. Key hierarchy** | Per-tenant KEK. Compromise of one grant yields one tenant, not all of them. EU KEK in EU KMS means US infrastructure cannot decrypt EU data even if it obtains the ciphertext — residency becomes **mechanical rather than policy**. | Blast radius; residency |
| **4. Physical** | Cell-based deployment (§10.3): tenants are assigned to cells, and a cell is a full vertical slice. Enterprise tenants may buy a dedicated cell. | Noisy neighbour; blast radius |
| **5. Test** | A property test generated **from the route table** so new endpoints are covered by default: tenant A's credentials, tenant B's object id, assert 403/404. Runs on every PR. | Regression on new endpoints |
| **6. Egress** | One hardened outbound client for all adapters with DNS pinning between resolve and connect, private-range denial, redirect re-validation, size caps, timeouts, and **no credential forwarding across hosts**. Egress from a dedicated isolated worker pool. | SSRF to metadata/KMS — a first-class threat because tier-2 requires server-side fetches of user-supplied hosts |
| **7. Human** | Support impersonation requires a justification string, is time-limited, and writes a **tenant-visible** audit entry. Bulk export requires two-person approval. | Insider misuse; the Mailchimp/Okta pattern |

### 4.13 Data classes and retention

Every column belongs to a data class, and the class drives retention, residency, export
permission, embedding eligibility and deletion handler registration. Retention is the
**strictest** of three inputs: platform ToS ceiling, legal floor/ceiling, tenant configuration.

| Class | Contents | Default retention | Driver |
|---|---|---|---|
| D1 credentials | Tokens, keys, webhook URLs | Life of connection; **immediate upstream revocation + deletion on disconnect** | Platform ToS |
| D2 tenant account | Org, users, billing | Contract + 7y for billing | Tax law |
| D3 content | Drafts, versions, assets, templates | Contract + 30–90d grace | Tenant preference |
| D4 audience | Commenters, DM senders, profiles | **90d rolling, tenant-adjustable downward only** | GDPR minimisation + platform terms |
| D5 metrics — identifiable | Per-entity metrics | Match the platform ceiling **per source partition** | Platform ToS |
| D5 metrics — aggregate | Anonymised roll-ups | Indefinite **only if genuinely anonymous** (k-anonymity, no re-identification path) | — |
| D6 listening | Raw mentions | 30–90d raw; aggregates longer | GDPR + platform terms |
| D7 inbox | Conversations | Tenant-configurable, default 12 months; **longer for archiving customers** | FINRA/SEC push *up* |
| D8 embeddings | Vectors | Inherits from source | §4.14 |
| D9 telemetry | Logs, traces | 30–90d detail, 13m aggregate | Security vs minimisation |
| Audit | Skeleton | 12 months minimum, 7 years for enterprise | SOC 2, customer requirement |

**Per-source retention is a hard structural requirement**, not a config nicety: X has a hard
30-day private-metrics capture window; LinkedIn's limit is unverified and reputed to be the
strictest in the set, so it is treated as the shortest-retention source and its schema is built
so that tightening it does not touch any other platform; YouTube's policy points toward querying
the Analytics API on demand and warehousing **aggregates** rather than raw entities.

### 4.14 Embeddings and the erasure problem

Embeddings computed from personal data are derived personal data and inherit erasure
obligations, and ANN indexes are bad at selective deletion. Three rules, in order of leverage:

1. **Do not embed D4/D6 content by default.** Embed D3 (the tenant's own content) freely.
   Embedding audience and listening content is an explicit, off-by-default tenant choice with
   its own retention setting. This is the option that most reduces legal surface and costs the
   least.
2. **Namespace vectors per tenant and per source record**, so a delete is an index-level
   operation on a small partition rather than a global rebuild.
3. **Tombstone + scheduled compaction**, with the tombstone enforced at query time in the
   interim.

---

## 5. Scheduling and publishing engine

### 5.1 The time model

**Rule: store `(local wall-clock, IANA zone)`. Resolve the UTC instant at dispatch, from the
current tzdb.** This is the single most important scheduling design decision in the corpus, and
it exists for one reason: governments change DST rules several times a year, and a post
scheduled for "9am Tuesday in São Paulo" must still fire at 9am local afterwards. A stored UTC
instant silently drifts, and the intent is unrecoverable.

Concretely:

| Requirement | Implementation |
|---|---|
| IANA IDs only | `Asia/Kolkata`, never `IST` (ambiguous between India, Ireland and Israel), never a UTC offset. |
| Resolution at dispatch | `dispatch_at_utc` is a materialised index column recomputed whenever tzdb changes; the tuple is authoritative. |
| tzdb pipeline | Pinned version, automated update PR on each IANA release, staleness alarm, upgrade tested against a corpus of scheduled rows. **A stale tzdb is a correctness bug, tracked as one.** |
| DST-ambiguous / nonexistent local times | 02:30 may occur twice or never. Documented policy per target using Temporal's vocabulary — `compatible` / `earlier` / `later` / `reject` — surfaced in the UI when it bites. |
| Timezone resolution order | `connection.timezone` → nearest ancestor `node.timezone` → workspace default. Profile-level is the sellable item; incumbents sit at group/brand level. |
| Display | Dual-time rendering in the composer: "09:00 for the profile / 14:00 for you". Cheapest item on the list and the one that actually prevents 3am posts, because the real cause is UI confusion, not tzdb drift. |
| Calendar chrome | First day of week and weekend shading read from CLDR `weekData.json`. Two JSON lookups. SA=sun but neighbouring AE=mon; weekends are fri–sat across SA/EG/IL/KW/QA/OM/BH/JO/DZ, fri-only in IR, thu–fri in AF, sun-only in IN. |
| Non-Gregorian display | Implemented **silently** in the formatting layer via `Intl.DateTimeFormat` calendar options where CLDR says users prefer them. Never mentioned in positioning. Persian calendar and Hebrew sunset-interval modelling are **cut**. |
| Ramadan/Eid | A campaign-planning **overlay**, not a date picker: country-selectable dates showing the ±1-day moon-sighting variance explicitly, a countdown, and pre-/post-Iftar dayparting presets. Never assert one global date. |

**The consequence that must be decided deliberately, not discovered:** this model is
**incompatible with delegating to platform-native scheduling** (Meta `scheduled_publish_time`,
YouTube `publishAt`, VK `publish_date`, Mastodon `scheduled_at`). Once the platform holds the
post, our clock is a verifier rather than the source of truth, a DST rules change cannot be
applied, and — critically for §5.6 — **a hold cannot reach it without an unschedule call that
may fail**.

**Decision: self-dispatch is the default for all networks.** Native scheduling is offered only
as an explicit per-connection opt-in with a documented trade-off ("we hand the post to Meta;
your crisis hold may not be able to recall it, and a DST change will not move it"), and every
natively-scheduled target is reconciled daily against the platform's own view.

### 5.2 Queue topology

A single global job queue is architecturally wrong for this category. The binding constraints
are per-network *and* per-account *and* per-project, and they differ by three orders of
magnitude — Reddit tolerates 1 concurrent job while Facebook tolerates 500.

```
                       ┌──────────────────────────────────────────────────────┐
  post_targets ───────▶│  DISPATCHER  (partitioned by connection_id hash)      │
  (dispatch_at_utc)    │  · range-scans due work per partition                 │
                       │  · applies the SMEARING function within tolerance     │
                       │  · consults HOLDS as the final gate                   │
                       │  · RESERVES rate-limit capacity at T-60s              │
                       └───────────────────────┬──────────────────────────────┘
                                               ▼
                       ┌──────────────────────────────────────────────────────┐
                       │  DURABLE LOG  (Kafka/Redpanda; key = connection_id)   │
                       │  ordering guaranteed per connection                   │
                       └───────────────────────┬──────────────────────────────┘
            ┌──────────────────────┬───────────┴───────────┬──────────────────────┐
            ▼                      ▼                       ▼                      ▼
   ┌────────────────┐    ┌────────────────┐      ┌────────────────┐    ┌────────────────┐
   │ PRIORITY LANE  │    │ PRIORITY LANE  │      │ PRIORITY LANE  │    │ PRIORITY LANE  │
   │ interactive    │ >  │ scheduled      │  >   │ sync           │ >  │ backfill       │
   │ (user clicked) │    │ (the calendar) │      │ (webhook/poll) │    │ (preemptible)  │
   └───────┬────────┘    └───────┬────────┘      └───────┬────────┘    └───────┬────────┘
           └─────────────────────┴───────────────────────┴─────────────────────┘
                                               ▼
                       ┌──────────────────────────────────────────────────────┐
                       │  WORKER POOL per (network, archetype)                 │
                       │  concurrency ceiling from capability descriptor       │
                       │  Reddit 1 · Threads 2 · Bluesky 2 · Pinterest 3 ·     │
                       │  Telegram 3 · GBP 3 · X 10 · YouTube 200 · FB 500     │
                       │  per-connection circuit breaker                       │
                       └──────────────────────────────────────────────────────┘
```

**Ordering is per connection, not global.** Threads (X/Bluesky/Mastodon reply chains), Telegram
albums and comment chains must be serialised per connection; everything else parallelises.
Keying the log by `connection_id` gets this for free.

**Smearing.** Humans schedule at `:00` and `:30`. Without smearing, 5,000 publishes/second land
in one second and every per-account limiter rejects. The dispatcher applies a deterministic
jitter derived from `hash(target_id)` within a per-tenant tolerance (default ±90s, configurable
down to 0 for tenants who care, at the cost of throughput). The tolerance is **shown in the
UI** — "published within 90 seconds of 09:00" — because silently moving a post is the kind of
thing customers discover in a screenshot.

**Reddit's honesty case.** Concurrency 1 plus a mandated ~5s inter-submission delay means a
customer cross-posting to 20 subreddits takes 100+ seconds minimum. That must be **surfaced in
the UI as an expectation**, not experienced as a hang.

### 5.3 The publish state machine

Every target is an explicit, persisted state machine. Not a job that calls an SDK.

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         ▼
   ┌───────────────►  VALIDATED  ◄──────────── pre-flight (compose time) + revalidation at T-5m
   │                     │
   │                     ▼
   │                RENDITIONS_READY        transcode to per-network specs
   │                     │
   │                     ▼
   │                  SCHEDULED ──── hold applied ──► HELD ──► (skip | defer) ──┐
   │                     │                                                       │
   │                     ▼  T-60s: reserve rate-limit capacity                   │
   │                  RESERVED                                                   │
   │                     │                                                       │
   │                     ▼  claim (target_id, attempt) — the exactly-once guard   │
   │                  CLAIMED                                                    │
   │                     │                                                       │
   │                     ▼  adapter.submit(idempotency_key)                      │
   │                  SUBMITTED ──────────────┐                                  │
   │                     │                    │ container expired (Meta 24h)     │
   │                     ▼ adapter.poll()     └──► RENDITIONS_READY (restart      │
   │              ┌── PROCESSING                      from staging, not publish)  │
   │              │      │                                                        │
   │              │      ▼ 'ready'                                                │
   │              │   FINALIZING ── adapter.finalize()                            │
   │              │      │                                                        │
   │              │      ▼                                                        │
   │              │   PUBLISHED ──► VERIFYING ──► VERIFIED_LIVE                    │
   │              │                     │                                          │
   │              │                     └──► PUBLISHED_THEN_REMOVED  (terminal,     │
   │              │                            user-actionable, alerting)          │
   │              │                                                                │
   │              ▼ 'rejected' (ASYNC_REVIEWED: WeChat freepublish, Douyin, LINE)  │
   │        CONTENT_REJECTED  (terminal — notifies a human, never silently retried)│
   │                                                                               │
   └── FAILED_RETRYABLE ◄── typed error, backoff within the lateness budget ───────┘
                │
                ▼ lateness budget exhausted OR terminal class
          FAILED_TERMINAL  (typed, user-actionable, with the platform's verbatim reason)

   PARTIALLY_PUBLISHED — carousels, threads, multi-subreddit: some items succeeded.
                          Never reported as success.
```

### 5.4 Exactly-once, honestly

There is no exactly-once across a network boundary. What is achievable is **at-most-once
visible effect**, and it is achieved with four mechanisms layered, because no single one covers
every network:

| Mechanism | Where | Detail |
|---|---|---|
| **1. Claim before call** | Everywhere | `publish_claims (post_target_id, attempt)` is inserted in a transaction *before* the HTTP call. A replayed job finds the claim and declines. Claims carry `expires_at` so a dead worker's claim is reclaimable — but reclaim escalates to mechanism 3, never to a blind retry. |
| **2. Platform idempotency** | Mastodon (`Idempotency-Key`), a handful of others | Use it where it exists. It is rare. |
| **3. Read-back before retry** | Reddit (`/user/{me}/submitted`), Meta, X, LinkedIn | Before *any* retry of a call whose response was lost, read back and check whether the post exists. This is the only correct behaviour for a network with neither idempotency nor a deterministic id. |
| **4. Deterministic content fingerprint** | Telegram, Discord webhooks, and anything in category `local_lock_only` | A per-`(connection, scheduled_slot)` lock plus a content hash recorded on success, so a duplicate attempt within a window is refused locally. |

The capability descriptor's `idempotency` field says which strategy applies, so the engine does
not guess. **Duplicate posts are the most reputationally damaging failure in this category** —
the customer's audience sees the mistake — which is why this is four mechanisms and not one.

### 5.5 Rate-limit budgeting

Eight distinct limiter models exist across the platform set and they cannot be served by one
global limiter. The design is a **hierarchical token-bucket tree** with reservations.

```
                    APP / PROJECT BUDGET            ← YouTube 10k units/day, GBP ~300 QPM,
                          │                            Meta app-level 200×MAU/hour, X monthly cap
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   TENANT SHARE      TENANT SHARE      TENANT SHARE  ← weighted by plan; this is the FAIR-SHARE
   (plan-weighted)                                      layer that stops one bulk operation
        │                                                starving everyone
        ▼
   CONNECTION BUDGET                              ← IG 100 posts/24h (queryable!), Threads 250,
        │                                            TikTok ~15-30, LinkedIn ~150/day/member
        ▼
   ENDPOINT BUDGET                                ← X 15-min windows per endpoint per tier,
                                                     Discord per-route bucket hash
```

Four behaviours make this a product feature rather than plumbing:

1. **Reservation at T-60s.** A scheduled publish reserves its capacity a minute ahead.
   Discovering at T+0 that we are rate-limited means a late post. If the reservation fails, the
   target enters `FAILED_RETRYABLE` early with a visible ETA rather than at the moment of truth.
2. **Priority classes with preemption.** `interactive > scheduled > sync > backfill`. Backfill
   (platform re-fetch, GBP location sync, Google Play GCS import) is **preemptible** and yields
   immediately when a scheduled publish needs capacity.
3. **Pre-flight quota simulation** — the unclaimed feature in `05 §11 G5`. The data exists
   (IG 100/24h queryable, YouTube units/day, X 300/3h, TikTok ~6 req/min, Reddit concurrency 1)
   and no product tells a user *before* they schedule: "this calendar breaches Instagram's daily
   cap on the 14th" or "these 40 videos exceed your YouTube quota by 6×." The calendar runs the
   simulation continuously and flags future breaches as warnings on the affected days.
4. **Admission control with an honest ETA**, never a silent delay. Circuit-breaker state is
   **visible in the customer UI**: "Reddit is rate-limiting us; your 10:00 post is queued for
   10:03."

**Configurable self-imposed caps.** Vista self-imposes 25 posts/day/profile and 50/24h for
Instagram — well inside platform limits — and the *non-configurability* of that cap is a
documented customer complaint. Ours is a per-node, per-connection setting with a sane default,
an override, and an audit entry when it is raised.

**Metered platforms get a cost ledger.** X is the only platform where scale costs money
directly, and its per-post pricing is `UNVERIFIED` **`[FRAGILE]`**. Every X call debits a
per-tenant cost ledger; plans carry an X allowance; the composer shows the marginal cost of an
X post before scheduling. If the pricing turns out to be real, the product degrades gracefully
to "X is a metered add-on" instead of the company absorbing an unbounded bill.

### 5.6 Holds in the dispatch path

The hold check is the **final gate before reservation**, and it is evaluated as a set
membership test rather than a scan:

```
hold_applies(target) :=
     EXISTS active hold H where
         target.node.path <@ H.scope_path            -- ltree containment, one index probe
      OR target.connection_id = H.scope_ref
      OR H.scope_kind = 'workspace'
     AND ( H.content_class_filter IS NULL            -- unscoped hold: holds everything
           OR post.content_class IS NULL             -- FAIL CLOSED on unlabeled content
           OR post.content_class = ANY(H.content_class_filter) )
```

Note the middle clause. **Unlabeled content is held.** The allowlist form
(`hold everything except service_status`) is expressed by putting `service_status` in an
`exempt` list, which is a separate column from `content_class_filter` and is the *only* way
content escapes a hold. Getting this backwards means the first unlabeled post during a crisis
goes out.

Three policies, evaluated at hold time and again at lift time:

| Policy | At hold | At lift |
|---|---|---|
| `skip` | Target → `HELD`, `action_taken='skipped'`. The slot is consumed and not rescheduled. | Appears in the restore queue as "skipped — re-slot?" |
| `defer_next_slot` | Target moves to the next available queue slot for its connection *after* the window ends. Collisions resolved by queue ordering, not by stacking. | Already moved; restore queue shows the new time and offers a bulk revert. |
| `defer_past_window` | Target moves to `window_end + offset`, preserving relative ordering within the held set. | Same. |

And for native-scheduled targets, the unschedule call runs and its outcome is recorded per
item. **`unschedule_failed` is surfaced as a red banner and a per-item badge**, because a hold
that silently fails to reach Meta's servers is worse than no hold at all: the operator believes
they are safe.

### 5.7 Verification and reconciliation

Publishing is not done when the API returns 200. Three passes:

| Pass | Timing | Mechanism |
|---|---|---|
| **Existence** | +60s | `adapter.readBack()` — re-fetch the object via the *same API that created it*. Confirms the post exists and captures the canonical permalink. |
| **Removal watch** | +10m, +1h, +24h | Diff against expected state. Reddit `/api/info` → `removed_by_category` / `banned_by` / `approved` (AutoModerator removals occur seconds after an HTTP 200); Meta media-node GET; TikTok status/fetch; X compliance-job events for `deleted`/`deactivated`/`scrub_geo`/`protected`/`suspended`. Produces `PUBLISHED_THEN_REMOVED`. |
| **Compliance reconciliation** | Daily + before any export or report | X batch compliance jobs (create → upload IDs, URL expires in 15 min → poll → download, URL expires in 7 days). Ensures stored data reflects current platform state, which is an unconditional obligation. |

**Where a platform exposes no read-back, the UI says so**: "removal detection unavailable on
this network." An admitted blind spot is itself differentiation in a category that hides them.
Any desire for third-party corroboration goes through licensed providers as an explicit,
priced, contractually-fenced option — **never through our own app ID**, and never as scraping.

### 5.8 Retries and the lateness budget

Retry policy is driven by the error class, bounded by a **user-configurable lateness budget**
that is a property of the target, not a global constant.

```
attempt n backoff = min( base × 2^n × jitter , class_ceiling )
                    subject to  now() + backoff  <  scheduled_at + lateness_budget

lateness budget exhausted → FAILED_TERMINAL with the reason "we could not publish within
                            your {N}-minute lateness window; here is why"
```

Defaults: 15 minutes for ordinary posts, 0 for time-critical content (a live-event post that is
useless late is better failed than published at 09:47), and up to 24h for evergreen recycling.
The budget is exposed in the composer as "publish within ___ of the scheduled time, or don't."
No competitor offers this, and it is the difference between "your post went out late and looked
stupid" and "your post didn't go out and we told you at 09:16."

### 5.9 Reauth and scope handling in the publish path

| Situation | Behaviour |
|---|---|
| Token expired, refresh available | Refresh **behind a per-connection distributed lock**, single-writer. Persist the new pair in the same transaction that marks the old consumed. Then retry once. |
| Refresh returns `invalid_grant` | Connection is dead. Do **not** retry — treat as "prompt user". On X and TikTok the refresh token is single-use and rotating; a retry storm here permanently orphans the connection and may look like token theft to the platform. |
| Scope missing | `SCOPE_MISSING(scope)`, no retry, and the reconnect prompt names the exact permission. **We do not claim incremental re-consent** — only Google supports true incremental auth; Meta's `rerequest` only re-prompts declined permissions; LinkedIn, X and TikTok replace the grant wholesale. Ship "early scope-delta detection triggering a full re-auth link before publish time." |
| Connection `quarantined` | The dispatcher refuses to claim targets on it; they enter `AWAITING_RECONNECT` and are surfaced in the forward-looking risk view rather than failing one at a time. |
| Platform-wide revocation event | A clustering alarm on `reauth_required` transitions (§9.5). The kill switches (global pause, per-tenant, per-platform, mass re-auth) exist **before** launch, not during the incident. |

---

## 6. Ingestion and analytics

### 6.1 One event stream, three acquisition paths

Webhooks exist on some platforms, partially on others, and not at all on LinkedIn. The
architecture must have **both** a webhook ingestion path and a polling scheduler, and they must
converge on one normalised event stream so that nothing downstream cares which path an item
arrived by.

| Path | Platforms | Engineering |
|---|---|---|
| **Webhook** | Facebook Page (`feed`, `messages`, `mention`, `ratings`, `live_videos`), Instagram (`comments`, `mentions`, `messages`, `story_insights`, `live_comments`), Threads (partial), TikTok (`authorization.removed`, `video.publish.complete/failed`), YouTube **PubSubHubbub** (uploads only, free and quota-free — a major quota saving), GBP Pub/Sub | Signature verification (`X-Hub-Signature-256`), **idempotent receipt** because Meta redelivers, fast 200 then async processing, WebSub lease auto-resubscription (~5 days), per-page subscription management |
| **Poll** | X (search, mentions, DMs), LinkedIn (**everything** — no organic webhooks at all), TikTok comments, YouTube comments, Pinterest, most of tier 2 | Adaptive interval per connection driven by observed event rate and plan tier; conditional GET with ETag/Last-Modified where supported; cursor persistence; **poll interval is a pricing decision on X** |
| **Stream / crawl** | Bluesky Jetstream (unsampled), Mastodon WSS, Twitch EventSub, RSS/sitemaps/Discourse JSON/WordPress REST, podcast RSS | Polite crawling, conditional GET, GUID dedupe, HTML→blocks normalisation |

```
 webhooks ──┐
 polls ─────┼──▶ NORMALISE ──▶ DEDUPE ──▶ DURABLE LOG ──┬──▶ CONVERSATION SERVICE (inbox)
 streams ───┘    (adapter)     (hash +    (partitioned   ├──▶ METRIC PIPELINE
 crawls ────┘                   url canon)  by tenant     ├──▶ LISTENING ENRICHMENT
                                            + source)     ├──▶ RAW ARCHIVE (Parquet, dt/source)
                                                          └──▶ REALTIME SCORING (burst/anomaly)
```

**Separate the raw archive from the search index.** Raw goes to object storage as Parquet
partitioned by `dt/source`; the index holds only what is searchable. Retention differs, and the
archive is what allows re-enrichment when the models improve — which they will, repeatedly.

**Alert state is separate from mention state.** Crisis alerting needs its own store with dedupe
windows, escalation state and acknowledgement; a mention arriving twice must not page a human
twice.

### 6.2 Detection latency drives the SLA floor

This table is not documentation — it is **generated into the product**. A customer cannot
configure a 1-hour first-response SLA on a channel we poll every 6 hours, and the UI says why.

| Channel | Detection mechanism | Realistic floor |
|---|---|---|
| Facebook / Instagram comments, mentions, DMs | Webhook | **~seconds** |
| Threads | Webhook (partial coverage `C3`) | seconds–minutes, degrades to poll where uncovered |
| TikTok publish status | Webhook | seconds |
| TikTok comments | Poll | minutes–hours, plan-dependent |
| YouTube new uploads | WebSub | seconds |
| YouTube comments | Poll (quota-bound) | **hours** |
| X mentions/DMs | Poll; Account Activity webhooks are **Enterprise only** | **plan-dependent, and the poll interval is a pricing decision** |
| LinkedIn | Poll only; **no webhooks, no DM API at all** | hours |
| Pinterest | Poll | hours |
| GBP reviews | Pub/Sub where granted, else poll | minutes–hours |

Selling the floor as a trust feature is the same "conspicuous honesty" posture recommended for
listening coverage, and it is the single thing that makes an SLA product credible rather than
fraudulent.

### 6.3 Backfill — the migration weapon

On connect, immediately backfill from the platform APIs to the maximum depth each allows:
Instagram ~2 years of media insights, Facebook ~2 years, YouTube's full history via the
Analytics API, LinkedIn ~12 months, TikTok whatever the API permits, Pinterest 90 days.

**This does not require the incumbent's cooperation and the incumbent cannot prevent it.** It
converts the single biggest switching barrier — "I'd lose three years of analytics" — into a
20-minute automated job that produces a populated dashboard *before* the customer has cancelled
anything. Given that the leading enterprise vendor gates its Analytics API to its top tier, the
majority of that vendor's customers **cannot export their own history**, and platform re-fetch
is their only escape route.

Engineering requirements:

- Runs in the `backfill` priority lane; **preemptible** by scheduled publishes.
- Idempotent and resumable, with a progress UI showing history being reconstructed.
- Writes to Layer 1 raw with `collected_at` distinguishing backfilled from live-captured rows,
  because backfilled aggregate data and daily-snapshot data have different fidelity and the
  reports must be able to say so.
- Respects per-source retention: backfilling data we are not permitted to retain is a
  compliance violation dressed as a feature.

### 6.4 Metric normalisation

The mapping from Layer 1 to Layer 2 is a **versioned pure function** per `(network, api_version,
raw_metric)`, and the version id is stored on every canonical row. That single column is what
makes metric provenance possible: when a platform redefines a metric — as Meta did in
consolidating `impressions`/`plays` into `views` — the historical series does not silently
change meaning; it changes `mapping_version`, and the chart can render the discontinuity.

Rules that are enforced in code, not convention:

1. **Ratios only within a comparability class and within a network.** Any cross-network roll-up
   is labelled with its class. A TikTok "view" (auto-play, immediate) and a YouTube "view"
   (thresholded, bot-filtered) differ by a large, content-dependent factor.
2. **All four engagement-rate definitions ship**, defaulting to ER-by-reach where reach is
   available and ER-by-followers otherwise, **with the formula in a tooltip on the number**.
   Vendors that hide the formula generate support tickets forever, because the customer's
   number does not match the platform's native app.
3. **`followers_at_post_time` is snapshotted daily and stored**, never read live.
4. **A cross-network "total impressions" tile is not offered.** If a customer insists, it is
   labelled class B and carries the caveat inline.

### 6.5 Storage engines

| Store | Technology | Holds | Why |
|---|---|---|---|
| **OLTP** | PostgreSQL (per-cell, per-region) | Tenancy, node tree, connections, content, targets, conversations, holds, approvals, rights, audit skeleton | RLS, transactions, `ltree`, partial indexes, `jsonb`. The scheduler's hot path is a partial index range scan and Postgres is excellent at that. |
| **Durable log** | Kafka / Redpanda | All ingest events, all publish transitions, all audit events | Replayability is what makes re-enrichment and warehouse rebuilds possible. Retention 7–30 days; the archive is the long-term record. |
| **Raw archive** | Object storage, **Apache Iceberg** tables in Parquet, partitioned `(source, dt)` | Layer 1 raw metrics, raw mentions, raw platform payloads | Iceberg because it is the format the customer-facing warehouse share is *also* built on — one copy, two consumers (§6.6). Per-partition retention makes per-platform ToS enforceable. |
| **OLAP** | ClickHouse | Layer 2 canonical + Layer 3 derived, benchmark panel, reliability ledger | Sub-second aggregation over ~100B rows/yr; cheap materialised views for dashboards. |
| **Search** | OpenSearch with kNN | Mention search, inbox search, content search | Hot 90 days only; older results served from the archive via a slower path with an honest "searching archive" state. |
| **Vector** | pgvector for D3 (tenant's own content), namespaced per tenant | Brand-voice exemplars, novelty/fatigue scoring, RAG knowledge | Kept in Postgres because the volumes are small once D4/D6 embedding is off by default, and because deletion is then a normal DELETE. |
| **Cache** | Redis (per-cell) | Capability descriptors, resolved node settings, rate-limit buckets, DEK cache, session | TTL discipline is a compliance control, not an optimisation. |
| **Object/media** | S3-compatible per region, lifecycle-tiered | Masters, renditions, exports | Masters in standard, renditions in IA after 30 days, exports expire hard. |

### 6.6 Warehouse-native delivery

This is the largest single product gap in the corpus and it is delivered as **five artifacts
over one Iceberg substrate**, not as an export button.

```
                    ┌──────────────────────────────────────────┐
                    │  ICEBERG TABLES  (our raw + canonical)    │
                    │  partitioned (source, dt) · per-tenant    │
                    │  namespace · retention-enforced           │
                    └───────────────────┬──────────────────────┘
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
 ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
 │ BYO BUCKET │  │ SNOWFLAKE  │  │ BIGQUERY   │  │ DATABRICKS │  │ dbt PACKAGE│
 │ customer   │  │ Native App │  │ Analytics  │  │ Delta      │  │ versioned, │
 │ owns the   │  │ (model +   │  │ Hub listing│  │ Sharing    │  │ documented,│
 │ Iceberg    │  │ compute in │  │            │  │            │  │ public     │
 │ tables     │  │ their acct)│  │            │  │            │  │            │
 └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

What is shared, and what is deliberately not:

| Shared | Withheld |
|---|---|
| Layer 1 raw metrics for the customer's own connections | The cross-tenant benchmark panel (aggregate only, k-anonymity ≥20–30 accounts per cell, opt-out honoured) |
| Layer 2 canonical metrics **with comparability class as a column** | The fleet-wide creative-feature priors (§8.7) |
| Row-level mentions **and their enrichments** — sentiment, entities, topics — not just aggregates | Model weights, prompts, ranking functions |
| Conversation metadata and SLA events | Other tenants' anything, ever |
| Publish attempts, retries, failures, latency — the reliability ledger as data | |
| A conformed metric layer as **SQL views with documented comparability classes** | |

**Reverse ETL** closes the loop in the direction nobody has built: a warehouse query
materialises a content brief or a DM campaign; `predicted_ltv` computed in the warehouse ships
through the conversion APIs; a suppression list defined in the warehouse stops a boost reaching
existing customers; and **approval routing keyed on a warehouse-defined "high value account"**
sends a mention to a named CSM.

**Strategic note, stated plainly.** The strongest switching costs in this category are
data-custody costs, and this gives them away. That is deliberate: give away the raw data, keep
the derived intelligence. The compensating asset is the benchmark panel — a genuine data
network effect where every additional connected account improves the benchmark for every other
customer, which compounds, cannot be bought, and gets better precisely as we grow.

### 6.7 Listening

Four coverage tiers, each with an honest claim, and **`coverage_class` shown per source on
every result set**.

| Tier | Sources | Claim | Marginal cost |
|---|---|---|---|
| **L0 — Owned** | Every connected account: comments, DMs, mentions, tags, reviews | "Everything on channels you connect" — 100% true | $0 |
| **L1 — Open** | Bluesky Jetstream (unsampled), YouTube comments, Threads keyword search, Tumblr tags, Twitch chat, Stack Exchange, Discourse, WordPress REST, news/blog RSS + sitemaps, podcast RSS, Common Crawl backfill | "Complete on open networks; broad on the open web" — true and verifiable | ~$0 + compute |
| **L2 — Metered** | X (Basic/Pro), Reddit (commercial contract), IG `business_discovery` + `ig_hashtag_search` (30 hashtags/7d) | "Sampled, with a visible quota meter" — and the meter must actually be shown | $$ |
| **L3 — Licensed** | Socialgist / Datastreamer / X Enterprise | "Full firehose" | $$$$ — not before there is enterprise ARR to fund it |

**Enrichment is hybrid, and the hybrid is the whole trick.** Run cheap self-hosted encoders
over 100% of the stream (~$5–20 per million mentions on a T4/L4); route to an LLM only for
(a) mentions above an author-reach threshold, (b) low encoder confidence or class disagreement,
(c) mentions inside an active anomaly window, (d) a random ~1% audit sample for eval. That is
typically 2–5% of volume on the expensive path — turning a $3,000/million problem into roughly
$30–80/million while keeping frontier quality exactly where a human will look.

**Versioned queries.** Editing a listening query must not silently rewrite history. A query is
an immutable version; editing creates a new version; results are attributed to the version that
produced them, and the UI shows the boundary.

### 6.8 Attribution

| Layer | Mechanism |
|---|---|
| Click | Owned shortener with **per-message unique link IDs**, `utm_content = post_id` auto-tagged by a UTM rules engine, resolved server-side |
| Server-side conversion | One internal event schema fanned out to Meta CAPI, TikTok Events API, LinkedIn CAPI, Pinterest Conversions, Google — the schema discipline is what makes it cheap |
| Dark social | Self-reported attribution ("how did you hear about us") classified by an LLM and shown **next to** click attribution, with the gap explicitly labelled |
| Incrementality | Content-pillar holdout designs (organic, no ad spend required) and, for multi-location tenants, the crossover trials in §8.7 |

---

## 7. Inbox and engagement

### 7.1 Real-time architecture

```
 normalised event stream (§6.1)
        │
        ▼
 ┌──────────────────────┐   assignment rules, SLA policy resolution, routing
 │ CONVERSATION SERVICE │   (node-scoped, resolves through the tree)
 └──────────┬───────────┘
            ├──▶ Postgres (conversation + message rows, RLS-scoped)
            ├──▶ OpenSearch (search + saved views)
            ├──▶ SLA TIMER WHEEL  ──▶ pre-breach alert · escalation ladder · reroute
            └──▶ WebSocket fan-out ──▶ agent clients (presence, typing, live counts)
```

The **SLA timer wheel** is a separate durable component, not a cron scan. Every conversation
with a policy schedules two timers — pre-breach (at a configurable fraction, default 75% of the
target) and breach — into a sharded timer store keyed by due-time bucket. Alerts fire
**before** breach, which is the entire point: a report showing average first-response after the
fact is a metric, not a managed object.

### 7.2 SLA as a managed object

```sql
CREATE TABLE sla_policies (
    id, organization_id, node_id,
    channel_filter   text[],           -- per brand, channel and conversation type
    conversation_kind text[],
    first_response_target interval NOT NULL,
    resolution_target     interval,
    business_hours_id uuid,            -- respects the node's timezone and CLDR weekend
    -- HARD CONSTRAINT: cannot be set below the channel's detection floor (§6.2).
    -- Attempting it returns an error naming the floor and the reason.
    escalation_ladder jsonb NOT NULL,  -- [{after:'75%', notify:'assignee'},
                                       --  {after:'breach', notify:'duty_manager'},
                                       --  {after:'breach+30m', notify:'node_owner', reassign:true}]
    routing_rule      jsonb            -- SLA-based routing: route by urgency, not by arrival
);
```

### 7.3 The send-eligibility state machine

Instagram is the case everyone gets wrong, and getting it wrong means an agent composes a reply
that cannot be sent. **Two clocks, not one.**

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │ CLOCK A — DM window                                                     │
   │   starts/resets on: any user MESSAGE (including a Story reply, because  │
   │                     a Story reply IS a message)                         │
   │   does NOT reset on: a comment                                          │
   │   duration: 24h · extendable to 7 days via the HUMAN_AGENT tag          │
   ├────────────────────────────────────────────────────────────────────────┤
   │ CLOCK B — comment → private reply                                       │
   │   ONE private reply per comment, within 7 days OF THE COMMENT           │
   │   a separate, one-shot path — it does not open or extend Clock A        │
   └────────────────────────────────────────────────────────────────────────┘

   Three states rendered in the composer:
     ● CAN SEND ANYTHING          Clock A open
     ● HUMAN-AGENT WINDOW         Clock A expired, HUMAN_AGENT applied — support content only
     ● CLOSED — TEMPLATE PATH     both closed; only the platform's template mechanisms remain
```

A live countdown per conversation is rendered from these clocks so agents know what is still
sendable. The same state machine generalises: WhatsApp's 24h session window, Zalo ZNS, Kakao
AlimTalk and Viber all have a session/template split, and the template subsystem is built once
(template model + approval lifecycle `draft→submitted→approved|rejected` + variable binding +
per-message cost ledger) and used five times.

### 7.4 Duty, handover and connection health

**Rosters are a thin input, not a WFM product.** Who is on shift, in what timezone, and who
escalation should page. No scheduling, forecasting or adherence — that is another category's
product and the three-person ICP will never use it.

**The handover digest is the demo moment** and has no competitor evidence anywhere in twelve
dossiers. At shift change, the incoming team receives a generated digest scoped to their
coverage: *"47 items arrived overnight, 12 unanswered, 3 approaching breach, sentiment shifted
on this topic, these 2 conversations are within 4 hours of their DM window closing."* It is
cheap, has no platform dependency, and is exactly the artifact a Manila night shift covering a
New York brand needs instead of an undifferentiated queue.

**Connection health is an operational surface in the same family**, funded from the reliability
budget and **never tier-gated** — "pay more and our software keeps working" reads as extortion.

| Element | Spec |
|---|---|
| **State model** | `healthy · expiring in N days · scope missing · needs reconnect · quarantined · insufficient plan` |
| **Predictable expiry** | T-14 and T-3 warnings, restricted **strictly to scheduled expiries** — LinkedIn 60d, Meta `data_access_expires_at`, TikTok 365d, Pinterest 30d. The forward-looking view ("3 of your 47 connections will break before your next scheduled post") is scoped to these and only these. |
| **Unpredictable revocation** | X refresh orphaning, Meta password change / 2FA / checkpoint / app removal — **no webhook fires**. Caught only by a **daily read-only identity probe**, i.e. detected hours after the fact. Marketed exactly as: *"we catch it before your post does, not before it happens."* |
| **Probe implementation** | A read-only identity call per network. **Never a speculative refresh** — on X and TikTok the refresh token is single-use and rotating, so a refresh-based health check manufactures the exact orphaning failure the feature exists to prevent. Nine bespoke probes, budgeted against the same app quota as publishing, with X's metered read cost included. |
| **Refresh safety** | Single-writer behind a per-connection distributed lock; new pair persisted in the same transaction that marks the old consumed. |
| **Repair links** | The seat-free client connect link applied to the far more frequent repair case — plus the parts that are actually new: **the trigger, the workflow, and batching** ("send repair links to 3 clients"). Honest expectation-setting: it removes roughly one of five friction steps and cannot fix a departed employee, a lost Business Manager role, or a Meta security checkpoint — which is where agency repair conversations actually die. |
| **Scope** | This is one workstream inside **publishing reliability**, alongside API deprecations, media-format rejections, rate limits and policy blocks. Token friction is 5% of churn, rank 8 of 8. A token-only project addresses about a fifth of the real bucket. |

### 7.5 Moderation, honestly scoped

Ship each capability only where the API exists, and say where it does not.

| Action | Where it works |
|---|---|
| Hide / delete comment | Meta, most networks with comment APIs |
| Like as brand | Facebook, LinkedIn, TikTok — yes. Instagram — unverified. YouTube, Threads — no. |
| **Block a user** | **Facebook Pages only** (`blocked_users`). **Instagram has no block endpoint.** Shipped where it works, labelled where it does not, and kept out of the headline. |
| Ad / dark-post comment moderation | Where the ads API exposes it. Table stakes to reach, not a wedge — rule-based ad-moderation specialists got there first. |

---

## 8. The AI layer

### 8.1 Shape

```
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ SURFACES   composer inline · conversational copilot · inbox reply drafting │
 │            · report narrative · listening enrichment · agent runtime       │
 └───────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ CONTEXT ASSEMBLY                                                            │
 │  brand voice policy · brand safety policy · banned terms · required         │
 │  disclosures · claim allowlist · RAG knowledge (per NODE, isolated) ·        │
 │  exemplar corpus · destination capability · rights state                    │
 │  → assembled as a CACHED PREFIX (§8.3)                                      │
 └───────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ MODEL ROUTER    job class → model class → provider → REGION-PINNED endpoint │
 │  fallback chains · budget enforcement · per-tenant cost ledger              │
 └───────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ GUARDRAILS (parallel, not sequential)                                       │
 │  brand-voice judge · safety judge · claim checker · disclosure checker ·    │
 │  banned-term regex · novelty/fatigue scorer                                 │
 └───────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ AUTONOMY KERNEL — every WRITE passes through, whatever its origin (§8.6)    │
 └────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Model routing

Routing is by **job class**, not by user preference, because the economics differ by two orders
of magnitude and the quality requirement differs with them.

| Job class | Model class | Rationale |
|---|---|---|
| Caption drafts, hashtags, variants, tone shifts, **alt text** | Cheapest frontier-lite | Output is short and a human or a judge filters it — thousands per dollar |
| Brand-voice judging, safety judging, claim checking | Mid | Judgement quality matters more than prose quality; still cheap |
| Long-transcript highlight ranking, campaign planning, report narrative | Long-context mid | Context window is the binding constraint, not reasoning |
| Agent planning with tool use, ambiguous escalations, crisis triage | Frontier | Low volume, high consequence |
| Anything customer-visible in a regulated vertical | Frontier + **region-pinned endpoint** | A rising enterprise procurement gate; EU/AU/JP endpoints carry a ~10% premium that must be budgeted |
| Listening enrichment at volume | **Self-hosted encoder**, LLM on the 2–5% tail | §6.7 |

The router is configuration, not code: a job class maps to an ordered list of
`(provider, model, region)` with a fallback chain and a per-class budget. Adding a model is a
config change; **changing the default for a tenant in a regulated vertical requires an audit
entry**, because their sub-processor register names the model providers and their roles.

### 8.3 Cost control

Four mechanisms, in order of leverage:

1. **Prompt caching.** The brand-voice policy, safety policy and exemplar corpus are identical
   across every generation for a given brand. Putting them in a cached prefix takes roughly
   **40–49% off the text bill** and cuts latency because the prefix is not reprocessed. This is
   an architectural decision, not an optimisation — the context assembler is built to produce a
   stable prefix.
2. **Unlimited text, metered media.** Text generation at fractions of a cent per caption is
   effectively free; media is where the money is. Removing the category's most-complained-about
   friction (opaque AI credits) costs essentially nothing on text, and it is a differentiator by
   itself.
3. **Human-readable units.** Nobody can explain what a credit is, so buyers under-buy and get
   blocked or over-buy and resent it. Meter in "images", "videos", "voiceover minutes", show
   real-time consumption, and **forecast the month from the first week**. Show a **pre-flight
   cost estimate in the composer** before a generation runs.
4. **Speculative generation where it pays.** At sub-cent caption costs, generating five variants
   the instant the composer opens costs a fraction of a cent and eliminates perceived latency.
   Nobody does this.

**Latency budgets drive UI shape, and they are architectural:** everything media is async with
webhooks where available and bounded polling where not; images stream partials; video shows a
real progress percentage. A synchronous request/response design fails on video, where an 8s
clip is 60–180s at the fast tier and 3–10 minutes at the high tier.

### 8.4 Brand voice and knowledge isolation

Brand voice is a **structured policy object attached to a node**, resolved through the tree, not
a free-text prompt:

```
brand_voice {
  tone_axes: { formal↔casual, playful↔serious, concise↔expansive, ... },
  lexicon:   { preferred[], banned[], never_abbreviate[], product_names[] },
  syntax:    { emoji_policy, hashtag_policy, sentence_length_target, cta_patterns[] },
  claims:    { allowlist[], requires_substantiation[], forbidden_superlatives[] },
  disclosures: { required_when: [...], text_by_locale: {...} },
  exemplars: [ content_version_id ],        -- real posts, not invented samples
  anti_exemplars: [ ... ]                    -- what NOT to sound like; nobody ships this
}
```

**RAG knowledge is isolated per node and never crosses.** An agency's client A knowledge base
must be unreachable from client B's generation, enforced by the same node-scoped retrieval that
governs everything else, and verified by the cross-tenant property test suite. A "test" tab
against the knowledge base is parity.

**Novelty and creative-fatigue scoring** compares a draft's embedding against the brand's own
90-day corpus and flags "you posted something 0.94-similar 11 days ago." It is nearly free once
embeddings exist for D3 content, nobody ships it, and it is immediately visible value.

### 8.5 Agent runtime and the tool surface

One tool registry serves three consumers, and all three hit the same server-side gate:

| Consumer | Transport | Identity |
|---|---|---|
| First-party agents | In-process | Agent identity bound to a node grant with `seat_class='agent'` |
| Customer's own agents | **Outbound MCP server** | Scoped per-brand agent token |
| Public integrations | REST API + webhooks | OAuth2 + PKCE, scoped |

Tools are declared with the same metadata regardless of transport: `readOnly | write |
destructive`, the node scope required, the budget class consumed, whether a confirm handshake is
mandatory, and the reversal path. A tool that cannot state its reversal path cannot be marked
`destructive`.

### 8.6 The autonomy kernel

**Framed honestly: this is a distribution gap, not a capability gap.** The leading enterprise
vendor shipped autonomous evaluation and pre-deployment agent QA. What it does not have is a way
to buy it: governance is unbuyable below roughly $50k ACV, and not one of fourteen enterprise
vendors lets a customer enable identity or governance with a credit card. Distribution gaps beat
capability gaps for a challenger — but only if the capability is not claimed as novel. **Budget
12 months of lead, not a moat.**

**The buyer is the agency or multi-location operator**, not the CISO. The enterprise buyer's
actual gate is SOC 2 Type II, SCIM, audit export, residency and a DPA — paperwork, not a
decision-trace schema. The buyer with this pain at a self-serve price is the operator publishing
under someone else's brand name with direct client liability, an existing approval culture and
per-brand pricing. Sell it as **client-liability control and per-client blast-radius
containment**.

**Three pieces get the differentiation budget. Two ship as competent table stakes.**

#### Table stakes (built well, not marketed as new)

- **`autonomy_policy`** scoped per workspace/node/channel/action-type with modes
  `off | propose | approve_required | auto_within_budget | auto`, hard budgets (posts/day,
  replies/hour, spend/day), guardrail references, escalation triggers and a reversibility
  window. Note that a **configurable per-profile publish cap with override and audit** is itself
  a real wedge, because the primary benchmark's 25/day cap is not configurable and that is a
  documented complaint.
- **Decision traces** — the audit log with a richer payload, split into an immutable non-personal
  skeleton and an erasable tombstoned content payload (§4.11), because an unqualified
  immutability promise is unshippable under GDPR Art. 17.

#### The three that are actually unclaimed

**(i) MCP / API write-safety enforced server-side.** P0-EXCEED in the corpus's own parity table,
cheap, and no commercial vendor has it.

The threat model, stated correctly: MCP has had `destructiveHint` annotations since spec
2025-03-26 and elicitation since 2025-06-18, and the major clients gate tool calls by default.
The real problem is that **client-side consent is advisory, unenforceable, and absent entirely
for headless agents** — so the publish gate must live on the server.

```
 inbound MCP / API write
        │
        ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │ 1. SCOPED AGENT TOKEN     bound to (workspace, node subtree,      │
 │                           tool allowlist, budget, expiry)         │
 │ 2. DRY-RUN BY DEFAULT     every write returns a PREVIEW +          │
 │                           a confirm_token unless the token         │
 │                           explicitly carries live_write            │
 │ 3. PROPOSE → CONFIRM      confirm_token is single-use, short-TTL,  │
 │                           bound to the exact payload hash          │
 │ 4. HARD CAPS              posts/day, replies/hour, spend/day —     │
 │                           enforced server-side; a headless agent   │
 │                           cannot argue with them                   │
 │ 5. KILL SWITCH            per-token, per-node, per-workspace,      │
 │                           global; automatic pause on anomaly       │
 └──────────────────────────────────────────────────────────────────┘
```

**(ii) Shadow mode with a published agreement rate.** The default onboarding path for any
autonomy above `propose`. For N days the agent emits what it *would* have done alongside what
the human did, and the product reports agreement rate by action type, by node and over time.
Autonomy is then enabled from evidence rather than from a toggle. No commercial or open-source
precedent was found for this.

**(iii) A per-tenant exportable AI compliance report.** Assembled from data the kernel already
produces: AI inventory (which surfaces use AI and for what), disclosure configuration, approval
records, model providers and their roles, provenance and human-approval records. The corpus
calls this the single highest-leverage AI Act build and notes nobody in the category ships it.
**This is the sellable artifact; the decision trace is merely its substrate.**

#### Replay QA

A harness that runs a configured agent over historical inbox threads, comments and reviews and
scores outputs against a rubric **before** it touches a live account. The critical detail: the
customer's real history is **not in our system on day one**, and platform APIs will not give it
to us. Therefore the harness ships with a **curated synthetic corpus per vertical** — inbox
threads, comments and reviews written for the purpose — and switches to real history once
enough has accumulated.

#### Legal framing

Demote the EU AI Act from driver to supporting evidence: Art. 50(4b) bites only on AI-generated
text on matters of public interest, and Art. 50(4a) deepfake disclosure is not satisfied by an
approval record. The **binding** driver for the approval record is FINRA 2210 principal
pre-approval and SEC 206(4)-1, and for that buyer the record must (a) bind to an immutable
content version hash, (b) attest reviewer identity through **SSO**, not a raw Slack user id, and
(c) **export/journal into the customer's existing archive of record** (Smarsh, Global Relay,
Proofpoint, Hearsay) — integrate, do not replace.

### 8.7 Experimentation

**Only mechanism 2 is a headline: cross-account randomised trials, sold to franchise and
multi-location operators.** An agency managing 5–200 client brands is *not* a valid
randomisation population — a creative variant is not even applicable across two unrelated
clients. Only comparable-location networks are exchangeable.

| Element | Spec |
|---|---|
| **Eligibility gate** | ≥30 actively-posting comparable locations. Below that, the product says the test cannot run and explains why. |
| **Design** | **Crossover / within-location**: each location sees both arms across rounds. Parallel 50-vs-50 at n=50 only detects ~45% lift, which is not a useful test. |
| **Arms** | **Creative FEATURES** — hook archetype, format, length, CTA presence, face-in-thumbnail — not specific creative assets. Learned in a hierarchical/contextual model **pooled across the entire customer fleet** with per-account partial pooling. This moves n from per-account (hopeless at <200 lifetime posts, CV≈0.8) to fleet-wide (thousands of posts/day), makes cold-start work, and compounds with the benchmark panel. **This is the only version where the learning is defensible IP rather than a per-tenant statistics toy.** |
| **MDE up front** | Before the test runs: *"With your 42 locations posting weekly, this test can detect a 30% difference in 6 weeks; smaller differences will return 'inconclusive'."* This is the feature that makes the honest version sellable against the dishonest one. |
| **Reward** | Multi-objective: engagement AND sentiment AND brand-voice adherence AND follower retention, with brand safety as a **hard feasibility constraint, not a penalty**. Fixed 48h measurement window. Reward normalised by reach to defeat distribution confounding. Discounted/sliding-window arm statistics for non-stationarity. |
| **Single-account bandit** | **Demoted from a feature to an exploration scheduler** whose only job is to remove send-time selection bias. Never presented as an optimiser. |
| **Paid bridge** | Optional add-on. Described truthfully as a **paid-audience** creative signal *correlated with* — not an unbiased estimator of — organic quality. If shipped, it must use a real split test with equal-delivery enforcement, not a boost, and it must not gate the core product on an 8–12 week ads approval. |
| **Anti-duplication** | Engineered from day one: per-location token substitution in copy, staggered publish windows, rate shaping. **Never publish byte-identical creative to 50 accounts through one app ID** — that is how an app gets flagged. |

Before building: audit SOCi, Rallio, Chatmeter and Birdeye. They own this segment and the
corpus never checked them.

### 8.8 Evaluation and human-in-the-loop

| Layer | Mechanism |
|---|---|
| **Offline eval** | A golden set per job class per locale, scored by rubric-based LLM judges with a human-audited sample. Regressions block model-config deploys. Multilingual quality is explicitly measured, because it is a documented weakness across the whole category and non-English markets are underserved. |
| **Online eval** | A 1% audit sample of every enrichment path routed to the expensive model and compared. Drift alarms on disagreement rate. |
| **Calibration** | Any engagement prediction ships with a published reliability diagram. Calibration alone is a credibility weapon; an uncalibrated prediction is worse than none. |
| **HITL surfaces** | Propose-only by default; approval routing for anything above the node's autonomy mode; shadow mode as the onboarding path; a visible "why this was suggested" panel backed by the decision trace. |
| **Provenance** | Every AI-touched artifact carries model, version, prompt hash and the human who approved. Per-network AI labels are set where the API exists (TikTok `is_aigc`, YouTube altered-content declaration) and **the honest statement is made where it does not** (Meta exposes no API field). This is table stakes on two surfaces and impossible on the third — not a differentiator. |

---

## 9. Security and compliance

### 9.1 The threat model, stated plainly

The asymmetry is what makes this different from ordinary SaaS: **a breach of this vault does not
leak data, it leaks the ability to act** — to post, delete, message customers, run ads and change
page settings, in the customer's name, at scale, immediately. The damage is instant and public.
And platform retaliation compounds it: a mass-abuse event traced to our app ID gets the app
suspended, which kills **every** tenant's connections, including the unaffected ones.

Adversaries in descending order of realism: a compromised sub-processor; a compromised engineer
endpoint or CI/CD pipeline with production access; social engineering of internal support tooling;
application-layer flaws (IDOR, SSRF to metadata or KMS, token leakage in stack traces); insider
misuse; and platform-side mass token invalidation, which is not an attack but is operationally
identical to one.

### 9.2 The token vault

#### 9.2.1 Baseline controls

| # | Control |
|---|---|
| 1 | Tokens never stored in plaintext **anywhere** — including logs, exception traces, support tools, analytics events and CI artifacts. The most common real leak is a stack trace, not a database dump. Enforced by a redaction sidecar plus a CI scanner over log statements. |
| 2 | **Envelope encryption**: DEK encrypts data, KEK encrypts DEK, KEK lives in KMS/HSM and is never exported. |
| 3 | **AES-256-GCM** (AEAD). Random 96-bit nonces with a counted key-usage cap; never reuse a nonce with the same key. |
| 4 | **AAD binds ciphertext to context**: `tenant_id \| connection_id \| platform \| key_version`. Turns a missed tenant filter into a decryption error rather than a data leak. |
| 5 | **Per-tenant KEK** (§9.2.3). |
| 6 | The application **never holds a KEK** — it calls KMS `Decrypt` for the DEK, uses it in memory, discards it. |
| 7 | **Bounded, explicit DEK cache** — 5–15 min TTL, memory only, never swapped or dumped. The TTL is a deliberate documented security/performance trade. |
| 8 | **Separate trust domain for keys** — a KMS IAM policy the database credentials cannot satisfy. If the DB and the key are reachable by the same identity, envelope encryption is theatre. |
| 9 | **Revocation-first design** — a `reauth_required` state machine on every connection. Tokens die constantly in normal operation, and the same path serves incident response. |
| 10 | **Least-privilege scopes at OAuth time.** The best-protected token is the one that cannot do much. Also: over-asking triggers app-review rejection. |
| 11 | **Secret zero solved by workload identity** — IAM roles for service accounts / projected service-account tokens, so no long-lived bootstrap secret exists in a config file or environment variable. |

#### 9.2.2 Attribution on the decrypt path

The highest-signal detection available is: *any decrypt of a credential not attributable to a
scheduled job or an authenticated user action.* That requires an **attribution field on every
decrypt call**, and it must be built into the decrypt path from day one because retrofitting it
means auditing every call site.

```
decrypt(credential_id, reason: { kind: 'scheduled_publish' | 'user_action' | 'probe'
                               | 'agent' | 'support' | 'migration',
                                 actor_ref, correlation_id, node_path })
```

Decrypt calls with `kind='support'` additionally require an active, justified, time-limited
impersonation session and write a tenant-visible audit entry.

#### 9.2.3 The key hierarchy

```
 KMS / HSM  (per region — root key never leaves the region)
    │
    ├── region root
    │      ├── tenant_KEK[A]  ──┐
    │      ├── tenant_KEK[B]    │  KMS-resident, never exported
    │      └── tenant_KEK[C]  ──┘
    │              │
    │              ▼   KMS Decrypt(wrapped_DEK) → plaintext DEK (memory only, short TTL)
    │     ┌───────────────────────────────────────────────┐
    │     │ credential row                                 │
    │     │  tenant_id, connection_id, platform,           │
    │     │  key_version, wrapped_dek,                     │
    │     │  ciphertext (AES-256-GCM), nonce, auth_tag,    │
    │     │  aad = tenant|connection|platform|key_version  │
    │     └───────────────────────────────────────────────┘
    │
    └── BYOK / HYOK: the tenant_KEK lives in the CUSTOMER's KMS.
        They can revoke it and render their data unreadable to us — which is
        precisely the enterprise selling point, and no vendor in this category offers it.
```

What per-tenant keys buy, concretely: breach blast radius of one tenant instead of all;
**cryptographic** rather than procedural proof of deletion, including in backups; residency
enforced mechanically because an EU KEK in an EU KMS means US infrastructure cannot decrypt EU
data even if it obtains the ciphertext; independent per-tenant rotation; and BYOK/HYOK as a
natural upsell.

**This is the decision that must be made first**, because migrating from a global key to
per-tenant keys means re-encrypting every credential and every encrypted content row for every
tenant, online, while the platform is publishing on a schedule. That is a quarter of work and a
serious incident risk. Doing it at the start costs about two weeks.

#### 9.2.4 Cost and latency at ceiling scale

Per-tenant KEKs put a KMS `Decrypt` on the path to using a credential. At 500k tenants and 10M
connections that is both a latency and a cost item, and it is managed by four mechanisms:

| Mechanism | Effect |
|---|---|
| **Tenant-affine scheduling** | Publishing 50 posts for one tenant unwraps **one** DEK, not 50. The dispatcher partitions by connection but batches by tenant within a partition. |
| **Bounded DEK cache** | Short TTL, memory-only, keyed by tenant. Collapses KMS calls by orders of magnitude. |
| **Lazy KEK creation** | A tenant's KEK is created on first credential write, not at signup. Trial tenants that never connect an account never cost a key. |
| **Tiered key policy** | Free/trial tenants share a **regional pool KEK with per-tenant DEKs and AAD binding** — same isolation properties for the ciphertext-replay threat, weaker for crypto-shredding — and are promoted to a dedicated KEK on first paid conversion. Paid tenants always get a dedicated KEK. This keeps the key bill proportional to revenue instead of to signups. |

At roughly $1/key/month plus ~$0.03/10k requests, with lazy creation and tiering the key line is
a few thousand dollars a month at ceiling scale; **without caching, a high-volume publisher can
generate a surprising bill**, so it is modelled before launch and monitored per tenant.

#### 9.2.5 Rotation

| Secret | Policy |
|---|---|
| Platform access tokens | Continuously, by the platform's TTL. **Proactive refresh at ~50% of TTL with jitter** — never on the request path, never thundering at midnight UTC. |
| Rotating refresh tokens (X, TikTok) | Per use, **single-writer behind a per-connection distributed lock**. Two concurrent workers submitting the same refresh token is a real and common outage cause, and the platform may treat replay as theft and revoke the grant. |
| Tenant KEKs | Annually or on suspicion; KMS-native; DEKs re-wrapped lazily on next access with `key_version` tracking. |
| **Our OAuth client secrets** | Annually and on staff departure — **but verify per platform first**, because some platforms invalidate all tokens on client-secret change. This is a known footgun and belongs in a runbook, not in a policy. |
| Service credentials | Short-lived and dynamic; IAM-based auth over static passwords. |
| Human credentials | **No forced periodic rotation** (an anti-pattern). Phishing-resistant MFA (WebAuthn) matters far more. |

### 9.3 Crypto-shredding and the honest deletion story

| Event | Operation |
|---|---|
| Disconnect one account | **Upstream revocation at the platform**, delete the row, destroy that connection's DEK |
| Tenant closes account | **Destroy the tenant KEK** → all that tenant's ciphertext, in every store and every backup, becomes noise |
| Data-subject erasure | Per-record DEK where feasible; otherwise targeted delete + tombstone replay |
| Platform demands deletion | Scoped delete by platform and data class |
| Region exit | Destroy the regional key material |

**The asterisks are published, not buried**, because a deletion certificate without them is a
promise dressed as a fact:

1. The **KMS scheduled-deletion window** (typically 7–30 days) is the real outer bound of the
   deletion SLA and is stated as such in the DPA.
2. **Aggregates, audit logs and billing records are deliberately outside the shred** — aggregates
   because they are anonymous, audit because accountability requires it, billing because tax law
   requires it. Each carve-out is named.
3. **Backups are not selectively edited.** Erasure removes data from all live systems
   immediately; backups age out under a defined short rotation (30–35 days); and no restore
   returns erased data to production without applying a **deletion replay log** of tombstones.
   Crypto-shredding makes this argument cryptographic rather than procedural.
4. Retired keys kept for *rotation* are retained; keys destroyed for *erasure* are destroyed
   irrevocably. These two policies are separated explicitly so an operational key-retention rule
   cannot silently defeat the erasure guarantee.

### 9.4 DSAR and retention machinery

**Three-way DSAR problem**, three different answers:

| Requester | Our role | Response |
|---|---|---|
| Our customer's own user | Controller | Standard end-to-end DSAR flow |
| A member of the public — a commenter, DM sender, or listening subject | **Processor** | **We must not respond substantively.** Route to the tenant, assist, log. Responding directly would be processing outside instructions. |
| Our tenant asking us to fulfil a request they received | Processor | The Art. 28(3)(e) assistance obligation. **Self-serve tooling, not a support ticket.** |

The tenant-facing DSAR console can, for a given identifier: **search** across every data class,
**export** a structured result, **erase** with a documented verifiable outcome, **restrict**
processing (the forgotten Art. 18 right), and **log** the whole thing immutably. Built to the
strictest timeline (15 days) so GDPR's month and CCPA's 45 days are free.

Where we hold only a display name and cannot identify the subject, **we say so** — Art. 11
contemplates exactly this and relieves the obligation where identification is genuinely
impossible, but it requires demonstrating that, and it does not license deliberate
under-identification. And we do **not** build a cross-platform identity graph to solve it.

The **retention engine** is a scheduled enforcer, not a policy document: every data class has a
handler, every store registers one at build time, a store without a handler fails CI, and the
enforcer's runs are themselves audited. Retention is per tenant, per data class, with a
compliance-mode override, because GDPR pushes down and FINRA/SEC push up and they reconcile per
tenant, not globally.

### 9.5 Detection and kill switches

| Signal | Detects |
|---|---|
| KMS `Decrypt` volume per tenant vs baseline | Bulk exfiltration |
| Decrypt from an unexpected role, service or region | Lateral movement |
| Publishing rate anomaly per tenant/connection | Token abuse in progress |
| **Content-similarity spike across unrelated tenants** | Mass spam via compromised tokens — the historical signature of the worst incident in this category |
| Spike in platform-side auth errors | The platform detected abuse before we did |
| `reauth_required` transitions clustering in time | Mass platform revocation event |
| Decrypt not attributable to a job or a user action | The high-signal one (§9.2.2) |
| Geographic/ASN anomaly on admin login | Account takeover |

**Five kill switches exist before launch, not during an incident:** global publish pause;
per-tenant pause; per-platform pause; mass token revocation with forced re-auth; per-connection
quarantine. Each is a first-class audited operation with a required justification.

### 9.6 Offboarding as one audited transaction

This is the narrowed differentiator: **"Remove client" as a single audited revocation
transaction**, shipped inside the agency/white-label tier. It is the part that could not be found
anywhere in the corpus and the part an agency actually feels.

```
BEGIN offboarding(node_subtree, operator, reason)
  1. enumerate every connection under the subtree
  2. for each: adapter.revoke(conn)          ← UPSTREAM revocation at the platform,
                                                not a local row delete. Record the receipt
                                                or the failure, per connection.
  3. destroy each connection's DEK
  4. invalidate EVERY outstanding share link issued under the subtree:
       report links · shared calendars · approval links · repair links · portal invites
  5. remove client-side portal users (seat_class='client_portal') in the subtree
  6. rescind white-label domain / CNAME mapping and revoke its certificate
  7. suspend all scheduled targets in the subtree (state → CANCELLED_OFFBOARD)
  8. emit ONE immutable audit record: operator, timestamp, and an ITEMISED list of
     everything revoked — including any revocation that FAILED, named explicitly
COMMIT  (compensating actions logged where a remote revocation cannot be rolled back)
```

Partial failure is the normal case (a platform is down; a token was already dead), so the
transaction is a **saga with per-item outcomes**, and the audit record shows exactly which items
succeeded and which need manual follow-up. Reporting a clean sweep when three revocations failed
is the exact failure mode this feature exists to prevent.

**The exit pack is reframed, not deleted.** It is folded into the migration engineering (§G5) and
shipped as an **authenticated, expiring, account-owner-only export**, generated *while the
connections are still live* — not a public URL, not a hosted permanent bundle. The reason is
structural: a frozen bundle that survives disconnect and is handed to the next agency violates
platform rules #2 (no transfer of platform data to third parties), #4 (delete platform data when
the user disconnects) and #5 (honour upstream deletions) in exactly the configuration a viral
link proposes. A one-time authenticated export to the authorised owner at the moment the
connection is live is defensible; the viral public link is not.

**Employee offboarding** is a property of the audit log rather than a product: a departed
employee's posts, replies and approvals remain attributable after their seat is gone, because
the audit skeleton references a pseudonymous actor id whose display resolution is separate from
the seat. This is **matching** the enterprise incumbents, not exceeding them.

### 9.7 SOC 2 / ISO control mapping

The controls below are the ones auditors ask for in this category specifically, mapped to where
they are implemented rather than to a policy binder.

| Control area | Implementation |
|---|---|
| Logical access | SSO (SAML + OIDC), **SCIM provisioning**, MFA that **coexists with SSO** (the benchmark makes them mutually exclusive, which is a documented complaint), role capabilities (§4.3), time-boxed grants |
| Change management | Trunk-based with required review, signed commits, immutable build artifacts, migration review gate for any schema touching a tenant table |
| Logging and monitoring | Audit skeleton (hash-chained, exportable), per-tenant audit export, decrypt attribution, detection signals (§9.5) |
| Vendor management | Sub-processor register **naming AI model providers and their roles** — a rising enterprise gate — with flow-down obligations and documented deletion SLAs |
| Data protection | §9.2, §9.3; encryption in transit and at rest; per-tenant keys; BYOK on enterprise |
| Availability | Multi-region, cell isolation, documented RTO/RPO per data class, tested restores including the deletion replay log |
| Incident response | Kill switches, runbooks per platform, breach-notification timers per jurisdiction, tenant-visible incident history |
| Platform compliance | A named per-platform compliance owner, a calendar of recurring obligations (Meta's annual Data Use Checkup and Data Protection Assessment are an **app-wide kill switch** — a missed response is a Sev-1), and an internal **data-use register** mapping every field we read to the approved purpose that justifies it |

**What actually causes app suspension**, in observed frequency order, is worth stating because it
shapes operations more than any control: failing or ignoring an annual review; scope creep beyond
what app review approved; retention violations found in audit; scraping or unofficial access;
sharing data across app IDs or between tenants; rate-limit abuse and retry storms; mass user
reports triggered by a tenant's spammy behaviour; and misrepresentation in app review. **Our
tenants' conduct is our compliance problem**, which is why trust-and-safety controls over tenant
behaviour protect platform access, not merely reputation.

---

## 10. Infrastructure

### 10.1 Languages and frameworks

| Layer | Choice | Rationale |
|---|---|---|
| **API, web app, adapters** | **TypeScript on Node 22+** | Already the repo's foundation. One language across the composer's validation logic and the server's validation logic is worth a great deal here specifically: the capability descriptor and the validator must behave identically in the browser and in the dispatcher, and shipping them as one shared package is how that stays true. |
| **Dispatcher, publish workers, ingest workers** | **Go** | The hot path is I/O-bound fan-out across 60 networks with per-connection concurrency ceilings, circuit breakers and strict latency budgets. Go's goroutine-per-request model and predictable GC make the per-network worker pools simple and cheap. The adapter *contracts* are shared as generated types from one schema; the adapter *implementations* live in Go for tier-1 volume networks and in TypeScript for the long tail, where iteration speed matters more than throughput. |
| **Analytics transforms, ML, experimentation** | **Python** | dbt, the hierarchical models, the enrichment encoders, and the eval harness. |
| **Mobile** | **Swift + Kotlin, native** | The reminder-publish runtime is the product on mobile: background prefetch, notification handling, camera-roll writes, deep-link recipes and share extensions are all platform-specific and all are where the reliability semantics live. A cross-platform wrapper would put the differentiator behind an abstraction that does not model it. |
| **Schema-first contracts** | Protobuf for internal service contracts; OpenAPI for the public API; JSON Schema for capability descriptors | Adding a network must be a data change validated by CI. |

### 10.2 The runtime picture

```
  ┌──────────────────────────── GLOBAL CONTROL PLANE (no PII) ────────────────────────────┐
  │  identity/SSO directory · billing · entitlements · feature flags · capability          │
  │  descriptor registry · deploy orchestration · aggregate (non-identifying) telemetry    │
  └───────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │  (control only — a CI lint FAILS the build if a
                                          │   PII-tagged column is referenced from here)
   ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
   ▼                      ▼                               ▼                      ▼
 REGION eu-west      REGION us-east                  REGION ap-southeast     REGION cn (separate
   │                    │                                 │                   legal entity, ICP-
   │  ┌────────────┐    │  ┌────────────┐                 │                   filed callbacks,
   ├─▶│  CELL 001  │    ├─▶│  CELL 101  │                 ├─▶ …               no shared plane)
   │  │  Postgres  │    │  │            │
   │  │  Redis     │    │  │            │
   │  │  workers   │    │  │            │
   │  │  N tenants │    │  │            │
   │  └────────────┘    │  └────────────┘
   ├─▶ CELL 002 …       ├─▶ CELL 102 …
   │
   ├─ regional shared:  Kafka · ClickHouse · OpenSearch · object storage · KMS root
   └─ regional edge:    webhook receivers on region-appropriate domains
```

### 10.3 Cells

A cell is a full vertical slice — Postgres primary + replicas, Redis, worker pools, and a share
of the regional log — serving a bounded set of tenants (target: ≤25k tenants or ≤500k connections
per cell, whichever binds first).

| Property | Consequence |
|---|---|
| **Blast radius** | A bad migration, a runaway tenant or a Postgres incident affects one cell, not the region. |
| **Deploy safety** | Releases roll cell-by-cell with automatic halt on SLO regression. |
| **Noisy neighbour** | Fair-share limits are enforced within a cell where the contention actually is. |
| **Enterprise isolation** | A dedicated cell is a purchasable SKU, and it is a configuration rather than an architecture change. |
| **Scaling** | Growth adds cells rather than growing one database. The scheduler's hot index stays small. |

Cell assignment is stored on the organization and is stable; rebalancing is an explicit, audited
migration with a runbook.

### 10.4 Multi-region and residency

| Concern | Design |
|---|---|
| **Region choice** | Set at tenant creation, immutable, surfaced in the UI and the DPA. |
| **What lives regionally** | All D1 credentials, D3 content, D4 audience, D6 listening, D7 inbox, media objects, KMS root and tenant KEKs, webhook endpoints on region-appropriate domains. |
| **What lives globally** | Account identity, billing, entitlements, feature flags, capability descriptors, and **non-identifying** aggregates. |
| **Enforcement** | A schema-level PII tag on every column plus a CI lint that fails the build if a PII-tagged column is referenced from a control-plane service. Policy alone does not survive feature growth. |
| **Transfers** | SCCs (Modules 2 and 3) as the belt-and-braces mechanism with a documented TIA, and adequacy or framework mechanisms treated as **not load-bearing** — the framework's stability is the least reliable assumption in the compliance corpus, so the architecture must remain correct if it disappears. |
| **China** | A separate legal entity, separate infrastructure, ICP-filed callback domains, no shared control plane, and its own adapter set (WeChat's component/ticket model with a centralised token minter because `/cgi-bin/token` has a daily refresh cap). Treated as a distinct product decision, not a region toggle. |
| **AI inference** | Region-pinned endpoints per tenant policy, with the ~10% regional premium budgeted. |

### 10.5 Media pipeline

```
 upload (resumable, multipart, direct-to-object-storage with signed URLs)
    │
    ▼  antivirus + content-type sniff + EXIF strip (retaining C2PA where present)
 MASTER (object storage, region-pinned)
    │
    ▼  transcode fan-out driven by the CAPABILITY DESCRIPTOR, not by hardcoded presets
 RENDITIONS  per (network, format): codec, container, resolution, aspect, bitrate,
             duration trim, loudness normalisation, thumbnail extraction
    │
    ├──▶ CDN (signed, short-TTL URLs) — because Meta and TikTok PULL media from a public URL
    └──▶ direct upload path (chunked) — YouTube 8 MB, LinkedIn 2 MB parts + ETags,
                                        TikTok 5–64 MB, X 1 MB
```

Two details that matter more than they look:

- **Several platforms pull media from a public HTTPS URL rather than accepting an upload.** That
  means renditions must be servable from a CDN with URLs that are public enough for the platform
  to fetch and short-lived enough not to be a leak. Signed URLs with a TTL slightly longer than
  the platform's container expiry, plus per-URL access logging, is the shape.
- **Container expiry is a state, not an error.** Meta containers expire at 24h; the state machine
  restarts from `RENDITIONS_READY`, not from `SUBMITTED`.

Transcoding runs on a preemptible GPU/CPU pool with a queue that is separate from publishing, so
a transcode backlog cannot delay a publish that already has its renditions.

### 10.6 Cost model at scale

Order-of-magnitude, at a mid-point of the ceiling targets (1M connected profiles, 5M scheduled
publishes/day, 100M mentions/month, 50k tenants). All figures `C3`; the purpose is the *shape*,
not the total.

| Component | Driver | Monthly, order of magnitude |
|---|---|---|
| Compute — API + web | Request volume | $25–40k |
| Compute — dispatcher + publish workers | Publishes/day; I/O bound, cheap per unit | $15–25k |
| Compute — ingest + poll workers | **Poll frequency × connections** — the dominant lever | $30–60k |
| Postgres (cells) | Connections + content + conversations | $40–70k |
| Durable log | 5B events/day at 7-day retention | $30–50k |
| ClickHouse | ~100B rows/yr, hot 13 months | $25–45k |
| OpenSearch | Hot 90 days of mentions + inbox | $30–60k |
| Object storage + CDN | Masters + renditions + egress to platforms | $20–40k |
| Transcode | Video minutes | $10–30k |
| KMS | Lazy + tiered keys, cached DEKs | $3–8k |
| **AI — text** | Cached prefixes, cheap-tier routing | **$5–15k** |
| **AI — media** | Metered to the customer; roughly pass-through | variable, margin-positive |
| **AI — listening enrichment** | Self-hosted encoders + 2–5% LLM tail | $8–20k |
| **X API** | **The only platform with a direct marginal cost** `[FRAGILE]` | $5k–$42k+, tier-dependent |
| Licensed data (optional L3) | Contract | $0 until enterprise ARR funds it |
| **Total** | | **~$250–450k/month** |

Three observations that drive design rather than finance:

1. **Poll frequency is the largest controllable cost.** Adaptive polling driven by observed event
   rate, plan tier and the published SLA floor is worth more than any compute optimisation. It is
   also why webhook coverage per platform is an architectural priority.
2. **AI is not the cost centre the market assumes.** With cached prefixes and cheap-tier routing,
   text generation is a rounding error, which is exactly why "unlimited text, metered media" is
   both honest and affordable.
3. **X is a discontinuity, not a line item.** It is the only place where a customer's usage maps
   to a direct external bill, and its pricing is unverified. It gets a per-tenant cost ledger and
   an explicit plan allowance so the exposure is bounded by design.

---

## 11. Deployment, testing, observability, and integration health

### 11.1 Deployment

| Practice | Detail |
|---|---|
| Trunk-based, small changes, feature-flagged | Flags resolve through the same node tree as everything else, so a flag can be enabled for one brand of one agency. |
| **Cell-by-cell rollout** | Canary cell → 5% of cells → 25% → all, with automatic halt on SLO regression. A publish-path regression is caught on one cell's traffic, not on everyone's calendar. |
| **Capability descriptors deploy independently** | A platform limit change is a config PR with its own review and its own rollback, not a service release. This is what keeps the reaction time to a platform change measured in hours. |
| Schema migrations | Expand/contract only; a migration touching a tenant table requires a second reviewer and a written rollback; RLS policies are asserted by tests, not assumed. |
| **Publish-path freeze windows** | No deploys to the dispatcher or publish workers during a tenant's declared high-stakes window (product launch, earnings, Black Friday), declared through the same blackout-window primitive that powers holds. |

### 11.2 Testing

| Layer | What it proves |
|---|---|
| **Adapter conformance suite** | A shared battery parameterised by the capability descriptor. A network declaring `editPost: true` is *tested* for edit; one declaring `removalSignal: 'explicit_field'` is tested for removal detection; one declaring `idempotency: 'read_back_check'` is tested for duplicate suppression under a lost response. **The descriptor cannot lie without failing CI.** |
| **Recorded cassettes** | Real request/response pairs per adapter, refreshed on a schedule against sandbox or internal test accounts. A platform's shape change fails CI rather than production. |
| **Contract tests against live sandboxes** | Where the platform offers one (Meta test users and dev mode, TikTok sandbox with `SELF_ONLY`, YouTube test channel, LinkedIn dev tier). Run nightly, not per-PR, because they are slow and rate-limited. |
| **Cross-tenant isolation property test** | Generated from the route table: tenant A's credentials, tenant B's object id, assert 403/404. New endpoints are covered by default. |
| **Time-correctness suite** | A corpus of scheduled rows across every IANA zone, replayed against each tzdb release, asserting that wall-clock intent is preserved. Includes DST-ambiguous and DST-nonexistent local times under each disambiguation policy. |
| **Hold semantics suite** | Fail-closed on unlabeled content; each of the three policies; native-scheduled unschedule failure surfacing; restore-queue completeness (every held item is in the queue exactly once). |
| **Idempotency chaos test** | Kill the worker between claim and call, between call and response, and between response and persist, for each of the four idempotency strategies, and assert no duplicate on the network. |
| **Load test against the peak shape** | Not average throughput — the `:00` spike. 5,000 publishes/second arriving in one second, with per-network ceilings intact. |

### 11.3 Keeping 60+ fragile integrations healthy

This is the part that decays silently, so it gets its own machinery.

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. SYNTHETIC CANARIES                                                        │
 │    Per network, on our own owned test accounts, on a schedule:               │
 │    connect → validate → publish → read back → fetch metrics → delete.        │
 │    Failure pages the integration owner and flips the network's public        │
 │    status badge. This is how we learn about a breaking change BEFORE a       │
 │    customer's 09:00 post does.                                               │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. CAPABILITY DRIFT DETECTION                                                │
 │    Nightly: probe each platform's live limits where queryable (IG            │
 │    content_publishing_limit, TikTok creator_info, Reddit post_requirements,  │
 │    X usage) and DIFF against the descriptor. A drift opens a ticket with     │
 │    the before/after.                                                         │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. DEPRECATION WATCH                                                         │
 │    A scheduled task per platform changelog + a named owner per platform.     │
 │    Meta versions ship ~quarterly with ~2-year support; LinkedIn's            │
 │    LinkedIn-Version header has 12-month support. Version is per-integration  │
 │    config with a migration flag, so an upgrade is staged per network and     │
 │    per cell.                                                                 │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 4. STALENESS BUDGET ENFORCEMENT                                              │
 │    Descriptor age > budget → dashboard flag. Age > 2× budget → the network's │
 │    IntegrationStatus downgrades from general_availability to limited_access  │
 │    until re-verified. Automated honesty.                                     │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 5. ERROR-CLASS TELEMETRY                                                     │
 │    Every error class by network by hour. Two alarms that matter:             │
 │      · UNKNOWN rate > 0.1%          → the taxonomy has a gap                 │
 │      · VALIDATION_FAILED rate > 0   → pre-flight has a gap, with an owner    │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 6. SELF-HEALING                                                              │
 │    · Automatic per-connection quarantine after N consecutive auth failures,  │
 │      with a repair link queued rather than a retry storm.                    │
 │    · Automatic circuit-breaker open per (network, cell) with visible state.  │
 │    · Automatic backoff-and-reschedule inside the lateness budget.            │
 │    · Automatic WebSub lease renewal and webhook re-subscription.             │
 │    · Automatic rendition re-generation when a container expires.             │
 │    · Automatic descriptor rollback if a config deploy raises the             │
 │      VALIDATION_FAILED rate on any network.                                  │
 └─────────────────────────────────────────────────────────────────────────────┘
```

**The observed-failure corpus (§3.7) closes the loop**: every production rejection becomes a
candidate destination rule, which becomes a pre-flight check, which prevents the next one. That
corpus is the only asset in this area that compounds with volume and cannot be copied from
documentation — which is precisely why the honest framing of the whole reliability story is *"we
did the boring thing completely"*, not *"we found an unclaimed technical frontier"*.

### 11.4 Observability

| Signal | Detail |
|---|---|
| **Golden signals per network per cell** | Publish success rate, p50/p95/p99 end-to-end latency (schedule → verified live), error class mix, retry depth, queue depth, rate-limit headroom |
| **Per-tenant reliability ledger** | The same numbers, scoped to one tenant, **exportable**, so an agency can forward it to a client. This is the artifact that survives a procurement question. |
| **Trace propagation** | One correlation id from composer keystroke through validation, approval, dispatch, adapter call, read-back and metric collection. The support answer to "why did this stop working" is a trace lookup, not an archaeology project. |
| **Per-connection failure history** | Retained and surfaced in Connection Health, because support answering "why did this stop working" is a documented gap in the category. |
| **Cost telemetry as a first-class signal** | KMS decrypts, AI spend, X reads and poll volume per tenant — surfaced internally per tenant and externally as usage. |

### 11.5 The two reliability artifacts, with different buyers

| Artifact | Audience | Contents | Risk managed |
|---|---|---|---|
| **Contractual SLA with service credits** | Procurement | Publish success rate excluding platform outage and content rejection, availability, support response. "No SLA with service credits" is a named procurement blocker in the corpus, so **this is the version that closes deals**. | Requires the error taxonomy to be precise enough to defend the numerator, and requires a documented exclusion list. |
| **Per-tenant in-app reliability ledger** | The customer, and the customer's client | This tenant's success rate, retries, latency, removal events, exportable | None — it is their own data |
| **Public aggregate reliability page** | *Deliberately not shipped by default* | — | It is a hostage handed to competitors, the denominator is uncontrolled, a rival can publish a friendlier one tomorrow, and disclosure invites SLA obligations. Ship only if prepared to keep publishing it during a Meta outage. |

---

## 12. Roadmap

Sequencing logic, stated before the phases, because it explains every ordering choice:

1. **Calendar-time dependencies start on day 1 and never get faster by starting later.** Meta
   Business Verification and App Review (4–12 weeks with normal rejection rounds), LinkedIn
   Community Management / MDP (4–12+ weeks, opaque, rejection common), TikTok content-posting
   audit (2–8 weeks, and it audits *our UI*), Google OAuth verification plus the YouTube quota
   extension (2–8 weeks, longer and often denied), Pinterest Standard (2–6 weeks), GBP access,
   Reddit's commercial conversation. **The approval portfolio is the primary project plan and
   the software is what fills the waiting time.**
2. **Networks sequence by gate cost, not by popularity**, and the ordering is self-bootstrapping:
   free-and-instant (Bluesky, Mastodon, Telegram, Discord, Slack, blogs) → short-review
   (Pinterest, GBP, Reddit) → long-review (Meta, TikTok, YouTube) → indefinite (LinkedIn org) →
   metered (X, last, gated to paid tiers). Shipping the free ones first produces the live product
   that the later applications require as evidence.
3. **Non-retrofittable decisions go in Phase 0** regardless of when the feature that needs them
   ships (§0.2).
4. **Parity before depth, except where depth is the demo.** The product must survive a
   feature-matrix comparison, so P0 parity items outrank most exceed items — but the three
   cheapest exceed items with the highest demo value (restore review queue, handover digest,
   coverage transparency) are pulled forward because they cost days and change the sales
   conversation.

### Phase 0 — Foundations (weeks 1–4)

**Goal: make the five irreversible decisions, and file every application.**

| Workstream | Deliverable |
|---|---|
| **Applications (day 1)** | Meta Business Verification + App Review packet; LinkedIn Community Management; TikTok developer registration + audit prep; Google Cloud project, OAuth consent screen, **quota extension request**; Pinterest trial→standard; GBP access request; Reddit commercial conversation. Named owner per platform, calendared. |
| **Key hierarchy** | Per-tenant KEK envelope encryption with AAD binding, lazy creation, tiered policy, decrypt attribution. **Nothing writes a credential before this exists.** |
| **Time substrate** | `(wall-clock, IANA)` storage, dispatch-time resolution, tzdb pipeline with staleness alarm, DST disambiguation policy, CLDR `weekData` for calendar chrome, dual-time rendering. |
| **Node tree** | Arbitrary-depth hierarchy with materialised path, inheritable settings resolution, node grants with seat classes. |
| **Residency seam** | Control/data plane split, PII column tagging, the CI lint that fails on a cross-plane PII reference. One region live; the seam correct. |
| **Adapter fabric v0** | Capability descriptor schema and registry, error taxonomy, three-verb publish contract, hardened outbound HTTP client with the SSRF guard, per-network token buckets, idempotency strategies, conformance-suite harness. |
| **First three networks** | **Bluesky, Mastodon, Telegram** — no approval required, three different archetypes (B, C, D), which proves the abstraction rather than the integrations. |
| **Audit skeleton** | Hash-chained immutable skeleton + erasable payload, from the first write. |

**Why this and nothing else:** every item is either a calendar dependency that must start now or
a decision that costs 2 weeks now and a quarter later. No customer-visible feature ships in
Phase 0 and that is correct.

### Phase 1 — A product that can be sold (months 2–6)

**Goal: parity on the P0 checklist for the networks we are approved for, plus the three cheap
demo differentiators.**

| Area | Ships |
|---|---|
| **Networks** | Facebook Pages, Instagram, Threads (one auth family, highest demand, Threads nearly free once IG is done) → Pinterest, YouTube → GBP, Reddit, Discord, Slack. LinkedIn and TikTok when their gates clear; X last and gated. |
| **Publishing** | Composer with per-network variants, pre-flight validation, first comment + scheduled comments, calendar with drag-drop and filters, queues with labelled slots, CSV bulk import, media library with alt text, **the full publish state machine with idempotency, typed errors, lateness budget and authenticated read-back reconciliation**. |
| **Reminder publish** | The never-drop-the-slot runtime for IG Stories-with-stickers, IG personal and TikTok creative formats, with the honest capability matrix shipped as a public page. |
| **Holds** | The `PublishingHold` object, three policies, fail-closed label scoping, **the restore review queue with bulk re-slot** (cheap, and the best demo moment), recurring blackout windows. Crisis preset organic-only. |
| **Governance basics** | SSO, SCIM, audit log with export, per-node permissions, approval workflows with **free reviewer seats and decision-by-link**, plus the SLA ladders, digests, OOO delegation and the **interactive Slack and Teams apps** — time-and-place before the rules engine. |
| **Connection health** | Full state model, T-14/T-3 for scheduled expiries, daily read-only probes, single-writer refresh, batched repair links. Not tier-gated. |
| **Analytics** | Three-layer metric model, daily snapshotting including `followers_at_post_time`, **backfill-on-connect**, the report catalogue, white-label PDFs, scheduled delivery. |
| **Inbox** | Unified inbox, assignment, saved replies, macros, sentiment with rationale, the **two-clock send-eligibility engine**, and the **per-channel SLA floor** published in-product. |
| **AI** | Brand voice per node, node-isolated RAG, caption/hashtag/reply/alt-text generation with cached prefixes, unlimited text and metered media in human-readable units, pre-flight cost estimate, novelty scoring. |
| **Migration** | Vendor CSV parsers, the bulk OAuth wizard with per-network troubleshooting, the side-by-side reconciliation report. |
| **Offboarding** | The single audited revocation transaction (it is cheap once connections and share links exist, and it is a closing argument in agency deals). |

**Why this order:** parity is the price of entry and cannot be deferred; the holds restore queue,
the handover digest and coverage transparency cost days each and change demos; and backfill-on-
connect is the switcher weapon that makes every subsequent sales conversation easier.

### Phase 2 — Depth where the money is (months 7–14)

| Area | Ships |
|---|---|
| **Hierarchy product** | Locked templates with publish-time diff enforcement, per-level approval overrides, per-location merge fields, the compliance roll-up ("which of my 340 locations are dark"), per-location review response with approved templates. Sold to the 5–75 location band **and** to agencies — same data model. |
| **Warehouse-native** | Iceberg tables, the conformed metric SQL views, the dbt package, row-level mention export, then Snowflake Native App / BigQuery listing / Delta Share, then reverse-ETL hooks. |
| **Listening** | L0 + L1 complete (Bluesky Jetstream unsampled, YouTube comments, open-web crawl, Twitch chat), hybrid enrichment, versioned queries, Boolean+proximity query language, **coverage class and quota meter on every result set**. L2 metered sources behind explicit plan gates. |
| **Autonomy kernel** | Server-side MCP/API write safety (dry-run default, propose→confirm, scoped agent tokens, hard caps) — pulled as early as the MCP server ships, because shipping an MCP server *without* it is the actual risk. Then policy objects, decision traces, shadow mode with agreement rate. |
| **Rights ledger** | Own-originated grants, the live-permission→live-spend dependency join, per-class enforcement with override records, the whitelisting-expiry alert with 7-day lead. |
| **Coverage** | Duty rosters as a thin input, the **handover digest**, escalation ladders wired to on-call. |
| **Reviews** | Review-request campaigns (email/SMS/QR/widget), GBP + Facebook response — and **not** Yelp/TripAdvisor response, which is impossible, nor anything resembling review gating, which is prohibited. |
| **Second region** | EU data plane live, exercising the seam built in Phase 0. |
| **Reliability artifacts** | Contractual SLA with service credits; per-tenant exportable reliability ledger. |

### Phase 3 — The compounding assets (months 15–30)

| Area | Ships |
|---|---|
| **Experimentation** | Multi-location randomised trials with the ≥30-location gate, crossover designs, MDE-up-front, fleet-wide hierarchical creative-feature priors. This is last because it **requires fleet scale to work at all** — it is the one differentiator that cannot be bootstrapped. |
| **AI compliance report** | The per-tenant exportable artifact, once there are enough decision traces and approval records to populate it. |
| **Benchmark panel** | Percentile benchmarks with k-anonymity and opt-out; cold-start best-time model from hierarchical pooling. |
| **Regional expansion** | APAC data planes; regional networks by market priority (LINE, Kakao, Naver, VK where lawful, Zalo, ShareChat); the China entity as a separate decision with its own business case. |
| **Enterprise** | BYOK/HYOK, dedicated cells, archive journalling to Smarsh/Global Relay/Proofpoint/Hearsay, FINRA/SEC retention modes, SOC 2 Type II completed and ISO 27001 in progress. |
| **Advocacy, commerce, creator** | Employee advocacy with EMV; product tagging; the creator contact graph joined to the existing asset ledger. |
| **Rules engine** | The conditions/quorum approval rules engine — deliberately after the time-and-place layer, with a small closed condition vocabulary and templates rather than a general-purpose builder, because the full engine is the part most likely to be configured once and never understood. |

### What is deliberately deferred or declined

| Item | Decision |
|---|---|
| Cross-platform mention-velocity crisis triggering | Deferred until enterprise ARR funds X/Reddit data. Owned-channel comment/DM sentiment velocity only, until then. |
| Public aggregate reliability page | Declined by default (§11.5). |
| Listings syndication (Yext-style) | Declined — a publisher-network data licensing cost floor, not an engineering task. |
| Yelp / TripAdvisor review response | Impossible: no owner OAuth, no response API. Presence monitoring only, stated honestly. |
| Agent capacity and concurrency management | Post-PMF. Only enterprise buyers ask, and they already own it. |
| Manual metric capture | Out of v1; quarantined if ever shipped, because it contaminates metric provenance. |
| Hebrew sunset-interval modelling, Persian calendar, Hijri date entry | Cut (§2.3 row 7). |
| Firehose licensing, TikTok Research API, Meta Content Library, face recognition | Never. |

---

## 13. Risks

Ordered by expected damage. Each row is a real risk with a real mitigation, not a hedge.

| # | Risk | Why it is serious | Mitigation |
|---|---|---|---|
| **1** | **Platform approval denied or delayed** — Meta App Review, LinkedIn MDP, TikTok audit, YouTube quota extension | The approval portfolio *is* the moat, and it is also the critical path. LinkedIn is the most opaque gate in the set with thin rejection feedback; the YouTube quota extension is frequently denied. Without approvals, the software has nothing to talk to. | File everything on day 1 with a named owner per platform. Sequence networks by gate cost so a live product exists as evidence for later applications. Build the TikTok composer branch to the published UX checklist *before* submitting. Keep a **vendor scaffolding fallback** (publish through an API-first vendor behind our own adapter interface) so a delayed approval delays a network, not the product. Design analytics to **degrade gracefully** without Page Public Content Access, which we assume we will not have at launch. |
| **2** | **App-wide suspension from a compliance miss** | Meta's annual Data Use Checkup and Data Protection Assessment are an app-wide kill switch; a failure revokes permissions for *every* tenant at once. Ignoring an annual review is the single most common suspension cause in the category, and the most preventable. | Named per-platform compliance owner; obligations calendared 90 days ahead; a missed response is a **Sev-1** with a paging policy. An internal data-use register maps every field we read to the approved purpose. Tenant trust-and-safety controls, because our tenants' conduct is our compliance problem. |
| **3** | **Vault compromise** | Leaks the ability to *act*, publicly, instantly, across the customer base. | §9 in full: per-tenant KEKs, AAD binding, no application-held KEKs, decrypt attribution, five pre-built kill switches, content-similarity anomaly detection across tenants, workload identity instead of bootstrap secrets. |
| **4** | **Duplicate posts** | The most reputationally damaging failure in this category, because the customer's audience sees it. | Four layered idempotency strategies (§5.4) selected by capability descriptor; a chaos test that kills the worker at each of three points for each strategy; read-back before any retry where the platform gives no idempotency mechanism. |
| **5** | **X pricing invalidates the plan model** `[FRAGILE]` | X is the only metered platform, its tier caps are `C3` and per-post pricing is `UNVERIFIED`. A single wrong number could invalidate the pricing table. | Per-tenant X cost ledger from day one; explicit plan allowances; composer shows marginal cost; X shipped last and gated to paid tiers; BYO-credentials path for heavy users; re-verify before any pricing commitment. |
| **6** | **A silent correctness bug in the time model** | Its symptom is "the post went out at the wrong hour", which customers experience as incompetence and which is invisible in tests that use one timezone. | Wall-clock + IANA storage; the tzdb replay corpus across every zone in CI; drift alarm on `tzdb_version` mismatch for future rows; explicit DST-ambiguity policy; dual-time rendering because UI confusion is the actual dominant cause of 3am posts. |
| **7** | **The hold fails partially and silently** | An operator believes publishing is frozen while a natively-scheduled post goes out anyway. This turns a safety feature into an incident. | Self-dispatch as default; mandatory unschedule call with a per-item recorded outcome; **loud** partial-hold failure banner and per-item badge; fail-closed label scoping; a dedicated hold-semantics test suite. |
| **8** | **Warehouse-native gives away the lock-in** | The strongest switching costs in this category are data-custody costs, and this hands them over. | Deliberate, not accidental: give away raw data, keep derived intelligence (benchmark panel, models, alerting, workflow). Market portability *as* the differentiator, which no competitor can match without giving up their own lock-in. Pair it with backfill-on-connect so the same capability that reduces our lock-in destroys the incumbent's. |
| **9** | **Fast-follow on the governance differentiators** | Crisis hold, approvals routing and connection health are Gates, not moats — a determined competitor ships a basic version in a quarter. | Do not price them standalone; bundle into the governance plan alongside approvals, audit and SSO. Expect them to **close deals, not carry a price**. Budget 12 months of lead on the autonomy kernel, not a moat. Concentrate durable investment on the things that compound: the observed-failure corpus, the benchmark panel, the fleet-wide creative priors, and the approval portfolio. |
| **10** | **Scope collapse under parity pressure** | 75 parity items plus twelve differentiators plus every region is enough work to produce a product that is broad and bad everywhere. | The composition principle (§1.3): eleven services own eleven nouns and modules are views, not silos. Ruthless phase gating. The declined list (§12) is enforced, and additions to it are cheaper than additions to the roadmap. |
| **11** | **Multi-location segment is already owned** | SOCi, Rallio, Birdeye, Chatmeter and peers own this segment and the corpus has **zero mentions of SOCi** — every downstream conclusion inherits that hole. | Run the competitive audit **before** committing engineering to the franchise GTM. Target the 5–75 band, not 340-location enterprises sold through franchisor channel relationships we do not have. Compete on **suite depth** against thin local-marketing platforms, and on price/self-serve against the enterprise incumbent. |
| **12** | **Reminder-publish over-promises against OS reality** | iOS caps silent push at ~2–3/hour with a 30s budget, no app can foreground itself or write the clipboard on a schedule. Promising a scheduled-minute experience produces refunds. | Promise only what the OS permits: best-effort prefetch, one-tap transfer on open. Sell the reliability semantics, which are real. Budget deep links as a **permanent per-app-version QA line**, not a one-time build. Do the competitive teardown of Later/Planoly/Plann/Preview/Buffer mobile before building. |
| **13** | **Listening cost or coverage disappoints** | X reads are capped monthly at the *app* level; a Pro plan's reads divided across hundreds of accounts is a few dozen posts per account per day. Meta has no public search. Coverage claims that outrun reality generate churn. | Sell L0/L1 as complete and verifiable; show `coverage_class` and the quota meter on **every result set**; gate L2 explicitly by plan; do not offer L3 before enterprise ARR funds it. Honesty about coverage is the differentiator, and it is free. |
| **14** | **Regulatory divergence outpaces the model** | GDPR erasure vs FINRA retention pull in opposite directions; residency requirements multiply; the EU-US transfer framework is the least stable item in the compliance corpus. | Per-tenant, per-data-class retention with compliance-mode override. SCCs as the primary transfer mechanism so the architecture stays correct if a framework disappears. Residency enforced mechanically by regional KEKs rather than by policy. Deletion handlers registered at build time with a CI gate. |
| **15** | **Experimentation never reaches statistical power** | The honest version returns "inconclusive" more often than the dishonest version returns "winner", and customers may prefer the lie. | Report the MDE **before** the test runs, which reframes inconclusive as expected rather than as failure. Gate eligibility at ≥30 comparable locations. Pool across the fleet so the learning happens even when a single tenant's test does not resolve. Ship it in Phase 3 when fleet scale exists. |
| **16** | **Cost model breaks at scale via poll volume** | Poll frequency is the dominant controllable cost and it scales with connections × plan promises. | Adaptive polling driven by observed event rate, plan tier and the published SLA floor; webhook coverage prioritised per platform; backfill preemptible; per-tenant cost telemetry so an unprofitable cohort is visible before it is large. |
| **17** | **Key management becomes an availability dependency** | If KMS is unavailable, publishing stops for everyone in the region. | Bounded DEK cache with a deliberate TTL means a KMS blip does not immediately stop publishing; multi-AZ KMS; a documented degraded mode where cached DEKs serve until expiry and new connections fail closed rather than falling back to weaker crypto. |
| **18** | **The category's cheapest attack: a bake-off on network count** | Our honest capability matrix yields a *shorter* checkmark column than competitors who collapse auto-publish and reminder into one tick. | Lead with the matrix as a trust artifact rather than defending against it; make the amber badge explain *why*; and make sure the auto-publish column is genuinely deep on the networks that carry volume, so the comparison is won on the rows that matter rather than on row count. |

---

## 14. Inherited verification backlog

These are the corpus's own `UNVERIFIED` and `C3` items that this architecture depends on. Each
one is listed with what breaks if it is wrong, because that is what determines the order in
which they should be checked.

| # | Item | What depends on it |
|---|---|---|
| 1 | **X pricing and per-tier read/write caps** | The entire plan model; whether X publishing can be included at any tier (§5.5, §13.5) |
| 2 | **LinkedIn caching/retention limit** | Retention partitioning and how much LinkedIn data may be warehoused (§4.13) |
| 3 | **LinkedIn refresh-token gating for unapproved apps** | Whether every LinkedIn connection needs manual reconnection 6×/year (§7.4) |
| 4 | **TikTok refresh semantics** — does refreshing reset the 365-day clock? | Whether TikTok requires annual re-auth regardless of activity |
| 5 | **YouTube quota costs, current default, and whether extensions are still granted** | Whether YouTube is viable at scale without per-customer BYO projects (§3.3) |
| 6 | **Current Meta Graph API version and its deprecation date** | The version-migration schedule (§11.3) |
| 7 | **Instagram 100-post/24h limit and whether Stories count** | Quota simulation accuracy (§5.5) |
| 8 | **Whether `tt_video/authorize` returns an expiry timestamp** | Whether the whitelisting-expiry alert uses a platform-asserted or creator-asserted duration (§4.7) |
| 9 | **Whether Vista Social genuinely lacks a pause switch**, and the competitor matrix row asserting it | The crisis-hold competitive framing — the corpus's SMB file contains zero mentions of "pause" |
| 10 | **Whether competitors support bulk move-to-draft** | Whether the "bulk delete destroys the queue" pain narrative is overstated |
| 11 | **SOCi, Rallio, Birdeye, Chatmeter, Uberall, Hearsay et al.** | The entire multi-location GTM thesis; SOCi has zero mentions across all twelve dossiers (§13.11) |
| 12 | **Whether Zendesk/Front/Gorgias/Intercom social-channel SLA is close enough to kill the coverage wedge** | The single highest-risk unverified assumption in the coverage analysis |
| 13 | **Whether Statusbrew's rules engine can already express an escalation ladder** | Whether SLA-as-managed-object is a capability gap or a UX gap |
| 14 | **The 10–15% publishing-failure churn figure**, via win/loss and cancellation interviews | Whether reliability investment is correctly sized before it becomes load-bearing in a deck |
| 15 | **Mobile handoff timings for Later, Planoly, Plann, Preview, Buffer** | Whether reminder-publish's "one tap faster" is worth the mobile investment (§3.6) |
| 16 | **Reddit commercial API terms and pricing for SaaS posting on behalf of paying customers** | Whether Reddit is viable at scale |
| 17 | **Pinterest webhooks, analytics window, partner-tier limits** | Polling cost and analytics depth |
| 18 | **Threads webhook coverage** | Whether Threads inbox is real-time or polled (§6.2) |

**Rule:** an item on this list must not become load-bearing in pricing, a contract, a public
claim, or an irreversible schema decision until it is verified. Where the architecture already
tolerates the item being wrong — X metering, LinkedIn retention, Meta versioning — that tolerance
is deliberate and documented above.

---

## 15. Summary

The product is broad by necessity: 75 parity items are the price of entry, and a narrower
product cannot be sold into the segments that pay. It is deep in exactly twelve places, each
narrowed by adversarial review from a marketing claim into an engineering commitment — a hold
you can reason about and restore from, an offboarding transaction that actually revokes,
reminder publishing that never drops a slot, connection health that is honest about what it
cannot predict, a hierarchy that resolves everything through it, approvals where the reviewers
already live, time that means what the user meant, publishing that proves it went out and is
still there, rights that connect to live spend, coverage with a published floor, a write gate
that a headless agent cannot argue with, and experiments that report their own detectable effect
size.

What compounds, and therefore what the long-term investment should concentrate on, is a short
list: the **approval portfolio**, the **observed-failure corpus**, the **benchmark panel**, the
**fleet-wide creative priors**, and the **historical analytics** that customers cannot obtain
anywhere else. Everything else in this document is either the price of entry or a gate that
closes deals without carrying a price — and the discipline that makes the plan survivable is
being clear, in every roadmap conversation, about which is which.
