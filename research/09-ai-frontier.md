# 09 — The AI Frontier for Social Media, August 2026

**What competitors ship, what is technically possible and unshipped, and what the gap is worth.**

Research date: **12 August 2026**.
Scope: AI capabilities in social media management tools; frontier generative media; agentic
patterns; prediction and optimisation; AI-search / GEO / AEO visibility; model economics;
rights, disclosure and safety.

---

## 0. Read this first — research constraints and evidence grading

### 0.1 Constraint disclosure (important — do not skip)

This dossier was produced under a **severely degraded network environment** relative to the
earlier files in this corpus:

| Capability | Status this session |
|---|---|
| `WebSearch` | **Exhausted** — the session's 200-call budget was consumed by earlier agents before this file began. Zero searches were available. |
| `WebFetch` / `curl` to vendor sites | **Blocked by organisation egress policy** for effectively every commercial domain tested: `openai.com`, `platform.openai.com`, `docs.anthropic.com`, `elevenlabs.io`, `heygen.com`, `fal.ai`, `replicate.com`, `huggingface.co`, `arxiv.org`, `news.ycombinator.com`. All returned `EGRESS_BLOCKED`. |
| `github.com` / `raw.githubusercontent.com` | **Reachable.** This became the primary live-research channel. |
| GitHub REST search (via MCP) | **Reachable.** |
| Prior research corpus (`01`–`07` in this directory) | **Available**, and was gathered when full web access existed. |

**What this means for you.** Every hard number in this file is either (a) pulled this session
from a machine-readable artifact hosted on GitHub, (b) computed by me from such an artifact,
(c) carried from this repository's earlier research files, or (d) drawn from model knowledge
with a **May 2026 training cutoff** and explicitly flagged. Nothing is invented. Where a fact
mattered and could not be confirmed, it is marked `UNVERIFIED` rather than smoothed over.

**Two consequences worth internalising:**

1. **Vendor marketing pages were unreadable.** Feature claims for Predis.ai, Ocoya, Lately.ai,
   Flick, Taplio, Opus Clip, Vizard, Klap and Submagic could not be re-verified against their
   own sites. They are reported at `[K]` grade and flagged.
2. **The pricing data is unusually good anyway**, because the single best machine-readable
   source for AI model economics — LiteLLM's `model_prices_and_context_window.json`,
   3,003 model entries — is hosted on GitHub and was downloaded in full. That file is the
   backbone of §7 and is *more* current and more precise than what a marketing page would
   have given.

### 0.2 Evidence grades used throughout

| Grade | Meaning |
|---|---|
| `[GH]` | Verified this session from a GitHub-hosted artifact (SDK source, provider API profile, machine-readable pricing DB, standards repo). Highest confidence. |
| `[CALC]` | Arithmetic I performed on `[GH]` data. The inputs are cited; the arithmetic is mine. |
| `[CORPUS]` | Carried from `01`–`07` in this directory, gathered with full web access on 12 Aug 2026. Inherits their own grading. |
| `[K]` | Model knowledge, training cutoff **May 2026**. Plausible, widely-reported, but **not re-verified this session**. Treat as needing confirmation before it becomes load-bearing. |
| `UNVERIFIED` | Could not be established. Stated as unknown. |

### 0.3 Primary artifacts pulled this session

| Artifact | What it gave |
|---|---|
| `BerriAI/litellm` → `model_prices_and_context_window.json` (1.70 MB, 3,003 entries) | Per-token, per-image, per-second, per-character pricing for text, image, video, TTS and STT models across ~40 providers. |
| `openai/openai-python` → `types/video_create_params.py`, `types/video.py`, `types/image_generate_params.py` | Exact Sora 2 and GPT-image API surface: allowed models, durations, resolutions, job lifecycle. |
| `googleapis/python-genai` → `google/genai/types.py` (872 KB) | Exact Veo and Imagen config surface incl. `generate_audio`, `add_watermark` (SynthID), `person_generation`. |
| `api-evangelist/*` (30+ provider profiles, last modified 11–12 Aug 2026) | API base URLs, auth models, async patterns, credit pricing, rate-limit semantics for HeyGen, Runway, Kling, Luma, MiniMax/Hailuo, Creatify, Argil, Akool, Sync Labs, Ideogram, Cartesia, Podcastle, Lightricks/LTX, Suno, Udio, Midjourney, Stability, Leonardo, Freepik and more. |
| `ai-robots-txt/ai.robots.txt` → `robots.json` (163 crawler entries) | The definitive registry of AI crawler user-agents, their operators, stated function, and whether they respect `robots.txt`. |
| `punkpeye/awesome-mcp-servers` → `README.md` (1.34 MB) | Live inventory of the MCP-for-social ecosystem: 45 social-media servers, 71 marketing servers, ~80 browser-automation servers. |
| `contentauth/c2pa-rs` → `README.md` | Current C2PA spec version and CAWG identity assertion status. |
| `studio121-develop/ai-act-compliance-skill` → `LAST_VERIFIED.md`, `references/transparency-implementation.md` | EU AI Act timeline verified against EUR-Lex on 2026-07-20, incl. the Digital Omnibus postponements and what was *not* postponed. |
| `EdgeF-4/ai-act-kit` → `docs/article-50.md` | Practitioner breakdown of Article 50 provider-vs-deployer duties and the honest limits of text watermarking. |
| `amanzainal/c2pa-stripcheck` | The four-verdict taxonomy for what platforms do to Content Credentials on upload. |

---

## 1. Executive summary — the shape of the 2026 frontier

### 1.1 Twelve findings that matter

1. **Every major SMM vendor shipped a branded "agent" inside a 14-month window, and none of them shipped autonomy.** Sprout `Trellis` (GA July 2026), Hootsuite `Wisdom` (live 24 Jun 2026), Sprinklr `AI+ Studio` / `AI Agent Studio`, Emplifi `AI Composer`, HubSpot `Breeze`, Brandwatch `Iris`, Talkwalker `Blue Silk`. What they actually are: workflow builders plus copilots. `[CORPUS]`

2. **The SMB tier's AI is, almost without exception, a caption generator behind a credit meter.** The prior audit's verdict — "the marketing language is uniform and the underlying capability is a thin wrapper over a frontier model with a prompt template" — held across Buffer, Publer, Metricool, Later, Hypefury, Typefully, Tailwind, Loomly and Social Champ. `[CORPUS]`

3. **Video is the single largest unclaimed adjacency in the category.** Long-form → short-form clip extraction (the Opus Clip / Vizard / Klap / Submagic capability) exists in **no** SMB-tier social media management tool. Customers bridge it with a second subscription. `[CORPUS]`

4. **Generative video is now cheap enough to be a bundled feature, not a separate product.** Veo 3.1 Lite is **$0.05/sec at 720p** and **$0.08/sec at 1080p**; Runway Gen-4 Turbo is **$0.05/sec**; Sora 2 is **$0.10/sec**. A brand posting one 15-second AI clip every day for a month costs **$22.50 on Veo 3.1 Lite** or **$45 on Sora 2**. `[GH]` `[CALC]`

5. **Caption generation costs approximately nothing.** With a 2,500-token conditioned prompt and 300 tokens out, a caption costs **$0.00037 on Gemini 2.5 Flash-Lite**, **$0.00025 on GPT-5-nano**, **$0.004 on Claude Haiku 4.5**. That is **2,700 captions per dollar** at the cheap end. Any vendor metering captions as scarce "AI credits" is metering a rounding error. `[CALC]`

6. **The expensive AI is not generation — it is *evaluation*.** Ranking, scoring, critiquing, predicting and monitoring at scale is where the tokens go, because those workloads run on every post, every variant and every competitor, continuously, rather than once per human request.

7. **MCP became the enterprise integration standard in 2026, and the long tail beat the incumbents to it.** Hootsuite and Sprinklr shipped MCP in 2026; Vista Social already had a ~60-tool MCP server. `[CORPUS]` Meanwhile the open ecosystem now carries **45 social-media MCP servers** and **71 marketing MCP servers** in one curated list alone. `[GH]`

8. **Cookie-session and browser-driven agents are quietly solving the API-access problem** that this corpus's `05`/`06` files describe as the category's hardest constraint. Public MCP servers now drive X and LinkedIn through a real authenticated Chrome session with **no platform API key** — 33-tool and 34-tool surfaces respectively. `[GH]` This is technically potent, contractually radioactive, and nobody credible has productised it.

9. **AI-answer visibility (GEO/AEO) is the highest buyer-interest-to-build-cost ratio in the market, and exactly one vendor in the SMM/listening space has claimed it** — Meltwater's `GenAI Lens`. `[CORPUS]` Meanwhile an entire independent tooling ecosystem has formed around it: I catalogued **13+ distinct AI-visibility MCP servers and open-source scanners** built in the last six months. `[GH]`

10. **The cost of running a real GEO monitoring product is trivial.** 5 engines × 200 buyer prompts, weekly, is **$26.40/month** in model and search spend. `[CALC]` Meltwater sells the category inside contracts with a **median ~$25,000/year**. `[CORPUS]`

11. **EU AI Act Article 50 transparency obligations came into force ten days ago — 2 August 2026 — and were explicitly *not* postponed by the Digital Omnibus.** The watermarking grace period for pre-existing systems ends **2 December 2026**. Fines under Art. 99(4) reach **€15M or 3% of worldwide annual turnover**, whichever is higher. `[GH]`

12. **No social media management tool currently writes C2PA Content Credentials onto the media it generates or publishes.** This is now a legal exposure, not a nice-to-have, and it is a two-week build.

### 1.2 The 100x claim, stated precisely

"100x" is not defensible as "100x better captions." Caption quality is capped by the frontier
model, which every competitor can also call. The defensible reading is **100x on throughput,
coverage and closed-loop learning per unit of human attention**, decomposed as:

| Axis | Category baseline today | What is technically available in Aug 2026 | Multiple |
|---|---|---|---|
| Assets produced per brand-hour | 1 human writes ~5–10 posts/hr with a caption assistant | Agent produces 50–200 candidate assets (copy + image + video + variants) per brand-hour at <$5 media cost | **10–20x** |
| Formats covered | Static image + text; video is manual | Static, carousel, short-form video, avatar UGC, dubbed multilingual, auto-clipped long-form — all API-reachable | **5–8x** |
| Variants tested per creative decision | 1 (ship it) | 8–32 arms under a bandit, allocated by live engagement | **8–32x** |
| Surfaces optimised | Social feeds only | Social feeds **plus** AI answer engines (ChatGPT / Perplexity / Gemini / AI Overviews / Copilot) | **2x surfaces, net-new** |
| Learning loop latency | Monthly human report | Per-post, per-variant, continuous, feeding the next generation | **~30x** |
| Languages / markets | 1–2, hand-translated | 30+ via dubbing + lipsync + per-market voice at $0.04–0.05/sec | **15x+** |

The product of "10–20x assets" and "8–32x variants" alone exceeds 100x in *decisions
evaluated per human hour*. That is the honest, arithmetic form of the claim, and every
input to it is priced in §7.

### 1.3 The five things nobody ships (the actual whitespace)

1. **A closed loop.** Generate → publish → measure → attribute → regenerate, automatically. Every vendor has generation and measurement as *disconnected* modules. Nobody feeds performance back into generation without a human in the middle.
2. **Video as a first-class primitive inside the scheduler.** Not "we integrated Canva." Clip extraction, avatar UGC, dubbing, auto-captioning, reframing — inside the composer, on the calendar, in the credit meter.
3. **Multi-armed-bandit creative allocation on organic social.** Universal in paid media. Absent from organic. The platform APIs make it awkward but not impossible.
4. **AI-answer visibility measured and optimised from the same content graph as social.** One vendor sells the measurement (Meltwater). Zero vendors connect it to publishing.
5. **Provenance and disclosure as infrastructure.** C2PA signing at generation, per-platform AI-label propagation at publish, agent decision traces as audit-log entries. All three are legally required or imminent, all three are cheap, none are shipped.

---

## 2. What SMM tools actually ship today

### 2.1 The commodity layer — present in essentially every tool

These capabilities are table stakes as of Aug 2026 and confer no differentiation whatsoever.
All are thin wrappers over a frontier chat model with a prompt template. `[CORPUS]` `[K]`

| Capability | Ubiquity | Underlying implementation | Real cost per invocation `[CALC]` |
|---|---|---|---|
| Caption generation from a prompt | Universal | Single chat completion | $0.0004–$0.008 |
| Caption rewrite / tone shift / shorten / lengthen | Universal | Same, with the original in context | $0.0004–$0.008 |
| Hashtag generation | Universal | Same call, different template | ~$0.0003 |
| Emoji injection | Universal | Same call | ~$0.0002 |
| Per-network variation ("adapt this for LinkedIn") | Common | One call per network, or one call returning N | $0.001–$0.01 total |
| Translation / target language | Common | Same call | ~$0.0005 |
| Reply suggestion in inbox | Common | Chat completion over thread context | $0.001–$0.01 |
| Review response generation | Common (tools with review modules) | Same | $0.001–$0.01 |
| Sentiment classification | Universal in listening tools | Classifier or small LLM | $0.00002–$0.0002 |
| Image generation | Common | Provider passthrough (DALL·E/GPT-image, Imagen, Flux, Canva) | $0.002–$0.25 |
| AI alt-text | Rare→spreading | Vision model call | ~$0.0005 |

**The strategic read:** everything in this table is a solved problem whose marginal cost is
between a hundredth and a tenth of a cent. It is not a moat. It is a checkbox. Competing on it
is competing on nothing. The corpus's own SMB audit reached the same verdict independently:
"**Almost none** [have genuinely good AI]. AI in this tier is overwhelmingly a caption generator
behind a credit meter." `[CORPUS]`

### 2.2 Enterprise tier — the 2026 agent land-grab

Verified from `03-competitors-enterprise.md`. `[CORPUS]`

| Vendor | Agent brand | Announced | Status Aug 2026 | What it actually is |
|---|---|---|---|---|
| **Sprout Social** | `Trellis` + `Trellis Studio` | 13 May 2026 | GA to all customers July 2026 | Agentic engine across Publishing, Listening, Smart Inbox, Reporting. `Trellis Studio` builds "bespoke AI workflows"; ships **Skills** = "pre-built, recurring conversation starters." Named example Skills: summarise inbox activity; identify negative sentiment and complaints to speed response. |
| **Hootsuite** | `Wisdom` (+ Social OS: Perch / Nest / Lumen / Parliament) | 24 Jun 2026 | Live worldwide | "Social-first AI agent… powered by 15+ years of proprietary social data and more than 150M monitored data sources." Consolidates `OwlyWriter AI` and `Blue Silk AI` (one source; conflicting). **MCP in both directions**: Hootsuite capabilities exposed *into* Claude / ChatGPT / Gemini / Copilot. |
| **Sprinklr** | `AI+ Studio`, `AI Agent Studio` (ex-Digital Twin Studio), `Autonomous Evaluation` | Spring '26 (26.4, from 27 Mar 2026) + Summer '26 (15 Jul 2026) | Shipping; **Sprinklr MCP in Beta** | Deepest stack in the market. Summer '26 shipped 16 AI features incl. **Voice AI agents** (sub-second response, turn-taking, noise handling), **AI content generation in Copilot incl. video**, **Agent Quality Assurance** (testing/simulation/quality scoring *before* deployment), and **ViralMoment video intelligence** (acquired; frame-by-frame video/audio/image/text analysis). Explicit autonomy model: **fully autonomous, semi-autonomous and AI-assisted**. |
| **Emplifi** | `AI Composer`, `AI Query Copilot`, `AI Data Summarization` | 2023→2026 | Shipping | "Industry-first GPT-powered social copywriting assistant" with **Brand Voice**; natural-language querying of analytics. |
| **Meltwater** | `GenAI Lens` | 2025–26 | Shipping | **AI-answer visibility tracking** — brand presence inside ChatGPT / Perplexity / Gemini answers. One of eight suite areas. See §6. |
| **Talkwalker** (Hootsuite) | `Blue Silk AI`, `Blue Silk GPT` | 2023→ | Powers Hootsuite `Lumen` | Sentiment, automated conversation clustering, competitive benchmarking; generative distillation of listening data flagging brand activity, consumer pain points, potential crises. |
| **Brandwatch** | `Iris` | 2023→ | Shipping | AI analyst: anomaly detection, automated insight summaries, conversational Q&A. |
| **HubSpot** | `Breeze` agents | 2025 | Shipping | `Breeze Social Agent` generates and schedules posts from brand voice; `Breeze Content Agent`; `Breeze Customer Agent`. |
| **Khoros** | — | — | **No branded agentic layer surfaced.** | Thinnest agentic story of the enterprise CXM vendors. `UNVERIFIED` whether one exists and simply did not surface. |
| **Dash Social** | `Vision AI` | — | Shipping | **Pre-publish performance prediction** and Predictive Ranking of creative. Genuinely differentiated — see §5.1. |

**Three structural observations, carried forward from the enterprise audit and still correct:** `[CORPUS]`

- **"Agentic" mostly means workflow builder + copilot, not autonomy.** These are orchestration
  surfaces, not autonomous operators.
- **Sprinklr is alone in building the trust layer.** `Autonomous Evaluation` gives "clear,
  explainable logs and test-backed validation"; `Agent Quality Assurance` validates agent
  behaviour *before* deployment. This is the correct enterprise answer and the single most
  copyable idea in the competitive set.
- **MCP became the integration standard.** And the mid-market reached it before the enterprise.

### 2.3 SMB / mid-market tier

From `04-competitors-smb.md`, which tiered the entire segment. `[CORPUS]`

| Tier | Products | What they actually do |
|---|---|---|
| **Meaningfully differentiated** | SocialBee (AI copilot generating a full category/cadence posting *plan*), Vista Social (AI Assistant + per-profile-group Brand Voice + Knowledge/RAG), ContentStudio (discovery-fed generation) | AI shapes strategy, or is fed by a proprietary data source, rather than merely generating prose |
| **Competent commodity** | Buffer, Publer, Metricool, Later, Hypefury, Typefully, Tailwind (Ghostwriter), Loomly, Social Champ | Caption generation, rewriting, tone shifting, hashtag suggestion, some image generation |
| **Thin or absent** | MeetEdgar, Crowdfire, Kontentino, Sked Social, Pallyy, NapoleonCat | Little to none |

**Vista Social's AI layer** is the most complete in the mid-market and is worth enumerating
because it defines the parity bar. `[CORPUS]`

- **Two branded surfaces:** inline `AI Assistant` (composer / inbox / reviews) and `Ask Vista`
  (conversational command centre). Underlying model described as ChatGPT/OpenAI.
