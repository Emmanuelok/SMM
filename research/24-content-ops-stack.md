# 24 — The Content Operations Stack

**The tabs that sit next to the scheduler, and which of them we should absorb**

Research date: **2026-08-12**
Scope: Canva, Adobe Express, Figma, Notion, Airtable, ClickUp/Asana/Monday/Trello, Frame.io, Filestage,
Dropbox/Drive/OneDrive/Box, Slack/Teams, Zapier/Make/n8n, Google Sheets bulk scheduling, Miro,
Brandfolder/Bynder/Frontify.

---

## 0. READ THIS FIRST — research conditions and verification integrity

This session ran under **severe network restriction**. Both of the normal research channels were unavailable:

| Channel | Status | Effect |
|---|---|---|
| `WebSearch` | **Exhausted** — 200/200 calls consumed by earlier sessions before this task started | No search-driven discovery, no G2/Capterra/Trustpilot/Reddit/X mining |
| `WebFetch` / `curl` to product sites | **Blocked by the egress proxy** for every vendor domain tested — `canva.com`, `notion.com`, `airtable.com`, `zapier.com`, `make.com`, `figma.com`, `frame.io`, `filestage.io`, `clickup.com`, `asana.com`, `monday.com`, `trello.com`, `dropbox.com`, `box.com`, `slack.com`, `miro.com`, `bynder.com`, `brandfolder.com`, `frontify.com`, `developer.adobe.com`, `reddit.com`, `wikipedia.org` | **No product pages, no pricing pages, no help centres, no changelogs, no review sites** |
| `github.com` / `raw.githubusercontent.com` / `registry.npmjs.org` | **Reachable** (git clone works for arbitrary public repos) | This became the entire evidence base |

**What this means for how you read this document.** Everything below is built from *primary machine-readable
artefacts* — official OpenAPI specifications, official SDK type definitions (`.d.ts`), official starter-kit
source code, official documentation repositories, and a 2,053-workflow corpus of real community automations.
That is, in several respects, a *better* source than a marketing page: an OpenAPI spec cannot exaggerate,
and a `.d.ts` file is the literal contract.

But it has hard blind spots, and I have marked every one of them rather than guessing:

- **No pricing page was fetched.** Prices here come from a third-party API catalogue (`api-evangelist`)
  whose plan files were generated **2026-05-04 to 2026-07-22** and derived from the vendors' pricing pages
  at that time. They are labelled `[CAT]` and should be re-checked before any decision rests on them.
- **No user reviews were reachable.** The only genuine practitioner criticism I could obtain is embedded in
  the n8n workflow corpus (sticky-note annotations written by the workflow authors themselves). Where a
  section says "criticism" and cites nothing, it says **UNVERIFIED**.
- **Filestage has no reachable public artefact at all.** It is marked UNVERIFIED throughout.
- **Frame.io V4** could not be verified. The only obtainable client is the V2 Python SDK, last committed
  **2024-06-11** — that is two years stale and predates the V4 rewrite. Treat Frame.io mechanics as
  *directionally right, version-uncertain*.

### Confidence legend

| Mark | Meaning |
|---|---|
| `[V]` | **Verified from a primary machine-readable artefact** obtained in this session — OpenAPI spec, `.d.ts`, SDK source, docs repo, workflow JSON. Quoted values are literal. |
| `[CAT]` | From the `api-evangelist` API catalogue mirrors. Provider-derived, but second-hand and dated. Date given each time. |
| `[X]` | Cross-referenced against this project's own earlier research files (`01`–`23`). |
| `[U]` | **UNVERIFIED** — could not be checked in this session. Do not treat as fact. |
| `[I]` | Inference/analysis by me, clearly reasoned from `[V]` facts. |

---

## 1. Executive summary — the fourteen findings that matter

1. **Canva has already built the door for us, and almost nobody has walked through it.** `[V]`
   The Canva Apps SDK ships a **Content Publisher Intent** (`@canva/intents/content`, v2.6.0) that lets a
   third-party app register as a *native publish destination inside Canva's own publish flow* — with its
   own settings panel, its own live preview pane, its own media-format contract, and its own
   `publishContent` handler. Canva's own type documentation uses **Instagram** as the worked example
   (`fileCount: { min: 1, max: 10 }`, `aspectRatio: { min: 0.8, max: 1.91 }`), and the `PublishSettings`
   docstring explicitly lists **"Scheduling information"** as something the app should store. This is not a
   scraped integration — it is Canva inviting a scheduler to be the publish button. **This is the single
   highest-leverage integration available to us anywhere in the market.**

2. **Canva's server-side API cannot schedule anything.** `[V]` The Connect API (spec version
   `2024-06-18`, servers `https://api.canva.com/rest`) has 54 documented operations across 17 tags —
   `asset`, `autofill`, `brand_template`, `comment`, `design`, `design_import`, `export`, `folder`, `merge`,
   `resize`, `analytics`, and more — and **not one scheduling or publishing endpoint**. The Content Planner
   is a UI-only surface with no public API. Anything that needs to move a Canva design onto a calendar must
   go through export → download → upload, or through an in-editor app.

3. **The design→scheduler handoff is a file-copy, and every file-copy loses metadata.** `[V]`
   Canva exports `png|jpg|pdf|pptx|gif|mp4|html_bundle|html_standalone|csv`; Adobe Express renders
   `jpg|png|mp4|pdf|pptx`; Figma renders `jpg|png|svg|pdf` **and no video at all**. None of the three
   carries a caption, a link, a UTM, an alt-text string, a brand-approval state, a version pointer, or a
   scheduled time across the boundary. The handoff is a JPEG and a human's clipboard.

4. **Canva has no social-media preset design types in its API.** `[V]` `PresetDesignTypeName` is an enum of
   exactly four values: `doc`, `email`, `presentation`, `whiteboard`. To create an Instagram-sized design
   programmatically you must pass `{ type: 'custom', width, height }` and know the numbers yourself. Any
   integration that wants "make me a Reel-sized design" has to carry its own platform-spec table. **We
   already have that table; Canva does not expose one.**

5. **Canva's `POST /v1/resizes` is Magic Resize as an API** `[V]` — one design in, an arbitrary
   `{width, height}` out, as an async job. That is the single most valuable Canva endpoint for a social
   tool: it converts "I made a 1:1" into "I now have 4:5, 9:16 and 1.91:1" without a designer. Rate-limited
   to **20 creates per client-user** (and 120 polls). Nobody in the SMM category is using this.

6. **What people actually build in automation tools is: a spreadsheet or a database, a folder of media, an
   LLM, and a publish call.** `[V]` Across 2,053 real community n8n workflows, **409 touch a social
   platform**, and of those **128 combine a content-ops tool with publishing**. The frequency table is
   unambiguous: **Google Sheets 48, Google Drive 39, Airtable 23, Slack 17, Notion 6**, Baserow 3,
   Dropbox 3, NocoDB 2, OneDrive 2, Monday 1. Sheets and Drive are the *actual* content ops stack for the
   long tail, not the work-management suites.

7. **Nobody automates Buffer or Hootsuite. They automate `upload-post`, `blotato` and raw Graph API.** `[V]`
   In the same corpus: **zero** references to `api.buffer.com`, **zero** to Hootsuite, **zero** to Frame.io
   or Filestage. There are 6 workflows calling `api.upload-post.com`, 4 calling `backend.blotato.com/v2`,
   and 2,119 raw `httpRequest` nodes. The automation-native buyer has already routed around the incumbent
   schedulers. `[X]` matches `05-competitors-dev-oss.md`.

8. **The canonical automation is a literal feature request.** `[V]` Template *"google drive to instagram,
   tiktok and youtube"*: Google Drive folder trigger → read video → OpenAI transcribe → OpenAI generate
   per-platform description → three `POST api.upload-post.com/api/upload` calls → Telegram on error. That
   is one product feature — **"watch a cloud folder, auto-caption, auto-publish, tell me if it breaks"** —
   reimplemented by hand because no scheduler ships it.

9. **The second canonical automation is "my calendar lives in Notion/Airtable/Sheets, publish from it and
   write the status back."** `[V]` Template *"Notion to Linkedin"*: daily schedule trigger → query Notion
   database filtered to today → fetch page blocks → format → download image → publish → **update post status
   in the Notion database**. The write-back is the part every scheduler misses: people want the source of
   truth to stay in their database, with the scheduler as an executor.

10. **A DAM gives brand teams five things no scheduler's "media library" has.** `[V]` From Bynder's
    20-surface API: **structured metaproperties with controlled option lists** (not free-text tags),
    **per-metaproperty access control** (`/api/1/content/access`), **derivative presets** (one master, many
    auto-generated renditions), **quarantine with a review status** (assets cannot enter the library until
    approved), and **per-asset analytics** (`/v7/analytics/api/v1/asset/{id}` events, downloads, views).
    Add **automation rules** (`/automations/triggers|conditions|actions|rules`) and **workflow campaigns and
    jobs**. A scheduler media library is a folder with tags.

11. **Frame.io's approval mechanics have no equivalent anywhere in social.** `[V]` `POST
    /assets/{id}/comments` takes `{ text, timestamp, annotation }` — a comment bound to a **frame** and to a
    **serialized drawing on that frame**. `POST /assets/{target_asset_id}/version` creates a **version
    stack**, so v4 replaces v3 in place and the comment history follows. `POST
    /projects/{id}/review_links` mints a **seatless external reviewer URL** with `password`, `expires_at`
    and `is_active`. Social tools have: a comment box, and an invite that costs a seat.

12. **Frontify has shipped a hosted MCP server with nine scoped permission packs.** `[CAT 2026-07-19]`
    `https://mcp.frontify-integrations.com/` with packs `admin`, `discovery`, `collaboration`,
    `asset-organization`, `asset-creation`, `creative-automation`, `workflow-automation`, `brand-admin`,
    `brand-portal`, authenticating via MCP OAuth (CIMD + DCR). A DAM vendor has beaten every social tool to
    agentic asset access, and has done the *hard* part — scoping — properly. This is the pattern to copy.

13. **Adobe Express has renditions but no publish intent.** `[V]` `createRenditions()` supports
    `jpg|png|mp4|pdf|pptx`, MP4 up to `uhd2160p` with configurable `FrameRate`/`BitRate`, plus OAuth 2.0
    PKCE for third-party auth. But there is **no Content-Publisher-equivalent**: an Express add-on is a side
    panel, not a registered destination. Express is a *worse* distribution surface than Canva by exactly one
    API.

14. **Approval is the feature the whole stack is improvising.** `[V]` 20 of 2,053 n8n workflows use
    `sendAndWait` human-in-the-loop nodes; the biggest social template in the corpus routes through a
    **Gmail approval email** with an `Is Approved?` branch before it will publish. People are gluing
    approval into automation platforms because the schedulers' approval is single-stage, seat-gated, and
    invisible to the reviewer's actual inbox. `[X]` `20-buffer-teardown.md` records Buffer's approvals as
    single-stage.

---

## 2. Canva — the largest single opportunity in this document

Canva is simultaneously the biggest strategic threat to a scheduler (it has ~200M+ MAU `[U]` and its own
Content Planner) and the biggest distribution opportunity (it has built a formal publish-destination API and
almost nobody occupies it). This section is the deepest in the document because the evidence quality is the
highest.

### 2.1 Sources and freshness

| Artefact | How obtained | Freshness |
|---|---|---|
| `canva-sdks/canva-connect-api-starter-kit` — `openapi/spec.yml`, 12,189 lines | `git clone` | Repo HEAD **2026-07-30**; spec `info.version: 2024-06-18` |
| `canva-sdks/canva-apps-sdk-starter-kit` | `git clone` | CHANGELOG latest entry **2026-08-06** |
| `@canva/intents@2.6.0` type definitions | npm registry tarball | Published version 2.6.0 |
| `@canva/design` | npm registry | latest **2.11.0** (starter kit pins `^2.10.1`) |
| `@canva/asset` | npm registry | latest **2.3.0** |

**Staleness flag:** the OpenAPI `info.version` string is `2024-06-18`, but the starter-kit CHANGELOG records
`Refreshed openapi/spec.yml to be based on the latest Connect API` on **2026-05-07** and a
`npm run openapi:download` script added **2026-07-30**. So the *content* is current to mid-2026; the version
string is Canva's API-version pin, not a staleness signal. `[V]`

### 2.2 The Canva Connect API — full surface

Base URL `https://api.canva.com/rest`. Tags declared in the spec: `brands`, `analytics`, `app`, `asset`,
`autofill`, `brand_template`, `comment`, `connect`, `design`, `design_import`, `export`, `folder`, `merge`,
`oauth`, `oidc`, `resize`, `user`. `[V]`

