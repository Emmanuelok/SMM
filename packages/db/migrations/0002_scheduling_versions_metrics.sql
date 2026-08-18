-- Corrects four structural gaps in 0001 that cannot be retrofitted later.
--
-- Each is here rather than in a later migration because the cost of deferring
-- is unrecoverable data, not rework: a post scheduled before this migration has
-- no recorded intent, an approval granted before it cannot be bound to content,
-- and a metric not captured today is destroyed by the platform's own retention
-- window and can never be backfilled.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Scheduling intent
-- ---------------------------------------------------------------------------

-- 0001 stored only the computed instant. That silently loses the user's actual
-- intent, which was a wall-clock time in a particular zone.
--
-- The distinction is not academic. Governments revise timezone rules several
-- times a year, usually with a few weeks' notice — Chile, Iran, Mexico, Egypt
-- and Lebanon have all shifted in recent years. When the rules change, every
-- future post scheduled under the old rules is now pointing at the wrong
-- instant, and with only the instant on hand there is no way to tell which
-- posts drifted or what they should have been.
--
-- Recording the inputs alongside the derived instant makes the drift
-- recoverable: after a tzdata update, re-resolve every future target and correct
-- the ones that moved.
ALTER TABLE post_targets
    -- The wall clock the user actually chose. No zone attached, deliberately.
    ADD COLUMN scheduled_local        timestamp,
    -- The zone it was chosen in, resolved from profile then group.
    ADD COLUMN scheduled_timezone     text,
    -- The policies applied, so re-resolution reproduces the same decision.
    ADD COLUMN scheduled_gap_policy   text NOT NULL DEFAULT 'after',
    ADD COLUMN scheduled_ambiguity_policy text NOT NULL DEFAULT 'earlier',
    -- What resolution actually did, for display: a post the user set for 02:30
    -- on a spring-forward day fires at 03:00 and they deserve to be told.
    ADD COLUMN scheduled_resolution   text,
    -- Set when a tzdata change moved this target, so the shift is auditable.
    ADD COLUMN scheduled_adjusted_at  timestamptz;

ALTER TABLE post_targets
    ADD CONSTRAINT post_targets_gap_policy_known
        CHECK (scheduled_gap_policy IN ('after', 'skip')),
    ADD CONSTRAINT post_targets_ambiguity_policy_known
        CHECK (scheduled_ambiguity_policy IN ('earlier', 'later')),
    ADD CONSTRAINT post_targets_resolution_known
        CHECK (scheduled_resolution IS NULL
               OR scheduled_resolution IN ('exact', 'shifted', 'ambiguous')),
    -- A scheduled target must carry the intent that produced it.
    ADD CONSTRAINT post_targets_scheduled_has_intent
        CHECK (scheduled_at IS NULL
               OR (scheduled_local IS NOT NULL AND scheduled_timezone IS NOT NULL));

-- Re-resolving after a tzdata update walks every future target.
CREATE INDEX post_targets_future_by_zone_idx
    ON post_targets (scheduled_timezone, scheduled_at)
    WHERE status IN ('scheduled', 'pending');

-- How a target reaches the network. Kept distinct from status because it
-- decides who is responsible for firing it.
CREATE TYPE dispatch_strategy AS ENUM (
    -- We hold it and call the API at the scheduled moment.
    'our_dispatcher',
    -- The network holds it; we hand over a future timestamp and step back.
    'platform_native',
    -- The network cannot publish it; we notify a human to do it.
    'reminder'
);

-- Facebook and YouTube accept a future timestamp themselves. If we use that and
-- our own dispatcher also fires, the post goes out twice — and a duplicate on a
-- client's feed is not something we can retract. Recording which side owns the
-- trigger makes double-dispatch representable-as-wrong rather than a latent bug.
ALTER TABLE post_targets
    ADD COLUMN dispatch dispatch_strategy NOT NULL DEFAULT 'our_dispatcher',
    -- The network's own id for a natively-scheduled post, needed to cancel it.
    ADD COLUMN platform_schedule_id text;

