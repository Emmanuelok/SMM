# 10 — Social Commerce, Creator Economy, Influencer Marketing, UGC, Advocacy & Paid Amplification

**Prepared:** 12 August 2026
**Scope:** The four adjacent categories a social media management (SMM) product must absorb to be a revenue system rather than a scheduler — (1) social commerce and catalog/checkout plumbing, (2) influencer/creator relationship management, (3) UGC rights and galleries, (4) employee advocacy — plus the connective tissue: creator payouts, whitelisting/allowlisting, affiliate attribution, and paid amplification via the ad APIs.
**Purpose:** The "100x" argument. What each adjacent category actually is at the feature and API level, who owns it today, what it costs, what is structurally impossible, and which seams nobody has stitched.
**Companion docs:** `01-vista-social-full-audit.md` §6.10 (Vista's boosting), §12 (Vista Page link-in-bio), §21 (advocacy), §22.1 (IG product tagging: 5/media, 20/carousel); `03-competitors-enterprise.md` §2.7, §3.1–3.2 (Sprout Tagger ≈ $21,431/yr ACV), §4 (Hootsuite Parliament/Amplify); `06-platform-apis-tier1.md` (Meta/TikTok/Pinterest/YouTube organic APIs); `07-platform-apis-tier2.md` (messaging channels); `11-compliance-security-global.md` (privacy/archiving); `12-analytics-listening-gtm.md` (attribution modelling).

---

> ## ⛔ PROVENANCE WARNING — READ BEFORE USING ANY NUMBER IN THIS FILE
>
> **This document contains ZERO fetched sources.** No vendor pricing page, developer portal,
> changelog or API reference was retrieved while writing it.
>
> | Blocker | Detail |
> |---|---|
> | **WebSearch** | Session budget **exhausted before this agent started** — 200/200 calls consumed by earlier agents in the pipeline. Four searches were attempted and all four were refused. **Zero searches available.** |
> | **WebFetch** | Egress proxy returns `EGRESS_BLOCKED` for **every host attempted**: `partner.tiktokshop.com`, `developers.facebook.com`, `developers.pinterest.com`, `www.grin.co`. A control fetch of `en.wikipedia.org` was **also blocked**, confirming a blanket egress denial rather than a per-domain policy. Per `/root/.ccr/README.md` this is an organization egress policy and must be reported, not routed around. |
>
> Everything below is **model recall with a May 2026 knowledge cutoff**, written against an
> August 2026 "today" — a **minimum 3-month blind spot**. This category is worse than most
> for drift: TikTok Shop ships API version bumps roughly quarterly, Meta deprecates a commerce
> surface roughly annually, and the influencer-platform vendor list has had **at least eight
> acquisitions in four years**.
>
> ### Confidence tags
>
> | Tag | Meaning | Drift risk |
> |---|---|---|
> | **`C1`** | Structural: which categories exist, what an API family is *for*, what is categorically absent (e.g. "no API can comment on a third party's Instagram post"). Stable 2–4 years. | Low — safe to architect against. |
> | **`C2`** | Specific but drift-prone: endpoint paths, scope strings, field names, per-post tag limits, token TTLs. | Medium — verify before load-bearing. |
> | **`C3`** | Known-volatile or fuzzy recall: **all vendor pricing**, all rate-limit numbers, all seat minimums, market availability, anything with a future-dated deprecation. | High — **hypothesis, never fact**. |
> | **`UNVERIFIED`** | Genuinely unknown. Not a guess. Do not cite. | — |
>
> **Asymmetry to respect:** the *strategic* content of this file (which seams are unstitched,
> what is structurally impossible, what the build order should be) is largely `C1` and carries
> real weight. The *commercial* content (every dollar figure, every seat count) is `C3` and
> exists only to give order-of-magnitude shape to a business case. **Do not put a single price
> from this file into a pitch deck without re-verifying it.** §38 is a re-verification worklist
> ordered by how much damage a wrong value does.

---

## Table of contents

**Part I — The thesis**
1. Why a scheduler is a commodity and what the 100x actually is
2. The revenue loop: the single diagram this whole file serves
3. Category sizing and the absorb/partner/ignore call

**Part II — Social commerce**
4. TikTok Shop
5. Meta commerce: Instagram product tagging, Facebook Shops, catalogs
6. YouTube Shopping
7. Pinterest catalogs and product Pins
8. WhatsApp catalogs and commerce messaging
9. The rest: Snap, X, LinkedIn, Reddit commerce posture
10. E-commerce platform integrations (Shopify, Woo, BigCommerce, Etsy, Amazon, others)
11. Live shopping platforms
12. Shoppable link-in-bio
13. Checkout attribution — the hardest problem in this file

**Part III — Influencer and creator platforms**
14. Landscape and ownership map
15. Capability teardown, module by module
16. Platform-native creator marketplaces (TTCM, Meta, YouTube, Amazon)
17. Whitelisting / allowlisting mechanics
18. Creator payments and global payouts
19. Influencer platform pricing intelligence
20. Build / buy / partner call

**Part IV — UGC**
21. Rights management and the consent evidence chain
22. UGC galleries and on-site shoppable galleries
23. Creator UGC marketplaces (Billo, Insense, Trend and peers)
24. Reviews and ratings adjacency

**Part V — Creator monetization tooling**
25. Link-in-bio economics
26. Digital products, memberships, take rates
27. Newsletter and owned-audience integration

**Part VI — Employee advocacy and brand ambassadors**
28. Vendor landscape
29. Feature anatomy: curation, gamification, EMV
30. Compliance for regulated industries
31. Ambassador and customer-advocacy programs
32. Advocacy pricing intelligence

**Part VII — Paid social**
33. Boosting from an SMM tool: what is actually permitted
34. Ad API teardown, network by network
35. Organic→paid amplification rules engine
36. Creative testing
37. Unified organic + paid reporting

**Part VIII — Synthesis**
38. Gap list: what nobody does well
39. Build order and effort estimates
40. Data model sketch
41. Cost model
42. Legal and regulatory surface
43. Risk register
44. Re-verification worklist

---
---

# PART I — THE THESIS

## 1. Why a scheduler is a commodity and what the 100x actually is

### 1.1 The commoditization argument

Scheduling is now a solved, near-zero-marginal-cost problem, and the evidence is in the
prior files in this corpus:

- A single developer can wire Meta + TikTok + LinkedIn + Pinterest + YouTube publishing in
  weeks (`05-competitors-dev-oss.md`), and there are open-source and API-first vendors
  (Ayrshare, Postiz, Mixpost) selling the primitive for tens of dollars a month.
- Vista Social ships **nine modules** for $39–$149/mo (`01-vista-social-full-audit.md` §4),
  which means "breadth of scheduling-adjacent features" is already priced at commodity levels.
- The differentiating enterprise features in `03-competitors-enterprise.md` are almost never
  publishing features. They are listening, care/case management, compliance archiving,
  advocacy, and **influencer marketing** — with Sprout's Tagger-derived influencer module at
  a **≈$21,431/yr average contract, sold entirely separately from the base plan** `[C3, from file 03]`.

The scheduler is the *login surface*. It is where the customer already is every morning. It is
not where the money is.

### 1.2 What "100x" has to mean

100x cannot mean "100 more features". It has to mean a **category change in the unit of value**:

| | Scheduler | Revenue system |
|---|---|---|
| Object of work | A post | A campaign that produces attributable revenue |
| Success metric | Posts published, engagement rate | GMV, CAC, contribution margin, EMV |
| Buyer | Social media manager | Head of Growth / CMO / e-commerce director |
| Budget line | Tools budget ($50–$500/mo) | Marketing program budget (creator fees, ad spend, product seeding) |
| Displacement | Buffer, Later | Sprout Tagger + GRIN + Bazaarvoice + a link-in-bio + a spreadsheet + Tipalti |
| Willingness to pay | Anchored to Buffer | Anchored to **a percentage of program spend** |

The strategic point: a customer running a $40k/month creator program plus $60k/month in paid
social does not care whether a tool costs $99 or $999. They care whether it tells them which
creator drove which order. **The adjacent categories are not feature expansion; they are a
buyer change and a budget-line change.** `[C1 — inference, but the pricing data in files 03/04 supports it]`

### 1.3 The four categories and why they are one product, not four

They look like four markets. They are one graph:

- A **creator** is a person who makes content. So is an **employee advocate**. So is a
  **customer who posted a UGC photo**. So is a **brand ambassador**. All four are the same
  entity type with different consent scopes, compensation models and disclosure requirements.
- A **UGC asset** and a **creator deliverable** and an **employee-shared post** are the same
  entity: a piece of media with a rights grant attached, an expiry, and a publishing history.
- **Product tagging**, **affiliate links**, **discount codes** and **ad click IDs** are all the
  same thing: attribution carriers attached to a piece of content.
- **Boosting an organic post**, **running a Spark Ad on a creator's video** and **running a
  Partnership Ad on an ambassador's Reel** are the same operation with different permission
  handshakes.

Every incumbent has built these as separate products with separate data models, separate
price tags and separate logins, because they *acquired* them rather than built them (§14.2).
That is the structural opening. **One contact graph, one rights model, one attribution
ledger, one publishing pipeline** is a thing no incumbent can retrofit cheaply. `[C1 — inference]`

---

## 2. The revenue loop

This is the single mental model the rest of the file serves:

```
                    ┌──────────────────────────────────────────────┐
                    │              CONTACT GRAPH                   │
                    │  creators · employees · customers · fans     │
                    │  one identity, many consent scopes           │
                    └───────────────┬──────────────────────────────┘
                                    │ recruit / discover / seed
                                    ▼
   ┌────────────┐        ┌──────────────────┐        ┌──────────────────┐
   │  CATALOG   │───────▶│     CONTENT      │◀───────│   RIGHTS GRANT   │
   │ SKUs·price │ tag    │ brand·creator·   │ license│ scope · territory│
   │ ·stock     │        │ employee·UGC     │        │ · expiry · proof │
   └─────┬──────┘        └────────┬─────────┘        └──────────────────┘
         │                        │ publish (organic)
         │                        ▼
         │              ┌──────────────────┐
         │              │   DISTRIBUTION   │  9 networks + link-in-bio
         │              └────────┬─────────┘
         │                       │ performance signal
         │                       ▼
         │              ┌──────────────────┐
         │              │  AMPLIFICATION   │  boost · Spark Ads ·
         │              │   RULES ENGINE   │  Partnership Ads · Thought Leader Ads
         │              └────────┬─────────┘
         │                       │
         ▼                       ▼
   ┌──────────────────────────────────────────────┐
   │           ATTRIBUTION LEDGER                 │
   │ UTM · click ID · promo code · affiliate link │
   │ · CAPI/server events · order webhook         │
   └───────────────┬──────────────────────────────┘
                   │ revenue, margin, EMV
                   ▼
   ┌──────────────────────────────────────────────┐
   │   PAYOUT + REPORTING  (creator fees, comms,  │
   │   1099/DAC7, ad spend, blended ROAS)         │
   └──────────────────────────────────────────────┘
```

Every section below is a component of this loop. The loop is the product. `[C1 — inference]`

### 2.1 Where each incumbent breaks the loop

| Vendor | Has | Breaks the loop at |
|---|---|---|
| Buffer / Publer / Metricool | Distribution | No catalog, no creators, no rights, no attribution beyond UTM |
| Vista Social | Distribution + link-in-bio + boosting + advocacy | **No commerce integration at all** (`01` §22.1: "Shopify: NOT FOUND"), no creator module, no rights model, no payouts |
| Later | Distribution + link-in-bio + Later Influence + **Mavely** affiliate network | Two products, two data models; Mavely is a network not a ledger `[C3]` |
| Sprout Social | Distribution + Tagger influencer + advocacy | Three separately-priced products; Tagger is not wired to the composer `[C3]` |
| Hootsuite | Distribution + Parliament advocacy | No creator module of its own, no commerce `[C3]` |
| Emplifi | Distribution + Pixlee UGC + live shopping + "Fuel" commerce | Enterprise-only pricing; assembled from acquisitions `[C3]` |
| GRIN / Aspire / CreatorIQ | Creator + payouts + attribution | **No organic scheduling.** Cannot be the daily login surface |
| Bazaarvoice / Pixlee | UGC + galleries + rights | No scheduling, no creator payouts, no paid |

**Nobody owns the whole loop.** The two halves — "the tool social teams open every morning"
and "the system that pays creators and counts revenue" — are owned by different vendors with
different buyers. `[C1 — inference from files 01–05 plus recall]`

---

## 3. Category sizing and the absorb / partner / ignore call

Market-size figures below are `[C3]` recall of analyst estimates and should be treated as
order-of-magnitude only. They are included because the *ratios* drive the build order, not
because any single number is reliable.

| Category | Order-of-magnitude market | Our call | Rationale |
|---|---|---|---|
| Influencer marketing platforms | ~$25–35B global program spend; software slice ~$1–2B ARR `[C3]` | **ABSORB** | Highest ACV adjacency, weakest UX incumbents, directly monetizable |
| Social commerce GMV | ~$1–2T globally, TikTok Shop alone reportedly tens of billions USD GMV `[C3]` | **ABSORB the plumbing, not the checkout** | Catalog sync + tagging + attribution is absorbable; being a checkout is not |
| UGC platforms | ~$500M–1B ARR (Bazaarvoice, Yotpo, Emplifi, Nosto) `[C3]` | **ABSORB rights + galleries; PARTNER on reviews** | Rights model is the strategic asset; review syndication is a moat we cannot cross |
| Employee advocacy | ~$300–600M ARR `[C3]` | **ABSORB** — Vista already has a thin version | Cheap to build once the contact graph exists; high seat-count expansion |
| Link-in-bio | ~$150–300M ARR (Linktree-dominated) `[C3]` | **ABSORB (already partly built)** | Vista Page exists; add commerce + attribution |
| Live shopping | Small in West, large in APAC `[C3]` | **PARTNER / IGNORE v1** | Capital-intensive video infra, weak Western demand |
| Creator payouts | Infrastructure, not a market we sell into | **BUY (embed Tipalti/Trolley/Wise)** | Regulatory surface (KYC, tax) is disproportionate to build |
| Paid social management | Huge, but owned by Meta/Google native + Skai/Smartly | **ABSORB amplification only, not campaign management** | Do not compete with Ads Manager; own the organic→paid seam |

The single sentence version: **absorb everything that touches the content object or the
creator object; partner for everything that touches money movement or video infrastructure.**

---
---

# PART II — SOCIAL COMMERCE

## 4. TikTok Shop

TikTok Shop is the most important and most technically demanding commerce surface in this
file, because it is the only major network where **content, catalog, affiliate and checkout
are all inside one platform with a real partner API**. `[C1]`

### 4.1 Program structure

| Program | What it is | Who it is for |
|---|---|---|
| **TikTok Shop Seller Center** | Merchant console: products, orders, fulfilment, finance, promotions | Brands selling directly |
| **TikTok Shop Partner Center** (`partner.tiktokshop.com`) | Developer portal — app registration, API credentials, sandbox, app review | ISVs like us `[C2]` |
| **TikTok Shop Partner (TSP/TAP)** | Accredited service-provider program: agencies, MCNs, enablers | Service businesses; a possible status for us `[C3]` |
| **TikTok Shop Affiliate** | Creator↔seller commission marketplace | Creator monetization |
| **TikTok Creator Marketplace (TTCM)** | Separate, *non*-Shop influencer marketplace for paid campaigns | Brand campaigns (see §16.1) |

**Critical distinction most people get wrong:** TikTok Shop Affiliate and TikTok Creator
Marketplace are **different systems with different APIs and different creator populations**.
Affiliate is commission-on-GMV inside TikTok Shop; TTCM is flat-fee campaign booking. A
serious product must model both. `[C1]`

### 4.2 API mechanics

`[C2 unless marked]`

| Aspect | Detail |
|---|---|
| Base host | `https://open-api.tiktokglobalshop.com` |
| Auth host | `https://auth.tiktok-shops.com/api/v2/token/get` (and `/token/refresh`) |
| Versioning | **Date-versioned path segments**, e.g. `/product/202309/products/search`, `/order/202309/orders/search`, `/authorization/202309/shops`. New versions appear as new date segments; old ones are deprecated on announced timelines. This is unusual and worth noting — you version *per endpoint family*, not globally `[C1 for the pattern, C2 for the exact dates]` |
| Credentials | `app_key` + `app_secret` issued in Partner Center |
| Request signing | **HMAC-SHA256** over a canonical string built from the sorted query params + path (+ body for JSON), keyed with `app_secret`, sent as the `sign` param. Also requires a `timestamp` param. Signature failures are the #1 integration pain point `[C2]` |
| Token transport | `x-tts-access-token` header |
| Access token TTL | ~**7 days** (`604800` s) `[C3]` |
| Refresh token TTL | ~**365 days** `[C3]` |
| Grant flow | Seller authorizes via a TikTok Shop auth URL → `auth_code` → exchange for tokens; `grant_type=authorized_code` `[C2]` |
| Multi-shop | One authorization can cover multiple shops/regions; `/authorization/202309/shops` enumerates them with `cipher` values that must be passed on subsequent calls `[C2 — the `shop_cipher` requirement is a real and commonly-missed detail]` |
| Rate limits | Per-endpoint QPS, documented per API in Partner Center. **Exact values UNVERIFIED.** Assume low double-digit QPS per app per shop and design for backoff |
| Sandbox | Partner Center provides a sandbox shop; feature coverage in sandbox is incomplete `[C3]` |
| App review | Required before production; scopes are granted per API module `[C2]` |

### 4.3 API module families

`[C2 — module names are recalled; exact paths must be re-verified]`

| Module | Representative operations | Relevance to us |
|---|---|---|
| **Authorization** | Get authorized shops, get shop cipher | Mandatory |
| **Product** | Create/edit/search/publish products, category attributes, brand list, image upload, inventory update | High — catalog sync |
| **Order** | Search orders, get order detail, order webhooks | High — attribution |
| **Fulfilment / Logistics** | Ship packages, get shipping docs, warehouses | Low for us |
| **Finance** | Statements, settlements, payouts to seller | Medium — margin reporting |
| **Return & Refund** | Reverse orders | Low |
| **Promotion** | Flash sales, discounts, product-level deals | Medium — campaign coordination |
| **Customer Service** | Conversation/message APIs for buyer-seller chat | **High — this is an inbox surface** (see `07-platform-apis-tier2.md`) |
| **Affiliate (seller side)** | Open collaboration, targeted collaboration, creator search, commission plan management, sample requests | **Very high — this is the creator module** |
| **Affiliate (creator side)** | Creator-facing collaboration APIs | Only if we serve creators directly |
| **Analytics / Data** | Shop performance, product performance, video/live GMV attribution | **Very high — closes the loop** |

### 4.4 The affiliate system in detail

`[C2/C3 mixed — mechanics C2, numbers C3]`

Three collaboration modes, and a product must model all three because their economics differ:

| Mode | Mechanism | Notes |
|---|---|---|
| **Open collaboration** ("Open plan") | Seller publishes products with a public commission rate; any eligible creator can add them to their showcase and post | Zero-touch, low control. Commission typically 1–30% |
| **Targeted collaboration** | Seller invites specific creators with a bespoke commission rate and optional free sample | The one that needs CRM. Invitation → acceptance → sample shipment → content → attribution |
| **Shop Ads / GMV Max** | Paid amplification of shoppable content, increasingly automated | See §34.2 — TikTok has been consolidating Video Shopping Ads and Product Shopping Ads into an automated **GMV Max** product `[C3 — believed rolled out through 2025; verify current campaign-type names]` |

Supporting mechanics:
- **Free sample requests** — creators request product samples through the affiliate system; the
  seller approves and ships. This is the native equivalent of "product seeding" (§15.6) and it
  is API-addressable, which GRIN-style seeding on Shopify is not `[C2]`.
- **Creator showcase** — creator's product list; drives non-video attributed GMV.
- **Commission attribution** — GMV attributes to the content that drove it, with an
  attribution window. **Exact window UNVERIFIED** (commonly cited as a multi-day click window).
- **Affiliate creator search** — the API exposes creator discovery filtered by category, GMV
  tier, follower count, region. This is a *free creator database inside the commerce API*,
  which is strategically interesting given Modash/HypeAuditor charge $200–600/mo for the
  same primitive `[C2 — the search API exists; its filter richness is C3]`.

### 4.5 Live shopping on TikTok

`[C2/C3]`

- **TikTok LIVE Shopping** is the surviving major Western live-commerce surface after Meta
  retreated (§5.5, §11.2).
- Products are pinned to a LIVE session from the seller's catalog; the "yellow basket" drives
  in-stream checkout.
- **LIVE Shopping Ads** amplify a live session.
- **API coverage for LIVE is the weakest part of the TikTok Shop API surface.** Scheduling a
  LIVE, pinning products programmatically, and pulling per-LIVE GMV attribution are either
  absent or partner-gated. **UNVERIFIED** whether a public LIVE-management API exists in 2026.
  Assume manual/partner-only and design the product to *plan* lives (calendar, product
  shortlist, creator brief) without claiming to *operate* them.

### 4.6 Video product tagging

- Shoppable video: products attached to an organic TikTok post so a product card renders.
- **Whether the Content Posting API can attach products at publish time is the single most
  valuable unknown in this section.** `UNVERIFIED`. Recall suggests product attachment is done
  in the TikTok Shop/Seller flow or in-app, not via the standard Content Posting API used for
  organic publishing (`06-platform-apis-tier1.md`).
- **Consequence if unattachable:** shoppable TikTok publishing degrades to the "reminder
  publish" path already documented in file 06 — we schedule and notify, the human attaches the
  product. Product design must not promise otherwise until verified. `[C1 — the design
  consequence is certain even though the API fact is not]`

### 4.7 What we can realistically build against TikTok Shop

| Capability | Feasibility | Note |
|---|---|---|
| Sync SKUs to/from TikTok Shop | High | Product module |
| Order + GMV reporting joined to content | High | Order + Analytics modules |
| Affiliate creator discovery + targeted invites | High | Affiliate module — **the sleeper feature** |
| Sample/seeding request management | High | Affiliate module |
| Commission plan management | High | Affiliate module |
| Shoppable video publishing with product tags | **Unknown** | §4.6 — verify first |
| LIVE operation | Low | §4.5 — plan-only |
| Spark Ads on affiliate content | High | Via Ads API, §17.2 |

---

## 5. Meta commerce: Instagram product tagging, Facebook Shops, catalogs

### 5.1 The strategic context: Meta has been retreating from commerce

This is the most important framing in the section and it is `[C1]` — the *direction* is
unambiguous even though individual dates are `[C3]`:

| Retreat | Approx. date `[C3]` |
|---|---|
| Facebook Live Shopping discontinued | Oct 2022 |
| Instagram Live Shopping discontinued | Mar 2023 |
| Instagram "Shop" tab removed from main navigation | ~Feb–Apr 2023 |
| Shops checkout narrowed; **native checkout effectively US-only**, other markets redirect to the merchant website | ~2023–2024 |
| Shops availability in non-US markets restricted / feature-reduced | ~Apr 2024 |
| Meta's commerce investment redirected toward **ads with catalogs** (Advantage+ catalog ads) rather than owned checkout | Ongoing |

**Read:** Meta decided it would rather be the demand-generation layer feeding merchant
websites than an operator of checkout. The durable Meta commerce primitives are therefore
**the catalog** and **product tagging as an ad-targeting signal**, not Shops. Build against
catalogs; treat Shops as legacy. `[C1 — inference, strongly supported]`

### 5.2 Catalog / Commerce Manager APIs

`[C2 unless marked]` — this is the durable layer.

| Endpoint family | Purpose |
|---|---|
| `POST /{business_id}/owned_product_catalogs` | Create a catalog |
| `GET /{catalog_id}/products` | List products |
| `POST /{catalog_id}/batch` | **Batch upsert/delete items.** The workhorse. Requests carry `method` (`CREATE`/`UPDATE`/`DELETE`) + `data` per item |
| `POST /{catalog_id}/product_feeds` | Register a scheduled feed (CSV/TSV/XML/RSS/ATOM at a URL, with an upload schedule) |
| `GET /{product_feed_id}/uploads` | Feed run history, error diagnostics |
| `POST /{catalog_id}/product_sets` | Product sets for ad targeting |
| `/{catalog_id}/check_batch_request_status` | Async batch status |
| `/{catalog_id}/event_stats`, `/{catalog_id}/diagnostics` | Catalog health |

- **Batch size:** commonly cited as up to **5,000 items per batch request** `[C3]`.
- **Catalog size:** very large (tens of millions of items supported) `[C3]`.
- **Permission:** `catalog_management` plus a business role on the catalog `[C2]`.
- **Two ingestion paths:** scheduled feed pull (simplest, merchant-owned URL) vs. batch API
  push (real-time, needed for inventory accuracy). A serious product supports **push for
  price/stock deltas and feed for full reconciliation** `[C1 — standard pattern]`.

### 5.3 Instagram product tagging

`[C2]` — and note file `01` §22.1 independently confirms the per-post limits from the Vista
Social side, which is a useful cross-check.

| Aspect | Detail |
|---|---|
| Tag limits | **5 products per single image/video post; 20 per carousel** `[C2 — corroborated by file 01]` |
| Publish-time tagging | `product_tags` parameter on the media container creation call, each tag `{product_id, x, y}` for images; video/Reels tagging uses product IDs without coordinates `[C2]` |
| Post-hoc tagging | `POST /{ig_media_id}/product_tags` to add tags to already-published media; `DELETE` to remove `[C2]` |
| Read tags | `GET /{ig_media_id}/product_tags` |
| Catalog discovery | `GET /{ig_user_id}/available_catalogs` — which catalogs this IG account may tag from |
| Product search | `GET /{ig_user_id}/catalog_product_search?q=` — resolves a query to taggable `product_id`s. **This is the endpoint a composer needs** |
| Permission | `instagram_shopping_tag_products` (plus the standard content-publishing permissions) `[C2]` |
| Precondition | The IG account must be **approved for Instagram Shopping** and connected to a catalog via Commerce Manager. Approval is a manual, market-dependent, sometimes-slow process — a real onboarding friction to design for `[C1]` |
| Login path | Product tagging historically requires the **Facebook Login for Business** path (Page + catalog + business), not the newer Instagram-Login-only path. **Verify:** if the IG-Login path still lacks tagging, our onboarding must force the FB path for commerce customers `[C3 — high-value unknown]` |

**Structural note:** product tagging is one of very few Instagram publishing capabilities that
Vista Social ships (file `01` §22.1) — so it is **parity, not differentiation**. The
differentiation is what surrounds it: inventory-aware validation (§5.7), catalog sync, and
attribution.

### 5.4 Facebook Shops and the Commerce Platform (checkout)

`[C2/C3]`

- **Commerce Manager** manages shops, catalogs, and (US) checkout.
- **Commerce Platform APIs** exist for checkout-enabled shops: order retrieval
  (`/{page_id}/commerce_orders`), acknowledgement, fulfilment, cancellations, refunds, with
  permissions like `commerce_account_read_orders` / `commerce_account_manage_orders` `[C2]`.
- Access is **partner-gated** — this is not a self-serve API surface `[C3]`.
- **Our call: do not build against Commerce Platform.** US-only checkout on a surface Meta is
  de-emphasising is a poor ROI. Build catalogs + tagging + attribution instead. `[C1 — inference]`

### 5.5 Meta live shopping

Dead on both Facebook and Instagram (§5.1). Any competitor marketing material claiming
"Instagram Live Shopping" support in 2026 is stale — a useful competitive tell. `[C1]`

### 5.6 Threads and WhatsApp

- **Threads:** no commerce surface. `[C1]`
- **WhatsApp:** see §8. WhatsApp is Meta's *actual* growing commerce surface, especially in
  India/Brazil/Indonesia (`08-platform-apis-regional.md` context).

### 5.7 The feature nobody ships: commerce-aware publish validation

Because we can read the catalog (§5.2) and resolve products at compose time (§5.3), we can do
something no scheduler does: **validate a shoppable post against live catalog state before it
publishes**.

Concrete rules:
- Block/warn if a tagged SKU is `out of stock` at scheduled publish time.
- Warn if the price changed >X% between compose and publish (common with scheduled sale posts).
- Warn if the product's catalog `availability` is `discontinued`.
- Warn if the product is not in the `available_catalogs` for the target IG account.
- Warn if the same SKU is tagged in >N posts in a rolling window (creative fatigue).

This is cheap to build, impossible to build without catalog integration, and immediately
legible to an e-commerce buyer. `[C1 — inference; I am not aware of any SMM tool shipping it]`

---

## 6. YouTube Shopping

`[C2/C3]`

### 6.1 Program shape

| Element | Detail |
|---|---|
| **YouTube Shopping affiliate program** | Creators tag other brands' products and earn commission. Rolled out US first, then expanded — recall includes **South Korea, Vietnam, Thailand, Indonesia, India, Philippines** among expansion markets `[C3 — market list needs verification]` |
| **Store connections** | Creators/brands connect a store to tag their own products. **Shopify is the primary connected-store partner**; regional partners exist (e.g. Cafe24/Coupang in Korea) `[C3]` |
| **Eligibility** | YouTube Partner Program membership + subscriber threshold + channel not set as "made for kids" + no MFK/adult content. **Subscriber threshold recall is conflicted (10,000 vs 20,000) — treat as UNVERIFIED** |
| **Surfaces** | Product shelf under long-form videos, tagged products in Shorts, products in Live, a channel Store tab, and an "affiliate hub" for finding brand offers |

### 6.2 API status

- There is **no public YouTube Shopping API** for tagging products, managing the affiliate hub,
  or pulling shopping-attributed revenue. `[C2 — high confidence; verify]`
- YouTube Data API v3 (`06-platform-apis-tier1.md`) has no commerce fields.
- The store connection is operated **by the commerce platform's own YouTube app** (i.e. Shopify's
  YouTube sales channel), not by third-party ISVs.
