# 23 — Scheduling / Productivity Peers: Audit

**Prepared:** 12 August 2026
**Scope requested:** 27 products — Later, SocialBee, Planable, ContentStudio, Sendible, Agorapulse, Statusbrew, Loomly, CoSchedule, Pallyy, Sked Social, Hypefury, Typefully, Taplio, Tailwind, Social Champ, MeetEdgar, Crowdfire, NapoleonCat, Kontentino, Cloud Campaign, Zoho Social, Sociality.io, Iconosquare, Preview App, Plann, Combin.
**Scope actually delivered:** **7 of 27 products researched. 20 not researched at all.**

---

## ⛔ 0. PROVENANCE — READ BEFORE USING ANY FACT IN THIS FILE

### 0.1 What happened

Both retrieval channels failed, in sequence:

| Channel | Status | Detail |
|---|---|---|
| **WebFetch** | **BLOCKED — org egress policy** | Every host tried returned `EGRESS_BLOCKED`: `planable.io`, `www.socialbee.com`, `help.planable.io`, `typefully.com`, `www.g2.com`, `en.wikipedia.org`. Per `/root/.ccr/README.md`, a policy denial is to be **reported, not routed around**. No workaround was attempted. **Zero product pages were rendered.** |
| **WebSearch** | **EXHAUSTED — 8 queries in** | The session budget (200/200) was consumed by earlier agents. My 9th query returned the budget error. |

Net: I got **8 successful searches** to cover 27 products. Files `20-buffer-teardown.md` and `21-metricool-teardown.md` each got ~45 searches for **one** product. That is the calibration for how thin this file is.

The research brief for this task said: *"FETCH THE ACTUAL PRODUCT PAGES. Walk the site: /features, /pricing, /integrations, every feature sub-page, the help centre, the changelog/release notes, and the API docs."* **None of that was possible.** Not one page was walked.

### 0.2 The deliberate decision not to fill the gaps

The task asked for a parity checklist "with no holes." I could have produced 27 polished dossiers from model recall and marked them `UNVERIFIED`. **I did not, and that refusal is the most important content in this file.**

This corpus already has that problem, and it is documented in its own critique:

> `00-critique.md:29` — *"Files **04, 06, 07, 10** contain **zero fetched sources of any kind** — ~8,400 lines, ~27% of the corpus, that are pure recall."*
> `00-critique.md:123` — *"[the corpus] treats a recalled number and a fetched artifact identically."*

`04-competitors-smb.md` **already contains recall-based scaffolds for 21 of these same 27 products** (§4.2 Later, §4.5 SocialBee, §5.1 Cloud Campaign, §5.6 NapoleonCat, §7.4 Hypefury, and so on). Re-emitting those same recollections in a new file with a fresh date and a research-sounding title would **launder unverified recall into apparent verification** — the exact failure the critique names. A hole that is labelled is recoverable. A hole that has been filled with confident-sounding invention is not, because no downstream reader can tell which is which.

**So: §2 contains what I actually retrieved. §3 lists the 20 products as untouched stubs with no invented facts. §6 is a ready-to-execute plan to finish the job.**

### 0.3 Confidence grades

| Grade | Meaning |
|---|---|
| `C1` | Corroborated across ≥2 sources **including a vendor-owned indexed page** (help centre, product page, pricing page). |
| `C2` | Single vendor-owned indexed source, **or** ≥2 consistent independent third parties. |
| `C3` | Third-party review sites only. This category is dominated by SEO content farms and by direct competitors publishing "reviews" of rivals. Treat as a hypothesis. |
| `CONTESTED` | Sources actively disagree; both readings recorded. |
| `UNVERIFIED` | Could not be established. |
| `[3P]` | Third-party source only. |
| `[COMPETITOR-SOURCED]` | The source is a direct competitor of the product being described. Assume hostile bias. |

**All pricing below is `C2` or worse.** No vendor pricing page was rendered. Prices in this category re-price roughly annually.

---

## 1. Coverage status — the honest table