-- The dispatcher must never pick up work the platform owns.
DROP INDEX post_targets_due_idx;
CREATE INDEX post_targets_due_idx ON post_targets (scheduled_at)
    WHERE status IN ('scheduled', 'pending') AND dispatch = 'our_dispatcher';

-- ---------------------------------------------------------------------------
-- 2. Per-profile timezones
-- ---------------------------------------------------------------------------

-- 0001 put the zone on the profile group. That is exactly the limitation the
-- research identifies in the incumbent we are trying to beat: a brand with
-- accounts serving different countries cannot express "9am local to each
-- audience", because the whole group shares one zone.
--
-- Null inherits the group's zone, so existing behaviour is unchanged and only
-- profiles that need their own zone carry one.
ALTER TABLE social_profiles
    ADD COLUMN timezone text;

COMMENT ON COLUMN social_profiles.timezone IS
    'IANA zone for this account. NULL inherits profile_groups.timezone.';

-- ---------------------------------------------------------------------------
-- 3. Content versions
-- ---------------------------------------------------------------------------

-- 0001 held the body on the mutable posts row, so an approved post could be
-- edited and then published without anyone approving what actually went out.
-- For a regulated client that is not a bug, it is a compliance failure.
--
-- Versions make the approved artefact immutable. An edit creates a new version,
-- which invalidates approvals bound to the previous hash.
CREATE TABLE post_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    version         integer     NOT NULL,

    -- Hash over exactly the fields that reach the network. Two versions with
    -- the same hash are the same post as far as an approver is concerned, so
    -- reordering a tag or fixing an internal note does not force re-approval.
    content_hash    text        NOT NULL,

    body            text        NOT NULL DEFAULT '',
    title           text,
    link            text,
    first_comment   text,
    -- Ordered asset references, captured so a version stays reproducible even
    -- if the library entry is later renamed.
    media           jsonb       NOT NULL DEFAULT '[]'::jsonb,

    created_by      uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (post_id, version),
    CONSTRAINT post_versions_version_positive CHECK (version > 0)
);

CREATE INDEX post_versions_post_idx ON post_versions (post_id, version DESC);
CREATE INDEX post_versions_hash_idx ON post_versions (organization_id, content_hash);

-- An approval is a statement about specific content, not about a post id.
ALTER TABLE post_approvals
    ADD COLUMN post_version_id uuid REFERENCES post_versions (id) ON DELETE CASCADE,
    -- Denormalised so an approval remains interpretable if the version row is
    -- ever archived, and so invalidation is a cheap comparison.
    ADD COLUMN approved_hash   text;

