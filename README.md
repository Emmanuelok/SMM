# SMM

A social media management platform: schedule, publish, engage and measure across
many networks.

## State

Early, but end to end. You can sign up, connect a Bluesky account, schedule a
post, and the worker will pick it up and publish it.

| | |
|---|---|
| **Works** | Web UI, signup, login, sessions, connecting a Bluesky account, composing and scheduling, the publish worker |
| **Built, not wired** | Metrics ingestion, approvals, recycling queues, media renditions, the rights ledger |
| **Not started** | Networks other than Bluesky, media storage, email, billing |

Only Bluesky. Every other network parks its posts with a clear reason rather
than failing obscurely, because they require an approved developer application
first and those take weeks — see `research/06-platform-apis-tier1.md`. Bluesky
needs none, which is why it came first.

The live Bluesky calls are the one thing never executed in development: the
sandbox this was built in blocks the host. Everything either side of them is
covered, so the first real connection is also the first real test.

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
