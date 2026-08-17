# Go live: from the setup page to a working platform

This is the complete, click-by-click path from where you are now — both services
deployed on Railway but showing **"This deployment needs configuration"** — to a
live platform you can sign up on and publish from.

Time required: about ten minutes. Nothing here needs a terminal; one step uses
your browser's developer console.

`DEPLOYMENT.md` is the reference document (scaling, key rotation, moving off
Railway). This file is only the go-live sequence.

---

## What you have right now

Your Railway project contains two services built from this repository:

| Service | What it is | What it needs |
|---|---|---|
| `@smm/api` | The web app and API — the thing your URL points at | `DATABASE_URL`, `CREDENTIAL_KEYS`, `PUBLIC_URL`, `NODE_ENV` |
| `@smm/worker` | The publisher — picks up scheduled posts and sends them | `DATABASE_URL`, `CREDENTIAL_KEYS` (identical to the API's) |

Both are **deliberately running** even though they are unconfigured. The API
serves the setup page instead of crashing, so you can see what is missing
without reading build logs. The page updates itself: once every variable is
set correctly, the same URL serves the real product.

What's missing is exactly two things: a database, and the variables that point
the services at it.

---

## Step 1 — Add the PostgreSQL database

1. Open your Railway project (the canvas showing your two services).
2. Click **+ Create** (top right of the canvas — or right-click on empty
   canvas space).
3. Choose **Database** → **Add PostgreSQL**.
4. A third service named **Postgres** appears on the canvas. Wait for its
   deploy indicator to go green — usually under a minute.

That's the entire step. Railway provisions the database, a volume for its
data, and connection credentials automatically. You never need to open the
database itself.

> **Note the name.** The new service is called `Postgres` by default. If yours
> shows a different name, remember it — Step 3 references the database *by
> service name*.

---

## Step 2 — Generate your encryption key

### What this key is

`CREDENTIAL_KEYS` is the root key that encrypts the access tokens of every
social account anyone connects to your platform. Tokens are sealed with it
when an account is connected and unsealed with it every time a post is
published.

Two consequences, worth understanding before you generate it:

- **If the key leaks**, someone who also obtained your database could decrypt
  every connected account's tokens. Treat it like a master password.
- **If the key is lost**, the tokens can never be decrypted again. Every
  customer would have to reconnect every account. There is no recovery path —
  by design, because a recovery path would be a second way to steal it.

That is why you generate it yourself, on your own machine, rather than
accepting one from anyone — including from a chat with an AI. A secret that
has ever appeared in a conversation log has an extra copy you can't revoke.

### Generate it (no terminal needed)

1. In your browser — any page, right now — press **F12** (or right-click →
   **Inspect**).
2. Click the **Console** tab.
3. Paste this line and press Enter:

```js
(()=>{const b=new Uint8Array(32);crypto.getRandomValues(b);return 'k1:'+btoa(String.fromCharCode(...b))})()
```

4. It prints something shaped like:

```
'k1:Xq3mZ9vK2pL8wR5tY7uB1nC4dF6gH0jS3aE5iO7qT9w='
```

5. **Copy the whole value including the `k1:` prefix** (but not the
   surrounding quotes). The prefix is the key's *name* — it's how the system
   knows which key sealed which secret, which is what makes key rotation
   possible later.

> Prefer a terminal? Equivalent commands:
>
> **macOS / Linux:** `echo "k1:$(openssl rand -base64 32)"`
>
> **Windows PowerShell:**
> `$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); "k1:" + [Convert]::ToBase64String($b)`
>
> **Node:** `node -e "console.log('k1:' + require('crypto').randomBytes(32).toString('base64'))"`

### Back it up immediately

Before you paste it anywhere, save it in a password manager (1Password,
Bitwarden, etc.) or another safe place **that is not Railway**. If it only
exists inside the platform that holds the encrypted data, one account
compromise takes both.

---

## Step 3 — Configure `@smm/api`

1. On the Railway canvas, click the **`@smm/api`** service.
2. Open the **Variables** tab.
3. Click the **Raw Editor** toggle (top right of the variables panel) —
   fastest, because you can paste everything at once.
4. Paste these four lines, then fill in the two placeholders:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
CREDENTIAL_KEYS=PASTE_YOUR_KEY_FROM_STEP_2
PUBLIC_URL=https://YOUR-DOMAIN.up.railway.app
NODE_ENV=production
```

5. Click **Update Variables** (or save — Railway stages the change).

### What each line does, and the two placeholders

**`DATABASE_URL=${{Postgres.DATABASE_URL}}`** — typed *literally*, curly
braces and all. It is a **reference**, not a value: Railway resolves it to the
database's connection string at deploy time, and it keeps following the
database even if the database is ever recreated. Pasting the actual
`postgres://...` string instead would break silently the first time the
database changes.

- If your database service from Step 1 is not named `Postgres`, type `${{`
  and Railway's autocomplete lists the correct name to pick.
- The reference resolves to Railway's **internal** address
  (`postgres.railway.internal`), which never leaves Railway's private
  network. The app detects this and handles TLS correctly on its own — do
  **not** set `DATABASE_SSL`.

**`CREDENTIAL_KEYS`** — the exact value from Step 2, `k1:` prefix included.

**`PUBLIC_URL`** — the public domain of this API service, with `https://` in
front. To find it: **`@smm/api`** service → **Settings** tab → **Networking**
section — the domain you generated earlier is listed there (shaped like
`something.up.railway.app`). If no domain exists yet, click **Generate
Domain** in that same section. The app uses this value for cookie-security
decisions and for links it sends out, so a wrong value produces links that go
nowhere.

**`NODE_ENV=production`** — switches the app out of development defaults.

> Everything else is already correct by default: the port, the host binding,
> the proxy trust depth (`1`, matching Railway's proxy), the database pool
> size. You only ever need to touch those if `DEPLOYMENT.md` tells you to.

---

## Step 4 — Configure `@smm/worker`

1. Back on the canvas, click the **`@smm/worker`** service.
2. **Variables** tab → **Raw Editor**.
3. Paste two lines:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
CREDENTIAL_KEYS=THE_EXACT_SAME_KEY_AS_THE_API
```

4. Save.

**The key must be byte-for-byte identical to the API's.** The API encrypts a
social account's tokens when you connect it; the worker decrypts them when it
publishes. With mismatched keys nothing fails loudly at deploy time — posts
just start failing at publish time with a decryption error. Paste from the
same password-manager entry, don't retype.

The worker needs no `PUBLIC_URL` and no domain — it serves no web traffic.

---

## Step 5 — Deploy and watch it come up

1. After saving variables, Railway shows a **staged changes** banner (usually
   purple, at the top). Click **Deploy** to apply. If you saved each service
   separately, each may redeploy on its own — that's fine.
2. Watch the **`@smm/api`** service → **Deployments** tab → click the running
   deployment → **Deploy Logs**.

What you should see, in order:

```
Applying 0001_core.sql...
Applied 0001_core.sql
Applying 0002_scheduling_versions_metrics.sql...
...
Applied 0007_queue_assignment.sql
Applied 7 migration(s).
Server listening at http://0.0.0.0:....
```

The API builds its own database schema on first boot — all seven migrations,
in order, under a lock that makes it safe even when two instances start at
once. There is no separate migration step for you to run. (On later deploys
this says `No pending migrations.` instead.)

3. Check the **`@smm/worker`** logs the same way — it should report that it
   connected and registered its adapters (Bluesky, Mastodon), then go quiet.
   Quiet is correct: it wakes when a post is due.

Both services should show a green **Active** state within a couple of minutes.

---

## Step 6 — Open your URL and use it

Reload the same URL that was showing the setup page.

**You should now see the sign-in / create-account screen.** The setup page is
gone for good — it only ever appears when configuration is missing.

Then, in order:

### 6a. Create your account

Click **Create account**. Name, company/brand name, email, and a password of
at least 12 characters. This first account owns the workspace; your brand is
created automatically in your own timezone (taken from your browser).

### 6b. Connect a social account

Two networks work today — deliberately the two that require no platform
approval process:

**Bluesky** — open **Connect Bluesky** in the Accounts panel. It needs your
handle (e.g. `yourname.bsky.social`, no `@`) and an **app password** — not
your real password. Create one in the Bluesky app under **Settings → App
Passwords → Add App Password**, copy it whole (it is shown only once), and
paste it in. You can revoke it from that same screen at any time.

**Mastodon** — open **Connect Mastodon**, type your server (e.g.
`mastodon.social`), and you'll be sent to that server to approve access, then
returned here.

### 6c. Set your posting times (or don't)

The moment you connect an account, it gets a starter posting queue: **Monday
to Friday at 09:00 and 15:00**, in the account's own timezone. The **Posting
times** panel lets you reshape the week — click a time to remove it, use the
form to add one, **Pause queue** for a crisis hold that keeps your slots.

### 6d. Publish something

In **Compose**, write a post and pick the account. Two ways to time it:

- **Next free time in the queue** (the default) — the post takes the next
  open slot. The form tells you exactly when that is before you commit.
- **A time I pick** — a specific date, time, and timezone.

Schedule it. It appears in the **Scheduled** table; at the appointed time the
worker publishes it and the row flips to **published** with a link to the
live post. For a fast first test, pick a time two minutes out.

---

## If something is wrong

The system is built to name its problems. Check these in order:

| Symptom | Cause | Fix |
|---|---|---|
| Setup page still shows | A variable is missing or malformed — **the page lists which, by name** | Fix exactly the named variable in that service's Variables tab, redeploy |
| Setup page names `DATABASE_URL` | The reference didn't resolve (database renamed, or typed as plain text) | Retype using `${{` autocomplete on the Variables tab |
| Setup page names `CREDENTIAL_KEYS` | Missing, or lost the `k1:` prefix | Re-paste the full value from your password manager |
| Deploy log shows a TLS/SSL error to the database | `DATABASE_SSL` was set manually | Delete the `DATABASE_SSL` variable — detection is automatic |
| Migration failure in deploy logs | The log's own hint text says what to do — it diagnoses the common causes | Follow the hint; the database is left at a clean stopping point |
| Sign-in works but posts never publish | Worker misconfigured — check **its** variables, especially the key being identical | Fix worker variables, redeploy worker |
| A post shows **failed** with a message | The message is the actual reason (e.g. Bluesky rejected the app password) | Do what the message says — it's written to be acted on |
| A post shows **retrying** | A temporary network error; the retry time is shown | Nothing — it's already in hand |

Deeper diagnostics — every deploy-failure mode and its meaning — are in
`DEPLOYMENT.md` under **"When a deploy fails"**.

---

## After you're live: two habits

**Guard the key.** It's in your password manager from Step 2. That entry is
now the most important secret this product has. To rotate it later without
losing anything, see **"Rotating the credential key"** in `DEPLOYMENT.md` —
rotation adds a `k2:` alongside `k1:`, it never replaces in place.

**Let the URL be the status page.** Healthy: your app. Misconfigured: a page
naming what's wrong. Down: Railway's own error page, which means look at the
service logs. You never need to guess which of the three you're in.
