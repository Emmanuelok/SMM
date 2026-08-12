# Vista Social — Exhaustive Feature & Commercial Audit

**Prepared:** 12 August 2026
**Subject:** Vista Social (vistasocial.com) — Vista Social LLC
**Purpose:** Primary competitive benchmark. This document is the reference specification for achieving 100% feature parity and then exceeding it.
**Status:** Living reference document.

---

## 0. READ THIS FIRST — Methodology, Source Quality & Verification Warnings

### 0.1 Hard constraint encountered during this audit

**The research environment's egress proxy blocked direct access to every first-party Vista Social domain and every major review aggregator.** Specifically blocked (HTTP-level block by policy, not a 404):

| Domain | Status |
|---|---|
| `vistasocial.com` | **BLOCKED** by egress proxy |
| `support.vistasocial.com` (Zendesk help centre) | **BLOCKED** |
| `signals.vistasocial.com` | **BLOCKED** |
| `apidocs.vistasocial.com` | Not fetchable (parent domain blocked) |
| `suggestions.vistasocial.com` (changelog + roadmap board) | Not fetchable |
| `www.g2.com` | **BLOCKED** |
| `www.capterra.com` | **BLOCKED** |
| `web.archive.org` | **BLOCKED** |
| `reddit.com` | **BLOCKED** |
| Assorted third-party blogs (socialrails, softwaresuggest, etc.) | **BLOCKED** |

**Consequence:** every fact below was obtained through search-engine retrieval and summarisation of the target pages rather than by rendering the pages directly. Search retrieval surfaced substantial verbatim content from Vista Social's own help-centre articles and marketing pages, so first-party claims are well represented — but **exact pricing tables, exact per-plan feature checklists, and the complete MCP/API endpoint inventories could not be read cell-by-cell.**

**Anything I could not corroborate across at least two independent retrievals is explicitly marked `UNVERIFIED`.** Where sources conflict, I show both numbers and flag the conflict rather than picking one.

**Recommended remediation before this document is used for pricing or contractual decisions:** have a human open `vistasocial.com/pricing`, `support.vistasocial.com`, `apidocs.vistasocial.com` and `suggestions.vistasocial.com/changelog` and reconcile §4 (Pricing) and §23 (API/MCP) against the live pages. Everything else in this document is feature-level and stable.

### 0.2 Source reliability tiers used below

| Tier | Meaning |
|---|---|
| **A — First-party help centre** | Content retrieved from `support.vistasocial.com` articles. Highest reliability for feature mechanics, limits, and "how it works". |
| **B — First-party marketing** | `vistasocial.com` product/insights pages. Reliable for feature existence; unreliable for limits. |
| **C — Third-party review/pricing blogs** | Frequently stale, frequently copy-paste from each other, frequently wrong on price. Treated as corroboration only. |
| **D — User reviews** | G2/Capterra/Trustpilot/AppSumo. Reliable for *sentiment and pain points*, unreliable for feature facts. |

---

## 1. Executive Summary

Vista Social is a New York-based, founder-led (Vitaly Veksler, founded 2020) all-in-one social media management platform that reached **30,000+ customers** and hit $1M ARR within roughly 24 months of launch. It competes directly with Hootsuite, Sprout Social, Sendible, Later and Buffer, and its wedge is **breadth-per-dollar**: it ships modules that legacy vendors either gate behind enterprise tiers (listening, review management, employee advocacy, white-label) or don't ship at all (link-in-bio, DM automation, app-store review management, MCP server).

**The nine modules that constitute the product:**

1. **Publishing & Scheduling** (composer, queues, evergreen recycling, bulk CSV, boosting, smart publishing)
2. **Calendar & Planners** (multi-view calendar, shared calendar links, Instagram/TikTok grid planners)
3. **Media Library** (folders, labels, cloud sync, stock, Canva)
4. **Engagement / Social Inbox** (comments, DMs, mentions, reviews, saved replies, sentiment, macros, tasks)
5. **DM & Inbox Automations** (trigger/action rule engine with AI dynamic replies)
6. **Reviews & Reputation** (8 review sources; direct reply on 4)
7. **Social Listening** (internal + external listeners; priced per-listener add-on)
8. **Analytics & Reporting** (10+ report types, custom templates, scheduled delivery, white-label PDFs, GA integration)
9. **Employee Advocacy** (curated content, leaderboards, EMV, Slack alerts)

**Plus platform-level surfaces:** Vista Page (link-in-bio/microsite builder), AI ("Ask Vista" + inline AI Assistant, image + video generation), white-label (custom domain, logo, colours, branded email), public REST API with OAuth 2.0 + PKCE, an **MCP server with ~60 tools**, Zapier + Make integrations, Slack integration, iOS + Android apps, and Chrome + Firefox extensions.

**Strategic read for a challenger:** Vista Social's *breadth* is its moat and its liability. It is broad but consistently shallow at the edges: competitor analysis covers only 2 networks; listening is a metered add-on with hard result caps; approval workflows are linear with no conditional routing; there is **no genuine review-generation/request engine**; reporting customisation is repeatedly criticised as shallow; and its X/Twitter support has been carved out into a $29/profile/month add-on. Its **discoverability is poor** — reviewers repeatedly say powerful modules exist but are unfindable. And its **AppSumo lifetime-deal cohort has been retroactively re-limited**, generating an unusually toxic pocket of public sentiment. Each of these is an exploitable gap (see §29).

---

## 2. Company & Market Position

| Attribute | Value | Tier |
|---|---|---|
| Legal entity | Vista Social LLC | C |
| Founded | 2020 (some sources say 2021 — **UNVERIFIED** which is correct; 2020 is better corroborated) | C |
| Founder / CEO | Vitaly Veksler | B/C |
| HQ | New York City, USA | C |
| Customers | 30,000+ brands, agencies, freelancers, multi-location businesses | B |
| ARR milestone | $0 → $1M ARR in ~24 months post-launch | C (founder podcast) |
| G2 rating | ~4.8/5 across 1,000+ reviews | C |
| Trustpilot volume | ~79 reviews (small sample; skewed negative on billing) | D |
| Funding | **UNVERIFIED** — no funding figures surfaced; likely bootstrapped | — |
| Stated 2026 direction | Predictive analytics, advanced listening, global team features; market expansion from agencies → enterprise + distributed/multi-location brands | B/C |

**Positioning:** agencies and freelancers are the historic core; 2025–2026 messaging pushes hard into **multi-location brands / franchises** and **enterprise**. The `signals.vistasocial.com` subdomain hosts reputation/review-management and analytics marketing aimed specifically at the multi-location segment — this appears to be a **marketing surface for the same product**, not a separately sold product. (**UNVERIFIED** — could not render the subdomain.)

---

## 3. Product Architecture — Core Objects

Understanding the object model matters for parity, because permissions, reporting scoping and billing all hang off it.

```
Account / Organization
 └── Profile Group  (= a brand, client, project, or location)
      ├── Social Profiles      (the billable unit)
      ├── Brand Voice policy   (per profile group)
      ├── Publishing Queues    (per profile, with labelled time slots)
      ├── Approval Workflows   (per profile group)
      └── Reports scope
 └── Users
      ├── Admin
      ├── Profile Group Admin  (full access, scoped to selected groups; cannot close account)
      ├── Read-only
      ├── Restricted           (per-feature: No Access / View / Manage)
      └── Contributor          (Publish-only sub-permission: can schedule, always requires review)
 └── User Groups               (group team members by role/access; assignable as approval steps)
 └── External connectors       (profile connect links — non-users who attach profiles; do NOT consume seats)
```

**Key architectural facts:**

- **Profile groups are containers for a brand/client/project.** Content and reports from different groups do not co-mingle. This is the multi-tenancy primitive. (Tier A)
- **Billing is profile-based, not seat-based.** The number of connected social profiles is what moves you between plans; users are a secondary, per-plan cap. (Tier C, consistently repeated)
- **User permissions are assigned per profile group.** You can disable a group for a user and that group becomes invisible in their dashboard. (Tier A)
- **User Groups** exist as a distinct concept — organise team members by role/access level, and assign a *group* (not just an individual) as an approval step. (Tier A)
- **Bulk selection by group:** when scheduling, you can select an entire profile group instead of picking profiles individually. (Tier A)
- **Profile connect links** let clients/externals attach their own social profiles with **no login and no seat consumption** — a genuinely strong agency onboarding primitive. (Tier A)

---

## 4. Pricing & Packaging

> ⚠️ **HIGHEST-UNCERTAINTY SECTION.** The live pricing page was unreachable. Third-party pricing blogs contradict each other and several are clearly stale. Reconcile against `vistasocial.com/pricing` before use.

### 4.1 Current plan lineup (2026)

| Plan | Monthly | Annual (total) | Annual → monthly equiv. | Social profiles | Users |
|---|---|---|---|---|---|
| **Free** | $0 | — | — | 3 profiles *(conflicting: one source says 9)* | 1 |
| **Professional** | **$79/mo** | **$758/yr** | $63.17/mo | **15** | **3** *(conflicting: 2 or 5)* |
| **Advanced** | **$149/mo** | **$1,430/yr** | $119.17/mo | **30** | **6** *(conflicting: 10)* |
| **Scale** | **$379/mo** | **$3,638/yr** | $303.17/mo | **70** | **10** |
| **Enterprise** | Custom | Custom | — | Unlimited | Unlimited |

**Annual discount = 20% off monthly.** The maths is internally consistent and this is the strongest signal that the table above is right:

- $79 × 12 × 0.8 = **$758.40** ✓ (matches reported $758/yr)
- $149 × 12 × 0.8 = **$1,430.40** ✓ (matches reported $1,430/yr)
- $379 × 12 × 0.8 = **$3,638.40** ✓ (matches reported $3,638/yr)

This confirms **Scale is $379/mo, not $349/mo** — several blogs quote $349 while simultaneously quoting the $303.17 annual equivalent, which only reconciles to $379. Treat $349 as a stale figure.

### 4.2 Discontinued / legacy plans

- **Standard — $39/mo, 8 profiles, 1 user.** Widely quoted in 2025-era and copy-paste 2026 blogs. It does **not** appear in current-lineup sources (G2/Capterra/TrustRadius pricing pages all show Professional $79 as the entry paid tier). **Assessment: discontinued, existing subscribers likely grandfathered. UNVERIFIED.**
- The historical progression appears to be: Standard $39 / Professional $79 / Advanced $149 / Enterprise $379 → **Professional $79 / Advanced $149 / Scale $379 / Enterprise custom**, i.e. the entry tier was removed and "Enterprise" was renamed "Scale" with a new custom Enterprise created above it.

### 4.3 Free trial terms

| Term | Value | Tier |
|---|---|---|
| Trial length | **14 days** | A |
| Credit card required | **No** | A |
| Feature access during trial | Full feature access on the trialled plan | A/C |
| Trials per account | **One only** — "Each account is only eligible for one 14-day trial of a plan" | A |
| Post-trial | Once the trial ends and you downgrade, **you cannot start a new trial** | A |
| Free tier after trial | Downgrade to Free (3 profiles, 1 user, core scheduling + basic analytics) | B/C |

### 4.4 Add-ons (critical — this is where the real pricing lives)

| Add-on | Price | Notes | Tier |
|---|---|---|---|
| **X (Twitter)** | **+$29/month per connected X profile** | Effective **1 March 2026**. Applies on *every* tier, Professional → Enterprise. Covers X publishing, boosting, automations and analytics. Driven by X API enterprise costs. Previously $10/profile/mo. | A/C |
| **Social Listening — Tier 1** | **$75/month per listener** | 10+ sources, **15,000 results/month**, **50 results per source per day** | C (well-corroborated) |
| **Social Listening — Tier 2** | **$150/month per listener** | 10+ sources, **45,000 results/month**, **150 results per source per day** | C |
| **Social Listening — Tier 3** | **$250/month per listener** | 10+ sources, **120,000 results/month**, **400 results per source per day** | C |
| **Employee Advocacy** | **Free for 3 advocates; $199/month for 25 employees** | Available on all plans Professional → Enterprise; 14-day free trial | B/C |
| **Extra user seats** | **~$3.75/user/month** | **UNVERIFIED** — quoted by one source only; possibly the annualised rate | C |
| **Extra social profiles (Enterprise)** | **~$29/profile/month** | **UNVERIFIED** — single source | C |
| **Custom-domain white labelling** | Add-on for Professional & Advanced; **included on Scale** | Full white-label (logo, colours, custom domain, branded emails) is a Scale-tier feature; lower tiers buy it as an add-on | A/B |

