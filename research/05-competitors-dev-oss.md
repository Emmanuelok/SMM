# 05 — The Developer / API-First / Open-Source Layer of the SMM Market

**Author:** Research agent
**Date compiled:** 2026-08-12
**Status:** Permanent reference deliverable
**Companion docs:** `01-vista-social-full-audit.md`, `02-vista-social-deep-modules.md`, `04-competitors-smb.md`

---

## 0. How to read this document (verification legend)

This session ran under a **restricted network egress policy**. Only `github.com` and
`raw.githubusercontent.com` were reachable. Vendor marketing sites, vendor docs sites, and
every first-party platform developer portal (`developers.facebook.com`, `docs.x.com`,
`developers.tiktok.com`, `developers.google.com`, `developers.pinterest.com`,
`www.ayrshare.com`, `mixpost.app`, etc.) returned `EGRESS_BLOCKED`. The WebSearch budget for
the session was already exhausted (200/200) before this task began.

Consequently every claim below carries an explicit provenance tag. **Do not treat tags
interchangeably.**

| Tag | Meaning |
|---|---|
| `[V]` **VERIFIED** | Fetched and read from primary source during this session (2026-08-12). Source URL given. Highest confidence. |
| `[K]` **KNOWLEDGE** | From model training data, cutoff **May 2026**. Directionally reliable for structure and process; **treat all specific dollar figures and quota numbers as stale-by-default** and re-verify before acting. |
| `[U]` **UNVERIFIED** | Could not confirm in this session and not confidently held in knowledge. Stated as an open question, not a fact. |

**Critical caveat on pricing.** Every price in this document that is not tagged `[V]` must be
re-checked against the live pricing page before it enters a business model, a board deck, or a
build/buy decision. Social API vendor pricing changed at least twice in 2024–2025 across most
of this cohort. Where I give a number from `[K]`, I give it as "last known" with the
approximate date I last saw it.

**What `[V]` bought us.** The GitHub-only constraint turned out to be unusually productive for
this specific question. The open-source layer *is* the ground truth: Postiz's provider source
code is a working, production, 34-network implementation whose concurrency caps, retry logic,
API versions, and error-code mappings encode years of empirical knowledge about how each
network's API actually behaves under load. That is better evidence about real-world reliability
than any vendor's marketing page. Roughly 40% of this document is derived from reading that
source directly.

---

## 1. Executive summary — the fourteen things that actually matter

1. **The go-to-market blocker is real, and it is App Review, not engineering.** Building the
   posting integrations for 10 networks is perhaps 8–14 engineer-weeks. Getting *production*
   (advanced/audited/standard) access to those same 10 networks is **4–9 months of elapsed
   calendar time**, gated on artifacts you cannot build until the product already exists
   (screencasts of live flows, public privacy policy on a verified domain, a verified legal
   business entity, a verified LinkedIn company page, a compliance-shaped UI). Sequence this
   first or the product ships into a wall.

2. **There is no permissively-licensed, many-network, open-source publishing core.** This is the
   single largest structural gap in the OSS layer. Postiz is **AGPL-3.0** `[V]` with 34
   providers — you cannot fork it into a closed SaaS without releasing your source. Mixpost Lite
   is **MIT** `[V]` but ships only **four** networks — Twitter, Facebook Page, Facebook Group,
   Mastodon `[V]`. The permissive-and-complete quadrant is empty.

3. **The "unbundlers" have converged on a shared-app model, and X just broke it.** Ayrshare's
   own SDK README states that as of **March 31, 2026**, X/Twitter requires **bring-your-own
   OAuth 1.0a consumer keys**, injected as headers on every X-bound request `[V]`. This is the
   first crack in the "one API key, all networks" value proposition, and it will spread. Any
   business model that assumes a vendor can permanently amortize one X app across thousands of
   customers is now unsound.

4. **BYO-app is the default for self-hosted OSS; shared-app is the default for API vendors.**
   Postiz's `.env.example` requires the operator to register their *own* developer app for every
   single network — `X_API_KEY`, `LINKEDIN_CLIENT_ID`, `TIKTOK_CLIENT_ID`, `PINTEREST_CLIENT_ID`,
   and 10 more `[V]`. This means self-hosting Postiz does **not** avoid App Review; it *transfers
   the entire App Review burden to the self-hoster*, who is far less likely to survive it. That
   is a large and under-appreciated commercial opening.

5. **TikTok is the hardest gate and the most mechanically specific.** Unaudited TikTok clients
   are restricted to **private-visibility posts, private accounts only, and 5 users per 24
   hours** `[V, Postiz docs]`. The Postiz TikTok provider carries the literal error strings
   `"App not approved for public posting, contact support"` and `"Unaudited client can only post
   to private accounts"` `[V]`. Passing the audit is a **UI compliance** exercise, not an API
   exercise — you must render creator info, a privacy selector, and disclosure toggles for
   branded content / AI-generated content before TikTok will approve you.

6. **LinkedIn's token-refresh trap silently kills products.** Postiz's own LinkedIn setup doc
   warns: *"It is important to request the Advertising API permissions and fill up the request
   form, or you will not have the ability to refresh your tokens"* `[V]`. Without Marketing
   Developer Platform approval, LinkedIn access tokens expire at ~60 days with **no refresh
   path** — every customer must manually re-authenticate every two months, forever. This is the
   #1 source of "my scheduled posts stopped working" churn in LinkedIn-heavy SMM tools.

7. **YouTube's default quota permits roughly six uploads per day, total, per project.** Data API
   v3 default is 10,000 units/day and `videos.insert` costs 1,600 units `[K]` — 6.25 uploads.
   Quota extension requires a compliance audit. Postiz's source contains the comment `"YouTube
   has strict upload quotas"` and the user-facing string `"You have reached your daily upload
   limit, please try again tomorrow."` `[V]`.

8. **Instagram caps at 25 published posts per rolling 24 hours per account.** Verified from
   Postiz's error-code mapping: Meta error `2207042` → `"You have reached the maximum of 25 posts
   per day"` `[V]`. Also mapped: `2207001` spam detection, `2207051` request blocked, `36001`
   resolution limit `[V]`. Any product promising "post 40× a day to IG" is lying or shadow-banned.

9. **Concurrency ceilings differ by two-and-a-half orders of magnitude across networks.** From
   Postiz's `maxConcurrentJob` overrides — a direct encoding of hard-won operational
   knowledge `[V]`: Reddit **1**, Threads **2**, Bluesky **2**, Pinterest **3**, Telegram **3**,
   Google Business **3**, X **10**, YouTube **200**, Facebook **500**. Base class default is
   **1**. Your job scheduler must be per-network, not global. Most naive implementations use one
   global worker pool and get rate-limited into oblivion.

10. **The automation layer has a gaping hole exactly where the money is.** n8n's `nodes-base`
    package manifest ships Twitter, LinkedIn, Facebook Graph, Reddit, Discord, Telegram, Slack,
    Medium, Ghost, WordPress, YouTube, Mastodon — and **no Instagram, no TikTok, no Pinterest, no
    Threads, no Bluesky nodes** `[V]`. This is precisely why Blotato and Upload-Post exist and
    why both ship official n8n nodes. The automation-native SMM buyer is currently underserved by
    the automation platforms themselves.

11. **Publishing and listening are entirely disjoint markets today.** The publishers (Ayrshare,
    Blotato, Upload-Post, Late) do first-party OAuth writes. The data providers (Phyllo/InsightIQ,
    ScrapeCreators, EnsembleData, Apify, Bright Data) do third-party reads. **No vendor credibly
    does both.** A product that unifies permissioned first-party publish+analytics with
    third-party competitive data behind one contract has no direct incumbent.

12. **Snapchat organic publishing is effectively unavailable, and TikTok Research API is closed
    to commercial vendors.** `[K]` Snapchat's Marketing API is an *ads* API; there is no
    general-purpose organic Story/Spotlight publishing API for third-party SMM tools. TikTok's
    Research API is restricted to accredited non-commercial academic researchers. Treat both as
    permanent gaps, not as backlog items.

13. **Idempotency is unsolved industry-wide except by one vendor.** Only Upload-Post documents an
    `Idempotency-Key` that "collapses two uploads carrying the same key within a 24-hour window
    into a single post" `[V]`. Postiz instead defends with an 8-minute activity timeout to avoid
    duplicate posts `[V]`. Duplicate-post-on-retry is the most common and most reputationally
    damaging failure mode in this category and almost nobody has a first-class answer.

14. **Computer-use agents are the emerging fallback for API-less surfaces.** Bytebot
    (**Apache-2.0**, 11.1k stars, containerized Ubuntu 22.04 + XFCE desktop, NestJS agent,
    Next.js UI, REST APIs) `[V]` is the leading OSS instance. This is the only credible technical
    path to Snapchat organic, Instagram DMs at scale, or TikTok analytics beyond what the API
    exposes — at the cost of a direct and unambiguous ToS violation on every network involved.

---

## 2. Market map — how this layer is structured

The "developer / API-first / OSS" layer is not one market. It is **five** markets that get
confused with each other because they all say "social media API." They have different buyers,
different unit economics, and different legal risk profiles.

```
                    ┌───────────────────────────────────────────────┐
                    │  FIRST-PARTY PLATFORM APIs (the substrate)    │
                    │  Meta Graph · X · LinkedIn · TikTok · YouTube │
                    │  Pinterest · Reddit · Threads · Snap · GBP     │
                    │  ── gated by App Review, quotas, partner pgms ─│
                    └───────────────────────────────────────────────┘
                          ▲                              ▲
        ┌─────────────────┘                              └──────────────────┐
        │                                                                    │
┌───────┴──────────────────┐  ┌──────────────────────┐  ┌──────────────────┴────┐
│ (A) OSS PUBLISHING CORES │  │ (B) API-FIRST        │  │ (C) PERMISSIONED      │
│                          │  │     PUBLISHERS       │  │     CREATOR DATA      │
│ Postiz (AGPL-3.0)        │  │ Ayrshare             │  │ Phyllo / InsightIQ    │
│ Mixpost Lite (MIT)       │  │ Late (getlate.dev)   │  │                       │
│                          │  │ Blotato              │  │ user-consented OAuth  │
│ BYO-app model            │  │ Upload-Post          │  │ read-only analytics   │
│ you inherit App Review   │  │ Publer API           │  │ priced per connected  │
│                          │  │ Social Champ API     │  │ account/month         │
│                          │  │ Buffer API (legacy)  │  │                       │
│                          │  │ Hootsuite API        │  │                       │
│                          │  │ shared-app model     │  │                       │
│                          │  │ they ate App Review  │  │                       │
└──────────────────────────┘  └──────────────────────┘  └───────────────────────┘

┌──────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ (D) AGENT / AUTOMATION PLUMBING  │  │ (E) THIRD-PARTY DATA / SCRAPING          │
│                                  │  │                                          │
│ Zapier · Make · n8n              │  │ Apify (actor marketplace)                │
│ Composio (MIT, 1000+ toolkits)   │  │ Bright Data (proxies + datasets)         │
│ Pipedream (2,400+ components)    │  │ ScrapeCreators (11 platforms + ad libs)  │
│ Unified.to (multi-vertical)      │  │ EnsembleData (TikTok/IG/YT, unit-priced) │
│ Bytebot (Apache-2.0 computer-use)│  │ RapidAPI marketplace (unofficial)        │
│                                  │  │                                          │
│ no network access of their own — │  │ NO platform permission. ToS risk is the  │
│ they orchestrate (A)/(B)/(E)     │  │ product. Legally contested.              │
└──────────────────────────────────┘  └──────────────────────────────────────────┘
```

**Where the defensibility lives:** not in (A) — the code is public. Not in (D) — those are
distribution channels, not moats. Not in (E) — commoditized and legally fragile. It lives in
**(B)**, and specifically in the *accumulated, non-transferable asset of approved platform
apps*: an audited TikTok client, a LinkedIn MDP grant, Meta Advanced Access with a completed
Data Protection Assessment, a YouTube quota extension. Those take months, cannot be bought, and
cannot be forked from GitHub. **That is the moat in this business.**

---

## 3. Cohort at a glance

| Vendor / Project | Category | Networks | Auth model | License / Model | Verified this session |
|---|---|---|---|---|---|
| **Postiz** | (A) OSS core | **34 providers** `[V]` | **BYO app** per network `[V]` | **AGPL-3.0** `[V]` | ✅ source + docs read |
| **Mixpost Lite** | (A) OSS core | **4** (X, FB Page, FB Group, Mastodon) `[V]` | BYO app | **MIT** `[V]`, Pro is commercial | ✅ config + README |
| **Ayrshare** | (B) publisher | 13+ `[V]` | Shared app; **X BYO from 2026-03-31** `[V]` | Closed SaaS | ✅ SDK README + MCP plugin |
| **Late (getlate.dev)** | (B) publisher | ~10 `[U]` | Shared app `[U]` | Closed SaaS | ❌ site blocked |
| **Blotato** | (B) publisher | **9 + webhook** `[V]` | API key header `blotato-api-key` `[V]` | Closed SaaS | ✅ via Pipedream component |
| **Upload-Post** | (B) publisher | **23** `[V]` | API key + **JWT white-label** `[V]` | Closed SaaS; **MIT SDKs** `[V]` | ✅ SDK + n8n node README |
| **Publer API** | (B) publisher | ~12 `[K]` | Bearer + workspace ID `[K]` | Closed, paid tier gate | ❌ |
| **Social Champ API** | (B) publisher | ~10 `[K]` | API key `[K]` | Closed, higher-tier gate | ❌ |
| **Buffer API** | (B) publisher | legacy | OAuth2 `[K]` | **Effectively closed to new apps** `[K]` | ❌ |
| **Hootsuite API** | (B) publisher | ~8 `[K]` | OAuth2 `[K]` | Extends Hootsuite, not white-label | ❌ |
| **Phyllo / InsightIQ** | (C) creator data | 10–20 work platforms `[K]` | User-consented OAuth via Connect SDK `[V, SDK repos]` | Closed SaaS, per-connected-account | ⚠️ orgs confirmed only |
| **Zapier / Make** | (D) automation | varies `[K]` | per-connector OAuth | Closed | ❌ |
| **n8n** | (D) automation | **12 social nodes; no IG/TikTok/Pinterest/Threads/Bluesky** `[V]` | per-node credentials `[V]` | Sustainable Use License `[K]` | ✅ package manifest |
| **Composio** | (D) agent tooling | 1000+ toolkits `[V]` | Managed auth + MCP `[V]` | **MIT**, 29.6k ★ `[V]` | ✅ repo |
| **Unified.to** | (D) unified API | **no social publishing vertical** `[V]` | JWT API key `[V]` | Closed SaaS | ✅ SDK README |
| **Pipedream** | (D) automation | **2,400+ components**, incl. Blotato + Ayrshare `[V]` | per-app OAuth/key | Closed platform, OSS components | ✅ repo tree |
| **Bytebot** | (D) computer-use | any UI | n/a (drives a desktop) | **Apache-2.0**, 11.1k ★ `[V]` | ✅ repo |
| **Lomi** | (D)? | — | — | — | ❌ **could not identify** — see §8.6 |
| **Apify** | (E) scraping | ~10 via actors `[K]` | API token | Marketplace; SDK Apache-2.0 `[K]` | ❌ actor repos 404 |
| **Bright Data** | (E) scraping | ~8 datasets `[K]` | API token | Closed, dataset licensing | ❌ |
| **ScrapeCreators** | (E) scraping | **11 + Meta/Google/LinkedIn ad libraries** `[V]` | `SCRAPECREATORS_API_KEY=sk_...` `[V]` | Closed; **OSS agent skills, 1,393 ★** `[V]` | ✅ org + skills README |
| **EnsembleData** | (E) scraping | TikTok, IG, YouTube `[V]` | Token, **`units_charged`** credit model `[V]` | Closed; **MIT SDKs** `[V]` | ✅ SDK README |
| **RapidAPI** | (E) marketplace | many unofficial `[K]` | RapidAPI key | Marketplace | ❌ |

---

## 4. Part A — The open-source publishing cores

### 4.1 Postiz — the reference implementation of this entire category

**Repository:** `github.com/gitroomhq/postiz-app` · **License: AGPL-3.0** `[V]` · 34.5k ★,
6.5k forks, 2,800+ commits, 158 open issues, 87 open PRs `[V]` · Copyright "Postiz - Social
media schedule tool, Copyright (C) 2025 Nevo David" `[V]`

**Stack** `[V]`: Next.js frontend · NestJS backend · Prisma + PostgreSQL · **Temporal** for
durable workflow orchestration · Resend for email · pnpm workspaces monorepo.