| # | Product | Researched? | Evidence quality | Where it stands |
|---|---|---|---|---|
| 1 | **Planable** | ✅ Yes (3 searches) | `C1`/`C2` on mechanics, `CONTESTED` on price | §2.1 — best-covered product here |
| 2 | **SocialBee** | ✅ Yes (1 search) | `C1`/`C2` mechanics, no pricing | §2.2 |
| 3 | **MeetEdgar** | ✅ Yes (1 search) | `C2`/`C3` | §2.3 |
| 4 | **Hypefury** | ✅ Yes (1 search) | `C3` (no vendor source) | §2.4 |
| 5 | **Typefully** | ✅ Yes (1 search) | `C2` | §2.5 |
| 6 | **Taplio** | ✅ Yes (1 search) | `C2`/`C3`, competitor-sourced | §2.6 |
| 7 | **Tailwind** | ✅ Yes (1 search) | `C2`/`C3` | §2.7 |
| 8–27 | Later, ContentStudio, Sendible, Agorapulse, Statusbrew, Loomly, CoSchedule, Pallyy, Sked Social, Social Champ, Crowdfire, NapoleonCat, Kontentino, Cloud Campaign, Zoho Social, Sociality.io, Iconosquare, Preview App, Plann, Combin | ❌ **NO** | **None** | §3 — stubs only |

**Dimensions requested vs. delivered, across all 27:**

| Requested dimension | Delivered |
|---|---|
| Full feature inventory | Partial for 7, none for 20 |
| Pricing | Partial/contested for 6, none for 21 |
| Network list | **Only Tailwind and Typefully.** Not retrieved for the other 25. |
| The one thing it does better | Supportable for 7 |
| Real user criticism (G2/Capterra/Reddit/X) | **~Nothing.** One sourced product limitation total (Typefully). See §5.1. |
| Which have genuinely good mobile apps | **NOT ANSWERED — zero data.** See §5.2. |

---

## 2. Verified dossiers (7 products)

### 2.1 Planable — collaboration & approval UX

The brief singled this out as "widely considered best-in-class — describe the actual mechanics." This is the one product where I got enough to do that, and the mechanics were sourced substantially from Planable's **own help centre** (indexed), not review blogs.

#### 2.1.1 The approval model — four discrete levels `C1`

Planable exposes approval as a **per-workspace configurable workflow with four settings**:

| Setting | Mechanic |
|---|---|
| **None** | Default. No approval gate; anyone with permission publishes. |
| **Optional** | Posts *can* be approved, but **scheduling and publishing proceed regardless**. Approval is advisory metadata, not a gate. |
| **Required / Mandatory** | **Hard gate.** No post publishes without approval from at least one designated approver. This is the standard client-approval configuration. |
| **Multi-level** | Enterprise tier only. Sequential approval chain. |

**Multi-level mechanics — the detail that matters** `C2` (source: `help.planable.io/en/articles/3653801-multi-level-approvals`):

- You may configure **as many levels as needed** — not a fixed 2- or 3-step ceiling.
- Each level takes **one or multiple assigned approvers**.
- **Within a level, a single approver's sign-off satisfies that level** (OR-logic within a level, AND-logic between levels). This is the specific design choice that keeps chains from deadlocking on holiday absences — worth copying.
- **Levels are nameable**, so the chain self-documents (e.g. `Copy → Design → Legal → Client`).
- Canonical use case per the vendor: internal approval first, then client approval — e.g. content creator → design → executive lead → client.

#### 2.1.2 The internal/external boundary — the actual differentiator `C2`

This, more than the approval chain, is what agencies mean when they call Planable best-in-class:

- **Comments and entire posts can be flagged "internal."** Internal items are invisible to the client while living in the same thread and calendar as client-visible content. One workspace, two audiences — no shadow spreadsheet, no "internal" duplicate calendar.
- **Team vs. Client roles:** team members see everything including internal notes; clients see only what you expose.
- **Clients can be invited via guest-view links with no account required.** Removing the signup step from the client's approval path is a meaningful conversion detail in agency workflows.

#### 2.1.3 Feedback primitives `C2`

Richer than the comment box most competitors ship:

- Threaded **comments**
- **Direct annotations** on the creative (mark-up on the asset itself)
- **Text suggestions** (suggest-edit on copy, Google-Docs-style, rather than "please change this" in a comment)
- **Stickers** / reactions
- **Version control + activity history** per post

#### 2.1.4 Views and content scope `C2`

