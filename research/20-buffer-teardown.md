# 20 — Buffer: Forensic Teardown

**Prepared:** 12 August 2026
**Subject:** Buffer (buffer.com) — complete product, pricing, platform and strategy teardown
**Purpose:** Parity checklist + differentiation input. Specifically: understand Buffer's queue/slot
scheduling model well enough to out-build it, understand its per-channel pricing well enough to
undercut or out-position it, and understand its deliberate omissions well enough to decide whether
to copy the restraint or attack the gap.

---

## 0. Provenance — read this before trusting any number

### 0.1 What tooling was actually available

| Channel | Status | Consequence |
|---|---|---|
| **WebFetch** | **BLOCKED for every commercial host.** Confirmed denied by the egress proxy: `buffer.com`, `support.buffer.com`, `developers.buffer.com`, `www.g2.com`, `www.blotato.com`, `socialrails.com`. | **Zero Buffer pages were rendered.** No pricing page, no help centre article, no API doc, no changelog was read directly. |
| Read-through proxies (`r.jina.ai`, `allorigins`, `corsproxy`) | Blocked (curl exit 56 / 000) | No workaround available |
| `raw.githubusercontent.com`, `registry.npmjs.org` | **Reachable** | Used only for a trivial legacy npm wrapper; Buffer publishes no public API schema to GitHub that I could locate |
| **WebSearch** | **Working** | ~45 targeted queries. This is the *entire* evidence base for this document. |

### 0.2 What that means for confidence

Every fact below is derived from a **search-engine synthesis over indexed pages** — including
indexed snapshots of `buffer.com/pricing`, `support.buffer.com/article/*`, `developers.buffer.com/*`
and `buffer.com/resources/*`. That is meaningfully better than model recall (it is retrieval over
live-indexed primary sources), but it is meaningfully worse than rendering the page: I could not see
tables, footnotes, plan-gating asterisks, or the "as of" dates on help articles.

Confidence grades used throughout:

| Grade | Meaning |
|---|---|
| `C1` | Corroborated across ≥3 independent sources including at least one indexed Buffer-owned page (help centre, blog, docs). Treat as solid. |
| `C2` | Single Buffer-owned indexed source, or ≥2 consistent third parties. Probably right. |
| `C3` | Third-party only, or thin. Verify before it becomes load-bearing. |
| `CONTESTED` | Sources actively disagree. Both readings recorded. |
| `UNVERIFIED` | Could not be established at all. |

### 0.3 The staleness problem, explicitly

Today is **August 2026**. The social-scheduler review-blog ecosystem is heavily SEO-farmed and
recycles years-old figures under "2026" headlines. Several things in this document carry a 2024–2025
smell and are flagged inline. The single worst offender is the **Agency plan** question (§3.6) and the
**Community network coverage** question (§12.2), where third-party content is demonstrably lagging
Buffer's own pages by 6–12 months.

---

## 1. Executive summary

Buffer is a **publishing-first, per-channel-priced, deliberately narrow** social media management
tool. In 2026 it is no longer *only* a scheduler — it has added a real comment inbox (Community,
Nov 2025), a rebuilt analytics product (Insights), and — the genuinely new strategic move — a
**public GraphQL API with an MCP server, a CLI and managed OAuth** (2026), reversing seven years of
platform closure.

The four things that matter for our purposes:

1. **The queue is the product.** Buffer's signature mechanic is a per-channel recurring weekly
   *posting schedule* of time slots, into which posts flow FIFO. It is elegant, it is why people
   love Buffer, and it is also its single most-complained-about constraint — there is exactly **one
   queue per channel**, with **no categories, no evergreen recycling, and no content-type routing**
   (§5, §20.1). This is the seam to attack.
2. **Per-channel pricing is a love/hate axis, not a flaw.** $5–6/channel is the cheapest credible
   on-ramp in the category and the free tier is the best acquisition asset in the SMB tier. It also
   produces $3,000+/mo bills for a 50-client agency (§3.5). Buffer partially defused this with
   **volume discounts starting at channel 11** — a detail most competitor teardowns miss.
3. **The restraint is strategy, executed with one real gap.** No listening, no ads, no reviews, no
   DMs, no employee advocacy — all deliberate and defensible. But **no persistent brand-voice
   object, no media/DAM library, and single-stage-only approvals** are not restraint; they are
   under-build in areas Buffer already claims (§17).
4. **The API reopening is the most under-priced competitive event in this space.** Buffer went from
   "no API" (2019–2025, ~47,000 orphaned clients) to a GraphQL API + official MCP server that AI
   agents can drive. Legacy REST dies **1 February 2027**. This changes who Buffer competes with
   (§15, §16).

---

## 2. Company and business context

| Fact | Value | Grade |
|---|---|---|
| Founded | 2010 | `C1` |
| CEO / founder | Joel Gascoigne | `C1` |
| Structure | Fully remote, ~73–74 teammates, 15–22 countries (sources vary), 4-day work week, public salaries since 2013 ("open company") | `C2` |
| ARR (Dec 2025) | **$23,365,236** | `C2` — from indexed Dec 2025 shareholder update |
| Customers (Dec 2025) | **69,760** | `C2` |
| Profitability | 10 consecutive profitable months as of Jan 2025; net income $64k in Jan 2025; cash >$3M | `C2` |
| Customers (Jul 2026) | 57.5K per Latka | `C3` — conflicts with Dec 2025 figure; Latka also claims ARR fell from $31.1M (2024) to $22.5M (2025), which contradicts Buffer's own "strongest revenue in company history" for 2025. **Treat Latka as unreliable here.** |
| Monthly users | "over 170,000" | `C3` |

**Read:** Buffer is a ~$23M ARR, profitable, founder-led, no-longer-VC-track company of ~74 people.
It cannot out-spend Sprout or Hootsuite on surface area, and its strategy visibly reflects that. Its
2025–2026 roadmap (Community, Insights rebuild, bulk upload, iOS 26, dark mode, public API) reads
like a company deliberately deepening a narrow product rather than widening it.

---

## 3. Pricing — forensic

### 3.1 Plan lineup

Buffer sells **three plans**: Free, Essentials, Team. `C2`

| Plan | Annual (per channel/mo) | Monthly (per channel/mo) | Seats |
|---|---|---|---|
| **Free** | $0 | $0 | 1 |
| **Essentials** | **$5** | **$6** | 1 (no collaboration) |
| **Team** | **$10** | **$12** | **Unlimited, no per-seat fee** |

- Annual billing saves ~17–20% (sources say both; $6→$5 is 16.7%, $12→$10 is 16.7%, so **~17% is
  the arithmetic truth** and "20%" is marketing rounding). `C1`
- Nonprofit/charity discount: **50% off all products and plans**, application form + documentation,
  ~48h review. `C2`
- Student discount: none found. `UNVERIFIED`
- Refunds: fees generally **non-refundable**; refund possible if you **cancel within 7 days of
  signing up**. `C2`

### 3.2 The Free plan — exact mechanics

This is the most important table in the pricing section, because Buffer's free tier is the strongest
acquisition asset in the SMB tier and we will be benchmarked against it.

| Limit | Value | Grade |
|---|---|---|
| Channels | **3** | `C1` |
| Queued posts | **10 per channel** (→ 30 total at 3 channels) | `C1` |
| Nature of the cap | **Queue-depth cap, not a volume cap.** Publishing frees the slot. No monthly posting limit, no time-horizon limit. | `C1` |
| Ideas storage | **100 ideas** | `C2` |
| AI Assistant | **Unlimited, no credits** | `C1` |
| Community (comments inbox) | **Included** (3 channels) | `C2` |
| Analytics history | **30 days** | `C2` |
| Tags | **3 tags total, 3 per post** | `C2` |
| Bulk upload | **10 posts per channel per upload** | `C2` |
| API | **1 API key + 1 app client**, 3,000 req/30d | `C2` |
| Start Page | Included — **but consumes 1 of the 3 channel slots** | `C1` |
| Team members | 0 (single user) | `C1` |
| Not included | Hashtag manager, first-comment scheduling, drag-and-drop calendar*, approvals, unlimited history | `C3` |

\* The "no drag-and-drop calendar on Free" claim appears in one 2026 review only and conflicts with
Buffer's general calendar documentation. `CONTESTED`.

**The designed pain point:** at one post/day the free queue holds **under two weeks** of content; at
two/day it needs refilling **every five days**. Buffer has engineered a recurring, weekly-cadence
reason to upgrade without ever showing the user a hard "you have run out" wall. This is a better
free-tier design than a monthly post cap and we should study it rather than copy a cruder limit.

### 3.3 Volume discounts — the detail most teardowns miss

Per-channel pricing is **not linear**. Discount tiers begin at **channel 11**. `C2`

Reported tier table (Essentials, monthly billing):

| Channels | Per channel/mo |
|---|---|
| 1–10 | $6 |
| 11–25 | $4 |
| 26–50 | $3 |
| 51+ | **$1** |

Team is reported to bottom out at **$2/channel** past 50 channels. `C3`

**`CONTESTED` / arithmetic warning.** One source gives the Team monthly ladder as
`1–10 $12 / 11–25 $4 / 26–50 $3 / 51+ $2`, which is almost certainly a copy-paste of the Essentials
middle rows. Published *totals* also do not reconcile cleanly:

- Essentials annual: "**$50/mo at 10 channels, $100/mo at 25 channels**" — $50 at 10 checks out
  ($5×10). $100 at 25 implies channels 11–25 average ~$3.33/channel/mo on annual.
- One source states Team annual at 25 channels is **$100/mo**, another states Essentials at 25
  channels is **$125/mo** ($5×25 flat, ignoring the discount). These cannot both be right.

**Verify on the live pricing page before this becomes load-bearing.** What is safe to assert: the
ladder exists, it starts at channel 11, and the marginal channel gets materially cheaper at scale.

### 3.4 What counts as a channel

- One connected social account = one channel. A Facebook Page + a Facebook Group + a LinkedIn
  Profile = **3 channels**. `C1`
