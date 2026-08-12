# 00 — Completeness Critique

**Prepared:** 12 August 2026
**Subject:** The 15-file research corpus in `/home/user/SMM/research/` (30,738 lines)
**Role:** Adversarial completeness review. This document exists to find what the corpus
missed, asserted without evidence, contradicted itself on, or got wrong.

**Verdict up front.** The corpus is unusually honest about its own provenance — the
per-file warning blocks are better than most commercial research. That honesty is also
the problem: it is front-loaded into methodology sections that the blueprints then stop
propagating, and it disguises a research pass that spent its entire evidence budget on
the least decision-relevant subject and none on the most. Roughly a quarter of the
corpus by volume is self-declared model recall with a May 2026 cutoff, presented in
tables that look like findings. The three blueprints then compress ~470 volatility
flags into ~18.

Nothing here disputes that the corpus is useful. It disputes that it is *evidence*.

---

## 1. The structural finding: the evidence budget was spent backwards

### 1.1 What actually happened

| Fact | Source |
|---|---|
| **Zero pages were rendered anywhere in the corpus.** WebFetch was blocked for every host in every file, including control fetches of `example.com` and `en.wikipedia.org`. | `01 §0.1`, `02 §0.1`, `03 §0.1`, `06`, `07`, `08`, `09 §0.1`, `10`, `11`, `12` |
| **The 200-call WebSearch budget was consumed entirely by files 01–04.** Files 05–12 had *zero* searches available. | `05 §0`, `06`, `07`, `08`, `10`, `11`, `12` provenance blocks |
| Files **04, 06, 07, 10** contain **zero fetched sources of any kind** — ~8,400 lines, ~27% of the corpus, that are pure recall. | Own `⛔ PROVENANCE WARNING` blocks |
| Files **05, 08, 09, 11, 12** got a genuine but narrow channel: `github.com` / `raw.githubusercontent.com` / npm registry. | Own provenance blocks |

### 1.2 Why the allocation is the single worst decision in the corpus

The root `README.md` states the thesis plainly: *"Platform API access is the real
bottleneck... Platform terms constrain the data model."* The corpus then spent 200 of
200 searches on Vista Social's feature list and competitor pricing, and **zero** on
platform APIs, compliance, or GTM.

This is exactly inverted:

- **Competitor pricing is the most volatile and the most trivially re-checkable thing
  in the document set.** It re-prices annually, and a human can verify Vista's entire
  plan table in four minutes on one page. It consumed the budget.
- **Platform API capability is the least volatile at the `C1` layer and the most
  expensive to be wrong about**, because it determines the adapter contract, the
  publishing state machine, the retention schema and the reminder-publish fallback —
  all things `blueprint-a §0.1` and `blueprint-b §0.2` correctly identify as
  non-retrofittable. It got nothing.

The corpus produced a meticulously sourced audit of a benchmark competitor's pricing
page and a recalled-from-memory specification of the systems the product is actually
built on. **File 06 is titled "the integration bible" and is 100% unfetched recall.**

**Action:** the verification backlogs (`04 §14`, `06 §16`, `07`, `12 §33`,
`blueprint-a §16`) are the real deliverable of this research pass. Treat the corpus as
a *question set*, run the backlogs, and only then write the strategy.

---

## 2. The master synthesis does not exist

`research/README.md` says: *"Start with `00-MASTER-STRATEGY.md`. Everything else is
supporting detail."*

**`00-MASTER-STRATEGY.md` is not in the directory.** Neither was this file when the
README was written. The README documents a corpus that does not exist yet, which is
itself a small instance of the corpus's central failure mode: describing intent in the
past tense.

The consequence is not cosmetic. Three blueprints were commissioned as *competing*
proposals explicitly to be synthesized. Without the synthesis there is:

- **no decision** between them,
- **no stated criteria** for making one,
- **no reconciliation** of the places they contradict each other (§6.3 below),
- and **no owner** of the parity checklist, pricing model, or roadmap the README
  promises the master document contains.

