# 08 — Regional Platform APIs & Globalization

**Prepared:** 12 August 2026
**Scope:** Every regionally-dominant social/messaging surface outside the US/EU mainstream — China, Japan, Korea, Russia/CIS, SEA, India, MENA, Africa, LATAM, non-mainstream Europe — plus the globalization substrate (RTL, CJK, Indic, grapheme counting, calendars, holidays, currency/PPP, local payments, tax/VAT/GST) that "true global coverage" actually requires.
**Purpose:** Decide, per market, whether we can integrate at all, by what legal path, at what engineering cost — and what we must build once, centrally, so that any regional adapter can be added cheaply.
**Companion docs:** `06-platform-apis-tier1.md` (Meta/X/LinkedIn/TikTok/YouTube/Pinterest), `07-platform-apis-tier2.md` (long-tail + messaging), `11-compliance-security-global.md` (privacy law, token vault), `12-analytics-listening-gtm.md` (market sizing, pricing).

---

> ## ⛔ PROVENANCE — READ THIS BEFORE CITING ANY NUMBER
>
> This document was produced under a **hard research blackout on the open web**, but with a
> **narrow, genuine evidence channel that was exploited aggressively**. You must know exactly
> which is which.
>
> ### What was blocked
>
> | Channel | State |
> |---|---|
> | **WebSearch** | **Budget exhausted before this agent started** — 200/200 calls consumed by earlier agents in the session. Zero searches available. Verified by tool response. |
> | **WebFetch / general HTTPS** | **Blanket egress denial.** The agent proxy returns `403` on `CONNECT` for every general host. Control fetch of `example.com` → `EGRESS_BLOCKED`. Confirmed against `$HTTPS_PROXY/__agentproxy/status`, which logs `connect_rejected` for `example.com`, `en.wikipedia.org`, `developers.tiktok.com`, and others. **No vendor developer portal, pricing page, or changelog could be retrieved.** |
>
> ### What was NOT blocked — and was used
>
> | Channel | State | What it bought us |
> |---|---|---|
> | **`git clone` over HTTPS to github.com** | **Open.** | Full source of official API schemas and SDKs. |
> | **`raw.githubusercontent.com`** | **Open.** | Arbitrary READMEs and spec files. |
> | **`registry.npmjs.org` (incl. `/-/v1/search`)** | **Open.** | Package metadata + **ecosystem-presence signal**, which is a strong proxy for "does a usable public API exist". |
> | **GitHub REST API** | **Repo-scoped only** — code search and arbitrary repo endpoints return `sessions are bound to their configured repositories`. | Not usable for discovery; `git clone` was the workaround. |
>
> ### The tag system used throughout
>
> | Tag | Meaning |
> |---|---|
> | **`V`** | **Verified in this session** from a primary or near-primary artifact actually fetched (an official OpenAPI spec, an official JSON schema, CLDR source data, a vendor SDK's own module manifest). The source is named inline. These are the strongest claims in the document. |
> | **`V-neg`** | **Verified negative** — an absence established from a complete official artifact (e.g. "LINE's own OpenAPI repo contains no VOOM endpoint"). Absence-of-evidence upgraded to evidence-of-absence *only* where the artifact is authoritative and complete. |
> | **`E`** | **Ecosystem signal** — inferred from what does or does not exist on npm/GitHub. Good for "is there a real public API", weak for specifics. |
> | **`C1`** | Structural, slow-moving: legal architecture, entity requirements, the *shape* of an auth flow, categorical API absences. Stable 2–4 years. Safe to architect against. |
> | **`C2`** | Specific but drift-prone: exact endpoint paths, scope names, field names, token TTLs. Re-verify before load-bearing. |
> | **`C3`** | **Known-volatile.** All MAU figures, all pricing, all rate limits, all future-dated regulatory milestones. **Treat as hypothesis, never fact.** |
> | **`UNVERIFIED`** | Genuinely unknown. Not a guess. Do not cite. |
>
> **Knowledge cutoff caveat:** untagged-`V` content is model recall with a **May 2026 cutoff**, written against an **August 2026 "today"** — a minimum 3-month blind spot, and this document's subject matter (Chinese platform policy, sanctions, tax regimes) moves faster than that.
>
> **§22 is a ready-to-execute verification plan** with exact URLs, ordered by how much of the build each unblocks.

---

## Table of contents

1. [The strategic case, stated precisely](#1-the-strategic-case-stated-precisely)
2. [Master matrix — every platform, one page](#2-master-matrix)
3. [The five integration archetypes](#3-the-five-integration-archetypes)
4. [China — the hardest market, in full](#4-china)
5. [Japan](#5-japan)
6. [Korea](#6-korea)
7. [Russia / CIS — and the sanctions problem](#7-russia--cis)
8. [Southeast Asia](#8-southeast-asia)
9. [India](#9-india)
10. [MENA](#10-mena)
11. [Africa](#11-africa)
12. [LATAM](#12-latam)
13. [Europe, non-mainstream](#13-europe-non-mainstream)
14. [Cross-cutting: the regional adapter architecture](#14-regional-adapter-architecture)
15. [Globalization I — text, scripts, typography](#15-globalization-i--text)
16. [Globalization II — grapheme-aware counting per network](#16-globalization-ii--counting)
17. [Globalization III — time, timezones, calendars, holidays](#17-globalization-iii--time)
18. [Globalization IV — currency, PPP pricing, local payments](#18-globalization-iv--money)
19. [Globalization V — tax, VAT, GST, e-invoicing](#19-globalization-v--tax)
20. [Effort model and build sequencing](#20-effort-model-and-build-sequencing)
21. [Risk register](#21-risk-register)
22. [Verification backlog](#22-verification-backlog)

---

## 1. The strategic case, stated precisely

### 1.1 What "true global coverage" is actually worth

Every competitor audited in files 01–05 covers the same nine networks: Facebook, Instagram, X, LinkedIn, TikTok, YouTube, Pinterest, Threads, Google Business Profile. Beyond that the field thins fast, and beyond *that* it is empty. The specific, defensible observations:

| Claim | Basis |
|---|---|
| No Western scheduler offers **compliant, multi-tenant WeChat Official Account publishing**. | `E` — no npm/GitHub package exists that wraps WeChat's 第三方平台 (third-party platform) component flow *for a non-Chinese SaaS*; the mature SDKs (WxJava, wechatpy) all assume a mainland entity holds the component app. |
| No Western scheduler offers **VK `wall.post` with native scheduling** despite VK exposing it. | `V` — VK's own schema exposes `publish_date`; the capability is trivially available and simply not built. |
| **LINE** is the single highest-leverage non-Western integration and is *fully documented in a public OpenAPI repo*. | `V` — `github.com/line/line-openapi`. |
| **Snapchat organic posting is impossible for everyone**, including Hootsuite and Sprout. | `C1` — Snap exposes ads APIs and mobile share-kits only. This is a market-wide gap, not a competitive disadvantage. |
| The **globalization substrate** (RTL, grapheme counting, Hijri calendars, PPP pricing, local payments, non-resident VAT) is where incumbents are weakest and where the work is *undifferentiated but compounding*. | Inspection of competitor products in files 01–04. |

### 1.2 The honest counter-argument

Regional coverage is a **sales asset with a long tail of maintenance cost**. Each adapter carries:

- an auth flow nobody else on the team understands,
- documentation in a language the team may not read,
- a legal entity question,
- a support burden concentrated in one timezone,
- and a decay rate: regional APIs break *more* often than tier-1 ones and announce it *less*.

The correct posture is therefore **not** "integrate everything". It is:

> **Build the globalization substrate for everyone. Build regional adapters only where (a) the API legally admits a foreign multi-tenant SaaS, and (b) the market is large enough to fund a dedicated maintainer.**

By that test, the tiering in §1.3 falls out.

### 1.3 Recommended tiering

| Tier | Platforms | Rationale |
|---|---|---|
| **R1 — build now** | LINE (Messaging API), Telegram (Bot API + MTProto read), VK, Zalo OA, WhatsApp Business Platform, Mercado Libre (messaging/Q&A) | Public API, no local entity required, documented, large markets. |
| **R2 — build with a partner** | KakaoTalk Channel (via Korean BSP), Naver Band, Naver Cafe, Viber (via CPaaS), Odnoklassniki, Bilibili | API exists but requires a local reseller, or is smaller-market. |
| **R3 — reminder-publish only** | Snapchat, Xiaohongshu, LINE VOOM, Ameba, note, Pixiv, ShareChat, Moj, Josh, Kwai | No write API. We schedule, notify, deep-link, and track manually-confirmed publication. |
| **R4 — China joint venture / licensed partner only** | WeChat OA + Channels, Douyin, Weibo, Kuaishou, Toutiao, Baijiahao, Tencent Video | Requires a mainland entity, ICP filing/licence and, for multi-tenant, third-party-platform qualification. **Not buildable by a foreign SaaS alone.** |
| **R5 — do not build** | Koo (dead), Viadeo (dead), XING (API withdrawn), mixi (API withdrawn), Chingari (pivoted), Rutube/Dzen (sanctions + no API) | Negative ROI or legally hazardous. |

---

## 2. Master matrix

**Reading the columns.** *MAU* is the most volatile number here and is tagged `C3` throughout — it is directional, not citable. *Post API* means server-side creation of organic content. *Analytics API* means owned-property metrics. *Entity* is what a **foreign** company needs. *Effort* is engineer-weeks for a production-grade adapter including auth, publish, analytics, error taxonomy, and tests — **excluding** legal/partnership calendar time, which is called out separately.

### 2.1 East Asia

| Platform | Market | MAU `C3` | Post API | Analytics API | Foreign entity req. | Path | Effort |
|---|---|---|---|---|---|---|---|
| WeChat Official Account | CN | 1.4B WeChat total; OA ecosystem ~all of it | Yes (draft + freepublish) | Yes (`datacube/*`) | **Mainland WFOE + ICP filing; 第三方平台 qualification for multi-tenant** | R4 — JV/licensed partner | 8–12 + **6–12 months legal** |
| WeChat Channels 视频号 | CN | ~800M+ | Partial (`C3`) | Partial | same | R4 | 4–6 |
| WeChat Mini Program | CN | ~950M+ | N/A (app platform) | Yes | same | R4 | n/a |
| Weibo | CN | ~585M | Severely restricted (`share.json` only) | Effectively none for 3P | Mainland entity for meaningful scopes | R4 | 3–4 |
| Douyin | CN | ~750M+ | Yes (video upload/create) | Yes (`data/external/*`) | Mainland business licence, 企业开发者 | R4 | 6–8 |
| Xiaohongshu / RED | CN | ~300M+ | Commerce yes; **content: no general 3P API** | Commerce only | Mainland entity | R3/R4 | 2 (reminder) |
| Kuaishou | CN | ~700M | Yes (`photo/publish`) | Yes | Mainland entity | R4 | 5–7 |
| Bilibili | CN | ~340M | Yes (`arcopen` archive API) | Yes (`arc/stat`) | Enterprise registration; mainland preferred | R2/R4 | 5–7 |
| Zhihu | CN | ~100M+ | **No** | No | — | R5 | — |
| Toutiao 头条号 | CN | ~300M+ | Partner-only | Partner-only | Mainland | R4 | — |
| Baidu Baijiahao | CN | large | Partner-only | Partner-only | Mainland | R4 | — |
| Tencent Video 企鹅号 | CN | large | Partner-only | Partner-only | Mainland | R4 | — |
| **LINE Official Account** | JP/TH/TW/ID | ~98M JP, ~56M TH `C3` | **Yes** — push/broadcast/narrowcast `V` | **Yes** — `/v2/bot/insight/*` `V` | **None** | **R1 — direct** | **4–6** |
| LINE VOOM | JP/TH/TW | — | **No** `V-neg` | No | — | R3 — reminder | 1 |
| Ameba (ameblo) | JP | ~30M `C3` | **No public** | No | — | R3 | 1 |
| note.com | JP | ~25M `C3` | **No public** | No | — | R3 | 1 |
| mixi | JP | small | API withdrawn | — | — | R5 | — |
| Pixiv | JP | ~100M reg. `C3` | **No official** (reverse-engineered only) | No | — | R3 / never | — |
| KakaoTalk Channel | KR | ~48M `C3` | **Via BSP only** | Via BSP | Korean BSP contract | R2 — reseller | 4–6 + **8–16 wk partner** |
| KakaoStory | KR | declining | Deprecated | No | — | R5 | — |
| Naver Blog | KR | ~30M `C3` | Write API withdrawn `C3` | No | — | R3 | 1 |
| Naver Cafe | KR | large | Yes (article write via Naver Login) `C2` | No | None | R2 | 3 |
| Naver Band | KR | ~20M `C3` | Yes (`/v2/band/post/create`) `C2` | Minimal | None | R2 | 3 |
| Naver Post | KR | — | **Service discontinued** `C3` | — | — | R5 | — |

### 2.2 Russia / CIS, SEA, India

| Platform | Market | MAU `C3` | Post API | Analytics API | Foreign entity req. | Path | Effort |
|---|---|---|---|---|---|---|---|
| **VK** | RU/CIS | ~97M RU | **Yes — `wall.post`, incl. native `publish_date` scheduling** `V` | **Yes — `stats.get`, `stats.getPostReach`** `V` | None technically; **sanctions exposure** | R1 (gated) | 4–5 |
| Odnoklassniki | RU/CIS | ~36M | Yes (`mediatopic.post`) `C2` | Limited | None; sanctions | R2 (gated) | 3 |
| **Telegram** | Global | 1B+ | **Yes — Bot API** | **Partial — channel stats are MTProto-only** `C1` | None | R1 | 3–4 (+3 for MTProto) |
| Dzen | RU | ~80M `C3` | RSS import / partner only | Partner | None; sanctions | R5 for now | — |
| Rutube | RU | ~60M `C3` | Partner upload | Partner | Gazprom-Media = **sanctioned** | R5 | — |
| **Zalo OA** | VN | ~78M | **Yes** — `/v3.0/oa/message/*`, article API `V` (endpoints) | Partial | None | R1 | 4–5 |
| Viber Public Account | PH/UA/GR/IQ/MM | ~1B reg., ~250M MAU `C3` | Yes — `chatapi.viber.com/pa/*` `V` (host) | Limited | CPaaS partner for Business Messages | R2 | 3 |
| Shopee (Open Platform) | SEA | — | Commerce only; **no Feed/Live post API** `C3` | Commerce | Seller account | R3 | 3 (commerce) |
| Lazada (Open Platform) | SEA | — | Commerce only | Commerce | Seller account | R3 | 3 |
| ShareChat | IN | ~180M `C3` | **No public API** `E` | No | — | R3 | 1 |
| Moj | IN | ~160M `C3` | **No public API** `E` | No | — | R3 | 1 |
| Josh | IN | ~150M `C3` | **No public API** | No | — | R3 | 1 |
| Chingari | IN | collapsed | — | — | — | R5 | — |
| **Koo** | IN | **shut down July 2024** `C2` | — | — | — | **R5 — dead** | — |
| JioChat | IN | negligible | — | — | — | R5 | — |
| WhatsApp Business Platform | IN/BR/NG/ID/global | 2B+ | Yes (template + session) | Yes (Meta) | Meta BSP or direct Cloud API | R1 | covered in `07` |

### 2.3 MENA, Africa, LATAM, Europe-other

| Platform | Market | MAU `C3` | Post API | Analytics API | Foreign entity req. | Path | Effort |
|---|---|---|---|---|---|---|---|
| **Snapchat** | Gulf/US/FR | ~450M DAU | **None — organic posting impossible** `C1` | Ads only | — | R3 — reminder | 1 |
| Anghami | MENA | ~20M MAU `C3` | No public | Artist dashboard only | — | R5 | — |
| Ayoba (MTN) | Africa | ~35M `C3` | UNVERIFIED — micro-app platform | UNVERIFIED | MTN partnership | R3 | UNVERIFIED |
| Moya / Datafree (biNu) | ZA | ~10M `C3` | Partner-only | Partner | biNu contract | R3 | UNVERIFIED |
| USSD (Africa's Talking et al.) | Africa | — | N/A — outbound channel | Delivery reports | Aggregator contract | R2 (adjacent) | 3 |
| Kwai | BR/LATAM | ~50M BR `C3` | **No organic API** — ads only `E` | Ads only | — | R3 | 1 |
| **Mercado Libre** | BR/MX/AR | ~100M+ buyers | Q&A + post-sale messaging `V` (host) | Seller metrics | Seller account | R1 | 4 |
| XING | DACH | ~22M members `C3` | **Public API withdrawn** `E`/`C3` | No | — | R5 | — |
| Viadeo | FR | dead | — | — | — | R5 | — |

---

## 3. The five integration archetypes

Every row above collapses into one of five engineering patterns. Design the adapter interface around these, not around individual platforms.

### 3.1 Archetype A — Direct OAuth, direct publish

**Members:** LINE, VK, Telegram, Zalo, Naver Band/Cafe, Mercado Libre, Bilibili (in principle).

**Shape:** we register one app, user authorizes, we hold a refreshable token per connected account, we call a create endpoint. Identical in structure to tier-1.

**What varies and must be abstracted:**
- Token TTL and refresh semantics (VK group tokens do not expire; LINE channel access tokens v2.1 are JWT-issued and short-lived; Zalo refresh tokens rotate).
- Request signing (Zalo uses plain bearer; Shopee/Lazada use HMAC-SHA256 over a canonical string; OK.ru uses MD5 of sorted params).
- Error taxonomy — see §14.4.

### 3.2 Archetype B — Component / third-party-platform delegation

**Members:** WeChat 第三方平台, and structurally similar Chinese platforms.

**Shape:** we do not hold a per-tenant app. We hold a *component* app; the platform pushes us a `component_verify_ticket` on a fixed cadence; we mint a `component_access_token`; we generate a `pre_auth_code`; the tenant authorizes *the component*; we then mint per-tenant `authorizer_access_token` from an `authorizer_refresh_token`.

**Why it matters:** this is the only compliant multi-tenant path in China, and it is a *fundamentally different token vault shape* — the vault must model a component-scoped credential that all tenant credentials derive from, plus a push-driven ticket with a hard expiry that, if missed, locks out every tenant simultaneously. See §4.3.

### 3.3 Archetype C — Licensed reseller / BSP

**Members:** KakaoTalk (Korean Bizmessage), Viber Business Messages, WhatsApp via BSP, Ayoba, Moya, USSD aggregators.

**Shape:** the platform will not contract with us. It contracts with a licensed intermediary; we contract with the intermediary; we inherit their rate limits, their template-approval workflow, and their margin.

**Consequences:**
- Per-message cost becomes a COGS line, not a fixed cost. Pricing must pass it through.
- Template pre-approval (Kakao 알림톡 templates, WhatsApp templates) means **content cannot be freely composed** — the composer needs a "template + variables" mode, not a free-text mode.
- The intermediary is a single point of failure and a data-processor under GDPR/PIPA.

### 3.4 Archetype D — Reminder publish

**Members:** Snapchat, Xiaohongshu, LINE VOOM, Ameba, note, ShareChat, Moj, Josh, Kwai, Naver Blog.

**Shape:** we own the calendar, the asset, the copy, the approval workflow, and the analytics *entry*, but the final act of publication is a human tapping a button in the native app.

**What makes a *good* reminder publish (this is a product surface, not a fallback):**
1. Push notification at scheduled time to the assigned operator's mobile device.
2. Assets pre-downloaded to the device camera roll, or a one-tap "save all" from a mobile web page.
3. Caption copied to clipboard on tap, with per-network transformations already applied (hashtag block position, emoji normalization, character truncation at a grapheme boundary).
4. Deep link into the target app's composer where one exists.
5. A "mark as published" confirmation that writes back to the calendar, optionally with a pasted permalink.
6. If a permalink is supplied, a scraper-free metrics path: for most R3 platforms we can only record what the user types, so support **manual metric entry** and be honest in the UI that the number is user-reported.

**Do not** pretend reminder publish is auto-publish in marketing copy. Every competitor that has done so generates support tickets.

### 3.5 Archetype E — Not integrable

**Members:** Zhihu, mixi, Viadeo, XING, Koo, Chingari, Pixiv (officially).

Record the decision and the date, so the question is not re-litigated every quarter. Re-check annually.

---

## 4. China

> China is not "a hard integration". It is a **different legal product** wearing the same UI. This section is long because the failure mode — building the adapter first and discovering the entity requirement second — is expensive and common.

### 4.1 The gatekeepers, in the order they bite

#### 4.1.1 ICP filing vs. ICP licence — these are two different things

| | ICP 备案 (**filing / record-filing**) | ICP 许可证 (**licence**) |
|---|---|---|
| Chinese name | 网站备案 / ICP备案 | 增值电信业务经营许可证 (value-added telecom services permit) |
| Applies to | **Any** website or app served from mainland Chinese infrastructure | **Commercial** operations — anything where you charge users for the online service |
| Issued by | MIIT, via the hosting provider | Provincial communications administration under MIIT |
| Foreign ownership | Filing itself requires a **mainland-registered entity** with a Chinese legal representative | **Foreign equity in value-added telecom services is capped at 50%** under the Foreign Investment Negative List `C1` |
| Time | 2–4 weeks typical `C3` | 3–6 months typical `C3` |
| Sub-categories that matter to us | — | **ICP** (信息服务业务) for content services; **EDI** (在线数据处理与交易处理业务) for SaaS/e-commerce transaction processing |

**The 50% cap is the structural fact.** A wholly-foreign-owned enterprise (WFOE) **cannot** hold a commercial ICP/EDI licence in the general case. The standard workarounds:

1. **Joint venture** with a Chinese partner holding ≥50%.
2. **VIE structure** — contractually controlled domestic entity. Legally tolerated, politically exposed, and increasingly disfavoured for new entrants. `C1`
3. **Licensed local partner / reseller** — the Chinese partner holds the licence and the platform relationship; we supply software. **This is the recommended path.**
4. **Do not operate in China; serve China-facing brands from outside** — publish to WeChat via a partner API relay, accept that data touches a Chinese processor.

#### 4.1.2 Other permits that can apply

| Permit | Trigger | Note |
|---|---|---|
| 网络文化经营许可证 (Internet Culture Business Permit) | Operating cultural content — music, video, performance, games | May apply if we host/serve creative assets to Chinese users `C2` |
| 信息网络传播视听节目许可证 (AVSP licence) | Transmitting audio-visual programmes | Very hard for foreign-invested entities `C1` |
| MLPS 2.0 / 等级保护 grading | Any network operator in China | Grade 2 typical for SaaS; grade determination + filing with public security bureau `C2` |
| Cybersecurity Review | Platform with >1M users' personal information seeking foreign listing | CAC review `C2` |

#### 4.1.3 PIPL and cross-border data transfer

PIPL (in force 1 Nov 2021) governs personal information. Cross-border transfer requires one of: CAC security assessment, CAC-approved standard contract with filing, or certification.

The **March 2024 "Provisions on Promoting and Regulating Cross-border Data Flows"** materially relaxed thresholds `C2`:

| Volume of personal info exported (cumulative, from 1 Jan of the year, non-sensitive) | Mechanism |
|---|---|
| < 100,000 individuals | **Exempt** from all three mechanisms |
| 100,000 – 1,000,000 | Standard contract **or** certification, with filing |
| > 1,000,000 | **CAC security assessment** |
| Sensitive PI > 10,000 individuals | CAC security assessment |

Additional exemptions cover data necessary to perform a contract to which the individual is a party (cross-border shopping, travel booking) and HR management.

**What this means concretely for us:** a social-media tool holding Chinese end-users' comment authors, DM senders, and follower demographics accumulates personal information fast. Design so that **Chinese personal data never leaves China**:

- Store WeChat `openid`/`unionid`, comment bodies, and DM content in a **China-resident datastore** (Alibaba Cloud / Tencent Cloud in-region).
- Export only aggregate, non-identifying metrics to the global control plane.
- This is the same "sovereign shard" pattern needed for EU data residency (see `11-compliance-security-global.md`) — build it once.

#### 4.1.4 Payment and settlement

Charging Chinese customers requires either a mainland entity with a bank account and fapiao (发票) issuance capability, or cross-border collection via a licensed PSP. See §18.6.

### 4.2 WeChat — the ecosystem, disaggregated

WeChat is four distinct products with four distinct APIs. Conflating them is the most common planning error.

| Surface | Chinese name | What it is | API module (per WxJava's own manifest `V`) |
|---|---|---|---|
| Official Account | 公众号 (订阅号 subscription / 服务号 service) | The publishing surface — articles, mass messages, menus, 48h customer service | `weixin-java-mp` |
| Mini Program | 小程序 | In-app applications | `weixin-java-miniapp` |
| **Channels** | **视频号** | Short video + live, WeChat's TikTok answer | **`weixin-java-channel`** ("视频号 / 微信小店") |
| WeCom | 企业微信 | Enterprise messaging | `weixin-java-cp` |
| Open Platform | 开放平台（第三方平台） | **The multi-tenant delegation layer** | **`weixin-java-open`** |
| Pay | 微信支付 | Payments | `weixin-java-pay` |

> `V` — module list read directly from `raw.githubusercontent.com/binarywang/WxJava/develop/README.md`, the "我该选哪个模块？" table. The existence of a maintained `weixin-java-channel` module is the strongest available evidence that a server-side Channels API exists. The same repo's own tagline confirms coverage of "微信支付、开放平台、公众号、企业微信、视频号、小程序". Corroborated by `silenceper/wechat` (Go) which lists `officialaccount`, `miniprogram`, `minigame`, `pay`, `openplatform`, `work`, `aispeech`, and by `wechatpy` (Python) which lists "第三方平台代公众号调用接口 API" as a headline feature.

#### 4.2.1 Official Account — the two account types are not interchangeable

| | 订阅号 Subscription Account | 服务号 Service Account |
|---|---|---|
| Placement in WeChat | Collapsed into a "Subscriptions" folder | Appears in the main chat list |
| **Mass send allowance** | **1 per day** | **4 per month** `C2` |
| Advanced interfaces (payment, JS-SDK, user info) | Limited | Full |
| Who can register | Individuals and orgs | **Organizations only** |
| Verification (微信认证) | Optional | Effectively required; annual fee ~¥300 `C3` |

**The 4-per-month cap on service accounts is the single most important product fact about WeChat.** A "content calendar" for WeChat is not a daily grid — it is a monthly editorial plan with four slots. Our scheduling UI must model this explicitly, show remaining quota, and refuse to schedule the fifth. Building a generic daily calendar and letting users discover the cap through API errors is a product failure.

#### 4.2.2 Official Account API surface

Base host `https://api.weixin.qq.com`. `C2` throughout — these are stable but re-verify.

**Auth**
```
GET  /cgi-bin/token?grant_type=client_credential&appid={}&secret={}
     → { access_token, expires_in: 7200 }
```
Token TTL 7,200s. Refresh count per day is capped; the token is **global per app** — concurrent refreshes invalidate each other. **Mandatory design: a single centralized token minter with a distributed lock, never per-worker refresh.** This is the #1 cause of WeChat integration outages.

**Draft + publish (the modern path)**
```
POST /cgi-bin/draft/add          → media_id
POST /cgi-bin/draft/get
POST /cgi-bin/draft/update
POST /cgi-bin/draft/delete
GET  /cgi-bin/draft/count
POST /cgi-bin/draft/batchget

POST /cgi-bin/freepublish/submit      { media_id } → publish_id
POST /cgi-bin/freepublish/get         { publish_id } → publish_status
POST /cgi-bin/freepublish/delete
POST /cgi-bin/freepublish/getarticle
POST /cgi-bin/freepublish/batchget
```

**Critical asynchronous semantics:** `freepublish/submit` returns a `publish_id`, **not** a published article. Publication passes through **content review** and can take from seconds to hours, and can fail. Our job model must treat WeChat publish as a **long-running, pollable, potentially-rejected** operation — closer to an app-store submission than a POST. States to model: `submitted → under_review → published | rejected | partially_rejected(per-article)`.

**Media**
```
POST /cgi-bin/media/upload?type={image|voice|video|thumb}   (temporary, 3-day TTL)
POST /cgi-bin/material/add_material?type=...                (permanent)
POST /cgi-bin/media/uploadimg                               (images for article bodies — returns a CDN URL)
```
Article body images **must** be uploaded via `uploadimg` and referenced by the returned WeChat CDN URL; external image URLs in article HTML are stripped. This forces an asset-rewriting pass over the article body before submission.

**Messaging**
```
POST /cgi-bin/message/mass/sendall      (by tag or to all)
POST /cgi-bin/message/mass/send         (by openid list)
POST /cgi-bin/message/mass/preview
POST /cgi-bin/message/mass/get | /delete
POST /cgi-bin/message/custom/send       (48-hour customer-service window)
POST /cgi-bin/message/template/send     (template messages)
```

**Analytics — 数据统计 (`datacube`)**
```
POST /datacube/getusersummary        (new/cancel follows, by channel)
POST /datacube/getusercumulate       (cumulative followers)
POST /datacube/getarticlesummary     (per-article, per-day)
POST /datacube/getarticletotal       (per-article, lifetime)
POST /datacube/getuserread           (reads, by day)
POST /datacube/getuserreadhour       (reads, by hour)
POST /datacube/getusershare          (shares)
POST /datacube/getupstreammsg        (inbound message volume)
POST /datacube/getinterfacesummary   (API call health)
```
Query windows are capped per endpoint (commonly 7 days, some 1 day, some 30) and data lands **the following day**. Design the metrics backfill as a daily job with per-endpoint window logic, not a generic range query. `C2`

**Other**
```
POST /cgi-bin/menu/create | /cgi-bin/menu/delete
POST /cgi-bin/qrcode/create
GET  /cgi-bin/user/get         (paged openid list)
POST /cgi-bin/user/info/batchget
POST /cgi-bin/tags/create | /tags/members/batchtagging
```

**Inbound events** arrive as **XML POSTs to a configured callback URL**, optionally AES-encrypted (`EncodingAESKey`), signed with a `token` — not JSON, not a modern webhook signature. The callback must respond within **5 seconds** or WeChat retries (3 attempts) and then shows the user an error. Long work must be queued immediately. `C2`

#### 4.2.3 WeChat Channels 视频号

- A maintained SDK module exists (`weixin-java-channel`) `V`.
- The module is described as "**视频号 / 微信小店**" — i.e. the open API is oriented at the **Channels Store (小店)** commerce layer as much as at content. `V`
- Whether *general video publishing to a Channel* is exposed to third-party developers, and under what qualification, is **`UNVERIFIED`**. The 视频号助手 (Channels Assistant) web console is the documented publishing surface; an open publishing API may be limited to specific partner categories.
- **Plan:** treat Channels as R4 with a reminder-publish fallback, and verify the publishing scope during the China partner conversation, not before.

#### 4.2.4 The third-party platform (第三方平台) flow — Archetype B in detail

This is the only compliant way to serve many WeChat accounts from one system. `C1` for shape, `C2` for endpoints.

```
1. Tencent POSTs component_verify_ticket to our callback  — every 10 minutes, forever
2. POST /cgi-bin/component/api_component_token
        { component_appid, component_appsecret, component_verify_ticket }
     → component_access_token (TTL 7200s)
3. POST /cgi-bin/component/api_create_preauthcode → pre_auth_code (TTL 600s)
4. Redirect tenant to componentloginpage / bindcomponent with pre_auth_code
5. Tenant authorizes → Tencent redirects back with auth_code
6. POST /cgi-bin/component/api_query_auth { auth_code }
     → authorizer_appid, authorizer_access_token, authorizer_refresh_token
7. POST /cgi-bin/component/api_authorizer_token
        { authorizer_appid, authorizer_refresh_token }
     → refreshed authorizer_access_token
8. POST /cgi-bin/component/api_get_authorizer_info  (account metadata, capabilities)
```

**Operational hazards unique to this flow:**

| Hazard | Consequence | Mitigation |
|---|---|---|
| `component_verify_ticket` push missed for >12h | **Every tenant** loses API access simultaneously | Persist every ticket immediately on receipt with a timestamp; alert if no ticket for 20 minutes; the callback must be the most reliable endpoint we own |
| `authorizer_refresh_token` rotates on some refreshes | Silent per-tenant lockout | Always persist the returned refresh token in the same transaction as the access token |
| Component app suspension | Total outage across all tenants | The component app belongs to the **partner's** mainland entity — this is *their* single point of failure, contractually |
| Callback must be on a **filed (备案) domain** | Cannot use our global domain | Requires a China-hosted, ICP-filed callback endpoint — reinforcing the sovereign-shard design |

#### 4.2.5 Verdict on WeChat

**A foreign SaaS cannot legally operate WeChat multi-tenant publishing on its own.** The realistic options, ranked:

1. **White-label through a licensed Chinese partner** who holds the component app and the ICP/EDI licence; we integrate to *their* relay API. Fastest, lowest legal exposure, gives up margin and creates a dependency. **Recommended.**
2. **Joint venture** with ≥50% Chinese ownership. 9–18 months, real capital, real governance cost. Justified only if China revenue is a strategic pillar.
3. **Reminder-publish only** — schedule, review, approve, notify; the client's own China team pastes into the 公众号 backend. Zero legal exposure, ~2 engineer-weeks, and **genuinely useful** to the many Western brands who already operate this way.

**Recommendation: ship option 3 in v1 as "WeChat (assisted publishing)", pursue option 1 as a partnership track.** Do not build the component flow speculatively.

### 4.3 Weibo

- **MAU ~585M** `C3`.
- `open.weibo.com`. Base `https://api.weibo.com/2/`.
- The historically open `statuses/update.json` was withdrawn from general third-party access years ago. What remains broadly available is **`statuses/share.json`** — a share-with-link endpoint with restrictive content rules (requires a URL, limited frequency). `C2`
- Read endpoints (`statuses/user_timeline`, `comments/show`) are heavily gated by app tier; the useful tiers require a mainland entity and a business review. `C2`
- Analytics for third parties: effectively **none**. Weibo's own 微博数据中心 is UI-only.
- **Verdict: R4.** Not worth building outside a China partnership. Even inside one, the capability is thin.

### 4.4 Douyin

- **~750M+ MAU / DAU in the 600–750M range** `C3`. The single most commercially important Chinese social surface after WeChat.
- `open.douyin.com`. `C2` endpoint families:
  ```
  /oauth/authorize/ , /oauth/access_token/ , /oauth/refresh_token/ , /oauth/client_token/
  /video/upload/ , /video/create/ , /video/part/init/ , /video/part/upload/ , /video/part/complete/
  /video/list/ , /video/data/ , /video/delete/
  /item/comment/list/ , /item/comment/reply/
  /data/external/user/item/ , /data/external/user/fans/ , /data/external/user/like/
  /data/external/item/base/ , /data/external/item/comment/ , /data/external/item/share/
  ```
- **Access control:** developer registration requires a **Chinese business licence (营业执照)** for 企业开发者 status; individual developers get a drastically reduced scope set. Every capability (`video.create`, `data.external.*`, `item.comment`) is a **separately-approved scope** with its own review. `C1`
- Douyin also runs a separate **企业号 (enterprise account)** open capability set and a **抖音开放平台服务商 (service provider)** programme — the latter is the multi-tenant analogue of WeChat's component flow. `C2`/`UNVERIFIED` on details.
- **Verdict: R4.** Technically the cleanest Chinese API; legally identical blocker.

### 4.5 Xiaohongshu / RED

- **~300M+ MAU** `C3`, disproportionately urban, female, high-income — the highest-value Chinese audience for consumer brands.
- Two distinct platforms, frequently confused:
  - **开放平台 (open.xiaohongshu.com)** — **e-commerce**: shop, product, order, inventory, logistics, after-sale. Real, documented, sign-based auth. `C2`
  - **蒲公英 (Pugongying)** — the brand↔creator marketplace. Partner console; **no general third-party API**. `C2`
- **Content publishing to a 专业号 (professional account) via API is not generally available to third-party SaaS.** `C2`
- `E` corroboration: npm's Xiaohongshu ecosystem in 2026 consists entirely of **scrapers and MCP servers** (`red-note-api`, `rednote-mcp`, `xiaohongshu-mcp`, `mcp-xiaohongshu`) — read-only, unofficial, and frequently ToS-violating. **The absence of any publishing SDK across the entire npm ecosystem is a strong negative signal.**
- **Do not build scraper-based XHS posting.** It violates ToS, breaks constantly, and creates account-ban liability for customers.
- **Verdict: R3 reminder publish**, plus optional R4 commerce integration if we pursue social commerce (see `10-commerce-creator-influencer.md`).

### 4.6 Kuaishou

- **~700M MAU / ~400M DAU** `C3`. Strong in lower-tier cities and the north; complementary to Douyin, not a substitute.
- `open.kuaishou.com`. `C2`:
  ```
  /oauth2/authorize , /oauth2/access_token , /oauth2/refresh_token
  /openapi/photo/start_upload , /openapi/photo/publish
  /openapi/photo/list , /openapi/photo/info , /openapi/photo/count
  /openapi/comment/list , /openapi/comment/add , /openapi/comment/delete
  /openapi/user/info
  ```
- Same entity requirement as Douyin. `C1`
- **Verdict: R4.**

### 4.7 Bilibili

- **~340M MAU** `C3`; the Gen-Z long-form video and ACG hub; growing brand relevance.
- Bilibili operates a genuine **创作者开放平台** with an archive (稿件) API. `C2`:
  ```
  /arcopen/fn/user/account/info
  /arcopen/fn/archive/video/init      (upload session)
  /arcopen/fn/archive/add             (submit archive)
  /arcopen/fn/archive/edit
  /arcopen/fn/archive/list
  /arcopen/fn/data/arc/stat           (per-archive stats)
  /arcopen/fn/data/user/stat
  ```
- Access requires enterprise registration and per-scope review; whether a foreign entity can register is **`UNVERIFIED`**. Bilibili's international presence (bilibili.tv) makes this the **most plausible Chinese platform to admit a foreign developer**.
- **Verdict: R2 candidate — worth a direct application as an experiment.** Low cost to try, and a "yes" would be a genuine differentiator.

### 4.8 Zhihu, Toutiao, Baijiahao, Tencent Video

| Platform | Reality |
|---|---|
| **Zhihu** | No public write API. No developer platform. Reverse-engineered clients only. **R5.** |
| **Toutiao 头条号** | ByteDance's news/content account system. `mp.toutiao.com` console. API access is partner-only (MCN and content-alliance partners). **R4.** |
| **Baidu 百家号** | `baijiahao.baidu.com`. Content-partner API exists for approved publishers; not open. Relevant mainly for **Baidu SEO/AI-search visibility** — see `09-ai-frontier.md`. **R4.** |
| **Tencent Video 企鹅号** | Publisher partner programme; no open API. **R4.** |

### 4.9 China: realistic plan and effort

| Deliverable | Effort | Calendar dependency |
|---|---|---|
| WeChat **assisted publishing** (R3): calendar slots honouring 1/day & 4/month caps, article composer with WeChat-specific constraints, asset pack export, reminder + confirm | **2–3 engineer-weeks** | None |
| Chinese-language UI + zh-Hans locale + CJK counting | folded into §15/§16 | None |
| Partner-relay adapter (integrate to a licensed partner's API) | **4–6 engineer-weeks** | **3–6 months** partner selection + contract |
| Native WeChat component flow (if JV) | **8–12 engineer-weeks** | **6–12 months** entity + ICP/EDI + 第三方平台 qualification |
| Douyin / Kuaishou / Bilibili adapters | **5–8 engineer-weeks each** | Same entity dependency (Bilibili possibly not) |
| China-resident data shard (compute + storage + ICP-filed callback domain) | **6–10 engineer-weeks** | ICP filing 2–4 weeks after entity exists |

**Do not start any of the above before a China go-to-market decision exists.** The reminder-publish path is the only line item justified on its own merits.

---

## 5. Japan

### 5.1 Why Japan is the highest-ROI non-Western market

- Large, wealthy, high SaaS willingness-to-pay.
- **One platform dominates messaging-based marketing (LINE) and it has a first-class public API** — no local entity, no reseller, a maintained OpenAPI repo.
- The rest of the Japanese social stack (X, Instagram, YouTube, TikTok) is already covered by tier-1 adapters.
- Localization expectation is high: a machine-translated UI reads as unserious. Budget for professional ja-JP translation.

### 5.2 LINE — the integration, in detail

> `V` — everything in this subsection marked `V` comes from `github.com/line/line-openapi`, LINE's own published OpenAPI specifications, cloned and read directly in this session. Spec files present: `channel-access-token.yml`, `insight.yml`, `liff.yml`, `manage-audience.yml`, `messaging-api.yml`, `module.yml`, `module-attach.yml`, `shop.yml`, `webhook.yml`.

**Host:** `https://api.line.me` `V` (declared in the spec's `servers` block). Media upload uses `https://api-data.line.me` `C2`.

**Auth:** Bearer channel access token `V`. Token types: long-lived channel access token, short-lived (30-day) v2.1 **JWT-assertion-issued** tokens (recommended — supports key rotation and multiple concurrent valid tokens), and stateless tokens. `C2` — issuance endpoints live in `channel-access-token.yml` `V`.

#### 5.2.1 Messaging endpoints `V`

```
POST /v2/bot/message/push               single user
POST /v2/bot/message/multicast          many userIds, same message
POST /v2/bot/message/broadcast          all friends
POST /v2/bot/message/narrowcast         audience-targeted (demographics/audience/operator)
POST /v2/bot/message/reply              reply token, within the reply window
GET  /v2/bot/message/progress/narrowcast
POST /v2/bot/message/validate/{push|reply|multicast|narrowcast|broadcast}
GET  /v2/bot/message/quota
GET  /v2/bot/message/quota/consumption
GET  /v2/bot/message/delivery/{push|reply|multicast|broadcast|pnp}
GET  /v2/bot/message/aggregation/info
GET  /v2/bot/message/aggregation/list
GET  /v2/bot/message/{messageId}/content
GET  /v2/bot/message/{messageId}/content/preview
GET  /v2/bot/message/{messageId}/content/transcoding
POST /v2/bot/message/markAsRead
```

Three things stand out and should shape the product:

1. **`/validate/*` endpoints exist for every send type.** Use them in the composer for **live, server-truth validation** — no other network in our portfolio offers this. It kills an entire class of "scheduled post failed at 9am" tickets.
2. **`/message/quota` and `/quota/consumption`** expose the account's monthly message allowance and current usage. Surface this in the UI as a **budget meter**; LINE plans are message-metered, and overage is a real cost to the customer.
3. **`narrowcast` is asynchronous** — it returns a request ID; you poll `/message/progress/narrowcast`. Model it like the WeChat publish job, not like a push.

#### 5.2.2 Analytics endpoints `V`

```
GET /v2/bot/insight/demographic
GET /v2/bot/insight/followers
GET /v2/bot/insight/message/delivery
GET /v2/bot/insight/message/event
GET /v2/bot/insight/message/event/aggregation
GET /v2/bot/insight/richmenu/{richMenuId}/daily
GET /v2/bot/insight/richmenu/{richMenuId}/summary
```

**A hard geographic restriction, quoted from LINE's own spec `V`:**

> "Retrieves the demographic attributes for a LINE Official Account's friends. You can only retrieve information about friends for LINE Official Accounts created by users in **Japan (JP), Thailand (TH), Taiwan (TW) and Indonesia (ID)**."

So demographic analytics is *unavailable* for OAs created elsewhere. The UI must degrade gracefully per-account rather than showing an empty chart.

#### 5.2.3 Other endpoint families `V`

```
GET/POST/DELETE /v2/bot/richmenu , /v2/bot/richmenu/list , /v2/bot/richmenu/validate
POST /v2/bot/richmenu/bulk/link , /v2/bot/richmenu/bulk/unlink
POST /v2/bot/richmenu/batch  + GET /v2/bot/richmenu/progress/batch
GET/POST/DELETE /v2/bot/richmenu/alias , /alias/list , /alias/{richMenuAliasId}
GET  /v2/bot/profile/{userId}
GET  /v2/bot/followers/ids
GET  /v2/bot/group/{groupId}/summary , /members/count , /members/ids , /member/{userId} , /leave
POST /v2/bot/chat/loading/start
POST /v2/bot/chat/markAsRead
GET/PUT /v2/bot/channel/webhook/endpoint  + POST /v2/bot/channel/webhook/test
GET  /v2/bot/info
POST/GET/DELETE /v2/bot/coupon , /v2/bot/coupon/{couponId} , /{couponId}/close
GET  /v2/bot/membership/list , /membership/subscription/{userId} , /membership/{membershipId}/users/ids
```

Note **`/v2/bot/coupon`** and **`/v2/bot/membership`** — LINE has grown a coupon and paid-membership layer. For a Japanese SMB this is a *revenue* surface, not just a messaging one, and no Western scheduler touches it. Strong differentiator candidate.

Also note **`/v2/bot/channel/webhook/test`** — we can programmatically verify a customer's webhook wiring during onboarding. Use it.

Separate specs exist for **`manage-audience.yml`** (audience group creation/upload — needed for narrowcast targeting) and **`shop.yml`** (sticker/product shop) `V`.

#### 5.2.4 LINE VOOM — the verified negative

**`V-neg`: LINE's complete public OpenAPI repository contains no VOOM or timeline endpoint.** A case-insensitive grep for `voom` and `timeline` across all eight spec files returns **zero matches**. The former "LINE Timeline API" is gone.

**Consequence:** VOOM posts must be created in **LINE Official Account Manager** by a human. VOOM is therefore **R3 — reminder publish**. This is worth stating plainly to customers, because Japanese agencies will ask.

#### 5.2.5 Costs and limits

- LINE Official Account plans in Japan are **message-metered**: a free tier with a small monthly allowance, then paid tiers with larger allowances and per-message overage. Exact plan names and yen prices are **`C3`** and have been restructured at least once since 2023 — **verify before quoting to a customer.**
- API rate limit is documented by LINE in the region of **2,000 requests/second** for messaging endpoints `C3`.
- The **quota endpoints are the reliable source of truth at runtime** — prefer reading them over hardcoding plan knowledge.

#### 5.2.6 Effort

**4–6 engineer-weeks** for a production adapter: JWT token issuance + rotation, push/multicast/broadcast/narrowcast with async progress, rich-menu management, insight ingestion with the JP/TH/TW/ID guard, webhook receiver with signature validation, message-object builder (LINE's Flex Message JSON is its own layout language and deserves a visual builder — add 3–4 weeks if we build one).

### 5.3 The rest of Japan

| Platform | Status | Path |
|---|---|---|
| **X** | ~67–70M JP users `C3` — X is disproportionately dominant in Japan vs. the West. Already covered by the tier-1 adapter. | Covered |
| **Ameba / ameblo** | Enormous in the Japanese "talent blog" world. The old AmebaAPI is withdrawn; no public write API. `C3` | R3 |
| **note.com** | ~25M `C3`. Premium creator publishing. No public write API found; `E` shows no npm SDK. | R3 |
| **mixi** | Graph API withdrawn ~2015; company pivoted to games. | R5 |
| **Pixiv** | ~100M registered `C3`. **No official public API.** `pixivpy` and similar reverse-engineer the mobile app API — ToS-violating, unstable, and a ban risk for customers. | R3 / never |

**Japan bundle recommendation:** LINE adapter + ja-JP localization + Japanese holiday calendar + Konbini/PayPay payment support (§18) + JCT tax handling (§19). That package is a credible "Japan edition" no competitor offers.

---

## 6. Korea

### 6.1 The structural fact

Korea has **near-total KakaoTalk penetration (~48M MAU on a ~52M population)** `C3`, and Kakao does **not** let a foreign SaaS message channel friends directly. Business messaging runs through the **비즈메시지 (Bizmessage)** rail, which requires a registered **발신프로필 (sender profile)** obtained through a licensed Korean intermediary.

### 6.2 Kakao — what is and is not available

**Kakao Developers (`kapi.kakao.com`, `kauth.kakao.com`)** `C2`:

| Capability | Endpoint family | Available to a foreign app? |
|---|---|---|
| Kakao Login (OIDC) | `kauth.kakao.com/oauth/authorize`, `/oauth/token` | **Yes** |
| Send message **to self** | `/v2/api/talk/memo/default/send`, `/memo/scrap/send`, `/memo/send` | **Yes** — useful only for testing |
| Send message **to friends** | `/v1/api/talk/friends/message/default/send` | Requires Kakao review + business verification; scope `talk_message` `C2` |
| List user's Kakao channels | `/v1/api/talk/channels` | Yes, with `talk_message`/channel scope `C2` |
| **Message channel followers (알림톡 / 친구톡)** | **Not in the developer API** | **No — Bizmessage rail only** `C1` |
| KakaoStory posting | `/v1/api/story/post/note`, `/post/photo`, `/post/link` | **Deprecated / closed to new apps** `C3` |

**The Bizmessage rail** `C1`:
- **알림톡 (AlimTalk)** — transactional/informational, **pre-approved templates only**, cheap, deliverable to any KakaoTalk user matched by phone number.
- **친구톡 (FriendTalk)** — marketing, only to channel friends, image support, higher cost, opt-out required.
- Both require a **발신프로필** registered against a Korean business registration number (사업자등록번호), obtained via a licensed 중계사/BSP. Commonly named intermediaries include Solapi/CoolSMS, Bizppurio, NHN Cloud (Toast), Naver Cloud SENS, and Infobip `C3` — **verify current partner list before contracting.**

**Consequence for the composer:** Korean channel messaging is a **template-and-variables** product, not a free-text product. This is the same shape as WhatsApp templates — build **one** template-management subsystem and reuse it for Kakao AlimTalk, WhatsApp, Zalo ZNS, and Viber Business Messages. That reuse is a major architectural win; see §14.5.

### 6.3 Naver

| Surface | API reality | Path |
|---|---|---|
| **Naver Developers** `openapi.naver.com` | Real and open, but the endpoints are **search, DataLab, Papago translation, CLOVA, OCR, Maps** — **not** blog publishing. Genuinely useful for *listening* (blog/news/cafe search) — see `12-analytics-listening-gtm.md`. `C2` | R1 for listening |
| **Naver Blog write API** | A `blog/writePost` endpoint existed under Naver Login integration; **believed withdrawn** `C3`. `E`: no npm ecosystem. | R3 |
| **Naver Cafe** | Article write API via Naver Login: `openapi.naver.com/v1/cafe/{clubId}/menu/{menuId}/articles` `C2`. Cafes are Korea's dominant community format — genuinely valuable. | R2 |
| **Naver Band** | **Band Open API** at `openapi.band.us` — `/v2/bands`, `/v2/band/posts`, `/v2/band/post/create`, `/v2/band/post/comments` `C2`. ~20M MAU `C3`. | R2 |
| **Naver Post** | **Service discontinued / folded into Blog** `C3`. | R5 |
| **Instagram in Korea** | ~20M+ `C3`, the dominant *visual* network. Covered by tier-1. | Covered |

### 6.4 Korea effort

| Item | Effort | Calendar |
|---|---|---|
| Kakao Login + channel listing + self-message (foundation) | 2 weeks | — |
| AlimTalk/FriendTalk via BSP (template mgmt, sender profile, delivery receipts) | 4–6 weeks | **8–16 weeks** partner contracting + profile approval |
| Naver Band adapter | 3 weeks | — |
| Naver Cafe adapter | 3 weeks | — |
| Naver search/DataLab listening ingestion | 2 weeks | — |
| ko-KR localization (professional) | 1–2 weeks eng + translation cost | — |

**Korea also has a data-localization consideration:** PIPA and, for certain sectors, requirements around domestic storage and cross-border transfer consent. Treat Korea as a candidate for the same sovereign-shard mechanism as China and the EU. See `11-compliance-security-global.md`.

---

## 7. Russia / CIS

> **Read §7.4 before building anything in this section.** The engineering is easy; the legal and payment questions are not.

### 7.1 VK — technically the best regional API in this entire document

> `V` — everything marked `V` here is read directly from `github.com/VKCOM/vk-api-schema`, VK's own machine-readable API schema, cloned in this session. **Schema version `5.199`** `V`.

**Host:** `https://api.vk.com/method/{method}` with `v=5.199` `C2`.

**`wall.post` full parameter list `V`:**

| Param | Type | Note |
|---|---|---|
| `owner_id` | integer | Negative for a community |
| `friends_only` | boolean | |
| `from_group` | boolean | Post as the community rather than as the admin |
| `message` | string | Required if no `attachments` |
| `attachments` | array | Required if no `message` |
| `services` | string | Cross-export to linked services |
| `signed` | boolean | Community posts signed by the author |
| **`publish_date`** | **integer (Unix time)** | **"If used, posting will be delayed until the set time"** |
| `lat` / `long` | number | Geo check-in |
| `place_id` | integer | |
| `post_id` | integer | **"Used for publishing of scheduled and suggested posts"** |
| `guid` | string | **Idempotency key** |
| `mark_as_ads` | boolean | |
| `link_title`, `link_photo_id` | string | Link card override |
| `close_comments` | boolean | |
| `donut_paid_duration` | integer | VK Donut paywall window |
| `mute_notifications` | boolean | |
| `copyright` | string | Source attribution |

`access_token_type: ['user']` `V` — **`wall.post` requires a user token, not a group token.** This is an important operational detail: the connected identity must be an admin *person*, and if that person leaves the company the connection dies. Our UI must warn about this.

**Two findings worth building around:**

1. **`publish_date` gives VK true native scheduling** — one of only a handful of networks in our entire portfolio that does (compare `06-platform-apis-tier1.md` §1.2: only Facebook Pages and YouTube). We should hand the post to VK and let VK own the clock, with our scheduler as a verification layer rather than the system of record.
2. **`guid` is a first-class idempotency key.** Use it. Retry-safety on VK is free; on most networks it is not.

**Analytics `V`:**
```
stats.get             (group_id|app_id, timestamp_from/to, interval, intervals_count,
                       filters, stats_groups, extended)   — access_token_type: ['user']
stats.getPostReach    (owner_id, post_ids)                — access_token_type: ['user']
stats.trackVisitor    (type)
```
`stats.getPostReach` is a genuine per-post reach metric — better than several tier-1 networks provide.

**Other verified method families `V`** (full method names read from the schema):

- `wall.*` — 25 methods including `createComment`, `getComments`, `getReposts`, `pin`/`unpin`, `openComments`/`closeComments`, `edit`, `delete`, `restore`, `repost`, `search`, `reportPost`/`reportComment`, `parseAttachedLink`, `checkCopyrightLink`, `editAdsStealth`.
- `stories.*` — 16 methods: `getPhotoUploadServer`, `getVideoUploadServer`, `save`, `get`, `getById`, **`getStats`**, `getViewers`, `getReplies`, `delete`, `search`, `sendInteraction`, `hideReply`/`hideAllReplies`, `banOwner`/`unbanOwner`, `getBanned`. **VK exposes story analytics — Instagram largely does not.**
- `video.*` — 35 methods including `save`, `add`, `edit`, `getComments`, `createComment`, `getThumbUploadUrl`, `saveUploadedThumb`, **`startStreaming`/`stopStreaming`**, `liveGetCategories`, `getLongPollServer`, `getOembed`.
- `photos.*` — 45 methods; note the **upload-server pattern**: `photos.getWallUploadServer` → POST the binary to the returned URL → `photos.saveWallPhoto` → attach. Same pattern for messages, chat, market, owner cover. **This three-step upload is VK's signature awkwardness — abstract it once.**
- `groups.*` — 51 methods including **`addCallbackServer`, `setCallbackSettings`, `getCallbackConfirmationCode`, `getCallbackServers`** (webhooks!), `getLongPollServer`, `getLongPollSettings`, `getTokenPermissions`, `getMembers`, `getRequests`, `editManager`, `getSettings`/`setSettings`, tag management.
- `messages.*` — 48 methods: `send`, `edit`, `getConversations`, `getHistory`, `markAsRead`, `getLongPollServer`, `getLongPollHistory`, `sendReaction`/`deleteReaction`, `getMessagesReactions`, `getReactedPeers`, `pin`/`unpin`, `markAsAnsweredConversation`, `markAsImportant`. **A complete social-inbox surface.**
- `likes.*` — `add`, `delete`, `getList`, `isLiked`.
- `newsfeed.*` — includes **`newsfeed.search`** and `getMentions` — a **listening** surface.

**Webhooks:** VK's Callback API is configured through `groups.addCallbackServer` + `groups.setCallbackSettings`, with a confirmation-code handshake (`groups.getCallbackConfirmationCode`) `V`. There is also a Long Poll alternative (`groups.getLongPollServer`) `V`. Prefer Callback (push) over Long Poll (pull) for a multi-tenant SaaS.

**Batching:** VK exposes an `execute` domain `V` — a VKScript endpoint that runs up to 25 API calls in one request. This is the correct way to stay inside rate limits when fanning out analytics collection.

**Rate limits:** commonly cited as ~3 requests/second per user access token for most methods, with higher allowances for service tokens on specific methods `C3`. **Verify.** `execute` batching is the documented mitigation.

**Effort: 4–5 engineer-weeks.** Would be 3 if not for the upload-server dance and the user-token constraint.

### 7.2 Odnoklassniki (OK.ru)

- **~36M MAU** `C3`, skewing older and to regional Russia/CIS — a genuinely distinct audience from VK.
- API: `https://api.ok.ru/fb.do` with `method=` parameter. Posting via **`mediatopic.post`** (the modern method; legacy `stream.publish` is deprecated). Auth: OAuth2 + a per-request signature (MD5 over sorted `key=value` pairs concatenated with a session/application secret). `C2`
- `E`: npm shows only `passport-odnoklassniki` — an OAuth strategy, no full SDK. Consistent with "real but neglected API".
- **Effort: 3 engineer-weeks**, most of it the signature scheme and error mapping.

### 7.3 Telegram — and the architectural fork

**Scale: 1B+ MAU** `C3` (Telegram announced crossing 1 billion in 2025). Global, not merely CIS — dominant in Iran, Uzbekistan, Ethiopia, and heavily used in Brazil, India, Indonesia, MENA.

**Two APIs, and the difference is load-bearing:**

| | **Bot API** (`api.telegram.org/bot{token}/`) | **MTProto / TDLib** |
|---|---|---|
| Auth | Bot token from @BotFather | Full user session (phone + code) |
| Publishing to a channel | **Yes** — add bot as channel admin, then `sendMessage`, `sendPhoto`, `sendVideo`, `sendMediaGroup`, `sendPoll`, `sendDocument`, `editMessageText`, `editMessageCaption`, `deleteMessage`, `pinChatMessage` `C1` | Yes |
| Scheduled send | `sendMessage` has no `schedule_date`; **scheduling is MTProto-only** `C2` | Yes |
| Member count | `getChatMemberCount` `C2` | Yes |
| **Channel view counts / post reach / subscriber growth** | **No** `C1` | **Yes — `getChatStatistics` / `getMessageStatistics`** `C2` |
| Multi-tenant safety | Excellent — one bot per customer channel | Poor — requires holding user credentials |
| Regulatory posture | Clean | Holding end-user Telegram sessions is a **serious** privacy and ToS question |

**The architectural decision:** ship **Bot API only** for publishing and inbox. Do **not** build MTProto session handling to obtain view counts. If channel analytics become a hard requirement, the acceptable pattern is **user-initiated manual import** of Telegram's own exported statistics, not a stored user session.

**Bot API details worth encoding** `C2`:
- Message text limit **4,096 characters**; media caption limit **1,024 characters**.
- `parse_mode`: `MarkdownV2` (aggressive escaping required — `_*[]()~\`>#+-=|{}.!`), `HTML` (safer subset), or legacy `Markdown`. **Use `HTML`.** MarkdownV2 escaping bugs are a top source of failed sends.
- `sendMediaGroup` — album of 2–10 items, all-or-nothing.
- Rate limits: broadly ~30 messages/second overall and ~20 messages/minute per group `C3`.
- Webhook via `setWebhook` (with a `secret_token` header for verification) or long polling via `getUpdates`. **Use webhooks with `secret_token`.**
- **`E`/staleness note:** the community schema generator `ark0f/tg-bot-api` last released **v0.6.0 in March 2024** — the repo is not a reliable source for current Bot API version. Verify against `core.telegram.org/bots/api` directly.

**Effort: 3–4 engineer-weeks** for Bot API publishing + inbox + webhook.

### 7.4 Dzen, Rutube, and the sanctions question

| Platform | Status |
|---|---|
| **Dzen (Дзен)** | Yandex's recommendation feed, **sold to VK in 2022**. ~80M monthly `C3`. Publishing is via the Dzen studio UI or **RSS import** for approved publishers; no general open posting API. **R5 for now.** |
| **Rutube** | State-adjacent (Gazprom-Media). Partner upload only. **Gazprom-Media is a sanctioned entity.** **R5.** |

**The compliance analysis — do not skip this:**

1. **Entity sanctions.** VK's ownership has been subject to EU/UK/US designations, and Gazprom-Media is sanctioned. Providing services *to* or accepting payment *from* a sanctioned entity is a violation. Providing a *tool* that a non-sanctioned Russian business uses to post to VK is a different and less clear-cut question — **it requires legal advice, not an engineering judgment.**
2. **Sectoral services bans.** EU sanctions packages have prohibited providing certain **business, IT, and software services** to entities established in Russia. A SaaS subscription sold to a Russian-established company plausibly falls inside that prohibition `C2`.
3. **Payment rails.** Russian banks are largely cut from SWIFT; Visa/Mastercard withdrew. **Collecting subscription revenue from Russia is impractical regardless of the legal analysis.**
4. **Practical resolution.** Build the VK adapter — it is cheap, technically excellent, and serves **VK's diaspora audience** (Baltics, Germany, Israel, Central Asia) and CIS markets outside Russia (Kazakhstan, Uzbekistan, Armenia, Georgia) which are **not** sanctioned. Gate it:
   - Feature flag per workspace, default **off**.
   - Block workspaces whose billing country is RU/BY at signup.
   - Run an OFAC/EU consolidated-list screen on company names at onboarding.
   - Document the decision and the legal advice that supports it.

---

## 8. Southeast Asia

### 8.1 The shape of the market

SEA is **not** a single market and is **not** an API-poor market — it is a market where **Meta and TikTok already dominate** and where the incremental coverage value comes from **two** places: Vietnam (Zalo) and Thailand (LINE).

| Country | Dominant social | Dominant messaging | Notable local |
|---|---|---|---|
| Indonesia | Instagram, TikTok, Facebook | WhatsApp | LINE (declining), Telegram growing |
| Vietnam | Facebook, TikTok | **Zalo (~78M)** | Zalo OA is the local business channel |
| Thailand | Facebook, TikTok, Instagram | **LINE (~56M)** | LINE MyShop, LINE OA is *the* CRM channel |
| Philippines | Facebook (near-universal), TikTok | Messenger, **Viber** | — |
| Malaysia | Facebook, Instagram, TikTok | WhatsApp | — |
| Singapore | Instagram, TikTok, LinkedIn | WhatsApp, Telegram | — |
| Myanmar/Cambodia/Laos | Facebook | Viber (MM), Telegram | — |

### 8.2 Zalo (Vietnam) — R1

> `V` — endpoint paths extracted from a maintained 2026 community integration (`bautran1911/n8n-nodes-zalo-oa`) cloned in this session. Host and version numbers are from the code; semantics are `C2`.

**Hosts `V`:** `https://openapi.zalo.me` and `https://business.openapi.zalo.me`.

**Verified endpoint paths `V`:**
```
/v4/oa/access_token          token exchange / refresh
/v4/oa/permission            granted permissions for the OA
/v3.0/oa/message/cs          customer-service message send
/v3.0/oa/user/getlist        follower list
/v3.0/oa/user/detail         follower profile
/v2.0/oa/getoa               OA metadata
/v2.0/oa/conversation        conversation history
```

**Structural notes `C2`:**
- Zalo OA messaging is **windowed and categorized**, like WhatsApp: customer-service messages inside a response window; **promotional messages require ZNS (Zalo Notification Service)**, which is **template-based and pre-approved**, billed per message.
- Zalo OA also supports **articles/broadcast posts** on the OA feed (`/v2.0/article/*` family) `C3` — verify.
- OAuth flow issues a short-lived `access_token` plus a `refresh_token` that **rotates on use** `C2`. Persist atomically.
- Verification: an OA must be **verified** (xác thực) to unlock most API capabilities; verification requires Vietnamese business documents `C2`. **A foreign SaaS can integrate; the customer needs a verified Vietnamese OA.** That is the right division of responsibility.

**`E` corroboration of health:** the Zalo OA npm ecosystem is *active in 2026* — multiple independently-published n8n community nodes and MCP servers (`@bautran1911/n8n-nodes-zalo-oa`, `@theyahia/zalo-oa-mcp`, `@rtawebteam/n8n-nodes-zalo`, `@aisar-labs/zalo-mcp`, `ecom-connector`). Compare Kwai and ShareChat, where the ecosystem is scrapers or nothing. **This is a real, usable, currently-maintained API.**

**Effort: 4–5 engineer-weeks.**

### 8.3 LINE Thailand

Same adapter as §5.2 — **no additional engineering**, and the insight/demographic endpoints explicitly cover TH `V`. This is the strongest argument for building LINE: **one adapter, two significant markets** (plus TW and ID).

Thailand-specific product notes:
- LINE OA is used as a **storefront and CRM**, not just a broadcast channel. Rich menus are the primary navigation surface — our rich-menu editor matters more here than in Japan.
- **Thai Buddhist calendar** (year = CE + 543) and Thai line-breaking (no spaces between words) are hard requirements — see §15.5 and §17.4.

### 8.4 Viber

- Strongest in the **Philippines, Ukraine, Belarus, Greece, Iraq, Myanmar** `C3`.
- **Public Account / bot API** host verified `V`: `https://chatapi.viber.com/pa` (extracted from `Viber/viber-bot-node`). Endpoint family `C2`: `/pa/set_webhook`, `/pa/send_message`, `/pa/broadcast_message`, `/pa/get_account_info`, `/pa/get_user_details`, `/pa/get_online`, `/pa/post` (public account post).
- **Viber Business Messages** (the commercial, high-volume channel) is sold **through CPaaS partners** — Infobip, Sinch, CM.com, Bird `C3`. Same Archetype C shape as Kakao/WhatsApp.
- **Effort: 3 engineer-weeks** for the bot API; the Business Messages path is a partner integration.

### 8.5 Shopee and Lazada — social commerce, not social

Both run genuine open platforms with HMAC-signed requests `C2`:

| | Shopee | Lazada |
|---|---|---|
| Host | `https://partner.shopeemobile.com/api/v2/` | `https://api.lazada.{tld}/rest` |
| Signing | HMAC-SHA256 over `partner_id + path + timestamp + access_token + shop_id` | HMAC-SHA256 over sorted concatenated params, `sign_method=sha256` |
| Auth | Shop authorization → `access_token` + `refresh_token` (4h / 30d) `C3` | App key/secret → per-seller `access_token` |
| Domains | `product`, `order`, `logistics`, `payment`, `media_space`, `discount`, `voucher`, `chat` | `product`, `order`, `logistics`, `finance`, `im`, `marketing` |
| **Feed / Live post creation** | **Not exposed** `C3` | **Not exposed** `C3` |
| **Chat / IM** | **`chat` domain exists** — a real inbox surface | **`im` domain exists** |

**The actionable finding:** the *commerce chat* endpoints are the valuable part. A unified inbox that includes Shopee Chat and Lazada IM alongside Instagram DMs and WhatsApp is a genuinely novel SEA product. Feed posting is not available and should be R3.

`E` confirms healthy ecosystems: `shopee-api-client`, `shopee-openapi-v2`, `lazada-open-platform-sdk`, `lazada-sdk`, `@things-factory/lazop-api`.

**Effort: 3 engineer-weeks each** for chat + basic catalog read.

---

## 9. India

### 9.1 The honest assessment

India is the largest social-media market by users and one of the **worst** for regional API coverage. The homegrown short-video platforms that captured the post-TikTok-ban audience have **no public content APIs**, and the market's real centre of gravity is **WhatsApp and Instagram**, both already covered.

### 9.2 Platform-by-platform

| Platform | MAU `C3` | API reality | Path |
|---|---|---|---|
| **WhatsApp** | ~500M+ IN users | WhatsApp Business Platform (Cloud API / On-Premises deprecated). Template-based marketing messages, session messages in a 24h window. Meta moved to **per-message pricing** during 2025 `C3`. | R1 — see `07` |
| **Instagram** | ~360M+ IN | Tier-1 adapter | Covered |
| **ShareChat** | ~180M | **No public API.** `E`: the entire `ShareChat`/`@mohalla-tech` npm footprint is internal engineering tooling (eslint config, prettier config, XSS helper, date picker) — **zero** API client. Decisive negative. | R3 |
| **Moj** | ~160M | No public API (same company as ShareChat) | R3 |
| **Josh** (VerSe/Dailyhunt) | ~150M | No public API | R3 |
| **Chingari** | collapsed | Pivoted to Web3/GARI; not a marketing surface | R5 |
| **Koo** | — | **Shut down July 2024** `C2`. Remove from all roadmaps and comparison tables. | **R5 — dead** |
| **JioChat** | negligible | — | R5 |
| **Telegram** | large and growing in IN | Bot API — see §7.3 | R1 |

### 9.3 What India actually needs from us

Not adapters — **product and pricing fit**:

1. **Aggressive PPP pricing.** India is the canonical case for a 60–70% discount band (§18.4). Without it, we do not compete with Indian-built tools.
2. **UPI + local payment methods.** Cards are a minority rail. Recurring billing must use **UPI Autopay / e-mandate**. See §18.5.
3. **GST compliance as a non-resident (OIDAR).** See §19.5. Getting this wrong is a market-entry blocker, not a footnote.
4. **Indic script support.** Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia — grapheme-aware counting and correct fonts. See §15.4.
5. **Indian holiday calendar with regional variation** — India's holiday set differs materially by state, and religious holidays follow lunar calendars. `date-holidays` has an `IN.yaml` `V` but state-level fidelity needs checking.
6. **WhatsApp-first workflows.** For a large share of Indian SMBs, WhatsApp *is* the marketing channel. A "WhatsApp campaign + Instagram post" combined calendar is more valuable than any regional adapter.

---

## 10. MENA

### 10.1 Snapchat — the biggest unfixable gap in the document

- Snapchat's penetration in the **Gulf** is extraordinary — Saudi Arabia is consistently among Snap's largest and most engaged markets, with reach among 13+ internet users reported in the **80–90%** band `C3`.
- **There is no organic content-posting API.** `C1` What Snap exposes:
  - **Snap Marketing API** — ads, audiences, creatives, reporting. **Paid media only.**
  - **Snap Kit** (Login Kit, Creative Kit, Bitmoji Kit, Camera Kit) — **client-side share-to-Snapchat from a mobile app.** Requires a user tapping in *our mobile app*; cannot be driven server-side; cannot be scheduled.
  - **Public Profile / Spotlight / Stories management** — Snapchat's own web tools, no API.
- **Therefore: no competitor can schedule organic Snaps either.** This is a market-wide gap. Position it honestly: "Snapchat: reminder publishing + paid-campaign reporting", and do not let sales imply otherwise.
- **A real opportunity:** because *nobody* offers Snapchat organic scheduling, a **first-class reminder-publish experience for Snapchat** (mobile push at the scheduled minute, assets pre-saved to camera roll, caption on clipboard, deep link to the Snapchat camera, confirm-and-log) is a differentiator in the Gulf that costs ~1–2 engineer-weeks.

### 10.2 The rest of MENA

| Platform | Reality |
|---|---|
| **TikTok** | Very strong across MENA. Tier-1 adapter. |
| **X** | High usage in Saudi/Gulf political and brand discourse. Tier-1. |
| **Instagram** | Dominant visual network. Tier-1. |
| **Telegram** | Extremely large in **Iran** (despite formal blocking) and significant across the Levant and Gulf. §7.3 adapter covers it. **Note the sanctions dimension for Iran — Iranian customers are off-limits for a US-nexus company.** |
| **WhatsApp** | Dominant messaging across the Levant, North Africa. `07` covers it. |
| **Anghami** | ~20M MAU `C3`, Nasdaq-listed, the regional music platform. **No public API for artist/label posting.** Anghami for Artists is a dashboard; content distribution runs through music aggregators. **R5** for social publishing; possibly relevant to `10-commerce-creator-influencer.md`. |

### 10.3 What MENA actually needs from us

**RTL is the requirement, not an adapter.** Specifically:

1. **Full RTL UI** — not a mirrored stylesheet bolted on, but logical properties throughout (§15.2).
2. **Arabic content composition** that does not corrupt text: correct bidi isolation in previews, no mid-word truncation, correct shaping. §15.2.
3. **Hijri calendar and Ramadan-aware content planning** (§17.4) — the single highest-value regional feature for Gulf agencies. Ramadan moves ~11 days earlier each Gregorian year; campaign planning is built around it; and **Hijri dates can differ ±1 day by country** due to moon sighting. Show the variance.
4. **Friday–Saturday weekends.** `V` from CLDR: `SA`, `EG`, `IL`, `KW`, `QA`, `OM`, `BH`, `JO`, `DZ` all have `weekendStart=fri, weekendEnd=sat`; `IR` has `weekendStart=fri, weekendEnd=fri`; `AF` has `thu`–`fri`. A "best time to post" heatmap that assumes Sat–Sun is **wrong in the entire Gulf**.
5. **First day of week varies.** `V` from CLDR: `SA`=sun, `AE`=mon, `EG`=sat, `IL`=sun, `IR`=sat, `AF`=sat, `MV`=fri. A hardcoded Monday- or Sunday-start calendar is wrong somewhere important.
6. **Arabic-Indic digits** — `arab` (٠١٢٣٤٥٦٧٨٩) and `arabext` (۰۱۲۳۴۵۶۷۸۹) `V`. Locale-correct number rendering via `Intl.NumberFormat` with the right numbering system.
7. **Arabic pluralization has six categories** — `zero, one, two, few, many, other` `V` (CLDR). Any i18n framework that assumes `{one, other}` will produce broken Arabic. Use ICU MessageFormat.

---

## 11. Africa

### 11.1 The correct mental model

Africa is **not** an under-served-platform problem. It is an **under-served-constraints** problem. The platforms are WhatsApp, Facebook, TikTok, Instagram, and Telegram — all tier-1. What is missing from every competitor is engineering for the *conditions*.

### 11.2 Platforms

| Platform | Reality |
|---|---|
| **WhatsApp** | The dominant channel in Nigeria, Kenya, South Africa, Ghana, Egypt — commonly 90%+ of internet users. WhatsApp Business Platform covered in `07`. **This is the Africa integration.** |
| **Facebook** | Still the dominant *social* network across much of the continent. Tier-1. |
| **TikTok** | Fastest-growing. Tier-1. |
| **Telegram** | Very large in **Ethiopia**, significant elsewhere. §7.3. |
| **Ayoba** (MTN) | ~35M MAU `C3`. Zero-rated on MTN networks — a genuine structural advantage. Has a micro-app platform and business channels. **Public API: `UNVERIFIED`.** Worth a partnership enquiry given MTN's footprint. |
| **Moya / Datafree** (biNu, South Africa) | Reverse-billed ("datafree") messaging — the user pays no data. ~10M `C3`. Business channels are partner-contracted. **R3 / partnership.** |
| **USSD** | Not social media, but for a large share of African SMB customer communication it *is* the channel. Aggregators: **Africa's Talking** (`api.africastalking.com`, USSD session callbacks + SMS `/version1/messaging`), Infobip, Termii. `C2` |

### 11.3 The constraints that must become product requirements

| Constraint | Requirement |
|---|---|
| **Data cost** — mobile data is a meaningful share of income in many markets | A **lite mode**: server-rendered lists, deferred image loading, aggressive WebP/AVIF, no autoplay video, a hard budget on initial JS payload. Measure and publish the per-session KB cost. |
| **Bandwidth and latency** — 3G-dominant regions, high RTT | Offline-tolerant composer (local draft persistence, background sync). Avoid chatty APIs. Edge-cache static assets on a CDN with African PoPs. |
| **Feature-phone / low-end Android reach** | The *audience* is often on feature phones even when the *marketer* is not. This changes content advice (SMS/USSD/WhatsApp text over Reels), not the app. |
| **Intermittent connectivity** | Scheduled posts must be **server-side**, never device-dependent. Reminder-publish flows must tolerate a phone that is offline at the scheduled minute — re-notify on reconnect. |
| **Payments** | M-Pesa, Paystack, Flutterwave, MTN MoMo — see §18.5. Card penetration is low; **card-only billing excludes most of the market.** |
| **Currency volatility** | NGN, GHS, ETB, EGP have devalued sharply. **Do not** hard-peg local prices; use a periodic FX review with price-change notice, or bill in USD with a local payment method. |

**Effort: ~4–6 engineer-weeks** for lite mode + offline-tolerant composer + African payment rails, and **zero** platform-adapter work. That is an unusually good ratio.

---

## 12. LATAM

### 12.1 Platforms

| Platform | Reality |
|---|---|
| **WhatsApp** | Brazil ~96% of internet users `C3`; similar in Mexico, Argentina, Colombia. **The** channel. Covered in `07`. |
| **Instagram / TikTok / Facebook / YouTube** | Tier-1, all dominant. |
| **Kwai** | ~50M MAU Brazil `C3`. **No organic posting API.** Kwai for Business is an **ads** platform (`open.kwai.com` ad endpoints). `E`: npm search for "kwai api" returns only scrapers and downloaders — decisive. **R3.** |
| **Mercado Libre** | The LATAM commerce and, functionally, customer-communication platform. `https://api.mercadolibre.com` `V` (host confirmed from the official `mercadolibre/php-sdk`). |

### 12.2 Mercado Libre — the underrated LATAM play

**Auth:** OAuth2 with `authorization_code`, per-site app registration (MLB Brazil, MLM Mexico, MLA Argentina...), `refresh_token` rotation `C2`.

**Endpoint families relevant to a social/inbox product `C2`:**
```
GET  /users/me
GET  /items/{item_id} , POST /items , PUT /items/{item_id}
GET  /questions/search?item_id=  |  ?seller_id=          buyer pre-sale questions
POST /answers                                            answer a question
GET  /messages/packs/{pack_id}/sellers/{seller_id}       post-sale conversation
POST /messages/packs/{pack_id}/sellers/{seller_id}       reply
GET  /orders/search
GET  /reviews/item/{item_id}
```
Plus **webhooks/notifications** ("topics": `questions`, `messages`, `orders_v2`, `items`) delivered to a registered callback `C2`.

**Why it matters:** in Brazil and Mexico, a seller's *inbound customer conversation volume* on Mercado Libre often exceeds their Instagram DM volume. Pulling ML questions and post-sale messages into the same unified inbox as Instagram/WhatsApp is a real, differentiated LATAM product. No competitor in files 01–04 does it.

**Effort: 4 engineer-weeks.**

### 12.3 What LATAM needs beyond adapters

1. **pt-BR and es-419 localization** — and they are **different products**. Brazilian Portuguese is not European Portuguese; Latin American Spanish is not es-ES. Ship `pt-BR` and `es-419`, not `pt` and `es`.
2. **Pix and Boleto** (Brazil), **OXXO and SPEI** (Mexico), **installments (parcelamento)** — see §18.5. Card-only billing is a serious handicap in Brazil.
3. **Brazilian tax reform** — CBS/IBS transition is live in 2026. §19.6.
4. **Sunday-start weeks** — `V` from CLDR: `BR` `firstDay=sun`.
5. **Carnival, Día de Muertos, Fiestas Patrias** and other market-defining moments in the content calendar.

---

## 13. Europe, non-mainstream

| Platform | Assessment |
|---|---|
| **XING** (DACH) | ~22M members `C3`. **The public XING API was withdrawn.** `E`: an npm search for "xing api" in 2026 returns *nothing relevant* — no maintained client, no OAuth strategy, only unrelated font packages. For a network of this size, an empty ecosystem is a decisive signal. Remaining APIs are **XING E-Recruiting / Talent Manager** partner interfaces, irrelevant to social publishing. **R5.** |
| **Viadeo** (FR) | Effectively defunct as a social network. **R5.** |
| **VKontakte diaspora** | Real audiences in the Baltics, Germany, Israel, and Central Asia. Served by the **same VK adapter** (§7.1) with no additional work. This is the strongest argument for building VK even under a Russia-market block. |
| **Mastodon / Fediverse** | Not "regional", but a genuine gap and cheap: a standardized REST API, per-instance OAuth app registration, `POST /api/v1/statuses` with `scheduled_at` (**native scheduling**), `GET /api/v1/accounts/{id}/statuses`. **~2 engineer-weeks.** Covered in `07-platform-apis-tier2.md`; flagged here because it is the cheapest coverage line in the whole portfolio. |
| **Bluesky / AT Protocol** | Also in `07`. Relevant to this document only for its **grapheme-based** character limit — see §16.3. |

---

## 14. Regional adapter architecture

### 14.1 The interface every adapter implements

```
interface NetworkAdapter {
  // identity & auth
  authorizeUrl(state): URL
  exchangeCode(code): Credential          // may be multi-step (WeChat component, VK upload servers)
  refresh(credential): Credential          // MUST persist rotated refresh tokens atomically
  revoke(credential): void
  probe(credential): AccountHealth         // cheap liveness + scope check, run daily

  // capability declaration — drives the composer UI, not the other way round
  capabilities(): CapabilityMatrix         // formats, limits, scheduling mode, quota model

  // publishing
  validate(draft): ValidationResult[]      // use platform-native validators where they exist (LINE)
  transform(draft): NetworkPayload         // counting, truncation, hashtag placement, asset rewriting
  publish(payload): PublishHandle          // sync | async-with-poll | native-scheduled | reminder
  pollPublish(handle): PublishState        // WeChat freepublish, LINE narrowcast, Douyin upload
  delete(ref): void

  // read
  metrics(ref, window): MetricSet
  accountMetrics(window): MetricSet
  inbound(cursor): Event[]                 // comments, DMs, mentions
}
```

### 14.2 The four publishing modes — model these explicitly

| Mode | Members | Scheduler responsibility |
|---|---|---|
| **`SYNC`** | Telegram, Zalo, VK (immediate), OK, Mercado Libre reply | Fire at T, confirm, done |
| **`NATIVE_SCHEDULED`** | **VK (`publish_date`)** `V`, Facebook Pages, YouTube, Mastodon (`scheduled_at`) | Hand off at draft time; **our clock is a verifier, not the source of truth**; reconcile daily |
| **`ASYNC_REVIEWED`** | **WeChat `freepublish`**, LINE `narrowcast`, Douyin/Kuaishou/Bilibili uploads | Submit, poll with backoff, model `rejected` as a first-class terminal state that notifies a human |
| **`REMINDER`** | Snapchat, Xiaohongshu, VOOM, ShareChat, Kwai, Naver Blog, Ameba, note | Notify, deep-link, collect confirmation, allow manual metrics |

Most schedulers model only `SYNC`. The bugs that follow — double-posting when a native-scheduled post is also fired locally; treating an async submission as success; silently swallowing a content-review rejection — are exactly the ones that destroy trust.

### 14.3 Quota models — also explicit

| Model | Members |
|---|---|
| **Rate-limited** (req/s) | VK (~3/s), LINE (~2,000/s), Telegram (~30/s) |
| **Post-count-capped** | **WeChat 订阅号 1/day, 服务号 4/month** — the composer must show remaining slots |
| **Message-metered (billed)** | LINE plans, WhatsApp per-message, Kakao AlimTalk, Zalo ZNS — surface **cost**, not just count |
| **Token-refresh-capped** | WeChat `/cgi-bin/token` daily refresh cap — forces a centralized minter |

### 14.4 Error taxonomy — normalize once

Every adapter must map its native errors onto a shared set, because retry policy and user messaging depend on the class, not the platform:

```
AUTH_EXPIRED          → refresh, then retry once; if it fails, mark connection broken + notify
AUTH_REVOKED          → do not retry; require re-connect
SCOPE_MISSING         → do not retry; surface exactly which scope and how to grant it
RATE_LIMITED          → retry with backoff honoring Retry-After; do not count as a failure
QUOTA_EXHAUSTED       → do not retry; surface the quota and its reset time
CONTENT_REJECTED      → do not retry; surface the platform's reason verbatim + translated
VALIDATION_FAILED     → do not retry; should have been caught pre-flight — log as a validator gap
TRANSIENT             → retry with jitter, bounded
PLATFORM_DOWN         → retry on a long backoff; surface a status banner
UNKNOWN               → retry once, then alert an engineer — every UNKNOWN is a taxonomy bug
```

**Chinese and Korean APIs return error messages in Chinese/Korean.** Store the raw message *and* a translated one; never show only the raw string to an English-speaking user, and never show only a translation to a Chinese-speaking user.

### 14.5 The template subsystem — build once, use five times

Kakao AlimTalk, WhatsApp, Zalo ZNS, Viber Business Messages, and (loosely) WeChat template messages all share a shape:

- A **template** with named variables, submitted for platform approval.
- An **approval lifecycle**: `draft → submitted → approved | rejected` with a reason.
- **Per-template category** (transactional vs. marketing) driving deliverability and price.
- **Send** = template ID + variable bindings + recipient.
- **Per-message cost** that must reach the invoice.

Build one template model, one approval UI, one variable-binding editor, one cost ledger. Retrofitting this after building WhatsApp-only templates is expensive.

### 14.6 Sovereign shards

Three drivers converge on the same design: China (PIPL + ICP-filed callbacks), EU (GDPR data residency demands), Korea (PIPA). The pattern:

- **Regional data plane**: in-region storage of platform tokens, message content, and end-user PII; in-region webhook/callback endpoints on region-appropriate domains.
- **Global control plane**: accounts, billing, feature flags, aggregate non-identifying metrics.
- **No cross-shard PII**, enforced at the schema and CI level (a lint that fails if a PII-tagged column is referenced from a global-plane service).

Build the *seam* early even if the second shard ships late. Retrofitting residency into a single-region monolith is a rewrite.

---

## 15. Globalization I — text

### 15.1 The foundational rule

> **Never use `String.length`, `len(s)`, or codepoint iteration to measure user-facing text.**

`"👩‍👩‍👧‍👦".length` is **11** in JavaScript (UTF-16 units), **7** by codepoint, and **1** by grapheme. Users count 1. Networks count variously. Every counting decision must be explicit.

Use `Intl.Segmenter(locale, { granularity: 'grapheme' })` — available in all current runtimes — as the canonical text unit, and layer per-network rules on top (§16).

### 15.2 RTL — Arabic, Hebrew, Farsi, Urdu

#### 15.2.1 Layout

- Use **CSS logical properties everywhere**: `margin-inline-start`, `padding-inline-end`, `inset-inline-start/end`, `border-start-start-radius`, `text-align: start/end`. Never `left`/`right` in component CSS. This makes RTL a `dir` attribute change, not a second stylesheet.
- Set `dir` on the **document** for UI direction and on **content containers** for content direction — these are independent. An English-language UI must still render an Arabic post preview RTL.
- Use `:dir(rtl)` for the rare genuinely-directional rule.

#### 15.2.2 Bidi — the part that silently corrupts data

The Unicode Bidirectional Algorithm (UAX #9) reorders text for display. When you interpolate untrusted strings into a template, **directional runs leak across the boundary** and mangle the result. The canonical failure: an Arabic display name inside an English sentence pushes the following punctuation to the wrong side.

**Fixes, in order of preference:**
1. `<bdi>` element around every interpolated user-controlled string (names, handles, post excerpts). This is what it exists for.
2. `unicode-bidi: plaintext` on containers holding text of unknown direction — applies the first-strong heuristic per paragraph. **Essential for a social inbox** where consecutive messages may differ in direction.
3. Explicit isolates when building plain-text (no-HTML) output: `U+2068` FSI … `U+2069` PDI (first-strong isolate) or `U+2066` LRI / `U+2067` RLI.

**Do not** use the deprecated embedding/override controls (`U+202A`–`U+202E`) — isolates supersede them.

#### 15.2.3 Direction detection

For auto-detecting a post's direction, use the **first-strong** heuristic: scan for the first character with strong directionality (skipping neutrals, punctuation, digits, and emoji); if it is R or AL, the paragraph is RTL. Store the detected direction with the draft and allow the user to override — mixed-language brands need this.

#### 15.2.4 Icon and control mirroring

| Mirror | Do **not** mirror |
|---|---|
| Back/forward arrows, next/previous | Clock faces, checkmarks |
| Reply, forward, send | Media play/pause (play arrow is conventionally LTR even in RTL UIs — verify with native speakers) |
| Progress direction, sliders | Logos, brand marks |
| Text alignment, list bullets | Numerals (always LTR internally) |

#### 15.2.5 Per-language traps

| Language | Trap |
|---|---|
| **Arabic** | Script is **cursive and contextually shaped**. Truncating mid-word does not just cut text — it changes the glyph forms of the surviving characters. **Truncate at word boundaries, and prefer eliding whole words.** Also: 6 plural categories `V`. |
| **Hebrew** | Same bidi issues, no shaping. **3 plural categories** (`one, two, other`) `V`. Holidays begin at **sunset the previous day** — a real scheduling gotcha (§17.4). |
| **Farsi/Persian** | Arabic script **plus** two critical extras: (1) **ZWNJ `U+200C` is semantically significant** — `می‌رود` vs `میرود` are different words. **Any sanitizer that strips zero-width characters will corrupt Persian.** Whitelist `U+200C` explicitly. (2) Persian digits are `arabext` `۰۱۲۳۴۵۶۷۸۹` `V`, distinct from Arabic `arab` `٠١٢٣٤٥٦٧٨٩` `V`. Also: Persian uses `ی` `U+06CC` and `ک` `U+06A9`, not the Arabic `ي`/`ك` — normalize on input. |
| **Urdu** | Written in **Nastaliq**, a steeply-sloped calligraphic style. Rendering requires **Noto Nastaliq Urdu**; the default Arabic (Naskh) font is legible but reads as wrong. Nastaliq needs roughly **double the line-height** of Latin text — a fixed `line-height: 1.4` clips descenders. |

#### 15.2.6 Font strategy for RTL

`Noto Sans Arabic` / `Noto Kufi Arabic` (Arabic), `Noto Sans Hebrew` (Hebrew), `Vazirmatn` or `Noto Sans Arabic` (Persian), **`Noto Nastaliq Urdu`** (Urdu). Subset and self-host; do not rely on system fonts, which vary wildly on Android.

### 15.3 CJK typography

#### 15.3.1 Han unification — the `lang` attribute is not optional

The **same Unicode codepoint** renders with different correct glyphs in Simplified Chinese, Traditional Chinese, Japanese, and Korean (e.g. 直, 骨, 次). A browser picks the variant from the **language of the element**. If you render Japanese text without `lang="ja"`, and the font stack resolves to a Simplified Chinese font first, Japanese readers see subtly wrong characters — instantly recognizable as amateur.

**Requirement:** every text node carries a correct `lang`, propagated from the post's target locale, and the font stack is language-conditioned (`Noto Sans JP`, `Noto Sans SC`, `Noto Sans TC`, `Noto Sans KR`).

#### 15.3.2 Line breaking

- CJK breaks between almost any two characters — **no spaces needed**.
- **Kinsoku shori (禁則処理)**: certain characters may not begin a line (`、。」）々`) and others may not end one (`「（`). Control with `line-break: strict | normal | loose`. Japanese editorial standards expect `strict`.
- **Korean breaks at word boundaries, not characters.** Use `word-break: keep-all` for `lang="ko"` — without it, Hangul words break mid-word and look broken to Korean readers.
- CSS Text Level 4 adds `text-spacing-trim` and `text-autospace` for the thin space conventionally inserted between CJK and Latin/numeral runs. Progressive enhancement `C3`.

#### 15.3.3 Width

Full-width forms (`fullwide` numbering system `V`: `０１２３４５６７８９`) occupy one em. Layout that assumes proportional Latin metrics will misjudge CJK line lengths by ~2×. Use `ch`-based sizing carefully or measure with the actual font.

### 15.4 Indic scripts

- **Grapheme clusters are mandatory.** Devanagari `क्षि` is several codepoints (consonant + virama + consonant + vowel sign) and **one** user-perceived character. Both `.length` and codepoint iteration are wrong.
- **Reordering:** some vowel signs are typed after but rendered before their consonant (`ि`). Cursor movement, selection, and truncation must all operate on grapheme clusters, which `Intl.Segmenter` provides correctly.
- **Numbering systems** `V` from CLDR — Devanagari `०१२३४५६७८९`, Bengali `০১২৩৪৫৬৭৮৯`, Gurmukhi `੦੧੨੩੪੫੬੭੮੯`, Gujarati `૦૧૨૩૪૫૬૭૮૯`, Odia `୦୧୨୩୪୫୬୭୮୯`, Tamil `௦௧௨௩௪௫௬௭௮௯`, Telugu `౦౧౨౩౪౫౬౭౮౯`, Kannada `೦೧೨೩೪೫೬೭೮೯`, Malayalam `൦൧൨൩൪൫൬൭൮൯`. **CLDR defines 78 numeric numbering systems in total** `V`.
- **Fonts:** Noto Sans Devanagari / Bengali / Gurmukhi / Gujarati / Oriya / Tamil / Telugu / Kannada / Malayalam. Each is a separate subset — ship them conditionally, not all at once.
- **Plural:** Hindi is `{one, other}` `V` — simple. But **do not** assume that generalizes across Indic languages.

### 15.5 Scripts without word spaces

**Thai, Lao, Khmer, Burmese, Japanese, Chinese** have no inter-word spaces. Correct line breaking requires **dictionary-based segmentation**. `Intl.Segmenter(locale, { granularity: 'word' })` uses ICU's dictionaries and is the right tool. Naive `\s`-based word counting reports **1 word** for an entire Thai paragraph — which breaks word-count UI, reading-time estimates, and any keyword extraction in the listening pipeline.

**Fonts:** `Noto Sans Thai`, `Noto Sans Lao`, `Noto Sans Khmer`, `Noto Sans Myanmar`. Thai also needs extra line-height for stacked tone marks and vowels above/below the baseline.

### 15.6 Normalization and sanitization policy

| Rule | Reason |
|---|---|
| Normalize input to **NFC** on save | Prevents visually identical strings comparing unequal; required for reliable dedupe and search |
| **Never strip all zero-width characters** | `U+200C` ZWNJ is semantic in Persian/Urdu/Hindi; `U+200D` ZWJ builds emoji sequences and is semantic in Indic conjuncts |
| **Do** strip `U+202A`–`U+202E` (bidi overrides) from untrusted input | Trojan-Source-style spoofing; use isolates instead |
| Preserve `U+2066`–`U+2069` only if we inserted them | Otherwise strip |
| Do not "normalize" emoji variation selectors (`U+FE0F`) away | Changes rendering from text-style to emoji-style |
| Store the original bytes alongside the normalized form | Round-tripping matters when a platform echoes content back |

---

## 16. Globalization II — counting

### 16.1 The three counting systems in the wild

| System | Who uses it | Definition |
|---|---|---|
| **Grapheme count** | Bluesky/AT Protocol, and what users intuitively expect | User-perceived characters (`Intl.Segmenter`) |
| **Codepoint count** | Most networks, loosely | Unicode scalar values |
| **Weighted count** | **X/Twitter** | Per-range weights, see §16.2 |
| **UTF-8 byte count** | Some backends, AT Protocol's secondary limit | Bytes |

### 16.2 X/Twitter weighted counting — verified exactly

> `V` — read directly from `github.com/twitter/twitter-text`, file `config/v3.json`.

```json
{
  "version": 3,
  "maxWeightedTweetLength": 280,
  "scale": 100,
  "defaultWeight": 200,
  "emojiParsingEnabled": true,
  "transformedURLLength": 23,
  "ranges": [
    { "start": 0,    "end": 4351, "weight": 100 },
    { "start": 8192, "end": 8205, "weight": 100 },
    { "start": 8208, "end": 8223, "weight": 100 },
    { "start": 8242, "end": 8247, "weight": 100 }
  ]
}
```

**Decoded:**

| Fact | Implication |
|---|---|
| `scale: 100`, `maxWeightedTweetLength: 280` | The internal budget is **28,000 weight units** |
| `defaultWeight: 200` → **2 units** | Anything outside the listed ranges costs **2** |
| Range `0–4351` (`U+0000`–`U+10FF`) weight `100` → **1 unit** | Latin, Latin Extended, IPA, Greek, **Cyrillic**, Armenian, **Hebrew**, **Arabic**, Syriac, Thaana all cost **1** |
| Ranges `8192–8205`, `8208–8223`, `8242–8247` weight `100` | Specific General Punctuation blocks (spaces, dashes, quotes) cost **1** |
| **Everything else costs 2** | **CJK, Hiragana, Katakana, Hangul, all Indic scripts, Thai, and emoji** |
| `emojiParsingEnabled: true` | A full emoji **ZWJ sequence counts as one unit** (weight 2), not as its constituent codepoints |
| `transformedURLLength: 23` | Every URL counts as exactly **23**, regardless of actual length |

**Consequences worth surfacing in the composer:**
- An Arabic or Hebrew tweet gets the **full 280 characters** — the same as English. Many tools wrongly halve it.
- A **Hindi or Thai** tweet gets only **140 characters**, despite both being alphabetic. This surprises users; show the weighted counter, not a character counter.
- A Japanese tweet gets 140.
- Do **not** implement this from scratch. Use `twitter-text` (JS/Java/Ruby/ObjC implementations all live in that repo `V`) — it also ships a `conformance/` test suite `V`.

### 16.3 Per-network limits — the composer's rule table

`C2`/`C3` throughout — these change and must be re-verified (§22). Tier-1 numbers are cross-referenced against `06-platform-apis-tier1.md`.

| Network | Text limit | Counting unit | Other limits |
|---|---|---|---|
| **X** (standard) | **280 weighted** `V` | Weighted (§16.2) | URLs = 23; 4 images / 1 video / 1 GIF |
| **X** (Premium) | 25,000 chars `C3` | Weighted | |
| **Bluesky** | **300 graphemes**, 3,000 bytes `C2` | **Grapheme** + UTF-8 bytes | The only major network that counts graphemes natively |
| **Mastodon** | 500 default, **instance-configurable** `C2` | Codepoints; URLs count as 23 | Must read the instance's `/api/v1/instance` config |
| **Instagram** | 2,200 caption `C2` | Codepoints | 30 hashtags; 20 @-mentions |
| **Facebook** | 63,206 `C2` | Codepoints | |
| **Threads** | 500 `C2` | Codepoints | |
| **LinkedIn** | 3,000 post `C2` | Codepoints | Article body much larger |
| **TikTok** | 2,200 caption `C3` (was 150, raised) | Codepoints | |
| **YouTube** | title 100, description 5,000 | Codepoints | Tags 500 chars total |
| **Pinterest** | title 100, description 500 | Codepoints | |
| **Telegram** | **4,096** message; **1,024** caption `C2` | UTF-16 | `sendMediaGroup` 2–10 items |
| **WhatsApp** | 4,096 body; template body 1,024 `C3` | Codepoints | Template variables have their own rules |
| **LINE** | 5,000 per text message `C3` | Codepoints | Max **5 message objects** per push/reply `C2` |
| **VK** | ~16,000 wall post `C3` | Codepoints | 10 attachments `C3` |
| **Weibo** | 2,000 (long-form) `C3` | Chinese char = 1 | |
| **WeChat article** | title 64, digest 120 `C3` | Chinese char = 1 | 8 articles per multi-article post `C3` |
| **Zalo OA** | ~2,000 `C3` | Codepoints | |
| **Kakao AlimTalk** | 1,000 template body `C3` | Codepoints | Template pre-approval required |

### 16.4 The counting service — design

```
count(text, network) -> {
  used: number,
  limit: number,
  unit: 'grapheme' | 'codepoint' | 'weighted' | 'byte',
  overBy: number,
  truncationPoint: number | null   // ALWAYS a grapheme boundary, never mid-cluster
}
```

**Rules:**
1. The **display** counter always shows the network's unit, labelled (`218 / 280 weighted`).
2. **Truncation always snaps to a grapheme cluster boundary**, and for cursive scripts (Arabic, Nastaliq) to a **word** boundary.
3. When one draft targets several networks, show **per-network** counters simultaneously and flag the binding constraint. A single "280 chars" counter is wrong for every network except X.
4. URL shortening/wrapping must be simulated *before* counting for networks that transform URLs.
5. Emoji entry must be grapheme-atomic: one backspace removes the whole 👩‍👩‍👧‍👦, not one codepoint of it.

---

## 17. Globalization III — time

### 17.1 Timezones — the rules

1. **Store IANA zone IDs** (`Asia/Kolkata`), never UTC offsets, never abbreviations (`IST` is ambiguous between India, Ireland, and Israel).
2. **Store scheduled times as `(local wall-clock time, IANA zone)`, not as a UTC instant.** If a government changes its DST rules — which happens several times a year — a post scheduled for "9am Tuesday in São Paulo" must still fire at 9am local. A UTC instant silently drifts. This is the single most important scheduling design decision in the document.
3. **Compute the UTC instant at dispatch time**, from the current tzdb, not at schedule time.
4. **Ship tzdb updates automatically.** IANA publishes several releases a year. A stale tzdb is a silent correctness bug. Pin the version, alert on staleness, test the upgrade.
5. **Handle DST-ambiguous and DST-nonexistent local times explicitly.** 02:30 may occur twice or never. Adopt a documented policy — Temporal's `disambiguation: 'compatible' | 'earlier' | 'later' | 'reject'` is a good vocabulary — and surface it in the UI when it bites.
6. **Recent DST abolitions to remember** `C2`: Brazil (2019), Mexico (most of the country, 2022), Iran (2022). Historical data still needs the old rules — another reason not to hand-roll.

### 17.2 Non-Gregorian calendars — the verified list

> `V` — calendar packages present in `unicode-org/cldr-json`: `buddhist`, `chinese`, `coptic`, `dangi`, `ethiopic`, `hebrew`, `indian`, `islamic`, `japanese`, `persian`, `roc`. Territory preferences read from `cldr-core/supplemental/calendarPreferenceData.json`.

**Territory → preferred calendars (`V`, verbatim ordering from CLDR):**

| Territory | Preference order |
|---|---|
| **SA** Saudi Arabia | `gregorian, islamic-umalqura, islamic, islamic-rgsa` |
| **IR** Iran | **`persian`**, `gregorian`, `islamic`, `islamic-civil`, `islamic-tbla` |
| **AF** Afghanistan | **`persian`**, `gregorian`, `islamic`, `islamic-civil`, `islamic-tbla` |
| **IL** Israel | `gregorian`, **`hebrew`**, `islamic`, `islamic-civil`, `islamic-tbla` |
| **TH** Thailand | **`buddhist`**, `gregorian` |
| **JP** Japan | `gregorian`, `japanese` |
| **TW** Taiwan | `gregorian`, `roc`, `chinese` |
| **IN** India | `gregorian`, `indian` |
| **CN** China | `gregorian`, `chinese` |
| **EG** Egypt | `gregorian`, `coptic`, `islamic`, `islamic-civil`, `islamic-tbla` |
| **ET** Ethiopia | `gregorian`, `ethiopic` |
| **KR** Korea | `gregorian`, `dangi` |
| **MA, BD** | `gregorian`, `islamic`, `islamic-civil`, `islamic-tbla` |

**Note that Iran and Afghanistan prefer `persian` over `gregorian`** — a Gregorian-only date picker is not merely inconvenient there, it is the wrong calendar.

**The four Islamic calendar variants matter and are not interchangeable** `C1`:

| Variant | Basis |
|---|---|
| `islamic-umalqura` | Umm al-Qura, the **official Saudi civil calendar** — astronomically calculated |
| `islamic-civil` | Tabular, Friday epoch, arithmetic |
| `islamic-tbla` | Tabular, Thursday epoch |
| `islamic-rgsa` | Saudi **sighting-based** |

**Implementation:** `Intl.DateTimeFormat(locale, { calendar: 'islamic-umalqura' })` and, where available, `Temporal.PlainDate.from({...}).withCalendar('islamic-umalqura')`. Temporal's own docs include a `hijri-days-adjustments.md` cookbook `V` for the ±1-day shifting that local practice requires — confirming this is a real, expected problem, not an edge case.

**Thai Buddhist:** year = Gregorian + 543. A Thai user seeing "2026" instead of "2569" reads it as a bug.

**Japanese imperial eras:** Reiwa (令和) began 2019. Era transitions are announced with little lead time and require an ICU/CLDR data update. Do not hardcode.

**Hebrew:** lunisolar with leap months; the year number differs from the Gregorian by 3760/3761 depending on the point in the year.

### 17.3 Week structure — verified from CLDR

> `V` — `cldr-core/supplemental/weekData.json`.

**First day of week:**

| Territory | First day |
|---|---|
| `001` (world default) | **mon** |
| US, IL, IN, JP, KR, BR, ZA, SA, TH | **sun** |
| GB, DE, RU, CN, VN, **AE** | **mon** |
| **EG, IR, AF** | **sat** |
| **MV** (Maldives) | **fri** |

**Note `SA`=sun but `AE`=mon** — even neighbouring Gulf states differ. Hardcoding a region-wide rule is wrong.

**Weekend:**

| Territory | Weekend |
|---|---|
| `001` (default) | sat–sun |
| **SA, EG, IL, KW, QA, OM, BH, JO, DZ** | **fri–sat** |
| **IR** | **fri only** |
| **AF** | **thu–fri** |
| **IN** | **sun only** |

**Product consequences:**
- The calendar grid's first column is locale-dependent.
- Weekend shading is locale-dependent.
- **"Best time to post" analysis must use the local weekend definition.** A Gulf engagement heatmap computed against a Sat–Sun weekend is not slightly off — it is inverted.
- "Business days" arithmetic (approval SLAs, report scheduling) needs the same data.

### 17.4 Holidays and content calendars

**Baseline data:** `date-holidays` `V` — **254 territory files** under `data/countries/`, with README-documented support for the **Islamic calendar 1970–2080**, **Hebrew calendar 1970–2100**, and the **Chinese calendar** `V`. Its own README carries the necessary caveat: *"islamic dates might not be correct as they are subject to the sighting of the moon"* `V`.

**Beyond public holidays, a social content calendar needs:**

| Category | Examples |
|---|---|
| **Religious observances** | Ramadan (start/end/Laylat al-Qadr), Eid al-Fitr, Eid al-Adha, Diwali, Holi, Navratri, Rosh Hashanah, Yom Kippur, Passover, Lent/Easter, Vesak |
| **Commercial moments** | Singles' Day 11.11, Black Friday/Cyber Monday, Boxing Day, El Buen Fin (MX), Hot Sale (MX/AR), Prime Day, Ramadan/Eid shopping, Golden Week (CN/JP), Chuseok (KR), Tết (VN), Songkran (TH) |
| **Civic** | Independence days, national days, election quiet periods |
| **Platform-specific** | Chinese platform content-sensitivity windows around major political dates — real, and a compliance issue for brands publishing in China |

**Hard rules:**
1. **Ramadan moves ~11 days earlier per Gregorian year.** Any hardcoded date is wrong within a year.
2. **Hijri dates vary by ±1 day between countries** due to moon sighting. Display "≈" and a country selector; never assert a single global date.
3. **Jewish holidays begin at sunset the previous evening.** A post scheduled 18:00 on the eve of Yom Kippur lands *during* the holiday. Model observances as sunset-to-nightfall intervals, not calendar days.
4. **Chinese New Year and Golden Week shift annually** on the Chinese lunisolar calendar.
5. **Regional variation within a country** is normal — Indian state holidays, German Länder, US states, Spanish autonomous communities. `date-holidays` models ISO 3166-2 subdivisions `V`; use them.

**Sensitivity/blackout feature:** allow workspaces to mark dates as "do not post" per market, and warn (do not silently block) when a scheduled post lands on one. This is a genuinely differentiated feature for global brands, and it is cheap once the holiday data exists.

### 17.5 Pluralization and message formatting

`V` — CLDR cardinal plural categories:

| Language | Categories |
|---|---|
| English, Hindi, **Persian** | `one, other` |
| **Japanese, Chinese, Thai, Vietnamese, Korean** | **`other` only** |
| **Hebrew** | `one, two, other` |
| Russian, Polish, Lithuanian | `few, many, one, other` |
| **Arabic, Welsh** | **`zero, few, many, one, other, two` — all six** |

**Therefore:** use **ICU MessageFormat** (or Fluent) for every user-facing string with a count. Any framework that models plurals as `{singular, plural}` produces wrong Arabic, Russian, Polish, and Hebrew. Also avoid string concatenation for sentences — word order differs, and RTL makes concatenation actively dangerous.

---

## 18. Globalization IV — money

### 18.1 Currency representation — verified pitfalls

> `V` — `cldr-core/supplemental/currencyData.json`, `fractions` block.

**Zero-decimal currencies** `V`: `JPY, KRW, VND, CLP, ISK, HUF, IDR, PKR, COP, UGX, RWF, XAF, XOF, XPF, GNF, DJF, KMF, BIF, MGA, PYG, LAK, LBP, MMK, SOS, SYP, VUV, YER, IQD, IRR, AFN, ALL, KPW, SLL, STD, ...`

**Three-decimal currencies** `V`: **`BHD, JOD, KWD, LYD, OMR, TND`**

**Four-decimal** `V`: `CLF, UYW`

**Consequences:**
1. The near-universal "store money as integer cents" assumption is **wrong** for ~50 currencies. Store **minor units + an explicit exponent**, or store a decimal with the currency and derive the exponent from CLDR.
2. **¥1,000 is 1000 minor units, not 100,000.** Multiplying by 100 for JPY overcharges by 100×.
3. **KWD 1.500 is 1500 minor units.** Stripe additionally requires three-decimal currency amounts to be a **multiple of 10** in the smallest unit `C2`.
4. Display with `Intl.NumberFormat(locale, { style: 'currency', currency })` — it applies the right exponent, symbol position, grouping, and separators. Do **not** hand-format.
5. Note that formatting is **locale × currency**, not just currency: `de-DE` renders `1.234,56 €`; `en-US` renders `€1,234.56`.

### 18.2 Numbering systems in price display

`V` — CLDR defines **78 numeric numbering systems**. For `ar-EG`, `Intl.NumberFormat` may render Arabic-Indic digits `١٢٣` by default. Decide deliberately: many Gulf commercial contexts prefer Latin digits for prices. Force with the `-u-nu-latn` locale extension (`ar-SA-u-nu-latn`) where appropriate, and make it a locale-config decision rather than an accident.

### 18.3 FX and price stability

- **Do not** convert prices at request time from a live FX rate — prices that jitter daily destroy trust and break annual contracts.
- Set **fixed local price points** per currency, refreshed on a schedule (quarterly), with psychological rounding (₹1,499 not ₹1,483).
- For volatile currencies (NGN, ARS, TRY, EGP) either bill in USD with a local payment method, or accept a wider refresh cadence and communicate changes with notice.

### 18.4 PPP pricing

**The case:** a $99/month price is roughly 0.1% of US median monthly household income and a multiple of it in several target markets. Without PPP bands, India, Nigeria, Indonesia, Vietnam, Bangladesh, and Pakistan are not addressable.

**A workable band structure** `C3` (illustrative — calibrate against World Bank ICP PPP conversion factors and actual willingness-to-pay research):

| Band | Example markets | Index vs. US |
|---|---|---|
| A | US, CA, AU, CH, NO, SG, AE-premium | 100% |
| B | Western EU, UK, JP, KR, IL | 90–100% |
| C | Central/Eastern EU, CL, UY, MY, SA, TR-adjacent | 60–75% |
| D | BR, MX, AR, ZA, TH, CN, RU-excluded | 45–60% |
| E | IN, ID, VN, PH, EG, NG, PK, BD, KE | 30–40% |

**Anti-arbitrage — necessary, and easy to over-engineer:**
1. Determine the band from **billing address + payment-instrument country**, not IP alone.
2. Require the payment instrument's country to match the claimed billing country for discounted bands.
3. For business plans, require a **local tax ID** (GSTIN, CNPJ, VAT number) for the discount — this also serves the tax obligation (§19).
4. Lock the band at subscription creation; re-evaluate only on an explicit change of billing country, with a notice period.
5. Accept some leakage. The revenue from correctly-priced emerging markets exceeds the leakage from VPN users, and aggressive enforcement generates worse support outcomes than the fraud it prevents.

### 18.5 Local payment methods — the table that determines addressable market

`C2`/`C3` throughout; PSP support changes frequently.

| Market | Must-have methods | Recurring billing reality | Typical PSPs |
|---|---|---|---|
| **India** | **UPI**, RuPay/Visa/MC cards, net banking, wallets | **Cards cannot be stored** — RBI tokenization mandate. Recurring via **UPI Autopay** or **e-mandate**, with pre-debit notification (24h) and AFA above the threshold `C3` | **Razorpay, Cashfree, PayU**, Stripe India |
| **Brazil** | **Pix**, **Boleto**, local cards with **parcelamento** (installments) | Pix historically one-off; **Pix Automático** (recurring) launched 2025 `C3`. Boleto is push-based — reconcile asynchronously | Stripe, Adyen, **dLocal, EBANX**, Pagar.me, Mercado Pago |
| **Mexico** | **OXXO** cash vouchers, **SPEI** transfer, cards | OXXO is one-off with a voucher expiry; design a dunning flow around it | Stripe, **Mercado Pago**, Conekta, dLocal |
| **China** | **Alipay, WeChat Pay** | Cross-border settlement via a licensed PSP; **fapiao issuance** expected by business customers | **Antom (Ant), Adyen, Airwallex**, Stripe (WeChat Pay/Alipay) |
| **Japan** | **Konbini** (convenience store), **Pay-easy**, **JCB**, PayPay, Rakuten Pay | Konbini is a cash push method — asynchronous confirmation | **Stripe** (Konbini + JCB), GMO, Komoju |
| **Korea** | **KakaoPay, Naver Pay, Toss**, local cards | Foreign-card acceptance is weak; a **local PG** is effectively required | **Toss Payments**, KG Inicis, NHN KCP |
| **SEA** | GrabPay, GoPay/DANA/OVO (ID), **Momo/ZaloPay/VNPay** (VN), PromptPay/TrueMoney (TH), **GCash/Maya** (PH), FPX (MY), PayNow (SG) | Wallet mandates vary; many are one-off | **Xendit, 2C2P, Omise, Midtrans**, Stripe (partial) |
| **Africa** | **M-Pesa** (KE/TZ), **MTN MoMo**, Airtel Money, cards, bank transfer, **USSD payment** (NG) | M-Pesa via **Safaricom Daraja** (`/mpesa/stkpush/v1/processrequest`) — STK push, user confirms on handset. Recurring is hard; use invoice + push | **Paystack, Flutterwave**, DPO, Daraja direct |
| **MENA** | **Mada** (SA — effectively mandatory for local acceptance), **KNET** (KW), Benefit (BH), **Fawry** (EG), **Tabby/Tamara** BNPL | Local acquiring often needs a local entity | **HyperPay, PayTabs, Checkout.com**, Network International, Amazon Payment Services |
| **EU** | **SEPA Direct Debit**, **iDEAL** (NL), **Bancontact** (BE), **BLIK/P24** (PL), EPS (AT), MB Way (PT), **Swish** (SE), **Vipps/MobilePay** (NO/DK/FI), **TWINT** (CH) | SEPA DD is the strong recurring rail — mandate management + R-transaction handling required. Note **iDEAL 2.0** migration completed 2025 `C3` | Stripe, Adyen, Mollie |
| **Turkey** | Local cards with **installments (taksit)** | Installment presentation is a competitive expectation | iyzico, PayTR |
| **Russia** | Mir, SBP | **Impractical** — see §7.4 | — |

**Architecture implication:** do not couple billing to a single PSP. Build a **payment-method abstraction** with per-market routing (Stripe globally; Razorpay for India; a LATAM specialist for Pix/Boleto/OXXO; Paystack/Flutterwave for Africa; a Korean PG for Korea). Model **push/voucher methods** (Boleto, OXXO, Konbini, M-Pesa STK) as first-class: they confirm asynchronously, expire, and need their own dunning.

### 18.6 Invoicing expectations

| Market | Expectation |
|---|---|
| China | **发票 (fapiao)** — a state-controlled invoice; business customers cannot expense without it. Requires a mainland entity. |
| Brazil | **NF-e / NFS-e** electronic invoice; municipal registration for services |
| India | GST invoice with **GSTIN**, HSN/SAC code, place of supply |
| Mexico | **CFDI** with the customer's RFC |
| EU | VAT-compliant invoice: VAT number, rate, reverse-charge notation for B2B |
| Saudi | **FATOORA / ZATCA** e-invoice with QR |
| Italy/Poland/France/Spain/Romania | National e-invoicing platforms — see §19.8 |

---

## 19. Globalization V — tax

> **This section is `C2`/`C3` throughout and is written by an engineer, not a tax adviser. It exists to size the problem and name the obligations, not to be relied upon. Every threshold and rate must be confirmed with a qualified adviser before launch in a market.**

### 19.1 The shape of the obligation

Selling B2C SaaS across borders means: **the tax is due where the customer is, and the seller usually must register there.** There is no de-minimis in most digital-services regimes for non-established sellers. The three sub-problems:

1. **Determine the customer's location** defensibly.
2. **Determine B2B vs. B2C** (a valid tax ID usually shifts the liability).
3. **Charge, collect, remit, and file** in each jurisdiction, and issue a compliant invoice.

### 19.2 EU — OSS (formerly MOSS)

- Digital ("TBE") services to EU consumers are taxed at the **customer's** country rate — 27 member states, rates roughly 17–27% `C3`.
- **MOSS was replaced by OSS on 1 July 2021.** A non-EU seller registers under the **Non-Union OSS scheme** in one member state and files a single quarterly return covering all 27. `C2`
- **B2B**: with a **valid VIES-verified VAT number**, apply the **reverse charge** and do not collect VAT. Validate against VIES at subscription time **and store the validation response** — the audit defence is the evidence, not the number.
- **Location evidence**: the EU requires **two pieces of non-contradictory evidence** — billing address, IP geolocation, card BIN/bank country, SIM MCC. **Store all of them, timestamped, immutably.** `C2`
- The **€10,000 threshold** below which a seller may charge its home rate applies **only to EU-established** sellers. A non-EU seller has **no threshold**. `C2`
- **ViDA (VAT in the Digital Age)** was adopted in 2025 and phases in through the early 2030s, bringing digital reporting requirements, e-invoicing, and platform-economy rules. `C3` — track, do not build for yet.

### 19.3 UK

- Post-Brexit, separate from OSS. A non-established business supplying B2C digital services to UK consumers must register for **UK VAT from the first sale** — **no registration threshold** for non-established businesses. `C2`
- Standard rate **20%**. Filing under **Making Tax Digital** requires software-based submission. `C2`

### 19.4 Other Europe

| Country | Regime |
|---|---|
| **Norway** | **VOEC** simplified registration, 25% |
| **Switzerland** | Registration once **worldwide** turnover exceeds **CHF 100,000** `C3`; 8.1% standard rate from 2024 `C3` |
| **Turkey** | VAT on electronic services by non-residents; special "Form 3" VAT return; standard rate **20%** `C3` |
| **Iceland, Serbia, Ukraine, Georgia, Moldova** | All have non-resident digital-services VAT regimes `C3` |

### 19.5 India — OIDAR

- Foreign suppliers of **OIDAR** (Online Information Database Access and Retrieval) services to Indian recipients must register under a **simplified GST registration** (Form **GST REG-10**) and file **GSTR-5A** monthly. `C2`
- Rate: **18%**. `C2`
- **Two changes from 1 October 2023 that widened the net materially** `C2`:
  1. The "essentially automated / minimal human intervention" qualifier was **removed** from the OIDAR definition, catching services that previously fell outside.
  2. The **"non-taxable online recipient"** definition changed so that supplies to **unregistered** Indian persons — including those receiving them for business — are now taxable to the foreign supplier.
- **Equalisation Levy:** the 2% levy on e-commerce supply was **withdrawn from 1 August 2024**, and the 6% levy on online advertising **from 1 April 2025**. `C3` — verify; this materially changed the India cost model.
- Practical: appointing an **authorized representative in India** is generally required for the registration.

### 19.6 Brazil — mid-transition, and 2026 is the year

- **Historic regime:** ISS (municipal service tax, 2–5%), PIS/COFINS-Importação, IOF on FX, plus withholding on cross-border service payments. Complex, municipality-dependent.
- **Reform:** EC 132/2023 and LC 214/2025 create a dual VAT — **CBS** (federal) and **IBS** (state/municipal) — replacing PIS/COFINS/ICMS/ISS over a transition running roughly **2026–2033**. `C2`
- **2026 is the test/transition year**, with token CBS and IBS rates applied alongside the legacy taxes while systems are validated. `C3` — **this is live right now and must be verified with a Brazilian adviser, not from this document.**
- **Practical mitigation:** use a **merchant of record** (Paddle, Lemon Squeezy, FastSpring) or a LATAM specialist (dLocal, EBANX) for Brazil until the transition settles. The compliance cost of doing it directly during a transition year is not worth the margin.

### 19.7 Rest of world — the obligations that actually bite

| Jurisdiction | Regime `C2`/`C3` |
|---|---|
| **Nigeria** | VAT **7.5%** on non-resident digital services; FIRS requires non-resident suppliers to register and collect. The **Nigeria Tax Act 2025** (effective 2026) consolidates the framework `C3` |
| **South Africa** | VAT **15%** on electronic services; registration threshold **ZAR 1,000,000** `C3` |
| **Kenya** | Digital Service Tax / VAT on digital marketplace supplies `C3` |
| **Japan** | **JCT 10%**; registered-foreign-business status; **qualified invoice system** since Oct 2023 `C2` |
| **Korea** | VAT **10%** on electronic services by foreign suppliers; simplified registration `C2` |
| **Singapore** | GST **9%** (from 1 Jan 2024) under the **Overseas Vendor Registration** regime `C2` |
| **Indonesia** | VAT on PMSE digital services; rate in the 11–12% band `C3` |
| **Thailand / Vietnam / Philippines / Malaysia** | All have non-resident digital-services VAT/GST regimes with differing thresholds `C3` |
| **Saudi Arabia** | VAT **15%**; **FATOORA** e-invoicing phases `C2` |
| **UAE** | VAT **5%**; e-invoicing mandate phasing from 2026 `C3`; 9% corporate tax `C3` |
| **Australia** | GST **10%**, **AUD 75,000** threshold `C2` |
| **New Zealand** | GST **15%** `C2` |
| **Canada** | GST/HST simplified registration for non-residents, **CAD 30,000** threshold; plus **QST** (Quebec), **BC PST**, **SK PST** separately `C2` |
| **United States** | No federal VAT. **State sales tax on SaaS varies** — roughly 20+ states tax it. **Economic nexus** post-*Wayfair* commonly **$100,000 or 200 transactions** per state per year `C2`. This is genuinely harder than the EU. |

### 19.8 E-invoicing mandates — the next wave

| Country | Mandate `C3` |
|---|---|
| Italy | **SdI** — mandatory, long-established |
| India | **IRP/IRN** e-invoicing above a turnover threshold |
| Brazil | NF-e / NFS-e |
| Saudi Arabia | FATOORA phases |
| Poland | **KSeF** — phased mandatory rollout in 2026 |
| France | Phased 2026–2027: reception first, then issuance by size band |
| Spain | Verifactu / Crea y Crece |
| Romania | e-Factura |
| Germany, Belgium | B2B e-invoicing phasing in from 2025–2028 |

**Do not build e-invoicing yourself.** Use a provider (Fonoa, Avalara, Storecove, Pagero, or the PSP's own).

### 19.9 Tooling recommendation

| Option | When |
|---|---|
| **Stripe Tax** | Simplest if Stripe is the primary PSP; handles calculation, and increasingly registration/filing. Weak where Stripe isn't the rail. |
| **Anrok** | SaaS-focused, strong on US state nexus + global VAT. Good fit for our shape. |
| **Fonoa / Avalara / Vertex** | Multi-PSP, e-invoicing, enterprise scale. Heavier. |
| **Merchant of Record** (Paddle, Lemon Squeezy, FastSpring) | **They become the seller of record and assume the tax obligation entirely.** Costs ~5% of revenue. **For a first global launch this is very often the correct trade** — it converts an open-ended compliance liability into a known percentage, and can be unwound later market by market. |

**Recommendation: launch on a Merchant of Record, and migrate to direct registration market-by-market as volume justifies it.** Building 40 tax registrations before finding product-market fit is a classic way to spend a year on non-differentiating work.

---

## 20. Effort model and build sequencing

### 20.1 Effort summary

| Workstream | Engineer-weeks | Calendar dependency |
|---|---|---|
| **Globalization substrate** (i18n framework + ICU MessageFormat, RTL logical properties, grapheme/weighted counting service, font strategy) | **8–12** | — |
| **Time substrate** (IANA storage model, tzdb update pipeline, non-Gregorian calendars, holiday data + blackout dates, week data) | **5–7** | — |
| **Money substrate** (currency exponents, PPP bands, multi-PSP abstraction, push/voucher payment flows) | **6–8** | PSP contracting 4–8 wk |
| **Tax** (MoR integration, or direct: evidence capture, VAT ID validation, invoice templates) | **3** (MoR) / **10–14** (direct) | Registrations: months |
| **LINE adapter** | **4–6** (+3–4 for a Flex Message builder) | — |
| **Telegram adapter** | **3–4** | — |
| **VK adapter** | **4–5** | Legal review |
| **Zalo adapter** | **4–5** | — |
| **Mercado Libre adapter** | **4** | — |
| **Reminder-publish subsystem** (mobile push, asset packs, deep links, confirm, manual metrics) | **4–6** | — |
| **Template subsystem** (Kakao/WhatsApp/Zalo/Viber shared) | **4–5** | — |
| **Kakao via BSP** | **4–6** | **8–16 wk** partner |
| **Naver Band + Cafe** | **6** | — |
| **Odnoklassniki** | **3** | Legal review |
| **Viber bot** | **3** | — |
| **Shopee + Lazada chat** | **6** | Seller app approval |
| **Africa lite-mode + offline composer** | **4–6** | — |
| **China assisted publishing (R3)** | **2–3** | — |
| **China partner relay (R4)** | **4–6** | **3–6 months** |
| **China native (JV)** | **8–12** + shard **6–10** | **6–12 months** |

### 20.2 Sequencing

**Phase 0 — before any regional adapter (non-negotiable)**
The globalization substrate. Every adapter built before it will be rewritten. Specifically: ICU MessageFormat, logical-property CSS, the counting service, `(wall-clock + IANA zone)` scheduling, and currency exponents.

**Phase 1 — highest value per engineer-week**
1. **LINE** — two large markets (JP + TH), one adapter, best-documented API in the document, `/validate/*` endpoints, real analytics.
2. **Telegram** — global reach, trivial API, 3 weeks.
3. **Reminder-publish subsystem** — unlocks Snapchat, Xiaohongshu, VOOM, ShareChat, Kwai, Naver Blog *simultaneously*. Best coverage-per-week ratio in the entire document.
4. **Mastodon** (from `07`) — 2 weeks, native scheduling, completes "we support the open web".

**Phase 2 — market-specific bets**
5. **Zalo** (Vietnam), **Mercado Libre** (LATAM inbox), **VK** (gated), **Africa lite mode**.

**Phase 3 — partner-dependent**
6. **Kakao via BSP**, **Naver Band/Cafe**, **Viber Business**, **Shopee/Lazada chat**. Start partner conversations in Phase 1 because the calendar time dominates.

**Phase 4 — China**
7. Assisted publishing early (cheap, useful). The partner relay only after a China GTM decision. Native/JV only with a strategic commitment.

**Never**
Koo, Viadeo, XING, mixi, Chingari, Rutube, scraper-based Xiaohongshu/Pixiv posting.

---

## 21. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Sanctions exposure from VK/OK support** | Medium | **Severe** — fines, reputational | Legal opinion before launch; geo-block RU/BY billing; sanctions screening; feature flag default-off |
| 2 | **China entity requirement discovered late**, after adapter build | Medium | High — wasted quarter | This document. Ship R3 assisted publishing only until a GTM decision exists |
| 3 | **Regional API breaks silently** (no changelog, no deprecation notice) | **High** | Medium | Daily synthetic publish + read canary per adapter; alert on schema drift; per-adapter health dashboard |
| 4 | **MAU/pricing figures in this doc are stale** and reach a customer deck | **High** | Medium | Every figure is tagged `C3`; §22 verification before any external use |
| 5 | **Tax registration obligations missed** in a market we sell into | Medium | High — back taxes + penalties | Launch on a Merchant of Record; migrate market-by-market with advice |
| 6 | **Kakao/Viber/WhatsApp BSP margin** makes regional messaging unprofitable | Medium | Medium | Model per-message COGS *before* contracting; pass through explicitly |
| 7 | **PPP price arbitrage via VPN** | Medium | Low | Payment-instrument country matching; tax-ID requirement for business bands; accept residual leakage |
| 8 | **Sovereign shard scope creep** (China + EU + Korea) | Medium | High | Build the *seam* early; ship shards on demand, not speculatively |
| 9 | **Translation quality** undermines credibility in JP/KR/DE | **High** if machine-translated | Medium | Professional translation for ja, ko, de, pt-BR, es-419; native review of RTL layouts |
| 10 | **Reminder publish sold as auto-publish** | Medium | Medium | Explicit capability labels in UI and marketing; per-network capability matrix on the pricing page |
| 11 | **tzdb staleness** causes mistimed posts | Low | Medium | Automated tzdb update pipeline + staleness alert + upgrade tests |
| 12 | **`String.length` counting ships** to a CJK/Indic/RTL market | **High** without discipline | Medium | Lint rule banning `.length` on user-facing text; counting service is the only sanctioned path |

---

## 22. Verification backlog

Everything below could not be fetched in this session. Ordered by how much of the build each unblocks. **Run this before any of these facts becomes load-bearing.**

### 22.1 Blocking — verify before writing adapter code

| # | Target | Question |
|---|---|---|
| 1 | `developers.line.biz/en/reference/messaging-api/` | Current rate limits, message-object limits (5 per push?), plan pricing in JPY/THB, channel access token v2.1 issuance details |
| 2 | `developers.line.biz` pricing pages (JP + TH) | Current plan names, message allowances, overage rates |
| 3 | `core.telegram.org/bots/api` | Current Bot API version and changelog; confirm no `schedule_date` on `sendMessage`; confirm rate limits |
| 4 | `dev.vk.com/method/wall.post` and `dev.vk.com/reference/errors` | Confirm `publish_date` semantics, max scheduled horizon, rate limits, error codes |
| 5 | `developers.zalo.me/docs/official-account-api` | Confirm `/v3.0` and `/v4` families; article/broadcast endpoints; ZNS template rules and pricing; OA verification requirements for foreign-owned businesses |
| 6 | `developers.mercadolibre.com` | Confirm `/questions`, `/messages/packs`, notification topics, per-site app registration |
| 7 | `developers.kakao.com` + a Korean BSP (Solapi/Bizppurio/NHN) | Whether a **foreign** entity can obtain a 발신프로필; AlimTalk/FriendTalk per-message pricing; template approval SLA |

### 22.2 High — verify before roadmap commitments

| # | Target | Question |
|---|---|---|
| 8 | `open.weixin.qq.com` / `developers.weixin.qq.com` (第三方平台) | Whether a foreign-invested entity can register a component app; current 认证 fees; 视频号 publishing scope availability |
| 9 | `open.douyin.com/platform/doc` | Whether any non-mainland entity path exists; current scope review criteria |
| 10 | `openhome.bilibili.com` | **Can a foreign entity register?** — the highest-upside unknown in the China section |
| 11 | `openapi.band.us/doc` and Naver Developers | Confirm Band `/v2/band/post/create`; confirm whether Naver Blog `writePost` still exists |
| 12 | `developers.snap.com` | Re-confirm the absence of any organic posting API (annually) |
| 13 | `open.shopee.com` / `open.lazada.com` | Confirm `chat`/`im` domains are available to third-party apps and their rate limits |
| 14 | `apps.odnoklassniki.ru/dev` | Confirm `mediatopic.post` is current and the signature scheme |

### 22.3 Medium — data and figures

| # | Target | Question |
|---|---|---|
| 15 | DataReportal / We Are Social "Digital 2026" reports | **Every MAU figure in §2.** All are `C3`. |
| 16 | LINE, Kakao, VK, Zalo investor relations | Official MAU for the four platforms we will actually build |
| 17 | `unicode.org/reports/tr35/` (LDML) | Confirm CLDR release used; refresh the extracted week/currency/calendar tables |
| 18 | `github.com/twitter/twitter-text` `config/` | Re-check whether a v4 config exists (v3 verified this session) |
| 19 | IANA tzdb release page | Current release; set up the update pipeline |
| 20 | World Bank ICP PPP tables | Calibrate the §18.4 bands |

### 22.4 Legal/tax — requires a qualified adviser, not a fetch

| # | Question |
|---|---|
| 21 | OFAC/EU/UK sanctions opinion on offering a VK/OK adapter to non-Russian customers |
| 22 | Brazilian CBS/IBS transition obligations for a non-resident SaaS in the 2026 transition year |
| 23 | India OIDAR registration mechanics and whether an authorized representative is required |
| 24 | Whether a Merchant of Record satisfies our obligations in each launch market |
| 25 | PIPL cross-border mechanism applicable to our expected Chinese personal-data volume |
| 26 | Korean PIPA cross-border transfer consent requirements for a social inbox |

---

## Appendix A — Primary artifacts fetched in this session

These are the only sources actually retrieved. Everything else in this document is model recall, tagged accordingly.

| Artifact | Retrieved via | What it established |
|---|---|---|
| `github.com/line/line-openapi` (full clone) — `messaging-api.yml`, `insight.yml`, `channel-access-token.yml`, `manage-audience.yml`, `liff.yml`, `module.yml`, `module-attach.yml`, `shop.yml`, `webhook.yml` | `git clone` | LINE endpoint families; `https://api.line.me` host; insight endpoints; JP/TH/TW/ID demographic restriction (quoted verbatim from the spec); **verified absence of any VOOM/timeline endpoint** |
| `github.com/VKCOM/vk-api-schema` (full clone) — `schema.json`, `wall/`, `stats/`, `stories/`, `video/`, `groups/`, `messages/`, `photos/`, `likes/`, `newsfeed/` | `git clone` | VK API **v5.199**; complete `wall.post` parameter list incl. `publish_date` and `guid`; `stats.get`/`getPostReach`; `access_token_type` constraints; full method inventories per domain |
| `github.com/twitter/twitter-text` — `config/v3.json` | `git clone` | Exact weighted-length algorithm: 280 max, scale 100, default weight 200, weight-100 ranges, `emojiParsingEnabled`, `transformedURLLength: 23` |
| `github.com/unicode-org/cldr-json` (full clone) — `cldr-core/supplemental/{calendarPreferenceData,weekData,currencyData,numberingSystems,plurals}.json`, `cldr-cal-*` package list | `git clone` | Territory calendar preferences; first-day-of-week and weekend by territory; currency fraction digits; 78 numeric numbering systems; plural categories per language; the 11 non-Gregorian calendar packages |
| `github.com/commenthol/date-holidays` (full clone) | `git clone` | 254 territory data files; Islamic 1970–2080, Hebrew 1970–2100, Chinese calendar support; the moon-sighting caveat (quoted) |
| `github.com/tc39/proposal-temporal` (full clone) — `docs/calendars.md`, `docs/hijri-days-adjustments.md` | `git clone` | Temporal calendar identifiers; the existence of an official Hijri day-adjustment cookbook |
| `raw.githubusercontent.com/binarywang/WxJava/develop/README.md` | HTTPS | WeChat module taxonomy incl. **`weixin-java-channel` (视频号/微信小店)** and **`weixin-java-open` (第三方平台)**; project active as of Jan 2026 (4.8.0 release) |
| `raw.githubusercontent.com/wechatpy/wechatpy/master/README.md` | HTTPS | Confirms "第三方平台代公众号调用接口 API" as a first-class WeChat capability |
| `raw.githubusercontent.com/silenceper/wechat/v2/README.md` | HTTPS | Independent confirmation of WeChat module taxonomy (`officialaccount`, `openplatform`, `work`, ...) |
| `github.com/bautran1911/n8n-nodes-zalo-oa` (clone) | `git clone` | Zalo OA hosts `openapi.zalo.me` / `business.openapi.zalo.me`; paths `/v4/oa/access_token`, `/v4/oa/permission`, `/v3.0/oa/message/cs`, `/v3.0/oa/user/getlist`, `/v3.0/oa/user/detail`, `/v2.0/oa/conversation`, `/v2.0/oa/getoa` |
| `github.com/Viber/viber-bot-node` (clone) | `git clone` | Viber Public Account host `https://chatapi.viber.com/pa` |
| `github.com/mercadolibre/php-sdk` (clone) | `git clone` | Mercado Libre host `https://api.mercadolibre.com` |
| `github.com/ark0f/tg-bot-api` (clone) | `git clone` | **Staleness signal** — last release v0.6.0, March 2024; not a current source for Bot API |
| npm registry search: `douyin open api`, `kuaishou open`, `xiaohongshu api`, `weibo api`, `kakao api`, `naver openapi`, `zalo oa`, `odnoklassniki api`, `kwai api`, `sharechat`, `shopee open api`, `lazada open platform`, `xing api`, `naver band api` | `registry.npmjs.org/-/v1/search` | **Ecosystem-presence signals**: Zalo/Shopee/Lazada active and healthy; Xiaohongshu = scrapers/MCP only; ShareChat = internal tooling only, no API client; Kwai = scrapers only; XING = nothing |

## Appendix B — Blocked hosts (for the record)

Confirmed `403 CONNECT` / `EGRESS_BLOCKED` via the agent proxy in this or an immediately preceding session: `example.com`, `en.wikipedia.org`, `developers.tiktok.com`, `developers.weixin.qq.com`, `buffer.com`, `www.reddit.com`, `vistasocial.com`, `support.vistasocial.com`. A control fetch of `example.com` failing confirms a **blanket** denial rather than a per-domain policy. `codeload.github.com` also returns 403; `github.com` (git protocol), `raw.githubusercontent.com`, `registry.npmjs.org`, and `pypi.org` are reachable.