**Pricing implication to internalise:** a mid-size agency on Advanced ($149) that wants 3 X profiles, one Tier-2 listener and advocacy for 25 people pays **$149 + $87 + $150 + $199 = $585/month**, i.e. the sticker price is under half of realised ARPU. **The add-on stack is Vista Social's real monetisation engine.** Any competitor that bundles listening and X into base pricing has an immediately legible pitch.

### 4.5 AI credits per plan — **CONFLICTING DATA**

Two mutually exclusive sets of numbers are in circulation:

| Plan | Source set A | Source set B |
|---|---|---|
| Professional | 500 AI credits/mo + 1,000 content ideas | **2,500 credits/mo** |
| Advanced | 1,000 AI credits/mo + 2,000 content ideas | **10,000 credits/mo** |
| Scale | Unlimited | Unlimited |
| Enterprise | Unlimited | Unlimited |

**UNVERIFIED which is current.** Source set B is quoted by more recent-looking pricing analyses; source set A includes a separate "content ideas" quota which suggests it may reflect an older two-meter model. **What is confirmed (Tier A):** AI credits are consumed by **image generation AND image editing**, and the "unlimited AI Assistant" benefit begins at Advanced or Scale depending on source.

### 4.6 AppSumo lifetime deal (historical, but commercially important)

| Tier | Price | Users | Profiles | Posts |
|---|---|---|---|---|
| Tier 1 | $59 LTD | 3 | 10 | 30/month per profile |
| Tier 2 | $119 LTD | 10 | 25 | 100/month per profile |
| Tier 3 | $199 LTD | Unlimited | 40 | Unlimited/month per profile + AI Assistant |
| Tier 4 | (not surfaced) | — | ~100 profiles | — |

**This cohort is the single largest source of public negative sentiment.** See §28.4.

---

## 5. Network Coverage Matrix

### 5.1 Publishing networks

Confirmed publishing/scheduling support (Tier A/B):

| Network | Publishing | Notes |
|---|---|---|
| Facebook (Pages) | ✅ | Posts, Stories, Reels, Videos, **Carousels up to 5 images** |
| Facebook Groups | ✅ | Listed as connectable profile type |
| Instagram (Business/Creator) | ✅ | Feed, **Carousels**, **Reels**, **Stories**, **Trial Reels** (2025 addition) |
| X (Twitter) | ✅ *(paid add-on)* | Tweets + **threads** |
| LinkedIn (Pages) | ✅ | Posts, **document/PDF carousels**, first like, geo-targeting |
| LinkedIn (Personal profiles) | ✅ | Now fully supported |
| TikTok | ✅ | Images + videos; **Business and Creator** accounts |
| YouTube | ✅ | Videos + **Shorts** (<60s). **Video is the only auto-publishable type.** |
| Pinterest | ✅ | Pin + link + board selection; **multi-board bulk CSV upload** supported |
| Threads | ✅ | |
| Bluesky | ✅ | Full: plan, schedule, publish, analytics, response management |
| Reddit | ✅ | |
| Snapchat | ✅ | Listed in publishing network sets |
| Google Business Profile | ✅ *(partial)* | Primarily review management; GBP posts **UNVERIFIED** |
| Vimeo | ✅ | Listed as connectable |

**Vendor claim:** "13 platforms" for unified inbox and listening. Marketing elsewhere claims a wider set. Treat 13–15 as the real number of *deeply* supported networks.

**NOT supported (no evidence found):** Telegram, WhatsApp, Discord, Tumblr *(appears as a listening source only)*, Mastodon, Twitch, WeChat, Weibo, Xiaohongshu/RED, Lemon8, Substack Notes, Nextdoor.

### 5.2 Engagement (Inbox) support by network — Tier A

| Network | Comments | Mentions | Messages/DMs | Reviews | Shares |
|---|---|---|---|---|---|
| Facebook | ✅ | ✅ | ✅ | ✅ | ✅ |
| Instagram | ✅ | ✅ | ✅ | — | — |
| X (Twitter) | ✅ | ✅ | ✅ | — | — |
| TikTok | ✅ | — | ✅ | — | — |
| YouTube | ✅ | — | — | — | — |
| LinkedIn (company) | ✅ | ✅ | — | — | — |
| Google Business | — | — | — | ✅ | — |

**Note the holes:** no LinkedIn DMs, no YouTube mentions, no TikTok mentions. These are API constraints Vista Social shares with all competitors, but they are still parity requirements to *match*, not exceed.

### 5.3 Review sources

| Source | Monitor | Reply in-app | Notes |
|---|---|---|---|
| Google Business Profile | ✅ | ✅ **direct** | |
| Facebook | ✅ | ✅ **direct** | |
| Apple App Store | ✅ | ✅ **direct** | Added 2025 |
| Google Play Store | ✅ | ✅ **direct** | Added 2025 |
| Yelp | ✅ | ❌ link-out only | Third-party API limitation |
| TripAdvisor | ✅ | ❌ link-out only | |
| OpenTable | ✅ | ❌ link-out only | |
| Trustpilot | ✅ | ❌ link-out only | |

**8 review sources; direct reply on 4.** Notifications for new reviews via **email, SMS/text and in-app**.

### 5.4 Listening sources

Beyond the major social networks, listening explicitly covers: **App Store, Google Play, Bluesky, OpenTable, Tumblr, Yelp**, plus **news sources and the open web**. Listener tiers advertise "10+ sources".

---

## 6. Publishing & Scheduling — Full Detail

### 6.1 Composer

**Four-column layout** (Tier A/B):
1. Connected accounts selector
2. Composer box (caption)
3. Post preview
4. Per-network customisation panel

**Capabilities:**
- **Per-network post variations** — customise caption, media, and network-specific options per platform in the same post object.
- **"Apply to all"** — push a customisation from one network to all selected networks in one click.
- Emoji picker, hashtag panel, link shortening, UTM auto-append, media attach, AI Assistant inline.
- **Custom fields** — merge-field style variables for multi-location content (e.g. store-specific address/phone/offer injected per location). This is a genuine differentiator for franchise use cases.
- **Post labels** — colour-coded, used for filtering and for **campaign-level reporting** (Post Performance Report can be run for a label, and can exclude labels).

### 6.2 First comment & comment chains

- **Schedule up to the first 10 comments** on a post. (Tier A)
- First comment auto-posts immediately after the parent post publishes.
- Used for hashtag-dumping, link placement, and threading.

**Parity note:** "up to 10 comments" is more generous than most competitors, who cap at 1–2.

### 6.3 Auto-publish vs. reminder notifications

Every post carries a per-network toggle:
- **Auto publish** — Vista Social pushes via API at the scheduled time.
- **Send reminder notification** — a push notification is sent at the scheduled time to a **specified mobile device**, which can be **your own or any team member's**, so a human completes the post natively.

**Device targeting per post is notable** — most competitors send the reminder to whoever owns the account, not to an arbitrary named device.

**Where reminders are required (API limits):**
- Instagram Stories: auto-publish is **Business-profile only**; **stickers, sounds and effects are not available** on auto-published Stories.
- **Only one Story per post object** (Meta third-party limitation) — one image or video per Story post.
- YouTube: only video is auto-publishable.

### 6.4 Publishing Queues

- A queue is **a set of repeating time slots** per profile; new content drops into the next open slot.
- Configure by **day-of-week + time**; add unlimited slots.
- **Queue labels** — label slots by topic/campaign/content type (e.g. "Tuesday 9:00am = education slot"), so categorised content lands in the matching slot.
- Queue labels are a **distinct label namespace** from post labels, media labels and inbox labels. Vista Social maintains **four independent label systems**: Post, Media, Inbox, Queue.

### 6.5 Evergreen Auto-Repurposing (content recycling)

Per-post configuration (Tier A — precise limits confirmed):

| Parameter | Range |
|---|---|
| **Expiration date** | Last date the post is eligible for reuse |
| **Maximum reuses** | Up to **25** reuses per evergreen post |
| **Recycle interval** | Minimum **3 days**, maximum **100 days** |

**Reporting:** a dedicated performance view shows **incremental impressions, interactions and results generated by evergreen republishes**, so the ROI of recycling is measurable. This is stronger than most competitors, who recycle but don't attribute the lift.

### 6.6 Bulk publishing & CSV import

| Attribute | Value | Tier |
|---|---|---|
| Entry point | Create → **Bulk publishing** → **Import from CSV** | A |
| **Hard row limit** | **200 rows** | A |
| **Recommended limit** | **100 posts** ("to avoid potential issues") | A |
| Column order | **Arbitrary** — mapped by exact header name | A |
| Optional columns | Used for post customisations; all optional | A |
| Media | Must be **publicly hosted URLs**. **Google Drive links are NOT supported.** | A |
| Emoji | **CSVs exported from Excel do not support emoji.** Google Sheets recommended instead. | A |
| Template | Downloadable sample template inside the Import-from-CSV panel, includes examples of every supported scheduling format | A |
| Pinterest | **Multi-board bulk CSV upload** is explicitly supported (dedicated help article) | A |

**Also available:** bulk media upload (**up to 25 media items at once**), and **bulk label** operations from calendar list view (filter → checkbox-select → tag icon).

### 6.7 Smart Publishing (third-party content automation)

- Auto-share third-party content by selecting a **news category** or adding an **RSS feed**.
- **Bing News** is the underlying news source.
- RSS field mapping: **Title**, **Link**, **Description**.
- Help content covers finding feeds (`/feed` for WordPress, `.atom` for Shopify blogs) and auto-detection from `<meta>` tags.
- **"Smart Publishing with AI"** (2026): auto-generate post ideas and captions from selected topics/prompts/themes, with **brand voice and brand-safety policy applied automatically**.

### 6.8 Multi-time scheduling

Dedicated capability to **schedule one post to multiple times** (help article exists). Complements evergreen recycling for the "post the same thing at 3 different times" use case.

### 6.9 Optimal Time Suggestions ("best time to post")

**Algorithm (Tier A — this is the precise mechanic):**
- Based on **your own post performance data from your last 90 posts**.
- Analyses **audience engagement patterns, content velocity, and other factors** to detect the most active windows for authentic engagement.
- Per-profile and per-network.
- Surfaced **inline in the composer** at schedule time, not only as a separate report.
- Exposed as an **MCP tool** (`Get optimal publishing times`).

**Assessment:** this is a per-account historical model, not a global benchmark model and not a predictive/ML model. It requires 90 posts of history to be meaningful — a cold-start weakness. **Exceeding this is straightforward:** blend account history + network-wide benchmarks + audience timezone distribution + a cold-start prior.

### 6.10 Boosting / paid promotion

Vista Social has genuine ad-adjacent functionality, which is unusual at this price point:

- **Connect an Ad Account** to enable boosting **and paid performance reporting**.
- **Boost configurations** — saved, reusable targeting + budget + duration presets per network, selectable at schedule time.
- Targeting on Instagram/Facebook: **include or exclude audiences**, **interests**, **work positions**, **locations (country/city)**, **gender**, **age**.
- **Dark posts** — a "Dark post" checkbox hides a boosted Facebook post from the Page timeline.
- Boosted posts are filterable on the calendar.
- **Paid Performance Report** and **Paid vs. Organic reporting** exist as first-class report types.

**This is a real gap-closer against Sprout/Hootsuite** and a parity requirement. Note: it is boost-level, not campaign-manager-level — direct advertising campaign management is explicitly weak vs. dedicated ad platforms (see §28).

### 6.11 Daily posting limits