Meanwhile `git log` shows three commits of foundational code already landed
(`packages/adapters`, `packages/db` multi-tenant schema). **Implementation has started
before the architecture was chosen** — directly contrary to the root README's claim
that *"architecture decisions are deliberately being made after the research lands."*
The committed TypeScript monorepo already forecloses `blueprint-b`'s polyglot design
(Go dispatcher/publish workers, `blueprint-b §2412`). That choice was made by a commit,
not by an argument.

---

## 3. Confidence laundering into the blueprints — with the arithmetic

Every blueprint claims to inherit the corpus's grades. Count the markers:

| Document | Lines | `C3` (known-volatile) | `[FRAGILE]` | `[VERIFY]` | `UNVERIFIED` | `[J]` |
|---|---|---|---|---|---|---|
| `04-competitors-smb` | 941 | 57 | — | — | 3 | — |
| `06-platform-apis-tier1` | 1,447 | 52 | — | — | 10 | — |
| `07-platform-apis-tier2` | 3,131 | 86 | — | — | 33 | — |
| `08-platform-apis-regional` | 1,811 | 107 | — | — | 9 | — |
| `10-commerce-creator-influencer` | 2,862 | 125 | — | — | 15 | — |
| `12-analytics-listening-gtm` | 1,896 | 42 | — | — | 14 | — |
| **Dossier total** | | **~469** | | | **~84** | |
| `blueprint-a` | 2,084 | **1** | **0** | 11 | 9 | 0 |
| `blueprint-b` | 2,825 | **9** | **4** | 0 | 17 | 0 |
| `blueprint-c` | 2,874 | **8** | **0** | 0 | 13 | **3** |

**~469 volatility flags in the dossiers become ~18 in 7,783 lines of blueprint.**

Each blueprint states a methodology it then violates:

- **`blueprint-b §0.3`**: *"this document **inherits those grades rather than smoothing
  them over**... flagged inline as `[FRAGILE]`."* Four `[FRAGILE]` markers exist, three
  of which are the same X-pricing item.
- **`blueprint-c` header**: *"Every claim that is my own engineering judgement is
  marked `[J]`."* **Three `[J]` markers in 2,874 lines of original architecture.** The
  document is overwhelmingly engineering judgment — the convention is violated by
  roughly two orders of magnitude, which makes the three markers actively misleading:
  a reader reasonably infers the unmarked 99.9% is corpus-derived.
- **`blueprint-a` header**: *"Items marked `[VERIFY]` are load-bearing and unverified."*
  Eleven markers, for a document deriving from five dossiers that are *wholly*
  unverified.

The tell is that the blueprints' citation style (`06 §9.2`, `11 §10.3`) renders a
recalled number and a fetched artifact identically. A citation to `07 §4.2` looks like
provenance. `07` has no sources.

---

## 4. Direct contradictions the corpus never reconciled

These are the most damaging findings, because in each case two files state
incompatible facts and **each supports an opposite build decision**.

### 4.1 YouTube `videos.insert` quota — 1,600 units vs ~100 units (16×)

| File | Claim |
|---|---|
| `02` §YouTube | *"`videos.insert`: was ~**1,600** units → cut to ~**100** units on **4 Dec 2025**; since **1 June 2026** it bills to its **own dedicated bucket of ~100 calls/day**"* → conclusion: *"**YouTube video scheduling is now cheap** — worth building deeply."* |
| `05:90`, `05:1614–1615`, `05:1849` | *"`videos.insert` costs 1,600 units → **~6 uploads/day, total, across all your customers**"* `[K]` |
| `06:565`, `06:570`, `06:1096` | *"`videos.insert` = **1,600**... That is **6 uploads/day**"* `C2` |

Six uploads per day across the entire customer base is a business-ending constraint
requiring a quota-extension audit that `blueprint-b §2752` says is *"frequently
denied."* "YouTube scheduling is now cheap, build deeply" is the opposite instruction.

**Neither claim is sourced.** But note which one won by default: `blueprint-a:971`
quotes *"an upload costs ~1600 of 10,000 daily units"* and `blueprint-b:467` hardcodes
`videos.insert = 1600` in the capability descriptor type. The blueprints silently
adopted the pessimistic figure without ever noting that the Vista teardown — the file a
reader hits first — asserts the opposite. **1,600 is the long-standing documented
value; `02`'s "cut to 100" reads as confabulation**, and it is sitting unflagged in the
second file of the corpus.

