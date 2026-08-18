# Metricool — Forensic Teardown

**Research date:** 12 August 2026
**Subject:** Metricool (metricool.com), Madrid, Spain
**Thesis under test:** *Metricool is the strongest analytics-led player in the SMB/agency tier. Understand exactly why.*

---

## 0. Methodological note — READ THIS FIRST

**This session's network egress proxy blocks `metricool.com`, `help.metricool.com`, `app.metricool.com`, `github.com`, `g2.com`, `capterra.com`, `trustpilot.com`, and effectively every third-party host.** Direct `WebFetch` against every product page, help-centre article, changelog and API doc returned `EGRESS_BLOCKED`. GitHub MCP access is scoped to `emmanuelok/smm` only, and `add_repo` refuses cross-owner adds.

Consequently **every fact below was obtained through the search tool's page-reading layer**, which reads the live pages and returns synthesised extracts, rather than through my own reading of raw HTML. This is materially weaker than a direct fetch. Practical implications:

- Exact numbers, prices and limits are reported **as the search layer extracted them from the live page**, and I have cross-checked each contested number against 2+ independent queries.
- Where two sources disagree, **both are shown and the conflict is flagged**.
- Where a claim traces only to a third-party review blog (of which there is an enormous SEO farm around Metricool pricing), it is marked **[3P]**.
- Where I could not verify at all, it is marked **UNVERIFIED** rather than guessed.
- A **Verification Ledger** at §23 lists everything that is soft.

Treat prices as directionally right and structurally right; re-confirm exact cents against `metricool.com/pricing/` before quoting to anyone.

---

## 1. Executive summary — why Metricool wins on analytics

Metricool is not "a cheap Hootsuite." It is a **social-analytics product that grew a publishing tool**, and the ordering matters. Six structural decisions explain its position:

