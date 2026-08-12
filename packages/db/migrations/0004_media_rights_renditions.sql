-- Media provenance, renditions and a rights ledger that can block a publish.
--
-- 0001 treated an asset as a file row. An asset is really an object with a
-- life: it is transcoded per network, replaced by newer versions, generated or
-- modified by a model, and licensed for a limited time in limited places.
-- Four absences, one root cause.
--
-- The rights ledger is the part with teeth. Expiry dates on UGC permissions and
-- stock licences are routinely tracked in a spreadsheet nobody opens, so
-- expired content keeps being recycled — which is how a brand ends up using a
-- creator's photo eight months after the agreement lapsed. Holding the grant
-- next to the asset lets the publish path refuse, rather than relying on
-- somebody remembering.

BEGIN;

-- ---------------------------------------------------------------------------
-- Asset identity: two hashes, not one
-- ---------------------------------------------------------------------------

-- 0001 conflated these. They answer different questions and need different
-- indexes: "is this byte-for-byte the same file we already stored" is an exact
-- hash and a uniqueness constraint, while "is this the same picture, resized
-- and re-saved" is a perceptual hash and a similarity lookup.
ALTER TABLE media_assets RENAME COLUMN content_hash TO perceptual_hash;
ALTER TABLE media_assets ADD COLUMN exact_hash bytea;

DROP INDEX IF EXISTS media_assets_hash_idx;

CREATE INDEX media_assets_phash_idx ON media_assets (organization_id, perceptual_hash)
    WHERE perceptual_hash IS NOT NULL AND deleted_at IS NULL;

-- Deduplicates uploads within a tenant. Scoped to the organization because two
-- customers uploading the same stock photo are unrelated events.
CREATE UNIQUE INDEX media_assets_exact_idx ON media_assets (organization_id, exact_hash)
    WHERE exact_hash IS NOT NULL AND deleted_at IS NULL;

-- Publer surfaces a used/unused flag, which is genuinely useful for finding
-- material that has never run. A count with a first-use date answers more:
-- which creative is over-exposed, and which has been sitting unused.
ALTER TABLE media_assets
    ADD COLUMN use_count     integer NOT NULL DEFAULT 0,
    ADD COLUMN first_used_at timestamptz,
    ADD COLUMN last_used_at  timestamptz;

-- ---------------------------------------------------------------------------
-- Provenance and AI disclosure
-- ---------------------------------------------------------------------------

-- These columns are not optional metadata. Meta, TikTok and YouTube all require
-- AI-generated content to be labelled, and the EU AI Act imposes transparency
-- duties independently. If we cannot say whether an asset was generated, we
-- cannot make the disclosure, and the obligation does not go away because our
-- schema was inconvenient.
ALTER TABLE media_assets
    ADD COLUMN origin              text    NOT NULL DEFAULT 'upload',
    ADD COLUMN ai_generated        boolean NOT NULL DEFAULT false,
    ADD COLUMN ai_modified         boolean NOT NULL DEFAULT false,
    ADD COLUMN ai_model            text,
    ADD COLUMN ai_model_version    text,
    -- The prompt itself may contain a customer's confidential brief, so only its
    -- hash is retained — enough to prove two assets came from the same prompt
    -- without storing the brief.
    ADD COLUMN ai_prompt_hash      bytea,
    -- Drives the stricter disclosure and consent rules that apply to synthetic
    -- likenesses of real people.
    ADD COLUMN depicts_real_person boolean NOT NULL DEFAULT false,
    ADD COLUMN human_reviewed_by   uuid REFERENCES users (id) ON DELETE SET NULL,
    ADD COLUMN human_reviewed_at   timestamptz,
    -- C2PA content credentials travel with the file, but most transcoding
    -- pipelines silently strip them. Recording whether ours preserved them is
    -- the difference between claiming provenance and having it.
    ADD COLUMN c2pa_present        boolean NOT NULL DEFAULT false,
    ADD COLUMN c2pa_preserved_through_transcode boolean;

ALTER TABLE media_assets ADD CONSTRAINT media_assets_origin_known
    CHECK (origin IN ('upload', 'ai_generated', 'ugc_capture', 'stock',
                      'creator_delivery', 'client_intake', 'clip_extract'));