| Domain | Endpoints `[V]` | Rate limit (per client-user) `[V]` | What it means for us |
|---|---|---|---|
| **Assets** | `GET/PATCH/DELETE /v1/assets/{assetId}`; `POST /v1/asset-uploads` + `GET .../{jobId}`; `POST /v1/url-asset-uploads` + `GET .../{jobId}` | GET 100 · PATCH/DELETE/upload **30** · job poll 180 | Push our media *into* Canva, or pull theirs out. Upload is async job-based. |
| **Designs** | `GET/POST /v1/designs`; `GET /v1/designs/{id}`; `GET .../pages`; `GET .../export-formats`; `GET .../dataset` | list/get 100 · **create 20** | `GET /export-formats` is the underrated one — ask Canva which formats a given design supports before offering them. |
| **Export** | `POST /v1/exports` + `GET /v1/exports/{exportId}`; `POST /v1/print-partner/exports` | **create 20** · poll 120 | The handoff. Async. See §2.3. |
| **Resize** | `POST /v1/resizes` + `GET /v1/resizes/{jobId}` | **create 20** · poll 120 | **Magic Resize as an API.** See §2.4. |
| **Merge** | `POST /v1/merges` + `GET /v1/merges/{jobId}` | 100 / 100 | Insert/move/delete pages across designs. `create_new_design` or `modify_existing_design`; **max 500 operations**, min 1. |
| **Autofill** | `POST /v1/autofills` + `GET /v1/autofills/{jobId}` | 60 / 60 | Bulk Create over the API. Fills a brand template from a dataset. |
| **Brand templates** | `GET /v1/brand-templates`; `POST /v1/brand-templates` (publish a design as a template); `GET /v1/brand-templates/{id}`; `GET .../dataset` | list/get 100 · **publish 20** | The governance surface. Dataset fields typed `image`, `text`, `chart`. |
| **Folders** | `GET/PATCH/DELETE /v1/folders/{id}`; `GET .../items`; `POST /v1/folders`; `POST /v1/folders/move` | get/items 100 · mutate 20 · move 100 | Canva's own asset organisation. |
| **Comments** | `POST /v1/comments`; `POST /v1/designs/{id}/comments`; `GET/POST .../{threadId}/replies`; `GET .../{threadId}`; `GET .../replies/{replyId}` | read 100 · **write 20** (thread create 100) | Threads + replies. No annotation coordinates exposed. |
| **Design import** | `POST /v1/imports` + `GET /v1/imports/{jobId}`; `POST /v1/url-imports` + `GET .../{jobId}` | create 20 · poll 120 | Push a PDF/PPTX/etc. *into* Canva as a design. |
| **Design analytics** *(preview)* | `GET /v1/designs/{id}/analytics`; `.../viewers`; `.../views-over-time`; `POST .../page-views`; `GET .../links` | 100 each | Marked **preview** in the spec, with an explicit warning: *"There might be unannounced breaking changes… Public integrations that use preview APIs will not pass the review process."* `[V]` |
| **Print partner** | `POST /v1/print-partner/designs`; `GET /v1/print-partner/designs/{id}`; `POST /v1/print-partner/exports` | 20 / 100 / 20 | Irrelevant to social; relevant to the "Canva is a commerce funnel" thesis. |
| **Identity** | `GET /v1/users/me`; `/me/capabilities`; `/me/profile`; `GET /v1/oidc/userinfo`; `GET /v1/oidc/jwks`; `GET /v1/apps/{appId}/jwks`; `GET /v1/connect/keys` | **10** each (userinfo 10) | Note the very tight 10/min on identity. Cache aggressively. |
| **OAuth** | `POST /v1/oauth/token`; `/oauth/introspect`; `/oauth/revoke` | — | Standard. `authorizationUrl: https://www.canva.com/api/oauth/authorize` |

**Notable absences `[V]`:**
- **No scheduling, publishing, calendar, or Content Planner endpoints whatsoever.**
- **No webhook management endpoints** — but the scope `collaboration:event` exists and is documented as
  *"Receive webhook notifications about events relevant to the user."* Webhooks are therefore configured in
  the Developer Portal, not via API. `[V]` + `[I]`
- The tag `brands` ("Allow management of brands") is declared but **no `/v1/brands*` path appears in the
  public spec** — likely private/preview. `[V]`

### 2.3 Export: the exact contract of the handoff

`ExportFormat` is a discriminated union on `type` with nine members `[V]`:

| Format | Key options `[V]` | Notes |
|---|---|---|
| `png` | `height` / `width` (**min 40, max 25000**), `lossless`, `as_single_image`, `export_quality` | *"If the user is on the Canva Free plan, the export height and width for a fixed-dimension design can't be upscaled by more than a factor of `1.125`."* — a **plan-gated export ceiling** that will silently degrade an integration for free users. |
| `jpg` | quality, dimensions | |
| `mp4` | **`quality` required** (`Mp4ExportQuality`), `pages[]` | Video export requires an explicit quality choice; no default. |
| `gif` | pages | |
| `pdf` | paper size optional | |
| `pptx` | — | |
| `html_bundle` | `pages` — *"Currently only a single page can be exported"* | Email designs only. |
| `html_standalone` | — | Email designs. |
| `csv` | — | |

Dimension semantics, quoted `[V]`: *"If only one of height or width is specified, then the image is scaled to
match that dimension, respecting the design's aspect ratio. If both the height and width are specified, but
the values don't match the design's aspect ratio, **the export defaults to the larger dimension**."*

**Why this matters:** a naive integration that asks for 1080×1350 from a 1:1 design will get a 1350×1350
image, not a cropped 4:5. You must resize first (§2.4), then export. This is the exact failure mode that
produces "why is my Instagram post letterboxed" support tickets.

### 2.4 `POST /v1/resizes` — the most under-exploited endpoint in the category

Request `[V]`:

```json
{ "design_id": "DAGirp_1ZUA",
  "design_type": { "type": "custom", "width": 1000, "height": 1500 } }
```

Async job; poll `GET /v1/resizes/{jobId}`. Documented error cases include `unsupported_design_type`,
`invalid_design_type`, and a **`429` with a `feature_quota_exceeded` example** — i.e. resize is quota'd
beyond the plain rate limit. `[V]`

`PresetDesignTypeName` — the only named presets — is `doc | email | presentation | whiteboard`. `[V]`
There is **no `instagram_post`, no `reel`, no `story`, no `linkedin_post`**. Every social dimension must be
supplied as a custom `{width, height}`.

`[I]` **Product implication.** "One design → every platform aspect ratio" is a one-afternoon feature for us
and a genuine capability nobody in social ships: take the user's Canva design ID, fire N resize jobs against
our own platform-spec table (which we already maintain for the composer), export each, and populate the
per-network variants of a single post. The design tool does the rendering; we own the specification. It also
neatly inverts the usual dependency — Canva becomes our renderer rather than our competitor's front door.

### 2.5 OAuth scopes — exactly what we can ask for

`[V]` Full scope list from `securitySchemes.oauthAuthCode`:

| Scope | Description (verbatim) |
|---|---|
| `design:content:read` | View the contents of the user's designs. |
| `design:content:write` | Create designs on the user's behalf. |
| `design:meta:read` | View the metadata of the user's designs. |
| `folder:read` | View the metadata and contents of the user's folders, including their **Projects** folder. |
| `folder:write` | Add, move, or remove the user's folders… edit folder metadata. |
| `folder:permission:write` | Set, update, or remove permissions assigned to the user's folders. |
| `asset:read` / `asset:write` | View / upload, update, delete assets. |
| `comment:read` / `comment:write` | View / create comments and replies on the user's designs. |
| `collaboration:event` | Receive webhook notifications about events relevant to the user. |
| `brandtemplate:meta:read` | View the metadata of the brand templates associated with the user's brand. |
| `brandtemplate:content:read` | Read the content of the brand templates. |
| `brandtemplate:content:write` | Publish brand templates. |
| `profile:read` | Read a user's profile and account information. |
| `openid` / `profile` / `email` | OIDC. |

Note there is **no `schedule:*` scope**. `[V]` Confirms §1.2.

### 2.6 The Canva Apps SDK — and the Content Publisher Intent

This is the strategic centre of the whole document.

**Package surface `[V]`** (starter-kit `package.json`, HEAD 2026-08-06):
`@canva/design ^2.10.1` · `@canva/asset ^2.3.0` · `@canva/intents ^2.6.0` · `@canva/platform ^2.2.2` ·
`@canva/user ^2.2.0` · `@canva/error ^2.2.1` · `@canva/app-ui-kit ^5.14.0` · `@canva/app-i18n-kit ^1.3.0` ·
`@canva/app-hooks ^0.0.0-beta.4` · `@canva/app-middleware ^0.0.0-beta.8` · `@canva/cli ^2.0.0` ·
`@canva/app-eslint-plugin ^1.0.0`.

**Intents available `[V]`** (`@canva/intents` subpath exports):

| Intent | Entry point | Purpose |
|---|---|---|
| **Content Publisher** | `@canva/intents/content` → `prepareContentPublisher()` | **Register as a publish destination in Canva's publish flow.** |
| **Data Connector** | `@canva/intents/data` → `prepareDataConnector()` | Feed an external dataset into Bulk Create. |
| **Design Editor** | `@canva/intents/design` → `prepareDesignEditor()` | Side-panel editing app. |
| `asset`, `test` | `@canva/intents/asset`, `/test` | Support surfaces (no public exports in 2.6.0). |

#### 2.6.1 Content Publisher Intent — the exact contract

Four callbacks `[V]`:

```ts
const contentPublisher: ContentPublisherIntent = {
  getPublishConfiguration,  // declare output types + media requirements
  renderSettingsUi,         // your caption/settings panel, inside Canva
  renderPreviewUi,          // your live post preview, inside Canva
  publishContent,           // receive rendered files, publish, return IDs
};
prepareContentPublisher(contentPublisher);
```

**`getPublishConfiguration` → `outputTypes[]`.** Canva auto-renders a dropdown when more than one output
type is declared. Each output type has `id`, `displayName`, and `mediaSlots[]`. `[V]`

**`MediaSlot` `[V]`:**

```ts
type MediaSlot = {
  id: string;
  displayName: string;
  fileCount?: ValueRange;                  // {exact} | {min} | {max} | {min,max}
  accepts: {
    image?: ImageRequirement;              // jpg | png(+allowTransparentBackground), aspectRatio?: ValueRange
    video?: VideoRequirement;              // format 'mp4', aspectRatio?, durationMs?: ValueRange
    document?: DocumentRequirement;        // format 'pdf_standard', size: DocumentSize
    email?: EmailRequirement;              // 'html_bundle' | 'html_standalone'
  };
};
```

`PublishFileFormat = 'png' | 'jpg' | 'mp4' | 'pdf_standard' | 'html_bundle' | 'html_standalone'` `[V]`

**Canva's own example in the type docs is Instagram `[V]` — quoted verbatim:**

```ts
outputTypes: [{
  id: 'instagram_post',
  displayName: 'Instagram Post',
  mediaSlots: [{
    id: 'main_image', displayName: 'Post Image',
    fileCount: { min: 1, max: 10 },
    accepts: { image: { format: 'jpg', aspectRatio: { min: 0.8, max: 1.91 } } }
  }]
}]
```

The starter-kit example uses `aspectRatio: { min: 4/5, max: 1.91/1 }` and comments it
*"Social media post aspect ratio range (portrait to landscape)."* `[V]`

**Settings.** `renderSettingsUi` receives `updatePublishSettings({ publishRef, validityState })`.
`publishRef` is an **opaque string, maximum 32KB**, serialising whatever the app needs. Canva's docstring
lists what belongs in it `[V]`: *"Captions or descriptions · Tags or hashtags · Privacy settings · Publishing
destination (account, page, etc.) · **Scheduling information**."*
`PublishRefValidityState = 'valid' | 'invalid_missing_required_fields' | 'invalid_authentication_required'` —
Canva enables/disables its own Publish button from this. `[V]`

**Preview.** `renderPreviewUi` gets `registerOnPreviewChange` and a `PreviewMedia[]` stream with a
lifecycle `loading → thumbnail → upgrading → ready`, plus `requestPreviewUpgrade` so video/document previews
load full fidelity only on demand. Canva's comment: *"preview UI is more flexible to align with your
platform's design system, so it is not constrained to the Canva design system."* `[V]` — **we may render our
own brand's post preview inside Canva.**

**Publish.** `publishContent({ publishRef, outputType, outputMedia })` where each `OutputMedia.files[]` has
`{ format, url, contentMetadata }` and `contentMetadata` is a `DesignContentMetadata` carrying
**`designToken` (a signed JWT containing the design id)**, `title`, and `pages[] {pageId, pageNumber}`. `[V]`

Return either:
- `{ status: 'completed', externalId, externalUrl }` — Canva then links the user to the live post; or
- `AppError { status:'app_error', message, localizedMessageId?, httpCode?, appDefinedPayload?, errorCause? }`
  where `errorCause ∈ 'invalid_selection' | 'invalid_format'` renders **near the offending Canva UI
  component**; or `{ status: 'remote_request_failed' }`. `[V]`

Canva's own suggested error copy in the docstring: *"You have reached your monthly publish limit. Please
upgrade your plan."* `[V]` — i.e. Canva expects the publisher app to enforce and surface its own
subscription limits inside Canva's UI.

`[I]` **This is the whole ballgame.** A Content Publisher app means: the user finishes a design, hits
Publish, sees *our* channel picker and *our* caption editor and *our* Instagram preview, and the post lands
in *our* queue with a signed design token we can use to re-open the design later for edits or resizes. The
acquisition cost is a Canva app review. Nothing else in this document comes close on leverage-per-unit-work.

**Review bar `[V]`** — from the example README, production apps must have real API auth, rate limiting,
comprehensive error handling, platform-specific validation (caption length, aspect ratio), full i18n via
`@canva/app-i18n-kit`, restrictive CORS, no `console` logging, and must call `prepareContentPublisher` from
`src/intents/content_publisher/index.tsx`. Non-trivial but entirely ordinary.

