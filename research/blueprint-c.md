# Blueprint C — The Differentiation Architecture

**A global, AI-native social media management platform architected so that the verified
differentiators are load-bearing structural primitives rather than features bolted onto a
scheduler.**

Author's angle (assigned): optimise for **differentiation**. Treat the agentic-AI layer and
global platform coverage as first-class architectural primitives — an **action gate**, a
**platform adapter fabric**, an **assisted-execution tier**, and a **real-time signal bus** —
and treat scheduling as the commodity subsystem it has been since 2010.

Sibling documents: `blueprint-a.md` (conservative/parity-first) and `blueprint-b.md`
(scale-first). This document deliberately diverges from both in its centre of gravity. Where
they place the scheduler at the middle of the architecture and hang governance off it, this one
places the **Action Gate** at the middle and makes the scheduler one of its callers.

Research base: `/home/user/SMM/research/01`–`12`. Every claim traceable to the corpus is
cited as `[NN §X]`. Every claim that is my own engineering judgement is marked `[J]`. Every
claim the corpus itself marks unverified is marked `[UNVERIFIED]` and must not become
load-bearing before §20's backlog is cleared.

---

## 0. The argument in one page

**The commodity.** Multi-network scheduling is a solved, forked, and given-away problem. Postiz
ships 34 network providers under AGPL with 34.5k stars `[05 §11 G2]`; eleven public MCP servers
publish to 9–13 networks each and a competent one is "a weekend project" `[09 §4.2.1]`. Any
architecture whose centre is a queue-plus-cron is an architecture whose centre is free.

**The scarce things.** Three assets in this category cannot be forked, bought, or shipped in a
quarter:

1. **The approval portfolio** — an audited TikTok client, Meta Advanced Access with a passed DPA,
   LinkedIn MDP with working refresh tokens, a YouTube quota extension, Pinterest Standard, GBP
   allowlisting `[05 §12.1]`. Calendar-time, not engineering-time.
2. **The accumulated failure corpus** — per-network error taxonomies, destination rules, media
   rejection patterns, concurrency ceilings. Compounds with volume; cannot be read out of any
   documentation `[07 §16.4]`, `[05 §11 G8]`.
3. **The governance substrate** — a policy gate that every write passes through, with decision
   traces, shadow-mode evidence and exportable compliance artefacts. Retrofitting this onto
   shipped agent surfaces is a rewrite, which is why the incumbents who shipped copilots first
   are structurally stuck `[09 §4.3]`, `[03 §19]`.

**The architectural consequence.** Assets 2 and 3 are only capturable if the system is built so
that (a) *every* platform interaction flows through one adapter contract that records what it
learned, and (b) *every* write action — human, scheduled, agent, MCP, public API — flows through
one policy gate that records why it was allowed. Neither is retrofittable. Both are cheap on day
one and a quarter of work on day four hundred.

**The distribution consequence.** Governance is not unbuyable because it is unbuilt — Sprinklr
built it — it is unbuyable because it is not purchasable below roughly $50k ACV, and self-serve
enterprise-tier signup was killed across the category on 30 Apr 2026 `[03 lines 285–286]`. The
defensible sentence is *"governance you can buy with a credit card"*, not *"governance nobody
has."* The verifier notes are right and this document adopts their framing throughout.

**What this buys, stated as a testable claim.** A buyer can, self-serve, at agency price:
enable an AI agent in shadow mode, see its agreement rate against their own humans for 14 days,
promote it to `propose` on one brand, watch every decision trace, cap its blast radius per
brand, and export an AI compliance report their legal team can read — and none of that requires
a sales call. No vendor in the corpus offers this combination `[03 §19]`, `[09 §4.3]`,
`[11 §6.2]`.

**What this explicitly is not.** It is not a claim to novel capability in scheduling, pausing,
approvals, timezone handling, rights objects, or reminder publishing. Every one of those exists
somewhere in the market. The claim is **assembly and reach**: one policy gate, one adapter
contract, one signal bus, one ledger, spanning organic + paid + inbox + agent, sold self-serve.

---

## 1. Constraints that shape everything downstream

These are not preferences. Each one kills a class of designs, and they are stated first because
half the architectural decisions below are forced by them.

### 1.1 Platform constraints

| # | Constraint | Source | Kills |
|---|---|---|---|
| C1 | Meta pulls media from a public URL we host; the URL must stay up, range-request capable, correct MIME, for the whole processing window | `[06 §4.3]` | Any design where media lives behind auth-only storage |
| C2 | Container TTL 24h on Meta; media handles ~24h on X | `[06 §4.3]` | Naive "retry from publish step" recovery |
| C3 | Refresh tokens rotate and are single-use on X and TikTok; concurrent refresh orphans the grant | `[11 §10.5]`, `[06 §3]` | Refresh-on-401 in the request path; any health probe built on speculative refresh |
| C4 | Native platform scheduling (Meta `scheduled_publish_time`, YouTube `publishAt`, VK `publish_date`, Mastodon `scheduled_at`) is a *different* publishing mode with its own reconciliation duty | `[08 §14.2]` | A single `publish()` verb; a crisis hold that only pauses our own queue |
| C5 | ~20 of ~70 tier-2 surfaces and several tier-1 *formats* have no write API at all | `[07 §17]`, `[06 §6]` | Any coverage claim expressed as a single checkmark column |
| C6 | X is the only metered read platform; $0–$42k+/mo, and the poll interval is a pricing decision | `[06 §2.1, §19.5]`, `[12 §3]` | Uniform SLA promises across channels |
| C7 | LinkedIn has no organic webhooks and no DM API; TikTok/YouTube have no comment webhooks; Meta is webhook-real-time | `[06 §11]`, `[02 §7]` | A configurable 1-hour first-response SLA on a channel polled every 6 hours |
| C8 | Project-level quotas (GBP ~300 QPM, Telegram shared bot, Google Play) are shared across *all* tenants | `[07 §16.2]` | Any limiter that is not tenant-fair-share |
| C9 | Platform terms forbid transferring platform data to third parties, require deletion on disconnect, and require honouring upstream deletions | `[11 §12.1]` | A persistent, shareable, hosted "exit pack" handed to the next agency |
| C10 | Credential-replay/cookie-session automation of X, LinkedIn et al. is a direct ToS breach on every major network, however common it is in OSS | `[09 §4.2.3]` | Server-side headless computer-use against customer accounts. See §5. |

### 1.2 Legal and commercial constraints

| # | Constraint | Source | Consequence |
|---|---|---|---|
| L1 | Per-tenant KEK envelope encryption cannot be retrofitted cheaply — it is re-encrypting every credential and content row online while publishing continues | `[11 §10.3]` | Day-one decision. §13. |
| L2 | Retention is the *strictest* of platform ToS ceiling, legal floor, and tenant config — and FINRA/SEC push it up while GDPR pushes it down | `[11 §5.6]` | Retention is per-tenant per-data-class config with a compliance-mode override, not a global constant |
| L3 | Embeddings of personal data are derived personal data and inherit erasure | `[11 §5.5]` | Default: never embed audience/listening content; embed tenant's own content freely |
| L4 | A public link-in-bio, public UGC gallery or public creator marketplace plausibly converts us from *hosting service* to *online platform* under the DSA | `[11 §6.1]` | Public surfaces are a regulatory decision, not a growth decision |
| L5 | Agencies pay $25–40k/yr under seat×profile compounding and share logins to dodge per-seat approval costs | `[12 §28]`, `[04 lines 110, 141–143]` | Reviewer/approver seats must be free or near-free or the approvals engine dies on procurement |
| L6 | ~30–40% of SMB churn is unaddressable (they stopped doing social) | `[12 §33.1]` | Reliability work is retention infrastructure, not an acquisition wedge |

### 1.3 Statistical constraints

| # | Constraint | Source | Consequence |
|---|---|---|---|
| S1 | Median account has <200 lifetime posts, CV≈0.8 | `[12 §780]` | Single-account creative bandits cannot resolve realistic effects. Arms must be creative *features* pooled fleet-wide, not assets. §16.11 |
| S2 | Cross-network "total impressions" is arithmetically meaningless; five definitions of "impression" | `[12 §17.1]` | Metrics carry a comparability class as a first-class field, not a footnote |
| S3 | Platform ranking decides reach, so a "winning" variant may simply have been shown more | `[09 §4.4.3]` | Reward normalised by reach; randomised designs preferred over observational |

---

## 2. Product surface: the module list and how it composes

### 2.1 The composition rule

Modules do not call each other. They call four **kernels**, and the kernels call the adapters.
This is the entire architectural thesis in one diagram.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  PRODUCT MODULES  (23, listed §2.2)                                           │
│  Composer · Calendar · Queues · Inbox · Listening · Analytics · Reviews ·      │
│  Advocacy · Link-in-bio · Rights · Boost · Reports · Portal · Migration · …    │
└───────┬──────────────────┬───────────────────┬─────────────────┬──────────────┘
        │ every WRITE      │ every PLATFORM    │ every EVENT     │ every MODEL
        │                  │ interaction       │                 │ call
        ▼                  ▼                   ▼                 ▼
┌────────────────┐ ┌─────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ ACTION GATE    │ │ ADAPTER FABRIC  │ │  SIGNAL BUS    │ │  MODEL BROKER      │
│ (§3)           │ │ (§4)            │ │  (§6)          │ │  (§12)             │
│ policy · budget│ │ 9 archetypes ×  │ │ webhooks ·     │ │ routing · caching  │
│ · hold · trace │ │ capability      │ │ polls · streams│ │ · budget · eval    │
│ · idempotency  │ │ ledger · degrade│ │ · internal     │ │ · provenance       │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘ └─────────┬──────────┘
        │                   │                  │                    │
        └───────────────────┴──────────────────┴────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  SUBSTRATE                     │
                    │  tenancy · vault · audit ·     │
                    │  time · locale · retention     │
                    └────────────────────────────────┘
