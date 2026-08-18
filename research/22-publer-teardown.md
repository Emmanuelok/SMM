# Publer — Forensic Teardown

**File:** `research/22-publer-teardown.md`
**Subject:** Publer (publer.com, formerly/also publer.io) — social media management & scheduling
**Date of research:** 12 August 2026
**Analyst brief:** Establish exactly what Publer supports and how it achieves the widest
network coverage of any affordable tool; determine whether that breadth is legitimately
matchable.

---

## 0. READ THIS FIRST — research provenance and verification status

This teardown was executed under a **hard network constraint that materially shaped it**, and
the reader must know exactly which claims rest on what.

### 0.1 What was blocked

The session's egress proxy **denies `publer.com`, `publer.io`, `help.publer.com`,
`blog.publer.com` and `feedback.publer.com` outright**. It also denies every mainstream review
and app-distribution host:

| Host | Status |
|---|---|
| `publer.com` / `publer.io` / `help.publer.com` | ❌ EGRESS_BLOCKED |
| `www.g2.com`, `www.capterra.com`, `www.trustpilot.com` | ❌ EGRESS_BLOCKED |
| `www.reddit.com`, `www.producthunt.com`, `alternativeto.net` | ❌ EGRESS_BLOCKED |
| `appsumo.com` | ❌ EGRESS_BLOCKED |
| `apps.apple.com`, `play.google.com`, `chromewebstore.google.com` | ❌ EGRESS_BLOCKED |
| `web.archive.org`, `r.jina.ai` | ❌ blocked / unavailable |
| Review-farm blogs (`socialchamp.com`, `socialrails.com`, `turrboo.com`, `saasworthy.com`, `socialk.it`) | ❌ EGRESS_BLOCKED |
| `github.com`, `raw.githubusercontent.com`, `registry.npmjs.org` | ✅ reachable |

I did **not** attempt to route around the policy via CORS proxies or mirrors — that would be
circumventing an organisational egress control.

### 0.2 What was therefore used

1. **`WebSearch` against `publer.com`** (allowed-domain-scoped). The search tool *does* read and
   summarise Publer's own help-centre articles, `/plans`, `/features/*` and `/docs/*` pages even
   though direct fetch is denied. This produced the bulk of the product findings. **The search
   budget was exhausted mid-research (200/200 calls)**, which capped how many Publer help
   articles could be interrogated.
2. **Primary-source code artefacts on GitHub and npm** — this turned out to be the single richest
   vein and is why the API and publishing-mechanics sections below are unusually exact:
   - `api-evangelist/publer` — a reconstructed **OpenAPI 3.0.1 spec** plus a structured
     `publer-plans-pricing.yml` (dated 2026-06-25).
   - `emanueldervishi/publer-mcp` — `src/publerClient.ts` (52 KB) and `src/schemas.ts`, containing
     **literal Zod enums for providers, post states, post types, and the recycling/recurring
     payload fields**.
   - `n8n-nodes-publer@1.0.4` (npm, published 2025-11-14) — the compiled node, from which the
     **complete endpoint path list** was extracted.
   - `alexkess/publer-mcp-server`, `kapetan-io/publer.go`, `OwenMcGirr/publer-client`.

### 0.3 Confidence tagging used throughout

| Tag | Meaning |
|---|---|
| `[V]` | **Verified** this session against Publer's own pages (via search) or against a machine-readable primary artefact (OpenAPI spec, client source, npm package). |
| `[V2]` | Verified by **two independent** artefacts that agree. |
| `[S]` | **Secondary** — a third party's reconstruction of Publer (e.g. API Evangelist's spec/pricing YAML). Directionally reliable, not authoritative. |
| `[U]` | **UNVERIFIED** — could not be confirmed this session. Treat as a hypothesis. |

**Every dollar figure in this document is `[S]` or `[U]`.** Publer's `/plans` page uses an
interactive slider; the price depends on account count, member count and billing cycle, and no
static page could be fetched. §18 explains the reconstruction and its uncertainty explicitly.

**Staleness flags (August 2026):** the API Evangelist pricing snapshot is dated **2026-06-25**
(≈7 weeks old — good). The `n8n-nodes-publer` package was last published **2025-11-14** (≈9
months old — its endpoint list may lag). The Publer help-centre content read via search has no
visible modification dates; treat feature-gating claims as current-but-uncorroborated.

---

## 1. Executive summary — the verdict in one page

**Publer is the coverage-per-dollar leader of the horizontal SMM tier, and its breadth is
entirely legitimate and entirely copyable.** There is no secret. Publer supports **13 networks**,
and every one of them has an official, documented, publicly available API. The reason Publer
looks unusually broad is not that it does anything clever — it is that **it added the four
networks whose APIs are free, unreviewed and instant to integrate (Mastodon, Bluesky, Telegram,
WordPress) while most competitors did not bother.** See §5, which is the most strategically
important section in this file.

Five findings that change how you should think about Publer:

1. **The famous feature is not in the cheap plan.** Publer's reputation rests on its evergreen
   **recycling** engine. Recycling *and* recurring posts are **Business-tier-gated** `[V]`. The
   "$12/mo" headline buys Professional, which does not include them. §18.5.
2. **The network list stops precisely where API cost begins.** Free plan **excludes X/Twitter**
   `[V]` — a direct, observable pass-through of X's API pricing. Reddit, Snapchat and Discord are
   **not supported at all** `[V2]`. §4, §5.
3. **AI is BYO-key below Business.** On Free and Professional you connect **your own OpenAI API
   key**; unlimited Publer-funded AI prompts start at Business `[V]`. This is a deliberate
   COGS-avoidance design and is worth studying. §9.
4. **Publer publishes a real, versioned public API with genuinely exposed scheduling semantics**
   (`gap`, `gap_freq`, `expire_count`, `expire_date`, `recurring.repeat_rate`) `[V2]` — rare in
   this price tier. It is **Business-gated** and is an *account-automation* API, **not** a
   white-label multi-tenant API. §17.
5. **Publer's own help centre contains an article titled "Why are my charges higher than those
   listed on the Plans and Pricing page?"** `[V]`. A vendor does not write that article unless
   billing surprise is a recurring, high-volume support theme. This is the strongest *sourced*
   evidence of a real user complaint obtainable under the network constraints. §20.

**Match difficulty for us:** LOW-to-MEDIUM. Four of Publer's thirteen networks (Mastodon,
Bluesky, Telegram, WordPress) can be shipped in days each with no partner review. The other nine
are the standard App Review grind every competitor faces. **Publer's moat is not technical; it
is that it did the boring work first and priced it at $4/account.**

---

## 2. Company snapshot

| Item | Value | Tag |
|---|---|---|
| Product | Publer — social media scheduling & management | `[V]` |
| Domains | `publer.com` (primary), `publer.io` (legacy/alias), app at `app.publer.com` | `[V]` |
| Help centre | `publer.com/help/en/` (also served at `help.publer.com/en/`) — Intercom-style | `[V]` |
| Developer docs | `publer.com/docs` (`/getting-started/*`, `/api-reference/*`, `/posting/*`, `/analytics/*`) | `[V]` |
| Public feedback board | `feedback.publer.com` (numeric idea IDs, e.g. `/84`, `/2172`) | `[V]` |
| Blog | `publer.com/blog/*`, also `blog.publer.com/*`; **localised paths exist** (e.g. `/blog/it/...` Italian) | `[V]` |
| Origin | Albania (Tirana) | `[U]` |
| Claimed scale | "~$2M ARR, ~400K registered users" — third-hand, unsourced | `[U]` |
| Terms | `publer.com/terms` | `[V]` |

**Localisation note `[V]`:** the existence of `publer.com/blog/it/tracciamento-e-accorciamento-automatico-dei-link/`
confirms Publer runs a **localised content-marketing surface**, consistent with the
non-English-first GTM pattern this research programme has flagged elsewhere as under-exploited.

---

## 3. Network coverage — the definitive list

### 3.1 The 13 supported networks

This list is `[V2]` — it is corroborated by **three independent artefacts that agree exactly**:
(a) Publer's own help article *"What social networks are supported?"* read via search;
(b) the `provider` enum in the API Evangelist OpenAPI reconstruction;
(c) the `providerSchema` Zod enum in `emanueldervishi/publer-mcp/src/schemas.ts`.

| # | Network | API `provider` value | Account `type` values implied | Notes |
|---|---|---|---|---|
| 1 | **Facebook** | `facebook` | `page`, `profile`, `group` | Pages **and Groups** — Groups is comparatively rare `[V]` |
| 2 | **Instagram** | `instagram` | `business`, `profile` | Reels/Stories/carousel supported as post types `[V]` |
| 3 | **X / Twitter** | `twitter` | `profile` | **Excluded from the Free plan** `[V]` |
| 4 | **LinkedIn** | `linkedin` | `profile`, `page` | Personal profiles + company pages `[V]` |
| 5 | **Pinterest** | `pinterest` | `profile` / board targeting | `[V]` |
| 6 | **YouTube** | `youtube` | `channel` | Video + Shorts (`short` post type exists) `[V]` |
| 7 | **TikTok** | `tiktok` | `profile` | **Watermarks NOT supported — TikTok API limitation** `[V]` |
| 8 | **Google Business Profile** | `google` | `location` | Per-location targeting `[V]` |
| 9 | **WordPress** | `wordpress` | `blog` | Publishes blog posts — very rare in this tier `[V]` |
| 10 | **Telegram** | `telegram` | `channel`, `group` | `[V]` |
| 11 | **Mastodon** | `mastodon` | `profile` | Comment/reply management supported `[V]` |
| 12 | **Threads** | `threads` | `profile` | Added when Meta shipped the Threads API; Publer blogged *"Post Directly to Threads and Get Insights with Publer — New API Update"* `[V]` |
| 13 | **Bluesky** | `bluesky` | `profile` | Comment/reply management supported `[V]` |

**Full account-`type` enum from the OpenAPI spec `[S]`:**
`page`, `profile`, `group`, `business`, `channel`, `location`, `blog` — seven distinct account
shapes across thirteen providers. This is a well-normalised model and is worth copying: it
separates "which network" from "what kind of thing on that network", which most competitors
conflate.