#### 2.6.2 Data Connector Intent — Bulk Create from our data

`prepareDataConnector()` with `getDataTable` returning a `DataTable` constrained by a Canva-supplied
`DataTableLimit { row: number, column: number }` (values are runtime-supplied, not fixed in the type). Cell
types include string, number, boolean, date, **image upload, video upload, and `MediaCollectionDataTableCell`**.
`[V]`

Media constraints for data-connector uploads `[V]`: URL must be **HTTPS**, return **200**, correct
`Content-Type`, be publicly accessible (no localhost), **must not redirect**, must not contain an IP address,
**max length 4096 chars**, no whitespace, none of `> < { } ^` or backticks, and **maximum file size 1000MB
(1GB)** for video.

`[I]` A "publish your content calendar into Canva Bulk Create" connector is the mirror image of the publisher
intent: our calendar rows become their bulk-generated designs. Cheap, and it makes our calendar the input to
their factory.

#### 2.6.3 The DAM Intent pattern already exists

`examples/assets_and_media/digital_asset_management` demonstrates *"how to integrate with external digital
asset management systems using `SearchableListView`… browsing, searching, and importing assets from
third-party platforms while supporting design export."* `[V]`

`[I]` If we build an asset library worth the name (§12.6), this is the second Canva app: our library, browsable
from inside the Canva editor.

### 2.7 Canva Content Planner — what I could not verify

`[U]` **Everything.** `canva.com` is egress-blocked; there is no Content Planner surface in the Connect API,
the Apps SDK, or the developer starter kits. I cannot confirm: which networks it supports, whether it does
first comment / threads / carousels / Reels, queue vs. explicit-time scheduling, whether it has approvals,
analytics, or per-network preview, what plans gate it, or whether it publishes natively vs. by reminder.

`[X]` Our own `12-analytics-listening-gtm.md` asserts *"Canva's own scheduling is limited"* and rates the
Canva Apps marketplace as the **highest-yield distribution channel available**, with low competitive density.
That judgement is consistent with everything verified here — Canva built a *publisher extension point*
rather than a full publishing product, which is what a company does when it wants partners to fill the gap.

**Action:** re-verify Content Planner from `canva.com/content-planner` and the Canva help centre the moment
egress allows. It is the single most important unverified fact in this document.

### 2.8 Where the Canva handoff breaks today

| Break | Evidence | Consequence |
|---|---|---|
| Export loses everything but pixels | Export payloads carry `format`, `url`, dimensions, `contentMetadata` only `[V]` | Caption, link, UTM, alt text, approval state, scheduled time all re-entered by hand |
| No social presets | `PresetDesignTypeName` = 4 non-social values `[V]` | Every integrator ships its own spec table or gets sizes wrong |
| Wrong-aspect exports silently letterbox | *"the export defaults to the larger dimension"* `[V]` | Silent quality bug at publish time |
| Free-plan export ceiling | PNG upscale capped at **1.125×** on Canva Free `[V]` | Integration quality varies by the *user's* Canva plan, invisibly |
| Async everywhere | Upload, export, resize, merge, autofill, import are all job+poll `[V]` | Any UI that pretends "attach from Canva" is instant will show spinners; budget for job orchestration |
| Tight creation limits | export/design/resize/brand-template creates all **20 per client-user**; identity **10** `[V]` | Bulk workflows (30-post month, 4 variants each = 120 exports) will hit limits. Design for queueing and backoff from day one |
| Preview APIs disqualify public apps | Design analytics marked preview; *"Public integrations that use preview APIs will not pass the review process"* `[V]` | Do not build the Canva-analytics feature into the public app |
| No webhooks in the API | Only a `collaboration:event` scope `[V]` | Portal-configured; cannot be provisioned per-tenant programmatically |

---

## 3. Adobe Express

**Source:** `AdobeDocs/express-add-ons-docs`, HEAD **2026-07-29**, 253 markdown files. `[V]`

### 3.1 What an Express add-on can do

| Capability | Detail `[V]` |
|---|---|
| **Renditions** | `addOnUISdk.app.document.createRenditions(renditionOptions, renditionIntent)`. `RenditionFormat`: `jpg` (image/jpeg), `png` (image/png), **`mp4` (video/mp4)**, `pdf`, `pptx`. |
| **Video output** | `VideoResolution`: `sd480p`, `hd720p`, `fhd1080p`, `qhd1440p`, `uhd2160p` (4K) + custom. Plus `FrameRate`, `BitRate`, `FileSizeLimitUnit` constants. |
| **Rendition intent** | `export` (default) or `preview`; `preview` requires `renditionPreview: true` in the manifest `requirements`. |
| **Element-level rendition** | `VisualNode.createRendition()` — PNG or JPEG of an individual shape/group/text node, from the Document Sandbox (stabilised 2026-02-06 → GA by 2026-07-30). |
| **PPTX caveat** | PPTX export only for presentation-type documents; check `addOnUISdk.app.document.isPresentation()` first. Adobe's own disclaimer: fonts may differ, and *"videos, audio, presenter notes, and animations will not be included."* |
| **PDF control** | Full print control: `bleed`, and `PdfPageBoxes` for `MediaBox`/`BleedBox`/`CropBox`/`TrimBox`. |
| **Import** | `importPdf(blob)`, `importPresentation(blob)` — **`.pptx` only, legacy `.ppt` not supported**. |
| **Panels** | `EditorPanel`: `search`, `yourStuff`, `templates`, `media`, `text`, `elements`, `grids`, `brands`, `addOns` — an add-on can open Express's own panels. |
| **Auth** | `addOnUISdk.app.oauth.authorize()` — OAuth 2.0 **PKCE**; auth window min & default **480×480**, max 800 × screen height. |
| **Print QC** | `page.isPrintReady` + a print-quality-check API that flags insufficient image resolution. |
| **Dev tooling** | **Adobe Express Developer MCP Server** (`@adobe/express-developer-mcp`), *"officially supported and production ready"* since **2026-01-13**, superseding the deprecated beta `@adobe/express-add-on-dev-mcp`. |

### 3.2 What it does not have

- **No Content-Publisher-equivalent intent.** Nothing in the docs repo registers an add-on as a destination
  in Express's share/publish flow. Searching the whole repo for publish/social surfaces returns only brand
  guidelines, the renditions how-to, and a grids tutorial. `[V]`
- **No scheduling surface, no calendar API.** `[V]`
- `[U]` Adobe Express's own consumer "schedule to social" feature (if it still exists in 2026) could not be
  verified — `developer.adobe.com` and Adobe marketing pages are blocked.

### 3.3 Breaking change to watch

**Large Document Support**, announced **2026-06-18** `[V]`: Express is moving to an active/inactive page
model with an `ActivePageNode` hierarchy, a compatibility mode, and a phased rollout. It **deprecates**
`queueAsyncEdit`, `PageNode.artboards`, `PageNode.allDescendants`, `PageNode.allTextContent`, and
`PageNode.cloneInPlace`, and introduces `visitPages` and `keepContentActiveDuringAsync`. Any add-on built
before mid-2026 needs migration. `[I]` If we build an Express add-on, build it post-LDS.

### 3.4 Verdict

`[I]` Express is a **lower-priority** integration than Canva by a wide margin: comparable rendering
(actually better video controls), but no privileged publish surface, so an Express add-on is just a side
panel the user must remember to open. Build it second, and only after the Canva app proves the funnel.

---

## 4. Figma

**Source:** `figma/rest-api-spec`, OpenAPI 3.1.0, `info.version: 0.42.0`, HEAD **2026-08-11**. `[V]`
The spec's own note: *"we are releasing the OpenAPI specification as a beta given the large surface area and
complexity of the REST API."* `[V]`

### 4.1 Surface relevant to content ops

| Area | Endpoints `[V]` |
|---|---|
| Files & structure | `/v1/files/{key}`, `/nodes`, `/meta`; `/v1/projects/{id}/files`; `/v2/teams/{id}/folders`, `/v2/folders/{id}/files` |
| **Rendering** | `GET /v1/images/{file_key}` (render nodes), `GET /v1/files/{key}/images` (image fills) |
| **Versions** | `GET /v1/files/{key}/versions` |
| **Comments** | `GET/POST /v1/files/{key}/comments`, `DELETE .../{id}`, `POST/DELETE .../reactions` |
| Design system | components, component sets, styles, **variables** (`local`, `published`, `POST`) |
| **Library analytics** | `/v1/analytics/libraries/{key}/component|style|variable/{actions,usages}` |
| Webhooks | `/v2/webhooks`, `/v2/teams/{id}/webhooks`, `/v2/webhooks/{id}/requests` |
| Governance | `/v1/activity_logs`, `/v1/developer_logs`, **`/v1/ai_usage/daily`**, `/v1/payments` |
| Dev handoff | `/v1/files/{key}/dev_resources`, `/v1/dev_resources` |

### 4.2 The rendering contract — and its two hard limits

`GET /v1/images/{file_key}` `[V]`:
- `format`: **`jpg | png | svg | pdf`** — default `png`. **No video, no GIF, no MP4.**
- `scale`: **0.01 – 4**
- `version`: render a *specific historical version* — genuinely useful, and something no design→social
  integration exploits
- `svg_outline_text`: outline vs. `<text>` elements
- **"The image assets will expire after 30 days."**
- **"Images up to 32 megapixels can be exported. Any images that are larger will be scaled down."**
- Rendering is per-node and can partially fail: *"the image map may contain values that are `null`… It is
  guaranteed that any node that was requested for rendering will be represented in this map whether or not
  the render succeeded."*

`[I]` The 30-day URL expiry is the specific trap: an integration that stores Figma image URLs rather than
copying bytes will have a media library that silently rots after a month.

### 4.3 Webhook events

`WebhookV2Event`: `PING`, `FILE_UPDATE`, `FILE_VERSION_UPDATE`, `FILE_DELETE`, `LIBRARY_PUBLISH`,
`FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE`. Status is `ACTIVE | PAUSED`. `[V]`

`[I]` `FILE_VERSION_UPDATE` + `GET /v1/images?version=…` is a complete "when the designer publishes a new
version, re-render the social crops and update the queued post" pipeline. That is a real feature and it is
buildable today. Nobody ships it.

### 4.4 Verdict

`[I]` Figma is where **brand/campaign teams with in-house designers** work, and where **no video lives**.
It is a *source* integration, not a distribution channel — there is no Figma equivalent of the Canva publish
intent and no plugin surface that puts us in front of a purchase decision. Priority: **third**, behind Canva
and Express, and mainly as a "watch this frame, republish on change" power feature for design-led brands.

---

## 5. Notion and Airtable — where the content calendar actually lives

### 5.1 Notion

**API surface `[CAT 2026-05-04]`** — 6 specs, 13 paths total:

| Group | Paths |
|---|---|
| Databases | `POST /databases`, `GET /databases/{id}`, `PATCH /databases/{id}`, **`POST /databases/{id}/query`** |
| Pages | 3 paths | 
| Blocks | 2 paths |
| **Comments** | `GET /comments`, `POST /comments` |
| Search | `POST /search` |
| Users | 3 paths |

**Limits `[CAT 2026-05-04]`:** **3 requests/second per integration** (average; bursts allowed, sustained rate
enforced) · **1,000 blocks per request** · **2,000 characters per property**.

**Pricing `[CAT 2026-05-04]`:** Free · Plus **$10**/member/mo · Business **$20**/member/mo · Enterprise custom.

`[I]` Notion is a *terrible* API to build a high-volume publisher on — 3 rps and a block-tree content model
means fetching one post's body is several round trips (the real workflow in §9.4 does exactly this:
`getAll databasePage` → `getAll block` → `aggregate`). But it is where a large slice of small marketing teams
keep their calendar, and the 2,000-character property cap is *below* several caption limits, which forces
copy into page bodies and therefore into the block API.

### 5.2 Airtable

**API surface `[CAT 2026-05-04]`** — 12 specs, 37 paths: records, tables, fields, bases, **comments**
(`GET/POST/PATCH/DELETE /{baseId}/{table}/{recordId}/comments`), **webhooks**
(`GET/POST /bases/{baseId}/webhooks`, `DELETE`, **`POST .../refresh`**, **`GET .../payloads`**), shares,
users, groups, workspaces, audit logs, enterprise.

**Limits `[CAT 2026-05-04]`:** **5 requests/second per base** · after a `429` you **must wait 30 seconds** ·
**10 records per write request** · **100 records per read**.

**Pricing `[CAT 2026-05-04]`:** Free · Team **$20**/user/mo (annual) · Business **$45**/user/mo (annual) ·
Enterprise Scale custom, **up to 100M records**.

`[I]` The **10-records-per-write** cap is the operationally important number: syncing publish status back to
Airtable for a 200-post bulk import is 20 write calls minimum, at 5 rps, plus a 30-second penalty for any
overrun. Any "two-way Airtable sync" feature must be queue-based with a strict token bucket.

Airtable's **webhook payload cursor model** (`/webhooks/{id}/payloads` + `refresh`) is the right primitive
for a real two-way sync — it is a change feed, not a poll. `[CAT]` + `[I]`

### 5.3 Why people use these instead of the scheduler's calendar

