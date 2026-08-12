# @smm/db

PostgreSQL schema for the platform.

## Applying migrations

Migrations are plain SQL, applied in filename order. No ORM is assumed — the
schema is the contract, and the query layer is chosen separately.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0001_core.sql
```

Every migration is wrapped in a transaction, so a failure leaves the database
untouched rather than half-migrated.

## Design notes

**Tenancy is denormalised on purpose.** Every tenant-owned table carries
`organization_id` directly instead of reaching it through a join. Row-level
security policies have to be cheap and, more importantly, obviously correct — a
policy that reads one column on the row it protects is much harder to get wrong
than one traversing two joins to find the owner.

**Containment follows `organization → profile group → social profile`.** A
profile group is a brand, client, project, or location. It is the unit that
content, permissions, approvals and reporting scope to, which is what keeps one
client's content from co-mingling with another's inside an agency account.

**Credentials live in their own table.** Only ciphertext and a key identifier
are stored; plaintext tokens must never reach the database. Access goes through
the token vault service rather than ordinary application queries, so an
over-broad `SELECT` elsewhere cannot leak credentials.

**`publish_claims` guards against double-posting.** Publishing is not
transactional with the remote network: a worker can post successfully and then
crash before recording it. Claiming the row before the API call means a replayed
job finds the claim and declines rather than duplicating the post on a network
where we cannot undo it.

**Scheduler indexes are partial.** `post_targets_due_idx` covers only rows still
awaiting publication. Published and cancelled rows accumulate indefinitely, and
including them would steadily bloat the index the scheduler polls most often.

## Verifying a change

The constraints carry real invariants, so changes should be checked against a
live database rather than reasoned about:

```sh
initdb -D /var/tmp/pgdata -A trust -U postgres
pg_ctl -D /var/tmp/pgdata -o '-p 55432' start
createdb -p 55432 smm_test
psql -p 55432 -d smm_test -v ON_ERROR_STOP=1 -f migrations/0001_core.sql
```

The invariants worth re-checking after any schema change are: case-insensitive
uniqueness of emails and slugs, one connection per remote account per
organization, one target per (post, account), a published target always carrying
a remote id, and an approval step naming exactly one of a user or a user group.