### 3.2 What Publer does **NOT** support

Directly answering the brief's question list:

| Network | Supported? | Evidence |
|---|---|---|
| **Reddit** | ❌ **NO** | Absent from all three independent enumerations `[V2]` |
| **Snapchat** | ❌ **NO** | Absent from all three `[V2]` |
| **Discord** | ❌ **NO** | Absent from all three `[V2]` |
| Mastodon | ✅ yes | `[V2]` |
| Bluesky | ✅ yes | `[V2]` |
| Threads | ✅ yes | `[V2]` |
| Telegram | ✅ yes | `[V2]` |
| Google Business Profile | ✅ yes | `[V2]` |
| YouTube | ✅ yes | `[V2]` |
| Pinterest | ✅ yes | `[V2]` |
| WordPress | ✅ yes | `[V2]` |
| TikTok | ✅ yes | `[V2]` |

Also **absent** `[V2]` (no provider enum entry): VK, OK.ru, Tumblr, Twitch, Xing, Medium,
Substack, Ghost, Weibo, WeChat, LINE, Viber, WhatsApp Business, Nextdoor, Vimeo, Dailymotion,
Rumble, Lemon8, Xiaohongshu/RED, Kick, Snapchat, Discord, Reddit, Slack, Microsoft Teams.

**The correction this teardown makes to the prior working assumption:** the brief and the earlier
`04-competitors-smb.md` scaffold both speculated Publer might cover Reddit/Snapchat/Discord. **It
does not.** Publer's coverage is 13, not 15–20. It is broad *for its price*, not broad in
absolute terms — Upload-Post (23 networks, per `05-competitors-dev-oss.md`) is materially broader.

---

## 4. Post types and content formats

From `postTypeSchema` in `emanueldervishi/publer-mcp/src/schemas.ts` `[V]`, cross-checked against
the OpenAPI `BulkPost.networks.*.type` enum `[S]`:

| Post type | Notes |
|---|---|
| `status` | Plain text |
| `link` | Link post with preview; `/posts/links` endpoint fetches link metadata `[V]` |
| `photo` | Single image |
| `gif` | GIF is a first-class type, distinct from photo/video |
| `video` | Standard video |
| `reel` | Instagram/Facebook Reels |
| `story` | Stories |
| `short` | YouTube Shorts |
| `poll` | Native polls |
| `document` | Document/PDF posts (LinkedIn carousels-as-PDF) — the OpenAPI enum also lists `pdf` `[S]` |
| `carousel` | Multi-image carousel |
| `article` | Long-form / blog article (maps to the WordPress provider) |

**Twelve content types across thirteen networks.** The presence of `document`/`pdf` and `article`
as first-class types is notable — most cheap schedulers model only text/photo/video/link.

**Ancillary post capabilities `[V]`:**

- **First/follow-up comments** — "add follow-up comments to my posts to extend conversations",
  supporting hashtags, links, captions, emojis or media.
- **Location tagging** — dedicated `/locations/{network}` endpoint; *"Search for locations on
  Facebook, Instagram, or Threads"* `[V]`.
- **Labels** — posts carry a `labels` array; the MCP client sets `accounts: [{ id, labels: [""] }]` `[V]`.
- **Spintax variations** — "create variations of your evergreen social posts with spintax" `[V]`.
- **Auto-delete posts** — a scheduled auto-deletion feature exists
  (`/help/en/article/how-to-auto-delete-posts-1t21ddd/`) `[V]`.
- **Signatures** — auto-appended outro text (see §11).

---

## 5. ★ How Publer achieves broad coverage cheaply — the strategic answer

This is the section the brief exists for. **The answer is not "shared app credentials" versus
"per-user apps" versus "unofficial methods." The answer is network selection.**

### 5.1 Publer states it uses official APIs

Publer's help article *"How does Publer communicate with the social networks?"* says, verbatim in
substance `[V]`:

> Publer connects with major social networks **through APIs** … Publer's capabilities are
> **limited by these official APIs**, which vary by social network, meaning each social network
> connects to Publer differently, and **some scheduling features and post types may only be
> available on certain networks**.

Two corroborating observables that this is true rather than marketing:

- **"Watermarks are not supported for TikTok accounts due to limitations of its API"** `[V]`. A
  vendor using unofficial/browser-automation methods would not be constrained this way.
- **The Threads launch was gated on Meta shipping the API** — Publer's blog post is literally
  titled *"Post Directly to Threads and Get Insights with Publer — New API Update"* `[V]`.

**Conclusion: no unofficial methods, no headless-browser publishing, no scraped endpoints.**
`[V]` on the evidence available.

### 5.2 The shared-app model

`[V-inference]` — strongly implied, not directly documented. Publer uses **one set of platform
app credentials per network, shared across all Publer customers** (the standard SMM model). The
evidence:

- Nowhere in the documented onboarding does a user supply Meta/TikTok/LinkedIn app credentials.
  Users connect via OAuth ("How to sign up to Publer with my social networks") `[V]`.
- **The single BYO credential anywhere in the product is the OpenAI API key** `[V]` — Publer
  clearly *knows* how to expose a BYO-credential flow and has chosen to do so only for the cost
  centre it does not want to absorb. If it were doing BYO-app for social networks, it would look
  exactly like the OpenAI flow. It does not.
- Publer runs **daily post limits and explicit anti-spam measures** with waivers available for
  "established news media companies, verified government agencies, or publicly owned services"
  `[V]`. **Per-tenant rate governance of this kind is only necessary when tenants share a
  platform-level quota** — i.e. a shared app. This is the strongest structural tell.

### 5.3 The actual cost structure of Publer's 13 networks

Split the list by what it costs to integrate and operate:

| Class | Networks | App Review? | Ongoing $ cost | Integration effort |
|---|---|---|---|---|
| **A — Free, open, no review** | **Mastodon, Bluesky, Telegram, WordPress** | **None** | **$0** | Days each |
| **B — Reviewed but free** | Facebook, Instagram, Threads, LinkedIn, Pinterest, YouTube, TikTok, Google Business Profile | Yes, per-platform, recurring recertification | $0 API fees, high compliance labour | Weeks–months each |
| **C — Metered / paid** | **X (Twitter)** | Yes | **Real per-seat/per-post cost** | Weeks |

**Class A is the entire "unusually broad coverage" story.** Four of thirteen networks — the four
that make Publer look exotic next to Buffer or Later — cost approximately nothing:

- **Mastodon** — per-instance OAuth app registration, free, instant, no review. The only real work
  is handling arbitrary instance hostnames.
- **Bluesky / AT Protocol** — app passwords or OAuth, free, no review, no partner programme.
- **Telegram** — Bot API. A token in under a minute, free, unlimited-ish, no review whatsoever.
- **WordPress** — REST API + application passwords for self-hosted; OAuth for WordPress.com. No
  gatekeeper.

**And Class C proves the cost model is being passed through to the customer.** The Free plan
supports 3 social accounts **"excluding Twitter accounts"** `[V]`. Publer will give away Facebook,
Instagram, TikTok, YouTube, LinkedIn, Pinterest, Google Business, WordPress, Telegram, Mastodon,
Threads and Bluesky for free — but not X. That is not a product decision; **that is a COGS
decision made visible in the packaging.**

### 5.4 Why the missing networks are missing

The absences are as informative as the presences:

- **Reddit** — the API is technically available but Reddit's terms and rate posture toward
  third-party scheduling/automation tools are hostile, and the moderation-driven failure modes
  (posts removed by subreddit rules) generate support load disproportionate to any revenue.
- **Snapchat** — there is **no general third-party publishing API** for Snapchat organic content.
  Not a choice; not possible.
- **Discord** — would be *trivial* via webhooks (cheaper than Telegram), which tells you the
  omission is **ICP-driven, not cost-driven**: Discord is a community platform, not a marketing
  distribution channel for Publer's SMB/agency buyer.

### 5.5 What this means for us — actionable

1. **Publer's breadth is legitimately matchable.** Every one of the 13 has an official API. There
   is nothing to reverse-engineer and nothing legally grey to replicate.
2. **The four Class-A networks are the cheapest differentiation available in this entire market.**
   Mastodon, Bluesky, Telegram and WordPress cost days, not quarters, and buy the "widest coverage"
   claim outright. Ship them before the reviewed networks, not after.
3. **Publer's pricing model is structurally hostile to its own differentiator.** It charges
   **per social account** `[V]`. A customer who adopts Publer *because* it supports Mastodon,
   Bluesky and Telegram then **pays extra for each one**. Charging per account taxes exactly the
   behaviour the differentiator is meant to encourage. This is an exploitable weakness: a
   per-brand or per-workspace price makes breadth free to the customer and makes our breadth a
   pure gain rather than an upsell.
4. **The anti-spam/daily-limit apparatus is not optional.** If you run a shared-app model you
   *must* build per-tenant quota governance or one abusive tenant burns the shared app for
   everyone. Publer's daily post limits, Enterprise-only waivers, and the documented waiver
   process for news/government are the reference implementation. Budget for this.
5. **X should be packaged separately from day one.** Publer's free-plan exclusion is the correct
   pattern and pre-empts the margin problem.

---

## 6. Publishing methods — complete inventory

Publer's help article *"What are the scheduling methods that Publer supports?"* and the API's
`publishing-methods` doc tree enumerate six `[V]`, plus RSS and bulk as separate ingestion paths.

| Method | API representation | Plan gate |
|---|---|---|
| **Immediate publish** | `POST /posts/schedule/publish` | All paid |
| **Manual schedule** | `POST /posts/schedule`, `bulk.state: "scheduled"`, per-account `scheduled_at` | All |
| **Auto-schedule** | `auto: true` + `range: {start_date, end_date}` | All |
| **Drafts** | `bulk.state: "draft" \| "draft_private" \| "draft_public"` | All |
| **Recycling (evergreen)** | `recycling: {...}` object | **Business** `[V]` |
| **Recurring** | `bulk.state: "recurring"` + `recurring: {...}` | **Business** `[V]` |
| **Bulk / CSV** | Bulk Scheduling (`publer.com/features/bulk-scheduling`) | All |
| **RSS auto-post / auto-schedule** | Explore tab automation | All `[U]` on gate |