`[I]`, grounded in the workflow corpus (§9):
1. **Arbitrary columns.** Campaign, pillar, persona, funnel stage, offer, owner, brief link, legal-review
   flag. No scheduler models these; every scheduler models "tags".
2. **Views.** The same rows as calendar, kanban, "awaiting legal", "this week by owner".
3. **Non-social rows in the same table.** Blog posts, emails, events, paid — the *content* calendar, not the
   *social* calendar.
4. **Comments on the record, where the brief is.** Both have a comments API; both are used for it.
5. **It is where the people who don't have a scheduler seat already are.**

**The feature this implies:** not "export to Airtable". **Bidirectional binding** — map an external table's
columns to our post fields, publish from it on schedule, and **write status, permalink, and metrics back to
the same row**. §9.4 shows people building precisely this by hand.

---

## 6. Work management — ClickUp, Asana, Monday, Trello

| Tool | API shape | Rate limit `[CAT 2026-05-04]` | Price `[CAT 2026-05-04]` |
|---|---|---|---|
| **ClickUp** | REST v2 · 13 specs / 44 paths: tasks (7), views (6), time tracking (6), goals (4), lists (4), **comments (8: task/view/list + update/delete)**, **custom fields (3)**, folders, spaces, teams, webhooks (2), OAuth | Free **100 rpm**/user · Unlimited **1,000** · Business **1,000** · Enterprise **10,000** | Free (60MB storage) · Unlimited **$7** · Business **$12** · Enterprise custom |
| **Asana** | REST · 37 specs / 140 paths — projects (14), portfolios (9), goals (7), custom fields (6), sections (4), project templates (4), **stories** (comment stream), attachments, **rules**, batch API, audit log, organization exports | Paid **1,500 rpm**/domain · Free **150 rpm** · Search **60 rpm** · **50 concurrent** | Personal free (2 users) · Starter **$10.99** annual / $13.49 monthly · Advanced **$24.99** annual / $30.49 monthly · Enterprise custom |
| **Trello** | REST · 14 specs / 68 paths — cards (11), boards (11), actions (9), lists (7), organizations (5), checklists (4), custom fields (4), labels, plugins ("Power-Ups"), search, webhooks | **300 req/10s** per API key · **100 req/10s** per token · search **50 rpm** · webhooks **600 events/min** per callback | Free (10 boards/workspace) · Standard **$5** · Premium **$10** · Enterprise **$17.50** (all annual/user/mo) |
| **Monday** | **GraphQL only** — `api.developer.monday.com`. No OpenAPI in the catalogue. | `[U]` | `[U]` |

`[I]` **Assessment.** These are *where the work is tracked*, not where the content is. In the 2,053-workflow
corpus, **Monday appears once and ClickUp/Asana/Trello appear zero times** in social-publishing workflows,
against Sheets 48 / Drive 39 / Airtable 23. Their relevance to a social tool is narrow and specific:

1. **Task creation on approval events** — "post rejected → create a task in the brand's tracker."
2. **Campaign-level linkage** — attach our posts to their campaign/project object for reporting.
3. **Agency workflow** — the agency's delivery board lives here; posts are deliverables.

Trello's **600 webhook events/min per callback** is the most generous change-feed of the four and the easiest
to build against. ClickUp's **100 rpm on Free** is the tightest and will throttle any naive sync.

**Recommendation:** one shallow integration each (create task, update task, receive webhook), Trello and
Asana first, and do **not** attempt to model their custom fields. Depth here is wasted; §5's bidirectional
database binding is where the same engineering effort pays.

---

## 7. Review and approval — Frame.io and Filestage

This is the section where social tooling is furthest behind, and the one where the borrowed mechanics are
most obviously differentiating.

### 7.1 Frame.io — verified mechanics (V2 client; see staleness warning)

**Source:** `Frameio/python-frameio-client`, default branch `develop`, **last commit 2024-06-11**. `[V]`
**Staleness:** Frame.io V4 (the Adobe-era rewrite) is not represented here. Endpoint paths below are V2.
Treat the *mechanics* as real and the *paths* as historical. `[V]` + `[U]`

| Mechanic | Verified detail | Social-tool equivalent |
|---|---|---|
| **Frame-accurate comments** | `POST /assets/{asset_id}/comments` with `{ text, timestamp: int, annotation: str }` — *"`timestamp`: The timestamp of the comment. `annotation`: The serialized contents of the annotation."* Same triple on update. | **None.** No social tool lets a reviewer say "at 0:07 the logo is wrong" and draw on the frame. |
| **Threaded replies** | `POST /comments/{id}/replies`, `GET /comments/{id}` | Partial — most tools have flat comments. `[X]` Buffer has notes without @mentions. |
| **Version stacks** | `POST /assets/{target_asset_id}/version` — a new file *replaces* the old in place, keeping identity and comment history | **None.** Social tools overwrite the media or create a new draft, orphaning feedback. |
| **Seatless external review links** | `POST /projects/{id}/review_links` → `{ name, password }`; `PUT /review_links/{id}` → `{ expires_at, is_active, name, password }`; `GET/POST /review_links/{id}/items|assets` to control scope | **None.** Every social tool charges a seat for an approver, or emails a PDF. |
| **Presentation links** | `POST /assets/{id}/presentations` → `{ title, password }` — a *polished* share, distinct from a *review* share | **None.** |
| **Pending collaborators** | `GET /projects/{id}/pending_collaborators` — invited-but-not-joined is a first-class state | Rare. |
| **Audit** | `GET /accounts/{id}/audit_logs` | Enterprise-only in social tools. `[X]` |
| **Batch ops** | `/batch/assets/{id}/copy`, `/batch/teams/{id}/members` | — |

`[U]` **Frame.io V4 specifics not verified:** Camera to Cloud, the V4 comment/annotation model, the "Share"
vs "Review" object split, Collections, Custom Metadata fields on V4, the current free-tier limits, and
whether external reviewers remain seatless in the Adobe licensing model. All of these must be re-checked.

### 7.2 Filestage

`[U]` **Nothing verified.** `filestage.io` is egress-blocked and the product has no public GitHub artefact,
no npm package, and no entry in the api-evangelist catalogue (probed: absent). I will not reproduce
half-remembered feature lists. What I can say honestly: it occupies the same "review rounds, external
reviewers, versioned files, due dates" niche as Frame.io, aimed at general marketing assets rather than
video specifically. **Every specific claim about Filestage in this document would be a guess, so there are
none.**

### 7.3 The approval capability gap, stated precisely

`[I]` What social tools have (per `[X]` `01`, `20`, `21`, `22`):

- A draft state, and often exactly one approval step.
- Approver = a paid seat in the workspace.
- Feedback = a free-text comment on the post, or a Slack message elsewhere.
- Changing the creative = replacing the file; feedback context is lost.
- No expiring, password-protected, scope-limited link for a client or a lawyer.

What Frame.io has that maps *directly* onto social creative:

| Frame.io mechanic | Social translation | Why it's hard for incumbents |
|---|---|---|
| `timestamp` comment | "At 0:07 of this Reel, the disclosure card is too fast" | Requires a video player with a comment rail in the review UI |
| `annotation` payload | Draw on the thumbnail / on the frame | Requires a canvas overlay and a serialisation format |
| Version stack | Creative v1→v4 under one post, comments preserved | Requires post→creative to be a 1:N versioned relation, not a file field |
| Review link with `expires_at`, `password`, `is_active` | Client approves without a seat, link dies after the campaign | Requires an unauthenticated review surface + a per-link ACL |
| Review link **item scoping** | "This client sees only their 6 posts" | Requires per-link content scoping, not per-workspace roles |

**These five are, together, a product.** `[I]` Multi-stage approval with **seatless expiring review links**
and **versioned creative with preserved feedback** is, on the evidence in this document, unoccupied in social
tooling and repeatedly improvised in automation platforms (§9.5).

---

## 8. Asset pipelines — Google Drive, Dropbox, OneDrive, Box

### 8.1 The verified numbers

| Provider | API surface `[CAT 2026-05-04]` | Rate/quota `[CAT 2026-05-04]` | Pricing `[CAT 2026-05-04]` |
|---|---|---|---|
| **Box** | 81 specs / 242 paths — files (26), folders (15), **classifications** (4 + on-files + on-folders), **retention policies**, **legal holds**, **file version legal holds/retentions**, collaborations + allowlist + domain restrictions, comments, file requests, events, metadata | **50,000 API calls/mo** (Business) · **100,000** (Enterprise) · **200,000** (Enterprise Advanced) · **1,000 rpm per user** · **100 concurrent uploads** | Individual free (10GB, 250MB upload) · Business (unlimited storage, 5GB upload) · Enterprise (50GB upload, 1,000 AI Units/mo) · Enterprise Advanced (min 35 users, 500GB upload, 20,000 AI Units/mo) |
| **Dropbox** | 28 specs / 248 paths — files (43), **sharing (37)**, **signature requests (20)**, team members (20), file properties (16), team groups (12), team API (12), team folders (10), file requests (8), legal holds (7) | ~**1,200 rpm per app** (soft) · **100 concurrent uploads per user** · **100 active list-folder cursors** | Standard **$15**/user/mo (3TB pooled) · Advanced **$24**/user/mo (15TB pooled) |
| **Google Drive / Sheets** | `[U]` — catalogue entries for Google Sheets are explicitly **placeholder scaffolds** ("TBD", "Real limits and pricing must be reconciled with the provider's published plan documentation") | `[U]` — do not use the catalogue numbers | `[U]` |
| **OneDrive / Teams** | `[U]` — the Microsoft Teams catalogue entry is a generic cloud-pricing placeholder, not Teams pricing | `[U]` | `[U]` |

**I am flagging the Google and Microsoft rows as unusable rather than reporting scaffold values as facts.**
`[U]`

### 8.2 What a cloud drive gives a social team, and what it costs

`[I]` Verified from usage rather than marketing: in the n8n corpus, **Google Drive is the #2 content-ops tool
in social workflows (39 occurrences)** and the trigger of choice for "new file appears → publish it."
Drive is used as:

1. **The inbox** — videographer/agency drops the export in a shared folder.
2. **The archive** — the "✨🩷Social Media Content Publishing Factory" workflow saves both the generated image
   *and* the post JSON to Drive, with the author's own note: *"Content library: Build a searchable repository
   of all published content · Performance correlation · Compliance records: Maintain documentation of
   published content."* `[V]`
3. **The multi-cloud hedge** — the "Hacker News to Video" template writes to **Drive, Dropbox and OneDrive**
   simultaneously. `[V]`

What it costs: no metadata model beyond filename and folder, no rights or expiry, no derivative renditions,
no approval state, no usage tracking. Which is exactly the case for §12.

### 8.3 The compliance capabilities schedulers don't have and Box does

Box's path list contains `classifications`, `classifications-on-files`, `classifications-on-folders`,
`file-version-retentions`, `file-version-legal-holds`, `retention-policies`, `domain-restrictions-for-collaborations`.
`[CAT]`

`[I]` For regulated brands (pharma, finance, public sector) this is the *reason* the assets live in Box and
not in the scheduler. Any serious enterprise social play needs either (a) to read from Box and honour the
classification, or (b) to reimplement retention/legal-hold. (a) is dramatically cheaper.
`[X]` `11-compliance-security-global.md` covers the regulatory side.

---

## 9. Zapier, Make, n8n — what people actually build

This section answers key question #2 with primary evidence rather than blog listicles.

### 9.1 Method and its limits

`zapier.com` and `make.com` are egress-blocked, so **I could not read Zapier's own popular-template pages.**
`[U]` Instead I obtained a **2,053-workflow corpus of real n8n community templates**
(`Danitilahun/n8n-workflow-templates`, HEAD 2026-08, ~40MB of workflow JSON) and analysed it directly. `[V]`
n8n's community library is the closest reachable proxy for "what automations people actually build," and it
has the advantage of being *machine-inspectable*: I can see the nodes, the URLs, and the authors' own notes.

Cross-check: `ScraperNode/awesome-n8n-templates` claims **8,697 workflows across 236 integrations**,
`zengfr/n8n-workflow-all-templates` claims **10,258**, `enescingoz/awesome-n8n-templates` has **24,622 GitHub
stars**. `[V]` The corpus I analysed is a representative subset, not the whole population.

### 9.2 The macro shape of the corpus

**Top node types across all 2,053 workflows `[V]`:**

| Rank | Node | Count | Reading |
|---|---|---|---|
| 1 | `stickyNote` | 7,055 | Documentation-heavy — these are *shared* artefacts |
| 2 | `set` | 2,527 | Field mapping |
| 3 | **`httpRequest`** | **2,119** | **The most-used integration is "no integration"** |
| 4 | `if` | 1,091 | |
| 5 | `code` | 1,004 | |
| 7 | `lmChatOpenAi` | 632 | |
| 8 | **`googleSheets`** | **597** | **The most-used named app in the entire corpus** |
| 10 | `agent` (LangChain) | 459 | |
| 13 | `telegram` | 389 | |
| 15 | `scheduleTrigger` | 330 | |
| 18 | **`googleDrive`** | **290** | |
| 22 | `gmail` | 259 | |
| 24 | **`airtable`** | **255** | |
| 28 | **`slack`** | **197** | |
| 34 | **`notion`** | **160** | |