The Temporal choice is the most interesting architectural decision in the project and is worth
understanding before you design your own. Social publishing is a long-running, partially-failing,
externally-rate-limited workflow with multi-minute async media processing on the platform side.
Temporal gives durable execution and retry semantics across process restarts. Postiz's error
classes explicitly truncate payloads to stay under **Temporal's 4 MB gRPC frame limit** `[V]` —
a real operational detail you would otherwise learn the hard way.

#### 4.1.1 Registered providers — the full list

From `libraries/nestjs-libraries/src/integrations/integration.manager.ts`, the
`socialIntegrationList` array, **in source order** `[V]`:

| # | Provider | # | Provider | # | Provider |
|---|---|---|---|---|---|
| 1 | XProvider | 13 | DribbbleProvider | 25 | MediumProvider |
| 2 | LinkedinProvider | 14 | DiscordProvider | 26 | DevToProvider |
| 3 | LinkedinPageProvider | 15 | SlackProvider | 27 | HashnodeProvider |
| 4 | RedditProvider | 16 | KickProvider | 28 | WordpressProvider |
| 5 | InstagramProvider | 17 | TwitchProvider | 29 | ListmonkProvider |
| 6 | InstagramStandaloneProvider | 18 | MastodonProvider | 30 | MoltbookProvider |
| 7 | FacebookProvider | 19 | BlueskyProvider | 31 | WhopProvider |
| 8 | ThreadsProvider | 20 | LemmyProvider | 32 | SkoolProvider |
| 9 | YoutubeProvider | 21 | FarcasterProvider | 33 | MeweProvider |
| 10 | GmbProvider | 22 | TelegramProvider | 34 | TumblrProvider |
| 11 | TiktokProvider | 23 | NostrProvider | — | *(MastodonCustomProvider — commented out)* `[V]` |
| 12 | PinterestProvider | 24 | VkProvider | | |

Additional files present in the `social/` directory but not in the registry:
`mastodon.custom.provider.ts`, `hashnode.tags.ts`, `social.integrations.interface.ts` `[V]`.

**Read the composition, not just the count.** Only ~12 of the 34 are the networks that
actually matter commercially (X, LinkedIn ×2, Instagram ×2, Facebook, Threads, YouTube, GBP,
TikTok, Pinterest, Reddit). The other 22 are cheap wins — Mastodon, Bluesky, Nostr, Lemmy,
Farcaster, Telegram, Discord, Slack need **no App Review at all**, and Medium/Dev.to/Hashnode/
WordPress/Listmonk are blog/newsletter targets with trivial token auth. "34 integrations" as a
marketing claim is mostly composed of the free ones. Budget your engineering accordingly: the
first 12 are ~90% of the work and 100% of the review burden.

#### 4.1.2 The provider abstraction

`social.integrations.interface.ts` defines `[V]`:

- **`IAuthenticator`** — `authenticate()`, `refreshToken()`, `generateAuthUrl()`, plus optional
  analytics and profile-management hooks.
- **`ISocialMediaIntegration`** — `post()`, `postPending()` (schedule-with-polling), `comment()`.
- **`SocialProvider`** — the union of both, adding content validation, post-status checking, and
  per-provider custom field definitions.

Key types `[V]`:
- `AuthTokenDetails` — access token, refresh token, expiry, optional profile data.
- `PostResponse` — post id, platform URL, status.
- **`PendingCheckResponse` — three states: `pending` (still processing), `ready` (needs
  finalization), `completed`.**
- `PostDetails`, `MediaContent` — text, images, video, poll questions.

**The three-state pending model is the single most important design lesson in this codebase.**
Instagram, TikTok, Pinterest, Bluesky, LinkedIn video, Facebook video, and YouTube all use an
asynchronous *container/job* pattern: you create a media container, the platform transcodes for
seconds-to-minutes, then you issue a separate publish call against the container id. A naive
synchronous `post()` API cannot model this and will either block a worker for 9 minutes or
report success before the post exists. Postiz splits it into `postPending()` → `checkPostStatus()`
→ `finalizePost()`. **Copy this shape.** Ayrshare, Blotato, and Upload-Post all expose the same
underlying reality through async job IDs and status endpoints.

#### 4.1.3 The base class — retry, rate limits, error taxonomy

From `social.abstract.ts` `[V]`:

- **`maxConcurrentJob = 1`** — the conservative default; providers override upward.
- **Error classes:**
  - `RefreshToken extends ApplicationFailure` — token expired; triggers re-auth. Truncates
    identifier/response/body for the Temporal 4 MB limit.
  - `BadBody extends ApplicationFailure` — malformed response / failed request. Same truncation.
  - `NotEnoughScopes` — insufficient OAuth permissions granted at connect time.
- **Rate-limit handling in `fetch()`:** detects HTTP **429** *or* a response body containing
  `"rate_limit_exceeded"` or `"Rate limit"`; waits `timer(5000)`; **max 3 retries** then throws
  `BadBody`. HTTP 500 and provider-classified `'retry'` errors take the same path.
- `runStreamedUpload()` applies identical logic for streamed media uploads.

Note the string-matching on response *bodies* — several networks return 200 with an error
envelope rather than a 429 status. That is a detail you only learn in production.

#### 4.1.4 Per-network concurrency ceilings — the operational cheat sheet

`maxConcurrentJob` overrides observed across providers `[V]`. This table is, in my judgment,
the most immediately actionable artifact in this entire document.

| Network | `maxConcurrentJob` | In-source rationale (verbatim where quoted) |
|---|---|---|
| **Reddit** | **1** | `// Reddit has strict rate limits (1 request per second)` |
| *(base default)* | **1** | conservative default for unlisted providers |
| **Threads** | **2** | `// Threads has moderate rate limits` |
| **Bluesky** | **2** | `// moderate rate constraints` |
| **Pinterest** | **3** | `// Pinterest has more lenient rate limits` |
| **Telegram** | **3** | moderate |
| **Google Business Profile** | **3** | `RESOURCE_EXHAUSTED` → "Rate limit exceeded. Please try again later." |
| **X** | **10** | politeness under the "300 posts / 3 hours" per-user limit |
| **YouTube** | **200** | `// YouTube has strict upload quotas` — high concurrency, quota-bound not rate-bound |
| **Facebook** | **500** | highest; Graph API tolerates parallelism well |

**Design consequence.** A single global job queue is architecturally wrong for this product
category. You need **per-network token buckets**, and for Meta properties you additionally need
**per-account** buckets because the binding constraint (25 IG posts/24h) is per-account, not
per-app. Reddit at concurrency 1 with an additional `timer(5000)` between subreddit submissions
`[V]` means a customer cross-posting to 20 subreddits takes 100+ seconds minimum — that must be
surfaced in your UI as an expectation, not experienced as a hang.

#### 4.1.5 Per-network implementation detail (all `[V]`, read from source)

**TikTok** — `tiktok.provider.ts`

- Scopes: `video.list`, `user.info.basic`, `video.publish`, `video.upload`, `user.info.profile`,
  `user.info.stats`
- Endpoints:
  - `https://www.tiktok.com/v2/auth/authorize/` (authorize)
  - `https://open.tiktokapis.com/v2/oauth/token/` (token + refresh)
  - `https://open.tiktokapis.com/v2/user/info/`
  - `https://open.tiktokapis.com/v2/post/publish/creator_info/query/` — max video duration lookup
  - `https://open.tiktokapis.com/v2/post/publish/content/init/`
  - `https://open.tiktokapis.com/v2/post/publish/video/init/`
  - `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`
  - `https://open.tiktokapis.com/v2/post/publish/status/fetch/` — status polling
  - `https://open.tiktokapis.com/v2/video/list/`, `.../v2/video/query/`
- **Chunking:** `"a chunk must be between 5MB and 64MB"`; single-chunk threshold 64 MB;
  multi-chunk at 10 MB; streaming with byte-range requests for remote URLs.
- **Polling:** ~27 iterations × 20 s ≈ **9 minutes**; 8-minute activity timeout guard against
  duplicate posts.
- **Audit strings:** `"App not approved for public posting, contact support"`,
  `"Unaudited client can only post to private accounts"`,
  `"TikTok API rate limit exceeded, please try again later"`.
- **UPLOAD vs DIRECT_POST:** in UPLOAD (inbox/draft) mode, AI-disclosure, duet, stitch, comment,
  music, and branding toggles are **silently discarded** — they require DIRECT_POST.

**Instagram (Facebook-linked)** — `instagram.provider.ts`

- Scopes: `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`,
  `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`
- OAuth: `https://www.facebook.com/v20.0/dialog/oauth` → `https://graph.facebook.com/v20.0/oauth/access_token`
- Discovery: `/v20.0/me/permissions`, `/me/accounts`, `/me/businesses`,
  `/{business.id}/owned_pages`, `/{business.id}/client_pages`
- Publish: `POST /v20.0/{id}/media` → `GET /v20.0/{containerId}` (poll to `READY`) →
  `POST /v20.0/{igId}/media_publish` with `creation_id`. Carousels need an intermediate carousel
  container; Stories publish individually.
- Insights on **v21.0**; audio search on **v22.0** (`/v22.0/ig_audio`) — note the **mixed API
  versions in one provider**, a maintenance smell you will also inherit.
- **Error map:** `2207042` → "maximum of 25 posts per day"; `"Page request limit reached"` →
  "Page posting for today is limited"; `2207082` → retryable "Could not upload your media";
  `2207001` → "Instagram detected that your post is spam"; `2207051` → "Instagram blocked your
  request"; `36001` → "Invalid Instagram image resolution max: 1920x1080px".

**Instagram (standalone / Instagram Login)** — `instagram.standalone.provider.ts`

- Scopes: `instagram_business_basic`, `instagram_business_content_publish`,
  `instagram_business_manage_comments`, `instagram_business_manage_insights`
- Auth: `https://www.instagram.com/oauth/authorize` with **`enable_fb_login=0`** →
  `https://api.instagram.com/oauth/access_token`; API base `https://graph.instagram.com/v21.0/`
- Refresh via `ig_refresh_token` grant; token expiry set to **58 days**.
- Uses `https://redirectmeto.com/${FRONTEND_URL}` as an HTTPS-fallback redirect for non-HTTPS
  local frontends.

**This dual-path Instagram support is strategically important.** The standalone "Instagram API
with Instagram Login" path removes the Facebook Page linkage requirement, which is the single
biggest onboarding drop-off in Instagram SMM tools. Supporting both paths is table stakes now.

**Facebook** — `facebook.provider.ts`

- Scopes: `pages_show_list`, `business_management`, `pages_manage_posts`,
  `pages_manage_engagement`, `pages_read_engagement`, `read_insights`
- v20.0 for auth + page ops: `me/accounts`, `me/businesses`, `{businessId}/owned_pages`,
  `{businessId}/client_pages`, `{pageId}/photos`, `{pageId}/feed`, `{pageId}/video_stories`,
  `{pageId}/photo_stories`, `{pageId}/videos`, `{postId}/comments`
- **v23.0 for insights** — page metrics `page_total_media_view_unique`, `page_media_view`,
  `page_post_engagements`, `page_daily_follows`; post metrics `post_total_media_view_unique`,
  `post_reactions_by_type_total`, `post_clicks`
- Video/Reels: `POST {pageId}/videos` with `file_url` + `published:true`; stories use
  `?upload_phase=start` → upload → `?upload_phase=finish`; poll `GET {videoId}?fields=status`
  for `upload_complete` / `ready`
