# 00 — MASTER STRATEGY
## A Global AI-Native Social Media Management Platform

**Prepared:** 12 August 2026
**Status:** Definitive synthesis of the 12-dossier research corpus (`01`–`12`) and the three architecture blueprints (`blueprint-a`, `blueprint-b`, `blueprint-c`).
**Purpose:** the single decision-ready reference. Where this document conflicts with a dossier, this document wins; where it is silent, the dossier governs.

**Citation convention.** `[01 §30]` = dossier 01, section 30. `[A §5]` / `[B §4]` / `[C §3]` = blueprint A/B/C. `[V]` = adversarial verifier note on a differentiator claim. Claims marked **UNVERIFIED** must not enter a deck, a price, or a contract until §13 clears them.

**Honesty rule that governs this entire document.** The corpus was assembled under an egress-blocked research environment. Every load-bearing number carries a confidence marker in its source dossier. The strategy below is designed so that **no single unverified fact can invalidate the plan** — where one can (X API per-post pricing, `12 §36` item 1), it is called out inline and the plan routes around it.

---

## 1. Executive Summary — the thesis in ten bullets

1. **Scheduling is free and the category knows it.** Postiz ships 34 network providers under AGPL with 34.5k stars; eleven public MCP servers publish to 9–13 networks each `[05 §11 G2, 09 §4.2]`. Any strategy whose centre is a queue-plus-cron has a centre that costs nothing. We build the scheduler correctly because reliability is 10–15% of SMB churn `[12 §33.1]` — but we do not sell it.

2. **The three scarce assets are the approval portfolio, the accumulated failure corpus, and the governance substrate** `[C §0]`. An audited TikTok client, Meta Advanced Access with a passed DPA, LinkedIn Community Management with working refresh tokens, a YouTube quota extension, Pinterest Standard and GBP allowlisting are 6–16 weeks of calendar time each `[05 §9.10]`. Per-network error taxonomies and destination rules compound with volume and cannot be read out of documentation `[07 §16.4]`. A policy gate in front of every write cannot be retrofitted onto shipped agent surfaces `[09 §4.3]`. All three start accruing on day one or never.

3. **The wedge is distribution, not capability.** Sprinklr built conditional approval routing, agent evaluation and multi-location governance. What it does not have is a way to buy them: self-serve enterprise signup was killed across the category on 30 Apr 2026, and **not one of fourteen enterprise vendors lets a buyer enable SSO, SCIM, audit export or residency with a credit card** `[03 §2.10 #1, §18.1]`. The defensible sentence is *"enterprise governance you can turn on from a settings page"*, never *"governance nobody has."*

4. **Vista Social's moat is breadth and its liability is depth.** 30,000+ customers, 9 modules, a ~60-tool MCP server, and a real add-on monetisation engine (X at **$29/profile/mo**, listening at **$75–250/listener/mo**, advocacy at **$199/mo**) that makes realised ARPU more than double sticker `[01 §4]`. Against that: no SOC 2, no SCIM, no audit log, no data residency, group-level-only timezones and permissions, 6–7h non-Meta inbox latency, a hard 25 posts/day/profile cap, 2-network competitor analytics, no auto-retry on transient publish failure, and no alt text `[01 §25, §28; 02 Appendix A]`. We must match all 75 parity rows and beat the underbelly.

5. **Price on scope, give away humans.** Per-seat pricing taxes exactly the reviewers an approvals engine needs; per-profile pricing taxes exactly the network breadth we differentiate on `[04 §3.3]`. Agencies pay **$25–40k/yr** under seat×profile compounding `[12 §30.2]`. Only Dash Social (unlimited users) and Zoho (per brand) break the model `[03 §18.2]`. We ship **unlimited seats on every plan, free reviewer/approver seats, decision-by-link for external clients**, and monetise workspaces, volume, premium data and generated media.

6. **The AI claim is arithmetic, not adjectives.** A caption costs **$0.00019 cached on Gemini 2.5 Flash-Lite**; a full AI-native brand runs **≈$26/month without GEO, ≈$52 with** `[09 §7.1, §7.8]`. Therefore: **unlimited text AI on every paid plan; meter only media, at a published rate card where 1 credit = 1 cent of underlying cost** `[09 §7.7]`. The defensible 100x is decisions evaluated per human hour (10–20× assets × 8–32× variants), not "better captions" `[09 §1.2]`.

7. **Global is a substrate decision made in week one, not a market entered in year two.** Store scheduled time as `(wall-clock + IANA zone)` resolved at dispatch; timezone on the **profile**, not the group; CLDR week data so Gulf weekends render Fri–Sat; grapheme-correct counting; RTL; PPP bands A–E; local payment rails; merchant-of-record billing `[08 §17, §18; A D3/D9]`. This is 8–12 engineer-weeks that cannot be retrofitted and unlocks markets where every incumbent's calendar is visibly wrong.

8. **Acquisition runs on four surfaces and one of them dwarfs the rest.** An SMM tool has almost no viral surface because its output publishes under the customer's brand `[12 §31.1]`. The four exceptions are link-in-bio, the client approval link, the shared report link and the public calendar. **Link-in-bio is a top-level free product with its own domain from day zero** — it needs no OAuth and no App Review, so it ships while every platform application is pending, and the URL is the highest switching cost in the category `[12 §31.3]`.

9. **Migration is the highest-ROI GTM engineering in the category and it is nearly unbuilt** `[12 §33.3]`. The move nobody has made: **re-fetch history from the platforms rather than import it from the incumbent** `[12 §33.4]`. Instagram ~2 years, Facebook ~2 years, YouTube full history — backfilled on connect, in 20 minutes, without the incumbent's cooperation. That converts the strongest lock-in in the market into our demo. Sprout gates its Analytics API to Advanced+, stranding most of its own base `[03 §3.6]`.

10. **What we will not do, stated up front because the honesty posture is load-bearing.** No X firehose licensing, no TikTok Research API (closed to all commercial users), no Meta Content Library, no logged-out scrape verification, no headless credential-replay against customer accounts, no listings syndication, no Yelp/TripAdvisor review response (no owner OAuth exists), no China without a separate legal entity, no manual metric capture in v1 `[03 §2.6, 05 §8.6, 07 §11.3, 11 §8.3, 12 §35.1]`. Each refusal is published in-product as a capability-matrix row with its reason. In a category whose coverage claims are systematically dishonest, an admitted blind spot is itself differentiation.

---

## 2. Market Landscape

### 2.1 The four enterprise archetypes and the two absent giants

| Archetype | Vendors | Thesis | Typical ACV | Buyer |
|---|---|---|---|---|
| **A. Unified CXM** | Sprinklr, Khoros | Social is one channel in an omnichannel CX OS | $50k–$1M+ | CX exec + CIO |
| **B. Social-first suite** | Sprout, Hootsuite, Emplifi, Brandwatch/Falcon | Social is the product; governance bolted on | $15k–$200k | CMO / Head of Social |
| **C. Intelligence-first** | Meltwater, Talkwalker, Brandwatch CR | The value is the data corpus | $16k–$150k+ | Insights / Comms / PR |
| **D. Vertical specialist** | Dash Social, Later+Mavrck | Deep in one dimension | $6k–$100k | Brand / Creator marketing |

**Salesforce Social Studio retired 18 Nov 2024 (data deleted 90 days later); Adobe Social deprecated 30 Jan 2020.** Both now partner rather than build `[03 §1.1, §13, §14]`. Their exit created the vacuum Sprinklr and Sprout have been filling — and the Social Studio deletion left a permanent scar that makes data-portability a live procurement question.

### 2.2 The six SMB/agency sub-segments

| Segment | Buying trigger | Products | Entry price |
|---|---|---|---|
| Broad horizontal SMB | "post everywhere from one place" | Buffer, Publer, Metricool, Later, SocialBee, Loomly, Zoho, Social Champ, Crowdfire, Pallyy | $10–35/mo |
| **Agency / white-label** | "N clients, must look like the vendor" | Cloud Campaign, Sendible, **Vista Social**, ContentStudio, Statusbrew, Sociality.io, NapoleonCat, Kontentino | $40–250/mo |
| Collaboration-first | "client sign-off is the bottleneck" | Planable, Kontentino, Loomly, CoSchedule | $11–60/seat |
| Engagement-first | "comments and DMs are drowning us" | Agorapulse, Statusbrew, NapoleonCat, Sociality.io | $49–180/mo |
| Evergreen recycling | "the queue must never run dry" | MeetEdgar, SocialBee, CoSchedule, Hypefury | $25–50/mo |
| Single-network | "one network is 80% of revenue" | Tailwind, Sked, Iconosquare, Hypefury, Typefully | $15–80/mo |

**The agency/white-label segment is the only one in this tier with real pricing power** `[04 §2]` and the lowest churn in the category at **1.5–3%/mo vs SMB's 4–7%** `[12 §28]`. It is also the segment both prevailing pricing models punish.

### 2.3 Competitor comparison table — the decision matrix

Legend: ✅ full · ◐ partial · ❌ absent · ? unverified. Sources: `[01, 02 §16, 03 §20, 04 §11, 12 §29]`.

| Capability | **Us (target)** | Vista | Sprout | Hootsuite | Sprinklr | Buffer | Later | Metricool | Publer | SocialBee | Agorapulse | Sendible | Cloud Campaign | Statusbrew | Planable | Postiz (OSS) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| List price entry | **$0 free / $19** | $79 | $199/seat | $99/seat | ~$50k ACV | $5/ch | ~$25 | ~$18 | ~$12 | $29 | $79/seat | ~$29 | ~$41/brand | seat+profile | ~$11/seat | $0 |
| Pricing unit | **workspace + volume** | profile | **seat** | **seat** | seat, role-banded | channel | social set | brand | account | profile | **seat** | profile | **brand** | seat×profile | seat | — |
| Unlimited seats | ✅ | ❌ | ❌ | ❌ | ❌ | ◐ Team | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Free reviewer/approver seat | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | — |
| Permanent free tier | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 50 posts | ✅ |
| Networks (auto-publish) | **~40 + 20 assisted** | 13–15 | ~10 | ~10 | ~15 | ~11 | ~8 | ~11 | ~13 | ~10 | ~7 | ~10 | ~8 | ~10 | ~8 | 34 |
| Regional networks (LINE/VK/Zalo/Kakao) | ✅ Phase 3 | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Crisis hold / blackout w/ restore queue | ✅ | ❌ | ❌ | ◐ | ✅ | ◐ pause | ❌ | ❌ | ◐ | ◐ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ |
| Auto-retry on transient failure | ✅ | ❌ | ? | ? | ✅ | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ◐ |
| Authenticated read-back reconciliation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Per-profile timezone | ✅ | ❌ group | ◐ | ◐ | ✅ Distributed | ◐ per-ch | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ |
| Conditional approval routing | ✅ | ❌ | ? | ◐ Ent | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ rules | ❌ | ❌ |
| Interactive Slack **+ Teams** approvals | ✅ | ❌ webhook | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SLA object + breach escalation | ✅ | ❌ | ◐ | ◐ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ |
| Org hierarchy (brand→region→location) | ✅ | ❌ | ❌ | ◐ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Metric provenance / deprecation notes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Competitor analytics ≥6 networks | ✅ | ❌ (2) | ◐ | ◐ | ✅ | ❌ | ❌ | ◐ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Warehouse-native export (dbt/Iceberg) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Review **generation** (request/QR/widget) | ✅ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Listening included in base | ✅ tiered | ❌ $75+ | ❌ addon | ❌ Ent | ✅ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ |
| X included in base | **metered add-on, cost shown** | ❌ $29/profile | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ |
| SAML SSO | ✅ self-serve | ❌ | ✅ Ent | ✅ Ent | ✅ | ❌ | ✅ Ent | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| **SCIM 2.0** | ✅ self-serve | ❌ | **❌ none** | ? | ✅ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| Audit log + export | ✅ | ◐ | ✅ 50+ | ✅ | ✅ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| EU data residency | ✅ Phase 2 | ❌ | ? | ? | ✅ | ❌ | ? | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | self-host |
| MCP server | ✅ | ✅ ~60 tools | ? | ✅ | ✅ Beta | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ |
| **MCP write-safety (dry-run, caps)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Agent shadow mode w/ agreement rate | ✅ | ❌ | ❌ | ❌ | ◐ eval | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Migration: platform re-fetch backfill | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ 30d | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Per-client billing / reseller markup | ✅ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ |
| White-label + custom domain | ✅ | ✅ Scale | ❌ | ❌ | ◐ | ❌ | ❌ | ✅ | ◐ | ◐ | ◐ | ✅ | ✅ | ◐ | ◐ | ✅ |
| Long-form → short-form clipping | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI-answer visibility (GEO) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SLA with service credits | ✅ | ❌ | ? | ? | ✅ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |

**The five rows where the entire market is empty** — metric provenance, authenticated read-back reconciliation, warehouse-native export, MCP write-safety, and shadow mode with a published agreement rate — are the spine of §4.

### 2.4 Pricing reality

| Vendor | Entry | Enterprise | Unit | Real ACV evidence |
|---|---|---|---|---|
| Sprout Social | $199/seat/mo | $399/seat/mo; Ent custom | seat | Tagger/Influencer avg **$21,431/yr** `[03 §18.1]` |
| Hootsuite | $99/seat/mo | $199–399; Ent min 5 seats | seat | Vendr median **$12k/yr** (96 deals); SpendHound Ent avg $155,813 (conflict) |
| Sprinklr | — (self-serve killed 30 Apr 2026) | **$2,800–$4,700/user/yr** | seat, role-banded | Starts ~$50k; **median ACV ~$129,380** |
| Brandwatch | $108/mo Essentials | $8k–15k/mo @10 users | user + volume | Falcon legacy $1,000–1,750/mo |
| Meltwater | none | custom | modules × geography | **$16k–$70k/yr, median ~$25k** |
| Khoros | none | custom | per agent seat | $10k–$50k+/yr |
| Emplifi | ~$200/mo | custom | profiles + modules | $1k–$3k+/mo |
| Dash Social | **$499/mo** | $2,999+/mo | brands — **unlimited users** | $6k–$42k+/yr |
| HubSpot | $800/mo Pro | $3,600/mo Ent (5 seats) | hub + seats | + £3,000/£7,000 onboarding |
| Zoho Social | $15/mo | custom | **per brand** | Agency $275–460/mo |
| **Vista Social** | **$79** | $149 / $379 / custom | profile | **+$29/X profile, +$75–250/listener, +$199 advocacy** `[01 §4.4]` |
| Buffer | $5/channel | $10/channel Team | channel | unlimited users on Team |
| Postiz | **$0** self-host | — | — | AGPL, 34 providers |

**Three facts that set our price.** (a) The credible standalone SMB floor is **$12–20/mo**; below that reads as "not serious" `[04 §13.2]`. (b) The **$19–29 band is the most crowded in the market** — entering there means fighting Publer, Metricool, SocialBee and Pallyy simultaneously `[04 §13.4]`. (c) **The agency band $150–450/mo is where pricing power exists** `[04 §13.4]`, and the same hierarchy data model serves franchise `[V: hierarchy ¶6]`.

**The listening barbell:** $75/mo with hard caps, or $16,000/yr. Nothing credible between $1k and $16k `[12 §29.4, §30.3]`. That desert is ours to occupy.

### 2.5 Where the pain actually is

| # | Pain | Evidence | Our answer |
|---|---|---|---|
| 1 | **The seat tax.** Executives, legal, PR and clients who need read/approve access are priced out; enterprises under-deploy and screenshot dashboards into slides | `[03 §18.2, §2.10 #3]` | Unlimited seats everywhere; free reviewer class; decision-by-link |
| 2 | **Double-dimension compounding.** Agency with 12 staff / 200 profiles pays $25–40k/yr | `[12 §30.2]` | Price per workspace/brand + volume |
| 3 | **The Sprout gap.** 5-person team = $17,940/yr before add-ons for needs met by $1,200–3,600/yr tools; the 5–15× gap is sales motion and switching cost, not features | `[12 §30.1]` | Migration engine collapses switching cost |
| 4 | **Silent publishing failure** — the single most trust-destroying event in the category; converts a passive user into an active detractor in one incident | `[12 §30.5]` | Pre-flight + typed errors + idempotency + read-back + retry ledger + per-tenant reliability ledger |
| 5 | **Analytics disappointment.** The most common upgrade driver *and* the most common disappointment — customers get prettier versions of numbers the platform already gave them free | `[12 §30.4]` | New *kind* of answer: provenance, comparability classes, benchmarks, causal experiments, warehouse export |
| 6 | **AI credit opacity.** Nobody can explain what a credit is; buyers under-buy and get blocked, or over-buy and resent it | `[12 §29.5, 09 §2.6]` | Unlimited text; media metered at 1 credit = 1¢ published; pre-flight cost estimate |
| 7 | **You cannot buy enterprise security self-serve.** Every vendor routes SSO/SCIM/audit/residency to "contact sales" | `[03 §2.10 #1]` | Self-serve toggles; verifiable inside the free trial |
| 8 | **Migration is deliberately brutal.** No vendor ships an import wizard; Sprout gates its own Analytics API to Advanced+ | `[03 §2.10 #6, §3.6]` | Platform re-fetch backfill + 9 CSV parsers + reconciliation report |
| 9 | **Opaque enterprise pricing.** Meltwater has no public tiers at all; Brandwatch is "impossible to price without a call" | `[03 §2.10 #2]` | Publish every price including Enterprise floor |
| 10 | **Network coverage lag.** OSS now beats commercial vendors to new networks, compressing the window | `[12 §30.7]` | Coverage is a maintenance commitment with a published capability matrix, not a launch claim |

### 2.6 Market size — plan against the bottom-up number

Published figures (MRFR: $31.07B in 2024 → $168.64B in 2035, 16.62% CAGR) are unusable: they bundle agency services and media spend `[12 §27.2]`. Bottom-up, the **entire named category's software revenue is ~$2.8–3.5B**.

| Measure | Figure |
|---|---|
| SMM software revenue today | **~$3–4B/yr** |
| Serviceable segment (SMB + agency + creator, English-first) | **~$1.2–1.8B/yr** |
| Category growth | **8–14%/yr** |
| AI-adjacent expansion | **25–35%/yr** — the only fast-growing sub-segment |

**This is a share-taking market, not a greenfield market.** Every dollar comes from an incumbent. That determines GTM entirely: migration, price disruption and category-adjacent expansion — never category evangelism `[12 §27.3]`.

---
## 3. Complete Vista Social Parity Checklist — the functional floor