`[I]` **`httpRequest` at 2,119 is the headline.** People are hitting raw APIs because the node they need
doesn't exist. `[X]` `05-competitors-dev-oss.md` verified that n8n's `nodes-base` ships Twitter, LinkedIn,
Facebook Graph, Reddit, Discord, Telegram, Slack, Medium, Ghost, WordPress, YouTube and Mastodon — and
**no Instagram, TikTok, Pinterest, Threads or Bluesky nodes**. The corpus confirms the consequence: those
five platforms are reached by raw HTTP to `graph.facebook.com`, `api.upload-post.com`, or
`backend.blotato.com`.

### 9.3 Social workflows, and what they are joined to

**409 of 2,053 workflows (20%) touch a social platform node. 128 of those combine a content-ops tool.** `[V]`

| Content-ops tool | Appearances in social workflows `[V]` |
|---|---|
| **Google Sheets** | **48** |
| **Google Drive** | **39** |
| **Airtable** | **23** |
| **Slack** | **17** |
| **Notion** | **6** |
| Baserow | 3 |
| Dropbox | 3 |
| NocoDB | 2 |
| OneDrive | 2 |
| Monday | 1 |
| ClickUp / Asana / Trello / Figma / Canva / any DAM / Frame.io / Filestage | **0** |

**Publishing endpoints actually called `[V]`:**

| Target | Workflows | Note |
|---|---|---|
| `api.upload-post.com/api/upload` | 6 | Multi-network publisher API |
| `backend.blotato.com/v2/posts` + `/v2/media` | 4 | Multi-network publisher API |
| `graph.facebook.com/v20.0/…/media` | several | Raw IG/FB Graph |
| Native `twitter` / `linkedIn` / `facebookGraphApi` / `youTube` nodes | many | |
| **`api.buffer.com`** | **0** | |
| **Hootsuite** | **0** | |
| **Later / Metricool / Publer / Postiz** | **0** | |
| **Frame.io / Filestage / Bynder / Brandfolder / Frontify** | **0** | |
| Genuine Canva references | **3** | (of 30 raw string matches; the rest are `canvas`) |

`[I]` This is a damning result for the incumbent scheduler APIs and a clear one for us: **the automation
buyer does not integrate with schedulers, because scheduler APIs are closed, gated, or thin.** `[X]`
`05-competitors-dev-oss.md`: Buffer's API is *"effectively closed to new apps"*; Publer and Social Champ gate
the API behind higher tiers. A genuinely open, self-serve publishing API with an official n8n node is a
wedge into a market that currently pays Blotato and upload-post for it.

### 9.4 The five archetypes — each one a literal feature request

**Archetype 1 — Watch a cloud folder, caption it, publish it everywhere.**
Template: *"google drive to instagram, tiktok and youtube"* `[V]`
```
googleDriveTrigger → googleDrive(read) → openAi(extract audio from video)
  → openAi(generate description for TikTok and IG) → readBinaryFile ×3
  → POST api.upload-post.com/api/upload  (TikTok)
  → POST api.upload-post.com/api/upload  (Instagram)
  → POST api.upload-post.com/api/upload  (YouTube)
  → errorTrigger → telegram (failure alert)
```
Author's own description: *"This automation allows you to upload a video to a configured Google Drive folder,
and it will automatically create descriptions and upload it to Instagram and TikTok."*
**Feature:** folder-watch ingestion + AI captioning + multi-network publish + failure notification.

**Archetype 2 — The database is the calendar; publish from it and write status back.**
Template: *"Notion to Linkedin"* `[V]`
```
scheduleTrigger(daily) → notion.getAll(databasePage, filtered to today)
  → notion.getAll(block)  → aggregate  → code(format)
  → httpRequest(download image) → linkedIn(publish)
  → notion.update(databasePage: status)
```
Author's setup note flags the real-world snag: *"to post on your personal or company profile, you need to
have a company page assigned to your profile."*
**Feature:** external-database binding with per-row status write-back.

Same archetype in Airtable: *"Publish Videos & Images - Blotato"* `[V]` reads an Airtable record, uploads
media to `/v2/media`, fans out nine `POST /v2/posts` calls (Instagram, Facebook, LinkedIn, TikTok, Pinterest,
YouTube, Threads, Twitter, Bluesky), then runs `Airtable: Posted Instagram → update` to mark the row.

**Archetype 3 — CMS/RSS → per-network rewrite → publish → log to a sheet.**
Template: *"AI Social Media Publisher from WordPress"* `[V]`
```
googleSheets(read WP post IDs) → wordpress.getPost
  → chainLlm "Social Media Manager" (per-network caption via structured output parser)
  → openAi (image for Instagram; separate image for Facebook+LinkedIn)
  → twitter / linkedIn / facebookGraphApi / POST graph.facebook.com/v20.0/{id}/media
  → googleSheets update ×4  ("Linkedin OK", "Facebook Ok", "Instagram OK", "X OK")
```
**Feature:** source-content ingestion + per-network AI rewriting + per-network image generation + per-network
success ledger.

**Archetype 4 — Generate the video, then publish it.**
Templates: *"AI Automated TikTok/Youtube Shorts/Reels Generator"*, *"AI-Powered Short-Form Video Generator
with OpenAI, Flux, Kling, and ElevenLabs and upload to all social networks"*, *"💥AI Social Video Generator
with GPT-4, Kling & Blotato — Auto-Post to Instagram, Facebook, TikTok, Twitter & Pinterest"*,
*"Auto-create and publish AI social videos with Telegram, GPT-4 and Blotato"*, *"Hacker News to Video
Template"*, *"YouTube to X Post"* `[V]`
**Feature:** generative video pipeline wired directly into the publish queue. `[X]` `09-ai-frontier.md`
identified *"video as a first-class primitive inside the scheduler"* as unshipped whitespace; this corpus is
the demand evidence.

**Archetype 5 — Human approval before publish.**
Template: *"✨🩷Automated Social Media Content Publishing Factory + System Prompt Composition"* `[V]`
```
chatTrigger → googleDocs(System Prompt) + googleDocs(Social Media Schema)
  → compose prompt & schema → agent(Social Media Content Creator, + SerpAPI web search)
  → pollinations.ai (image) → imgbb + googleDrive (archive image)
  → googleDrive (archive post JSON)
  → agent(Prepare Social Media Email Contents) → gmail("Gmail User for Approval")
  → IF "Is Approved?"  → switch(Social Media Publishing Router)
       → X / Instagram / Facebook / LinkedIn  [+ noOp "Implement Threads Here", "Implement YouTube Shorts Here"]
  → telegram success / telegram error
```
The author's own stated benefits include: *"Centralized prompt management: Store and update system prompts in
Google Docs for easy team collaboration"*, *"Content approval: Enable stakeholders to review content before
publishing"*, *"Compliance records: Maintain documentation of published content"*, and *"Asset tracking:
Maintain records of which images were used where."* `[V]`

**Feature list extracted from one workflow:** external prompt/brand-voice management, per-network output
schemas, AI image generation with alt text, multi-destination asset archiving, **email approval gate**,
per-network routing, success/failure alerting, published-content archive, asset-usage tracking.
That is six of our roadmap items, hand-built, by one person, because no scheduler ships them together.

**Human-in-the-loop prevalence:** 20 of 2,053 workflows use n8n's `sendAndWait` node. `[V]` Small in absolute
terms, but it is a *2024-era* node and its presence at all in a corpus dominated by fire-and-forget
automations is the signal.

### 9.5 Real practitioner criticism, verbatim

The only genuine user criticism reachable in this session, from a template author's sticky note on the
Blotato multi-network workflow `[V]`:

> **"Current Issues (last updated April 29, 2025)**
> - Haven't confirmed, but you -have- to post to a FB Page?
> - I believe you can only post to a particular Board in Pinterest
> - Some Endpoints can handle longer text, some not
> - Some Endpoints can handle videos, so[me not]"

And on setup:

> *"IMPORTANT — Log into each social media platform you want to connect before using the connection buttons
> and do NOT use the 'connect all pages' option."*

And on a title-length failure:

> *"May Not Be Necessary — I added this because my incoming Titles were over the 100 character limit"*
> (with a preceding `openAi` node literally named **"Ensure Valid YouTube Title"**)

`[I]` These four complaints are the entire multi-network abstraction problem in miniature: **inconsistent
capability surfaces, silent per-network constraints, destination-selection gotchas, and length limits
discovered at publish time.** A tool whose composer *pre-validates* against the real per-network matrix —
and tells the user *before* they hit schedule — eliminates all four. `[X]` This is exactly the
per-network-preview-with-violation-warnings capability recorded for Buffer in `20-buffer-teardown.md`, which
is evidently the right idea and under-implemented across the field.

### 9.6 Zapier and Make — the platform economics

**Zapier `[CAT 2026-05-04]`:**

| Plan | Price | Key limits |
|---|---|---|
| Free | $0 | **100 tasks/mo**; unlimited Zaps/Tables/Forms; two-step Zaps; Copilot with daily message limits |
| Professional | **$19.99/mo** (annual) | Multi-step Zaps, unlimited premium apps, webhooks, AI fields, conditional form logic; tasks scale from 100 |
| Team | **$69/mo** (annual) | **25 users**, shared Zaps/folders, shared app connections, SAML SSO, Premier Support |
| Enterprise | custom | |

**Polling intervals `[CAT]`:** Free **15 min** · Professional **2 min** · Team/Enterprise **1 min**.
**Webhook payload cap: 10 MB.** Throttle response: `429`.

`[I]` The polling interval is the reason "publish at exactly 09:00" cannot be delegated to Zapier's polling
triggers on cheap plans, and why webhook-first integrations matter. The **10 MB webhook payload cap** rules
out passing video bytes through Zapier at all — media must be passed by URL, which is precisely why the
workflows in §9.4 pass Drive/Dropbox links rather than files.

**Zapier Partner API `[V]`** (`api.zapier.com`, Partner API v2024.11.0) — this is the surface that lets a
vendor embed Zapier inside its own product:
- `GET /v1/zap-templates` — *"List popular Zap Templates using your app"*, params `apps` (comma-separated,
  *"Your app will always be one of the apps in the template"*), `limit` (max **100**, default 5), `offset`.
- `GET /v1/apps` with `category`, **`is_in_zap_template_with`**, `title_search`.
- Plus accounts, actions, authentications, inputs, outputs, zaps, categories, experimental.
- Auth: **implicit grant** — *"while we do generate a `client_secret`, the type of grant we use (implicit)
  doesn't need it so it's not something we provide."*
- Capabilities Zapier advertises for it: *"Embed our Zapier Editor to allow your users to create new Zaps and
  modify existing ones, without needing to leave your product"* and *"Streamline Zap setup by pre-filling
  fields on behalf of your users."*

`[I]` **This is a shipping decision, not a research finding:** we should build a Zapier integration *and*
consume the Partner API to render "automations for your stack" natively inside our product, pre-filled. It
converts Zapier from a competitor for workflow-value into an in-product feature.

**Make `[CAT 2026-05-04]`:**

| Plan | Price | Key limits |
|---|---|---|
| Free | $0 | **1,000 credits/mo**; **15-minute minimum scheduling interval**; 3,000+ apps; routers + filters |
| Core | **$12/mo** | 10,000 credits; unlimited active scenarios; **down-to-the-minute scheduling**; **Make API access** |
| Pro | **$21/mo** | 10,000 credits; priority execution; custom variables; full-text execution log search |
| Teams | **$38/mo** | 10,000 credits |
| Enterprise | custom | |

**Make API rate limits `[CAT]`:** **60 requests/minute per organisation** (Core+ only) · webhook scenarios
**100 requests/second per scenario** · `429` with `Retry-After`.

`[I]` Make gates *minute-level scheduling* behind $12/mo. For a social use case that is the whole product, so
Make's free tier is effectively unusable for publishing — another reason the practitioner corpus skews to
self-hosted n8n.

### 9.7 The automation-shaped hole, summarised

`[I]` Every one of these is a template someone built because no scheduler shipped it. Ranked by how often the
pattern appears in the corpus and how cheap it is for us:

| # | Automation people build | Corpus evidence | Build cost | Verdict |
|---|---|---|---|---|
| 1 | Publish from an external table (Sheets/Airtable/Notion) with **status write-back** | 48 + 23 + 6 workflows | Medium | **Build. Flagship.** |
| 2 | **Cloud-folder watch → auto-publish** | 39 Drive workflows + named templates | Low | **Build.** |
| 3 | AI caption/hashtag per network from one source asset | Pervasive | Low (we have it) `[X]` | Extend to *per-network variants from one input* |
| 4 | **Approval gate before publish** (email/Slack, non-seat) | Archetype 5, 20× `sendAndWait` | Medium | **Build. Differentiator.** |
| 5 | Publish-failure alerting to Slack/Telegram/email | Errors routed in most archetypes | Low | **Build. Retention lever** `[X]` (§30.5 of `12-…`) |
| 6 | Multi-destination archive of published creative + post JSON | Archetype 5 explicit | Low | **Build** — this is the seed of our asset library |
| 7 | Asset-usage tracking ("which image went where") | Archetype 5, author's own words | Medium | **Build** — see §12.6 |
| 8 | Generative video → publish | 6+ named templates | High | Partner first |
| 9 | Per-network pre-publish validation | The four verbatim complaints in §9.5 | Low | **Build. Cheapest win in the list.** |
| 10 | Cross-repost (YouTube→X, RSS→everywhere) | Several named templates | Low | Build |