-- What gets published is a specific version, never "whatever the post says now".
ALTER TABLE post_targets
    ADD COLUMN post_version_id uuid REFERENCES post_versions (id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- 4. Seatless external reviewers
-- ---------------------------------------------------------------------------

-- 0001 required an approval step to name a row in users, so a client reviewer
-- had to be given an account and consume a seat. That is the friction the
-- research identifies as the reason agencies approve over email instead, which
-- puts the decision outside the audit trail entirely.
ALTER TABLE approval_steps
    ADD COLUMN external_email citext,
    ADD COLUMN external_name  text;

ALTER TABLE approval_steps
    DROP CONSTRAINT approval_steps_exactly_one_approver;

ALTER TABLE approval_steps
    ADD CONSTRAINT approval_steps_exactly_one_approver
        CHECK (
            (CASE WHEN user_id       IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN user_group_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN external_email IS NOT NULL THEN 1 ELSE 0 END) = 1
        );

-- A decision from someone with no account still has to be attributable.
ALTER TABLE post_approvals
    ADD COLUMN decided_by_email citext,
    -- Single-use token the reviewer follows to decide without signing in.
    ADD COLUMN decision_token_hash text,
    ADD COLUMN decision_token_expires_at timestamptz;

CREATE INDEX post_approvals_token_idx ON post_approvals (decision_token_hash)
    WHERE decision_token_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Metrics, with provenance
-- ---------------------------------------------------------------------------

-- 0001 had no metric storage at all, which means platform data is being lost
-- every day it stays that way: Pinterest retains 90 days, X 30, TikTok around
-- 60. Once those windows pass the numbers are gone from the source and cannot
-- be recovered at any price.
--
-- Provenance is recorded alongside every value rather than added later, because
-- retrofitting it leaves the entire back catalogue provenance-less. A metric
-- whose origin is unknown cannot be defended when a client asks why this
-- month's "reach" does not match last month's, which happens whenever a
-- platform quietly redefines a field.
CREATE TABLE metric_facts (
    id                bigserial PRIMARY KEY,
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    -- Null for account-level metrics such as follower count.
    post_target_id    uuid        REFERENCES post_targets (id) ON DELETE CASCADE,

    -- Our normalised name: impressions, reach, likes, comments, shares, saves,
    -- clicks, video_views.
    metric_key        text        NOT NULL,
    value             numeric     NOT NULL,

    -- The period the number describes.
    measured_at       timestamptz NOT NULL,
    -- When we fetched it. Distinct from measured_at because platforms restate
    -- figures for days afterwards, and both readings are worth keeping.
    collected_at      timestamptz NOT NULL DEFAULT now(),

    -- Provenance. Without these a number is an assertion; with them it can be
    -- traced back to the exact call that produced it.
    source_endpoint   text        NOT NULL,
    source_field      text        NOT NULL,
    api_version       text,
    -- The value exactly as returned, before normalisation.
    raw_value         jsonb,

    CONSTRAINT metric_facts_key_not_blank CHECK (metric_key <> '')
);

-- One reading per field per collection. NULLS NOT DISTINCT so account-level
-- rows, where post_target_id is null, still collide properly.
CREATE UNIQUE INDEX metric_facts_reading_idx
    ON metric_facts (social_profile_id, post_target_id, metric_key, measured_at, collected_at)
    NULLS NOT DISTINCT;

CREATE INDEX metric_facts_profile_time_idx
    ON metric_facts (social_profile_id, metric_key, measured_at DESC);
CREATE INDEX metric_facts_target_idx
    ON metric_facts (post_target_id) WHERE post_target_id IS NOT NULL;

-- What each platform metric meant, and when that changed.
--
-- Platforms redefine metrics without renaming them — Instagram's shift from
-- "impressions" to "views" being the well-known case. Recording the definition
-- and its effective window is what lets a report say "this metric changed
-- definition on this date" instead of showing a cliff and leaving the client to
-- conclude the numbers are wrong.
CREATE TABLE metric_definitions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network        text        NOT NULL,
    metric_key     text        NOT NULL,
    source_field   text        NOT NULL,
    api_version    text,
    definition     text        NOT NULL,
    effective_from date        NOT NULL,
    -- Null means current.
    effective_to   date,
    -- Where the definition came from, so it can be re-checked.
    source_url     text,

    CONSTRAINT metric_definitions_window_ordered
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX metric_definitions_lookup_idx
    ON metric_definitions (network, metric_key, effective_from DESC);

-- ---------------------------------------------------------------------------
-- 6. Publish verification
-- ---------------------------------------------------------------------------

-- A successful API response is not proof a post is live. Networks accept a
-- post and then remove it, shadow-restrict it, or fail to process the video.
-- Reading it back afterwards is the difference between reporting what we sent
-- and reporting what is actually there.
CREATE TABLE publish_verifications (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_target_id uuid        NOT NULL REFERENCES post_targets (id) ON DELETE CASCADE,
    checked_at     timestamptz NOT NULL DEFAULT now(),
    -- present: found as expected. missing: gone. altered: content differs.
    outcome        text        NOT NULL,
    detail         jsonb       NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT publish_verifications_outcome_known
        CHECK (outcome IN ('present', 'missing', 'altered', 'unavailable'))
);

CREATE INDEX publish_verifications_target_idx
    ON publish_verifications (post_target_id, checked_at DESC);

COMMIT;