- YouTube Analytics API does not expose shopping revenue dimensions. `[C3]`

**Consequence:** YouTube Shopping is, for us, a **read-nothing/write-nothing** surface in v1.
The only honest features are (a) planning and briefing, (b) pulling standard YouTube analytics
and joining them to store-side order data by timestamp/UTM, and (c) telling the customer to
connect Shopify's YouTube channel themselves. Do not promise YouTube Shopping "support".
`[C1 — design consequence]`

### 6.3 BrandConnect

See §16.3 — YouTube's brand-creator marketplace has been repeatedly narrowed and its status is
`[C3]`; treat as not-integrable.

---

## 7. Pinterest catalogs and product Pins

Pinterest is the **most developer-friendly commerce catalog API of the major networks** and is
consistently underrated. `[C1 — inference]`

### 7.1 Catalog API (v5)

`[C2]`

| Endpoint | Purpose |
|---|---|
| `POST /v5/catalogs` | Create a catalog (multi-catalog support) |
| `POST /v5/catalogs/feeds` | Create a feed: `location` (URL), `format` (TSV/CSV/XML), `default_country`, `default_locale`, `default_currency`, `default_availability`, and a fetch `schedule` |
| `GET /v5/catalogs/feeds/{feed_id}/processing_results` | Per-run ingestion diagnostics — item counts, errors, warnings |
| `POST /v5/catalogs/items` | **Batch item operations** — `operation` ∈ `UPSERT`/`UPDATE`/`CREATE`/`DELETE` with an items array. Batch size commonly cited as **100 items per call** `[C3]` |
| `GET /v5/catalogs/items` | Read item state by item id |
| `POST /v5/catalogs/product_groups` | Product groups (the Pinterest analogue of Meta product sets) — used for Shopping ad targeting |
| `GET /v5/catalogs/product_groups/{id}/products` | Products in a group |

- **Scopes:** `catalogs:read`, `catalogs:write` `[C2]`.
- **Access tier:** Pinterest gates richer commerce/ads capability behind a **standard/partner
  access review** beyond trial access `[C3]`.
- **Rich Pins** (metadata scraped from the merchant page via Open Graph/schema.org) still exist
  but the catalog is the modern path for products `[C2]`.
- **Direct links** — Pinterest's push to send clicks straight to the merchant PDP `[C3]`.

### 7.2 Why Pinterest matters more than its share of voice

- Pinterest's users arrive with **commercial intent** and the platform's ad product is
  catalog-driven, so a catalog integration simultaneously unlocks organic product Pins *and*
  Shopping ads.
- The v5 API is coherent, documented, and does not require the partner-gating drama of Meta
  Commerce Platform or TikTok Shop.
- **For a "one catalog → many networks" feature (§10.7), Pinterest is the cheapest second
  destination after Meta.** `[C1 — inference]`

---

## 8. WhatsApp catalogs and commerce messaging

`[C2/C3]` — cross-reference `07-platform-apis-tier2.md` for the messaging side.

### 8.1 Mechanics

| Element | Detail |
|---|---|
| Catalog source | A **Meta Commerce catalog** (same object as §5.2) linked to the WhatsApp Business Account / phone number `[C2]` |
| **Single product message** | `type: interactive`, `interactive.type: "product"`, body carries `catalog_id` + `product_retailer_id` `[C2]` |
| **Multi-product message** | `interactive.type: "product_list"` — sections of products. Commonly cited limit: **up to 30 products across up to 10 sections** `[C3]` |
| **Catalog message** | `type: "catalog_message"` — sends the whole catalog as a card `[C2]` |
| **Cart** | Buyers add to an in-WhatsApp cart; on send, an **`order` webhook** arrives with `product_items[]` (each with `product_retailer_id`, `quantity`, `item_price`, `currency`) `[C2]` — this is the attribution hook |
| **Commerce settings** | `GET`/`POST /{phone_number_id}/whatsapp_commerce_settings` with `is_cart_enabled`, `is_catalog_visible` `[C2]` |
| **Payments** | Native payments limited to specific markets — recall: **India, Brazil, Singapore** `[C3]`. Elsewhere the flow ends in a payment link |
| Pricing model | WhatsApp Cloud API moved from conversation-based to **per-message pricing for template categories** during 2025 `[C3 — verify; this materially changes unit economics]` |

### 8.2 Why it matters to us

WhatsApp is the highest-conversion commerce channel in several of the regional markets
covered in `08-platform-apis-regional.md`, and the `order` webhook gives a **clean, first-party,
cookie-free attribution event** — which is rare and valuable (§13). If we already support
WhatsApp in the inbox, catalogs are a small increment with disproportionate value in
LATAM/India/SEA. `[C1 — inference]`

---

## 9. The rest: Snap, X, LinkedIn, Reddit commerce posture

`[C2/C3]`

| Network | Commerce posture 2026 | Build? |
|---|---|---|
| **Snapchat** | No meaningful organic commerce. **Catalogs exist for ads** (Dynamic Ads / Collection Ads) via the Marketing API. AR try-on is the differentiated surface | Catalog-for-ads only |
| **X / Twitter** | **X Shops / Shopping Manager / product drops were discontinued** (~2023). No commerce API. Given the $29/profile/mo API economics noted in file `01` §4.4, X is a cost centre | No |
| **LinkedIn** | No commerce. Product Pages exist but are marketing collateral, not catalog | No |
| **Reddit** | No native commerce; ads only. Reddit's value is community/listening | No |
| **Telegram** | Bot-based commerce + Telegram Stars; niche but real in some markets | Watch |

---

## 10. E-commerce platform integrations

This is the **plumbing layer that makes attribution possible**. It is also the single highest
ROI integration category in this file, because one Shopify integration unlocks: catalog sync
(§5.2/§7.1), order-level attribution (§13), discount-code generation for creators (§15.10),
product seeding (§15.6), and revenue reporting.

### 10.1 Shopify — the one that matters

`[C2 unless noted]`

| Aspect | Detail |
|---|---|
| **Primary API** | **Admin GraphQL API.** REST Admin API is legacy: Shopify designated REST as legacy in late 2024 and required **new public apps to use GraphQL from ~1 April 2025** `[C3 on the exact date, C1 on the direction]` |
| Versioning | Quarterly, `YYYY-MM` (e.g. `2026-01`, `2026-04`, `2026-07`). Each version supported ~12 months `[C2]` |
| Auth | OAuth 2.0 for public apps; **session tokens / token exchange** for embedded apps; Shopify has pushed apps toward embedded App Bridge auth `[C2]` |
| **Rate limiting** | GraphQL uses a **calculated query-cost bucket** (leaky bucket, points restored per second). Commonly cited: Standard ≈ 100 points/s restore with a 2,000-point bucket; Advanced ≈ 2×; **Plus ≈ 10×** `[C3 — verify exact tiers]`. REST used 2 req/s (40 burst) `[C3]` |
| **Webhooks** | `orders/create`, `orders/updated`, `orders/paid`, `checkouts/create`, `products/update`, `inventory_levels/update`, `app/uninstalled`, plus **mandatory GDPR/compliance webhooks** (`customers/data_request`, `customers/redact`, `shop/redact`) for App Store listing `[C2]` |
| **Bulk operations** | `bulkOperationRunQuery` / `bulkOperationRunMutation` with JSONL result files — the correct way to sync large catalogs `[C2]` |
| **Marketing Activities API** | `marketingActivityCreateExternal`, `marketingEngagementCreate` — lets a third-party app **write marketing activity + engagement + spend + UTM into Shopify's own Marketing reports and attribution**. `[C2]` **This is the single most under-exploited API in the whole social-tools market** — it puts our organic and creator activity into the merchant's native attribution report next to their paid channels. See §13.4 |
| **Order attribution** | `Order.customerJourneySummary` — moments, first/last visit, referrer, UTM parameters. Availability/limits by plan are `[C3]`; historically the richest journey data was Plus-flavoured |
| **Discount codes** | `discountCodeBasicCreate` / `discountCodeAppCreate` — programmatic per-creator codes `[C2]`. Foundation for creator attribution (§13.3) |
| **Draft orders** | `draftOrderCreate` + complete → real order at $0 for **product seeding** (§15.6) `[C2]` |
| **Shopify Collabs** | Shopify's own creator/affiliate marketplace built into admin. Takes a fee on affiliate payouts (recall ≈ **2.9%**) `[C3]`. **This is a direct competitor to the creator-affiliate half of our plan for Shopify merchants — and simultaneously proof the demand exists** |
| **Shopify Audiences** | Plus-only; exports high-intent audiences to Meta/Google/etc. `[C3]` |
| **App Store economics** | Shopify revenue share: **0% on the first $1M/yr of app revenue, 15% above** `[C3 — was the 2021+ policy; verify, as Shopify has adjusted this]` |
| Storefront API | GraphQL, for headless — not needed by us |

**Shopify is the anchor integration. Everything else in §10 is a follower.** `[C1]`

### 10.2 WooCommerce

`[C2]`

- **REST API v3** at `/wp-json/wc/v3/`: `products`, `orders`, `customers`, `coupons`,
  `reports`, `webhooks`.
- Auth: consumer key/secret (basic auth over HTTPS) or WP application passwords; there is a
  browser-based **auth endpoint** (`/wc-auth/v1/authorize`) for app onboarding.
- **Webhooks** exist (`order.created`, `product.updated`) but are notoriously unreliable on
  cheap shared hosting — **design for polling fallback** `[C1 — practical]`.
- No rate limit imposed by Woo itself; the *host* is the limit. Highly variable performance is
  the defining engineering characteristic.
- Coupons API supports per-creator discount codes.
- ~Significant share of global stores by count, but **low ARPU merchants** — a support-cost
  trap if not handled with self-serve onboarding. `[C3]`

### 10.3 BigCommerce

`[C2/C3]`

- **V3 REST** for catalog (`/stores/{store_hash}/v3/catalog/products`), **V2** still used for
  some order operations (`/v2/orders`) — a genuine wart.
- GraphQL Storefront API for front-end.
- OAuth apps via BigCommerce Developer Portal; **webhooks** (`store/order/created`,
  `store/product/updated`).
- Rate limits by plan tier (per-hour quota; Enterprise effectively unmetered) `[C3]`.
- Mid-market skew: fewer merchants, higher AOV. Worth doing *after* Shopify, *before* Woo if
  targeting mid-market. `[C3]`

### 10.4 Etsy

`[C2/C3]`

| Aspect | Detail |
|---|---|
| API | **Open API v3** at `https://openapi.etsy.com/v3/application/...`; v2 fully retired `[C2]` |
| Auth | OAuth 2.0 **with PKCE mandatory**; scopes such as `listings_r`, `listings_w`, `transactions_r`, `shops_r` `[C2]` |
| **Rate limits** | Commonly cited: **10,000 requests/day and 10 requests/second per app** `[C3]` |
| Access | Requires an approved app; **commercial/personal access distinction** and a review process `[C3]` |
| Commerce | Listings, inventory, receipts (orders), shipping profiles |
| Social relevance | Etsy sellers are a large, underserved, social-first SMB segment (Pinterest + Instagram heavy). **A credible wedge market** `[C1 — inference]` |

### 10.5 Amazon

Two distinct API surfaces, and **the second one is the interesting one**:

**(a) SP-API (Selling Partner API)** `[C2]`
- LWA (Login with Amazon) OAuth; roles granted per data type; **Restricted Data Tokens (RDT)**
  required for PII operations.
- Endpoint families: `/orders/v0/orders`, `/catalog/2022-04-01/items`,
  `/listings/2021-08-01/items`, `/fba/inventory/v1/summaries`, Reports API (async
  create→poll→download), Notifications API (EventBridge/SQS destinations).
- Per-operation rate limits, often **very low** (e.g. sub-1 req/s with small burst) `[C3]`.
- Registration as a developer requires an Amazon developer profile and, for PII roles, a
  **security/data-protection questionnaire** `[C3]`.

**(b) Amazon Ads API → Amazon Attribution** `[C1 for existence, C2 for mechanics]`
- **Amazon Attribution** creates tagged links for **non-Amazon traffic sources** (i.e. social)
  and reports downstream **clicks, detail-page views, add-to-carts, purchases and sales** on
  Amazon.
- This is the *only* way to attribute a social post to an Amazon sale, and it is a real API.
- Also relevant: **Brand Referral Bonus** (a referral-fee credit for driving external traffic)
  makes attributed social traffic directly worth money to sellers `[C3]`.
- **Strategic note:** for the enormous population of brands whose actual revenue happens on
  Amazon, "which Instagram Reel drove Amazon sales" is an unanswered question that Amazon
  Attribution + our link management can answer. **Almost no SMM tool integrates Amazon
  Attribution.** `[C1 — inference; a genuine gap]`

**(c) Amazon creator surfaces** `[C3]`
- **Amazon Influencer Program** — creator storefronts, shoppable video, onsite commissions.
- **Amazon Creator Connections** — brand↔creator commission collaborations (launched ~2024).
- **Amazon Live** — livestream shopping.
- **Amazon Inspire** (TikTok-style feed) — **believed shut down in early 2025** `[C3]`.