### 6.1 ★ The recycling (evergreen) engine — exact mechanics

This is Publer's signature feature and the brief asked for mechanics in detail. The following
field names are `[V2]` — they appear identically in `emanueldervishi/publer-mcp/src/publerClient.ts`
(`createRecyclingPost`) and are referenced in Publer's own API docs (`/docs/posting/create-posts/publishing-methods/recycling-posts`).

**Payload shape, verbatim from the client source `[V]`:**

```jsonc
POST /api/v1/posts/schedule
{
  "bulk": {
    "state": "scheduled",
    "posts": [{
      "networks": { "<provider>": { "type": "status", "text": "…" } },
      "accounts": [{ "id": "<account_id>", "labels": [""] }],
      "range":  { "start_date": "<ISO>", "end_date": "<ISO|null>" },
      "recycling": {
        "solo":         true,          // boolean, default true
        "gap":          <int>,         // numeric interval
        "gap_freq":     "Day" | "Week" | "Month",
        "start_date":   "<ISO>",
        "expire_count": <int>,         // optional, min 1
        "expire_date":  "<ISO>"        // optional
      }
    }]
  }
}
```

**Semantics `[V]`:**

| Field | Meaning |
|---|---|
| `gap` + `gap_freq` | The **interval between re-publications** — "every N Days/Weeks/Months". Capitalised string enum (`"Day"`, `"Week"`, `"Month"`) — note the non-idiomatic capitalisation, a genuine API quirk. |
| `solo` | Whether the recycled post occupies a slot exclusively. Defaults `true`. |
| `start_date` | When recycling begins. |
| `expire_count` | Stop after the post has recycled **N times**. |
| `expire_date` | Stop after a **calendar date**. |
| `range` | Independent outer window (`start_date`/`end_date`) — recycling is bounded twice: by the range and by the expiry rule. |

**Termination rule `[V]`, from Publer's docs:** *"Recycling stops when `expire_count` or
`expire_date` is reached"* — i.e. **whichever fires first**. Publer's help centre has a dedicated
article *"How to restart an expired recycling post"* `[V]`, and `recycling_expired` is a
first-class post state (§6.5) — meaning an expired recycler is a persistent, resurrectable object
rather than a deleted one. **Good design; copy it.**

**Slot allocation `[V]`:** recycling *"fills open slots based on `gap` and `gap_freq`"* — it
places into the account's **posting schedule (time-slot grid)**, not at arbitrary times. Publer
publishes a help article *"Why is my recycling post scheduled for a much later time slot?"*
`[V]` — which tells you the slot-contention behaviour is confusing enough in practice to warrant
documentation. If you build this, **show the user the resolved future occurrences at creation
time**; that single UI decision would eliminate the article.

**Management surface `[V]`:** *"How to find and manage all recycled posts"* — recyclers are
filterable as a class, and have pause/resume (`recycling_paused`) and approval semantics
(`recycling_pending`, `recycling_declined`).

**Content freshness `[V]`:** **spintax** — `{option A|option B}`-style variation syntax so the
same recycler emits different copy each cycle. This is the feature that makes evergreen recycling
tolerable rather than spammy, and it is cheap to implement.

### 6.2 Recurring posts — and the recycling/recurring distinction

Publer maintains a **help article explicitly titled "What's the difference between recycling and
recurring posts?"** `[V]` — which is the tell that the distinction is real and users trip over it.

**Recurring payload, verbatim from the client source `[V]`:**

```jsonc
{
  "bulk": {
    "state": "recurring",
    "posts": [{
      "networks": { "<provider>": { "type": "status", "text": "…" } },
      "accounts": [{ "id": "<account_id>" }],
      "recurring": {
        "start_date":   "<ISO>",           // required
        "repeat":       "daily"|"weekly"|"monthly",   // required
        "end_date":     "<ISO>",           // optional
        "days_of_week": [1..7],            // required when repeat=weekly; 1=Mon … 7=Sun
        "repeat_rate":  <int 1..52>,       // optional — "every N periods"
        "time":         "<HH:MM>"          // optional
      }
    }]
  }
}
```

The client **enforces** that `days_of_week` is non-empty when `repeat === "weekly"` `[V]`, and
constrains `repeat_rate` to **1–52** `[V]`.

**The conceptual split `[V]`:**

| | Recycling | Recurring |
|---|---|---|
| Mental model | "Re-share this evergreen post **indefinitely**, whenever a slot is free" | "Publish this **at exactly this time**, on a fixed repeat" |
| Timing | Slot-based (`gap` + `gap_freq` → fills open queue slots) | Wall-clock (`time` + `days_of_week`) |
| Typical use | Evergreen library rotation | "Every Monday 9 AM: the weekly promo" |
| Termination | `expire_count` **or** `expire_date` | `end_date` |
| State namespace | `recycling*` (6 sub-states) | `recurring` |

**This is a genuinely better mental model than the single "Evergreen" concept used by several
competitors** — they are different jobs and deserve different objects. Prior research in this
programme (`02-vista-social-deep-modules.md`) reached the same conclusion independently.

### 6.3 Auto-scheduling

**Payload `[V]`:**

```jsonc
{ "bulk": { "state": "scheduled", "posts": [{
    "networks": {...}, "accounts": [{ "id": "…" }],
    "share_next": false,                                   // boolean
    "range": { "start_date": "<ISO>", "end_date": "<ISO>" },// end_date optional
    "auto": true
}]}}
```

- `auto: true` + a `range` → Publer picks the times. Publer's docs: *"Publer analyses your posting
  schedule and audience engagement to fill gaps and maximize reach"* `[V]`.
- `share_next` `[V]` — a distinct flag meaning "take the next available slot" as opposed to
  distributing across the range. Two different auto behaviours behind one method.
- Best-time intelligence is exposed as a **first-class analytics endpoint**,
  `GET /analytics/{accountId}/best_times` `[V2]`, returning `slots`, `top_slots`, `slot_score`,
  `hour`, `window` fields `[V]`. **The scheduler and the analytics engine share the same
  best-time model** — a clean architecture worth replicating.

### 6.4 Drafts

`bulk.state` accepts `draft`, `draft_private`, `draft_public` `[S/V]`; the post-state enum
additionally distinguishes `draft_dated` and `draft_undated` `[V]`.

- **`draft_private` vs `draft_public`** — visibility within the workspace. The MCP client defaults
  the `visibility` parameter to `draft_public` `[V]`.
- **`draft_dated` vs `draft_undated`** — a draft may or may not carry a target date. **This is a
  small, excellent detail**: an undated draft is an idea; a dated draft is a commitment. Most
  competitors force a date and thereby pollute the calendar.
- Drafts support the same payload shapes and content types as scheduled posts `[V]`.

### 6.5 The post state machine — 26 states

From `postStateSchema` `[V]`. This is the most revealing single artefact in the teardown because
it exposes the approval workflow, the auth-failure path and the recycling lifecycle:

| Group | States |
|---|---|
| Meta | `all` |
| Scheduled | `scheduled`, `scheduled_approved`, `scheduled_pending`, `scheduled_declined`, `scheduled_reauth`, `scheduled_locked` |
| Published | `published`, `published_posted`, `published_deleted`, `published_hidden` |
| Draft | `draft`, `draft_dated`, `draft_undated`, `draft_private`, `draft_public` |
| Failure | `failed` |
| Recycling | `recycling`, `recycling_active`, `recycling_paused`, `recycling_expired`, `recycling_failed`, `recycling_pending`, `recycling_declined`, `recycling_reauth`, `recycling_locked` |
| Recurring | `recurring` |

**Three things to take from this `[V]`:**

1. **Approval is modelled as post state, not as a side-table** — `*_pending` / `*_approved` /
   `*_declined` exist for both scheduled *and* recycling posts. Approval applies to recyclers too,
   which most tools forget.
2. **`*_reauth` is a first-class state.** When a social token expires, affected posts move to a
   dedicated state rather than silently failing. This is the single most common real-world failure
   mode in this category and Publer models it explicitly. **Copy this.**
3. **`*_locked`** — presumably plan-limit or permission lock (e.g. exceeded account allowance).
   Semantics `[U]`.

### 6.6 Bulk scheduling / CSV

`[V]` — a marketed feature (`publer.com/features/bulk-scheduling`), an API publishing method
(`/docs/posting/create-posts/publishing-methods/bulk-scheduling`), and a help article *"How to
apply post details to all posts in bulk"*. The API's entire posting model is bulk-native: every
create call is `{ bulk: { state, posts: [...] } }` `[V2]` — single posts are just an array of one.

**`[U]`:** exact CSV column schema, per-upload row cap, whether media URLs are supported in CSV,
and whether CSV bulk is plan-gated. The specific help article could not be reached before the
search budget expired. **Flagged as an open verification item (§22).**

### 6.7 ★ RSS automation — mechanics

`[V]`, from `publer.com/features/rss-feed` and the `/help/en/category/rss-feeds-x26g6t/` article set:

**Location:** RSS lives in the **Explore tab** → *"Add RSS Feed"* → paste URL.

**Three per-feed automation modes `[V]`:**

| Mode | Behaviour |
|---|---|
| **Auto-post** | Every new RSS item is **published immediately** on pull |
| **Auto-schedule** | Every new RSS item is **queued into the account's posting schedule** |
| **No Action** | Items are **stored in the library** awaiting manual action |

**Mechanics `[V]`:**

- Publer **continuously polls** each source and applies the configured action. Poll interval `[U]`.
- **Only *new* articles are automated** — explicitly: *"new articles are all the articles that are
  published after connecting your RSS feed to Publer."* Back-catalogue is not auto-imported. This
  is a deliberate and correct anti-spam design.
- **Caption templating** — captions can be composed from the item **title** and/or **description**,
  and the post appearance is configurable `[V]`.
