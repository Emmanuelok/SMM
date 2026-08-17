# SMM

A social media management platform: schedule, publish, engage and measure across
many networks.

## State

Early, but end to end. You can sign up, connect a Bluesky or Mastodon account,
set a weekly posting queue, add a post to it, and the worker will pick it up and
publish it.

| | |
|---|---|
| **Works** | Web UI, signup, login, sessions, connecting Bluesky and Mastodon accounts, composing, posting queues, scheduling, the publish worker |
| **Built, not wired** | Metrics ingestion, approvals, content recycling, media renditions, the rights ledger |
| **Not started** | Networks beyond Bluesky and Mastodon, media storage, email, billing |

Two networks. Every other one parks its posts with a clear reason rather than
failing obscurely, because they require an approved developer application first
and those take weeks — see `research/06-platform-apis-tier1.md`. Bluesky and
Mastodon need none, which is why they came first.

The live network calls are the one thing never executed in development: the
sandbox this was built in blocks both hosts. Everything either side of them is
covered — including the database, against a real Postgres — so the first real
connection is also the first real test.

## Layout

```
apps/api          HTTP service and web client: auth, connections, composing
apps/worker       Publish dispatcher
packages/shared   Ids, Result, failure taxonomy, text measurement
packages/vault    Credential encryption, password hashing, tokens
packages/db       Connection pool, migration runner, SQL migrations
packages/adapters Network capabilities, validation, the adapter contract
packages/scheduler Timezone resolution, publish budgets, retry policy
research/         Market and platform research the design is drawn from
```

## Running locally

Needs Node 22 and Postgres 16.

```sh
npm install
cp .env.example .env      # then set DATABASE_URL and CREDENTIAL_KEYS
npm run build
node packages/db/dist/cli.js up
node apps/api/dist/main.js
```

Generate a credential key with:

```sh
node -e "console.log('k1:' + require('crypto').randomBytes(32).toString('base64'))"
```

```sh
npm test          # builds, then runs every test
npm run typecheck
```

`npm test` is hermetic: the tests that need a database skip themselves. Point
`TEST_DATABASE_URL` at a scratch database to include them, and they will apply
the migrations and exercise the real schema:

```sh
createdb smm_test
DATABASE_URL=postgres://localhost/smm_test DATABASE_SSL=false node packages/db/dist/cli.js
TEST_DATABASE_URL=postgres://localhost/smm_test npm test
```

Each of those tests creates and deletes its own tenant, so the database it runs
against is not left dirty — but point it at a scratch one anyway.

Deployment is documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Design decisions worth knowing before reading the code

**Capabilities are data, not code.** Every network expresses the same handful of
constraints — text length, media counts, codecs, daily caps — so the validator is
written once and each network supplies its numbers. The same descriptors drive
the composer and the pre-publish check, so what the editor allows and what the
API accepts cannot drift apart.

**Delivery mode depends on content, not format.** A plain Instagram Story
publishes through the API; the same Story with a link sticker cannot, because
Meta exposes no sticker API. Since Stories are Instagram's most-used format and
stickers are their entire engagement mechanic, reminder-based publishing is a
primary path rather than an edge case.

**Text measurement is its own module.** A naive length check is wrong three
ways: emoji are several UTF-16 units but one character to a user, X weights CJK
and emoji as two, and X rewrites every URL to a fixed width so link length is
irrelevant.

**Scheduling stores intent, not just the resulting instant.** Timezone rules
change several times a year; keeping only the computed moment makes the
resulting drift undetectable and uncorrectable.

**A queue is a weekly grid of wall-clock times, resolved per occurrence.**
Producing next week's slot by adding 604,800,000 milliseconds is the shortcut
that makes a queue drift an hour away from the week its owner set up, twice a
year, without anyone noticing — the posts still go out. Two consequences fall
out of resolving properly and are handled rather than left to the caller: two
slots can collapse onto one instant across a spring-forward gap, and a slot on a
fall-back day happens twice.

**The queue's race is closed by the database.** "Find a free slot, then take it"
is a read followed by a write, and two people adding to the same queue at the
same moment both see the same free slot. A partial unique index refuses the
second one; the application retries rather than failing, because by then the
next slot really is free. The index covers only queue-placed rows, so two posts
deliberately pinned to the same minute stay legal.

**Metrics carry provenance from the first row.** Platform retention windows are
short — Pinterest 90 days, X 30, TikTok around 60 — so uncaptured data is
unrecoverable, and provenance added later leaves the back catalogue
unattributable.

**Migrations are the schema contract.** No ORM: model definitions would be a
second description of the same thing, free to drift from the first.

## Research

`research/` holds 19 dossiers and three synthesis documents. Start with
`00-MASTER-STRATEGY.md`. `00-critique.md` is a deliberate audit of what the
research missed or asserted without evidence, and `00-UPGRADE-SPEC.md` audits
this codebase against the findings.
