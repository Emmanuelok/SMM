-- Posting schedules, content categories, recycling and content sources.
--
-- This is the most-used surface in the category and 0001 had no storage for it
-- at all. Everything here was previously inexpressible: category-based evergreen
-- queues, recycling, recurrence, and feed-triggered posting.
--
-- The important structural choice is that recurrence and recycling are two
-- different objects rather than one setting. They answer different questions.
-- Recurrence is "publish THIS post again on a cadence" — a weekly opening-hours
-- reminder. Recycling is "keep this slot full from a POOL" — the queue decides
-- which post runs. Collapsing them, which several products do, means a user who
-- wants one is forced to simulate it with the other.

BEGIN;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

-- Categories are the indirection that makes evergreen queues work: a time slot
-- names a category rather than a post, and the queue resolves which post fills
-- it. Without this a "queue" is only a list of times, and keeping a posting
-- rhythm going means manually refilling it forever.
CREATE TABLE content_categories (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    name             text        NOT NULL,
    -- Shown on the calendar so a week's mix is legible at a glance.
    color            text,
    -- Draw order within the category when a slot comes due.
    -- 'oldest_first' rotates evenly; 'random' avoids a predictable pattern;
    -- 'manual' respects an explicit position.
    draw_order       text        NOT NULL DEFAULT 'oldest_first',
    created_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,

    UNIQUE (profile_group_id, name),
    CONSTRAINT content_categories_draw_order_known
        CHECK (draw_order IN ('oldest_first', 'random', 'manual'))
);

CREATE INDEX content_categories_group_idx ON content_categories (profile_group_id)
    WHERE deleted_at IS NULL;

-- A post may belong to several categories, and category membership is what makes
-- it eligible to be drawn into a slot.
CREATE TABLE post_categories (
    post_id     uuid    NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    category_id uuid    NOT NULL REFERENCES content_categories (id) ON DELETE CASCADE,
    -- Used when the category draws in 'manual' order.
    position    integer,

    PRIMARY KEY (post_id, category_id)
);

CREATE INDEX post_categories_category_idx ON post_categories (category_id, position);

-- ---------------------------------------------------------------------------
-- Schedules and slots
-- ---------------------------------------------------------------------------

CREATE TABLE posting_schedules (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    social_profile_id uuid        NOT NULL REFERENCES social_profiles (id) ON DELETE CASCADE,
    name              text        NOT NULL DEFAULT 'default',
    -- Resolved from the profile, falling back to its group, and then stored.
    -- Kept here rather than re-derived so that a later change to the profile's
    -- zone does not silently reinterpret every slot in this schedule.
    timezone          text        NOT NULL,
    -- A paused schedule stops producing new work but keeps its slots, so a
    -- crisis hold is reversible without the user rebuilding their week.
    paused_at         timestamptz,
    pause_reason      text,
    created_at        timestamptz NOT NULL DEFAULT now(),

    UNIQUE (social_profile_id, name)
);

CREATE INDEX posting_schedules_profile_idx ON posting_schedules (social_profile_id);

CREATE TABLE schedule_slots (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    schedule_id     uuid        NOT NULL REFERENCES posting_schedules (id) ON DELETE CASCADE,
    -- 0 = Sunday. Rendered per the viewer's locale in the UI, where the week
    -- does not start on the same day everywhere.
    day_of_week     smallint    NOT NULL,
    -- Wall-clock time, interpreted in the schedule's timezone. Deliberately not
    -- an instant: "09:00 every Tuesday" must stay 09:00 across a DST change.
    local_time      time        NOT NULL,
    -- The slot names a category; the queue resolves which post fills it.
    category_id     uuid        REFERENCES content_categories (id) ON DELETE SET NULL,
    -- Restricts a slot to particular formats, so a "Reels on Thursday" slot
    -- cannot be filled by a text post.
    accepts_formats text[]      NOT NULL DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT schedule_slots_dow_valid CHECK (day_of_week BETWEEN 0 AND 6),
    UNIQUE (schedule_id, day_of_week, local_time)
);

CREATE INDEX schedule_slots_schedule_idx ON schedule_slots (schedule_id, day_of_week, local_time);
CREATE INDEX schedule_slots_category_idx ON schedule_slots (category_id)
    WHERE category_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Recurrence: republish THIS post on a cadence
-- ---------------------------------------------------------------------------

CREATE TABLE post_recurrences (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,

    -- An RFC 5545 RRULE. Using the standard rather than inventing a cadence
    -- format means "last Friday of the month" and "every other Tuesday" work
    -- without a bespoke parser, and calendar exports are straightforward.
    rrule           text        NOT NULL,
    timezone        text        NOT NULL,
    starts_on       date        NOT NULL,
    -- Null runs indefinitely.
    ends_on         date,
    -- A cap independent of the end date, so "post this 5 more times" is
    -- expressible without arithmetic on the calendar.
    max_occurrences integer,
    occurrences_so_far integer  NOT NULL DEFAULT 0,

    -- Networks reject near-identical reposts, so recurring the same body
    -- verbatim will eventually fail. When set, each occurrence draws a
    -- different variation from post_variations.
    vary_content    boolean     NOT NULL DEFAULT false,

    paused_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT post_recurrences_ends_after_start
        CHECK (ends_on IS NULL OR ends_on >= starts_on),
    CONSTRAINT post_recurrences_max_positive
        CHECK (max_occurrences IS NULL OR max_occurrences > 0)
);