- **Grid view** — purpose-built Instagram feed simulation (gated to Pro and above per `[3P]`).
- **Feed view** — blog-post oriented.
- **List view** — multi-format overview.
- Calendar view.
- **Universal Content** — Planable explicitly extends beyond social to newsletters, blog posts and video scripts as first-class collaborative objects. Strategically this is Planable attacking the content-ops category, not just the social-scheduler category.

#### 2.1.5 Pricing — `CONTESTED`, do not quote

Sources disagree materially. All are third-party SEO/review sites; **no vendor pricing page was rendered.**

| Source type | Claim |
|---|---|
| `[3P]` several | **Basic $33/workspace/mo** — 60 posts/workspace, 4 social pages, 2 approval types |
| `[3P]` several | **Pro $49/workspace/mo** — 150 posts, 10 social pages, adds Grid view |
| `[3P]` conflicting | The *same* search result asserted both "Pro raises limits to **150 posts**" and "Pro offers **unlimited posts**" — **direct contradiction** |
| `[3P]` `postplanify.com` title | "**Free to $59**/workspace/mo" — a third price point, and implies a free tier |
| Consistent across sources | Enterprise = custom; **analytics is an add-on across all tiers**; Enterprise unlocks multi-level approvals + dedicated AM |

**Structurally reliable takeaways** (these survive the price disagreement): Planable prices **per workspace, not per seat** — agency-friendly; it **meters posts**, which is unusual and is the main complaint vector to probe; **analytics is unbundled**.

#### 2.1.6 The one thing Planable does better

**Making the client's approval experience frictionless while keeping the agency's internal mess invisible — in a single shared object.** The specific combination: no-account guest links + internal-flagged comments/posts + annotate-and-suggest feedback primitives + named, OR-within-level approval chains. Competitors ship approval as a status field; Planable ships it as a collaboration surface.

**Networks:** `UNVERIFIED` — not retrieved.

---

### 2.2 SocialBee — category-based evergreen queues

Sourced from `help.socialbee.com` (vendor-owned, indexed). Mechanics are `C1`/`C2`.

#### 2.2.1 The core loop

The scheduling model is **category-first**, and this is the architectural distinction from slot-first schedulers like Buffer:

1. Posts are filed into **Content Categories** (not directly onto the calendar).
2. **Categories** — not posts — are placed onto the **Posting Schedule** (a weekly time-slot grid).
3. Each week SocialBee reads the schedule to determine **which category** publishes next.
4. It then pulls the next post from that category's queue.

The user maintains *buckets and a rhythm*; the system resolves *which specific post*. Adding content never requires touching the calendar.

#### 2.2.2 Evergreen vs. Share-Once — a per-category flag `C1`

Set at category creation:

- **Evergreen (Re-Queue):** posts **reshare endlessly**. The queue rotates through the category in order and **loops back to the first item** on reaching the last. With 10 articles in an evergreen category, SocialBee cycles 1→10→1 indefinitely.
- **Share Once:** post publishes once and leaves the queue.

#### 2.2.3 Expiry — the safety valve `C2`

The critical governance control on infinite recycling. Posts can expire:

- after being published **X number of times**, and/or
- at a **specific date**.

Both conditions are available; expiry stops republication when the cap is hit. Any evergreen implementation without this produces stale-content incidents (expired promos, dead links, past-dated events) — this is the piece to copy.

#### 2.2.4 Preset categories & RSS `C2`

- Ships **preset categories**: Blogs (from RSS), Promotional, Educational, Quotes, and others. This is onboarding scaffolding — it teaches the content-mix concept rather than presenting an empty bucket list.
- **RSS feed integration** auto-imports content into a category. Vendor explicitly pitches ingesting *influencers'* blog feeds, not only your own.

#### 2.2.5 The one thing SocialBee does better

**Turning "maintain a balanced content mix forever" into a system that survives neglect.** The category→schedule indirection plus per-category evergreen plus expiry caps means the calendar stays full and correctly *proportioned* without ongoing calendar management.

**Pricing:** `UNVERIFIED` — not retrieved. **Networks:** `UNVERIFIED`.

---

### 2.3 MeetEdgar — content library recycling

Evidence is weaker: mostly `[3P]` (selecthub, socialrails, blogrecode, contentmation) plus meetedgar.com's own blog.