| Limit | Value | Tier |
|---|---|---|
| **Posts per day per profile** | **25** | A |
| Applies to | **All plans** | A |
| Reset mechanic | **Rolling 24 hours** — each successful post frees its slot exactly 24h later | A |
| Override | Contact support to review use case | A |
| **Scheduling horizon** | **No cap** — schedule months/years ahead | A |
| Fair-use monthly cap (AppSumo LTD Tier 3) | **3,100 posts/month** retroactively applied | D |

**"Fair Use Policy"** is a real, published document that layers additional caps on top of plan limits, including per-tier monthly post limits and 24-hour-resetting upload limits. Exact current values **UNVERIFIED** (the help article was unreachable) but the existence and enforcement of retroactive fair-use caps is confirmed by both the policy's existence and multiple angry AppSumo customers.

---

## 7. Calendar & Planners

### 7.1 Content calendar

- **Multiple view options** (month/week/list; exact set **UNVERIFIED**).
- **Drag-and-drop** rescheduling.
- **Filters:** by team member, post label, content type, queue label, boosted-post toggle, and **"include posts not scheduled from Vista Social"** (i.e. natively-published posts are pulled in).
- **Post status** surfaced on each item: published / scheduled / in review / draft / failed.
- **Holidays across countries and religions** displayed inline for post inspiration.
- **Bulk label** from list view.

### 7.2 Shared Calendar (client/stakeholder view)

A genuinely strong agency feature (Tier A):

| Option | Detail |
|---|---|
| Access | **No login required** — single shareable link |
| Link title | Customisable |
| Timezone | Customisable |
| Date range | Customisable |
| **Link expiration** | Configurable |
| **Password protection** | Configurable |
| Content shown | Scheduled, planned, and published content |
| **Approval from shared calendar** | Viewers of the shared calendar can be granted the right to **review/approve posts** — external approval without an account |

Clients can **review, edit, reject with a note, or approve** directly from the link.

### 7.3 Instagram Planner / grid preview

- Visual **grid preview** of the Instagram feed with scheduled posts in place.
- **Drag-and-drop to rearrange** scheduled post order within the grid.
- Media library and calendar auto-sync so assets can be dragged straight into the feed.

### 7.4 TikTok Planner

- Equivalent visual content planner across all TikTok profiles.
- **Trending audio library** surfaced for trend-jacking.

---

## 8. Media Library

| Attribute | Value | Tier |
|---|---|---|
| Asset types | Images, videos, audio, documents | A |
| **Max file size** | **2 GB each** for images, videos, audio and documents | A |
| **Bulk upload** | **Up to 25 items at once**, each under 2 GB | A |
| **Total storage quota** | **UNVERIFIED** — no per-plan storage cap surfaced | — |
| Organisation | **Folders** + **media labels** | A |
| Access control | **Profile-group restrictions** on media | A |
| Accessibility | **Alt text** per asset | A |
| Video thumbnails | Custom thumbnail / `thumb_offset` (exposed via MCP `Update media`) | A |
| Recommended image size | Under ~976 KB for optimal upload/performance | A |
| Supported image formats | JPG, PNG, WebP, HEIC | A |

**Sources & integrations:**
- **Stock:** Unsplash, Pexels (royalty-free, in-library)
- **Cloud sync:** **Google Drive, OneDrive, Dropbox**
- **Design:** **Canva** integration — create in Canva, import directly to media library. Canva's AI image generator is surfaced inside Vista Social.
- **GIFs:** **UNVERIFIED** (Giphy/Tenor not confirmed)
- **Box:** **NOT FOUND** — no evidence of Box support
- **AI-generated media** lands in the media library

---

## 9. Ideas (content library / ideation)

A distinct object type, separate from drafts (Tier A):

- Entry: **Create → Ideas → Create Idea**
- **Folders** for organising by campaign, theme or client
- **Labels**
- **Convert to post** — opens the post editor pre-populated
- **Internal notes / comments** per idea, with team collaboration
- **AI-generated ideas** as starting points
- Officially positioned as a **"Content Library for your organization"** (dedicated help article)
- Available on **mobile** (dedicated mobile help article)
- Exposed via MCP (`List ideas`, `Create or update idea`)

---

## 10. Hashtag Management

- **Hashtag panel** in composer (`#` icon).
- **Hashtag suggestions** — type a keyword → Suggest → returns suggested hashtags.
- **Saved hashtag groups** — click `+`, name the group, paste a list; reusable across posts.
- **AI hashtag generator** powered by ChatGPT — input industry + keywords → custom hashtag list.
- Network-specific hashtag generators marketed for **Instagram, TikTok, LinkedIn, Facebook, X** (these are free public lead-gen tools on the marketing site as well as in-product).

**Not found:** hashtag *performance analytics* (which hashtags drove reach), hashtag banned-word checking, hashtag volume/competition scoring. **These are gaps.** (**UNVERIFIED** whether a hashtag report exists — none surfaced in the reports list.)

---

## 11. Link Shortening, UTM & Tracking

| Capability | Detail | Tier |
|---|---|---|
| **Built-in shortener** | Native Vista Social shortener; URLs auto-shorten as you draft | A/B |
| **Bitly** | Supported as an alternative shortener | B |
| **Branded/custom short domain** | "Personalize your links to reflect your brand" — implies custom domain support | B |
| **Click tracking** | Clicks, engagement and overall link performance tracked in-platform | B |
| **UTM rules engine** | **Auto-appends UTM parameters based on rules you define** — no manual tagging | A |
| **Unique ID per link use** | "Vista Social generates a unique ID every time a link is used, so any incoming traffic is attributed to specific outgoing messages" — i.e. **per-message attribution**, not just per-campaign | A |
| GA capture | Traffic captured in Google Analytics via the applied UTM rules | A |

**The per-message unique-ID attribution is the strongest single claim here** and is a real differentiator vs. simple UTM builders. It means Vista Social can answer "which specific post drove this session", not just "which campaign".

**Rebrandly:** **NOT FOUND** — no evidence of Rebrandly support.

---

## 12. Vista Page (link-in-bio / microsite / landing page builder)

A full micro-CMS, not a link list (Tier A/B):

| Feature | Detail |
|---|---|
| Page type | Link-in-bio, **mini website**, **landing page** |
| **Blocks** | "Add Block" → choose content type → **drag-and-drop reorder** |
| Embeddable content | **Calendly** (book meetings), **Typeform** (lead capture / collect payments), **YouTube** video, galleries, social profiles |
| Themes | Theme picker + **Appearance tab** (colours, fonts, design elements) |
| **Custom domain** | Own domain supported, **free SSL certificates** |
| Default domain | Vista Social-hosted default available |
| **QR code** | Downloadable unique QR per page |
| **Analytics** | Click tracking, page statistics |
| **Import Link in Bio (Beta)** | Migrate an existing Linktree-style page into Vista Page |
| Page count limits | **UNVERIFIED** |

**Assessment:** meaningfully more capable than Later's or Buffer's link-in-bio. The Calendly/Typeform embeds plus payments make it a lightweight landing-page product. The **Import** feature is a smart competitive-switching lever worth copying.

---

## 13. Approvals, Collaboration, Tasks & Notes

### 13.1 Multi-step post approval

**Configuration path:** Settings → Publishing Settings → **Approval Workflows** (Tier A)

| Capability | Detail |
|---|---|
| Structure | **Named, ordered steps** |
| Step assignment | A **specific person**, **any team member within the profile group**, a **user group**, or **viewers of the shared calendar** (external) |
| Sequencing | **Strictly sequential** — each step must approve before the next reviewer sees it |
| Rejection | **Any rejection halts the whole chain** and returns the post for edits |
| Notification | Admins and users with "manage" permission receive an **email with a direct link to the post** |
| **External approval** | Reviewers can **approve without logging in** (via shared calendar link) |
| Client actions | Review, **edit**, **reject + leave a note**, or **approve → schedules for publishing** |
| **Contributor role** | Contributors **cannot select or change workflows**; all their posts are auto-routed through the **default workflow** configured by an admin |
| Filters | Approval workflows are filterable by **profile group** and **workflow name** (2025 addition) |
| Zapier hooks | `Post Needs to Be Reviewed`, `Post Has Been Rejected` triggers |

**Explicit weakness (confirmed by reviewers):** **no conditional routing.** "Complex approval workflows with conditional routing that Sprout Social handles natively required manual workarounds in Vista Social." There is no "if profile group = X and label = paid, route to legal" logic. **This is a top-tier exploitable gap.**

### 13.2 Task management

- **General tasks** — free-form, with **assignee**, **category tags**, **notes**, **due date**.
- **Typed tasks:** **Sales leads** (potential-lead messages, demo requests) and **Support issues** (technical, billing).
- **Create a task directly from an inbox item** via the task icon, assigning to a team member.
- **Known UX problem (Tier D):** at least one reviewer expected tasks to auto-create when a post was assigned for review; they don't, and manual task creation wasn't discoverable.

### 13.3 Internal notes & team conversations

- **Team conversations** panel inside the inbox — a private internal thread attached to a conversation.
- **`@`-mention** teammates to notify them.
- **Customers never see internal notes.**
- **Internal comments on posts** as well as inbox items (exposed via MCP `Add internal comment`, and via Zapier trigger `New Internal Post Comment`).
- Internal notes also exist on **Ideas**.

---

## 14. Engagement — Unified Social Inbox

### 14.1 Core

- Single stream for **comments, DMs, mentions, reviews and shares** across connected networks (see §5.2 matrix for per-network coverage).
- Filter by **type**, **sentiment**, **priority**, **campaign**, **custom labels**, **assignee**, **status**.
- Assign any conversation to a team member; create a linked task.
- Internal notes with `@`-mentions.

### 14.2 Saved Replies

- Store and reuse common responses.
- **Saved Reply groups** for categorisation.
- **AI-generated replies can be saved as Saved Replies** — a nice loop.

### 14.3 Macros

- **Macros apply multiple actions to an inbox item in one click** (e.g. reply + label + assign + close).
- Exposed via MCP: `Create a message macro`, `Apply a macro to inbox items`.

### 14.4 Sentiment

- **Every conversation is auto-tagged** with a sentiment icon: **positive / negative / mixed / neutral**.
- **A brief explanation of the sentiment classification is provided** — this is unusual and good; most tools give a label with no rationale.
- Feeds the **Sentiment Analysis Report**.

### 14.5 Moderation

- **Hide** and **delete** comments — available manually and **as automation actions**.
- **Ad-comment moderation:** Vista Social connects ad accounts and supports dark posts, but **whether comments on ads/dark posts flow into the inbox is UNVERIFIED.** No source explicitly confirmed ad-comment moderation. **Flag this as a likely gap to exploit — it is a major pain point for paid-heavy brands and few mid-market tools handle it.**
- **Known limitation (Tier D):** users **cannot "like" comments from the unified inbox**. Repeatedly cited.
- **Known limitation (Tier D):** **cannot block users** from within the app.

### 14.6 SLA / response-time management

- **Inbox Performance Report** covers **response time, action rate, and community-management performance over a period** (exposed via MCP `Get inbox response performance report`).
- **Inbox stats** — counts of messages/comments/reviews/mentions grouped by type, profile or status (MCP `Get inbox stats`).
- **No evidence of configurable SLA targets, SLA breach alerts, or SLA-based routing.** Response time is *measured*, not *managed*. **UNVERIFIED but likely absent — this is a gap.**

---

## 15. DM & Inbox Automations (rule engine)

A first-class module with its own marketing page (`vistasocial.com/dm-automations/`) and help section.

**Triggers:**
- New DM
- New comment — on a **post**, **livestream**, or **Reel**
- **Story reply**
- Mention
- **New review** (with **star-rating** and **keyword** conditions)

**Actions:**
- Send DM (with optional **video, image, link, or card**)
- Public reply
- **Hide comment**
- **Delete comment**
- Apply label
- **Assign to user or user group**
- **Dynamic AI Reply** — a custom prompt generates a fresh, human-like response per interaction, in brand voice

