# 07 — Tier-2 / Long-Tail Western Platforms & Review Sites: Engineering Spec

**Prepared:** 12 August 2026
**Scope:** ~70 non-tier-1 Western surfaces — long-tail social/content networks, blogging & CMS
targets, creative/portfolio sites, review & local-listing platforms, and business-messaging channels.
**Purpose:** Decide, per surface, whether we build a first-class adapter, a degraded adapter, a
reminder-publish stub, a data-vendor passthrough, or nothing at all — and price each decision in
engineer-weeks and calendar-weeks.
**Companion docs:** `06-platform-apis-tier1.md` (Meta / X / LinkedIn / TikTok / YouTube / Pinterest),
`05-competitors-dev-oss.md` (real cost + timeline of production API access),
`08-platform-apis-regional.md` (non-Western networks), `11-compliance-security-global.md` (token vault, ToS risk).

---

> ## ⛔ PROVENANCE WARNING — READ BEFORE USING ANY NUMBER IN THIS FILE
>
> **This document contains ZERO fetched sources.** Not one developer-portal page, changelog,
> pricing page or API reference was retrieved while writing it.
>
> | Blocker | Evidence gathered this session |
> |---|---|
> | **WebSearch** | Budget exhausted before this agent started — `200 of 200` calls consumed by the agents that produced files 01–04 and 06. The very first search attempted returned the budget-exhausted notice. **Zero searches available.** |
> | **WebFetch** | `EGRESS_BLOCKED` on `docs.bsky.app` and `developers.google.com`; tool-level refusal on `www.reddit.com`. |
> | **curl (control test)** | `curl https://example.com` → `CONNECT tunnel failed, response 403`. `curl https://developers.facebook.com/docs` → same. This is a **blanket egress denial**, not a per-domain policy. |
>
> Per `/root/.ccr/README.md`, a 403 from the proxy means "the destination host is not allowed by your
> organization's egress policy for this session. Do not retry or route around it — report the blocked
> host." I have reported it and have not attempted to route around it.
>
> Everything below is therefore **model knowledge with a May 2026 training cutoff**, written against an
> August 2026 "today" — a **minimum 3-month blind spot**. Long-tail platforms are, if anything, *more*
> volatile than tier-1: they retire APIs with little notice (Medium, SlideShare, Goodreads, 500px,
> Zomato, Zillow, Google Business Messages are all cautionary tales already inside this document).
>
> ### Confidence tags
>
> | Tag | Meaning | Drift risk |
> |---|---|---|
> | **`C1`** | Structural, slow-changing: whether an API exists at all, the auth *archetype*, whether posting is possible in principle, categorical absences ("Yelp has no review-response API"). | Low — stable 2–5 years. |
> | **`C2`** | Specific but drift-prone: endpoint paths, scope strings, token TTLs, field names, media constraints. | Medium — verify before load-bearing. |
> | **`C3`** | Known-volatile or fuzzy recall: **all pricing**, **all rate-limit numbers**, all future deprecation dates, anything where I hold conflicting values. | **High — treat as hypothesis, never fact.** |
> | **`UNVERIFIED`** | Genuinely unknown. Not a guess. Do not cite, do not put in a sales deck. | — |
>
> **Asymmetry that matters for planning:** for the tier-2 long tail, the `C1` layer carries almost all
> the decision weight. "Substack has no write API", "Signal has no business API", "Yelp cannot reply to
> reviews", "Google Play only returns 7 days of reviews" are architectural facts that have held for
> years and are safe to plan against. The `C2`/`C3` layer (exact quotas, exact prices) must be
> re-verified before anyone writes it into a contract or a rate limiter. **Architect from `C1`;
> never hardcode `C2`/`C3`.**
>
> **§20 is a ready-to-execute verification plan** with exact URLs, ordered by how much build they unblock.

---

## Table of contents

