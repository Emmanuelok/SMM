# Enterprise Tier of Social Media Management — Full Competitive Map

**Prepared:** 12 August 2026
**Scope:** Sprout Social, Hootsuite, Sprinklr, Emplifi, Brandwatch (+Falcon.io), Khoros, Meltwater, Talkwalker, Later (+Mavrck), Dash Social, Salesforce Social Studio, Adobe, HubSpot, Zoho Social
**Purpose:** Define the enterprise capability surface we must match, identify what is genuinely hard vs. merely gated, and locate the gaps nobody serves.
**Companion doc:** `01-vista-social-full-audit.md` (mid-market benchmark). Every "what they do that Vista does NOT" claim below is stated against that document.

---

## 0. READ THIS FIRST — Methodology and Source-Quality Warning

### 0.1 Hard environmental constraint

This research environment's egress proxy returns **HTTP 403 on CONNECT for effectively every external host**. Confirmed blocked during this session:

| Host class | Examples confirmed blocked |
|---|---|
| Vendor marketing sites | `sproutsocial.com`, `www.hootsuite.com`, `www.sprinklr.com`, `www.brandwatch.com`, `emplifi.io`, `khoros.com`, `www.dashsocial.com` |
| Vendor support/help centres | `support.sproutsocial.com`, `blog.hootsuite.com` |
| Vendor developer portals | `dev.sprinklr.com`, `api.sproutsocial.com`, `developers.brandwatch.com` |
| Vendor asset CDNs | `media.sproutsocial.com` (the Sprout plan-details PDF) |
| Review/procurement aggregators | `www.g2.com`, `www.capterra.com`, `www.vendr.com` |
| Trade press | `www.cmswire.com`, `research.com`, `socialrails.com` |
| Archives | `web.archive.org` |

**Consequence:** no page was rendered directly. All externally-sourced facts below come from **search-engine retrieval and summarisation of the target pages** (which does surface substantial verbatim first-party content), supplemented by model knowledge with a **May 2026 cutoff**.

A **hard 200-call WebSearch budget was exhausted mid-research** (shared across the session). Approximately 20 distinct enterprise-tier searches completed before exhaustion. Topics that were queued but never executed are listed in §20 as an explicit verification backlog.

### 0.2 Confidence tiers used throughout

Every non-obvious claim carries a tag:

| Tag | Meaning |
|---|---|
| **[S]** | **Search-verified this session (Aug 2026).** Retrieved from a live 2026 page via search summarisation. Highest confidence in this document. |
| **[S-conflict]** | Search-verified but **sources disagree**. Both figures shown. |
| **[K]** | **Model knowledge, cutoff May 2026.** Likely correct but 3+ months stale and not re-verified. Re-check before commercial use. |
| **[K-stale]** | Model knowledge that is **known to be from 2023–2024** and probably superseded. Directional only. |
| **UNVERIFIED** | Genuinely unknown. Not a guess. Do not cite. |

**Pricing figures deserve special scepticism.** Enterprise SMM pricing is deliberately opaque; third-party "pricing" blogs copy each other and go stale within two quarters. Where a number reconciles arithmetically (e.g. annual = monthly × 12 × discount), that is noted as corroboration.

### 0.3 How to read this document

- §1–§2 are the strategic payload. Read them first.
- §3–§16 are vendor dossiers. Each follows an identical template so they can be diffed.
- §17–§19 are cross-cutting analyses (data licensing, compliance, procurement) — these apply to **us** as much as to them.
- §20 is the verification backlog: exactly what a human must confirm before anything here drives a pricing or roadmap decision.

---

## 1. Executive Summary

### 1.1 The market has four distinct enterprise archetypes

The word "enterprise" hides four incompatible product philosophies. Buyers choose an archetype first, a vendor second.

| Archetype | Vendors | Core thesis | Typical ACV | Buyer |
|---|---|---|---|---|
| **A. Unified CXM platform** | Sprinklr, Khoros | Social is one channel inside an omnichannel customer-experience operating system. Care, voice, community, marketing, listening are one data model. | $50k–$1M+ [S] | CX / Contact-centre exec + CIO |
| **B. Social-first suite** | Sprout Social, Hootsuite, Emplifi, Brandwatch/Falcon | Social is the product. Publishing + inbox + listening + analytics, with enterprise governance bolted on. | $15k–$200k [S] | CMO / Head of Social |
| **C. Intelligence-first** | Meltwater, Talkwalker, Brandwatch Consumer Research | The value is the *data corpus* — listening, media monitoring, consumer research. Publishing is secondary or absent. | $16k–$150k+ [S] | Insights / Comms / PR |
| **D. Vertical/creative specialist** | Dash Social, Later+Mavrck | Deep in one dimension (visual/creative intelligence; creator & influencer economy) with adequate SMM around it. | $6k–$100k [S] | Brand / Creator marketing |

**Plus two "absent giants":** Salesforce and Adobe both **exited** owned social media management and now partner (Salesforce → Sprout Social; Adobe → GenStudio social publishing + partner). Their absence created the enterprise vacuum that Sprinklr and Sprout have been filling since 2024. [S]

### 1.2 The nine things that actually define "enterprise" (and cost money)

Stripping the marketing away, enterprise buyers pay for exactly nine things. Everything else is table stakes that mid-market tools already ship.

1. **Identity lifecycle** — SAML SSO *and* SCIM 2.0 provisioning/deprovisioning, IdP group→role mapping, enforced MFA. (Note: **Sprout Social does not ship SCIM on any plan** [S] — a genuine, exploitable weakness in a market leader.)
2. **Governance that survives 500 users** — RBAC at object granularity, conditional approval routing, content policy enforcement at compose time, publishing locks.
3. **Immutable auditability** — 50+ event types, exportable, retained, legal-hold-capable.
4. **Regulated-industry archiving** — Smarsh / Proofpoint / Global Relay / Theta Lake capture connectors for FINRA 2210, SEC 17a-4, MiFID II.
5. **Data residency & sovereignty** — EU/UK/CA/AU/APAC hosting, DPAs, sub-processor transparency, and now **region-pinned AI inference**.
6. **Licensed listening data at firehose grade** — the single largest hard cost in the category post-2023. X Enterprise access alone starts ~**$42,000/month** [S].
7. **Contact-centre-grade care** — routing, queues, agent capacity, SLA policies with breach escalation, QA scoring, WFM, secure PII collection, CRM case sync.
8. **CRM/CDP identity resolution** — social handle → known customer, bidirectionally, with case objects.
9. **Procurement survivability** — SOC 2 Type II, pen-test summaries, VPAT/Section 508, FedRAMP (Sprinklr only), cyber insurance, MSA/DPA redlines, Ariba/Coupa, multi-year price protection, named CSM with QBRs.

### 1.3 The 2025–2026 AI inflection: everyone shipped an agent, nobody shipped autonomy

Every major vendor named and shipped a branded agentic layer within a 14-month window:

| Vendor | Agent brand | Announced | Status Aug 2026 |
|---|---|---|---|
| Sprout Social | **Trellis** + **Trellis Studio** | 13 May 2026 [S] | GA to all customers July 2026 [S] |
| Hootsuite | **Wisdom** (+ **Social OS**: Perch/Nest/Lumen/Parliament) | 24 Jun 2026 [S] | Live worldwide [S] |
| Sprinklr | **AI+ Studio**, **AI Agent Studio** (ex-Digital Twin Studio), **Autonomous Evaluation** | Spring '26 (26.4, from 27 Mar 2026) + Summer '26 (15 Jul 2026) [S] | Shipping; MCP in Beta [S] |
| Emplifi | **AI Composer**, **AI Query Copilot**, "Autonomous Customer Experience" positioning | 2023→2026 [S] | Shipping [S] |
| Meltwater | **GenAI Lens** (AI-answer visibility tracking) | 2025–26 [S] | Shipping [S] |
| Talkwalker/Hootsuite | **Blue Silk AI**, **Blue Silk GPT** | 2023→ [S] | Now powers Hootsuite **Lumen** [S] |
| HubSpot | **Breeze** agents incl. Social Agent | 2025 [K] | Shipping [K] |
| Brandwatch | **Iris** AI analyst | 2023→ [K] | Shipping [K] |

**Three structural observations:**

- **MCP became the enterprise integration standard in 2026.** Hootsuite shipped MCP connectors across Perch, Nest and Lumen exposing social intelligence into Claude, ChatGPT, Gemini and Copilot [S]. Sprinklr shipped **Sprinklr MCP (Beta)** for Microsoft Copilot / ChatGPT / Claude [S]. Vista Social already ships an MCP server with ~60 tools — **Vista is not behind here, and this is one of the very few places where a mid-market tool reached parity with enterprise before the enterprise did.**
- **"Agentic" mostly means workflow builder + copilot, not autonomy.** Trellis Studio is "bespoke AI workflows" and "pre-built recurring conversation starters (Skills)" [S]. Sprinklr's AI+ Studio is a "no-code workspace to build, manage and scale GenAI agents and workflows" [S]. These are orchestration surfaces, not autonomous operators.
- **Sprinklr is alone in building the *trust* layer.** Spring '26 shipped **Autonomous Evaluation** — "clear, explainable logs and test-backed validation so teams can understand, trust and continuously refine agent behaviour" — and Summer '26 added **Agent Quality Assurance** with "testing, simulation and quality scoring to validate AI agent behaviour *before* deployment" [S]. **This is the correct enterprise answer and it is the thing everyone else is missing.** It is also the single most copyable idea in this document.

### 1.4 The pricing reality (real numbers, not "contact sales")

Consolidated from search-verified 2026 data. See §18 for the full table and caveats.

| Vendor | Entry enterprise-grade list | Realistic annual contract |
|---|---|---|
| Sprout Social | $199/seat/mo annual (Standard) → $399/seat/mo (Advanced); Enterprise custom [S] | ~$25k–$120k; Tagger/Influencer avg **$21,431/yr** [S] |
| Hootsuite | $99 → $199 → $399/seat/mo; Enterprise custom, **min 5 seats** [S] | Vendr median **$12k/yr** across 96 deals [S]; SpendHound Enterprise avg **$155,813** [S-conflict] |
| Sprinklr | **$2,800–$4,700 per user per year**; Advanced Enterprise **$4,700/user/yr** [S] | Contracts start **~$50k**; median ACV **~$129,380** [S] |
| Brandwatch | Essentials **$108/mo**; enterprise $800–$1,500/mo @1 user → **$80k–$150k/yr @100 users** [S] | Legacy Falcon entry **$1,000/mo**, tier 2 **$1,750/mo (~$21k/yr)** [S] |
| Meltwater | No public tiers, no monthly, no self-serve [S] | **$16k–$70k/yr**, median **~$25k**; range to **$150k+**; Klear adds **$10k–$25k/yr** [S] |
| Khoros | No public pricing [S] | **$10k–$50k+/yr**; Care priced **per agent seat** [S] |
| Emplifi | Essential from **~$200/mo** [S-conflict] | **$1,000–$3,000+/mo** custom [S] |
| Dash Social | **Grow $499 / Engage $999 / Advance $1,999 / Enterprise $2,999+ per month** — **unlimited users on all plans** [S] | ~$6k–$42k+/yr [S] |
| HubSpot | Marketing Hub Pro **$800/mo** (social included); Enterprise **$3,600/mo** (5 seats, +$75/seat) [S] | + one-time onboarding £3,000 Pro / £7,000 Ent [S] |
| Zoho Social | Standard $15 / Professional $40 / Premium $65 / Agency $275–320 / Agency Plus $400–460 per month; Enterprise custom [S-conflict] | Priced **per brand, not per user** [S] |
| Later / Later Influence | No published rates, sales-led, no self-serve for Influence [S] | UNVERIFIED; historically $30k–$100k for Influence [K] |
| Talkwalker | Core / Analyze / Business — **no figures published** [S] | UNVERIFIED |
| Salesforce Social Studio | **Retired 18 Nov 2024** [S] | N/A |
| Adobe Social | **Deprecated 30 Jan 2020** [S] | N/A |

**The single most important pricing fact in this table:** *Dash Social gives unlimited users on every plan* [S]. In a market where Sprout charges $399/seat/month and Sprinklr charges up to $4,700/user/year, per-seat pricing is the category's most-hated attribute and the most obvious wedge.

### 1.5 Strategic conclusion for a self-serve challenger

**The enterprise moat is not features. It is three things, in this order:**

1. **Procurement survivability** (SOC 2 Type II, SCIM, audit export, residency, VPAT, DPA). This is *engineering and paperwork*, not product. It is bounded, achievable, and it is the thing that actually gates the deal. A mid-market tool that ships it self-serve — no sales call to turn on SSO — has an unmatched position, because **not one vendor in this document lets you buy identity and governance without a sales cycle.**
2. **Licensed listening data.** This is the one genuinely expensive moat. X Enterprise from ~$42k/month [S], Reddit commercial API at $0.24/1,000 calls plus negotiated licensing [S], TikTok Research API now **closed to all commercial users** [S]. A challenger cannot buy its way to Talkwalker's corpus. The answer is not to try — it is to be excellent on *owned + first-party + partner-API* data and honest about the boundary.
3. **Care at contact-centre grade.** Routing, capacity, SLA breach escalation, QA scoring, CRM case sync. This is real engineering, ~2–4 quarters, and it is what separates "social inbox" from "social customer service."

**Everything else that enterprise vendors charge for is gating, not building.**

---

## 2. The Enterprise Capability Stack — What Buyers Get That Mid-Market Lacks

This section is the specification. Each row states the capability, who has it, how hard it genuinely is to build, and whether it is a *moat* or merely *gated*.

### 2.1 Identity, access and lifecycle

| Capability | Who ships it | Vista Social today | Build difficulty | Moat or gate? |
|---|---|---|---|---|
| SAML 2.0 SSO | Sprout (Enterprise) [S], Hootsuite (Ent) [K], Sprinklr [K], Khoros [K], Brandwatch [K], Emplifi [K], Dash Social ("custom SSO", Enterprise tier) [S], Meltwater [K], Zoho [K] | **No** (per audit §25) | Low (2–4 wks with a library) | **Gate** |
| OIDC SSO | Sprinklr [K], Khoros [K] | No | Low | Gate |
| **SCIM 2.0 provisioning/deprovisioning** | Sprinklr [K], Khoros [K], Brandwatch [K]. **Sprout Social: NO SCIM on any plan** [S] — SAML + JIT only, which creates accounts on first login but never deprovisions [S] | No | Medium (4–8 wks) | **Gate — and a live competitive weakness at Sprout** |
| IdP group → role mapping | Sprinklr [K], Khoros [K] | No | Medium | Gate |
| Enforced org-wide MFA | Sprout [K], Hootsuite [K], Sprinklr [K] | Partial | Low | Gate |
| IP allowlisting / session policy | Sprinklr [K], Khoros [K] | No | Low–Med | Gate |
| Delegated admin (admin scoped to a business unit) | Sprinklr (Partitions) [K], Khoros [K], Hootsuite (Organizations/Teams) [K] | Partial (Profile Group Admin) | Medium | Gate |
| Just-in-time / time-boxed elevated access | Sprinklr [K] | No | Medium | Gate |

**Read:** identity is 100% gate, 0% moat. It is the highest-ROI enterprise investment available and the deals it unblocks are disproportionate to the effort. **Sprout Social's missing SCIM is the clearest single competitive opening in the entire enterprise tier.**

### 2.2 Multi-tenancy and organisational scale

| Capability | Who ships it | Vista Social today | Difficulty | Moat/gate |
|---|---|---|---|---|
| Hard partitions / workspaces with data isolation | Sprinklr (**Partitions**) [K], Khoros [K], Brandwatch [K], Emplifi [K] | Profile Groups (soft) | High | **Moat-ish** (data model surgery) |
| 1,000+ connected profiles in one tenant | Sprinklr [K], Hootsuite Enterprise (unlimited accounts on Advanced) [S], Sprout (unlimited profiles on Professional+) [S] | Enterprise tier "unlimited" claimed | Medium (mostly perf) | Gate |
| Org hierarchy (global → region → market → location) | Sprinklr **Distributed** [K], Hootsuite [K], Emplifi [K] | No | High | **Moat** |
| Local/franchise publishing with brand-locked templates | Sprinklr Distributed [K] | No | High | **Moat** |
| Cross-workspace roll-up reporting | Sprinklr [K], Brandwatch [K], Emplifi [K] | Limited | High | Moat |
| Per-BU billing / chargeback | Sprinklr [K] | Per-client billing exists (agency) | Medium | Gate |

**Read:** the multi-location / franchise / distributed-brand segment is where genuine architectural difficulty lives, and it is the segment Vista Social's 2026 marketing (`signals.vistasocial.com`) is already aiming at without the architecture to serve. Sprinklr Distributed is the reference implementation.