### 4.2 X API pricing — two mutually exclusive regimes, and all three blueprints costed against the one the corpus says is dead

| File | Regime |
|---|---|
| `02:658–666` | **Tiered pricing was replaced by pay-per-use on 6 Feb 2026.** $0.015/post; **$0.20 if the post contains a link**; $0.005/read capped at 2M/mo; **Free tier discontinued**; Basic/Pro **closed to new signups**. Presented as a plain table **with no confidence tag**. |
| `06 §9.2` (written 34 min later, the "integration bible") | The tier table: Free $0 / **Basic $200/mo** / Pro $5,000 / Enterprise $42k+, Free at 500 posts. **`06` contains zero mentions of pay-per-use.** |
| `12 §3.3` | Traces the pay-per-use claim to **one** third-party GitHub notes file — `raydenai/viral-video-creation/notes/research-trend-detection-2026.md` — grades it `[G]`/`[C3]`, and calls it *"the single highest-blast-radius unverified number in this document."* |

Now the blueprints:

- `blueprint-a:1563` — infrastructure cost table: `X API tier | $200 | $5,000 | $42,000+`
- `blueprint-b:2522` — `$5k–$42k+, tier-dependent`
- `blueprint-c:1928` — `metered reads | $5–42k [06 §2.1] — plan-gated`

**All three cost against the regime that `02` says was closed to new signups six months
ago.** If the pay-per-use claim is true, a scheduler posting 100k link-posts/month
faces $20,000/month in X posting COGS (`12 §3.3`) and every pricing table in the corpus
is wrong. If it is false, `02`'s headline "2026 economics" table is fiction. Nobody
resolved it. `blueprint-a` lists it as `V1` — *the top item in its verification
backlog* — and then budgets against the other model on line 1563 anyway.

**Additional error:** `02` argues *"This explains Vista's $29/month X add-on exactly"*
because $29 ÷ $0.015 ≈ 1,900 posts. That is circular. Post-hoc arithmetic that a
round number divides into another number is not corroboration; $29 is equally
explicable under any pricing regime. This is presented as the clinching evidence for a
single-sourced claim.

### 4.3 Instagram publishing cap — 25 vs 50 vs 100 per 24h (4×)

| File | Claim | Grade |
|---|---|---|
| `06:565` | **100** published posts / 24h per IG account, queryable via `content_publishing_limit` | `C2` |
| `03:221`, `03:1174` | **25** posts / 24h per IG account | `[K]` |
| `05:96`, `05:380`, `05:582` | **25** — from **Postiz's production error map**, Meta error `2207042` → *"You have reached the maximum of 25 posts per day"* | **`[V]` — actually read from source** |
| `02:265`, `02:1084` | Vista **enforces 50** posts/24h per IG profile | `[DOC]` |

The only `[V]`-graded figure in the set says 25. `blueprint-b:1511` hardcodes
*"IG 100/24h queryable"* into the calendar's capacity-warning feature (*"these 40
videos exceed your quota"*). If the cap is 25, that feature ships wrong on day one and
the scheduler's admission control is 4× too permissive.

### 4.4 X Basic tier — $100 vs $200

`12 §3.2` lays out four GitHub sources that disagree ($100 in two, $200 in two) and
reconciles by guessing that *"$100 sources are likely stale."* That is a reasonable
guess presented in a table that reads as a finding. `06 §9.2` then states $200 flatly.

---

## 5. The EU AI Act chain — a demonstrated failure mode, then committed

This is the clearest case of an anonymous artifact being laundered into an urgent
action item.

1. **Origin:** `09:65` — the AI Act timeline comes from
   `studio121-develop/ai-act-compliance-skill`, a third party's skill file on GitHub.
2. **Grade:** `09` marks it `[GH]`. `11`'s own legend defines `[GH]` as *"High for
   **what the artifact says**. **The artifact itself may be wrong.**"*