This is exhaustive and non-negotiable. Every item is something Vista Social ships today (or a documented Vista gap we are choosing to close). **P0** = required before first paying customer. **P1** = required before the agency motion. **P2** = required before enterprise/RFP. Items marked **[EXCEED]** are Vista gaps — they appear here because they belong to the same module, and their strategic treatment is §4.

Bracketed numbers map to the 75-row checklist at `[01 §30]`.

### 3.1 Composer & content creation

- [ ] **P0** Four-column composer: account selector · caption · live preview · per-network customisation panel `[01 §6.1]`
- [ ] **P0** Per-network post variations (caption, media, network options) on one post object **[1]**
- [ ] **P0** "Apply to all" — push one network's customisation to all selected networks in one click
- [ ] **P0** Grapheme-correct character counting per network's own counting system (X weighted, UTF-16, byte) **[EXCEED — Vista uses naive counts]** `[08 §16]`
- [ ] **P0** Emoji picker; emoji-safe truncation at grapheme boundaries
- [ ] **P0** Link shortening inline as you draft; branded/custom short domain
- [ ] **P0** UTM rules engine — auto-append parameters by rule, no manual tagging **[13]**
- [ ] **P0** **Per-message unique link IDs** so traffic attributes to a specific post, not just a campaign **[13]**
- [ ] **P0** Bitly as an alternative shortener
- [ ] **P0** First comment auto-posted after publish; **up to 10 scheduled comments** per post **[3]**
- [ ] **P0** Post labels, colour-coded, filterable, usable as a reporting dimension (incl. exclusions)
- [ ] **P1** **Custom fields / merge variables** for multi-location content (store address, phone, offer) **[68]**
- [ ] **P1** Hashtag panel; hashtag suggestions from a keyword; **saved hashtag groups**; AI hashtag generation **[12]**
- [ ] **P1** Ideas / content library: folders, labels, internal notes, convert-to-post, AI-generated ideas, mobile access **[11]**
- [ ] **P1** Threads/chains (X threads, Bluesky threads, LinkedIn multi-part)
- [ ] **P2** **Alt text on every network that supports it** (IG, LinkedIn, X, Facebook, Pinterest, Bluesky) with AI-drafted alt text and an accessibility linter **[EXCEED — no Vista alt-text support found]** `[06 §4.2, 02 G8]`
- [ ] **P2** **Polls** (X, LinkedIn, Mastodon), **mixed-media posts**, **calendar notes** **[71 — Vista roadmap, absent]**
- [ ] **P1** Instagram decoration: user tagging, product tagging (≤5/media, ≤20/carousel), location tagging, **collaborators (max 3)**, Trial Reels **[70]**
- [ ] **P1** LinkedIn decoration: document/PDF carousels, organic geo/industry targeting, first-like
- [ ] **P1** TikTok decoration: `disable_comment` / `disable_duet` / `disable_stitch`, cover timestamp, `creator_info` pre-flight
- [ ] **P0** Draft/idea/scheduled/published/in-review/failed as first-class statuses

### 3.2 Scheduling engine

- [ ] **P0** Auto-publish vs **device-targeted reminder** toggle, per network, per post — reminder routable to *any named team member's device* **[2]**
- [ ] **P0** **Publishing queues**: repeating day-of-week + time slots per profile, unlimited slots **[6]**
- [ ] **P0** **Queue labels** — labelled slots so categorised content lands in the matching slot; four independent label namespaces (post, media, inbox, queue) **[6]**
- [ ] **P0** Schedule one post to multiple times `[01 §6.8]`
- [ ] **P0** No scheduling-horizon cap (months/years ahead)
- [ ] **P1** **Evergreen auto-repurposing**: expiration date, **max 25 reuses**, recycle interval **3–100 days** **[7]**
- [ ] **P1** **Evergreen ROI attribution** — incremental impressions/interactions/results from republishes **[7 — a Vista strength to match]**
- [ ] **P0** **Bulk CSV import**: arbitrary column order mapped by header, ≥200 rows, downloadable template, per-network customisation columns, Pinterest multi-board **[8]**
- [ ] **P0** Bulk media upload (≥25 items); bulk label from list view; **bulk move-to-draft**; bulk re-slot
- [ ] **P1** **Smart Publishing**: RSS feeds + news categories + auto-detection from `<meta>`, with 72h first-import guard; AI idea/caption generation with brand voice + brand-safety applied **[69]**
- [ ] **P1** Optimal-time suggestions surfaced **inline in the composer**, per profile per network **[74 — beat the 90-post cold start]**
- [ ] **P1** **Configurable** daily posting caps with audit, replacing Vista's unconfigurable 25/day/profile **[EXCEED]** `[02 §274]`
- [ ] **P0** Per-profile timezone with group default; "publish at 9am local per profile" mode **[EXCEED — Vista is group-level only]**
- [ ] **P0** Dual-time rendering in the composer ("09:00 for the profile / 14:00 for you") **[EXCEED]**
- [ ] **P1** Recurring blackout windows (per profile, weekday, time range, timezone) **[EXCEED]**

### 3.3 Calendar & planners

- [ ] **P0** Multi-view calendar (month / week / list / grid) with drag-and-drop rescheduling **[4]**
- [ ] **P0** Filters: team member, post label, content type, queue label, boosted toggle, **include posts not scheduled from our tool** (natively-published pulled in) **[4]**
- [ ] **P0** Status badges on every calendar item
- [ ] **P0** **Shared calendar link**: no login, custom title, timezone, date range, **expiry**, **password**, and **external approve/reject/edit with a note** **[5]**
- [ ] **P1** Holiday overlay across countries and religions, for inspiration **[4]**
- [ ] **P1** **Instagram grid planner** with drag-to-rearrange and media-library sync **[70]**
- [ ] **P1** **TikTok planner** with trending-audio library
- [ ] **P1** CLDR-correct first-day-of-week and weekend shading (Fri–Sat in SA/EG/IL/KW/QA/OM/BH/JO/DZ; Sun start in SA but Mon in UAE) **[EXCEED]** `[08 §17.3]`

### 3.4 Media library

- [ ] **P0** Images, video, audio, documents; **2 GB max per file**; bulk upload ≥25 items **[9]**
- [ ] **P0** Folders + media labels; **profile-group access restrictions** on assets **[9]**
- [ ] **P0** Alt text per asset **[9]**
- [ ] **P0** Custom video thumbnail / `thumb_offset` **[9]**
- [ ] **P1** Cloud sync: **Google Drive, OneDrive, Dropbox** **[10]**
- [ ] **P1** Stock: Unsplash + Pexels in-library **[10]**
- [ ] **P1** **Canva** integration — create in Canva, import to library **[10]**
- [ ] **P1** AI-generated media lands in the library
- [ ] **P1** Per-network transcode presets with content-hash caching; perceptual hashing for dedupe
- [ ] **P2** GIF sources (Giphy/Tenor) **[Vista UNVERIFIED — ship it]**

### 3.5 Approvals, collaboration & tasks

- [ ] **P0** Named, ordered, multi-step approval workflows **[15]**
- [ ] **P0** Step assignment to: a specific person · any member of the profile group · a **user group** · **external shared-calendar viewers** **[15]**
- [ ] **P0** Rejection halts the chain and returns the post for edits; email notification with a direct link **[15]**
- [ ] **P0** **External approval without login** **[15]**
- [ ] **P0** Contributor role: can schedule, always requires review, cannot choose workflows **[17]**
- [ ] **P0** Workflows filterable by profile group and workflow name
- [ ] **P1** **Conditional / branching approval routing** (network, label, brand, spend, region, AI-generated flag, first-time poster, policy-keyword hit) **[16 — EXCEED]**
- [ ] **P1** Parallel steps, quorum (any 2 of 4), conditional skip, auto-approve-below-threshold **[16 — EXCEED]**
- [ ] **P1** **SLA targets per step, escalation ladders, digest batching, out-of-office delegation** **[EXCEED]**
- [ ] **P1** **Interactive Slack *and* Microsoft Teams apps** with approve/reject/comment buttons, per-channel routing, thread-back **[EXCEED — Vista is webhook-only, no Teams]**
- [ ] **P1** **Decision-by-link for external clients** who will never install a Slack app **[EXCEED — hard pricing requirement]** `[04 §5.7]`
- [ ] **P1** Immutable per-post approval record bound to a **content-version hash** and an **SSO-attested reviewer identity**, exportable **[EXCEED]**
- [ ] **P1** Version history on posts **[EXCEED — Vista has none, Planable/Sprout do]**
- [ ] **P1** Tasks: general (assignee, category, notes, due date) + typed (sales lead, support issue); create from an inbox item **[19]**
- [ ] **P1** Internal notes with `@`-mentions on posts, inbox items and ideas; team conversations panel never visible to customers **[19]**

### 3.6 Permissions, tenancy & agency

