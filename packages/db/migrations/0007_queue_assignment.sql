-- Queue assignment.
--
-- Until now a scheduled target only recorded *when* it fires. That is enough to
-- publish, but not enough to run a queue: the calendar cannot distinguish a post
-- someone pinned to 09:00 on Tuesday from one the queue placed there, and
-- rebuilding a week's slots has no way to find the posts that were filling them.
--
-- More importantly, "read the free slots, then write one" is a race. Two people
-- adding to the same queue at the same moment both see the same free slot and
-- both take it. The application cannot close that by being careful; only the
-- database can.

ALTER TABLE post_targets
    -- Which slot placed this. NULL means a time the user chose themselves, which
    -- is a different thing and should stay different: rebuilding the week must
    -- not move a post that was deliberately pinned.
    ADD COLUMN queue_slot_id uuid REFERENCES schedule_slots (id) ON DELETE SET NULL;

COMMENT ON COLUMN post_targets.queue_slot_id IS
    'The schedule slot that placed this target. NULL for a manually chosen time.';

CREATE INDEX post_targets_queue_slot_idx ON post_targets (queue_slot_id)
    WHERE queue_slot_id IS NOT NULL;

-- One queued post per account per instant.
--
-- Scoped to queue-placed rows on purpose. Two posts deliberately pinned to the
-- same minute is a choice a person is allowed to make — cross-posting a launch
-- announcement, say — and refusing it would be the tool overruling its user. A
-- queue taking the same slot twice is never a choice; it is the race.
--
-- Restricted to live statuses so that cancelling a queued post frees its slot
-- immediately, rather than leaving a hole nothing can fill until the row is
-- purged.
CREATE UNIQUE INDEX post_targets_one_queued_per_instant_idx
    ON post_targets (social_profile_id, scheduled_at)
    WHERE queue_slot_id IS NOT NULL
      AND status IN ('pending', 'scheduled', 'publishing');
