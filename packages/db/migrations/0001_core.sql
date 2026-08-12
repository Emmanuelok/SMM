-- Core multi-tenant schema.
--
-- The tenancy shape follows the containment model the market has converged on:
--
--   organization -> profile group -> social profile
--
-- A profile group is a brand, client, project, or location. It is the unit that
-- content, permissions, approvals and reporting all scope to, which keeps one
-- client's content from ever co-mingling with another's inside an agency
-- account.
--
-- Every tenant-owned table carries organization_id directly rather than
-- reaching it through a join. It is denormalised on purpose: row-level security
-- policies have to be cheap and, more importantly, obviously correct. A policy
-- that reads one column on the row it is protecting is far harder to get wrong
-- than one that traverses two joins to find the owner.

BEGIN;

-- gen_random_uuid() for primary keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Case-insensitive text, so an email or slug cannot be duplicated by case.
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------

CREATE TABLE organizations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text        NOT NULL,
    slug            citext      NOT NULL UNIQUE,
    -- Billing is driven by connected profile count rather than seats, so the
    -- entitlement lives here and is checked when a profile is connected.
    plan            text        NOT NULL DEFAULT 'trial',
    profile_limit   integer     NOT NULL DEFAULT 5,
    -- Where this tenant's data must live. Set at creation and never changed,
    -- because moving a tenant across regions is a migration, not an update.
    data_region     text        NOT NULL DEFAULT 'eu-west-1',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,

    CONSTRAINT organizations_profile_limit_positive CHECK (profile_limit >= 0)
);

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           citext      NOT NULL UNIQUE,
    name            text        NOT NULL,
    avatar_url      text,
    -- IANA zone. Scheduling is meaningless without it, and defaulting to the
    -- server's zone silently mis-schedules for everyone outside it.
    timezone        text        NOT NULL DEFAULT 'UTC',
    locale          text        NOT NULL DEFAULT 'en',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE TYPE org_role AS ENUM (
    'owner',        -- full control including billing and deletion
    'admin',        -- full control except closing the account
    'member',       -- access governed entirely by profile group grants
    'read_only'
);

