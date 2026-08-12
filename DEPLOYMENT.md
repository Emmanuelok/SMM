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

That is the whole step. **The deploy succeeds even if nothing is configured
yet**, which is deliberate: the service comes up and tells you what is missing
instead of dying and leaving you to read build logs.

Migrations run at startup, not as a separate pre-deploy command. Running them
in the service is safe because the migrator takes a Postgres advisory lock on a
reserved connection, so several instances starting at once during a rolling
deploy serialise rather than race — verified with two concurrent runners against
an empty database producing one set of migrations, not two.

A separate pre-deploy command was tried first and was worse in three ways: it is
a second place to fail, Railway applies the root `railway.json` to every service
so the worker ran it too despite having no business migrating, and when it fails
the deploy dies before anything can explain why.

If migrations fail, the service still starts and reports it on `/ready`. A
crash-looping container explains nothing.

### The three states a deployment can be in

| State | `/health` | `/ready` | What you see |
|---|---|---|---|
| Nothing configured | 200 | 503 | A page naming every missing variable |
| Configured, database unreachable | 200 | 503 | `/ready` returns the actual connection error |
| Working | 200 | 200 | The app |

`/health` answers 200 in all three, so the deploy gate always opens and the
problem is always visible in a browser rather than in a build log.

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
