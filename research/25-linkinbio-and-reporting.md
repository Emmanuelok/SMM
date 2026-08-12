# 25 — Link-in-Bio / Microsite **and** Agency Reporting / BI

**Two adjacent categories that scheduling tools bolt on badly.**

**Prepared:** 12 August 2026
**Scope:** (A) Link-in-bio / microsite / creator-storefront products — Linktree, Beacons, Stan Store, Bio.link, Milkshake, Campsite, Later Link in Bio, Buffer Start Page, Komi, Pillar, Shorby, Taplink. (B) Agency reporting and BI — AgencyAnalytics, Whatagraph, Databox, Swydo, DashThis, Porter Metrics, Looker Studio social connectors, Power BI, Klipfolio.
**Purpose:** Establish what each category actually sells, which vendors have real revenue machinery versus a styled `<ul>`, what agencies are really buying when they pay for a second reporting tool, whether anyone exposes a warehouse path, and where link-in-bio attribution is quietly fictional.

---

> # ⛔ PROVENANCE WARNING — READ THIS BEFORE QUOTING ANY NUMBER
>
> **This file was produced with NO live web access.** Two independent failures:
>
> 1. **WebSearch budget exhausted** — the session hit its hard cap (200/200 calls) before this task began. Zero searches were available.
> 2. **Network egress fully blocked** — the agent proxy returned `403` to `CONNECT` for every host attempted (`linktr.ee`, `beacons.ai`, `agencyanalytics.com`, `databox.com`, `buffer.com`, `porterhq.com`, `help.metricool.com`, `g2.com`, `en.wikipedia.org`, and every search engine). Proxy status confirms `connect_rejected — gateway answered 403 to CONNECT (policy denial)` across all recent attempts. This is a session-wide egress denial, not a per-domain block.
>
> **Therefore: not one product page, pricing page, help-centre article, changelog or review page was fetched for this document.** The research rules for this task ("fetch the actual product pages", "walk the site", "find real user criticism on G2/Capterra/Reddit") **could not be executed**. This is a hard limitation, stated plainly rather than papered over.
>
> **Every claim carries a provenance tag. Respect them:**
>
> | Tag | Meaning | Trust |
> |---|---|---|
> | `[R:nn§x]` | **Repo-verified.** Drawn from an earlier research file in `/home/user/SMM/research/` that *was* produced with live web access. Inherits that file's own confidence grade. | **Highest available here** |
> | `[K]` | **Model recall.** From training data, cutoff ~May 2026. Plausible, directionally right, **not verified in this session**. Prices and tier names in this category change every 6–12 months. | **Treat as a hypothesis** |
> | `[C1]` | **Reasoning / inference.** My analysis built on tagged inputs. The argument is the artefact, not the number. | Judge the logic |
> | `[U]` | **UNVERIFIED.** I do not know, and I am not guessing. | Zero |
>
> **Specific things you must NOT take from this file without re-checking:** every price, every transaction-fee percentage, every tier name, every connector count, every plan limit. §14 is a complete register of what needs re-verification, ordered by decision-impact.
>
> **What this file *is* good for despite that:** the structural analysis. The taxonomy of what "shoppable" means, the capture-vs-own-vs-send distinction on email, the attribution failure-mode analysis in §12 (which is mechanism, not marketing copy, and does not rot), the reporting-tool delta argument in §10, and the warehouse answer in §11 — which is **repo-verified** and is the single most decision-relevant finding here.
>
> **No user-review quotes appear in this document.** G2, Capterra, Trustpilot and Reddit were all unreachable. Rather than invent plausible-sounding quotes — which would be the worst possible failure mode for a permanent reference — §7 and §9 present criticism as **themes with attribution to where the theme is documented in the repo**, and explicitly mark verbatim sourcing as outstanding work.

---

## Table of contents

