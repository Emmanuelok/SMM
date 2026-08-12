# 26 — The Content Production & Repurposing Layer

**Audit date:** 12 August 2026
**Scope:** long-form → short-form clipping, AI video editors, synthetic media (avatars/voice/music),
AI social-content generators, newsletter↔social loops, podcast hosting, captioning/dubbing,
and the AI-disclosure/provenance regime that governs all of it.
**Question this file answers:** *what do we embed, what do we integrate, what do we rebuild, and
what does it cost per asset?*

---

## 0. Read this first — research constraints and evidence grading

### 0.1 Constraint disclosure (do not skip)

This file was produced under the **same degraded network environment** as `09-ai-frontier.md`,
and in one respect a worse one.

| Capability | Status this session |
|---|---|
| `WebSearch` | **Exhausted before this file began.** The session's 200-call budget was fully consumed (200/200). Zero searches were available. |
| `WebFetch` / `curl` to vendor sites | **Blocked by organisation egress policy.** Every commercial domain tested returned `403` at the CONNECT stage: `opus.pro`, `vizard.ai`, `klap.app`, `submagic.co`, `munch.io`, `2short.ai`, `descript.com`, `riverside.fm`, `castmagic.io`, `repurpose.io`, `vidyo.ai`, `chopcast.io`, `wisecut.video`, `kapwing.com`, `veed.io`, `capcut.com`, `canva.com`, `heygen.com`, `synthesia.io`, `arcads.ai`, `creatify.ai`, `elevenlabs.io`, `suno.com`, `podcastle.ai`, `transistor.fm`, `beehiiv.com`, `substack.com`, `predis.ai`, `ocoya.com`, `lately.ai`, `flick.social`, `copy.ai`, `jasper.ai`, `c2pa.org`. Also blocked: `google.com`, `wikipedia.org`, `developer.mozilla.org`. |
| **G2 / Capterra / Trustpilot / Reddit / X** | **Blocked.** No first-party user-review source was reachable. See §13 for how criticism is sourced instead, and what that costs in confidence. |
| `github.com` / `raw.githubusercontent.com` | **Reachable.** This was the only live research channel. |
| GitHub REST search (via MCP) | **Reachable.** |
| Prior research corpus (`01`–`12`, `20`–`25`) | **Available**, gathered when full web access existed. |

**What this means.** Every hard number below is either (a) pulled this session from a
machine-readable artifact hosted on GitHub, (b) arithmetic I performed on such data, (c) carried
from this repository's earlier files, or (d) model knowledge with a **May 2026 cutoff**, explicitly
flagged. **Nothing is invented.** Where a fact mattered and could not be established, it says
`UNVERIFIED` rather than being smoothed over.

**The single most important consequence:** the pure-play clipping vendors that the brief centres on
— **Opus Clip, Vizard, Klap, Submagic, Munch, 2Short, Vidyo, Chopcast, Wisecut** — publish nothing
machine-readable on GitHub and their own sites were unreachable. **Their exact 2026 pricing,
minute caps and API surfaces are `UNVERIFIED` in this file and must be re-checked before any of it
becomes load-bearing.** What I *can* do — and did — is verify the layer underneath them
(the models, the OSS reference implementations, the orchestratable editors) precisely enough to
show that the clipping layer is a thin, replicable wrapper. That turns out to be the finding that
matters.

### 0.2 Evidence grades

| Grade | Meaning |
|---|---|
| `[GH]` | Verified this session from a GitHub-hosted artifact (OpenAPI spec, API-Commons plans/rate-limit file, SDK source, project README). Highest confidence. |
| `[CALC]` | Arithmetic I performed on `[GH]` data. Inputs cited; arithmetic is mine. |
| `[CORPUS]` | Carried from `01`–`12`/`20`–`25` in this directory, gathered with full web access. Inherits their grading. |
| `[3P]` | Independent third-party profile (API Evangelist), assembled from public vendor material. Not vendor-authored. Several such files self-declare `reconciled: false` — noted inline where so. |
| `[3P-LOW]` | Third-party material that is **promotional or affiliate-driven**. Reported only where nothing better exists, always with the conflict named. |
| `[K]` | Model knowledge, training cutoff **May 2026**. Not re-verified. |
| `UNVERIFIED` | Could not be established. Stated as unknown. |

### 0.3 Primary artifacts pulled this session

| Artifact | What it gave |
|---|---|
| `api-evangelist/descript` → `openapi/descript-api-endpoints-api-openapi.yml` (87 KB), `plans/`, `rate-limits/` | **The complete Descript Platform API surface**, plan pricing, rate-limit and credit semantics. The highest-value find in this file. |
| `api-evangelist/riverside` → `apis.yml` + 4 OpenAPI files | Riverside Business API endpoints, plan gating |
| `api-evangelist/creatify` → `plans/`, `openapi/creatify-ai-shorts-api-openapi.yml` | Creatify credit rates and the AI Shorts endpoint |
| `api-evangelist/elevenlabs` → `apis.yml` + `openapi/elevenlabs-dubbing-api-openapi.yml`, `-speech-to-text-` | 22 API families; exact dubbing request parameters incl. the `watermark` flag |
| `api-evangelist/heygen`, `synthesia` → `apis.yml` + OpenAPI sets | Avatar/translation/dubbing endpoint groups and plan gating |
| `api-evangelist/canva` → `apis.yml` + `openapi/canva-autofills-`, `-exports-` | Four distinct Canva API surfaces and the async autofill/export job model |
| `api-evangelist/beehiiv`, `convertkit`, `transistor`, `buzzsprout` → `plans/`, `rate-limits/` | Newsletter and podcast-host pricing and **exact rate limits** |
| `api-evangelist/suno`, `soundraw`, `podcastle`, `flick`, `jasper`, `substack` | API existence/absence, and one significant identity correction (§6.4) |
| `artbyjazi/autoclip` → `README.md` | A current, honest, end-to-end OSS clipping pipeline with named failure modes |
| `renezander030/capcut-cli`, `Hommy-master/capcut-mate` → `README.md` | The CapCut integration reality, and its security history |
| `contentauth/c2pa-rs` → `README.md` | C2PA spec version and library state |
| GitHub repo search (clipping / CapCut / repurposing) | The OSS competitive set and the absence of official APIs for most SaaS clippers |

---

## 1. Executive summary

### 1.1 Twelve findings

1. **Descript is the only major editor in this brief with a real, general-purpose, orchestratable
   API — and it will do long-form → short-form from a natural-language prompt.** `POST /jobs/agent`
   accepts `"create a 30-second highlight reel"` as a documented use case, runs async, and calls a
   webhook. `[GH]` §4.1. This is the single most actionable integration in the file.

2. **…but Descript's API cannot return captions, subtitles, SRT/VTT, or a vertical crop.** The
   87 KB OpenAPI spec contains **zero** occurrences of `caption`, `subtitle`, `srt`, `vtt` or
   `aspect`. `[GH]` It publishes at 480p→4K in whatever aspect the composition already is. The two
   things that define a social short — burned captions and a 9:16 reframe — are exactly what the
   API does not expose. §4.1.4.

3. **The clipping pipeline is a commodity and costs under a dollar per source hour.** Transcribe
   (Groq `whisper-large-v3-turbo`, **$0.040/hour**) + LLM highlight ranking (Gemini 2.5 Flash-Lite,
   **$0.0061**) + self-hosted ffmpeg/OpenCV render ≈ **$0.15–$0.60 for ten clips from a
   one-hour video.** `[CORPUS]` `[CALC]` Incumbents charge $9–$49/month with minute caps against
   that cost base. §2, §10.

4. **At least six credible open-source implementations of the whole loop exist and are actively
   maintained as of 12 Aug 2026** — `AI-Youtube-Shorts-Generator` (★4,573), `supoclip` (★1,053),
   `ClippedAI` (★188), `Sharetape` (★118), `autoclip` (★65), `miscoshorts-ai` (★28). `[GH]`
   `autoclip` documents the full architecture including the two non-obvious correctness decisions
   (word-index highlight selection; never interpolating a crop path across a cut). §2.2.

5. **CapCut has no sanctioned public API.** The entire integration ecosystem is unofficial and
   works by **reading and writing the local `draft_content.json` draft store** — `capcut-mate`
   (★1,558), `capcut-cli` (★333), `CapCutAPI-Complete` (★93) — plus reverse-engineered TTS
   (★259, ★108) and Dreamina image endpoints (★106, ★48). `[GH]` `capcut-cli` states plainly it is
   "**not affiliated with, sponsored by, or endorsed by** CapCut, JianYing, or ByteDance Ltd."
   **Do not build a product dependency on this.** §4.5.

6. **Ingest is now the hardest *unsolved* step, and it got harder in 2026.** `autoclip`'s
   troubleshooting section records that "**As of 2026, YouTube blocks most anonymous downloads and
   proof-of-origin tokens no longer clear it**" — the workaround is signed-in browser cookies.
   `[GH]` Any "paste a YouTube URL" feature is built on sand. Direct file upload is the only
   durable ingest path. §2.3.

7. **The publish step is the moat, and it runs the other way.** OSS clippers cannot publish:
   `autoclip` lists "no direct posting to TikTok/Instagram/YouTube — **their APIs are
   approval-gated**" as a deliberate non-goal. `[GH]` `capcut-cli` says "the publish click stays
   human." `[GH]` A scheduler that has already passed **TikTok's Content Posting audit**, **Meta
   App Review** and **YouTube's compliance audit** `[CORPUS]` owns the one part of this pipeline
   that money cannot shortcut. §2.4.

8. **Credit pricing across this layer clusters at $0.03–$0.20 per credit, and the honest unit is
   one cent.** Descript implies **$0.03–$0.04/AI-credit** `[CALC]`; Creatify implies
   **$0.15–$0.33/credit**, i.e. **$1.49–$3.30 per minute of avatar video** depending on tier
   `[CALC]`. Against underlying cost, that is a 3–5× markup — which is defensible, and is exactly
   the structure `09-ai-frontier.md` §7.7 recommends. §10.

9. **Descript's API credit consumption is unpredictable, and that is disqualifying for resale.**
   The API "draws from the same media-minutes and AI-credit pool as in-app editing" and
   "**exact API-vs-app credit attribution is not separately published**" (`reconciled: false`).
   `[GH]` You cannot meter a tenant on a cost you cannot predict. Integrate it against the
   customer's own account; do not resell it. §4.1.6, §9.

10. **Dubbing and translation are solved, cheap, and shipped by nobody in our category.**
    ElevenLabs `POST /v1/dubbing` takes a file or URL, source/target language, `num_speakers` for
    diarization, and a `watermark` boolean `[GH]`. Synthesia has `POST /dubbing/projects` with
    per-locale fan-out `[GH]`. HeyGen has `POST /v2/video_translate` with a supported-languages
    endpoint `[GH]`. Localising one 30-second video into 20 languages costs **under $30**
    `[CORPUS]` `[CALC]`. **No social media management tool in this corpus offers per-market
    localisation as a publishing option.** §11.

11. **Transcription is so cheap it should be unconditional.** A full hour costs **$0.040**
    `[CORPUS]`. Any product that does not transcribe every uploaded video — for captions, search,
    repurposing, accessibility and brand-safety — is discarding the cheapest high-value signal in
    the stack. §11.1.

12. **AI-disclosure is now a build requirement, not a differentiator.** Meta's "AI info" label
    auto-applies on detected C2PA/IPTC metadata; TikTok reads Content Credentials on upload;
    YouTube requires an "altered or synthetic content" declaration `[K]`. C2PA is at **spec 2.2**
    with a mature Rust/C/Node/Python SDK `[GH]`. The provenance field set must exist on every asset
    at generation time — **no vendor in this corpus does this.** §12.

### 1.2 The strategic read, in one paragraph

The standalone clipping category (Opus Clip, Vizard, Klap, Submagic, Munch, 2Short) sells a
$9–$49/month wrapper around a pipeline that costs cents per hour to run and has six working
open-source implementations. Its defensibility is not technology; it is (a) caption-style craft,
(b) reframe quality on hard footage, and (c) the fact that no scheduler has bothered. Meanwhile
OpusClip has added **multi-platform scheduling** `[3P]` — it is walking into our category from the
other direction, while carrying none of the platform API approvals we would already hold. The
correct move is not to buy or resell a clipper. It is to **rebuild the clipping pipeline on model
APIs** (§2, §10), **integrate Descript and Riverside for customers who already live there** (§4.1,
§4.2), **embed Creatify/HeyGen/ElevenLabs for synthetic media and dubbing** (§5, §11), and **win on
the two things none of them have: the approved publishing surface and the disclosure/provenance
record** (§2.4, §12).

---

## 2. The long-form → short-form pipeline, end to end

### 2.1 The canonical pipeline

Both current open-source reference implementations converge on the same seven stages. This is the
architecture, stated once, and everything in §3–§5 is a vendor's partial implementation of it.

```
ingest → prepare → transcribe → highlights → reframe → captions → export → [publish]
```