-- A generated asset must say what generated it, or the disclosure is unfounded.
ALTER TABLE media_assets ADD CONSTRAINT media_assets_ai_has_model
    CHECK (NOT ai_generated OR ai_model IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Alt text provenance
-- ---------------------------------------------------------------------------

-- Wrong alt text is worse than none. A screen reader user given a confident,
-- inaccurate description has been actively misled, where an absent one at least
-- signals that something is there. A vision-model draft is therefore allowed to
-- exist but not to publish until a human confirms it.
ALTER TABLE media_assets
    ADD COLUMN alt_text_source       text NOT NULL DEFAULT 'human',
    ADD COLUMN alt_text_confirmed_by uuid REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE media_assets ADD CONSTRAINT media_assets_alt_source_known
    CHECK (alt_text_source IN ('human', 'ai_draft', 'ai_confirmed', 'imported'));

ALTER TABLE media_assets ADD CONSTRAINT media_assets_alt_draft_unconfirmed
    CHECK (alt_text_source <> 'ai_draft'
           OR alt_text IS NULL
           OR alt_text_confirmed_by IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Versions
-- ---------------------------------------------------------------------------

-- Replace the file, keep the conversation. Design review tools have had this
-- for years and social tools have not: today, correcting a typo in a graphic
-- means uploading a new asset and losing every comment attached to the old one,
-- so feedback is scattered across assets nobody can reassemble.
CREATE TABLE asset_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id  uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    version         integer     NOT NULL,
    storage_key     text        NOT NULL,
    mime_type       text        NOT NULL,
    bytes           bigint      NOT NULL,
    width           integer,
    height          integer,
    duration_sec    numeric(10, 3),
    exact_hash      bytea,
    note            text,
    created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (media_asset_id, version),
    CONSTRAINT asset_versions_version_positive CHECK (version > 0),
    CONSTRAINT asset_versions_bytes_positive CHECK (bytes > 0)
);

CREATE INDEX asset_versions_asset_idx ON asset_versions (media_asset_id, version DESC);

-- ---------------------------------------------------------------------------
-- Renditions
-- ---------------------------------------------------------------------------

-- One source asset becomes many files, because the networks disagree about
-- everything: aspect ratio, codec, duration and file size. Deriving these on
-- demand at publish time would put a multi-minute transcode inside the critical
-- path of a scheduled post, so they are produced ahead of time and recorded.
CREATE TABLE asset_renditions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id  uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    -- What this rendition is for: a network and format pair, or a generic
    -- purpose such as a thumbnail.
    purpose         text        NOT NULL,
    storage_key     text        NOT NULL,
    mime_type       text        NOT NULL,
    bytes           bigint      NOT NULL,
    width           integer,
    height          integer,
    duration_sec    numeric(10, 3),
    -- The operations applied — crop, scale, watermark, subtitle burn-in — so a
    -- rendition can be reproduced and audited rather than being an opaque file.
    transform       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    c2pa_preserved  boolean,
    -- Invalidated when the source asset gains a new version.
    stale           boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (media_asset_id, purpose),
    CONSTRAINT asset_renditions_bytes_positive CHECK (bytes > 0)
);

CREATE INDEX asset_renditions_asset_idx ON asset_renditions (media_asset_id)
    WHERE NOT stale;

-- Reusable watermark and signature definitions.
--
-- Agencies pay for this specifically: a per-client logo bug and an attribution
-- signature applied consistently at publish time, rather than baked into each
-- file by hand.
CREATE TABLE brand_marks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    name             text        NOT NULL,
    kind             text        NOT NULL,
    -- The image drawn onto the media, for watermarks.
    media_asset_id   uuid        REFERENCES media_assets (id) ON DELETE SET NULL,
    -- Appended to the post body, for text signatures.
    text_template    text,
    -- Placement, opacity, scale and margin.
    placement        jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at       timestamptz NOT NULL DEFAULT now(),

    UNIQUE (profile_group_id, name),
    CONSTRAINT brand_marks_kind_known CHECK (kind IN ('watermark', 'signature')),
    -- A watermark needs an image; a signature needs text. Neither is optional
    -- for its own kind, and a mark that renders nothing is a silent no-op.
    CONSTRAINT brand_marks_has_content
        CHECK ((kind = 'watermark' AND media_asset_id IS NOT NULL)
            OR (kind = 'signature' AND text_template IS NOT NULL))
);