- **Multiple feeds** per workspace, managed in the Explore tab `[V]`.
- A dedicated help article exists on **"How much in advance can I schedule RSS Feed articles?"**
  `[V]` — so there is a **forward-scheduling horizon limit** on RSS. **Exact value `[U]`.**

**Assessment:** this is a complete, well-shaped RSS product — three modes, template control,
new-only semantics — but it is **content-ingestion RSS, not curation-with-approval**. There is no
evidence of an approval queue between "RSS pulled" and "auto-posted", which is the failure mode
that makes agencies distrust RSS automation. The "No Action → library" mode is the closest thing,
and it requires manual pickup.

---

## 7. Workspaces model

`[V]`, from `publer.com/features/workspaces` and the workspaces help category.

| Property | Value |
|---|---|
| Availability | **Unlimited workspaces on both paid plans (Professional and Business)** `[V]` |
| Isolation | *"Each workspace has its own accounts, posts, and settings"* `[V]` |
| Billing unit | **Workspaces are free; the billable unit is the connected social account** `[V]` |
| API scoping | Every API call carries a `Publer-Workspace-Id` header `[V2]` |
| API model | `GET /workspaces` returns `{id, name, owner{id,email,name,first_name,picture}, members[], plan, picture}` `[S]` |
| Per-workspace resources | `GET /workspaces/{id}/signatures`, `GET /workspaces/{id}/media_options` `[V]` |

**The strategic read:** Publer gets the *shape* right (unlimited free workspaces = agency-friendly
container) but attaches the price to the **social account**, so an agency with 20 clients × 5
networks pays for 100 accounts regardless of how the workspaces are arranged. **Unlimited
workspaces is a generous-sounding freebie that costs Publer nothing and changes no bill.** Do not
mistake it for agency-friendly pricing.

Note also: **`plan` is a property of the workspace** `[S]`, not solely of the account — which
implies plan entitlements may be resolved per workspace. Worth verifying if we model multi-brand
billing.

---

## 8. Roles, permissions and approval workflow

`[V]`, from *"What are the different member roles and permission levels?"*

| Role | Capabilities |
|---|---|
| **Owner** | **Exactly 1 per workspace. Ownership CANNOT be transferred.** `[V]` |
| **Admin** | View/add/modify/remove editors; add new social accounts to the workspace *when permitted by the Owner*; assign accounts they have access to, to other members; modify settings for assigned accounts |
| **Editor** | Either **"Full posting access"** or **"should be approved by Admin"** on assigned accounts; can edit/delete/publish **their own** posts |
| **Client** | Can **approve posts** at any of the above levels — *"and nothing else"* |

**Mechanics `[V]`:**

- Accounts are **assigned per member** (*"How to assign social accounts to different members of my
  workspace"*), so a member sees only their slice.
- The approval workflow is **derived from permissions**, not configured as a separate pipeline:
  an Editor set to "should be approved by Admin" produces `scheduled_pending` posts; approval
  moves them to `scheduled_approved`; rejection to `scheduled_declined` `[V]`.
- **A dedicated `Client` role that can only approve** is genuinely good agency design and directly
  addresses the per-seat-pricing pathology identified in `04-competitors-smb.md` §3.3.
- Approval states exist for **recycling** posts too (`recycling_pending`/`_declined`) `[V]`.
- Analytics has a **`/analytics/members`** endpoint and *"Get team member analytics"* operation
  `[V]` — per-member productivity reporting.

**The single worst design decision found in this teardown `[V]`: "Only 1 Owner is allowed per
Workspace and the Ownership cannot be transferred."** For an agency this is a live operational
hazard — staff turnover, agency acquisition, or a client taking their account in-house all become
support tickets or forced migrations. **This is a concrete, nameable weakness to beat.**

---

## 9. AI Assist

`[V]`, from `publer.com/features/ai-assist` and the AI Assist help category.

| Aspect | Finding |
|---|---|
| Product name | **AI Assist** (Publer also markets "AI Assist for Social Media and Blogs") |
| Text generation | Caption/content generation; **Brand Voices** referenced in Publer's launch post `[V]` |
| Image generation | *"How to generate images with AI Assist"* — **click Generate to create up to 10 variations** `[V]` |
| Comment replies | *"How to respond to comments with AI Assist"* — AI-suggested personalised replies `[V]` |
| Hashtags | Personalised hashtag suggestions — **Business-gated** `[V]` |
| Free plan | *"When you sign up for free on Publer, you'll receive credits to try out the AI Assistant"* — **exact credit count `[U]`** |
| Professional | AI Assist **not funded by Publer**; you must **connect your own OpenAI account/key** `[V]` |
| **Business** | **Unlimited AI prompts** `[V]` |
| Media provenance | `openai` is a first-class value in the media `source` enum `[S/V]` — AI-generated images land in the media library tagged by source |

### 9.1 Why the BYO-OpenAI-key design matters

**This is the most commercially interesting single decision in the product.** Publer's help centre
has an article *"How to connect my own OpenAI account for the AI Assist"* `[V]`, and the gating is:
*"AI Assist features are only supported on the Business Plan by default, though if you have an
OpenAI subscription, you can connect your own OpenAI key on the Free and Professional plan."*

Read that as a P&L statement:

- At $4–5/account/month, **Publer cannot absorb LLM inference COGS on the Professional tier.** So
  it doesn't. It offers the *feature* on Professional and makes the customer pay the model
  provider directly.
- On Business (~$7/account/month + $3/member) it absorbs the cost and markets **"unlimited"** —
  which is affordable precisely because the ARPU is ~75% higher and because caption generation is
  a low-token workload.
- The free plan gets a small credit grant purely as a conversion hook.

**Implication for us:** "unlimited AI" at $21/mo is credible only for short-form text. The moment
you offer AI *images* at that price you are absorbing a genuinely expensive workload — note that
Publer's own image feature caps at **10 variations per generate** `[V]`, which is a soft quota
wearing a UX costume. Expect to need the same.

---

## 10. Media: library, editor, integrations

### 10.1 Media library

`[S/V]` — from the OpenAPI `/media` endpoint and the n8n node.

| Filter | Values |
|---|---|
| `types[]` | `photo`, `video`, `gif` |
| `used[]` | boolean — filter by **whether the asset has already been used** |
| `source[]` | `canva`, `vista`, `postnitro`, `contentdrips`, `openai`, `favorites`, `upload` `[S]` — plus **`unsplash`** referenced in the n8n node (*"Source identifier such as unsplash"*) `[V]` |
| `search` | free-text over **name or caption** |
| `ids[]` | direct fetch; when set, pagination and filters are ignored |

**The `used` flag is a small, high-value feature** — "show me assets I haven't posted yet" is
exactly what a content manager wants and almost nobody ships.

**Upload paths `[V]`:** `POST /media` (multipart binary) and `POST /media/from-url` (ingest from a
public URL, with `name`, `caption`, `source`, `type: "single"|collection`, `direct_upload`,
`in_library` flags).

**`direct_upload` is architecturally notable `[V]`:** the n8n node describes it as *"Whether Publer
should attempt to upload directly to networks without storing a copy"* — i.e. Publer can **stream
media straight through to the network without retaining it**, avoiding storage COGS. That is a
real cost-engineering decision and another data point in the "how do they do it so cheaply"
question.

**Accepted file types `[V]`:** jpg/jpeg, png, gif, webp, mp4, mov, avi, webm, pdf.

**Asset limits:** `GET /workspaces/{id}/media_options` — *"Retrieve asset limits and media options
for a workspace"* `[V]`. **Actual limit values `[U]`.**

### 10.2 Built-in editor

`[V]`, from `publer.com/features/media-integrations` and the blog post *"All-in-One Editing:
Upgraded Photo Editor & New Video Editor in Publer"*:

- **Photo editor** — resize for any platform, **filters**, **stickers**, **text overlay**, crop.
- **Video editor** — a separate, later addition (the blog post announces it as "New").
- **Canva integration** — *"access Canva within Publer and export your designs directly to your
  Media Library"* `[V]`.
- **VistaCreate** (`vista`), **PostNitro** (`postnitro`), **ContentDrips** (`contentdrips`) — all
  first-class media sources `[S]`. PostNitro and ContentDrips are **carousel-generation** tools;
  their presence indicates Publer outsources carousel design rather than building it.
- **Unsplash** stock imagery `[V]`.

### 10.3 ★ Watermarks and signatures — the agency feature

The brief flagged this as "a small feature agencies actually pay for." It is, and Publer's gating
proves it.

**Watermarks `[V]`:**

| Property | Value |
|---|---|
| Setup path | Social Accounts → select account → **Watermarks** → **Create watermark** |
| Asset | Upload a **PNG** logo |
| Controls | **size**, **position**, **opacity**, optional **padding** around the logo |
| Default | A watermark can be marked **Default** → applied automatically |
| Quantity | **Up to 10 watermarks per account** |
| Scope | Configured **per social account**, not globally |
| **Photo watermarking** | **Professional plan and above** |
| **Video watermarking** | **Business plan only** |
| Exclusion | **Not supported for TikTok** — TikTok API limitation |

**Signatures `[V]`:**

- *"You can automatically add a signature as an **outro** at the end of each post"*, inserted via a
  **Signature icon** in the composer.
- First-class API resource: **`GET /workspaces/{id}/signatures`** — *"Fetch saved signatures for a
  workspace"* `[V]`. Signatures are **workspace-scoped**, whereas watermarks are **account-scoped**.
  That asymmetry is deliberate: a signature is agency/brand boilerplate; a watermark is per-channel
  branding.

**The commercial read:** Publer charges for watermarking in two steps — photos unlock the entry
paid tier, **video unlocks the top tier**. Video watermarking is the paywall. That is a very
precise piece of price discrimination: video is where the compute cost is (re-encoding), *and* it
is where agencies feel branding pressure most. **If we build one media-branding feature, build
automatic video watermarking, and price it like Publer does.**

---

## 11. Link in Bio

`[V]`, from `publer.com/features/link-in-bio` and *"What is Publer's Link in Bio feature?"*

| Property | Value |
|---|---|
| Price | **Free** — *"available for free"* `[V]` |
| Content | Personalised landing page, custom branding, one **main call-to-action** |
| Links | **Up to 15 external links** `[V]` |
| Instagram | Connect **Instagram posts** to the page for a shoppable/clickable grid |
| Partner | Publer also ships a **Linkie** integration — *"Meet the Publer x Linkie Integration: Automate Your Link In Bio"* `[V]` |
| Custom domain | `[U]` — not evidenced |
| Analytics on the page | `[U]` — not evidenced |

**Assessment:** table-stakes implementation, given away free as an acquisition surface. The 15-link
cap and the Linkie partnership together suggest Publer regards link-in-bio as a checkbox, not a
product line. **Low threat; do not over-invest to match it.**

---

## 12. Link shortening and UTM

`[V]`, from the `/help/en/category/link-shorteners-1czlbif/` article set.

**Eight supported shorteners** — an unusually long list, and all **BYO-account integrations**
(Publer connects *your* shortener account; it does not operate its own):

| # | Shortener |
|---|---|
| 1 | **Bitly** |
| 2 | **Rebrandly** |
| 3 | **Dub.co** |
| 4 | **Switchy** |
| 5 | **PixelMe** |
| 6 | **JotURL** |
| 7 | **RocketLink** |
| 8 | **RetargetKit** |

**Mechanics `[V]`:**

- **Automatic shortening** — once connected, *"all the links (including those in post
  descriptions) will be automatically shortened."*