**Mechanics:**
- Keyword/phrase matching triggers (classic "comment FREEBIE → auto-DM the link" flow)
- **Instagram multi-message sequences** supported (dedicated help article: "How to Send More Than One Message")
- **Available actions vary per network** per each platform's API — Vista Social publishes a per-network trigger/action matrix
- Permission-gated: **only users with Manage access** can create/edit automations
- **10,000 DM contacts** included on Professional (per one pricing source — **UNVERIFIED**, but implies DM contacts are a metered resource)

**Review automations specifically:** auto-reply by star rating — 5★ gets an automated personalised thank-you; 1–2★ escalates to a human. This is a well-designed pattern worth matching exactly.

---

## 16. Reviews & Reputation Management

See §5.3 for the source/reply matrix.

**Confirmed capabilities:**
- Centralised review stream across 8 sources into the unified inbox
- **Direct reply** on Google Business, Facebook, App Store, Google Play; **link-out** for Yelp/TripAdvisor/OpenTable/Trustpilot
- **AI review replies** — dedicated help article "How to respond to reviews with AI Assistant"; brand voice applied
- **Review automations** by star rating and keyword (see §15)
- **Notifications** via **email, SMS/text and in-app**
- **Review Performance Report** — reviews, rankings, response rates, sentiment; exportable to PDF or scheduled for automatic delivery
- Review sentiment feeds the Sentiment Analysis Report

**Confirmed ABSENT / not found — these are real gaps:**

| Capability | Status |
|---|---|
| **Review request / generation campaigns** (email or SMS invitations to customers) | ❌ **NOT FOUND.** Vista Social's blog *writes about* review-request strategy, but no in-product feature surfaced. Explicitly assessed as absent. |
| **Review request landing pages / gating flows** | ❌ NOT FOUND (Vista Page QR is for link-in-bio, not review collection) |
| **Embeddable review widgets for websites** | ❌ NOT FOUND |
| **Local listings management / citation sync** (Yext-style) | ❌ NOT FOUND |
| **Google Q&A management** | ❌ NOT FOUND |
| **Google Business Profile post publishing** | ⚠️ UNVERIFIED |

**Strategic read:** Vista Social does **review response**, not **review generation or reputation growth**. A competitor that ships review requests (email/SMS/QR), review widgets, and Google Q&A closes a visible hole in the "review management for multi-location brands" positioning Vista Social is actively marketing into.

---

## 17. Social Listening

### 17.1 Structure

Two listener types (Tier A):

| Type | Scope |
|---|---|
| **Internal Listener** | Conversations **within your/your clients' connected social profiles** |
| **External Listener** | Conversations **across other social networks, the open web, and news** |

### 17.2 Query construction

- Keyword lists per listener
- **Keyword groups** with **AND / OR** semantics ("all" vs "any")
- **Exclusion keywords**
- Phrase groups
- **No evidence of full Boolean syntax** (NEAR, nested parentheses, proximity operators). This is a **grouped keyword builder, not a Boolean query language.** **This is a meaningful gap vs. Brandwatch/Talkwalker/Sprout Premium.**

### 17.3 Outputs

- **Sentiment breakdown**: positive / negative / neutral / mixed
- **Share of Voice** vs competitors
- **Volume / trend over time**
- **Influencer / top-author identification** — "who's talking about your brand and who's influencing the conversation"
- **Keyword trends**
- **Listener Performance Report** (a named report type)
- **Competitive analysis via listening** — dedicated help article
- Word clouds: **UNVERIFIED**

### 17.4 Limits (the important part)

| Tier | Price | Sources | Results/month | Results per source per day |
|---|---|---|---|---|
| 1 | $75/mo/listener | 10+ | **15,000** | **50** |
| 2 | $150/mo/listener | 10+ | **45,000** | **150** |
| 3 | $250/mo/listener | 10+ | **120,000** | **400** |

**Vista Social's own guidance:** "If a listener keeps hitting its daily or monthly cap, that is a good sign it is time to move it up a tier."

**Historical data depth: UNVERIFIED.** No source stated a backfill window. Third-party assessment says "historical data not going back as far" as dedicated tools. **Assume listening starts from listener-creation date with little or no backfill — this is the standard mid-market behaviour and matches the criticism. Confirm before competing on it.**

### 17.5 Honest competitive assessment (from Tier C/D)

> "Vista Social's listening capabilities are solid for the price point but don't match dedicated tools like Brandwatch or Sprout Social's premium listening add-on, with volume limits on keyword tracking and historical data not going back as far."

> "Sprout's listening runs deeper, with Trellis AI summaries and predictive alerts."

**Users on G2/Capterra explicitly ask for "expanded social listening features."** This is a confirmed, repeatedly-voiced weakness.

---

## 18. Analytics & Reporting

### 18.1 Report catalogue (Tier A — this list is well-corroborated)

| Report | Purpose |
|---|---|
| **Profile Performance Report** (formerly **Social Media Performance Report**) | Cross-channel performance across social profiles; cross-channel metrics + network-specific metrics |
| **Post Performance Report** | Every published post across selected networks; engagement, impressions, top performers; **runnable by post label, with label exclusions** |
| **Paid Performance Report** | Paid social ad campaign performance across multiple ad platforms |
| **Paid vs. Organic reporting** | Surfaced within Social Media Performance and Post Performance reports |
| **Competitor Analysis Report** | See §18.4 |
| **Review Performance Report** | Reviews, rankings, responses, sentiment |
| **Sentiment Analysis Report** | Positive/negative/neutral/mixed across comments, DMs, mentions, reviews |
| **Inbox Performance Report** | Response times, action rate, community-management performance |
| **Listener Performance Report** | Listening volume, sentiment, SOV |
| **Industry Benchmark Report** | AI-powered; compares posting cadence, engagement and growth to industry peers **with percentile rankings** |
| **Advocacy Performance Report** | Advocacy group performance |
| **Google Analytics / Web Analytics Report** | See §18.5 |

### 18.2 Custom report templates & customisation

- **Custom report templates** — build reusable templates (dedicated help article "How to create custom report templates")
- **"How to customize your reports"** (2026 article) — implies module-level add/remove/reorder
- **White-label:** replace the Vista Social logo with your own, add organisation name, apply brand colours to PDF reports
- **Custom metrics / calculated fields / formula builder:** ❌ **NOT FOUND.** No evidence Vista Social supports user-defined computed metrics. **This is a gap** — and it matches the recurring criticism of "limited options for customizing reports, restricting advanced data analysis."

### 18.3 Delivery & export

| Mechanism | Detail |
|---|---|
| **Formats** | **PDF**, **CSV**, **shareable link** |
| **Scheduled delivery** | **Weekly**, **monthly**, or **one-time custom date range** |
| Delivery format choice | PDF or report link, chosen per schedule |
| Recipients | Team members + arbitrary email recipients |
| Branding | White-label branding applied to PDFs |

### 18.4 Competitor Analysis Report — **MAJOR LIMITATION**

**Path:** Reports → Competitor analysis → select profile → search and add competitor profiles.

**Metrics:** when competitors publish, what hashtags they use, follower growth, engagement rate.

**⚠️ CRITICAL CONSTRAINT (Tier A):** competitor analysis supports **only Facebook Pages and Instagram Business/Creator profiles.**

**Not supported for competitors:** TikTok, YouTube, X, LinkedIn, Pinterest, Threads, Bluesky.

**Assessment:** for a platform positioning against Sprout and Rival IQ, **2-network competitor coverage is a glaring hole.** Socialinsider supports up to 100 competitor profiles across IG/FB/TikTok/X/LinkedIn. **This is the single clearest "beat them here" opportunity in the analytics module.**

### 18.5 Google Analytics integration

- Connect GA (help articles: "Connecting Google Analytics to Vista Social", "Google Analytics report definitions")
- Metrics surfaced: **total users, new users, bounce rate, session duration, engagement rate**, plus **visitors by channel, medium, and traffic source**
- Combined social + web reports in one document
- **GA4 specifically:** **UNVERIFIED** (one third-party source mentions "Google Analytics 360", which is likely a mislabel)

### 18.6 ROI / attribution

- **Per-message unique link IDs** enable post-level traffic attribution (see §11)
- Marketing claims "attribution tools help you understand which social touchpoints contribute to conversions throughout the customer journey" and "executive dashboards focused on revenue attribution"
- **Revenue/conversion attribution beyond GA channel data: UNVERIFIED and probably thin.** There is no evidence of a conversion-value pipeline, no Shopify/e-commerce revenue connector, no multi-touch attribution modelling.
- **Shopify integration: NOT FOUND.**

### 18.7 API for reporting

The public API is explicitly positioned for **BI/dashboard use**: "access your owned social profile data so you can use that data to power dashboards and automate your reporting." See §23.

---

## 19. AI Layer

Vista Social's AI is branded in two places: the inline **AI Assistant** (in composer/inbox/reviews) and **Ask Vista** (a conversational command-centre surface). Underlying model is described as **ChatGPT/OpenAI**.

### 19.1 Ask Vista (conversational)

- "AI-powered command center for social media"
- Ask for **post ideas** and select one
- **Trend queries**: e.g. *"What's trending in beauty in the UK right now?"*
- From a trend, choose an angle — **Newsjack it / Educational / Hot take / Promotional / Ask the audience** — and get AI-generated images, source links, and brand-voiced captions, then schedule and publish inline
- Generates replies to comments, DMs, reviews and mentions per profile/network

### 19.2 Inline AI Assistant

| Surface | Capability |
|---|---|
| Composer | **Generate caption** from prompt; **regenerate** for variations; **improve/rewrite** existing copy; translate/target language (defaults to English unless instructed) |
| Composer | **Hashtag generation** |
| Composer | **Image generation** (new tab: **Image generator**) |
| Composer | **Video generation** — text-to-video, animate an uploaded photo, or animate a media-library asset |
| Composer | **Image editing with AI** (consumes credits) |
| Inbox | **Generate reply** to messages/comments; save as Saved Reply |
| Reviews | **Generate review response** |
| Smart Publishing | **Auto-generate ideas + captions** from topics/prompts/themes |
| Mobile | Full AI Assistant available in mobile app |

### 19.3 Brand Voice

- **Path:** Settings → Profile groups → [group] → **Brand voice** → **Edit Policy**
- **Per-profile-group** — so each client/brand has its own voice
- Free-text policy describing demeanour and communication style
- Applied automatically across caption generation, replies, review responses, and Smart Publishing
- Vendor guidance is explicitly iterative: generate → review → edit → adjust policy → repeat
- A separate **brand safety policy** is referenced as applying automatically in Smart Publishing with AI

### 19.4 AI Training & Knowledge (RAG)

A distinct, more recent capability (Tier A):

- Create **Knowledges** — grounded knowledge bases the AI draws from
- **Ingestion methods:** import documents, type/paste specifications, **connect Zendesk to upload an entire knowledge base**
- Assign a Knowledge to a **chatbot block** to power automated conversations
- **Test tab** — run Q&A against the current knowledge + guidance config before going live
- **Brand voice and Knowledge compose** — voice controls style, Knowledge controls substance; both apply simultaneously

**This is a genuinely sophisticated capability for this market segment** and should be treated as a parity requirement, not a nice-to-have.

### 19.5 AI credits

- Metered monthly allowance per plan (see §4.5 — **numbers conflict**)
- **Confirmed consumers of credits:** AI image **generation** and AI image **editing**
- Video generation presumably consumes credits — **UNVERIFIED**
- Caption/reply generation consumption — **UNVERIFIED**
- **Unlimited AI** at Scale and Enterprise
- **No published per-credit overage price** — credits appear bundled, not sold à la carte. **UNVERIFIED whether overage top-ups exist.**

### 19.6 AI weaknesses reported by users

- **"AI limitations in captioning various languages"** — multilingual quality is a stated pain point
- "Sentiment analysis and AI-driven content recommendations are either limited or not yet fully developed" for enterprise needs

---

## 20. Employee Advocacy