- **`Ask Vista` capabilities:** post ideas; **trend queries** ("what's trending in beauty in the
  UK right now?"); from a trend, pick an angle — **Newsjack it / Educational / Hot take /
  Promotional / Ask the audience** — and get AI images, source links, brand-voiced captions,
  then schedule and publish inline; generate replies to comments/DMs/reviews/mentions.
- **Composer:** generate caption, regenerate for variations, improve/rewrite, translate,
  hashtag generation, **image generation**, **video generation (text-to-video, animate an
  uploaded photo, animate a library asset)**, **AI image editing**.
- **Brand Voice:** `Settings → Profile groups → [group] → Brand voice → Edit Policy`. **Per
  profile group**, so each agency client gets an isolated voice. Free-text policy. Applied
  automatically across caption generation, replies, review responses and Smart Publishing. A
  separate **brand safety policy** applies automatically in Smart Publishing.
- **AI Training & Knowledge (RAG):** create **Knowledges**; ingest by document import, typed
  specification, or **connecting Zendesk to upload an entire knowledge base**; assign a
  Knowledge to a chatbot block; **Test tab** for Q&A before going live. Brand voice controls
  *style*, Knowledge controls *substance*, and they compose. The prior audit called this "a
  genuinely sophisticated capability for this market segment" and a parity requirement.
- **Smart Publishing with AI (2026):** auto-generate post ideas and captions from selected
  topics/prompts/themes with brand voice and brand-safety policy applied automatically.
- **Dynamic AI Reply:** a custom prompt generates a fresh, human-like response per interaction, in brand voice.
- **AI credits:** metered monthly; **confirmed consumers are AI image generation and AI image
  editing**. Whether caption/reply generation consumes credits is `UNVERIFIED`. Video generation
  consumption is `UNVERIFIED`. **Unlimited AI at Scale and Enterprise.** No published per-credit
  overage price. Plan allowances conflict across sources (500/1,000 vs 2,500/10,000 per month).
- **Reported weaknesses:** "AI limitations in captioning various languages" — multilingual
  quality is a stated user pain point; sentiment analysis and AI-driven content recommendations
  described as limited for enterprise needs.

**Per-client brand voice isolation is the one checkable differentiator in this tier.** An agency
running 30 clients needs 30 isolated voices, not one account-level tone setting. Vista does this
(per profile group). Most implementations ignore it. `[CORPUS]`

### 2.4 AI-native point tools

**These could not be re-verified this session** (vendor domains blocked, search budget exhausted).
The following is `[K]` at May 2026 and **must be re-checked before it becomes load-bearing.**

| Tool | Positioning `[K]` | Distinctive claim `[K]` | Verification status |
|---|---|---|---|
| **Predis.ai** | AI social post generator producing *designed* creatives, not just captions | Generates carousel/video/static creatives with layout and text baked in, from a product URL or prompt; multi-lingual; competitor-analysis input | Feature set `[K]`. Pricing/limits `UNVERIFIED`. |
| **Ocoya** | AI copy + design + scheduling combined | Templates + AI copy + e-commerce product feed integration; positioned as "Canva + Buffer + ChatGPT" | `[K]`. Company status and 2026 feature set `UNVERIFIED`. |
| **Lately.ai** | "Brand-voice-trained" long-form → social atomisation | Trains on a corpus of a brand's historic high-performing content, then slices long-form (blogs, podcasts, video transcripts) into social posts *keyed to phrases that historically performed* | This is the most *architecturally* interesting claim in the group — it is the closest thing in market to closed-loop generation. Whether the model is genuinely fit per-brand vs. prompt-conditioned is `UNVERIFIED` and always has been. |
| **Flick** | Instagram-first hashtag intelligence, expanded to an AI assistant ("Iris") | Hashtag performance analytics — which hashtags actually drove reach — which is precisely the gap the Vista audit identified as missing market-wide | `[K]`. 2026 state `UNVERIFIED`. |
| **Taplio** | LinkedIn-only growth tool | AI post generation conditioned on a scraped corpus of high-performing LinkedIn posts; lead/engagement automation; **single-network depth over breadth** | `[K]`. Note: LinkedIn ToS exposure on the scraping/automation side is real and persistent. |
| **Podcastle** | AI audio/podcast creation; developer engine **Async** | **Verified `[GH]`:** Voice API at `https://api.async.com`, `x-api-key` + version header. Endpoints `/text_to_speech`, `/text_to_speech/streaming`, `/text_to_speech/with_timestamps`, `/text_to_speech/websocket/ws`. Models `async_pro_v1.0` and `async_flash`. **Instant voice cloning** at `POST /voices/clone` from a short sample, multipart, **no training step**. Voice library browsing at `POST /voices` with filters for model/language/accent/gender/style. | API surface `[GH]`. Transcription is a platform feature; **no standalone transcription endpoint** in the public Voice API `[GH]`. |

**Hootsuite's pre-agent AI, for the record** `[CORPUS]`: `OwlyWriter AI` — caption generation,
content ideas, hashtag generation, plus a library of "more than one million high-quality images,
videos, GIFs and text snippets." A **generative-AI chatbot** is an Enterprise-tier unlock.
Hootsuite Enterprise requires a **minimum of 5 seats**.

### 2.5 Capability parity matrix — who ships what

Compiled from `[CORPUS]` plus `[K]`. `●` = ships and it is real; `◐` = ships something thin or
gated; `○` = does not ship.

| Capability | Sprout | Hootsuite | Sprinklr | Vista | Buffer | Later | Publer | Metricool | SocialBee | Predis `[K]` | Opus Clip `[K]` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Caption generation | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ○ |
| Brand voice (persisted) | ● | ◐ | ● | ● | ◐ | ◐ | ◐ | ◐ | ● | ● | ○ |
| **Per-client voice isolation** | ◐ | ◐ | ● | **●** | ○ | ○ | ○ | ○ | ◐ | ◐ | ○ |
| Knowledge base / RAG grounding | ◐ | ◐ | ● | **●** | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Hashtag generation | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ○ |
| **Hashtag *performance* analytics** | ◐ | ◐ | ◐ | **○** | ○ | ○ | ○ | ◐ | ○ | ○ | ○ |
| Image generation | ● | ● | ● | ● | ◐ | ◐ | ● | ○ | ◐ | ● | ○ |
| Image editing (AI) | ○ | ○ | ◐ | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| **Designed creative** (layout + text-in-image) | ○ | ○ | ◐ | ◐ (Canva) | ◐ (Canva) | ◐ | ○ | ○ | ◐ (Canva) | **●** | ○ |
| Text-to-video | ◐ | ○ | ● | **●** | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| **Long-form → short clips** | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | **●** |
| Auto-captions / subtitles burn-in | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | **●** |
| Avatar / UGC actor video | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ○ |
| Dubbing / translation with lipsync | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| AI inbox replies | ● | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| AI review responses | ◐ | ◐ | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Sentiment | ● | ● | ● | ◐ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ |
| AI reporting narrative | ● | ● | ● | ◐ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ |
| Pre-publish performance prediction | ◐ | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● (virality score) |
| Branded agent | ● Trellis | ● Wisdom | ● AI+ Studio | ◐ Ask Vista | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| **MCP server** | ○ | ● | ● (beta) | **●** (~60 tools) | ○ | ○ | ○ | ○ | ○ | ○ | ◐ `[GH]` |
| **AI-answer visibility** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| **C2PA / content credentials** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| **Agent decision audit trail** | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| **Bandit creative allocation** | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

The bottom five rows are the whitespace. Four of them are empty across the entire market.

### 2.6 The credit-meter problem

Every SMB and mid-market vendor meters AI on "credits." Vista Social's are the best-documented
and demonstrate the failure mode: `[CORPUS]`

- Credits are **confirmed** to be consumed by image generation and image editing.
- Whether captions consume credits is **UNVERIFIED even to a determined researcher reading the
  vendor's own help centre.**
- Plan allowances **conflict between sources** (500/1,000 vs 2,500/10,000 per month).
- There is **no published per-credit price** and no confirmed overage top-up path.

Users' recorded complaint across the tier is that "credit-based AI feels nickel-and-dimed"
and that the "credit model frustrates heavy users." `[CORPUS]`

**The arithmetic reason this is a self-inflicted wound:** the things being metered mostly cost
nothing. A caption is $0.0004. A hashtag set is $0.0003. The only genuinely expensive
operations are image generation ($0.002–$0.25), video ($0.05–$0.50/sec) and long-audio
transcription. A credit system that meters all of them on one opaque scale trains users to
believe text generation is scarce — which is false — while giving no signal about the
operations that actually cost money. §7.7 proposes the alternative.

---

## 3. Frontier generative media — what is buyable via API today

### 3.1 Text-to-video

#### 3.1.1 The pricing reality

All figures `[GH]` from LiteLLM `model_prices_and_context_window.json` unless noted, cross-checked
against `api-evangelist` provider plan files where available.

| Model | Provider | Unit price | 8s clip | 15s clip | 30s clip | Notes |
|---|---|---|---|---|---|---|
| **Veo 3.1 Lite** (720p) | Google | **$0.05/sec** | $0.40 | $0.75 | $1.50 | Cheapest frontier-quality option in the table |
| **Veo 3.1 Lite** (1080p) | Google | **$0.08/sec** | $0.64 | $1.20 | $2.40 | |
| **Veo 3.1 Fast** | Google | $0.15/sec | $1.20 | $2.25 | $4.50 | Model IDs `veo-3.1-fast-generate-001`, `-preview` |
| **Veo 3.1** | Google | $0.40/sec | $3.20 | $6.00 | $12.00 | `veo-3.1-generate-001` |
| **Veo 2** | Google | $0.35/sec | $2.80 | $5.25 | $10.50 | **Deprecation date `2026-06-30`** — already past. Do not build on it. |
| **Sora 2** | OpenAI | **$0.10/sec** | $0.80 | $1.50 | $3.00 | Listed `deprecation_date: 2026-09-24` — **six weeks away.** |
| **Sora 2 Pro** | OpenAI | $0.30/sec | $2.40 | $4.50 | $9.00 | Same deprecation date |
| **Sora 2 Pro high-res** | OpenAI | $0.50/sec | $4.00 | $7.50 | $15.00 | Corresponds to the 1024×1792 / 1792×1024 sizes |
| **Runway Gen-4 Turbo** | Runway | **$0.05/sec** (5 credits/sec @ ~$0.01/credit) | $0.40 | $0.75 | $1.50 | |
| **Runway Gen-4 Aleph** (video-to-video) | Runway | $0.15/sec per LiteLLM; **$0.28/sec (28 credits/sec) per Runway's own pricing guide** | $1.20–$2.24 | $2.25–$4.20 | $4.50–$8.40 | **Sources conflict.** Assume the higher figure for budgeting. |
| **Runway Act-Two** (character performance) | Runway | $0.05/sec | $0.40 | $0.75 | $1.50 | |
| **Runway Gen-3 Alpha Turbo** | Runway | $0.05/sec | — | — | — | **Sunset scheduled 2026-07-30** — already past. |
| **Luma Ray-2** | Luma | **~$0.08/sec** | $0.64 | $1.20 | $2.40 | |
| **MiniMax / Hailuo 2.3** | MiniMax | Metered in "video points" per clip; reported **~$0.19–$0.56 per clip** depending on model / resolution / duration | — | — | — | Failed generations and security-blocked clips are **not charged** |
| **Kling** (v1 → v2.6, turbo/master) | Kuaishou | Prepaid resource packs; per-second credit draw varying by model and std/pro mode; **native audio roughly doubles the per-second rate** | — | — | — | Failed API tasks reported **not** to deduct resources |
| **LTX (Lightricks)** | Lightricks | Billed **per second of output**; exact rate not published in the harvested artifacts | — | — | — | Open-weight LTX-2 / LTX-Video also published under Apache-2.0 |
| **Pika** | Pika | **No first-party REST API on the main domain as of May 2026**; production access via partner aggregators, notably fal.ai | — | — | — | `[GH]` |

**Monthly cost of a daily 15-second AI video, one brand:** `[CALC]`

| Model | Cost/month (30 clips × 15s) |
|---|---|
| Veo 3.1 Lite 720p | **$22.50** |
| Runway Gen-4 Turbo | **$22.50** |
| Luma Ray-2 | $36.00 |
| Veo 3.1 Lite 1080p | $36.00 |
| Sora 2 | $45.00 |
| Veo 3.1 Fast | $67.50 |
| Sora 2 Pro | $135.00 |
| Veo 3.1 | $180.00 |

At an agency serving 50 brands with daily video on Veo 3.1 Lite, the media bill is **$1,125/month**.
That is a line item, not a business model constraint. **Generative video is now a bundled feature.**

#### 3.1.2 Sora 2 — exact API surface `[GH]`

From `openai/openai-python` `types/video_create_params.py` and `types/video.py`:

```
POST /v1/videos
  prompt          (required, str)
  model           sora-2 | sora-2-pro           (default: sora-2)
  seconds         4 | 8 | 12                    (default: 4)
  size            720x1280 | 1280x720 |
                  1024x1792 | 1792x1024         (default: 720x1280)
  input_reference (file upload OR image reference object)
```

Job object fields: `id`, `status` ∈ `queued|in_progress|completed|failed`, `progress` (0–100),
`created_at`, `completed_at`, `expires_at` (**downloadable assets expire**), `error`,
`remixed_from_video_id` (**remix lineage is first-class**).

**Product implications you cannot get from a marketing page:**
- **Maximum single generation is 12 seconds.** Anything longer requires stitching. A 30-second
  Reel is 3 generations plus a concat, and the seams are your problem.
- **720×1280 is the default and the cheap path**, and it is already the correct aspect ratio for
  Reels / Shorts / TikTok. The vertical-first default is a signal about intended use.
- **Assets expire.** Any product built on this must copy outputs to its own storage on completion,
  not store a provider URL.
- **Remix is a first-class relationship**, not a re-prompt. That is exactly the primitive a
  variant-testing system wants.

#### 3.1.3 Veo — exact API surface `[GH]`

From `googleapis/python-genai` `types.py`, `GenerateVideosConfig`:

```
number_of_videos, duration_seconds, fps, seed
aspect_ratio        "16:9" | "9:16"          (only these two documented)
resolution          "720p" | "1080p"
person_generation   "dont_allow" | "allow_adult"
negative_prompt, enhance_prompt (prompt rewriting)
generate_audio      bool                      <-- native audio
last_frame          Image                     <-- image-to-video end-frame control
reference_images    list[VideoGenerationReferenceImage]
                    (Veo 2: up to 3 asset images OR 1 style image)
mask                VideoGenerationMask
compression_quality
output_gcs_uri, pubsub_topic, webhook_config   <-- async completion
labels              dict[str,str]              <-- billing attribution
```

**Notes that matter:**
- `webhook_config` and `pubsub_topic` mean **Veo supports push completion**, unlike Runway and
  Kling which are poll-only. That materially simplifies a job queue.
- `labels` gives per-request billing attribution — you can tag generations by tenant/brand and
  reconcile cost per customer without your own accounting layer.
- `person_generation` is a hard safety control with only two documented values. Products
  serving regulated verticals will need `dont_allow` as a per-workspace policy.
- `generate_audio` is a boolean, and on Kling the equivalent **roughly doubles the per-second
  rate** `[GH]`. Budget audio separately.

#### 3.1.4 Async patterns and operational reality `[GH]`

Every serious video API is asynchronous, and the patterns differ enough to matter:

| Provider | Auth | Submit → poll | Push completion | Failure billing |
|---|---|---|---|---|
| **OpenAI Sora 2** | Bearer key | `POST /v1/videos` → poll job | Not documented in SDK types | `UNVERIFIED` |
| **Google Veo** | ADC / API key | `generate_videos` operation | **Yes** — `webhook_config`, `pubsub_topic` | `UNVERIFIED` |
| **Runway** | `Authorization: Bearer <RUNWAYML_API_SECRET>` + **dated `X-Runway-Version` header (e.g. `2024-11-06`)** | `POST /v1/image_to_video` → `GET /v1/tasks/{id}` until `SUCCEEDED`/`FAILED`. **Poll no more than once per 5s per task.** No public WebSocket. | No | `UNVERIFIED` |
| **Kling** | **JWT (HS256) minted client-side per request** from Access Key / Secret Key; `iss` = access key, `exp` ≈ +30 min, `nbf` ≈ −5 s | `POST` create task → poll `GET .../{task_id}` until `task_status == succeed`, **or supply `callback_url`** | Yes (callback URL) | **Failed tasks reported not to deduct resources** |
| **Akool** | `clientId`/`clientSecret` → Bearer via `POST /api/open/v3/getToken`, or direct `x-api-key` | Create → poll `video_status`/`image_status`/`faceswap_status` (1=queueing, 2=processing, 3=completed, 4=failed) | **Yes — encrypted webhook** (AES-256-CBC `dataEncrypt`, SHA-1 `signature`) | `UNVERIFIED` |
| **LTX (Lightricks)** | Bearer API key only (**no OAuth**) | Sync (v1) or async job (v2), `GET /v2/{endpoint}/{id}` | **No webhooks, no streaming, no AsyncAPI** | **No idempotency contract — retried submits are new billable jobs** |

Three operational rules fall out of this table:

1. **Generated asset URLs are short-lived across the board** (explicit for Sora and Kling).
   Copy to your own object store on completion. Always.
2. **Rate limiting is expressed as concurrency, not RPS.** Runway governs by per-organisation
   **usage tiers setting concurrent tasks per model**; LTX returns `concurrency_limit_error` with
   HTTP 429 and a `Retry-After` header but publishes **no numeric limits** and **no
   `X-RateLimit-*` headers**. A queue must therefore back off on 429 and self-tune concurrency
   empirically, per provider, per model. `[GH]`
3. **Idempotency is not guaranteed.** LTX explicitly documents none; a retried submit is a new
   billable job. Every submit path needs a client-side dedupe key persisted before the call.

### 3.2 Image generation

#### 3.2.1 Per-image costs `[GH]` `[CALC]`

Derived from LiteLLM per-pixel and per-image rates.

| Model | Quality / size | Cost per image |
|---|---|---|
| **fal `flux/schnell`** | default | **$0.003** |
| **gpt-image-1-mini** | low, 1024×1024 | **$0.0022** |
| **gpt-image-1-mini** | medium, 1024×1024 | $0.0084 |
| **gpt-image-1-mini** | high, 1024×1024 | $0.0333 |
| **gpt-image-1** | low, 1024×1024 | $0.0110 |
| **gpt-image-1** | medium, 1024×1024 | $0.0420 |
| **gpt-image-1** | medium, 1024×1536 | $0.0630 |
| **gpt-image-1** | high, 1024×1024 | **$0.1670** |
| **gpt-image-1** | high, 1024×1536 / 1536×1024 | **$0.2500** |
| **gpt-image-1.5 / gpt-image-2** | token-billed | $5.00/M input tok, $10.00/M output tok (`gpt-image-2` adds explicit output-token pricing) |
| **Imagen 4 Fast** | — | $0.020 |
| **Imagen 4** | — | $0.040 |
| **Imagen 4 Ultra** | — | $0.060 |
| **Imagen 3 Fast / 3 / 3.0-002** | — | $0.020 / $0.040 / $0.040 |
| **Gemini 2.5 Flash Image ("Nano Banana")** | — | **$0.039** (also $0.30/M in, $2.50/M out tokens) |
| **Gemini 3 Pro Image ("Nano Banana Pro")** | — | **$0.134** (plus $2.00/M in, $12.00/M out tokens) |
| **FLUX.1 [dev]** (BFL direct) | — | $0.025 |
| **FLUX 1.1 pro** | — | $0.040 |
| **FLUX 1.1 pro ultra** | — | $0.060 |
| **FLUX.1 Kontext pro** (image *edit*) | — | $0.040 |
| **FLUX.1 Kontext max** (image *edit*) | — | $0.080 |
| **FLUX pro 1.0 fill / expand** (inpaint / outpaint) | — | $0.050 each |
| **FLUX.2 pro** (via Azure AI) | — | $0.040 |
| **Ideogram v3** (via fal) | — | **$0.060** |
| **Recraft V3** | — | $0.040 |
| **Recraft V2** | — | $0.022 |
| **ByteDance Seedream v3** (via fal) | — | $0.030 |
| **Stable Diffusion 3.5 Medium** (via fal) | — | $0.0398 |
| **Stable Diffusion XL** (Bedrock, 50 steps, 1024²) | — | $0.040 |
| **DALL·E 3** standard / HD 1024² | — | $0.040 / $0.080 |
| **DALL·E 3** HD 1024×1792 | — | $0.120 |
| **Qwen-Image 2.0 / 2.0-pro** | Alibaba Model Studio | listed, **price not published in the DB** |

#### 3.2.2 GPT-image API surface `[GH]`

From `openai/openai-python` `types/image_generate_params.py`:

- Prompt limit: **32,000 characters for GPT image models** (vs 4,000 for DALL·E 3, 1,000 for DALL·E 2).
- `model` ∈ `dall-e-2`, `dall-e-3`, `gpt-image-1`, `gpt-image-1-mini`, `gpt-image-1.5`, `gpt-image-2`, `gpt-image-2-2026-04-21`.
- `background` ∈ `transparent | opaque | auto`. **`gpt-image-2` does not support transparent
  backgrounds** — requests with `transparent` error. This is a real regression to design around
  if your product does logo/sticker workflows.
- `size`: for `gpt-image-2`, **arbitrary resolutions as `WIDTHxHEIGHT`**, width and height each
  divisible by 16, aspect ratio between **1:3 and 3:1**, resolutions above 2560×1440
  experimental, **max 3840×2160**. Standard sizes `1024x1024`, `1536x1024`, `1024x1536`.
- `quality` ∈ `low | medium | high | auto` for GPT image models.
- `output_format` ∈ `png | jpeg | webp`; `output_compression` 0–100 for webp/jpeg.
- `moderation` ∈ `low | auto` — **a per-request moderation dial**, which matters for brands in
  categories that trip default filters (alcohol, firearms, health claims, swimwear).
- `partial_images` 0–3 for streaming partial renders — useful for perceived latency in a composer UI.
- **GPT image models always return base64**, never a URL. Plan bandwidth and storage accordingly.

**Arbitrary resolution divisible by 16 with 1:3–3:1 aspect** is the single most product-relevant
detail here: it means one call can produce a native 1080×1350 Instagram portrait, a 1080×1920
Story, a 1200×628 link card and a 1080×1080 square **without cropping**. Every competitor
currently generates square and crops.

#### 3.2.3 The specialist image models and why they exist

| Model | Why you would choose it over the default |
|---|---|
| **Ideogram v3** | **Text-in-image rendering.** The API exposes `/v1/ideogram-v3/generate`, `edit`, `inpaint`, `remix`, `reframe`, `replace-background`, **`layerize-text`**, `upscale`, `describe`, `remove-background`, plus **dataset + custom-model training endpoints**. OpenAPI 3.1 published. Base `https://api.ideogram.ai`. `[GH]` `layerize-text` and `reframe` are directly the operations a social composer needs (same creative, six aspect ratios, editable headline). |
| **Recraft V3** | Vector/SVG output and brand-style consistency. `[K]` |
| **FLUX Kontext (pro/max)** | Instruction-following **image editing** rather than generation — "change the shirt to red, keep everything else" — at $0.04/$0.08. This is the primitive for brand-asset variation. |
| **Gemini 3 Pro Image** | Highest-fidelity Google option at $0.134; native multimodal reasoning over reference images. |
| **Imagen 4 family** | Cheapest credible enterprise path at $0.02–$0.06 with **SynthID watermarking built in** (see §8.2). |
| **Midjourney** | Aesthetic ceiling. API surface exists (`https://api.midjourney.com`, documented generate/upscale/variations/describe) `[GH]` but the primary interfaces remain the Discord bot (`/imagine`, `/blend`, `/describe`, `/shorten`) and the web app. **Programmatic access at commercial scale remains the weakest of the majors.** `[GH]` + `[K]` |

### 3.3 Avatars and synthetic UGC actors

This is the category most relevant to "we need a person talking to camera, in 40 languages,
without a person."

| Vendor | API base | Auth | Products `[GH]` | Pricing `[GH]` |
|---|---|---|---|---|
| **HeyGen** | `https://api.heygen.com/v3` | API key | **Avatar V (digital twins)**, Photo Avatar, **Avatar IV**, **Starfish TTS engine**, **Video Agent API** (avatar video from a single text prompt), **Video Translation**, **Lipsync**. Streaming avatars. Publishes `llms.txt` at `developers.heygen.com/llms.txt`. **SOC 2 Type II + GDPR; 50M+ videos generated.** | **Self-serve pay-as-you-go from a $5 minimum**, plus enterprise contracts. Per-unit rates **UNVERIFIED** — the harvested plans file is a scaffold, not reconciled data. |
| **Synthesia** | `https://api.synthesia.io/v2` | API key | Text-to-video with AI avatars/voices, **140+ languages**, templates, dubbing/translation, enterprise collaboration. | **UNVERIFIED** — harvested plans file is a scaffold. |
| **Creatify** | `https://api.creatify.ai/api` | `X-API-ID` + `X-API-KEY` headers | **AI Avatar (Lipsync v1/v2, Aurora image-to-avatar)**, product-URL → video ad, **UGC-style ad generation**, 1500+ AI actors on Pro | **Real data.** Consumer: Free $0 (10 credits, watermarked, no API), Starter **$39/mo** (100 credits), Pro **$99/mo** (300 credits, 1500+ actors, 3 custom avatars, 5 seats). **API tiers: API Starter $99/mo (500 credits), API Pro $299/mo (2,000 credits)**, Enterprise custom. **Credit rate: ~5 credits per 30s of video, 1 credit per 30s of audio.** API requires an active paid subscription. |
| **Argil** | — | — | Talking-avatar video from text or audio, avatar + voice cloning, B-roll asset management, webhooks, **subtitled output** | **Real data.** Classic **$39/mo** ($27 annual) ≈ 25 min video, API access included; Pro **$149/mo** ($104 annual) ≈ 100 min, unlimited avatar styles; Scale **$499/mo** ($349 annual), 3 seats; Enterprise custom. **~1,600 credits ≈ 25 minutes.** Annual discount ≈ 30%. |
| **Akool** | `https://openapi.akool.com` (`/api/open/v3`, `/v4`) | `clientId`+`clientSecret` → Bearer, or `x-api-key` | Talking avatars, **talking photos**, **face swap**, **video translation with lip-sync**, background change, image generation, **real-time streaming Live Avatar** (`POST /api/open/v4/liveAvatar/session/create`, media over caller-selected third-party WebRTC) | **API access is plan-gated to Pro Max and above.** Generation spends credits. **Generated assets retained 7 days.** |
| **Colossyan** | — | — | Script → avatar video; lists avatars/presenters/voices/templates; **instant avatar and voice clone creation**; async jobs with **webhook callbacks** | `UNVERIFIED` |
| **Hour One / MakeReals** | — | — | Text/scripts/data → video with AI presenters + TTS; webhooks | `UNVERIFIED` |
| **Arcads** | — | — | **UGC-ad-specific avatar actors** — the "creator-looking person holding your product" format `[K]` | `UNVERIFIED`. Not present in the api-evangelist catalogue; could not verify this session. |

**The strategic point.** Creatify at $99/mo for 500 API credits ≈ 50 minutes of avatar video, and
Argil at $39/mo for ~25 minutes, mean **synthetic UGC creative is priced at roughly $2/minute**.
For an agency producing 20 creator-style ad variants per client per month at 20 seconds each,
that is **6.7 minutes ≈ $13/client/month**. There is no economic reason this is not a feature of
a social media management tool. There are, however, serious rights reasons — see §8.7.

### 3.4 Voice, TTS and cloning

#### 3.4.1 Costs `[GH]`

| Provider / model | Unit | Rate | Per 1,000 characters | Per ~60s of speech (≈900 chars) |
|---|---|---|---|---|
| **AWS Polly standard** | char | $0.000004 | $0.004 | $0.0036 |
| **AWS Polly neural** | char | $0.000016 | $0.016 | $0.014 |
| **AWS Polly generative** | char | $0.000030 | $0.030 | $0.027 |
| **AWS Polly long-form** | char | $0.000100 | $0.100 | $0.090 |
| **OpenAI `tts-1`** | char | $0.000015 | $0.015 | $0.014 |
| **OpenAI `tts-1-hd`** | char | $0.000030 | $0.030 | $0.027 |
| **Azure TTS / TTS-HD** | char | $0.000015 / $0.000030 | $0.015 / $0.030 | — |
| **Google Vertex `chirp`** | char | $0.000030 | $0.030 | $0.027 |
| **MiniMax `speech-2.6-turbo`** | char | $0.000060 | $0.060 | $0.054 |
| **MiniMax `speech-2.6-hd`** | char | $0.000100 | $0.100 | $0.090 |
| **Groq `playai-tts`** | char | $0.000050 | $0.050 | $0.045 |
| **ElevenLabs `eleven_v3` / `eleven_multilingual_v2`** | char | **$0.00018** | **$0.180** | **$0.162** |
| **OpenAI `gpt-4o-mini-tts`** | token / sec | $2.50/M in, $10/M out, **$0.00025/sec** | — | **$0.015** |
| **Gemini 2.5 Flash TTS** | token | $0.30/M in, $2.50/M out | — | very low |
| **Runway TTS** | char | 1 credit per 50 chars ≈ $0.0002/char | $0.200 | $0.180 |

**ElevenLabs is 10–12× the price of OpenAI/Azure TTS per character and ~45× AWS Polly neural.**
That is a defensible premium for hero brand voice and voice cloning; it is not defensible as the
default engine for bulk subtitle voiceover. A serious product routes by job type.

**ElevenLabs subscription tiers `[GH]`:** Free (10K credits/mo), Starter **$6/mo** (30K credits,
commercial licence, Instant Voice Cloning, 20 Studio projects, **Dubbing Studio**), Creator
**$11/mo** (121K credits, **Professional Voice Cloning**), Pro **$99/mo** (600K credits, 44.1 kHz
PCM via API), Scale **$299/mo** (1.8M credits, 3 seats, 3 Professional Voice Clones), Business
**$990/mo** (6M credits, 10 seats, 10 PVCs, **"low-latency TTS as low as 5c/min"**), Enterprise
custom (**custom DPA/SLA, BAA for HIPAA, SSO, elevated concurrency, managed dubbing**).

#### 3.4.2 Cartesia — the low-latency real-time option `[GH]`

- **Sonic** family (`sonic-3.5`, `sonic-3`, `sonic-latest`) for TTS; **Ink** family (`ink-whisper`) for STT.
- REST: `POST /tts/bytes` (single-shot binary) and `POST /tts/sse` (Server-Sent Events with
  per-chunk metadata). 40+ languages; raw/wav/mp3; controls for **volume, speed, emotion**.
- **WebSocket `wss://api.cartesia.ai/tts/websocket`** — bidirectional, multiplexed. Requests keyed
  by `context_id`; **continuing a context preserves prosody across chunks of transcript**;
  returns base64 audio chunks, **word and phoneme timestamps**, flush acks, done message. One
  connection scales to dozens of concurrent contexts.
- **STT WebSocket `wss://api.cartesia.ai/stt/websocket`**; clients stream raw binary in 100 ms
  chunks; incremental + final transcripts with word timing. A `/stt/turns/websocket` variant adds
  **built-in turn detection**.
- Batch STT: `POST /stt` with `ink-whisper`, **99+ languages**, optional word-level timestamps,
  accepts flac/m4a/mp3/mp4/mpeg **of any length**.
- **Custom pronunciation dictionaries** referenced by `pronunciation_dict_id` on TTS requests —
  the correct mechanism for brand names, product SKUs and founder surnames.
- Cartesia is described as **one of very few providers in the catalogue with a documented public
  WebSocket API**, with published message schemas modelled in AsyncAPI.
- **Latency:** the profile states Sonic delivers "the first audio byte in as little as **90 ms**."
  `[GH]` (vendor claim relayed by a third-party profile — treat as vendor-stated, not measured).

**Word and phoneme timestamps are the load-bearing feature for social**, because they are what
lets you burn karaoke-style captions onto a vertical video without a separate forced-alignment
pass. Cartesia and Podcastle (`/text_to_speech/with_timestamps`) both expose them. ElevenLabs
does too `[K]`. Most TTS providers do not.

#### 3.4.3 Speech-to-text (transcription) `[GH]`

| Model | $/audio-second | 60-min podcast | Notes |
|---|---|---|---|
| **Groq `whisper-large-v3-turbo`** | $0.00001111 | **$0.040** | Cheapest credible |
| **Groq `whisper-large-v3`** | $0.00003083 | $0.111 | |
| **AssemblyAI `best`** | $0.00003333 | $0.120 | |
| **Mistral `voxtral-mini-2602`** | $0.00005000 | $0.180 | |
| **ElevenLabs `scribe_v1`** | $0.00006110 | $0.220 | |
| **Deepgram `nova-3`** | $0.00007167 | $0.258 | `nova-3-medical` $0.00008667 |
| **OpenAI `gpt-transcribe`** | $0.00007500 | $0.270 | |
| **OpenAI `whisper-1`** | $0.00010000 | $0.360 | |
| **Deepgram `enhanced`** | $0.00024167 | $0.870 | |
| **Vertex `chirp_3`** | $0.00026667 | $0.960 | |
| **OpenAI `gpt-live-transcribe`** | $0.00028333 | $1.020 | Realtime |
| **`gpt-4o-transcribe-diarize`** | token-billed | — | **Diarization as a first-class model** |
| **AssemblyAI `nano`** | $0.00010278 | $0.370 | |

**Transcription of a full hour of audio costs four cents.** Any product that does not transcribe
every video its customers upload — for search, for captions, for repurposing, for accessibility,
for brand-safety scanning — is leaving the cheapest high-value signal in the stack on the table.

### 3.5 Lipsync, dubbing and translation

| Vendor | Capability | Pricing `[GH]` |
|---|---|---|
| **Sync Labs (sync.so)** | Studio-grade lipsync / visual dubbing — synchronise lip movement to any audio track | **Hybrid subscription + per-second.** Hobbyist $5/mo + **$0.05/sec**, max 1 min, 1 concurrent job, 3 voice clones, watermarked. Creator $19/mo + $0.05/sec, 5 min, 3 concurrent, 5 clones, no watermark. Growth $49/mo + **$0.0475/sec** (5% discount), 10 min, 6 concurrent, 15 clones, 3 seats. Scale $249/mo + **$0.04/sec** (20% discount), 30 min, 15 concurrent, 50 clones, 5 seats, **Batch API**. Enterprise contact-sales. |
| **HeyGen Video Translation + Lipsync** | Translate a video and re-lipsync the speaker | Rate `UNVERIFIED` |
| **ElevenLabs Dubbing / Dubbing Studio** | Multi-speaker dubbing with voice preservation; **Dubbing Studio from the $6/mo Starter tier**; **"Productions" managed dubbing at Enterprise** | Credit-metered `[GH]` |
| **Akool video translation with lip-sync** | Same category | Plan-gated to Pro Max+ `[GH]` |
| **Runway Act-Two (character performance)** | Drive a target character with a reference performance video (facial expression + body motion transfer) via `POST /v1/character_performance` | **$0.05/sec** `[GH]` |

**Cost of localising a 30-second brand video into 20 languages:** lipsync at Sync Labs Scale
($0.04/sec) = $1.20 per language for the sync alone = **$24 for 20 languages**, plus TTS
(20 × 900 chars ≈ $3.24 on ElevenLabs, $0.27 on OpenAI `tts-1`) plus translation (cents).
**Under $30 to take one video into 20 markets.** `[CALC]`

This is the clearest instance of "technically possible, universally unshipped." Not one social
media management tool in this corpus offers per-market localisation of a video asset as a
publishing option.

### 3.6 Auto-editing: long-form → short-form

**Vendor state `[K]`, unverifiable this session.** Opus Clip, Vizard, Klap and Submagic are the
named incumbents. The one thing that *is* verified `[GH]`: an independent API profile describes
**OpusClip (opus.pro, Opusclip Inc., Mountain View, backed by SoftBank Vision Fund)** as serving
**16M+ creators and businesses**, spanning OpusClip (long→short clipping with **animated
captions, AI reframing, virality scoring, AI B-roll, multi-platform scheduling**) and a second
product, with a **developer API** and **MCP** listed in its topic tags. Its API is described as
letting developers "submit a source video by URL or upload, create a clipping project, tune
curation/import/render preferences, apply brand templates, retrieve exportable clips and
transcripts." Both profiles are enrichment stubs, so **endpoint paths and pricing are UNVERIFIED**.

**Note the overlap:** OpusClip does *multi-platform scheduling*. The clipping tools are walking
into the scheduling category from the other direction, while the scheduling category has not
walked into clipping at all. `[CORPUS]` identified this as "the largest unclaimed adjacency."
It is now also a two-sided competitive risk.

#### 3.6.1 The pipeline is fully documented in open source `[GH]`

`Anil-matcha/AI-Youtube-Shorts-Generator` (4,573 stars, updated 12 Aug 2026) explicitly positions
as "the open-source alternative to Opus Clip, Vidyo.ai, Klap, SubMagic, 2short.ai." Its
architecture is the reference implementation:

1. **Ingest** — `yt-dlp` (local) or hosted download.
2. **Transcribe** — `faster-whisper` locally (CPU or CUDA) or hosted Whisper.
3. **Chunk** — videos over 30 minutes auto-chunked **with overlap** so nothing is missed.
4. **Rank** — LLM highlight selection on an explicit **virality framework**: hooks, emotional
   peaks, opinion bombs, revelation moments, conflict, quotable lines, story peaks, practical value.
5. **Score** — each highlight returns a **viral score, an opening hook line, and a one-sentence
   reason it works**.
6. **Dedupe** — overlapping highlights collapsed by score.
7. **Reframe** — OpenCV **face tracking with motion smoothing** for vertical crop (local), or a
   hosted auto-crop API.
8. **Emit** — any aspect ratio; JSON output with transcript, every candidate highlight, and final
   clip paths for downstream automation.

Its own comparison table against the incumbents names their weaknesses precisely: **$20–$300/month
subscriptions, monthly minute caps with overage fees, watermarks on free tiers, black-box highlight
algorithms, locked output presets, manual one-by-one upload, SaaS-only with your videos on their
servers.** Those are the attack surfaces.

#### 3.6.2 What this pipeline costs to run yourself `[CALC]`

For a 60-minute source video:

| Stage | Cost |
|---|---|
| Transcription (Groq `whisper-large-v3-turbo`) | **$0.040** |
| Highlight ranking (Gemini 2.5 Flash-Lite over ~45K-token transcript, ~4K out) | **$0.0061** |
| Highlight ranking (GPT-5-mini, same) | $0.0192 |
| Highlight ranking (Gemini 3 Flash, same) | $0.0345 |
| Highlight ranking (Claude Haiku 4.5, same) | $0.0650 |
| Reframe + render, self-hosted ffmpeg/OpenCV, ~10 clips | ~$0.10–$0.50 `[ESTIMATE]` |
| **Total, 10 clips from a 1-hour video** | **≈ $0.15–$0.60** |

**Under a dollar to turn a one-hour podcast into ten ranked, captioned, vertically-reframed
clips.** Against incumbent pricing of $20–$300/month with minute caps. The margin structure of
the standalone clipping category is not defensible against a scheduler that already has the
customer's video library.

### 3.7 Music and the licensing problem

| Provider | API status `[GH]` | Implication |
|---|---|---|
| **Suno** | **Does NOT publish a sanctioned developer API** (as of the profile's May 2026 assessment). Public integrations are served by **third-party aggregators (sunoapi.org, AIMLAPI, etc.) wrapping reverse-engineered access**; some operate with formal SLAs but "carry legal/operational risk and are not endorsed by Suno." | **Do not build on Suno.** There is no contract, no indemnity, and the access path is explicitly unsanctioned. |
| **Udio** | **Does NOT publish a public developer API.** "Production integrations are limited to consumer web/app surfaces; programmatic access is not supported." | Same verdict. |
| **Stability — Stable Audio 2.5** | Real API on the Stability Developer Platform. Credit-based at **1 credit = $0.01**; Stable Audio 2.5 generations reported at **$0.20 per generation regardless of duration**. | Buildable. |
| **SOUNDRAW** | **B2B API explicitly for embedding music generation into video platforms, games, social tools and ad tech.** Royalty-free, **copyright-cleared**, customisable by genre/mood/theme/length/instrumentation. Existing integrations named: **Canva, Filmora, Captions**. | **This is the correct commercial answer for a social tool.** It is designed for exactly this embedding, and the licensing story is the product. |
| **Google Lyria** | Referenced indirectly — a C2PA MCP server exists specifically for "reading C2PA content provenance manifests from media files (**Google Lyria AI MP3s**, Adobe Content Credentials, etc.)" | Notable: **Lyria outputs carry C2PA manifests.** |
| **ElevenLabs Music** | "Music commercial use" appears from the **$6/mo Starter tier**; "Sound effects" on Free. | Buildable, bundled with the voice contract. |

**The rights problem, stated plainly.** Social platforms have their own licensed music libraries
(Instagram/Facebook Sound Collection, TikTok Commercial Music Library, YouTube Audio Library), and
**brand accounts are frequently restricted to the commercial subsets.** Dropping AI-generated
music into a post does not remove the platform's own rights-clearance and content-ID machinery; it
adds a second question — *who owns this output and can the brand use it commercially?* — on top of
the first. The three commercially safe answers are: (1) the platform's own commercial library,
(2) a provider selling **copyright-cleared, royalty-free** output as the product (SOUNDRAW,
Stability, ElevenLabs commercial tiers), (3) licensed stock. **Suno and Udio via reverse-engineered
aggregators are none of those.**

### 3.8 Aggregators and gateways — the buy-vs-build layer

You do not need to integrate 15 providers. In Aug 2026 there is a mature aggregation layer. `[GH]`

| Aggregator | What it consolidates |
|---|---|
| **fal.ai** | Hosted endpoints for FLUX, Imagen 4, Ideogram v3, Recraft V3, SD 3.5, Seedream, Nano Banana / Gemini 2.5 Flash Image, and **Pika models (Pika's only production API path)**. LiteLLM carries per-image prices for its catalogue. |
| **Replicate** | Thousands of open-source models plus custom model hosting. |
| **Runware** | "One API for all AI" — image, video, audio, 3D, text across **400K+ open and closed models**. |
| **Glio** | Single interface to **90+ models** across video/image/audio/text: Kling, ByteDance Seedance, Veo, Imagen, GPT Image, Suno, ElevenLabs, Runway, Claude. |
| **CometAPI** | **500+ models** behind one OpenAI-compatible REST surface incl. text-to-video and image-to-video. |
| **Novita AI** | Serverless LLM/image/video/audio plus on-demand GPU; **agent sandbox and MCP server**. |
| **Cloudflare AI Gateway** | Managed LLM proxy in front of **23+ providers** (OpenAI, Anthropic, Google AI Studio, Vertex, Bedrock, Azure OpenAI, Workers AI, Mistral, Cohere, Groq, DeepSeek, Cerebras, xAI, Perplexity, Replicate, HuggingFace, OpenRouter, **ElevenLabs, Deepgram, Cartesia, Ideogram, Fal AI**, Baseten, Parallel) with **caching, rate limiting and observability**. |
| **LiteLLM** | The routing/pricing layer itself — and the source of §7's numbers. |
| **SLNG** | Compliance-first **speech** gateway: one API for STT/TTS/voice agents across 30+ models (Deepgram, Rime, Cartesia, ElevenLabs, Whisper). |
| **SuperPenguin (Carrot Labs)** | **AI spend intelligence** — tracks, attributes and forecasts spend across 14+ LLM/speech/gateway providers incl. Bedrock, Vercel AI Gateway, Deepgram, ElevenLabs, LiveKit, LiteLLM. |

**Architectural recommendation:** route through a gateway you control (LiteLLM self-hosted or
Cloudflare AI Gateway) rather than integrating providers directly. Three reasons, all
verified above: (a) **model deprecations are fast and unannounced** — Veo 2 deprecated
2026-06-30, Sora 2 flagged 2026-09-24, Runway Gen-3 Alpha Turbo sunset 2026-07-30; (b) **prices
move**, and a gateway gives you one place to re-cost; (c) **per-tenant attribution** (Veo's
`labels`, gateway-level tagging) is how you bill a credit system honestly.

---

## 4. Agentic patterns

### 4.1 What "agent" means in this category in 2026 — and what it doesn't

There are five distinct things being called "AI agents" in social media software right now. They
have wildly different engineering cost and wildly different value. Conflating them is how the
category ended up with eight branded agents and zero autonomy.

| Level | Name | What it does | Who ships it | Engineering cost |
|---|---|---|---|---|
| **L0** | **Assistant** | One prompt in, one artifact out, human accepts or rejects. | Everyone | Days |
| **L1** | **Copilot** | Conversational surface over the product's own data; answers questions, drafts things, can call read tools. | Sprout `Trellis`, Hootsuite `Wisdom`, Emplifi `AI Query Copilot`, Brandwatch `Iris`, Vista `Ask Vista` | Weeks |
| **L2** | **Workflow builder** | User composes a repeatable multi-step AI pipeline; runs on a trigger or schedule; human approves output. | Sprinklr `AI+ Studio`, Sprout `Trellis Studio` **Skills** | Months |
| **L3** | **Supervised operator** | Agent takes *write* actions (publish, reply, escalate) under policy, with approval gates, reversibility and an audit trail. | Sprinklr ("semi-autonomous"), partially; Vista DM automation rules | Months + trust infrastructure |
| **L4** | **Autonomous operator** | Agent owns an outcome, chooses its own actions, learns from results, and only escalates on policy breach. | **Nobody.** | Quarters + evaluation infrastructure |

`[CORPUS]` is unambiguous that the market sits at L1–L2: "**Agentic mostly means workflow builder
+ copilot, not autonomy.**" It also records that for Hootsuite's `Wisdom` it is **UNVERIFIED
whether it can take write actions unattended** — the flagship agent of the second-largest vendor
in the category, and nobody outside the company knows if it can actually do anything.

**The gate between L2 and L3 is not model capability. It is trust infrastructure.** Sprinklr is
the only vendor that understood this, and shipped:
- **`Autonomous Evaluation`** (Spring '26) — "clear, explainable logs and test-backed validation
  so teams can understand, trust and continuously refine agent behaviour."
- **`Agent Quality Assurance`** (Summer '26) — "built-in testing, simulation and quality scoring
  to validate AI agent behaviour **before deployment** and maintain consistency in live interactions."
- A stated three-mode autonomy model: **fully autonomous, semi-autonomous, AI-assisted**, across
  chat, social, voice, messaging and email.
- Positioning: "trust AI agents with **proof, not promises**." `[CORPUS]`

Everything else in the market ships the agent without the evaluator.

### 4.2 The MCP-for-social ecosystem — a live inventory

MCP is the de facto integration protocol. In a single curated list (`punkpeye/awesome-mcp-servers`,
1.34 MB, pulled 12 Aug 2026) I counted **45 servers under "Social Media"** and **71 under
"Marketing."** `[GH]` This is the shape of the ecosystem:

#### 4.2.1 Multi-network publishing servers (the direct competitive set)

| Server | Networks | Tools | Notable design choices |
|---|---|---|---|
| `AstaBlackClove/posthive` | 13 (Bluesky, Threads, Instagram, LinkedIn, Mastodon, YouTube, Facebook, Pinterest, Telegram, **Nostr**, X, Discord, Tumblr) | 10 | **OAuth 2.0 + PKCE**, draft-first |
| `posteverywhere/mcp` | 11 | **32** | posts, **campaigns**, **bulk operations**, media |
| `helbertparanhos/postforme-mcp-pro` | 9 | **27 typed tools** | publish, schedule, edit, delete, **analyze** |
| `publora/mcp-server` (official) | 10 | 18 | Claude / Cursor / any MCP client |
| `Kadenzo/kadenzo-mcp` | 11 | 13 | scheduling, media upload, **AI caption generation**, analytics |
| `peturgeorgievv-factory/postfast-mcp` | 10 | — | |
| `solnk-dev/solnk-mcp` (official) | 9 | 11 | |
| `Perufitlife/postwire-mcp` | 9 | **1** (`post_to_social`) | **Flat per-brand pricing** — a pricing-model signal |
| `taisly/agent` | TikTok, IG Reels, YT Shorts, X, FB | — | **Video-first**: discover accounts, **validate videos**, publish/schedule |
| `Upload-Post/upload-post-mcp` | TikTok, Instagram, + | — | Publish/schedule/analyze/manage |
| `DemandBird/demandbird` | YouTube, X, LinkedIn, Threads, Bluesky, Substack | — | Self-described "**AI-native with MCP and API**" SMM tool for teams and agencies |

**Read this table as a threat assessment.** A commodity multi-network MCP publishing server is
now a weekend project, and eleven of them exist publicly. The moat is not the publishing tools.

#### 4.2.2 Deep single-platform servers

| Server | Platform | Surface |
|---|---|---|
| `mikusnuz/meta-mcp` | Instagram Graph API **v25.0** + **Threads API** | **57 tools**: publishing, comments, insights, hashtags, DMs, token management |
| `drashrafsaiyed-cyber/instagram-mcp` | Instagram Login API | 14 tools: photos, reels, carousels, insights, comments, **DM replies**; one-click Render deploy |
| `HagaiHen/facebook-mcp-server` | Facebook Pages / Graph API | posts, comments, engagement metrics |
| `davidmosiah/tiktok-agent-publisher` | TikTok Content Posting API | **Local-first**, OAuth readiness checks, **dry-run publish flows**, live uploads only when explicitly enabled |
| `anwerj/youtube-uploader-mcp` | YouTube | Upload without CLI or Studio |
| `eat-pray-ai/yutu` | YouTube | Full MCP server **and** CLI |
| `06ketan/substack-ops` | Substack | **26 tools**, `propose_reply` → `confirm_reply` token pattern, SQLite dedup, **JSONL audit**, **dry-run default** |
| `bulatko/vk-mcp-server` | VK | users, walls, groups, friends, newsfeed, photos, community stats |

Note the recurring safety idioms in the better ones: **dry-run by default, explicit enable for
live writes, propose→confirm token handshakes, JSONL audit logs, built-in rate limiting.** These
are the community converging on the same L3 trust primitives Sprinklr built commercially.

#### 4.2.3 The consequential category: cookie-session / browser-driven servers

This is where the ecosystem has gone somewhere the commercial vendors have not. `[GH]`

| Server | Platform | Mechanism | Surface |
|---|---|---|---|
| `ihuzaifashoukat/x-use` | X (Twitter) | **No X API key.** Drives a real Chrome session using the operator's own cookies. **Multi-account.** | **33 tools**: posting, replies, keyword search, engagement, single-tweet reads returning images as MCP content |
| `checkra1neth/xbird` | X (Twitter) | **No API keys**, browser cookies | **34 tools**; **pay-per-call from $0.001 via x402 micropayments** |
| `devag7/linkedin-mcp` | LinkedIn | **Authenticated browser session** | profiles, people/job/company search, feed, messaging, **gated writes** (connect, message, post, react, comment), structured JSON, **built-in rate limiting** |
| `alexey-pelykh/lhremote` | LinkedIn (via LinkedHelper) | **Chrome DevTools Protocol** | 32 tools for campaign management, messaging, profile queries |
| `Xquik-dev/x-twitter-scraper` | X | Remote server | **121 endpoints exposed through 2 tools**: post, reply, like, retweet, follow, DM, search, extract, **run giveaways**, monitor accounts |
| `ofershap/real-browser-mcp` | Any | MCP server + Chrome extension giving agents control of **the user's real browser with existing sessions, logins and cookies. No headless browser, no re-authentication.** | — |
| `LvcidPsyche/auto-browser` | Any | Playwright + FastAPI, Docker-isolated sessions | **Human takeover via noVNC**, reusable auth profiles, **approval/audit rails** |
| `KuvopLLC/purroxy2` | Any | Record-and-replay | Encrypted credentials, **AI-powered selector healing** |
| `aethynio/aethyn-browser-mcp` | Any | Playwright through **residential proxies**, agent chooses exit country/city, **one sticky identity per task** | 10 tools |
| `segentic-lab/periscope-mcp` | Any | 66 Playwright tools | **Persistent authenticated sessions** incl. interactive login |
| `microsoft/playwright-mcp` | Any | Official Microsoft | Structured accessibility snapshots |
| `hanzili/comet-mcp` | Any | **Perplexity Comet browser** | Agentic browsing, deep research, real-time task monitoring |

**This is the most important finding in §4, and it needs to be handled carefully.**

The technical reality: **the API-access constraint that this corpus's `05`, `06` and `07` files
describe as the category's hardest problem — platform API gates, app review, tiered access,
missing endpoints — is being routed around, in public, at scale, with off-the-shelf tooling.**
X and LinkedIn, the two platforms with the most restrictive and most expensive API terms, both
have mature, multi-tool, cookie-session MCP servers with 30+ tools each.

The commercial reality: **doing this in a product you sell is a direct breach of the platform
terms of service on every major network.** It exposes the customer's account to suspension, the
vendor to account-level and legal enforcement, and the buyer to a compliance finding. `[CORPUS]`
already records that "nobody has real TikTok listening" and that vendors' claims often rest on
"a scraper-adjacent reseller with legal risk."

**The defensible position** is the one Vista Social's own audit implies and nobody has taken
explicitly: **be honest about the line.** Ship official-API publishing everywhere an official API
exists; ship **reminder-based publishing** (mobile push, human taps publish) where it does not;
and *never* ship credential-replay automation while calling it an integration. Then say so, in the
comparison table, as a trust claim. In a category where the marketing tables collapse "true API
auto-publish" and "mobile push reminder" into one checkmark `[CORPUS]`, being the vendor that
distinguishes them is a differentiator.

#### 4.2.4 Data, intelligence and trend MCP servers

| Server | What it provides |
|---|---|
| `macrocosm-os/macrocosmos-mcp` | Real-time **X / Reddit / YouTube** data with phrase, user and date filtering |
| `veezeehq/veezee-mcp` | Real-time **LinkedIn, X, Reddit**: profiles, companies, posts, search, **sentiment** |
| `king-of-the-grackles/reddit-research-mcp` | **Semantic search across 20k+ indexed subreddits**, posts/comments **with full citations** |
| `reefapi/reefapi-mcp` | 160+ live web-data APIs incl. Reddit, TikTok, Threads, Bluesky; one key, shared credit pool |
| `mobileshop9991-star/clipwise-mcp` | **Viral TikTok trend search across 20+ countries** |
| `farukkolip/instapdown-mcp` | 16 tools: Reels/Story/carousel downloaders, engagement-rate calculator, **live hashtag search + 25 curated niches + creator hashtag audit**, **900 Reels hook templates by niche and country**, **best-time-to-post for 17 markets**, **750-date 2026 content calendar** |
| `farukkolip/xtapdown-mcp` | 14 tools for X: hashtags by niche, best posting times by country, **viral hook formulas**, engagement and ads-revenue calculators, thread splitter, **2026 search-operator cheatsheet** |
| `farukkolip/tiktapdown-mcp` | TikTok: watermark-free download, **15-hashtag sets across 15 niches with strategy tips**, best posting times for 12 countries, **viral hook formulas** |
| `Leekangbum/networklytics-mcp` | **YouTube comment social network analysis**: influencer centrality ranking, **community detection (Louvain)**, sentiment |
| `AdsMCP/tiktok-ads-mcp-server` | TikTok Ads API: campaigns, performance, audiences, creatives, OAuth |
| `Agent-Prod/muze-mcp` | Meta, Google, Amazon, Shopify — **150+ tools** to read performance, inspect campaigns, **research competitor ads**, and take **confirm-gated writes** (pause, budgets) |

Two observations. First, **"best time to post" and "viral hook formulas" have been commoditised
into free MCP servers**; any product still selling those as premium AI features is selling a
public good. Second, `muze-mcp`'s **confirm-gated writes** on ad spend is the correct pattern and
it appears in a community server before it appears in most commercial products.

### 4.3 The autonomy ladder — a concrete specification

Since nobody has shipped L3/L4 credibly, here is what it actually requires. Every element below
is buildable today with the components verified in this file.

**1. Policy objects, not prompts.** Autonomy is configured per workspace, per brand, per channel,
per action type:

```
autonomy_policy {
  scope:        workspace | brand | profile_group | channel
  action:       draft | schedule | publish | reply | escalate | boost | delete
  mode:         off | propose | approve_required | auto_within_budget | auto
  budget:       { posts_per_day, spend_per_day, replies_per_hour }
  guardrails:   [ brand_voice_policy_id, brand_safety_policy_id, banned_terms_regex,
                  required_disclosures[], claim_allowlist, competitor_mention: deny ]
  escalation:   { sentiment_below, follower_count_above, keyword_match[],
                  legal_topic_detected, crisis_signal }
  reversibility: { window_minutes, auto_delete_on_breach: bool }
}
```

**2. Every agent action becomes an audit-log entry with a decision trace.** Not a log line — a
structured record: inputs consulted, policy evaluated, model + version + prompt hash, candidates
generated, the ranking that selected one, the human (if any) who approved, and the reversal path.
`[CORPUS]` names this explicitly as an unclaimed differentiator: "**Agent decision traces as
audit-log entries. No competitor does this. It converts 'AI risk' from a procurement blocker into
a procurement *advantage*.**"

**3. Pre-deployment evaluation, Sprinklr-style.** A test harness that replays historical inbox
threads, comments and reviews through a configured agent and scores the outputs against a rubric
before the agent touches a live account. This is the `Agent Quality Assurance` idea, and it is
the thing that lets a buyer's risk committee say yes.

**4. Shadow mode as the default onboarding path.** For the first N days, the agent produces every
action it *would* have taken, side by side with what the human did. The product then shows
agreement rate. Nobody enables autonomy from a settings toggle; they enable it from evidence.

**5. Kill switches at three levels** — per action type, per brand, global — with a visible
"agent is paused" state and an automatic pause on anomaly (reply volume spike, sentiment
collapse, a flagged keyword).

### 4.4 Self-optimising posting and bandit creative testing

#### 4.4.1 Why the category stopped at "best time to post"

Send-time optimisation is universal and shallow: pick a slot from historical audience activity.
Vista exposes it as an MCP tool, `Get optimal publishing times` — "best times based on historical
audience activity" — with the help docs saying "based on your last 90 posts" and the tool
description saying "historical audience activity," a discrepancy `[CORPUS]` flags. `[CORPUS]`

The reason it stopped there is structural: **organic social has no auction and no impression-level
allocation control.** You cannot serve variant A to 10% of the audience. Which is why paid media
has had bandits for a decade and organic has none.

#### 4.4.2 What is actually possible on organic — three real mechanisms

**Mechanism 1: sequential allocation across the posting queue.** Treat each *scheduled slot* as
a pull. You have K creative variants and N slots per week. A Thompson-sampling or UCB policy
chooses which variant occupies each slot; the reward is the normalised engagement rate of that
post within its first 24–48 hours, adjusted for follower count and time-of-day baseline. This is
a genuine bandit — the arms are creative variants, the pulls are slots, the reward is delayed but
bounded. **It requires nothing from the platform except post-level metrics, which every API
already returns.**

**Mechanism 2: cross-account replication.** Agencies and multi-location brands run 10–500
comparable accounts. That is a natural experiment population. Variant A on 50 locations, variant
B on 50 locations, same day-part, randomised assignment. This is a *proper randomised trial* and
it is available to exactly the customer segment (agencies, franchises, multi-location) that pays
the most. **Nobody offers it.**

**Mechanism 3: paid-amplification bridge.** Post organically, then allocate a small boost budget
across variants using the platform's own optimisation, and read the paid signal as an estimator
for organic creative quality. Vista already exposes `List boost configurations for a profile` via
MCP `[CORPUS]`, so the plumbing exists. The insight — **use $20 of paid to pick the organic
winner** — is standard practice among sophisticated operators and is productised by nobody.

#### 4.4.3 The reward-signal problem, honestly

Any RL-from-engagement loop has four failure modes that must be designed against, and the reason
to state them here is that a naive implementation will actively harm a brand:

| Failure | Mechanism | Mitigation |
|---|---|---|
| **Engagement-bait collapse** | The optimiser discovers that outrage, controversy and "comment below" farming maximise the reward. It will do this quickly and reliably. | Multi-objective reward: engagement **and** sentiment **and** brand-voice adherence **and** follower retention. Hard constraints from the brand-safety policy as feasibility, not as penalty. |
| **Delayed, censored reward** | Engagement accrues over days; the algorithm may resurface a post weeks later. Early reads are biased. | Fixed measurement window (e.g. 48 h) with a documented, held-constant definition; treat late traffic as a separate long-tail metric, not as bandit reward. |
| **Non-stationarity** | Platform ranking changes; audience composition drifts; a competitor's campaign changes the context. Yesterday's arm statistics are stale. | Discounted / sliding-window bandit (discounted Thompson sampling), and scheduled forced exploration. |
| **Confounding by distribution** | The platform's own ranking decides reach. A "winning" variant may simply have been shown more. | Normalise reward by reach/impressions where the API exposes it (engagement *rate*, not count), and prefer the randomised cross-account design where available. |

**Statistical honesty requirement.** With ~30 posts/month per account, a two-arm test needs
months to reach significance on realistic effect sizes. The product must therefore either (a)
pool across accounts, (b) pool across a brand's whole history with hierarchical/partial pooling,
or (c) **report uncertainty rather than declaring winners.** A vendor that says "variant B wins"
off six posts is lying, and a sophisticated buyer will catch it.

### 4.5 Reference architecture for an agentic social stack

Synthesising everything verified above into a build that is achievable with today's components:

```
┌────────────────────────────────────────────────────────────────────────┐
│  CONTROL PLANE                                                          │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐ ┌────────────┐  │
│  │ Autonomy     │ │ Brand voice   │ │ Brand safety / │ │ Disclosure │  │
│  │ policies     │ │ + Knowledge   │ │ claim policy   │ │ policy     │  │
│  │ (per brand)  │ │ (RAG, per     │ │ (regex, LLM    │ │ (per       │  │
│  │              │ │  profile grp) │ │  judge)        │ │  platform) │  │
│  └──────────────┘ └───────────────┘ └────────────────┘ └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
            │                    │                     │
┌───────────▼─────────┐ ┌────────▼──────────┐ ┌────────▼──────────────────┐
│ SENSE               │ │ GENERATE          │ │ ACT                       │
│ • platform metrics  │ │ • copy (cheap LLM │ │ • publish via official    │
│ • listening/mentions│ │   + cache prefix) │ │   platform APIs           │
│ • trend feeds       │ │ • image (Imagen4/ │ │ • reminder-publish where  │
│ • competitor posts  │ │   FLUX/Ideogram)  │ │   no API exists           │
│ • review streams    │ │ • video (Veo Lite/│ │ • inbox reply / escalate  │
│ • AI-answer engines │ │   Gen-4 Turbo)    │ │ • boost allocation        │
│   (GEO monitor)     │ │ • avatar/UGC      │ │ • ALL writes policy-gated │
│                     │ │ • clip extraction │ │   + reversible + logged   │
└─────────┬───────────┘ │ • dub/localise    │ └───────────┬───────────────┘
          │             │ • C2PA sign       │             │
          │             └────────┬──────────┘             │
          │                      │                        │
┌─────────▼──────────────────────▼────────────────────────▼───────────────┐
│ EVALUATE & LEARN                                                         │
│ • pre-publish: brand-voice score, safety score, predicted engagement,    │
│   readability, claim check, disclosure check, accessibility (alt text)   │
│ • post-publish: 48h normalised engagement, sentiment, saves/shares,      │
│   AI-answer citation delta                                               │
│ • bandit allocator over creative variants → next slot assignment         │
│ • decision traces → audit log → agent QA replay harness                  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Cost of the whole loop, per brand, per month, at daily posting with one video/day and full
evaluation** — computed in §7.8. Preview: **under $30 in model spend.**

### 4.6 MCP as a *product surface*, not just an integration

There are two directions and both matter. `[CORPUS]` notes Hootsuite ships both.

- **Inbound MCP** (the product consumes external MCP servers): trend feeds, ad platforms, CRM,
  commerce, review sites. Reduces integration cost.
- **Outbound MCP** (the product exposes itself as an MCP server): the customer's own agents —
  in Claude, ChatGPT, Gemini, Copilot, Cursor — can schedule, analyse and triage through your
  product. Vista's ~60 tools; Hootsuite across Perch/Nest/Lumen; Sprinklr MCP Beta. `[CORPUS]`

**Outbound MCP is the more strategic one**, and the reasoning is uncomfortable: as end users move
their working surface into general assistants, a product that is not addressable from those
assistants becomes invisible. It is the same dynamic as §6 (AI-answer visibility), applied to the
product's own interface rather than the brand's content. **A social tool with no MCP server in
2026 is a social tool that agents cannot use, in a year when agents are how work gets initiated.**

The corollary, which the incumbents have not confronted: **if all your value is reachable through
MCP, the UI stops being the moat and the data + the policy engine + the write-safety layer
become the moat.** That is an argument for investing in §4.3, not against MCP.

---

## 5. Prediction and optimisation

### 5.1 Engagement prediction and virality scoring

**Who ships anything real:**

| Vendor | Capability | Grade |
|---|---|---|
| **Dash Social** | **`Vision AI` pre-publish performance prediction** and **Predictive Ranking of creative** — described in the enterprise audit as "the genuinely differentiated capability" of the vendor | `[CORPUS]` |
| **Sprout `Trellis`** | **Predictive Media Intelligence** — "agentic AI detecting shifts in industry narratives as they emerge" (narrative-level, not post-level prediction) | `[CORPUS]` |
| **Talkwalker** | **Virality Map**; image/logo/video recognition; Blue Silk clustering and **crisis detection** | `[CORPUS]` |
| **Sprinklr** | **ViralMoment** acquisition — AI social-video intelligence with **frame-by-frame analysis extending Unified-CXM into video, audio, image and text** | `[CORPUS]` |
| **Opus Clip** | **Virality scoring** per candidate clip | `[GH]` (profile) / `[K]` |
| **Everyone else** | Nothing | — |

**What "prediction" actually means when done properly**, and why most implementations are weak:

A pre-publish engagement predictor is a regression over features of a candidate post, trained on
that brand's own history plus a category prior. The features that carry signal are well
established and cheaply computable:

- **Content features:** modality (static / carousel / video / text), video length, first-frame
  composition, presence of a face, presence of on-screen text in the first 3 seconds, caption
  length, hook structure of the first sentence, question vs statement, CTA presence, emoji count,
  hashtag count and specificity, link presence (links suppress reach on most networks), alt-text
  presence.
- **Semantic features:** topic embedding, sentiment, brand-voice adherence score, novelty relative
  to the brand's own last 90 posts (repetition is the most reliable negative predictor).
- **Context features:** day-part, day-of-week, days since last post, follower count, recent
  30-day baseline engagement rate, current trend adjacency.
- **Competitive features:** what comparable accounts posted in the last 48h on this topic.

**The honest constraint:** with 30 posts/month, per-brand supervised learning is hopeless. The
correct architecture is **hierarchical**: a category-level model (all cosmetics brands, all B2B
SaaS) with per-brand partial pooling, plus an LLM-as-judge component for the semantic features.
That is a genuinely hard, genuinely defensible piece of engineering, and it is the reason Dash
Social's `Vision AI` is repeatedly named as its differentiator.

**Calibration matters more than accuracy.** A predictor that says "this will get 3.2% engagement"
and is wrong by 40% is useless; one that says "70% confidence this lands between 1.8% and 3.1%,
which is below your 30-day median" is actionable. **No competitor publishes calibration.**
Publishing a reliability diagram would be a credibility weapon.

### 5.2 Hook and thumbnail testing

**Shipped by:** essentially nobody in social. YouTube's own A/B thumbnail test feature exists
natively in YouTube Studio `[K]`, and the clipping tools generate hooks (Opus Clip returns "an
opening hook line" per clip `[GH]`), but **no SMM tool runs a hook or thumbnail experiment.**

**What is possible today, cheaply:**
- Generate 8 hook variants of the first sentence: **8 × $0.0004 = $0.003.** `[CALC]`
- Generate 4 thumbnail variants at 1080×1350 native (`gpt-image-2` arbitrary resolution, or
  Imagen 4 at $0.04): **$0.16.** `[CALC]`
- Score all 32 combinations with a vision+text judge: **~$0.02.** `[CALC]`
- **Total to test 32 creative combinations before publishing: under $0.20.**

The bottleneck is not cost. It is that organic social gives you no impression-level allocation
(see §4.4.2), which is precisely why the cross-account and paid-bridge mechanisms matter.

### 5.3 Send-time optimisation

Universal, shallow, and mostly a lookup table. Free MCP servers now ship "best posting times for
17 markets" and "best posting times for 12 countries" as static curated data `[GH]`. The premium
version — per-account, per-network, per-content-type, learned from that account's own history
with uncertainty — is described by several vendors and demonstrated by none.

**What would actually be better:**
- Model reach as a function of (day-part × day-of-week × content-type × recency-of-last-post),
  fit per account with a category prior.
- Report the **expected lift and its uncertainty**, not a single "best time."
- Optimise the *schedule*, not each post independently — posting frequency has a saturation
  curve, and the second post of the day cannibalises the first. **No tool models cannibalisation.**
- Feed the bandit: send-time is another arm dimension.

### 5.4 Creative fatigue detection

**Shipped by:** nobody in organic social. Standard in paid media platforms `[K]`.

**Trivially implementable:** creative fatigue is a declining-performance-with-repeated-exposure
signal. For organic:
- Compute embedding similarity between each new post and the brand's trailing 90-day corpus.
- Regress engagement rate on that similarity. The coefficient is the brand's fatigue slope.
- Alert when planned content exceeds the similarity threshold at which historical engagement
  degraded, **and offer the regeneration that fixes it in the same UI.**

Cost: embeddings at ~$0.02–$0.13 per million tokens `[GH]` — i.e. a brand's entire annual post
history embeds for well under a cent. **This is a free feature nobody ships.**

### 5.5 Trend detection and trend-jacking latency

**The state of the art in shipped product:**
- Vista's `Ask Vista` answers "what's trending in beauty in the UK right now?" and offers five
  named angles — **Newsjack it / Educational / Hot take / Promotional / Ask the audience** —
  then generates images, captions and a schedule inline. `[CORPUS]` **This is the best
  trend-to-publish flow documented in this corpus**, and it is in a mid-market product.
- Sprout `Trellis` "Predictive Media Intelligence — agentic AI detecting shifts in industry
  narratives as they emerge." `[CORPUS]`
- Talkwalker `Blue Silk GPT` "flagging brand activity, consumer pain points and potential
  crises." `[CORPUS]`
- Community MCP: `clipwise-mcp` — **viral TikTok trend search across 20+ countries.** `[GH]`

**Latency is the entire game, and nobody measures it.** A trend on TikTok has a useful window of
roughly 24–72 hours `[K]`. The end-to-end latency of a trend-jack is:

```
detect → verify → assess brand fit → assess brand safety → generate →
approve → publish
```

In the shipped tools, the *human* steps dominate: detection may be near-real-time, but assessment
and approval are asynchronous human work, so the realistic end-to-end is **hours to days**. The
technically achievable end-to-end, with the components verified in this file, is:

| Step | Mechanism | Latency |
|---|---|---|
| Detect | Listening stream / trend API / community MCP feed | seconds–minutes |
| Verify | Cross-source corroboration (2+ independent sources) | seconds |
| Brand fit | Embedding similarity to brand topic graph + LLM judge | ~2 s |
| Brand safety | Policy engine + LLM judge against brand-safety policy | ~2 s |
| Generate | Copy (~2 s) + image (~5–15 s) or video (~30–120 s) | 5 s–2 min |
| Disclosure + C2PA sign | Local | <1 s |
| Approve | **Policy-gated: auto if within autonomy budget and safety score ≥ threshold; else push to human with a 1-tap approve** | 0 s or human |
| Publish | Platform API | seconds |

**Sub-five-minute, policy-gated trend-jacking is achievable.** The blocker is not technology; it
is that no vendor has built the autonomy policy object (§4.3) that makes unattended publication
safe enough to permit. **Trend-jacking latency is the single most legible demonstration of the
100x claim**, because it is a number a buyer can feel: "we go from a trend to a published,
on-brand, disclosed, signed post in four minutes; your current tool takes a day and a half."

**The counterweight, stated honestly:** trend-jacking is also where brands generate their worst
PR incidents. Any auto-publish trend feature must carry a hard blocklist of contexts (disasters,
deaths, political events, active crises), a mandatory two-source corroboration rule, and a
reversibility window. Ship the brake with the accelerator or don't ship it.

### 5.6 The prediction/optimisation scoreboard

| Capability | Anyone shipping? | Technically possible now? | Cost to run | Difficulty |
|---|---|---|---|---|
| Pre-publish engagement prediction | Dash Social only | **Yes** | ~$0.001/post | High (hierarchical modelling) |
| Calibrated uncertainty on predictions | **Nobody** | Yes | free | Medium |
| Virality scoring of video clips | Opus Clip | Yes | ~$0.006/hour of source | Low |
| Hook A/B generation + judging | **Nobody** | Yes | ~$0.02/post | Low |
| Thumbnail variant generation + judging | **Nobody** | Yes | ~$0.18/post | Low |
| Bandit creative allocation (organic) | **Nobody** | Yes (queue-slot / cross-account) | ~free | Medium |
| Cross-account randomised trials | **Nobody** | Yes | free | Medium |
| Paid-bridge organic winner selection | **Nobody** | Yes | ad spend only | Low |
| Learned send-time with uncertainty | Marketed, not demonstrated | Yes | free | Low |
| Posting-frequency cannibalisation model | **Nobody** | Yes | free | Medium |
| Creative fatigue detection | **Nobody** (organic) | Yes | <$0.01/brand/mo | **Low** |
| Sub-5-minute policy-gated trend-jack | **Nobody** | Yes | ~$0.50/event | Medium (policy engine) |
| Repetition/novelty scoring vs own corpus | **Nobody** | Yes | <$0.01/brand/mo | **Low** |
| Competitive creative gap analysis | Emplifi/Socialbakers-lineage benchmarking | Yes | ~$1/brand/mo | Medium |

**Eleven of fourteen rows are empty across the entire market.** Six of them are low-difficulty.

---

## 6. AI search, GEO and AEO — the major emerging whitespace

This section is deliberately the longest. `03-competitors-enterprise.md` called Meltwater's
`GenAI Lens` "**strategically the most interesting product in this whole document**" and rated
AI-answer visibility as having "**the highest ratio of buyer interest to build cost in the
market.**" `[CORPUS]` Everything found this session strengthens that assessment.

### 6.1 The category and its vocabulary

| Term | Meaning |
|---|---|
| **GEO** — Generative Engine Optimization | Making content more likely to be retrieved, quoted and cited by generative answer engines |
| **AEO** — Answer Engine Optimization | Usually used interchangeably with GEO; sometimes narrowed to featured-answer/AI-Overview placement |
| **AI visibility** | The measurement side: does the brand appear in AI answers, in what position, with what sentiment, cited from where |
| **Share of voice (AI)** | Brand mentions vs competitors across a fixed prompt set and engine set |
| **Citation source influence** | Which URLs/domains the engines actually cite when answering about the category |
| **`llms.txt`** | A proposed convention: a markdown file at `/llms.txt` giving models a curated, clean map of a site's most useful content |

### 6.2 The engines that matter, and their crawlers

The `ai-robots-txt/ai.robots.txt` registry catalogues **163 AI user-agents** with operator,
stated function and robots.txt compliance. `[GH]` Distribution by declared function:

| Declared function | Count |
|---|---|
| AI Assistants | 28 |
| AI Data Providers | 18 |
| AI Data Scrapers | 17 |
| AI Agents | 8 |
| AI Search Crawlers | 7 |
| Undocumented AI Agents | 7 |
| AI Coding Agents | 7 |
| Assorted single-purpose (training, search, translation, detection…) | ~71 |

**The ones that determine brand visibility**, with their verified robots.txt posture: `[GH]`

| User-agent | Operator | Function | Respects robots.txt |
|---|---|---|---|
| `GPTBot` | OpenAI | Scrapes data to train OpenAI's products | **Yes** |
| `OAI-SearchBot` | OpenAI | **Search result generation** | **Yes** |
| `ChatGPT-User` | OpenAI | AI Assistants (user-initiated fetch) | **Yes** |
| `ChatGPT Agent` | OpenAI | **AI Agents** | **Yes** |
| `ClaudeBot` | Anthropic | Scrapes data to train Anthropic's products | **Yes** |
| `Claude-SearchBot` | Anthropic | Navigates the web to improve search result quality | **Yes** |
| `Claude-User` | Anthropic | AI Assistants | **Yes** |
| `Claude-Web` | Anthropic | Undocumented AI Agents | — |
| `PerplexityBot` | Perplexity | **Search result generation** | **Yes** |
| `Perplexity-User` | Perplexity | AI Assistants | **No** |
| `Google-Extended` | Google | **LLM training** (does not affect Search indexing) | **Yes** |
| `Gemini-Deep-Research` | Google | AI Assistants | — |
| `Google-Agent` | Google | AI Agents | — |
| `meta-externalagent` | Meta | Used to train models and improve products | **Yes** |
| `FacebookBot` | Meta | Training language models | — |
| `facebookexternalhit` | Meta | "Ostensibly only for sharing, but likely used as an AI crawler as well" | — |
| `Bytespider` | ByteDance | LLM training | **No** |
| `Applebot-Extended` | Apple | Siri, Spotlight, Safari, Apple Intelligence | **Yes** |
| `CCBot` | Common Crawl | Open crawl dataset used widely for ML/AI | **Yes** |
| `Amazonbot` | Amazon | Alexa answers | **Yes** |
| `AmazonBuyForMe` | Amazon | **AI Agents** (agentic commerce) | — |
| `cohere-ai` | Cohere | Responses to user-initiated prompts | Unclear |
| `DeepSeekBot` | DeepSeek | Training + product improvement | — |
| `MistralAI-User` | Mistral | AI Assistants | Unclear |
| `atlassian-bot` | Atlassian | AI search, assistants and agents | — |
| `AzureAI-SearchBot` | Microsoft | AI Search Crawlers | Unclear |

**Four operationally important facts fall out of this table:**

1. **The train/search split is real and must not be conflated.** `GPTBot` (training) and
   `OAI-SearchBot` (answer generation) are separate agents. A brand can block training while
   permitting citation — and many do exactly that. Any GEO product that reports "you blocked
   OpenAI" without distinguishing the two is giving dangerous advice.
2. **`Google-Extended` controls Gemini training but not Google Search indexing.** Blocking it
   does not remove you from AI Overviews, which draw on the Search index.
3. **Two consequential crawlers explicitly do not respect robots.txt** — `Perplexity-User`
   (per Perplexity's own bot docs) and `Bytespider`. Advising a customer that robots.txt controls
   these is factually wrong.
4. **`ChatGPT Agent`, `Google-Agent` and `AmazonBuyForMe` are agent user-agents, not crawlers.**
   The agentic-commerce web is already sending traffic. Nobody in the social category is measuring
   agent traffic to brand properties.

### 6.3 `llms.txt` — status of the convention

`[GH]`, from repository evidence:

- The origin spec, `AnswerDotAI/llms-txt`, has **2,560 stars** and was updated 12 Aug 2026.
- `thedaviddias/llms-txt-hub` — "the largest directory for AI-ready documentation and tools
  implementing the proposed llms.txt standard" — **897 stars, 613 forks.**
- Tooling exists across every major framework: `firecrawl/llmstxt-generator` (537 stars),
  `nuxt-content/nuxt-llms`, `delucis/starlight-llms-txt`, `pawamoy/mkdocs-llmstxt`,
  `dotenvx/llmstxt` (sitemap → llms.txt), `langchain-ai/mcpdoc` (1,025 stars, exposes llms-txt
  to IDEs).
- Multiple AI providers now publish their own: HeyGen at `developers.heygen.com/llms.txt`,
  Ideogram at `docs.ideogram.ai/llms.txt`, Akool, Lightricks/LTX (harvested verbatim by
  api-evangelist into a dedicated `llms/` directory). `[GH]`

**Honest assessment:** `llms.txt` is a *proposed* convention with broad tooling adoption and
**no confirmed evidence that any major answer engine consumes it as a ranking or retrieval
signal.** `UNVERIFIED`, and it has been unverified since the proposal appeared. Every GEO audit
tool checks for it because it is cheap to check, not because it is proven to work. **State this
to customers.** A vendor that sells `llms.txt` generation as an efficacy claim is over-claiming;
a vendor that ships it as "cheap, harmless, plausibly useful, unproven" is credible.

### 6.4 The independent GEO tooling ecosystem — what already exists

Fourteen distinct AI-visibility tools surfaced from GitHub alone this session, most created in
the last six months. `[GH]`

| Tool | What it does |
|---|---|
| `LLM-Pulse/llmpulse-mcp` | Hosted MCP for LLM Pulse: **brand mentions, citations, sentiment, share of voice, recommendations, GEO Writer, Search Console, AI traffic** over Streamable HTTP |
| `mukul-dutt/mentionsapi-mcp` | "Check whether AI recommends your brand" — mentions, ranks, citations across **ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews, AI Mode, Bing Copilot** |
| `optifeed/optifeed-radar` | Asks **ChatGPT, Claude, Gemini, Perplexity real buyer questions** and scores whether the brand or its products are actually recommended; brand and product checks, competitor share |
| `sarefe12-sudo/visibilityradar-mcp` | AI Visibility Score, per-model breakdowns (Claude, GPT-4o, Gemini, Perplexity, Grok, DeepSeek), sentiment, competitor comparison |
| `maxaeo/maxaeo-ai-visibility-mcp` | **Local-first** GEO/AEO + `llms.txt` audit: AI crawler access, robots, sitemap, canonical, metadata, noindex |
| `epistemedeus/ai-readiness` | Scores AI-crawler access, JSON-LD structured data, title/meta, Open Graph, sitemap, llms.txt |
| `krissanders/ai-visibility-mcp` | **Per-bot robots.txt verdicts for 22 known AI user-agents** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bytespider…), **Cloudflare AI-default flag detection** |
| `SEOcrawl/seocrawl-mcp` | SEO + GEO: live GSC & GA4, keyword/page analysis, AI-visibility tracking across ChatGPT/Claude/Gemini/Perplexity, site audit, task management |
| `AutomateLab-tech/seo-performance-mcp` | Unifies **GSC, Matomo, GA4, Clarity and AI-citation signals per URL** and emits a verdict: refresh / expand / merge / kill |
| `AutomateLab-tech/ai-seo-mcp` | Scores schema.org coverage, robots.txt and llms.txt health, canonical/OG setup, **AI-citation likelihood**; suggests rewrites |
| `atomno-mcp/mcp-seo-audit` | 0–100 health score across 8 categories with a **GEO sub-score** |
| `sharozdawa/ai-visibility` | Visibility scores, sentiment, competitor detection, trend charts across ChatGPT/Perplexity/Claude/Gemini |
| `arenza-ai/arenza-mcp-client-python` | AI visibility metrics, **GEO opportunities**, brand mention tracking across ChatGPT/Claude/Gemini/Perplexity/**Copilot**/**Grok** |
| `OranAi-Ltd/orangeo-ai-visibility-skill` | **130 stars.** Open-source GEO/AEO audit skill — full methodology in §6.5 |
| `rubenmarcus/aeo.js` | **120 stars.** Build-time AEO for Next/Nuxt/Astro/Vite: generates llms.txt, robots.txt, sitemap, JSON-LD |
| `MoonianP/Cat-AEO` | Audit any URL for AI search visibility, **simulate AI Overview**, track brand mentions |
| `promptclarity/promptclarity` | **Self-hosted via Docker**: monitor brand mentions across ChatGPT/Gemini/Perplexity, competitor comparison, sentiment, which sources AI cites |

**Named commercial GEO vendors** surfaced via the api-evangelist company registry: `[GH]`

| Vendor | Backing / positioning |
|---|---|
| **Sitefire** | **Y Combinator**-backed. "GEO platform — the marketing suite for the agentic web," self-described **"System of Record for AI visibility."** Monitors how **ChatGPT, Gemini, Perplexity, DeepSeek, Google AI Mode and AI Overviews** mention and cite a brand across tracked topics, **diagnoses why content is or isn't cited**, and generates content. Tags include `mcp` and `content-generation`. |
| **Bluefish AI** | **Bloomberg Beta + Threshold Ventures.** "Enterprise AI marketing platform built for Fortune 500 brands to gain visibility and control over how they are represented across AI channels." Spans AI monitoring of brand reputation in AI-native experiences, **GEO**, **GEO measurement frameworks**, and **agentic commerce**. |
| **RankScience** | SF agency doing SEO **plus GEO / LLM optimisation** as a service. |
| **Meltwater `GenAI Lens`** | The only listening/SMM incumbent in the category. `[CORPUS]` |

**Read the funding signal.** Y Combinator and Bloomberg Beta are both funding this in 2026, and
one of them is explicitly targeting Fortune 500. The category is being built. It is not being
built by anyone in social media management except Meltwater.

### 6.5 The measurement methodology, specified

Synthesised from `orangeo-ai-visibility-skill` `[GH]`, the MCP tool descriptions above, and the
`GenAI Lens` description `[CORPUS]`. This is a complete, buildable spec.

#### Layer 1 — Readiness (deterministic, no model calls, free)

| Check | Detail |
|---|---|
| AI crawler access | Parse `robots.txt`; render a **per-agent verdict** for each of the ~26 consequential user-agents in §6.2. Distinguish training-blockers from search-blockers. Detect Cloudflare's AI-bot default blocking. |
| `llms.txt` | Presence, headings, links, brand/category clarity, proof pages, docs, size. Flag as unproven-but-cheap. |
| `sitemap.xml` | Presence, URL count, freshness |
| Metadata | `<title>`, meta description, `<h1>`, canonical, Open Graph |
| Structured data | JSON-LD coverage: `Organization`, `Product`, `FAQPage`, `Article`, `Review`, `BreadcrumbList` |
| Citation-ready page types | FAQ, case study, review, pricing, docs, blog, about, contact, comparison, alternatives |
| Third-party source signals | Presence and quality on **GitHub, G2, Capterra, Trustpilot, Reddit, YouTube, Wikipedia, Product Hunt, Crunchbase, Gartner, Forrester** |
| Competitive coverage | Does "X vs Y" and "alternatives to X" content exist |

`orangeo` scores this as **AI access /25 + Technical clarity /30 + Citation readiness /25 +
Competitive coverage /20 = 100**. That decomposition is sane and worth copying.

#### Layer 2 — Measured visibility (model calls, the actual product)

1. **Prompt set construction.** Generate a **buyer-intent prompt set** — `orangeo` uses 15;
   serious deployments use 100–500. Categories: category-definition ("what is the best X for Y"),
   comparison ("X vs Y"), alternatives ("alternatives to X"), problem-first ("how do I solve Z"),
   trust ("is X legit / is X safe"), pricing ("how much does X cost"), integration ("does X work
   with Y"). Per market and per language.
2. **Engine matrix.** Run every prompt against every engine on a schedule: ChatGPT, Google AI
   Mode / AI Overviews, Gemini, Perplexity, Claude, Copilot, Grok, DeepSeek. Note that engines
   are non-deterministic and personalised — **run N repetitions and report a rate, never a
   single observation.**
3. **Extract per answer:** brand mentioned (bool), position of first mention, competitors
   mentioned, sentiment toward the brand, **recommendation verdict** (recommended / mentioned /
   dismissed / absent), and **every cited URL**.
4. **Aggregate:** visibility rate per engine, share of voice vs a named competitor set,
   **citation source influence** (which domains the engines actually pull from for this category),
   sentiment distribution, and week-over-week delta.
5. **Snapshot and diff.** Store raw answers. The diff between snapshots after a content change
   is the only evidence of causality this category can offer, and it is what makes it retainable.

#### Layer 3 — Optimisation (the part almost nobody does)

- **Citation gap analysis:** for each prompt where a competitor is cited and you are not, identify
  the cited source and the claim it supports. That is a content brief with a known target.
- **Source-influence targeting:** if Reddit and G2 dominate citations in your category, the
  correct action is not blog posts — it is presence on Reddit and G2. **This is a social action.**
- **Content restructuring:** answer-shaped headings, explicit comparison tables, FAQ schema,
  quotable one-sentence definitions near the top, dated freshness signals.
- **Entity consistency:** consistent brand name, description and category across Wikipedia,
  Crunchbase, LinkedIn, G2, Product Hunt, GitHub. Entity ambiguity is a top cause of absence.

### 6.6 Why social media is the highest-leverage GEO lever, and why that is *the* strategic insight

Here is the argument, and it is the most commercially important paragraph in this document.

**AI answer engines cite user-generated and social sources heavily.** The single hardest
corroborating number available in this corpus: Reddit's commercial data licensing top tier is a
privately negotiated contract, and **the Google deal is reportedly ~$60M/year.** `[CORPUS]`
Nobody pays $60M/year for a corpus their model does not lean on. Meanwhile the `orangeo`
methodology's third-party signal list — **Reddit, YouTube, GitHub, G2, Capterra, Trustpilot,
Wikipedia, Product Hunt** `[GH]` — is, with the exception of Wikipedia, a list of platforms a
social media management tool already connects to, publishes to, or monitors.

**Therefore:**

- A social media management platform already holds **the publishing rails to the surfaces that
  feed AI answers**: Reddit, YouTube, LinkedIn, X, Quora-adjacent communities, review sites
  (Google Business Profile, Trustpilot, app stores — all in Vista's review module `[CORPUS]`).
- It already holds **the brand's content graph, brand voice and knowledge base** — the exact
  inputs a GEO content brief needs.
- It already holds **the listening infrastructure** to detect where the category conversation
  lives.
- Adding GEO measurement costs, in model spend, **$26.40/month for 5 engines × 200 prompts
  weekly** (§7.6). `[CALC]`

**Nobody has connected these.** Meltwater sells measurement without publishing. The GEO startups
sell measurement and website optimisation without any social publishing rails. The social tools
sell publishing without any awareness that they are the distribution layer for the surfaces AI
answers are built from.

**The product is:** measure AI-answer visibility → identify which *cited sources* drive it →
recognise that most of those sources are social/UGC/review surfaces → publish to exactly those
surfaces from the same tool → re-measure → attribute the delta. That is a closed loop no vendor
in either category can currently run, and it is buildable with components that already exist in
a social media management platform.

### 6.7 A note on honesty in this category

Two failure modes will define who is credible:

1. **Fabricating engine outputs.** `orangeo`'s README states its own ethical boundary explicitly:
   "It does not invent ChatGPT, Perplexity, Gemini, Grok, DeepSeek, Claude, or other model
   outputs. It does not fabricate citation URLs or competitor rankings." `[GH]` The temptation is
   real because real measurement costs money and engines rate-limit. **Store and show the raw
   answer text.** A screenshot-equivalent receipt is the product.
2. **Over-claiming causality.** AI answers are non-deterministic, personalised, and change with
   model updates you do not control. The correct claim is "your visibility rate on this prompt
   set moved from 22% to 41% over six weeks, during which we made these changes" — not "we got
   you into ChatGPT."

Both of these are the same discipline the rest of this corpus applies to platform-API claims.
It transfers.

---

## 7. Model economics

All prices `[GH]` from LiteLLM `model_prices_and_context_window.json` (3,003 entries, downloaded
12 Aug 2026) unless otherwise noted. All scenario totals `[CALC]`.

### 7.1 Text models — the workhorse layer

| Model | $/M input | $/M output | Cached input | Context | Max output |
|---|---|---|---|---|---|
| `gpt-5-nano` | 0.05 | 0.40 | 0.005 | 272,000 | 128,000 |
| `gemini-2.5-flash-lite` | 0.10 | 0.40 | 0.010 | 1,048,576 | 65,535 |
| `gpt-5.4-nano` | 0.20 | 1.25 | 0.020 | 272,000 | 128,000 |
| `gpt-5.6-luna` | 0.20 | 1.20 | 0.020 | 1,050,000 | 128,000 |
| `gpt-5-mini` | 0.25 | 2.00 | 0.025 | 272,000 | 128,000 |
| `deepseek-chat` | 0.28 | 0.42 | 0.028 | 131,072 | 8,192 |
| `minimax-m2.5` | 0.30 | 1.20 | — | 1,000,000 | 8,192 |
| `gemini-3-flash-preview` | 0.50 | 3.00 | 0.050 | 1,048,576 | 65,535 |
| `mistral-large-3-675b-instruct` | 0.50 | 1.50 | — | 128,000 | 8,192 |
| `moonshotai kimi-k2.5` | 0.60 | 3.00 | — | 262,144 | 262,144 |
| `gpt-5.4-mini` | 0.75 | 4.50 | 0.075 | 272,000 | 128,000 |
| `claude-haiku-4-5` | 1.00 | 5.00 | 0.100 | 200,000 | 64,000 |
| `gpt-5` / `gpt-5.1` | 1.25 | 10.00 | 0.125 | 272,000 | 128,000 |
| `gpt-5.2` | 1.75 | 14.00 | 0.175 | 272,000 | 128,000 |
| `claude-sonnet-5` | 2.00 | 10.00 | 0.200 | **1,000,000** | 128,000 |
| `gemini-3-pro-preview` | 2.00 | 12.00 | 0.200 | 1,048,576 | 65,535 |
| `gpt-5.6-terra` | 2.00 | 12.00 | 0.200 | 1,050,000 | 128,000 |
| `gpt-5.4` | 2.50 | 15.00 | 0.250 | 1,050,000 | 128,000 |
| `claude-opus-5` | 5.00 | 25.00 | 0.500 | **1,000,000** | 128,000 |
| `gpt-5.5` / `gpt-5.6` / `gpt-5.6-sol` | 5.00 | 30.00 | 0.500 | 1,050,000 | 128,000 |

Regional surcharges are real and worth budgeting: EU, AU and JP Bedrock endpoints for Claude
carry a **+10% premium** (`eu.anthropic.claude-sonnet-5` at $2.20/$11.00 vs $2.00/$10.00 global).
`[GH]` This matters directly because `[CORPUS]` records **region-pinned AI inference** as a
rapidly rising enterprise procurement gate.

#### Cost per caption `[CALC]`

Assumption: 2,500 input tokens (brand-voice policy + retrieved knowledge + 10 exemplar posts +
the brief), 300 output tokens.

| Model | $/caption | $/1,000 captions | Captions per $1 |
|---|---|---|---|
| `gpt-5-nano` | **$0.000245** | $0.25 | **4,082** |
| `gemini-2.5-flash-lite` | **$0.000370** | $0.37 | **2,703** |
| `deepseek-chat` | $0.000826 | $0.83 | 1,211 |
| `gpt-5.6-luna` | $0.000860 | $0.86 | 1,163 |
| `gpt-5.4-nano` | $0.000875 | $0.88 | 1,143 |
| `minimax-m2.5` | $0.001110 | $1.11 | 901 |
| `gpt-5-mini` | $0.001225 | $1.23 | 816 |
| `mistral-large-3` | $0.001700 | $1.70 | 588 |
| `gemini-3-flash-preview` | $0.002150 | $2.15 | 465 |
| `gpt-5.4-mini` | $0.003225 | $3.23 | 310 |
| `claude-haiku-4-5` | $0.004000 | $4.00 | 250 |
| `claude-sonnet-5` | $0.008000 | $8.00 | 125 |
| `gemini-3-pro-preview` | $0.008600 | $8.60 | 116 |
| `gpt-5.4` | $0.010750 | $10.75 | 93 |
| `claude-opus-5` | $0.020000 | $20.00 | 50 |

#### Prompt caching — the single highest-ROI optimisation `[CALC]`

The brand-voice policy, brand-safety policy and exemplar corpus are **identical across every
generation for a given brand**. Put them in a cached prefix.

Assumption: 2,000 cached prefix + 500 fresh input + 300 output.

| Model | Uncached | Cached | Saving |
|---|---|---|---|
| `gemini-2.5-flash-lite` | $0.000370 | **$0.000190** | **49%** |
| `claude-haiku-4-5` | $0.004000 | **$0.002200** | **45%** |
| `claude-sonnet-5` | $0.008000 | **$0.004400** | **45%** |
| `gpt-5.4` | $0.010750 | **$0.006250** | **42%** |
| `gemini-3-flash-preview` | $0.002150 | **$0.001250** | **42%** |
| `gpt-5.4-nano` | $0.000875 | **$0.000515** | **41%** |
| `gpt-5-mini` | $0.001225 | **$0.000775** | **37%** |

**~45% off the text bill for an architectural decision**, and it also cuts latency because the
prefix is not re-processed.

#### Model routing policy — a concrete recommendation

| Job | Model class | Why |
|---|---|---|
| Caption drafts, hashtags, variants, tone shifts, alt text | **Cheapest frontier-lite** (`gemini-2.5-flash-lite`, `gpt-5-nano`) | Output is short and the human or the judge filters it. 2,700–4,000 per dollar. |
| Brand-voice judging, safety judging, claim checking | **Mid** (`gpt-5-mini`, `claude-haiku-4-5`) | Judgement quality matters more than prose quality; still cheap. |
| Long-transcript highlight ranking, campaign planning, report narrative | **Long-context mid** (`gemini-3-flash`, `gemini-2.5-flash-lite` for 1M ctx) | Context window is the binding constraint, not reasoning. |
| Agent planning with tool use, ambiguous escalations, crisis triage | **Frontier** (`claude-sonnet-5`, `gpt-5.4`, `gemini-3-pro`) | Low volume, high consequence. |
| Anything customer-visible in a regulated vertical | **Frontier + region-pinned endpoint** | Procurement gate `[CORPUS]` |

### 7.2 Image economics

Full table in §3.2.1. The decision-relevant summary:

| Use case | Recommended model | Cost |
|---|---|---|
| High-volume variant generation, drafts, thumbnails-for-testing | `flux/schnell` ($0.003) or `gpt-image-1-mini` low ($0.0022) | **~$0.003** |
| Standard published social creative | Imagen 4 ($0.04) / FLUX 1.1 pro ($0.04) / Nano Banana ($0.039) | **~$0.04** |
| Text-in-image (headline baked into the creative) | **Ideogram v3 ($0.06)** | $0.06 |
| Brand-asset editing ("same photo, different product colour") | **FLUX.1 Kontext pro ($0.04) / max ($0.08)** | $0.04–0.08 |
| Hero creative | Imagen 4 Ultra ($0.06), Gemini 3 Pro Image ($0.134), `gpt-image-1` high ($0.167–0.25) | $0.06–0.25 |

**A brand publishing one image per day, generating 4 candidates each, at Imagen 4:**
30 × 4 × $0.04 = **$4.80/month.** With `flux/schnell` for candidates and Imagen 4 for the
selected one: 30 × (3 × $0.003 + $0.04) = **$1.47/month.**

### 7.3 Video economics

Full table in §3.1.1. Summary of the decision:

| Use case | Model | $/sec | 15s cost |
|---|---|---|---|
| Volume B-roll, background motion, ambient loops | **Veo 3.1 Lite 720p** / **Runway Gen-4 Turbo** | $0.05 | **$0.75** |
| Standard published short-form | Veo 3.1 Lite 1080p / Luma Ray-2 | $0.08 | $1.20 |
| Hero creative with native audio | Veo 3.1 Fast ($0.15) → Veo 3.1 ($0.40) | $0.15–0.40 | $2.25–6.00 |
| Vertical-native, remixable | **Sora 2** (720×1280 default, 4/8/12s, remix lineage) | $0.10 | $1.50 |
| Editing existing footage | Runway Aleph | $0.15–0.28 | $2.25–4.20 |
| Avatar/UGC talking head | Creatify (~5 credits/30s) / Argil (~$1.56/min at Classic) | — | **~$0.40** |
| Lipsync / dub an existing video | Sync Labs | $0.04–0.05 | $0.60–0.75 |

### 7.4 Audio economics

Full tables in §3.4.1 and §3.4.3.

| Job | Cheapest credible | Premium |
|---|---|---|
| Bulk voiceover (60s) | AWS Polly neural **$0.014** / OpenAI `tts-1` $0.014 | ElevenLabs `eleven_v3` **$0.162** (11.6×) |
| Real-time / conversational | Cartesia Sonic (WebSocket, ~90 ms first byte, vendor-stated) | — |
| Transcription (1 hour) | Groq `whisper-large-v3-turbo` **$0.040** | Deepgram `nova-3` $0.258 |
| Diarised transcription | `gpt-4o-transcribe-diarize` (token-billed) | — |
| Music | SOUNDRAW (B2B, copyright-cleared) / Stable Audio 2.5 **$0.20/generation** | — |

### 7.5 Latency budgets — the constraint nobody prices

Cost is solved. **Latency is what determines whether an agentic product feels alive or broken.**
Hard measured numbers were not obtainable this session (provider docs blocked); the following
combines `[GH]` API-shape evidence with `[K]` operating experience and is labelled accordingly.

| Operation | Realistic p50 | Notes |
|---|---|---|
| Caption generation, small model, cached prefix | **0.5–2 s** `[K]` | Caching removes prefix processing |
| Caption generation, frontier model with reasoning | 3–15 s `[K]` | Do not put this in a keystroke-latency UI |
| Brand-voice / safety judging (small model) | 0.5–2 s `[K]` | Run in parallel with generation, not after |
| Embedding a post for novelty/fatigue scoring | <200 ms `[K]` | |
| Image generation, fast tier (`flux/schnell`, Imagen 4 Fast) | **2–6 s** `[K]` | Acceptable inline in a composer |
| Image generation, high tier (`gpt-image-1` high, Gemini 3 Pro Image) | 15–60 s `[K]` | Must be async with progress; `partial_images` (0–3) exists for exactly this `[GH]` |
| Video, 8 s clip, fast tier | **60–180 s** `[K]` | **Always async.** Poll (Runway: max once/5 s `[GH]`) or webhook (Veo, Kling, Akool `[GH]`) |
| Video, 8 s clip, high tier | 3–10 min `[K]` | |
| Avatar video, 30 s | 2–8 min `[K]` | |
| Lipsync/dub, 30 s | 1–5 min `[K]` | |
| Transcription, 60 min audio, Groq | **~1–3 min** `[K]` | Batch |
| Full long→short pipeline, 60 min source, 10 clips | **10–30 min** `[K]` | Transcribe → rank → cut → reframe → caption → render |
| One GEO monitoring answer (prompt → engine → parse) | 3–20 s `[K]` | Massively parallelisable |

**Three architectural rules follow:**
1. **Everything media is async, with webhooks where available and bounded polling where not.**
   A synchronous request/response product design will fail on video.
2. **Speculative generation is affordable.** At $0.0004 per caption, generating five variants the
   instant a user opens the composer — before they ask — costs $0.002 and eliminates all
   perceived latency. **Nobody does this.**
3. **Progressive disclosure.** `partial_images` for images, streaming for text, and a real
   progress percentage for video (Sora's job object exposes `progress` 0–100 `[GH]`).

### 7.6 The cost of the GEO product `[CALC]`

Assumption per answer: one engine call at ~800 input / 700 output tokens on a `gpt-5-mini`-class
model ($0.25/$2.00 per M) plus one search-API call. Search API rates `[GH]`: Serper $0.001/query,
DataForSEO $0.003, Parallel $0.004, Perplexity $0.005, Google PSE $0.005, Linkup $0.00587,
Tavily $0.008 (advanced $0.016), Linkup deep $0.05867. Using $0.005 as the blended rate:

**Per answer ≈ $0.0066.**

| Configuration | Per run | Weekly (per month) | Daily (per month) |
|---|---|---|---|
| 5 engines × 50 prompts = 250 answers | $1.65 | **$6.60** | $49.50 |
| 5 engines × 200 prompts = 1,000 answers | $6.60 | **$26.40** | $198.00 |
| 6 engines × 500 prompts = 3,000 answers | $19.80 | **$79.20** | $594.00 |

**Compare:** Meltwater, which sells `GenAI Lens` inside its suite, has a **median contract of
~$25,000/year** with a real-world range of **$15,000 to over $150,000/year.** `[CORPUS]`

A serious enterprise GEO configuration — 6 engines, 500 prompts, weekly, across 5 markets —
costs **$396/month in model and search spend.** The gross margin on this category is
extraordinary and the build is a few weeks. `[CORPUS]`'s judgement that it has "the highest
ratio of buyer interest to build cost in the market" is, on these numbers, an understatement.

### 7.7 What a sustainable AI credit system looks like

The category's credit systems are broken in a specific, diagnosable way (§2.6). Here is the design
that fixes it, derived entirely from the cost structure above.

#### Principle 1 — Meter what costs money; make free what is free.

| Operation | True cost | Metering |
|---|---|---|
| Caption / hashtags / rewrite / translate / alt text / reply draft | $0.0002–$0.008 | **Unlimited on every paid plan.** Fair-use ceiling only (e.g. 5,000/user/day) to stop abuse. |
| Brand-voice judging, safety checks, novelty scoring, fatigue detection | <$0.01/brand/month | **Free. Always on.** These are quality features, not consumption features. |
| Embeddings, listening classification, sentiment | negligible | **Free.** |
| Image generation | $0.003–$0.25 | **Metered**, tiered by quality |
| Video generation | $0.40–$15 per clip | **Metered**, priced per second |
| Avatar / UGC video | ~$2/minute | **Metered** |
| Dubbing / lipsync | $0.04–$0.05/sec | **Metered** |
| Long-audio transcription | $0.04/hour | **Metered above a generous included allowance** |
| GEO monitoring | $0.0066/answer | **Metered by prompts × engines × frequency** |

**Making text generation unlimited is a marketing weapon**, not a cost risk. The competitive set
meters it and users resent it `[CORPUS]`. A plan that says "unlimited AI writing, always" while
metering video honestly is both cheaper to serve and more attractive to buy.

#### Principle 2 — One credit = one cent of underlying cost, published.

Runway does this (`~$0.01 per credit`) and Stability does this (`1 credit = $0.01`). `[GH]` It is
the only honest unit. Publish a rate card:

| Operation | Credits | ≈ Underlying cost |
|---|---|---|
| Draft-quality image (1024²) | 1 | $0.003 |
| Standard image (1024×1536) | 6 | $0.04–0.06 |
| Text-in-image (Ideogram) | 8 | $0.06 |
| Image edit (Kontext pro) | 6 | $0.04 |
| Hero image | 20 | $0.13–0.17 |
| Video, economy, per second | 8 | $0.05 |
| Video, standard, per second | 14 | $0.08–0.10 |
| Video, premium, per second | 50 | $0.30–0.40 |
| Avatar video, per 30 s | 45 | ~$0.30 |
| Lipsync/dub, per second | 8 | $0.04–0.05 |
| Transcription, per audio-hour | 8 | $0.04 |
| GEO answer (1 prompt × 1 engine) | 1 | $0.0066 |

With a **3–5× markup** over underlying cost embedded in the credit price (sell credits at
$0.03–$0.05 each, or bundle them), the gross margin is healthy, the customer can *predict* their
bill, and the sales team can answer "what does a video cost?" with a number.

#### Principle 3 — Show cost before commitment, and after.

- **Pre-flight estimate in the UI**: "This 20-second Veo clip will use 160 credits (~$X)."
  Nobody does this. It removes the primary source of credit-system resentment, which is surprise.
- **Per-brand and per-workspace consumption reporting**, exportable. Agencies need to rebill.
- **Per-tenant attribution at the provider level** where available — Veo's `labels` field `[GH]`.
- **Budget caps and alerts** per workspace, per brand, per month, with a hard stop option.

#### Principle 4 — Rollover, top-ups, and no expiry games.

`[CORPUS]` records that Vista has **no published per-credit overage price** and that whether
overage top-ups exist at all is `UNVERIFIED`. That is a support-ticket generator. Ship: credits
roll over one month; top-up packs available self-serve at a published price; annual plans get
their credits front-loaded.

#### Principle 5 — Route by job, and let margin come from routing.

Because the cheap models are 20–100× cheaper than the expensive ones for equivalent quality on
short-form generation, **the routing policy is the margin.** A product that bills a flat credit
for "generate a caption" and serves it from `gemini-2.5-flash-lite` at $0.00037 has a structurally
better cost base than one serving everything from a frontier model — and the customer cannot
tell the difference on a 200-character caption. **Publish the fact that you route; do not publish
which model handles which job**, because that changes weekly (see the deprecation dates in §3.1.1).

### 7.8 Full-stack cost per brand per month `[CALC]`

A brand on an aggressive AI-native plan: daily post, one video/day, four image candidates/day,
full evaluation on every asset, weekly GEO monitoring, one long-form repurposing job/week.

| Line | Volume | Unit | Monthly |
|---|---|---|---|
| Captions + variants (5 per post, cached prefix) | 150 | $0.00019 (Flash-Lite cached) | **$0.03** |
| Brand-voice + safety + novelty judging (3 judges × 150) | 450 | $0.0008 (gpt-5-mini) | **$0.36** |
| Image candidates | 120 | $0.003 (`flux/schnell`) | **$0.36** |
| Selected images (published) | 30 | $0.04 (Imagen 4) | **$1.20** |
| Video, 15 s/day | 450 s | $0.05 (Veo 3.1 Lite 720p) | **$22.50** |
| Long-form repurposing, 4 × 60 min | 4 | $0.05 (transcribe + rank) | **$0.20** |
| Clip render (self-hosted, 40 clips) | 40 | ~$0.02 | **$0.80** |
| Voiceover, 30 × 60 s | 27,000 chars | $0.000015 (`tts-1`) | **$0.41** |
| Engagement prediction + fatigue + embeddings | continuous | — | **$0.10** |
| Reporting narrative (weekly + monthly) | 5 | $0.02 (long-context) | **$0.10** |
| GEO monitoring, 5 engines × 200 prompts, weekly | 4,000 answers | $0.0066 | **$26.40** |
| **Total model + media cost per brand per month** | | | **≈ $52.46** |
| *Same, without GEO* | | | **≈ $26.06** |
| *Same, video at premium tier (Veo 3.1)* | | | **≈ $210** |

**At a $99/month/brand price point, gross margin on the AI layer is ~47% with GEO included and
~74% without it — before any routing optimisation.** At $299/month for an agency plan covering
5 brands, the AI cost is ~$262 and the margin is thin; at $299 for 5 brands *without* daily
premium video, it is comfortable. **The pricing lever is video tier and GEO frequency, and both
should be explicit plan dimensions rather than buried in a credit pool.**

---

## 8. Rights, disclosure and safety

**This section is the one with a live deadline.** Article 50 of the EU AI Act came into
application **ten days before this document was written.**

### 8.1 EU AI Act — the verified timeline

Verified against EUR-Lex, DG CNECT, Council and Parliament sources on **2026-07-20** by the
maintainers of `studio121-develop/ai-act-compliance-skill`, and cross-read against
`EdgeF-4/ai-act-kit/docs/article-50.md`. `[GH]`

| Date | Event | Status |
|---|---|---|
| 1 Aug 2024 | AI Act (Regulation (EU) 2024/1689) enters into force | ✅ |
| 2 Feb 2025 | Prohibitions (Art. 5) + AI literacy (Art. 4) obligations apply | ✅ |
| 2 Aug 2025 | GPAI obligations apply | ✅ |
| 19 May 2026 | Draft Art. 6 high-risk classification guidelines published (consultation to 23 Jul 2026; **not yet adopted**) | 🟡 |
| **10 Jun 2026** | **Commission publishes the final Code of Practice on marking and labelling of AI-generated content** — a voluntary instrument to demonstrate compliance with Art. 50(2) and 50(4) | ✅ |
| 16 Jun 2026 | Digital Omnibus on AI (COM(2025) 836, procedure 2025/0359(COD)) approved by Parliament | ✅ |
| 29 Jun 2026 | Same, approved by Council | ✅ |
| **2 Aug 2026** | **Article 50 transparency obligations apply. NOT postponed by the Digital Omnibus.** | 🚨 **IN FORCE NOW** |
| **2 Dec 2026** | **End of the watermarking grace period for systems already on the market before 2 Aug 2026** | ⏳ ~4 months |
| Dec 2026 | New Art. 5 prohibitions (non-consensual intimate imagery / CSAM) effective | ⏳ |
| 2 Aug 2027 | National regulatory sandboxes (postponed from 2 Aug 2026) | ⏳ |
| **2 Dec 2027** | Annex III stand-alone high-risk obligations (**postponed** from 2 Aug 2026) | ⏳ |
| 2 Aug 2028 | Annex I regulated-product high-risk (**postponed** from 2 Aug 2027) | ⏳ |

**Open verification loop flagged by the source itself:** as of 2026-07-20 the Digital Omnibus's
**final Official Journal reference and exact entry-into-force date were not confirmed.** `[GH]`
Also: **no CEN/CENELEC harmonized standards had been cited in the OJ**, so there is no
presumption of conformity available yet. Both should be re-checked.

**Penalties.** Article 99(4): administrative fines up to **€15,000,000** or, for an undertaking,
up to **3% of total worldwide annual turnover** for the preceding financial year, **whichever is
higher.** `[GH]`

### 8.2 Article 50 — what it actually requires, by role

`[GH]`, from the practitioner breakdown in `ai-act-kit`:

| Provision | Duty | Falls on | What it means for a social tool |
|---|---|---|---|
| **50(1)** | People must be told they are interacting with an AI system, unless obvious in context | **Provider** designs it; **deployer** must ensure the notice is actually shown | **Every AI chatbot / DM-automation / AI-reply feature a customer runs on a brand's Messenger, WhatsApp or Instagram DMs needs an interaction notice.** Vista's chatbot builder, Sprout's FB Messenger/X DM chatbot, Hootsuite's Enterprise generative chatbot all engage this. `[CORPUS]` |
| **50(2)** | Synthetic audio, image, video and text must be **marked in a machine-readable format and detectable as artificially generated or manipulated** — "effective, interoperable, robust and reliable **as far as is technically feasible**" | **Provider of the generative system** (OpenAI, Google, Runway…), **not the deployer** | You are generally the *deployer* when you call Veo or Sora. **But if you fine-tune, or if you present generation as your own system, the provider analysis can shift onto you.** Get counsel on this specific question. Exception: systems performing "standard editing" that do not substantially alter the input. |
| **50(4a)** | **Deployers must disclose deepfakes** — image, audio or video generated or manipulated to resemble real people. Exception for artistic, creative, satirical or fictional work, where disclosure must not spoil the work | **Deployer** | **This is you and your customers.** Avatar/UGC-actor video, face swap, voice clones of real people, video translation that re-lipsyncs a real person — all squarely in scope. |
| **50(4b)** | Deployers must disclose **AI-generated text published to inform the public on matters of public interest.** Exception where the content had **human review / editorial control** and a person or organisation holds **editorial responsibility** | **Deployer** | The editorial-responsibility exception is the practical escape hatch for scheduled brand posts that a human approved — **which is an argument for keeping an approval record, per post, as a compliance artifact.** |
| **50(5)** | Information must be **clear and distinguishable, given at the latest at first interaction or exposure**, and meet accessibility requirements | Both | The accessibility requirement links to alt text and caption obligations. |
| **50(7)** | AI Office encourages codes of practice for detection and labelling; **C2PA is named as an example technical approach**. The law is technology-neutral — it names an outcome, not a format | — | See §8.3 |

**The honest limit on text marking**, stated by the `ai-act-kit` author and consistent with
published research: `[GH]`

- For **image, audio and video**, you can embed a cryptographically signed provenance manifest
  (C2PA). Removal or alteration is detectable. **This is robust and it is the right answer.**
- For **text**, there is no robust standard equivalent. Signed sidecars are tamper-evident *when
  present* but nothing stops someone copying the words and dropping the manifest. Statistical or
  steganographic watermarks (green-list token biasing, zero-width characters) are **cheaply
  removed by paraphrasing, translating, or any editor that normalises characters.**

The defensible layered answer for text: signed manifest where the carrier survives + an openly
documented reference token + **the visible disclosure that 50(4) requires anyway** + governance
evidence (audit log, inventory, exportable compliance report). Zero-width watermarking, if shipped
at all, should be labelled best-effort and never presented as proof.

### 8.3 C2PA / Content Credentials — the technical state

| Fact | Detail | Grade |
|---|---|---|
| Current specification | **C2PA 2.2** | `[GH]` |
| Reference implementation | `contentauth/c2pa-rs` (Rust), with a C API for binding into any language; `@contentauth/c2pa-node`; `c2pa-python`; `c2patool` CLI | `[GH]` |
| Identity binding | **CAWG identity assertion** (`cawg.io/identity`) — create, sign and validate identity assertions inside C2PA manifests | `[GH]` |
| Conformance | A **C2PA Conformance Program** with a **Conforming Products List** exists; **no library can appear on it** (it certifies products, not libraries) | `[GH]` |
| Key handling best practice | **Delegate signing to a separate service so the private key never touches the web application.** The `provemark` PHP library does exactly this (framework-agnostic core over PSR-18 talking to a Node signing service). | `[GH]` |
| Marking AI generation | `c2pa.actions.v2` / `c2pa.created` assertion with **`digitalSourceType = trainedAlgorithmicMedia`** | `[GH]` |
| Marking AI **manipulation** | Requires **the original asset**, because C2PA records an edit as a `c2pa.opened` action pointing at an **ingredient whose hash covers the original's bytes** — you cannot substitute a filename or a supplied digest | `[GH]` |
| Soft binding | When the embedded manifest is stripped, a **TrustMark watermark** can survive and provenance is recoverable via the **CAI Soft-Binding Resolution API** | `[GH]` |
| Google's parallel mechanism | **SynthID.** The Google GenAI SDK exposes `add_watermark: bool` on image generation configs, documented as "add a SynthID watermark to the generated images." **Operational gotcha: `seed` is not available when `add_watermark` is true** — you cannot have both reproducibility and watermarking in the same call. | `[GH]` |
| Music provenance | Google **Lyria** MP3s carry C2PA manifests (a dedicated MCP server exists to read them) | `[GH]` |

#### The platform-stripping problem — and how to reason about it

`amanzainal/c2pa-stripcheck` exists precisely because "the only answers are scattered manual blog
anecdotes." Its four-verdict taxonomy is the right mental model: `[GH]`

| Verdict | Meaning | Consequence for a publisher |
|---|---|---|
| ✅ **PRESERVED** | Manifest survived intact, same signer | Provenance chain holds end-to-end |
| ❌ **STRIPPED** | Manifest gone, nothing recoverable | Your disclosure must be **visible**, not just embedded |
| 🔁 **RE-SIGNED** | Platform replaced your manifest with its own credentials | Your authorship claim is gone; the platform's claim replaces it |
| 🔗 **SOFT-BINDING-RECOVERABLE** | Embedded manifest gone but a TrustMark watermark survived → recoverable via the CAI Soft-Binding Resolution API | Partial; depends on a resolution service |

**Which platforms do which is `UNVERIFIED` this session** — the tool exists to answer that
question and its published matrix is a demo with synthetic fixtures, not real platform results.
**Recommendation: run this measurement yourself, per platform, per media type, and publish the
matrix.** It is a two-day project, it produces a genuinely novel artifact, and it is the kind of
thing that earns a category authority position.

### 8.4 Platform AI-labelling policies

**All `[K]`, cutoff May 2026. Vendor and platform policy pages were unreachable this session.
Re-verify every row before it becomes product logic.**

| Platform | Mechanism `[K]` | Notes |
|---|---|---|
| **Meta (Facebook / Instagram / Threads)** | **"AI info"** label (renamed from "Made with AI" in July 2024 after creator backlash about over-labelling ordinary edits). Applied automatically when industry-standard **IPTC metadata or C2PA credentials** are detected on an upload, and via a **self-disclosure toggle** the poster is required to use for realistic AI-generated video/audio. Penalties for non-disclosure of high-risk realistic content. | The auto-detection path means **signing your assets causes the label to appear**. That is a *feature* for compliance and a *conversion consideration* for the customer, and the product should let them see it coming. |
| **TikTok** | **AIGC label.** TikTok was the **first video platform to implement C2PA Content Credentials for automatic labelling** (announced May 2024), reading credentials on upload and attaching an "AI-generated" label. Also a **mandatory creator disclosure toggle** for realistic AI content, and TikTok attaches Content Credentials to content created with its own AI effects. | The strongest C2PA read/write posture of the major platforms `[K]`. |
| **YouTube** | **"Altered or synthetic content" disclosure** in Creator Studio at upload (March 2024). Disclosure surfaces in the expanded description, and **on the video player itself for sensitive topics** (health, elections, finance, ongoing conflicts). Separate **likeness-detection** tooling for creators. | Required for realistic synthetic content, not for obviously unreal or minor production assistance `[K]`. |
| **X** | Community Notes and synthetic-media policy; no first-party AI-label pipeline of the Meta/TikTok kind `[K]` | `UNVERIFIED` for 2026 state. |
| **LinkedIn** | Displays C2PA Content Credentials on images where present `[K]` | `UNVERIFIED` for 2026 state. |
| **Pinterest** | AI-modified labelling using metadata `[K]` | `UNVERIFIED`. |

**What this means for product design — and it is not complicated:**

1. **AI-generation provenance must be a first-class field on every asset in the media library**,
   set at generation time, not inferred later: `{ ai_generated: bool, ai_modified: bool, model,
   model_version, prompt_hash, is_deepfake_of_real_person: bool, human_reviewed_by, reviewed_at }`.
2. **The composer must set each platform's disclosure flag automatically** from that field, per
   network, at publish. Meta's toggle, TikTok's AIGC switch, YouTube's altered-content
   declaration are all distinct API/UI surfaces with distinct semantics.
3. **The visible disclosure text** required by Art. 50(4)/(5) must be configurable per brand and
   per platform, appended or overlaid, and **recorded**.
4. **The human-approval record is a compliance artifact**, because it is the Art. 50(4b)
   editorial-responsibility exception. Store who approved, when, and what they saw.

**No social media management tool in this corpus does any of these four things.** `[CORPUS]` +
this session's review. That is now a legal gap, not a feature gap.

### 8.5 Deepfake, likeness and voice law

`[K]`, cutoff May 2026. **This area moved fast and is the most likely part of this document to be
stale. Get counsel; do not build policy from this table.**

| Jurisdiction | Instrument `[K]` | Relevance |
|---|---|---|
| **EU** | AI Act Art. 50(4) deepfake disclosure; new Art. 5 prohibitions on non-consensual intimate imagery effective Dec 2026 `[GH]` | Direct |
| **US federal** | **TAKE IT DOWN Act** (2025) — criminalises non-consensual intimate imagery incl. AI-generated, with platform notice-and-removal duties. **NO FAKES Act** — federal digital-replica right — introduced, status `UNVERIFIED`. | Direct for avatar/voice-clone features |
| **US — Tennessee** | **ELVIS Act** (2024) — voice explicitly protected as a property right | Voice cloning |
| **US — California** | AB 602 / AB 853 / AB 1836 family — digital replicas of performers, deceased personality rights, provenance requirements on capture devices and large platforms | Avatar + UGC actors |
| **US — New York** | Digital replica provisions in performer contracts | Avatar |
| **Denmark** | Proposal to extend copyright-style protection to a person's own likeness/voice `[K]` | Watch |
| **China** | Labelling rules requiring conspicuous marking of AI-generated content, plus deep-synthesis provisions `[K]` | Relevant to any regional expansion (see `08-platform-apis-regional.md`) |

**Product rules that fall out regardless of jurisdictional detail:**

- **Voice cloning and avatar creation must require a recorded consent artifact** from the person
  whose likeness/voice is used — an uploaded signed release, or a verified consent capture flow
  — stored with the asset, with an expiry and a revocation path.
- **Third-party likeness must be blocked by default.** A feature that lets a marketer generate a
  video of a real person they do not represent is a liability, not a feature. Vendors in the
  avatar space handle this with identity verification on custom avatar creation `[K]`; a social
  tool reselling avatar generation inherits the duty.
- **Deceased persons and public figures need an explicit policy**, because the personality-rights
  position varies by jurisdiction and several of the newer statutes are specifically about them.

### 8.6 Training-data licensing and indemnification

| Fact | Grade |
|---|---|
| **Adobe Firefly offers IP indemnification for AI-generated content.** In 2026 procurement, "will you indemnify us if your AI generates infringing content?" is a live question and **almost no SMM vendor answers it.** | `[CORPUS]` |
| **Reddit's Commercial Data API is $0.24 per 1,000 calls**, contract manually reviewed; the top tier (AI training) is privately negotiated, and **the Google deal is reportedly ~$60M/year.** | `[CORPUS]` |
| **Enterprise buyers now require the sub-processor list to name AI model vendors**, because "many AI platforms rely on third-party AI models for content generation, and enterprises need to understand what data flows to these services and how it's protected." | `[CORPUS]` |
| **Region-pinned AI inference** (no cross-border model calls) is an **emerging procurement gate, rising fast**. Sprinklr offers it. | `[CORPUS]` |
| **"No training on customer data"** clauses are now standard asks in the Trust Center package. | `[CORPUS]` |
| **Model disclosure, no-training guarantees and region-pinned inference are inconsistently documented across every vendor**, while 2026 buyers explicitly demand to know what data flows where. | `[CORPUS]` |

**The commercially-safe generation stack**, if indemnification and provenance are requirements:

| Layer | Safe choice | Why |
|---|---|---|
| Image | Adobe Firefly (indemnified), Imagen (SynthID + Google terms), Getty/Shutterstock generative | Trained on licensed corpora; indemnity available |
| Video | Veo, Sora, Runway under enterprise terms | Read the terms; indemnity varies |
| Music | **SOUNDRAW / Stable Audio / ElevenLabs commercial tiers**, or the platform's own commercial library | Copyright-cleared is the product |
| Voice | Licensed voice libraries; cloning only with consent artifact | §8.5 |
| Stock fallback | Licensed stock with a stored licence record | Always |

**And the honest counter-position:** if you cannot offer indemnification, say so plainly and
compete on **provenance and traceability instead** — every asset carries its model, version,
prompt hash, C2PA manifest and approval record, so the customer can answer questions about it.
That is a weaker claim than indemnity but it is a *real* one, and it is more than any competitor
in this corpus currently offers.

### 8.7 Consolidated compliance build list

Everything in §8 reduces to nine buildable items. None takes more than a sprint.

| # | Item | Driver | Effort |
|---|---|---|---|
| 1 | AI-provenance fields on every media asset (generated/modified, model, version, prompt hash, deepfake flag) | Art. 50(4), platform labels | S |
| 2 | **C2PA signing at generation**, via an isolated signing service, `digitalSourceType = trainedAlgorithmicMedia` | Art. 50(2)/(7), Code of Practice 10 Jun 2026 | M |
| 3 | Per-platform AI-label propagation at publish (Meta toggle, TikTok AIGC, YouTube altered-content) | Platform policy | M |
| 4 | Configurable visible disclosure text, per brand, per platform | Art. 50(4)/(5) | S |
| 5 | Chatbot/DM interaction notice, enforced, with a per-conversation record | Art. 50(1) | S |
| 6 | Human-approval record per post (who, when, what they saw) | Art. 50(4b) editorial exception | S |
| 7 | Consent artifact store for voice clones and avatars, with expiry + revocation | §8.5 | M |
| 8 | Sub-processor register naming every AI model vendor, with per-region inference routing | Procurement gate | M |
| 9 | Exportable AI compliance report (inventory + audit log + disclosure evidence) | Enforcement readiness | M |

**Items 1, 4, 5 and 6 are together maybe two weeks of work and they are the difference between
"has an AI story" and "can survive an enforcement review."**

---

## 9. The 100x claim — how to state it so it survives contact with a buyer

### 9.1 What not to claim

- **Not "100x better content."** Quality is capped by the frontier model, which every competitor
  also calls. Any quality claim invites a blind test you will not clearly win.
- **Not "100x faster captions."** Captions are already instant and already free. Nobody's
  bottleneck is caption speed.
- **Not "AI agents that run your social."** Everyone says this, nobody has shipped L3, and buyers
  have learned to discount it. `[CORPUS]`: "everyone shipped an agent, nobody shipped autonomy."

### 9.2 What to claim — five defensible, arithmetic multiples

**1. 100x decisions evaluated per human hour.**
A human with a caption assistant evaluates roughly 5–10 creative decisions per hour. The stack
priced in §7 generates 5 copy variants × 4 image variants × ranked video options and *scores* all
of them on brand voice, safety, novelty and predicted engagement, for **$0.40 per post**, in
parallel, continuously. 10 decisions/hour → 1,000+ scored candidates/hour. The multiple is real
and the cost supports it.

**2. 20x formats and markets from one brief.**
One brief → static (6 native aspect ratios via `gpt-image-2` arbitrary resolution) + carousel +
15s video + avatar UGC cut + auto-clipped long-form + 20 dubbed language variants. Cost, from §7:
**under $30 for the 20-language localisation**, **$0.75 for the video**, **$0.04 for the image**.
Today every one of those is a separate tool, a separate subscription and a separate human.

**3. 500x faster trend-to-published.**
Day-and-a-half human loop → **sub-five-minute policy-gated loop** (§5.5). This is the most
legible demonstration and the one to lead a demo with.

**4. Net-new surface: AI answer engines.**
Not a multiple — a category the incumbents do not address at all. Measurement costs **$26.40/month
per brand** (§7.6) and the publishing rails that fix it are already in the product (§6.6).

**5. 45%+ structural cost advantage.**
Prompt-cached prefixes (−45% on text), job-appropriate model routing (20–100× spread between
model tiers on equivalent short-form output), draft-tier image generation for candidates, and
economy-tier video for volume. A competitor serving everything from a frontier model and metering
captions has a strictly worse cost base **and** a worse customer experience.

### 9.3 The claim, in one paragraph you could put on a page

> One brief becomes fifty scored, on-brand, disclosed, provenance-signed assets across six
> formats and twenty languages — generated, evaluated, allocated across your posting queue by a
> bandit, published through official platform APIs, measured on both social engagement and
> citation in ChatGPT, Perplexity and Google AI Overviews, and fed back into the next generation
> — for less than the cost of the coffee your last agency status call was held over. Every action
> is policy-gated, reversible and logged.

Every clause in that paragraph is priced, sourced or specified somewhere above.

---

## 10. The build list — what to ship, ranked by (impact ÷ effort)

| # | Capability | Why it wins | Effort | Verified basis |
|---|---|---|---|---|
| 1 | **Unlimited text AI; meter only media** | Removes the category's most-complained-about friction; costs nothing (§7.7) | **XS** | §7.1, `[CORPUS]` complaints |
| 2 | **Per-client brand voice + Knowledge (RAG) isolation** | The one checkable agency differentiator; Vista sets the bar | S | `[CORPUS]` §19.3–19.4 |
| 3 | **Novelty / creative-fatigue scoring vs the brand's own 90-day corpus** | Free (embeddings), nobody ships it, immediately visible value | **XS** | §5.4 |
| 4 | **Pre-flight cost estimate in the composer** | Kills the #1 credit-system resentment | XS | §7.7 |
| 5 | **AI-provenance fields + visible disclosure + approval record** | Art. 50 in force *now*; 2 weeks | S | §8.7 items 1,4,5,6 |
| 6 | **Long-form → short-form clip extraction inside the scheduler** | The largest unclaimed adjacency; **$0.15–$0.60 per hour of source** | M | §3.6, `[CORPUS]` §10.3 |
| 7 | **Video generation as a first-class composer primitive**, economy/standard/premium tiers | $22.50/brand/month at economy tier | M | §3.1, §7.3 |
| 8 | **AI-answer visibility (GEO) measurement + publish-to-cited-sources loop** | Net-new surface, $26/brand/month, nobody connects it to publishing | M | §6 |
| 9 | **Outbound MCP server** | Table stakes by end-2026; invisibility risk otherwise | S | §4.6 |
| 10 | **C2PA signing at generation** | Legal + the Code of Practice (10 Jun 2026) + a genuine trust claim | M | §8.3 |
| 11 | **Autonomy policy objects + agent decision traces in the audit log** | Converts AI risk into procurement advantage; only Sprinklr is near it | M | §4.3, `[CORPUS]` |
| 12 | **Bandit creative allocation over the posting queue** | Nobody in organic; the core of the 100x arithmetic | M | §4.4 |
| 13 | **Hook + thumbnail variant generation and judging** | <$0.20 per post to test 32 combinations | S | §5.2 |
| 14 | **Multi-language localisation (dub + lipsync) as a publishing option** | <$30 for 20 markets; zero competitors | M | §3.5 |
| 15 | **Calibrated engagement prediction with published reliability** | Hard, defensible, and calibration alone is a credibility weapon | **L** | §5.1 |
| 16 | **Cross-account randomised creative trials** (agency / multi-location) | Real experiments for the highest-paying segment | M | §4.4.2 |
| 17 | **Shadow mode + agent QA replay harness** | The gate that lets a buyer say yes to L3 | M | §4.3 |
| 18 | **C2PA platform-stripping matrix, measured and published** | Novel artifact; category-authority play | **XS** | §8.3 |
| 19 | **Sub-processor register naming AI vendors + region-pinned inference** | Rising enterprise gate | M | `[CORPUS]` |
| 20 | **Hashtag *performance* analytics** (which hashtags drove reach) | Explicit gap in the benchmark product | S | `[CORPUS]` §10 |

**Items 1, 3, 4 and 18 are all XS and all unshipped by the entire market.** Ship those in the
first month and the product already has four things no competitor has.

---

## 11. Verification ledger — what must be re-checked

| # | Claim | Current grade | How to verify |
|---|---|---|---|
| 1 | Sora 2 `deprecation_date: 2026-09-24` — is Sora 2 actually sunsetting in six weeks, or is this a LiteLLM metadata artefact? | `[GH]` (DB field) | OpenAI model deprecation page. **High priority — it invalidates a build if true.** |
| 2 | Runway Aleph price: $0.15/sec (LiteLLM) vs $0.28/sec (Runway pricing guide via api-evangelist) | Conflicting `[GH]` | `docs.dev.runwayml.com/guides/pricing/` |
| 3 | HeyGen and Synthesia per-unit API pricing | `UNVERIFIED` — harvested plan files are scaffolds | Vendor pricing pages |
| 4 | Predis.ai, Ocoya, Lately.ai, Flick, Taplio 2026 feature sets and pricing | `[K]` at May 2026 | Vendor sites; **could not be reached this session** |
| 5 | Opus Clip / Vizard / Klap / Submagic API endpoints, limits and pricing | `UNVERIFIED` (profiles are enrichment stubs) | `opus.pro` developer docs |
| 6 | Platform AI-labelling policies (Meta AI info, TikTok AIGC, YouTube altered-content) 2026 state | `[K]` at May 2026 | `transparency.meta.com`, TikTok newsroom, YouTube Help — **all blocked this session** |
| 7 | Which platforms preserve / strip / re-sign C2PA on upload | `UNVERIFIED` | Run `c2pa-stripcheck` against real accounts. **Recommended as an owned artifact.** |
| 8 | Digital Omnibus final OJ reference and entry-into-force date | `UNVERIFIED` (flagged by the source itself as of 2026-07-20) | EUR-Lex |
| 9 | Whether any answer engine consumes `llms.txt` as a retrieval or ranking signal | `UNVERIFIED` since the proposal | Controlled experiment; treat vendor claims sceptically |
| 10 | Whether Hootsuite `Wisdom` can take write actions unattended | `UNVERIFIED` `[CORPUS]` | Trial / sales conversation |
| 11 | Khoros 2026 agentic AI story — does a branded agent exist? | `UNVERIFIED` `[CORPUS]` | Vendor site |
| 12 | Vista Social AI credit allowances (500/1,000 vs 2,500/10,000) and whether captions consume credits | Conflicting `[CORPUS]` | Live account test |
| 13 | Whether any SMM vendor offers AI IP indemnification | `UNVERIFIED` `[CORPUS]` | Contract review; Adobe Firefly is the benchmark |
| 14 | NO FAKES Act status; state digital-replica law changes since May 2026 | `[K]` | Counsel |
| 15 | Arcads (UGC actor platform) API, pricing and consent model | `UNVERIFIED` — absent from the api-evangelist registry | Vendor site |
| 16 | Latency figures throughout §7.5 | `[K]` / vendor-stated | **Measure them yourself.** Publishing measured p50/p95 per operation would itself be a differentiator. |
| 17 | Cartesia "90 ms first audio byte" | Vendor claim relayed by a third-party profile `[GH]` | Benchmark |
| 18 | Kling per-second credit rates and resource-pack SKUs | `[GH]` but explicitly `reconciled: false` | `kling.ai/dev/pricing` |
| 19 | Luma "Scale" provisioned throughput at $2,100–$3,800/month per unit, 8-unit minimum | `[GH]`, May 2026 snapshot | Luma billing dashboard |
| 20 | gpt-image-1.5 / gpt-image-2 effective per-image cost at each quality tier | Token-billed; per-image not published in the DB | OpenAI pricing page |

---

## 12. Sources

### 12.1 Retrieved this session (GitHub-hosted, all reachable and re-checkable)

| Source | URL |
|---|---|
| LiteLLM model pricing DB (3,003 entries) | `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json` |
| OpenAI Python SDK — video params | `https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/video_create_params.py` |
| OpenAI Python SDK — video object | `https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/video.py` |
| OpenAI Python SDK — image params | `https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/image_generate_params.py` |
| Google GenAI Python SDK types (Veo, Imagen, SynthID) | `https://raw.githubusercontent.com/googleapis/python-genai/main/google/genai/types.py` |
| AI crawler registry (163 agents) | `https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json` |
| Awesome MCP Servers (1.34 MB) | `https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md` |
| MCP reference servers | `https://github.com/modelcontextprotocol/servers` |
| C2PA Rust SDK (spec 2.2, CAWG) | `https://raw.githubusercontent.com/contentauth/c2pa-rs/main/README.md` |
| C2PA platform-strip tester | `https://github.com/amanzainal/c2pa-stripcheck` |
| C2PA PHP library w/ AI Act Art. 50 marking | `https://github.com/provemark/content-credentials` |
| EU AI Act compliance skill — verification status | `https://raw.githubusercontent.com/studio121-develop/ai-act-compliance-skill/main/LAST_VERIFIED.md` |
| EU AI Act Art. 50 implementation guide | `.../ai-act-compliance-skill/main/references/transparency-implementation.md` |
| Article 50 practitioner breakdown | `https://raw.githubusercontent.com/EdgeF-4/ai-act-kit/main/docs/article-50.md` |
| EU AI Act MCP (enforcement timeline) | `https://github.com/closermethod/eu-ai-act-mcp` |
| Open-source Opus Clip alternative (pipeline reference) | `https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator` |
| GEO/AEO audit skill (methodology) | `https://raw.githubusercontent.com/OranAi-Ltd/orangeo-ai-visibility-skill/main/README.md` |
| AEO build-time toolkit | `https://github.com/rubenmarcus/aeo.js` |
| llms.txt origin spec | `https://github.com/AnswerDotAI/llms-txt` |
| llms.txt directory | `https://github.com/thedaviddias/llms-txt-hub` |

### 12.2 api-evangelist provider profiles (independent third-party API profiles, modified 11–12 Aug 2026)

`https://github.com/api-evangelist/<name>` for: `runwayml`, `runway`, `heygen`, `synthesia`,
`elevenlabs`, `cartesia-ai`, `podcastle`, `kling-ai`, `luma-ai`, `luma-labs`, `hailuo-ai`,
`minimax-ai`, `pika`, `pika-labs`, `lightricks`, `creatify`, `argil`, `akool`, `colossyan`,
`hourone`, `sync-labs`, `ideogram`, `midjourney`, `stability-ai`, `stability-audio`,
`leonardo-ai`, `freepik`, `recraft`-adjacent entries, `suno`, `udio`, `soundraw`, `glio`,
`youart`, `runware`, `replicate`, `novita-ai`, `cometapi`, `together-ai`, `slng`,
`cloudflare-ai-gateway`, `carrot-labs`, `amazon-nova`, `xai`, `doubao`, `zhipu-ai`, `genmo-ai`,
`absurd`, `opusclip`, `opus`, `bluefish-ai`, `sitefire`, `rankscience`, `socialbee`, `hootsuite`,
`sendible`, `publer`, `postiz`, `picsart-socialin`, `playplay`, `templated`, `memesio`,
`lets-enhance`, `meitu`, `pruna-ai`, `wistia`, `vdocipher`, `autocontent-api`,
`salad-transcription-api`, `glif-app`, `the-promenade`, `monid`.

**Provenance caveat, stated by the source itself:** these are independent third-party profiles
assembled from publicly-reachable material (websites, developer portals, published OpenAPI /
`llms.txt` / `apis.json`, public repositories, public status/pricing/changelog pages). They are
not vendor-authored. Files marked `reconciled: false` are explicitly unreconciled against live
pricing; several plan files (HeyGen, Synthesia) are **scaffolds, not data**, and are treated as
`UNVERIFIED` above.

### 12.3 Internal corpus

- `01-vista-social-full-audit.md` — §4.5 (AI credits), §19 (AI layer), §23.2 (MCP server)
- `02-vista-social-deep-modules.md` — publishing pipeline, inbox data model
- `03-competitors-enterprise.md` — §1.3 (the 2026 AI inflection), §3.3 (Trellis), §4.3 (Hootsuite AI), §5.3 (Sprinklr agentic stack), §9 (Meltwater / GenAI Lens), §16 (gaps), §18 (pricing)
- `04-competitors-smb.md` — §10 (AI capability assessment), §10.3 (the video-AI gap)
- `05-competitors-dev-oss.md`, `06-platform-apis-tier1.md`, `07-platform-apis-tier2.md` — platform API constraints referenced in §4.2.3

### 12.4 Sources that could NOT be reached this session

`openai.com`, `platform.openai.com`, `docs.anthropic.com`, `ai.google.dev`, `cloud.google.com`,
`elevenlabs.io`, `heygen.com`, `synthesia.io`, `runwayml.com`, `fal.ai`, `replicate.com`,
`huggingface.co`, `arxiv.org`, `bfl.ai`, `ideogram.ai`, `opus.pro`, `vizard.ai`, `klap.app`,
`submagic.co`, `predis.ai`, `ocoya.com`, `lately.ai`, `taplio.com`, `flick.social`,
`meltwater.com`, `sproutsocial.com`, `hootsuite.com`, `sprinklr.com`, `vistasocial.com`,
`transparency.meta.com`, `newsroom.tiktok.com`, `support.google.com`, `eur-lex.europa.eu`,
`digital-strategy.ec.europa.eu`, `c2pa.org`, `contentauthenticity.org`, `news.ycombinator.com`,
`en.wikipedia.org`.

All returned `EGRESS_BLOCKED` from the organisation's egress proxy, or were unreachable because
the `WebSearch` budget (200/200) was already exhausted when this file began. **Any fact in this
document that depends on one of these hosts is graded `[K]` or `UNVERIFIED` accordingly.**

---

*End of `09-ai-frontier.md`. Written 12 August 2026.*



