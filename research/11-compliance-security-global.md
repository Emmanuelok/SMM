# 11 — Compliance, Security, Trust & Legal: The Global Surface

**Prepared:** 12 August 2026
**Scope:** Everything that must be true, contractually and legally, for a multi-tenant social media management SaaS to (a) hold OAuth credentials for millions of third-party social accounts, (b) sell to enterprises and regulated industries, and (c) operate worldwide.
**Purpose:** This is the blocker inventory. Not a survey of "compliance best practice" — a list of the specific gates that stop deals and the specific architectural decisions that must be made *before* the first line of the token vault is written, because they are not retrofittable.
**Companion docs:** `06-platform-apis-tier1.md` §10 (app review mechanics), `07-platform-apis-tier2.md` §15.2 (token vault requirements derived from tier-2), `08-platform-apis-regional.md` §14.6 (sovereign shards), `09-ai-frontier.md` §8 (EU AI Act Art. 50, C2PA — **the AI-transparency analysis lives there and is not repeated here**).

---

> ## ⛔ PROVENANCE WARNING — READ BEFORE RELYING ON ANY CLAIM IN THIS FILE
>
> This document was produced under the same degraded network conditions that constrained
> files `06`–`10`, and the constraint is worse for *this* subject matter than for any other
> file in the corpus, because compliance facts are (a) jurisdiction-specific, (b) dated, and
> (c) exactly the kind of thing where being 6 months stale produces a confidently wrong answer.
>
> | Capability | Status this session |
> |---|---|
> | `WebSearch` | **Exhausted before this agent started** — 200/200 session budget consumed by files `01`–`04`. Zero searches available. |
> | `WebFetch` to primary legal/vendor sources | **Blocked.** `EGRESS_BLOCKED` returned for every one attempted, including the exact primary sources for this task: `developers.facebook.com`, `developers.google.com`, `legal.linkedin.com`, `ftc.gov`, `gdpr-info.eu`, `w3.org`, `artificialintelligenceact.eu`. |
> | `api.github.com` | **Blocked** (HTTP 403). |
> | `raw.githubusercontent.com` | **Reachable.** Primary live-research channel this session. |
> | GitHub code/repo search (via MCP) | **Reachable.** Used to discover file paths, then fetched via `raw.`. |
> | GitHub file read (via MCP `get_file_contents`) | **Restricted to `Emmanuelok/SMM`** — cannot read other repos through MCP; `raw.` was the workaround. |
> | Prior corpus (`01`–`10`) | **Available.** Files `01`–`05` were gathered with full web access on 12 Aug 2026. |
>
> **Consequence.** No statute text, no regulator page, no certification body page, and no
> platform developer-terms page was read directly. Everything below is either pulled this
> session from a GitHub-hosted artifact, carried from this corpus, or drawn from model
> knowledge with a **May 2026 training cutoff** — a minimum 3-month blind spot in a field
> where the EU shipped an AI Act omnibus, the US added three state privacy laws, and at
> least one adequacy decision was under active litigation inside that window.
>
> **This file is a map of the terrain and a work plan. It is not legal advice and no number
> in it should reach a customer contract, a security questionnaire, or a board paper without
> the verification pass in §17.**

### Evidence grades used throughout

| Grade | Meaning | How much weight it bears |
|---|---|---|
| `[GH]` | Pulled this session from a GitHub-hosted artifact via `raw.githubusercontent.com`. Source named inline. | High for *what the artifact says*. The artifact itself may be wrong — see the Oregon/Colorado date errors called out in §7.2. |
| `[CORPUS]` | Carried from files `01`–`10` in this directory. Inherits their grading. | As graded there. |
| `[K]` | Model knowledge, **May 2026 cutoff**. Not re-verified this session. | Structural claims (what GDPR Art. 28 requires, how SOC 2 works, what WCAG 2.2 AA contains) are stable and safe to plan against. Dates, prices, thresholds, and enforcement status are **not**. |
| `[K-STRUCT]` | Model knowledge about something that changes on a decade timescale — the existence and shape of a legal regime, the mechanics of an audit. | Safe to architect against. |
| `[K-VOL]` | Model knowledge about something known to be volatile — adequacy decisions, effective dates in the near future, certification pricing, enforcement posture. | **Treat as hypothesis. Verify before use.** |
| `UNVERIFIED` | Genuinely unknown. Stated as unknown, not guessed. | Do not cite. |

### Artifacts pulled this session

| Artifact | What it gave |
|---|---|
| `open-agreements/open-agreements` → `surveys/privacy/us.md` | State-by-state US comprehensive privacy law survey: 22 states, thresholds, rights, cure periods, enforcement, private rights of action. **Contains at least two effective-date errors** (§7.2). |
| `JoelLewis/finance_skills` → `plugins/compliance/skills/books-and-records/SKILL.md` | SEC 17a-4 / FINRA 4511 / 3110 / 4513 retention periods, WORM vs. audit-trail alternative, social media static-vs-interactive supervision split, off-channel enforcement totals. |
| `OpenMined/Hackathon-DSA` → `data/platform-docs-versions-english/X_Twitter-API-V2/Compliance.md` | X batch-compliance job mechanics: 4-step flow, 5 event types, 15-minute upload URL expiry, 7-day result expiry. |
| `OpenMined/Hackathon-DSA` → `data/platform-docs-versions-english/Linkedin_API/API.md` | **LinkedIn Compliance API (`r_compliance`/`w_compliance`) is closed to new applicants.** Load-bearing for the archiving strategy (§13.4). |
| `Fettifi/fetti_crm_saas_clean` → `compliance/Meta-App-Review-Packet.md` | Meta App Review practical sequence, the "one successful Graph API call per permission within 30 days before submission" prerequisite, 2–5 business day review, annual Data Use Checkup as a post-approval obligation. |
| `Sushegaad/Claude-Skills-Governance-Risk-and-Compliance` → `README.md` | Framework coverage map across 30 regimes with per-framework key obligations: FedRAMP CR26 OSCAL mandate, NIS2 24h/72h/1-month, DORA Art. 19, PCI DSS v4.0.1 SAQ types, ISO 42001 38 Annex A controls, CCPA 45-day SLA. |
| `Chiaro-HQ/methodology` → `README.md` | SOC 2 audit mechanics: 89 controls → 61 Trust Services Criteria, 369 test attributes, 22 evidence sources, complete-population vs. sampling, AT-C 205 CPA opinion requirement. |
| `OWASP/CheatSheetSeries` → `Secrets_Management_Cheat_Sheet.md`, `Cryptographic_Storage_Cheat_Sheet.md` | DEK/KEK envelope encryption, KEK-separate-from-DEK rule, AES-GCM/CCM preference, ~34 GB rekey threshold for 64-bit block ciphers, rotation strategies, secret-zero problem, CloudHSM/Nitro Enclaves BYOK. |

---

## Table of contents