### 2.3 Governance, approvals and content policy

| Capability | Who ships it | Vista Social today | Difficulty | Moat/gate |
|---|---|---|---|---|
| Multi-step approval | All enterprise vendors [K] | Yes (linear only, per audit §13.1) | Low | Gate |
| **Conditional approval routing** (route by network / spend / keyword / risk score / market) | Sprinklr (Rule Engine) [K], Khoros [K], Hootsuite Enterprise [K] | **No** | Medium | **Gate — high buyer salience** |
| Mandatory legal/compliance reviewer step | Sprinklr [K], Khoros [K], Hootsuite+Proofpoint [S] | No | Low–Med | Gate |
| **Compose-time content policy engine** (banned words, regex, claims, disclaimers, mandatory hashtags/disclosures) | Sprinklr [K], Hootsuite via **Proofpoint real-time compliance checks in Composer** [S] | No | Medium | Gate |
| Publishing lock / freeze windows (crisis, earnings quiet period) | Sprinklr [K], Khoros [K] | No | Low | Gate |
| Asset rights management with expiry enforced at publish | Emplifi (Pixlee lineage) [K], Later Influence [K] | No | Medium | Gate |
| Brand-safety scoring on AI-generated content | Sprinklr [K] | No | Medium | Gate |
| Approval SLA + escalation | Sprinklr [K] | No | Low | Gate |

**Read:** almost all gate. The one that repeatedly closes regulated deals is the **compose-time policy engine** — Hootsuite explicitly sells it as the Proofpoint add-on that "ensures AI-generated posts still go through proper compliance review before publishing" [S].

### 2.4 Auditability, archiving and legal

| Capability | Who ships it | Vista Social today | Difficulty | Moat/gate |
|---|---|---|---|---|
| Audit trail, 50+ event types | **Sprout ("over fifty different events and actions are logged")** [S], Sprinklr [K], Khoros [K] | Unknown/limited | Low–Med | Gate |
| Audit log **export** (CSV/API/SIEM: Splunk, Sentinel) | Sprinklr [K], Khoros [K] | No | Medium | Gate |
| Configurable retention + deletion policy | Sprinklr [K], Khoros [K] | No | Medium | Gate |
| Legal hold / eDiscovery export | Sprinklr [K], Khoros [K] | No | High | Moat-ish |
| **Smarsh capture connector** | **Hootsuite (formal partnership)** [S] | No | Medium (partner integration) | **Gate** |
| **Proofpoint integration** | **Hootsuite Enterprise add-on, real-time checks in Composer; Amplify natively connects Proofpoint Threat Response** [S] | No | Medium | **Gate** |
| Global Relay / Theta Lake / Veritas Merge1 | Various [K] | No | Medium | Gate |
| "Right to be forgotten" execution across channels | Claimed as a 2026 enterprise requirement [S] | No | Medium | Gate |

**Read:** archiving is entirely a *partner integration* problem, not a build problem. **Nobody in this market ships native WORM-compliant archiving + eDiscovery** — see §2.10 gap list.

### 2.5 Data residency and sovereignty

| Capability | Who ships it | Vista Social today | Difficulty | Moat/gate |
|---|---|---|---|---|
| US hosting | All | Yes | — | — |
| EU hosting option | Sprinklr [K], Brandwatch [K], Emplifi [K], Zoho (multi-DC: US/EU/IN/AU/JP/CA/CN/SA) [K] | No | High (infra) | **Moat-ish** |
| UK / Canada / Australia / Japan / India / Middle East | Sprinklr [K], Zoho [K] | No | High | Moat |
| **FedRAMP** | **Sprinklr only — Authorized at LI-SaaS, Oct 2022, on AWS** [S] | No | Very high | **Moat** |
| Region-pinned AI inference (no cross-border model calls) | Sprinklr [K] | No | Medium–High | **Emerging gate, rising fast** |
| Sub-processor list incl. AI model vendors | Required in 2026 AI-governance reviews [S] | Unknown | Low (paperwork) | Gate |
| Contractual "no training on customer data" | Increasingly demanded [S] | Unknown | Low (paperwork) | Gate |

**Note on FedRAMP terminology:** under 2026 consolidated rules, "FedRAMP Authorized" is becoming "**FedRAMP Certified**" and the "FedRAMP Ready" designation is being **retired** [S]. Sprinklr's authorisation is **Low Impact (LI-SaaS)** — not Moderate — which matters: LI-SaaS limits it to low-impact public-facing workloads. [S]

### 2.6 Listening depth and data sources — the real moat

| Source | Access reality in 2026 | Who has it |
|---|---|---|
| **X / Twitter full firehose** | v1.1 PowerTrack, Decahose and Enterprise Search were **end-of-lifed** in the v1.1 retirement (2023–24). The successor is **"X Enterprise"** (v2 Filtered Stream Pro/Enterprise or fully custom data contracts), entry **~$42,000–$50,000 per month** [S] | Talkwalker ("unsampled data access, e.g. X/Twitter Firehose") [S], Sprinklr [K], Brandwatch [K], Meltwater [K] |
| **Reddit** | Commercial Data API **$0.24 per 1,000 calls**, contract manually reviewed by Reddit. Top tier (AI training) is a privately negotiated contract — the Google deal is reportedly **~$60M/year** [S] | Brandwatch, Talkwalker, Meltwater, Sprinklr described as the leading 2026 listening platforms [S]; **per-vendor Reddit licence status UNVERIFIED** |
| **TikTok Research API** | **Closed to all commercial users.** Eligibility now restricted to verified academic institutions in US/EEA/UK/Switzerland, EU-registered non-profits, and Brazilian academic/non-profit researchers on youth safety. Commercial users, creators and advertisers **explicitly ineligible**. Vendors that were using Research API credentials for commercial discovery **must migrate to commercial endpoints or licensed third-party data providers or lose access entirely** [S] | Nobody, commercially. Everyone uses Display API / Content Posting API / Commercial Content (ads transparency) API or licensed resellers |
| **Meta** | CrowdTangle shut down 14 Aug 2024, replaced by **Meta Content Library** (approved researchers only) [K]. Commercial vendors use Instagram Graph API (Business/Creator accounts only), Pages API, and IG Content Publishing API (**25 posts / 24h / IG account** [K]) | All, equally constrained |
| **LinkedIn** | Marketing Developer Platform + Community Management API, **partner-gated**. No listening surface. [K] | Approved partners only |
| **YouTube** | Data API v3, default **10,000 quota units/day** [K] | All |
| News / blogs / forums / reviews | Commercially licensed aggregation | Talkwalker (**~150M websites, 30+ social channels**) [S]; Hootsuite Wisdom claims **150M+ monitored data sources** and 15+ years of proprietary social data [S]; Brandwatch **100M+ online sources** [S] |
| Broadcast / TV / podcast | Talkwalker (Nielsen Social Content Ratings lineage) [K], Meltwater [K] | Intelligence-first vendors only |
| Image/logo/video recognition | Talkwalker [S], Dash Social **Vision AI** [S], Sprinklr **ViralMoment** (acquired; frame-by-frame video/audio/image/text analysis) [S] | Specialists |

**This is the one place a self-serve challenger genuinely cannot compete head-on.** The correct posture is honesty plus a differentiated angle (see §19.3).

### 2.7 Care / ticketing depth