| Attribute | Detail | Tier |
|---|---|---|
| Availability | All plans: Professional, Advanced, Scale, Enterprise | B/C |
| **Free allowance** | **3 advocates free** | C |
| **Paid** | **$199/month for 25 employees** (after 14-day trial) | B/C |
| Content model | Brand curates ready-to-share content; employees share to personal networks | B |
| **Gamification** | **Badges** and **leaderboards** | B |
| **Leaderboard metrics** | **Shares, reposts, engagement, and Earned Media Value (EMV)** | B |
| Tracking | Auto-tracks **shares, clicks and engagement** per employee | B |
| Dashboard sections | Advocacy metrics, content, advocate activity, leaderboard | B |
| **Slack alerts** | Dedicated help article: "How to enable Slack notifications for Employee Advocacy" | A |
| Reporting | **Advocacy Performance Report** | A |
| Brand guideline enforcement | Content pre-approved by brand; "ensuring adherence to brand guidelines" | B |

**Gaps not found:** no evidence of advocate-suggested content submission, no advocate mobile app (advocates presumably use the main app or email/Slack), no rewards/points redemption store, no advocate onboarding campaigns, no compliance/disclosure enforcement (#ad tagging).

---

## 21. Agency & Multi-Client Features

### 21.1 Client onboarding

**Profile connect links** (Tier A) — the strongest primitive here:
- Path: Settings → Profile Groups → [group] → Profiles tab → **"Get connect link"**
- Generates a **secure invitation link**
- The client connects their own social profiles **without logging in and without being added as a user**
- **Does not consume user seats**
- Improves data security (agency never holds client credentials)

Also: **"How to invite users as team members to connect social profiles"** — a separate flow for when the person *should* be a seated user.

### 21.2 Permissions matrix

| Role | Scope |
|---|---|
| **Admin / Account Owner** | Everything, including closing the account |
| **Profile Group Admin** | Full access to **selected profile groups only**; **cannot close the account** |
| **Read-only** | View everything, change nothing |
| **Restricted** | **Per-feature** grants: **No Access / View / Manage** |
| **Contributor** | Publish-feature sub-permission — can schedule, always requires review, cannot choose workflows |
| **User Groups** | Named collections of users, assignable as approval steps |
| **External (connect link)** | Attach profiles only; no dashboard access; no seat |
| **External (shared calendar)** | View + optionally approve/reject/edit posts; no login |

**Per-feature Manage/View/No-Access across every module** is a well-built permissions model and is a parity requirement.

### 21.3 White labelling

| Element | Detail | Tier |
|---|---|---|
| **Custom domain** | `social.youragency.com` replaces the Vista Social URL for team and clients | B |
| **Logo** | Replace Vista Social logo throughout dashboard; recommended **200×200px minimum, PNG or JPG** | A/B |
| **Colours** | Primary brand colour (hex) applied to headers, buttons, UI elements | B |
| **Branded emails** | Custom logo, palette and messaging in **all automated emails, alerts and system communications**; configure DNS to send report emails from the agency domain | B |
| **Report branding** | Own logo + org name on PDF reports | A |
| **Agency contact info** | Email, phone, website embedded | B |
| **Custom footer text** | Optional taglines, confidentiality notices | B |
| **Plan gating** | **Included on Scale**; available as a **paid add-on on Professional & Advanced** | A/B |
| Help section | Dedicated "White Label" help section with per-element articles | A |

### 21.4 Client portals

- **White-label client portals** are cited as a **Scale-plan ($379/mo)** feature.
- In practice the "portal" appears to be the combination of: white-labelled dashboard on custom domain + profile-group-scoped user access + shared calendar links + white-label reports. **A distinct, separately-branded client-only portal product is UNVERIFIED.**

### 21.5 Per-client billing

- **NOT FOUND.** No evidence Vista Social supports billing clients through the platform, generating client invoices, or reselling seats with markup. Agencies pay Vista Social; client billing is out of scope. **This is a gap** — Sendible and some agency tools have flirted with this and nobody does it well.

---

## 22. Integrations

### 22.1 Confirmed third-party integrations

| Category | Integrations |
|---|---|
| **Design** | **Canva** (incl. Canva AI image generator surfaced in-product) |
| **Cloud storage** | **Google Drive**, **OneDrive**, **Dropbox** |
| **Stock media** | **Unsplash**, **Pexels** |
| **Automation** | **Zapier**, **Make** (Make itself bridges 400+ apps), **Pabbly** *(roadmap, UNVERIFIED if shipped)* |
| **Messaging/alerts** | **Slack** (incoming webhooks) |
| **Analytics** | **Google Analytics** |
| **Link shortening** | **Bitly** |
| **Content sourcing** | **Bing News**, arbitrary **RSS** |
| **Support/KB** | **Zendesk** (for AI Knowledge ingestion) |
| **AI** | **OpenAI/ChatGPT** (embedded, not user-configurable) |
| **AI clients** | **MCP** — Claude, ChatGPT, Cursor, viaSocket, Zapier MCP |
| **Commerce** | **Instagram Shop product tagging** (tag up to 5 products/media item, 20 per carousel) |

**NOT FOUND:** Box, Shopify (as a data/commerce integration), Rebrandly, Giphy/Tenor, HubSpot, Salesforce, Marketo, Google Sheets (native), Airtable (native), Notion, Asana, Trello, Monday, Jira, Microsoft Teams, Discord, Figma, Adobe Express, Dropbox Replay, Vimeo (as a *media source* — it's a publishing target), Brandfolder/Bynder DAMs.

### 22.2 Slack integration

- **Account Owner enables the integration**, then any Vista user can activate webhooks and connect them in Slack
- Setup: create a Slack App (From Scratch) → Basic Information → Add Features and Functionality → **Incoming Webhooks** → toggle on → create one or more webhooks → paste URL into Vista Social → save
- **Multiple channels supported** (one webhook per channel)
- **Custom branding** on notifications: app icon, colour, name
- Also powers **Employee Advocacy alerts**
- **Plan gating: Advanced tier and above** (Tier C — **UNVERIFIED**)

### 22.3 Zapier

**Triggers (7 confirmed):**
| Trigger | Fires when |
|---|---|
| `New Post Is Published` | A post publishes |
| `New Post Is Scheduled` | A post is scheduled |
| `New Draft Is Created` | A draft post is created |
| `Post Needs to Be Reviewed` | A scheduled post enters review |
| `Post Has Been Rejected` | A reviewer rejects a post |
| `Post Failed to Publish` | Publishing fails |
| `New Internal Post Comment` | An internal collaboration comment is added |

**Actions:**
- `Schedule Post`
- Create profile group
- Retrieve post metrics
- Some actions marked **premium** — require contacting Vista Social for pricing

**Plan gating:** Zapier and Make integrations begin at **Advanced**.

### 22.4 Make

- Official Make app (`apps.make.com/vista-social`)
- Same rate-limit regime as Zapier (see §23.3)

---

## 23. API, MCP & Developer Surface

### 23.1 Public REST API

**Base:** `apidocs.vistasocial.com` (could not be rendered — details from help-centre retrieval).

**Positioning:** "an externally accessible API for you to access your owned social profile data so you can use that data to power dashboards and automate your reporting."

**Endpoint families (4 confirmed):**

| Family | Content |
|---|---|
| **Owned Profile Data** | Mirrors the **Social Media Performance report** dataset |
| **Post Data** | Mirrors the **Post Performance Report** dataset |
| **Comment Data** | Detailed information and metadata about post comments |
| **Schedule Posts** | Create scheduled posts on profiles connected to the account |

**Exact paths (`/v1/...` etc.): UNVERIFIED.**

**Authentication — 2 methods:**
1. **API Key** — generated from **Settings → Integrations**
2. **OAuth 2.0** — **Authorization Code flow with PKCE (S256)**; requires contacting support to have an OAuth client provisioned

**Provisioning gate:** "your account must be **provisioned for API use by your Vista Social account representative**." I.e. API access is **not self-serve** — it's gated behind a human and effectively behind Advanced/Enterprise. **This is a friction point worth beating: ship a self-serve API key on every paid plan.**

**Plan gating:** API access is described as unlocked at **Advanced**.

### 23.2 MCP server

Vista Social ships a **first-party MCP server** — an unusual and forward-leaning move for this category, and a genuine differentiator as of 2026.

| Attribute | Detail |
|---|---|
| Tool count | Reported as **35+**, **50+**, and **60** across sources — **60 is the most recent figure** |
| Clients | **Claude, ChatGPT, Cursor**, plus **viaSocket** and **Zapier MCP** wrappers |
| Categories | Publishing & scheduling · Reports & analytics · Inbox & community management · Tasks & workflows · Accounts, profiles & teams · Vista Pages · Trends & social listening · Shared calendars · Help & documentation · Utilities |

**Confirmed individual tools (names as published):**

*Publishing & scheduling*
- `Search posts (calendar)` — list scheduled/draft/published posts, filter by network, profile, status, label, date; **optional post insights**
- `Get post by id`
- `Get publishing queues` — queues and time slots for a profile
- `Get optimal publishing times` — best times based on historical audience activity
- `Get publishing devices` — mobile devices registered for reminder-based publishing
- `List boost configurations for a profile`

*Content & media*
- `Create media` — upload image/video/GIF to the media library, with optional `video thumbnail_url` or `thumb_offset`
- `Update media` — title, description, alt text, labels, video thumbnail
- `List ideas` — filter by label, folder, or id
- `Create or update idea`

*Analytics*
- `Get daily profile metrics` — daily followers, reach, impressions, engagement for a profile or profile group over a date range
- `Get published post performance` — rank posts by impressions/engagement/other metrics
- `Get industry benchmark report` — posting cadence, engagement, growth vs. industry peers **with percentile rankings**

*Inbox*
- `Get post comments`
- `Get inbox stats (counts and breakdowns)` — by type, profile, status
- `Get inbox response performance report` — response time, action rate, community management performance
- `Create a message macro`
- `Apply a macro to inbox items`

*Collaboration*
- `Add internal comment` — on a post or inbox item

**Marketed capability:** "query live account data, schedule content, manage inbox items, pull reports, and handle **approval workflows** directly from your chat window."

**Assessment:** this is the most strategically interesting thing Vista Social has shipped. It converts the product into an agent-addressable backend. **Parity here is non-optional; the way to exceed is (a) more tools, (b) self-serve auth, (c) write-safety semantics — confirmation/dry-run modes for destructive operations, which no vendor has yet done well.**

### 23.3 Rate limits

| Surface | Limit |
|---|---|
| Zapier / Make integrations | **60 requests/minute (3,600/hour)** |
| Header | `x-vs-rate-limit-remaining` |
| Penalty | **Exceed the limit >10 times in an hour → Make key is deactivated** |
| Direct public API limits | **UNVERIFIED** |

---

## 24. Mobile Apps & Browser Extensions

### 24.1 Mobile

| Attribute | Detail |
|---|---|
| Platforms | **iOS** (App Store ID `1623203443`) and **Android** (`com.vistasocial.android`) |
| Also | Listed on the **Microsoft Store** for Windows |
| Claimed parity | "Full parity with desktop, including **in-app video publishing** and **post approvals**" |
| Confirmed mobile features | Scheduling, inbox management, reports, **Ideas**, **AI Assistant**, **Instagram Stories publishing**, **Instagram Reels publishing**, **TikTok publishing**, **reminder notifications receipt** |
| Help centre | Dedicated **"Mobile App"** category |
| **Reality check (Tier D)** | Users say "the mobile app offers **fewer features** compared to the desktop version." Earlier reviews complained about **no mobile app at all** — likely stale, but "mobile app inbox" appeared on the 2025 roadmap as *in progress*, so mobile inbox may be recent/incomplete. |

### 24.2 Browser extensions

- **Google Chrome** and **Firefox** extensions (`vistasocial.com/extensions/`)
- Purpose: **share content from anywhere on the web** into Vista Social
- Safari/Edge: **NOT FOUND**

---

## 25. Security & Compliance

| Item | Status |
|---|---|
| **SSO** | **SAML 2.0 SSO** supported, on **web and mobile** |
| **2FA** | Supported — **but disabled when SSO is enabled**: "Users won't be able to configure 2-factor authentication in their Vista Social accounts when SSO is enabled" |
| **SCIM / directory provisioning** | **NOT FOUND** |
| **SOC 2** | **UNVERIFIED** — no evidence found |
| **ISO 27001** | **UNVERIFIED** — no evidence found |
| **GDPR** | **UNVERIFIED** — no compliance page surfaced |
| **HIPAA** | **UNVERIFIED** (almost certainly not) |
| **Data residency** | **UNVERIFIED** |
| **Data retention policy** | **UNVERIFIED** |
| **Audit logs** | **NOT FOUND** |
| **Password-protected client links** | ✅ Confirmed (shared calendar) |
| **Usage Policy** | Published at `vistasocial.com/usage-policy/` |
| **Fair Use Policy** | Published in help centre |

**Assessment: this is a soft underbelly.** The absence of any surfaced SOC 2 / ISO 27001 / GDPR documentation, plus no SCIM and no audit logs, means Vista Social will struggle in enterprise procurement despite its "Enterprise" tier. **A challenger with SOC 2 Type II, SCIM, audit logs and a real DPA has a clean enterprise wedge.**

---

## 26. Consolidated Limits & Quotas Reference

| Limit | Value | Confidence |
|---|---|---|
| Posts per day per profile | **25**, rolling 24h, all plans | High (A) |
| Scheduling horizon | **Unlimited** | High (A) |
| CSV bulk import rows | **200 hard / 100 recommended** | High (A) |
| Bulk media upload | **25 items at once** | High (A) |
| Max file size | **2 GB** (image/video/audio/document) | High (A) |
| Recommended image size | **<976 KB** | Medium (A) |
| Image formats | JPG, PNG, WebP, HEIC | High (A) |
| Scheduled comments per post | **10** | High (A) |
| Evergreen max reuses | **25** | High (A) |
| Evergreen recycle interval | **3–100 days** | High (A) |
| Instagram Stories per post object | **1** | High (A) |
| Instagram product tags | **5 per media item / 20 per carousel** | High (A) |
| Facebook carousel images | **5** | Medium (A) |
| YouTube Shorts | **<60s** | High (A) |
| Competitor analysis networks | **2 (Facebook Pages, Instagram Business/Creator)** | High (A) |
| Listener results/month | **15k / 45k / 120k** by tier | Medium (C) |
| Listener results/source/day | **50 / 150 / 400** by tier | Medium (C) |
| Zapier/Make rate limit | **60 req/min, 3,600/hr** | Medium (A) |
| Make key deactivation | **>10 limit hits in an hour** | Medium (A) |
| AI credits/month | **Conflicting: 500/1,000 or 2,500/10,000** | **LOW** |
| DM contacts (Professional) | **10,000** | Low (C) |
| Fair-use monthly post cap | Exists; values **UNVERIFIED** (3,100/mo cited for one LTD tier) | Low (D) |
| Total media storage | **UNVERIFIED** | — |
| Vista Page count | **UNVERIFIED** | — |
| Saved replies count | **UNVERIFIED** | — |
| Approval workflow steps | **UNVERIFIED** | — |
| Listening historical backfill | **UNVERIFIED** | — |

---

## 27. Feature Availability by Plan (best reconstruction)

> ⚠️ Reconstructed from multiple partial third-party summaries. **Verify against the live pricing page.**

| Capability | Free | Professional $79 | Advanced $149 | Scale $379 | Enterprise |
|---|---|---|---|---|---|
| Social profiles | 3 | 15 | 30 | 70 | Unlimited |
| Users | 1 | 3 | 6 | 10 | Unlimited |
| Planning & publishing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar + planners | ✅ | ✅ | ✅ | ✅ | ✅ |
| Media library | ✅ | ✅ | ✅ | ✅ | ✅ |
| Basic analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unified inbox | — | ✅ | ✅ | ✅ | ✅ |
| Vista Page (link in bio) | — | ✅ | ✅ | ✅ | ✅ |
| DM automations | — | ✅ | ✅ | ✅ | ✅ |
| Review management | — | ✅ | ✅ | ✅ | ✅ |
| **Bulk scheduling** | — | ✅ | ✅ | ✅ | ✅ |
| **Content finders** | — | ✅ | ✅ | ✅ | ✅ |
| **Report scheduling** | — | ✅ | ✅ | ✅ | ✅ |
| Employee advocacy | — | ✅ (3 free) | ✅ | ✅ | ✅ |
| AI Assistant | Limited | Metered credits | More credits | **Unlimited** | Unlimited |
| **Zapier / Make / MCP** | — | — | ✅ | ✅ | ✅ |
| **Public API** | — | — | ✅ | ✅ | ✅ |
| **Slack integration** | — | — | ✅ *(UNVERIFIED)* | ✅ | ✅ |
| **Advanced workflows** | — | Basic | ✅ | ✅ | ✅ |
| **White label (logo/colours/emails/domain)** | — | Add-on | Add-on | **✅ included** | ✅ |
| **Client Connect** | — | — | — | ✅ | ✅ |
| Sentiment detection (premium) | — | — | — | — | ✅ |
| Industry benchmarking | — | — | ? | ? | ✅ |
| Brand safety & compliance tools | — | — | — | — | ✅ |
| Dedicated account manager | — | — | — | — | ✅ |
| Onboarding & training | — | — | — | — | ✅ |
| Custom integrations | — | — | — | — | ✅ |
| Quarterly account reviews | — | — | — | — | ✅ |
| Social listening | **Paid add-on at every tier ($75/$150/$250 per listener/mo)** ||||
| X (Twitter) | **Paid add-on at every tier (+$29/profile/mo)** ||||

---

## 28. Known Weaknesses & Real User Criticism

Sourced from G2, Capterra, Trustpilot, AppSumo and App Store reviews (Tier D), plus third-party comparative analysis (Tier C).

### 28.1 Product depth criticisms

| Criticism | Detail |
|---|---|
| **Listening is shallow** | "Users miss expanded social listening features." Volume-capped, historical depth limited, no Boolean query language, no predictive alerts. Doesn't match Brandwatch or Sprout Premium. |
| **Reporting customisation is limited** | "Limited options for customizing reports, restricting advanced data analysis." No calculated/custom metrics. |
| **No conditional approval routing** | "Complex approval workflows with conditional routing that Sprout Social handles natively required manual workarounds." |
| **Competitor analysis = 2 networks only** | Facebook Pages + Instagram only. |
| **Advertising management is thin** | "Capabilities for direct advertising campaign management are limited compared to specialized ad platforms." Boost-level only. |
| **Cannot like comments from the inbox** | Repeatedly cited. Basic engagement action missing. |
| **Cannot block users in-app** | Cited in App Store reviews. |
| **Scheduling weaker than Sendible** | "Scheduling functionality is a bit weaker than tools like Sendible." |
| **Enterprise AI immature** | "Sentiment analysis and AI-driven content recommendations are either limited or not yet fully developed" for sophisticated enterprise strategies. |
| **Maturity gap** | "Founded in 2022 [sic], Vista Social hasn't had time to build the depth that decade-old competitors offer… advanced automation workflows limited and a smaller integration ecosystem." |

### 28.2 UX criticisms

| Criticism | Detail |
|---|---|
| **Poor discoverability** | "The breadth of features works against discoverability; social listening, approval workflows, review management, employee advocacy, and link-in-bio are present but **not surfaced prominently**, with several reviewers describing a **non-trivial ramp-up period**." **This is the most actionable criticism in the whole document.** |
| **Confusing learning curve** | "Confusing learning curve… improves with familiarity." |
| **Profile connection is painful** | "Slow, occasionally confusing, and sometimes requires **repeated attempts or manual fixes**." Some Instagram connections require a Facebook-linked login; browser privacy settings cause conflicts. |
| **Task feature unintuitive** | A reviewer assumed tasks auto-create on post assignment; they don't, and manual creation was undiscoverable. |
| **Delayed media processing** | Uploaded media processing lag cited. |
| **Multilingual AI weak** | "AI limitations in captioning various languages." |

### 28.3 Reliability criticisms

| Criticism | Detail |
|---|---|
| **Disappearing comments** | Comments posted via Vista Social show as live, then vanish — breaks follower interaction tracking. |
| **Duplicate posting** | Duplicate posts reported. |
| **Post failures** | An entire help-centre section exists for "Troubleshooting posts" and Instagram publishing errors. |
| **Unfixed launch bugs** | "Bugs from a launch were never fixed." |

### 28.4 Commercial / trust criticisms — **the most severe cluster**

| Criticism | Detail |
|---|---|
| **X/Twitter removal + repricing** | LTD purchasers had X support removed, then reinstated at **$10/profile/mo**, then **tripled to $29/profile/mo**, citing "X Enterprise costs." Multiple furious reviews. |
| **Retroactive fair-use caps** | A Tier-3 LTD customer who bought explicitly for *unlimited* posting reports Vista Social **retroactively applied a 3,100 posts/month cap**. |
| **Alleged bait-and-switch** | LTD customers describe the T&C changes as "absolute fraud and theft from consumers." |
| **Account cancellations** | A user reports Vista Social **cancelled an account** with unlimited users and 40 profiles after removing Twitter access. |
| **Billing increases without warning** | Trustpilot: "billing increases without warning." |
| **Charged while broken** | "Software stopped working but they were still charged for the full subscription"; "really challenging to cancel." |
| **Trial/account state bugs** | A paying customer was told their free trial had ended; on re-signup **all linked social accounts were gone**. |
| **Upsell-or-refund pressure on LTD holders** | "Support tried to upsell them or offered a refund and account closure" — early supporters feeling "squeezed out to force monthly subscriptions." |
| **Support responsiveness** | **"No phone number to call and emails take several days to get a reply."** |

**Strategic read:** the LTD cohort is a bleeding wound producing durable, high-visibility negative sentiment. Positioning that emphasises **stable pricing commitments, no retroactive limit changes, and responsive support (incl. live channels)** targets Vista Social's most credible reputational weakness.

### 28.5 Roadmap items (as of the last visible roadmap) — implies these were absent

| Status | Items |
|---|---|
| **Shipped** | Instagram & TikTok Planner, external drive support, Slack integration, dark mode, AI image/video generation, App Store & Google Play review management, Paid Performance Report, Instagram Trial Reels, approval-workflow filters |
| **In progress** (at time of capture) | Dark mode *(since shipped)*, **mobile app inbox**, **calendar notes**, **mixing media** (mixed image+video in one post) |
| **Planned** | Bio links *(since shipped as Vista Page)*, **polls**, **YouTube Community Posts**, **Pabbly integration** |

**Still-open gaps implied:** calendar notes, mixed-media posts, polls, YouTube Community Posts.

---

## 29. Gap Analysis — Where the Market (Not Just Vista Social) Is Weak

These are the places where **nobody in this category does it well or at all**. This is the "exceed" list.

### 29.1 Confirmed Vista Social gaps that are also broadly weak market-wide

1. **Review generation.** Vista Social does review *response* only. No review request campaigns (email/SMS), no review landing pages, no QR-to-review flows, no review widgets for websites, no Google Q&A management, no local listings/citation sync. The mid-market SMM category has essentially ceded this to Birdeye/Podium/Yext at 3–5× the price. **Huge wedge for multi-location.**

2. **Conditional / branching approval workflows.** Everyone ships linear approval chains. Nobody ships rule-based routing (`if network = X AND label = regulated → route to legal`), parallel approval steps, quorum approvals, or auto-approve-below-threshold. Vista Social explicitly lacks it; so does most of the mid-market.

3. **Custom/calculated metrics in reporting.** No formula builder, no derived KPIs, no goal-vs-actual tracking. Every vendor ships fixed metric sets. A spreadsheet-grade formula layer over social data is unclaimed territory.

4. **Ad-comment / dark-post comment moderation.** Vista Social connects ad accounts and supports dark posts but ad-comment moderation is **UNVERIFIED and likely absent**. This is a top-3 pain point for paid-heavy brands and almost nobody outside enterprise (Sprinklr, Emplifi) does it.

5. **Competitor analytics beyond FB/IG.** Vista Social covers 2 networks. TikTok, YouTube, LinkedIn and X competitor benchmarking is where demand actually is in 2026.

6. **SLA management, not just SLA measurement.** Response time is reported; it is not *managed*. Nobody in the mid-market ships configurable SLA targets, breach alerts, escalation ladders, or SLA-based auto-routing.

7. **Enterprise security posture at mid-market price.** No surfaced SOC 2, no ISO 27001, no SCIM, no audit logs, no data-residency options. A challenger with these has a clean enterprise land.

8. **Listening query language.** Grouped AND/OR keywords is not Boolean. NEAR/proximity operators, nested logic, regex, and language/geo filters are enterprise-only across the market.

9. **Listening historical backfill.** Almost universally, listeners start from creation date. Backfill is a genuine differentiator and almost nobody sells it below enterprise.

10. **Per-client billing / agency reselling.** No vendor lets an agency invoice its clients through the platform with markup. Real unmet demand.

11. **Multilingual AI quality.** Explicitly criticised in Vista Social; broadly weak across the category. Non-English markets are underserved.

12. **Cold-start "best time to post."** Vista Social needs 90 posts of history. Every account starts cold. Nobody blends account history + network benchmarks + audience timezone distribution + a sensible prior.

13. **Evergreen ROI attribution** — Vista Social actually *does* this (incremental impressions from recycling). Most competitors don't. **This is a Vista Social strength to match, not a gap.**

14. **Agent-safety semantics for MCP.** Vista Social ships ~60 MCP tools. Nobody has shipped confirmation gates, dry-run modes, spend/publish guardrails, or scoped agent tokens for destructive social operations. As agents publish on behalf of brands, this becomes the #1 buying question. **Unclaimed.**

15. **Discoverability of owned features.** Vista Social's most-cited complaint is that its own modules are invisible. Guided onboarding, per-module activation journeys, in-product "you're not using X" nudges, and a genuinely searchable command palette are cheap wins that materially change perceived product quality.

### 29.2 Vista Social strengths that must be matched (non-negotiable parity)

- Profile connect links (client onboarding without seats)
- Per-profile-group brand voice + AI Knowledge (RAG) with a Test tab
- 10 scheduled comments per post
- Evergreen recycling with explicit reuse/interval caps **and ROI attribution**
- Publishing queues with **labelled slots** and four separate label namespaces
- Reminder publishing **targeted at a named device**
- Shared calendar links with expiry + password + external approval
- Boost configurations + dark posts + Paid vs. Organic reporting
- Per-message unique link IDs for post-level attribution
- Vista Page with custom domain, SSL, Calendly/Typeform embeds, QR, and **competitor import**
- Inbox macros + saved reply groups + sentiment with rationale
- DM/review automation rule engine with **Dynamic AI Reply**
- App Store + Google Play review management (rare)
- Employee advocacy with EMV on the leaderboard + Slack alerts
- Custom fields for multi-location content
- Industry Benchmark Report with percentile ranking
- **First-party MCP server**

---

## 30. Parity Checklist (condensed, build-ordered)

| # | Capability | Vista Social | Parity priority |
|---|---|---|---|
| 1 | Multi-network composer with per-network variations + "apply to all" | ✅ | P0 |
| 2 | Auto-publish vs. device-targeted reminder | ✅ | P0 |
| 3 | First comment + up to 10 scheduled comments | ✅ | P0 |
| 4 | Drag-drop calendar, multi-view, rich filters, statuses | ✅ | P0 |
| 5 | Shared calendar link (expiry + password + external approval) | ✅ | P0 |
| 6 | Publishing queues with labelled slots | ✅ | P0 |
| 7 | Evergreen recycling (max reuses, interval, expiry) + ROI attribution | ✅ | P1 |
| 8 | Bulk CSV import (arbitrary column order, template, ≥200 rows) | ✅ | P0 |
| 9 | Media library: folders, labels, alt text, 2GB files, group restrictions | ✅ | P0 |
| 10 | Cloud sync (Drive/OneDrive/Dropbox) + Canva + stock | ✅ | P1 |
| 11 | Ideas / content library with folders, labels, notes, convert-to-post | ✅ | P1 |
| 12 | Hashtag groups + suggestions + AI generation | ✅ | P1 |
| 13 | Link shortening + UTM rules engine + **per-message unique IDs** | ✅ | P0 |
| 14 | Link-in-bio microsite: custom domain, SSL, blocks, embeds, QR, analytics, **import** | ✅ | P1 |
| 15 | Multi-step approval workflows incl. external approvers | ✅ | P0 |
| 16 | **Conditional/branching approval routing** | ❌ | **P1 — EXCEED** |
| 17 | Per-feature permissions (No Access/View/Manage) + Contributor + user groups | ✅ | P0 |
| 18 | Profile connect links (no login, no seat) | ✅ | P0 |
| 19 | Tasks (general + typed) + internal notes with @mentions | ✅ | P1 |
| 20 | Unified inbox: comments/DMs/mentions/reviews/shares | ✅ | P0 |
| 21 | Saved replies + groups; macros | ✅ | P1 |
| 22 | Sentiment auto-tagging **with rationale** | ✅ | P1 |
| 23 | Auto-assignment, labels, hide/delete moderation | ✅ | P1 |
| 24 | **Like comments from inbox** | ❌ | **P1 — EXCEED (trivial)** |
| 25 | **Block users from inbox** | ❌ | **P2 — EXCEED** |
| 26 | **Ad-comment / dark-post comment moderation** | ⚠️ | **P1 — EXCEED** |
| 27 | **Configurable SLA targets + breach alerts + escalation** | ❌ | **P1 — EXCEED** |
| 28 | DM/review automation engine (triggers × actions × networks) + AI dynamic reply | ✅ | P0 |
| 29 | Review monitoring across 8 sources; direct reply on 4 | ✅ | P1 |
| 30 | AI review replies | ✅ | P1 |
| 31 | **Review generation: email/SMS requests, landing pages, QR, widgets** | ❌ | **P0 — EXCEED** |
| 32 | **Google Q&A + local listings sync** | ❌ | **P2 — EXCEED** |
| 33 | Listening: internal + external listeners, keyword groups, exclusions | ✅ | P1 |
| 34 | **Boolean query language for listening** | ❌ | **P2 — EXCEED** |
| 35 | **Listening historical backfill** | ❌ | **P2 — EXCEED** |
| 36 | Sentiment / SOV / influencer identification | ✅ | P1 |
| 37 | Report catalogue (profile, post, paid, paid-vs-organic, review, sentiment, inbox, listener, benchmark, advocacy, competitor) | ✅ | P0 |
| 38 | Custom report templates + white-label PDFs | ✅ | P0 |
| 39 | Scheduled delivery (weekly/monthly/one-time) to PDF/link/CSV | ✅ | P0 |
| 40 | **Competitor analytics across ≥6 networks** | ❌ (2) | **P0 — EXCEED** |
| 41 | **Custom/calculated metrics & formula builder** | ❌ | **P1 — EXCEED** |
| 42 | Google Analytics integration | ✅ | P1 |
| 43 | Boosting: ad account connect, boost configs, targeting, dark posts | ✅ | P1 |
| 44 | Paid Performance + Paid vs. Organic reports | ✅ | P1 |
| 45 | AI: caption/hashtag/reply/review generation | ✅ | P0 |
| 46 | AI: image generation + editing, video generation | ✅ | P1 |
| 47 | Brand voice per profile group | ✅ | P0 |
| 48 | AI Knowledge / RAG with document + Zendesk ingestion + Test tab | ✅ | P1 |
| 49 | Conversational AI surface ("Ask Vista" equivalent) with trend→angle→post flow | ✅ | P1 |
| 50 | Employee advocacy: curation, leaderboard w/ EMV, badges, Slack alerts, report | ✅ | P2 |
| 51 | White label: logo, colours, custom domain, branded emails, branded reports | ✅ | P0 |
| 52 | Profile groups as multi-tenant primitive | ✅ | P0 |
| 53 | **Per-client billing / agency reselling** | ❌ | **P2 — EXCEED** |
| 54 | Zapier + Make integrations | ✅ | P1 |
| 55 | Slack integration (multi-channel webhooks, custom branding) | ✅ | P2 |
| 56 | Public REST API (profile data, post data, comment data, schedule posts) | ✅ | P0 |
| 57 | OAuth 2.0 Authorization Code + PKCE (S256) + API keys | ✅ | P0 |
| 58 | **Self-serve API access (no sales gate)** | ❌ | **P1 — EXCEED** |
| 59 | MCP server (~60 tools) | ✅ | P0 |
| 60 | **MCP agent-safety: dry-run, confirmation gates, scoped tokens, spend caps** | ❌ | **P0 — EXCEED** |
| 61 | iOS + Android apps with publishing, inbox, approvals, AI | ✅ | P1 |
| 62 | Chrome + Firefox extensions | ✅ | P2 |
| 63 | SAML 2.0 SSO | ✅ | P1 |
| 64 | **SCIM provisioning** | ❌ | **P1 — EXCEED** |
| 65 | **Audit logs** | ❌ | **P1 — EXCEED** |
| 66 | **SOC 2 Type II / ISO 27001 / published DPA** | ❌/⚠️ | **P0 — EXCEED** |
| 67 | 2FA **that coexists with SSO** | ❌ (mutually exclusive) | **P2 — EXCEED** |
| 68 | Custom fields for multi-location content | ✅ | P2 |
| 69 | Smart Publishing (RSS + news categories + AI) | ✅ | P2 |
| 70 | Instagram: user/product/location tagging, collab posts, Trial Reels | ✅ | P1 |
| 71 | **Polls, YouTube Community Posts, mixed-media posts, calendar notes** | ❌ (roadmap) | **P2 — EXCEED** |
| 72 | **X/Twitter included in base price** | ❌ ($29 add-on) | **P1 — EXCEED (positioning)** |
| 73 | **Listening included in base price** | ❌ ($75+ add-on) | **P1 — EXCEED (positioning)** |
| 74 | **Cold-start optimal-time model** | ❌ (needs 90 posts) | **P2 — EXCEED** |
| 75 | **In-product feature discoverability / activation journeys** | ❌ (top complaint) | **P0 — EXCEED** |

---

## 31. Open Questions / Explicitly UNVERIFIED

These must be resolved by a human with browser access before this document is used for pricing, contracts, or competitive claims.

**Pricing & packaging**
1. Exact current plan lineup, prices and profile/user counts on `vistasocial.com/pricing`
2. Whether the Free tier is 3 profiles or 9 profiles, and exactly what it includes
3. Whether the $39 Standard plan still exists for new customers
4. **AI credits per plan** — 500/1,000 vs 2,500/10,000 (both in circulation)
5. Extra user seat price ($3.75/user/mo?) and extra profile price ($29/profile/mo?)
6. Whether AI credit overage top-ups can be purchased
7. Exact white-label add-on price on Professional/Advanced
8. Whether "10,000 DM contacts" on Professional is real and how it scales

**Limits**
9. Current Fair Use Policy values (monthly post caps per tier, 24h upload caps)
10. Total media storage quota per plan
11. Vista Page count limits per plan
12. Saved reply / macro / approval-step count limits
13. Listening historical backfill window
14. Direct public API rate limits (distinct from the 60/min Zapier/Make figure)

**Features**
15. Whether Google Business Profile **post publishing** (not just reviews) is supported
16. Whether **ad/dark-post comments** flow into the unified inbox
17. Whether any **hashtag performance report** exists
18. Whether GIF sources (Giphy/Tenor) are integrated
19. Whether a **word cloud** exists in listening
20. Whether the mobile inbox is fully shipped
21. Whether `signals.vistasocial.com` is a distinct SKU or a marketing surface
22. Full MCP tool inventory (60 tools; ~20 confirmed by name here)
23. Exact REST API endpoint paths and versioning scheme
24. Whether "client portal" is a distinct product surface or the white-labelled dashboard

**Security**
25. SOC 2 / ISO 27001 status
26. GDPR posture, DPA availability, sub-processor list
27. Data residency options
28. Data retention policy
29. Whether audit logs exist in any form
30. Whether SCIM is available on Enterprise

---

## 32. Sources

**First-party — Vista Social help centre (Tier A)**
- support.vistasocial.com — Getting started with Vista Social
- support.vistasocial.com — How many profiles and users can I have on my subscription
- support.vistasocial.com — Information about free trials
- support.vistasocial.com — Vista Social Fair Use Policy
- support.vistasocial.com — X (Twitter) Integration Changes - March 1, 2026
- support.vistasocial.com — Daily posting limits
- support.vistasocial.com — Customization options during post scheduling
- support.vistasocial.com — Scheduling a First Comment and additional comments
- support.vistasocial.com — Auto Publishing vs. Notification Reminders
- support.vistasocial.com — Smart Publishing / Smart Publishing with AI
- support.vistasocial.com — Bulk Publishing
- support.vistasocial.com — CSV format guidelines for Bulk Scheduling
- support.vistasocial.com — How to schedule posts to multiple Pinterest boards using bulk CSV upload
- support.vistasocial.com — How to schedule a post to multiple times
- support.vistasocial.com — Evergreen Auto-Repurposing
- support.vistasocial.com — Publishing Queues
- support.vistasocial.com — Optimal Time Suggestions
- support.vistasocial.com — Hashtag suggestions
- support.vistasocial.com — URL Tracking with UTM codes
- support.vistasocial.com — Setting up your Vista Page
- support.vistasocial.com — How to import your link-in-bio to Vista Social
- support.vistasocial.com — How to generate a QR code for your Vista Page
- support.vistasocial.com — Multi-Step Post Approval: How to create post approval workflows
- support.vistasocial.com — Submitting posts for approval / Post Approvals: How to review posts
- support.vistasocial.com — Invite Contributors
- support.vistasocial.com — Changing user permissions in your organization
- support.vistasocial.com — Adding users and setting up permissions
- support.vistasocial.com — How to create profile groups / How to add a profile group
- support.vistasocial.com — How to create and manage user groups within your team
- support.vistasocial.com — How to let external users connect social profiles without logging in (profile connect link)
- support.vistasocial.com — Work as a team with Task Management
- support.vistasocial.com — Team conversations in the inbox
- support.vistasocial.com — Getting started with the Social Inbox
- support.vistasocial.com — Inbox message options
- support.vistasocial.com — How to save replies to reuse in the Inbox
- support.vistasocial.com — Which engagements does Vista Social support for each network?
- support.vistasocial.com — Getting Started with Inbox & Review Automations
- support.vistasocial.com — Inbox Automation Triggers & Actions by Network
- support.vistasocial.com — Instagram Automations: How to Send More Than One Message
- support.vistasocial.com — Getting started with Review Management on Vista Social
- support.vistasocial.com — Which networks can I reply to reviews from within Vista Social?
- support.vistasocial.com — Responding to reviews
- support.vistasocial.com — How to respond to reviews with AI Assistant
- support.vistasocial.com — Social Listening with Vista Social
- support.vistasocial.com — How to use social listening for competitive analysis
- support.vistasocial.com — Getting started with Reports
- support.vistasocial.com — Profile / Social Media Performance Report
- support.vistasocial.com — Post Performance Report
- support.vistasocial.com — Paid Performance Report
- support.vistasocial.com — Paid vs. Organic reporting
- support.vistasocial.com — Competitor Analysis Report
- support.vistasocial.com — Sentiment Analysis Report
- support.vistasocial.com — Industry Benchmark Report
- support.vistasocial.com — How to create custom report templates
- support.vistasocial.com — How to customize your reports
- support.vistasocial.com — How to schedule reports
- support.vistasocial.com — How to run reports by post label for campaigns
- support.vistasocial.com — Connecting Google Analytics to Vista Social
- support.vistasocial.com — Google Analytics report definitions
- support.vistasocial.com — Connecting your Ad Account to Vista Social (for Boosting & Paid Performance Reporting)
- support.vistasocial.com — Boosting posts with Vista Social
- support.vistasocial.com — How to craft social posts with AI Assistant
- support.vistasocial.com — How to reply to messages and comments with AI Assistant
- support.vistasocial.com — How to set up your brand voice for AI Assistant
- support.vistasocial.com — AI Training & Knowledge: Getting Started
- support.vistasocial.com — How to generate images with AI on Vista Social
- support.vistasocial.com — Getting started with Advocacy Program for Brands
- support.vistasocial.com — How to enable Slack notifications for Employee Advocacy
- support.vistasocial.com — White labeling with Vista Social / White label logo setup / White Label section
- support.vistasocial.com — Slack Integration
- support.vistasocial.com — Zapier Integration Overview
- support.vistasocial.com — Make Integration Overview
- support.vistasocial.com — Vista Social API
- support.vistasocial.com — OAuth 2.0
- support.vistasocial.com — MCP Server: Connect Vista Social to your favorite AI tools
- support.vistasocial.com — Vista Social's Available MCP Tools
- support.vistasocial.com — Rate limits (section)
- support.vistasocial.com — Single Sign-on (SSO)
- support.vistasocial.com — Getting started with the Media Library
- support.vistasocial.com — Organizing your media with folders
- support.vistasocial.com — How to bulk upload media
- support.vistasocial.com — Attaching images, videos, and other media to your posts
- support.vistasocial.com — Ideal image sizes and formats / Video specs and guidelines per social network
- support.vistasocial.com — Getting started with Ideas / How to organize Ideas with folders / Ideas as a Content Library
- support.vistasocial.com — How to manage your Labels (Post, Media, Inbox, & Queue)
- support.vistasocial.com — What are the differences between queue labels, post labels, and media labels?
- support.vistasocial.com — How to bulk label posts
- support.vistasocial.com — Content calendar filters / Calendar view options
- support.vistasocial.com — Shared Calendar
- support.vistasocial.com — Plan your Instagram content with the Instagram Planner
- support.vistasocial.com — Facebook / Instagram / TikTok / LinkedIn / Pinterest / YouTube Publishing with Vista Social
- support.vistasocial.com — Instagram Story Publishing / Can I publish multiple Instagram Stories / stickers & links
- support.vistasocial.com — Instagram user tagging / Tagging Instagram Shop Products / Scheduling Instagram collaboration posts
- support.vistasocial.com — How to tag personal LinkedIn profiles on page posts
- support.vistasocial.com — Troubleshooting Instagram failed post errors / Troubleshooting posts
- support.vistasocial.com — Connecting your profiles / How to add, move, or remove social profiles
- support.vistasocial.com — Finding great social media content / Finding RSS feeds for blogs
- support.vistasocial.com — Submitting feature requests to Vista Social
- support.vistasocial.com — Mobile App category; Getting started with Ideas on mobile; TikTok Publishing with Mobile App; Crafting social posts with AI Assistant on mobile

**First-party — marketing (Tier B)**
- vistasocial.com/pricing
- vistasocial.com/social-media-publishing/
- vistasocial.com/social-media-engagement/
- vistasocial.com/social-media-listening/
- vistasocial.com/social-media-analytics/
- vistasocial.com/review-management/
- vistasocial.com/dm-automations/
- vistasocial.com/vista-page/
- vistasocial.com/ai-assistant/
- vistasocial.com/white-label-social-media-management-platform/
- vistasocial.com/enterprise/
- vistasocial.com/multi-location-brands/
- vistasocial.com/creators/
- vistasocial.com/integrations/ and /integrations/mcp/, /integrations/linkedin/, /integrations/tiktok/, /integrations/trustpilot/
- vistasocial.com/extensions/
- vistasocial.com/faq/
- vistasocial.com/usage-policy/
- vistasocial.com/insights/ — 2025-year-in-review; ai-image-and-video-generation; what-is-mcp; mcp-for-agencies; mcp-native-marketer; mcp-prompts; social-inbox-automations; real-time-inbox-moderation; bulk-scheduling; social-media-post-approval-workflow-in-vista-social; shared-calendar-the-ultimate-social-media-content-planner; streamline-content-approvals; efficient-task-management-in-vista-social; organize-and-manage-social-media-post-ideas-with-ideas; creating-and-saving-social-media-hashtags-with-vista-social; utm-tracking-and-url-shortening-for-social-media-marketing; white-label-reporting; white-labeling; gamify-your-employee-advocacy; custom-fields-the-key-to-streamlined-multi-location-content-creation; schedule-collab-posts-on-instagram; how-to-schedule-linkedin-document-carousel-posts; manage-linkedin-personal-profiles-with-vista-social; social-media-industry-benchmark-reports; brand-voice; ai-social-media-assistant; 30-day-content-playbook; tiktok-content-planner-instagram-grid-preview-tool
- signals.vistasocial.com/review-management/, /social-media-analytics/
- apidocs.vistasocial.com
- suggestions.vistasocial.com/changelog

**Third-party analysis (Tier C)**
- g2.com/products/vista-social/ (reviews, pricing, features, competitors)
- capterra.com/p/239366/Vista-Social/ (overview, pricing, reviews)
- getapp.com/marketing-software/a/vista-social/ (+ /integrations/)
- trustradius.com/products/vista-social/pricing
- softwareadvice.com/marketing/vista-social-profile/reviews/
- softwaresuggest.com/vista-social/pricing
- saasworthy.com/product/vista-social/pricing
- research.com/software/reviews/vista-social
- socialchamp.com/blog/vista-social-pricing/
- masterblogging.com/vista-social-pricing/
- turrboo.com/blog/vista-social-pricing
- postplanify.com/vista-social-pricing
- socialrails.com/blog/vista-social-pricing
- checkthat.ai/brands/vista-social/pricing
- hackceleration.com/labs/vista-social-pricing and /labs/review/vista-social
- authencio.com/blog/vista-social-cost-is-it-still-the-cheapest-tool
- socialk.it/en/vs/vistasocial and /en/alternatives/vistasocial
- copywritersnow.com/vista-social-review/
- work-management.org/marketing/vista-social-review/
- socialmediacurve.com/vista-social-review/
- affinco.com/vista-social-review/
- tooliverse.ai/tools/vista-social
- blackbearmedia.io/vista-social-review/
- kripeshadwani.com/vista-social-review/
- bloggingwizard.com/vista-social-review/
- unite.ai/vista-social-review/
- gizory.com/vista-social-review/
- fueler.io/blog/vista-social-review-for-us-agencies
- workflowautomation.net/reviews/vista-social
- mysoftwarecompare.com/reviews/vista-social
- toolessence.com/vista-social-review
- nerdisa.com/vistasocial/
- startupik.com/vista-social-the-social-media-management-platform-explained/
- pangea.app/glossary/vista-social
- grokipedia.com/page/VistaSocial
- crunchbase.com/organization/vista-social
- tracxn.com — Vista Social company profile
- saasclub.io/podcast/vista-social-vitaly-veksler-424/
- zapier.com/apps/vista-social/integrations (+ /mcp/vista-social)
- apps.make.com/vista-social
- viasocket.com/mcp/vista-social
- medium.com/@prachiadmane8 — 7 Social Media Management Tools with MCP Integration in 2026
- onlysocial.io/onlysocial-vs-vistasocial-white-label/
- recurpost.com/compare/recurpost-vs-vista-social/ and /vista-social-alternatives/
- postiv.ai/blog/vista-social-alternatives
- postiz.com/compare/postiz/vista-social

**User reviews (Tier D)**
- trustpilot.com/review/vistasocial.com (and ca.trustpilot.com pages 2–4)
- appsumo.com/products/vista-social/reviews/ and /questions/
- apps.apple.com/us/app/vista-social/id1623203443 (ratings & reviews)
- play.google.com/store/apps/details?id=com.vistasocial.android
- apps.microsoft.com/detail/9nq5v5n0ndzp

---

*End of audit. See §31 for the verification backlog that must be closed before this document informs pricing or contractual decisions.*