1. [Executive summary — the blocker list](#1-executive-summary)
2. [What we actually hold — the compliance surface](#2-what-we-actually-hold)
3. [GDPR and UK GDPR](#3-gdpr-and-uk-gdpr)
4. [International transfers and data residency](#4-international-transfers-and-data-residency)
5. [DSAR, erasure and retention across social data](#5-dsar-erasure-and-retention)
6. [EU Digital Services Act, AI Act, ePrivacy](#6-eu-dsa-ai-act-eprivacy)
7. [United States — CCPA/CPRA and the state patchwork](#7-united-states)
8. [The rest of the world](#8-rest-of-world)
9. [Security certifications buyers demand](#9-security-certifications)
10. [Token and credential security](#10-token-and-credential-security)
11. [Breach blast-radius containment and incident history](#11-breach-blast-radius-and-incident-history)
12. [Platform policy compliance — the caching limits that constrain analytics](#12-platform-policy-compliance)
13. [Content and industry regulation](#13-content-and-industry-regulation)
14. [Accessibility](#14-accessibility)
15. [Trust, safety, sanctions and age assurance](#15-trust-safety-sanctions-age-assurance)
16. [Risk register, sequencing and cost model](#16-risk-register-sequencing-cost)
17. [Verification plan](#17-verification-plan)

---

## 1. Executive summary

### 1.1 Fifteen findings that change the build

1. **The token vault's key hierarchy is the single most consequential irreversible decision in the product.** Per-tenant key isolation is what converts "GDPR erasure" from a distributed-deletion problem into a *crypto-shredding* problem (delete one KEK, all that tenant's ciphertext becomes noise), and it is what caps breach blast radius at one tenant instead of all of them. Retrofitting per-tenant keys onto a single-key vault means re-encrypting every row for every customer under a live production load. **Decide this before the first token is stored.** (§10.3)

2. **`LinkedIn's Compliance API is closed to new applicants.`** `[GH]` The `r_compliance` / `w_compliance` permissions that enable capture and supervised archiving of LinkedIn communications are marked "Access is closed and may not be requested." This is not a paperwork problem — it means **we cannot natively serve FINRA/SEC-supervised customers on LinkedIn**, and the incumbents who can (Smarsh, Global Relay, Proofpoint, Hearsay) hold grandfathered access that functions as a structural moat. The only viable path for regulated-industry customers is integration with those archivers, not replacement of them. (§13.4)

3. **Every tier-1 platform imposes a different data-retention ceiling, and the binding constraint on our analytics warehouse is the strictest one that touches a given table.** The architecture must model retention *per source platform per field class*, not per table. A single "post_metrics" table holding Meta, X and YouTube data inherits X's 30-day private-metrics wall and YouTube's stored-data refresh obligation simultaneously. (§12)

4. **Meta's annual Data Use Checkup / Data Protection Assessment is an app-wide kill switch, not a form.** `[CORPUS]` Failure revokes permissions across the entire app — every tenant's connection dies at once, not just the non-compliant one. This is the highest-severity single point of failure in the whole compliance surface and it recurs annually forever. (§12.2)

5. **SOC 2 Type II is not the hard part; the *observation window* is.** A Type II opinion covers a period, typically 3 months minimum and 12 months at steady state. You cannot buy your way past calendar time. The practical consequence: **if enterprise revenue is wanted in month 12, the control environment must be operating by month 6–9.** Type I (point-in-time) exists precisely to bridge this and should be scheduled deliberately, not as a fallback. (§9.1)

6. **EU AI Act Article 50 has been in force since 2 August 2026 — ten days before this corpus was written — and was explicitly *not* postponed by the Digital Omnibus.** `[CORPUS from 09]` The watermarking grace period for systems already on the market ends **2 December 2026**. Penalties reach €15M or 3% of worldwide turnover. Full analysis is in `09-ai-frontier.md` §8; the compliance-architecture consequence is in §6.2 here: **per-post approval records are a compliance artifact**, because Art. 50(4b)'s editorial-responsibility exception is what exempts human-approved brand posts from AI-text disclosure.

7. **The EU-US Data Privacy Framework is the load-bearing transfer mechanism for a US-hosted SaaS selling into the EU, and it is the least stable thing in this document.** `[K-VOL]` Two predecessor adequacy decisions (Safe Harbour, Privacy Shield) were struck down by the CJEU within 5 and 4 years respectively. Architecting as though the DPF will persist is a bet against a 2-for-2 historical record. The mitigation is not legal — it is **an EU data plane that can become the system of record for EU tenants without a rewrite** (§4.4).

8. **Data residency is a *seam*, not a feature.** `[CORPUS from 08 §14.6]` Three unrelated forces — GDPR buyer demands, China PIPL + ICP filing, Korea PIPA — converge on the same design: regional data planes holding tokens/content/PII, a global control plane holding accounts/billing/aggregates, and a schema-level lint that fails CI if a PII-tagged column is referenced from the global plane. Build the seam early even if the second region ships late.

9. **A US state privacy patchwork of 22+ comprehensive laws is now live or scheduled**, `[GH]` with divergent thresholds (25,000 to 175,000 consumers), divergent cure periods (none, 30 days, 60, 90, permanent), and divergent universal-opt-out obligations. **Only Colorado, Connecticut, Montana, California, Oregon and Texas meaningfully require honoring Global Privacy Control signals** — but the cheapest compliant posture is to honor GPC universally rather than branch on geography. (§7)

10. **We are a *processor* for almost everything that matters, and that is the whole basis of our defence.** Our customers are the controllers of their audience data. But we become a **controller** for our own account/billing/telemetry data, and — critically — the moment we use customer content or platform data to train shared models, we assert a controller-like purpose that most DPAs and every platform's terms prohibit. **"We do not train on customer data" must be a contractual commitment and a technically enforced boundary**, not a marketing line. (§3.2, §12.6)

11. **Accessibility is now a hard EU market-access gate, not a procurement nicety.** The European Accessibility Act's obligations bit on **28 June 2025** `[K]` for products and services in scope, with EN 301 549 (which incorporates WCAG 2.1/2.2 AA) as the harmonised standard. For a B2B SaaS the in-scope analysis is genuinely arguable, but **the VPAT/ACR is already a routine enterprise RFP line item** and the content-side obligation (does our composer *help users produce* accessible posts — alt text, captions, contrast) is a differentiator nobody in the category has taken seriously. (§14)

12. **Sanctions and export control are a hard "no", not a risk to price in.** OFAC-comprehensive jurisdictions (Cuba, Iran, North Korea, Syria, and the occupied regions of Ukraine) cannot be served, and Russia is subject to a specific and expanding services-export prohibition. `[K-VOL]` For a self-serve SaaS this means **geo-blocking plus denied-party screening at signup and at payment**, not a clause in the ToS. (§15.3)

13. **PCI DSS scope is avoidable and should be aggressively avoided.** Using a PCI-compliant payment processor with tokenisation and a hosted/iframe payment field keeps us at **SAQ A** — the shortest self-assessment — instead of dragging our whole platform into a cardholder data environment. `[K-STRUCT]` The one thing that destroys this is ever letting card data touch our DOM or our servers. (§9.5)

14. **FedRAMP is almost certainly not worth it, and the FedRAMP-shaped alternatives probably are.** `[CORPUS from 03]` Sprinklr is the only social vendor with a FedRAMP authorisation and it is **Low Impact (LI-SaaS) only**, which is limited to low-impact public-facing workloads. Hootsuite sells to US public sector *without* FedRAMP, via the Carahsoft GSA reseller channel. `[CORPUS]` The rational sequence is StateRAMP/TX-RAMP for state/local, reseller channel for federal-adjacent, and FedRAMP only against a named, funded, federal opportunity.

15. **The enterprise wedge is procurement survivability, and it is paperwork plus bounded engineering, not product.** `[CORPUS from 01, 03]` The primary benchmark surfaces no SOC 2, no ISO 27001, no published DPA, no SCIM, no audit log and no residency options. Not one enterprise vendor in the category lets a customer buy identity and governance without a sales cycle. **Shipping SSO, SCIM, audit export, a published DPA and a sub-processor list self-serve is an unmatched position** — and it is achievable in 2–3 quarters.

### 1.2 The blocker list, ordered by what it gates

| # | Blocker | Gates | Calendar time | Can it be parallelised? |
|---|---|---|---|---|
| 1 | Per-tenant key hierarchy + crypto-shred design | *Everything.* Not retrofittable. | Design: 1–2 weeks. Build: 3–6 weeks. | Must precede token storage |
| 2 | Meta Business Verification + App Review + DPA | All Meta publishing | **4–12 weeks**, multi-round `[CORPUS]` | Yes — file day 0 |
| 3 | Published DPA + sub-processor list + SCCs | Any EU customer | 2–4 weeks with counsel | Yes |
| 4 | SOC 2 Type I → Type II | Mid-market and enterprise deals | Type I ~2–3 months; Type II window +3–12 months | Partially |
| 5 | EU data plane seam (schema + CI lint) | EU residency demands, future PIPL/PIPA | 4–8 weeks if done early; a rewrite if late | Must precede scale |
| 6 | DSAR/erasure pipeline across platform data | GDPR, CCPA, and 20+ state laws | 4–6 weeks | Yes |
| 7 | Retention engine (per-platform, per-field-class) | Platform ToS compliance + privacy law | 3–5 weeks | Yes |
| 8 | Consent/cookie layer + GPC honoring | ePrivacy, CPRA, CO/CT/MT/OR | 2–3 weeks | Yes |
| 9 | Audit log + export, SSO/SAML, SCIM | Enterprise procurement | 6–10 weeks | Yes |
| 10 | AI Act Art. 50 disclosure + approval records | EU AI features — **already in force** | 2–4 weeks | **Urgent** |
| 11 | Accessibility conformance + VPAT | EU market, US public sector, enterprise RFPs | Audit 3–4 weeks; remediation ongoing | Yes |
| 12 | Sanctions screening + geo-blocking | Legality of self-serve signup | 1–2 weeks | Yes |
| 13 | ISO 27001 | EU/APAC enterprise, often *instead of* SOC 2 | 6–12 months | After SOC 2 scaffolding |
| 14 | ISO 42001 | AI-forward enterprise buyers, increasingly RFP'd | 4–8 months | After ISO 27001 |
| 15 | HIPAA BAA posture | Healthcare vertical | 4–8 weeks + controls | Only if vertical is pursued |

---

## 2. What we actually hold — the compliance surface

Compliance analysis that starts from statutes produces a survey. Compliance analysis that starts from **the data inventory** produces a work plan. This is the inventory, and every later section refers back to it.

### 2.1 Data classes

| # | Class | Examples | Our role | Sensitivity | Governing regimes |
|---|---|---|---|---|---|
| **D1** | **Platform OAuth credentials** | Access tokens, refresh tokens, OAuth1 token+secret pairs, Apple `.p8` ES256 keys, GCP service-account JSON, WeChat component tickets, webhook URLs-as-bearer-credentials `[CORPUS from 07]` | Custodian (processor) | **Catastrophic** | Platform ToS, GDPR Art. 32, all security frameworks |
| **D2** | **Customer (tenant) identity and billing** | Account owners, seat users, emails, SSO identities, payment tokens, invoices | **Controller** | High | GDPR, state privacy laws, PCI (scope-limited) |
| **D3** | **Tenant-authored content** | Drafts, scheduled posts, media assets, brand guidelines, approval history | Processor | Medium (may embed PII/secrets) | GDPR, IP, platform ToS |
| **D4** | **Platform-returned audience data** | Commenters, DM senders, mentioners, follower demographics, reviewer names | **Processor** for tenant; but data subjects never contracted with us | **High — this is the hard one** | GDPR (Art. 14 transparency problem), platform caching limits |
| **D5** | **Platform analytics/metrics** | Impressions, reach, engagement, video retention, demographic aggregates | Processor | Low–Medium | **Platform retention limits are the binding constraint** |
| **D6** | **Listening / social intelligence** | Public posts matching keywords, sentiment, author profiles, competitor data | Processor, arguably joint | **High** — no relationship with data subjects at all | GDPR Art. 14, platform ToS, scraping law |
| **D7** | **Inbox / conversation data** | DMs, private replies, contact details volunteered in support threads | Processor | **High** — may contain special-category or PHI | GDPR Art. 9, HIPAA if healthcare, archiving rules |
| **D8** | **AI derivatives** | Embeddings, generated captions/images/video, model prompts and outputs, agent decision traces | Mixed | Medium–High | EU AI Act, platform AI-training prohibitions, IP |
| **D9** | **Our telemetry** | Logs, traces, metrics, session recordings, product analytics | **Controller** | Medium | ePrivacy, GDPR, and **a common accidental PII leak path** |
| **D10** | **Employee/contractor data** | HR, access records, background checks | Controller | Medium | Employment + privacy law |

### 2.2 The three structurally hard classes

Most of this document is routine. Three classes are genuinely difficult and deserve architectural attention disproportionate to their size:

**D4 + D6 — people who never agreed to anything.** A commenter on our customer's Instagram post did not sign up for our product, has no relationship with us, and in many cases has no idea we exist. Under GDPR our customer is the controller and we are the processor, which handles our exposure — but it does *not* make the processing lawful. The customer needs a lawful basis (typically legitimate interests) and, because the data was not collected from the data subject directly, **Article 14 transparency obligations apply to them**, with the Art. 14(5) disproportionate-effort exemption doing a lot of work. Our product obligations that follow:
- Never surface D4/D6 data to a tenant beyond what the platform's own UI would show them.
- Retention on D4/D6 must be **short and defaulted**, not indefinite and configurable-upward.
- Provide the tenant with the tooling to honour an objection or erasure request against D4/D6 data — because they will receive them and cannot fulfil them without us.

**D7 — inbox content is a special-category minefield.** A DM to a hospital's Instagram account is PHI. A DM to a political party is special-category data under Art. 9. A DM to a pharmacy may be both. We cannot filter this at the door; it arrives because the platform delivers it. The mitigations are: encryption, aggressive retention defaults, per-tenant keys, redaction tooling, and — for the healthcare vertical specifically — a BAA and the controls behind it (§9.4).

**D8 — AI derivatives are where platform terms and privacy law collide.** Platform terms broadly prohibit using platform data to train models. Privacy law requires a lawful basis and (under the AI Act) transparency. Embeddings computed from D4/D6 content are derived personal data and inherit the source's obligations, including erasure — **and embeddings are notoriously hard to delete from a vector index selectively.** Design decision in §5.5.

### 2.3 The role map — who is controller of what

| Data | Controller | Processor | Notes |
|---|---|---|---|
| D1 credentials | Tenant (it is their account) | Us | We are custodian; platform is a third controller with its own terms |
| D2 tenant identity/billing | **Us** | Our sub-processors | This is where *we* need a privacy notice, lawful basis, DSAR process |
| D3 content | Tenant | Us | |
| D4 audience | Tenant | Us | Platform is also a controller |
| D5 metrics | Tenant | Us | Aggregates may fall out of scope if truly anonymous |
| D6 listening | Tenant (arguably joint with us) | Us | **Joint-controllership risk if we curate/enrich beyond instruction** |
| D7 inbox | Tenant | Us | |
| D8 AI derivatives | Tenant, *unless we train shared models* | Us | **Training on tenant data flips us to controller and breaches platform terms** |
| D9 telemetry | **Us** | Our sub-processors | |

**The single most important line in this table:** if we ever train a shared model on tenant or platform data, we become a controller for a purpose the tenant did not instruct, in breach of both our own DPA and every major platform's developer terms. The engineering control is a hard boundary between per-tenant inference context and any training pipeline, enforced in code and asserted in the DPA. (§12.6)

---

## 3. GDPR and UK GDPR

`[K-STRUCT]` throughout unless marked. GDPR = Regulation (EU) 2016/679. UK GDPR = the retained version as amended by the Data Protection Act 2018 and subsequent UK reform legislation.

### 3.1 Territorial scope — we are in scope, and there is no argument otherwise

Article 3(2) extends GDPR to controllers/processors outside the EU who offer goods or services to data subjects in the Union or monitor their behaviour. A social media management platform does both: it serves EU customers, and social listening is *definitionally* behaviour monitoring. **Assume in scope from day one.** The same analysis applies to UK GDPR independently.

Two consequences that get missed:
- **Article 27 representative.** A non-EU controller/processor in scope generally must designate a representative *in the Union*, in writing, in a member state where data subjects are located. A parallel obligation exists under UK GDPR for a UK representative. These are cheap (specialist providers offer them as a service) and their absence is an easy regulator finding. `[K]`
- **Both** an EU and a UK representative may be needed post-Brexit. They are separate obligations.

### 3.2 Lawful basis — per data class, and the honest answer

We hold two hats. As **processor** we do not need our own lawful basis (the controller does), but our DPA must reflect the controller's instructions. As **controller** of D2/D9/D10 we need one.

| Processing | Role | Lawful basis | Notes / risk |
|---|---|---|---|
| Providing the service to a tenant (D1, D3, D5, D7) | Processor | Tenant's basis — normally **Art. 6(1)(b) contract** with their own users, or **6(1)(f) legitimate interests** for audience data | Our job is Art. 28 compliance, not basis selection |
| Our own customer accounts, billing (D2) | Controller | **Art. 6(1)(b) contract** | Clean |
| Product telemetry, security logging (D9) | Controller | **Art. 6(1)(f) legitimate interests** + LIA on file | Session-recording tools push this toward consent |
| Marketing to prospects | Controller | **6(1)(f)** for B2B in most member states, **consent** where ePrivacy requires it | Member-state divergence is real |
| Cookies/trackers on our marketing site | Controller | **Consent** under ePrivacy (separate from GDPR basis) | §6.3 |
| Audience/listening data (D4, D6) | Processor | Tenant's **6(1)(f)**, with an LIA and Art. 14 analysis | **Weakest link in the chain.** Our contract must require the tenant to have done this |
| Special-category data arriving in inbox (D7) | Processor | Tenant needs an **Art. 9(2)** condition — usually 9(2)(a) explicit consent or 9(2)(e) manifestly made public | Manifestly-public is narrower than people assume |
| **Training shared AI models on tenant data** | Would make us **controller** | **There isn't a good one** | **Do not do this.** See §2.3, §12.6 |

**The Art. 9(2)(e) trap.** "Manifestly made public by the data subject" is often invoked to justify processing special-category data found in public social posts. EU regulators have read this narrowly — a public post revealing health or political opinion is not automatically "manifestly made public" for *any* purpose, and the CJEU has taken a restrictive line on inference. `[K]` Listening products that classify sentiment on health or political topics are operating in the weakest part of the legal surface. Product mitigation: allow tenants to exclude special-category topic classifiers, and do not ship health/political inference as a default-on feature in the EU.

### 3.3 Article 28 — the DPA, and what it must actually contain

A processor contract is mandatory and its required contents are enumerated. A published, pre-signed DPA that a customer can accept without redlines is a **sales accelerant**, not just compliance hygiene — `[CORPUS from 01]` the primary benchmark surfaces none, and `[CORPUS from 03]` no enterprise vendor in the category lets you get one without a sales cycle.

Mandatory contents (Art. 28(3)):

| Requirement | What it means for us |
|---|---|
| Process only on documented instructions | Including transfers. Our product must not do anything with tenant data that the contract does not describe |
| Confidentiality commitments from personnel | Employment contracts + NDA + policy attestation |
| Art. 32 security measures | Annexed as a **Technical and Organisational Measures (TOMs)** schedule — this is the document security reviewers actually read |
| Sub-processor rules | Prior authorisation (general or specific) + **notice of changes with a right to object**. Requires a **published sub-processor list with a subscribe-to-changes mechanism** |
| Assist with data subject rights | Our DSAR tooling (§5) is a contractual obligation, not a feature |
| Assist with Art. 32–36 | Breach notification to the controller **without undue delay**, plus DPIA support |
| Delete or return data at end of service | **Crypto-shred** is the clean implementation (§10.6) |
| Make available info to demonstrate compliance + allow audits | **Audit rights are the most-redlined clause.** Offer SOC 2 / ISO 27001 reports as the first-line satisfaction, with on-site audit reserved and rate-limited |

**Practical build:** publish the DPA as a clickthrough at signup, with the TOMs annex, sub-processor list, and transfer mechanism all as versioned URLs. This turns a 3-week legal negotiation into a checkbox for the entire mid-market.

### 3.4 Records, assessments and governance

| Obligation | Article | Applies to us? | Notes |
|---|---|---|---|
| **RoPA** (Records of Processing) | Art. 30 | **Yes**, both as controller and processor | The <250-employee exemption does not apply — our processing is not occasional and includes special categories. Maintain both a controller RoPA and a processor RoPA |
| **DPIA** | Art. 35 | **Yes** for listening, AI features, large-scale D4/D6 processing | Systematic monitoring on a large scale is an explicit trigger. Our customers also need DPIAs and will ask us for input — **shipping a DPIA-support pack is a sales asset** |
| **DPO** | Art. 37 | **Probably yes** | Art. 37(1)(b): core activities requiring regular and systematic monitoring of data subjects on a large scale. Social listening is exactly that. Appoint one (can be outsourced/fractional) and publish contact details |
| **Art. 27 representative** | Art. 27 | Yes, EU **and** UK | §3.1 |
| **Breach notification** | Art. 33/34 | 72 hours to supervisory authority (as controller); **without undue delay to controller** (as processor) | §11.5 |
| **Data protection by design/default** | Art. 25 | Yes | The per-tenant key design and short D4/D6 retention defaults are the concrete expression of this |

### 3.5 UK GDPR — the divergences that matter

`[K-VOL]` The UK has been progressively reforming its data protection regime. As of the May 2026 cutoff the practical divergences relevant to us:

- **Separate representative** requirement (§3.1).
- **Separate international transfer mechanism**: the UK uses the **International Data Transfer Agreement (IDTA)** or the **UK Addendum** to the EU SCCs. The Addendum is the pragmatic choice — sign EU SCCs and bolt on the UK Addendum rather than maintaining two contracts. `[K]`
- **UK adequacy for the US**: the **UK Extension to the EU-US Data Privacy Framework** provides a parallel mechanism for US importers self-certified to it. `[K-VOL]` Same stability caveat as the DPF itself.
- **ICO enforcement posture** has historically been more guidance-first than some EU authorities, but this is a posture, not a legal difference. Do not architect around it.
- **PECR** is the UK's ePrivacy implementation and governs cookies and direct marketing independently of UK GDPR. `[K]`

**Verify before relying:** the exact status of UK reform legislation and whether it has changed DPO/RoPA/DSAR mechanics. This is squarely in the blind spot.

---

## 4. International transfers and data residency

### 4.1 The problem in one paragraph

If any personal data of EU/UK data subjects leaves the EEA/UK — including to a US-hosted database, a US support agent's screen, or a US sub-processor's log aggregator — a Chapter V transfer mechanism is required. For a US-incorporated SaaS this is not an edge case; it is the default state of the entire system.

### 4.2 The mechanisms available

| Mechanism | Article | Fit for us | Stability |
|---|---|---|---|
| **Adequacy decision** | Art. 45 | Best when available — no extra paperwork | Depends on country. UK, Switzerland, Japan, South Korea, Canada (commercial), New Zealand, Israel, Argentina, Uruguay have adequacy `[K]` |
| **EU-US Data Privacy Framework** | Art. 45 | **The mechanism for US-hosted SaaS.** Requires self-certification to the DPF via the US Department of Commerce, annual re-certification, and adherence to the DPF Principles | **`[K-VOL]` — the single least stable item in this document.** §4.3 |
| **Standard Contractual Clauses (2021 modules)** | Art. 46(2)(c) | **Mandatory belt-and-braces.** Module 2 (C→P) and Module 3 (P→P) are the relevant ones | Stable as an instrument; requires a TIA |
| **Binding Corporate Rules** | Art. 47 | Only worth it for large multinationals; 12–24 month approval | Not for us at this stage |
| **Derogations** | Art. 49 | Explicit consent, contract necessity — **not usable for systematic transfers** | EDPB reads these as exceptional only |

### 4.3 The DPF status question — and why the answer must not be load-bearing

`[K-VOL]` **UNVERIFIED as of this document.** The EU-US Data Privacy Framework was adopted in July 2023 following Executive Order 14086 and the establishment of the Data Protection Review Court. It has been subject to annulment litigation before the EU General Court (the *Latombe* challenge) and to periodic Commission review. **I cannot verify its status as of August 2026 and will not guess.** Two specific things must be checked in §17:

1. Is the DPF adequacy decision still in force, and has any court ruling or Commission review altered it?
2. Has the US side of the arrangement (the PCLOB's composition, the DPRC's operation, EO 14086's continuity) been disturbed in a way that affects the essential-equivalence finding?

**Design implication regardless of the answer.** The historical record is Safe Harbour (2000, struck down 2015), Privacy Shield (2016, struck down 2020), DPF (2023, ?). Two mechanisms, two invalidations, roughly a 4–5 year half-life. A prudent architecture:

- **Always run SCCs in parallel** with DPF certification, so invalidation of the adequacy decision does not leave us with no mechanism at all. This is standard practice and cheap.
- Maintain a **current Transfer Impact Assessment (TIA)** documenting US surveillance-law exposure and our supplementary measures (encryption with EU-held keys, minimisation, transparency reporting, policy on government access requests). The TIA is what makes SCCs defensible post-*Schrems II*.
- **Build the EU data plane seam** (§4.4) so that "EU personal data does not leave the EEA" becomes an available product configuration rather than a re-platforming project.

### 4.4 Data residency architecture — the seam

`[CORPUS from 08 §14.6]` This design is already specified in the regional-platform file and is reproduced here because it is a *compliance* decision as much as an engineering one.

```
┌───────────────────────────────────────────────────────────────┐
│  GLOBAL CONTROL PLANE  (single region, no end-user PII)       │
│  • tenant registry, entitlements, feature flags               │
│  • billing, invoicing, subscription state                     │
│  • aggregate non-identifying product metrics                  │
│  • release orchestration, config                              │
└───────────────────────────────────────────────────────────────┘
              │ tenant_id + region routing only
   ┌──────────┴──────────┬──────────────────┬──────────────────┐
   ▼                     ▼                  ▼                  ▼
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│ EU PLANE   │   │ US PLANE   │   │ APAC PLANE │   │ CN PLANE   │
│ tokens     │   │ tokens     │   │ tokens     │   │ (separate  │
│ content    │   │ content    │   │ content    │   │  legal     │
│ inbox      │   │ inbox      │   │ inbox      │   │  entity,   │
│ audience   │   │ audience   │   │ audience   │   │  ICP-filed │
│ KMS keys   │   │ KMS keys   │   │ KMS keys   │   │  callbacks)│
└────────────┘   └────────────┘   └────────────┘   └────────────┘
```

**Non-negotiable rules:**
1. **Keys never leave their plane.** An EU tenant's KEK lives in an EU KMS. This is the supplementary measure that makes the TIA defensible.
2. **No cross-plane PII**, enforced by a **CI lint that fails the build if a PII-tagged column is referenced from a global-plane service.** Policy without a technical control is not a control.
3. **Regional webhook/callback endpoints on region-appropriate domains** — required for China (ICP-filed) and useful everywhere for latency and for the "data never left" claim.
4. **Support tooling is in scope.** A US support engineer viewing an EU tenant's inbox is a transfer. Either regionalise support access or paper it under SCCs with access logging.

**Cost of building the seam early vs. late:** early, it is a routing layer, a key-scoping convention and a lint — call it 4–8 weeks. Late, it is a data migration under live load with a key re-encryption, per tenant, with downtime — call it two quarters and a serious incident risk. `[K]` **This is the second-most-important irreversible decision after the key hierarchy.**

### 4.5 Sub-processors

Every sub-processor that touches personal data is a transfer question and a contractual question. The list for a platform like ours is predictably long: cloud provider, CDN, email delivery, error tracking, product analytics, session replay, support desk, AI model providers, media transcoding, payment processor, e-signature.

| Requirement | Implementation |
|---|---|
| Published list | Public URL, versioned, with entity name, role, location, and data categories |
| Change notification | Email subscription + RSS; **30 days' notice** before a new sub-processor goes live is the market norm `[K]` |
| Right to object | Contractual; realistic remedy is termination, not veto |
| Flow-down of Art. 28 terms | Each sub-processor contract must impose equivalent obligations |
| AI providers are sub-processors | **Frequently missed.** If we send tenant content to a model API, that vendor is a sub-processor and must be listed. Zero-retention / no-training configurations must be contractually confirmed, not assumed from a marketing page |

---

## 5. DSAR, erasure and retention

This is where a social media management platform is structurally harder than a generic SaaS, and it deserves more engineering than it usually gets.

### 5.1 The three-way DSAR problem

A data subject request can arrive from three directions, and they have different answers:

| Requester | Against what | Our role | Response |
|---|---|---|---|
| **Our customer's employee/user** (D2) | Our own records | Controller | We handle it end-to-end. Standard DSAR flow |
| **A member of the public** (D4/D6/D7) — a commenter, DM sender, or listening subject | Data our tenant controls | Processor | **We must not respond substantively.** Route to the tenant, assist them, log it. Responding directly would be processing outside instructions |
| **Our tenant**, asking us to fulfil a request they received | Their data in our system | Processor | This is the **assistance obligation** under Art. 28(3)(e). It must be self-serve tooling, not a support ticket |

**Product requirement:** a tenant-facing DSAR console that can, for a given identifier (email, platform handle, platform user ID):
- **Search** across D3/D4/D5/D7/D8 and produce a structured export;
- **Erase** matching records with a documented, verifiable outcome;
- **Restrict** processing (flag without deleting) — the forgotten Art. 18 right;
- **Log** the whole thing immutably for the tenant's own accountability.

Timelines to design against: **GDPR one month, extendable by two** for complex requests; **CCPA/CPRA 45 days, extendable by 45**; `[GH]` **LGPD 15 days** `[GH]`. Build to the strictest (15 days) and the rest are free.

### 5.2 The identity-resolution problem

A DSAR arrives naming "john.smith@example.com". Our D4 data keys on a platform user ID like `17841400000000000`, with a display name and possibly no email at all. **We frequently cannot connect the request to the records.**

Honest positions:
- Where we hold a platform user ID and the requester can prove control of that account, resolution is possible — **require the tenant to verify identity**, since they have the relationship.
- Where we hold only a display name, we should say so. GDPR Art. 11 explicitly contemplates the case where a controller cannot identify a data subject and relieves the obligation where identification is genuinely impossible — but it requires being able to *demonstrate* that, and it does not license deliberate under-identification.
- **Do not build a cross-platform identity graph to solve this.** It would create a far larger privacy problem than it solves, and it breaches several platforms' terms (§12).

### 5.3 Erasure across platform data — the fan-out

Erasure has to reach every copy. The realistic inventory of places a piece of D4 data lands:

| Location | Deletion difficulty | Approach |
|---|---|---|
| Primary OLTP row | Easy | Hard delete or crypto-shred |
| Analytics warehouse / columnar store | Medium | Partition-aware delete; many columnar engines make row deletes expensive — design for it |
| Search index (OpenSearch/Elastic) | Medium | Delete-by-query + refresh |
| **Vector index / embeddings** (D8) | **Hard** | §5.5 |
| Cache (Redis, CDN) | Easy but easily forgotten | TTL discipline + explicit purge |
| Backups | **Hard — and the usual answer is wrong** | §5.4 |
| Log aggregation | **Hard, and the biggest accidental leak** | Never log D4/D7 payloads. Enforce with a redaction sidecar |
| Data exports the tenant downloaded | **Impossible** | Contractual, not technical |
| Sub-processor systems (AI provider, support desk) | Medium | Flow-down obligations + documented deletion SLAs |

**Design rule:** every store that receives personal data must register a deletion handler at build time. A store with no deletion handler must fail a CI check. This is the only pattern that survives feature growth.

### 5.4 Backups — the honest answer

The common claim "we delete from backups" is usually false, because backups are immutable point-in-time snapshots and selectively editing them destroys their integrity (and, for regulated customers, their evidentiary value). The defensible position, which regulators have broadly accepted:

1. Erasure removes the data from **all live/production systems immediately**.
2. Backups are **excluded from the erasure but retained under a defined, short, documented rotation** (e.g. 30–35 days), after which the data ages out.
3. The data is placed **beyond use** in backups: no restoration of a backup returns erased data to production without re-applying a **deletion replay log** — a durable list of erasure tombstones applied automatically post-restore.
4. This is documented in the DPA/TOMs so the customer can rely on it.

**Crypto-shredding makes this much cleaner:** if the per-tenant (or per-subject) key is destroyed, the backup ciphertext is unreadable and the "beyond use" argument becomes cryptographic rather than procedural. This is a strong reason to prefer per-tenant keys (§10.3).

### 5.5 Embeddings and AI derivatives

Embeddings computed from personal data are, in the prevailing regulatory view, **derived personal data** — they are not anonymous, because they are computed from and can be linked back to an individual's content. `[K]` They therefore inherit erasure obligations, and vector indexes are bad at selective deletion (many ANN structures require rebuild for true removal).

Options, in order of preference:
1. **Namespace vectors per tenant and per source record**, so a delete is an index-level operation on a small partition rather than a global rebuild.
2. **Store the mapping vector→source_id** and treat deletion as tombstone + periodic compaction/rebuild on a defined schedule (e.g. nightly), with the tombstone enforced at query time in the interim.
3. **Do not embed D4/D6 content at all by default.** Embed D3 (tenant's own content) freely; make embedding of audience/listening content an explicit, off-by-default tenant choice with its own retention setting.

Option 3 is the one that most reduces legal surface and it costs the least. **Recommended default.**

### 5.6 The retention schedule

Retention must be driven by the *strictest* of three inputs: platform ToS ceiling, legal minimum/maximum, and tenant configuration within those bounds.

| Data | Proposed default | Floor/ceiling driver | Notes |
|---|---|---|---|
| D1 credentials | Life of connection + **immediate revocation and deletion on disconnect** | Platform ToS | Also delete on prolonged auth failure |
| D2 tenant account | Life of contract + 7 years for billing records | Tax/accounting law | Financial records commonly 6–7 years |
| D3 content/drafts | Life of contract + 30–90 day grace | Tenant preference | |
| D4 audience | **90 days rolling, tenant-adjustable downward only** | GDPR minimisation + platform terms | The default matters more than the option |
| D5 metrics — identifiable | Match platform ceiling | **Platform ToS** (§12) | |
| D5 metrics — aggregated/anonymous | Indefinite | — | **Only if genuinely anonymous** — k-anonymity thresholds, no re-identification path |
| D6 listening | **30–90 days for raw posts**; aggregates longer | GDPR + platform terms | Raw post text is the risky part |
| D7 inbox | **Tenant-configurable, default 12 months**; longer only for archiving customers | May be *extended* by FINRA/SEC (§13.4) | Regulated customers need the opposite of minimisation |
| D8 embeddings | Match source record | Inherits from source | §5.5 |
| D9 telemetry | 30–90 days for detailed logs; 13 months for aggregates | Security needs vs. minimisation | Security logs may justify longer under 6(1)(f) |
| Audit logs (tenant-visible) | **Minimum 12 months, ideally 7 years for enterprise** | Customer requirement, SOC 2 | Enterprises ask for this explicitly |

**Note the tension:** GDPR pushes retention *down*; SEC 17a-4 and FINRA 4511 push it *up* to 3–6 years for regulated customers (§13.4). These are reconciled per-tenant, not globally, which means **retention policy must be a per-tenant, per-data-class configuration with a compliance-mode override** — another thing that is painful to retrofit.

---

## 6. EU DSA, AI Act, ePrivacy

### 6.1 Digital Services Act — are we in scope?

`[K-STRUCT]` Regulation (EU) 2022/2065. The DSA regulates **intermediary services**, in four nested tiers with cumulative obligations:

| Tier | Definition | Us? |
|---|---|---|
| **Intermediary service** | Mere conduit, caching, or hosting | Arguably yes — we host tenant content |
| **Hosting service** | Stores information provided by a recipient of the service | **Probably yes** for media library and drafts |
| **Online platform** | A hosting service that **disseminates information to the public** at the request of the recipient | **Probably NOT** — we publish to *third-party* platforms, and our own product does not disseminate to the public |
| **VLOP/VLOSE** | ≥45M average monthly active EU recipients, designated by the Commission | **No.** Not remotely |

**Working assessment `[K]`, needs counsel:** we are most likely a **hosting service** but **not an online platform**, because content stored in our system is not made available to the public *by our service* — it is transmitted via API to Meta/X/LinkedIn, who are themselves the online platforms and bear the platform-tier obligations. The "public dissemination" element is the hinge, and it is genuinely arguable if we ever ship a public-facing feature (a public content gallery, a public link-in-bio page, a public brand profile).

**⚠️ This is a real trigger to watch.** A link-in-bio product, a public "wall of proof" UGC gallery, or a public creator marketplace would plausibly convert us into an online platform and pull in notice-and-action, statement-of-reasons, internal complaint handling, out-of-court dispute settlement, trusted flaggers, transparency reporting, and the Art. 30 trader-traceability ("KYB") obligations for any marketplace element. **Product decisions in the commerce/creator module (`10-commerce-creator-influencer.md`) can change our regulatory classification.** Flag this to whoever owns that roadmap.

Obligations that apply even at the hosting tier `[K]`:
- **Art. 6** — conditional liability exemption, contingent on expeditious removal on actual knowledge.
- **Art. 16** — notice-and-action mechanism for illegal content. A reachable, documented abuse channel.
- **Art. 17** — statement of reasons to the affected recipient when we restrict content.
- **Art. 11–13** — single point of contact for authorities and for recipients, and a **legal representative in the Union** if not established there.
- **Art. 14** — terms and conditions that clearly state content restrictions and are applied diligently and proportionately.

Cheap to implement, embarrassing to be caught without. Budget: 2–3 weeks.

### 6.2 EU AI Act — the compliance-architecture consequences

**Full analysis lives in `09-ai-frontier.md` §8 and is not duplicated.** `[CORPUS]` The verified timeline there (checked against EUR-Lex 2026-07-20) establishes: Art. 50 transparency obligations **in force since 2 Aug 2026**, watermarking grace period for pre-existing systems ending **2 Dec 2026**, penalties to **€15M or 3% of worldwide turnover** under Art. 99(4).

What that file does not cover, and this one must — the **governance and record-keeping** consequences:

| Obligation | Where it bites us | Build |
|---|---|---|
| **Art. 4 — AI literacy** | Applies since 2 Feb 2025. Providers *and deployers* must ensure staff dealing with AI systems have sufficient AI literacy | Training record for engineers, CS, and anyone operating AI features. Cheap; commonly forgotten; easy audit finding |
| **Art. 50(1) — interaction notice** | Every AI chatbot / DM automation / auto-reply feature our customers run | A non-suppressible "you are talking to an automated assistant" affordance, per channel. **Must not be a tenant-disableable setting in the EU** |
| **Art. 50(4b) — AI text disclosure**, with the **editorial-responsibility exception** | Scheduled AI-drafted brand posts on matters of public interest | **Per-post approval records become a compliance artifact.** The approval log — who approved, when, what they saw — is the evidence that the exception applies. This makes the approval workflow a legal control, not just a collaboration feature |
| **Art. 50(4a) — deepfake disclosure** | AI avatars, voice clones, face swaps, re-lipsynced translation | Mandatory, non-removable disclosure on such assets, plus propagation of platform-native AI labels at publish |
| **Art. 50(5) — clear, distinguishable, accessible** | All of the above | Disclosure must itself meet accessibility requirements — links §14 |
| **GPAI obligations** | Apply to model *providers* since 2 Aug 2025 | We are a **deployer** when calling OpenAI/Google/Anthropic. Confirm our providers' compliance documentation; it flows into our own conformance story |
| **ISO 42001** | Not required by the Act, but the practical way to evidence governance | §9.3 |

**The single highest-leverage AI Act build for us:** an **exportable AI compliance report per tenant** — inventory of AI features in use, disclosure configuration, approval records, model providers and their roles, and generated-content provenance. Nobody in the category ships this `[CORPUS from 09]`, every EU enterprise buyer will eventually ask for it, and it is assembled from data we already have.

### 6.3 ePrivacy and cookies

`[K-STRUCT]` Directive 2002/58/EC as amended, implemented nationally (PECR in the UK, TTDSG/TDDDG in Germany, etc.). The long-promised ePrivacy Regulation has not replaced it. `[K-VOL]`

Key points that catch SaaS companies:

- **Consent is required before storing or accessing information on a user's device** — this covers cookies, localStorage, SDK identifiers, and pixel/fingerprinting techniques. It is **not** limited to cookies and **not** satisfied by legitimate interests. The only exemptions are strictly-necessary and communications-transmission.
- **Analytics is not strictly necessary.** Several DPAs have accepted narrowly-configured first-party analytics without consent; most have not. Assume consent required.
- **The marketing site and the authenticated app are different problems.** Inside the product, most storage is strictly necessary (session, preferences) and needs no banner. The marketing site with its ad pixels needs a full CMP.
- **Consent must be as easy to withdraw as to give**, with reject-all at the same level as accept-all. Regulators have fined specifically on this. `[K]`
- **The pixel problem is our customers' too.** If we help customers deploy conversion pixels, we are in the causal chain of their consent obligations. Document the division of responsibility.

**Build:** a real CMP with per-purpose consent, a documented consent record with timestamp and version, and — importantly — **a consent state that our own analytics respects server-side**, not just client-side.

### 6.4 NIS2 and DORA — probably not us, worth knowing

`[GH]` from the GRC framework map:
- **NIS2** (EU) covers essential and important entities in listed sectors, with 10 Art. 21 measures and **24h early warning / 72h notification / 1-month final report** to the CSIRT. Digital infrastructure and managed service providers are in scope; a social media management SaaS is probably not, but **cloud computing service providers are explicitly listed**, and the analysis depends on national transposition. `UNVERIFIED` for our specific case — worth a counsel question, because being in scope means real reporting obligations.
- **DORA** covers EU financial entities and their **critical ICT third-party providers**. If we sell to EU banks/insurers, we may be contractually pulled into DORA's Register of Information (CIR 2024/2956) and its Art. 19 incident reporting even without being directly regulated. `[GH]` **Expect DORA-flavoured clauses in EU financial-services contracts** — subcontracting restrictions, audit and access rights, exit plans, and incident cooperation. These are more onerous than standard DPA terms.

---

## 7. United States

### 7.1 CCPA / CPRA

`[GH]` + `[K-STRUCT]`

| Element | Detail |
|---|---|
| **Applicability** | Any of: **>$25M annual gross revenue** (CPI-adjusted — `[GH]` gives **$26.625M for 2025–2026**); **or** buys/sells/shares personal information of **100,000+** consumers or households; **or** derives **50%+** of annual revenue from selling/sharing PI |
| **Enforcement** | **California Privacy Protection Agency (CPPA)** *and* the Attorney General. `[GH]` |
| **Cure period** | **None** (removed by CPRA). `[GH]` |
| **Private right of action** | **Yes — but only for data breaches** of specified unencrypted/unredacted PI, Cal. Civ. Code §1798.150. `[GH]` **Statutory damages $100–$750 per consumer per incident** make this the most financially dangerous US provision for us `[K]` |
| **Response SLA** | **45 days**, extendable by a further 45. `[GH]` |
| **Sensitive Personal Information** | Separate category with a **right to limit** use and disclosure. `[GH]` notes a 15-business-day deadline for the SPI limitation request |
| **Universal opt-out** | **Global Privacy Control must be honored.** `[GH]` |
| **Our role** | **Service provider** (the CCPA analogue of processor) — requires specific contract language including a prohibition on retaining/using/disclosing PI outside the business purpose and a certification of understanding |

**The "sale/share" trap.** CCPA's definition of "sale" is broad (any disclosure for monetary *or other valuable consideration*) and "share" covers cross-context behavioural advertising. A social media tool that passes data to ad pixels — or that lets customers do so — is in the frame. **Service provider status is what keeps us out of "sale" territory, and it depends on the contract terms being right.** Get the service-provider addendum correct and the sale analysis largely disappears.

**The breach PRA is the reason encryption-at-rest matters commercially, not just technically.** §1798.150 attaches to *unencrypted and unredacted* personal information. Properly implemented encryption is a partial statutory shield with a directly quantifiable value.

### 7.2 The state patchwork

`[GH]` from `open-agreements/open-agreements` → `surveys/privacy/us.md`, **with corrections**.

> **⚠️ Source-quality warning.** The GitHub survey is comprehensive on thresholds/rights/cure periods but contains **effective-date errors** — it lists Colorado as "effective 2021" (that is the *enactment* year; the CPA took effect **1 July 2023** `[K]`) and Oregon as "effective 2020" (the OCPA took effect **1 July 2024** `[K]`). It also **omits Rhode Island**. I have corrected dates from model knowledge and marked them; treat the corrected dates as `[K]` and the thresholds/rights columns as `[GH]`.

| State | Law | Effective | Threshold (consumers, or revenue) | Sensitive data | Universal opt-out / GPC | Cure period | PRA |
|---|---|---|---|---|---|---|---|
| **California** | CCPA/CPRA | 2020 / 2023 | $26.625M rev **or** 100k **or** 50% rev from sale | Right to limit | **Yes** | **None** | **Breach only** |
| **Virginia** | VCDPA | **1 Jan 2023** `[K]` | 100k **or** 25k + 50% rev | Opt-in | No | **Permanent 30d** | None |
| **Colorado** | CPA | **1 Jul 2023** `[K]` | 100k **or** 25k + sale rev | Opt-in | **Yes — required** | **None** | Barred |
| **Connecticut** | CTDPA | **1 Jul 2023** `[K]` | 100k **or** 25k + 25% rev | Opt-in | **Yes — signals** | Expired end-2024 | None |
| **Utah** | UCPA | **31 Dec 2023** `[K]` | $25M rev **and** (100k **or** 25k + 50%) | **Notice + opt-out only** | No | 30d | None |
| **Texas** | TDPSA | **1 Jul 2024** `[K]` | **No consumer threshold** — all but SBA small businesses | Opt-in | No¹ | Not specified | Barred |
| **Oregon** | OCPA | **1 Jul 2024** `[K]` | 100k **or** 25k + 25% rev | Opt-in | **Yes — required** | **None after 1 Jan 2026** | None (penalties to $7,500/violation) |
| **Montana** | MCDPA | **1 Oct 2024** `[K]` | **25k** **or** 15k + 25% rev | Opt-in | **Yes — required** | **None** (2025 amendments) | None |
| **Florida** | FDBR | 1 Jul 2024 | **$1B+ global revenue** + specified business | Opt-in, **no threshold** | No | None | None |
| **Delaware** | DPDPA | **1 Jan 2025** `[K]` | **35k** **or** 10k + 20% rev | Opt-in | Not specified | Expired end-2025 | None |
| **Iowa** | ICDPA | **1 Jan 2025** `[K]` | 100k **or** 25k + 50% rev | **Notice + opt-out only** | No | **90d** | None |
| **Nebraska** | NDPA | **1 Jan 2025** | **No consumer threshold** — federal small-business exemption only | Opt-in | No | 30d | Prohibited |
| **New Hampshire** | NHPA (ch. 507-H) | **1 Jan 2025** | **35k** **or** 10k + 25% rev | Opt-in | No | Discretionary from 1 Jan 2026 | None |
| **New Jersey** | NJDPA | **15 Jan 2025** | 100k **or** 25k + any sale rev | Opt-in | No | Sunsets after 18 months | None |
| **Tennessee** | TIPA | **1 Jul 2025** `[K]` | $25M rev **and** (175k **or** 25k + 50%) | Opt-in | No | **60d** | None (**NIST Privacy Framework affirmative defence**) |
| **Minnesota** | MCDPA | **31 Jul 2025** | 100k **or** 25k + 25% rev | Opt-in | No | 30d, expired | None |
| **Maryland** | MODPA | **1 Oct 2025** `[K]` | **35k** **or** 10k + 20% rev | **Sale prohibited outright**; minors' data sale banned | No | Sunsets for violations after 1 Apr 2027 | None |
| **Rhode Island** | DTPPA | **1 Jan 2026** `[K]` — *omitted from source* | 35k **or** 10k + 20% rev `[K]` | Opt-in `[K]` | No `[K]` | `UNVERIFIED` | None `[K]` |
| **Indiana** | INCDPA | **1 Jan 2026** | 100k **or** 25k + 50% rev | Opt-in | No | **Permanent 30d** | None |
| **Kentucky** | KCDPA | **1 Jan 2026** | 100k **or** 25k + 50% rev | Opt-in | No | **Permanent 30d** | None |
| **Oklahoma** | OCDPA (SB 546) | **1 Jan 2027** | 100k **or** 25k + 50% rev | Opt-in | No | Not specified | Prohibited |
| **Louisiana** | LDPA (Act 502 of 2026) | **1 Jan 2027** | $25M rev **or** 75k **or** 50% rev | Opt-in | No | Until 31 Jul 2027 | None |
| **Alabama** | APDPA (Act 2026-552) | **1 May 2027** | 25k **or** 25% rev from sales; <500 employees exempt | Opt-in | Not specified | Notice + cure | None |

¹ Texas requires recognition of universal opt-out mechanisms for targeted advertising/sale under its own formulation `[K]` — the `[GH]` source says "no requirement"; **this specific cell is contested and must be verified.**

**The engineering conclusion is the opposite of the legal complexity.** Do not branch behaviour on 22 state rules. Instead adopt a **single high-water-mark posture** for all US users:

1. Honor **GPC universally** — it satisfies CO/CT/MT/CA/OR/TX and costs nothing elsewhere.
2. Treat **sensitive data as opt-in everywhere** — satisfies all but Iowa/Utah, which are satisfied a fortiori.
3. Offer **access, deletion, correction, portability and opt-out** to every US consumer regardless of state.
4. Respond within **45 days** universally.
5. Maintain the **service-provider/processor contract terms** that every one of these laws requires in some form.

The marginal cost of the high-water-mark approach over the weakest-state approach is small; the marginal cost of maintaining 22 conditional code paths is enormous and permanently growing.

### 7.3 Sectoral and adjacent US law

| Regime | Relevance | Notes |
|---|---|---|
| **HIPAA** | Only if we serve covered entities/business associates | §9.4. `[CORPUS from 07]` flags that **responding to healthcare reviews can disclose PHI** — a real product risk in the review-management module |
| **Washington My Health My Data Act** | **Yes, and underappreciated** | Broad definition of "consumer health data" — potentially covering inferences from social content. **Has a private right of action** via the Consumer Protection Act. `[K]` Nevada has a similar law. Do not infer health status in the US without a hard look |
| **COPPA** | If under-13 data is knowingly collected | Our tenants are businesses; risk arises from audience data and from creator marketplaces. **Do not knowingly onboard under-13 creators** |
| **State minors' codes (e.g. age-appropriate design)** | Growing; several enjoined or litigated | `[K-VOL]` Status changes frequently |
| **TCPA / CAN-SPAM / CASL** | Messaging channels | `[CORPUS from 07 §2953]` — WhatsApp/RCS/SMS/Viber require an **opt-in ledger with proof, per channel** |
| **FTC Act §5** | Unfair/deceptive practices — the catch-all | Covers privacy misrepresentations, dark patterns, and **security claims we cannot substantiate**. Do not claim "bank-grade encryption" |
| **Illinois BIPA** | If we ever do face recognition/analysis on media | **Private right of action with statutory damages.** A face-detection feature in the media library is a genuine BIPA exposure. Avoid, or geofence and consent |

---

## 8. Rest of world

### 8.1 Summary table

| Jurisdiction | Instrument | Status/date `[K-VOL]` | The thing that changes our architecture |
|---|---|---|---|
| **Canada** | PIPEDA | In force | Consent-centric; **breach reporting to OPC + record of all breaches** |
| **Quebec** | Law 25 (Act 25) | Fully phased in by Sep 2024 `[K]` | **Privacy impact assessments, mandatory breach reporting, data portability, and a named Privacy Officer.** Transfer assessments outside Quebec |
| **Brazil** | LGPD | In force; ANPD enforcing | `[GH]` **15-day response SLA** — the strictest DSAR clock we face. **10 legal bases** (more than GDPR). DPO ("encarregado") required |
| **India** | DPDP Act 2023 + Rules | `[GH]` skill says **"effective May 2027"** — likely referring to a phased Rules commencement | §8.2 |
| **China** | PIPL + CSL + DSL | In force | §8.3 — the hardest jurisdiction in this document |
| **Japan** | APPI | In force, amended | Relatively pragmatic; **cross-border transfer requires consent or equivalent-protection assurance + disclosure of destination country**. Japan has EU adequacy (mutual) |
| **South Korea** | PIPA | In force, amended 2023 `[K]` | **One of the most aggressively enforced.** Data localisation pressure; PIPC fines are turnover-based. `[CORPUS from 08]` treats Korea as a residency driver |
| **Australia** | Privacy Act 1988 + reform tranches | `[K-VOL]` Tranche 1 passed 2024 | **Statutory tort for serious invasions of privacy**, children's online privacy code, and **removal of the small-business exemption** were in the reform program. Verify current state |
| **Nigeria** | NDPA 2023 | In force; NDPC active | Registration of data controllers of major importance; **annual audit filing**. Local representative expectations |
| **South Africa** | POPIA | In force | Information Officer registration with the Regulator; **prior authorisation** for certain processing |
| **Saudi Arabia** | PDPL + Implementing Regs | In force `[K]` | **Data localisation default** with SDAIA-approved exceptions; transfer risk assessments |
| **UAE** | Federal PDPL (Decree-Law 45/2021) + DIFC DP Law 5/2020 + ADGM | Fractured | **DIFC and ADGM have their own regimes.** DIFC DP Law is GDPR-like and has its own adequacy list. Federal executive regulations were long-delayed — `UNVERIFIED` current status |
| **Switzerland** | revFADP | In force Sep 2023 | GDPR-aligned; needs its own representative and its own SCC-equivalent posture |
| **Turkey** | KVKK | In force | Registration with VERBIS; transfer rules historically restrictive, amended 2024 `[K]` |

### 8.2 India DPDP Act — the consent manager is the unusual part

`[K-STRUCT]` + `[GH]`

The Digital Personal Data Protection Act 2023 has three features that are architecturally distinctive and not found in GDPR:

1. **Consent Managers.** The Act contemplates a registered intermediary through which data principals give, manage, review and withdraw consent across data fiduciaries. This is a **registered entity with technical interoperability obligations** — a genuinely novel piece of infrastructure. If consent-manager integration becomes mandatory in practice, it is an integration project, not a policy change. `[K]` — the exact obligations on a *foreign* data fiduciary to integrate are `UNVERIFIED`.

2. **Significant Data Fiduciary (SDF) designation.** Volume/sensitivity-based designation triggering: a **resident Data Protection Officer in India**, an independent **data auditor**, and periodic **Data Protection Impact Assessments**. `[GH]` confirms "SDF DPO requirements". Whether we would be designated is `UNVERIFIED` and depends on notified thresholds.

3. **Transfer model is a blacklist, not a whitelist** — transfers permitted except to countries the Central Government restricts. This is *more* permissive than GDPR on its face, but it is unilateral and can change without notice. Sectoral rules (notably RBI's payment-data localisation) impose stricter localisation on specific data types independently of DPDP.

`[GH]` gives **6 data principal rights** and an effective date of **May 2027**. Treat that date as the operative planning assumption but verify — the Act was passed in 2023 with commencement dependent on the Rules, and the Rules were notified in stages.

### 8.3 China — PIPL + CSL + DSL, and why this is a separate company

`[K-STRUCT]`, and `[CORPUS from 08 §4.3, §14.6]` for the platform mechanics.

Three overlapping statutes:
- **Cybersecurity Law (CSL, 2017)** — network operator obligations, MLPS (Multi-Level Protection Scheme) grading, critical information infrastructure.
- **Data Security Law (DSL, 2021)** — data classification/grading, national core data, and a notable **prohibition on providing data stored in China to foreign judicial/law-enforcement authorities without PRC approval** (a direct conflict-of-laws problem with US discovery).
- **PIPL (2021)** — the personal information law proper.

**Cross-border transfer out of China** requires one of `[K]`:
1. **CAC security assessment** (mandatory above volume thresholds, for CIIOs, and for important data);
2. **Standard Contract** filed with the CAC (the Chinese SCC analogue), with a PIPIA;
3. **Certification** by an accredited body.

Volume thresholds were relaxed by the March 2024 Provisions on Promoting and Regulating Cross-Border Data Flows, which created meaningful exemptions. `[K-VOL]` **Verify thresholds before relying on any exemption.**

**The operational reality for us:**
- Serving Chinese platforms (WeChat, Weibo, Douyin, Xiaohongshu) compliantly requires **in-China infrastructure with an ICP filing** for callback domains. `[CORPUS from 08 §210]`
- ICP filing requires a **Chinese legal entity**. A foreign company cannot obtain one directly.
- `[CORPUS from 08]` documents the **WeChat third-party platform ("component") model**, where a component-scoped credential underlies all tenant credentials and a push-driven **component verify ticket with a hard expiry** will, if missed, **lock out every tenant simultaneously**. This is a materially different token-vault shape and a distinctive availability risk.
- The DSL's foreign-authority-disclosure prohibition means a China plane cannot be operated under the same legal-process policy as the rest of the estate.

**Recommendation `[K]`:** treat China as a **separate legal entity, separate data plane, separate compliance program, and a distinct go/no-go business decision** — not as a region in the main product. The corpus's sovereign-shard design (§4.4) makes this possible later without a rewrite, which is the correct amount of investment to make now.

### 8.4 Korea, Japan, Australia — the practical notes

**Korea (PIPA).** `[K]` Among the most actively enforced regimes globally, with turnover-based penalties and a regulator (PIPC) that has fined large foreign platforms. Notable features: strict rules on **resident registration numbers**, requirements around **consent granularity** (separate consent per purpose, and a prohibition on refusing service for declining optional consent), and **destruction obligations** when the purpose is achieved. Cross-border transfer requires consent or a listed alternative. `[CORPUS from 08 §1150]` names Korea as one of three drivers of the sovereign-shard design.

**Japan (APPI).** `[K]` More pragmatic. The distinguishing obligation for us: when transferring personal data abroad, the transferor must **inform the data subject of the destination country and the protections in place** — a disclosure obligation that shapes our privacy notice, not our architecture. Japan holds mutual adequacy with the EU, which simplifies EU→Japan flows.

**Australia.** `[K-VOL]` The Privacy Act reform program was proceeding in tranches. Items with architectural consequence if enacted: removal of the **small business exemption**, a **statutory tort** for serious invasions of privacy, a **Children's Online Privacy Code**, and expanded **automated decision-making transparency**. The **Notifiable Data Breaches** scheme is already in force and requires assessment within 30 days and notification of eligible breaches to the OAIC and affected individuals. **Verify the current tranche status** — this is squarely in the blind spot.

---

## 9. Security certifications

### 9.1 SOC 2 — what it actually takes

`[GH]` from `Chiaro-HQ/methodology`, plus `[K-STRUCT]`.

**What it is.** An attestation report issued by a **licensed CPA firm** under AICPA attestation standard **AT-C 205** `[GH]`, opining on whether controls meet the **Trust Services Criteria**. It is not a certification and there is no certificate — there is an opinion letter and a report.

**The five Trust Services Categories:**

| Category | Include? | Why |
|---|---|---|
| **Security** (Common Criteria) | **Mandatory** — always in scope | The baseline |
| **Availability** | **Yes** | We make uptime commitments; customers ask |
| **Confidentiality** | **Yes** | We hold credentials and tenant content |
| **Processing Integrity** | Optional | Arguably relevant (did the post publish correctly?) — adds scope and cost; **defer** |
| **Privacy** | Optional | Overlaps GDPR work. **Defer to ISO 27701 or a later cycle** unless a buyer demands it |

**Recommended initial scope: Security + Availability + Confidentiality.**

**Scale of the exercise.** `[GH]` The Chiaro methodology maps **89 controls to 61 Trust Services Criteria**, with **369 test attributes** and **22 defined evidence sources**. That is a useful calibration of what "SOC 2 readiness" concretely means: roughly 90 controls to design, implement, and produce evidence for, against ~370 discrete tests.

**Type I vs Type II:**

| | Type I | Type II |
|---|---|---|
| Opinion on | Design of controls **at a point in time** | Design **and operating effectiveness over a period** |
| Observation window | None | **3 months minimum; 6 or 12 typical** |
| Buyer acceptance | Weak — treated as a milestone, not an answer | **This is what enterprise procurement means by "SOC 2"** |
| Use | Bridge while the Type II window runs | The real deliverable |

**Testing approach.** `[GH]` Chiaro's methodology defaults to **complete population testing rather than sampling** — "the data a modern company runs on is produced by machines, so it can be verified at machine speed, all of it" — with sampling reserved for populations that cannot be fully retrieved, and sample selection **seeded from population hashes to prevent steering**. Every candidate deviation must be **confirmed by a CPA before becoming an exception**. This matters practically: if our evidence is machine-retrievable (API-queryable IdP, ticketing, CI/CD, cloud config), the audit is faster and cheaper; if it lives in screenshots and spreadsheets, it is slower and more expensive.

**Timeline, realistic:**

| Phase | Duration | What happens |
|---|---|---|
| Gap assessment / readiness | 3–6 weeks | Control design, policy set, evidence mapping |
| Remediation | 4–12 weeks | Actually implementing MFA everywhere, logging, access reviews, vendor management, IR plan, BCP/DR test, pen test |
| **Type I audit** | 3–5 weeks | Point-in-time opinion |
| **Type II observation window** | **3–12 months** | **Irreducible calendar time** |
| Type II fieldwork + report | 4–8 weeks | |

**Total to a first Type II: ~9–18 months** from a cold start; **~6–9 months** if aggressive with a 3-month window. `[K]`

**Cost `[K-VOL]` — verify, these move:**

| Line item | Typical range |
|---|---|
| Compliance automation platform (Vanta/Drata/Secureframe or OSS `getprobo/probo`, `trycompai/comp`, `theopenlane/core` `[GH]`) | **$7k–$30k/yr**, scaling with headcount |
| CPA audit firm — Type I | **$8k–$25k** |
| CPA audit firm — Type II | **$15k–$60k** |
| Penetration test (usually required) | **$10k–$30k** |
| Internal effort | **0.25–0.5 FTE ongoing**, spiking to 1 FTE during fieldwork |
| **Year-1 all-in** | **~$45k–$120k** |

**The single most common failure mode** is treating SOC 2 as a document exercise. The Type II tests whether controls *operated* — every missed quarterly access review, every un-ticketed production change, every onboarding without a documented approval becomes an exception in the report, and exceptions are what buyers read.

### 9.2 ISO 27001 / 27017 / 27018 / 27701

`[K-STRUCT]` + `[GH]`.

| Standard | What it is | Should we? |
|---|---|---|
| **ISO/IEC 27001:2022** | Certifiable ISMS standard. Mandatory clauses 4–10 + **93 Annex A controls in 4 themes** `[GH]` (down from 114 in the 2013 version) | **Yes, after SOC 2.** Often *required* instead of SOC 2 by EU/APAC buyers |
| **ISO/IEC 27017** | Cloud-services security controls — an extension, certified as an add-on to 27001 | **Nice-to-have.** Cheap once 27001 exists |
| **ISO/IEC 27018** | PII protection in public clouds (processor-focused) | **Good fit for us** — directly on point for a processor holding customer PII. Cheap add-on |
| **ISO/IEC 27701** | Privacy Information Management System. `[GH]` notes a **standalone 2025 edition** — historically an extension to 27001, now able to stand alone | **Strong option** as the evidence layer for GDPR. Often better value than adding SOC 2 Privacy |

**Mechanics:** certification is by an **accredited certification body**, in **Stage 1** (documentation review) and **Stage 2** (implementation audit), with **surveillance audits annually** and **recertification every 3 years**. The defining artifact is the **Statement of Applicability (SoA)** justifying inclusion/exclusion of each Annex A control.

**Timeline:** 6–12 months from cold start. **Cost `[K-VOL]`:** certification body fees **~$15k–$50k** for the 3-year cycle at our scale, plus consultancy if used, plus internal effort.

**Overlap with SOC 2 is large** — roughly 60–80% of the control work is shared `[K]`. Sequencing SOC 2 first then ISO 27001 lets the second ride on the first. Frameworks like `intuitem/ciso-assistant-community` (150+ frameworks with **automatic control mapping** `[GH]`) exist precisely to exploit this overlap and are worth using rather than rebuilding crosswalks by hand.

### 9.3 ISO 42001 — the AI management system

`[GH]` + `[K-STRUCT]`. ISO/IEC 42001:2023, an AI Management System standard with **38 Annex A controls** and an **AI System Impact Assessment (AISIA)** requirement `[GH]`, structured like 27001 (certifiable, PDCA, Annex A + SoA).

**Why it matters commercially:** it is becoming the de facto answer to "how do you govern AI?" in enterprise RFPs, and it is the most credible way to evidence EU AI Act governance in the absence of harmonised standards — `[CORPUS from 09]` notes that **no CEN/CENELEC harmonised standards had been cited in the OJ as of 2026-07-20**, so there is **no presumption of conformity available**. ISO 42001 fills that vacuum.

**Recommendation:** valuable, and a genuine differentiator for an AI-native product — `[CORPUS from 03]` shows no social vendor claiming it. Sequence it **after** ISO 27001, because it reuses the management-system scaffolding. Budget 4–8 months incremental.

### 9.4 HIPAA

`[K-STRUCT]` + `[GH]` (45 CFR Parts 160/164; **54 Security Rule implementation specifications**).

We would be a **Business Associate** if a covered entity uses us to handle PHI. The trigger in our product is concrete and unavoidable if we sell to healthcare: **a patient DMs a hospital's Instagram account, and that message contains PHI.** `[CORPUS from 07 §2420, §2954]` flags the same issue for healthcare review management — responding to a review can itself disclose PHI.

Requirements:
- **BAA** with each covered-entity customer, and **BAAs flowed down to every sub-processor** that could touch PHI (cloud, error tracking, AI model providers, support desk). **The AI provider BAA is the hard one** — not all offer it, and those that do often require a specific tier.
- Security Rule administrative/physical/technical safeguards, most of which overlap SOC 2.
- **Breach Notification Rule** — notification without unreasonable delay and no later than **60 days**, with HHS and (for breaches ≥500 individuals) media notification.
- Minimum necessary, access controls, audit controls, integrity, transmission security.

**Recommendation:** do **not** claim HIPAA readiness until the vertical is a funded decision. The right posture until then is an explicit contractual **prohibition on PHI** in the ToS plus product warnings in healthcare-adjacent flows. `[CORPUS from 03]` shows Sprinklr and Emplifi offering BAAs; it is a real enterprise differentiator, but it is a program, not a checkbox.

### 9.5 PCI DSS — scope avoidance is the strategy

`[K-STRUCT]` + `[GH]` (**v4.0.1, 12 requirements, SAQ types A–D and P2PE**).

| Model | SAQ | Our scope | Verdict |
|---|---|---|---|
| Hosted payment page / redirect (Stripe Checkout, etc.) | **SAQ A** | Minimal | **Do this** |
| Embedded iframe / JS-hosted fields (Stripe Elements) | **SAQ A** (with Req 6.4.3 script-integrity obligations) | Small but real | Acceptable |
| Direct API post of PAN from our server | SAQ D | **Our entire platform becomes a CDE** | **Never** |

**v4.0.1 specifics that catch people even at SAQ A** `[GH]`: **Req 6.4.3** (management and integrity assurance of **payment-page scripts**) and **Req 11.6.1** (change/tamper detection on payment pages). These apply to the merchant's page even when the fields are the processor's. Practical control: a strict CSP on the checkout page, subresource integrity, and an inventory of every script on it.

**Never store PAN, CVV, or full track data. Store the processor's token only.** With that rule held, PCI is a one-page annual SAQ and not a program.

### 9.6 FedRAMP, StateRAMP, TX-RAMP

`[CORPUS from 03]` + `[GH]`.

**Market evidence, which is unusually clear:**
- **Sprinklr is the only social vendor with FedRAMP**, at **Low Impact (LI-SaaS), announced October 2022, delivered via AWS** `[CORPUS]`. LI-SaaS is limited to low-impact, public-facing workloads — **it is not Moderate** and does not support sensitive federal workloads.
- **Hootsuite sells to US public sector without FedRAMP**, through the **Carahsoft** GSA reseller channel `[CORPUS]`.
- `[CORPUS from 03 §212]` notes that under 2026 consolidated rules, **"FedRAMP Authorized" is becoming "FedRAMP Certified"** and the **"FedRAMP Ready" designation is being retired**. `[GH]` corroborates a **FedRAMP CR26** structure with **certification Classes A–D** and a **September 2026 OSCAL submission mandate**.

**Cost/timeline `[K-VOL]`:** FedRAMP Moderate has historically been **$500k–$2M+ and 12–24 months**, including a 3PAO assessment and a sponsoring agency, with ongoing continuous monitoring costs of several hundred thousand dollars annually. The 2026 consolidation is explicitly intended to reduce this; **actual current cost is UNVERIFIED.**

**Recommendation:** **No FedRAMP until a named, funded federal opportunity exists.** The rational ladder is:
1. **StateRAMP / TX-RAMP** for state and local government — materially cheaper, and TX-RAMP is mandatory for Texas state agencies. StateRAMP accepts FedRAMP-equivalent evidence, so the work is reusable.
2. **Carahsoft or similar GSA reseller** for federal-adjacent buyers who can accept a non-FedRAMP tool.
3. FedRAMP only against a real, sponsored deal.

### 9.7 The rest of the certification landscape

| Certification | Who asks | Effort | Verdict |
|---|---|---|---|
| **Cyber Essentials / Cyber Essentials Plus** (UK) | UK public sector and some UK enterprises. **Mandatory for certain UK government contracts** | **Very low** — CE is a self-assessment questionnaire; CE+ adds a technical audit. Days-to-weeks, low four figures `[K]` | **Do it.** Cheapest credential-per-pound in this document |
| **TISAX** (automotive, VDA ISA) | German automotive OEMs and suppliers | Medium — an ENX-registered assessment, 27001-adjacent | **Only if pursuing automotive.** BMW/VW/Mercedes agencies will ask |
| **C5** (BSI, Germany) | German public sector and regulated buyers | Medium; attestation-based, 27001-adjacent | Consider for DACH enterprise |
| **IRAP** (Australia) | Australian government | Medium-high | Only against a deal |
| **ISO 22301** (BCM) | Occasionally in enterprise RFPs | Medium | Defer; SOC 2 Availability usually suffices |
| **HITRUST CSF** | US healthcare, increasingly demanded over plain HIPAA | **High** — expensive and prescriptive | Only if healthcare is a core vertical |
| **CSA STAR** (Level 1 self-assessment) | Cloud buyers; a free credibility signal | **Very low** — publish a CAIQ | **Do it.** The CAIQ answers 80% of security questionnaires anyway |

**The highest-ROI move in this whole section** is not a certification at all: publish a **Trust Center** with the SOC 2 report (under NDA), ISO certificates, pen-test summary letter, CAIQ, sub-processor list, DPA, TOMs, VPAT, and status/uptime history. `[CORPUS from 01, 03]` shows this is exactly what the benchmark lacks, and it deflects the majority of inbound security questionnaires — which are otherwise a permanent, growing tax on engineering and sales time.

---

## 10. Token and credential security

This is the section where the product either has a defensible security story or does not. Everything else in this document is paperwork by comparison.

### 10.1 The threat model, stated plainly

We are asking millions of businesses to hand us credentials that let us **post as them** to their most public-facing asset. The asymmetry is brutal:

- A breach of a normal SaaS leaks data. **A breach of our vault leaks the ability to act** — to post, delete, message customers, run ads, and change page settings, in the customer's name, at scale, immediately.
- The damage is **instant and public**. A compromised token used to post to a brand's 2M-follower account produces reputational damage in seconds that no incident response can undo.
- The blast radius is **the entire customer base at once** if keys are shared, because one key decrypts everything.
- **Platform retaliation compounds it.** A mass-abuse event traced to our app ID gets the app suspended, which kills every tenant's connection — including the unaffected ones. `[CORPUS from 06 §181]` already identifies app-wide permission revocation as a catastrophic, predictable failure mode.

The adversaries that matter, in descending order of realism:
1. **A compromised sub-processor or vendor** (the Buffer/MongoHQ and CircleCI pattern — §11.1).
2. **A compromised engineer endpoint or CI/CD pipeline** with production access (the LastPass and CircleCI pattern).
3. **Social engineering of internal support/admin tooling** (the Mailchimp and Okta pattern).
4. **Application-layer flaws** — IDOR/broken tenant isolation letting tenant A act as tenant B, SSRF reaching the metadata service or the KMS, or log/exception leakage of tokens.
5. **Insider misuse** — an employee reading tenant inboxes.
6. **Platform-side token invalidation events** — not an attack, but operationally identical to one (the Facebook 2018 token bug — §11.3).

### 10.2 Non-negotiable baseline

| # | Control | Rationale |
|---|---|---|
| 1 | **Tokens never stored in plaintext, anywhere, ever** — including logs, exception traces, support tools, analytics events, and CI artifacts | The most common real-world leak is a stack trace, not a database dump |
| 2 | **Envelope encryption: DEK encrypts data, KEK encrypts DEK, KEK lives in a KMS/HSM** | `[GH]` OWASP: *"The KEK must be stored separately from the DEK"*; *"You should not store keys next to the secrets they encrypt, except if those keys are encrypted themselves"* |
| 3 | **AEAD cipher — AES-256-GCM** (or ChaCha20-Poly1305) | `[GH]` OWASP: *"Where available, authenticated modes should always be used"* — GCM/CCM first choice |
| 4 | **AAD binds ciphertext to its context** — tenant ID, connection ID, platform, key version as Additional Authenticated Data | Prevents a stolen ciphertext being replayed into another tenant's row. Cheap, and it turns a database-write vulnerability into a decryption failure |
| 5 | **Per-tenant KEK** | Blast radius + crypto-shredding. §10.3 |
| 6 | **The application never holds the KEK** — it calls KMS `Decrypt` for the DEK, uses it in memory, and discards it | Compromise of the app tier yields transient access, not the keys |
| 7 | **DEK caching bounded and explicit** — short TTL, memory-only, never swapped/dumped | Latency demands some caching; make the window a deliberate number |
| 8 | **Separate trust domain for keys** — KMS IAM policy that the database credentials cannot satisfy | If the DB and the key are reachable by the same identity, envelope encryption is theatre |
| 9 | **Revocation-first design** — a `reauth_required` state machine on every connection `[CORPUS from 07 §15.2]` | Tokens die constantly in normal operation; the same path serves incident response |
| 10 | **Least-privilege scopes at OAuth time** | The best-protected token is the one that cannot do much. Request the minimum scope set per feature, not a maximal set at connect |

### 10.3 Per-tenant keys — the decision that must be made first

**The design:**

```
KMS / HSM  (Cloud KMS, AWS KMS, Azure Key Vault; CloudHSM for BYOK)
   │
   └── Root / master key  (per region — never leaves the region, §4.4)
          │
          ├── tenant_KEK[tenant_A]   ──┐
          ├── tenant_KEK[tenant_B]     │  KMS-resident, never exported
          └── tenant_KEK[tenant_C]   ──┘
                     │
                     ▼  KMS Decrypt(wrapped_DEK) → plaintext DEK (memory only, short TTL)
          ┌──────────────────────────────────────────────────┐
          │ credential row                                   │
          │  tenant_id, connection_id, platform              │
          │  key_version                                     │
          │  wrapped_dek        (DEK encrypted under KEK)    │
          │  ciphertext         (AES-256-GCM)                │
          │  aad = tenant_id|connection_id|platform|key_ver  │
          │  nonce, auth_tag                                 │
          └──────────────────────────────────────────────────┘
```

**What per-tenant keys buy, concretely:**

| Property | With a single global key | With per-tenant KEKs |
|---|---|---|
| Breach blast radius | **All tenants** | One tenant per compromised KEK grant |
| GDPR erasure / end-of-contract deletion | Distributed delete across N stores + backups + a "beyond use" argument | **Destroy the KEK. Done.** Ciphertext everywhere — including backups — becomes noise |
| Proving deletion to an auditor | Procedural narrative | **Cryptographic**, and demonstrable |
| Residency enforcement | Policy | **Mechanical** — EU KEK in EU KMS means US infrastructure cannot decrypt EU data even if it obtains the ciphertext |
| Per-tenant key rotation | All-or-nothing | Independent, incremental |
| Enterprise BYOK/HYOK | Impossible | **A natural upsell** — the customer holds the KEK in their own KMS |
| Cost | Minimal | **KMS API calls per decrypt** — the real trade-off (§10.4) |

**BYOK/HYOK as a product.** Once per-tenant KEKs exist, letting an enterprise customer supply and control their own KEK — with the ability to revoke it and thereby instantly render their data unreadable to us — is a modest incremental build and a genuine enterprise differentiator. `[CORPUS from 03]` shows no vendor in this category offering it. It also transforms the residency and DPF conversation: a customer who holds the key has a materially stronger transfer story.

**⚠️ The irreversibility argument, restated because it is the most important sentence in this document:** migrating from a global key to per-tenant keys requires re-encrypting every credential and every encrypted content row for every tenant, online, while the platform is publishing on a schedule. It is a quarter of work and a serious incident risk. Doing it at the start costs perhaps two extra weeks.

### 10.4 The cost and latency trade-off, honestly

Per-tenant KEKs mean a KMS `Decrypt` call on the path to using a credential. At high publish volumes this is both a latency and a cost item.

| Mitigation | Effect | Caveat |
|---|---|---|
| **Cache the unwrapped DEK in memory** with a short TTL (e.g. 5–15 min) keyed by tenant | Collapses KMS calls by orders of magnitude | The TTL is a deliberate security/performance trade — document it |
| **KMS data-key caching libraries** (AWS Encryption SDK caching CMM and equivalents) | Bounded reuse with configurable max messages/bytes/age | Use the library's limits rather than hand-rolling |
| **Rekey threshold discipline** | `[GH]` OWASP flags an encryption-volume rekey trigger (~34 GB cited for 64-bit block ciphers) | AES-GCM's practical limit is nonce-space, not block size — **never reuse a nonce with the same key**; use random 96-bit nonces with a counted key-usage cap, or deterministic counters per key |
| **Batch operations per tenant** | Publishing 50 posts for one tenant should unwrap one DEK, not 50 | Design the scheduler to be tenant-affine |

`[K]` Cloud KMS pricing is on the order of **$1/key/month plus ~$0.03 per 10,000 requests**; with sane caching the cost is negligible even at millions of connections, but **without** caching a high-volume publisher could generate a surprising bill. Model it before launch.

### 10.5 Rotation

| Secret | Rotation | Mechanism |
|---|---|---|
| **Platform access tokens** | Continuously, by the platform's own TTL | `[CORPUS from 06]` documents the TTLs: TikTok 24h access / 365d refresh **with rotating refresh tokens**; Pinterest 30d access / 365d refresh; Meta long-lived ~60d. **Proactive refresh scheduler with jitter** `[CORPUS from 07]` — never refresh on the request path, never thunder at midnight UTC |
| **Refresh tokens (rotating)** | Every use | **The rotation-race hazard:** two concurrent workers refreshing the same connection both submit the old refresh token; one wins, the other's token is invalidated and the platform may treat replay as theft and revoke the grant. **Requires a per-connection distributed lock or single-writer refresh path.** This is a real, common outage cause |
| **Tenant KEKs** | Annually, or on suspicion | KMS-native rotation; re-wrap DEKs lazily on next access with `key_version` tracking |
| **Our OAuth client secrets** (per platform app) | Annually and on staff departure | **Painful** — some platforms invalidate all tokens on client-secret change. Verify per platform *before* rotating. This is a known footgun |
| **Database/service credentials** | Short-lived, dynamic | `[GH]` OWASP: dynamic secrets that expire on service restart; prefer IAM-based auth over static passwords |
| **Human user credentials** | `[GH]` OWASP: *"User credentials are excluded from regular rotation. These should only be rotated if there is suspicion or evidence that they have been compromised"* | Forced periodic password rotation is now an anti-pattern. **MFA (phishing-resistant, WebAuthn where possible) matters far more** |

**Secret zero.** `[GH]` OWASP names the bootstrapping problem directly: *"you will often have to secure the primary secret of that secrets management solution in a secondary secrets management solution."* Our answer should be **cloud-native workload identity** (IAM roles for service accounts / instance metadata / Kubernetes projected service-account tokens) so that no long-lived bootstrap secret exists in a config file or environment variable at all. `[GH]` OWASP explicitly warns against environment variables for keys due to accidental-exposure risk.

### 10.6 Crypto-shredding as the deletion primitive

The deletion obligations in §5 and the platform obligations in §12 both reduce to the same operation if the key hierarchy is right.

| Deletion event | Operation |
|---|---|
| Tenant disconnects one social account | Revoke token at the platform, delete row, delete that connection's DEK |
| Tenant closes account / contract ends | **Destroy `tenant_KEK`** → all that tenant's ciphertext, in every store and every backup, is unrecoverable |
| Data subject erasure (D4) | Per-subject or per-record DEK where feasible; otherwise targeted delete + tombstone replay (§5.4) |
| Platform demands deletion (§12) | Scoped delete by platform + data class |
| Region exit | Destroy the regional key material |

**Caveat that must be stated in the DPA:** `[GH]` OWASP notes *"Old keys should generally be stored for a certain period after they have been retired, in case old backups of copies of the data need to be decrypted."* This directly conflicts with crypto-shredding. **Resolve it explicitly:** retired keys used for *rotation* are retained; keys destroyed for *erasure* are destroyed irrevocably, with the KMS's scheduled-deletion window (typically 7–30 days) documented as the outer bound of the deletion SLA. Do not let an operational key-retention policy silently defeat the erasure guarantee.

### 10.7 Tenant isolation — where multi-tenant SaaS actually fails

Encryption is necessary and insufficient. The more common real failure is **authorization**, not cryptography.

| Control | Implementation |
|---|---|
| **Every query is tenant-scoped, structurally** | Row-level security in the database, or a data-access layer where an un-scoped query is impossible to express. **Not** "remember to add `WHERE tenant_id = ?`" — that fails eventually, and once is enough |
| **AAD binding** (§10.2 #4) | Turns a missed tenant filter into a decryption error rather than a data leak. **This is why AAD is worth the effort** |
| **Automated cross-tenant tests in CI** | Property test: tenant A's credentials, tenant B's object ID, assert 404/403 — run against every endpoint, generated from the route table so new endpoints are covered by default |
| **SSRF defence** | `[CORPUS from 07 §15.4]` — tier-2 platforms require server-side fetches of user-supplied URLs (Mastodon instances, WordPress sites, RSS feeds, webhook URLs, media `sourceUrl`s). **Allowlist schemes, block link-local/metadata/private ranges, resolve-then-pin DNS to defeat rebinding, no redirects to private space, egress proxy with its own policy** |
| **Admin/support tooling is a first-class attack surface** | §11.2. Impersonation requires justification + tenant-visible audit entry + time limit; bulk export requires two-person approval |
| **Webhook URLs are bearer credentials** | `[CORPUS from 07]` — treat Discord/Teams/Slack webhook URLs as secrets, encrypt them, never log them, never render them in a UI without masking |

### 10.8 Detection

Encryption prevents; detection bounds the damage. The signals that matter for a token vault, none of which are expensive:

| Signal | Detects |
|---|---|
| KMS `Decrypt` volume per tenant vs. baseline | Bulk exfiltration attempt |
| Decrypt calls from an unexpected role, service, or region | Lateral movement |
| Publishing rate anomaly per tenant/connection | Token abuse in progress |
| Content-similarity spike across unrelated tenants | **Mass spam via compromised tokens — the Buffer 2013 signature** |
| Sudden spike in platform-side auth errors | Platform detected abuse before we did |
| Geographic/ASN anomaly on admin logins | Account takeover |
| `reauth_required` transitions clustering in time | Mass platform revocation event |
| Any decrypt of a credential **not** attributable to a scheduled job or an authenticated user action | The high-signal one — **build the attribution field into the decrypt path from day one** |

**Kill switches to build before launch, not during an incident:**
1. Global publish pause (all tenants).
2. Per-tenant publish pause.
3. Per-platform pause (one platform misbehaving or one integration compromised).
4. Mass token revocation + forced re-auth.
5. Per-connection quarantine.

---

## 11. Breach blast-radius and incident history

### 11.1 What actually happened — real incidents and the lesson each carries

> **Sourcing note.** I could not perform live research this session. Everything below is `[K]` (May 2026 cutoff) and is included because these incidents are widely documented and the lessons are structural. **The specific SMM-vendor incidents I was asked to research — Hootsuite, Socialbakers, Khoros — I could not verify and will not fabricate.** See §11.2 for what I can and cannot say about each.

| # | Incident | What happened | Lesson for us |
|---|---|---|---|
| 1 | **Buffer, October 2013** `[K]` | Attackers posted spam to users' connected Facebook and Twitter accounts. The intrusion path was traced to a compromise at **MongoHQ**, Buffer's hosted database provider, whose internal support tooling was breached, exposing customer databases — including Buffer's stored OAuth access tokens. Buffer subsequently encrypted stored tokens. | **The canonical incident for this exact product category.** Three lessons: (a) **your sub-processor's support tool is your attack surface**; (b) tokens at rest must be encrypted with keys the database compromise does not yield — envelope encryption in a separate trust domain; (c) the abuse signature was *mass similar content across unrelated accounts*, which is trivially detectable and should be an always-on alert (§10.8) |
| 2 | **GitHub / Heroku / Travis CI, April 2022** `[K]` | An attacker used **stolen OAuth user tokens issued to Heroku and Travis CI** to authenticate to GitHub and download private repositories from dozens of organisations. Heroku forcibly revoked and rotated tokens. | **The definitive "integration platform as attack vector" case.** We are structurally identical to Heroku here: we hold third-party OAuth tokens for many customers. It establishes that (a) attackers specifically target integrators to reach their customers, and (b) **the required response is mass revocation**, which must be a pre-built, tested capability |
| 3 | **CircleCI, January 2023** `[K]` | Malware on an engineer's laptop stole a session cookie backed by an already-authenticated SSO session, bypassing MFA and granting production access. Customer environment variables, tokens and keys were exfiltrated. CircleCI instructed **all customers to rotate all secrets**. | (a) **MFA does not protect a stolen post-authentication session** — bind sessions to device posture and re-verify for privileged actions; (b) engineer endpoints are in scope of the security boundary; (c) the customer-facing consequence is "rotate everything", which for us means **every tenant must reconnect every social account** — model that scenario and its support load now |
| 4 | **Okta support system, October 2023** `[K]` | Attackers accessed the customer support case management system; **HAR files uploaded by customers for troubleshooting contained live session tokens**, which were used against downstream customers. | **Support artifacts contain credentials.** Any support flow that accepts HAR files, logs, screenshots or exports needs automated secret scrubbing on ingest and short retention. We will absolutely ask customers for diagnostic output |
| 5 | **Mailchimp, 2022 and 2023 (repeatedly)** `[K]` | Social engineering of employees granted access to internal admin/support tooling, exposing customer accounts and API keys; consequences propagated to *their* customers' audiences. | **Internal admin tooling is the crown jewel of a multi-tenant SaaS**, and social engineering — not exploitation — is how it falls. Justification-gated impersonation, tenant-visible audit trails, and two-person control on bulk operations (§10.7) |
| 6 | **LastPass, 2022** `[K]` | A DevOps engineer's home machine was compromised via vulnerable third-party software; the attacker obtained decryption keys enabling access to backup vault data. | **Key custody must be separated from data custody**, and a very small number of engineers holding both is the failure mode. Argues for HSM-backed keys, quorum controls on key operations, and minimising the set of humans who can perform them |
| 7 | **Facebook "View As" token bug, September 2018** `[K]` | A flaw in the *View As* feature exposed access tokens for a very large number of accounts (initially reported ~50M, later revised down to ~30M). Facebook invalidated tokens en masse. | Not our breach, but **operationally identical to one**: mass platform-side invalidation. Our system must survive "every Meta token is now invalid" without data loss, with graceful degradation, clear tenant messaging, and a re-auth funnel that does not melt support |
| 8 | **Twilio, 2022** `[K]` | SMS phishing of employees harvested credentials; downstream impact on customers including the Authy 2FA product. | **Phishing-resistant MFA (WebAuthn/FIDO2) for all staff**, not TOTP. This is a cheap control with an outsized effect |
| 9 | **Snowflake-linked customer breaches, 2024** `[K]` | Numerous customer environments accessed via stolen credentials where **MFA was not enforced**. | For a data platform holding tenant analytics, **enforce MFA and network policy at the platform level** — do not rely on customers configuring it |

### 11.2 The SMM-vendor incidents I was asked about — honest status

| Vendor | Status |
|---|---|
| **Buffer (2013)** | **Verified to the level of `[K]`** — widely documented, publicly post-mortemed by Buffer at the time. Described above |
| **Hootsuite** | **UNVERIFIED.** I do not have a confirmed record of a material Hootsuite token/credential breach. There has been public controversy about Hootsuite's business decisions (notably a 2020 ICE contract dispute) which is **not** a security incident and must not be conflated. **Do not assert a Hootsuite breach without verification** |
| **Socialbakers** | **UNVERIFIED.** No confirmed breach known to me. Socialbakers was acquired by Astute/Emplifi in 2021 `[CORPUS from 03]` |
| **Khoros** | **UNVERIFIED.** No confirmed breach known to me. Khoros is the Lithium + Spredfast combination |

**This is a genuine research gap and it is listed in §17 as a priority verification item**, because "here is what happened to our competitors and here is why it cannot happen to us" is a powerful enterprise security-review narrative — but only if the incidents are real.

### 11.3 Blast-radius containment — the design targets

| Containment boundary | Mechanism | Target |
|---|---|---|
| **Per-tenant** | Per-tenant KEK (§10.3) | One compromised KEK grant = one tenant |
| **Per-connection** | Per-connection DEK | One leaked ciphertext = one social account |
| **Per-region** | Regional KMS, no cross-plane key access (§4.4) | An EU compromise cannot read US data and vice versa |
| **Per-platform** | Separate OAuth client credentials per platform; per-platform kill switch | One platform integration compromised ≠ all of them |
| **Per-environment** | Production keys unreachable from staging/dev; separate accounts/projects | `[GH]` OWASP: development and production secrets in separate management solutions |
| **Time** | Short DEK cache TTL; short-lived tokens; dynamic DB credentials | Bounds the value of any single captured moment |
| **Privilege** | Scope minimisation at OAuth; no standing production access for humans (just-in-time, approved, time-boxed, recorded) | Reduces what a compromised human identity can do |

### 11.4 The scenario nobody plans for: our app gets suspended

`[CORPUS from 06 §181]` identifies this as catastrophic-but-predictable. It deserves an explicit plan because it is **more likely than a breach**:

- **Trigger:** failed Meta Data Use Checkup, a policy violation, a mass-abuse event traced to our app ID, or an unannounced enforcement sweep.
- **Effect:** every tenant's connections to that platform stop working simultaneously. Not degraded — dead.
- **Plan:** (a) named owner per platform relationship, with escalation contacts established *before* they are needed; (b) monitoring for permission-level changes on our app, not just API errors; (c) tenant comms templates pre-written; (d) a documented degradation mode — reminder-publishing fallback `[CORPUS from 06 §6]` keeps some value alive; (e) never let a single platform account or single app ID be a single point of failure where the platform permits multiple.

### 11.5 Incident response obligations — the clock table

| Regime | Clock | To whom |
|---|---|---|
| **GDPR (controller)** | **72 hours** from awareness | Supervisory authority; data subjects "without undue delay" if high risk |
| **GDPR (processor → controller)** | **"Without undue delay"** | Our customer. **Define this in the DPA as a specific number (24 or 48h) — customers will ask** |
| **UK GDPR** | 72 hours | ICO |
| **HIPAA** | **60 days** | Individuals, HHS; media if ≥500 |
| **CCPA** | No fixed statutory clock for notification, but the **private right of action** attaches | Affected consumers under CA breach law |
| **US states** | Varies; several impose 30–45 day outer limits | State AGs and residents |
| **NIS2** (if in scope) | `[GH]` **24h early warning / 72h notification / 1-month final report** | CSIRT |
| **DORA** (if pulled in) | `[GH]` **4h/24h initial, 72h intermediate, 1-month final** (Art. 19) | Competent authority via the financial entity |
| **PIPL / China** | Immediate remedial action + notification | CAC and individuals |
| **Australia NDB** | Assess within 30 days; notify eligible breaches | OAIC + individuals |
| **Brazil LGPD** | "Reasonable time" as set by ANPD | ANPD + data subjects |
| **Platform terms** | Meta and others require prompt notification of security incidents affecting Platform Data | Platform |

**Practical consequence:** a single incident involving one EU enterprise customer can trigger our 72-hour clock, our customer's 72-hour clock, a platform notification, and — if the customer is a bank — a DORA chain. **The IR runbook must have a notification matrix, pre-drafted, with owners.** Writing it during an incident guarantees a missed deadline.

---

## 12. Platform policy compliance

**This section is the one that constrains the analytics architecture.** Privacy law tells us what we may do with personal data; platform terms tell us what we may do with *their* data, and the platform terms are frequently stricter, enforced faster, and appealable to nobody.

### 12.1 The universal rules across all major platforms

`[K-STRUCT]` — these hold across Meta, X, LinkedIn, TikTok, YouTube, Pinterest, Snap and Reddit with only wording differences:

1. **Use platform data only to provide the service the user authorised.** No secondary use.
2. **Do not sell, license, or transfer platform data** — explicitly including transfers to data brokers, ad networks, or data resellers.
3. **Do not build or enrich standalone user profiles / identity graphs** from platform data.
4. **Delete platform data** when the user disconnects, when the user deletes their account, when it is no longer needed for the authorised purpose, or when the platform requests it.
5. **Honour deletions upstream.** If a post/comment/account is deleted on the platform, our copy must go too.
6. **Do not use platform data for surveillance**, law enforcement targeting, or eligibility determinations (credit, insurance, employment, housing, education).
7. **Do not use platform data to train AI/ML models** — near-universal now, and the most commonly violated rule in the current market.
8. **Do not scrape.** API-only. `[CORPUS from 07 §2949]` is blunt: *"Never scrape in-house... **Never scrape Google** — it endangers GBP API access."*
9. **Security obligations** — protect data, notify on incident, submit to audit on request.
10. **Right to audit and to terminate.** Effectively unilateral.

**The AI-training prohibition (#7) is the one to internalise.** It is simultaneously a platform-terms issue, a GDPR purpose-limitation issue (§3.2), and a contractual issue with our own customers. `[CORPUS from 09 §840]` states the position bluntly for a related practice: *"doing this in a product you sell is a direct breach of the platform terms."* The engineering control is a hard, tested boundary between inference-time context (permitted) and training pipelines (prohibited).

### 12.2 Meta

`[CORPUS from 06 §10, §12]` + `[GH]` (Meta App Review packet) + `[K]`.

| Obligation | Detail | Grade |
|---|---|---|
| **Business Verification** | Legal entity documents + domain verification, before Advanced Access | `[CORPUS]` |
| **App Review per permission** | Screencast + step-by-step reviewer instructions + working test credentials | `[CORPUS]` |
| **Prerequisite for submission** | **At least one successful Graph API call per requested permission within the 30 days before submission** | `[GH]` |
| **Review turnaround** | 2–5 business days per round; **4–12 weeks end-to-end with the rejection rounds that are normal** | `[GH]` / `[CORPUS]` |
| **Annual Data Use Checkup (DUC)** | Annual per-app attestation that data use matches approved purposes | `[GH]` / `[CORPUS]` |
| **Data Protection Assessment (DPA)** | Extensive questionnaire for apps accessing certain data. **Failure can revoke permissions app-wide** | `[CORPUS from 06 §181, §1218]` |
| **Tech Provider designation** | Applies when providing technology to *other businesses* (i.e. us). Carries contract-flow-down and data-use restrictions | `[CORPUS]`. Note `[CORPUS from 05 §1296]` clarifies **Meta Business Partner status is *not* required to publish** — it is a directory/badge program with revenue thresholds. **Do not confuse the two** |
| **Deletion callbacks** | Data Deletion Request Callback and Deauthorize Callback endpoints must be implemented and live | `[K]` |
| **Retention** | Delete when no longer needed for the authorised purpose; delete on disconnect/user deletion; honour deletion requests. **No blanket day-count cache limit that I can verify** | `[K]` — **verify** |

**Highest-severity recurring risk in this document:** the DUC/DPA is an **annual, app-wide kill switch**. Assign a named owner, calendar it 90 days ahead, and treat a missed response as a Sev-1.

### 12.3 X / Twitter

`[GH]` from the mirrored `X_Twitter-API-V2/Compliance.md`, plus `[CORPUS from 06 §13]`.

**The batch compliance system — verified mechanics** `[GH]`:

| Step | Detail |
|---|---|
| 1 | Create a compliance job (type: `tweets` or `users`) |
| 2 | Upload the ID dataset as plain text to the provided URL — **the upload URL expires in 15 minutes** |
| 3 | Poll status: `created` → `in_progress` → `complete` \| `failed` |
| 4 | Download results — **the download URL expires 7 days after job creation** |

**Five compliance event types that must be honoured** `[GH]`: `deleted`, `deactivated`, `scrub_geo`, `protected`, `suspended`.

The documentation's own framing `[GH]`: developers must ensure stored data reflects current platform state, because *"it is critical for both Twitter and our developers to honor that person's expectations and intent."* **No mandatory reconciliation *schedule* is specified in the fetched doc** `[GH]` — but the obligation to be in compliance is unconditional, which in practice means running batch compliance jobs on a schedule we choose and can defend. **Recommendation: daily for active data, and before any export or report generation.**

**Analytics constraint** `[CORPUS from 06 §423, §438, §856]`: `non_public_metrics` and `organic_metrics` (impressions, URL link clicks, profile clicks) are available **only to the post owner and only for posts less than 30 days old**. *"Impressions on a 31-day-old post are gone forever."* **This is a hard architectural requirement: we must capture and durably store private metrics within the 30-day window or lose them permanently.** A backfill is impossible.

### 12.4 LinkedIn

`[GH]` from the mirrored `Linkedin_API/API.md`, plus `[CORPUS from 06]`.

| Finding | Detail | Grade |
|---|---|---|
| **Compliance API is CLOSED** | `r_compliance` / `w_compliance` — "Compliance monitoring and archiving" and "manage and delete data for compliance". **"Access is closed and may not be requested."** | `[GH]` — **verified this session, and strategically load-bearing (§13.4)** |
| Caching/retention limits | **The fetched documentation does not state them.** `[GH]` notes explicitly: *"does not specify data retention periods, automatic deletion periods... suggesting these details exist in separate terms of service or partnership agreements"* | **UNVERIFIED — highest-priority verification item in §17** |
| Member data restrictions | Explicit member authorisation required; revocation triggers re-authentication | `[GH]` |
| Access programs | Community Management API and Marketing Developer Platform require separate application and approval | `[CORPUS]` |
| No webhooks | LinkedIn has no webhook mechanism — polling only | `[CORPUS from 06]` |

**⚠️ LinkedIn is the platform where I am least able to give you a verified caching limit, and it is simultaneously the platform most reputed to have a strict one.** My recollection `[K]` is that LinkedIn's API terms have historically imposed tight caching constraints (commonly reported as a 24-hour norm for certain member data, with deletion on request and on member revocation), but **I cannot verify the current number and will not state one as fact.** Architect defensively: **treat LinkedIn data as the shortest-retention source in the warehouse, store derived aggregates rather than raw member records, and design the schema so LinkedIn's retention can be tightened independently without touching other platforms.**

### 12.5 YouTube / Google

`[CORPUS from 06]` + `[K]`.

| Obligation | Detail | Grade |
|---|---|---|
| **Stored-data refresh/deletion rule** | My recollection is that the YouTube API Services Developer Policies require API data to be **refreshed or deleted on approximately a 30-day cycle**, with carve-outs (notably for aggregated/anonymised metrics and for certain IDs) | `[K]` — **verify; it directly sizes our YouTube analytics store** |
| **No stream separation** | Video/audio streams must not be downloaded, separated, or played outside the YouTube player. **No "download the video to re-clip it" feature** without a different licence path | `[K]` — structurally stable, high confidence |
| **Reporting API bulk CSVs** | Google retains generated report files **60 days** | `[CORPUS from 06 §1119]` |
| **YouTube Analytics history** | Full history available via the Analytics API — unusually generous | `[CORPUS from 06 §444]` |
| **Quota** | Default Data API quota is small; a quota extension requires an audit and is a named calendar dependency | `[CORPUS from 06 §1333]` |
| **OAuth verification** | Google OAuth app verification, with a security assessment for sensitive/restricted scopes | `[K]` |

**The apparent contradiction between "refresh or delete on ~30 days" and "full analytics history" is resolved by *what kind* of data it is:** aggregated metrics you query on demand from the Analytics API are not the same as cached copies of user/content data. **Our design should lean on querying the Analytics API for history and storing aggregates**, rather than warehousing raw YouTube entity data — which is both cheaper and the compliant posture.

### 12.6 TikTok, Pinterest, and the rest

| Platform | Key constraints | Grade |
|---|---|---|
| **TikTok** | Content Posting API requires an **audit** before unaudited-client restrictions lift `[CORPUS from 06]`. Token TTLs: **24h access / 365d refresh, refresh token rotates** `[CORPUS from 06 §164]`. Research API has separate, stricter terms. Specific caching limits **UNVERIFIED** | `[CORPUS]` / UNVERIFIED |
| **Pinterest** | 30d access / 365d refresh, optional continuous refresh mode `[CORPUS from 06 §166]`. Standard access requires application. No specific day-limit known | `[CORPUS]` / UNVERIFIED |
| **Reddit** | ~1h token TTL requiring aggressive refresh `[CORPUS from 07]`. Commercial API terms and pricing changed sharply in 2023; **data licensing for AI training is explicitly monetised and separately licensed** | `[CORPUS]` / `[K]` |
| **Snap, Threads, Bluesky, Mastodon** | Covered in `07-platform-apis-tier2.md`. Fediverse introduces **per-host client secrets** and SSRF exposure `[CORPUS from 07 §15.2, §15.4]` | `[CORPUS]` |
| **Chinese platforms** | §8.3 — component/ticket model, ICP filing, separate legal entity | `[CORPUS from 08]` |

### 12.7 What actually causes app suspension

`[K-STRUCT]`, ordered by observed frequency in this category:

1. **Failing or ignoring an annual review** (Meta DUC/DPA; LinkedIn periodic compliance review). The most common cause and the most preventable.
2. **Scope creep** — using data for a purpose not described in the app review submission.
3. **Retention violations** — holding data past the platform's ceiling, discovered during an audit.
4. **Scraping or unofficial access**, including a "cookie-session" or browser-automation path. `[CORPUS from 09 §8]` notes public MCP servers now drive X and LinkedIn through authenticated Chrome sessions with no API key — *"technically potent, contractually radioactive."* **Never ship this.**
5. **Sharing credentials or data across app IDs**, or letting one tenant's data reach another.
6. **Rate-limit abuse** and retry storms.
7. **Mass user reports** triggered by spammy tenant behaviour — **our tenants' conduct is our compliance problem**, which is why the T&S controls in §15 protect our platform access, not just our reputation.
8. **Misrepresentation in app review** — the fastest route to permanent ban.
9. **Training AI on platform data** (§12.1 #7).

**Defensive posture:** a per-platform compliance owner, a calendar of recurring obligations, an internal "data use register" mapping every field we read to the approved purpose that justifies it, and automated retention enforcement that cannot be turned off by a tenant setting.

### 12.8 The retention matrix — the architectural output

The binding constraint on any table is the **strictest** rule touching any column in it. This is the practical design conclusion of §12.

| Source | Raw entity data | Private/owner metrics | Aggregates | Notes |
|---|---|---|---|---|
| **Meta** | Delete on disconnect; purpose-limited | ~2 years of day-series available `[CORPUS from 06 §420]` | Longer OK if anonymous | DUC/DPA annual |
| **X** | Reconcile via batch compliance `[GH]` | **HARD 30-DAY CAPTURE WINDOW** `[CORPUS]` | Aggregates OK | Must capture within 30 days or lose forever |
| **LinkedIn** | **Assume shortest; UNVERIFIED** | — | Prefer aggregates | Highest uncertainty |
| **YouTube** | ~30-day refresh-or-delete `[K]` | Query Analytics API on demand | Full history via API | Don't warehouse raw entities |
| **TikTok** | Delete on revocation | UNVERIFIED | — | Audit-gated |
| **Pinterest** | Delete on revocation | UNVERIFIED | — | |

**Three design rules follow, and they should be treated as requirements:**

1. **Never build a single undifferentiated `post_metrics` table across platforms.** Partition by source platform so retention policy is enforceable per-partition. A shared table inherits the union of every restriction.
2. **Separate the "raw platform entity" store from the "derived aggregate" store**, with different retention classes and an explicit, tested anonymisation step between them. The aggregate store is what powers long-range trend analytics and it is the only thing that can be kept indefinitely.
3. **Capture X private metrics inside 30 days, unconditionally** — a scheduled job, not an on-demand fetch. This is the only irreversible data-loss risk in the analytics design.

---

## 13. Content and industry regulation

Our customers publish regulated speech. We are generally not liable for it — but we are the tool that produced it, and **the product features that help them comply are a differentiator that nobody in the category has built properly.** `[CORPUS from 10]` shows the influencer module already contemplates FTC disclosure checking; this section generalises it.

### 13.1 Advertising disclosure — FTC and global equivalents

| Regulator | Instrument | Core requirement | Notes |
|---|---|---|---|
| **US — FTC** | **Endorsement Guides (16 CFR Part 255)**, revised 2023 | Disclose **material connections** between endorser and brand, **clearly and conspicuously** | The 2023 revision tightened treatment of **fake/incentivised reviews**, tags in images/video, and **liability of advertisers, intermediaries and agencies** — potentially us if we facilitate deceptive practice `[K]` |
| **US — FTC** | **Rule on the Use of Consumer Reviews and Testimonials** (2024) | Bans fake reviews, **AI-generated fake reviews**, review suppression, undisclosed insider reviews | `[K]` **Carries civil penalties per violation** — this is materially more dangerous than the Guides, which are interpretive |
| **UK — ASA/CAP** | CAP Code + CMA under DMCCA | `#ad` **upfront and prominent**; ASA publishes a non-compliance list | CMA gained **direct consumer-protection enforcement powers including fines** under the Digital Markets, Competition and Consumers Act `[K-VOL]` |
| **Australia — ACCC** | Australian Consumer Law | Misleading/deceptive conduct; influencer sweeps | AANA codes supplement |
| **Canada — Competition Bureau** | Competition Act | Material connection disclosure; **greenwashing amendments (2024)** added substantiation requirements | `[K]` |
| **EU** | UCPD + **Digital Fairness Act** proposals | Hidden advertising is a blacklisted practice | Plus **AI Act Art. 50** labelling (§6.2) |
| **India** | ASCI influencer guidelines + CCPA (consumer) guidelines | Disclosure labels specified, **including for virtual influencers** | `[K]` |

**Product build — the "compliance lint" for content.** `[CORPUS from 10 §1072]` already sketches this. Generalised:

| Check | Trigger |
|---|---|
| Disclosure present and prominent | Post is flagged as sponsored/paid/gifted |
| Disclosure placement | Not buried after "more", not hashtag-stuffed at the end |
| Platform-native disclosure toggle set | Meta Branded Content, TikTok Disclosure, YouTube paid promotion |
| **AI-generated content label** | Any asset with AI provenance (§6.2) — **legally required in the EU** |
| Prohibited claim scan | Per-industry claim allowlist/denylist |
| Substantiation prompt | Comparative/superiority claims |
| Regulated-industry ruleset | §13.2–13.3 |

This is a rules engine over the composer plus a per-tenant policy pack. It is a modest build and it is directly monetisable to agencies and regulated brands.

### 13.2 Pharma and healthcare

`[K-STRUCT]` + `[GH]`.

| Requirement | Detail |
|---|---|
| **Fair balance** | FDA requires benefit claims to be balanced with risk information. **Short-form formats (Stories, TikTok, Shorts) make this genuinely hard** `[GH]` |
| **Character-space-limited platforms** | FDA's guidance on limited-character communications requires benefit + most serious risks + a direct link to fuller risk info `[K]` |
| **Correcting third-party misinformation** | FDA guidance permits voluntary correction under defined conditions `[K]` |
| **Adverse event reporting** | **The one that catches social teams.** A comment or DM mentioning an adverse event may trigger a pharmacovigilance reporting obligation with a tight internal clock (commonly 24 hours to the safety function, 15 days to the regulator for serious events) `[K]` |
| **Off-label promotion** | Prohibited; comment moderation must not appear to endorse off-label use |
| **EU** | EFPIA codes + national rules; **direct-to-consumer prescription advertising is prohibited in the EU** — a fundamental difference from the US |
| **HIPAA** | §9.4 — inbound DMs and review responses |

**Product implication:** an **adverse-event keyword detector on inbound inbox and comments**, routing to a designated queue with an SLA timer, is a specific, high-value feature for pharma clients. It is also a strong reason those clients cannot use a generic tool.

### 13.3 Financial services

`[GH]` + `[K-STRUCT]`.

| Rule | Requirement |
|---|---|
| **FINRA Rule 2210** | Communications categorised as **retail communication**, **correspondence**, or **institutional communication**. Retail communications generally require **principal pre-approval**; certain categories require **filing with FINRA** (`[GH]` cites a 10-day filing window). Content standards: fair and balanced, no misleading claims, no performance guarantees `[GH]` |
| **FINRA Rule 3110** | Supervision — WSPs, surveillance, review evidence `[GH]` |
| **FINRA Rule 4511** | Books and records in 17a-4(f) format `[GH]` |
| **FINRA Rule 4513** | **Customer complaint records — 4 years** `[GH]` |
| **SEC Rule 17a-4** | **3 years** for business communications; **6 years** for blotters/ledgers/customer account records; **lifetime** for organisational documents. **First 2 years "easily accessible"** `[GH]` |
| **SEC Rule 204-2** (advisers) | **5 years**, first 2 easily accessible; includes **all written communications relating to any recommendation** and advertising/performance substantiation `[GH]` |
| **SEC Marketing Rule (206(4)-1)** | Governs adviser advertising including testimonials/endorsements — permitted since 2021 **with disclosure, oversight and disqualification provisions** `[K]` |
| **MiFID II** (EU) | Recording and retention of communications relating to transactions — **generally 5 years, extendable to 7 at competent-authority request** `[K]` |

**The static vs. interactive split — this drives the product design** `[GH]`:

| Content type | Classification | Requirement |
|---|---|---|
| **Static** — posts, profiles, published articles | Advertising / retail communication | **Registered principal pre-approval before use**; retention |
| **Interactive** — DMs, replies, comment threads | Correspondence or institutional communication | Full supervisory review + retention |
| **Ephemeral** — Stories, disappearing messages | **Still must be captured and retained** | `[GH]` flags this as *"a major enforcement focus area"* |

**Enforcement scale `[GH]`:** SEC and FINRA off-channel communications investigations from 2021–2024 produced **over $2 billion in combined industry penalties**, with individual firm fines reaching **$125 million**, and **self-reporting significantly reduced penalty exposure**. A separate `[GH]` source cites "$1.8 billion in 2023 across 16 firms" — the two figures are not reconcilable without checking and the second is from a lower-quality source; **treat the "over $2 billion cumulative 2021–2024" figure as the better-sourced one and verify both.**

**Product requirements for a regulated-industry tier:**
1. **Mandatory pre-publication approval** by a designated principal, with an unbypassable workflow and immutable evidence of who approved what and when.
2. **Retention override** — regulated tenants need 3–7 year retention, in direct tension with the minimisation defaults in §5.6. Per-tenant compliance mode.
3. **Immutable audit trail** with **tamper-evident** properties (§13.4).
4. **Lexicon-based surveillance** with reviewer disposition tracking — `[GH]` notes FINRA Notice 10-06 permits **risk-based review**: *"100% review of all communications is not required."* Keyword surveillance, sampling and targeted review are acceptable, which makes the feature tractable.
5. **Export to the customer's archive of record** (§13.4).

### 13.4 Archiving and supervision — and the LinkedIn problem

`[GH]` on the mechanics, and this is where the verified LinkedIn finding becomes strategic.

**What 17a-4 requires of electronic storage** `[GH]` — post-2023 amendments allow **two** compliant approaches:

| Approach | Requirement |
|---|---|
| **WORM** | Non-rewriteable, non-erasable format |
| **Audit-trail alternative** | *"A time-stamped, tamper-evident audit trail of every modification, deletion, or alteration"*, preserving originals and all versions |

Plus, in both cases `[GH]`: a **separate, duplicated index**; **auditable download** in examiner-requested formats; and a **designated third-party access agent with an annual undertaking letter filed with the SEC**.

**The last item is why we should not try to be the archive of record.** A "designated third-party access agent" that files undertakings with the SEC is a regulated-adjacent business function, not a feature. The incumbents — **Smarsh, Global Relay, Proofpoint, Hearsay Systems** — exist to be that.

**And then the verified finding:** `[GH]` **LinkedIn's Compliance API (`r_compliance` / `w_compliance`) is closed to new applicants** — "Access is closed and may not be requested." Those permissions are precisely what an archiving vendor needs to capture LinkedIn communications for supervision.

**Strategic conclusion, and it is a firm one:**

> We **cannot** build native FINRA/SEC-grade LinkedIn archiving. The capability is gated behind an API program that is closed to new entrants, which makes the incumbent archivers' access a **structural moat we cannot cross with engineering effort or money.**
>
> Therefore: **integrate, do not replace.** Build a clean, documented **export/journaling connector** to Smarsh, Global Relay, Proofpoint and Hearsay — push our captured content and its approval metadata into the customer's existing archive of record. This converts a blocker into a partnership, and it is what regulated customers actually want, because their archive of record is already chosen and already examined.

**Integration shape `[K]` — verify each:** these vendors typically ingest via SFTP drop of a defined XML/EML/JSON package, a REST journaling API, or SMTP journaling. **Design one internal "supervision event" schema and write adapters**, rather than bespoke integrations. `UNVERIFIED`: the exact current ingestion specs and partner-program requirements for each vendor.

**Common deficiency patterns to design against** `[GH]`: records not "easily accessible" in the first two years; cloud storage **not configured with immutability** (e.g. S3 Object Lock); missing third-party access agent undertaking; unenforced policies without technical controls; ephemeral content not captured; records lost during system migrations.

### 13.5 Other regulated verticals

`[GH]` + `[K]`:

| Vertical | Constraints |
|---|---|
| **Alcohol** | Age-gating and 21+/18+ targeting; **banned on TikTok** `[GH]`; self-regulatory codes (DISCUS, Portman Group UK) require minimum-age audience composition thresholds |
| **Gambling** | State/national licensing, geo-fencing, mandatory responsible-gambling messaging; **banned on TikTok** `[GH]`; UK GC and ASA rules on appeal to under-18s |
| **Cannabis** | Federally illegal in the US but legal in 24+ states `[GH]`; **most major platforms prohibit paid promotion outright**; state rules on imagery appealing to minors and mandatory warnings |
| **Crypto/financial promotions** | UK FCA financial promotions regime requires approval by an authorised person, risk warnings and cooling-off — **and it explicitly captures social media** `[K]` |
| **Political advertising** | EU **Regulation on Transparency and Targeting of Political Advertising (TTPA)** — labelling, transparency notices, and **restrictions on targeting using personal data**; application was phased with the main obligations from October 2025 `[K-VOL]` — **verify.** Platform-specific authorisation flows (Meta, Google) also apply |
| **Children's products/media** | COPPA, platform kids' policies, EU AVMSD |

**Product answer:** a **per-tenant industry policy pack** driving the composer lint (§13.1), the approval workflow, and the publish-time platform checks. Ship packs for finance, pharma, alcohol, gambling and cannabis and it becomes a paid tier.

---

## 14. Accessibility

Two obligations that are routinely conflated and must be separated: **is our product accessible** (regulatory + procurement), and **does our product help customers produce accessible content** (differentiator, and increasingly a customer obligation).

### 14.1 The legal landscape

| Regime | Scope | Standard | Status |
|---|---|---|---|
| **European Accessibility Act** (Directive (EU) 2019/882) | Products and services listed in the Directive, placed on the EU market | **EN 301 549**, which incorporates **WCAG 2.1 AA** (and is aligned toward 2.2) | **Obligations applied from 28 June 2025** `[K]`. Microenterprises providing services are exempt; transition provisions exist for some services |
| **EN 301 549** | EU public procurement of ICT, and the EAA's harmonised standard | WCAG-based + additional ICT requirements (documentation, support, hardware) | The operative European standard |
| **US Section 508** | US federal ICT procurement | `[GH]` **WCAG 2.0 A/AA**, evidenced by a **VPAT 2.x / ACR**; FAR 52.239-2 clause | Dated standard, but the VPAT is the artifact everyone wants |
| **ADA Titles II/III** | US public accommodations and state/local government | No codified web standard for Title III; **DOJ's 2024 Title II rule adopted WCAG 2.1 AA** for state/local government with compliance dates in 2026–2027 by entity size `[K]` | Title III litigation risk is driven by case law, and is substantial |
| **Ontario AODA, Canada ACA** | Canada | WCAG 2.0/2.1 AA | |
| **Israel, Australia (DDA), India (RPwD)** | Various | WCAG-based | |

**Is a B2B SaaS in EAA scope?** Genuinely arguable — the Directive lists specific product and service categories (e-commerce, banking, e-books, transport, electronic communications). A social media management tool is not obviously listed. **But:** (a) if we sell to EU public sector, EN 301 549 applies through procurement regardless; (b) if we ship any consumer-facing surface (a public link-in-bio page, a public gallery — the same features that risk DSA online-platform status in §6.1), the e-commerce/consumer analysis changes; (c) **enterprise RFPs ask for a VPAT irrespective of statutory scope.** `UNVERIFIED` for our exact classification — a counsel question, but the practical answer is the same either way: **conform, and publish the ACR.**

### 14.2 WCAG 2.2 Level AA — what it means for our UI

`[K-STRUCT]`. WCAG 2.2 (W3C Recommendation, October 2023) adds **nine** success criteria over 2.1, of which these are Level A/AA and relevant to a dense application UI:

| SC | Level | Requirement | Where it bites a product like ours |
|---|---|---|---|
| **2.4.11 Focus Not Obscured (Minimum)** | AA | The focused element must not be entirely hidden by author content | **Sticky headers/toolbars and the composer's floating action bars** — the single most common violation in modern app UIs |
| **2.4.12 Focus Not Obscured (Enhanced)** | AAA | Not even partially | Aspirational |
| **2.4.13 Focus Appearance** | AAA | Minimum focus indicator size/contrast | Aspirational, but good practice |
| **2.5.7 Dragging Movements** | AA | Any drag operation needs a single-pointer alternative | **Directly hits us: the calendar drag-to-reschedule, media reordering, and kanban-style approval boards must all have non-drag alternatives** |
| **2.5.8 Target Size (Minimum)** | AA | 24×24 CSS px minimum (with exceptions) | Dense calendar cells, icon toolbars, tag chips |
| **3.2.6 Consistent Help** | A | Help mechanisms in consistent relative order across pages | Cheap to satisfy |
| **3.3.7 Redundant Entry** | A | Don't make users re-enter information in the same process | Multi-step connect/onboarding flows |
| **3.3.8 Accessible Authentication (Minimum)** | AA | **No cognitive function test** (e.g. transcribing a puzzle) without an alternative | **Affects CAPTCHA choice at signup and 2FA design** — allow password managers to paste, don't block autofill |

Plus the 2.0/2.1 baseline that a data-dense app most often fails: colour contrast (1.4.3), keyboard operability of every custom control (2.1.1), visible focus (2.4.7), name/role/value on custom widgets (4.1.2), status messages announced (4.1.3), reflow at 320px (1.4.10), and **1.4.11 non-text contrast** for chart elements and icon buttons.

**Highest-risk areas in this specific product:** the **calendar** (drag, density, colour-only status encoding), the **composer** (rich text, media upload, live preview), **charts and analytics** (colour-only encoding, no text alternative for the data — link to the corpus `dataviz` guidance), the **unified inbox** (live regions, virtualised lists, keyboard triage), and **modals/focus management** throughout.

### 14.3 The VPAT/ACR

`[GH]` — Section 508 evidences conformance via a **VPAT 2.x**, producing an **Accessibility Conformance Report**. Editions: WCAG, Section 508, EN 301 549, or **INT (international)** covering all three. **Produce the INT edition** — one document, three markets.

**Honesty matters here.** A VPAT claiming "Supports" everywhere, contradicted by a buyer's own testing, is worse than an honest report with "Partially Supports" and a remediation roadmap. Enterprise accessibility teams test. `[CORPUS from 03]` lists VPAT/Section 508 as a standard enterprise procurement line item.

**Build:** third-party audit (~$8k–$25k `[K-VOL]`), remediation, ACR publication, then **automated regression** (axe-core in CI) plus **periodic manual and assistive-technology testing** — automation catches perhaps 30–40% of issues `[K]` and cannot assess the ones that matter most.

### 14.4 Content accessibility — the differentiator nobody has built

This is the more interesting half, and it is a genuine gap.

Our customers publish to audiences that include disabled people. Public-sector and large-enterprise customers frequently have **their own** accessibility obligations that extend to their social output. Nothing in the category helps them systematically.

| Feature | What it does | Effort |
|---|---|---|
| **Alt-text enforcement** | Block or warn on publishing an image without alt text; per-platform alt-text field mapping (Meta, X, LinkedIn all support it, with different limits) | Low |
| **AI-drafted alt text, human-confirmed** | Generate a description; require a human to accept/edit. **Never auto-publish unreviewed alt text** — wrong alt text is worse than none | Low — the models are good at this now `[CORPUS from 09]` |
| **Caption/subtitle enforcement** | Warn on video without captions; generate and require review; burn-in vs. sidecar per platform | Medium |
| **Contrast checking on generated/edited media** | Flag text-on-image below 4.5:1 | Low |
| **Readability scoring** | Plain-language guidance on captions | Low |
| **Emoji and hashtag hygiene** | Screen readers read every emoji aloud; **CamelCase hashtags** (`#SocialMediaMarketing`) are announced correctly, lowercase runs are not; warn on emoji-spam and mid-word emoji | **Very low effort, genuinely useful, nobody does it** |
| **Accessibility score per post** | A composite surfaced in the composer and reported at the brand level | Medium |

`[CORPUS from 09 §1002]` already places an accessibility check (alt text) in the proposed content pipeline. **This should be elevated from a checklist item to a named product capability.** It costs little, it differentiates in exactly the enterprise and public-sector segments where procurement is hardest, and — via **AI Act Art. 50(5)**, which requires AI disclosures themselves to meet accessibility requirements `[CORPUS from 09]` — part of it is legally required anyway.

---

## 15. Trust, safety, sanctions, age assurance

### 15.1 Moderation of user content

We host tenant content (D3) and receive third-party content (D4, D7). Obligations:

| Obligation | Source | Implementation |
|---|---|---|
| Notice-and-action for illegal content | DSA Art. 16 (§6.1) | Reachable abuse channel, tracked, with SLA |
| Statement of reasons | DSA Art. 17 | Templated, logged, delivered to the affected user |
| Terms clearly stating restrictions | DSA Art. 14 | AUP referenced from the MSA |
| Expeditious removal on actual knowledge | DSA Art. 6 | Escalation path with an owner |
| Platform terms — our tenants' conduct affects our app standing | §12.7 | **Proactive abuse detection is self-defence** |

**The commercial argument for tenant abuse controls:** a spam network signing up, connecting 10,000 accounts, and blasting through our app ID gets *our app* suspended, killing every legitimate tenant's connections. Signup friction, velocity limits, content-similarity detection across tenants, and payment-signal risk scoring are **availability controls**, not just T&S ones.

### 15.2 CSAM and illegal content

`[K-STRUCT]`. Non-negotiable, and the rules are unusual:

- **US providers** must report apparent CSAM to **NCMEC's CyberTipline** under 18 U.S.C. §2258A. Reporting is mandatory; **searching is not required by that statute**, but once known, reporting is.
- **Do not "investigate" suspected CSAM.** Viewing, copying, or downloading to verify creates criminal exposure. Preserve, report, restrict access, follow counsel.
- **Preservation obligations** follow a report (a statutory preservation period applies).
- **Hash-matching** (PhotoDNA and equivalents) is the industry-standard proactive control; access is via programs with their own onboarding.
- **EU**: the interim derogation and the proposed CSA Regulation have been in flux `[K-VOL]` — **verify current status**.
- **Practical scope for us:** we host media uploads. The realistic exposure is a bad actor using our media library as storage. Controls: hash-matching on upload if available, abuse reporting, rapid account termination, law-enforcement response process, and a written policy with a named owner.

Also in this family: **terrorist content** (EU Regulation 2021/784 imposes a **1-hour removal order** compliance window on hosting service providers `[K]`), NCII, and platform-specific prohibited content.

### 15.3 Sanctions and export control — the hard "no"

`[K-STRUCT]` + `[K-VOL]` for current designations. **This is a criminal-liability area, not a risk-appetite area.**

| Category | Jurisdictions | Position |
|---|---|---|
| **OFAC comprehensive sanctions** | **Cuba, Iran, North Korea, Syria**, and the **Crimea, Donetsk and Luhansk regions of Ukraine** | **Cannot serve. No exceptions without a licence.** `[K-VOL]` — designations change; the Syria posture in particular has been subject to significant recent change and **must be verified** |
| **Russia** | Sanctions include specific **prohibitions on the export of certain services** to Russia (EU and US measures cover, among others, IT consultancy, software and cloud services) | **Effectively cannot serve.** `[K-VOL]` — the specific service categories are the crux and must be verified with counsel |
| **Belarus** | Parallel measures | Same posture |
| **SDN / denied party lists** | OFAC SDN, EU consolidated list, UK OFSI, UN | **Screen every customer at signup and on an ongoing basis** |
| **50% rule** | Entities ≥50% owned by SDNs are themselves blocked, even if unlisted | **Ownership screening, not just name screening** |
| **Export control (EAR)** | Encryption in our product | Most SaaS with standard TLS/AES falls under mass-market/ancillary provisions, but **classification should be documented** `[K]`. `[GH]` confirms EAR structure: 15 CFR 730–774, 10 CCL categories, Entity List, FDPR |

**Implementation — and it must be technical, not contractual:**
1. **Geo-blocking** at signup and login for comprehensively sanctioned jurisdictions (IP + billing address + phone country), acknowledging VPN evasion as a residual risk.
2. **Denied-party screening** on company name, individual names, beneficial owners and email domains, at signup and re-screened on a schedule (list changes are frequent).
3. **Payment-layer screening** — the processor does its own, but that does not discharge our obligation.
4. **Blocking rather than refunding** where funds are involved with a blocked party, and **reporting** as required.
5. **A documented sanctions policy** with a named owner. `[CORPUS from 10 §1330]` already flags OFAC screening for the influencer/creator payments module — **creator payouts are the highest-risk surface** because we would be transmitting funds to individuals in many jurisdictions.

**A ToS clause saying "you may not use this service if you are in a sanctioned country" is not a control.** It is evidence of intent at best.

### 15.4 Age assurance

`[K-VOL]` — moving fast, with real divergence.

| Regime | Requirement |
|---|---|
| **UK Online Safety Act** | **Highly effective age assurance** for services likely to be accessed by children where specified content is present; Ofcom codes phased through 2025 `[K]` |
| **EU DSA Art. 28** | Minors' protection measures for online platforms; **no targeted advertising based on profiling of minors** |
| **US state laws** | Age-verification laws (varied scope, several litigated/enjoined) `[K-VOL]` |
| **COPPA** | Under-13 in the US |
| **Australia** | Legislated a minimum age for social media accounts, with enforcement from late 2025 `[K-VOL]` — **verify current state and whether obligations reach intermediaries** |

**For us:** as a **B2B** tool our users are professionals, so direct age-assurance obligations are unlikely. Two places the issue does reach us:
1. **Creator marketplace / influencer module** — if we onboard individual creators and facilitate payments, age verification matters (contract capacity, child labour rules, COPPA, and platform creator-program terms). `[CORPUS from 10]`.
2. **A consumer-facing surface** (link-in-bio, public gallery) would change the analysis — the same trigger as DSA classification (§6.1) and EAA scope (§14.1). **Three separate regulatory regimes hinge on the same product decision**, which is worth stating explicitly to whoever owns that roadmap.

**Recommendation:** ToS minimum age of 18 for account holders, verified age assurance in the creator marketplace if built, and a deliberate decision — with counsel — before shipping any public consumer surface.

---

## 16. Risk register, sequencing, cost

### 16.1 Risk register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | **Token vault breach** | Low | **Catastrophic** | Per-tenant keys, envelope encryption, KMS trust separation, AAD binding, detection (§10) | CTO |
| 2 | **Meta app suspension via failed DUC/DPA** | **Medium** | **Catastrophic** (all Meta tenants at once) | Named owner, 90-day calendar, treat as Sev-1 (§12.2) | Platform ops |
| 3 | **Sub-processor compromise** (the Buffer/CircleCI pattern) | Medium | High | Vendor DD, flow-down terms, keys the vendor cannot reach, mass-revocation capability (§11.1) | Security |
| 4 | **DPF invalidation** | **Medium** `[K-VOL]` | High | SCCs in parallel always, current TIA, EU plane seam ready (§4.3) | Legal + CTO |
| 5 | **Platform retention violation found in audit** | Medium | High | Per-platform retention engine, data-use register (§12.8) | Data eng |
| 6 | **Tenant isolation failure (IDOR)** | Medium | **Very high** | RLS, AAD binding, generated cross-tenant CI tests (§10.7) | Eng |
| 7 | **Refresh-token rotation race → mass disconnects** | **High** | Medium | Single-writer refresh per connection, distributed lock (§10.5) | Eng |
| 8 | **X 30-day private metrics missed** | **High if unplanned** | Medium, **irreversible** | Scheduled capture job (§12.3) | Data eng |
| 9 | **AI Act Art. 50 non-compliance** | Medium | High (€15M/3%) | Disclosure UX, approval records, provenance (§6.2, `09` §8) | Product + Legal |
| 10 | **Tenant abuse → our app suspended** | Medium | **Catastrophic** | Signup friction, velocity limits, cross-tenant similarity detection (§15.1) | T&S |
| 11 | **Sanctions violation** | Low | **Very high (criminal)** | Geo-block + screening + policy (§15.3) | Legal + Finance |
| 12 | **PHI in inbox without BAA** | **High if healthcare sold** | High | ToS prohibition until BAA program exists (§9.4) | Legal |
| 13 | **AI training on platform/tenant data** | Medium (accidental) | **Very high** — breaches platform terms *and* our DPA | Hard technical boundary + contractual commitment (§12.1) | CTO |
| 14 | **Accessibility claim contradicted by buyer testing** | Medium | Medium | Honest VPAT, real audit, CI regression (§14.3) | Product |
| 15 | **Missed breach-notification deadline** | Medium | High | Pre-drafted notification matrix in the IR runbook (§11.5) | Security + Legal |
| 16 | **Becoming a DSA "online platform" unintentionally** | Low–Medium | Medium-High | Counsel review gate on any public-facing surface (§6.1) | Product + Legal |
| 17 | **LinkedIn caching limit breached because it was never verified** | **Medium** | High | §17 item #1 — **verify before building LinkedIn analytics** | Data eng |

### 16.2 Sequencing

**Phase 0 — before the first token is stored (weeks 0–4)**
- Per-tenant key hierarchy design + KMS selection + crypto-shred model (§10.3). **Irreversible.**
- Regional plane seam: schema conventions, key scoping, CI lint (§4.4). **Irreversible.**
- Data classification (§2.1) applied as column-level tags feeding the lint.
- File Meta Business Verification + App Review; TikTok audit; LinkedIn access; Google OAuth verification `[CORPUS from 06 §1333]` — **calendar-time dependencies; nothing makes them faster than starting now.**
- Retention model as a first-class schema concept (§5.6, §12.8).

**Phase 1 — before first paying customer (weeks 4–12)**
- Published DPA + TOMs + sub-processor list + SCCs/UK Addendum (§3.3).
- Privacy notice, cookie consent + GPC honoring (§6.3, §7.2).
- Sanctions geo-block + screening (§15.3).
- AI Act Art. 50 disclosure surfaces + approval records (§6.2). **Already in force.**
- Security baseline: MFA everywhere, RLS, secret scanning, no-plaintext-token lint, SSRF defences.
- Abuse controls at signup (§15.1).

**Phase 2 — before enterprise motion (months 3–9)**
- SOC 2 Type I → start Type II window (§9.1).
- SSO/SAML, SCIM, audit log + export.
- DSAR/erasure console (§5.1).
- Trust Center + CAIQ + pen-test summary (§9.7).
- Accessibility audit + VPAT (§14.3).
- Cyber Essentials (§9.7) — cheap, fast.

**Phase 3 — expansion (months 9–24)**
- SOC 2 Type II report issued.
- ISO 27001 (+27017/27018), then ISO 42001 (§9.2, §9.3).
- EU data plane live.
- Archiving connectors (Smarsh/Global Relay/Proofpoint) (§13.4).
- Regulated-industry policy packs (§13.5).
- StateRAMP/TX-RAMP if public sector is real (§9.6).
- BYOK for enterprise (§10.3).

**Phase 4 — conditional**
- HIPAA/BAA if healthcare is funded (§9.4).
- China entity and plane if China is a funded strategy (§8.3).
- FedRAMP only against a sponsored federal deal (§9.6).

### 16.3 Cost model

`[K-VOL]` — every figure needs verification, and they vary widely by headcount, region and provider.

| Item | Year 1 | Ongoing/yr |
|---|---|---|
| Compliance automation platform | $7k–$30k | $7k–$30k |
| SOC 2 Type I | $8k–$25k | — |
| SOC 2 Type II | $15k–$60k | $15k–$60k |
| Penetration test | $10k–$30k | $10k–$30k |
| ISO 27001 certification (3-yr cycle) | — | $15k–$50k amortised |
| ISO 42001 | — | $15k–$40k |
| Accessibility audit + VPAT | $8k–$25k | $5k–$15k |
| Outside privacy counsel | $25k–$75k | $15k–$50k |
| DPO (fractional) + EU/UK representatives | $10k–$30k | $10k–$30k |
| Cyber insurance | $10k–$50k | $10k–$50k |
| Sanctions screening service | $5k–$20k | $5k–$20k |
| Cyber Essentials / CSA STAR | ~$2k | ~$2k |
| **Subtotal, external** | **~$100k–$345k** | **~$95k–$325k** |
| Internal effort | ~1.0–1.5 FTE | ~0.75–1.25 FTE |

Excluded: HIPAA (+$50k–$150k), FedRAMP (+$500k–$2M+), China entity and operations, TISAX/C5/IRAP.

**The framing that matters:** this is not overhead. `[CORPUS from 01 §1093, §1255]` and `[CORPUS from 03 §130]` both conclude that **procurement survivability is the enterprise wedge** in this category, precisely because the benchmark lacks it and no incumbent sells it without a sales cycle. The spend above is the price of entry to a segment with materially higher ACV and lower churn.

---

## 17. Verification plan

**Nothing in this document was verified against a primary source this session.** This is the ordered list of what to check, why it matters, and where to look. Items 1–8 are load-bearing on architecture and should be cleared before the corresponding code is written.

| # | Verify | Why it matters | Source |
|---|---|---|---|
| **1** | **LinkedIn API caching/retention limits** | Directly sizes and shapes the analytics store. Currently **UNVERIFIED** and reputed to be the strictest (§12.4) | `legal.linkedin.com/api-terms-of-use`; LinkedIn Developer Portal ToS; MDP agreement |
| **2** | **YouTube stored-data refresh/deletion rule** (the ~30-day figure) | Sizes the YouTube data store; determines warehouse-vs-query design (§12.5) | `developers.google.com/youtube/terms/developer-policies` |
| **3** | **Meta Platform Terms retention + Tech Provider obligations + current DUC/DPA scope** | App-wide kill-switch risk (§12.2) | `developers.facebook.com/terms/`, `/devpolicy/`, Data Use Checkup docs |
| **4** | **EU-US DPF status** — in force? litigation outcome? Commission review? | Determines whether SCCs are primary or secondary; drives EU plane urgency (§4.3) | EU Commission adequacy page; EDPB; CJEU/General Court docket; dataprivacyframework.gov |
| **5** | **TikTok + Pinterest caching/retention limits** | Currently UNVERIFIED (§12.6) | `developers.tiktok.com` ToS; `developers.pinterest.com` |
| **6** | **X Developer Agreement current restrictions + compliance SLA** | Batch-compliance mechanics verified `[GH]`; the *deadline* to act on them is not (§12.3) | `developer.x.com/en/developer-terms/agreement-and-policy` |
| **7** | **Texas TDPSA universal-opt-out obligation** | Contested cell in §7.2 |  Texas AG guidance; TDPSA text |
| **8** | **India DPDP Rules commencement + consent-manager obligations for foreign fiduciaries** | Determines whether an integration project exists (§8.2) | MeitY notifications |
| 9 | **Hootsuite / Socialbakers / Khoros breach history** | The competitor-incident narrative is valuable for enterprise security reviews — **but only if real** (§11.2) | HaveIBeenPwned, state AG breach notification databases, vendor trust pages, SEC filings |
| 10 | **EU AI Act** — Digital Omnibus final OJ reference; whether any CEN/CENELEC harmonised standards have been cited | `[CORPUS from 09]` flagged both as open loops as of 2026-07-20 | EUR-Lex; AI Office |
| 11 | **EAA scope for B2B SaaS** + current EN 301 549 version | Determines whether §14 is legal obligation or procurement hygiene | Directive (EU) 2019/882; ETSI EN 301 549 |
| 12 | **OFAC current designations**, esp. Syria and the Russia services-export prohibitions | Criminal exposure (§15.3) | OFAC sanctions programs; EU consolidated list; UK OFSI |
| 13 | **Australia Privacy Act reform** — which tranches are enacted | Small-business exemption and statutory tort change our posture (§8.3) | OAIC; Attorney-General's Department |
| 14 | **China cross-border transfer thresholds** post-March-2024 provisions | Determines whether a China plane is viable at our volume (§8.3) | CAC provisions; local counsel |
| 15 | **SOC 2 / ISO / pen-test current pricing** | §16.3 figures are `[K-VOL]` | Direct quotes from 3 audit firms |
| 16 | **Smarsh / Global Relay / Proofpoint / Hearsay ingestion specs and partner programs** | Determines the archiving connector build (§13.4) | Vendor partner portals |
| 17 | **FedRAMP CR26** — Classes A–D, OSCAL mandate, "Certified" renaming | If public sector becomes real (§9.6) | fedramp.gov |
| 18 | **NIS2 national transposition** — are we in scope as a cloud/managed service provider? | Real reporting obligations if yes (§6.4) | National transposition + counsel |
| 19 | **UK GDPR reform** current state | DPO/RoPA/DSAR mechanics (§3.5) | ICO; legislation.gov.uk |
| 20 | **Political advertising (TTPA) application dates** | If political/advocacy clients are in scope (§13.5) | EUR-Lex Reg. (EU) 2024/900 |

**Method note for whoever runs this:** most of these are single-page fetches of primary sources. The blocker this session was environmental (exhausted search budget + egress policy), not intellectual. **A session with working `WebFetch` could clear items 1–8 in under an hour**, and those eight are the ones that change how the system is built.

---

## Appendix A — Compliance requirements traceable to product features

A cross-reference for whoever writes the backlog. Every row is a legal or contractual obligation that manifests as something a developer must build.

| Feature | Driven by | Section |
|---|---|---|
| Per-tenant KEK + crypto-shred | GDPR Art. 17/28, breach containment | §10.3, §10.6 |
| Regional data planes + CI lint | GDPR Ch. V, PIPL, PIPA | §4.4 |
| DSAR console (search/export/erase/restrict) | GDPR Art. 15–21, CCPA, LGPD | §5.1 |
| Deletion replay log for backup restores | GDPR Art. 17 | §5.4 |
| Per-platform, per-field retention engine | Platform ToS + privacy law | §5.6, §12.8 |
| X private-metrics capture job (<30 days) | X API limit | §12.3 |
| Batch-compliance reconciliation job | X Developer Agreement | §12.3 |
| Data-deletion + deauthorize callbacks | Meta Platform Terms | §12.2 |
| `reauth_required` state machine | All platforms | §10.2 |
| Single-writer token refresh with lock | Rotating refresh tokens | §10.5 |
| Consent/cookie manager + GPC | ePrivacy, CPRA, CO/CT/MT/OR | §6.3, §7.2 |
| AI interaction notice (non-disableable in EU) | AI Act Art. 50(1) | §6.2 |
| Per-post approval records | AI Act Art. 50(4b) exception; FINRA 2210 | §6.2, §13.3 |
| AI provenance + platform AI-label propagation | AI Act Art. 50(2)/(4a); C2PA | `09` §8 |
| Exportable AI compliance report | AI Act governance | §6.2 |
| Composer compliance lint | FTC, ASA, industry rules | §13.1 |
| Adverse-event detector on inbox | Pharmacovigilance | §13.2 |
| Compliance mode: mandatory pre-approval + extended retention | FINRA 2210/3110, SEC 17a-4 | §13.3 |
| Archive-of-record export connectors | SEC 17a-4, MiFID II | §13.4 |
| Immutable, tamper-evident audit log | SOC 2, 17a-4 audit-trail alternative | §13.3, §13.4 |
| SSO/SAML + SCIM + audit export | Enterprise procurement | §16.2 |
| Alt text / caption enforcement + AI drafts | WCAG, EAA, AI Act 50(5) | §14.4 |
| Non-drag alternatives on calendar | WCAG 2.2 SC 2.5.7 | §14.2 |
| Accessible auth (no cognitive-function test) | WCAG 2.2 SC 3.3.8 | §14.2 |
| Geo-block + denied-party screening | OFAC/EU/UK sanctions | §15.3 |
| Abuse detection across tenants | Platform ToS, availability | §15.1 |
| Notice-and-action + statement of reasons | DSA Art. 16/17 | §6.1 |
| Sub-processor list + change notification | GDPR Art. 28 | §4.5 |
| Kill switches (global/tenant/platform/connection) | Incident response | §10.8 |
| Secret-scrubbing on support artifact ingest | Okta HAR lesson | §11.1 |

---

## Appendix B — What this document does not cover

Stated explicitly so nobody assumes coverage that is not there.

- **EU AI Act Article 50 detail, C2PA mechanics, watermarking** — in `09-ai-frontier.md` §8. Deliberately not duplicated.
- **Employment law, IP/copyright in AI training data, defamation, right of publicity** — out of scope, and each is a real issue for a content platform. Copyright in AI-generated assets and in UGC repurposing is a notable gap.
- **Tax, VAT/GST, e-invoicing** — `08-platform-apis-regional.md` covers payments/tax.
- **Insurance** (cyber, tech E&O) — costed in §16.3 but not analysed.
- **M&A/diligence readiness** — the artifacts in this document largely constitute it.
- **Specific contract templates** — MSA, DPA, AUP, BAA all need counsel drafting.
- **Any jurisdiction not listed in §8**, notably Indonesia PDP, Vietnam PDPD/PDPL (`[GH]` notes Vietnam PDPL effective Jan 2026 with **72-hour MPS breach notification**), Thailand PDPA, Kenya DPA, Egypt.