1. **It prices per *brand*, not per *seat*, and gives unlimited users on every paid tier.** A 10-brand agency with 6 staff pays for 10 brands. Sprout Social charges ~$249+/seat. This single packaging decision is the whole value story — [an independent comparison puts a 3-user/10-brand setup at $153/mo on Metricool vs $1,197/mo on Hootsuite Advanced](https://tareno.co/compare/metricool-vs-sprout-social). **[3P]**

2. **It keeps analytics history essentially forever on paid plans.** Once Metricool has synced a data point it does not roll it off. "Unlimited analytics history" starts at the **Starter** tier (~$20–25/mo). Sprout and Hootsuite gate long retention behind premium analytics add-ons.

3. **It ships a first-party Looker Studio connector, free with the Advanced plan.** 14 channels including three ad platforms, 25+ data sources, brand-pattern auto-grouping. This is the single feature agencies cite most. Nobody else at this price gives you a governed BI feed.

4. **It puts paid media (Meta Ads, Google Ads, TikTok Ads) inside the same object model as organic** — same dashboard, same reports, same Looker feed, same Campaign Dashboards. Sprout treats paid as a bolt-on; Hootsuite's is thin.

5. **It covers the long tail nobody else bothers with**: Twitch (subscriber tiers, stream duration), Google Business Profile reviews, Threads, Bluesky, and its *own* first-party web analytics script for the client's website/blog.

6. **It publishes annual large-N platform studies** (2.3M+ TikTok posts, plus Instagram and LinkedIn studies) and wires them back into the product as benchmarks. That is a data-network-effect play no competitor at this price runs.

**The counterweight:** publishing reliability complaints (double-posting, silent account disconnections), a genuinely nasty billing/auto-renewal reputation on Trustpilot, an inbox that does not unify across brands, no real social listening, and a growing wall of paid add-ons (X, Advanced Analytics, Hashtag Tracker) that make the headline price misleading.

---

## 2. Company & corporate context

| Item | Value | Source confidence |
|---|---|---|
| Founded | 2015 | Confirmed, multiple |
| Founders | Juan Pablo Tejela, Laura Montells | Confirmed |
| HQ | Madrid, Spain (**not** Pontevedra — sources consistently say Madrid) | Confirmed |
| Headcount | 143 (as of 31 May 2026) | [3P] Tracxn |
| Users claimed | "over 2 million users"; elsewhere "more than one million professionals… in over 120 countries" | **Conflicting** — marketing copy of different vintages |
| Named customers | Forbes, Costco, FOX, KFC, Warner Music Group, Adidas, Volvo, H&M | Marketing claim |
| Outside capital raised | ~$5.61M; grew to ~**€17M ARR** substantially bootstrapped | [3P] |
| 2022 | Founders sold ~20% secondary stake to Axon | [3P] |
| **30 Jul 2024** | **Majority stake acquired by team.blue**, valuing Metricool at **>€100M** | [3P] but widely reported |
| Platform partnerships | Official partner of Meta and Google; authorised by X, Pinterest, TikTok, LinkedIn, WordPress | Marketing claim; specific badge tiers **UNVERIFIED** |

**Strategic read:** team.blue is a European hosting/digital-services roll-up. Metricool under team.blue has continued to ship aggressively (monthly product-update posts through at least May 2026) and has *raised* prices (the X add-on doubled in July 2026), which is the classic post-acquisition monetisation curve. Expect further add-on unbundling.

---

## 3. Pricing & packaging — the per-brand model

### 3.1 The core mechanic

> **A "Brand" is the billing unit.** A Brand is a workspace containing **exactly one profile per platform** — one Instagram account, one Facebook Page, one TikTok account, one LinkedIn Page, etc. Analytics, planner, inbox, ads, SmartLinks and settings all scope to the Brand.

Two consequences that matter enormously:

- **Users are free and unlimited on paid plans.** You buy capacity in clients, not headcount. This is the inverse of Sprout/Hootsuite/Sprinklr.
- **A client with two Instagram accounts consumes two Brands.** A multi-location business (10 Google Business Profiles) consumes 10 Brands. This is where the model bites: the "one profile per network per Brand" rule is a hard architectural constraint, and it is how Metricool monetises multi-location and multi-account clients.

### 3.2 Plan ladder

**USD, monthly billing** (headline rates):

| Plan | Brands | USD / month |
|---|---:|---:|
| Free | 1 | $0 |
| Starter | 5 | $25 |
| Starter | 10 | $45 |
| Advanced | 15 | $67 |
| Advanced | 25 | $107 |
| Advanced | 50 | $210 |
| Custom | 50+ | Sales |

**USD, annual billing** (advertised "from" rates; annual = ~2 months free):

| Plan | Brands | USD / month billed annually |
|---|---:|---:|
| Starter | 5 | $20 |
| Advanced | 15 | $53 |

**EUR, annual billing:**

| Plan | Brands | EUR / month billed annually |
|---|---:|---:|
| Starter | 5 | €16 |
| Starter | 10 | €29 |
| Advanced | 15 | €43 |
| Advanced | 25 | €69 |
| Advanced | 50 | €130 |

> ⚠️ **Currency/billing-cycle inconsistency flagged.** €29 (10 brands, annual) vs $45/mo (10 brands, monthly) do not reconcile at a clean FX rate even after the annual discount. Metricool prices EUR and USD independently rather than converting. Also: **listed prices exclude VAT**; EU buyers pay list + local VAT.
>
> ⚠️ Third-party trackers report a "$22 / $54" pair and a "$20 / $53" pair for Starter/Advanced annual. The $20/$53 pair appears on G2's pricing page and is the more commonly repeated. **Re-verify.**

### 3.3 Add-ons — the hidden cost layer

| Add-on | Price | Scope | Notes |
|---|---|---|---|
| **X / Twitter connection** | **$10 / month per connected X account**, on all paid tiers, **as of 13 July 2026** | Per connected account | Was $5/€5 per month (or $60/€60 per year). **Accounts that activated before July 2026 are grandfathered at the old $5 rate.** X is available on *no* plan without this add-on, including Free. |
| **Advanced Analytics** | From **€10 / $12 per month** on Starter; **€30 / $36 per month** on Advanced & Custom | **Account-level** — applies to every Brand | Unlocks: full **Metricool Studio**, unlimited **Campaign Dashboards**, and "Detailed Analytics" = **extended 30-day post performance** tracking. Premium plans only. Follows the main plan's billing cycle. |
| **Hashtag Tracker** | **€25 per day, per network** — prepaid credit, pay-as-you-go | Per tracking session | Not bundled into *any* plan. See §13.2. |

**The real-cost lesson:** an agency on Advanced/15-brands with Advanced Analytics and 5 X accounts pays $67 + $36 + $50 = **$153/month**, not $67. The headline price is ~44% of the actual bill in that configuration. This is a deliberate, and reasonably aggressive, unbundling strategy.

### 3.4 Free plan — deliberately crippled since January 2026

| Free plan limit | Value |
|---|---|
| Brands | 1 (cannot create or delete additional) |
| Connections | 1 profile per network within that Brand |
| Posts per month | **20** |
| Analytics history | **30 days** (cut from 3 months in the **January 2026** free-tier reduction) |
| Competitors | 5 per network (2 on YouTube, not expandable) |
| AI credits | 5 per brand / month |
| LinkedIn | ❌ Excluded |
| X / Twitter | ❌ Excluded (paid add-on only) |
| PDF/PPT report download | ❌ |
| Custom report templates | ❌ |
| SmartLinks | ❌ |
| Hashtag finder | ❌ |
| Post library | ❌ |
| Canva, Google Drive integrations | ❌ |
| Looker Studio | ❌ |
| Make / Zapier | ❌ |
| CSV download | ❌ |

The January 2026 cut (3 months → 30 days of history) is the single most-cited grievance in recent user commentary and is a clear signal Metricool is squeezing the free tier to drive Starter conversion.

### 3.5 Feature gating matrix

| Capability | Free | Starter | Advanced | Custom |
|---|:--:|:--:|:--:|:--:|
| Brands | 1 | 5–10 | 15–50 | 50+ |
| Users / seats | 1 | Unlimited | Unlimited | Unlimited |
| Posts / month | 20 | Unlimited | Unlimited | Unlimited |
| Analytics history | 30 days | **Unlimited** | **Unlimited** | **Unlimited** |
| Competitors per network | 5 (YT: 2) | 100 (YT: 10) | 100 (YT: 10) | 100 (YT: 10) |
| LinkedIn | ❌ | ✅ | ✅ | ✅ |
| X / Twitter | ❌ | Add-on | Add-on | Add-on |
| Full X analytics (not just planner-published posts) | ❌ | ❌ | ✅ | ✅ |
| PDF / PPT reports | ❌ | ✅ | ✅ | ✅ |
| **Custom report templates** | ❌ | ❌ | ✅ | ✅ |
| Scheduled report email delivery | ❌ | ✅ | ✅ | ✅ |
| **Looker Studio connector** | ❌ | ❌ | ✅ | ✅ |
| SmartLinks | ❌ | ✅ (unlimited) | ✅ | ✅ |
| Team / client user management | ❌ | ❌ | ✅ | ✅ |
| Approval workflows | ❌ | ❌ | ✅ | ✅ |
| **Public API access** | ❌ | ❌ | ✅ | ✅ |
| Endpoint-inspector tool | ❌ | ❌ | ✅ | ✅ |
| Zapier / Make | ❌ | ✅ | ✅ | ✅ |
| **White Label (WLA)** | ❌ | ❌ | ❌ | ✅ |
| MCP server | ✅ | ✅ | ✅ | ✅ |
| Historical data re-sync request via chat | ❌ | ✅ | ✅ | ✅ |

Two gates deserve emphasis because they are the commercial hinges:

- **Looker Studio + API + approvals + team management all sit at Advanced.** That is the "agency wall," and it is why Advanced is the plan everyone in this segment actually buys.
- **White Label is Custom-only.** There is no self-serve white label at any published price.

---

## 4. The data model — User → Brand → Profiles

```
User (account, billing, plan, API token, AI credits at brand level)
 └── Brand  ← the unit of pricing, permissions, inbox, analytics, planner
      ├── exactly ONE profile per platform
      │    Facebook Page | Instagram | Threads | Bluesky | X | TikTok |
      │    LinkedIn (Page or personal) | Pinterest | YouTube | Twitch |
      │    Google Business Profile
      ├── Ad accounts: Meta Ads | Google Ads | TikTok Ads
      ├── Web/blog property (Metricool's own JS tracker, and/or Google Analytics)
      ├── Competitors (up to 100/network; 10 YouTube)
      ├── SmartLinks (unlimited on premium)
      └── Autolists (up to 200 posts each)
```

**Critical property:** the Brand is the analytics join key. Everything — reports, Looker data sources, Campaign Dashboards, MCP calls (`blogId`), API calls (`blogId`) — is keyed to a Brand. Internally the Brand is still called a **"blog"** (`blogId`), which is a fossil from Metricool's origin as a blog-analytics product and a nice tell about the company's actual lineage.

**Consequence for the inbox:** because the Brand is the scope boundary, **there is no cross-brand unified inbox.** You must switch Brands from the top selector to see each client's messages. For an agency with 25 clients this is a serious workflow defect (see §10).

---

## 5. Analytics — the core engine

### 5.1 Product architecture

Metricool's analytics surface is five distinct products sharing one warehouse:

| Surface | What it is | Plan |
|---|---|---|
| **Analytics** (per-network dashboards) | Native in-app dashboards, one per connected network + web + ads | All |
| **Summary / Brand Summary** | Cross-network roll-up: followers, impressions/views, interactions, posts, ad impressions/clicks/CPM, on one page | All |
| **Reports** | PDF / PPT generator, templated, schedulable by email | Paid |
| **Metricool Studio** | AI reporting engine → "Analytics Views" and "Calendar Views", natural-language or guided | Advanced Analytics add-on |
| **Campaign Dashboards** | Groups organic posts + paid campaigns into one campaign object, shareable read-only link | Advanced Analytics add-on |
| **Looker Studio connector** | First-party BI feed, 14 channels / 25+ data sources | Advanced+ |

In **May 2026** these were consolidated under a single new **"Reporting" section** (Reports + Campaign Dashboards + Metricool Studio + Looker Studio sharing one home) — a strong signal that reporting, not publishing, is where Metricool believes its moat is.

### 5.2 Analytics section structure (per network)

Using Instagram as the reference implementation, the dashboard decomposes into sub-tabs:

- **Summary** — account-level metrics for the period. Views (total), average reach/day, accounts engaged as line charts; total content as bar charts.
- **Account / Visibility** — visibility breakdowns as provided by the Instagram API (where views come from).
- **Profile activity** — actions taken on the profile: button taps, contact actions.
- **Posts** — organic summary; **promoted/paid data appears only if a Meta Ads account is connected**.
- **Reels** — organic summary + promoted breakdown (Ads connection required).
- **Stories** — **organic only**, no paid breakdown.
- **Hashtags** — hashtag performance on own content.
- **Demographics** — gender, age, followers by country and city; chart or table.

> **Forensic detail worth stealing:** *"Demographics always reflect the current state of your audience, regardless of the date range selected; historical data is not available for this section."* Metricool explicitly documents that demographics are a **snapshot, not a time series**. Most competitors silently render demographics inside a date-filtered report and let the client assume it is historical. Metricool labels the trap. That is a maturity signal.

> **Second forensic detail:** in **April 2026** Metricool added an **info icon on columns carrying cumulative metrics** to stop users confusing lifetime totals with the selected date range. Again: they are treating metric-definition ambiguity as a product problem. This is exactly the class of thing that makes agencies trust the numbers.

### 5.3 Metric inventory by network

#### Instagram
| Group | Metrics |
|---|---|
| Account | Followers, follower balance, Views, average reach/day, accounts engaged, total content, profile activity (button/contact taps), visibility breakdowns |
| Posts | Impressions, Reach (unique — explicitly documented as distinct from impressions), Saves, Shares, Interactions, Engagement rate |
| **Reels** | Plays, Impressions, Engagement, Saves, Shares, **Average watch time**, **Duration**, **Retention %** (= avg watch time ÷ duration × 100), **View rate %** (share of viewers past 3 seconds), **Reposts** |
| Stories | Organic only. Replies (DM responses triggered by the Story), Sticker taps (polls/quizzes/question boxes), plus standard reach/impressions |
| Demographics | Gender, age, followers by country, followers by city (snapshot) |
| Hashtags | Performance of hashtags on own posts |

**The four Reels metrics — Duration, Retention %, View rate %, Reposts — shipped in January 2026.** This is the sharpest example of Metricool's analytics lead. Retention % and 3-second view rate are the two numbers that actually predict Reels distribution, and most SMB-tier tools still show plays and likes.

#### Facebook
Reach (organic + paid combined), Views (plays ≥3s or near-complete for short videos), Video views (de-duplicated — repeat views excluded), Page visits, Posts, Likes (page likes at period end), Followers (at period end), Interactions (organic likes + comments + saves), Engagement.
Looker adds: **Daily avg reach per reel, Reels Interactions, Reels Engagement, Reels Aggregated Reach, Reels Aggregated Engagement.**

#### LinkedIn
- **Company Pages:** Impressions (total displays), Interactions (reactions + comments + **clicks** + shares), followers, engagement. **Demographics: % of followers by country, region, industry, and job function** — chart or table. *Demographics render only if the LinkedIn API supplies them; the section disappears otherwise.*
- **Personal profiles:** ⚠️ **post-level metrics only exist for content published via Metricool**, because of LinkedIn API limitations. This is a genuine data hole for personal-brand clients.

#### X / Twitter
Requires the paid add-on. On **Starter**, the post list shows **only posts published through the Metricool planner**. **Full X analytics require Advanced or Custom.** Publishing supports threads up to **80 posts** and up to **20 images/videos/GIFs**.

#### TikTok
Impressions, video views, audience growth, engagement, best personalised posting hours (from TikTok's API, account-specific for Business accounts), format performance, conversions. Advanced TikTok analytics added January 2026; further TikTok analytics improvements in March 2026.

#### YouTube
Views (period), subscribers (period), **Watch time** (total viewing time), **Average view duration** (total play time ÷ views), Shorts vs long-form side by side, engaged views. Comments on both long-form and Shorts flow into the Inbox.

#### Twitch — the differentiator nobody else has
| Group | Metrics |
|---|---|
| Community | Followers (period end), **Balance of followers** (gains/losses, with each unfollow-then-refollow counted separately) |
| Subscriptions | Subscribers (period end), **Subscribers by Tier (Tier 1 / Tier 2 / Tier 3)**, **gifts received**, videos posted |
| Streams | Total views across videos in period, **Total stream duration** |
| Competitors | Followers, videos, **clips created**, views |

Tier-1/2/3 subscriber breakdown and gift-sub counts are *monetisation* metrics. No mainstream SMM tool tracks these.

#### Threads, Bluesky, Pinterest, Google Business Profile
All four are first-class analytics sources and all four flow to Looker Studio.
- **Bluesky:** ⚠️ documented hard limit — *"the API does not provide an impressions metric, so engagement isn't calculated."* Follower counts also cannot be known prior to connection date.
- **Google Business Profile:** reviews land in the Inbox and are replyable.

#### Ad accounts (Meta / Google / TikTok)
Per campaign: name, network, last update date, **impressions, clicks, CPM, CPC, total spend, conversions** (conversion definition inherited from the Meta pixel configuration). Budget editing (daily and lifetime, at campaign or ad-group level) from inside Metricool.

#### Web / blog
Metricool's **own JavaScript tracker** (see §14) plus optional Google Analytics connection.

### 5.4 Historical depth & data retention — the critical angle

This is the question the brief asked to interrogate, and Metricool's answer is unusually well documented.

**The rule:**
> *"Generally, networks provide data from January 1st of the previous year to the connection date. Metricool will make the request, and it will be the API of each social network that provides the maximum available data."*

So on connection, Metricool performs a **maximal historical backfill** bounded by what each platform API will surrender — typically back to 1 January of the prior calendar year (i.e. 13–24 months of backfill depending on when you connect).

**Documented backfill exceptions:**

| Network | Backfill limit |
|---|---|
| **Pinterest** | **90 days** only |
| **YouTube** | **30 days** only |
| X, TikTok, Instagram, Threads, Bluesky — **follower counts** | ❌ Cannot be known before connection date |
| YouTube — **subscriber counts** | ❌ Cannot be known before connection date |
| Instagram — **Stories** | ❌ Cannot be known before connection date |
| **Newly-added metrics** | Recorded from *whichever is later*: the date the metric was added to Metricool, or the account's connection date |
| Instagram **demographics** | Snapshot only — no history at all |

**Going forward — the actual moat:**
- Paid plans = **unlimited analytics history**. Metricool does not roll data off.
- **Disconnecting a network does not delete synced data.** History, past posts and metrics stay in Metricool and reappear on reconnection *to the same Brand*.
- Gaps during a disconnection are **not backfilled** for the metrics that can't be historically fetched (Instagram followers, Instagram Stories).
- **Deleting a Brand destroys its data.** And if you need to swap which accounts a Brand contains, Metricool's documented guidance is *delete the Brand and create a new one* — which means **the "switch this client's accounts" operation is a data-loss event.** This is a real architectural sharp edge.
- **Changing the Instagram connection method** (Instagram-login ↔ Facebook-login) **loses the prior history**, because Meta treats them as two separate APIs with non-shared data. Documented explicitly.
- **Premium accounts can request a historical re-sync via support chat.** Free accounts cannot.

**Competitor history:** on connecting a competitor you get their posts **from the 1st of the previous month**; premium plans can sync up to **300 posts** of their historical posts.

#### How does this stay inside platform data-retention terms?

**This is the part I could not fully verify and it matters.** Here is what is establishable and what is not:

**Establishable:**
- Metricool is a documented official partner of Meta and Google, and is authorised by X, TikTok, LinkedIn and Pinterest. Partner status is what buys elevated API tiers and, in Meta's case, is a prerequisite for holding aggregated insights.
- The privacy policy commits to deleting personal data at end of service; deleting the account "permanently delete[s] your account and all analytical data from all Brands, as well as personal data."
- Access to a Brand's social personal data persists only "as long as the hiring of Metricool services for that specific Brand is in force."
- The web tracker is designed to be defensible: **no cookies**, country inferred from IP, records URL only.

**The reconciliation — my reading, marked as analysis not fact:**
Metricool's "unlimited history" is almost certainly lawful because of a distinction most people miss: **platform terms restrict retention of *user-level personal data* and *content*, not the *aggregate metric time-series you derived while authorised*.** Meta's Platform Terms require deletion of Platform Data when it is no longer needed or on request, but explicitly carve out data that has been **aggregated, de-identified or anonymised** such that it can no longer be associated with a user. A row of `(brand_id, date, reach, impressions, interactions)` is a derived aggregate about *the client's own asset*, not about identifiable third parties.

The observable design is consistent with exactly this:
- **Aggregate time-series** (reach, impressions, followers, engagement) → retained indefinitely.
- **Person-level data** (comments, DMs, commenter identities) → **not** retained as an archive. The Inbox is a live API window, and it is bounded by the platform's own rules: **Facebook/Instagram comments replyable only within 24 hours; DMs within 7 days.** There is no searchable historical conversation archive. That is not a missing feature — **it is the compliance boundary made visible in the product.**
- **Demographics** → snapshot only, no history, because these are audience-composition aggregates Meta refreshes rather than versions.

> **UNVERIFIED:** I could not reach Metricool's Legal Terms, Privacy Policy or any DPA/sub-processor page directly. I found **no evidence** of SOC 2 Type II or ISO 27001 certification for Metricool itself; searches returned only generic AWS compliance material. **Assume no published SOC 2 / ISO 27001 until proven otherwise** — this is a likely procurement blocker for enterprise buyers and a real opening for a competitor.

### 5.5 Where Metricool's analytics are genuinely deeper than Sprout / Hootsuite

Not "cheaper for the same" — actually *deeper*:

| Dimension | Metricool | Sprout Social / Hootsuite |
|---|---|---|
| **Retention** | Unlimited history from $20/mo | Sprout's deeper historical reporting sits in Premium Analytics; Hootsuite gates history by tier |
| **Reels-level video mechanics** | Duration, **Retention %**, **3-sec View rate %**, Reposts, avg watch time | Generally plays/reach/engagement; retention-curve proxies typically absent at comparable tiers |
| **Paid + organic in one object model** | Meta/Google/TikTok Ads native — same dashboard, same reports, same BI feed, same Campaign Dashboard | Sprout paid reporting is narrower and pricier; Hootsuite's ad module is a separate product lineage |
| **BI export** | First-party Looker Studio connector, **included at Advanced ($53–210/mo)** | Sprout/Hootsuite push you to CSV, or to premium analytics tiers, or to a third-party ETL |
| **Channel long tail** | **Twitch with subscriber tiers and gift subs**, Threads, Bluesky, GBP reviews, **first-party web analytics** | Twitch absent; web analytics absent |
| **Competitor breadth** | **100 competitors per network** (10 YouTube) included | Sprout's competitive reports are far more limited in count and gated higher |
| **Benchmarks** | Annual large-N studies (2.3M+ TikTok posts) wired back as in-product benchmarks | Sprout has industry benchmarks; Hootsuite thinner |
| **Metric honesty** | Documents snapshot-vs-timeseries, cumulative-vs-period, reach-vs-impressions, per-network API holes | Less explicit |
| **Cost of the same job** | ~$153/mo, 3 users, 10 brands | ~$1,197/mo Hootsuite Advanced; Sprout $249+/seat |

**Where Sprout/Hootsuite still genuinely beat it:** social listening (Sprout Listening / Hootsuite+Talkwalker are real products; Metricool has effectively none — see §13), inbox as a support desk (Sprout's Smart Inbox, CRM integrations, case management, SLA reporting), enterprise governance (SSO, audit, approval depth), and published security certifications.

---

## 6. Competitor analysis

| Parameter | Value |
|---|---|
| Competitors per network — **Free** | 5 (**YouTube: 2, not expandable**) |
| Competitors per network — **Paid** | **100** (**YouTube: 10**) |
| Networks supported (Free + Paid) | Facebook, Instagram, **Threads**, **Bluesky**, **Twitch** |
| Networks supported (Paid only) | YouTube, **X** (X also requires the paid add-on) |
| **TikTok competitor tracking** | ❌ **Not available** — API restriction. A real gap. |
| LinkedIn competitor tracking | ❌ Not available |
| Backfill on adding a competitor | Posts from the **1st of the previous month** |
| Historical post sync (premium) | Up to **300 posts** of the competitor's history |
| Export | CSV download of competitor tables |

**Metrics captured per competitor:** total followers, posts and Reels published, average likes per post, average comments per post, engagement, **Average Interactions** (reactions + comments + shares across posts), **Engagement Rate** (avg interactions ÷ total followers × 1,000 — note the ×1,000 normalisation, an unusual and non-standard formulation worth noting if you're building parity).

**"More Statistics" view per competitor:** follower growth chart overlaid with content published, likes growth, interactions evolution over time, and a **full post list with date, reactions, comments, shares and engagement**.

**Assessment:** 100 competitors per network at $20/mo is absurd value and is genuinely category-leading on *breadth*. The depth is shallower than a dedicated competitive-intelligence tool (no share-of-voice, no content-theme clustering, no paid-creative library), and the **TikTok and LinkedIn holes are significant** — those are the two networks agencies most want competitive data on in 2026.

---

## 7. Reporting stack — the real differentiator

### 7.1 Classic Reports (PDF / PPT)

| Attribute | Detail |
|---|---|
| Output formats | **PDF** and **PPT** (PowerPoint) |
| Plan | Paid only (Free cannot download) |
| Content selection | Choose networks; choose which **pages/sections** per network; set **table sort field**; set **max rows per table** |
| Summary section | Adapts to selection — leave the network filter empty for an all-platforms summary, or scope to specific networks |
| Branding | Client logo upload |
| **Scheduled email delivery** | ✅ Add recipient emails + the day the report auto-sends, plus custom notes |
| Delivery frequency | ⚠️ **CONFLICTING.** One source: monthly ("add the scheduled day"). Another: daily / weekly / bi-weekly / monthly / quarterly. **UNVERIFIED — assume monthly is certain, richer cadences unconfirmed.** |
| Recipient limit | **UNVERIFIED.** (Separate feature: the automatic "monthly summary" is limited to **one** email address; scheduled Reports support multiple.) |
| CSV | Data also downloadable as CSV on paid plans |

### 7.2 Custom report templates — **Advanced & Custom only**

Templates are **saved per Brand** and selected at generation time. Three configurable sections:

1. **Pages & Sections** — expand each social network, tick the pages to include. Each section shows a counter of selected pages; a section with 0 selected greys out and is inactive.
2. **Background & Logo** — report logo, cover background, body background, title.
3. **Colours** — report colour scheme.

This is *template-level* white-labelling — your logo and colours on Metricool's report chassis. It is **not** full white label; that is Custom-tier only (§17).

### 7.3 Metricool Studio — AI reporting engine (Advanced Analytics add-on)

Turns social data into **Analytics Views**. Two authoring modes:

- **"Prompt from scratch"** (formerly *Expert mode*) — natural-language instructions.
- **"Step-by-step"** (formerly *Guided mode*) — build by selecting from options.

Output: a complete view in seconds with **charts, data tables and AI-generated insights**. Example prompts documented: comparing performance across platforms; finding average CPC across all active campaigns; competitor analyses; month-over-month vs same period last year.

Also generates **Calendar Views** — plan and schedule content for **one or multiple Brands simultaneously**.

**Sharing: public link, no Metricool account required for the viewer.**

### 7.4 Campaign Dashboards (Advanced Analytics add-on)

The strongest conceptual idea in the product: **a campaign is a first-class object that spans organic and paid.**

| Setup field | Detail |
|---|---|
| Campaign name | **Required** — used to auto-suggest relevant posts, so it must be descriptive |
| Description | **Required** — shown in the shared client view |
| Date range | Defines post eligibility. **Maximum period: 90 days** |
| Networks & ad platforms | Select only relevant channels |

**Post inclusion is dual-mode:** (a) **tag content while scheduling** and it is auto-included; (b) Metricool **auto-suggests posts** by semantic match against campaign name + description. Both organic posts and paid ad campaigns can be attached.

**Output:** content summary with chart, **top 5 posts by social metric**, AI-generated insights.
**Sharing:** read-only live link for clients, **no account required**, with a **custom logo per Brand**.

### 7.5 Looker Studio connector — deep dive (**Advanced & Custom only**)

This is the feature agencies name when asked why they picked Metricool. Anatomy:

**Coverage — 14 channels:**
Facebook · Instagram · Threads · Bluesky · X · TikTok · LinkedIn · Google Business Profile · Pinterest · YouTube · Twitch · **Facebook Ads · Google Ads · TikTok Ads**
Plus: **SmartLinks data**, and web/blog data.
**25+ data sources** available in total.

**The "Smart Connector":**
- Create **one data source spanning all platforms for a Brand** — every field from every network in a single source — or scope it to a single platform (still with full Smart Connector power).
- **Brands can be auto-combined by pattern**, so the data source updates itself as the agency's client roster changes. *This is the killer agency feature:* you build the dashboard once, name your Brands consistently, and new clients appear without touching Looker.
- Option to **exclude ads metrics/dimension groups** or **include organic only**.

**Field organisation:** all dimensions and metrics are grouped into **four root blocks**, where the "root" is the text before the `>` in the field name (e.g. `Instagram Evolution > Posts Interactions`, `Facebook Evolution > Daily Avg reach per reel`). Fields are grouped by root so compatible dimensions and metrics can be picked together without producing invalid combinations.

**Auth:** an **access token / API key** from account settings.

**Maintenance realities (from the connector changelog and "Upgrade Considerations"):**
- New fields do **not** appear automatically. You must: *Resource → Manage added data sources → Edit Data source → **Refresh Fields** → Continue*.
- **Renames break charts.** Documented example: `Instagram Evolution > Interactions` was renamed to `Instagram Evolution > Posts Interactions`. Looker interprets the old metric as disappeared and creates a new one with the same name; **charts using the old field stop working**. Metricool's own advice is to *copy the report first* so you have a reference to rebuild from.
- **Ratio fields were re-engineered.** CTR and Facebook Ads ROAS are now computed **in Looker as post-aggregation formulas** rather than pre-aggregated — the correct approach (avoids averaging averages), but it **requires a field refresh and may break existing charts**.
- Performance: charts now load **30–80% faster** (recent changelog).
- Recent additions: Facebook Evolution `Daily Avg reach per reel`, `Reels Interactions`, `Reels Engagement`, `Reels Aggregated Reach`, `Reels Aggregated Engagement`.

**Why agencies love it — the honest analysis:**
1. **It is included, not metered.** No per-row or per-connector ETL bill. Compare: Supermetrics/Windsor.ai/Funnel charge per data source per month, easily exceeding Metricool's entire subscription.
2. **It is first-party.** Metricool has already done the hard part — normalising 11 social APIs + 3 ad APIs into a consistent schema with a consistent date grain and consistent naming roots. You are buying the semantic layer, not the pipes.
3. **It carries the retention.** Because Metricool never rolls off history, the Looker feed can serve year-over-year comparisons that the underlying platform APIs *cannot* answer directly. **Metricool becomes the client's social data warehouse.** That is the real lock-in — churning means losing the history.
4. **Pattern-based brand grouping** makes one dashboard template serve an entire client book.
5. **Organic + paid in one source** means blended CPM/CPE/ROAS charts without a join.

**Why it frustrates them:** it is a Looker *connector*, not a warehouse — no SQL, no custom joins to CRM/revenue data, subject to Looker's own aggregation quirks, and **schema changes silently break production client dashboards**. Any competitor building here should note: **schema stability is the unmet need**, not more fields.

---

## 8. Planning & calendar

| Feature | Detail |
|---|---|
| Calendar | Drag-and-drop; click into content to edit |
| Per-platform preview | Preview each post as it will appear on each network |
| **Best-time heatmap** | Overlaid on the calendar, per platform (see §9.3) |
| Drafts & Notes | Both supported, for organising the calendar |
| **Post templates** | Save ready-to-use post templates and texts |
| **Post library** | Paid only |
| **Bulk CSV import** | Import from the calendar **for one or several Brands at once**, or from the Autolists section |
| Calendar CSV export | Planning → Calendar → export |
| **Cross-brand duplication** | Duplicate content across Brands |
| **Calendar Views (Studio)** | Plan and review scheduled content across one or more Brands; shareable |
| Recurring posts | Supported |
| **Auto-save** | **Post settings auto-save every 30 seconds** (shipped January 2026) |
| Calendar sharing with clients | Shareable calendar link |

The **multi-brand CSV import** and **cross-brand duplication** are quietly important agency features — most tools make you import per-workspace.

---

## 9. Publishing

### 9.1 Networks & formats

**Networks:** Instagram, Facebook, TikTok, YouTube (incl. Shorts), LinkedIn (Pages + personal), X, Threads, Bluesky, Pinterest, Google Business Profile, Twitch (cross-promotion).

**Formats:** images, videos, **carousels**, **Stories**, **Reels**, **threads**.

**Instagram specifics — genuinely deep:**
- **Mixed-format carousels** (images + video in one carousel), provided all assets share the same aspect ratio, within **3:4 to 16:9**
- **Up to 5 collaborators** taggable
- **Product tagging**
- **Add audio to Reels from Metricool's library**; **edit the displayed audio name**
- Choose **whether Reels appear in the main feed**
- **Trial Reels** scheduling with trending audio (shipped May 2026)

**TikTok specifics:** schedule with **trending TikTok music** — access to the **100 most popular TikTok songs, filterable by country and genre** (shipped February 2026).

**X specifics:** threads up to **80 posts**; up to **20 images/videos/GIFs**.

**Media handling:**
- Recommended encode: **audio 128 kbps**, **video 5,000–25,000 kbps** — stated as compatible with all networks
- **Automatic conversion of unsupported image formats to JPG** (January 2026)
- Video editing on **web only**; mobile app has image editing only

### 9.2 Autolists (evergreen recycling)

| Attribute | Value |
|---|---|
| Concept | A list of posts that publishes automatically on a set frequency |
| Order | Publishes in the order you set |
| Default behaviour | Post is **removed** from the list once published |
| **Repeat mode** | Makes the list **circular** — a published post moves to the end and runs again later |
| **Hard cap** | **200 posts per autolist**; anything beyond that will not publish |
| CSV import | Supported directly into autolists |
| Known defect | Carousel uploads into autolists are error-prone (recurring user complaint) |

### 9.3 Best-time-to-post heuristic — read this carefully

Metricool renders a **colour-coded heatmap** — darker = higher concentration of active followers, lighter = least activity — with **numeric percentages** of followers active per slot. Available for Facebook, Instagram, TikTok, YouTube and others. **Exact percentages are web-only; the mobile app omits them.**

**The methodology caveat, in Metricool's own documentation:**
> *"Best times are calculated by analysing the time slots when your followers post, not your own posts."*
and
> *"The 'best times' are not calculated based on your active followers but on the time slots with the highest activity on each social network."*

These two statements are not identical and the documentation is genuinely ambiguous. What is clear:

- **TikTok Business accounts** → uses **TikTok's API audience-activity data, specific to your account**. Genuinely personalised.
- **Instagram via Facebook connection** → **audience-specific** stats.
- **Instagram via direct Instagram login** → **generic behaviour-based estimate**, not your audience.

**Verdict:** the heuristic is *audience-activity-based, not conversion-based*. It answers "when is my audience awake," not "when does my content perform best." A competitor could beat this outright with a **posterior-performance model** (regress your own historical reach/engagement against publish hour) and it would be a defensible claim.

### 9.4 Publishing reliability — the weak flank

See §20. Double-posting, silent account disconnections and "errors non-stop when it comes to posting" are the most damaging recurring complaints, and they attack the one part of the product where failure is publicly visible to the client.

---

## 10. Inbox

| Network | Comments | DMs | Reviews |
|---|:--:|:--:|:--:|
| Facebook | ✅ | ✅ | — |
| Instagram | ✅ | ✅ (main inbox) | — |
| TikTok | ✅ (**Business accounts only**) | ❌ | — |
| X | ❌ | ✅ | — |
| LinkedIn | ✅ (**company profiles only**) | ❌ | — |
| YouTube | ✅ (long-form **and** Shorts) | ❌ | — |
| Google Business Profile | — | — | ✅ **Reviews** |
| Threads / Bluesky / Pinterest | ❌ | ❌ | — |

**Organisation:** filter by type (comments vs private messages), by platform, or by user.

**Hard limitations — all documented, all API-imposed:**
- ❌ **No cross-brand unified view.** You must switch Brands via the top selector. **For a 25-client agency this is the single biggest workflow defect in the product.**
- ❌ **Cannot reply to comments received on ads** (API restriction).
- ⏱ **Facebook & Instagram: comments replyable only within 24 hours**; **DMs within 7 days.**
- ❌ No conversation archive, no case/ticket model, no SLA reporting, no assignment/queue, no CSAT, no CRM linkage.

**Adjacent:** **DM Automation** exists — keyword-triggered auto-DMs, story-mention replies, comment-triggered responses (giveaway/launch flows), built on Meta's approved APIs as an official Meta Business Partner. Depth of the rules engine is **UNVERIFIED**.

**Verdict:** the Inbox is a *response tool*, not a *service desk*. It is materially behind Sprout's Smart Inbox and behind dedicated social-CX tools. It is also, per §5.4, exactly what platform data-retention terms permit without an archive licence — so the shallowness is at least half deliberate.

---

## 11. Ads integration — deeper than expected

Metricool does **management**, not just reporting, on three ad platforms: **Meta/Facebook Ads, Google Ads, TikTok Ads**.

### Reporting layer
Unified dashboard across Google, Facebook/Instagram and TikTok. Per campaign: **name, network, last update date, impressions, clicks, CPM, CPC, total spend, conversions** (conversion definition inherited from the Meta pixel setup). Rolls into **Brand Summary** alongside organic (followers, impressions, interactions) on one screen.

### Creation & management layer
| Capability | Detail |
|---|---|
| Objectives | Set campaign objective — traffic, conversions; filterable by Reach / Conversions / Registrations |
| Audience | Demographics, interests, behaviours; **gender, age, language**, interest selection. **For campaigns spanning Google and Meta, the audience is configured separately per platform.** |
| Budget | **Daily average budget**; **manual or automatic bid cap**; edit **daily and lifetime budget at campaign or ad-group level** by clicking the amount |
| Creative | Ad design within Metricool |
| Pre-launch | **Full campaign summary page** — configuration, targeting, design, budget — before going live |
| Analytics linkage | Connecting the Meta Ads account unlocks **promoted-data breakdowns inside Instagram Posts and Reels analytics** |
| Campaign Dashboards | Ad campaigns attach to campaign objects alongside organic posts |
| Looker | Facebook Ads, Google Ads and TikTok Ads are all first-class Looker data sources; Facebook Ads **ROAS** and **CTR** are provided as post-aggregation formulas |

**How deep is "deep"?** It is a **simplified campaign builder**, not Ads Manager. You get objective, basic demographic/interest targeting, budget, bid mode and creative. You do **not** get: custom/lookalike audience management, placement-level control, A/B test frameworks, catalogue/DPA setup, or advanced bid strategies. It is aimed at an SMB or a generalist agency running straightforward awareness/traffic/conversion campaigns.

**But the integration into analytics is the real prize.** Because ads live in the same object model, Metricool can do things Sprout cannot cheaply do: blended organic+paid campaign reports, paid-vs-organic reach attribution on the same Instagram post, and a single Looker source with both. **This is the most under-appreciated part of the product.**

---

## 12. SmartLinks (link-in-bio) — Premium only

| Attribute | Detail |
|---|---|
| Quantity | **Unlimited SmartLinks** on premium plans |
| Plan | ❌ Not on Free |
| Content blocks | Custom links, **videos**, images, contact icons, **multiple pages**, widget embeds, media embeds |
| **YouTube auto-feed** | Connect a **YouTube channel or specific playlist**; videos populate automatically via an **"Add from YouTube"** button (shipped **April 2026**) |
| Styling | Fonts, colours, buttons, backgrounds, **animations** |
| Analytics | **Clicks, status, CTR** per link |
| Export | **Full CSV export** from the SmartLink's Analytics tab |
| **BI** | **SmartLinks data is a Looker Studio data source** — combinable with social data in one dashboard |
| Mobile | Create and manage SmartLinks from the mobile app |
| Custom domain | **UNVERIFIED** |
| A/B testing | **UNVERIFIED — no evidence found** |
| Pixel/retargeting support | **UNVERIFIED** |

**The strategic point:** SmartLinks flowing into Looker Studio means Metricool can show a client *post → click → destination* in one chart, using a link property Metricool controls. Linktree cannot do that; Sprout does not have a link-in-bio at all. It is a small feature doing disproportionate work in the reporting story.

---

## 13. Brand monitoring & hashtag tracking

### 13.1 Brand monitoring / listening — **weak, and it is the biggest hole**

There is **no dedicated social-listening product**. What exists:

- **Keyword/mention tracking is delivered *through* the Hashtag Tracker**, and only on **X and Instagram**.
- On **X**: track a **hashtag** (`#`), a **keyword** (no `#` — also catches the hashtag form), or an **account** (`@`), with **7 days of lookback**. Multiple terms can run in one session but **the data is combined**, not separated.
- On **Instagram**: **one hashtag per session**, tracking starts **from the day you set it up** (no lookback), and counts the hashtag **in feed posts and Reels only — not Stories**.

**Not present:** no cross-web/news/forum/blog monitoring, no sentiment analysis, no share-of-voice, no alerting, no Reddit/YouTube/TikTok listening, no crisis detection, no author/influencer identification.

**Verdict: this is a genuine, exploitable gap.** Metricool users who need listening buy Brand24/Mention/Talkwalker alongside. Sprout and Hootsuite beat Metricool decisively here.

### 13.2 Hashtag Tracker — a strange, honest pay-as-you-go product

| Attribute | Value |
|---|---|
| Bundled in any plan? | ❌ **No.** Not included in Free, Starter, Advanced or (apparently) Custom |
| Price | **€25 per day, per social network** |
| Purchase model | **Prepaid credits / balance**, consumed per session-day |
| Networks | **X and Instagram only** |
| **X requires** | The paid **X add-on** on top |
| Session setup | Enter tag → pick network (X, Instagram, or both) → set start date and duration → confirm |
| Refresh cadence | **Auto-updates every 8 hours**; **manual refresh up to 3× per day** |
| Volume cap — X | **25,000 posts** per day of balance, for one hashtag |
| Volume cap — Instagram | **10,000 posts** per day of balance |
| Dual-network cost | Running X + Instagram simultaneously consumes **2 days of balance per day monitored** |
| Free tier | Hashtag **finder** excluded from Free entirely |

**Assessment:** the metering is transparent and the unit economics are obviously passed through from X's API costs. But €25/day/network is expensive for what it is, and the design — one hashtag per Instagram session, no lookback, combined results on X — makes it a **campaign/event measurement tool**, not a monitoring tool. Good for "measure our conference hashtag for 3 days." Useless for "tell me when someone complains about us."

---

## 14. Web analytics integration

Two distinct things, often confused:

**(a) Metricool's own first-party web analytics**
- A **lightweight JavaScript snippet** installed on the site/blog, sending visit data asynchronously to Metricool's servers.
- **No cookies.**
- Country inferred from **IP address**.
- Records **page viewed (URL)**.
- **Starts collecting from installation — cannot recover past data.**
- Unique visits identified **mainly via IP**.
- Installable on **WordPress, Shopify, Joomla, Wix** and via raw snippet.

**(b) Google Analytics connection** — GA/GA4 data can be brought into the Brand.

**Metricool documents the discrepancy between the two, candidly:**

| Behaviour | Metricool | GA4 |
|---|---|---|
| Identification | IP-based | Cookies, user IDs, ML modelling for gaps |
| Session boundary | Multiple visits from one IP in a short window may collapse into a **single session** → **lower session counts than GA** | Session ends after 30 min inactivity or at midnight |
| Bot filtering | Not described | Automatic |
| Ad-blockers (uBlock, Ghostery, Brave) | Metricool's script **may still be received** | GA script commonly **blocked** |

**Why this matters strategically:** it is a **cookieless, IP-based, privacy-forward tracker**. For EU agencies fighting cookie-consent attrition, having a no-cookie visitor count that survives ad-blockers *inside the same report as social* is a real selling point. It is also the origin story of the product — hence `blogId`.

---

## 15. Twitch & YouTube — the long-tail bet

Covered in §5.3. The strategic read:

- **Twitch** is a channel effectively no mainstream SMM tool supports. Metricool tracks **Tier 1/2/3 subscribers, gift subs, stream duration, and competitor clip counts** — creator-economy monetisation metrics. It costs Metricool little (Twitch's API is generous) and buys it the entire streamer/creator-agency segment plus differentiation in every feature comparison table.
- **YouTube** gets watch time and average view duration (the two metrics that matter), Shorts-vs-long-form side-by-side, and comment management for both formats. But **YouTube backfill is only 30 days** and **subscriber history cannot predate connection** — so the "unlimited history" promise is weakest exactly where clients most want year-over-year.

---

## 16. Team, clients & agency features

### Roles
Predefined: **Analyst, Editor, Admin/Manager, Content Creator, Client** — plus **fully custom roles** via "+ Add role".

| Role | Capabilities |
|---|---|
| **Manager/Admin** | Full access: scheduling, reports, inbox, ads, SmartLinks, permissions |
| **Editor** | Schedule posts, reply to messages, update SmartLinks, create ad campaigns |
| **Content Creator** | Editor + can send content for review |
| **Analyst** | **Read-only**: analytics, reports, SmartLinks, ads, planning |
| **Client** | Analyst + **can approve or reject posts** before publication |

### User management
- **Unlimited users** on qualifying plans.
- Users can be granted access to **one or multiple Brands**.
- ✅ **A user can hold a different role per Brand** — full access on one client, restricted on another. This is properly designed multi-tenant permissioning and is better than most tools at this price.

### Approval workflow
- The governing permission is **"Schedule pending review."** Assign it to a user and **every post they schedule requires approval — with no bypass.**
- **Every approval, rejection and note is logged on the post.** Full audit trail.
- **Clients do not need a Metricool account** — they review and approve **straight from their email inbox**.
- Every edit, comment and update is tracked inside the publishing planner.
- **Plan gate: Advanced and above.**

### White Label for Agencies (WLA) — **Custom plan only**
- Converts the account into an **agency-branded platform**: own name, logo, colours.
- Configured at **Menu → Whitelabel settings**: logos, email details, clients, role configuration.
- **Clients added from Whitelabel settings belong to the Agency and need no Metricool account** to use all available features.
- **Approval-request emails are sent with the Agency's branding.**
- Assign **as many Brands as needed per client**, with customised roles; the agency can follow client activity to provide support.
- **No-code — no need to build your own auth system.**
- Metricool documents a distinction between **"White Label for Agencies"** and **"White Label for Integrators"**, and between **WLA roles** and **User Management roles** — implying an OEM/reseller motion exists. Details **UNVERIFIED**.

**Verdict:** the agency layer is well-built for the money — per-brand roles, no-account client approval with email-based sign-off, full audit trail. The catch is that **white label is Custom-only with no published price**, so the mid-size agency that wants its own branding has to enter a sales cycle.

---

## 17. API & MCP

### 17.1 REST API

| Attribute | Detail |
|---|---|
| Plan gate | **Advanced or Custom only.** Free and Starter have no API access. |
| Docs | `https://app.metricool.com/resources/apidocs/index.html` — with **.yaml and .json** spec files, plus a PDF at `static.metricool.com/API+DOC/API+English.pdf` |
| Base URL | `https://app.metricool.com/api` |
| Auth | Token from **Account Settings → API**, sent in the **`X-Mc-Auth`** header |
| Required params on every call | **`userToken`** (header), **`userId`**, **`blogId`** |
| **Endpoint discovery tool** | ⭐ Metricool ships a feature that **extracts the endpoint from any section of the UI** (Analytics, Planner, Ads) so you can see the exact route the app itself calls and use it as a reference. Advanced/Custom only. |
| Rate limits | ⚠️ **CONFLICTING.** One source: *"Metricool doesn't publish official rate limits… a 1-second delay between calls prevents throttling; returns HTTP 429 with `Retry-After`."* Another claims limits are documented. **Treat published rate limits as UNVERIFIED.** |
| Coverage gaps | **Story scheduling, some Instagram Reel configurations, and certain platform-specific post types have limited or no API support.** |

**Assessment:** the `userId` + `blogId` + `X-Mc-Auth` pattern is a **single-tenant account API**, not a multi-tenant OAuth platform API. There is no evidence of OAuth 2.0, scopes, webhooks, or a partner app model. This means **you cannot build a third-party product on Metricool** — you can only automate your own account. The endpoint-inspector is a charmingly pragmatic (and slightly telling) admission that the "API" is largely the app's own internal surface exposed to paying customers.

### 17.2 MCP server — the 2026 story

Metricool ships an **official MCP server**, and this is one of the most forward-leaning moves by any tool in this category.

| Attribute | Detail |
|---|---|
| Endpoint | `https://ai.metricool.com/mcp` (HTTP transport) |
| Claude Code setup | `claude mcp add --transport http metricool https://ai.metricool.com/mcp` |
| Claude Desktop setup | Paste the URL, log in, authorise |
| Package | `mcp-metricool` on PyPI; source under the `metricool` GitHub org |
| **Plan** | ⭐ **Works on any plan, including Free** — unlike the REST API, which is Advanced+ |
| Clients supported | Claude Code, Claude Desktop, Cursor, ChatGPT (Developer Mode), Mistral Le Chat, Make, n8n |
| Setup time claimed | ~5 minutes, no code |

**Tool surface (partial, from public listings):**
`get_brands` · `get_brands_complete` · `get_metrics` · `get_analytics` · `get_best_time_to_post` · `get_scheduled_posts` · `post_schedule_post` (single or multipost, multi-brand) · `update_schedule_post` · `get_instagram_reels(init_date, end_date, blog_id)` · `get_facebookads_campaigns` · `get_googleads_campaigns` · `get_tiktokads_campaigns` · `get_<Network>_Competitors` (Instagram, Facebook, X, Bluesky, YouTube, Twitch) · post-retrieval tools for X, Bluesky, LinkedIn, Pinterest, YouTube, Twitch.

Metricool also markets **purpose-built agents** for report generation and carousel generation on top of the MCP, and publishes dedicated guides for competitor analysis via Claude and AI carousel generation.

**Why this matters:** Metricool has effectively made **the API free while keeping the REST API paid** — because MCP access is a distribution and retention play, not a revenue line. Any competitor without an MCP server is now visibly behind in every 2026 comparison. **This should be treated as table stakes, not a differentiator, going forward.**

---

## 18. Mobile app

| Attribute | Detail |
|---|---|
| Platforms | iOS and Android |
| Minimum OS | **Android 8+**, **iOS 14+**. Documented: *"if you're using Android 10 or lower, some features may not be available or the app may have issues"* |
| Supported | Publish content, review basic stats, reply to messages, manage planning, edit/reschedule posts, **push notifications for scheduled posts**, templates & recurring posts, in-depth analysis of performance/competitors/hashtags, create & manage SmartLinks, set up & monitor ad campaigns, generate reports from templates, AI assistant scheduling, manage roles & permissions |
| **Web-only** | **Exact best-time percentages** (mobile shows the heatmap without the numbers); **video editing** (mobile has image editing only) |
| Complaints | Inbox failing to load; difficulty with library post management; "not as powerful as the desktop interface" |

The mobile app is unusually feature-complete for this category — ads management and role management on mobile are rare — but the two web-only gaps (best-time percentages, video editing) are odd and arbitrary.

---

## 19. Integrations

**Content & media:** Canva, Adobe Express (panel), Unsplash, Giphy, Google Drive, Dropbox, Box
**CMS / commerce:** WordPress, Shopify, Joomla, Wix
**Automation:** Zapier, Make, n8n (via MCP), Slack
**BI:** Looker Studio (first-party connector); third-party ETL paths exist via Windsor.ai and Portable (→ BigQuery)
**Link shorteners:** Bitly, Sniply, Rebrandly
**Content discovery:** Feedly
**AI:** ChatGPT, **official MCP server**
**Other:** browser extension, Google Analytics

---

## 20. Real user criticism — sourced

Ratings: **G2 ≈ 4.5/5**, **Trustpilot ≈ 4.2/5**, ~810+ aggregate reviews. The gap between the two is the story: G2 (product experience) is strong; Trustpilot (commercial experience) is dragged down by a billing cluster.

### 20.1 Billing & auto-renewal — the most damaging cluster

> *"Refunds apply within 15 days of the first purchase, but not for renewals."*

Specific reported incidents:
- A customer **charged via auto-renew on 14 October 2025** while not actively using the service.
- A reviewer describing **the invoice and the charge processed simultaneously at 1:45 a.m.**, leaving no opportunity for advance notice or cancellation.
- A customer refused a refund **15 minutes after the renewal charge hit their card — €638 lost.**
- Reports of difficulty **deleting stored credit card information**.
- *"Despite cancelling subscriptions in advance, users were still charged."*
- **Auto-renewal practices "drew several zero-star reviews, signaling a trust gap."**

This is the single sharpest wedge against Metricool. A competitor offering **pro-rated refunds, pre-renewal notice, and self-serve card deletion** could win business on that alone.

### 20.2 Publishing reliability

- **Double-posting:** *"content posting 4 hours after scheduling, then again 12 hours later."*
- *"Errors non-stop when it comes to posting, with accounts randomly disconnecting after weeks of scheduled posts."*
- *"Some users have to reconnect their accounts more often than they should, which can be really annoying."*
- Bugs embedding links and images/video on **Bluesky**.
- **Autolist carousel uploads** are error-prone: *"make uploading carousels in Auto List more error-proof."*
- Free plan **does not clearly warn when the post limit runs out**.

### 20.3 Support

- *"Customer service is robotic and unhelpful."*
- *"Responses were slow, unhelpful, and didn't address concerns."*
- Support is described as **"the most polarized aspect"** of Metricool reviews — a notable minority report it as poor, especially on billing disputes and complex technical issues.
- Note the counter-evidence: some comparison data rates Metricool's support **slightly better than competitors**. The distribution is bimodal, not uniformly bad.

### 20.4 Pricing & gating resentment

- **X/Twitter is a paid add-on on every tier** — the most-cited pricing grievance, worsened by the **July 2026 doubling to $10/account/month**.
- LinkedIn locked out of Free entirely.
- **Advanced Analytics requires yet another add-on.**
- The **January 2026 free-tier cut** (3 months → 30 days history, 20 posts) is widely resented.
- *"Solopreneurs and budget-conscious users flag tier jumps as hard to justify"* — 10 brands → 15 brands means Starter → Advanced, a jump from $45 to $67/mo.

### 20.5 UI & product

- *"The dashboard can feel cluttered or overwhelming when managing multiple brands and platforms simultaneously."*
- Some users dislike the visual design, preferring something *"new and fresh."*
- **Inbox does not load** properly (mobile especially).
- Library post management is awkward.
- *"Posts published through Metricool don't perform as well as those posted directly on each platform"* — **this is almost certainly an unfounded algorithm folk-belief rather than a real effect, but it is a recurring perception and worth knowing.**
- AI output: *"Content becomes very generic."*

### 20.6 What users consistently praise
- **Analytics are the strongest selling point** — *"community members consistently describ[e] Metricool's analytics dashboard as the best they have seen at its price point."*
- Value for money.
- Intuitive interface and easy scheduling.
- LinkedIn people-tagging.
- Managing many accounts in one place.
- The link shortener.

---

## 21. Gaps & weaknesses — the exploitable list

| # | Gap | Severity | Notes |
|---|---|:--:|---|
| 1 | **No real social listening** | 🔴 High | Only hashtag/keyword tracking on X + Instagram, metered at €25/day/network. No sentiment, SOV, alerting, cross-web monitoring |
| 2 | **No cross-brand unified inbox** | 🔴 High | Must switch Brands one at a time — crippling for multi-client agencies |
| 3 | **No TikTok or LinkedIn competitor tracking** | 🔴 High | The two networks agencies most want competitive data on |
| 4 | **Publishing reliability** | 🔴 High | Double-posts, silent disconnections, autolist carousel failures |
| 5 | **Billing / auto-renewal reputation** | 🔴 High | No refund on renewals; simultaneous invoice+charge; card-deletion friction |
| 6 | **No published SOC 2 / ISO 27001** | 🟠 Med-High | Likely enterprise procurement blocker. UNVERIFIED but no evidence found |
| 7 | **White label is Custom-only, unpriced** | 🟠 Med-High | No self-serve path for the mid-market agency |
| 8 | **API is single-tenant, Advanced+, incomplete** | 🟠 Med | No OAuth, no webhooks, no partner model; Stories & some Reel configs unsupported |
| 9 | **Looker schema changes break client dashboards** | 🟠 Med | Documented by Metricool itself; the unmet need is schema stability |
| 10 | **Best-time is audience-activity, not performance-based** | 🟠 Med | Beatable with a posterior-performance model |
| 11 | **YouTube 30-day / Pinterest 90-day backfill** | 🟠 Med | Undermines "unlimited history" precisely where YoY is wanted |
| 12 | **Brand reconfiguration = data loss** | 🟠 Med | Documented guidance is delete-and-recreate the Brand |
| 13 | **One profile per network per Brand** | 🟡 Med | Multi-location and multi-account clients are expensive by construction |
| 14 | **No inbox archive / case management / SLA** | 🟡 Med | Response tool, not service desk |
| 15 | **Add-on stacking obscures true price** | 🟡 Med | $67 headline → $153 real for a common agency config |
| 16 | **No AI image generation** | 🟡 Low-Med | Text AI only; needs a separate tool |
| 17 | **Bluesky has no impressions → no engagement rate** | 🟡 Low | Platform limitation, honestly disclosed |
| 18 | **Instagram personal-profile & LinkedIn personal-profile post metrics only for Metricool-published content** | 🟡 Low-Med | Creator/personal-brand blind spot |
| 19 | **Mobile: no video editing, no best-time percentages** | 🟢 Low | Arbitrary gaps |
| 20 | **Free tier degraded Jan 2026** | 🟢 Low | Reputational, not functional |

---

## 22. What to steal — parity checklist implications

Ranked by leverage for anyone building against Metricool:

1. **Per-brand pricing with unlimited seats.** Copy it. It is the entire value narrative and it disarms the "how many users?" objection permanently.
2. **Unlimited analytics retention as a warehouse.** Never roll off aggregate time-series. The retention *is* the switching cost — churning means losing years of YoY.
3. **A first-party BI connector, included, not metered.** With **pattern-based brand auto-grouping** and **organic+paid in one source**. And then beat Metricool on the thing it admits it fails at: **schema stability with versioned fields and non-breaking renames.**
4. **Campaign as a first-class object spanning organic + paid**, with dual inclusion (tag-at-schedule + semantic auto-suggest) and a **no-account client share link**.
5. **Ads management inside the social object model.** Even a simplified builder. The reporting payoff is disproportionate.
6. **No-account client approval via email**, with a non-bypassable "pending review" permission and a full audit log on every post.
7. **Per-brand role assignment** — same user, different role per client.
8. **Video-mechanics metrics**: Retention %, 3-second view rate, average watch time, duration, reposts. This is where Metricool's analytics lead is most concrete.
9. **Metric honesty as a feature**: label snapshot-vs-timeseries, cumulative-vs-period, reach-vs-impressions; disclose per-network API holes. Agencies trust tools that admit limits.
10. **An MCP server on every plan including free.** Table stakes now.
11. **Cookieless first-party web analytics.** Cheap to build, strong EU differentiator, puts web + social in one report.
12. **Long-tail channels** (Twitch with sub-tiers, GBP reviews, Threads, Bluesky) — cheap coverage, expensive-looking comparison table.

**And the four things to do *better*:**
- **Cross-brand unified inbox** with assignment, SLA and archive.
- **Real listening** — or an honest, well-priced partnership rather than a €25/day metered stub.
- **Publishing reliability** with idempotency guarantees, proactive reconnection alerts, and a visible publish-health dashboard.
- **Clean commercial hygiene**: pre-renewal notice, pro-rated refunds, self-serve card deletion. Metricool's Trustpilot page is a free customer-acquisition brief.

---

## 23. Verification ledger

| Claim | Status |
|---|---|
| Per-brand pricing model, unlimited users | ✅ Confirmed, multiple independent |
| USD monthly ladder ($25/$45/$67/$107/$210) | 🟡 Single strong source (costbench) + corroborating fragments. **Re-verify** |
| EUR annual ladder (€16/€29/€43/€69/€130) | 🟡 Two sources agree. **Re-verify** |
| Starter $20 / Advanced $53 annual | ✅ Corroborated incl. G2 pricing page. (A "$22/$54" variant also circulates) |
| X add-on **$10/mo from 13 July 2026**, $5 grandfathered | 🟡 Two sources agree, one older source still says $5. **High confidence in the change; verify current rate** |
| Advanced Analytics €10/$12 Starter, €30/$36 Advanced | ✅ Help-centre sourced |
| Hashtag Tracker €25/day/network, 25k X / 10k IG posts | ✅ Help-centre sourced |
| Free: 1 brand / 20 posts / 30 days history / 5 competitors / 5 AI credits | ✅ Multiple |
| Competitors 100 per network, 10 YouTube | ✅ Multiple |
| Competitor backfill: 1st of previous month, 300-post premium sync | 🟡 Single source |
| Historical backfill = 1 Jan of previous year, API-bounded | ✅ Help-centre sourced |
| Pinterest 90-day / YouTube 30-day backfill caps | ✅ Help-centre sourced |
| Autolist cap **200 posts** | 🟡 Single source |
| X threads up to **80 posts**, 20 media | 🟡 Single source |
| Campaign Dashboard **90-day max range** | 🟡 Single source (help centre extract) |
| Looker: 14 channels, 25+ data sources, 4 field roots | ✅ Multiple |
| Looker connector = Advanced & Custom | ✅ Multiple |
| API = Advanced & Custom, `X-Mc-Auth` + userId + blogId | ✅ Multiple |
| API rate limits | ❌ **UNVERIFIED — sources conflict** |
| Report scheduling frequencies beyond monthly | ❌ **UNVERIFIED — sources conflict** |
| Scheduled-report recipient limit | ❌ **UNVERIFIED** |
| White Label = Custom only | ✅ Multiple |
| Custom-plan feature list (SSO, CSM, QBRs, historical import, multi-step approvals) | ❌ **UNVERIFIED** — this list appears in comparison blogspam and may be fabricated or borrowed from a competitor's tier. Only "white label, unlimited profiles, custom integrations, personalised onboarding, 50+ brands" is reasonably sourced |
| SOC 2 / ISO 27001 | ❌ **No evidence found. Assume absent** |
| SmartLinks: custom domain, A/B testing, pixels | ❌ **UNVERIFIED** |
| DM Automation rules-engine depth | ❌ **UNVERIFIED** |
| Instagram connection docs referencing "Instagram Basic Display API" | ⚠️ **LIKELY STALE** — that API was deprecated by Meta in December 2024 and replaced by "Instagram API with Instagram Login". Metricool's help page appears not to have been updated |
| June/July/August 2026 product updates | ⚠️ Pages exist but **contents not retrievable**. Latest verified detail is **May 2026** |
| "2 million users" vs "1 million professionals" | ⚠️ **Conflicting marketing claims of different vintages** |
| team.blue majority acquisition, >€100M valuation, Jul 2024 | 🟡 [3P] widely reported |
| €17M ARR, 143 headcount | 🟡 [3P] |

**Staleness flags for August 2026:** the newest primary evidence I could reach is the **May 2026** product update. Anything about Metricool's state in June–August 2026 is unverified. The X add-on price change (13 July 2026) is the most recent datapoint captured and should be re-checked, as should whether further add-ons have been introduced.

---

## 24. Sources

**Metricool primary (product, help centre, blog — read via search-index extraction, not direct fetch):**
- https://metricool.com/pricing/
- https://metricool.com/premium-vs-free-metricool-plans/
- https://metricool.com/metricool-premium/
- https://metricool.com/dsconnector/
- https://metricool.com/social-media-dashboard-data-studio/
- https://metricool.com/reports/
- https://metricool.com/customized-social-media-reports/
- https://metricool.com/social-media-report/
- https://metricool.com/campaign-dashboards/
- https://metricool.com/metricool-social-media-campaign-dashboards/
- https://metricool.com/metricool-smartlinks/
- https://metricool.com/socialmedia-smartlinks/
- https://metricool.com/hashtag-tracker/
- https://metricool.com/how-to-measure-hashtags/
- https://metricool.com/instagram-hashtag-tracker/
- https://metricool.com/social-media-inbox/
- https://metricool.com/social-media-messages/
- https://metricool.com/dm-automation-turning-messages-into-momentum/
- https://metricool.com/instagram-auto-reply/
- https://metricool.com/ad-campaigns-metricool/
- https://metricool.com/manage-online-campaigns-metricool/
- https://metricool.com/facebook-and-instagram-ads/
- https://metricool.com/twitch-with-metricool/
- https://metricool.com/custom-twitch-reports/
- https://metricool.com/twitch-statistics/
- https://metricool.com/youtube-analytics-metrics/
- https://metricool.com/tiktok-analytics/
- https://metricool.com/tiktok-with-metricool/
- https://metricool.com/tiktok-reports/
- https://metricool.com/instagram-analytics-tool/
- https://metricool.com/instagram-reel-analytics/
- https://metricool.com/instagram-stories-metrics/
- https://metricool.com/facebook-analytics-metricool/
- https://metricool.com/social-media-analytics-with-metricool/
- https://metricool.com/metricoolanalytics/
- https://metricool.com/analytics/
- https://metricool.com/your-metrics-on-metricool/
- https://metricool.com/social-media-competitor-analysis/
- https://metricool.com/compare-competitors-metricool/
- https://metricool.com/instagram-competitors-with-metricool/
- https://metricool.com/facebook-competitors/
- https://metricool.com/planner/
- https://metricool.com/planning-social-media-content-with-metricool/
- https://metricool.com/social-media-calendar-metricool/
- https://metricool.com/import-csv-for-scheduling/
- https://metricool.com/schedule-reels-with-metricool/
- https://metricool.com/social-media-approval-tool/
- https://metricool.com/approval-system-social-media/
- https://metricool.com/content-approval-process/
- https://metricool.com/access-to-team-members-in-metricool/
- https://metricool.com/white-label-metricool/
- https://metricool.com/metricool-integrations/
- https://metricool.com/integrations/
- https://metricool.com/zapier-with-metricool/
- https://metricool.com/metricool-mcp-claude/
- https://metricool.com/how-to-use-metricool-mcp-with-claude/
- https://metricool.com/metricool-mcp-competitor-analysis-claude/
- https://metricool.com/social-media-management-with-claude/
- https://metricool.com/claude-ai-carousel-generator-metricool-mcp/
- https://metricool.com/ai-social-media-assistant-metricool/
- https://metricool.com/metricool-mega-tutorial/
- https://metricool.com/what-is-metricool/
- https://metricool.com/best-time-to-post-social-networks/
- https://metricool.com/product-updates-january-2026/
- https://metricool.com/product-updates-february-2026/
- https://metricool.com/product-updates-march-2026/
- https://metricool.com/product-updates-april-2026/
- https://metricool.com/product-updates-may-2026/
- https://metricool.com/whats-new/
- https://metricool.com/newsroom/
- https://metricool.com/press-release-tiktok-study-2026/
- https://metricool.com/press-release-instagram-study-2026/
- https://metricool.com/press-release-linkedin-study-2026/
- https://metricool.com/legal-terms/
- https://metricool.com/privacy-policy/

**Metricool Help Centre:**
- https://help.metricool.com/en/article/historical-data-available-rn3q49/
- https://help.metricool.com/en/article/your-metrics-in-metricool-full-guide-19wk0f6/
- https://help.metricool.com/en/article/instagram-metrics-12vpkyb/
- https://help.metricool.com/en/article/instagram-account-metrics-breakdowns-and-charts-xrbv9n/
- https://help.metricool.com/en/article/facebook-metrics-1tllrsb/
- https://help.metricool.com/en/article/linkedin-company-page-metrics-1kxa7fv/
- https://help.metricool.com/en/article/linkedin-personal-profile-metrics-7sgfmb/
- https://help.metricool.com/en/article/youtube-metrics-ski1tc/
- https://help.metricool.com/en/article/twitch-metrics-ov7c60/
- https://help.metricool.com/metrics-by-social-network-dnxxf
- https://help.metricool.com/en/article/summary-metrics-1ualvbs/
- https://help.metricool.com/competitor-analysis-ouhue
- https://help.metricool.com/how-to-add-competitors-in-metricool-sgjjg
- https://help.metricool.com/en/article/how-to-generate-reports-17aytqg/
- https://help.metricool.com/custom-templates-apbh5
- https://help.metricool.com/en/article/custom-templates-oma1ut/
- https://help.metricool.com/what-is-metricool-studio-o4pac
- https://help.metricool.com/how-to-use-metricool-studio-hz3f0
- https://help.metricool.com/what-is-campaign-dashboards-334yd
- https://help.metricool.com/how-to-use-campaign-dashboards-zgk0b
- https://help.metricool.com/en/category/looker-studio-4p58it/
- https://help.metricool.com/en/article/looker-studio-connector-changelog-4bure5/
- https://help.metricool.com/en/article/looker-studio-connector-upgrade-considerations-ve3q3r/
- https://help.metricool.com/en/article/custom-reports-with-looker-studio-1jp3g1b/
- https://help.metricool.com/en/article/what-is-looker-studio-and-where-to-find-the-api-key-token-1k8aeex/
- https://help.metricool.com/en/article/getting-started-with-your-looker-studio-reports-1wio785/
- https://help.metricool.com/looker-studio-frequently-asked-questions-and-common-errors-8db39
- https://help.metricool.com/en/article/1b4qw6j/ (Update Fields on Looker Studio)
- https://help.metricool.com/en/article/inbox-manager-18u2vcy/
- https://help.metricool.com/comments-or-messages-not-appearing-in-inbox-tmofe
- https://help.metricool.com/en/article/ads-campaigns-management-1k7ankp/
- https://help.metricool.com/en/article/create-ads-campaigns-from-metricool-je5673/
- https://help.metricool.com/en/article/smartlinks-in-metricool-full-guide-lfd6xx/
- https://help.metricool.com/en/article/faqs-about-smartlinks-in-metricool-1bjptvd/
- https://help.metricool.com/en/article/hashtag-tracker-hgey9v/
- https://help.metricool.com/en/article/best-time-to-post-on-social-media-in-metricool-hj3rgj/
- https://help.metricool.com/en/article/schedule-content-from-an-autolist-zj5crc/
- https://help.metricool.com/en/article/how-to-schedule-posts-in-batch-with-a-csv-file-in-metricool-3wihqx/
- https://help.metricool.com/en/article/content-planning-full-guide-faqs-cs7alr/
- https://help.metricool.com/en/article/scheduling-and-posting-options-by-social-network-127eukv/
- https://help.metricool.com/en/article/publishing-requirements-for-images-and-videos-from-metricool-pyf6om/
- https://help.metricool.com/en/article/schedule-and-publish-on-x-twitter-93r99n/
- https://help.metricool.com/en/article/user-management-in-metricool-xh3ius/
- https://help.metricool.com/en/article/metricool-for-agencies-everything-you-need-to-know-bk2n2j/
- https://help.metricool.com/wla-about-clients-roles-brands-and-teams-gi0xu
- https://help.metricool.com/en/article/white-label-for-agencies-knowing-the-product-1auao53/
- https://help.metricool.com/en/article/wla-white-label-roles-vs-user-management-roles-know-the-difference-g0ey2n/
- https://help.metricool.com/en/article/white-label-for-agencies-vs-white-label-for-integrators-learn-the-difference-1vr1i9w/
- https://help.metricool.com/en/article/account-structure-user-brand-and-social-profiles-1glrvj1/
- https://help.metricool.com/en/article/whats-a-brand-in-metricool-and-how-does-it-work-2pqndp/
- https://help.metricool.com/en/article/main-differences-between-free-and-premium-plans-1udj06m/
- https://help.metricool.com/en/article/access-to-instagram-from-metricool-connection-types-and-differences-5xpqgi/
- https://help.metricool.com/en/article/what-happens-when-a-social-network-is-disconnected-in-metricool-1klqhq/
- https://help.metricool.com/en/article/why-dont-the-numbers-match-between-metricool-and-google-analytics-15ujo2f/
- https://help.metricool.com/en/article/api-limitations-per-social-network-508ay5/
- https://help.metricool.com/api-access-export-your-metricool-data-to-other-tools-and-automate-tasks-x8ln5
- https://help.metricool.com/en/article/basic-guide-for-api-integration-abukgf/
- https://help.metricool.com/en/article/how-to-get-an-endpoint-in-metricool-to-make-api-calls-15xciw7/
- https://help.metricool.com/mcp-vs-api-access-what-is-the-difference-5y3ib
- https://help.metricool.com/how-to-connect-metricools-mcp-with-claude-0l84v
- https://help.metricool.com/faqs-about-the-metricool-mcp-1i3w0
- https://help.metricool.com/your-guide-to-the-advanced-analytics-add-on-ft6hi
- https://help.metricool.com/your-guide-to-the-x-twitter-add-on-wt5wy
- https://help.metricool.com/en/article/features-available-in-the-mobile-app-ut3sji/
- https://help.metricool.com/en/article/how-to-verify-your-account-access-and-your-plan-limits-1p2z5kr
- https://help.metricool.com/en/article/how-to-activate-your-monthly-summary-in-metricool-24trsk/
- https://app.metricool.com/resources/apidocs/index.html
- https://static.metricool.com/API+DOC/API+English.pdf

**Reviews & user criticism:**
- https://www.g2.com/products/metricool/reviews
- https://www.g2.com/products/metricool/reviews?qs=pros-and-cons
- https://www.g2.com/products/metricool/pricing
- https://www.capterra.com/p/203702/Metricool/reviews/
- https://www.capterra.com/p/203702/Metricool/pricing/
- https://www.trustpilot.com/review/metricool.com
- https://uk.trustpilot.com/review/metricool.com
- https://ca.trustpilot.com/review/metricool.com
- https://www.softwareadvice.com/marketing/metricool-profile/reviews/
- https://www.trustradius.com/products/metricool/pricing
- https://postplanify.com/metricool-reviews
- https://checkthat.ai/brands/metricool/reviews
- https://efficient.app/apps/metricool
- https://bloggingwizard.com/metricool-review/
- https://thecmo.com/tools/metricool-review/
- https://research.com/software/reviews/metricool
- https://themarketingagency.ca/blog/honest-review-metricool/
- https://www.womenconquerbiz.com/metricool-review/
- https://daniliants.ventures/articles/metricool-review/

**Pricing trackers & comparisons [3P]:**
- https://costbench.com/software/social-media-management/metricool/
- https://socialk.it/en/pricing/metricool
- https://schedpilot.com/metricool-pricing-how-much-does-it-really-cost/
- https://pricingsaas.com/companies/metricool
- https://turrboo.com/blog/metricool-pricing
- https://socialrails.com/blog/metricool-pricing
- https://howsociable.com/reviews/metricool
- https://tygartmedia.com/metricool-pricing-2026/
- https://tygartmedia.com/metricool-api-guide/
- https://tareno.co/compare/metricool-vs-sprout-social
- https://www.aitools-directory.com/metricool-vs-sprout-social/
- https://recurpost.com/compare/recurpost-vs-metricool/
- https://postfa.st/metricool-alternatives
- https://bundle.social/metricool-alternative

**MCP / developer:**
- https://pypi.org/project/mcp-metricool/
- https://glama.ai/mcp/servers/@metricool/mcp-metricool
- https://playbooks.com/mcp/metricool/mcp-metricool
- https://mcp.directory/servers/metricool
- https://github.com/SellStatic/Metricool-mcp
- https://github.com/Purple-Horizons/metricool-cli
- https://useloadout.com/blog/metricool-mcp-server-setup/
- https://portable.io/connectors/metricool/bigquery
- https://windsor.ai/connect/metricool-data-studio-integration/

**Company:**
- https://tracxn.com/d/companies/metricool/
- https://pitchbook.com/profiles/company/490414-69
- https://www.crunchbase.com/organization/metricool
- https://app.dealroom.co/companies/metricool
- https://newsletter.dealflow.es/p/dealflowes-433-metricools-success
- https://www.prnewswire.com/news-releases/metricool-unleashes-advanced-features-for-social-media-managers-and-marketers-to-supercharge-and-track-campaigns-with-precision-302205890.html
