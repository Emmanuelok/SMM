-- Authentication: password credentials, sessions, and email verification.
--
-- 0001 created a users table with no way to prove you are one. This adds that,
-- kept in separate tables rather than as columns on users for the same reason
-- OAuth credentials are separate: the rows that routine queries touch should
-- never contain a secret, so an over-broad SELECT on a user profile cannot leak
-- a password hash or a live session token.

BEGIN;

-- ---------------------------------------------------------------------------
-- Password credentials
-- ---------------------------------------------------------------------------

CREATE TABLE user_passwords (
    user_id       uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    -- scrypt, encoded with its own parameters so the cost can be raised later
    -- without invalidating existing hashes. Format is documented in
    -- packages/vault/src/password.ts.
    password_hash text        NOT NULL,
    -- Forces a rehash on next successful login when the stored parameters are
    -- weaker than current policy. Without it, hashes created years ago stay at
    -- the cost factor that was adequate years ago.
    algorithm     text        NOT NULL DEFAULT 'scrypt',
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------

-- Only the hash of a session token is stored.
--
-- A stolen database dump then yields nothing a thief can present as a login.
-- This is the same reasoning as password hashing and it is skipped surprisingly
-- often, because a session token feels ephemeral — but a table of live tokens is
-- a table of live logins.
CREATE TABLE sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      text        NOT NULL UNIQUE,
    -- Recorded for the "sign out everywhere / where am I signed in" surface.
    user_agent      text,
    ip_address      inet,
    created_at      timestamptz NOT NULL DEFAULT now(),
    -- Sliding expiry: refreshed on use, so an active session does not log out
    -- mid-task, while an abandoned one dies on schedule.
    last_seen_at    timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    revoked_at      timestamptz
);

CREATE INDEX sessions_user_idx ON sessions (user_id) WHERE revoked_at IS NULL;
-- Drives the sweep that deletes dead sessions.
CREATE INDEX sessions_expiry_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- Single-use tokens
-- ---------------------------------------------------------------------------

-- Email verification, password reset, and team invitations.
--
-- One table rather than three: they differ only in what they authorise, and
-- three near-identical tables would drift in exactly the ways that matter —
-- one forgetting to expire, another forgetting to be single-use.
CREATE TABLE auth_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Null for an invitation to an address with no account yet.
    user_id     uuid        REFERENCES users (id) ON DELETE CASCADE,
    email       citext      NOT NULL,
    purpose     text        NOT NULL,
    token_hash  text        NOT NULL UNIQUE,
    -- Where an invitation places the accepting user.
    organization_id uuid    REFERENCES organizations (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    -- Set on redemption. Checked rather than deleted so a replayed link can say
    -- "already used" instead of "invalid", which is the difference between a
    -- user retrying and a user filing a support ticket.
    consumed_at timestamptz,

    CONSTRAINT auth_tokens_purpose_known
        CHECK (purpose IN ('email_verification', 'password_reset', 'invitation')),
    CONSTRAINT auth_tokens_expiry_after_creation
        CHECK (expires_at > created_at)
);

CREATE INDEX auth_tokens_email_idx ON auth_tokens (email, purpose)
    WHERE consumed_at IS NULL;

ALTER TABLE users
    ADD COLUMN email_verified_at timestamptz,
    -- Distinguishes a user who signed up from one created by an invitation that
    -- has not been accepted, so the latter is never counted as an active seat.
    ADD COLUMN status text NOT NULL DEFAULT 'active';

ALTER TABLE users ADD CONSTRAINT users_status_known
    CHECK (status IN ('active', 'invited', 'suspended'));

-- ---------------------------------------------------------------------------
-- Login throttling
-- ---------------------------------------------------------------------------

-- Failed attempts, kept so repeated guessing against one account can be slowed
-- independently of the per-IP limit. An attacker with a botnet defeats IP-only
-- throttling trivially, and rate limiting held in process memory resets on every
-- deploy and is not shared between instances.
CREATE TABLE login_attempts (
    id          bigserial PRIMARY KEY,
    email       citext      NOT NULL,
    ip_address  inet,
    successful  boolean     NOT NULL,
    attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_attempts_email_idx ON login_attempts (email, attempted_at DESC);
CREATE INDEX login_attempts_ip_idx ON login_attempts (ip_address, attempted_at DESC)
    WHERE ip_address IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Migration ledger
-- ---------------------------------------------------------------------------

-- Which migrations have run. Created here rather than in 0001 so that the
-- runner can adopt a database that already had 0001-0004 applied by hand.
CREATE TABLE schema_migrations (
    filename   text PRIMARY KEY,
    -- Detects a migration edited after it was applied, which is the failure that
    -- makes two environments silently diverge.
    checksum   text        NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