`autoclip` (★65, updated 12 Aug 2026) `[GH]` and `AI-Youtube-Shorts-Generator` (★4,573)
`[CORPUS]` `[GH]` agree stage-for-stage. `autoclip` adds one operational refinement worth copying:
**each stage writes artifacts to `~/.autoclip/work/{job_id}/`, so a retry resumes at the stage that
failed rather than starting over.** `[GH]` At video-render latencies (§2.5) that is the difference
between a 3-minute retry and a 30-minute one.

### 2.2 Stage by stage — what is automated, what is still manual

| # | Stage | State of the art | Cost | Still manual? |
|---|---|---|---|---|
| 1 | **Ingest** | `yt-dlp` for URLs; direct file upload; or pull from a recording platform's API (Riverside `[GH]`, Descript `[GH]`) | ~$0 | **YES — materially.** YouTube URL ingest is broken-by-default in 2026 (§2.3). Rights checking is entirely manual. |
| 2 | **Prepare** | Demux, normalise loudness, probe with `ffprobe`. `autoclip` targets **AAC at −14 LUFS** `[GH]` | ~$0 | No |
| 3 | **Transcribe** | `faster-whisper` / WhisperX locally, or Groq `whisper-large-v3-turbo` hosted. Word-level timestamps are mandatory downstream | **$0.040/hour** `[CORPUS]` | No |
| 3b | **Diarize** | WhisperX + `pyannote`. Required to reframe to the *speaking* face | included | No, but see §2.6 — gated model licences |
| 4 | **Highlight ranking** | LLM over the transcript against an explicit virality rubric (hooks, emotional peaks, opinion bombs, revelation, conflict, quotable lines, story peaks, practical value) `[CORPUS]`; returns score + hook line + reason | **$0.006–$0.065/hour** depending on model `[CORPUS]` | **Partly — quality is unresolved.** See §2.7. |
| 5 | **Reframe** | Shot detection, then face/speaker tracking with motion smoothing; MediaPipe or OpenCV | ~$0 (CPU/GPU time) | **Partly.** `autoclip`'s author explicitly has **not** verified the reframe acceptance bar (§2.7). |
| 6 | **Captions** | Burned in via ffmpeg **`libass`**; styles from word-level timings | ~$0 | No — but style is craft, and craft is the incumbents' actual moat |
| 7 | **Export** | ffmpeg; `autoclip` ships **1080×1920 h264/yuv420p** `[GH]` | ~$0 | No |
| 8 | **Publish** | Platform APIs | ~$0 | **YES — and gated by audits, not code.** §2.4 |
| 9 | **Disclosure** | AI-label flags per platform; C2PA signing | ~$0 | **YES — universally unbuilt.** §12 |

**Read across that table: of nine stages, five are fully solved and near-free. The four that are
not — ingest rights, highlight quality, reframe quality, and publish/disclosure — are precisely
the four a social media management tool is *better* positioned to solve than a standalone clipper**,
because three of them are about accounts, approvals and records rather than about video.

### 2.3 The ingest problem — the stale assumption everyone still ships

`autoclip`'s troubleshooting section, updated this month, records the failure verbatim `[GH]`:

> **"YouTube downloads fail with a bot check.** As of 2026, YouTube blocks most anonymous downloads
> and proof-of-origin tokens no longer clear it. Set **Settings → Ingest → cookies from browser** to
> a browser you're signed into, and **close that browser** first — it locks its cookie database
> while running. Uploading a file always works and needs none of this."

It also ships a dedicated `autoclip update-ytdlp` command "to update yt-dlp after a YouTube
change" `[GH]` — i.e. the maintainer treats ingest breakage as a recurring operational event, not
an incident.

**Three consequences for us:**

1. **"Paste a YouTube link" is not a feature we should build as a primary path.** It will break, it
   will break without notice, and the fix requires end-user credentials we should not want to hold.
2. **Direct upload and first-party API pulls are the durable ingest paths.** Riverside
   (`GET /api/v1/recordings/{id}/files/{file_id}/download`) `[GH]` and Descript
   (`POST /jobs/import/project_media`) `[GH]` both give clean, authorised media access. So does a
   customer's own YouTube channel via OAuth — a very different thing from anonymous scraping.
