-- In-flight OAuth authorisations.
--
-- An OAuth redirect leaves our control and comes back as an untrusted GET from
-- a third party. Everything needed to finish the exchange has to survive that
-- round trip, and none of it can be trusted from the query string — which is
-- what this table is for.
--
-- It also carries something Bluesky never needed: on a network with dynamic
-- client registration, the client id and secret are created per server at the
-- moment the flow begins. They exist nowhere else, so losing them between the
-- redirect and the callback loses the authorisation.

BEGIN;

CREATE TABLE oauth_states (
    -- The state parameter is stored as a hash, for the same reason session
    -- tokens are: a table of live state values is a table of authorisations an
    -- attacker could complete, and this row exists precisely while one is open.
    state_hash        text PRIMARY KEY,

    -- Who began the flow. Checked on return, so a state minted for one tenant
    -- cannot attach an account to another — the callback arrives with whatever
    -- session the browser happens to hold, which is not necessarily the one
    -- that started this.
    organization_id   uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id           uuid        REFERENCES users (id) ON DELETE SET NULL,
    profile_group_id  uuid        NOT NULL REFERENCES profile_groups (id) ON DELETE CASCADE,

    network           text        NOT NULL,
    -- The server this flow is against, for networks where that varies.
    instance          text,

    -- Registered per server at the start of the flow and needed to redeem the
    -- code. The secret is sealed with the same vault as every other credential;
    -- it authorises token issuance and is not less sensitive than a token.
    client_id         text,
    client_secret_enc bytea,
    key_id            text,

    -- Compared with the callback's. A mismatch means the response belongs to a
    -- different flow.
    redirect_uri      text        NOT NULL,

    created_at        timestamptz NOT NULL DEFAULT now(),
    -- Short. A consent screen is completed in a minute or abandoned; a state
    -- that stays valid for hours is an authorisation left lying around.
    expires_at        timestamptz NOT NULL,
    -- Marked rather than deleted so a replayed callback can be told apart from
    -- a forged one, and so a genuine double-click says "already connected"
    -- instead of failing with something alarming.
    consumed_at       timestamptz,

    CONSTRAINT oauth_states_expiry_after_creation CHECK (expires_at > created_at),
    -- A sealed secret is meaningless without the key that opens it.
    CONSTRAINT oauth_states_secret_has_key
        CHECK (client_secret_enc IS NULL OR key_id IS NOT NULL)
);

-- Sweeps abandoned flows, which are the common case: most people who open a
-- consent screen and change their mind never come back.
CREATE INDEX oauth_states_expiry_idx ON oauth_states (expires_at)
    WHERE consumed_at IS NULL;

COMMIT;