3. **Promotion:** `11 §1.1` finding #6 and `11:133` elevate it to a headline finding —
   *"🚨 **IN FORCE NOW**"*, €15M/3% turnover penalties — and blocker-list item 10,
   marked **"Urgent," 2–4 weeks**.
4. **The corpus proved this exact failure mode two sections later.** `11 §7.2` catches
   a different GitHub legal artifact listing **Colorado's CPA as "effective 2021"**
   (actual: 1 Jul 2023) and **Oregon's OCPA as "effective 2020"** (actual: 1 Jul 2024),
   and omitting Rhode Island entirely. The corpus documented that GitHub legal
   artifacts contain systematic date errors — and then based an urgent regulatory work
   item on one.
5. **Worse — a false verification claim.** `11:462` states the timeline was *"checked
   against EUR-Lex 2026-07-20."* **It was not.** `09 §0.1` says every non-GitHub host
   returned `EGRESS_BLOCKED`. What was actually established is that an anonymous repo
   *asserts* it checked EUR-Lex on that date. A second-hand claim of verification is
   being reported as verification, in the one file whose subject matter is legal
   compliance.

The specific fact at issue — whether the Digital Omnibus postponed Art. 50 — is
precisely the kind of fast-moving legislative question where a May-2026 cutoff plus one
unattributed source is worth nothing. `09:1751` and `09:2020` do flag that the
Omnibus's final OJ reference was unconfirmed; `11` drops that caveat when promoting the
finding.

**`11 §7.2` itself, by contrast, is the best epistemics in the corpus** — it names its
source, catches its errors, corrects them, marks the corrections `[K]`, and flags a
contested cell (Texas universal opt-out) as needing verification. That is the standard
the rest of the corpus should have been held to.

---

## 6. Research angles never run

### 6.1 Prompt injection and adversarial input — ZERO mentions in 30,738 lines

**This is the largest single omission and it is disqualifying for the stated product.**

`grep -ri "prompt injection|indirect injection|jailbreak|adversarial input"` across the
entire corpus returns **nothing**.

The corpus proposes, across the three blueprints:

