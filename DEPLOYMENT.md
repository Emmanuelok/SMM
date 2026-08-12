# Deploying to Railway

What exists today deploys as **two services plus a Postgres database**: the API,
and the publish worker. Both run the same image with a different start command,
so they are provably the same build.

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

## 4. Deploy

```sh
railway up
```

Migrations run automatically. `railway.json` sets them as a **pre-deploy
command**, which Railway runs in a separate one-off container before switching
traffic to the new version:

```
node packages/db/dist/cli.js up
```

That is a release step, not a boot step. Migrating inside the service on startup
races every instance against every other, and a failed migration would take down
the service attempting it rather than failing the deploy and leaving the
previous version serving traffic. A pre-deploy command fails the deploy instead,
which is the outcome you want.

Running it twice is safe. Two instances running it simultaneously is also safe —
an advisory lock serialises them, which matters because Railway starts a new
instance before stopping the old one, making concurrent migration the normal
case rather than a rare race.

### Why the health check points at `/health` and not `/ready`

These answer different questions, and pointing Railway's deploy gate at the
wrong one makes the first deploy impossible.

`/ready` returns 503 while migrations are pending. That is correct behaviour for
a monitoring check — code running against an older schema fails in ways that
look like application bugs — but as a **deploy gate** it cannot be satisfied on a
first deploy: migrations have never run against a database the service has never
reached, so the gate never opens and the deploy fails with
`Healthcheck failure`.

`/health` asks only whether the process is alive, and deliberately does not touch
the database. That is the right question for a deploy gate. `/ready` is still
there and is the right thing to point a monitor or an uptime check at.

## 5. Verify

```sh
curl https://<your-domain>/health   # {"status":"ok"}
curl https://<your-domain>/ready    # {"status":"ready"}
```

`/health` is the deploy gate. `/ready` additionally confirms the database is
reachable and the schema is current, and is what a monitor should watch.

Then confirm signup works:

```sh
curl -X POST https://<your-domain>/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"a-sufficiently-long-passphrase",
       "name":"Your Name","organizationName":"Your Company"}'
```

## When a deploy fails

**`Healthcheck failure` after Build and Deploy both succeeded** means the
container started but nothing answered the probe. Open **View logs** on the
failed deployment; the cause is almost always one of three things, and each
prints plainly:

- *`Invalid configuration:` followed by a list.* A required variable is missing
  or malformed. The service validates everything at startup and refuses to boot
  rather than failing later on a customer's request, so this is the intended
  behaviour — set the variable and redeploy.
- *`DATABASE_URL is not set`.* The database is not linked to this service.
  Reference it as `${{Postgres.DATABASE_URL}}` rather than pasting a value.
- *`CREDENTIAL_KEYS is not set`.* Generate one as in step 2.

**The pre-deploy command failed.** The deploy is stopped before traffic moves and
the previous version keeps serving. The migration output names the file that
failed.

**Nothing in the logs at all** usually means the process exited before writing
anything, which points at the image rather than the configuration.

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

## Adding the worker service

Create a second Railway service from the same repository and point it at
`railway.worker.json`:

```sh
railway add --service worker
railway variables --service worker --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
railway variables --service worker --set "CREDENTIAL_KEYS=<same as the API>"
railway variables --service worker --set "SERVICE_NAME=smm-worker"
```

It needs the same credential keys as the API, because it decrypts the same
connection tokens.

The worker has no health check because it serves no traffic: it polls, and a
platform probe against a process with no listener would fail permanently. Its
liveness signal is its log output.

Running several replicas is safe. Work is claimed with `FOR UPDATE SKIP LOCKED`,
so a row held by one worker is invisible to the others rather than contended —
verified against Postgres: two workers claiming simultaneously take one row
between them, not one each.

## What is not here yet

Being explicit, because a deployment guide that implies more than exists is
worse than none:

- **Only Bluesky has an adapter.** Every other network parks its posts with a
  clear reason rather than failing obscurely. Bluesky came first because AT
  Protocol needs no approved developer application.
- **Connecting an account is not exposed over HTTP yet.** The Bluesky adapter
  implements the connect flow, but no API route drives it, so credentials
  cannot yet be added through the product.
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