- **Scope control** — choose to shorten **any link in your posts** or **only link posts**.
- **Custom domains** — supported where the shortener supports them (e.g. Dub.co paid → your
  domain; otherwise the free `dub.sh`).
- **UTM Builder** — *"Publer can automatically add UTM parameters at the end of each link so that
  users can analyze the traffic in Google Analytics."* Auto-tags source/campaign.
- Disconnect flow documented.

**The pattern to copy:** BYO-shortener rather than own-shortener. It costs Publer nothing (no
redirect infrastructure, no abuse liability, no link-rot support burden), and it *increases*
stickiness because several of these tools (PixelMe, RetargetKit, Switchy) are retargeting-pixel
products — the customer's ad stack now runs through Publer's composer. **Eight integrations is
cheap breadth of exactly the same species as the Class-A networks in §5.**

---

## 13. Analytics

`[V]` for the feature set; `[V]` for the API surface (extracted from `n8n-nodes-publer@1.0.4`).

### 13.1 API surface

| Endpoint | Purpose |
|---|---|
| `GET /analytics/charts` | List available chart types `[V]` |
| `GET /analytics/chart_data` | Chart data (workspace-level) `[V]` |
| `GET /analytics/{accountId}/chart_data` | Chart data for one account `[V]` |
| `GET /analytics/{accountId}/post_insights` | Post-level insights `[V]` |
| `GET /analytics/{accountId}/hashtag_insights` | Aggregated hashtag metrics `[V]` |
| `GET /analytics/{accountId}/hashtag_performing_posts` | Posts performing for a hashtag `[V]` |
| `GET /analytics/{accountId}/best_times` | Best times to post `[V]` |
| `GET /analytics/members` | Team member analytics `[V]` |
| `GET /competitors` | List tracked competitors `[V]` |
| `GET /competitors/{competitorId}/analytics` | Competitor analytics `[V]` |

### 13.2 Competitor analysis

`[V]`, from `publer.com/blog/publer-competitor-analysis/` and the help articles:

| Property | Value |
|---|---|
| **Supported networks** | **Facebook, Instagram, X/Twitter only** `[V]` |
| **Capacity** | **Up to 30 competitors per social account** `[V]` |
| Metrics | Post Count, Engagement, Reach, Videos Count, Photos Count, Links Count, Texts/Statuses Count, Followers, Followers Growth `[V]` |
| Extras | **Competitor's best times to post** `[V]` |
| Export | Dedicated Competitor Analysis view → **PDF or Excel/CSV** `[V]` |

### 13.3 Reporting and export

| Property | Value |
|---|---|
| Exportable views | Analytics Overview, Post Insights, Hashtag Analysis, Competitor Analysis `[V]` |
| Formats | **PDF** (presentation) and **CSV** (analysis) `[V]` |
| **Hard cap** | **PDF reports can contain a maximum of 100 posts — only the first 100 are displayed** `[V]` |
| Plan gating | *"Detailed analytics reports"* listed as a **Business** feature `[V]` |
| **White-label** | **Enterprise only** — *"White-labeled analytics reports"* `[V]` |
| Scheduled/automated report delivery | `[U]` — no evidence found |

**Assessment.** Publer's analytics is **competent-but-capped**. The 100-post PDF ceiling is a real
constraint for any account posting daily across several channels — a month of 5-channel daily
posting is 150 posts and will silently truncate. Competitor analysis covering only FB/IG/X in 2026
is a visible gap (no TikTok, no LinkedIn, no YouTube competitor tracking). **White-label reports
being Enterprise-only is the biggest packaging weakness against agencies** — Metricool and Pallyy
give branded reports at a fraction of that.

---

## 14. Engagement / inbox — "Kibo"

`[V]`, from `publer.com/blog/welcome-kibo/` and the comment-management help articles.

| Property | Value |
|---|---|
| Product name | **Kibo** — *"Your Unified Social Media Inbox"* `[V]` |
| Scope | *"Respond to messages, comments, mentions, and reviews within one single dashboard"* `[V]` |
| Comment management networks | **Facebook Pages, Facebook Groups, Instagram, X/Twitter, Mastodon, LinkedIn, Threads, Bluesky, YouTube** `[V]` — **9 of 13** |
| Actions | View, add, delete, **reply** (Reply → Save publishes to the network) `[V]` |
| Notification filters | By **type** (Inbox, Feedback, Mention, Comment) and by **status** (Unread, Unresolved, Resolved) `[V]` |
| AI | AI Assist suggests personalised comment replies `[V]` |
| Instagram DMs | Supported — Publer publishes *"How to Send, Receive, and Manage Instagram DMs on Desktop"* `[V]` |
| Trending-post handling | Dedicated article: *"How to manage comments on trending posts through Publer"* `[V]` |

**Notable inclusions:** **Mastodon and Bluesky comment management** — very rare, and again cheap,
because both protocols expose replies openly. **Facebook Groups** comment management is also rare.

**Notable gaps `[V]`:** the comment-network list excludes **TikTok, Pinterest, Telegram,
Google Business Profile (reviews), WordPress** — although the marketing copy says "reviews", which
would imply GBP. Contradiction unresolved; treat GBP review management as `[U]`.

**Open item:** Publer's public feedback board still carries an idea titled *"Inbox comments and
messages all social networks"* (`feedback.publer.com/84`) `[V]` — i.e. **users are still asking
for full inbox coverage**, which corroborates that Kibo's coverage is partial.

---

## 15. Calendar

`[V]`, from `publer.com/features/calendar-view`.

- Unified calendar across **Facebook, Instagram, TikTok, LinkedIn, X, Pinterest, YouTube, Google
  Business, Bluesky and Threads** `[V]`.
- Shared workspace calendar with **internal notes** on posts `[V]`.
- Posting-schedule / time-slot grid underlies auto-schedule and recycling slot allocation (§6.1, §6.3).
- Views (month/week/day/list), drag-and-drop rescheduling, grid preview: `[U]` — plausible but not
  evidenced.

---

## 16. Browser extension and mobile apps

| Surface | Status | Evidence |
|---|---|---|
| **Browser extension** | **Exists** — listed among Publer's headline features alongside Bulk Scheduling, In-Depth Analytics, Agency Features and Link in Bio `[V]` | Feature listing |
| Extension: browsers supported, install count, rating, capabilities | `[U]` | Chrome Web Store blocked |
| **Mobile apps** | **Exist** — Publer publishes *"The Publer Mobile App"* help article and a mobile-specific signup guide (*"Mobile App: How to sign up to Publer with my social networks"*) `[V]` | Help centre |
| Mobile: iOS/Android version, ratings, review counts, feature parity | `[U]` | App stores blocked |

**Both are confirmed to exist; neither could be characterised.** Flagged in §22.

---

## 17. Public API — full teardown

### 17.1 Access and authentication

| Property | Value | Tag |
|---|---|---|
| Base URL | `https://app.publer.com/api/v1` | `[V2]` |
| **Plan gate** | *"The Publer API is currently available exclusively to Publer Business users"* — later materials say **"Business and Enterprise"** | `[V2]` |
| Token issuance | Publer app → **Settings → API** → generate a personal access token (PAT) | `[V]` |
| Auth header | **`Authorization: Bearer-API <token>`** — note the **non-standard `Bearer-API` scheme**, not plain `Bearer` | `[V2]` |
| Workspace header | **`Publer-Workspace-Id: <workspace_id>`** — required on most endpoints | `[V2]` |
| Scopes | Endpoint-level scopes exist (e.g. an `accounts` scope) | `[V]` |
| Style | RESTful JSON | `[V]` |
| Docs | `publer.com/docs`; OpenAPI + Postman v2.1 + Open Collection v1.0 published | `[V]` |

The `Bearer-API` scheme is a genuine interoperability wart: generic OAuth/HTTP client libraries
that construct `Authorization: Bearer <token>` will fail against Publer without an override.

### 17.2 Complete endpoint surface

Extracted verbatim from the compiled `n8n-nodes-publer@1.0.4` package and cross-checked against
`emanueldervishi/publer-mcp` `[V2]`:

