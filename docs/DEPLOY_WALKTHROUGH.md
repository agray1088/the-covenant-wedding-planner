# Railway deploy walkthrough (do this on your PC)

Numbered, copy-paste path to put the Covenant sync API on **public HTTPS** with managed Postgres. Agents and docs **cannot** log into your Railway, Google, or SMTP accounts — you paste secrets in those dashboards.

**Reference (same facts, denser):** [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md)  
**Env template:** [`server/.env.production.example`](../server/.env.production.example)  
**Printable PDF:** [`DEPLOY_WALKTHROUGH.pdf`](./DEPLOY_WALKTHROUGH.pdf) (regenerate with `python docs/generate_deploy_walkthrough_pdf.py`)

Local Docker demo stays available while you deploy: `demo@covenant.local` / `covenant-demo` → `http://localhost:18787` (see [Local demo still works](#12-local-demo-still-works)).

---

## 0. Prerequisites (accounts you create)

Do these once on your PC / browser. Skip any you already have.

| # | Account | Why |
|---|---------|-----|
| A | [Railway](https://railway.app/) (GitHub login recommended) | Hosts the API + managed Postgres + HTTPS |
| B | [Google Cloud](https://console.cloud.google.com/) project + **OAuth Web client** | Continue with Google |
| C | SMTP provider — e.g. [Resend](https://resend.com/), SendGrid, Mailgun, or a Gmail **App Password** | Password reset, RSVP send, invite email |
| D | (Optional later) Cloudflare R2 or AWS S3 bucket + API keys | Portal hero / packet photos over HTTPS |

Also have this repo on your machine (or rely on Railway’s GitHub deploy of the same branch):

```powershell
cd C:\Users\arian\the-covenant-wedding-planner
git checkout cursor/offline-cloud-sync-017e
git pull origin cursor/offline-cloud-sync-017e
```

**Do right now:** Step **1** below — create the Railway project. Google + SMTP can wait until after you have a public HTTPS URL.

---

## 1. Create a Railway project (Step 1 — do this now)

1. Open [railway.app](https://railway.app/) → sign in.
2. **New Project** → **Deploy from GitHub**.
3. Select **`agray1088/the-covenant-wedding-planner`**.
4. When asked for a branch, choose **`cursor/offline-cloud-sync-017e`** (or `master` once this PR is merged).
5. Open the new service → **Settings** → **Build** and set **exactly**:

| Setting | Value |
|---------|--------|
| **Builder** | **Dockerfile** (not Railpack / Nixpacks) |
| **Dockerfile path** | `Dockerfile` |
| **Root Directory** | empty / `/` (repo root — do **not** point at a static UI folder) |

6. If Railway shows a yellow **pending changes** banner on the project canvas, click **Deploy** there — saved Builder settings do not apply until that banner is committed.
7. Confirm deploy logs say **`Using detected Dockerfile!`** (or build from `Dockerfile`). You should **not** see Railpack / “No start command detected”.

Repo config (`railway.toml`) also forces `builder = "DOCKERFILE"` and `dockerfilePath = "Dockerfile"` (API-only image at repo root). The root `Dockerfile` exists so Railway auto-detect prefers Docker over Railpack on the static planner.

Optional later (one HTTPS origin for planner + API): set Dockerfile path to `Dockerfile.single` and Variable `SERVE_STATIC=1`. First deploy: keep the default API-only `Dockerfile`.

Wait until the first deploy finishes (it may fail health checks until Postgres + env vars exist — that is OK).

### Fix right now if you already see Railpack / “No start command detected”

Railway is building the **repo-root static planner** (no `start` script) instead of the sync API image. Fix in the dashboard **before** waiting on a git pull:

1. Service → **Settings** → **Build**.
2. **Builder** → **Dockerfile**.
3. **Dockerfile path** → `Dockerfile` (or `server/Dockerfile` **and** Root Directory → `/server`).
4. **Root Directory** → leave empty / `/` when using root `Dockerfile`.
5. Click **Deploy** on the pending-changes banner (required — otherwise the next build stays on Railpack).
6. Then pull the latest branch and redeploy:

```powershell
git checkout cursor/offline-cloud-sync-017e
git pull origin cursor/offline-cloud-sync-017e
```

Redeploy from Railway (or push an empty commit) so the new root `Dockerfile` + `railway.toml` are used.

---

## 2. Add Postgres

1. In the same Railway project → **New** / **Add service** → **PostgreSQL**.
2. Open the API service → **Variables** / **Connect** / service linking UI → **link Postgres** so Railway injects **`DATABASE_URL`**.
3. On the API service, add Variable:

```
DATABASE_SSL=1
```

Managed Postgres needs TLS. Do not paste a fake `DATABASE_URL` if the plugin already injected one.

---

## 3. Generate a session secret (on your PC)

In PowerShell or Git Bash:

```bash
openssl rand -hex 32
```

Copy the output. You will paste it as `SESSION_SECRET` in the next step.

---

## 4. First Variables (core — paste before Google/SMTP)

Open the API service → **Variables**. Add these (replace placeholders after you have a public URL in Step 5).

**Port:** do not set `PORT` unless you want to. Railway injects `PORT` (usually `8080`) and the API listens on it. In **Settings → Networking → Public Domain**, the target port must match the port in the deploy log line `listening on http://0.0.0.0:<port>` (usually 8080). If you set `PORT` yourself, use that same number as the domain target port. Do not assume 8787 on Railway.

**`PUBLIC_URL`** must include the scheme (`https://<app>.up.railway.app`, no trailing slash). If the scheme is missing the server prepends `https://` and logs a warning, but fix the variable anyway.

**Safe to paste now** (exact keys from `.env.production.example`):

```
NODE_ENV=production
HOST=0.0.0.0
TRUST_PROXY=1
DATABASE_SSL=1
SESSION_SECRET=<paste openssl output>
SESSION_DAYS=30
SERVE_STATIC=0
```

**Leave empty on public prod used by real couples:**

```
BOOTSTRAP_EMAIL=
BOOTSTRAP_PASSWORD=
```

**Feature flags:** omit `FEATURE_*` so RSVP / landing / photos / invites / vendor tokens stay available when the rest of the stack is ready. If you paste from `.env.production.example`, change the `FEATURE_*=0` lines to `1` or delete them — `0` forces those features off.

You will set `PUBLIC_URL`, `CORS_ORIGIN`, and `CLIENT_APP_URL` in Step 5 after Railway gives you HTTPS.

---

## 5. Public HTTPS URL → PUBLIC_URL + CORS

1. Railway API service → **Settings** → **Networking** / **Public Networking** → generate a domain (looks like `https://something.up.railway.app`).
2. Copy that origin **with no trailing slash**.

Paste Variables (example values — use *your* host):

```
PUBLIC_URL=https://covenant-api-production.up.railway.app
CORS_ORIGIN=http://localhost:8000
CLIENT_APP_URL=http://localhost:8000
```

Notes:

- `PUBLIC_URL` = the **API** HTTPS origin (Railway domain).
- `CORS_ORIGIN` / `CLIENT_APP_URL` = where the **planner UI** runs. Local planner on port 8000 is fine for first smoke test. Later, add your hosted UI origin(s), comma-separated:

```
CORS_ORIGIN=http://localhost:8000,https://app.example.com
CLIENT_APP_URL=https://app.example.com
```

- Single-service UI+API (`Dockerfile.single` + `SERVE_STATIC=1`): set all three to the same Railway HTTPS origin.

Redeploy if Railway does not auto-redeploy after Variable changes.

---

## 6. Post-deploy checks (before Google/SMTP)

On your PC:

```bash
curl -s https://YOUR-PUBLIC-URL-HOST/health
```

Expect JSON including `"ok": true` and `"db": "up"`.

```bash
curl -s https://YOUR-PUBLIC-URL-HOST/setup/status
```

Expect booleans only (never secret values), for example:

- `publicUrlConfigured: true`
- `googleConfigured: false` (until Step 7)
- `smtpConfigured: false` (until Step 8)
- `objectStorageConfigured: false` (until optional Step 10)
- `publicUrl` matching your `PUBLIC_URL`

Platform healthcheck also probes `/health` (`railway.toml` → `healthcheckPath`).

---

## 7. Google OAuth (Continue with Google)

### 7a. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **OAuth consent screen** (External or Internal). Scopes: `openid`, `email`, `profile`.
2. **Credentials** → **Create credentials** → **OAuth client ID** → Application type **Web application**.
3. **Authorized JavaScript origins** (optional for this server flow): your planner origin(s), e.g. `http://localhost:8000`.
4. **Authorized redirect URIs** — must match **exactly**:

```
${PUBLIC_URL}/auth/google/callback
```

Concrete example if `PUBLIC_URL=https://covenant-api-production.up.railway.app`:

```
https://covenant-api-production.up.railway.app/auth/google/callback
```

5. Copy **Client ID** and **Client Secret**.

### 7b. Railway Variables

```
GOOGLE_CLIENT_ID=<from Google>
GOOGLE_CLIENT_SECRET=<from Google>
GOOGLE_REDIRECT_URI=
```

Leave `GOOGLE_REDIRECT_URI` empty to use the default `${PUBLIC_URL}/auth/google/callback`. Only set it if you need an override — then it must match the Console URI character-for-character.

Redeploy → re-check:

```bash
curl -s https://YOUR-PUBLIC-URL-HOST/setup/status
# googleConfigured should be true
```

More detail: [`AUTH.md`](./AUTH.md).

---

## 8. SMTP (Resend, Gmail app password, etc.)

Without SMTP, send endpoints return **503** `smtp_not_configured`. Couples can still **copy** RSVP / invite / reset links manually.

### Example A0 — Resend HTTPS API (recommended on Railway)

```
RESEND_API_KEY=<paste in Railway Variables only — never in chat or git>
EMAIL_FROM=The Covenant <onboarding@resend.dev>
```

Redeploy, then Settings -> Cloud sync -> Hosted setup checklist -> **Send test email**. `onboarding@resend.dev` only delivers to the email of the Resend account owner until you verify a domain and use `noreply@your-domain`.

### Example A — Resend (SMTP)

SMTP ports may be blocked on some Railway plans; if you see timeouts use Example A0 instead.

Typical values (confirm in Resend’s SMTP docs for your account):

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<Resend API key>
SMTP_FROM=noreply@your-verified-domain.com
SMTP_SECURE=0
```

### Example B — Gmail App Password

1. Google Account → Security → enable 2FA → create an **App Password**.
2. Railway Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<16-char app password>
SMTP_FROM=you@gmail.com
SMTP_SECURE=0
```

```
PASSWORD_RESET_HOURS=2
```

Redeploy → `/setup/status` should show `smtpConfigured: true` and `emailTransport` (`resend-api` or `smtp`).

### Email transport, test email, and troubleshooting

Transport selection (`GET /setup/status` -> `emailTransport`): `resend-api` when `RESEND_API_KEY` is set (preferred, plain HTTPS to `https://api.resend.com/emails`), else `smtp` when `SMTP_HOST` is set, else `none`. Set `EMAIL_FROM` (falls back to `SMTP_FROM`) for the sender. `smtpConfigured` in `/setup/status` means "some email transport works"; `resendConfigured` / `smtpHostConfigured` show which.

- **Timeouts:** SMTP connect fails after 10s (`SMTP_CONNECT_TIMEOUT_MS`), each SMTP reply after 15s (`SMTP_IO_TIMEOUT_MS`); the Resend API call after 15s (`EMAIL_API_TIMEOUT_MS`).
- **Logging:** every attempt writes `[covenant-mail] kind=... to=j***@domain transport=... result=attempt|sent|failed code=... message=...`. Recipient is masked; keys, passwords, tokens, and reset links are never logged.
- **Forgot password / username** always return the generic "If an account exists..." message. Failures are logged and recorded in `outbound_emails` (`status=failed`, `error`) instead of being shown to the caller.
- **Send test email:** Settings -> Cloud sync -> Hosted setup checklist -> **Send test email** (sign in first) calls authenticated `POST /setup/test-email`, sends to your own account email, and shows the real result/error.
- **Resend test sender:** `onboarding@resend.dev` only delivers to the email address of the Resend account owner until you verify a domain.
- **Railway SMTP caveat:** outbound SMTP ports may be blocked on some plans (e.g. Free/Trial/Hobby), which shows up as timeouts. HTTPS (`RESEND_API_KEY`) is not affected.
- Where to look: Railway -> your service -> **Deployments -> View logs** (search `covenant-mail`), and Resend dashboard -> **Logs** / **Emails**.

| Symptom (server log `[covenant-mail] ... result=failed`) | Likely cause | Fix |
|---|---|---|
| `code=smtp_connect_timeout` / `smtp_timeout` / `smtp_connect_failed` | Host may block outbound SMTP ports (25/465/587) on some plans (Railway has restricted SMTP on some plan tiers — check current docs) | Set `RESEND_API_KEY` to use HTTPS instead, or upgrade/choose a host that allows SMTP |
| `code=smtp_auth_failed` (535) or `resend_rejected` with 401 | Wrong `SMTP_USER`/`SMTP_PASS`, or revoked/mistyped API key | Re-create the key in the provider dashboard and update Railway Variables |
| `resend_rejected` 403 "only send testing emails to your own email address" / SMTP 550 | Using `onboarding@resend.dev` with a recipient that is not the Resend account owner | Verify a domain in Resend and set `EMAIL_FROM=The Covenant <noreply@your-domain>`; or test with the account owner's email |
| `resend_rejected` 403 "domain is not verified" | `EMAIL_FROM` domain not verified | Finish DNS verification in Resend |
| `result=sent` but nothing in inbox | Spam folder, or provider-side bounce | Check spam; check Resend dashboard -> Logs / Emails for delivery status |
| No `[covenant-mail]` line at all | Account does not exist for that address (forgot-password stays generic by design), or no transport configured (`/setup/status` -> `emailTransport: "none"`) | Use **Send test email** (signed in) to verify the transport |



---

## 9. Point the planner at the HTTPS API

### Option A — Settings UI

1. Open the planner (e.g. `http://localhost:8000/`).
2. **Settings → Cloud sync (beta)**.
3. Paste your API base = `PUBLIC_URL` (same string, no trailing slash).
4. **Save & enable**.
5. Open **Hosted setup checklist** — should match `/setup/status` (Google / SMTP / PUBLIC_URL readiness).

### Option B — Browser console

```js
localStorage.setItem('covenant_cloud_api', 'https://YOUR-PUBLIC-URL-HOST');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

Client base must match `PUBLIC_URL` exactly (same origin string, no trailing slash).

---

## 10. Optional — R2 / S3 photos

Skip until core API + auth + SMTP work.

1. Create a Cloudflare R2 or AWS S3 bucket + API keys + a public/CDN base URL.
2. Railway Variables (R2 example):

```
PHOTO_STORAGE=r2
R2_BUCKET=covenant-photos
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_BASE_URL=https://photos.example.com
```

S3 alternative: `PHOTO_STORAGE=s3` plus `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` (see `.env.production.example`).

3. Confirm `/setup/status` → `objectStorageConfigured: true`.

Details: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md).

---

## 11. Full Variables cheat sheet (copy keys)

Paste names into Railway Variables. **Never commit real values.**

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `DATABASE_URL` | yes | Injected by linked Postgres |
| `DATABASE_SSL` | yes | `1` |
| `PUBLIC_URL` | yes | `https://covenant-api-production.up.railway.app` |
| `CORS_ORIGIN` | yes | `http://localhost:8000` or hosted UI origin(s) |
| `CLIENT_APP_URL` | recommended | Same as planner origin |
| `SESSION_SECRET` | yes | `openssl rand -hex 32` |
| `TRUST_PROXY` | yes | `1` |
| `GOOGLE_CLIENT_ID` | for Google | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | for Google | From Google Cloud |
| `GOOGLE_REDIRECT_URI` | optional | Default `${PUBLIC_URL}/auth/google/callback` |
| `SMTP_HOST` | for email | `smtp.resend.com` / `smtp.gmail.com` |
| `SMTP_PORT` | for email | `587` |
| `SMTP_USER` / `SMTP_PASS` | for email | Provider credentials |
| `SMTP_FROM` | for email | `noreply@yourdomain.com` |
| `SMTP_SECURE` | optional | `0` for 587; `1` for 465 |
| `RESEND_API_KEY` | alt. to SMTP | Resend HTTPS API (preferred when set) |
| `EMAIL_FROM` | optional | From address (falls back to `SMTP_FROM`) |
| `PHOTO_STORAGE` + `R2_*` / `S3_*` | optional | See Step 10 |
| `BOOTSTRAP_*` | **no** on public prod | Smoke-only |

Canonical commented file: `server/.env.production.example`.

---

## 12. Local demo still works

Do **not** point production Google/SMTP secrets at the local Compose stack.

```powershell
git pull origin cursor/offline-cloud-sync-017e
docker compose up -d
curl http://127.0.0.1:18787/health
```

| Field | Value |
|-------|--------|
| Email | `demo@covenant.local` |
| Password | `covenant-demo` |
| API | `http://localhost:18787` |

Reconnect checklist: [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md).

---

## 13. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| **`No start command detected` / Railpack prepare error** | Builder is Railpack on repo root (static planner). Settings → Build → **Dockerfile**, path **`Dockerfile`**, Root Directory empty, then **Deploy** the pending banner. See [Fix right now](#fix-right-now-if-you-already-see-railpack--no-start-command-detected) |
| Deploy crash / healthcheck fail | Link Postgres; set `DATABASE_SSL=1`; wait for `DATABASE_URL`; check deploy logs |
| `/health` → db not `up` | Postgres not linked or TLS — confirm `DATABASE_URL` + `DATABASE_SSL=1` |
| Browser CORS errors | Add the exact planner origin to `CORS_ORIGIN` (scheme + host + port) |
| Google redirect_uri_mismatch | Console URI must equal `${PUBLIC_URL}/auth/google/callback` with no trailing slash on `PUBLIC_URL` |
| Google works but no return to planner | Set `CLIENT_APP_URL` (or first `CORS_ORIGIN`) to the planner origin |
| RSVP / reset send → 503 `smtp_not_configured` | Set all `SMTP_*`; redeploy; confirm `/setup/status` `smtpConfigured` |
| Checklist says PUBLIC_URL missing | Set `PUBLIC_URL` to the Railway HTTPS origin (no trailing slash) |
| Client / server mismatch in Settings | `covenant_cloud_api` must equal `PUBLIC_URL` character-for-character |
| Features “missing” after paste from example | Remove `FEATURE_*=0` or set to `1` |
| Photos still local-only | Optional Step 10 — `PHOTO_STORAGE` + bucket keys + public base URL |

Fly.io alternate path and self-host Compose: [`HOSTED_DEPLOY.md`](./HOSTED_DEPLOY.md).

---

## Done checklist

- [ ] Railway **Builder = Dockerfile**, path **`Dockerfile`**, branch `cursor/offline-cloud-sync-017e`  
- [ ] Deploy logs show Dockerfile (not Railpack / “No start command”)  
- [ ] Postgres linked + `DATABASE_SSL=1`  
- [ ] `SESSION_SECRET`, `TRUST_PROXY=1`, `PUBLIC_URL`, `CORS_ORIGIN`  
- [ ] `GET /health` → ok + db up over HTTPS  
- [ ] `GET /setup/status` → expected booleans  
- [ ] Google redirect URI registered + secrets pasted  
- [ ] SMTP pasted (or accept copy-link-only email)  
- [ ] Planner Cloud sync pointed at `PUBLIC_URL`  
- [ ] No public `BOOTSTRAP_PASSWORD` for real couples  

Related: [`AUTH.md`](./AUTH.md) · [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) · [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) · [`OFFLINE_CLOUD_SYNC.md`](./OFFLINE_CLOUD_SYNC.md).

---

## 14. Host the planner itself (second Railway service) — open it on any device

Goal: a permanent HTTPS link to the planner so you do not need `python -m http.server`, and partner/guest/vendor links work 24/7. This is a **second service in the same Railway project**, built from the **same GitHub repo**. It is static files only: no database, no secrets.

Your API URL below is `https://the-covenant-wedding-planner-production.up.railway.app` (replace with yours if different).

### Why two config files

| File | Service | Image |
|------|---------|--------|
| `/railway.api.toml` | Sync API (`the-covenant-wedding-planner`) | `Dockerfile` (Node + Postgres) |
| `/railway.toml` (default) or `/railway.hosted.toml` | Planner page (`romantic-perception`) | `Dockerfile.hosted` (static files only) |

Railway applies `/railway.toml` to every service unless you change **Config-as-code**. If the planner page keeps crashing with `[covenant-sync]` / `password authentication failed for user "covenant"`, it is still using the API image. Fix the Config-as-code paths below.

### 14a. Point the API at the API config (do this first)

1. Open the **API** service (`the-covenant-wedding-planner`).
2. **Settings** → find **Config-as-code** (sometimes under Source / Build).
3. Set the config file path to exactly: `/railway.api.toml`
4. Click **Deploy**. Wait for green.
5. Check `https://the-covenant-wedding-planner-production.up.railway.app/health` still says `ok`.

If you skip this and only redeploy the planner, the next API deploy may build the static image by mistake.

### 14b. Fix or create the planner page service

1. Open **`romantic-perception`** (or create it: **+ New** → **GitHub Repo** → same repo).
2. **Settings → Source** → branch `cursor/offline-cloud-sync-017e`. Root Directory empty.
3. **Settings → Config-as-code** → `/railway.toml` (or `/railway.hosted.toml`). Both mean static.
4. **Settings → Build** → Builder = Dockerfile, Dockerfile Path = `Dockerfile.hosted` (if the field is shown).
5. **Settings → Deploy** → Custom Start Command must be **empty** (or `node static-server.mjs`). Never `node index.js`.
6. **Variables** — only:

```
API_BASE_URL=https://the-covenant-wedding-planner-production.up.railway.app
```

   You can delete `RAILWAY_DOCKERFILE_PATH` now; Config-as-code sets the Dockerfile. Do **not** set `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, or `CLIENT_APP_URL` on this service.
7. **Networking → Generate Domain** if you do not have one yet.
8. **Deploy**. Open `<planner URL>/health` — it must say `ok`. Deploy logs must mention `static-server`, **not** `[covenant-sync]`.

### 14c. Wire CORS + Google

1. On the **API** service → Variables:

```
CORS_ORIGIN=http://localhost:8000,https://romantic-perception-production-74be.up.railway.app
CLIENT_APP_URL=https://romantic-perception-production-74be.up.railway.app
```

2. Google Cloud Console → Credentials → OAuth client → **Authorized JavaScript origins** → add the planner URL. Redirect URI stays `<API URL>/auth/google/callback`.

3. Open the planner URL, Settings → Cloud sync, sign in.

### Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Logs show `[covenant-sync]` / `covenant@postgres` | Planner built the API image | Set Config-as-code to `/railway.toml` and Deploy |
| `SESSION_SECRET is unset` on planner | Same as above | Same fix — planner never needs that secret |
| API `/health` breaks after this change | API still on default `/railway.toml` | Set API Config-as-code to `/railway.api.toml` |
| CORS error in browser | Planner origin missing from API `CORS_ORIGIN` | Edit API variables |
| No API default in Settings | `API_BASE_URL` missing | Check `<planner URL>/config.js` |