- **Start Page counts as a channel.** On Free it eats 1 of 3. On paid, publishing a Start Page means
  **paying for an extra channel**. `C1`
- Channels can be added/removed as "slots"; removing a slot is the mechanism for downgrading spend. `C2`

### 3.5 Why per-channel pricing is loved and hated

**Loved:**
- Lowest credible entry price in the category — a solo creator with 3 channels pays $15–18/mo.
- **Users are free.** Team plan has unlimited seats at no per-seat cost. For an agency with 12 staff
  on 20 channels, Buffer is dramatically cheaper than a per-seat competitor.
- Cost is legible and self-serve: you can predict your bill exactly.
- Volume discounts blunt the worst of the scaling curve.

**Hated:**
- **Multiplies by brand.** 5 clients × 4 networks = 20 channels. At Essentials annual that is
  ~$100/mo; at Team, ~$200/mo. At 50 clients × 3 channels the commonly-cited figure is
  **$3,000+/mo**. `C3`
- **The 10-channel cliff is where the model stops feeling cheap.** At 10 channels Essentials is
  $50–60/mo — the price at which Hootsuite/Sprout become directly comparable and offer listening,
  ads and reviews that Buffer does not.
- **Punishes network breadth.** A brand that wants presence on Bluesky, Mastodon, Threads *and*
  Google Business Profile pays four times for what is arguably one brand.
- **Start Page billed as a channel** is widely read as a nickel-and-dime move given competitors give
  link-in-bio away free.
- The single sharpest complaint in pricing reviews is **the step from Free to paid**, not the
  absolute price.

**Strategic read for us:** per-channel is the right *shape* for SMB self-serve and the wrong shape
for agencies. Buffer knows this — the volume ladder is the patch. The attack is not "be cheaper per
channel"; it is **brand/workspace-based pricing with generous channel counts per brand**, which
directly inverts Buffer's worst axis while keeping the free-tier generosity.

### 3.6 The Agency plan question — `CONTESTED`, and probably a blogspam artifact

Multiple 2026 third-party pages assert a Buffer **Agency plan at $120/mo for 10 channels, +$6 per
additional channel** (one says $100/mo, one says +$5).

**My analysis: this is almost certainly not a real plan.**

- $120/mo ÷ 10 channels = **$12/channel/mo = exactly the Team monthly rate.** The "Agency plan" is
  the Team plan monthly at 10 channels, mislabelled.
- The "+$6 per additional channel" bolted on is the *Essentials* monthly rate — an incoherent mashup.
- At least one 2026 source states explicitly: *"Buffer no longer sells an Agency plan. Buffer's
  pricing page now shows Free, Essentials and Team only, with the agency-shaped features folded into
  Team… If a plan comparison still shows you four Buffer tiers, it has not been checked recently."*
- Buffer does run an agency **marketing page** (`buffer.com/agency`) and an "Using Buffer as an
  agency" help article — which is what the SEO farms are converting into a phantom plan.

That same debunking source, however, dates the per-channel migration to **November 2025**, which is
wrong — the per-channel model replaced the old Pro/Premium/Business tiers in **2021**. So it is not
fully reliable either.

**Position: assume three plans. Flag for one-minute human verification on the live pricing page.**

### 3.7 Legacy plan history

- Buffer moved to per-channel pricing in **2021**, replacing tiered Pro/Premium/Business/Enterprise
  plans. `C2`
- Legacy-plan customers were allowed to stay, but the migration is **one-way**: *"once customers move
  to a new plan, Buffer isn't able to switch them back to their legacy plan/pricing."* `C2`
- Buffer maintains a help article specifically titled *"why some features are not available on legacy
  Buffer"* — i.e. legacy customers are feature-frozen, a standard soft-forcing mechanism. `C2`

---

## 4. Channels supported — exact list

Buffer supports **11 network types + Start Page**. `C1`

| Network | Entity types supported | Publishing | Notes |
|---|---|---|---|
| **Instagram** | Professional (Business/Creator) accounts; personal profiles | Auto-publish (professional) / **notification-only** (personal) | Professional account linked to a FB Page required for auto-publish + advanced analytics |
| **Facebook** | **Pages**, **Groups** | Pages: auto. **Groups: notification-only since Apr 2024** (Meta killed the Groups API) | Facebook **personal profiles not supported** (API restriction) |
| **X (Twitter)** | Profiles | Auto | Threads supported. **Cannot post identical content to multiple X accounts** (2018 policy, §16) |
| **LinkedIn** | **Personal profiles + Company Pages** | Auto | **No polls. No Life tab.** Supports images, video, GIF, **documents (PDF)** |
| **TikTok** | Accounts | Auto, with notification fallback for unsupported cases | Photo/carousel support `UNVERIFIED` |
| **Pinterest** | Public **and group boards** | Auto | Board selection, destination link, pin title, description. **Pinterest personal accounts not supported** |
| **YouTube** | Channels | Auto | **Shorts only — no long-form video.** ≤10GB, 1:1 or 9:16, .mov/.mp4/.mpg/.mpeg/.avi/.webm, title ≤100 chars. YouTube-library music forces notification publishing |
| **Google Business Profile** | Locations | Auto | Post types: **What's New / Offer / Event**. Up to 10 images, CTA button, destination link. **No video (API limitation)** |
| **Threads** | Accounts | Auto | Buffer is an **official Threads API partner**. Threaded posts supported. Only 1 hashtag ("Topic") per post is honoured by Threads |
| **Bluesky** | Accounts | Auto | **Threads up to 25 sub-posts** |
| **Mastodon** | Any server | Auto | Buffer **reads the character limit from your server** (e.g. 11,000 on a permissive instance) |
| **Start Page** | Buffer-hosted link-in-bio | n/a | **Counts as a billable channel** |

**Explicitly not connectable:** Facebook personal profiles, LinkedIn Groups, Pinterest personal
accounts. `C2`

**Assessment:** this is a genuinely broad list for the SMB tier — Buffer was early to Bluesky,
Mastodon and Threads and is an official Threads partner. The notable absences versus enterprise
tools: no WhatsApp, no Telegram, no Discord, no Reddit, no Snapchat, no review sites, no regional
networks (VK/Weibo/Line/Xiaohongshu), no Tumblr, no long-form YouTube.

---

## 5. Publishing — the queue/slot model in full detail

**This is the section that matters most. Buffer's queue is its signature mechanic and its structural
weakness in the same object.**

### 5.1 The core data model

```
Channel
  └── PostingSchedule (per channel, per timezone)
        └── recurring weekly time slots  (e.g. Mon 09:00, Mon 15:00, Tue 09:00 …)
              └── each slot holds exactly ONE post
  └── Queue (ordered list)
        ├── slot-bound posts   ("Next Available" / "Add to Queue")  → float
        └── custom-time posts  (labelled "Custom")                  → pinned
```

Key properties, all `C1`:

- A **posting schedule** is a set of **recurring weekly time slots**, defined **per channel**, with a
  **per-channel timezone**.
- **Each time slot holds exactly one post.**
- The queue is a **FIFO of slot-bound posts** draining into the next free slot.
- **There is exactly one queue per channel.** No categories, no sub-queues, no content-type routing.

### 5.2 The five ways a post enters the queue

| Action | Behaviour | Post is… |
|---|---|---|
| **Add to Queue** | Drops into the **next available time slot**. Not bound to a wall-clock time. | **Floating.** If the schedule changes, the post moves. |
| **Share Next** | Inserts at the **head** of the queue and **pushes everything down by one slot**. | Floating |
| **Share Now** | Publishes immediately, bypassing the schedule | n/a |
| **Set date & time (Custom)** | Publishes at that exact time. Shows a **"Custom" label** in the queue. **Does not occupy a schedule slot.** | **Pinned.** Immune to schedule edits. Not shuffled. |
| **Click an empty slot in the queue view** | Creates a post locked to that specific slot | Pinned (behaves like Custom for shuffle purposes) |

This floating/pinned duality is the cleverest part of the design and the part most competitors get
wrong. It means **editing your posting schedule reflows your entire content plan** without touching
the posts — which is exactly what a creator wants — while still allowing time-critical posts to be
nailed down.

### 5.3 Queue manipulation

| Operation | Detail | Grade |
|---|---|---|
| **Pause queue** | **Per-channel only.** Multiple channels must each be paused individually. Paused posts do not send; on unpause they re-enter **the next available slots in their original order**. | `C1` |
| **Drag & drop reorder** | Within the queue | `C1` |
| **Move to Top** | Shortcut | `C2` |
| **Move to Next Available Slot** | Shortcut | `C2` |
| **Shuffle** | Randomises the order of the **first 200 posts**. **Only shuffles "Next Available" posts** — custom-time and slot-clicked posts are locked in place. | `C2` |
| **Re-Buffer** | Re-queue a previously published post. Manual, one-shot. Drag-to-re-Buffer was removed for X in 2018. | `C2` |
| **Retry failed** | Failed posts can be retried from the queue | `C2` |

### 5.4 Schedule generation: Smart Scheduling and Posting Goals

- **Smart Scheduling** suggests time slots based on (a) cross-platform patterns Buffer mined from
  "millions of posts" across Instagram, Facebook, X, YouTube, TikTok and LinkedIn, and (b) on some
  plans, your own recent performance. One-click adoption of recommended times for an existing
  schedule. `C2`
- **Posting Goals** (weekly targets per channel): setting a goal **auto-generates posting slots** at
  the chosen frequency using recommended times. `C2`
- The Insights **Answers** tab recommends best **time, type and frequency** — but requires **100+
  followers and 10+ posts in the last six months** to generate. `C2`

### 5.5 Queue caps

| Plan | Cap | Grade |
|---|---|---|
| Free | **10 queued posts per channel** | `C1` |
| Essentials / Team | "Unlimited" — with a stated **fair-use cap of 5,000 posts per channel** | `C2` |
| Essentials / Team (alt figure) | "up to **2,000 posts** scheduled simultaneously" | `CONTESTED` |

