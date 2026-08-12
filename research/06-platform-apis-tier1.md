# 06 — Tier-1 Platform APIs: Engineering Spec

**Prepared:** 12 August 2026
**Scope:** Meta (Facebook Pages, Facebook Groups, Instagram via both login paths, Threads), X/Twitter API v2, LinkedIn (Member + Organization / MDP / Community Management), TikTok (Content Posting, Display, Business, Research), YouTube Data API v3 (+ Shorts, + Analytics/Reporting/Live), Pinterest API v5.
**Purpose:** The integration bible. What we can publish, what we cannot, what it costs, what breaks, and what forces the reminder-publish path.
**Companion docs:** `01-vista-social-full-audit.md` §3 (Vista's publishing matrix), `02-vista-social-deep-modules.md` §3.6–3.7 (tagging + caps), `05-competitors-dev-oss.md` (cost/timeline of production API access).

---

> ## ⛔ PROVENANCE WARNING — READ BEFORE USING ANY NUMBER IN THIS FILE
>
> **This document contains ZERO fetched sources.** No developer-portal page, changelog,
> pricing page, or reference doc was retrieved while writing it.
>
> The research pass that was supposed to produce this file could not run:
>
> | Blocker | Detail |
> |---|---|
> | **WebSearch** | Session budget **exhausted before this agent started** — 200/200 calls consumed by the agents that produced files 01–04. **Zero searches available.** |
> | **WebFetch** | Egress proxy returns `EGRESS_BLOCKED` for **every** host attempted, including the primary sources for this exact task: `developers.facebook.com`, `docs.x.com`, `developers.tiktok.com`, `developers.google.com`, `learn.microsoft.com`, `developers.pinterest.com`. A control fetch of `example.com` was **also blocked**, confirming this is a blanket egress denial and not a per-domain policy. |
>
> Everything below is **model recall with a May 2026 knowledge cutoff**, written against an
> August 2026 "today". There is therefore a **minimum 3-month blind spot**, and Meta/X/TikTok
> each typically ship at least one breaking change per quarter.
>
> ### Confidence tags — how much weight each claim can bear
>
> | Tag | Meaning | Typical drift risk |
> |---|---|---|
> | **`C1`** | Structural and slow-changing: endpoint families, OAuth flow *shape*, the two-step container publish model, what is categorically absent from an API. | Low. These have been stable 2–4 years. |
> | **`C2`** | Specific but drift-prone: exact scope strings, token TTLs, media constraints, quota costs, field names. | Medium. Verify before it becomes load-bearing. |
> | **`C3`** | Known-volatile or fuzzy recall: **all pricing**, all rate-limit numbers, all deprecation dates in the future, anything I hold conflicting values for. | High. **Treat as a hypothesis, never a fact.** |
> | **`UNVERIFIED`** | Genuinely unknown. Not a guess. Do not cite. | — |
>
> **Important asymmetry vs. file 04:** for *platform APIs*, `C1` claims carry real engineering
> weight — "Instagram has no Story-sticker API" and "LinkedIn has no webhooks" have been true
> for years and are safe to architect against. It is the `C2`/`C3` layer (exact byte limits,
> exact quota numbers, exact prices) that must be re-verified. **Architect from `C1`; do not
> hardcode `C2`/`C3`.**
>
> **§16 is a ready-to-execute verification plan** with the exact URLs to fetch, ordered by
> how much of the build they unblock. Run it before writing the publishing pipeline.

---

## Table of contents

1. [How to read this spec](#1-how-to-read-this-spec)
2. [Cross-platform master matrices](#2-cross-platform-master-matrices)
3. [Auth & token lifecycle — the comparison that drives our token vault](#3-auth--token-lifecycle)
4. [Publishing capability matrix](#4-publishing-capability-matrix)
5. [Media constraints matrix](#5-media-constraints-matrix)
6. [The impossibility matrix — what forces reminder publishing](#6-the-impossibility-matrix)
7. [Analytics, metrics and retention](#7-analytics-metrics-and-retention)
8. [Comments, DM and inbox](#8-comments-dm-and-inbox)
9. [Rate limits, quotas and cost](#9-rate-limits-quotas-and-cost)
10. [App review, verification and partner programs](#10-app-review-verification-and-partner-programs)
11. [Webhooks](#11-webhooks)
12. [Meta — deep dive](#12-meta--deep-dive)
13. [X / Twitter — deep dive](#13-x--twitter--deep-dive)
14. [LinkedIn — deep dive](#14-linkedin--deep-dive)
15. [TikTok — deep dive](#15-tiktok--deep-dive)
16. [YouTube — deep dive](#16-youtube--deep-dive)
17. [Pinterest — deep dive](#17-pinterest--deep-dive)
18. [Deprecation calendar & breaking-change watchlist](#18-deprecation-calendar--breaking-change-watchlist)
19. [Engineering implications for our build](#19-engineering-implications-for-our-build)
20. [Verification backlog](#20-verification-backlog)

---

## 1. How to read this spec

### 1.1 The three questions this document exists to answer

1. **Can we auto-publish format X to network Y?** → §4, §6.
2. **What will break, when, and how do we detect it?** → §3 (token expiry), §18 (deprecations).
3. **What does access actually cost in money and calendar time?** → §9, §10.

### 1.2 The single most important structural fact

**Every tier-1 platform except YouTube and Facebook Pages requires us to hold the post and
publish it ourselves at the scheduled moment.** Native "publish at time T" is a rarity:

| Platform | Native scheduling in the API? | Confidence |
|---|---|---|
| Facebook Pages (feed) | **Yes** — `scheduled_publish_time` + `published=false` | `C1` |
| Facebook Reels | **Yes** — `video_state=SCHEDULED` | `C2` |
| YouTube | **Yes** — `status.publishAt` (requires `privacyStatus=private`) | `C1` |
| Instagram (all formats) | **No** | `C1` |
| Threads | **No** | `C1` |
| X | **No** | `C1` |
| LinkedIn | **No** | `C1` |
| TikTok | **No** | `C1` |
| Pinterest | **No** (UI has scheduling; API does not expose it) | `C2` |

**Consequence:** our scheduler is the system of record for 7 of 9 surfaces. It must be
durable, timezone-correct, idempotent, and retry-safe, because there is no platform-side
safety net. A missed cron on Instagram is a missed post, full stop.

### 1.3 The second most important structural fact

**Three of the six vendors gate *public* posting behind a human review of our app**
(Meta App Review, TikTok content-posting audit, LinkedIn Community Management API
approval), and two of those also gate it behind **business verification of our legal
entity**. Access is a **calendar-time dependency measured in weeks-to-months**, not an
engineering task. See §10 and `05-competitors-dev-oss.md`.

---

## 2. Cross-platform master matrices

### 2.1 API surface at a glance

| | Meta / Facebook Pages | Meta / Instagram | Meta / Threads | X API v2 | LinkedIn | TikTok | YouTube | Pinterest |
|---|---|---|---|---|---|---|---|---|
| **Base host** | `graph.facebook.com` | `graph.facebook.com` *or* `graph.instagram.com` | `graph.threads.net` | `api.x.com` | `api.linkedin.com/rest` | `open.tiktokapis.com` + `business-api.tiktok.com` | `www.googleapis.com/youtube/v3` | `api.pinterest.com/v5` |
| **Protocol** | REST/Graph | REST/Graph | REST/Graph | REST | REST + Rest.li 2.0 | REST | REST | REST |
| **Versioning** | Path `/vNN.0`, ~quarterly, **2-yr support** | same | same | Path `/2`, no minor versions | Header `LinkedIn-Version: YYYYMM`, **12-mo support** | Path `/v2/` (open) `/v1.3/` (business) | Path `/v3` (stable since 2015) | Path `/v5` |
| **Auth** | OAuth2 + Page/System-User tokens | OAuth2 (two distinct paths) | OAuth2 | OAuth2 PKCE + OAuth1.0a legacy | OAuth2 (3-legged + client_credentials) | OAuth2 + PKCE | Google OAuth2 | OAuth2 |
| **Paid access?** | No | No | No | **Yes — $0–$42k+/mo** | No (approval, not payment) | No | No (quota, not payment) | No |
| **Webhooks** | Yes, rich | Yes, rich | Partial | **Enterprise only** | **None** | Narrow (publish status) | PubSubHubbub (uploads only) | None / UNVERIFIED |
| **Sandbox / test mode** | Test users + dev mode | Dev mode | Dev mode | No true sandbox | Dev tier throttles | Sandbox app + `SELF_ONLY` | Test channel (manual) | Trial access |

`C1` for host/protocol/versioning shape. `C2` for support-window lengths.

### 2.2 The "how bad is this integration" scorecard

Scored 1 (trivial) – 5 (brutal) on our actual build cost. All `C2` — this is judgment, not fact.

| Platform | Auth pain | Publish complexity | Review gauntlet | Rate-limit pain | Analytics quality | Ongoing churn | **Total** |
|---|---|---|---|---|---|---|---|
| Facebook Pages | 3 | 3 | 4 | 2 | 4 | 4 | **20** |
| Instagram | 4 | 4 | 4 | 3 | 3 | 5 | **23** |
| Threads | 2 | 2 | 2 | 1 | 2 | 3 | **12** |
| X | 3 | 3 | 2 | 5 | 2 | 5 | **20** |
| LinkedIn | **5** | 4 | **5** | 3 | 3 | 3 | **23** |
| TikTok | 3 | **5** | **5** | 4 | 3 | 4 | **24** |
| YouTube | 2 | 2 | 4 | **5** | **1** (best) | 2 | **16** |
| Pinterest | 2 | 3 | 3 | 2 | 3 | 2 | **15** |

**Reading:** TikTok, LinkedIn and Instagram are the three that will eat the schedule.
YouTube is easy to integrate and hard to *scale* (quota). Threads and Pinterest are the
cheap wins.

---

## 3. Auth & token lifecycle

**This section drives the token vault design.** See `11-compliance-security-global.md` for
the encryption/storage side; this is the semantics side.

### 3.1 Master token table

| Platform | Grant | Access token TTL | Refresh mechanism | Refresh token TTL | Rotating? | Silent-refresh possible? |
|---|---|---|---|---|---|---|
| **Facebook (user)** | Auth code | ~1–2 h (short-lived) | `grant_type=fb_exchange_token` → long-lived | **60 days** (long-lived user token) | No | Yes, until 60d lapse |
| **Facebook (Page)** | Derived from long-lived user token via `GET /me/accounts` | **Never expires** *(if derived from a long-lived user token)* | N/A | N/A | No | N/A — but dies on password change / permission revoke / 90-day inactivity |
| **Facebook (System User)** | Business Manager | **Never expires** | N/A | N/A | No | N/A |
| **IG via Facebook Login** | Uses the Page token above | Inherits Page token semantics | N/A | N/A | No | N/A |
| **IG via Instagram Login** | Auth code on `graph.instagram.com` | 1 h short-lived → **60 days** long-lived | `GET /refresh_access_token?grant_type=ig_refresh_token` | N/A (self-refreshing) | No | Yes — **token must be ≥24 h old and <60 d old** to refresh |
| **Threads** | Auth code | 1 h → **60 days** long-lived | `GET /refresh_access_token?grant_type=th_refresh_token` | N/A | No | Yes — same ≥24 h / <60 d window |
| **X** | OAuth 2.0 + **PKCE** | **2 hours** | `grant_type=refresh_token` | Long-lived but **single-use** | **Yes — rotates every refresh** | Yes, requires `offline.access` scope |
| **LinkedIn** | Auth code | **60 days** | `grant_type=refresh_token` | **365 days** | No | **Only for approved programs** (MDP / Community Management). Self-serve apps get **no refresh token at all**. |
| **TikTok** | Auth code + PKCE | **24 hours** | `grant_type=refresh_token` | **365 days** | **Yes — rotates** | Yes |
| **YouTube / Google** | Auth code, `access_type=offline`, `prompt=consent` | **1 hour** | `grant_type=refresh_token` | **No expiry** while app is "In production" | No | Yes |
| **Pinterest** | Auth code | **30 days** | `grant_type=refresh_token` | **365 days** | Optional (`refresh_on` continuous mode) | Yes |

Tags: token *shapes* `C1`; every **TTL number** `C2`; the LinkedIn refresh-token gating `C1`
(it is a well-known and long-standing constraint).

### 3.2 Re-auth pain points, ranked by how much they will hurt us

| Rank | Platform | The pain | Blast radius |
|---|---|---|---|
| **1** | **LinkedIn (unapproved)** | No refresh token without Marketing Developer Platform / Community Management approval. Token dies at **60 days**, hard. Every connected LinkedIn account must be manually reconnected 6×/year. | Catastrophic for churn. **This alone justifies applying for Community Management API on day one.** `C1` |
| **2** | **Meta 90-day data-access expiry** | If a user does not *use* our app for 90 days, Meta expires data access even though the Page token "never expires". Silent. Requires full re-consent. | High — dormant agency clients silently break. `C2` |
| **3** | **TikTok 365-day hard wall** | Refresh token TTL is 365 days. Whether a refresh *resets* the 365-day clock or the window is fixed from initial grant is something I hold **conflicting recall on** — if fixed, every TikTok connection requires annual re-auth regardless of activity. | High if fixed. **`C3` — verify first.** |
| **4** | **X rotating refresh tokens** | Refresh tokens are single-use. Any lost response, concurrent refresh, or crash between "request refresh" and "persist new token" **permanently orphans the connection**. | High — this is a real distributed-systems hazard, not a policy one. `C2` |
| **5** | **Meta password/2FA/permission events** | Page tokens die on user password change, app removal from Business Settings, Meta security checkpoint, or a permission being revoked in the user's Apps & Websites panel. No webhook fires for most of these. | Medium-high. `C1` |
| **6** | **Google "Testing" status** | If our Google Cloud project is in Testing rather than In Production, refresh tokens expire in **7 days**. A classic self-inflicted outage. | Medium — avoidable, but catches teams. `C2` |
| **7** | **Meta annual Data Protection Assessment** | Failing/ignoring the annual DPA can revoke permissions app-wide, killing *all* connections at once. | Catastrophic but predictable. `C2` |

### 3.3 Concrete requirements this imposes on our token vault

1. **Per-connection `expires_at` + `refresh_after`**, not a global policy. Nine different
   TTL regimes.
2. **Rotating-token safety for X:** write-ahead the refresh attempt, persist the new token
   pair in the same transaction as marking the old one consumed, and treat
   `invalid_grant` as "connection dead, prompt user" rather than "retry".
3. **Proactive refresh daemon**, not lazy-on-401: Instagram/Threads *require* a refresh
   within a 24h–60d window; lazy refresh after 60 days is too late. Refresh at ~50% of TTL.
4. **Liveness probe distinct from token expiry.** Meta's 90-day data-access expiry and
   revocation events are invisible to `expires_at`. Run a cheap daily `GET /me` (or
   `/debug_token`) per connection and surface a "Reconnect" state in the UI.
5. **`appsecret_proof`** on all Meta calls (HMAC-SHA256 of the access token with the app
   secret) — required when the app has "Require App Secret" enabled, which we should. `C2`
6. **Re-consent UX must be a first-class product surface**, not an error toast. See §19.4.

### 3.4 Scope inventory (what we must actually request)

| Platform | Minimum scopes for full SMM functionality | Notes |
|---|---|---|
| **Facebook Pages** | `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`, `pages_manage_metadata`, `pages_read_user_content`, `read_insights`, `business_management` | `pages_manage_metadata` is what enables webhook subscription. `C2` |
| **IG (Facebook Login)** | above + `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, `instagram_manage_messages` | Requires the IG account be linked to a FB Page. `C2` |
| **IG (Instagram Login)** | `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages`, `instagram_business_manage_insights` | No Facebook Page required. Different host, different token. `C2` |
| **Threads** | `threads_basic`, `threads_content_publish`, `threads_manage_insights`, `threads_manage_replies`, `threads_read_replies`, `threads_manage_mentions`, `threads_keyword_search`, `threads_delete`, `threads_location_tagging`, `threads_profile_discovery` | Granular; request only what we use — reviewers reject over-asking. `C2` |
| **X** | `tweet.read`, `tweet.write`, `tweet.moderate.write`, `users.read`, `offline.access`, `like.read`, `like.write`, `follows.read`, `dm.read`, `dm.write`, `media.write`, `list.read` | `offline.access` is **mandatory** or there is no refresh token. `media.write` came with the v2 media endpoints. `C2` |
| **LinkedIn** | `openid`, `profile`, `email`, `w_member_social`, `r_organization_social`, `w_organization_social`, `r_organization_admin`, `rw_organization_admin` | The `*_organization_*` scopes require Community Management API approval. `C2` |
| **TikTok** | `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`, `video.upload`, `video.publish` | `video.publish` = direct post; `video.upload` = send-to-inbox only. **Both** are needed if we offer both paths. `C2` |
| **YouTube** | `youtube.upload`, `youtube.force-ssl`, `youtube.readonly`, `yt-analytics.readonly` (+ `yt-analytics-monetary.readonly` if we show revenue) | `youtube.force-ssl` and `youtube` are **sensitive/restricted** scopes → Google verification + possibly CASA security assessment. `C2` |
| **Pinterest** | `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read` (+ `*_secret` variants for secret boards, + `catalogs:*` for product pins) | Secret-board scopes are separate — omitting them silently hides boards. `C2` |

---

## 4. Publishing capability matrix

### 4.1 Post types — can we auto-publish it?

Legend: **✅** full API support · **⚠️** supported with material caveats · **❌** not possible via API · **N/A** format does not exist on the platform

| Format | FB Page | FB Group | IG Business | Threads | X | LinkedIn (Org) | LinkedIn (Member) | TikTok | YouTube | Pinterest |
|---|---|---|---|---|---|---|---|---|---|---|
| **Text-only** | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| **Link share** | ✅ | ❌ | N/A | ⚠️ link in text only | ✅ | ✅ (`article` content) | ✅ | N/A | N/A | ✅ (`link` on pin) |
| **Single image** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ photo post | N/A | ✅ |
| **Multi-image / carousel** | ✅ (`attached_media`) | ❌ | ✅ (2–10) | ✅ (2–20) | ✅ (≤4) | ✅ (`multiImage`, 2–20) | ✅ | ⚠️ photo carousel (≤35) | N/A | ✅ (2–5) |
| **Video (feed)** | ✅ | ❌ | ⚠️ → becomes a Reel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reel / short-form vertical** | ✅ `/video_reels` | ❌ | ✅ `media_type=REELS` | N/A | N/A | N/A | N/A | ✅ (this *is* TikTok) | ✅ (implicit Short) | N/A |
| **Story** | ✅ `/photo_stories`, `/video_stories` | N/A | ⚠️ **plain only** — no stickers/links/polls/music | N/A | N/A | ❌ (discontinued 2021) | ❌ | ❌ | N/A | N/A |
| **Live** | ⚠️ Live Video API (RTMP ingest) | ❌ | ❌ | N/A | ❌ | ❌ | ⚠️ LinkedIn Live via approved partner only | ❌ | ✅ Live Streaming API | N/A |
| **Poll** | ❌ | ❌ | ❌ (Story stickers unavailable) | ❌ | ✅ (2–4 options) | ✅ (2–4 options) | ✅ | ❌ | N/A | N/A |
| **Article / long-form** | ❌ (Notes gone) | ❌ | N/A | N/A | ❌ (X Articles not in API) | ❌ (LinkedIn Articles **not** in API) | ❌ | N/A | N/A | N/A |
| **Document / PDF carousel** | ❌ | ❌ | N/A | N/A | ❌ | ✅ **Documents API** | ✅ | N/A | N/A | N/A |
| **Event** | ⚠️ Page Events API heavily restricted | ❌ | N/A | N/A | N/A | ⚠️ restricted | N/A | N/A | N/A | N/A |
| **Community / channel post** | N/A | N/A | N/A | N/A | ⚠️ `community_id` param | N/A | N/A | N/A | ❌ **no Community Posts API** | N/A |

Tags: `C1` for the ✅/❌ structure. `C2` for the numeric bounds. The X `community_id`
parameter and LinkedIn Live partner access are `C3`.

### 4.2 Post decoration — captions, tagging, comments

| Capability | FB Page | IG Business | Threads | X | LinkedIn | TikTok | YouTube | Pinterest |
|---|---|---|---|---|---|---|---|---|
| **Caption/body max** | ~63,206 chars | **2,200** chars | **500** chars | **280** chars | **3,000** chars | ~2,200 (video) | 5,000 (description) | 800 (description) |
| **Title field** | N/A | N/A | N/A | N/A | N/A | `title` | **100** chars | **100** chars |
| **Hashtag cap** | none enforced | **30** | none | none | none | within caption | within description | N/A |
| **@mention cap** | — | **20** | — | — | restricted (see below) | within caption | — | N/A |
| **Alt text** | ⚠️ `alt_text_custom` on photos | ✅ `alt_text` (images, Reels; carousel = per-child) | UNVERIFIED | ✅ `POST /2/media/metadata`, ≤1,000 chars | ✅ `content.media.altText` | ❌ | N/A | ✅ `alt_text`, ≤500 chars |
| **First comment** | ✅ via `POST /{post-id}/comments` | ✅ via `POST /{ig-media-id}/comments` | ✅ via reply endpoint | ✅ via reply | ✅ via Social Actions API | ❌ **no comment-create API** | ✅ `commentThreads.insert` | ❌ |
| **Pin the first comment** | ❌ | ❌ | ❌ | ✅ (pin own reply — `C3`) | ❌ | ❌ | ❌ **cannot pin via API** | ❌ |
| **User tagging** | ⚠️ `tags` on photos | ✅ `user_tags` — **images + Reels + carousel image children only**, **public accounts only** | ❌ | inline `@` text only | ⚠️ org mentions OK; **person mentions only if they follow the Page** | inline `@` text only | N/A | N/A |
| **Product tagging** | ❌ | ✅ `product_tags` — ≤**5**/media, ≤**20**/carousel; requires approved IG Shopping catalog | ❌ | ❌ | ❌ | ❌ (Shop API separate/regional) | N/A | ⚠️ via catalogs |
| **Collaborator tagging** | ❌ | ✅ `collaborators` — **max 3**; Reels/images/carousels; **not Stories** | ❌ | ❌ | ❌ | ❌ | N/A | N/A |
| **Location tagging** | ✅ `place` | ✅ `location_id` (from Pages search) | ⚠️ `threads_location_tagging` scope exists | ✅ `geo.place_id` | ❌ | ❌ | ❌ (removed) | N/A |
| **Music / licensed audio** | ❌ | ❌ **hard no** | N/A | N/A | N/A | ❌ **hard no** | N/A | N/A |
| **Cover / thumbnail control** | ✅ | ✅ `cover_url` / `thumb_offset` | ❌ | ❌ | ⚠️ `thumbnail` on video | ✅ `video_cover_timestamp_ms` | ✅ `thumbnails.set` (**verified channel required**) | ⚠️ `cover_image_url` |
| **Audience targeting (organic)** | ✅ country/age/gender/interest | ❌ | ❌ | ❌ | ✅ `targetEntities` (geo, industry, seniority…) | ❌ | ❌ | ❌ |
| **Comment controls at publish** | ⚠️ | ❌ | ⚠️ `reply_control` | ✅ `reply_settings` | ✅ `isReshareDisabledByAuthor` | ✅ `disable_comment` / `disable_duet` / `disable_stitch` | ⚠️ via `status` | ❌ |

Tags: `C1` for presence/absence. `C2` for all numeric caps. `C3` for X comment-pinning and
Threads alt-text/location specifics.

### 4.3 The three publish-flow archetypes

Every tier-1 platform uses one of three shapes. Our publishing pipeline should implement
exactly three adapters, not nine. `C1`.

**Archetype A — Two-step container (Meta family).**
```
POST /{user-id}/media          { image_url | video_url, media_type, caption, ... }
   → { id: <creation_id> }
GET  /{creation_id}?fields=status_code        # poll: IN_PROGRESS → FINISHED | ERROR | EXPIRED
POST /{user-id}/media_publish  { creation_id }
   → { id: <published_media_id> }
```
Used by: Instagram (all formats), Threads. Container TTL **24 h**; carousel children are
created with `is_carousel_item=true` then referenced by a parent container.
**Media is pulled by Meta from a public URL we host** — we never upload bytes. That means
our media CDN must serve unauthenticated, range-request-capable, correct-MIME responses,
and stay up for the whole processing window.

**Archetype B — Phased resumable upload (FB Reels/Stories, LinkedIn, TikTok, YouTube, Pinterest video).**
```
POST .../init      → { upload_url | upload_id | media_id, (optional) upload_instructions }
PUT/POST bytes → upload_url        # possibly chunked, possibly multipart with per-part ETags
POST .../finalize|publish|status   → poll until PUBLISHED / succeeded / FAILED
```
Used by: Facebook Reels & Stories, LinkedIn Images/Videos/Documents, TikTok Content Posting,
YouTube resumable upload, Pinterest `/v5/media`. **We push bytes.** Needs chunking, retry
with byte-range resume, and per-part checksum handling (LinkedIn multipart returns ETags
that must be echoed at finalize).

**Archetype C — Single-shot with pre-uploaded media handles (X, Pinterest image, FB photo).**
```
POST /2/media/upload (INIT/APPEND/FINALIZE)  → media_id
POST /2/media/metadata  { media_id, alt_text }
POST /2/tweets { text, media: { media_ids: [...] } }
```
Media handles are short-lived (X: media ids expire in ~24 h if unused — `C3`).

---

## 5. Media constraints matrix

**Every number in this section is `C2` at best.** Platforms adjust encoder limits quietly.
Our pre-flight validator must read these from a **config table, never hardcoded**, and must
fail *closed* with a human-readable message rather than letting the platform reject us. See §19.2.

### 5.1 Images

| Platform | Formats | Max size | Min dimension | Max dimension | Aspect ratio | Count per post |
|---|---|---|---|---|---|---|
| **FB Page** | JPEG, PNG, GIF, BMP, TIFF | ~4 MB (photos endpoint) | — | — | permissive | 1, or N via `attached_media` |
| **FB Story** | JPEG, PNG | ~4 MB | 1080×1920 rec. | — | 9:16 | 1 |
| **IG feed** | **JPEG** (PNG acceptance inconsistent) | **8 MB** | **320 px** wide | **1440 px** wide | **4:5 → 1.91:1** | 1, or 2–10 carousel |
| **IG Story** | JPEG | 8 MB | — | — | 9:16 rec. | 1 |
| **Threads** | JPEG, PNG | **8 MB** | — | — | permissive | 1, or 2–20 carousel |
| **X** | JPEG, PNG, WEBP, GIF | **5 MB** (GIF **15 MB**) | 4×4 | 8192×8192 | permissive | ≤4 images, or 1 GIF |
| **LinkedIn** | JPEG, PNG, GIF | ~10 MB (`C3`) | 552 px wide rec. | 7680 px | permissive | 1, or 2–20 `multiImage` |
| **TikTok photo** | JPEG, WEBP | ~20 MB/image (`C3`) | — | — | permissive | up to **35** |
| **YouTube thumbnail** | JPG, PNG, GIF, BMP | **2 MB** | 640 px wide | — | 16:9 (1280×720 rec.) | 1 |
| **Pinterest** | JPEG, PNG (WEBP `C3`) | **20 MB** (`C3` — 10 MB also in circulation) | — | — | **2:3 strongly preferred** | 1, or 2–5 carousel |

### 5.2 Video

| Platform / format | Container | Video codec | Audio codec | Duration | Max size | Resolution | Frame rate | Aspect |
|---|---|---|---|---|---|---|---|---|
| **FB Page video** | MP4, MOV | H.264, H.265 | AAC | up to 240 min | up to 10 GB (`C3`) | ≥720p rec. | ≤60 fps | permissive |
| **FB Reels** | MP4, MOV | H.264 | AAC | 3 s – 90 s (`C3`) | ~1 GB | 1080×1920 rec. | 24–60 fps | 9:16 |
| **FB Story video** | MP4, MOV | H.264 | AAC | ≤ 60 s | ~1 GB | 1080×1920 | — | 9:16 |
| **IG Reels** | **MP4, MOV** | **H.264 or HEVC**, progressive scan, closed GOP, 4:2:0 chroma | **AAC**, 48 kHz, ≤2 ch, ≤128 kbps | **3 s – 15 min** | **1 GB** | min 540×960, rec. 1080×1920 | **23–60 fps** | 0.01:1 – 10:1 (**9:16 rec.**) |
| **IG Story video** | MP4, MOV | H.264 | AAC | **≤ 60 s** | ~100 MB (`C3`) | 1080×1920 | — | 9:16 |
| **Threads video** | MP4, MOV | H.264, HEVC | AAC | **≤ 5 min** | **1 GB** | rec. 1080×1920 | 23–60 fps | 0.01:1 – 10:1 |
| **X video** | MP4 | **H.264 High Profile** | **AAC LC** | **0.5 s – 140 s** | **512 MB** | 32×32 – 1280×1024 | ≤60 fps | 1:3 – 3:1 |
| **LinkedIn video** | MP4 | H.264 | AAC | **3 s – 30 min** (`C3` — 15 min also in circulation) | **500 MB** (`C3` — 5 GB for ads) | 256×144 – 4096×2304 | ≤60 fps | 1:2.4 – 2.4:1 |
| **TikTok video** | **MP4, WebM, MOV** | H.264, H.265 | AAC | 3 s – **`max_video_post_duration_sec` from `creator_info`** (60/180/600 s) | ~4 GB direct; smaller for `PULL_FROM_URL` | ≥360p, ≤4K | 23–60 fps | 9:16 strongly preferred |
| **YouTube** | MP4, MOV, AVI, WMV, FLV, 3GPP, WebM, MPEGPS, ProRes, DNxHR, HEVC | many | many | ≤ 12 h | **256 GB** | up to 8K | — | any |
| **YouTube Short** | as above | as above | as above | **≤ 3 min** (raised from 60 s, Oct 2024) | as above | vertical/square | — | **≤ 1:1** |
| **Pinterest video** | MP4, M4V, MOV | H.264, H.265 | AAC | **4 s – 15 min** | **2 GB** | ≥540×960 | — | 9:16 / 2:3 / 1:1 |

### 5.3 The three constraints that will bite us hardest

1. **TikTok's `max_video_post_duration_sec` is per-creator and must be fetched at compose
   time.** We cannot validate a TikTok video against a static limit — a 10-minute video is
   legal for one creator and rejected for another. `creator_info` must be called before the
   user finishes composing, and its result cached only briefly. `C1`
2. **Meta pulls media from our URL; nobody else does.** Instagram/Threads failures are
   frequently *our CDN's* fault (redirect chains, missing `Content-Length`, signed URLs
   that expire mid-processing, Cloudflare bot challenges against Meta's fetcher). Media URLs
   for Meta must be unsigned-or-long-signed, redirect-free, and allow-listed for Meta's UA. `C1`
3. **X's 140-second ceiling** is the single most surprising limit for users coming from
   other tools. Any video >2:20 simply cannot go to X via API regardless of account tier. `C2`

---

## 6. The impossibility matrix

**This is the most product-relevant section in the document.** These are the gaps that force
reminder-style publishing, and per `01-vista-social-full-audit.md` §20.2 (Gap-to-exploit #1)
they are where our differentiation lives.

### 6.1 Categorically impossible via API — will not be fixed by trying harder

| # | Platform | What is impossible | Why it matters | Confidence |
|---|---|---|---|---|
| 1 | **Instagram** | **Story stickers of every kind** — link, poll, question, quiz, countdown, location sticker, mention sticker, GIF, music sticker, "Add Yours" | Stories are the highest-frequency IG format and stickers are the entire engagement mechanic. **This is the #1 reminder-publish driver in the industry.** | `C1` |
| 2 | **Instagram / Facebook / TikTok** | **Licensed music / the native audio library** | Meta and TikTok do not expose their music catalogs to third parties, for rights reasons. Structural and permanent. Trending-audio Reels/TikToks **cannot** be auto-published. | `C1` |
| 3 | **TikTok** | Native effects, filters, text-to-speech, stickers, polls, Q&A, green screen, duet/stitch *creation*, adding to playlists, LIVE, TikTok Stories | The API posts a finished flat video file and nothing else. | `C1` |
| 4 | **Facebook Groups** | **Publishing at all** — the Groups API was deprecated (effective ~22 Apr 2024) and `publish_to_groups` removed | Group posting is simply gone as a product capability for every vendor. Do not promise it. | `C2` — high confidence but **verify**, it is a competitive-positioning claim |
| 5 | **LinkedIn** | **Articles and Newsletters** | Long-form LinkedIn is invisible to every SMM tool. | `C1` |
| 6 | **LinkedIn** | **Member (personal-profile) post analytics** | We can publish to a personal profile but can barely measure it beyond like/comment counts. Huge gap given personal-brand demand. | `C1` |
| 7 | **LinkedIn** | **Direct messages / Page inbox** (no general-access messaging API) | No LinkedIn DMs in any mainstream SMM inbox. Parity gap everyone shares. | `C1` |
| 8 | **YouTube** | **Community Posts** | Creators' second-biggest surface, zero API. | `C1` |
| 9 | **YouTube** | **Pinning or hearting a comment** | Trivially expected by creators, impossible. | `C2` |
| 10 | **X** | **Real-time DM/mention webhooks below Enterprise** (Account Activity API is Enterprise-only) | Forces polling, which burns the read cap we are already paying for. | `C2` |
| 11 | **X** | **Audience/follower demographics** | No demographics endpoint in v2 at all. Any "X audience" report is inferred, not measured. | `C1` |
| 12 | **X** | **Articles, Communities Notes, Spaces creation** | — | `C2` |
| 13 | **Pinterest** | **Comment read/reply on pins** (only aggregate `TOTAL_COMMENTS`) | Pinterest cannot participate in a unified inbox. | `C2` |
| 14 | **TikTok** | **Direct messages** | TikTok DMs absent from every inbox product. | `C1` |
| 15 | **Instagram** | Tagging **private** accounts; **>3 collaborators**; collaborators on **Stories** | Common user request, hard fail. | `C2` |
| 16 | **Instagram** | **Instagram Live** | — | `C1` |
| 17 | **All except FB/YouTube** | **Native scheduling** | Our scheduler is the only safety net. See §1.2. | `C1` |
| 18 | **Meta** | **Personal Facebook profiles and personal Instagram accounts** | Only Pages and Professional (Business/Creator) IG accounts. Basic Display API — the last personal-account read path — was retired **4 Dec 2024**. | `C2` |

### 6.2 Where the reminder path is mandatory

Derived from §6.1. This table should drive the composer's format picker directly.

| Network + format | Auto-publish? | Reminder required when… |
|---|---|---|
| IG Story, plain image/video | ✅ Auto | never |
| IG Story **with any sticker/link/poll/music** | ❌ | **always** |
| IG Reel with trending audio | ❌ | always (audio must be added in-app) |
| IG Reel with uploaded/licensed-free audio baked into the file | ✅ Auto | never |
| IG personal (non-professional) account | ❌ | always |
| TikTok video, plain | ✅ Auto (post-audit) | pre-audit → `SELF_ONLY` only |
| TikTok with native sound/effects/stickers | ❌ | always |
| TikTok photo carousel | ✅ Auto (`C2`) | if the account/app is unaudited |
| FB Group | ❌ | always — and even the reminder path is manual |
| LinkedIn Article / Newsletter | ❌ | always |
| YouTube Community Post | ❌ | always |
| Pinterest — all supported formats | ✅ Auto | — |
| Threads — all supported formats | ✅ Auto | — |

**Product implication (carried from `01` §20.2, G14):** the reminder path is not an edge
case — it is the *primary* path for the single most-used format on the single most-used
network (IG Stories with a link sticker). Treating it as a first-class product with
pre-downloaded media, one-tap handoff, clipboard-staged caption, deep link into the native
composer, and a "did it post?" confirmation loop is a genuine wedge, because incumbents
treat it as a consolation prize.

---

## 7. Analytics, metrics and retention

### 7.1 Availability and quality by platform

| Platform | Post-level metrics | Account-level metrics | Audience demographics | Retention / lookback | Quality verdict |
|---|---|---|---|---|---|
| **FB Page** | Rich (`/{post-id}/insights`) — impressions, reach, engaged_users, clicks, reactions by type, video views/retention | `/{page-id}/insights` — fans, reach, impressions, views, actions | ✅ `page_fans_country`, `_city`, `_locale`, `_gender_age` | ~2 years for most day-series | **Best of the tier-1 set alongside YouTube** |
| **IG Business** | `/{media-id}/insights` — reach, views, likes, comments, saved, shares, total_interactions; Reels add avg watch time & total watch time | `/{ig-user-id}/insights` — reach, views, profile_views, accounts_engaged, follower_count, website_clicks | ✅ `follower_demographics` with `breakdown=age,city,country,gender` — **requires ≥100 followers** | Stories insights short-lived; media insights from creation | Good, but **churning** (see §7.3) |
| **Threads** | `/{media-id}/insights` — views, likes, replies, reposts, quotes, shares | user insights + `follower_demographics` | ✅ limited | **No data before the API launch date (≈ Apr–Jun 2024)** | Thin but improving |
| **X** | `public_metrics` (retweet, reply, like, quote, bookmark, impression) + `non_public_metrics` / `organic_metrics` (impressions, url_link_clicks, user_profile_clicks) | none beyond profile counts | ❌ **none** | **`non_public_metrics` / `organic_metrics` only for posts <30 days old** | **Weakest of the set.** No demographics, 30-day private-metric wall |
| **LinkedIn (Org)** | `organizationalEntityShareStatistics` — impressions, uniqueImpressions, clicks, likes, comments, shares, engagement rate | `organizationPageStatistics`, `brandPageStatistics`, `organizationalEntityFollowerStatistics` (organic vs paid follower gains) | ✅ follower breakdown by seniority, function, industry, company size, region | DAY granularity typically limited to ~12 months | Decent for orgs |
| **LinkedIn (Member)** | ❌ essentially none (socialActions counts only) | ❌ | ❌ | — | **Structural hole** |
| **TikTok** | Display API: like/comment/share/view counts per video. Business API adds richer video insights | Business API `/business/get/` — profile views, video views, followers, audience countries/genders/ages/activity | ✅ **only via Business API** | Business API commonly ~60 days of daily data (`C3`) | Split across two APIs; annoying |
| **YouTube** | YouTube Analytics API — views, estimatedMinutesWatched, averageViewDuration, averageViewPercentage, likes, dislikes (own channel), comments, shares, subscribersGained/Lost, cardClicks, revenue | full channel reporting with dimensions (traffic source, geography, device, playback location, subscriber status) | ✅ ageGroup, gender, geography | **Full history** via Analytics API; **Reporting API bulk files retained 60 days** | **Best in class** — the only true analytics API in the set |
| **Pinterest** | `/v5/pins/{id}/analytics` — IMPRESSION, SAVE, PIN_CLICK, OUTBOUND_CLICK, video quartiles, TOTAL_COMMENTS, TOTAL_REACTIONS | `/v5/user_account/analytics` with `split_field` (APP_TYPE, CONTENT_TYPE, SOURCE, PIN_FORMAT) | ⚠️ limited; richer via Ads API | **90-day maximum lookback** | Adequate; the 90-day wall is the problem |

### 7.2 Retention windows — what we must warehouse ourselves

**Rule: if a platform's lookback is shorter than our reporting window, we must persist
daily snapshots from day one.** Backfill is impossible after the fact.

| Platform | Native lookback | Must we warehouse? |
|---|---|---|
| Pinterest | **90 days** | **Yes — critical.** Anything older than 90 days exists only if we stored it. |
| X `non_public_metrics` | **30 days** | **Yes — critical.** Impressions on a 31-day-old post are gone forever. |
| TikTok Business insights | ~60 days (`C3`) | **Yes.** |
| Threads | since API launch | Yes (for pre-launch nothing exists). |
| Instagram | media insights persist; account day-series ~2 yr | Yes, for >2yr reporting and to survive metric renames. |
| Facebook Page | ~2 yr | Yes, same reason. |
| LinkedIn | ~12 mo at DAY granularity | Yes. |
| YouTube (Analytics API) | full history | No — but warehouse anyway for cross-network joins. |
| YouTube (Reporting API) | **60 days of report files** | **Yes** if we use bulk reports. |

This is a **day-one architecture requirement**, not a v2 feature. A metrics warehouse with
daily per-post and per-account snapshots, keyed by `(platform, entity_id, metric, date)`,
with the raw payload retained for re-derivation. See `12-analytics-listening-gtm.md`.

### 7.3 Metric deprecations — the live minefield

| Platform | Change | Status | Impact |
|---|---|---|---|
| **Instagram / Facebook** | `impressions`, `plays`, `video_views`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` **removed**, unified into a single **`views`** metric | Announced with v22.0 (Jan 2025); removal ≈ **21 Apr 2025** | **Breaks every historical chart.** `views` is not numerically comparable to `impressions` — a chart spanning the cutover is a lie unless we annotate the discontinuity. `C2` |
| **Instagram** | `follower_count` / `profile_views` semantics revised alongside the above | same window | `C3` |
| **X** | v1.1 endpoints progressively sunset; `media/upload` moved to `POST /2/media/upload` | v1.1 media sunset originally **31 Mar 2025**, extended at least once | Any v1.1 media code is on borrowed time. `C2` |
| **X** | `impression_count` availability varies by tier | ongoing | `C3` |
| **YouTube** | `dislikes` removed from public data (Dec 2021); still available in Analytics API for **own** channel | done | Competitor dislike tracking impossible. `C1` |
| **YouTube** | **`impressions` and `impressionClickThroughRate` are Studio-only** — never in the Analytics API | permanent | We cannot show YouTube CTR. Users will ask. **Set expectations in the UI.** `C2` |
| **Meta** | Instagram **Basic Display API** fully retired **4 Dec 2024** | done | No personal-account access by any route. `C2` |
| **Meta** | Graph API version N deprecated ~**2 years** after release | rolling | We must ship a version bump roughly annually or take a hard outage. `C1` |
| **LinkedIn** | Monthly versions supported **12 months** | rolling | **Harder cadence than Meta.** A `LinkedIn-Version` header more than 12 months old starts failing. `C2` |
| **Pinterest** | Idea Pins folded into standard Pins (2024) | done | Any "Idea Pin" specific code path is dead. `C3` |

**Engineering requirement:** metric provenance. Every stored datapoint carries the
platform, the API version, and the metric name **as returned**. When `impressions`
becomes `views`, we must be able to show a discontinuity marker rather than silently
splice two different quantities. This was flagged as a differentiator in
`01-vista-social-full-audit.md` (metric provenance, G-series gaps).

---

## 8. Comments, DM and inbox

### 8.1 Coverage matrix

| Platform | Read comments | Reply | Delete | Hide/moderate | Like as brand | DMs | Mentions | Ad/dark-post comments |
|---|---|---|---|---|---|---|---|---|
| **FB Page** | ✅ | ✅ | ✅ | ✅ (`is_hidden`) | ✅ | ✅ Messenger Platform | ✅ tagged/visitor posts | ✅ (with ads permissions) |
| **IG Business** | ✅ | ✅ | ✅ | ✅ (`hide=true`) | ⚠️ `C3` | ✅ IG Messaging | ✅ `mentions` webhook + `/mentioned_media` | ⚠️ `C3` |
| **Threads** | ✅ replies + `/conversation` | ✅ | ✅ | ✅ `manage_reply?hide=true` | ❌ | ❌ **no DM API** | ✅ `threads_manage_mentions` | N/A |
| **X** | ✅ (as search/conversation queries — **burns read quota**) | ✅ | ✅ own | ✅ `tweet.moderate.write` (hide reply) | ✅ | ✅ `/2/dm_events`, `/2/dm_conversations/...` | ✅ (search) | N/A |
| **LinkedIn** | ✅ Social Actions API | ✅ | ✅ | ⚠️ `C3` | ✅ | ❌ **none** | ✅ org notifications (Community Mgmt) | ⚠️ `C3` |
| **TikTok** | ✅ **Business API only** | ✅ Business API | ✅ | ✅ hide | ✅ like | ❌ **none** | ❌ | ⚠️ via Ads API |
| **YouTube** | ✅ `commentThreads.list` | ✅ `comments.insert` | ✅ | ✅ `comments.setModerationStatus`, `markAsSpam` | ❌ | ❌ **platform has none** | ❌ | N/A |
| **Pinterest** | ❌ **count only** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ Ads API |

### 8.2 Messaging windows and rate ceilings

| Platform | Standard reply window | Extension | Practical rate ceiling |
|---|---|---|---|
| **Messenger (FB Page)** | **24 hours** from last user message | `HUMAN_AGENT` tag → **7 days**; message tags for specific use cases | ~200 automated messages/hour class of limit (`C3`) |
| **Instagram Messaging** | **24 hours** | `HUMAN_AGENT` tag → **7 days** (requires Human Agent permission approval) | **~750 private replies/hour**; ~200 automated msgs/hour (`C3`, corroborated by `01` §"IG rate limit" row) |
| **IG comment → private reply** | **one private reply per comment**, within **7 days** of the comment | none | as above |
| **X DM** | no window restriction, but recipient must allow DMs | — | tier-dependent; DM reads consume the read cap (`C3`) |
| **LinkedIn** | N/A — no API | — | — |
| **TikTok** | N/A — no API | — | — |

### 8.3 Inbox architecture consequences

1. **Polling is mandatory for X, LinkedIn, TikTok, YouTube and Pinterest** (no webhooks, or
   Enterprise-only webhooks). Only Meta gives us real-time.
2. **X polling is metered in dollars.** Every mention poll consumes the monthly read cap
   that costs $200–$5,000/mo. Poll frequency is a **pricing decision**, not a tuning knob.
   Model it explicitly: `mentions_per_account × accounts × poll_frequency ≤ tier_read_cap`.
3. **The 24-hour Meta messaging window is a product-design constraint.** Our inbox must
   surface a visible countdown per conversation and hard-block sends outside the window
   rather than letting the API throw. Agencies with overnight coverage gaps hit this daily.
4. **Pinterest and LinkedIn-DM holes are permanent.** Do not build UI affordances that
   imply they will arrive.

---

## 9. Rate limits, quotas and cost

### 9.1 Cost of access

| Platform | Money | Access gate |
|---|---|---|
| **Meta (all)** | **$0** | App Review + Business Verification + annual Data Protection Assessment |
| **X** | **$0 / $200 / $5,000 / $42,000+ per month** | Payment + basic developer agreement |
| **LinkedIn** | **$0** | Program approval (MDP / Community Management) — the gate is *approval*, and it is a hard one |
| **TikTok** | **$0** | App registration + **content-posting audit** + (for Business API) TikTok for Business approval |
| **YouTube** | **$0** | OAuth verification (+ CASA security assessment for restricted scopes) + **annual YouTube API compliance audit**; quota extensions require a separate audited request |
| **Pinterest** | **$0** | Trial → Standard access review |

**X is the only platform where scale costs money directly.** Everything else costs
calendar time and compliance overhead. See §9.3.

### 9.2 X API tiers — the pricing table

> **`C3` — TREAT AS HYPOTHESIS.** X has re-priced and re-cut these tiers repeatedly since
> 2023 (the Free tier alone went from 1,500 → 500 posts/month, and Basic from $100 → $200).
> A May-2026 recollection of X pricing is the least reliable data in this document.
> **Verify at `docs.x.com/x-api/getting-started/about-x-api` before any pricing decision.**

| Tier | Price | Write (Posts/month) | Read (Posts/month) | Apps | Key entitlements |
|---|---|---|---|---|---|
| **Free** | $0 | **500** app-level (was 1,500) | ~100 (essentially `GET /2/users/me` only) | 1 | Login with X; write-only in practice |
| **Basic** | **$200/mo** | **3,000** per user + **50,000** app-level | **10,000–15,000** (`C3-conflict`) | 2 | Core v2 read+write, DMs |
| **Pro** | **$5,000/mo** | **300,000** app-level | **1,000,000** | 3 | Filtered stream, recent search at higher tiers, full v2 |
| **Enterprise** | **from ~$42,000/mo** | negotiated | negotiated | — | Full-archive search, PowerTrack, Firehose, **Account Activity API (webhooks)**, Compliance firehose |

**The killer economics:** to serve N customers' X mentions we must poll search endpoints,
and reads are capped monthly at the *app* level, not per customer. A Pro plan's 1M
reads/month divided across, say, 500 connected X accounts is **2,000 posts read per account
per month** — roughly 66/day. For any account with real mention volume that is nothing.
**X listening at scale requires Enterprise or is not offered.** Price the feature
accordingly, or gate X mentions behind a higher plan tier. `C3` on the numbers, `C1` on the
structural conclusion.

### 9.3 Rate limits by platform

| Platform | Model | Documented figures | Observability |
|---|---|---|---|
| **Meta — app level** | Rolling 1-hour window | `200 × (monthly active users of the app)` calls/hour, aggregated | `X-App-Usage` header: `call_count`, `total_cputime`, `total_time`, each a **% of quota** |
| **Meta — Page (BUC)** | Rolling 24-hour | `4,800 × engaged_users` per 24 h | `X-Business-Use-Case-Usage` header, per business-asset id |
| **Meta — IG publishing** | Rolling 24-hour | **100 published posts / 24 h** per IG account (carousel counts as 1) | `GET /{ig-user-id}/content_publishing_limit` → `quota_usage`, `config.quota_total`, `config.quota_duration` |
| **Meta — IG messaging** | Hourly | ~750 private replies/hour; ~200 automated msgs/hour (`C3`) | error codes |
| **Threads** | Rolling 24-hour | **250 posts / 24 h**; **1,000 replies / 24 h** | `GET /{threads-user-id}/threads_publishing_limit` (`C2`) |
| **X** | 15-minute windows **per endpoint per tier**, plus monthly caps | e.g. `POST /2/tweets`: Free ~17/24 h/user; Basic ~100/24 h/user; Pro ~100/15 min/user. `GET /2/users/:id/tweets`: Free 1/15 min, Basic 5/15 min, Pro 900/15 min (`C3`) | `x-rate-limit-limit`, `-remaining`, `-reset`; `GET /2/usage/tweets` for monthly cap |
| **LinkedIn** | Daily throttles, **per endpoint × per member × per app** | Not published as one number. Order of magnitude: ~150 posts/day/member, ~100,000/day/app for approved partners; **development tier is dramatically lower** (`C3`) | HTTP 429; Developer Portal "Usage" tab; no reliable header |
| **TikTok** | Per-token QPS + account-level daily post caps | **6 requests/minute per access token** on publish init (`C2`); account daily post cap commonly cited **~15–30/day**, **shared across all API clients touching that account** (`C3`) | error `rate_limit_exceeded` |
| **YouTube** | **Daily quota units**, per Google Cloud project | **10,000 units/day default.** `videos.insert` = **1,600**; `search.list` = **100**; `thumbnails.set` = 50; `videos.update` = 50; `playlistItems.insert` = 50; `commentThreads.insert` = 50; `captions.insert` = 400; `videos.list` / `channels.list` / `commentThreads.list` = **1** | Cloud Console quota dashboard; `quotaExceeded` / `rateLimitExceeded` errors |
| **Pinterest** | Per-app-per-user request rate | Standard access commonly cited ~1,000 req/min; **trial access is far lower** (`C3`) | `X-RateLimit-Limit`, `-Remaining`, `-Reset` |

### 9.4 The YouTube quota problem — worked example

`videos.insert` costs **1,600 units** against a **10,000/day** default. That is **6 uploads
per day for our entire platform**, across all customers, because quota is per *project*,
not per user. `C1` on the structure, `C2` on the exact costs.

| Operation | Unit cost | Daily budget consumed at 10k |
|---|---|---|
| 6 video uploads | 9,600 | 96% |
| 1 `search.list` call | 100 | 1% |
| 100 `videos.list` polls | 100 | 1% |

**Consequences:**
- **Never use `search.list`.** At 100 units it is 1% of the daily budget per call. Use
  `playlistItems.list` on the uploads playlist (1 unit) to enumerate a channel's videos.
- **A quota extension request is a mandatory, calendar-time-blocking project task.** It
  requires the YouTube API Services audit, is measured in weeks-to-months, and is
  frequently denied or partially granted. It must start before the YouTube integration is
  promised to customers.
- **Consider per-customer Google Cloud projects** (BYO-project) as an architectural escape
  hatch for high-volume YouTube customers. This is what several competitors quietly do.
  `C3` on the competitor claim.

### 9.5 Cross-platform daily publishing ceilings

| Platform | Hard ceiling per connected account per 24 h |
|---|---|
| Instagram | **100** (API-enforced, queryable) |
| Threads | **250** posts + 1,000 replies |
| TikTok | ~15–30 (account-level, shared across all apps) `C3` |
| YouTube | ~6 platform-wide at default quota (not per account) |
| Facebook Page | governed by `4,800 × engaged_users` BUC budget, not a post count |
| X | tier-dependent monthly cap ÷ 30 |
| LinkedIn | ~150/day/member `C3` |
| Pinterest | UNVERIFIED |

For reference, Vista Social self-imposes **25 posts/day/profile** and **50/24h for
Instagram** (`01-vista-social-full-audit.md` §3.7) — i.e. well *inside* platform limits.
That is a deliberate safety margin, and we should adopt a similar configurable cap, but
unlike Vista's, **ours should be configurable** (their non-configurable 25/day cap is
listed as a customer complaint in that file).

---

## 10. App review, verification and partner programs

### 10.1 The gauntlet, per platform

| Platform | Gate 1 | Gate 2 | Gate 3 | Realistic calendar time |
|---|---|---|---|---|
| **Meta** | **Business Verification** of our legal entity (documents, domain) | **App Review** per permission — screencast + step-by-step reviewer instructions + test credentials | **Advanced Access** grant; **Tech Provider** designation if we serve other businesses; **annual Data Protection Assessment** | **4–12 weeks**, multiple rejection rounds normal `C2` |
| **X** | Developer account + agreement | Paid tier selection | Enterprise contract if webhooks/full-archive needed | Days for self-serve; **weeks-to-months for Enterprise** `C2` |
| **LinkedIn** | Company Page for our own company (prerequisite) | **Marketing Developer Platform** and/or **Community Management API** application with detailed use case + demo | Partner-program tiering for higher throughput | **4–12+ weeks; rejection is common and feedback is thin.** The single most opaque gate in the set `C2` |
| **TikTok** | Developer app registration | **Content Posting API audit** — until passed, all posts are forced `SELF_ONLY` (private) | **TikTok for Business** approval separately for the Business API (comments/insights) | **2–8 weeks**, and the audit checks our *UI* against UX guidelines `C2` |
| **YouTube** | Google Cloud project + OAuth consent screen | **OAuth verification** (sensitive scopes) + possible **CASA security assessment** for restricted scopes | **Annual YouTube API Services compliance audit**; **separate quota-extension audit** | **2–8 weeks** for OAuth; quota extension **longer and often denied** `C2` |
| **Pinterest** | App registration → **Trial access** | **Standard access** review | Partner program for higher limits | **2–6 weeks** `C3` |

### 10.2 The TikTok UX audit — the one people underestimate

TikTok's content-posting audit reviews **our product's user interface**, not just our
backend. Documented requirements (`C2`):

- Must call `POST /v2/post/publish/creator_info/query/` and **render the creator's actual
  nickname/avatar** so the user can confirm which account they are posting to.
- Must present the **privacy-level selector** populated from `privacy_level_options`
  returned by that call — we may not hardcode the list.
- Must respect `comment_disabled` / `duet_disabled` / `stitch_disabled` returned by
  `creator_info` and disable the corresponding toggles.
- Must show the **branded-content / commercial-content disclosure** toggles
  (`brand_content_toggle`, `brand_organic_toggle`) and the associated legal copy.
- Must display TikTok's **Music Usage Confirmation** text.
- Must not publish without explicit user confirmation of the above.

**Engineering consequence:** the TikTok composer cannot be a generic composer with a
network toggle. It needs a dedicated, TikTok-specific UI branch, and that branch is on the
critical path to *any* public TikTok posting. Budget it as a feature, not a config.

### 10.3 Meta App Review practicalities

- Reviewers need a **working test account** on our platform plus a **screencast** showing
  each requested permission being exercised end-to-end. Ambiguous screencasts are the #1
  rejection cause. `C2`
- **Request the minimum permission set.** Over-asking triggers rejection and resets the
  clock.
- **Standard vs Advanced Access:** Standard Access only works for users who have a role on
  our Meta app (i.e. our own staff). Every real customer requires **Advanced Access**.
  Building and demoing with Standard Access and only then applying is a classic schedule
  trap.
- **Page Public Content Access (PPCA)** and **Instagram Public Content Access** — needed for
  competitor/listening features on Meta — are separately reviewed, harder to obtain, and may
  require a signed agreement. Assume we will not have them at launch; design competitor
  analytics to degrade gracefully. `C2`

---

## 11. Webhooks

| Platform | Available? | Mechanism | Event types | Notes |
|---|---|---|---|---|
| **Facebook Page** | ✅ **Rich** | Meta Webhooks — verify token handshake, `X-Hub-Signature-256` HMAC | `feed` (posts, comments, reactions), `messages`, `messaging_postbacks`, `message_reactions`, `mention`, `ratings`, `live_videos` | Requires `pages_manage_metadata`. Per-page subscription via `POST /{page-id}/subscribed_apps`. `C1` |
| **Instagram** | ✅ **Rich** | Meta Webhooks | `comments`, `mentions`, `messages`, `message_reactions`, `story_insights`, `live_comments` | Same infrastructure. `C1` |
| **Threads** | ⚠️ Partial | Meta Webhooks | replies/mentions (`C3`) | Verify scope of coverage. |
| **X** | ❌ **Enterprise only** | Account Activity API (v1.1) | Tweets, mentions, DMs, follows, blocks for subscribed users | **This is the single biggest reason X inbox is expensive.** Everyone below Enterprise polls. `C2` |
| **LinkedIn** | ❌ **None for organic** | — | (Lead Gen Forms webhooks exist under the Ads API; DMA member-data-portability notifications exist) | **Poll only.** Plan LinkedIn comment/mention sync as a scheduled job. `C1` |
| **TikTok** | ⚠️ Narrow | TikTok webhooks | `authorization.removed`, `video.publish.complete`, `video.publish.failed` (and related post-status events) | **`authorization.removed` is valuable** — it is one of the few revocation signals any platform gives us. Subscribe to it. `C2` |
| **YouTube** | ⚠️ Uploads only | **PubSubHubbub / WebSub** — subscribe at `pubsubhubbub.appspot.com/subscribe`, topic `https://www.youtube.com/xml/feeds/videos.xml?channel_id={id}` | New video published, title/description changed | **Free and quota-free** — a major quota-saving trick vs. polling. Lease expires (~5 days); must auto-resubscribe. No comment events. `C2` |
| **Pinterest** | ❌ / UNVERIFIED | — | — | Assume polling. |

**Architecture consequence:** we need **both** a webhook ingestion path (Meta, partial
TikTok/Threads) **and** a polling scheduler (X, LinkedIn, TikTok comments, YouTube comments,
Pinterest). These must converge on one normalized event stream so the inbox does not care
which path an item arrived by. Webhook receipts must be idempotent (Meta redelivers) and
signature-verified (`X-Hub-Signature-256`).

---

## 12. Meta — deep dive

### 12.1 Versioning and the upgrade treadmill

Graph API versions ship roughly quarterly and are supported for **~2 years** from release. `C1`

| Version | Release (recalled) | Confidence |
|---|---|---|
| v19.0 | Jan 2024 | `C2` |
| v20.0 | May 2024 | `C2` |
| v21.0 | Oct 2024 | `C2` |
| v22.0 | Jan 2025 | `C2` |
| v23.0 | May 2025 | `C2` |
| v24.0 / v25.0 / v26.0 | **Projected** Oct 2025 / early 2026 / mid 2026 | **`C3` — the current version as of Aug 2026 is UNVERIFIED** |

**Requirement:** the Graph API version must be a **per-integration config value with a
migration flag**, and we need a scheduled task that checks Meta's changelog quarterly. An
unversioned call defaults to the oldest available version — never rely on the default.

### 12.2 Facebook Pages — endpoint map

| Purpose | Endpoint | Notes |
|---|---|---|
| Text / link post | `POST /{page-id}/feed` | `message`, `link`, `published`, `scheduled_publish_time` |
| Single photo | `POST /{page-id}/photos` | `url` or `source` (multipart); `alt_text_custom` |
| Multi-photo | `POST /{page-id}/photos?published=false` ×N → `POST /{page-id}/feed` with `attached_media[0]={"media_fbid":"..."}` | The classic 2-phase album flow |
| Video | `POST /{page-id}/videos` | resumable via `upload_phase=start/transfer/finish` |
| **Reel** | `POST /{page-id}/video_reels` | 3-phase: `upload_phase=start` → binary POST to returned `rupload.facebook.com` URL → `upload_phase=finish` with `video_state=PUBLISHED\|SCHEDULED\|DRAFT` |
| **Photo story** | `POST /{page-id}/photos?published=false` → `POST /{page-id}/photo_stories` with `photo_id` | |
| **Video story** | `POST /{page-id}/video_stories` `upload_phase=start` → upload → `upload_phase=finish` | |
| Scheduling | `published=false` + `scheduled_publish_time` (unix) | Window: **10 minutes to 6 months** ahead `C2` |
| Insights | `GET /{page-id}/insights`, `GET /{post-id}/insights` | |
| Comments | `GET/POST /{post-id}/comments`, `POST /{comment-id}` `{is_hidden}` | |
| Webhook subscribe | `POST /{page-id}/subscribed_apps` `{subscribed_fields}` | needs `pages_manage_metadata` |

`C1` for the endpoint families; `C2` for parameter names.

### 12.3 Facebook Groups — the deprecation

**Assessment: publishing to Facebook Groups via API is dead.** `C2`

Meta deprecated the Groups API with an effective date around **22 April 2024**, removing
`publish_to_groups` and `groups_access_member_info` and the associated endpoints. Since
then, no mainstream SMM tool offers Facebook Group auto-publishing.

**This is a `C2` claim that functions as a competitive-positioning statement, so it is
verification item #1 in §20.** If it is wrong, it is a differentiator; if it is right,
we must make sure our marketing never implies Group support.

### 12.4 Instagram — the two-API-surface decision

| | **IG API with Facebook Login** | **IG API with Instagram Login** |
|---|---|---|
| Host | `graph.facebook.com` | `graph.instagram.com` |
| Prerequisite | IG Professional account **linked to a Facebook Page** | IG Professional account **only** |
| Token | Page access token (effectively non-expiring) | IG long-lived token, **60 days, self-refreshing** |
| Scopes | `instagram_basic`, `instagram_content_publish`, … | `instagram_business_basic`, `instagram_business_content_publish`, … |
| Ads / product tagging / catalog | ✅ full | ⚠️ reduced (`C3`) |
| Onboarding friction | **High** — user must have a Page, be its admin, and complete a multi-screen Business-Login flow | **Low** — one Instagram login |
| Best for | Agencies, brands, anything touching commerce or ads | Creators, SMBs without a Facebook Page |

**Recommendation:** support **both**, and let onboarding auto-detect. The Instagram-Login
path materially reduces connect-flow drop-off for creators (the fastest-growing segment),
while the Facebook-Login path is required for product tagging and ad-comment access.
This is a real product decision, not just plumbing. `C2`

### 12.5 Instagram content publishing — exact flow

```http
# 1. Create container
POST /v{N}.0/{ig-user-id}/media
  image_url= | video_url=
  media_type= IMAGE | REELS | STORIES | CAROUSEL
  caption=          (<=2200 chars, <=30 hashtags, <=20 @mentions)
  location_id=
  user_tags=        [{"username":"x","x":0.5,"y":0.5}]   # images & carousel image children
  product_tags=     [{"product_id":"...","x":..,"y":..}] # <=5 per media, <=20 per carousel
  collaborators=    ["user1","user2","user3"]            # max 3, not on Stories
  alt_text=
  cover_url= | thumb_offset=                             # REELS
  share_to_feed=true|false                               # REELS
  is_carousel_item=true                                  # carousel children
  children=[<id>,<id>,...]                               # carousel parent, 2-10
→ { "id": "<creation_id>" }

# 2. Poll until ready  (containers expire after 24h)
GET /v{N}.0/{creation_id}?fields=status_code,status
→ status_code ∈ { IN_PROGRESS, FINISHED, ERROR, EXPIRED, PUBLISHED }

# 3. Publish
POST /v{N}.0/{ig-user-id}/media_publish   creation_id=<creation_id>
→ { "id": "<ig_media_id>" }

# Quota check
GET /v{N}.0/{ig-user-id}/content_publishing_limit?fields=config,quota_usage
→ quota_total 100 / quota_duration 86400
```
`C1` for the flow, `C2` for parameter names and caps.

**Failure modes to handle explicitly:**
- `status_code=ERROR` with an opaque `status` string — surface the raw message, do not
  swallow it.
- `EXPIRED` — the container timed out; the whole flow must restart. Our retry logic must
  distinguish "retry publish" from "recreate container".
- Media fetch failures caused by our own CDN (see §5.3).
- Carousel partial failure: some children created, parent fails. Requires compensating
  cleanup or we leak orphaned containers.

### 12.6 Threads

| Aspect | Detail | Confidence |
|---|---|---|
| Host / auth | `graph.threads.net`; authorize at `threads.net/oauth/authorize` | `C2` |
| Publish | `POST /{threads-user-id}/threads` (container: `media_type` = `TEXT`\|`IMAGE`\|`VIDEO`\|`CAROUSEL`) → `POST /{threads-user-id}/threads_publish` | `C1` |
| Text limit | **500** chars | `C2` |
| Carousel | 2–20 items | `C2` |
| Rate | **250 posts / 24 h**; **1,000 replies / 24 h** | `C2` |
| Insights | `GET /{media-id}/insights?metric=views,likes,replies,reposts,quotes,shares`; user-level adds `followers_count`, `follower_demographics` | `C2` |
| Replies | `GET /{media-id}/replies`, `GET /{media-id}/conversation`, `POST /{reply-id}/manage_reply?hide=true` | `C2` |
| Search | `GET /keyword_search` (added post-launch; enables Threads listening) | `C3` |
| Missing | **No DMs. No scheduling. No polls.** | `C1` |

**Threads is the cheapest integration in the tier-1 set** and a good early win: simple flow,
generous limits, low review friction.

---

## 13. X / Twitter — deep dive

### 13.1 Auth specifics

- **OAuth 2.0 Authorization Code with PKCE** is the modern path. Authorize at
  `https://x.com/i/oauth2/authorize`, exchange at `https://api.x.com/2/oauth2/token`.
- **`offline.access` is mandatory** — without it there is no refresh token and the
  connection dies in 2 hours.
- **Refresh tokens are single-use and rotate.** See §3.3 item 2 — this is the highest-risk
  token mechanic in the entire tier-1 set.
- **OAuth 1.0a** remains required for a shrinking set of legacy endpoints (historically
  media upload and Account Activity). We should target v2 + OAuth 2.0 exclusively and treat
  any OAuth 1.0a dependency as tech debt. `C2`

### 13.2 Publishing

```http
POST /2/media/upload      # INIT / APPEND (chunked) / FINALIZE  → media_id
POST /2/media/metadata    { media_id, alt_text: { text: "<=1000 chars" } }
POST /2/tweets
{
  "text": "<=280 chars",
  "media":         { "media_ids": ["..."], "tagged_user_ids": ["..."] },
  "reply":         { "in_reply_to_tweet_id": "...", "exclude_reply_user_ids": [...] },
  "quote_tweet_id":"...",
  "poll":          { "options": ["a","b"], "duration_minutes": 5..10080 },
  "reply_settings":"everyone|mentionedUsers|following|subscribers",
  "geo":           { "place_id": "..." },
  "community_id":  "..."          // C3
}
```
- **Threads (multi-post):** chain via `reply.in_reply_to_tweet_id`. **Not atomic** — a
  mid-thread failure leaves a partial thread published. Our composer must decide: roll
  forward with retry, or delete-and-restart. Recommend roll-forward + explicit user alert.
- **Polls cannot be combined with media.** `C2`
- **Duplicate-content rejection:** X rejects identical/near-identical posts. Vista enforces
  a **72-hour** client-side window (`02` §3.7); we should do the same and surface it at
  compose time rather than at publish time.
- **No native scheduling.** `C1`

### 13.3 Read & analytics

| Field group | Contents | Constraint |
|---|---|---|
| `public_metrics` | `retweet_count`, `reply_count`, `like_count`, `quote_count`, `bookmark_count`, `impression_count` | available on any post |
| `non_public_metrics` | `impression_count`, `url_link_clicks`, `user_profile_clicks` | **owner only, posts <30 days old** |
| `organic_metrics` | organic split of the above | **owner only, <30 days** |
| `promoted_metrics` | promoted split | owner only, promoted posts |

**No audience demographics endpoint exists.** `C1`

`GET /2/usage/tweets` reports consumption against the monthly read cap — **wire this into
our own monitoring and alerting**, because silently exhausting the cap takes X reads
offline platform-wide for the rest of the month.

### 13.4 DMs

`GET /2/dm_events`, `GET /2/dm_conversations/{id}/dm_events`,
`POST /2/dm_conversations/with/{participant_id}/messages`,
`POST /2/dm_conversations/{dm_conversation_id}/messages`,
`POST /2/dm_conversations`. Scopes `dm.read`, `dm.write`. Media via `media_ids`. `C2`

**Without Enterprise there are no DM webhooks** — DM sync is polling, and polling consumes
the metered read cap.

---

## 14. LinkedIn — deep dive

### 14.1 Versioning discipline

```http
GET/POST https://api.linkedin.com/rest/{resource}
LinkedIn-Version: 202506          # YYYYMM, supported ~12 months
X-Restli-Protocol-Version: 2.0.0
Authorization: Bearer <token>
```

**LinkedIn's 12-month support window is tighter than Meta's 24 months.** A `LinkedIn-Version`
pin that is set once and forgotten will start returning errors within a year. Treat the
version header as a **monitored, scheduled-upgrade config value**. `C2`

Rest.li 2.0 also means **URN-heavy payloads** (`urn:li:organization:123`,
`urn:li:person:abc`, `urn:li:image:...`, `urn:li:share:...`, `urn:li:ugcPost:...`) and
non-standard query encoding (`List(...)`, parenthesised filters). Budget real time for the
Rest.li serialization layer; it is unlike every other API in this document. `C1`

### 14.2 Posts API

```http
POST /rest/posts
{
  "author": "urn:li:organization:123",        // or urn:li:person:abc
  "commentary": "<=3000 chars",
  "visibility": "PUBLIC",                      // PUBLIC | CONNECTIONS | LOGGED_IN | CONTAINER
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],                      // org-only organic targeting
    "thirdPartyDistributionChannels": []
  },
  "content": { ... },                          // see below
  "lifecycleState": "PUBLISHED",               // or DRAFT
  "isReshareDisabledByAuthor": false
}
```

| Content type | Shape | Bounds |
|---|---|---|
| Single media | `content.media = { id: "urn:li:image:...", altText, title }` | image or video or document |
| **Multi-image** | `content.multiImage = { images: [{id, altText}, ...] }` | **2–20** |
| **Article / link** | `content.article = { source, title, description, thumbnail }` | link preview control |
| **Poll** | `content.poll = { question (<=140), options[2..4] (<=30 each), settings.duration }` | `ONE_DAY \| THREE_DAYS \| SEVEN_DAYS \| FOURTEEN_DAYS` |
| **Document** | `content.media = { id: "urn:li:document:..." }` | PDF/DOC/PPT → native slide carousel, **≤300 pages / ≤100 MB** (`C3`) |

**The Documents API is LinkedIn's genuinely differentiated format** — the "document
carousel"/"PDF carousel" that performs disproportionately well on LinkedIn and that Vista
markets explicitly (`01` §"how-to-schedule-linkedin-document-carousel-posts"). Support it.

### 14.3 Media upload — three-step, per asset type

```http
POST /rest/images?action=initializeUpload
  { "initializeUploadRequest": { "owner": "urn:li:organization:123" } }
→ { value: { uploadUrl, image: "urn:li:image:..." } }
PUT <uploadUrl>  (binary)
# image URN is immediately usable

POST /rest/videos?action=initializeUpload
  { "initializeUploadRequest": { "owner": ..., "fileSizeBytes": N, "uploadCaptions": false } }
→ { value: { video: "urn:li:video:...", uploadInstructions: [{uploadUrl, firstByte, lastByte}, ...],
             uploadToken } }
PUT each part → capture ETag per part
POST /rest/videos?action=finalizeUpload
  { "finalizeUploadRequest": { "video": ..., "uploadToken": ..., "uploadedPartIds": [etag, ...] } }

POST /rest/documents?action=initializeUpload  → similar
```

**The video path returns explicit byte-range upload instructions and requires echoing part
ETags at finalize.** This is the most involved upload implementation of any platform here.
`C2`

### 14.4 Analytics endpoints

| Endpoint | Gives us |
|---|---|
| `GET /rest/organizationalEntityShareStatistics` | Per-share and aggregate: impressionCount, uniqueImpressionsCount, clickCount, likeCount, commentCount, shareCount, engagement |
| `GET /rest/organizationalEntityFollowerStatistics` | Follower counts split organic/paid, and by seniority / function / industry / company size / region |
| `GET /rest/organizationPageStatistics` | Page views by tab (overview, careers, jobs, life), unique visitors, with demographic breakdowns |
| `GET /rest/brandPageStatistics` | Showcase-page equivalents |
| `GET /rest/socialActions/{urn}` | Like/comment counts for a specific share |
| Video analytics | View metrics, time-watched for org videos (`C3`) |

**Member-level analytics do not exist.** For a personal-profile post we can retrieve
socialActions counts and nothing else — no impressions, no reach, no demographics. `C1`

### 14.5 Comments

```http
GET  /rest/socialActions/{shareUrn}/comments
POST /rest/socialActions/{shareUrn}/comments
     { "actor": "urn:li:organization:123", "message": { "text": "..." } }
POST /rest/socialActions/{shareUrn}/likes
DELETE /rest/socialActions/{shareUrn}/comments/{commentId}
```
Organization mentions inside `commentary` work via entity annotation. **Person mentions on
a Page post only resolve if that person already follows the Page** (`02` §3.6) — a genuinely
surprising restriction to surface in the composer. `C2`

### 14.6 Notifications (mentions inbox)

`GET /rest/organizationalEntityNotifications` returns mentions, comments and shares
involving the organization — this is the Community Management API's inbox primitive.
**Polling only; no webhooks.** `C2`

---

## 15. TikTok — deep dive

### 15.1 Four APIs, three different portals

| API | Host | Purpose | Who can get it |
|---|---|---|---|
| **Login Kit + Display API** | `open.tiktokapis.com/v2` | User profile, list/query own videos | Self-serve |
| **Content Posting API** | `open.tiktokapis.com/v2/post/publish/*` | Direct post + send-to-inbox | Self-serve to build, **audit required to post publicly** |
| **Business API** | `business-api.tiktok.com/open_api/v1.3` | Comments, richer insights, business account publishing | TikTok for Business approval |
| **Research API** | `open.tiktokapis.com/v2/research/*` | Public data at scale | **Academic non-profits (US/EU) only — not available to us** |
| **Commercial Content API** | `.../research/adlib/*` | EU DSA ad repository | Limited |

**The split matters:** comment management lives **only** in the Business API, while
publishing lives in the Content Posting API. A full TikTok integration therefore requires
**two separate approvals**. `C2`

### 15.2 Content Posting flow

```http
# 0. MANDATORY pre-flight
POST /v2/post/publish/creator_info/query/
→ { creator_nickname, creator_username, creator_avatar_url,
    privacy_level_options: ["PUBLIC_TO_EVERYONE","MUTUAL_FOLLOW_FRIENDS","FOLLOWER_OF_CREATOR","SELF_ONLY"],
    comment_disabled, duet_disabled, stitch_disabled,
    max_video_post_duration_sec }

# 1a. Direct post (video)
POST /v2/post/publish/video/init/
{ "post_info": { "title": "...", "privacy_level": "...", "disable_duet": false,
                 "disable_comment": false, "disable_stitch": false,
                 "video_cover_timestamp_ms": 1000,
                 "brand_content_toggle": false, "brand_organic_toggle": false },
  "source_info": { "source": "FILE_UPLOAD", "video_size": N,
                   "chunk_size": M, "total_chunk_count": K } }
   # or  { "source": "PULL_FROM_URL", "video_url": "https://<verified-domain>/..." }
→ { publish_id, upload_url }

PUT <upload_url>  (chunked binary, Content-Range per chunk)

# 1b. Photo carousel
POST /v2/post/publish/content/init/
{ "media_type": "PHOTO", "post_mode": "DIRECT_POST",
  "post_info": { "title", "description", "privacy_level", ... },
  "source_info": { "source": "PULL_FROM_URL", "photo_images": ["url", ...],
                   "photo_cover_index": 0 } }

# 1c. Send to user's TikTok inbox (draft) — no audit needed for public content
POST /v2/post/publish/inbox/video/init/

# 2. Poll
POST /v2/post/publish/status/fetch/  { publish_id }
→ status ∈ { PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, PUBLISH_COMPLETE, FAILED }
```
`C1` for the flow, `C2` for field names.

### 15.3 The audit wall

**Until our app passes TikTok's content-posting audit, every post we make is forced to
`SELF_ONLY` (private).** This is not a soft limit — it is enforced server-side regardless of
what we send. `C1`

**Mitigation while awaiting audit:** ship the **send-to-inbox** path
(`/v2/post/publish/inbox/video/init/`), which delivers the media into the user's TikTok
drafts for them to finish and post manually. It is functionally a superior reminder-publish
flow — the media is already on the device's app, not just a notification — and it is
available pre-audit. **This should be our TikTok v1.** `C2`

### 15.4 `PULL_FROM_URL` domain verification

Using `PULL_FROM_URL` requires **verifying ownership of the URL prefix** in the TikTok
developer portal (a file or DNS challenge). Unverified domains are rejected. This means our
media CDN hostname is a **registered, verified dependency** — changing CDN hosts later
requires re-verification and a coordinated deploy. Choose the hostname deliberately. `C2`

### 15.5 Display API vs Business API metrics

| Metric | Display API | Business API |
|---|---|---|
| Video views / likes / comments / shares | ✅ per video | ✅ |
| Profile views | ❌ | ✅ |
| Follower count / growth | ⚠️ count only | ✅ with time series |
| Audience countries / genders / ages / activity | ❌ | ✅ |
| Comment list / reply / hide / delete | ❌ | ✅ |

`C2`

---

## 16. YouTube — deep dive

### 16.1 Upload

```http
POST https://www.googleapis.com/upload/youtube/v3/videos
  ?uploadType=resumable&part=snippet,status,recordingDetails
{
  "snippet": { "title": "<=100", "description": "<=5000",
               "tags": ["..."],            // <=500 chars total
               "categoryId": "22", "defaultLanguage": "en" },
  "status":  { "privacyStatus": "private|public|unlisted",
               "publishAt": "2026-09-01T15:00:00Z",   // requires privacyStatus=private
               "selfDeclaredMadeForKids": false,
               "containsSyntheticMedia": true,        // AI-disclosure flag
               "license": "youtube", "embeddable": true,
               "publicStatsViewable": true }
}
→ resumable session URI; PUT bytes with Content-Range; resume on 308
```
**Cost: 1,600 quota units.** `C2`

### 16.2 Shorts

**There is no Shorts API and no Shorts flag.** A video is classified as a Short by YouTube
based on **duration ≤ 3 minutes** (raised from 60 s in Oct 2024) and **aspect ratio ≤ 1:1**
(i.e. square or vertical). We upload through `videos.insert` exactly as for any video. `C1`

**Product consequence:** we cannot *guarantee* Shorts placement, only satisfy the criteria.
Our UI must say "will be published as a Short if YouTube classifies it as one", and our
pre-flight validator should warn when a user labels something a Short but the file is
horizontal or over 3 minutes.

### 16.3 Adjacent endpoints

| Purpose | Endpoint | Quota | Note |
|---|---|---|---|
| Thumbnail | `thumbnails.set` | 50 | **Requires a phone-verified channel** — a common silent failure |
| Captions | `captions.insert` | 400 | SRT / SBV / VTT |
| Playlists | `playlists.insert` / `playlistItems.insert` | 50 each | `playlistItems.list` on the uploads playlist = **1 unit**, the cheap way to enumerate a channel |
| Comments | `commentThreads.list` (1) / `commentThreads.insert` (50) / `comments.insert` (50) / `comments.setModerationStatus` / `comments.markAsSpam` | varies | **Cannot pin or heart** |
| Live | `liveBroadcasts.insert` / `liveStreams.insert` / `liveBroadcasts.bind` / `liveBroadcasts.transition` | 50 each | Full live lifecycle is available |
| Analytics | `youtubeAnalytics.reports.query` | separate quota | dimensions × metrics query model |
| Bulk reports | YouTube Reporting API jobs | separate | **CSV files retained 60 days** |

`C2`

### 16.4 The "first comment + self-like" pattern

Vista ships YouTube **"post comment on publish"** and **"first like"** automations
(`02` §3.5) and the research notes it as an under-copied operational nicety. Both are
implementable: `commentThreads.insert` (50 units) for the pinned-intent first comment, and
`videos.rate?rating=like` for the self-like. **Note we cannot actually *pin* it** — so the
feature is "post the first comment", not "pin the first comment". Do not overstate it in the
UI. `C2`

---

## 17. Pinterest — deep dive

### 17.1 Pin creation

```http
POST /v5/pins
{
  "board_id": "...", "board_section_id": "...",
  "title": "<=100", "description": "<=800",
  "link": "<=2048", "alt_text": "<=500",
  "dominant_color": "#RRGGBB",
  "media_source": { "source_type": "image_url",  "url": "..." }
      | { "source_type": "image_base64", "content_type": "image/jpeg", "data": "..." }
      | { "source_type": "multiple_image_urls", "items": [{url, title, description, link}, ...] }   // 2-5
      | { "source_type": "video_id", "media_id": "...", "cover_image_url": "..." }
}
```

**Video path:**
```http
POST /v5/media  { "media_type": "video" }
→ { media_id, upload_url, upload_parameters }     # S3 presigned POST form
POST <upload_url>  (multipart form with upload_parameters + file)
GET  /v5/media/{media_id} → status ∈ { registered, processing, succeeded, failed }
# then reference media_id as video_id in POST /v5/pins
```
`C2`

### 17.2 Analytics

```http
GET /v5/pins/{pin_id}/analytics
  ?start_date=&end_date=&metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK,
    VIDEO_MRC_VIEW,VIDEO_AVG_WATCH_TIME,VIDEO_V50_WATCH_TIME,QUARTILE_95_PERCENT_VIEW,
    VIDEO_10S_VIEW,TOTAL_COMMENTS,TOTAL_REACTIONS
GET /v5/user_account/analytics ?...&split_field=NO_SPLIT|APP_TYPE|CONTENT_TYPE|SOURCE|PIN_FORMAT
GET /v5/user_account/analytics/top_pins
GET /v5/user_account/analytics/top_video_pins
```

**90-day maximum lookback.** Warehouse from day one. `C2`

### 17.3 Access tiers

New apps start in **Trial access** (own account only, low limits). **Standard access**
requires a review. There is a further partner tier for high-volume use. `C2`

### 17.4 Gaps

- **No comment read/reply.** Only `TOTAL_COMMENTS` as an aggregate metric. `C2`
- **No DMs.** `C1`
- **No native scheduling** exposed in v5 (the Pinterest UI has it). `C2`
- **Webhooks: none / UNVERIFIED.** Assume polling.
- **Multi-board posting:** a genuine differentiator Vista ships via bulk CSV
  (`01` §"multi-board bulk CSV upload"). Implement as N pin-creates fanned out from one
  composition, with per-board success tracking.

---

## 18. Deprecation calendar & breaking-change watchlist

### 18.1 Already happened (verify each before relying on it)

| Date | Platform | Change | Confidence |
|---|---|---|---|
| Dec 2021 | YouTube | `dislikes` removed from public API | `C1` |
| 2021 | LinkedIn | Stories discontinued | `C1` |
| ~22 Apr 2024 | **Meta** | **Facebook Groups API deprecated**; `publish_to_groups` removed | `C2` |
| Jun 2024 | Meta | Threads API launched | `C2` |
| ~Jul 2024 | Meta | Instagram API with Instagram Login GA'd | `C2` |
| Oct 2024 | YouTube | Shorts max duration raised **60 s → 3 min** | `C2` |
| **4 Dec 2024** | **Meta** | **Instagram Basic Display API fully retired** | `C2` |
| 2024 | Pinterest | Idea Pins folded into standard Pins | `C3` |
| Jan 2025 (v22.0) | Meta | `views` introduced as the unified metric | `C2` |
| **~21 Apr 2025** | **Meta** | **`impressions`, `plays`, `video_views`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` REMOVED** | `C2` |
| ~31 Mar 2025 (extended) | X | v1.1 `media/upload` sunset in favour of `POST /2/media/upload` | `C2` |
| May 2025 | Meta | Graph API v23.0 | `C2` |

### 18.2 Rolling / structural obligations

| Cadence | Platform | Obligation |
|---|---|---|
| **Quarterly** | Meta | New Graph API version ships; oldest supported version drops (~2-year window) |
| **Monthly** | LinkedIn | New `LinkedIn-Version`; **12-month support window** — the tightest treadmill in the set |
| **Annual** | Meta | **Data Protection Assessment** — failure can revoke permissions app-wide |
| **Annual** | YouTube | **YouTube API Services compliance audit** |
| **Annual** | Google | OAuth verification re-review for sensitive/restricted scopes; CASA assessment renewal |
| **Continuous** | X | Tier/pricing changes with little notice; historically 2+ material re-prices |
| **Continuous** | TikTok | UX-guideline changes that can retroactively fail our audit |

### 18.3 The Aug-2026 blind spot — what I cannot see

**My knowledge ends May 2026.** The following are the highest-probability places a breaking
change landed in the June–August 2026 window that this document does not reflect:

1. **Meta Graph API version** currently in force, and whatever was deprecated with it.
2. **X pricing and tier caps** — the single most volatile item here.
3. **Instagram Trial Reels API** — `01` lists Vista shipping "Instagram Trial Reels", which
   implies Meta exposed a trial-reels parameter. **I cannot confirm the field name.**
   `UNVERIFIED` — and it is a competitive-parity item.
4. **TikTok photo/carousel auto-publish status** — `02` §"DOC-CONFLICT" flags stale docs on
   exactly this, suggesting the capability matured during 2025–2026.
5. **Threads**: DM API, scheduling, or ads — all plausible 2026 additions.
6. **LinkedIn**: any loosening of member analytics or messaging access.
7. **Whether any platform shipped an AI-content disclosure requirement** beyond YouTube's
   `containsSyntheticMedia` and TikTok's `is_aigc` — this is a fast-moving regulatory area
   and a likely 2026 addition across Meta/LinkedIn.

---

## 19. Engineering implications for our build

### 19.1 The publishing pipeline as a state machine

Nine platforms, three archetypes (§4.3), all asynchronous, none transactional. The pipeline
must be an explicit, persisted state machine, not a job that calls an SDK.

```
DRAFT → VALIDATED → MEDIA_STAGED → CONTAINER_CREATED → PROCESSING
      → READY → PUBLISHING → PUBLISHED
                           ↘ FAILED_RETRYABLE → (backoff) → PUBLISHING
                           ↘ FAILED_TERMINAL  → user-actionable error
                           ↘ EXPIRED (container TTL) → MEDIA_STAGED
```

Required properties:
- **Idempotency keys** on every publish attempt. Meta and TikTok can both succeed
  server-side while the response is lost; a naive retry double-posts. This is the single
  most damaging bug class in this product category.
- **Retryable vs terminal error classification per platform**, maintained as a table, not
  as `catch(e)`. Rate-limit and transient-media errors retry; policy rejections and
  duplicate-content rejections must not.
- **Container-expiry awareness** (Meta 24 h) — restart from staging, not from publish.
- **Partial-success handling** for carousels and X threads.
- **Per-connection circuit breakers** so one broken token does not starve the queue.

### 19.2 Pre-flight validation is the highest-ROI feature

Every constraint in §5 should be checked **at compose time**, in the browser, before the
user schedules — not at publish time, hours later, when nobody is watching. This directly
addresses the reliability gap identified in `01` §20 ("resilient publishing with retries and
pre-flight validation").

The constraint table must be **data, not code**: a versioned config document per platform
per format, so a limit change is a config deploy, not a release.

Validation classes:
1. **Hard-fail** — file too large, wrong codec, duration over limit, caption over limit.
2. **Warn** — aspect ratio outside recommendation, no alt text, YouTube "Short" that is
   horizontal, X video approaching 140 s.
3. **Platform-specific pre-flight calls** — TikTok `creator_info` (mandatory), Instagram
   `content_publishing_limit`, X `GET /2/usage/tweets`.

### 19.3 Alt text as a differentiator

`02` §3.6 flags that Vista Social appears to have **no alt-text support on any network**,
despite Meta, X, LinkedIn and Pinterest all exposing it. Four of our nine surfaces support
alt text (§4.2). Shipping alt text — with AI-assisted generation and a WCAG-oriented
nudge — is a cheap, high-credibility accessibility differentiator that matters in
public-sector and enterprise procurement.

### 19.4 Reconnection UX as a product surface

Given §3.2, connection death is routine, not exceptional. Requirements:
- A **Connection Health** view listing every connected account with state
  (`healthy` / `expiring in N days` / `needs reconnect` / `permissions missing`).
- **Proactive email + in-app warning** at T-14 and T-3 days before a known expiry
  (LinkedIn's 60-day wall makes this mandatory).
- **Scope-delta detection** — if a platform adds a required permission, detect the missing
  scope and prompt for incremental re-consent rather than failing at publish.
- **Per-connection failure history** so support can answer "why did this stop working".

### 19.5 Cost model for X

Because X is the only metered platform, its cost must be modelled per customer:

```
monthly_x_reads ≈ accounts × (mention_polls_per_day × 30 × avg_results_per_poll
                              + dm_polls_per_day × 30 × avg_dm_results)
```
Against a Pro cap of 1,000,000 reads/month (`C3`), this constrains either the number of X
accounts we support or the freshness of X inbox data. **Decide explicitly**: either gate X
mentions/inbox to higher-priced plans, offer degraded polling frequency on lower plans, or
bring-your-own-X-credentials for heavy users.

### 19.6 Day-one warehouse

Per §7.2, Pinterest (90 d), X non-public metrics (30 d), TikTok (~60 d) and YouTube
Reporting (60 d) all discard data we will later be asked for. **The metrics warehouse is a
launch requirement, not a v2 item.** Schema: `(platform, entity_type, entity_id, metric_name,
metric_value, date, api_version, collected_at, raw_payload_ref)`. The `api_version` and
`metric_name`-as-returned columns are what make the §7.3 provenance feature possible.

### 19.7 Build order recommendation

Sequenced by (value ÷ effort) using §2.2 and §10.1 calendar times:

| Wave | Platforms | Rationale |
|---|---|---|
| **0 (immediately, in parallel with everything)** | **File all applications**: Meta Business Verification + App Review, LinkedIn Community Management, TikTok audit, Google OAuth verification + YouTube quota extension, Pinterest Standard access | These are calendar-time dependencies measured in **weeks-to-months**. Nothing about them gets faster by starting later. |
| **1** | Facebook Pages, Instagram, Threads | One auth family, one publish archetype, highest customer demand. Threads is nearly free once IG is done. |
| **2** | Pinterest, YouTube | Low complexity; YouTube's analytics are best-in-class and cheap to surface. |
| **3** | LinkedIn | High effort (Rest.li, three-step uploads) and gated on wave-0 approval. |
| **4** | TikTok | Highest complexity, bespoke UI branch required, gated on audit. **Ship send-to-inbox first** (§15.3). |
| **5** | X | Ship last or gate to paid tiers; it is the only platform with a direct marginal cost and the weakest analytics. |

---

## 20. Verification backlog

**Nothing in this document has been verified.** Run this before the publishing pipeline is
written. Ordered by how much of the build each item unblocks.

### 20.1 P0 — blocks architecture decisions

| # | Question | Source to fetch |
|---|---|---|
| 1 | **Is Facebook Groups publishing really dead?** (§6.1 #4, §12.3) | `developers.facebook.com/docs/graph-api/changelog` + Groups API docs |
| 2 | **Current Graph API version** and its deprecation date | `developers.facebook.com/docs/graph-api/changelog` |
| 3 | **X current pricing and per-tier read/write caps** — every number in §9.2 | `docs.x.com/x-api/getting-started/about-x-api`, x.com developer portal pricing |
| 4 | **Does LinkedIn still withhold refresh tokens from unapproved apps?** (§3.2 rank 1) | `learn.microsoft.com/linkedin/shared/authentication/authorization-code-flow` |
| 5 | **TikTok refresh-token semantics** — does refreshing reset the 365-day clock? (§3.2 rank 3) | `developers.tiktok.com/doc/oauth-user-access-token-management` |
| 6 | **YouTube quota costs + current default** and whether extensions are still granted | `developers.google.com/youtube/v3/determine_quota_cost`, quota-extension form |
| 7 | **Instagram 100-post/24h limit** still current; does it still count Stories? | `developers.facebook.com/docs/instagram-platform/content-publishing` |

### 20.2 P1 — blocks the composer and validator

| # | Question | Source |
|---|---|---|
| 8 | Full current media-constraint table for IG Reels/Stories/carousel (§5) | IG content-publishing reference |
| 9 | **Instagram Trial Reels** — is there an API field? (§18.3 #3) | IG content-publishing reference + changelog |
| 10 | TikTok photo-carousel direct-post status and current caps (§18.3 #4) | `developers.tiktok.com/doc/content-posting-api-reference-direct-post` |
| 11 | TikTok current UX-guideline checklist (§10.2) | `developers.tiktok.com/doc/content-sharing-guidelines` |
| 12 | LinkedIn video limits — 15 vs 30 min, 500 MB vs 5 GB (§5.2 conflict) | LinkedIn Videos API docs |
| 13 | LinkedIn `multiImage` max (20?) and Documents max pages/size | LinkedIn Posts API + Documents API |
| 14 | X media limits and whether 280 chars still binds for Premium accounts | `docs.x.com/x-api/media`, `docs.x.com/x-api/posts/creation` |
| 15 | Pinterest image max size (10 vs 20 MB) and carousel max (5?) | `developers.pinterest.com/docs/api/v5/pins-create` |
| 16 | Whether Pinterest exposes scheduling or webhooks (§17.4) | Pinterest v5 reference |

### 20.3 P2 — blocks analytics and inbox

| # | Question | Source |
|---|---|---|
| 17 | Post-`views`-migration IG/FB metric list; confirm removal date (§7.3) | Meta Insights API reference + changelog |
| 18 | Confirm YouTube Analytics API still lacks `impressions`/CTR (§7.3) | `developers.google.com/youtube/analytics/metrics` |
| 19 | Pinterest 90-day analytics window still current | Pinterest analytics reference |
| 20 | X `non_public_metrics` 30-day window still current | `docs.x.com/x-api/fundamentals/metrics` |
| 21 | Threads webhook coverage (§11) | `developers.facebook.com/docs/threads/webhooks` |
| 22 | IG messaging rate ceilings (750/hr private replies, 200/hr messages) | Meta Messenger Platform docs |
| 23 | LinkedIn throttle numbers per endpoint | LinkedIn Developer Portal "Usage" tab (requires an app) |
| 24 | Whether any LinkedIn messaging/Conversations API has opened to general access | LinkedIn Community Management docs |

### 20.4 P3 — competitive and regulatory

| # | Question | Source |
|---|---|---|
| 25 | New AI-disclosure requirements across Meta/LinkedIn/Pinterest (§18.3 #7) | Each platform's policy changelog |
| 26 | Meta Tech Provider requirements current state | Meta business-verification docs |
| 27 | Whether X Account Activity API has moved below Enterprise | `docs.x.com` |
| 28 | Pinterest partner-tier rate limits | Pinterest partner docs |
| 29 | Any 2026 changes to YouTube Community Posts API availability | YouTube Data API changelog |

### 20.5 How to run this efficiently

All 29 items live on **six** documentation domains. A single research pass with working
egress should fetch, in this order:

1. `developers.facebook.com/docs/graph-api/changelog` — answers #1, #2, #17, #25
2. `developers.facebook.com/docs/instagram-platform/content-publishing` — #7, #8, #9
3. `docs.x.com/x-api/getting-started/about-x-api` + `/fundamentals/rate-limits` — #3, #14, #20, #27
4. `learn.microsoft.com/en-us/linkedin/marketing/` (auth, posts, videos, documents, community-management) — #4, #12, #13, #23, #24
5. `developers.tiktok.com/doc/` (oauth, content-posting-api-reference, guidelines) — #5, #10, #11
6. `developers.google.com/youtube/v3/determine_quota_cost` + `/analytics/metrics` — #6, #18, #29
7. `developers.pinterest.com/docs/api/v5/` — #15, #16, #19, #28

**Estimated: ~25–35 fetches, one session with working egress.** Every table in this document
is structured so that verified values can be substituted in place without restructuring.

---

## Appendix A — Endpoint quick reference

| Action | Facebook Page | Instagram | Threads | X | LinkedIn | TikTok | YouTube | Pinterest |
|---|---|---|---|---|---|---|---|---|
| Create post | `POST /{page}/feed` | `POST /{ig}/media` → `/media_publish` | `POST /{id}/threads` → `/threads_publish` | `POST /2/tweets` | `POST /rest/posts` | `POST /v2/post/publish/video/init/` | `POST /upload/youtube/v3/videos` | `POST /v5/pins` |
| Upload media | `POST /{page}/photos` \| `/videos` \| `/video_reels` | via `image_url`/`video_url` (Meta pulls) | via URL | `POST /2/media/upload` | `POST /rest/images\|videos\|documents?action=initializeUpload` | init + chunked PUT | resumable PUT | `POST /v5/media` |
| Delete post | `DELETE /{post-id}` | `DELETE /{media-id}` (`C3`) | `DELETE /{id}` | `DELETE /2/tweets/{id}` | `DELETE /rest/posts/{urn}` | ⚠️ `C3` | `videos.delete` | `DELETE /v5/pins/{id}` |
| List comments | `GET /{post}/comments` | `GET /{media}/comments` | `GET /{media}/replies` | search/conversation | `GET /rest/socialActions/{urn}/comments` | Business API `/comment/list/` | `commentThreads.list` | ❌ |
| Reply | `POST /{comment}/comments` | `POST /{comment}/replies` | `POST /{id}/threads` reply | `POST /2/tweets` w/ reply | `POST /rest/socialActions/{urn}/comments` | `/comment/reply/create/` | `comments.insert` | ❌ |
| Post analytics | `GET /{post}/insights` | `GET /{media}/insights` | `GET /{media}/insights` | `tweet.fields=public_metrics,…` | `organizationalEntityShareStatistics` | `/v2/video/query/` or Business API | `youtubeAnalytics.reports.query` | `GET /v5/pins/{id}/analytics` |
| Account analytics | `GET /{page}/insights` | `GET /{ig}/insights` | `GET /{id}/threads_insights` | ❌ | `organizationPageStatistics` | Business `/business/get/` | Analytics API | `GET /v5/user_account/analytics` |
| Publish quota | BUC headers | `GET /{ig}/content_publishing_limit` | `GET /{id}/threads_publishing_limit` | `GET /2/usage/tweets` | Portal only | ❌ | Cloud Console | headers |

`C2` throughout; several cells are recalled rather than confirmed.

## Appendix B — Error-handling cheat sheet

| Platform | Rate limit signal | Token-dead signal | Retryable? |
|---|---|---|---|
| Meta | code `4` (app), `17` (user), `32` (page), `613`; `X-App-Usage` ≥ 100% | code `190` (+ `error_subcode` 458/459/460/463/467) | 4/17/32/613 yes; 190 no — reconnect |
| X | HTTP 429 + `x-rate-limit-reset` | HTTP 401; `invalid_grant` on refresh | 429 yes; 401 no |
| LinkedIn | HTTP 429 | HTTP 401 `REVOKED_ACCESS_TOKEN` / `EXPIRED_ACCESS_TOKEN` | 429 yes |
| TikTok | `rate_limit_exceeded` | `access_token_invalid`, webhook `authorization.removed` | rate limit yes |
| YouTube | `rateLimitExceeded` (retry) vs **`quotaExceeded` (do NOT retry — daily budget gone)** | `invalid_grant` | see left |
| Pinterest | HTTP 429 + `X-RateLimit-Reset` | HTTP 401 | 429 yes |

**The YouTube distinction matters:** `quotaExceeded` means the *daily* budget is spent —
retrying makes it worse and the job must be deferred to the next quota day (midnight
Pacific). `C2`

---

*End of document. Every claim herein is UNVERIFIED — see the provenance warning at the top
and the verification backlog in §20.*