- an **MCP server with write access**, shipped in `blueprint-a` **Phase 1**;
- an **agentic autonomy kernel** with escalating autonomy modes (`blueprint-a` D8,
  `blueprint-c`'s entire thesis);
- **AI-drafted replies** to inbox DMs, comments and reviews (`01 §15`, `02 §7.5`);
- **RAG over customer knowledge** (`01 §19.4`);
- **listening ingest** feeding AI sentiment/entity/topic pipelines (`12 §19–21`).

Every one of those ingests **attacker-controlled text** — a DM, a public comment, a
review, a scraped mention — into a model context that can trigger a write to a brand's
public social account. That is the textbook indirect-prompt-injection surface, and it
is the highest-consequence version of it: the payoff for a successful injection is
posting arbitrary content to a Fortune 500 brand's verified channel.

`blueprint-c` centres its whole architecture on an **Action Gate** that decides
*whether an action is permitted*. Nothing in any file addresses **how hostile content
enters the request in the first place**. A policy gate evaluating a request whose
*intent* was authored by an attacker will authorize it, because the request is
well-formed and comes from an authenticated agent.

Entirely absent from the corpus:

- indirect injection via inbox content (DM/comment/review body → AI reply draft → send);
- injection via listening ingest into enrichment pipelines;
- RAG corpus poisoning (a customer's uploaded brand-voice knowledge base is
  attacker-reachable if any of it is user-generated);
- **MCP tool poisoning / confused-deputy** — an MCP server holding OAuth tokens for
  every connected network, driven by an LLM reading untrusted content;
- exfiltration via generated post content (tokens, other tenants' data, PII in a caption);
- any injection-specific evaluation, red-team, or regression suite.

`11 §10.1`'s threat model covers credential theft, IDOR/tenant isolation, SSRF and log
leakage. It stops at the boundary of the AI layer.

For a product whose README pitch is *"an agentic AI layer that owns outcomes rather
than tasks,"* shipping without an injection threat model is shipping the vulnerability
as the feature.

### 6.2 Disaster recovery, RPO/RTO, and key-loss — ZERO mentions

No file mentions RPO, RTO, disaster recovery, or business continuity.

This is not a generic gap; it interacts badly with two decisions the corpus calls
irreversible:

- **Per-tenant KEK envelope encryption** (`11 §10.3`, `blueprint-a` D1,
  `blueprint-b` §9.2) is proposed as decision #1 in all three blueprints. There is no
  discussion of **KEK backup, escrow, or cross-region replication**. If a tenant KEK is
  lost or its KMS region is unavailable, **every credential and every encrypted content
  row for that tenant is permanently unreadable and every scheduled post fails.**
  `11 §10.6` proposes **crypto-shredding as the deletion primitive** — i.e. key
  destruction *is* data destruction — which makes accidental key loss indistinguishable
  from a successful deletion. That is a Sev-0 waiting to happen and it is unmodelled.
- **Enterprise procurement**, which `03` establishes as the whole game, asks for RPO/RTO
  in every security questionnaire. `11 §9.1` costs SOC 2 but never states a recovery
  objective.

`blueprint-b:131` commits to a **99.9% publish-success SLO** *"defensible
contractually."* There is no availability SLO, no error budget, and no DR posture
underneath it.

### 6.3 Mobile — one line of architecture for the named differentiator

The corpus establishes that roughly a third of surfaces cannot be auto-published to
(`07 §3`, `08 §3`) and that reminder-publish is a first-class differentiator
(`blueprint-a §12`, `08:953`). Then:

| Blueprint | Mobile decision | Rationale given |
|---|---|---|
| `blueprint-a:1500` | **React Native (Expo)** | *"the reminder-publish handoff needs native share/notification APIs but not a native codebase"* |
| `blueprint-c:1817` | **React Native** + native modules | *"§5 needs deep native integration in a small surface"* |
| `blueprint-b:2414` | **Swift + Kotlin, native** | *"a cross-platform wrapper would put the differentiator behind an abstraction that does not model it"* |

Three blueprints, two opposite conclusions, **zero shared evidence** — because there is
no mobile dossier. Nothing in the corpus researched:

- iOS background-execution and silent-push limits. These surface *only* as a risk in
  `blueprint-b:2763` (*"iOS caps silent push at ~2–3/hour... no app can foreground
  itself or write the clipboard on a schedule"*) and `blueprint-a:461` — asserted from
  recall, never verified, and directly contradicting the "media already on the device
  and clipboard staged at 9:00" experience both documents design around;
- per-target-app share-extension and deep-link behaviour (`07:2916` lists compose deep
  links `snapchat://`, `nextdoor://`, `x.com/intent/post` — all recall, none tested);
- App Store / Play review timelines and rejection risk for a posting-assistant app;
- push delivery reliability, which is the actual SLA for "never drop the slot."

`blueprint-a §16` lists `V11` (mobile handoff timings for Later/Planoly/Plann/Preview/
Buffer on real devices) and `V12` (current deep-link recipes per platform per app
version) as **unverified** — and its roadmap ships **"Reminder v1"** in Phase 1
(weeks 5–16). You cannot ship in Phase 1 a subsystem whose basic feasibility is item 11
on the verification list.

### 6.4 Paid / ads campaign management is a stub

`01 §6.10` correctly identifies that Vista is boost-level only and that *"direct
advertising campaign management is explicitly weak"* — flagging it as a gap. `10`
covers paid *amplification* and creator whitelisting. But **nothing specs the Meta
Marketing API, TikTok Ads API, or LinkedIn Ads campaign objects**: no campaign/adset/ad
hierarchy, no budget or bid management, no audience objects, no creative-to-campaign
lineage, no ad-comment moderation implementation (flagged `UNVERIFIED` and "likely
absent" for Vista at `01:586` and `01:1249`, then never researched for *us*).

`blueprint-a` defers "Paid" to Phase 3 with one line: *"ad account connect, boost
configs, dark posts, paid-vs-organic."*

The root README's promise is *"measurement that closes the loop from post to revenue."*
For most brands the loop *runs through paid*. Paid is not an adjacency here; it is the
loop. It has less specification than Tumblr.

### 6.5 No capacity model, no COGS curve, no storage liability

- `blueprint-b` declares itself *"engineered for millions of connected profiles"* and
  load-tests against *"5,000 publishes/second arriving in one second"* (`:2563`). That
  number is not derived from any traffic model anywhere in the corpus.
- `blueprint-c:1911` is the **only** infra cost estimate (10,000 tenants / 100,000
  profiles / 3M posts per month). `blueprint-a:1557` gives a three-column cost table
  with no stated tenant counts.
- **Nobody costed the storage liability created by decision D5.** `blueprint-a` D5 and
  `blueprint-b` both mandate **daily metric snapshots from connect, retained
  permanently**, because platform retention windows (Pinterest 90d, X 30d, TikTok ~60d)
  destroy the data otherwise. That is correct and it is also an unbounded,
  monotonically growing storage cost per profile per day, forever, plus media masters
  *and* per-network renditions (`blueprint-b:1720`). No growth curve, no per-profile
  COGS, no tiering economics beyond "IA after 30 days."

### 6.6 Two of the three named wedges rest on unexamined competition

`blueprint-a §16` `V2` lists **thirteen** vendors as unverified — SOCi, Rallio, Birdeye
Social, Uberall/MomentFeed, Reputation, Chatmeter, Hearsay, Denim Social, Promoboxx,
Tiger Pistol, Evocalize, BrandMuscle, Ansira — and notes they block *"the multi-location
wedge and every conclusion in `03 §2.2`."* `blueprint-a` then makes the
franchise/multi-location hierarchy a **Phase 2 centerpiece**. `V3` (Zendesk / Front /
Gorgias / Intercom social-channel SLA depth) sits under the coverage/SLA wedge, also
Phase 2.

**The wedges were chosen against a competitive set nobody looked at.** SOCi and Birdeye
in particular are large, funded, and squarely in the multi-location space; "nobody does
this well" is an assertion the corpus explicitly cannot support.

### 6.7 Smaller but real absences

- **Creative layer as competition.** Canva, Adobe Express and Figma appear only as
  integrations. Canva ships scheduling; Adobe Express ships scheduling. They are
  competitors approaching from content creation with vastly better creative tooling and
  distribution. No dossier.
- **Support and on-call economics.** 60+ integrations that break independently and
  without notice implies a support cost and an on-call rotation. `blueprint-a §11` covers
  integration canaries; nothing covers headcount, ticket volume per profile, or the cost
  of the "connection broke, reconnect" support flow that every competitor's reviews
  complain about.
- **Meta Tech Provider vs Business Partner program tiers** are conflated with App Review
  throughout. They are distinct gates with distinct requirements.
- **VPAT / WCAG cost and timeline.** Named a procurement blocker three times
  (`03:296`, `03:1309`, `03:1398`, `11:1331`) and never costed. Alt-text support is
  well covered; the accreditation is not.
- **Pen-test and bug-bounty budget.** `11 §9.1` costs SOC 2; the pen test summary that
  every enterprise questionnaire demands has no line item.
- **UX/design benchmarking** beyond `02 §12`'s onboarding funnel. No competitive teardown
  of the composer or calendar as *interfaces*, which is where this category is actually
  won or lost for SMB self-serve.

---

## 7. Places the research reads confident but is not

### 7.1 "Parity in sixteen weeks" does not survive the corpus's own findings

`blueprint-a §13` and `§17`: parity in 16 weeks, 6–8 people. Phase 0 (weeks 1–4) *files*
the platform applications. Phase 1 (weeks 5–16) *ships against them*: Meta family +
Pinterest + YouTube publishing, full composer, media library, analytics with daily
snapshots, migration tooling, Meta inbox, governance v1, **Reminder v1 with a mobile
app**, a public REST API **and** an MCP server.

The same corpus says:

| Gate | Corpus estimate |
|---|---|
| Meta App Review + Business Verification + annual DPA | weeks–months (`06 §10`) |
| TikTok content-posting audit | *"2–8 weeks, and it audits **our UI**"* (`blueprint-b:2646`) |
| LinkedIn CMA | *"the most opaque gate in the set with thin rejection feedback"* (`blueprint-b:2752`) |
| YouTube OAuth verification | 2–8 weeks; **6–16 weeks** end-to-end (`05:1773`, `06:622`) |
| YouTube quota extension | *"longer and often denied"* (`06:622`), *"frequently denied"* (`blueprint-b:2752`) |

There is **no rejection branch, no resubmission cycle budget**, and no acknowledgement
that several of these gates require a working product as evidence for the application —
i.e. they are *serialized* with the build, not parallel to it. `blueprint-b` at least
names a **vendor-scaffolding fallback** (publish through an API-first vendor behind our
own adapter interface) so a delayed approval delays a network rather than the product.
`blueprint-a` has no such fallback and is the one promising 16 weeks.

Relatedly, **"75 parity items" (`blueprint-b §0.1`) is asserted and never enumerated as
a costed list.** No document connects the item count to the timeline.

### 7.2 Vista's pricing table is presented as confirmed by arithmetic that confirms nothing

`01 §4.1` argues the plan table is right because $79 × 12 × 0.8 = $758.40 ✓,
$149 × 12 × 0.8 = $1,430.40 ✓, $379 × 12 × 0.8 = $3,638.40 ✓ — *"the maths is internally
consistent and this is the strongest signal that the table above is right"* — and
concludes *"**This confirms Scale is $379/mo, not $349/mo**."*

It confirms no such thing. It demonstrates that whoever computed the annual figures
derived them from the monthly ones at a 20% discount. If the source blogs copy each
other (which `01 §0.2` Tier C explicitly warns they do), the arithmetic is consistent
*within a single upstream error*. This is self-consistency masquerading as
corroboration, in the one section the file flags as **"HIGHEST-UNCERTAINTY."** `01` is
otherwise the most scrupulous file in the corpus, which is what makes the slip worth
naming.

### 7.3 LiteLLM metadata is read as a deprecation calendar

`09 §7` builds the model-economics section on LiteLLM's
`model_prices_and_context_window.json` — a genuinely good call for **prices**. It then
reads the `deprecation_date` field as authoritative:

- *"**Veo 2** — Deprecation date `2026-06-30` — already past. **Do not build on it.**"*
- *"**Sora 2** — Listed `deprecation_date: 2026-09-24` — **six weeks away.**"*

LiteLLM's `deprecation_date` values are community-contributed, frequently placeholder,
and are not vendor commitments. Deriving a *"do not build on it"* instruction and a
six-week planning horizon for a headline capability from that field over-reads the
artifact. The file's own `[GH]` legend anticipates this and the section ignores it.
The prices in that file are strong evidence; the dates are not evidence at all.

Similarly, `09` lists model IDs (e.g. `gpt-5.4-nano`) from the JSON without
distinguishing *"present in LiteLLM's file"* from *"GA and available to us at that
price."*

### 7.4 `V-neg` is sound reasoning applied past its warrant

`08`'s **`V-neg`** grade — *"absence established from a complete official artifact"*,
e.g. *"LINE's own OpenAPI repo contains no VOOM endpoint"* — is the most
methodologically interesting construct in the corpus and is basically right. But it is
then used to establish **permanent architectural assumptions**. Official SDK and spec
repos routinely lag launched APIs by months, and partner-gated endpoints are frequently
absent from public specs by design. `V-neg` warrants *"no public, self-serve API as of
the repo's last commit"*; it does not warrant *"structurally impossible."*

---

## 8. Where the blueprints contradict each other, unresolved

No synthesis exists, so these stand as three mutually exclusive plans:

| Dimension | A | B | C |
|---|---|---|---|
| Topology | Modular monolith, one Postgres/region | Event-driven, multi-region, warehouse-native | Action-Gate-centred, adapter fabric |
| Language | TypeScript everywhere | Go (dispatcher/publish/ingest) + TS (long-tail adapters) | TS + Go for media only |
| Mobile | React Native (Expo) | Native Swift + Kotlin | React Native + native modules |
| Centre of gravity | Scheduler | Scale/residency substrate | Action Gate; scheduler is a caller |
| Timeline | Parity in 16 weeks, 6–8 people | Phased, no headline parity claim | — |

Each is internally coherent and well argued. The repo has already committed to
TypeScript with a `packages/adapters` capability model — which is A/C-shaped and
forecloses B — **by commit, not by decision**. On the positive side, the committed
`capabilities.ts` correctly models limits as *data* with no hardcoded values, so none of
the disputed numbers in §4 have been baked in yet. That window will close quickly.

---

## 9. What to do, in priority order

1. **Write `00-MASTER-STRATEGY.md`, or delete the reference to it.** Pick a blueprint,
   state the criteria, and reconcile the three. Until then the corpus has no conclusion.
2. **Run a prompt-injection threat model before any agent, MCP, or AI-reply surface is
   designed.** This is the one gap that is both total and product-defining. It needs its
   own dossier: injection paths through inbox/listening/RAG, MCP confused-deputy,
   exfiltration via generated content, and an eval/red-team plan. `blueprint-c`'s Action
   Gate must be extended to cover *content provenance*, not just action authorization.
3. **Re-run the platform-API layer with actual fetches.** Files 06, 07, 10 and the
   platform half of 08 are recall. They are the "integration bible" and the thing the
   root README calls the real bottleneck. Highest-blast-radius items first:
   - X pricing regime (§4.2) — decides whether X ships at all below the top tier;
   - YouTube `videos.insert` quota (§4.1) — decides whether YouTube is Phase 1 or Phase 3;
   - Instagram publishing cap (§4.3) — decides scheduler admission control;
   - Meta / TikTok / LinkedIn / YouTube approval timelines and rejection rates (§7.1) —
     decides the entire roadmap.
4. **Re-verify every regulatory date against a primary source.** Nothing in `11` or
   `09 §8` should reach a customer contract, a questionnaire, or a board paper on the
   strength of an anonymous GitHub artifact — least of all the AI Act Art. 50 item
   currently marked "Urgent."
5. **Commission the missing dossiers:** mobile/reminder-publish feasibility (before
   committing RN vs native), paid/ads campaign management, DR-RPO-RTO and key-escrow
   design, capacity/COGS/storage-growth model, and the thirteen multi-location vendors
   in `blueprint-a V2`.
6. **Re-tag the blueprints.** Every number inherited from files 04, 06, 07, 08, 10
   should carry its `C3` forward. If that makes the blueprints unreadable, that is the
   correct signal about how much of the architecture rests on recall.
7. **Freeze the parity checklist as a costed, enumerated list** before anyone repeats
   "parity in sixteen weeks."

---

## 10. What is genuinely good, and should not be re-done

Stated so this critique is not read as a blanket dismissal:

- **`05-competitors-dev-oss`** is the strongest file in the corpus. Reading Postiz's
  production provider source for concurrency caps, retry logic, error-code maps and
  real per-network limits is better evidence about how these APIs behave under load
  than any vendor documentation would have given. `[V]` there means what it says.
- **`11 §7.2`** (US state privacy patchwork) is a model of correct method: named source,
  errors caught and corrected, corrections re-graded, contested cells flagged, and an
  engineering conclusion (single high-water-mark posture) that makes the legal
  complexity irrelevant to the code.
- **`09`'s use of LiteLLM for prices** and **`08`'s use of official OpenAPI specs and
  npm ecosystem presence** as proxies for "does a real API exist" are both creative
  responses to a hard constraint and produced better data than a marketing page would.
- **The `C1`/`C2`/`C3` split is the right abstraction.** `06`'s framing — *"architect
  from `C1`; do not hardcode `C2`/`C3`"* — is exactly correct, and the committed
  `capabilities.ts` honours it. The failure is that the blueprints stopped applying it,
  not that it was wrong.
- **The non-retrofittable-decision framing** (per-tenant KEKs, `(wall_clock, iana_zone)`
  time storage, tree hierarchy, capability-as-data, residency seam, metric provenance
  columns, daily snapshots from connect) is the most valuable output of the entire pass
  and is well argued in all three blueprints independently — which is itself
  corroboration.