CREATE INDEX post_recurrences_active_idx ON post_recurrences (organization_id)
    WHERE paused_at IS NULL;

-- Alternative wordings of the same post.
--
-- Exists because X and Facebook reject content they have seen before, so any
-- product that recycles evergreen material needs distinct phrasings or it
-- steadily accumulates silent publish failures.
CREATE TABLE post_variations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    body            text        NOT NULL,
    -- Rotation picks the least-recently-used variation.
    last_used_at    timestamptz,
    use_count       integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX post_variations_rotation_idx ON post_variations (post_id, last_used_at NULLS FIRST);

-- ---------------------------------------------------------------------------
-- Recycling: keep a slot full from a pool
-- ---------------------------------------------------------------------------

CREATE TABLE recycling_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    category_id     uuid        NOT NULL REFERENCES content_categories (id) ON DELETE CASCADE,

    -- How long a post must rest before it may be drawn again. Without this a
    -- small pool republishes the same item every few days and reads as spam.
    min_interval_days integer   NOT NULL DEFAULT 30,
    -- Retire a post after this many publishes. Null recycles indefinitely.
    max_publishes   integer,
    -- Stop recycling a post after this date regardless of count, for content
    -- with a shelf life such as a seasonal promotion.
    expires_on      date,

    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (category_id),
    CONSTRAINT recycling_rules_interval_positive CHECK (min_interval_days > 0),
    CONSTRAINT recycling_rules_max_positive CHECK (max_publishes IS NULL OR max_publishes > 0)
);

-- Publishing history per post, which is what recycling eligibility is computed
-- from. Denormalised from post_targets because the query runs on every slot
-- resolution and must not scan the full publishing history.
CREATE TABLE post_recycle_state (
    post_id          uuid        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    category_id      uuid        NOT NULL REFERENCES content_categories (id) ON DELETE CASCADE,
    publish_count    integer     NOT NULL DEFAULT 0,
    last_published_at timestamptz,
    -- Set when the post is retired, so exhausted content stops being considered
    -- without being deleted.
    retired_at       timestamptz,

    PRIMARY KEY (post_id, category_id)
);

-- The slot-filling query: eligible posts in a category, least recently used.
CREATE INDEX post_recycle_state_eligible_idx
    ON post_recycle_state (category_id, last_published_at NULLS FIRST)
    WHERE retired_at IS NULL;

-- ---------------------------------------------------------------------------
-- Content sources: feed-triggered posting
-- ---------------------------------------------------------------------------

CREATE TABLE content_sources (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    profile_group_id uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,
    kind             text        NOT NULL,
    url              text        NOT NULL,
    name             text        NOT NULL,

    -- Where fetched items land. Requiring approval by default is deliberate:
    -- auto-posting an unread third-party headline to a client's account is a
    -- reputational incident waiting to happen, so the safe mode is the default
    -- and full automation is opt-in.
    auto_publish     boolean     NOT NULL DEFAULT false,
    target_category_id uuid      REFERENCES content_categories (id) ON DELETE SET NULL,

    -- Template applied to each item, with placeholders for title, link, author.
    template         text,
    -- Only items matching this are ingested, so a broad feed can be narrowed.
    include_pattern  text,
    exclude_pattern  text,

    poll_interval_minutes integer NOT NULL DEFAULT 60,
    last_polled_at   timestamptz,
    last_error       text,
    paused_at        timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT content_sources_kind_known
        CHECK (kind IN ('rss', 'atom', 'youtube_channel', 'podcast', 'webhook')),
    CONSTRAINT content_sources_poll_interval_sane
        CHECK (poll_interval_minutes >= 5)
);

CREATE INDEX content_sources_due_idx ON content_sources (last_polled_at NULLS FIRST)
    WHERE paused_at IS NULL;

-- Items seen in a source.
--
-- Retained after publishing purely so the same item is never ingested twice.
-- Feeds routinely restate items with changed timestamps or reordered entries,
-- and without a durable record of what has been seen, a poll cycle republishes
-- the whole feed.
CREATE TABLE content_source_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    source_id       uuid        NOT NULL REFERENCES content_sources (id) ON DELETE CASCADE,
    -- The feed's own identifier, or a hash of the link when it omits one.
    external_id     text        NOT NULL,
    title           text,
    link            text,
    published_at    timestamptz,
    -- Set once this item has become a post.
    post_id         uuid        REFERENCES posts (id) ON DELETE SET NULL,
    ingested_at     timestamptz NOT NULL DEFAULT now(),

    UNIQUE (source_id, external_id)
);

CREATE INDEX content_source_items_pending_idx ON content_source_items (source_id, ingested_at DESC)
    WHERE post_id IS NULL;

COMMIT;