```

**The invariants this enforces.** A module physically cannot publish without passing the Action
Gate, cannot touch a network without an adapter, cannot learn that something happened except
from the bus, and cannot call a model except through the broker. New modules — and third-party
agents arriving via MCP — inherit governance, capability negotiation, observability and cost
control for free. That is the difference between shipping governance and *having* it.

### 2.2 The module list

Grouped by whether they exist for parity (match Vista 100%), for the verified differentiators,
or as the substrate both depend on. Parity items are enumerated against `[01 §30]`'s 75-row
checklist.

**A. Content & publishing (parity core, commodity)**

| # | Module | Notes / parity ref |
|---|---|---|
| A1 | **Composer** — multi-network, per-network variation, apply-to-all, grapheme-correct counting, first comment + up to 10 scheduled comments, alt text everywhere the API allows | `[01 §30 #1,3]`; alt text is a Vista gap `[06 §19.3]` |
| A2 | **Calendar** — drag-drop, week/month/list/grid, filters, statuses, dual-time rendering, CLDR week data, shared external link with expiry+password | `[01 §30 #4,5]`; §16.6 |
| A3 | **Queues & slots** — labelled slots, per-profile timezone, evergreen recycling with max-reuse/interval/expiry | `[01 §30 #6,7]` |
| A4 | **Bulk operations** — CSV import (arbitrary column order, ≥200 rows), bulk edit, **bulk move-to-draft**, bulk re-slot | `[01 §30 #8]`; bulk-move-to-draft is the control for the crisis-hold pain narrative `[verifier: crisis hold ¶3]` |
| A5 | **Media library** — folders, labels, alt text, 2GB files, group restrictions, cloud sync (Drive/OneDrive/Dropbox), Canva, stock | `[01 §30 #9,10]` |
| A6 | **Ideas / content library**, hashtag groups, link shortening + UTM rules + per-message unique IDs | `[01 §30 #11,12,13]` |
| A7 | **Link-in-bio microsite** — custom domain, SSL, blocks, embeds, QR, analytics, import. **Gated by L4**: shipped as tenant-branded pages under tenant domains, with a DSA notice-and-action path from day one | `[01 §30 #14]`, `[11 §6.1]` |
| A8 | **Assisted publish (reminder) client** — mobile-first, never-drop-the-slot semantics | §5, §16.3 |

**B. Collaboration & governance (differentiator-bearing)**

| # | Module | Notes |
|---|---|---|
| B1 | **Approval routing engine** — SLA ladders, digests, OOO delegation, Slack/Teams interactive decisions, decision-by-link for external clients, free reviewer seat class | §16.5; `[01 §30 #15,16]` |
| B2 | **Permissions & hierarchy** — org tree (client→brand→region→market→location) with permissions, approvals, reporting and timezone resolving through it | §8.3, §16.4 |
| B3 | **Publishing Hold** — scoped kill-switch with per-window policy, label scoping that fails closed, restore review queue | §16.1 |
| B4 | **Autonomy policies & Action Gate console** — modes, budgets, guardrails, shadow mode, agreement rates, kill switches | §3, §16.10 |
| B5 | **Audit & compliance exports** — immutable decision skeleton + erasable content payload; AI compliance report; approval records bound to content-version hashes and SSO identity | §13.5, §16.10 |
| B6 | **Offboarding** — "remove client" as one audited transaction with real upstream revocation | §16.2 |
| B7 | **Connection Health** — proactive introspection, T-14/T-3, scope-delta, repair links, batch repair | §16.7 |

**C. Engagement**

| # | Module | Notes |
|---|---|---|
| C1 | **Unified inbox** — comments, DMs, mentions, reviews, shares; saved replies; auto-assignment; labels; hide/delete; like-as-brand where supported; block where supported (FB Pages only) | `[01 §30 #20–26]`, `[02 §1112]` |
| C2 | **Coverage** — SLA objects with pre-breach alerts, escalation ladders, SLA-based routing, timezone-aware handover digest, per-channel SLA floors derived from real detection latency | §16.8 |
| C3 | **Send-eligibility state machine** — IG two-clock model (24h DM window w/ HUMAN_AGENT 7-day extension; separate one-shot comment→private-reply within 7 days) | §11.4 |
| C4 | **DM/review automation** — trigger×action rules, AI dynamic reply, all writes through the Action Gate | `[01 §30 #28]` |
| C5 | **Reviews & local** — GBP + Facebook response (honest scope), Yelp/TripAdvisor read-only | `[07 §12]`, `[verifier: franchise ¶4]` |

**D. Intelligence**

| # | Module | Notes |
|---|---|---|
| D1 | **Analytics** — three-layer metric model, comparability classes, four engagement-rate definitions with visible formulas, `followers_at_post_time` snapshots | §10, `[12 §17]` |
| D2 | **Reports** — catalogue, custom templates, white-label PDFs, scheduled delivery, calculated metrics | `[01 §30 #37–41]` |
| D3 | **Listening** — tiered coverage (L0 owned / L1 open / L2 metered / L3 licensed) with per-source coverage labels in the UI | §10.6, `[12 §16.1]` |
| D4 | **Benchmarks** — fleet aggregate panel with k-anonymity ≥20–30 accounts and opt-out | `[12 §18.1]` |
| D5 | **Warehouse access** — dbt package, Iceberg/bring-your-own-bucket, Snowflake Native App / Delta Share / BQ views, row-level mention export | §10.7, `[12 §25.2]` |
| D6 | **Experiments** — cross-location randomised trials with MDE-up-front, feature-level hierarchical bandit | §16.11 |
| D7 | **Competitive intel & GEO monitoring** — public-profile panels; AI-answer citation tracking | `[12 §26]`, `[09 §6]` |

**E. Commerce, creator, paid**

| # | Module | Notes |
|---|---|---|
| E1 | **Boost / organic→paid** — boost configs, dark posts, suppression, paid-vs-organic reporting; gated on `ads_management` Advanced Access | `[10 §33–35]` |
| E2 | **Rights & usage ledger** — live-permission-to-live-spend join across scheduler, gallery and ad account | §16.9 |
| E3 | **Creator / UGC** — one contact graph, one asset ledger, same codebase | `[10 §21–23]` |
| E4 | **Advocacy** — curation, leaderboard w/ EMV, badges | `[01 §30 #50]` |

**F. Platform surfaces**

| # | Module | Notes |
|---|---|---|
| F1 | **Public REST API** — self-serve, no sales gate | `[01 §30 #56,58]` |
| F2 | **MCP server (outbound)** — every tool behind the Action Gate, dry-run default, propose→confirm, scoped per-brand tokens, spend caps | §3.6, §7.3 |
| F3 | **MCP client (inbound)** — trend feeds, ad platforms, CRM, commerce, review sites | §7.4 |
| F4 | **Automation nodes** — n8n, Make, Zapier, Pipedream | `[05 §11 G12]` |
| F5 | **Mobile apps** — publishing, inbox, approvals, assisted-publish client | §5 |
| F6 | **Agency portal / white-label** — logo, colours, custom domain, branded emails and reports, per-client billing | `[01 §30 #51,53]` |
| F7 | **Migration engine** — CSV parsers × 9 vendors, platform re-fetch backfill, bulk OAuth wizard, boolean query translator, reconciliation report | §16.2b, `[12 §33.3–33.4]` |

**G. Substrate** — tenancy, token vault, audit log, time kernel, locale kernel, retention engine,
model broker, media pipeline, notification fabric. Covered in §8, §12, §13, §14.

### 2.3 What composition looks like in practice: one scheduled post

Traced end to end, because the module list is meaningless without the flow.

```
composer.save(draft)
  → LocaleKernel.count(text, network)            grapheme/byte/utf16 per capability ledger
  → AdapterFabric.validate(draft, targets[])     pre-flight: codec, aspect, caption, flair,
                                                 creator_info, token scope, quota headroom
  → RightsLedger.check(assets, intent=organic)   warn-with-override on organic; hard block on paid
  → ActionGate.evaluate(action=schedule)         policy · budget · hold · approval routing
      ↳ if approval_required → ApprovalEngine → Slack/Teams/decision-link → SSO-bound record
  → TimeKernel.store(wall_clock, iana_zone)      NOT a UTC instant
  → Scheduler.enqueue(dispatch_at_resolved_late)

[at T-60s]
  → RateBudget.reserve(platform, tenant, connection)
  → ActionGate.evaluate(action=publish)          re-evaluated: holds may have appeared since
  → AdapterFabric.publish(...)                   archetype-specific; idempotency key
  → SignalBus.emit(publish.attempted / succeeded / failed)

[at +1m, +10m, +1h, +24h]
  → Verifier.readback(external_id)               authenticated re-fetch; diff vs expected
  → on divergence: SignalBus.emit(post.removed)  → PUBLISHED_THEN_REMOVED, notify, ledger entry
```

Note what is *not* in that flow: any module-to-module call. The composer does not know the
scheduler exists. The scheduler does not know approvals exist. Both know the Action Gate exists.

---
## 3. Primitive 1 — The Action Gate

The single most consequential structural decision in this blueprint. Everything else is
recoverable; this is not `[09 §4.3]`, `[11 §10.3]`.

### 3.1 The claim, stated honestly

Sprinklr shipped `Autonomous Evaluation` (Spring '26) and `Agent Quality Assurance` (Summer '26)
with explainable logs, pre-deployment simulation and a three-mode autonomy model `[09 §4.1]`.
**The capability is not novel. The distribution is.** Not one of fourteen enterprise vendors
lets a buyer enable identity or governance with a credit card `[03 lines 285–286]`. Our claim is
therefore: *a policy gate every write passes through, priced inside an agency plan, with an
exportable compliance artefact.* We budget **twelve months of lead, not a moat** — a determined
incumbent copies the gate; what they cannot copy quickly is having built it *before* they shipped
their copilot.

### 3.2 The interface

One synchronous call. Fail-closed. No bypass path exists in the codebase — enforced by the
architectural fitness test in §15.4.

```ts
interface ActionGate {
  evaluate(req: ActionRequest): Promise<Decision>;
  commit(decisionId: string, outcome: ActionOutcome): Promise<void>;  // closes the trace
}

interface ActionRequest {
  tenantId: string;
  orgNodeId: string;              // resolves the hierarchy: brand/region/market/location
  actorId: ActorRef;              // { kind: 'user'|'agent'|'mcp_client'|'api_key'|'schedule',
                                  //   id, sessionId, authMethod: 'sso'|'password'|'token' }
  action: ActionType;             // draft|schedule|publish|reply|dm|delete|boost|spend|
                                  // connect|disconnect|export|rights_override|hold_release
  target: { connectionId?, contentId?, conversationId?, adAccountId? };
  payload: { contentHash: string; labels: string[]; estimatedSpend?: Money; aiGenerated: boolean;
             modelProvenance?: ModelProvenance };
  intent: 'organic' | 'paid' | 'gallery' | 'internal';
  idempotencyKey: string;
  dryRun: boolean;                // DEFAULT TRUE for mcp_client and api_key actors
}

type Decision =
  | { verdict: 'allow';   decisionId: string; reversibilityWindow?: Duration }
  | { verdict: 'propose'; decisionId: string; confirmToken: string; expiresAt: Date }
  | { verdict: 'approve_required'; decisionId: string; routeId: string; slaDeadline: Date }
  | { verdict: 'deny';    decisionId: string; reasons: DenyReason[]; appealPath?: string };
```

`DenyReason` is a closed vocabulary, because the reason string ends up in a compliance export:
`HOLD_ACTIVE` · `BUDGET_EXCEEDED` · `POLICY_MODE_OFF` · `GUARDRAIL_BANNED_TERM` ·
`GUARDRAIL_CLAIM_UNLISTED` · `DISCLOSURE_MISSING` · `RIGHTS_EXPIRED` · `RIGHTS_UNVERIFIED` ·
`SCOPE_MISSING` · `CONNECTION_UNHEALTHY` · `QUOTA_EXHAUSTED` · `LABEL_UNCLASSIFIED` ·
`ESCALATION_TRIGGERED` · `KILL_SWITCH`.

### 3.3 Evaluation order (fail-closed, cheapest-first)

```
1. Kill switches         global → platform → tenant → brand → connection      [O(1) cache]
2. Publishing holds      resolve scope tree; label match; FAIL CLOSED on
                         unlabelled content unless an explicit allowlist hits  §16.1
3. Connection health     reauth_required / revoked / insufficient_plan → deny  §16.7
4. Autonomy policy       mode for (orgNode, action, actorKind)
5. Budgets               posts/day, replies/hour, spend/day — atomic reserve   §3.5
6. Guardrails            banned-term regex → claim allowlist → disclosure req  (regex first: free)
7. Rights ledger         hard block on paid+gallery; warn+override on organic  §16.9
8. LLM judges            brand voice, safety, policy-keyword — only if 1-7 pass and policy asks
9. Escalation triggers   sentiment, follower count, legal topic, crisis signal
10. Approval routing     conditions → route → SLA deadline                     §16.5
```

Steps 1–7 are deterministic and sub-10ms from cache. Step 8 is the only one that costs money and
latency, which is why it is last: a banned term should never spend a model call to be rejected
`[09 §7.7]`.

### 3.4 The decision trace, split for GDPR

The verifier note is correct that an unconditionally immutable trace is unshippable under
Art. 17 `[11 §5]`. The trace is therefore two objects with different lifecycles:

```
decision_skeleton            (immutable, append-only, no personal data, 7-year retention)
  decision_id, tenant_id, org_node_id, ts, action, verdict, deny_reasons[],
  actor_kind, actor_ref_hash, auth_method, policy_version, policy_hash,
  guardrail_results[], budget_state_before/after, model_id, model_version,
  prompt_hash, candidate_count, ranking_fn_id, approver_ref_hash, sla_met,
  content_hash, reversal_path_id

decision_payload             (erasable, tombstoned, retention per §13.6)
  decision_id → { inputs_consulted[], candidates[], selected_text, target_handles[],
                  conversation_excerpt, approver_identity, rationale }
```

Erasure deletes the payload and writes a tombstone; the skeleton survives with
`payload_state='erased'`. An auditor can still prove *that* a decision was made, by whom, under
which policy version, and that it was reviewed — which is what FINRA 2210 principal pre-approval
and SOC 2 both actually need `[11 §13.4]`, `[verifier: approvals ¶4]`.

**Approval records specifically must:** bind to the immutable content-version hash; attest
reviewer identity through SSO (not a raw Slack user ID); and be journalable into Smarsh / Global
Relay / Proofpoint / Hearsay. We integrate with the archive of record; we do not replace it
`[11 §13.4]`.

### 3.5 Budgets are atomic reservations, not counters

A counter incremented after the fact is not a budget; two concurrent agents both pass. Budgets
are Redis-backed leases with a compensating release:

```
reserve(scope, action, n) → lease_id | BUDGET_EXCEEDED     [Lua: CAS on a windowed counter]
commit(lease_id)          → converts reservation to spend
release(lease_id)         → returns the reservation (publish failed terminally)
                             leases auto-expire at 2× the action's p99 latency
```

Spend budgets additionally reconcile nightly against the ad platform's own reported spend,
because our estimate and their billing will diverge and the *platform* is the source of truth
`[10 §34]`.

### 3.6 Server-side write safety for MCP and API actors

`[01 line 1358]` rates this **P0-EXCEED** and no commercial vendor has it. The threat model must
be stated correctly, per the verifier: MCP has had `destructiveHint` annotations since spec
2025-03-26 and elicitation since 2025-06-18, and Claude/ChatGPT gate tool calls by default. The
real problem is that **client-side consent is advisory, unenforceable, and entirely absent for
headless agents** — so the gate must live on our server `[verifier: kernel ¶4]`.

Five server-side controls, none of which the client can waive:

1. **`dryRun` defaults to `true`** for `mcp_client` and `api_key` actors. A live write requires an
   explicit `dryRun:false` *and* a policy that permits it for that actor class on that brand.
2. **Propose→confirm handshake.** Any `publish`/`dm`/`boost`/`delete` returns
   `verdict:'propose'` with a single-use `confirmToken` bound to `(contentHash, target,
   actorId)`, expiring in 15 minutes. Mutating the content invalidates the token. The pattern is
   already converged on in the better community servers (`06ketan/substack-ops`,
   `Agent-Prod/muze-mcp`) `[09 §4.2.2, §4.2.4]`.
3. **Scoped per-brand agent tokens.** An agent token carries `(tenant, orgNode subtree, action
   set, budget)`. There is no tenant-wide agent token; the UI cannot mint one.
4. **Hard caps a headless agent cannot argue with** — publishes/day, replies/hour, spend/day,
   distinct-recipients/hour, enforced by §3.5.
5. **Untrusted-content rule.** Any text arriving from a platform (a DM, a comment, a review, a
   listening hit) is tagged `provenance:'external'` in the agent context and is never allowed to
   alter policy, budgets, or tool selection. Prompt-injection via inbound DM is the obvious
   attack on a social-media agent and is treated as an architectural boundary, not a prompt
   instruction.

### 3.7 Shadow mode

The one element with no commercial or open-source precedent found in the corpus
`[verifier: kernel ¶3(ii)]`, and therefore the element to spend differentiation budget on.

```
shadow_run { policy_id, brand_id, started_at, days, status }
shadow_observation {
  run_id, trigger_event_id, ts,
  agent_action  { type, content_hash, text, confidence, decision_id },
  human_action  { type, content_hash, text, actor_id, ts }  | null (human did nothing),
  comparison    { agreement: 'match'|'near'|'divergent'|'human_only'|'agent_only',
                  similarity, judge_model, judge_rationale_hash }
}
```

- Agreement is scored by a mid-tier judge model (`gpt-5-mini` / `claude-haiku-4-5`) on a 4-point
  rubric, with a 1% human-labelled audit sample to keep the judge honest `[12 §16.3]`.
- The product reports **agreement rate with a confidence interval**, and refuses to report at all
  below n=30 observations. "94% agreement over 214 replies (CI 90–97%)" is the promotion
  artefact; "94%" over six replies is the thing a sophisticated buyer catches `[09 §4.4.3]`.
- Promotion from `shadow` → `propose` → `approve_required` → `auto_within_budget` is a UI action
  that *requires* a shadow run attached, and the promotion is itself a gated action with its own
  trace.

**Cold start.** A new tenant has no history and the platform APIs will not give us one
`[verifier: kernel ¶4(iii)]`. Shadow mode is therefore seedable from a **curated synthetic
corpus** — inbox threads, comments and reviews per vertical (restaurant, clinic, SaaS, retail,
franchise, agency), hand-built and versioned, ~200 items each. The replay harness runs the
configured agent over the synthetic corpus and scores it before the tenant has any real data.

### 3.8 Replay QA

```
replay_suite { id, corpus_ref, rubric_id, policy_snapshot }
replay_run   { suite_id, agent_config_hash, model_id, scores{}, regressions[], ts }
```

Runs on: agent config change, policy change, model version change, and nightly. A regression
above threshold **automatically demotes the agent to `propose`** and notifies the owner — the
automatic-pause-on-anomaly requirement `[09 §4.3 item 5]`. Model version pinning matters here:
a silent provider-side model update is otherwise indistinguishable from a regression, so
`model_id@version` is pinned per policy and upgrades are an explicit, replay-gated action.

### 3.9 Kill switches

Built before launch, not during an incident `[11 §10.8]`. Five levels, each with a visible
in-product state and a Slack/Teams notice: global · per-platform · per-tenant · per-brand ·
per-connection. Plus mass token revocation + forced re-auth. Each is an Action Gate rule at
step 1, so the switch is one row, not a deploy.

---

## 4. Primitive 2 — The Adapter Fabric and the Capability Ledger

### 4.1 The reduction

Seventy-plus surfaces collapse to **nine auth archetypes** `[07 §3]` × **three tier-1 publish
archetypes** `[06 §4.3]` × **four publishing modes** `[08 §14.2]`. We build the archetypes; every
individual network is configuration plus a content mapper plus an error map.

**Auth archetypes** (from `[07 §3]`): A single-secret REST · B standard OAuth2 · C
**instance-scoped OAuth with dynamic client registration** · D bot/server identity · E
asymmetric-JWT enterprise · F BSP/aggregator-mediated · G feed-in/feed-out · H read-only review
ingestion · I no API (assisted).

**Publish archetypes** (from `[06 §4.3]`): **Two-step container** (Meta family — *they pull our
media from a public URL*) · **Phased resumable upload** (LinkedIn, TikTok, YouTube, Pinterest
video, FB Reels/Stories — *we push bytes, with per-part ETags*) · **Single-shot with
pre-uploaded handles** (X, Pinterest image, FB photo).

**Publishing modes** (from `[08 §14.2]`) — this is the axis most schedulers omit, and the one
whose omission causes double-posts:

| Mode | Members | Scheduler's duty |
|---|---|---|
| `SYNC` | Telegram, Zalo, VK immediate, Mercado Libre | Fire at T, confirm |
| `NATIVE_SCHEDULED` | Meta `scheduled_publish_time`, YouTube `publishAt`, VK `publish_date`, Mastodon `scheduled_at` | Hand off at draft time; **our clock verifies, it does not dispatch**; reconcile daily; a hold must reach into the platform |
| `ASYNC_REVIEWED` | WeChat `freepublish`, LINE `narrowcast`, Douyin/Kuaishou/Bilibili | Submit, poll with backoff, model `rejected` as a first-class terminal state that notifies a human |
| `REMINDER` | Snapchat, Xiaohongshu, LINE VOOM, ShareChat, Kwai, Naver Blog, note, IG Stories-with-stickers, TikTok creative layer | Notify, hand off, collect confirmation, never drop the slot |

**Critical interaction — C4 vs the time substrate.** Storing scheduled time as
`(wall-clock + IANA zone)` resolved at dispatch is *incompatible* with delegating to
`NATIVE_SCHEDULED` `[verifier: time ¶KEEP-1]`. We therefore **self-dispatch by default** and use
native scheduling only where it is strictly better (YouTube premieres, Meta when a customer
explicitly wants the post visible in Meta Business Suite). That choice is made deliberately, is
per-connection, is visible in the UI, and drives the hold-reconciliation duty in §16.1.

### 4.2 The Capability Ledger — the ledger *is* the product surface

Extends `[07 §14.2]` with the fields this architecture needs. Every capability is **data in a
versioned store, never a code branch**. The composer, calendar, validator, degradation logic,
pricing page, public capability matrix and MCP tool schemas are all *generated* from it.

```ts
interface NetworkCapability {
  networkId: NetworkId;              // 'instagram' | 'mastodon' | 'xiaohongshu' | ...
  version: string;                   // ledger row version — every change is a reviewed diff
  effectiveFrom: Date; observedAt: Date; confidence: 'documented'|'observed'|'inferred';

  auth:    { archetype: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I';
             scopes: ScopeSpec[]; tokenTtl?: Duration; refreshRotates: boolean;
             refreshSingleUse: boolean; introspectionEndpoint?: string;
             probe: { method: 'identity_read'; endpoint: string; costUnits: number } };

  publish: { mode: 'SYNC'|'NATIVE_SCHEDULED'|'ASYNC_REVIEWED'|'REMINDER'|'NONE';
             uploadArchetype: 'container'|'resumable'|'handle'|'none';
             mediaTransfer: 'platform_pulls_url' | 'we_push_bytes';   // C1 — drives CDN design
             formats: FormatSpec[];                                    // per format, not per network
             counting: 'graphemes'|'utf16'|'bytes'|'chars';
             richText: 'none'|'markdown'|'html'|'facets'|'npf'|'blockkit'|'adaptivecard';
             idempotency: 'native_header'|'readback_check'|'local_lock';
             editAfterPublish: boolean; deleteAfterPublish: boolean;
             perTargetMetadata?: string[];        // reddit: ['flair','rules']
             preflightCalls?: PreflightCall[];    // tiktok creator_info, ig content_publishing_limit
             concurrency: number;                 // reddit 1, threads 2, bluesky 2, pinterest 3,
                                                  // x 10, youtube 200, facebook 500  [05 §11]
             containerTtl?: Duration };

  read:    { postMetrics: MetricId[]; accountMetrics: MetricId[];
             historyWindow?: Duration;            // pinterest 90d, x-nonpublic 30d, tiktok ~60d
             realtime: 'webhook'|'pubsub'|'websocket'|'poll';
             pollFloor?: Duration;                // drives the SLA floor in §16.8
             readbackSupported: boolean;          // drives §16.12 removal detection honesty
             costModel: 'free'|'per_call'|'per_message'|'plan_gated'|'contract' };

  inbox?:  { read: boolean; reply: boolean; sessionWindows: SessionWindow[];
             likeAsBrand: boolean; block: boolean; hide: boolean; adComments: boolean };

  limits:  { model: 'header_window'|'bucket_hash'|'points'|'method_tier'|'daily_cap'|
                    'project_quota'|'opaque';
             projectScoped: boolean;              // C8 — true ⇒ tenant fair-share required
             spec: LimiterSpec };

  degrade: { onUnsupportedFormat: 'reject'|'transform'|'assisted';
             assistedRecipe?: AssistedRecipe };   // §5

  honesty: { publishClass: 'auto'|'assisted'|'unsupported';
             reason: string;                      // shown verbatim in the UI and on the website
             lastVerifiedAt: Date; verifiedBy: 'contract_test'|'canary'|'human' };
}
```

**Why the ceremony pays.** Adding network #71 stops being a cross-cutting change `[07 §14.2]`.
More importantly, three differentiators become *free consequences* of the ledger rather than
separate builds:

- The **honest capability matrix** (`honesty.publishClass` + `reason`) — the positioning moat in
  `[07 §17.3]` and `[09 §4.2.3]` — is a rendered view of a column we maintain anyway.
- The **per-channel SLA floor** (`read.pollFloor`) — the mandatory honesty constraint in
  `[verifier: coverage ¶8]` — is a lookup, so the UI can *refuse* to let a customer configure a
  1-hour SLA on a 6-hour-poll channel.
- **Graceful degradation to assisted publish** (`degrade`) is a routing decision, not an
  exception path.

**Ledger governance.** Rows are versioned, diffed in code review, and carry `confidence`. A
`documented` row cites the platform doc URL. An `observed` row cites the contract test or the
failure corpus entry that produced it. `inferred` rows are flagged in the UI as "we believe" and
are the ones the canary suite prioritises. A row whose `lastVerifiedAt` exceeds its network's
staleness budget raises an alert — a stale ledger is a correctness bug, exactly like a stale
tzdb `[08 §17.1]`.

### 4.3 The adapter contract

```ts
interface NetworkAdapter {
  readonly id: NetworkId;
  capabilities(conn?: Connection): Promise<NetworkCapability>;   // may PROBE (archetype C)

  // auth — completeAuth returns an ARRAY: GBP yields hundreds of locations, Meta many Pages
  beginAuth(ctx): Promise<{ redirectUrl: string } | { instructions: Instruction[] }>;
  completeAuth(ctx): Promise<Connection[]>;
  refresh(conn): Promise<Connection>;              // single-writer, distributed lock — C3
  probe(conn): Promise<HealthReport>;              // READ-ONLY identity call — NEVER a refresh
  revoke(conn): Promise<RevocationReceipt>;        // upstream revocation, receipted — §16.2

  // publish — three verbs, not one
  validate(conn, draft): Promise<ValidationResult>;
  publish(conn, payload, idempotencyKey): Promise<PublishHandle>;
  poll(handle): Promise<PublishState>;             // ASYNC_REVIEWED and container archetypes
  scheduleNative?(conn, draft, at): Promise<PublishHandle>;
  cancelNative?(conn, externalId): Promise<void>;  // required for holds — C4
  readback(conn, externalId): Promise<PostState>;  // §16.12 reconciliation
  delete?(conn, externalId): Promise<void>;

  // read
  fetchMetrics?(conn, ids): Promise<RawMetric[]>;  // RAW field names preserved — layer 1
  fetchInbound?(conn, cursor?): Promise<Page<InboundItem>>;
  fetchReviews?(conn, cursor?): Promise<Page<Review>>;
  replyToReview?(conn, id, body): Promise<void>;

  // introspection for the fabric
  mapError(e: unknown): NormalizedError;
}
```

**Three rules that fall out of the corpus and are enforced in the base class, not per adapter:**

1. `completeAuth` returns an array `[07 §14.3]`.
2. `probe` is a **read-only identity call**, never a speculative refresh — on X and TikTok a
   refresh-based health check manufactures the exact orphaning failure the feature exists to
   prevent `[verifier: connection health ¶5]`, `[11 §10.5]`.
3. `mapError` must return a member of the closed taxonomy in §4.5. An `UNKNOWN` is a taxonomy bug
   that pages an engineer `[08 §14.4]`.

### 4.4 Capability negotiation and graceful degradation

The composer never asks "is this Instagram?" It asks the ledger. Negotiation resolves a
`(draft, target[])` pair into a per-target plan:

```
negotiate(draft, target) →
  EXACT        format supported natively, no changes
  TRANSFORMED  supported after deterministic transforms
               · caption truncation on the network's counting unit
               · hashtag relocation (inline | first comment | description)
               · media transcode/re-encode to the format spec
               · aspect-ratio pad or crop with a preview diff shown to the human
               · thread splitting (X/Bluesky/Mastodon) at sentence boundaries
               · link handling (clickable | bio-link | first comment)
  ASSISTED     no write API for this format on this network → reminder path (§5)
               · e.g. IG Story with any sticker, TikTok creative layer, YouTube Community post
  BLOCKED      hard constraint no transform can satisfy → explain, offer alternatives
```

The composer renders this as a per-target chip: green *auto*, amber *assisted* with the reason
verbatim, grey *unsupported* with the reason. This is the same data the public capability matrix
renders. **The honesty is not a marketing decision made later; it is the same column.**

Two rules that keep degradation from becoming a lie:
- A draft that degrades to `ASSISTED` on *any* target must say so **at schedule time**, in the
  composer, not at 9:00am in a push notification.
- Assisted posts are visually distinct in the calendar and **excluded from auto-published counts
  and from reliability metrics** `[07 §17.1]`.

### 4.5 The normalized error taxonomy

One closed set, because retry policy and user messaging depend on the class, not the platform
`[08 §14.4]`, `[07 §16.4]`:

```
AUTH_EXPIRED        refresh once (single-writer), retry once; else mark connection broken
AUTH_REVOKED        no retry; reauth_required; repair link
SCOPE_MISSING       no retry; name the exact scope and the grant path
RATE_LIMITED        retry honouring Retry-After; NOT counted as a failure in reliability metrics
QUOTA_EXHAUSTED     no retry; surface quota + reset time
CONTENT_REJECTED    no retry; surface the platform's reason VERBATIM plus a translation
PLATFORM_POLICY     no retry; distinct from CONTENT_REJECTED because it needs a human, not an edit
VALIDATION_FAILED   no retry; log as a VALIDATOR GAP — should have been caught pre-flight
PLAN_INSUFFICIENT   no retry; e.g. Trustpilot tier, Vimeo tier, Flickr Pro for stats
TRANSIENT           bounded retry with jitter
PLATFORM_DOWN       long backoff; status banner
DUPLICATE           platform rejected as duplicate — treat as success-if-readback-confirms
UNKNOWN             retry once, then page. Every UNKNOWN is a taxonomy bug.
```

Only `CONTENT_REJECTED` and `PLATFORM_POLICY` surface to the customer as "your post was
rejected". Everything else is our problem and is phrased that way.

**The failure corpus.** Every `UNKNOWN`, every `VALIDATION_FAILED`, and every
`CONTENT_REJECTED` writes a row to a cross-tenant, de-identified `failure_observation` table:
`(network, format, error_code, platform_message_hash, media_signature, caption_signature,
observed_at, resolution)`. This table is the accumulating asset in `[verifier: publish
verification ¶2]` — the general destination-rules engine is built *from* it, not from
documentation. It also drives §15.5's self-healing.

### 4.6 Regional and instance-scoped specifics

- **Archetype C** (Mastodon/Pleroma/Akkoma/GoToSocial/Pixelfed/Firefish, WordPress self-hosted,
  Ghost, PeerTube, Lemmy, Misskey) requires `instanceUrl`, `instanceSoftware`,
  `instanceCapabilities`, a **per-host client-credential cache**, and the full SSRF ceremony in
  §13.7. This is the archetype most competitors skip and the clearest technical differentiator
  in tier 2 `[07 §14.1, §15.1]`.
- **Archetype F** (WhatsApp, RCS, Apple Messages for Business, Viber, Kakao AlimTalk, Zalo ZNS)
  shares one **template subsystem**: template model, approval lifecycle
  (`draft→submitted→approved|rejected`), category (transactional vs marketing), variable
  binding, and a **per-message cost ledger that reaches the invoice**. Build it once
  `[08 §14.5]`.
- **Post-count-capped networks** (WeChat 订阅号 1/day, 服务号 4/month) require the composer to
  show *remaining slots*, not just a rate limit `[08 §14.3]`.
- **Error messages arrive in Chinese and Korean.** Store raw *and* translated; never show only
  one `[08 §14.4]`.

---

## 5. Primitive 3 — The Assisted-Execution Tier (and the computer-use boundary)

The brief asks for "computer-use fallback for API-less networks." This section answers it
precisely, because the naive version of that idea is a business-ending mistake and the
disciplined version is a real differentiator.

### 5.1 The line, drawn explicitly

`[09 §4.2.3]` documents a mature public ecosystem of cookie-session MCP servers driving X and
LinkedIn with 30+ tools each, and states the commercial reality without ambiguity: **doing this
in a product you sell is a direct breach of platform terms on every major network**, exposing
the customer's account to suspension, the vendor to enforcement, and the buyer to a compliance
finding. `[11 §12.1]` compounds it: an app-level enforcement action kills every tenant's
connections, including the unaffected ones.

**Therefore, three tiers, and the boundary between them is architectural, not a policy
document:**

| Tier | What it is | Where it runs | Customer accounts? | Ships? |
|---|---|---|---|---|
| **T1 — API** | Official platform APIs | Our servers | Yes | Yes |
| **T2 — Assisted** | Human-in-the-loop handoff: we prepare, the human taps publish in the native app | The user's own device, the user's own session, human present | Yes | **Yes — this is the "computer-use fallback"** |
| **T3 — Autonomous browser** | Headless/credential-replay automation of a customer's account | — | **Never** | **No** |

T3 does not exist in the codebase. There is no code path from a customer connection to a browser
driver. The fitness test in §15.4 asserts this.

**Where browser automation *is* used, legitimately:** against **our own** test accounts, inside
the integration-health system (§15.5) — capability discovery, contract-test fixtures, deep-link
recipe verification per app version, and detecting silent API behaviour changes. That is our
property, our terms acceptance, our risk. It never touches a tenant credential and it never
publishes tenant content.

### 5.2 What T2 actually is, after the verifier's corrections

The verifier narrowed this hard and correctly `[verifier: reminder-publish]`. Two promises are
undeliverable and are removed from the spec:

- iOS does not guarantee silent-push delivery, caps it at ~2–3/hour with a 30s budget.
- No app can foreground itself or write the clipboard at a scheduled minute.

So the honest specification is: **best-effort prefetch when the OS permits; one-tap transfer once
the user opens the notification.** The gain over Later/Planoly/Preview is one tap and a few
seconds — not a new experience. What is genuinely unbuilt and OS-legal is the *reliability
semantics around* the handoff:

| Capability | Why it is defensible |
|---|---|
| **Never-drop-the-slot** — offline queue, re-notify on reconnect, escalation ladder, missed-post digest | Requires state on our side, not a mobile trick. No competitor evidence in the corpus. |
| **Device-targeted routing** wired to a confirmation loop that reconciles the calendar | The confirmation loop is the part that makes the calendar honest |
| **Per-network caption transforms applied at handoff** | Reuses §4.4 negotiation; competitors hand you the raw caption |
| **The honest capability matrix** | §4.2 `honesty` column |

Scope for v1: **Instagram Stories with stickers, Instagram personal accounts, TikTok creative
layer.** That is where the volume and the pain are. Snapchat and the regional set (Xiaohongshu,
LINE VOOM, ShareChat, Kwai, Naver Blog, note) ship as a cheap byproduct of the same pipeline —
**never as a coverage claim**, because an honest matrix labels all of them "assisted" and yields
a *shorter* checkmark column than competitors' `[verifier: reminder ¶3]`.

Explicitly dropped from v1: manual metric capture (near-zero sustained adoption, and it
contaminates metric provenance by mixing self-reported with API-sourced numbers
`[verifier ¶7]`). TikTok send-to-inbox ships, but as table stakes, not as a differentiator
`[verifier ¶8]`.

### 5.3 The assisted-publish state machine

```
STAGED ──(prefetch when OS permits)──▶ PREFETCHED
   │                                       │
   └──────────── notify at T-lead ─────────┘
                     │
                     ▼
              NOTIFIED ──(user opens)──▶ HANDED_OFF ──(confirm)──▶ PUBLISHED_ASSISTED
                 │  │                         │
                 │  └──(no open in N min)──▶ RE_NOTIFIED ──▶ ESCALATED ──▶ MISSED
                 │                                                          │
                 └──(device offline)──▶ QUEUED_OFFLINE ──(reconnect)──▶ NOTIFIED
                                                                           ▼
                                                              missed-post digest + calendar mark
```

Every transition is a Signal Bus event; `MISSED` is a first-class reportable state, not a
silence. The confirmation step optionally accepts a pasted URL so the post can be linked to the
calendar entry and, where the network has a read API for the *published* object, backfilled with
metrics.

**Deep links are a permanent QA line, not a one-time build.** `[07 §17.2]` labels every recipe
`C3-and-changing`. Recipes live in the Capability Ledger (`degrade.assistedRecipe`), are
verified per app version on real devices in the device lab (§15.3), and a stale recipe degrades
the notification to "open the app and paste" rather than firing a broken URL scheme.

### 5.4 Positioning and pricing of T2

Per the verifier: this is **retention/support-cost reduction inside the plan**, not an
acquisition wedge. It is invisible in a trial and un-representable in a comparison table.
Willingness-to-pay is validated against Planoly/Plann/Preview consumer prices, not a B2B-suite
premium `[verifier ¶6]`. Before building, run the competitive teardown the corpus is missing —
install and instrument Later, Planoly, Plann, Preview and Buffer mobile and *time the actual
handoff*; `[04 Appendix A]` shows the mobile-first planner segment was never covered
`[verifier ¶9]`.

---
## 6. Primitive 4 — The Signal Bus

### 6.1 Why this is a primitive and not just "we use Kafka"

Seven features in this blueprint need to know that something happened in near-real time, and in
every competing product each of them is wired separately: the inbox, crisis-hold proposals,
connection-health alerts, publish reconciliation, SLA breach prediction, agent triggers, and
anomaly/kill-switch automation. Wiring them separately is why incumbents can ship "listening"
and "crisis" and "inbox" and still not be able to say *"negative-mention velocity spiked on this
brand — hold promotional content?"* — because those three subsystems have no shared spine.

The Signal Bus is that spine: **one normalised event stream that every producer writes and every
consumer subscribes to**, with delivery semantics chosen per consumer rather than per producer.

### 6.2 Topology

```
PRODUCERS                                          BUS                       CONSUMERS
──────────────────────────────────────────    ─────────────────    ────────────────────────
Platform webhooks (Meta rich, Threads          ┌──────────────┐    inbox projection
  partial, TikTok publish status,              │ durable log  │    conversation state machine
  YouTube PubSubHubbub, Twitch EventSub) ────▶ │ Kafka /      │──▶ SLA clock + pre-breach alerts
                                               │ Redpanda     │    connection-health evaluator
Poll adapters (X search/DM, Reddit,            │              │    publish reconciler (§16.12)
  LinkedIn everything, YouTube comments,       │ partitioned  │    crisis signal composer
  IG hashtag, GBP reviews, Pinterest) ───────▶ │ by tenant_id │    agent trigger router
                                               │              │    anomaly detector → kill switch
Stream sources (Bluesky Jetstream WSS,         │ keyed by     │    notification fanout
  Mastodon WSS, Twitch chat) ────────────────▶ │ entity_id    │    metrics rollup
                                               │ for ordering │    audit projector
Crawl sources (RSS, sitemaps, Discourse,       │              │    warehouse CDC
  WP REST, Common Crawl batch) ─────────────▶  └──────────────┘    shadow-mode observer
                                                      ▲
Internal state changes (publish attempted/            │
  succeeded/failed, hold applied/released,  ──────────┘
  approval decided, policy changed, token
  refreshed, budget exhausted, agent acted)
```

**Design decisions that matter:**

1. **Internal state changes are on the same bus as platform events.** This is the non-obvious
   one. It means the audit projector, the shadow-mode observer and the anomaly detector consume
   a single stream, and it means a *hold* is an event that the publish reconciler and the inbox
   both see. Products that only bus external events end up polling their own database.
2. **Partitioned by `tenant_id`, keyed by `entity_id`.** Tenant partitioning gives fair-share and
   blast-radius containment; entity keying preserves per-conversation and per-post ordering
   (thread replies, comment→reply chains) `[07 §16.3]`.
3. **Alert state is a separate store from mention state.** A mention arriving twice must not page
   a human twice; alerting needs its own dedupe windows, escalation state and acknowledgement
   `[12 §16.2 note 5]`.
4. **Every event carries `provenance_class` and `licence_class`.** These drive retention,
   deletion propagation, export permission and what may be joined with what — they are fields,
   not metadata `[12 §16.2 note 2]`.
5. **Replayability.** Raw payloads go to object storage in Parquet partitioned by `dt/source`
   before enrichment. Re-enrichment when models improve is then a batch job, not a re-crawl —
   and re-crawling is often impossible `[12 §16.2 note 3]`.

### 6.3 The canonical event

```ts
interface Signal {
  signalId: string;            // ULID
  tenantId: string; orgNodeId?: string; connectionId?: string;
  kind: SignalKind;            // closed vocabulary, ~80 members
  entityId: string;            // partition key for ordering
  occurredAt: Date;            // platform time where known
  observedAt: Date;            // our time — the difference IS the detection latency (§16.8)
  source: { networkId?: NetworkId; mechanism: 'webhook'|'poll'|'stream'|'crawl'|'internal';
            pollIntervalAtObservation?: Duration };
  provenanceClass: 'owned'|'open'|'metered'|'licensed'|'user_supplied';
  licenceClass: LicenceClass;  // drives retention + export permission
  payloadRef: string;          // object-storage pointer; the bus carries the pointer, not the blob
  digest: PayloadDigest;       // enough for routing/dedupe without loading the payload
}
```

`observedAt - occurredAt` is retained per network and percentiled. That series **is** the
per-channel SLA floor in §16.8 — a measured number, not a guess, and it is what lets the product
refuse an unachievable SLA configuration.

### 6.4 Delivery semantics per consumer

| Consumer | Semantics | Rationale |
|---|---|---|
| Inbox projection | At-least-once + idempotent upsert on `(network, native_id)` | Duplicates are invisible; loss is not |
| SLA clock | Exactly-once via transactional outbox on the conversation aggregate | A double-started clock produces false breaches |
| Publish reconciler | At-least-once, idempotent by `external_id` | Readback is naturally idempotent |
| Anomaly / kill switch | At-least-once, deduped by alert key + window | Paging twice is a defect |
| Warehouse CDC | Exactly-once via Debezium → Iceberg with merge-on-read | Analytics correctness |
| Agent trigger router | At-least-once, but the **Action Gate's idempotency key deduplicates the action**, not the trigger | Trigger dedupe is best-effort; action dedupe is authoritative |

That last row is the general principle: **exactly-once is enforced at the Action Gate, not at the
bus.** Chasing exactly-once delivery across nine platform mechanisms is a losing engineering
project; making the *effect* idempotent is tractable.

### 6.5 Polling as a budgeted, prioritised activity

`[C6]`, `[C7]` and `[C8]` mean polling is not a background detail — it is a metered, contended
resource that determines both cost and SLA. The poll scheduler is therefore a first-class
service with:

- **Per-network, per-tenant poll budgets** derived from plan tier. X reads are modelled per
  customer: `accounts × (mention_polls/day × 30 × avg_results + dm_polls/day × 30 × avg_dm)`
  against the tier cap `[06 §19.5]`. Exceeding the budget degrades *frequency*, visibly, with a
  quota meter in the UI — never silently.
- **Adaptive intervals.** Conversations with an open SLA clock, active crises, and recently-active
  threads poll faster; dormant connections back off. The floor and ceiling come from the
  Capability Ledger.
- **Priority lanes**: interactive > scheduled publish > SLA-critical poll > routine sync >
  backfill. Backfill is preemptible `[07 §16.2]`.
- **Fair share on project-scoped quotas** (GBP ~300 QPM, shared Telegram bot, Google Play):
  per-tenant allocation weighted by plan, with admission control that rejects with an honest ETA
  rather than silently delaying `[07 §16.2]`.

---

## 7. The agent runtime and tool surface

### 7.1 Where agents sit

Agents are **ordinary clients of the four kernels**. They have no privileged path. An agent that
wants to publish calls the same Action Gate the composer calls; an agent that wants to read
metrics calls the same adapter fabric. This is what makes the governance claim true rather than
aspirational, and it is why the runtime section is short: most of the hard work is in §3 and §4.

```
┌──────────────────────────────────────────────────────────────────────┐
│ AGENT RUNTIME                                                        │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Triggers   │  │ Planner     │  │ Tool broker  │  │ Trace       │ │
│  │ (bus subs, │─▶│ (model via  │─▶│ (schemas     │─▶│ writer      │ │
│  │  schedule, │  │  broker,    │  │  generated   │  │ (§3.4)      │ │
│  │  human ask)│  │  pinned ver)│  │  from ledger)│  │             │ │
│  └────────────┘  └─────────────┘  └──────┬───────┘  └─────────────┘ │
└─────────────────────────────────────────┼──────────────────────────┘
                                          ▼
                                    ACTION GATE (§3)
                                          ▼
                              ADAPTER FABRIC / SIGNAL BUS
```

### 7.2 The agent catalogue (v1)

Deliberately small. Each is a configuration of the same runtime — trigger set, tool set, policy
scope, rubric — not a separate codebase.

| Agent | Trigger | Tools | Default mode |
|---|---|---|---|
| **Triage** | inbound comment/DM/review/mention | classify, label, assign, draft reply, escalate | `propose` |
| **Responder** | triaged item within policy | send reply, hide, like, escalate | `shadow` → `approve_required` |
| **Composer** | brief, RSS item, calendar gap | draft, variant, transform-per-network, schedule | `propose` |
| **Analyst** | schedule, human ask | query metrics, build report narrative, explain deltas | `auto` (read-only) |
| **Watch** | anomaly signals | propose crisis hold, propose kill switch | `propose` — **never `auto`** (§16.1) |
| **Repair** | connection health degradation | draft repair-link batch, notify owner | `propose` |

Read-only agents may run `auto` because their blast radius is zero. Every write agent starts in
`shadow` and is promoted only from evidence (§3.7).

### 7.3 Outbound MCP — the product as a tool surface

Vista ships ~60 MCP tools with no dry-run, no confirmation gate, no scoped token and no
publish/spend cap `[01 §23]`, `[09 §4.6]`. We ship a comparable tool count with all four, and the
tool schemas are **generated from the Capability Ledger** so an MCP client sees the same
capability truth the composer does.

- Read tools: no gate beyond tenancy and rate limits.
- Write tools: `dryRun` default true; `destructiveHint` annotations set honestly; propose→confirm
  for publish/dm/boost/delete; scoped per-brand tokens; server-side caps (§3.6).
- Every MCP invocation produces a decision skeleton with `actor_kind='mcp_client'` and the client
  identity, so an agency can answer "what did the client's ChatGPT do last week" from the audit
  export.

The strategic reasoning is in `[09 §4.6]` and is worth restating because it inverts a common
instinct: if all your value is reachable through MCP, the UI stops being the moat and **the data
plus the policy engine plus the write-safety layer become the moat.** That is an argument for
building §3, not for withholding MCP.

### 7.4 Inbound MCP and the untrusted-content boundary

Inbound MCP (trend feeds, ad platforms, CRM, commerce, review data) reduces integration cost
`[09 §4.6]`. It also imports untrusted text into agent context. Rules:

- Inbound MCP servers are registered per tenant, with an explicit allowlist and their own egress
  policy through the hardened HTTP client (§13.7).
- All inbound content is `provenance:'external'` and cannot influence policy, budget or tool
  selection (§3.6 rule 5).
- Inbound tool results are truncated and schema-validated before entering context; free-form
  passthrough is not permitted.

### 7.5 Human-in-the-loop surfaces

Three, and they map to the three verdicts:

1. **Propose queue** — agent output awaiting a human, in the surface the human already lives in:
   in-app, Slack, Teams, email digest, mobile push.
2. **Approval routing** (§16.5) — for `approve_required`, with SLA ladders and delegation.
3. **Reversibility window** — for `auto_within_budget`, the action is taken but a countdown
   allows one-click reversal, and the reversal path is recorded in the trace. Reversibility is
   per-action-type: a reply can be deleted, a DM cannot be unsent, a boost can be paused. The
   ledger records which, and the policy UI refuses to offer a reversibility window where the
   platform provides none.

---

## 8. Data model, multi-tenancy and isolation

### 8.1 The tenancy ladder

Vista's `profile group` is a flat primitive that agencies bend into a hierarchy and franchises
cannot use at all `[02 §5]`, `[01 §21]`. We model the hierarchy properly, once, and let both
segments resolve through it. Per `[verifier: franchise ¶6]`, the *same* data model serves the
agency buyer (nearer, warmer, self-serve-reachable) and the franchise buyer — so this is one
build, sold two ways.

```
Tenant  (billing, residency region, plan, compliance mode, KEK)
  └── Workspace              (rarely >1; exists for enterprises with separate BUs)
        └── OrgNode          ── SELF-REFERENTIAL TREE, the load-bearing object
              kind: agency_client | brand | region | market | location | profile_group
              parent_id, path (ltree), depth, timezone?, locale?, currency?
              └── SocialProfile (a connected account)  ─┬─ Connection (credentials)
                                                        └─ CapabilitySnapshot
```

**Everything resolves through the tree**, with explicit inheritance semantics:

| Concern | Resolution |
|---|---|
| Permissions | Role grant at node N applies to the subtree of N. Deny at a deeper node wins. |
| Approvals | Nearest ancestor with a routing policy; `inherit` is explicit, not implied |
| Timezone | **Profile-level, with node default** — the one genuinely sellable time item `[verifier: time ¶KEEP-2]` |
| Locale / week data | Node default → user override; CLDR-driven (§14.6) |
| Reporting roll-up | Aggregate over subtree; compliance view = "which of my N locations posted this month, and which are dark" |
| Autonomy policy | Nearest ancestor; budgets are **per-node**, not shared with the parent's pool |
| Holds | Applied at any node; resolution walks *down* the subtree and *across* content labels (§16.1) |
| Retention | Nearest ancestor with an explicit policy; tenant compliance-mode overrides `[11 §5.6]` |

Path queries use PostgreSQL `ltree` with GiST indexes; subtree permission checks are a single
`@>` predicate rather than a recursive CTE per request.

### 8.2 Core entities

Abbreviated to the fields that carry architectural weight. `t` = `tenant_id`, present on every
row and enforced by RLS (§8.5).

```sql
-- IDENTITY & ACCESS
tenant(id, name, residency_region, plan, compliance_mode, kek_ref, created_at, deleted_at)
user(id, t, email, sso_subject, mfa_state, display_tz, locale, status)
seat(id, t, user_id, class)                 -- class: full | contributor | REVIEWER(free) | client_portal
role_grant(id, t, user_id, org_node_id, role, granted_by, granted_at)
                                            -- REVIEWER seats are free — forced by [L5]
service_identity(id, t, kind, org_node_scope, action_scope[], budget_ref, created_by)
                                            -- agent tokens, API keys, MCP clients

-- ORG & CONNECTIONS
org_node(id, t, parent_id, path, kind, name, timezone, locale, currency, settings)
social_profile(id, t, org_node_id, network_id, external_id, parent_external_id,
               display_name, avatar_url, timezone, capability_snapshot_ref, status)
connection(id, t, social_profile_id, credential_kind, instance_url, instance_software,
           instance_capabilities, secret_ref, scopes[], expires_at, refresh_at,
           health, health_detail, last_probe_at, last_verified_at)
   -- secret_ref is a VAULT POINTER, never a secret.  instance_* fields are what make
   -- archetype C work and are absent from most competitors [07 §14.1]

-- CONTENT
content(id, t, org_node_id, kind, status, labels[], created_by, campaign_id,
        rights_state, ai_generated, current_version_id)
content_version(id, content_id, version, body_ir, hash, created_by, created_at)
   -- body_ir is a NETWORK-NEUTRAL intermediate representation; per-network payloads are DERIVED
content_target(id, t, content_id, social_profile_id, negotiation_result, payload_override,
               scheduled_wall_clock, scheduled_zone, dispatch_mode, state, external_id,
               idempotency_key, hold_id, assisted_state)
   -- scheduled time is (wall_clock, zone) — NOT a UTC instant [08 §17.1]
content_label(t, content_id, label)          -- FAIL-CLOSED scoping for holds (§16.1)

-- CAMPAIGNS & ASSETS
campaign(id, t, org_node_id, name, starts_at, ends_at, goals, budget)
asset(id, t, org_node_id, kind, storage_ref, checksum, dimensions, duration,
      alt_text, rights_object_id, provenance)
rights_object(id, t, source, grant_scope[], territories[], channels[], starts_at, expires_at,
              model_release_ref, music_licence_state, creator_contract_ref,
              consent_terms_snapshot, origination: 'first_party'|'imported', verified: bool)
   -- 'imported' rights are UNENFORCED and labelled as such (§16.9)

-- CONVERSATIONS
conversation(id, t, org_node_id, social_profile_id, network_id, native_thread_id, kind,
             participant_ref, state, assignee_id, labels[], sla_policy_id,
             first_response_deadline, resolution_deadline, send_window_state)
message(id, t, conversation_id, direction, native_id, author_ref, body, media[],
        occurred_at, observed_at, provenance_class, licence_class)

-- METRICS  (three layers — §10.3)
metric_raw(t, network_id, entity_type, entity_id, metric_name_native, value, period,
           api_version, collected_at, raw_payload_ref)
metric_canonical(t, network_id, entity_type, entity_id, metric_id, comparability_class,
                 value, period, derivation_id)
follower_snapshot(t, social_profile_id, date, followers)   -- snapshotted, NOT read live [12 §17.3]

-- GOVERNANCE
autonomy_policy(id, t, org_node_id, action, actor_kind, mode, budgets, guardrail_refs[],
                escalation, reversibility, version, created_by)
decision_skeleton(...)   -- §3.4, immutable, no PII
decision_payload(...)    -- §3.4, erasable, tombstoned
publishing_hold(...)     -- §16.1
audit_event(id, t, actor, action, target, before_hash, after_hash, ts, ip, ua, decision_id)
```

### 8.3 Why `body_ir` is network-neutral

Storing per-network payloads as the source of truth is the mistake that makes "apply to all" a
lie and makes adding network #71 a migration. `body_ir` is a small block IR — paragraphs, media
refs, mentions, links, hashtag blocks, thread breaks — and every network payload is a pure
function `(body_ir, capability, overrides) → payload`. Consequences:

- Re-rendering after a capability change is a recompute, not a data fix.
- Per-network overrides are *diffs against the derived payload*, so an edit to the base text
  still propagates where the user did not override.
- The locked-template feature (§16.4) becomes a diff check on `body_ir` at publish time —
  enforcement by comparison, not by policy document.

### 8.4 Multi-tenancy strategy

**Shared schema, row-level security, per-tenant encryption keys, per-region physical shards.**
Reasoning, stated as a trade rather than a preference:

| Option | Verdict |
|---|---|
| Schema-per-tenant | Rejected. Migration cost across 10⁴–10⁵ tenants; connection-pool explosion; no benefit RLS + per-tenant KEK does not already give. |
| Database-per-tenant | Rejected for the general case; **used for enterprise BYOK/HYOK and China** where the isolation is contractual, not technical. |
| Shared schema + RLS + per-tenant KEK | **Chosen.** Cheap, and the KEK gives the blast-radius and crypto-shred properties that schema separation is usually bought for `[11 §10.3]`. |
| Regional shards | **Required**, not optional — `[08 §14.6]`, `[11 §4]`. §14.5. |

### 8.5 Isolation enforcement — three layers, because one always fails

1. **Structural.** RLS policies on every table keyed to `current_setting('app.tenant_id')`. The
   data-access layer cannot express an unscoped query — the base repository takes a
   `TenantContext` and there is no constructor without one. "Remember to add `WHERE tenant_id=?`"
   fails eventually, and once is enough `[11 §10.7]`.
2. **Cryptographic.** AAD binds every ciphertext to `tenant_id|connection_id|platform|key_version`.
   A missed tenant filter becomes a *decryption failure*, not a data leak. This is the reason AAD
   is worth the effort `[11 §10.2 #4]`.
3. **Behavioural.** A CI property test generated from the route table: for every endpoint, tenant
   A's credentials + tenant B's object id must yield 403/404. New endpoints are covered by
   default because the test is generated, not written `[11 §10.7]`.

### 8.6 Storage engine choice

| Data | Store | Why |
|---|---|---|
| OLTP core (org, content, connections, conversations, governance) | **PostgreSQL 16+** with `ltree`, RLS, partitioning on high-volume tables | Relational integrity is the whole point of the hierarchy; RLS is the isolation primitive |
| Hot queue state, budgets, locks, rate limiters | **Redis** (cluster) | Atomic Lua for lease/CAS; per-connection distributed locks for refresh `[C3]` |
| Event log | **Kafka / Redpanda** | §6 |
| Raw archive | **Object storage, Parquet, partitioned `dt/source`** | Re-enrichment `[12 §16.2]` |
| Analytics | **ClickHouse** (serving) + **Iceberg on object storage** (lake, customer-shareable) | ClickHouse for sub-second dashboards over billions of metric rows; Iceberg because the customer must be able to own the table `[12 §25.2]` |
| Search | **OpenSearch** with kNN | Inbox + listening search; vector namespaced per tenant per source record for erasability `[11 §5.5]` |
| Vectors | Namespaced within OpenSearch initially; pgvector for small per-tenant knowledge bases | Avoids a fourth datastore until scale demands it |
| Media | Object storage + signed public-read paths for `platform_pulls_url` networks `[C1]` | §14.4 |

**Deliberate non-choice:** no separate document store. Semi-structured payloads live in
PostgreSQL `jsonb` (small, indexed) or object storage (large, referenced). Adding MongoDB buys
nothing here and adds a deletion-handler surface `[11 §5.3]`.

---
## 9. The scheduling and publishing engine (the commodity subsystem, built correctly)

Scheduling is where this document spends the least *novelty* and the most *rigour*. It is a
commodity, and commodities still have to work — `[12 §33.1]` puts publishing failure at 10–15% of
SMB churn, the highest addressable line.

### 9.1 The state machine

```
DRAFT → VALIDATED → MEDIA_STAGED → [archetype branch] → PUBLISHING → PUBLISHED
                                                       ↘ FAILED_RETRYABLE →(backoff)→ PUBLISHING
                                                       ↘ FAILED_TERMINAL  → user-actionable
                                                       ↘ EXPIRED (container TTL) → MEDIA_STAGED
                                                       ↘ HELD → (release) → re-slot | skip
                                                       ↘ ASSISTED_* (§5.3)
PUBLISHED → VERIFYING → VERIFIED
                      ↘ PUBLISHED_THEN_REMOVED   (§16.12 — terminal, notifies, ledgered)
                      ↘ VERIFICATION_UNAVAILABLE (network has no readback — admitted in the UI)
```

Archetype branches: container (`CONTAINER_CREATED → PROCESSING → READY`), resumable
(`UPLOAD_INIT → UPLOADING → FINALIZING`), handle (`HANDLE_READY`), native-scheduled
(`HANDED_OFF → NATIVE_PENDING`), async-reviewed (`SUBMITTED → UNDER_REVIEW → APPROVED|REJECTED`).

Every transition persists. The job is a state machine row, not an in-flight function
`[06 §19.1]`.

### 9.2 Exactly-once, honestly

True exactly-once against nine asynchronous non-transactional APIs is not achievable. What is
achievable is **exactly-once effect**, via three mechanisms chosen per network from the
Capability Ledger (`publish.idempotency`):

| Mechanism | Networks | Implementation |
|---|---|---|
| `native_header` | Mastodon (`Idempotency-Key`) | Pass our deterministic key `[07 §15.5]` |
| `readback_check` | Reddit, Meta, TikTok, LinkedIn | Before any retry, query for a post matching our key/signature (`/user/{me}/submitted`, media-node GET, status/fetch) |
| `local_lock` | Telegram, Discord webhooks | Per-`(chat, content_target)` lease held across the attempt |

The deterministic key is `hash(content_target_id, content_version_hash, attempt_epoch)` where
`attempt_epoch` changes only on an explicit human "publish again". Two workers racing the same
target both compute the same key; the lease and the readback both catch it.

**The failure this prevents is the most damaging in the category** — Meta and TikTok can succeed
server-side while the response is lost, and a naive retry double-posts to the customer's audience
`[06 §19.1]`, `[05 §11 G6]`.

### 9.3 Retry policy and the lateness budget

Retries are bounded by a **user-configurable lateness budget** per content target (default 30
minutes, per-profile overridable), not by an attempt count. The semantics are:

```
if now > scheduled_instant + lateness_budget:
    stop retrying
    state = FAILED_TERMINAL(reason = LATENESS_BUDGET_EXCEEDED)
    offer: publish now (one click) | re-slot to next queue slot | discard
```

This is the honest answer to "a post silently didn't go out": it did not go out, we stopped
trying at a time you chose, and here are three buttons. Backoff is exponential with jitter, class
determined by §4.5, and `RATE_LIMITED` retries do not count against the reliability metric.

### 9.4 Rate-limit budgeting

Three-level hierarchy, because `[C8]` makes a single global limiter wrong:

```
GLOBAL per (network, app_credential)   ← the platform's actual limit; we never exceed it
  └── TENANT allocation                ← weighted by plan; prevents one bulk op starving others
        └── CONNECTION bucket          ← per-connection concurrency from the ledger
                                          (reddit 1, threads 2, bluesky 2, pinterest 3,
                                           x 10, youtube 200, facebook 500)  [05 §11]
```

- Limiter model per network comes from `limits.model` (header-window, bucket-hash, points,
  method-tier, daily-cap, project-quota, opaque) `[07 §16.1]`.
- **Slots are reserved at T-60s**, not claimed at T+0 — discovering a rate limit at dispatch time
  means a late post `[07 §16.3]`.
- **Pre-flight quota simulation** at *schedule* time: "this calendar breaches Instagram's 25/day
  cap on the 14th" / "these 40 videos exceed your YouTube quota 6×". `[05 §11 G5]` records that
  no product does this and that the data to do it is public. It is a two-day feature on top of
  the ledger and it is immediately legible to a user.
- Circuit-breaker state is **visible in the customer UI**: "Reddit is rate-limiting us; your
  10:00 post is queued, ETA 10:07" `[07 §16.3]`.

### 9.5 Time correctness

Adopting `[verifier: time]`'s narrowed scope exactly — 3–4 engineer-weeks of hygiene, framed as
demo credibility, never as the headline.

1. **Store `(wall-clock local, IANA zone)`; resolve the UTC instant at dispatch** from the current
   tzdb. A government DST change must not drift a customer's "9am local" `[08 §17.1]`.
2. **tzdb update pipeline** with staleness alerts, pinned version, tested upgrade. A stale tzdb is
   a correctness bug with an owner and a page.
3. **DST-ambiguous / nonexistent local times** handled explicitly with Temporal's vocabulary
   (`compatible|earlier|later|reject`), surfaced in the UI when it bites.
4. **Timezone on the PROFILE** with an org-node default, plus "publish at 9am local per profile"
   for multi-region rollouts. Position as *"multi-region without splitting your groups"* — the
   buyer's pain is fragmented reporting and permissions, not timezone math `[02 §376, §440]`.
5. **Dual-time rendering** in the composer ("09:00 for the profile / 14:00 for you"). Cheapest
   item on the list and the one that actually prevents 3am posts, because the real cause is UI
   confusion.
6. **CLDR `weekData.json`** for first-day-of-week and weekend shading. Two JSON lookups. SA=sun
   but AE=mon; weekends are Fri–Sat across SA/EG/IL/KW/QA/OM/BH/JO/DZ, Fri-only in IR, Thu–Fri in
   AF `[08 §17.3]`.
7. **Generic recurring blackout windows** (per profile, per weekday, per time range, with a
   timezone). This one primitive subsumes Fri–Sat weekends, Friday prayers, Shabbat and Iftar —
   and doubles as the scheduled half of the crisis kill-switch `[verifier: time ¶KEEP-5]`.
8. **Ramadan/Eid campaign-planning overlay** with country-selectable dates showing the ±1-day
   moon-sighting variance explicitly, a countdown, and pre-/post-Iftar dayparting presets. Never
   assert one global Hijri date `[08 §17.4]`.

**Cut, explicitly:** Persian calendar (CLDR preference is IR+AF; both sanctions-blocked for B2B
SaaS — zero addressable revenue). Hebrew sunset-to-nightfall interval modelling (needs
per-location astronomical sunset plus a contested halachic definition; item 7 serves Israeli
marketers at 2% of the cost). Hijri *date entry*. Buddhist/ROC/Japanese-era "calendar display" is
implemented silently as an `Intl.DateTimeFormat` calendar option and never mentioned in
positioning.

### 9.6 Failure and reauth handling on the publish path

- A connection in `reauth_required` **fails at schedule time**, not at publish time — the Action
  Gate denies with `CONNECTION_UNHEALTHY` and the composer offers a repair link.
- Per-connection circuit breakers so one dead token cannot starve a shared worker pool
  `[06 §19.1]`.
- Auth errors on the publish path attempt **one** single-writer refresh under a per-connection
  distributed lock, then fail to `reauth_required`. Never a speculative refresh, never concurrent
  `[11 §10.5]`, `[C3]`.
- **Partial-success handling** for carousels and threads is explicit: a 3-of-5 carousel is not
  "published". It is `PARTIAL` with a named remediation (publish the remainder / delete and
  retry), and the reliability metric counts it as a failure.

---

## 10. Ingestion and analytics

### 10.1 Webhooks versus polling — the map, not the preference

| Network | Mechanism | Consequence |
|---|---|---|
| Meta (FB/IG) | Rich webhooks | Real-time inbox; SLA floor ≈ seconds |
| Threads | Partial webhooks | Mixed; poll fallback for gaps |
| TikTok | Narrow (publish status only) | Comments **must** be polled |
| YouTube | PubSubHubbub (uploads only) | Comments polled |
| X | Webhooks enterprise-only | Polling, and **metered** `[C6]` |
| LinkedIn | **None**, and no DM API at all | Poll everything; DM inbox does not exist. Say so. |
| Pinterest | None / `UNVERIFIED` | Poll |
| Bluesky | Jetstream WSS, unsampled | Stream; the open exception `[12 §9]` |
| Mastodon | WSS per instance | Stream, per-instance rate tracked |
| Reviews (GBP, Trustpilot) | Poll | Cursor-based incremental sync |

This table is data in the Capability Ledger (`read.realtime`, `read.pollFloor`), and it
generates the per-channel SLA floor UI in §16.8. **The product refuses to let a customer
configure an SLA its detection latency cannot meet.** That single behaviour converts our worst
coverage weakness into the trust posture `[verifier: coverage ¶8]`.

### 10.2 Backfill

Two backfills, with different strategic weight:

1. **Connect-time platform backfill** — on connecting an account we immediately backfill to the
   maximum depth each API allows: Instagram ~2y media insights, Facebook ~2y, YouTube full
   history, LinkedIn ~12mo, TikTok as permitted. This is `[12 §33.4]`'s "move nobody has made":
   it converts the incumbent's strongest lock-in — three years of analytics — into a 20-minute
   automated job that produces a populated dashboard *before* the customer cancels anything. It
   needs no cooperation from the incumbent and the incumbent cannot prevent it.
2. **Listening backfill** — Common Crawl for the open web; licensed providers only where an
   enterprise contract funds them `[12 §13, §14]`.

Backfill runs in the lowest priority lane and is preemptible `[07 §16.2]`.

### 10.3 Metric normalization — the three-layer model

`[12 §17]` is the most valuable and least glamorous engineering in the product, and it is
implemented literally:

```
Layer 1 RAW        per-network, exact platform field names, NEVER altered, with api_version
Layer 2 CANONICAL  cross-network metric ids, each carrying a COMPARABILITY CLASS
Layer 3 DERIVED    ratios computed only within a class and within a network
```

Canonical set with classes (A = comparable, B = directional only):
`reached` A · `served` B · `video_started` B · `video_completed` A ·
`watch_time_seconds` A (the single most comparable video metric) · `reactions` A · `comments` A ·
`shares` B · `saves` A · `link_clicks` A · `profile_actions` B.

Rules enforced in the query layer, not in documentation:
- A cross-network roll-up **must** be labelled with its class; the API refuses to sum across
  classes without an explicit `allow_mixed_class=true` that stamps the result.
- **Engagement rate: ship all four definitions** (by reach, by impressions, by followers, by
  views), default to by-reach where available and by-followers otherwise, and **put the formula
  in a tooltip on the number**. Vendors that hide the formula generate support tickets forever
  `[12 §17.3]`.
- `followers_at_post_time` is **snapshotted daily and stored**. Computing historical ER against
  today's follower count silently rewrites history every day — a bug present in a surprising
  number of shipped products `[12 §17.3]`.
- Every canonical value carries a `derivation_id` pointing at the versioned mapping that produced
  it, so a mapping change is auditable and re-derivable from Layer 1.

**Metric provenance** is a first-class field: `api_sourced | derived | estimated`. This is why §5
drops manual metric capture from v1 — mixing self-reported numbers into an API-sourced series
contaminates the one provenance claim we can make honestly `[verifier: reminder ¶7]`.

### 10.4 Retention under platform ToS

Platform retention windows are short and inconsistent: Pinterest 90d, X non-public 30d, TikTok
~60d, LinkedIn ~12mo on some org metrics, YouTube generous, Meta ~2y `[06 §7.2]`, `[12 §17.4]`.

**Therefore the metrics warehouse is a launch requirement, not a v2 item** `[06 §19.6]`. Daily
idempotent snapshot jobs per connected account, backfilled to the maximum at connect time, stored
in Layer 1 forever subject to the retention engine.

The retention engine resolves, per data class, the **strictest** of: platform ToS ceiling, legal
floor/ceiling, tenant configuration `[11 §5.6]`. Defaults: D4 audience 90d rolling
(tenant-adjustable **downward only**); D6 listening raw 30–90d with longer aggregates; D7 inbox
12mo default, extendable only in compliance mode for FINRA/SEC customers; D8 embeddings inherit
their source. Every store that receives personal data registers a **deletion handler at build
time**, and a store without one fails a CI check — the only pattern that survives feature growth
`[11 §5.3]`.

### 10.5 OLTP versus OLAP

- **OLTP (PostgreSQL)** owns anything a human edits or a policy evaluates: content, connections,
  conversations, policies, holds, approvals.
- **OLAP (ClickHouse)** owns metric serving: `metric_canonical` partitioned by
  `(tenant, month)`, ordered by `(org_node_path, network, entity, metric, date)`. Dashboards hit
  ClickHouse exclusively; a dashboard query must never touch the OLTP primary.
- **Lake (Iceberg on object storage)** owns the raw archive and is the *customer-visible* surface.

The seam is a CDC pipeline (Debezium → Kafka → ClickHouse + Iceberg) with exactly-once
merge-on-read. Rebuilding ClickHouse from Iceberg must be a routine, exercised operation — it is
the recovery path for every metric-mapping bug.

### 10.6 Listening

Adopt `[12 §16.1]`'s tiering and — critically — **display the tier per source, in the UI, on
every result set**:

```
Bluesky: complete · YouTube: complete · Mastodon: complete ·
X: sampled (18% of your quota used) · Instagram: hashtag-limited (12/30 this week) ·
Facebook: unavailable — no public search API
```

That is more trustworthy, more useful and cheaper to operate than a competitor's opaque unified
number, and honesty about coverage is a feature nobody in this category ships `[12 §16.1]`.

Enrichment is the **hybrid**: self-hosted encoders (`twitter-roberta-base-sentiment-latest` class,
XLM-R for multilingual) over 100% of the stream at ~$5–20/1M mentions, routing to an LLM only for
(a) high author-reach, (b) low encoder confidence or class disagreement, (c) inside an active
anomaly window, (d) a ~1% audit sample. That is 2–5% of volume on the expensive path, turning a
$3,000 problem into a $60 problem `[12 §16.3]`.

**Do not fund cross-platform mention-velocity listening triggers before enterprise ARR exists.**
X/Reddit data pricing is the largest single unknown in the corpus `[12 §1833]`, and §16.1's
listening-triggered hold proposal is therefore scoped to **owned-channel comment/DM sentiment
velocity only** in v1.

### 10.7 Warehouse access — the category's largest hole

`[12 §25.2]` answers "does any SMM tool ship a real warehouse-native model?" with *not one*, and
supports it with a star-count ratio worth repeating: `fivetran/dbt_ad_reporting` at 218 stars
versus `dbt_social_media_reporting` at 24. The warehouse world built serious models for **paid**
social and essentially nothing for **organic**.

We ship, in order of cost:

1. **A published, versioned, documented dbt package** for organic social with a real semantic
   layer and the comparability classes from §10.3 exposed as column metadata.
2. **Bring-your-own-bucket / Iceberg tables the customer owns**, written by our CDC pipeline into
   their storage with their catalog.
3. **Snowflake Native App / BigQuery Analytics Hub listing / Databricks Delta Sharing.**
4. **Row-level export of mentions and enrichments**, not just aggregate CSVs — subject to
   `licence_class`, which is why that field is on every event (§6.3).
5. **Reverse ETL hooks**: warehouse-defined content triggers, audience suppression,
   warehouse-driven approval routing `[12 §25.3]`.

**The strategic tension, resolved deliberately.** The strongest switching costs in this category
are data-custody costs, and a warehouse-native model gives exactly those away `[12 §33.2]`. The
resolution: **give away the raw data, keep the derived intelligence.** Export every mention,
metric and enrichment; retain the benchmark panel, the models, the alerting, the policy engine and
the workflow. Data portability as a marketing position is strong *precisely because* no
incumbent can match it without dismantling their own lock-in.

### 10.8 Benchmarks as the one real data network effect

Aggregating our own customer base yields percentile distributions of ER, cadence, follower growth
and best-time-to-post by industry, follower band and network. It requires enough accounts per
cell, explicit ToS permission for aggregated benchmarking, **k-anonymity thresholds (never show a
cell under ~20–30 accounts)**, and an opt-out `[12 §18.1]`. Every additional connected account
improves the benchmark for every other customer; it compounds and cannot be bought. It is also
the cold-start solution for §16.11's creative-feature priors.

---

## 11. Inbox and engagement real-time architecture

### 11.1 The shape

```
Signal Bus ──▶ conversation projector ──▶ conversation aggregate (PostgreSQL)
                     │                            │
                     │                            ├──▶ SLA clock (transactional outbox)
                     │                            ├──▶ send-eligibility state machine (§11.4)
                     │                            └──▶ assignment / routing
                     │
                     └──▶ OpenSearch (search + kNN over message bodies, tenant-namespaced)

client ◀── WebSocket fanout (per-tenant channel, per-conversation topic) ◀── projector
```

The conversation aggregate is the consistency boundary: assignment, state, SLA deadlines and send
eligibility all mutate under one optimistic-concurrency version, so two agents cannot both claim
an item and two clocks cannot both start.

### 11.2 Detection latency is a product surface

`observedAt - occurredAt` per network per mechanism is percentiled continuously (§6.3) and shown
to the customer as the **channel SLA floor**. A customer configuring a 1-hour first-response SLA
on LinkedIn — which has no organic webhooks — is shown "fastest achievable on this channel:
~4 hours (we poll every 4h at your plan's quota)" and the form will not accept the tighter value.
Selling the floor as a trust feature is the same "conspicuous honesty" posture as §10.6
`[verifier: coverage ¶8]`.

### 11.3 Coverage: on-duty, overnight, breached

The three items the verifier kept `[verifier: coverage]`:

1. **SLA as a managed object** — targets per brand/channel/conversation-type, alerts **before**
   breach, escalation ladders, SLA-based routing. Genuinely absent below ~$50k/yr `[03 §238,
   §1333]`.
2. **Timezone-aware handover digest** — "47 items arrived, 12 unanswered, 3 approaching breach,
   sentiment shifted on this topic." No competitor evidence in twelve dossiers, no platform
   dependency, cheap. **This is the demo moment.**
3. **The Instagram send-eligibility state machine** (§11.4).

Rosters are a **thin input**, not a WFM product: who is on shift now, in what timezone, so
escalation knows whom to page and the digest knows whom to address. No scheduling, forecasting or
adherence — that is Assembled/Deputy/PagerDuty territory and the 3-person ICP will never use it
`[verifier ¶6]`. Agent capacity/concurrency is post-PMF `[verifier ¶5]`.

Positioning correction adopted: this is a **price and packaging divide**, not "the largest
functional divide in the market". The pitch is *"contact-centre SLA discipline at agency price,
without adding a Zendesk seat per social manager"*, and the competitor to beat is the buyer's
existing helpdesk plus a spreadsheet `[verifier ¶9]`.

### 11.4 The send-eligibility state machine (specified correctly)

Two clocks, not one `[06 §8.2]`, `[02 §620]`:

```
CLOCK A — DM window
  starts/resets on: any user MESSAGE (including a Story reply — Story replies ARE messages)
  duration: 24h
  extension: HUMAN_AGENT tag → 7 days, support content only
  A COMMENT DOES NOT RESET THIS CLOCK

CLOCK B — comment → private reply
  one reply per comment, within 7 days of the comment
  a separate, one-shot path; does not open Clock A
```

Three states surfaced to the agent, live, per conversation:

| State | Meaning |
|---|---|
| `OPEN` | Can send anything |
| `HUMAN_AGENT` | Human-agent window; support content only |
| `CLOSED` | Template path only (or nothing, per network) |

The composer in the inbox is *disabled with an explanation* in `CLOSED`, and the countdown is
visible. Getting this wrong produces silent send failures that look like our bug.

### 11.5 The small mechanics, shipped where they work

Per `[verifier: coverage ¶7]` and `[02 §1112]`, `[06 §8.1]`: like-as-brand on FB/LinkedIn/TikTok
(IG `UNVERIFIED`, YouTube/Threads no); block on **Facebook Pages only** (`blocked_users`) —
Instagram has no block endpoint; hide/delete where exposed. Ad and dark-post comment moderation is
**table stakes to reach, not a wedge** — NapoleonCat and Statusbrew are rule-based ad-moderation
specialists and NapoleonCat got there first `[04 §383–409]`.

Each of these renders from `inbox.*` in the Capability Ledger, so the button is absent with a
reason rather than present and broken.

---
## 12. The AI layer

### 12.1 The Model Broker

Every model call in the product goes through one service. No module holds a provider SDK.

```ts
interface ModelBroker {
  complete(job: JobClass, ctx: BrokerContext, req: Request): Promise<Response>;
}
interface BrokerContext {
  tenantId: string; orgNodeId: string;
  residencyRegion: Region;        // pins the endpoint — EU/AU/JP carry ~+10% [09 §7.1]
  budgetRef: BudgetRef;           // §3.5 lease
  provenanceSink: TraceRef;       // model_id@version + prompt_hash into the decision skeleton
}
```

Responsibilities: routing by job class, prompt-prefix caching, budget enforcement, region
pinning, provider failover, model-version pinning, cost attribution per tenant/brand, and
provenance capture. Because it is one service, a provider deprecation is one deploy, and
"which model wrote this post" is answerable for every post ever published.

### 12.2 Routing policy

From `[09 §7.1]`, adopted directly:

| Job | Class | Why |
|---|---|---|
| Captions, hashtags, variants, tone shifts, alt text | Cheapest frontier-lite (`gemini-2.5-flash-lite`, `gpt-5-nano`) | Short output, filtered by a human or a judge. 2,700–4,000 per dollar |
| Brand-voice / safety / claim judging | Mid (`gpt-5-mini`, `claude-haiku-4-5`) | Judgement quality > prose quality |
| Long-transcript ranking, campaign planning, report narrative | Long-context mid (`gemini-3-flash`, 1M ctx) | Context window is the binding constraint |
| Agent planning with tools, ambiguous escalations, crisis triage | Frontier (`claude-sonnet-5`, `gpt-5.4`, `gemini-3-pro`) | Low volume, high consequence |
| Anything customer-visible in a regulated vertical | Frontier + region-pinned endpoint | Procurement gate |

**Publish the fact that we route; do not publish which model handles which job** — that changes
weekly `[09 §7.7 P5]`.

### 12.3 Cost control

**Prompt caching is the single highest-ROI optimisation.** The brand-voice policy, safety policy
and exemplar corpus are identical across every generation for a brand; in a cached prefix they cut
~37–49% off the text bill and reduce latency `[09 §7.1]`. This is an *architectural* decision —
the prompt must be assembled prefix-stable — and it is why brand voice is represented as a
stable document rather than a dynamically-assembled blob (§12.4).

**Metering principle: meter what costs money; make free what is free** `[09 §7.7]`.

| Operation | True cost | Metering |
|---|---|---|
| Caption / hashtags / rewrite / translate / alt text / reply draft | $0.0002–$0.008 | **Unlimited on every paid plan**, fair-use ceiling only |
| Brand-voice, safety, novelty, fatigue judging | <$0.01/brand/mo | **Free, always on** — quality features, not consumption features |
| Embeddings, listening classification, sentiment | negligible | Free |
| Image / video / avatar / dub / long transcription / GEO | $0.003–$15 | **Metered**, published rate card, 1 credit = 1 cent of underlying cost |

Unlimited text generation is a marketing weapon, not a cost risk — the competitive set meters it
and users resent it `[09 §7.7 P1]`. Pre-flight cost estimates ("this 20-second clip will use 160
credits"), per-brand consumption reporting for agency rebilling, and hard budget caps per
workspace are all required; surprise is the primary source of credit-system resentment.

**Reference cost envelope** `[09 §7.8]`: a brand on an aggressive AI-native plan (daily post, one
video/day, four image candidates, full evaluation, weekly GEO) runs **≈$52/month** in model spend
with GEO and **≈$26 without**. At $99/brand the AI-layer gross margin is ~47%/~74%. **The pricing
levers are video tier and GEO frequency and both must be explicit plan dimensions**, not buried
in a credit pool.

### 12.4 Brand voice representation

A `brand_voice_policy` is a versioned document, not a prompt string, and it is deliberately
prefix-stable:

```
brand_voice_policy {
  id, org_node_id, version, hash,
  descriptors[]            // tone, register, person, formality, humour tolerance
  lexicon { preferred[], banned[], never_abbreviate[], product_names[] }
  claim_allowlist[]        // what we are permitted to assert — regulated verticals
  required_disclosures[]   // per network, per content label
  exemplars[]              // 10–30 human-written posts, the highest-signal element
  anti_exemplars[]         // rejected drafts with reasons — the second-highest
  locale_variants{}        // per-market overrides; NOT machine translation of the policy
}
```

Three consumers: the generator (as cached prefix), the judge (as rubric), and the compliance
export (as evidence of what the policy *was* when a given post was approved). The `hash` is what
binds a decision skeleton to a policy version.

**Retrieval** (RAG) is separate and scoped: tenant's own content, product docs, help-centre
articles, prior approved posts. Per `[11 §5.5]`, **audience and listening content is not embedded
by default** — that is an explicit, off-by-default tenant choice with its own retention setting,
because embeddings of personal data are derived personal data.

### 12.5 Evaluation and guardrails

Four layers, cheapest first (mirroring §3.3 so that guardrails and the gate are the same code
path):

1. **Deterministic** — banned-term regex, claim allowlist, required disclosure presence, length,
   grapheme counting, link policy. Free, instant, and catches most real violations.
2. **Classifier** — self-hosted safety/toxicity/PII classifiers over 100% of generated content.
3. **LLM judge** — brand-voice adherence, claim support, tone, and (for regulated tenants) a
   policy-pack judge. Runs only when 1–2 pass.
4. **Human** — the propose queue and approval routing (§7.5).

**Judge quality is itself measured.** A 1% human-labelled sample per tenant per month keeps the
judges honest, and judge disagreement with humans is a tracked metric that gates model upgrades
`[12 §16.3]`.

**Disclosure and provenance obligations**, per `[11 §6.2]` and `[verifier: rights]`:
- Art. 50(1) interaction notice on every DM automation / auto-reply, **non-suppressible in the
  EU** — not a tenant-disableable setting.
- Per-platform AI-label propagation at publish: TikTok `is_aigc`, YouTube
  `containsSyntheticMedia`. Meta exposes **no API field at all**. This is table stakes on two
  surfaces and impossible on the third, and is not marketed as a differentiator.
- C2PA: the honest feature is **metadata preservation through transcode**, not signing —
  generators already sign and platforms strip or re-sign `[verifier: rights ¶DROP(a)]`.

### 12.6 Human-in-the-loop, restated as a default

Autonomy is never enabled by a toggle. The path is: `shadow` (evidence) → `propose` (human picks)
→ `approve_required` (human signs) → `auto_within_budget` (human bounds) → `auto` (rare, read-only
or trivially reversible). Every step is a gated action with a trace, and a replay regression
demotes automatically (§3.8).

---

## 13. Security

### 13.1 The threat model, stated plainly

A breach of a normal SaaS leaks data. **A breach of our vault leaks the ability to act** — to
post, delete, DM customers, run ads and change page settings, in the customer's name, at scale,
instantly. The damage is public within seconds; the blast radius is the entire customer base at
once if keys are shared; and a mass-abuse event traced to our app ID gets the *app* suspended,
killing every tenant's connections including the unaffected ones `[11 §10.1]`.

Adversaries in descending order of realism `[11 §10.1]`: compromised sub-processor (Buffer/MongoHQ,
CircleCI pattern) → compromised engineer endpoint or CI/CD → social engineering of internal
support tooling (Mailchimp/Okta pattern) → application-layer flaws (IDOR, SSRF to metadata, token
in a stack trace) → insider misuse → platform-side mass invalidation.

### 13.2 The token vault

```
KMS/HSM  (per region — root key never leaves the region)
   └── tenant_KEK[t]                                    KMS-resident, never exported
          │  KMS Decrypt(wrapped_dek) → DEK (memory only, bounded TTL)
          ▼
   credential row: tenant_id, connection_id, platform, key_version,
                   wrapped_dek, ciphertext (AES-256-GCM), nonce, auth_tag,
                   aad = tenant_id|connection_id|platform|key_version
```

Non-negotiables `[11 §10.2]`: plaintext tokens exist nowhere — not in logs, exception traces,
support tools, analytics events or CI artifacts (the most common real leak is a stack trace, not
a database dump); AEAD only; AAD binds ciphertext to context; per-tenant KEK; the application
never holds the KEK; DEK caching is bounded, explicit and documented as a trade; the KMS IAM
policy is a **separate trust domain the database credentials cannot satisfy** — otherwise
envelope encryption is theatre.

**Credential kinds the vault must handle beyond OAuth tokens** `[07 §15.2]`: asymmetric private
keys (`.p8` ES256 for Apple, Ghost HS256 secrets, GCP service-account JSON), OAuth1.0a
token+secret pairs, **per-host client secrets** for archetype C, and webhook URLs — which are
bearer credentials and are encrypted, never logged, masked in the UI. Holding a customer's Apple
`.p8` is a materially higher burden than an OAuth token; onboarding gives scoped-role guidance
("create a key with the Customer Support role only").

**Cost and latency.** Per-tenant KEKs put a KMS `Decrypt` on the credential path. Mitigations:
bounded in-memory DEK caching (5–15 min TTL, an explicit documented number), KMS data-key caching
libraries with their own limits, and **tenant-affine scheduling** so publishing 50 posts for one
tenant unwraps one DEK, not 50 `[11 §10.4]`. At ~$1/key/month plus ~$0.03/10k requests the cost is
negligible with caching and surprising without it — modelled before launch.

### 13.3 Rotation and the refresh race

`[11 §10.5]`: platform tokens rotate on the platform's TTL; refresh is **proactive with jitter**,
never on the request path, never thundering at midnight UTC. Rotating single-use refresh tokens
(X, TikTok) require a **per-connection distributed lock and a single-writer refresh path** —
two concurrent workers submitting the old refresh token means one wins, the other is invalidated,
and the platform may treat replay as theft and revoke the grant. This is a real, common outage
cause and it is the reason §4.3 rule 2 forbids refresh-based health probes.

Our own OAuth client secrets rotate annually and on staff departure — **but some platforms
invalidate all tokens on client-secret change**, so this is verified per platform *before*
rotating. Secret zero is solved with cloud-native workload identity; no long-lived bootstrap
secret exists in a config file or environment variable.

### 13.4 Crypto-shredding and its asterisks

Deletion reduces to a key operation `[11 §10.6]`: disconnect one account → revoke upstream, delete
row, delete that connection's DEK. Close the tenant → **destroy `tenant_KEK`**; ciphertext in
every store and every backup becomes noise. Region exit → destroy the regional key material.

**The asterisks are stated in the DPA and in the product, not buried** `[11 §10.6, §5.4]`,
`[verifier: offboarding DEMOTE(d)]`:
- The KMS **scheduled-deletion window (7–30 days) is the real SLA bound** on the deletion claim.
- Aggregates, audit logs and billing records are **deliberately outside the shred** and are named.
- Retired *rotation* keys are retained; keys destroyed for *erasure* are destroyed irrevocably.
  Do not let an operational key-retention policy silently defeat the erasure guarantee.
- Backups are excluded from erasure but retained under a short documented rotation, with a
  **deletion replay log** applied automatically post-restore so a restore cannot resurrect erased
  data.

**BYOK/HYOK** is the natural upsell once per-tenant KEKs exist, and `[11 §864]` records that
**nobody in the category offers it**. It is sold in enterprise procurement; we do not market a
"deletion certificate" without the asterisks above.

### 13.5 Audit

Three streams with different properties:

| Stream | Content | Mutability | Retention |
|---|---|---|---|
| `audit_event` | Who did what to which object, before/after hashes, IP, UA | Append-only | 12mo min, 7y enterprise `[11 §5.6]` |
| `decision_skeleton` | Policy evaluation record, no PII | **Immutable** | 7y |
| `decision_payload` | Content and identities | Erasable + tombstoned | Per data class |

Attribution-preserving deactivation is a **property of the audit log**, not a product: a departed
employee's posts, replies and approvals remain attributable after their seat is gone. Sprout,
Sprinklr and Khoros already do this — we are matching, not exceeding
`[verifier: offboarding DOWNGRADE(c)]`, `[01 §1363]`.

**Admin/support tooling is a first-class attack surface** `[11 §10.7]`: impersonation requires a
justification, is time-limited, and writes a **tenant-visible** audit entry; bulk export requires
two-person approval.

### 13.6 Detection and kill switches

Signals worth having, none expensive `[11 §10.8]`: KMS decrypt volume per tenant vs baseline;
decrypts from unexpected role/service/region; publishing-rate anomaly per connection;
**content-similarity spike across unrelated tenants** (the Buffer 2013 mass-spam signature);
platform auth-error spikes; `reauth_required` transitions clustering in time; and the
high-signal one — **any credential decrypt not attributable to a scheduled job or an
authenticated user action**, which requires the attribution field to be built into the decrypt
path on day one.

Kill switches (§3.9) are Action Gate rules, so an incident response is a row insert, not a deploy.

### 13.7 SSRF as a first-class threat

Unlike tier-1's fixed hosts, tier-2 has us making server-side requests to **user-supplied hosts**:
Mastodon instances, WordPress and Ghost sites, RSS feeds, webhook URLs, Vimeo pull URLs, GBP media
`sourceUrl`s `[07 §15.4]`. One hardened outbound HTTP client is used by every adapter:
DNS-pin between resolve and connect (defeats rebinding), private/loopback/link-local/metadata
range denial, re-validation after **every** redirect with a cap of 3, non-443 port blocking,
response size caps, timeouts, **no credential forwarding across hosts**, and egress from a
dedicated isolated worker pool with its own network policy.

### 13.8 SOC 2 / ISO readiness

`[01 §30 #66]` marks SOC 2 Type II / ISO 27001 / published DPA as **P0-EXCEED** — Vista is
❌/⚠️ and it is a hard procurement gate `[03 §19]`. The controls above are the substance; the
paperwork is scheduled in §17 Phase 1–2 because Type II requires an observation window and
therefore has calendar-time dependencies exactly like platform approvals.

Additionally, and cheaply: SCIM provisioning, SAML SSO **that coexists with 2FA** (Vista makes
them mutually exclusive `[01 §30 #67]`), audit-log export, a DSAR console for tenants
`[11 §5.1]`, a DSA notice-and-action channel and EU legal representative `[11 §6.1]`, and the
per-tenant **AI compliance report** (`[11 §6.2]` calls it the single highest-leverage AI Act
build and records that nobody ships it) — assembled from data the Action Gate already produces.

---
## 14. Infrastructure

### 14.1 Language and framework choices, with the reasoning

| Component | Choice | Reasoning |
|---|---|---|
| **API / BFF / web app** | **TypeScript**, Node 22, Fastify + tRPC/OpenAPI; React + Vite front end | The repo is already a TS monorepo (`packages/`, `tsconfig.base.json`). One language across the composer's capability logic and the server's validation means the **capability ledger's validators run in both places from one source** — a real correctness win, since pre-flight must run in the browser `[06 §19.2]` |
| **Adapter fabric & publish workers** | **TypeScript** | Same reason: adapters embed capability logic. Node's I/O model fits 60+ HTTP integrations; CPU work is elsewhere |
| **Media pipeline** | **Go** + ffmpeg | Byte-pushing, chunked resumable uploads with per-part ETags, transcode orchestration. Go's memory profile and concurrency beat Node here |
| **Enrichment / ML serving** | **Python** (FastAPI + Triton/vLLM) | Encoder models, embeddings, bandit/hierarchical inference. Nobody serves transformers from Node |
| **Analytics transforms** | **SQL + dbt** | The dbt package is a *product* (§10.7); building it in dbt means we ship the same artefact we run |
| **Mobile** | **React Native** with native modules for share-sheet, prefetch, background handoff | §5 needs deep native integration in a small surface; RN carries the rest |

**Deliberate non-choice:** no Rust, no Elixir, no Kotlin service tier in v1. Each would be
defensible in isolation; each adds a hiring surface and a build pipeline that a team shipping 60
integrations cannot afford.

### 14.2 Datastores

PostgreSQL 16 (primary + read replicas per region) · Redis Cluster (locks, budgets, rate
limiters, hot cache) · Kafka/Redpanda (signal bus) · ClickHouse (metric serving) · Apache Iceberg
on S3-compatible object storage (lake + customer sharing) · OpenSearch with kNN (inbox and
listening search) · object storage (media, raw payloads, exports).

### 14.3 Queueing

Two systems, not one, because they have different failure semantics:
- **Kafka** for the signal bus — ordered, replayable, multi-consumer.
- **A durable job queue on PostgreSQL** (`SELECT … FOR UPDATE SKIP LOCKED`) for scheduled
  publishes and workflow steps. The reason for PostgreSQL rather than a broker: publish jobs need
  *transactional* state transitions with the content row, arbitrary reprioritisation, and
  human-visible inspection ("why is my post queued"). A broker gives throughput we do not need
  and takes away the transaction we do.
- Redis-backed leases for rate-limit slot reservation only.

### 14.4 Media, transcoding and the CDN

Constraint `[C1]` dominates: Meta *pulls* media from a public URL we host, and that URL must
serve unauthenticated, range-request-capable, correct-MIME responses for the whole processing
window.

```
upload → object storage (private)
       → checksum, probe (ffprobe), virus scan
       → transcode ladder per target format from the capability ledger
       → publish-scoped PUBLIC object with an unguessable path + short TTL
         (created at MEDIA_STAGED, revoked after PUBLISHED or container expiry)
       → CDN in front, range requests enabled, correct Content-Type
```

The publish-scoped public object is a distinct artefact from the library asset. It exists only
during a publish window, its path is unguessable, and its lifecycle is tied to the container TTL
`[C2]`. This keeps "public because Meta needs it" from becoming "the media library is public".

Transcoding: ffmpeg on Go workers, GPU-accelerated for h264/h265/AV1 at volume; per-format
ladders driven by ledger specs, never hardcoded `[06 §5]`.

### 14.5 Multi-region and data residency

```
GLOBAL CONTROL PLANE                    REGIONAL DATA PLANES
(accounts, billing, feature flags,      (tokens, content, conversations, media,
 aggregate non-identifying metrics)      metrics, listening, per-region KMS root)
                                         · us   (default)
   NO PII CROSSES THE SEAM               · eu   (GDPR, in-region webhook domains)
   enforced by schema tags + a CI lint    · apac
   that fails if a PII-tagged column      · cn   (PIPL, ICP-filed callbacks, separate legal
   is referenced from a global service           entity, separate operational stack)
```

Three drivers converge on this design — China (PIPL + ICP-filed callback domains), EU (GDPR
residency demands), Korea (PIPA) `[08 §14.6]`, `[11 §4]`. **Build the seam early even if the second
shard ships late; retrofitting residency into a single-region monolith is a rewrite.**

The per-region KMS root makes residency *mechanical* rather than procedural: an EU KEK in an EU
KMS means US infrastructure cannot decrypt EU data even if it obtains the ciphertext
`[11 §10.3]`. Model inference is region-pinned per tenant, with the ~+10% EU/AU/JP premium
budgeted `[09 §7.1]`.

**China is a separate operational stack, not a region flag.** WeChat's centralised token minter
(daily refresh cap), post-count caps, ICP filing and a separate legal entity make it a distinct
deployment. It ships only when a revenue case justifies it (§17 Phase 3+).

### 14.6 The locale kernel

One service, consumed by every surface, driven by CLDR data rather than hardcoded rules
`[08 §15–17]`:

- **ICU MessageFormat** for every user-facing string with a count. Arabic and Welsh have all six
  plural categories; Hebrew has three; Japanese/Chinese/Thai/Vietnamese/Korean have one. Any
  framework modelling plurals as `{singular, plural}` produces wrong output in those languages.
  No string concatenation for sentences — word order differs and RTL makes it dangerous.
- **RTL layout** as a first-class mode, not a stylesheet afterthought.
- **Grapheme-correct counting per network**, from `publish.counting` in the ledger — Bluesky
  counts graphemes, facets count bytes, others count UTF-16 units. Arabic and emoji counting is
  where naive implementations visibly break.
- **CLDR `weekData.json`** for first day and weekend (§9.5).
- **`Intl.DateTimeFormat` calendar options** implemented silently in the formatting layer for
  Buddhist/ROC/Japanese-era display — a Thai user seeing 2026 instead of 2569 reads it as a bug —
  and never mentioned in positioning.
- **Money and tax** per `[08 §18–19]`: local payment rails and PPP pricing are what make regional
  markets addressable; the calendar work alone is a vitamin.

### 14.7 Cost model at scale

Order-of-magnitude, US cloud, for **10,000 tenants / 100,000 connected profiles / 3M posts per
month / 50M mentions per month**. Marked `[J]` except where the corpus supplies a figure.

| Line | Driver | Monthly |
|---|---|---|
| Publish + adapter workers | ~3M publishes + retries + readbacks | $4–7k |
| Signal bus (Kafka/Redpanda) | ~500M events/mo, 7-day retention | $3–5k |
| PostgreSQL (multi-region, HA, replicas) | OLTP + job queue | $8–14k |
| Redis Cluster | locks, budgets, limiters | $1.5–3k |
| ClickHouse | ~50B metric rows retained | $6–12k |
| OpenSearch (hot 90d) | inbox + listening | $8–15k `[12 §16.3 scaled]` |
| Object storage + egress | media, raw Parquet, exports | $5–12k |
| CDN | media pulls by platforms + link-in-bio | $3–8k |
| Transcoding (GPU) | video ladder | $4–9k |
| Enrichment (self-hosted encoders) | 50M mentions | $250–1,000 `[12 §16.3]` |
| LLM tail (2–5% of mentions + generation + judges) | hybrid routing | $15–40k `[09 §7.8 scaled]` |
| KMS | per-tenant KEKs with caching | $300–800 `[11 §10.4]` |
| X API tier | metered reads | $5–42k `[06 §2.1]` — **plan-gated** |
| **Total** | | **≈$65–170k/mo** |

Two observations that matter more than the totals. First, **the two largest and most variable
lines (LLM tail, X reads) are both plan-gated dimensions**, which is why §12.3 insists video tier
and GEO frequency be explicit plan dimensions rather than a credit pool. Second, at ~$99/brand,
10k tenants averaging 2 brands is ~$2M/mo revenue against ~$120k/mo infrastructure — the
infrastructure is not the constraint; **platform approvals and support load are**.

---

## 15. Deployment, testing, observability, and keeping 60+ fragile integrations alive

### 15.1 Deployment

Kubernetes per region; one cluster per data plane plus a control-plane cluster. Services deploy
independently; the **capability ledger deploys separately from code** (it is data, reviewed as a
diff, with staged rollout and instant rollback) — a platform limit change must be a config
deploy, not a release `[06 §19.2]`.

Progressive delivery: every publish-path change goes out behind a flag, canaried on internal
tenants, then 1% → 10% → 50% → 100% by tenant cohort, with automatic rollback on publish
success-rate regression. Database migrations are expand/contract only; no migration may hold a
lock that blocks the publish path.

### 15.2 The testing pyramid, adapted to this domain

| Layer | What | Notes |
|---|---|---|
| Unit | Transforms, counting, negotiation, policy evaluation | The policy evaluator gets property tests: no input ordering may change a verdict |
| **Contract tests per adapter** | Recorded HTTP fixtures (VCR-style) per network per operation | Fixtures carry the ledger version they were recorded against |
| **Capability conformance** | Every adapter runs one generated suite derived from its ledger row | If the ledger says `altTextSupported: true`, a test asserts the adapter sends it |
| **Cross-tenant isolation** | Generated from the route table | §8.5 layer 3 |
| **Golden-path integration** | Full publish through a mock platform per archetype | Three archetypes, not sixty |
| **Live canaries** | Real posts to our own test accounts on real networks | §15.3 |
| **Replay QA** | Agent behaviour against synthetic + historical corpora | §3.8 |
| **Chaos** | Kill a worker mid-publish; assert no duplicate | The single most valuable test in the suite |

The duplicate-post chaos test deserves emphasis: it is the failure that damages customers most
visibly `[05 §11 G6]`, and it is only catchable by deliberately killing workers between the
platform call and the response persist.

### 15.3 Synthetic canaries

We hold real accounts on every supported network, in a dedicated canary tenant, and publish real
content on a schedule.

| Canary | Frequency | Detects |
|---|---|---|
| Publish canary per network per format | Hourly for tier-1, daily for tier-2 | API breakage, silent spec changes, quota changes |
| Readback canary | Follows every publish canary | Removal detection path, `PUBLISHED_THEN_REMOVED` logic |
| Auth canary | Daily probe per network | Read-only identity probe path; scope-delta detection |
| Deep-link canary | Per mobile app version, on real devices | `[07 §17.2]` recipes are C3-and-changing; this is a **permanent QA line**, budgeted as such `[verifier: reminder ¶4]` |
| Webhook canary | Continuous | Silent webhook delivery stoppage — the failure that looks like "quiet week" |
| Rate-limit canary | Weekly, deliberate | Confirms our modelled limits still match reality |

Canary results write to the ledger's `honesty.lastVerifiedAt` and `verifiedBy`. A network whose
canary fails is marked degraded **in the customer-facing capability matrix**, automatically. That
is the mechanism that keeps the honesty claim from decaying into marketing copy.

### 15.4 Architectural fitness tests

Run in CI; a failure blocks merge. These encode the invariants this whole document rests on.

1. No module imports a provider SDK — only the Model Broker may.
2. No code path reaches a network adapter's `publish`/`delete`/`reply` without an
   `ActionGate.evaluate` on the same call stack (enforced by a static call-graph check plus a
   runtime assertion in non-production).
3. No SQL executes without a `TenantContext`.
4. No outbound HTTP except through the hardened client.
5. **No code path constructs a browser driver from a tenant credential** (§5.1, tier T3).
6. Every table carrying a PII tag has a registered deletion handler `[11 §5.3]`.
7. No PII-tagged column is referenced by a global-control-plane service `[08 §14.6]`.
8. Every `NetworkCapability` row has a canary and a `lastVerifiedAt` within its staleness budget.

### 15.5 Self-healing

Four mechanisms, in increasing ambition:

1. **Circuit breakers** per platform and per connection, with UI-visible state and honest ETAs.
2. **Automatic quarantine** of a dying connection so it fails loudly at connect time rather than
   silently at publish time `[05 §11 G4]`.
3. **Ledger auto-narrowing.** When the failure corpus (§4.5) shows a specific `(network, format,
   parameter)` combination failing above a threshold across tenants, the ledger row is
   *automatically narrowed* — that format is marked degraded and pre-flight starts rejecting it
   with the observed reason — pending human review. Failing closed on observed evidence is
   strictly better than continuing to accept posts we now know will fail.
4. **Destination-rule inference.** The general engine `[05 §11 G8]` asks for: patterns mined from
   the failure corpus become candidate pre-flight rules, reviewed by a human, promoted into the
   ledger with `confidence:'observed'`. This is the mechanism by which the accumulated failure
   data becomes a moat rather than a log.

### 15.6 Observability

- **Per-network SLOs**: publish success rate, p50/p95/p99 publish latency, readback divergence
  rate, detection latency, token-health distribution, quota headroom.
- **Two reliability artefacts, different buyers** `[verifier: publish verification ¶3]`:
  (a) a **contractual SLA with service credits** — `[03 line 1314]` names "no SLA with service
  credits" as a procurement blocker, so this is the version that appears in an RFP;
  (b) a **per-tenant in-app reliability ledger** — this customer's success rate, retries, latency
  and removal events, exportable so an agency can forward it to their client.
  An aggregate public marketing page ships **only if we are prepared to keep publishing it during
  a Meta outage**; otherwise it is a hostage handed to competitors. Default: do not publish.
- **Trace correlation**: `decision_id` propagates from the Action Gate through the adapter call
  into the signal, so one identifier joins "why was this allowed" to "what did the platform say".
- **Cost observability**: model spend, KMS calls, X reads and CDN egress attributed per tenant per
  brand, exposed to the customer for agency rebilling and to us for margin analysis.

### 15.7 Integration health as an operating discipline

`[verifier: connection health]` requires scoping this as **publishing reliability**, of which
token death is one of five causes — alongside API deprecations, media-format rejections, rate
limits and policy blocks. A token-only project addresses maybe a fifth of the bucket, and token
friction is 5% of churn (rank 8 of 8), *not* the #1 cause `[12 §33.1]`.

The five workstreams, each with an owner and a dashboard:

| Workstream | Detection | Mitigation |
|---|---|---|
| Token death | Daily read-only probe + expiry calendar | T-14/T-3 warnings; repair links; batch repair (§16.7) |
| API deprecation | Deprecation-calendar watchlist `[06 §18]`; version-header monitoring | Scheduled migration work with named dates |
| Media rejection | Failure corpus + pre-flight | Ledger auto-narrowing (§15.5) |
| Rate limits | Budget telemetry + pre-flight simulation | Fair-share + admission control |
| Policy blocks | `PLATFORM_POLICY` class + readback | Human-actionable messaging; never a silent retry |

---
## 16. Differentiator implementation specs

Each subsection states the **honest positioning** first (per the verifier notes), then the spec.
Where a differentiator is already implemented by a primitive above, the subsection is short and
points there — that is the payoff of the architecture, not an omission.

### 16.1 Publishing Hold and crisis mode

**Positioning.** *"Everyone has an on/off switch; nobody below enterprise has a hold you can
reason about."* The atomic pause is commodity: Buffer has had per-channel Pause Queue with
automatic defer-forward for a decade at entry pricing; Sprout, Agorapulse and SocialBee ship some
pause; Sprinklr and Khoros ship real freeze windows `[verifier: crisis hold ¶1]`. **This is a
Gate, not a moat** — priced into the governance plan alongside approvals, audit log and SSO,
never as a standalone premium. Its jobs are: remove an RFP disqualifier, win the demo, reduce
churn `[verifier ¶3]`, `[03 §178]`.

**The defensible composite** is four things together, and (c) is the strongest single
differentiator and the best demo moment — *the pain is not stopping, it is rebuilding the
calendar afterwards from memory*.

```ts
PublishingHold {
  id, tenantId, createdBy, createdAt, releasedBy?, releasedAt?,
  scope:  { kind: 'account'|'brand'|'profile_group'|'profile'|'content_label',
            refs: string[] },        // resolved through the org tree (§8.1)
  labelPolicy: {
    mode: 'hold_all' | 'hold_labelled' | 'hold_except_allowlist',
    allowlist: string[],             // e.g. ['service-status']
    unlabelledBehaviour: 'HOLD'      // FAIL CLOSED — not configurable
  },
  windowPolicy: 'skip' | 'defer_next_slot' | 'defer_past_window',
  window: { startsAt?, endsAt?, recurrence? },   // recurrence reuses §9.5 item 7
  reason: string,                    // required
  suppress: { dmAutomations, evergreenRecycling, boostTriggers, inboxTriageMode },
  notify:   { slackChannels[], teamsChannels[], inAppBanner: bool }
}
```

**(a) Label scoping fails closed.** Unlabelled content is **held**, always. The only escape is an
explicit allowlist entry (`service-status`). This is a hard engineering requirement, not a
default `[differentiator brief]`. The composer therefore nudges labelling at creation, and a
tenant with no labels sees "a hold will stop everything until you label your content" *before*
they need it.

**(b) Per-window policy** is chosen at hold creation, per window, from exactly three options:

| Policy | Semantics |
|---|---|
| `skip` | The slot passes; the post is marked `HELD_SKIPPED` and appears in the restore queue |
| `defer_next_slot` | Re-slot to the next available queue slot after release, preserving order |
| `defer_past_window` | Re-slot to the first slot after `window.endsAt`, preserving order and spacing |

**(c) The restore review queue.** On release, the operator gets a queue showing exactly what was
held, why, what the policy did to it, and bulk actions: re-slot all · re-slot selected ·
publish now · discard · edit-then-re-slot. Order and relative spacing are preserved by default.
This is the demo.

**(d) The crisis preset** is one action that: applies a `hold_except_allowlist` hold at account
scope; suppresses DM automations, evergreen recycling and boost triggers; flips the inbox to a
triage view; posts a notice to Slack/Teams; pins an in-app banner. Every one of those
suppressions is an Action Gate rule (§3.3 step 1–2), so the preset is a policy bundle, not
special-case code.

**Two engineering requirements without which the feature is actively dangerous:**

1. **Meta-server reconciliation.** Posts handed to `scheduled_publish_time` live on Meta's
   servers. A hold **must** call `cancelNative` for every affected `NATIVE_SCHEDULED` target and
   verify the cancellation by readback. Where cancellation fails, the hold reports
   **`PARTIAL_HOLD`** loudly — a red banner naming each post we could not stop, with a direct
   link to cancel it in Meta Business Suite. Reporting "held" when three posts are still live on
   Meta's servers is the worst possible failure of a crisis feature. This is also the strongest
   argument for §4.1's self-dispatch default.
2. **Partial-hold failure is never silent.** The hold's terminal state is
   `APPLIED` | `APPLIED_PARTIAL(failures[])` | `FAILED`, and `APPLIED_PARTIAL` pages the
   operator.

**Recurring blackout windows** derive from the generic primitive in §9.5 item 7 plus a
holiday/events calendar. Cheap, low value; built because it is trivial `[verifier ¶2]`.

**The listening-triggered proposal ships LAST**, and is scoped to **owned-channel comment/DM
sentiment velocity only** — no cross-platform mention-velocity triggering until enterprise ARR
funds X/Reddit data `[verifier ¶2]`, `[12 §1833]`. It is a **proposal a human confirms**, never
an unattended automation: the Watch agent's policy mode is capped at `propose` in code (§7.2).

**Sequencing** `[verifier ¶2]`: composite hold + reason + audit + restore queue → crisis preset
(organic only) → recurring blackout windows → boost suppression once `ads_management` Advanced
Access lands → listening trigger.

**Before committing, re-verify** `[verifier ¶4]`: the Vista "no pause switch" finding and the
competitor matrix row at `02:1329` are unverified (`04-competitors-smb.md` contains zero mentions
of "pause"); and test whether competitors support **bulk move-to-draft** — if they do, the "bulk
delete destroys the queue" pain narrative is overstated. §20 carries both.

### 16.2 Offboarding: "remove client" as one audited transaction

**Positioning.** Narrowed to **one component**, per `[verifier: offboarding]`. This is the part
not found anywhere in the corpus and the part an agency actually feels. It ships **inside the
agency/white-label tier**.

```
RemoveClient(orgNodeId, operator, reason) → ClientRemovalReceipt
  ── executed as a saga with per-step receipts; no step is "best effort" ──
  1. Enumerate: profiles, connections, share links, portal users, domains, scheduled content
  2. For each connection:  adapter.revoke()  → UPSTREAM OAuth revocation, receipted
                           delete credential row; destroy that connection's DEK
  3. Invalidate every outstanding report link, calendar link, approval link, portal invite
  4. Remove client-side portal users; revoke their sessions
  5. Rescind white-label domain / CNAME mapping; remove certificate
  6. Cancel or transfer scheduled content per the operator's choice (cancel | export | reassign)
  7. Emit ONE immutable audit record: operator, timestamp, itemised list of everything revoked,
     per-item success/failure, and the receipt IDs
```

**Real upstream revocation, not a local row delete.** Each adapter implements `revoke()` against
the platform's revocation endpoint and returns a receipt. Where a platform has no revocation
endpoint, the receipt says so explicitly and the audit record carries
`revocation: 'unsupported_by_platform'` with the manual step the operator must take. Claiming
revocation we did not perform is the failure mode that makes this feature worthless.

**Failure handling.** The saga is resumable and idempotent. A partial removal is a visible state
(`REMOVAL_PARTIAL`) with a retry action, never a silent success.

**16.2b The exit pack — reframed.** Per `[verifier: offboarding REFRAME(a)]` and `[C9]`, a
persistent, shareable, hosted exit pack violates three platform rules simultaneously (no transfer
of platform data to third parties; delete on disconnect; honour upstream deletions)
`[11 §12.1]` — in exactly the configuration a "hand it to the next agency" link proposes. So:

- The export is **authenticated, expiring, account-owner-only**, generated **while the connection
  is still live**, and delivered as a one-time download. Not a public URL, not a hosted permanent
  bundle.
- It is built by the **migration engineering already planned** (`[12 §33.3/§33.4]`, module F7) —
  the same CSV writers, media packagers and report exporters that serve inbound migration, run in
  reverse.
- **The PLG/distribution thesis attached to it is deleted entirely** `[verifier: DELETE]`. It
  contradicts the "exactly four surfaces" discipline `[12 §31.2]`, it is ~3 orders of magnitude
  lower-frequency than link-in-bio, it fires at peak negative affect, and its acquisition value is
  a strict subset of the platform re-fetch move (§10.2), which is already P1. **If we want the
  switcher, we build §10.2, not this.**

**Attribution-preserving deactivation** ships as a property of the audit log (§13.5), not as a
product — we are matching Sprout/Sprinklr/Khoros here, not exceeding.

**Crypto-shredding** ships because §13.2's architecture requires it, and is sold as **BYOK/HYOK in
enterprise procurement** — `[11 §864]` records that nobody in the category offers BYOK, and that
*is* a real gap. It is not marketed as a "deletion certificate" without the §13.4 asterisks.

### 16.3 Assisted publish

Specified in full at §5. Positioning: **finish the last 40% of a 10-year-old pattern, Instagram
and TikTok first**; the defensible parts are never-drop-the-slot semantics, the confirmation loop
that reconciles the calendar, per-network transforms at handoff, and the honest capability matrix
— *not* pre-staging and deep-linking. Priced as retention/support-cost reduction inside the plan.

### 16.4 Multi-brand and franchise governance

**Positioning.** Not "an abandoned segment" but **"a missing primitive in one product
category"** `[verifier: franchise]`. The differentiator is not locked templates — TCMA has
shipped those since ~2010 and SOCi/Rallio/Hearsay ship them today — it is *"a real social suite
(full channel coverage, calendar, listening, analytics) that happens to be hierarchy-native"*,
competing on suite depth against local-marketing platforms that are thin as social tools, and on
price/self-serve against Sprinklr.

**Buyer.** The **5–75 location band**: multi-unit operators, emerging franchise systems, and
agencies managing several multi-location clients. Above ~100 locations is a field-sales knife
fight against SOCi/Birdeye/Sprinklr sold through franchisor channel relationships we do not have;
below ~5 the hierarchy is worth nothing.

**And per `[verifier ¶6]`: the same data model has a nearer, warmer, self-serve-reachable buyer
in the agency segment** — client → brand → profile with per-node permissions and roll-up, sold
against seat×profile compounding at $25–40k/yr `[12 §28]`. Same engineering, no channel-sales
requirement. **We lead with the agency framing and let franchise follow.**

**Implementation.** The hierarchy is §8.1 — the only genuinely hard part, and the corpus rates it
correctly as High difficulty (though difficulty ≠ defensibility). On top of it:

- **Locked templates with editable zones.** `body_ir` (§8.3) carries per-block
  `editability: 'locked'|'open'|'field'` with `field` blocks declaring type and constraints
  (offer, address, phone, local imagery). **Enforcement is a diff check at publish time** inside
  the Action Gate: recompute the locked blocks from the template version, compare hashes, deny on
  divergence with `DenyReason.TEMPLATE_VIOLATION`. Enforced by comparison, not by policy document.
- **Per-level approval rules** — some markets bypass, regulated markets route to legal. This is
  §16.5's engine with `orgNode` as a condition; no separate mechanism.
- **Per-location merge fields** — table stakes, days of work `[02 §237]`.
- **Per-profile timezone** — §9.5. Table stakes, framed as such.
- **Roll-up reporting with a compliance view** — "which of my 340 locations posted this month, and
  which are dark". This is the reporting dependency operations leaders come to rely on, and it is
  a subtree aggregate over `content_target` states, so it is cheap given §8.1.
- **Per-location review response using corporate-approved templates** — GBP + Facebook only.

**Severed from the core thesis** `[verifier ¶4]`: listings syndication requires paid
publisher-network data deals (Yext's actual moat) — a licensing cost floor, not an engineering
task. Review response cannot cover Yelp or TripAdvisor at all (no owner OAuth, no response API
`[07 §11.3]`), and Google prohibits selective solicitation/review gating. The honest adjacency is
**"Google Business Profile + Facebook review response"**, priced separately if at all — not "we
replace Birdeye at 1/3 the price".

**Before further work** `[verifier ¶1]`: run the search pass the corpus never ran — SOCi (zero
mentions across all 12 dossiers), Rallio, Birdeye Social, Uberall/MomentFeed, Reputation Social
Suite, Chatmeter, Hearsay, Denim Social, Promoboxx, Tiger Pistol, Evocalize, BrandMuscle, Ansira.
Every downstream conclusion in `[03 §2.2]` and items 11/25 inherits that hole. §20 carries it.

### 16.5 Approvals as a routing engine

**Positioning.** Conditional approval routing with SLA escalation exists **only above roughly
$50k ACV** (Sprinklr Rule Engine, Khoros, Hootsuite Enterprise); nobody at $10–60/user/mo ships
it `[verifier: approvals ¶1]`. The wedge is bringing an enterprise governance primitive to
mid-market price, not inventing it. **This is a Gate, not a Moat** — Statusbrew already has a rule
engine one module away `[02 §1264–1274]`. Nobody switches suites *for* an approvals engine; it
unblocks RFPs and prevents churn, and it ships as a paid tier inside the suite, never as a
standalone wedge.

**The durable part** is not the rules engine (Ziflow, Workfront, Wrike and Power Automate all have
one) but its **fusion to social-native conditions evaluated at the publish gate**: network,
ad spend, AI-generated flag, content label, first-time poster, policy-keyword hit, org node,
region. That fusion exists because approvals are step 10 of §3.3 — the same evaluation that
already has the content, the labels, the provenance and the spend in hand.

**Pricing mechanic — a hard requirement, not a nicety** `[verifier ¶3]`, `[L5]`:
- A **free (or near-free) reviewer/approver seat class**, because the value of routing scales with
  reviewer count and per-seat pricing taxes exactly that. Agencies share logins to avoid it;
  Kontentino won on approve-by-emailed-link with no account `[04 lines 110, 141–143]`.
- **Decision-by-link** for external clients who will never install a Slack app. Signed,
  expiring, single-purpose, no account required.

**Scope order** `[verifier ¶5]` — ship time-and-place first, rules second:

**Phase A (weeks 1–4 of the module):** SLA targets per step; escalation ladders ("not approved in
4h → notify group admin; 12h → notify account owner"); digest batching ("one 9am email with
everything awaiting you"); out-of-office delegation; **real Slack and Microsoft Teams apps** with
interactive approve/reject/comment buttons, per-channel routing and thread-back — not an incoming
webhook that links out. **Treat Teams as the enterprise-opening half, not the afterthought**, and
budget for Teams Store validation and for enterprise tenants whose admin policy blocks
third-party app installs.

**Phase B:** the conditions-and-quorum engine — parallel steps, quorum (any 2 of 4), conditional
skip, auto-approve-below-threshold — kept to a **small closed condition vocabulary with
templates** rather than a general-purpose builder, because the general builder is the part most
likely to be configured once and never understood.

**Legal framing** `[verifier ¶4]`: the EU AI Act is **supporting evidence, not the driver** —
Art. 50(4b) only bites on AI-generated text on matters of public interest, and Art. 50(4a)
deepfake disclosure is not satisfied by an approval record. The binding driver is **FINRA 2210
principal pre-approval / SEC 206(4)-1**, and for that buyer the approval record must (a) bind to
an immutable content-version hash, (b) attest reviewer identity **through SSO**, not a raw Slack
user ID, and (c) export/journal into the customer's existing archive of record — Smarsh, Global
Relay, Proofpoint, Hearsay. **Integrate, do not replace** `[11 §13.4]`. An in-Slack button whose
identity is not SSO-bound is not a defensible principal approval, and §3.4's
`auth_method` field exists precisely to make that provable.

### 16.6 Time and calendar correctness

Specified at §9.5 and §14.6. Positioning: **a qualifier that loses deals when absent and closes
none when present** — 8–12 weeks for the full scope, not two `[08 §1672]`. Treated as a wedge into
a **MENA-focused positioning bundled with RTL layout, Arabic grapheme counting and Arabic-native
AI** `[08 §89]`, never as a standalone reason to buy.

Claims explicitly deleted `[verifier: time]`: the "inverted heatmap" argument (best-time engines
are computed from observed engagement, so a Gulf account's heatmap is already correct — only the
weekend *shading* is wrong); "every incumbent's calendar is visibly wrong" (enterprise incumbents
ship multi-region publishing; what they lack is CLDR-correct week data and Ramadan planning); and
any claim of category-wide absence of per-profile timezone (Buffer's per-channel schedule carries
its own timezone; the project's own matrix marks eight competitors ⚠️, not ❌ `[02 §1330]`).

### 16.7 Connection health

**Positioning** `[verifier: connection health ¶1]`: table-stakes reliability engineering and a
trust-marketing asset for the agency segment — **not** an uncontested gap, not a wedge, not a
priced feature. Funded from the reliability budget. **Never tier-gated**: "pay more and our
software keeps working" reads as extortion. Expect any incumbent to copy it within a quarter of
seeing it marketed (2–4 engineer-weeks).

**The promise is split in two, and only the honest half is marketed** `[verifier ¶3]`:

| Class | Examples | What we can honestly say |
|---|---|---|
| **Predictable expiry** | LinkedIn 60d, Meta `data_access_expires_at`, TikTok 365d, Pinterest 30d | T-14/T-3 warnings and *"3 of your 47 connections will break before your next scheduled post"* — **restricted strictly to scheduled expiries** |
| **Unpredictable revocation** | X refresh-orphaning; Meta password change / 2FA / checkpoint / app removal — **no webhook fires** `[06 §3.2]` | Only a daily liveness probe catches it, hours after the fact. Marketed as *"we catch it before your post does, not before it happens."* |

**Implementation.** The probe is a **read-only identity call per network, never a speculative
refresh** (§4.3 rule 2) — on X and TikTok a refresh-based health check manufactures the exact
orphaning failure the feature exists to prevent. Nine bespoke probes plus X's metered read cost
`[06 §19.5]` are budgeted **against the same app quota used for publishing and analytics**, which
is why probe cost is a field in the Capability Ledger (`auth.probe.costUnits`).

**Scope-delta detection**, named honestly: only Google supports true incremental auth; Meta's
`rerequest` only re-prompts declined permissions; LinkedIn/X/TikTok replace the grant wholesale.
So the capability is **"early scope-delta detection triggering a full re-auth link before publish
time"** — same value, deliverable name `[verifier ¶4]`.

**Repair links**, framed honestly: Vista already ships the seat-free client connect link
`[01 §864–883]`; the delta is the **repair workflow, the trigger, and batching** ("send repair
links to 3 clients"), not the primitive. And expect it to remove roughly **one of five** friction
steps — it cannot fix a departed employee, a lost Business Manager role, or a Meta security
checkpoint, which is where agency repair conversations actually die.

**Dropped**: the "competitors cannot match published reliability numbers" argument — the
denominator is uncontrolled, any rival can publish a friendlier one tomorrow, and disclosure
invites SLA/credit obligations `[03 §1314]`. See §15.6 for the two artefacts we do ship.

### 16.8 Coverage: SLA, rosters, send eligibility

Specified at §11.3–11.5. The mandatory honesty constraint — **a per-channel SLA floor derived
from measured detection latency, with the UI refusing unachievable configurations** — is
implemented at §11.2 and derives from §6.3's `observedAt - occurredAt` series.

Two things must be verified before this module is funded `[verifier: coverage ¶11–12]`:
whether Zendesk/Front/Gorgias/Intercom social-channel SLA is close enough to kill the wedge (the
single highest-risk unverified assumption), and whether Statusbrew's rules engine can already
express a de-facto escalation ladder ("if unassigned > 2h then reassign and notify") — if it can,
item 1 is a UX and reporting gap rather than a capability gap. §20 carries both.

### 16.9 The rights and usage ledger

**Positioning, rewritten** `[verifier: rights]`. The category of "a rights ledger that blocks the
publish" **exists** — AEM Assets, Bynder, Brandfolder, Acquia DAM, Aprimo, FADEL Rights Cloud,
Rightsline, CrowdRiff. Emplifi and Later Influence already ship rights-with-expiry; whitelisting
vendors already chase ad codes; OSS schedulers already set the TikTok and YouTube AI flags.

**The defensible sentence:** *"What no single product does is join a live permission's expiry to
the live ad spend, gallery placements and queued posts that depend on it."* The differentiator is
**reach across the scheduler + UGC gallery + ad account**, not the rights object. And the reason
we can do it is structural: every incumbent **acquired** its creator/UGC capability as a separate
product with a separate data model — Tribe→CreatorIQ, Mavrck→Later, Klear→Meltwater,
Tagger→Sprout, Paladin→Brandwatch, Olapic→Social Native, Pixlee→Emplifi, Stackla→Nosto,
Curalate→Bazaarvoice — so none of them can enforce across surfaces they do not jointly own
`[10 §14]`. One contact graph and one asset ledger in one codebase is exactly what acquisition
cannot produce.

**Population rule.** Enforce **only over rights the system itself originated** — our own consent
capture, our own generated creator contract, our own redeemed Spark/Partnership authorisation.
Imported stock and agency PDFs attach as an **unenforced attachment with an explicit "unverified
rights" state**. An empty ledger blocks nothing, and promising enforcement over data we did not
originate is a vendor-owned incident waiting to happen.

**Enforcement is per-rights-class, not universal:**

| Intent | Policy |
|---|---|
| `paid` (boost, ad sync) | **Hard block** |
| `gallery` (UGC gallery serving) | **Hard block** |
| `organic` | **Warn with logged override** — attributed and audited |

**The sellable primitive is the override record, not the block.** Hard-blocking on customer-supplied
data that turns out stale is a vendor-owned incident, and it asserts we are the legal arbiter.

**The sharpest wedge** is the **whitelisting-expiry → live-ad-dependency alert** with 7-day lead,
plus auto-pause-with-confirmation. TikTok Spark Ads auth codes expire at 7/30/60/365 days and
silently kill live, scaling ads mid-flight. Requires `ads_management` Advanced Access. **First
verify whether `tt_video/authorize` actually returns an expiry timestamp** — corpus item V6 marks
this `UNVERIFIED` and a GitHub search found no code evidence either way. If it does not, we are
storing a **creator-asserted duration** and must label it as such. §20 carries it.

**Downgraded or dropped** `[verifier: DROP]`: C2PA *writing* (generators already sign, platforms
strip or re-sign — the honest feature is metadata preservation through transcode); AI-label
propagation as a *differentiator* (table stakes on TikTok and YouTube, impossible on Meta);
the music check (a **standing warning on platform-sourced assets**, not a detection capability,
until audio detection actually exists); and EU AI Act fine figures (the whole dating chain is
second-hand with primary legal sources blocked).

**GTM.** Do not pitch legal as the buyer — **legal is a veto, not a budget**. Pitch the
paid-media and creator-programme owner on the money case: paid-usage rights cost 3–10× organic,
and a lapsed authorisation kills a scaling ad mid-flight. Let legal ratify. Regulated-industry
compliance budget in this category goes to archiving and supervision, not rights expiry.

### 16.10 The Autonomy Kernel — what is actually sold

Specified at §3. The three pieces the differentiation budget concentrates on
`[verifier: kernel ¶3]`:

1. **MCP/API write-safety enforced server-side** (§3.6) — P0-EXCEED in the corpus's own parity
   table `[01 line 1358]`, cheap, and no commercial vendor has it. Must be server-side because
   client consent is unenforceable and absent entirely for headless agents.
2. **Shadow mode with a published agreement rate** (§3.7) — the only element with no commercial or
   open-source precedent found.
3. **A per-tenant exportable AI compliance report** — AI inventory, disclosure config, approval
   records, model providers and their roles, provenance. `[11 §6.2]` calls this the single
   highest-leverage AI Act build, records that nobody in the category ships it, and it assembles
   from data the kernel already produces. **This is the sellable artifact; the decision trace is
   merely its substrate.**

The policy object and the decision trace ship as **competent table stakes**, not as novelty — the
policy object is the approval workflow plus configurable per-profile caps with override and
audit (itself a real Vista wedge, since Vista's 25/day cap is unconfigurable `[02 line 274]`), and
the decision trace is the audit log with a richer payload.

**Buyer**: the agency / multi-location operator publishing under someone else's brand name with
direct client liability, an existing approval culture, and per-brand pricing — **not** the CISO.
The 10-stakeholder, $129k-ACV enterprise buyer cannot transact at $99/brand, and their actual
gate is SOC 2 Type II, SCIM, audit export, residency and a DPA — paperwork `[03 line 130]`,
`[11 line 118]` — not a decision-trace schema. Sold as **client-liability control and per-client
blast-radius containment**.

**Do not cite the corpus's agreement as market validation.** This claim restates
`[09 §4.3]`, which is the corpus's own build recommendation. The independent evidence is
`[03 line 285]` (no self-serve governance anywhere) and `[01 line 1269 / 1358]` (MCP write-safety
unclaimed, P0). Everything else is the proposal agreeing with itself.

### 16.11 Creative experimentation

**Positioning, after the verifier's correction** `[verifier: bandit]`: the unit of inference is
wrong in the naive version, and fixing it is what makes this defensible IP rather than a
per-tenant statistics toy.

**(a) The single-account queue-slot bandit is not a headline feature.** At <200 lifetime posts and
CV≈0.8 `[12 §780]` it cannot resolve realistic effects. It survives only as an **exploration
scheduler** that prevents the send-time selection bias the corpus flags at `[12 §778]` — the
honest, already-identified use.

**(b) Arms are creative FEATURES, not assets.** Hook archetype, format, length, CTA presence,
face-in-thumbnail — learned in a **hierarchical/contextual model pooled across the entire customer
fleet, with per-account partial pooling**. This moves *n* from per-account (hopeless) to
fleet-wide (thousands of posts/day), makes cold start work, and compounds with the benchmark panel
network effect (§10.8). This is the only version where the learning is defensible IP.

```
reward = f(engagement, sentiment, brand_voice_adherence, follower_retention)
         normalised by reach            (defeats distribution confounding [S3])
         fixed 48h measurement window   (documented, held constant)
         discounted / sliding-window arm statistics   (non-stationarity)
         brand safety as a HARD FEASIBILITY CONSTRAINT, not a penalty term
```

The multi-objective reward is not optional: a naive engagement-only optimiser discovers outrage
and comment-farming quickly and reliably, and will actively harm a brand `[09 §4.4.3]`.

**(c) Cross-account randomised trials sell to FRANCHISE / MULTI-LOCATION only** — not "agencies".
The corpus defines an agency as managing 5–200 *client brands* `[12 §1330]`: heterogeneous
industries, audiences and voices, where a creative variant is not even applicable across two
clients, so there is no valid randomisation. Only comparable-location networks are an
exchangeable population.
- **Eligibility gate: ≥30 actively-posting comparable locations.**
- **Crossover / within-location designs** (each location sees both arms across rounds), not the
  parallel 50-vs-50 split — parallel assignment at n=50 only detects ~45% lift.

**(d) Report the MDE up front, before the test runs.** *"With your 42 locations posting weekly,
this test can detect a 30% difference in 6 weeks; smaller differences will return
'inconclusive'."* **This is the feature that makes the honest version sellable against the
dishonest one**, and it is why the experiment object stores its MDE at creation.

**(e) The paid bridge is an optional add-on**, described truthfully as a *paid-audience creative
signal correlated with — not an unbiased estimator of — organic quality*. If it ships it must use
a real split test with equal-delivery enforcement, not a boost, and **must not gate the core
product on the 8–12 week `ads_management` Standard approval** `[10 §2738 R1]`.

**(f) Engineer around platform anti-duplication from day one**: per-location token substitution in
copy, staggered publish windows, rate shaping. **Never publish byte-identical creative to 50
accounts through one app ID** — that is an app-level enforcement risk (§13.1), not a per-tenant
one.

**(g) Before building, audit SOCi, Rallio, Chatmeter and Birdeye.** They own this segment and the
corpus never checked them. §20.

### 16.12 Publish verification

**Positioning** `[verifier: publish verification ¶4–5]`: **retention infrastructure, not the
acquisition wedge.** It defends 10–15% of SMB churn (below price-at-renewal at 15–20%) and clears
an enterprise/agency procurement gate. What genuinely survives, stated honestly: *no single vendor
assembles pre-flight validation + typed error taxonomy + backoff-within-a-lateness-budget +
idempotency + authenticated post-publish reconciliation + a user-visible retry ledger + a
contractual SLA into one coherent operational system.* Ayrshare has the pieces as unrelated SDK
methods; Postiz has the pipeline but no ledger, no SLA, no product surface; Upload-Post has
idempotency and nothing else. That integration gap is real — and it is a *"we did the boring
thing completely"* story, defensible only through accumulated failure-mode data.

**(1) Authenticated read-back reconciliation, not "logged-out" verification.** The logged-out
check is deleted entirely. We re-fetch the published object **via the same API that created it**
and diff against expected state:

| Network | Readback | Signal |
|---|---|---|
| Reddit | `/api/info` at +1m/+10m/+1h/+24h | `removed_by_category`, `banned_by`, `approved` |
| Meta | media-node GET | existence, `is_published` |
| TikTok | status/fetch | publish state |
| X | compliance-job events | deleted / deactivated / suspended |
| Others | per ledger `read.readbackSupported` | — |

This yields the `PUBLISHED_THEN_REMOVED` terminal state that no generic taxonomy anticipates
(Reddit AutoModerator removals occur seconds after an HTTP 200 `[07 §6.1]`), is fully within
platform terms, and needs no scraping. **Where a platform exposes no read-back, the UI says
"removal detection unavailable on this network"** — an admitted blind spot is itself
differentiation in a category that hides them. Any residual desire for third-party corroboration
goes through licensed providers (Apify / ScrapeCreators / EnsembleData) as an explicit, priced,
contractually-fenced option — **never through our own app ID**.

**(2) Pre-flight is "complete and generalised", not "first".** Reddit `post_requirements`/flair
(Postiz) and TikTok `creator_info` (mandatory for audit approval) are table stakes. The
unclaimed ground is `[05 §11 G8]`: **a general destination-rules engine that carries the
Reddit/TikTok pattern to networks with no machine-readable rules endpoint**, built from the
accumulated observed-failure corpus (§4.5, §15.5). That corpus is the only defensible asset here,
because it compounds with volume and cannot be copied from documentation.

**(3) Two reliability artefacts, not a public p95 page** — §15.6.

**(4) Re-verify the 10–15% churn figure** with actual win/loss and cancellation interviews before
it becomes load-bearing in any deck or pricing decision. §20.

---
## 17. Phased roadmap

### 17.1 The three sequencing rules

Everything below follows from three rules, stated first because the phase contents are
derivations, not preferences.

1. **Calendar-time dependencies start on day one and nothing about them gets faster by starting
   later** `[06 §19.7 wave 0]`. Meta Business Verification + App Review, LinkedIn Community
   Management, TikTok audit, Google OAuth verification + YouTube quota extension, Pinterest
   Standard, GBP allowlisting, `ads_management` Advanced Access, SOC 2 Type II observation window.
   These are measured in weeks-to-months and several gate whole modules.
2. **Irreversible architecture is built before reversible features.** Per-tenant KEKs, the org
   tree, `(wall-clock + zone)` time, `body_ir`, the Capability Ledger, the Action Gate call
   discipline, the residency seam, and the decision-trace split are all quarter-of-work rewrites
   if deferred and one-to-two-week builds if not `[11 §10.3]`, `[08 §14.6]`.
3. **Assets that compound with volume start accumulating as early as possible** — the failure
   corpus, the benchmark panel, the fleet creative priors, and the decision-trace evidence. Their
   value at month 18 is a function of when they started, not how much was spent.

### 17.2 Phase 0 — weeks 1–4: irreversibles and applications

**Objective:** make every unrecoverable decision, and start every clock.

| Track | Deliverable |
|---|---|
| **Applications** | File *all* of them. Meta (verification + App Review + `ads_management`), LinkedIn Community Management, TikTok audit, Google OAuth verification + YouTube quota, Pinterest Standard, GBP allowlist. Assign an owner and a rejection-loop process — `[05 §9]` documents that the approval gauntlet, not the code, is the real barrier |
| **Substrate** | Tenant/org tree with `ltree` + RLS; per-tenant KEK envelope encryption with AAD; time kernel (wall-clock + zone, tzdb pipeline); locale kernel skeleton (ICU MessageFormat, CLDR week data); retention-policy tables |
| **Kernels (skeletons)** | Action Gate with kill switches, holds, budgets and the decision-trace split; Capability Ledger schema + first 8 rows; Signal Bus with two producers; Model Broker with routing + caching |
| **One vertical slice** | Facebook Pages + Instagram end-to-end: connect → compose → negotiate → schedule → dispatch → publish → readback → metric. One archetype, proven |
| **CI invariants** | The eight fitness tests (§15.4) exist and pass |

**Exit criterion:** a post scheduled in `Asia/Riyadh` publishes at the right local instant, the
Action Gate denied a test violation with a traced reason, and a KEK destruction rendered a test
tenant's credentials unreadable.

### 17.3 Phase 1 — months 2–5: parity core and reliability

**Objective:** a product a Vista customer can switch to, whose reliability is provably better.

- **Networks:** wave 1 Facebook/Instagram/Threads (one auth family, one archetype); wave 2
  Pinterest + YouTube (low complexity, YouTube analytics best-in-class); wave 3 LinkedIn
  (gated on wave-0 approval); Bluesky and Mastodon (cheap, and Bluesky is the unsampled listening
  exception) `[06 §19.7]`, `[12 §9]`.
- **Publishing:** full state machine, three idempotency mechanisms, typed error taxonomy,
  lateness budget, rate-limit budgeting with fair share, pre-flight validation in the browser,
  pre-flight quota simulation, readback reconciliation, retry ledger.
- **Parity core:** composer, calendar, queues, bulk ops incl. **bulk move-to-draft**, media
  library, ideas, hashtags, link shortening + UTM, alt text everywhere the API allows.
- **Governance v1:** Publishing Hold composite + restore review queue + crisis preset (organic
  only); approvals **time-and-place** (SLA ladders, digests, OOO, Slack + Teams apps,
  decision-by-link, free reviewer seats); audit log; SSO + SCIM + 2FA-with-SSO.
- **Connection health**: probes, T-14/T-3, scope-delta, repair links + batching.
- **Analytics day one:** three-layer metric model, daily snapshots, `followers_at_post_time`,
  connect-time platform backfill, report catalogue, white-label PDFs.
- **Migration engine:** CSV parsers ×9, bulk OAuth wizard, boolean translator, reconciliation
  report, "switch in 20 minutes" flow `[12 §33.3–33.4]`.
- **Agent surface v1:** MCP server with server-side write safety (dry-run default,
  propose→confirm, scoped tokens, caps); public REST API, self-serve; Analyst agent (read-only,
  `auto`); shadow-mode infrastructure with the synthetic corpus.
- **Compliance:** DPA, DSAR console, DSA notice-and-action, EU representative, SOC 2 Type I and
  the start of the Type II observation window.

**Why this order.** Reliability and migration are the two things that make switching rational;
governance v1 is what makes the demo land; the MCP write-safety layer is P0-EXCEED and cheap
`[01 line 1358]`; and the failure corpus + benchmark panel start accumulating from the first
publish.

### 17.4 Phase 2 — months 6–11: depth where the money is

**Objective:** agency and multi-location depth, and the second half of coverage.

- **Inbox + Coverage:** unified inbox, SLA objects with pre-breach alerts and escalation,
  timezone-aware handover digest, IG send-eligibility state machine, per-channel SLA floors,
  saved replies, moderation where the API allows.
- **Hierarchy:** locked templates with editable zones and publish-time diff enforcement,
  per-level approval rules, per-location merge fields, roll-up + compliance ("who is dark") view,
  per-profile timezone rollout, agency portal + white-label + per-client billing.
- **Offboarding:** "remove client" as one audited transaction; authenticated expiring exports.
- **Listening L0/L1:** owned channels + Bluesky/Mastodon/YouTube/RSS/forums, with per-source
  coverage labels; hybrid enrichment; crisis signal composer feeding §16.1's proposal.
- **Assisted publish:** mobile client, never-drop-the-slot semantics, IG Stories-with-stickers,
  IG personal, TikTok creative layer; deep-link device lab.
- **Rights ledger:** first-party origination, per-class enforcement, override records.
- **Tier-2 waves:** archetype A/B/D/G first (Telegram, Discord, Reddit, Tumblr, Twitch, RSS,
  Dev.to/Hashnode/Ghost/WordPress), then archetype C (Mastodon family, self-hosted WP/Ghost) —
  the one competitors skip.
- **Regional wave 1:** VK/OK, LINE, Kakao, Zalo, Naver — plus the template subsystem shared with
  WhatsApp.
- **Warehouse:** dbt package, Iceberg bring-your-own-bucket, row-level export.
- **Approvals Phase B:** conditions and quorum with a closed vocabulary.
- **SOC 2 Type II** completes; ISO 27001 begins.

### 17.5 Phase 3 — months 12–18+: autonomy and the compounding assets

**Objective:** turn the accumulated data into products only we can build.

- **Agents at L3:** Triage, Responder, Composer, Watch, Repair — each promoted per tenant from
  shadow-mode evidence; replay QA gating every config and model change; per-tenant AI compliance
  report.
- **Experiments:** fleet-wide creative-feature priors; franchise cross-location randomised trials
  with MDE-up-front and crossover designs.
- **Paid:** boost configs, dark posts, organic→paid rules, paid-vs-organic reporting, rights →
  live-spend dependency alerts (gated on `ads_management` Advanced Access).
- **Commerce and creator:** product tagging, catalogues, UGC galleries, creator contracts and
  payouts — one contact graph, one asset ledger.
- **Global:** MENA bundle (RTL, Arabic counting, Arabic-native AI, Ramadan planning), LATAM,
  SEA, India; **China as a separate operational stack only on a revenue case**.
- **Enterprise:** BYOK/HYOK, residency shards, archive-of-record journalling (Smarsh/Global
  Relay/Proofpoint/Hearsay), contractual SLA with service credits.
- **GEO monitoring** as a metered add-on.

### 17.6 What is deliberately late, and why

| Deferred | Until | Reason |
|---|---|---|
| Cross-platform listening triggers | Enterprise ARR | X/Reddit pricing is the largest single unknown in the corpus `[12 §1833]` |
| Agent capacity / concurrency routing | Post-PMF | Only enterprise buyers ever asked, and they already own it |
| Case object, QA scoring, CRM bidirectional sync | Phase 3 | `[03 §21.3]` puts care depth at months 9–18 behind procurability |
| Listings syndication | Never (partner) | Requires paid publisher-network data deals — a licensing cost floor, not engineering |
| Public reliability page | Conditional | Only if we will keep publishing it during a Meta outage |
| China | Revenue case | Separate legal entity, ICP filing, separate stack |

---

## 18. Risks and mitigations

Ordered by expected loss, not by likelihood. `[J]` throughout except where cited.

**R1 — Platform approval denial or delay blocks a whole module.**
TikTok audit, LinkedIn Community Management and Meta Advanced Access each gate features the
roadmap depends on; `[05 §9]` documents the gauntlet in detail.
*Mitigation:* file everything in Phase 0; assign a named owner and treat rejection loops as a
scheduled workstream; design every module to **degrade to a lesser mode** rather than fail —
TikTok ships send-to-inbox before direct post; LinkedIn ships without DM (there is no DM API
anyway); boost suppression in the crisis preset is a Phase-3 addition, not a Phase-1 dependency.

**R2 — App-level enforcement kills every tenant's connections at once.**
A mass-abuse event traced to our app ID gets the app suspended, including for unaffected tenants
`[11 §10.1]`.
*Mitigation:* per-tenant publishing-rate anomaly detection; cross-tenant content-similarity
detection (the Buffer 2013 signature); the §16.11(f) anti-duplication engineering; per-connection
quarantine; and a rehearsed platform-relations escalation path. This risk is the single strongest
argument against ever shipping tier T3 (§5.1).

**R3 — A duplicate-post incident at scale.**
The most reputationally damaging failure available in this category, and the customer's audience
sees it.
*Mitigation:* §9.2's three idempotency mechanisms plus the chaos test that kills workers between
the platform call and the response persist. Treated as a P0 test, not a P0 feature.

**R4 — A crisis hold reports success while posts publish from Meta's servers.**
*Mitigation:* §16.1's `cancelNative` + readback verification and the loud `APPLIED_PARTIAL`
state; and the §4.1 default of self-dispatch, which removes the failure mode entirely for most
content.

**R5 — Token vault breach.**
*Mitigation:* §13.2's full control set; per-tenant KEK containment; AAD turning a missed tenant
filter into a decryption error; attribution on every decrypt; the five kill switches built before
launch.

**R6 — The governance differentiator is fast-followed.**
Sprinklr already has the capability; a mid-market incumbent could ship a policy gate in a quarter
`[verifier: kernel ¶1]`.
*Mitigation:* budget **12 months of lead, not a moat**. Compound it where copying is expensive:
per-tenant shadow-mode evidence corpora (switching resets the customer's trust ladder to zero),
the exportable compliance report, and self-serve distribution — which is the actual gap
`[03 lines 285–286]`.

**R7 — Honesty positioning loses the checkmark bake-off.**
An honest matrix labels ten networks "assisted" and yields a *shorter* checkmark column
`[verifier: reminder ¶3]`.
*Mitigation:* never compete on network count. Lead with the reliability ledger, the restore
queue, and the shadow-mode agreement rate — artefacts a competitor cannot produce on demand in a
bake-off. Accept that we lose deals decided on a feature grid; that segment is not the target.

**R8 — Statistical over-claiming in experiments.**
"Variant B wins" off six posts is a lie a sophisticated buyer catches `[09 §4.4.3]`.
*Mitigation:* MDE-up-front (§16.11d); refusal to report below n thresholds; uncertainty intervals
everywhere; feature-level pooling as the default unit of inference.

**R9 — Cost blowout on X reads, LLM tail, or KMS.**
*Mitigation:* all three are metered per tenant with visible quota meters; X is plan-gated; the
LLM tail is capped by the hybrid routing threshold; KMS is bounded by DEK caching and
tenant-affine scheduling — modelled before launch, not after the bill `[11 §10.4]`.

**R10 — Retention/residency contradictions surface in an enterprise deal.**
GDPR pushes retention down; FINRA/SEC push it up to 3–6 years `[11 §5.6]`.
*Mitigation:* retention is per-tenant, per-data-class configuration with a compliance-mode
override, built in Phase 0 — retrofitting it is painful and the contradiction is guaranteed to
arrive.

**R11 — The DSA reclassification trap.**
A public link-in-bio, public UGC gallery or public creator marketplace could convert us from
hosting service to *online platform*, pulling in notice-and-action, statements of reasons,
out-of-court dispute settlement, trusted flaggers, transparency reporting and Art. 30 KYB
`[11 §6.1]`.
*Mitigation:* public surfaces require an explicit legal review gate in the product process; the
link-in-bio ships tenant-branded on tenant domains with a notice-and-action path from day one;
the exit-pack public link is deleted (§16.2b) partly for this reason.

**R12 — Deep-link and mobile-handoff rot.**
Every recipe is `C3-and-changing` `[07 §17.2]`.
*Mitigation:* a permanent device-lab QA line budgeted as opex, not a one-time build; stale
recipes degrade to "open the app and paste" rather than firing a broken scheme.

**R13 — The franchise thesis is wrong because SOCi et al. already own it.**
The corpus has a genuine hole — **zero mentions of SOCi across all twelve dossiers**
`[verifier: franchise ¶1]`.
*Mitigation:* the §20 search pass runs before any franchise-specific engineering; the agency
framing of the same data model (§16.4) is the hedge, and it is the one with the warmer buyer.

**R14 — The coverage/SLA wedge is already served by helpdesks.**
Whether Zendesk/Front/Gorgias/Intercom social-channel SLA is close enough to kill it is the
single highest-risk unverified assumption in that analysis `[verifier: coverage ¶11]`.
*Mitigation:* verify before funding the module; the handover digest and send-eligibility state
machine survive regardless because they are social-native.

**R15 — Support load, not infrastructure, is the scaling constraint.**
§14.7 shows infrastructure is ~6% of revenue at scale; 60+ fragile integrations generate tickets.
*Mitigation:* every error message names the cause and the fix; connection health and the
capability matrix pre-empt the two largest ticket classes; `health: 'insufficient_plan'` is a
distinct state precisely because competitors answer it with "it's broken" `[07 §14.1]`.

**R16 — Building four kernels first delays visible product.**
*Mitigation:* Phase 0 is four weeks and includes a working vertical slice. If a kernel is not
carrying a real feature by week 4, it is over-designed and should be cut back to an interface
plus the smallest implementation that enforces its invariant.

---

## 19. What this architecture deliberately trades away

Stated explicitly, because an architecture that claims no trade-offs is not an architecture.

1. **Latency on the write path.** Every write pays an Action Gate evaluation (sub-10ms cached,
   but not zero) and a KMS-backed credential unwrap. We accept it for governance and blast-radius
   containment.
2. **Engineering velocity on day one.** Four kernels plus a capability ledger is more ceremony
   than a scheduler needs to ship. The bet is that it is cheaper than the alternative at month 12
   and free at month 24.
3. **Network count as a marketing number.** The honest capability matrix will show a shorter
   checkmark column than competitors who collapse "auto" and "reminder" into one tick (R7).
4. **Native platform scheduling.** Self-dispatch is required by the time substrate and by hold
   semantics, so we forgo the "post appears in Meta Business Suite" affordance except where a
   customer explicitly opts in per connection.
5. **Data-custody lock-in.** The warehouse-native model gives away the strongest switching cost in
   the category `[12 §33.2]`. We keep the derived intelligence and sell portability as a position.
6. **A standalone premium for governance.** Holds, approvals and audit are priced into a plan, not
   sold separately — they close deals, they do not carry a price.
7. **Cookie-session automation.** Tier T3 does not exist, which permanently caps our coverage of
   Snapchat organic, Xiaohongshu, Substack-write and similar surfaces at "assisted".
8. **The PLG exit-pack distribution thesis**, deleted entirely (§16.2b).

---

## 20. Verification backlog

Nothing below is load-bearing until a human with browser and account access confirms it. Ordered
by how much of the build each item unblocks.

**Blocks Phase 0/1 architecture:**

| # | Item | Source |
|---|---|---|
| V1 | Whether TikTok `tt_video/authorize` returns an **expiry timestamp**. If not, §16.9's sharpest wedge stores a creator-asserted duration and must be labelled as such | `[verifier: rights]`, corpus item V6 |
| V2 | Per-platform behaviour on **client-secret rotation** — which platforms invalidate all tokens | `[11 §10.5]` |
| V3 | Meta `scheduled_publish_time` **cancellation semantics and latency** — the entire `APPLIED_PARTIAL` design depends on it | `[06 §12]`, §16.1 |
| V4 | Actual per-network **readback availability** for removal detection (Reddit, Meta, TikTok, X confirmed in corpus; the rest unverified) | `[verifier: publish verification ¶1]` |
| V5 | All numeric media/caption limits in `[06 §5]` — every one is `C2` at best and they are the pre-flight validator's entire content | `[06 §5]` |

**Blocks GTM claims:**

| # | Item | Source |
|---|---|---|
| V6 | The Vista "no pause switch" finding and the whole competitor matrix row at `02:1329` — `04-competitors-smb.md` contains **zero** mentions of "pause" | `[verifier: crisis hold ¶4]` |
| V7 | Whether competitors support **bulk move-to-draft**. If they do, the "bulk delete destroys the queue" narrative is overstated | `[verifier: crisis hold ¶4]` |
| V8 | **SOCi, Rallio, Birdeye Social, Uberall/MomentFeed, Reputation, Chatmeter, Hearsay, Denim Social, Promoboxx, Tiger Pistol, Evocalize, BrandMuscle, Ansira** — SOCi has zero mentions across all twelve dossiers, and every conclusion in `[03 §2.2]` inherits the hole | `[verifier: franchise ¶1]`, `[verifier: bandit ¶g]` |
| V9 | Whether **Zendesk/Front/Gorgias/Intercom** social-channel SLA kills the coverage wedge — highest-risk unverified assumption in that analysis | `[verifier: coverage ¶11]` |
| V10 | Whether **Statusbrew's rules engine** can already express an escalation ladder ("if unassigned > 2h then reassign and notify") | `[verifier: coverage ¶12]`, `[02 §1264–1274]` |
| V11 | The **10–15% publishing-failure churn** figure, via actual win/loss and cancellation interviews | `[verifier: publish verification ¶4]` |
| V12 | Mobile-planner teardown: install and instrument **Later, Planoly, Plann, Preview, Buffer** mobile and **time the actual handoff** — `[04 Appendix A]` never covered this segment | `[verifier: reminder ¶9]` |
| V13 | **X and Reddit data pricing** for listening at our expected volumes — the largest single unknown in the corpus | `[12 §1833]` |
| V14 | Whether an **incremental-auth** claim survives contact with Meta's `rerequest` semantics in practice | `[verifier: connection health ¶4]` |
| V15 | Whether IG **like-as-brand** is available via API (corpus marks it unverified) | `[06 §8.1]` |

---

## 21. Summary

The differentiators that survived adversarial review have one property in common: **each is a
composite that spans surfaces most products keep separate.** A hold that reaches into label
scoping, DM automations, evergreen recycling, boost triggers, the inbox and Meta's own servers. A
rights object that reaches from consent capture into live ad spend. An SLA that reaches from
webhook latency into an escalation ladder. An approval record that reaches from a Slack button
into a FINRA archive. A capability truth that reaches from an adapter into the pricing page.

Products assembled from acquisitions cannot span those surfaces, and products assembled around a
scheduler have no natural place to put the spanning logic. That is the whole argument for the
four primitives:

- **The Action Gate** is where every write is reasoned about, so governance, holds, budgets,
  approvals, rights enforcement and agent safety are one evaluation rather than six features.
- **The Adapter Fabric and Capability Ledger** are where every platform truth lives as data, so
  the composer, the validator, the degradation path, the SLA floor and the public honesty matrix
  are one source rather than five that drift.
- **The Assisted-Execution Tier** is where the un-automatable formats live, with a hard
  architectural boundary against the credential-replay automation the OSS ecosystem normalised
  and the platforms forbid.
- **The Signal Bus** is where everything that happened is observable once, so the inbox, the
  crisis proposal, the connection-health evaluator, the publish reconciler and the shadow-mode
  observer share a spine.

Scheduling sits underneath all four as a commodity, built correctly because 10–15% of churn
depends on it, and marketed as nothing at all.

The honest commercial summary is the one the verifier notes insisted on: most of these are
**gates, not moats** — they remove RFP disqualifiers, win demos and reduce churn. Two are
structural (the hierarchy data model and per-tenant crypto), one is a genuine distribution gap
(self-serve governance), one is a genuine data network effect (fleet creative priors plus the
benchmark panel), and one is an accumulating asset that cannot be copied from documentation (the
failure corpus). That is a defensible position. It is not a claim to have invented a category,
and it should never be sold as one.