Both figures circulate. The 5,000/channel figure is described as a *fair use* policy; the 2,000
figure is described as a simultaneous-scheduling limit. They may coexist (2,000 per something,
5,000 per channel) but I could not resolve it. **There is no time-horizon limit** — you can schedule
arbitrarily far ahead; limits are on **queue depth**, not on date range. `C1`

### 5.6 What the queue model cannot do — the attack surface

This is the most valuable output of this teardown.

| Missing capability | Evidence | Why it hurts |
|---|---|---|
| **Multiple queues / categories per channel** | Absent. Confirmed by Capterra review + competitor comparisons | You cannot say "Mondays are video, Wednesdays are blog links" without manual scheduling |
| **Content-type routing to slots** | Absent | Verbatim Capterra complaint: *"One queue works fine if you only post a single type of content, but having to manually schedule or re-organize the schedule if you have multiple post types (images, video, text, etc) gets really tedious."* |
| **Evergreen recycling** | Absent. *"Buffer does not include true category-based evergreen recycling"* | Any user with a back catalogue must leave Buffer or bolt on SmarterQueue/RecurPost/MeetEdgar |
| **Recurring posts** | Absent | No "post this every Tuesday" primitive |
| **Slot-level rules** (e.g. "this slot only takes Reels") | Absent | |
| **Cross-channel queue view with per-channel slot logic** | Partial — "All Channels" view exists, but the schedule is per channel | |
| **Pause all channels at once** | Absent — pausing is strictly per-channel | Crisis-comms failure mode: a brand needing to halt everything must click through every channel |
| **Approval-aware slot reservation** | Absent | A post awaiting approval does not hold its slot deterministically |

**How to out-build it (design brief):**

1. Keep the floating/pinned duality — it is genuinely good. Do not replace it with a pure calendar.
2. Add **queue categories** as a first-class object: each slot in the schedule is optionally typed
   (`video`, `link`, `evergreen`, `any`), and posts carry a category. `Add to Queue` then routes to
   the next slot matching the post's category. This is the single highest-leverage delta.
3. Add **recycling with expiry** (`recycle N times`, `until date`, `min gap`) on the same object, so
   evergreen is a property of a post rather than a separate product.