1. [Why tier-2 coverage is the differentiator](#1-why-tier-2-coverage-is-the-differentiator)
2. [How to read this spec — effort scale, capability vocabulary](#2-how-to-read-this-spec)
3. [The nine integration archetypes](#3-the-nine-integration-archetypes)
4. [Master matrix — all surfaces at a glance](#4-master-matrix)
5. [The graveyard — APIs that are dead, dying, or closed to new applicants](#5-the-graveyard)
6. [Social & community networks — deep dives](#6-social--community-networks)
7. [Messaging channels — deep dives](#7-messaging-channels)
8. [Video & audio platforms — deep dives](#8-video--audio-platforms)
9. [Blogging, newsletter & CMS targets — deep dives](#9-blogging-newsletter--cms-targets)
10. [Creative, portfolio & knowledge platforms — deep dives](#10-creative-portfolio--knowledge-platforms)
11. [Reviews & local listings — deep dives](#11-reviews--local-listings)
12. [The review-response capability matrix — the single most important table here](#12-the-review-response-capability-matrix)
13. [Buy-vs-build: review data aggregators and scraping vendors](#13-buy-vs-build-aggregators-and-vendors)
14. [Normalized data models — connections, posts, reviews](#14-normalized-data-models)
15. [Cross-cutting engineering: instance-scoped OAuth, dynamic client registration, token vault](#15-cross-cutting-engineering)
16. [Rate limiting, queueing and backoff design for 70 heterogeneous APIs](#16-rate-limiting-and-queue-design)
17. [Reminder-publish and assisted-publish: the honest fallback](#17-reminder-publish-and-assisted-publish)
18. [Legal & ToS risk register](#18-legal--tos-risk-register)
19. [Prioritized build waves with effort totals](#19-prioritized-build-waves)
20. [Verification backlog — exact URLs, ordered](#20-verification-backlog)

---

## 1. Why tier-2 coverage is the differentiator

### 1.1 The competitive observation

From `03-competitors-enterprise.md` and `04-competitors-smb.md`, the shape of the market is:

- **Everyone** has Facebook, Instagram, X, LinkedIn, TikTok, YouTube, Pinterest. Tier-1 is table
  stakes and confers zero differentiation. It is also where the cost is (`06` §9–10: X API pricing,
  Meta App Review, TikTok content-posting audit).
- **A handful** add Google Business Profile, Threads, Bluesky, Mastodon, Reddit, Tumblr.
- **Almost nobody** covers the combination of: Reddit *with subreddit rule awareness*, Telegram
  channels, Discord, Twitch metadata, the Fediverse beyond Mastodon, the blogging/CMS layer
  (WordPress + Ghost + Webflow + Shopify + Wix), **and** a real review-management surface
  (GBP + Trustpilot + App Store + Google Play + Yelp read).
- **The review side is a separate industry** (Birdeye, Podium, Reputation.com, Chatmeter,
  ReviewTrackers, GatherUp, Grade.us, Yext) that SMM tools historically do not touch. Bundling
  publishing + review management is the wedge, because the buyer (a multi-location SMB or an agency
  serving them) currently pays two vendors.

### 1.2 The strategic asymmetry

Tier-2 surfaces are cheap in *access* and expensive in *breadth*:

| | Tier-1 | Tier-2 |
|---|---|---|
| Access cost | High — App Review, business verification, paid tiers (X: up to $42k/mo), audits | Mostly **free and self-serve** |
| Calendar time to production access | Weeks to months | Hours to days for ~60% of them |
| Per-integration eng cost | High (complex media pipelines, container publish models) | Low-to-medium each |
| **Total** eng cost | Moderate (6–8 adapters) | **High (70 adapters)** |
| Differentiation | Zero | **High** |
| Churn/maintenance risk | Breaking changes quarterly | Whole platforms disappear |

So the differentiator is not any single tier-2 integration — it is having built the **factory** that
makes each new one cost 3–10 days instead of 3–10 weeks. §3 (archetypes), §14 (normalized models) and
§15 (instance-scoped OAuth) are that factory. **If we build 70 bespoke adapters we lose. If we build
9 archetypes and 70 thin configs we win.**

### 1.3 The three honest tiers of "support"

Marketing must never blur these; `01-vista-social-full-audit.md` shows competitors do, and it
generates churn:

| Label | Meaning | UX |
|---|---|---|
| **Native publish** | We call an API; content appears without human action. | Schedule → it posts. |
| **Assisted / reminder publish** | No write API (or write API is prohibited). We prepare the content, send a push/email at the scheduled moment with a deep link and a one-tap copy of caption + media. | Schedule → notification → human taps. |
| **Read-only / listen-only** | We ingest (reviews, mentions, metrics) but cannot write. | Dashboard + alerts, no compose. |

A fourth, **not supported**, must exist and be visible in the UI. Claiming Squarespace or Substack
"publishing" when it is a reminder is the single most common trust-destroying lie in this category.

---

## 2. How to read this spec

### 2.1 Build-effort scale

Estimates assume **one senior engineer**, our adapter framework already exists (§14–15), and include
adapter + tests + OAuth flow + error mapping + UI capability wiring. They exclude platform approval
*waiting* time, which is tracked separately as **calendar friction**.

| Tag | Engineer-effort | Typical shape |
|---|---|---|
| **S** | ≤ 1 week | Single-token auth, one POST, no media pipeline or simple single-image. Telegram, Dev.to, Discord webhook. |
| **M** | 1–3 weeks | OAuth2 dance, media upload step, 2–4 content types, pagination for reads. Reddit, Tumblr, Bluesky, Mastodon, Webflow. |
| **L** | 3–8 weeks | Multi-API surface, resumable/chunked media, per-instance dynamic registration, approval workflow, or a hierarchical account model. Google Business Profile, WhatsApp, WordPress-both-paths. |
| **XL** | > 8 weeks, or partner-gated | Formal partner program, certification, contract, or protocol-level work (running a node, becoming an MSP). Apple Messages for Business, RCS direct, Booking.com, Odysee. |
| **N/A** | Not buildable | No API, or API exists but is closed to new applicants, or use would breach ToS. |

### 2.2 Capability vocabulary used in every table

| Column | Values |
|---|---|
| **API?** | `Yes` / `Yes (gated)` / `Partner only` / `Ads only` / `Retired` / `No` / `Unofficial only` |
| **Auth** | `API key` / `Bot token` / `OAuth2` / `OAuth2 + PKCE` / `OAuth1.0a` / `JWT (asymmetric)` / `Service account` / `App password` / `Basic (app password)` |
| **Publish** | `Full` / `Partial` / `Metadata only` / `Reply only` / `None` |
| **Native schedule** | Whether the platform itself accepts a future timestamp (removes us as single point of failure) |
| **Read/analytics** | `Rich` / `Basic` / `Counts only` / `None` |
| **Approval friction** | `None` / `Self-serve app` / `Form + review` / `Business verification` / `Partner contract` |

### 2.3 What "native schedule" buys us

Per `06` §1.2, only Facebook Pages and YouTube offer native scheduling in tier-1 — meaning our
scheduler is the system of record for almost everything. Tier-2 is **noticeably better**:

**Surfaces with genuine native future-publish (verify each, `C2`):**
Mastodon (`scheduled_at`, ≥5 min ahead), Tumblr (`state=queue` + `publish_on`), WordPress
(`status=future` + `date`), Ghost (`status=scheduled` + `published_at`), Hashnode (`publishedAt`),
Slack (`chat.scheduleMessage`, ≤120 days), Discord (guild scheduled *events* only, not messages),
Shopify articles (`publishedAt` future), Webflow (staged item + separate publish call), Dev.to
(`published_at`, `C3`).

This matters for reliability engineering: for these we can *optionally* hand off to the platform and
degrade gracefully if our cron is late. Design the adapter interface so `schedule()` is a distinct
capability from `publishNow()` (§14.3).

---

## 3. The nine integration archetypes

This is the core architectural claim of this document. Seventy platforms collapse into nine shapes.
Build nine base classes; everything else is configuration + a content mapper.

### Archetype A — Single-secret REST publisher
**Auth:** one long-lived API key or personal access token, pasted by the user or generated in their
account settings. No OAuth dance, no refresh, no expiry (usually).
**Members:** Dev.to, Hashnode, Ghost (Admin API key → JWT), Telegram (bot token), Discord (webhook
URL), Yelp Fusion (read), TripAdvisor Content API (read), Viber Bot API, Trustpilot (partial),
WordPress self-hosted (application password).
**Engineering:** trivial. The work is content mapping and error taxonomy.
**Risk:** user-pasted secrets; must validate on save, must detect revocation, must never log.
**Typical effort:** S.

### Archetype B — Standard OAuth2 authorization-code publisher
**Auth:** fixed client_id/secret we register once with the platform; per-user access + refresh tokens.
**Members:** Reddit, Tumblr, Twitch, Vimeo, Discord (bot install), Snapchat Marketing, Kick,
Google Business Profile, Google Play (service account variant), Trustpilot (private endpoints),
Slack, Flickr (OAuth1.0a variant — same shape, different signing).
**Engineering:** the framework case. Token vault, refresh scheduler, scope drift detection.
**Typical effort:** M.

### Archetype C — Instance-scoped OAuth with **dynamic client registration**
**Auth:** the "client app" must be registered *per user-supplied host*, at connect time, because there
is no central authority. We store `instance_url + client_id + client_secret + tokens` per connection.
**Members:** Mastodon and every Mastodon-API-compatible server (Pleroma, Akkoma, GoToSocial,
Pixelfed, Firefish/Iceshrimp), Ghost self-hosted, WordPress self-hosted, Matrix homeservers,
PeerTube, Lemmy, Misskey/Sharkey.
**Engineering:** this is the archetype most competitors get wrong or skip. Requires: host validation
(SSRF guard — see §15.4), software-version probing (`/api/v1/instance`, `/api/v2/instance`,
`/ghost/api/admin/site/`, `/wp-json/`), per-instance rate-limit tracking, and a client-credential
table keyed by host so we register once per host and reuse across users on that host.
**Typical effort:** L for the first one, M for each subsequent family member.

### Archetype D — Bot / server identity
**Auth:** the *app* is the identity, not the user. A token identifies a bot that has been added to a
channel/guild/group by a human with admin rights.
**Members:** Telegram Bot API, Discord bot, Slack bot, Viber bot, Microsoft Teams bot (Bot Framework).
**Engineering:** the hard part is not auth, it is **the invite/permission ceremony** — "add the bot to
your channel, make it an admin, then paste the channel ID" — and detecting when someone removes it.
**Typical effort:** S–M for the API, M for the onboarding UX.

### Archetype E — Asymmetric-JWT enterprise API
**Auth:** we hold a private key (ES256/RS256); we mint short-lived JWTs per request or per session.
No refresh tokens, no OAuth callback.
**Members:** Apple App Store Connect, Apple Podcasts Connect, Apple Business Connect, Ghost Admin
(HS256 variant), Apple Messages for Business (MSP credentials).
**Engineering:** key custody is the whole problem (HSM/KMS, per-tenant keys, rotation). Clock skew
tolerance. `exp` must be short (Apple: ≤20 min for ASC, 5 min for Ghost).
**Typical effort:** M, plus L-grade key-management work done once.

### Archetype F — BSP / aggregator-mediated messaging
**Auth:** we do not talk to the end platform directly; we talk to a Business Solution Provider or
CPaaS, or we become one after a formal partner process.
**Members:** WhatsApp (direct Cloud API is possible but Embedded Signup + verification is BSP-shaped),
RCS Business Messaging, Apple Messages for Business, Viber Business Messages, SMS/MMS.
**Engineering:** per-message billing meter, template lifecycle + approval state machine, 24-hour
session-window logic, opt-in/consent ledger.
**Typical effort:** L–XL. **Calendar friction dominates engineering effort.**

### Archetype G — Feed-in / feed-out (RSS, JSON Feed, sitemap)
**Auth:** none.
**Members:** Substack (read), Medium (read), Apple Podcasts + Spotify for Podcasters (podcast
distribution is *entirely* RSS-driven), Goodreads (per-shelf RSS), any blog, YouTube channel feeds.
**Engineering:** polite polling, ETag/Last-Modified, conditional GET, dedupe by GUID, HTML→blocks
normalization, `<enclosure>`/`<media:content>` extraction.
**Typical effort:** S for the framework, then near-zero per source. **This is the highest
leverage-per-hour work in the entire document** — it powers content-library import, RSS-to-social
auto-posting, and podcast/newsletter surfaces at once.

### Archetype H — Read-only review ingestion (official)
**Auth:** API key or OAuth; capability is fundamentally asymmetric — we can read, we cannot write.
**Members:** Yelp Fusion, TripAdvisor Content API, Google Places (as a GBP fallback), G2
(subscription-gated), Facebook Recommendations (read + comment-reply).
**Engineering:** normalized review schema (§14.4), incremental sync cursors, dedupe/identity
resolution across sources, sentiment + topic extraction downstream.
**Typical effort:** S–M each once the review pipeline exists.

### Archetype I — No API: assisted publish, vendor passthrough, or nothing
**Members:** Substack (write), Squarespace (content), Truth Social, Gettr, Lemon8, Quora, Nextdoor
(non-partner), Rumble, Snapchat organic, WhatsApp Status/Channels, Amazon reviews, Glassdoor, Indeed
reviews, Zillow, Angi, BBB, Healthgrades, Goodreads, 500px, SlideShare, Signal.
**Engineering:** the reminder-publish pipeline (§17) built once, then a per-platform deep-link recipe,
character-limit profile and media-spec profile.
**Typical effort:** S per platform after the pipeline exists (which is M).

---

## 4. Master matrix

> Every cell below is `C1` for the *existence* answer and `C2`/`C3` for the specifics. Rate limits and
> prices are the least trustworthy column in this document.

### 4.1 Social & community

| Platform | API? | Auth | Publish | Native sched. | Read/analytics | Rate limit (`C3`) | Approval friction | Cost | Effort |
|---|---|---|---|---|---|---|---|---|---|
| **Reddit** | Yes | OAuth2 (B) | **Full** — text, link, image, gallery, video, comments | No | Basic — score, upvote ratio, comment count, no impressions | ~100 QPM/client OAuth | Self-serve app; **commercial use requires Reddit Data API terms** | Free non-commercial; ~$0.24/1k calls commercial (`C3`) | **M** |
| **Snapchat (organic)** | **No** | — | **None** | — | None | — | — | — | **N/A** |
| **Snapchat Marketing API** | Yes | OAuth2 (B) | Ads only | n/a | Ads metrics | UNVERIFIED | Self-serve + ad account | Free API, ad spend | M (ads scope) |
| **Snapchat Creative Kit** | Yes | Mobile SDK | Hand-off to Snap camera; **requires our own mobile app** | No | None | n/a | Snap review of the app | Free | L (mobile) |
| **Telegram (Bot API)** | Yes | Bot token (D) | **Full** to channels/groups where bot is admin | No | Counts only (`getChatMemberCount`) | ~30 msg/s global; ~20/min per group | **None** | Free | **S** |
| **Telegram (channel stats)** | Via MTProto/TDLib | User account | — | — | Rich (`getChatStatistics`) | n/a | ToS-grey for SaaS | Free | L |
| **WhatsApp Cloud API** | Yes | Meta system-user token (F) | 1:1 + template messages | No | Delivery/read status, no "post" metrics | Tiered 250→unlimited/24h; 80 msg/s default | **Business verification + app review** | **Per-message** (varies by country) | **L** |
| **WhatsApp Status / Channels** | **No** | — | **None** | — | None | — | — | — | **N/A** |
| **Bluesky (AT Protocol)** | Yes | App password *or* atproto OAuth (B/C-ish) | **Full** — posts, threads, images, video, replies | No | Counts only (likes/reposts/replies) | ~3,000 pts/h, 35,000 pts/day writes | **None** | Free | **M** |
| **Mastodon / ActivityPub** | Yes | OAuth2 **per instance** (C) | **Full** — status, media, poll, CW, visibility | **Yes** (`scheduled_at`) | Basic — boosts/faves/replies | 300 req/5 min default | None (but per-instance) | Free | **M–L** |
| **Discord** | Yes | Webhook (A) *or* bot (D) | **Full** — messages, embeds, files, threads | Events only | Counts only | 50 req/s global; per-route buckets | Verification at 100 guilds | Free | **S–M** |
| **Twitch** | Yes | OAuth2 (B) | **Metadata only** — title/category/tags, schedule segments, chat, clips, announcements | Schedule segments yes | Basic + EventSub webhooks; analytics report URLs | ~800 pts/min | Self-serve app | Free | **M** |
| **Tumblr** | Yes | OAuth2 or OAuth1.0a (B) | **Full** — NPF blocks, all legacy types | **Yes** (`publish_on`) | Counts only (notes) | 1,000/h, 5,000/day per key; 250 posts/day/user | Self-serve app | Free | **M** |
| **Nextdoor** | Partner / Ads | OAuth2 (B) | Ads yes; organic business posts **partner-gated** | UNVERIFIED | Ads metrics | UNVERIFIED | **Partner contract** | UNVERIFIED | **XL** |
| **Truth Social** | Unofficial only (Mastodon fork) | No public app registration | **None supported** | — | — | — | No developer program | — | **N/A** |
| **Gettr** | Unofficial only | — | **None supported** | — | — | — | No developer program | — | **N/A** |
| **Lemon8** | **No** | — | **None** | — | None | — | — | — | **N/A** |

### 4.2 Video & audio

| Platform | API? | Auth | Publish | Native sched. | Read/analytics | Rate limit (`C3`) | Approval | Cost | Effort |
|---|---|---|---|---|---|---|---|---|---|
| **Vimeo** | Yes | OAuth2 (B) | **Full** — tus resumable upload, privacy, folders | Partial (`C3`) | Basic; deeper analytics gated to paid plans | UNVERIFIED | Self-serve app; upload scope requires request | **Paid plan required for meaningful upload quota** | **M** |
| **SoundCloud** | **Closed to new apps** | OAuth2 (B) | Full *if* you hold a legacy key | No | Plays/likes/comments | ~15k/12h (`C3`) | **Application form closed for years** | Free | **N/A (blocked)** |
| **Spotify for Podcasters** | **No publish API** | — | **None** (distribution is RSS) | — | Dashboard only | — | — | — | **N/A** |
| **Spotify Web API** | Yes | OAuth2 (B) | None | — | Public show/episode metadata only | 30 req/s rolling (`C3`) | Self-serve | Free | S (read) |
| **Megaphone (Spotify enterprise)** | Yes (contract) | API token | Full podcast/episode CRUD | Yes | Rich | UNVERIFIED | **Enterprise contract** | 4–5 figures/yr | L |
| **Apple Podcasts Connect** | Yes | JWT ES256 (E) | Delegated delivery — shows/episodes | Yes | Trends/analytics endpoints (`C3`) | UNVERIFIED | Podcasts Connect account + key | Free | **L** |
| **Rumble** | Partner / unofficial | UNVERIFIED | Upload via partner program only; RTMP for live | — | None public | — | **Partner** | UNVERIFIED | **XL** |
| **Kick** | Yes (public API, launched 2025) | OAuth 2.1 + PKCE (B) | Chat, channel metadata; **no video upload** | No | Livestream state, EventSub-style webhooks | UNVERIFIED | Self-serve app in account settings | Free | **M** |
| **Odysee / LBRY** | Protocol only | Wallet + local daemon | Publish via `lbrynet` JSON-RPC — requires running a node + LBC | No | Minimal | n/a | None, but operationally heavy | Node hosting + LBC | **XL** |

### 4.3 Blogging, newsletter & CMS

| Platform | API? | Auth | Publish | Native sched. | Read | Rate limit (`C3`) | Approval | Cost | Effort |
|---|---|---|---|---|---|---|---|---|---|
| **WordPress.com / Jetpack** | Yes | OAuth2 (B) | **Full** — posts, media, taxonomies | **Yes** | Yes + WP.com Stats | UNVERIFIED | Self-serve app | Free | **M** |
| **WordPress self-hosted** | Yes | Application Password / Basic (A) or OAuth plugin (C) | **Full** via `/wp-json/wp/v2/` | **Yes** (`status=future`) | Yes | Host-dependent | None | Free | **M** |
| **Ghost** | Yes | Admin API key → JWT (A/E) | **Full** — posts, pages, tags, newsletter send | **Yes** (`status=scheduled`) | Content API read; member/email stats | Light | None | Free (self-host) / Ghost(Pro) | **S–M** |
| **Substack** | **No write API** | — | **None** | — | **RSS only** | n/a | — | — | **N/A publish / S read** |
| **Medium** | **Retired** | — | **None** (integration tokens discontinued) | — | RSS only | n/a | — | — | **N/A** |
| **Dev.to (Forem)** | Yes | API key (A) | **Full** — markdown articles, series, canonical | Yes (`C3`) | Basic — reactions, comments, page views (own posts) | ~10 creates/30 s (`C3`) | None | Free | **S** |
| **Hashnode** | Yes | PAT, GraphQL (A) | **Full** — `publishPost` mutation | **Yes** (`publishedAt`) | Basic | UNVERIFIED | None | Free | **S** |
| **Shopify blog** | Yes | OAuth2 app (B) | **Full** — `articleCreate` GraphQL (REST deprecated) | **Yes** | Yes | Cost-based: 100 pts/s std, 1,000 Plus | **Partner app; App Store review if public** | Free API | **M** |
| **Wix Blog** | Yes | Wix App OAuth or API key (B/A) | **Full** — draft posts → publish | Yes | Yes | UNVERIFIED | **Wix App Market review for distribution** | Free API | **M–L** |
| **Squarespace** | **No content API** | — | **None** (Commerce APIs only) | — | Commerce only | n/a | — | — | **N/A** |
| **Webflow CMS** | Yes | OAuth2 app or site token (B/A) | **Full** — collection items, live publish | Staged + publish | Yes | ~60 req/min per site | Self-serve; App Marketplace for distribution | Free API (site plan needed) | **M** |

### 4.4 Creative, portfolio & knowledge

| Platform | API? | Auth | Publish | Read | Approval | Effort |
|---|---|---|---|---|---|---|
| **Behance** | **Closed to new apps** (`C2`) | Adobe client_id | None | Read-only if keyed | Closed | **N/A** |
| **Dribbble** | Yes, but **read-oriented v2** | OAuth2 | Shot creation removed/restricted (`C3` — verify) | User + shots | Application review | **N/A–M** |
| **Flickr** | Yes | OAuth1.0a (B) | **Full** — upload, sets, metadata | Views/faves/comments; Stats API needs Pro | **Commercial key requires application** | **M** |
| **500px** | **Retired (2018)** | — | None | None | — | **N/A** |
| **Quora** | Ads only | OAuth2 | **None organic** | None | Ad account | **N/A** |
| **SlideShare** | **Retired** (Scribd) | — | None | None | — | **N/A** |
| **Goodreads** | **Retired (Dec 2020)** | — | None | Per-shelf RSS only | — | **N/A / S (RSS)** |

### 4.5 Reviews & local listings

| Platform | API? | Auth | **Read reviews** | **Reply via API** | Post/content | Approval | Cost | Effort |
|---|---|---|---|---|---|---|---|---|
| **Google Business Profile** | Yes (multi-API) | Google OAuth2, `business.manage` (B) | **Full** | **Yes** | **Yes** — Local Posts, media, Q&A answers | **Form + review; quota starts at 0** | Free | **L** |
| **Apple Business Connect** | Yes | JWT ES256 (E) | n/a (Apple Maps has no first-party reviews) | n/a | **Yes** — Showcases, location feed | Business Connect account; chain onboarding | Free | **L** |
| **Yelp Fusion** | Yes | API key (A) | **3 truncated excerpts only** | **No** | No | Self-serve key | Free tier tiny; paid tiers | **S** |
| **TripAdvisor Content API** | Yes | API key (A) | **~5 reviews/location** | **No** | No | Self-serve key + referrer lock | Free tier ~5k calls/mo (`C3`) | **S** |
| **Trustpilot** | Yes | OAuth2 + API key (A/B) | **Full** | **Yes** | Invitations API | Paid plan | Plan-gated (`C3`) | **M** |
| **G2** | Yes (gated) | Bearer token (A) | Syndication feed | **No** | No | **Paid subscription** | 5 figures/yr | **M** |
| **Capterra / Gartner Digital Markets** | Partner/widget | — | Vendor portal export / widget | **No** | No | Paid vendor program | Paid | **N/A–M** |
| **Booking.com** | Partner only | OAuth/partner creds (F) | Yes (partner) | Partner (`C3`) | Content API | **Connectivity Partner Programme + certification** | Contract | **XL** |
| **OpenTable** | Partner only | Partner creds | Not public | No | No | Partner | Contract | **XL** |
| **Zomato** | **Retired (2021)** | — | None | No | No | — | — | **N/A** |
| **Amazon reviews** | **No** | — | **None officially** (PA-API returns no review text) | **No** | Solicitations API can *request* reviews | SP-API seller creds | — | **N/A / M via vendor** |
| **Apple App Store reviews** | Yes | JWT ES256 (E) | **Full** (`customerReviews`) | **Yes** (`customerReviewResponses`) | App metadata | ASC key | Free | **M** |
| **Google Play reviews** | Yes | Service account (B) | **Last 7 days only** via API; full history via GCS CSV export | **Yes** (`reviews.reply`, 350 chars) | Store listing | Play Console access | Free | **M** |
| **Glassdoor** | **Retired** | — | None | No | No | — | — | **N/A** |
| **Indeed (reviews)** | **No** | — | None | No | Job-posting APIs exist for ATS partners | Partner | — | **N/A** |
| **Healthgrades** | **No** | — | None | No | No | — | — | **N/A** |
| **Zillow** | **Public API retired (2021)** | — | None | No | Bridge/MLS APIs for listings only | MLS approval | — | **N/A** |
| **Angi** | Partner (leads) | Partner creds | None | No | No | Partner | Contract | **N/A** |
| **BBB** | **No public API** | — | None | No | No | Data licensing | Contract | **N/A** |
| **Facebook Recommendations** | Yes (Graph) | Page token (B) | **Yes** — `/{page-id}/ratings` | **Yes** — comment on the story | n/a | Meta App Review | Free | **S** (reuses tier-1) |

### 4.6 Messaging & internal distribution

| Channel | API? | Auth | Send | Receive | Approval | Cost | Effort |
|---|---|---|---|---|---|---|---|
| **Google Business Messages** | **SHUT DOWN (July 2024)** | — | — | — | — | — | **N/A** |
| **Apple Messages for Business** | Yes | JWT + MSP/CSP creds (E/F) | Yes | Yes | **Apple approves brand *and* provider; MSP status is a months-long partner process** | Contract | **XL** (direct) / **L** (via MSP) |
| **RCS Business Messaging** | Yes | GCP service account (F) | Yes — rich cards, carousels, suggested replies | Yes | **RBM partner or aggregator; per-carrier agent verification** | Per-message carrier fees | **XL** direct / **L** via CPaaS |
| **Viber** | Yes | Bot: `X-Viber-Auth-Token` (D); Business: aggregator (F) | Yes | Webhook | Bot: none. Business: aggregator contract | Bot free; Business per-message | **M** |
| **Signal** | **No business API** | — | — | — | — | — | **NOT FEASIBLE** |
| **Slack** | Yes | OAuth2 bot token (B/D) | Yes + `chat.scheduleMessage` | Yes (restricted since 2025) | Self-serve app; Marketplace review for distribution | Free | **S–M** |
| **Microsoft Teams** | Yes | Graph + Bot Framework (B/D) | Yes | Yes | **Tenant admin consent; O365 connectors retired** | Free | **M–L** |

---

## 5. The graveyard

Platforms whose APIs are dead, retired, or closed to new applicants. **This section exists to stop us
building against them and to stop sales promising them.** All entries `C1` on the fact of death,
`C2`/`C3` on the exact date.

| Platform | What died | Approx. date | What remains | Our play |
|---|---|---|---|---|
| **Medium** | Write API / integration tokens (`api.medium.com/v1/posts`) | 2023 (`C2`) | RSS (`medium.com/feed/@user`) | RSS import + reminder publish |
| **Goodreads** | Entire developer API; no new keys | Dec 2020 (`C1`) | Per-user shelf RSS | RSS only |
| **SlideShare** | Upload/API v2 after Scribd acquisition | ~2021–22 (`C2`) | Public embeds | Reminder publish |
| **500px** | Public API + developer program | 2018 (`C1`) | Nothing | Not supported |
| **Behance** | Public API registration | ~2019–20 (`C2`) | Nothing self-serve | Not supported |
| **Zomato** | Public Developer API | 2021 (`C1`) | Nothing | Not supported |
| **Zillow** | Legacy `GetSearchResults` etc. | 2021 (`C1`) | Bridge/MLS partner APIs (listings, not reviews) | Not supported |
| **Glassdoor** | Partner data API | ~2021 (`C2`) | Employer Center UI | Manual |
| **Google Business Messages** | Whole product | **31 July 2024** (`C2`) | Nothing; Google pushed the market to RCS | Remove from roadmap |
| **SoundCloud** | Not dead, but **new app registrations closed for years** | ~2019– (`C1`) | Legacy keys only | Blocked; monitor |
| **Microsoft Teams O365 connectors / incoming webhooks** | Retired in favour of Power Automate + Graph | announced Dec 2024, wound down through 2025 (`C2`) | Graph API, Workflows | Migrate to Graph |
| **Slack `files.upload`** | Replaced by `files.uploadV2` flow | Mar 2025 (`C2`) | External-upload URL flow | Use v2 flow |
| **Shopify REST Admin API** | Legacy for public apps; GraphQL is the path | 2025 onward (`C2`) | GraphQL Admin | Build GraphQL-first |
| **GBP `mybusiness.googleapis.com/v4` insights** | `reportInsights` replaced by Business Profile Performance API | ~2022 (`C2`) | v4 still hosts **reviews + localPosts** (`C2` — verify) | Split-brain client (§11.1) |

**Rule for the roadmap:** any platform in this table gets a **"Not supported"** badge in the UI with a
one-line explanation. Competitors who still list Medium or Google Business Messages are shipping stale
marketing; showing the truth is a trust asset.

---

## 6. Social & community networks

### 6.1 Reddit

**Verdict: build it, and build it properly — Reddit is the highest-value tier-2 social surface and the
one most likely to embarrass a naive implementation.**

**Base:** `https://oauth.reddit.com` for all authenticated calls; `https://www.reddit.com/api/v1/access_token`
for tokens; app registration at `https://www.reddit.com/prefs/apps`. `C1`

**Auth (`C1` shape, `C2` details):** OAuth2 authorization code with refresh (`duration=permanent`
required to receive a refresh token — a classic first-implementation bug: omit it and you get a
1-hour token with no refresh). Access tokens ~1 hour. HTTP Basic with `client_id:client_secret` on the
token endpoint. **A descriptive, unique `User-Agent` is mandatory** and enforced — format convention
`platform:app-id:version (by /u/username)`; generic UAs get aggressively 429'd or 403'd. `C2`

**Scopes we need (`C2`):** `identity`, `submit`, `edit`, `read`, `flair`, `history`, `modposts`
(only for mod tooling), `privatemessages` (inbox), `mysubreddits`, `vote`, `save`.

**Publishing (`C1` capability, `C2` params):**

| Content type | Mechanism |
|---|---|
| Self/text post | `POST /api/submit` with `kind=self`, `sr`, `title`, `text` (or `richtext_json`) |
| Link post | `kind=link`, `url` |
| Image | Upload to `POST /api/media/asset.json` → returns S3 presigned form → POST the file to S3 → then `/api/submit` with `kind=image` and the asset URL. A **WebSocket** URL is returned to learn the final permalink asynchronously — this is the ugly part. |
| Gallery | `POST /api/submit_gallery_post.json` (or `/api/submit` with `kind=gallery` + `items[]` of asset IDs + captions/outbound URLs) |
| Video / GIF | Same asset flow, `kind=video`/`videogif`, plus a **thumbnail asset** which is separately required |
| Poll | `POST /api/submit_poll_post` with `options[]`, `duration` (days) |
| Comment / reply | `POST /api/comment` with `thing_id=t3_xxx` (post) or `t1_xxx` (comment) |
| Crosspost | `kind=crosspost` + `crosspost_fullname` |

**The features that separate a good Reddit integration from a bad one (all `C1`):**

1. **Flair is frequently mandatory.** `GET /r/{sub}/api/link_flair_v2` returns available flairs;
   `flair_id` + `flair_text` on submit. Many large subs auto-remove unflaired posts. If we do not
   surface a flair picker per-subreddit, our posts silently vanish and the user blames us.
2. **Per-subreddit rules and requirements.** `GET /r/{sub}/about/rules` (rules text) and
   `GET /api/v1/{sub}/post_requirements` (title regex/length, body restrictions, banned domains,
   whether link/self/image is allowed, flair required, gallery allowed). **Calling
   `post_requirements` before submit and validating client-side is the single highest-ROI feature
   we can build for Reddit** and essentially nobody in the SMM category does it.
3. **Rate/karma gating.** New accounts and low-karma accounts are throttled by Reddit and by
   individual subs' AutoModerator. Submissions can succeed at the API layer and be removed seconds
   later. We must poll the submitted post (`GET /api/info?id=t3_xxx`, check `removed_by_category`,
   `banned_by`, `approved`) at +1 min / +10 min / +1 h and surface "removed by moderators" as a
   distinct post state. **`C1` — this is the defining operational reality of Reddit publishing.**
4. **Shadow states.** `removal_reason`, `mod_note`, `spam` classification, and the "post is only
   visible to you" case. Our status model needs `PUBLISHED_BUT_REMOVED`.
5. **Cadence.** Reddit's own site rules discourage the same link across many subs quickly. We should
   ship a **spread scheduler** (post to N subs staggered over hours) and warn on identical-content
   multi-sub bursts.

**Reads/analytics (`C2`):** `GET /r/{sub}/new|hot|top`, `GET /user/{u}/submitted`, `GET /api/info`,
`GET /r/{sub}/about` (subscribers, active users), `GET /message/inbox` and `/message/unread` for the
inbox, `GET /r/{sub}/comments/{id}` for the thread. Metrics available: `score`, `ups`,
`upvote_ratio`, `num_comments`, `total_awards_received`, `view_count` (often null for non-mods).
**No impressions, no reach, no demographics.** Reddit's own "post insights" (views, shares) in the
mobile app are not in the public API. `C1`

**Listening:** Reddit is one of the best listening sources on the open web. `GET /search` with
`q`, `restrict_sr`, `sort=new`, `t` window; plus per-subreddit `/new` polling. Pushshift is
**no longer publicly available** for non-moderators (restricted 2023, `C2`), so do not architect
around it. Real-time-ish monitoring = poll `/r/all/comments` + targeted searches.

**Rate limits (`C3`):** OAuth clients historically 60 requests/minute averaged over a 10-minute
window; widely reported to have moved to **100 QPM per OAuth client_id**. Response headers
`X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` (seconds) — **trust the headers, not
the number in this document.** Unauthenticated/`www.reddit.com` JSON access is much harsher and is
not a supported production path.

**Approval friction & cost (`C1` shape, `C3` price):** App registration is instant and self-serve.
**Commercial use is the problem** — since the 2023 policy change, commercial/enterprise consumption of
the Data API requires an agreement with Reddit; the widely-reported rate was **$0.24 per 1,000 API
calls** with a free tier for non-commercial and moderator tooling. An SMM tool posting on behalf of
paying customers is commercial. **Action: this needs a direct conversation with Reddit before we
scale, and it is a real line item.** `C3` on the number, `C1` on the requirement.

**Effort: M** (2–3 weeks) for text/link/image/comment + flair + post_requirements + removal detection.
Add ~1 week for gallery/video (the asset+websocket flow).

**Libraries:** PRAW (Python, mature). For Node, `snoowrap` is effectively unmaintained — plan to write
a thin client rather than depend on it. `C2`

---

### 6.2 Snapchat

**Verdict: organic publishing is not possible from a web scheduler. Do not promise it.**

Three distinct developer surfaces, only one of which is useful to us:

**(a) Snapchat Marketing API** — `https://adsapi.snapchat.com/v1/`, OAuth2 at
`accounts.snapchat.com/login/oauth2/authorize`, scope `snapchat-marketing-api`. Covers organizations,
ad accounts, campaigns, ad squads, ads, creatives, audience segments, and reporting
(`/stats` endpoints). Also the **Conversions API (CAPI)** for server-side events. This is an *ads*
product; it does not publish organic Snaps or Stories. `C1`

**(b) Creative Kit** — a **mobile SDK** (iOS/Android) that lets *your app* hand an image/video plus
stickers, caption and attachment URL to the Snapchat camera, where **the user** then completes the
share. Requires us to ship a mobile app and pass Snap's review. It is a share-sheet, not an API.
Cannot be driven from a server or a scheduled job. `C1`

**(c) Public Profiles** — Snapchat's business/creator profile surface (Stories, Spotlight, Lenses,
Highlights), managed in Snapchat Business Manager / the Creator Hub UI. **I am not aware of a public
API for creating Public Profile Stories or Spotlight posts.** `C1` that no self-serve organic posting
API is generally available; `UNVERIFIED` whether a partner-only Content/Story API exists for large
publishers (Snap has historically had a closed "Discover"/Publisher tooling track).

**What we can honestly ship:**
- Snapchat **ads** reporting inside our analytics module (M, only if we do paid social at all).
- Snapchat **reminder publish** with a vertical-video spec profile (1080×1920, ≤60 s per Snap segment,
  MP4/H.264) and a deep link.
- Nothing else.

**Effort:** N/A for organic. M for Marketing API read-only reporting.

**Competitive note:** essentially no SMM tool does Snapchat organic. Sprinklr/Emplifi cover Snapchat
*ads*. If a competitor claims "Snapchat publishing", check whether it is ads or a reminder — it is one
of those two. `C1`

---

### 6.3 Telegram

**Verdict: build it in week one. Cheapest high-value integration in the entire document.**

**Base:** `https://api.telegram.org/bot<TOKEN>/<METHOD>`, plus `https://api.telegram.org/file/bot<TOKEN>/<path>`
for file downloads. `C1`

**Auth:** a bot token from **@BotFather**. No OAuth, no refresh, no expiry. The user creates a bot (or
we instruct them to add *our* bot), adds it to their channel as an administrator with "Post Messages"
right, and gives us the channel `@username` or numeric ID (`-100…`). `C1`

**Two onboarding models — pick deliberately:**

| Model | UX | Pros | Cons |
|---|---|---|---|
| **Customer's own bot** | User runs /newbot, pastes token to us | No shared rate limit; branding is theirs; no trust issue | 6-step onboarding; support burden |
| **Our shared bot** | User adds `@OurBrandBot` as channel admin, then we detect via `my_chat_member` update | 2-step onboarding | Our bot's global 30 msg/s ceiling is shared across all tenants; a mass-schedule event can self-DoS |

Recommendation: **support both**, default to "our bot" for SMB and offer "your bot" for agencies and
high-volume tenants. `C1` reasoning.

**Publishing methods (`C2`):** `sendMessage` (parse_mode `HTML`/`MarkdownV2`, `link_preview_options`,
`entities`), `sendPhoto`, `sendVideo`, `sendAnimation`, `sendAudio`, `sendVoice`, `sendDocument`,
`sendMediaGroup` (2–10 items, the album), `sendPoll`, `sendLocation`, `sendVenue`, `sendSticker`,
`copyMessage`, `forwardMessage`. Editing: `editMessageText`, `editMessageCaption`, `editMessageMedia`,
`editMessageReplyMarkup`. Deletion: `deleteMessage`, `deleteMessages`. Pinning: `pinChatMessage`.
Inline keyboards via `reply_markup` — **a genuine differentiator**: we can attach CTA buttons with URLs
to every channel post, which no other social surface allows.

**Media limits (`C2`/`C3`):** by URL or `file_id` or multipart upload; **50 MB upload limit via Bot API**
for most types (2 GB when using a local Bot API server), 10 MB for photos by URL. Photos ≤10 MB,
videos should be MP4/H.264. Album items must be all photo/video.

**Native scheduling:** **No.** Telegram's own apps can schedule, the Bot API cannot. Our scheduler owns
the moment. `C1`

**Reads/analytics — this is the weak spot (`C1`):** the Bot API gives `getChat`,
`getChatMemberCount`, `getChatAdministrators`. **It does not give post views, forwards, or subscriber
growth**, which are exactly the metrics a Telegram channel owner cares about (the app shows a "👁 1.2K"
view count on every channel post; it is not in the Bot API).

Paths to real Telegram analytics, all imperfect:
- **TDLib / MTProto with a user account** (`api_id`/`api_hash` from my.telegram.org): exposes
  `getChatStatistics` / `getMessageStatistics` (views, shares, subscriber graphs) for channels the user
  administers. Requires the *user's* phone-number login session — heavy, scary for customers, and
  operationally fragile (session bans, 2FA, SMS codes). `C2`
- **Scraping `t.me/s/{channel}`** — the public web preview shows view counts. ToS-grey, breaks often.
- **Accepting the gap** and reporting only member count + our own click tracking (wrapped URLs).

Recommendation: ship Bot API only in v1, wrap all outbound links with our shortener for click
attribution, and evaluate TDLib as an opt-in "Advanced Telegram Analytics" later. `C1` reasoning.

**Telegram Business (`C2`, 2024+):** Telegram Business accounts can connect a bot, which then receives
`business_connection` and `business_message` updates and can reply **as the business account** via
`business_connection_id` on send methods. This is a legitimate, first-party path to a **Telegram
inbox** feature. Worth an explicit spike — it is unusual for a messaging platform to allow this.

**Rate limits (`C3`):** informally documented — ~30 messages/second total; ~1 message/second to the
same chat; ~20 messages/minute to the same group. Bulk broadcasts require throttling and respect for
`429` + `parameters.retry_after` (seconds). Telegram returns retry_after explicitly — honour it exactly.

**Cost:** free. **Approval:** none. **Effort: S** (3–5 days for posting + albums + buttons), **M** with
webhook inbox and Business-account support.

---

### 6.4 WhatsApp Business Platform (Cloud API)

**Verdict: build it as a *messaging/inbox* channel, not a *publishing* channel. Status and Channels
are not addressable.**

**Base:** `https://graph.facebook.com/v{NN}.0/{PHONE_NUMBER_ID}/messages` — it is Meta Graph, so if we
have tier-1 Meta plumbing (`06` §12) much of the auth machinery is reusable. `C1`

**Auth & onboarding (`C1`):** the customer's **WhatsApp Business Account (WABA)** must be connected to
our Meta app. The production path is **Embedded Signup** — a Meta-provided JS flow that creates/links a
WABA, registers a phone number, and returns a code we exchange for a token. Requires:
- Meta App with **WhatsApp** product added
- Permissions `whatsapp_business_management`, `whatsapp_business_messaging` (+ `business_management`)
- **Meta Business Verification** of our legal entity
- **App Review** for those permissions
- A **System User** token for long-lived server access

Calendar friction: weeks. Treat as `L`, and read `06` §10 for how Meta's review behaves in practice.

**Message model (`C1` — the thing engineers get wrong):**
- **Free-form messages** are only allowed inside a **24-hour customer service window** opened by an
  inbound user message.
- Outside that window, you may only send **approved message templates**, categorized
  `MARKETING`, `UTILITY`, or `AUTHENTICATION`. Templates are created via
  `POST /{WABA_ID}/message_templates` and go through **Meta review** (minutes to ~24h), with
  named/positional variables, header/body/footer, buttons (URL, quick reply, call), and per-language
  versions. Rejected/paused templates are a first-class operational state — quality drops can pause a
  template automatically.

**Pricing (`C1` that it changed, `C3` on numbers):** Meta moved from **per-conversation** (24-hour
window) pricing to **per-message** pricing for template categories, phased through **1 July 2025**.
Service conversations (user-initiated, within window) became **free** from **1 November 2024**, and
**utility templates sent inside an open customer-service window** are also free. Rates are
**per-country and per-category**, ranging from roughly sub-cent (India, Brazil) to a few cents (US, UK)
per marketing message. **Every number here is `C3` — build a rate-card table that is loaded from
config, never hardcoded, and expose a cost estimator in the composer.**

**Throughput & limits (`C3`):**
- **Messaging tier** limits unique customers you may *initiate* to per rolling 24 h:
  1K → 10K → 100K → unlimited, gated by **quality rating** (green/yellow/red) and
  auto-upgraded on volume+quality. New numbers often start at a 250-customer trial tier.
- **Throughput**: Cloud API default ~80 messages/second (combined send+receive), upgradable to
  ~1,000 mps on request.
- Business-initiated conversation caps and per-template pacing also apply.

**Webhooks (`C1`):** `messages` (inbound), `message_status` (sent/delivered/read/failed),
`message_template_status_update`, `phone_number_quality_update`, `account_update`. Signed with
`X-Hub-Signature-256` — same verification code as Meta tier-1.

**Status & Channels — the explicit gap (`C1`):**
- **WhatsApp Status** (the 24-hour ephemeral story surface): **no API.** Not in Cloud API, not in
  On-Premises API, not via BSPs. Cannot be posted, read, or measured.
- **WhatsApp Channels** (the one-to-many broadcast product launched 2023): administered **only in the
  WhatsApp app / WhatsApp Manager**. **No public Channels API** as of my cutoff — no create-channel,
  no post-to-channel, no channel analytics endpoint. Follower counts and reactions are UI-only.
  **`UNVERIFIED` whether Meta shipped anything here between May 2026 and today — this is verification
  item #3 in §20, because it would be a genuinely large product opportunity if it exists.**

**What we ship:** WhatsApp as a **conversational inbox + template campaign** channel (opt-in ledger,
template library with approval state, cost meter, 24h-window UI affordance), and an explicit
"Status/Channels not available via API" note in the channel picker.

**Effort: L** (4–6 weeks): Embedded Signup, template CRUD + approval state machine, send pipeline,
webhook ingestion, per-country pricing meter, opt-in/consent records.

---

### 6.5 Bluesky / AT Protocol

**Verdict: build it. Cheap, no approval, real user demand, and the protocol is genuinely pleasant.**

**Base:** XRPC over HTTPS. Default PDS `https://bsky.social/xrpc/`, but **the PDS host is per-account**
— resolve it from the user's DID document rather than hardcoding (`com.atproto.identity.resolveHandle`
→ DID → PLC directory → `#atproto_pds` service endpoint). Third-party PDS hosting is real and growing.
`C1`

**Auth (`C1`, two paths):**
1. **App passwords** — user generates one at Settings → App Passwords; we call
   `com.atproto.server.createSession` with `identifier` + `password` → `accessJwt` (short-lived, ~2 h)
   + `refreshJwt` (long-lived) → refresh via `com.atproto.server.refreshSession`. Simple, works today,
   but the user is handing us a credential and app passwords historically granted broad access
   (a scoped/limited variant exists for DMs). `C2`
2. **atproto OAuth** — the DPoP-bound OAuth profile rolled out through 2024–25, with client metadata
   published at a `client_id` URL, PAR, and per-request DPoP proofs. More work (DPoP nonce handling,
   key rotation) but it is the direction of travel and better security posture. `C2`

Recommendation: ship app passwords first (days), add OAuth as a fast follow. Model the connection so
the credential type is polymorphic.

**Publishing (`C1`):** everything is `com.atproto.repo.createRecord` with `collection` =
`app.bsky.feed.post` and a record containing `text`, `createdAt`, optional `embed`, `facets`,
`langs`, `reply`, `labels`.

**The three gotchas that make this an M, not an S:**

1. **Facets are byte offsets, computed by us.** Bluesky does *not* auto-link URLs, mentions or
   hashtags. We must tokenize the text and emit `facets: [{index: {byteStart, byteEnd}, features:
   [{$type: "app.bsky.richtext.facet#link", uri}]}]` — and the offsets are **UTF-8 byte** offsets, not
   JS string indices. Emoji and non-Latin text break naive implementations. Mentions require resolving
   the handle to a DID first. `C1`
2. **300 graphemes, not 300 characters.** The limit is counted in graphemes (and links count in full
   against it unless shortened in display text with a facet covering the shortened form). Our composer's
   counter must match exactly or users will be surprised. `C2`
3. **Blobs.** `com.atproto.repo.uploadBlob` returns a blob ref to embed. Image size limit is small
   (~1 MB per image, `C3`) — **we must transcode/compress client- or server-side before upload**, and
   supply `aspectRatio` and `alt` text (alt is strongly expected by the community). Up to 4 images per
   post. `C2`

**Video (`C2`):** the `app.bsky.video` lexicon (`uploadVideo`, `getJobStatus`, `getUploadLimits`)
added 2024 — async job model, ~50 MB / ~3 minutes, with **daily per-user caps** (order of 10 videos
and a few hundred MB per day, `C3`). Poll `getJobStatus` until `JOB_STATE_COMPLETED`, then embed.

**Threads:** self-replies with `reply: {root, parent}` strong refs. Our composer should support native
thread authoring since Bluesky and X are the two surfaces where it matters.

**Other useful records:** `app.bsky.feed.repost`, `app.bsky.feed.like`, `app.bsky.graph.follow`,
`app.bsky.actor.profile` (update bio/avatar), `app.bsky.feed.threadgate` (reply controls — a nice
"who can reply" composer feature), `app.bsky.feed.postgate` (quote controls), starter packs, lists.

**Reads/analytics (`C1` — thin):** `app.bsky.feed.getPostThread`, `getAuthorFeed`,
`app.bsky.actor.getProfile` (followers/follows/posts counts), `getLikes`, `getRepostedBy`,
`app.bsky.notification.listNotifications` (mentions, replies, likes — our inbox source).
**No impressions, no reach, no click data.** Engagement counts only. Wrap links for click tracking.

**Listening — a genuine differentiator (`C1`):** the network is open. The **firehose**
(`com.atproto.sync.subscribeRepos`, or the much simpler **Jetstream** JSON WebSocket relay) streams
*every public post on the network in real time, for free*. No other network offers this. Caveat from
`/root/.ccr/README.md`: **WebSocket upgrades are not supported through this session's egress proxy** —
that is a constraint on *this research session*, not on production, but it does mean firehose work
cannot be prototyped here. `app.bsky.feed.searchPosts` provides polling-based search as an alternative.

**Rate limits (`C3`):** documented as a points system — roughly `CREATE=3`, `UPDATE=2`, `DELETE=1`
points, with limits around **5,000 points/hour** and **35,000 points/day** per DID (≈1,666 creates/hour,
≈11,666/day), plus a global per-IP ceiling in the low thousands per 5 minutes and tighter limits on
`createSession`/`createAccount`. Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

**Cost:** free. **Approval:** none. **Effort: M** (1.5–2.5 weeks including facets, blobs, threads;
+1 week for video and OAuth).

---

### 6.6 Mastodon, ActivityPub and the wider Fediverse

**Verdict: build the Mastodon-compatible adapter (archetype C). It unlocks 5+ platforms for the price
of ~1.3.**

**The structural fact (`C1`):** there is no central Mastodon company to register an app with. Each
server is sovereign. Therefore:

```
POST https://{instance}/api/v1/apps
  client_name, redirect_uris, scopes, website
→ {client_id, client_secret, vapid_key}

then normal OAuth2:
GET  https://{instance}/oauth/authorize?client_id=…&scope=…&redirect_uri=…&response_type=code
POST https://{instance}/oauth/token   (code → access_token)
```

`C2` on paths, `C1` on the pattern. **Cache `client_id`/`client_secret` per host** in a
`fediverse_instance_clients` table so the Nth user on `mastodon.social` reuses the registration.

**Access tokens do not expire by default** on Mastodon (`C2`) — but 4.3+ introduced OAuth token
expiry/refresh support on some deployments, so handle `refresh_token` when present and handle 401 →
re-auth gracefully.

**Scopes (`C2`):** classic `read write follow push`; Mastodon 4.3+ supports granular scopes
(`write:statuses`, `write:media`, `read:accounts`, `read:notifications`, `read:search`). Request
granular where supported and fall back to coarse — **detect via `GET /api/v2/instance` version string.**

**Publishing (`C2`):**
- `POST /api/v1/statuses` — `status`, `media_ids[]`, `poll[options][]`/`poll[expires_in]`,
  `in_reply_to_id`, `sensitive`, `spoiler_text` (content warning), `visibility`
  (`public|unlisted|private|direct`), `language`, **`scheduled_at`**.
- **Idempotency-Key header** is supported — use it. Rare and valuable for a scheduler.
- Media: `POST /api/v2/media` (async; returns 202 with an id, poll `GET /api/v1/media/{id}` until
  processed), then attach. `description` = alt text, `focus` = focal point.
- **Native scheduling:** `scheduled_at` must be **≥5 minutes** in the future; managed via
  `GET/PUT/DELETE /api/v1/scheduled_statuses`. One of the few tier-2 surfaces where we can hand the
  moment to the platform.

**Character limit is per-instance** — default 500, but instances configure anything from 500 to 65,535.
`GET /api/v2/instance` → `configuration.statuses.max_characters`,
`max_media_attachments`, `characters_reserved_per_url`, and `configuration.media_attachments`
(supported MIME types, `image_size_limit`, `video_size_limit`). **Our composer must fetch and honour
per-connection limits.** `C1` — this is the #1 thing generic adapters get wrong.

**Reads (`C2`):** `GET /api/v1/accounts/{id}/statuses`, `/api/v1/statuses/{id}`
(`replies_count`, `reblogs_count`, `favourites_count`), `/api/v1/notifications` (mentions → inbox),
`/api/v1/timelines/{home,public,tag/{hashtag}}`, `/api/v2/search`. Streaming API over WebSocket
(`/api/v1/streaming`) for real-time.
**No impressions.** Some instances disable public timeline/search for privacy.

**Rate limits (`C3`):** Mastodon defaults ~**300 requests / 5 minutes per access token**, ~300 per 5
min per IP for unauthenticated; media uploads ~30 per 30 minutes; **`POST /api/v1/statuses` ~300 per 30
minutes**. Admins can and do change these. Headers `X-RateLimit-Limit`, `-Remaining`, `-Reset`.
**Track limits per (instance, token) pair, not globally.**

**Fediverse family coverage from the same adapter (`C2`):**

| Software | Mastodon-API compatible? | Notes |
|---|---|---|
| **Pleroma / Akkoma** | Yes (largely) | Longer default char limits; some endpoints missing |
| **GoToSocial** | Yes (subset) | Lightweight; scheduled statuses may be absent |
| **Pixelfed** | Yes | Image-first; good for photo cross-posting |
| **Firefish / Iceshrimp** | Partial | Misskey-derived with a Mastodon compat layer |
| **Misskey / Sharkey** | **No** — own API (`/api/notes/create`, token-based) | Separate small adapter, S |
| **Lemmy** | **No** — own API (`/api/v3/post`, JWT) | Reddit-shaped; separate adapter, M |
| **PeerTube** | **No** — own API (OAuth2 password grant, `/api/v1/videos/upload`, resumable) | Video; separate adapter, M |
| **WriteFreely** | **No** — own API | Blogging; S |
| **Threads (Meta)** | Federates outbound via ActivityPub; posting is via the Threads API | See `06` §12 |

**Cost:** free. **Approval:** none per se, but **instance admins may block our user-agent or app** if we
generate spam — treat Fediverse posting cadence conservatively and publish a contact address in the
app registration `website` field. `C1` cultural note: the Fediverse is actively hostile to bulk
marketing automation; a "cross-post everything everywhere" default will get us domain-blocked.

**Effort: L** for the first (dynamic registration, instance capability probing, per-instance limits),
then **S–M** per additional family member.

---

### 6.7 Discord

**Verdict: build the webhook path in a day; add the bot path when we want inbox/analytics.**

**Base:** `https://discord.com/api/v10`. `C1`

**Two integration paths (`C1`):**

| | **Incoming webhook** | **Bot application** |
|---|---|---|
| Setup | User creates a webhook in Channel Settings → Integrations, pastes URL to us | OAuth2 install flow (`/oauth2/authorize?client_id=…&scope=bot%20applications.commands&permissions=…`) |
| Auth | The URL *is* the secret (`/webhooks/{id}/{token}`) | `Authorization: Bot {token}` |
| Can post | Yes — content, up to 10 embeds, files, `username`/`avatar_url` override, threads (`?thread_id=`) | Yes — everything |
| Can read | **No** | Yes (channel history, reactions, members) |
| Per-channel | Yes — one webhook per channel | One bot, many channels |
| Friction | **Minimal** | Bot must be invited by a server admin with Manage Server |
| Verification | None | Required at 100+ guilds; Message Content is a **privileged intent** requiring justification |

**Recommendation:** ship webhooks first. It is the single lowest-friction publishing integration in this
entire document — no OAuth, no app review, no token refresh — and it covers the actual use case
(announcing content to a community). Add the bot for inbox/reactions later.

**Publishing specifics (`C2`):** `POST /channels/{channel.id}/messages` or
`POST /webhooks/{id}/{token}` with JSON body `{content, embeds[], components[], attachments[],
allowed_mentions, flags, tts}`; files via `multipart/form-data` with `payload_json`.
Limits: content 2,000 chars (4,000 with Nitro, irrelevant for bots), 10 embeds/message, embed total
6,000 chars, 25 MB attachment default (server boost raises it), `components` for buttons/links.
`?wait=true` on webhook execute returns the created message object (needed to store the message id).
Threads: `POST /channels/{id}/threads` or `thread_name` on a forum-channel webhook.
**Guild Scheduled Events:** `POST /guilds/{id}/scheduled-events` — genuinely useful for community
managers and rarely supported by SMM tools.

**Reads/analytics (`C1` — thin):** message objects carry `reactions[]` (emoji + count);
`GET /guilds/{id}?with_counts=true` gives approximate member and presence counts;
`GET /channels/{id}/messages` for history (bot path, and Message Content intent needed to read
*content* of messages the bot wasn't mentioned in). Discord's **Server Insights** (retention, growth,
engagement) is **dashboard-only, no API** — a real gap for community-manager customers. `C1`

**Rate limits (`C2`):** per-route **buckets** advertised via `X-RateLimit-Bucket`,
`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset-After`, plus a **global 50 req/s** per
bot and a separate **invalid-request ceiling (10,000 per 10 min → temporary IP ban)** which is the one
that actually bites badly-written clients. Webhook execute is roughly 5 requests per 2 seconds per
webhook (`C3`). Implement a bucket-aware limiter keyed by the returned bucket hash — a naive global
limiter will both over-throttle and still get 429s.

**Cost:** free. **Approval:** none for webhooks; bot verification at 100 guilds. **Effort: S** (webhook,
2–4 days) / **M** (bot install flow, permissions calculator, event handling).

---

### 6.8 Twitch

**Verdict: build it as a *metadata + go-live + chat* integration. There is no content upload API.**

**Base:** `https://api.twitch.tv/helix/`. Every request needs `Client-Id` + `Authorization: Bearer`.
`C1`

**Auth (`C2`):** OAuth2 at `id.twitch.tv/oauth2/authorize`. Two token types: **app access token**
(client credentials — for public data and EventSub webhook subscriptions) and **user access token**
(authorization code — for anything channel-owned). Scopes we care about: `channel:manage:broadcast`
(title/category/tags), `channel:manage:schedule`, `clips:edit`, `user:write:chat` +
`channel:bot`/`user:bot` (chat send), `moderator:read:followers`, `analytics:read:games`,
`analytics:read:extensions`, `channel:read:subscriptions`.

**What "publishing" means here (`C1`):**

| Capability | Endpoint |
|---|---|
| Update stream title / game / tags / CCLs / branded-content flag | `PATCH /helix/channels` |
| Create a schedule segment (recurring or one-off stream slot) | `POST /helix/schedule/segment` |
| Send a chat message | `POST /helix/chat/messages` (moved from IRC to Helix in 2024, `C2`) |
| Send a chat announcement | `POST /helix/chat/announcements` |
| Create a clip from the live stream | `POST /helix/clips` |
| Create poll / prediction | `POST /helix/polls`, `/helix/predictions` |
| Start a raid, run a commercial | `POST /helix/raids`, `/helix/channels/commercial` |
| **Upload a video (VOD)** | **Does not exist.** Twitch removed video upload from the API years ago. `C1` |

**Reads/analytics (`C2`):** `GET /helix/streams` (live state, viewer count),
`GET /helix/videos` (VOD list with view counts), `GET /helix/channels/followers` (total + list;
list requires `moderator:read:followers` — Twitch restricted follower data in 2023),
`GET /helix/subscriptions`, `GET /helix/bits/leaderboard`,
`GET /helix/analytics/games` and `/helix/analytics/extensions` (return **signed CSV report URLs**, not
JSON — an unusual and easily-missed pattern), `GET /helix/games/top`, `GET /helix/search/channels`.

**EventSub (`C1`, high value):** webhook or WebSocket subscriptions to `stream.online`,
`stream.offline`, `channel.update`, `channel.follow`, `channel.subscribe`,
`channel.chat.message`, `channel.raid`, `channel.poll.*`. **`stream.online` is the killer feature**:
auto-cross-post "I'm live" to X/Discord/Telegram/Bluesky the instant a stream starts. That single
workflow justifies the integration for creator customers. Webhook transport requires a public HTTPS
callback with HMAC verification (`Twitch-Eventsub-Message-Signature`).

**Rate limits (`C3`):** Helix uses a **points bucket**, default **800 points/minute** per client id
(most endpoints cost 1), surfaced via `Ratelimit-Limit`, `Ratelimit-Remaining`, `Ratelimit-Reset`.
EventSub has a **total cost limit** (order of 10,000 for app tokens, with cost 0 for subscriptions on
channels that authorized you, `C3`) and a per-user subscription cap (3 per type per user, `C3`).

**Cost:** free. **Approval:** self-serve app registration at dev.twitch.tv; no review for the scopes
above. **Effort: M** (1.5–2 weeks including EventSub webhook infrastructure).

---

### 6.9 Tumblr

**Verdict: build it. Low friction, real (if niche) audience, and NPF is the only real work.**

**Base:** `https://api.tumblr.com/v2/`. `C1`

**Auth (`C2`):** OAuth1.0a historically; **OAuth2 available** at `https://www.tumblr.com/oauth2/authorize`
with token exchange at `/v2/oauth2/token`, scopes `basic write offline_access`. Use OAuth2 — the
OAuth1.0a signing code is pure cost.

**Publishing (`C2`):**
- Modern: `POST /v2/blog/{blog-identifier}/posts` with **NPF (Neue Post Format)** — a `content[]` array
  of typed blocks (`text` with subtypes `heading1|heading2|quote|indented|chat|ordered-list-item|
  unordered-list-item`, `image`, `video`, `audio`, `link`, `poll`) plus a `layout[]` array
  (`rows`, `condensed`, `ask`) and inline `formatting[]` ranges (bold/italic/link/mention/color) with
  **start/end indices**. Same class of problem as Bluesky facets — index-based rich text.
- Legacy: `POST /v2/blog/{id}/post` with `type=text|photo|quote|link|chat|audio|video` still works and
  is far simpler. **Pragmatic call: implement legacy for v1, NPF for v2** — NPF is required for polls
  and for faithful rich content.
- Common params: `tags` (comma-separated), `state` = `published|draft|queue|private`,
  **`publish_on`** (ISO 8601, with `state=queue`) = **native scheduling**, `slug`, `source_url`,
  `send_to_twitter` (vestigial), `interactability_reblog`.
- Editing: `PUT /v2/blog/{id}/posts/{post-id}`; delete: `POST /v2/blog/{id}/post/delete`.
- Reblog: `POST` with `parent_tumblelog_uuid` + `reblog_key` + `parent_post_id`.

**Reads (`C2`):** `GET /v2/blog/{id}/info` (followers count — owner only, `total_posts`),
`GET /v2/blog/{id}/posts?notes_info=true` (note count + note detail: likes, reblogs, replies),
`GET /v2/blog/{id}/followers`, `GET /v2/user/dashboard`, `GET /v2/tagged?tag=`.
**No impressions.** Tumblr's own post-level "notes" is the only engagement metric. `C1`

**Rate limits (`C3`):** per consumer key **1,000 requests/hour and 5,000/day**; per user **250 new
posts/day**, **150 image uploads/day**, **10 video uploads/day** (5 minutes / 100 MB max). These
per-user caps are unusually strict and must be modelled in the scheduler (a bulk-import feature can
exhaust a user's daily quota).

**Cost:** free. **Approval:** self-serve app registration (`tumblr.com/oauth/apps`), though Tumblr has
occasionally been slow to approve new app registrations (`C3`). **Effort: M** (1.5–2 weeks with legacy
types + media; +1 week for full NPF).

---

### 6.10 Nextdoor

**Verdict: partner-gated. Pursue the partnership only if multi-location local businesses are a target
segment; ship reminder-publish meanwhile.**

**What exists (`C1` shape, `C2`/`UNVERIFIED` details):**
- **Nextdoor Ads API** — `ads.nextdoor.com` / developer portal, OAuth2, campaign/ad-group/ad/creative
  CRUD plus reporting. Self-serve-ish for advertisers.
- **Nextdoor Conversions API** — server-side event ingestion for ad attribution.
- **Business/organic posting** — Nextdoor Business Pages can publish posts, but a *public, self-serve*
  organic posting API is not something I can confirm. Nextdoor has run a **partner program** for
  multi-location/franchise brands and reputation vendors (the same cohort that integrates Yext,
  Chatmeter, Rallio). `UNVERIFIED` on endpoints, scopes, limits, and whether it is generally available.

**Evidence from the competitive set (`C1`):** Hootsuite, Buffer, Sprout, Later and Vista Social do not
offer Nextdoor organic publishing. Local-marketing platforms aimed at franchises sometimes do. That
asymmetry is itself strong evidence the capability is partner-gated rather than open.

**Play:** (a) reminder-publish with a Nextdoor content profile now; (b) open a partnership
conversation in parallel; (c) if we land it, it is a **loud** differentiator for the local/franchise
segment because virtually no scheduler has it.

**Effort:** XL (partner), S (reminder).

---

### 6.11 Truth Social, Gettr, Lemon8

Grouped because the answer is the same: **no supported integration path.** `C1`

| Platform | Technical reality | Why we can't |
|---|---|---|
| **Truth Social** | A **Mastodon fork** — `/api/v1/statuses` etc. exist and are shaped exactly like §6.6. | There is **no public developer app registration**. Unofficial tooling (e.g. `truthbrush`) authenticates with a hardcoded client id and username/password, behind Cloudflare bot protection. Using it for a commercial product means: credential-stuffing-shaped auth, ToS violation, Cloudflare arms race, and account bans for our customers. **Do not ship.** |
| **Gettr** | An undocumented JSON API (`api.gettr.com`) that unofficial clients call. | No developer program, no terms permitting third-party posting, no stability guarantee. |
| **Lemon8** | ByteDance product. The TikTok for Developers platform (`06` §15) does **not** cover Lemon8. | No API of any kind. |

**Play for all three:** reminder-publish entries with correct character/media profiles, plus a clear
"no API — assisted publishing only" label. If Truth Social ever opens a developer program, our Mastodon
adapter (§6.6) covers ~90% of the work — a nice option value from building archetype C.

---

## 7. Messaging channels

> Messaging is a different business from publishing: per-message cost, consent/opt-in law
> (TCPA, GDPR, CASL), template approval, and 24-hour session windows. Treat it as a separate module
> with its own billing meter. See `11-compliance-security-global.md`.

### 7.1 Google Business Messages — **DEAD**

**Status (`C1`, date `C2`):** Google **shut down Business Messages on 31 July 2024**, including the
Business Messages API, the agent/brand model, and the Google Search/Maps "Message" entry points.
Google's guidance directed partners toward other channels; there is no drop-in successor.

**Consequences for us:**
- Remove it from any roadmap or comparison matrix.
- **Any competitor's feature matrix that still lists "Google Business Messages" is stale by two
  years** — this is a cheap, concrete credibility attack in sales collateral.
- The "message a business from Google Maps" surface is now largely absent, which raises the relative
  value of **Google Business Profile Q&A** (§11.1) as the public question-answering surface, and of
  RCS for conversational messaging.

**Effort: N/A.**

---

### 7.2 Apple Messages for Business

**Verdict: XL. Only pursue via an existing MSP, and only if enterprise/retail is a target segment.**

**Model (`C1`):**
1. The **brand** registers in **Apple Business Register** and is approved by Apple.
2. Messages are routed through a **Messaging Service Provider (MSP)** — Apple's approved partner list
   (Salesforce, LivePerson, Sprinklr, Genesys, Zendesk, Twilio et al., `C2`) — **or** the brand builds
   its own **Customer Service Platform (CSP)** integration directly to Apple's endpoints.
3. Entry points ("Message" buttons) are configured per surface: Maps, Safari, Siri, Search, plus
   in-app/website buttons and QR codes.

**API surface (`C2`):** REST over `https://mspgw.push.apple.com/v1/` with
`message`, `preupload`, `decodePayload`, `attachment` operations; authentication via a JWT (or API
credentials) issued to the MSP/CSP, with `source-id` / `destination-id` headers identifying the
business and the customer's opaque id. Rich features: list pickers, time pickers, **Apple Pay**,
authentication requests, forms, and custom **iMessage apps**. Inbound messages arrive at a webhook.

**Approval friction (`C1`, the dominant cost):** Apple approves (a) the brand, (b) the provider, and
(c) each entry point. Becoming a *registered MSP* is a formal Apple partner process measured in
**months** with technical certification. Integrating as a *brand via an existing MSP* is faster but
means paying that MSP and living inside their data model.

**Cost (`C3`):** no per-message fee from Apple; the cost is the MSP contract (typically enterprise,
4–5 figures/yr) or the engineering cost of becoming a CSP.

**Recommendation:** **defer.** If a large customer demands it, integrate through their existing MSP
rather than becoming one. Effort: **XL** direct / **L** as a brand-side integration on an MSP.

---

### 7.3 RCS Business Messaging (RBM)

**Verdict: L via a CPaaS aggregator; XL direct. Strategically interesting because iOS finally speaks
RCS, but it is an SMS-replacement channel, not a social channel.**

**Why it matters now (`C1`/`C2`):** Apple added RCS support in **iOS 18 (2024)**, which for the first
time made RCS a cross-platform business channel rather than an Android-only one. That materially
changes the addressable audience.

**Direct path (`C1`):** Google's RBM platform — API at
`https://rcsbusinessmessaging.googleapis.com/v1/phones/{E164}/agentMessages` (plus `/agentEvents`,
capability checks via `phones/{E164}/capabilities`), authenticated with a **GCP service account**
scoped to the agent. Requires:
- Becoming an **RBM partner** (Google application + approval),
- Creating and **verifying an agent** (brand verification with logo, colour, description),
- **Carrier launch approval per carrier per country** — the real bottleneck. US carriers historically
  charge and gate.

**Aggregator path (`C1`, recommended):** Sinch, Twilio, Infobip, Vonage, Bird (MessageBird), Kaleyra
all resell RBM with a unified API and handle carrier onboarding. Twilio in particular exposes RCS as a
channel behind its **Content API** templates, so one template definition can fan out to SMS/WhatsApp/RCS.

**Capabilities (`C2`):** rich cards, carousels, suggested replies and suggested actions (dial, open
URL, share location, calendar), file/media messages, read receipts and typing indicators, verified
sender badge with brand logo — a genuinely richer surface than SMS.

**Cost (`C3`):** per-message, carrier-dependent. Order of **$0.005–$0.05** per message in the US with
distinct rates for basic vs single-message vs conversational sessions; plus aggregator margin. **Model
it as a metered cost passed through with markup.**

**Rate limits:** aggregator-dependent; RBM itself throttles per agent (`UNVERIFIED`).

**Recommendation:** if we build messaging at all, build **one abstract "business messaging" channel**
with WhatsApp + RCS + SMS behind a single template/campaign model (archetype F), and implement RCS via
one CPaaS. **Effort: L.**

---

### 7.4 Viber

**Verdict: M for the free Bot API; the paid Business Messages product needs an aggregator.**

**Two products (`C1`):**

**(a) Viber Bot API** (also called Public Accounts / Chatbots) —
`https://chatapi.viber.com/pa/{method}`, auth via the **`X-Viber-Auth-Token`** header carrying the bot
token from the Viber Admin Panel. Webhook-first: you call `set_webhook` and Viber pushes
`message`, `subscribed`, `unsubscribed`, `delivered`, `seen`, `failed` and `conversation_started`
events. Send methods: `send_message` (types: `text`, `picture`, `video`, `file`, `contact`,
`location`, `url`, `sticker`, `rich_media` — the carousel), and `broadcast_message` (limited to a
few hundred recipients per call, `C3`). `get_account_info`, `get_user_details`,
`get_online`. Free. `C2`

**(b) Viber Business Messages** (transactional/promotional, formerly "Viber Business Messages" /
"Viber for Business") — sold through aggregators (Sinch, Infobip, Twilio, CM.com). Per-message
pricing, template/branding approval, session and promotional message types, strong in
CEE / SEE / Greece / Philippines / Russia-adjacent markets. `C1`

**Where Viber matters:** it is a *regional* channel (Eastern/Southeastern Europe, Greece, Philippines,
Middle East) more than a Western one — see `08-platform-apis-regional.md`. For a Western-focused
product it is a "nice to have" that costs a week.

**Rate limits (`C3`):** bot sends are rate limited per account; `broadcast_message` caps recipients per
call; honour 429s. **Effort: M** (bot API + webhook), **N/A** for Business Messages without an
aggregator deal.

---

### 7.5 Signal — **NOT FEASIBLE**

**Verdict: document the "no" clearly and move on. This is the cleanest "no" in the document.** `C1`

- Signal is operated by a **non-profit foundation with an explicitly anti-commercial-messaging
  posture**. There is **no business API, no bot platform, no partner program, no CPaaS route.**
- The only automation surface is **unofficial**: `signal-cli` / `signald` / `libsignal` wrappers that
  drive a *real user account* registered to a phone number. This:
  - is not a supported API and offers no stability guarantee,
  - violates Signal's terms for commercial/bulk use,
  - reliably gets numbers **rate-limited and banned**,
  - would put us in the position of shipping a product that breaks our customers' accounts.
- Signal's **sealed sender** and end-to-end design also mean there is no server-side surface for us to
  read or analyze even if we wanted to.

**Answer to "can you do Signal?": No, and no vendor legitimately can.** Any competitor claiming Signal
support is either using signal-cli (fragile + ToS-violating) or lying. **Effort: N/A.**

---

### 7.6 Slack as a distribution channel

**Verdict: S–M, and worth it — internal distribution (employee advocacy, approvals, alerting) is a
real feature, and Slack is also a *notification sink* for our own product.**

**Base:** `https://slack.com/api/{method}`, JSON or form-encoded, `Authorization: Bearer xoxb-…`. `C1`

**Auth (`C2`):** OAuth2 v2 (`/oauth/v2/authorize` → `oauth.v2.access`) yielding a **bot token**
(`xoxb-`) and optionally a user token (`xoxp-`). Scopes: `chat:write`, `chat:write.public` (post to
public channels without joining), `files:write`, `channels:read`, `groups:read`, `im:write`,
`users:read`, `reactions:read`, `channels:history` (restricted, see below), `incoming-webhook`.

**Publishing (`C2`):**
- `chat.postMessage` — `text` + **Block Kit** `blocks[]` (sections, images, buttons, context, dividers)
  and legacy `attachments`. Threads via `thread_ts`.
- **`chat.scheduleMessage`** — native future send, **up to 120 days ahead**, with
  `chat.scheduledMessages.list` / `chat.deleteScheduledMessage`. One of very few tier-2 native
  schedulers, and it makes Slack resilient to our own downtime.
- `chat.update`, `chat.delete`, `chat.postEphemeral`.
- **Files: `files.upload` was retired (March 2025, `C2`)**. The current flow is
  `files.getUploadURLExternal` → PUT the bytes to the returned URL → `files.completeUploadExternal`
  (the `files.uploadV2` helper in the SDKs wraps this). **Anything written against `files.upload` is
  already broken.**
- **Incoming Webhooks** — a per-channel URL, zero-API-token posting. Same low-friction virtue as
  Discord webhooks.

**Reads (`C1` — recently degraded):** `conversations.list`, `conversations.info`, `users.list`,
`reactions.get`. **Important 2025 change (`C2`):** Slack sharply restricted `conversations.history`
and `conversations.replies` for non-Marketplace apps — reported as roughly **1 request/minute and 15
messages returned**, and it removed bulk data export access for many apps. Do **not** architect a
"Slack analytics" or "Slack archive" feature; architect around Events API push instead
(`message.channels` etc. via subscriptions), which is the supported real-time path.

**Rate limits (`C2`):** method **tiers 1–4** (roughly 1+, 20+, 50+, 100+ requests/minute), with
`chat.postMessage` special-cased at about **1 message per second per channel** with short bursts.
429 responses carry `Retry-After`.

**Approval friction (`C1`):** internal/single-workspace apps need no review. **Distribution via the
Slack Marketplace requires a security/functionality review** (weeks) — needed if we want one-click
install for all customers rather than "create your own Slack app" instructions. Budget for it.

**Effort: S** for webhook + `chat.postMessage`; **M** with OAuth install, Block Kit composer, scheduled
messages and Events API.

---

### 7.7 Microsoft Teams as a distribution channel

**Verdict: M–L. Higher friction than Slack, and the easy path just got removed.**

**The retirement that matters (`C1`, dates `C2`):** Microsoft announced the **retirement of Office 365
Connectors (including "Incoming Webhook" connectors) in Teams** in late 2024, with the wind-down
running through 2025. The replacement guidance is **Power Automate Workflows** or the **Microsoft Graph
API / Bot Framework**. Any integration guide that says "paste a Teams webhook URL" is obsolete.

**Current paths (`C1`):**

| Path | Auth | Friction | Notes |
|---|---|---|---|
| **Power Automate "Workflows" webhook** | User-created flow in their tenant | Low for the *user*, but the URL is per-flow and the UX is Microsoft's, not ours | Practical stopgap; supports Adaptive Cards |
| **Microsoft Graph** `POST /teams/{team-id}/channels/{channel-id}/messages` | Entra ID OAuth2; **delegated** `ChannelMessage.Send` works, but **application** permissions for channel messages are gated** | High — tenant **admin consent**, and Microsoft gates app-level `ChannelMessage.Read.All` behind a **protected API request form** with usage-based billing for some scenarios | The "real" API |
| **Bot Framework / Teams app** | Bot registration + Teams app package (manifest, sideload or org catalog) | Medium-high — app package must be uploaded/approved by tenant admin, or published to Teams Store (review) | Enables proactive messaging and adaptive cards |
| **Incoming webhook (legacy connector)** | URL | **Being removed** | Do not build new |

**Content model (`C2`):** **Adaptive Cards** (JSON schema, versioned — Teams historically lags the
latest Adaptive Card version) rather than Slack's Block Kit. Plan a small internal abstraction that
renders our post preview into either Block Kit or an Adaptive Card.

**Rate limits (`C2`/`C3`):** Graph throttles per app per tenant with `429` + `Retry-After`; Teams
messaging has its own per-app/per-thread limits (order of a handful of requests per second per
channel). Bot Framework has separate limits.

**Recommendation:** ship **Power Automate Workflows** instructions + a Graph-based path for enterprise
tenants. Do not attempt Teams Store distribution until enterprise demand justifies it.
**Effort: M** (workflow + Adaptive Card renderer), **L** (Graph + Teams app package + admin consent UX).

---

## 8. Video & audio platforms

### 8.1 Vimeo

**Verdict: M, and worth it — Vimeo is the default "professional video host" for agencies and B2B, and
almost no SMM tool publishes to it.**

**Base:** `https://api.vimeo.com`, versioned via `Accept: application/vnd.vimeo.*+json;version=3.4`.
`C1`

**Auth (`C2`):** OAuth2 — `client_credentials` for public/unauthenticated data, `authorization_code`
for user-owned actions. Scopes: `public`, `private`, `create`, `edit`, `delete`, `interact`, `upload`,
`video_files`, `stats`. **`upload` and `video_files` must be explicitly requested/approved on the app**
in the developer console.

**Upload (`C1`, three approaches):**

| Approach | Mechanism | Use when |
|---|---|---|
| **`tus`** (recommended) | `POST /me/videos` with `upload.approach=tus` + `upload.size` → returns `upload.upload_link` → resumable PATCH chunks per the tus 1.0.0 protocol | Anything large; resumable, our default |
| **`pull`** | `upload.approach=pull` + `upload.link` = a publicly reachable URL Vimeo fetches | We already have media on a CDN — **lowest engineering cost** |
| **`post`** | Vimeo returns a form to POST to | Browser-direct uploads |

Then `PATCH /videos/{id}` for `name`, `description`, `privacy.view`
(`anybody|nobody|contacts|password|disable|unlisted`), `privacy.embed`, `password`, `license`,
`content_rating`, `embed` presets. Folders/showcases: `PUT /me/projects/{id}/videos/{video_id}`,
`/me/albums/{id}/videos/{video_id}`. Text tracks (captions): `POST /videos/{id}/texttracks`.
Thumbnails: `POST /videos/{id}/pictures` then `PATCH` with `active=true`.

**Native scheduling (`C3`):** Vimeo's product has scheduled publishing in some tiers; whether the
public API exposes a future publish timestamp is **`UNVERIFIED`**. Safe design: upload as
`privacy.view=nobody`/`unlisted` ahead of time and flip privacy at the scheduled moment — a pattern
worth implementing anyway because it makes the scheduled publish instantaneous (no upload race).

**Analytics (`C2`/`C3`):** `GET /videos/{id}/stats` gives plays. Richer analytics
(`/me/videos/{id}/analytics`-style endpoints, engagement graphs, geography) is **restricted to higher
paid plans**. Comments and likes via `/videos/{id}/comments`, `/likes`.

**Cost (`C1` structural, `C3` numbers):** the **API is free but the account plan gates upload quota,
storage, and analytics depth** — Vimeo's tiers (Starter / Standard / Advanced / Enterprise) with weekly
and annual upload caps. Our customer must be on a paid plan for meaningful use; we should surface plan
limits (`GET /me` returns `upload_quota`) in the UI before the user schedules a 4 GB upload.

**Rate limits (`UNVERIFIED`):** Vimeo documents per-app limits; I do not hold a reliable number.
Headers `X-RateLimit-Limit`/`-Remaining`/`-Reset` are returned (`C2`).

**Effort: M** (2–3 weeks) using the `pull` approach and privacy-flip scheduling.

---

### 8.2 SoundCloud — **BLOCKED**

**Verdict: N/A. Not a build decision — an availability problem.**

**The blocker (`C1`):** SoundCloud **stopped accepting new API application registrations** years ago
(the developer application form has been closed/paused since roughly 2019, reopening only sporadically
and selectively). Without a client id there is no integration, regardless of engineering appetite.

**If we ever obtain a key (`C2`):** `https://api.soundcloud.com`, OAuth2
(`/oauth2/token`, authorization code + refresh; SoundCloud moved to short-lived tokens with mandatory
refresh, `C2`). `POST /tracks` multipart with `track[asset_data]`, `track[title]`, `track[sharing]`,
`track[downloadable]`, `track[genre]`, `track[tag_list]`; `GET /me/tracks`,
`GET /tracks/{id}` (`playback_count`, `likes_count`, `comment_count`, `download_count`),
`GET /tracks/{id}/comments`. Rate limits historically ~15,000 requests/12 h per app plus separate
play/stream quotas (`C3`).

**Play:** mark "not supported — SoundCloud does not issue new API credentials", add to the watchlist,
and offer reminder-publish for podcasters/musicians. Revisit only if a partnership channel opens.

---

### 8.3 Podcasts: Spotify for Podcasters, Apple Podcasts, and the RSS truth

**The structural fact that reframes this whole category (`C1`): podcast distribution is RSS.** You do
not "publish to Spotify" or "publish to Apple Podcasts" — you publish to a **podcast host** that emits
an RSS feed containing `<item>` entries with `<enclosure url=… type=audio/mpeg length=…>`, and the
directories ingest that feed. Therefore:

- **"Publishing" support = integrating with podcast *hosts*** (Buzzsprout, Transistor, Captivate,
  Podbean, Libsyn, Simplecast, RSS.com, Spreaker, Castos — most of which have real REST APIs with API
  keys, archetype A) **or generating and hosting the RSS feed ourselves.**
- **"Analytics" is the hard part**, because listen data lives in each directory's private dashboard.

**Spotify for Podcasters (formerly Anchor) (`C1`):** **no public API** for creating episodes or
retrieving creator analytics. Everything is dashboard-only. Spotify's **Web API** exposes only public
catalogue metadata: `GET /v1/shows/{id}`, `GET /v1/shows/{id}/episodes`, `GET /v1/episodes/{id}` —
OAuth2 (client credentials suffices for public data), useful for "is my episode live on Spotify yet?"
checks and for pulling artwork/descriptions, nothing more. Spotify's **Megaphone** (enterprise podcast
platform, Spotify-owned) *does* have an API for shows/episodes/campaigns, but it is contract-gated
(`C2`).

**Apple Podcasts (`C2`):** the **Apple Podcasts Connect API** exists on developer.apple.com — JWT
(ES256) auth with a key generated in Podcasts Connect, in the same family as App Store Connect
(archetype E). Its primary documented purpose is **delegated delivery** (letting a hosting provider
create/manage shows and episodes on behalf of creators) plus show/episode resources; Apple has also
exposed **trends/analytics** report endpoints for podcast performance (`C3` on scope and shape).
Additionally the free, unauthenticated **iTunes Search API**
(`https://itunes.apple.com/search?media=podcast&term=…` and `/lookup?id=`) gives catalogue metadata and
feed URLs at roughly 20 requests/minute (`C3`) — the cheapest way to resolve "which Apple Podcasts show
is this feed?".

**Recommended architecture (`C1`):**
1. Model a **Podcast** entity backed by a **feed URL** (archetype G).
2. Ingest the feed for the content library, episode list and cross-promotion automation
   ("new episode → auto-post to X/LinkedIn/Bluesky/Telegram with the episode art and link").
3. Integrate 2–3 **hosts** (Buzzsprout and Transistor have clean, documented, key-based APIs, `C2`)
   for true publish support.
4. Show catalogue presence via Spotify Web API + iTunes Lookup.
5. Be explicit that **listen-through analytics require the creator's host** (most hosts expose
   download stats via API) and that Apple/Spotify per-platform listener data is dashboard-only unless
   we build Apple Podcasts Connect analytics.

**Effort:** **S** for RSS ingestion + cross-promotion (highest ROI), **M** per host integration,
**L** for Apple Podcasts Connect delegated delivery.

---

### 8.4 Rumble

**Verdict: XL / effectively unavailable. Reminder-publish only.**

**What I can state (`C1`):** Rumble does not operate a public, self-serve developer platform for video
upload comparable to YouTube's. Uploading is done through the web UI; **partner/licensing arrangements**
exist for media companies, and Rumble supports **RTMP ingest for live streaming** (which means a
customer can stream to Rumble from an encoder, and we could in principle store an RTMP key). Rumble also
provides embed/oEmbed for playback.

**`UNVERIFIED`:** whether a partner upload API with public documentation exists in 2026; Rumble Cloud
and Rumble's advertising products have expanded and may have brought API surface with them.

**Play:** reminder-publish with a video spec profile; optionally support RTMP key storage for
simulcast if we ever build live. **Effort: XL if pursued; S for reminder.**

---

### 8.5 Kick

**Verdict: M. Newest of the bunch and pleasantly modern — worth including for the creator segment.**

**What exists (`C2`, launched 2024–2025):** Kick shipped an official public API with a developer portal
(`docs.kick.com`), with app creation inside Kick account settings ("Developer" tab). Auth is
**OAuth 2.1 with PKCE** (authorization code), plus client-credentials for app-level calls.

**Documented surface (`C2`, verify all):**
- **Users** — `/public/v1/users` (token introspection, profile).
- **Channels** — `GET /public/v1/channels` (by slug or broadcaster id: livestream state, category,
  stream title, viewer count), `PATCH /public/v1/channels` (update stream title and category).
- **Chat** — `POST /public/v1/chat` to send a message as the user or as a bot.
- **Categories** — `GET /public/v1/categories` search.
- **Livestreams** — `GET /public/v1/livestreams` (list live channels with filters).
- **Moderation** — ban/unban/timeout endpoints.
- **Events / webhooks** — subscribe to `chat.message.sent`, `channel.followed`,
  `channel.subscription.new`/`renewal`/`gifts`, `livestream.status.updated`, with signed payloads.

**No video upload.** Like Twitch, Kick is a live platform; VOD publishing is not an API capability.
`C1`

**Rate limits, quotas, approval:** `UNVERIFIED`. App creation appeared to be self-serve without review
(`C2`).

**Value:** the same "go live → announce everywhere" workflow as Twitch (§6.8), for a platform whose
creators are underserved by existing tools. **Effort: M** (1–2 weeks), assuming the docs are as
described. **Put this high in the verification backlog** — it is the newest surface here and my
information is the most likely to be incomplete.

---

### 8.6 Odysee / LBRY

**Verdict: XL, and not worth it. Skip.**

**Technical reality (`C1`):** Odysee is a front end over the **LBRY protocol** — a blockchain-based
content network. "Publishing" means creating a claim on the LBRY blockchain, which requires running or
talking to an **`lbrynet` daemon** (JSON-RPC, methods like `publish`, `stream_create`,
`channel_create`) with a wallet holding **LBC** to stake on the claim. There is an internal
`api.odysee.com` used by the web client, but it is not a documented public API.

**Why we skip it:** running a blockchain node per-tenant (or a shared node with per-tenant channels and
keys) is an operations and custody problem (private keys, wallet funding, chain sync) wildly
disproportionate to the audience. Add legal exposure from holding crypto on customers' behalf.

**Play:** "not supported". **Effort: XL.**

---

## 9. Blogging, newsletter & CMS targets

> **Strategic framing (`C1`):** this category is where "social media management" becomes "content
> distribution", and it is badly served. A customer who writes a blog post today must paste it into
> WordPress, then rewrite it for LinkedIn, then for X, then for a newsletter. Owning the *source*
> content and fanning it out — with the blog as a first-class publish target — is a defensible product
> position. It is also technically easy: most of these are archetype A or C, i.e. days not weeks.

### 9.1 WordPress — two distinct integrations, both required

WordPress powers a plurality of the web, and there is no single API. **We must build both paths and
auto-detect which applies.** `C1`

#### (a) WordPress.com / Jetpack-connected sites

**Base:** `https://public-api.wordpress.com/rest/v1.1/sites/{site}/…` (also a `/wp/v2/` compatibility
layer at `/rest/v1.1/sites/{site}/…` and `/wpcom/v2/`). `C2`
**Auth:** OAuth2 — `https://public-api.wordpress.com/oauth2/authorize` →
`/oauth2/token`; app registered at `developer.wordpress.com/apps/`. Tokens are long-lived. `C2`
**Coverage bonus (`C1`):** this endpoint also serves **self-hosted sites that have Jetpack connected**,
which is a very large fraction of serious self-hosted WordPress. One OAuth flow, two populations.
**Key endpoints (`C2`):** `POST /sites/{site}/posts/new`, `POST /sites/{site}/posts/{id}`,
`POST /sites/{site}/media/new` (multipart), `GET /sites/{site}/posts`, `GET /sites/{site}/stats`
(WordPress.com Stats — views, referrers, top posts: **a genuine analytics surface**, rare in this
category), `GET /sites/{site}/categories`, `/tags`.
**Post fields:** `title`, `content`, `excerpt`, `status` (`publish|draft|pending|private|future`),
`date` (future date + `status=future` = **native scheduling**), `categories`, `tags`, `format`,
`featured_image` (media id), `slug`, `sticky`, `metadata[]`.

#### (b) Self-hosted WordPress core REST API

**Base:** `https://{site}/wp-json/wp/v2/…`; discovery via a `Link: <https://…/wp-json/>; rel="https://api.w.org/"`
header on the site's homepage — **use discovery, do not assume the path** (sites relocate `wp-json` or
use `?rest_route=`). `C2`
**Auth (`C1`):** **Application Passwords**, built into core since WP 5.6 — the user generates one in
Users → Profile → Application Passwords and we send HTTP **Basic** auth over HTTPS. No plugin needed,
no OAuth. There is also an authorization-flow URL
(`{site}/wp-admin/authorize-application.php?app_name=…&success_url=…`) that hands the generated
password back to our callback — **use it; it turns a 6-step copy-paste into 2 clicks and almost nobody
does.** `C2`
**Key endpoints (`C2`):** `POST /wp-json/wp/v2/posts` (`title`, `content`, `status`, `date`/`date_gmt`,
`categories[]`, `tags[]`, `featured_media`, `excerpt`, `slug`, `format`, `meta`),
`POST /wp-json/wp/v2/media` (binary body + `Content-Disposition: attachment; filename="…"`),
`GET /wp-json/wp/v2/categories|tags|users`, `POST /wp-json/wp/v2/pages`, and
`GET /wp-json/` for capability discovery (which routes exist, which plugins added namespaces).
**Native scheduling:** `status=future` + `date` — WP-Cron publishes it. `C1`
**Gotchas (`C1`):** many hosts block Basic auth headers (mod_security, or Apache stripping
`Authorization` — the classic fix is an `.htaccess` `CGIPassAuth`/rewrite rule); security plugins
(Wordfence, iThemes) block `/wp-json` or rate-limit it; some hosts disable the REST API for
unauthenticated users. **Our connect flow must run a diagnostic and give a specific remediation
message per failure mode** — this is the difference between a 60% and a 95% connect success rate.

**Rate limits:** none inherent; entirely host-dependent (shared hosting will 503 under load). Be gentle
and serialize per-site. `C1`

**Effort: M** (2–3 weeks) to do both paths, discovery, the authorize-application flow, media, taxonomy
mapping and diagnostics. **Highest-value CMS integration by installed base.**

---

### 9.2 Ghost

**Verdict: S–M. Clean API, growing publisher base, natively supports scheduling *and* newsletter send.**

**Two APIs (`C1`):**
- **Content API** (read-only): `{site}/ghost/api/content/posts/?key={content_api_key}` — a simple query
  key, good for ingesting a customer's existing posts.
- **Admin API** (read/write): `{site}/ghost/api/admin/…`, authenticated with a **JWT we mint ourselves**
  from an Admin API key of the form `{id}:{secret}`:
  - HS256, `kid` = the key id, `secret` = hex-decoded,
  - claims `iat`, `exp` (**max 5 minutes**), `aud` = `/admin/`,
  - header `Authorization: Ghost {jwt}`. `C2`

**Key endpoints (`C2`):** `POST /ghost/api/admin/posts/?source=html` (send `html` and Ghost converts to
Lexical/Mobiledoc — **use `?source=html`, hand-building Lexical JSON is a trap**), `PUT
/ghost/api/admin/posts/{id}/?` (requires `updated_at` for optimistic concurrency — a real gotcha:
omit it and you get a 409), `POST /ghost/api/admin/images/upload/`, `/pages/`, `/tags/`, `/members/`,
`/newsletters/`, `/tiers/`, plus webhooks (`post.published`, `member.added`).

**Post fields that matter:** `title`, `html`, `status` (`draft|published|scheduled|sent`),
**`published_at`** (future + `status=scheduled` = **native scheduling**), `tags[]`, `authors[]`,
`feature_image`, `custom_excerpt`, `meta_title`/`meta_description`, `og_*`/`twitter_*` fields,
`visibility` (`public|members|paid|tiers`), **`newsletter`** + **`email_segment`** (send the post as an
email to a filtered member set) and `email_only`.

**That newsletter capability is the differentiator (`C1`):** we can schedule a post that simultaneously
publishes to the web and emails a segment — i.e. a real "publish + newsletter" workflow inside a social
scheduler. Very few competitors touch it.

**Reads/analytics (`C2`):** member counts, post-level email open/click stats via the Admin API
(`email` object on a post: `opened_count`, `delivered_count`, `email_count`), plus Ghost's newer
native analytics (`C3`). Web pageviews are not in the API unless the site uses Ghost's stats feature.

**Instance model:** archetype C-lite — `site_url` + `admin_api_key` per connection; no dynamic client
registration needed, which makes it materially simpler than Mastodon.

**Rate limits:** none documented for self-hosted; Ghost(Pro) applies host-level protections (`C3`).
**Approval/cost:** none. **Effort: S–M** (5–8 days).

---

### 9.3 Substack

**Verdict: read-only via RSS. No write path. Be loud about the truth.**

**The facts (`C1`):**
- Substack has **no public API and no developer program.** No OAuth, no tokens, no docs.
- There are **undocumented internal endpoints** (`{pub}.substack.com/api/v1/posts`,
  `/api/v1/archive?sort=new&limit=…`, `/api/v1/publication/users/ranked`) that scrapers use. They are
  unauthenticated for public content, unstable, and using them for a commercial product is ToS-risky
  and breaks without notice. **Do not build a product surface on them.**
- **RSS works and is legitimate:** `https://{publication}.substack.com/feed` returns recent posts with
  full or partial content. This is a supported, intended consumption path.
- **Substack Notes** (the short-form feed) has **no API** at all.

**What we ship:**
1. **Ingest** — add a Substack publication by URL, poll its feed, pull posts into the content library.
2. **Repurpose** — "new Substack post → auto-generate and schedule X thread / LinkedIn post /
   Bluesky post / Telegram announcement". This is the actual customer need and it is fully legitimate.
3. **Reminder publish** for writing *to* Substack, with the caveat clearly stated.

**Effort: S** for ingestion (it is just archetype G). **N/A** for publishing.

---

### 9.4 Medium — retired

**Facts (`C1`, dates `C2`):** Medium's write API (`https://api.medium.com/v1/`, with `POST /users/{id}/posts`
and Integration Tokens generated in account settings) was the standard path for years. Medium
**stopped issuing new integration tokens and deprecated the API** (announced 2023); the developer
documentation repository was archived. Existing tokens continued working for a period, but this is a
dead platform for new integrations.

**What remains (`C1`):** RSS at `https://medium.com/feed/@{username}` and
`https://medium.com/feed/{publication}` — full-ish content, good for ingestion.
Medium also supports **importing** a post from a URL (UI only) and canonical-link-preserving imports.

**Play:** RSS ingestion; reminder-publish with a note that Medium's API is retired. If we hold a legacy
token from a pre-2023 registration, do not build customer-facing features on it. **Effort: S (read) /
N/A (write).**

---

### 9.5 Dev.to (Forem)

**Verdict: S. Half a week. Real audience for developer-tools customers.**

**Base:** `https://dev.to/api` (Forem API v1; self-hosted Forem instances expose the same API at their
own host — a small archetype-C opportunity). `C2`
**Auth (`C1`):** a **personal API key** generated at Settings → Extensions/Account → "DEV Community API
Keys", sent as the **`api-key`** header. No OAuth for third parties.
**Publishing (`C2`):**
```
POST /api/articles
{ "article": { "title", "body_markdown", "published": true|false,
               "series", "main_image", "canonical_url", "description",
               "tags": ["webdev","javascript"], "organization_id" } }
PUT /api/articles/{id}
GET /api/articles/me/{published|unpublished|all}
GET /api/articles/{id}
```
**Front matter alternative:** `body_markdown` may begin with YAML front matter (`---\ntitle: …\npublished:
true\ntags: …\n---`), which overrides the JSON fields. Pick one and be consistent.
**Tags:** max 4, lowercase alphanumeric. **Canonical URL** support is important — the standard
developer-marketing pattern is "publish on my blog, syndicate to Dev.to with `canonical_url` pointing
home", and supporting it well is a genuine feature.
**Scheduling:** `published_at` in the future is supported by Forem for scheduled publication (`C3` —
verify; if not, our scheduler holds it).
**Reads (`C2`):** article objects carry `public_reactions_count`, `comments_count`,
`page_views_count` (own articles only), `reading_time_minutes`. `GET /api/analytics/*` exists for some
Forem deployments (`C3`).
**Rate limits (`C3`):** article creation is throttled (order of ~10 per 30 seconds); general API limits
apply per key; 429 with `Retry-After`.
**Effort: S** (3–4 days).

---

### 9.6 Hashnode

**Verdict: S. GraphQL, clean, native scheduling.**

**Base:** `https://gql.hashnode.com/` — a single GraphQL endpoint. `C2`
**Auth (`C1`):** **Personal Access Token** from Hashnode account settings, sent in the
`Authorization` header. No OAuth for third-party apps.
**Publishing (`C2`):**
```graphql
mutation Publish($input: PublishPostInput!) {
  publishPost(input: $input) { post { id url slug } }
}
# PublishPostInput: publicationId, title, contentMarkdown, slug, tags[{slug,name}],
#   coverImageOptions{coverImageURL}, publishedAt (ISO — FUTURE = scheduled),
#   metaTags{title,description,image}, originalArticleURL (canonical),
#   seriesId, settings{enableTableOfContent, isNewsletterActivated, delisted},
#   coAuthors[], subtitle
```
Also `updatePost`, `removePost`, `publishDraft`, `createDraft`, `scheduleDraft` (`C3`),
`addPostToSeries`. Query side: `me { publications { edges { node { id url posts { … views reactionCount responseCount } } } } }`.
**Native scheduling:** `publishedAt` in the future (`C2`) — verify whether it schedules or backdates.
**Reads (`C2`):** post `views`, `reactionCount`, `responseCount`; publication-level follower counts.
**Rate limits:** `UNVERIFIED` — GraphQL complexity/depth limits and per-token throttles exist.
**Notable:** Hashnode supports **custom domains and headless mode**, and its newsletter feature means
the same publish-plus-email pattern as Ghost.
**Effort: S** (3–4 days). Watch for schema drift — GraphQL schemas change silently; pin queries and add
a schema-introspection canary test.

---

### 9.7 Shopify blog

**Verdict: M, and strategically valuable — every Shopify merchant is a content-marketing customer, and
blog publishing is a natural upsell alongside social.**

**API choice (`C1`):** Shopify is **deprecating the REST Admin API in favour of GraphQL**; new public
apps should be **GraphQL-only**. The legacy REST path
(`/admin/api/{version}/blogs/{blog_id}/articles.json`) still exists for older apps but must not be the
foundation of a new build.

**GraphQL Admin API (`C2`):** endpoint `https://{shop}.myshopify.com/admin/api/{YYYY-MM}/graphql.json`,
header `X-Shopify-Access-Token`. Relevant operations:
- `blogCreate`, `blogUpdate`, `blogDelete`
- **`articleCreate`**, `articleUpdate`, `articleDelete` — input includes `blogId`, `title`,
  `body` (HTML), `summary`, `handle`, `author {name}`, `image {url, altText}`, `tags`,
  **`publishDate`** (future = scheduled), `isPublished`, `metafields`
- `articles(first:, query:)` for reads
- `metafieldsSet` for SEO fields (`global.title_tag`, `global.description_tag`)

**Auth (`C1`):** standard Shopify OAuth app install
(`/admin/oauth/authorize?client_id=…&scope=…&redirect_uri=…&state=…` → `/admin/oauth/access_token`),
producing a **per-shop offline access token**. Scope: `write_content` (blogs/articles/pages/redirects)
plus `read_content`. HMAC-verify the install callback and all webhooks.

**Distribution friction (`C1`):** a **Shopify Partner account** is required. For customers to install
us with one click we need a **public app**, which means **Shopify App Store review** (functionality,
performance, billing-API compliance, mandatory GDPR webhooks: `customers/data_request`,
`customers/redact`, `shop/redact`). Alternatively, "custom apps" installed per-store avoid review but
require per-store setup — fine for agencies, bad for self-serve. Budget **weeks** of calendar time for
App Store review.

**Rate limits (`C2`):** GraphQL uses a **calculated-cost leaky bucket** — Standard shops ~**100 points
restored/second with a 1,000-point bucket**; Shopify Plus is 10× (`C3`). The response's
`extensions.cost.throttleStatus` tells you `currentlyAvailable`/`restoreRate` — **read it and pace
accordingly** rather than guessing. REST (legacy) is 2 requests/second with a 40-request burst.

**Effort: M** (2–3 weeks) for the adapter; **+ weeks of calendar** for App Store review if public.

---

### 9.8 Wix Blog

**Verdict: M–L. Real API, but app-market distribution friction.**

**Base (`C2`):** `https://www.wixapis.com/blog/v3/…` — the Wix REST/Headless API surface.
**Auth (`C1`, two modes):**
- **Wix App (OAuth)** — our app is installed on the customer's site from the **Wix App Market**;
  we exchange the install for an access token scoped to that site (`wix-site-id` header). Requires app
  submission and **Wix App Market review** for public distribution.
- **API key + Site ID** — an account-level API key (Wix dashboard) with the `wix-site-id` header;
  suitable for a customer's own site or agency-managed sites, no marketplace review.

**Publishing flow (`C2`):** Wix Blog v3 is **draft-first**:
`POST /blog/v3/draft-posts` (fields: `title`, `richContent` (Ricos JSON) or `content`, `memberId`,
`categoryIds`, `tagIds`, `media`, `seoData`, `commentingEnabled`) →
`POST /blog/v3/draft-posts/{draftPostId}/publish`. Scheduling via
`/draft-posts/{id}/schedule` with a publish date (`C3`). Also `GET /blog/v3/posts`,
`/blog/v3/categories`, `/blog/v3/tags`, and media upload through the **Wix Media Manager API**
(`/site-media/v1/files/generate-upload-url`).

**The Ricos problem (`C1`):** Wix's rich content format (**Ricos**) is a node-tree JSON, not HTML. We
need an HTML→Ricos converter (paragraphs, headings, lists, images, links, embeds). This is the bulk of
the engineering. A `content` HTML fallback exists on some versions (`C3`) — verify, because if HTML is
accepted this drops from L to M.

**Rate limits:** `UNVERIFIED`. **Cost:** API free; customer needs a Wix plan with Blog.
**Effort: M–L** (3–5 weeks including Ricos conversion and app submission).

---

### 9.9 Squarespace

**Verdict: no content API. Reminder-publish. Say so plainly.** `C1`

**What Squarespace's developer platform actually covers (`C1`):**
- **Commerce APIs**: Orders, Inventory, Products, Transactions, Profiles (customers) — REST at
  `https://api.squarespace.com/1.0/commerce/…` with an **API key** (Bearer) generated in
  Settings → Advanced → Developer API Keys, or OAuth for marketplace apps.
- **Forms / webhook subscriptions** for order and form events.
- **Developer Mode** for template/code editing via SFTP/Git — this edits *templates*, not content.

**What does not exist (`C1`):** any endpoint to create, update or schedule a **blog post, page, event,
or product description as content**. There is no `POST /blog/posts`. Squarespace's own scheduling
happens in its editor.

**The only semi-legitimate paths:** (a) Squarespace's **RSS import** feature (UI-driven, one-time),
(b) reminder publish, (c) the private/undocumented `/api/` endpoints the editor uses — **not viable**
for a commercial product.

**Play:** mark **Not supported (no content API)** in the channel picker with a tooltip. Offer
reminder-publish. **This is a case where honesty is a feature** — customers on Squarespace have been
promised this by other tools and been burned.
**Effort: N/A** (S for reminder profile).

---

### 9.10 Webflow CMS

**Verdict: M. The schema-mapping problem is the interesting part.**

**Base (`C1`):** **Data API v2** at `https://api.webflow.com/v2/…` (v1 is retired/deprecated, `C2`).
**Auth (`C2`, two modes):**
- **Site API token** — generated in Site settings → Apps & Integrations → API access. Simple bearer.
- **OAuth2 app** — `https://webflow.com/oauth/authorize` → `POST /oauth/access_token`, scopes such as
  `cms:read`, `cms:write`, `sites:read`, `sites:write`, `pages:write`, `assets:write`,
  `forms:read`. Required for Webflow **App Marketplace** distribution (review needed).

**Key endpoints (`C2`):**
```
GET  /v2/sites
GET  /v2/sites/{site_id}/collections
GET  /v2/collections/{collection_id}                 # returns the FIELD SCHEMA
GET  /v2/collections/{collection_id}/items
POST /v2/collections/{collection_id}/items           # staged (draft)
POST /v2/collections/{collection_id}/items/live      # create AND publish
POST /v2/collections/{collection_id}/items/bulk
PATCH /v2/collections/{collection_id}/items/{item_id}[/live]
DELETE …
POST /v2/sites/{site_id}/publish                     # publish domains
POST /v2/sites/{site_id}/assets                      # asset upload (2-step: metadata → S3 PUT)
```

**The real engineering problem (`C1`):** Webflow collections are **arbitrary user-defined schemas**.
There is no universal "post" shape. Our adapter must:
1. Fetch the collection's field list (`slug`, `type`: `PlainText | RichText | Image | MultiImage |
   Link | Option | Reference | MultiReference | Date | Switch | Number | Color | File`, `isRequired`,
   `validations`).
2. Present a **field-mapping UI** ("our Title → your `name`; our Body → your `post-body` RichText;
   our Featured Image → your `main-image`") and persist the mapping per connection.
3. Validate required fields and option-set values before submitting.
4. Handle `isDraft` / `isArchived`, and the fact that **`/items/live` publishes immediately** while
   `/items` stages — plus a **separate site publish** step for the site to rebuild.

Do this well once and the same mapping engine serves Contentful, Sanity, Strapi, Prismic and Airtable
later — a strong platform investment.

**Rate limits (`C2`):** **60 requests/minute per site** on v2 (some plans/endpoints higher), surfaced
via `X-RateLimit-Limit` / `X-RateLimit-Remaining`. Bulk endpoints exist precisely because of this —
use them. Site publishes are additionally throttled (`C3`).

**Cost:** API free; the site needs a paid Webflow plan for CMS. **Effort: M** (2–3 weeks including the
mapping UI).

---

## 10. Creative, portfolio & knowledge platforms

**Summary verdict (`C1`): this whole category is a graveyard with two survivors (Flickr, and Dribbble
in read-only form). Do not invest here beyond reminder-publish profiles.**

### 10.1 Behance

**Status (`C1`):** Adobe closed the public Behance API to new applications (the `api.behance.net/v2`
program stopped issuing new client ids around 2019–2020). Existing keys were progressively retired.
Adobe has not shipped a replacement public content API for Behance.
**`UNVERIFIED`:** whether any Behance surface exists today inside Adobe Developer Console for
enterprise partners.
**Publishing:** no API for creating projects, ever — even in the old API, project creation was not
available; it was a read API.
**Play:** reminder-publish (Behance projects are multi-asset and heavily hand-composed anyway, so the
loss is small). **Effort: N/A.**

### 10.2 Dribbble

**Status (`C2`, needs verification):** Dribbble API **v2** at `https://api.dribbble.com/v2/` with OAuth2
(`https://dribbble.com/oauth/authorize`, scopes `public`, `upload`). Dribbble substantially narrowed the
API in the v1→v2 transition: v2 is essentially `GET /v2/user`, `GET /v2/user/shots`,
`GET /v2/shots/{id}`, plus `POST /v2/shots` (shot creation) whose availability has been restricted
and/or removed and is often tied to Pro accounts. New API applications require approval and Dribbble
has been selective.
**Honest position:** `UNVERIFIED` whether shot creation works today for a new third-party app. Treat as
**read-only at best**.
**Play:** reminder-publish; revisit only on customer demand. **Effort: N/A–M.**

### 10.3 Flickr

**Verdict: M, and it still works — the last functioning photo-community API.**

**Base (`C2`):** `https://www.flickr.com/services/rest/?method={flickr.x.y}` (REST-ish, JSON via
`format=json&nojsoncallback=1`); uploads to `https://up.flickr.com/services/upload/` (multipart);
replace via `/services/replace/`.
**Auth (`C1`):** **OAuth 1.0a** — request token → authorize → access token, with HMAC-SHA1 request
signing on every call. Access tokens do not expire. The signing code is the main cost; it is also
reusable if we ever touch other OAuth1 APIs (Tumblr legacy).
**Key methods (`C2`):** `flickr.photos.upload` (the upload endpoint takes `title`, `description`,
`tags`, `is_public`, `is_friend`, `is_family`, `safety_level`, `content_type`, `hidden`),
`flickr.photos.setMeta`, `flickr.photos.setTags`, `flickr.photos.setPerms`,
`flickr.photos.geo.setLocation`, `flickr.photosets.create` / `addPhoto`,
`flickr.photos.getInfo` (views, comments, tags), `flickr.photos.getFavorites`,
`flickr.stats.getPhotoStats` / `getTotalViews` (**requires Flickr Pro on the account**),
`flickr.people.getPhotos`, `flickr.groups.pools.add`.
**Rate limits (`C2`):** **3,600 queries per hour per API key** — generous but real; also per-account
upload limits (free accounts are capped at 1,000 photos total, `C2`).
**Approval/cost (`C1`):** a **non-commercial** API key is instant and self-serve; **commercial use
requires applying for a commercial key** and agreeing to Flickr's commercial API terms. **We are
commercial.** This is a form-and-wait, not a payment, as far as I know (`C3`).
**Effort: M** (1.5–2 weeks, mostly OAuth1 + upload).

### 10.4 500px

**Status (`C1`):** 500px **shut down its public API in June 2018** and terminated the developer
program. Under Visual China Group ownership no public API has returned.
**Play:** not supported. **Effort: N/A.**

### 10.5 Quora

**Status (`C1`):** no public content API. No way to create answers, posts, or Space content
programmatically. The only Quora developer product is the **Quora Ads API** (`ads.quora.com`, OAuth2,
campaign/ad/audience management + conversion pixel/Conversions API) for advertisers.
**Play:** reminder-publish; Quora Ads only if we build a paid-social module. **Effort: N/A organic.**

### 10.6 SlideShare

**Status (`C1`, date `C2`):** after Scribd acquired SlideShare (2020), the SlideShare Developer API
(`www.slideshare.net/api/2/upload_slideshow` etc., OAuth1-ish with a shared-secret hash) was
**discontinued** and new API keys stopped being issued. Scribd does not offer a replacement public
upload API.
**Play:** reminder-publish for decks; note that LinkedIn document posts (`06` §14) have largely
absorbed this use case — **the better product answer is "publish your deck as a LinkedIn document
post"**, which we *can* do natively. **Effort: N/A.**

### 10.7 Goodreads

**Status (`C1`):** Goodreads **retired its API in December 2020** — it stopped issuing new developer
keys and disabled existing ones. Amazon has shown no intent to restore it.
**What remains (`C2`):** per-user shelf RSS feeds (`https://www.goodreads.com/review/list_rss/{user_id}?shelf=read`)
and public book pages. Review *content* is not accessible via any supported interface, and scraping
Goodreads/Amazon is a ToS violation (§18).
**Play:** RSS-based "currently reading / recently read" widgets for author customers is the only
legitimate use. Author-page review monitoring is **not available**. **Effort: N/A (S for RSS).**

---

## 11. Reviews & local listings

> **This is the commercially most important section in the document.** Review management is a separate
> ~$2–3B software category (Birdeye, Podium, Reputation.com, Chatmeter, ReviewTrackers, Yext, GatherUp)
> that SMM tools mostly do not enter. The whole category rests on a small number of facts that are worth
> internalizing before reading the detail:
>
> 1. **Only five surfaces let us reply to a review programmatically**: Google Business Profile,
>    Trustpilot, Apple App Store, Google Play, and Facebook Recommendations. Everything else is
>    read-only or nothing. (§12.)
> 2. **Yelp and TripAdvisor — the two most-requested consumer review sites — deliberately cripple
>    their APIs**: 3 truncated excerpts and ~5 reviews respectively, no responses. This is not an
>    oversight; it protects their own paid products.
> 3. **Google Business Profile is the whole ballgame** for local businesses, and its access is
>    gated behind a manual Google approval with a **default quota of zero**.
> 4. Therefore **every credible competitor buys some review data** from an aggregator or a scraping
>    vendor. See §13. Pretending otherwise is how you end up with a product that shows 3 Yelp reviews.

### 11.1 Google Business Profile — the anchor integration

**Verdict: L, mandatory, and start the access request on day one because the approval is the long pole.**

#### 11.1.1 The API is not one API (`C1`)

Google split the old "Google My Business API v4" into a family of services in 2021–22. As of my
knowledge, the split is:

| Service | Host | Covers |
|---|---|---|
| Account Management | `mybusinessaccountmanagement.googleapis.com/v1` | accounts, admins, invitations, account hierarchy |
| Business Information | `mybusinessbusinessinformation.googleapis.com/v1` | locations, attributes, categories, service areas, hours, `locations.patch` |
| Q&A | `mybusinessqanda.googleapis.com/v1` | `locations/*/questions`, `questions/*/answers` |
| Notifications | `mybusinessnotifications.googleapis.com/v1` | `accounts/*/notificationSetting` → **Pub/Sub topic** |
| Verifications | `mybusinessverifications.googleapis.com/v1` | verification options and flow |
| Place Actions | `mybusinessplaceactions.googleapis.com/v1` | booking/order/menu action links |
| Lodging / Food menus | `mybusinesslodging`, `mybusinessplaceactions` | vertical-specific |
| **Performance (insights)** | `businessprofileperformance.googleapis.com/v1` | the **replacement for `reportInsights`** |
| **Legacy v4** | `mybusiness.googleapis.com/v4` | **`reviews`, `localPosts`, `media`** — still here |

**The single most important `C2` claim in this section:** **reviews and local posts were never migrated
off `mybusiness.googleapis.com/v4`.** Google deprecated v4's *insights* endpoints (replaced by the
Performance API) but, to my knowledge, `accounts/{a}/locations/{l}/reviews`,
`.../reviews/{r}/reply`, `.../localPosts` and `.../media` remained on v4 through at least 2025.
**Verify this first (§20 item #1)** — if Google has since shipped `mybusinessreviews.googleapis.com`
or similar, the endpoint paths below change but the capability model does not.

#### 11.1.2 Auth and the account hierarchy (`C1`)

- Google OAuth2, scope **`https://www.googleapis.com/auth/business.manage`** (single, coarse scope —
  there is no read-only variant, which matters for our consent screen and for security review).
- Hierarchy: **Account** (personal or Location Group / Organization) → **Location**. Agencies use
  Location Groups; enterprises use Organizations with hundreds of locations. Our data model must
  support `account → location` as a first-class two-level tree with **thousands** of locations per
  tenant, and per-location permissions.
- Resource names are path-style: `accounts/{accountId}/locations/{locationId}`, and the newer services
  use bare `locations/{locationId}`. **The two ID conventions coexist and are a common bug source.**

#### 11.1.3 Reviews (`C2`)

```
GET   /v4/accounts/{a}/locations/{l}/reviews?pageSize=50&orderBy=updateTime desc
GET   /v4/accounts/{a}/locations/{l}/reviews/{reviewId}
PUT   /v4/accounts/{a}/locations/{l}/reviews/{reviewId}/reply   { "comment": "…" }
DELETE /v4/accounts/{a}/locations/{l}/reviews/{reviewId}/reply
POST  /v4/accounts/{a}/locations/{l}/batchGetReviews            # multi-location fetch
```
Review object: `reviewId`, `reviewer {displayName, profilePhotoUrl, isAnonymous}`,
`starRating` (`ONE`…`FIVE` enum, **not an integer** — a classic mapping bug), `comment` (may be absent
for rating-only reviews — **a large fraction of Google reviews have no text**), `createTime`,
`updateTime`, `reviewReply {comment, updateTime}`, `name`.
**Reply limits:** one reply per review (PUT overwrites), plain text, ~4,096 characters (`C3`).

#### 11.1.4 Local Posts (`C2`)

```
POST /v4/accounts/{a}/locations/{l}/localPosts
GET  /v4/accounts/{a}/locations/{l}/localPosts
PATCH/DELETE /v4/…/localPosts/{postId}
```
Fields: `languageCode`, `summary` (**1,500 chars**), `callToAction {actionType, url}` with
`actionType` ∈ `{BOOK, ORDER, SHOP, LEARN_MORE, SIGN_UP, CALL}`, `media[] {mediaFormat: PHOTO|VIDEO,
sourceUrl}`, `topicType` ∈ `{STANDARD, EVENT, OFFER, ALERT}`, `event {title, schedule{startDate,
startTime, endDate, endTime}}`, `offer {couponCode, redeemOnlineUrl, termsConditions}`.
**Constraints (`C2`/`C3`):** photos must be publicly fetchable URLs (Google pulls them), recommended
≥720×540 px, JPG/PNG, ≤5 MB; **posts expire after 7 days** for STANDARD type (they remain visible in
the "Updates" tab but rotate out of prominence) — **the practical consequence is that GBP posting is a
weekly cadence product, and our recurring/evergreen scheduler should default to weekly for GBP.**
CALL action requires a phone number on the listing. Google rejects posts with phone numbers in the
summary, excessive capitalization, or promotional URLs it dislikes — expect a nontrivial rejection
rate and surface `LocalPost.state` (`LIVE`, `REJECTED`, `PROCESSING`).

#### 11.1.5 Q&A (`C2`)

```
GET  /v1/locations/{l}/questions
POST /v1/locations/{l}/questions                      # ask (rarely what we want)
POST /v1/locations/{l}/questions/{q}/answers:upsert   # answer AS the business owner
GET  /v1/locations/{l}/questions/{q}/answers
```
**Owner answers are visually distinguished on Google and are a genuine local-SEO lever.** Very few
tools support Q&A; it is a cheap differentiator once the GBP plumbing exists.

#### 11.1.6 Media (`C2`)

`POST /v4/accounts/{a}/locations/{l}/media` with `mediaFormat`, `locationAssociation.category`
(`COVER`, `PROFILE`, `LOGO`, `EXTERIOR`, `INTERIOR`, `PRODUCT`, `AT_WORK`, `FOOD_AND_DRINK`,
`MENU`, `TEAM`, `ADDITIONAL`), and either `sourceUrl` or a resumable upload via
`.../media:startUpload`. Also `customers` media listing (photos uploaded by the public — useful for
"someone posted a bad photo of your store" alerts, which is a nice differentiating alert type).

#### 11.1.7 Performance / insights (`C2`)

```
GET /v1/locations/{l}:getDailyMetricsTimeSeries?dailyMetric=…&dailyRange.start_date…
GET /v1/locations/{l}:fetchMultiDailyMetricsTimeSeries?dailyMetrics=…&dailyMetrics=…
GET /v1/locations/{l}/searchkeywords/impressions/monthly   # search terms!
```
Metrics enum (`C2`): `BUSINESS_IMPRESSIONS_DESKTOP_MAPS`, `BUSINESS_IMPRESSIONS_DESKTOP_SEARCH`,
`BUSINESS_IMPRESSIONS_MOBILE_MAPS`, `BUSINESS_IMPRESSIONS_MOBILE_SEARCH`,
`BUSINESS_CONVERSATIONS`, `BUSINESS_DIRECTION_REQUESTS`, `CALL_CLICKS`, `WEBSITE_CLICKS`,
`BUSINESS_BOOKINGS`, `BUSINESS_FOOD_ORDERS`, `BUSINESS_FOOD_MENU_CLICKS`.
**Retention: ~18 months, and the most recent few days lag.** `C3`
**`searchkeywords/impressions/monthly` is underrated** — it returns the actual search terms that
surfaced the listing, bucketed by monthly impression counts, with values below a threshold reported as
a range. This is *local SEO keyword data* and it is a strong analytics differentiator.

#### 11.1.8 Notifications instead of polling (`C1`, important)

`mybusinessnotifications.googleapis.com/v1/accounts/{a}/notificationSetting` (PATCH) registers a
**Google Cloud Pub/Sub topic**; Google then publishes messages for
`NEW_REVIEW`, `UPDATED_REVIEW`, `NEW_QUESTION`, `NEW_ANSWER`, `UPDATED_QUESTION`, `UPDATED_ANSWER`,
`GOOGLE_UPDATE` (Google changed your listing — a high-value alert), `NEW_CUSTOMER_MEDIA`,
`DUPLICATE_LOCATION`, `LOSS_OF_VOICE_OF_MERCHANT` (you lost control of the listing — critical alert).
**Use Pub/Sub. Polling thousands of locations for reviews will exhaust quota and give 15-minute-stale
alerts; Pub/Sub gives near-real-time and costs almost no quota.** Our infrastructure needs a GCP
project with a Pub/Sub subscription and a push endpoint — a real but one-time cost.

#### 11.1.9 Access, quota and the calendar risk (`C1` — read this twice)

- The GBP APIs are **not enabled by default**. In the Google Cloud console the APIs appear, but your
  project's quota is **zero QPM** until Google approves an access request submitted through a
  **Google Business Profile API access request form**, tied to your GCP project number, describing your
  use case, your company, and your expected volume.
- Google **rejects vague or spammy-sounding applications**, and turnaround is days to weeks, sometimes
  with follow-up questions. Reputation vendors treat this as a known onboarding hurdle.
- Post-approval **default quota is on the order of a few hundred QPM per project** (commonly cited:
  **300 QPM** for the core services, with lower per-minute limits on some, `C3`), and increases require
  a separate quota-increase request with justification.
- **Consequence for planning:** submit the access request in week 1 of the project, before writing a
  line of GBP code. It is the single longest-lead-time dependency in the tier-2 program.

**Effort: L** (5–8 weeks): OAuth + hierarchy sync, reviews read/reply, local posts (4 topic types),
Q&A, media, performance metrics, Pub/Sub ingestion, multi-location bulk UX. Plus **weeks of calendar
friction** for access approval.

---

### 11.2 Apple Business Connect

**Verdict: L, and a genuine differentiator — almost no SMM tool supports it, and Apple Maps presence
matters for local businesses on iOS.**

**What it is (`C1`):** Apple Business Connect (ABC) replaced Apple Maps Connect as the place businesses
manage their Apple Maps presence: location data (hours, address, categories, photos, logo), action
links, and **Showcases** — Apple's answer to Google Posts (time-bound promotional cards that appear on
the Place Card in Apple Maps/Search).

**API (`C2`):** Apple provides an **Apple Business Connect API** aimed at chains and platform partners:
- Auth via **JWT (ES256)** signed with a private key generated in Business Connect — archetype E, the
  same pattern as App Store Connect (`kid`, `iss`, `exp`, `aud`).
- A **feed-based bulk ingestion** model for large location sets (submit a structured location feed;
  Apple processes asynchronously and returns per-record status), alongside REST resources for
  companies, locations, and **Showcases**.
- Endpoints under an `api.businessconnect.apple.com`-style host (`C3` on the exact host/paths).

**Capabilities relevant to us (`C1`):**
- **Create/update Showcases** — the "post" equivalent (title, image, CTA, valid date range). This is
  the differentiating feature: scheduling Apple Showcases alongside Google Posts in one composer.
- **Update location attributes** in bulk — hours, holiday hours, photos, logo, links.
- **Action links** (order, reserve, etc.) via partner integrations.

**What does not exist (`C1`):** **reviews.** Apple Maps does not host first-party reviews; it displays
ratings and reviews sourced from partners (historically Yelp and TripAdvisor). So there is nothing to
read or reply to. Do not promise "Apple Maps review management" — it is a category error.

**Approval friction (`C2`):** a verified Business Connect account is required; API/feed access is
oriented toward **multi-location brands and platform partners** and may require Apple enablement.
Single-location SMBs are expected to use the web UI.

**Cost:** free. **Effort: L** (4–6 weeks), and `UNVERIFIED` details make this a strong candidate for an
early spike. Value is highest for franchise/multi-location customers.

---

### 11.3 Yelp Fusion

**Verdict: S to integrate, but understand you are buying almost nothing. Integrate for *presence and
rating monitoring*, not for review management.**

**Base (`C1`):** `https://api.yelp.com/v3/…`, auth = **API Key** in `Authorization: Bearer {key}`.
No OAuth, no per-user connection — **which means we cannot access a business owner's private Yelp
data at all.** There is no "connect your Yelp account" flow.

**Endpoints (`C2`):**
| Endpoint | Returns |
|---|---|
| `GET /v3/businesses/search` | up to 50/page, 1,000 max results, by term/location/coords/radius/categories |
| `GET /v3/businesses/{id or alias}` | name, rating, `review_count`, price, categories, hours, photos (≤3), coordinates |
| `GET /v3/businesses/{id}/reviews` | **3 reviews, text truncated (~160 chars), plus a URL to the full review** |
| `GET /v3/businesses/matches` | fuzzy match a business by name+address → Yelp id (**useful for onboarding**) |
| `GET /v3/categories`, `/v3/events`, `/v3/autocomplete` | ancillary |

**The two crippling limits (`C1`):**
1. **3 truncated reviews.** Not 3 pages — 3 reviews, ever, with the text cut off. You cannot build
   review management on this.
2. **No response API.** Owner replies happen only in Yelp for Business. We can deep-link, not post.

**Rate limits and cost (`C3` — Yelp changed this materially and my numbers are soft):** Fusion was
historically **5,000 calls/day free**; Yelp introduced tiered plans and **sharply reduced the free
allowance** (commonly cited at a few hundred calls/day) with paid tiers for higher volume, plus
enterprise **Yelp Knowledge / Yelp Fusion Enterprise** data-licensing products for full review streams
(5–6 figure contracts). **Treat all Yelp pricing as unverified and get a quote.**

**What we actually build:** a **presence + rating monitor** — resolve the customer's Yelp business id
via `/matches`, poll `/businesses/{id}` daily for `rating` and `review_count`, alert on changes and on
new reviews appearing (we can detect *that* a review happened even if we cannot read it), show the 3
excerpts, and deep-link to the Yelp for Business reply screen. If a customer needs full Yelp review
text and response workflow, that requires an aggregator (§13) or Yelp Knowledge.

**Effort: S** (3–5 days).

---

### 11.4 TripAdvisor

**Verdict: S, same shape as Yelp — presence monitoring only.**

**Base (`C2`):** **TripAdvisor Content API** at `https://api.content.tripadvisor.com/api/v1/…`,
auth = an API **key** as a `key` query parameter, with mandatory **IP allow-listing or HTTP-referrer
restriction** configured in the developer portal (a real deployment gotcha: server IPs must be
registered, which breaks on autoscaling unless you use a static egress IP).

**Endpoints (`C2`):**
- `GET /location/search?searchQuery=&category=&latLong=` — find the location id
- `GET /location/{locationId}/details` — name, rating, `num_reviews`, ranking, subratings, awards, hours
- `GET /location/{locationId}/reviews` — **up to ~5 reviews**, with title, text, rating, published date,
  and the owner response if any
- `GET /location/{locationId}/photos`
- `GET /location/nearby_search`

**Attribution requirement (`C1`):** TripAdvisor's terms require displaying their logo/branding and
linking back wherever their content appears. This is a **UI compliance requirement**, not optional —
build the attribution component once.

**No response API (`C1`).** Management responses are written in the TripAdvisor Management Center only.

**Rate/cost (`C3`):** a free tier around **5,000 calls/month** with paid overage/tiers; separate
partner programs (Review Express API for review solicitation, Content API for partners) exist with
their own terms.

**Effort: S** (3–5 days) including the attribution component and static-egress-IP plumbing.

---

### 11.5 Trustpilot

**Verdict: M, and the best review API in this entire document. If we build one review integration
beyond Google, build Trustpilot.**

**Why it stands out (`C1`):** Trustpilot is the only major consumer review platform that exposes
**full review text, programmatic replies, and programmatic review invitations**. Its business model is
selling to the reviewed business, so its API serves that business rather than protecting a walled
garden.

**Auth (`C2`):** hybrid.
- **Public endpoints**: `apikey` (query param or header) is enough.
- **Private/business endpoints**: OAuth2. `POST https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken`
  with HTTP Basic (`apikey:secret`) and `grant_type=password` (business user credentials) or
  `authorization_code`. **Access tokens are short-lived (commonly cited ~7 days / 604800 s) with a
  refresh token** — so a refresh scheduler is required. `C3` on the TTL.

**Endpoint families (`C2`):**
| Family | Examples |
|---|---|
| **Business Units** | `GET /v1/business-units/find?name=`, `GET /v1/business-units/{id}`, `/web-links`, `/reviews` (public), `/{id}/profileinfo` |
| **Private reviews** | `GET /v1/private/business-units/{id}/reviews` (**full text, filters: stars, replied, tags, date**) |
| **Reply** | `POST /v1/private/reviews/{reviewId}/reply` `{ "message": "…" }` — **programmatic responses** |
| **Invitations** | `POST /v1/private/business-units/{id}/email-invitations` (send service review invites), `POST /v1/private/business-units/{id}/invitation-links` (**generate a unique review link** to embed in your own email/SMS), bulk invitation via file upload |
| **Product Reviews** | `POST /v1/private/product-reviews/business-units/{id}/invitation-links`, product review reads, `GET /v1/product-reviews/business-units/{id}/reviews` |
| **Conversations** | newer two-way conversation endpoints between business and reviewer (`C3`) |
| **Categories / consumer** | `GET /v1/categories`, `GET /v1/consumers/{id}/profile` |

**The invitation capability is the commercial hook (`C1`):** "automatically ask every customer for a
review after purchase" is the core value proposition of the entire review-management category
(Birdeye/Podium's whole business). Trustpilot exposes it via API. Combined with a Shopify/webhook
trigger (§9.7), we can ship a genuine review-generation workflow.

**Rate limits (`C3`):** per-endpoint limits documented per plan; order of a few thousand calls/day for
standard plans. Honour `429`.

**Cost (`C1` structural, `C3` numbers):** Trustpilot's API is **plan-gated** — free/"Free" accounts get
minimal public API access; the **Standard/Plus/Premium/Enterprise** business plans unlock private
endpoints and invitations, at roughly **$250–$650+/month billed annually** for the mid plans with
Enterprise on quote. **Our customer pays this, not us** — but it means Trustpilot is an SMB-plus /
mid-market feature, and our onboarding must detect insufficient plan level and say so clearly.

**Effort: M** (2–3 weeks) for reviews read + reply + invitations + webhook-ish polling.

---

### 11.6 G2

**Verdict: M, but commercially gated. B2B-SaaS customers only.**

**What exists (`C1`/`C2`):**
- **G2 REST API** (`https://api.g2.com/api/v1/…`, bearer token issued to subscribing vendors) exposing
  the vendor's own **products, reviews, and review responses (read)**, plus survey/category data.
- **G2 Review Syndication** — a feed/API that pushes your G2 reviews to your own website (and to
  partners like Salesforce AppExchange), sold as an add-on.
- **G2 Buyer Intent API** — company-level intent signals (who viewed your G2 profile / comparison
  pages). This is a *sales-intelligence* product, not review management, but it is the one G2 API
  people actually pay for.
- **Webhooks** for new reviews (`C3`).

**What does not exist (`C1`):** a **public review-response API**. Vendor responses to reviews are
written in the G2 seller dashboard.

**Cost (`C1` structural, `C3` numbers):** everything here requires a **paid G2 vendor subscription**
(G2 Marketing Solutions / Content Subscription), typically **five figures per year**, with API and
syndication as add-ons. There is no free tier.

**Play:** support it as an **optional, customer-credentialed integration** for B2B SaaS customers who
already pay G2 — read reviews into the unified inbox, alert on new ones, deep-link to respond. Do not
build it in wave 1. **Effort: M** once the review pipeline exists.

---

### 11.7 Capterra / GetApp / Software Advice (Gartner Digital Markets)

**Verdict: N/A self-serve. Widget or manual only.**

**Facts (`C1`):** Capterra, GetApp and Software Advice are all **Gartner Digital Markets** properties
with a shared review corpus. There is **no public, self-serve reviews API**. What vendors get:
- A **review-syndication widget** (JavaScript badge/embed) showing their rating and recent reviews.
- Review **export** from the vendor portal.
- Partner/affiliate APIs for lead delivery (`C3`), not review content.

`UNVERIFIED`: whether a Gartner Digital Markets partner reviews API exists under contract in 2026.

**Play:** manual/CSV import into our unified review store, plus a scraping-vendor fallback (§13) if a
customer demands monitoring. Do not promise responses (GDM responses are portal-only).
**Effort: N/A–M.**

---

### 11.8 Booking.com

**Verdict: XL, partner-gated. Only relevant if hospitality is a target vertical.**

**Facts (`C1`):** Booking.com's APIs live behind the **Connectivity Partner Programme**. Becoming a
connectivity partner requires application, a commercial agreement, and passing **technical
certification** against their test environment — a process measured in **months**, historically aimed
at property-management systems and channel managers rather than marketing tools.

**Relevant API families (`C2`):** Content API (property/room content), Rates & Availability,
Reservations, Promotions, **Reviews** (retrieve guest reviews for the partner's properties; a
**reply/response** capability exists in the Extranet and is exposed to some partners — `C3`),
Messaging (guest↔property), plus the newer **Demand API** (2024, for travel-distribution partners
searching and booking inventory — not review management).

**Auth (`C2`):** partner credentials (Basic/OAuth per API generation), machine account per property
group, IP allow-listing.

**Play:** **do not build.** If a hospitality customer needs it, integrate via their existing channel
manager or a hospitality-specific reputation vendor (TrustYou, ReviewPro/Shiji) that already holds the
partnership. **Effort: XL.**

---

### 11.9 OpenTable

**Verdict: XL, partner-gated, and there is no review API even for partners. Skip.**

**Facts (`C1`):** OpenTable's APIs (availability, reservations, "OpenTable Connect", restaurant
management) are partner-only, requiring a commercial relationship. Diner reviews on OpenTable are
collected post-dining and surfaced to restaurants in the **OpenTable for Restaurants** dashboard;
I am not aware of any API — partner or otherwise — that exposes review content or responses.
`UNVERIFIED` on partner-tier review access.

**Play:** not supported. Deep-link only. **Effort: XL/N-A.**

---

### 11.10 Zomato

**Verdict: dead. `C1`**

Zomato **discontinued its public Developer API in 2021** (developers.zomato.com shut down, existing
keys revoked). The company (now Eternal) operates as a consumer/restaurant-partner business in India
with no public developer platform. Restaurant partners get a dashboard.

Relevance to a *Western* product is marginal anyway — Zomato exited most Western markets (it shut down
in the US/UK/etc. years ago). **Play: not supported. Effort: N/A.**

---

### 11.11 Amazon reviews

**Verdict: no official path. This is the most-requested review source we cannot legitimately serve
directly.**

**The facts (`C1`):**
- **Product Advertising API v5 (PA-API)** — for affiliates. It **does not return review text**. Earlier
  versions returned an iframe URL of the reviews widget; that was removed. Current responses give at
  most a `CustomerReviews.StarRating`/`Count` in some marketplaces, or nothing.
- **Selling Partner API (SP-API)** — for sellers. There is **no reviews resource**. What exists:
  - **Solicitations API** — `GET /solicitations/v1/orders/{orderId}` (available actions) and
    `POST /solicitations/v1/orders/{orderId}/solicitations/productReviewAndSellerFeedback` — this
    sends Amazon's own "Request a Review" message for an order. **This is genuinely useful**: it is a
    compliant way to automate review solicitation, and it is exactly the review-generation workflow
    customers want. Limits: one request per order, within a 5–30 day window after delivery (`C2`),
    and rate-limited (order of 1 request/second with a burst, `C3`).
  - **Notifications API** for order events to drive the above.
  - Brand-registered sellers see review data in **Brand Analytics / Voice of the Customer** in Seller
    Central — **UI only, no API** (`C1`).
- **Vendor Central / retail** has its own reporting, also not review text via API.

**So:** review *reading* on Amazon requires a scraping vendor (§13) with the associated ToS and legal
exposure (§18). Review *solicitation* is officially supported via SP-API and we should build it.

**Play:** ship **SP-API Solicitations** as a review-generation feature (M, and it needs SP-API app
registration + LWA OAuth + seller authorization, which is its own approval process with a developer
profile review). Offer Amazon review *monitoring* only via an explicitly-labelled third-party data
source, if at all. **Effort: M** (solicitations) / **N/A** (official review read).

---

### 11.12 Apple App Store reviews

**Verdict: M, build it. Full read *and* reply, free, and app-developer customers value it highly.**

**Base (`C1`):** App Store Connect API at `https://api.appstoreconnect.apple.com/v1/…`.
**Auth (archetype E, `C2`):** JWT **ES256** signed with a `.p8` private key downloaded once from App
Store Connect → Users and Access → Integrations → App Store Connect API. Claims: `iss` (issuer id),
`kid` (key id), `aud: appstoreconnect-v1`, `exp` ≤ **20 minutes** from `iat`, `bid` for individual keys.
Header `Authorization: Bearer {jwt}`. **Key roles matter**: the key needs at least "App Manager" or
"Customer Support" role to read/reply to reviews (`C2`).

**Reviews (`C2`):**
```
GET  /v1/apps/{appId}/customerReviews
       ?filter[territory]=USA&filter[rating]=1,2&sort=-createdDate
       &limit=200&include=response
GET  /v1/customerReviews/{id}/response
POST /v1/customerReviewResponses
       { data: { type: "customerReviewResponses",
                 attributes: { responseBody: "…" },
                 relationships: { review: { data: { type:"customerReviews", id:"…" } } } } }
PATCH /v1/customerReviewResponses/{id}      # edit an existing response
DELETE /v1/customerReviewResponses/{id}
```
Review attributes: `rating` (1–5 integer), `title`, `body`, `reviewerNickname`, `createdDate`,
`territory` (**per-storefront — a US customer's reviews are a subset; we must iterate territories or
accept partial data**). Responses appear publicly under the review, one per review, editable.
Max response length ~5,970 characters (`C3`).

**Also available and valuable (`C2`):** `/v1/apps`, `/v1/appStoreVersions`, `/v1/appInfos`
(store listing metadata — enabling **App Store listing management** as a publishing surface),
`/v1/appPreviewSets`, `/v1/appScreenshotSets` (screenshot uploads — a reservoir-and-upload flow),
plus the **Analytics Reports API** (2024+: `POST /v1/analyticsReportRequests` with
`accessType: ONE_TIME_SNAPSHOT | ONGOING`, then poll `analyticsReports` → `analyticsReportInstances`
→ `analyticsReportSegments` which are gzipped TSV files in signed S3-style URLs) for impressions,
downloads, retention. That report-request → poll → download-segments pattern is unusual and needs a
dedicated job runner.

**Free alternative for read-only (`C2`):** the public RSS/JSON endpoint
`https://itunes.apple.com/{cc}/rss/customerreviews/page=1/id={appId}/sortby=mostrecent/json` — no auth,
~50 reviews/page and a small number of pages, per-country. Useful for **competitor** app review
monitoring (where we have no credentials) — a nice differentiating feature.

**Rate limits (`C3`):** App Store Connect API is documented with an hourly per-team quota (commonly
cited around **3,500–3,600 requests/hour**), returning `429` with a `Retry-After`. Analytics report
generation is asynchronous and separately throttled.

**Effort: M** (2 weeks including JWT/key custody, territory iteration, and reply flow).

---

### 11.13 Google Play reviews

**Verdict: M, build it — but the 7-day window is a hard architectural constraint that must be designed
around from day one.**

**Base (`C1`):** Google Play Developer API (`androidpublisher` v3),
`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/…`.
**Auth (`C2`):** a **Google Cloud service account** granted access in Play Console → Users and
permissions (or via API access linking), scope
`https://www.googleapis.com/auth/androidpublisher`. Service-account JSON key held by us on behalf of
the customer, or — better — the customer links their own GCP project. Note there is no user-facing
OAuth "connect with Google Play" consent flow of the kind consumers expect; onboarding is a
console-configuration task and **needs a good guided walkthrough or it will be a support sink**.

**Reviews (`C2`):**
```
GET  /applications/{packageName}/reviews?maxResults=100&translationLanguage=en&token=…
GET  /applications/{packageName}/reviews/{reviewId}
POST /applications/{packageName}/reviews/{reviewId}:reply   { "replyText": "…" }
```
Review object: `reviewId`, `authorName`, `comments[]` → `userComment` (`text`, `lastModified`,
`starRating`, `reviewerLanguage`, `device`, `androidOsVersion`, `appVersionCode`,
`thumbsUpCount`, `thumbsDownCount`, `deviceMetadata`) and `developerComment` (`text`,
`lastModified`).

**The constraint (`C1`, and it is severe):** `reviews.list` returns **only reviews from approximately
the last week**, and **only reviews that have comments** (rating-only reviews are excluded). There is
no historical query. Consequences:
1. **We must poll at least daily, forever, and store everything** — our database becomes the system of
   record for a customer's Google Play review history from the moment they connect.
2. **Backfill requires a different source:** Play Console generates **CSV exports in a Google Cloud
   Storage bucket** (`pubsite_prod_rev_{developerId}`, `reviews/reviews_{package}_{YYYYMM}.csv`,
   monthly, UTF-16LE encoded — a real encoding gotcha). Reading that bucket requires the service
   account to be granted GCS access. Building this is the difference between "we show you last week"
   and "we show you three years".
3. **Replies are limited to ~350 characters** (`C2`) and one reply per review (subsequent calls edit
   it). Replies may take time to appear.

**Rate limits (`C3`):** the Play Developer API has a default project quota commonly cited at
**200,000 requests/day**, with separate lower limits for some methods; publishing-related edits use a
different "edits" model. Reply throughput is modest — batch politely.

**Effort: M** (2–3 weeks) for polling + reply; **+1 week** for the GCS CSV backfill pipeline.
**Do the backfill** — it is the feature that makes the integration credible.

---

### 11.14 Glassdoor

**Verdict: no API. `C1`**

Glassdoor's partner API (which historically served job and company data to affiliates) was
**discontinued around 2021**; no new keys, no public documentation. Glassdoor is part of Recruit
Holdings alongside Indeed, and the developer surface that survived is **Indeed's job-related APIs**,
not Glassdoor reviews.

Employer response to reviews happens in the **Glassdoor Employer Center** (UI only). Scraping
Glassdoor is explicitly prohibited by its terms and it is aggressively bot-protected.

**Play:** not supported. If employer-brand monitoring is a target use case, the honest answer is a
manual workflow plus alerting driven by an aggregator that claims Glassdoor coverage (§13) — and note
that such coverage is scraped, with the attendant risk. **Effort: N/A.**

---

### 11.15 Indeed

**Verdict: no review API; job-posting APIs exist but serve a different product.** `C1`

- **Indeed employer reviews** — no API, no partner program I am aware of for review content.
- What Indeed does offer: the **Job Sync API** / **Indeed Apply** for ATS and job-board partners
  (OAuth2, partner onboarding), plus Indeed's advertising APIs. These belong in a recruiting product,
  not a social-media/reputation product.

**Play:** not supported for reviews. **Effort: N/A.**

---

### 11.16 Healthgrades

**Verdict: no API. `C1`/`UNVERIFIED` on partner tiers.**

Healthgrades (RVO Health) has no public developer platform. Provider profile data and reviews are
managed through Healthgrades' own provider tools and through **enterprise partnerships** with
healthcare reputation vendors (Reputation.com, Press Ganey, Binary Fountain/Press Ganey, Loyal). Those
vendors have negotiated data feeds; we would need the same.

**Additional constraint (`C1`):** healthcare review management touches **HIPAA** — responding to a
patient review can disclose PHI (acknowledging someone was a patient). Any healthcare review feature
needs guardrails and canned-response templates reviewed by counsel. See `11-compliance-security-global.md`.

**Play:** not supported directly. Healthcare vertical → partner with a specialist vendor.
**Effort: N/A.**

---

### 11.17 Zillow

**Verdict: no review API. `C1`**

- Zillow's **public API (GetSearchResults, GetZestimate, etc.) was retired in 2021.**
- What survives: **Bridge Interactive** APIs (Zillow Group) for **MLS listing data**, which require MLS
  and broker approvals; and rentals/property-manager feeds via partners. These are listing-syndication
  products.
- **Agent reviews on Zillow** (the thing a real-estate customer cares about) have no API. Review
  solicitation is done via Zillow's own agent tools.

**Play:** not supported. **Effort: N/A.**

---

### 11.18 Angi (Angie's List / HomeAdvisor)

**Verdict: no public API. `C1`**

Angi's integrations are **lead-delivery** oriented: partner APIs push leads to service professionals'
CRMs (and CRM vendors like ServiceTitan/Jobber integrate that way). There is no public API for reading
Angi reviews or posting responses; pros respond in the Angi Pro app/portal.

**Play:** not supported; deep-link only. **Effort: N/A.**

---

### 11.19 Better Business Bureau (BBB)

**Verdict: no public API. `C1`**

BBB operates as a federation of local BBBs with a national directory. There is **no self-serve
developer API** for business profiles, customer reviews, or complaints. BBB licenses data to partners
under contract (and its "Get a Quote"/lead programs have partner integrations). Complaint handling is
done in BBB's business portal.

**Play:** not supported. Note that BBB matters mainly for US service businesses and mainly for
**complaints** rather than reviews — a distinct workflow with formal response deadlines, which is a
poor fit for a social tool anyway. **Effort: N/A.**

---

### 11.20 Facebook Recommendations

**Verdict: S — because we already have Meta plumbing from tier-1. Include it; it is the cheapest
incremental review source we have.**

**Facts (`C1`/`C2`):** Facebook replaced star "Reviews" with **Recommendations** (positive/negative,
not 1–5). Graph API:
```
GET /{page-id}/ratings?fields=reviewer,rating,recommendation_type,review_text,created_time,open_graph_story
```
- Requires a **Page access token** with `pages_read_engagement` and **`pages_read_user_content`**
  (the latter requires **Meta App Review** — see `06` §10; it is the same review cycle as the rest of
  our Meta permissions, so bundle it into one submission).
- `rating` (the legacy 1–5 field) is **deprecated**; `recommendation_type` ∈ `{positive, negative}` is
  the live field. Our normalized schema must handle "no numeric rating" (§14.4).
- **Replying**: a recommendation is backed by an Open Graph story; replying = commenting on that story:
  `POST /{open_graph_story_id}/comments` with `pages_manage_engagement`. `C2`
- **Webhooks:** the Page webhook `ratings` field delivers new/updated/deleted recommendations in
  near-real-time — **use it instead of polling.** `C2`

**Caveats (`C1`):** many Pages have Recommendations disabled; recommendation text is often empty;
Meta has repeatedly narrowed this edge, so treat continued availability as a medium-risk assumption.

**Effort: S** (2–4 days on top of existing Meta integration).

---

## 12. The review-response capability matrix

**The single table to consult before promising anything to a customer.** `C1` on every Yes/No.

| Platform | Read reviews via API | Full text? | Historical depth | **Reply via API** | Solicit/invite via API | Webhook/push |
|---|---|---|---|---|---|---|
| **Google Business Profile** | ✅ | ✅ Full | Full history | ✅ `reviews/{id}/reply` | ❌ (Google forbids gating/soliciting selectively; short-link only) | ✅ Pub/Sub |
| **Trustpilot** | ✅ | ✅ Full | Full history | ✅ `POST /private/reviews/{id}/reply` | ✅ **Invitations API** | Partial (`C3`) |
| **Apple App Store** | ✅ | ✅ Full | Full (paginated, per-territory) | ✅ `customerReviewResponses` | ❌ (in-app `SKStoreReviewController` only) | ❌ (poll) |
| **Google Play** | ✅ | ✅ Full | **Last ~7 days only** (+ GCS CSV backfill) | ✅ `reviews:reply` (350 chars) | ❌ (in-app Review API only) | ❌ (poll) |
| **Facebook Recommendations** | ✅ | Often empty | Full | ✅ (comment on the story) | ❌ | ✅ Page webhook `ratings` |
| **Yelp** | ⚠️ **3 excerpts, truncated** | ❌ | ❌ | ❌ | ❌ (Yelp forbids solicitation entirely) | ❌ |
| **TripAdvisor** | ⚠️ ~5 reviews | ✅ (for those 5) | ❌ | ❌ | Partner-only (Review Express) | ❌ |
| **G2** | ✅ (paid) | ✅ | Full | ❌ | ❌ | ✅ (`C3`) |
| **Capterra / GDM** | ❌ (export/widget) | — | — | ❌ | ❌ | ❌ |
| **Booking.com** | Partner only | ✅ | Full | Partner (`C3`) | Partner | Partner |
| **OpenTable** | ❌ | — | — | ❌ | ❌ | ❌ |
| **Amazon** | ❌ | — | — | ❌ | ✅ **SP-API Solicitations** | ✅ (order events) |
| **Glassdoor / Indeed / Healthgrades / Zillow / Angi / BBB** | ❌ | — | — | ❌ | ❌ | ❌ |
| **Apple Maps (Business Connect)** | n/a — no first-party reviews | — | — | — | — | — |

### 12.1 The solicitation-policy landmine (`C1`)

Review *generation* is where the money is, and it is also where the terms bite:
- **Google** prohibits **review gating** (asking happy customers for reviews while diverting unhappy
  ones to a private form). A compliant feature asks *everyone* the same way. Google provides a
  short-link per location for this.
- **Yelp** prohibits **soliciting reviews at all**, and actively penalizes businesses it catches.
  Our product must not offer a "request a Yelp review" button. This is a hard product constraint.
- **Amazon** allows only its own templated "Request a Review" (SP-API Solicitations); custom
  review-request messaging is prohibited.
- **Trustpilot** encourages invitations and provides the API — but forbids selective/incentivized
  invitations.
- **App stores**: Apple requires in-app review prompts to use `SKStoreReviewController`
  (rate-limited by iOS to ~3 prompts/year); Google requires the In-App Review API.

**Product requirement:** the review-request feature must be **per-platform policy-aware**, refusing to
generate non-compliant flows, with the reasoning surfaced in the UI. This is both a compliance
necessity and a trust-building differentiator.

---

## 13. Buy-vs-build: aggregators and vendors

Given §12, any product claiming "monitor reviews across 100+ sites" is **buying data**. Our options:

### 13.1 Legitimate aggregators / white-label review data

| Vendor | What they sell | Notes (`C2`/`C3`) |
|---|---|---|
| **Yext** | Knowledge Graph + **Reviews API** across a large partner network (listings sync to 100+ publishers, review monitoring and response for the subset that permits it) | Formal API, enterprise pricing (4–5 figures/yr). Also the best *listings syndication* option if we want "update hours everywhere". |
| **ReviewTrackers** | Review aggregation across ~100 sites with an API | Mid-market pricing; API access on request |
| **Chatmeter / Reputation.com / Birdeye / Podium / GatherUp / Grade.us / Broadly** | Full reputation platforms; some offer partner/white-label APIs | These are **competitors** in the review vertical — partnering has strategic downside |
| **BrightLocal** | Local SEO + review monitoring, has an API (`C3`) | SMB pricing, agency-friendly |
| **Trustpilot / Google / Apple / Play** | Direct, as above | Always prefer first-party |

### 13.2 Scraping / data-extraction vendors (grey)

| Vendor | Coverage | Model (`C3`) |
|---|---|---|
| **DataForSEO Business Data API** | Google, Yelp, Tripadvisor, Trustpilot reviews | Pay-per-request, fractions of a cent per call plus per-review costs; task-based async |
| **Bright Data** | Amazon, Google, Yelp, Glassdoor datasets + scraping infra | Per-record or per-GB; enterprise |
| **Apify** | Actor marketplace with per-site review scrapers | Per compute-unit; cheap; highly variable reliability |
| **Oxylabs / Zyte / SerpApi / Rainforest API** | SERP + marketplace scraping; Rainforest is Amazon-specialized | Per-request, ~$0.001–$0.01 |

**Position (see §18):** using a scraping vendor moves the *operational* risk but not the *legal* risk.
For US-only public data the *hiQ v. LinkedIn* line of cases makes CFAA claims weak, but **breach of
contract (ToS) and copyright in review text remain live theories**, and platforms retaliate technically
(blocking) and commercially (revoking our first-party API access — Google could revoke GBP access if it
concluded we scrape Google reviews).

**Recommendation (`C1` judgement):**
1. **Build first-party for the five that allow it** (GBP, Trustpilot, App Store, Play, Facebook).
2. **Integrate Yelp/TripAdvisor officially** for rating + count monitoring, and be honest about the cap.
3. **Offer aggregator passthrough as an explicit, opt-in, separately-priced "Extended Review Sources"
   add-on** where the customer sees which sources are first-party and which are third-party.
4. **Never scrape from our own infrastructure**, and never scrape Google.

---

## 14. Normalized data models

The factory thesis (§1.2) only works if the domain model absorbs the variation. Four models carry it.

### 14.1 `Connection` — must handle instance-scoped and hierarchical accounts

```ts
type CredentialKind =
  | 'oauth2'            // access + refresh, we hold client creds
  | 'oauth2_dynamic'    // access + refresh, client creds are PER-INSTANCE  (Mastodon, WP self-hosted)
  | 'oauth1a'           // token + secret, HMAC signing            (Flickr, Tumblr legacy)
  | 'api_key'           // single opaque secret                    (Dev.to, Hashnode, Yelp, Viber)
  | 'bot_token'         // app-identity secret                     (Telegram, Discord, Slack)
  | 'webhook_url'       // the URL IS the secret                   (Discord, Teams Workflows)
  | 'basic_app_password'// user + app password over HTTPS          (WordPress self-hosted)
  | 'jwt_asymmetric'    // we hold a private key and mint JWTs     (Apple ASC/ABC/Podcasts, Ghost)
  | 'service_account'   // Google SA JSON                          (Google Play)
  | 'partner_managed';  // credentials live at a BSP/aggregator    (RCS, AMB, Booking)

interface Connection {
  id: string;
  tenantId: string;
  platform: PlatformId;              // 'reddit' | 'mastodon' | 'gbp' | ...
  credentialKind: CredentialKind;

  // --- the field most competitors omit, and the reason their Mastodon/WP support is bad ---
  instanceUrl?: string;              // https://mastodon.social | https://blog.acme.com
  instanceSoftware?: string;         // 'mastodon 4.3.2' | 'akkoma' | 'ghost 5.x' | 'wordpress 6.5'
  instanceCapabilities?: Json;       // max_chars, media limits, supported scopes, endpoints present

  // --- hierarchy: GBP accounts→locations, Meta business→pages, Shopify shop, Webflow site ---
  parentExternalId?: string;         // accounts/12345
  externalId: string;                // locations/67890 | channel id | blog id | subreddit
  displayName: string;
  avatarUrl?: string;

  secretRef: string;                 // pointer into the vault — NEVER the secret itself
  scopes: string[];
  expiresAt?: Date;
  refreshAt?: Date;                  // proactive refresh, not lazy-on-401
  health: 'ok' | 'degraded' | 'reauth_required' | 'revoked' | 'insufficient_plan';
  healthDetail?: string;             // "Trustpilot plan does not include the Invitations API"
  lastVerifiedAt: Date;
}
```

**Design notes (`C1`):**
- `instanceUrl` + `instanceCapabilities` are not optional extras — they are what makes archetype C
  work, and they are the single clearest technical differentiator against tools that hardcode
  `mastodon.social` or assume `/wp-json` exists.
- `health: 'insufficient_plan'` is a real and frequent state (Trustpilot tier, Vimeo tier, Flickr Pro
  for stats, G2 subscription). Surfacing it precisely prevents a class of support tickets that
  competitors answer with "it's broken".
- **Proactive refresh** (`refreshAt`) rather than refresh-on-401 matters because several of these APIs
  return non-401 errors on expiry (Reddit returns 401, Trustpilot 401, but Mastodon instances vary and
  Telegram just fails oddly).

### 14.2 `PlatformCapabilities` — declarative, queried by the UI

```ts
interface PlatformCapabilities {
  publish: {
    supported: boolean;
    mode: 'native' | 'assisted' | 'none';
    contentTypes: Array<'text'|'link'|'image'|'gallery'|'video'|'audio'|'poll'|'article'|'story'|'event'|'document'>;
    nativeSchedule: false | { minLeadTime?: Duration; maxLeadTime?: Duration };
    maxTextLength: number | 'per_instance';
    textCountingUnit: 'chars' | 'graphemes' | 'bytes' | 'utf16';   // Bluesky=graphemes, facets=bytes
    richText: 'none' | 'markdown' | 'html' | 'facets' | 'npf' | 'blockkit' | 'adaptivecard' | 'ricos' | 'lexical';
    media: { maxItems: number; maxBytesPerItem: number; mimeTypes: string[]; altTextSupported: boolean;
             aspectRatioRequired?: boolean };
    requiresPerTargetMetadata?: string[];   // reddit: ['flair','subreddit_rules']
    editAfterPublish: boolean;
    deleteAfterPublish: boolean;
  };
  read: {
    postMetrics: Array<'impressions'|'reach'|'likes'|'comments'|'shares'|'saves'|'clicks'|'views'|'notes'>;
    accountMetrics: Array<'followers'|'members'|'subscribers'|'growth'|'demographics'>;
    historyWindow?: Duration;                // GOOGLE PLAY = 7 DAYS
    realtime: 'webhook' | 'pubsub' | 'websocket' | 'poll';
  };
  reviews?: { read: boolean; fullText: boolean; reply: boolean; solicit: boolean;
              solicitPolicy?: 'allowed'|'forbidden'|'platform_template_only' };
  inbox?: { read: boolean; reply: boolean; sessionWindow?: Duration };  // WhatsApp = 24h
  costModel: 'free' | 'per_call' | 'per_message' | 'plan_gated' | 'contract';
}
```

**Why this is worth the ceremony (`C1`):** the composer, the calendar, the analytics dashboard and the
sales website should all be *generated from this object*. When Google Play's 7-day window or Bluesky's
grapheme counting is expressed as data rather than as scattered `if (platform === …)` branches, adding
platform #71 stops being a cross-cutting change.

### 14.3 The adapter interface

```ts
interface PlatformAdapter {
  readonly id: PlatformId;
  capabilities(conn: Connection): Promise<PlatformCapabilities>;   // may probe the instance

  // auth
  beginAuth(ctx): Promise<{ redirectUrl: string } | { instructions: Instruction[] }>;
  completeAuth(ctx): Promise<Connection[]>;                        // plural: GBP returns N locations
  refresh(conn): Promise<Connection>;
  verify(conn): Promise<HealthReport>;

  // publish — three distinct verbs, not one
  validate(conn, draft): Promise<ValidationResult>;                // pre-flight: reddit post_requirements,
                                                                   // mastodon max_chars, GBP summary length
  publishNow(conn, draft): Promise<PublishResult>;
  scheduleNative?(conn, draft, at: Date): Promise<PublishResult>;  // only where capabilities say so
  cancelNative?(conn, externalId): Promise<void>;

  // read
  fetchMetrics?(conn, externalIds: string[]): Promise<Metric[]>;
  fetchInbound?(conn, cursor?): Promise<{ items: InboundItem[]; cursor?: string }>;
  fetchReviews?(conn, cursor?): Promise<{ items: Review[]; cursor?: string }>;
  replyToReview?(conn, reviewId, body): Promise<void>;
}
```

**Two rules that fall out of the research (`C1`):**
1. **`completeAuth` returns an array.** GBP returns hundreds of locations; Meta returns many Pages;
   Shopify returns a shop; Webflow returns sites and collections. Adapters that assume 1 connection per
   auth get rewritten.
2. **`validate` is separate from `publish`.** Reddit's `post_requirements`, Mastodon's per-instance
   limits, GBP's post rules, Bluesky's grapheme count and Webflow's required fields all mean we can and
   should fail in the composer, not at 9:00 a.m. on Tuesday when the schedule fires.

### 14.4 `Review` — the normalized shape

The hard part is that "review" means five different things across sources.

```ts
interface Review {
  id: string;                       // our id
  connectionId: string;
  source: 'gbp'|'trustpilot'|'yelp'|'tripadvisor'|'appstore'|'googleplay'|'facebook'|'g2'|'thirdparty';
  sourceReviewId: string;
  sourceUrl?: string;

  // --- rating is NOT always a 1-5 integer ---
  rating?: { kind: 'stars5'; value: 1|2|3|4|5 }
         | { kind: 'recommendation'; value: 'positive'|'negative' }   // Facebook
         | { kind: 'scale10'; value: number }                          // Booking.com
         | { kind: 'none' };                                           // ratingless

  title?: string;
  body?: string;                    // MAY BE ABSENT (GBP rating-only) or TRUNCATED (Yelp)
  bodyIsTruncated: boolean;         // Yelp = true, always
  language?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  isAnonymous: boolean;

  createdAt: Date;
  updatedAt?: Date;

  reply?: { body: string; postedAt: Date; postedBy?: string; editable: boolean };
  canReplyViaApi: boolean;          // drives the UI: button vs deep-link
  replyDeepLink?: string;

  // provenance & trust
  ingestedVia: 'first_party_api' | 'aggregator' | 'scraper';
  ingestedAt: Date;

  // enrichment (ours)
  sentiment?: number; topics?: string[]; isUrgent?: boolean;
  // per-source extras
  meta: Json;                       // appVersion/device (Play), territory (Apple), subratings (TripAdvisor)
}
```

**`bodyIsTruncated` and `ingestedVia` are trust features (`C1`).** Showing the user "this Yelp review
text is truncated by Yelp's API — open on Yelp for the full text" and "this Amazon review came from a
third-party data source" is exactly the honesty that turns a limitation into credibility.

### 14.5 Identity resolution across sources

A single physical business appears as: a GBP `locations/{id}`, a Yelp business id, a TripAdvisor
`locationId`, a Facebook Page id, an Apple Business Connect location, a Trustpilot business unit. We
need a **`BusinessLocation`** entity that owns these mappings, resolved via:
- **Yelp `/businesses/matches`** (name + address + city + state + country → Yelp id) — purpose-built
  for exactly this. `C2`
- **TripAdvisor `/location/search`** with name + address.
- **Google Places / GBP** search by name+address.
- Manual override, always, because fuzzy matching fails on suites, franchises and DBAs.

Store the mapping with a confidence score and a "verified by user" flag. Multi-location customers will
have hundreds of these and the bulk-mapping UI is a real piece of work (estimate: 1–2 weeks on its own).

---

## 15. Cross-cutting engineering

### 15.1 Dynamic client registration (archetype C) — the reference flow

```
1. User enters:  blog.example.com   (or @user@mastodon.social → derive host)
2. NORMALIZE     strip scheme/path, lowercase, punycode
3. SSRF GUARD    resolve DNS; reject private/loopback/link-local/metadata ranges
                 (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7),
                 re-check after every redirect, cap redirects at 3, block non-443 ports
4. PROBE         GET /api/v1/instance (Mastodon)  | /nodeinfo/2.0
                 GET /wp-json/ or Link: rel="https://api.w.org/"  (WordPress)
                 GET /ghost/api/admin/site/                        (Ghost)
                 → determine software + version + capabilities
5. CLIENT CACHE  SELECT * FROM instance_clients WHERE host = ?
   miss →        POST /api/v1/apps {client_name, redirect_uris, scopes, website}
                 store client_id/client_secret keyed by host (encrypted)
6. OAUTH         standard authorize → callback → token exchange against THAT host
7. PERSIST       Connection{instanceUrl, instanceSoftware, instanceCapabilities, secretRef}
8. VERIFY        GET /api/v1/accounts/verify_credentials (or equivalent) → displayName, avatar
```

**Failure modes to handle explicitly (`C1`):** instance requires approval for new apps; instance has
registrations closed; instance is behind Cloudflare and blocks our UA; instance runs a fork with a
missing endpoint; instance's TLS cert is self-signed; instance rate-limits app registration.
Each needs a distinct, actionable error message.

### 15.2 Token vault requirements derived from this document

| Requirement | Driven by |
|---|---|
| Envelope encryption (KMS-backed DEK per tenant) | Everything |
| **Asymmetric private-key storage** (`.p8` ES256, Ghost HS256 secrets, GCP SA JSON) | Apple ASC/ABC/Podcasts, Ghost, Google Play |
| **Per-host client secrets** (not just per-user tokens) | Mastodon/Fediverse, WordPress self-hosted |
| OAuth1.0a token+secret pairs with HMAC signing | Flickr, Tumblr legacy |
| Webhook URLs treated as secrets (they are bearer credentials) | Discord, Teams Workflows, Slack |
| Proactive refresh scheduler with jitter | Reddit (1 h), Trustpilot (~7 d), Bluesky (~2 h), Twitch, Vimeo |
| Short-lived JWT minting at request time (never stored) | Apple family, Ghost |
| Revocation detection + `reauth_required` state machine | All |
| Per-tenant key isolation and crypto-shredding on delete | GDPR/CCPA (`11-compliance…`) |

**Concrete risk (`C1`):** holding customers' Apple `.p8` keys and Google service-account JSONs is a
materially higher security burden than holding OAuth tokens — those credentials are broad (an ASC key
with App Manager role can change app metadata and pricing). Consider **scoped-role guidance in
onboarding** ("create a key with the Customer Support role only") and document it.

### 15.3 The `.well-known` / discovery layer

Where possible, avoid asking users for anything but a URL or handle:
- Bluesky: handle → DID via `com.atproto.identity.resolveHandle`, DID doc → PDS endpoint.
- Fediverse: `@user@host` → WebFinger `/.well-known/webfinger?resource=acct:…` → actor → software.
- WordPress: `Link:` header discovery.
- Podcasts: iTunes Lookup by feed URL or show name.
- RSS: `<link rel="alternate" type="application/rss+xml">` in the page head.

### 15.4 SSRF is a first-class threat here

Unlike tier-1 (fixed hosts), tier-2 has us making **server-side HTTP requests to user-supplied hosts**
(Mastodon instances, WordPress sites, Ghost sites, RSS feeds, webhook URLs, Vimeo `pull` upload URLs,
GBP media `sourceUrl`s). Requirements:
- A single hardened outbound HTTP client used by all adapters — DNS pinning between resolve and
  connect, private-range denial, redirect re-validation, response size caps, timeouts, and no
  automatic credential forwarding across hosts.
- **Never** let a user-supplied URL be fetched with any of our credentials attached.
- Egress from a dedicated, isolated worker pool.

### 15.5 Idempotency

Several platforms will happily double-post on retry. Mitigations available:
- **Mastodon**: `Idempotency-Key` header — use it (rare gift).
- **Reddit**: no idempotency; must check `/user/{me}/submitted` before retry.
- **Telegram**: no idempotency; dedupe on our side with a per-(chat, scheduled_post) lock.
- **Discord webhooks**: no idempotency; same.
- **General rule:** every publish job carries a deterministic `idempotencyKey`; before any retry the
  adapter must either use a platform idempotency mechanism or perform a **read-back check**. Encode
  which strategy applies in `PlatformCapabilities`.

---

## 16. Rate limiting and queue design

Seventy APIs with seventy limit models cannot be served by one global limiter. The design that works:

### 16.1 Limiter taxonomy observed in this document

| Model | Platforms | Implementation |
|---|---|---|
| **Fixed window, header-reported** | Reddit (`X-Ratelimit-*`), Mastodon (`X-RateLimit-*`), Twitch (`Ratelimit-*`), Webflow, Tumblr | Trust headers; adaptive token bucket seeded from them |
| **Per-route bucket hash** | Discord (`X-RateLimit-Bucket`) | Keyed limiter on the returned bucket id |
| **Points/cost-based** | Bluesky (CREATE=3/UPDATE=2/DELETE=1), Twitch (800 pts/min), Shopify GraphQL (`extensions.cost`) | Pre-compute cost per call; decrement locally; reconcile from response |
| **Method tiers** | Slack (tiers 1–4, plus 1 msg/s/channel for `chat.postMessage`) | Static per-method config |
| **Per-user daily caps** | Tumblr (250 posts, 150 photos, 10 videos/day), Bluesky (35k pts/day), Flickr (3,600/h) | Per-connection counters with day boundaries in the *platform's* timezone |
| **Per-conversation/session windows** | WhatsApp (24 h), tiered unique-recipient caps | Business-logic gate, not a rate limiter |
| **Quota-per-project** | GBP (~300 QPM, approval-gated), Google Play (~200k/day) | Shared across all tenants → **needs fair-share scheduling** |
| **Opaque / undocumented** | Kick, Wix, Vimeo, Hashnode | Conservative default + exponential backoff + circuit breaker |

### 16.2 The fair-share problem (`C1`, important)

For **project-level quotas shared across tenants** — Google Business Profile most of all, but also our
Telegram shared bot and any aggregator contract — one large customer's bulk operation can starve
everyone. Required:
- A **per-tenant token allocation** within the global quota (weighted by plan).
- **Priority classes**: interactive user action > scheduled publish > background sync > backfill.
  Backfill (e.g. Google Play GCS import, GBP location sync) must be preemptible.
- **Admission control**: reject/queue with an honest ETA rather than silently delaying a scheduled post.

### 16.3 Queue topology

```
                     ┌─ per-(platform, connection) FIFO for ordering-sensitive work
scheduler ──▶ jobs ──┼─ per-platform rate-limited worker pool
                     └─ priority lanes: interactive | scheduled | sync | backfill
```
- **Ordering matters** for threads (Bluesky/X/Mastodon reply chains, Telegram albums) — those must be
  serialized per connection.
- **Scheduled publish jobs must be reserved ahead of time** (claim a rate-limit slot at T-60s), because
  discovering at T+0 that we are rate limited means a late post.
- **Circuit breakers per platform**, with the breaker state visible in the customer UI ("Reddit is
  rate-limiting us; your 10:00 post is queued") — again, honesty as a feature.

### 16.4 Backoff and error taxonomy

Normalize every platform error into:
`RETRYABLE_TRANSIENT` | `RETRYABLE_RATE_LIMIT(retryAfter)` | `AUTH_EXPIRED` | `AUTH_REVOKED` |
`PERMISSION_MISSING(scope)` | `CONTENT_REJECTED(reason)` | `PLATFORM_POLICY` | `PLAN_INSUFFICIENT` |
`NOT_FOUND` | `PERMANENT`.

Only `CONTENT_REJECTED` and `PLATFORM_POLICY` should surface as "your post was rejected"; the rest are
our problem. Reddit's *post-hoc moderator removal* (§6.1) needs its own terminal state
(`PUBLISHED_THEN_REMOVED`) that no generic taxonomy anticipates.

---

## 17. Reminder-publish and assisted-publish

Roughly **20 of the ~70 surfaces here have no write API.** The reminder path is not a consolation
prize — done well it is a feature, and it is the only honest answer for Snapchat organic, Substack,
Squarespace, Truth Social, Gettr, Lemon8, Nextdoor (non-partner), Quora, Behance, SlideShare, Rumble,
WhatsApp Status/Channels, and Instagram/TikTok formats that tier-1 also cannot reach (`06` §6).

### 17.1 Requirements

| Requirement | Detail |
|---|---|
| **Push at the moment** | Mobile push (iOS/Android) + email + optional Slack/Teams DM at the scheduled time, with a short lead-time option (e.g. 10 min before). |
| **One-tap content transfer** | Copy caption to clipboard; download media to camera roll; where a platform supports a compose deep link or share intent, use it (`snapchat://`, `nextdoor://`, `x.com/intent/post?text=`, `reddit.com/submit?url=&title=`, `substack.com/publish/post`). |
| **Per-platform content profile** | Character limit, hashtag conventions, media dimensions/duration, whether links are clickable. Reuse `PlatformCapabilities` (§14.2). |
| **Confirmation loop** | "Did you post it?" → mark published, optionally accept a pasted URL so we can later fetch metrics or at least link the calendar entry. |
| **Escalation** | If not confirmed in N minutes, re-notify; after M, mark missed and report it in the weekly digest. |
| **Reporting honesty** | Assisted posts are visually distinct in the calendar and excluded from "auto-published" counts. |

### 17.2 Deep-link recipes worth collecting (`C3` — all need verification, they change)

| Platform | Compose entry point |
|---|---|
| Reddit | `https://www.reddit.com/r/{sub}/submit?title=…&text=…` (or `&url=`) |
| Substack | `https://{pub}.substack.com/publish/post` |
| Squarespace | `https://{site}/config/pages` |
| Nextdoor | `https://nextdoor.com/news_feed/?post=` (`UNVERIFIED`) |
| Quora | `https://www.quora.com/` (no compose deep link known) |
| Snapchat | mobile share sheet via Creative Kit only |
| Truth Social | `https://truthsocial.com/` (no compose param known) |
| Rumble | `https://rumble.com/upload.php` |
| Behance | `https://www.behance.net/portfolio/editor` |

### 17.3 The competitive framing

Every competitor has reminder publishing (Later pioneered it for Instagram). **The differentiator is
coverage plus honesty**: a channel picker that shows, per platform, a green "auto" badge or an amber
"assisted" badge with a tooltip explaining *why* — "Snapchat has no organic posting API" — turns our
biggest limitation into evidence of expertise. Competitors bury this; we should lead with it.

---

## 18. Legal & ToS risk register

| # | Risk | Platforms | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Scraping review content** breaches ToS; copyright in review text; platform retaliation | Amazon, Glassdoor, Yelp (beyond API), Google (beyond API), Goodreads, Capterra | **High** | Never scrape in-house. Aggregator passthrough only, labelled, opt-in, contractually indemnified where possible. **Never scrape Google** — it endangers GBP API access. |
| 2 | **Reddit commercial API terms** — SaaS posting on behalf of paying customers is commercial use | Reddit | **High** | Engage Reddit before scale; budget per-call cost; enforce internal call budgets |
| 3 | **Unofficial/undocumented endpoints** (Substack internal API, Truth Social, Gettr, Telegram web scraping) | several | **High** | Prohibited by engineering policy. Reminder-publish instead. |
| 4 | **Review gating** prohibited by Google; **any** solicitation prohibited by Yelp | GBP, Yelp | **High** | Policy-aware solicitation engine (§12.1); block non-compliant flows in product |
| 5 | **Messaging consent** — TCPA (US), GDPR/ePrivacy (EU), CASL (CA) apply to WhatsApp/RCS/SMS/Viber | messaging | **High** | Opt-in ledger with proof, per-channel; unsubscribe handling; jurisdiction-aware defaults |
| 6 | **HIPAA** — responding to healthcare reviews can disclose PHI | Healthgrades, GBP for clinics | **High** | Templated compliant responses; warnings; BAA posture (see `11-compliance…`) |
| 7 | **Fediverse norms** — bulk marketing automation triggers instance-level blocks of our app/domain | Mastodon et al. | Medium | Conservative defaults, per-instance rate respect, contactable app registration, no cross-post-everything default |
| 8 | **Holding high-privilege customer credentials** (Apple `.p8`, GCP SA JSON, WP app passwords) | Apple, Play, WordPress | Medium-High | Least-privilege onboarding guidance, KMS, per-tenant isolation, audit log, crypto-shred on delete |
| 9 | **Webhook URLs as bearer secrets** leaking via logs/exports | Discord, Teams, Slack | Medium | Treat as secrets end-to-end; redact in logs; rotate on suspicion |
| 10 | **SSRF via user-supplied hosts** | archetype C + G | Medium-High | §15.4 hardened client |
| 11 | **Attribution obligations** | TripAdvisor (logo/link), Yelp (branding), Google (attribution of reviews) | Low-Medium | Build a per-source attribution component once; render everywhere |
| 12 | **Platform-plan misrepresentation** — selling "Trustpilot integration" to customers whose plan lacks API | Trustpilot, G2, Vimeo, Flickr | Low | `health: insufficient_plan` + pre-sale capability checker |

---

## 19. Prioritized build waves

Effort in **engineer-weeks (EW)**; calendar friction noted separately.

### Wave 0 — Platform foundations (prerequisite, ~10–14 EW)
| Item | EW |
|---|---|
| Adapter framework, `PlatformCapabilities`, error taxonomy, idempotency (§14) | 3 |
| Token vault extensions: OAuth1, JWT/private keys, per-host client secrets (§15.2) | 2 |
| Hardened outbound HTTP client + SSRF guard (§15.4) | 1 |
| Rate-limiter framework with the 8 limiter models + fair-share (§16) | 2–3 |
| Reminder-publish pipeline: push/email, deep links, confirmation loop (§17) | 2 |
| RSS/feed ingestion framework (archetype G) (§3) | 1–2 |
| **Start GBP API access request + Reddit commercial conversation on day 1** | 0 (calendar) |

### Wave 1 — Highest value per week (~10 EW)
| Platform | EW | Rationale |
|---|---|---|
| **Google Business Profile** | 5–8 | The anchor. Reviews + posts + Q&A + insights + Pub/Sub. **Approval is the long pole — start immediately.** |
| **Telegram** | 1 | Cheapest real integration in the document |
| **Discord (webhook)** | 0.5 | Near-free; community customers |
| **Bluesky** | 2 | Free, no approval, genuine user demand |
| **Slack (post + schedule)** | 1 | Internal distribution + our own alerting sink |

### Wave 2 — Long-tail social + the blogging layer (~12 EW)
| Platform | EW |
|---|---|
| **Mastodon / Fediverse** (archetype C, first instance-scoped adapter) | 3–4 |
| **Reddit** (flair + post_requirements + removal detection) | 3 |
| **WordPress** (both paths + discovery + diagnostics) | 3 |
| **Ghost** | 1 |
| **Dev.to + Hashnode** | 1.5 (both) |

### Wave 3 — Reviews beyond Google (~8 EW)
| Platform | EW |
|---|---|
| **Trustpilot** (read + reply + invitations) | 2.5 |
| **Apple App Store** (read + reply + JWT key custody) | 2 |
| **Google Play** (read + reply + GCS backfill) | 3 |
| **Yelp + TripAdvisor** (presence monitoring, attribution) | 1.5 |
| **Facebook Recommendations** | 0.5 (rides tier-1) |

### Wave 4 — Creator & CMS breadth (~10 EW)
| Platform | EW |
|---|---|
| **Twitch** (metadata + EventSub go-live automation) | 2 |
| **Kick** | 1.5 |
| **Tumblr** | 2 |
| **Webflow** (+ reusable field-mapping engine) | 3 |
| **Shopify blog** | 2.5 (+ App Store review calendar) |
| **Vimeo** | 2.5 |

### Wave 5 — Messaging module (separate product decision, ~12 EW)
| Platform | EW |
|---|---|
| **WhatsApp Cloud API** (Embedded Signup, templates, cost meter, consent ledger) | 6 |
| **RCS via one CPaaS** | 3 |
| **Viber Bot** | 1.5 |
| **Microsoft Teams** (Workflows + Adaptive Cards) | 2 |

### Deliberately deferred / declined
Apple Business Connect (L — revisit for franchise segment), Nextdoor (partner), Apple Messages for
Business (XL), Booking.com/OpenTable (XL), Amazon SP-API Solicitations (M — only with a commerce
module), G2/Capterra (commercially gated), Odysee/Rumble (XL), SoundCloud (blocked), and everything in
§5's graveyard.

### Totals
Waves 0–4 ≈ **50–55 engineer-weeks** ≈ 2 engineers for ~6 months, covering roughly **28 first-class
integrations plus ~20 assisted-publish surfaces**. That is a coverage claim no SMB competitor in
`04-competitors-smb.md` can match, built almost entirely on free, self-serve APIs.

---

## 20. Verification backlog

**Nothing in this document was fetched. Run this before anything here becomes load-bearing.**
Ordered by how much build each unblocks.

| # | Question | Where to look |
|---|---|---|
| 1 | **Are GBP reviews + localPosts still on `mybusiness.googleapis.com/v4`?** Current quota defaults and the access-request form URL. | `developers.google.com/my-business` (all sub-APIs), Google Cloud console API library |
| 2 | **Reddit commercial Data API terms and current price** ($/1k calls), current QPM. | `redditinc.com/policies/data-api-terms`, `support.reddithelp.com` developer platform docs, `reddit.com/dev/api` |
| 3 | **Does a WhatsApp Channels API exist in 2026?** Also current per-message rate card. | `developers.facebook.com/docs/whatsapp`, WhatsApp pricing page |
| 4 | **Kick API** — full endpoint list, scopes, rate limits, whether app creation is still self-serve. | `docs.kick.com` |
| 5 | **Trustpilot** plan → API entitlement mapping and current pricing; token TTL. | `developers.trustpilot.com`, `business.trustpilot.com/plans` |
| 6 | **Yelp Fusion** current free-tier call allowance and paid tier prices. | `docs.developer.yelp.com`, Yelp Fusion pricing |
| 7 | **Google Play** review window (still 7 days?), reply char limit, GCS export bucket format. | `developers.google.com/android-publisher`, Play Console help |
| 8 | **App Store Connect** hourly rate limit, review response max length, Analytics Reports API shape. | `developer.apple.com/documentation/appstoreconnectapi` |
| 9 | **Apple Business Connect API** — host, auth, Showcases resource, eligibility. | `developer.apple.com/business-connect` |
| 10 | **Bluesky** current rate-limit points table; OAuth (DPoP) client-metadata requirements; video limits. | `docs.bsky.app`, `atproto.com/specs/oauth` |
| 11 | **Mastodon 4.x** granular scopes, `scheduled_at` minimum, default rate limits per endpoint. | `docs.joinmastodon.org/methods/statuses`, `/api/rate-limits` |
| 12 | **Dribbble v2** — is `POST /v2/shots` available to new apps? | `developer.dribbble.com` |
| 13 | **Vimeo** rate limits, whether upload/analytics scopes need approval, plan gating. | `developer.vimeo.com/api/guides` |
| 14 | **Wix Blog v3** — does it accept HTML, or is Ricos mandatory? Scheduling endpoint. | `dev.wix.com/api/rest/wix-blog` |
| 15 | **Shopify** current API version, whether REST article endpoints are removed, GraphQL cost limits. | `shopify.dev/docs/api/admin-graphql`, release notes |
| 16 | **Webflow v2** rate limits per plan; asset upload flow. | `developers.webflow.com` |
| 17 | **Teams** — final retirement state of O365 connectors; Graph `ChannelMessage.Send` gating. | `learn.microsoft.com/graph`, M365 message center posts |
| 18 | **Slack** — current `conversations.history` restrictions for non-Marketplace apps. | `api.slack.com/changelog`, `api.slack.com/methods` |
| 19 | **Nextdoor** — does a partner organic-posting API exist and what are the terms? | `developer.nextdoor.com`, partner contact |
| 20 | **Telegram** Business Account bot capabilities (`business_connection`) — full method list. | `core.telegram.org/bots/api` changelog |
| 21 | **Tumblr** current per-key and per-user limits; whether NPF is required for new post types. | `tumblr.com/docs/en/api/v2` |
| 22 | **Flickr** commercial API key process and current terms. | `flickr.com/services/api`, Flickr API ToS |
| 23 | **SoundCloud** — has the app registration form reopened? | `developers.soundcloud.com` |
| 24 | **Apple Podcasts Connect API** — analytics endpoints, delegated delivery eligibility. | `developer.apple.com/documentation/applepodcastsconnectapi` |
| 25 | **Rumble** — any documented partner upload API. | `rumble.com`, partner contact |
| 26 | **DataForSEO / Rainforest / Bright Data** review-endpoint pricing, for the aggregator add-on business case. | vendor pricing pages |

**Method note for whoever runs this:** each item above is one `WebFetch` of a primary source. The
entire backlog is ~30 fetches and would take under an hour in a session with working egress. Re-run
items 1–8 quarterly thereafter; they are the ones that move.

---

## Appendix A — One-line verdict per platform

| Platform | Verdict |
|---|---|
| Reddit | **Build (M)** — with flair + post_requirements + removal detection, or don't bother |
| Snapchat | **Ads-only (M)**; organic impossible — reminder |
| Telegram | **Build first (S)** — best value/effort ratio in the document |
| WhatsApp Cloud API | **Build in messaging module (L)**; Status/Channels impossible |
| Bluesky | **Build (M)** — free, open, firehose is a listening asset |
| Mastodon/Fediverse | **Build (L)** — unlocks 5+ platforms; nobody does this well |
| Discord | **Build webhook (S)**, bot later |
| Twitch | **Build (M)** for go-live automation |
| Tumblr | **Build (M)** |
| Nextdoor | **Partner or reminder** |
| Truth Social / Gettr / Lemon8 | **Reminder only** |
| Vimeo | **Build (M)** |
| SoundCloud | **Blocked — no new API keys** |
| Spotify for Podcasters | **RSS-first; no publish API** |
| Apple Podcasts | **Defer (L)** |
| Rumble / Odysee | **Skip (XL)** |
| Kick | **Build (M)** — verify docs first |
| Substack | **RSS read only** |
| Medium | **Dead — RSS read only** |
| Ghost | **Build (S–M)** — newsletter send is a differentiator |
| Dev.to / Hashnode | **Build both (S each)** |
| WordPress | **Build both paths (M)** — largest installed base |
| Shopify blog | **Build (M)** + App Store review calendar |
| Wix | **Build (M–L)** — Ricos conversion is the cost |
| Squarespace | **No content API — reminder only** |
| Webflow | **Build (M)** + reusable field-mapping engine |
| Behance / 500px / SlideShare / Goodreads / Quora | **Dead or no API — reminder/RSS** |
| Dribbble | **Read-only at best — verify** |
| Flickr | **Build (M)** if photography customers matter; commercial key needed |
| **Google Business Profile** | **Build first, request access day 1 (L)** |
| Apple Business Connect | **Differentiator (L)** — defer to franchise wave |
| Yelp / TripAdvisor | **Build (S each)** — monitoring only, be honest about caps |
| Trustpilot | **Build (M)** — best review API available |
| G2 / Capterra | **Gated — customer-credentialed, later** |
| Booking.com / OpenTable / Zomato | **Skip** |
| Amazon | **SP-API Solicitations (M) only; no review read** |
| App Store / Google Play | **Build both (M each)** — full read + reply |
| Glassdoor / Indeed / Healthgrades / Zillow / Angi / BBB | **No API — not supported** |
| Facebook Recommendations | **Build (S)** — rides tier-1 |
| Google Business Messages | **DEAD (July 2024)** |
| Apple Messages for Business | **XL — via MSP only, defer** |
| RCS | **L via CPaaS** |
| Viber | **M — regional value** |
| Signal | **Not feasible, full stop** |
| Slack / Teams | **Build (S–M / M–L)** — distribution + alerting |

---

*End of document. Every number herein is unfetched model knowledge as of a May 2026 cutoff; §20 is the
plan to replace it with facts.*

