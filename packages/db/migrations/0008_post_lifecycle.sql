-- Post lifecycle: cancelling, and a post status that tells the truth.
--
-- Two problems, both of which only appear once someone has actually scheduled
-- something and changed their mind.
--
-- First: a post already claimed by a worker cannot be un-sent, but it can be
-- *stopped from being sent again*. A worker that dies mid-publish leaves its row
-- in `publishing`, and the reclaim returns that row to the queue — which would
-- resurrect and publish a post the user had cancelled in the meantime. "I
-- cancelled it and it posted anyway" is the single worst thing a scheduling
-- tool can do, so the intent has to be recorded where the reclaim can see it.
--
-- Second: `posts.status` was written once at creation and never again. Targets
-- moved to published, failed and cancelled beneath it while the parent row
-- still said `scheduled` forever. Deriving it in the application would mean two
-- services both remembering to do it; deriving it here means neither can forget.

ALTER TABLE post_targets
    ADD COLUMN cancel_requested_at timestamptz;

COMMENT ON COLUMN post_targets.cancel_requested_at IS
    'Set when cancellation was asked for but the row was already in flight. The '
    'reclaim honours it instead of returning the row to the queue.';

-- Partial: only in-flight cancellations are ever looked up by this.
CREATE INDEX post_targets_cancel_requested_idx ON post_targets (cancel_requested_at)
    WHERE cancel_requested_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- posts.status, derived from the targets beneath it
-- ---------------------------------------------------------------------------

CREATE FUNCTION refresh_post_status() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    target_post uuid := COALESCE(NEW.post_id, OLD.post_id);
    total       integer;
    publishing  integer;
    live        integer;
    published   integer;
    dead        integer;
    cancelled   integer;
    undated     integer;
    next_status post_status;
BEGIN
    SELECT count(*),
           count(*) FILTER (WHERE status = 'publishing'),
           -- Still going to be attempted: waiting for its time, or waiting for
           -- a retry. A retryable failure is not a failure yet.
           count(*) FILTER (WHERE (status IN ('scheduled', 'pending') AND scheduled_at IS NOT NULL)
                               OR (status = 'failed' AND next_attempt_at IS NOT NULL)),
           count(*) FILTER (WHERE status = 'published'),
           -- Given up on: no further attempt is scheduled, so a person has to act.
           count(*) FILTER (WHERE status IN ('failed', 'awaiting_reconnect')
                              AND next_attempt_at IS NULL),
           count(*) FILTER (WHERE status = 'cancelled'),
           -- A draft: chosen account, no time yet.
           count(*) FILTER (WHERE status = 'pending' AND scheduled_at IS NULL)
      INTO total, publishing, live, published, dead, cancelled, undated
      FROM post_targets
     WHERE post_id = target_post;

    -- A post with no targets is a draft nobody has picked accounts for. Its
    -- status is whatever the application set, and guessing would overwrite it.
    IF total = 0 THEN
        RETURN NULL;
    END IF;

    next_status := CASE
        WHEN publishing > 0                  THEN 'publishing'
        WHEN live > 0                        THEN 'scheduled'
        WHEN published > 0 AND dead > 0       THEN 'partially_failed'
        WHEN published > 0                   THEN 'published'
        WHEN dead > 0                        THEN 'failed'
        WHEN cancelled = total               THEN 'cancelled'
        WHEN undated = total                 THEN 'draft'
        ELSE 'draft'
    END;

    -- Written only on a real change, so an unchanged post is not touched on
    -- every target update and `updated_at` still means something.
    UPDATE posts
       SET status = next_status, updated_at = now()
     WHERE id = target_post AND status IS DISTINCT FROM next_status;

    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION refresh_post_status() IS
    'Recomputes posts.status from its targets. A summary, never an input.';

CREATE TRIGGER post_targets_refresh_post_status
    AFTER INSERT OR DELETE OR UPDATE OF status, scheduled_at, next_attempt_at
    ON post_targets
    FOR EACH ROW
    EXECUTE FUNCTION refresh_post_status();
