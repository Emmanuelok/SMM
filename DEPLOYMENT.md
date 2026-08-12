# Deploying to Railway

What exists today deploys as **one service plus a Postgres database**. The
worker is not built yet, so there is nothing to run in a second service.

## 1. Create the project

```sh
railway init
railway add --database postgres
```

Railway exposes the database to the service as `DATABASE_URL`. Reference it as
`${{Postgres.DATABASE_URL}}` rather than pasting the value, so it follows the
database if it is ever recreated.

## 2. Generate the credential root key

```sh
node -e "console.log('k1:' + require('crypto').randomBytes(32).toString('base64'))"
```

**Back this up somewhere other than Railway.** Every connected social account is
encrypted under it. Lose it and the tokens cannot be decrypted — every customer
has to reconnect every account, and there is no recovery path. It is the one
value in the system with no backup elsewhere.

## 3. Set variables

```sh
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --set "CREDENTIAL_KEYS=k1:<generated>"
railway variables --set "PUBLIC_URL=https://<your-domain>"
railway variables --set "NODE_ENV=production"
railway variables --set "SERVICE_NAME=smm-api"
```

`.env.example` documents every variable and its default. The service validates
all of them at startup and refuses to boot on anything missing or malformed,
so a misconfiguration fails the deploy rather than the first signup.

## 4. Migrate, then deploy

Migrations are a **release step, not something the service does at boot**.
Migrating on startup races every instance against every other, and a failed
migration would take down the service attempting it instead of failing the
deploy and leaving the previous version serving traffic.

```sh
railway run node packages/db/dist/cli.js up
railway up
```

Adding it as a Railway pre-deploy command runs it automatically on each deploy:

```
node packages/db/dist/cli.js up
```

Running it twice is safe. Two instances running it simultaneously is also safe —
an advisory lock serialises them, which matters because Railway starts a new
instance before stopping the old one, making concurrent migration the normal
case rather than a rare race.

## 5. Verify

```sh
curl https://<your-domain>/health   # {"status":"ok"}
curl https://<your-domain>/ready    # {"status":"ready"}
```

`/ready` is the health check path in `railway.json`. It returns 503 while
migrations are pending, so a deploy whose migration step failed will not take
traffic.

The two probes answer different questions and must not be swapped. `/health`
asks whether the process is alive and deliberately does not touch the database:
a liveness check that fails during a database blip gets the container killed,
which cannot help and removes capacity exactly when it is scarcest. `/ready`
asks whether this instance should receive traffic.

Then confirm signup works:

```sh
curl -X POST https://<your-domain>/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"a-sufficiently-long-passphrase",
       "name":"Your Name","organizationName":"Your Company"}'
```

## Scaling

`DATABASE_POOL_SIZE` is per process, not per system. Postgres allocates a
backend process per connection, so `replicas × pool size` must stay comfortably
under the database's connection limit. Raising replicas without lowering the
pool is the usual way to exhaust it.

## Rotating the credential key

Rotation is supported and is not a flag day:

1. Add a new key, keeping the old: `CREDENTIAL_KEYS=k1:<old>,k2:<new>`
2. Set `CREDENTIAL_CURRENT_KEY=k2` and deploy. New secrets seal under `k2`;
   existing ones still open under `k1`.
3. Re-seal existing credentials.
4. Only then remove `k1`. Removing it while any secret still references it makes
   those secrets permanently unreadable.

## What is not here yet

Being explicit, because a deployment guide that implies more than exists is
worse than none:

- **No worker service.** The publish dispatcher is not built, so nothing is
  published on a schedule yet.
- **No platform adapters.** The contract exists; no network client implements
  it. Bluesky is first because AT Protocol needs no approval.
- **No email.** Verification and password-reset tokens are modelled in the
  schema but nothing sends them.
- **No object storage.** Media upload needs an S3-compatible bucket.
- **No billing.**

## Moving off Railway later

Two disciplines keep this cheap, and both are already followed:

The code uses portable primitives only — plain Postgres, and no Railway-specific
APIs anywhere in the application.

Credentials go through the vault's `KeyProvider` interface. Railway has no
managed KMS, so the root key currently comes from an environment variable, which
cannot be rotated without a redeploy, cannot be audited, and is visible to anyone
with dashboard access. That is survivable at launch and will not survive a
security review. Swapping to a managed KMS means writing one `KeyProvider`
implementation, not re-encrypting a full credentials table.

The natural moment to move is during the platform API approval wait, when
nothing is publishing yet.