| Method | Path | Purpose |
|---|---|---|
| GET | `/users/me` | Authenticated user |
| GET | `/workspaces` | List workspaces |
| GET | `/workspaces/{workspaceId}/signatures` | Saved signatures |
| GET | `/workspaces/{workspaceId}/media_options` | Asset limits & media options |
| GET | `/accounts` | Connected social accounts in workspace |
| GET | `/media` | Media library (filters: `types[]`, `used[]`, `source[]`, `search`, `ids[]`, `page`) |
| POST | `/media` | Upload binary (multipart/form-data) |
| POST | `/media/from-url` | Ingest media from public URL |
| GET | `/posts` | List posts (`state`, `state[]`, `from`, `to`, `page`, `account_ids[]`, `query`, `postType`, `member_id`) |
| GET | `/posts/{postId}` | Single post |
| PATCH | `/posts/{postId}` | Update post (changes wrapped in a `post` object) |
| DELETE | `/posts/{postId}` | Delete post(s) |
| POST | `/posts/schedule` | Schedule / draft / recycle / recur — **async** |
| POST | `/posts/schedule/publish` | Publish immediately — **async** |
| POST/GET | `/posts/links` | Fetch link metadata / preview |
| GET | `/job_status/{jobId}` | Poll async job |
| GET | `/locations/{network}` | Location search (Facebook, Instagram, Threads) |
| GET | `/analytics/charts` | Available chart types |
| GET | `/analytics/chart_data` | Chart data |
| GET | `/analytics/members` | Team member analytics |
| GET | `/analytics/{accountId}/chart_data` | Per-account chart data |
| GET | `/analytics/{accountId}/post_insights` | Post insights |
| GET | `/analytics/{accountId}/hashtag_insights` | Hashtag metrics |
| GET | `/analytics/{accountId}/hashtag_performing_posts` | Top posts per hashtag |
| GET | `/analytics/{accountId}/best_times` | Best posting times |
| GET | `/competitors` | Tracked competitors |
| GET | `/competitors/{competitorId}/analytics` | Competitor analytics |

**Pagination:** `page` is **zero-based** `[V]` — an unusual choice that will trip integrators.

### 17.3 The asynchronous job model

**Every write is asynchronous `[V2]`.** `POST /posts/schedule` and `POST /posts/schedule/publish`
return **HTTP 202** with:

```jsonc
{ "success": true, "data": { "job_id": "<id>" } }
```

The client then polls `GET /job_status/{job_id}` until `status` reaches a terminal value. Reported
status vocabularies differ slightly between community clients — `working` / `completed` / `failed`
`[S]` versus `finished` `[V]` — so **the exact terminal token is `[U]`; handle both.** The job
payload carries created post IDs and per-post errors, and partial failure is real: the MCP client
has an explicit `hasFailures(job.data)` branch that reports *"job completed with failures"* `[V]`.

**Assessment.** The job model is the right architecture for multi-network fan-out (one request →
N network calls, each of which can fail independently), and Publer surfaces per-post failure
rather than collapsing to a single status. **But there is no documented idempotency key** `[U]` —
a retried `POST /posts/schedule` after a network timeout appears able to double-publish. Compare
Upload-Post's documented 24-hour idempotency (`05-competitors-dev-oss.md`). **This is a concrete
API-design gap to beat.**

### 17.4 Rate limits — a genuine contradiction

Two mutually inconsistent accounts, both sourced:

| Source | Claim |
|---|---|
| Publer's own `/docs/getting-started/rate-limits` | *"Limits are calculated on a **rolling 24-hour basis in UTC** timezone"*; responses carry `X-RateLimit-Remaining: 0` and a future `X-RateLimit-Reset` `[V]` |
| `n8n-nodes-publer` README + `kapetan-io/publer.go` plan + a third-party integration audit | **"100 requests per 2 minutes"**, 429 on breach, `X-RateLimit-Limit` / `-Remaining` / `-Reset` headers `[V2]` (three independent implementers agree) |

**Most likely reconciliation `[U]`:** two distinct limiters — a **short-window request throttle
(100 req / 2 min)** governing API call rate, and a **rolling 24-hour publishing quota** (the daily
post limits of §19) governing posts actually published. They measure different things. Implementers
consistently encountered the former; Publer documents the latter. **Do not cite either as "the"
rate limit without re-verification.**

### 17.5 What the API is *not*

**`[V]` — this matters if we are considering Publer as an infrastructure competitor:**

- It is an **account-automation API**: it automates *your own* Publer workspaces.
- There is **no white-label / multi-tenant JWT mechanism** (contrast Ayrshare's `generateJWT` and
  Upload-Post's `generate_jwt`). You cannot resell Publer as your own publishing backend.
- Pricing is the **Publer subscription price**, not per-call.
- **No webhooks were found** in any artefact `[U]` — everything is poll-based (`job_status`), which
  is a meaningful operational limitation for an automation platform.
- No official SDKs; the entire client ecosystem is community-built (Go, Python, TypeScript, n8n,
  and at least four independent MCP servers).

**The MCP signal `[V]`:** there are **four separate community MCP servers** for Publer
(`alexkess/publer-mcp-server`, `pweightman/publer-mcp-server`, `Soyouse/publer-mcp`,
`emanueldervishi/publer-mcp`), one of which deploys to Cloudflare Workers. Publer ships **no
official MCP server**. That is unmet demand sitting in plain sight, and it is cheap to satisfy.

---

## 18. Pricing

### 18.1 Provenance warning

Publer's `/plans` page is an **interactive configurator** (choose social accounts + team members +
billing cycle). It could not be fetched. The figures below are reconstructed from (a) Publer's own
help-centre text read via search `[V]`, and (b) API Evangelist's structured
`publer-plans-pricing.yml` snapshot dated **2026-06-25** `[S]`. **Where the two disagree, both are
shown.** Every number is `[S]` at best.

### 18.2 The plans

| Plan | Base price | Included | Trial | API |
|---|---|---|---|---|
| **Free** | **$0** | **3 social accounts — X/Twitter EXCLUDED** `[V]`; post scheduling; content calendar; some AI credits; Link in Bio | — | ❌ |
| **Professional** | **"starts at $5/month for 1 social account and 0 additional members"** `[V]` · **"~$12/mo for 3 accounts"** `[S]` | Unlimited scheduling, eternal post history, unlimited workspaces, AI Assist (**BYO OpenAI key**), Canva, **photo watermarks** | **7 days** `[V]` | ❌ |
| **Business** | **~$10/month base** `[S]` · **"~$21/mo for 3 accounts"** `[S]` | Everything in Professional **+ recycling + recurring + video watermarks + unlimited AI prompts + detailed analytics reports + hashtag suggestions + API** | **14 days** `[V]` | ✅ |
| **Enterprise** | Custom `[V]` | Extended free trial; volume discounts; dedicated 1:1 onboarding; prioritised support; **unlimited daily posting**; **white-labeled analytics reports**; early access + expedited feature requests | Extended `[V]` | ✅ |

### 18.3 The add-on mechanics

| Item | Price | Tag |
|---|---|---|
| Additional social account — Professional | **~$4 / account / month** | `[S]` |
| Additional social account — Business | **~$7 / account / month** | `[S]` |
| Additional team member — Business | **~$3 / member / month** | `[S]` |
| Additional team member — Professional | ~$2 / member / month | `[U]` |
| **Volume break** | **"For every 9 social accounts, the 10th is free. For every 9 additional members, the 10th is free."** | `[V]` |
| Annual discount | **"Save up to 20% when paying yearly"** `[V]` — a competing source says **"2 months free"** (≈16.7%) `[U]`. **Contradiction; verify.** |
| Workspaces | **Free and unlimited on paid plans** | `[V]` |

**Reconciling the base prices.** Professional "starts at $5" (1 account, 0 members) against
"~$12 for 3 accounts" implies roughly **$5 first account + ~$4 each thereafter ≈ $13** — close
enough that the $12 figure is probably the **annual-billing** rate. Business "$10 base" against
"~$21 for 3" implies **$10 + ~$7 + ~$7 ≈ $24**, again reconciled by the annual discount. **The
model is: first account carries a premium, subsequent accounts are cheaper, tenth is free.** `[S]`

### 18.4 What the cheapest credible plan actually buys

The brief asked this directly. **Answer: Professional at 3 accounts, ≈ $12–13/month.** For that you get:

✅ All 13 networks · unlimited scheduled posts · eternal post history · unlimited workspaces ·
content calendar · bulk scheduling · RSS automation · drafts · auto-schedule · link shortening +
UTM · signatures · **photo** watermarks · Link in Bio · media library + editor + Canva · browser
extension · mobile apps · basic analytics · Kibo inbox (coverage per §14)

❌ **NOT included: recycling. NOT included: recurring posts. NOT included: video watermarks. NOT
included: detailed/exportable analytics reports. NOT included: hashtag suggestions. NOT included:
Publer-funded AI (BYO OpenAI key instead). NOT included: the API.**

### 18.5 ★ The packaging finding that matters most

**Publer's brand is "cheap tool with evergreen recycling." The evergreen recycling is not in the
cheap tier.** `[V]` — Publer's own *"What is included in Publer Business?"* article lists, as
Business features: *"Automatically recycle your evergreen content on Publer and schedule recurring
posts that recur at specific times that you choose."*

Practical consequence: a user who chooses Publer **because** of recycling pays roughly **$21+/mo
for 3 accounts**, not $12 — a **~75% uplift** over the headline. And at that price the comparison
set changes completely (Metricool, Pallyy, SocialBee, Buffer Team all become live alternatives).

**This is the single most exploitable weakness in Publer's packaging.** Putting evergreen recycling
in the *entry* paid tier would be a sharp, legible, directly comparable wedge.

### 18.6 Legacy plans and the AppSumo history

- **Legacy plans exist and are grandfathered `[V]`** — Publer maintains a help article *"What are
  the old Legacy plans?"*. Grandfathered cohorts are a permanent support and migration liability.
- **Publer ran an AppSumo lifetime deal `[V]`** — the listing `appsumo.com/products/publer/` is
  attested by an independent third-party article, and AppSumo's own customer-story content cites
  Publer as a tool a customer adopted through AppSumo.
- **`[U]` — everything else about the LTD**: tier prices (typical AppSumo tiers are $49/$99/$199),
  the number of tiers, stacking rules, the campaign dates, the account/workspace entitlements, and
  how LTD holders map onto today's Professional/Business feature gates. `appsumo.com` was blocked.
- **`[U]`** whether the "Legacy plans" article refers to the AppSumo cohort, to pre-repricing
  subscription cohorts, or both. **This is the most important single unverified item in the file**
  (§22), because the LTD cohort shapes Publer's support economics, its review corpus, and its
  ability to reprice.