#### 2.3.1 Mechanics `C2`

- **Unlimited content library** — the library is the primary object; posts persist rather than being consumed on publish.
- Content organised into **categories** ("Quotes", "Blog Posts", etc.); time slots are assigned per category; Edgar pulls from the matching category at each slot.
- **Automatic recycling:** the library cycles continuously. Fill library → set slots → Edgar keeps feeds active indefinitely. Explicitly the product's signature feature.

#### 2.3.2 Variations — the genuine differentiator `C2`

MeetEdgar **automatically generates multiple text variations of a single post**, rotating the wording each time an item recycles. This directly attacks the failure mode of every evergreen system — audience-visible verbatim repetition — and is a mechanism SocialBee's docs did not show an equivalent for.

#### 2.3.3 Pricing `C3` — third-party only

| Plan | Claim |
|---|---|
| **Eddie** | $29.99/mo |
| **Edgar** | $41.58/mo billed annually — 25 accounts, **1,000 weekly automations**, unlimited categories |

The "1,000 weekly automations" cap is a metering model worth understanding, but it is `C3`.

#### 2.3.4 The one thing MeetEdgar does better

**Auto-generated post variations on recycle** — recycling without the repetition tell.

**Networks:** `UNVERIFIED`.

---

### 2.4 Hypefury — X/Twitter creator automation

**Evidence quality: `C3`. No vendor page appeared in results** — every source was a review site, comparison farm, or a competitor (`brandled.app`). Treat all of it as hypothesis.

#### 2.4.1 Mechanics `C3`

- **Auto-plugs** — when a post crosses an **engagement threshold**, Hypefury automatically appends a reply promoting a newsletter/product/link. Conditional-on-performance automation; the threshold trigger is the clever part.
- **Auto-retweet** — automatically republishes your own original post some hours later to catch other time zones.
- **Evergreen reposting** — mark best performers evergreen; the system reposts on a schedule, rotating the library.
- **Auto cross-posting** to other networks.
- **Viral inspiration panel** — ideation surface.
- **Gumroad sales automation** — direct creator-monetisation integration.

#### 2.4.2 Pricing `C3`

Starter **$29/mo**, Creator **$65/mo**, Business **$97/mo**, Agency **$199/mo**. Annual saves 24–28%. 7-day trial on all tiers. Sources claim autoplugs, cross-posting, evergreen reposting, inspiration panel and Gumroad automation are on **all** plans.

#### 2.4.3 The one thing Hypefury does better

**Performance-triggered monetisation automation** — the auto-plug firing on an engagement threshold, wired to Gumroad. It automates *converting* reach, not just producing it. `C3`

**Networks:** X-primary; "auto cross-posting" targets `UNVERIFIED`.

---

### 2.5 Typefully — writing experience for text platforms

Best-evidenced of the creator tools; `typefully.com/pricing` appeared as an indexed source. `C2`.

#### 2.5.1 Networks `C2` — one of only two products here with a retrieved network list

**X, LinkedIn, Bluesky, Threads, Mastodon.** Deliberately text-only — no Instagram, no TikTok, no Pinterest.

#### 2.5.2 Mechanics `C2`

- **Distraction-free editor** with **high-fidelity real-time preview** — the preview fidelity is the product's core claim.
- **Threads** as a first-class composition object.
- **Natural-language scheduling** ("tomorrow at 9").
- **AI assistant** tuned for social writing.
- Drag-and-drop media.
- **Draft sharing** for review.
- Analytics — **X only**.

#### 2.5.3 Team / ghostwriting structure `C2`

The agency and ghostwriter story is explicitly built into packaging:

| Tier | Structure |
|---|---|
| **Team** | 2 teams, unlimited members |
| **Agency** | **50 teams**, unlimited clients, unlimited members |

Both add: shared drafts, comments, **assignable publishing roles**, member permissions. "Teams" as the multi-tenant unit with unlimited seats inside is a notably ghostwriter-shaped model.

#### 2.5.4 Pricing `C2` — partial

**Pro: $8 per social set, billed yearly** — 1 user, up to 10 social sets, unlimited media, X analytics, AI writing. AI writing and analytics are **gated to Pro**. Team/Agency prices `UNVERIFIED`.