-- ---------------------------------------------------------------------------
-- The rights ledger
-- ---------------------------------------------------------------------------

-- What we are allowed to do with an asset, where, on which channels, and until
-- when.
--
-- Rights are tracked today in spreadsheets that nobody opens, which is how a
-- creator's photo ends up still running eight months after the agreement
-- lapsed. Recording the grant next to the asset makes expiry checkable, and
-- makes it checkable at the one moment that matters — immediately before
-- publishing.
CREATE TABLE asset_rights (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    media_asset_id   uuid        NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,

    grant_type       text        NOT NULL,
    -- Who granted it, and the evidence. A permission with no record of who gave
    -- it is not a permission, it is a recollection.
    granted_by_name  text,
    granted_by_handle text,
    granted_via      text,
    evidence_url     text,

    starts_on        date        NOT NULL DEFAULT CURRENT_DATE,
    -- Null is a perpetual grant. Deliberately not defaulted to a date, because
    -- guessing an expiry is worse than recording that there is none.
    expires_on       date,

    -- Empty arrays mean unrestricted. Restrictions are the exception and
    -- requiring every grant to enumerate the world would be unusable.
    territories      text[]      NOT NULL DEFAULT '{}',
    channels         text[]      NOT NULL DEFAULT '{}',
    usage_types      text[]      NOT NULL DEFAULT '{}',

    -- Organic use is often granted while paid use is not, and boosting a post
    -- containing unlicensed footage is the expensive version of this mistake.
    allows_paid      boolean     NOT NULL DEFAULT false,
    allows_modification boolean  NOT NULL DEFAULT true,
    -- Some grants require the creator be credited on every use.
    attribution_required boolean NOT NULL DEFAULT false,
    attribution_text text,

    revoked_at       timestamptz,
    revoked_reason   text,
    created_by       uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT asset_rights_grant_type_known
        CHECK (grant_type IN ('owned', 'ugc_permission', 'stock_license',
                              'creator_contract', 'model_release', 'music_license')),
    CONSTRAINT asset_rights_window_ordered
        CHECK (expires_on IS NULL OR expires_on >= starts_on),
    CONSTRAINT asset_rights_attribution_has_text
        CHECK (NOT attribution_required OR attribution_text IS NOT NULL)
);

CREATE INDEX asset_rights_asset_idx ON asset_rights (media_asset_id)
    WHERE revoked_at IS NULL;

-- Drives the expiry warnings that let someone renew a licence before it lapses
-- rather than after.
CREATE INDEX asset_rights_expiring_idx ON asset_rights (organization_id, expires_on)
    WHERE revoked_at IS NULL AND expires_on IS NOT NULL;

-- Whether an asset may be published on a given channel, on a given date, for a
-- given usage.
--
-- A function rather than a view so the publish path asks a direct question and
-- gets a direct answer. Returns false when no grant exists at all: an asset
-- with unknown rights is not clearly usable, and defaulting to permitted is how
-- unlicensed material reaches a client's feed.
CREATE FUNCTION asset_rights_permit(
    p_asset_id uuid,
    p_channel  text,
    p_on       date DEFAULT CURRENT_DATE,
    p_paid     boolean DEFAULT false
) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM asset_rights r
        WHERE r.media_asset_id = p_asset_id
          AND r.revoked_at IS NULL
          AND r.starts_on <= p_on
          AND (r.expires_on IS NULL OR r.expires_on >= p_on)
          AND (cardinality(r.channels) = 0 OR p_channel = ANY (r.channels))
          AND (NOT p_paid OR r.allows_paid)
    );
$$;

COMMENT ON FUNCTION asset_rights_permit IS
    'True when a live, unexpired grant covers this asset for the channel, date and usage. False when no grant exists — unknown rights are treated as no rights.';

COMMIT;