### 10.6 Others

| Platform | API posture | Priority |
|---|---|---|
| **Wix Stores** | REST + app market; decent | Low-medium |
| **Squarespace Commerce** | Limited public API (Orders/Inventory/Products) | Low |
| **Adobe Commerce / Magento** | REST + GraphQL; enterprise, self-hosted complexity | Low (enterprise sales only) |
| **Salesforce Commerce Cloud** | OCAPI/SCAPI; enterprise | Low |
| **Squarespace / Ecwid / Lightspeed / Square Online** | Long tail | Aggregate later |
| **Aggregators (Rutter, Nango, Codat, Alloy)** | One API over many carts | **Serious v1 shortcut — see below** |

**Aggregator consideration:** a unified-commerce-API vendor (e.g. Rutter) can deliver
Shopify + Woo + BigCommerce + Amazon + others behind one schema, trading per-order or
per-connection cost for months of engineering. For a v1 that needs *breadth of proof* rather
than *depth of control*, this is a defensible shortcut — but it caps you out of the
differentiated features (Marketing Activities API, draft-order seeding, discount-code
generation) that live in platform-specific corners. **Recommendation: build Shopify natively;
consider an aggregator for the tail.** `[C1 — inference; aggregator pricing UNVERIFIED]`

### 10.7 The "one catalog, many networks" feature

Once you can read a merchant catalog (Shopify/Woo/BigCommerce), you can **write it to every
social catalog**: Meta (§5.2), Pinterest (§7.1), TikTok Shop (§4.3), Snapchat (ads catalog),
Google Merchant Center. Each destination has its own field mapping, category taxonomy, image
requirements and error semantics.

Today merchants do this with **one app per destination** (Facebook channel, Pinterest app,
TikTok channel, Google channel), each with its own sync bugs and no unified diagnostics.

A **single catalog-sync control plane with per-destination field mapping, taxonomy mapping,
a dry-run diff, and a unified error console** is:
- genuinely useful,
- moderately hard (the taxonomy mapping is the real work),
- and **not shipped by any SMM vendor** `[C1 — inference]`.

---

## 11. Live shopping platforms

### 11.1 Vendor landscape

`[C3 for all specifics]`

| Vendor | Model | Notes |
|---|---|---|
| **Bambuser** | Enterprise live video shopping SaaS (Swedish, publicly listed on Nasdaq First North). Products: One-to-Many live, One-to-One video shopping, Shoppable Video | The Western enterprise standard; used by large retail/beauty brands |
| **CommentSold** | **Comment-selling**: buyers comment a keyword on a Facebook/Instagram Live and get an auto-invoice; plus its own apps and "Videeo" white-label live commerce | Dominant in US boutique/apparel resale. Pricing recalled as a platform fee plus a per-order fee |
| **Firework** | Shoppable video + livestream embedded on brand sites; heavily funded | Website-embed-first |
| **TalkShopLive** | US network-style live shopping, celebrity/publisher driven; retail partnerships | Media-flavoured |
| **Whatnot** | Live shopping **marketplace** (collectibles→fashion→everything). Take rate recalled ≈ **8% commission + ~2.9% + $0.30 payment fee** | Not a SaaS; a destination. GMV growth widely reported as very fast |
| **Amazon Live** | Amazon-native | Closed |
| **Emplifi** | Live shopping bundled into the social suite | The only SMM-adjacent vendor with it |
| **Channelize.io, LiSA, Smartzer, Buywith, Livescale** | Long tail | — |

### 11.2 Structural read

- Western live commerce **underperformed its 2021 hype**; Meta exited entirely (§5.1).
- The surviving Western volume is concentrated in **TikTok LIVE** and **marketplace-native**
  models (Whatnot), not in brand-website live players.
- APAC (China, SEA, Korea) live commerce is genuinely enormous but is served by domestic
  platforms out of our reach (`08-platform-apis-regional.md`).

**Our call: do not build live video infrastructure.** Build the *planning and measurement*
wrapper: a live-session calendar object, product shortlist, creator assignment, brief,
countdown/promo post automation before the stream, clip-repurposing after, and revenue
join from the commerce platform. That captures most of the workflow value at ~5% of the cost.
`[C1 — inference]`

---

## 12. Shoppable link-in-bio

### 12.1 Vendor landscape and economics

`[C3 for all pricing]`

| Vendor | Positioning | Recalled pricing | Commerce |
|---|---|---|---|
| **Linktree** | Category leader by a wide margin; tens of millions of users | Free; Starter ≈$5/mo; Pro ≈$9/mo; Premium ≈$24/mo (annualised) | Linktree payments/"Shop" via Stripe/PayPal/Square; takes a % on some tiers |
| **Beacons** | Creator-OS ambition (link-in-bio + store + email + media kit + AI) | Free; ≈$10/mo Creator Pro; ≈$30/mo Store Pro | Digital + physical store, ~0–9% fee by tier |
| **Stan Store** | Creator-commerce first, high conversion focus | ≈$29/mo Creator; ≈$99/mo Creator Pro | Native digital product checkout |
| **Later Link in Bio** | Bundled with the SMM tool | Included | Shoppable via product links |
| **Vista Page** | Bundled; **already a micro-CMS** with Calendly/Typeform embeds, custom domain, free SSL, and a **Linktree importer** (file `01` §12) | Included | Payments via Typeform embed only — **no native commerce** |
| **Komi, Milkshake, Snipfeed, Campsite, Taplink, Pillar, Flowcode, Bio Sites (Squarespace)** | Long tail | $0–20/mo | Varies |
| **Koji** | **Shut down (~2023)**, assets to Linktree | — | — |
| **Shopify Linkpop** | Shopify's link-in-bio; **status uncertain, believed wound down** `[C3]` | — | Shopify checkout |

### 12.2 What "shoppable" should actually mean

Most link-in-bio "shops" are a list of links. The valuable version is:

1. **Auto-linked feed** — mirror the Instagram/TikTok feed; each post maps to the products
   tagged or manually assigned; tapping a post opens the products. (This is Later's original
   LinkinBio insight and it still converts.)
2. **Catalog-backed product blocks** — pull live price/stock from the commerce integration
   (§10) so the page never sells an out-of-stock SKU.
3. **Per-creator/per-post link IDs** so every click is attributable (§13.2).
4. **Native checkout or deep-link to cart with a pre-applied discount** — Shopify permalink
   carts (`/cart/{variant_id}:{qty}?discount=CODE`) are a cheap way to do this without being a
   payment processor `[C2 — the cart permalink format is stable and useful]`.
5. **Post-click retargeting pixel hosting** (Meta/TikTok pixels on the bio page) so bio traffic
   becomes an ad audience.
6. **Email/SMS capture** with sync to Klaviyo/Kit (§27).

Vista Page already does (1)-adjacent work and has custom domains; adding (2)(3)(4)(5)(6) turns
a commodity feature into an attribution asset. **Note the strategic subtlety: the link-in-bio
page is the only surface in this entire file where we own the pixel, the domain and the
click.** That makes it the natural home for first-party attribution. `[C1 — inference]`

### 12.3 Why the importer matters

File `01` §12 flags Vista's **"Import Link in Bio (Beta)"** (migrate a Linktree page) as a
smart switching lever. Confirmed: importers are the cheapest growth mechanism in this category
because Linktree's ~50M+ user base is almost entirely unmonetized and switching cost is
otherwise the only thing holding it. Build importers for **Linktree, Beacons, Stan, Milkshake,
Komi**. `[C1 — inference]`

---

## 13. Checkout attribution — the hardest problem in this file

Everything above is plumbing. This section is the actual value.

### 13.1 Why it is hard

| Obstacle | Effect |
|---|---|
| **In-app browsers** | Instagram/TikTok in-app browsers, ITP/ETP cookie caps (7-day / 24-hour capping on client-set cookies), and Safari defaults destroy classic last-click cookie attribution `[C1]` |
| **iOS ATT** | Post-2021, deterministic user-level tracking off-platform is largely gone `[C1]` |
| **Platform walled gardens** | Meta reports its own conversions with its own windows (default **7-day click / 1-day view**); TikTok, Pinterest, Snap each report their own. **These sum to more than 100% of real orders** `[C1]` |
| **Organic has no click ID** | Paid gets `fbclid`/`ttclid`/`epik`/`sccid`/`twclid`/`li_fat_id`/`rdt_cid`. **Organic social gets nothing** unless you mint your own `[C1]` — this is the crux |
| **Dark social** | Copy-pasted links, DMs, screenshots — unattributable by construction |
| **Creator content lives on the creator's account** | You cannot put a pixel on someone else's Instagram post |

### 13.2 The attribution carriers, ranked by reliability

| Carrier | Reliability | Works for | Notes |
|---|---|---|---|
| **Discount code** | **Highest** — survives everything, including screenshots and word-of-mouth | Creators, ambassadors, employees | Under-counts (people forget the code), can be leaked to coupon sites. **Unique per creator, ideally per campaign** |
| **Order webhook with cart-level identifier** (WhatsApp `order`, TikTok Shop order, Shopify cart attributes) | Very high | In-platform checkout | Cookie-free, first-party |
| **Per-link short ID + server-side redirect** (our own domain) | High | Link-in-bio, bio links, story swipe-ups | We own the redirect → we log the click server-side before any cookie exists. Vista already mints **per-message unique link IDs** (file `01` §18.6) — the right primitive |
| **UTM parameters** | Medium | Everything with a URL | Survives to GA4/Shopify; stripped by some apps; lost on copy-paste |
| **Affiliate network link** (Mavely, LTK, ShopMy, Impact, Rakuten, Levanta) | Medium-high | Creator commerce | Adds a third-party ledger, adds fees |
| **Platform click ID** | High but siloed | Paid only | Feed back via CAPI |
| **Post-purchase survey** ("how did you hear about us?") | Medium, but **the only measure of dark social** | Everything | Fairing/KnoCommerce pattern; directional |
| **Geo/holdout incrementality tests** | Highest *causal* validity | Campaign-level | Expensive, slow, enterprise-only |
| **MMM** | Strategic only | Channel-level | Meta Robyn (open source), Google Meridian (2025) `[C3]` |

### 13.3 The creator attribution stack we should ship

For each creator × campaign, mint **all four** carriers and reconcile:

1. A **unique discount code** (`generate via Shopify discountCodeBasicCreate`).
2. A **unique tracked link** on our domain → 302 to the destination with UTMs appended.
3. **Cart attributes / note attributes** injected on the landing page so the order object
   carries the creator ID natively (Shopify `cart.attributes`) `[C2]`.
4. A **post-purchase survey** option value naming the creator.

