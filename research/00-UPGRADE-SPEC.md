# 00 — UPGRADE SPECIFICATION
## Folding the full research corpus into the platform under construction

**Prepared:** 12 August 2026
**Status:** Decision-ready. Supersedes `00-MASTER-STRATEGY.md` §3 (parity) and §6 (architecture) wherever the two disagree, because this document is written against code that now exists.
**Scope of "what exists":** `packages/shared/src/{ids,errors,result,text}.ts`, `packages/adapters/src/{networks,content,capabilities,validation,registry,adapter}.ts`, `packages/scheduler/src/{timezone,budget,retry}.ts`, `packages/db/migrations/0001_core.sql`. Five commits. ~2,400 lines of product code against 41,232 lines of research.

**The one-sentence finding.** What is built is a good *single-post-to-single-network publisher*: the text kernel, the timezone kernel, the failure taxonomy and the capability-descriptor idea are all correct and worth keeping. What is built has **no vocabulary at all** for the eleven objects the research says the product is actually made of — content version, node, campaign, queue slot, rendition, conversation, metric fact, link click, generation lineage, policy decision, rights grant — and four of those (content version + hash, per-profile scheduled *local* time, metric provenance, hierarchy) are on the corpus's own irreversible list (`00-MASTER-STRATEGY §6.3`, I3/I4/I5/I7). Every week of feature work on the current schema increases the cost of those four.

**How to read this.**
- §1 is the functional floor: the union of everything the five primary teardowns plus ~25 peers ship, as checkboxes, with the bar-setter named and "beating it" defined concretely. Non-negotiable.
- §2 is an audit of the existing code against §1 and the whitespace, by file and symbol.
- §3 is DDL. §4 is TypeScript signatures. §5 is package topology. §6 is sequence. §7 is refusal.
- Priority tags: **P0** before first paying customer · **P1** before the agency motion · **P2** before enterprise/RFP · **W** = whitespace item (nobody ships it; it is why we win, not why we qualify).

---

# 1. Consolidated parity checklist — the functional floor

Legend for "Bar-setter": the vendor whose implementation is the one a buyer will compare us to. "Beating it" is stated as a testable delta, never as an adjective.