Prior programme research (`12-analytics-listening-gtm.md` §32) independently records that *"Publer,
SocialBee and Vista Social all ran AppSumo campaigns"* and characterises the cost: 5,000–20,000
customers in 4–8 weeks, ~70/30 revenue share in AppSumo's favour, ~10–15% refunds, and **a review
corpus written by people who paid $59 once** — which is directly relevant to how one should read
Publer's public ratings.

---

## 19. Limits — consolidated

| Limit | Value | Tag |
|---|---|---|
| Free plan social accounts | **3, excluding X/Twitter** | `[V]` |
| Scheduled posts (paid) | **Unlimited** | `[V]` |
| **Daily post limits** | **Enforced on all plans except Enterprise**; "10 posts per social account" cited for some plans; **rolling 24 h, UTC** | `[V]` value, `[U]` per-plan numbers |
| Daily-limit waivers | Available for *"established news media companies, verified government agencies, or publicly owned services"* | `[V]` |
| API rate limit | **100 requests / 2 minutes** (implementers) vs **rolling 24 h UTC** (Publer docs) | see §17.4 |
| Watermarks per account | **10** | `[V]` |
| Watermark on TikTok | **Not supported** (TikTok API) | `[V]` |
| Competitors tracked | **30 per social account** | `[V]` |
| Competitor networks | **Facebook, Instagram, X only** | `[V]` |
| PDF report size | **100 posts maximum** | `[V]` |
| AI image variations | **10 per generate** | `[V]` |
| Link-in-bio external links | **15** | `[V]` |
| Workspaces | **Unlimited (paid)** | `[V]` |
| Workspace Owners | **Exactly 1, non-transferable** | `[V]` |
| Volume break | **Every 10th account and 10th member free** | `[V]` |
| RSS scheduling horizon | Exists, value unknown | `[U]` |
| Media asset limits | Exposed via `/workspaces/{id}/media_options` | `[U]` values |
| Post history retention | **"Eternal post history"** on Professional+ | `[V]` |

---

## 20. Real user criticism

### 20.1 Honesty statement

**G2, Capterra, Trustpilot, Reddit, Product Hunt, AlternativeTo, the App Store, Google Play and
every review-aggregator blog were blocked by the egress proxy** (§0.1), and the WebSearch budget
was exhausted before review-mining could be attempted. **I therefore cannot present verbatim
user quotes, star ratings or review counts, and I will not invent them.**

What follows is split into (A) friction that is **evidenced from Publer's own artefacts** — the
strongest thing obtainable here, and in some ways more reliable than review-farm sentiment — and
(B) explicitly-labelled unverified recall.

### 20.2 (A) Friction evidenced from Publer's own materials `[V]`

These are not opinions. Each is a documented product constraint or a help article Publer felt
compelled to write, and a vendor only writes an article when the support volume justifies it.

| # | Evidence | Why it is a real complaint |
|---|---|---|
| 1 | **Help article: *"Why are my charges higher than those listed on the Plans and Pricing page?"*** | **The clearest signal in the entire teardown.** A vendor writes this article only when billing surprise is a recurring, high-volume ticket. It is the direct consequence of à-la-carte per-account + per-member pricing on top of a configurator: the advertised "$5" is nothing like the invoice. |
| 2 | **Help article: *"Why is my recycling post scheduled for a much later time slot?"*** | Recycling's slot-contention behaviour is opaque to users. The engine's scheduling decisions are not legible at creation time. |
| 3 | **Help article: *"How to restart an expired recycling post"*** | Recyclers silently stop when `expire_count`/`expire_date` fires, and users discover it after the fact. Expiry is not surfaced proactively. |
| 4 | **`scheduled_reauth` / `recycling_reauth` post states** | Token expiry breaks scheduled and recycling posts often enough to need dedicated states — the classic complaint of this category ("my posts stopped going out and nobody told me"). |
| 5 | **Recycling + recurring are Business-gated** | The headline feature is not in the headline-priced plan (§18.5). |
| 6 | **Video watermarking is Business-only; photo watermarking Professional-only** | Two paywalls on one small feature. |
| 7 | **Watermarks unsupported on TikTok** | A hard functional hole on a top-3 network. |
| 8 | **Competitor analysis covers only Facebook, Instagram, X** | No TikTok/LinkedIn/YouTube competitor tracking in 2026. |
| 9 | **PDF reports truncate at 100 posts** | Silent data loss in client reporting. |
| 10 | **AI Assist requires your own OpenAI key below Business** | Users on a paid plan discover the AI feature is not actually funded. |
| 11 | **Daily post limits on all plans except Enterprise** | "Unlimited scheduling" is not unlimited publishing. |
| 12 | **Workspace ownership cannot be transferred** | A structural blocker for agencies with staff turnover or account handover. |
| 13 | **Open feedback-board request: *"Inbox comments and messages all social networks"* (`feedback.publer.com/84`)** | Users are still publicly asking for full inbox coverage — Kibo covers 9 of 13 networks. |
| 14 | **Open feedback-board request: *"Auto-Send DMs in Insta if someone comments a specific word"* (`feedback.publer.com/2172`)** | Comment-to-DM automation is absent; a standard expectation in 2026. |
| 15 | **API is Business-gated, poll-only, no webhooks, no idempotency key, non-standard `Bearer-API` scheme, zero-based pagination** | Developer-facing friction, corroborated by four independent community MCP servers existing because the official surface is awkward. |
| 16 | **"Legacy plans" article exists** | Grandfathered cohorts — historically a source of "my plan changed / I lost a feature" grievance. |

### 20.3 (B) Commonly-repeated criticisms — UNVERIFIED

**`[U]` — recall only, from prior programme notes (`04-competitors-smb.md`, itself explicitly
unverified). Do not cite these. Listed so they can be tested.**

1. Dense, cluttered UI — the cost of feature breadth.
2. Support responsiveness at the low price point.
3. Analytics shallow relative to Metricool / Iconosquare.
4. Credit-based AI feels nickel-and-dimed.
5. Instagram/TikTok auto-publish reliability, particularly Stories and Reels.

### 20.4 A caution on reading Publer's public ratings

`[V]` that Publer ran an AppSumo campaign; `[C1]` from prior programme research that LTD cohorts
produce **a review corpus written by people who paid once and never renew**. Publer's aggregate
star ratings are therefore likely **upward-biased on value-for-money** and **downward-biased on
support**, relative to a normal subscription cohort. Weight accordingly if the real ratings are
later obtained.

---

## 21. Competitive read — what to copy, what to beat

### 21.1 Copy outright (cheap, proven, high-value)

| # | Feature | Why |
|---|---|---|
| 1 | **The four Class-A networks — Mastodon, Bluesky, Telegram, WordPress** | Days of work each, no App Review, and they *are* the "widest coverage" claim (§5.3). |
| 2 | **The recycling/recurring conceptual split** | Two different jobs, two different objects. Better than a single "Evergreen" concept. `gap`/`gap_freq` + dual termination (`expire_count` **or** `expire_date`) is the right primitive set. |
| 3 | **Spintax** | Makes evergreen recycling non-spammy. Trivial to implement. |
| 4 | **`*_reauth` as a first-class post state** | Token expiry is *the* category-defining failure. Model it explicitly, and notify. |
| 5 | **`draft_dated` vs `draft_undated`** | An idea is not a commitment; don't force a date. |
| 6 | **The `Client` role that can only approve** | Removes the per-seat tax on client collaboration. |
| 7 | **Account-scoped watermarks (10 max, PNG, size/position/opacity/padding, default flag) + workspace-scoped signatures** | Correct scoping asymmetry; agencies pay for this. |
| 8 | **`used` flag on media assets** | "Show me what I haven't posted yet." Almost nobody ships it. |
| 9 | **BYO-shortener integration model (8 providers)** | Zero infrastructure, zero abuse liability, increases stickiness. |
| 10 | **`direct_upload` pass-through media** | Avoids storage COGS on large video. |
| 11 | **Best-times endpoint shared between analytics and the auto-scheduler** | One model, two surfaces. |
| 12 | **RSS "new articles only" semantics** | Correct anti-spam default. |
| 13 | **Per-tenant daily post limits + documented waiver process** | Mandatory if running a shared-app model. |

### 21.2 Beat (Publer's exploitable weaknesses)

| # | Weakness | The counter-move |
|---|---|---|
| 1 | **Recycling/recurring gated to Business (~75% price uplift)** | Ship evergreen recycling in the **entry paid tier**. Legible, directly comparable, and it attacks the exact reason people choose Publer. |
| 2 | **Per-social-account pricing taxes network breadth** | Price **per brand/workspace**. Then our breadth is a gift to the customer, not an upsell — and it inverts Publer's own differentiator against it (§5.5.3). |
| 3 | **Owner is singular and non-transferable** | Multiple owners + one-click ownership transfer. Name it in comparison pages. |
| 4 | **White-label reports are Enterprise-only** | Branded reports at the entry agency tier. |
| 5 | **Competitor analysis = FB/IG/X only** | Add TikTok, LinkedIn, YouTube competitor tracking. |
| 6 | **PDF reports truncate at 100 posts** | No cap, or explicit pagination. Trivially winnable. |
| 7 | **AI is BYO-key below Business** | Fund a real (if bounded) AI allowance on the entry paid tier — but model the COGS first (§9.1); this is where Publer's economics say "don't". |
| 8 | **Kibo covers 9 of 13 networks; no comment-to-DM automation** | Full-coverage inbox + comment-trigger automation are both live, publicly-requested gaps. |
| 9 | **API: Business-gated, poll-only, no webhooks, no idempotency, `Bearer-API`** | Webhooks, idempotency keys, standard `Bearer`, official SDKs. |
| 10 | **No official MCP server despite four community ones** | Ship a first-party MCP server. Cheap, and it captures the agent-native buyer Publer is visibly leaving on the table. |
| 11 | **No white-label / multi-tenant API** | If we want the infrastructure motion, Publer is not a competitor there at all — Ayrshare and Upload-Post are. |
| 12 | **No Reddit / Snapchat / Discord** | Reddit and Discord are addressable (Discord via webhooks is near-free) if the ICP justifies it. |