- **Error map:** `1366046` (≤4 MB, JPG/PNG), `1390008` ("You are posting too fast, please slow
  down"), `1404112` (account limited for security "for a few days"), `490` (token expired)

**LinkedIn** — `linkedin.provider.ts`

- Scopes: `openid`, `profile`, `w_member_social`, `r_basicprofile`, `rw_organization_admin`,
  `w_organization_social`, `r_organization_social`
- `https://www.linkedin.com/oauth/v2/accessToken`; `/v2/me`, `/v2/userinfo`;
  `/v2/organizations?q=vanityName&vanityName={vanity}`
- Media: `POST /rest/{videos|images|documents}?action=initializeUpload` →
  **video uploaded in 2 MB parts, each PUT separately, ETags collected** →
  `POST /rest/videos?action=finalizeUpload`. Images/documents are single-shot PUT.
- Posts: `POST /rest/posts`; comments: `POST /rest/socialActions/{postId}/comments`
- Headers: **`LinkedIn-Version: 202601`** and `202306`; `X-Restli-Protocol-Version: 2.0.0`
- **Asymmetric polling permission:** *"videos can be polled by any token, images and documents
  only by organization tokens"* — personal tokens are **write-only** for image/document status,
  so the implementation falls back to fixed grace-period waits instead of polling.

**X** — `x.provider.ts`

- **OAuth 1.0a**, HMAC-SHA1, `authAccessType: 'write'`; `scopes = []` (OAuth1 has no scopes)
- `https://api.x.com/2/tweets`; media via
  `/2/media/upload/initialize` → `/2/media/upload/{id}/append` → `/2/media/upload/{id}/finalize`,
  status via `/2/media/upload` with `command: 'STATUS'`
- Articles: `/2/articles/draft` → `/2/articles/{id}/publish`; metrics `/2/tweets/{id}`
- **`X_UPLOAD_CHUNK_SIZE = 1024 * 1024`** with the comment *"1MB is the exact chunk size
  client.v2.uploadMedia used in production"*
- Images normalized to GIF or JPEG via **Sharp** before upload
- Retry: `if (totalRetries <= 2 && (err?.code === 429 || err?.rateLimitError))` →
  `timer(5000 * (totalRetries + 1))`
- `maxConcurrentJob = 10` "to maintain politeness during **300 posts / 3 hours** per-user limits"

**YouTube** — `youtube.provider.ts`

- Scopes: `userinfo.profile`, `userinfo.email`, `youtube`, `youtube.force-ssl`,
  `youtube.readonly`, `youtube.upload`, `youtubepartner`, `yt-analytics.readonly`
- Upload: `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable`,
  **8 MB chunks**, 4-minute batch timeout
- Comment: *"YouTube only creates the video resource when the final byte of the session is
  received"* — critical for status semantics
- Strings: `"YouTube has strict upload quotas"`, `"You have reached your daily upload limit,
  please try again tomorrow."`, `"Your account is not verified...we could not set the
  thumbnail."`, plus 429 handling

Note that **thumbnail setting requires a verified YouTube account** — an end-user-account
property your product cannot control, and a support-ticket generator.

**Pinterest** — `pinterest.provider.ts`

- Scopes: `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read`
- **All v5:** `/v5/oauth/token`, `/v5/user_account`, `/v5/boards?page_size=250`, `/v5/media`,
  `/v5/pins`, `/v5/pins/{postId}/analytics`, `/v5/user_account/analytics`;
  authorize at `https://www.pinterest.com/oauth/`
- Three-stage async video flow (`postPending` → `checkPostStatus` → `finalizePost`)
- Analytics window: last **90 days (89 used for a UTC safety margin)**

**Reddit** — `reddit.provider.ts`

- Scopes: `read`, `identity`, `submit`, `flair`
- `https://www.reddit.com/api/v1/access_token`, `/api/v1/authorize`;
  `https://oauth.reddit.com/api/v1/me`, `/api/media/asset`, `/api/submit`, `/api/comment`,
  `/user/{username}/submitted`, `/subreddits/search`, `/{subreddit}/about`,
  `/api/v1/{subreddit}/post_requirements`, `/{subreddit}/api/link_flair_v2`
- `maxConcurrentJob = 1`; legacy `timer(5000)` between subreddit submissions

The `post_requirements` and `link_flair_v2` calls are the interesting part: Reddit is the only
network where **per-destination validation rules are machine-readable**, and using them is the
difference between a 60% and a 95% success rate. Most competitors do not do this.

**Threads** — `threads.provider.ts`

- Scopes: `threads_basic`, `threads_content_publish`, `threads_manage_replies`,
  `threads_manage_insights`
- Base `https://graph.threads.net/v1.0/`; `oauth/authorize`, `oauth/access_token`, `/me`,
  `/{userId}/threads`, `/{userId}/threads_publish`, `/{id}/threads_insights`
- Container → `checkContainerStatus()` poll → `threads_publish` with `creation_id` → permalink

**Bluesky** — `bluesky.provider.ts`

- **App-password auth, not OAuth:** custom fields `identifier`, `password` (regex `/^.{3,}$/`),
  `service` (custom PDS, default `https://bsky.social`); `agent.login({identifier, password})`
- **SSRF protection:** `if (process.env.DISABLE_SSRF_PROTECTION !== 'true' && !(await
  isSafePublicHttpsUrl(body.service)))` — user-supplied PDS URLs must be public HTTPS
- Video: `https://video.bsky.app/xrpc/app.bsky.video.uploadVideo`, separate unauthenticated
  agent for job-status polling to avoid login rate-limit impact;
  `const maxAttempts = 18; // ~9 minutes at 30s interval`

The SSRF guard is a security detail worth copying verbatim — any product accepting a
user-supplied instance URL (Bluesky PDS, Mastodon instance, self-hosted WordPress, Listmonk)
has an SSRF hole unless it validates.

**Google Business Profile** — `gmb.provider.ts`

- Scopes: `userinfo.profile`, `userinfo.email`, **`https://www.googleapis.com/auth/business.manage`**
- **Four distinct API hosts:**
  - `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`
  - `https://mybusinessbusinessinformation.googleapis.com/v1/{accountName}/locations` and
    `/v1/{location.name}/media`
  - `https://mybusiness.googleapis.com/v4/{id}/localPosts` (POST) — **still v4**
  - `https://businessprofileperformance.googleapis.com/v1/{locationPath}:fetchMultiDailyMetricsTimeSeries`
- `RESOURCE_EXHAUSTED` → "Rate limit exceeded. Please try again later."
- **Post-level analytics deliberately unsupported** — the API is location-level only

**Telegram** — `telegram.provider.ts`

- **Bot token from `process.env.TELEGRAM_TOKEN`** (single shared bot, not per-user OAuth);
  chat ID is the account identifier; refresh token is empty string
- `getChat`, `getFileLink`, `getUpdates` (filtered to `message` + `channel_post`), `sendMessage`,
  `sendPhoto/Video/Document`, `sendMediaGroup`, `getMe`, `getChatMember`, `deleteMessage`
- **4,096 char limit**; **max 10 media per group**; `maxConcurrentJob = 3`

#### 4.1.6 Postiz: BYO-app is mandatory

`.env.example` requires operator-registered credentials for `[V]`: `X_API_KEY`/`X_API_SECRET`,
`LINKEDIN_CLIENT_ID`/`SECRET`, `REDDIT_CLIENT_ID`/`SECRET`, `GITHUB_CLIENT_ID`/`SECRET`,
`THREADS_APP_ID`/`SECRET`, `FACEBOOK_APP_ID`/`SECRET`, `YOUTUBE_CLIENT_ID`/`SECRET`,
`TIKTOK_CLIENT_ID`/`SECRET`, `PINTEREST_CLIENT_ID`/`SECRET`, `DRIBBBLE_CLIENT_ID`/`SECRET`,
`TUMBLR_CLIENT_ID`/`SECRET`, `DISCORD_CLIENT_ID`/`SECRET`, `MASTODON_CLIENT_ID`/`SECRET`,
`SLACK_ID`/`SLACK_SECRET`, plus `BEEHIIVE_API_KEY`, `LISTMONK_API_KEY`, `SLACK_SIGNING_SECRET`,
`POSTIZ_OAUTH_CLIENT_ID`/`SECRET`, and Stripe keys.

The README claims "there is no difference between the hosted version and the self-hosted
version" `[V]` and that Postiz "uses official OAuth flows, doesn't scrape content, and never
stores user API keys — users authenticate directly with social platforms" `[V]`.

**Read carefully: feature parity ≠ capability parity.** The hosted Postiz runs on Postiz's own
*approved* apps. The self-hoster gets identical code and **zero approvals**. A self-hosted
Postiz posting to TikTok is an unaudited client: private posts only, 5 users/24h `[V]`. That
gap between "the software works" and "the software is permitted to work" is the commercial
opportunity in this entire market.

#### 4.1.7 Postiz's own setup docs — a free map of the App Review maze

`github.com/gitroomhq/postiz-docs`, `providers/` directory `[V]` — 22 files: `bluesky`,
`discord`, `dribbble`, `facebook`, `farcaster`, `google-my-business`, `instagram`,
`linkedin-page`, `linkedin`, `mastodon`, `mewe`, `overview`, `pinterest`, `reddit`, `skool`,
`slack`, `telegram`, `threads`, `tiktok`, `whop`, `x-twitter`, `youtube`.

Highlights `[V]`:

- **TikTok:** register at `developers.tiktok.com/apps`; ToS + Privacy Policy on a public HTTPS
  domain you control; platform = Web; enable **Login Kit** and **Content Posting API with
  "Direct Post" enabled**; scopes `user.info.basic`, `video.create`, `video.publish`,
  `video.upload`, `user.info.profile`; client id is 16 chars, secret 32 chars. Media **must be
  publicly reachable over HTTPS** — "localhost or private routes will fail"; use a reverse proxy
  or CDN such as Cloudflare R2. **Unaudited: posts forced private, 5 users/24h, private accounts
  only.** Known issue: connection page may crash, retry in incognito.
- **X:** app permissions **"Read and Write"**, app type **"Native App"**. *"You must select
  `Native App` for OAuth 1.0a to work correctly. Selecting `Web App, Automated App or Bot` will
  cause authentication to fail with error code 32."* `DISABLE_X_ANALYTICS=true` exists for plans
  without analytics access.
- **LinkedIn:** *"It is important to request the Advertising API permissions and fill up the
  request form, or you will not have the ability to refresh your tokens."*
- **YouTube:** Google Cloud project; OAuth client (Web application); **enable YouTube Data API
  v3 + YouTube Analytics API + YouTube Reporting API**; register yourself as a test user. For
  **Brand Accounts** under Workspace, mark the app trusted in Admin settings and wait **"at
  least 5 hours"** for propagation.
- **Pinterest:** requires a **Pinterest Company Account**; create app at
  `developers.pinterest.com/apps/`, "complete all required fields and **await approval**."
- **Instagram:** Meta app inside a **business portfolio**, use case "Other" → Business. Two
  paths: Facebook-Business (needs linked FB Page, "Login for Business") or **Instagram
  Standalone** (professional IG account, no FB Page). If connection fails, add the IG account as
  an **"Instagram Tester"** role in the Meta app and accept from Instagram profile settings.

#### 4.1.8 Postiz: fork-or-learn assessment

| Question | Assessment |
|---|---|
| **Can we fork it into a closed commercial SaaS?** | **No.** AGPL-3.0 `[V]`. Network use triggers the source-disclosure obligation: a modified version offered over a network must "prominently offer all users interacting with it remotely… an opportunity to receive the Corresponding Source." Running an unmodified copy as a service is permitted but still AGPL; any modification you deploy must be published. |
| **Can we buy an exception?** | Copyright is held by a single entity ("Copyright (C) 2025 Nevo David") `[V]`, so a dual-license/commercial-exception deal is *structurally* possible. Whether it is offered or at what price: **`[U]`** — worth one email. |
| **Can we learn from it?** | **Yes, extensively, and this is the recommended use.** Reading AGPL source to understand *facts* — that Instagram caps at 25 posts/day, that LinkedIn video uploads in 2 MB parts, that TikTok chunks must be 5–64 MB, that Reddit tolerates 1 concurrent job — creates no derivative work. Facts and API behaviors are not copyrightable. Copy the *knowledge*, write your own code. |
| **Should we contribute?** | Only with a clear-eyed view that contributions are AGPL and strengthen a direct competitor's hosted offering. |
| **Is it a competitor?** | Yes — hosted Postiz competes directly at the SMB/prosumer tier, and its OSS presence sets a price anchor of $0 for the self-hosting segment. |

---

### 4.2 Mixpost — MIT-licensed, but only four networks in the free edition

**Repository:** `github.com/inovector/mixpost` · **License: MIT** `[V]` · 3.5k ★, 525 forks,
397 commits on main, 27 open issues `[V]` · Sponsored by Inovector · **Laravel/PHP** + Node/Vite
`[V]`

**The crucial finding — Mixpost Lite is far smaller than its marketing implies.** The README
speaks generically of "all social media platforms" and never enumerates them `[V]`. The source
does. `src/SocialProviders/` contains exactly three directories: **Mastodon, Meta, Twitter**
`[V]`. `config/mixpost.php` enumerates exactly four post targets `[V]`:

| Provider | Simultaneous posting | Char limit | Media limits |
|---|---|---|---|
| Twitter | disabled | 280 | 4 photos **or** 1 video **or** 1 GIF |
| Facebook Page | enabled | 5,000 | 10 photos **or** 1 video **or** 1 GIF |
| Facebook Group | enabled | 5,000 | 10 photos **or** 1 video **or** 1 GIF |
| Mastodon | enabled | 500 | 4 photos **or** 1 video **or** 1 GIF |

Also in config `[V]`: images ≤ **5 MB**, GIFs ≤ **15 MB**, videos ≤ **200 MB**; MIME allowlist
JPG/JPEG/GIF/PNG/MP4/M4V; default disk `public`; media mixing disabled on all platforms;
explicit FFMPEG/FFProbe paths for video thumbnail generation. **No client IDs/secrets in the
config file** — they come from environment, confirming BYO-app.

`src/Services/` contains `FacebookService.php`, `TwitterService.php`, plus `TenorService.php`
(GIFs) and `UnsplashService.php` (stock imagery) `[V]`.

**Lite vs Pro.** CONTRIBUTING states: *"This repository contains the Lite version of Mixpost
Pro, a commercial product"* and asks contributors to keep features "distinct" between versions
`[V]`. Pro/Enterprise are sold at `mixpost.app/pricing` — **blocked this session, pricing
`[U]`**. `[K]` (last seen ~2024–2025, **verify**): Mixpost Pro sold as a **one-time perpetual
license with a year of updates**, roughly $99 for Pro (single install) and several hundred for
Enterprise/unlimited — an unusual, deliberately anti-SaaS model. Pro adds Instagram, LinkedIn,
YouTube, Pinterest, TikTok and team/workspace features `[K/U]`.

**Fork-or-learn assessment.**

| Question | Assessment |
|---|---|
| **Can we fork Lite into a closed SaaS?** | **Yes — MIT permits it** `[V]`. Retain the copyright notice. This is the only permissively-licensed option in the cohort. |
| **Is it worth forking?** | **Marginal.** You would inherit 4 networks and a Laravel codebase, then build the 8 networks that actually matter yourself. If you are not already a Laravel shop, the fork provides little beyond a calendar UI and a media library. |
| **Is the Lite/Pro split a trap?** | Somewhat. Upstream has a structural incentive to keep valuable features out of Lite, so the OSS edition will drift further behind, not closer. Do not plan around upstream feature flow. |
| **Best use** | A reference for the *Laravel-idiomatic* structure and the per-provider config schema (char limits, media rules) — that config table is a good model for your own capability matrix. |

### 4.3 Other OSS worth knowing (brief)

`[K]`, not re-verified this session:

- **Socialhome / Friendica / diaspora\*** — federated networks, not schedulers. Irrelevant.
- **Mastodon-specific schedulers** (e.g. Fedistar, Sengi) — single-network, MIT/GPL. No leverage.
- **Zapier-alternative OSS** — Activepieces (MIT), Windmill (AGPL), n8n (Sustainable Use
  License). Activepieces is the only one with a permissive license *and* a social-piece library,
  and is worth a look as a distribution surface `[U — piece coverage not verified]`.
- **`socialscheduler` / `social-media-poster` style repos** — dozens exist, almost all are
  single-developer, <500 ★, and abandoned within 18 months. Not a supply chain to rely on.

**Bottom line for Part A:** the OSS layer gives you *knowledge* cheaply and *code* expensively.
The knowledge — quotas, chunk sizes, error codes, concurrency ceilings, the three-state pending
model — is the valuable part and is licence-free. Take it.

---

## 5. Part B — API-first publishers (the "unbundlers")

These vendors sell the abstraction that Postiz gives away, plus the one thing Postiz cannot:
**pre-approved platform apps.** That is the actual product. Everything else is a thin REST
wrapper.

### 5.1 Ayrshare — the category incumbent

**Verified surface** `[V]` from `github.com/ayrshare/social-media-api` (the `social-media-api`
npm package, 324 ★), the Python SDK (46 ★), and the official Claude Code plugin (27 MCP tools).

**Networks (13+)** `[V]`: Facebook, Instagram, LinkedIn, X/Twitter, TikTok, YouTube, Pinterest,
Reddit, Telegram, Threads, Bluesky, **Snapchat**, Google Business Profile.

Snapchat's presence is notable and, if it includes organic publishing, would make Ayrshare
close to unique. `[U]` — I could not verify what Snapchat surface it actually writes to; most
likely Public Profile Saved Stories/Spotlight via a Snap partner grant. Worth a direct question
to their sales team, because it is a genuine differentiator.

**Base URL** `https://api.ayrshare.com/api`; **auth `Authorization: Bearer <API_KEY>`** `[V]`.

**API surface** `[V]` — this is the most complete feature list in the cohort:

| Group | Methods |
|---|---|
| Posting | `post()`, `delete()`, `getPost()`, `retryPost()`, `history()` |
| Analytics | `analyticsPost()` (per-post engagement), `analyticsSocial()` (profile demographics) |
| Media | `upload()` (base64), `media()`, `mediaUploadUrl()` (large files), `resizeImage()`, `verifyMediaExists()` |
| Comments | `postComment()` (FB, IG), `getComments()`, `deleteComments()`, `replyComment()` |
| **Messages/DMs** | `get_messages`, `send_message`, `get_auto_response`, `set_auto_response` |
| Feeds | `feedAdd()` (RSS/Substack auto-post), `feedDelete()`, `feedGet()`, `feedUpdate()` |
| Hashtags | `autoHashtags()`, `recommendHashtags()`, **`checkBannedHashtags()`** (IG compliance) |
| Short links | `shortLink()` (with UTM), `shortLinkAnalytics()` |
| Auto-schedule | `setAutoSchedule()`, `deleteAutoSchedule()`, `listAutoSchedule()` |
| **Multi-tenant (Business plan)** | `createProfile()`, `updateProfile()`, `deleteProfile()`, `getProfiles()`, `unlinkSocial()`, **`generateJWT()`** (hosted account-linking URL), `getBrandByUser()`, `registerWebhook()`/`unregisterWebhook()`/`listWebhooks()` |
| **AI (Max Pack add-on)** | `generatePost()`, `generateRewrite()`, `generateTranscription()`, `generateTranslation()` (100+ languages), `generateAltText()` |
| Utility | `user()` — returns post allowances and usage; `validate_post`, `validate_media`, `explain_error` |

REST endpoints confirmed via the Pipedream component: `POST/PATCH/DELETE/GET /profiles` `[V]`.

**The three architecturally important pieces:**

1. **`generateJWT()` + profile keys = white-label multi-tenancy.** Your customer's end-user
   clicks a link, lands on an Ayrshare-hosted (optionally branded) linking page, authorizes
   their networks against *Ayrshare's* approved apps, and you address them thereafter by
   `profileKey` (header or per-call argument) `[V]`. **This is the single feature that lets a
   startup ship a multi-tenant SMM product in weeks instead of quarters.** It is also the
   feature that makes you strategically dependent on Ayrshare.
2. **`checkBannedHashtags()`** — genuinely differentiated; nobody else in the cohort ships it.
3. **`explain_error`** — an error-decoder endpoint. A small thing that signals how much of this
   business is actually "translating 47 platform error codes into English."

**The X BYO break — the most important single fact in Part B.** `[V]` verbatim from the SDK
README: *"X/Twitter BYO (Bring-Your-Own-Keys): As of March 31, 2026, requires your own X
Developer App credentials, with consumer key and secret injected as headers into every X-bound
request."* The Claude plugin confirms the env vars `X_TWITTER_OAUTH1_API_KEY` and
`X_TWITTER_OAUTH1_API_SECRET` and describes it as a **"mandate effective March 31, 2026"**
`[V]`. For Business-plan multi-tenant JWT flows, BYO credentials pass as JSON body fields only
during account linking `[V]`.

Strategic reading: X's pricing and terms made it uneconomic for Ayrshare to amortize one app
across its base. Every customer now needs their own X developer account — meaning **every
customer of every abstraction vendor now personally faces X's tiering**, and the abstraction
vendor's value proposition on X collapses to "we handle the OAuth dance." Assume LinkedIn or
TikTok could follow. **Do not build a business model that requires shared-app economics to hold
on X.**

**Scale claim** `[V]`: "currently handles 25M+ calls per day" (vendor's own number, in their
plugin README). **No per-user rate limits documented** in any repo `[V]` — limits are enforced
server-side per platform, discoverable only via `user()` `[V]`.

**Documented caveats** `[V]`: "The SDK is a thin wrapper; client-side validation is the
developer's responsibility"; character limits, image formats, and aspect ratios "vary by
platform and are enforced server-side."

**Pricing** — `www.ayrshare.com/pricing` **blocked; `[U]` for current numbers.** `[K]` last
seen ~early 2025, **must be re-verified**: Free tier (single profile, limited); **Premium ≈
$149/mo** (1 user profile, all networks, analytics); **Business ≈ $499/mo** entry for ~10 user
profiles with per-additional-profile pricing above that; Enterprise custom; **Max Pack** as a
paid AI add-on consuming tokens; a **28-day free trial** is referenced in the plugin README
`[V]`. Treat the $149/$499 figures as indicative of *shape* (per-profile SaaS, not per-post)
rather than as current prices.

**Reliability reputation** `[K]`: generally the most-trusted name in the category; the deepest
API surface; the usual complaints are (a) per-profile pricing becomes punishing at agency scale,
(b) opaque platform-side failures surfaced as generic errors — which is precisely why
`explain_error` exists, and (c) support responsiveness at lower tiers.

### 5.2 Blotato

**Verified** `[V]` via `PipedreamHQ/pipedream/components/blotato`:

- **Base URL:** `https://backend.blotato.com`
- **Auth:** header **`blotato-api-key: <key>`** (not Bearer)
- **Endpoints:** `POST /v2/posts`, `POST /v2/media`, `POST /v2/videos/from-templates`,
  `GET /v2/videos/templates`, `GET /v2/videos/creations/{videoId}`, `DELETE /v2/videos/{videoId}`
- **Pipedream actions:** `create-post`, `upload-media`, `create-video`, `get-video`, `delete-video`

**Supported targets (10, from `create-post.mjs`)** `[V]`, with required/optional fields —
this is the clearest published capability matrix of any vendor in the cohort:

| Target | Required | Optional |
|---|---|---|
| Webhook | `webhookUrl` | — |
| Twitter | — | — |
| LinkedIn | — | `linkedinPageId` |
| Facebook | `facebookPageId` | `facebookMediaType` |
| Instagram | — | `instagramMediaType`, `instagramAltText` |
| Pinterest | `pinterestBoardId` | `pinterestTitle`, `pinterestAltText`, `pinterestLink` |
| **TikTok** | `tiktokPrivacyLevel`, `tiktokDisabledComments`, `tiktokDisabledDuet`, `tiktokDisabledStitch`, `tiktokIsBrandedContent`, `tiktokIsYourBrand`, `tiktokIsAiGenerated` | several more |
| Threads | — | `threadsReplyControl` |
| Bluesky | — | — |
| YouTube | `youtubeTitle`, `youtubePrivacyStatus`, `youtubeShouldNotifySubscribers` | `youtubeIsMadeForKids`, `youtubeContainsSyntheticMedia` |

All targets require `accountId`, `text`, `targetType`; media URLs optional `[V]`.

**The TikTok required-field list is a fingerprint of a successfully audited client.** Privacy
level, comment/duet/stitch toggles, branded-content flags, and AI-generated disclosure are
*exactly* what TikTok's Content Posting API compliance review demands be surfaced to the user.
Blotato passed the audit. Likewise `youtubeContainsSyntheticMedia` maps to YouTube's synthetic-
media disclosure requirement. **Use this table as your own compliance checklist.**

**Positioning** `[K]`: AI-first content generation (the `/v2/videos/from-templates` endpoint is
the giveaway) plus distribution, sold heavily into the n8n/Make automation community — which is
rational given n8n's missing Instagram/TikTok/Pinterest nodes `[V]`. Not "Zapier for social" but
"the social output node your automation platform lacks."

**Pricing** `[U]` — site blocked. `[K]` roughly $29–$99/mo tiers with credit-based video
generation. **Verify.** **Reliability** `[U]` — insufficient independent evidence.

### 5.3 Upload-Post — the widest network list, and the only one with idempotency

**Verified** `[V]` from `github.com/upload-post` (13 repos): `upload-post-pip` (Python SDK),
`upload-post-npm` (JS SDK), `n8n-nodes-upload-post` (26 ★), `upload-post-mcp` (MCP server),
`upload-post-plugin` (Claude Code plugin), plus content-generation skills (`skill-autoshorts`
127 ★, `avatar-mix` 124 ★, `viraloop` 71 ★). **Most repos MIT** `[V]`.

**23 platforms** `[V]`: TikTok, Instagram, YouTube, LinkedIn, Facebook, Pinterest, Threads,
Reddit, Bluesky, Discord, Telegram, X, Slack, Mastodon, Nostr, Lemmy, Dev.to, Hashnode,
WordPress, Whop, Listmonk, Google Business, "and more."

That list is *suspiciously* close to Postiz's 34-provider registry — same long tail (Nostr,
Lemmy, Whop, Listmonk, Hashnode, Dev.to). `[U]` whether that reflects shared inspiration,
shared architecture, or coincidence, but it is worth noting that the marginal networks are the
same marginal networks everywhere.