## 1.1 Tenancy, hierarchy, roles and the agency container

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Workspace/brand container isolating content, permissions, reporting | Metricool (Brand), Publer (Workspace), Vista (Profile Group) | Arbitrary-depth node tree (`org → workspace → node* → profile`) so agency and franchise are one data model; Metricool caps at one profile per network per Brand, we do not |
| ☐ | P0 | Same user, different role per client | Metricool | Match exactly; add per-**profile** permission sets (Vista's weakest architecture is group-only) |
| ☐ | P0 | Unlimited seats on every plan | Buffer (Team), Cloud Campaign, Postiz | Unlimited on *every* plan including free, not just the top one |
| ☐ | P0 | Free reviewer/approver seat class | Publer (`Client` role), Metricool (`Client`) | `seat_class` is a schema column, not a plan note; reviewer seats never count toward any limit, ever |
| ☐ | P0 | Client connects their own profiles with no login and no seat | Vista Social (profile connect links) | Same link, plus a readiness assertion suite that names *which* precondition failed and *which human* must fix it (§1.2) |
| ☐ | P0 | Role matrix: owner/admin/manager/editor/contributor/analyst/client + custom roles | Metricool (custom roles), Sprout (per-feature) | Sprout's granularity at Metricool's price; per-feature No Access/View/Manage |
| ☐ | P0 | User groups assignable as approval steps | Vista | Match |
| ☐ | P1 | Multiple owners + one-click ownership transfer | *Nobody* — Publer's owner is singular and non-transferable | Ship it; name Publer's limitation in the comparison page |
| ☐ | P1 | White label: logo, colours, custom domain, branded email from agency DNS, branded PDFs | Vista (Scale), Cloud Campaign, Metricool (Custom only) | **Published price at the mid agency tier**; Metricool's "Custom-only, unpriced" is the attackable gap |
| ☐ | P1 | Client portal on the agency's domain | Cloud Campaign, Metricool WLA | Match |
| ☐ | P2 | Per-client billing / reseller markup | *Nobody* ships it | Invoice-grade per-client cost export with a margin column (§1.25) |
| ☐ | P1 | Client offboarding as one audited transaction (upstream OAuth revoke + link invalidation + portal removal + domain rescission) | *Nobody* | One button, one immutable audit record, upstream revocation receipts |
| ☐ | P2 | Org hierarchy roll-up reporting + "which of my 340 locations are dark" | Sprinklr Distributed ($50k entry) | Same view, self-serve, 5–75 location band |
| ☐ | P2 | Locked corporate templates with editable zones | TCMA vendors (SOCi/Rallio class) | Enforced by a publish-time content-diff check, not a policy doc |

## 1.2 Connections, credentials and connection health

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | OAuth connect for every supported network, resumable, with per-network troubleshooting | Vista (7+ help articles = the confession) | Bulk OAuth wizard; failure modes detected, not documented |
| ☐ | P0 | **Post-OAuth readiness assertion suite** — IG is Professional AND Page-linked; granting human holds Page ADMIN not Editor; Page in a Business Portfolio; YouTube Advanced features enabled; LinkedIn identity has a company page; TikTok region-approved; GBP location verified | **W — nobody** | Per-client punch list naming the failing precondition and the human who can fix it |
| ☐ | P0 | Multiple connections returned from one auth (GBP returns hundreds of locations; Meta returns many Pages) | Vista, Sprout | `completeAuth` returns an array; destination pickers for pages/boards/subreddits/locations |
| ☐ | P0 | Read-only identity probe on a schedule; never a speculative refresh | Buffer/Vista (implicit) | Probe is a distinct verb; speculative refresh manufactures token orphaning on X and TikTok |
| ☐ | P0 | Token expiry tracked with real per-network clocks (Meta ~60d, LinkedIn 60d hard wall without Community Management, TikTok 365d refresh TTL) | Publer models `*_reauth` post states | **Prediction**: fire a repair link N days *before* death with the queue exposure quantified — "dies Thursday, 14 posts behind it" |
| ☐ | P0 | **Scoped single-profile repair link**, no account, expiring, SMS/WhatsApp-able | Vista's connect link is the closest (blind) | Repairs exactly one broken profile, reports which precondition it fixed |
| ☐ | P1 | Scope-delta detection (platform added a required scope) → re-auth before publish time | Google only supports true incremental auth | Detect and pre-empt; do not claim "incremental re-consent" |
| ☐ | P1 | BYO developer app (`byo_app`) credential kind | Ayrshare (forced for X since 31 Mar 2026) | Present from the first commit; escape hatch for YouTube quota and GBP QPM |
| ☐ | P1 | Per-host dynamic client registration (Mastodon instances, self-hosted WordPress/Ghost) | Postiz, Mixpost | Archetype C as a base class, not a special case |
| ☐ | P0 | Connection health surface un-gated by tier | Vista gates nothing but detects nothing | Not tier-gated, ever |

## 1.3 Composer & content creation

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Omnibox → per-network customisation, with "apply to all" | Buffer (per network *type*), Vista (four-column) | Per **connection**, not per network type — two LinkedIn Pages must be separately tailorable (Buffer's known limit) |
| ☐ | P0 | Grapheme-correct counting per network's own counting system | *Nobody is correct* (Buffer's counter is not grapheme-correct) | Already built (`measureText`); add per-instance limits read live (Mastodon) |
| ☐ | P0 | Live per-network preview with violation warnings | Buffer, Vista | See §1.10 true-render preview — previews exist and are *not trusted* |
| ☐ | P0 | First comment; **up to 10 scheduled comments** | Vista | Match 10; model comment chains as targets so failure is visible |
| ☐ | P0 | Threads/chains: X (80 posts per Metricool), Threads, Bluesky, Mastodon, LinkedIn multi-part | Metricool (80 posts, 20 media) | Match 80; model `PARTIALLY_PUBLISHED` for partial thread failure |
| ☐ | P0 | Post labels/tags, colour-coded, filterable, usable as a reporting dimension incl. exclusions | Vista (4 label namespaces), Buffer (tags) | Four namespaces (post/media/inbox/queue) **plus** campaign and content-class; Buffer's tag analytics die on 7 networks — ours must not |
| ☐ | P0 | Draft states: undated draft vs dated draft | **Publer** (`draft_dated`/`draft_undated`) | Copy exactly — an idea is not a commitment |
| ☐ | P0 | Emoji picker; emoji-safe truncation | Buffer, Vista | Built (`truncateToLimit`) |
| ☐ | P1 | Hashtag panel, saved hashtag groups, 30-cap counter, AI generation | Buffer (Hashtag Manager), Vista | Add hashtag *performance* analytics — which tags drove reach |
| ☐ | P1 | Ideas/content library: folders, labels, notes, Kanban board, convert-to-post | Buffer (Ideas + board), Vista | Add capture surfaces: browser extension, mobile share sheet, **iOS Control Center / Action Button / Watch** (Buffer's, worth copying) |
| ☐ | P1 | Post templates and saved text snippets | Metricool | Match |
| ☐ | P1 | Signatures (workspace-scoped outro block) | **Publer** | Copy the scoping asymmetry: signature = workspace, watermark = account |
| ☐ | P1 | Custom fields / merge variables for multi-location | Vista | Resolve through the node tree, per location |
| ☐ | P1 | Spintax `{a|b}` variation syntax | **Publer** | Copy; then bind it to the similarity score (§1.9) so it is *provably* below the network threshold |
| ☐ | P1 | Per-network decoration — IG: user/product/location tags, ≤5 collaborators, Trial Reels, feed-visibility toggle, audio name edit; LinkedIn: PDF carousel, geo/industry targeting; TikTok: `disable_comment/duet/stitch`, cover timestamp, `creator_info` pre-flight; Pinterest: board + multi-board; Reddit: subreddit + flair + `post_requirements`; YouTube: category, tags, playlist, `publishAt` | Metricool (IG depth), Postiz (Reddit/TikTok pre-flight) | All of them, expressed as typed per-network extras — not a `jsonb` blob |
| ☐ | P1 | Mixed-media posts (image+video in one carousel) | **Metricool** (3:4–16:9, same AR) | Vista lists this as roadmap; ship it |
| ☐ | P2 | Polls (X, LinkedIn, Mastodon), calendar notes | Vista roadmap (absent) | Ship |
| ☐ | P1 | **Multi-language variants of one post** — per-target locale with its own body, media, and RTL-correct rendering | **W — nobody** | One post object, N locale variants, translation lineage, per-locale approval |
| ☐ | P0 | Alt text on every network that supports it, stored on the **asset** | Postiz (2 networks, reactively), Buffer (via Zapier only), **Vista: none found** | §1.7 — asset-level, AI-drafted, human-confirmed, per-network field-mapped, enforceable |

## 1.4 Scheduling engine, queues and slots

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Recurring weekly time-slot schedule per profile, unlimited slots | **Buffer** (the category's best queue), Vista | Keep Buffer's floating/pinned duality verbatim; it is the best idea in the product |
| ☐ | P0 | Floating ("next available") vs pinned ("custom time") posts | **Buffer** | Copy exactly |
| ☐ | P0 | Share Next / Move to Top / Move to Next Available / drag reorder | Buffer | Match |
| ☐ | P0 | Shuffle | Buffer (first 200, floating only) | No 200 cap; deterministic seeded so it is reproducible and explainable |
| ☐ | P0 | Schedule reflow when the schedule changes | Buffer (silent) | **Preview**: "this will move 47 posts" before commit |
| ☐ | P0 | **Typed/labelled slots + content categories with category-aware routing** | **SocialBee** (category→schedule indirection), Vista (queue labels) | SocialBee's indirection + declarative content-mix ratios ("30% educational") + slot type rules ("this slot only takes Reels") |
| ☐ | P0 | Per-profile timezone; "9am local per profile" mode | Vista is **group-level only**; Buffer is per-channel | Per-profile with group default + dual-time rendering in the composer ("09:00 there / 14:00 for you") |
| ☐ | P0 | Multi-time scheduling (one post, N times) | Vista | Match |
| ☐ | P0 | No scheduling-horizon cap | Buffer (depth-capped, not horizon-capped) | Match; cap queue depth on free, never the horizon |
| ☐ | P0 | Per-channel pause | Buffer | **Global/brand pause + crisis preset + restore review queue with bulk re-slot**; Buffer's per-channel-only pause is an operational hazard |
| ☐ | P1 | Recurring blackout windows (per profile, weekday, time range, zone) | Vista (partial) | Ship |
| ☐ | P1 | Approval-aware slot reservation | **W — nobody** (Buffer explicitly lacks it) | Reserve the slot while in approval; release on reject |
| ☐ | P1 | Posting Goals → auto-generate slots | **Buffer** | Copy the inversion (goal → schedule) |
| ☐ | P1 | Optimal-time suggestions inline in the composer | Vista (needs 90 posts), Metricool (heatmap), Publer (`/analytics/{id}/best_times`) | Copy Publer's architecture — one model shared by scheduler and analytics. Beat Metricool: theirs is **audience-activity** based ("when your followers post"); ours is **posterior-performance** based, cold-start-safe with a benchmark prior |
| ☐ | P0 | Configurable daily caps with audit | Vista's 25/day/profile is hard and unconfigurable | Default at the platform ceiling, configurable, audited |
| ☐ | P0 | Auto-schedule across a date range | Publer (`auto:true` + `range`), Metricool | Match, incl. Publer's `share_next` distinction |

## 1.5 Evergreen, recycling, recurrence and content sources

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | **Recycling** (evergreen, slot-filling, interval-based) | **Publer** (`gap`+`gap_freq`, `expire_count` OR `expire_date`, `solo`) | Copy the field set exactly; **show resolved future occurrences at creation** (kills Publer's own "why is my recycling post scheduled later?" article) |
| ☐ | P1 | **Recurring** (wall-clock, fixed repeat) as a *separate object* | **Publer** (`repeat`, `days_of_week`, `repeat_rate` 1–52) | Copy the conceptual split; it is better than a single "Evergreen" concept |
| ☐ | P1 | Category-level evergreen flag with loop-back | **SocialBee** | Combine with Publer's per-post model — both, not either |
| ☐ | P1 | Expiry caps: after N publishes and/or by date | SocialBee, Publer | Vista caps at 25 reuses / 3–100 day interval; ours: unlimited within an expiry policy, 1–365 days |
| ☐ | P1 | Auto-generated text variations on recycle | **MeetEdgar** | MeetEdgar's variations + Publer's spintax + a similarity score proving the variant clears the network threshold |
| ☐ | P1 | **Performance-weighted reuse** (re-share the top decile more often) | **W — nobody**; "reuse order appears to be queue order" across Vista/SocialBee/MeetEdgar/Publer | Rank the evergreen pool by 48h reach-normalised ER |
| ☐ | P1 | Expired recycler is resurrectable, not deleted | **Publer** (`recycling_expired` state) | Copy |
| ☐ | P1 | Pre-recycle health check: link still 200s, asset still exists, promo date not past | **W — nobody** | Block the recycle and raise it on the day sheet |
| ☐ | P1 | Evergreen ROI attribution (incremental impressions from republishes) | **Vista** (a genuine strength) | Match, then join to revenue (§1.16) |
| ☐ | P1 | RSS ingestion: auto-post / auto-schedule / library-only, new-items-only, caption templating | **Publer** (three modes), SocialBee (feed→category) | Copy the three modes and new-only semantics; add the missing fourth: **an approval queue between pull and publish**, which is why agencies distrust RSS |
| ☐ | P2 | News categories + `<meta>` auto-detection + AI angle | Vista Smart Publishing (72h first-import guard) | Match, with brand voice + brand safety applied |
| ☐ | P0 | Bulk CSV import: arbitrary column order by header, downloadable per-network templates, per-network customisation columns, Pinterest multi-board | Vista (200 rows), Buffer (Aug 2025, per-network templates) | 1,000 rows chunked; dry-run validation with **errors written back into the source sheet** |
| ☐ | P1 | **Live bidirectional Google Sheets / Airtable / Notion binding** | **W — nobody**; hand-built 39×/48× in the n8n corpus | Column mapper + live sync + status write-back, not one-shot import |
| ☐ | P1 | Cloud-folder watch (Drive/Dropbox) → auto-ingest → auto-caption → queue | **W — nobody**; repeatedly hand-built in n8n | Per-client watched folder |

## 1.6 Calendar & planners

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Month/week/list/grid views, drag-drop reschedule preserving draft status | Buffer, Vista, Metricool | Match |
| ☐ | P0 | Filters: member, label, content type, queue label, boosted, status | Vista | Plus: include natively-published posts pulled back in |
| ☐ | P0 | **Shared calendar link**: no login, custom title, timezone, date range, expiry, password, external approve/reject/edit-with-note | **Vista** | Match all seven properties; Frame.io-grade scoping on the link |
| ☐ | P0 | Cross-brand calendar view | Metricool (Studio Calendar Views) | Match; Metricool's inbox has no cross-brand view — ours must, everywhere |
| ☐ | P1 | Cross-brand content duplication | Metricool | Match |
| ☐ | P1 | Instagram grid planner with drag-to-rearrange | Later, Vista, Planable (Grid view) | Match |
| ☐ | P1 | TikTok planner with trending-audio library | Vista, Metricool (top-100 songs by country/genre) | Match — and be honest that catalogue audio forces reminder delivery |
| ☐ | P1 | Holiday overlay across countries and religions | Vista | Plus CLDR-correct first-day-of-week and Fri–Sat weekend shading |
| ☐ | P1 | Calendar CSV export; auto-save every 30s | Metricool | Match |
| ☐ | P0 | **The day sheet** — next-24h readiness ledger, red/amber/green per row | **W — nobody**; calendars show intent, never readiness | §1.9 |

## 1.7 Media library, renditions, rights and intake

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Images/video/audio/documents, 2 GB per file, bulk upload ≥25 | Vista (2 GB, 25) | 100-item bulk upload |
| ☐ | P0 | Folders + labels + group-scoped access restrictions | Vista | Match |
| ☐ | P0 | `used` / `unused` flag on assets | **Publer** (almost nobody ships it) | Copy — then upgrade it from a boolean to an outcome (§1.14) |
| ☐ | P0 | Alt text stored on the asset | Vista: none found anywhere | AI-drafted at upload, **human-confirmed before it can publish**, per-network field mapping (Meta image+Reel, per-child on carousels; X `POST /2/media/metadata` ≤1,000; LinkedIn `content.media.altText`; Bluesky ≤500; Pinterest `alt_text_custom`; TikTok none), carousel fan-out, warn-or-block linter, per-workspace accessibility report |
| ☐ | P0 | Custom video thumbnail / `thumb_offset` | Vista | Match |
| ☐ | P1 | Cloud sync: Drive, OneDrive, Dropbox, Box | Vista, Metricool | Honour Box classifications; Buffer has **no media library at all** |
| ☐ | P1 | Stock: Unsplash, Pexels, Giphy/Tenor | Vista, Metricool, Publer | Match |
| ☐ | P1 | Canva integration | Vista, Publer, Metricool, Buffer | Beat all of them: register as a **destination inside Canva** (Content Publisher Intent) and call `POST /v1/resizes` — nobody in SMM calls it |
| ☐ | P1 | Built-in photo + video editor | Publer, Metricool (web-only video) | Match, mobile included |
| ☐ | P1 | **Watermarks**: PNG, size/position/opacity/padding, default flag, ≤10 per account, account-scoped, applied at publish | **Publer** (photo = Professional, video = Business) | Copy including the price discrimination; note TikTok cannot be watermarked |
| ☐ | P1 | Perceptual + exact hashing for dedupe | Vista (partial) | Both hashes, distinctly stored |
| ☐ | P1 | **Per-network rendition presets from one master, with probe-and-passthrough and a content-hash rendition cache** | Vista auto-pads and always re-encodes ("slight reduction in video quality"); Postiz resizes everything to 1000px | Never re-encode a compliant file; compute each (asset, preset) once and reuse across clients; **visual diff at schedule time** showing what is cropped, with subject-detection smart crop the operator can nudge |
| ☐ | P1 | Asset version stack — replace the file, keep the comment history | **Frame.io**; "no social equivalent" | Ship it |
| ☐ | P1 | Derivative presets on the asset | **Bynder** (no scheduler has it) | Ship it |
| ☐ | P1 | Asset quarantine / review gate before use | Bynder | Light version |
| ☐ | P1 | **Rights and consent capture at upload** — who shot it, model release, usage expiry, territory, channel scope | Bynder has **zero** keyword matches for rights/expiry/embargo/watermark/licence across 20 API specs; clearance is 100% manual across every vendor | Rights grant object + **dependency ledger** joining an expiring grant to the live posts, ad groups and gallery slots that depend on it, with the daily spend at risk |
| ☐ | P1 | **Client asset intake portal** — branded, no-login upload link, request object with due date and chase reminders, validation at the door | **W — nobody** | Same pattern as the connect link, pointed at media |
| ☐ | P1 | AI-generated media lands in the library with provenance | Vista | Provenance fields are mandatory, not optional (§1.24) |
| ☐ | P2 | DAM connectors (Bynder/Frontify/Brandfolder) reading assets **and writing usage back** | Nobody in social | Integrate, do not build a DAM |

## 1.8 Approvals, review and collaboration

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Named, ordered, multi-step approval chains | **Planable** (none/optional/required/multi-level; OR within a level, AND between levels; nameable levels) | Copy the taxonomy exactly. Beat it: Planable's "optional" publishes anyway and multi-level is Enterprise-only — ours is a hard gate at every tier |
| ☐ | P0 | Step assignment to person / any group member / user group / external reviewer | Vista | Match |
| ☐ | P0 | Non-bypassable "schedule pending review" permission | **Metricool** | Copy; enforce it at the **API layer** too (Buffer's approvals are UI-only) |
| ☐ | P0 | External client approval with **no account** | Metricool (from email), Planable (guest links), Vista (shared calendar) | No-account **and** no seat **and** batched: decide a week in one sitting, comment per post, decide once |
| ☐ | P0 | Rejection halts the chain, returns for edit, notifies with a direct link | Vista | Match |
| ☐ | P0 | Full audit trail of every approval, rejection and note on the post | Metricool | Match, hash-chained |
| ☐ | P0 | **Approval bound to a content-version hash, auto-invalidated on material edit** | **W — nobody**; the category models approval as a status field on a mutable object | Material-change whitelist (time, slot, internal tags do not invalidate); **redline diff on re-review** |
| ☐ | P1 | Version history per post | Planable | Match |
| ☐ | P1 | Internal-flagged posts *and* comments, invisible to the client in the same thread | **Planable** | Copy — it must be in the data model on day one |
| ☐ | P1 | Threaded comments, direct annotations on the creative, Google-Docs-style suggestions | **Planable**, Frame.io | Match; time-coded comments on video in phase 2 |
| ☐ | P1 | `@`-mentions in notes | Vista; **Buffer has none** ("something we're considering") | Match |
| ☐ | P1 | Interactive **Slack and Microsoft Teams** approval cards with approve/reject/comment | Vista is webhook-only; nobody has Teams | Both, with state stored by us |
| ☐ | P1 | Conditional/branching routing (network, label, spend, region, AI-generated flag, policy-keyword hit) | Sprinklr (six figures) | Small closed vocabulary + templates, not a general workflow builder |
| ☐ | P1 | Parallel steps, quorum, conditional skip, auto-approve-below-threshold | Sprinklr | Ship at the agency tier |
| ☐ | P1 | SLA per step, escalation ladders, digest batching, OOO delegation | **W — mid-market has none** | Ship |
| ☐ | P1 | Approval applies to recycled/evergreen posts too | **Publer** (`recycling_pending`) | Copy — most tools forget |
| ☐ | P1 | Seatless expiring password-protected review links | **Frame.io** `review_links` | Ship; it is also a growth surface |
| ☐ | P1 | **Risk-ranked batch review** — auto-approve clean under policy, surface only exceptions ranked by risk with diffs | **W — nobody**; "bulk approve" returns zero across 41k lines | Approve 40 posts by reading 6 |
| ☐ | P1 | Tasks (general + typed: sales lead, support issue), creatable from an inbox item | Vista | Match |

## 1.9 Publishing reliability, verification and the readiness surface

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Pre-flight validation at compose, at schedule, and at T-60s | Buffer (composer warnings only) | Three moments; a publish-time validation failure is logged as **our** bug with an owner |
| ☐ | P0 | Typed error taxonomy, closed set, mapped by every adapter | Postiz (error-code mapping), Publer (26 post states) | 13 classes + `PUBLISHED_THEN_REMOVED` + `PARTIALLY_PUBLISHED` |
| ☐ | P0 | Auto-retry on transient failure with jittered backoff inside a **lateness budget** | Vista's documented remedy is *"duplicate the post and publish it again"* | Retry inside a user-configurable lateness budget, not an attempt count |
| ☐ | P0 | Per-attempt idempotency key from `(target, content_hash)`; claim before call | **Upload-Post** is the only vendor with a documented `Idempotency-Key` | Claim-before-call + idempotency + `VERIFY_PENDING` resolved by asking the network, never blind retry |
| ☐ | P0 | `*_reauth` as a first-class post state | **Publer** | Copy — and unlike Publer, have webhooks so something can page someone |
| ☐ | P0 | **Authenticated read-back reconciliation** at +1m/+10m/+1h/+24h | **W — nobody** | Reddit `/api/info` `removed_by_category`/`banned_by`, Meta media-node GET, TikTok status, X compliance events. Where no read-back path exists, the UI says "removal detection unavailable on this network" |
| ☐ | P0 | Publish-verification: is the post actually publicly visible | **W — nobody** (corpus gap G7) | Authenticated read-back only — **no logged-out scraping** |
| ☐ | P0 | Per-network daily-cap and rate budgeting enforced locally | Postiz `maxConcurrentJob` per network (Reddit 1 … Facebook 500) | Three nested budgets: app/project fair-share, tenant, connection |
| ☐ | P0 | **Pre-flight quota simulation across the whole calendar** — "this calendar breaches Instagram's cap on the 14th" | **W — nobody** (corpus gap G5: "every tool discovers the limit by hitting it") | Ship |
| ☐ | P0 | Live destination rules (TikTok `creator_info`, Reddit `post_requirements` + flair, IG `content_publishing_limit`) | Postiz fetches TikTok `creator_info` — the pattern exists, ungeneralised | Generalised destination-rules engine across ~55 networks, seeded by our own observed-failure corpus |
| ☐ | P0 | **Cross-account near-duplicate guard at compose time** | **W — nobody**; Vista's remedy is the string *"Vary the copy"*; Buffer's 2018 answer was to **remove** capability; Postiz issue #1779 is open | SimHash/MinHash over normalised shingles + pHash on media, indexed by (workspace, network, publish_window); per-network policy objects (X 72h substantially-similar, Pinterest per-board, Reddit crosspost rules, Meta downranking); one-click resolution that **provably** moves the score below threshold, shown before/after |
| ☐ | P1 | Composite publishing hold / crisis mode with restore review queue | Buffer per-channel pause only | Scope (org/node/profile/label) × policy (skip / defer / defer-past-window) × restore semantics |
| ☐ | P0 | **The day sheet** — everything publishing in the next 24h, red/amber/green on token health, rendition readiness, link reachability, cap headroom, approval state, reminder items needing a human at a specific minute | **W — nobody** | Ship |
| ☐ | P0 | **Overnight incident digest** to push/Slack/Teams/WhatsApp with one-tap retry / reschedule +1h / move to draft / send repair link | Improvised in "nearly every community workflow", absent as a feature | Ship; exportable per client as a reliability ledger |
| ☐ | P1 | Visible retry ledger + per-tenant exportable reliability ledger | **W — nobody** | Ship; do **not** publish an aggregate p95 page |
| ☐ | P1 | Aggregated publish-failure alerting into Slack/Teams/email | Hand-built in n8n everywhere | Ship |
| ☐ | P2 | Contractual SLA with service credits | Sprinklr | Ship at enterprise; it is the artifact that appears in an RFP |

## 1.10 Preview fidelity

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Per-network live preview | Buffer, Vista, Metricool, Planable | Buffer's verbatim complaint is that the preview exists and is not trusted — "I still go back and forth which kinda wastes the time I just saved" |
| ☐ | P0 | **Real link card** — server-side OG/oEmbed fetch with a realistic UA, cached, with manual override and an explicit "this destination returns no card" warning | Vista scrapes OG and documents the failures; nobody renders the real card | Ship, including the Facebook-refuses-previews-for-facebook.com case and Cloudflare-blocked empties |
| ☐ | P0 | **The truncation fold** — where "See more" actually lands, computed on graphemes at real rendered width per network and device class | **W — nobody**; character counters are the state of the art | Ship |
| ☐ | P0 | Degradation notes in the same panel (first comment here not there; this sticker forces reminder publishing) | Vista (partial, in docs) | In the composer, at the moment the user adds the offending element |

## 1.11 Inbox & engagement

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Unified stream: comments, DMs, mentions, reviews, shares | Vista, Agorapulse | Metricool has no DMs on 4 networks and Buffer has **no DMs anywhere** since Reply was sunset 1 Jun 2020 |
| ☐ | P0 | **Cross-brand unified inbox** | **W — Metricool's single biggest workflow defect** (brand switcher per client) | One queue across a 25-client book |
| ☐ | P0 | Filters: type, sentiment, priority, campaign, label, assignee, status | Vista | Match |
| ☐ | P0 | Assign to member; linked task; internal notes with @mentions | Vista | Match |
| ☐ | P1 | Saved replies + saved-reply groups; macros (reply+label+assign+close in one click) | **Vista** | Match |
| ☐ | P1 | Sentiment auto-tagging **with a written rationale** | Vista | Match |
| ☐ | P1 | Like/react as the brand where the API allows (FB, LinkedIn, TikTok yes; IG unverified; YouTube/Threads no) | **W — trivial, nobody does it** | Ship with an honest per-network matrix |
| ☐ | P2 | Block users where the API allows (**Facebook Pages only**) | **W** | Ship, and say in the UI why IG cannot |
| ☐ | P1 | Ad-comment / dark-post comment moderation | Agorapulse; Metricool explicitly cannot | Ship |
| ☐ | P1 | **Reply-window triage: inbox sorted by time-to-expiry, not recency** | **W — every inbox sorts by recency**; the windows are documented and hard | Two-clock state machine per conversation (Meta 24h DM reset by each user message; comment→private-reply one-shot within 7 days; a comment does **not** reset the DM clock); "14 conversations lose their window in under 2 hours"; honest "window closed" instead of a failed send |
| ☐ | P1 | Published per-network polling interval so the operator knows how stale the view is | **W** | Beat Vista's 6–7h non-Meta latency and 500 items/profile/day cap; publish the number |
| ☐ | P1 | SLA as a managed object: targets per brand/channel/type, pre-breach alerts, escalation ladders, SLA-based routing | **W — mid-market has none**; Statusbrew rules engine is the closest | Ship; refuse SLA configs our measured detection latency cannot meet |
| ☐ | P1 | Timezone-aware handover digest ("47 arrived, 12 unanswered, 3 approaching breach") | **W** | Ship |
| ☐ | P0 | Inbox performance report: response time, action rate | Vista | Match |
| ☐ | P1 | Conversation archive | Metricool has none | Ship, retention-class aware |

## 1.12 DM & inbox automation

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Rule engine — triggers: new DM, new comment (post/live/Reel), story reply, mention, new review with star + keyword conditions | **Vista** | Match |
| ☐ | P0 | Actions: send DM (video/image/link/card), public reply, hide, delete, label, assign | Vista | Match |
| ☐ | P0 | **Dynamic AI reply** with a custom prompt per interaction | Vista | Match, brand-voiced and gated |
| ☐ | P1 | Comment-triggered DM (giveaway/launch flows) | Metricool DM Automation, Vista | Publer has none — name it |
| ☐ | P1 | Multi-message IG sequences | Vista | Match |
| ☐ | P0 | Published per-network trigger/action matrix | Vista (partial) | Full honesty matrix |
| ☐ | P0 | Every automation write passes the same server-side policy gate as a human write | **W** | Architectural, not a setting |

## 1.13 Reviews & reputation

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | Monitor ≥8 sources: GBP, Facebook, App Store, Google Play, Yelp, TripAdvisor, OpenTable, Trustpilot | **Vista** | Match; App Store + Google Play are rare and worth having |
| ☐ | P1 | Direct in-app reply where an API exists (GBP, Facebook, App Store, Google Play, Trustpilot) | Vista | Match, and state honestly that Yelp/TripAdvisor have **no owner OAuth and no response API** |
| ☐ | P1 | AI review replies in brand voice; star-rating automations | Vista | Match |
| ☐ | P1 | Review performance report | Vista | Match |
| ☐ | P0 | **Review generation**: email/SMS request campaigns, review landing pages, QR-to-review, embeddable widgets | **W — ceded to Birdeye/Podium at 3–5× price** | Ship — and never selective solicitation or gating, which Google prohibits |
| ☐ | P2 | Google Q&A management | **W** | Ship |
| ☐ | P1 | GBP Local Post publishing (not just review response) | Vista UNVERIFIED | Ship |

## 1.14 Analytics, reporting and the creative index

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Report catalogue: profile, post, paid, paid-vs-organic, competitor, review, sentiment, inbox, listener, benchmark, advocacy, GA4 | **Vista** | Match all twelve |
| ☐ | P0 | Custom report templates, module reorder, white-label PDFs | Vista, Metricool | Match; no 100-post truncation (Publer's PDF caps at 100 — trivially winnable) |
| ☐ | P0 | Scheduled delivery weekly/monthly/one-time to PDF, CSV, live link | Vista | Match |
| ☐ | P0 | Unlimited analytics retention | **Vista, Metricool** | Match — the retention *is* the switching cost |
| ☐ | P0 | Backfill on connect | Vista 60d; Metricool to 1 Jan of previous year (Pinterest 90d, YouTube 30d capped) | **Platform re-fetch**: IG ~2y, FB ~2y, YouTube full, LinkedIn ~12m, on connect, with a progress UI |
| ☐ | P0 | **Daily snapshots from connect incl. `followers_at_post_time`** | **W** | Pinterest 90d, X non-public 30d, TikTok ~60d are destroyed forever otherwise |
| ☐ | P0 | Video mechanics: retention %, 3-second view rate, avg watch time, reposts | **Metricool** (its most concrete lead) | Match |
| ☐ | P1 | Competitor analytics ≥6 networks | Vista 2 (FB/IG); Metricool has no TikTok/LinkedIn; Publer FB/IG/X | 6+, including TikTok and LinkedIn, the two agencies most want |
| ☐ | P1 | Custom/calculated metrics with a formula builder | **W** | Ship |
| ☐ | P0 | **Metric provenance on every number** — source, endpoint, `field_as_returned`, api_version, collected_at, transform | **W — the whole market is empty** | Three layers L1 raw / L2 canonical + comparability class / L3 derived; formula exposed on the number |
| ☐ | P0 | **Comparability classes + definition-change annotations** | Metricool is closest ("metric honesty as a feature") and still has no versioned definitions | Vertical rule on every chart at each change date; deltas spanning one badged "not directly comparable" |
| ☐ | P0 | **Reconciliation view: why our number differs from the platform's own UI** | **W — the category's most humiliating recurring moment** | Per metric: attribution window, timezone boundary, dedup rule, rename, sampling |
| ☐ | P1 | Engagement rate with four named definitions | **W** | Formula on the number |
| ☐ | P1 | Industry benchmark with percentile ranking, k-anonymity ≥20–30, opt-out | Vista, Databox Benchmarks | Match |
| ☐ | P1 | **Goals as contract objects** — target, metric bound to the conformed layer, period, owner, progress, variance, rendered on every client report | **W — "trivially, and nobody does it"**; Buffer's Posting Goals are activity targets, not outcome commitments | Attach at any node level; support leads, orders, attributed revenue, review volume, SoV |
| ☐ | P1 | **The creative index** — one searchable index over everything ever posted: caption embedding, media pHash, link, format, metrics | **W — both halves documented as missing, nobody joins them** | Three questions: "find the post that performed" (semantic, cross-client, normalised outcome), "have we used this asset for this client before" (pHash → prior uses + results), "what worked here that we haven't run there" |
| ☐ | P1 | Asset → post → network → performance provenance | **W — DAMs have download analytics without outcomes; schedulers have metrics without asset identity** | Only a publishing system can close it |
| ☐ | P2 | Hashtag performance analytics | **W** | Ship |

## 1.15 Warehouse, BI and data portability

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | **First-party BI connectors — Looker Studio, Power BI, Google Sheets — free on every tier** | **Metricool** (14 channels, 25+ sources, brand auto-grouping) gated at Advanced ($53–107) | Free, including the free tier; brand auto-grouping by name pattern; organic **and** paid in one source |
| ☐ | P0 | **A published schema-deprecation policy** — versioned field names, additive-only within a version, deprecation window, changelog | **W** — Metricool documents that its own renames break production client dashboards | "Schema stability is the unmet need, not more fields" |
| ☐ | P1 | Row-level export of posts, links, clicks, mentions, enrichments | Everyone exports aggregates | Row-level |
| ☐ | P1 | **Warehouse-native delivery: versioned dbt package, Iceberg/BYO bucket, Snowflake Native App, BigQuery listing, Delta Sharing** | **W — "no SMM tool ships one. Not one."** `fivetran/dbt_ad_reporting` has 218 stars for paid; `dbt_social_media_reporting` has 24 and one thin model for organic | Ship the organic-social equivalent of the paid package |
| ☐ | P2 | Reverse ETL: warehouse query → content brief / suppression list / route a mention to a named CSM | **W** | Ship |
| ☐ | P0 | Bulk data export, event-level, JSON **and** flat CSV | Khoros | Match; **give away the raw data, keep the derived intelligence** |

## 1.16 Links, link-in-bio, attribution and commerce

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Native shortener on our own domain + per-link click tracking | Buffer owns buff.ly and performs no post-level join; Publer outsources to 8 BYO shorteners and has **zero click data of its own** | Own the redirect; log server-side before any cookie exists |
| ☐ | P0 | UTM rules engine, auto-append by rule, preserving user-typed UTMs | Buffer (auto-UTM; custom is paid-only; **not supported at all on Instagram, Pinterest, Mastodon**) | Every network, every tier |
| ☐ | P0 | **`utm_content` = our internal `post_id`, plus `ref=`, plus an opaque server-side click id** | **W** — "almost every SMB tool leaves `utm_content` empty" | Mint `post_id` at compose; rewrite every outbound URL at publish **before** shortening; persist pre- and post-rewrite URLs so the join survives an edit |
| ☐ | P1 | Link-in-bio: blocks, themes, drag reorder, embeds (Calendly, Typeform, YouTube), QR, page analytics | Vista Page, Metricool SmartLinks, Buffer Start Page (forwarding-only, billed as a channel) | **Free forever, real CNAME + auto-SSL custom domains, never billed as a channel** |
| ☐ | P1 | Importers: Linktree, Beacons, Stan, Milkshake, Komi | Vista (Linktree, beta) | All five — "the cheapest growth mechanism in this category" |
| ☐ | P1 | Auto-linked feed (post → products/links); YouTube auto-population | Metricool (Apr 2026) | Match |
| ☐ | P1 | Native email capture → contact record → ESP sync (Klaviyo/Kit/Mailchimp) | Beacons | Not a Typeform embed |
| ☐ | P1 | Pixel hosting (Meta/TikTok/Google) on the page | Shorby | Match |
| ☐ | P1 | **Order-level revenue join into Shopify's own order object** — `ref=<post_id>` → `CustomerVisit.referralCode`, plus cart/note attributes, read via `CustomerJourneySummary.firstVisit/.lastVisit` under `read_orders` | **W — no SMM tool reads it**; Vista has no Shopify integration at all | post → click → visit → order → line items → margin, first-visit and last-visit shown side by side |
| ☐ | P1 | **Write-back: register each post as an external marketing activity** (`marketingActivityUpsertExternal` + `marketingEngagementCreate`) so Shopify attributes with its own model in the merchant's native report | **W** | Put our numbers inside the source of truth the customer already trusts |
| ☐ | P1 | Multi-carrier creator attribution: unique discount code + unique link + cart attributes + post-purchase survey, with a **published reconciliation precedence** | Creator platforms (GRIN/Aspire/CreatorIQ) have codes but no scheduling; Later runs Mavely as a separate data model | Report the deduped number **and** every per-carrier number; the divergence is the insight |
| ☐ | P2 | Payouts computed off the reconciled ledger, 1099/DAC7 handled, money movement bought in | Shopify Collabs (~2.9%) | **0% take rate**, funded by subscription |
| ☐ | P1 | **Bot-filtered vs raw clicks with published methodology** (Slackbot, WhatsApp, Discord, Telegram, facebookexternalhit, Googlebot) | **W** — "no vendor publishes bot-filtering methodology, so clicks is not comparable across vendors" | Publish it |
| ☐ | P2 | **HDYHAU self-reported attribution widget + LLM classifier**, shown beside click attribution with the gap named as the dark-social estimate | **W** — exists only in Fairing/KnoCommerce, never joined to posts | Ship |

## 1.17 Paid, boosting and blended reporting

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | Ad account connect; boosting from the composer/calendar | Vista, Metricool | Match |
| ☐ | P1 | Saved **boost configurations** (targeting + budget + duration presets) | **Vista** | Match |
| ☐ | P1 | Meta targeting: include/exclude audiences, interests, work positions, locations, gender, age | Vista | Match |
| ☐ | P1 | **Dark posts** | Vista | Match |
| ☐ | P1 | Simplified campaign builder across Meta/Google/TikTok Ads with objective, audience, budget, bid cap, creative, pre-launch summary | **Metricool** (deeper than expected) | Match — "the reporting payoff is disproportionate" |
| ☐ | P1 | Paid + organic in **one object model**, one dashboard, one BI feed | **Metricool** — its most under-appreciated asset | Match, then add the cost side (§1.25) and the revenue side (§1.16) that Metricool lacks |
| ☐ | P1 | Boosted filter on the calendar; organic-vs-boosted split on every post | Buffer (split), Vista (filter) | Both |
| ☐ | P2 | Organic→paid amplification rules with spend guardrails **and rights validation** | **W** | Ship, gated on `ads_management` Advanced Access |

## 1.18 Listening

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | Internal (owned) + external listeners, keyword groups with AND/OR and exclusions | Vista | Match; Metricool has **no listening product at all** (only a €25/day/network hashtag stub on X + IG) |
| ☐ | P1 | Sentiment, share of voice, volume trend, top authors/influencers | Vista | Match |
| ☐ | P2 | True Boolean query language: NEAR/proximity, nesting, regex, language and geo filters | Enterprise-only across the market | Ship |
| ☐ | P2 | Historical backfill on listener creation | **W — listeners universally start at creation date** | Ship |
| ☐ | P2 | Versioned queries so editing does not silently rewrite history | **W** | Ship |
| ☐ | P1 | **Per-source coverage class + live quota meter on every result set**; degrade by sample-and-extrapolate, never blind | **W — the category's listening claims are systematically dishonest** | Ship; never claim omniscience |

## 1.19 AI layer

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Caption generation, regenerate, improve/rewrite, translate, hashtags, inbox replies, review replies, alt text | Everyone | **Unlimited text AI on every plan** — Buffer already removed credits; matching it is table stakes |
| ☐ | P0 | **Brand voice as a persisted, per-node object** (samples, rules, banned terms, claim allowlist, required disclosures) | Vista (per-profile-group policy + RAG Knowledge) is the best in market; **Buffer has no voice object at all** | Versioned + **evaluated**: a golden set of real brand posts, a classifier + rubric judge, a voice-adherence score in the composer, automatic re-run on model change, **model version pinned per brand and upgrades blocked on regression** |
| ☐ | P0 | Separate brand-safety policy applied automatically | Vista | Match |
| ☐ | P1 | RAG knowledge: documents, pasted specs, Zendesk KB ingestion, assignable to a chatbot block, **Test tab** | **Vista** | Match, node-isolated |
| ☐ | P1 | Conversational surface: trends by market/vertical → angle (newsjack/educational/hot take/promo/ask) → image + caption + inline schedule | Vista ("Ask Vista") | Match |
| ☐ | P1 | Image generation **and AI image editing**; text-to-video; animate a library asset | Vista (deepest mid-market stack); Metricool has **none** | **Brand-asset-anchored generation**: asset roles (product shot, logo, headshot, style ref) × modes (anchor-compose, enhance-extend, style-referenced, pure-creative) + a **pixel-fidelity gate** that diffs the anchor region and blocks publish when the product or logo was altered beyond tolerance |
| ☐ | P0 | **Pre-flight cost estimate before every metered job** | **W — "the entire documented source of credit-system resentment"** | "This 62-minute episode → ~10 clips, ~60 credits, about $2.40" |
| ☐ | P0 | Published credit rate card; 1 credit = 1¢ of underlying cost | Vista publishes **no** per-credit price and its own sources conflict | Publish it |
| ☐ | P1 | **Generation lineage** — prompt, model+version, voice policy id, retrieved context, extracted creative features, with the published outcome written back onto the same trace | **W — whitespace item #1**; "every vendor has generation and measurement as disconnected modules" | Retrieval of the brand's own top-decile traces as few-shot context; per-feature lift with uncertainty ("question hooks on LinkedIn: +34% ER, n=22, 80% CI"). The point is the join key, not the model |
| ☐ | P1 | Multilingual quality parity | Explicitly criticised in Vista; weak category-wide | Ship |
| ☐ | P2 | **Creative allocation as a bandit over queue slots**; randomised trials across ≥30 comparable accounts/locations with the MDE declared before the test runs | **W — absent across all eleven vendors compared**; the category stopped at "best time to post" | Multi-objective reward (ER **and** sentiment **and** voice adherence **and** follower retention) with brand safety as a hard feasibility constraint |
| ☐ | P2 | **Content-pillar holdouts / switchback tests** with pre-declared MDE and a refusal to start underpowered tests | **W — the only genuinely causal answer for organic** | Ship; report a CI, never a point estimate |

## 1.20 Agents, MCP and autonomy

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | First-party MCP server, ~60 tools | **Vista** (~60), Metricool (free on every plan incl. free), Buffer | Match the surface; free on every plan |
| ☐ | P0 | **MCP write-safety: `dryRun` default true, propose→confirm token handshake, scoped per-brand agent tokens, hard publish/spend caps — enforced server-side** | **W — nobody, including Vista's 60 tools** | Client-side consent is advisory and absent for headless agents; the gate lives on the server |
| ☐ | P1 | Scoped permission packs on the MCP surface | **Frontify** (no social tool has it) | Copy the pack model |
| ☐ | P1 | **Autonomy as policy objects** — per workspace/brand/channel/action: mode (off/propose/approve-required/auto-within-budget/auto), budgets, guardrails, escalation triggers, reversibility window | **W** — only Sprinklr has anything adjacent, at six figures | Data, not a settings toggle |
| ☐ | P1 | **Decision traces** — inputs consulted, policy evaluated, model+version+prompt hash, candidates, ranking, approver, reversal path | **W** — matrix scores this present only for Sprinklr | Immutable non-personal skeleton (hash-chained, 7y) + erasable tombstoned payload, or it is unshippable under GDPR Art. 17 |
| ☐ | P1 | **Shadow mode with a published agreement rate** | **W — no precedent** | N days recording what the agent would have done beside what the human did |
| ☐ | P1 | Replay harness scoring a configured agent against historical threads before it touches a live account | **W** | Ship |
| ☐ | P1 | Kill switches per action type, per brand, global | **W** | Ship |

## 1.21 Repurposing, video and localisation

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | Transcribe every uploaded video unconditionally ($0.040/hour) | 9 of 11 category products do not | Unlocks captions, search, repurposing, accessibility, brand safety |
| ☐ | P1 | Auto-captions + burn-in, ≥4 styles | Absent in 9 of 11 | ffmpeg `libass`, not AI; cheapest genuine differentiator |
| ☐ | P1 | **Long-form → short-form clip extraction inside the composer** | **OpusClip** — and OpusClip has added scheduling while **no scheduler has added clipping** | A publishing option, not a second subscription |
| ☐ | P1 | Auto-reframe to 9:16 with subject tracking | OpusClip | Match |
| ☐ | P2 | Per-market dubbing + lipsync as a publish option | Absent in 10 of 11; <$30 per video into 20 markets | Ship |
| ☐ | P1 | **Meter on SOURCE minutes, not output clips** | **W** | Rewards generating many candidates and keeping the best — the behaviour that produces quality |
| ☐ | P1 | "Edit in Descript" handoff | **W** | One endpoint, real value |

## 1.22 Employee advocacy

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P2 | Curated feed, brand pre-approval, leaderboard with shares/engagement/**EMV**, badges, Slack alerts, advocacy report | **Vista** ($199/mo add-on) | Match; include in the plan rather than as a $199 add-on |
| ☐ | P2 | Advocate-suggested content submission; disclosure enforcement (#ad) | **W** | Ship |

## 1.23 Integrations, API and the automation surface

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Public REST API: profiles, posts, comments, media, **analytics**, scheduling | Publer (documented, versioned, but Business-gated, poll-only, no webhooks); **Buffer's is publish-only and cannot read its own analytics**; Metricool's is single-tenant Advanced+ | Multi-tenant OAuth, analytics included, **self-serve on every paid plan, no sales gate** |
| ☐ | P0 | OAuth 2.0 auth-code + PKCE and API keys | Vista | Match |
| ☐ | P0 | Typed outbound **webhooks** with retry, dead-letter, signature verification | **W — Publer has none, Metricool has none, Buffer has none** | Ship |
| ☐ | P0 | Idempotency keys on the public API | Upload-Post only | Ship |
| ☐ | P0 | Published rate limits with a documented backoff contract | Vista deactivates keys after 10 violations/hour | No punitive deactivation |
| ☐ | P1 | Zapier + Make apps with the full trigger set (published, scheduled, draft created, needs review, rejected, failed) | Vista | Match; embed Zapier templates in-product via the Partner API |
| ☐ | P1 | **Official n8n node** | Blotato and Upload-Post have them; n8n core has **no Instagram/TikTok/Pinterest/Threads/Bluesky nodes at all** | Ship — this is a direct wedge |
| ☐ | P2 | Slack app (multi-channel, custom branding) + **Microsoft Teams app** | Vista has Slack only | Both |
| ☐ | P1 | GA4 integration | Vista, Metricool | Match |
| ☐ | P1 | Commerce/CMS: Shopify, WooCommerce, WordPress, Wix | Metricool (WordPress/Shopify/Joomla/Wix) | Match, plus the order join (§1.16) |
| ☐ | P1 | BYO shortener integrations (Bitly, Rebrandly, Dub.co, Switchy, PixelMe, JotURL, RocketLink, RetargetKit) | **Publer** (8) | Offer BYO **and** own the redirect — Publer's model gives it zero click data |

## 1.24 Security, compliance, provenance and disclosure

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P1 | SAML 2.0 SSO, self-serve | Sprout/Hootsuite (Enterprise, sales-gated); Vista has none | **Enable it with a credit card during the free trial** — not one of fourteen enterprise vendors allows this |
| ☐ | P1 | SCIM 2.0 with real deprovisioning and IdP group→role mapping | **Sprout has none on any plan** | Ship self-serve |
| ☐ | P1 | 2FA that coexists with SSO | Vista disables 2FA when SSO is on | Ship |
| ☐ | P1 | Immutable audit log, 50+ event types, CSV + API export, SIEM destinations | Sprout, Hootsuite; **Vista partial, Metricool post-level only** | Hash-chained skeleton + erasable payload |
| ☐ | P0 | SOC 2 Type II, ISO 27001, published DPA with SCCs, sub-processor list **naming AI model vendors**, no-training clause | Vista has none | Start the observation window on day one |
| ☐ | P1 | Data residency as a signup-time region selector, region-pinned inference | Sprinklr only | Self-serve |
| ☐ | P1 | Per-tenant retention policy per data class + legal hold | Enterprise-only | Ship; enforce YouTube's 30-day cap and per-network ToS by **partitioning metric storage by network** |
| ☐ | P1 | Trust Center: SIG Lite, CAIQ, pen-test summary, **VPAT / WCAG 2.2 AA statement** | **W — accessibility is weak market-wide and blocks public-sector deals** | European Accessibility Act obligations bit on 28 Jun 2025 (EN 301 549 → WCAG 2.1/2.2 AA); AI Act Art. 50(5) requires AI disclosures themselves to be accessible |
| ☐ | P1 | **AI provenance fields on every asset** (`ai_generated`, `ai_modified`, model, model_version, prompt_hash, `is_deepfake_of_real_person`, `human_reviewed_by`, `reviewed_at`) | **W — C2PA absent across all eleven vendors compared** | Mandatory columns |
| ☐ | P1 | **Per-platform disclosure propagation** — Meta AI-info toggle, TikTok AIGC switch, YouTube altered-content declaration as three distinct surfaces with distinct semantics | **W** | Ship |
| ☐ | P1 | Stored human-approval record per post (EU AI Act Art. 50(4b) editorial-responsibility exception) | **W** | Ship — and note the binding drivers are **FINRA 2210 principal pre-approval and SEC 206(4)-1**, not the AI Act |
| ☐ | P2 | C2PA Content Credentials signed at generation, preserved through transcode | A 27-star OSS plugin ships this; **no commercial vendor does** | Ship — but design for the fact that the most-starred `c2pa`-topic repo on GitHub is a provenance **remover** (4,554 stars). The durable artifacts are the platform-side declaration and the internal approval record, not the signature |
| ☐ | P2 | Consent artifacts with expiry and revocation for voice clones and avatars | **W** | Ship |
| ☐ | P1 | DSA notice-and-action on public surfaces (link-in-bio, UGC galleries) | **W** | A public page surface is a regulatory decision, not a growth decision |

## 1.25 Commercial surface, cost and billing

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | Price per brand/workspace with unlimited seats **and** unlimited channels | Metricool (per brand, unlimited seats) is closest; Buffer is unlimited seats + pay per channel; Sprout is unlimited channels + pay per seat | Occupy the empty middle: both unlimited |
| ☐ | P0 | Permanent free tier | Buffer (3 channels, 10 queued/channel — capped on **depth**, not volume), Metricool, Publer, Postiz | Copy Buffer's depth-cap design; it produces recurring gentle upgrade pressure |
| ☐ | P0 | **Hard spend cap the customer sets, above which the system stops rather than bills** | **W** | Buffer: "£148.99 two years after cancellation", "charged over $1000 after applying for a $99/month plan", Trustpilot 2.1 vs G2 4.3; Metricool: refund refused 15 minutes after a €638 renewal; Publer publishes an article titled *"Why are my charges higher than those listed on the Plans and Pricing page?"* |
| ☐ | P0 | Pre-renewal notice, pro-rated refunds, self-serve card deletion | **W — the whole category fails here** | "Metricool's Trustpilot page is a free customer-acquisition brief" |
| ☐ | P1 | **Per-client cost allocation** — channels, AI media, transcode minutes, boosted spend, add-ons, as a line-item CSV with a margin column against the retainer | **W — AgencyAnalytics/DashThis/Swydo price per client but no vendor breaks the bill *down* by client** | Ship |
| ☐ | P1 | Live usage meter + forecast in human-readable units | **W** | Ship |
| ☐ | P0 | Published prices at every tier including the enterprise floor | Meltwater publishes nothing | Publish |
| ☐ | P1 | Merchant-of-record billing (Paddle), PPP bands, local rails | — | Day-one global sales without 40 tax registrations |

## 1.26 Onboarding, migration and discoverability

| ✓ | P | Capability | Bar-setter | Beating it means |
|---|---|---|---|---|
| ☐ | P0 | 14-day trial, no card, full features | Vista | Match + permanent free tier |
| ☐ | P0 | **Value before OAuth** — public-handle audit rendered in 30 seconds | **W — the category's universal TTFV problem** | Vista's measured TTFV is 7–12 min clean, 20–40 min with any Business Portfolio issue |
| ☐ | P0 | **In-product discoverability**: guided onboarding, per-module activation journeys, "you're not using X" nudges, searchable command palette | **W — Vista's single most-cited complaint is that its own modules are invisible** | Cheap, and it materially changes perceived product quality |
| ☐ | P0 | **Migration: CSV parsers for Hootsuite, Buffer, Later, Sprout, Sendible, Agorapulse, Loomly, Publer, Metricool** + a generic column mapper | **W — no vendor ships an import wizard** | Ship all nine |
| ☐ | P0 | **Platform re-fetch backfill on connect** | **W** | Converts the incumbent's strongest lock-in into our demo, without their cooperation |
| ☐ | P0 | Side-by-side reconciliation report vs the old tool | **W** | Pre-empts the #1 post-migration support ticket |
| ☐ | P1 | Link-in-bio importers (Linktree/Beacons/Stan/Milkshake/Komi) | Vista (Linktree beta) | All five |
| ☐ | P1 | Boolean listening-query translator | **W** | Ship |

---

# 2. Gaps in what we have already built

Assessed file by file. Severity: **S1** = irreversible or data-destroying if not fixed before more code lands · **S2** = blocks a P0 parity row · **S3** = blocks a whitespace differentiator · **S4** = correctness bug or drift risk.

## 2.1 What is right and must not be re-litigated

| Asset | Why it stays |
|---|---|
| `packages/shared/src/text.ts` — `measureText`, `truncateToLimit`, X-weighted counting, Unicode-aware `extractHashtags` | The category has no grapheme-correct counter. This is already better than Buffer's. Keep. |
| `packages/scheduler/src/timezone.ts` — `zonedTimeToInstant` with explicit gap/ambiguity policy, binary-search `findTransition` | Correct, including 30- and 45-minute transitions. It is the *engine* required by irreversible decision I3; it is simply not wired to the schema (§2.4). |
| `packages/shared/src/errors.ts` — `FailureKind` / `dispositionOf` / `backoffMs` full-jitter | Right shape, wrong size (§2.3). The insight that retry policy keys off a taxonomy rather than a platform string is the correct one. |
| `packages/adapters/src/capabilities.ts` — capabilities as versioned data with `verifiedOn` + `sources` | This is irreversible decision I6, and it is already half-done. |
| `publish_claims` in `0001_core.sql` | Claim-before-call is the correct anti-duplicate primitive. It needs a content hash (§2.5). |
| `media_assets.alt_text` being on the **asset** rather than the post | Accidentally correct, and it is the foundation of the alt-text pipeline nobody ships. |
| `social_profiles.postable_from` | Correct modelling of Pinterest warm-up — though nothing reads it (§2.7). |

## 2.2 Schema: the four irreversible failures

| # | Sev | Symbol | The failure | Consequence |
|---|---|---|---|---|
| G-1 | **S1** | `post_targets.scheduled_at timestamptz` (`0001_core.sql:318`) | Scheduled time is stored as a bare UTC instant. Irreversible decision **I3** requires `(wall_clock, IANA zone, dst_policy, tzdb_version)` with `dispatch_at_utc` materialised but **non-authoritative**. | A government DST change silently drifts every stored future instant, unfixably and retroactively. `zonedTimeToInstant` exists and is correct but has nowhere to write its inputs — only its output. |
| G-2 | **S1** | `profile_groups.timezone` (`:89`); `social_profiles` has **no** timezone column | Timezone lives on the group. This is precisely Vista Social's documented architectural weakness that `00-MASTER-STRATEGY §3.2` commits us to beating. | "Publish at 9am local per profile" is inexpressible; dual-time composer rendering is inexpressible; every multi-region evaluation is lost. |
| G-3 | **S1** | `posts` (`:261`) has `body/title/link/first_comment` **directly on the mutable row**; no `content_versions`, no `content_hash` | Approval cannot bind to an immutable artifact. `post_approvals` (`:395`) references `post_id` + `step_id` only. | An approved post can be edited and published without re-approval. This kills: hash-bound approval, automatic invalidation, redline diff on re-review, FINRA 2210 / SEC 206(4)-1 defensibility, idempotency keyed on `(target, content_hash)`, and the version stack. Retrofitting means the entire back-catalogue has no hash. |
| G-4 | **S1** | No metric tables exist at all | Irreversible decision **I5**: daily snapshots and provenance columns must exist **before the first row is written**. | Pinterest 90d, X non-public 30d, TikTok ~60d are destroyed permanently, every day we do not have this. Provenance added later means the entire back-catalogue is provenance-less and the "definition changed" badge cannot be trusted — which is the D4 differentiator. |

## 2.3 Schema: structural gaps against the parity floor

| # | Sev | Symbol / absence | What the research requires |
|---|---|---|---|
| G-5 | S1 | No `nodes` table; `profile_groups` is a flat single level | Irreversible **I4**: arbitrary-depth `ltree` node tree where permissions, approvals, reporting, timezone and policy all resolve through one path. Agency and franchise are the same data model; a flat group is a permission-model rewrite later. |
| G-6 | S2 | `organizations.profile_limit` (`:36`) + comment "Billing is driven by connected profile count" | Directly contradicts the pricing thesis: per-profile billing is the axis that taxes network breadth (Publer's flaw) and the agency motion. Entitlements belong in a plan/entitlement table keyed on workspace + volume, and `node_grants.seat_class` must exist from the first commit so free reviewer seats are a schema fact. |
| G-7 | S2 | `profile_group_access.level access_level` only | No per-**profile** grants, no per-feature No Access/View/Manage, no custom roles (Metricool ships all three), no seatless external reviewer identity. |
| G-8 | S2 | No queue tables — yet `QueueId` exists in `ids.ts` | Posting schedules, recurring weekly slots, floating/pinned duality, slot types, queue labels, category routing, approval-aware slot reservation. This is the single most-used surface in Buffer and it has no storage. |
| G-9 | S2 | No `campaigns`, `labels`, `post_labels`, `content_categories` | Four label namespaces (Vista), tags as a reporting dimension (Buffer), campaign as a first-class object spanning organic + paid (Metricool), content-mix ratios (SocialBee). |
| G-10 | S2 | No recycling / recurrence / RSS objects | Publer's `recycling {gap, gap_freq, solo, expire_count, expire_date}` and separate `recurring {repeat, days_of_week, repeat_rate}`; SocialBee category evergreen + expiry; MeetEdgar variations; RSS three modes with new-only semantics. `post_status` has no `recycling_*` or `*_reauth` members. |
| G-11 | S2 | No `conversations` / `messages` — yet `ConversationId`, `MessageId` exist in `ids.ts` | The entire inbox, plus the two-clock send-eligibility state machine that is the reply-window triage differentiator. |
| G-12 | S3 | `media_assets` has no renditions, no versions, no provenance, no rights | Rendition presets + content-hash rendition cache; Frame.io version stacks; `origin`/`ai_model`/`ai_prompt_hash`/`c2pa_*`; `rights_grants` + `rights_dependencies` + `rights_overrides`. |
| G-13 | S4 | `media_assets.content_hash` comment claims it is *both* a perceptual hash and a duplicate-upload detector (`:227-229`) | These are two different hashes with two different index strategies. Blueprint B separates `perceptual_hash` and `exact_hash`. As written, neither dedupe nor the pHash creative index works correctly. |
| G-14 | S3 | No link, click, bio-page, order or attribution tables | `utm_content = post_id`, own-domain redirect, click ledger, Shopify `CustomerVisit` join, marketing-activity write-back, creator carriers, HDYHAU. |
| G-15 | S3 | No AI tables: no versioned brand voice (it is a `jsonb` blob on `profile_groups:92`), no eval set, no generation lineage, no credit ledger, no cost estimate | Voice must be versioned + evaluated + model-pinned; generation lineage is whitespace item #1 and is a **join key**, so it must exist before the first generation. |
| G-16 | S3 | No autonomy policy, decision trace, shadow run or kill-switch tables | The Action Gate cannot be retrofitted onto shipped agent surfaces. |
| G-17 | S2 | `audit_log` (`:415`) is append-only by convention only — `bigserial`, no hash chain, no split between immutable non-personal skeleton and erasable tombstoned payload, no retention class | An unconditionally immutable trace is unshippable under GDPR Art. 17; a chain added later invalidates everything before it. |
| G-18 | S2 | No RLS policies anywhere, despite the README asserting that denormalised `organization_id` exists *because* "row-level security policies have to be cheap and obviously correct" | The stated rationale for the schema's central design decision is currently unimplemented. |
| G-19 | S2 | `credentials` has no `kind`, no `instance_url`/`instance_software`, no `app_id`, no granting-human identity, no scope-delta record | Eleven credential kinds are required (`oauth2`, `oauth2_dynamic`, `oauth1a`, `api_key`, `bot_token`, `webhook_url`, `basic_app_password`, `jwt_asymmetric`, `service_account`, **`byo_app`**, `partner_managed`). `byo_app` "must exist from the first commit" — retrofitting it touches auth, storage, encryption, rate limiting and billing simultaneously. |
| G-20 | S2 | `social_profiles` has no destination sub-objects | GBP returns hundreds of locations; Pinterest has boards; Reddit has subreddits; YouTube has playlists. `remote_account_id` + `metadata jsonb` cannot express "publish this pin to these three boards". |
| G-21 | S4 | `posts.format text` and `post_targets.{network,format} text` are unconstrained | `PostFormat` and `NetworkId` are closed unions in TypeScript; the database accepts anything. Add CHECK constraints or enum types generated from the same source. |
| G-22 | S3 | No cost, spend-cap, per-client allocation or goal tables | §1.25 and the goals-as-contract-objects row. |
| G-23 | S2 | No `failure_observations` table | The corpus's own named defensible asset ("compounds with volume, cannot be read out of documentation") accrues from day one or never. |
| G-24 | S3 | No content fingerprint / similarity index | The cross-account near-duplicate guard, the pHash "have we used this before", and performance-weighted reuse all key off it. |
| G-25 | S2 | No `publishing_holds` / `hold_captures` | Crisis mode, restore review queue, and the Meta partial-hold failure surface. |

## 2.4 `packages/adapters` — the contract is one-fifth of the required surface

| # | Sev | Symbol | The failure |
|---|---|---|---|
| A-1 | **S1** | `SocialAdapter.publish()` (`adapter.ts:79`) | Publishing is one verb. The domain has five: `validate` / `submit` / `poll` / `finalize` / `cancel`. Meta, TikTok, Pinterest, LinkedIn and YouTube are **all** async container patterns. A synchronous `publish()` either blocks a worker for nine minutes or reports success before the post exists — the second is the duplicate-post class of bug (R4, the most reputationally damaging failure in the category). |
| A-2 | **S1** | `DeliveryMode = 'auto' \| 'reminder' \| 'unsupported'` (`content.ts:71`) and `delivery_mode` enum (`0001_core.sql:287`) | Six modes are required: `SYNC`, `ASYNC_POLL`, `NATIVE_SCHEDULED`, `ASYNC_REVIEWED`, `REMINDER`, `UNSUPPORTED`. `native_scheduling` currently exists only as a `PostFeature` string (`content.ts:46`) with no plumbing — so a natively-scheduled post can be double-published: once by the platform, once by our dispatcher. |
| A-3 | S2 | No `readBack`, `probe`, `revoke`, `beginAuth`, `completeAuth`, `listDestinations`, `destinationRules`, `classify`, `backfill`, `fetchInbound`, `fetchReviews`, `replyToReview` | `verifyCredentials` (`:112`) conflates probe and refresh — and a speculative refresh manufactures token orphaning on X and TikTok. `completeAuth` must return an **array** (GBP returns hundreds). `classify` must be the sole reader of platform error strings. `readBack` is the entire publish-verification differentiator. |
| A-4 | S3 | `SocialAdapter.capabilities` is a static readonly field | Mastodon's character limit is per-instance and read live; self-hosted WordPress differs per host; Trustpilot/Vimeo/Flickr capabilities differ per **customer plan** (`PLAN_INSUFFICIENT` is a real, frequent error class). Must be `capabilities(conn?): Promise<PlatformCapabilities>`. |
| A-5 | **S1** | `MetricSnapshot.metrics: Record<string, number>` (`adapter.ts:59`) | Metrics are normalised inside the adapter and arrive stripped of `endpoint`, `field_as_returned`, `api_version`, `collected_at`, `transform`. This is exactly the "every connector strips a metric of its provenance and renders it as a bare number in a box" failure the corpus names as the category's most humiliating moment — and D4 says it cannot be retrofitted. Adapters must return **L1 raw**; normalisation happens above them. |
| A-6 | S2 | `PublishingLimits.rejectsDuplicateContent: boolean` (`capabilities.ts:127`) | A boolean cannot express X's rule (identical **or substantially similar**, within 72h, across accounts), Pinterest's per-board rule, Reddit's crosspost rules or Meta's downranking. Needs a `DuplicatePolicy` object with scope, window, similarity threshold and enforcement (reject / restrict / downrank). |
| A-7 | S2 | `PublishingLimits` has no quota-unit model | YouTube's binding constraint is 10,000 units/day per **project** at ~1,600 units per upload — shared across all tenants. `maxPostsPer24h: 6` (`registry.ts:429`) encodes the consequence and loses the cause, so no fair-share allocation is possible. GBP (~300 QPM) and Telegram bots are also project-scoped. |
| A-8 | S2 | `ReadCapability` has `dmReplyWindowHours` only (`capabilities.ts:162`) | Needs: comment reply window (24h FB/IG), story-reply window, the 7-day human-agent extension, whether a comment resets the DM clock (it does **not**), per-event webhook availability, and a published polling cadence per event type — the input to the SLA floor. |
| A-9 | S3 | `TargetOverride` (`content.ts:138`) covers `body/title/media/firstComment/format` only, and `resolveTarget` (`:182`) hard-copies `poll`, `link`, `locationRemoteId`, `taggedAccounts`, `collaborators`, `stickers`, `nativeAudio` from the draft | Per-network variant composition is therefore impossible for: Pinterest board selection, Reddit subreddit + flair, TikTok `disable_comment/duet/stitch` + privacy level, IG product tags and collaborators, LinkedIn geo/industry targeting, YouTube category/playlist/`publishAt`, per-network link and UTM, per-network first-comment, and **per-target locale**. This is P0 parity (`00-MASTER-STRATEGY §3.1` item 2) and is currently unreachable. |
| A-10 | S3 | `MediaRef.altText` is per-asset-per-post, with no per-network mapping and no carousel-child fan-out | Alt text fields genuinely differ (X 1,000 chars via `POST /2/media/metadata`; Bluesky 500; LinkedIn `content.media.altText`; Pinterest `alt_text_custom`; Meta per-child on carousels; TikTok none). Validation (`validation.ts:393`) only ever emits a **warning** and only for `image`/`gif` — there is no block mode, no video coverage, no accessibility report. |
| A-11 | S4 | `NetworkMeta` (`networks.ts:87`) is declared and never instantiated | There is no registry of network metadata, so `IntegrationStatus` — which blueprint B wires to the capability staleness budget (auto-downgrade `general_availability` → `limited_access` at 2× the budget) — has no home. |
| A-12 | S4 | `PlatformCapabilities` has `verifiedOn` and `sources` but no `confidence`, no `stalenessBudgetDays`, no per-field provenance | `X.costPerPostUsd: 0.015` (`registry.ts:259`) is the corpus's **#1 blocking unverified fact** (Q2) hard-coded as if it were established. A wrong value here is a pricing-model failure, not a bug. |
| A-13 | S2 | `INSTAGRAM.publishing.maxPostsPer24h: 100` (`registry.ts:57`) | The corpus records 25 (Postiz's verified Meta error `2207042` mapping), 50 and 100 in circulation, and `00-critique §4.3` flags the 4× spread. `registry.ts`'s own header says *"When uncertain, prefer the restrictive figure."* We chose the most permissive. Set 25, flag `confidence: 'contested'`. |
| A-14 | S3 | No archetype on the adapter | Nine archetypes (A–I) are the mechanism by which ~60 adapters stay thin. Without a base-class taxonomy, each adapter re-implements auth, paging and error handling. |
| A-15 | S3 | No conformance suite or recorded cassettes in the contract | "A platform's shape change fails CI rather than production" requires the capability descriptor to parameterise a shared test battery. |

## 2.5 `packages/adapters/src/validation.ts` — right shape, missing the pre-flight that matters

| # | Sev | Gap | Required |
|---|---|---|---|
| V-1 | S3 | `validateTarget` is pure over `(target, caps)` | It cannot see the queue, the calendar, the account's recent history, the similarity index, the link, or the destination. Needs a `ValidationContext` carrying: quota headroom, calendar simulation, near-duplicate score, destination rules, link probe result, rights state, connection health, and spend estimate. |
| V-2 | S3 | No `IssueCode` for: near-duplicate content, destination-rule violation, quota/cap breach in the calendar, unreachable link, missing OG card, truncation-fold warning, missing disclosure, expired rights, voice-adherence miss, missing required flair, per-instance limit | Twelve codes minimum. Each maps to a concrete competitor failure the research names. |
| V-3 | S2 | `missing_alt_text` is hard-coded to `'warning'` | Must be policy-driven (`warn` \| `block`) per workspace, and must cover video and carousel children. Public-sector deals depend on it. |
| V-4 | S3 | `AutoFix` has three kinds | Needs: `rewrite_for_similarity` (with before/after score), `apply_rendition` (with the visual diff), `add_alt_text` (AI draft pending confirmation), `move_to_next_slot`, `split_thread`, `strip_unsupported_feature`, `substitute_link`. |
| V-5 | S4 | `ValidationReport.delivery: 'auto' \| 'reminder' \| 'blocked'` | Must carry the six delivery modes plus a **degradation receipt** — the persisted, user-visible record of what was transformed, downgraded, split, rerouted or refused. |
| V-6 | S4 | Text validation never computes the truncation fold, and never validates `link` reachability | Both are §1.10 differentiators and both are cheap. |

## 2.6 `packages/shared` gaps

| # | Sev | Symbol | Gap |
|---|---|---|---|
| S-1 | S2 | `FailureKind` (12 members) | Needs the 13-class taxonomy plus the two terminal states no generic taxonomy anticipates: `published_then_removed` and `partially_published`. Missing classes: `scope_missing(scope)`, `plan_insufficient`, `destination_gone`, `platform_policy` (distinct from `validation_failed`), and a distinction between `auth_expired` (refresh once) and `auth_revoked` (repair link). `dispositionOf` currently routes `permission_denied` and `account_restricted` to `await_reconnect`, which is wrong for `plan_insufficient`. |
| S-2 | S3 | No `ContentHash`, `NodeId`, `CampaignId`, `GenerationId`, `LinkId`, `RenditionId`, `DecisionTraceId`, `RightsGrantId` in `ids.ts` | The branded-id discipline is good; it just stops at the eleven objects that do not yet exist. Note `QueueId`, `ConversationId`, `MessageId`, `ApprovalWorkflowId` are branded but have no tables. |
| S-3 | S3 | `text.ts` has no similarity primitives | `normaliseForSimilarity`, `shingles`, `simhash`, `minhashSignature`, `hammingDistance` — the compose-time duplicate guard is a text problem before it is a database problem. |
| S-4 | S3 | No fold/width measurement | `truncationFold(text, network, deviceClass)` returning the grapheme index where "See more" lands. |
| S-5 | S4 | No locale kernel | CLDR first-day-of-week, Gulf Fri–Sat weekends, RTL, ICU MessageFormat. `users.locale` exists in the schema with nothing consuming it. |

## 2.7 `packages/scheduler` gaps

| # | Sev | Symbol | Gap |
|---|---|---|---|
| C-1 | S2 | `checkPublishBudget` (`budget.ts:71`) reads `history.connectedAt` + `limits.newAccountWarmupDays` | `social_profiles.postable_from` already exists in the schema and is ignored. Two sources of truth for the same fact. |
| C-2 | S2 | Budgets are per-account only | Three nested budgets are required: **project/app** level with fair-share allocation (YouTube units, GBP QPM, a shared Telegram bot — all shared across *all* tenants), **tenant** level (X metered in dollars against a cap), and **connection** level (TikTok's 15/24h shared across every third-party client the user has connected — the code's own comment at `registry.ts:383` admits our accounting is "an upper bound" and then does nothing about it). |
| C-3 | S3 | No slot reservation, no priority lanes, no smearing | Humans schedule at :00 and :30; the dispatcher must smear within a tolerance budget and reserve rate-limit capacity at T-60s. |
| C-4 | S3 | `planNextAttempt` bounds retries by `maxAttempts` | The research requires a **lateness budget** (a user-configurable interval) as the primary bound: a post 40 minutes late may be worse than a post that did not go. `AttemptPolicy` needs `latenessBudget: Duration`. |
| C-5 | S3 | Nothing consumes `zonedTimeToInstant` | The timezone kernel is correct and unwired. Fixing G-1 is what connects it. |
| C-6 | S3 | `estimatePostCostUsd` is the only cost surface | Needs to become a general pre-flight estimator across networks (X per-post), AI (per generation), and media (transcode minutes) feeding the pre-flight cost estimate and the hard spend cap. |

## 2.8 The thirteen named capabilities, scored against the current build

| Capability the brief asked about | Expressible today? | Blocking symbol |
|---|---|---|
| Category-based evergreen queues (SocialBee) | **No** | No queue/category tables (G-8, G-9) |
| Recycling (Publer/MeetEdgar) | **No** | No recycling object; `post_status` has no `recycling_*` states (G-10) |
| RSS-triggered posting | **No** | No content source/item tables (G-10) |
| Per-network variant composition | **Barely** — text/title/media/first-comment only | `TargetOverride` (A-9); `post_targets.overrides jsonb` is untyped |
| Approvals with seatless external reviewers | **No** | `approval_steps` requires a `user_id` or `user_group_id` FK into `users` (`0001_core.sql:385-390`); an external client has no row (G-7) |
| Approval that survives editing | **No** | No `content_hash` (G-3) |
| Watermarks/signatures at publish | **No** | No watermark or signature objects; no publish-time media pipeline |
| Boosted posts, paid/organic blending | **No** | No ad account, boost config, or spend object |
| Competitor analytics | **No** | No metric store at all (G-4) |
| Looker Studio / warehouse export | **No** | No conformed metric layer, no provenance columns (G-4) |
| Link-in-bio as a first-class object | **No** | No page/block/click tables (G-14) |
| AI credit accounting | **No** | No credit ledger, no generation record (G-15) |
| Bulk CSV import | **Partially** — `posts` + `post_targets` can be inserted, but with no column mapping, no dry-run validation, no per-network columns, no chunked ingest, and no error write-back |
| Content categories / tags / campaigns | **No** | G-9 |
| Asset versioning and rights expiry | **No** | G-12 |
| Multi-language variants of one post | **No** | No locale on target or variant (A-9) |

---

# 3. Concrete schema deltas

Conventions preserved from `0001_core.sql`: `organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE` on every tenant-owned table; partial indexes wherever a status field means most rows are cold; explicit named CHECK constraints carrying real invariants; every migration wrapped in `BEGIN/COMMIT`; comments explaining *why*, not *what*.

**Ordering rule.** `0002`–`0005` are the irreversibles and must land before any further feature work. `0006`–`0014` can be sequenced with the roadmap.

**Presentation note.** Statements below are grouped by concept for readability, so several forward-reference a table defined later in the same migration (`node_grants` → `roles`/`external_principals`; `posts.campaign_id` → `campaigns`; `schedule_slots.category_id` → `content_categories`). On apply, each migration is topologically ordered — referenced tables first, or the FK added in a trailing `ALTER TABLE`. Every migration remains a single transaction, per `packages/db/README.md`.

## 3.1 `0002_hierarchy_and_time.sql` — irreversible I3 + I4

Why: the node tree makes agency and franchise one data model and is a permission rewrite if deferred; the time model makes a tzdb change a recomputation rather than a silent mis-send.

```sql
BEGIN;
CREATE EXTENSION IF NOT EXISTS ltree;

-- The containment tree. profile_groups becomes a *view* over nodes of kind 'brand'
-- during migration, then is dropped.
CREATE TYPE node_kind AS ENUM ('workspace', 'client', 'brand', 'region', 'market', 'location', 'team');

CREATE TABLE nodes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    parent_id       uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    -- Materialised path. Permissions, approvals, reporting, timezone and policy all
    -- resolve by ancestry, so the path must be indexable rather than recursive.
    path            ltree       NOT NULL,
    kind            node_kind   NOT NULL,
    name            text        NOT NULL,
    -- Settings resolved by walking up the path; NULL means "inherit".
    timezone        text,
    locale          text,
    settings        jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,

    CONSTRAINT nodes_root_has_no_parent CHECK ((parent_id IS NULL) = (kind = 'workspace'))
);

CREATE INDEX nodes_path_gist ON nodes USING gist (path) WHERE deleted_at IS NULL;
CREATE INDEX nodes_org_kind_idx ON nodes (organization_id, kind) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX nodes_path_unique ON nodes (organization_id, path) WHERE deleted_at IS NULL;

-- Seat class is a PRICING MECHANIC expressed as schema. A reviewer seat that is free
-- must be free because of a column, not because of a plan footnote a sales rep can lose.
CREATE TYPE seat_class AS ENUM ('full', 'reviewer', 'client', 'analyst', 'external');

CREATE TABLE node_grants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid         NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid         NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    -- Exactly one principal: an internal user, or an external reviewer with no account.
    user_id         uuid         REFERENCES users (id) ON DELETE CASCADE,
    external_id     uuid         REFERENCES external_principals (id) ON DELETE CASCADE,
    role_id         uuid         NOT NULL REFERENCES roles (id),
    seat_class      seat_class   NOT NULL DEFAULT 'full',
    -- Grants can be scoped below the node: a specific profile only.
    social_profile_id uuid       REFERENCES social_profiles (id) ON DELETE CASCADE,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    expires_at      timestamptz,

    CONSTRAINT node_grants_one_principal CHECK ((user_id IS NULL) <> (external_id IS NULL))
);

CREATE INDEX node_grants_principal_idx ON node_grants (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX node_grants_node_idx ON node_grants (node_id);
-- Billing counts only 'full'. The partial index makes that count cheap and obvious.
CREATE INDEX node_grants_billable_idx ON node_grants (organization_id)
    WHERE seat_class = 'full' AND expires_at IS NULL;

-- Roles as data, so Metricool-style custom roles are configuration rather than a release.
CREATE TABLE roles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations (id) ON DELETE CASCADE,  -- NULL = system role
    name            text        NOT NULL,
    -- {"compose":"manage","publish":"none","approve":"manage","analytics":"view", ...}
    permissions     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    -- A non-bypassable flag, matching Metricool's "schedule pending review".
    forces_approval boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);

-- An external principal is a client contact who approves, uploads or repairs a connection
-- WITHOUT an account and WITHOUT consuming a seat. This is the row Buffer does not have,
-- which is why Buffer's client must be given a real seat.
CREATE TABLE external_principals (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    email           citext,
    phone           text,
    display_name    text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    revoked_at      timestamptz,
    CONSTRAINT external_principals_contactable CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Every no-account surface in the product is one row type: approval batches, calendar
-- shares, asset intake, connection repair, reports. One expiry story, one revocation
-- story, one audit story.
CREATE TYPE share_link_purpose AS ENUM (
    'approval_batch', 'calendar_view', 'asset_intake', 'connection_repair', 'report_view', 'media_kit'
);

CREATE TABLE share_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid               NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid               NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    purpose         share_link_purpose NOT NULL,
    -- Opaque, high-entropy, never guessable, never logged in full.
    token_hash      bytea              NOT NULL UNIQUE,
    password_hash   bytea,
    subject_type    text               NOT NULL,
    subject_id      uuid,
    external_id     uuid               REFERENCES external_principals (id) ON DELETE SET NULL,
    -- What the holder may do. Narrower than a role: 'approve','comment','upload','reauthorise'.
    capabilities    text[]             NOT NULL DEFAULT '{}',
    created_by      uuid               REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz        NOT NULL DEFAULT now(),
    expires_at      timestamptz        NOT NULL,
    revoked_at      timestamptz,
    last_used_at    timestamptz,

    CONSTRAINT share_links_expiry_bounded CHECK (expires_at > created_at)
);

CREATE INDEX share_links_live_idx ON share_links (organization_id, purpose)
    WHERE revoked_at IS NULL;

-- Timezone moves to the PROFILE. This is the single row that beats Vista Social's
-- group-level-only model and makes "9am local per profile" expressible.
ALTER TABLE social_profiles ADD COLUMN timezone text;
ALTER TABLE social_profiles ADD COLUMN node_id uuid REFERENCES nodes (id) ON DELETE CASCADE;

-- THE TIME MODEL. dispatch_at_utc is materialised for the dispatcher's index only and is
-- NEVER authoritative: the intent is (scheduled_local, scheduled_zone). When IANA ships a
-- rules change, a job recomputes every future row and records the new tzdb_version. A row
-- whose tzdb_version differs from the current tzdb is a CORRECTNESS ALARM, not cosmetic.
ALTER TABLE post_targets ADD COLUMN scheduled_local timestamp;
ALTER TABLE post_targets ADD COLUMN scheduled_zone  text;
ALTER TABLE post_targets ADD COLUMN dst_policy      text NOT NULL DEFAULT 'compatible';
ALTER TABLE post_targets ADD COLUMN tzdb_version    text;
ALTER TABLE post_targets RENAME COLUMN scheduled_at TO dispatch_at_utc;
ALTER TABLE post_targets ADD CONSTRAINT post_targets_time_intent_complete
    CHECK (dispatch_at_utc IS NULL OR (scheduled_local IS NOT NULL AND scheduled_zone IS NOT NULL));
ALTER TABLE post_targets ADD CONSTRAINT post_targets_dst_policy_known
    CHECK (dst_policy IN ('compatible', 'earlier', 'later', 'reject'));

-- Rows whose zone rules have changed under them. Cheap because it is partial.
CREATE INDEX post_targets_tzdb_drift_idx ON post_targets (tzdb_version)
    WHERE status IN ('pending', 'scheduled');

CREATE TABLE tzdb_versions (
    version     text PRIMARY KEY,          -- e.g. '2026b'
    adopted_at  timestamptz NOT NULL DEFAULT now(),
    recompute_completed_at timestamptz
);
COMMIT;
```

## 3.2 `0003_content_versions.sql` — irreversible I7 and the approval binding

Why: an approval that does not bind to an immutable content hash is not a defensible principal approval under FINRA 2210, and it is the reason the entire category lets an approved post be edited and published.

```sql
BEGIN;

-- The intent layer. posts keeps identity, ownership, labels and lifecycle; all content
-- moves down into versions.
ALTER TABLE posts ADD COLUMN node_id uuid REFERENCES nodes (id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN campaign_id uuid REFERENCES campaigns (id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN content_class text;    -- promotional|service_status|editorial
ALTER TABLE posts ADD COLUMN origin text NOT NULL DEFAULT 'human';
ALTER TABLE posts ADD CONSTRAINT posts_origin_known
    CHECK (origin IN ('human','ai_assisted','ai_generated','recycled','rss','imported','api','agent'));
-- Locked-template lineage: which corporate template this post descends from, so a
-- publish-time diff check can enforce editable zones.
ALTER TABLE posts ADD COLUMN template_version_id uuid REFERENCES content_versions (id);

-- A variant is the per-network (or per-locale) composition. One post → N variants → M targets.
CREATE TABLE post_variants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    -- NULL network = the shared default variant every target falls back to.
    network         text,
    -- BCP-47. This is what makes multi-language variants of one post expressible.
    locale          text,
    label           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, network, locale)
);

CREATE TABLE content_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    variant_id      uuid        REFERENCES post_variants (id) ON DELETE CASCADE,
    seq             integer     NOT NULL,
    body            text        NOT NULL DEFAULT '',
    -- title, link, first_comment, scheduled_comments[], and the typed per-network extras
    -- (board_ids, subreddit, flair_id, disable_duet, privacy_level, playlist_id, ...).
    fields          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    -- Ordered asset ids plus per-target crop/rendition choices and per-child alt text.
    media_ref       jsonb       NOT NULL DEFAULT '[]'::jsonb,
    -- The hash the approval record and the idempotency key both bind to. Computed over a
    -- canonical serialisation of (body, fields, media_ref) with a documented, versioned
    -- algorithm — because a hash whose algorithm drifts invalidates every prior approval.
    content_hash    bytea       NOT NULL,
    hash_algo       text        NOT NULL DEFAULT 'sha256/v1',
    authored_by     uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (post_id, seq)
);

CREATE INDEX content_versions_hash_idx ON content_versions (organization_id, content_hash);
CREATE INDEX content_versions_post_idx ON content_versions (post_id, seq DESC);

-- Targets now point at an immutable version rather than at a mutable post.
ALTER TABLE post_targets ADD COLUMN variant_id uuid REFERENCES post_variants (id);
ALTER TABLE post_targets ADD COLUMN content_version_id uuid REFERENCES content_versions (id);
-- Derived from (target_id, content_hash, attempt_epoch). The single most important defence
-- against the duplicate-post bug, which is unrecoverable on the network.
ALTER TABLE post_targets ADD COLUMN idempotency_key text;
ALTER TABLE post_targets ADD CONSTRAINT post_targets_idem_unique UNIQUE (idempotency_key);
-- A post may be late; how late is a user decision, not a retry-count artefact.
ALTER TABLE post_targets ADD COLUMN lateness_budget interval NOT NULL DEFAULT '15 minutes';

-- publish_claims must key on the content hash, not just the attempt: a replayed job for an
-- edited post is a DIFFERENT publish and must not be blocked by an old claim.
ALTER TABLE publish_claims ADD COLUMN content_hash bytea;

-- Campaigns span organic and paid, which is the join Metricool gets right and everyone
-- else does not.
CREATE TABLE campaigns (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    starts_on       date,
    ends_on         date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    archived_at     timestamptz,
    UNIQUE (node_id, name)
);

-- Four independent label namespaces (Vista parity) plus content class. A single labels
-- table with a namespace column beats four tables, because filters are written once.
CREATE TYPE label_namespace AS ENUM ('post', 'media', 'inbox', 'queue', 'pillar');

CREATE TABLE labels (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid            NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid            REFERENCES nodes (id) ON DELETE CASCADE,
    namespace       label_namespace NOT NULL,
    name            text            NOT NULL,
    colour          text,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (organization_id, namespace, node_id, name)
);

CREATE TABLE post_labels (
    post_id  uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    label_id uuid NOT NULL REFERENCES labels (id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, label_id)
);
CREATE INDEX post_labels_label_idx ON post_labels (label_id);
COMMIT;
```

## 3.3 `0004_metrics.sql` — irreversible I5, before the first row is written

Why: provenance columns cannot be retrofitted (the back-catalogue would be provenance-less and the "definition changed" badge untrustworthy), and daily snapshots capture data the platforms destroy on a 30–90 day clock.

```sql
BEGIN;

-- L1: exactly what the API returned. Partitioned BY LIST(network) so retention is
-- enforceable per platform ToS — YouTube's 30-day cap applies to the YouTube partition
-- and nothing else, instead of the whole store inheriting the union of every restriction.
CREATE TABLE metric_facts (
    id                bigserial,
    organization_id   uuid        NOT NULL,
    node_id           uuid        NOT NULL,
    social_profile_id uuid        NOT NULL,
    network           text        NOT NULL,
    subject_type      text        NOT NULL,   -- post | profile | story | video | link | conversation
    subject_id        text        NOT NULL,   -- remote id, or our own id for internal subjects
    post_target_id    uuid,                   -- the join that makes creative outcomes possible
    metric_key        text        NOT NULL,   -- canonical name (L2 vocabulary)
    value             numeric(20,4) NOT NULL,
    -- PROVENANCE. Every one of these is required and none can be added later.
    source            text        NOT NULL,   -- 'meta_graph' | 'x_api' | 'csv_import' ...
    endpoint          text        NOT NULL,
    field_as_returned text        NOT NULL,   -- the upstream field name, verbatim
    api_version       text        NOT NULL,
    transform         text        NOT NULL DEFAULT 'identity',
    -- 'snapshot' (a value at a moment) vs 'period' (a value over a window). Metricool
    -- labels this in the UI and is praised for it; nobody stores it.
    measure_kind      text        NOT NULL,
    period_start      timestamptz,
    period_end        timestamptz,
    collected_at      timestamptz NOT NULL DEFAULT now(),
    -- Which comparability class this point belongs to. Ratios are computable only WITHIN
    -- a class; a delta spanning a class change is badged, not silently rendered.
    comparability_class text      NOT NULL,

    PRIMARY KEY (id, network),
    CONSTRAINT metric_facts_measure_kind_known CHECK (measure_kind IN ('snapshot','period','cumulative')),
    CONSTRAINT metric_facts_period_complete
        CHECK (measure_kind <> 'period' OR (period_start IS NOT NULL AND period_end IS NOT NULL))
) PARTITION BY LIST (network);

CREATE TABLE metric_facts_instagram PARTITION OF metric_facts FOR VALUES IN ('instagram');
CREATE TABLE metric_facts_youtube   PARTITION OF metric_facts FOR VALUES IN ('youtube');
-- ... one per network; DEFAULT partition for the long tail.
CREATE TABLE metric_facts_default   PARTITION OF metric_facts DEFAULT;

CREATE INDEX metric_facts_subject_idx ON metric_facts (organization_id, subject_type, subject_id, metric_key, collected_at DESC);
CREATE INDEX metric_facts_target_idx  ON metric_facts (post_target_id) WHERE post_target_id IS NOT NULL;

-- The definitions themselves are data, and their history is the product.
CREATE TABLE metric_definitions (
    key                 text PRIMARY KEY,
    display_name        text NOT NULL,
    -- The formula, rendered on the number itself. Four named engagement-rate definitions
    -- live here rather than in four different charts.
    formula             text,
    comparability_class text NOT NULL,
    unit                text NOT NULL
);

CREATE TABLE metric_definition_changes (
    id               bigserial PRIMARY KEY,
    metric_key       text        NOT NULL REFERENCES metric_definitions (key),
    network          text        NOT NULL,
    changed_on       date        NOT NULL,
    old_class        text,
    new_class        text,
    -- Shown verbatim on the chart annotation: "impressions renamed to views, 2025-04-11".
    description      text        NOT NULL,
    source_url       text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (metric_key, network, changed_on)
);

-- Daily snapshots from connect. Pinterest 90d, X non-public 30d, TikTok ~60d are gone
-- forever without this, and followers_at_post_time cannot be reconstructed at all.
CREATE TABLE audience_snapshots (
    organization_id   uuid    NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid    NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    as_of             date    NOT NULL,
    followers         bigint,
    following         bigint,
    posts_count       bigint,
    demographics      jsonb   NOT NULL DEFAULT '{}'::jsonb,
    collected_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (social_profile_id, as_of)
);

ALTER TABLE post_targets ADD COLUMN followers_at_publish bigint;

-- Why our number differs from the platform's own dashboard, per metric. This is the
-- category's most humiliating recurring moment turned into a surface.
CREATE TABLE metric_reconciliations (
    id                bigserial PRIMARY KEY,
    organization_id   uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    metric_key        text NOT NULL,
    our_value         numeric(20,4) NOT NULL,
    platform_value    numeric(20,4),
    -- 'attribution_window' | 'timezone_boundary' | 'dedup_rule' | 'metric_rename' | 'sampling'
    reason            text NOT NULL,
    explanation       text NOT NULL,
    observed_on       date NOT NULL,
    UNIQUE (social_profile_id, metric_key, observed_on)
);

-- Goals as contract objects, attachable at any level of the tree, bound to the conformed
-- metric layer rather than to a chart.
CREATE TABLE goals (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    metric_key      text        NOT NULL REFERENCES metric_definitions (key),
    target_value    numeric(20,4) NOT NULL,
    period_start    date        NOT NULL,
    period_end      date        NOT NULL,
    owner_user_id   uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT goals_period_ordered CHECK (period_end >= period_start)
);
COMMIT;
```

## 3.4 `0005_credentials_and_connections.sql` — `byo_app` from the first commit

Why: Ayrshare's forced BYO-keys for X (31 Mar 2026) is the first domino; retrofitting BYO touches auth, storage, encryption, rate limiting and billing at once.

```sql
BEGIN;
CREATE TYPE credential_kind AS ENUM (
    'oauth2', 'oauth2_dynamic', 'oauth1a', 'api_key', 'bot_token', 'webhook_url',
    'basic_app_password', 'jwt_asymmetric', 'service_account', 'byo_app', 'partner_managed'
);

ALTER TABLE credentials ADD COLUMN kind credential_kind NOT NULL DEFAULT 'oauth2';
-- Which developer app minted this. NULL = our shared app; set = the customer's own.
ALTER TABLE credentials ADD COLUMN app_id uuid REFERENCES platform_apps (id);
-- Fediverse, self-hosted WordPress/Ghost: the client secret is per HOST, not per user.
ALTER TABLE credentials ADD COLUMN instance_url text;
ALTER TABLE credentials ADD COLUMN instance_software text;
-- The human who granted it, and what role they held on the platform side. This is what
-- makes "the granting human holds Editor, not Admin" a diagnosable object.
ALTER TABLE credentials ADD COLUMN granted_by_user_id uuid REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE credentials ADD COLUMN granted_by_external_id uuid REFERENCES external_principals (id) ON DELETE SET NULL;
ALTER TABLE credentials ADD COLUMN scopes_required text[] NOT NULL DEFAULT '{}';
-- Predicted death, distinct from the platform's stated expires_at: LinkedIn's hard 60-day
-- wall and TikTok's 365-day refresh TTL are policy facts, not token fields.
ALTER TABLE credentials ADD COLUMN predicted_expiry_at timestamptz;
ALTER TABLE credentials ADD COLUMN last_probed_at timestamptz;

CREATE INDEX credentials_predicted_expiry_idx ON credentials (predicted_expiry_at)
    WHERE revoked_at IS NULL AND predicted_expiry_at IS NOT NULL;

CREATE TABLE platform_apps (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations (id) ON DELETE CASCADE,  -- NULL = ours
    network         text        NOT NULL,
    client_id       text        NOT NULL,
    client_secret_enc bytea     NOT NULL,
    key_id          text        NOT NULL,
    -- Project-scoped quota lives here, because YouTube's 10,000 units/day and GBP's
    -- ~300 QPM are consumed by ALL tenants on this app, not by one connection.
    quota_units_per_day bigint,
    quota_qpm       integer,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, network, client_id)
);

-- A destination is a page, board, subreddit, location, playlist or channel *under* a
-- connected account. GBP returns hundreds per auth; Pinterest pins go to boards.
CREATE TABLE profile_destinations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    kind              text        NOT NULL,  -- page|board|subreddit|location|playlist|channel|group
    remote_id         text        NOT NULL,
    name              text        NOT NULL,
    -- Cached destination rules (Reddit post_requirements, flair list, TikTok creator_info).
    rules             jsonb       NOT NULL DEFAULT '{}'::jsonb,
    rules_fetched_at  timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    UNIQUE (social_profile_id, kind, remote_id)
);

-- Readiness assertions: one row per precondition, per profile. This is what turns a red
-- dot into a punch list naming the failing check and the human who must fix it.
CREATE TABLE connection_assertions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    assertion_key     text        NOT NULL,  -- 'ig_is_professional' | 'page_role_is_admin' | ...
    passed            boolean     NOT NULL,
    detail            text,
    -- Who can fix it: 'agency' | 'client_page_admin' | 'client_account_owner' | 'platform'
    remediation_actor text,
    remediation_url   text,
    checked_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (social_profile_id, assertion_key)
);

CREATE INDEX connection_assertions_failing_idx ON connection_assertions (organization_id)
    WHERE passed = false;
COMMIT;
```

## 3.5 `0006_queues_recycling_sources.sql`

Why: this is the most-used surface in the category and it currently has no storage; the recycling/recurring split is Publer's best idea and must be two objects.

```sql
BEGIN;
CREATE TABLE posting_schedules (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    name              text        NOT NULL DEFAULT 'default',
    -- Resolved from the profile, then the node path. Stored for auditability of reflow.
    timezone          text        NOT NULL,
    paused_at         timestamptz,
    pause_reason      text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (social_profile_id, name)
);

CREATE TABLE schedule_slots (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid    NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    schedule_id   uuid      NOT NULL REFERENCES posting_schedules (id) ON DELETE CASCADE,
    day_of_week   smallint  NOT NULL,     -- 0=Sunday, CLDR-rendered per locale in the UI
    local_time    time      NOT NULL,
    -- SocialBee's indirection: a slot names a CATEGORY, and the queue resolves which post.
    category_id   uuid      REFERENCES content_categories (id) ON DELETE SET NULL,
    -- Buffer has no slot typing at all; this is the single highest-leverage delta on it.
    accepts_formats text[]  NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT schedule_slots_dow_valid CHECK (day_of_week BETWEEN 0 AND 6),
    UNIQUE (schedule_id, day_of_week, local_time)
);

CREATE TABLE content_categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    -- SocialBee's per-category evergreen flag, and the declarative mix nobody ships.
    evergreen       boolean     NOT NULL DEFAULT false,
    target_share    numeric(5,2),          -- "30% of slots should be educational"
    colour          text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (node_id, name),
    CONSTRAINT content_categories_share_bounded
        CHECK (target_share IS NULL OR (target_share > 0 AND target_share <= 100))
);

-- Floating vs pinned, kept exactly as Buffer models it because it is the best idea in
-- that product: floating posts reflow when the schedule changes, pinned ones never move.
ALTER TABLE post_targets ADD COLUMN slot_id uuid REFERENCES schedule_slots (id) ON DELETE SET NULL;
ALTER TABLE post_targets ADD COLUMN placement text NOT NULL DEFAULT 'pinned';
ALTER TABLE post_targets ADD CONSTRAINT post_targets_placement_known
    CHECK (placement IN ('floating', 'pinned'));
-- Reserve the slot while a post sits in approval; release it on reject. Buffer explicitly
-- cannot do this, and it is why agency queues collapse when a client is slow.
ALTER TABLE post_targets ADD COLUMN slot_reserved_until timestamptz;

-- Recycling: slot-filling, interval-based, evergreen. Publer's field set verbatim.
CREATE TABLE recycling_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    gap             integer     NOT NULL,
    gap_freq        text        NOT NULL,      -- day | week | month
    solo            boolean     NOT NULL DEFAULT true,
    starts_at       timestamptz NOT NULL,
    range_ends_at   timestamptz,
    expire_count    integer,
    expire_date     timestamptz,
    -- Whichever fires first, per Publer's documented termination rule.
    times_published integer     NOT NULL DEFAULT 0,
    state           text        NOT NULL DEFAULT 'active',
    -- Anti-repetition: MeetEdgar's variations and Publer's spintax, plus the score that
    -- proves the emitted variant clears the network's similarity threshold.
    variation_mode  text        NOT NULL DEFAULT 'none',   -- none | spintax | ai_variations
    min_similarity_gap numeric(4,3),
    -- Performance-weighted reuse: nobody in the category does this.
    selection_policy text       NOT NULL DEFAULT 'queue_order',  -- queue_order | performance_weighted
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT recycling_rules_gap_freq_known CHECK (gap_freq IN ('day','week','month')),
    CONSTRAINT recycling_rules_gap_positive CHECK (gap >= 1),
    CONSTRAINT recycling_rules_state_known
        CHECK (state IN ('active','paused','expired','failed','pending','declined','reauth'))
);

CREATE INDEX recycling_rules_active_idx ON recycling_rules (organization_id, starts_at)
    WHERE state = 'active';

-- Recurring: wall-clock, fixed repeat. A DIFFERENT JOB from recycling — Publer maintains a
-- help article explaining the difference, which is the tell that the split is real.
CREATE TABLE recurrence_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    repeat_unit     text        NOT NULL,     -- daily | weekly | monthly
    repeat_rate     integer     NOT NULL DEFAULT 1,
    days_of_week    smallint[],
    local_time      time,
    starts_on       date        NOT NULL,
    ends_on         date,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT recurrence_rules_rate_bounded CHECK (repeat_rate BETWEEN 1 AND 52),
    CONSTRAINT recurrence_rules_weekly_has_days
        CHECK (repeat_unit <> 'weekly' OR array_length(days_of_week, 1) >= 1)
);

-- RSS and other feeds. The fourth mode nobody ships is 'review' — an approval queue
-- between pull and publish, which is why agencies distrust RSS automation.
CREATE TABLE content_sources (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    kind            text        NOT NULL,     -- rss | atom | youtube_channel | drive_folder | dropbox_folder
    url             text        NOT NULL,
    mode            text        NOT NULL,     -- auto_post | auto_schedule | review | library_only
    category_id     uuid        REFERENCES content_categories (id) ON DELETE SET NULL,
    caption_template text,
    -- New items only, from connection time. Publer's anti-spam default, and it is correct.
    watermark_at    timestamptz NOT NULL DEFAULT now(),
    poll_interval_sec integer   NOT NULL DEFAULT 900,
    last_polled_at  timestamptz,
    enabled         boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT content_sources_mode_known
        CHECK (mode IN ('auto_post','auto_schedule','review','library_only'))
);

CREATE TABLE content_source_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    source_id       uuid        NOT NULL REFERENCES content_sources (id) ON DELETE CASCADE,
    external_guid   text        NOT NULL,
    title           text,
    url             text,
    summary         text,
    published_at    timestamptz,
    post_id         uuid        REFERENCES posts (id) ON DELETE SET NULL,
    state           text        NOT NULL DEFAULT 'new',
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_id, external_guid)
);
COMMIT;
```

## 3.6 `0007_media_rights_renditions.sql`

Why: renditions, versions, provenance and rights are four separate absences with one root cause — the asset is currently a file row, not an object with a life.

```sql
BEGIN;
-- Two hashes, not one. 0001_core conflated them; they have different index strategies and
-- answer different questions ("is this the same file" vs "is this the same picture").
ALTER TABLE media_assets RENAME COLUMN content_hash TO perceptual_hash;
ALTER TABLE media_assets ADD COLUMN exact_hash bytea;
ALTER TABLE media_assets ADD COLUMN node_id uuid REFERENCES nodes (id) ON DELETE SET NULL;
-- Publer's used/unused flag, upgraded: not a boolean, a count with an outcome behind it.
ALTER TABLE media_assets ADD COLUMN use_count integer NOT NULL DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN first_used_at timestamptz;
-- Asset ROLE drives brand-anchored generation: an anchor-compose job must know which
-- region of which asset is sacred.
ALTER TABLE media_assets ADD COLUMN asset_role text;   -- product_shot|logo|headshot|style_ref|bg
-- Provenance. Mandatory columns, because a disclosure obligation is not an optional field.
ALTER TABLE media_assets ADD COLUMN origin text NOT NULL DEFAULT 'upload';
ALTER TABLE media_assets ADD COLUMN ai_generated boolean NOT NULL DEFAULT false;
ALTER TABLE media_assets ADD COLUMN ai_modified boolean NOT NULL DEFAULT false;
ALTER TABLE media_assets ADD COLUMN ai_model text;
ALTER TABLE media_assets ADD COLUMN ai_model_version text;
ALTER TABLE media_assets ADD COLUMN ai_prompt_hash bytea;
ALTER TABLE media_assets ADD COLUMN depicts_real_person boolean NOT NULL DEFAULT false;
ALTER TABLE media_assets ADD COLUMN human_reviewed_by uuid REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE media_assets ADD COLUMN human_reviewed_at timestamptz;
ALTER TABLE media_assets ADD COLUMN c2pa_present boolean NOT NULL DEFAULT false;
ALTER TABLE media_assets ADD COLUMN c2pa_preserved_through_transcode boolean;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_origin_known
    CHECK (origin IN ('upload','ai_generated','ugc_capture','stock','creator_delivery','client_intake','canva','clip_extract'));
-- Wrong alt text is worse than none: a vision-model draft may not publish unconfirmed.
ALTER TABLE media_assets ADD COLUMN alt_text_source text NOT NULL DEFAULT 'human';
ALTER TABLE media_assets ADD COLUMN alt_text_confirmed_by uuid REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_alt_confirmed
    CHECK (alt_text_source <> 'ai_draft' OR alt_text_confirmed_by IS NOT NULL OR alt_text IS NULL);

CREATE INDEX media_assets_phash_idx ON media_assets (organization_id, perceptual_hash)
    WHERE perceptual_hash IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX media_assets_exact_idx ON media_assets (organization_id, exact_hash)
    WHERE exact_hash IS NOT NULL AND deleted_at IS NULL;

-- Frame.io's version stack: replace the file in place, preserve the comment history.
-- The corpus states plainly that this has no social equivalent.
CREATE TABLE asset_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id  uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    seq             integer     NOT NULL,
    storage_key     text        NOT NULL,
    bytes           bigint      NOT NULL,
    exact_hash      bytea       NOT NULL,
    replaced_by     uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (media_asset_id, seq)
);

-- Rendition presets are DATA (per network × placement), so a spec change is a config
-- deploy. Bynder ships derivative presets; no scheduler does.
CREATE TABLE rendition_presets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations (id) ON DELETE CASCADE,   -- NULL = system
    key             text        NOT NULL,       -- 'reel_9x16' | 'feed_4x5' | 'yt_16x9'
    network         text,
    placement       text,
    spec            jsonb       NOT NULL,       -- aspect, max duration, codec profile, bitrate
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, key)
);

-- The cache. Each (asset, preset) pair is computed ONCE and reused across every client and
-- every post — and probe-and-passthrough means a compliant file is never re-encoded at all,
-- which is precisely what Vista does not do ("may result in a slight reduction in quality").
CREATE TABLE asset_renditions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id  uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    preset_id       uuid        NOT NULL REFERENCES rendition_presets (id) ON DELETE CASCADE,
    -- Derived from (source exact_hash, preset spec hash, encoder version). Deterministic.
    cache_key       text        NOT NULL,
    storage_key     text,
    passthrough     boolean     NOT NULL DEFAULT false,   -- source already complied
    width           integer,
    height          integer,
    duration_sec    numeric(10,3),
    bytes           bigint,
    -- The crop actually applied, so the visual diff at schedule time is truthful and the
    -- operator can nudge it rather than discovering a letterbox after publish.
    crop            jsonb,
    state           text        NOT NULL DEFAULT 'pending',
    encoder_version text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (cache_key),
    CONSTRAINT asset_renditions_state_known CHECK (state IN ('pending','ready','failed','skipped'))
);

CREATE INDEX asset_renditions_asset_idx ON asset_renditions (media_asset_id);

-- Per-network alt text, because the fields genuinely differ (X caps at 1,000 via
-- POST /2/media/metadata; Bluesky at 500; Meta is per-child on carousels; TikTok has none).
CREATE TABLE asset_alt_texts (
    media_asset_id uuid NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    network        text NOT NULL,
    alt_text       text NOT NULL,
    source         text NOT NULL DEFAULT 'derived',
    PRIMARY KEY (media_asset_id, network)
);

-- Watermarks: account-scoped, ≤10, PNG, default flag. Publer's exact model, which is the
-- one agencies pay for. Signatures are workspace-scoped — the asymmetry is deliberate.
CREATE TABLE watermarks (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    media_asset_id    uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    position          text        NOT NULL,
    scale_pct         numeric(5,2) NOT NULL DEFAULT 15,
    opacity_pct       numeric(5,2) NOT NULL DEFAULT 80,
    padding_px        integer     NOT NULL DEFAULT 16,
    is_default        boolean     NOT NULL DEFAULT false,
    applies_to        text        NOT NULL DEFAULT 'image',   -- image | video | both
    created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX watermarks_one_default_idx ON watermarks (social_profile_id, applies_to)
    WHERE is_default;

CREATE TABLE signatures (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    body            text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (node_id, name)
);

-- Rights. Only rights the system itself originated are ENFORCED; imported paperwork
-- attaches as unverified and is advisory, because blocking on stale customer-supplied data
-- is a vendor-owned incident.
CREATE TABLE rights_grants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id  uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    origination     text        NOT NULL,
    grant_scope     text[]      NOT NULL DEFAULT '{organic}',   -- organic|paid|web|print
    territories     text[],
    channels        text[],
    starts_at       timestamptz,
    expires_at      timestamptz,
    model_release   boolean,
    music_licence_status text,
    -- Whose word we have for the expiry. TikTok Spark auth codes may be creator-asserted;
    -- if so we label them as such rather than implying platform truth.
    expiry_source   text,
    consent_terms_snapshot jsonb,
    captured_from_external_id uuid REFERENCES external_principals (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    revoked_at      timestamptz,
    CONSTRAINT rights_grants_origination_known
        CHECK (origination IN ('own_consent_capture','own_creator_contract','redeemed_spark_auth',
                               'redeemed_partnership_ad','client_intake','imported_unverified'))
);

CREATE INDEX rights_grants_expiring_idx ON rights_grants (expires_at)
    WHERE revoked_at IS NULL AND expires_at IS NOT NULL;

-- THE differentiator: the join between an expiring grant and the live things depending on
-- it, carrying the money at risk.
CREATE TABLE rights_dependencies (
    grant_id       uuid NOT NULL REFERENCES rights_grants (id) ON DELETE CASCADE,
    dependent_kind text NOT NULL,   -- ad_group | gallery_slot | scheduled_target | live_post
    dependent_ref  text NOT NULL,
    spend_per_day  numeric(12,2),
    detected_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (grant_id, dependent_kind, dependent_ref)
);

CREATE TABLE rights_overrides (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id      uuid        NOT NULL REFERENCES rights_grants (id) ON DELETE CASCADE,
    dependent_ref text        NOT NULL,
    overridden_by uuid        NOT NULL REFERENCES users (id),
    justification text        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Client asset intake: the connect-link pattern pointed at media instead of OAuth.
CREATE TABLE asset_requests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    campaign_id     uuid        REFERENCES campaigns (id) ON DELETE SET NULL,
    brief           text        NOT NULL,
    -- Validation applied at the door, so a vertical phone video is rejected on upload
    -- rather than discovered three days later.
    requirements    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    due_on          date,
    reminder_cadence_days integer,
    share_link_id   uuid        REFERENCES share_links (id) ON DELETE SET NULL,
    state           text        NOT NULL DEFAULT 'open',
    created_at      timestamptz NOT NULL DEFAULT now()
);
COMMIT;
```

## 3.7 `0008_publishing_reliability.sql`

Why: reliability is defended by seven mechanisms that only work as one system; five of them need storage that does not exist.

```sql
BEGIN;
-- Attempts become rows. attempt_count on post_targets loses the history that the retry
-- ledger, the reliability ledger and the failure corpus are all built from.
CREATE TABLE post_target_attempts (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_target_id  uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    attempt         integer     NOT NULL,
    started_at      timestamptz NOT NULL DEFAULT now(),
    finished_at     timestamptz,
    outcome         text        NOT NULL,
    failure_class   text,                      -- the 13-class taxonomy
    platform_code   text,
    platform_message text,
    platform_message_translated text,          -- CN/KR APIs answer in CN/KR
    request_id      text,
    quota_units     integer,
    cost_usd        numeric(12,6),
    CONSTRAINT post_target_attempts_outcome_known
        CHECK (outcome IN ('submitted','pending','succeeded','failed','cancelled','verify_pending'))
);

CREATE INDEX post_target_attempts_target_idx ON post_target_attempts (post_target_id, attempt DESC);
CREATE INDEX post_target_attempts_failed_idx ON post_target_attempts (organization_id, started_at DESC)
    WHERE outcome = 'failed';

-- Read-back at +1m/+10m/+1h/+24h, via the SAME authenticated API that created the post.
-- No logged-out scraping, ever.
CREATE TABLE publish_verifications (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_target_id  uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    checked_at      timestamptz NOT NULL DEFAULT now(),
    offset_label    text        NOT NULL,      -- '+1m' | '+10m' | '+1h' | '+24h'
    state           text        NOT NULL,      -- live | removed | restricted | unavailable | unknown
    -- Reddit's removed_by_category / banned_by / approved; Meta media-node presence; etc.
    signal          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT publish_verifications_state_known
        CHECK (state IN ('live','removed','restricted','unavailable','unknown'))
);

-- Two terminal states no generic taxonomy anticipates and both of which are required.
ALTER TYPE target_status ADD VALUE 'verify_pending';
ALTER TYPE target_status ADD VALUE 'published_then_removed';
ALTER TYPE target_status ADD VALUE 'partially_published';
ALTER TYPE target_status ADD VALUE 'held';

-- Cross-tenant, de-identified. The corpus's own named defensible asset: it compounds with
-- volume and cannot be read out of documentation.
CREATE TABLE failure_observations (
    id              bigserial PRIMARY KEY,
    network         text        NOT NULL,
    format          text,
    failure_class   text        NOT NULL,
    platform_code   text,
    -- Shape only. No tenant identifiers, no content, no handles.
    content_shape   jsonb       NOT NULL DEFAULT '{}'::jsonb,
    observed_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX failure_observations_network_idx ON failure_observations (network, platform_code, observed_at DESC);

-- Destination rules, versioned as data so a limit change is a config deploy (I6).
CREATE TABLE destination_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network         text        NOT NULL,
    destination_kind text,
    destination_ref text,                       -- NULL = network-wide
    rules           jsonb       NOT NULL,
    source          text        NOT NULL,       -- 'live_probe' | 'documented' | 'inferred_from_failures'
    confidence      text        NOT NULL DEFAULT 'documented',
    verified_on     date        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Composite holds. Scope × policy × restore, which is what makes a crisis pause reasonable
-- rather than a per-channel toggle clicked twenty times.
CREATE TABLE publishing_holds (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    scope_kind      text        NOT NULL,       -- org | node | profile | label | content_class
    scope_ref       text        NOT NULL,
    policy          text        NOT NULL,       -- skip | defer | defer_past_window
    reason          text        NOT NULL,
    created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    starts_at       timestamptz NOT NULL DEFAULT now(),
    ends_at         timestamptz,
    released_at     timestamptz,
    CONSTRAINT publishing_holds_policy_known CHECK (policy IN ('skip','defer','defer_past_window'))
);

CREATE INDEX publishing_holds_live_idx ON publishing_holds (organization_id, scope_kind, scope_ref)
    WHERE released_at IS NULL;

CREATE TABLE hold_captures (
    hold_id         uuid        NOT NULL REFERENCES publishing_holds (id) ON DELETE CASCADE,
    post_target_id  uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    original_dispatch_at timestamptz NOT NULL,
    -- Where a platform-side unschedule was attempted and what it said. Meta partial-hold
    -- failure MUST surface loudly rather than reporting success.
    platform_hold_result text,
    restored_at     timestamptz,
    restore_decision text,                       -- publish_now | reslot | draft | discard
    PRIMARY KEY (hold_id, post_target_id)
);

-- The near-duplicate guard. One fingerprint row per (version, network), so the index can
-- be queried by (workspace, network, publish window) at compose, schedule and T-60s.
CREATE TABLE content_fingerprints (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    content_version_id uuid     REFERENCES content_versions (id) ON DELETE CASCADE,
    post_target_id  uuid        REFERENCES post_targets (id) ON DELETE CASCADE,
    network         text        NOT NULL,
    -- 64-bit SimHash stored as bigint for cheap Hamming distance; MinHash bands for recall.
    simhash         bigint      NOT NULL,
    minhash_bands   bytea,
    media_phash     bytea,
    publish_window  tstzrange   NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_fingerprints_window_idx ON content_fingerprints
    USING gist (organization_id, network, publish_window);

-- Per-network duplicate policy as data: X blocks identical or SUBSTANTIALLY SIMILAR within
-- 72h across accounts; Pinterest is per-board; Reddit has crosspost rules; Meta downranks.
CREATE TABLE duplicate_policies (
    network            text PRIMARY KEY,
    scope              text NOT NULL,        -- account | cross_account | board | subreddit
    window_hours       integer NOT NULL,
    similarity_threshold numeric(4,3) NOT NULL,
    enforcement        text NOT NULL,        -- reject | restrict | downrank | none
    verified_on        date NOT NULL,
    source_url         text
);
COMMIT;
```

## 3.8 `0009_approvals.sql`

```sql
BEGIN;
-- The binding. An approval names the exact bytes it approved.
ALTER TABLE post_approvals ADD COLUMN organization_id uuid REFERENCES organizations (id) ON DELETE CASCADE;
ALTER TABLE post_approvals ADD COLUMN content_version_id uuid REFERENCES content_versions (id);
ALTER TABLE post_approvals ADD COLUMN content_hash bytea;
ALTER TABLE post_approvals ADD COLUMN decided_by_external_id uuid REFERENCES external_principals (id) ON DELETE SET NULL;
ALTER TABLE post_approvals ADD COLUMN share_link_id uuid REFERENCES share_links (id) ON DELETE SET NULL;
-- SSO-attested identity, because FINRA/SEC want to know who, verifiably.
ALTER TABLE post_approvals ADD COLUMN identity_assertion jsonb;
ALTER TABLE post_approvals ADD COLUMN invalidated_at timestamptz;
ALTER TABLE post_approvals ADD COLUMN invalidated_reason text;
ALTER TABLE post_approvals DROP CONSTRAINT post_approvals_post_id_step_id_key;
-- One decision per (post, step, version): a new version legitimately needs a new decision.
ALTER TABLE post_approvals ADD CONSTRAINT post_approvals_unique_per_version
    UNIQUE (post_id, step_id, content_version_id);
ALTER TABLE post_approvals ADD CONSTRAINT post_approvals_one_decider
    CHECK (decided_by IS NULL OR decided_by_external_id IS NULL);

-- Steps may now name an external principal (no seat) or a share link cohort.
ALTER TABLE approval_steps ADD COLUMN external_id uuid REFERENCES external_principals (id) ON DELETE CASCADE;
ALTER TABLE approval_steps ADD COLUMN quorum integer NOT NULL DEFAULT 1;
ALTER TABLE approval_steps ADD COLUMN sla_hours integer;
ALTER TABLE approval_steps ADD COLUMN escalate_to_user_id uuid REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE approval_steps DROP CONSTRAINT approval_steps_exactly_one_approver;
ALTER TABLE approval_steps ADD CONSTRAINT approval_steps_exactly_one_approver
    CHECK (num_nonnulls(user_id, user_group_id, external_id) = 1);

-- Which edits invalidate an approval. Configurable, because otherwise the workflow thrashes
-- on a rescheduled minute.
CREATE TABLE approval_materiality_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid    NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    workflow_id     uuid    REFERENCES approval_workflows (id) ON DELETE CASCADE,
    -- Fields whose change does NOT invalidate: scheduled time, slot, internal labels.
    immaterial_paths text[] NOT NULL DEFAULT '{scheduled_local,slot_id,labels.internal}'
);

-- Conditional routing with a small closed vocabulary, not a general workflow builder.
CREATE TABLE approval_conditions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid    NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    workflow_id     uuid    NOT NULL REFERENCES approval_workflows (id) ON DELETE CASCADE,
    step_id         uuid    REFERENCES approval_steps (id) ON DELETE CASCADE,
    -- network | label | content_class | origin | spend | region | policy_hit | risk_score
    subject         text    NOT NULL,
    operator        text    NOT NULL,
    value           jsonb   NOT NULL,
    effect          text    NOT NULL      -- require | skip | escalate | auto_approve
);

-- Risk scoring is what matches approval throughput to generation throughput.
CREATE TABLE post_risk_scores (
    content_version_id uuid PRIMARY KEY REFERENCES content_versions (id) ON DELETE CASCADE,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    voice_adherence numeric(5,4),
    banned_term_hits integer    NOT NULL DEFAULT 0,
    claim_hits      integer     NOT NULL DEFAULT 0,
    safety_score    numeric(5,4),
    near_duplicate_score numeric(5,4),
    missing_disclosures text[]  NOT NULL DEFAULT '{}',
    total_risk      numeric(5,4) NOT NULL,
    scored_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_risk_scores_review_queue_idx ON post_risk_scores (organization_id, total_risk DESC);

-- Comments and annotations, with Planable's internal/external flag in the data model on
-- day one — it is the axis that cannot be bolted on.
CREATE TABLE content_comments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    content_version_id uuid     REFERENCES content_versions (id) ON DELETE SET NULL,
    parent_id       uuid        REFERENCES content_comments (id) ON DELETE CASCADE,
    author_user_id  uuid        REFERENCES users (id) ON DELETE SET NULL,
    author_external_id uuid     REFERENCES external_principals (id) ON DELETE SET NULL,
    body            text        NOT NULL,
    -- Annotation coordinates on the creative, and a timecode for video.
    anchor          jsonb,
    -- Invisible to external principals, in the same thread. Planable's differentiator.
    internal_only   boolean     NOT NULL DEFAULT false,
    -- Google-Docs-style suggested edit rather than "please change this".
    suggestion      jsonb,
    resolved_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_comments_post_idx ON content_comments (post_id, created_at);
COMMIT;
```

## 3.9 `0010_inbox.sql`

```sql
BEGIN;
CREATE TABLE conversations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id           uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    network           text        NOT NULL,
    kind              text        NOT NULL,     -- dm | comment | mention | review | share
    remote_thread_id  text        NOT NULL,
    subject_ref       text,                     -- the post/ad the comment sits on
    -- THE TWO CLOCKS. Meta's DM window is 24h from the last USER MESSAGE and is reset by
    -- each new one; the comment→private-reply path is a separate one-shot within 7 days;
    -- a comment does NOT reset the DM clock. Modelling this is the entire triage feature.
    last_inbound_at   timestamptz,
    dm_window_expires_at timestamptz,
    comment_reply_expires_at timestamptz,
    human_agent_until timestamptz,
    send_eligibility  text        NOT NULL DEFAULT 'unknown',
    assignee_user_id  uuid        REFERENCES users (id) ON DELETE SET NULL,
    status            text        NOT NULL DEFAULT 'open',
    sentiment         text,
    sentiment_rationale text,
    priority          smallint,
    sla_policy_id     uuid        REFERENCES sla_policies (id) ON DELETE SET NULL,
    sla_due_at        timestamptz,
    first_response_at timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),

    UNIQUE (social_profile_id, network, remote_thread_id),
    CONSTRAINT conversations_eligibility_known
        CHECK (send_eligibility IN ('open','human_agent_only','one_shot_reply','closed','unknown'))
);

-- The index that makes the inbox sort by TIME-TO-EXPIRY rather than recency. Partial,
-- because closed conversations are the overwhelming majority and must not bloat it.
CREATE INDEX conversations_expiry_idx ON conversations (organization_id, dm_window_expires_at)
    WHERE status = 'open' AND dm_window_expires_at IS NOT NULL;
CREATE INDEX conversations_sla_idx ON conversations (organization_id, sla_due_at)
    WHERE status = 'open' AND sla_due_at IS NOT NULL;

CREATE TABLE conversation_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    conversation_id uuid        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    remote_id       text        NOT NULL,
    direction       text        NOT NULL,      -- inbound | outbound
    author_handle   text,
    body            text,
    media           jsonb       NOT NULL DEFAULT '[]'::jsonb,
    occurred_at     timestamptz NOT NULL,
    -- observedAt − occurredAt, percentiled per network, IS the per-channel SLA floor.
    observed_at     timestamptz NOT NULL DEFAULT now(),
    sent_by_user_id uuid        REFERENCES users (id) ON DELETE SET NULL,
    automation_id   uuid,
    UNIQUE (conversation_id, remote_id)
);

CREATE TABLE saved_replies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    group_name      text,
    name            text        NOT NULL,
    body            text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- A macro is several actions in one click: reply + label + assign + close.
CREATE TABLE macros (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    actions         jsonb       NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sla_policies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    network         text,
    conversation_kind text,
    first_response_minutes integer NOT NULL,
    resolution_minutes integer,
    business_hours  jsonb,
    escalation      jsonb,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Automation rules: triggers × actions, gated by the same policy engine as human writes.
CREATE TABLE automation_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    trigger         jsonb       NOT NULL,
    conditions      jsonb       NOT NULL DEFAULT '[]'::jsonb,
    actions         jsonb       NOT NULL,
    enabled         boolean     NOT NULL DEFAULT true,
    created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);
COMMIT;
```

## 3.10 `0011_links_attribution_commerce.sql`

```sql
BEGIN;
-- Every outbound link is minted against a post_id at compose. This is the single
-- highest-leverage attribution decision in the product.
CREATE TABLE short_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    slug            text        NOT NULL,
    domain          text        NOT NULL,
    -- BOTH sides of the rewrite are kept, so the join survives the user editing the link.
    destination_url_original text NOT NULL,
    destination_url_final    text NOT NULL,
    post_id         uuid        REFERENCES posts (id) ON DELETE SET NULL,
    post_target_id  uuid        REFERENCES post_targets (id) ON DELETE SET NULL,
    bio_block_id    uuid,
    creator_id      uuid,
    utm             jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (domain, slug)
);

CREATE TABLE link_clicks (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL,
    short_link_id   uuid        NOT NULL,
    -- Minted by us, server-side, before any cookie exists. The join key into commerce.
    click_id        text        NOT NULL,
    occurred_at     timestamptz NOT NULL DEFAULT now(),
    referrer        text,
    user_agent_class text       NOT NULL,     -- human | unfurler | bot | unknown
    unfurler_name   text,                      -- Slackbot | WhatsApp | facebookexternalhit ...
    in_app_browser  text,
    country         text,
    UNIQUE (click_id)
);
-- Raw and filtered are reported SEPARATELY with the methodology published, because no
-- vendor publishes theirs and "clicks" is therefore not comparable across vendors.
CREATE INDEX link_clicks_human_idx ON link_clicks (short_link_id, occurred_at DESC)
    WHERE user_agent_class = 'human';

CREATE TABLE bio_pages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    slug            text        NOT NULL,
    custom_domain   text,                      -- real CNAME + auto-SSL, never a redirect
    theme           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    seo             jsonb       NOT NULL DEFAULT '{}'::jsonb,   -- title, meta, OG, canonical
    published_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);

CREATE TABLE bio_blocks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    page_id     uuid    NOT NULL REFERENCES bio_pages (id) ON DELETE CASCADE,
    position    integer NOT NULL,
    kind        text    NOT NULL,              -- link|product|video|form|embed|feed|contact
    config      jsonb   NOT NULL DEFAULT '{}'::jsonb,
    short_link_id uuid  REFERENCES short_links (id) ON DELETE SET NULL,
    UNIQUE (page_id, position)
);

-- The revenue join, read OUT of the merchant's own order object rather than modelled.
CREATE TABLE commerce_connections (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    platform        text        NOT NULL,      -- shopify | woocommerce | bigcommerce | tiktok_shop
    shop_domain     text        NOT NULL,
    credential_id   uuid        REFERENCES credentials (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, platform, shop_domain)
);

CREATE TABLE commerce_orders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    connection_id   uuid        NOT NULL REFERENCES commerce_connections (id) ON DELETE CASCADE,
    remote_order_id text        NOT NULL,
    ordered_at      timestamptz NOT NULL,
    currency        text        NOT NULL,
    subtotal        numeric(14,2) NOT NULL,
    -- Shopify captures ref/source/r natively into CustomerVisit.referralCode; we also read
    -- landingPage and utmParameters from firstVisit and lastVisit and keep BOTH.
    first_visit     jsonb,
    last_visit      jsonb,
    attributed_post_id_first uuid REFERENCES posts (id) ON DELETE SET NULL,
    attributed_post_id_last  uuid REFERENCES posts (id) ON DELETE SET NULL,
    attributed_click_id text,
    creator_id      uuid,
    discount_codes  text[],
    UNIQUE (connection_id, remote_order_id)
);

-- Write-back: our posts become external marketing activities inside the merchant's own
-- attribution report, attributed by Shopify's model, beside Meta and Google.
CREATE TABLE marketing_activity_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    connection_id   uuid        NOT NULL REFERENCES commerce_connections (id) ON DELETE CASCADE,
    post_id         uuid        REFERENCES posts (id) ON DELETE CASCADE,
    campaign_id     uuid        REFERENCES campaigns (id) ON DELETE CASCADE,
    remote_activity_id text     NOT NULL,
    last_engagement_pushed_on date,
    utc_offset      text        NOT NULL,      -- must match the shop's setting or reports diverge
    UNIQUE (connection_id, remote_activity_id)
);

-- Creator/advocate attribution: mint all four carriers, reconcile with published precedence,
-- and report the divergence — a code redemption with no click is brand lift, not error.
CREATE TABLE attribution_carriers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    creator_id      uuid        NOT NULL,
    campaign_id     uuid        REFERENCES campaigns (id) ON DELETE CASCADE,
    kind            text        NOT NULL,      -- discount_code | tracked_link | cart_attribute | survey
    value           text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (kind, value)
);

-- Dark social, measured rather than reconciled away.
CREATE TABLE self_reported_attribution (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    surface         text        NOT NULL,      -- bio_page | form | post_purchase
    raw_answer      text        NOT NULL,
    classified_channel text,
    classifier_version text,
    occurred_at     timestamptz NOT NULL DEFAULT now()
);
COMMIT;
```

## 3.11 `0012_ai_lineage_and_governance.sql`

Why: the join key must exist before the first generation, or the loop between generation and outcome can never be closed — which is exactly the architectural reason no incumbent can retrofit it.

```sql
BEGIN;
-- Brand voice stops being a jsonb blob on the group and becomes a versioned, evaluable,
-- model-pinned artifact.
CREATE TABLE brand_voices (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    version         integer     NOT NULL,
    rules           text,
    banned_terms    text[]      NOT NULL DEFAULT '{}',
    claim_allowlist text[]      NOT NULL DEFAULT '{}',
    required_disclosures text[] NOT NULL DEFAULT '{}',
    sample_post_ids uuid[]      NOT NULL DEFAULT '{}',
    -- Upgrades are blocked when the eval suite regresses. Nobody in the category measures
    -- whether output still matches the voice after the vendor swaps the model.
    pinned_model    text,
    pinned_model_version text,
    activated_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (node_id, version)
);

CREATE TABLE voice_eval_runs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    brand_voice_id  uuid        NOT NULL REFERENCES brand_voices (id) ON DELETE CASCADE,
    model           text        NOT NULL,
    model_version   text        NOT NULL,
    adherence_mean  numeric(5,4) NOT NULL,
    adherence_p10   numeric(5,4),
    sample_size     integer     NOT NULL,
    regression      boolean     NOT NULL DEFAULT false,
    ran_at          timestamptz NOT NULL DEFAULT now()
);

-- GENERATION LINEAGE — whitespace item #1. The point is the join key, not the model.
CREATE TABLE generations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    kind            text        NOT NULL,      -- caption|image|video|clip|reply|alt_text|dub
    prompt_hash     bytea       NOT NULL,
    prompt_text     text,
    model           text        NOT NULL,
    model_version   text        NOT NULL,
    brand_voice_id  uuid        REFERENCES brand_voices (id) ON DELETE SET NULL,
    retrieved_context jsonb     NOT NULL DEFAULT '[]'::jsonb,
    -- Extracted creative features: hook type, opening five words, length band, CTA
    -- presence, format, media type, slot. These are the ARMS a bandit allocates over and
    -- the dimensions per-feature lift is reported on.
    features        jsonb       NOT NULL DEFAULT '{}'::jsonb,
    output_ref      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    cost_usd        numeric(12,6) NOT NULL DEFAULT 0,
    credits         integer     NOT NULL DEFAULT 0,
    accepted        boolean,
    content_version_id uuid     REFERENCES content_versions (id) ON DELETE SET NULL,
    media_asset_id  uuid        REFERENCES media_assets (id) ON DELETE SET NULL,
    created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX generations_node_kind_idx ON generations (node_id, kind, created_at DESC);
CREATE INDEX generations_accepted_idx ON generations (node_id) WHERE accepted;

-- Publishing writes the outcome back onto the same trace. This row IS the loop.
CREATE TABLE generation_outcomes (
    generation_id   uuid PRIMARY KEY REFERENCES generations (id) ON DELETE CASCADE,
    post_target_id  uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    -- Reach-normalised so a big account's floor does not swamp a small account's ceiling.
    er_48h          numeric(8,6),
    saves_48h       integer,
    shares_48h      integer,
    sentiment       numeric(5,4),
    follower_delta_7d integer,
    computed_at     timestamptz NOT NULL DEFAULT now()
);

-- Credits are metered in human-readable units at a published rate, and every metered job
-- carries a pre-flight estimate the user saw BEFORE it ran.
CREATE TABLE credit_ledger (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        REFERENCES nodes (id) ON DELETE SET NULL,
    kind            text        NOT NULL,      -- grant|consume|refund|expire
    unit            text        NOT NULL,      -- source_minute|image|video_second|dub_minute
    quantity        numeric(14,4) NOT NULL,
    credits         integer     NOT NULL,
    cost_usd        numeric(12,6) NOT NULL DEFAULT 0,
    estimate_shown_credits integer,
    generation_id   uuid        REFERENCES generations (id) ON DELETE SET NULL,
    occurred_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_ledger_org_time_idx ON credit_ledger (organization_id, occurred_at DESC);

-- A hard cap the customer sets themselves, above which the account STOPS rather than bills.
CREATE TABLE spend_caps (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    scope           text        NOT NULL,      -- ai | x_api | boost | all
    period          text        NOT NULL,      -- day | month
    limit_usd       numeric(12,2) NOT NULL,
    action_at_limit text        NOT NULL DEFAULT 'stop',   -- stop | warn
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, node_id, scope, period)
);

-- Per-client cost allocation: the invoice broken down the way the buyer sells.
CREATE TABLE cost_allocations (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    period_month    date        NOT NULL,
    category        text        NOT NULL,      -- channels|ai_media|transcode|boost|addon|creator_fee|staff
    cost_usd        numeric(12,4) NOT NULL,
    -- Against the retainer, so the export carries a margin column the agency can rebill on.
    retainer_usd    numeric(12,2),
    UNIQUE (node_id, period_month, category)
);

-- Autonomy as data, per (node, channel, action type). Not a settings toggle.
CREATE TABLE autonomy_policies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    network         text,
    action_type     text        NOT NULL,      -- publish|reply|dm|boost|delete|hide
    mode            text        NOT NULL,      -- off|propose|approve_required|auto_within_budget|auto
    budgets         jsonb       NOT NULL DEFAULT '{}'::jsonb,
    guardrails      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    escalation      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    reversibility_window interval,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT autonomy_policies_mode_known
        CHECK (mode IN ('off','propose','approve_required','auto_within_budget','auto'))
);

-- The decision trace splits in two: an immutable hash-chained NON-PERSONAL skeleton, and
-- an erasable tombstoned content payload. An unconditionally immutable trace is
-- unshippable under GDPR Art. 17, and a chain added later invalidates everything before it.
CREATE TABLE decision_traces (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    actor_kind      text        NOT NULL,      -- human|schedule|agent|api|mcp
    actor_ref       text,
    action_type     text        NOT NULL,
    policy_id       uuid        REFERENCES autonomy_policies (id) ON DELETE SET NULL,
    decision        text        NOT NULL,      -- allowed|denied|escalated|deferred
    reason_code     text        NOT NULL,
    model           text,
    model_version   text,
    prompt_hash     bytea,
    candidate_count integer,
    selected_rank   integer,
    -- Hash chain over the non-personal skeleton only.
    prev_hash       bytea,
    row_hash        bytea       NOT NULL,
    occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE decision_trace_payloads (
    trace_id        bigint PRIMARY KEY REFERENCES decision_traces (id) ON DELETE CASCADE,
    payload         jsonb,
    erased_at       timestamptz,
    erasure_reason  text
);

-- Shadow mode: what the agent WOULD have done, beside what the human did.
CREATE TABLE shadow_observations (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    node_id         uuid        NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    action_type     text        NOT NULL,
    subject_ref     text        NOT NULL,
    agent_proposal  jsonb       NOT NULL,
    human_action    jsonb,
    agreed          boolean,
    observed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kill_switches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        REFERENCES organizations (id) ON DELETE CASCADE,   -- NULL = global
    node_id         uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    action_type     text,
    engaged_at      timestamptz NOT NULL DEFAULT now(),
    engaged_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    released_at     timestamptz,
    reason          text        NOT NULL
);
CREATE INDEX kill_switches_live_idx ON kill_switches (organization_id) WHERE released_at IS NULL;
COMMIT;
```

## 3.12 `0013_audit_retention_rls.sql`

```sql
BEGIN;
-- The audit split. Skeleton is immutable and hash-chained; the payload is erasable and
-- tombstoned. This resolves immutability-vs-Art-17 and cannot be added later without
-- invalidating the chain.
ALTER TABLE audit_log ADD COLUMN node_id uuid REFERENCES nodes (id) ON DELETE SET NULL;
ALTER TABLE audit_log ADD COLUMN actor_external_id uuid REFERENCES external_principals (id) ON DELETE SET NULL;
ALTER TABLE audit_log ADD COLUMN actor_kind text NOT NULL DEFAULT 'human';
ALTER TABLE audit_log ADD COLUMN prev_hash bytea;
ALTER TABLE audit_log ADD COLUMN row_hash bytea;
ALTER TABLE audit_log ADD COLUMN retention_class text NOT NULL DEFAULT 'standard';
ALTER TABLE audit_log RENAME COLUMN detail TO detail_deprecated;

CREATE TABLE audit_payloads (
    audit_id        bigint PRIMARY KEY REFERENCES audit_log (id) ON DELETE CASCADE,
    detail          jsonb,
    erased_at       timestamptz,
    erasure_reason  text
);

CREATE TABLE retention_policies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    data_class      text        NOT NULL,      -- metric_l1|inbox|audit|media|decision_trace
    network         text,                      -- YouTube's 30-day cap is per network
    retain_days     integer     NOT NULL,
    legal_hold      boolean     NOT NULL DEFAULT false,
    UNIQUE (organization_id, data_class, network)
);

-- The README asserts denormalised organization_id exists so RLS is "cheap and obviously
-- correct". Make it true. One policy shape, applied to every tenant table.
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_tenant_isolation ON posts
    USING (organization_id = current_setting('app.organization_id')::uuid);
-- ... repeated for every tenant-owned table; generated, not hand-written.
COMMIT;
```

## 3.13 `0014_enum_and_constraint_hardening.sql`

**Caveat that bites here and in `0008`.** `ALTER TYPE … ADD VALUE` is permitted inside a transaction on PG12+, but the new label **cannot be used in the same transaction**. Either split each enum extension into its own migration file ahead of the migration that uses it, or — preferred, and what we should adopt — replace the remaining enums with `text` + a named CHECK constraint generated from the TypeScript unions, so widening a state machine is an ordinary DDL change rather than a two-deploy dance. `post_status` and `target_status` are the two that will change most often.

```sql
BEGIN;
-- The TypeScript unions are closed; the database currently is not. Generate these from
-- packages/adapters/src/{networks,content}.ts in CI so drift fails the build.
ALTER TABLE posts ADD CONSTRAINT posts_format_known CHECK (format IN (
    'text','image','carousel','video','reel','story','poll','article','document','thread','pin','review_reply'));
ALTER TABLE post_targets ADD CONSTRAINT post_targets_format_known CHECK (format IN (
    'text','image','carousel','video','reel','story','poll','article','document','thread','pin','review_reply'));
ALTER TABLE social_profiles ADD CONSTRAINT social_profiles_network_known
    CHECK (network IN ( /* NETWORK_IDS, generated */ ));
ALTER TABLE post_targets ADD CONSTRAINT post_targets_network_known
    CHECK (network IN ( /* NETWORK_IDS, generated */ ));

-- Six delivery modes, not two.
ALTER TYPE delivery_mode ADD VALUE 'async_poll';
ALTER TYPE delivery_mode ADD VALUE 'native_scheduled';
ALTER TYPE delivery_mode ADD VALUE 'async_reviewed';
ALTER TYPE delivery_mode ADD VALUE 'unsupported';

-- Publer's *_reauth and recycling states, which model the category's defining failure.
ALTER TYPE post_status ADD VALUE 'awaiting_reauth';
ALTER TYPE post_status ADD VALUE 'recycling_active';
ALTER TYPE post_status ADD VALUE 'recycling_paused';
ALTER TYPE post_status ADD VALUE 'recycling_expired';

-- Entitlements move off the organizations row: per-profile billing is the axis that
-- punishes the network breadth we differentiate on.
ALTER TABLE organizations DROP COLUMN profile_limit;
CREATE TABLE entitlements (
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    key             text        NOT NULL,      -- nodes|ai_media_credits|listening_volume|...
    limit_value     bigint,
    period          text,
    PRIMARY KEY (organization_id, key)
);
COMMIT;
```

---

# 4. Concrete type and module deltas

## 4.1 `@smm/shared`

### 4.1.1 `ids.ts` — new brands

```ts
export type NodeId            = Brand<string, 'NodeId'>;
export type ExternalPrincipalId = Brand<string, 'ExternalPrincipalId'>;
export type ShareLinkId       = Brand<string, 'ShareLinkId'>;
export type ContentVersionId  = Brand<string, 'ContentVersionId'>;
export type PostVariantId     = Brand<string, 'PostVariantId'>;
export type CampaignId        = Brand<string, 'CampaignId'>;
export type LabelId           = Brand<string, 'LabelId'>;
export type CategoryId        = Brand<string, 'CategoryId'>;
export type ScheduleId        = Brand<string, 'ScheduleId'>;
export type SlotId            = Brand<string, 'SlotId'>;
export type RenditionId       = Brand<string, 'RenditionId'>;
export type RightsGrantId     = Brand<string, 'RightsGrantId'>;
export type GenerationId      = Brand<string, 'GenerationId'>;
export type ShortLinkId       = Brand<string, 'ShortLinkId'>;
export type DecisionTraceId   = Brand<string, 'DecisionTraceId'>;
export type DestinationId     = Brand<string, 'DestinationId'>;

/** Canonical hash of a content version. Approvals and idempotency keys both bind to it. */
export type ContentHash = Brand<string, 'ContentHash'>;
```

### 4.1.2 `errors.ts` — the 13-class taxonomy

```ts
export type FailureKind =
  | 'transient'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'auth_expired'          // refresh once, then retry once
  | 'auth_revoked'          // no retry; emit a scoped repair link
  | 'scope_missing'         // names the exact scope and how to grant it
  | 'content_rejected'      // platform reason verbatim AND translated
  | 'platform_policy'       // excluded from our SLA numerator
  | 'validation_failed'     // must never reach a user — every occurrence is our bug
  | 'plan_insufficient'     // the CUSTOMER's plan on the network (Vimeo, Trustpilot, Flickr)
  | 'destination_gone'
  | 'platform_down'
  | 'unknown';              // every occurrence is a taxonomy bug; alert an engineer

/** Terminal outcomes no generic taxonomy anticipates, both discovered by read-back. */
export type TerminalOutcome = 'published_then_removed' | 'partially_published';

export interface PublishFailure {
  readonly kind: FailureKind;
  readonly message: string;
  readonly missingScope?: string;          // for scope_missing
  readonly quotaResetAt?: Date;            // waiting inside the window does not help
  readonly platformCode?: string;
  readonly platformMessage?: string;
  readonly platformMessageTranslated?: string;   // CN/KR APIs answer in CN/KR
  readonly retryAfterMs?: number;
  readonly countsAgainstSla: boolean;      // rate limits and platform outages do not
  readonly traceId?: string;
}
```

`dispositionOf` gains a fourth action: `{ action: 'repair_link'; profileId: SocialProfileId }` for `auth_revoked` and `scope_missing`, so the pipeline emits a client-sendable repair link instead of a red dot.

### 4.1.3 `text.ts` — similarity and the fold

```ts
/** Lowercase, strip punctuation/emoji/URLs/hashtags, collapse whitespace, NFKC. */
export function normaliseForSimilarity(text: string): string;
export function shingles(text: string, k?: number): string[];
/** 64-bit SimHash over weighted shingles. Stored as a bigint for cheap Hamming distance. */
export function simhash(text: string): bigint;
export function hammingDistance(a: bigint, b: bigint): number;
export function minhashSignature(text: string, bands?: number): Uint32Array;
/** 0..1 where 1 is identical. What the composer shows as "94% similar". */
export function similarityScore(a: string, b: string): number;

export interface FoldSpec {
  readonly network: NetworkId;
  readonly deviceClass: 'mobile' | 'desktop';
  readonly visibleLines: number;
  readonly charsPerLine: number;      // at the real rendered width in the real font
}
/** Grapheme index where "See more" lands, and the text above it. */
export function truncationFold(body: string, spec: FoldSpec): { index: number; visible: string };
```

### 4.1.4 New `time.ts` (moved from `@smm/scheduler`, because publishing needs it too)

```ts
export interface ScheduledTime {
  readonly local: WallClock;
  readonly zone: string;                 // IANA
  readonly dstPolicy: 'compatible' | 'earlier' | 'later' | 'reject';
  /** Materialised for the dispatcher's index. NEVER authoritative. */
  readonly dispatchAtUtc: Date;
  readonly tzdbVersion: string;
}
export function resolveScheduledTime(local: WallClock, zone: string, policy?: DstPolicy): ScheduledTime;
export function needsRecompute(t: ScheduledTime, currentTzdb: string): boolean;
```

## 4.2 `@smm/adapters`

### 4.2.1 `content.ts` — variants, per-network extras, locale

```ts
export type DeliveryMode =
  | 'sync'
  | 'async_poll'          // Meta, TikTok, Pinterest, LinkedIn, YouTube containers
  | 'native_scheduled'    // the platform holds it — we must NOT also dispatch
  | 'async_reviewed'      // platform content review before it goes live
  | 'reminder'
  | 'unsupported';

/** Typed per-network extras. A jsonb blob cannot be validated; this can. */
export type NetworkExtras =
  | { readonly network: 'pinterest'; readonly boardIds: readonly string[]; readonly altTextCustom?: string }
  | { readonly network: 'reddit'; readonly subreddit: string; readonly flairId?: string; readonly nsfw?: boolean; readonly spoiler?: boolean }
  | { readonly network: 'tiktok'; readonly privacyLevel: string; readonly disableComment?: boolean; readonly disableDuet?: boolean; readonly disableStitch?: boolean; readonly coverTimestampMs?: number; readonly brandedContent?: boolean; readonly aiGenerated?: boolean }
  | { readonly network: 'youtube'; readonly categoryId?: string; readonly tags?: readonly string[]; readonly playlistId?: string; readonly publishAt?: Date; readonly madeForKids: boolean; readonly alteredContent?: boolean }
  | { readonly network: 'instagram'; readonly productTags?: readonly ProductTag[]; readonly collaborators?: readonly string[]; readonly shareToFeed?: boolean; readonly trialReel?: boolean; readonly aiInfoLabel?: boolean }
  | { readonly network: 'linkedin'; readonly targeting?: LinkedInTargeting; readonly documentTitle?: string }
  | { readonly network: 'google_business'; readonly locationId: string; readonly callToAction?: GbpCta; readonly offer?: GbpOffer }
  | { readonly network: 'mastodon'; readonly visibility: 'public' | 'unlisted' | 'private' | 'direct'; readonly contentWarning?: string }
  | { readonly network: string; readonly [k: string]: unknown };   // long tail, explicitly untyped

export interface PostVariant {
  readonly id: PostVariantId;
  readonly network?: NetworkId;      // undefined = shared default
  readonly locale?: string;          // BCP-47 — multi-language variants of one post
  readonly body: string;
  readonly title?: string;
  readonly media: readonly MediaRef[];
  readonly link?: string;
  readonly firstComment?: string;
  readonly scheduledComments?: readonly string[];   // up to 10, Vista parity
  readonly poll?: Poll;
  readonly stickers?: readonly StickerRef[];
  readonly nativeAudio?: NativeAudioRef;
  readonly extras?: NetworkExtras;
}

export interface ResolvedTarget {
  readonly network: NetworkId;
  readonly profileId: SocialProfileId;
  readonly destinationIds?: readonly DestinationId[];   // boards, subreddits, locations
  readonly contentVersionId: ContentVersionId;
  readonly contentHash: ContentHash;
  readonly scheduled: ScheduledTime;
  readonly format: PostFormat;
  readonly variant: PostVariant;
  readonly renditions: ReadonlyMap<MediaAssetId, RenditionRef>;
  readonly watermarkId?: string;
  readonly idempotencyKey: string;
}
```

`resolveTarget` becomes `resolveVariant(post, network, locale, connection)` and resolves through **three** layers — shared default → network variant → locale variant — instead of copying seven fields verbatim from the draft.

### 4.2.2 `capabilities.ts` — the missing descriptors

```ts
export interface AltTextCapability {
  readonly supported: boolean;
  readonly maxLength?: number;                  // X 1,000; Bluesky 500
  readonly field: string;                       // 'content.media.altText' | 'alt_text_custom'
  readonly perCarouselChild: boolean;           // Meta yes; most no
  readonly setVia?: 'inline' | 'separate_call'; // X needs POST /2/media/metadata
}

export interface DuplicatePolicy {
  readonly scope: 'account' | 'cross_account' | 'board' | 'subreddit';
  readonly windowHours: number;                 // X: 72
  readonly similarityThreshold: number;         // 0..1; "substantially similar"
  readonly enforcement: 'reject' | 'restrict' | 'downrank' | 'none';
}

export interface QuotaModel {
  /** Project-scoped units shared across ALL tenants on this app (YouTube 10,000/day). */
  readonly projectUnitsPerDay?: number;
  readonly unitCostPerOperation?: Readonly<Record<string, number>>;   // {'publish': 1600}
  readonly projectQpm?: number;                                       // GBP ~300
  /** The connection cap is shared with every OTHER third-party client (TikTok 15/24h). */
  readonly connectionCapIsShared: boolean;
  readonly maxConcurrentJobs: number;           // Reddit 1 … Facebook 500
}

export interface PreviewCapability {
  readonly foldMobile: FoldSpec;
  readonly foldDesktop: FoldSpec;
  readonly buildsLinkCard: boolean;
  readonly linkCardSuppressedFor?: readonly string[];   // FB refuses facebook.com links
}

export interface EngagementCapability {
  readonly commentReplyWindowHours?: number;    // FB/IG 24
  readonly dmReplyWindowHours?: number;         // FB/IG 24, extendable to 168
  readonly humanAgentExtensionHours?: number;   // 168
  readonly commentResetsDmClock: boolean;       // FALSE on Meta — the trap
  readonly privateReplyOneShotDays?: number;    // 7
  readonly webhookEvents: readonly string[];
  readonly pollIntervalSec?: number;            // published in-product as staleness
  readonly canLikeAsBrand: boolean;
  readonly canBlockUser: boolean;               // Facebook Pages only
  readonly canModerateAdComments: boolean;
}

export interface PlatformCapabilities {
  readonly network: NetworkId;
  readonly archetype: Archetype;                // A..I
  readonly formats: readonly FormatCapability[];
  readonly publishing: PublishingLimits;        // + duplicatePolicy, quota: QuotaModel
  readonly read: ReadCapability;
  readonly engagement: EngagementCapability;
  readonly altText: AltTextCapability;
  readonly preview: PreviewCapability;
  readonly deliveryModes: readonly DeliveryMode[];
  readonly verifiedOn: string;
  /** How stale this may get before the network is auto-downgraded to limited_access. */
  readonly stalenessBudgetDays: number;
  /** Per-field confidence. X's per-post cost is CONTESTED and must not read as fact. */
  readonly confidence: Readonly<Record<string, 'verified' | 'documented' | 'inferred' | 'contested'>>;
  readonly sources: readonly string[];
}
```

Immediate data corrections: `INSTAGRAM.publishing.maxPostsPer24h` → **25**, `confidence: {maxPostsPer24h: 'contested'}`; `X.costPerPostUsd` → `confidence: 'contested'` with a build-time assertion that contested pricing fields cannot be read by the billing module.

### 4.2.3 `adapter.ts` — five verbs and the read surface

```ts
export interface PlatformAdapter {
  readonly network: NetworkId;
  readonly archetype: Archetype;
  /** Async and connection-aware: Mastodon limits are per instance, plans differ per customer. */
  capabilities(conn?: Connection): Promise<PlatformCapabilities>;

  // auth
  beginAuth(ctx: AuthContext): Promise<{ redirectUrl: string } | { instructions: readonly Instruction[] }>;
  completeAuth(ctx: AuthContext): Promise<readonly Connection[]>;   // PLURAL — GBP returns hundreds
  refresh?(conn: Connection): Promise<Result<Connection, PublishFailure>>;
  revoke(conn: Connection): Promise<RevocationReceipt>;             // upstream, not a row delete
  /** Read-only identity call. NEVER a speculative refresh — that orphans X and TikTok tokens. */
  probe(conn: Connection): Promise<HealthReport>;
  /** Enumerate what the token actually grants, per precondition. */
  assertReadiness(conn: Connection): Promise<readonly ConnectionAssertion[]>;

  // destinations
  listDestinations(conn: Connection): Promise<readonly Destination[]>;
  destinationRules(conn: Connection, dest: DestinationId): Promise<readonly DestinationRule[]>;

  // publish — five verbs, because the domain has five
  validate(conn: Connection, target: ResolvedTarget, ctx: ValidationContext): Promise<ValidationReport>;
  submit(conn: Connection, target: ResolvedTarget, idem: string): Promise<Result<PublishHandle, PublishFailure>>;
  poll(conn: Connection, handle: PublishHandle): Promise<'pending' | 'ready' | 'rejected' | 'completed'>;
  finalize(conn: Connection, handle: PublishHandle): Promise<Result<PublishSuccess, PublishFailure>>;
  cancel?(conn: Connection, handle: PublishHandle): Promise<Result<void, PublishFailure>>;
  comment?(conn: Connection, remotePostId: RemoteId, body: string): Promise<Result<RemoteId, PublishFailure>>;

  // verify
  readBack(conn: Connection, remotePostId: RemoteId): Promise<PostVisibility>;

  // read — L1 RAW ONLY. Normalisation happens above the adapter or provenance is lost.
  fetchMetrics?(conn: Connection, ids: readonly RemoteId[], window: DateRange): Promise<readonly RawMetric[]>;
  backfill?(conn: Connection, depth: Duration): AsyncIterable<readonly RawMetric[]>;
  fetchInbound?(conn: Connection, cursor?: string): Promise<Page<InboundItem>>;
  fetchReviews?(conn: Connection, cursor?: string): Promise<Page<Review>>;
  replyToReview?(conn: Connection, reviewId: string, body: string): Promise<Result<void, PublishFailure>>;

  /** The ONLY place platform error strings are read. */
  classify(err: unknown): PublishFailure;
}

export interface RawMetric {
  readonly subjectType: 'post' | 'profile' | 'story' | 'video' | 'link';
  readonly subjectId: string;
  readonly fieldAsReturned: string;      // verbatim upstream name
  readonly value: number;
  readonly endpoint: string;
  readonly apiVersion: string;
  readonly measureKind: 'snapshot' | 'period' | 'cumulative';
  readonly periodStart?: Date;
  readonly periodEnd?: Date;
  readonly collectedAt: Date;
}

export type PostVisibility =
  | { readonly state: 'live' }
  | { readonly state: 'removed'; readonly by?: string; readonly category?: string }
  | { readonly state: 'restricted'; readonly detail: string }
  /** No read-back path exists on this network. The UI says so rather than guessing. */
  | { readonly state: 'unavailable'; readonly reason: string };
```

### 4.2.4 `validation.ts` — the context that makes pre-flight real

```ts
export interface ValidationContext {
  readonly now: Date;
  readonly connectionHealth: HealthReport;
  readonly quota: QuotaHeadroom;                  // account, tenant AND project level
  readonly calendarSimulation?: CalendarBreach[]; // "breaches IG's cap on the 14th"
  readonly duplicates?: DuplicateFinding[];       // similarity index result
  readonly destinationRules?: readonly DestinationRule[];
  readonly linkProbe?: LinkProbe;                 // reachability + OG/oEmbed result
  readonly rights?: RightsState;
  readonly renditions: ReadonlyMap<MediaAssetId, RenditionState>;
  readonly voiceAdherence?: number;
  readonly altTextPolicy: 'warn' | 'block';
  readonly costEstimateUsd?: number;
}

export interface DuplicateFinding {
  readonly score: number;                 // 0..1
  readonly threshold: number;             // from DuplicatePolicy
  readonly conflictingTargets: readonly PostTargetId[];
  readonly windowHours: number;
  readonly message: string;               // "94% similar to posts queued on 6 profiles in 72h"
}

export type IssueCode =
  /* existing 20 */
  | 'near_duplicate_content'
  | 'destination_rule_violation'
  | 'flair_required'
  | 'quota_breach_in_calendar'
  | 'link_unreachable'
  | 'link_card_absent'
  | 'truncation_fold_warning'
  | 'missing_disclosure'
  | 'rights_expired'
  | 'voice_adherence_low'
  | 'rendition_not_ready'
  | 'instance_limit_exceeded'
  | 'connection_not_ready'
  | 'cost_exceeds_cap';

export type AutoFix =
  | { readonly kind: 'truncate_body'; readonly body: string }
  | { readonly kind: 'drop_media'; readonly keepCount: number }
  | { readonly kind: 'switch_delivery'; readonly to: DeliveryMode }
  /** Shows a before/after similarity score rather than a vibe. */
  | { readonly kind: 'rewrite_for_similarity'; readonly body: string; readonly scoreBefore: number; readonly scoreAfter: number }
  | { readonly kind: 'apply_rendition'; readonly presetKey: string; readonly cropPreviewUrl: string }
  | { readonly kind: 'add_alt_text'; readonly drafts: ReadonlyMap<MediaAssetId, string>; readonly requiresConfirmation: true }
  | { readonly kind: 'move_to_next_slot'; readonly slotId: SlotId; readonly at: ScheduledTime }
  | { readonly kind: 'split_thread'; readonly parts: readonly string[] }
  | { readonly kind: 'strip_unsupported_feature'; readonly feature: PostFeature };

/** Persisted and user-visible: what we transformed, downgraded, split, rerouted or refused. */
export interface DegradationReceipt {
  readonly ladderStep: 'transform' | 'downgrade' | 'split' | 'reroute' | 'reminder' | 'refuse';
  readonly explanation: string;
  readonly before: unknown;
  readonly after: unknown;
}

export interface ValidationReport {
  readonly issues: readonly ValidationIssue[];
  readonly publishable: boolean;
  readonly delivery: DeliveryMode | 'blocked';
  readonly receipts: readonly DegradationReceipt[];
  readonly fold?: { readonly index: number; readonly visible: string };
  readonly estimatedCostUsd: number;
}
```

## 4.3 `@smm/scheduler`

```ts
/** Three nested budgets, because a per-account budget cannot see a shared project quota. */
export interface BudgetContext {
  readonly project: { readonly unitsUsedToday: number; readonly unitsPerDay: number; readonly tenantShare: number };
  readonly tenant:  { readonly spendTodayUsd: number; readonly capUsd?: number };
  readonly connection: AccountHistory;
}
export function checkPublishBudget(now: Date, ctx: BudgetContext, caps: PlatformCapabilities): BudgetDecision;

/** Simulate an entire calendar against every cap before anything is scheduled. */
export function simulateCalendar(
  targets: readonly PlannedTarget[],
  caps: ReadonlyMap<NetworkId, PlatformCapabilities>,
  history: ReadonlyMap<SocialProfileId, AccountHistory>,
): readonly CalendarBreach[];

export interface AttemptPolicy {
  readonly maxAttempts: number;
  /** The primary bound. A post 40 minutes late may be worse than one that did not go. */
  readonly latenessBudget: number;   // ms
  readonly baseMs: number;
  readonly maxMs: number;
}

/** Slot resolution: floating posts reflow, pinned ones never move. */
export function resolveSlot(
  schedule: PostingSchedule,
  slots: readonly ScheduleSlot[],
  post: { categoryId?: CategoryId; format: PostFormat },
  occupied: ReadonlySet<SlotId>,
): SlotId | undefined;

/** "Editing this schedule will move 47 posts" — preview before commit. */
export function previewReflow(schedule: PostingSchedule, next: readonly ScheduleSlot[]): ReflowPlan;
```

---

# 5. New packages and services

| Package / service | Why it earns its place | Depends on |
|---|---|---|
| **`@smm/policy`** — the Action Gate | Every write (human, job, agent, API, MCP) passes one synchronous fail-closed evaluation: kill switches → holds → connection health → autonomy policy → atomic budget lease → deterministic guardrails → rights → LLM judges → escalation → approval routing. It is a **module boundary**, not a library: modules physically cannot publish without it. Retrofitting a gate onto shipped agent surfaces is a rewrite, which is why every incumbent that shipped a copilot first is stuck. | shared, db |
| **`@smm/capabilities`** — descriptors as versioned data | Extracted from `@smm/adapters` so a limit change is a **data deploy, not a release** (irreversible I6). One source renders the composer, the validator, the degradation ladder, the SLA floor, the MCP tool schemas and the public honest capability matrix — four differentiators become free consequences of one artifact. | shared |
| **`@smm/media`** — probe, rendition, watermark, caption burn-in | Probe-and-passthrough, deterministic rendition cache, visual crop diff, watermarking, transcription, caption burn-in, clip extraction. This is the only place ffmpeg lives. Vista always re-encodes and says so in its own docs; not re-encoding is a shippable quality claim. | shared |
| **`@smm/similarity`** — fingerprints and near-duplicate policy | SimHash/MinHash over text, pHash over media, a windowed index, per-network policy evaluation, and the rewrite loop that proves a variant cleared the threshold. Used by the composer, the recycler, the creative index and the risk scorer — four consumers, one implementation. | shared |
| **`@smm/metrics`** — the three-layer metric model | L1 raw ingestion with provenance, L2 canonicalisation with comparability classes, L3 derived ratios computable only within a class. Also owns `MetricDefinitionChange`, the reconciliation view and the retention enforcement per network partition. Cannot live in adapters (they must stay raw) or in the API (it is a batch pipeline). | shared, db |
| **`@smm/links`** *(+ `apps/redirect`)* | Own the redirect or own no click data. A separate tiny edge service because the redirect must be fast, globally distributed, and available when the monolith is not — and because the click log is the join key into commerce. Publer outsourced this to eight vendors and consequently has zero click data of its own. | — |
| **`@smm/ai`** — model broker, voice, lineage | Routing (caption drafts to cheap models, judging to mid, planning to frontier), prompt-prefix caching (~45% of the text bill), the versioned voice object, the eval harness, cost estimation before the job, and the `generations` lineage writer. Every model call in the product goes through it or the loop cannot be closed. | shared, policy |
| **`@smm/agents`** — autonomy, traces, shadow, replay | Policy objects, decision-trace emission with the skeleton/payload split, shadow-mode recording and agreement scoring, the replay harness. Separate from `@smm/ai` because autonomy is a governance concern, not a model concern. | policy, ai |
| **`@smm/importers`** — migration | Nine vendor CSV parsers + generic column mapper, platform re-fetch backfill drivers, Linktree/Beacons/Stan/Milkshake/Komi bio importers, Boolean listening-query translator, and the side-by-side reconciliation report. The highest-ROI GTM engineering in the category and it is nearly unbuilt. | adapters, metrics |
| **`@smm/warehouse`** — export and the dbt package | Iceberg writer, row-level export, the published versioned dbt package, Snowflake Native App / BigQuery listing manifests, and the schema-deprecation contract (additive-only within a version, published window, changelog). The category's largest single unclaimed gap. | metrics |
| **`apps/api`** — one modular monolith | Module boundaries enforced by an ESLint import-boundary rule in CI, not by the network. Six to eight people cannot run a distributed topology, and none of this category's hard problems (calendar-time platform approvals, correctness-under-fragility, irreversible schema, coverage breadth) are solved by microservices. | all |
| **`apps/worker`** — one worker binary | Postgres `SKIP LOCKED` + `LISTEN/NOTIFY` job runner: dispatch, poll, finalize, read-back, backfill, transcode, digest. Transactional enqueue and SQL debuggability matter more than throughput at this stage. | all |
| **`apps/bio`** — public pages | Ships in Phase 0 with no OAuth and no App Review, on its own domain, SSR for real SEO. It is the product's only viral surface. **Note:** a public page surface plausibly makes us an online platform under the DSA — notice-and-action from day one is a scope decision, not a growth decision. | links |
| **`apps/mobile`** — reminder publishing as a first-class product | IG Stories with stickers, IG personal, TikTok's creative layer and catalogue audio are permanently API-impossible; ~20 surfaces are assisted-only. Never-drop-the-slot semantics, media pre-downloaded, caption pre-copied, deep link into the native composer, and a "did it post?" confirmation loop reconciling the calendar. | adapters |
| **`apps/mcp`** — the agent surface | `dryRun` default true, propose→confirm handshake, scoped per-brand tokens, hard publish and spend caps — all enforced **server-side**, because client-side consent is advisory and absent entirely for headless agents. | policy |

**Deliberately not a package:** transcoding beyond ffmpeg, SAML/SCIM implementations, a DAM, a general-purpose workflow builder, and any listening firehose. Buy or skip.

---

# 6. Revised build order

The rule that governs the sequence: **irreversible before reversible, calendar-time before engineering-time, compounding assets before features.** Platform approvals (Meta 6–14 weeks, LinkedIn "may never answer", TikTok 3–10 weeks, YouTube 6–16 weeks) are the real project plan; the software fills the waiting time.

| # | Step | Why here, specifically |
|---|---|---|
| **0** | **File every platform application, today.** Meta Business Verification + App Review, TikTok audit, LinkedIn Community Management, Google OAuth verification + YouTube quota, Pinterest Standard, GBP allowlisting. Named owner, calendared dates, a budgeted rejection loop of 1–2 cycles. | Nothing about this gets faster by starting later, and it is the only work with a multi-month floor. Every week of delay is a week of delay in revenue, not in code. |
| **1** | **Migrations `0002`–`0005`** (hierarchy + time, content versions, metrics, credentials). No feature work in parallel. | These are the four irreversibles. `0004` in particular is losing data *right now* — Pinterest 90d, X 30d, TikTok ~60d are destroyed daily until snapshots start. Every feature built on the current schema increases the migration cost. |
| **2** | **Adapter contract surgery**: five verbs, six delivery modes, `classify`, `probe`, `readBack`, `listDestinations`, async `capabilities()`, raw `RawMetric`. Rebuild the ten existing descriptors against the new shape; correct Instagram to 25/day and mark X pricing contested. | Every adapter written before this is rewritten after it. Ten descriptors is the cheapest moment this will ever happen. `native_scheduled` missing is a live duplicate-post risk the moment YouTube or Facebook is wired. |
| **3** | **The publish spine end to end on three free networks — Bluesky, Mastodon, Telegram.** Claim-before-call, idempotency from `(target, content_hash)`, typed errors, lateness budget, three-level budgets, `VERIFY_PENDING`, read-back, retry ledger, `failure_observations`. | Three different archetypes (B, C, D) with **no approval gate**, so the abstraction is proven while every application is pending. The failure corpus starts compounding on day one. |
| **4** | **Action Gate + audit split + RLS.** | It must sit in front of the first write, not the hundredth. Retrofitting it onto shipped surfaces is a rewrite; the hash chain cannot be added retroactively; and the README's central schema justification is currently unimplemented. |
| **5** | **Link-in-bio + shortener + QR, public, free, own domain** (`apps/bio`, `apps/redirect`, `@smm/links`). With `utm_content = post_id` + `ref=` + server-side click id from the first click. | Needs no OAuth and no App Review, so it ships during the approval wait. It is the only viral surface, the highest switching cost in the category, and the attribution join key must exist before the first link is minted — retrofitting it means the back-catalogue of clicks has no post. |
| **6** | **Composer + calendar + queues + variants + bulk CSV.** Per-connection variants with typed extras, per-network and per-locale, floating/pinned slots, typed slots + categories, reflow preview, approval-aware slot reservation, dry-run CSV with error write-back. | The parity floor's centre of gravity. It depends on `0003` (variants) and step 2 (extras), and nothing else can be demoed without it. |
| **7** | **Reliability surfaces: the day sheet, the overnight digest, connection assertions + repair links, the near-duplicate guard.** | Four of the highest-value whitespace items, all cheap once step 3 exists, and all of them demo in ninety seconds. The near-duplicate guard in particular is the difference between "we schedule" and "we understand the networks". |
| **8** | **Media pipeline**: probe-and-passthrough, rendition cache, visual crop diff, asset-level alt text with AI drafts and confirmation, watermarks, version stack, client intake portal. | Blocks P0 parity (alt text, thumbnails, 2 GB uploads) and unblocks the accessibility and public-sector story. Renditions must precede any video network. |
| **9** | **Approvals as a routing engine**: hash binding, materiality rules, redline diff, seatless external principals, batch decision links, Slack + Teams cards, risk-ranked review. | The agency motion does not start without it, and `seat_class` + `external_principals` from step 1 make free reviewer seats a schema fact rather than a promise. |
| **10** | **Meta family, Pinterest, YouTube, GBP** as their approvals clear, in gate-cost order. | Sequencing by gate cost is self-bootstrapping: the live product built in steps 3–9 is the evidence every later application requires. |
| **11** | **Analytics: L1→L2→L3, provenance, comparability classes, reconciliation view, report catalogue, white-label PDFs, free BI connector, goals.** Then **migration** (nine parsers + platform re-fetch + reconciliation report). | Provenance columns already exist from step 1, so this is pipeline work rather than schema work. Migration ships immediately after, because "switch in 20 minutes and bring three years of history" only lands once the analytics it restores into actually exist. |
| **12** | **Inbox with the two-clock state machine and expiry-first triage**; then automation rules through the Action Gate. | Meta's windows are the hard constraint and the differentiator in the same object. It comes after analytics because analytics is the upgrade driver and the inbox is the retention driver. |
| **13** | **AI: brand voice versioned + evaluated + model-pinned, generation lineage, outcome write-back, pre-flight cost estimate, unlimited text / metered media.** | The lineage table exists from step 1, so every generation from now on carries the join key. Deferring the *feature* is fine; deferring the *schema* was not. |
| **14** | **Warehouse-native export + dbt package + schema-deprecation policy.** Then evergreen/recycling/RSS, paid + boosting, reviews + review generation, listening, repurposing, agents at L3, regional networks. | Each of these is a real differentiator and none of them is irreversible. They are correctly last. |

**What must not happen:** building the composer, the inbox or any analytics on the current schema. Every one of them writes rows that a later migration cannot repair — a post with no content version has no hash, and a metric with no provenance can never earn the badge that makes it trustworthy.

---

# 7. What we should deliberately not build

| Item | Decision | Why |
|---|---|---|
| **Headless credential-replay (T3) against customer accounts** | **Never.** Enforced by a CI fitness test that fails the build if browser-automation libraries appear outside the test-fixture directory | A direct ToS breach on every major network, however common it is in OSS. It permanently caps our coverage of API-less surfaces at "assisted" — a real trade, taken deliberately, and stated in the capability matrix |
| **Logged-out scrape verification of published posts** | **Never** — replaced entirely by authenticated read-back | Read-back is within platform terms, needs no scraping, and is strictly more informative. Where a network exposes no read-back path, the UI says "removal detection unavailable on this network" |
| **Listening firehose licensing (X, Meta Content Library), TikTok Research API** | **Never** | Cost floor and outright ineligibility — the Research API is closed to all commercial users. Occupy the $1k–$16k desert with explicitly scoped coverage and a published per-source coverage class instead |
| **Listings syndication (Yext-style)** | **Declined — partner instead** | A publisher-network data-licensing cost floor, not an engineering task. It is Yext's actual moat and we cannot rent it profitably |
| **Yelp / TripAdvisor review response** | **Impossible** | No owner OAuth, no response API exists for anyone. Monitor only, and say so in the capability matrix |
| **Our own DAM** | **Integrate, do not build** | Bynder/Frontify/Brandfolder connectors that read assets **and write usage back** give us the one thing they cannot have — the outcome. Building a DAM is a five-year product against incumbents with a decade of head start |
| **Our own SAML and SCIM implementations, our own transcoder beyond ffmpeg, WFM shift forecasting, a general-purpose workflow builder** | **Buy or skip** | None is differentiating; all are expensive to get right; two are security-critical |
| **A public aggregate reliability / p95 status page** | **Declined by default** | The denominator is uncontrolled, any rival can publish a friendlier number tomorrow, and disclosure invites SLA obligations without the contract. Ship a **contractual SLA with service credits** and a **per-tenant reliability ledger** the agency forwards instead — those are the artifacts that appear in an RFP |
| **Manual metric capture** | **Out of v1** | Near-zero sustained adoption, and it contaminates the metric-provenance differentiator that the whole analytics position rests on |
| **China (WeChat, Douyin, Weibo, Kuaishou, Xiaohongshu write)** | **Separate business case only** | A mainland WFOE, ICP filing and 第三方平台 qualification. It is a different legal product wearing the same UI, and it gets its own entity, stack and P&L or it does not happen |
| **VK / Odnoklassniki** | **Gated on counsel, not on engineering** | Technically the best regional APIs in the corpus (`wall.post` has native `publish_date`); legally a sanctions question. Record the decision and its date |
| **Per-profile or per-seat pricing** | **Never** | Both axes punish the segment with the lowest churn and the most pricing power. Per-profile taxes the network breadth we differentiate on; per-seat taxes the reviewers the approvals engine needs. `node_grants.seat_class` exists so this cannot drift back in |
| **AI credit metering on text** | **Never** | A caption costs ~$0.0002 cached. Buffer already deleted credit limits and burned that bridge for the category. Meter only genuinely costly media, in human-readable units, at a published rate, with a pre-flight estimate and a hard cap |
| **Single-account creative bandits** | **Refused as specified** | They cannot resolve realistic effects below ~200 lifetime posts at CV≈0.8. Arms are creative **features** pooled fleet-wide; randomised trials require ≥30 comparable units and report the MDE **before** the test runs. Shipping the naive version would be measurement theatre |
| **Snapchat organic, Truth Social, Gettr, Lemon8, Medium write, SoundCloud, Google Business Messages** | **Unsupported, published with the reason** | No developer program, no write API, or dead. Competitors still listing Medium and Google Business Messages are shipping stale marketing — the honest row is the differentiator |
| **Crisis triggering on cross-platform mention velocity** | **Deferred until enterprise ARR** | X/Reddit data pricing is the largest single unknown in the corpus. Owned-channel comment/DM sentiment velocity only until then |
| **Agent capacity routing, QA scoring, case objects, bidirectional CRM sync** | **Post-PMF** | Only enterprise buyers ask, and they already own a helpdesk that does it |

---

## Appendix — the twelve things that change tomorrow morning

1. `post_targets.scheduled_at` becomes `(scheduled_local, scheduled_zone, dst_policy, tzdb_version, dispatch_at_utc)`.
2. `social_profiles` gets `timezone` and `node_id`.
3. `content_versions` + `content_hash` exists, and `post_approvals` binds to it.
4. `metric_facts` exists with all six provenance columns, partitioned by network, and `audience_snapshots` starts filling.
5. `credentials.kind` exists with `byo_app` in the enum.
6. `nodes` (ltree) + `node_grants.seat_class` + `external_principals` + `share_links` exist; `organizations.profile_limit` is gone.
7. `SocialAdapter` becomes five verbs plus `classify`, `probe`, `readBack`, `listDestinations`, and async `capabilities()`.
8. `MetricSnapshot` becomes `RawMetric` with `fieldAsReturned`, `endpoint`, `apiVersion`, `measureKind`.
9. `DeliveryMode` becomes six members; `native_scheduled` stops being a bare `PostFeature` string.
10. `INSTAGRAM.maxPostsPer24h` becomes 25; every contested capability field carries `confidence`.
11. `TargetOverride` becomes `PostVariant` with typed `NetworkExtras` and a `locale`.
12. The Action Gate exists, and nothing writes to a network except through it.

*End of upgrade specification. Parity floor: §1. Audit: §2. Schema: §3. Types: §4. Packages: §5. Sequence: §6. Refusals: §7.*