---

## 10. Google Sheets as a bulk-scheduling surface

### 10.1 Why Sheets wins

`[V]` Google Sheets is the **most-used named application in the entire 2,053-workflow corpus** (597 node
occurrences) and the **#1 content-ops tool in social workflows** (48). It beats Airtable 2:1 and Notion 8:1.

`[I]` The reasons are mundane and decisive: it is free, everyone already has it, a client can be given edit
access without a licence conversation, and a marketer can produce 200 rows of captions in an afternoon
without learning a data model.

### 10.2 What the scheduler side actually offers today

`[X]` From this project's own verified teardowns:

| Finding | Source |
|---|---|
| Buffer **explicitly warns** that *"Apple Numbers and some third-party CSV editors inject invisible characters or mangle headers and break the upload; Excel and Google Sheets are recommended"* | `20-buffer-teardown.md` |
| One vendor: *"CSVs exported from Excel do not support emoji. Google Sheets recommended instead."* | `22-publer-teardown.md` |
| Vista Social: bulk CSV import from the calendar **for one or several brands at once**, plus from Autolists; **multi-board Pinterest bulk CSV** | `01-vista-social-full-audit.md` |
| CSV bulk import row cap: **200 hard / 100 recommended** | `01-vista-social-full-audit.md` |
| Vista Social has **no native Google Sheets or Airtable integration** (explicitly "NOT FOUND") | `01-vista-social-full-audit.md` |

`[I]` So the state of the art is: **download a CSV, fix it in Google Sheets because Excel corrupts emoji,
upload it, hope 200 rows is enough, repeat next month.** That is a 2012 workflow. The entire category is
using Sheets *as a file format* rather than *as a live data source*.

### 10.3 The feature this implies

`[I]` **"Connected Sheet" — a live, bidirectional binding, not an import.**

1. User picks a Google Sheet and a tab; we read the header row and offer a **column mapper**
   (`caption → text`, `image_url → media`, `when → scheduled_at`, `channels → targets`, `first_comment`,
   `alt_text`, `link`, `utm_*`).
2. **Dry-run validation** against the real per-network matrix *before* anything is scheduled — length,
   aspect ratio, duration, media count, hashtag caps, mention rules — with per-row errors written **back
   into an error column in the sheet**. This directly answers the four verbatim complaints in §9.5.
3. Rows sync continuously (Drive change notifications) rather than being imported once.
4. We **write back** `status`, `post_url`, `published_at`, and a metrics block per row. §9.4 archetypes 2 and
   3 show people doing exactly this by hand, per network, one `update` node at a time.
5. No 200-row cap. Chunk and queue.
6. Same mapper mechanism, different driver, for **Airtable** (respecting 5 rps / 10-records-per-write) and
   **Notion** (respecting 3 rps).

`[I]` The dry-run-with-errors-written-back-to-the-sheet is the part that would be *talked about*. It is also
about two weeks of work.

---

## 11. Miro — campaign planning

**Source:** `api-evangelist/miro` catalogue (51 specs / 114 paths) + `miroapp/api-clients`. `[CAT 2026-05-08]` `[V]`

| Area | Detail |
|---|---|
| **Board export** | `POST /v2/orgs/{org_id}/boards/export/jobs` → job → `GET .../results`, `.../tasks`, `POST .../tasks/{task_id}/export-link`, `PUT .../status`. **Org-scoped, async, Enterprise-shaped.** |
| Items | card items, **app card items**, document items, image items, embed items, frames, connectors, shapes, sticky notes, text, groups, tags |
| Governance | board classification at **board / team / organization** level; audit logs; board content logs; **AI interaction logs** |
| Bulk | `/v2/bulk-operations` |
| Discovery | 5 paths |
| Rate limits | Per-OAuth-app ceiling; **verified/certified Marketplace apps receive higher limits**; `429` with `Retry-After`; SCIM and audit logs limited per org |
| Pricing `[CAT]` | Free (**3 editable boards**, 10 AI credits/mo) · Starter **$8**/member/mo annual ($10 monthly), 25 AI credits · Business **$20** annual ($25 monthly), 50 AI credits · Enterprise custom, **minimum 30 members** |

`[I]` **Verdict: do not integrate.** Miro is where campaigns are *brainstormed*, not where content is
produced or approved. The board-export API is org-scoped and asynchronous — built for compliance archival,
not for pulling a campaign plan into a calendar. Zero appearances in the social workflow corpus. The one
genuinely interesting detail is the **app-verification-raises-rate-limits** pattern, which is a good model
for our own partner API tiering.

---

## 12. DAM and brand governance — Bynder, Brandfolder, Frontify

### 12.1 Bynder — the fullest verified DAM surface

**Source:** `api-evangelist/bynder`, 20 OpenAPI specs / 55 paths, catalogue generated **2026-07-11**. `[CAT]`

| Surface | Endpoints | Why a scheduler's media library has no equivalent |
|---|---|---|
| **Metaproperties** | `GET/POST /api/v4/metaproperties`, `GET/POST/DELETE /{id}`, **`GET/POST /{id}/options`** | Structured, controlled-vocabulary fields with managed option lists. A scheduler has free-text tags. |
| **Taxonomy** | `GET/POST /api/1/taxonomy/metaproperties`, `GET/PATCH/DELETE /{id}` | A second, paginated taxonomy service. Hierarchical classification. |
| **Content access** | `GET/POST/DELETE /api/1/content/access` — *"metaproperty access"* | **Per-metaproperty ACLs.** "Only the APAC team can see assets tagged Region=APAC." No scheduler models permissions on *metadata values*. |
| **Derivatives** | `GET /api/v4/derivatives/presets`, `GET /{id}` | One master → many named renditions, generated by policy. A scheduler stores one file and crops at publish. |
| **Quarantine** | `GET /v7/quarantine/v1/assets`, `GET /{id}`, **`PUT /{id}` (update review status)** | **Assets cannot enter the library until reviewed.** There is no such gate in any scheduler media library. |
| **Analytics** | `GET /v7/analytics/api/v1/asset/{assetid}` (all events), `/asset/download`, `/v2/asset/views`, `/user/login` | **Per-asset usage analytics.** "This hero shot was downloaded 340 times." Schedulers know post performance, not *asset* performance. |
| **Automation** | `GET /automations/triggers`, `/conditions`, `/actions`; `GET/POST /automations/rules`, `GET/PUT/DELETE /rules/{id}` | A rules engine *inside the DAM*: on upload, if metaproperty X, then action Y. |
| **Workflow** | `GET/POST /api/workflow/campaigns`, `GET/PUT/DELETE /{id}`; same for `/api/workflow/jobs` | **Campaigns and jobs as first-class objects** with their own lifecycle. |
| **Collections** | list/create/get/modify/delete, `GET/POST/DELETE /{id}/media`, **`POST /{id}/share`** | Shareable curated sets. |
| **Smart filters** | `GET /api/v4/smartfilters` | Saved dynamic queries. |
| **Public links** | `GET /api/v4/media/{id}/publiclinks` | Distribution URLs per asset. |
| **Users / security profiles** | `/api/v4/users` CRUD, **`GET /api/v4/profiles`** | Named security profiles, not just roles. |
| **Webhooks** | CRUD + **`GET /api/webhooks/ips`** (source IP ranges for allowlisting) | Enterprise-grade eventing. |
| **Trash** | `GET /api/trash/media` | Recoverable deletes. |
| **Brands** | `GET /api/v4/brands` | Multi-brand partitioning at the top of the model. |
| **Chunked upload** | `POST /v7/file/cmds/upload/prepare` → `/{file-id}/chunk/{n}` → `/finalise` | Resumable large-file upload. |

**Auth `[CAT]`:** OAuth 2.0, **both** `authorizationCode` and `clientCredentials`, per-instance hosts
(`https://yourportal.bynder.com/v6/authentication/oauth2/...`). Scopes: `asset:read`, `asset:write`,
`collection:read`, `collection:write`, `meta.assetbank:read`, `meta.assetbank:write`, `offline`.

**Not found in the verified surface `[U]`:** explicit usage-rights / licence-expiry / embargo fields. A
keyword scan across all 20 specs for `rights`, `expir*`, `embargo`, `watermark`, `licens*` returned **zero
matches**. Bynder almost certainly models rights *as metaproperties* rather than as a dedicated API, but I
could not confirm this and will not assert it.

### 12.2 Brandfolder

`[CAT 2026-06-13]` Base `https://brandfolder.com/api/v4`; developer docs now hosted at
`developers.smartsheet.com/api/brandfolder` — **Brandfolder is a Smartsheet company (acquired August 2020)**.
Resources: organizations, brandfolders, collections, sections, assets, attachments, tags, custom fields,
labels, invitations, user permissions, webhooks. Bearer-token auth from
`brandfolder.com/profile#integrations`.

**Rate limits:** *"Brandfolder does not publicly document specific API rate limits."* `[CAT]` — expect `429`,
implement backoff, prefer webhooks over polling.

**Pricing:** `[CAT — DERIVED ESTIMATE, NOT VENDOR-PUBLISHED]` Premium *"$15,000–$50,000 per year"*,
Enterprise *"$20,000–$150,000+ per year"*, both annual contracts, quote-only.
**Treat these as an analyst's estimate, not a price list.** The catalogue itself notes *"Pricing is not
publicly available; contact sales."*

`[I]` The Smartsheet ownership is the strategically interesting fact: Brandfolder is being sold into
Smartsheet's work-management install base, which is the same buyer as ClickUp/Asana/Monday. A DAM bundled
into a PM suite is a different competitive shape from Bynder's standalone enterprise motion.

### 12.3 Frontify — the one that has already shipped the agentic layer

`[CAT 2026-07-19 / 2026-07-22]`

- **API shape:** a **per-instance GraphQL endpoint** — `https://{instance}.frontify.com/graphql`. Not REST.
- **Developer surface:** Brand SDK — **App Bridge**, **Frontify Finder**, **Frontify CLI** — for building
  **Content Blocks** and **Platform Apps** (i.e. Frontify is itself an extension platform).
- **Official hosted MCP server:** `https://mcp.frontify-integrations.com/`, transport HTTP, maturity
  **beta**, auth *"OAuth per the MCP specification (2025-11-25 authorization). Supports both Client ID
  Metadata Documents (CIMD) and Dynamic Client Registration (DCR)."*
- **Nine scoped permission packs** — each a distinct endpoint:

  | Pack | Scope |
  |---|---|
  | `admin` | Full access — all tools, no restrictions |
  | `discovery` | **Read-only exploration — no writes or mutations** |
  | `collaboration` | Comments, replies, workflow tasks |
  | `asset-organization` | Tags, targets, metadata, collections, folders |
  | `asset-creation` | Upload, update, tag, add metadata |
  | `creative-automation` | Template export and upload results |
  | `workflow-automation` | Full workflow lifecycle and comments |
  | `brand-admin` | Projects, folders, collections, asset moves |
  | `brand-portal` | List guidelines, read pages, browse library page assets |

- **Advertised capabilities:** brand/library/project discovery; cross-brand search with type filtering;
  asset retrieval, upload and creation (from URL or file); organising (tags, targets, custom metadata,
  collections, folders); **comments and annotations (read/add/reply)**; brand portals and guideline pages;
  **creative templates — list templates, export creatives with variables**; workflow automation (tasks,
  statuses, checklists).
- Frontify also publishes an **Agent Skills catalogue** (`Frontify/skills`, installable via
  `npx skills add Frontify/skills --skill <name>`) — though the catalogue notes these are *engineering*
  workflow skills, not API-operation skills.
- **Changelog:** `developer.frontify.com/changelog` exists and is dated, but is SPA-rendered; the catalogue
  captured **no entries**. `[U]`

`[I]` **The nine-pack model is the single best design idea in this document.** It is the correct answer to
"how do you let an agent touch a brand's assets without letting it delete the brand" — not one API key with
everything, but *named capability bundles the customer chooses per connection*. `[X]` `blueprint-c.md` F2
specifies an MCP server behind an Action Gate with dry-run defaults and scoped per-brand tokens; Frontify's
packs are the shipped proof that this shape works and that a customer will pick from a menu. **Copy the pack
model directly.**

### 12.4 Head-to-head: DAM vs. a scheduler's media library

| Capability | Bynder `[CAT]` | Frontify `[CAT]` | Brandfolder `[CAT]` | Typical scheduler media library `[X]` |
|---|---|---|---|---|
| Structured metadata with controlled options | ✅ metaproperties + options + taxonomy | ✅ custom metadata, targets | ✅ custom fields | ❌ free-text tags |
| Permissions **on metadata values** | ✅ `/content/access` | `[U]` | ✅ asset distribution permissions | ❌ |
| Auto-generated renditions | ✅ derivative presets | ✅ template export with variables | `[U]` | ❌ crop at publish |
| Review gate before entry | ✅ quarantine + review status | ✅ workflow statuses | `[U]` | ❌ |
| **Per-asset usage analytics** | ✅ events, downloads, views | `[U]` | ✅ analytics module `[CAT]` | ❌ post metrics only |
| Rules engine on assets | ✅ triggers/conditions/actions/rules | ✅ workflow automation | `[U]` | ❌ |
| Campaigns/jobs as objects | ✅ `/api/workflow/campaigns`, `/jobs` | ✅ tasks, statuses, checklists | `[U]` | ❌ |
| Brand guidelines as content | `[U]` | ✅ brand portals, guideline pages | ✅ brand portals | ❌ |
| Multi-brand partition | ✅ `/brands` | ✅ brands | ✅ organizations | ⚠️ workspaces, sometimes |
| Comments/annotations on assets | `[U]` | ✅ comments **and annotations** | `[U]` | ⚠️ comments on posts, not assets |
| Shareable curated sets with ACL | ✅ collections + share | ✅ collections | ✅ share links | ⚠️ folders |
| Webhooks | ✅ + source-IP allowlist | `[U]` | ✅ | ⚠️ rare |
| Recoverable delete | ✅ trash | `[U]` | `[U]` | ❌ |
| Official MCP server | ❌ | ✅ **9 scoped packs** | ❌ | ❌ |
| Price | `[U]` enterprise | `[U]` | `[CAT — estimate]` $15k–$150k+/yr | included |