**Auth** `[V]`: API key (`UploadPostClient("YOUR_API_KEY")`) plus **`generate_jwt()` for
white-label integration** — the same multi-tenant pattern as Ayrshare.

**Method surface** `[V]`:

| Method | Purpose |
|---|---|
| `upload_video()` | 13+ platforms |
| `upload_photos()` | 13+ platforms |
| `upload_text()` | 15+ platforms |
| `upload_document()` | **PDFs/presentations → LinkedIn** |
| `get_status()` / `get_job_status()` | async progress / queued posts |
| `get_history()` | upload records |
| `list_scheduled()` / `edit_scheduled()` / `cancel_scheduled()` | scheduled-post CRUD |
| `get_analytics()` / `get_cached_post_analytics()` | engagement metrics |
| `get_media()` | retrieve recent posts from connected accounts |
| `list_users()` / `create_user()` / `delete_user()` | profile management |

**Per-platform required params** `[V]`: TikTok — `privacy_level`, `disable_duet`,
`disable_comment`, `disable_stitch`; Instagram — `media_type` (REELS/STORIES/IMAGE); YouTube —
`tags`, `categoryId`, `privacyStatus`, `defaultLanguage`; LinkedIn — `visibility`,
`target_linkedin_page_id`; Facebook — `facebook_page_id`; Pinterest — `pinterest_board_id`,
`pinterest_link`; X — `reply_settings`, `poll_options` (2–4); Reddit — `subreddit`;
Google Business — `gbp_location_id`.

Common params on all uploads `[V]`: `title`, `user`, `platforms`, `first_comment`, `alt_text`,
`scheduled_date`, `timezone`, `add_to_queue`, `async_upload` (**default True**).

**Two standout engineering details** `[V]`, both from the n8n node README:

1. **`Idempotency-Key` on every upload — "The API collapses two uploads carrying the same key
   within a 24-hour window into a single post."** This is the only first-class duplicate-post
   defense I found anywhere in the cohort. It is the right design and you should copy it.
2. **Automatic async switch at 59 seconds**, with two documented polling strategies
   (node-level wait vs workflow-level loop) — an honest accommodation of the fact that social
   media publishing does not fit a synchronous request/response model.

Also documented `[V]`: "LinkedIn photos support only public visibility due to API constraints";
Facebook and Pinterest require dynamic page/board selection.

**Pricing** `[U]` — not in any repo `[V]`, site not reachable. **Reliability** `[U]`.
**Strategic note:** Upload-Post is the most aggressive at *agent-native distribution* — n8n node
+ MCP server + Claude plugin + open agent skills. If the buyer is an AI agent rather than a
human, they are currently best positioned.

### 5.4 Late (getlate.dev)

**`[U]` — `getlate.dev` was not reachable and I found no repository.** What I can say honestly:
`[K]` Late is a 2024/2025-vintage API-first social posting vendor positioning on "one API, 10+
platforms" with developer-friendly low entry pricing (tens of dollars/month, not hundreds) and
an explicit anti-Ayrshare price posture. **Networks, auth model, rate limits, reliability, and
current pricing: all UNVERIFIED.** Do not cite specifics from this entry.

### 5.5 Publer API

