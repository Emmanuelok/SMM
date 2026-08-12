# 04 — SMB / Mid-Market / Agency Tier

> ## ⛔ PROVENANCE WARNING — READ BEFORE USING ANY NUMBER IN THIS FILE
>
> **This document contains ZERO fetched sources. No vendor page, pricing page, docs page,
> review site, or search result was retrieved while writing it.**
>
> The research pass that was supposed to produce this file could not run:
>
> | Blocker | Detail |
> |---|---|
> | WebFetch | Egress proxy denies effectively all commercial hosts. Confirmed blocked: `buffer.com`, `later.com`, `publer.com`, `socialbee.com`, `metricool.com`, `www.agorapulse.com`, `www.g2.com`, `www.capterra.com`, `en.wikipedia.org`. Only `raw.githubusercontent.com` was reachable. |
> | WebSearch | Session budget exhausted before this agent started (200/200 calls consumed by earlier agents). Zero searches available. |
>
> Everything below is **model recall with a May 2026 knowledge cutoff**, written against an
> August 2026 "today". It is a *scaffold and a verification plan*, *not* findings.
>
> **Every claim in this file is UNVERIFIED.** Confidence tags mark how much weight each
> claim can bear pending verification:
>
> - **`C1`** — structural / qualitative / slow-changing (pricing *model* shape, whether a
>   product does white-label at all, core differentiator). Reasonable recall confidence.
> - **`C2`** — moderate confidence, materially likely to have drifted. Verify before use.
> - **`C3`** — fuzzy recall or known-volatile. **Treat as a hypothesis to test, never as a fact.**
>
> **All dollar figures are `C2` or `C3` regardless of how precise they look.** SaaS pricing in
> this category re-prices roughly annually; a May-2026 recollection is 3+ months stale at
> minimum and several vendors below are known serial re-pricers.
>
> **Do not synthesize the numbers in this file into `00-MASTER-STRATEGY.md` as market
> evidence.** Use the *structure* (pricing models, market segmentation, gap analysis) to frame
> questions; re-run §14 to get answers. See §14 for a ready-to-execute verification plan.

---

## Table of contents