### 12.5 What social schedulers actually have

`[X]` From this project's verified teardowns:

- **Buffer: no media library at all.** *"Buffer relies entirely on third-party storage integrations"* —
  Dropbox, OneDrive, Google Drive, Google Photos, Canva, Unsplash. Recorded as a **real gap**.
- **Vista Social:** the strongest of the peers — media library with folders, labels, cloud sync, stock,
  Canva; a `source` enum where **`openai` is a first-class value** so AI-generated images are tagged by
  provenance; `GET /media` filterable by `types[]`, `used[]`, `source[]`, `search`, `ids[]`. And still:
  **no Bynder, Brandfolder, Frontify, Box, Figma or Adobe Express integration** — explicitly "NOT FOUND".
- The peer comparison table in `23-scheduler-peers.md` lists "media library ✅" across five vendors, which
  in practice means *a folder with tags*.

### 12.6 The answer for us

`[I]` We should not build a DAM. We should build the **five DAM primitives that a social team actually
needs**, and integrate for the rest:

1. **Provenance and usage tracking.** Every asset knows which posts used it, on which networks, when, and how
   those posts performed. Bynder has usage analytics; no scheduler does; the n8n author in §9.4 explicitly
   wanted *"Asset tracking: Maintain records of which images were used where."* **This is the highest-value,
   lowest-cost DAM primitive and it is uniquely ours to build** — we are the only system that sees both the
   asset and the outcome. It also enables genuinely new features: "your top-performing asset this quarter",
   "you have used this image 14 times in 60 days", "don't reuse this asset on this account within 30 days".
2. **Derivative presets.** One master, auto-generated per-network crops (via Canva `POST /v1/resizes` §2.4
   for Canva-origin assets, in-house rendering otherwise). Never crop silently at publish.
3. **A review gate.** Assets can be marked `approved` / `needs review` / `expired`, and the composer refuses
   unapproved assets for brands that require it. This is Bynder's quarantine, scoped to what matters.
4. **Structured metadata with controlled options** on assets — campaign, pillar, rights-holder, usage-expiry
   date — with expiry actually enforced at publish time. (Rights/expiry is the one thing I could *not*
   verify in Bynder's API, which suggests it is under-served there too.)
5. **DAM connectors, not a DAM.** Bynder (REST + OAuth2 client-credentials), Frontify (GraphQL + their MCP),
   Brandfolder (REST v4 + bearer). Read assets, honour permissions, write usage back. Being the system that
   *reports usage back into the DAM* is a genuinely differentiated integration — it is the thing DAM buyers
   ask for and never get.

---

## 13. Slack and Microsoft Teams as approval and alert surfaces

### 13.1 Slack — the numbers that constrain design

`[CAT 2026-05-04]`

| Limit | Value |
|---|---|
| Tier 1 methods (e.g. `admin.*`) | **1 req/min** |
| Tier 2 (e.g. `conversations.history`) | **20 req/min** |
| Tier 3 (e.g. `conversations.list`) | **50 req/min** |
| Tier 4 (most methods) | **100 req/min** |
| **`chat.postMessage`** | **1 message/second per channel**, *"short bursts of up to 17/min allowed"* |
| Events API delivery | **30,000 events/hour per workspace per app**; *"beyond, events are dropped"* |

**Pricing `[CAT]`:** Free (**90 days** message history) · Pro **$7.25**/user/mo annual ($8.75 monthly) ·
Business+ **$15** annual ($18 monthly, adds SSO and compliance) · Enterprise Grid custom (typically 500+
users).

`[I]` The **1 msg/sec/channel** limit is the design constraint for alerting: a publishing failure storm across
50 accounts must be **aggregated into one message with a summary**, not fanned out. The **90-day free-tier
history** matters for a different reason — an approval trail that lives only in a free Slack workspace
*disappears*, which is precisely why approvals must be recorded in our system and only *surfaced* in Slack.

### 13.2 Microsoft Teams

`[U]` The catalogue's Teams "plans" file is a generic cloud-pricing placeholder ("per-service pay-as-you-go",
"1-year and 3-year commitments offer 30–72% discount") and is **not Teams pricing**. I will not report it.
The Teams catalogue does contain full OpenAPI/AsyncAPI/GraphQL/scopes material, but I did not have budget to
mine it; Teams' Graph-based bot and Adaptive Card model is well-known but **unverified in this session**.

### 13.3 The approval-surface design

`[I]` Evidence from §9.4 archetype 5: the approval gate people build is **an email with the creative and an
approve/reject decision**, because email reaches people who don't have a seat anywhere. Slack is second
(17 workflows), and n8n's `sendAndWait` exists precisely to bridge chat into workflow state.

The right design, therefore:

1. Approval **state lives in our system** (auditable, exportable, survives Slack's 90-day free tier).
2. It is **surfaced** into Slack/Teams as an interactive card with the per-network preview inline, and
   approve/reject/comment actions that write back.
3. And it is **simultaneously available as a seatless expiring web link** (Frame.io's `review_links` model,
   §7.1) for the client, the lawyer, and the franchise owner who will never join a Slack workspace.
4. Alerts are **aggregated per incident**, not per post (see the 1 msg/sec limit).

`[X]` `12-analytics-listening-gtm.md` rates the Slack app marketplace as *"good for the crisis alerting
product specifically"* — consistent.

---

## 14. Answers to the four key questions

### 14.1 What does the handoff between design tool and scheduler look like today, and where does it break?

**Today it is a manual file copy with total metadata loss.** `[V]`

The mechanically complete picture:

```
Designer works in Canva / Express / Figma
  │
  ├─ Canva: POST /v1/exports {png|jpg|mp4|pdf|pptx|gif|html_*|csv} → async job → signed URL
  ├─ Express: createRenditions({jpg|png|mp4|pdf|pptx}) → Blob in the add-on
  └─ Figma: GET /v1/images?format={jpg|png|svg|pdf}&scale=0.01–4 → URL, expires in 30 days
  │
  ▼
A FILE. Nothing else crosses the boundary.
  │
  ▼
Human re-enters: caption · per-network variants · first comment · alt text · link · UTM ·
                 hashtags · channels · scheduled time · approval state
```

**The eight specific breakages, all verified:**

| # | Break | Evidence |
|---|---|---|
| 1 | **No caption, link, UTM, alt text or approval state survives the export.** Export payloads carry format, URL, dimensions and (Canva only) a design token. | `[V]` Canva `BaseOutputFile`; Figma image response; Express `Rendition` |
| 2 | **No social size presets.** Canva's preset enum is `doc|email|presentation|whiteboard`. Every integrator ships its own dimension table or gets it wrong. | `[V]` |
| 3 | **Wrong-aspect exports silently letterbox** — *"the export defaults to the larger dimension."* | `[V]` Canva PNG export docs |
| 4 | **Export quality depends on the user's design-tool plan.** Canva Free caps PNG upscale at **1.125×**. | `[V]` |
| 5 | **Figma cannot export video at all** (`jpg|png|svg|pdf`) — so any brand doing Reels in Figma is exporting stills and editing elsewhere. | `[V]` |
| 6 | **Figma render URLs expire after 30 days**, so a naive "link the asset" integration rots. | `[V]` |
| 7 | **Everything is async and rate-limited.** Canva creation endpoints are **20/client-user**; identity is **10**. Bulk months of content will queue. | `[V]` |
| 8 | **The design tool never learns what happened.** Nothing writes performance, publish status, or "this version went live" back to the design. Canva has a comments API we could write to, and nobody does. | `[V]` `[I]` |

**Where it should break instead — the fix, in order of leverage `[I]`:**

1. **Canva Content Publisher Intent app** (§2.6) — the handoff stops being a file copy and becomes a
   first-class publish action *inside the design tool*, carrying caption, channels, schedule and a signed
   `designToken` that lets us re-open the design later.
2. **Resize-on-ingest** using `POST /v1/resizes` — one design becomes every aspect ratio automatically.
3. **Round-trip identity** — store the `designToken` / Figma `file_key`+`node_id` on the post, so "edit the
   creative" reopens the source rather than starting a new file.
4. **Figma `FILE_VERSION_UPDATE` webhook → re-render → update queued post** — a genuinely novel feature for
   design-led brands.
5. **Write back** — post a comment to the Canva design with the published permalink and 7-day performance.
   Cheap, delightful, and it puts our brand inside their design file.

### 14.2 What do people build in Zapier/Make because no scheduler does it natively?

Answered at length in §9, with 2,053 workflows of evidence. The short list, in the order the corpus supports:

1. **Publish from an external table with status write-back** — Sheets (48), Airtable (23), Notion (6).
   Verified templates: *"Notion to Linkedin"*, *"Publish Videos & Images - Blotato"*, *"AI Social Media
   Publisher from WordPress"*.
2. **Cloud-folder watch → transcribe → AI caption → multi-network publish** — verified template
   *"google drive to instagram, tiktok and youtube"*; Drive appears in 39 social workflows.
3. **AI content factory with an approval gate** — verified template *"✨🩷Automated Social Media Content
   Publishing Factory"*, with a Gmail approval step and an `Is Approved?` branch before a publishing router.
4. **Generative video → auto-publish** — at least 6 named templates using Kling/Flux/ElevenLabs + Blotato or
   upload-post.
5. **Failure alerting** to Telegram/Slack/email, present in nearly every archetype (`errorTrigger` → notify).
6. **Multi-destination archiving** of both the creative and the post JSON, for content libraries, compliance
   records and performance correlation — the workflow author's own stated reasons.
7. **Asset-usage tracking** — *"Maintain records of which images were used where."*
8. **Cross-repost** — YouTube→X, WordPress→everywhere, Hacker News→video→everywhere.
9. **Pinterest board-ID discovery** — one template ships a "Pinterest Page Sleuth" sub-flow that scrapes a
   board page for its ID, because the publisher API demands a board ID the user cannot find. `[V]` A
   perfect, tiny example of a UX failure becoming an automation.
10. **Per-network guardrails** — an `openAi` node literally named **"Ensure Valid YouTube Title"** exists
    because *"my incoming Titles were over the 100 character limit."*

And the meta-finding: **they build all of this against `upload-post` and `blotato`, not against Buffer or
Hootsuite**, because those APIs are closed or gated. An open, self-serve publishing API with a first-party
n8n node and a Zapier app is a direct wedge.

### 14.3 What does a DAM give brand teams that a scheduler's "media library" does not?

Fully tabulated in §12.4. The seven that actually change a brand team's day `[CAT]` + `[I]`:

1. **Controlled-vocabulary metadata**, not tags — with managed option lists and a real taxonomy service.
2. **Permissions on metadata values** (`/api/1/content/access`) — regional/legal/franchise segmentation that
   role-based workspace permissions cannot express.
3. **Derivative presets** — one master, policy-generated renditions, so nobody publishes a hand-cropped logo.
4. **A quarantine gate** — assets are reviewed *before* they can be used, not after they're published.
5. **Per-asset analytics** — which asset was downloaded, viewed and used, independent of any one post.
6. **A rules engine and a workflow object model** — triggers/conditions/actions, campaigns and jobs.
7. **Brand guidelines as first-class content** (Frontify: brand portals, guideline pages, creative templates
   with variables) — the "why" behind the asset, not just the file.

And the one thing **no DAM has that we uniquely could**: `[I]` **the outcome.** A DAM knows an asset was
downloaded 340 times. Only the publishing system knows that the asset earned 1.2M impressions on Reels and
underperformed on LinkedIn. Closing that loop — asset → post → performance → asset scorecard — is a feature
neither category can build alone, and we are the only side of the boundary that can.

### 14.4 Which approval mechanics from Frame.io/Filestage have no equivalent in social tools?

`[V]` for Frame.io V2 mechanics; `[U]` for Frame.io V4 and for Filestage entirely.

| Mechanic | Frame.io | Any social tool `[X]` | Difficulty for us |
|---|---|---|---|
| **Time-coded comments** — `{ text, timestamp, annotation }` on an asset | ✅ | ❌ **none** | Medium — player + comment rail |
| **Drawn annotations** — serialized annotation payload pinned to a frame | ✅ | ❌ **none** | Medium — canvas overlay + serialisation |
| **Version stacks** — `POST /assets/{id}/version`, new file replaces old **in place**, history preserved | ✅ | ❌ **none** (replacing media orphans feedback) | Medium — post→creative must be a versioned 1:N relation |
| **Seatless external reviewers** — `review_links` with `password`, `expires_at`, `is_active` | ✅ | ❌ approvers consume seats | **Low–medium — and the highest-value single feature in this table** |
| **Per-link content scoping** — `review_links/{id}/items` controls exactly which assets a link exposes | ✅ | ❌ | Low |
| **Presentation links distinct from review links** — polished share vs. working review | ✅ | ❌ | Low |
| **Pending-collaborator state** — invited-but-not-joined is modelled | ✅ | ⚠️ rare | Low |
| **Comment replies as a first-class resource** | ✅ | ⚠️ mostly flat | Low |
| Asset-level audit log | ✅ | ⚠️ enterprise tiers only | Medium |

`[I]` **The three to build, in order:**

1. **Seatless, expiring, password-protected, scope-limited review links.** Every agency and every franchise
   brand needs this; every scheduler makes them buy a seat or email a screenshot. It is also a *viral
   surface* — `[X]` `12-analytics-listening-gtm.md` identifies "the product's output is a URL a non-user
   opens" as the strongest growth mechanic in the category, and a review link is exactly that.
2. **Versioned creative with preserved feedback.** v1→v4 under one post, comments and approvals intact.
3. **Time-coded comments on video creative.** With short-form video now the dominant format, "the disclosure
   card at 0:07 is too fast" is a real review comment that currently has nowhere to live.

---

## 15. The absorb-the-tab parity checklist

`[I]` Consolidated feature inventory, scored for whether we should build it, integrate it, or ignore it.

| # | Capability | Where it lives today | Evidence | Verdict |
|---|---|---|---|---|
| 1 | Register as a publish destination inside the design tool | Canva Content Publisher Intent | `[V]` §2.6 | **BUILD — highest priority in this document** |
| 2 | Programmatic multi-aspect-ratio resize of one design | Canva `POST /v1/resizes` | `[V]` §2.4 | **BUILD** |
| 3 | Round-trip design identity (design token on the post) | Canva `designToken` JWT; Figma `file_key`+`node_id` | `[V]` | **BUILD** |
| 4 | Feed our content calendar into Bulk Create | Canva Data Connector Intent | `[V]` §2.6.2 | **BUILD (cheap)** |
| 5 | Our asset library browsable inside the design tool | Canva DAM example app pattern | `[V]` §2.6.3 | Build after #16 |
| 6 | Re-render creative when the design file changes | Figma `FILE_VERSION_UPDATE` webhook | `[V]` §4.3 | **BUILD (differentiator)** |
| 7 | Live bidirectional binding to Google Sheets | Nowhere — everyone uses CSV import | `[V]` §10 | **BUILD — flagship** |
| 8 | Same for Airtable (5 rps, 10 rec/write) and Notion (3 rps) | n8n templates | `[V]` §5, §9.4 | **BUILD** |
| 9 | Pre-publish validation against the real per-network matrix, errors written back to the source | Nowhere | `[V]` §9.5 verbatim complaints | **BUILD — cheapest win** |
| 10 | Cloud-folder watch → auto-caption → auto-publish | n8n + upload-post | `[V]` §9.4 A1 | **BUILD** |
| 11 | Multi-stage approval with a real state machine | Partially in schedulers; improvised in n8n | `[V]` `[X]` | **BUILD** |
| 12 | **Seatless expiring password-protected review links** | Frame.io `review_links` | `[V]` §7.1 | **BUILD — growth surface** |
| 13 | Versioned creative with preserved feedback | Frame.io version stacks | `[V]` §7.1 | **BUILD** |
| 14 | Time-coded + annotated comments on video creative | Frame.io | `[V]` §7.1 | **BUILD (phase 2)** |
| 15 | Approval surfaced into Slack/Teams, state stored by us | n8n `sendAndWait`, Gmail gates | `[V]` §13 | **BUILD** |
| 16 | Asset provenance + usage tracking (which asset went where, and how it did) | Nobody — DAMs have usage, we have outcomes | `[V]` `[CAT]` §12.6 | **BUILD — uniquely ours** |
| 17 | Derivative presets on assets | Bynder | `[CAT]` §12.1 | **BUILD** |
| 18 | Asset review gate (quarantine) + usage-expiry enforced at publish | Bynder quarantine; rights `[U]` | `[CAT]` `[U]` | **BUILD (light)** |
| 19 | DAM connectors: Bynder / Frontify / Brandfolder, reading assets and **writing usage back** | Nobody in social — Vista Social explicitly lacks all three | `[X]` `[CAT]` | **INTEGRATE** |
| 20 | Cloud-storage connectors: Drive, Dropbox, OneDrive, Box (honouring Box classifications) | Buffer et al. have pickers only | `[X]` `[CAT]` | **INTEGRATE** |
| 21 | Aggregated publish-failure alerting to Slack/Teams/email | Improvised everywhere | `[V]` §9.4 | **BUILD** |
| 22 | Multi-destination archive of published creative + post JSON | Improvised | `[V]` §9.4 A5 | **BUILD (falls out of #16)** |
| 23 | Open self-serve publishing API + **official n8n node** + Zapier app + Make module | upload-post and Blotato own this | `[V]` §9.3 | **BUILD — direct wedge** |
| 24 | Embed Zapier templates natively in-product via the Partner API | Rare | `[V]` §9.6 | **BUILD (cheap)** |
| 25 | MCP server with **Frontify-style scoped permission packs** | Frontify has it; no social tool does | `[CAT]` §12.3 | **BUILD — copy the pack model** |
| 26 | Task creation in ClickUp/Asana/Monday/Trello on approval events | — | `[CAT]` §6 | Integrate, shallow |
| 27 | Adobe Express add-on | — | `[V]` §3 | Build **second**, post-LDS |
| 28 | Miro | — | `[CAT]` §11 | **IGNORE** |

---

## 16. Recommended sequencing

`[I]`

**Phase 1 — the two wedges (weeks 0–8)**
1. **Canva Content Publisher Intent app.** Output types for the top networks with correct `mediaSlots`
   (`fileCount`, `aspectRatio`, `durationMs`), our composer UI as the settings panel, our post preview as
   the preview panel, `publishContent` into our queue returning `externalId`/`externalUrl`. Enforce our own
   plan limits via `AppError` with a `localizedMessageId`. Budget for the Canva review bar (i18n, CORS,
   error handling, no console).
2. **Connected Sheet.** Column mapper + dry-run validation with errors written back into the sheet + live
   sync + status write-back. Airtable and Notion drivers behind the same mapper.

**Phase 2 — the approval product (weeks 6–16)**
3. Multi-stage approval state machine.
4. **Seatless expiring scoped review links** (this is also a growth surface).
5. Versioned creative with preserved feedback.
6. Slack/Teams approval cards, with aggregated alerting.

**Phase 3 — the asset layer (weeks 12–24)**
7. Asset provenance and usage tracking (asset → post → network → performance).
8. Derivative presets; Canva `POST /v1/resizes` for Canva-origin assets.
9. Cloud-storage connectors (Drive, Dropbox, OneDrive, Box), then DAM connectors (Bynder, Frontify,
   Brandfolder) with **usage write-back**.

**Phase 4 — the automation surface (weeks 16–28)**
10. Open publishing API, official n8n node, Zapier app, Make module.
11. MCP server with Frontify-style scoped packs.
12. Zapier Partner API embed in-product.

**Explicitly not doing:** Miro. Deep ClickUp/Asana/Monday/Trello field modelling. Building a DAM.

---

## 17. Open questions — what must be re-verified when egress returns

Ordered by how much a wrong assumption would cost.

| # | Question | Why it matters |
|---|---|---|
| 1 | **Canva Content Planner**: networks, scheduling model, approvals, analytics, plan gating, native vs. reminder publishing | Determines whether Canva is a partner or a competitor. Currently 100% `[U]`. |
| 2 | Canva Apps review timeline, approval rate, and whether Content Publisher apps are gated to specific partners | Determines whether recommendation #1 is achievable |
| 3 | Canva pricing (Free/Pro/Teams/Enterprise) and which tiers gate Content Planner and Brand Kit | `[U]` — canva.com blocked |
| 4 | **Frame.io V4**: comment/annotation model, Share vs. Review objects, whether external reviewers are still seatless under Adobe licensing, C2C | All Frame.io mechanics here are V2, last touched 2024-06-11 |
| 5 | **Filestage** — entirely unverified: review rounds, reviewer seats, versioning, file types, pricing | A whole competitor-adjacent product with zero verified facts |
| 6 | Real user criticism from G2 / Capterra / Reddit / X for every product here | Only source obtained was n8n sticky notes |
| 7 | Google Sheets and Drive real API quotas | Catalogue values are explicit placeholders |
| 8 | Microsoft Teams pricing and Graph limits | Catalogue value is a generic cloud placeholder |
| 9 | Bynder / Frontify actual list pricing; Brandfolder's real (not estimated) contract range | Only a derived estimate obtained |
| 10 | Whether Bynder models usage rights / licence expiry / embargo (zero keyword matches across 20 specs) | Determines whether #18 is a gap in DAMs too |
| 11 | Monday.com GraphQL surface and rate limits | No spec in the catalogue |
| 12 | Zapier's actual most-popular social Zap templates (via `GET /v1/zap-templates?apps=…` once reachable) | Would directly validate §9.4 against Zapier's population rather than n8n's |
| 13 | Adobe Express's own consumer social-scheduling feature, if any | Changes the Express calculus |
| 14 | Canva `brands` tag — is there a private/preview `/v1/brands*` surface? | Brand governance depth |

---

## 18. Sources

Every source below was obtained in this session by `git clone`, npm tarball download, or `raw.githubusercontent.com`
fetch. Vendor websites were unreachable; nothing in this document is from a search snippet.

| Source | Type | Freshness | Used for |
|---|---|---|---|
| `github.com/canva-sdks/canva-connect-api-starter-kit` → `openapi/spec.yml` (12,189 lines) | Official OpenAPI 3.0.0 | HEAD 2026-07-30; spec version `2024-06-18`; refreshed 2026-05-07 | §2.2–2.5 — every Canva Connect path, scope, rate limit, export format |
| same repo → `CHANGELOG.md` | Official changelog | latest entry 2026-07-30 | Freshness verification |
| `github.com/canva-sdks/canva-apps-sdk-starter-kit` | Official starter kit + examples | CHANGELOG latest 2026-08-06 | §2.6 — intents, examples, package versions |
| `@canva/intents@2.6.0` (npm tarball) → `content/index.d.ts` (1,801 lines), `data/index.d.ts` | Official type definitions | v2.6.0 | §2.6.1–2.6.2 — the literal Content Publisher and Data Connector contracts |
| `@canva/design` (npm) | Version check | latest 2.11.0 | Version currency |
| `github.com/AdobeDocs/express-add-ons-docs` (253 md files) | Official docs repo | HEAD 2026-07-29; changelog latest 2026-06-18 | §3 — renditions, formats, OAuth, Large Document Support, MCP server |
| `github.com/figma/rest-api-spec` → `openapi/openapi.yaml` | Official OpenAPI 3.1.0 | v0.42.0, HEAD **2026-08-11** | §4 — paths, render params, expiry, webhook events |
| `github.com/Frameio/python-frameio-client` | Official SDK (V2) | **last commit 2024-06-11 — STALE** | §7.1 — comment/version/review-link mechanics |
| `github.com/Danitilahun/n8n-workflow-templates` (2,053 workflow JSON files, ~40MB) | Community corpus | HEAD 2026-08 | §9 — all frequency analysis, archetypes, verbatim criticism |
| `github.com/ScraperNode/awesome-n8n-templates`, `zengfr/n8n-workflow-all-templates`, `enescingoz/awesome-n8n-templates` | Corpus-size cross-checks | 2026-08 | §9.1 — 8,697 / 10,258 / 24.6k★ |
| `github.com/api-evangelist/bynder` (20 OpenAPI specs + scopes + auth) | Third-party API catalogue | generated 2026-07-11 | §12.1 |
| `github.com/api-evangelist/frontify` (apis.yml, mcp, skills, changelog) | Third-party catalogue | 2026-07-19 / 2026-07-22 | §12.3 |
| `github.com/api-evangelist/brandfolder` (apis.yml, plans, rate-limits) | Third-party catalogue | 2026-06-13 | §12.2 — pricing is a **derived estimate** |
| `github.com/api-evangelist/{zapier,make,slack,notion,airtable,clickup,asana,trello,miro,box,dropbox,canva,google-sheets,microsoft-teams,monday}` | Third-party catalogues | plans/rate-limits generated 2026-05-04 to 2026-05-08 | §5, §6, §8, §9.6, §11, §13 |
| `github.com/api-evangelist/zapier` → `openapi/zapier-zap-templates-api-openapi.yml`, `collections/zapier-partner-api.opencollection.json` | Official Zapier Partner API spec (v2024.11.0), mirrored | — | §9.6 |
| `/home/user/SMM/research/01,05,09,11,12,20,21,22,23` | This project's prior verified research | 2026-08-12 | All `[X]` cross-references |

**Probed and confirmed absent:** `api-evangelist/filestage`, `api-evangelist/frame-io`. Frame.io V4 and
Filestage have no reachable machine-readable public artefact. `[U]`

---

*End of document. Fourteen items in §17 remain unverified and are marked as such throughout; nothing in this
document should be treated as fact unless it carries `[V]` or an explicitly dated `[CAT]`.*