#### 2.5.5 Documented limitation `C2`

**LinkedIn analytics do not exist**; the vendor states they are "working on it." Notable because LinkedIn is a headline supported network — the platform is supported for *publishing* but not *measurement*. **This is the only sourced product limitation anywhere in this file.**

#### 2.5.6 The one thing Typefully does better

**Compose-time fidelity for long-form text and threads** — writing surface plus exact rendered preview, on a per-social-set price that scales down to a single creator.

---

### 2.6 Taplio — LinkedIn growth

**Evidence: `C2`/`C3`, and materially compromised.** Four of eight sources (`authoredup.com`, `supergrow.ai`, `magicpost.in`, and `topsocialtools`) are **Taplio competitors publishing "reviews"** — `[COMPETITOR-SOURCED]`. Pricing figures were consistent across them, which is mild corroboration, but all criticism from those sources must be discarded as hostile.

#### 2.6.1 Mechanics `C2`

- **AI post generator**.
- **Carousel generator** — builds LinkedIn carousels from YouTube videos and other sources.
- **Taplio X** — a **free** Chrome extension surfacing LinkedIn stats inline while browsing (a free top-of-funnel wedge, strategically interesting).
- **Lead database — 450M+ contacts** `C3`.
- **Auto-DMs** and connection automation. *(Automation against LinkedIn carries account-risk; no data retrieved on how Taplio manages this — `UNVERIFIED`.)*

#### 2.6.2 Pricing & credit model `C2`

The credit gating is the notable design:

| Plan | Price/mo | Credits |
|---|---|---|
| **Starter** | $39 | **No AI credits.** Scheduling + analytics only |
| **Standard** | $65 | 250 AI credits + 100 commenting credits |
| **Pro** | $199 | 5,000 AI credits + 1,500 commenting credits + **lead database** |

Annual billing −30%. **7-day free trial with full Pro access and unlimited credits.**

Selling an "AI tool" whose entry tier contains **zero AI** is an aggressive gate and an obvious complaint vector — but I have no user evidence, so that is an inference, not a finding.

#### 2.6.3 The one thing Taplio does better

**Bundling content generation with a lead database and outbound engagement in one LinkedIn-specific tool** — treating LinkedIn as a sales channel, not a publishing channel. `C2`

---

### 2.7 Tailwind — Pinterest/Instagram specialisation

`C2`/`C3`, third-party dominated.

#### 2.7.1 Networks `C2`

**Exactly three: Pinterest, Instagram, Facebook.** Deliberate specialisation.

#### 2.7.2 SmartSchedule `C2`

Analyses audience engagement patterns and auto-suggests optimal posting times. Sources indicate the current version **additionally factors seasonal trends and content type** — i.e. it has moved beyond a static per-account heatmap. `[3P]`, and the "updated version" claim has **no date attached — treat as stale-risk**.

#### 2.7.3 Other mechanics `C2`

- **Pin looping** — Pinterest-specific recycling.
- **Multi-board pinning** — one pin, many boards, scheduled.
- Bulk image upload; drag-and-drop calendar; **hashtag lists**.
- **Tailwind Create** — in-product design tool generating pin/post creative at volume.

#### 2.7.4 Pricing — 2026 restructure `C2`

Sources report Tailwind **restructured in early 2026 around a shared credit pool**:

| Plan | Price (annual billing) |
|---|---|
| Free | $0 (free-forever) |
| **Pro** | $17.99/mo |
| **Advanced** | $29.99/mo |
| **Max** | $99.99/mo |

The **shared credit pool** replacing per-feature limits is the structurally interesting change and the thing to verify first.

#### 2.7.5 The one thing Tailwind does better

**Pinterest-native volume mechanics** — multi-board scheduling + pin looping + Tailwind Create, i.e. creative generation and distribution economics matched to a platform that rewards high pin volume. No generalist scheduler models Pinterest's board/repin structure this way. `C2`

#### 2.7.6 Stale-risk flag

**Tailwind Communities (formerly "Tribes")** — historically a signature feature — **did not appear in any 2026 result.** Whether it still exists is `UNVERIFIED`. Flagging explicitly because its absence from current marketing may indicate deprecation.

---

## 3. NOT RESEARCHED — 20 products