- [ ] **P0** Profile groups as the multi-tenancy primitive; content and reports do not co-mingle **[52]**
- [ ] **P0** Roles: Admin/Owner · Profile Group Admin · Read-only · **Restricted (per-feature No Access / View / Manage)** · Contributor **[17]**
- [ ] **P0** **User Groups** assignable as approval steps **[17]**
- [ ] **P0** **Profile connect links** — client attaches their own profiles, no login, **no seat consumed** **[18]**
- [ ] **P0** Bulk selection by profile group at schedule time
- [ ] **P1** **Per-profile permission sets** (not just per-group) **[EXCEED — Vista's weakest architecture]** `[02 §5.2]`
- [ ] **P1** **Org hierarchy** (client/brand → region → market → location) with permissions, approvals, reporting and timezone all resolving through it **[EXCEED]**
- [ ] **P0** **White label**: logo, brand colours, **custom domain**, branded emails from the agency's DNS, branded PDF reports, agency contact info, custom footer **[51]**
- [ ] **P1** Client portals (white-labelled dashboard on custom domain + group-scoped access + shared links) **[51]**
- [ ] **P2** **Per-client billing / agency reselling with markup** **[53 — EXCEED, unbuilt market-wide]**
- [ ] **P1** **Client offboarding as one audited transaction**: upstream OAuth revocation, share-link invalidation, portal-user removal, white-label domain rescission, one immutable audit record **[EXCEED]**

### 3.7 Unified inbox & engagement

- [ ] **P0** Single stream: comments · DMs · mentions · reviews · shares **[20]**
- [ ] **P0** Filters: type, sentiment, priority, campaign, custom labels, assignee, status **[20]**
- [ ] **P0** Assign to a team member; create a linked task; internal notes with `@`-mentions **[20]**
- [ ] **P1** **Saved replies + saved-reply groups**; AI replies savable as saved replies **[21]**
- [ ] **P1** **Macros** — multiple actions in one click (reply + label + assign + close) **[21]**
- [ ] **P1** **Sentiment auto-tagging with a written rationale** (positive/negative/mixed/neutral) **[22]**
- [ ] **P1** Auto-assignment rules, labels, hide/delete moderation **[23]**
- [ ] **P1** **Like/react to comments as the brand** where the API allows (FB, LinkedIn, TikTok yes; IG unverified; YouTube/Threads no) **[24 — EXCEED, trivial]**
- [ ] **P2** **Block users** where the API allows (**Facebook Pages only** — IG has no block endpoint; say so in the UI) **[25 — EXCEED]**
- [ ] **P1** **Ad-comment / dark-post comment moderation** **[26 — EXCEED]**
- [ ] **P1** **Instagram send-eligibility state machine, two clocks**: (a) DM window 24h from last user *message*, extendable to 7 days via HUMAN_AGENT; (b) comment→private-reply, **one reply per comment within 7 days**, a separate one-shot path. A comment does **not** reset the DM clock. Three states: can-send-anything / human-agent-only / closed **[EXCEED]** `[06 §8.2]`
- [ ] **P1** **Configurable SLA targets per brand/channel/conversation type, pre-breach alerts, escalation ladders, SLA-based routing** **[27 — EXCEED]**
- [ ] **P1** **Per-channel SLA floor published in-product**, derived from measured detection latency (Meta webhook-real-time; X paid polling; LinkedIn no organic webhooks and no DM API; TikTok/YouTube no comment webhooks) **[EXCEED]**
- [ ] **P1** **Timezone-aware shift roster (thin) + handover digest** ("47 arrived, 12 unanswered, 3 approaching breach, sentiment shifted on this topic") **[EXCEED]**
- [ ] **P0** Inbox Performance Report: response time, action rate, community-management performance **[37]**
- [ ] **P0** Inbox stats: counts by type / profile / status
- [ ] **P1** Beat Vista's **6–7h non-Meta latency** and **500 items/profile/day sync cap** **[EXCEED]** `[02 §7.2]`

### 3.8 DM & inbox automation

- [ ] **P0** Rule engine — triggers: new DM · new comment (post, livestream, Reel) · **story reply** · mention · **new review (with star-rating and keyword conditions)** **[28]**
- [ ] **P0** Actions: send DM (with video/image/link/card) · public reply · hide comment · delete comment · apply label · assign to user or user group **[28]**
- [ ] **P0** **Dynamic AI Reply** — custom prompt generating a fresh brand-voiced response per interaction **[28]**
- [ ] **P1** Instagram multi-message sequences
- [ ] **P0** Published per-network trigger/action matrix (capabilities differ by platform API)
- [ ] **P0** Permission-gated: only Manage-level users create/edit automations
- [ ] **P1** Review automations by star rating: 5★ auto-thank, 1–2★ escalate to a human
- [ ] **P0** Every automation write passes the same server-side policy gate as a human write **[EXCEED]**

### 3.9 Reviews & reputation

- [ ] **P1** Monitor ≥8 sources: **Google Business Profile, Facebook, Apple App Store, Google Play, Yelp, TripAdvisor, OpenTable, Trustpilot** **[29]**
- [ ] **P1** **Direct in-app reply** on GBP, Facebook, App Store, Google Play; honest link-out for the rest **[29]**
- [ ] **P1** AI review replies in brand voice **[30]**
- [ ] **P1** Notifications by email, SMS and in-app
- [ ] **P1** Review Performance Report (volume, ranking, response rate, sentiment), exportable and schedulable **[37]**
- [ ] **P0** **Review generation: email/SMS request campaigns, review landing pages, QR-to-review, embeddable site widgets** **[31 — EXCEED]** — and **never** selective solicitation or review gating, which Google prohibits `[07 §12.1]`
- [ ] **P2** **Google Q&A management** **[32 — EXCEED]**
- [ ] **P1** **Google Business Profile post publishing** (Local Posts), not just review response **[Vista UNVERIFIED — ship it]**
- [ ] **P2** Per-location review response using corporate-approved reply templates

### 3.10 Listening

- [ ] **P1** Internal listeners (owned/connected profiles) + external listeners (other networks, open web, news) **[33]**
- [ ] **P1** Keyword lists, keyword groups with AND/OR, phrase groups, **exclusion keywords** **[33]**
- [ ] **P1** Sentiment breakdown, **Share of Voice** vs competitors, volume/trend over time, keyword trends, **influencer/top-author identification** **[36]**
- [ ] **P1** Listener Performance Report **[37]**
- [ ] **P2** **True Boolean query language** — NEAR/proximity, nested parentheses, regex, language and geo filters **[34 — EXCEED]**
- [ ] **P2** **Historical backfill** on listener creation **[35 — EXCEED]**
- [ ] **P2** **Versioned queries** so editing a query does not silently rewrite history **[EXCEED]** `[12 §19.3]`
- [ ] **P1** **Per-source coverage class and live quota meter on every result set**; graceful degradation (sample + extrapolate, never blind) **[EXCEED]** `[12 §16.1]`
- [ ] **P1** Word cloud **[Vista UNVERIFIED — ship it]**

### 3.11 Analytics & reporting

- [ ] **P0** Report catalogue: Profile Performance · Post Performance (runnable by label, with label exclusions) · Paid Performance · Paid vs Organic · Competitor · Review · Sentiment · Inbox · Listener · **Industry Benchmark with percentile ranking** · Advocacy · Google Analytics **[37]**
- [ ] **P0** Custom report templates; module add/remove/reorder **[38]**
- [ ] **P0** **White-label PDFs** — own logo, org name, brand colours **[38]**
- [ ] **P0** Scheduled delivery weekly / monthly / one-time to PDF, CSV or **live share link**, to team members and arbitrary emails **[39]**
- [ ] **P0** **No analytics retention limit** — a genuine Vista strength; match it **[37]**
- [ ] **P0** 60-day backfill on connect, extendable **[37 — we exceed via platform re-fetch]**
- [ ] **P1** **Competitor analytics across ≥6 networks** (Vista covers only Facebook + Instagram) **[40 — EXCEED]**
- [ ] **P1** **Custom/calculated metrics and a formula builder** **[41 — EXCEED]**
- [ ] **P1** Google Analytics (GA4) integration: users, new users, bounce rate, session duration, engagement rate, traffic by channel/medium/source **[42]**
- [ ] **P0** **Metric provenance** — source, endpoint, actual upstream field, API version, collected-at, transform, on every number **[EXCEED]**
- [ ] **P0** **Comparability classes** — period-over-period deltas spanning a definition change are badged "not directly comparable"; chart renders a rule at each change date **[EXCEED]**
- [ ] **P0** **Engagement rate: four named definitions with the formula exposed on the number** `[12 §17.3]`
- [ ] **P0** **Daily snapshots from connect**, including `followers_at_post_time` — Pinterest 90d, X non-public 30d, TikTok ~60d are gone forever otherwise **[EXCEED]** `[06 §7.2]`
- [ ] **P2** **Warehouse-native export** — row-level Parquet/Iceberg, published dbt package, Snowflake Native App / BigQuery / Delta Share **[EXCEED — largest single unclaimed gap]** `[12 §25.2]`
- [ ] **P2** Hashtag *performance* analytics — which hashtags actually drove reach **[EXCEED]**

### 3.12 Paid & boosting

- [ ] **P1** Connect an ad account to enable boosting and paid reporting **[43]**
- [ ] **P1** **Boost configurations** — saved reusable targeting + budget + duration presets per network **[43]**
- [ ] **P1** Meta targeting: include/exclude audiences, interests, work positions, locations, gender, age **[43]**
- [ ] **P1** **Dark posts** — hide a boosted Facebook post from the Page timeline **[43]**
- [ ] **P1** Boosted posts filterable on the calendar
- [ ] **P1** Paid Performance Report + Paid vs Organic reporting **[44]**
- [ ] **P2** Organic→paid amplification rules with spend guardrails and rights validation **[EXCEED]**

### 3.13 AI layer

- [ ] **P0** Caption generation from a prompt; regenerate for variations; improve/rewrite; translate/target language **[45]**
- [ ] **P0** Hashtag generation **[45]**
- [ ] **P0** Inbox reply generation; review response generation **[45]**
- [ ] **P1** Image generation **and AI image editing** **[46]**
- [ ] **P1** Video generation — text-to-video, animate an uploaded photo, animate a library asset **[46]**
- [ ] **P0** **Brand voice policy per profile group**, applied automatically across captions, replies, review responses and Smart Publishing **[47]**
- [ ] **P0** Separate **brand-safety policy** applied automatically
- [ ] **P1** **AI Knowledge / RAG**: import documents, paste specs, **connect Zendesk to ingest a whole KB**; assign a Knowledge to a chatbot block; **Test tab** for Q&A before going live **[48]**
- [ ] **P1** **Conversational surface** ("Ask Vista" equivalent): post ideas, trend queries by market/vertical, angle selection (newsjack / educational / hot take / promotional / ask the audience), generated images + source links + brand-voiced captions, schedule inline **[49]**
- [ ] **P1** Full AI Assistant on mobile **[61]**
- [ ] **P0** **Unlimited text AI on every paid plan; media metered at a published rate card** **[EXCEED — Vista's credit numbers conflict and have no published overage price]**
- [ ] **P0** **Pre-flight cost estimate before generation** ("this 20s clip = 160 credits") **[EXCEED — nobody does this]**
- [ ] **P1** **Multilingual quality parity** — explicitly criticised in Vista, weak category-wide **[EXCEED]**

### 3.14 Link-in-bio, links & tracking

- [ ] **P1** Microsite builder: blocks with drag-and-drop reorder, themes, appearance tab (colours, fonts) **[14]**
- [ ] **P1** Embeds: **Calendly**, **Typeform** (lead capture + payments), YouTube, galleries, social profiles **[14]**
- [ ] **P1** **Custom domain with free SSL**; hosted default domain **[14]**
- [ ] **P1** Downloadable **QR code** per page **[14]**
- [ ] **P1** Click tracking and page statistics **[14]**
- [ ] **P1** **Import an existing Linktree/Beacons page** **[14 — a competitive-switching lever worth copying]**
- [ ] **P0** Native shortener + click/engagement/link-performance tracking **[13]**

### 3.15 Employee advocacy

- [ ] **P2** Curated content feed for advocates; brand pre-approval **[50]**
- [ ] **P2** **Leaderboard with shares, reposts, engagement and Earned Media Value (EMV)**; badges **[50]**
- [ ] **P2** Auto-tracking of shares, clicks and engagement per employee **[50]**
- [ ] **P2** **Slack alerts** for advocacy **[50]**
- [ ] **P2** Advocacy Performance Report **[50]**
- [ ] **P2** **[EXCEED]** Advocate-suggested content submission; disclosure enforcement (#ad); rewards/points

### 3.16 Integrations, API & developer surface

- [ ] **P0** **Public REST API** — owned profile data, post data, comment data, schedule posts **[56]**
- [ ] **P0** **OAuth 2.0 Authorization Code + PKCE (S256)** and API keys **[57]**
- [ ] **P0** **Self-serve API access on every paid plan, no sales gate, no provisioning call** **[58 — EXCEED]**
- [ ] **P0** Published, versioned API docs with generous, published rate limits — not "10 violations/hour → key deactivated" **[EXCEED]**
- [ ] **P0** **MCP server** with at least Vista's ~60-tool surface: publishing & scheduling · reports & analytics · inbox · tasks · accounts/profiles/teams · pages · trends & listening · shared calendars · help · utilities **[59]**
- [ ] **P0** **MCP write-safety: dry-run by default, propose→confirm token handshake, scoped per-brand agent tokens, hard publish and spend caps — enforced server-side** **[60 — EXCEED, P0]**
- [ ] **P1** **Zapier** — triggers: post published · post scheduled · draft created · needs review · rejected · failed to publish · new internal comment; actions: schedule post, create profile group, retrieve metrics **[54]**
- [ ] **P1** **Make** app **[54]**
- [ ] **P2** **Slack** app: multi-channel, custom branding **[55]**
- [ ] **P2** **Microsoft Teams** app **[EXCEED — Vista has none]**
- [ ] **P1** Typed outbound webhooks with retry, dead-letter and signature verification **[EXCEED]**
- [ ] **P2** n8n node, Pipedream component **[EXCEED — n8n has no IG/TikTok/Pinterest/Threads/Bluesky nodes]** `[05 §11 G12]`
- [ ] **P1** Bulk data export in Khoros' shape: daily event-level extract, JSON *and* flat CSV

### 3.17 Mobile & extensions

- [ ] **P1** iOS + Android apps: scheduling, inbox, reports, ideas, AI assistant, approvals **[61]**
- [ ] **P1** In-app IG Stories, IG Reels and TikTok publishing from mobile **[61]**
- [ ] **P1** Reminder-notification receipt with never-drop-the-slot semantics **[61 — EXCEED]**
- [ ] **P2** Chrome + Firefox extensions: share content from anywhere on the web **[62]**
- [ ] **P2** Extension: competitor stats on a public profile page (via `business_discovery`) **[EXCEED]**

### 3.18 Security, compliance & trust

- [ ] **P1** **SAML 2.0 SSO** on web and mobile **[63]**
- [ ] **P1** **2FA that coexists with SSO** (Vista disables 2FA when SSO is on) **[67 — EXCEED]**
- [ ] **P1** **SCIM 2.0** provisioning, updates, **deprovisioning**, IdP group→role mapping **[64 — EXCEED; Sprout has none on any plan]**
- [ ] **P1** **Immutable audit log, 50+ event types, CSV + API export, SIEM destinations** **[65 — EXCEED]**
- [ ] **P0** **SOC 2 Type II** (Type I first, observation window started day one), **ISO 27001**, published **DPA** with SCCs, sub-processor list **naming AI model vendors**, "no training on customer data" clause **[66 — EXCEED]**
- [ ] **P1** Data residency as a **signup-time region selector**, with region-pinned AI inference **[EXCEED]**
- [ ] **P1** Configurable retention + deletion policy per tenant per data class; legal hold **[EXCEED]**
- [ ] **P1** Trust Center: pre-filled SIG Lite + CAIQ, pen-test executive summary, VPAT / WCAG 2.2 AA statement **[EXCEED]**
- [ ] **P2** 99.9% **SLA with service credits** **[EXCEED — a named procurement blocker]** `[03 §19.4]`
- [ ] **P1** Password-protected, expiring client links (Vista parity)
- [ ] **P0** Published Usage Policy and Fair Use Policy — with values, not just existence

### 3.19 Onboarding & discoverability

- [ ] **P0** **In-product feature discoverability**: guided onboarding, per-module activation journeys, "you're not using X" nudges, a searchable **command palette** **[75 — EXCEED; Vista's single most-cited complaint is that its own modules are invisible]**
- [ ] **P0** **Value before OAuth** — public-handle audit rendered in 30 seconds, then connect `[02 G7]`
- [ ] **P0** Bulk OAuth wizard with per-network troubleshooting for the known failure modes (IG not converted to Business, FB Page not linked, TikTok region) and resumability
- [ ] **P0** 14-day trial, no credit card, full feature access (Vista parity) — plus a **permanent free tier** Vista does not have

### 3.20 Consolidated limits we must meet or beat

| Limit | Vista | Ours |
|---|---|---|
| Posts/day/profile | 25, hard, all plans | Configurable with audit, default at the platform ceiling |
| Media file size | 2 GB | 2 GB |
| Bulk CSV rows | 200 hard / 100 recommended | 1,000 with chunked ingest |
| Bulk media upload | 25 | 100 |
| Scheduled comments | 10 | 10 |
| Evergreen reuses | 25 | Unlimited within an expiry + interval policy |
| Recycle interval | 3–100 days | 1–365 days |
| Inbox sync | 6–7h non-Meta; 500 items/profile/day | Webhook-real-time where available; polling cadence published per channel; no item cap |
| Analytics retention | Unlimited | Unlimited |
| Zapier/Make rate | 60 req/min, key deactivated after 10 violations/hr | Published per-plan limits with a documented backoff contract, no punitive deactivation |

---
## 4. The Differentiation Stack

Each differentiator below has been through adversarial verification. **The narrowed form is the form we build and the form we say aloud.** The rejected framings are named as rejected, because a competitor will kill an overstated claim in a bake-off and the whole honesty posture with it.

**Scoring.** Impact (1–5, revenue consequence) × Defensibility (1–5, quarters for a funded competitor to match) × Feasibility (1–5, inverse of cost and risk). Score = product ÷ 5, out of 25.

### 4.1 Ranked stack

| # | Differentiator | Imp | Def | Fea | **Score** | Type | Phase |
|---|---|---|---|---|---|---|---|
| D1 | **Server-side agent write-safety** (MCP/API dry-run, propose→confirm, scoped tokens, hard caps) | 5 | 4 | 5 | **20.0** | Moat (architectural) | 1 |
| D2 | **Migration engine with platform re-fetch backfill** | 5 | 3 | 5 | **15.0** | Weapon | 1 |
| D3 | **Publishing reliability as an operational system** (pre-flight → typed errors → idempotency → read-back → retry ledger → contractual SLA) | 5 | 4 | 4 | **16.0** | Moat by accumulation | 1 |
| D4 | **Metric provenance + comparability classes + day-one snapshots** | 4 | 5 | 4 | **16.0** | Moat (not retrofittable) | 1 |
| D5 | **Self-serve enterprise governance** (SSO, SCIM, audit export, residency, holds, approvals — all from a settings page) | 5 | 3 | 4 | **12.0** | Gate → distribution moat | 1–2 |
| D6 | **Hierarchy-native org tree** serving agency *and* franchise from one data model | 5 | 5 | 3 | **15.0** | Moat (schema surgery) | 2 |
| D7 | **Warehouse-native delivery** (Iceberg, dbt package, Snowflake/BigQuery/Delta) | 4 | 4 | 3 | **9.6** | Uncontested gap | 2 |
| D8 | **Composite publishing hold + restore review queue + crisis preset** | 4 | 2 | 5 | **8.0** | Gate; best demo moment | 1 |
| D9 | **Coverage: SLA-as-object + handover digest + IG two-clock state machine + published SLA floor** | 4 | 3 | 4 | **9.6** | Wedge below $50k ACV | 2 |
| D10 | **Approvals as a routing engine** (SLA ladders, digests, OOO, Slack **and Teams** apps, decision-by-link, free reviewer seats) | 4 | 3 | 4 | **9.6** | Gate | 1–2 |
| D11 | **Shadow mode with a published agreement rate** | 3 | 5 | 4 | **12.0** | Moat (no precedent) | 2–3 |
| D12 | **Connection health + client-safe repair links** | 4 | 2 | 5 | **8.0** | Reliability, un-tier-gated | 1 |
| D13 | **Assisted-execution tier** (reminder publish as a real product) | 3 | 3 | 3 | **5.4** | Retention by neglect | 1–2 |
| D14 | **Honest capability matrix + per-source coverage classes** | 3 | 4 | 5 | **12.0** | Positioning moat | 1 |
| D15 | **Time & locale correctness → the MENA bundle** | 3 | 3 | 4 | **7.2** | Regional wedge | 1 (substrate) / 3 (bundle) |
| D16 | **Client offboarding as one audited revocation transaction** | 3 | 4 | 5 | **12.0** | Agency closer | 2 |
| D17 | **Unlimited text AI, media metered at 1 credit = 1¢ published** | 4 | 1 | 5 | **4.0** | Marketing weapon | 1 |
| D18 | **Long-form → short-form clip extraction in the composer** | 4 | 2 | 3 | **4.8** | Largest unclaimed SMB adjacency | 2 |
| D19 | **Rights → live-spend dependency ledger** | 3 | 4 | 2 | **4.8** | Narrow, high-trust | 3 |
| D20 | **Fleet creative-feature priors + franchise crossover RCTs** | 3 | 5 | 2 | **6.0** | Data network effect | 3 |
| D21 | **AI-answer visibility (GEO) tied to publishing** | 3 | 2 | 4 | **4.8** | Net-new surface | 3 |
| D22 | **Link-in-bio as a top-level free product** | 5 | 2 | 5 | **10.0** | Acquisition engine | 0 |

### 4.2 The seven that carry the strategy

---

#### D1 — Server-side agent write-safety

**What we build.** Every write — human, scheduled job, first-party agent, public API caller, or a customer's ChatGPT/Claude arriving over MCP — passes one synchronous, fail-closed Action Gate `[C §3]`. Ten-step evaluation, cheapest first so a banned term never spends a model call: kill switches → holds → connection health → autonomy policy → atomic budget leases → deterministic guardrails → rights → LLM judges → escalation → approval routing. On the MCP surface specifically: **`dryRun` defaults true**, a **propose→confirm token handshake** for any destructive or spending action, **scoped per-brand agent tokens**, and publish/spend caps a headless agent cannot argue with.

**Why it is hard to copy.** Not the code — the position. Retrofitting a gate onto already-shipped agent surfaces is a rewrite, which is exactly why every incumbent who shipped a copilot first is structurally stuck `[09 §4.3]`. Vista ships ~60 MCP tools with no dry-run, no confirmation gate, no scoped token and no publish cap `[01 §23.2]`. `[01 §30 #60]` grades this **P0-EXCEED** and no commercial vendor has it.

**What we do not say.** Not "an agent hallucination is a live brand post" — MCP has had `destructiveHint` annotations since spec 2025-03-26 and elicitation since 2025-06-18, and Claude and ChatGPT gate tool calls by default `[V]`. The correct threat model: **client-side consent is advisory, unenforceable, and absent entirely for headless agents, so the publish gate must live on the server.**

**Engineering requirement.** The decision trace splits into an **immutable non-personal skeleton** (7-year retention, hash-chained) plus an **erasable, tombstoned content payload** — an unconditionally immutable trace is unshippable under GDPR Art. 17 `[11 §5.3, C §3]`.

---

#### D2 — Migration engine with platform re-fetch backfill

**What we build.** (a) A named, marketed **"Switch in 20 minutes"** flow. (b) CSV parsers for Hootsuite, Buffer, Later, Sprout, Sendible, Agorapulse, Loomly, Publer and Metricool, with a generic column-mapper fallback. (c) **Automatic platform backfill on connect** — Instagram ~2 years of media insights, Facebook ~2 years, YouTube full history, LinkedIn ~12 months — with a progress UI showing history reconstructing. (d) Bulk OAuth wizard with per-network troubleshooting and resumability. (e) Boolean listening-query translator. (f) A **side-by-side reconciliation report**: "your Hootsuite numbers vs ours, and precisely why they differ" — which preempts the #1 post-migration support ticket. (g) Concierge migration above a revenue threshold. (h) A programmatic-SEO landing page per source vendor.

**Why it works.** The strongest switching cost in the category is historical analytics beyond platform retention, and it holds precisely because **most incumbents will not export it** `[12 §33.2]`. Sprout gates its Analytics API to Advanced+, so the majority of Sprout customers cannot export their own history `[03 §3.6]` — a stranded population whose only escape route is platform re-fetch. We do not need the incumbent's cooperation and the incumbent cannot prevent it. This converts their lock-in into our demo, and it runs *before* the customer has cancelled anything.

---

#### D3 — Publishing reliability as an operational system

**What we build.** Seven mechanisms as one system, which is the part nobody assembles:

1. **Pre-flight validation at three moments** — as-you-type, at schedule time, and at T-60s: codec/spec/aspect, caption length on grapheme boundaries, tag resolution, token scope, rate-limit headroom, and destination rules (Reddit `post_requirements` + flair, TikTok `creator_info` `max_video_post_duration_sec`). A publish-time `VALIDATION_FAILED` is logged as **our** bug `[A §5]`.
2. **A closed 13-class typed error taxonomy** — transient / permanent / policy / quota / auth and their subclasses.
3. **Retry with exponential backoff inside a user-configurable lateness budget**, not an attempt count.
4. **Per-attempt idempotency keys** derived from `(target, content_hash)`; claim-before-call.
5. **Authenticated read-back reconciliation** at +1m / +10m / +1h / +24h via the same API that created the post: Reddit `/api/info` → `removed_by_category`/`banned_by`/`approved`, Meta media-node GET, TikTok status/fetch, X compliance-job events. Uncertain outcomes route to `VERIFY_PENDING` and are resolved by **asking the network what happened, never by blind retry**.
6. **Two terminal states nobody models**: `PUBLISHED_THEN_REMOVED` (Reddit AutoModerator removals occur seconds after an HTTP 200) and `PARTIALLY_PUBLISHED`.
7. **A visible retry ledger** and a **per-tenant exportable reliability ledger** an agency can forward to its client.

**Two things we explicitly do not do.** No **logged-out verification** — replaced entirely by authenticated read-back, which is within platform terms and needs no scraping `[V]`. Where a platform exposes no read-back path, the UI says *"removal detection unavailable on this network"*. And no **public aggregate p95 page** by default — it is a hostage handed to competitors and it invites SLA obligations without the contract `[03 §19.4]`. Instead: a **contractual SLA with service credits**, which is the artifact that actually appears in an RFP.

**The defensible asset.** Not the pipeline — the **accumulated failure corpus**. Every `UNKNOWN`, `VALIDATION_FAILED` and `CONTENT_REJECTED` writes to a cross-tenant de-identified `failure_observation` table that drives capability-ledger auto-narrowing and destination-rule inference `[C §4]`. Postiz's per-network `maxConcurrentJob` values (Reddit 1, Threads 2, Bluesky 2, Pinterest 3, X 10, YouTube 200, Facebook 500) are an example of exactly this class of knowledge — it compounds with volume and cannot be read out of documentation `[05 §4.1]`.

**Positioning.** Retention infrastructure, not the acquisition wedge. Reliability defends 10–15% of SMB churn, below price-at-renewal at 15–20% `[12 §33.1]`. **Re-verify that 10–15% with real win/loss and cancellation interviews before it becomes load-bearing.**

---

#### D4 — Metric provenance, comparability classes, day-one snapshots

**What we build.** A three-layer metric model: **L1 raw** (exactly what the API returned, partitioned by source so retention is enforceable per platform ToS rather than inheriting the union of every restriction) → **L2 canonical** (with an explicit A/B comparability class) → **L3 derived ratios**, computable only *within* a class, with the formula exposed on the number. Every metric point carries `source`, `endpoint`, `field_as_returned`, `api_version`, `collected_at`, `transform`. A `MetricDefinitionChange` table drives a vertical rule on every chart at each change date, and any period-over-period delta spanning one is badged **"definition changed — not directly comparable."**

**Why it cannot be retrofitted.** Two independent reasons. (a) The columns must exist before the first row is written; adding provenance later means the entire back-catalogue is provenance-less and the badge cannot be trusted. (b) **Daily snapshots from connect** capture data that is otherwise permanently destroyed — Pinterest 90 days, X non-public metrics 30 days, TikTok ~60 days `[06 §7.2]`. Nobody in the market has provenance or deprecation annotations `[02 §16.4]`.

**Commercial effect.** This is the answer to §2.5 pain #5. Customers upgrade expecting analytics to answer "did this work" and receive prettier versions of free platform numbers. Provenance plus comparability classes plus benchmarks plus causal experiments is a different *kind* of answer.

---

#### D5 — Self-serve enterprise governance

**The claim, stated exactly.** *"Your security team can verify our controls during the free trial."* Not one of fourteen enterprise vendors lets a buyer enable identity or governance with a credit card `[03 §2.10 #1]`, and Sprinklr killed self-serve entirely on 30 Apr 2026. This is a **distribution gap, not a capability gap**, and saying so is what keeps the claim alive in a bake-off.

**What ships behind one settings page:** SAML SSO (IdP-agnostic, metadata upload), SCIM 2.0 with real deprovisioning and group→role mapping, an immutable audit log with CSV/API export and Splunk/Sentinel destinations, per-tenant retention and legal hold, region selection, publishing holds, approval routing, and a Trust Center with pre-filled SIG Lite and CAIQ.

**Buy, do not build:** SAML and SCIM implementations. **Build:** the audit log, the retention engine and the residency seam — those are schema, not vendor.

**Expect the fast-follow.** Budget **12 months of lead, not a moat** `[V]`. The compounding part is the accumulated evidence corpus (decision traces, shadow-mode agreement rates) that raises a customer's autonomy ladder over time — switching resets that to zero.

---

#### D6 — Hierarchy-native org tree

**What we build.** An arbitrary-depth node tree (`org → workspace → node* → profile`) with `parent_id` + `ltree` materialised path + a node kind, where **permissions, approvals, reporting, timezone and policy all resolve through the same tree** `[B §1.1, A D4]`. On top of it: corporate-published **locked templates with explicitly editable zones**, enforced at publish time by a **diff check, not a policy document**; per-level approval overrides; per-location merge-field substitution; roll-up reporting with a compliance view (*"which of my 340 locations posted this month, and which are dark"*); per-profile timezone so "9am local" means 9am in each location.

**Who we sell it to.** **Agencies first, franchise second** — the same data model, but the agency buyer is warmer, self-serve-reachable, and already pays $25–40k/yr under seat×profile compounding `[V: hierarchy ¶6; 12 §30.2]`. In franchise, the defensible band is **5–75 locations**: multi-unit operators, emerging franchise systems, and agencies running several multi-location clients. Above ~100 locations you are in a field-sales knife fight with SOCi/Birdeye/Sprinklr sold through franchisor channel relationships we do not have; below ~5 the hierarchy is worth nothing.

**The reframe.** Not "we have locked templates" — TCMA has shipped those since ~2010. It is **"a real social suite — full channel coverage, calendar, listening, analytics — that happens to be hierarchy-native"**, competing on suite depth against local-marketing platforms that are thin as social tools, and on price and self-serve against Sprinklr Distributed at $50k+ entry.

**Severed from the thesis:** listings syndication (a publisher-network data licensing cost floor, not engineering — Yext's actual moat) and full review-generation parity. The honest adjacency is **Google Business Profile + Facebook review response**, not "we replace Birdeye at 1/3 the price" `[V: hierarchy ¶4]`.

**Blocking action before any further work:** run the search pass the corpus never ran — SOCi, Rallio, Birdeye Social, Uberall/MomentFeed, Reputation, Chatmeter, Hearsay, Denim Social, Promoboxx, Tiger Pistol, Evocalize, BrandMuscle, Ansira. **SOCi has zero mentions across all twelve dossiers**, and every downstream conclusion in `[03 §2.2]` inherits that hole.

---

#### D22 — Link-in-bio as a top-level free product

**Why it is here and not in the parity list.** An SMM tool has almost no viral surface, because its output publishes under the customer's brand `[12 §31.1]`. Link-in-bio is the strongest of the four exceptions, and it has three properties nothing else in the product has: it needs **no OAuth and no App Review** (so it ships in Phase 0 while every platform application is pending), it produces a **public URL a non-user opens**, and **the URL is the highest switching cost in the category** — once `brand.link/x` is on packaging and in every bio, changing it is a marketing project.

**Design rules.** Own short domain, not a path on the main site. Free forever. Removable "Made with" footer on paid — the only gate that also acquires. Instrumented viewer→signup conversion. Import from Linktree/Beacons. Graduation path: *"your top link got 4,200 clicks; here's which post drove them"* → *"schedule your next post."*

**Regulatory constraint that must be designed in:** a public link-in-bio plausibly converts us from a hosting service to an **online platform under the DSA** `[11 §6.1]`. Ship tenant-branded pages under tenant domains with a notice-and-action path from day one. Public surfaces are a regulatory decision, not a growth decision.

### 4.3 The narrowings we are holding ourselves to

| Claim we will **not** make | What we say instead |
|---|---|
| "Nobody has a pause switch" | "Everyone has an on/off switch; nobody below enterprise has a hold you can *reason* about." Buffer has had per-channel Pause Queue with defer-forward for a decade `[V]` |
| "Reminder publish is a new product category" | "We finished the last 40% of a 10-year-old pattern, Instagram and TikTok first." iOS does not guarantee silent-push delivery, caps it at 2–3/hour with a 30s budget, and no app can foreground itself or write the clipboard at a scheduled minute `[V]` |
| "Incremental re-consent" | "Early scope-delta detection triggering a full re-auth link before publish time." Only Google supports true incremental auth `[V]` |
| "Token friction is the #1 churn cause" | Token/reconnection friction is **5% of churn, rank 8 of 8**. *Publishing reliability overall* is the #1 addressable bucket, of which token death is one of five causes `[12 §33.1]` |
| "Our rights ledger blocks the publish" | "A live-permission-to-live-spend ledger." The rights-object category already exists (Bynder, Aprimo, FADEL, Rightsline). The join between an expiring grant and the ad groups, gallery slots and queued posts depending on it does not `[V]` |
| "We detect lifted platform audio" | A standing warning on platform-sourced assets. Audio detection does not exist `[V]` |
| "Every incumbent's calendar is visibly wrong" | "Enterprise incumbents ship multi-region publishing; what they lack is CLDR-correct week data and Ramadan planning" `[V]` |
| "4–6 weeks unlocks 10 networks" | An honest matrix labels all ten **assisted**, which yields a *shorter* checkmark column than competitors. Ship the reminder profiles as a cheap byproduct, never as a coverage claim `[V]` |
| "We publish reliability numbers competitors can't match" | The denominator is uncontrolled, any rival can publish a friendlier one tomorrow, and disclosure invites SLA obligations. Ship a **contractual SLA with credits** and a **per-tenant ledger** instead `[V]` |
| "The EU AI Act drives our approval product" | **FINRA 2210 principal pre-approval and SEC 206(4)-1** are the binding drivers. Art. 50(4b) only bites on AI-generated text on matters of public interest; the AI Act is supporting evidence `[V]` |
| "Bandits optimise your posting queue" | Single-account bandits cannot resolve realistic effects at <200 lifetime posts and CV≈0.8. Arms are creative **features** pooled fleet-wide; randomised trials require **≥30 comparable locations** and report the **MDE before the test runs** `[V; 12 §780]` |

---
## 5. Total Platform Coverage Matrix

**The honesty rule that governs this section.** Every surface is labelled **AUTO** (server-side API publish), **ASSISTED** (we own calendar, asset, copy, approval and analytics entry; a human taps publish in the native app), **READ-ONLY**, or **UNSUPPORTED — with the reason**. This matrix ships as a public page and as an in-product capability surface. An honest matrix yields a *shorter* checkmark column than competitors; that is the trade, and it is deliberate `[07 §1.3, V]`.

**Archetypes** `[07 §3, 08 §3]`: **A** single-secret REST · **B** OAuth2 auth-code · **C** instance-scoped OAuth with dynamic client registration · **D** bot/server identity · **E** asymmetric-JWT enterprise · **F** BSP/aggregator-mediated · **G** feed in/out · **H** read-only review ingestion · **I** no write API.

### 5.1 Tier-1 social (Phase 1)

| Surface | Arch | Publish | Native sched | Inbox | Analytics | Gate / lead time | Phase |
|---|---|---|---|---|---|---|---|
| Facebook Pages | B | **AUTO** — text, link, image, multi-image, video, Reels, Stories | **Yes** | Comments, DMs, mentions, reviews, shares | Full | Meta Business Verification + App Review, **6–14 wks** | 1 |
| Instagram Business/Creator | B | **AUTO** — feed, carousel (2–10), Reels, plain Stories | No | Comments, DMs, mentions | Full | Same Meta gate | 1 |
| Threads | B | **AUTO** — text, image, carousel (2–20), video; 250 posts/24h | No | Replies | Basic | Same Meta gate | 1 |
| Pinterest | B | **AUTO** — pin, link, board select, multi-board CSV | No | ❌ no comment API | Good | Trial→Standard, **2–6 wks** | 1 |
| YouTube | B | **AUTO** — video + Shorts only | **Yes** (`publishAt`) | Comments | **Best in class** | Google OAuth verification + quota audit, **6–16 wks** | 1 |
| LinkedIn Pages | B | **AUTO** — text, link, image, multi-image (2–20), **document/PDF carousel**, poll, video, organic geo/industry targeting | No | Comments + mentions; **no DM API** | Good | Community Management API, **4–12+ wks, may never answer** | 1–2 |
| LinkedIn personal | B | **AUTO** via `w_member_social` (self-serve) | No | Limited | **Almost none** | Self-serve | 1 |
| TikTok | B | **AUTO** — video, photo carousel (≤35); `SELF_ONLY` pre-audit | No | Comments; **no DM API** | Good | **UI compliance audit, 3–10 wks** | 2 |
| X / Twitter | B | **AUTO** — tweets, threads, ≤4 images, poll | No | Comments, DMs, mentions | Weak; no demographics | **Payment**, hours | 2, metered |
| Bluesky | B | **AUTO** — posts, threads, images, video | No | Replies | Counts only | **None** | 1 |
| Google Business Profile | B | **AUTO** — Local Posts, media, Q&A answers | No | Reviews + Q&A | Performance API | **Allowlist, days–weeks; quota starts at 0** | 1–2 |

**Formats permanently impossible on tier-1** `[06 §6.1]` — every one is ASSISTED, and each renders in-product with its reason: IG Stories with **any** sticker (link, poll, question, quiz, countdown, location, mention, GIF, music, Add Yours); IG/FB/TikTok **licensed music and native audio**; IG Live; IG personal accounts; tagging private accounts; >3 collaborators; TikTok's entire creative layer (effects, filters, TTS, stickers, polls, Q&A, green screen, duet/stitch creation, playlists, LIVE, Stories); **Facebook Groups publishing** (API deprecated ~22 Apr 2024); LinkedIn **Articles and Newsletters**; LinkedIn member post analytics; LinkedIn DMs; **YouTube Community Posts**; YouTube comment pin/heart; X Articles/Spaces creation; X audience demographics; Pinterest comment read/reply; TikTok DMs.

### 5.2 Tier-2 social & community

| Surface | Arch | Verdict | Native sched | Effort | Phase |
|---|---|---|---|---|---|
| **Telegram** (Bot API) | D | **AUTO** to channels/groups where the bot is admin. Best value/effort in the corpus | No | S | 1 |
| **Discord** | A/D | **AUTO** via webhook; bot later | Events only | S–M | 2 |
| **Mastodon / ActivityPub** | **C** | **AUTO** — status, media, poll, CW, visibility. **Dynamic client registration per instance**; unlocks 5+ Fediverse platforms; the archetype competitors skip | **Yes** (`scheduled_at`) | M–L | 2 |
| **Reddit** | B | **AUTO** — text, link, image, gallery, video, comments. Ship **with** flair + `post_requirements` + removal detection or not at all | No | M | 2 |
| **Tumblr** | B | **AUTO** — NPF blocks | **Yes** (`publish_on`) | M | 2 |
| **Twitch** | B | **AUTO** metadata only — title/category/tags, schedule segments, chat, clips, announcements | Segments | M | 2 |
| Nextdoor | B | Ads only; organic **partner-gated** | ? | XL | Partner |
| Snapchat organic | I | **UNSUPPORTED — no organic API exists for anyone.** ASSISTED reminder profile | — | 1 (reminder) | 2 |
| Truth Social / Gettr / Lemon8 | I | **UNSUPPORTED — no developer program.** ASSISTED | — | — | 2 |

### 5.3 Video, audio & long-form

| Surface | Arch | Verdict | Phase |
|---|---|---|---|
| **Vimeo** | B | **AUTO** — tus resumable upload, privacy, folders. Paid plan needed for upload quota | 2 |
| **Kick** | B | **AUTO** chat + channel metadata; **no video upload** | 3 |
| Podcasts (Spotify/Apple) | G/E | **RSS is the distribution.** Apple Podcasts Connect delegated delivery is E-archetype, defer | 3 |
| SoundCloud | B | **UNSUPPORTED — new app registrations closed for years** | — |
| Rumble / Odysee | — | **UNSUPPORTED — partner-only / requires running a node** | — |

### 5.4 Blogging, newsletter & CMS — the layer nobody covers

| Surface | Arch | Verdict | Native sched | Phase |
|---|---|---|---|---|
| **WordPress self-hosted** | A/C | **AUTO** via `/wp-json/wp/v2/`; largest installed base | **Yes** (`status=future`) | 2 |
| **WordPress.com / Jetpack** | B | **AUTO** — posts, media, taxonomies | **Yes** | 2 |
| **Ghost** | A/E | **AUTO** — posts, pages, tags, **newsletter send** (a differentiator) | **Yes** | 2 |
| **Dev.to (Forem)** | A | **AUTO** — markdown, series, canonical | Yes | 2 |
| **Hashnode** | A | **AUTO** — `publishPost` GraphQL | **Yes** (`publishedAt`) | 2 |
| **Shopify blog** | B | **AUTO** — `articleCreate` GraphQL (REST deprecated) | **Yes** | 3 |
| **Webflow CMS** | A/B | **AUTO** — collection items, live publish | Staged | 3 |
| **Wix Blog** | A/B | **AUTO** — draft → publish; Ricos conversion is the cost | Yes | 3 |
| Substack | G | **READ-ONLY (RSS).** No write API | 2 |
| Medium | G | **UNSUPPORTED — write API retired 2023.** RSS read only | — |
| Squarespace | I | **UNSUPPORTED — no content API** (Commerce only). ASSISTED | 3 |

### 5.5 Reviews & local listings

| Surface | Arch | Read reviews | **Reply via API** | Phase |
|---|---|---|---|---|
| **Google Business Profile** | B | **Full** | **✅ Yes** | 1–2 |
| **Facebook Recommendations** | B | Yes (`/ratings`) | **✅ Yes** (comment on the story) | 2 |
| **Apple App Store** | **E** (JWT ES256) | **Full** (`customerReviews`) | **✅ Yes** | 2 |
| **Google Play** | B (service acct) | Last 7 days via API; full history via GCS CSV export | **✅ Yes** (350 chars) | 2 |
| **Trustpilot** | A/B | **Full** — best review API available | **✅ Yes** + Invitations API | 2 |
| Yelp Fusion | A | **3 truncated excerpts only** | **❌ No owner OAuth, no response API** | 2 (monitor only) |
| TripAdvisor | A | ~5 reviews/location | **❌ No** | 2 (monitor only) |
| **Apple Business Connect** | E | n/a | Showcases + location feed — a franchise differentiator | 3 |
| G2 / Capterra | A | Syndication feed, **paid subscription** | ❌ | 3, customer-credentialed |
| Booking.com / OpenTable | F | Partner only | Partner | Declined |
| Amazon | — | **No review read officially**; SP-API Solicitations can *request* | ❌ | 3 |
| Zomato / Glassdoor / Indeed / Healthgrades / Zillow / Angi / BBB | I | **UNSUPPORTED — API retired or never existed** | ❌ | — |

**Hard constraint:** Google prohibits selective solicitation and review gating. Review-request campaigns must solicit *all* customers `[07 §12.1]`.

### 5.6 Messaging & internal distribution

| Channel | Arch | Verdict | Phase |
|---|---|---|---|
| **Slack** | B/D | **AUTO** + `chat.scheduleMessage`; interactive approvals; alerting | 1 |
| **Microsoft Teams** | B/D | **AUTO** via Graph + Bot Framework. **The enterprise-opening half** — budget for Teams Store validation and tenants that block third-party apps by admin policy | 2 |
| **WhatsApp Business Platform** | **F** | **AUTO** — 1:1 + template messages. Business verification + app review; **per-message cost is COGS**; composer needs a template+variables mode. **Status/Channels impossible** | 3 |
| **Viber** | D/F | Bot: **AUTO**. Business Messages via CPaaS | 3 |
| RCS Business Messaging | F | Via CPaaS; per-carrier agent verification | Declined v1 |
| Apple Messages for Business | E/F | **XL — via MSP only**; months-long partner process | Declined v1 |
| Google Business Messages | — | **DEAD — shut down 31 July 2024** | — |
| Signal | — | **NOT FEASIBLE — no business API** | — |

### 5.7 Regional — the coverage nobody in the SMB/agency tier attempts

**Tiering rule** `[08 §1.3]`: build an adapter only where (a) the API legally admits a foreign multi-tenant SaaS **and** (b) the market funds a dedicated maintainer.

| Surface | Market | Arch | Verdict | Entity required | Effort | Phase |
|---|---|---|---|---|---|---|
| **LINE Official Account** | JP/TH/TW/ID | A | **AUTO** — push/broadcast/narrowcast + `/v2/bot/insight/*`. Fully documented public OpenAPI. **Highest-leverage non-Western integration** | **None** | 4–6 EW | 3 |
| **VK** | RU/CIS | A | **AUTO** — `wall.post` with **native `publish_date`** + `stats.get`. Technically the best regional API in the corpus | None; **sanctions exposure** | 4–5 EW | 3, gated on legal |
| **Zalo OA** | VN | A | **AUTO** — `/v3.0/oa/message/*` + article API | None | 4–5 EW | 3 |
| **Naver Band / Cafe** | KR | A | **AUTO** — `/v2/band/post/create`; Cafe article write | None | 3 EW each | 3 |
| **Mercado Libre** | BR/MX/AR | A | **AUTO** — Q&A + post-sale messaging; underrated LATAM play | Seller account | 4 EW | 3 |
| **KakaoTalk Channel** | KR | **C (BSP)** | AUTO via Korean BSP; template pre-approval | BSP contract, **8–16 wks** | 4–6 EW | 3 |
| Odnoklassniki | RU/CIS | A | AUTO (`mediatopic.post`) | Sanctions | 3 EW | 3, gated |
| Bilibili | CN | A | AUTO (`arcopen`) — but mainland preferred | Enterprise registration | 5–7 EW | 4 |
| **Xiaohongshu / RED** | CN | I | **ASSISTED only** — no general 3P content API | — | 1 EW | 3 |
| **LINE VOOM** | JP/TH/TW | I | **ASSISTED only** — no write API | — | 1 EW | 3 |
| Ameba / note.com / Naver Blog | JP/KR | I | **ASSISTED only** | — | 1 EW each | 3 |
| ShareChat / Moj / Josh | IN | I | **ASSISTED only** — no public API | — | 1 EW each | 3 |
| Kwai | BR/LATAM | I | **ASSISTED only** — ads API only | — | 1 EW | 3 |
| **WeChat OA + Channels** | CN | **B (component)** | **R4 — mainland WFOE + ICP filing + 第三方平台 qualification.** Not buildable by a foreign SaaS alone | **Mainland entity, 6–12 months legal** | 8–12 EW | **Separate business case only** |
| Douyin / Weibo / Kuaishou / Toutiao / Baijiahao | CN | B | R4 — same entity requirement | Mainland | 3–8 EW each | Same |
| Koo / Chingari / mixi / XING / Viadeo | — | — | **DEAD — record the decision and the date; re-check annually** | — | — | Never |
| Rutube / Dzen | RU | — | **Sanctioned (Gazprom-Media) — do not build** | — | — | Never |

**China is not a hard integration; it is a different legal product wearing the same UI** `[08 §4]`. It gets its own entity, its own stack, its own P&L, and only on a funded revenue case.

### 5.8 Coverage summary and the claim we make

| Class | Count (target, end of Phase 3) |
|---|---|
| **AUTO** — server-side API publish | **~40 surfaces** |
| **ASSISTED** — reminder/handoff with never-drop-the-slot semantics | **~20 surfaces** |
| **READ-ONLY** — monitoring/analytics only | ~12 surfaces |
| **UNSUPPORTED — published with reason** | ~25 surfaces |

**The claim:** *"Sixty surfaces, each labelled auto, assisted or unsupported, with the reason. Twenty-five things we can't do and why."* No competitor publishes the fourth row, and competitors who still list Medium or Google Business Messages are shipping stale marketing `[07 §5]`.

**Network sequencing rule** `[B §12]`: order by **gate cost, not popularity**, because it is self-bootstrapping — free-and-instant (Bluesky, Mastodon, Telegram, Discord, Slack, blogs) → short-review (Pinterest, GBP, Reddit) → long-review (Meta, TikTok, YouTube) → indefinite (LinkedIn org) → metered (X, last, gated to paid tiers). **Shipping the free ones first produces the live product that every later application requires as evidence.**

---
## 6. Product Architecture — the synthesised blueprint

**The synthesis rule.** Take **A's topology** (it is right about team size), **C's primitives** (they are right about what is scarce), and **B's data model and ceiling discipline** (it is right about what breaks at scale). Where they conflict, A wins on delivery mechanics, C wins on where the invariants live, B wins on schema.

### 6.1 Topology — from Blueprint A

**One modular monolith (`api`), one worker binary (`worker`), one Postgres per region, one language (TypeScript/Node 22), containers on AWS.** Module boundaries enforced by an **ESLint import-boundary rule in CI**, not by the network. Extraction to services happens along pre-cut seams when a measured trigger fires, never before `[A §0]`.

**Why, stated as a rejection of B.** The category's hard problems are calendar-time (platform approvals in months), correctness-under-fragility (7 of 9 tier-1 surfaces have no native scheduling, so our scheduler is the system of record and the damaging bug is the duplicate post, not the slow query), irreversible-schema, and coverage-breadth. **None of those are solved by microservices and all are made harder by a distributed topology run by six people.** B's event-driven multi-region cell architecture is the correct end state and the wrong starting state; we adopt its *seams* and defer its *topology*.

### 6.2 The four kernels — from Blueprint C

Modules do not call each other. They call four kernels; the kernels call the adapters `[C §2.1]`.

```
  PRODUCT MODULES (23)
        │ every WRITE      │ every PLATFORM      │ every EVENT       │ every MODEL call
        ▼                  ▼                     ▼                   ▼
  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ ACTION GATE │   │ ADAPTER      │   │ SIGNAL BUS   │   │ MODEL BROKER │
  │ policy·hold │   │ FABRIC       │   │ webhooks·    │   │ routing·     │
  │ ·budget·    │   │ 9 archetypes │   │ polls·       │   │ caching·     │
  │ trace·idem  │   │ ×capability  │   │ streams·     │   │ budget·eval  │
  │             │   │ ledger·degrade│  │ internal     │   │ ·provenance  │
  └──────┬──────┘   └───────┬──────┘   └──────┬───────┘   └──────┬───────┘
         └──────────────────┴─────────────────┴──────────────────┘
                                    ▼
       SUBSTRATE: tenancy · vault · audit · time · locale · retention
```

**The invariant this buys.** A module *physically cannot* publish without passing the Action Gate, cannot touch a network except through an adapter, cannot learn anything happened except from the bus, and cannot call a model except through the broker. New modules — and third-party agents arriving over MCP — inherit governance, capability negotiation, observability and cost control for free. **That is the difference between shipping governance and having it.**

### 6.3 The nine irreversible decisions (weeks 1–4)

Merged from `[A §0.1]` and `[B §0.2]`. Each costs ~1–2 weeks now and a quarter later.

| # | Decision | Why now | Cost if deferred |
|---|---|---|---|
| **I1** | **Per-tenant KEK envelope encryption** with AAD binding, lazy creation, tiered policy | Retrofit = online re-encryption of every credential and content row while publishing continues | ~1 quarter + incident risk |
| **I2** | **Global control plane / regional data planes seam**, PII column tagging, **CI lint that fails any cross-plane PII reference** | EU residency is a procurement gate; China and Korea are separate legal products | ~2 quarters |
| **I3** | **Scheduled time as `(wall_clock, IANA zone)` resolved at dispatch** + tzdb pipeline with staleness alarm | A government DST change silently drifts every stored UTC instant. **Deliberately forecloses platform-native scheduling — so we self-dispatch by default** | Silent mis-sends, unfixable retroactively |
| **I4** | **Hierarchy-native node tree** (`parent_id` + `ltree` + node kind); permissions, approvals, reporting, timezone and policy all resolve through it | The agency product and the franchise product are the same data model | Permission-model rewrite |
| **I5** | **Metric provenance columns + daily snapshots from connect** | Pinterest 90d, X non-public 30d, TikTok ~60d are gone forever otherwise | Permanent data loss |
| **I6** | **Capability descriptors, destination rules and error taxonomy as versioned data, not code** | A limit change must be a config deploy, not a release | Every network change becomes a release |
| **I7** | **Typed error taxonomy + idempotency + authenticated read-back** in the publish path | The duplicate-post bug is unrecoverable on the network | Reputational, permanent |
| **I8** | **Action Gate in front of every write** regardless of origin | Retrofitting a gate onto shipped agent surfaces is a rewrite | Agent-surface rewrite |
| **I9** | **Merchant-of-record billing** (Paddle) | Day-one global sales without 40 tax registrations | Months of tax/entity work before first non-US revenue |

Plus, from `[B §4]`: the **audit split** — an immutable hash-chained non-personal decision skeleton plus an erasable, tombstoned content payload. This resolves the immutability-vs-GDPR-Art-17 conflict and cannot be added later without invalidating the chain.

### 6.4 The adapter fabric

**Three layers** `[A §3, B §3, C §4]`:

1. **Capability descriptors** — pure versioned data with `verifiedOn` and a staleness budget. One source renders the composer UI, the validator, the degradation path, the per-channel SLA floor, the MCP tool schemas, and the public honest capability matrix. **Three differentiators become free consequences of the ledger rather than separate builds.**
2. **Nine archetype base classes** — reconciling `[07 §3]`'s nine integration shapes with `[08 §3]`'s five regional ones (A single-secret REST · B OAuth2 auth-code · C instance-scoped OAuth with dynamic client registration · D bot identity · E asymmetric-JWT · F BSP-mediated · G feed in/out · H read-only review ingestion · I no-write-API assisted).
3. **~60 thin network adapters** owning only that network's HTTP.

**Publish is five verbs, not one** — `validate` / `submit` / `poll` / `finalize` / `cancel` — because Meta, TikTok, Pinterest, LinkedIn and YouTube are all async container patterns `[B §3]`. **Six delivery modes are modelled explicitly**: `SYNC`, `ASYNC_POLL`, `NATIVE_SCHEDULED`, `ASYNC_REVIEWED`, `REMINDER`, `UNSUPPORTED`. Most schedulers model one, and the resulting bugs — double-posting a natively-scheduled post, treating an async submission as success, swallowing a content-review rejection — are exactly the ones that destroy trust.

**Capability negotiation runs at four moments** (connect / compose / schedule / dispatch) and resolves each `(draft, target)` to `EXACT` / `TRANSFORMED` / `ASSISTED` / `BLOCKED` **at schedule time, in the composer — never at 9:00am** `[C §4]`. A **five-rung degradation ladder** (transform → downgrade → split → reroute → reminder → refuse) ends in a persisted, user-visible **degradation receipt**.

**The destination-rules engine** generalises Reddit `post_requirements` and TikTok `creator_info` to the ~55 networks with no rules endpoint, seeded by an observed-failure corpus mined from our own rejections. `[05 §11 G8]` identifies this as the genuinely unclaimed ground, and it is **the only defensible asset in the publish-verification story** because it compounds with volume.

### 6.5 The engine

**Postgres-backed job queue** (`SKIP LOCKED` + `LISTEN/NOTIFY`) for transactional enqueue and SQL debuggability; Valkey holds nothing durable `[A §5]`. Migrate to a durable log only when a measured trigger fires.

**"Exactly-once" restated honestly as at-most-once publish plus reconcile-to-truth.** Claim-before-call; per-attempt idempotency keys from `(target, content_hash)`; **uncertain outcomes route to `VERIFY_PENDING` and are resolved by asking the network what happened, never by blind retry** `[A §5]`.

**Three nested rate budgets** `[B §5]`: app/project level with **fair-share allocation** for project-scoped quotas (GBP ~300 QPM, Telegram shared bot, Google Play are shared across *all* tenants); tenant level with **X metered in dollars**; connection level for TikTok's 15/24h shared cap. Slot reservation at **T-60s**, four priority lanes, preemptible backfill, and **pre-flight quota simulation on the calendar** — *"this calendar breaches Instagram's daily cap on the 14th"* `[05 §11 G5]`, which no product does.

**Scheduling is peaky** — humans schedule at :00 and :30 `[B §1.2]`. The dispatcher smears within a tolerance budget and reserves rate-limit capacity ahead of the minute.

### 6.6 Data model highlights

| Object | Design | Source |
|---|---|---|
| `nodes` | `ltree` materialised path; inheritable settings resolution | B §4 |
| `node_grants` | **`seat_class` column treated as a pricing mechanic** — free reviewer seats are a schema decision | B §4 |
| `connections` | `instance_url` + `instance_software` for Fediverse and self-hosted WordPress; **timezone at PROFILE level**; 12 credential kinds including **`byo_app` from the first commit** | B §4 |
| `post → content_versions → post_targets` | `content_hash` is what the approval record binds to; `scheduled_local` + `scheduled_zone` + `tzdb_version`, with `dispatch_at_utc` materialised but **non-authoritative** | B §4 |
| `publishing_holds` + `hold_captures` | Includes `platform_hold_result` so **Meta partial-hold failure surfaces loudly** rather than reporting success | B §4 |
| `rights_grants` + `rights_dependencies` + `rights_overrides` | The join between an expiring grant and live ad groups, gallery slots and queued posts | B §4 |
| `metric_facts` | **PARTITIONED BY LIST(network)** so retention is enforceable per platform ToS rather than inheriting the union of every restriction | A §6 |
| `mentions` | Canonical shape with a `coverage_class` field | B §4 |
| `conversations` | Two-clock IG send-eligibility fields | B §4 |
| `audit` | Immutable non-personal skeleton + erasable tombstoned payload | B §4, C §3 |
| `failure_observations` | Cross-tenant, de-identified; drives ledger auto-narrowing and destination-rule inference | C §4 |

### 6.7 Analytics and ingestion

Webhook/poll map per network with **adaptive cadence and cost-aware X polling**. Three-layer metric model (§4 D4). Daily follower snapshots. **Hybrid enrichment** — self-hosted encoders over 100% of the stream, LLM over the 2–5% tail — which turns a $3,000-per-million-mention problem into $60 `[A §6]`. **`observedAt − occurredAt` percentiled per network *is* the per-channel SLA floor**, and the product refuses SLA configurations its detection latency cannot meet `[C §6]`.

**Warehouse-native delivery** over one Iceberg substrate with an explicit shared-vs-withheld table `[B §6]`. The resolution of the strategic tension in `[12 §33.2]`: **give away the raw data, keep the derived intelligence.** Export every mention, metric and enrichment; retain the benchmark panel, the models, the alerting and the workflow. Data portability as a marketing position is strong precisely because no competitor can match it without surrendering their own lock-in.

### 6.8 The assisted-execution boundary — drawn architecturally, not as policy

From `[C §5]`, and this is a hard line enforced by a **CI fitness test**:

- **T1 — API.** Server-side, permissioned, first-party.
- **T2 — Assisted.** The user's own device, own session, human present. This is the honest "computer-use fallback."
- **T3 — Headless credential-replay against customer accounts.** **Does not exist in the codebase.** Cookie-session automation of X and LinkedIn is a direct ToS breach on every major network however common it is in OSS `[09 §4.2.3]`. Browser automation is used **only against our own test accounts** for capability discovery and contract-test fixtures.

This permanently caps our coverage of API-less surfaces at "assisted." That is a real trade, taken deliberately, and it is stated in the capability matrix.

### 6.9 What the architecture explicitly trades away

| Trade | Consequence | Trigger to revisit |
|---|---|---|
| Monolith over services | A throughput ceiling; one deploy blast radius | Sustained p95 regression traceable to a single module |
| Postgres queue over a durable log | Ceiling around tens of millions of jobs/day | Measured queue contention at >60% of a tuned instance |
| Self-dispatch over native platform scheduling | We are the system of record; a missed cron is a missed post | Never — this is forced by I3 |
| Single language (TypeScript) | ML work needs a Python exception | Already granted for enrichment/encoders |
| No T3 automation | Permanent "assisted" cap on ~20 surfaces | Never |
| Warehouse-native export | Surrenders data-custody lock-in | Never — it is the position |

---
## 7. AI Strategy

### 7.1 The claim, stated so it survives a buyer

Not "100x better captions" — caption quality is capped by the frontier model every competitor can also call. The defensible reading is **100x on decisions evaluated per unit of human attention** `[09 §1.2]`:

| Axis | Category baseline | Available now | Multiple |
|---|---|---|---|
| Assets per brand-hour | 5–10 with a caption assistant | 50–200 candidates (copy + image + video + variants) at <$5 media cost | **10–20×** |
| Formats covered | static + text; video manual | static, carousel, short-form video, avatar UGC, dubbed multilingual, auto-clipped long-form | **5–8×** |
| Variants per creative decision | 1 | 8–32 arms under a bandit | **8–32×** |
| Surfaces optimised | social feeds | feeds **plus** AI answer engines | **2× surfaces, net-new** |
| Learning-loop latency | monthly human report | per-post, continuous | **~30×** |
| Languages/markets | 1–2 hand-translated | 30+ via dubbing + lipsync at $0.04–0.05/sec | **15×+** |

10–20× assets × 8–32× variants exceeds 100× in decisions evaluated per human hour. **Every input is priced below.**

### 7.2 Model routing policy — routing is the margin

| Job class | Model tier | Rationale |
|---|---|---|
| Caption drafts, hashtags, variants, tone shifts, **alt text**, reply drafts | `gemini-2.5-flash-lite`, `gpt-5-nano` | Output is short and a judge or human filters it. **2,700–4,000 per dollar** |
| Brand-voice judging, safety judging, claim checking, novelty scoring | `gpt-5-mini`, `claude-haiku-4-5` | Judgement quality > prose quality; still <$0.01/brand/month |
| Long-transcript highlight ranking, campaign planning, report narrative | `gemini-3-flash`, 1M-context tier | Context window is the binding constraint |
| Agent planning with tool use, ambiguous escalations, crisis triage | `claude-sonnet-5`, `gpt-5.4`, `gemini-3-pro` | Low volume, high consequence |
| Anything customer-visible in a regulated vertical | Frontier + **region-pinned endpoint** | Rising procurement gate; EU/AU/JP Bedrock carries **+10%** |

**Prompt caching is the single highest-ROI optimisation.** Brand-voice policy, brand-safety policy and the exemplar corpus are identical across every generation for a brand. Cached prefix cuts **~45% off the text bill** and cuts latency `[09 §7.1]`.

**Publish the fact that we route; never publish which model handles which job** — that changes weekly.

### 7.3 Cost model — full stack per brand per month

| Line | Volume | Unit | Monthly |
|---|---|---|---|
| Captions + variants (5/post, cached prefix) | 150 | $0.00019 | **$0.03** |
| Brand-voice + safety + novelty judging (3 judges × 150) | 450 | $0.0008 | **$0.36** |
| Image candidates | 120 | $0.003 | **$0.36** |
| Selected published images | 30 | $0.04 | **$1.20** |
| Video, 15s/day (economy tier) | 450 s | $0.05/s | **$22.50** |
| Long-form repurposing, 4 × 60 min | 4 | $0.05 | **$0.20** |
| Clip render (self-hosted, 40 clips) | 40 | ~$0.02 | **$0.80** |
| Voiceover, 30 × 60s | 27,000 chars | $0.000015 | **$0.41** |
| Prediction + fatigue + embeddings | continuous | — | **$0.10** |
| Reporting narrative | 5 | $0.02 | **$0.10** |
| GEO monitoring, 5 engines × 200 prompts weekly | 4,000 answers | $0.0066 | **$26.40** |
| **Total with GEO** | | | **≈$52.46** |
| **Total without GEO** | | | **≈$26.06** |
| Same, premium video tier | | | ≈$210 |

**At $99/brand/month, AI-layer gross margin is ~47% with GEO and ~74% without, before routing optimisation.** The two pricing levers are **video tier** and **GEO frequency** — both must be explicit plan dimensions, never buried in a credit pool `[09 §7.8]`.

### 7.4 Credit economics — the five principles

1. **Meter what costs money; make free what is free.** Text generation, judging, embeddings, sentiment and classification are **unlimited on every paid plan** with a fair-use ceiling only. Image, video, avatar, dubbing, transcription and GEO are **metered**. Making text unlimited is a marketing weapon, not a cost risk — the competitive set meters a rounding error and users resent it `[09 §7.7]`.
2. **One credit = one cent of underlying cost, published.** A rate card, not an abstraction:

| Operation | Credits | ≈ Cost |
|---|---|---|
| Draft image (1024²) | 1 | $0.003 |
| Standard image (1024×1536) | 6 | $0.04–0.06 |
| Text-in-image | 8 | $0.06 |
| Image edit | 6 | $0.04 |
| Hero image | 20 | $0.13–0.17 |
| Video economy, per second | 8 | $0.05 |
| Video standard, per second | 14 | $0.08–0.10 |
| Video premium, per second | 50 | $0.30–0.40 |
| Avatar video, per 30s | 45 | ~$0.30 |
| Lipsync/dub, per second | 8 | $0.04–0.05 |
| Transcription, per audio-hour | 8 | $0.04 |
| GEO answer (1 prompt × 1 engine) | 1 | $0.0066 |

   Sold at **$0.03–0.05 per credit** (3–5× markup), so the sales team can answer *"what does a video cost?"* with a number.
3. **Show cost before commitment and after.** Pre-flight estimate in the UI (*"this 20s clip = 160 credits ≈ $X"*) — nobody does this, and surprise is the primary source of credit resentment. Per-brand and per-workspace consumption reporting, exportable, because agencies rebill.
4. **Rollover, top-ups, no expiry games.** Credits roll over one month; self-serve top-ups at a published price; annual plans front-load.
5. **Budget caps and alerts** per workspace, per brand, per month, with a hard-stop option.

### 7.5 Agent design — the autonomy ladder

**Five agents, each promoted per tenant from evidence, not from a toggle:** Analyst (read-only, ships at `auto`), Triage, Responder, Composer, Watch/Repair.

**Four modes per `autonomy_policy`**, scoped per workspace/brand/channel/action-type: `off` | `propose` | `approve_required` | `auto_within_budget` | `auto`. Each carries hard budgets (posts/day, replies/hour, spend/day), guardrail references (brand voice, brand safety, banned-term regex, required disclosures, claim allowlist), escalation triggers, and a **reversibility window**.

**Shadow mode is the default onboarding path** and it is the element with no commercial or open-source precedent found anywhere in the corpus `[V]`. For N days the agent emits what it *would* have done alongside what the human did; the product reports an **agreement rate** and **refuses to report below n=30**. Autonomy is enabled from evidence.

**Replay QA before any live account.** A harness runs a configured agent over historical inbox threads, comments and reviews and scores against a rubric. **Seeded from a curated synthetic per-vertical corpus**, because the customer's real history is not in our system on day one and platform APIs will not hand it over `[V]`.

**The sellable artifact is the per-tenant exportable AI compliance report** — AI inventory, disclosure config, approval records, model providers and their roles, provenance. `[11 §6.2]` calls this the single highest-leverage AI Act build and says nobody in the category ships it. The decision trace is merely its substrate.

### 7.6 Guardrails and disclosure

| Requirement | Implementation | Status |
|---|---|---|
| EU AI Act Art. 50 transparency | In force since **2 Aug 2026**; watermarking grace period for pre-existing systems ends **2 Dec 2026**. Fines to **€15M or 3% of worldwide turnover** | Disclosure surfaces + approval records ship Phase 1 |
| Per-platform AI labelling | TikTok `is_aigc`, YouTube `containsSyntheticMedia`, Meta AI-info (**no API field at all**) | **Table stakes on two, impossible on the third.** Ship it; do not market it |
| C2PA Content Credentials | Generators already sign; platforms strip or re-sign | **Downgraded.** The honest feature is *metadata preservation through transcode*, not signing |
| Brand safety | Deterministic banned-term regex evaluated **before** any model call | Action Gate step 6 |
| Sub-processor register **naming AI model vendors** | Buyers now explicitly ask what data flows where | Trust Center, Phase 1 |
| "No training on customer data" | Standard clause + zero-retention addenda with model vendors | Phase 1 |
| Region-pinned inference | Rising enterprise gate; costs +10% on EU/AU/JP endpoints | Phase 2 |
| Embeddings of personal data | Derived personal data; inherits erasure. **Default: never embed audience or listening content; embed the tenant's own content freely** | Substrate |

**The four XS items nobody in the market ships**, all shippable in month one `[09 §10]`: unlimited text AI with metering only on media; **novelty/creative-fatigue scoring against the brand's own 90-day corpus** (free, it is just embeddings); **pre-flight cost estimate in the composer**; and a **measured, published C2PA platform-stripping matrix** as a category-authority artifact.

---

## 8. Global Strategy

### 8.1 Regions and the seam

| Plane | Contents | Phase |
|---|---|---|
| **Global control plane** | Accounts, billing, feature flags, non-identifying aggregates | 0 |
| **US data plane** | Tokens, message content, end-user PII | 0 |
| **EU data plane** | Same, EEA-resident; exercises the seam built in Phase 0 | 2 |
| **UK** | If a deal requires it | 3 |
| **APAC (SG / AU)** | Regional networks + PIPA/Privacy Act posture | 3 |
| **China** | **A separate legal entity, ICP filing, separate stack. Only on a funded revenue case** | Conditional |

**No cross-plane PII, enforced at the schema and at CI.** Region is chosen at tenant creation and is immutable; changing it is a migration, not an update `[B §1.1]`.

### 8.2 Localisation substrate — the part that must be right in week one

| Layer | Requirement | Source |
|---|---|---|
| **Time** | `(wall-clock + IANA zone)` resolved at dispatch; tzdb pipeline with staleness alerts; **timezone at PROFILE level with a group default**; "publish at 9am local per profile"; **dual-time rendering in the composer** | `[08 §17.1]`, I3 |
| **Calendar chrome** | First-day-of-week and weekend shading read from **CLDR `weekData.json`** — two JSON lookups. Weekends are Fri–Sat in SA/EG/IL/KW/QA/OM/BH/JO/DZ, Fri-only in Iran, Thu–Fri in Afghanistan; first day is Sunday in Saudi Arabia but Monday in neighbouring UAE | `[08 §17.3]` |
| **Blackout primitive** | One generic recurring window (per profile, weekday, time range, timezone) subsumes Fri–Sat weekends, Friday prayers, Shabbat and Iftar — and doubles as the crisis kill-switch | `[V: time ¶5]` |
| **Ramadan/Eid overlay** | Country-selectable dates showing the **±1-day moon-sighting variance explicitly** (never assert one global date), a countdown, and pre-/post-Iftar dayparting presets. **This, not a Hijri date picker, is what a Gulf agency pays for** | `[08 §17.2]`, `[V]` |
| **Text** | RTL layout (Arabic, Hebrew, Farsi, Urdu); CJK typography; Indic scripts; scripts without word spaces; a documented normalisation/sanitisation policy | `[08 §15]` |
| **Counting** | Three counting systems in the wild: X weighted, UTF-16, byte. One counting service, driven by the capability ledger | `[08 §16]` |
| **Numbers/dates** | `Intl.NumberFormat` / `Intl.DateTimeFormat` throughout. Buddhist/ROC/Japanese-era calendars are **one-line `Intl` options implemented silently in the formatting layer — never mentioned in positioning** | `[V]` |
| **Pluralisation** | ICU MessageFormat, no string concatenation | `[08 §17.5]` |

**Cut deliberately** `[V: time]`: Persian calendar (CLDR preference is essentially Iran + Afghanistan, both sanctions-blocked — zero addressable revenue); Hebrew sunset-to-nightfall interval modelling (requires per-location astronomical sunset plus a choice among contested halachic definitions; the generic blackout window serves Israeli marketers at 2% of the cost); Hijri **date entry**.

**Budget: 8–12 weeks for the full scope, not two.** The corpus's own model says 5–7 weeks for the time substrate alone `[08 §1672]`. And the framing: **this is a qualifier that loses deals when absent and closes none when present.** Never a headline. It becomes sellable only bundled as the **MENA package** — RTL + Arabic grapheme counting + Arabic-native AI + Ramadan planning + CLDR week data + local payment rails `[08 §89]`.

### 8.3 Payments and PPP

**Never couple billing to a single PSP.** Build a payment-method abstraction with per-market routing, and model push/voucher methods (Boleto, OXXO, Konbini, M-Pesa STK) as first-class: they confirm asynchronously, expire, and need their own dunning `[08 §18.5]`.

| Market | Must-have methods | Recurring reality | PSP |
|---|---|---|---|
| India | **UPI**, RuPay/Visa/MC, net banking | **Cards cannot be stored** (RBI tokenisation). UPI Autopay / e-mandate with 24h pre-debit notice | Razorpay, Cashfree |
| Brazil | **Pix**, Boleto, cards with *parcelamento* | Pix Automático (2025); Boleto reconciles asynchronously | dLocal, EBANX, Mercado Pago |
| Mexico | **OXXO**, SPEI, cards | OXXO is one-off with voucher expiry | Mercado Pago, Conekta |
| Japan | **Konbini**, Pay-easy, JCB, PayPay | Konbini is a cash push method | Stripe, Komoju |
| Korea | KakaoPay, Naver Pay, Toss | Foreign-card acceptance is weak; a **local PG is effectively required** | Toss Payments |
| SEA | GrabPay, GoPay/DANA/OVO, Momo/ZaloPay, GCash/Maya, FPX, PayNow | Many are one-off | Xendit, 2C2P |
| Africa | **M-Pesa** (Daraja STK push), MTN MoMo, USSD | Recurring is hard — invoice + push | Paystack, Flutterwave |
| MENA | **Mada** (effectively mandatory in SA), KNET, Fawry, Tabby/Tamara | Local acquiring often needs a local entity | HyperPay, PayTabs, Checkout.com |
| EU | **SEPA DD**, iDEAL, Bancontact, BLIK, Swish, Vipps, TWINT | SEPA DD is the strong recurring rail | Stripe, Adyen, Mollie |

**PPP bands.** Set **fixed local price points per currency, refreshed quarterly with psychological rounding** — never convert at request time from a live FX rate `[08 §18.3]`.

| Band | Markets | Index vs US |
|---|---|---|
| A | US, CA, AU, CH, NO, SG, AE-premium | 100% |
| B | Western EU, UK, JP, KR, IL | 90–100% |
| C | Central/Eastern EU, CL, UY, MY, SA, TR | 60–75% |
| D | BR, MX, AR, ZA, TH, CN | 45–60% |
| E | IN, ID, VN, PH, EG, NG, PK, BD, KE | 30–40% |

**Anti-arbitrage, deliberately under-engineered:** band from billing address **+ payment-instrument country**, not IP; instrument country must match for discounted bands; require a local tax ID (GSTIN/CNPJ/VAT) for business plans on discounted bands — which also serves the tax obligation; lock the band at subscription creation. **Accept leakage** — revenue from correctly-priced emerging markets exceeds VPN losses, and aggressive enforcement generates worse support outcomes than the fraud it prevents.

**Currency correctness, non-negotiable:** ~50 currencies are **zero-decimal** (JPY, KRW, VND, CLP, IDR…) and six are **three-decimal** (BHD, JOD, KWD, LYD, OMR, TND). Store **minor units + an explicit exponent**. Multiplying JPY by 100 overcharges by 100× `[08 §18.1]`.

### 8.4 Tax

**Launch on a merchant of record (Paddle), migrate to direct registration market-by-market as volume justifies** `[08 §19.9]`. This converts an open-ended compliance liability into ~5% of revenue and is unwindable. Building 40 tax registrations before product-market fit is a classic way to spend a year on non-differentiating work.

Obligations that bite once we go direct: EU **Non-Union OSS** (no threshold for a non-EU seller; two pieces of non-contradictory location evidence stored immutably; VIES validation for reverse charge); **UK VAT from the first sale**, no threshold; **India OIDAR** 18% with GSTR-5A monthly and an authorised representative; **Brazil is mid-transition through 2026** — use a MoR or a LATAM specialist until it settles; **US state sales tax** with $100k/200-transaction economic nexus across 20+ states, which is genuinely harder than the EU. **Do not build e-invoicing** (Italy SdI, Poland KSeF 2026, France 2026–27, Saudi FATOORA) — use a provider.

### 8.5 Compliance sequencing

| Phase | Deliverables |
|---|---|
| **0 (wks 0–4)** | Per-tenant key hierarchy + crypto-shred model; regional plane seam + CI lint; data classification as column tags; **file every platform application**; retention model as a first-class schema concept |
| **1 (wks 4–12)** | Published DPA + TOMs + sub-processor list + SCCs/UK Addendum; privacy notice; cookie consent + GPC honouring; **sanctions geo-block and screening**; **AI Act Art. 50 disclosure surfaces + approval records (already in force)**; MFA everywhere, RLS, secret scanning, no-plaintext-token lint, SSRF defences; abuse controls at signup |
| **2 (mo 3–9)** | **SOC 2 Type I → start the Type II window**; SSO/SAML + SCIM + audit export; DSAR/erasure console; Trust Center + CAIQ + pen-test summary; accessibility audit + **VPAT**; Cyber Essentials |
| **3 (mo 9–24)** | SOC 2 Type II report issued; ISO 27001 (+27017/27018) then **ISO 42001**; EU data plane live; archiving connectors (Smarsh / Global Relay / Proofpoint / Hearsay); regulated-industry policy packs; **BYOK for enterprise** — nobody in the category offers it, and that is a real gap |
| **Conditional** | HIPAA/BAA if healthcare is funded; China entity; FedRAMP only against a sponsored federal deal |

**Cost:** ~**$100k–$345k year one**, ~$95k–$325k ongoing, plus 1.0–1.5 FTE `[11 §16.3]`. **This is not overhead — it is the price of entry to a segment with materially higher ACV and lower churn**, and it is the wedge precisely because the benchmark lacks it and no incumbent sells it without a sales cycle.

**Crypto-shredding caveat we will state, not hide:** the KMS scheduled-deletion window is the real SLA bound, and aggregates, audit logs and billing records are **deliberately outside the shred** `[11 §5.6, §10.6]`. Sell it as **BYOK/HYOK in enterprise procurement**, not as a "deletion certificate" without asterisks.

---
## 9. Business Model & Pricing

### 9.1 The pricing thesis

**Charge for scope and volume and intelligence. Give away humans and channels.**

The market's two structural extremes are mirror images and each is badly wrong for the other's customer: **Buffer** (per-channel, unlimited seats) and **Sprout** (per-seat, unlimited channels). **The middle — cheap in both dimensions, monetising on something else — is unoccupied** `[12 §29.3]`.

Three constraints force the shape:

1. **Per-seat pricing taxes exactly the reviewers an approvals engine needs.** Agencies share logins to avoid it; Kontentino won on approve-by-emailed-link with no account `[04 §5.7]`. **A free reviewer/approver seat class is a hard requirement, not a nicety** `[V: approvals ¶3]`.
2. **Per-profile pricing taxes network breadth**, which is our differentiator. Charging per profile means the customer pays extra for our advantage `[04 §3.3]`.
3. **The vendor's true marginal cost is API calls, storage and enrichment** — which scale with *volume*, not with seats or profiles. Volume pricing is the only honest basis and it is the only one that survives the X pay-per-use risk.

### 9.2 The tiers

All prices **band A (US/Western Europe), annual billing**; monthly is +25%. Bands B–E per §8.3.

| | **Free** | **Starter** | **Pro** | **Agency** | **Business** | **Enterprise** |
|---|---|---|---|---|---|---|
| **Price** | **$0** | **$19/mo** | **$59/mo** | **$199/mo + $12/brand** (min 5 brands) | **$599/mo** | **from $2,500/mo, published** |
| Unit | 1 workspace | workspace | workspace | **per brand** | workspace | negotiated |
| **Seats** | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** |
| **Reviewer/approver seats** | Free | Free | Free | Free | Free | Free |
| Channels | 5 | 15 | 40 | **Unlimited per brand** | Unlimited | Unlimited |
| Posts/mo | 30 | 400 | 2,000 | Unlimited (fair use) | Unlimited | Unlimited |
| Analytics history | **30 days** | 12 months | **Unlimited** | Unlimited | Unlimited | Unlimited |
| Platform re-fetch backfill | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Link-in-bio | ✅ branded footer | ✅ no footer | ✅ | ✅ white-label | ✅ | ✅ |
| Text AI | Small allowance | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** |
| Media credits/mo included | 100 | 500 | 2,000 | 2,000/brand | 10,000 | negotiated |
| Unified inbox | ❌ | ✅ basic | ✅ full | ✅ | ✅ | ✅ |
| Approvals | ❌ | Linear | **Routing engine + SLA ladders + Slack/Teams** | ✅ | ✅ | ✅ |
| **Publishing holds + restore queue** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Connection health + repair links** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listening | Bluesky complete (free) | + open web | 5,000 mentions/mo | 5,000/brand | 50,000/mo | negotiated |
| Competitor tracking | ❌ | 3 competitors | **≥6 networks, 25 competitors** | ✅ | ✅ | ✅ |
| Reviews: monitor + respond | ❌ | GBP + FB | All 8 sources | ✅ | ✅ | ✅ |
| **Review generation** (email/SMS/QR/widget) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Hierarchy / locked templates | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| White-label + custom domain | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Per-client billing / reseller markup | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Client offboarding transaction** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **SSO (SAML)** | ❌ | ❌ | **✅ self-serve** | ✅ | ✅ | ✅ |
| **SCIM 2.0** | ❌ | ❌ | ❌ | ❌ | **✅ self-serve** | ✅ |
| **Audit log + export** | ❌ | ❌ | ✅ view | ✅ export | ✅ SIEM | ✅ SIEM |
| **Data residency selector** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Warehouse-native export** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Public API + MCP (self-serve) | ✅ read | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Agent autonomy + shadow mode** | ❌ | Propose only | Propose + approve | ✅ | ✅ full ladder | ✅ |
| **SLA with service credits** | ❌ | ❌ | ❌ | 99.9% | 99.9% | 99.95% negotiated |
| BYOK/HYOK, archive journalling | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Add-ons, priced transparently:**

| Add-on | Price | Note |
|---|---|---|
| **X / Twitter publishing** | **Metered pass-through at cost + 20%, with live spend shown in-product** | Vista charges **$29/profile/mo flat**. We show the real number. **This design is what makes the plan survive the X pricing risk** `[12 §36 #1]` |
| Listening mention packs | $29 / 25,000 mentions | Against Vista's $75–250/listener with hard result caps |
| Media credits | $0.04/credit (bulk to $0.03) | Rate card in §7.4 |
| GEO monitoring | $49/mo per brand, 200 prompts × 5 engines weekly | ≈$26 COGS |
| Extra brands (Agency) | $12/brand | |
| Concierge migration | Free above $5k ACV | Cheapest possible enterprise sales motion |

### 9.3 Benchmarked against the market

| Comparison | Them | Us | Delta |
|---|---|---|---|
| Entry paid tier | Vista **$79** (15 profiles, 3 users) | **$19** (15 channels, unlimited users) | **−76%**, and seats are uncapped |
| 5-person team, full suite | Sprout Professional **$17,940/yr** | Pro **$708/yr** + listening | **−96%** on the documented Sprout gap `[12 §30.1]` |
| Agency, 12 staff / 200 profiles / 20 brands | Common hybrid **$25–40k/yr** | Agency $199 + 20 × $12 = **$5,268/yr** | **−79%** on the double-dimension pain `[12 §30.2]` |
| Vista realised ARPU (Advanced + 3 X + Tier-2 listener + advocacy) | **$585/mo** | Pro $59 + X metered (~$20) + listening $29 = **~$108/mo** | **−82%** |
| Listening mid-tier | **$75/mo capped, or $16,000/yr** | **$29–$599** with published coverage classes and a live quota meter | Occupies the desert `[12 §30.3]` |
| Enterprise entry | Sprinklr **~$50k**, median ACV $129k | **$30k/yr published** | Published price is itself a differentiator |
| Per-profile effective rate | SMB band $2.50–12; Sprout $39.80 | Pro: $59 ÷ 40 = **$1.48** | Below the market floor because the unit is not the profile |

**Deliberate positioning choice:** the entry tier is **$19**, not $29. `[04 §13.4]` warns that the $19–29 band is the most crowded in the market — but we are not competing there on features, we are competing on the unlimited-seat mechanic, which none of Publer/Metricool/SocialBee/Pallyy offer. **The floor is $12–20; below that reads as "not serious"** `[04 §13.2]`, so $19 is the lowest credible price.

### 9.4 Unit economics and the segment mix

| Segment | ACV target | Churn `[12 §28]` | Strategy |
|---|---|---|---|
| Creator / solo | $0–228 | **6–10%/mo** | **A distribution asset, not a revenue segment.** Serve with a genuinely free tier for exactly one reason: the link-in-bio page and the "Made with" footer are our only viral surface |
| SMB | $228–708 | 4–7%/mo | Expansion, not churn reduction — **30–40% of SMB churn is unaddressable** (they stopped doing social). Any plan promising SMB gross churn below ~3.5%/mo should be disbelieved |
| **Agency** | **$2,400–15,000** | **1.5–3%/mo** | **The structurally best business in the category and chronically mis-served.** Lowest churn, highest profile-to-seat ratio, and they bring their own distribution |
| Mid-market | $7,200–30,000 | 10–18%/yr | Won on procurability, not features |
| Enterprise | $30,000+ | 8–12%/yr | Published floor; land on governance, expand on brands and volume |

**COGS per brand per month:** AI ≈$26 (without GEO) + infra ≈$4 + platform API costs (X excluded, metered separately) ≈$2. At Pro's $59 the blended gross margin is comfortable; at Agency's $12/brand marginal it requires the base $199 to carry the AI floor — **hence media credits are a per-brand allowance, not an unlimited pool.**

### 9.5 What we deliberately do not do commercially

- **No AppSumo lifetime deal.** It is the fastest route to five-figure user counts and geographic spread, and it is irreversible: permanent, non-expanding, support-consuming, vocal customers; ~70/30 revenue share; 10–15% refunds. Vista's LTD cohort is its single largest source of public negative sentiment after retroactive re-limiting `[01 §28.4, 12 §32.4]`. **If ever reconsidered, run the unit-economics model against the LTD population first** — and note it may be unsurvivable if X publishing is metered per post.
- **No paid acquisition at SMB ACV.** Payback periods on branded-competitor keywords are frequently >18 months, which is unfundable at seed `[12 §34.2]`.
- **No gating the API by plan tier.** Sprout gating its Analytics API to Advanced+ is exactly the pettiness that makes buyers cynical `[03 §19.3]`.
- **No tier-gating connection health or publishing holds.** "Pay more and our software keeps working" reads as extortion `[V: connection health ¶1]`.

---

## 10. Go-To-Market — the day-one traction plan

**The governing fact:** an SMM tool has almost no viral surface `[12 §31.1]`, and this is a **share-taking market where every dollar comes from an incumbent** `[12 §27.3]`. Therefore every item below is an **engineering investment that produces a distribution asset** — not a campaign. Note what is absent: no paid acquisition, no outbound sales, no PR agency.

### 10.1 Day 0 — before any marketing exists (ships in Phase 0, needs no OAuth)

1. **Link-in-bio live, free forever, on its own short domain**, with a removable branded footer, Linktree/Beacons import, QR, custom domains and click analytics. This is the acquisition engine and the highest switching cost in the category.
2. **Bluesky listening live, complete and unsampled.** Free by construction, best-in-class, costs nothing, and doubles as a public credibility demonstration — run a live public dashboard of brand conversation on Bluesky.
3. **MCP server shipped and listed in assistant directories** while the early-mover window is open. In 2026 an MCP server is a distribution channel: it puts the product inside the assistant where the user already works. Brand24 and Hootsuite are already there; competitive density is **very low**.
4. **8–10 free micro-tools**, each a programmatic-SEO landing page and an email capture: engagement-rate calculator, UTM builder, best-time calculator, IG audit via `business_discovery`, hashtag generator, Meta Ad Library search UI, caption generator, character-counter that is actually correct per network.
5. **One MIT-licensed example repo per network** (`instagram-post-api-example`, `bluesky-scheduler-example`, `threads-api-python-example`), each keyword-named and keyword-described. This is the Bright Data lesson — 550 repos, mechanically refreshed, ranking in GitHub search, feeding Google, and ingested by code-aware LLMs `[12 §32.1]`. Cost: low. Surface: untouched by incumbents.
6. **The public capability matrix** — sixty surfaces labelled auto/assisted/read-only/unsupported-with-reason. It is a trust asset *and* a programmatic-SEO asset.

### 10.2 Weeks 1–8

7. **Canva app submitted.** **The single highest-conviction channel in the corpus** `[12 §32.2]`: ~200M+ MAU all creating social content, the user's intent at that exact moment *is* our product, Canva's own scheduling is limited, and competitive density is low.
8. **Migration flow live** — CSV parsers for the top four incumbents, automatic platform re-fetch backfill, bulk OAuth wizard, reconciliation report, and a landing page per source vendor.
9. **Benchmark panel bootstrapped** from public-profile enumeration so benchmark-backed programmatic SEO has real data from launch rather than after 10,000 customers.

### 10.3 Weeks 8–24

10. **Shopify and HubSpot apps** — ~2M merchants and ~250k customers respectively, both with weak incumbent social tooling.
11. **Agency white-label tier** — the low-churn, high-ACV segment.
12. **Template marketplace with creator revenue share** — content calendars, caption packs, report templates, listening query packs. Unbuilt in SMM; Notion and Canva prove the model, and creators promote their own templates, which markets us for free.
13. **Warehouse-native export** — the dbt package and Snowflake/BigQuery/Delta shares. The mid-market wedge and it is uncontested.

### 10.4 SEO — the head is unwinnable, the tail is not

**Do not compete for** "social media management tools", "best time to post on Instagram", "social media calendar template". Hootsuite's, Buffer's and Sprout's blogs are decade-old authority machines and you will lose expensively `[12 §32.1]`.

| Play | Mechanic | Why it wins |
|---|---|---|
| **Migration / alternative queries** | "Hootsuite alternative", "how to export data from Later", "Sprout Social pricing too expensive" | High commercial intent; incumbents cannot rank for their competitors' alternatives; the query self-selects for switchers |
| **Programmatic: network × task** | ~15 networks × ~25 tasks ≈ **375 pages**, each genuinely useful | Long-tail, low density |
| **Programmatic: network × vertical, benchmark-backed** | "Instagram strategy for dental practices" × 200 verticals, each containing **real percentile data nobody else has** | The defensible version — thin without the benchmark panel, strong with it |
| **Free-tool pages** | One per micro-tool | Ranks for tool queries, converts to email |
| **API/developer docs SEO** | Public, indexable API reference | Developers search differently; competition is thin |
| **AI-search citation visibility** | Factual, dated, sourced comparison content | **The genuinely new surface in 2026.** Incumbents' marketing-toned, undated, unsourced content performs badly in it — and we are building GEO measurement anyway |
| **Zapier lesson** | network × network ("cross-post from TikTok to Reels"), network × tool, tool × migration | Tens of thousands of real long-tail queries |

### 10.5 Channels ranked by realistic yield

| Channel | Verdict |
|---|---|
| **Canva Apps** | **Highest yield in the list.** Perfect intent match, audience two orders of magnitude larger than the category, low density |
| **Shopify App Store** | High yield — ties to product tagging, shoppable posts, UGC galleries |
| **HubSpot Marketplace** | High yield for mid-market; HubSpot's own social tool is thin and widely disliked |
| **MCP registries / assistant directories** | Strong, novel, **very low density — the window is open now** |
| Slack | Good specifically for the crisis-alerting and approvals product |
| Notion | "Publish from Notion" is a real requested workflow |
| WordPress plugin directory | Cheap, long tail |
| **Zapier / Make** | **Table stakes, not a channel.** Absence loses deals; presence wins nothing |
| Agency reseller / white-label | **Highest-LTV channel in the category.** Requires custom domain, logo replacement, branded reports, client roles that never see our brand, per-brand billing |
| Affiliate | Category norm 20–30% recurring; the comparison-site ecosystem is mature and mercenary — payouts determine placement |
| Product Hunt | Budget it as PR, not acquisition. One day of tyre-kickers |
| YouTube tutorials / TikTok tool demos | **Underrated.** "How to schedule Bluesky posts" ranks and converts at the exact moment of need |
| Open source | Open-core: permissive publishing core, commercial intelligence layer. **The MIT-and-complete quadrant is empty** — Postiz is AGPL+34 networks, Mixpost Lite is MIT+4 `[05 §11 G2]`. Buys GitHub SEO, developer trust and community-contributed adapters. Cannibalisation risk is real; decide deliberately (§13 Q7) |

### 10.6 Global from day one

Two cheap moves most English-first SaaS skips `[12 §34.4]`:

1. **Localise the marketing surface before the product.** Metricool (Spanish-first) and Publer prove non-English-first GTM is under-exploited. Spanish, Portuguese (Brazil), Indonesian, Vietnamese, Turkish, Arabic and Hindi are large, under-served social-marketing markets with low competitive density and machine-translated incumbent copy.
2. **Support a regionally dominant network early.** Being the first credible Western tool to support LINE or VK is a step-function in that market and costs one adapter.

**Pricing must be regionalised or the global funnel converts at a fraction of its potential.** PPP bands, local payment methods and local currency display are conversion features, not finance features.

### 10.7 The five things we say

1. *"Unlimited users. Published prices. Export everything."* — directly negates the category's three most-hated attributes: the seat tax, opaque pricing, and data lock-in.
2. *"Your security team can verify our controls during the free trial."* — every competitor requires a sales cycle to see SSO/SCIM/audit.
3. *"Switch in 20 minutes, and bring three years of history you thought you'd lose."*
4. *"Sixty surfaces, each labelled auto, assisted or unsupported — with the reason. Twenty-five things we can't do and why."*
5. *"Every AI action is logged, traceable, reversible, and gated at an autonomy level you choose — and you can watch it shadow your team for two weeks before you turn it on."*

---
## 11. Phased Roadmap

### 11.1 The four sequencing rules

1. **Calendar-time dependencies start on day one and nothing about them gets faster by starting later.** Meta Business Verification + App Review (6–14 wks), LinkedIn Community Management (4–12+ wks, may never answer), TikTok UI-compliance audit (3–10 wks), Google OAuth verification + YouTube quota extension (6–16 wks), Pinterest Standard (2–6 wks), GBP allowlisting, `ads_management` Advanced Access, and the SOC 2 Type II observation window. **The approval portfolio is the primary project plan; the software is what fills the waiting time** `[05 §9.11, B §12]`.
2. **Irreversible architecture before reversible features.** The nine decisions in §6.3 are one-to-two-week builds now and quarter-of-work rewrites later.
3. **Compounding assets start accumulating as early as possible** — the failure corpus, the benchmark panel, the fleet creative priors, the decision traces. Their value at month 18 is a function of *when* they started, not how much was spent.
4. **Parity before depth, except where depth is the demo.** The product must survive a feature-matrix comparison, so P0 parity outranks most exceed items — but the three cheapest exceed items with the highest demo value (**the restore review queue, the handover digest, coverage transparency**) are pulled forward because they cost days and change the sales conversation.

### 11.2 Phase 0 — weeks 1–4: irreversibles and the un-gated surface

**Objective: make every unrecoverable decision, start every clock, and ship the acquisition loop that needs no OAuth.**

| Track | Deliverable |
|---|---|
| **Applications (day 1)** | File *all* of them, with a named owner, a calendared date and a rejection-loop process per platform. Expect **one to two rejection cycles per network at 1–3 weeks each — this is normal, not failure** |
| **Substrate** | Tenancy + `ltree` node tree + RLS (I4); per-tenant KEK envelope encryption with AAD (I1); control/data plane seam + CI PII lint (I2); time kernel with tzdb pipeline (I3); locale kernel skeleton (ICU MessageFormat, CLDR week data); retention-policy tables; audit skeleton with hash chain + erasable payload |
| **Kernels (skeletons)** | Action Gate with kill switches, holds, budgets and the trace split (I8); Capability Ledger schema + first 8 rows (I6); Signal Bus with two producers; Model Broker with routing + caching; Postgres job runner |
| **Adapters** | Archetype base classes A, B, D, G; error taxonomy (I7); destination-rules table. **First three networks: Bluesky, Mastodon, Telegram** — no approval required, three different archetypes, which proves the abstraction rather than the integrations |
| **Acquisition surface** | **Link-in-bio + short links + QR shipped publicly** on its own domain with a free tier; 8–10 micro-tools; one MIT example repo per network; the public capability matrix |
| **Commercial** | Paddle MoR checkout (I9); plan/entitlement model; usage meter |
| **Ops** | Terraform, ECS, CI, OTel, Sentry with scrubbing, staging plane, the eight CI fitness tests |

**Exit criterion.** A post scheduled in `Asia/Riyadh` publishes at the right local instant; the Action Gate denied a test violation with a traced reason; destroying one tenant's KEK rendered its credentials unreadable; and a link-in-bio page is live on a real domain.

### 11.3 Phase 1 — weeks 5–20: parity core, reliability, and the switch story

| Area | Ships |
|---|---|
| **Networks** | Meta family (FB Pages, Instagram, Threads) → Pinterest, YouTube → GBP, Reddit, Discord, Slack. LinkedIn personal via self-serve `w_member_social` immediately; LinkedIn org and TikTok when their gates clear |
| **Publishing** | Full state machine with claim-before-call, three idempotency mechanisms, typed errors, lateness budget, three-level rate budgeting with tenant fair-share, pre-flight at all three points, **pre-flight quota simulation on the calendar**, **authenticated read-back reconciliation**, retry ledger, per-network SLO dashboard |
| **Compose / calendar** | Multi-network composer with per-network variations and apply-to-all, grapheme-correct counting, first comment + comment chains, **alt text everywhere the API allows**, hashtag groups, link shortening + UTM + per-message link IDs, drag-drop calendar with filters, queues with labelled slots, **bulk CSV + bulk move-to-draft**, shared calendar links with expiry and password |
| **Media** | Library with folders/labels/alt text, transcode presets, perceptual hashing, cloud-drive sync, Canva |
| **Analytics** | **Daily snapshots from connect (I5) — non-negotiable, data lost otherwise**; three-layer metric model with provenance and comparability classes; `followers_at_post_time`; report catalogue; white-label PDFs; scheduled delivery |
| **Migration** | Platform re-fetch backfill on connect; 9 vendor CSV parsers; bulk OAuth wizard; reconciliation report; **"switch in 20 minutes" as a named, marketed flow** |
| **Inbox v1** | Meta comments + DMs with the **two-clock send-eligibility state machine**; saved replies; macros; assignment; moderation; sentiment with rationale; **per-channel SLA floor published in-product** |
| **Governance v1** | **PublishingHold composite + fail-closed label scoping + restore review queue with bulk re-slot + crisis preset (organic only)**; approvals **time-and-place first** (SLA ladders, digests, OOO delegation, interactive Slack **and Teams** apps, **decision-by-link, free reviewer seats**); audit log; SSO + SCIM + 2FA-that-coexists-with-SSO |
| **Connection health** | Read-only identity probes (**never speculative refresh**), T-14/T-3 for scheduled expiries, scope-delta detection, single-writer refresh behind a per-connection lock, batched repair links. **Not tier-gated** |
| **Reminder v1** | Mobile app: IG Stories-with-stickers, IG personal, TikTok creative layer; never-drop-the-slot semantics; confirmation loop reconciling the calendar |
| **AI v1** | Brand voice per node; node-isolated RAG with a Test tab; caption/hashtag/reply/alt-text generation with cached prefixes; **unlimited text, metered media, pre-flight cost estimate**; novelty scoring |
| **Developer** | Public REST API (self-serve, no sales gate) + **MCP server with server-side write-safety** — dry-run default, propose→confirm, scoped tokens, hard caps |
| **Compliance** | DPA, DSAR console, DSA notice-and-action, EU representative, sanctions screening, **SOC 2 Type I + Type II window started** |

**Exit criterion: an agency can run a real client on it without a spreadsheet.**

### 11.4 Phase 2 — months 6–12: the agency and multi-location wedge

| Area | Ships |
|---|---|
| **Networks** | LinkedIn org, TikTok, **X (metered, gated to paid tiers, live spend shown)**, Mastodon family via archetype C, Tumblr, Twitch, WordPress (both paths), Ghost, Dev.to, Hashnode, Vimeo, review sources (Trustpilot, App Store, Google Play) |
| **Hierarchy** | **Locked templates with editable zones enforced by a publish-time diff check**; per-level approval rules; per-location merge fields; roll-up + compliance view ("which of my 340 locations are dark"); per-profile timezone rollouts. **Sold to agencies and the 5–75 location band from one data model** |
| **Agency** | White-label incl. custom domains and branded emails; client portals; **per-client billing / reseller markup**; **offboarding as one audited revocation transaction** |
| **Inbox / Coverage** | **SLA as a managed object** with pre-breach alerts, escalation ladders and SLA-based routing; **timezone-aware handover digest**; thin duty roster; ad-comment moderation; automation rules; reviews with **review-generation campaigns** (email/SMS/QR/widget) |
| **Approvals Phase B** | Conditions and quorum with a **small closed vocabulary and templates**, not a general-purpose builder; approval records bound to content hashes and SSO identity |
| **Analytics** | Competitor analytics across ≥6 networks; benchmark panel with k-anonymity ≥20–30 and opt-out; custom/calculated metrics; **warehouse-native export** (Iceberg + dbt package + row-level export); ClickHouse behind it |
| **Listening L0/L1** | Bluesky complete, YouTube comments, Reddit, open-web crawl, Twitch chat, RSS/news; **Boolean + proximity query language**; versioned queries; hybrid enrichment; **per-source coverage class and quota meter on every result set** |
| **Autonomy** | Policy objects; decision traces; **shadow mode with published agreement rate**; replay QA seeded from the synthetic per-vertical corpus |
| **Video** | **Long-form → short-form clip extraction inside the composer** — the largest unclaimed SMB adjacency |
| **Trust** | **EU data plane live** (exercising the Phase-0 seam); audit export to SIEM; **SOC 2 Type II completes**; ISO 27001 begins; contractual **SLA with service credits**; per-tenant reliability ledger |

### 11.5 Phase 3 — months 13–24: compounding assets and global

| Area | Ships |
|---|---|
| **Agents at L3** | Triage, Responder, Composer, Watch, Repair — each promoted per tenant from shadow-mode evidence; replay QA gating every config and model change; **per-tenant exportable AI compliance report** |
| **Experiments** | Fleet-wide **creative-feature** hierarchical priors; franchise **crossover** randomised trials with a **≥30-comparable-location eligibility gate** and **MDE reported before the test runs**; exploration scheduler defeating send-time selection bias |
| **Paid** | Ad account connect, boost configs, dark posts, organic→paid rules with spend guardrails, paid-vs-organic reporting — gated on `ads_management` Advanced Access |
| **Rights** | Live-permission-to-live-spend join; whitelisting expiry alerts with 7-day lead and auto-pause-with-confirmation; override records |
| **Regional** | **LINE, VK (legal-gated), Zalo, Naver Band/Cafe, Kakao via BSP, Mercado Libre**; APAC data planes; **the MENA bundle** (RTL + Arabic counting + Arabic-native AI + Ramadan planning + Mada/local rails) |
| **Commerce & creator** | Product tagging, catalogues, UGC galleries, creator contracts — **one contact graph, one asset ledger, one codebase** |
| **Advocacy** | Curation, leaderboard with EMV, badges, Slack alerts |
| **Enterprise** | **BYOK/HYOK**; dedicated cells; archive-of-record journalling (Smarsh, Global Relay, Proofpoint, Hearsay); FINRA/SEC retention modes; residency shards; ISO 42001 |
| **GEO** | AI-answer visibility monitoring as a metered add-on, tied to publishing |

### 11.6 Deliberately deferred or declined

| Item | Decision | Reason |
|---|---|---|
| Cross-platform mention-velocity crisis triggering | Deferred until enterprise ARR | X/Reddit data pricing is **the largest single unknown in the corpus** `[12 §1833]`. Owned-channel comment/DM sentiment velocity only until then |
| Agent capacity / concurrency routing, QA scoring, case object, CRM bidirectional sync | Post-PMF / Phase 3+ | `[03 §21.3]` puts care depth at months 9–18 behind procurability; only enterprise buyers ask, and they already own it |
| Listings syndication (Yext-style) | **Declined — partner instead** | A publisher-network data licensing cost floor, not an engineering task |
| Yelp / TripAdvisor review **response** | **Impossible** | No owner OAuth, no response API. Monitoring only, stated honestly |
| Public aggregate reliability page | **Declined by default** | Only ship it if we will keep publishing it during a Meta outage |
| Manual metric capture | **Out of v1** | Near-zero sustained adoption, and it contaminates the metric-provenance differentiator |
| Firehose licensing, TikTok Research API, Meta Content Library, face recognition | **Never** | Cost, ineligibility, or legal exposure |
| T3 headless credential-replay | **Never** | Direct ToS breach on every major network; enforced by a CI fitness test |
| China | **Separate business case only** | A separate legal entity, ICP filing and stack — a different legal product wearing the same UI |
| WFM shift scheduling/forecasting, general-purpose workflow builder, own SAML/SCIM implementation, own transcoding beyond ffmpeg | Not built | Buy or skip |

### 11.7 Team shape

Six to eight people through Phase 1: two on the publishing/adapter spine, one on data/analytics, one on web, one on mobile + assisted-publish, one on infra/security, one product engineer across inbox and governance, plus one owner for the platform-application portfolio. **Adding people to the approval workstream does not make it faster; adding them to the adapter workstream does**, because archetypes parallelise cleanly once the base classes exist.

---

## 12. Risk Register — top 15

L = likelihood, I = impact, both 1–5. Ordered by **expected loss (L×I)**, not by likelihood.

| # | Risk | L | I | L×I | Mitigation |
|---|---|---|---|---|---|
| **R1** | **Platform approval denied or delayed, blocking a whole module.** LinkedIn "may never answer"; TikTok audits *our UI*; Meta needs a screencast of a complete flow | 4 | 5 | **20** | File all on day 1 with a named owner and a rejection-loop budget of 1–2 cycles. Sequence networks by gate cost so free-and-instant ones produce the live product later applications require as evidence. Ship on Ayrshare/Upload-Post white-label as **scaffolding, not foundation**, with the adapter seam built in from day one so swapping to a direct integration is a one-adapter change |
| **R2** | **X per-post pricing ($0.015/post, $0.20 with a link; $0.005/read, 2M read cap) invalidates the pricing table** | 3 | 5 | **15** | **The plan already routes around it**: X is a metered pass-through add-on with live in-product spend, never bundled into flat volume allowances. Verify first in §13. Offer BYO-keys as the default posture |
| **R3** | **Meta app suspension or a failed annual Data Protection Assessment revokes permissions app-wide, killing every connection at once** | 2 | 5 | **10** | Treat the DPA as a calendared recurring obligation with an owner. Blast-radius containment; `appsecret_proof` on all calls; a documented incident playbook; BYO-app credential kind (`byo_app`) available from the first commit so large tenants can run on their own app ID |
| **R4** | **Duplicate-post bug reaches production.** The single most reputationally damaging failure in the category — the customer's audience sees it | 3 | 5 | **15** | Idempotency keys from `(target, content_hash)`; claim-before-call; **uncertain outcomes route to `VERIFY_PENDING` and are resolved by asking the network, never by blind retry**; authenticated read-back at +1m/+10m/+1h/+24h |
| **R5** | **The market copies the visible differentiators within a quarter** — holds, connection health, repair links, restore queue are each 2–4 engineer-weeks | 4 | 3 | **12** | Accept it. Budget **12 months of lead, not a moat**. Concentrate the differentiation budget on the three things that are architectural (Action Gate, provenance, hierarchy) or compounding (failure corpus, benchmark panel, decision traces) |
| **R6** | **SOCi / Rallio / Birdeye / Chatmeter already own the multi-location segment** and the corpus never checked — SOCi has zero mentions across twelve dossiers | 4 | 3 | **12** | **Blocking search pass before any hierarchy roadmap commitment** (§13 Q1). Fall back to the agency framing, which is the same data model with a warmer buyer |
| **R7** | **SMB churn floors around 3.5–4%/mo regardless of product quality** — 30–40% is unaddressable | 5 | 2 | **10** | Mix-shift to agency (1.5–3%/mo) and expansion revenue. Do not build a plan that depends on SMB churn reduction |
| **R8** | **Warehouse-native export surrenders the strongest switching cost in the category** | 3 | 3 | **9** | Resolved deliberately: **give away the raw data, keep the derived intelligence.** The benchmark panel, models, alerting and workflow do not export |
| **R9** | **A platform breaking change lands with no notice** — Meta ~2yr Graph deprecation, LinkedIn 12-month version window, metric renames | 5 | 2 | **10** | Version pinning per adapter; an owned deprecation calendar with dates; capability descriptors as data so a limit change is a config deploy; canaries and drift detection; **metric-definition-change annotations turn the incident into a trust feature** |
| **R10** | **Listening coverage claims are tested in a bake-off and we look thin** against Talkwalker's 150M sources | 4 | 2 | **8** | Conspicuous honesty: per-source coverage class and live quota meter on every result set. Own the $1k–$16k desert with explicitly scoped coverage. Never claim omniscience |
| **R11** | **Free tier and link-in-bio abuse** — spam, phishing pages, CSAM exposure, DSA obligations | 3 | 3 | **9** | Abuse controls at signup; tenant-branded pages under tenant domains; notice-and-action from day one; sanctions geo-block; content scanning on public surfaces |
| **R12** | **Agency segment does not adopt because reviewer seats or decision-by-link are missing at launch** | 2 | 4 | **8** | Both are Phase 1, both are hard requirements, and `seat_class` is a schema column from the first commit |
| **R13** | **Regional adapter rot** — regional APIs break more often and announce it less, in languages the team may not read | 4 | 2 | **8** | Build only where a dedicated maintainer is funded; contract tests + canaries per adapter; staleness budgets on capability descriptors; record R5 "do not build" decisions with a date so they are not re-litigated quarterly |
| **R14** | **AI cost overrun** — premium video or high GEO frequency inverts the margin ($210/brand/mo at premium video vs $99 price) | 3 | 3 | **9** | Video tier and GEO frequency are **explicit plan dimensions**, never buried in a credit pool. Hard budget caps per workspace with alerts; routing policy is the margin |
| **R15** | **A shipped AI feature triggers an AI Act Art. 50 or FINRA exposure** — fines to €15M or 3% of turnover | 2 | 4 | **8** | Disclosure surfaces and approval records ship Phase 1 (already in force since 2 Aug 2026); approval records bound to content-version hash and SSO-attested identity; archive journalling to the customer's existing system of record rather than replacing it |

---

## 13. Open Questions Requiring a Human Decision

### 13.1 Blocking — nothing downstream is safe until these clear

| # | Question | Why it blocks | How to resolve |
|---|---|---|---|
| **Q1** | **Does SOCi / Rallio / Birdeye Social / Chatmeter / Uberall already own multi-location social at our target price?** SOCi has **zero mentions across all twelve dossiers** | Every conclusion in `[03 §2.2]` and the entire D6 thesis inherits this hole | A search-and-trial pass on all thirteen named vendors. **Blocking on the hierarchy roadmap** |
| **Q2** | **X API 2026 pricing** — is it $0.015/post, $0.20 for link-posts, $0.005/read with a 2M cap? | At 100k link-posts/mo this is **$20k/mo of COGS** and could invalidate any flat-volume tier that includes X | `docs.x.com` / developer portal. **Ranked #1 in the corpus's own worklist** |
| **Q3** | **Vista Social's live pricing, plan limits and AI credit allowances** — the audit could not render the pricing page and two mutually exclusive credit tables are in circulation | Every competitive price comparison in §9.3 | A human opens `vistasocial.com/pricing`, `support.vistasocial.com`, `apidocs.vistasocial.com` |
| **Q4** | **Is the "Vista has no pause switch" finding real?** `[02 §1329]`'s competitor matrix row is **unverified** and `04` contains zero mentions of "pause" | The crisis-hold positioning dies in a bake-off if it is wrong | Trial accounts on Vista, Buffer, Sprout, Agorapulse, SocialBee. **Also test bulk move-to-draft** — if competitors have it, the "bulk delete destroys the queue" pain narrative is overstated |
| **Q5** | **Do Zendesk / Front / Gorgias / Intercom social-channel SLA features already kill the coverage wedge?** | Named by the verifier as **the single highest-risk unverified assumption** in the coverage analysis | Trial each; test SLA config per social channel |
| **Q6** | **Can Statusbrew's rules engine already express an escalation ladder** ("if unassigned > 2h then reassign and notify")? | If yes, D9 item 1 narrows from a capability gap to a UX/reporting gap | Trial Statusbrew |

### 13.2 Commercial decisions only a human can make

| # | Decision | The trade |
|---|---|---|
| **Q7** | **Open-core or closed?** The MIT-and-complete quadrant is empty; Postiz holds 34.5k stars hostage with AGPL | Buys GitHub SEO, developer trust and community-contributed adapters, and seeds an "approval-as-a-service" business. Costs: cannibalisation, and a support surface we do not control |
| **Q8** | **Is the entry tier $19 or is there no entry tier at all?** | $19 enters the most crowded band in the market. The alternative — free → $59 Pro — concentrates on the segments with real ACV and avoids a price war, at the cost of a wider free-to-paid gap |
| **Q9** | **Agency-first or franchise-first for the hierarchy product?** Same data model, different GTM | Agency is warmer, self-serve-reachable and already in pain. Franchise has higher ACV and slower, stickier procurement — but requires channel relationships we do not have |
| **Q10** | **Do we take the X dependency at all in year one?** | Including it costs metered COGS and a pricing-model risk (Q2). Excluding it is a visible hole in every comparison table |
| **Q11** | **Merchant of record permanently, or migrate to direct?** ~5% of revenue vs 40 tax registrations | MoR is the right first-global-launch call and is unwindable market by market. Decide the revenue threshold that triggers migration |
| **Q12** | **What is the published Enterprise floor?** §9.2 proposes $2,500/mo | Publishing it is a differentiator in a category where Meltwater has no public tiers at all. It also caps upside on large deals and invites anchoring |

### 13.3 Legal and compliance decisions requiring qualified counsel

| # | Question |
|---|---|
| **Q13** | **VK and Odnoklassniki — sanctions exposure.** Technically the best regional API in the corpus; legally a question for counsel, not engineering. Also confirm OFAC/EU/UK designations for Russia services-export prohibitions |
| **Q14** | **Does a public link-in-bio and a public UGC gallery convert us to an "online platform" under the DSA?** `[11 §6.1]` says plausibly yes. This is a product-scope decision, not a growth decision |
| **Q15** | **EU–US DPF status** — in force? litigation outcome? Commission review? Determines whether SCCs are primary or secondary, and how urgent the EU plane is |
| **Q16** | **Platform retention limits we could not verify** — LinkedIn API caching/retention (reputed strictest), YouTube's ~30-day stored-data refresh rule, TikTok and Pinterest caching limits. **These size and shape the analytics store and must clear before the warehouse layer is built** |
| **Q17** | **Does TikTok `tt_video/authorize` actually return an expiry timestamp?** Corpus item V6 is UNVERIFIED and a GitHub search found no code evidence. If it does not, we are storing a **creator-asserted duration** and must label it as such |
| **Q18** | **Meta cancellation semantics** — does cancelling a `scheduled_publish_time` post reliably succeed, and what does partial failure look like? The hold feature is **actively dangerous** without this |

### 13.4 The verification backlog, by blast radius

Nothing below may appear in a deck, a price, or a contract until verified. Ordered by damage a wrong value does.

1. X API pricing regime (Q2) — invalidates the pricing table
2. SOCi/Rallio/Birdeye competitive position (Q1) — invalidates D6
3. Vista live pricing and limits (Q3) — invalidates every price comparison
4. The 10–15% publishing-reliability churn figure — **re-verify with real win/loss and cancellation interviews before it becomes load-bearing in any deck**
5. Helpdesk social-SLA parity (Q5) — invalidates D9
6. Competitor pause / bulk-move-to-draft (Q4) — invalidates D8's narrative
7. Meta hold cancellation semantics (Q18) — a correctness bug, not a positioning one
8. Platform retention limits (Q16) — sizes the analytics store
9. Sprout $199/$299/$399 and Hootsuite $19/$49/$99 (the latter looks stale, resembling pre-2022 pricing) — anchors §9.3
10. Threads keyword-search availability and cost — if free and commercial, Threads is the cheapest brand-mention source on any large network
11. Reddit commercial rate ($0.24/1,000 calls) and contract terms — determines whether Reddit listening is in scope
12. TikTok 365-day refresh-token semantics — fixed window or reset-on-refresh? Determines annual forced re-auth
13. Bluesky Jetstream hostnames and parameters — a P0 build item
14. Instagram `business_discovery` fields and rate limits — the competitor-intelligence primitive
15. AppSumo revenue share and refund rate — only if Q-anything reopens the LTD question

---

## Appendix — the one-paragraph version

Multi-network scheduling is free — Postiz gives 34 providers away under AGPL. The three scarce assets are the platform-approval portfolio (calendar-time, 6–16 weeks per network), the accumulated failure corpus (compounds with volume, unreadable from documentation), and a governance substrate that cannot be retrofitted onto shipped agent surfaces. We build all three from week one, match Vista Social's 75-row parity checklist in full, and beat it on the underbelly it cannot fix without a rewrite: per-profile timezones and permissions, metric provenance, authenticated publish verification, self-serve SSO/SCIM/audit/residency, hierarchy-native org structure, and server-side write-safety for the agents that are about to become the primary way software touches a brand account. We price on scope and volume with unlimited seats and free reviewer seats — which negates the seat tax, the double-dimension compounding that costs agencies $25–40k/yr, and the credit opacity that is the category's live source of churn. We acquire through a free link-in-bio product that needs no OAuth and ships while every platform application is pending, through a migration engine that re-fetches three years of history from the platforms rather than begging the incumbent for it, and through a Canva app that meets the user at the exact moment their intent is our product. And we publish an honest capability matrix listing twenty-five things we cannot do and why — because in a category whose coverage claims are systematically dishonest, an admitted blind spot is the cheapest differentiation available.

---

*End of master strategy. Sources: dossiers `01`–`12` and blueprints `a`/`b`/`c` in this directory. Every load-bearing claim carries an inline citation; §13.4 is the list of things that are not yet facts.*