1. [How to read this tier](#1-how-to-read-this-tier)
2. [Market map — the six sub-segments](#2-market-map--the-six-sub-segments)
3. [Pricing model taxonomy (the most decision-relevant section)](#3-pricing-model-taxonomy)
4. [Product dossiers — broad horizontal SMB tools](#4-product-dossiers--broad-horizontal-smb-tools)
5. [Product dossiers — agency & white-label platforms](#5-product-dossiers--agency--white-label-platforms)
6. [Product dossiers — evergreen-recycling specialists](#6-product-dossiers--evergreen-recycling-specialists)
7. [Product dossiers — single-network specialists](#7-product-dossiers--single-network-specialists)
8. [Product dossiers — link-in-bio / creator monetization](#8-product-dossiers--link-in-bio--creator-monetization)
9. [White-label & reseller deep dive](#9-white-label--reseller-deep-dive)
10. [AI capability assessment](#10-ai-capability-assessment)
11. [Network coverage matrix](#11-network-coverage-matrix)
12. [Free tiers and PLG mechanics](#12-free-tiers-and-plg-mechanics)
13. [Price floor, price-per-profile benchmark, best value](#13-price-floor-and-benchmarks)
14. [Verification plan — how to actually produce this file](#14-verification-plan)
15. [Market gaps](#15-market-gaps)

---

## 1. How to read this tier

The SMB/mid-market/agency tier is where this product will actually compete. The enterprise
tier (file `03`) sells to procurement on compliance, SSO, and services; this tier sells
self-serve on price, network coverage, and time-to-first-post. Three observations shape
everything else — all `C1`:

1. **Feature parity is largely solved and commoditized.** Scheduling to the Tier-1 networks,
   a calendar, a media library, basic analytics, and an AI caption writer are table stakes at
   every price point above roughly $15/month. Nothing in the feature list differentiates
   anymore. `C1`
2. **Differentiation has moved to three axes:** (a) *breadth of network coverage*, especially
   the long tail; (b) *agency operating model* — white-label, client approval, multi-workspace
   permissions, reseller economics; (c) *depth in exactly one adjacent module* — inbox,
   listening, reviews, analytics, or link-in-bio. Products that try all three at once are
   the expensive ones. `C1`
3. **The pricing model is a strategic weapon, not an implementation detail.** Per-seat,
   per-profile, and per-workspace pricing select for structurally different customers and
   produce structurally different expansion curves. §3 is the most decision-relevant part of
   this file. `C1`

---

## 2. Market map — the six sub-segments

`C1` on the segmentation itself; membership of individual products is `C1`–`C2`.

| Segment | Buying trigger | Products | Typical entry price |
|---|---|---|---|
| **Broad horizontal SMB** | "I need to post to everything from one place" | Buffer, Publer, Metricool, Later, SocialBee, Loomly, Zoho Social, Social Champ, Crowdfire, Pallyy | $10–35/mo |
| **Agency / white-label** | "I manage N clients and must look like the vendor" | Cloud Campaign, Sendible, Vista Social, ContentStudio, Statusbrew, Sociality.io, NapoleonCat, Kontentino | $40–250/mo |
| **Collaboration / approval-first** | "Getting client sign-off is my bottleneck" | Planable, Kontentino, Loomly, CoSchedule | $11–60/user/mo |
| **Engagement / inbox-first** | "Comments and DMs are drowning us" | Agorapulse, Statusbrew, NapoleonCat, Sociality.io | $49–180/mo |
| **Evergreen recycling** | "I want the queue to never run dry" | MeetEdgar, SocialBee, CoSchedule (ReQueue), Hypefury, Social Champ | $25–50/mo |
| **Single-network specialists** | "One network is 80% of my revenue" | Tailwind (Pinterest), Sked Social + Iconosquare (Instagram), Hypefury + Typefully (X) | $15–80/mo |
| **Link-in-bio / creator monetization** | "I need a destination and a way to charge" | Linktree, Beacons, Stan, Buffer Start Page, Pallyy, Later Linkin.bio | $0–99/mo |

The segments overlap and several products deliberately straddle two. The strategically
important observation is that **the agency/white-label segment is the only one with real
pricing power in this tier** — agencies resell the tool and therefore tolerate a price the
same feature set could not command sold direct to an SMB. `C1`

---

## 3. Pricing model taxonomy

**This is the highest-confidence and most decision-relevant section in the file.** The *shape*
of each vendor's model is `C1`; the numbers attached are `C2`/`C3`.

### 3.1 The three models

| Model | How it charges | Selects for | Expansion curve | Failure mode |
|---|---|---|---|---|
| **Per-social-profile** | Price × number of connected accounts | Solo operators, small brands with few profiles | Grows with client's network breadth | Punishes exactly the multi-network behavior you want to encourage; customers disconnect profiles to save money |
| **Per-seat** | Price × number of human users | Teams and agencies with many staff | Grows with headcount | Agencies share logins to avoid it; blocks the client-collaborator use case entirely |
| **Per-workspace / per-brand** | Flat price per client brand, users usually unlimited | Agencies | Grows with client count — the *right* axis for agencies | Underprices very large single brands |

### 3.2 Who uses which

`C1` on model assignment, `C2`/`C3` on the numbers.

| Product | Primary axis | Secondary axis | Notes |
|---|---|---|---|
| Buffer | **Per-channel** | — | Purest per-profile model in the market; users unlimited on Team. `C1` |
| Publer | **Per-social-account** | Per-user add-on | Accounts and users both à-la-carte. `C1` |
| Pallyy | **Per-"social set"** | — | A set = one account of each network, bundled. `C2` |
| Later | **Per-"social set"** | Seat caps per tier | Same bundling idea as Pallyy. `C2` |
| Metricool | **Per-brand** | Seat caps per tier | Brand = a bundle of connected profiles. `C2` |
| SocialBee | Per-profile | Per-workspace on agency tiers | `C2` |
| Agorapulse | **Per-seat** | Per-profile bundles | Seat cost dominates the bill. `C1` |
| Planable | **Per-seat** | — | Cheapest genuine per-seat model. `C1` |
| CoSchedule | **Per-seat** | — | `C2` |
| Sendible | Per-profile bundles | Seat caps per tier | `C2` |
| Statusbrew | **Per-seat + per-profile** | — | Both axes charged; bill escalates fast. `C2` |
| Cloud Campaign | **Per-brand/workspace** | Users unlimited | The agency-native model. `C1` |
| Zoho Social | Per-brand | Seat caps | Agency tiers priced per bundle of brands. `C2` |
| Loomly | Per-tier bundle | Both seats and accounts capped | `C2` |
| NapoleonCat | Per-profile + per-user | — | `C2` |
| Vista Social | Per-profile | Users on higher tiers | See file `01`. `C1` |

### 3.3 The strategic read

`C1` on the reasoning.

- **Per-seat pricing is structurally hostile to the agency motion.** An agency wants to give
  every client a login for approvals; per-seat pricing taxes that directly. Agorapulse,
  Planable, CoSchedule and Statusbrew all pay this penalty. Several of them mitigate it with
  a free "client/approver" seat class — verify which, this is a design decision worth copying.
- **Per-profile pricing taxes network breadth**, which is directly opposed to a strategy whose
  differentiator is *having more networks than anyone else*. If our differentiation is
  "we support the regional networks nobody else does", charging per profile means the
  customer pays extra for our differentiator instead of being rewarded for adopting it.
  **This is a genuine strategic conflict and should be surfaced explicitly in the pricing
  decision.**
- **Per-workspace pricing with unlimited users and unlimited profiles** is what Cloud Campaign
  uses and is the model best aligned with an agency reseller strategy: the agency's cost scales
  with its *revenue* (client count), not with its *effort* (staff) or our *differentiator*
  (network breadth).

---

## 4. Product dossiers — broad horizontal SMB tools

> Reminder: every dossier below is unverified recall. Dollar figures are `C2`/`C3`.

### 4.1 Buffer

- **Position.** The default entry point for the whole category; strongest brand and strongest
  free-tier funnel in the tier. Deliberately simple — Buffer competes by being the tool that
  does less, faster. `C1`
- **Pricing model.** Per-channel, which is unusual and central to its identity. `C1`
  - Free: ~3 channels, small cap on queued posts per channel (recalled as ~10). `C2`
  - Essentials: ~$5–6 per channel per month, annual vs monthly differing by ~$1. `C3`
  - Team: roughly double Essentials per channel (~$10–12), adds unlimited users and approvals. `C3`
  - Buffer **discontinued its dedicated Agency plan** some years ago and did not replace it. `C2`
- **Features.** Queue-based scheduling (the original "buffer" metaphor — posts fill time slots
  rather than being individually timed), calendar, AI Assistant, basic per-post analytics,
  Start Page (link-in-bio, free), a limited engagement view for comments. `C1`
- **Network coverage.** Notably early to **Bluesky, Threads and Mastodon** — Buffer is one of
  the few mainstream tools to treat the fediverse and the X-alternatives as first-class.
  This is a real and underrated differentiator. `C2`
- **AI.** AI Assistant for caption generation/rewriting/repurposing. Competent but generic;
  no brand-voice training worth the name. `C2`
- **Standout differentiator.** The free tier plus Start Page is the most effective PLG funnel
  in the category, and radical-transparency branding (public salaries, public revenue) buys
  disproportionate goodwill with the solo/SMB buyer. `C1`
- **Top complaints.** `C2`
  1. Analytics are thin and gated behind higher tiers.
  2. No real unified inbox; engagement features are shallow and network-limited.
  3. No social listening at all.
  4. Per-channel pricing becomes expensive precisely at the point a customer succeeds.
  5. Deliberate simplicity reads as "outgrew it" within ~18 months for many teams.

### 4.2 Later

- **Position.** Instagram-first visual planner that repositioned toward **influencer
  marketing**. Later merged with Mavrck (influencer platform) and later acquired Mavely
  (affiliate/creator commerce) — the company is now as much an influencer-marketing business
  as a scheduler. `C2` on the transactions, `C1` on the strategic direction.
- **Pricing model.** Per "social set" (one account of each supported network) with seat caps
  per tier. Tiers recalled as Starter / Growth / Advanced, roughly $25 / $45 / $80 per month
  with annual discounting. `C3`
- **Features.** Visual content calendar and Instagram grid preview, media library, Linkin.bio
  (link-in-bio, one of the earliest), best-time-to-post, hashtag suggestions, UGC collection,
  influencer campaign management on the upper end. `C2`
- **Standout differentiator.** The visual planner and grid preview remain best-in-class for
  Instagram-led brands, and the influencer/affiliate side is a genuine adjacency no other
  product in this tier has. `C1`
- **Top complaints.** `C2`
  1. Repeated price increases and tier restructures; long-time users vocally aggrieved.
  2. Auto-publish reliability, historically worst for Stories and Reels.
  3. Instagram-centric — other networks feel like afterthoughts.
  4. Analytics shallow relative to price.

### 4.3 Publer

- **Position.** The value leader of the horizontal segment. Very broad network coverage at a
  very low price. `C1`
- **Pricing model.** À-la-carte: pay per social account, add users separately. Free plan exists.
  Professional and Business tiers gate features (analytics, workspaces) rather than volume.
  Recalled entry around $12–15/month for a small bundle; roughly $4–6 per account per month. `C3`
- **Features.** Scheduling, bulk upload/CSV, evergreen recycling, auto-scheduling, link shortening,
  signatures/watermarks, media library, calendar, workspaces, browser extension, RSS auto-posting. `C2`
- **Network coverage — the standout.** Unusually broad. Recalled to include **Mastodon,
  Bluesky, Threads, Telegram, Google Business Profile, WordPress**, alongside all Tier-1
  networks. WordPress and Telegram support in particular are rare in this tier. `C2`
- **AI.** AI Assist on a credit model, including image generation. Competent, not
  differentiated. `C2`
- **Standout differentiator.** Best coverage-per-dollar in the market. If a buyer's decision
  criterion is "most networks for least money", Publer wins on paper. `C1`
- **Top complaints.** `C2`
  1. Dense, cluttered UI — the cost of the feature breadth.
  2. Support responsiveness at the low price point.
  3. Analytics shallow compared to Metricool/Iconosquare.
  4. Credit-based AI feels nickel-and-dimed.

### 4.4 Metricool

- **Position.** Analytics-first horizontal tool from Spain; punches far above its price on
  reporting. `C1`
- **Pricing model.** Per-brand (a brand bundles connected profiles), with a free tier and
  tiers recalled as Free / Starter / Advanced / Custom, entry around $18–22/month. `C3`
- **Features.** Deep analytics and competitor benchmarking, scheduling, link-in-bio,
  **integrated paid-ads reporting (Meta / Google / TikTok ads) at low price points** — this is
  the genuine differentiator and almost unique in the tier. Automated white-labelled PDF
  reports. `C2`
- **Network coverage.** Broad, and notably includes **Twitch** — very rare. Also strong on
  Google Business Profile. `C2`
- **Standout differentiator.** Organic + paid in one report at an SMB price. Most competitors
  make you buy an enterprise tier or a separate tool for ad reporting. `C1`
- **Top complaints.** `C2`
  1. Publishing reliability weaker than its analytics.
  2. UI/UX and English localization rough in places.
  3. Inbox/engagement is thin to absent.

### 4.5 SocialBee

- **Position.** Category-based evergreen recycling with a full horizontal feature set on top.
  Straddles the horizontal and recycling segments. `C1`
- **Pricing model.** Per-profile tiers (recalled Bootstrap / Accelerate / Pro, roughly
  $29 / $49 / $99), plus agency tiers with white-label. `C3`
- **Features.** **Content categories** are the core primitive — you file posts into categories,
  each category gets a recurring schedule, and the queue refills from the category
  automatically. Also: RSS import, bulk import, URL-based content sourcing, approval
  workflows, workspaces, Canva integration. `C1`
- **AI.** An AI copilot that will generate an entire posting *plan* — categories, cadence, and
  seed content — from a description of the business. This is meaningfully more ambitious than
  a caption generator and is among the better AI implementations in the tier. `C2`
- **White-label.** Available on agency tiers. Scope needs verification (reports-only vs. full
  dashboard vs. custom domain). `C2`
- **Top complaints.** `C2`
  1. Price crept up substantially over successive re-pricings.
  2. Category model has a learning curve; overkill for simple use cases.
  3. Analytics mid-tier.

### 4.6 Loomly

- **Position.** "Brand success platform" — calendar plus post ideas plus structured approval
  workflow. Mid-market, mildly enterprise-flavored. `C1`
- **Pricing model.** Bundled tiers capping both seats and accounts (recalled Base / Standard /
  Advanced / Premium, roughly $32 / $60 / $131 / $277 per month annual). `C3`
- **Features.** Post ideas engine (suggests content from trends, RSS, and date-based events),
  multi-step approval workflows, post mockups/previews, asset library, UTM automation,
  interaction view. `C2`
- **Top complaints.** `C2`
  1. Steep price jumps between tiers with hard seat/account caps.
  2. Inbox is shallow.
  3. Analytics adequate but unremarkable.

### 4.7 Zoho Social

- **Position.** Cheap, competent, and strategically valuable only inside the Zoho ecosystem. `C1`
- **Pricing model.** Per-brand tiers (Standard / Professional / Premium) plus distinct
  **Agency / Agency Plus** tiers priced per bundle of brands. Entry recalled around
  $10–15/month; agency bundles around $200–300/month for ~10 brands. `C3`
- **Standout differentiator.** **Native Zoho CRM integration** — social interactions attach to
  CRM leads and contacts. For a business already on Zoho One this is a decisive lock-in and
  the social tool is effectively free at the margin. No other product in this tier has a
  comparable CRM tie. `C1`
- **Top complaints.** `C2`
  1. Support quality.
  2. Ecosystem lock-in; weak as a standalone purchase.
  3. UI feels like enterprise software from a prior decade.

### 4.8 Social Champ

- **Position.** Publer-adjacent value player. Broad networks, low price, agency tier with
  white-label. `C2`
- **Pricing.** Free tier plus tiers recalled around $26 / $89 / higher for agency. `C3`
- **Features.** Bulk upload, evergreen recycling, content calendar, RSS, white-label on the
  agency tier. `C2`
- **Complaints.** Reliability and support; a "me-too" product without a defensible wedge. `C2`

### 4.9 Crowdfire

- **Position.** Declining legacy player. Originally a Twitter follow/unfollow growth tool that
  pivoted to content curation and scheduling. `C1`
- **Pricing.** Cheap; tiers recalled around $9.99 / $49.99 / $99.99. `C3`
- **Assessment.** Include for completeness only. Its content-discovery and RSS curation remain
  its only distinctive elements, and the product has visibly stagnated. **Not a competitive
  threat**; potentially a source of churned users. `C2`

### 4.10 Pallyy

- **Position.** Very cheap, visually polished, quietly one of the best value propositions in
  the market for solo operators and small agencies. `C2`
- **Pricing.** Recalled as a flat ~$18/month per social set, with a limited free tier. `C3`
- **Features.** Visual planner and grid preview, media library, comment inbox, analytics,
  link-in-bio, white-labelled reports, agency-oriented client management. `C2`
- **Standout differentiator.** Delivers roughly Later's visual-planning experience at roughly
  a third of the price. `C2`
- **Complaints.** Small team, slower feature velocity, thinner support. `C2`

---

## 5. Product dossiers — agency & white-label platforms

### 5.1 Cloud Campaign — *the* white-label benchmark

- **Position.** Purpose-built for agencies that resell social media management. The most
  complete white-label story in the tier and the most direct rival to Vista Social's agency
  motion. `C1`
- **Pricing model.** **Per-brand/workspace with unlimited users** — the agency-native model.
  Tiers recalled as Freelancer / Studio / Agency at roughly $41 / $208 / $416 per month on
  annual billing. `C3`
- **White-label scope.** The most complete in the tier: custom domain (CNAME), full visual
  rebrand, branded client-facing approval portal, branded reports. The agency's clients never
  see the Cloud Campaign name. `C1` on scope, `C2` on specifics.
- **Features.** Content library with recycling/rotation per brand, client approval portal,
  bulk scheduling, hashtag sets, branded reporting, AI content generation. `C2`
- **Standout differentiator.** Unlimited users on a per-brand price is exactly aligned with how
  an agency makes money, and it removes the friction of giving clients approval logins. `C1`
- **Complaints.** `C2`
  1. Expensive at the Studio/Agency steps; large jumps.
  2. Analytics and inbox thinner than the publishing/white-label side.
  3. Overkill for anyone who is not an agency.

### 5.2 Sendible

- **Position.** The long-established agency incumbent. Broad feature set, strong white-label,
  dated experience. `C1`
- **Pricing model.** Bundled tiers with profile and seat caps; recalled as Creator / Traction /
  Scale / Advanced at roughly $29 / $89 / $199 / $399 per month. White-label gated to the
  higher tiers. `C3`
- **White-label scope.** Custom domain plus dashboard rebranding on upper tiers; branded
  reports throughout. Historically also offered a white-labelled mobile experience — **verify,
  this may have been discontinued**. `C2`
- **Features.** Unified inbox (a relative strength), approval workflows, client dashboards,
  content suggestions, and unusually deep third-party integrations — Canva, Google Drive,
  Dropbox, WordPress, and blogging destinations. Publishing to blog platforms is rare in this
  tier. `C2`
- **Complaints.** `C2`
  1. UI feels dated relative to Planable/Cloud Campaign.
  2. Publishing reliability complaints recur.
  3. Price high for the perceived modernity.

### 5.3 ContentStudio

- **Position.** Content discovery plus automation plus AI, with an agency tier. `C2`
- **Pricing.** Tiers recalled as Starter / Pro / Agency, roughly $25 / $49 / $99+, priced on
  workspace and profile counts. White-label on the agency tier. `C3`
- **Standout differentiator.** A genuine **content discovery engine** (topic/keyword-based
  article and trend discovery feeding directly into the composer) plus automation "recipes"
  — evergreen rotation, RSS-to-social, bulk CSV. Discovery is a real capability few
  competitors still invest in. `C2`
- **Complaints.** Reliability and support; feature breadth outpacing polish. `C2`

### 5.4 Statusbrew

- **Position.** Engagement and moderation-first with a strong rules engine. `C2`
- **Pricing.** **Charges on both axes — per seat and per profile** — which makes it one of the
  faster-escalating bills in the tier. Tiers recalled as Standard / Premium / Enterprise at
  roughly $69 / $179 / $399 per month. `C3`
- **Standout differentiator.** An automation/rules engine for the inbox: auto-hide, auto-delete,
  auto-assign, and auto-moderate comments by rule, **including comments on paid ads**. For
  e-commerce brands running ads at volume this is genuinely valuable and under-served. `C2`
- **Complaints.** Cost escalation from dual-axis pricing; complexity. `C2`

### 5.5 Sociality.io

- **Position.** EU/Turkey-based, GDPR-forward, per-profile pricing, with listening and
  competitor analysis included at a mid price. `C2`
- **Pricing.** Recalled around $99/month for ~10 profiles, modular by feature. `C3`
- **Standout differentiator.** EU data-residency and GDPR posture as an explicit selling point
  — relevant if our own GTM targets European agencies. `C2`
- **Complaints.** Smaller ecosystem, less brand recognition, thinner integrations. `C2`

### 5.6 NapoleonCat

- **Position.** Polish; inbox and **auto-moderation** specialist, strongest with e-commerce
  brands running heavy paid social. `C2`
- **Pricing.** Per-profile plus per-user; entry recalled around $32/month for ~3 profiles. `C3`
- **Standout differentiator.** Auto-moderation rules for ad comments (the same wedge as
  Statusbrew, arguably executed earlier). Strong Facebook/Instagram commerce orientation. `C2`
- **Complaints.** Pricing scales awkwardly on two axes; publishing secondary to moderation. `C2`

### 5.7 Kontentino

- **Position.** Slovak; approval-workflow specialist for agencies and their clients. `C2`
- **Pricing.** Per-profile tiers, entry recalled around $59/month. `C3`
- **Standout differentiator.** **Client approval without requiring the client to create an
  account** — approval by emailed link. Removes the single biggest friction point in agency
  review cycles, and is a pattern worth copying regardless of what we build. Also strong
  ad-preview fidelity for Facebook. `C2`
- **Complaints.** Narrow beyond approvals; analytics and inbox thin. `C2`

---

## 6. Product dossiers — evergreen-recycling specialists

### 6.1 MeetEdgar

- **Position.** The originator of category-based evergreen recycling. Now largely static. `C1`
- **Pricing.** Notably **flat-rate, not per-profile** — recalled as Eddie ~$29.99/month
  (~5 accounts) and Edgar ~$49.99/month (~25 accounts). `C3`
- **Mechanic.** A permanent content library organized into categories; a weekly schedule
  assigns category slots; Edgar refills each slot from the category library indefinitely and
  never runs dry. `C1`
- **Assessment.** Feature-frozen for years. Its idea won and was absorbed by SocialBee,
  ContentStudio, Social Champ and CoSchedule's ReQueue. `C2`
- **Complaints.** Limited networks, no meaningful analytics, no inbox, stagnant roadmap. `C2`

### 6.2 CoSchedule

- **Position.** Marketing-calendar heritage; social scheduling is one module of a broader
  marketing suite. `C1`
- **Pricing.** Per-seat, with a free tier and a confusing multi-product lineup (Social Calendar,
  Content Calendar, Marketing Suite, plus the separate Headline Studio). Social entry recalled
  around $19/user/month. `C3`
- **Standout differentiators.** **ReQueue** (intelligent evergreen re-scheduling that finds gaps
  in the calendar and fills them) and **Headline Studio** (headline scoring, a genuinely
  distinct product with its own funnel). `C2`
- **Complaints.** Repeated pricing/packaging restructures that annoyed the base; per-seat costs;
  product sprawl makes it hard to know what you're buying. `C2`

---

## 7. Product dossiers — single-network specialists

Single-network depth is the clearest example of the "win one module decisively" strategy.

### 7.1 Tailwind — Pinterest

- **Position.** The Pinterest tool, and an official Pinterest partner. Extended to Instagram,
  Facebook and email marketing. `C1`
- **Pricing.** Free tier plus tiers recalled as Pro / Advanced / Max at roughly $14.99 / $24.99 /
  $49.99 per month, with credit-based limits on AI and design. `C3`
- **Features.** SmartSchedule (optimal Pinterest timing), board lists, interval pinning,
  **Tailwind Create** (automated branded design generation from a URL), Ghostwriter AI copy,
  and historically Tailwind Communities (formerly Tribes) for content amplification. `C2`
- **Standout differentiator.** Pinterest-native scheduling depth that no horizontal tool
  matches, plus a design-generation module most competitors lack entirely. `C1`
- **Complaints.** Existential dependency on Pinterest's API and Pinterest's own relevance;
  credit model frustrates heavy users. `C2`

### 7.2 Iconosquare — Instagram/TikTok analytics

- **Position.** Analytics-first specialist with the deepest Instagram and TikTok metric
  coverage in the tier. `C1`
- **Pricing.** Recalled as Single / Teams / Custom starting around $59 and $99+ per month. `C3`
- **Standout differentiator.** **Industry benchmark data** — comparing a brand's performance
  against sector medians, backed by Iconosquare's aggregate dataset. This is a data-network-
  effect asset that a new entrant cannot replicate quickly, and it is the single most
  defensible thing in this entire tier. Worth studying carefully. `C1`
- **Complaints.** Expensive for what is primarily analytics; publishing is secondary. `C2`

### 7.3 Sked Social — Instagram

- **Position.** Instagram auto-posting specialist with agency features. `C2`
- **Pricing.** Recalled around $79 / $159 / $319 per month. `C3`
- **Features.** Reliable Instagram auto-publish including Stories, visual grid planning,
  hashtag manager, link-in-bio, client approval, white-labelled reports. `C2`
- **Complaints.** Expensive relative to Pallyy/Later for overlapping capability. `C2`

### 7.4 Hypefury — X/Twitter growth automation

- **Position.** Solo-creator growth automation for X, extended to LinkedIn, Instagram, Threads
  and Bluesky. `C2`
- **Pricing.** Recalled roughly $19–$49/month by tier. `C3`
- **Standout differentiator — genuinely distinct.** Growth *automation*, not just scheduling:
  auto-retweet of your own best performers, **auto-DM to users who engage** (lead-magnet
  delivery), "autoplug" (auto-reply promoting an offer once a post passes an engagement
  threshold), evergreen recycling of top tweets, and inspiration libraries of proven formats.
  No horizontal tool does any of this. `C2`
- **Complaints.** Automation borders on spam and carries platform-policy risk; heavily
  X-dependent; less useful for brands than for personal-brand creators. `C2`

### 7.5 Typefully — X/LinkedIn writing experience

- **Position.** Writing-first composer for X, LinkedIn, Bluesky and Threads. `C2`
- **Pricing.** Free tier plus paid tiers recalled around $12.50–$29/month. `C3`
- **Standout differentiator.** The **writing and thread-composition experience itself** —
  distraction-free editor, thread structuring, ghostwriter collaboration and approval flows,
  clean analytics. It competes on craft, not features, and demonstrates that composer UX alone
  can carry a product. `C1`
- **Complaints.** Narrow network support; not a team/agency tool. `C2`

---

## 8. Product dossiers — link-in-bio / creator monetization

Link-in-bio matters strategically for two reasons: it is a **free acquisition wedge** (Buffer
proves this), and it is the **on-ramp to creator monetization**, which is where the money is
moving. `C1`

| Product | Model | Recalled pricing | Wedge |
|---|---|---|---|
| **Linktree** | Freemium at massive scale | Free / ~$5 / ~$9–24 / Premium `C3` | Ubiquity and default-ness; commerce, tipping, and auto-populating social links |
| **Beacons** | Creator-focused freemium | Free / ~$10 / ~$30 `C3` | AI media kit, brand-deal tooling, email list, store — an all-in-one creator OS |
| **Stan (Stan Store)** | **No free tier** | ~$29 / ~$99 per month `C3` | Monetization-first: digital products, courses, bookings, funnels. Sells outcome (revenue), not a page |
| **Buffer Start Page** | Free with any Buffer plan | $0 `C2` | Pure PLG loop into the scheduler |
| **Later Linkin.bio** | Bundled | Included `C2` | Shoppable Instagram feed replication |
| **Pallyy** | Bundled | Included `C2` | Bundled with the planner |

**The strategic lesson.** Stan's no-free-tier, revenue-share-adjacent positioning proves
creators will pay $99/month for a tool that visibly makes them money, while Linktree fights
for $5/month for a tool that makes them a page. **Positioning against revenue rather than
against features is worth an order of magnitude in price.** `C1`

---

## 9. White-label & reseller deep dive

The task asked specifically: who does white-label, and *how* — custom domain, own branding,
own billing/markup. This is the single most commercially important table in the file.

`C1` on the tiering; `C2` on individual scope claims. **All of this needs verification.**

| Product | Custom domain | Full dashboard rebrand | Branded client portal | Branded reports | Platform-handled reseller billing |
|---|---|---|---|---|---|
| **Cloud Campaign** | Yes `C2` | Yes `C2` | Yes `C2` | Yes `C2` | **No** `C2` |
| **Sendible** | Yes, upper tiers `C2` | Yes, upper tiers `C2` | Yes `C2` | Yes `C2` | **No** `C2` |
| **Vista Social** | Yes, upper tiers `C2` | Yes `C2` | Yes `C2` | Yes `C2` | **No** `C2` |
| **SocialBee** | Verify `C3` | Partial `C2` | Partial `C2` | Yes `C2` | No `C2` |
| **ContentStudio** | Verify `C3` | Agency tier `C2` | Yes `C2` | Yes `C2` | No `C2` |
| **Social Champ** | Verify `C3` | Agency tier `C2` | Verify `C3` | Yes `C2` | No `C2` |
| **Zoho Social** | Verify `C3` | Agency portal branding `C2` | Yes `C2` | Yes `C2` | No `C2` |
| **Statusbrew** | No `C2` | No `C2` | Partial `C2` | Yes `C2` | No `C2` |
| **Sociality.io** | No `C2` | No `C2` | Partial `C2` | Yes `C2` | No `C2` |
| **NapoleonCat** | No `C2` | No `C2` | No `C2` | Yes `C2` | No `C2` |
| **Kontentino** | No `C2` | No `C2` | Approval-by-link `C2` | Yes `C2` | No `C2` |
| **Metricool** | No `C2` | No `C2` | No `C2` | Yes `C2` | No `C2` |
| **Agorapulse** | **No** `C2` | **No** `C2` | Partial `C2` | Yes `C2` | No `C2` |
| **Sked Social** | No `C2` | No `C2` | Partial `C2` | Yes `C2` | No `C2` |
| **Pallyy** | No `C2` | No `C2` | No `C2` | Yes `C2` | No `C2` |
| **Buffer / Later / Publer / Planable / Loomly / CoSchedule** | No `C2` | No `C2` | No `C2` | Varies `C3` | No `C2` |

### 9.1 The three tiers of "white-label"

Vendors use the phrase to mean wildly different things. Distinguish: `C1`

1. **Branded reports only** — a logo on a PDF. The most common, nearly meaningless, and what
   most vendors mean when they advertise "white-label." Roughly two-thirds of the table above.
2. **Branded client portal** — the client logs into a view that carries agency branding, but
   the agency's own team still uses the vendor-branded product.
3. **Full white-label** — custom domain via CNAME, complete visual rebrand, the vendor's name
   absent throughout. **Only Cloud Campaign, Sendible and Vista Social plausibly reach this
   tier**, and that trio is precisely the competitive set named in the brief.

### 9.2 The reseller-billing gap — the most important finding in this file

**No product in this tier appears to offer platform-handled reseller billing** — that is, the
agency setting its own price, the platform charging the agency's client on the agency's behalf,
and the platform remitting the margin. Every "reseller" story in this market is really just
"we won't put our logo on it; you go invoice your client yourself." `C2`, and **this is the
single claim in this document most worth verifying first**, because if it holds it is a
defensible wedge:

- A Stripe-Connect-style model where the agency sets a markup, the platform is merchant of
  record or facilitator, and the agency receives a payout would be genuinely novel here.
- It converts the agency from a *customer* into a *distribution channel* whose incentive is to
  grow platform seats, which changes the CAC structure of the whole business.
- It compounds with per-workspace pricing: the agency's cost scales with client count and so
  does its revenue, so margin is predictable.

**Caveat.** This also imports real regulatory and operational weight — merchant-of-record
status, tax handling across jurisdictions, chargeback liability, KYC on agency payees. Cross-
reference `11-compliance-security-global.md` before treating it as a cheap differentiator. `C1`

---

## 10. AI capability assessment

The brief asked which products have *genuinely good* AI — brand voice training, repurposing,
video. The honest summary: `C1`

**Almost none.** AI in this tier is overwhelmingly a caption generator behind a credit meter.
The marketing language is uniform and the underlying capability is a thin wrapper over a
frontier model with a prompt template.

### 10.1 Tiering

| Tier | Products | What they actually do |
|---|---|---|
| **Meaningfully differentiated** | SocialBee (AI copilot generating a full category/cadence posting *plan*), Vista Social (AI assistant with brand-voice configuration — see file `01`), ContentStudio (discovery-fed generation) `C2` | AI shapes strategy or is fed by a proprietary data source, not just prose generation |
| **Competent commodity** | Buffer, Publer, Metricool, Later, Hypefury, Typefully, Tailwind (Ghostwriter), Loomly, Social Champ `C2` | Caption generation, rewriting, tone shifting, hashtag suggestion, some image generation |
| **Thin or absent** | MeetEdgar, Crowdfire, Kontentino, Sked Social, Pallyy, NapoleonCat `C2` | Little to none |

### 10.2 Brand voice training

Genuine brand-voice work — ingesting a corpus of a brand's prior posts and conditioning
generation on it, with persistence and per-client isolation — is claimed by several and
plausibly delivered by few. SocialBee, Vista Social and ContentStudio are the most likely to
have something real. **Verify by actually testing, not by reading the marketing page** — this
is a claim where vendor copy and reality diverge sharply. `C2`

Crucially, **per-client brand voice isolation is an agency requirement that per-brand voice
models naturally satisfy but most implementations ignore.** An agency running 30 clients needs
30 isolated voices, not one account-level tone setting. This is a concrete, checkable
differentiator. `C1`

### 10.3 Video AI — the clearest gap in the market

**No product in this tier appears to do serious video work.** `C2`

Specifically, long-form → short-form clip extraction (the OpusClip / Vizard / Descript
capability) exists in *no* social media management tool in this segment. Video is where
attention and platform algorithmic preference have gone across TikTok, Reels, Shorts and now
LinkedIn video, and the entire SMB SMM category is publishing video without any tooling to
*produce* it. Customers currently bridge this with a separate subscription.

This is the largest unclaimed adjacency identified in this file. See §15.

---

## 11. Network coverage matrix

**Not verified — do not rely on this table.** `C2` at best, `C3` for the long-tail columns.
Coverage changes constantly as platform APIs open and close, and several vendors list
"support" for networks where they only offer reminder-based (non-automatic) publishing.
That distinction — **true API auto-publish vs. mobile push reminder** — is material and is
collapsed in every vendor's marketing table. Re-verify per network, per vendor.

| Product | FB | IG | X | LI | TikTok | YouTube | Pinterest | GBP | Threads | Bluesky | Mastodon | Telegram | WordPress | Twitch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Buffer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Publer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Metricool | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓ |
| Later | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ | – | – | – | – | – |
| SocialBee | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Sendible | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ? | ✓ | – | ✓ | – |
| Agorapulse | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ | ? | ? | – | – | – | – |
| Cloud Campaign | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ? | – | – | – | – |
| Hypefury | – | ✓ | ✓ | ✓ | – | – | – | – | ✓ | ✓ | – | – | – | – |
| Typefully | – | – | ✓ | ✓ | – | – | – | – | ✓ | ✓ | – | – | – | – |
| Tailwind | ✓ | ✓ | – | – | – | – | ✓ | – | – | – | – | – | – | – |

Legend: ✓ claimed support, – no support, ? unknown. **Every cell is unverified.**

### 11.1 The regional-network observation

Consistent with the strategy in the root `README.md`: **essentially nothing in this tier
supports the regionally dominant non-Western networks** — VK, Weibo, WeChat, LINE, KakaoTalk/
KakaoStory, Xiaohongshu/RED, Naver, Zalo, Douyin (as distinct from TikTok). Coverage of the
long tail stops at Mastodon and Bluesky, which are Western-developer-culture networks, not
large-population networks. `C1`

If genuinely global coverage is our differentiator, this tier is not the competition for it —
**nobody here is even trying**. Cross-reference `08-platform-apis-regional.md` for whether
those APIs are actually obtainable, which is the real question. The absence of competitors may
reflect API impossibility rather than market oversight, and that distinction determines
whether this is an opportunity or a trap.

---

## 12. Free tiers and PLG mechanics

| Product | Free tier | What's free | Conversion trigger |
|---|---|---|---|
| **Buffer** | Yes — best in tier | ~3 channels, ~10 queued posts/channel, Start Page `C2` | Adding a 4th channel, or the queue cap biting during a busy week `C1` |
| **Planable** | Yes — 50 posts free forever `C2` | Full collaboration features, capped by total posts | Hitting the lifetime post cap — an unusually clean, non-annoying wall `C1` |
| **Publer** | Yes | ~3 accounts, limited scheduling `C2` | Account count and advanced features `C2` |
| **Metricool** | Yes | 1 brand, limited history `C2` | Second brand; analytics history depth `C2` |
| **Pallyy** | Yes | 1 social set, ~15 posts/month `C3` | Monthly post cap `C2` |
| **Zoho Social** | Yes | 1 brand, limited `C2` | Brand count; CRM integration `C2` |
| **Social Champ / Crowdfire / Typefully / CoSchedule** | Yes | Varied, limited `C2` | Volume caps `C2` |
| **Linktree / Beacons** | Yes — the entire funnel | Full basic page `C1` | Analytics, custom domain, commerce `C1` |
| **Later** | Trial only — free plan believed discontinued `C3` | — | — |
| **Agorapulse** | Free plan believed discontinued `C2` | — | — |
| **Sendible / Cloud Campaign / Sked / Iconosquare / Loomly / Stan** | No — trial only `C2` | — | — |

### 12.1 PLG patterns worth stealing

`C1` on the reasoning:

1. **Buffer's free tier is the category's best acquisition asset** because the cap is on
   *channels* — the dimension that grows naturally as a business matures. The user hits the
   wall by succeeding, which is the ideal conversion moment.
2. **Planable's "50 posts free forever"** is the cleanest wall in the market: no time pressure,
   no feature crippling, full product experience. The user converts when the product has
   already proven itself. This drives *quality* conversions with low refund risk.
3. **The free link-in-bio is a Trojan horse.** Buffer's Start Page costs almost nothing to
   operate, ranks in search, gets shared publicly with a backlink, and drops the user directly
   into the scheduler's funnel. Linktree built a company on this loop alone. Any product in
   this space should have one and should give it away.
4. **The agency segment does not do free tiers** — and correctly so. Agencies evaluate on
   demo-and-trial, buy on annual contracts, and a free tier only invites tire-kickers into a
   high-touch motion.

---

## 13. Price floor and benchmarks

> **All figures `C2`/`C3`. This section is the one most likely to be stale and is also the one
> most likely to be quoted downstream. Re-verify before it informs a pricing decision.**

### 13.1 Price per social profile per month

Derived from recalled list prices divided by recalled included-profile counts — a
double-approximation. Directionally useful, numerically unreliable.

| Product | Approx. $/profile/month | Notes |
|---|---|---|
| Publer | ~$3–5 `C3` | Market floor for credible breadth |
| Pallyy | ~$3–4 `C3` | If a "set" is counted as ~5 profiles |
| Vista Social | ~$4–8 `C3` | See file `01` |
| Zoho Social | ~$3–6 `C3` | Cheaper still inside Zoho One |
| Buffer (Essentials) | ~$5–6 `C3` | Explicit per-channel list price |
| SocialBee | ~$6 `C3` | $29 ÷ 5 profiles |
| Sendible | ~$4–8 `C3` | Falls with tier size |
| Buffer (Team) | ~$10–12 `C3` | |
| Metricool | Per-brand — not directly comparable `C2` | |
| Agorapulse | ~$5–8 nominal, but seat cost dominates `C3` | Effective cost far higher |
| Cloud Campaign | Per-brand, ~$20–40/brand `C3` | Different unit entirely |
| **Enterprise tier (ref: file `03`)** | **~$25–30** `C2` | For contrast |

**The benchmark to carry forward: credible SMB tools cluster at roughly $4–8 per social
profile per month, with a hard floor near $3 and the agency/white-label premium pushing the
effective figure to $20–40 per client brand.** `C2`

### 13.2 The cheapest credible entry point

"Credible" = supports the Tier-1 networks, publishes reliably, has analytics and a calendar,
and is a going concern rather than abandonware.

| Rank | Product | Recalled entry | Why it qualifies |
|---|---|---|---|
| 1 | **Zoho Social** | ~$10–15/mo `C3` | Cheapest, but strategically only makes sense inside Zoho |
| 2 | **Publer** | ~$12–15/mo `C3` | **The true floor for a standalone credible tool** — best coverage per dollar |
| 3 | **Pallyy** | ~$18/mo `C3` | Cheapest with a genuinely good visual planning UX |
| 4 | **Metricool** | ~$18–22/mo `C3` | Cheapest with serious analytics *and* paid-ads reporting |

**Conclusion: the pricing floor for a credible standalone SMB product is roughly $12–20/month.**
Below that the market is free tiers and abandonware. Pricing an entry tier under ~$12 signals
"not serious" rather than "good value" and mainly attracts users who will never expand. `C2`

### 13.3 Best value

- **Best raw value:** Publer — coverage per dollar is unmatched. `C2`
- **Best value for analytics:** Metricool — organic and paid reporting at a price others charge
  for scheduling alone. `C2`
- **Best value for agencies:** Cloud Campaign on the per-brand/unlimited-users model, *if* the
  agency has enough clients to amortize it; Vista Social below that threshold. `C2`
- **Best value for collaboration:** Planable — the free tier plus low per-seat cost is hard to
  beat for approval workflow specifically. `C2`

### 13.4 Implication for our pricing

`C1` on the reasoning, contingent on the numbers above being verified:

1. An entry tier below ~$12/month is counterproductive.
2. The $19–29/month band is the most crowded in the market — entering there means competing on
   features against Publer, Metricool, SocialBee and Pallyy simultaneously.
3. **The agency band ($150–450/month per agency) is where pricing power exists**, is where the
   white-label trio already operates, and is the only place a genuinely differentiated offer
   can command a premium in this tier.
4. Per-profile pricing conflicts directly with a network-breadth differentiation strategy
   (§3.3). If breadth is the wedge, the pricing unit should probably not be the profile.

---

## 14. Verification plan

**This is the actionable output of this document.** Re-run this agent with (a) a replenished
WebSearch budget and (b) egress allowlisting for the domains below.

### 14.1 Required egress allowlist

```
buffer.com              later.com               publer.com          socialbee.com
metricool.com           loomly.com              agorapulse.com      planable.io
contentstudio.io        statusbrew.com          sendible.com        zoho.com
sociality.io            coschedule.com          socialchamp.io      crowdfire.com
meetedgar.com           tailwindapp.com         iconosquare.com     skedsocial.com
pallyy.com              hypefury.com            typefully.com       linktr.ee
beacons.ai              stan.store              napoleoncat.com     kontentino.com
cloudcampaign.io        vistasocial.com
g2.com                  capterra.com            trustradius.com     trustpilot.com
reddit.com              news.ycombinator.com
```

Review sites (G2/Capterra/TrustRadius) are required for the **user-complaints** section —
that data does not exist on vendor properties. Reddit (r/socialmedia, r/agency,
r/SocialMediaMarketing) is the best source for unfiltered agency complaints and churn reasons.

### 14.2 Per-product fetch list

For each product, fetch in this order:

1. `/pricing` — the authoritative price table. **Screenshot-equivalent capture: record the
   exact plan names, monthly price, annual price, and every numeric cap.**
2. `/pricing` again with an annual/monthly toggle if the page is interactive — many vendors
   render only one state server-side and the fetched markdown will silently show just one.
3. The features or comparison page for the network list.
4. The agency/white-label page, where one exists — this is where custom-domain and rebrand
   scope is actually documented.
5. Help/docs for the *real* limits: API rate limits, post caps, analytics retention windows,
   and crucially **which networks are auto-publish vs. reminder-only**.
6. G2/Capterra reviews filtered to the last 12 months, sorted by lowest rating, for complaints.

### 14.3 Specific claims to verify first

Ordered by decision impact:

1. **§9.2 — the reseller-billing gap.** If any competitor already does platform-handled
   markup billing, a central strategic assumption changes. Highest priority.
2. **§13.2 — the price floor.** Directly informs our entry-tier pricing.
3. **§10.3 — the video-AI gap.** If someone shipped clip extraction since May 2026, the
   largest identified opportunity is gone.
4. **§9.1 — who reaches true full white-label.** Determines the real competitive set.
5. **§11 — auto-publish vs. reminder-only per network.** Determines whether competitors'
   coverage claims are as strong as they look, and whether ours can beat them honestly.
6. **§3.2 — pricing model per vendor.** Slow-changing but load-bearing for §3.3.

### 14.4 Known-volatile items

Re-verify even if this file is refreshed recently:

- Later's free plan existence and tier structure (frequent restructures).
- Agorapulse's free plan status.
- CoSchedule's product lineup (repeatedly repackaged).
- Buffer's tier names and per-channel price.
- Any AI feature claim anywhere — this is the fastest-moving surface in the category.
- Threads and Bluesky API support, which was expanding rapidly as of the cutoff.

---

## 15. Market gaps

Candidate gaps — where nobody in this tier appears to do well, or at all. `C2` on each unless
noted, and each needs the §14 verification before it can carry weight.

1. **Native video repurposing.** Long-form → short-form clip extraction inside the SMM tool.
   The single clearest gap (§10.3). Customers currently pay for a second subscription. Highest
   confidence gap in this document.
2. **True reseller billing with markup.** Nobody appears to let an agency set a price and have
   the platform bill the client and remit margin (§9.2). Turns customers into a distribution
   channel. Caveat: significant compliance weight.
3. **Regional/non-Western network coverage.** VK, Weibo, LINE, KakaoStory, Xiaohongshu, Naver,
   Zalo — near-zero coverage across the entire tier (§11.1). **But verify whether this is
   market oversight or API impossibility** before treating it as an opportunity. `C1`
4. **Real listening at SMB prices.** Most "listening" here is keyword monitoring on owned
   channels. Genuine cross-web listening starts at enterprise pricing (file `03`).
5. **Closed-loop revenue attribution.** Agorapulse's ROI module is the only serious attempt in
   this tier. Connecting posts to revenue rather than to engagement is under-served and is what
   the buyer actually wants to prove.
6. **Agentic AI.** Every AI in this tier is a caption generator invoked by a human. None
   proposes a strategy, executes it, measures it, and adjusts. Consistent with the root
   `README.md`'s stated ambition of "AI that owns outcomes rather than tasks."
7. **Per-client brand-voice isolation.** Agencies need N isolated voices; implementations
   assume one account-level tone (§10.2). Small, concrete, checkable.
8. **The three-module squeeze.** Approvals, analytics, and inbox in one affordable product.
   Every competitor is strong at one and weak at the other two — Planable owns approvals,
   Metricool/Iconosquare own analytics, Agorapulse/Statusbrew own inbox. Nobody at SMB price
   is credible at all three simultaneously.
9. **Reviews management.** Google Business Profile and review-site response handling is rare
   outside Vista Social, despite being a top-three need for local/multi-location businesses.
10. **Approval without an account.** Kontentino's emailed-approval-link pattern (§5.7) removes
    the largest friction point in agency review cycles and is almost unreplicated.

---

## Appendix A — products named in the brief, coverage status

| Product | Covered in | Depth achieved |
|---|---|---|
| Buffer | §4.1 | Recall only |
| Later | §4.2 | Recall only |
| Publer | §4.3 | Recall only |
| SocialBee | §4.5 | Recall only |
| Metricool | §4.4 | Recall only |
| Loomly | §4.6 | Recall only, thin |
| Agorapulse | §3.2, §9, §12 | **Thin — no dedicated dossier written; recall too weak to be useful** |
| Planable | §3.2, §12 | **Thin — no dedicated dossier** |
| ContentStudio | §5.3 | Recall only |
| Statusbrew | §5.4 | Recall only |
| Sendible | §5.2 | Recall only |
| Zoho Social | §4.7 | Recall only |
| Sociality.io | §5.5 | Recall only, thin |
| CoSchedule | §6.2 | Recall only |
| Social Champ | §4.8 | Recall only, thin |
| Crowdfire | §4.9 | Recall only, thin |
| MeetEdgar | §6.1 | Recall only |
| Tailwind | §7.1 | Recall only |
| Iconosquare | §7.2 | Recall only |
| Sked Social | §7.3 | Recall only, thin |
| Pallyy | §4.10 | Recall only |
| Hypefury | §7.4 | Recall only |
| Typefully | §7.5 | Recall only |
| Buffer Start Page | §8 | Recall only |
| Linktree / Beacons / Stan | §8 | Recall only |
| NapoleonCat | §5.6 | Recall only |
| Kontentino | §5.7 | Recall only |
| Cloud Campaign | §5.1 | Recall only |

**Agorapulse and Planable are the two most significant under-coverage gaps** — both are
important competitors (Agorapulse for inbox/ROI, Planable for the approval motion) and neither
received a dossier because recall was too thin to write one responsibly. Prioritize both in the
re-run.

---

## Appendix B — what this file is not

To be explicit for any downstream agent synthesizing this corpus:

- It is **not** a verified competitive analysis.
- It contains **no** citations, because no sources were retrieved.
- Its pricing tables are **not** suitable for input to a pricing decision.
- Its network coverage matrix is **not** suitable for input to a platform-API prioritization
  decision (use files `06`, `07`, `08` for that).

What it **is**: a structured hypothesis set, a market segmentation, a pricing-model taxonomy,
and an executable verification plan. The segmentation (§2), the pricing-model taxonomy (§3),
the white-label tiering (§9.1) and the gap list (§15) are reasoning about market structure and
retain value independent of the specific numbers. The numbers do not.