**No facts are recorded for these because none were retrieved.** Nothing is asserted below. I have deliberately not written recall-based summaries; see §0.2.

| Product | Category | Status |
|---|---|---|
| **Later** | IG-first scheduling, link-in-bio, influencer | ❌ Not researched |
| **ContentStudio** | Content curation + scheduling | ❌ Not researched |
| **Sendible** | Agency, white-label | ❌ Not researched |
| **Agorapulse** | Inbox-led mid-market | ❌ Not researched |
| **Statusbrew** | Moderation/rules, mid-market | ❌ Not researched |
| **Loomly** | Calendar + approvals | ❌ Not researched |
| **CoSchedule** | Marketing calendar / ReQueue | ❌ Not researched |
| **Pallyy** | Low-cost, IG-first, agency-ish | ❌ Not researched |
| **Sked Social** | Instagram automation | ❌ Not researched |
| **Social Champ** | Low-cost generalist | ❌ Not researched |
| **Crowdfire** | Curation + growth | ❌ Not researched |
| **NapoleonCat** | **Moderation automation** — flagged priority | ❌ Not researched |
| **Kontentino** | Agency approvals | ❌ Not researched |
| **Cloud Campaign** | **White-label agency** — flagged priority | ❌ Not researched |
| **Zoho Social** | Suite-attached | ❌ Not researched |
| **Sociality.io** | Mid-market suite | ❌ Not researched |
| **Iconosquare** | IG/TikTok analytics | ❌ Not researched |
| **Preview App** | Mobile-first IG planner | ❌ Not researched |
| **Plann** | Mobile-first IG planner | ❌ Not researched |
| **Combin** | IG growth/engagement desktop tool | ❌ Not researched |

**Existing corpus scaffolds — use with the same caution the source file demands.** `04-competitors-smb.md` contains recall-based, explicitly-unverified sections for many of the above: §4.2 Later, §4.6 Loomly, §4.7 Zoho Social, §4.8 Social Champ, §4.9 Crowdfire, §4.10 Pallyy, §5.1 Cloud Campaign, §5.2 Sendible, §5.3 ContentStudio, §5.4 Statusbrew, §5.5 Sociality.io, §5.6 NapoleonCat, §5.7 Kontentino, §6.2 CoSchedule, §7.2 Iconosquare, §7.3 Sked Social. Those are **hypotheses to test**, carrying that file's ⛔ warning. They are **not** a substitute for this audit.

---

## 4. Cross-cutting findings that ARE supported

Only patterns backed by the 7 researched products.

### 4.1 Evergreen recycling — three distinct architectures

The single most useful comparative result. "Content recycling" names three genuinely different designs:

| Product | Unit of recycling | Selection logic | Anti-staleness control | Anti-repetition control |
|---|---|---|---|---|
| **SocialBee** | **Category** (evergreen flag per category) | Schedule names a *category*; queue rotates in order and loops | **Expiry: after N publishes and/or by date** `C1` | None retrieved |
| **MeetEdgar** | **Library + category** | Time slots map to categories; library cycles continuously | Not retrieved | **Auto-generated text variations per recycle** `C2` |
| **Hypefury** | **Individual post**, flagged evergreen | Performance-selected — mark *best performers* evergreen | Not retrieved | None retrieved |
| **Tailwind** | **Pin → multiple boards** ("looping") | Pinterest board structure | Not retrieved | N/A (repetition is normal on Pinterest) |

**Design conclusion for our build:** the complete evergreen feature is **SocialBee's category indirection + SocialBee's expiry caps + MeetEdgar's auto-variations + Hypefury's performance-based selection.** No single competitor ships all four. That is a concrete, evidenced parity-plus target.

### 4.2 Approval workflows — Planable's taxonomy as the benchmark

Four-state model (none / optional / required / multi-level), with **OR-logic within a level and AND-logic between levels**, plus **named levels**. Any approval system we build should be measured against this. The **internal/external visibility flag on comments and posts** is a separate axis and is arguably the harder thing to retrofit — it must be in the data model from day one, not bolted on.

### 4.3 Pricing-model axes observed

