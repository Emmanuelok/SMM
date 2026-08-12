# Vista Social — Deep Module Teardown + Competitive Implementation Analysis

**Research date:** 12 August 2026
**Author:** Research agent (deep-dive #02)
**Purpose:** Reverse-engineer the implementation mechanics of Vista Social's core modules, and map how the closest analogues implement the same modules, so that a new SMM product can be specified to out-build each one module-by-module.

---

## 0. Methodology, evidence quality, and how to read this document

### 0.1 What I could and could not access

**Critical caveat that affects every claim in this document.** In this execution environment, `WebFetch` is blocked by the network egress proxy for **every** domain tested (`vistasocial.com`, `support.vistasocial.com`, `developers.facebook.com`, `developers.tiktok.com`, `g2.com`, `en.wikipedia.org`, `r.jina.ai`, `web.archive.org`). Direct `curl` through the proxy returns `CONNECT tunnel failed, response 403`. The proxy README explicitly instructs not to route around organization egress denials.

Consequently **all evidence below is derived from `WebSearch`**, which returns result titles, URLs, and a synthesized answer generated from the underlying page bodies. I used a technique that materially improves fidelity: **domain-scoped search** (`allowed_domains: ["support.vistasocial.com"]`) with queries phrased as the article's own subject matter. This causes the search layer to summarize content from that domain's help-center articles specifically, which functions as an approximate fetch. It is good but lossy: **exact tables were frequently summarized rather than reproduced verbatim**, and numbers occasionally conflict between sources.

**Therefore:** every quantitative claim is tagged with a confidence marker.

| Marker | Meaning |
|---|---|
| **[DOC]** | Sourced from a Vista Social help-center article via domain-scoped search. High confidence on substance, medium on exact numerals. |
| **[DOC-CONFLICT]** | Two sources disagree. Both values given. Must be re-verified against the live product. |
| **[3P]** | Third-party review site / competitor blog. Medium confidence; these sites are frequently SEO spam with hallucinated numbers. |
| **[PLATFORM]** | Platform API documentation or credible developer write-up (Meta, TikTok, LinkedIn/Microsoft Learn, Google). High confidence. |
| **[INFERRED]** | My reasoning from the above, not directly stated by any source. |
| **UNVERIFIED** | I could not confirm this. Explicitly flagged rather than guessed. |

### 0.2 What is genuinely unknowable from outside

Some things the brief asks for **cannot** be established without a live paid account, network inspection, or an NDA conversation. I flag these rather than fabricate:

- Vista Social's internal job scheduler architecture (retry counts, backoff curves, dead-letter behavior on publish failure).
- Whether their transcoder is FFmpeg-based, and its exact ladder.
- The precise identity of their listening data vendor(s).
- Exact trial→paid conversion rates, email cadence bodies, and in-app paywall triggers.
- Their per-metric deprecation runbook.

For each of these I give the strongest available inference plus the specific probe that would settle it.

### 0.3 Reading order for a product team

- **§1–§2**: what the product is and what it costs (the commercial envelope that constrains everything).
- **§3–§5**: publishing, scheduling, permissions — the three modules where implementation detail creates the most defensible differentiation.
- **§6–§9**: approvals, inbox, listening, reporting — where the hard platform-API ceilings live.
- **§10–§13**: AI layer, adjacent modules, onboarding, monetization.
- **§14**: known bugs and limitations.
- **§15–§17**: the analogues, module by module, then cross-tool matrices.
- **§18**: the platform-API reality table — the shared physics every vendor operates under.
- **§19–§20**: gaps nobody covers, and the concrete out-build spec.

---

## 1. Vista Social: product surface map

Vista Social is a self-serve, SMB-and-small-agency social media management suite. Positioning is "everything included, cheap," in explicit contrast to Hootsuite/Sprout's per-seat enterprise pricing. **[3P]** reports it passed 30,000+ customers in 2026 and is ranked #1 Easiest to Use on G2 in 2026 with a 4.8/5 across ~1,071 reviews; Capterra 4.9 across ~890 reviews; Trustpilot 4.1 across ~62 reviews.

The module inventory, as evidenced by the help-center's category structure:

| Module | Sub-capabilities observed in docs |
|---|---|
| **Publishing & Scheduling** | Composer, per-network customization, publishing queues, evergreen auto-repurposing, bulk publishing (CSV/RSS/Bing News/IG hashtag/IG user/media), Smart Publishing, calendar, shared calendars, labels, ideas, notes, multi-time scheduling, post repurposing, publishing safety |
| **Media** | Media library, labels, bulk upload, Canva app integration, stock search (Unsplash/Pexels/GIFs), AI image generation, AI video generation (rolling out), auto padding/resizing, video transcoding, thumbnail/cover customization |
| **Engagement (Social Inbox)** | Unified inbox (comments, messages, mentions, reviews, shares, IG collab invites), saved replies, labels, sentiment adjustment, spam reporting, team conversations, inbox automations, DM automations, review automations, AI replies |
| **Reviews** | Review monitoring across several review networks, reply where API permits, AI review responses, Review Performance report |
| **Listening** | Owned-profile listeners (free) and external listeners (paid add-on), trend listeners, sentiment, competitive analysis |
| **Analytics/Reports** | Profile Performance, Post Performance, Competitor Analysis, Sentiment Analysis, Paid Performance, Industry Benchmark, Listener Performance, Review Performance, Tasks Performance, Inbox Response Performance, cross-channel roll-ups; Report Builder; scheduled PDF/CSV; interactive shareable report links; white-label branding |
| **Collaboration** | Profile groups, user groups, team members, roles, approval workflows (single & multi-step), tasks, notifications (email/in-app/browser/Slack) |
| **Vista Page** | Link-in-bio microsite; import from Linktree/Buffer Start Page/Bitly |
| **Employee Advocacy** | Advocacy program, advocate dashboard, admin dashboard, leaderboard, earned media value, advocacy analytics, Slack notifications |
| **AI layer** | AI Assistant (captions, replies, review responses), brand voice, AI Training & Knowledge, Ask Vista, Smart Publishing with AI, AI image/video generation |
| **Integrations / platform** | Vista Social API (+ premium add-on endpoints), OAuth 2.0 with PKCE, MCP server (~60 tools), Zapier, Make, n8n, Slack, Canva, Google Calendar/ICS |
| **Agency / white label** | Custom-domain white labeling (dashboard, shared calendars, report links), logo replacement, branded emails, custom short-link domain, profile connect links for clients |

**Strategic read:** the surface area is very wide for the price. The competitive weakness is therefore *not* feature coverage — it is **depth and discoverability**. Multiple **[3P]** reviews independently converge on this: "the breadth of features works against discoverability… new users routinely miss capabilities because they are not surfaced where you would look."

---

## 2. Commercial envelope: pricing, gating, add-ons

### 2.1 Plan table (as of 2026)

**[3P] / [DOC-CONFLICT]** — third-party pricing pages disagree on seat and profile counts. Both readings are shown. This *must* be re-verified on `vistasocial.com/pricing`.

| Plan | Monthly (USD) | Social profiles | Users | Notable gating |
|---|---|---|---|---|
| **Standard** | $39 | 8 | 1 | Planning & publishing, media tools, engagement tools, AI assistant, mobile app, reports, Vista Page, employee advocacy (basic) |
| **Professional** | $79 | 15 | 5 | + bulk scheduling, content finders, report scheduling, pro collaboration, listening tools, review management. AI credits **500/mo** |
| **Advanced** | $149 | 30 | **10** or **6** *(sources conflict)* | + advanced scheduling, advanced workflows, advanced reporting, Zapier & Make, advanced Vista Page. AI credits **1,000/mo**. One source claims "unlimited AI assistant" at this tier — conflicts with the 1,000-credit claim |
| **Scale** | $379 | 70 | 10 | Agency tier: white-label setup, client profile-connect links, **unlimited AI credits** |
| **Enterprise** | Custom | Custom | Custom | Custom contracts, account manager (also the route for extended historical backfill) |

- **Annual billing:** −20% on every tier. **[3P]**
- **Trial:** 14 days, **no credit card required**, full feature access. **[DOC]**

### 2.2 Add-ons

| Add-on | Price | Notes |
|---|---|---|
| Extra user seats | **$3.75/user/month** **[3P]** | Notably cheap; this is the anti-Hootsuite wedge |
| Extra social profiles | Sold in **blocks of 10**, rate varies by plan **[3P]** | Exact block price UNVERIFIED |
| **External social listening** | **~$75/month per listener** **[3P]** (one source says $79) | Listening confined to *your own* connected profiles is free; listening across social/web/news is the paid add-on |
| **X (Twitter) integration** | **$29/month** **[3P]** | This is a direct pass-through of X's 2026 API economics (see §18.5). Everyone will have to do this |
| **Employee Advocacy** | Free with **3 advocates**; from **$199/month for 25 employees** **[3P]** | |
| **API add-on** | Price not published; contact sales **[DOC]** | Required for n8n (direct API calls) and for custom API calls; **not** required for standard Zapier/Make usage |
| **Custom domain white-labeling** | Add-on **[DOC]** | Covers dashboard, shared calendars, report links |
| AI image generation credits | Add-on packs **[DOC]** | Monthly credits by plan |

**Read for our build:** Vista Social's pricing is a *land-grab* structure — cheap base, cheap seats, and the genuinely expensive upstream costs (X API, listening data, AI inference) pushed into metered add-ons. This is the correct structure and we should copy it. The specific arbitrage they have found: **seats at $3.75 vs Hootsuite's ~$99/seat-equivalent** is the single loudest reason SMB agencies switch.

---

## 3. Publishing pipeline — implementation detail

This is the module with the most implementation-specific behavior, and where most competitor differentiation is actually won or lost.

### 3.1 The auto-publish vs. mobile-reminder split

Vista Social's model, from **[DOC]**:

- **Auto-publish** = the post is published by Vista's backend at the scheduled time via the network's official API. No human step.
- **Notification reminder** = at scheduled time, a push notification is delivered to *a specific registered mobile device* (yours or a nominated team member's) and/or email; the human opens the Vista Social mobile app, which hands the pre-composed media + caption to the native app for manual publishing.

Two implementation details that matter and that most competitors handle worse:

1. **Reminder targets are *devices*, not users.** There is a `Settings` flow for "add or remove mobile devices for reminder notifications." **[DOC]** This means a post can be routed to a named phone. That is the right data model (a `reminder_device_id` on the post), and it is what makes agency delegation of manual posting workable.
2. **Reminders and auto-publish co-exist per content type on the same network.** TikTok image carousels are documented as working "both with auto publishing & notification reminder publishing," while a separate doc states carousels require the mobile app because auto-publishing is unavailable. **[DOC-CONFLICT]** — this is almost certainly a **stale-doc artifact from TikTok's photo-post API maturing during 2025–2026**, and is a live example of the doc-drift problem (see §14.4).

#### Publishing-mode matrix (best reconstruction)

**[DOC] + [PLATFORM] + [INFERRED]**. Cells marked ✱ are inferred from platform API capability rather than a Vista doc statement.

| Network / profile type | Single image | Carousel / multi-image | Video | Reel / Short | Story | Notes |
|---|---|---|---|---|---|---|
| **Facebook Page** | Auto | Auto (link-based carousel, ≤5 cards) | Auto | Auto (Reels) | Auto (Facebook Story Scheduling doc exists) | Carousel is built via the link/ad-style carousel mechanism because FB has no native organic multi-image carousel composer API **[DOC]** |
| **Facebook Group** | Auto ✱ | ✱ | ✱ | ✱ | n/a | Group connection is documented; capability depth UNVERIFIED |
| **Instagram Business** | Auto | Auto (mixed image+video supported) | Auto | Auto (direct Reels publishing, explicitly "no notifications, workarounds, or hacks") | **Auto — Business profiles only**, and **without** stickers/links/polls/music | Story with any interactive element ⇒ reminder only **[DOC]** |
| **Instagram Creator** | Auto | Auto | Auto | Auto | **Not auto** (docs say Story auto-posting is Business-profile-only) | **[DOC]** |
| **Instagram Personal** | Reminder only | Reminder only | Reminder only | Reminder only | Reminder only | Meta API does not serve personal accounts |
| **TikTok** (Business / Creator) | n/a alone | Photo carousel (≤10 items via Vista) | Auto | Auto | n/a | Vista caps carousel at **10** items where TikTok native allows **35** **[DOC]** |
| **X (Twitter)** | Auto | Auto (≤4) | Auto | n/a | n/a | Requires the **$29/mo X add-on** in 2026 |
| **LinkedIn Page** | Auto | Auto (≤20 images) | Auto | ✱ | n/a | **No true LinkedIn document/PDF carousel via 3rd-party tools** — docs explicitly say carousels are "only limited on Instagram and Threads" **[DOC]** |
| **LinkedIn Personal** | Auto | Auto | Auto | ✱ | n/a | Personal profile posting supported |
| **Pinterest** | Auto (1 image) | n/a | Auto | n/a (Idea Pins UNVERIFIED) | n/a | Board selection + boost config are per-network fields **[DOC]** |
| **YouTube** | n/a | n/a | Auto | Auto (Shorts: <60s, 9:16 / 0.56) | n/a | Requires channel to have **Intermediate/Advanced features enabled** (i.e., phone verification) — a documented onboarding trap **[DOC]** |
| **Google Business Profile** | Auto (**only first image published**) | Not supported | ✱ | n/a | n/a | Post types: **standard / event / offer / alert**; CTA button supported **[DOC]** |
| **Reddit** | Auto (1 image) | n/a | ✱ | n/a | n/a | 40,000-char body limit **[DOC]** |
| **Tumblr** | Auto (≤10) | Auto | ✱ | n/a | n/a | |
| **Threads** | Auto (≤20) | Auto (carousel supported) | Auto (≤10 videos) | n/a | n/a | Platform caps at 250 posts/24h **[PLATFORM]** |
| **Bluesky** | Auto (≤4) | Auto | ✱ | n/a | n/a | Dedicated "Troubleshooting Bluesky failed post errors" doc exists — implies real-world flakiness |
| **Snapchat** (Business Public Profile) | ✱ | ✱ | ✱ | ✱ (Spotlight UNVERIFIED) | ✱ | Connection documented; publishing depth UNVERIFIED |
| **Custom profiles** | Manual | Manual | Manual | Manual | Manual | "Custom channels" let you plan/collaborate/schedule for unsupported networks; publication is human **[DOC]** |

**Gap to exploit #1:** *Nobody* auto-publishes Instagram Stories **with** link stickers, polls, question stickers, or music, because Meta does not expose them. This is a permanent constraint. The differentiator is not solving it — it's **making the reminder path not feel like a downgrade**. See §20.2.

### 3.2 Media count limits per post

**[DOC]** — this table came through cleanly and is the highest-confidence numeric set in the document.

| Network | Max images / post | Max videos / post |
|---|---|---|
| Facebook | **50** | 1 |
| LinkedIn | **20** | 1 |
| Threads | **20** | **10** |
| Instagram | **10** | **10** |
| Tumblr | 10 | 1 |
| TikTok | 10 (carousel, Vista cap) | 1 |
| X (Twitter) | 4 | 1 |
| Bluesky | 4 | 1 |
| Pinterest | 1 | 1 |
| Reddit | 1 | 1 |
| Google Business | **only the first image is published** | 1 |

Note the odd one: **Facebook 50 images** is a Vista/Graph-API artifact (multi-photo post), not a carousel. The Facebook *carousel* path is a separate, link-based ≤5-card mechanism.

### 3.3 Character limits

**[DOC]**, partial. Only Reddit's number surfaced cleanly (**40,000 characters**). Vista maintains a dedicated "Character limits for each social network" article. The rest of the per-network numbers are **UNVERIFIED** from this research pass — but they are simply the platform limits (X 280/25,000 for premium, IG 2,200, LinkedIn 3,000, FB 63,206, TikTok 2,200/4,000, Threads 500, Bluesky 300, Pinterest 500, GBP 1,500, YouTube description 5,000) and any implementation should read them from a config table, not hardcode.

**Implementation note worth stealing:** Vista surfaces the counter *per network tab* inside the composer, so a cross-posted draft shows separate remaining-character counts. That is the correct UX; several competitors show only the shortest limit and truncate.

### 3.4 Video specifications & the transcoding pipeline

Vista maintains two dedicated articles: "Video specs and guidelines per social network" and "Video Processing with Vista Social." **[DOC]**

**Stated pipeline behavior:**

> "Each network requires videos to meet precise technical specifications, which means some processing on our end is necessary… In some cases, this processing may result in a slight reduction in video quality."

Concretely documented for Instagram:

- Auto-converts to **MP4 container, H.264 (or HEVC) video, AAC audio, progressive scan**, with corrected **frame rate and bitrate**.
- **Trims** video to fit duration limits (feed ≤60s; Reels ≤15 min).
- **Resizes** if the video exceeds max dimensions. **[DOC-CONFLICT]**: one source says max **1920×1080**, another says **1920×1920**. The 1920×1080 figure is quoted in an Instagram *image*-failure context; 1920×1920 in a video context. Treat as: images ≤1920×1080, video long-edge ≤1920.
- **Auto padding and resizing** is a named feature with its own article — Vista will letterbox/pillarbox a video to fit Instagram's accepted aspect band rather than reject it.

**Instagram accepted specs as Vista enforces them [DOC]:**

| Property | Value |
|---|---|
| Container | MOV or MP4 (MPEG-4 Part 14), **no edit lists**, **moov atom at front** |
| Audio codec | AAC, ≤48 kHz sample rate, 1–2 channels |
| Video codec | HEVC or H.264, **progressive scan, closed GOP, 4:2:0 chroma subsampling** |
| Frame rate | 23–60 FPS |
| Feed video duration | ≤60 s |
| Reels duration | ≤15 min |
| Feed video aspect ratio | 4:5 (0.8) or 16:9 (1.7777…) |
| Reels aspect ratio | 0.01:1 to 10:1 accepted; **9:16 recommended** to avoid crop/pad |
| Image aspect ratio | 4:5 → 1.91:1 |
| Image formats | JPG, PNG, WebP, HEIC |
| YouTube Shorts | <60 s, 9:16 (0.56) |

**What this tells us about their architecture [INFERRED]:**

- "moov atom at front" + "no edit lists" + "closed GOP" + "progressive scan" is verbatim Meta's documented requirement set. Vista is running a **faststart remux + conditional re-encode**, almost certainly **FFmpeg** (`-movflags +faststart`, `-c:v libx264 -profile:v high -pix_fmt yuv420p -g <fps*2> -sc_threshold 0`).
- "May result in a slight reduction in video quality" indicates they **always re-encode** rather than probing and passing through compliant files. That is a real quality regression and a **named user complaint vector**.
- Padding/resizing implies an `scale`+`pad` filtergraph with a background fill.
- **UNVERIFIED:** whether transcoding is synchronous at upload or deferred to publish time. The existence of `2207001 / 2207082` "media upload failed" errors *at publish time*, with the documented remedy "duplicate the post and publish it again," strongly implies **transcode/upload happens at publish time with weak retry**. See §14.1. This is a major exploitable weakness.

### 3.5 Per-network customization fields (the composer's real data model)

**[DOC]** — from "Customization options during post scheduling" and "How do I use custom post fields?"

| Network | Documented per-network fields |
|---|---|
| **Facebook** | Separate caption editor; enable/disable comments; **"Publish as image"** (strips link preview, posts text+image); **audience targeting** by country, relationship status, gender, age; boost configuration |
| **Instagram** | Separate media customization (different media per network); location tag; user tags (public profiles only); **product tags**; **collaborator tags**; first comment; Reels cover/thumbnail |
| **LinkedIn** | Separate caption editor; personal-profile tagging on Page posts (only if the person **follows the Page**) |
| **Pinterest** | Board selection; boost config |
| **YouTube** | **Post comment automation**; **first like automation**; privacy status (public/private/unlisted); embeddable flag; **subscriber notification** flag; **made-for-kids** flag; custom thumbnail |
| **TikTok** | Enable/disable **comments**, **duets**, **stitches** |
| **Google Business** | Post type (standard/event/offer/alert); event title, start/end date+time; offer details; **CTA button** |
| **X** | Thread posts supported (multi-tweet composer) |
| **All** | **Custom post fields** — dynamic tokens (URLs, locations, websites) resolved per social profile, so one post yields per-location variants |

**Two features here are genuinely good and under-copied:**

1. **Custom post fields / dynamic tokens.** One draft, N profiles, per-profile substitution of URL/location/phone. This is the multi-location franchise killer feature. Only a handful of tools (Statusbrew, Sprout at enterprise, Rallio) do this well.
2. **YouTube "first like" and "post comment" automation.** Auto-posting the pinned first comment and self-liking on publish. Small, but it's the kind of operational detail that wins demos.

### 3.6 Tagging, geotagging, and metadata support

| Capability | Vista Social status | Platform ceiling **[PLATFORM]** |
|---|---|---|
| **Instagram alt text** | **UNVERIFIED** — no Vista doc surfaced. Meta's API *does* support `alt_text` on images and Reels | Supported on images and Reels; **not** on carousels-as-a-whole (per-child only) |
| **Instagram location / geotag** | Supported **[DOC]** | `location_id` from Pages search |
| **Instagram user tagging** | Supported; **public profiles only** — tagging a private account fails **[DOC]** | `user_tags` supported on images, Reels, and carousel **image** children only (not video children) |
| **Instagram product tagging** | Supported: **≤5 products per media item, ≤20 per carousel post** **[DOC]** | Requires an approved IG Shopping catalog; Vista has a dedicated "How to solve issues with product tagging" troubleshooting article ⇒ it breaks often |
| **Instagram collaborator tags** | Supported **[DOC]** | **Max 3 collaborators**; supported on Reels, images, carousels; **not on Stories** |
| **Instagram Reels cover/thumbnail** | Supported ("How to customize your video thumbnail or cover") **[DOC]** | `cover_url`, recommended 1080×1920 (9:16); non-9:16 gets middle-cropped; grid shows center-cropped 1080×1080 |
| **Instagram music / audio** | **Not available via API** | Meta does not expose the audio library to third parties. Reminder-publish only |
| **Instagram Story stickers / link / poll / question / GIF** | **Not available for auto-publish**; reminder path only **[DOC]** | Meta does not expose Story interactive layers |
| **TikTok sounds / stickers / polls / Q&A** | **Not available** | "The API can't apply TikTok's native sound library, stickers, polls, or Q&A features" **[PLATFORM]** |
| **LinkedIn personal-profile tagging on Page posts** | Supported **but only if the person already follows the Page** **[DOC]** | LinkedIn API restriction |
| **Facebook audience targeting** | Supported (country, relationship status, gender, age) **[DOC]** | Organic Page post targeting |
| **YouTube custom thumbnail** | Supported **[DOC]** | Requires verified channel |
| **Polls** | "How to create and share polls in Vista Social" exists **[DOC]** — network coverage UNVERIFIED (likely LinkedIn + X) | |

**Gap to exploit #2: alt text.** I found **no Vista Social documentation for alt text on any network**, despite Meta exposing `alt_text` and LinkedIn exposing alt text on images. If that holds on inspection, it is a real accessibility gap and an easy, high-credibility differentiator (WCAG/ADA is a live procurement question for public-sector and enterprise buyers). **Probe:** open the Vista composer with an IG profile attached and look for an alt-text field on the media tile.

### 3.7 Publishing safety, daily caps, and duplicate rules

| Rule | Value | Source |
|---|---|---|
| **Vista's own daily post cap** | **25 posts / day / profile**, on a **rolling 24-hour** basis (each successful post frees its slot exactly 24h later) | **[DOC]** |
| **Instagram cap enforced by Vista** | **50 posts / 24h** per IG profile | **[DOC]** |
| **Instagram cap per Meta (2026)** | **100 API-published posts / 24h moving window**, all types | **[PLATFORM]** |
| **X duplicate content** | Identical/substantially-similar content **cannot be scheduled within 72 hours** of each other | **[DOC]** |
| **Threads** | 250 posts / 24h per profile; replies exempt | **[PLATFORM]** |
| **TikTok** | Content Posting API: **6 requests/min per user token**; ~**15–25 videos/day per account**, shared across *all* API clients | **[PLATFORM]** |
| **Publishing Safety feature** | "Manage how posts are published across your profile groups" — a profile-group-level control surface | **[DOC]**, exact controls UNVERIFIED |

**Note the discrepancy:** Vista enforces 50/24h for Instagram while Meta now permits 100. That is a conservative, stale guardrail. Also note Vista's *own* 25/day/profile cap is **below** Facebook's own recommendation ceiling — Vista chose to hard-cap at Facebook's "don't exceed" advisory and apply it to every network. For high-volume clients (news, e-commerce, multi-location), **this is a hard blocker they cannot configure around**, and it is a concrete switching trigger.

**Gap to exploit #3:** make the daily cap a **configurable, per-profile, per-network policy object** with an override + audit log, not a global constant.

### 3.8 Link handling

**[DOC]** — "Link previews explained":

- Vista auto-extracts the first link and fetches **image, page title, description** (OG scrape).
- **Facebook will not generate link previews for `facebook.com` links** posted from third-party tools.
- The **"Publish as image"** Facebook option exists precisely to escape a bad/absent link preview by converting to text+image.
- Link shortening is built in, with a **custom-domain white-label shortener** add-on.

**[INFERRED]** They run their own OG-scraper with a cache. The failure mode to watch: sites behind Cloudflare bot protection produce empty previews. A better build fetches with a real UA + falls back to oEmbed + allows manual preview override (title/description/image), which Vista appears to support only partially.

---

## 4. Scheduling engine semantics

### 4.1 Publishing Queues (time-slot model)

**[DOC]** — "Publishing Queues: What are they / How to set them up":

- A **Publishing Queue** is a set of **predefined time slots** for any day of the week.
- Posts dropped into the queue are auto-assigned to the next open slot.
- **Queue labels** act as *categories*: "By labeling your publishing queues based on topics or time slots, you can easily organize and schedule your posts… content for weekdays or weekends, specific campaigns, types of content."

**Critical architectural distinction vs. SocialBee:** Vista's categories are **labels on queues**, whereas SocialBee's categories are **first-class content buckets each owning its own schedule**. Vista's model is *slot-first*; SocialBee's is *category-first*.

Concretely:
- **Vista:** define slots → tag slots with a label → posts flow into matching slots.
- **SocialBee:** define a category ("Tips", "Blog", "Promo") → attach a posting schedule to the category → drop content into the category → it cycles.

The SocialBee model is materially better for evergreen-heavy, always-on content operations because **the content-mix ratio is expressed declaratively** (3 Tips : 2 Blog : 1 Promo per week emerges from the schedules). Vista's model requires the operator to hand-maintain the mix.

**Gap to exploit #4:** implement **both** — slot-first for campaign work, category-first with declarative content-mix ratios for always-on. Nobody ships both cleanly.

### 4.2 Evergreen Auto-Repurposing

**[DOC]** — the most precisely documented scheduling feature:

| Parameter | Value |
|---|---|
| Max reuses per evergreen post | **25** |
| Minimum interval between reuses | **3 days** |
| Maximum interval | **100 days** |
| Requirement | **Evergreen slots must exist in the queue** — evergreen posts do not publish randomly |
| Expiry | Post has an expiration date; reuse stops at limit OR expiry |
| Guidance | Timeless content only (tips, testimonials, blog links, FAQs); explicitly warns against time-sensitive content |

This is a solid implementation. Two weaknesses:

1. **No automatic performance-based selection.** Reuse order appears to be queue order, not "re-share the top-performing 20% more often." SocialBee, MeetEdgar, and Publer are all in the same boat. **Nobody does performance-weighted evergreen recycling.**
2. **No content-freshness decay.** A post recycled 25 times over 2 years has no mechanism to flag "this link is now 404" or "this stat is stale."

**Gap to exploit #5:** *Evergreen with a health check* — before each recycle, re-validate outbound links (HTTP status), re-check media availability, and score the post's last-N-publication engagement against the profile median; auto-pause below threshold and notify.

### 4.3 Optimal Time Suggestions

**[DOC]:** "Optimal time suggestions are based on your post performance data from your **last 90 posts**."

That is a **post-count window, not a time window** — meaning a low-volume account's "optimal times" may be computed from posts spanning a year, and a high-volume account's from a week. It also means **the model is engagement-of-your-own-posts, not audience-online-activity**, which conflates *when you happened to post* with *when your audience is active* (a classic selection-bias trap: you only have data for hours you already post in).

Compare:
- **Metricool** shows *audience-activity heatmaps per platform*, plus large-N industry studies (2026 Instagram study; TikTok study over 2M+ posts / 92k+ accounts). **[3P]**
- **Sprout** and **Buffer** publish large-N benchmark studies and blend them with account data.
- Vista's MCP exposes `Get optimal publishing times` described as "based on historical **audience activity**" — which **contradicts** the help doc's "last 90 posts." **[DOC-CONFLICT]** Likely they use follower-online-time where the API provides it (Facebook/Instagram `online_followers`) and fall back to own-post performance.

**Gap to exploit #6:** a defensible best-time model = **(a)** platform-provided audience-online signal where available, **(b)** own-post engagement with **exposure-corrected** modeling (inverse-propensity weighting on posting hour to remove the selection bias), **(c)** a cold-start prior from a large industry corpus segmented by vertical + follower band, and **(d)** explicit uncertainty display. Every competitor ships (b) naively or (c) as a blog post. Nobody ships (a)+(b)+(c)+(d).

### 4.4 Bulk publishing and Smart Publishing

**[DOC]:**

Bulk publishing has **six** input paths:
1. CSV upload
2. Import from a blog (RSS)
3. Import latest news (**Bing News**)
4. Import from **Instagram hashtags**
5. Import from **Instagram users**
6. Import images/videos directly

**CSV rules:**
- **Up to 100 posts per CSV file**, unlimited number of uploads.
- Required columns first; **remaining columns optional and order-independent as long as headings match exactly**.
- Must export as **CSV UTF-8 (Comma-delimited)** to preserve special characters.

**Smart Publishing (RSS automation):**
- Pulls **Title**, **Link**, **Description** from the feed.
- **On first connection, only imports articles published within the last 72 hours.** — This is a well-chosen guard against an RSS feed dumping 500 historical items into a queue. Steal this.
- "Smart Publishing with AI" is a newer article ⇒ AI rewriting of feed items into captions.

**Gap:** IG hashtag/user import is legally and technically fragile (Meta's hashtag search API is heavily rate-limited: 30 unique hashtags per 7 days per user, and returns only recent public media). **UNVERIFIED** whether Vista is using the official `ig_hashtag_search` endpoint or scraping. If scraping, it's a compliance liability.

### 4.5 Timezone model — a real architectural weakness

**[DOC]:** Timezone is set **at the Profile Group level** (`Settings → Profile Groups → Edit → timezone`). The MCP tool `Update profile group settings` confirms timezone is a profile-group attribute.

Report timezone is separately selectable and "affects how all dates and data ranges are displayed across the entire report." **[DOC]**

**Why this is a weakness for global teams:**

| Problem | Consequence |
|---|---|
| Timezone lives on the **profile group**, not the **social profile** | A group containing a US and a UK page cannot have per-page local scheduling. You must split into separate groups, which fragments reporting and permissions. |
| No **per-user display timezone** surfaced | A Manila-based scheduler working on a New York client's group sees NY times. Workable, but there is no "show me both" affordance. |
| No **per-post timezone override** | You cannot say "publish at 9am *local to each profile*" across a multi-region rollout. |
| **DST handling UNVERIFIED** | If slots are stored as wall-clock + IANA zone, DST is handled; if stored as UTC offsets, twice a year everything shifts an hour. No doc addresses this. **Probe:** set a queue slot for 9:00am in a DST-observing zone, and check the computed publish time for a date on the other side of the DST boundary. |

**Gap to exploit #7 (high value, low effort):** model time as `(local_wall_clock, IANA_tz)` resolved at fire time, allow the timezone source to be **profile-level with group-level default**, add a **"publish at local time per profile"** mode, and render every time in the composer with an inline "…which is 14:00 for you / 09:00 for the profile" dual display. This is a two-week feature that wins every global-team evaluation.

### 4.6 Pause rules, holidays, blackout dates

**[DOC]**, and this is a genuine hole:

- There **is** a "Social Events and Holidays Calendar" that can be **enabled** and overlays national/religious/fun-social events on the publishing calendar. It is **informational only** — a planning overlay.
- There is **bulk delete** of posts (`Calendar → list icon → select → delete`).
- I found **no evidence** of:
  - a **pause switch** on a queue or a profile ("hold all scheduled posts");
  - **blackout date ranges** that automatically skip or reschedule posts;
  - a **crisis / kill-switch** that pauses everything account-wide;
  - an **auto-skip** rule (e.g., "don't publish promotional-labeled content during an active blackout").

**Gap to exploit #8 — this is the single biggest missing safety feature in the category.** Every agency has lived through "a scheduled joke post went out during a national tragedy." The build:

- **Global Pause** at account / profile-group / profile / label scope, with a reason and an audit entry.
- **Blackout windows** (date ranges, recurring weekly windows, or holiday-calendar-derived) with per-window policy: `skip`, `defer to next slot`, or `defer to after window`.
- **Label-scoped blackouts** — pause everything labeled `promotional` but let `service-status` through.
- **Crisis mode**: one click pauses publishing *and* switches the inbox to a triage view *and* posts a Slack notice.
- Restore semantics: on unpause, show exactly what was skipped/deferred and offer bulk re-slot.

Agorapulse and Sprout have partial versions of this (Sprout has an approval-gate + pause at enterprise). **Nobody has a good one at SMB price.**

### 4.7 Other scheduling primitives

| Feature | Detail |
|---|---|
| **Multi-time scheduling** | "How to schedule a post to multiple times" — one composition, N scheduled instances **[DOC]** |
| **Post repurposing** | Duplicate + edit a previously published post across one or more profiles **[DOC]** |
| **Labels** | Four separate label namespaces: **Post, Media, Inbox, Queue** **[DOC]**. Post labels drive campaign reporting ("How to run reports by post label for campaigns") |
| **Ideas** | A pre-post artifact; can be created in bulk **[DOC]** |
| **Notes** | Calendar annotations **[DOC]** |
| **Shared Calendar** | Public link with **date range**, **expiration date**, and **password**; used for client review **[DOC]** |
| **External calendar** | Connect/remove **Google Calendar / ICS** feeds (MCP: `Manage external calendar`) **[DOC]** |
| **Calendar export** | PDF or CSV **[DOC]** |
| **Content calendar filters** | Filter by status, profile, label, etc. **[DOC]** |

---

## 5. Permission model

### 5.1 The primitives

**[DOC]** — reconstructed from "Getting started," "How to create profile groups," "How to create and manage user groups," "How many profiles and users can I have," MCP tool descriptions, and the approval docs.

| Primitive | Definition |
|---|---|
| **Profile Group** | A container of connected social profiles. Carries **timezone**, **limits (max users / max profiles / disabled networks)**, **publishing controls**, and **AI feature settings**. Serves as the reporting and content isolation boundary ("so content and reports from different brands do not get mixed up"). |
| **User Group** | A named set of team members. **Can be assigned as an approver in an approval workflow** so you don't add members individually. |
| **Role** | At minimum: **Admin** and **Restricted user**. A **Contributor** role exists whose posts *always* require approval and who **cannot publish directly**. **Profile group admins** and users with **"manage" access to Publishing** can review posts. |
| **Feature access levels** | Evidence of at least a `view / manage` axis per feature area (e.g., "users with **manage** access to Publishing"). |
| **Per-profile-group access** | "When inviting co-workers, clients, or users… you grant them access to specific **profile groups**." |

### 5.2 The critical limitation

**Access is granted at the profile-group level, not the individual-profile level.** **[DOC]** — every doc phrases it as group access.

This means:
- To give a freelancer access to exactly one of a client's five profiles, you must create a **single-profile group** for it — which then fragments reporting, timezone config, and approval workflows.
- There is no evidence of **per-profile permission sets** (e.g., "read-only on the corporate LinkedIn, full publish on the regional Facebook").

Compare **Sprout Social's Multi-Role** **[3P/DOC]**, which is the best-in-class model in this category:

> Multi-Role separates **Organizational Roles** (what you can do across the company: admin capabilities, billing management) from **Profile Permission Sets** (what you can do on specific profiles). Presets exist for common positions (Social Media Manager, Care Admin), plus fully **custom roles**. Profile-level permissions grant **read-only, drafting, or full publishing** rights per profile. There is a **Super Admin** role, and roles can be **driven from SAML assertions** from an IdP.

**Statusbrew** **[3P/DOC]** similarly gates its Rule Engine to **Primary Owner / Owner / Admin** only, with Regular Users excluded — a coarse but explicit capability gate.

### 5.3 Permission-model comparison

| Capability | Vista Social | Sprout Social | Statusbrew | Agorapulse | Planable | Sendible |
|---|---|---|---|---|---|---|
| Role presets | Admin / Restricted / Contributor **[DOC]** | Preset **Organizational Roles** + custom **[DOC]** | Primary Owner / Owner / Admin / Regular **[3P]** | Admin / Editor / Moderator / Guest **[3P]** | Owner/Admin/Contributor/Client/Viewer **[3P]** | Tiered by plan **[3P]** |
| Fully custom roles | **No evidence** | **Yes** | No | No | No | Partial |
| Per-**profile** permission (not group) | **No** — group-scoped | **Yes** (read-only / draft / full publish per profile) | Partial | Partial | Per-workspace | Per-"service" |
| Separation of org-level vs profile-level perms | No | **Yes** (the core Multi-Role idea) | No | No | No | No |
| Groups-as-approvers | **Yes** (User Groups) | Yes | Yes | Limited | Yes (levels) | Yes |
| SSO/SAML role mapping | **UNVERIFIED** | **Yes** (role attribute in SAML assertion) | Enterprise | Enterprise | Enterprise | Enterprise |
| Client/no-login access | **Yes** — shared calendar link w/ password + expiry | Limited | Yes | Yes | **Yes** (best-in-class) | Yes (client dashboards) |
| Client self-connect without a seat | **Yes** — "profile connect link" | No | No | No | No | Partial |

**Two Vista features here are genuinely strong and worth copying:**

1. **Profile connect link** — "How to let external users connect social profiles **without logging in**." A client clicks a link, OAuths their own Facebook/Instagram/etc., and the profile lands in your group. **This removes the single worst step in agency onboarding** (asking a client for credentials or walking them through Business Manager). Sendible/Agorapulse make you invite them as a user.
2. **Profile-group limits object** — max users, max profiles, **disabled networks** per group. This is a genuinely useful multi-tenant guardrail for resellers and it's exposed via MCP.

**Gap to exploit #9:** ship **Sprout's separation** (org role × per-profile permission set) at **Vista's price**, and keep Vista's **profile connect link**. That combination does not exist today.

---

## 6. Approval workflow: states and notification mechanics

### 6.1 States

**[DOC]** — reconstructed from "Submitting posts for approval," "Multi-Step Post Approval," "Post Approvals: How to review posts," "Reviewing and revising posts (internal reviewers)," "Using shared calendars for external/client approvals."

Observed statuses:

| Status | Meaning |
|---|---|
| **Draft** | Not submitted |
| **Pending review** | Submitted, awaiting an approver |
| **In review** | Specifically: scheduled by a **Contributor** and awaiting approval |
| **Rejected** | Submitted then rejected by an admin; returned for edits; **the workflow halts at the rejecting step** |
| **Approved** | All required steps complete |
| **Scheduled** | Approved and queued/timed |
| **Published** | Live |
| **Failed** | Publish attempt errored |

That is roughly **8 states**. Compare **Loomly**, which is unusually explicit **[3P/DOC]**:

- **Standard workflow (2+ approvers):** 7 statuses — Draft, Requires Edits, Pending Approval, Approved, Scheduled, Published, **Canceled**
- **Lite workflow (1 approver):** 6 statuses — drops *Approved*
- **Zero workflow (no approvals):** 4 statuses — Draft, Scheduled, Published, Canceled

Loomly's insight — **the state machine itself is configurable per workspace** — is better product design than Vista's fixed machine. It removes dead UI for teams that don't need approvals.

### 6.2 Workflow topology

**[DOC]:**

- **Single-user approval:** assign directly to a person.
- **Single-step workflow:** one approver **or a group of approvers**; any one approval advances it.
- **Multi-step workflow:** approvers in a **specified order**; approval routes automatically to the next step; **"if any step is rejected, the approval process stops, and the post is returned for edits."**
- Configuration lives at `Settings → Publishing Settings → Approval Workflows`; steps are **named**.
- Approver targets can be:
  1. a **specific person/people**,
  2. **admins or publishing managers only**,
  3. **any team member within the profile group** (internal approval),
  4. **viewers of the shared calendar** (external approval).
- **Contributor guardrail:** "All posts created by Contributors are automatically routed through the **default approval workflow** configured by an admin" and "a contributor **cannot send content directly to a client** for approval if an internal review step is required first."

That last constraint is a genuinely well-thought-out rule — it prevents the classic agency failure of a junior emailing a client half-baked copy.

### 6.3 External / client approvals without a login

**[DOC]** — "Using shared calendars for external/client approvals (no login)":

- Generate a **shared calendar link** with:
  - a **date range** filter,
  - an **expiration date**,
  - an optional **password**.
- The external viewer can **approve or reject posts in review and leave a note**.
- Shared calendar links are enumerable (MCP tool: `List shared calendar links` — "the public share links people use to view a filtered slice of your Vista Social publishing calendar").
- With the white-label add-on, the shared calendar sits on **your custom domain**.

This is a strong implementation. **Planable** is the benchmark on client approvals overall, and its differentiator is **per-post threaded commenting with @mentions and version history**, plus **multi-level approvals with named levels where one approver per level suffices** — but Planable gates multi-level approvals to **Enterprise only** **[3P/DOC]**, which is a meaningful commercial opening.

### 6.4 Notification mechanics

**[DOC]** — `Settings → Accounts → Notifications`. Four delivery channels, each individually toggleable per event type:

| Channel | Detail |
|---|---|
| **Email** | Standard |
| **In-platform** | Dashboard **Notification Center** (dedicated doc) |
| **Browser push** | Web Push; explicitly "get alerts for when your posts fail **or if there is a post for review** even when you are not at the Vista Social Dashboard" |
| **Slack** | Via **incoming webhooks**; "you can create one or multiple webhooks, depending on how many Slack channels you want" |
| **Mobile push** | Separately, **registered mobile devices** receive reminder-publish notifications |

Event types evidenced: **post failed**, **post pending review**, **post reminder**, **advocacy notifications** (Slack).

**Weaknesses [INFERRED]:**
- Slack is **webhook-only**, not a Slack **app** — so there is no interactive "Approve / Reject" button in Slack, no thread-back, no deep-link auth. Every approval requires leaving Slack.
- No **Microsoft Teams** connector surfaced. For enterprise/regulated buyers, Teams > Slack.
- No **escalation / SLA** on approvals ("if not approved in 4h, notify the group admin").
- No **digest** mode ("one 9am email with everything awaiting you").

**Gap to exploit #10:** a real **Slack/Teams app** with interactive approve/reject/comment actions, per-channel routing rules, SLA escalation, and digest batching. This alone converts agencies whose clients live in Slack.

---

## 7. Social inbox: the data model and its hard ceilings

### 7.1 Item types

**[DOC]** — from MCP tool descriptions (`List inbox items`) the inbox is a polymorphic collection of:

`comments | messages | mentions | reviews | shares | Instagram collab invites`

Per-item operations exposed (both in UI and MCP): **label, star, complete, report spam, reply, adjust sentiment**, assign, and **team conversations** (internal threaded discussion attached to an inbox item).

Filter axes: **sender, label, sentiment, status**.

Derived reports: **Inbox response performance** (response time, action rate, community management performance) and **Inbox stats** (counts by type/profile/status).

### 7.2 Sync model — the most important operational fact

| Property | Value | Source |
|---|---|---|
| **Meta networks (Facebook, Instagram) + TikTok** | **Real-time** (webhook-driven) | **[DOC]** |
| **All other networks** | Polled — **inbox updates every 6–7 hours** | **[DOC]** |
| **Daily sync cap** | **500 messages + comments per profile per day** | **[DOC]** |
| Daily sync cap on **LTD / free** accounts | **150 per profile per day** | **[DOC]** |
| **Historical cutoff** | Comments on posts **older than ~60 days from your first connection date** cannot be fetched — "most social networks' APIs do not allow us to fetch that data" | **[DOC]** |
| **Message deletion** | **Not supported** — "most social networks do not allow third-party tools to delete messages on a user's behalf" | **[DOC]** |

**The 6–7 hour polling interval for non-Meta networks is a serious competitive weakness.** A LinkedIn comment or a YouTube comment can sit unseen for most of a business day. Agorapulse and Statusbrew poll materially faster on the same APIs (**UNVERIFIED** exact intervals, but their positioning is real-time-ish community management).

**The 500/day cap is a hard blocker for any account with real volume.** A mid-size consumer brand blows through 500 comments/day on a single viral Reel. When the cap is hit, the implication is silent data loss or deferral — **UNVERIFIED** which. This is a **must-probe**: does Vista queue the overflow and catch up, or drop it?

### 7.3 Per-network engagement support matrix

**[DOC]** — Vista maintains "Which engagements does Vista Social support for each network?" with a full table. The domain-scoped search returned the prose but **not the full table**; here is the reconstruction, with platform-API reasoning filling gaps. Cells marked ✱ are **[INFERRED]** from platform capability.

| Network | Comments | DMs / Messages | Mentions | Reviews | Shares | Ad comments | Notes |
|---|---|---|---|---|---|---|---|
| **Facebook Page** | ✅ real-time | ✅ real-time | ✅ | ✅ (Page recommendations) | ✅ | ✱ UNVERIFIED | Full Meta webhook coverage |
| **Instagram** | ✅ real-time | ✅ real-time | ✅ (mentions + tags) | n/a | n/a | ✱ | Requires account owner to **enable message access** in IG settings; also requires the IG account linked to a Page/Business portfolio |
| **TikTok** | ✅ real-time | ✅ (DM automations exist) | ✱ | n/a | n/a | n/a | **TikTok's API does not support comment-based automation triggers** — DM keyword triggers only **[DOC]** |
| **LinkedIn** | ✅ | ❌ **Not possible** | ✅ | n/a | ✱ | ✱ | "LinkedIn only allows Vista Social to sync **comments and mentions**… private messages (DMs) are **not accessible** through LinkedIn's API" **[DOC]** |
| **X (Twitter)** | ✅ (replies) | ✱ (DMs — depends on API tier) | ✅ | n/a | ✱ | n/a | Gated behind the $29/mo X add-on; economics in §18.5 |
| **YouTube** | ✅ | n/a | ✱ | n/a | n/a | n/a | Quota-bound (§18.4) |
| **Google Business Profile** | ✅ (Q&A ✱) | ✱ (GBP messaging) | n/a | ✅ **reply supported** | n/a | n/a | |
| **Pinterest** | ✱ | n/a | ✱ | n/a | n/a | n/a | |
| **Threads** | ✱ | n/a | ✱ | n/a | n/a | n/a | Threads API exposes replies |
| **Bluesky** | ✱ | ✱ | ✱ | n/a | n/a | n/a | |
| **Trustpilot** | n/a | n/a | n/a | ✅ **monitor only** | n/a | n/a | **Cannot reply** **[DOC]** |
| **Yelp** | n/a | n/a | n/a | ✅ **monitor only** | n/a | n/a | **Cannot reply** **[DOC]** |
| **TripAdvisor** | n/a | n/a | n/a | ✅ **monitor only** | n/a | n/a | **Cannot reply** **[DOC]** |
| **OpenTable** | n/a | n/a | n/a | ✅ **monitor only** | n/a | n/a | **Cannot reply**; has its own report definitions doc **[DOC]** |

**Review reply support is narrow: Google Business Profile and Facebook only.** **[DOC]** Everything else is read-only. This is a platform constraint, not a Vista failure — Yelp and TripAdvisor do not expose reply APIs to general third parties.

### 7.4 The hard platform ceilings (what is genuinely impossible)

This is the section the brief specifically asked for. **[PLATFORM]** throughout.

#### Instagram Direct Messages

| Constraint | Detail |
|---|---|
| **24-hour window** | After a user messages you, you have **24 hours** to send unlimited replies including promotional. Each new user message resets it. Triggers that open a window: sending a DM, **commenting on your post**, **replying to your Story**. |
| **Human Agent tag** | Extends the window to **7 days** from the user's last message, for genuine support cases. Applied automatically when a human agent in a shared inbox sends outside the 24h window. |
| **Private replies to comments** | **750 per hour** |
| **Automated message volume** | Reported cap of **~200/hour per account** **[3P — treat as approximate]** |
| **No exceptions** | "Meta's Instagram Graph API enforces the 24-hour window universally. No exceptions for verified accounts or special tiers." |
| **Access gate** | Account owner must toggle "Allow access to messages" in Instagram; otherwise Vista shows "The account owner has disabled access to Instagram Direct Messages" **[DOC]** |

**Product implication:** a compliant inbox **must** show a live countdown of the messaging window per conversation, and must distinguish "can send anything" / "human-agent window, support content only" / "closed — only a template/re-engagement path." **Vista does not appear to surface this.** That is Gap #11 and it is a *safety* feature — sending outside the window gets the message rejected and, at scale, risks app-level enforcement.

#### LinkedIn

| Constraint | Detail |
|---|---|
| **No DM/messaging API** | "None of the documented permissions provide generic direct messaging capabilities." Third-party tools **cannot** read or send LinkedIn DMs. Any tool claiming otherwise is either using an unsanctioned scraping path (ban risk for the user's account) or a "Sales Navigator"-adjacent grey product. |
| **Community Management API access** | Not open to individuals. Requires: a **registered legal organization**, a **verified LinkedIn Page**, a **two-tier app review**, and a **screencast** demonstration. Commercial use cases only. |
| **Two tiers** | **Development tier** (default, restricted call volumes/capabilities) → must apply for **Standard tier** within **12 months** or access is revoked for inactivity. Standard has no invocation restrictions. |
| **Restricted use cases** | Data **cannot** be used in a "social feed use case" (e.g., embedding a LinkedIn feed on a website/intranet). Member data cannot be used for **advertising, sales, or recruiting** — including CRM enrichment, audience lists, ad targeting, ABM, or mass messaging. |
| **Personal-profile tagging** | Only possible if the person **follows the Page** **[DOC]** |

**This is the single largest structural moat in the category.** Getting Community Management API Standard tier is a months-long process. Any new entrant must budget for it early, and should treat "we have LinkedIn Standard tier" as a marketing claim.

#### TikTok

| Constraint | Detail |
|---|---|
| **Content Posting API** | **6 requests/minute per user token**; effective **~15–25 videos/day per account**, and that budget is **shared across every API client** the user has connected. So a creator using two tools halves each tool's headroom. |
| **Display API** (read) | **600 requests/minute per endpoint** — user info, video list, video query |
| **No comment automation triggers** | "TikTok's API does not currently support comment-based triggers" **[DOC]** — you can trigger automations on **DM keywords** only |
| **Not exposable** | Native **sound library**, **stickers**, **polls**, **Q&A** are app-only |
| **Research API** | Closed to commercial use. "Commercial platforms using Research API access for content discovery must migrate to commercial API endpoints or a licensed third-party data provider. Attempting to use Research API credentials for commercial use cases now risks losing access entirely." |
| **Listening** | **No open keyword search across TikTok for third parties.** Vendors can access mentions of a brand's **own** TikTok Business handle only. Sprinklr's TikTok video mentions are capped at **1,000 video mentions per brand account.** |

#### YouTube

| Operation | Quota cost (2026) |
|---|---|
| Default daily allocation | **10,000 units/day** for most endpoints |
| `search.list` | **100 calls/day** default (separate bucket) |
| `videos.insert` | Was ~**1,600 units** → cut to ~**100 units** on **4 Dec 2025**; since **1 June 2026** it bills to its **own dedicated bucket of ~100 calls/day** rather than the shared 10,000 pool |
| `commentThreads.insert` | **50 units** |

**Implication:** YouTube comment *ingestion* at scale is the expensive part. `commentThreads.list` is 1 unit, so polling is cheap, but a multi-thousand-channel tool will still need quota-extension approval (a formal Google **Quota and Compliance Audit**). The upload-quota change in June 2026 is genuinely good news and means **YouTube video scheduling is now cheap** — worth building deeply.

#### X (Twitter) — 2026 economics

| Item | Detail |
|---|---|
| **Model change** | As of **6 February 2026**, X replaced tiered pricing with **pay-per-use as the default** |
| **Write** | **$0.015 per post created**; **$0.20 if the post contains a link** |
| **Read** | **$0.005 per post read**, hard-capped at **2,000,000 reads/month** (≈ $10,000/mo at cap) |
| **Above the cap** | Enterprise contract required, **~$42,000+/month** |
| **Legacy tiers** | Basic $200/mo, Pro $5,000/mo, Enterprise $42k+ — **closed to new signups**, grandfathered only; **Basic subscribers auto-migrating to pay-per-use since June 2026** |
| **Free tier** | **Discontinued** |

**This explains Vista's $29/month X add-on exactly.** At $0.015/post, $29/mo covers ~1,900 posts (or ~145 link-posts) plus a small read budget. **Any competitor must price X as a metered pass-through or lose money.** The $0.20 link-post surcharge is brutal for SMM tools specifically, because link posts are the dominant business use case.

**Gap to exploit #12:** transparent, in-product **X cost metering** — show the user "this month you've used $6.40 of your $29 X budget; link posts cost 13× more." Nobody does this and it turns a hated surcharge into a trust-building feature.

#### Threads

- **250 posts / 24h per profile**; replies exempt.
- **No native scheduling** in the API — every tool builds its own queue + cron.
- **GIFs and Stories not supported** via API.
- **Quote-posting not exposed.**

#### Pinterest / Reddit / Bluesky

- **Pinterest:** new accounts reportedly need a **~2-week warm-up** of manual posting before third-party API posting works reliably **[3P]**. Worth surfacing as onboarding guidance.
- **Reddit:** Data API is **free only for non-commercial** use; a commercial agreement is **not self-serve**. Any listening product that indexes Reddit at scale needs a negotiated deal. **[3P]**
- **Bluesky:** open AT Protocol, cheap. Vista has a dedicated failed-post troubleshooting doc, implying real-world instability.

### 7.5 Inbox / DM automations

**[DOC]** — Vista ships a real automation builder:

| Element | Detail |
|---|---|
| **Triggers** | `New Direct Message`, `New Comment` |
| **Matching** | Keyword match **or AI-based intent** ("understands the intent behind a message instead of matching exact words, e.g. detecting when someone is looking for recommendations") |
| **Actions** | Send DM (incl. link/coupon), **dynamic AI reply with a custom system prompt**, hide comment, delete comment, label, assign, collect data |
| **Multi-message** | "Instagram Automations: How to Send More Than One Message" — sequenced sends |
| **Data collection** | "Data Collection with DM Automations" — captures fields (email etc.) into a record |
| **Templates** | "Ready-to-Go Templates: Auto-DM links for comments" |
| **Compliance** | Dedicated article: "Are Vista Social's DM & comment automations officially approved by Meta?" — answer: yes, via Meta-approved channels |
| **Network coverage** | Instagram + Facebook (comment + DM triggers); **TikTok DM-keyword triggers only**; **Google Reviews auto-reply** |

This is a **ManyChat-lite embedded in an SMM tool**, and it is one of Vista's genuinely strong, hard-to-match modules. The AI-intent matching (vs. keyword-only) is ahead of most SMM competitors and roughly at parity with dedicated DM-automation tools.

---

## 8. Listening: implementation reality

### 8.1 Two distinct products under one name

**[DOC]** — this distinction is commercially critical and Vista communicates it poorly:

| Type | What it covers | Cost |
|---|---|---|
| **Owned/profile listeners** | Conversations **on your own connected profiles** — i.e., mentions, comments, tags on accounts you control | **Free**, included on paid plans |
| **External listeners** | Keyword monitoring **across social, web, blogs, and news** beyond your profiles | **~$75/month per listener** add-on **[3P]** |

Listener configuration: select the profiles to include, name the listener, define **included keywords** and **excluded keywords**, and select **sources**. **[DOC]**

### 8.2 Sources

**[DOC]** — named explicitly: **Reddit, X, Threads** as the high-signal sources ("often highlight unfiltered customer opinions… valuable for insights from communities beyond official brand pages"). Trend insights are aggregated across **X (Twitter) Trends, X News, YouTube most-popular, and Google Trends**.

Also present: **Trend listeners** — "Creates a persistent trend listener that monitors a topic, brand, or vertical across the **trend pipeline**" (MCP tool). Separate from keyword listeners.

### 8.3 Quota model

**[DOC]:** "External listeners use a **daily result quota** that resets on a **24-hour rolling window**, starting from the time the listener was created. **Once the quota is reached, no additional results will be pulled** until the window resets."

The exact quota number is **UNVERIFIED**. This is a hard-capped, per-listener metering model — sensible given upstream data costs, but it means **a listener on a spiking topic goes blind mid-spike**, which is exactly when you need it. That is a real product failure mode.

### 8.4 Is it first-party API, licensed firehose, or scraping?

**No source states this.** Here is the strongest available inference:

**[INFERRED] — most likely a hybrid:**

| Source | Almost certainly | Reasoning |
|---|---|---|
| **Own profiles** | First-party API (Meta webhooks, TikTok, LinkedIn CMA, YouTube) | Consistent with the real-time/6–7h split documented for the inbox |
| **X** | **Paid X API, metered** | The existence of a separate **$29/mo X integration add-on** and a **per-listener daily result quota** is exactly what pay-per-read economics ($0.005/read) forces. A licensed firehose (Brandwatch-class) would not need a per-listener daily cap. |
| **Reddit** | Reddit Data API under some agreement, or a third-party aggregator | Reddit's commercial terms are not self-serve; a $75/mo listener cannot fund a Reddit enterprise contract alone, so more likely a shared aggregator |
| **News / blogs / web** | **A third-party aggregator/vendor** (Bing News is already used for bulk publishing, so a Bing/news-API relationship exists) | "Import latest news (via **Bing News**)" is documented for Smart Publishing — the same pipe likely feeds listening |
| **Instagram / Facebook non-owned** | **Very limited or absent** | Meta does not sell public IG/FB content broadly; Brandwatch's ~200k non-owned FB Pages / ~720k non-owned IG accounts is a *licensed, enumerated panel*, not open search. A $75/mo product cannot include that. |
| **TikTok non-owned** | **Absent** | TikTok offers no commercial keyword search. Full stop. |

**The honest conclusion:** Vista Social's external listening is **a keyword-metered, quota-capped aggregation over X + Reddit + Threads + news/web**, with **no meaningful Instagram, Facebook, or TikTok non-owned coverage**. Anyone marketing it as "social listening" in the Brandwatch sense is overselling by an order of magnitude.

**Probe to settle it:** create an external listener with a distinctive term, post that term from a *non-connected* Instagram account and a *non-connected* TikTok account, and see whether either appears. My prediction: neither does.

### 8.5 Coverage benchmark against real listening platforms

| Platform | X coverage | Meta non-owned | TikTok | Web/news | History | Price signal |
|---|---|---|---|---|---|---|
| **Vista Social** | Metered API **[INFERRED]** | ~none | own-handle only | Yes (aggregator) | **60-day backfill** | **$75/listener/mo** |
| **Brandwatch** | **Full X firehose** | ~200k non-owned FB Pages, ~720k non-owned IG accounts; public IG for new queries back to **Feb 2025** | Limited | Extensive | Multi-year | $$$$ (enterprise) |
| **Talkwalker** | Licensed | Panel-based | Limited | **150M+ web sources, 30+ social networks, 187 languages** | **Up to 5 years** | $$$$ |
| **Sprinklr** | **Official firehose (X, Reddit, Tumblr)** + compliant FB/IG | Yes | **TikTok video mentions capped at 1,000 per brand account** | Extensive | **Back to 2010** | $$$$$ |
| **Sprout Social** | API-based | Core networks | Yes (limited) | Moderate | Moderate | $$$ (listening is an add-on) |
| **Meltwater / Mention / Brand24 / Awario** | Mixed licensed + API | Limited | Limited | Yes | Varies | $$ |

**Structural truth for anyone building here:** as of Feb 2026, **X killed cheap firehose economics** (pay-per-use, 2M read/month cap, Enterprise above that). Reddit's commercial API is negotiated. TikTok's keyword search is closed to commercial. **Therefore, credible broad listening in 2026 requires either (a) a data vendor contract in the low six figures, or (b) an honest, narrow scope.**

**Gap to exploit #13:** Don't compete on breadth. Compete on **honesty + depth on the sources you can actually get**. Specifically:
- Publish a **coverage matrix** in-product that states, per source, exactly what is and isn't covered and why. Nobody does this; everyone is vague, and buyers get burned.
- Go **deep on Reddit** (structured: subreddit, flair, score trajectory, OP karma, thread position) — Reddit is the highest-intent B2B/consumer-research source and every generalist tool treats it as flat text.
- Go **deep on owned-channel listening** — competitor *owned* profiles are fully accessible via public APIs; "track my 5 competitors' every post, comment sentiment, and posting cadence" is buildable to a high standard, and Vista's Competitor Analysis report is shallow.
- **Never hard-blind a listener mid-spike.** Degrade gracefully (sample + extrapolate + flag) instead of stopping.

---

## 9. Reporting internals

### 9.1 Report catalog

**[DOC]:**

| Report | Notes |
|---|---|
| **Profile Performance** (aka Social Media Performance) | Core per-profile metrics |
| **Post Performance** | Per-post metrics; filterable **by post label** for campaign reporting |
| **Cross-channel** | Roll-up across networks with normalized metrics |
| **Competitor Analysis** | |
| **Sentiment Analysis** | Has its own report **and** a separate "Sentiment Analysis" concept doc |
| **Paid Performance** | Ads metrics (impressions/reach/engagement defined in paid terms) |
| **Industry Benchmark** | Peer comparison |
| **Listener Performance** | Listening output metrics |
| **Review Performance** | |
| **Tasks Performance** | Assigned vs completed, **average first touch**, **average task time** per owner |
| **Inbox Response Performance** | Response time, **action rate**, community management performance |
| Per-network definition docs | Instagram, Facebook Page, Google Business, Reddit, OpenTable each have dedicated "report definitions" articles |

**Delivery:** PDF, CSV, **interactive shareable report links**; **Report Builder** for section customization, branding, cover page; **scheduled reports** weekly / monthly / one-time custom range to email recipients; report-level **timezone selector** that "affects how all dates and data ranges are displayed across the entire report." **[DOC]**

### 9.2 Metric definitions

**[DOC]** — cross-channel definitions:

| Metric | Vista's definition |
|---|---|
| **Impressions** | How many times content was shown. **"Views are included under the impressions metric in cross-channel reports."** |
| **Reach** | Unique users who saw the content |
| **Engagement** | Likes, comments, shares, reactions; **"total number of paid and organic interactions (likes, comments, clicks, etc.)"** |
| **Engagement rate** | **Engagement ÷ Impressions** |

**Two things to flag hard:**

1. **"Views are included under impressions"** is a *normalization decision*, and it is the correct pragmatic response to Meta's 2024–2025 migration from `impressions` to `views` as the primary metric — but it means **Vista's "impressions" is not comparable to native Instagram Insights.** They own this with a dedicated article: *"Why your data in Vista Social might differ from your native analytics."*
2. **Engagement rate is computed on impressions**, not on followers or reach. This is the *defensible* denominator but it is **not** what most agencies report to clients (who usually want ER by reach or by followers). There is no evidence of a **configurable denominator**. That is a small but very frequently requested feature.

Also documented: *"Why is my engagement in Post Performance and Profile Performance reports different?"* — i.e., the same word means two different aggregations in two reports. That is a data-model smell and a recurring support burden.

### 9.3 Data retention and backfill — a genuinely good policy

**[DOC]:**

| Property | Value |
|---|---|
| **Historical backfill on connect** | **60 days**, on all plans, **where the platform API supports it** |
| **Extended backfill** | Available **on request via your account manager**, "up to each platform's maximum limit" |
| **Retention going forward** | **No data-retention limits.** "You can access your data from the day your profile is connected to Vista Social and forward, regardless of how long ago you want to look back." |
| **Instagram caveat** | Backfill depends on **when the account was converted** to Business/Creator |
| **Audience metrics caveat** | Follower counts and similar are "often limited or **not backfillable** due to API restrictions" |
| **Trial/downgrade** | Account data retained for a **30-day grace period** after trial without upgrade |

**"No retention limits" is a real competitive weapon** — Hootsuite and Sprout historically gate history windows by plan. Vista's policy is: we snapshot daily from connect-date forward and never expire it. **Copy this exactly and say so loudly.**

### 9.4 Metric deprecation handling

**UNVERIFIED — and this is the single weakest-evidenced area of the whole research pass.**

What I can establish:
- Vista maintains per-network "report definitions" articles that are clearly updated over time.
- They maintain a "Why your data might differ from native analytics" article.
- They quietly rolled `views` into `impressions` (a deprecation-driven normalization).

What I **cannot** establish:
- Whether historical series are **backfilled/restated** when a platform deprecates a metric, or whether the series simply goes flat/null at the cutover date.
- Whether there is an in-product **annotation** on charts marking "Meta deprecated this metric on <date>."
- Whether deprecated metrics are removed from the Report Builder or left as zeros.

**[INFERRED]** Based on how every tool in this category behaves: **the series goes null and no annotation appears.** This is the #1 silent trust-killer in social analytics — a client sees a chart drop to zero in May 2026 and assumes the agency stopped working.

**Gap to exploit #14 — "metric provenance," and I believe it is the strongest unclaimed differentiator in reporting:**

- Every metric carries a **lineage record**: source API + endpoint + field name + collection timestamp + transformation applied.
- Charts render **change annotations** inline: "Meta deprecated `impressions` for IG on 2025-04-21; from this date forward this series uses `views`."
- **Discontinuity markers** and an explicit `comparable: true/false` flag on any period-over-period comparison spanning a definition change.
- A **"why does this differ from native?"** drill-down on every tile, auto-generated from the lineage record — not a static help article.
- **Restatement policy** published: when a platform backfills corrected numbers, we restate and log it.

No competitor does any of this. It is cheap to build if designed in from day one and nearly impossible to retrofit.

---

## 10. AI, automation, and the programmable surface

### 10.1 AI features

**[DOC]:**

| Feature | Detail |
|---|---|
| **AI Assistant — captions** | Prompt-to-caption in the composer, on web and mobile |
| **AI Assistant — inbox replies** | Reply generation for messages/comments |
| **AI Assistant — review replies** | Dedicated review-response generation |
| **Brand voice** | Per-**profile-group** brand voice policy ("Edit Policy"); used by both caption generation and inbox replies |
| **AI Training & Knowledge** | "Teach Vista Social's AI everything it needs to know about your brand" — RAG-style knowledge base; feeds brand-aware replies |
| **AI image generation** | Live for all users; consumes **monthly credits by plan** (500 Professional / 1,000 Advanced / unlimited Scale); add-on packs available |
| **AI video generation** | Rolling out in 2026 |
| **Smart Publishing with AI** | AI rewriting of RSS/feed items into captions |
| **Ask Vista** | "AI-powered command center for social media" — natural-language operation of the product |
| **AI sentiment** | Sentiment scoring on inbox items, adjustable by humans |
| **AI intent matching** | In DM automations, intent-based rather than keyword-based triggering |

**Known weakness [3P]:** "The AI feature needs improvement. It sometimes suggests hashtags that are not related to the content." Hashtag generation quality is a repeated complaint.

### 10.2 MCP server — the most revealing artifact

**[DOC]:** Vista Social ships an **MCP server with ~60 tools** (one source says 50+, the help doc says 60), spanning: *publishing & scheduling, reports & analytics, inbox & community management, tasks & workflows, accounts/profiles/teams, Vista Pages, trends & social listening, shared calendars, help & documentation, utilities.*

Named tools observed (this is effectively their internal API surface, published):

| Domain | Tools |
|---|---|
| Users/teams | `List users`, `Get current user identity`, `Get team member` (profile groups, roles, permissions), `Invite/update team member` |
| Profile groups | `Update profile group settings` (name, **timezone**, **limits: max users / max profiles / disabled networks**, **publishing controls**, **AI features**) |
| Publishing | `Create or update a post` (multi-profile), `Delete post(s)`, `Get post by id`, `Get optimal publishing times` |
| Queues | `List scheduling queues and their time slots for a profile` |
| Media | `Find media (library or external)` — searches media library **and stock (Unsplash, Pexels, GIFs)** |
| Calendars | `Manage external calendar` (Google Calendar / ICS), `List shared calendar links` |
| Inbox | `List inbox items` (comments, messages, mentions, reviews, shares, **IG collab invites**), browse with filters (sender, label, sentiment, status), `label / star / complete / report spam / reply / adjust sentiment` |
| Reports | `Get inbox response performance`, `Get inbox stats`, `Get daily profile metrics` (daily follower, reach, impression, engagement totals for a profile or profile group across a date range) |
| Listening | `Create a persistent trends listener`, `Update trend listener` (keywords, regions, sources, pause/resume, delete), topic metrics & messages |
| Tasks | `List tasks` (status, assignee, due date, profile group), `Update task fields` |
| Vista Pages | `Get Vista Pages`, `Import Vista Page` (from **Linktree, Buffer Start Page, Bitly**) |
| Help | `Ask Vista Social help` — grounded in the official help center |

**Two high-value intelligence extractions from this:**

1. **`Get daily profile metrics` returns "daily follower, reach, impression, and engagement totals."** That confirms the analytics store is a **daily-grain fact table keyed by profile**, not an event store. That in turn explains the "no retention limits" policy (daily rollups are cheap) *and* why intraday analysis is impossible.
2. **`Update trend listener` accepts "keywords, **regions**, sources, pause/resume."** Regions is a listener dimension. And note **listeners can be paused but posts/queues apparently cannot** — reinforcing Gap #8.

### 10.3 API and integrations

**[DOC]:**

| Item | Detail |
|---|---|
| **Vista Social API** | Read + write: profile analytics, post data; create posts, **ideas**, **notes**; upload media |
| **Premium endpoints** (require API add-on) | Create profile groups, fetch **daily profile metrics**, access **post metrics** |
| **Auth** | **OAuth 2.0 Authorization Code flow with PKCE**; plus simple API keys for Zapier/Make found at `Settings → Account Settings → Integrations` |
| **Rate limit** | **60 requests/minute** (= 3,600/hour). Response header **`x-vs-rate-limit-remaining`** |
| **Enforcement** | **Violate more than 10 times in an hour → your key is deactivated.** |
| **Zapier** | Standard endpoints free; **premium Zapier endpoints require the add-on** |
| **Make** | Same |
| **n8n** | **Always requires the API add-on** (uses direct API calls) |
| **Slack** | Incoming webhooks (not an interactive app) |
| **Canva** | Vista Social app inside Canva |
| **Google Calendar / ICS** | External calendar feeds into the content calendar |

The **"10 violations/hour → key deactivated"** policy is unusually punitive and will bite anyone building a serious integration. A better design: 429 with `Retry-After`, exponential penalty, and a self-serve reactivation.

---

## 11. Adjacent modules

### 11.1 Vista Page (link-in-bio)

**[DOC]:** A bio-link microsite usable in IG/TikTok/LinkedIn bios, email signatures, etc. Notable: **`Import Vista Page`** can import an existing link-in-bio from **Linktree, Buffer Start Page, or Bitly**. That is a well-designed switching-cost demolisher and should be copied verbatim (import from Linktree/Beacons/Stan/Later Linkin.bio).

Advanced-plan gating: "advanced Vista Page features" **[3P]** — specifics UNVERIFIED.

### 11.2 Employee Advocacy

**[DOC]:**

| Component | Detail |
|---|---|
| Admin dashboard | Advocacy **metrics**, **content**, **advocate activity**, **leaderboard** |
| Leaderboard | Ranks advocates by **reposts, shares, engagement, or earned media value (EMV)** |
| Advocate dashboard | Employee-facing feed of shareable content |
| Content creation | "Create a new advocacy post — generate content for employees to repost, like, or comment on" |
| Notifications | **Slack notifications for Employee Advocacy** |
| Analytics | Dedicated Employee Advocacy Analytics |
| Pricing | Free with 3 advocates; from **$199/mo for 25 employees** **[3P]** |

That EMV appears as a first-class leaderboard metric is notable — it's the metric advocacy buyers actually report upward.

### 11.3 Reviews

Covered in §7.3. Additional: **AI review responses**, **Review Performance report**, **review automations** (auto-reply to Google Reviews). Reply capability limited to **Google Business Profile and Facebook**.

### 11.4 Tasks

**[DOC]:** Three task types — **General task**, **Sales lead**, **Support issue** — assignable to users, with due dates, statuses, and profile-group scoping. **Tasks Performance report** measures assigned/completed, **average first touch**, and **average task time** per owner.

The *typed* tasks (lead vs. support vs. general) is a nice touch: it lets the inbox function as a lightweight CRM/helpdesk triage without a separate tool.

### 11.5 Discover / trends / boosting / Canva

- **Discover** — content-finding feature **[DOC]**.
- **Trend listeners** — persistent topic monitors across a "trend pipeline"; aggregate **X Trends, X News, YouTube most-popular, Google Trends**.
- **Boosting posts** — Facebook/Instagram/Pinterest boost configuration from within the composer **[DOC]**. This is real: schedule a post *and* its boost budget in one action.
- **Canva app integration** — Vista Social app inside Canva, so designs push directly into the media library **[DOC]**.
- **Media labels** and **bulk media upload** **[DOC]**.

### 11.6 Mobile app

**[DOC]:** iOS + Android. Capabilities: schedule and review posts, add media from device or royalty-free stock search, receive and act on **reminder-publish push notifications**, manage **inbox** with conversation-status filters and engagement-type indicators, craft posts with AI Assistant.

**Known weakness [3P], stated repeatedly:** "the mobile app exists but doesn't always match the speed, UI quality, or feature depth of the desktop version."

Given that the *entire* reminder-publish path (all Instagram Stories with stickers, personal IG profiles, some TikTok formats) runs through the mobile app, **mobile quality is not a nice-to-have — it is load-bearing infrastructure.** A competitor with an excellent mobile reminder-publish flow beats Vista on the exact workflows Vista pushes users into.

---

## 12. Onboarding funnel and time-to-first-value

### 12.1 The documented onboarding sequence

**[DOC]** — "Getting started with Vista Social" lays out an explicit, ordered path, and the dashboard renders an **"Initial setup guide"** widget:

1. **Verify email** — click the link sent to the inbox. *(Blocking step.)*
2. **Land on dashboard** with the **Initial setup guide** visible.
3. **Create a profile group** (or use the default) — content and reports are isolated per group.
4. **Connect social profiles** — click "Connect social profiles" in the Initial setup guide, choose a network, complete OAuth.
5. **Add team members** — `Settings → Team Members → Add team member`; First name, Last name, Email; assign **role** (admin or restricted user).
6. **Enable notifications** — `Settings → Accounts → Notifications`; toggle per channel (email / in-app / browser / Slack). The docs call this out as *"highly recommend… before you get started creating content."*
7. **Schedule your first post.**
8. **Check your Inbox.**
9. **Review analytics.**

Dashboard layout after connection **[3P]**: guides/resources across the top, connected profiles on the left, recent + scheduled posts in the middle, activities/alerts on the right.

### 12.2 Reconstructed first-10-minutes timeline

**[INFERRED]** from the above, with realistic friction estimates:

| Minute | What actually happens | Friction |
|---|---|---|
| 0:00–0:30 | Land on `vistasocial.com/pricing` or `get.vistasocial.com/tryfree`. Choose plan (Professional / Advanced / Scale trialable). Enter email + password. **No credit card.** | Low. The no-CC trial is the single best conversion decision they've made. |
| 0:30–1:30 | **Email verification wall.** Must leave the product, open inbox, click link. | **Highest drop-off point in the entire funnel.** Every minute here is pure leak. |
| 1:30–2:30 | Dashboard + Initial setup guide. Profile group exists by default. | Low |
| 2:30–7:00 | **Connect first profile.** For Facebook/Instagram this means: Facebook login → choose Business Portfolio → choose Pages → grant ~8–12 scopes → return → pick which IG accounts to import. If the user isn't a Page admin, or the IG account isn't Business/Creator, or the Page isn't in a Business Portfolio, this **fails**. | **The dominant time sink.** Vista has *seven or more* dedicated help articles just for connection failure modes: "How do I check if I have admin access to my Facebook page?", "How to check if you have full access to a Facebook business portfolio", "There are no LinkedIn company pages associated with this profile", "How to enable YouTube's Intermediate and Advanced features", "Business Account Not Allowed to Advertise error", "How to allow access to messages in Instagram". **Their own documentation is a confession of how bad this step is.** |
| 7:00–9:00 | Compose first post. Pick profiles, write caption, attach media (device / library / stock / AI-generate), see per-network previews. | Medium — the composer is well-reviewed |
| 9:00–10:00 | Schedule (specific time, next queue slot, or optimal-time suggestion). | Low |
| — | Notifications setup and team invites are step 5–6 in the docs but realistically **skipped** by a solo trial user. | — |

**Time-to-first-value estimate: 7–12 minutes for a smooth Facebook/Instagram connection; 20–40 minutes if any Business Portfolio permission issue exists.**

### 12.3 The two structural weaknesses in their funnel

1. **Email verification before any product value.** There is zero reason to gate the dashboard behind verification. Let them into a sandboxed dashboard immediately; verify before the first *publish*.
2. **First value is gated behind the hardest step in the product** (OAuth). A user cannot see a calendar, a composer preview, or a report until they've survived Meta Business Portfolio.

**Gap to exploit #15 — "value before OAuth."** The build:
- On signup, ask for one thing: a **public handle** (e.g. `@brand` on IG or TikTok).
- Immediately render a **read-only, real-data snapshot** from public data: last 12 posts, posting cadence, engagement-rate estimate, best-performing format, and 3 concrete recommendations.
- *Then* offer connection: "Connect to schedule and get full analytics."
- Additionally offer an **"import your existing schedule"** path (Buffer/Later/Hootsuite CSV, plus Linktree import for the bio page) so the first calendar the user sees is *already full of their content*.

This converts the funnel from "do 6 minutes of IT admin, then maybe see value" to "see value in 30 seconds, then do the admin because you now want to."

### 12.4 Onboarding assists Vista does ship

- **Profile connect link** — send a client a link; they OAuth their own profiles without a Vista account. **[DOC]** Removes the credential-sharing conversation entirely. Excellent.
- **Invite users specifically to connect profiles** — a role-scoped invite whose only purpose is connection. **[DOC]**
- **Zapier-automated onboarding for resellers** — "How to resell Vista Social & automate onboarding with Zapier." **[DOC]**
- **Personalized video overviews / demo** offered pre-trial **[3P]**.
- **`Ask Vista Social help`** exposed as an MCP tool and presumably in-product — an LLM grounded on the help center. **[DOC]**

---

## 13. Trial → paid conversion mechanics

### 13.1 The documented mechanics

**[DOC] / [3P]:**

| Mechanic | Detail | Assessment |
|---|---|---|
| **14-day trial, no credit card** | Full feature access on Professional / Advanced / Scale | Maximizes top-of-funnel; sacrifices auto-conversion |
| **Plan selected at signup** | You pick the plan you're trialing | Anchors the price early; sets up the prorated charge |
| **Auto-charge at trial end** | "Once the 14-day trial ends, you'll be charged a **prorated** amount automatically based on the plan you selected" | **This is the key mechanic and it is in tension with "no credit card."** Resolution **[INFERRED]**: no card is needed to *start*, but a card must be added during the trial to continue; the prorated charge fires on the card once added. Otherwise the account downgrades. **UNVERIFIED — must be confirmed.** |
| **Cancel anytime during the 14 days** | Avoids the charge | |
| **One trial per account, ever** | "Once your trial ends and you downgrade, you won't be able to start a new trial afterward." | Strong scarcity mechanic. Removes serial-trialing. |
| **Trial-up during a subscription** | A separate article: "Can I trial higher plans during an active subscription?" | An **upsell** trial path — genuinely smart. Lets a Professional customer test Advanced/Scale features without commitment. |
| **30-day data grace period** | Account data retained 30 days after a trial ends without upgrade | Reduces the "I lost my work" objection and enables win-back |
| **Annual −20%** | Offered at any time during or after trial | |
| **Coupon ecosystem** | Third-party sites push "10% off" codes **[3P]** | Suggests an affiliate/partner program |
| **LTD (lifetime deal) cohort** | Referenced in the docs as a distinct plan class with **150 messages/profile/day** inbox cap vs 500 | Confirms an AppSumo-style LTD history — a large, low-value, high-support-cost cohort they now rate-limit separately |

### 13.2 What the design tells us

- **No-CC + one-trial-ever + auto-charge-on-card** is a coherent strategy: maximize signups, then convert with a hard deadline and no second chances.
- **"Trial higher plans during an active subscription"** is the underrated one. Expansion revenue in this category comes almost entirely from **profile-count growth** and **agency features (white label)**, and letting a customer trial Scale removes the main blocker to a 2.5× ACV jump ($149 → $379).
- **The 30-day grace period** is a win-back asset. **[INFERRED]** they almost certainly run a lapsed-trial email sequence against it.

### 13.3 What I could not verify

- The **email sequence** during trial (cadence, content, triggers) — **UNVERIFIED**.
- **In-app paywall triggers** (which actions prompt an upgrade modal) — **UNVERIFIED**.
- **Actual trial→paid conversion rate** — **UNVERIFIED**. For reference, self-serve B2B SaaS with no-CC trials typically converts 8–15%; with-CC trials 40–60% but with far lower trial starts.
- Whether they run **usage-based upgrade nudges** (e.g., "you're at 7 of 8 profiles").

### 13.4 Gap to exploit #16 — conversion mechanics we should beat

1. **Convert on the artifact, not the deadline.** The highest-converting moment in an SMM trial is *the first client-ready report*. Build the trial so the user produces a branded PDF report by day 3, and make that report the upgrade surface ("share this with your client — add your logo on Advanced").
2. **Value-metric alignment.** Vista charges by profiles + seats. Agencies grow by *clients*. Price on **client workspaces** with generous profiles/seats inside each, so the pricing metric matches the customer's growth metric.
3. **Reverse-trial instead of trial-then-downgrade.** Start everyone on the top plan; at day 14 they drop to a genuinely usable free tier (à la Metricool's permanent free: 1 brand, 50 posts/mo, 30 days analytics, competitor tracking, link-in-bio, AI copy). Vista has **no permanent free plan** — Metricool and Buffer both do, and both use it as a massive top-of-funnel and a win-back reservoir. **This is a real strategic hole in Vista's model.**
4. **Migration-assisted trials.** "Paste your Hootsuite/Later export" → we rebuild your calendar. Switching cost is the #1 reason people stay on tools they dislike.

---

## 14. Known bugs, limitations, and user-reported failures

### 14.1 Publishing failures (documented by Vista itself)

The existence and volume of Vista's own troubleshooting articles is the best available signal of real-world failure rates. Dedicated articles exist for: **Instagram**, **Facebook**, **X**, and **Bluesky** failed-post errors, plus IG-specific error-code articles.

| Failure | Detail | Vista's documented remedy |
|---|---|---|
| **IG error 2207001 / 2207082** | "Media upload has failed" — Instagram server-side issue during post submission | **"Duplicate the post and publish it again."** ← *A manual retry as the official fix. This means the publish pipeline does not automatically retry transient upstream failures.* |
| **IG image resolution rejection** | Max 1920×1080 for images; higher-res uploads fail | Resize |
| **IG anti-spam trigger** | "We restrict certain activity to protect our community" | Wait / reduce velocity |
| **IG account restricted** | Community-guidelines enforcement | Log into the IG app and follow prompts |
| **IG rate limit** | Vista enforces **50 posts/24h** per IG profile | Wait |
| **IG tagging private accounts** | "Instagram's API does not allow third-party tools to tag or collaborate with **private** accounts" | Ask them to go public |
| **IG product tagging failures** | Dedicated troubleshooting article exists | Catalog/permission checks |
| **Token expiry / revocation** | "When an access token has either expired or been revoked, you simply need to reconnect the profile" | Manual reconnect |
| **Facebook "reduce the amount of data you're asking for"** | Graph API over-fetch on large Pages | Vista-side |
| **"Business Account Not Allowed to Advertise"** | Blocks IG↔FB linking | Meta Business support |
| **X duplicate content** | Same/similar content within 72h is blocked | Vary the copy |
| **Bluesky failed posts** | Dedicated troubleshooting article | Varies |

**The single most damning implementation detail in this entire teardown:** *the documented remedy for a transient Instagram upload failure is for the human to duplicate the post and republish.* That means:
- No automatic retry with backoff on transient 5xx/2207xxx errors.
- No dead-letter queue with automatic re-attempt.
- A post scheduled for 9:00am that hits a transient Meta blip **simply does not publish**, and the user finds out via a failure notification — if they have notifications on.

**Gap to exploit #17 — resilient publish pipeline.** This is unglamorous and it is the highest-value engineering differentiator available:
- Classify errors into **transient** (5xx, 2207001/2207082, rate-limit, timeout) vs. **permanent** (policy violation, invalid media, revoked token).
- **Auto-retry transient** with exponential backoff and jitter, within a user-configurable **acceptable-lateness window** (default e.g. 30 min).
- **Pre-flight validation** at *schedule* time, not publish time: transcode, validate specs, resolve tags, verify token scope, check rate-limit headroom, verify the linked catalog for product tags. Surface every failure while the human is still in the composer.
- **Token health monitoring**: proactively detect tokens nearing expiry (Meta long-lived tokens are 60 days) and nag *before* they break, not after a failed post.
- **Publish-time media pre-staging**: upload media to the network's container endpoint **ahead** of the scheduled time so publish is a cheap, fast finalize call.
- **Visible retry ledger** per post: attempt count, error class, next attempt time.

### 14.2 User-reported bugs **[3P]** (Trustpilot / G2 / Capterra / review roundups)

| Complaint | Notes |
|---|---|
| **Disappearing comments in the inbox** | Consistent with the 500/day sync cap and/or the 60-day fetch cutoff |
| **Duplicate postings** | Consistent with a publish pipeline that lacks proper idempotency keys — a retry that succeeded upstream but failed to record locally would double-post |
| **Cannot block users from within the app** | Platform APIs mostly don't expose block; but Meta does expose `blocked_users` on Pages |
| **Slow loading / glitches at peak usage** | Performance |
| **"Bought at launch, a few things have been buggy since and never fixed"** | Long-tail bug debt; LTD cohort resentment |
| **X access removed** | The 2023–2026 X API pricing upheaval; now a $29/mo add-on |
| **Account cancelled unexpectedly** | Isolated billing complaints |
| **Mobile app not as robust as desktop** | Repeated across sources; load-bearing given reminder-publish |
| **AI hashtag suggestions unrelated to content** | Quality |
| **Workflow automation has limited customization** | Automations are template-shaped, not a general rules engine |
| **"Lacked advanced scheduling — no recurring posts or per-platform posting schedules"** | **Note:** this conflicts with the documented Evergreen feature and queue labels. Likely a **discoverability** failure rather than an absence — which is itself the core criticism. |
| **Discoverability** | "New users routinely miss capabilities because they are not surfaced where you would look" |

### 14.3 Documented hard limitations (not bugs — design/platform ceilings)

| Limitation | Scope |
|---|---|
| 25 posts/day/profile, rolling 24h, **not configurable** | Vista-imposed |
| 500 inbox items/profile/day (150 on LTD/free) | Vista-imposed |
| 6–7 hour inbox polling for non-Meta networks | Vista-imposed |
| 60-day historical backfill (extendable only via account manager) | Vista policy + platform |
| No message deletion | Platform |
| No LinkedIn DMs | Platform |
| No TikTok comment triggers | Platform |
| No IG Story stickers/links/polls/music on auto-publish | Platform |
| No TikTok sounds/stickers/polls via API | Platform |
| No review replies outside GBP + Facebook | Platform |
| GBP publishes only the first image | Platform |
| TikTok carousel capped at 10 (native 35) | Vista-imposed |
| No true LinkedIn document/PDF carousel | Platform + Vista |
| Timezone at profile-group level only | Vista architecture |
| No pause / blackout / crisis kill-switch | **Missing feature** |
| No per-profile permissions | Vista architecture |
| Slack is webhook-only, no interactive approvals | Vista architecture |
| No permanent free plan | Vista commercial |

### 14.4 Documentation drift as a signal

I encountered at least three **[DOC-CONFLICT]** cases within Vista's own help center:
- TikTok carousels: "works with auto publishing & notification reminder" vs. "auto-publishing is not available for carousels."
- Optimal times: "based on your last 90 posts" (help doc) vs. "based on historical audience activity" (MCP tool description).
- IG max dimensions: 1920×1080 vs 1920×1920.

Additionally, several articles appear under **two different titles at two different URLs** (e.g., "Reviewing and revising posts (internal reviewers)" and "Post Approvals: How to review posts" share article ID `18158403946907`; "Cross channel reports metrics definitions" vs "Cross-channel metrics definitions"; "Getting Started with DM & Review Automations" vs "…Inbox & Review Automations" share ID `37925115779483`).

**[INFERRED]** They are renaming articles frequently (fast feature iteration) without a rigorous doc-review pass. For a competitor, this is exploitable in two ways: (1) accurate, versioned docs are a real trust signal for agency buyers, and (2) it confirms their release velocity is high — we should not expect any of these gaps to stay open indefinitely.

---

## 15. Analogue teardowns, module by module

### 15.1 SocialBee — the category/recycling benchmark

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **Content Categories** | First-class buckets. "Organize posts into groups by category, then create a **separate publishing schedule for each category**." The content mix emerges from the schedules. |
| **Queue semantics** | "SocialBee simply pulls posts from the category queue and publishes them **in order**." FIFO within category. |
| **Re-queue (Evergreen)** | Toggle at **category level** (`Category → Default Settings → Re-queue after posting`) *or* at **individual post level**. On publish, the post is re-added to the **bottom** of the category queue. |
| **Expiration** | Expire after **N publishes** and/or **on a specific date**. On expiry the post is **archived**, not deleted. |
| **Evergreen vs Share Once** | Explicit, named binary on every post. |

**What SocialBee does better than Vista:** the **category-as-schedule** model, the **archive-on-expiry** behavior (recoverable, auditable), and the explicit Evergreen/Share-Once binary in the composer.

**What Vista does better:** hard, well-documented recycle bounds (25 reuses, 3–100 day interval), and evergreen slots as a distinct slot type so recycled content can't crowd out fresh content.

**Synthesis for our build:** categories own schedules (SocialBee) **+** slot types distinguish fresh/evergreen (Vista) **+** archive-on-expiry (SocialBee) **+** performance-weighted reuse ordering (nobody).

### 15.2 Publer — the recycling API model

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **4 scheduling modes** | Across FB, Pinterest, LinkedIn, X, WordPress, YouTube, Instagram, TikTok, GMB |
| **Recycle vs Recurring — explicitly distinguished** | **Recurring** = publish this specific post at specified times repeatedly. **Recycle** = automatically re-post previously published posts from a designated bucket according to the posting schedule. |
| **Recycle parameters (from their public API docs)** | `gap` and `gap_freq` — "Recycling fills open slots based on gap and gap_freq" |
| **Watermarks** | Applied to images **and videos** |
| **Signatures** | Append text to the end of all posts |
| **Other** | Comment scheduling, bulk scheduling, hashtag suggestions, link shortening |

**Publer publishes a real public API doc site (`publer.com/docs`) with `gap`/`gap_freq` semantics exposed.** That level of API transparency is rare in this category and is worth matching.

**The Recycle-vs-Recurring distinction is a genuinely better mental model than Vista's single "Evergreen" concept**, because they are different jobs: *this exact post, repeatedly* vs *this bucket, cycling*.

### 15.3 Metricool — analytics-first, free-tier-driven

**[3P]**

| Mechanic | Implementation |
|---|---|
| **Autolists** | Recycling lists built from **CSV** or **RSS feed**; schedule and share automatically over time |
| **Best time to post** | **Per-platform heatmaps based on your audience's activity**, plus large-N public studies (2026 IG study; TikTok study across 2M+ posts / 92k+ accounts) |
| **Competitor tracking** | Included even on the free tier |
| **Free tier (permanent)** | 1 brand, **50 posts/month**, **30 days of analytics**, competitor tracking, SmartLinks (link-in-bio), AI copy assistant — **no time limit** |

**Metricool's free tier is the strategic weapon.** It converts through analytics-envy (30-day analytics window → "upgrade to see 90 days"), which is a much stronger natural paywall than post-count limits.

**Their best-time model is audience-activity-based, which is methodologically superior to Vista's own-post-performance model.**

### 15.4 Later

**[3P]** — data quality on Later was the weakest of my searches; treat this section as partially **UNVERIFIED**.

Known: **time-slot-based scheduling** ("Best Time to Post" auto-suggested slots), **Linkin.bio** (their link-in-bio, now positioned separately with plans from free to ~$29/mo for an AI tier), visual-first Instagram planning (grid preview), and a media library oriented to UGC. Later historically pioneered the **reminder-publish** model for Instagram before Meta opened the API.

**Their differentiator remains visual planning (grid preview), which Vista does not appear to match.** For Instagram-led brands the feed-grid preview is a real purchase driver.

### 15.5 Loomly — the configurable state machine

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **Three workflow modes** | **Standard** (2+ approvers, 7 statuses), **Lite** (1 approver, 6 statuses), **Zero** (no approvals, 4 statuses) |
| **Standard statuses** | Draft → Requires Edits → Pending Approval → Approved → Scheduled → Published → **Canceled** |
| **Post Ideas engine** | Daily inspiration from trends, holidays, RSS feeds, and **your own past top performers** |
| **Ownership** | Acquired by **Bending Spoons, January 2025**; pricing restructured from 5 tiers to 3; base ~$32/mo, entry $65/mo, mid ~$332/mo |

**Two things to steal:** the **configurable state machine** (workflow mode selected per workspace so unused states never render), and **"Post Ideas from your own past winners"** — a far better idea engine than generic trend feeds.

### 15.6 Planable — the client-approval benchmark

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **Multi-level approvals** | Arbitrary number of levels; each level has **one or multiple approvers**; **any one approver per level suffices**; levels are **named** (e.g. "Legal", "Client") |
| **Gating** | **Enterprise plan only** — a significant commercial opening |
| **Feedback** | Threaded per-post comments; multiple simultaneous commenters; everyone always sees the latest version |
| **Audit** | One-click approvals with **who approved and when** |
| **Roles** | Owner/Admin/Contributor/**Client**/Viewer — Client is a first-class role |

**Planable's UX insight — the post *is* the conversation thread** — is the right model. Vista attaches notes to shared-calendar approvals but does not have Planable's threaded, versioned, per-post discussion.

**Commercial opening:** Planable gates multi-level approvals to Enterprise. Shipping named multi-level approvals **at mid-tier** takes their strongest feature and undercuts it.

### 15.7 Agorapulse — the inbox benchmark

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **Coverage** | Comments, reviews, DMs, mentions, **and ad comments** across Facebook, Instagram, LinkedIn, X, TikTok, YouTube, Google Business Profile, **Threads, Bluesky** |
| **Ad comments** | First-class. Most tools ignore dark-post/ad comments entirely — this is a genuine differentiator |
| **Inbox Assistant** | Rule engine **configurable per network** — "different keywords and phrases and different actions" for IG vs FB |
| **Assignment** | Manual **or automatic via rules**, across YouTube/LinkedIn/Instagram/Facebook/X/GMB messages |
| **Saved replies** | Yes |
| **Organization** | Label, assign, bookmark; team-wide visibility |
| **Mobile** | Dedicated mobile inbox with its own docs |

**Ad-comment moderation is the biggest gap in Vista's inbox.** Brands running paid social generate more comments on ads than on organic posts, and unmoderated ad comments are a genuine brand-safety liability. If Vista's inbox doesn't cover ad comments (**UNVERIFIED**, but no doc surfaced), that is a serious enterprise-blocker.

### 15.8 Statusbrew — the rules engine

**[3P/DOC]**

| Mechanic | Implementation |
|---|---|
| **Rule Engine** | Custom triggers + automated actions for comment moderation, message routing, labeling. Conditions on **network, keywords, sentiment**, and more |
| **Access control** | Rule Engine visible **only to Primary Owners, Owners, and Admins**; Regular Users cannot create or manage Engage Rules |
| **Approval workflows** | Multi-step, multi-level; creatable only by Primary Owner/Owner/Admin; accessible from Compose to anyone with publishing permissions |

Statusbrew's Rule Engine is the most general automation surface in the mid-market. Vista's automations are **template-shaped**, which is exactly what the **[3P]** complaint "limited customization in Workflow Automation" is pointing at.

### 15.9 Sprout Social — the permissions benchmark

Covered in §5.2. Summary of what to copy:

- **Organizational Roles × Profile Permission Sets** as orthogonal axes.
- Preset roles for common jobs (Social Media Manager, Care Admin) + **fully custom roles**.
- Per-profile grants of **read-only / drafting / full publishing**.
- **Super Admin** as a distinct role.
- **SAML role attribute mapping** so IdP groups drive product roles.
- Groups as collections of profiles used for both permissions **and** reporting scoping.

### 15.10 Hootsuite / Buffer — the pricing poles

**[3P]**

| | Hootsuite | Buffer |
|---|---|---|
| **Billing metric** | **Per user** | **Per channel** |
| **Entry** | Professional ~$99/mo, 1 user, 10 accounts | Essentials ~$5/channel/mo (~$25 for 5 channels) |
| **Team** | ~$249/mo, 3 users, 20 accounts, approval workflows, **bulk scheduling up to 350 posts** | Team tier adds collaboration |
| **Free** | None meaningful | **Permanent: 3 channels, 10 queued posts per channel, basic analytics, no CC** |
| **AI** | **OwlyWriter AI** from Professional, with **token limits** | AI Assistant |
| **Listening** | Advanced listening on Business/Enterprise (custom pricing) | None |

Buffer's per-channel billing vs Hootsuite's per-user billing is the fundamental pricing-metric split in the category. **Vista straddles both (profiles + seats) but prices seats so low ($3.75) that it behaves like per-channel pricing.** That is the correct positioning for agencies and is Vista's main commercial weapon.

### 15.11 Sendible — the agency incumbent

**[3P]**

- Tiers: **Creator ~$29 → Traction ~$89 → Scale ~$199 → White Label ~$240 → White Label+ ~$750**.
- **Content Library** and **Custom Report Builder** gated at **Scale ($199)**.
- Approval workflows, client dashboards, RSS automation, white-labeling.
- 14-day trial.

**The gating of the Content Library at $199 is a widely-cited grievance.** Vista includes equivalent media-library capability at $39. That price/feature gap is the specific reason agencies migrate Sendible → Vista.

---

## 16. Cross-tool module matrices

### 16.1 Scheduling engine

| Capability | Vista | SocialBee | Publer | Metricool | Later | Loomly | Sendible | Hootsuite | Buffer |
|---|---|---|---|---|---|---|---|---|---|
| Time-slot queues | ✅ | ✅ (per category) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Categories owning their own schedule | ⚠️ labels only | ✅ **best** | ✅ (labels) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Evergreen recycling | ✅ (25×, 3–100d) | ✅ **best** | ✅ (gap/gap_freq) | ✅ (Autolists) | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| Expiry by count AND date | ⚠️ (date + 25 cap) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Recurring (this exact post) | ⚠️ multi-time | ⚠️ | ✅ explicit | ⚠️ | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| CSV bulk | ✅ 100/file | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 350 (Team) | ✅ |
| RSS automation | ✅ (72h first-import guard) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Best-time suggestions | ✅ (last 90 posts) | ✅ | ✅ | ✅ **audience heatmap** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pause / blackout / crisis mode** | ❌ | ⚠️ (pause category) | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Per-profile timezone | ❌ (group-level) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Holiday calendar overlay | ✅ (informational) | ✅ | ✅ | ✅ | ✅ | ✅ **+ideas** | ✅ | ✅ | ❌ |

### 16.2 Approvals

| Capability | Vista | Planable | Loomly | Statusbrew | Sendible | Agorapulse | Sprout |
|---|---|---|---|---|---|---|---|
| Multi-step ordered | ✅ | ✅ (Enterprise) | ✅ | ✅ (admins only) | ✅ | ⚠️ | ✅ |
| Named levels | ✅ (named steps) | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ |
| Group-as-approver | ✅ (User Groups) | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| Any-one-of-level advances | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ |
| Reject halts + returns | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **No-login external approval** | ✅ (shared calendar, password + expiry) | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| Threaded per-post comments | ⚠️ (notes) | ✅ **best** | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Version history on posts | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ |
| Configurable state machine | ❌ | ⚠️ | ✅ **best** | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Interactive Slack/Teams approve | ❌ (webhook only) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| SLA escalation on approvals | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ |

**Nobody ships interactive Slack/Teams approvals or approval SLAs. That is open ground.**

### 16.3 Inbox

| Capability | Vista | Agorapulse | Statusbrew | Sprout | Hootsuite | Sendible |
|---|---|---|---|---|---|---|
| Real-time Meta | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Non-Meta latency | ❌ **6–7 hours** | Faster (UNVERIFIED) | Faster | Faster | Faster | ⚠️ |
| **Ad comments** | ❓ UNVERIFIED | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Reviews in the same inbox | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Saved replies | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rules engine | ⚠️ template-based | ✅ per-network | ✅ **best** | ✅ | ⚠️ | ⚠️ |
| AI intent matching | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| DM automations (ManyChat-style) | ✅ **strong** | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Assignment + internal threads | ✅ (team conversations) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **IG 24h-window countdown** | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Daily sync cap | ❌ **500/profile/day** | Higher/none | Higher | Higher | Higher | ⚠️ |

### 16.4 Reporting

| Capability | Vista | Sprout | Metricool | Agorapulse | Sendible | Hootsuite |
|---|---|---|---|---|---|---|
| Report builder / custom sections | ✅ | ✅ | ⚠️ | ✅ | ✅ (Scale+) | ✅ |
| Scheduled PDF email | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Interactive share link | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |
| White-label branding | ✅ (+custom domain) | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Cross-channel normalization | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Industry benchmarks | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| Paid + organic in one report | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **No retention limit** | ✅ **best** | ❌ plan-gated | ⚠️ plan-gated | ⚠️ | ⚠️ | ❌ plan-gated |
| Backfill on connect | 60 days (extendable) | Varies | 30 days free tier | Varies | Varies | Varies |
| **Metric-deprecation annotations** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Metric lineage/provenance** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurable ER denominator | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

---

## 17. The platform-API reality table (2026)

Consolidated. This is the shared physics. **[PLATFORM]** throughout.

| Platform | Publish limit | Read/quota | DM access | Comment access | Notable "impossible" |
|---|---|---|---|---|---|
| **Instagram** | 100 API posts / 24h rolling | Rate limit scales with **DAP** (daily active people) | ✅ with **24h window**; **Human Agent tag → 7 days**; **750 private replies/hour**; ~200 automated msgs/hour reported | ✅ real-time webhooks | Story stickers/links/polls/music; music library; tagging private accounts; >3 collaborators; Stories collaborators |
| **Facebook** | Advisory ≤25/day | Graph API tiered | ✅ (Messenger, 24h window) | ✅ | Native organic multi-image carousel API (must use link-carousel) |
| **TikTok** | **6 req/min per user token**; **~15–25 videos/day per account**, shared across all clients | Display API **600 req/min per endpoint** | ✅ DMs (keyword triggers) | ⚠️ read yes; **no comment-based automation triggers** | Sound library, stickers, polls, Q&A; **open keyword search (listening)**; Research API for commercial use |
| **LinkedIn** | Community Management API, dev vs standard tier | Dev tier restricted; must reach Standard within **12 months** | ❌ **No generic DM permission at all** | ✅ comments + mentions | DMs; social-feed display use case; member data for ads/sales/recruiting/CRM enrichment; tagging non-followers |
| **YouTube** | `videos.insert` **~100 units**, own **~100 calls/day bucket** (since 1 Jun 2026) | **10,000 units/day** shared; `search.list` 100 calls/day; `commentThreads.insert` **50 units** | n/a | ✅ (`commentThreads.list` 1 unit) | High-volume ingestion without a Quota & Compliance Audit |
| **X** | **$0.015/post**; **$0.20 if it contains a link** | **$0.005/read**, cap **2M reads/mo** (~$10k); above ⇒ Enterprise ~$42k+/mo. Free tier **discontinued**; Basic/Pro closed to new signups | Tier-dependent | ✅ | Affordable firehose |
| **Threads** | **250 posts / 24h**; replies exempt | — | n/a | ✅ replies | GIFs, Stories, **quote-posting**, native scheduling |
| **Pinterest** | — | — | n/a | ⚠️ | Reliable posting on brand-new accounts (**~2-week warm-up** reported) |
| **Reddit** | — | Data API **free only non-commercial**; commercial deal **not self-serve** | ⚠️ | ✅ | Self-serve commercial data access |
| **Google Business Profile** | — | — | ⚠️ GBP messaging | ✅ Q&A | Multi-image posts (**first image only**) |
| **Yelp / TripAdvisor / Trustpilot / OpenTable** | — | Read via partner feeds | n/a | n/a | **Replying to reviews** via general third-party tools |
| **Bluesky** | Generous | Open AT Protocol | ✅ | ✅ | Little — cheapest platform to support well |

---

## 18. Gaps nobody in the market covers well

Consolidated and prioritized. These are the openings.

### Tier 1 — high value, low-to-medium build cost, no competitor covers

| # | Gap | Why it wins |
|---|---|---|
| **G1** | **Pause / blackout / crisis kill-switch** with scope (account/group/profile/label), policy (skip / defer / defer-past-window), and restore semantics | Every agency has a horror story. No competitor has a good version. It is a *safety* feature, which sells to risk-averse buyers and marketing directors, not just practitioners. |
| **G2** | **Resilient publish pipeline**: error classification, auto-retry with backoff inside a lateness budget, pre-flight validation at schedule time, media pre-staging, token-expiry pre-warning, visible retry ledger, idempotency keys | Vista's own docs say "duplicate the post and try again." Reliability is the #1 unspoken purchase criterion and nobody markets it. |
| **G3** | **Metric provenance & deprecation annotations** — lineage per metric, inline chart annotations at definition changes, `comparable: true/false` on cross-period comparisons, auto-generated "why this differs from native" | Every tool has silent metric breaks. This converts the category's biggest trust problem into a differentiator. Cheap if designed in, impossible to retrofit. |
| **G4** | **IG messaging-window awareness** — live 24h/7d countdown per conversation, send-eligibility state, template path when closed | Compliance + prevents failed sends. Nobody surfaces it. |
| **G5** | **Interactive Slack/Teams approvals** with approve/reject/comment buttons, routing rules, SLA escalation, digest batching | Vista is webhook-only. Everyone else is worse or equal. Teams support alone opens enterprise. |
| **G6** | **Per-profile timezone + "publish at local time per profile"** + dual-time rendering in the composer | Two-week build. Wins every multi-region evaluation. |
| **G7** | **Value-before-OAuth onboarding** — public-handle audit rendered in 30 seconds, then connect | Fixes the category's universal TTFV problem. |
| **G8** | **Alt text everywhere** (IG, LinkedIn, X, Facebook, Bluesky), with AI-generated drafts and an accessibility linter | Vista appears to have no alt-text support at all. Public-sector/regulated buyers require it. |

### Tier 2 — high value, higher build cost

| # | Gap | Why it wins |
|---|---|---|
| **G9** | **Org-role × per-profile-permission-set model at SMB price** (Sprout's model, Vista's price) + keep the **client profile-connect link** | Directly attacks Vista's weakest architecture with Sprout's strongest. |
| **G10** | **Category-owned schedules + declarative content-mix ratios + performance-weighted evergreen reuse + link/media health checks before recycle** | Combines SocialBee's best model with an entirely unbuilt intelligence layer. |
| **G11** | **Honest listening**: published per-source coverage matrix in-product, deep Reddit structure, deep competitor-owned-channel tracking, graceful quota degradation (sample+extrapolate, never blind) | The category's listening claims are systematically dishonest. Honesty is differentiating and cheaper than firehose licensing. |
| **G12** | **Ad-comment moderation** in the unified inbox | Agorapulse has it; Vista appears not to. Brand-safety blocker for paid-heavy brands. |
| **G13** | **X cost metering surfaced in-product** — live spend against budget, link-post cost warning | Turns the most-hated 2026 surcharge into a trust signal. |
| **G14** | **Excellent mobile reminder-publish flow** — one-tap handoff, media pre-downloaded, caption pre-copied, deep-link into the native composer, "did it post?" confirmation loop | Reminder publishing is *mandatory* for the most-wanted formats. Everyone treats it as a consolation prize. Treat it as a first-class product. |
| **G15** | **Migration importers** — Buffer/Hootsuite/Later/Sendible calendar import, Linktree/Beacons bio import, competitor CSV ingest | Vista already does Linktree→Vista Page import. Extend it to the whole calendar and switching cost collapses. |

### Tier 3 — strategic / commercial

| # | Gap |
|---|---|
| **G16** | **Permanent free tier** (Vista has none; Metricool and Buffer do, and use it as their top-of-funnel and win-back reservoir) |
| **G17** | **Price on client workspaces**, not profiles+seats, so the pricing metric matches how agencies grow |
| **G18** | **Configurable publishing caps** with audit, instead of a hard 25/day/profile |
| **G19** | **Public, versioned API docs + generous rate limits** (Publer-grade transparency; not Vista's "10 violations/hour → key deactivated") |
| **G20** | **Reverse trial**: start on top plan, drop to a usable free tier at day 14 |

---

## 19. Concrete out-build specification sketches

### 19.1 The publish pipeline (G2) — reference design

```
schedule_time - T_prep (default 15 min)
  ├─ PREFLIGHT JOB
  │   ├─ token: valid? scopes sufficient? expires_at > schedule_time + 24h?
  │   ├─ media: transcode to per-network target (cached by content-hash + target-profile)
  │   ├─ specs: validate AR / duration / filesize / codec per network
  │   ├─ entities: resolve location_id, product_ids, user_tags, collaborators
  │   │            (fail fast if a tagged account is private / catalog unlinked)
  │   ├─ rate:   check network + account headroom (rolling window ledger)
  │   ├─ policy: blackout windows? pause state? label-scoped holds?
  │   └─ on any PERMANENT failure -> notify NOW (T-15min), not at publish time
  │
  ├─ PRE-STAGE JOB (network-dependent)
  │   └─ upload media container (e.g. IG /media) so publish is a cheap finalize
  │
schedule_time
  ├─ PUBLISH JOB (idempotency_key = post_id + attempt_epoch)
  │   ├─ success -> record remote_id, remote_permalink, publish_latency
  │   ├─ TRANSIENT error (5xx, 2207001/2207082, 429, timeout, network)
  │   │     -> retry with exp backoff + jitter
  │   │        within lateness_budget (default 30 min, user-configurable per profile)
  │   │        max_attempts 6
  │   └─ PERMANENT error -> mark failed, classify, surface remediation copy + one-click fix
  │
post-publish
  └─ VERIFY JOB (T+2min): read back the remote object.
       If absent but we recorded success -> reconcile (prevents "duplicate postings" bug)
       If present but we recorded failure -> reconcile (prevents double-post on retry)
```

The **VERIFY + reconcile** step is what kills the "duplicate postings" complaint that Vista users report. Idempotency keys alone are insufficient because the failure mode is *upstream succeeded, our ack was lost*.

### 19.2 Blackout / pause model (G1) — data model

```
PublishingHold {
  id
  scope_type: ACCOUNT | PROFILE_GROUP | PROFILE | LABEL
  scope_id
  kind: MANUAL_PAUSE | BLACKOUT_WINDOW | CRISIS
  starts_at, ends_at            // null ends_at = indefinite (manual pause)
  recurrence                    // optional RRULE for weekly quiet hours
  policy: SKIP | DEFER_NEXT_SLOT | DEFER_AFTER_WINDOW
  label_filter[]                // e.g. only hold posts labeled "promotional"
  reason, created_by, created_at
}
```

At fire time the scheduler evaluates all applicable holds; the **most restrictive** wins. On release, the UI presents a **"held during <window>"** review queue with bulk re-slot.

Crisis mode = a preset that creates an ACCOUNT-scoped `CRISIS` hold, switches the inbox to a triage view, posts to the notification channels, and pins a banner.

### 19.3 Metric provenance (G3) — data model

```
MetricPoint {
  profile_id, metric_key, date, value
  provenance: {
    source: "meta_graph" | "tiktok_display" | "yt_data_v3" | ...
    endpoint: "/{ig-user-id}/insights"
    field: "views"                 // the ACTUAL upstream field
    api_version: "v23.0"
    collected_at
    transform: "aliased_to:impressions"
  }
}

MetricDefinitionChange {
  metric_key, network, effective_date
  from_field, to_field
  comparable_across: false
  note: "Meta deprecated `impressions` for IG media on 2025-04-21; series continues using `views`."
}
```

Chart renderer draws a vertical rule at every `effective_date` with a hover note, and any period-over-period delta that spans one is badged **"definition changed — not directly comparable."**

### 19.4 Time model (G6)

```
QueueSlot {
  day_of_week, local_time            // wall clock, e.g. 09:00
  tz_source: PROFILE | PROFILE_GROUP | FIXED
  fixed_tz                            // IANA, used when tz_source = FIXED
}

ScheduledPost {
  mode: ABSOLUTE_UTC | LOCAL_TO_PROFILE | QUEUE_SLOT
  local_time, tz_at_authoring
}
```

Resolve to UTC **at fire time**, not at authoring time, so DST transitions are correct. Render every time in the UI as: `09:00 profile local · 14:00 your time`.

---

## 20. Open questions and probes required

These need a live paid Vista Social account to settle. Ordered by decision-impact.

| # | Question | Probe |
|---|---|---|
| P1 | Does the composer expose an **alt text** field for any network? | Attach an image with an IG + LinkedIn profile selected; inspect media tile UI |
| P2 | What happens when the **500 inbox items/day** cap is hit — queue-and-catch-up, or drop? | Generate >500 comments on a test profile in 24h; check for gaps the next day |
| P3 | Does the publish pipeline **auto-retry** transient failures at all? | Schedule a post; kill network reachability to the network at fire time (or use a media file that triggers 2207001); observe attempt count |
| P4 | Is **transcoding synchronous at upload** or deferred to publish? | Upload a 4K 10-min video, watch for an immediate processing indicator vs. a publish-time failure |
| P5 | **DST correctness** of queue slots | Set a 09:00 slot in `America/New_York`; check computed UTC for a date across the DST boundary |
| P6 | Does listening return **non-owned Instagram or TikTok** results? | Post a nonce term from unconnected IG + TikTok accounts; check the listener |
| P7 | Exact **external listener daily result quota** | Create a listener on a very high-volume term; observe cut-off count |
| P8 | Does the inbox include **ad comments**? | Run a $5 boosted post; comment on it from a second account; check inbox |
| P9 | Are **historical metric series restated or nulled** at platform deprecations? | Pull a 2024–2026 IG impressions series and look for a discontinuity/flatline in Q2 2025 |
| P10 | **Trial→paid**: is a card required to continue, and when is it demanded? | Run a trial to day 14 without adding a card |
| P11 | Are there **per-profile** (not per-group) permission grants anywhere in Settings? | Inspect the team-member permission editor |
| P12 | Is the **25 posts/day/profile** cap overridable by support/enterprise? | Ask sales |
| P13 | Does the X add-on **meter** usage visibly, or is it a flat gate? | Connect X on the add-on; look for a usage meter |
| P14 | Exact **per-network character limits** table | Read the "Character limits for each social network" article |
| P15 | Full **"Which engagements does Vista Social support for each network?"** table | Read that article; it resolves most of §7.3's ✱ cells |

---

## 21. Sources

All accessed 12 August 2026 via WebSearch (domain-scoped where noted). **WebFetch was blocked for all domains in this environment**, so these are the URLs the search layer surfaced and summarized, not pages I rendered directly.

### Vista Social help center (`support.vistasocial.com`)
- Auto Publishing vs. Notification Reminders — `/hc/en-us/articles/14736118034715-`
- Instagram Publishing with Vista Social — `/articles/4430358197275-`
- Instagram Publishing with Vista Social mobile app — `/articles/15300652492955-`
- Instagram direct publishing of carousels with images and videos — `/articles/5392214218011-`
- Scheduling Instagram Reels — `/articles/7117217001115-`
- Instagram Story Publishing with Vista Social — `/articles/7612460663579-`
- Can I publish Instagram Stories with stickers/links? — `/articles/17368921608859-`
- Can I publish multiple Instagram Stories with Vista Social? — `/articles/26286864836123-`
- Instagram user tagging — `/articles/5586961699995-`
- Tagging Instagram Shop Products — `/articles/9265214845467-`
- How to solve issues with product tagging to Instagram — `/articles/25616381999643-`
- How to resolve Instagram post tagging issues — `/articles/35165519013659-`
- TikTok Publishing with Vista Social — `/articles/4419165964827-`
- TikTok Publishing with Vista Social Mobile App — `/articles/16517005574043-`
- Scheduling Image Carousel posts on Tiktok — `/articles/23963649036571-`
- Plan your TikTok Content with the TikTok Planner — `/articles/11230026554139-`
- X (Twitter) Publishing with Vista Social — `/articles/4430435758235-`
- X's limitations with sharing duplicate content — `/articles/4409614726939-`
- Facebook Publishing with Vista Social — `/articles/4430269950619-`
- Scheduling Carousel posts to Facebook — `/articles/11051868995739-`
- Facebook Story Scheduling — `/articles/14673236555547-`
- Facebook profile types explained: Pages, Groups, Personal — `/articles/26557754742683-`
- Connecting your Facebook Group to Vista Social — `/articles/29625007580827-`
- LinkedIn publishing with Vista Social mobile app — `/articles/16520472099099-`
- How to tag personal LinkedIn profiles on page posts — `/articles/16368186459163-`
- Youtube Publishing with Vista Social — `/articles/4475062292763-`
- How to publish YouTube Shorts using Vista Social — `/articles/5574842677659-`
- How to enable Youtube's Intermediate and Advanced features — `/articles/12219962685211-`
- Google My Business Publishing with Vista Social — `/articles/4444478381851-`
- How to add a CTA button to Google My Business posts — `/articles/18064182128027-`
- Threads Publishing with Vista Social — `/articles/26696785757979-`
- Reddit Publishing with Vista Social — `/articles/4531883893659-`
- Connecting a Snapchat Business Public Profile — `/articles/19543580646683-`
- Connecting your TripAdvisor profile to Vista Social — `/articles/4409614644123-`
- How to connect and post to custom profiles in Vista Social — `/articles/32928788122267-`
- Video specs and guidelines per social network — `/articles/5231863512987-`
- Video Processing with Vista Social — `/articles/10208587806363-`
- Auto padding and resizing of videos for Instagram posts — `/articles/7835518092187-`
- How to customize your video thumbnail or cover — `/articles/11511396179995-`
- Ideal image sizes and formats for your posts — `/articles/4409614704539-`
- Attaching images, videos, and other media to your posts — `/articles/4409607575963-`
- How many images or videos can I attach to my post? — `/articles/30786853841179-`
- Character limits for each social network — `/articles/4409607590427-`
- Customization options during post scheduling — `/articles/6360102393499-`
- How do I use custom post fields? — `/articles/14439524021531-`
- Link previews explained — `/articles/4489742499483-`
- Publishing Queues — `/articles/4411057807643-`
- Evergreen Auto-Repurposing — `/articles/40740183689115-`
- How to repurpose posts in Vista Social — `/articles/39636626391835-`
- Optimal Time Suggestions — `/articles/6140669938971-`
- Bulk Publishing — `/articles/4411200242203-`
- CSV format guidelines for Bulk Scheduling — `/articles/10295276622875-`
- Smart Publishing — `/articles/4411200236315-`
- Smart Publishing with AI — `/articles/47783744426907-`
- Finding RSS feeds for blogs you want to share — `/articles/14481591589659-`
- How to schedule a post to multiple times — `/articles/39630495234843-`
- How to manage your Labels (Post, Media, Inbox, & Queue) — `/articles/14024806229659-`
- How to create Ideas in bulk — `/articles/29413263626267-`
- Content calendar filters — `/articles/5053579225243-`
- Shared Calendar — `/articles/8277051463195-`
- How to export your publishing calendar to PDF or CSV — `/articles/14156595684763-`
- How to bulk delete posts — `/articles/16465463148059-`
- How to enable Social Events and Holidays Calendar — `/articles/5399739590299-`
- Daily posting limits — `/articles/15527152846107-`
- Publishing Safety — `/articles/42075096746267-`
- Vista Social Fair Use Policy — `/articles/36258742717467-`
- Rate limits (section) — `/sections/50538243449883-`
- Getting started with Vista Social — `/articles/5974883710875-`
- Connecting your profiles to Vista Social — `/articles/4407222988187-`
- Connecting Instagram Business or Creator Profile — `/articles/4409607535131-`
- Connecting your LinkedIn Company Page and Personal Profile — `/articles/4409604806555-`
- Connecting your YouTube channel — `/articles/4409614635035-`
- Connecting X (formerly Twitter) profile — `/articles/4409614576155-`
- How to let external users connect social profiles without logging in (profile connect link) — `/articles/30687223430555-`
- How to invite users as team members to connect social profiles — `/articles/14089077738139-`
- How to add, move, or remove social profiles — `/articles/4412883649563-`
- How to create profile groups in Vista Social — `/articles/11328133941915-`
- How to create and manage user groups within your team — `/articles/26644215320859-`
- How to change the time zone for your profile group — `/articles/11327925613979-`
- How many profiles and users can I have on my subscription? — `/articles/16791787436059-`
- View your connected profile's details page — `/articles/11621382919195-`
- Submitting posts for approval — `/articles/46431598676251-`
- Multi-Step Post Approval: How to create post approval workflows — `/articles/4414079213595-`
- Post Approvals / Reviewing and revising posts (internal reviewers) — `/articles/18158403946907-`
- Using shared calendars for external/client approvals (no login) — `/articles/18158890067355-`
- Work as a team with Task Management — `/articles/5975968117147-`
- Getting started with the Social Inbox — `/articles/4409614773531-`
- Which engagements does Vista Social support for each network? — `/articles/25311040215195-`
- How to reply to conversations in the inbox — `/articles/4409614784795-`
- Inbox message options — `/articles/4413942677531-`
- Getting Started with Inbox on the Vista Social app — `/articles/24006503081499-`
- Team conversations in the inbox — `/articles/43881261320987-`
- How to allow access to messages in Instagram — `/articles/4444967221019-`
- Getting Started with DM & Review Automations — `/articles/37925115779483-`
- TikTok DM Automations — `/articles/38477260668187-`
- Data Collection with DM Automations — `/articles/39013177705115-`
- Ready-to-Go Templates: Auto-DM links for comments — `/articles/38034799066395-`
- Instagram Automations: How to Send More Than One Message — `/articles/45316736866971-`
- How to automatically hide or delete comments with automations — `/articles/48454694714651-`
- Are Vista Social's DM & comment automations officially approved by Meta? — `/articles/38034138677019-`
- Getting started with Review Management — `/articles/4409607635355-`
- Which networks are reviews monitored on? — `/articles/4409607637403-`
- Which networks can I reply to reviews from within Vista Social? — `/articles/15375614227227-`
- Responding to reviews — `/articles/4411200233627-`
- How to respond to reviews with AI Assistant — `/articles/26322849927579-`
- Social Listening with Vista Social — `/articles/4415219717019-`
- How to use social listening for competitive analysis — `/articles/40806771460123-`
- Getting started with Reports — `/articles/4413932445851-`
- Cross channel reports metrics definitions — `/articles/4413461031835-`
- Instagram report definitions — `/articles/4413537163291-`
- Facebook Page metrics & report definitions — `/articles/4413453415707-`
- Google Business report definitions — `/articles/4413453723931-`
- Reddit report definitions — `/articles/4413612896923-`
- OpenTable report definitions — `/articles/4413550343195-`
- Post Performance Report — `/articles/6162339586715-`
- Profile Performance Report — `/articles/6139282618395-`
- Paid Performance Report — `/articles/43264030714651-`
- Industry Benchmark Report — `/articles/29509393733915-`
- Review Performance Report — `/articles/6339087252891-`
- Sentiment Analysis Report — `/articles/29104810883355-`
- Sentiment Analysis — `/articles/29117458372379-`
- How to schedule reports — `/articles/6977311182619-`
- How to customize your reports — `/articles/46825938757019-`
- How to share interactive report links — `/articles/29324084974107-`
- How to run reports by post label for campaigns — `/articles/25923207230235-`
- What data is available in Reports? — `/articles/38698619717531-`
- How much historical data does Vista Social backfill? — `/articles/25630092255899-`
- Why your data in Vista Social might differ from your native analytics — `/articles/4407368711067-`
- Why is my engagement in Post Performance and Profile Performance reports different? — `/articles/34242917342747-`
- How to enable TikTok Analytics for Vista Social reports — `/articles/28030219358747-`
- Vista Social API — `/articles/32993061787035-`
- OAuth 2.0 — `/articles/44656690553371-`
- Vista Social's Available MCP Tools — `/articles/46525029430299-`
- MCP Server: Connect Vista Social to your favorite AI tools — `/articles/40393513382043-`
- Do I need the API add-on to use Zapier, Make, or N8N? — `/articles/39714513075867-`
- Zapier Integration Overview — `/articles/10598636403227-`
- Make Integration Overview — `/articles/21600307690523-`
- Slack Integration — `/articles/23097327081755-`
- Vista Social App Integration in Canva — `/articles/36768744286491-`
- How to set up your brand voice for AI Assistant — `/articles/23254436096539-`
- Crafting social posts with AI Assistant — `/articles/11761305030171-`
- How to reply to messages and comments with AI Assistant — `/articles/11761321250331-`
- AI Training & Knowledge: Getting Started — `/articles/46961598441371-`
- How to generate images with AI on Vista Social — `/articles/50019827286683-`
- Setting up your Vista Page — `/articles/21940179266587-`
- Employee Advocacy: Turn your team members into brand ambassadors — `/articles/27307592169115-`
- Getting started with Advocacy Program for Brands — `/articles/27298891728795-`
- Managing your Employee Advocacy Admin Dashboard — `/articles/28032011056923-`
- Managing your Advocate Dashboard — `/articles/28068402912411-`
- Employee Advocacy Analytics — `/articles/28261550792475-`
- How to enable Slack notifications for Employee Advocacy — `/articles/27339880306587-`
- Boosting posts with Vista Social — `/articles/23687755431835-`
- How to use Vista Social's Discover feature to find content — `/articles/5171408238235-`
- Dashboard Notification Center — `/articles/36197454821403-`
- How to enable browser notifications — `/articles/5801097675035-`
- How to add or remove mobile devices for reminder notifications — `/articles/14938988567963-`
- White labeling with Vista Social — `/articles/16852036868507-`
- White label logo setup in Vista Social — `/articles/42319734243611-`
- Use your custom domain for white label shortening — `/articles/15295941771931-`
- How to resell Vista Social & automate onboarding with Zapier — `/articles/34876463786907-`
- Information about free trials — `/articles/4407250446235-`
- Can I trial higher plans during an active subscription? — `/articles/50529998607771-`
- Troubleshooting Instagram failed post errors — `/articles/7858903752219-`
- How to resolve "Media upload has failed with error code 2207001 or 2207082" — `/articles/15530061613467-`
- Instagram error explained: We restrict certain activity — `/articles/5462397210011-`
- How to fix Instagram post failure: "The Instagram account is restricted" — `/articles/21466777292571-`
- Troubleshooting Facebook failed post errors — `/articles/11328353486619-`
- How to fix Facebook error "Please reduce the amount of data you're asking for" — `/articles/11746976802971-`
- Troubleshooting X failed post errors — `/articles/17791894896667-`
- Troubleshooting Bluesky failed post errors — `/articles/39488536689819-`
- How to troubleshoot "Business Account Not Allowed to Advertise" — `/articles/43076451020059-`
- Getting Started with the Vista Social app — `/articles/45234784310171-`
- Accessing Vista Social on desktop, mobile, and web — `/articles/46245687871387-`
- Does posting through Vista Social affect my reach? — `/articles/52228902765211-`

### Vista Social marketing site
- `https://vistasocial.com/pricing`
- `https://vistasocial.com/social-media-publishing/`
- `https://vistasocial.com/integrations/tiktok/`
- `https://vistasocial.com/integrations/mcp/`
- `https://vistasocial.com/insights/what-is-mcp/`
- `https://vistasocial.com/insights/ai-image-and-video-generation`
- `https://vistasocial.com/faq/`
- `https://get.vistasocial.com/tryfree`

### Platform / API documentation
- Meta — Instagram Platform content publishing & messaging (`developers.facebook.com/docs/instagram-platform/*`)
- Microsoft Learn — LinkedIn Community Management API migration guide (`?view=li-lms-2026-06`) and Restricted Uses of LinkedIn Marketing APIs (`?view=li-lms-2026-01`)
- `developer.linkedin.com/product-catalog/marketing/community-management-api`
- Google for Developers — YouTube Data API Overview, `commentThreads: insert`, Quota and Compliance Audits
- TikTok Content Posting API / Display API developer guides (getphyllo, tokportal, zernio, posteverywhere)
- Threads API rate-limit write-ups (socialcrawl, postproxy, posteverywhere)
- X API pricing 2026 (twitterapi.io, blotato, postproxy, socialcrawl, getxapi, xpoz, sorsa)
- Instagram Official APIs comprehensive reference gist (April 2026)

### Competitors
- SocialBee help: Content Categories, Evergreen (Re-Queue) vs Share Once, How Do I Expire Posts
- Publer: `publer.com/docs/posting/create-posts/publishing-methods/recycling-posts`; `help.publer.io` scheduling methods
- Metricool: help center (best time to post), metricool.com studies
- Later: later.com blog / Linkin.bio
- Loomly: `loomly.zendesk.com` collaboration workflows; `intercom.help/loomly` approve a post
- Planable: `help.planable.io` multi-level approvals, approvals and approval workflows
- Sendible: pricing/review roundups (socialchamp, socialpilot, checkthat, turrboo, postplanify)
- Agorapulse: `support.agorapulse.com` Inbox Explained, Mobile Inbox explained; `agorapulse.com/features/social-media-inbox/`
- Statusbrew: `statusbrew.com/help/articles/approval-workflow`, `/access-based-on-user-role`
- Sprout Social: `support.sproutsocial.com` Multi-Role and Preset Organizational Roles, Understanding User Permissions, Message Approval Workflows, Super Admin role, SAML role attribute; `sproutsocial.com/features/flexible-account-structure/`
- Hootsuite / Buffer pricing comparisons (blotato, socialbotify, socialrails, turrboo, buffer.com)
- Listening vendors: Brandwatch, Talkwalker data-coverage page, Sprinklr help (X as a Listening Source), Meltwater, Syncly TikTok monitoring comparison

### Review aggregators (used only for user-reported bugs and pricing cross-checks)
- G2, Capterra, Trustpilot, SoftwareAdvice, SoftwareSuggest listings for Vista Social
- Independent reviews: gizory, socialrails, postplanify, hackceleration, authencio, unite.ai, turrboo, checkthat.ai, masterblogging, socialchamp

---

## Appendix A — one-page competitive summary

**Vista Social's real strengths (hard to beat):**
1. Price-to-feature ratio, especially **$3.75/seat**.
2. **No data-retention limits** on analytics.
3. **DM/comment automations with AI intent matching** embedded in an SMM tool.
4. **Profile connect link** (client self-onboarding without a seat).
5. **Custom post fields** (dynamic per-profile tokens).
6. **~60-tool MCP server** — genuinely ahead of the category on AI-agent operability.
7. Breadth: advocacy + reviews + listening + link-in-bio + advocacy all included.

**Vista Social's real weaknesses (exploitable now):**
1. **No auto-retry on transient publish failures** — documented fix is "duplicate and republish."
2. **No pause / blackout / crisis kill-switch** anywhere.
3. **Timezone only at profile-group level**; no per-profile local publishing.
4. **Permissions only at profile-group level**; no per-profile permission sets, no custom roles.
5. **6–7 hour inbox latency on all non-Meta networks**; **500 items/profile/day** hard cap.
6. **25 posts/day/profile** hard cap, not configurable.
7. **No alt text support** evidenced anywhere.
8. **Listening is narrow** (X/Reddit/Threads/news) with a **quota that blinds you mid-spike**, and no non-owned Meta/TikTok coverage.
9. **Slack is webhook-only** — no interactive approvals; **no Teams**.
10. **No permanent free plan**; onboarding gates all value behind email verification and OAuth.
11. **Mobile app quality lags desktop**, despite mobile being mandatory for the most-requested formats.
12. **No metric-deprecation annotations or provenance** (though nobody else has this either).

**The one-sentence wedge:** *Build the reliability, safety, and permission layer that Vista Social skipped — resilient publishing with retries and pre-flight validation, a real crisis/blackout kill-switch, per-profile timezones and permissions, metric provenance, and a mobile reminder-publish flow that is genuinely first-class — and sell it at Vista's price with Metricool's permanent free tier as the funnel.*