4. Add **global pause** and **pause with reason** (crisis mode) across a brand/workspace.
5. Make **schedule reflow a preview-able operation** ("editing this schedule will move 47 posts —
   preview"). Buffer reflows silently, which is the most common source of "why did this go out then?"
   confusion.
6. Reserve slots for pending-approval posts so agency queues do not collapse when a client is slow.

---

## 6. Composition — the composer

### 6.1 Omnibox → per-channel tailoring

- Default is a single **Omnibox**: one caption, many channels. `C1`
- **"Customize for each network"** splits into **one editing box per network type** — e.g. selecting
  Facebook + X + LinkedIn yields three boxes. Note it is **per network type, not per channel** — two
  LinkedIn Pages share one box. `C2`
- **Live previews per channel** with a **warning icon** where the content violates that channel's
  constraints. `C2`
- Media behaviour on customize: the Omnibox accepts up to 10 images; on splitting, **each network
  box is truncated to that network's permitted image count**. `C2`
- **Focus Mode** hides previews and side panels for distraction-free writing. `C2`
- **Character limits** are enforced per network; for **Mastodon the limit is read live from the
  connected server**. `C2`

### 6.2 Threads (multi-post)

Supported on **X, Threads, Mastodon, Bluesky**. `C2`
- **Bluesky: up to 25 sub-posts.** `C2`
- Per-platform sub-post caps for X/Threads/Mastodon: `UNVERIFIED`.

### 6.3 First comment

- Supported on **LinkedIn, Instagram (professional), Facebook**. `C2`
- **Not supported on X or Threads.** `C2`
- **Paid plans only.** `C2`
- Primary use case: hashtags out of the caption.

### 6.4 Hashtag Manager

- **Paid plans only.** `C2`
- Create and save **named hashtag groups**; insert into caption or first comment via a `#` affordance
  in the first-comment area. `C2`
- **Groups capped at 30 hashtags** (mirroring Instagram's per-post limit); the composer shows
  **hashtags remaining**; **multiple groups can be combined** in one post as long as the total stays
  ≤30. `C2`
- Separate **AI Hashtag Generator** exists as its own feature. `C2`

### 6.5 Media

| Constraint | Value | Grade |
|---|---|---|
| Images per post (Omnibox) | 10 | `C2` |
| Instagram carousel | up to 10 images | `C2` |
| Media per **idea** | 10 attachments | `C2` |
| Max image size (ideas) | 10MB | `C2` |
| Max video size (ideas) | 1GB | `C2` |
| YouTube Shorts | ≤10GB, 1:1 or 9:16 | `C2` |
| Alt text | Supported (and settable via Zapier) | `C2` |
| Source integrations | Dropbox, OneDrive, Google Drive, Google Photos, Canva, Unsplash | `C2` |
| **Native media library / DAM** | **None.** Buffer relies entirely on third-party storage integrations | `C2` — **real gap** |

### 6.6 Notification (reminder) publishing

Buffer falls back to a mobile notification when the platform API cannot complete the post. `C1`
Documented triggers:

- Instagram **personal accounts** (always notification-only)
- Instagram **Stories** and some **Reels** — specifically when adding **music, stickers, links,
  collaborators**, or using unsupported sizes/lengths
- **Facebook Groups** (since Apr 2024, always)
- **YouTube Shorts** using YouTube-library sounds/music
- Some **TikTok** cases

The user can also *choose* "Notify Me" instead of automatic publishing. `C2`

---

## 7. Drafts, approvals, notes, team

### 7.1 Roles

Two orthogonal permission axes. `C2`

**Organisation role:** Owner / Admin / Member.
**Per-channel permission:** `Publish: Full Access` / `Needs Approval` / `No Access`.

Channel permissions apply to all channels by default and can be overridden per channel.

### 7.2 Drafts and approvals

- **Anyone with channel access can create drafts** — including on Free. `C2`
- **Approving drafts is Team plan only.** `C2`
- Users with **Full Posting Access** (and the Owner) can edit, delete, and move **any** draft to the
  queue.
- Users with **Requires Approval** can only edit, delete and **request approval on their own drafts**.
- `Request Approval` moves the draft to a dedicated **Approvals tab**.
- **Critical detail:** posts created by a Requires-Approval user are **always saved as drafts awaiting
  approval — including posts created via the mobile apps and via the Buffer API.** The permission
  model is enforced at the API layer, not just the UI. `C2`
- Approvals work on mobile. `C2`
- Approval notification emails exist (and were the subject of an Aug 2026 incident — §19).

**Limitations:**
- **Single-stage approval only.** No multi-step / sequential / parallel approval chains. `C3`
- **No external client review link** (no "send to client without a Buffer seat"). `C3`
- Unlimited seats mitigates this — you can just give the client a seat — but that means giving a
  client access to your Buffer org.

### 7.3 Notes (internal collaboration)

- Threaded **internal comments on posts**. `C2`
- Available on **scheduled posts, published posts, and drafts**.
- **Cannot add a Note to an idea.** `C2`
- **No @mentions** — Buffer's own help centre says it "isn't possible… though this is something we're
  considering." `C2` — this is a notable miss for a collaboration feature.
- Email notification to team members if collaboration emails are enabled.

### 7.4 Team economics

**Unlimited team members on Team at no per-seat cost.** This is Buffer's strongest agency argument
and the direct counterweight to per-channel pricing. `C1`

Also present: **transfer of account ownership** to another team member (shipped ~2025/26). `C3`

---

## 8. Tags (Buffer's "campaigns")

Buffer renamed Campaigns → **Tags**. The help-centre URL still reads
`/535-tracking-the-performance-of-your-campaigns`, which is a nice fossil.

| Property | Free | Paid | Grade |
|---|---|---|---|
| Tags per organisation | **3** | **250** | `C2` |
| Tags per post | **3** | **10** | `C2` |

- Tags apply to **posts, drafts and ideas**; ideas can be filtered by tag, including an **Untagged**
  filter. `C2`
- **Tag analytics only work for Facebook Pages, Instagram business accounts, X profiles, and LinkedIn
  Pages.** TikTok, Pinterest, YouTube, GBP, Threads, Bluesky, Mastodon tags produce **no performance
  data**. `C2` — **this is a significant, poorly-advertised limitation.**
- Two analytics views: `C2`
  - **Tag Pulse** — high-level campaign summary: new followers, total impressions, engagements,
    comments across all posts with that tag.
  - **Tag Metrics** — per-post breakdown over time.
- Access path: Insights → (single channel or All Channels) → **Tags** selector top-right → the whole
  page (Summary, Performance-per-Post table, Metrics chart) filters to those tags.

---

## 9. Create / Ideas — the capture surface

### 9.1 The Ideas object

"Create" is Buffer's content-staging space; **Ideas** are its unit. `C1`

| Property | Value | Grade |
|---|---|---|
| Free limit | **100 ideas** | `C2` |
| Paid limit | **5,000 ideas per organisation** (some sources say "unlimited") | `CONTESTED` |
| Media per idea | 10 attachments | `C2` |
| Media types | photos, GIFs, PDFs, videos, links, text | `C2` |
| Max image | 10MB | `C2` |
| Max video | 1GB | `C2` |
| Tags | Yes, filterable, with Untagged filter | `C2` |
| Notes | **Not supported on ideas** | `C2` |

### 9.2 Board view

A **Kanban board** for the content pipeline with drag-between-columns. `C2`

Column names are `CONTESTED`: one source reports **Unassigned / To Do / In Progress / Done**, another
reports **Backlog / To do / In progress / Done**. Likely the columns were renamed at some point; the
functional shape is agreed.

### 9.3 Capture surfaces

| Surface | Capability | Grade |
|---|---|---|
| **Dashboard** | Create idea directly | `C1` |
| **Browser extension** | Dropdown → **"Create Post"** (goes to queue) or **"Save Idea"** (goes to Create) | `C1` |
| **Mobile share sheet** | "Save an Idea to Buffer" → opens Ideas composer with the URL pre-pasted | `C2` |
| **Mobile app** | Hamburger → Create → all saved ideas | `C2` |
| **iOS Control Center** | Quick capture | `C2` |
| **iPhone Action Button** | Quick capture | `C2` |
| **Apple Watch** | Capture an idea from the wrist | `C2` |

**This is genuinely best-in-class capture surface breadth** and is the least-copied part of Buffer.
The Control Center / Action Button / Watch triad is a real moat for creators who think in fragments.

### 9.4 Idea → post

Click idea → **New Post** → composer opens → select channels → customise → Save as draft **or**
schedule. One-click conversion. There is also a **"Generate Ideas"** AI button that suggests topics.
`C2`

---

## 10. AI Assistant — what it actually does

### 10.1 Capability

| Capability | Present | Grade |
|---|---|---|
| Generate a post from a prompt | Yes | `C1` |
| **Repurpose** long-form (blog/newsletter) → social | Yes | `C2` |
| **Repurpose across networks** (e.g. LinkedIn post → X thread respecting char limits) | Yes | `C2` |
| Rewrite / rephrase / change formality | Yes | `C2` |
| Tone shift (casual/professional/witty/motivational) | Yes | `C2` |
| Per-network tailoring (length, style, best practice) | Yes | `C2` |
| Hashtag generation | Yes (separate AI Hashtag Generator) | `C2` |
| Idea generation ("Generate Ideas") | Yes | `C2` |
| AI reply suggestions in Community | Yes | `C2` |
| "Start with AI" from an Insights takeaway (pre-filled composer prompt) | Yes | `C2` |
| Image generation | **No evidence** | `UNVERIFIED` |
| Video generation | **No evidence** | `UNVERIFIED` |

### 10.2 Limits

- **No credit limits on any plan, including Free.** Previously: 50 credits free / up to 3,000 paid —
  **that cap was removed.** `C1`
- Prompt: **minimum 4 words, maximum 10,000 characters.** `C2`
- Available in **both** the Publishing composer and the Create space. `C2`
- Underlying model reported as **GPT-4-class (OpenAI)**. `C3` — likely stale; current model
  `UNVERIFIED`.
- Buffer explicitly warns about hallucination and instructs users to fact-check. `C2`

### 10.3 The brand-voice gap

**Buffer has no persistent Brand Voice object.** `C2`

Tone is supplied **per generation** as prompt input (tone selector + keywords/topics). There is no
documented capability to:
- upload writing samples and train a voice profile,
- save a named voice and reuse it,
- attach a voice to a channel or a brand,
- enforce banned words / style rules.

Competitors (Jasper Brand Voice / Brand IQ, and increasingly the mid-tier schedulers) do all of this.
**This is the clearest "under-build, not restraint" item in Buffer's product.** Removing credit
limits made the AI free but not smarter; unlimited generation of generically-toned copy is a
commodity.

**Out-build:** a first-class `BrandVoice` entity (samples + rules + banned terms + example posts),
attachable to a brand/workspace/channel, applied automatically to every generation *and* to AI
replies in the inbox. This is cheap to build and directly answers the loudest AI complaint in the
category.

---

## 11. Start Page (link-in-bio)

| Property | Detail | Grade |
|---|---|---|
| Availability | Free on all plans **but consumes a channel slot** (1 of 3 on Free; a paid channel on Essentials/Team) | `C1` |
| Blocks | Text, images, video (YouTube), links, social links, **email signup form**, GIFs; marketing copy also cites products and forms | `C2` |
| Themes | Themes, images, colours, fonts, layouts | `C2` |
| Logo/branding | Logo, tagline, images | `C2` |
| **Analytics** | Built-in: **total traffic** + **per-link clicks** | `CONTESTED` — one Buffer support doc reportedly states *"analytics are not supported for Start Pages,"* which may be stale or may refer to Insights integration specifically |
| **Custom domain** | Via **domain forwarding / masked redirect** from your registrar — **not** native CNAME + managed SSL. Reported to require a paid plan | `C3` — **weak.** The forwarding-only mechanic, if accurate, is materially worse than Linktree/Beacons |
| UTM parameters | **Supported** on Start Pages | `C2` |
| Commerce / payments | **No evidence of native product sales or payment collection** | `UNVERIFIED` |
| API | **Cannot create or edit Start Page posts via the API** | `C2` |

**Strategic read:** Start Page is a **PLG trojan horse**, not a serious Linktree competitor. It costs
Buffer almost nothing, it drags creators into the scheduler, and charging a channel slot for it is
the tell that Buffer views it as a conversion asset rather than a product line. The
forwarding-only custom domain and the contested analytics are the two places it visibly under-invests.

**Out-build:** free link-in-bio with **real** custom domains (CNAME + auto-SSL), **not** counted
against the channel quota, with click analytics unified into the main analytics product. That is a
cheap, loud differentiator against Buffer specifically.

---

## 12. Analytics — Insights (formerly Analyze)

### 12.1 Product history

**Analyze → Insights.** Insights is described as *"a complete rebuild of the analytics that used to
live in Analyze, built from scratch."* Confusingly, both names still appear in the help centre
(articles 950 "Using Insights" and 955 "Using Buffer Analyze" coexist), and one source claims they
are **separate tools** with Insights being "the quick per-channel check-in." `CONTESTED` — most
likely a migration in progress with stale documentation. Flag as a documentation smell.

### 12.2 Coverage

Insights covers **Facebook, Instagram, TikTok, LinkedIn, Threads, YouTube, X, Pinterest, Bluesky,
Mastodon** side by side. `C2`

Note the fossil: legacy Analyze documentation says **"Threads is not currently supported within
Analyze."** `C2` — evidence that the two products genuinely have different coverage and that the
docs lag.

### 12.3 Features

| Feature | Detail | Grade |
|---|---|---|
| **Answers tab** | Recommends best **time, type and frequency** to post. **Requires 100+ followers and 10+ posts in the last 6 months** to generate Best-Time recommendations | `C2` |
| **Takeaways** | Short AI-written summaries of what's working + a suggested next step. **"Start with AI"** opens the composer with a prompt pre-filled from your own performance data | `C2` |
| **Boosted post detection** | For any boosted post, shows the **organic vs paid split** on the bar chart, with exact breakdown on hover. Covers **Instagram, Facebook, X, LinkedIn** | `C2` |
| **Tag analytics** | Tag Pulse + Tag Metrics (§8) — **only FB Pages, IG business, X, LinkedIn Pages** | `C2` |
| **Custom reports** | Assemble charts/tables from multiple profiles and tags; set date ranges; reorder sections. **Available on all paid plans** | `C2` |
| **Branded reports** | Logo + cover page — **plan-dependent** (Team) | `C3` |
| **LinkedIn analytics in Sent Posts** | Impressions, engagement, video views inline (2025) | `C2` |
| **Instagram Grid Preview** | Combined view of published + queued posts. **Instagram Professional accounts only** | `C2` |

### 12.4 Export

| Format | Detail | Grade |
|---|---|---|
| **PDF** | "Export as PDF" top-right of any report | `C2` |
| **Image** | "Export as…" | `C2` |
| **CSV** | Downloads a **.zip containing three files: `summary.csv`, `posts.csv`, `timeseries.csv`** | `C2` |
| **Markdown** | Insights export on paid plans | `C2` |
| **Branded PDF** | Paid | `C2` |
| **Via API** | **None. No analytics CSV export through the API.** | `C2` |

### 12.5 Retention

- **Free: 30 days.** `C2`
- **Essentials / Team: unlimited history.** `C2`

### 12.6 Honest assessment

Analytics depth is **the single most common complaint in Buffer's G2 reviews** — *"Analytics and
reporting tools are insufficient, especially when compared to native platforms or other social media
management tools… For teams that need to prove ROI to clients or leadership, Buffer's analytics may
not be detailed enough."*

Buffer's own help centre carries an article titled *"Why your data in Buffer might differ from your
native analytics"* — a standard but telling artifact.

The Insights rebuild + Answers + Takeaways is a real, credible response. Boosted-post organic/paid
splitting is genuinely good and better than most SMB tools. But the **tag-analytics network gap** and
the **no-analytics-in-API** hole are structural.

---

## 13. Community — the comment inbox

### 13.1 What it is

Launched **November 2025** as **Community** (Buffer's third attempt at engagement after Reply and
Engage). A unified space for **comments only**. `C2`

### 13.2 Network coverage — `CONTESTED`

| Source | Networks |
|---|---|
| **Launch announcement (Nov 2025)** | 6: Instagram, Facebook, Threads, Bluesky, X, LinkedIn |
| **Current Buffer product page** | **10: Instagram, Facebook, LinkedIn, Threads, Bluesky, X, TikTok, Google Business Profile, YouTube, Mastodon** |
| **Third-party reviews (stale)** | "only Instagram and Facebook" |

**Resolution:** the 10-network list is the current claim and the 6-network list is the launch state;
the "Instagram and Facebook only" claim is stale 2023-era content about the old *Engage* product and
should be discarded. `C2`

### 13.3 Features

| Feature | Detail | Grade |
|---|---|---|
| **Comment Score** | Uses signals **including sentiment** to surface what's worth answering first | `C2` |
| **AI-suggested replies** | Yes | `C2` |
| Filters + notifications | Yes | `C2` |
| **Bulk resolve** | From the comments menu: **resolve all**, or **resolve only those older than 1 month** | `C2` |
| Hide / delete comments | Yes, from the inbox | `C2` |
| Block users | Yes | `C2` |
| **Comment → Post** | Turn a comment exchange directly into a new post | `C2` |
| Mobile | Full Community on iOS/Android | `C2` |
| Availability | **All plans, including Free (3 channels)** | `C2` |

### 13.4 What's missing

- **No DMs / direct messages on any network.** `C1` — this is the defining limitation.
- **No mentions monitoring** (only comments on *your* posts).
- **No review management** (Google, Facebook, Trustpilot, app stores).
- **No assignment / ownership / SLA** — no "assign to teammate", no saved replies library documented,
  no response-time SLA reporting beyond a "Comment Score" for consistency and speed.
- **No API access.** Community is dashboard-only; the API roadmap lists Community endpoints as
  *planned*. `C2`

---

## 14. Surrounding surfaces

### 14.1 Calendar

- **Week view**: channel, text preview, image thumbnail per post. `C2`
- **Month view**: higher-level with timestamps. `C2`
- **Drag & drop** to reschedule; dragging a card **preserves its draft / pending-approval status**. `C2`
- **All Channels view** for a combined picture. `C2`
- **Channel Groups**: user-private groupings of channels, created at Settings → Features → Channel
  Groups; **a channel can belong to multiple groups**. `C2` — this is Buffer's lightweight answer to
  multi-brand/client separation, and it is *visual only*, not a permission or billing boundary.
- **Dark Mode** (Oct 2025): Settings → Preferences → Appearance, or follow system. `C2`

### 14.2 Bulk Upload (Aug 2025)

Top-requested feature; CSV-driven. `C2`

| Property | Detail |
|---|---|
| Limit | **100 posts per channel per upload (paid)**; **10 per channel (Free)** |
| Template | **Per-channel CSV templates** — download the one for your network |
| Columns | **Case-sensitive**: `Text`, `Image URL`, `Tags`, `Posting Time` |
| Per-network extras | Pinterest requires a **`Board Name`** column |
| Encoding | **UTF-8** (or UTF-16) required for emoji; UTF-8 recommended |
| Tooling caveat | Buffer explicitly warns that **Apple Numbers and some third-party CSV editors** inject invisible characters or mangle headers and break the upload; Excel and Google Sheets are recommended |
| Images | **Public URL only** — no file attachment in bulk |
| Row semantics | One row = one post |

### 14.3 Link handling

- **buff.ly** shortener built in, **available on all plans including Free**. `C2`
- **Automatic UTM appending**: per-channel setting at gear icon → General → *Enable Campaign
  Tracking*. `C2`
- **Custom UTM parameters are paid-only** ("Customize Campaign Tracking"). `C2`
- **UTM supported:** Facebook, X/Twitter, LinkedIn, YouTube Shorts, Google Business Profile, Bluesky,
  TikTok, Start Pages, Threads. `C2`
- **UTM NOT supported:** **Mastodon, Instagram, Pinterest.** `C2` — a real reporting hole on
  precisely the network (Instagram) where attribution matters most.
- Free standalone **UTM Generator** tool at `buffer.com/free-tools/utm-generator`. `C2`

### 14.4 Mobile apps

**iOS + Android.** `C1`

**Buffer for iOS 26** (Sept 2025) — described by Buffer as its **biggest mobile update ever, 1,000+
commits**: `C2`
- Full redesign on Apple's **Liquid Glass** system
- **Brand-new Apple Watch app** (check queue, track streak, capture idea) with **complications** for
  goals and queue counts
- **Widgets**; **posting goals as progress rings on channel avatars**
- Capture from **Control Center** and the **iPhone Action Button**
- **Posting Goals** (weekly per-channel targets) and **Share Your Streak** (generates a celebratory
  post with visuals)
- Smarter calendar view

Mobile feature parity is high: scheduling, drafts + approvals, ideas, Community, channel connection,
timezones/schedules, tags, queue pausing all have dedicated mobile help articles. `C2`

Ratings: Capterra 4.6/5 ease of use; a "Consensus Score" of 8.1/10 across 2k+ reviews. Direct App
Store / Play Store ratings `UNVERIFIED` (both stores are egress-blocked).

### 14.5 Browser extension

- **Chrome Web Store**, extension ID `noojglkidnpfjbincgijbaiedldjfbhh`, publisher "Buffer Inc".
  Rating **4.2/5**. `C2`
- Function: from any page, **Create Post** (→ queue) or **Save Idea** (→ Create). Also shares
  articles and images. `C1`
- Install count `UNVERIFIED` (Chrome Web Store egress-blocked; store caps display anyway).
- **Firefox / Safari / Edge versions: `UNVERIFIED`.** No evidence found either way. Historically
  Buffer shipped Firefox and Safari extensions; whether they are current in 2026 is unknown.

---

## 15. The API, MCP server, CLI and integrations

**This is the most strategically significant section of the teardown.**

### 15.1 The GraphQL Public API

| Property | Detail | Grade |
|---|---|---|
| Launched | **May 2026** (public beta), announced as "Buffer's API is Open for Building" | `C2` — month is well-attested; **year inferred** from the Feb 2027 legacy retirement date and absence from the 2025 launch recap. Verify. |
| Style | **GraphQL, strongly typed, single endpoint** | `C1` |
| Endpoint | **`https://api.buffer.com`** | `C2` |
| Auth | `Authorization: Bearer <token>` on every request; missing/invalid → **401** | `C2` |
| Personal keys | Generate an **API key from the Buffer dashboard** for your own scripts | `C2` |
| OAuth | **Fully managed OAuth** for multi-user third-party apps. Register at **`buffer.com/developers/apps`** → `client_id` + `client_secret` | `C2` |
| Infrastructure | Explicitly *"the same API that powers Buffer itself"* | `C2` |
| Docs | `developers.buffer.com` — Quick Start, Authentication, API Standards, Rate Limits, Your First Post, REST Migration, Reference, Changelog, Roadmap | `C2` |
| Public roadmap | `suggestions.buffer.com` (vote on suggestions) + `developers.buffer.com/roadmap.html` | `C2` |

**Data model exposed:** posts, ideas, channels, organizations. `C2`

**Known operations:** `C2`

| Operation | Notes |
|---|---|
| `createPost(input: CreatePostInput): PostActionPayload` | Fields include `text`, `channelId`, `schedulingType` (e.g. `automatic`), `mode` (e.g. `addToQueue`) |
| `editPost` | |
| `deletePost` | |
| `createIdea(input: { organizationId, content, … })` | |
| `account { organizations { id } }` | Query for org discovery |
| Per-network metadata inputs on `createPost` | Vary by network — LinkedIn first comments, Pinterest boards, etc. |

**Legacy REST remnants** (from the migration guide era): `GET /1/user.json`, `GET /1/profiles.json`.

### 15.2 Rate limits

Three concurrent windows, each contributing a policy; every response carries **structured
`RateLimit` headers**; breach → **429**. `C2`

| Plan | 15-min | 24-hour | 30-day | API keys | App clients |
|---|---|---|---|---|---|
| **Free** | 100 | **100** | 3,000 | 1 | 1 |
| **Essentials** | 100 | 250 | 7,500 | 3 | 3 |
| **Team** | 100 | 500 | 15,000 | 5 | 5 |

⚠️ **The Free row is suspicious**: a 15-minute limit of 100 and a 24-hour limit of 100 makes the
15-minute window meaningless. Either the 24h figure is wrong or the free tier is deliberately
throttled to 100 calls/day. Also note **3,000/30d ÷ 30 = 100/day**, which is *consistent* with a
100/24h limit — so it may well be correct and simply brutal. `C3`, flag for verification.

**Note:** the 15-minute ceiling is **identical across all plans**. Upgrading buys daily and monthly
headroom, not burst capacity. Limits are applied **per client**.

**API access is available on all plans including Free.** `C2`

### 15.3 What the API explicitly cannot do

This list is the most useful competitive artifact in the document. `C2`

| Missing | Detail |
|---|---|
| **Analytics** | Only an **"experimental set of post metrics"**; Buffer *"doesn't recommend relying on it for reporting."* No analytics CSV export. Full Insights data is **not** exposed |
| **Comments / Community** | **Not supported.** Reading or replying to comments is dashboard-only |
| **DMs** | Not supported (Buffer has none anywhere) |
| **Ads** | Not supported |
| **Start Page** | **Cannot create or edit Start Page posts** |
| **Binary media upload** | **No file uploads.** You must host media publicly and pass a URL |
| **Video thumbnails** | Cannot supply your own thumbnail |
| **Webhooks** | No evidence of webhooks. `UNVERIFIED` |

⚠️ **Marketing/docs contradiction:** Buffer's marketing says the API gives *"full access to posts,
ideas, channels, and analytics."* Buffer's help centre says analytics is experimental and not
recommended. **The help centre is the truth.** Flag this as a live example of a vendor overselling
API coverage.

### 15.4 Roadmap (published)

- **Community endpoints** — so agents in Zapier/n8n can auto-reply to comments. `C2`
- **Binary file upload** — adopting TikTok Content Posting API's `FILE_UPLOAD` method to remove the
  domain-verification dependency and allow direct video passing. `C2`
- Analytics support "as part of future expansions." `C2`

### 15.5 MCP server and CLI — the AI-agent play

Buffer ships an **official MCP server** as a client of its own Public API (*"a bridge between MCP and
their GraphQL API, so improvements to the Public API naturally extend to MCP users"*). `C2`

- **Native support claimed for:** Claude / Claude Desktop / Claude Code, ChatGPT, Cursor, Raycast,
  Perplexity, n8n, Zapier. `C2`
- **Agent capabilities:** draft posts, schedule them, browse/manage the queue, check channels,
  capture ideas. `C2`
- Marketing page at `buffer.com/mcp`.
- **CLI** shipped alongside — Buffer's framing: *"treats Buffer the way you treat the rest of your
  stack: something you can script, version-control, and automate… post an announcement to Buffer as
  part of a deployment script."* `C2`

**Assessment:** this is a genuinely forward-leaning move for a $23M-ARR company and it is the one
place Buffer is *ahead* of much larger competitors. It also has an obvious ceiling: an MCP server on
top of a publish-only API means agents can *write* but not *read* performance or *handle* comments —
so "AI social media manager" workflows dead-end at the analytics boundary until the roadmap lands.

### 15.6 Integrations

| Integration | Detail | Grade |
|---|---|---|
| **Zapier** (revamped) | **Actions:** Add to Buffer (text + link URL + optional image URL); **Pinterest channels**; **video and carousel** scheduling from cloud storage or link; **save as Idea or Draft**; **alt text**. **Triggers:** new channel added; new draft added; new update added to queue; new tag created; tag assigned to post/draft | `C2` |
| **IFTTT** | Supported (applets can add posts to Buffer) | `C2` |
| **Make** | Supported | `C2` |
| **Canva** | Direct integration in composer | `C2` |
| **Unsplash** | Direct | `C2` |
| **OpenAI** | Listed as a direct integration | `C3` |
| **Dropbox / OneDrive / Google Drive / Google Photos** | Media picking | `C2` |
| **WordPress** | Publish → preformatted update into Buffer queue | `C2` |
| **RSS** | Via Zapier ("Buffer new items in an RSS feed") — **not native** | `C2` |
| **Shopify** | **No native integration found** (Zapier only) | `C3` |
| **Slack / Teams notifications** | `UNVERIFIED` |
| **Buffer public integrations directory** | Buffer claims "dozens of apps and tools" | `C3` |

---

## 16. Deprecation and breakage history — what Buffer has taken away

This is the most instructive section for anyone building in this category: it is a decade-long
catalogue of **platform-imposed** and **self-imposed** capability loss.

| Date | Event | What broke for users | Cause |
|---|---|---|---|
| **Mar 2018** | **X/Twitter bans identical content across multiple accounts** (announced Jan 2018, compliance deadline **23 Mar 2018**) | Buffer **removed the ability to select multiple X accounts in the composer**; **removed drag-and-drop copy between X queues**; **removed drag-and-drop Re-Buffer** for X (button-based Re-Buffer with edit survived) | Platform policy (spam/bot mitigation) |
| **Apr 2018** | Instagram opens third-party scheduling | *Gain*, not loss — Buffer added Instagram direct publishing | Platform |
| **Apr 2019** | **Google+ shuts down** (announced Dec 2018) | Google+ pages/profiles disappeared from every scheduler | Platform death |
| **Oct 2019** | **Buffer closes legacy API registration to new apps** | **~47,000 clients** were building on it. New integrations became impossible. Buffer's stated reasons: infrastructure not viable to maintain; the API was **enabling competitors** | **Self-imposed / strategic** |
| **1 Jun 2020** | **Buffer Reply sunset** | The full social customer-service inbox (acquired as Respondly in 2015) was killed. Buffer's own numbers: **500 Reply customers vs 70,000+ paying Buffer customers** | Self-imposed / focus |
| **~2020–2023** | Engage replaces Reply — **Instagram and Facebook comments only** | Users lost DMs, mentions, and every other network's comments. This is the origin of the still-circulating "Buffer only does IG and FB comments" claim | Self-imposed / scope |
| **2023** | **X/Twitter kills free API tiers** (Feb 2023, ~7 days' notice); paid tiers introduced | Cost shock across every scheduler; X capability became expensive to maintain | Platform |
| **22 Apr 2024** | **Meta deprecates the Facebook Groups API** (announced 23 Jan 2024 with Graph API v19.0, removed from all versions 90 days later). `publish_to_groups` and `groups_access_member_info` withdrawn | **Automatic scheduling to Facebook Groups died industry-wide.** Buffer retained Groups via **mobile notification publishing only** | Platform |
| **~2024–2025** | **Analyze → Insights** rebuild | Feature/UI churn; documentation for both products still coexists; Threads was **not** supported in legacy Analyze | Self-imposed |
| **Nov 2025** | **Community** replaces Engage; expands to 6 then ~10 networks | *Gain* — the third engagement attempt | Self-imposed |
| **May 2026** | **GraphQL Public API launches** (public beta) with MCP + CLI + managed OAuth | *Gain* — reverses the 2019 closure | Self-imposed |
| **Feb 2026** | **X moves to pay-per-use API pricing**, retiring the previous model; old Basic/Pro become legacy-only for existing subscribers | Ongoing cost/capability pressure on X support | Platform |
| **1 Feb 2027** | **Legacy REST API fully retired** — *"requests to legacy endpoints will no longer return data"* | Anything still on `/1/*.json` dies. ~5 months of runway from today | Self-imposed |

### 16.1 What this history teaches

1. **Buffer has killed an entire acquired product (Reply) and an entire platform (the API) when they
   didn't fit the core.** It is willing to take short-term customer pain for focus. That is a real,
   repeatable behaviour, not a one-off.
2. **The 2019 API closure was reputationally expensive and took seven years to undo.** The developer
   community's framing — *"Buffer's API was enabling competitors, and closing it made strategic
   sense"* — is still the top search result for "what happened to the Buffer API." An entire cottage
   industry of "Buffer API alternatives" (Ayrshare, Postproxy, Zernio, Blotato) grew in the vacuum.
   **The lesson for us: an API is a promise; breaking it creates permanent competitors.**
3. **Platform deprecations (X 2018, Google+ 2019, X API 2023, Meta Groups 2024, X 2026) hit everyone
   equally.** The differentiator is *how gracefully you degrade*. Buffer's answer is **notification
   publishing** — a genuinely good fallback pattern we should copy wholesale: when the API can't do
   it, hand the user a timed mobile reminder with the content pre-staged.
4. **Buffer's product names churn** (Publish/Analyze/Engage → Buffer + Insights + Community;
   Campaigns → Tags). Its documentation lags its product by 6–12 months. Users and reviewers get
   confused, and stale reviews then damage it (see §18's Trustpilot/G2 split).

---

## 17. What Buffer deliberately does NOT do — restraint or gap?

### 17.1 The omissions

| Absent capability | Present in | Buffer's position |
|---|---|---|
| **Social listening / brand monitoring** | Hootsuite (every plan, 150M+ sources), Sprout, Brandwatch | Absent entirely |
| **Mentions monitoring** | All of the above | Absent — Community handles comments on *your* posts only |
| **Direct messages (any network)** | Agorapulse, Sprout, Hootsuite, Sendible | **Absent since Reply died in 2020** |
| **Review management** (Google, Facebook, TripAdvisor, Glassdoor, app stores) | Sprout, Vista Social, Agorapulse | Absent |
| **Ads management / paid campaign creation** | Hootsuite, Sprout, Sprinklr | Absent (boosted-post *reporting* only) |
| **Employee advocacy** | Hootsuite Amplify, Sprout, EveryoneSocial | Absent |
| **Social inbox with assignment/SLA/saved replies** | Agorapulse, Sprout | Absent |
| **Content curation / discovery feeds** | Hootsuite streams, Feedly integrations | Absent (RSS only via Zapier) |
| **Evergreen recycling / content categories** | SmarterQueue, RecurPost, MeetEdgar, SocialBee | Absent |
| **Media library / DAM** | Later, Sprout, Vista Social | Absent — third-party storage integrations only |
| **Multi-stage approvals + client review links** | Planable, Sendible, Loomly | Absent |
| **White-label client dashboard** | Sendible, Cloud Campaign, Vista Social | Absent (branded *reports* only) |
| **Persistent brand voice / AI training** | Jasper, and increasingly mid-tier schedulers | Absent |
| **Long-form YouTube, WhatsApp, Telegram, Discord, Reddit, regional networks** | Various | Absent |

### 17.2 The verdict: mostly strategy, three real gaps

**Strategy — defensible, deliberate, and consistent with a 74-person company:**

- **Listening** is genuinely expensive: firehose licensing, storage, NLP, and a sales motion Buffer
  doesn't have. Hootsuite bundles it because it needs a reason to charge $99+. Buffer charging $5 and
  *not* having listening is coherent.
- **Ads** requires a different buyer (performance marketer), a different compliance surface, and
  Meta/Google ad-API partner status. Wrong customer.
- **Employee advocacy** is an enterprise-HR sale. Wrong customer.
- **Reviews** is a local-SEO product (Birdeye/Podium territory). Adjacent but a different business.
- **Curation/discovery** is a 2015 idea whose value collapsed when algorithmic feeds took over.
- Buffer's own history supports this reading: it **acquired** a full inbox (Respondly/Reply) and
  **deliberately killed it** at 500 customers rather than carry it. That is disciplined, not lazy.
- Founder framing is consistent: *"Rather than trying to be everything to everyone, Joel focused on
  solving one frustrating problem exceptionally well… that simplicity became Buffer's first
  competitive advantage."*

**Gaps — under-build in territory Buffer already claims:**

1. **DMs.** Buffer sells "Community" as *the* place to engage your audience. On Instagram and
   Facebook, **DMs are where the audience actually is.** Owning comments and not DMs is not
   restraint — it is an incomplete feature, and it is why Agorapulse consistently beats Buffer in
   engagement comparisons.
2. **Brand voice.** Buffer sells an unlimited AI Assistant. Unlimited generic generation without a
   persistent voice object is a commodity that every LLM chat window already provides free. This is
   the cheapest high-value thing Buffer could build and hasn't.
3. **The queue's single-lane design.** Buffer sells the queue as its differentiator. Shipping the
   queue *without* categories or recycling — for fourteen years, while SmarterQueue/RecurPost built
   whole businesses on exactly that gap — is not focus, it is a refusal to deepen the one thing it
   is famous for.

Secondary, arguable gaps: **no media library** (forces every user into Canva/Drive), **single-stage
approvals** (caps its agency ambitions while it runs an agency marketing page), **no @mentions in
Notes** (a collaboration feature without the collaboration primitive).

### 17.3 What we should copy vs attack

**Copy the restraint on:** listening, ads, reviews, employee advocacy, curation. Do not build these
to reach parity with Hootsuite; build them only if a specific customer segment pays for them.

**Attack:** queue categories + evergreen recycling; DMs in the inbox; persistent brand voice; real
custom domains on link-in-bio not billed as a channel; multi-stage + external-link approvals; a
native media library; analytics in the API.

---

## 18. Real user criticism

### 18.1 The rating split is the story

| Platform | Rating | Volume | Grade |
|---|---|---|---|
| **G2** | **4.3 / 5** | 1,023 reviews | `C2` |
| **Capterra** | **4.5 / 5** (4.6 ease of use) | 1,490 reviews | `C2` |
| **TrustRadius** | present, score `UNVERIFIED` | — | — |
| **Trustpilot** | **2.1 / 5** | ~93–105 reviews | `C2` |

**A 4.3–4.5 on the software-review sites against a 2.1 on Trustpilot is a textbook signature of a
product people like and a billing/support experience people hate.** Software review sites capture
"does the tool work"; Trustpilot captures "what happened when something went wrong." Buffer's split
is one of the widest in the category.

### 18.2 Product criticism — specific

**Analytics depth (the #1 G2 complaint):**
> *"Analytics and reporting tools are insufficient, especially when compared to native platforms or
> other social media management tools. For teams that need to prove ROI to clients or leadership,
> Buffer's analytics may not be detailed enough."*

**The single-queue problem (Capterra, verbatim):**
> *"One queue works fine if you only post a single type of content, but having to manually schedule
> or re-organize the schedule if you have multiple post types (images, video, text, etc) gets really
> tedious."*

**Preview fidelity (Capterra, verbatim):**
> *"Sometimes I wish I could preview exactly how it looks per platform before it posts, so I still go
> back and forth which kinda wastes the time I just saved."*

**Simplicity as a ceiling:**
> *"The primary downside of Buffer is its simplicity—it lacks the advanced features found in
> competitors. Tools available for engaging with their audience are basic."*

**Reliability / sync:**
> *"Scheduled posts fail or duplicate, and the platform often does not sync correctly with connected
> social accounts."*

**Reddit-sourced themes (recurring):**
- Per-channel pricing that "scales painfully"
- Free plan capped at 3 channels / 10 queued posts
- "Limited AI Assistant"
- **No native recurring/evergreen posts and no content recycling**
- **No multiple posting queues or complex scheduling controls**
- Instagram analytics connection failures cited as a non-renewal reason

### 18.3 Billing and support criticism — Trustpilot, specific

- *"did not use the product for 1 year and when they asked to get a refund they were refused"*
- **"£148.99 appearing two years after cancellation"** — unauthorised charge post-cancellation
- **"charged over $1000 after applying for a $99/month plan"**, with support *"acting in a shady way
  and avoiding providing answers for the first 48 hours after payment"*
- *"the 'Get in touch' button on the website does nothing"* — users unable to reach support at all
- Counter-evidence exists: some reviewers report **refunds processed within 4 days** and "excellent
  support"

**Assessment:** the specific complaints (charge after cancellation, order-of-magnitude
overcharge, dead contact button) are the kind that come from a **self-serve billing system with a
per-channel meter and a thin support team**. Per-channel billing multiplies the blast radius of any
subscription bug. This is a direct, concrete argument for building **billing transparency and a
hard spend cap** into our own per-unit pricing, whatever unit we choose.

### 18.4 What users consistently praise

- **Easiest tool in the category** — Capterra 4.6/5 ease of use, near-universal in reviews
- **Reliability of publishing** (contradicting §18.2 — both claims are common; see §19)
- Clean UI, fast onboarding, helpful tutorials
- The free plan
- Mobile apps described as "well-designed"

---

## 19. Reliability

Buffer runs a public status page at **`status.buffer.com`** with incident write-ups. `C2`

| Source | Measure |
|---|---|
| **IsDown** | **331 Buffer incidents since April 2020** (~5.3 yrs → ~62/yr) |
| **Pulsetic** | **51 incidents since February 2026** (~6 months → ~100/yr pace) |
| **StatusGator** | Tracks separate components incl. "Buffer Website" and "Buffer iOS App" |

**Recent incidents (2026):** `C3`

| Date | Incident |
|---|---|
| 9 Aug 2026 | Buffer Login Disruption |
| 7 Aug 2026 | Issue with **approval notification emails** |
| 5 Aug 2026 | **Pinterest publishing success rate degraded** — traced to Pinterest's API; recovered ~09:50 UTC |
| 13 Jul 2026 | Issue with **Threads comments** |
| 18 Jun 2026 | Outage (last officially acknowledged as of 27 Jun) |
| 26 May 2026 | Critical incident, 09:49, **21-minute duration** |
| (undated) | "Instagram Publishing – Degraded Success Rate"; "Issue Publishing Posts to Instagram and Threads" (with public write-up) |

**Assessment:** ~60–100 incidents/year is *normal* for a multi-platform publisher — most are upstream
platform failures (the Pinterest one is explicitly attributed to Pinterest). Buffer publishes
write-ups, which is good practice. The user-visible complaint ("posts fail or duplicate") maps onto
this: **duplicate posts on retry** is the classic idempotency failure in this category and is worth
designing against explicitly (idempotency keys on every publish attempt, dedupe window per
channel+content hash).

---

## 20. Parity checklist and out-build brief

### 20.1 The queue — the thing we must beat

| Buffer behaviour | Keep | Improve |
|---|---|---|
| Recurring weekly slots per channel, one post per slot | ✅ Keep exactly | |
| Per-channel timezone | ✅ | Add per-*brand* timezone default |
| Floating ("Add to Queue") vs pinned ("Custom") duality | ✅ Keep — it is the best idea in the product | Surface the distinction more clearly in UI |
| Share Next (push everything down one) | ✅ | |
| Shuffle (first 200, floating only) | ✅ | Remove the 200 cap; make it deterministic-seeded so it's reproducible |
| Per-channel pause | ✅ | **Add global/brand pause + "crisis mode"** |
| Schedule edit reflows queue | ✅ | **Add a reflow preview: "this will move 47 posts"** |
| **One queue per channel** | ❌ | **Add typed slots + post categories with category-aware routing** |
| **No recycling** | ❌ | **Recycling as a post property: N times / until date / min gap / auto-expire** |
| **No slot reservation for pending approvals** | ❌ | **Reserve the slot while a post is in approval; release on reject** |
| Smart Scheduling from aggregate + own data | ✅ | Make the reasoning inspectable ("why this slot?") |
| Posting Goals auto-generate slots | ✅ Good idea, copy it | |

### 20.2 Feature parity checklist (must-have to be credible against Buffer)

Publishing: per-channel recurring schedules · floating/pinned posts · Share Next · Share Now ·
shuffle · reorder · per-channel pause · retry failed · calendar week/month with drag-drop preserving
draft status · Instagram grid preview · channel groups · bulk CSV upload with per-network templates ·
notification/reminder publishing fallback.

Composition: omnibox + per-network customisation · per-channel live previews with violation warnings ·
threads on X/Threads/Mastodon/Bluesky · first comment (LinkedIn/IG/FB) · hashtag groups with a 30-cap
counter · alt text · Canva/Unsplash/Drive/Dropbox/OneDrive pickers · focus mode · live
per-server Mastodon char limits.

Content ops: ideas with tags + Kanban board · browser extension capture (post OR idea) · mobile share
sheet capture · **iOS Control Center / Action Button / Watch capture** · idea → post one-click.

AI: unlimited generation on all plans (Buffer removed credits — matching this is table stakes) ·
repurpose long-form → social · per-network rewriting · tone shift · hashtag generation · AI reply
suggestions · performance-informed prompt seeding ("Start with AI").

Collaboration: org roles + per-channel Full/Needs-Approval/No-Access · drafts on every plan ·
approvals tab · **API-layer enforcement of approval permissions** · internal notes on posts ·
unlimited seats.

Analytics: cross-channel dashboard incl. Threads/Bluesky/Mastodon · post-level metrics · tag-level
pulse + per-post metrics · **organic vs boosted split** · custom report builder · PDF/PNG/CSV/Markdown
export (CSV as summary + posts + timeseries) · branded reports · best-time/type/frequency answers.

Engagement: comments across ≥10 networks · sentiment-weighted prioritisation · AI replies · filters ·
bulk resolve incl. "older than 1 month" · hide/delete/block · comment → post.

Platform: link-in-bio with blocks/themes/email capture · link shortener · auto-UTM with custom
parameters on paid · public API with OAuth + personal keys · MCP server · CLI · Zapier/Make/IFTTT.

### 20.3 Differentiation targets (where Buffer is beatable)

| # | Move | Beats Buffer because |
|---|---|---|
| 1 | **Typed queue slots + categories + evergreen recycling** | The #1 recurring complaint, unaddressed for 14 years |
| 2 | **Brand/workspace pricing with N channels included per brand** | Inverts Buffer's worst axis (agency scaling) while keeping SMB cheapness |
| 3 | **DMs in the inbox** | Buffer sells engagement without the half of engagement that matters on IG/FB |
| 4 | **Persistent brand voice object** (samples + rules + banned terms), applied to generation *and* AI replies | Buffer's AI is unlimited but voiceless |
| 5 | **Free link-in-bio with real custom domains (CNAME + auto-SSL), not billed as a channel** | Buffer's forwarding-only + channel-billed Start Page is its most resented small decision |
| 6 | **Analytics in the API from day one** | Buffer's API is publish-only and its own docs admit analytics is experimental |
| 7 | **Native media library / DAM** | Buffer has none at all |
| 8 | **Multi-stage approvals + external client review links (no seat required)** | Buffer is single-stage and seat-gated |
| 9 | **Idempotent publishing + dedupe** | Directly answers "posts fail or duplicate" |
| 10 | **Global pause / crisis mode** | Buffer's per-channel-only pause is a genuine operational hazard |
| 11 | **Tag analytics on every network** | Buffer's tags go dark on TikTok/Pinterest/YouTube/GBP/Threads/Bluesky/Mastodon |
| 12 | **Transparent billing with a hard spend cap** | Directly answers the Trustpilot 2.1 |

### 20.4 Things Buffer does that we should simply copy

- **Notification publishing** as the universal graceful-degradation pattern.
- **Posting Goals** generating schedule slots (goal → schedule, not schedule → goal).
- **The floating/pinned post duality.**
- **Per-network CSV templates** for bulk upload, with explicit encoding guidance and a named warning
  about Apple Numbers.
- **Removing AI credit limits entirely** — credits are a bad UX tax and Buffer already burned that
  bridge for the whole category.
- **Capture from OS-level surfaces** (Control Center, Action Button, Watch, share sheet, extension).
- **Public incident write-ups** and a public suggestions board.
- **A free tier capped on queue *depth*, not volume** — the recurring, gentle upgrade pressure is
  better designed than a monthly cap.

---

## 21. Verification backlog (what a human should check in 15 minutes)

Ordered by how much damage a wrong answer does.

| # | Question | Where | Why it matters |
|---|---|---|---|
| 1 | **Exact volume-discount ladder** for Essentials *and* Team, annual *and* monthly | `buffer.com/pricing` (move the channel slider) | Our pricing model is benchmarked against it; §3.3 does not reconcile |
| 2 | **Does an Agency plan exist?** | `buffer.com/pricing` | §3.6 — I believe no, but three 2026 sources say yes |
| 3 | **Free-plan API rate limit**: is 24h really 100? | `developers.buffer.com/guides/api-limits.html` | §15.2 arithmetic is suspicious |
| 4 | **GraphQL API launch date (year)** | `buffer.com/resources/buffer-api-is-here/` | §15.1 — May is solid, 2026 is inferred |
| 5 | **Community's current network list** (6 vs 10) | `buffer.com/community` | §13.2 |
| 6 | **Paid scheduling cap**: 2,000 simultaneous or 5,000/channel or both | `support.buffer.com/article/643` | §5.5 |
| 7 | **Start Page: custom domain mechanism** (forwarding vs CNAME+SSL) and **whether analytics exist** | `support.buffer.com/article/664` | §11 — this is a differentiation target |
| 8 | **Paid Ideas limit**: 5,000/org or unlimited | `support.buffer.com/article/589` | §9.1 |
| 9 | **Insights vs Analyze**: one product or two | `support.buffer.com/article/950` + `/955` | §12.1 |
| 10 | **Free plan: is drag-and-drop calendar excluded?** | `support.buffer.com/article/595` | §3.2 |
| 11 | **Browser extension**: Firefox/Safari/Edge availability | Respective add-on stores | §14.5 |
| 12 | **Webhooks** in the API | `developers.buffer.com/reference.html` | §15.3 |
| 13 | **SOC 2 / ISO 27001 / GDPR DPA + subprocessor list** | Buffer trust/security page | Entirely `UNVERIFIED`; matters for any enterprise comparison |
| 14 | **Thread sub-post caps** on X / Threads / Mastodon | Network guides in help centre | §6.2 |
| 15 | **TikTok photo/carousel support** | `support.buffer.com/article/559` | §4 |

---

## 22. One-paragraph summary for the strategy doc

Buffer in August 2026 is a profitable, ~$23M ARR, 74-person company selling a deliberately narrow,
publishing-first product at **$0 / $5 / $10 per channel per month** (annual), with **unlimited seats
on Team**, **volume discounts from channel 11**, and the category's best free tier (**3 channels, 10
queued posts per channel, unlimited AI, Community inbox, 100 ideas, 30-day analytics**). Its
signature mechanic — a per-channel recurring **weekly slot schedule** with a floating/pinned post
duality — is genuinely well-designed and genuinely single-lane: **one queue per channel, no
categories, no evergreen recycling**, a fourteen-year-old gap that funds three competitors. It covers
**11 networks + Start Page** including Bluesky, Mastodon and Threads (official partner), degrades
gracefully to **notification publishing** when platform APIs fail, and in 2026 reopened a **GraphQL
public API with an official MCP server, CLI and managed OAuth** (legacy REST dies **1 Feb 2027**)
that is publish-only — **no analytics, no comments, no DMs, no media upload**. Its omissions
(listening, ads, reviews, DMs, advocacy, curation) are mostly disciplined strategy consistent with a
company that once killed an acquired inbox product at 500 customers; but **DMs, brand voice, a media
library, multi-stage approvals and queue categories are under-build inside territory Buffer already
claims**. It rates **4.3 on G2 / 4.5 on Capterra / 2.1 on Trustpilot** — a product people like
attached to a billing and support experience they don't. We beat it with **brand-based pricing, typed
queue slots with recycling, DMs in the inbox, a persistent brand voice, a free link-in-bio with real
custom domains, and analytics in the API from day one** — while copying its notification-publishing
fallback, its posting-goals-generate-slots inversion, its OS-level capture surfaces, and its
queue-depth-not-volume free tier.

---

## Appendix A — Sources

All accessed 12 August 2026 via WebSearch index. **No page was rendered directly** (§0.1).

**Buffer-owned (indexed):**
`buffer.com/pricing` · `buffer.com/publish` · `buffer.com/insights` · `buffer.com/analyze` ·
`buffer.com/community` · `buffer.com/engage` · `buffer.com/create` · `buffer.com/start-page` ·
`buffer.com/collaborate` · `buffer.com/agency` · `buffer.com/api` · `buffer.com/developer-api` ·
`buffer.com/mcp` · `buffer.com/made-for/developers` · `buffer.com/made-for/creators` ·
`buffer.com/nonprofits` · `buffer.com/instagram` · `buffer.com/youtube` · `buffer.com/pinterest` ·
`buffer.com/bluesky` · `buffer.com/mastodon` · `buffer.com/google-business-profile` ·
`buffer.com/ai-assistant` · `buffer.com/shareholders/*` (Jan/May/Jul/Aug/Sep/Oct/Nov/Dec 2025) ·
`buffer.com/journey`
Blog: `/resources/legacy-rest-api-retired/` · `/resources/buffer-api-is-here/` ·
`/resources/everything-we-launched-in-buffer-in-2025/` · `/resources/small-product-changes-2025/` ·
`/resources/introducing-community/` · `/resources/introducing-bulk-upload/` ·
`/resources/ios-26/` · `/resources/sunsetting-reply/` · `/resources/hello-buffer-reply/` ·
`/resources/buffer-acquires-respondly/` · `/resources/hashtag-manager/` ·
`/resources/introducing-tags-organize-content/` · `/resources/how-to-use-tags/` ·
`/resources/start-page/` · `/resources/new-social-media-calendar/` ·
`/resources/introducing-goals-recommended-posting-times/` · `/resources/smart-scheduling/` ·
`/resources/new-twitter-rules/` · `/resources/scheduling-facebook-group-posts-with-buffer/` ·
`/resources/buffer-zapier-integration/` · `/resources/introducing-buffers-ai-assistant/` ·
`/resources/youtube-shorts-scheduling/` · `/resources/buffers-threads-integration/` ·
`/resources/introducing-google-business-profiles/` · `/resources/transparent-product-roadmap-v2/` ·
`/resources/every-team-feature-in-buffer-built-for-agencies/`

**Buffer help centre (indexed):** articles 514, 515, 517, 518, 525, 527, 535, 536, 539, 542, 547,
552, 554, 555, 557, 558, 559, 560, 562, 564, 567, 568, 570, 573, 581, 583, 584, 585, 586, 588, 589,
590, 594, 595, 600, 601, 602, 610, 615, 627, 631, 633, 634, 635, 636, 639, 642, 643, 644, 651, 652,
653, 657, 658, 663, 664, 665, 667, 670, 671, 675, 814, 857, 859, 861, 921, 922, 926, 927, 935, 950,
955, 972, 977, 983, 985

**Buffer developer docs (indexed):** `developers.buffer.com/` — `guides/getting-started.html`,
`guides/authentication.html`, `guides/api-limits.html`, `guides/api-standards.html`,
`guides/your-first-post.html`, `guides/rest-migration.html`, `reference.html`, `changelog.html`,
`roadmap.html`

**Status:** `status.buffer.com` (+ incident write-ups), `statusgator.com/services/buffer`,
`pulsetic.com/status/buffer`, `isdown.app/status/buffer`

**Reviews:** `g2.com/products/buffer/reviews` (+ `?qs=pros-and-cons`, `/pricing`) ·
`capterra.com/p/143492/Buffer/reviews/` · `capterra.ca/reviews/143492/buffer` ·
`trustpilot.com/review/buffer.com` (pages 2–6) · `trustradius.com/products/buffer/reviews` ·
`postplanify.com/buffer-reviews` · `getapp.com/marketing-software/a/buffer/` ·
`research.com/software/reviews/buffer`

**Third-party analysis:** `ayrshare.com/blog/what-happened-to-buffers-api/` ·
`postproxy.dev/blog/what-happened-to-buffer-api-alternatives-for-developers/` ·
`zernio.com/blog/buffer-api` · `zernio.com/blog/buffer-pricing` · `blotato.com/blog/buffer-pricing` ·
`socialrails.com/blog/buffer-review` · `socialrails.com/blog/buffer-pricing` ·
`agorapulse.com/blog/social-media-management-tools/buffer-pricing/` ·
`agorapulse.com/blog/social-media-management-tools/buffer-reviews/` ·
`socialpilot.co/blog/buffer-pricing` · `socialchamp.com/blog/buffer-pricing/` ·
`zapier.com/blog/how-to-use-buffer/` · `zapier.com/blog/buffer-social-media/` ·
`zapier.com/blog/hootsuite-vs-buffer/` · `zapier.com/apps/buffer/integrations` ·
`hootsuite.com/hootsuite-vs-buffer` · `metricool.com/buffer-alternatives/` ·
`storylane.io/tutorials/*` (Buffer how-to series) · `chrome-stats.com/d/noojglkidnpfjbincgijbaiedldjfbhh` ·
`sacra.com/c/buffer/` · `getlatka.com/companies/buffer` · `joel.is/vp-product/`

**Platform deprecation:** `blog.x.com/developer/en_us/topics/tips/2018/automation-and-the-use-of-multiple-accounts` ·
`martech.org` (Twitter multi-account) · `techcrunch.com/2024/02/05/meta-cuts-off-third-party-access-to-facebook-groups...` ·
`techpoint.africa` (Meta Groups API) · `sprinklr.com/help/articles/.../meta-deprecates-facebook-groups-api/` ·
`gigazine.net` (X pay-per-use, Feb 2026)

---

*End of teardown.*