| Axis | Example | Note |
|---|---|---|
| Per **workspace** | Planable | Agency-friendly; but Planable **meters posts** — unusual |
| Per **social set** | Typefully ($8/set) | Scales down to solo creator |
| **Shared credit pool** | Tailwind (2026 restructure) | Replacing per-feature caps |
| **Credit-gated AI tiers** | Taplio (entry tier = zero AI credits) | Aggressive gate |
| **Unbundled analytics** | Planable (add-on at all tiers) | |
| Per **automation volume** | MeetEdgar (1,000 weekly automations) `C3` | |

### 4.4 Specialisation is a live strategy

Both text-only (Typefully: X/LinkedIn/Bluesky/Threads/Mastodon) and visual-only (Tailwind: Pinterest/IG/Facebook) products sustain premium positioning on **3–5 networks**. Network breadth is not the only viable axis.

---

## 5. Questions the brief asked that I could NOT answer

### 5.1 Real user criticism — NOT DELIVERED

The brief required G2/Capterra/Trustpilot/Reddit/X criticism with specifics. **I retrieved essentially none** — the search budget died before any review-mining query ran. G2 and Capterra are also WebFetch-blocked.

The **only** sourced limitation in this entire file: **Typefully has no LinkedIn analytics** (vendor-acknowledged).

Everything else that might look like criticism here is my inference from product structure (e.g. Taplio's zero-AI entry tier, Planable's post metering), explicitly labelled as such. **No user complaint in this file is evidenced.** Do not populate a weaknesses column from it.

### 5.2 Mobile app quality — NOT ANSWERED

Zero data retrieved. Not a single app-store rating, review, or feature comparison. The candidates most likely to matter (Later, Plann, Preview App, Pallyy — mobile-first by design) are all in the **not-researched** set. This dimension is **completely open** and needs a dedicated pass (§6.3).

### 5.3 Network lists — 25 of 27 missing

Retrieved for **Tailwind** (Pinterest, Instagram, Facebook) and **Typefully** (X, LinkedIn, Bluesky, Threads, Mastodon) only. Not retrieved for the other 25, **including all 7 dossier products except those two**.

### 5.4 Priority topics still unaddressed

| Brief item | Status |
|---|---|
| Planable collaboration/approval mechanics | ✅ **Delivered** (§2.1) |
| SocialBee category-based evergreen queues | ✅ **Delivered** (§2.2) |
| MeetEdgar content library recycling | ✅ Delivered, `C2`/`C3` (§2.3) |
| Hypefury/Typefully/Taplio creator mechanics | ⚠️ Partial — Hypefury all `C3`; ghostwriting covered only via Typefully packaging |
| Tailwind Pinterest/IG + SmartSchedule | ⚠️ Partial (§2.7); Communities status unknown |
| **Cloud Campaign white-label agency model** | ❌ **Not researched** |
| **NapoleonCat moderation automation** | ❌ **Not researched** |
| **Good mobile apps** | ❌ **Not researched** |

---

## 6. Verification plan — how to finish this properly

### 6.1 Prerequisites

1. **Raise the search budget.** `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` — the session cap was hit at 200. Budget **~15 searches per product** → **~300 for the 20 remaining**, plus ~100 to complete the 7 partials and mine reviews. **~400 total.**
2. **Unblock WebFetch egress**, or accept search-only evidence permanently. This is an **organisation egress policy** decision (403/407-class), not something an agent can or should work around. Minimum useful allowlist: vendor domains + their `help.`/`support.`/`docs.` subdomains, plus `g2.com`, `capterra.com`, `trustpilot.com`, `reddit.com`.
3. **Run products in separate sessions** so one budget exhaustion cannot wipe out the whole batch — this failure took out 20 products at once.

### 6.2 Per-product query template

For each product, in priority order:

1. `<product> pricing 2026 plans limits` — then a second query with the exact tier names to catch contradictions
2. `<product> features list supported networks integrations`
3. `<product> help centre <signature feature> how it works` ← **highest yield; vendor help centres are well-indexed and this produced the best material in §2.1/§2.2**
4. `<product> API documentation developers`
5. `<product> changelog release notes 2026`
6. `<product> review reddit complaints problems`
7. `<product> G2 Capterra negative reviews limitations`
8. `<product> mobile app iOS Android review rating`

### 6.3 Priority order for the rerun