Then a **deduplication policy** with an explicit precedence: code > cart attribute > tracked
link > UTM > survey. Report **both** the deduped number and the per-carrier numbers, because
the gap between them is itself the insight (e.g. "40% of code redemptions had no click" = the
creator's audience is going direct, i.e. real brand lift).

**Nobody in the SMM category ships this.** Creator platforms ship pieces of it (GRIN and
Aspire generate codes and links; Later's Mavely is a network). **The combination plus the
reconciliation report is a defensible feature.** `[C1 — inference]`

### 13.4 Writing back into the merchant's system of record

Two write-backs that convert us from "a tool with a dashboard" to "a line in the CFO's report":

- **Shopify Marketing Activities API** (§10.1): register each campaign/creator/post as a
  marketing activity and post engagement + spend. Our activity then appears in Shopify's
  native Marketing → Attribution report next to Meta and Google, using **Shopify's own
  attribution model**, which the merchant already trusts. `[C2 — high value]`
- **GA4 Measurement Protocol** and/or a **server-side GTM** event for offline creator events.

The strategic value: we stop arguing about whose numbers are right. We put our numbers inside
the customer's existing source of truth. `[C1 — inference]`

### 13.5 Feeding conversions back to the ad platforms

Once we hold order data (§10) and click data (§13.2), we can operate **server-side conversion
APIs**: Meta CAPI, TikTok Events API, Pinterest Conversions API, Snap CAPI, LinkedIn
Conversions API, Reddit CAPI. This improves the customer's paid performance measurably and
creates a dependency that is very hard to remove. It is also **a data-protection surface**
(hashed PII leaving the merchant) that must be handled per `11-compliance-security-global.md`.
`[C1 for the mechanism; consent/DPA design is mandatory]`

---
---
# PART III — INFLUENCER AND CREATOR PLATFORMS

## 14. Landscape and ownership map

### 14.1 The vendor set

`[C3 for all commercial detail; C1/C2 for positioning]`

| Vendor | Segment | Origin / owner | Defining characteristic |
|---|---|---|---|
| **CreatorIQ** | Enterprise | Independent; absorbed **Tribe Dynamics** (2021) | The enterprise standard. Tribe brought **EMV** methodology. Large connected-account graph. Heavy analytics, "Intelligence Cloud" |
| **Aspire** (formerly AspireIQ) | Mid-market e-commerce | Independent | **Shopify-native, inbound-application marketplace.** Creators apply to your brand. Strong ambassador/affiliate motion |
| **GRIN** | Mid-market e-commerce | Independent | **Creator management, not a marketplace.** Deep e-commerce integrations, product seeding via real store orders, content rights library, "bring your own creators" philosophy |
| **Upfluence** | Mid-market | Independent | **"Live Capture"** — identifies which of *your own customers* are influencers by cross-referencing store customers against social profiles. Genuinely clever and underrated |
| **Later Influence** | Mid/enterprise | Later (Mavrck merged with Later 2022; Later acquired **Mavely** ~Nov 2024) | The only vendor with **SMM + influencer + an affiliate network** under one roof. Closest thing to our thesis in market |
| **Traackr** | Enterprise | Independent | **Influencer relationship management + spend/ROI discipline.** Strong in beauty/CPG. "Brand Vitality Score (VIT)" |
| **Captiv8** | Enterprise | Independent | Large index, brand-safety vetting, retail-media tie-ins |
| **Modash** | SMB/mid, self-serve | Independent (Estonia) | **Best-in-class discovery API + fake-follower detection.** ~250M+ creator profiles claimed. Sells an API — a possible *supplier* to us |
| **HypeAuditor** | SMB/mid | Independent | **Fraud detection specialist** — "Audience Quality Score", AI-driven fake-follower analysis |
| **Heepsy** | SMB | Independent | Cheap discovery |
| **Collabstr** | SMB marketplace | Independent | **Fixed-price packages**, creators list gigs, brand buys like Fiverr. Takes a platform fee |
| **#paid** | Mid | Independent (Canada) | **"Handraise"** — creators opt in to your brief rather than being cold-outreached |
| **Whalar Group** | Agency, not SaaS | Whalar / Foam / Sixteenth | Creator agency + talent management. **Services, not software** |
| **Klear** | Enterprise | **Meltwater** | Bundled into Meltwater suite |
| **Tagger** | Enterprise | **Sprout Social** | Sold separately; ≈$21,431/yr avg contract (file `03`) |
| **Influence** | Enterprise | **Brandwatch** (Paladin lineage) | Bundled |
| **Emplifi Influencer Marketing** | Enterprise | **Emplifi** | Bundled with UGC + care |
| **Popular Pays** | Mid | **Lightricks** | Content-generation flavoured |
| **impact.com / creator** | Enterprise | **impact.com** (absorbed **Activate**) | **Partnership-network lineage — affiliate rails are the strength** |
| **Insense** | SMB/mid | Independent | **UGC + whitelisting**, TikTok/Meta ads focused |
| **Trend.io, Billo, JoinBrands, Cohley, minisocial, Twirl** | SMB UGC | Independent | Content-as-a-service (§23) |
| **Social Native** | Mid/enterprise | Absorbed **Olapic** (2020) | UGC + creator marketplace |
| **SARAL, inBeat, Afluencer, Influencity, Kolsquare (EU), Lefty (EU/luxury), Woomio (Nordics)** | Long tail / regional | — | — |

### 14.2 The consolidation pattern — and why it is our opening

Note what happened: **Tribe Dynamics → CreatorIQ. Mavrck → Later. Mavely → Later. Klear →
Meltwater. Tagger → Sprout. Paladin → Brandwatch. Activate → impact.com. Olapic → Social
Native. Pixlee → Emplifi. Stackla → Nosto. Curalate → Bazaarvoice.**

Every major suite got its creator/UGC capability by **acquisition**. That has three
predictable consequences, all of which are exploitable:

1. **Separate data models.** The creator object in Tagger is not the contact object in Sprout.
   Cross-module workflows are shallow or absent.
2. **Separate pricing and separate contracts.** File `03` documents Sprout selling Tagger as a
   standalone purchase not included in any base plan. Customers pay twice and log in twice.
3. **Separate roadmaps.** The acquired product's roadmap decelerates post-acquisition.

**A single-codebase product where the creator, the employee advocate, the UGC contributor and
the ad creative are the same objects is a structural advantage that cannot be acquired.**
`[C1 — inference, well supported by the acquisition record]`

---

## 15. Capability teardown, module by module

This is the parity checklist for the influencer module. Each subsection: what the capability
is, how the leaders implement it, what the API reality is, and our call.

### 15.1 Discovery and search

**What it is:** find creators matching brand, audience and performance criteria.

**How it is implemented (the uncomfortable truth):** every vendor's "database of 200M+
creators" is built by **crawling public profiles and inferring audience demographics from
samples of followers**. Only accounts that have *connected* via OAuth (a small minority)
provide first-party data. `[C1 — this is the structural fact of the category]`

| Sub-capability | Leaders' state | Notes |
|---|---|---|
| Index size | Modash claims ~250M+; CreatorIQ ~20M+ "rich" profiles; Captiv8/HypeAuditor 30M–200M `[C3]` | **Index size claims are marketing.** The meaningful number is *how many have reliable audience data* |
| Filters | Follower count, engagement rate, location, language, audience age/gender/geo, interests/topics, growth rate, brand affinity, previous sponsorships, contact-email-available | Table stakes |
| **Keyword-in-caption / bio search** | Common | Cheap, high-utility |
| **Lookalike / similar creators** | CreatorIQ, Modash, Captiv8 | Embedding-based; easy for us with modern models |
| **Image/visual search** | Rare | Differentiator opportunity |
| **"Creators who follow you"** / **"creators who are already customers"** | **Upfluence Live Capture**; Aspire partially | **The single best-converting discovery method and the least-copied** |
| **Creators who mentioned you organically** | Traackr, CreatorIQ; requires listening | **We already have listening** (file `01` §7) — this is nearly free for us |
| Email/contact discovery | Common; legally fraught in EU | GDPR risk (§42) |

**Our call:** do **not** build a 200M-profile crawler in v1. That is a multi-year, legally
exposed, expensive data-engineering project and platforms actively fight it (§15.1.1).
Instead:
- **Buy discovery** — Modash and HypeAuditor both sell APIs `[C3 — verify Modash API pricing]`.
- **Build the two discovery modes that use data we uniquely hold**: (a) creators already
  mentioning/tagging the brand (from listening), (b) creators who are already customers (from
  the commerce integration). These beat generic search on conversion and cost us almost
  nothing. `[C1 — inference]`

#### 15.1.1 The legal/ToS overhang on scraped creator databases

- Platform ToS generally prohibit scraping; enforcement is episodic but real.
- EU: profile data of an identifiable person is personal data — **GDPR Art. 6 lawful basis and
  Art. 14 notification obligations** apply to scraped databases. Several vendors handle this
  with "legitimate interests" assessments; it is contested.
- **hiQ v. LinkedIn** did not settle this in vendors' favour as broadly as often claimed.
- **This is a real reason to buy rather than build**: it moves the compliance exposure to the
  data vendor. `[C1 — directionally certain; specific legal advice out of scope]`

### 15.2 Audience verification and fraud detection

**What it is:** detect purchased followers, engagement pods, bot comments, and mismatched
audiences before you pay someone.

| Signal | How it works |
|---|---|
| Follower/engagement ratio anomalies | ER far outside the band for that follower tier |
| **Follower growth spikes** | Step-function jumps = purchased |
| Audience authenticity sampling | Sample N followers; score each (no avatar, no posts, default username patterns, follow/follower ratio, mass-following) |
| Comment quality | Emoji-only, generic ("nice!"), repeated commenter cliques = pods |
| Geo mismatch | Audience geo ≠ claimed market — the classic fraud in beauty/fashion |
| Engagement timing | Unnaturally uniform inter-arrival times of likes |
| Reach vs. followers | Views/impressions wildly below follower count |

Vendors: **HypeAuditor "Audience Quality Score"**, **Modash "fake follower %"**,
**Traackr audience quality**, **Captiv8 brand-safety + fraud**. `[C3 for the exact metric names]`

**Additional dimension the market under-serves: brand safety.** Scanning a creator's *content
history* for profanity, politics, competitor promotion, alcohol/gambling/adult content, and
prior sponsorships. Captiv8 and CreatorIQ do this; SMB tools do not. **With modern
vision+language models this is now cheap for us to do well** — screen the last N posts and
produce a risk report with citations. `[C1 — inference; a real 2026-era advantage]`

### 15.3 Outreach and CRM

| Capability | State of the art |
|---|---|
| Pipeline stages | Prospect → Contacted → Negotiating → Contracted → Content Due → Live → Paid |
| Email sequencing with merge fields | GRIN, Aspire, Traackr |
| **Two-way email sync** (Gmail/Outlook OAuth so replies land in the platform) | GRIN, Aspire `[C3]` |
| Shared team inbox for creator conversations | Common |
| DM outreach | **Structurally limited** — see below |
| Templates, snippets, follow-up automation | Common |
| Relationship history (every campaign, payment, content piece) | The core of "IRM" (Traackr's framing) |

**The DM constraint `[C1 — important]`:** you cannot cold-DM creators via API on any major
platform. Instagram Messaging API only permits messaging users who messaged you first, inside
a 24-hour window (extendable with the human-agent tag to 7 days) `[C2]`. TikTok has no DM API.
Therefore **creator outreach is an email product, not a DM product** — and the email address
is often the bottleneck. Design accordingly: email-first, with a "request contact via
platform" manual fallback.

**Our advantage:** we already own an inbox (file `01` §5). Inbound creator DMs — creators
pitching brands is now a huge volume — can be **auto-triaged into the creator CRM**. That is a
seam no creator platform can reach because they do not have the brand's inbox. `[C1 — inference]`

### 15.4 Contracts and e-signature

| Capability | Notes |
|---|---|
| Template library with merge fields | Deliverables, dates, usage rights, exclusivity, payment terms, FTC disclosure clause |
| Native e-sign vs. integration | GRIN/Aspire have native or DocuSign/Dropbox Sign integrations `[C3]` |
| **Usage-rights encoding** | The critical bit: term (e.g. 6 months), territory, channels (organic/paid/web/OOH), whitelisting rights, exclusivity window |
| Countersigning, audit trail, storage | eIDAS (EU) / ESIGN + UETA (US) compliance |
| Amendments/renewals | Rights renewal before expiry is a workflow, not a document |

**The differentiator is not the signature. It is that the signed rights terms become
structured data that the publishing system enforces.** If the contract says "paid usage for 90
days", the ad creative built from that asset should be flagged at day 83 and blocked at day
91. **No vendor does this end-to-end** — creator platforms hold the contract, ad platforms
hold the creative, and nothing connects them. `[C1 — inference; this is one of the strongest
ideas in this file. See §21.4 and §38.]`

### 15.5 Briefs and content approval

| Capability | Notes |
|---|---|
| Brief builder | Objectives, do/don't, mandatory hashtags + **required FTC disclosure**, product info, mood board, examples, deadlines, deliverable spec (1× Reel + 3× Story) |
| Deliverable tracking | Per-deliverable status and due dates |
| **Content submission portal** | Creator uploads draft; brand comments frame-by-frame/time-coded |
| Revision rounds | Versioning with a round limit (contractual) |
| Approve → schedule | Approved asset flows into the content library and, if the creator granted it, into our publishing pipeline |
| Auto-compliance check | Does the caption contain `#ad`? Does it tag the brand? Is the disclosure "clear and conspicuous"? |

**Our advantage:** we already have an approval engine and a media library. File `01` §13 notes
Vista's approvals are **linear with no conditional routing** — a documented weakness. Creator
approvals need *different* routing (legal review for regulated categories, brand review,
performance-marketing review). Building conditional routing once serves both. `[C1]`

### 15.6 Product seeding and gifting

**What it is:** send free product to creators and track it.

| Capability | Implementation |
|---|---|
| Creator selects products from a curated list | Requires catalog integration (§10) |
| Order creation in the real store | Shopify `draftOrderCreate` → complete at $0, or a 100% discount code. **Keeps inventory, fulfilment and shipping in the merchant's normal ops** — this is why GRIN's e-commerce integration matters `[C2]` |
| Address collection | Creator-facing form; PII handling obligations |
| Tracking numbers back to the creator | From the order's fulfilment |
| **Gifting ROI** | Cost of goods sent vs. content produced vs. attributed revenue. Most brands cannot compute this |
| International shipping / customs | Real operational pain; usually manual |
| **TikTok Shop free samples** | Native API path (§4.4) — much cleaner than the Shopify hack |

**Our call: this is a strong early feature** because it is (a) high-frequency, (b) directly
enabled by the Shopify integration we need anyway, (c) painful in spreadsheets today, and (d)
where "gifting ROI" becomes a report nobody else produces. `[C1 — inference]`

### 15.7 Performance tracking

| Sub-capability | Reality |
|---|---|
| **Post detection** | Find the creator's post about you. Three methods: (1) creator connects their account via OAuth → first-party metrics; (2) **branded-content/partnership tagging** → metrics flow to the brand; (3) hashtag/mention monitoring → public metrics only |
| **Instagram Stories** | Stories vanish in 24h and are **not retrievable historically via API for third parties**. The only reliable capture is either the creator connecting their account (`/{ig_user_id}/stories`) or the creator screenshotting. **This is why every influencer vendor asks creators to install something or connect** `[C1 — a hard structural constraint]` |
| **Meta Branded Content / Partnership tagging** | When a creator tags the brand as a business partner, the brand gets access to insights on that post via the Branded Content API. **This is the single most important creator-metrics mechanism on Meta** `[C2]` |
| TikTok | Creator-connected data via TTCM or the creator's own OAuth; public metrics otherwise |
| YouTube | Public stats; full analytics only if the channel is linked |
| **EMV (Earned Media Value)** | A modelled currency (Tribe Dynamics popularised it). **There is no standard formula** — each vendor multiplies engagements by a per-platform, per-vertical, per-engagement-type coefficient. It is a *comparative* metric, not a real dollar value. Vista already computes an EMV for advocacy (file `01` §21) |
| VIT / proprietary scores | Traackr's Brand Vitality Score etc. |

**Recommendation on EMV:** ship it (buyers ask for it) but ship it **with the coefficients
exposed and editable**, and always alongside real attributed revenue (§13). Vendors that hide
the coefficients are selling a number the customer cannot defend to their CFO. Making it
transparent is both honest and a competitive attack. `[C1 — inference]`

### 15.8 Content rights and asset library

- Every creator platform doubles as a DAM for creator content.
- The rights metadata (§15.4) must ride with the asset: usage term, channels, territory,
  exclusivity, whether whitelisting/paid usage is permitted, expiry date.
- **Re-use flows:** approved creator asset → organic post, → paid ad creative, → website
  gallery (§22), → email, → retail/OOH.
- Every one of those re-use paths has a *different* rights requirement, and the difference
  between "organic re-post" rights and "paid ads in perpetuity" rights is often 3–10× the fee.
  **A system that knows which rights you bought and gates the re-use accordingly saves real
  legal exposure and real money.** `[C1]`

### 15.9 Whitelisting / allowlisting

Big enough for its own section — see §17.

### 15.10 Affiliate links and codes

| Capability | Notes |
|---|---|
| Per-creator unique discount code | §13.3; Shopify/Woo/BigCommerce APIs all support it |
| Per-creator tracked link | Our own short domain + 302 + UTM injection |
| Commission tiers | Flat %, tiered by volume, per-product, new-customer bonus |
| **Commission calculation and payout** | Needs order data + returns/refunds handling. **Refund clawback is where naive implementations break** |
| Creator-facing dashboard | Creators want to see their own earnings; a login surface for them |
| Networks | LTK, ShopMy, Mavely (Later), Amazon Associates, Rakuten, Impact, Levanta (Amazon-focused), Awin, ShareASale, Shopify Collabs |

**Build vs. network:** running your own affiliate program (codes + links + payouts) is
straightforward when you already hold order data. Joining a network is about *supply* (access
to creators). Our position: **build the program mechanics; do not attempt to be a network.**
`[C1 — inference]`

### 15.11 Campaign management and budgeting

| Capability | Notes |
|---|---|
| Campaign object: budget, timeline, goal, creator roster, deliverable matrix | The container everything hangs off |
| Budget tracking: committed vs. paid vs. remaining | Finance cares |
| Cost per deliverable, CPM on delivered reach, cost per engagement, **CPA / ROAS** | The ladder from vanity to revenue |
| Multi-currency | Essential for global rosters |
| Approvals for spend | Ties to the same approval engine |

### 15.12 Reporting

- Per-campaign, per-creator, per-deliverable, per-platform.
- **Client-ready export** (agency requirement — see file `01` on white-label reporting).
- Benchmarks: how did this creator perform vs. their own baseline, and vs. the roster median?
  (Performance *relative to the creator's own norm* is the metric that actually predicts
  repeat-booking value and almost nobody surfaces it.) `[C1 — inference]`

---

## 16. Platform-native creator marketplaces

These matter because they are **free, first-party, and permission-bearing** — they solve the
data-quality problem that scraped databases cannot.

### 16.1 TikTok Creator Marketplace (TTCM)

`[C2/C3]`

| Aspect | Detail |
|---|---|
| What | TikTok's official brand↔creator marketplace: discovery with **first-party** audience data, campaign briefs, creator invitations, content approval, and performance reporting |
| Distinct from | TikTok Shop Affiliate (§4.4) — different system, different creators, different economics |
| **TTCM Open API** | Exists as a **partner program** — approved partners integrate TTCM discovery/campaigns into their own product `[C2 — the program exists; current access criteria UNVERIFIED]` |
| Access | Partner application; not self-serve `[C3]` |
| Value | First-party audience demographics and *actual* video view data — qualitatively better than scraped estimates `[C1]` |
| Spark Ads tie-in | TTCM campaigns can carry ad-authorization for Spark Ads (§17.2) |

**Our call: apply for TTCM Open API partner status early.** It is a long lead time, it is free
data, and it is a legitimacy marker. `[C1 — inference]`

### 16.2 Instagram / Meta Creator Marketplace

`[C2/C3]`

| Aspect | Detail |
|---|---|
| What | Discovery + partnership messaging inside Meta Business Suite/Ads Manager; creators opt in from the IG app |
| **Partnership Ads Hub** | Where creators approve brands to promote their content (§17.1) |
| API | **No third-party API for the marketplace itself.** The API surface that matters is the **Branded Content / Partnership Ads permissions** and the ad-creative fields `[C2 — high confidence]` |
| Availability | Market-limited; expanded gradually `[C3]` |

**Consequence:** we cannot embed Meta's creator marketplace. We *can* automate everything
around it — tracking which creators have granted partnership permissions, when those
permissions expire, and which posts are eligible to promote (§17.4). **That gap-filling is
more valuable than the marketplace itself.**

### 16.3 YouTube BrandConnect

`[C3 — status uncertain]` YouTube's brand-creator marketplace has been narrowed in scope
repeatedly and its availability is limited. **Treat as not-integrable.** Recall is not
reliable enough here to state whether it is fully wound down as of 2026 — flagged for
re-verification (§44).

### 16.4 Others

| Program | Status `[C3]` |
|---|---|
| **Amazon Creator Connections** | Active brand↔creator commission program inside Amazon Ads/Seller ecosystem |
| **Snapchat Creator Collab / Public Profiles** | Limited; Creator Collab Ads permissions matter for whitelisting |
| **Pinterest Creator programs** | Repeatedly restructured; Creator Fund ended; paid-partnership tools exist |
| **X Amplify / Creator monetization** | Ads-adjacent; not a marketplace |
| **LinkedIn** | No creator marketplace; **Thought Leader Ads** is the relevant primitive (§17.3) |

---

## 17. Whitelisting / allowlisting mechanics

**Definition:** running paid ads *from the creator's handle* (or with the creator's identity
attached), rather than from the brand's account. It consistently outperforms brand-handle
creative and it is now standard practice. It is also **the most operationally broken part of
influencer marketing** — permissions are granted in app UIs, expire silently, and nobody
tracks them. `[C1]`

### 17.1 Meta — Partnership Ads (formerly Branded Content Ads)

`[C2/C3]`

**Two grant mechanisms:**

1. **Account-level permission.** The creator goes to Instagram → Settings → Creator/Business
   tools → **Partnership ads** → "Approve brands to promote your content" and adds the brand.
   Optionally also grants permission to promote *any* of their content, and can extend to the
   brand's ad partners/agencies. Persistent until revoked. `[C2]`
2. **Partnership Ad Code.** The creator opens a specific post → generates a **code** → sends it
   to the brand → the brand pastes it into Ads Manager to promote *that one post*. Introduced
   to allow promotion without a standing account-level relationship. **Codes have a validity
   window** `[C3 — exact duration UNVERIFIED]`.

**API surface `[C2, needs verification]`:**
- The permission relationship is exposed around **`branded_content_ad_permissions`** on the
  business/IG user edges, and creator-side approval lists.
- Ad creative fields relevant to creator content: `object_id`, `instagram_user_id`,
  `source_instagram_media_id` / `effective_instagram_media_id` (promoting an existing organic
  post), and branded-content/partnership designation on the creative.
- Promoting an existing organic post as an ad is the **"boost"** primitive Vista already
  exposes (file `01` §6.10); the *partnership* variant is the same mechanic with a creator
  identity attached.

**Also relevant:** the creator must tag the brand as a **paid partner** on the organic post
for branded-content disclosure and for the brand to receive insights (§15.7).

### 17.2 TikTok — Spark Ads

`[C2]` — mechanically the cleanest of the three, and the most automatable.

**Creator flow:** TikTok app → Profile → Settings and privacy → Creator tools → **Ad settings /
Ad authorization** → toggle on → select the video → **generate a video authorization code**,
choosing a duration (commonly **7 / 30 / 60 / 365 days**) `[C2]`.

**Brand flow:** paste the code in Ads Manager → Assets → Creative → Spark Ads → the video
becomes available as an ad creative, running **from the creator's handle**, with likes,
comments and follows accruing to the creator's real post.

**API flow `[C2]`:**
- `POST /open_api/v1.3/tt_video/authorize/` — redeem the creator's auth code against the
  advertiser, binding the video.
- `POST /open_api/v1.3/identity/create/` and `GET /open_api/v1.3/identity/get/` — manage the
  ad identity; Spark Ads use `identity_type: TT_USER` (vs `CUSTOMIZED_USER` for brand-owned).
- Ad creation then references `identity_type`, `identity_id`, `identity_authorized_bc_id`
  (for Business Center) and **`tiktok_item_id`** (the organic video ID).

**The killer detail nobody handles:** **authorization codes expire.** A 30-day authorization
on a top-performing Spark Ad silently kills the ad when it lapses, mid-campaign, often
mid-scale. **An expiry tracker with proactive re-authorization requests to the creator is a
feature with immediate, quantifiable value and it is trivial to build once you hold the
authorization records.** `[C1 — inference, high confidence this is unshipped]`

### 17.3 LinkedIn — Thought Leader Ads

`[C2/C3]`

- Sponsor an *individual member's* post (employee or executive) as an ad from the brand's ad
  account.
- The member receives a permission request and must approve.
- Supported in the LinkedIn Marketing API via creatives referencing the member's post URN with
  the sponsoring ad account `[C2 — verify exact creative shape]`.
- **Strategically important because it is the bridge between employee advocacy (§28–32) and
  paid social (§33–37).** B2B brands consistently find employee/executive posts outperform
  brand posts; Thought Leader Ads let you put budget behind that. **A tool that runs advocacy
  *and* can amplify the best advocate posts as Thought Leader Ads is a B2B story nobody
  tells.** `[C1 — inference]`

### 17.4 Cross-platform: the permission ledger

The unifying feature:

| Field | Meta | TikTok | LinkedIn | Pinterest | Snap |
|---|---|---|---|---|---|
| Grant type | Account-level or per-post code | Per-video auth code | Per-post approval | Paid-partnership tag | Public Profile permission |
| Expiry | Code-level `[C3]`; account-level until revoked | **7/30/60/365 days** | Per-post | n/a | n/a |
| Revocable by creator | Yes | Yes | Yes | Yes | Yes |
| API-observable | Partially `[C2]` | Yes | Partially | Weak | Weak |

**Ship:** a single "Creator Permissions" ledger showing, per creator per platform: what is
granted, what it covers, when it expires, which live ads depend on it, and a one-click
"request renewal" that DMs/emails the creator with instructions. Add a **hard alert when a
live ad's underlying permission expires in <7 days**. `[C1 — inference; the highest
value-to-effort ratio item in Part III]`

---

## 18. Creator payments and global payouts

**This is the module that makes the product sticky and the module most likely to sink it if
built naively.** `[C1]`

### 18.1 What "paying creators" actually involves

| Requirement | Detail |
|---|---|
| **Payee onboarding** | Identity, bank/wallet details, country, currency |
| **Tax forms** | US: **W-9** (domestic), **W-8BEN / W-8BEN-E** (foreign). Collected *before* payment |
| **Tax reporting** | US: **1099-NEC** for contractor payments; **1099-K** if you are a payment facilitator. EU: **DAC7** |
| **Sanctions / AML screening** | OFAC and equivalent lists |
| **Multi-currency + FX** | Creators want local currency; FX spread is a real cost |
| **Payment methods** | ACH, SEPA, local rails, PayPal, Wise, Payoneer, sometimes crypto |
| **Approval workflow** | Deliverable accepted → invoice → approval → payment |
| **Reconciliation** | Payment ↔ campaign ↔ deliverable ↔ GL code |
| **Refund/clawback** | Creator didn't deliver, or affiliate order was refunded |

### 18.2 The regulatory line you must not cross

If **we** hold funds and pay creators, we are likely a **money transmitter** (US state-by-state
MTLs) or an EU **payment institution**. That is a licensing regime measured in years and
millions. `[C1 — directionally certain; get counsel]`

**Therefore: never touch the money.** Two acceptable architectures:

| Architecture | Mechanism | Trade-off |
|---|---|---|
| **A. Embedded payout provider (recommended)** | Tipalti / Trolley / Wise Platform / Stripe Connect executes payments; funds move customer→provider→creator. We orchestrate and hold no funds | Provider fees; onboarding friction; still need a DPA |
| **B. Instruct-only** | We generate an approved payables file (CSV/API) the customer's AP system or provider executes | Zero regulatory exposure; less magical UX |

Ship **B** in v1 (a clean, correct payables export is genuinely useful and takes weeks), then
**A** as an upgrade. `[C1 — inference]`

### 18.3 Provider comparison

`[C3 for all pricing — every figure here needs re-verification]`

| Provider | Shape | Coverage (recalled) | Tax handling | Recalled pricing |
|---|---|---|---|---|
| **Tipalti** | Full AP automation + mass payouts | ~190+ countries, ~120 currencies, ~50 payment methods | **W-9/W-8 collection, 1099/1042-S, DAC7** — best in class | Platform fee from ~$149–$500+/mo plus per-transaction; enterprise contracts |
| **Trolley** (formerly Payment Rails) | Creator/marketplace payouts specialist | ~200 countries, ~135 currencies | W-8/W-9, 1099, **DAC7** | Per-payout fee + monthly; creator-economy focused |
| **Wise Platform / Wise Business API** | FX-efficient batch payouts | ~70 countries hold/send, ~40+ currencies | **No tax-form handling** — you must solve it | Low, transparent FX margin. Cheapest FX |
| **Deel** | Contractor management + payments + compliance | 150+ countries | Contracts, misclassification protection, tax forms | ~$49/contractor/mo (contractor plan) |
| **PayPal Payouts API** | Simple mass payouts | Wide | No tax forms | Per-payout fee; batches up to ~15,000 items `[C3]` |
| **Stripe Connect (Express)** | Embedded payouts | 45+ countries | 1099 generation available (US) | ~$2/mo per active account + a % of payout volume `[C3]` |
| **Routable, Nium, Airwallex, Payoneer** | Alternatives | Varies | Varies | — |

**Recommended pairing:** **Trolley or Tipalti** for the tax/compliance rails (this is where the
liability is), with **Wise** as an FX-optimised option for customers who already solve tax
elsewhere. `[C1 — inference; pricing must be re-verified]`

### 18.4 Tax thresholds — a moving target that matters

`[C3 — verify all of this; US thresholds changed materially in 2025]`

- **1099-K** (payment-facilitator reporting): the phased reduction toward $600 was **repealed
  in July 2025** by the reconciliation act, restoring the **$20,000 / 200-transaction**
  threshold. If true, this materially reduces the reporting burden for anyone acting as a
  facilitator.
- **1099-NEC** (nonemployee compensation): historically **$600**; the same 2025 legislation
  raised it to **$2,000** with future indexing, effective for payments made from **2026**.
- **EU DAC7**: platforms that facilitate relevant activities (including sale of goods and
  personal services) must collect and report seller/creator data annually (typically by
  **31 January** for the prior year). **Whether a creator-payment orchestrator is an in-scope
  "platform operator" is a genuine legal question** — this is the single biggest compliance
  landmine in this file. `[C1 — the risk is certain; the answer requires counsel]`
- **UK**: equivalent OECD MRDP reporting rules.
- **VAT/GST**: creator invoices from VAT-registered creators; reverse charge in B2B EU
  cross-border. `08-platform-apis-regional.md` covers the tax/localisation background.

### 18.5 What great looks like

- Creator self-onboards once (tax form + payout method), reusable across all brands on our
  platform → **network effect**: the second brand that hires that creator has zero onboarding.
- Deliverable accepted → payment auto-queued.
- Affiliate commissions accrue continuously; paid on a schedule; **refunds clawed back
  automatically** from the next payout.
- Creator-facing portal showing earnings, tax documents, payment status.
- Full audit trail from campaign → deliverable → approval → invoice → payment → GL export.

**The reusable creator payment profile is the strongest network-effect mechanic available to
us anywhere in this document.** `[C1 — inference]`

---

## 19. Influencer platform pricing intelligence

`[C3 — every figure is recall; treat as order-of-magnitude only. §44 lists these as
top-priority re-verification.]`

| Vendor | Recalled entry price | Recalled typical annual | Model |
|---|---|---|---|
| **Heepsy** | ~$49–$269/mo | ~$600–$3,200 | Self-serve, discovery only |
| **Modash** | ~$199–$599/mo | ~$2,400–$7,200 | Self-serve; API available |
| **HypeAuditor** | ~$399+/mo | ~$5,000–$20,000 | Tiered by seats/reports |
| **Collabstr** | Transaction fee on bookings | Variable | Marketplace take rate |
| **Upfluence** | ~$500–$2,000/mo | ~$8,000–$25,000 | Annual contract |
| **Aspire** | ~$1,000–$2,500/mo | ~$25,000–$60,000 | Annual, seat + feature tiers |
| **GRIN** | ~$1,000–$2,500/mo | ~$25,000–$40,000 | Annual, often 12-month minimum |
| **Traackr** | — | ~$25,000–$60,000 | Annual |
| **Captiv8** | — | ~$30,000–$80,000 | Annual |
| **CreatorIQ** | — | ~$36,000–$100,000+ | Annual, enterprise |
| **Sprout Tagger** | — | **≈$21,431 average** `[from file 03, S-sourced]` | Separate purchase |
| **Later Influence** | — | Enterprise, often with managed services `[file 03]` | Annual |

**The pricing shape to notice:** there is a **desert between ~$7,000/yr and ~$25,000/yr**.
Below it: discovery-only tools with no workflow. Above it: full platforms with annual
contracts and onboarding fees. **A complete creator workflow — discovery via partnership APIs,
CRM, briefs, contracts, seeding, payouts, attribution — priced at $500–1,200/month and bundled
with the SMM tool the customer already pays for, lands precisely in that desert.** That is the
commercial thesis of this entire file. `[C1 — inference from C3 inputs; the *shape* is more
reliable than the numbers]`

---

## 20. Build / buy / partner call for Part III

| Module | Call | Reasoning |
|---|---|---|
| Discovery database | **BUY** (Modash/HypeAuditor API) + **BUILD** the two proprietary modes (§15.1) | Legal exposure + cost of crawling |
| Fraud/brand-safety screening | **BUILD** with modern models | Now cheap; differentiating |
| Creator CRM / outreach | **BUILD** | Core; leverages our inbox |
| Briefs / approvals | **BUILD** (extends existing approval engine) | Reuse |
| Contracts / e-sign | **PARTNER** (Dropbox Sign/DocuSign) + **BUILD** the structured rights object | Signature is commodity; rights data is the asset |
| Seeding | **BUILD** on Shopify/TikTok Shop APIs | Direct from §10 |
| Payments | **BUY** (Trolley/Tipalti), **BUILD** the orchestration | Regulatory |
| Whitelisting ledger | **BUILD** | Unshipped; high value (§17.4) |
| Affiliate mechanics | **BUILD** | We hold order data |
| Marketplaces (TTCM) | **PARTNER** (apply) | Free first-party data |

---
---
# PART IV — UGC

## 21. Rights management and the consent evidence chain

### 21.1 The workflow every vendor implements

1. **Discover** candidate UGC: brand mentions, tagged posts, hashtag posts, review photos.
2. **Request permission** from the author.
3. **Capture consent** with evidence.
4. **Store** the asset with rights metadata.
5. **Use** it — website gallery, ads, organic re-post, email, packaging.
6. **Expire / revoke** when the term ends or the author withdraws.

Steps 1, 2 and 6 are where the API reality bites.

### 21.2 Discovery — what the APIs actually allow

`[C2 unless marked]`

| Source | Mechanism | Constraint |
|---|---|---|
| **Instagram tagged media** | `GET /{ig_user_id}/tags` — media where the business account was **@-tagged** | Reliable. The best source |
| **Instagram mentions** | Mentions in captions/comments via the mentions webhook + `/{ig_user_id}/mentioned_media` / `mentioned_comment` | Requires webhook subscription |
| **Instagram hashtag search** | `GET /ig_hashtag_search` → `GET /{ig_hashtag_id}/top_media` and `/recent_media` | **Hard cap: ~30 unique hashtags per 7-day rolling window per app-user** `[C2 — a real and frequently-hit limit]`. `recent_media` is limited to a recent window (~24h) and returns a bounded page. **Design implication: hashtag portfolios must be budgeted and rotated** |
| **Instagram Stories mentions** | Story-mention webhook when a public account mentions you | 24h availability |
| **TikTok** | Mention/hashtag discovery is weak via official APIs; the Research API is restricted to academics (file `06`) | Practically: manual or via listening vendors |
| **X, Reddit, YouTube** | Search APIs, cost-gated (file `06`/`07`) | — |
| **On-site / review photos** | Reviews platforms (§24) | First-party, cleanest rights |

### 21.3 Permission request — the structural constraint nobody talks about

**You cannot programmatically comment on, or DM, a third party's post on Instagram.** `[C1 —
this is the single most important technical fact in Part IV]`

- The Instagram Graph API permits replying to comments **on your own media**
  (`POST /{ig_comment_id}/replies`) — not commenting on someone else's media.
- Instagram Messaging API permits messaging only users who messaged **you** first, within a
  24-hour window (extendable to 7 days with the human-agent tag) `[C2]`.
- Therefore the classic **"comment `#YesBrand` to give us permission"** flow is executed
  **manually or semi-manually** by every vendor that claims to automate it. What *is*
  automatable is: detecting the reply, parsing it, timestamping it, and archiving the evidence.

**Honest product design:** a **"rights request queue"** that drafts the request text, opens the
post, and lets a human paste-and-send in one or two clicks, then **automatically watches for
the reply** and files the consent record. Do not market it as fully automated. Competitors
that do are either doing it manually behind the scenes or using unofficial automation that
risks account bans. `[C1]`

### 21.4 The consent evidence chain — our differentiator

What a legally useful consent record contains:

| Field | Why |
|---|---|
| Author handle + platform user ID | Identity |
| The original post URL + a stored copy of the media + its hash | Proof of what was licensed |
| The exact request text sent, with timestamp | Proof of the offer |
| The author's affirmative reply, verbatim, with timestamp + screenshot/permalink | Proof of acceptance |
| The **terms URL and a stored snapshot of those terms** at the moment of consent | Proof of *what* they agreed to — terms change; the snapshot is essential |
| Granted scope: channels (organic / paid / web / email / print), territory, **term/expiry**, exclusivity, whether attribution is required | The actual licence |
| Revocation record if withdrawn | Withdrawal handling |
| Minor-status check | Consent from minors is invalid in most jurisdictions |

**Then the part nobody does: enforce it downstream.**
- A gallery widget must stop serving an asset whose licence expired.
- The composer must **block** scheduling a post using an expired asset.
- The ad-creative sync must **flag** live ads built on expiring assets (this is the same
  machinery as the whitelisting expiry ledger, §17.4 — **build it once, use it twice**).
- A revocation must propagate to every surface within a defined SLA and produce an audit
  record proving it did.

Hashtag-based implied consent ("post with #ShareYourStyle and you agree to our terms") is
**weak** — courts and regulators have not been kind to implied-licence theories, and GDPR
consent must be specific, informed and freely given. **Explicit reply-based consent with a
terms snapshot is the defensible standard.** `[C1 — directionally certain; not legal advice]`

### 21.5 Rights for *paid* usage specifically

The most expensive mistake brands make is running a UGC/creator asset as a paid ad without
paid-usage rights. Practical rules to encode:
- Organic re-post rights ≠ paid usage rights ≠ whitelisting rights (running from *their*
  handle) ≠ perpetual rights ≠ non-social rights (web/OOH/retail).
- Music: a creator's post using licensed platform audio **cannot** legally be lifted into a paid
  ad — platform music licences typically cover organic use only. **A "this asset contains
  detected audio; paid usage may be restricted" warning is a genuinely valuable, buildable
  check.** `[C1 — the constraint is real; automated audio detection is a v2 feature]`
- People appearing in the content who are not the author need their own releases.

---

## 22. UGC galleries and on-site shoppable galleries

### 22.1 Vendor landscape

`[C3 for commercial detail]`

| Vendor | Origin / owner | Notes |
|---|---|---|
| **Bazaarvoice** | Independent (PE-owned); absorbed **Curalate** (2020) | The heavyweight. Reviews + UGC + **retail syndication network** (see §24.2) |
| **Pixlee TurnTo** | **Emplifi** (2022) | UGC + reviews inside a social suite — the closest analogue to our thesis |
| **Stackla** | **Nosto** (2022) | UGC + personalisation/merchandising |
| **Yotpo Visual UGC** | Yotpo | Bundled with reviews/loyalty/SMS |
| **Flowbox** | Independent (Sweden); absorbed Photoslurp | EU-strong |
| **Taggbox / Tagbox / Tagshop** | Independent (India) | Cheap, self-serve, broad social-wall + shoppable gallery |
| **TINT** | Filestack lineage | Enterprise social walls + UGC |
| **Olapic** | **Social Native** (2020) | Legacy enterprise |
| **Walls.io, Curator.io, EmbedSocial, Juicer, Elfsight** | Independent | **Social wall commodity tier — $10–100/mo** |
| **Dash Social, Later** | SMM vendors with UGC modules | Partial |

### 22.2 Feature anatomy

| Layer | Capabilities |
|---|---|
| **Collection** | Hashtag, mention, tag, direct upload, review photos, email, creator submissions |
| **Moderation** | Manual queue; AI filters for nudity/violence/competitor logos/off-brand; sentiment; auto-approve rules |
| **Rights** | §21 |
| **Tagging** | Products (SKU) per asset, campaign, theme, person |
| **Display** | Homepage carousel, PDP gallery ("shop the look"), category pages, dedicated gallery page, in-cart, email blocks, in-store screens |
| **Shoppability** | Asset → tagged SKUs → add-to-cart or PDP link, ideally without leaving the page |
| **Personalisation** | Show UGC featuring products related to the viewer's session (Nosto/Stackla's angle) |
| **Analytics** | Gallery impressions, engagement, **CTR, conversion rate of UGC-exposed vs. non-exposed sessions, revenue per visitor uplift** |
| **Delivery** | JS embed, CDN, lazy-load, Core Web Vitals impact, headless API |
| **Syndication** | Push UGC to retailer PDPs (Bazaarvoice's moat) |

### 22.3 The measurement claim that sells this category

Vendors sell on "visitors who interact with UGC convert X% better". **This is almost always a
correlational, self-selected comparison** — people who scroll to and click a gallery are
already high-intent. The honest version is an **A/B or holdout test** (gallery on vs. off).

**Shipping a built-in holdout test for the gallery would be a credibility differentiator** and
costs little: serve the gallery to 90% of sessions, suppress for 10%, compare conversion.
`[C1 — inference; I am not aware of a vendor doing this by default]`

### 22.4 Our call

- **Build** the gallery/embed layer. It is a small amount of work (a JSON API + a JS widget +
  a CDN) on top of the rights and asset infrastructure we need anyway.
- It creates a **pixel on the merchant's website** — which we also want for attribution (§13).
  One integration, two payoffs.
- **Do not** build retailer syndication (§24.2). That is a network business with a decade of
  retailer contracts behind it.

---

## 23. Creator UGC marketplaces (content-as-a-service)

**Distinct from influencer marketing:** you are buying *content*, not *distribution*. The
creator does not post it; you get the files and run them as ads. This has become the dominant
way performance marketers source creative for Meta/TikTok. `[C1]`

`[C3 for all pricing]`

| Vendor | Model | Recalled pricing |
|---|---|---|
| **Billo** | Marketplace for UGC video; brief in, videos out | From ~**$99/video**, higher for longer/complex; subscription tiers |
| **Insense** | UGC + **creator whitelisting for ads** + creator marketplace | Subscription from ~$400–$1,200/mo `[C3]` |
| **Trend.io** | Curated UGC creators | Per-content packages, ~$100–$500/piece `[C3]` |
| **JoinBrands** | Marketplace, UGC + posting options | Per-content |
| **Cohley** | Content generation at scale, enterprise-ish | Annual contracts |
| **minisocial** | Micro-influencer UGC bundles | Package pricing, ~$3k+ per campaign `[C3]` |
| **Twirl, Bounty, Clip** | Long tail | — |
| **Fiverr / Upwork** | Generalist substitute | Per-gig |

**Why this matters to us:** creative volume is now the primary lever in paid social
performance (§36). A brand running Meta/TikTok ads needs **dozens of creative variants per
month**. The workflow — brief → creator matching → content delivery → rights → ad upload →
performance feedback → re-brief the winners — is a loop, and **the feedback leg is broken
everywhere**: the UGC marketplace never learns which video performed.

**We would hold both ends** (the brief and the ad performance data), which makes
"here are the three creative attributes that correlate with your best-performing videos, now
brief for more of those" a feature only we could ship. `[C1 — inference; strong]`

**Build/partner:** do not become a UGC marketplace (supply acquisition is a different
business). **Integrate** with Billo/Insense/Trend if they have APIs (`UNVERIFIED` whether they
do), and build the brief→rights→ad→feedback loop natively for creators the customer already
has.

---

## 24. Reviews and ratings adjacency

### 24.1 Why it is in this file

Review photos and videos are the highest-volume, cleanest-rights UGC a brand owns — the
customer submitted them directly with terms accepted at submission. Vista already has a
**Reviews & Reputation** module covering 8 review sources (file `01` §6/§8), but that is
*local/business* review management (Google, Yelp, Facebook), **not product reviews**. These
are different markets.

| | Business reviews | Product reviews |
|---|---|---|
| Sources | Google Business Profile, Yelp, Facebook, TripAdvisor, app stores | On-site (Yotpo, Okendo, Judge.me, Loox, Stamped, Junip, Reviews.io, Bazaarvoice) |
| Buyer | Multi-location marketing / reputation | E-commerce merchandising |
| Value | Local SEO, reputation | Conversion rate, ad extensions, UGC supply |

### 24.2 Vendors and the syndication moat

`[C3]`

| Vendor | Notes |
|---|---|
| **Bazaarvoice** | Enterprise; **retail syndication network** — a brand's reviews appear on Walmart/Target/Best Buy PDPs. This is a decade-deep contract moat |
| **Yotpo** | Reviews + loyalty + SMS + subscriptions; mid-market |
| **Okendo** | Shopify-native, strong on attribute reviews + surveys |
| **Judge.me / Loox / Stamped / Junip** | Shopify SMB tier; **$15–$100/mo** |
| **Reviews.io, Trustpilot** | Trust-badge oriented |

### 24.3 Our call

**Partner, do not build.** Integrate to *ingest* review photos/videos as UGC supply (Okendo,
Judge.me, Loox and Yotpo all have APIs `[C3]`), and to surface review content in social
posts. Building a reviews platform means fighting Google Seller Ratings integration, schema
markup, syndication contracts and moderation at scale for a market with strong incumbents at
every price point. `[C1 — inference]`

---
---

# PART V — CREATOR MONETIZATION TOOLING

> **Framing note:** this Part is about tools *creators* use to make money, as opposed to tools
> *brands* use to work with creators. It matters for two reasons: (1) creators are a possible
> second customer segment for us, and (2) understanding creator economics makes us better at
> serving brands who negotiate with them. It is **strategically secondary** to Parts II–IV.

## 25. Link-in-bio economics

### 25.1 The business model

Link-in-bio is a **freemium land-grab with a very low conversion rate to paid** — Linktree's
scale (tens of millions of registered users) versus its revenue implies **single-digit-percent
paid conversion and low-single-digit-dollar blended ARPU** `[C3 — inference from publicly
discussed figures; treat as illustrative]`.

The monetization ladder:

| Stage | Mechanism | Take |
|---|---|---|
| 1 | Free page | $0 — acquisition |
| 2 | Subscription for customisation/analytics/no-branding | $5–$30/mo |
| 3 | **Commerce take rate** on digital products/tips/checkout | 0–9% depending on tier |
| 4 | Email/SMS list building → adjacent product | — |
| 5 | Affiliate/marketplace monetization of outbound links | Rev-share |

**Stage 3 is where the real money is** and why every link-in-bio vendor added a store. It is
also why **an SMM tool that already has the customer's payment relationship can offer a 0%
take rate as a weapon.** `[C1 — inference]`

### 25.2 What this means for Vista Page and for us

File `01` §12 establishes Vista Page is already a micro-CMS (blocks, drag-and-drop,
Calendly/Typeform embeds, themes, **custom domain with free SSL**, Linktree importer). The
gaps to close, in order of value:

1. **Catalog-backed product blocks** (live price/stock from §10).
2. **Per-link attribution IDs** end-to-end into the order (§13.2).
3. **Pixel hosting** (Meta/TikTok/Pinterest) so bio traffic becomes retargetable — trivially
   easy, disproportionately valuable.
4. **Auto-linked feed** (post → products).
5. **Email/SMS capture with ESP sync** (§27).
6. **Cart permalinks with pre-applied discount codes** (§12.2).
7. **A/B testing of page layouts** — nobody in link-in-bio does this well.

Each is days-to-weeks of work and each converts a commodity feature into a revenue instrument.

---

## 26. Digital products, memberships and take rates

`[C3 for all rates — these change and several changed recently]`

| Platform | What | Recalled take rate |
|---|---|---|
| **Gumroad** | Digital products | ~**10%** flat (simplified from the old tiered model) |
| **Patreon** | Memberships | ~**8%** (Pro) / ~**12%** (Premium) on newer plans; legacy 5% Lite tier phased out. Plus payment processing |
| **Substack** | Paid newsletters | **10%** + Stripe fees |
| **beehiiv** | Newsletters | **Subscription SaaS, 0% of subscriptions** — the explicit attack on Substack |
| **Ko-fi** | Tips/memberships | 0% on the free tier (donations); ~5% on shop/commissions `[C3]` |
| **Buy Me a Coffee** | Tips | ~5% |
| **Whop** | Digital/community commerce marketplace | ~3% + payment fees `[C3]` |
| **Circle** | Community + courses | SaaS $49–$399/mo + transaction fees on lower tiers |
| **Kajabi** | Courses/membership all-in-one | SaaS ~$69–$399/mo, 0% transaction on most tiers |
| **Teachable / Podia / Thinkific** | Courses | SaaS + transaction fee on lower tiers |
| **Memberful / Memberstack** | Membership infrastructure | SaaS + small % |
| **Stan Store** | Creator storefront | SaaS ~$29/$99 per month |
| **Shopify** | Anything | SaaS + payment processing; 0% platform take |

**The structural trend `[C1]`:** take rates are compressing toward zero as SaaS-fee models
(beehiiv, Kajabi, Shopify, Stan) attack percentage-of-revenue models (Substack, Patreon,
Gumroad). Any new entrant charging a percentage in 2026 is swimming against the tide.

**Implication for us:** if we ever add creator commerce, charge SaaS, not a take rate.
`[C1 — inference]`

---

## 27. Newsletter and owned-audience integration

### 27.1 Why an SMM product should care

The single most consistent piece of advice in the creator economy is "own your audience" —
because reach on rented platforms is throttled and accounts get banned. The practical
expression is **email and SMS**.

For a *brand* customer, the equivalent insight is: **social should feed the owned list**, and
almost no SMM tool measures whether it does.

### 27.2 Integrations worth building

| Platform | Why | API |
|---|---|---|
| **Klaviyo** | Dominant in Shopify e-commerce | Well-documented REST API, profiles + events + lists `[C2]` |
| **Kit** (formerly ConvertKit) | Creator-native ESP | REST API |
| **beehiiv** | Fast-growing newsletter platform | API `[C3]` |
| **Mailchimp** | SMB default | Marketing API v3 |
| **Substack** | Large but **API-poor** `[C3]` | Limited |
| **Attentive / Postscript** | SMS in e-commerce | APIs exist |
| **HubSpot / Salesforce** | B2B | Well-documented |

### 27.3 The features that follow

1. **Social→list attribution**: which post/creator/link drove list signups (using §13.2 link
   IDs + ESP subscriber source).
2. **Audience sync**: push email list segments to Meta/TikTok/LinkedIn **Custom Audiences** for
   retargeting and lookalikes (requires hashed-PII handling — a compliance surface).
3. **Content repurposing**: newsletter → social carousel and back.
4. **Unified "owned audience growth" metric** across followers, subscribers, SMS opt-ins.
5. **Cross-channel suppression**: don't retarget people who already bought.

Item 1 is the one to lead with: **"social drove 412 email signups worth $18,300 in
downstream revenue"** is a sentence no scheduler can produce today. `[C1 — inference]`

---
---

# PART VI — EMPLOYEE ADVOCACY AND BRAND AMBASSADORS

> **Context:** Vista Social already ships a thin advocacy module (curated content,
> leaderboards, EMV, Slack alerts) at **free for 3 advocates / $199/mo for 25 employees**
> (file `01` §4.4, §21). Sprout sells advocacy from **~$999/mo** and Hootsuite gates it behind
> Enterprise (file `03`). So the category is already priced across a **5× range** for what is
> substantially the same feature set — which tells you the feature is undifferentiated and the
> pricing is a packaging decision. `[C1 — inference from files 01/03]`

## 28. Vendor landscape

`[C3 for all commercial detail]`

| Vendor | Positioning | Notes |
|---|---|---|
| **EveryoneSocial** | Pure-play, enterprise; strong in tech/finance sales-led advocacy | Per-user pricing with meaningful seat minimums |
| **Sociabble** | Pure-play, European, strong on **gamification + CSR/social-good** angles + internal comms | Multilingual; large enterprise deployments |
| **Hootsuite Amplify / "Parliament"** | Suite module (file `03` §4: one of the four Social OS apps) | Connectors: **Proofpoint Threat Response, TINT, UpContent, Venn** (file `03`) |
| **DSMN8** | "The Employee Influencer Platform" — emphasises employees *creating*, not just sharing | Content-creation-forward; leaderboards |
| **PostBeyond** | Acquired by **Influitive** (2021); **status uncertain in 2026** `[C3]` | Legacy |
| **Bambu by Sprout Social** | **Retired**; folded into Sprout's Employee Advocacy product | A cautionary tale about standalone advocacy |
| **GaggleAMP** | Gamification-heavy; "activities" model (not just share — comment, like, answer a poll) | The activities model is a genuinely different design |
| **Clearview Social** | Professional services (legal, accounting, finance); **"Rank and Schedule"** AI ordering | Underrated in its niche |
| **Haiilo** | Smarp + COYO + Jubiwee merger; employee comms + advocacy | Comms-led |
| **Firstup** | SocialChorus + Dynamic Signal merger; enterprise comms | Comms-led |
| **Staffbase** | Internal comms (acquired Bananatag); advocacy module | Comms-led |
| **Ambassify** | Ambassador programs (employees *and* customers) | Closest to the unified-advocate thesis |
| **Oktopost** | B2B social management with advocacy built in | B2B-native |
| **Sprinklr Advocacy** | Suite module | Enterprise |
| **LumApps, Simpplr, Workvivo (Zoom)** | Intranet-led with advocacy features | Adjacent |
| **Denim Social** | **Financial services compliance-first** social publishing for advisors/loan officers | Regulated vertical specialist |
| **Hearsay Systems** | Advisor social + compliance; **acquired by Yext (announced late 2024)** `[C3 — verify]` | Regulated vertical specialist |

### 28.1 The two-market split that explains the category

There are really **two** employee-advocacy markets and they need different products:

| | Reach/marketing advocacy | Regulated/social-selling advocacy |
|---|---|---|
| Buyer | Marketing / comms | Compliance + sales enablement |
| Goal | Reach, EMV, employer brand | Advisor-level lead generation within the rules |
| Vendors | EveryoneSocial, Sociabble, Amplify, DSMN8, GaggleAMP | Denim Social, Hearsay, Proofpoint-integrated suites |
| Deal size | $10k–$80k | **$100k–$500k+** |
| Blocker | Employee participation | **Pre-approval, supervision, archiving, lexicon monitoring** |

The regulated half has **5–10× the ACV** and far higher switching costs. Almost nobody in the
SMM category serves it, because it requires compliance machinery
(`11-compliance-security-global.md`) rather than social features. `[C1 — inference]`

---

## 29. Feature anatomy

### 29.1 Content curation and supply

| Capability | Notes |
|---|---|
| Curated feeds / "streams" by topic or department | Table stakes |
| **RSS + third-party content curation** (UpContent, Venn, Feedly) | Solves the "we don't have enough content" problem that kills most programs |
| Auto-suggest from the brand's own scheduled posts | **We get this free** — our publishing calendar is the supply |
| Suggested copy variants per advocate | AI |
| **Personalised rewrite in the advocate's own voice** | The single biggest lever on authenticity and reach — identical copy from 40 employees gets algorithmically suppressed `[C1]` |
| Mandatory vs. optional content | Regulated use |
| Expiry dates on shareable content | Prevents stale sharing |

### 29.2 Distribution to advocates

Email digest, **Slack**, **Microsoft Teams**, mobile app, browser extension, SMS. Slack/Teams
is where participation actually happens; email digests decay fast. Vista has Slack alerts
already (file `01` §21).

### 29.3 Gamification

| Mechanic | Notes |
|---|---|
| Points per action (share, click generated, comment, new follower) | The core loop |
| **Leaderboards** — global, by team, by period | Universally implemented, universally gamed |
| Badges, levels, streaks | Retention |
| Rewards: gift cards, charity donations, swag, internal recognition | **Tax implications for cash-equivalent rewards** — a real thing to flag |
| Challenges/campaigns with time windows | Bursty engagement |
| **Anti-gaming controls** | Rarely implemented; needed once rewards are real |

**Honest assessment:** gamification produces a short participation spike and long decay. The
programs that survive are the ones where sharing is **tied to a job outcome** (sales reps
getting leads) rather than points. Design for the sales-enablement case: show the advocate
*their own* pipeline influence, not a leaderboard rank. `[C1 — inference]`

### 29.4 Measurement

| Metric | Notes |
|---|---|
| Shares, reach, clicks, engagement | Basic |
| **EMV** | Same caveats as §15.7 — expose the coefficients |
| Participation rate (MAU / eligible employees) | **The metric that predicts program death** — below ~15% it is failing |
| Clicks → sessions → conversions | Requires link attribution (§13.2) |
| **Attributed pipeline/revenue** | The regulated/B2B buyer's actual question |
| Recruiting: applications sourced from advocacy | A separate, real budget (talent acquisition) |

### 29.5 Administration

Roles (admin, curator, advocate, group leader), department/region groups, **SSO (SAML) and
SCIM provisioning** (essential above ~500 seats), HRIS sync (Workday/BambooHR) to
auto-provision and auto-deprovision, per-group content targeting, approval of advocate-created
content, and **offboarding** (revoke access, and know which posts were made by a now-departed
employee).

---

## 30. Compliance for regulated industries

**This is where advocacy becomes a $100k+ product rather than a $199/mo feature.** `[C1]`

### 30.1 The regimes

`[C2/C3 — cite carefully; this is a legal domain]`

| Regime | Who | Requirement that bites |
|---|---|---|
| **FINRA Rule 2210** | Broker-dealers | **Retail communications generally require principal pre-approval** before use; content standards (fair and balanced, no exaggerated claims); recordkeeping |
| **FINRA Regulatory Notice 17-18** (and 10-06/11-39 lineage) | Broker-dealers | Guidance on social media, "adoption and entanglement" — a firm can become responsible for third-party content it likes/shares/comments on |
| **SEC Marketing Rule (206(4)-1)** | RIAs | Since **Nov 2022 compliance date**, testimonials and endorsements are permitted **with disclosures** (compensation, conflicts) — this *opened* social for advisors and is why the category grew |
| **SEC Rule 17a-4 / FINRA 4511** | Broker-dealers | Recordkeeping, historically **WORM** storage; retention periods (commonly 3–6 years, first 2 easily accessible) |
| **Off-channel communications enforcement** | Financial firms | The 2022–2024 SEC/CFTC sweep produced **$2B+ in penalties across 100+ firms** for unarchived business communications `[C3 on the exact total]`. **This single fact is the best sales argument in the category** |
| **FCA (UK) financial promotions** | UK firms | Approval of financial promotions; the **FCA's 2024 finfluencer crackdown** |
| **MiFID II** | EU investment firms | Recording of communications |
| **HIPAA** | Healthcare | No PHI; patient photo releases |
| **FDA / OPDP** | Pharma | Fair balance, risk information, **submission requirements**; the infamous difficulty of one-sided social formats |
| **State bar rules** | Legal | Advertising rules, no claims of specialisation, jurisdictional disclaimers |
| **NCUA/FDIC, TILA/Reg Z, RESPA** | Banking/lending | Disclosure requirements on rate/product mentions |
| **EU AI Act / DSA** | All | Transparency; see `11-compliance-security-global.md` |

### 30.2 The product requirements those regimes imply

| Requirement | Implementation |
|---|---|
| **Pre-approval workflow with a designated principal** | Conditional approval routing (which file `01` §13 says Vista lacks) with a named, auditable approver role |
| **Pre-approved content library** — advocates may share *only* from it | A hard mode where free composition is disabled |
| **Locked copy** vs. **editable with re-approval** | Per-item policy |
| **Lexicon / prohibited-term scanning** | "guaranteed", "risk-free", "best", superlatives, unapproved product names, competitor names |
| **Mandatory disclosures auto-appended** | Per-jurisdiction, per-product disclaimers |
| **Immutable audit trail** | Who approved what, when, what changed |
| **Archiving to a supervision vendor** | **Smarsh, Global Relay, Proofpoint, Theta Lake, Veritas Merge1** — file `03` §2.4 records that Hootsuite has a **formal Smarsh partnership** and **Proofpoint** in-composer checks, and concludes **"nobody in this market ships native WORM-compliant archiving + eDiscovery"** |
| **Supervision review queues with sampling** | Random-sample review of published content |
| **Retention + legal hold + eDiscovery export** | File `03` flags this as an enterprise gate |
| **Disclosure of AI-generated content** | Emerging requirement |

### 30.3 The strategic read

File `03` already established that archiving/supervision is treated by every vendor as a
**partner integration problem, not a build problem**, and that no one ships it natively. That
conclusion holds here. **The correct play is not to build an archive** — it is to:

1. Build **native pre-approval + lexicon + disclosure + immutable audit** (this is *our*
   pipeline, and it is where the differentiation is).
2. Ship **export connectors** to Smarsh/Global Relay/Proofpoint/Theta Lake so the customer's
   existing archive receives our content in their expected format.
3. Market the combination as "compliant advocacy" for financial services — a vertical where
   Denim Social and Hearsay/Yext charge multiples of general-purpose SMM pricing.

This is the single clearest path from a $199/mo advocacy feature to a six-figure ACV.
`[C1 — inference; well supported by file 03]`

---

## 31. Ambassador and customer-advocacy programs

The same machinery, a different population:

| Program type | Population | Compensation | Disclosure |
|---|---|---|---|
| Employee advocacy | Employees | Salary + gamified rewards | **Employment relationship must be disclosed** (FTC) |
| Brand ambassador | Superfans / micro-creators | Product + commission + perks | `#ad`/`#ambassador` |
| Customer advocacy / referral | Customers | Discounts, credits, referral rewards | Referral disclosure |
| Affiliate | Anyone | Commission | `#affiliate` / disclosure |
| Community / super-user | Forum members | Status, access | Varies |

**The insight `[C1]`:** these are the same object with a different `relationship_type` and a
different consent/disclosure profile. Every incumbent ships them as separate products
(advocacy tool + influencer tool + referral tool like Referral Candy/Friendbuy + community
tool). **One "Advocate" object with a relationship type, a compensation model, a disclosure
policy and a rights scope collapses four products into one** — and it means an employee who
becomes a creator, or a customer who becomes an ambassador, does not require re-onboarding.

This is the concrete, buildable expression of the "one contact graph" thesis in §1.3.

---

## 32. Advocacy pricing intelligence

`[C3 — all figures are recall]`

| Vendor | Recalled pricing shape |
|---|---|
| **Vista Social** | **Free for 3 advocates; $199/mo for 25 employees** `[from file 01 — the most reliable figure here]` |
| **Sprout Social Employee Advocacy** | **From ~$999/mo** `[file 03, marked K-stale]` |
| **Hootsuite Amplify/Parliament** | Enterprise-tier unlock; not separately listed `[file 03]` |
| **EveryoneSocial** | Per-user/yr with seat minimums; deals commonly **$20k–$80k/yr** |
| **Sociabble** | Per-user/mo, enterprise minimums |
| **DSMN8** | Tiered by active users, entry around low hundreds/mo |
| **GaggleAMP** | Per-user tiers, entry around $500/mo |
| **Clearview Social** | Per-user/mo, professional-services sized |
| **Denim Social / Hearsay** | **Regulated pricing: $50k–$500k+/yr** |

**Packaging recommendation:** advocacy should be **included** in mid/high tiers (it costs us
little once the contact graph exists, and it drives seat expansion inside the customer), with
the **compliance pack** (§30.2) as the paid upgrade. That directly attacks Sprout's $999/mo
and Hootsuite's Enterprise gate while opening the regulated segment. `[C1 — inference]`

---
---
# PART VII — PAID SOCIAL

> **Positioning discipline before anything else:** we are **not** building a competitor to Ads
> Manager, Smartly, Skai or Madgicx. We are building the **organic→paid seam** — the narrow,
> valuable strip where an organic post, a creator asset, an advocate share or a UGC photo
> becomes paid media, and where paid and organic results are reconciled in one report. Every
> feature below should be tested against that boundary. Crossing it means competing with
> well-funded specialists on their turf with a worse product. `[C1 — inference]`

## 33. Boosting from an SMM tool: what is actually permitted

### 33.1 The baseline: what Vista already does

File `01` §6.10 documents Vista Social's boosting: connect an ad account, saved reusable
**boost configurations** (targeting + budget + duration presets), Meta targeting controls
(include/exclude audiences, interests, work positions, locations, gender, age), a **dark post**
checkbox, calendar filtering of boosted posts, and **Paid Performance** + **Paid vs. Organic**
report types. The file's own assessment: "a real gap-closer... **it is boost-level, not
campaign-manager-level**."

That is exactly the right altitude, and it is **P1 parity** on our checklist. The question for
us is what to add above it.

### 33.2 Network-by-network feasibility of "boost this post"

`[C2/C3]`

| Network | Can a third party boost an organic post via API? | Mechanism |
|---|---|---|
| **Facebook** | **Yes** | Create campaign/adset/ad with an `AdCreative` referencing `object_story_id` (the existing Page post) |
| **Instagram** | **Yes** | `AdCreative` with `instagram_actor_id` + `source_instagram_media_id` / `effective_instagram_media_id`; or promote an eligible IG media |
| **TikTok** | **Yes** — this is Spark Ads | §17.2: `tt_video/authorize` + `identity_type: TT_USER` + `tiktok_item_id`. Works for **the advertiser's own organic posts too**, not just creators' |
| **LinkedIn** | **Yes** | Sponsor an existing organisation post (or a member's post = Thought Leader Ads, §17.3) |
| **Pinterest** | **Yes** | Promote an existing Pin as an ad |
| **X** | **Yes** | Promoted Tweets referencing an existing tweet ID |
| **Snapchat** | Partial | Organic-post promotion is weak; creative is usually purpose-built |
| **Reddit** | **Yes** | Promote an existing post via the Ads API `[C3]` |
| **YouTube** | **Yes** | Google Ads video campaigns referencing a YouTube video ID |

**Every major network supports it.** The differentiation is therefore never "can you boost" —
it is the **rules, guardrails, permissions and reporting around boosting** (§35).

### 33.3 The permission and access reality

The uncomfortable operational truth: to boost, we need **ads-level API access** on each
network, which is a **higher bar** than content publishing (file `05-competitors-dev-oss.md`
documents the general cost/timeline of production API access):

| Network | Extra hurdle beyond publishing access |
|---|---|
| Meta | `ads_management` permission → **App Review**, Business Verification, and **advancing from Development to Standard access tier** |
| TikTok | Separate **Marketing API** app with its own review; Business Center relationships |
| LinkedIn | **Marketing Developer Platform (MDP)** application — historically slow and selective |
| Pinterest | Ads API access tier upgrade |
| X | Separate **Ads API** application on top of a paid API tier |
| Snap | Marketing API app registration |
| Reddit | Ads API partner approval `[C3]` |
| Google Ads | **Developer token** with Basic → Standard access progression |

**Plan for 8–20 weeks of approvals across the set**, and sequence them: Meta and TikTok first
(they carry the volume), LinkedIn next (B2B ACV), the rest opportunistically. `[C1 —
inference; specific timelines UNVERIFIED]`

---

## 34. Ad API teardown, network by network

### 34.1 Meta Marketing API

`[C2 for structure, C3 for all numbers]`

| Aspect | Detail |
|---|---|
| Base | `https://graph.facebook.com/v{XX}.0/` |
| Versioning | Numbered versions roughly quarterly (v19 early 2024 → v20 → v21 → v22 → v23 → v24 …). **~2-year support lifetime per version**; assume v24–v26 is current in Aug 2026 `[C3]` |
| Object hierarchy | Business → Ad Account (`act_{id}`) → **Campaign** (objective, budget if CBO) → **Ad Set** (targeting, budget, schedule, optimisation goal, billing event) → **Ad** (creative) → **AdCreative** |
| Key edges | `/act_{id}/campaigns`, `/adsets`, `/ads`, `/adcreatives`, `/adimages`, `/advideos`, `/customaudiences`, `/insights` |
| **Promoting an organic post** | `AdCreative.object_story_id` = `{page_id}_{post_id}`; for IG, `instagram_actor_id` + `source_instagram_media_id` |
| **Dark posts** | Create a **Page post with `published: false`** via `/{page_id}/feed` and use it as `object_story_id`; or use inline `object_story_spec` on the creative (an "unpublished" creative that never appears on the timeline). **This is what Vista's "Dark post" checkbox does** `[C2]` |
| **Partnership Ads** | §17.1 — creator identity + permission |
| **Insights** | `/{object_id}/insights` with `fields`, `level` (account/campaign/adset/ad), `time_range`, `breakdowns`, `action_attribution_windows`. **Large queries must run as async jobs** (`POST .../insights` returns a `report_run_id` to poll) `[C2]` |
| **Attribution windows** | Default **7-day click + 1-day view**; configurable (1d/7d click, 1d/7d view). Different windows produce materially different numbers — **the report must state its window** `[C1]` |
| **Rate limiting** | Business Use Case (BUC) rate limiting via the **`X-Business-Use-Case-Usage`** response header carrying `call_count`, `total_cputime`, `total_time` as **percentages of the limit** (throttle at 100). The ads-management budget scales with account size — commonly described as a base allowance **plus a per-active-ad term** `[C3 — the exact formula must be re-verified; do not hard-code]` |
| **Access tiers** | **Development** vs **Standard** access for `ads_management`; Standard requires App Review + Business Verification and dramatically raises limits `[C2]` |
| **Ad Rules API** | `/act_{id}/adrules_library` — Meta's own **automated rules** (conditions → actions like pause/scale/notify) evaluated server-side. **Under-used by third parties and directly relevant to §35** `[C2]` |
| **Conversions API (CAPI)** | `POST /{pixel_id}/events` server-side with hashed PII, `event_id` for **deduplication against the browser pixel** `[C2]` |
| **Advantage+ / Andromeda** | Meta's automation stack has progressively removed manual levers (audiences, placements, creative variation). **Strategic consequence: manual campaign management is a shrinking product surface; creative supply and measurement are the growing ones** `[C1 — inference; strongly supported by the direction of travel]` |

### 34.2 TikTok Marketing / Business API

`[C2 for structure, C3 for numbers]`

| Aspect | Detail |
|---|---|
| Base | `https://business-api.tiktok.com/open_api/v1.3/` |
| Hierarchy | Advertiser (`advertiser_id`) → **Campaign** → **Ad Group** → **Ad**. Business Center (`bc_id`) sits above for agencies |
| Key endpoints | `/campaign/create/`, `/campaign/update/`, `/adgroup/create/`, `/ad/create/`, `/ad/get/`, `/report/integrated/get/`, `/file/video/ad/upload/`, `/file/image/ad/upload/`, `/creative/portfolio/`, `/audience/create/`, `/oauth2/access_token/` |
| **Spark Ads** | `/tt_video/authorize/` to redeem a creator auth code; `/identity/create/` + `/identity/get/`; ad creation with `identity_type: TT_USER`, `identity_id`, `tiktok_item_id` `[C2]` |
| **Events API** | `/event/track/` — server-side conversions with `event_id` dedup against the Pixel `[C2]` |
| **GMV Max** | TikTok's automated shopping-campaign product, which absorbed the older Video Shopping Ads / Product Shopping Ads campaign types through 2025 `[C3 — verify current names before building campaign-type pickers]` |
| Reporting | `/report/integrated/get/` with `report_type`, `dimensions`, `metrics`, `data_level` (AUCTION_AD etc.), plus async report endpoints for large pulls `[C2]` |
| Rate limits | Per-endpoint QPS, documented per API; commonly low double digits. **Exact values UNVERIFIED** |
| Access | App in TikTok for Business developer portal; **Basic vs. Advanced** scope tiers with review `[C3]` |
| Auth | OAuth; long-lived `access_token` per advertiser; Business Center delegation for agencies |

### 34.3 LinkedIn Marketing API

`[C2]`

| Aspect | Detail |
|---|---|
| Base | `https://api.linkedin.com/rest/...` with a **`LinkedIn-Version: YYYYMM`** header — **monthly versioning**, versions age out after ~12 months. **This is the highest-maintenance API in the set** `[C1 — the monthly cadence is a real ongoing tax]` |
| Access | **Marketing Developer Platform (MDP)** application; historically slow, selective, and requires a demonstrated use case |
| Hierarchy | `adAccounts` → `adCampaignGroups` → `adCampaigns` → `creatives` |
| Key resources | `/rest/adAccounts`, `/rest/adCampaignGroups`, `/rest/adCampaigns`, `/rest/creatives` (the unified Creatives API that replaced `adCreativesV2`), `/rest/adAnalytics` (finder-based, with pivots), `/rest/dmpSegments` (matched audiences), `/rest/conversions` + `/rest/conversionEvents` (**Conversions API**), `/rest/posts` (Direct Sponsored Content) |
| **Direct Sponsored Content** | Create a post that never appears on the company page — LinkedIn's dark-post equivalent `[C2]` |
| **Thought Leader Ads** | Sponsor a member's post; requires the member's approval (§17.3) `[C2 — exact API shape needs verification]` |
| Analytics | `/rest/adAnalytics?q=analytics` with `pivot`, `dateRange`, `timeGranularity`, `fields`. **Demographic pivots are subject to minimum-threshold suppression** for privacy `[C2]` |
| Rate limits | Daily application- and member-level quotas per endpoint, published in the developer portal. **Exact values UNVERIFIED** |

### 34.4 Pinterest Ads API (v5)

`[C2]`

- Same v5 surface as catalogs (§7.1) — **one integration, two capabilities**, which makes
  Pinterest unusually cheap to support end-to-end.
- Hierarchy: `/v5/ad_accounts/{ad_account_id}/` → `campaigns` → `ad_groups` → `ads`.
- Also: `/audiences`, `/conversion_events` (**Conversions API**), `/reports` (async: POST to
  create a report request, poll for the download URL) `[C2]`.
- Shopping ads consume **product groups** from the catalog (§7.1).
- Access tiers: trial → standard, via app review `[C3]`.

### 34.5 X Ads API

`[C2/C3]`

- Base `https://ads-api.x.com/{version}/` (v12-era in recent recall; **current version
  UNVERIFIED**).
- Hierarchy: account → funding instrument → campaign → line item → promoted tweet.
- Async analytics via `/stats/jobs/accounts/{account_id}`.
- **Access requires a separate Ads API application** on top of the (paid) X API tier.
- **Commercial reality check:** file `01` §4.4 records that Vista Social charges **+$29/profile/
  month** for X purely because of X API costs. Adding X *ads* on top is a cost centre serving a
  shrinking share of client spend. **Recommend: deprioritise X ads entirely.** `[C1 —
  inference from file 01's economics]`

### 34.6 Snapchat Marketing API

`[C2/C3]`

- Base `https://adsapi.snapchat.com/v1/`.
- Hierarchy: organizations → adaccounts → campaigns → **adsquads** → ads → creatives → media.
- **Conversions API** at a separate tracking host (`tr.snapchat.com/v2/conversion`) `[C3]`.
- Catalogs for Dynamic Ads; AR lens creative is the differentiated inventory.
- Relevant mainly for youth-skewed DTC brands.

### 34.7 Reddit Ads API

`[C3]`

- Base `https://ads-api.reddit.com/api/v3/` (recall); hierarchy accounts → campaigns → ad
  groups → ads; posts can be promoted.
- **Conversions API** exists.
- Access requires application/partner approval.
- Rising relevance because of Reddit's search/AI-answer prominence — cross-reference
  `09-ai-frontier.md` on AI-search visibility.

### 34.8 Google Ads API (for YouTube)

`[C2]`

- `googleads.googleapis.com`, versioned (v18/v19/v20 in recent recall; **current version
  UNVERIFIED**), gRPC and REST.
- **Developer token** required, with **Basic → Standard** access levels gating daily operation
  quotas.
- **GAQL** query language for reporting.
- Video campaigns reference a YouTube video ID; linking the YouTube channel to the Google Ads
  account unlocks earned-action reporting and creator-content promotion.
- **Complexity warning:** the Google Ads API is substantially more complex than any other in
  this list. Scope it as its own project, not a follower.

### 34.9 Summary matrix

| Network | Versioning cadence | Boost organic post | Dark posts | Creator identity ads | Conversions API | Access difficulty | Our priority |
|---|---|---|---|---|---|---|---|
| Meta | ~Quarterly, ~2yr life | ✅ | ✅ | ✅ Partnership Ads | ✅ CAPI | High (App Review + BV + tier) | **P0** |
| TikTok | v1.3 stable | ✅ | ✅ | ✅ Spark Ads | ✅ Events API | High | **P0** |
| LinkedIn | **Monthly**, ~12mo life | ✅ | ✅ DSC | ✅ Thought Leader Ads | ✅ | **Very high (MDP)** | **P1 (B2B)** |
| Pinterest | v5 stable | ✅ | — | Partial | ✅ | Medium | **P1** (cheap; shares catalog work) |
| Snapchat | v1 stable | Partial | ✅ | Partial | ✅ | Medium | P2 |
| Reddit | v3 `[C3]` | ✅ | — | ❌ | ✅ | Medium-high | P2 |
| X | v12-era `[C3]` | ✅ | ✅ | ❌ | Limited | High + **paid** | **P3 / skip** |
| Google (YouTube) | ~Quarterly | ✅ | — | Via linked channel | ✅ (offline conv.) | High | P2 |

---

## 35. Organic→paid amplification rules engine

**This is the flagship feature of Part VII.** It is the thing an SMM tool can build that an ads
tool cannot, because it requires owning the organic publishing pipeline. `[C1 — inference]`

### 35.1 The concept

Continuously evaluate published organic content against performance thresholds; when a post
qualifies, automatically (or with one-click approval) promote it — using the right identity,
the right permission, the right budget and the right guardrails.

### 35.2 Rule anatomy

```
WHEN   a post on {networks} is between {2h} and {72h} old
AND    it belongs to {profile group / campaign / content pillar}
AND    engagement_rate > {P75 of this account's last 90 days}
AND    (video: 3s_view_rate > {threshold} OR saves > {threshold})
AND    sentiment on its comments is not negative
AND    the post contains no {restricted terms}
AND    all creative rights are valid for paid usage for ≥ {30} days
AND    (if creator content) a valid whitelisting permission exists and expires in > {14} days
THEN   create {campaign/adset} in {ad account} with {objective}
       budget {amount} capped at {monthly ceiling}
       audience {saved audience or Advantage+}
       identity {brand | creator handle}
NOTIFY {slack channel} and REQUIRE approval if budget > {threshold}
STOP   if CPA > {ceiling} after {spend floor} OR after {N} days
```

### 35.3 The guardrails that make it safe (and saleable)

| Guardrail | Why |
|---|---|
| **Monthly spend ceiling per rule and per account** | The nightmare scenario is a runaway rule. Hard caps, enforced client-side *and* verified against the ad account's daily spend |
| **Human approval above a threshold** | Trust ladder: notify-only → approve-each → fully automatic |
| **Rights validation** (§15.8, §21.4) | Never promote an asset without paid usage rights |
| **Whitelisting-permission validation** (§17.4) | Never build a Spark Ad on an authorization expiring in days |
| **Music/audio check** | §21.5 |
| **Brand-safety re-check at promotion time** | Comment sentiment can turn between publish and boost. **Promoting a post that has become a pile-on is a real and expensive failure mode** |
| **Frequency/fatigue caps** | Don't promote 12 posts about the same SKU |
| **Kill switch** | One control that pauses everything the engine created |
| **Full audit log** | Every automated decision, with the evaluated inputs |

### 35.4 Beyond simple thresholds

- **Percentile-relative triggers** rather than absolute ("top 10% of this account's last 90
  days") — absolute thresholds break across accounts of different sizes. Vista's own
  best-time-to-post model is documented as needing 90 posts of history (file `01` §6.9), so we
  already need a cold-start prior; use the same machinery here.
- **Early-signal prediction**: predict 24h performance from the first 60 minutes to promote
  faster (the window where amplification compounds with the organic algorithm is short).
- **Creator-content routing**: a creator's post that overperforms should trigger a
  *whitelisting request*, not just a boost.
- **Advocate-content routing**: a high-performing employee post on LinkedIn should trigger a
  **Thought Leader Ad** proposal (§17.3) — the advocacy↔paid bridge nobody builds.
- **Negative rules**: automatically pause promotion of a post whose comment sentiment degrades
  below a threshold.

### 35.5 Competitive position

Vista ships **boost configurations** (saved presets applied at schedule time) — a static,
pre-publication decision. What is described above is a **post-publication, performance-
conditional, rights-aware decision**. That is a different product. Sprout/Hootsuite have
boosting; **automated rules driven by organic performance with rights and permission
validation are, to my knowledge, unshipped anywhere in the SMM category.** `[C1 — inference;
worth explicit competitive verification per §44]`

---

## 36. Creative testing

### 36.1 Why it belongs here

In an Advantage+/GMV-Max world where targeting levers are being removed (§34.1), **creative is
the primary remaining variable**. The brands winning at paid social are the ones producing and
testing the most creative — which is exactly why the UGC marketplaces in §23 exist.

The loop: **brief → produce (creator/UGC/in-house) → test → learn → re-brief**. Every step
except "test" is already in our product. `[C1 — inference]`

### 36.2 What to build

| Capability | Notes |
|---|---|
| **Creative library with structured attributes** | Hook type, format, length, talent, UGC vs. polished, has-captions, has-price-mention, CTA style, product featured, music vs. voiceover |
| **Auto-tagging by model** | Vision/language models can populate most of those attributes from the asset itself — this is now cheap and it is the enabling technology for the whole feature |
| **Systematic test structures** | One-variable-at-a-time ad sets; equal budget; minimum spend floor before judging; explicit test duration |
| **Statistical honesty** | Most "winners" declared in ad accounts are noise. Ship confidence intervals and a **minimum-sample gate** before declaring a winner. **This alone would differentiate us from most agencies** |
| **Attribute-level insight** | "Hook type = problem-statement outperforms hook type = product-reveal by 34% on cost-per-purchase, n=41 creatives" — this is the report that justifies the whole platform |
| **Organic as a free pre-test** | Post organically, measure, promote winners. **The cheapest creative testing lab in existence, and only an SMM tool can offer it** |
| **Feedback into briefs** | Auto-generate the next creator brief from winning attributes (§23) |

### 36.3 The organic-as-pre-test insight

This deserves emphasis because it is the cleanest articulation of why the two halves belong
together: **organic posting is free creative testing**. A brand that publishes 30 organic
pieces a month has 30 data points on hooks, formats and messages, at zero media cost. Today
that signal is thrown away because organic and paid live in different tools and different
teams.

Wiring organic performance → creative attribute analysis → paid promotion → paid performance →
back into the brief is **the single most defensible loop in this entire document**, and it
requires exactly the two things we have and the specialists do not: **the publishing pipeline**
and **the ad account**. `[C1 — inference]`

---

## 37. Unified organic + paid reporting

### 37.1 Why it is genuinely hard

| Problem | Detail |
|---|---|
| **Double counting** | A boosted post's engagements appear in *both* organic post insights and ad insights. Naive summing overstates. Meta partially separates paid/organic/viral breakdowns for Page posts; for IG the separation is weaker `[C2]` |
| **Different attribution windows** | Organic has none; paid has 7d-click/1d-view by default, adjustable, and each network differs `[C1]` |
| **Different metric definitions** | "Reach", "impressions", "video view" mean different things per network *and* between the organic and ads APIs of the same network `[C1]` |
| **Different granularity and latency** | Ads data is often near-real-time; organic insights lag; both restate |
| **Currency and timezone** | Ad accounts have their own currency and timezone, which may differ from the reporting workspace's |
| **Restatement** | Both organic and ads numbers change retroactively (spam removal, conversion backfill). **Reports must be reproducible: store the as-of date** `[C1]` |

### 37.2 The data model that survives

```
content_asset ──┬── organic_publication (network, post_id, published_at)
                │      └── organic_metrics (as_of_date, metric, value)
                └── paid_usage (ad_id, adset_id, campaign_id, identity, permission_id)
                       └── paid_metrics (as_of_date, window, metric, value)

attribution_event (click_id | promo_code | link_id | cart_attr)
        └── order (source system, revenue, margin, refunded)
```

Rules:
- **One `content_asset`, many publications and many paid usages.** This is the join that makes
  "this creative earned $X organically and $Y paid" possible.
- Metrics are **append-only with an `as_of_date`** so reports are reproducible.
- **Every reported number carries its attribution window and its source** as metadata, and the
  UI shows it. No blended number without a tooltip explaining its construction.

### 37.3 Reports to ship

1. **Paid vs. Organic** (parity — Vista has it, file `01` §6.10).
2. **Blended performance per content asset** — organic reach + paid reach + total spend +
   attributed revenue + blended cost per result.
3. **Creator-level P&L** — fee + product cost + ad spend on their content vs. attributed
   revenue + EMV.
4. **Amplification effectiveness** — for posts promoted by the rules engine (§35): incremental
   reach and revenue per dollar, and the counterfactual against similar non-promoted posts.
5. **Creative attribute report** (§36.2).
6. **Channel contribution** with an explicit, editable model, plus a stated gap to the
   platform-reported numbers (§13.1).
7. **Advocacy contribution** — reach and pipeline from employee shares (§29.4).

### 37.4 The honesty differentiator

Every vendor produces a blended number. Almost none show **how much of it is
double-counted, modelled, or platform-claimed**. A report that says *"Meta claims 412
conversions; Shopify attributes 287 to Meta; our deduped model says 310; the gap is
explained by view-through and cross-device"* is more useful and more credible than a single
confident number — and it is the kind of thing that survives contact with a CFO.
`[C1 — inference; also a marketing position]`

---
---
# PART VIII — SYNTHESIS

## 38. Gap list: what nobody does well

Ranked by (value to customer) × (difficulty for an incumbent to copy). Every entry is
`[C1 — inference]` on the *gap*; the underlying mechanics carry their own tags from earlier
sections. Items marked ★ are the ones I would bet the product on.

### 38.1 ★ Tier 1 — structural gaps with a real moat

**G1. ★ The rights-and-permissions expiry engine, enforced at publish and at ad-serve time.**
Contracts, UGC consents and whitelisting authorizations all have expiry dates. Today they live
in a PDF, a spreadsheet and a platform UI respectively, and **nothing checks them**. The
failure modes are expensive and common: a Spark Ad dies mid-flight because a 30-day
authorization lapsed (§17.2); an agency runs a UGC photo in paid media without paid rights
(§21.5); a creator's 6-month licence expires while the asset is still live on the PDP gallery
(§22). One ledger — `rights_grant` with scope, territory, channels and expiry — wired into
the composer, the gallery widget and the ad sync, with proactive renewal requests. **Nobody
has this because nobody holds all three surfaces.**

**G2. ★ The organic→paid rules engine with rights validation (§35).** Performance-conditional,
post-publication amplification that also validates rights and permissions before spending.
Boosting exists everywhere; *conditional, validated, auditable* amplification does not.

**G3. ★ One contact graph for creators, employees, ambassadors and customers (§31).** Every
incumbent acquired these as separate products (§14.2). The employee who becomes a creator, the
customer who becomes an ambassador, the creator who becomes an affiliate — all currently
require separate onboarding in separate systems.

**G4. ★ Multi-carrier creator attribution with reconciliation (§13.3).** Code + tracked link +
cart attribute + survey, deduped with a stated precedence, **and the gap between carriers
reported as an insight**. Creator platforms ship one or two carriers; nobody reconciles.

**G5. ★ Organic as a free creative pre-test feeding paid (§36.3).** Requires the publishing
pipeline and the ad account in the same system. Ads specialists have the second, schedulers
have the first, nobody has both plus the creative-attribute layer.

### 38.2 Tier 2 — high-value, moderately defensible

**G6. Commerce-aware publish validation (§5.7).** Block/warn on out-of-stock SKUs, price
drift, discontinued products, over-tagged SKUs. Cheap, obviously correct, unshipped.

**G7. Unified catalog sync control plane (§10.7).** One source catalog → Meta + Pinterest +
TikTok + Snap + Google, with taxonomy mapping, dry-run diff and a single error console.
Merchants currently run five apps and debug five sync failures.

**G8. Amazon Attribution integration (§10.5b).** For the large population of brands whose
revenue is on Amazon, "which post drove Amazon sales" is unanswered. The API exists. Almost no
SMM tool uses it.

**G9. Discovery from proprietary signals (§15.1).** "Creators already mentioning you"
(from our listening module) and "creators who are already customers" (from the commerce
integration) — better-converting than generic databases, and we get both nearly free.

**G10. Compliance-grade advocacy (§30).** Native pre-approval + lexicon + disclosure +
immutable audit, plus export connectors to Smarsh/Global Relay/Proofpoint/Theta Lake. File
`03` independently concluded nobody ships native archiving; the *pre*-publication half is the
half worth building, and it unlocks $100k+ regulated ACVs.

**G11. Advocacy → Thought Leader Ads bridge (§17.3, §35.4).** High-performing employee posts
auto-proposed as sponsored Thought Leader Ads. The B2B story nobody tells.

**G12. Transparent EMV (§15.7, §29.4).** Ship it with editable, visible coefficients, always
paired with real attributed revenue. Turns a vendor black box into a credibility argument.

**G13. Gifting/seeding ROI (§15.6).** Cost of goods shipped vs. content produced vs. revenue
attributed. Enabled directly by the Shopify integration.

**G14. Built-in holdout testing for UGC galleries and amplification (§22.3, §37.3).** Ship the
counterfactual by default instead of correlational claims.

**G15. Creator payment profile reuse across brands (§18.5).** A creator onboards tax + payout
details once; the second brand on our platform gets zero-friction payment. The only real
network effect available to us.

### 38.3 Tier 3 — worth doing, easily copied

- G16. Link-in-bio importers beyond Linktree (§12.3).
- G17. Pixel hosting on the bio page (§25.2).
- G18. Social→email-list attribution (§27.3).
- G19. AI brand-safety screening of creator content history (§15.2).
- G20. Music/licensed-audio warning for paid re-use (§21.5).
- G21. Performance relative to the creator's own baseline (§15.12).
- G22. Live-shopping planning wrapper without live infrastructure (§11.2).
- G23. Statistical honesty gates on creative testing (§36.2).

### 38.4 Things that look like gaps but are traps

| Apparent gap | Why it is a trap |
|---|---|
| "Build our own 200M creator database" | Legal exposure (§15.1.1), multi-year cost, and buyable via API |
| "Be the checkout" | Payment/money-transmission licensing (§18.2); Meta itself retreated (§5.1) |
| "Build live video shopping" | Capital-intensive; Western demand disappointed (§11.2) |
| "Full ads campaign manager" | Competing with Meta's own free tool and well-funded specialists (§33 preamble) |
| "Be an affiliate network" | Supply acquisition is a completely different business (§15.10) |
| "Retail review syndication" | Decade-deep retailer contracts (§24.2) |
| "Own creator payouts end-to-end" | Money transmitter licensing (§18.2) |
| "UGC marketplace with our own creator supply" | Two-sided marketplace cold-start (§23) |

---

## 39. Build order and effort estimates

Effort in **engineer-weeks**, assuming a competent full-stack team and **excluding** API
approval wait time (which runs in parallel and is often the real critical path — §33.3).
All estimates `[C1 — inference; ±50%]`.

### Phase 0 — Unblock (start immediately, finishes never)

| Item | Effort | Note |
|---|---|---|
| Apply for Meta `ads_management` Standard access + Business Verification | 1 | **8–12 week wait** |
| Apply for TikTok Marketing API | 1 | Weeks |
| Apply for TikTok Shop Partner Center app | 1 | Weeks |
| Apply for TikTok Creator Marketplace Open API partnership (§16.1) | 1 | Long lead; free data |
| Apply for LinkedIn MDP | 1 | **Slow and selective** |
| Apply for Pinterest standard/ads access | 0.5 | — |
| Legal: DAC7 in-scope analysis, creator payment architecture, UGC consent terms | — | **External counsel — start now** (§42) |

### Phase 1 — The commerce spine (≈14–20 weeks)

| Item | Effort | Unlocks |
|---|---|---|
| Shopify app: OAuth, GraphQL client, cost-aware rate limiting, webhooks, bulk ops | 4–5 | Everything in Parts II–IV |
| Product/catalog model + sync engine | 3 | G6, G7 |
| Order ingestion + attribution join | 2–3 | G4, §13 |
| Tracked-link service (short domain, 302, UTM injection, per-entity IDs) | 2 | G4, G18 |
| Discount-code generation + redemption tracking | 1.5 | G4 |
| Meta catalog write + IG product tagging in the composer | 2–3 | §5.3, parity with Vista |
| Commerce-aware publish validation | 1 | **G6** |
| Shopify Marketing Activities write-back | 1.5 | §13.4 — outsized credibility |

**Phase 1 exit criterion:** a merchant can connect Shopify, publish a shoppable Instagram post
validated against live inventory, and see the resulting orders attributed to that post inside
both our reports and Shopify's native marketing report.

### Phase 2 — The creator module (≈18–26 weeks)

| Item | Effort | Unlocks |
|---|---|---|
| Contact graph: unified `Person` + `relationship_type` (creator/employee/ambassador/customer) | 3 | **G3** |
| Creator CRM: pipeline, notes, history, inbox triage from existing DMs | 3 | §15.3 |
| Discovery v1: proprietary signals (mentions from listening + customers from commerce) | 3 | **G9** |
| Discovery v2: third-party API integration (Modash/HypeAuditor) | 2 | §15.1 |
| Brand-safety + fraud screening via models | 2.5 | G19 |
| Briefs + deliverable tracking + submission portal | 4 | §15.5 |
| Contracts: template engine + e-sign integration + **structured rights object** | 3 | **G1** |
| Seeding via Shopify draft orders (+ TikTok Shop samples) | 2 | G13 |
| Payouts v1: approved payables export | 1.5 | §18.2 arch. B |
| Payouts v2: Trolley/Tipalti embedded | 4 | G15 |
| Affiliate program mechanics (commissions, clawbacks, creator dashboard) | 4 | §15.10 |

### Phase 3 — Rights, UGC and permissions (≈12–16 weeks)

| Item | Effort | Unlocks |
|---|---|---|
| `rights_grant` ledger + consent evidence chain + terms snapshotting | 3 | **G1** |
| UGC discovery (IG tags/mentions/hashtags with quota budgeting) | 2.5 | §21.2 |
| Rights request queue (semi-automated, honest) + reply watcher | 2.5 | §21.3 |
| Expiry enforcement in composer + gallery + ad sync | 2 | **G1** |
| Whitelisting permission ledger (Meta/TikTok/LinkedIn) + renewal requests | 3 | **G1/G2** |
| UGC gallery widget + CDN + shoppable tagging + holdout test | 3 | §22, G14 |

### Phase 4 — Paid amplification (≈16–22 weeks)

| Item | Effort | Unlocks |
|---|---|---|
| Meta Marketing API: boost, dark posts, insights, async reports | 4 | Parity with Vista |
| TikTok Marketing API: Spark Ads + auth-code redemption | 3 | **G2** |
| Amplification rules engine + guardrails + audit + kill switch | 5 | **G2** |
| Unified organic+paid data model and reports | 4 | §37 |
| Creative library auto-tagging + attribute analysis + significance gates | 4 | **G5**, G23 |
| LinkedIn ads + Thought Leader Ads | 3 | **G11** |
| Pinterest ads (cheap — shares catalog work) | 1.5 | §34.4 |

### Phase 5 — Expansion (≈14–20 weeks)

| Item | Effort |
|---|---|
| TikTok Shop: products, orders, affiliate collaborations, samples | 6 |
| Advocacy compliance pack: pre-approval routing, lexicon, disclosures, audit, archive exports | 5 | **G10** |
| Amazon Attribution | 2 | **G8** |
| Pinterest + Snap + Google catalog destinations (unified sync plane) | 3 | **G7** |
| WooCommerce + BigCommerce | 4 |
| Link-in-bio commerce upgrade (catalog blocks, pixels, cart permalinks, A/B) | 3 | G16–G17 |
| ESP integrations (Klaviyo, Kit, beehiiv) + social→list attribution | 2.5 | G18 |

**Total to a differentiated product: roughly 75–105 engineer-weeks of focused work** across
Phases 1–4, i.e. **4–6 engineers for two to three quarters**, with API approvals as the true
critical path. `[C1 — inference]`

### 39.1 The sequencing argument

Phase 1 before Phase 2 is non-obvious but important. The instinct is to build the creator
module first because that is the high-ACV adjacency. **Resist it.** Without the commerce spine:
- creator attribution has nothing to attribute to (§13),
- seeding has no order system (§15.6),
- discount codes cannot be minted (§15.10),
- gifting ROI cannot be computed (§13),
- and the creator module degrades into another CRM with EMV — i.e. exactly the undifferentiated
  product the market already has ten of.

**The commerce integration is what makes the creator module different from GRIN.** `[C1]`

---

## 40. Data model sketch

The entities that Part VIII depends on. Names are illustrative.

```
Person                     # unified contact — G3
  id, primary_email, country, timezone, created_at
  ├─ SocialIdentity        # one per platform account
  │    platform, platform_user_id, handle, follower_count,
  │    verified_at, oauth_connected (bool), audience_data_source
  ├─ Relationship          # MANY per person, over time
  │    type ∈ {creator, employee, ambassador, customer, affiliate, community}
  │    org_id, status, started_at, ended_at,
  │    compensation_model, disclosure_policy
  └─ PayeeProfile          # reusable across orgs — G15
       provider, provider_payee_id, tax_form_type, tax_form_status,
       payout_method, currency, kyc_status, sanctions_checked_at

ContentAsset               # the join that makes §37 possible
  id, media_type, storage_uri, hash, duration, created_by_person_id,
  source ∈ {brand, creator, employee, ugc, stock, ai_generated}
  ├─ CreativeAttributes    # auto-tagged — G5/§36
  │    hook_type, format, has_captions, talent_ids, products[],
  │    cta_style, audio_type, detected_music (bool)
  └─ RightsGrant           # THE ledger — G1
       grantor_person_id, granted_at, evidence_bundle_uri,
       terms_snapshot_uri, terms_version,
       channels[] ∈ {organic, paid, whitelisted, web, email, print, ooh},
       territories[], exclusivity, starts_at, expires_at,
       revoked_at, revocation_propagated_at

Publication                # organic
  content_asset_id, platform, platform_post_id, profile_id,
  published_at, published_by, product_tags[]
  └─ MetricSnapshot(as_of_date, metric, value, source)

PaidUsage                  # the same asset, promoted
  content_asset_id, platform, ad_id, adset_id, campaign_id,
  identity_type ∈ {brand, creator, member},
  identity_person_id, permission_id → PlatformPermission,
  created_by ∈ {human, rules_engine}, rule_id
  └─ MetricSnapshot(as_of_date, window, metric, value, source)

PlatformPermission         # whitelisting ledger — G1/§17.4
  person_id, platform, grant_type ∈ {account_level, post_code, post_approval},
  scope_post_id, granted_at, expires_at, revoked_at,
  last_verified_at, renewal_requested_at
  # dependent_ad_ids ← computed; drives the expiry alarm

Campaign
  id, org_id, type ∈ {creator, advocacy, ugc, paid, organic},
  budget, currency, starts_at, ends_at, goal
  ├─ Deliverable(person_id, spec, due_at, status, content_asset_id,
  │              approval_state, revision_round)
  └─ Payment(person_id, amount, currency, status, provider_ref,
             invoice_uri, tax_year, clawback_of_payment_id)

Product / Catalog          # §10, §5.2, §7.1
  source_platform, source_id, sku, title, price, currency,
  availability, image_uri, category_path
  └─ CatalogDestination(destination ∈ {meta, pinterest, tiktok, snap, google},
                        remote_id, last_synced_at, sync_status, error)

AttributionCarrier         # §13.2 — G4
  type ∈ {promo_code, tracked_link, cart_attribute, click_id, survey_option}
  value, campaign_id, person_id, content_asset_id, created_at
  └─ AttributionEvent(carrier_id, occurred_at, order_id, revenue,
                      currency, refunded_at, precedence_rank)

Order                      # from §10 integrations
  source_platform, source_order_id, total, currency, placed_at,
  refunded_amount, customer_hash, journey_summary
```

**Three design commitments worth stating explicitly:**

1. **`ContentAsset` is the spine, not `Post`.** A scheduler models posts. A revenue system
   models assets that have many publications and many paid usages. Getting this wrong at the
   start makes §37 impossible later.
2. **`RightsGrant` and `PlatformPermission` are first-class, with expiry as an indexed field
   that something actively watches.** They are not attributes on an asset.
3. **`Person` is org-agnostic; `Relationship` is org-scoped.** That is what allows a creator's
   payee profile and tax forms to be reused across brands (G15) without leaking any brand's
   campaign data to another.

---

## 41. Cost model

`[C3 — all figures illustrative; re-verify per §44]`

### 41.1 Direct COGS per customer

| Cost | Driver | Rough magnitude |
|---|---|---|
| Discovery API (Modash/HypeAuditor) | Per profile lookup or per seat | Meaningful; **pass through or cap it** |
| Payout provider | Per payout + platform fee | $1–$5 per creator payment, plus monthly platform fee |
| FX spread | Cross-border payouts | 0.4–2% of payout volume depending on provider |
| E-sign | Per envelope | $0.50–$3 |
| Media storage + CDN | UGC/creator video is **large** | The sleeper cost — creator video libraries reach TBs |
| Model inference | Auto-tagging creative, brand-safety screening, caption generation | Per-asset; batch and cache aggressively |
| Ad API calls | Free, but engineering-expensive | — |
| X API | Per profile | **$29/profile/mo pass-through per file `01`** — the reason to deprioritise X |
| Listening | Per-listener metering | Already modelled in file `01` §4.4 |

### 41.2 The pricing shape this implies

- **Do not** price the creator module per creator-in-database (that meters a cost we do not
  control and punishes exploration).
- **Do** price on **active creators under management** and/or **program spend tier** — both
  scale with customer value, and both are defensible to a buyer.
- **Never** take a percentage of creator payouts (regulatory optics + the take-rate compression
  trend in §26).
- **Never** take a percentage of ad spend (it aligns us against the customer's interest and
  invites comparison to agencies).
- Charge SaaS. Meter only what genuinely costs us money (discovery lookups, storage above a
  generous cap, payout transactions at pass-through + small margin).

### 41.3 Illustrative packaging

`[C1 — inference; a hypothesis to test, not a recommendation to ship]`

| Tier | Includes | Rough price |
|---|---|---|
| Base (existing SMM) | Publishing, inbox, analytics, link-in-bio | $39–$149/mo (file `01` anchors) |
| **+ Commerce** | Shopify/Woo sync, product tagging, catalog sync, order attribution, tracked links, codes | **+$99–$199/mo** |
| **+ Creator** | Discovery, CRM, briefs, contracts + rights, seeding, affiliate, payouts orchestration | **+$299–$799/mo** by active-creator tier |
| **+ Amplify** | Ad accounts, boosting, rules engine, creative testing, unified reporting | **+$199–$499/mo** |
| **+ Advocacy** | Included from mid-tier | Included |
| **+ Compliance pack** | Pre-approval routing, lexicon, disclosures, immutable audit, archive export connectors | **+$500–$2,000/mo** (regulated) |

Even the middle of that stack lands a full-featured customer at **$800–$1,600/month
(~$10k–$19k/yr)** — squarely in the **pricing desert identified in §19** (between $7k
discovery tools and $25k+ creator platforms), while remaining a fraction of buying Sprout
base + Tagger + a UGC vendor + an advocacy vendor separately.

---

## 42. Legal and regulatory surface

`[C2/C3 — this section identifies exposure; it is not legal advice, and several items require
counsel before any launch]`

| Area | Requirement | Where it bites |
|---|---|---|
| **FTC Endorsement Guides** (updated **2023**) | Clear and conspicuous disclosure of material connections; **the advertiser is responsible for monitoring**; disclosure must be in the post itself, not buried; applies to employees too | §15.5 brief compliance checks; §29 advocacy; §31 ambassadors. **Build automated disclosure checking — it protects the customer and is a selling point** |
| **FTC fake-reviews rule (2024)** | Prohibits fake/incentivised-without-disclosure reviews and testimonials, and buying followers/engagement | §22 UGC moderation; §24 reviews |
| **EU DSA** | Platform obligations; ad transparency; **disclosure of commercial communications** | EU customers |
| **EU AI Act** | Transparency for AI-generated content; phased obligations | AI caption/image generation (file `01` §6.7) and §36 auto-tagging |
| **GDPR** | Lawful basis for creator databases (§15.1.1); DPAs with payout/discovery vendors; hashed-PII transfers in CAPI (§13.5); data subject rights over scraped profiles | **The creator database question is the sharpest one** |
| **DAC7 / OECD MRDP** | Platform operators facilitating relevant activities must collect and report seller/creator data annually | §18.4 — **must be answered by counsel before payouts ship** |
| **US 1099-NEC / 1099-K** | Thresholds changed in 2025 (§18.4) | §18 |
| **Money transmission** | Holding/moving funds requires licensing | §18.2 — **architectural constraint, not a compliance checkbox** |
| **Copyright / licensing** | UGC and creator content licences; **platform music licences do not extend to paid ads** | §21.4, §21.5 |
| **Right of publicity** | People appearing in UGC who are not the author | §21.5 |
| **Minors** | Consent from minors is generally invalid; several US states (e.g. Illinois, Utah) have enacted laws on compensating minors featured in monetised content | §21.4 — **check creator age at onboarding** |
| **FINRA / SEC / FCA / MiFID II / HIPAA / FDA** | §30.1 | §30 advocacy compliance pack |
| **Platform ToS** | Automation limits, scraping prohibitions, data retention caps, prohibition on storing certain platform data | Everything. Cross-reference `11-compliance-security-global.md` |
| **Accessibility** | Alt text, captions on video | Composer and gallery widget |

**Three items require counsel before the corresponding feature ships, not after:**
1. **DAC7 scope** for creator payouts (§18.4).
2. **GDPR lawful basis** for any creator database we hold (§15.1.1) — strongly favours buying.
3. **UGC consent terms** — the actual licence text, its versioning, and the snapshot
   requirement (§21.4).

---

## 43. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Meta ads_management Standard access denied or delayed** | Medium | **Critical** — blocks Phase 4 | Apply immediately (Phase 0); build against Development tier; have a manual-boost fallback |
| R2 | **LinkedIn MDP rejected** | Medium-high | High for B2B | Apply early; B2B story degrades to organic-only advocacy |
| R3 | **TikTok Shop API access or Partner status not granted** | Medium | High | Phase 5 is deliberately late; TikTok Shop is upside, not the spine |
| R4 | **TikTok regulatory/geopolitical disruption in a major market** | Medium | High | Do not make TikTok load-bearing; keep the data model platform-agnostic |
| R5 | **Instagram product tagging permission gated or deprecated** | Low-medium | High | Meta's commerce retreat (§5.1) is real; catalog + ads survive even if tagging narrows |
| R6 | **Discovery vendor (Modash/HypeAuditor) raises prices or is acquired** | Medium | Medium | Keep the discovery interface abstract; keep two vendors; own the proprietary signals (G9) |
| R7 | **DAC7 deems us an in-scope platform operator** | Medium | High (compliance cost) | Architecture B first (§18.2); counsel before payouts ship |
| R8 | **A customer's rules engine overspends** | Medium | **Severe** (trust + possible liability) | Hard ceilings, approval thresholds, kill switch, per-account daily spend verification, staged rollout of automation (§35.3) |
| R9 | **We promote a post during a brand crisis** | Medium | High | Sentiment re-check at promotion time; crisis-mode global pause (§35.3) |
| R10 | **UGC consent found legally insufficient** | Low-medium | High | Explicit reply-based consent + terms snapshot; never rely on hashtag implied licence (§21.4) |
| R11 | **Creator video storage costs balloon** | High | Medium | Tiered storage, lifecycle policies, generous-but-finite caps, transcode-on-demand |
| R12 | **Shopify changes App Store terms or ships competing features** | Medium | Medium | Shopify Collabs already overlaps (§10.1). Differentiate on cross-platform + organic pipeline, which Shopify will not build |
| R13 | **Attribution numbers disagree with the platforms' and the customer blames us** | **High** | Medium | §37.4 — make the disagreement the feature; never present a single unexplained blended number |
| R14 | **Building four categories at once produces four shallow modules** — Vista's documented failure mode (file `01`) | **High** | High | Phase gates with explicit exit criteria (§39); depth in the loop, not breadth in the menu |
| R15 | **Incumbent bundles the same thing** (Later is closest — SMM + Influence + Mavely) | Medium | High | Speed; single data model as the structural advantage they cannot retrofit (§14.2) |
| R16 | **API version treadmill** (LinkedIn monthly, Meta quarterly, Shopify quarterly) | **Certain** | Medium | Version-abstraction layer, contract tests against each API, a standing maintenance budget of ~10–15% of engineering |

---

## 44. Re-verification worklist

**This file contains zero fetched sources.** The following must be verified before any of it
becomes load-bearing. Ordered by *damage done if wrong*.

### 44.1 Blocking — verify before writing code

| # | Claim to verify | Section | Why it matters |
|---|---|---|---|
| V1 | **Can the TikTok Content Posting API attach product tags at publish time?** | §4.6 | Determines whether shoppable TikTok publishing is real or reminder-only |
| V2 | **Does Instagram product tagging still work on the Instagram-Login path, or only Facebook-Login-for-Business?** | §5.3 | Determines the entire commerce onboarding flow |
| V3 | Current Meta Graph/Marketing API version and its deprecation date | §34.1 | Build target |
| V4 | Meta `ads_management` **Standard vs Development** limits and the exact BUC rate-limit formula | §34.1 | Capacity planning; do not hard-code the recalled formula |
| V5 | TikTok Shop API: current date-version segments, signing spec, token TTLs, per-endpoint QPS | §4.2 | Integration correctness |
| V6 | TikTok Spark Ads authorization durations (7/30/60/365?) and the exact `tt_video/authorize` contract | §17.2 | G1/G2 depend on expiry semantics |
| V7 | Shopify: current API version, GraphQL cost-bucket limits per plan, **Marketing Activities API** current shape, `customerJourneySummary` availability by plan | §10.1, §13.4 | Phase 1 spine |
| V8 | **DAC7 applicability** to a creator-payment orchestrator | §18.4, §42 | Legal — counsel, not a web search |
| V9 | Meta Partnership Ads API surface: exact permission fields, whether code-based grants are API-observable, code validity duration | §17.1 | G1 coverage on Meta |
| V10 | LinkedIn Thought Leader Ads API shape and current `LinkedIn-Version` | §17.3, §34.3 | G11 |

### 44.2 High — verify before pricing or positioning

| # | Claim | Section |
|---|---|---|
| V11 | **Every price in §19** (influencer platforms) and **§32** (advocacy) | §19, §32 |
| V12 | Payout provider pricing and coverage: Tipalti, Trolley, Wise, Deel, Stripe Connect | §18.3 |
| V13 | US 1099-NEC ($2,000?) and 1099-K ($20k/200?) thresholds effective 2026 | §18.4 |
| V14 | Modash / HypeAuditor **API** availability and pricing (we plan to buy discovery) | §15.1, §20 |
| V15 | Shopify App Store revenue share terms and Shopify Collabs' fee | §10.1 |
| V16 | Whether any SMM vendor now ships a performance-conditional amplification rules engine | §35.5 — **the core differentiation claim** |
| V17 | Whether any vendor ships rights-expiry enforcement at publish/ad-serve time | §21.4, §38 G1 — **the other core claim** |
| V18 | Later's current Influence + Mavely integration depth (closest competitor to the thesis) | §14.1, R15 |

### 44.3 Medium — verify before building the specific feature

| # | Claim | Section |
|---|---|---|
| V19 | Instagram hashtag search limit (30 per 7 days?) and `recent_media` window | §21.2 |
| V20 | Meta catalog batch size (5,000?) and Pinterest items batch size (100?) | §5.2, §7.1 |
| V21 | Etsy rate limits (10k/day, 10/s?) and current app-approval process | §10.4 |
| V22 | WhatsApp `product_list` limits (30 products / 10 sections?) and current pricing model | §8.1 |
| V23 | YouTube Shopping affiliate eligibility (10k vs 20k subscribers) and market list | §6.1 |
| V24 | **YouTube BrandConnect current status** | §16.3 |
| V25 | TikTok GMV Max: current campaign-type names and whether older shopping campaign types persist | §4.4, §34.2 |
| V26 | Amazon Attribution API current capabilities + Brand Referral Bonus rate | §10.5 |
| V27 | X Ads API current version; Reddit Ads API current version; Google Ads API current version | §34.5–34.8 |
| V28 | Bazaarvoice / Pixlee / Stackla current ownership and pricing | §22.1 |
| V29 | Billo / Insense / Trend pricing and whether any offers an API | §23 |
| V30 | Hearsay Systems / Yext acquisition status; PostBeyond status | §28 |
| V31 | Creator-monetization take rates (Patreon, Gumroad, Substack, Whop) | §26 |
| V32 | Linktree / Beacons / Stan current pricing and commerce fees | §12.1, §25 |

### 44.4 Explicitly unknown — do not cite this file for these

- TikTok Shop LIVE management API existence (§4.5).
- TikTok Shop affiliate attribution window length (§4.4).
- Whether TTCM Open API is currently accepting new partners (§16.1).
- Exact API rate limits for TikTok Marketing API, LinkedIn Marketing API, Snap, Reddit.
- Meta Partnership Ad code validity duration (§17.1).
- Aggregator (Rutter/Codat/Nango) pricing (§10.6).
- Shopify Linkpop status (§12.1).
- Whether Instagram Creator Marketplace has any third-party API (believed no — §16.2).

---

## Appendix A — One-page summary for the master strategy doc

**The claim:** the SMM category's ceiling is set by the fact that scheduling is a commodity.
The way past the ceiling is to own the loop from content to revenue: catalog → content →
creator → rights → amplification → attribution → payout. Four adjacent categories
(social commerce plumbing, influencer management, UGC rights, employee advocacy) are really
one product built on **one contact graph, one asset model, one rights ledger and one
attribution ledger** — and every incumbent has them as separate acquired products with
separate data models and separate price tags.

**The five bets:**
1. **Rights and permissions with enforced expiry** (contracts, UGC consent, whitelisting) wired
   into the composer, the gallery and the ad sync. Nobody holds all three surfaces.
2. **Performance-conditional organic→paid amplification** with rights validation and hard
   spend guardrails.
3. **One contact graph** across creators, employees, ambassadors and customers.
4. **Multi-carrier creator attribution** (code + link + cart attribute + survey) with
   reconciliation, written back into Shopify's own marketing report.
5. **Organic as free creative pre-testing** feeding paid, with creative-attribute analysis.

**The sequencing rule:** commerce spine first (Shopify), creator module second. Without order
data the creator module is just another CRM with EMV.

**The pricing thesis:** a complete creator + commerce + amplification workflow at
$800–$1,600/month lands in the documented desert between $7k/yr discovery tools and $25k+/yr
creator platforms, and undercuts buying Sprout base + Tagger ($21.4k) + a UGC vendor + an
advocacy vendor separately.

**The three traps:** do not hold creator funds (money transmission); do not build a creator
database (GDPR + cost + buyable); do not build a campaign manager (competing with Meta's free
tool and funded specialists).

**The honesty position:** every attribution number ships with its window, its source and its
gap to the platform-claimed number. Every EMV ships with editable, visible coefficients. In a
category built on unfalsifiable blended metrics, verifiable numbers are a differentiator.

---

*End of file 10. Provenance: model recall only, May 2026 cutoff, written 12 August 2026 —
see the warning at the top and the re-verification worklist in §44.*