| Capability | Sprinklr | Khoros | Sprout | Hootsuite | Emplifi | Vista Social |
|---|---|---|---|---|---|---|
| Unified inbox | ✅ | ✅ | ✅ Smart Inbox [S] | ✅ Nest [S] | ✅ | ✅ |
| True **case object** (not just a message) | ✅ (Case is a first-class API object) [S] | ✅ | Via CRM integration [S] | Via Salesforce [S] | ✅ (Astute lineage) [K] | ❌ |
| Skills-based routing + queues | ✅ [K] | ✅ [K] | Rules only [K] | Rules only [K] | ✅ [K] | ❌ |
| Agent capacity / concurrency limits | ✅ [K] | ✅ [K] | ❌ | ❌ | ✅ [K] | ❌ |
| SLA policy + breach escalation | ✅ [K] | ✅ [K] | Partial [K] | Partial [K] | ✅ [K] | Response-time mgmt only |
| QA scoring / conversation review | ✅ **Agent QA with testing, simulation, quality scoring** (Summer '26) [S] | ✅ [K] | ❌ | ❌ | ✅ [K] | ❌ |
| Workforce management (forecast/schedule) | ✅ [K] | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voice / CCaaS | ✅ **Sprinklr Voice**, next-gen **Voice AI agents, sub-second response, turn-taking, noise handling** (Summer '26) [S] | Partial [K] | ❌ | ❌ | ✅ (Astute) [K] | ❌ |
| Secure PII collection in DMs | ✅ [K] | ✅ [K] | ❌ | ❌ | ✅ [K] | ❌ |
| Knowledge base / owned community | Knowledge base [K] | ✅ **Khoros Communities (Aurora)** — the category's only real owned-community product [K] | ❌ | ❌ | ❌ | ❌ |
| CSAT / NPS in-channel | ✅ + **voice surveys** (Summer '26) [S] | ✅ [K] | ❌ | ❌ | ✅ [K] | ❌ |
| Bot / conversational AI | ✅ AI Agents across chat, social, voice, messaging, email — **fully autonomous, semi-autonomous and AI-assisted modes** [S] | ✅ **Khoros Flow** [K] | Bot builder [K] | Gen-AI chatbot (Enterprise) [S] | ✅ [K] | DM automation rules + AI dynamic replies |

**Read:** the gap between "social inbox" (Vista, Sprout, Hootsuite) and "social customer service" (Sprinklr, Khoros, Emplifi) is the largest functional gap in the entire market. It is also **buildable** — it is contact-centre engineering, not data licensing.

### 2.8 CRM / CDP integration

| Vendor | CRM depth |
|---|---|
| **Sprout Social** | Salesforce (**Service Cloud integration — manage social care requests from inside Service Cloud**; enriches CRM profiles with social data), Microsoft Dynamics 365, HubSpot, Zendesk. **Sprout is Salesforce's preferred social media management solution** post-Social Studio retirement. [S] |
| **Sprinklr** | Native Salesforce, Microsoft Dynamics, ServiceNow, Zendesk, SAP; Case/Profile objects designed for bidirectional sync via API 2.0 [S/K] |
| **Khoros** | Salesforce, Microsoft Dynamics, ServiceNow, Zendesk; Care agent desktop can be embedded [K] |
| **Emplifi** | Astute-lineage CRM/agent-desktop; Salesforce, Zendesk [K] |
| **Hootsuite** | Salesforce integration is an **Enterprise-tier unlock** [S]; Microsoft Dynamics via app directory [K] |
| **HubSpot** | Social *is* the CRM — every social interaction lands on the contact timeline and can be attributed to deals. **This is HubSpot's only genuine advantage and it is a real one.** [K] |
| **Zoho Social** | Zoho CRM lead capture from social, Zoho Desk ticketing, Zoho Analytics [K] |
| **Brandwatch / Meltwater / Talkwalker / Dash / Later** | Shallow — export/webhook rather than identity resolution [K] |

**The capability nobody does well:** genuine **identity resolution** — stitching an anonymous social handle to a known CRM contact with confidence scoring, then writing engagement events back to a CDP (Segment / Salesforce Data Cloud / Adobe Experience Platform) as first-class profile events. Everyone claims "360° view"; the actual implementations are handle-string matching.

### 2.9 What each vendor does that Vista Social does NOT — consolidated

| Vendor | Capabilities Vista Social has no equivalent for |
|---|---|
| **Sprout Social** | SAML SSO; 50+ event audit trail [S]; Salesforce **Service Cloud** embedded care [S]; Tagger-based **Influencer Marketing** module (creator discovery, campaign mgmt, contracts, payments) [S]; Premium Analytics; Employee Advocacy as a separately-priced enterprise product; **Trellis** agentic engine across Publishing/Listening/Inbox/Reporting + **Trellis Studio** workflow builder with reusable Skills [S]; Analytics API (Advanced+) [S] |
| **Hootsuite** | **Social OS** four-app architecture (Perch/Nest/Lumen/Parliament) [S]; **Wisdom** agent on 150M+ monitored sources [S]; **MCP connectors** across three apps into Claude/ChatGPT/Gemini/Copilot [S]; **Talkwalker-grade listening** incl. X firehose [S]; **Proofpoint** real-time compliance checks in Composer [S]; **Smarsh** archiving partnership [S]; **Parliament/Amplify** employee advocacy with Proofpoint Threat Response, TINT, UpContent, Venn connectors [S]; Salesforce integration; Carahsoft/GSA public-sector distribution [S] |
| **Sprinklr** | Everything in §2.7 (case mgmt, routing, WFM, QA, Voice/CCaaS); **Partitions** hard multi-tenancy; **Distributed** local/franchise publishing; **FedRAMP** [S]; **AI+ Studio / AI Agent Studio** [S]; **Autonomous Evaluation** + **Agent QA** [S]; **Sprinklr MCP** [S]; **ViralMoment** frame-by-frame video intelligence [S]; Voice AI agents with sub-second latency [S]; VoC/survey platform (2026 Gartner MQ Leader for Voice of the Customer) [S]; 33 products across 4 suites [S]; API 2.0 with Message/Case/Profile/Task objects + webhooks [S] |
| **Emplifi** | Astute-lineage **omnichannel customer care**; **Pixlee TurnTo** UGC + **Ratings & Reviews**; **live video shopping**; **Emplifi Fuel** commerce layer [S]; Socialbakers-heritage competitive benchmarking against a very large public-profile dataset; **AI Query Copilot**, **AI Data Summarization**, predictive analytics [S] |
| **Brandwatch** | **Consumer Research** over 100M+ sources with deep boolean + segmentation [S]; **Iris** AI analyst [K]; **Data Upload API** for blending internal corporate documents with social data [S]; Audiences (X segmentation); Vizia command centres; Benchmarks; **Influence** (Paladin lineage) |
| **Khoros** | **Khoros Communities (Aurora)** — owned forum/community with gamification, SEO, KB, ideation, moderation; **Khoros Flow** conversational AI; **Care** agent desktop with full contact-centre semantics; **Bulk Data API** daily event-log extract (JSON/CSV) [S]; LiQL query language for Community v2 [K] |
| **Meltwater** | Media monitoring (print/broadcast/online news) + **Media Relations** (journalist database, pitching); **Klear** influencer; **Consumer Intelligence** (Linkfluence lineage); **Sales Intelligence** (Owler); **GenAI Lens** — brand visibility inside AI answer engines [S]; Data & API Integration tier [S] |
| **Talkwalker** | ~150M websites, 30+ social channels, unsampled X firehose [S]; **Blue Silk AI** sentiment/clustering/benchmarking; **Blue Silk GPT** generative insight; image/logo recognition; Nielsen Social Content Ratings lineage [K] |
| **Later + Mavrck** | **Later Influence** — enterprise ambassador/creator programme management with a managed-services team that will staff, plan and run campaigns [S]; **Mavely** creator-affiliate/attribution network; "Social Revenue Platform" positioning tying creator content to measurable revenue [S] |
| **Dash Social** | **Vision AI** — proprietary visual recognition predicting content performance *before* publishing [S]; Predictive Ranking; market-level competitive benchmarks; **unlimited users on every plan** [S]; multi-brand governance + custom SSO at Enterprise [S] |
| **HubSpot** | Social interactions natively on the CRM contact timeline with deal attribution; Breeze agents [K] |
| **Zoho Social** | Multi-datacentre data residency (US/EU/IN/AU/JP/CA/CN/SA) [K]; deep Zoho CRM/Desk/Analytics coupling; per-brand rather than per-user pricing [S] |

### 2.10 What NOBODY does well — the open gaps

These are the strategic openings. Each is stated as a buyer complaint, then as a product opportunity.

1. **You cannot buy enterprise security self-serve.** Not one vendor lets a buyer enable SAML/SCIM/audit-export/residency with a credit card. Every one routes to "contact sales." → **Ship enterprise identity and governance as self-serve toggles.** This is the single highest-leverage move available.
2. **Enterprise pricing is universally opaque.** Meltwater has "no public tiers, no monthly billing, no self-serve sign-up" [S]. Brandwatch "has made it incredibly difficult, if not downright impossible, to find out the price without booking a call" [S]. Sprinklr killed self-serve entirely (existing self-serve customers cut off **30 April 2026**) [S]. → **Publish real enterprise prices.**
3. **The seat tax.** Sprout $399/seat/mo, Sprinklr up to $4,700/user/yr, Hootsuite min 5 seats on Enterprise. Executives, legal, PR and regional stakeholders who need *read* access are priced out, so enterprises under-deploy and screenshot dashboards into slides. Only **Dash Social (unlimited users)** [S] and **Zoho (per brand)** [S] break the model. → **Unlimited viewers/approvers; charge for creators or volume.**
4. **Agentic autonomy without a trust framework.** Only Sprinklr ships Autonomous Evaluation + Agent QA [S]. Nobody offers the clean primitive: *agent acts → full decision trace → human approval gate → immutable audit entry → one-click rollback*. → **Build the agent trust layer as a first-class product surface.**
5. **No native compliance archiving.** Everyone punts to Smarsh/Proofpoint/Global Relay as a paid partner integration. Nobody ships WORM-grade native archive + supervision + eDiscovery export. → Large, defensible, regulated-industry wedge.
6. **Migration is deliberately brutal.** The Social Studio retirement (data deleted 90 days after 18 Nov 2024 [S]) proved there is no portability standard. No vendor ships an "import from Sprout/Hootsuite/Sprinklr" wizard. → **Build the migration tool.** It is a direct sales weapon.
7. **Listening is barbelled.** Post-X-API, listening is either a $999+/mo add-on with hard caps or firehose-grade at $50k+/yr. Nothing credible in the middle. → Own the middle with owned+partner+first-party data, transparently scoped.
8. **Data residency is never a toggle.** It is always an enterprise SKU with a migration project. → **Region selection at signup.**
9. **UGC/influencer rights management is not enforced at publish time.** Emplifi (Pixlee) and Later Influence track rights; almost nobody blocks a publish when a licence has expired. → Small build, high trust value.
10. **Real social→revenue attribution.** Universally claimed, universally weak without a CDP. Later's "Social Revenue Platform" + Mavely affiliate links [S] is the most honest attempt because it uses actual transaction data.
11. **Multi-location/franchise at self-serve price.** Sprinklr Distributed is the only serious implementation and it is $50k+ entry. The franchise/multi-location segment is large and structurally underserved.
12. **Accessibility.** VPAT/WCAG 2.1 AA compliance of the SMM tools themselves is weak market-wide, and compose-time enforcement of alt-text/captions is inconsistent. Blocks public-sector and large-regulated deals.
13. **Owned community.** Only Khoros. Everyone else abandoned the category.
14. **Pharmacovigilance / adverse-event detection from social.** Only Sprinklr and Khoros serve it seriously. Pharma is a high-ACV, high-stickiness vertical.
15. **AI transparency.** Model disclosure, no-training guarantees and region-pinned inference are inconsistently documented across every vendor, while 2026 buyers now explicitly demand to know "what data flows to these services and how it's protected" [S].
16. **Cross-vendor benchmarking of your own historical data.** When you switch vendors you lose your history. Nobody solves it.

---
## 3. Sprout Social

**Archetype:** B — Social-first suite. Public company (NASDAQ: SPT). Chicago.
**Positioning 2026:** "AI-powered social intelligence platform." Salesforce's preferred SMM partner post-Social Studio. [S]

### 3.1 Pricing and packaging

| Plan | Annual billing | Month-to-month | Social profiles | Notes |
|---|---|---|---|---|
| Essentials | ~$79/mo [S-conflict] | — | UNVERIFIED | Newer low-end tier; only one source; treat as unconfirmed |
| **Standard** | **$199/seat/mo** [S] | $249/seat/mo [K] | **5 profiles** [S] | Publishing, scheduling, Smart Inbox, basic reporting [S] |
| **Professional** | **$299/seat/mo** [S] | $399/seat/mo [K] | **Unlimited** [S] | + competitive reports, content tagging, digital asset library, advanced scheduling [S] |
| **Advanced** | **$399/seat/mo** [S] | $499/seat/mo [K] | **Unlimited** [S] | + automation, approval workflows, sentiment analysis, chatbots, **Analytics API access**, CRM integrations [S] |
| **Enterprise** | Custom [S] | — | Unlimited | SSO, dedicated CSM, custom onboarding, enterprise support, custom workflows [K] |

**Seat model:** strictly per-seat. **All plans start with one included seat; additional seats cost the same per-seat rate** [S]. There is no read-only/viewer seat class at a lower price — the most-cited commercial complaint about Sprout.

**Add-ons (list prices are [K-stale], from Sprout's 2023–24 published add-on page — re-verify):**

| Add-on | Price | Confidence |
|---|---|---|
| Premium Analytics | $349/mo | [K-stale] |
| Advanced Listening | $999/mo | [K-stale]. 2026 sources say "not publicly listed; custom-quoted based on data volume and topics tracked" [S] |
| Employee Advocacy | from $999/mo | [K-stale] |
| **Influencer Marketing (Tagger)** | Custom, separate purchase, **not included in any base plan** [S]. **Vendr-reported average contract ≈ $21,431/year** [S] | [S] |
| Salesforce Service Cloud connector | UNVERIFIED | — |

**Realistic ACV:** a 10-seat Advanced deployment with Listening and Advocacy lands around $60k–$75k/yr before Influencer. [K, arithmetic]

### 3.2 Core modules

- **Publishing** — composer, calendar, queues, bulk, asset library, content tagging, optimal send times, campaign planner, approval workflows (Advanced+).
- **Smart Inbox** — unified across networks; message tagging; saved replies; case-like handoff to CRM; rules-based automation (Advanced).
- **Reviews** — Google Business Profile, Facebook, Yelp, TripAdvisor, Glassdoor, G2, Trustpilot [K].
- **Listening** — separately-priced add-on; topic-based query builder; sentiment; share of voice; conversation themes [S].
- **Analytics & Reporting** — cross-network, competitor reports (Professional+), paid performance, Premium Analytics add-on, **Analytics API on Advanced+** [S], Tableau connector [K].
- **Employee Advocacy** — separate product; curated story feeds, leaderboards, EMV [K].
- **Influencer Marketing** — Tagger-based; discovery, campaign management, analytics; separate purchase [S].
- **Sprout Social Care** — via Salesforce Service Cloud / Zendesk / HubSpot integrations rather than a native case object [S].

### 3.3 AI (2025–2026)

- **Trellis** — Sprout's proprietary **agentic AI engine**, announced 13 May 2026, **available to all customers July 2026** [S]. Integrated across **Publishing, Listening, Smart Inbox and Reporting** [S]. Purpose: "synthesise social data across networks... ask complex questions and surface relevant, actionable insights faster" [S].
- **Trellis Studio** — environment to "build bespoke AI workflows"; ships **Skills** = "pre-built, recurring conversation starters" that automate analysis. Named example skills: summarising inbox activity; identifying negative sentiment and complaints to speed response [S].
- **Four stated pillars** of the AI social intelligence platform [S]:
  1. **Predictive Media Intelligence** — agentic AI detecting shifts in industry narratives as they emerge.
  2. Full-funnel social optimisation.
  3. **Scalable social support** — "beyond reactive replies to proactive engagement," AI surfacing highest-priority interactions.
  4. Authentic brand amplification.
- Pre-existing AI: AI Assist (copy generation), sentiment analysis, message classification, AI-suggested replies, chatbot builder for FB Messenger / X DM [K].

**Assessment:** Trellis is an insight-and-workflow agent, not an autonomous operator. No published evaluation/QA framework analogous to Sprinklr's Autonomous Evaluation. **UNVERIFIED** whether Trellis can auto-publish or auto-reply without human approval.

### 3.4 Listening depth and data sources

- Listening is an add-on, custom-quoted on **data volume and topics tracked** [S] — i.e. metered, like Vista's.
- Sources: X, Instagram, Facebook, Reddit, Tumblr, YouTube, TikTok (limited), news, blogs, forums, reviews [K].
- X access: Sprout maintains a commercial X data agreement [K]; scale/firehose status **UNVERIFIED**.
- Reddit licence status **UNVERIFIED**.
- TikTok: constrained to commercial endpoints like everyone else [S, category-wide].
- Historical backfill: typically limited relative to Brandwatch/Talkwalker [K].

### 3.5 Governance, security and compliance

| Item | Status |
|---|---|
| SAML 2.0 SSO | ✅ Enterprise. "Sprout offers SAML 2.0 SSO across web and mobile... even if your IdP isn't listed you should be compatible as long as your IdP supports SAML 2.0" [S] |
| **SCIM 2.0** | ❌ **"Sprout Social doesn't offer native SCIM provisioning on any plan."** Enterprise gets SAML 2.0 SSO with **Just-In-Time provisioning only — creates accounts on first login, does not handle ongoing lifecycle, role assignment, or deprovisioning when employees leave** [S] |
| Audit log | ✅ "Over fifty different events and actions are logged in the audit trail, documenting both the activity and the user who performed it" [S]. Export mechanism UNVERIFIED |
| Hosting | AWS [S] |
| Data residency options | **UNVERIFIED** — no EU/UK residency option surfaced |
| SOC 2 Type II | [K] yes |
| ISO 27001 | UNVERIFIED |
| FedRAMP | ❌ [K] |
| HIPAA / BAA | UNVERIFIED |
| Archiving partners (Smarsh/Proofpoint/Global Relay) | **UNVERIFIED** — none surfaced. This is a notable absence vs Hootsuite |
| Approval workflows | ✅ Advanced+ [S]; conditional routing UNVERIFIED |
| Content policy engine at compose time | UNVERIFIED — none surfaced |

**The SCIM gap is Sprout's most exploitable enterprise weakness.** For any buyer with an IT identity team and a joiner-mover-leaver process, "no automated deprovisioning" is a security-review finding, not a feature request.

### 3.6 API and webhooks

- **Sprout Public API** at `api.sproutsocial.com`, documented with a changelog [S]. Bearer-token auth; tokens managed in-app [S].
- Endpoint families confirmed [S]:
  - **Publishing** — create/retrieve publishing posts; **Media Upload**.
  - **Analytics** — profile-level, post-level metrics.
  - **Topics** — retrieve metrics and messages for listening Topics (newer).
  - **Engagement** — "monitor and respond to interactions with your audience in real time."
  - Metadata — client/customer metadata, tags.
- Base path pattern `/v1/{customer_id}/...` [K].
- **Analytics API is Advanced-plan-and-above** [S].
- **Webhooks: UNVERIFIED** — no outbound webhook family surfaced. If absent, this is a significant enterprise integration gap (polling-only).
- Rate limits: **UNVERIFIED** exact figures.
- Postman public workspace exists [S].

### 3.7 CRM / CDP

Salesforce (Service Cloud — social care handled *inside* Service Cloud, CRM profiles enriched with social data), Microsoft Dynamics 365, HubSpot, Zendesk [S]. **Sprout is Salesforce's preferred social media management solution** [S] — a direct consequence of Social Studio's retirement and commercially the most valuable partnership in the category.

### 3.8 Procurement blockers for Sprout

- No SCIM → identity/IT veto risk [S].
- No surfaced EU data residency → EU legal risk [UNVERIFIED but unaddressed].
- No surfaced archiving partner → hard blocker in FINRA/SEC-regulated financial services.
- Per-seat pricing at $399/seat/mo makes broad internal visibility economically impossible.
- Listening + Advocacy + Influencer are all separate line items → the quoted price is never the real price.

---

## 4. Hootsuite

**Archetype:** B — Social-first suite, now repositioned as an "OS." Private (equity: Vector/others). Vancouver.
**2026 event:** complete re-architecture launched **24 June 2026** [S].

### 4.1 Social OS — the 2026 architecture

Hootsuite's full portfolio was "reimagined as purpose-built products, connected by AI under one unified experience" [S]. Four apps + one agent:

| App | Function [S] |
|---|---|
| **Perch** | Content creation, planning and publishing |
| **Nest** | Social inbox and customer care workflows |
| **Lumen** | Social listening, insights and learning (Talkwalker-powered) |
| **Parliament** | Employee advocacy and amplification (Amplify lineage) |
| **Wisdom** | Conversational AI agent sitting across the suite |

**Wisdom** — "a social-first AI agent purpose-built for social and business intelligence, powered by 15+ years of proprietary social data and **more than 150M monitored data sources**... transforms live social data into contextual intelligence and coordinated action" [S]. Live worldwide as of 24 June 2026 [S].

**MCP connectors** — shipped **across Perch, Nest and Lumen** [S]. Two directions:
- **Outbound:** Hootsuite's "social intelligence, creating, publishing, and inbox triaging capabilities" available inside **Claude, ChatGPT, Gemini, Copilot and internal copilots** [S].
- **Inbound:** external tools and data sources can be brought **into Wisdom** [S].
- Reported as **included on every plan** [S-conflict — one source; verify].

Built on a "governed data foundation, with key data sourced through **direct API partnerships with the world's largest social networks**" and "enterprise-grade security and compliance" [S].

### 4.2 Pricing

**[S-conflict] — two credible 2026 readings:**

| Reading A [S] | Reading B [S] |
|---|---|
| Standard **$99**/seat/mo, Professional **$199**/seat/mo, Advanced **$399**/seat/mo, Enterprise custom | Standard $99, Advanced $249, Enterprise custom [K, 2025 lineup] |

Consistent facts across sources:
- **Sold per seat, not per plan.** The old Team plan at $249 for 3 users no longer exists. [S]
- **Standard: 10 social accounts**, unlimited scheduling/publishing, unified Smart Inbox, basic analytics, AI caption and image tools. [S]
- **Advanced: unlimited accounts**, bulk scheduling, custom reports, saved replies, **30-day brand search**. [S]
- **Enterprise requires a minimum of 5 seats** and unlocks: **Talkwalker listening, Salesforce integration, Proofpoint integration, Employee Advocacy (Amplify), and a generative-AI chatbot**. [S]
- Annual billing carries a **34–38% discount**; paying annually upfront adds a further **10%**, for total savings of **44–45% vs monthly**. [S]

**Real contract data [S-conflict — a very wide spread, treat with care]:**
- **Vendr: median $12,000/year across 96 verified purchases** [S].
- **SpendHound: Hootsuite Enterprise average ACV ≈ $155,813** [S].
- Other: "$15,000–$50,000+ depending on seat count, listening volume and add-ons"; "Enterprise plan around $16,000–$18,000" [S].

The Vendr median almost certainly includes non-Enterprise business plans; the SpendHound figure is almost certainly a small sample skewed by a few very large listening deals. **A defensible planning range for a real Hootsuite Enterprise deal is $25k–$80k/year**, with listening volume being the dominant variable. [Inference]

### 4.3 AI capabilities

- **Wisdom** (2026) — the umbrella agent [S]. Reported as the rebrand consolidating **OwlyWriter AI and Blue Silk AI** [S-conflict; one source].
- **OwlyWriter AI** — caption generation, content ideas, hashtag generation, plus a library of "more than one million high-quality images, videos, GIFs and text snippets" [S].
- **Generative AI chatbot** — Enterprise-tier unlock [S].
- **Blue Silk AI / Blue Silk GPT** (via Talkwalker) — sentiment, automated conversation clustering, competitive benchmarking; generative distillation of listening data flagging brand activity, consumer pain points and potential crises [S].
- **MCP connectors** — see §4.1.

**Assessment:** Hootsuite's 2026 AI story is the most *architecturally* coherent in the market (agent + four apps + MCP in both directions). It is also the least differentiated on autonomy — no published evaluation, QA or approval-gating framework for agent actions. [UNVERIFIED whether Wisdom can take write actions unattended.]

### 4.4 Listening — the Talkwalker asset

Hootsuite **acquired Talkwalker in April 2024** [S]. This is the single most consequential M&A in the category since Sprout/Tagger, because it gave a publishing-first vendor firehose-grade listening.

Talkwalker corpus [S]:
- ~**150 million websites**, **30+ social channels**.
- "Industry's broadest data set — many languages, visual/image recognition, and **unsampled data access (e.g. X/Twitter Firehose)**."
- Billions of posts, articles, reviews and visual assets.
- Hootsuite's own Wisdom claim: **150M+ monitored data sources**, 15+ years proprietary social data [S].

Standard-plan listening is limited to **30-day brand search** on Advanced [S]; real listening is the Enterprise Talkwalker unlock [S].

### 4.5 Governance, compliance and archiving — Hootsuite's strongest enterprise suit

| Item | Status |
|---|---|
| **Proofpoint** | ✅ **Enterprise add-on integration inside Hootsuite Composer providing real-time compliance checks** [S]. Explicitly positioned to ensure AI-generated posts pass compliance review before publishing [S] |
| **Proofpoint Threat Response** | ✅ Native connector from **Amplify/Parliament** [S] |
| **Smarsh** | ✅ Formal partnership — "help customers facilitate the **archiving, supervision, discovery and production** of published social media content" [S]. Smarsh Archiving Platform covers Facebook, X, LinkedIn, Instagram, YouTube, Vimeo, Pinterest and others [S] |
| Other Amplify connectors | TINT, UpContent, Venn [S] |
| SAML SSO | ✅ Enterprise [K] |
| SCIM | UNVERIFIED [K: believed yes on Enterprise — verify] |
| Audit log | [K] yes, Enterprise |
| Approval workflows | ✅; Enterprise supports deeper custom approval chains [K] |
| SOC 2 Type II / ISO 27001 | [K] yes |
| FedRAMP | ❌ [K]. **But sold to US public sector via Carahsoft** (GSA reseller) — "Hootsuite Social OS" appears in the Carahsoft catalogue [S] |
| Data residency | UNVERIFIED — EU option not confirmed |

**This compliance/archiving stack is the clearest thing Hootsuite Enterprise sells that mid-market tools do not have, and it is why Hootsuite retains financial-services and pharma logos.**

### 4.6 API

- Hootsuite Platform API, OAuth 2.0, REST [K].
- Endpoint families: `/v1/me`, `/v1/socialProfiles`, `/v1/messages` (schedule/retrieve), `/v1/media` (upload) [K].
- Webhooks: [K] limited.
- App Directory with 100+ third-party apps [K].
- **MCP connectors are now the strategically important integration surface, not the REST API** [S].
- Exact rate limits **UNVERIFIED**.

### 4.7 Procurement blockers for Hootsuite

- Enterprise **5-seat minimum** [S] inflates the floor.
- Listening is the price variable and it is opaque.
- Reported price spread ($12k median vs $155k average) means buyers cannot benchmark — a real friction point that a transparent challenger can exploit.
- Migration from Social OS is untested (the 2026 re-architecture is <2 months old at time of writing).

---

## 5. Sprinklr

**Archetype:** A — Unified CXM. Public (NYSE: CXM). New York.
**Scale:** **4 product suites, 33 products** [S] — the broadest surface in the category by a wide margin.

### 5.1 Suite structure

| Suite | Contents [S/K] |
|---|---|
| **Sprinklr Social** | Publishing & Engagement, Distributed (local/franchise), Advocacy, Reviews Management, Content Marketing/DAM, Campaign management, Social governance |
| **Sprinklr Insights** | Social Listening, Competitive Insights, Product Insights, Media Monitoring, Visual Insights, Location Insights, Benchmarking, Smart Alerts, Research/VoC surveys |
| **Sprinklr Service** | Omnichannel case management, **Sprinklr Voice (CCaaS)**, Conversational AI/bots, Agent Assist, Knowledge Base, Quality Management, Workforce Management, Guided Workflows, Live Chat |
| **Sprinklr Marketing** | Paid/Ads across networks, Campaign planning, Content marketing, Marketing Copilot, Creative/DAM |

**Named 2026 recognitions:** Leader, **2026 Gartner Magic Quadrant for Voice of the Customer Platforms** [S]. Present in Gartner Peer Insights for Social Monitoring & Analytics [S].

### 5.2 Pricing — the hard numbers

- **Self-serve is discontinued.** Existing Self Serve customers retained access **only until 30 April 2026** [S]. Sprinklr is now 100% enterprise sales-led.
- **Advanced Enterprise Package: $4,700 per user per year** [S].
- Broad band: **$2,800–$4,700 per user per year** [S].
- **A 10-user team pays $28,000–$47,000/year for Sprinklr Social alone** [S].
- **Enterprise contracts start around $50,000/year; median ACV ≈ $129,380** [S].
- Costs scale on **three axes: user count, channel volume, and role type** — with **different seat tiers (admin, analyst, publisher, agent) on different pricing bands** [S].
- Per-user annual contracts are the only option [S]. No fixed enterprise price list [S].

**This role-banded seat model is worth studying.** It is the only implementation in the market that prices a "publisher" differently from an "analyst" from an "agent" — and it is still per-seat, so it still taxes breadth.

### 5.3 AI — the deepest agentic stack in the market

**Spring '26 release (26.4, from 27 March 2026) [S]:**
- **Autonomous Evaluation** — "clear, explainable logs and test-backed validation so teams can understand, trust and continuously refine agent behaviour." Positioned explicitly as *how you scale autonomous resolution safely*. [S]
- **AI+ Studio** — "a centralised, no-code workspace to build, manage and scale GenAI agents and workflows," with "simple tools to **test AI in bulk** and monitor its behaviour." [S]
- **AI Agent Studio** — described as the next evolution of **Digital Twin Studio**, for front-office teams to build agentic AI. [S]
- **Marketing Copilot** — conversational automation for social and paid: explains performance changes, summarises engagement, builds analytics widgets from natural language. [S]
- **Customer Feedback Copilot** — turns VoC feedback into visual trends, comparisons and multi-level drilldowns. [S]

**Summer '26 release (announced 15 July 2026) [S] — 16 AI features:**
- **Voice AI agents** — "more human-like conversations with sub-second response times, smarter turn-taking, and improved noise handling." [S]
- **AI content generation in Copilot** — generate and refine social posts, **and create videos**, from natural-language prompts. [S]
- **Agent Quality Assurance** — "built-in testing, simulation and quality scoring to validate AI agent behaviour **before deployment** and maintain consistency in live interactions." [S]
- **Sprinklr MCP (Beta)** — Sprinklr insights inside **Microsoft Copilot, ChatGPT and Claude**. [S]
- **ViralMoment video intelligence** — acquired AI social-video intelligence company; **frame-by-frame analysis extending Unified-CXM into video, audio, image and text.** [S]
- **Voice surveys** — in-channel voice-enabled surveys captured during or immediately after a voice interaction rather than routing to a separate flow. [S]

**Autonomy model [S]:** "AI Agents seamlessly incorporate human intervention when needed, supporting **fully autonomous, semi-autonomous and AI-assisted workflows**, and operate across chat, social, voice, messaging, email."

**Strategic positioning [S]:** "while nearly every competitor is integrating conversational AI for basic customer service, Sprinklr is building agents capable of **end-to-end, multi-step processes across marketing, sales and service**." Sprinklr's stated posture is "trust AI agents with **proof, not promises**."

**Assessment:** Sprinklr is 12–18 months ahead of the field on *agent governance*. The Autonomous Evaluation + Agent QA + AI+ Studio triad is a genuinely defensible pattern: build → simulate → score → deploy → log → refine. **Copy this pattern.**

### 5.4 Listening and data

- Sprinklr Insights claims coverage across **30+ digital channels** and hundreds of millions of sources [K].
- X: Sprinklr has historically held full firehose-grade access via its enterprise data agreements [K]; current X Enterprise contract status **UNVERIFIED**.
- **ViralMoment** adds native video/audio frame-level intelligence — a genuine differentiator against text-first listening [S].
- Product Insights, Location Insights, Visual Insights and Benchmarking are separately licensable Insights products [K].
- Pharmacovigilance / adverse-event workflows are a supported Sprinklr use case in life sciences [K].

### 5.5 Governance, security, compliance

| Item | Status |
|---|---|
| **FedRAMP** | ✅ **Authorized at Low Impact (LI-SaaS), announced October 2022, delivered via AWS** [S]. Covers social, voice, SMS, email and digital channels for government agencies [S]. Note: LI-SaaS ≠ Moderate. Under 2026 rules "Authorized" is being renamed "**Certified**" and "FedRAMP Ready" retired [S] |
| SOC 1 / SOC 2 | ✅ (SOC 1 and SOC 2 certification completed; original announcement 2015, presumed continuously maintained) [S — but the source is old; current attestation UNVERIFIED] |
| ISO 27001 / 27018 | [K] yes |
| HIPAA / BAA | [K] available |
| GDPR / DPA / SCCs | [K] yes |
| Data residency | [K] multi-region incl. US, EU, UK, Canada, India, Japan, Australia, Middle East — **verify per-region list** |
| SAML / OIDC SSO | [K] yes |
| SCIM | [K] yes |
| Partitions (hard tenancy isolation) | [K] yes |
| Rule Engine (conditional routing, auto-tagging, escalation) | [K] yes — the deepest in the market |
| Audit logs + SIEM export | [K] yes |
| Approval paths with conditional logic | [K] yes |

### 5.6 API and webhooks

- **Sprinklr API 2.0**, launched late 2019, "more robust, lightweight and faster," built on standard business objects: **Message, Case, Profile, Task** [S].
- REST + JSON, **OAuth 2.0** [S]; **OAuth 2.0 for Partners** with partner SSO [S].
- API families [S]: deliver messages to dashboard streams; push/pull profile data; digital asset management; reporting and listening insights.
- **Rate limits: 1,000 calls per hour and 10 calls per second by default; exceeding returns HTTP 403 "Developer Over Rate"** [S].
- **Webhooks:** yes — "Sprinklr uses webhooks to provide real-time updates regarding any changes in applications"; webhook types discoverable via the **Fetch Webhook Types API** [S].
- Developer portal: `dev.sprinklr.com` (also an Apigee-hosted portal) [S].
- Documented **REST API error and status codes** page [S].

**Assessment:** 1,000 calls/hour is *low* for an enterprise platform of this price. It is a real constraint for data-warehouse sync patterns and a legitimate criticism to raise in competitive conversations.

### 5.7 Procurement blockers for Sprinklr

- **~$50k floor** and $129k median ACV [S] excludes everyone below large-enterprise.
- Self-serve killed [S] — there is no way to try it.
- Implementation is a project, not a signup: multi-month, often with an SI.
- Role-banded per-seat pricing means every new stakeholder is a budget conversation.
- 1,000 calls/hour API ceiling [S].
- FedRAMP is **LI-SaaS only** [S] — insufficient for Moderate-impact federal workloads.

---

## 6. Emplifi

**Archetype:** B/A hybrid — social-first suite with genuine care and commerce. Private (Audax Private Equity). Formed 2021 from **Socialbakers + Astute**; acquired **Pixlee TurnTo** (2022).
**2026 positioning [S]:** "**Autonomous Customer Experience for Enterprise**."

### 6.1 Modules

Per Emplifi's own 2026 description, the platform includes: **AI-powered publishing, community management, social listening, unified analytics, influencer marketing, UGC and visual commerce, ratings and reviews, and omnichannel customer care.** [S]

| Module | Lineage | Notes |
|---|---|---|
| Social Marketing Cloud | Socialbakers | Publishing, calendar, community management/inbox, listening, analytics |
| **Benchmarks / Competitive analytics** | Socialbakers | Built on one of the largest public social-profile datasets in the industry [K] — a genuine asset |
| **Social Commerce Cloud / Emplifi Fuel** | Pixlee TurnTo | "Turns engagement into revenue with **UGC, ratings and reviews, influencer programs, and live video shopping**"; **Emplifi Fuel** "connects your existing social marketing with UGC, influencers, live video, and ratings & reviews in one place" [S] |
| **Ratings & Reviews** | TurnTo | Syndicated review collection/display — genuinely rare in an SMM tool |
| **Live video shopping** | Emplifi | Rare in the category [S] |
| **Service Cloud / omnichannel care** | Astute | Agent desktop, case handling, chatbot [K] |
| Influencer Marketing | Emplifi | Discovery, campaign, measurement [S] |

### 6.2 AI

- **AI Composer** — "the industry-first GPT-powered social copywriting assistant" [S], with **Brand Voice** [S].
- **AI Data Summarization** [S].
- **AI Query Copilot** — natural-language querying of analytics [S].
- **AI-driven predictive analytics** [S].
- 2026 umbrella positioning: "Autonomous Customer Experience" [S] — **UNVERIFIED** whether an actual autonomous agent product ships behind that phrase, or whether it is positioning over the Astute bot stack.

### 6.3 Pricing

- **Essential is the only publicly-priced plan**; Socialbakers-lineage pricing started from **~$200/month** [S-conflict — likely stale].
- Everything else custom: expect **$1,000–$3,000+/month** depending on features and scale [S].
- Enterprise-focused, no public pricing for Advanced/Enterprise [S].
- Seat/profile model **UNVERIFIED** — believed profile+module based rather than pure per-seat [K].

### 6.4 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO | [K] yes |
| SCIM | UNVERIFIED |
| Audit log | [K] yes |
| Data residency | [K] EU option exists (European roots — Socialbakers was Prague-based) — **verify** |
| SOC 2 / ISO 27001 | [K] yes |
| Archiving partners | UNVERIFIED |
| API | [K] REST; public API for analytics/publishing; exact families UNVERIFIED |

### 6.5 What Emplifi does that Vista does NOT

Ratings & Reviews **syndication** (not just review monitoring); **live video shopping**; **UGC rights collection and galleries** (Pixlee); **omnichannel care with a real agent desktop** (Astute); **large-scale competitive benchmarking dataset** (Socialbakers); AI Query Copilot over analytics.

**Emplifi is the closest thing in this market to "social + commerce + care in one SKU," and social commerce is the module Vista Social lacks entirely.**

---

## 7. Brandwatch (Cision) — including the Falcon.io lineage

**Archetype:** C primary (Consumer Intelligence) + B secondary (Social Media Management).
**Ownership:** Cision (acquired Brandwatch 2021, ~$450M) [K]. Brandwatch itself had merged with **Crimson Hexagon** (2018) and acquired **Falcon.io** (2019, ~$190M) and **Paladin** (influencer, 2021) [K].
**2026 status [S]:** "The Falcon.io to Brandwatch migration is **complete**, and the current product is Brandwatch with **enterprise-only pricing**."

### 7.1 Products

| Product | Lineage | Function |
|---|---|---|
| **Consumer Intelligence / Consumer Research** | Brandwatch + Crimson Hexagon | "Turns data from **100m+ online sources** into insights" [S]. Boolean query builder, segmentation, historical archive, categories/rules, sentiment, image analysis |
| **Social Media Management** | Falcon.io | Publish, Engage (inbox), Measure, Listen, Advertise, Benchmark, Content Pool (DAM), Audience (CRM-lite) |
| **Influence** | Paladin | Influencer discovery, campaign management |
| **Benchmarks** | Brandwatch | Competitive benchmarking |
| **Vizia** | Brandwatch | Command-centre / video-wall visualisation [K] |
| **Audiences** | Brandwatch | X/Twitter audience segmentation and profiling [K] |
| **Iris** | Brandwatch | AI analyst: anomaly detection, automated insight summaries, conversational Q&A [K] |
| **Reviews** | Brandwatch | Review monitoring [K] |

### 7.2 Pricing

| Data point | Value |
|---|---|
| **Essentials** (small business) | **$108/month** [S] |
| Enterprise, 1 user | **$800–$1,500/month** [S] |
| Enterprise, 10 users | **$8,000–$15,000/month** [S] |
| Enterprise, 100 users | **$80,000–$150,000/year** [S — note the unit shift in the source; treat the 100-user figure with caution] |
| Legacy Falcon.io entry | **$1,000/month** annual [S] |
| Legacy Falcon.io tier 2 | **$1,750/month → over $21,000/year** [S] |

"Brandwatch has made it incredibly difficult, if not downright impossible, to find out the price without booking a call with the sales team. Brandwatch's plans are tailored, so feature differences directly correlate with the negotiated price." [S]

### 7.3 API — and a serious enterprise gotcha

- **Default rate limit: 30 API requests per 10 minutes per Client.** Requests beyond it are rejected with **HTTP 429 Too Many Requests**. [S]
- **Data Upload API** — "lets teams upload unstructured, internal corporate documents to analyse alongside the platform's native social web data" [S]. This is genuinely differentiated: blending internal survey/CRM/support text with social listening in one analysis surface.
- Falcon-lineage export: "Export all of your social publishing data to integrate with existing content management systems and processes." [S]
- **CRITICAL LIMITATION [S]:** "Brandwatch's API greatly restricts the export of raw data: it **completely strips out the text of X (Twitter) posts, blanks out LinkedIn content entirely, and limits online news articles to a 256-character snippet.**"

**That last point is a major enterprise procurement issue.** Buyers who intend to warehouse listening data for their own ML/BI cannot get the text out. It is a licensing constraint (upstream data terms), not a Brandwatch choice — but it applies to every vendor reselling licensed data, and it is worth raising explicitly in competitive conversations: *"can you actually export the text?"*

**30 requests / 10 minutes is the lowest documented rate limit of any vendor in this document** and effectively rules out real-time integrations.

### 7.4 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO | [K] yes |
| SCIM | [K] yes — verify |
| Data residency | [K] EU (Brandwatch is UK/Brighton-origin; Falcon was Copenhagen) — verify |
| SOC 2 / ISO 27001 | [K] yes |
| GDPR | [K] yes, strong European posture |
| FedRAMP | ❌ [K] |
| Audit log | [K] yes |
| Archiving partners | UNVERIFIED |

### 7.5 What Brandwatch does that Vista does NOT

100M+ source consumer research with deep boolean/segmentation; historical archive; **Data Upload API** for blending internal documents with social data; Iris AI analyst; Vizia command centres; X Audiences segmentation; Paladin-based influencer module; enterprise benchmarking.

---
## 8. Khoros

**Archetype:** A — Unified CXM, but community-centric rather than channel-centric.
**Ownership:** Vista Equity Partners. **Lineage:** Lithium Technologies + Spredfast + Jive-x → Khoros (2019); acquired **Flow.ai** (2022) → Khoros Flow [K].

### 8.1 Modules

Khoros delivers three modules deployable individually or as an integrated stack [S]:

| Module | What it is |
|---|---|
| **Khoros Communities** | Branded forums where customers help each other [S]. Modern platform is **Aurora**; legacy is **Classic** [K]. Includes gamification (ranks, badges, points), SEO-optimised public content, knowledge base, Q&A, ideation/product-ideas boards, moderation queues, TKB (Tribal Knowledge Base), member profiles [K] |
| **Khoros Care / Contact Center** | "Automates digital customer service across channels" [S]. Agent desktop with work queues, routing/priority, agent capacity, SLA, macros, tagging, CSAT, Khoros Care Analytics [K]. Channels: X, Facebook, Instagram, YouTube, TikTok, Reddit, WhatsApp, Apple Messages for Business, RCS, LINE, WeChat, Telegram, in-app chat, review sites, email [K] |
| **Khoros Marketing** (Spredfast lineage) | "Orchestrates campaigns across multiple platforms" [S]: publishing, campaign planning, listening/Intelligence, Command Center, Experiences (social-powered web experiences/galleries) [K] |
| **Khoros Flow** | Conversational AI / bot builder (Flow.ai lineage) [K] |

**Khoros Communities is the only serious owned-community product in this competitive set.** Nobody else — not Sprinklr, not Sprout, not Hootsuite — ships a branded forum platform. For enterprises whose support deflection strategy runs through a community, Khoros is effectively uncontested.

### 8.2 AI

- AI-powered chatbots handle routine inquiries; **intelligent routing escalates complex cases to human agents** [S].
- Khoros Flow conversational AI [K].
- Community: AI-assisted moderation, spam detection, content classification, answer suggestion from TKB [K].
- **Khoros' 2026 agentic story is the thinnest of the enterprise CXM vendors** — no branded agentic layer surfaced in this research, in sharp contrast to Sprinklr's AI+ Studio and Sprout's Trellis. Search returned no specific "Khoros AI agentic modules" as distinct 2026 offerings [S]. **UNVERIFIED whether one exists and simply did not surface.**

### 8.3 Pricing

- **No published pricing; contact sales for a demo and custom quote** [S].
- User-reported band: **$10,000–$50,000+ annually** [S].
- **Khoros Care is priced per agent seat**, with additional cost driven by **number of social profiles, message volume, and advanced features like AI-powered routing or sentiment analysis** [S].
- Communities is typically priced by registered members / page views / instance count [K].
- Realistic full-stack (Communities + Care + Marketing) enterprise deal: **$150k–$500k+/yr** [K, directional].

### 8.4 API

- Developer portal: `developer.khoros.com` and `khoros.ai/developer` [S]. Guides + API reference for **Khoros Care, Khoros Community, Khoros Marketing and Khoros Flow** [S].
- **Khoros Care APIs** — "integrate and interact with Khoros Care and Care Analytics, and the Automation Framework" [S].
- **Khoros Community API** — supports POST requests and searches using the **v1 API**; v2 uses **LiQL**, a SQL-like query language (`SELECT ... FROM messages WHERE ...`) [S/K].
- **Khoros Bulk Data API** — "a **daily extract of event logs** for a specified community, available in either **JSON format or as a flat CSV file**" [S]. This is a genuinely good enterprise pattern: raw event-level data out, daily, no rate-limit fight.
- Official **Python SDK** (`khoros` library, readthedocs) [S].
- Developer docs for Communities **require sign-in to the Khoros Atlas community** [S] — a minor but real friction for evaluators.
- Webhooks: **UNVERIFIED** — not surfaced in search.

### 8.5 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO / LDAP | [K] yes |
| SCIM | [K] yes |
| Community SSO (federated member identity) | [K] yes — critical for community deployments |
| PII masking / redaction in Care | [K] yes |
| Secure data collection in DMs | [K] yes |
| Audit trails, retention policies | [K] yes |
| Data residency | [K] US + EU |
| SOC 2 / ISO 27001 | [K] yes |
| HIPAA | [K] available |
| FedRAMP | ❌ [K] |
| Pharmacovigilance / adverse-event workflows | [K] supported |

### 8.6 What Khoros does that Vista does NOT

Owned branded **community platform** with gamification, SEO and knowledge base; contact-centre-grade **Care** with queues, capacity, SLA, QA and CSAT; **Flow** conversational AI; **Bulk Data API** with daily raw event-log export; LiQL query language; PII masking and secure DM data collection; pharma adverse-event workflows.

---

## 9. Meltwater

**Archetype:** C — Intelligence-first. Public (Oslo Børs → taken private by Altor/Marlin 2024) [K]. San Francisco / Oslo.
**Lineage:** acquired **Sysomos** (2018), **Klear** (2021), **Owler** (2021), **Linkfluence** (2021) [K].

### 9.1 Suite structure

The Meltwater Suite is organised into **eight main areas** [S]:

1. **Media Intelligence** — print, broadcast, online news monitoring
2. **Social Listening & Analytics**
3. **AI Visibility Tracking (GenAI Lens)** — tracks brand presence inside generative AI answers
4. **Media Relations** — journalist/influencer database, pitching, distribution
5. **Consumer Intelligence** — Linkfluence lineage
6. **Influencer Marketing** — including **Klear**
7. **Sales Intelligence** — Owler lineage
8. **Data & API Integration**

Publishing/engagement exists (Meltwater Engage / Meltwater Social) but is **not** Meltwater's centre of gravity [K].

**GenAI Lens is strategically the most interesting product in this whole document.** Tracking whether and how a brand appears in ChatGPT/Perplexity/Gemini answers is a net-new category ("AI visibility" / "answer engine optimisation") that no pure SMM vendor has claimed. It is also **cheap to build relative to social listening** because the data source is prompting the models, not licensing a firehose.

### 9.2 Pricing

| Data point | Value |
|---|---|
| Public tiers | **None. No monthly billing. No self-serve sign-up.** Annual contracts only [S] |
| Typical contract | **$16,000–$70,000/year**, **median ~$25,000** [S] |
| Real-world range | **~$15,000 to over $150,000/year** [S] |
| Influencer-marketing buyers | **$25,000–$73,000/year** [S] |
| **Klear influencer module** | **adds $10,000–$25,000/year** on top of base [S] |

Pricing variables: **number of users, volume of media sources monitored, modules included, geographic coverage, contract length** [S].

### 9.3 Data and listening

- Historically one of the small set of vendors with **X firehose-grade licensing** [K]; current X Enterprise status **UNVERIFIED**.
- Very strong on **non-social** sources: print, broadcast (TV/radio transcripts), podcasts, licensed news wires [K]. This is what intelligence-first buyers pay for and no SMM vendor matches it.
- Linkfluence brings European consumer-intelligence depth and image recognition [K].
- Reddit licensing status **UNVERIFIED**.

### 9.4 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO | [K] yes |
| SCIM | UNVERIFIED |
| Data residency | [K] US + EU (Norwegian/EU heritage) |
| SOC 2 / ISO 27001 | [K] yes |
| GDPR | [K] strong |
| **Data & API Integration** as a named suite area | ✅ [S] — implies first-class data-export/warehouse posture, which is unusual and good |
| Archiving partners | UNVERIFIED |
| FedRAMP | ❌ [K] |

### 9.5 What Meltwater does that Vista does NOT

Print/broadcast/podcast media monitoring; journalist database and PR distribution; **GenAI Lens** AI-answer visibility tracking; Klear influencer marketing; Owler sales/company intelligence; Linkfluence consumer intelligence; a named Data & API Integration product line.

---

## 10. Talkwalker (Hootsuite)

**Archetype:** C — Intelligence-first. **Acquired by Hootsuite, April 2024** [S]. Luxembourg.
Now the data engine behind Hootsuite **Lumen** and **Wisdom** [S]. Still sold standalone [S].

### 10.1 Data corpus — the asset

- **~150 million websites** and **more than 30 social channels** [S].
- "Billions of posts, articles, reviews and visual assets" processed into analytics dashboards [S].
- **"Industry's broadest data set — including many languages, visual/image recognition, and unsampled data access (e.g. X/Twitter Firehose)"** [S].
- ~10 years of historical data [K].
- Image/logo recognition across tens of thousands of brand marks [K].
- **Nielsen Social Content Ratings** lineage (acquired 2019) → TV/social convergence measurement [K].
- Talkwalker Alerts — free Google-Alerts replacement, a large top-of-funnel asset [K].

### 10.2 AI

- **Blue Silk™ AI** — "accurate sentiment analysis, automated **conversation clustering**, and competitive benchmarking, empowering teams across PR, Marketing and Customer Experience" [S].
- **Blue Silk™ GPT** — "distils social listening data into instant insights, **flagging brand activity, consumer pain points and potential crises**" [S].
- Conversation Clusters, Virality Map, IQ Apps (pre-built analytical templates) [K].
- Now feeding Hootsuite **Wisdom** [S].

### 10.3 Pricing

- Three tiers: **Core, Analyze, Business** — **no figures published** [S].
- No permanently free tier; sales demo required for a quote [S].
- Historical entry point ~**$9,600/year** [K-stale].
- Enterprise deployments commonly **$30k–$100k+/yr** depending on mention volume and channels [K, directional].

### 10.4 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO | [K] yes |
| SCIM | UNVERIFIED |
| Data residency | [K] EU (Luxembourg HQ, strong GDPR posture) |
| SOC 2 / ISO 27001 | [K] yes |
| API | [K] REST API for results export; exact rate limits UNVERIFIED |
| Raw-text export restrictions | UNVERIFIED — but the same upstream licensing constraints that hit Brandwatch [S] almost certainly apply |

### 10.5 What Talkwalker does that Vista does NOT

Unsampled X firehose access; 150M-website corpus; 10-year historical archive; image/logo/video recognition; TV/broadcast convergence; Blue Silk AI clustering and crisis detection; IQ Apps; Virality Map.

---

## 11. Later (+ Mavrck, Mavely)

**Archetype:** D — Creator-economy specialist with an SMM tool attached.
**Lineage [S]:** "In 2024, Mavrck and Later merged into one company... their mission now being to create the world's first **Social Revenue Platform™**. Later is founded on three success stories: **Mavrck**, the industry-leading influencer marketing solution (now **Later Influence™**); **Later**, the social media management platform (now **Later Social™**); and **Mavely**, the everyday creator platform."

### 11.1 Products

| Product | Function |
|---|---|
| **Later Social™** | SMM: scheduling, visual planner, link-in-bio (Linkin.bio), analytics, basic inbox [K]. Historically Instagram-first |
| **Later Influence™** | Enterprise influencer/ambassador/creator programme management (Mavrck lineage): discovery, recruitment, ambassador programmes, briefs, contracts, content approval, rights, payments, affiliate, measurement [K] |
| **Mavely** | Creator affiliate/link network — creators share trackable links, brands see actual attributed revenue [K]. Acquired 2024 [K] |
| **Later Services** | Managed services — "pairs its software with a services team that will **staff, plan and run campaigns** for a price" [S] |

### 11.2 Pricing

- **"Later's pricing lacks a free plan and transparent pricing"; the platform uses custom enterprise pricing with no self-serve signup and no published rates, requiring sales-led onboarding** [S] — this refers to the enterprise/Influence side.
- Later Social self-serve tiers historically: Starter ~$25/mo, Growth ~$45/mo, Advanced ~$80/mo, Agency ~$200/mo [K-stale] — **verify, may have been restructured after the 2026 enterprise pivot**.
- Later Influence enterprise contracts: **UNVERIFIED**; historically $30k–$100k+/yr [K].

### 11.3 Enterprise posture

| Item | Status |
|---|---|
| SAML SSO | [K] on Enterprise/Influence |
| SCIM | UNVERIFIED |
| Audit log | UNVERIFIED |
| Data residency | UNVERIFIED |
| SOC 2 | [K] yes |
| Creator payments (tax forms, 1099, global payouts) | ✅ [K] — a genuinely hard capability nobody else in the SMM set has |
| Content rights management with expiry | ✅ [K] |
| FTC disclosure enforcement | ✅ [K] |

### 11.4 What Later does that Vista does NOT

Full creator/ambassador programme lifecycle including **contracts, rights, and global creator payments with tax handling**; affiliate attribution to actual transactions via **Mavely**; managed campaign services; FTC disclosure compliance workflows.

**The Mavely angle deserves attention:** it is the only implementation in this document that ties social content to *verified transaction data* rather than modelled attribution. That is the honest answer to "prove social ROI."

---

## 12. Dash Social (formerly Dash Hudson)

**Archetype:** D — Visual/creative intelligence specialist. Halifax, Canada. Rebranded from Dash Hudson to Dash Social, January 2025 [K].

### 12.1 Pricing — the market's most interesting model

| Plan | Price [S] |
|---|---|
| **Grow** | **$499/month** |
| **Engage** | **$999/month** |
| **Advance** | **$1,999/month** |
| **Enterprise** | **$2,999+/month** [S] — one source says **$3,499+/month** [S-conflict] |

**"All plans include unlimited users but vary in features and brand allowances."** [S]

**This is the single most important commercial fact in this document.** Dash Social prices by **brand/profile allowance and feature tier, with unlimited seats**, in a market where the leader charges $399/seat/month. In an enterprise where 40 people want visibility, Dash costs $1,999/month and Sprout costs $15,960/month for the same headcount.

- No permanent free version; free trial available [S].
- Price varies by "social profile count, feature tier, contract length, and negotiation approach" [S].
- Enterprise tier adds **multi-brand governance, market-level benchmarks, and custom SSO** [S].

### 12.2 Modules

| Module | Notes |
|---|---|
| Social publishing/scheduling | Multi-network, visual-first calendar [K] |
| **Vision AI** | "Proprietary visual recognition technology that analyses image and video content to **predict performance before publishing** and recommend optimisation strategies" [S]. Included in Professional/Enterprise tiers, **not** in Essentials [S-conflict — tier names in this source don't match the Grow/Engage/Advance/Enterprise lineup; likely a stale tier naming] |
| **Predictive Ranking** | Ranks creative assets by predicted performance before publish [K] |
| Analytics & Insights | Cross-channel, owned + earned [K] |
| **Benchmarks** | Cross-channel and **market-level competitive benchmarks** (Enterprise) [S] |
| Creator/Influencer management | Discovery, campaign tracking, EMV [K] |
| Social Listening | Added 2024 [K] |
| Content Library / DAM | [K] |
| Audience Insights | [K] |

Network focus is visual-first: Instagram, TikTok, Pinterest, YouTube, plus Facebook, X, LinkedIn [K].

### 12.3 Enterprise posture

| Item | Status |
|---|---|
| **Custom SSO** | ✅ Enterprise tier [S] |
| SCIM | UNVERIFIED |
| **Multi-brand governance** | ✅ Enterprise tier [S] |
| Audit log | UNVERIFIED |
| Data residency | UNVERIFIED (Canadian company — Canadian residency may be available) |
| SOC 2 | [K] yes |
| API | [K] exists; details UNVERIFIED |

### 12.4 What Dash Social does that Vista does NOT

**Vision AI pre-publish performance prediction** (the genuinely differentiated capability); Predictive Ranking of creative; market-level competitive benchmarks; multi-brand governance; unlimited-user pricing.

---

## 13. Salesforce Social Studio — **DEAD**

**Status: RETIRED 18 November 2024.** [S]

Confirmed facts [S]:
- "Social Studio was retired on **November 18, 2024**. When existing contracts end or on November 18, 2024, whichever comes first, users can no longer access Social Studio. **Customer data will be deleted 90 days later.**"
- The retirement applied to the entire family: **Social Studio, Command Center, Social Studio Mobile App, Social Studio Automate, and Social Customer Service.**
- "Salesforce has partnered with **Sprout Social** to offer a comprehensive alternative... Sprout Social is integrated tightly with Marketing Cloud (including Marketing Cloud Intelligence) and Service Cloud." [S]
- Buyers also evaluated Sprinklr and Coosto as alternatives [S].

**Strategic consequences:**
1. Several thousand enterprise social seats were forcibly displaced in 2024–25. That migration wave is largely complete, but the **churn cohort is still unsettled** — buyers who were pushed to Sprout on Salesforce's recommendation rather than by choice.
2. **The 90-day data-deletion clause is the best argument in the market for data portability.** Enterprises lived through losing their social history. A challenger that ships genuine export + import is selling directly into that scar.
3. Salesforce has no owned social product and will not build one. Social CRM integration is now a partner surface — which means it is contestable.

---

## 14. Adobe — **NO SOCIAL MANAGEMENT PRODUCT**

**Adobe Social: deprecated 30 January 2020.** [S] — "As of January 30, 2020, Adobe officially deprecated the Adobe Social product. It is no longer available for use, and for customers wishing to purchase a Social Media Management platform, Adobe has **partnered with a leading Social Media Management provider**." Documentation lives under `experienceleague.adobe.com/en/docs/**discontinued**/using/social` [S].

**AEM's social surface is trivial:** "Social Media Sharing" in AEM Sites = share buttons on pages [S]. AEM Communities (the forum product) is also effectively end-of-life [K]. There is no publishing, no inbox, no listening.

**What Adobe actually offers in 2026 [S]:**

| Product | Social capability |
|---|---|
| **GenStudio for Performance Marketing** | Generative creation of paid social creative at scale; "users will soon be able to **publish content experiences directly to social media channels including Meta, TikTok and Snap**, or through display ad campaigns on Google's **Campaign Manager 360** and **Microsoft Advertising**" [S] |
| **GenStudio for Content Marketing** | "Analyse performance on social media platforms with AI and **schedule and publish directly to LinkedIn**" [S] |
| Adobe Express | Creative production, brand kits/templates [K] |
| Adobe Experience Platform (RTCDP) + Journey Optimizer | Audience/CDP and orchestration; paid-social audience activation [K] |
| Adobe Firefly | Commercially-safe generative imagery with IP indemnification [K] |

**Assessment:** Adobe is a **creative supply chain** and **paid** player, not an organic social management player. "Publish to Meta/TikTok/Snap" and "publish to LinkedIn" is single-network, campaign-adjacent publishing — no inbox, no listening, no care, no approvals designed for social ops.

**Where Adobe is genuinely strong and worth stealing from:** Firefly's **IP indemnification for AI-generated content**. In 2026 procurement, "will you indemnify us if your AI generates infringing content?" is a live question and almost no SMM vendor answers it. [K]

---

## 15. HubSpot Social

**Archetype:** CRM-bundled. Social is a feature of Marketing Hub, not a product.

### 15.1 Availability and pricing

| Fact | Value [S] |
|---|---|
| Plans with social | **Professional and Enterprise only** |
| Marketing Hub Professional | **$800/month** |
| Marketing Hub Enterprise | **$3,600/month for up to five seats**; additional seats **$75/month**; includes **10,000 marketing contacts** |
| One-time onboarding | **£3,000 Professional / £7,000 Enterprise** (≈$3,600–$8,400) |
| Buy social separately? | **No** — "You cannot buy HubSpot's social features separately; you're paying for the entire marketing suite" |
| Incremental cost for existing Pro customers | **Zero** — "social comes along for the ride" |

Social account limits: Professional **50**, Enterprise **300** [K — verify].

### 15.2 Networks — and the gaps

Supported [S]: **Facebook, Instagram, LinkedIn, X/Twitter, YouTube, Pinterest.**
**Not supported [S]: TikTok, Threads, Bluesky.**

Missing TikTok in 2026 is disqualifying for most consumer brands. This is HubSpot's clearest functional deficiency.

### 15.3 Features

- Publishing/scheduling, bulk upload, calendar [K].
- Social monitoring **streams** (keyword/mention monitoring) — not listening [K].
- Reports tied to campaigns [K].
- **The differentiator: social interactions land on the CRM contact timeline and can be attributed to deals and revenue.** No dedicated SMM tool does this natively [K].
- **Breeze** AI agents (2025+): Breeze Social Agent generates and schedules posts from brand voice; Breeze Content Agent; Breeze Customer Agent [K].

### 15.4 What is absent

No unified social inbox with care semantics; no true listening; no employee advocacy; no influencer module; no review management; no approval workflow of consequence; no social commerce; no TikTok.

### 15.5 Enterprise posture

SSO/SAML on Enterprise; SCIM available; audit log on Enterprise; EU data residency available (HubSpot offers EU hosting); SOC 2 Type II; ISO 27001; GDPR [K — HubSpot's general enterprise posture is strong; verify per-feature].

### 15.6 What HubSpot does that Vista does NOT

Native CRM contact/deal attribution of social interactions; Breeze agent framework operating across the whole CRM; enterprise CRM-grade identity and permissions.

---

## 16. Zoho Social

**Archetype:** SMB/mid-market, with an enterprise SKU and unusually strong sovereignty posture.

### 16.1 Pricing

| Plan | Price [S] |
|---|---|
| Free | $0 |
| **Standard** | **$15/month** (~$10 annual) |
| **Professional** | **$40/month** (~$27 annual) |
| **Premium** | **$65/month** |
| **Agency** | **$275/month** [S-conflict: another source says **$320/month**] |
| **Agency Plus** | **$400/month** [S-conflict: another source says **$460/month**] |
| **Enterprise** | **Custom (demo-only)** [S] |

- Annual billing: **33% off** [S].
- **"Each plan is priced per brand, not per user, with add-on costs for extra brands and team members."** [S]
- Enterprise includes: **unlimited social accounts / workspaces / team members, unlimited AI images, 1:1 onboarding call, priority feature requests, private WhatsApp support** [S].
- **There is no "Ultimate" plan for Zoho Social** — that tier name belongs to other Zoho products [S].

**Per-brand pricing is the second seat-tax-free model in this document** (after Dash Social) and it is why Zoho wins price-sensitive multi-brand comparisons.

### 16.2 Features

Publishing, calendar, bulk scheduling, SmartQ optimal timing, monitoring dashboard (keyword/mention columns), unified inbox, reports, collaboration/approvals, **Zia** AI assistant, CustomQ, Zoho CRM integration (lead capture from social), Zoho Desk integration (tickets from social), Zoho Analytics [K].

### 16.3 Enterprise posture — Zoho's real strength

| Item | Status |
|---|---|
| **Data residency** | ✅ **Multi-datacentre: US, EU (NL/IE), India, Australia, Japan, Canada, China, Saudi Arabia** [K]. Best residency coverage of any vendor in this document except possibly Sprinklr |
| SAML SSO | ✅ via Zoho Directory [K] |
| SCIM | [K] yes via Zoho Directory |
| Audit log | [K] yes |
| SOC 2 Type II / ISO 27001 / ISO 27017 / ISO 27018 | [K] yes |
| GDPR / DPA | [K] strong |
| HIPAA | [K] available on some Zoho services |
| FedRAMP | ❌ [K] |
| API | [K] REST API for Zoho Social; strong across Zoho One |

### 16.4 What Zoho does that Vista does NOT

Multi-region data residency selection; SSO/SCIM via a first-party directory; deep native CRM + helpdesk coupling; per-brand (seat-tax-free) pricing; a full business-suite context (Zoho One) that makes social nearly free at the margin.

---
## 17. Cross-Cutting: Data Access, Licensing and the Listening Cost Floor

This is the section that determines what a challenger can and cannot promise.

### 17.1 X / Twitter — the category's defining cost

| Fact | Detail |
|---|---|
| Legacy enterprise products | **PowerTrack, Decahose, Enterprise Search, Compliance Stream, Filtered Stream v1** — all **end-of-lifed** as part of the v1.1 retirement push (2023–2024) [S] |
| Current product | **"X Enterprise"** — v2 Filtered Stream Pro / Enterprise plans, or **fully custom data contracts**. Existing enterprise customers were migrated. [S] |
| Entry price | **~$42,000–$50,000 per month**, fully custom terms [S] |
| What it unlocks | Unlimited post reads, filtered streams, PowerTrack-equivalent delivery, direct support [S] |
| Self-serve tiers | Free / Basic / Pro exist but are volume-capped and unsuitable for listening [K] |

**Implications:**
- At ~$500k–$600k/year minimum, X data is a fixed cost that only vendors with 8-figure revenue can amortise. This is why **Talkwalker, Sprinklr, Brandwatch and Meltwater** are named as the leading listening platforms [S] and why mid-market tools either dropped X listening or repriced it as an add-on (Vista Social charges **$29/profile/month** for X — a direct API-cost pass-through).
- **For a challenger: do not attempt X listening at firehose grade.** Either buy from a licensed reseller at a metered rate, or scope X coverage explicitly to owned-account data (mentions/replies to your connected accounts, which the standard API supports) and say so plainly. Vendors who fudge this get found out in POCs.

### 17.2 Reddit

| Fact | Detail |
|---|---|
| Commercial Data API | **$0.24 per 1,000 API calls**; **requires a contract that Reddit reviews by hand** [S] |
| Top tier (AI training licensing) | Privately negotiated. The **Google deal is reportedly ~$60M/year** [S] |
| Who has listening coverage | Brandwatch, Talkwalker, Meltwater and Sprinklr are named as the leading 2026 listening platforms combining collection with sentiment/trend analysis [S]; **specific per-vendor Reddit licence terms are UNVERIFIED** |
| Note | "Coverage for certain high-value sources like Instagram, Reddit and Twitch often requires **premium add-on packages**" [S] |

**Implication:** Reddit is the most *achievable* premium source for a challenger — $0.24/1,000 calls is a real, publishable unit cost. A challenger could plausibly offer Reddit listening with transparent metered pricing, which nobody does.

### 17.3 TikTok

| API | 2026 status |
|---|---|
| **Research API** | **Closed to commercial users.** Eligibility restricted to verified academic institutions in **US, EEA, UK, Switzerland**, EU-registered non-profits, and **Brazilian** academic/non-profit researchers on youth safety. Requirements include independence from commercial interests, not-for-profit basis, a defined research proposal, and ethical review. **"Commercial users, creators and advertisers are explicitly ineligible."** [S] |
| Enforcement | "Commercial platforms that were using Research API access for content discovery workflows are **required to migrate to commercial API endpoints or a licensed third-party data provider**. Attempting to use Research API credentials for commercial use cases now **risks losing access entirely**." [S] |
| What remains for commercial vendors | Display API (owned account content), Content Posting API (publishing), Commercial Content API (ads transparency), Marketing/Ads API, plus licensed third-party resellers [S/K] |

**Implication:** **Nobody has real TikTok listening.** Every vendor's "TikTok listening" is either hashtag/keyword sampling via commercial endpoints or purchased from a scraper-adjacent reseller with legal risk. This is an honesty opportunity, and a risk flag when evaluating competitor claims.

### 17.4 Meta, LinkedIn, YouTube

| Platform | Constraints [K unless marked] |
|---|---|
| **Meta** | CrowdTangle shut down **14 Aug 2024**; replaced by **Meta Content Library**, approved researchers only. Commercial vendors use Instagram Graph API (Business/Creator accounts only), Pages API, IG Content Publishing API (**25 posts / 24h per IG account**). No public-post listening at scale |
| **LinkedIn** | Marketing Developer Platform + Community Management API, **partner-gated approval**. No listening surface at all. Brandwatch's API **blanks LinkedIn content entirely** on export [S] — evidence of how restrictive the terms are |
| **YouTube** | Data API v3, default **10,000 quota units/day**; higher quota by application |

### 17.5 The honest listening map for a challenger

| Tier | What you can credibly offer | Cost posture |
|---|---|---|
| **Owned** | Mentions, comments, DMs, tags on connected accounts across all networks | Included in platform APIs — free |
| **Public web** | News, blogs, forums, review sites, RSS, podcasts (transcription) | Cheap; commodity crawlers exist |
| **Reddit** | Metered via official Data API at $0.24/1k calls | Publishable unit economics [S] |
| **X** | Metered via licensed reseller, or owned-account only | Expensive; be explicit |
| **TikTok / Instagram public** | Sampled, hashtag-scoped, honest about limits | Legally constrained for everyone |
| **AI answer engines** | Brand visibility in ChatGPT/Perplexity/Gemini responses (Meltwater's GenAI Lens category) | **Cheap. Highest ratio of buyer interest to build cost in the market.** [S] |

---

## 18. Cross-Cutting: Pricing, Seat Models and Commercial Structure

### 18.1 Master pricing table

| Vendor | List entry | Enterprise list | Unit | Real ACV evidence |
|---|---|---|---|---|
| **Sprout Social** | $199/seat/mo (Standard, annual) [S] | Advanced $399/seat/mo; Enterprise custom [S] | **Per seat** | Influencer/Tagger avg **$21,431/yr** [S] |
| **Hootsuite** | $99/seat/mo [S] | $199–$399/seat/mo; Enterprise custom, **min 5 seats** [S] | **Per seat** | Vendr median **$12k/yr** (96 deals); SpendHound Ent avg **$155,813** [S-conflict] |
| **Sprinklr** | — (self-serve killed 30 Apr 2026) [S] | **$2,800–$4,700/user/yr**; Advanced Ent **$4,700/user/yr** [S] | **Per seat, role-banded** (admin/analyst/publisher/agent) [S] | Starts **~$50k**; median ACV **~$129,380** [S] |
| **Brandwatch** | Essentials **$108/mo** [S] | $800–$1,500/mo @1 user; $8k–$15k/mo @10 users [S] | Per user + data volume | Legacy Falcon $1,000/mo entry, $1,750/mo tier 2 [S] |
| **Meltwater** | None (no self-serve) [S] | Custom | Users + sources + modules + geography + term [S] | **$16k–$70k/yr, median ~$25k**; to $150k+ [S] |
| **Khoros** | None [S] | Custom | **Per agent seat** + profiles + message volume [S] | **$10k–$50k+/yr** [S] |
| **Emplifi** | Essential ~$200/mo [S-conflict] | Custom | Profiles + modules [K] | **$1k–$3k+/mo** [S] |
| **Talkwalker** | None [S] | Core / Analyze / Business, **no figures** [S] | Mentions volume + users [K] | UNVERIFIED |
| **Later** | Later Social self-serve [K]; **Later Influence has no self-serve** [S] | Custom [S] | Seats + creators [K] | UNVERIFIED |
| **Dash Social** | **$499/mo** [S] | **$2,999+/mo** (or $3,499+) [S-conflict] | **Brands/profiles + tier — UNLIMITED USERS** [S] | ~$6k–$42k+/yr |
| **HubSpot** | Marketing Hub Pro **$800/mo** [S] | Enterprise **$3,600/mo** (5 seats, +$75/seat) [S] | Hub tier + seats + contacts | + onboarding £3,000/£7,000 [S] |
| **Zoho Social** | $15/mo [S] | Enterprise custom [S] | **Per brand** [S] | Agency $275–320/mo; Agency Plus $400–460/mo [S-conflict] |
| **Salesforce Social Studio** | RETIRED [S] | — | — | — |
| **Adobe Social** | DEPRECATED 2020 [S] | — | — | — |

### 18.2 Seat model taxonomy — and why it matters

| Model | Vendors | Buyer consequence |
|---|---|---|
| **Pure per-seat, all features gated** | Sprout, Hootsuite | Broad internal visibility is unaffordable. Enterprises under-deploy: 8 licensed users, 60 people who need the data, screenshots in decks. |
| **Role-banded per-seat** | Sprinklr [S] | Better, but still taxes breadth; every stakeholder is a budget line. |
| **Per agent seat + volume** | Khoros [S] | Standard contact-centre economics; predictable but scales with headcount. |
| **Per brand / per profile, unlimited users** | **Dash Social** [S], **Zoho Social** [S] | Cost scales with *scope of business*, not *number of humans*. Strongly preferred by buyers. |
| **Bundled into a suite tier** | HubSpot [S] | Social is "free" if you already bought the suite; disqualifying if you haven't. |
| **Modules + volume + geography** | Meltwater [S], Brandwatch [S], Talkwalker [S] | Impossible to benchmark; every quote is bespoke; buyers feel exploited. |

**Design conclusion for us:** price on **scope** (brands, profiles, volume, data sources), not on **humans**. Give unlimited viewers/approvers/analysts. Charge for creators, connected profiles, listening volume, and premium data. This is simultaneously the most buyer-friendly and the most defensible model, and it directly attacks the category's most-hated attribute.

### 18.3 The hidden costs enterprise buyers always discover late

1. **Listening is always a separate line item** (Sprout, Hootsuite, Brandwatch, Emplifi) and is metered by volume/topics [S].
2. **Influencer is always a separate purchase** — Sprout/Tagger not included in any base plan [S]; Meltwater/Klear adds $10k–$25k/yr [S].
3. **Employee advocacy is always separate** (Sprout, Hootsuite Amplify/Parliament) [S/K].
4. **Compliance integrations are add-ons** — Hootsuite's Proofpoint is an Enterprise add-on [S].
5. **Onboarding/implementation fees** — HubSpot £3,000/£7,000 [S]; Sprinklr and Khoros implementations often 15–30% of year-one ACV [K].
6. **API access is tier-gated** — Sprout's Analytics API is Advanced+ [S].
7. **Minimum seats** — Hootsuite Enterprise min 5 [S].
8. **Premium data sources** — "Instagram, Reddit and Twitch often require premium add-on packages" [S].
9. **Multi-year auto-renewal with uplift caps** absent → 7–15% annual increases [K].

---

## 19. Cross-Cutting: Governance, Compliance, Identity and Procurement

### 19.1 Compliance and archiving vendor landscape

| Archiving/supervision vendor | What it does | Known SMM integrations |
|---|---|---|
| **Smarsh** (acquired Actiance 2018) | Enterprise Archive; capture connectors; supervision; eDiscovery; WORM retention for SEC 17a-4 | **Formal Hootsuite partnership** covering "archiving, supervision, discovery and production" of published social content [S]. Archiving Platform supports Facebook, X, LinkedIn, Instagram, YouTube, Vimeo, Pinterest and others [S] |
| **Proofpoint** (acquired Nexgate) | Social account protection, content compliance scanning, Threat Response, brand-impersonation takedown | **Hootsuite Enterprise add-on with real-time compliance checks inside Composer** [S]; **Amplify/Parliament natively connects Proofpoint Threat Response** [S] |
| **Global Relay** | Archiving/supervision for financial services | [K] connectors to major SMM platforms |
| **Theta Lake** | AI-based supervision of social, video, voice | [K] |
| **Veritas Merge1 / Mimecast** | Capture into enterprise archives | [K] |
| **Hearsay Systems** (Yext, 2024) | Advisor-level social compliance for financial services/insurance | [K] — distinct segment: individual advisor pages, not brand pages |

**Regulatory drivers that create the requirement [K]:** FINRA Rule 2210 + Regulatory Notices 17-18 / 19-31 (social media & digital communications), SEC Rule 17a-4 (WORM retention), SEC Marketing Rule (testimonials/endorsements, which makes social comments regulated content), FCA COBS 4 (UK financial promotions), MiFID II recordkeeping, HIPAA, and pharma adverse-event reporting obligations (FDA/EMA pharmacovigilance) which force AER detection workflows on any pharma social listening deployment.

**Critical observation: no SMM vendor ships native WORM-compliant archiving.** All of them integrate. That means every regulated deal carries a second vendor, a second contract, and a second security review — and the SMM vendor is at the mercy of the archiving vendor's connector roadmap. **A native, compliant archive with supervision queues and eDiscovery export would be a first in this category.**

### 19.2 Identity and access — vendor comparison

| Vendor | SAML SSO | SCIM 2.0 | Audit log | Audit export | Data residency |
|---|---|---|---|---|---|
| Sprout Social | ✅ Enterprise [S] | ❌ **None on any plan** [S] | ✅ 50+ events [S] | UNVERIFIED | UNVERIFIED (AWS-hosted [S]) |
| Hootsuite | ✅ Enterprise [K] | UNVERIFIED | ✅ [K] | UNVERIFIED | UNVERIFIED |
| Sprinklr | ✅ [K] | ✅ [K] | ✅ [K] | ✅ SIEM [K] | ✅ Multi-region [K]; **FedRAMP LI-SaaS** [S] |
| Khoros | ✅ + LDAP [K] | ✅ [K] | ✅ [K] | [K] | ✅ US/EU [K] |
| Brandwatch | ✅ [K] | ✅ [K] | ✅ [K] | UNVERIFIED | ✅ EU [K] |
| Emplifi | ✅ [K] | UNVERIFIED | ✅ [K] | UNVERIFIED | ✅ EU [K] |
| Meltwater | ✅ [K] | UNVERIFIED | UNVERIFIED | UNVERIFIED | ✅ EU [K] |
| Talkwalker | ✅ [K] | UNVERIFIED | UNVERIFIED | UNVERIFIED | ✅ EU [K] |
| Dash Social | ✅ **"custom SSO", Enterprise tier** [S] | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Later | ✅ Enterprise [K] | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| HubSpot | ✅ Enterprise [K] | ✅ [K] | ✅ [K] | ✅ [K] | ✅ EU [K] |
| Zoho Social | ✅ Zoho Directory [K] | ✅ [K] | ✅ [K] | [K] | ✅ **8 regions** [K] |
| **Vista Social** | ❌ | ❌ | Limited | ❌ | ❌ US only |

**The row that matters:** Sprout Social — the category's most-recommended enterprise tool and Salesforce's preferred partner — **has no SCIM**. Enterprise IT teams treat automated deprovisioning as a control requirement, not a convenience. This is a documented, current, exploitable gap in the market leader [S].

### 19.3 API and webhook quality comparison

| Vendor | Auth | Rate limit | Webhooks | Bulk/raw export | Verdict |
|---|---|---|---|---|---|
| **Sprinklr** | OAuth 2.0 + Partner OAuth [S] | **1,000 calls/hour; 10 calls/sec; 403 "Developer Over Rate"** [S] | ✅ Typed, discoverable via **Fetch Webhook Types API** [S] | [K] | Best object model (Message/Case/Profile/Task); **rate limit is low for the price** |
| **Khoros** | OAuth / session [K] | UNVERIFIED | UNVERIFIED | ✅ **Bulk Data API — daily event-log extract, JSON or flat CSV** [S] | Best raw-data export pattern in the market |
| **Sprout Social** | Bearer token [S] | UNVERIFIED | **UNVERIFIED — none surfaced** | Analytics API, Advanced+ only [S] | Good coverage (publishing, media, analytics, topics, engagement) [S]; webhook absence would be a real gap |
| **Brandwatch** | OAuth [K] | **30 requests / 10 minutes; HTTP 429** [S] | UNVERIFIED | ✅ but **X text stripped, LinkedIn blanked, news capped at 256 chars** [S] | **Worst rate limit and worst export restrictions** documented here |
| **Hootsuite** | OAuth 2.0 [K] | UNVERIFIED | Limited [K] | [K] | **MCP connectors are now the real surface** [S] |
| **Meltwater** | [K] | UNVERIFIED | UNVERIFIED | ✅ "Data & API Integration" is a named suite pillar [S] | Positioned as export-friendly |
| **Zoho / HubSpot** | OAuth 2.0 [K] | Well-documented [K] | ✅ [K] | ✅ [K] | Best-documented developer experience in this set |

**Design conclusions for us:**
- Ship **typed outbound webhooks** with retry + dead-letter + signature verification. Sprinklr's discoverable webhook-type API is a good pattern.
- Ship **bulk export** in Khoros' shape: daily event-level extract, JSON *and* flat CSV, no rate-limit fight, plus native warehouse destinations (Snowflake/BigQuery/S3).
- **Do not gate API access by plan tier.** Sprout gating the Analytics API to Advanced+ [S] is exactly the kind of pettiness that makes buyers cynical.
- Publish rate limits prominently. 1,000/hour (Sprinklr) and 30/10-min (Brandwatch) are competitive attack surface.

### 19.4 Enterprise procurement blockers — the real checklist

Enterprise purchases now involve **~10 stakeholders across IT, Finance, Legal, Security and Operations, each with functional veto power** [S]. Buyers "increasingly want audit reports, compliance documentation, and independently validated security controls — not just vendor security claims" [S]. **"If vendors can't provide SOC 2 Type II certification or comprehensively answer security questionnaires, CISOs veto on risk grounds."** [S]

| Blocker | Who vetoes | Mitigation |
|---|---|---|
| No SOC 2 Type II | CISO [S] | Type I in 3 months, Type II after a 6–12 month observation window. Start now. |
| No pen-test summary / no bug bounty | Security | Annual third-party pen test, publish exec summary under NDA |
| Cannot answer SIG Lite / CAIQ questionnaire | Security | Pre-fill both; publish a Trust Center |
| **No SCIM** | IT identity | Joiner-mover-leaver automation is a control, not a feature |
| No audit log export to SIEM | Security ops | Splunk/Sentinel/Datadog destinations |
| No EU/UK data residency | Legal/DPO [S] | Region selection; DPA with SCCs; sub-processor list |
| **Sub-processor list must name AI model vendors** | AI governance [S] | "Many AI platforms rely on third-party AI models for content generation, and enterprises need to understand **what data flows to these services and how it's protected**" [S] |
| No contractual "no training on customer data" | Legal [S] | Standard clause + zero-retention addenda with model vendors |
| No AI IP indemnification | Legal | Adobe Firefly set the expectation [K]; almost no SMM vendor matches it |
| No VPAT / WCAG 2.1 AA / Section 508 | Public sector, large regulated | Commission a VPAT |
| No FedRAMP | US federal | Only Sprinklr has it (**LI-SaaS**) [S]; not worth chasing early |
| Insufficient cyber insurance | Procurement | $5M+ typical requirement [K] |
| Non-standard MSA/DPA, no redlines accepted | Legal [S] | Accept redlines; pre-publish a negotiable MSA |
| No Ariba/Coupa, no PO/invoice, no W-9 | Procurement [S] | "Inability to integrate with their procurement system creates friction" [S] |
| No SLA with service credits | Procurement | 99.9% with credits |
| No named CSM / QBR / escalation path | Business owner | Tiered CS model |
| No exit/data-portability clause | Legal | The Social Studio 90-day deletion [S] made this a live concern |
| ESG questionnaire | Procurement | **67% of procurement leaders now consider ESG factors in vendor selection**; **84% of board members consider third-party risk a top enterprise risk** [S] |
| **EU AI Act documentation** | Legal/AI governance | GPAI transparency obligations from Aug 2025; high-risk obligations phasing to Aug 2026 [K]. Buyers now ask for AI system documentation |
| 2026 threat context | Security [S] | "The enterprise social media landscape in 2026 is fraught with sophisticated threats, including **deepfakes, AI-driven brand impersonation, and coordinated disinformation campaigns**." Enterprise platforms must offer "**automated data retention policies, secure archiving, and the ability to instantly execute 'right to be forgotten' requests across all social channels**" [S] |

---

## 20. Consolidated Feature Matrix

Legend: ✅ full · ◐ partial · ❌ absent · ? unverified

| Capability | Sprout | Hootsuite | Sprinklr | Emplifi | Brandwatch | Khoros | Meltwater | Talkwalker | Later | Dash | HubSpot | Zoho | **Vista** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Publishing/scheduling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ | ❌ | ✅ | ✅ | ◐ | ✅ | ✅ |
| Unified inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ | ❌ | ◐ | ✅ | ❌ | ✅ | ✅ |
| **Case management** | ◐ CRM | ◐ CRM | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ◐ | ◐ Desk | ❌ |
| **Routing/queues/capacity** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SLA + escalation** | ◐ | ◐ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ |
| **QA scoring** | ❌ | ❌ | ✅ [S] | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Voice / CCaaS** | ❌ | ❌ | ✅ [S] | ✅ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Owned community** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Listening (licensed, deep) | ◐ addon | ✅ Talkwalker | ✅ | ◐ | ✅ | ◐ | ✅ | ✅ | ❌ | ◐ | ❌ | ◐ | ◐ addon |
| **X firehose grade** | ? | ✅ [S] | ✅ | ? | ✅ | ? | ✅ | ✅ [S] | ❌ | ❌ | ❌ | ❌ | ❌ |
| Media monitoring (print/broadcast) | ❌ | ◐ | ◐ | ❌ | ◐ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI-answer visibility** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ GenAI Lens [S] | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Review management | ✅ | ◐ | ✅ | ✅ | ✅ | ◐ | ◐ | ✅ | ❌ | ❌ | ❌ | ◐ | ✅ |
| **Ratings & Reviews syndication** | ❌ | ❌ | ❌ | ✅ TurnTo | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Social commerce / live shopping** | ❌ | ❌ | ◐ | ✅ [S] | ❌ | ❌ | ❌ | ❌ | ◐ Mavely | ❌ | ❌ | ❌ | ❌ |
| Influencer module | ✅ Tagger [S] | ◐ | ✅ | ✅ | ✅ Paladin | ❌ | ✅ Klear [S] | ◐ | ✅ Mavrck [S] | ✅ | ❌ | ❌ | ❌ |
| **Creator payments/contracts** | ◐ | ❌ | ◐ | ◐ | ◐ | ❌ | ◐ | ❌ | ✅ | ◐ | ❌ | ❌ | ❌ |
| Employee advocacy | ✅ addon | ✅ Parliament [S] | ✅ | ◐ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Local/franchise (Distributed)** | ❌ | ◐ | ✅ | ◐ | ◐ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ❌ | ❌ |
| Paid social / ads mgmt | ◐ | ◐ | ✅ | ✅ | ✅ | ◐ | ❌ | ❌ | ❌ | ❌ | ◐ | ◐ | ◐ boost |
| **Conditional approval routing** | ? | ◐ | ✅ | ◐ | ◐ | ✅ | ❌ | ❌ | ◐ | ◐ | ❌ | ❌ | ❌ |
| **Compose-time policy engine** | ? | ✅ Proofpoint [S] | ✅ | ? | ? | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Archiving partner integration** | ? | ✅ Smarsh+Proofpoint [S] | ✅ | ? | ? | ✅ | ? | ? | ❌ | ❌ | ◐ | ❌ | ❌ |
| SAML SSO | ✅ [S] | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ [S] | ✅ | ✅ | ❌ |
| **SCIM** | ❌ [S] | ? | ✅ | ? | ✅ | ✅ | ? | ? | ? | ? | ✅ | ✅ | ❌ |
| Audit log | ✅ 50+ [S] | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ? | ? | ? | ✅ | ✅ | ◐ |
| **EU data residency** | ? | ? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ? | ✅ | ✅ | ❌ |
| **FedRAMP** | ❌ | ❌ | ✅ LI-SaaS [S] | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Public REST API | ✅ [S] | ✅ | ✅ [S] | ✅ | ✅ [S] | ✅ [S] | ✅ | ✅ | ◐ | ✅ | ✅ | ✅ | ✅ |
| Typed webhooks | ? | ◐ | ✅ [S] | ? | ? | ? | ? | ? | ? | ? | ✅ | ✅ | ◐ Zapier |
| **Bulk raw data export** | ◐ | ◐ | ◐ | ◐ | ◐ restricted [S] | ✅ [S] | ✅ | ◐ | ❌ | ◐ | ✅ | ✅ | ❌ |
| **MCP connector** | ? | ✅ [S] | ✅ Beta [S] | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ❌ | ✅ ~60 tools |
| Branded agentic AI | ✅ Trellis [S] | ✅ Wisdom [S] | ✅ AI+ Studio [S] | ◐ | ◐ Iris | ◐ | ◐ | ◐ Blue Silk [S] | ❌ | ◐ Vision AI | ✅ Breeze | ◐ Zia | ◐ Ask Vista |
| **Agent evaluation/QA framework** | ❌ | ❌ | ✅ [S] | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Unlimited users** | ❌ | ❌ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ [S] | ❌ | ✅ per-brand [S] | ❌ per-plan caps |
| White-label | ❌ | ❌ | ◐ | ◐ | ◐ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ | ✅ |
| Self-serve signup | ✅ | ✅ | ❌ [S] | ◐ | ◐ | ❌ | ❌ [S] | ❌ | ◐ | ◐ | ✅ | ✅ | ✅ |

---

## 21. Strategic Synthesis — Enterprise Capability at Self-Serve Simplicity

### 21.1 The core insight

The enterprise tier is defended by **three walls of very different heights**:

| Wall | Height | Verdict |
|---|---|---|
| **Paperwork & identity** (SOC 2, SCIM, audit, residency, DPA, VPAT, MSA) | **Low** — bounded engineering plus process | **Climb it. Then remove the gate entirely by making it self-serve.** No competitor does this. |
| **Care & governance engineering** (routing, SLA, QA, case objects, conditional approvals, policy engine) | **Medium** — 2–4 quarters of real work | Climb it selectively; prioritise conditional approvals + policy engine + SLA/escalation first (highest buyer salience per unit of effort). |
| **Licensed data corpus** (X firehose, historical archives, broadcast, Reddit at scale) | **High** — $500k+/yr fixed cost | **Do not climb.** Reframe: be excellent on owned + public web + Reddit (metered, publishable unit cost) + AI-answer visibility, and be conspicuously honest about the boundary. |

### 21.2 The positioning that follows

> **"Enterprise controls, self-serve. Turn on SSO, SCIM, audit export and EU residency from a settings page — not a sales call."**

Every competitor gates identity and governance behind "contact sales." Making those settings self-serve is:
- Cheap for us (the features are built once; the gate is the only thing removed).
- Devastating for them (their pricing power on Enterprise tiers depends on that gate).
- Immediately legible to buyers (a security reviewer can *verify it themselves in the trial*).

### 21.3 Prioritised build sequence

**Phase 1 — Become procurable (0–6 months). Nothing else matters until this is done.**
1. SOC 2 Type I → Type II observation window started.
2. **SAML 2.0 SSO** (self-serve config, IdP-agnostic, metadata upload).
3. **SCIM 2.0** — provisioning, updates, **deprovisioning**, group→role mapping. *Directly attacks Sprout's documented gap.*
4. Immutable **audit log**, 50+ event types, **CSV + API export**, Splunk/Sentinel destinations.
5. Trust Center: pre-filled SIG Lite + CAIQ, pen-test exec summary, sub-processor list **naming AI model vendors**, "no training on customer data" clause, DPA with SCCs, 99.9% SLA with credits.
6. VPAT / WCAG 2.1 AA statement.
7. Procurement plumbing: W-9, PO/invoice billing, Ariba/Coupa-friendly, negotiable MSA, $5M cyber insurance.

**Phase 2 — Governance parity (6–12 months).**
8. **Conditional approval routing** (route by network, spend, market, keyword match, risk score) — nobody at mid-market has it.
9. **Compose-time content policy engine** — banned terms, regex, required disclosures/disclaimers, claims checks, mandatory alt-text. Position as "Proofpoint-grade, included."
10. Publishing freeze windows / crisis lock.
11. Retention policies + legal hold + "right to be forgotten" execution across connected channels [S: named as a 2026 requirement].
12. **Native archive** with WORM-mode retention, supervision queues and eDiscovery export — *a genuine category first*. Plus Smarsh/Proofpoint/Global Relay connectors for buyers already standardised.
13. **EU + UK data residency as a signup-time region selector**, with region-pinned AI inference.

**Phase 3 — Care depth (9–18 months).**
14. First-class **Case** object (not just messages) with CRM bidirectional sync.
15. Queues, skills-based routing, agent capacity/concurrency.
16. SLA policies with breach escalation; CSAT in-channel.
17. Conversation QA scoring.
18. Secure PII collection in DMs.

**Phase 4 — The agent trust layer (parallel, 6–18 months). This is the differentiator.**
19. Copy and beat Sprinklr's pattern: **build → simulate on historical data → score → deploy with autonomy level → immutable decision trace → one-click rollback.**
20. Three explicit autonomy modes per agent: **assisted / semi-autonomous (human approves) / autonomous (post-hoc audit)** — matching Sprinklr's stated model [S] but exposed as a simple per-agent toggle rather than a professional-services configuration.
21. **Agent decision traces as audit-log entries.** No competitor does this. It converts "AI risk" from a procurement blocker into a procurement *advantage*.
22. Keep and extend the MCP server — Vista's ~60-tool MCP surface is already at parity with Hootsuite's and ahead of Sprinklr's Beta [S].

**Phase 5 — Underserved wedges (opportunistic).**
23. **AI-answer visibility tracking** (the GenAI Lens category [S]) — highest buyer-interest-to-build-cost ratio in the market, and no SMM vendor has claimed it.
24. **Migration tooling** — import from Sprout / Hootsuite / Sprinklr / Later. The Social Studio 90-day deletion [S] left a permanent scar; portability sells.
25. **Multi-location / franchise** hierarchy (global → region → market → location) with brand-locked templates and local ad budgets — Sprinklr Distributed's capability at self-serve price.
26. **Reddit listening with published metered pricing** ($0.24/1,000 calls upstream [S] → publish a transparent markup). Nobody publishes listening unit economics.
27. **UGC/influencer rights expiry enforced at publish time** — small build, high trust value.

### 21.4 Pricing model recommendation

Adopt **Dash Social's structure, at Vista's price point, with enterprise controls included**:

- **Unlimited users on every plan.** Viewers, approvers, analysts, executives — free.
- Price on **scope**: connected profiles, brands/workspaces, listening volume, premium data sources.
- **Enterprise controls (SSO, SCIM, audit export, RBAC, residency) included from the mid tier up** — not a custom-quoted Enterprise SKU.
- **Publish enterprise pricing.** In a category where Meltwater has "no public tiers, no monthly billing, no self-serve sign-up" [S] and Brandwatch is "impossible to find out the price without booking a call" [S], published pricing is a differentiator in itself.
- Meter honestly on the things that genuinely cost money (listening volume, premium sources, AI generation) and publish the unit rates.

### 21.5 The three claims we can make that no competitor can

1. **"Your security team can verify our controls during the free trial."** Every competitor requires a sales cycle to see SSO/SCIM/audit.
2. **"Every AI action is logged, traceable, reversible, and gated at an autonomy level you choose."** Only Sprinklr is near this, and only via professional services.
3. **"Unlimited users. Published prices. Export everything."** Directly negates the category's three most-hated attributes: the seat tax, opaque pricing, and data lock-in.

---

## 22. Verification Backlog — What a Human Must Confirm

The search budget was exhausted after ~20 enterprise queries and **every** direct page fetch was blocked. The following must be verified before any of this drives pricing or roadmap commitments.

### 22.1 Highest priority (commercially load-bearing)

| # | Item | Where to look |
|---|---|---|
| 1 | Sprout Social current plan prices, annual vs monthly, and the "Essentials $79" tier | `sproutsocial.com/pricing`, and the plan-details PDF at `media.sproutsocial.com/uploads/plan-details.pdf` |
| 2 | Sprout add-on list prices: Premium Analytics, Listening, Employee Advocacy | Sprout pricing page add-ons section |
| 3 | **Confirm Sprout still has no SCIM** — the single most exploitable finding here | `support.sproutsocial.com` SSO article + a sales call |
| 4 | Hootsuite 2026 plan lineup and prices post-Social OS; whether MCP is on all plans | `hootsuite.com/plans`, `hootsuite.com/plans/enterprise` |
| 5 | Hootsuite Enterprise real ACV — reconcile Vendr $12k median vs SpendHound $155,813 | Vendr, SpendHound, direct quotes |
| 6 | Sprinklr per-seat bands by role (admin/analyst/publisher/agent) and current minimums | Sprinklr sales; Vendr/Spendhound |
| 7 | Dash Social Enterprise price ($2,999 vs $3,499/mo) and exact "unlimited users" terms | `dashsocial.com/pricing` |
| 8 | Zoho Social Agency / Agency Plus prices ($275/$400 vs $320/$460) | `zoho.com/social/pricing.html` |
| 9 | Emplifi's actual plan lineup and prices | `emplifi.io/pricing` |
| 10 | Brandwatch Essentials $108/mo — what it actually includes | `brandwatch.com/pricing` |

### 22.2 Capability verification

| # | Item |
|---|---|
| 11 | Does Sprout's Public API expose **outbound webhooks**? |
| 12 | Sprout API rate limits (exact) |
| 13 | Hootsuite SCIM support on Enterprise |
| 14 | Hootsuite / Sprout **EU data residency** availability |
| 15 | Sprinklr's current per-region data residency list |
| 16 | Sprinklr's **current** SOC 2 attestation date (the search-verified announcement is from 2015) |
| 17 | Whether Sprinklr FedRAMP has moved beyond **LI-SaaS** to Moderate |
| 18 | Khoros' 2026 agentic AI story — does a branded agent exist? |
| 19 | Khoros webhook support |
| 20 | Whether **Trellis can take write actions** (auto-publish, auto-reply) unattended, and any approval gating |
| 21 | Whether **Wisdom** can take write actions unattended |
| 22 | Talkwalker's Core/Analyze/Business tier contents and any pricing |
| 23 | Later Social's current self-serve tiers post-2026 restructuring |
| 24 | Dash Social tier names — reconcile Grow/Engage/Advance/Enterprise vs Essentials/Professional/Enterprise in the Vision AI source |
| 25 | HubSpot social account limits (Pro 50 / Enterprise 300?) |
| 26 | Emplifi SCIM, residency, archiving partners |
| 27 | Per-vendor **Reddit** licensing status (Brandwatch, Talkwalker, Meltwater, Sprinklr, Sprout) |
| 28 | Per-vendor **X Enterprise** contract status post-v1.1 retirement |
| 29 | Whether Smarsh/Global Relay/Theta Lake have connectors for **Sprout** and **Sprinklr** (only the Hootsuite partnership was confirmed) |
| 30 | Whether any vendor offers **AI IP indemnification** for generated content |

### 22.3 Method note for the next research pass

The egress proxy blocked **100% of attempted hosts**. A future pass needs either (a) a session with a widened egress allowlist covering vendor domains, developer portals and G2/Capterra/Vendr, or (b) a human doing the page-reading. **Search-only research systematically under-reports negative facts** — absence of evidence in a search summary is not evidence of absence, which is why so many rows above are marked `?` rather than `❌`.

---

## 23. Sources

Search-retrieved during this session (12 Aug 2026). Pages were **not** directly rendered — see §0.1.

**Sprout Social**
- https://sproutsocial.com/pricing/
- https://media.sproutsocial.com/uploads/plan-details.pdf
- https://support.sproutsocial.com/hc/en-us/articles/360025655491-Single-Sign-on-SSO
- https://support.sproutsocial.com/hc/en-us/articles/4403695458829-Security-Best-Practices
- https://www.stitchflow.com/scim/sprout-social
- https://www.stitchflow.com/user-management/sprout-social/api
- https://sproutsocial.com/insights/press/sprout-social-unveils-its-ai-powered-social-intelligence-platform-and-the-expansion-of-its-proprietary-ai-agent-trellis/
- https://sproutsocial.com/ai/features/ai-agent/
- https://support.sproutsocial.com/hc/en-us/articles/41393069691149-Meet-Trellis-Sprout-s-new-AI-Agent
- https://support.sproutsocial.com/hc/en-us/articles/46017877635213-Trellis-Studio
- https://sproutsocial.com/product-updates/2026-q1/
- https://api.sproutsocial.com/docs/changelog/
- https://support.sproutsocial.com/hc/en-us/articles/360045006152-Sprout-Public-API
- https://sproutsocial.com/integrations/
- https://sproutsocial.com/salesforce/
- https://www.vendr.com/marketplace/sprout-social
- https://www.g2.com/products/sprout-social-influencer-marketing/pricing

**Hootsuite / Talkwalker**
- https://www.hootsuite.com/plans/enterprise
- https://www.hootsuite.com/newsroom/press-releases/hootsuite-rebuilds-for-ai-era-introducing-wisdom
- https://www.globenewswire.com/news-release/2026/06/24/3316916/0/en/hootsuite-rebuilds-for-the-ai-era-introducing-wisdom-a-social-first-ai-agent-turning-social-signals-into-action.html
- https://blog.hootsuite.com/social-media-ai-tools/
- https://blog.hootsuite.com/new-features-june-2026/
- https://blog.hootsuite.com/social-media-compliance-tools/
- https://www.carahsoft.com/resources/30100-hootsuite-social-os
- https://www.smarsh.com/press-release/hootsuite-teams-smarsh-offer-best-class-social-media-compliance-platform-businesses/
- https://www.vendr.com/marketplace/hootsuite
- https://www.spendhound.com/marketplace/hootsuite-pricing
- https://costbench.com/software/social-media-management/hootsuite/
- https://www.hootsuite.com/talkwalker
- https://ai-cmo.net/tools/talkwalker
- https://www.merciv.com/blog/talkwalker-competitors-alternatives

**Sprinklr**
- https://www.sprinklr.com/products/
- https://www.sprinklr.com/products/platform/ai-agents/
- https://www.sprinklr.com/newsroom/sprinklr-unveils-next-wave-of-ai-native-customer-experience/
- https://www.sprinklr.com/newsroom/sprinklr-introduces-new-ai-capabilities-to-help-brands-move-from-insights-to-real-time-customer-action/
- https://www.cmswire.com/customer-experience/sprinklr-ships-16-ai-features-for-realtime-cx/
- https://www.cxtoday.com/customer-analytics-intelligence/sprinklr-summer-26-release-ai-cx-action/
- https://aragonresearch.com/sprinklr-the-agentic-cx-revolution/
- https://www.sprinklr.com/newsroom/sprinklr-positioned-for-public-sector-growth-with-fedramp-authorized-cxm/
- https://investors.sprinklr.com/news/press-releases/detail/52/sprinklr-completes-soc-1-and-soc-2-certification
- https://dev.sprinklr.com/api-overview
- https://dev.sprinklr.com/api2-0
- https://www.sprinklr.com/help/articles/platform-modules/the-sprinklr-apis/633c5c2359534970b26f96ae/
- https://chatarmin.com/en/blog/sprinklr-pricing
- https://postplanify.com/sprinklr-pricing
- https://www.spendhound.com/marketplace/sprinklr-pricing
- https://secure.businesswire.com/news/home/20260313038077/en/Sprinklr-Named-a-Leader-in-the-2026-Gartner-Magic-Quadrant-for-Voice-of-the-Customer-Platforms

**Emplifi**
- https://emplifi.io/pricing/
- https://emplifi.io/solutions/social-marketing/
- https://emplifi.io/solutions/social-commerce/
- https://emplifi.io/
- https://socialrails.com/blog/emplifi-pricing

**Brandwatch**
- https://www.brandwatch.com/products/apis/
- https://www.brandwatch.com/products/consumer-research/features/
- https://developers.brandwatch.com/docs/rate-limiting
- https://developers.brandwatch.com/docs/best-practices
- https://www.agorapulse.com/blog/social-media-management-tools/brandwatch-pricing-revealed/
- https://www.itqlick.com/falcon-social-media-management/pricing
- https://www.vendr.com/marketplace/brandwatch

**Khoros**
- https://developer.khoros.com/
- https://developer.khoros.com/khoroscaredevdocs/reference/care-apis
- https://community.khoros.com/kb/khoros-communities-aurora-docs/using-the-khoros-bulk-data-api/772410
- https://khoros.readthedocs.io/en/beta/bulk-data-api.html
- https://socialrails.com/blog/khoros-pricing
- https://www.vendr.com/marketplace/khoros

**Meltwater**
- https://www.vendr.com/marketplace/meltwater
- https://www.influencer-hero.com/blogs/meltwater-pricing
- https://ai-cmo.net/tools/meltwater
- https://checkthat.ai/brands/meltwater/pricing

**Later / Mavrck**
- https://www.g2.com/products/later-influence/reviews
- https://www.capterra.com/p/186912/Mavrck/
- https://www.storika.ai/compare/storika-vs-later-influence

**Dash Social**
- https://www.g2.com/products/dash-social/pricing
- https://www.socialchamp.com/blog/dash-social-pricing/
- https://socialrails.com/blog/dash-social-review
- https://archive.com/blog/dash-hudson-pricing

**Salesforce / Adobe**
- https://help.salesforce.com/s/articleView?id=release-notes.rn_marketing_engagement_ss_retirement.htm
- https://www.salesforceben.com/marketing-cloud-social-studio-to-be-retired/
- https://experienceleague.adobe.com/en/docs/discontinued/using/social
- https://business.adobe.com/products/genstudio.html
- https://business.adobe.com/products/genstudio/content-marketing.html
- https://news.adobe.com/news/2025/03/adobe-expands-genstudio-content-supply-chain

**HubSpot / Zoho**
- https://socialrails.com/blog/hubspot-social-media-pricing
- https://socialrails.com/blog/hubspot-social-media-review
- https://cargas.com/software/hubspot/pricing/
- https://socialrails.com/blog/zoho-social-pricing
- https://postplanify.com/zoho-social-pricing
- https://www.socialchamp.com/blog/zoho-social-pricing/

**Data access / APIs / platform policy**
- https://developers.tiktok.com/products/research-api/
- https://www.keyapi.ai/blog/tiktok-research-api-commercial-trend-scanning/
- https://www.xpoz.ai/blog/guides/tiktok-research-api-limits-access-and-alternatives/
- https://postproxy.dev/blog/x-api-pricing-2026/
- https://twitterapi.io/blog/twitter-firehose-pricing-comparison
- https://api.sorsa.io/blog/twitter-api-pricing-2026
- https://www.socialcrawl.dev/blog/reddit-data-api-2026
- https://coldiq.com/blog/best-reddit-apis
- https://apidirect.io/blog/social-listening-api

**Procurement / compliance**
- https://www.esecurityplanet.com/compliance/soc-2-compliance-is-reshaping-enterprise-procurement/
- https://www.hashmeta.ai/en/blog/enterprise-ai-social-media-manager-complete-security-governance-procurement-checklist-for-specialists
- https://www.iteratorshq.com/blog/enterprise-readiness-for-startups-common-deal-blockers-at-security-review-legal-and-procurement/
- https://www.authencio.com/blog/12-best-enterprise-social-media-platforms-secure-scalable
- https://govramp.org/blog/2026-program-modernization-and-adoption/

---

*End of document.*