**Tier 1 — flagged in the brief, zero coverage:**
1. **Cloud Campaign** — white-label mechanics: custom domain, client portal, reseller/markup economics, branded reporting
2. **NapoleonCat** — Auto-moderation rule engine: trigger conditions, hide/delete/reply actions, **ad-comment coverage**, keyword/language rules
3. **Mobile-app pass** — Later, Plann, Preview App, Pallyy, Buffer, Agorapulse: app-store ratings + what actually ships on mobile vs. web

**Tier 2 — large installed bases, zero coverage:** Later, Agorapulse, Sendible, CoSchedule (ReQueue vs. SocialBee/Edgar), Loomly, Statusbrew, Kontentino (approvals — the direct Planable comparison)

**Tier 3:** ContentStudio, Zoho Social, Sociality.io, Iconosquare, Social Champ, Pallyy, Sked Social, Crowdfire, Preview App, Plann, Combin *(Combin and Crowdfire: verify they are still operating — both are long-tail tools at deprecation risk; treat "still alive" as the first question)*

**Tier 4 — close out the partials:** Planable pricing (resolve the $33/$49/$59 + posts-cap contradiction); SocialBee pricing + networks; Hypefury from vendor sources (all current data is `C3`); Taplio from non-competitor sources; Tailwind Communities status; network lists for all 7.

---

## 7. Verification ledger

| Claim | Grade | Action |
|---|---|---|
| Planable 4 approval levels; OR-within/AND-between; named levels | `C1`/`C2` | Confirm against help centre when fetchable |
| Planable internal-flagged comments/posts; guest links, no account | `C2` | Confirm |
| Planable Basic $33 / Pro $49 / "$59" / 60 vs 150 vs "unlimited" posts | **`CONTESTED`** | **Do not quote.** Re-verify at source |
| Planable analytics = add-on all tiers | `C3` | Verify |
| SocialBee category→schedule indirection; evergreen loop | `C1` | Solid |
| SocialBee expiry: N publishes and/or date | `C2` | Verify exact UI semantics |
| MeetEdgar auto-variations on recycle | `C2` | Verify mechanism (AI-generated vs. user-entered variation slots) |
| MeetEdgar $29.99 / $41.58 / 25 accounts / 1,000 weekly automations | `C3` | Verify all |
| Hypefury — **every claim** | `C3` | **No vendor source. Re-do entirely.** |
| Typefully networks (5, text-only) | `C2` | Verify |
| Typefully Pro $8/social set; Team 2 teams; Agency 50 teams | `C2` | Verify Team/Agency prices (missing) |
| Typefully no LinkedIn analytics | `C2` | Re-check — may have shipped |
| Taplio $39/$65/$199, credit tiers, 450M contacts | `C2`/`C3` `[COMPETITOR-SOURCED]` | Re-verify from neutral sources |
| Taplio LinkedIn automation account-risk handling | `UNVERIFIED` | Investigate — material risk |
| Tailwind 3 networks | `C2` | Verify |
| Tailwind 2026 credit-pool restructure; $17.99/$29.99/$99.99 | `C2`/`C3` | Verify — recent change, high value |
| Tailwind SmartSchedule seasonal/content-type factors | `C3` | **Undated claim — stale-risk** |
| Tailwind Communities/Tribes still exists | `UNVERIFIED` | Check for deprecation |
| All 20 §3 products | **NONE** | **Full research required** |
| User criticism, all 27 | **NONE** | Full pass required |
| Mobile app quality, all 27 | **NONE** | Full pass required |
| Network lists, 25 of 27 | **NONE** | Full pass required |

---

## 8. Bottom line

**This file does not close the parity-checklist hole it was commissioned to close.** It closes roughly a quarter of it — Planable's approval mechanics and SocialBee's evergreen architecture are covered well enough to build against, and five other products are sketched at `C2`/`C3`.

The genuinely reusable output is §4.1: **evergreen recycling decomposes into four independent mechanisms** (category indirection, expiry caps, auto-variations, performance-based selection) that **no single competitor ships together**. That is an evidenced product opportunity, and it came from the small slice of research that did run.

Two flagged priorities — **Cloud Campaign's white-label model** and **NapoleonCat's moderation automation** — plus the **entire mobile-app question**, have **zero coverage**. Those are the three things to run first when the budget is restored.