CREATE TABLE organization_members (
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role            org_role    NOT NULL DEFAULT 'member',
    created_at      timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX organization_members_user_idx ON organization_members (user_id);

-- ---------------------------------------------------------------------------
-- Profile groups: the brand / client / project container
-- ---------------------------------------------------------------------------

CREATE TABLE profile_groups (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    -- Content calendars, optimal posting times and reporting windows are all
    -- computed in the brand's own zone, not the viewing user's.
    timezone        text        NOT NULL DEFAULT 'UTC',
    -- Brand voice, banned words, required disclosures. Consumed by the AI layer
    -- and by pre-publish checks.
    brand_voice     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,

    UNIQUE (organization_id, name)
);

CREATE INDEX profile_groups_org_idx ON profile_groups (organization_id) WHERE deleted_at IS NULL;

CREATE TYPE access_level AS ENUM ('none', 'view', 'contribute', 'manage');

-- Per-group access grants. A member with no row for a group cannot see it at
-- all: the group is absent from their dashboard rather than shown-but-locked.
CREATE TABLE profile_group_access (
    profile_group_id uuid         NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    user_id          uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    organization_id  uuid         NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    -- 'contribute' can compose but never publish directly; their posts always
    -- enter an approval workflow.
    level            access_level NOT NULL DEFAULT 'view',
    created_at       timestamptz  NOT NULL DEFAULT now(),

    PRIMARY KEY (profile_group_id, user_id)
);

CREATE INDEX profile_group_access_user_idx ON profile_group_access (user_id);

-- Named sets of people, so an approval step can name a team rather than an
-- individual and keep working when that individual is on leave.
CREATE TABLE user_groups (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    name            text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (organization_id, name)
);

CREATE TABLE user_group_members (
    user_group_id uuid NOT NULL REFERENCES user_groups (id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    PRIMARY KEY (user_group_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Credentials
-- ---------------------------------------------------------------------------

-- Encrypted OAuth material, isolated in its own table.
--
-- Nothing here is ever selected by ordinary application queries; access goes
-- through the token vault service. Keeping ciphertext out of the tables that
-- routine queries touch means an over-broad SELECT elsewhere cannot leak
-- credentials, and it keeps the blast radius of a query-level bug small.
CREATE TABLE credentials (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    -- Ciphertext only. Plaintext tokens must never reach this database.
    access_token_enc  bytea       NOT NULL,
    refresh_token_enc bytea,
    -- Identifies the data key used, so keys can be rotated without re-reading
    -- every row at once.
    key_id            text        NOT NULL,
    expires_at        timestamptz,
    scopes            text[]      NOT NULL DEFAULT '{}',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    -- Set when the platform tells us the grant is gone, so the reconnect
    -- prompt can be raised before the next scheduled post fails.
    revoked_at        timestamptz
);

CREATE INDEX credentials_org_idx ON credentials (organization_id);
CREATE INDEX credentials_expiring_idx ON credentials (expires_at)
    WHERE revoked_at IS NULL AND expires_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Connected social accounts
-- ---------------------------------------------------------------------------

CREATE TYPE profile_status AS ENUM (
    'active',
    'needs_reconnect',  -- token expired or revoked; user action required
    'restricted',       -- platform-side suspension or limitation
    'disconnected'
);

CREATE TABLE social_profiles (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid           NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id  uuid           NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    network           text           NOT NULL,
    -- The account's id on the network: a page id, channel id, or DID. Not
    -- assumed to be stable or globally unique across networks.
    remote_account_id text           NOT NULL,
    handle            text,
    display_name      text           NOT NULL,
    avatar_url        text,
    credential_id     uuid           REFERENCES credentials (id) ON DELETE SET NULL,
    status            profile_status NOT NULL DEFAULT 'active',
    -- Platform-specific extras: page tokens, business account ids, actor URNs.
    metadata          jsonb          NOT NULL DEFAULT '{}'::jsonb,
    connected_at      timestamptz    NOT NULL DEFAULT now(),
    -- Pinterest and others reject posts from accounts that have not aged.
    postable_from     timestamptz,
    updated_at        timestamptz    NOT NULL DEFAULT now(),
    deleted_at        timestamptz,

    -- The same remote account may legitimately be connected by two different
    -- organizations, but never twice within one.
    UNIQUE (organization_id, network, remote_account_id)
);

CREATE INDEX social_profiles_group_idx ON social_profiles (profile_group_id) WHERE deleted_at IS NULL;
CREATE INDEX social_profiles_needs_attention_idx ON social_profiles (organization_id, status)
    WHERE status <> 'active' AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Media
-- ---------------------------------------------------------------------------

CREATE TABLE media_assets (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        REFERENCES profile_groups (id) ON DELETE SET NULL,
    kind             text        NOT NULL,
    storage_key      text        NOT NULL,
    mime_type        text        NOT NULL,
    bytes            bigint      NOT NULL,
    width            integer,
    height           integer,
    duration_sec     numeric(10, 3),
    alt_text         text,
    -- Perceptual hash, for spotting a creative that has already been used and
    -- for detecting duplicate uploads.
    content_hash     text,
    created_by       uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,

    CONSTRAINT media_assets_kind_known CHECK (kind IN ('image', 'video', 'gif', 'document', 'audio')),
    CONSTRAINT media_assets_bytes_positive CHECK (bytes > 0)
);

CREATE INDEX media_assets_group_idx ON media_assets (profile_group_id) WHERE deleted_at IS NULL;
CREATE INDEX media_assets_hash_idx ON media_assets (organization_id, content_hash)
    WHERE content_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

CREATE TYPE post_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'scheduled',
    'publishing',
    'published',
    'partially_failed',  -- succeeded on some networks, failed on others
    'failed',
    'cancelled'
);

-- The network-agnostic composition. What actually goes to each network lives
-- in post_targets, because one draft routinely becomes materially different
-- posts per network.
CREATE TABLE posts (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    format           text        NOT NULL,
    body             text        NOT NULL DEFAULT '',
    title            text,
    link             text,
    first_comment    text,
    status           post_status NOT NULL DEFAULT 'draft',
    created_by       uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

CREATE INDEX posts_group_status_idx ON posts (profile_group_id, status) WHERE deleted_at IS NULL;

CREATE TABLE post_media (
    post_id        uuid    NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    media_asset_id uuid    NOT NULL REFERENCES media_assets (id) ON DELETE CASCADE,
    position       integer NOT NULL,

    PRIMARY KEY (post_id, position)
);

CREATE TYPE delivery_mode AS ENUM (
    'auto',      -- published through the network's API
    'reminder'   -- the network cannot publish this; notify the user instead
);

CREATE TYPE target_status AS ENUM (
    'pending',
    'scheduled',
    'publishing',
    'published',
    'failed',
    'cancelled',
    'awaiting_reconnect'  -- blocked until the user re-authorises the account
);

-- One row per (post, destination account). This is where scheduling,
-- publishing state and per-network overrides live.
CREATE TABLE post_targets (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid          NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id           uuid          NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    social_profile_id uuid          NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    network           text          NOT NULL,
    format            text          NOT NULL,
    -- Only the fields that differ from the parent post. Storing the whole
    -- payload here would let a target silently drift out of sync with edits to
    -- the shared draft.
    overrides         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    delivery          delivery_mode NOT NULL DEFAULT 'auto',
    status            target_status NOT NULL DEFAULT 'pending',

    scheduled_at      timestamptz,
    published_at      timestamptz,
    remote_post_id    text,
    remote_url        text,

    attempt_count     integer       NOT NULL DEFAULT 0,
    next_attempt_at   timestamptz,
    failure_kind      text,
    failure_message   text,

    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),

    -- A post goes to a given account at most once.
    UNIQUE (post_id, social_profile_id),

    CONSTRAINT post_targets_published_has_remote_id
        CHECK (status <> 'published' OR remote_post_id IS NOT NULL)
);

-- The scheduler's hot path: find work that is due. Partial, because published
-- and cancelled rows accumulate indefinitely and must not bloat the index the
-- scheduler polls.
CREATE INDEX post_targets_due_idx ON post_targets (scheduled_at)
    WHERE status IN ('scheduled', 'pending');

CREATE INDEX post_targets_retry_idx ON post_targets (next_attempt_at)
    WHERE status = 'failed' AND next_attempt_at IS NOT NULL;

CREATE INDEX post_targets_profile_idx ON post_targets (social_profile_id, published_at DESC);

-- Guards against double-publishing.
--
-- Publishing is not transactional with the remote network: a worker can post
-- successfully and then crash before recording it. Claiming this row before the
-- API call, keyed on the attempt, means a replayed job finds the claim and
-- declines to post again rather than duplicating it on the network — where we
-- have no way to undo it.
CREATE TABLE publish_claims (
    post_target_id uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    attempt        integer     NOT NULL,
    claimed_by     text        NOT NULL,
    claimed_at     timestamptz NOT NULL DEFAULT now(),
    -- A claim from a worker that died must eventually be reclaimable.
    expires_at     timestamptz NOT NULL,

    PRIMARY KEY (post_target_id, attempt)
);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------

CREATE TABLE approval_workflows (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    name             text        NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);

-- An ordered step. Either a named user or a user group approves it; the group
-- form is what keeps a workflow functioning when someone is unavailable.
CREATE TABLE approval_steps (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id   uuid    NOT NULL REFERENCES approval_workflows (id) ON DELETE CASCADE,
    position      integer NOT NULL,
    user_id       uuid    REFERENCES users (id) ON DELETE CASCADE,
    user_group_id uuid    REFERENCES user_groups (id) ON DELETE CASCADE,

    UNIQUE (workflow_id, position),
    CONSTRAINT approval_steps_exactly_one_approver
        CHECK ((user_id IS NULL) <> (user_group_id IS NULL))
);

CREATE TYPE approval_decision AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE post_approvals (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id        uuid              NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    step_id        uuid              NOT NULL REFERENCES approval_steps (id) ON DELETE CASCADE,
    decided_by     uuid              REFERENCES users (id) ON DELETE SET NULL,
    decision       approval_decision NOT NULL DEFAULT 'pending',
    comment        text,
    decided_at     timestamptz,
    created_at     timestamptz       NOT NULL DEFAULT now(),

    UNIQUE (post_id, step_id)
);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

-- Append-only record of consequential actions. Required for the SOC 2 and
-- enterprise governance story, and the first thing asked for when a client
-- disputes what was published on their behalf.
CREATE TABLE audit_log (
    id              bigserial PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    actor_user_id   uuid        REFERENCES users (id) ON DELETE SET NULL,
    action          text        NOT NULL,
    subject_type    text        NOT NULL,
    subject_id      uuid,
    -- Before/after for the changed fields only. Must never contain credentials.
    detail          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    ip_address      inet,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_org_time_idx ON audit_log (organization_id, created_at DESC);
CREATE INDEX audit_log_subject_idx ON audit_log (subject_type, subject_id);

COMMIT;