3. **Rights checking is 100% manual across the entire category.** `autoclip` handles this with a
   legal notice ("Only download content you own or have the rights to process. AutoClip contains no
   workarounds for DRM or paywalled content and never will" `[GH]`). No vendor in this file
   automates it. For an agency tool this is a real product gap — an asset provenance/rights record
   would be genuinely novel (§12.4).

### 2.4 The publish problem — and why it is our moat

Both OSS projects stop at the file boundary, and both say why.

`autoclip`, under **Non-goals** `[GH]`:
> "**No direct posting** to TikTok/Instagram/YouTube. Their APIs are approval-gated; AutoClip
> exports files."

`capcut-cli`, in its quickstart `[GH]`:
> "Every short-video platform forbids automated upload, so the publish click stays human."

The second statement is **wrong in detail and right in effect**, and the distinction is worth
being precise about, because it is our entire commercial position. From `[CORPUS]`
(`06-platform-apis-tier1.md`):

| Platform | Publish path exists? | The actual gate |
|---|---|---|
| **TikTok** | Yes — `video.publish` = direct post; `video.upload` = send-to-inbox | **Content Posting API audit.** Until passed, **every post is forced `SELF_ONLY` (private)**. The audit reviews **our product's UI** against UX guidelines. **2–8 weeks.** |
| **YouTube** | Yes — `videos.insert` | **Quota.** 10,000 units/day default; `videos.insert` costs **1,600 units** → **6 uploads/day**. Quota extension requires a separate audited request, "longer and often denied". Plus an **annual YouTube API Services compliance audit**. |
| **Meta (IG/FB)** | Yes | **App Review + Business Verification** |
| **LinkedIn** | Yes | **Community Management API** approval |

So: automated upload is not forbidden — it is **audited**. That is a far better fact for us. Audits
are a fixed cost paid once, they take calendar time that cannot be compressed by spending money, and
they are exactly what a clipping startup or an OSS project will not do. **A clip is worthless until
it is posted. We own the posting.**

Note also the quota arithmetic: **6 YouTube uploads/day on default quota** `[CORPUS]`. A product
that promises "10 clips from every podcast, auto-posted to Shorts" collides with this on day one.
`captions.insert` costs a further 400 units. Any roadmap that assumes bulk YouTube publishing must
start the quota-extension request immediately, and must not promise the capability before it lands.

### 2.5 Latency budget

From `[CORPUS]` §7.5, with the clipping line item being the relevant one:

| Operation | Realistic p50 |
|---|---|
| Transcription, 60 min audio (Groq, batch) | ~1–3 min |
| **Full long→short pipeline, 60 min source, 10 clips** | **10–30 min** |
| Avatar video, 30 s | 2–8 min |
| Lipsync/dub, 30 s | 1–5 min |

**Everything here is async with webhooks.** Descript, Synthesia, HeyGen, Canva, ElevenLabs and
Creatify all expose an async job model `[GH]` — Descript and Synthesia with explicit
`callback_url`/webhook delivery. Any UI that blocks on these is broken by construction.

### 2.6 Non-obvious build constraints (all `[GH]`, all from `autoclip`)

These are the things that will cost a week each if discovered late:

- **Python 3.11 or 3.12 — not 3.13.** MediaPipe publishes no 3.13 wheels and the reframe stage
  needs it.
- **ffmpeg must be a *full* build with `libass` and `libx264`.** On macOS `brew install ffmpeg` is a
  reduced build with no `libass`; you need `ffmpeg-full`. On Windows, `Gyan.FFmpeg`, not
  `Gyan.FFmpeg.Essentials`. **Symptom: captions silently fail to burn, ffmpeg reports
  "No such filter: ass".** This is the single most common failure in the category.
- **Speaker diarization pulls PyTorch and requires a HuggingFace token plus acceptance of the
  gated `pyannote` model licences.** That is a licence-acceptance step a hosted product must handle
  at the org level, not per-user.
- **GPU encoding lies.** A build can advertise `h264_nvenc` and still be unusable if the driver is
  older than the NVENC API it was compiled against. Probe and fall back to CPU.
- **Fonts must be bundled** (SIL OFL) so nothing is fetched at render time.

### 2.7 The two quality problems nobody has solved

`autoclip`'s "What has and hasn't been verified" section is the most intellectually honest artifact
found this session, and it names both open problems `[GH]`:

> **"Hasn't been [verified]:** the §6.4 reframe acceptance bar — **no visible jitter, no cut-off
> faces, speaker on screen ≥95% of speaking time** — against a fixed three-video golden set. The
> mechanics have unit coverage, but 'looks right on footage I picked' isn't the bar."
>
> "Also unverified: **whether the clip *picks* are good.** That's a judgement call about your
> material and your model, and no test settles it."

That is the honest statement of where the incumbents' value actually sits. Two design decisions from
the same project are the state of the art in mitigating them, and both should be copied verbatim:

1. **"Highlight detection returns word indices, not timestamps.** Models are unreliable at
   arithmetic and completely reliable at copying a number they can see. Timing is looked up from
   measured word timings afterwards." `[GH]`
2. **"Crop paths never interpolate across a cut.** Shots are detected first and framed
   independently. **Panning through an edit is the most obvious sign of an auto-reframed video.**"
   `[GH]`

**Note the reframe acceptance bar as a specification** — "no visible jitter, no cut-off faces,
speaker on screen ≥95% of speaking time, measured against a fixed golden set." That is a testable
quality gate, and shipping against it is a defensible claim no competitor currently makes.

---

## 3. Vendor audit — the pure-play clipping layer

### 3.1 Verification status, stated up front

**All nine vendors in this section have `UNVERIFIED` 2026 pricing and API surfaces.** Their sites
were unreachable (§0.1) and none publishes machine-readable artifacts on GitHub. What follows is
everything that *could* be established, graded honestly. **Do not put any number from this section
into a pricing model, a pitch deck or a comparison page without re-checking it.**

### 3.2 What is actually verified about OpusClip

The one `[GH]` datum, from an independent API profile `[CORPUS]` `[3P]`:

- **OpusClip / Opusclip Inc.**, Mountain View, **backed by SoftBank Vision Fund**; a second profile
  records DCM Ventures and the `opus.pro` domain. `[GH]`
- Claimed scale: **16M+ creators and businesses.** `[3P]` — vendor-stated, relayed.
- Product surface: long→short clipping with **animated captions, AI reframing, virality scoring,
  AI B-roll, and multi-platform scheduling.** `[3P]`
- **A developer API exists**, described as letting developers "submit a source video by URL or
  upload, create a clipping project, tune curation/import/render preferences, apply brand
  templates, retrieve exportable clips and transcripts." **MCP** appears in its topic tags. `[3P]`
- **Endpoint paths, authentication, rate limits and pricing are `UNVERIFIED`** — both profiles are
  enrichment stubs, not reconciled data. I re-fetched both this session and confirmed they remain
  stubs ("a lead awaiting the enrichment pipeline"). `[GH]`

**The competitive fact that matters:** OpusClip does **multi-platform scheduling**. The clipping
category is entering ours; ours has not entered theirs. `[CORPUS]` identified long→short as "the
largest unclaimed adjacency" in the SMB tier — it is now also a two-sided competitive risk.

### 3.3 The rest of the field — what is knowable

| Vendor | Positioning `[K]` | API `[GH]`/`[K]` | Verification |
|---|---|---|---|
| **Vizard** | Clipper positioned closer to an **editor** — drag-and-drop layout changes after the AI cut | No public API artifact found on GitHub. `[K]` believes an API exists for higher tiers | Pricing/API **UNVERIFIED** |
| **Klap** | Minimal clipper; simple pipeline | `[K]`: an API is offered (`api.klap.app`). **No GitHub artifact.** | **UNVERIFIED** |
| **Submagic** | **Caption-first** — style/animation quality is the product, clipping secondary | No public API artifact found | **UNVERIFIED** |
| **Munch (GetMunch)** | Clipping plus **trend/keyword matching and virality scoring**; marketed to agencies | No public API artifact found | **UNVERIFIED**; no `api-evangelist` profile exists |
| **2Short.ai** | YouTube-URL-only clipper, cheapest tier in the group | No public API artifact found | **UNVERIFIED** |
| **Vidyo.ai** | Clipper; named as an incumbent by the OSS projects | No public API artifact found | **UNVERIFIED** |
| **Chopcast** | B2B/agency repurposing service | No public API artifact found; no profile | **UNVERIFIED** |
| **Wisecut** | Auto-editing with **silence removal + auto-music ducking**, a genuinely distinct primitive `[K]` | No public API artifact found; no profile | **UNVERIFIED** |
| **Castmagic** | Podcast → text assets (show notes, timestamps, social posts, newsletters) rather than clips | No public API artifact found; no profile | **UNVERIFIED** |

### 3.4 The third-party pricing table — and why to distrust it

The only comparative pricing artifact reachable this session is
`cipher-vault-hq/awesome-free-opusclip-alternatives` (★15). **It is an SEO/affiliate artifact**: it
ranks a product called "Reelify AI" first, links it four times including a call-to-action, and its
FAQ is written to justify that ranking. It is also **dated 2025**. `[3P-LOW]`

Reported here only because it is the sole comparative source that exists, and because its figures
are broadly consistent with `[K]`:

| Tool | Free plan limit `[3P-LOW]` | Cost/month `[3P-LOW]` | Watermark on free |
|---|---|---|---|
| Vizard AI | 120 min/mo | $30 | Yes |
| OpusClip | 60 min/mo | $29 | Yes |
| GetMunch | none (paid only) | $49 | Yes |
| 2Short.ai | 15 min/mo | $9.90 | Yes |
| Klap | 1 video/mo | $29 | Yes |

**Treat every cell as `UNVERIFIED`.** The one thing worth carrying forward is the *shape*: a
**$9–$49/month band with a 15–120 minute monthly cap and watermarked free tiers.**

### 3.5 The incumbents' weaknesses, as named by their open-source competitors

`AI-Youtube-Shorts-Generator` maintains a comparison table against the named incumbents. Its list of
their weaknesses is the sharpest available statement of the attack surface `[CORPUS]` `[GH]`:

> **$20–$300/month subscriptions · monthly minute caps with overage fees · watermarks on free tiers ·
> black-box highlight algorithms · locked output presets · manual one-by-one upload · SaaS-only,
> with your videos on their servers.**

Five of those seven are business-model choices, not technical limits. Two — **black-box highlight
algorithms** and **your videos on their servers** — are the ones an agency buyer actually raises,
and both are answerable by a tool that already holds the customer's media library under an existing
DPA.

---

## 4. Vendor audit — editors, recorders and design surfaces

### 4.1 Descript — the one orchestratable editor `[GH]`

This is the deepest verification in the file. Everything in §4.1 comes from
`api-evangelist/descript` artifacts pulled this session: an 87 KB OpenAPI file, two smaller specs, a
plans file and a rate-limits file.

#### 4.1.1 The API

| Property | Value `[GH]` |
|---|---|
| Base URL | `https://descriptapi.com/v1` |
| Docs | `https://docs.descriptapi.com/` |
| Status | **Early access, v1.2.** "Endpoints, request shapes, and limits may evolve." |
| Auth | **Bearer token**, created in Settings → API tokens. **Scoped to a single Drive**, inherits that user's permissions on the Drive. |
| Model | **Asynchronous job model.** Long operations return `job_id` immediately. |
| Callbacks | `callback_url` on job creation → Descript POSTs job status on completion/failure, payload identical to `GET /jobs/{job_id}` |
| CLI | `@descript/platform-cli` on npm |

#### 4.1.2 Complete endpoint surface `[GH]`

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/jobs/import/project_media` | Import media and sequences; create compositions; **trigger transcription and background processing** |
| `POST` | `/jobs/agent` | **Agent edit — natural-language editing** |
| `POST` | `/jobs/publish` | Publish a composition → share URL + download URL |
| `GET` | `/jobs` | List jobs |
| `GET` | `/jobs/{job_id}` | Job status |
| `DELETE` | `/jobs/{job_id}` | Cancel job |
| `GET` | `/projects` | List projects |
| `GET` | `/projects/{project_id}` | Project detail |
| `GET` | `/status` | API status |
| `POST` | `/edit_in_descript/schema` | **Create a partner "Import URL"** — the embed handoff |
| `GET` | `/published_projects/{slug}` | Published project metadata |

#### 4.1.3 The agent endpoint — this is the clipping capability

`POST /jobs/agent` — *"Use a background agent to create and edit projects using a natural language
prompt."* `[GH]`

- **Targeting:** exactly one of `project_id` (edit existing) or `project_name` (create new).
  Optional `composition_id` narrows the agent to one composition; it accepts a full UUID **or a
  5-character short ID lifted from a Descript URL** — a thoughtful affordance.
- **Documented use cases, verbatim** `[GH]`:
  - *"create a 30-second video about cooking tips"*
  - *"add studio sound to every clip"*
  - *"remove all filler words from the transcript"*
  - **"create a 30-second highlight reel"**
  - *"remove the section from 1:30 to 2:15"*

**That fourth bullet is long-form → short-form, over HTTP, with a webhook.** Descript is the only
vendor in this brief where I can point at a published specification and say the capability is
callable today.

#### 4.1.4 What the API cannot do — and this is decisive

I searched the full 87 KB spec for the primitives that define a social short `[GH]`:

| Term | Occurrences in the OpenAPI spec |
|---|---|
| `caption` | **0** |
| `subtitle` | **0** |
| `srt` | **0** |
| `vtt` | **0** |
| `aspect` | **0** |
| `transcript` | 5 (all about *triggering* transcription or setting its language) |

`POST /jobs/publish` exposes only:
- `media_type`: `Video` | `Audio`
- `resolution`: `480p` | `720p` | `1080p` | `1440p` | `4K`

**There is no aspect-ratio parameter and no caption/subtitle export.** So the API can find the
highlight and cut it, but it cannot return a 9:16 crop or a burned/side-car caption track. You would
be reframing and captioning yourself anyway — at which point you own steps 5, 6 and 7 of §2.1 and are
paying Descript only for 3 and 4, the two cheapest steps.

*Caveat, stated fairly:* it is possible the agent honours reframing or captioning instructions in
the natural-language prompt without the spec modelling it as a parameter. **That is `UNVERIFIED` and
is the single highest-value experiment to run** the moment an API token is obtainable. It changes
the integration verdict.

#### 4.1.5 Rate limits, quotas and error semantics `[GH]`

| Item | Value |
|---|---|
| Published-project metadata reads | **1,000 requests/hour per user** on `GET /v1/published_projects/{slug}` — the **only published numeric ceiling** |
| Core REST requests | **Not published as fixed RPS/RPM.** Read `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Consumed` and back off |
| Throttled | `429` + `Retry-After` |
| **Out of credits** | **`402`** — "the Drive's media-minute or AI-credit balance is exhausted; **a plan budget, not a transient rate limit**" |
| Async concurrency | "governed by drive plan and AI credit budget" — **no fixed concurrency number** |
| Direct-upload signed URL TTL | **180 minutes** |
| Edit-in-Descript import URL TTL | **180 minutes** |

The `402` semantic is the important one: **credit exhaustion is a hard stop that presents as an HTTP
error mid-pipeline.** Any orchestration must treat 402 as a billing event requiring user action, not
as a retryable failure.

#### 4.1.6 Pricing `[GH]` (`reconciled: false` — see caveat)

| Plan | Annual $/user/mo | Monthly $/user/mo | Transcription min/mo | AI credits/mo | Notable inclusions |
|---|---|---|---|---|---|
| **Free** | $0 | $0 | 60 | **100 one-time** | Watermarked exports, 1 seat, limited Underlord |
| **Hobbyist** | **$16** | $24 | 600 | 400 | 1080p export, multitrack recording, 25-language transcription, **API access (early access)** |
| **Creator** | **$24** | $35 | 1,800 (+35 bonus) | 800 (+500 bonus) | 4K export, full Underlord, Generate video, unlimited stock media, **API** |
| **Business** | **$50** | $65 | 2,400 (+50 bonus) | 1,500 (+1,000 bonus) | Brand Studio, **translate & dub in 30+ languages with proofread**, **custom avatar generation**, priority support with SLA, **API** |
| **Enterprise** | contact sales | — | — | — | SSO/SCIM, custom security review, flexible licensing, **API** |

- **API access is included with paid plans at no additional cost** and starts at **Hobbyist**. `[GH]`
- **Annual billing saves up to 35%** vs monthly. `[GH]`
- **Implied credit price `[CALC]`:** attributing the whole seat price to credits gives
  **$0.040/credit** (Hobbyist), **$0.030/credit** (Creator), **$0.033/credit** (Business). A
  remarkably consistent **~$0.03–$0.04 per AI credit** across tiers.

**The disqualifying caveat, in the vendor profile's own words** `[GH]`:

> "usage draws from the same media-minutes and AI-credit pool as in-app editing.
> **reconciled false because exact API-vs-app credit attribution is not separately published.**"

**You cannot predict what an agent job costs.** There is no published credit price per agent edit,
per publish, or per minute reframed. For a product that must quote a customer a price before running
a job (`09-ai-frontier.md` §7.7, Principle 3), this is fatal to any *resale* model. It is fine for an
*integration* model where the customer's own credits are spent (§9).

#### 4.1.7 The embed path that does exist

`POST /edit_in_descript/schema` creates a **partner Import URL** with a 180-minute TTL `[GH]`. This
is the sanctioned handoff: our composer shows an **"Edit in Descript"** button, mints a URL, and the
user lands in Descript with their media loaded. It costs us nothing, consumes none of our credits,
requires no resale agreement, and returns the user to a tool they already pay for.

**For a v1, this is the correct Descript integration** — one button, one endpoint, no metering
problem. The deeper `/jobs/agent` orchestration is a v2 gated on the §4.1.4 experiment.

### 4.2 Riverside `[GH]`

| Property | Value |
|---|---|
| API | **Riverside Business API** |
| Base URL | `https://platform.riverside.fm` (v1/v2/v3 paths coexist) |
| Auth | API key bearer token |
| **Availability** | **Business plan only** |
| `llms.txt` | `https://docs.riverside.fm/llms.txt` |

**Endpoint surface** `[GH]`:

| Method | Path |
|---|---|
| `GET` | `/api/v2/recordings` — list all recordings |
| `GET` `DELETE` | `/api/v1/recordings/{recording_id}` |
| `GET` | `/api/v1/recordings/{recording_id}/files/{file_id}/download` |
| **`GET`** | **`/api/v1/recordings/{recording_id}/transcription/download`** |
| `GET` | `/api/v3/productions` — list workspace productions |
| `GET` | `/api/v1/exports`, `/api/v1/exports/{export_id}`, `/{export_id}/download`, `DELETE` |

**Verdict: Riverside is a source, not a processor.** The API is read/download-oriented — there is no
clip-generation, editing or render-trigger endpoint in the profiled surface. That is exactly what we
want from it: **authorised, high-quality, already-transcribed source media** delivered straight into
our pipeline at stage 1, bypassing the entire §2.3 ingest problem. Separate-track recordings plus a
downloadable transcript is the ideal input.

**Constraint:** Business plan only, so this is an integration for the upper end of the customer base.

### 4.3 Kapwing

`api-evangelist/kapwing` exists but is **an unenriched VC stub** ("a company surfaced as a portfolio
company of crv… a lead awaiting the enrichment pipeline") `[GH]`. No API surface, no plans, no rate
limits. Site unreachable.

`[K]`: browser-based collaborative video editor with auto-subtitles, resize/reframe presets, and a
template library; historically offered an API for programmatic video generation aimed at
personalised-video use cases. **2026 API state, pricing and limits: `UNVERIFIED`.**

### 4.4 VEED

**No `api-evangelist` profile exists.** No GitHub artifacts. Site unreachable.

`[K]`: browser video editor strong on **auto-subtitles, translation and a large template library**,
positioned mid-market with a subtitle-quality reputation; has historically marketed an API for
subtitle/render automation. **Everything about VEED in 2026 is `UNVERIFIED`**, including whether the
API is still offered.

### 4.5 CapCut — no sanctioned API, and a hazardous unofficial one

This is the clearest negative finding in the file, and it is well-evidenced.

**Official API: none found.** A GitHub search for CapCut API projects returns **47 repositories, of
which zero are operated by ByteDance.** `[GH]` No `api-evangelist` profile exists. `capcut.com` and
`developer.capcut.com` are both unreachable, so **CapCut's commercial terms are `UNVERIFIED`** — flagged
because the brief specifically asks, and because `[K]` recalls CapCut's terms of service being
revised in 2024 with a notably broad content licence that drew public criticism. **Get counsel; do
not rely on my recollection of a ToS.**

**The unofficial ecosystem, verified `[GH]`:**

| Repo | Stars | Updated | What it does |
|---|---|---|---|
| `Hommy-master/capcut-mate` | **1,558** | 2026-08-12 | "Open-source CapCut automation toolkit to **generate & download draft files**"; Coze plugin |
| `renezander030/capcut-cli` | **333** | 2026-08-12 | Independent CLI editing CapCut/JianYing projects — "**No API needed, reads `draft_content.json` directly**" |
| `K07VN/capcut-tts-api` | 259 | 2026-08-11 | Reverse-engineered CapCut TTS & STT |
| `kuwacom/CapCut-TTS` | 108 | 2026-07-22 | "CapCut API free tts" wrapper |
| `dongshuyan/dreamina2api` | 106 | 2026-08-11 | Reverse-engineered **Dreamina (CapCut AI)** image generation |
| `chenzhaohua11/CapCutAPI-Complete` | 93 | 2026-08-07 | HTTP API **+ MCP** over CapCut editing |
| `LiJunYi2/dreamina-api` | 48 | 2026-08-11 | Dreamina image gen on Cloudflare Workers |

**The mechanism.** These do not call a CapCut server. They **manipulate the local draft store on
disk.** `capcut-cli` `[GH]`: *"every command reads and writes the local draft store directly, with no
MCP server or HTTP daemon. On newer CapCut versions it detects and synchronizes every readable
timeline target instead of assuming `draft_content.json` is the only source of truth."* It carries
`migrate` and `sync-timelines` commands for CapCut version drift, and a `doctor` that warns when the
bundled template predates the installed CapCut version.

Its command set is genuinely broad — `caption` (Whisper), `import-srt`, **`export-srt` (line/word
SRT + VTT)**, `translate` (multi-language draft clone, requires `ANTHROPIC_API_KEY`), **`cut` and
`detect-scenes` for long-form → short**, `render` (ffmpeg proxy preview). As a *local creator*
utility it is impressive.

**Why we must not build on it — three reasons, all `[GH]`:**

1. **No relationship.** *"This is an independent, community-maintained project. It is **not
   affiliated with, sponsored by, or endorsed by** CapCut, JianYing, or ByteDance Ltd."* There is no
   contract, no SLA, and no indemnity. A CapCut update can break the draft schema at any time — the
   project's own `migrate`/`sync-timelines`/version-warning machinery is evidence that it does.
2. **It requires the desktop app and local filesystem access.** A cloud SMM product has neither.
3. **Its security history is poor, and disclosed.** From the README's own advisories:
   - Versions **≤ 0.17.0**: `export --batch` built an automation script by pasting the draft folder
     name into it, so **a maliciously named folder could execute commands** on macOS and Windows;
     plus an **ffmpeg filter-option injection reachable from a draft's caption colour**
     (`render --burn-captions`), a `compile` spec whose `name` could **write outside the draft
     store**, predictable temp files on every draft write, and `serve` **echoing credential values
     into its own output.**
   - Versions **≤ 0.17.2**: the `capcut fixture` bundle carried **`device_id`, `mac_address` and
     `hard_disk_id`** — and the documented workflow was to attach that bundle to a **public issue**.
     *"following it published a stable device ID and MAC address while the filename and the report
     both said 'sanitised'."*

**Verdict: CapCut is a destination our users export to, not a system we integrate with.** The
correct product treatment is to render clips to spec (1080×1920, h264/yuv420p, AAC −14 LUFS) and let
users import them into whatever editor they like.

### 4.6 Canva `[GH]`

Canva publishes `apis.json` at `canva.com/developers/apis.json` and exposes **four distinct
surfaces** — an important distinction that most integration plans blur.

| Surface | What it is | Fit for us |
|---|---|---|
| **Canva Connect API** (`https://api.canva.com`) | Create/edit designs from your app; templates, **autofill**, design management | **The one we want.** OAuth per user. |
| **Canva Apps SDK** | Build apps that run *inside* the Canva editor | Inverse direction — a distribution channel, not an integration |
| **Canva Button API** | Embed design creation/editing via HTML/JS | Lightweight embed if Connect is too heavy |
| **Canva Print Partnerships API** | Print-service integration | Irrelevant |

**Connect API endpoint groups** `[GH]`: assets, **autofills**, brand-templates, comments, designs,
**exports**, folders, resizes, users.

The two that matter, both **async job model** `[GH]`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/autofills` | Create a **design autofill job** — populate a brand template with data |
| `GET` | `/autofills/{jobId}` | Poll it |
| `POST` | `/exports` | Create a **design export job** |
| `GET` | `/exports/{exportId}` | Poll it |

**Brand-template autofill + export is the highest-leverage design integration available to a
scheduler**, and it is not the one competitors ship. Most ship "open Canva in a tab." Autofill means:
customer defines one branded template; we programmatically fill it with the quote, the stat, the
headline, the product image — per post, per brand, at scale — and export the rendered asset straight
into the composer. `[CORPUS]` records that Vista, Buffer and SocialBee ship Canva integrations rated
only `◐` (thin/gated) — consistent with the tab-opening pattern.

**Constraint:** Connect is per-user OAuth against the customer's own Canva account and their own
brand templates (a Canva Pro/Teams feature `[K]`). This is an **integrate**, not an **embed**.

---

## 5. Vendor audit — synthetic media

### 5.1 The avatar/UGC-actor tier

| Vendor | Base URL `[GH]` | Auth | Verified surface | Pricing |
|---|---|---|---|---|
| **HeyGen** | `https://api.heygen.com/v3` | API key | **Avatar V (digital twins)**, Photo Avatar, **Avatar IV**, **Starfish TTS**, **Video Agent API** (avatar video from one text prompt), **Video Translation**, **Lipsync**, **Streaming**. OpenAPI groups: account, assets, avatars, digital-twins, folders, photo-avatars, streaming, templates, video-translation, videos, voices, **webhooks**. `llms.txt` at `developers.heygen.com/llms.txt`. **SOC 2 Type II + GDPR; 50M+ videos generated.** | **Self-serve pay-as-you-go from a $5 minimum**, plus enterprise contracts. **Per-unit rates `UNVERIFIED`** (plans file is a scaffold). |
| **Synthesia** | `https://api.synthesia.io/v2` | API key | Videos, templates, assets, **dubbing**, **translations**, avatars, voices, **audit logs**, webhooks. **140+ languages.** | Tiers Basic / Starter / **Creator** / Enterprise; **API access starts at the Creator tier**. Exact prices **`UNVERIFIED`** (scaffold). |
| **Creatify** | `https://api.creatify.ai/api` | `X-API-ID` + `X-API-KEY` | Ten API families: **AI Avatar**, Link-to-Video, **AI Shorts**, Custom Templates, Product-to-Video, Text-to-Speech, **Personas**, Voices, **Music**, AI Editing | **Real data — see §5.2** |
| **Argil** | — | — | Talking-avatar from text/audio, avatar + voice cloning, B-roll management, webhooks, **subtitled output** | Classic **$39/mo** (~25 min); Pro **$149/mo** (~100 min); Scale **$499/mo**; ~1,600 credits ≈ 25 min `[CORPUS]` |
| **Akool** | `https://openapi.akool.com` | clientId/Secret → Bearer, or `x-api-key` | Talking avatars, talking photos, face swap, **video translation with lip-sync**, real-time Live Avatar | **API gated to Pro Max and above**; **generated assets retained only 7 days** `[CORPUS]` |
| **Arcads** | — | — | UGC-ad avatar actors — "creator-looking person holding your product" `[K]` | **`UNVERIFIED`.** No `api-evangelist` profile; no GitHub artifacts; site unreachable. |

### 5.2 Creatify — the fully-priced reference point `[GH]`

Creatify is the only avatar vendor in this brief with a complete, published, machine-readable price
list, which makes it the anchor for all avatar economics in §10.

**Credit rate:** **~5 credits per 30 seconds of video; 1 credit per 30 seconds of audio.** `[GH]`
**API access requires an active paid subscription.** `[GH]`

| Plan | $/mo | Credits/mo | $/credit `[CALC]` | Notes |
|---|---|---|---|---|
| Free | $0 | 10 | — | **Watermarked, 300 AI Actors, no API access** |
| Starter | $39 | 100 | $0.390 | Watermark removal, 50+ models, 200+ templates |
| Pro | $99 | 300 | $0.330 | **1500+ realistic AI actors**, 3 custom avatars, up to 5 seats |
| **API Starter** | **$99** | **500** | **$0.198** | Full API access, all generation endpoints |
| **API Pro** | **$299** | **2,000** | **$0.150** | Higher allowance |
| Enterprise | custom | custom | — | **Volume discounts, custom credit packages, white-label options**, dedicated AM |

**Derived cost per minute of avatar video `[CALC]`** (10 credits/min):

| Tier | $/min of avatar video | $/min of TTS audio |
|---|---|---|
| Consumer Pro | **$3.30** | $0.66 |
| API Starter | **$1.98** | $0.40 |
| **API Pro** | **$1.49** | **$0.30** |

**A 20-second UGC ad ≈ 3.33 credits ≈ $0.50 on API Pro.** Twenty variants per client per month =
**$10/client/month.** `[CALC]` That is the whole economic argument for shipping synthetic UGC inside
a social tool: it is a rounding error against a $99–$299 seat price.

**The AI Shorts API** `[GH]` — endpoints `POST /ai_shorts/`, `GET /ai_shorts/`,
`GET /ai_shorts/{id}/`, plus `GET`/`POST /inspiration_jobs/` — is Creatify entering the
short-form-generation space from the *synthetic* side rather than the *clipping* side. Worth
watching.

**Caveat:** the plans file is `reconciled: false` and says "verify current numbers on the Creatify
pricing page." `[GH]`

### 5.3 Voice — ElevenLabs and the routing decision `[GH]`

ElevenLabs exposes **22 distinct API families** at `https://api.elevenlabs.io`, authenticated with an
`xi-api-key` header `[GH]`: Text to Speech, **Speech to Text**, Instant Voice Cloning, **Professional
Voice Cloning**, Voices, Voice Library, Voice Settings, Sound Effects, **Audio Isolation**,
**Dubbing**, Dubbing Resources, Voice Changer (speech-to-speech), **Music Generation**,
Text-to-Dialogue, Conversational AI/Agents, Conversations, Knowledge Base, Tools, Projects/Studio,
Chapters, **Pronunciation Dictionaries**, Audio Native. It also publishes **AsyncAPI** definitions
for conversational AI, TTS streaming and webhooks — rare, and a genuine sign of API maturity.

**Pricing `[CORPUS]` `[GH]`:** Free (10K credits/mo) · Starter **$6/mo** (30K credits, commercial
licence, Instant Voice Cloning, 20 Studio projects, **Dubbing Studio**) · Creator **$11/mo** (121K,
**Professional Voice Cloning**) · Pro **$99/mo** (600K, 44.1 kHz PCM via API) · Scale **$299/mo**
(1.8M, 3 seats, 3 PVCs) · Business **$990/mo** (6M, 10 seats, 10 PVCs, "low-latency TTS as low as
5c/min") · Enterprise (custom DPA/SLA, BAA, SSO, **managed dubbing**).

**The routing fact `[CORPUS]`:** `eleven_v3` / `eleven_multilingual_v2` cost **$0.00018/character =
$0.180 per 1,000 characters**, versus **$0.015** for OpenAI `tts-1` and **$0.004** for AWS Polly
standard. **ElevenLabs is ~12× OpenAI and ~45× Polly neural per character.** That premium is
defensible for a hero brand voice or a cloned founder voice. It is indefensible as the default engine
for bulk clip voiceover. **Route by job.**

**Word/phoneme timestamps** are the load-bearing feature for social, because they are what let you
burn karaoke-style captions without a separate forced-alignment pass. Cartesia
(`wss://api.cartesia.ai/tts/websocket`) and Podcastle (`/text_to_speech/with_timestamps`) expose them
explicitly; ElevenLabs does too `[K]`; most providers do not. `[CORPUS]`

### 5.4 Podcastle / Async `[GH]`

Podcastle's developer engine is branded **Async**, at `https://api.async.com`, authenticated with
`x-api-key` plus a version header.

- **Endpoints:** `/text_to_speech`, `/text_to_speech/streaming`, **`/text_to_speech/with_timestamps`**,
  `/text_to_speech/websocket/ws`, `POST /voices` (library browse with model/language/accent/gender/
  style filters), **`POST /voices/clone`** — instant voice cloning from a short sample, multipart,
  **no training step**.
- **Models:** `async_pro_v1.0`, `async_flash`.
- **Notable absence:** transcription is a *platform* feature; there is **no standalone transcription
  endpoint in the public Voice API**. `[GH]`
- **Plans `[GH]`:** Free (**10 lifetime AI credits, 1 lifetime transcription hour**) · Essentials
  (450 credits/mo, 10 transcription hrs/mo) · Pro (larger allowance). **Actual monthly prices are
  `UNVERIFIED`** — the plans file records them as "see async.com/pricing" and is `reconciled: false`.
- The developer Voice API is **pay-per-use, per-hour synthesis pricing with a free trial**; voice
  cloning is included with API tiers. Exact per-hour rate **`UNVERIFIED`**.

### 5.5 Music — Suno is a trap, SOUNDRAW is the answer

| Provider | API status `[GH]` | Verdict |
|---|---|---|
| **Suno** | **No sanctioned developer API** as of the May 2026 assessment, re-confirmed this session. Public integrations run through **third-party aggregators (sunoapi.org, AIMLAPI) wrapping reverse-engineered access**. The FinOps profile is explicit: **publisher and invoice issuer = the aggregator, not Suno**; consumer Pro/Premier credits **cannot be allocated to API workloads**; and *"aggregator selection is the largest cost lever."* | **Do not build on Suno.** No contract, no indemnity, unsanctioned access path. |
| **Udio** | No public developer API; "production integrations are limited to consumer web/app surfaces" | Same verdict `[CORPUS]` |
| **SOUNDRAW** | `https://soundraw.io/api` — **a B2B API explicitly for embedding music generation into video platforms, games, social tools and ad tech.** Royalty-free, **copyright-cleared**, customisable by genre/mood/theme/length/instrumentation. Named existing integrations: **Canva, Filmora, Captions.** | **This is the correct commercial answer for a social tool.** It is designed for exactly this embedding and the licensing story *is* the product. |
| **Stability — Stable Audio 2.5** | Real API; **1 credit = $0.01**; ~**$0.20 per generation regardless of duration** | Buildable `[CORPUS]` |
| **ElevenLabs Music** | Music commercial use from the **$6/mo Starter** tier | Buildable, bundled with the voice contract `[CORPUS]` |

**The rights problem, restated** `[CORPUS]`: platforms run their own licensed music libraries
(Instagram/Facebook Sound Collection, TikTok Commercial Music Library, YouTube Audio Library) and
**brand accounts are frequently restricted to the commercial subsets**. Dropping AI-generated music
onto a post does not bypass content-ID; it adds a second question — *who owns this output and may
the brand use it commercially?* The three safe answers are the platform's own commercial library, a
provider selling copyright-cleared output as the product, or licensed stock.

---

## 6. Vendor audit — AI social-content generators

### 6.1 Verification status

`09-ai-frontier.md` §2.4 assessed this group under identical constraints and reached the same wall.
**Predis.ai, Ocoya and Lately.ai remain `UNVERIFIED` for 2026 pricing, limits and even company
status.** Neither `api-evangelist` nor GitHub carries artifacts for any of them. What follows is
`[K]` at May 2026 unless marked otherwise.

| Tool | Positioning `[K]` | Distinctive claim `[K]` | Status |
|---|---|---|---|
| **Predis.ai** | AI social post generator producing **designed creatives**, not just captions | Generates carousel/video/static creatives with layout and text baked in, from a product URL or prompt; multilingual; competitor-analysis input. `[CORPUS]` rates it the only tool in its comparison matrix scoring **●** on "designed creative (layout + text-in-image)" | Feature set `[K]`; **pricing/limits `UNVERIFIED`**; API existence `UNVERIFIED` |
| **Ocoya** | AI copy + design + scheduling combined | "Canva + Buffer + ChatGPT"; e-commerce product-feed integration | `[K]`; **company status and 2026 feature set `UNVERIFIED`** |
| **Lately.ai** | Brand-voice-trained long-form → social **atomisation** | Trains on a corpus of the brand's historic high-performing content, then slices long-form (blogs, podcasts, transcripts) into posts **keyed to phrases that historically performed** | **Architecturally the most interesting claim in the group** — the closest thing in market to closed-loop generation. Whether the model is genuinely fit per-brand or merely prompt-conditioned is `UNVERIFIED` **and always has been** |

### 6.2 Copy.ai

**No `api-evangelist` profile. No GitHub artifacts. Site unreachable.** `[K]`: repositioned from a
copywriting tool to a **GTM workflow/automation platform** with an API and workflow actions;
social-post generation is one template among many. **2026 state, pricing and API: `UNVERIFIED`.**

### 6.3 Jasper `[GH]`

The `api-evangelist/jasper` README is an unenriched VC stub, **but the rate-limits file is real,
generated 2026-07-19, and sourced to `developers.jasper.ai/docs/rate-limits`** `[GH]`:

| Endpoint group | Limit | Per hour |
|---|---|---|
| **Content generation** (POST: commands, templates, keep-writing, tasks, knowledge search) | **105/min** | 6,300 |
| **Resource management** (GET/POST/PATCH/DELETE: tasks, templates, knowledge, tones, usage) | **200/min** | 12,000 |
| **Styles** (`GET /styles`) | 60/min | 3,600 |
| **Image manipulation** (POST: cleanup, decompose, **packshot-compositing**, remove-background, remove-text, replace-background, uncrop, upscale) | **30/min** | 1,800 |

- Base URL `https://api.jasper.ai/v1`; limits enforced **per workspace**.
- **The docs do not publish the exceeded-limit status code or the `X-RateLimit-*`/`Retry-After`
  header names.** `[GH]` That is a real integration defect — you cannot write correct backoff
  against an undocumented error contract.
- Note the **image-manipulation** endpoint list. Jasper ships brand-asset operations
  (packshot compositing, background replace, uncrop) that map directly onto e-commerce social
  creative. That is a more interesting surface than its text generation.
- **Pricing: `UNVERIFIED`.**

### 6.4 Flick — an identity trap worth documenting

**The brief lists "Flick" among social tools. There are at least three companies named Flick, and
conflating them will produce a wrong analysis.** The `api-evangelist` profile documents the problem
explicitly `[GH]`:

| Entity | Domain | What it is | Status |
|---|---|---|---|
| **Flick (the social tool)** | `flick.social` | Instagram-first **hashtag intelligence**, expanded to an AI assistant ("Iris"). Its hashtag *performance* analytics is precisely the gap `[CORPUS]` identified as missing market-wide | **`UNVERIFIED`** — site unreachable; no profile; **not the entity profiled below** |
| **Flick (AI filmmaking)** | `flick.art` | AI filmmaking studio: node-based infinite canvas for directing short films, character/style consistency across shots, shot composition control. Founded by Ray Wang (ex-founding engineer, Instagram AI) and filmmaker Zoey Zhang. **Y Combinator- and GV-backed.** Free tier **300 credits**, paid **from $5/mo** | `[GH]`. **No public developer API, no SDKs, no webhooks, no MCP server.** `/api/` is internal and **disallowed in `robots.txt`**. No first-party npm/PyPI packages, no public GitHub org. Publishes a real `llms.txt` |
| **Flick (deadpooled)** | `flickapp.com` | Sports fan-engagement group chat, founded by FanDuel co-founders Nigel Eccles and Rob Jones (Edinburgh), Bullpen Capital-backed | **Dead.** The profile records that the domain **"now resolves to an unrelated Indonesian gambling spam site (verified 2026-07-20)."** `[GH]` |

**Action:** any competitive tracker that has "Flick" in it must be disambiguated by domain, and any
outbound link to `flickapp.com` must be purged.

---

## 7. Newsletter ↔ social loops

This is the least glamorous section and one of the highest-confidence, because newsletter platforms
publish proper APIs and API Evangelist has fully enriched them.

### 7.1 beehiiv `[GH]`

| Property | Value |
|---|---|
| Base URL | `https://api.beehiiv.com/v2` |
| Surface | **24 API families**: Publications, **Posts**, Subscriptions, Bulk Subscriptions, Bulk Subscription Updates, Subscription Tags, Newsletter Lists, Newsletter List Subscriptions, **Automations**, Automation Journeys, Condition Sets, Segments, Tiers, Polls, **Webhooks** (+ **AsyncAPI** definition), Custom Fields, Authors, Engagements, Referral Program, Advertisement Opportunities, Post Templates, Workspaces, Data Deletion, OAuth Users |
| **Rate limit** | **180 requests/minute per organization** (= 3 req/sec) |
| Headers | IETF-draft `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (Unix epoch), `429` on exceed |
| Guidance | *"beehiiv recommends pacing requests at ~350ms intervals"*; **all API keys and OAuth tokens in a workspace share the same bucket** |

**Pricing `[GH]`:**

| Plan | Monthly | Annual | Subscriber limit |
|---|---|---|---|
| Launch | **$0** | — | **2,500** (unlimited email sends) |
| Scale | **$43** | $517 | 100,000 |
| Max | **$96** | $1,151 | 100,000 |
| Enterprise | contact sales | — | — |

**The per-organization shared bucket is the design constraint.** If we hold OAuth tokens for many
customers we are fine (separate orgs); if an agency runs many publications in one beehiiv workspace,
our sync competes with their own integrations for 180 req/min. Build with the `RateLimit-Reset`
header and a per-org token bucket, not a global one.

**The loop:** `Posts` + `Webhooks` + `AsyncAPI` means we can subscribe to "post published" and
auto-atomise the issue into social posts within seconds. That is the newsletter→social direction, and
it is cleanly buildable.

### 7.2 Kit (formerly ConvertKit) `[GH]`

| Property | Value |
|---|---|
| Base URL | `https://api.kit.com/v4` |
| Versioning | **V4 is current; V3 is deprecated and scheduled for sunset** |
| Surface | accounts, **broadcasts**, custom fields, email templates, forms, **posts**, purchases, segments, sequences, sequence emails, snippets, subscribers, tags, **webhooks** |
| Auth A | **API Key** (`X-Kit-Api-Key` header) — **120 requests / 60 s rolling** |
| Auth B | **OAuth 2.0** — **600 requests / 60 s rolling**; required for Kit App Store distribution; **refresh tokens are single-use with automatic rotation**; PKCE for SPA/mobile |
| Gotcha | **Some endpoints (bulk operations, purchase creation) are OAuth-only** |

**Pricing `[GH]`:**

| Plan | Monthly | Annual (per mo) | Notes |
|---|---|---|---|
| Newsletter | **$0** | $0 | **10,000 subscribers**, 1 sequence, 1 visual automation, 1 user, **API access included** |
| Creator | **$39** | $33 | *at 1,000 subscribers; scales with count.* Unlimited automations & sequences, **Kit MCP (AI integration)**, SMS marketing, 24/7 support |
| Pro | **$79** | $66 | *at 1,000 subscribers.* Subscriber Signals, unlimited team users, A/B testing (5 variations), collaborative editing |

Two things stand out. **API access is on the free plan** — unusually open, and it makes Kit the
easiest newsletter integration to demo. And **Kit ships an MCP server** on the Creator tier `[GH]`,
which puts it in the small set of marketing tools with a first-party agent surface (cf.
`09-ai-frontier.md` §4.2).

**5× rate-limit differential (120 → 600 req/min) for OAuth** means a production integration must use
OAuth, not API keys, from day one. Retro-fitting single-use rotating refresh tokens is painful.

### 7.3 Substack `[GH]`

The profile is a one-line stub: *"Substack — independent newsletter and media platform for paid
subscriptions, posts, podcasts, video, chat, and Notes."* `[GH]`

Its `apis.yml` lists base URLs `https://substack.com` and `https://{publication}.substack.com` — i.e.
**the public web surface, not a developer API.** There are **no OpenAPI files, no plans file, no
rate-limits file** in the repo. `[GH]`

**Verdict: Substack has no public write API.** The integration surface is:
- **Outbound only:** each publication's **RSS feed** (`/feed`) for newsletter→social. `[K]`
- **No programmatic publishing**, no subscriber API, no webhooks. `[K]`, consistent with `[GH]`.

**This is a "poll RSS and atomise" integration, and nothing more.** Which is fine — it is cheap and
it covers the direction that matters (newsletter → social). Any roadmap item implying we can publish
*to* Substack or read its subscriber data should be struck.

### 7.4 Podcast hosts

**Transistor `[GH]`** — the model citizen:

| Property | Value |
|---|---|
| Base URL | `https://api.transistor.fm/v1` |
| Surface | shows, **episodes**, **analytics**, subscribers, **webhooks**, account |
| **Rate limit** | **10 requests / 10 seconds** |
| **API access** | **Included on every paid plan** — no gating |
| Also included on all plans | Unlimited podcasts, unlimited team collaborators, advanced analytics, podcast website |

| Plan | $/mo | Downloads/mo | Private subscribers |
|---|---|---|---|
| Starter | **$19** | 20,000 | 50 |
| Professional | **$49** | 100,000 | 500 |
| Business | **$99** | 250,000 | 3,000 |
| Enterprise | from **$199** | custom | custom |

Yearly billing = **12 months for the price of 10** `[GH]`. Implied cost **$0.00095 per download** at
Starter `[CALC]`.

**Buzzsprout `[GH]`:** base `https://www.buzzsprout.com/api`; **Episodes** and **Podcasts** APIs
only. A thinner surface than Transistor — no analytics or webhooks API in the profile — but enough to
detect a new episode and pull its media.

**The loop:** podcast host webhook/poll → new episode → pull audio → §2 pipeline → clips + audiograms
+ show notes → publish. Transistor's webhooks make this event-driven; Buzzsprout requires polling.

---

## 8. The automation-glue tier — Repurpose.io, Castmagic, Chopcast

**No `api-evangelist` profile, no OpenAPI, no GitHub artifacts, sites unreachable. All
`UNVERIFIED`.** A targeted GitHub search for repurposing/podcast-clipping projects returned 26
repositories, **none of them official vendor SDKs** for these three. `[GH]`

`[K]` positioning, flagged:

| Vendor | What it is `[K]` | Integration reality `[K]` |
|---|---|---|
| **Repurpose.io** | **Workflow automation for content distribution** — "when a video appears here, transform it and publish it there." Connects YouTube/podcast RSS/TikTok/IG/Facebook/LinkedIn/Google Drive/Dropbox. Its value is the *routing graph*, not the AI | **A direct competitor to our publishing layer, not a supplier to it.** Likely no public API for third parties to orchestrate (it *is* the orchestrator). `UNVERIFIED` |
| **Castmagic** | Podcast audio → **text asset bundle**: show notes, timestamps, titles, social posts, newsletter drafts. Text-first, not clip-first | Consumes audio, emits text. Rebuildable in-house for cents (§10) — transcription $0.04/hr + one long-context LLM call `[CALC]` |
| **Chopcast** | B2B/agency long-form → short-form, historically with a **managed-service component** | Service-heavy; not an API supplier `UNVERIFIED` |

**The strategic note on Repurpose.io:** it is the clearest example of the pattern flagged in §1.2 —
content-transformation tools growing into distribution. If it already publishes to the networks we
publish to, it competes with us on distribution while beating us on transformation. That asymmetry
resolves in our favour only if we close the transformation gap.

**On Castmagic specifically:** its entire output is *text derived from a transcript*. We will already
have the transcript (§11.1, at $0.04/hour). Generating show notes, timestamps, titles and five social
posts from it is a single long-context LLM call costing roughly **$0.02** `[CORPUS]` `[CALC]`. This is
the least defensible product in the brief.

---

## 9. Orchestration matrix — embed, integrate, or rebuild

**Definitions used strictly:**
- **EMBED** — we call their API server-side with *our* credentials, the user never sees the vendor,
  we resell it inside our own credit system.
- **INTEGRATE** — the customer brings their own account; we orchestrate via OAuth/API key; their
  plan pays for usage.
- **REBUILD** — we implement it ourselves on raw model APIs.
- **AVOID** — no sanctioned path exists.

| Vendor | API verified? | Verdict | Reasoning |
|---|---|---|---|
| **Descript** | **Yes `[GH]`** | **INTEGRATE** (+ "Edit in Descript" button as v1) | Token is per-Drive/per-user; credits come from the customer's plan; **API-vs-app credit attribution is not published**, so we cannot price a resold job (§4.1.6). No reseller tier documented — **`UNVERIFIED`** whether one exists |
| **Riverside** | **Yes `[GH]`** | **INTEGRATE** | Business plan only; read/download surface. Ideal clean-ingest source |
| **Canva** | **Yes `[GH]`** | **INTEGRATE** (Connect API, OAuth) | Brand templates live in the customer's account. **Autofill + Export is the killer feature** (§4.6) |
| **Creatify** | **Yes `[GH]`** | **EMBED** | **Dedicated API tiers ($99/$299) and Enterprise white-label** exist specifically for this. Published credit rate = predictable unit cost |
| **HeyGen** | **Yes `[GH]`** | **EMBED** | Self-serve PAYG **from $5 minimum**; SOC 2 Type II + GDPR; webhooks. Per-unit rates `UNVERIFIED` — get them before committing |
| **Synthesia** | **Yes `[GH]`** | **EMBED** (or integrate for existing enterprise customers) | API from Creator tier; 140+ languages; audit-log API is a genuine enterprise asset |
| **ElevenLabs** | **Yes `[GH]`** | **EMBED**, with routing | 22 API families incl. dubbing and STT. **Route bulk voiceover elsewhere** (12× cost, §5.3) |
| **Podcastle / Async** | **Yes `[GH]`** | **EMBED** (voice only) | Clean voice API with `with_timestamps` and no-training instant cloning. Pricing `UNVERIFIED` |
| **SOUNDRAW** | **Yes `[GH]`** | **EMBED** | Purpose-built B2B embedding API; copyright-cleared output is the product |
| **beehiiv** | **Yes `[GH]`** | **INTEGRATE** (OAuth) | 180 req/min **per org, shared** — design for it |
| **Kit / ConvertKit** | **Yes `[GH]`** | **INTEGRATE** (OAuth, 600/min) | API on the free plan; ships an MCP server |
| **Transistor** | **Yes `[GH]`** | **INTEGRATE** | API on every paid plan; webhooks; 10 req/10 s |
| **Buzzsprout** | **Yes `[GH]`** | **INTEGRATE** | Episodes/podcasts only; poll |
| **Substack** | **No API `[GH]`** | **INTEGRATE via RSS only** | No write path, no subscriber data, no webhooks |
| **Jasper** | Partial `[GH]` | **INTEGRATE** if a customer asks | Rate limits known; **error contract undocumented**; pricing `UNVERIFIED` |
| **CapCut** | **No sanctioned API `[GH]`** | **AVOID** | Unofficial draft-file manipulation only; no affiliation; security history poor (§4.5) |
| **Suno / Udio** | **No sanctioned API `[GH]`** | **AVOID** | Aggregator-mediated reverse-engineered access; no contract, no indemnity |
| **Opus Clip** | Exists, unspecified `[3P]` | **DEFER — re-verify** | API described but endpoints/pricing `UNVERIFIED`. Also a competitor (it ships scheduling) |
| **Vizard / Klap / Submagic / Munch / 2Short / Vidyo / Chopcast / Wisecut** | `UNVERIFIED` | **REBUILD** | Nothing verifiable to integrate; the pipeline costs <$1/source-hour to run (§10) |
| **Castmagic** | No API found | **REBUILD** | Transcript + one LLM call ≈ $0.06/episode `[CALC]` |
| **Repurpose.io** | No API found | **COMPETITOR** | Distribution automation — overlaps us, does not supply us |
| **Predis / Ocoya / Lately / Copy.ai / Arcads / VEED / Kapwing** | `UNVERIFIED` | **DEFER** | Re-verify when web access returns |
| **The clipping pipeline itself** | n/a | **REBUILD** | Six OSS reference implementations; $0.15–$0.60 per source hour (§2, §10) |

---

## 10. Cost per generated asset in 2026, and what it implies for credit pricing

### 10.1 The unit economics table

All figures `[CORPUS]` from `09-ai-frontier.md` §3/§7 (sourced from LiteLLM's
`model_prices_and_context_window.json`, 3,003 entries, pulled from GitHub) unless marked otherwise.

| Asset | Cheapest credible | Standard | Premium |
|---|---|---|---|
| **Caption / hashtags / rewrite** | $0.0002–$0.0008 | — | — |
| **Image, draft quality** | `flux/schnell` **$0.003** | — | — |
| **Image, published** | — | Imagen 4 / FLUX 1.1 pro / Nano Banana **$0.04** | `gpt-image-1` high **$0.167–$0.25** |
| **Image, text-in-image** | — | **Ideogram v3 $0.06** | — |
| **Video, per second** | Veo 3.1 Lite 720p / Runway Gen-4 Turbo **$0.05** | Veo 3.1 Lite 1080p **$0.08**; Sora 2 **$0.10** | Veo 3.1 **$0.40** |
| **Video, 15 s clip** | **$0.75** | $1.20–$1.50 | $6.00 |
| **Avatar video, per minute** | **Creatify API Pro $1.49** `[CALC]` | Creatify API Starter $1.98 `[CALC]` | Creatify consumer Pro $3.30 `[CALC]` |
| **Voiceover, 60 s (~900 chars)** | AWS Polly neural **$0.014** / OpenAI `tts-1` **$0.014** | Polly generative $0.027 | **ElevenLabs v3 $0.162** |
| **Transcription, 1 hour** | Groq `whisper-large-v3-turbo` **$0.040** | AssemblyAI best $0.120 | Deepgram `nova-3` $0.258 |
| **Lipsync / dub, per second** | Sync Labs Scale **$0.040** | Sync Labs Hobbyist $0.050 | Runway Act-Two $0.050 |
| **Music, per generation** | — | Stable Audio 2.5 **$0.20** | — |
| **10 clips from a 1-hour video** | **$0.15–$0.60** `[CALC]` | — | — |

### 10.2 The four numbers to internalise

1. **A one-hour podcast becomes ten ranked, captioned, vertically-reframed clips for well under a
   dollar.** Transcribe $0.040 + rank $0.006 + render ~$0.10–$0.50. `[CALC]`
2. **A minute of synthetic UGC avatar video costs $1.49** at Creatify API Pro. `[CALC]`
3. **A minute of voiceover costs 1.4 cents** — unless you choose ElevenLabs, when it costs 16.2.
4. **Localising a 30-second video into 20 languages costs under $30** all-in. `[CORPUS]` `[CALC]`

### 10.3 What competitors charge per credit, measured

This is the most useful new arithmetic in this file, because it establishes the market's actual
credit price band from published data rather than assertion.

| Vendor | Basis | **$/credit** `[CALC]` |
|---|---|---|
| **Descript** Creator | $24/mo ÷ 800 credits | **$0.030** |
| **Descript** Business | $50/mo ÷ 1,500 credits | **$0.033** |
| **Descript** Hobbyist | $16/mo ÷ 400 credits | **$0.040** |
| **Creatify** API Pro | $299/mo ÷ 2,000 credits | **$0.150** |
| **Creatify** API Starter | $99/mo ÷ 500 credits | **$0.198** |
| **Creatify** consumer Pro | $99/mo ÷ 300 credits | **$0.330** |
| **Runway** (reference) | published | **~$0.010** `[CORPUS]` |
| **Stability** (reference) | published | **$0.010** `[CORPUS]` |

**The band is $0.01–$0.33, and the shape is diagnostic:** vendors that publish "1 credit = 1 cent"
(Runway, Stability) are selling raw compute; vendors at $0.03 (Descript) are bundling a seat; vendors
at $0.15–$0.33 (Creatify) are pricing a finished creative asset. **All three are defensible. What is
not defensible is refusing to state the number** — which is what `[CORPUS]` found across the SMM tier,
where Vista Social has *no published per-credit price at all* and its plan allowances conflict between
its own sources.

### 10.4 The credit-system recommendation, specialised to this layer

`09-ai-frontier.md` §7.7 sets out five principles. Applying them to repurposing specifically:

**1 credit = $0.01 of underlying cost, published.** Rate card for this layer:

| Operation | Credits | ≈ Underlying cost |
|---|---|---|
| **Transcription, per source hour** | **8** | $0.040 |
| **Highlight ranking, per source hour** | **2** | $0.006 |
| **Clip render + reframe + captions, per clip** | **5** | ~$0.02–$0.05 |
| **Full "podcast → 10 clips" job, 1 hr source** | **~60** | ~$0.15–$0.60 |
| Draft image | 1 | $0.003 |
| Standard image | 6 | $0.04–$0.06 |
| Text-in-image (Ideogram) | 8 | $0.06 |
| Video, economy, per second | 8 | $0.05 |
| Video, premium, per second | 50 | $0.30–$0.40 |
| **Avatar video, per 30 s** | **75** | $0.75 (Creatify API Pro) |
| **Dub/lipsync, per second** | **8** | $0.04–$0.05 |
| **Full dub into one extra language, 30 s video** | **~150** | ~$1.45 |
| Caption/hashtag/rewrite generation | **0 — free** | $0.0002–$0.008 |

**Sell credits at $0.03–$0.05** (a 3–5× markup) and the whole repurposing feature set prices out at:

> **A 60-minute podcast → 10 finished vertical clips = ~60 credits = $1.80–$3.00 of customer
> spend against $0.15–$0.60 of cost.** `[CALC]`

Compare that with the incumbent model: **$29/month for 60 minutes of upload** `[3P-LOW]`. On a
weekly-podcast customer (4 hours/month), our price is **$7.20–$12.00/month** for four times the
allowance, at ~80% gross margin. **The standalone clipping category's pricing is not defensible
against a scheduler that already holds the customer's media.**

**Three rules that matter more here than elsewhere:**

- **Meter video and audio-minutes; make text free.** Captions, hooks, show notes, titles, alt text
  and repurposed post copy cost fractions of a cent. Metering them trains users to believe text is
  scarce and generates resentment `[CORPUS]` while protecting no margin.
- **Show the estimate before the job runs.** "This 62-minute episode will produce ~10 clips and use
  ~60 credits (~$2.40)." Nobody in the category does this, and surprise is the entire source of
  credit-system complaints `[CORPUS]`.
- **Meter by *source* minute, not output clip.** Source minutes are what actually drive cost
  (transcription + ranking scale with source length; render scales with output). Charging per clip
  punishes exactly the behaviour we want — generating many candidates and keeping the good ones.

---

## 11. Auto-captioning, subtitling, translation and dubbing

### 11.1 Transcription and captioning — solved, cheap, and under-shipped

| Model | $/audio-second | **60-min podcast** | Notes |
|---|---|---|---|
| **Groq `whisper-large-v3-turbo`** | $0.00001111 | **$0.040** | Cheapest credible |
| Groq `whisper-large-v3` | $0.00003083 | $0.111 | |
| AssemblyAI `best` | $0.00003333 | $0.120 | |
| Mistral `voxtral-mini-2602` | $0.00005000 | $0.180 | |
| **ElevenLabs `scribe_v1`** | $0.00006110 | $0.220 | `POST /v1/speech-to-text` + **`/async`** `[GH]` |
| Deepgram `nova-3` | $0.00007167 | $0.258 | |
| OpenAI `whisper-1` | $0.00010000 | $0.360 | |
| `gpt-4o-transcribe-diarize` | token-billed | — | **Diarization as a first-class model** |

*(Table `[CORPUS]`; ElevenLabs endpoint paths `[GH]`.)*

**Quality, honestly `[K]`:** for clean single-speaker English, all of the above are near-parity and
the differentiator is timestamp granularity, not word error rate. For multi-speaker, accented,
code-switched or noisy audio, the gap is real and diarization is the hard part — which is why
`autoclip` reaches for **WhisperX + `pyannote`** rather than plain Whisper, and pays for it with a
PyTorch dependency, a HuggingFace token and gated model licences `[GH]`.

**The load-bearing requirement is word-level timestamps**, not the transcript. Karaoke captions,
speaker-following reframe, and word-index highlight selection (§2.7) all depend on them. Providers
that expose them explicitly: Cartesia (word *and phoneme*), Podcastle (`/text_to_speech/with_timestamps`),
ElevenLabs `[K]`, WhisperX locally. `[CORPUS]` `[GH]`

**Burn-in is an ffmpeg `libass` problem**, not an AI problem (§2.6). Four styles cover the market —
`autoclip` ships exactly these `[GH]`:

| Style | Look |
|---|---|
| `bold_pop` | Chunky white, heavy outline; spoken word grows and turns yellow |
| `karaoke_fill` | Words fill with colour exactly as spoken |
| `clean_lower` | Minimal lower third, no animation |
| `boxed` | High-contrast text on a solid block |

**Does any SMM tool ship captioning natively?** `[CORPUS]`'s capability matrix answers this:
**auto-captions / subtitle burn-in is `○` (absent) across Sprout, Hootsuite, Vista, Buffer, Later,
Publer, Metricool and SocialBee**; `◐` for Sprinklr and Predis; `●` only for Opus Clip. **Nine of
eleven products in the category do not do it at all.** For a capability that costs four cents an hour
and is an accessibility requirement, that is indefensible — and it is the single cheapest
differentiator available.

*One platform note:* YouTube's `captions.insert` costs **400 quota units** `[CORPUS]`. Uploading a
caption track alongside every video is not free in quota terms even though it is free in dollar
terms. Budget it.

### 11.2 Translation and dubbing — three verified APIs

| Vendor | Endpoint `[GH]` | Parameters / behaviour |
|---|---|---|
| **ElevenLabs Dubbing** | `POST /v1/dubbing`<br>`GET`/`DELETE /v1/dubbing/{dubbing_id}` | Accepts **`file` (MP3/WAV/MP4/MOV) or `source_url`**; `source_lang`, `target_lang`; **`num_speakers`** ("helps improve speaker diarization accuracy"); **`watermark` (boolean)**; `name`. Returns `dubbing_id` + **`expected_duration_sec`**. Status enum: **`dubbing` / `dubbed` / `failed`**. "Transcribes, translates, and re-synthesizes the audio **while preserving the original speakers' voice characteristics**." |
| **Synthesia Dubbing** | `POST /dubbing/projects`<br>`GET /dubbing/projects/{projectId}`<br>**`POST /dubbing/projects/{projectId}/locales`** | Project-plus-locales model — **add target locales to an existing project** rather than re-submitting the source. The right shape for fan-out to many markets. Separate `translations` API also exists. **140+ languages.** |
| **HeyGen Video Translation** | **`GET /v2/video_translate/target_languages`**<br>`POST /v2/video_translate`<br>`GET /v2/video_translate/{video_translate_id}` | Discoverable language list (good API design — no hardcoded enum), async status polling. Paired with a separate **Lipsync** product. |
| **Sync Labs (sync.so)** | — | Studio-grade **visual dubbing / lipsync**. **$0.05/sec** (Hobbyist) → **$0.04/sec** (Scale, 20% discount). Scale adds a **Batch API**, 15 concurrent jobs, 50 voice clones `[CORPUS]` |
| **Akool** | — | Video translation **with lip-sync**; API gated to Pro Max+; **generated assets retained only 7 days** `[CORPUS]` |
| **Descript** | *(no dubbing endpoint)* | "Translate and dub video in 30+ languages **with proofread**" is a **Business-tier app feature**, **not exposed in the API** `[GH]` |

**Cost `[CORPUS]` `[CALC]`:** a 30-second brand video into 20 languages = lipsync at Sync Labs Scale
$0.04/sec × 30s × 20 = **$24**, plus TTS (20 × ~900 chars: **$3.24** on ElevenLabs, **$0.27** on
OpenAI `tts-1`), plus translation (cents). **Under $30 to take one video into 20 markets.**

**Quality, honestly `[K]`:** voice-preserving dubbing is good enough for marketing and training
content and not good enough for anything where mistranslation carries risk. Synthesia's Business-tier
framing of "**with proofread**" `[GH]` is the tell — the vendors themselves put a human in the loop
for anything consequential. Lipsync quality degrades on profile angles, fast motion and occlusion
(hands near the face) `[K]`. **Ship it with a mandatory review step, per locale.**

**The `watermark` parameter on ElevenLabs dubbing is the compliance hook** `[GH]` — a single boolean
that materially changes our §12 posture. It should be **on by default** and surfaced as a per-brand
policy, not buried.

**Nobody in our category ships any of this.** `[CORPUS]`'s matrix scores "dubbing/translation with
lipsync" as `○` for every SMM product except Sprinklr (`◐`). Per-market localisation as a *publishing
option* — pick a post, pick five markets, get five localised variants queued to five accounts — does
not exist anywhere. It is buildable on three verified APIs for under $30 per video per 20 markets.

---

## 12. AI labelling, platform disclosure, and C2PA

### 12.1 Platform rules

**All `[K]`, cutoff May 2026. Every platform policy page was unreachable this session
(`transparency.meta.com`, `newsroom.tiktok.com`, `support.google.com` all `EGRESS_BLOCKED`).
Re-verify every row before it becomes product logic.**

| Platform | Mechanism `[K]` | What it means for us |
|---|---|---|
| **Meta (FB/IG/Threads)** | **"AI info"** label (renamed from "Made with AI", July 2024, after creator backlash about over-labelling ordinary edits). Applied **automatically when industry-standard IPTC metadata or C2PA credentials are detected on upload**, plus a **self-disclosure toggle** required for realistic AI-generated video/audio | **Signing our assets causes the label to appear.** That is a compliance *feature* and a conversion *consideration*. The customer must be able to see it coming before they publish |
| **TikTok** | **AIGC label.** First video platform to implement **C2PA Content Credentials for automatic labelling** (May 2024); reads credentials on upload; **mandatory creator disclosure toggle** for realistic AI content; attaches Content Credentials to content made with its own AI effects | Strongest C2PA read/write posture of the majors |
| **YouTube** | **"Altered or synthetic content" disclosure** at upload (March 2024). Surfaces in the expanded description, and **on the player itself for sensitive topics** (health, elections, finance, ongoing conflicts). Separate likeness-detection tooling | Required for realistic synthetic content; **not** required for obviously unreal content or minor production assistance |
| **X** | Synthetic-media policy + Community Notes; no first-party AI-label pipeline of the Meta/TikTok kind | **`UNVERIFIED` for 2026** |
| **LinkedIn** | Displays C2PA Content Credentials where present | **`UNVERIFIED` for 2026** |
| **Pinterest** | AI-modified labelling using metadata | **`UNVERIFIED`** |

### 12.2 C2PA — the technical state `[GH]`

Re-verified this session from `contentauth/c2pa-rs`:

| Fact | Detail |
|---|---|
| Specification | **C2PA 2.2** |
| Reference implementation | `c2pa` Rust crate + **C API** (bind from any language), `@contentauth/c2pa-node`, `c2pa-python`, **`c2patool` CLI** |
| Maturity | **Beta (0.x.x).** Additive changes ship as patch releases; breaking changes are governed by compatibility, not size. CI runs tiered support levels (Tier 1A/1B/2) |
| Capabilities | Create and sign C2PA claims/manifests; **create, sign and validate CAWG identity assertions**; embed manifests in supported formats; parse and validate |
| Identity binding | **CAWG identity assertion** (`cawg.io/identity`) |
| Marking AI generation | `c2pa.actions.v2` / `c2pa.created` with **`digitalSourceType = trainedAlgorithmicMedia`** `[CORPUS]` |
| Marking AI **manipulation** | Requires **the original asset** — C2PA records an edit as `c2pa.opened` pointing at an ingredient **whose hash covers the original's bytes**. You cannot substitute a filename or a supplied digest `[CORPUS]` |
| Soft binding | **TrustMark watermark** can survive manifest stripping; provenance recoverable via the **CAI Soft-Binding Resolution API** `[CORPUS]` |
| Google's parallel track | **SynthID**, exposed as `add_watermark: bool` in the GenAI SDK. **Gotcha: `seed` is unavailable when `add_watermark` is true** — no reproducibility and watermarking in one call `[CORPUS]` |

**The stripping problem `[CORPUS]`:** the four-verdict taxonomy — **PRESERVED / STRIPPED / RE-SIGNED /
SOFT-BINDING-RECOVERABLE** — is the right mental model, and **which platform does which is
`UNVERIFIED`.** The recommendation from `09` stands and is worth repeating because it is cheap and
differentiating: **run the measurement yourself, per platform, per media type, and publish the
matrix.** Two days of work, a genuinely novel artifact, and a category-authority position.

### 12.3 Where AI-generated content collides with the rules — the specific list

Mapping §5 and §11 capabilities onto §12.1 obligations:

| Capability we might ship | Disclosure exposure | Handling |
|---|---|---|
| AI-generated **caption text** | **None.** Text assistance is not covered by the platform labels | No flag |
| AI **image** for a post | Meta auto-label if C2PA/IPTC present; **AI info** | Set provenance; let the customer preview the label |
| AI **video** (Veo/Sora) | **All three majors.** Realistic synthetic video is the core case | Mandatory disclosure flag propagated per network |
| **Avatar / synthetic presenter** | **All three majors** + likeness law (§12.5) | Disclosure **and** a consent artifact |
| **Voice clone** | All three + **ELVIS Act (TN)**, digital-replica statutes | Disclosure **and** consent artifact **and** expiry |
| **Dubbed/translated** video of a real person | **Highest risk.** The speaker appears to say words they did not say, in a voice resembling theirs | Disclosure, consent, **and** the ElevenLabs `watermark: true` flag `[GH]` |
| **Lipsync** applied to real footage | Same as dubbing | Same |
| AI **music** | Not an AI-label issue; **a rights issue** (§5.5) | Licence record |
| **Auto-captions** | None | No flag |
| **Clip extraction** from the customer's own footage | **None — this is editing, not generation** | No flag. Worth stating explicitly to customers, because over-labelling is exactly what triggered Meta's 2024 backlash |

**That last row is a product insight.** The repurposing pipeline — cut, reframe, caption — generates
**no** disclosure obligation, because nothing is synthesised. It is the *cheapest* AI feature to ship
from a compliance standpoint and the *most* valuable to customers. Synthetic media is the opposite.
Sequence the roadmap accordingly.

### 12.4 What to build — the provenance record

Unchanged from `09-ai-frontier.md` §8.4/§8.7, and still true that **no product in this corpus does
any of it**:

1. **AI-provenance fields on every media asset, set at generation time**:
   `{ ai_generated, ai_modified, model, model_version, prompt_hash, is_deepfake_of_real_person,
   human_reviewed_by, reviewed_at }`
2. **Per-platform label propagation at publish** — Meta's toggle, TikTok's AIGC switch, YouTube's
   altered-content declaration are three distinct surfaces with distinct semantics
3. **Configurable visible disclosure text**, per brand, per platform
4. **Human-approval record per post** (who, when, what they saw) — this is the EU AI Act Art. 50(4b)
   editorial-responsibility exception, and it is a compliance artifact
5. **C2PA signing at generation**, via an isolated signing service so the private key never touches
   the web app `[GH]`
6. **Consent artifact store for voice clones and avatars**, with expiry and revocation

Items 1, 3, 4 and 6 are the ones this file's subject matter forces, and together they are perhaps two
weeks of work.

### 12.5 Likeness and voice law — the short version

`[K]`, cutoff May 2026, **most likely part of this document to be stale — get counsel:** EU AI Act
Art. 50(4) deepfake disclosure; **TAKE IT DOWN Act** (US federal, 2025); **ELVIS Act** (Tennessee,
2024 — voice as a property right); California AB 602/853/1836; New York digital-replica provisions;
China's conspicuous-marking rules.

**Two product rules that hold regardless of jurisdictional detail:**
- **Voice cloning and avatar creation require a recorded consent artifact** — a signed release or a
  verified consent capture — stored with the asset, with expiry and revocation.
- **Third-party likeness must be blocked by default.** A feature letting a marketer generate video of
  a real person they do not represent is a liability, not a feature.

---

## 13. Real user criticism — and an honest note on sourcing

### 13.1 The sourcing problem, stated plainly

**G2, Capterra, Trustpilot, Reddit and X were all unreachable this session (§0.1), and the WebSearch
budget was exhausted before this file began.** I will not manufacture review quotes. Everything below
is attributed to a source I actually read, or marked `[K]`.

### 13.2 Criticism from primary artifacts I did read `[GH]`

**On the clipping incumbents** — from `AI-Youtube-Shorts-Generator`'s own comparison table
`[CORPUS]` `[GH]`, i.e. a competitor's characterisation, but a specific and testable one:

> "$20–$300/month subscriptions · monthly minute caps with overage fees · watermarks on free tiers ·
> **black-box highlight algorithms** · locked output presets · manual one-by-one upload · SaaS-only,
> with your videos on their servers."

**On auto-reframing quality** — from `autoclip`'s maintainer, about his own project, which makes it
credible as a statement of the general difficulty `[GH]`:

> "the §6.4 reframe acceptance bar — **no visible jitter, no cut-off faces, speaker on screen ≥95% of
> speaking time** — [has not been verified] against a fixed three-video golden set… 'looks right on
> footage I picked' isn't the bar."

> "Also unverified: **whether the clip *picks* are good.** That's a judgement call about your material
> and your model, and no test settles it."

And on model dependence `[GH]`:
> "Clip quality tracks model quality closely. **A 7B model returns valid JSON full of mediocre picks**;
> a frontier model is noticeably better at spotting a real hook."

**On CapCut tooling security** — `capcut-cli`'s own published advisories `[GH]`, quoted in §4.5:
device-ID and MAC-address leakage in bundles the docs told users to post publicly; two command
injection paths; an ffmpeg filter injection reachable from a caption colour; credentials echoed by
`serve`.

**On ingest fragility** `[GH]`:
> "As of 2026, **YouTube blocks most anonymous downloads and proof-of-origin tokens no longer clear
> it.**"

**On the promotional-list source** — `[3P-LOW]` characterisations from
`awesome-free-opusclip-alternatives`, **which is an affiliate artifact promoting "Reelify AI" and
should be weighted accordingly**: OpusClip "**strict credit limits, slow processing times during peak
hours**"; Vizard "the AI selection isn't as sharp… **often picks irrelevant moments**"; Munch "**no
real free tier**"; 2Short "very limited subtitle styles, heavily watermarked… **cannot upload raw
files (must be YouTube link)**".

### 13.3 Criticism carried from the corpus `[CORPUS]`

- **Credit systems are the category's most consistent complaint:** "credit-based AI feels
  nickel-and-dimed"; "the credit model frustrates heavy users." Vista Social specifically has **no
  published per-credit price**, **conflicting plan allowances between its own sources**, and
  **`UNVERIFIED` overage/top-up paths**.
- **The video gap is customer-visible:** "long-form → short-form clip extraction… exists in *no*
  social media management tool in this segment… **Customers currently bridge this with a separate
  subscription.**"

### 13.4 `[K]` criticism — flagged, not sourced

Widely reported at May 2026 and **not re-verified**: Descript's historical reputation for **project
corruption and performance degradation on long timelines**; Opus Clip's **virality score being
treated as arbitrary** by users; Submagic's **caption quality being strong while its clip selection
is weak**; and general frustration across the clipping tier that **rendering queues slow
dramatically at peak times**. Treat all of this as hypotheses to test, not facts.

---

## 14. What to build — ranked

| # | Item | Why | Depends on | Effort |
|---|---|---|---|---|
| 1 | **Transcribe every uploaded video, unconditionally** | $0.040/hour. Unlocks captions, search, repurposing, accessibility, brand-safety. Nine of eleven category products don't do it | Groq/AssemblyAI | **S** |
| 2 | **Auto-caption + burn-in, four styles** | Cheapest genuine differentiator in the category; ffmpeg `libass`, not AI | 1 | **S–M** |
| 3 | **Clip pipeline v1: transcribe → rank → cut → reframe → caption → export** | The largest unclaimed adjacency `[CORPUS]`; <$1 per source hour; six OSS references to learn from | 1, 2 | **L** |
| 4 | **Pre-flight credit estimate in the UI** | Removes the single largest source of credit resentment. Nobody does it | credit system | **S** |
| 5 | **AI-provenance fields + per-platform disclosure propagation** | Legal requirement, not a feature. Two weeks | — | **S–M** |
| 6 | **"Edit in Descript" button** (`POST /edit_in_descript/schema`) | One endpoint, no metering problem, real user value | Descript token | **S** |
| 7 | **Canva Connect autofill + export** | Brand-template autofill at scale; competitors only open a tab | Canva OAuth | **M** |
| 8 | **Newsletter→social loop: beehiiv webhook + Kit + Substack RSS** | Cleanly buildable, well-documented APIs, real agency demand | — | **M** |
| 9 | **Podcast→clips loop: Transistor/Buzzsprout/Riverside ingest** | Authorised ingest that bypasses the YouTube problem entirely | 3 | **M** |
| 10 | **Per-market localisation as a publish option** (dub + lipsync + caption) | Verified on 3 APIs, <$30 per video per 20 markets, **shipped by nobody** | 3, ElevenLabs/HeyGen | **L** |
| 11 | **Synthetic UGC via Creatify/HeyGen embed** | $0.50 per 20-second ad; $10/client/month for 20 variants | consent artifacts (§12.5) | **M** |
| 12 | **Publish the C2PA platform-strip matrix** | Two days; novel; category-authority artifact | — | **S** |

**The sequencing logic:** items 1–5 are cheap, compliant, and independent of any vendor relationship.
Item 3 is the big one and it is a *rebuild*, not an integration. Items 6–9 are integrations that
extend reach without adding cost-of-goods. Items 10–11 are the margin-bearing premium features, and
both carry disclosure obligations that item 5 must land first.

---

## 15. Verification ledger — what must be re-checked before it is load-bearing

| # | Claim | Status | Where to verify |
|---|---|---|---|
| 1 | **Opus Clip / Vizard / Klap / Submagic / Munch / 2Short / Vidyo / Chopcast / Wisecut** — all pricing, minute caps, API surfaces | **`UNVERIFIED`** | Vendor sites + developer docs |
| 2 | **Whether Descript's `/jobs/agent` honours reframe/caption instructions in the prompt** | **`UNVERIFIED` — highest-value experiment in this file** | Obtain a token; run it |
| 3 | Descript **credit cost per agent job / per publish** | **`UNVERIFIED`** (`reconciled: false`) | `docs.descriptapi.com`, Descript support |
| 4 | Whether Descript offers **any reseller/embed tier** | **`UNVERIFIED`** | Descript sales |
| 5 | **HeyGen and Synthesia per-unit rates** | **`UNVERIFIED`** (plans files are scaffolds) | `heygen.com/pricing`, `synthesia.io/pricing` |
| 6 | **Podcastle/Async monthly prices and per-hour API rate** | **`UNVERIFIED`** | `async.com/pricing` |
| 7 | **CapCut commercial terms and content licence** | **`UNVERIFIED`** | `capcut.com` ToS — **get counsel** |
| 8 | **VEED and Kapwing 2026 API existence** | **`UNVERIFIED`** | Vendor sites |
| 9 | **Predis.ai / Ocoya / Lately.ai / Copy.ai / Arcads** — everything, including company status | **`UNVERIFIED`** | Vendor sites |
| 10 | **Flick** — which of three companies the brief means (§6.4) | Disambiguated `[GH]`; `flick.social` itself **`UNVERIFIED`** | `flick.social` |
| 11 | **Repurpose.io / Castmagic / Chopcast** — API existence | **`UNVERIFIED`** (none found) | Vendor sites |
| 12 | **All platform AI-labelling policies** (§12.1) | **`[K]`, cutoff May 2026** | `transparency.meta.com`, `newsroom.tiktok.com`, YouTube Help |
| 13 | **C2PA platform-strip behaviour** per platform per media type | **`UNVERIFIED`** | Measure it ourselves (§12.2) |
| 14 | **User-review sentiment** for every vendor here | **Not sourced** — G2/Capterra/Trustpilot/Reddit unreachable | Re-run when web access returns |
| 15 | Creatify, beehiiv, Kit, Transistor, Descript plan prices | `[GH]` but **`reconciled: false`** on several files | Vendor pricing pages |
| 16 | **Model prices in §10** | `[CORPUS]` from LiteLLM, Aug 2026 | `BerriAI/litellm` — re-pull; **prices and deprecations move fast** |

---

## 16. Sources

### 16.1 Retrieved this session (GitHub-hosted, all re-checkable)

| Source | URL |
|---|---|
| Descript API profile, OpenAPI, plans, rate limits | `https://github.com/api-evangelist/descript` |
| — main endpoint spec (87 KB) | `.../descript/main/openapi/descript-api-endpoints-api-openapi.yml` |
| — Edit-in-Descript spec | `.../descript/main/openapi/descript-edit-in-descript-api-openapi.yml` |
| — Export-from-Descript spec | `.../descript/main/openapi/descript-export-from-descript-api-openapi.yml` |
| — plans / rate limits | `.../descript/main/plans/descript-plans-pricing.yml`, `.../rate-limits/descript-rate-limits.yml` |
| Riverside profile + 4 OpenAPI files | `https://github.com/api-evangelist/riverside` |
| Creatify profile, plans, AI Shorts spec | `https://github.com/api-evangelist/creatify` |
| ElevenLabs profile (22 API families), dubbing + STT specs | `https://github.com/api-evangelist/elevenlabs` |
| HeyGen profile + 12 OpenAPI files | `https://github.com/api-evangelist/heygen` |
| Synthesia profile + 7 OpenAPI files incl. dubbing | `https://github.com/api-evangelist/synthesia` |
| Canva profile + autofill/export specs | `https://github.com/api-evangelist/canva` |
| beehiiv profile, plans, rate limits, 24 OpenAPI files | `https://github.com/api-evangelist/beehiiv` |
| Kit / ConvertKit profile, plans, rate limits | `https://github.com/api-evangelist/convertkit` |
| Transistor profile, plans, rate limits | `https://github.com/api-evangelist/transistor` |
| Buzzsprout profile, plans | `https://github.com/api-evangelist/buzzsprout` |
| Podcastle / Async profile, plans | `https://github.com/api-evangelist/podcastle` |
| Suno profile, plans, FinOps (no sanctioned API) | `https://github.com/api-evangelist/suno` |
| SOUNDRAW profile | `https://github.com/api-evangelist/soundraw` |
| Substack profile (no developer API) | `https://github.com/api-evangelist/substack` |
| Flick profile (identity disambiguation) | `https://github.com/api-evangelist/flick` |
| Jasper rate limits | `https://github.com/api-evangelist/jasper` |
| OpusClip / Opus profiles (stubs) | `https://github.com/api-evangelist/opusclip`, `.../opus` |
| Kapwing profile (stub) | `https://github.com/api-evangelist/kapwing` |
| **AutoClip** — OSS clipper, full pipeline + honest limitations | `https://github.com/artbyjazi/autoclip` |
| AI-Youtube-Shorts-Generator (★4,573) | `https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator` |
| supoclip (★1,053) | `https://github.com/FujiwaraChoki/supoclip` |
| ClippedAI (★188) | `https://github.com/Shaarav4795/ClippedAI` |
| Sharetape (★118) | `https://github.com/adhikary97/Sharetape-Open-Source` |
| capcut-mate (★1,558) | `https://github.com/Hommy-master/capcut-mate` |
| capcut-cli (★333) — incl. security advisories | `https://github.com/renezander030/capcut-cli` |
| CapCutAPI-Complete (★93) | `https://github.com/chenzhaohua11/CapCutAPI-Complete` |
| capcut-tts-api (★259) / CapCut-TTS (★108) | `https://github.com/K07VN/capcut-tts-api`, `https://github.com/kuwacom/CapCut-TTS` |
| dreamina2api (★106) | `https://github.com/dongshuyan/dreamina2api` |
| C2PA Rust SDK (spec 2.2, CAWG) | `https://github.com/contentauth/c2pa-rs` |
| OpusClip-alternatives list — **promotional, `[3P-LOW]`** | `https://github.com/cipher-vault-hq/awesome-free-opusclip-alternatives` |

**Provenance caveat on the API Evangelist profiles**, stated by the source itself: these are
independent third-party profiles assembled from publicly reachable material (websites, developer
portals, published OpenAPI/`llms.txt`/`apis.json`, public repositories, public pricing/changelog
pages). **They are not vendor-authored.** Files marked `reconciled: false` are explicitly
unreconciled against live pricing; the HeyGen and Synthesia plans files are **scaffolds, not data**,
and are treated as `UNVERIFIED` throughout.

### 16.2 Internal corpus

- `09-ai-frontier.md` — §2.4 (AI-native point tools), §2.5 (capability matrix), §2.6 (the credit-meter
  problem), §3.3 (avatars), §3.4 (voice/TTS/STT costs), §3.5 (lipsync/dubbing), §3.6 (auto-editing +
  the OSS pipeline), §3.7 (music licensing), §3.8 (aggregators), §7.1–7.8 (model economics, latency,
  credit design), §8.3 (C2PA), §8.4 (platform labelling), §8.5 (likeness law)
- `06-platform-apis-tier1.md` — §publishing scopes, TikTok Content Posting audit, YouTube quota
  arithmetic, approval timelines
- `04-competitors-smb.md` — §10.3 ("Video AI — the clearest gap in the market")
- `03-competitors-enterprise.md` — enterprise AI posture
- `01-vista-social-full-audit.md` — AI credits, the metering failure mode

### 16.3 Sources that could NOT be reached this session

`opus.pro`, `vizard.ai`, `klap.app`, `submagic.co`, `munch.io`, `2short.ai`, `vidyo.ai`,
`chopcast.io`, `wisecut.video`, `descript.com`, `riverside.fm`, `castmagic.io`, `repurpose.io`,
`kapwing.com`, `veed.io`, `capcut.com`, `developer.capcut.com`, `canva.com`, `canva.dev`,
`heygen.com`, `docs.heygen.com`, `synthesia.io`, `arcads.ai`, `creatify.ai`, `elevenlabs.io`,
`docs.elevenlabs.io`, `suno.com`, `podcastle.ai`, `transistor.fm`, `beehiiv.com`,
`developers.beehiiv.com`, `substack.com`, `predis.ai`, `ocoya.com`, `lately.ai`, `flick.social`,
`copy.ai`, `jasper.ai`, `c2pa.org`, plus **G2, Capterra, Trustpilot, Reddit and X**, and
`google.com`, `en.wikipedia.org`, `developer.mozilla.org`.

All returned `403` from the organisation's egress proxy at the CONNECT stage, or were unreachable
because the `WebSearch` budget (200/200) was exhausted before this file began. **Any fact depending
on one of these hosts is graded `[K]` or `UNVERIFIED` accordingly, and is listed in §15.**

---

*End of `26-repurposing-and-creator-tools.md`. Written 12 August 2026.*