**Part A — Link-in-bio / microsite**
1. [The category in one page](#1-the-category-in-one-page)
2. [The four tiers — and the test that separates them](#2-the-four-tiers)
3. [Vendor dossiers](#3-vendor-dossiers--link-in-bio)
4. [Block types — what you can actually put on a page](#4-block-types)
5. [Commerce, checkout and take rates](#5-commerce-checkout-and-take-rates)
6. [Email capture: capture vs own vs send](#6-email-capture)
7. [Custom domains, SEO, and why these pages cannot rank](#7-custom-domains-and-seo)
8. [Pricing table](#8-pricing-table)
9. [Criticism themes](#9-criticism-themes--link-in-bio)
10. [What the SMM tools ship, and why it is deliberately bad](#10-what-the-smm-tools-ship)

**Part B — Agency reporting / BI**
11. [Four archetypes of reporting product](#11-four-archetypes)
12. [Vendor dossiers](#12-vendor-dossiers--reporting)
13. [White-label depth — the matrix that decides deals](#13-white-label-depth)
14. [Per-client pricing economics](#14-per-client-pricing-economics)
15. [Criticism themes](#15-criticism-themes--reporting)

**Part C — The three key questions**
16. [Q1: What do agencies pay a separate reporting tool for?](#16-q1-the-delta)
17. [Q2: Who exposes a warehouse/BI path?](#17-q2-the-warehouse-path)
18. [Q3: What does link-in-bio attribution actually measure?](#18-q3-attribution)

**Part D**
19. [Product implications](#19-product-implications)
20. [UNVERIFIED register](#20-unverified-register)
21. [Sources](#21-sources)

---

# PART A — LINK-IN-BIO / MICROSITE

## 1. The category in one page

`[C1]` Link-in-bio exists because of one platform decision: **Instagram allows exactly one clickable URL in a profile bio.** The entire category is arbitrage on a single UI constraint. That origin explains almost everything about its economics:

- **The core product is trivially cloneable.** A hosted page with reorderable buttons is a weekend build. There is no technical moat.
- **Therefore the market went freemium at enormous scale and low ARPU.** `[R:10§25.1]` characterises it as *"a freemium land-grab with a very low conversion rate to paid"*, with Linktree's scale implying **single-digit-percent paid conversion and low-single-digit-dollar blended ARPU**.
- **Therefore every serious vendor added commerce**, because a percentage of a creator's revenue is worth more than $5/month. `[R:10§25.1]`: *"Stage 3 is where the real money is and why every link-in-bio vendor added a store."*
- **The category has consequently bifurcated.** One half is still selling a page. The other half stopped selling a page and started selling *revenue*, and charges 5–20× more for it.

`[R:04§8]` states the lesson bluntly: *"Stan's no-free-tier, revenue-share-adjacent positioning proves creators will pay $99/month for a tool that visibly makes them money, while Linktree fights for $5/month for a tool that makes them a page. Positioning against revenue rather than against features is worth an order of magnitude in price."*

**Market size:** `[R:10§ segment table]` sizes link-in-bio at **~$150–300M ARR globally, Linktree-dominated** — tagged `[C3]` in that file, i.e. its own weakest confidence grade. `[C1]` For calibration: that is roughly one mid-size SMM vendor. **Link-in-bio is not a market you enter for its revenue. It is a market you enter for its distribution and its data.**

### 1.1 The three reasons an SMM product should care

`[C1]`

1. **It is the only viral surface an SMM tool has.** `[R:00§10.1]` is emphatic: *"an SMM tool has almost no viral surface"*, and lists link-in-bio as **item 1 of Day 0 marketing**, a *"free forever, on its own short domain, with a removable branded footer"* — an engineering investment that produces a distribution asset. `[R:00§9.4]` goes further and says the creator/solo segment should be served *"for exactly one reason: the link-in-bio page and the 'Made with' footer are our only viral surface."*
2. **It is the only place in the entire stack where you own the pixel, the domain and the click.** `[R:10§12.2]`: *"the link-in-bio page is the only surface in this entire file where we own the pixel, the domain and the click. That makes it the natural home for first-party attribution."* This is the strategically important point and it is developed in §18.
3. **It is a cheap switching lever.** `[R:10§12.3]`: importers are *"the cheapest growth mechanism in this category because Linktree's ~50M+ user base is almost entirely unmonetized and switching cost is otherwise the only thing holding it."*

### 1.2 The counterweight — a regulatory cost nobody prices in

`[R:00§4.2 D22]` and `[R:blueprint-c L4]`, sourcing `[11§6.1]`: **a public link-in-bio plausibly converts the operator from a *hosting service* into an *online platform* under the EU Digital Services Act.** That brings notice-and-action obligations, transparency reporting, and trusted-flagger handling.

`[R:00§Risk R11]` scores this: *"Free tier and link-in-bio abuse — spam, phishing pages, CSAM exposure, DSA obligations"*, mitigated by *"abuse controls at signup; tenant-branded pages under tenant domains; notice-and-action from day one; sanctions geo-block; content scanning on public surfaces."*

`[C1]` **This is the single most under-discussed fact about the category.** Every competitor listed in this file is hosting arbitrary user-generated public pages that redirect to arbitrary destinations. That is a phishing distribution network with a nice theme picker. The incumbents absorbed this cost years ago and it is invisible in their marketing. Anyone entering must budget for trust-and-safety headcount, not just a page builder. `[R:00§4.2]`: *"Public surfaces are a regulatory decision, not a growth decision."*

---

## 2. The four tiers

`[C1]` The brief asks: **"Which have real revenue features vs. a list of links?"** That question needs a test, not a vibe. Here is the test I propose, and it is deliberately harsh:

> ### The Order Object Test
> **Does the product create a durable `order` record that it owns — with a customer identity, a line item referencing a product it hosts, an amount, a fulfilment state, and a refund path — such that the creator can answer "who bought what, when, and did I ship it" without leaving the tool?**
>
> If yes → it is a commerce product.
> If it renders a Stripe/PayPal button and forgets → it is a **payment link**, not commerce.
> If it links out to somebody else's checkout → it is a **list of links**.

Applying it produces four tiers. **Every classification below is `[C1]` reasoning applied to `[K]` feature recall, and is the most likely thing in this document to be wrong in detail.**

| Tier | Definition | Members | What they actually sell |
|---|---|---|---|
| **T1 — Creator commerce platform** | Owns the catalogue, the checkout, the customer record, digital fulfilment, and usually the email list. Order object exists. | **Stan Store**, **Beacons** (Store), **Pillar**, **Taplink** | Revenue. The page is a side effect. |
| **T2 — Page with payments bolted on** | Can take money — tips, single products, "request payment" — but the commerce object model is thin. Often a wrapper over Stripe/PayPal/Square with limited fulfilment and reporting. | **Linktree** (Store/Commerce), **Bio.link** `[U]`, **Campsite** `[U]` | A page, upsold with a payment button |
| **T3 — Routing / presentation layer** | No money movement. Sophisticated about *where the click goes* (pixels, UTMs, deep links, feed mirroring) but not about selling. | **Shorby**, **Later Link in Bio**, **Komi**, **Milkshake** | Traffic control or presentation |
| **T4 — Acquisition checkbox** | A free link list attached to a different product, existing to create signups. | **Buffer Start Page**, **Publer Link in Bio**, **Vista Page**, **Pallyy** | Nothing. It is a funnel for the parent product. |

### 2.1 The uncomfortable observation about T4

`[R:22§11]` on Publer: *"table-stakes implementation, given away free as an acquisition surface. The 15-link cap and the Linkie partnership together suggest Publer regards link-in-bio as a checkbox, not a product line. Low threat; do not over-invest to match it."*

`[R:20§11]` on Buffer: *"Start Page is a **PLG trojan horse**, not a serious Linktree competitor. It costs Buffer almost nothing, it drags creators into the scheduler, and charging a channel slot for it is the tell that Buffer views it as a conversion asset rather than a product line."*

`[C1]` **The brief's framing — "scheduling tools bolt this on badly" — is correct, but the reason is not incompetence. It is deliberate.** Buffer, Publer and Later are not trying to beat Linktree. They are trying to make signup free. Building a good one is not a competitive response to them; it is a competitive response to *Linktree*, which is a different and much harder fight — **unless** you do the one thing neither side does, which is join the page's clicks to the scheduler's posts and the store's orders (§18.6).

### 2.2 The one genuine exception in the bundled tier

`[R:01§12]` documents **Vista Page** as materially more than a link list:

| Feature | Detail |
|---|---|
| Page type | Link-in-bio, **mini website**, **landing page** |
| Embeds | **Calendly** (booking), **Typeform** (lead capture *and collect payments*), YouTube, galleries, social profiles |
| Themes | Theme picker + Appearance tab (colours, fonts, design elements) |
| **Custom domain** | Own domain, **free SSL certificates** |
| **QR code** | Downloadable unique QR per page |
| Analytics | Click tracking, page statistics |
| **Import Link in Bio (Beta)** | Migrate an existing Linktree-style page |
| Page count limit | `[R:01]` **UNVERIFIED** |

`[R:01§12]` assessment: *"meaningfully more capable than Later's or Buffer's link-in-bio. The Calendly/Typeform embeds plus payments make it a lightweight landing-page product. The Import feature is a smart competitive-switching lever worth copying."*

`[C1]` But note what `[R:10§12.1]` says in the same breath: Vista Page takes *"payments via Typeform embed only — **no native commerce**."* **Under the Order Object Test, Vista Page is T3/T4.** It is an unusually good page. It does not sell anything. The gap between "micro-CMS with a Typeform" and "creator commerce platform" is the entire product.

---

## 3. Vendor dossiers — link-in-bio

> **All pricing and feature detail in this section is `[K]` (model recall to ~May 2026) unless tagged `[R:...]`. Link-in-bio pricing is repackaged roughly annually. Verify every figure.**

### 3.1 Linktree — the category default

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Melbourne, Australia; founded 2016 (Alex Zaccaria, Anthony Zaccaria, Nick Humphreys) | `[K]` |
| Funding | Series C ~**$110M** at a reported **~$1.3B** valuation, March 2022 (Index Ventures, Coatue) | `[K]` |
| Scale | *"tens of millions of users"* `[R:10§12.1]`; *"~50M+ user base"* `[R:10§12.3]` | `[R]` |
| Tiers | Free / Starter / Pro / Premium | `[K]` |
| Recalled pricing | Free; Starter ≈**$5/mo**; Pro ≈**$9/mo**; Premium ≈**$24/mo** (annualised) | `[R:10§12.1]` `[C3]` |
| Cross-check | `[R:04§8]` independently recalls *"Free / ~$5 / ~$9–24 / Premium"* | `[R]` `[C3]` |

**Acquisition that matters:** `[R:10§12.1]` records **Koji shut down (~2023), assets to Linktree.** `[C1]` Koji was an app-platform for creator mini-apps (tip jars, shops, link-gated content). Linktree buying it was an explicit statement that the page alone was not a business and the app/commerce layer was.

**Feature recall by tier `[K]` — treat the tier boundaries as the weakest part:**

- **Free:** unlimited links, preset themes, Linktree branding footer, basic lifetime views/clicks.
- **Starter:** custom button styles/colours, some scheduling. `[U]` on whether branding removal sits here.
- **Pro:** custom appearance, remove Linktree logo, link scheduling, link animations, link prioritisation, embeds (video/music), **email/phone capture**, **Google Analytics + Meta Pixel**, link thumbnails, auto-link from Instagram/TikTok, referrer/location/device analytics.
- **Premium:** **custom domain**, priority support, additional admin seats, deeper analytics.

`[C1]` **The gating of custom domain to the top tier is the most strategically interesting decision Linktree makes, and it is not greed — it is rational.** See §7.3.

**Commerce:** Linktree Store / "Commerce" — sell digital products, take tips, request payment; integrations with **Stripe, PayPal, Square**. `[R:10§12.1]`: *"Linktree payments/'Shop' via Stripe/PayPal/Square; takes a % on some tiers."* **Exact take rate by tier: `[U]`.** `[C1]` The known pattern across the category is fee-decreasing-with-tier; assume Linktree does the same until verified.

**Integrations:** 30+ recalled — Spotify, YouTube, TikTok, Shopify product feed, Mailchimp, Kit/ConvertKit, Stripe, PayPal, Square, Typeform, Calendly, Gumroad, Patreon, Substack, Bandsintown, Cameo. `[K]`, count `[U]`.

**Strategic read `[C1]`:** Linktree's moat is **default-ness**, not features. It is the verb. Its weakness is that ~50M users are *"almost entirely unmonetized"* `[R:10§12.3]` and its paid feature set is a set of gates rather than a set of outcomes. It converts on *removing annoyances* (branding, domain) rather than on *creating revenue*. That is a structurally weaker upgrade motive than Stan's.

---

### 3.2 Beacons — the creator OS

| Attribute | Detail | Tag |
|---|---|---|
| Positioning | *"Creator-OS ambition (link-in-bio + store + email + media kit + AI)"* | `[R:10§12.1]` |
| Recalled pricing | Free; **≈$10/mo** Creator Pro; **≈$30/mo** Store Pro | `[R:10§12.1]` `[C3]` |
| Cross-check | `[R:04§8]` recalls *"Free / ~$10 / ~$30"* | `[R]` `[C3]` |
| **Take rate** | *"Digital + physical store, **~0–9% fee by tier**"* | `[R:10§12.1]` `[C3]` |

**The structural point `[C1]`:** Beacons' pricing is a **fee-buy-down ladder**, not a feature ladder. You do not upgrade to unlock a font; you upgrade to stop paying 9% on your revenue. That is a far better upgrade motive than Linktree's, because it is arithmetic the creator can do: *at $340/mo in sales, Store Pro pays for itself.* **Any vendor entering this category should copy the fee-buy-down mechanic and not the feature-gate mechanic.**

**Module inventory `[K]`:**

| Module | Notes |
|---|---|
| Link-in-bio page | Blocks, themes |
| **Store** | Digital products, physical products, subscriptions/memberships |
| **Email marketing** | Native list + **sending**, not just capture. Send limits by tier `[U]` |
| **Media kit** | Auto-generated from connected IG/TikTok: audience demographics, engagement rate, past collaborations, rate card. **Genuinely distinctive** |
| **Brand deals** | Outreach/marketplace, invoicing, contract templates |
| AI tools | AI writer, AI outreach emails, AI brand matching |

`[C1]` **The media kit is the most under-copied feature in this entire category.** It is the only artefact in a link-in-bio product that the creator uses to *make money from someone other than their audience*. It converts the tool from a storefront into a sales deck. It also happens to require exactly the data an SMM tool already has (audience demographics, engagement rate, post history) — which makes it near-free for a scheduler to build and expensive for Linktree, who has no analytics relationship with the creator's accounts.

**Weaknesses `[K]`, unsourced:** feature sprawl (six products at $10/mo means none are deep), and the free tier's 9% take rate is high enough that serious sellers leave for Stan rather than upgrade.

---

### 3.3 Stan Store — the price-anchoring outlier

| Attribute | Detail | Tag |
|---|---|---|
| Positioning | *"Creator-commerce first, high conversion focus"* | `[R:10§12.1]` |
| **No free tier** | Explicitly noted | `[R:04§8]` |
| Recalled pricing | **≈$29/mo** Creator; **≈$99/mo** Creator Pro | `[R:10§12.1]`, `[R:04§8]` `[C3]` |
| Platform take rate | **0%** (Stripe processing only) — SaaS model | `[K]` |
| Founded | 2022, John Hu | `[K]` |
| Reported traction | Claimed $30M+ ARR by ~2024 | `[K]` — **`[U]`, creator-economy ARR claims are notoriously self-reported** |

**Product inventory `[K]`:** digital downloads, courses, **1:1 coaching/calls with calendar booking**, webinars, memberships/subscriptions, lead magnets, affiliate program, native email marketing with automations, **order bumps and upsells**, funnels.

`[C1]` **Stan is the most important vendor in this file for pricing strategy reasons, not product reasons.** Note the arithmetic:

- Linktree Pro at ~$9/mo, take rate >0% on commerce.
- Stan Creator at ~$29/mo, take rate 0%.
- **Stan is 3× the price and cheaper for anyone selling more than ~$X/month.**

`[R:10§26]` records the wider trend this sits inside: *"take rates are compressing toward zero as SaaS-fee models (beehiiv, Kajabi, Shopify, Stan) attack percentage-of-revenue models (Substack, Patreon)."*

`[R:10§25.1]` draws the conclusion that matters for us: *"**an SMM tool that already has the customer's payment relationship can offer a 0% take rate as a weapon.**"*

`[C1]` **Sharpening that:** an SMM tool at $99/mo already collects a card. Adding creator commerce at 0% take rate costs it nothing incremental and reframes the entire subscription — *"your scheduler is free; you're paying us instead of paying Beacons 9%."* That is a genuinely strong repositioning available to an SMM vendor and to nobody else in this list.

**Weaknesses `[K]`:** design customisation is deliberately constrained (Stan argues this is why it converts — mobile-first, in-app-browser-optimised templates); ecosystem lock-in is total because the products, customers, email list and payouts all live inside Stan; custom domain support `[U]`.

---

### 3.4 Taplink — the most underrated product in the category

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Russian-origin, global | `[K]` |
| Recalled pricing | **~$3–6/mo** | `[K]` — `[R:10§12.1]` places the long tail at *"$0–20/mo"* |
| Positioning | Multi-page funnel builder disguised as a link-in-bio | `[C1]` |

**Feature recall `[K]`:** multi-page navigation (genuinely multi-page, not one scroll), forms with field validation, **payment acceptance through a broad set of gateways including regional PSPs**, product catalogue with a cart, appointment booking, lead storage (light CRM), messenger deep-links (Telegram/WhatsApp), custom domain.

`[C1]` **Taplink has more genuine commerce and funnel capability per dollar than anything else in this list, and near-zero Western mindshare.** The reason is distribution and brand, not product. It is the clearest evidence available that **the link-in-bio feature set is not defensible** — a low-priced competitor can match the feature list entirely. Whatever moat exists in this category is brand, default-ness, and the switching cost of a printed URL.

---

### 3.5 Shorby — the marketer's link-in-bio

`[K]` throughout; **pricing `[U]`** (recalled in the ~$15–100/mo range across Rocket/Pro/Agency-style tiers, low confidence).

Distinctive because it is the only product in this set built for **paid-media operators** rather than creators:

- **Multiple retargeting pixels per page** (Meta, Google, TikTok, and others) — so the bio page becomes an audience-building surface.
- UTM parameters applied across all outbound links.
- Messenger deep-links (WhatsApp, Telegram, Messenger, Viber) as first-class blocks.
- Dynamic/rotating links.
- Agency plan with sub-accounts.

`[C1]` **Shorby understood the strategically correct thing about this category before anyone else and monetised it badly.** The bio page's real value is that it is a *first-party pixel-bearing surface between the social platform and the destination* — an interstitial you control. Shorby sells that as a feature. §18.6 argues it should be the entire product thesis.

---

### 3.6 The rest — condensed

| Vendor | Model | Recalled price | Real revenue features? | Notes |
|---|---|---|---|---|
| **Bio.link** | Freemium, minimal | ~$5/mo premium `[K]` | **T2/T3** — tips/payments `[U]` | Cheap, fast, thin. Custom domain on paid `[K]` |
| **Milkshake** | Mobile-app-only, card/magazine layout | ~$3–5/mo `[K]` | **T3 — none** | iOS/Android only; design-led for small business; weak analytics; no commerce |
| **Campsite** (campsite.bio) | Freemium, analytics-forward | ~$7/mo Pro `[K]` | **T2/T3** `[U]` | Better-than-average analytics, link groups, scheduling, custom domain on Pro, GA + Meta pixel |
| **Komi** | Premium, talent/agency-oriented | `[U]` — recalled higher, ~$20–40/mo | **T3** | Aimed at music/sport/talent management; strong EPK/media presentation; team accounts |
| **Pillar** (pillar.io) | Creator page + products | `[U]` — ~$15–25/mo recalled | **T1/T2** — digital products, courses, coaching | Fee on free tier `[U]` |
| **Later Link in Bio** (linkin.bio) | Bundled with Later | Included `[R:04§8]` | **T3 — none** | `[R:10§12.1]`: *"Shoppable via product links"*. The **original** feed-mirroring insight `[R:10§12.2]` |
| **Buffer Start Page** | Bundled, **consumes a channel slot** | $0 but costs a channel `[R:20§11]` | **T4 — none** | See §10.1 — the detail here is repo-verified and damning |
| **Publer Link in Bio** | Bundled, free | Free `[R:22§11]` | **T4 — none** | **Max 15 external links** `[R:22§11]` |
| **Vista Page** | Bundled | Included `[R:01§12]` | **T3** — payments only via Typeform embed `[R:10§12.1]` | Best of the bundled set; real custom domain + SSL; Linktree importer |
| **Pallyy** | Bundled | Included `[R:04§8]` | **T4** | |
| **Koji** | — | — | — | **Shut down ~2023, assets to Linktree** `[R:10§12.1]` |
| **Shopify Linkpop** | — | — | — | *"status uncertain, believed wound down"* `[R:10§12.1]` `[C3]` |

`[C1]` **Two deaths worth noting.** Koji (venture-funded, app-platform ambition) and Linkpop (built by *Shopify*, which owns the checkout) both failed. If the company that owns commerce infrastructure could not make a link-in-bio work as a standalone, **the page is not the business.** The business is either (a) the creator's revenue, taken as a fee or a subscription, or (b) distribution into a larger product. There is no third option, and every T3/T4 vendor in this table is quietly living option (b).

---

## 4. Block types

`[K]` throughout except where tagged. Block inventory is the least differentiated axis in the category — this table exists mainly to show that.

| Block | Linktree | Beacons | Stan | Taplink | Campsite | Milkshake | Shorby | Buffer SP | Vista Page |
|---|---|---|---|---|---|---|---|---|---|
| Link button | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `[R]` | ✅ `[R]` |
| Social icon row | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `[R]` | ✅ `[R]` |
| Text / rich text | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `[R]` | ✅ `[R]` |
| Image / gallery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `[R]` | ✅ `[R]` |
| Video embed (YouTube) | ✅ | ✅ | ✅ | ✅ | ✅ | `[U]` | ✅ | ✅ `[R]` | ✅ `[R]` |
| Music / Spotify | ✅ | ✅ | `[U]` | `[U]` | ✅ | `[U]` | ✅ | `[U]` | `[U]` |
| **Email capture form** | ✅ Pro | ✅ | ✅ | ✅ | ✅ | `[U]` | `[U]` | ✅ `[R:20§11]` | via Typeform `[R]` |
| **Product / buy button** | ✅ Store | ✅ | ✅ | ✅ | `[U]` | ❌ | ❌ | ❌ `[R]` | ❌ native `[R]` |
| **Digital download** | ✅ | ✅ | ✅ | ✅ | `[U]` | ❌ | ❌ | ❌ | ❌ |
| **Course / lesson** | ❌ | ✅ | ✅ | `[U]` | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Booking / calendar** | via embed | ✅ | ✅ native | ✅ | `[U]` | ❌ | ❌ | ❌ | **Calendly embed** `[R]` |
| **Tip / donation** | ✅ | ✅ | ✅ | ✅ | `[U]` | ❌ | ❌ | ❌ | ❌ |
| **Subscription / membership** | `[U]` | ✅ | ✅ | `[U]` | ❌ | ❌ | ❌ | ❌ | ❌ |
| Form / survey | via Typeform | ✅ | `[U]` | ✅ native | `[U]` | ❌ | `[U]` | ❌ | **Typeform embed** `[R]` |
| **Auto-linked social feed** | ✅ IG/TikTok | `[U]` | ❌ | ❌ | `[U]` | ❌ | ❌ | ❌ | ❌ |
| Messenger deep-link | `[U]` | `[U]` | ❌ | ✅ | `[U]` | ❌ | ✅ **core** | ❌ | ❌ |
| **QR code** | ✅ | ✅ | `[U]` | ✅ | ✅ | `[U]` | `[U]` | `[U]` | ✅ `[R:01§12]` |
| Link scheduling | ✅ Pro | `[U]` | `[U]` | `[U]` | ✅ | ❌ | ✅ | ❌ | `[U]` |
| **Multi-page navigation** | ❌ | `[U]` | ✅ funnels | ✅ **core** | ❌ | ✅ cards | ❌ | ❌ | ✅ mini-site `[R]` |

`[C1]` **Read the bottom four rows, not the top six.** Every vendor has buttons and images. The differentiating blocks are: auto-linked feed, native booking, subscriptions, multi-page. Those are the ones that require an actual data model behind them.

### 4.1 What "shoppable" should mean

`[R:10§12.2]` gives the definition, and it is worth reproducing because it is the specification:

> *"Most link-in-bio 'shops' are a list of links. The valuable version is:*
> 1. ***Auto-linked feed*** *— mirror the Instagram/TikTok feed; each post maps to the products tagged or manually assigned; tapping a post opens the products. (This is Later's original LinkinBio insight and it still converts.)*
> 2. *[catalogue-backed product blocks with live price/stock]*
> 3. *[cart permalinks with pre-applied discount codes]*
> 4. *[per-link attribution IDs end-to-end into the order]*
> 5. *[pixel hosting — the page visitor becomes an ad audience]*
> 6. ***Email/SMS capture*** *with sync to Klaviyo/Kit."*

`[C1]` **Items 1, 4 and 5 are the whole game and items 2, 3, 6 are table stakes.** Item 4 — attribution IDs surviving into the order record — is what nobody does, and §18 explains why it is both hard and the only version of "attribution" in this category that is not fiction.

---

## 5. Commerce, checkout and take rates

### 5.1 The take-rate map

| Vendor | Model | Platform take rate | Tag |
|---|---|---|---|
| **Stan Store** | Pure SaaS | **0%** (payment processing only) | `[K]` |
| **Taplink** | Pure SaaS | **0%** believed | `[K]` `[U]` |
| **Beacons** | SaaS + tiered fee | **~0–9% by tier** | `[R:10§12.1]` `[C3]` |
| **Linktree** | SaaS + fee on some tiers | *"takes a % on some tiers"* — exact figures **`[U]`** | `[R:10§12.1]` |
| **Pillar** | SaaS + fee on free | `[U]` | `[K]` |
| **Bio.link / Campsite** | `[U]` | `[U]` | — |
| **Buffer / Publer / Later / Vista / Pallyy / Milkshake / Komi / Shorby** | No commerce | **n/a — no money moves** | `[R]` for Buffer/Publer/Vista |

`[R:10§25.1]` documents the full monetisation ladder the category climbs:

| Stage | Mechanism | Rate |
|---|---|---|
| 1 | Free page, branded footer | — |
| 2 | Subscription (remove branding, custom domain, analytics) | $5–30/mo |
| 3 | **Commerce take rate** on digital products/tips/checkout | **0–9%** |
| 4 | Email/SMS list building → adjacent product | — |
| 5 | Affiliate/marketplace monetisation of outbound links | Rev-share |

### 5.2 Where the checkout actually lives

`[C1]` This is the distinction that the marketing pages obscure. Three architectures:

**(a) Hosted checkout on the vendor's domain.** Stan, Beacons, Taplink, Linktree Store. The vendor renders the payment form (usually Stripe Elements/Checkout under the hood), owns the order record, handles digital fulfilment and the receipt email. **This is real commerce.** The vendor is a merchant-of-record or a facilitator depending on jurisdiction, which brings tax obligations (VAT/GST on digital goods, US sales tax nexus) — **`[U]` which of these vendors act as merchant of record.** That question matters enormously to a creator selling into the EU and is essentially never answered on a pricing page.

**(b) Redirect to a third-party checkout.** A "product" block that sends the user to Gumroad/Shopify/Etsy. **This is a link.** The vendor cannot report revenue, cannot handle refunds, and — critically for §18 — **loses the attribution chain at the redirect.**

**(c) Embedded third-party form.** Vista Page's Typeform-with-payments `[R:10§12.1]`. Functionally (b) with better cosmetics. No order object.

### 5.3 Digital product delivery — the unglamorous differentiator

`[K]` The features that separate a real digital-product platform from a payment button, none of which appear on comparison charts:

| Capability | Why it matters |
|---|---|
| Secure, expiring download links | Otherwise the file URL is shared and the product is free |
| Download-count limits per order | Same |
| **Licence key generation** | Software/preset sellers require it |
| Re-delivery on request / customer portal | The #1 support ticket in digital sales |
| File versioning + notify past buyers | Turns a one-off into a relationship |
| **EU VAT / VATMOSS handling** | Legally required for EU digital sales. Getting this wrong is not a UX problem |
| Refund flow that revokes access | |
| PDF stamping / watermarking | Anti-piracy for ebooks |

`[U]` **Which vendors implement which of these is entirely unverified and is the single highest-value thing to check** if the goal is to build a competing product. My expectation `[C1]` is that Stan and Beacons cover the first four, and that the tax question is handled by nobody well.

---

## 6. Email capture

`[C1]` The category collapses three very different capabilities into one checkbox. Separate them:

| Level | Capability | Who has it | What it's worth |
|---|---|---|---|
| **L1 — Capture** | A form that stores an email address | Nearly everyone | Almost nothing on its own |
| **L2 — Own** | A durable contact record, exportable, deduplicated, with source/consent metadata and event history | Beacons, Stan, Taplink `[K]` | The actual asset |
| **L3 — Send** | Native broadcast + automation, with deliverability infrastructure | **Beacons, Stan** `[K]` | A second product |

**The ESP-sync question** is separate again and is where the bundled tools sit: Linktree syncs to Mailchimp/Kit/Zapier `[K]`; Buffer Start Page has *"email signup form"* `[R:20§11]` with no evidence of sending; Vista Page captures via Typeform embed `[R:01§12]`, meaning the contact lands in Typeform, **not in the SMM tool**.

`[R:10§12.2]` item 6 sets the requirement: *"Email/SMS capture with sync to Klaviyo/Kit."*

`[C1]` **The strategic point for an SMM product:** a captured email on the bio page is the *only* moment in the entire social stack where an anonymous social audience member becomes an identified contact. Everything upstream (impressions, engagement) is anonymous and platform-owned. Everything downstream (CRM, revenue) needs identity. **The bio page form is the identity join point for the whole product**, and `[R:12§25]` records that CRM/warehouse integration is *"the category's largest hole"*. Treating the form as a lead-gen checkbox rather than as the identity resolution surface is the mistake every vendor here makes.

`[R:00§3.14]` already has the capture in the build list but routes it through embeds; `[C1]` **it should be native, because an embedded Typeform means a third party owns your identity join.**

---

## 7. Custom domains and SEO

### 7.1 Custom domain support

| Vendor | Custom domain | Mechanism | Tag |
|---|---|---|---|
| **Linktree** | ✅ **Premium tier only** | CNAME + managed SSL `[K]` | `[K]` |
| **Beacons** | ✅ paid | `[U]` | `[K]` |
| **Stan Store** | `[U]` | `[U]` | — |
| **Taplink** | ✅ paid | `[K]` | `[K]` |
| **Campsite** | ✅ Pro | `[K]` | `[K]` |
| **Bio.link** | ✅ paid | `[K]` | `[K]` |
| **Milkshake** | `[U]` — believed ❌ | — | — |
| **Komi / Pillar / Shorby** | `[U]` | — | — |
| **Vista Page** | ✅ **with free SSL** | Proper CNAME + SSL | `[R:01§12]` |
| **Buffer Start Page** | ⚠️ **Domain forwarding / masked redirect only — not CNAME + managed SSL.** Reported to require a paid plan | Registrar-level forwarding | `[R:20§11]` `[C3]` |
| **Later / Publer / Pallyy** | `[U]` | — | — |

`[R:20§11]` on Buffer: *"The forwarding-only mechanic, if accurate, is materially worse than Linktree/Beacons."* `[R:20§17]` lists as an attack: *"real custom domains on link-in-bio not billed as a channel."*

`[C1]` **Masked forwarding is not a custom domain.** A masked redirect typically renders the target inside a frame at the registrar, which means: the browser URL never changes but the actual document is cross-origin, cookies do not behave as first-party, `https` on the visible domain does not cover the framed content, and **Google indexes nothing.** It is a cosmetic feature presented as an infrastructure feature.

### 7.2 Why these pages cannot rank — the mechanics

`[C1]` `[K]` for the mechanisms. Link-in-bio pages are close to the theoretical worst case for organic search:

1. **Shared-domain authority capture.** `linktr.ee/username` accrues all link equity to `linktr.ee`. The creator builds the vendor's domain authority, not their own. This is the same dynamic as a Medium blog and it is why serious operators leave.
2. **Thin, duplicated content.** A page of eight button labels has no indexable text. Ten million pages with the same template is a textbook thin-content pattern.
3. **Outbound links carry no equity.** Buttons are typically `rel="nofollow ugc"` or, worse, JS-triggered redirects through a tracking path — so the page passes nothing to the destination. **The bio page is an SEO dead end in both directions.**
4. **The redirect interstitial** (§18.2) means crawlers see a 302 chain to the real destination rather than a direct link.
5. **No control of the SEO surface.** `[U]` per-vendor, but my strong expectation `[C1]` is that almost none expose editable `<title>`, meta description, canonical tag, `robots.txt`, XML sitemap, or structured data. Without those, a custom domain buys brand cosmetics and nothing else.
6. **Client-side rendering.** Several of these pages are SPA-rendered `[U]`, which historically degrades indexing further.

### 7.3 The custom-domain paradox

`[C1]` **This is worth stating explicitly because it explains the pricing behaviour of the entire category.**

The custom domain is simultaneously:
- The **#1 requested paid feature** (it is the only thing that makes the page look professional), **and**
- The feature that **destroys the vendor's lock-in**, because a creator who owns `links.mybrand.com` can repoint the CNAME to a competitor in ten minutes and lose nothing — no printed material changes, no bio edit, no dead links.

Whereas a creator on `linktr.ee/name` who switches loses every printed QR code, every business card, every "link in bio" reference in every past caption, and any accumulated authority.

**Therefore gating custom domains to the top tier is not price-gouging. It is lock-in preservation.** `[C1]` Linktree charging ~$24/mo for a CNAME is rational: it is pricing the option to leave.

**The implication for a challenger:** giving custom domains away free is a *genuinely costly* competitive move, not a cheap one, and it should be done deliberately and loudly — precisely because incumbents cannot match it without cannibalising their own retention. `[R:20§17]` and `[R:00§10.1]` both already reach this conclusion from a different direction.

### 7.4 The unclaimed position

`[C1]` **Nobody in this category ships a link-in-bio that is actually a real, indexable website.** The requirements are unremarkable: server-side rendering, editable title/meta/OG per page, canonical tags, an XML sitemap, `schema.org` markup emitted per block type (`Product` on product blocks, `Event` on event blocks, `FAQPage`, `Person`, `BreadcrumbList`), clean semantic HTML, and Core Web Vitals discipline.

That is a week of work, and it converts "a page nobody can find" into "a landing page that ranks for the creator's name plus their product category." **Taplink and Vista Page are already 80% of the way there architecturally** (multi-page, custom domain, forms) and neither markets it.

The reason nobody does it `[C1]`: link-in-bio vendors think of themselves as *social* products, and SEO is not a social team's vocabulary. It is a genuine blind spot rather than a hard problem.

---

## 8. Pricing table

> **⚠️ Every figure here is `[K]` or `[C3]`-graded recall. Nothing was fetched. This table is a starting point for verification, not a source.**

| Vendor | Free tier | Entry paid | Mid | Top | Unit | Take rate | Confidence |
|---|---|---|---|---|---|---|---|
| **Linktree** | ✅ full basic page | ~$5/mo Starter | ~$9/mo Pro | ~$24/mo Premium | per account | % on some tiers `[U]` | `[R]` `[C3]` |
| **Beacons** | ✅ (with ~9% fee) | ~$10/mo Creator Pro | — | ~$30/mo Store Pro | per account | **0–9% by tier** | `[R]` `[C3]` |
| **Stan Store** | ❌ **none** | ~$29/mo Creator | — | ~$99/mo Creator Pro | per account | **0%** | `[R]` `[C3]` |
| **Taplink** | ✅ | ~$3–6/mo | — | `[U]` | per account | 0% believed | `[K]` |
| **Campsite** | ✅ | ~$7/mo Pro | `[U]` | `[U]` | per account | `[U]` | `[K]` |
| **Bio.link** | ✅ | ~$5/mo | — | `[U]` | per account | `[U]` | `[K]` |
| **Milkshake** | ✅ | ~$3–5/mo | — | — | per account | n/a | `[K]` |
| **Komi** | `[U]` | `[U]` ~$20–40 | `[U]` | `[U]` | `[U]` | n/a | `[U]` |
| **Pillar** | `[U]` | `[U]` ~$15–25 | `[U]` | `[U]` | per account | fee on free `[U]` | `[U]` |
| **Shorby** | ❌ trial `[U]` | `[U]` ~$15 | `[U]` ~$30 | `[U]` ~$100 agency | per account/seat | n/a | `[U]` |
| **Later Link in Bio** | — | Included in Later | — | — | bundled | n/a | `[R:04§8]` |
| **Buffer Start Page** | ✅ but **eats 1 of 3 free channels** | **Costs a paid channel slot** (~$5–6/mo Essentials) | — | — | **per channel** | n/a | `[R:20§3.4]` |
| **Publer Link in Bio** | ✅ free, **15-link cap** | Included | — | — | bundled | n/a | `[R:22§11]` |
| **Vista Page** | — | Included from tier 2 (`[R:01§27]` — not on entry plan) | — | — | bundled | n/a | `[R:01§27]` |

`[R:04§12]` on the PLG mechanics: *"**Linktree / Beacons** | Yes — the entire funnel | Full basic page | **Conversion trigger: analytics, custom domain, commerce**"*.

`[C1]` **The three conversion triggers are worth naming precisely because they are the whole business:** creators pay to *see numbers*, to *look professional*, and to *take money*. In that order of frequency, reverse order of value.

---

## 9. Criticism themes — link-in-bio

> **No verbatim user quotes are included. G2, Capterra, Trustpilot and Reddit were unreachable this session.** Sourcing real quotes is item 1 in §20. Below are themes I hold with `[K]` confidence from training data, plus the repo-verified ones.

| # | Theme | Vendors | Tag |
|---|---|---|---|
| 1 | **Repeated repricing and feature migration behind paywalls.** Features that were free move up a tier at renewal | Linktree (most cited) | `[K]` |
| 2 | **Custom domain gated to the most expensive tier** — perceived as the clearest gouge | Linktree | `[K]` + `[C1]` §7.3 explains why it happens |
| 3 | **Analytics are shallow relative to price** — views/clicks/CTR and little else; no cohorting, no funnel, no revenue join | Category-wide | `[K]` |
| 4 | **Transaction fees on the free tier are punitive at scale** — 9% is above every payment processor and most marketplaces | Beacons | `[C1]` from `[R:10§12.1]` fee range |
| 5 | **No free tier at all** is a hard barrier | Stan `[R:04§12]` | `[R]` |
| 6 | **Design constraints** — limited layout control, "everyone's page looks the same" | Stan (deliberate), Linktree | `[K]` |
| 7 | **Page performance and outages** — a bio link outage takes down a creator's only clickable URL, and it is highly visible | Linktree | `[K]` |
| 8 | **SEO invisibility** — creators discover their page ranks for nothing | Category-wide | `[C1]` §7.2 |
| 9 | **Billing a link-in-bio as a channel** | **Buffer** — *"widely read as a nickel-and-dime move given competitors give link-in-bio away free"* | `[R:20§3.5]` |
| 10 | **Forwarding-only custom domain** | **Buffer** — *"materially worse than Linktree/Beacons"* | `[R:20§11]` |
| 11 | **Hard link caps** | **Publer — 15 links** | `[R:22§11]` |
| 12 | **Cannot manage the page via API** | **Buffer — *"Cannot create or edit Start Page posts"*** via API | `[R:20§ API]` |

---

## 10. What the SMM tools ship

### 10.1 Buffer Start Page — the repo-verified case study

`[R:20§11]` in full detail:

| Property | Detail | Grade |
|---|---|---|
| Availability | Free on all plans **but consumes a channel slot** (1 of 3 on Free; a paid channel on Essentials/Team) | `C1` |
| Blocks | Text, images, video (YouTube), links, social links, **email signup form**, GIFs | `C2` |
| Themes | Themes, images, colours, fonts, layouts | `C2` |
| **Analytics** | Built-in: **total traffic** + **per-link clicks** — but **`CONTESTED`**: one Buffer support doc reportedly states *"analytics are not supported for Start Pages"* | `CONTESTED` |
| **Custom domain** | **Domain forwarding / masked redirect only** — not CNAME + managed SSL | `C3` — **weak** |
| UTM parameters | **Supported** on Start Pages | `C2` |
| Commerce | **No evidence of native product sales or payment collection** | `UNVERIFIED` |
| API | **Cannot create or edit Start Page posts via the API** | `C2` |

And the UTM hole from `[R:20§14.3]`, which is directly relevant to §18: **UTM is NOT supported on Mastodon, Instagram or Pinterest** — *"a real reporting hole on precisely the network (Instagram) where attribution matters most."*

`[C1]` **That last line deserves emphasis.** Buffer ships a link-in-bio *specifically for Instagram*, and cannot append UTMs to Instagram posts. The one network the entire product category exists to serve is the one where the attribution chain is broken at the first link.

### 10.2 The pattern across bundled implementations

| Tool | Links | Commerce | Custom domain | Analytics | API control |
|---|---|---|---|---|---|
| Buffer Start Page | Unlimited `[K]` | ❌ `[R]` | ⚠️ forwarding `[R]` | Basic, contested `[R]` | ❌ `[R]` |
| Publer Link in Bio | **15 max** `[R]` | ❌ | `[U]` `[R]` | `[U]` `[R]` | `[U]` |
| Later Link in Bio | Unlimited `[K]` | ❌ (links out) | `[U]` | Per-post clicks `[K]` | `[U]` |
| Vista Page | `[U]` count | ❌ native `[R]` | ✅ **CNAME + free SSL** `[R]` | Clicks + page stats `[R]` | ✅ via MCP `[R:01§25]` |
| Metricool SmartLinks | Unlimited `[K]` | ❌ | **`[U]`** `[R:21§12]` | **Clicks, status, CTR + full CSV export** `[R:21§12]` | ✅ API `[R]` |

### 10.3 The one bundled implementation doing something structurally novel

`[R:21§12]` on **Metricool SmartLinks** — and this is the most important paragraph in Part A for our purposes:

> *"**SmartLinks data is a Looker Studio data source** — combinable with social data in one dashboard."*
>
> *"**The strategic point:** SmartLinks flowing into Looker Studio means Metricool can show a client *post → click → destination* in one chart, using a link property Metricool controls. **Linktree cannot do that; Sprout does not have a link-in-bio at all.** It is a small feature doing disproportionate work in the reporting story."*

`[R:21§12]` also notes SmartLinks gained a **YouTube auto-feed** (connect a channel or playlist; videos populate automatically) shipped **April 2026**, and full **CSV export** from the analytics tab. Custom domain, A/B testing and pixel support are all marked **UNVERIFIED** in that file.

`[C1]` **Metricool has accidentally built the correct architecture and has not finished the thought.** It owns the post, the link and the click, and it pipes all three into the same BI surface. What it does not do is close the loop to revenue — because it has no commerce and no order object. **That is the gap.** Part C §18.6 specifies what closing it looks like.

---

# PART B — AGENCY REPORTING / BI

## 11. Four archetypes

`[C1]` The nine products in the brief are not competitors in a single market. They are four different products that happen to produce charts:

| Archetype | What it is | Members | Buyer | Unit of pricing |
|---|---|---|---|---|
| **1. Agency client-reporting suite** | Connectors + templated client reports + white-label + client logins. Purpose-built to produce *the monthly deliverable*. | **AgencyAnalytics**, **Swydo**, **DashThis**, **Whatagraph** | Agency owner / account manager | **Per client / per report / per dashboard** |
| **2. KPI dashboard / metric platform** | Always-on dashboards, goals, alerts, benchmarks. Less "deliverable", more "instrument panel". | **Databox**, **Klipfolio** | Marketing ops / in-house lead | **Per data source + per user** |
| **3. Connector vendor** | Sells *pipes*, not a canvas. The customer already chose the canvas. | **Porter Metrics**, (Supermetrics, Windsor.ai, Catchr, Dataslayer — **absent from the brief and materially important**) | Anyone using Looker Studio / Sheets / Power BI | **Per data source / per account** |
| **4. General BI** | Full BI. No native social connectors at all. | **Looker Studio**, **Power BI** | Data team | **Free canvas / per user / per capacity** |

`[C1]` **The brief's list conflates these, and that conflation is exactly why the "why do agencies pay twice" question looks confusing.** An agency does not buy AgencyAnalytics *instead of* Looker Studio; many buy AgencyAnalytics for 20 small clients and build Looker Studio dashboards for the 3 big ones. And an agency using Looker Studio is, necessarily, also paying a connector vendor — so "Looker Studio is free" is never true in practice.

### 11.1 The missing name

`[C1]` **Supermetrics is absent from the brief's list and is arguably the most important vendor in it.** It is the de facto standard for getting marketing platform data into Looker Studio, Sheets, Excel, Power BI, **and into BigQuery/Snowflake/Azure as a destination**. Any analysis of "which reporting tools expose a warehouse path" that omits Supermetrics is incomplete, because for a large share of agencies **Supermetrics *is* the warehouse path**. Same for Funnel.io, Windsor.ai, Fivetran, Adverity and Improvado one tier up. `[R:21§ integrations]` corroborates the pattern from the other side: Metricool's third-party ETL routes are *"Windsor.ai and Portable (→ BigQuery)"*.

---

## 12. Vendor dossiers — reporting

> **All pricing `[K]`/`[U]`. Reporting vendors repackage aggressively; AgencyAnalytics, Databox and Whatagraph have each restructured tiers at least once since 2023 `[K]`. Verify everything.**

### 12.1 AgencyAnalytics

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Toronto, Canada | `[K]` |
| **Pricing unit** | **Per campaign** — a campaign ≈ a client | `[K]` |
| Recalled tiers | Historically Freelancer ~**$59/mo / 5 campaigns**; Agency ~**$179/mo / 10 campaigns**; then ~**$18–25 per additional campaign**; Enterprise custom. Restructured to Launch / Grow / Perform naming around 2024–25 | `[K]` — **`[U]` on current names and figures** |
| Connectors | **80+** claimed | `[K]` `[U]` |
| **Built-in SEO tools** | **Rank tracker, site audit, backlink monitor** — not connectors, first-party tools | `[K]` |
| White-label | Custom domain (CNAME), own logo, custom colours, **branded email sending**, remove all vendor branding | `[K]` |
| **Client logins** | **Unlimited users/client logins on most tiers** | `[K]` — high strategic importance, verify |
| Scheduled delivery | Automated PDF/email, daily/weekly/monthly/custom | `[K]` |
| Goals | ✅ target + progress tracking | `[K]` |
| **Warehouse export** | **❌ None.** API exists but limited; CSV | `[K]` `[U]` |

`[C1]` **AgencyAnalytics is an SEO-agency product that grew social connectors, not a social product.** The built-in rank tracker and site audit are the lock-in: they are *first-party data the agency cannot get from a connector*, so the tool is not just a viewer, it is a source. **No social media tool can ever match this**, and it is a large part of the answer to §16.

### 12.2 Whatagraph

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Lithuania | `[K]` |
| **Pricing unit** | **Per data source** + seats; moved substantially to sales-led custom quoting | `[K]` |
| Recalled pricing | ~**$223/mo** Professional (annual) for ~25 data sources historically; higher tiers custom | `[K]` `[U]` |
| Connectors | **55+** | `[K]` `[U]` |
| **Cross-channel blending** | ✅ A core selling point — unify sources into one dataset | `[K]` |
| **Warehouse destination** | ✅ **BigQuery transfer believed shipped** — Whatagraph positions partly as an ETL/"data transfer" product | `[K]` — **highest-value item to verify in Part B** |
| Custom API connector | ✅ for unsupported sources | `[K]` |
| White-label | Custom domain, branded reports | `[K]` |
| **Client logins** | Weaker than AgencyAnalytics historically | `[K]` `[U]` |

`[C1]` If the BigQuery destination is real and current, **Whatagraph is the only pure agency-reporting product in the brief's list that is also a pipeline**, which changes its competitive position entirely — it stops being a reporting silo and becomes an ETL vendor with a report generator attached. That is a much better business. Verify first.

### 12.3 Databox

| Attribute | Detail | Tag |
|---|---|---|
| Positioning | KPI dashboards / metric platform. Heavily used by agencies but not agency-first | `[K]` |
| Pricing unit | **Per data source + users** | `[K]` |
| Recalled tiers | Free (3 data sources, 3 users); then roughly ~$47 / ~$135 / ~$319 / ~$799 per month. **Restructured more than once** | `[K]` `[U]` |
| Connectors | **100+** | `[K]` `[U]` |
| **Warehouse as a SOURCE** | ✅ **BigQuery, PostgreSQL, MySQL, (Snowflake `[U]`)**, Google Sheets, plus a **Push API** for custom metrics | `[K]` |
| **Warehouse as a DESTINATION** | ❌ | `[K]` |
| **Benchmarks** | ✅ **Anonymous peer benchmarking against other Databox users** — genuinely distinctive | `[K]` |
| Goals + alerts | ✅ | `[K]` |
| Delivery | Email + **Slack**, TV/loop dashboards, mobile app | `[K]` |
| White-label | Higher tiers; custom domain on top tiers | `[K]` `[U]` |

`[C1]` **The direction of the warehouse arrow is the whole point.** Databox reads *from* your warehouse to render KPIs. It does not write social data *into* your warehouse. Those are opposite products serving opposite buyers, and vendors are happy to let the distinction blur in a feature list. §17 is built on exactly this distinction.

**Databox Benchmarks** `[C1]` is the only feature in the whole of Part B that produces information the customer could not obtain any other way. Everything else in this category is a nicer rendering of data the customer already owns. Benchmarks are a **network-effect data product** — they get better with more users and cannot be copied by a new entrant on day one. `[R:00§ note on benchmarks]` and `[R:blueprint-c]` reach the same conclusion for social benchmarks (with k-anonymity ≥20–30 and opt-out).

### 12.4 Swydo

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Netherlands | `[K]` |
| Pricing unit | **Per report/dashboard bundle**, entry ~**$49/mo** | `[K]` `[U]` |
| Strengths | Google Ads / GA4 / Meta depth; **budget tracking**; goals; KPI-first | `[K]` |
| Connectors | Fewer than AgencyAnalytics/Whatagraph | `[K]` `[U]` |
| White-label | ✅ incl. custom domain | `[K]` |
| Warehouse | ❌ | `[K]` |

### 12.5 DashThis

| Attribute | Detail | Tag |
|---|---|---|
| Origin | Quebec, Canada | `[K]` |
| **Pricing unit** | **Per dashboard** — the cleanest unit in the category | `[K]` |
| Recalled tiers | Individual 3 dashboards ~$42/mo; Professional 10 ~$134; Business 25 ~$319; Standard 50 ~$589; Enterprise 100 ~$1,109 | `[K]` — **`[U]`, recalled with low confidence, likely stale** |
| Connectors | **34+** native, plus **CSV / Google Sheets manual import** | `[K]` `[U]` |
| Philosophy | Preset templates, fast setup, deliberately simple. Not a blending engine | `[K]` |
| White-label | ✅ custom domain, logo, colours | `[K]` |
| Warehouse | ❌ | `[K]` |

`[C1]` The CSV/Sheets import is more strategically important than it looks: it is how an agency gets *offline* data (call volumes, CRM closes, media spend from a platform with no connector) into the client report. **Every reporting tool needs a manual-input escape hatch, and the ones that lack it lose deals for a reason that never appears on a feature comparison.**

### 12.6 Porter Metrics

| Attribute | Detail | Tag |
|---|---|---|
| Model | **Connector vendor** for Looker Studio, Google Sheets, Power BI | `[K]` |
| Pricing | Cheap — recalled ~**$16–20/mo** per bundle, priced by connected accounts/data sources | `[K]` `[U]` |
| Coverage | Meta Ads, Facebook Pages, Instagram, TikTok (organic + ads), LinkedIn, X, Google Ads, GA4, GSC, Shopify, Klaviyo, Mailchimp, Stripe | `[K]` `[U]` |
| Warehouse destination | `[U]` — believed added BigQuery | `[U]` |

`[C1]` Porter's existence is the proof of the unbundling: **agencies would rather pay $19/mo for pipes and use a free canvas than pay $179/mo for pipes-plus-canvas.** The counter-argument, and the reason AgencyAnalytics still wins, is that Looker Studio does not do client logins, white-label domains, or scheduled branded PDFs well — so the $19 path costs the agency labour instead of money. **That trade — money vs. labour — is the entire competitive dynamic in Part B.**

### 12.7 Looker Studio + social connectors

| Attribute | Detail | Tag |
|---|---|---|
| Cost | **Free** canvas. **Looker Studio Pro ~$9/user/month** for team workspaces, SLA, support | `[K]` |
| First-party connectors | Google properties only — **GA4, Google Ads, Search Console, BigQuery, Sheets, YouTube** | `[K]` |
| **No first-party Meta / TikTok / LinkedIn / X connectors** | Hence the entire paid partner-connector ecosystem | `[K]` |
| Partner connectors | Supermetrics, Porter, Windsor.ai, Catchr, Power My Analytics, Dataslayer, **Metricool (first-party, free with Advanced)** | `[K]` + `[R:21§7.5]` |
| Warehouse path | **BigQuery is a native connector** — this is the real BI path | `[K]` |
| Known weaknesses | Blend limits and performance on large joins; row limits; quota/extract behaviour; **connectors break when platform APIs change** | `[K]` |

`[R:21§7.5]` documents Metricool's first-party connector as *"the feature agencies name when asked why they picked Metricool"*, covering **14 channels / 25+ data sources**, including three ad platforms and brand-pattern auto-grouping, **and SmartLinks click data** `[R:21§12]`. It is gated to **Advanced** tier — `[R:21§4]`: *"Looker Studio + API + approvals + team management all sit at Advanced. That is the 'agency wall,' and it is why Advanced is the plan everyone in this segment actually buys."*

`[C1]` **That gating decision is the single most instructive commercial fact in Part B.** Metricool discovered that a free BI connector is worth more as a *tier gate* than as a *feature*, because it converts an SMB customer into an agency customer. `[R:21§ comparison]`: *"BI export — First-party Looker Studio connector, **included at Advanced ($53–210/mo)** — Sprout/Hootsuite push you to CSV, or to premium analytics tiers, or to a third-party ETL."*

### 12.8 Power BI

| Attribute | Detail | Tag |
|---|---|---|
| Pricing | **Pro ~$14/user/mo**, **Premium Per User ~$24/user/mo** (increased from $10/$20, believed effective April 2025); Fabric capacity F-SKUs for embedding | `[K]` — **`[U]` on current figures** |
| Social connectors | **Effectively none first-party.** Path is Supermetrics / Windsor / Fivetran / Funnel / custom API | `[K]` |
| Warehouse | ✅ **Full citizen** — Fabric, OneLake, Direct Lake, Synapse, any SQL source | `[K]` |
| White-label | ✅ via **Power BI Embedded** — full white-label, but requires capacity purchase and developer work | `[K]` |

`[C1]` Power BI is not in the agency-reporting market. It appears in these comparisons because agencies with a data-mature client (or an in-house team) are told to use it, discover there is no Meta connector, and buy Supermetrics. **Its presence in the brief's list is best understood as evidence that "reporting" is not one market.**

### 12.9 Klipfolio

| Attribute | Detail | Tag |
|---|---|---|
| Two products | **Klips** (legacy, formula-driven dashboards) and **PowerMetrics** (metric-layer product) | `[K]` |
| **PowerMetrics** | A **metric store** — define a metric once with its dimensions, reuse everywhere. Genuinely differentiated architecture | `[K]` |
| Pricing | Free tier; then recalled ~$90–300/mo | `[K]` `[U]` |
| Data sources | Strongest custom-source story: **REST API, SQL, Sheets**, plus warehouse connections | `[K]` |
| White-label | Higher tiers | `[K]` `[U]` |
| Criticism | Steep learning curve; dated UI in Klips; formula language is a barrier | `[K]` |

`[C1]` **PowerMetrics' metric-layer concept is the correct architecture and the wrong go-to-market.** A semantic layer where "engagement rate" is defined once, versioned, and consumed identically by every dashboard is precisely what `[R:12§17]` calls a *conformed metric layer*, and `[R:12§25.2]` records that **nobody in SMM ships one**. Klipfolio built it for generic BI and sells it to people who wanted a dashboard.

---

## 13. White-label depth

`[C1]` "White label" means at least six separable things, and vendors deliberately let the weakest count as the whole:

| Level | Capability | Why it matters |
|---|---|---|
| **W1** | Your logo on a PDF | Cosmetic. Every vendor has it. Worth nothing |
| **W2** | Your colours/fonts in the dashboard UI | Cosmetic |
| **W3** | **Custom domain (CNAME + managed SSL)** on the live client dashboard | The client's browser never sees the vendor. **This is where white-label starts** |
| **W4** | **Emails sent from your domain** (custom SMTP / verified sending domain) | The monthly report email is the most-seen artefact. A `@vendor.com` sender breaks the illusion completely |
| **W5** | **Client login accounts that never reveal the vendor** — no vendor branding, no vendor help links, no vendor support chat | The client uses "your platform" |
| **W6** | **Reseller economics** — you set the client's price, you bill them, vendor bills you | Turns the tool into a revenue line rather than a cost line |

| Vendor | W1 | W2 | W3 domain | W4 email | W5 client login | W6 reseller |
|---|---|---|---|---|---|---|
| **AgencyAnalytics** | ✅ | ✅ | ✅ | ✅ | ✅ **unlimited** `[K]` | `[U]` |
| **Whatagraph** | ✅ | ✅ | ✅ | `[U]` | ⚠️ weaker `[K]` | `[U]` |
| **Databox** | ✅ | ✅ | ✅ top tiers `[U]` | `[U]` | ✅ | ❌ |
| **Swydo** | ✅ | ✅ | ✅ | ✅ `[U]` | ✅ `[U]` | `[U]` |
| **DashThis** | ✅ | ✅ | ✅ | `[U]` | ✅ `[U]` | `[U]` |
| **Porter Metrics** | n/a — inherits Looker Studio | | ❌ | ❌ | ❌ | ❌ |
| **Looker Studio** | ⚠️ report header only | ⚠️ theme | ❌ **no custom domain** | ❌ | ⚠️ Google account required | ❌ |
| **Power BI** | ✅ via Embedded | ✅ | ✅ via Embedded | via your app | ✅ via Embedded | ✅ if you build it |
| **Klipfolio** | ✅ | ✅ | ✅ higher tiers `[U]` | `[U]` | ✅ | `[U]` |

`[C1]` **Two rows decide deals and both are Looker Studio's weakness:**

1. **W3 — Looker Studio cannot be served from your domain.** A client dashboard is a `lookerstudio.google.com` URL. For an agency whose entire pitch is "we are your marketing department", that is a daily reminder that a $19/mo tool is doing the work.
2. **W5 — Looker Studio requires the client to have a Google account** and shows Google chrome around the report.

**That is the whole reason AgencyAnalytics can charge 10× Porter for overlapping data.** It is not selling connectors. It is selling *the absence of another vendor's name in front of the client*.

`[R:12§32]` corroborates the economics from the SMM side: *"**Agency reseller / white-label** — Agency rebrands the tool for clients — the **highest-LTV channel in the category**. Requires: custom domain, logo replacement, branded reports, client-user roles that never see your brand, and per-brand billing."*

And `[R:21§4]`: *"**White Label is Custom-only.** There is no self-serve white label at any published price."* — `[C1]` which is Metricool leaving money on the table and a direct, nameable opening.

---

## 14. Per-client pricing economics

| Vendor | Unit | Marginal cost of client #11 | Marginal cost of adding a 4th channel to an existing client |
|---|---|---|---|
| **AgencyAnalytics** | **Per campaign (client)** | ~$18–25/mo `[K]` | **$0** |
| **DashThis** | **Per dashboard** | ~$12–13/mo `[K]` | **$0** |
| **Swydo** | Per report | `[U]` | **$0** `[U]` |
| **Whatagraph** | **Per data source** | 4–8 sources = 4–8 units | **+1 unit** |
| **Databox** | **Per data source + user** | same | **+1 unit** |
| **Porter / Supermetrics** | Per data source/account | same | **+1 unit** |
| **Power BI** | Per user | $0 (clients don't need seats if you export) | $0 |
| **Looker Studio** | Free canvas | $0 canvas + connector cost | +connector cost |

`[C1]` **This table is the most commercially useful thing in Part B.**

An agency's revenue scales with **clients**. Its data volume scales with **client × channels**. So:

- **Per-client pricing (AgencyAnalytics, DashThis, Swydo) is aligned.** A client is worth $2,000/mo; paying $20 is 1% of revenue and the agency never thinks about it again. Adding channels to a client — which is *upsell*, i.e. more revenue — costs nothing.
- **Per-data-source pricing (Whatagraph, Databox, Supermetrics, Porter) is anti-aligned.** The agency is taxed precisely when it does more work for a client. A client on 8 channels costs 8× a client on 1, while paying maybe 1.5× the retainer.

**This is why per-source pricing generates the loudest complaints in this category** `[C1]`, and why `[R:04§3]` reaches the parallel conclusion about SMM tools: *"the pricing model is a strategic weapon, not an implementation detail."* `[R:12§30.2]` names the SMM version of the same failure: *"**Double-dimension compounding.** Agency with 12 staff / 200 profiles pays $25–40k/yr."*

`[C1]` **Design rule that falls out of this: price per client/brand/workspace, never per data source, and never per reviewer seat.** `[R:00§Top-10 #1]`: *"**The seat tax.** Executives, legal, PR and clients who need read/approve access are priced out."* `[R:blueprint-c L5]`: *"Reviewer/approver seats must be free or near-free or the approvals engine dies on procurement."*

---

## 15. Criticism themes — reporting

> **Again: no verbatim quotes. Unreachable this session. `[K]` themes from training data plus repo-verified items.**

| # | Theme | Vendors | Tag |
|---|---|---|---|
| 1 | **Connector breakage.** Platform API changes silently break a connector; the client report goes out with a zero in it. **The highest-severity failure in this category** — it destroys agency credibility, not just data | All connector-based vendors | `[K]` + `[C1]` |
| 2 | **Numbers don't match the platform's own UI.** Different attribution windows, timezone boundaries, metric definitions, or de-duplication. The agency has to explain a discrepancy it does not understand | All | `[K]` + `[R:12§17]` |
| 3 | **Per-data-source pricing escalates unpredictably** | Whatagraph, Databox, Supermetrics | `[K]` §14 |
| 4 | **Report builder is fiddly** — layout wrestling, widget-level configuration, no reusable component library | AgencyAnalytics, Databox | `[K]` |
| 5 | **Limited calculated/custom metrics.** Cannot express "blended CAC" across sources without an escape hatch | Most agency suites | `[K]` |
| 6 | **Sales-led motion / opaque pricing** | Whatagraph | `[K]` |
| 7 | **Learning curve** | Klipfolio (formula language), Power BI (DAX) | `[K]` |
| 8 | **Looker Studio performance** on blends and large date ranges | Looker Studio | `[K]` |
| 9 | **No warehouse export — data is trapped** | AgencyAnalytics, Swydo, DashThis | `[C1]` §17 |
| 10 | **"Analytics disappointment"** — the general form, repo-verified: *"the most common upgrade driver **and** the most common disappointment — customers get prettier versions of numbers the platform already gave them free"* | Category-wide | `[R:00§Top-10 #5]` |

`[C1]` **Theme 10 is the one that matters and it applies to Part A and Part B equally.** Prettier rendering of free numbers is not a product. `[R:00§Top-10 #5]` prescribes the fix: *"New **kind** of answer: provenance, comparability classes, benchmarks, causal experiments, warehouse export."*

---

# PART C — THE THREE KEY QUESTIONS

## 16. Q1: The delta

> **"What do agencies pay a SEPARATE reporting tool for, when their social tool already reports? That delta is a product opportunity."**

`[C1]` The delta decomposes into nine items. They are not equally important, and — this is the critical finding — **only some of them are addressable by a social tool.**

| # | What they're buying | Why the social tool can't provide it | Addressable by us? |
|---|---|---|---|
| **1** | **The other 80% of the report.** SEO rankings, site audit, Google Ads, GA4, Search Console, email, call tracking, CRM pipeline, revenue, invoicing | The client retainer covers all marketing. **Social is one channel of eight.** No social tool will ever ship a rank tracker and a CallRail connector | ❌ **Structural. Do not try** |
| **2** | **One artefact, per client, per month, unattended.** N clients × 1 report, generated and emailed with no human | Social tools do this for social only, so the agency still assembles by hand — and once you're assembling, you may as well assemble everything in one tool | ❌ same root cause as #1 |
| **3** | **White-label depth W3–W6** (§13): custom domain, own sending domain, client logins with zero vendor branding, reseller billing | Most social tools stop at W1–W2. `[R:21§4]`: Metricool's *"White Label is Custom-only"* | ✅ **Yes — and cheaply** |
| **4** | **Client logins as a sellable deliverable.** "Your live dashboard" is part of the retainer; unlimited free client seats are required | Social tools charge per seat. `[R:00§Top-10 #1]` the seat tax | ✅ **Yes** |
| **5** | **Cross-channel blending + calculated metrics.** Blended CAC, cost per lead across all paid, revenue per session | Requires data the social tool does not have (#1) | ⚠️ **Partially** — only for social+web+commerce |
| **6** | **Goal tracking against the contract.** "38 of 50 leads this month" | Social tools track follower growth, not contractual KPIs | ✅ **Yes — trivially, and nobody does** |
| **7** | **A neutral, durable data layer.** Agencies churn social tools; 3 years of client history must not die with the swap | The social tool *is* the thing being churned. It has a conflict of interest | ✅ **Yes — and it's the differentiator** (§17) |
| **8** | **The report as renewal collateral.** Narrative, annotations, executive summary, "here's what we did and what it produced" | Social tools produce metric dumps, not arguments | ✅ **Yes — underrated** |
| **9** | **Consolidation economics.** One tool at $179/mo across 10 clients beats upgrading eight point tools to their reporting tier | | ✅ indirectly |

### 16.1 The honest conclusion

`[C1]` **Items 1 and 2 are 60–70% of the purchase decision and they are permanently out of reach.** An agency reporting tool wins because it reports on *everything*, and a social media tool that tried to become a general marketing-reporting product would be entering a crowded market against vendors with 80–100 connectors and an SEO toolchain, while diluting its actual product.

**Therefore: do not build agency reporting. That is the wrong lesson to draw from the delta.**

### 16.2 The right lesson — three moves

`[C1]` The delta says agencies will always have a second reporting tool. The strategic response is not to replace it. It is:

**Move 1 — Be the best possible *source* into whatever they already use.**
This is the Metricool play and the repo says it works. `[R:21§ headline]`: *"It ships a first-party Looker Studio connector, free with the Advanced plan… **This is the single feature agencies cite most.** Nobody else at this price gives you a governed BI feed."* `[R:21§7.5]`: *"This is the feature agencies name when asked why they picked Metricool."*

The sharpening `[C1]`: **every reporting vendor charges the agency per data source.** If our connector is free, complete, stable, and available in Looker Studio + Power BI + Sheets marketplaces, we become the default social source *and* we save the agency the $19–50/mo they pay Porter or Supermetrics for social. That is a real, quantifiable, sayable saving. **And Metricool gates its connector to Advanced — a nameable, attackable decision.**

**Move 2 — Win items 3, 4, 6, 7 and 8 outright**, because they are cheap and the social tools have simply not bothered:
- W3–W6 white-label self-serve, at a published price, not "contact sales".
- Unlimited free client-reviewer seats. `[R:blueprint-c L5]` makes this a hard requirement.
- **Goals as contract objects** — a target, a period, a progress state, on the report. Genuinely a week of work.
- Narrative/annotation layer — let the agency write the "what we did" next to the chart, and let annotations be data (a metric-definition change, a platform outage, a campaign launch) so the chart explains its own anomalies.

**Move 3 — Own the thing no reporting tool can do: provenance and comparability.**
`[R:00§2.3]`: *"The five rows where the entire market is empty — **metric provenance**, authenticated read-back reconciliation, **warehouse-native export**, MCP write-safety, and shadow mode."*

`[C1]` Criticism theme #2 in §15 — "the numbers don't match" — is the agency's most humiliating recurring moment, and **every reporting tool makes it worse**, because a connector strips a metric of its context and renders it as a number in a box. A social tool that ships *"this is `impressions` from IG Graph API v23, a period metric, not comparable to the `views` figure before 2025-04-11, when Meta renamed it"* answers a question no reporting vendor can, because only the tool at the API boundary has that information.

### 16.3 What the delta is *not*

`[C1]` It is worth naming the wrong answer explicitly, because it is the intuitive one: **the delta is not "better charts".** Nobody buys AgencyAnalytics because its bar charts are nicer. `[R:00§Top-10 #5]` again: prettier versions of free numbers is the disappointment, not the product.

---

## 17. Q2: The warehouse path

> **"Which reporting tools expose a warehouse/BI path, and does any social tool do this natively?"**

### 17.1 Reporting tools — the map

`[C1]` The critical distinction, which vendors blur: **is the warehouse a SOURCE (the tool reads from it) or a DESTINATION (the tool writes social data into it)?** Only the second is a "warehouse path" in the sense that matters — the customer owning their data in their own store.

| Tool | Warehouse as SOURCE | Warehouse as DESTINATION | BI canvas path | Verdict |
|---|---|---|---|---|
| **Whatagraph** | `[U]` | ✅ **BigQuery transfer believed shipped** `[K]` | own canvas | **The only agency suite with a real destination — VERIFY FIRST** |
| **Databox** | ✅ BigQuery, Postgres, MySQL, (Snowflake `[U]`) + **Push API** in | ❌ | own canvas | Reads from warehouse. **Not a path out** |
| **Klipfolio PowerMetrics** | ✅ SQL + warehouse sources | ❌ `[U]` | own canvas | Source only; but a real **metric layer** |
| **Porter Metrics** | ❌ | `[U]` — believed BigQuery added | ✅ **Looker Studio / Power BI / Sheets** | Connector vendor. Path is the canvas |
| **Looker Studio** | ✅ **BigQuery native** | ❌ (it queries, it doesn't store) | **is** the canvas | BigQuery is the path, but you must fill BigQuery yourself |
| **Power BI** | ✅ **Full — Fabric/OneLake/Direct Lake/any SQL** | via Fabric | **is** the canvas | Full warehouse citizen. **No social connectors** |
| **AgencyAnalytics** | ❌ | ❌ (API + CSV only `[U]`) | ❌ | **Closed silo** |
| **Swydo** | ❌ | ❌ | ❌ | **Closed silo** |
| **DashThis** | ❌ (CSV/Sheets import) | ❌ | ❌ | **Closed silo** |
| *(Supermetrics — absent from brief)* | — | ✅ **BigQuery / Snowflake / Azure** | ✅ all canvases | **This is what agencies actually use as the warehouse path** |

**Answer to the first half:** `[C1]` **Only Whatagraph among the named agency-reporting suites plausibly writes to a warehouse (verify), and the real warehouse path for the market is a connector/ETL vendor — Supermetrics, Funnel.io, Windsor.ai, Fivetran — not a reporting suite at all.** The three purest agency suites (AgencyAnalytics, Swydo, DashThis) are deliberately closed, because their business model *is* the silo: the accumulated client reporting history is the switching cost.

### 17.2 Social tools — the answer is repo-verified and it is "no"

`[R:12§25.2]` answers the second half of the question directly, and this is the highest-confidence finding in this document:

> **"Does any SMM tool ship a real warehouse-native model? `[C1]` No. Not one."**

The evidence assembled there:

- `[F]` The most complete warehouse-native social model that exists publicly is **`fivetran/dbt_social_media_reporting`** — **24 stars, updated Aug 2026**. It unifies **Facebook Pages, Instagram Business, LinkedIn Company Pages, Twitter Organic, YouTube Analytics** into **one** final model, `social_media_reporting__rollup_report`, implemented as a dynamic union of per-source staging models.
- Per-source packages: `dbt_facebook_pages` (4 stars), `dbt_instagram_business` (3), `dbt_linkedin_pages` (3), `dbt_twitter_organic` (4), `dbt_youtube_analytics` (4).
- Versus **`fivetran/dbt_ad_reporting` at 218 stars** — the *paid* equivalent covering Facebook, Google, Pinterest, LinkedIn, Twitter, Snapchat, Microsoft, TikTok, Reddit, Amazon and Apple Search Ads.

> `[R:12§25.2]` **"Read the star-count ratio carefully: 218 vs 24. The warehouse world has built serious, well-adopted models for **paid** social and essentially nothing for **organic** social. That asymmetry is the opportunity. The organic-social data model is unclaimed territory."**

**What "real warehouse-native" would mean, and who ships it** `[R:12§25.2]` verbatim:

| Capability | Who ships it in SMM |
|---|---|
| A published, versioned, documented **dbt package** for organic social with a proper semantic layer | **Nobody** (Fivetran's is a thin 5-metric union, and it is an ETL vendor's package, not an SMM vendor's) |
| **Snowflake Native App** delivering the model and compute inside the customer's account | **Nobody** |
| **BigQuery Analytics Hub** listing / **Databricks Delta Sharing** share | **Nobody** |
| **Bring-your-own-bucket / Iceberg tables** the customer owns | **Nobody** |
| A **conformed metric layer** exposed as SQL views with documented comparability classes | **Nobody** |
| Row-level export of *mentions and enrichments*, not just aggregate CSVs | **Nobody** (listening vendors export aggregates and PDFs) |
| **Reverse ETL** from the customer's warehouse into social audiences/publishing | **Nobody** |

The closest anyone comes `[R:12§25.2]`: **Sprout's Analytics API on Advanced tier and above**; Sprinklr's data export; Meltwater's Data Upload API (which goes the *other* way — documents in, not social data out).

> `[R:12§25.2]` **"This is the largest single product gap identified in this document. The buyer exists (any company with a data team — which by 2026 is most mid-market and all enterprise), the demand is proven by the 218-star ad-reporting package, the technical work is bounded, and the incumbents are structurally disinclined to do it because a warehouse-native model commoditises their dashboard."**

### 17.3 The nuance: Metricool is close, and is not there

`[C1]` Metricool's Looker Studio connector `[R:21§7.5]` — 14 channels, 25+ data sources, first-party, free at Advanced, and it carries **SmartLinks click data** `[R:21§12]` — is the best BI story in the SMM category by a distance. But it is a **BI canvas feed, not a warehouse destination**. The customer cannot join it to their CRM in their own store, cannot retain it past their subscription, and cannot query it with SQL. `[R:21§ integrations]` confirms the warehouse route is third-party: *"third-party ETL paths exist via Windsor.ai and Portable (→ BigQuery)"*.

**So the precise answer to Q2 is:**

1. **Among reporting tools:** Power BI and Looker Studio *are* BI (but have no social connectors); Databox and Klipfolio read *from* warehouses; Whatagraph is the only agency suite that plausibly writes *to* one (**unverified — verify first**); AgencyAnalytics/Swydo/DashThis are closed by design; and the actual market path is Supermetrics/Funnel/Windsor/Fivetran.
2. **Among social tools:** **none, natively.** Metricool is closest and is a canvas feed. Sprout has an Analytics API gated to Advanced+.

### 17.4 The strategic trap, already resolved in the repo

`[C1]` The obvious objection: giving customers their raw data destroys the switching cost. `[R:00§Risk R8]` states it and resolves it:

> *"**Warehouse-native export surrenders the strongest switching cost in the category** … Resolved deliberately: **give away the raw data, keep the derived intelligence.** The benchmark panel, models, alerting and workflow do not export."*

And `[R:12§ switching costs]` explains why the objection has force in the first place: *"**Historical analytics beyond platform retention** — Very high [switching cost]. After 18 months, the tool holds data that literally does not exist elsewhere. **And most incumbents will not export it**, which is precisely why it holds."*

`[C1]` **That sentence is the whole competitive opening.** The incumbents' retention depends on hoarding data the customer generated. That is a position that feels strong and is actually brittle, because it is indefensible the moment a competitor says so out loud. **"Your data, in your warehouse, in an open format, from day one"** is a marketing claim, a procurement unblocker, and a moral high ground simultaneously — and the incumbents cannot match it without dismantling their own retention.

`[R:blueprint-c §10.7]` and `[R:00§11.4]` already have this on the roadmap: *"**warehouse-native export** (Iceberg + dbt package + row-level export); ClickHouse behind it."*

---

## 18. Q3: Attribution

> **"What does link-in-bio attribution actually measure, and where does it break (iOS, in-app browsers, dark social)?"**

`[C1]` This section is mechanism, not product research. It is the part of this document least damaged by the lack of web access, and — I would argue — the most useful.

### 18.1 What is actually measured

Three events, and only three:

| Event | How measured | Reliability |
|---|---|---|
| **Page view** | Server-side request log, or a JS beacon on load | Inflated by bots and unfurlers (§18.5). Vendors do not publish filtering rules |
| **Link click** | Redirect interstitial, or a JS click beacon | See §18.2 — the choice of mechanism changes the number materially |
| **Referrer** | `Referer` header, or a query param | **Mostly absent or useless in this context** (§18.3) |

Everything else in a link-in-bio analytics screen is derived from these: CTR = clicks/views; "top links" = clicks grouped; "traffic sources" = referrer grouped; geo/device = IP + UA.

`[R:20§11]` on Buffer Start Page: *"Built-in: **total traffic** + **per-link clicks**"* — and the analytics existence is `CONTESTED`.
`[R:01§12]` on Vista Page: *"Click tracking, page statistics"*.
`[R:21§12]` on Metricool SmartLinks: *"**Clicks, status, CTR** per link"* + full CSV export.

`[C1]` **Note what is absent from every one of those lists: any measurement of what happened after the click.** The entire category measures up to the moment of departure and then stops. That is the finding.

### 18.2 Mechanism 1 — how the click is counted, and why it matters

Two implementations, with different failure modes:

**(a) Redirect interstitial.** The button's `href` points at the vendor (`https://vendor.co/r/abc123`), which logs the click and issues a 301/302 to the destination.
- ✅ Most reliable click count — a server request either happened or it didn't.
- ❌ Adds a network round trip (perceptible on mobile).
- ❌ **Breaks or rewrites the referrer chain** — the destination sees the *vendor's* domain as referrer, not Instagram. So the merchant's GA shows `vendor.co / referral`, which is true and useless.
- ❌ Redirect domains accumulate reputation problems and get blocked by corporate filters, some DNS blocklists, and occasionally by the platforms themselves.

**(b) JS click beacon.** The `href` is the real destination; a `navigator.sendBeacon()` / `fetch(keepalive:true)` fires on click.
- ✅ No latency, referrer preserved.
- ❌ **Unreliable on unload**, historically worst in iOS Safari and in webviews — the page is torn down before the beacon flushes. **Undercounts.**
- ❌ Blocked by content blockers and by any user with JS restrictions.

`[C1]` **This means "clicks" is not a comparable number across vendors**, and none of them disclose which mechanism they use or what their loss rate is. A vendor comparison showing "Linktree says 1,200 clicks, our tool says 1,050" is very likely measuring two different things. **`[U]` per-vendor mechanism — worth determining empirically by inspecting a live page's DOM, which is a five-minute job with web access.**

### 18.3 Failure mode 1 — the in-app browser (the biggest, and specific to this category)

`[C1]` `[K]` This is the failure mode that defines link-in-bio and it is systematically under-discussed.

**Instagram, TikTok, Facebook, X and LinkedIn open links in an embedded webview, not in Safari or Chrome.** Consequences, in order of severity:

1. **The referrer is usually absent.** IG's webview commonly presents no `Referer`, or one that resolves to nothing useful. **The destination sees "direct".** *This is the precise reason link-in-bio pages exist commercially* — the creator cannot otherwise prove Instagram sent the traffic — **and the exact reason the proof is weak.**
2. **Cookie jars are partitioned per app.** A cookie set inside the Instagram webview is not the Safari cookie. So:
   - A visitor who arrives via IG, then later via TikTok, then later via Safari is **three "users"**.
   - Any "returning visitor" metric on a link-in-bio page is close to meaningless.
3. **"Open in Safari" resets everything.** When the user taps the ⋯ → Open in Browser (a very common behaviour for checkout, because people don't trust in-app payment forms), the session ID, any cookie, and any in-memory state are lost. **The purchase happens in a different browser from the click.** No client-side mechanism can join them.
4. **First-party for you is third-party for the merchant.** A cookie set by `links.creator.com` is third-party from `shop.creator.com`'s perspective unless they share a registrable domain. Most creators' bio domain and store domain differ.
5. **Meta's webview injects its own JavaScript** into loaded pages `[K]`. Meta can observe your page; you cannot observe Meta. The observability is one-directional.
6. **Webview quirks break things silently** — some webviews restrict `sendBeacon` on unload, some strip or mangle query parameters in specific flows `[U]` on exact current behaviour, and payment SDKs behave differently (which is why Stan's "optimised for in-app browsers" positioning is a real engineering claim, not just marketing).

`[C1]` **Summary: inside an in-app browser, a "unique visitor" is an app-session, not a person, and the referrer — the one field that would prove the traffic's origin — is the field most likely to be missing.**

### 18.4 Failure mode 2 — iOS, ITP, ATT

`[K]` for mechanisms, high confidence:

| Mechanism | Effect on link-in-bio attribution |
|---|---|
| **ITP 7-day cap on client-side cookies** | A `document.cookie` identifier expires in 7 days. A click today cannot be joined to a purchase in 10 days |
| **ITP 24-hour cap** when the landing page is reached via a cross-site navigation with **link decoration** | **A bio link with `?utm_*` or a click ID *is* link decoration.** So the very act of instrumenting the link can collapse the identifier lifetime to 24 hours. **This is a genuine catch-22 and almost nobody in this category knows about it** |
| **Safari 17+ Link Tracking Protection** (Private Browsing, Mail, Messages) | **Strips known tracking parameters** from URLs — `fbclid`, `gclid` and similar. UTMs believed not stripped today, but **`[U]` on the current parameter list**, and the list grows |
| **ATT** | Doesn't touch web clicks directly, but destroys the Meta pixel's user matching — so "did the bio click convert" becomes unanswerable *inside Ads Manager*, which is where the client looks |
| **iCloud Private Relay** | IP masked → geo degrades to a coarse region, and any IP-based session stitching dies |
| **Third-party cookie deprecation generally** | Any cross-domain join that isn't server-side is on borrowed time |

`[C1]` **The ITP link-decoration rule deserves restating because it is counter-intuitive: adding UTMs to your bio-page outbound links can make the destination's own analytics *worse*, by triggering the 24-hour cookie cap on the landing page.** The correct response is server-side identity (§18.6), not more parameters.

### 18.5 Failure mode 3 — bots, unfurlers and the unaudited "views" number

`[C1]` Every time a bio link is posted anywhere — a Slack message, a Discord server, a WhatsApp chat, a tweet, an email, a Google crawl — an automated fetcher requests the page to build a preview card. Slackbot, Twitterbot, WhatsApp, Telegram, Discord, LinkedInBot, facebookexternalhit, Googlebot, and every SEO crawler.

Consequences:
- **Views inflate** — sometimes dramatically for a link shared in a large Slack/Discord.
- **Clicks do not** (bots don't click).
- **Therefore CTR deflates**, and the creator concludes their page is converting badly when actually their link got unfurled 400 times.
- Preview fetchers frequently have no JS, so a **JS-beacon** view counter under-counts humans while a **server-side** counter over-counts bots. The two architectures produce systematically different numbers in opposite directions.

**No vendor in this category publishes its bot-filtering methodology.** `[U]` for all of them.

`[C1]` **This is a genuinely unclaimed honesty position:** show `views (filtered)` and `views (raw)` side by side, publish the filter list, and let the user see the delta. It costs nothing, it is immediately credible, and it makes every competitor's single unlabelled number look evasive. It is the link-in-bio instance of the metric-provenance thesis in `[R:00§2.3]`.

### 18.6 Failure mode 4 — the join to revenue, and where the real product is

`[C1]` This is the crux. There are exactly two ways a link-in-bio can attribute revenue:

**(A) The bio tool IS the checkout.** Stan, Beacons, Taplink, Linktree Store. The click and the order are in the same database, so attribution is **exact** — the only exact attribution in this entire document.
> **But:** it only covers products sold *on the bio tool*. For any creator with a real Shopify store, a course on Kajabi, or a brand-deal business, that is a minority of revenue, sometimes a rounding error. **The tools with perfect attribution have it over the smallest slice.**

**(B) A click ID survives into the merchant's order record.** The bio tool mints `?bid=<opaque>` on outbound links; the merchant's site captures it, persists it (server-side, first-party, not a JS cookie), and attaches it to the order; a webhook or app returns the order back to the bio tool.
> This requires the merchant to install something. **Essentially nobody does this**, which is why link-in-bio revenue attribution is, in practice, fiction.

`[R:10§12.2]` item 4 specifies exactly this: *"per-link attribution IDs end-to-end into the order"*. `[R:10§13]` calls checkout attribution *"the hardest problem in this file"*. `[R:00§3.14]` has the shortener and click tracking as **P0**.

**The honest one-line summary of Q3:**

> `[C1]` **Link-in-bio attribution is exact for conversions that happen on the page, and approximately fictional for conversions that happen anywhere else. Every vendor reports the second kind with the same confidence as the first.**

### 18.7 Failure mode 5 — dark social, and the irony

`[C1]` A link-in-bio URL is short, memorable and designed to be shared. So it gets copied into WhatsApp groups, DMs, Slack channels, email signatures, podcast show notes and printed packaging.

All of that traffic arrives with **no referrer** and is bucketed as "direct". And here is the irony: **the link-in-bio page is itself a dark-social generator.** It was created to solve the problem of Instagram not passing a referrer, and it succeeds only for the hop from Instagram to the page — while creating a brand-new untracked hop from the page to everywhere else the URL travels.

`[R:12§24]` already prescribes the only workable countermeasure, which is not technical:

> *"ship an **HDYHAU** [How Did You Hear About Us] capture widget and an LLM classifier that maps free-text answers onto your channel taxonomy, then show it as a panel *next to* click attribution with both numbers visible. **The gap between them is the dark-social estimate, and showing that gap is more honest and more useful than any single model.**"*

`[C1]` A one-question post-purchase survey outperforms every client-side tracking mechanism described above, and it is the only method that survives ITP, ATT, in-app browsers and copy-paste sharing simultaneously. **No link-in-bio vendor ships one.**

### 18.8 What a correct implementation looks like

`[C1]` Synthesising all of the above, with `[R:10§12.2]`, `[R:10§25.2]` and `[R:12§23]`:

| # | Component | Why |
|---|---|---|
| 1 | **First-party domain for the page** (CNAME + managed SSL), ideally sharing a registrable domain with the store | Only way cookies are first-party at both ends |
| 2 | **Server-side click log** with a redirect interstitial, **plus** a client beacon; reconcile and publish the delta | Neither mechanism alone is trustworthy (§18.2) |
| 3 | **Opaque click ID** minted per click, carried as a param, **and set as a server-side first-party cookie on the destination** where a merchant integration exists | Survives ITP better than a JS cookie |
| 4 | **Merchant-side capture** — a Shopify app / WooCommerce plugin / JS snippet that persists the click ID into the order as a note attribute or metafield, returned by webhook | This is the join. Nothing else is |
| 5 | **Server-side conversion forwarding** to Meta CAPI / TikTok Events API with the click ID and hashed identifiers | `[R:12§23]` covers the endpoints. Restores the ad-platform view |
| 6 | **Pixel hosting on the page** so the visitor becomes a retargetable audience | `[R:10§12.2]` item 5. Shorby's insight, done properly |
| 7 | **Bot filtering, published** — raw vs filtered views, with the filter list documented | §18.5 |
| 8 | **HDYHAU widget** + classifier, shown next to click attribution with the gap named | `[R:12§24]` |
| 9 | **Post → link → click → order in one object model**, exported to the BI/warehouse layer | This is the Metricool SmartLinks idea `[R:21§12]` finished |

`[C1]` **Item 9 is the product.** `[R:10§12.2]`: *"the link-in-bio page is the only surface in this entire file where we own the pixel, the domain and the click."* `[R:21§12]`: *"Metricool can show a client **post → click → destination** in one chart, using a link property Metricool controls. Linktree cannot do that; Sprout does not have a link-in-bio at all."*

**Extend that chain by one node — to `order` — and you have the only closed loop in the category.** Linktree cannot build it (no scheduler, no analytics relationship with the creator's accounts). Sprout cannot build it (no link-in-bio). Metricool has 80% of it and no commerce. **An SMM tool with a link-in-bio, a shortener, a scheduler and a Shopify integration is the only shape of company that can.**

---

# PART D

## 19. Product implications

`[C1]` Ordered by (value ÷ effort). Items already in the repo roadmap are cross-referenced rather than re-argued.

### 19.1 Link-in-bio — build list

| P | Item | Rationale |
|---|---|---|
| **P0** | **Free forever, own short domain, real CNAME + auto-SSL custom domains, not billed as a channel** | `[R:00§10.1]`, `[R:20§17 #5]`. Directly attacks Buffer's most-resented decision (§10.1) and Linktree's top-tier gate. Understand §7.3: this genuinely costs you lock-in — do it anyway, loudly |
| **P0** | **Native shortener + per-link click tracking, unified into main analytics** | `[R:00§3.14]` |
| **P0** | **Importers: Linktree, Beacons, Stan, Milkshake, Komi** | `[R:10§12.3]`: *"the cheapest growth mechanism in this category"*. `[R:01§12]` confirms Vista already ships a Linktree importer in beta |
| **P0** | **Trust & safety from day one** — signup abuse controls, notice-and-action, content scanning, sanctions geo-block, tenant-branded pages under tenant domains | `[R:00§R11]`, `[R:11§6.1]`. **Non-negotiable. A public page surface is a DSA decision** |
| **P1** | **Order object** — catalogue, hosted checkout, digital delivery (expiring links, download caps, licence keys, re-delivery), refunds, **at 0% take rate** | The §2 test. `[R:10§25.1]`: 0% is a weapon available to a tool that already has the card |
| **P1** | **Native email capture → contact record → ESP sync** (Klaviyo/Kit/Mailchimp), not a Typeform embed | §6. The identity join point of the entire product |
| **P1** | **Auto-linked feed** (post → products/links), incl. YouTube-style auto-population | `[R:10§12.2]` item 1; Metricool shipped YouTube auto-feed Apr 2026 `[R:21§12]` |
| **P1** | **Pixel hosting** (Meta/TikTok/Google) on the page | `[R:10§ G17]` |
| **P1** | **Attribution chain: click ID → merchant capture → order → CAPI** | §18.8. **The differentiator** |
| **P2** | **Real SEO**: SSR, editable title/meta/OG/canonical, sitemap, per-block schema.org | §7.4. Unclaimed, cheap, and nobody in the category thinks in these terms |
| **P2** | **Media kit** auto-generated from connected account analytics | §3.2. Near-free for an SMM tool, expensive for Linktree |
| **P2** | **A/B testing of page layouts** | `[R:10§25.2]` item 7: *"nobody in link-in-bio does this well"* |
| **P2** | **Bot-filtered vs raw views, with published methodology** | §18.5 |
| **P3** | **HDYHAU widget + classifier** | `[R:12§24]` |

### 19.2 Reporting — build list

| P | Item | Rationale |
|---|---|---|
| **P0** | **First-party BI connector — Looker Studio, Power BI, Google Sheets — FREE, not gated to the top tier** | §16.2 Move 1. Metricool proved demand `[R:21§7.5]` and gates it at Advanced `[R:21§4]` — that gate is the attack surface |
| **P0** | **Self-serve white-label at W3–W6 with a published price** | §13. `[R:21§4]`: *"White Label is Custom-only"* is a nameable, attackable gap |
| **P0** | **Unlimited free client/reviewer seats** | `[R:00§Top-10 #1]`, `[R:blueprint-c L5]` |
| **P0** | **Price per client/brand/workspace, never per data source** | §14 |
| **P1** | **Warehouse-native export**: Iceberg/BYO-bucket, a published versioned **dbt package** for organic social, row-level export | `[R:12§25.2]` — *"the largest single product gap"*; `[R:00§R8]` resolves the lock-in objection: **give away the raw data, keep the derived intelligence** |
| **P1** | **Goals as contract objects** — target, period, progress, on the report | §16 item 6. A week of work, nobody does it |
| **P1** | **Metric provenance layer** — API field, version, snapshot-vs-timeseries, comparability class, change annotations | `[R:00§2.3]`; answers §15 theme #2, the agency's most humiliating recurring moment |
| **P2** | **Narrative + annotation layer** on reports, with annotations as data (outages, metric renames, campaign launches) | §16 item 8 |
| **P2** | **Benchmarks with k-anonymity ≥20–30 and opt-out** | Databox Benchmarks is the only genuinely novel thing in Part B (§12.3); `[R:00§11.4]` already has it |
| **P3** | **Reverse ETL**: warehouse query → content brief / suppression list / audience | `[R:12§25.3]` — four named use cases nobody has built |

### 19.3 The two sentences

`[C1]`

> **Part A:** Do not build a better link list. Build the only closed loop in the category — **post → link → click → order** — on a page you host, on a domain the customer owns, at a 0% take rate, and give it away free because it is the product's only viral surface.

> **Part B:** Do not build agency reporting; 60–70% of that purchase is channels you will never have. Instead be the **best, free, most stable social source into the reporting tool they already own**, ship the **warehouse export nobody ships**, and win the four cheap items (white-label depth, free client seats, goals, provenance) the social vendors have simply not bothered with.

---

## 20. UNVERIFIED register

Ordered by decision-impact. **Everything here needs a live fetch.** Items 1–8 are blocking for any roadmap commitment.

| # | Question | Why it matters | §|
|---|---|---|---|
| **1** | **Whatagraph's BigQuery/warehouse destination — real, current, which tiers?** | Determines whether *any* agency suite is a pipeline. Changes §17's answer | §12.2, §17.1 |
| **2** | **Linktree's exact commerce take rate by tier** | The 0%-as-a-weapon argument is sized against this number | §3.1, §5.1 |
| **3** | **Beacons' exact fee ladder** (is it really 9% → 0%?) | The fee-buy-down mechanic is the recommended pricing model | §3.2, §5.1 |
| **4** | **AgencyAnalytics current tier names, prices, per-campaign marginal cost, client-login limits** | The per-client pricing benchmark in §14 | §12.1 |
| **5** | **Which link-in-bio vendors act as merchant of record; EU VAT handling** | Legal/tax exposure for any commerce build; never stated on pricing pages | §5.2, §5.3 |
| **6** | **Digital-delivery feature depth per vendor** (expiring links, download caps, licence keys, re-delivery, versioning) | The real gap between a store and a payment button | §5.3 |
| **7** | **Metricool Looker Studio connector — still Advanced-gated? SmartLinks custom domain / A/B / pixel?** | Marked UNVERIFIED in `[R:21§12]`; determines how attackable the gate is | §10.3, §12.7 |
| **8** | **Whether any link-in-bio vendor exposes editable SEO surfaces** (title, meta, canonical, sitemap, schema) | Sizes the §7.4 opportunity. My expectation is "none", unverified | §7.4 |
| 9 | Per-vendor click-counting mechanism (redirect vs beacon) — inspect live DOM | Determines comparability of every published click number | §18.2 |
| 10 | Stan Store: custom domain support; current pricing; the $30M ARR claim | | §3.3 |
| 11 | Shorby, Komi, Pillar: **all pricing** | Three of twelve vendors have essentially no verified pricing | §3.5, §3.6 |
| 12 | Bio.link / Campsite: commerce capability (T2 vs T3 classification) | | §2, §3.6 |
| 13 | Databox / DashThis / Swydo / Klipfolio / Porter / Power BI: **current prices** | All `[K]` recall; Power BI's $14/$24 believed post-Apr-2025 | §12 |
| 14 | Porter Metrics: BigQuery destination? | Would move it from connector to pipeline | §12.6 |
| 15 | Connector counts: AgencyAnalytics 80+, Whatagraph 55+, Databox 100+, DashThis 34+ | All recalled, all likely stale | §12 |
| 16 | Safari Link Tracking Protection's **current stripped-parameter list** | Determines whether UTMs are still safe | §18.4 |
| 17 | Later Link in Bio: custom domain, analytics depth, Mavely affiliate integration | `[R:10§ table]` notes Later acquired Mavely; the attribution implication is unexplored | §3.6 |
| 18 | **Real user quotes** from G2 / Capterra / Trustpilot / Reddit / X for both categories | The task explicitly required these. **None obtained.** §9 and §15 are themes only | §9, §15 |
| 19 | Shopify Linkpop's actual status | `[R:10§12.1]` says *"believed wound down"* `[C3]` | §3.6 |
| 20 | Whether Linktree acquired anything post-Koji | Signals where it thinks the business is | §3.1 |

### 20.1 Staleness flags

`[C1]` Things in this document most likely already stale at August 2026:

- **All link-in-bio pricing.** This category reprices roughly annually; the recalled Linktree ladder (Free/$5/$9/$24) has been repackaged at least twice historically.
- **AgencyAnalytics and Databox tier structures** — both restructured since the figures I recall.
- **Power BI $14/$24** — believed effective April 2025; may have moved again.
- **Connector counts** — these only go up and are marketing figures anyway.
- **DashThis's per-dashboard price ladder** — recalled with low confidence and probably the single most likely table in this file to be wrong.
- `[R:21§ note]` records Metricool consolidated reporting under a new **"Reporting" section in May 2026** and shipped **SmartLinks YouTube auto-feed in April 2026** — that vendor is moving fast in exactly this area and anything about it older than a quarter should be re-checked.

---

## 21. Sources

### 21.1 Live sources fetched this session

**None.** See the provenance warning. Attempted and blocked at the gateway (`403 CONNECT`): `linktr.ee`, `beacons.ai`, `agencyanalytics.com`, `www.databox.com`, `buffer.com`, `porterhq.com`, `help.metricool.com`, `www.g2.com`, `en.wikipedia.org`, `www.reddit.com`. WebSearch unavailable (budget 200/200 exhausted before task start).

### 21.2 Repo sources — prior research files produced with live web access

| Tag | File | Sections used |
|---|---|---|
| `[R:01]` | `/home/user/SMM/research/01-vista-social-full-audit.md` | §12 Vista Page; §25 MCP; §27 plan matrix; §11 attribution |
| `[R:04]` | `/home/user/SMM/research/04-competitors-smb.md` | §8 link-in-bio dossiers; §3 pricing taxonomy; §12 free tiers/PLG |
| `[R:10]` | `/home/user/SMM/research/10-commerce-creator-influencer.md` | §12 shoppable link-in-bio; §13 checkout attribution; §25 link-in-bio economics; §26 take rates; §38 gap tiers |
| `[R:11]` | `/home/user/SMM/research/11-compliance-security-global.md` | §6.1 DSA online-platform classification (via `[R:00]`/`[R:blueprint-c]`) |
| `[R:12]` | `/home/user/SMM/research/12-analytics-listening-gtm.md` | **§25.2 the warehouse answer**; §25.3 reverse ETL; §24 dark social/HDYHAU; §23 CAPI; §17 metric layer; §28/§30/§32 segment + GTM economics |
| `[R:20]` | `/home/user/SMM/research/20-buffer-teardown.md` | **§11 Start Page**; §3.4/3.5 channel billing; §14.3 UTM coverage; §17/§20 attack list |
| `[R:21]` | `/home/user/SMM/research/21-metricool-teardown.md` | **§7.5 Looker Studio connector**; **§12 SmartLinks**; §4 tier gates; §5 reporting consolidation |
| `[R:22]` | `/home/user/SMM/research/22-publer-teardown.md` | §11 Link in Bio; §18 plans |
| `[R:00]` | `/home/user/SMM/research/00-MASTER-STRATEGY.md` | §2.3 empty rows; §3.14 build list; §4.2 D22; §9.4 segments; §10.1 Day-0 distribution; §11 phases; Risk register R8/R11 |
| `[R:blueprint-c]` | `/home/user/SMM/research/blueprint-c.md` | L4/L5 constraints; §10.7 warehouse access |

`[R:21§ headline]` also carries one external third-party citation relevant here: an independent comparison putting a 3-user/10-brand setup at **$153/mo on Metricool vs $1,197/mo on Hootsuite Advanced** — `https://tareno.co/compare/metricool-vs-sprout-social` **[3P]**.

### 21.3 Model-recall claims

Everything tagged `[K]` derives from training data with a cutoff of approximately May 2026 and was **not** verified in this session. §20 lists what to check.

---

*End of file 25. Written 12 August 2026 without network access; see the provenance warning at the top before citing any figure.*