`[K]`, **not verified**: Publer exposes a REST API (`app.publer.io` / `app.publer.com` API
surface) gated to **Business-plan and above**. Auth is a Bearer API key plus a
**workspace/`Publer-Workspace-Id` header**. Endpoints cover post creation, scheduling, and job
status (Publer's API is job-based — you POST a job and poll for completion). Coverage tracks
Publer's product: FB, IG, X, LinkedIn, Pinterest, TikTok, YouTube, Google Business, Threads,
Mastodon, Telegram, WordPress. **Not a white-label API** — it automates *your own* Publer
account, so multi-tenant resale is not the intended use. Pricing is the Publer seat price, not
per-call. **`[U]` for all specifics; verify against `publer.com/api` docs.**

### 5.6 Social Champ API

`[K]`, **not verified**: Social Champ offers API access on higher-tier/agency plans; API-key
auth; posting and scheduling endpoints across their ~10 supported networks. Like Publer, it is
an *account-automation* API rather than a white-label multi-tenant platform. **`[U]` for
endpoints, limits, and pricing.** Low strategic relevance as a competitor to a white-label API;
moderate relevance as evidence that mid-market SMM tools are commoditizing API access as a
retention feature.

### 5.7 Buffer API — effectively a closed door

`[K]`, **not verified this session, and this one matters**: Buffer's public API
(`api.bufferapp.com/1/`) is a **legacy v1 REST API** that has not meaningfully evolved in
years. Buffer stopped accepting new public API application registrations, and existing
integrations are grandfathered. Buffer's strategic direction moved to its own product and
its "Buffer for X" surface area, not to being an infrastructure provider.

**Implication:** do not plan any product on Buffer's API. Its continued presence in
"social media API" listicles is a stale-content artifact. **`[U]` — if a current partner
program exists, I could not confirm it.** If you need this confirmed, that is a 10-minute
check on `buffer.com/developers`.

### 5.8 Hootsuite API — an app platform, not a posting API

`[K]`, **not verified**: Hootsuite operates a Developer Platform with two distinct products
that are frequently conflated:

1. **App Directory apps** — apps that render *inside* the Hootsuite dashboard as streams/panels.
   This is the primary program. Distribution is the value; you reach Hootsuite's enterprise base.
2. **A REST API** (`platform.hootsuite.com/v1`) with OAuth2, covering `/me`, `/socialProfiles`,
   `/messages` (schedule/publish), `/media`. Available to Business/Enterprise customers.

Neither is a white-label multi-tenant posting API. You cannot resell Hootsuite's platform
approvals. Rate limits are per-plan and modest `[U]`. **Strategic relevance: distribution
channel, not infrastructure.** Building a Hootsuite App Directory app is a legitimate GTM
motion for reaching enterprise social teams; treating Hootsuite as your posting backend is not.

### 5.9 Part B synthesis — what you are actually buying

| | Ayrshare | Blotato | Upload-Post | Publer/Champ | Buffer | Hootsuite |
|---|---|---|---|---|---|---|
| Networks | 13+ `[V]` | 9+webhook `[V]` | 23 `[V]` | ~10–12 `[K]` | legacy `[K]` | ~8 `[K]` |
| White-label multi-tenant | **Yes** (`generateJWT`) `[V]` | `[U]` | **Yes** (`generate_jwt`) `[V]` | No `[K]` | No `[K]` | No `[K]` |
| DMs / inbox | **Yes** `[V]` | No `[V]` | No `[V]` | partial `[K]` | No | Yes (in-app) `[K]` |
| Analytics | post + profile `[V]` | `[U]` | post + profile `[V]` | yes `[K]` | yes `[K]` | yes `[K]` |
| Idempotency | `[U]` | `[U]` | **Yes, 24h** `[V]` | `[U]` | `[U]` | `[U]` |
| AI generation | Max Pack add-on `[V]` | **core** `[V]` | via skills `[V]` | some `[K]` | some `[K]` | some `[K]` |
| Agent-native (MCP) | **Yes** `[V]` | via Pipedream `[V]` | **Yes** `[V]` | `[U]` | No | No |
| X model | **BYO from 2026-03-31** `[V]` | `[U]` | `[U]` | n/a | n/a | n/a |
| Pricing shape | per-profile/mo `[K]` | tiered+credits `[K]` | tiered `[U]` | seat `[K]` | seat | seat |

**The honest summary of this segment:** you are not buying software. Ayrshare's `post()` is a
few hundred lines you could write in a week. You are buying (1) an audited TikTok client,
(2) Meta Advanced Access with a passed Data Protection Assessment, (3) a LinkedIn MDP grant with
working refresh tokens, (4) a YouTube quota extension, and (5) the ongoing operational labor of
tracking `LinkedIn-Version: 202601` → `202602` → … and Graph v20 → v21 → v22 → v23 forever
(Postiz's source shows four concurrent Graph versions in production `[V]` — that is the real
tax). Price the build-vs-buy decision against *that*, not against the REST wrapper.

---

## 6. Part C — Permissioned creator-data infrastructure

### 6.1 Phyllo / InsightIQ

**Verified** `[V]`: `github.com/getphyllo` (16 public repos, US-based, `getphyllo.com`) ships a
**"Connect" SDK family**: `phyllo-connect-web`, `phyllo-connect-reactnative`,
`phyllo-connect-android` (Kotlin), `phyllo-connect-ios` (Obj-C), `phyllo-connect-flutter`, plus
`phyllo-postman` (API collection) and sample apps. A separate org `github.com/insightiq-ai`
exists with 4 repos — `iiq-managed-service` (Python, Sep 2024), `measurement-dashboard-demo`
(Jun 2024), `test-iq-app` (Oct 2023), `insightiq-postman` (Jun 2023) `[V]`.

**Relationship between the two names:** `[K]` InsightIQ is Phyllo's brand for the
influencer-marketing/measurement product line; the two are the same company, with `insightiq.ai`
serving the marketer-facing product and `getphyllo.com` the developer/API-facing one. The
parallel `*-postman` repos in both orgs are consistent with that. **`[U]` — I could not confirm
the current corporate/brand structure in this session.** If precision matters, verify; if you
just need to know "are these two competitors or one," the answer is almost certainly one.

**What it abstracts** `[K]`: a **user-permissioned OAuth read layer over creator accounts**.
Not publishing. The domain model is roughly:

| Endpoint family | Content |
|---|---|
| **Identity** | creator profile, handle, follower counts, platform account IDs |
| **Engagement** | per-content metrics: views, likes, comments, shares, saves |
| **Contents** | the creator's posts/videos with metadata |
| **Audience** | demographics — age, gender, geography, interest breakdowns |
| **Income** | monetization/earnings where the platform exposes it (YouTube, Patreon, etc.) |
| **Activity** | comments/mentions streams |
| **Publish** | `[U]` — Phyllo has advertised limited publishing on some platforms; **not verified** |

**Work platforms** `[K]`: Instagram, TikTok, YouTube, Twitch, X, LinkedIn, Facebook, Substack,
Patreon, Spotify for Artists, and similar creator-economy surfaces. Exact current list `[U]`.

**Auth model** `[V, from SDK structure]`: the Connect SDK renders a hosted/embedded flow in
which the *end creator* authorizes their own accounts; your app receives a Phyllo `user_id` +
`account_id` and reads data thereafter. **This is the same architectural pattern as Ayrshare's
`generateJWT()`** — the vendor owns the platform apps and the approvals, you address users by
opaque ID. Environments: sandbox / staging / production `[K]`.

**Pricing** `[K]`: per-connected-account-per-month, typically low-single-digit dollars per
account with volume tiers, plus a platform fee. **`[U]` for current numbers.** Note this is a
*fundamentally different unit* from the publishers (per-profile-per-month) and the scrapers
(per-result). If you build a product that needs both publish and analytics, you will be paying
on three incompatible meters.

**Why this matters to an SMM product.** Phyllo/InsightIQ is the cleanest existing answer to
"give me *permissioned, ToS-compliant* creator analytics without building 12 OAuth
integrations." It is the read-side complement to Ayrshare's write-side. **Nobody sells both.**
See §11 for why that is the most interesting gap in this market.

**Reliability** `[K]`: reasonable reputation in influencer-marketing tooling; the standard
complaints are data freshness lag (platform APIs are batch/delayed) and coverage gaps on
platforms where the underlying API is thin (TikTok analytics in particular).

---

## 7. Part D — Agent and automation plumbing

### 7.1 n8n — and the hole in the middle of it

**Verified** `[V]` from `packages/nodes-base/package.json` — this is the authoritative node
manifest, not a docs page:

**Social/publishing nodes present:** `Twitter`, `LinkedIn`, `Facebook/FacebookGraphApi`,
`Facebook/FacebookTrigger`, `FacebookLeadAds/FacebookLeadAdsTrigger`, `Reddit`, `Discord`,
`Telegram` (+Trigger), `Slack` (+Trigger), `Medium`, `Ghost`, `Wordpress`, `Youtube`,
`Mastodon`, plus adjacent `Bannerbear`, `ConvertKit` (+Trigger).

**Credentials present** `[V]`: `TwitterOAuth1Api`, `TwitterOAuth2Api`, `LinkedInOAuth2Api`,
**`LinkedInCommunityManagementOAuth2Api`**, `FacebookGraphApi`, `FacebookGraphApiOAuth2Api`,
`FacebookGraphAppApi`, `FacebookGraphAppOAuth2Api`, `FacebookLeadAdsOAuth2Api`,
`RedditOAuth2Api`, `DiscordBotApi`/`DiscordOAuth2Api`/`DiscordWebhookApi`, `TelegramApi`,
`SlackApi`/`SlackOAuth2Api`, `MediumApi`/`MediumOAuth2Api`, `GhostAdminApi`/`GhostContentApi`,
`WordpressApi`/`WordpressOAuth2Api`, `YouTubeOAuth2Api`, `BannerbearApi`, `ConvertKitApi`.

**Conspicuously absent** `[V]`: **Instagram, TikTok, Pinterest, Threads, Bluesky.** No nodes, no
credentials.

Two observations. First, the existence of a dedicated `LinkedInCommunityManagementOAuth2Api`
credential separate from `LinkedInOAuth2Api` is direct corroboration that LinkedIn's Community
Management API is a **separate approval track with separate scopes** (see §9.3). Second, the
absence of Instagram/TikTok/Pinterest is not an oversight — it is a *consequence of App Review*.
n8n ships BYO-credential nodes; a node for Instagram would require every n8n user to
individually pass Meta App Review, which is not a viable UX. **n8n cannot solve this problem
with a node. It can only solve it by integrating a vendor who already has the approvals.**

That is exactly the market Blotato and Upload-Post are serving, both of which ship official n8n
nodes `[V]`. **This is the clearest, most concrete GTM wedge identified in this research:** the
automation-platform user who wants to post to Instagram/TikTok/Pinterest and finds no native
node.

`[K]` n8n's license is the **Sustainable Use License** (fair-code, not OSI-open) — you may
self-host and use internally, but not resell n8n as a service. Relevant if you plan to embed it.

### 7.2 Zapier and Make

`[K]`, **not verified this session**. Both maintain large connector catalogs including Buffer,
Hootsuite, Later, Facebook Pages, LinkedIn, Instagram (limited to Business accounts and reduced
after Meta's API changes), Pinterest, YouTube, and Reddit. X/Twitter connectors were
**substantially degraded or removed following X's 2023 API repricing** — this is a
well-documented event and the single most instructive precedent in this whole space: a platform
changed price, and the entire automation layer's Twitter functionality evaporated overnight.

**Structural point:** Zapier and Make hold their own platform approvals for their connectors, so
their users do *not* face App Review. That makes them, functionally, the largest shared-app
social API providers in the world — and it means they compete with Ayrshare/Blotato/Upload-Post
whether or not they market it that way. Their weakness is that they are *general* automation
platforms: no social-specific queue management, no per-network content variants, no first-comment
handling, no approval workflows, no calendar. **`[U]` for current connector lists and limits.**

### 7.3 Composio

**Verified** `[V]`: `github.com/ComposioHQ/composio`, **MIT license**, **29.6k ★**, 4.7k forks,
4,825 commits. Positioning: *"powers 1000+ toolkits, tool search, context management,
authentication, and a sandboxed workbench to help you build AI agents that turn intent into
action."* TypeScript SDK `@composio/core`, Python SDK, CLI. Framework support: OpenAI, Anthropic,
Claude Agent SDK, LangChain, others. **Per-user sessions and MCP endpoints** `[V]`.

The repo does not itemize which social apps are in the 1000+ `[V]`. `[K]` the catalog
historically includes X/Twitter, LinkedIn, Reddit, Discord, Slack, Telegram, YouTube, and
Typefully — i.e., the same "no-review-required or easy-review" set that everyone gets, and
**not** the hard set (Instagram, TikTok, Pinterest publishing). **`[U]`.**

**What it actually abstracts:** *managed OAuth for agents.* Composio holds connections per
end-user and hands your agent an authenticated tool. That is genuinely useful and directly
overlapping with the "connect your accounts" half of an SMM product — but Composio does not
solve social-specific problems (media transcoding, container polling, per-network variants,
scheduling, rate-limit orchestration). **Complement, not competitor**, but worth watching: if
Composio ever obtains its own Meta/TikTok approvals, it becomes a competitor overnight.

**MIT license means the toolkit-definition patterns are freely reusable** — a legitimate source
of design leverage for your own tool-definition layer if you go agent-native.

### 7.4 Pipedream

**Verified** `[V]`: `PipedreamHQ/pipedream` contains **~2,400+ component directories**
(GitHub's tree view reports 2,397 entries omitted past the 1,000-file display cap). Components
are open source in-repo; the platform is closed. Confirmed present: **`components/ayrshare`**
(with `actions/`, `common/`, `ayrshare.app.mjs`, `package.json`) and **`components/blotato`**
(with `actions/{create-post, upload-media, create-video, get-video, delete-video}`,
`blotato.app.mjs`, `package.json`) `[V]`.

**That both unbundlers are already Pipedream components is the finding.** The API-first
publishers treat automation platforms as their primary distribution channel, and Pipedream —
because its components are open source — is the *easiest* channel to enter (submit a PR). For a
new entrant, **shipping a Pipedream component is a near-zero-cost distribution move** and, as a
bonus, the component source is public documentation of your API that competitors' researchers
will read (as I just did to both Ayrshare and Blotato).

### 7.5 Unified.to

**Verified** `[V]` from `unified-typescript-sdk` README. SDKs in TypeScript, Python, Ruby, Go,
Java, PHP, C# `[V]`, plus React/Vue/Svelte integration-directory components `[V]`. Auth: a
single global **`jwt` apiKey** security scheme `[V]`. Positioning: "One API to integrate them
all."

**Verticals** `[V]`: Accounting, ATS, HRIS, CRM, **Ads**, **Martech**, Analytics, UC
(unified communications), E-commerce, Task, Ticketing, LMS, Datastore, CDP, Calendar,
Assessment, plus **Passthrough**.

**The finding is the absence.** There is **no social-media-publishing vertical** `[V]`. "Ads"
and "Martech" are the nearest neighbours, and neither is organic publishing. Unified.to has
built the unified-API pattern across 15+ B2B verticals and **has not entered social publishing**
— which tells you either (a) they judge the App Review cost/benefit unattractive, or (b) the
vertical is genuinely harder than the others they have done. Both readings support the thesis
that **platform approvals, not API design, are the barrier to entry here.** That barrier is your
moat if you clear it and your wall if you do not.

`Passthrough` is worth noting as a design pattern: a documented escape hatch to raw
provider calls for anything the unified model does not cover. Every unified API in this space
needs one; Ayrshare, Blotato, and Upload-Post all lack an obvious equivalent `[V/U]`.

### 7.6 Bytebot — computer-use as the API-of-last-resort

**Verified** `[V]`: `github.com/bytebot-ai/bytebot`, **Apache-2.0**, **11.1k ★**, 1.5k forks.
An open-source AI desktop agent that runs a **containerized Ubuntu 22.04 + XFCE desktop**
(Firefox, VS Code preinstalled), driven by a **NestJS agent service** with a **Next.js** task
UI and **REST APIs**; Docker + Kubernetes/Helm deployment; supports Anthropic Claude, OpenAI
GPT, and Google Gemini `[V]`. Explicitly positioned against browser-only agents: it can use
desktop applications, manage files, **authenticate with password managers, handle 2FA**,
download files, and run "multi-step workflows across different programs" `[V]`.

**Relevance to SMM.** Bytebot is the credible technical path to the surfaces the APIs do not
cover:

| Surface | API availability | Computer-use viable? |
|---|---|---|
| Snapchat organic Stories/Spotlight | **None for third parties** `[K]` | Yes |
| Instagram DMs at scale | Restricted; Messenger API for IG has strict eligibility `[K]` | Yes |
| TikTok analytics beyond Display API | Not exposed | Yes |
| LinkedIn personal-profile analytics | Not exposed to non-MDP apps `[K]` | Yes |
| Facebook Group posting (non-page) | Deprecated for third parties `[K]` | Yes |
| Pinterest before Standard access | Trial-limited `[K]` | Yes |

**And the reason you should probably not do it.** Every one of those actions violates the
target network's Terms of Service (automated access / unauthorized clients / credential
sharing). Consequences escalate from account rate-limiting to permanent account bans **of your
customers' accounts**, to legal exposure, to — most damagingly — **losing your legitimate API
approvals** if a network connects the automation to your registered app. The asymmetry is
brutal: computer-use might add 5% of feature surface and can destroy 100% of your approved
access.

**Recommended posture:** know it exists, understand that some competitors quietly do it,
consider it only for *internal* research/QA where no customer account is involved, and treat
"we do Snapchat organic" claims from competitors as a signal to ask *how*.

### 7.7 Lomi — could not identify

**`[U]` — I was unable to identify, with acceptable confidence, a company named "Lomi"
operating in the social-media/developer-API space.** Candidates I can distinguish and reject:
a food-waste appliance brand; a fintech/payments product operating under `lomi.africa`. Neither
is relevant here. There may be a recent, small, or stealth entrant I do not have coverage of.

**Action required:** please provide a URL or a one-line description and I will research it
properly. I am flagging this rather than inventing a plausible-sounding profile, which would be
worse than useless in a reference document.

---

## 8. Part E — Third-party data and scraping

This layer has a fundamentally different risk profile from everything above. Parts A–D operate
*with* platform permission. Part E operates *without* it. Do not let them sit in the same
architecture diagram without a compliance boundary between them.

### 8.1 ScrapeCreators

**Verified** `[V]`: `github.com/scrapecreators` — `social-media-research-skills` (Python,
**1,393 ★**, updated 2026-07-24), `scrapecreators-cli` (JS, updated 2026-08-04), `agent-skills`.
Auth: **`export SCRAPECREATORS_API_KEY=sk_...`** `[V]`.

**Platforms** `[V]`: TikTok, Instagram, YouTube, Reddit, X/Twitter, LinkedIn, Facebook, Threads,
Bluesky, Pinterest, **Rumble** — plus **Meta, Google, and LinkedIn ad libraries**.

**Architecture** `[V]`: a low-level `scrapecreators-api` skill that "routes a raw
scraping/fetching request to the right ScrapeCreators endpoint," with higher-level
workflow-shaped skills layered on top: outlier detection, transcript intelligence, comment
mining, competitor comparison, ad-library analysis, creator teardowns, trend identification,
influencer prospecting, audience evaluation, social listening briefs, product demand validation,
content repurposing.

**The ad-library coverage is the differentiated asset.** Meta/Google/LinkedIn ad libraries are
*public by regulatory mandate* (EU DSA, political-ads transparency), which makes accessing them
far less legally fraught than scraping organic content. A competitive-intelligence feature built
on ad libraries is defensible in a way that one built on scraped Instagram profiles is not.

**Note the 1,393 stars on an agent-skills repo** `[V]` — updated within weeks of this writing.
ScrapeCreators is executing the same agent-native distribution playbook as Upload-Post, and
doing it well. Pricing, credits, and rate limits are **not in the repos** `[V]` → `[U]`.

### 8.2 EnsembleData

**Verified** `[V]`: `github.com/EnsembleData` — `ensembledata-python` (21 ★, **MIT**),
`ensembledata-node` (**MIT**), `tiktok-scraper` (15 ★, educational), `instagram-scraper`
(Jupyter). Self-described: *"Social Media Scraping API provider to fetch real-time data —
Robust, fast, easy to integrate."* Based in **Singapore** `[V]`.

**Platforms** `[V]`: TikTok, Instagram, YouTube ("and much more").
**Sample endpoints** `[V]`: TikTok `user_info_from_username`, Instagram `user_info`, YouTube
`channel_subscribers`, plus a **generic `request()` method for unlisted endpoints**.

**Billing model — verified and important** `[V]`: every response object carries a
**`units_charged`** field. This is a **metered, per-call credit model with per-response cost
transparency**, which is materially better for cost control than opaque per-result pricing.
Errors include **`STATUS_429_RATE_LIMIT_EXCEEDED`** `[V]`. SDK defaults to **3 retries on
network issues; timeouts are not retried**; retry/timeout configurable per client or per request
`[V]`.

**Actual unit prices: `[U]`.** The `units_charged` mechanism is verified; the dollar value of a
unit is not.

### 8.3 Apify

`[K]`, **not verified — the actor repos I tried (`apify/actor-instagram-scraper`,
`apify/actor-tiktok-scraper`) returned 404**, so those specific names are wrong or the actors
are not in public repos under those paths.

What I can state from knowledge: Apify is an **actor marketplace** — containerized scrapers
published by Apify and by third-party developers. Social actors exist for Instagram, TikTok,
X/Twitter, Facebook, LinkedIn, YouTube, Reddit, Threads, and Pinterest. Billing has moved toward
**pay-per-result / pay-per-event** (e.g., order-of-magnitude **$0.30–$3.00 per 1,000 results**
depending on actor) layered on **compute-unit** and platform-subscription charges. The
**Apify SDK and Crawlee are Apache-2.0** and genuinely good engineering. Most *actors* are
closed-source even when the SDK is not.

**Two structural cautions.** (1) **Quality is heterogeneous** — a third-party actor can break or
be abandoned, and the marketplace model means no single throat to choke. (2) The platforms
actively counter-engineer; Instagram and TikTok actors experience periodic multi-day outages
after platform changes. Anything you build on Apify needs a degraded-mode plan. **`[U]` for all
current prices and the actor catalog.**

### 8.4 Bright Data

`[K]`, **not verified**: proxy infrastructure (residential/datacenter/ISP/mobile), **Web
Unlocker**, **Scraper APIs**, and pre-collected **Social Media Datasets** sold as
snapshots/subscriptions for Instagram, TikTok, LinkedIn, X, Facebook, YouTube, Reddit, and
Pinterest. Dataset pricing is roughly **per-record, sub-cent to low-cents at volume**, with
enterprise minimums; proxy pricing is per-GB. Bright Data has litigated and largely prevailed in
public-data-scraping cases (notably against Meta and X), which is *why* enterprises buy from
them: they are buying **legal indemnification and a defensible posture** as much as data.

**Relevance:** Bright Data is the enterprise-grade answer for competitive/benchmark data at
scale. It is also expensive, sold top-down, and irrelevant to a product's core publishing loop.
**`[U]` for current pricing.**

### 8.5 RapidAPI social endpoints

`[K]`, **not verified**: RapidAPI hosts hundreds of unofficial social endpoints
("Instagram Scraper API", "TikTok API", "Twitter API v2 alternative") published by individual
developers, typically **$0–$50/month** with request quotas.

**Assessment: do not build production on these.** They are single-developer, frequently
undifferentiated resellers of the same underlying scrapers, and they disappear without notice.
Reliability reputation is uniformly poor. Their only legitimate use is a **48-hour spike test**
to validate that a data shape exists before you commit to Apify/Bright Data/EnsembleData.

### 8.6 Part E synthesis — and a hard recommendation

| Provider | Platforms | Billing unit | Verified | Legal posture |
|---|---|---|---|---|
| ScrapeCreators | 11 + 3 ad libraries `[V]` | credits `[U]` | org + skills `[V]` | scraping; ad libs are lower-risk |
| EnsembleData | TikTok, IG, YT `[V]` | **`units_charged` per call** `[V]` | SDK `[V]` | scraping |
| Apify | ~9 via actors `[K]` | per-result + compute `[K]` | ❌ | scraping; marketplace = diffuse liability |
| Bright Data | ~8 datasets `[K]` | per-record / per-GB `[K]` | ❌ | **litigated and largely upheld**; indemnified |
| RapidAPI | many `[K]` | subscription `[K]` | ❌ | opaque; avoid |
| **Phyllo/InsightIQ** *(Part C, for contrast)* | 10–20 `[K]` | per-connected-account `[K]` | orgs `[V]` | **permissioned — fully compliant** |

**Recommendation.** Keep a **hard architectural boundary** between permissioned and
non-permissioned data. Specifically: never let scraped data flow into a code path that also
touches your first-party OAuth tokens, and never surface scraped data in a UI in a way that
implies platform endorsement. The concrete failure mode is not a lawsuit — it is a platform
integrity team correlating your scraping traffic with your registered app and revoking the
approvals you spent nine months earning. **Your API approvals are worth more than any scraped
dataset.** Where you need competitive data, prefer ad libraries (public by mandate) and
permissioned creator data (Phyllo) over organic scraping.

---

## 9. THE CRITICAL SECTION — what it actually takes to get production API access

**Read this before you write a line of integration code.**

### 9.0 Framing, and an honest statement of confidence

Every major network operates the same three-stage funnel, under different names:

```
  STAGE 1: SELF-SERVE          STAGE 2: ENTITY TRUST        STAGE 3: SCOPE GRANT
  ─────────────────────        ─────────────────────        ────────────────────
  Register a developer app     Prove you are a real,        Prove each permission
  Get client_id/secret         accountable legal entity     is necessary for a
  Works ONLY for you and       ─ business verification      described user-facing
  a handful of test users      ─ domain ownership           feature you can DEMO
                               ─ verified page/entity       ─ screencast
  Days: 0                      ─ security/data assessment   ─ written justification
                               Days: 5–60                   ─ live, working product
                                                            Days: 14–120+, iterative
```

**Nothing about Stage 1 predicts Stage 3.** Teams routinely build a complete, working product in
Stage 1 (where everything works for the developer's own accounts), then discover at Stage 3 that
the reviewer wants to see a flow the product does not have, or that a required scope is simply
not granted to their category. That is the failure mode this section exists to prevent.

**Confidence statement.** The *structure*, *sequence*, *artifacts required*, and *rejection
patterns* below are `[K]` and I hold them with high confidence — these processes are stable
year-over-year and are corroborated in several places by the Postiz source and docs I verified
this session `[V]`. The *specific dollar figures, quota numbers, and review turnaround times*
are `[K]` as of **May 2026** and are the parts most likely to have moved. **Re-verify every
number in the tables before committing to a plan or a budget.** I have marked the highest-risk
figures explicitly.

### 9.1 Meta — Facebook Pages, Instagram, Threads

**Programs and what they actually gate.** A common and expensive misconception is that you need
to be a *Meta Business Partner* / "Tech Provider" to publish. **You do not.** `[K]`

| Program | Required for organic publishing? | What it is |
|---|---|---|
| App Review + Advanced Access | **YES — this is the real gate** | Per-permission grant to use scopes on accounts you don't own |
| Business Verification | **YES — prerequisite** | Legal-entity verification of your business portfolio |
| Data Protection Assessment (DPA) | **YES, ongoing** | Annual questionnaire on data handling; failure revokes access |
| Meta Business Partners (Tech Provider) | **No** | Directory/badge program with revenue/ad-spend thresholds; marketing benefit |
| Marketing API tiers (Dev/Basic/Standard) | Only for **ads** | Ad-account count limits; separate from organic |

**The permissions you need** (verified as the actual scope sets in production use `[V]`, from
Postiz):

- **Facebook Pages:** `pages_show_list`, `pages_manage_posts`, `pages_manage_engagement`,
  `pages_read_engagement`, `business_management`, `read_insights`
- **Instagram (FB-linked):** `instagram_basic`, `instagram_content_publish`,
  `instagram_manage_comments`, `instagram_manage_insights` + the Pages scopes above
- **Instagram (standalone / Instagram Login):** `instagram_business_basic`,
  `instagram_business_content_publish`, `instagram_business_manage_comments`,
  `instagram_business_manage_insights`
- **Threads:** `threads_basic`, `threads_content_publish`, `threads_manage_replies`,
  `threads_manage_insights`

**Every one of those requires App Review for Advanced Access.** In Standard Access they work
only for users with a role on your app (admin/developer/tester) — which is exactly why Postiz's
docs tell users to add themselves as an **"Instagram Tester"** when connection fails `[V]`.

**The process, in order** `[K]`:

1. **Create a Meta Business Portfolio** (not a personal account). Create the app inside it,
   app type "Business."
2. **Business Verification.** Submit legal business name, registered address, phone, and a
   verification document (certificate of incorporation, utility bill, business licence). Often
   includes a phone/SMS verification step. **Typical: 2–10 business days; can stretch to
   several weeks on document mismatches.** The #1 failure is the submitted document's legal name
   not exactly matching the portfolio name.
3. **Add products:** Facebook Login for Business; Instagram Graph API or Instagram API with
   Instagram Login; Threads API.
4. **Build the working flow** — the reviewer must be able to *use* it.
5. **Submit App Review, one submission covering all permissions.** For each permission you
   provide: a written justification tied to a named user-facing feature, **step-by-step reviewer
   instructions**, **test credentials**, and a **screencast**.
6. **Complete the Data Protection Assessment** when prompted — an extensive questionnaire on
   storage, retention, deletion, subprocessors, and access controls. **This recurs annually.**
7. **Implement the Data Deletion Callback** (a URL Meta calls when a user requests deletion) —
   commonly missed and a hard blocker.

**Timeline** `[K]`: **6–14 weeks** end-to-end for a first-time applicant including one or two
rejection cycles. Individual review rounds are typically **3–10 business days**.
**Cost:** $0 in fees. Real cost is engineering + legal-entity setup + the DPA effort.

**Rejection reasons, in rough order of frequency** `[K]`:

1. **The screencast doesn't show the complete flow** — reviewers require login → consent screen
   → the permission actually being exercised → the resulting user-visible value, unbroken, with
   the scope visible on the consent dialog. Partial or edited videos are auto-rejected.
2. **The reviewer couldn't make it work** — test credentials expired, the app was in Dev Mode,
   the flow required a Page/IG account the reviewer didn't have, or signup was gated.
3. **Privacy policy problems** — URL 404s, is not on the app's verified domain, or does not
   specifically address Meta platform data.
4. **Permission not justified by a demonstrated feature** — asking for `instagram_manage_insights`
   with no analytics UI. **Ask only for what you can show.**
5. **Missing data deletion callback.**
6. **Business verification incomplete** or portfolio/document name mismatch.
7. **Use case in a restricted category** — anything reading as engagement automation,
   follower growth, or bulk/spam messaging.

**Rate limits** `[K/V]`:

| Limit | Value | Source |
|---|---|---|
| **Instagram content publishing** | **25 posts / 24h per IG account** | `[V]` — Postiz maps Meta error `2207042` to "maximum of 25 posts per day" |
| Instagram "page request limit" | separate daily cap | `[V]` — mapped to "Page posting for today is limited" |
| Threads publishing | 250 posts + 1,000 replies / 24h per user | `[K]` |
| Graph API | Business Use Case (BUC) rate limiting, per-app-per-asset, scored on CPU/time | `[K]` |
| Facebook posting velocity | soft; error `1390008` "You are posting too fast" | `[V]` |
| Facebook security lockout | error `1404112`, account limited "for a few days" | `[V]` |

**API-version treadmill** `[V]`: Postiz runs Graph **v20.0** (auth, pages, publishing),
**v21.0** (IG insights), **v22.0** (`ig_audio`), and **v23.0** (FB insights) *simultaneously* —
and `graph.instagram.com/v21.0` for standalone IG. Meta deprecates versions on roughly a 2-year
cycle. **Budget continuous maintenance, not a one-time build.**

**Practical note for a multi-tenant SMM tool:** one approved app serves all your customers.
Their Pages/IG accounts connect to *your* app. This is the shared-app model and it works well on
Meta — which is why Meta is, counter-intuitively, one of the *easier* networks to operate at
scale once you are through review.

### 9.2 X (Twitter) — the expensive one

**This is the network most likely to break your unit economics.**

**Access tiers** `[K]`, **as of my May 2026 cutoff — X has repriced repeatedly and these are the
figures I hold with the least confidence in this document. VERIFY BEFORE BUDGETING.**

| Tier | Price | Write (posts) | Read | Notes |
|---|---|---|---|---|
| **Free** | $0 | ~**500 posts/month** (app-level) | essentially none (own account only) | Login with X; unusable for a real SMM product |
| **Basic** | **~$200/month** | ~**3,000 posts/mo per user**, ~50,000/mo per app | ~10,000–50,000 reads/mo | Entry point; caps bind fast at agency scale |
| **Pro** | **~$5,000/month** | ~**300,000 posts/mo** | ~1,000,000 reads/mo | Where a serious SMM tool lands |
| **Enterprise** | **from ~$42,000/month** | negotiated | negotiated | Annual contract, sales-led |

**Per-user rate limits** `[V]`: **300 posts / 3 hours per user** — verified from Postiz's source
comment explaining its `maxConcurrentJob = 10` politeness setting.

**Auth** `[V]`: Postiz uses **OAuth 1.0a** with HMAC-SHA1 and `authAccessType: 'write'`, and the
docs warn the app type **must be "Native App"** — *"Selecting `Web App, Automated App or Bot`
will cause authentication to fail with error code 32"* `[V]`. App permissions must be **"Read
and Write"** `[V]`. OAuth 2.0 with PKCE also exists for v2 endpoints `[K]`; Postiz notes OAuth1
"supports Twitter v2 also" `[V]`.

**Process** `[K]`: sign up at the developer portal → create a Project and App → select a paid
tier → configure permissions and callback. **There is no App Review in the Meta sense.** Access
is **purchased, not approved.** That is X's defining characteristic: no reviewer to convince,
but a monthly invoice that scales badly.

**Timeline** `[K]`: **hours to days.** By far the fastest network to reach production — and by
far the most expensive to *stay* in production.

**The structural problem for SMM tools** `[K]`, and this is the important part:

- X's Developer Agreement restricts building substitutes for the X client and restricts
  redistribution of API access.
- Under a shared-app model, **all of your customers' posts consume your single app's monthly
  write cap.** At Basic's ~50,000/month app-level cap, 500 customers averaging 100 posts/month
  exhausts it. You are then forced to Pro at ~$5,000/month, and eventually to Enterprise.
- **Therefore the industry is migrating to BYO-keys on X.** Ayrshare's **March 31, 2026**
  BYO mandate `[V]` is the proof point, and Postiz's BYO-by-design model `[V]` reaches the same
  place from the other direction.

**Plan for BYO on X from day one.** Concretely: build the UI to accept customer-supplied
consumer key/secret, document how a customer creates an X developer app, and price X as an
*optional, customer-provisioned* channel. Do not put X in your base bundle on the assumption you
can absorb its cost.

**Rejection / suspension reasons** `[K]`: automated engagement (bulk follow/unfollow, auto-like,
auto-reply at volume) is the fastest route to app suspension; duplicate/near-duplicate content
across many accounts; exceeding tier caps repeatedly; reselling API access. X enforces by
**suspension without warning and with a poor appeals process** — the reputational risk is that
your app key dies and *every customer's* X posting stops simultaneously. BYO-keys also
usefully contains this blast radius.

### 9.3 LinkedIn — the slowest, and the one with the silent trap

**Products and what they gate** `[K]`:

| Product | Self-serve? | Grants | Needed for |
|---|---|---|---|
| Sign In with LinkedIn using OpenID Connect | **Yes** | `openid`, `profile`, `email` | identity only |
| **Share on LinkedIn** | **Yes** | `w_member_social` | posting as the **member** |
| **Community Management API** | **No — application** | `r_organization_social`, `w_organization_social`, `rw_organization_admin` | posting as an **organization/Page**, org comments, org analytics |
| **Marketing Developer Platform (MDP)** | **No — application** | Advertising scopes + **refresh tokens** | ads, and *practically*, durable auth |
| Advertising API | **No — application** | campaign management | ads |

Corroboration `[V]`: n8n ships a **separate `LinkedInCommunityManagementOAuth2Api` credential**
distinct from `LinkedInOAuth2Api` — confirming Community Management is a distinct approval track
with distinct scopes.

**The token-refresh trap — the single highest-value warning in this document.**
Postiz's LinkedIn setup doc states verbatim `[V]`:

> *"It is important to request the Advertising API permissions and fill up the request form, or
> you will not have the ability to refresh your tokens."*

`[K]` LinkedIn access tokens last **~60 days**; refresh tokens (~365 days) are **only issued to
applications approved for the Marketing Developer Platform / Advertising API**. Without that
approval, **every customer must manually re-authorize LinkedIn every 60 days, forever.**

Consequences if you miss this: silent scheduled-post failures two months after onboarding;
support load; churn concentrated exactly at the point where a customer has just started
trusting you. **If LinkedIn matters to your product, apply for MDP on day one, before you need
it** — it is the longest lead-time item in the entire program.

**Prerequisites** `[K]`: a **LinkedIn Company Page** for your business, **verified**, with you
as an admin; the developer app is created under and permanently bound to that Page. Then:
complete app profile, add products, and for gated products submit the access request form
(company details, product description, use case per scope, live demo URL or video, expected
volumes, data-handling description).

**Timeline** `[K]`: Sign In + Share on LinkedIn: **same day.** Community Management API:
**2–8 weeks.** MDP: **4–12 weeks**, frequently longer, and *silence is a common outcome* —
applications go unanswered rather than rejected, with no queue visibility and no SLA.

**Cost** `[K]`: $0 in fees. The cost is elapsed time and the ~30–50% chance you must reapply.

**Rejection reasons** `[K]`:

1. **"Duplicates existing LinkedIn functionality"** — the most common and most frustrating.
   A generic "schedule posts to LinkedIn" pitch competes with LinkedIn's own scheduler. **Frame
   the application around what LinkedIn cannot do**: cross-network orchestration, agency
   multi-client approval workflows, compliance archiving, unified analytics.
2. **No live product** — LinkedIn wants a working URL, not a mockup. Chicken-and-egg: build
   member-level posting on the self-serve `w_member_social` scope first, launch, *then* apply for
   org-level access with a real product to point at.
3. **Unverified or missing Company Page.**
4. **Scope over-request** — asking for advertising scopes with no advertising feature.
5. **Vague use case** — LinkedIn's reviewers reject generic marketing language. Be specific
   about endpoints, volumes, and the user problem.
6. **Consumer/growth-hacking positioning** — anything resembling automated connection requests,
   scraping, or engagement automation is an instant no and may endanger your existing access.

**Rate limits** `[K]`: per-application and per-member daily quotas, published per endpoint in
LinkedIn's docs; order of magnitude ~150 posts/day/member and ~100k/day/app. **`[U]` for exact
current values.**

**Versioning tax** `[V]`: LinkedIn uses a **monthly version header** — Postiz sends
`LinkedIn-Version: 202601` (and `202306` on some calls) plus
`X-Restli-Protocol-Version: 2.0.0`. Versions are supported roughly 12 months. **You will bump
this header on a schedule, forever**, and the two different values in one codebase `[V]` show
how that decays in practice.

**Implementation gotcha** `[V]`: video uploads are **chunked in 2 MB parts, each PUT separately
with ETags collected for `finalizeUpload`**; and status polling is asymmetric — *"videos can be
polled by any token, images and documents only by organization tokens"*, so member-token flows
must fall back to fixed grace-period waits. Also `[V, Upload-Post]`: **LinkedIn photos support
only public visibility due to API constraints.**

### 9.4 TikTok — the hardest audit, and it is a UI audit

**Products** `[K]`:

| Product | Purpose | Gate |
|---|---|---|
| **Login Kit** | OAuth identity | Self-serve after app approval |
| **Content Posting API** | Publish video/photo | **Audit required for public posting** |
| **Display API** | Read user's own public videos | Approval for `video.list` |
| **Research API** | Bulk public data | **Accredited non-commercial academics only, US/EU** — closed to you |
| Data Portability API | User data export | Regional/regulatory |

**Two posting modes** `[K/V]`:

- **DIRECT_POST** — publishes to the creator's public profile. **Requires audit.**
- **UPLOAD (inbox/draft)** — lands in the creator's TikTok inbox; they finish posting in-app.
  Available unaudited, but Postiz's source confirms that in UPLOAD mode the AI-disclosure, duet,
  stitch, comment, music, and branding toggles are **silently discarded** `[V]`.

**Unaudited restrictions — verified** `[V]`, Postiz TikTok docs: *"Unaudited apps face
restrictions — posts forced to private visibility, limited to 5 users per 24 hours, requiring
private accounts."* And in source `[V]`: `"App not approved for public posting, contact
support"`, `"Unaudited client can only post to private accounts"`.

**Scopes** `[V]`: source requests `video.list`, `user.info.basic`, `video.publish`,
`video.upload`, `user.info.profile`, `user.info.stats`; setup docs specify `user.info.basic`,
`video.create`, `video.publish`, `video.upload`, `user.info.profile`.

**The audit is a UX compliance review, not an API test.** `[K]` To pass, your product must
demonstrably:

1. **Display creator info** fetched from `/v2/post/publish/creator_info/query/` — nickname,
   avatar, and the creator's *allowed* privacy options — before posting `[V, endpoint confirmed]`.
2. **Let the user explicitly select a privacy level** (public / friends / private) — never
   default silently.
3. **Expose interaction toggles**: allow comment, allow duet, allow stitch — and **respect the
   creator's account-level restrictions** returned by `creator_info`.
4. **Provide branded-content and "your brand" disclosure toggles**, with the correct mutual
   constraints between them.
5. **Provide an AI-generated-content disclosure toggle.**
6. **Show TikTok's Music Usage Confirmation** text.
7. **Comply with TikTok's Content Sharing Guidelines** on attribution and branding.

**This is exactly the field list Blotato requires** `[V]`: `tiktokPrivacyLevel`,
`tiktokDisabledComments`, `tiktokDisabledDuet`, `tiktokDisabledStitch`, `tiktokIsBrandedContent`,
`tiktokIsYourBrand`, `tiktokIsAiGenerated`. And Upload-Post's `[V]`: `privacy_level`,
`disable_duet`, `disable_comment`, `disable_stitch`. **Two independent audited vendors converge
on the same field set — treat it as the specification.**

**Other requirements** `[V/K]`: app registered at `developers.tiktok.com/apps`; **Terms of
Service and Privacy Policy hosted on a public HTTPS domain you control** `[V]`; platform "Web";
**domain/URL ownership verification** `[K]`; client id 16 chars / secret 32 chars `[V]`; and —
operationally critical — **all media must be publicly reachable over HTTPS; "localhost or
private routes will fail"**, so a CDN such as Cloudflare R2 is effectively mandatory `[V]`.

**Timeline** `[K]`: **3–10 weeks**, with rejections common on the first attempt because the
compliance UI is incomplete. **Cost:** $0 in fees.

**Rate limits** `[K]`: the publish-init endpoints are limited on the order of **~6 requests per
minute per user access token**, with `creator_info` somewhat higher. **`[U]` for exact current
values — verify.** Postiz polls status ~27 × 20 s ≈ 9 minutes with an 8-minute activity timeout
`[V]`; chunks must be **5–64 MB**, single-chunk under 64 MB, multi-chunk at 10 MB `[V]`.

**Rejection reasons** `[K]`: missing creator-info display; privacy selector absent or defaulted;
missing branded-content or AI-disclosure toggles; ToS/Privacy Policy not reachable or not on
your domain; demo video doesn't show the compliance UI; app category ambiguous; unverified
business identity.

**Strategic note.** TikTok is the network where the audit most directly *dictates your product
UI*. Design the composer for TikTok's requirements from the start — retrofitting seven
disclosure controls into a shipped multi-network composer is genuinely painful, and doing it
under audit-rejection pressure is worse.

---

### 9.5 YouTube (Google) — two independent gates, both slow

YouTube uniquely requires you to pass **two unrelated review processes**. Teams routinely clear
one and are blocked by the other.

**Gate 1 — Google OAuth verification (protects the user's Google account).** `[K]`

YouTube scopes are classified **sensitive**. Postiz requests `youtube`, `youtube.force-ssl`,
`youtube.readonly`, `youtube.upload`, `youtubepartner`, `yt-analytics.readonly`, plus
`userinfo.profile`/`userinfo.email` `[V]`.

- **Unverified apps are capped at 100 users** and show an "unverified app" interstitial.
- Verification requires: a **verified domain** (Search Console), a **privacy policy on that
  domain** that specifically addresses Google user data, a homepage explaining the app, an
  accurate OAuth consent screen, and a **demo video showing the OAuth consent screen and each
  requested scope in use**.
- **Timeline: 2–6 weeks typical, occasionally months.**
- **Important clarification:** the **CASA third-party security assessment** (~$10k–$75k/yr via
  approved assessors) applies to **restricted** scopes — Gmail, Drive. **YouTube scopes are
  sensitive, not restricted, so CASA is normally NOT required.** `[K, medium confidence —
  verify before budgeting, because getting this wrong in either direction is a five-figure
  error.]` Note that `business.manage` for Google Business Profile `[V]` follows the same
  sensitive-scope path.

**Gate 2 — YouTube API Services compliance audit + quota extension (protects YouTube).** `[K]`

- **Default quota: 10,000 units/day per project.**
- **`videos.insert` costs 1,600 units** → **~6 uploads/day, total, across all your customers.**
- `search.list` = 100 units; most `list` calls = 1 unit; `thumbnails.set` = 50 units.
- More quota requires the **"YouTube API Services — Audit and Quota Extension"** form: screenshots
  of your entire UI, description of how you display YouTube data, confirmation of branding and
  attribution compliance, data-retention answers.
- **Timeline: 4 weeks to several months.** Outcomes are frequently *partial* grants.

Postiz's source reflects the pain directly `[V]`: `"YouTube has strict upload quotas"`,
`"You have reached your daily upload limit, please try again tomorrow."`, and
`"Your account is not verified...we could not set the thumbnail."` — the last being an
**end-user account property** you cannot fix, only explain.

**Setup requirements** `[V, Postiz docs]`: Google Cloud project; OAuth client of type "Web
application"; **enable YouTube Data API v3 + YouTube Analytics API + YouTube Reporting API**;
add yourself as a test user. For **Brand Accounts under Google Workspace**, mark the app trusted
in Admin settings and wait **"at least 5 hours"** for propagation `[V]`.

**Implementation** `[V]`: resumable upload to
`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable`, **8 MB chunks**,
4-minute batch timeout, and the crucial semantic: *"YouTube only creates the video resource when
the final byte of the session is received."*

**Rejection reasons** `[K]`: privacy policy not on the verified domain or silent on Google data;
demo video omits the consent screen or a requested scope; scopes broader than the demonstrated
feature (asking for `youtubepartner` without a partner feature is a red flag); for the quota
audit — non-compliant display of YouTube data, missing attribution, or an inability to explain
retention.

**Planning consequence:** at default quota, YouTube is **not** a viable bundled channel. Either
secure a quota extension before launch, or gate YouTube behind a higher plan tier with an
explicit per-day upload cap surfaced in your UI.

### 9.6 Pinterest — the quiet gate

`[K]` Pinterest v5 has two access levels:

| Level | Who | Limits |
|---|---|---|
| **Trial access** (default) | any registered app | **Only a small allowlist of accounts** (the app owner + a handful of explicitly added test users); reduced rate limits |
| **Standard access** | after review | production use across arbitrary users |

**Verified** `[V, Postiz docs]`: requires a **Pinterest Company (business) Account**; create the
app at `developers.pinterest.com/apps/`, "complete all required fields and **await approval**."

**Scopes** `[V]`: `boards:read`, `boards:write`, `pins:read`, `pins:write`,
`user_accounts:read`. **All endpoints are v5** `[V]`: `/v5/oauth/token`, `/v5/user_account`,
`/v5/boards?page_size=250`, `/v5/media`, `/v5/pins`, `/v5/pins/{id}/analytics`,
`/v5/user_account/analytics`.

**Timeline** `[K]`: **2–6 weeks**, opaque. Pinterest's developer relations is thin; applications
sometimes require follow-up through support to get looked at.
**Cost:** $0. **Rate limits** `[K]`: order of **1,000 calls/hour per app per user token** on
most v5 endpoints; **`[U]` for exact current values.** Postiz sets `maxConcurrentJob = 3` with
the comment *"Pinterest has more lenient rate limits"* `[V]`.

**Rejection reasons** `[K]`: personal rather than business account; vague use case; no live
product; requesting ads scopes without an ads feature. **Analytics constraint** `[V]`: pin and
account analytics cover only the **last 90 days** (Postiz uses 89 for a UTC safety margin) — so
you cannot offer long-range Pinterest reporting without warehousing the data yourself daily.
That is a real product requirement, discovered here from source.

### 9.7 Reddit — cheap to start, legally awkward to scale

`[K]`, and this is the network where my pricing confidence is lowest because Reddit's commercial
terms are negotiated rather than published.

**Access model:**

| Use | Terms |
|---|---|
| Unauthenticated | ~10 queries/minute |
| **Registered OAuth client, non-commercial** | **~100 queries/minute per client_id**, free |
| **Commercial** | Requires a **Reddit Data API agreement**; reported rate **~$0.24 per 1,000 API calls**; enterprise contracts negotiated directly |

The $0.24/1,000 figure is the number publicly disclosed during the 2023 third-party-app
controversy `[K]`. Whether it is still the operative commercial rate in 2026: **`[U]` — verify
directly with Reddit.**

**Requirements** `[K]`: register at `reddit.com/prefs/apps`; a **descriptive User-Agent** of the
form `platform:app_id:version (by /u/username)` — Reddit actively blocks generic agents; honor
`X-Ratelimit-Used` / `-Remaining` / `-Reset` headers.

**Scopes and endpoints** `[V]`: `read`, `identity`, `submit`, `flair`;
`www.reddit.com/api/v1/access_token`, `/api/v1/authorize`; `oauth.reddit.com/api/v1/me`,
`/api/media/asset`, `/api/submit`, `/api/comment`, `/user/{username}/submitted`,
`/subreddits/search`, `/{subreddit}/about`, **`/api/v1/{subreddit}/post_requirements`**,
`/{subreddit}/api/link_flair_v2`.

**Timeline** `[K]`: **same day** for the free tier. Commercial agreement: weeks, sales-led.

**The real obstacle is not the API — it is Reddit's culture and anti-spam machinery** `[K]`:

- Accounts with low karma or new age are auto-filtered by most large subreddits.
- Many subreddits ban link posts, require flair, enforce minimum account age, or ban
  self-promotion outright.
- Cross-posting identical content to many subreddits is the canonical spam signature and gets
  accounts shadowbanned — invisibly, with the API still returning success.

This is why Postiz calls `post_requirements` and `link_flair_v2` before submitting `[V]`, and
why it holds `maxConcurrentJob = 1` with `timer(5000)` between subreddit submissions `[V]`.
**If you support Reddit, you must pre-validate per subreddit and you must detect shadowbans**
(by re-fetching the submission from a logged-out context). Nobody in the vendor cohort appears
to do the latter — see §11.

### 9.8 Snapchat — treat as unavailable

`[K]`, **not verifiable this session; stated with deliberate caution.**

| Surface | Third-party access |
|---|---|
| **Marketing API** (`adsapi.snapchat.com`) | Available — **but it is an ads API**: campaigns, ad squads, creatives, audiences. Requires a Snap Business account, an app in the Snap developer portal, and organization-level approval. |
| **Creative Kit** | Lets a **mobile app on the user's device** share content into Snapchat's camera/editor. Requires the user to be present; not server-side scheduling. |
| **Public Profile / Saved Stories / Spotlight publishing** | Not generally available to third-party SMM tools; limited partner arrangements exist. |
| **Content API (Discover)** | Invite-only media-partner program. |

**Practical conclusion: there is no general-purpose organic Snapchat publishing API for a
third-party SMM tool.** `[K]` Ayrshare lists Snapchat among its networks `[V]`, which means
either a partner grant or a narrow surface — **`[U]`, and it is worth a direct question to
them**, because if Ayrshare genuinely has organic Snapchat write access, that is the single most
differentiated capability in the entire vendor cohort.

**Recommendation:** do not promise Snapchat. If a customer demands it, the honest answer is
"Snapchat does not offer this to third parties." Competitors claiming Snapchat organic are
either (a) partner-approved, (b) doing Creative Kit hand-off, or (c) automating a browser.

### 9.9 The networks with no gate at all

`[K/V]` — these are free wins and should be in your v1 precisely because they cost nothing to
approve:

| Network | Auth | Review | Notes |
|---|---|---|---|
| **Bluesky** | **App password** or AT Protocol OAuth `[V]` | **None** | Custom PDS supported; **validate the URL — SSRF risk** `[V]`. Video via `video.bsky.app` `[V]`. `[K]` ~5,000 points/hour, 35,000/day; a post costs 3 points |
| **Mastodon** | Per-instance app registration `[V]` | **None** | Register an app per instance; trivial. 500-char default `[V, Mixpost]` |
| **Telegram** | **Bot token** `[V]` | **None** | Single shared bot; chat ID as account id `[V]`. 4,096 chars, 10 media/group `[V]` |
| **Discord** | Bot / webhook `[V]` | Verification only at 100+ servers `[K]` | Free |
| **Slack** | OAuth2 / app `[V]` | Only for public directory listing `[K]` | Free |
| **Nostr, Lemmy, Farcaster** | Keys / instance auth `[V]` | **None** | Long-tail; cheap to add `[V]` |
| **Medium, Dev.to, Hashnode, WordPress, Listmonk** | API token `[V]` | **None** | Blog/newsletter targets; trivial `[V]` |
| **Tumblr, Dribbble, VK, Twitch, Kick** | OAuth2 `[V]` | Light/none `[K]` | Long-tail `[V]` |

**Google Business Profile is the exception hiding in this group** `[K]`: the Business Profile
APIs require **allowlisting via an access request form, and default quota is effectively zero
until approved**. Timeline days-to-weeks. Postiz confirms the four-host API surface and the
`business.manage` scope `[V]`. GBP is high-value for local/multi-location businesses and is
under-served by competitors — worth the form.

### 9.10 Master table — production access at a glance

| Network | Gate type | Time to production | Fee | Hardest artifact | Confidence |
|---|---|---|---|---|---|
| **Bluesky / Mastodon / Telegram / Discord / Slack / Nostr / Lemmy / blogs** | none | **hours** | $0 | — | High `[V/K]` |
| **X** | **payment** | **hours–days** | **~$200 / ~$5,000 / ~$42,000+ per month** | budget approval | **Low on $ `[K]`** |
| **Reddit** | terms | days (free) / weeks (commercial) | $0 free; ~$0.24/1k calls commercial `[K]` | commercial agreement | Medium |
| **Google Business Profile** | allowlist | **days–weeks** | $0 | access request form | Medium `[K]` |
| **Pinterest** | Trial → Standard review | **2–6 weeks** | $0 | business account + live product | Medium `[K]` |
| **Meta (FB/IG/Threads)** | Business Verification + App Review + DPA | **6–14 weeks** | $0 | **screencast of complete flow** | High `[K/V]` |
| **TikTok** | Audit (UI compliance) | **3–10 weeks** | $0 | **7-control compliance UI** | High `[V/K]` |
| **YouTube** | OAuth verification **+** quota audit | **6–16 weeks** | $0 (CASA likely N/A) | verified domain + full-UI audit | Medium-High `[K]` |
| **LinkedIn** | MDP / Community Mgmt application | **4–12+ weeks, may never answer** | $0 | **differentiated use case** | High `[K/V]` |
| **Snapchat (organic)** | — | **not available** | — | — | Medium `[K]` |
| **TikTok Research API** | academic only | **not available commercially** | — | — | High `[K]` |

### 9.11 The recommended sequencing plan

Because these run in parallel and have wildly different lead times, the correct plan is
**longest-lead-first**, and it starts before your product is finished.

**Month 0 — before writing integration code**
- Incorporate / confirm the legal entity; get incorporation documents in order.
- Buy the domain; verify it in Google Search Console.
- Publish a **real privacy policy and ToS** on that domain, explicitly addressing Meta, Google,
  TikTok, and LinkedIn platform data, plus a **data-deletion endpoint**.
- Create the **LinkedIn Company Page** and verify it.
- Start **Meta Business Verification** (it blocks everything else on Meta).
- Create a Pinterest **business** account.

**Month 1 — build the free tier, apply for the slow ones**
- Ship Bluesky, Mastodon, Telegram, Discord, Slack + blog targets. **You now have a live,
  demonstrable product** — which is the artifact every remaining application requires.
- Ship **LinkedIn member posting** on self-serve `w_member_social`.
- **Submit the LinkedIn MDP / Community Management application now.** Longest lead time; apply
  the moment you have a URL to point at.
- **Submit the Google Business Profile access request.**

**Month 2 — Meta and the compliance UI**
- Build Facebook Pages + Instagram (**both** the FB-linked and standalone Instagram Login paths).
- Build the **TikTok compliance UI** to the seven-control spec in §9.4 — before submitting.
- Record Meta screencasts: full login → consent (scopes visible) → permission exercised →
  user-visible result, one per permission.
- **Submit Meta App Review.**

**Month 3 — TikTok, YouTube, Pinterest**
- **Submit the TikTok audit** with the compliance UI recorded.
- **Submit Google OAuth verification** (demo video showing consent screen + each scope).
- **Submit Pinterest Standard access.**
- Provision a CDN (Cloudflare R2 or equivalent) — **mandatory** for TikTok media `[V]`.

**Month 4–6 — iterate rejections, then quota**
- Expect and budget for **one to two rejection cycles per network**. Turnaround per cycle is
  1–3 weeks. This is normal; it is not a signal of failure.
- Once Google OAuth verification lands, **submit the YouTube quota extension** (it wants
  screenshots of the finished UI, so it must come last).
- Decide the **X posture**: BYO-keys (recommended) vs. paid tier, and build the BYO UI.

**Throughout**
- Track **Meta's Data Protection Assessment** as a recurring annual obligation.
- Calendar the **LinkedIn version header** bump and Meta Graph version deprecations.

**Interim strategy while you wait.** Ship on **Ayrshare or Upload-Post** (both offer white-label
multi-tenant JWT linking `[V]`) so the product is in-market and generating the usage evidence
your applications need, then migrate network-by-network as your own approvals land. Design your
internal provider interface — modeled on Postiz's `IAuthenticator` / `ISocialMediaIntegration` /
three-state `PendingCheckResponse` `[V]` — so that swapping a vendor for a direct integration is
a one-adapter change. **The abstraction vendor is scaffolding, not foundation. Build the seam
in from day one.**

---

## 10. Consolidated technical reference

### 10.1 Per-network engineering constraint sheet

Everything in this table is `[V]` unless marked. This is the sheet to hand an engineer on day 1.

| Network | Auth | Publish model | Chunking | Concurrency | Hard limits |
|---|---|---|---|---|---|
| **X** | OAuth 1.0a HMAC-SHA1, "Native App", Read+Write | direct + async media | **1 MB** chunks | **10** | 300 posts/3h per user |
| **Instagram (FB)** | OAuth2, Graph v20–v22 | **container → poll READY → media_publish** | n/a (URL-based) | `[U]` | **25 posts/24h**; 1920×1080 max img |
| **Instagram (standalone)** | OAuth2 `enable_fb_login=0`, graph.instagram.com v21 | same | n/a | `[U]` | token 58 days, `ig_refresh_token` |
| **Facebook** | OAuth2, Graph v20 / insights v23 | feed/photos direct; video `upload_phase=start\|finish` | n/a | **500** | err 1390008 velocity, 1404112 lockout, 4 MB photos |
| **Threads** | OAuth2, graph.threads.net v1.0 | **container → poll → threads_publish** | n/a | **2** | 250 posts + 1,000 replies/24h `[K]` |
| **LinkedIn** | OAuth2, `LinkedIn-Version: 202601` | initializeUpload → PUT → finalizeUpload → /rest/posts | **2 MB** parts + ETags | `[U]` | token 60d, **refresh only with MDP**; photos public-only |
| **TikTok** | OAuth2, open.tiktokapis.com v2 | init → chunked upload → **poll status ~9 min** | **5–64 MB** (10 MB multi) | `[U]` | **unaudited: private, 5 users/24h**; ~6 req/min `[K]`; media must be public HTTPS |
| **YouTube** | OAuth2 (sensitive scopes) | **resumable session**; resource created on final byte | **8 MB** | **200** | **10,000 units/day; insert = 1,600** `[K]` |
| **Pinterest** | OAuth2, all **v5** | media upload → poll → create pin | n/a | **3** | 90-day analytics window; ~1,000 calls/h `[K]` |
| **Reddit** | OAuth2, oauth.reddit.com | media asset → submit | n/a | **1** | 100 QPM `[K]`; +5 s between subreddits; **pre-check `post_requirements` + flair** |
| **Google Business** | OAuth2 `business.manage`, **4 API hosts** | localPosts v4 | n/a | **3** | `RESOURCE_EXHAUSTED`; **location-level analytics only** |
| **Bluesky** | **app password** / OAuth; custom PDS | blob upload; video via video.bsky.app | n/a | **2** | poll 18 × 30 s; **SSRF-validate PDS URL** |
| **Telegram** | **bot token** | direct send | n/a | **3** | 4,096 chars; 10 media/group |
| **Mastodon** | per-instance OAuth2 | direct | n/a | `[U]` | 500 chars default |

### 10.2 The abstraction contract you should build

Synthesized from Postiz's interface `[V]`, Ayrshare's method set `[V]`, and Upload-Post's
parameter model `[V]` — this is the union of what the three most complete implementations agree
on:

```
Auth
  generateAuthUrl(provider, state) -> url
  authenticate(provider, code)     -> { accessToken, refreshToken, expiresIn, profile }
  refreshToken(provider, token)    -> AuthTokenDetails
  customFields(provider)           -> [{name, type, validation}]   // Bluesky, Mastodon, WP

Publish  (three-state — non-negotiable)
  validate(provider, postDetails)  -> [violations]                 // BEFORE queueing
  postPending(provider, details)   -> { jobId, state: 'pending' }
  checkStatus(provider, jobId)     -> 'pending' | 'ready' | 'completed'
  finalize(provider, jobId)        -> { postId, url }
  comment(provider, postId, text)  -> { commentId }                // first-comment pattern

Idempotency  (copy Upload-Post)
  every publish carries Idempotency-Key; collapse duplicates within 24h

Destination discovery  (do not skip)
  listDestinations(provider)       -> pages | boards | subreddits | locations | channels
  destinationRules(provider, dest) -> { flairRequired, allowedTypes, charLimit, ... }

Capability model  (drives the composer UI)
  capabilities(provider) -> {
    charLimit, maxImages, maxVideos, mixedMedia: bool,
    requiredFields: [...],        // TikTok's 7, YouTube's 3
    privacyOptions: [...], mediaTypes: [...], analyticsWindowDays
  }

Errors  (a real taxonomy, not strings)
  RefreshToken | NotEnoughScopes | RateLimited(retryAfter) |
  BadBody(userMessage) | PlatformPolicy(userMessage) | QuotaExhausted(resetAt)
```

**The two things most implementations get wrong:** (1) they model publish as synchronous, and
(2) they treat capability differences as UI special-cases instead of data. Make `capabilities()`
a first-class, per-provider data structure and your composer, validator, and scheduler all
derive from one source of truth. Mixpost's `config/mixpost.php` `[V]` is a small but clean
example of this idea, and Blotato's per-target required/optional field lists `[V]` are the
shape to aim for.

---

## 11. Gaps — what nobody in this market does well, or at all

Ranked by a rough product of (unmet demand × difficulty for incumbents to copy).

**G1. Approval-as-a-service for BYO-app operators.** `[V-grounded]`
Postiz has 34.5k stars and requires every self-hoster to register 14+ developer apps and
personally survive Meta App Review, the TikTok audit, and LinkedIn MDP `[V]`. Essentially none
of them will. Nobody sells "we get you approved" — the compliance UI kit, the screencast
templates, the written justifications, the DPA answers, the rejection-loop management. This is
a services-plus-software business hiding in plain sight, and it is directly adjacent to the
asset you must build anyway.

**G2. There is no permissive, many-network OSS publishing core.** `[V]`
Postiz = AGPL + 34 networks. Mixpost Lite = MIT + 4 networks. The MIT-and-complete quadrant is
empty. Releasing a genuinely permissive multi-network core would capture the entire developer
mindshare that Postiz currently holds hostage with AGPL — and would seed demand for G1.

**G3. Publishing and listening are never sold together.** `[V]`
Publishers (Ayrshare, Blotato, Upload-Post) do first-party writes. Data providers (Phyllo,
ScrapeCreators, EnsembleData, Apify, Bright Data) do third-party reads. Unified.to, which has
industrialized the unified-API pattern across 15+ verticals, **has no social vertical at all**
`[V]`. One contract, one auth model, one meter, covering permissioned publish + permissioned
analytics + compliant competitive data, does not exist.

**G4. Token lifecycle is treated as the customer's problem.** `[V-grounded]`
LinkedIn dies at 60 days without MDP `[V]`; Instagram standalone at 58 days `[V]`; Meta tokens
expire on password change (error 490) `[V]`; X keys get suspended. Nobody sells proactive token
health: expiry prediction, staged re-auth nudges before failure, per-customer connection-health
dashboards, or automatic quarantine of a dying connection so it fails loudly at connect time
rather than silently at publish time. **This is the #1 cause of "my scheduler stopped working"
churn and it is entirely preventable.**

**G5. Pre-flight quota and rate-limit simulation.** `[V-grounded]`
The data exists — 25 IG posts/24h, 10,000 YouTube units/day, 300 X posts/3h, 6 TikTok req/min,
Reddit at 1 concurrent `[V/K]`. No product tells a user *before* they schedule: "this calendar
will breach Instagram's daily cap on the 14th" or "these 40 videos exceed your YouTube quota by
6×." Every tool discovers the limit by hitting it. A quota-aware scheduler is a genuinely novel
and immediately legible feature.

**G6. Idempotency and duplicate-post prevention.** `[V]`
Only Upload-Post documents an `Idempotency-Key` `[V]`. Postiz defends with an 8-minute activity
timeout `[V]`. Everyone else appears to rely on hope. Duplicate posts are the most
reputationally damaging failure in this category — a customer's audience sees the mistake.

**G7. Shadowban and silent-failure detection.** `[V-grounded]`
Reddit shadowbans return HTTP 200 `[K]`. Instagram flags posts as spam via error 2207001
*sometimes*, and silently suppresses reach other times `[V]`. LinkedIn and TikTok deprioritize
without signal. **No vendor verifies from a logged-out context that a published post is actually
publicly visible.** This is technically straightforward and would be a headline feature.

**G8. Machine-readable destination rules beyond Reddit.** `[V]`
Reddit exposes `post_requirements` and `link_flair_v2`, and Postiz uses them `[V]`. No equivalent
exists for "this IG account is restricted from music," "this LinkedIn page requires admin
approval," "this TikTok creator disallows duet." Postiz *fetches* TikTok `creator_info` `[V]` —
the pattern is there; nobody has generalized it into a pre-flight destination-rules engine.

**G9. Snapchat organic, and TikTok Research API.** `[K]`
Genuinely closed. Not a backlog item — a permanent constraint to communicate honestly. Any
competitor claiming these deserves a hard question about method.

**G10. Cross-network unified inbox.** `[V/K]`
Ayrshare has messages/auto-response `[V]`; Blotato and Upload-Post have none `[V]`. Meta's
Messenger/IG messaging APIs have their own severe eligibility gates. Nobody offers a genuinely
unified, API-compliant DM inbox across IG, FB, X, TikTok, and LinkedIn.

**G11. Transparent per-network reliability reporting.** `[U-grounded]`
I could not find a single vendor publishing per-network success rates, p95 publish latency, or
an incident history broken out by platform. Buyers evaluate on network *count*, because that is
the only number available. **Publishing honest per-network reliability metrics would be a
differentiator precisely because it is the number a serious buyer wants and nobody discloses.**

**G12. Automation-platform coverage for the networks that matter.** `[V]`
n8n has **no Instagram, TikTok, Pinterest, Threads, or Bluesky nodes** `[V]`. Zapier/Make lost
meaningful X coverage after the 2023 repricing `[K]`. The automation-native buyer — a large,
technically capable, high-intent segment — is served only by third-party vendor nodes. Shipping
a first-class n8n node, Make app, Zapier integration, Pipedream component (open PR, near-zero
cost `[V]`), and MCP server is a cheap and currently under-contested distribution play.

---

## 12. Strategic implications

**12.1 The moat is the approval portfolio, and it compounds.**
Code is commodity — Postiz gives 34 providers away under AGPL `[V]`. What cannot be forked is an
audited TikTok client, Meta Advanced Access with a passed DPA, a LinkedIn MDP grant with working
refresh tokens, a YouTube quota extension, Pinterest Standard, and GBP allowlisting. That
portfolio takes 4–9 months, cannot be bought, and gets *harder* to assemble over time as
platforms tighten. **Start it in month 0, treat it as the primary project plan, and treat the
software as the thing that fills the waiting time.**

**12.2 Assume the shared-app model erodes.**
Ayrshare's X BYO mandate `[V]` is the first domino. Design for a **hybrid credential model** —
platform-app by default, customer-app where required or preferred — from the first commit.
Retrofitting BYO into a shared-app architecture touches auth, storage, encryption, rate limiting,
and billing simultaneously.

**12.3 Buy scaffolding, build foundation.**
Ship on Ayrshare or Upload-Post's white-label JWT linking `[V]` to get to market while your own
approvals process. Put your own provider interface in front of it from day one — the Postiz
contract `[V]` is a proven shape. Migrate network-by-network as approvals land. The mistake is
letting a vendor's data model leak into your domain model.

**12.4 Sequence networks by gate cost, not by popularity.**
Free-and-instant (Bluesky, Mastodon, Telegram, Discord, Slack, blogs) → paid-instant (X, if you
take it) → short-review (Pinterest, GBP, Reddit) → long-review (Meta, TikTok, YouTube) →
indefinite (LinkedIn org). This ordering also produces the live product that the later
applications require as evidence — the sequence is self-bootstrapping if you follow it, and
deadlocked if you do not.

**12.5 The strongest differentiated positions available.**
Ranked by defensibility given what this research surfaced:
1. **Reliability and observability** (G4, G5, G6, G7, G11) — token health, quota simulation,
   idempotency, shadowban detection, published metrics. Unglamorous, deeply felt, and nobody is
   doing it. This is the strongest available position.
2. **Publish + permissioned analytics + compliant competitive data in one contract** (G3).
3. **Approval-as-a-service for the OSS long tail** (G1, G2) — monetizes the very asset in 12.1.
4. **Agent-native distribution** (G12) — real, but the least defensible; Upload-Post and
   ScrapeCreators are already executing it `[V]`.

**12.6 Do not build on scraping, and keep it at arm's length.**
Your approval portfolio (12.1) is worth more than any scraped dataset, and platform integrity
teams correlate traffic. Where you need competitive data, prefer **ad libraries** (public by
regulatory mandate) `[V]` and **permissioned creator data** (Phyllo) over organic scraping.
Never let scraped data share a code path with your first-party OAuth tokens.

---

## 13. Verification backlog — what to check before acting

Ordered by decision-impact. Each is a short task; none should take more than an hour.

| # | Item | Why it matters | Where |
|---|---|---|---|
| 1 | **X API tier prices and post caps** | Directly determines whether X is bundled or BYO; my lowest-confidence numbers | `docs.x.com` / developer portal |
| 2 | **Ayrshare current pricing** | Build-vs-buy baseline; the $149/$499 figures are `[K]` and likely stale | `ayrshare.com/pricing` |
| 3 | **Whether YouTube scopes require CASA** | A five-figure budget swing either way | Google OAuth verification docs |
| 4 | **Reddit commercial API rate today** | $0.24/1k is a 2023 figure | Reddit Data API terms / sales |
| 5 | **What Snapchat surface Ayrshare actually writes to** | If organic, it is the cohort's biggest differentiator | Ayrshare sales |
| 6 | **Late (getlate.dev) — everything** | Named competitor, zero verified data | `getlate.dev` |
| 7 | **"Lomi" — identity** | Could not identify at all; need a URL from you | — |
| 8 | **Blotato + Upload-Post pricing** | Interim-vendor selection | vendor sites |
| 9 | **Mixpost Pro pricing and network list** | Only MIT fork candidate | `mixpost.app/pricing` |
| 10 | **Postiz commercial/dual-license availability** | Single copyright holder ⇒ an exception is possible `[V]` | email the maintainer |
| 11 | **Current TikTok publish rate limits** | Capacity planning | `developers.tiktok.com` |
| 12 | **LinkedIn per-endpoint daily quotas** | Capacity planning | LinkedIn docs |
| 13 | **Phyllo/InsightIQ brand structure + pricing** | G3 partner or acquire target | `getphyllo.com` / `insightiq.ai` |
| 14 | **Zapier/Make current social connector lists** | G12 sizing | vendor directories |
| 15 | **Apify social actor names and per-result prices** | My actor URLs 404'd | `apify.com/store` |
| 16 | **Buffer developer program status** | Confirm it is closed | `buffer.com/developers` |

---

## 14. Sources

**Primary, fetched and read this session (2026-08-12) — all `[V]` claims trace here:**

- `github.com/gitroomhq/postiz-app` — README, LICENSE, `.env.example`
- `.../libraries/nestjs-libraries/src/integrations/integration.manager.ts`
- `.../integrations/social.abstract.ts`
- `.../integrations/social/social.integrations.interface.ts`
- `.../integrations/social/{tiktok,instagram,instagram.standalone,linkedin,x,youtube,pinterest,reddit,threads,facebook,bluesky,gmb,telegram}.provider.ts`
- `github.com/gitroomhq/postiz-docs` — `providers/` tree; `providers/{tiktok,x-twitter,linkedin,youtube,pinterest,instagram}.mdx`
- `github.com/inovector/mixpost` — README, `config/mixpost.php`, `src/SocialProviders/`, `src/Services/`
- `github.com/ayrshare` (org); `ayrshare/social-media-api` README; `ayrshare/ayrshare-social-media-api-claude-plugin`
- `github.com/PipedreamHQ/pipedream` — `components/` tree; `components/ayrshare/ayrshare.app.mjs`; `components/blotato/blotato.app.mjs`; `components/blotato/actions/create-post/create-post.mjs`
- `github.com/upload-post` (org); `upload-post-pip` README; `n8n-nodes-upload-post` README
- `github.com/n8n-io/n8n` — `packages/nodes-base/package.json` (node + credential manifest)
- `github.com/ComposioHQ/composio`
- `github.com/unified-to` (org); `unified-typescript-sdk` README
- `github.com/getphyllo` (org); `github.com/insightiq-ai` (org)
- `github.com/EnsembleData` (org); `ensembledata-python` README
- `github.com/scrapecreators` (org); `social-media-research-skills` README
- `github.com/bytebot-ai/bytebot`

**Blocked by egress policy this session** (all `[U]`/`[K]` gaps trace to these):
`developers.facebook.com`, `docs.x.com`, `developers.tiktok.com`, `developers.google.com`,
`developers.pinterest.com`, `www.ayrshare.com`, `docs.ayrshare.com`, `mixpost.app`,
`en.wikipedia.org`, `news.ycombinator.com`, `npmjs.com` (403), `api.github.com` (403),
GitHub code search (429). WebSearch budget exhausted (200/200) before task start.

**Knowledge cutoff for all `[K]` claims: May 2026.**

---

*End of document.*