### 21.3 Where Publer genuinely beats most of the field

Do not underestimate these:

- **Coverage per dollar.** 13 networks at ~$4/account is the best ratio in the horizontal tier.
- **A real, documented, versioned public API** at an SMB price — rare.
- **The recycling engine's semantics** are more precisely specified than most competitors'.
- **Free tier that includes 12 of 13 networks** (all but X) — an unusually strong acquisition funnel.
- **Free unlimited workspaces** — costs Publer nothing, reads as generous.
- **Localised GTM** — under-exploited by English-first incumbents.

---

## 22. Open questions — verification backlog

Re-run these the moment `publer.com` is reachable. Ordered by decision-impact.

| # | Question | Where to look |
|---|---|---|
| 1 | **Exact current prices** at 1/3/5/10/25 accounts, monthly vs annual, both tiers | `publer.com/plans` (configurator — capture all slider positions) |
| 2 | **Annual discount: 20% or "2 months free"?** | `/plans` + `/help/.../what-are-publers-plans-and-pricing-15h4yqh/` |
| 3 | **Exact daily post limits per plan** | `/help/en/article/what-are-the-daily-post-limits-nbtnmu/` |
| 4 | **AppSumo LTD**: tiers, prices, dates, stacking, entitlements, mapping to current gates | `appsumo.com/products/publer/`; `/help/en/article/what-are-the-old-legacy-plans-1wbr8y2/` |
| 5 | **Bulk CSV**: column schema, row cap, media-URL support, plan gate | `/features/bulk-scheduling`; `/docs/posting/create-posts/publishing-methods/bulk-scheduling` |
| 6 | **Rate-limit contradiction** (100/2min vs rolling 24h) | `/docs/getting-started/rate-limits` |
| 7 | **Free-plan AI credit count** | `/help/en/article/what-is-included-in-publer-free-dliovh/` |
| 8 | **RSS forward-scheduling horizon** | `/help/en/article/how-much-in-advance-can-i-schedule-rss-feed-articles-18w0t0d/` |
| 9 | **Real user reviews** — G2/Capterra/Trustpilot ratings + counts; verbatim negatives | Review sites (all blocked this session) |
| 10 | **Browser extension**: browsers, install count, rating, capabilities | Chrome Web Store / Edge Add-ons |
| 11 | **Mobile apps**: iOS/Android ratings, review counts, feature parity | App Store / Google Play |
| 12 | **Whether the API has webhooks / idempotency** (assumed absent) | `publer.com/docs` full walk |
| 13 | **`*_locked` post state semantics** | `/docs/api-reference/posts` |
| 14 | **Media/asset limits** returned by `/workspaces/{id}/media_options` | Live API call |
| 15 | **Google Business Profile review management** in Kibo (marketing says "reviews"; comment-network list omits GBP) | `/blog/welcome-kibo/` + Kibo help |
| 16 | **Whether RSS automation is plan-gated** | RSS help category |
| 17 | **Per-network post-type support matrix** | `/help/en/article/what-post-types-are-supported-and-what-are-their-limitations-1687rte/` |
| 18 | **Company facts**: HQ, headcount, funding, ARR, registered users | Crunchbase / LinkedIn |

---

## 23. Sources

**Publer first-party (read via allowed-domain WebSearch; direct fetch blocked):**

- `https://publer.com/plans`
- `https://publer.com/integrations`
- `https://publer.com/features/` — `recycling`, `rss-feed`, `bulk-scheduling`, `calendar-view`, `link-in-bio`, `analytics`, `ai-assist`, `workspaces`, `media-integrations`, `curate-posts`
- `https://publer.com/docs` — `/getting-started/{authentication,quickstart,rate-limits}`, `/api-reference/{introduction,users,workspaces,accounts,posts}`, `/posting/create-posts`, `/posting/create-posts/publishing-methods/{manual-scheduling,auto-scheduling,bulk-scheduling,draft-posts,recycling-posts,immediate-publishing}`, `/posting/create-posts/content-types/post-with-watermark`, `/posting/create-posts/media-options`, `/analytics/competitor-analysis`
- `https://publer.com/help/en/` — articles: `what-social-networks-are-supported-npoun1`, `how-does-publer-communicate-with-the-social-networks-1b0j0p0`, `what-are-publers-plans-and-pricing-15h4yqh`, `what-is-included-in-publer-{free-dliovh,professional-1srlp9n,business-1c57hsq,enterprise-13ap85n}`, `professional-vs-business-vs-enterprise-plans-1sge3f7`, `why-are-my-charges-higher-than-those-listed-on-the-plans-and-pricing-page-1c8s7nx`, `what-are-the-old-legacy-plans-1wbr8y2`, `what-are-the-daily-post-limits-nbtnmu`, `how-to-recycle-posts-21oc1h`, `whats-the-difference-between-recycling-and-recurring-posts-y542y7`, `how-to-restart-an-expired-recycling-post-1x3yaey`, `why-is-my-recycling-post-scheduled-for-a-much-later-time-slot-8foyvj`, `how-to-find-and-manage-all-recycled-posts-f7z9kh`, `rss-feeds-in-publer-tmy7cj`, `how-to-add-a-new-rss-feed-6oova7`, `how-to-auto-schedule-or-auto-post-the-new-rss-feed-articles-1sr2pvy`, `how-much-in-advance-can-i-schedule-rss-feed-articles-18w0t0d`, `how-to-change-the-rss-feed-settings-1ad9wdi`, `what-are-publers-workspaces-1j5jzil`, `what-are-the-different-member-roles-and-permission-levels-ior42l`, `how-to-add-a-client-to-my-publer-workspace-y76c4k`, `how-to-assign-social-accounts-14o8w8h`, `how-to-create-watermarks-1imv1yx`, `how-to-automatically-watermark-{photos-10e0pd2,videos-fni50a}`, `what-is-publers-link-in-bio-feature-a9zj4e`, `how-to-automatically-shorten-links-t9p8gg`, `how-to-set-up-{bitly-b7xw07,rebrandly-1vx9o3b,dub-16uuhzd,switchy-vkv24z}-url-shortener`, `what-are-publer-analytics-1a9vkgm`, `how-to-download-your-analytics-reports-1yrmimi`, `how-to-export-a-dedicated-view-of-the-competitor-analysis-to-pdf-or-excelcsv-siye8t`, `how-to-add-a-competitor-page-ejzfz5`, `how-to-view-competitors-best-times-to-post-pavg5y`, `how-to-analyze-a-competitors-online-presence-1cppb7u`, `how-to-manage-comments-of-published-posts-from-within-publer-ukrslk`, `how-to-respond-to-comments-with-ai-assist-auf23w`, `how-to-add-follow-up-comments-to-my-posts-qym287`, `how-to-connect-my-own-openai-account-for-the-ai-assist-1dmawuf`, `how-to-generate-images-with-ai-assist-50ah6`, `what-is-the-publer-ai-assist-1n883h3`, `the-publer-mobile-app-17a4cm3`, `what-post-types-are-supported-and-what-are-their-limitations-1687rte`, `how-to-auto-delete-posts-1t21ddd`, `how-to-apply-post-details-to-all-posts-in-bulk-11tol5y`, `does-publer-have-a-public-api-194nknf`, `how-to-access-the-publer-api-1w08edo`
- `https://publer.com/blog/` — `welcome-kibo`, `publer-competitor-analysis`, `watermarks`, `all-in-one-editing-upgraded-photo-editor-new-video-editor-in-publer`, `post-directly-to-threads`, `publer-anti-spam-measures`, `automatically-post-and-schedule-from-rss-feeds`, `tracking-and-automatically-shortening-links`, `automate-social-media-link-shortening-with-dub`, `instagram-link-in-bio`, `publer-ai-with-brand-voices-and-analytics`, `bulk-scheduling`, `instagram-dm`, `it/tracciamento-e-accorciamento-automatico-dei-link`
- `https://feedback.publer.com/84`, `https://feedback.publer.com/2172`

**Machine-readable primary artefacts (fetched in full):**

- `https://raw.githubusercontent.com/api-evangelist/publer/main/openapi/_original/publer-openapi.yml` — OpenAPI 3.0.1, 581 lines
- `https://raw.githubusercontent.com/api-evangelist/publer/main/plans/publer-plans-pricing.yml` — dated 2026-06-25, maintainer Kin Lane
- `https://raw.githubusercontent.com/emanueldervishi/publer-mcp/main/src/publerClient.ts` (52,595 bytes) and `.../src/schemas.ts` (14,904 bytes)
- `https://registry.npmjs.org/n8n-nodes-publer` → `n8n-nodes-publer-1.0.4.tgz` (published 2025-11-14), compiled `dist/` inspected
- `https://raw.githubusercontent.com/alexkess/publer-mcp-server/main/README.md`
- `https://raw.githubusercontent.com/kapetan-io/publer.go/main/README.md` and `.../plans/publer-go-client-implementation-plan.md`
- `https://raw.githubusercontent.com/OwenMcGirr/publer-client/main/AI.md`
- `https://raw.githubusercontent.com/TimmyZinin/smm-research-hub/main/smm_audits/md/s33_publer_integration.md`
- `https://raw.githubusercontent.com/Aristotlev/ZEUS-FRAMEWORK/main/skills/.../publer-api-reference.md`

**Cross-references within this research programme:**

- `research/02-vista-social-deep-modules.md` — independent corroboration of Publer's `gap`/`gap_freq` API semantics
- `research/04-competitors-smb.md` §4.3 — prior (explicitly unverified) Publer scaffold; **this file supersedes it**
- `research/05-competitors-dev-oss.md` §5.5 — prior Publer API notes, now largely verified here
- `research/12-analytics-listening-gtm.md` §29, §32 — per-profile pricing comparison and AppSumo LTD economics

---

*End of teardown. Sections marked `[U]` are the verification backlog in §22 and must be closed
before any figure from this file is used in pricing or positioning decisions.*
