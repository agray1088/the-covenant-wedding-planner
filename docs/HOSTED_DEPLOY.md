# Hosted deploy — Railway (preferred) + Fly

End-to-end operator path to put the Covenant sync API on public HTTPS with managed Postgres, Google Sign-In, SMTP, and optional R2/S3 photo storage.

**Guided PC walkthrough (numbered, copy-paste):** [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) · printable [`DEPLOY_WALKTHROUGH.pdf`](./DEPLOY_WALKTHROUGH.pdf).

**Honest limit:** this repo ships Dockerfiles, `railway.api.toml` / `railway.toml` (static) / `fly.toml`, and env templates. **You** create the Railway/Fly/Google/SMTP/(optional R2) accounts and **paste secrets in the host dashboard** (or `fly secrets set`). Agents and docs cannot log into your cloud for you.

Local Docker Desktop demo is unchanged — see [Local demo still works](#local-demo-still-works). Couples never install Postgres.

## Architecture

```
Browser (planner)  ──opt-in──►  HTTPS sync API  ──►  managed Postgres
     │ localStorage + SQLite/IDB (always)
     └── file backup (.sqlite / .zip) — never requires cloud
```

- **Privacy:** local-first; cloud is opt-in. When cloud backup is enabled we store wedding sync data the user uploads — we do not sell data.
- **Auth:** password + Google + email recovery — [`AUTH.md`](./AUTH.md). Redirects and reset links use `PUBLIC_URL`.
- **RSVP / portal / landing:** links from `PUBLIC_URL` (`/guest/rsvp/…`, `/p/…`). Gated, not a public directory — [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md).
- **Photos (optional):** `PHOTO_STORAGE=s3|r2` — [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md).

Full product order: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

---

## Pull this branch

```bat
git checkout cursor/offline-cloud-sync-017e
git pull origin cursor/offline-cloud-sync-017e
```

Template for every secret: **`server/.env.production.example`**. Copy names into the host UI; never commit real values.

---

## Recommended path: Railway

Railway fits this stack: managed Postgres, automatic HTTPS, Dockerfile deploy, dashboard Variables.

**Prefer the step-by-step guide?** Start at Step 1 in [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) (create the Railway project on your PC).

### 1. Create the project

1. [Railway](https://railway.app/) → **New Project** → **Deploy from GitHub** (this repo), branch **`cursor/offline-cloud-sync-017e`**.
2. Service → **Settings** → **Build**:
   - **Builder** = **Dockerfile** (not Railpack)
   - **Dockerfile path** = `Dockerfile` (repo-root API image)
   - **Root Directory** = empty / `/`
   - Click **Deploy** on any pending-changes banner
3. Config files: API service → Config-as-code `/railway.api.toml` (`Dockerfile` + `node index.js`). Planner page → default `/railway.toml` or `/railway.hosted.toml` (`Dockerfile.hosted` + `node static-server.mjs`). Do not leave the API on the default file or it will serve static HTML.
4. Optional single-service UI+API: set Dockerfile path to `Dockerfile.single` and Variable `SERVE_STATIC=1`.

**Already failing with Railpack?** Fix Builder/path in the dashboard first (steps above), then `git pull origin cursor/offline-cloud-sync-017e` and redeploy. Exact clicks: [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) §1.

### 2. Add Postgres

1. In the project → **Add service** → **PostgreSQL**.
2. Link it to the API service so Railway injects **`DATABASE_URL`**.
3. Set **`DATABASE_SSL=1`** on the API (managed Postgres needs TLS).

### 3. Set all Variables (paste secrets here)

**Port:** Railway injects `PORT` (usually `8080`); the API listens on it. In Networking → Public Domain, set the target port to whatever the deploy log says (`[covenant-sync] listening on http://0.0.0.0:<port>`), usually 8080, or set `PORT` explicitly and match it. Dockerfile path is `Dockerfile` at the repo root.


Open the API service → **Variables**. Paste from `server/.env.production.example`:

| Variable | Required | Value / notes |
|----------|----------|----------------|
| `DATABASE_URL` | yes | Injected when Postgres is linked |
| `DATABASE_SSL` | yes | `1` |
| `PUBLIC_URL` | yes | `https://<your-api>.up.railway.app` — **include `https://`, no trailing slash** (a missing scheme is auto-prefixed with `https://` and logged as a warning). After first deploy, copy the public HTTPS URL from Railway Networking / Domains. |
| `CORS_ORIGIN` | yes | Planner UI origin(s), comma-separated (e.g. `https://app.example.com` or same as `PUBLIC_URL` if `Dockerfile.single`) |
| `CLIENT_APP_URL` | recommended | Where Google returns `?cloudToken=` — defaults to first `CORS_ORIGIN` |
| `SESSION_SECRET` | yes | ≥32 random chars (`openssl rand -hex 32`) |
| `TRUST_PROXY` | yes | `1` (Railway terminates TLS) |
| `GOOGLE_CLIENT_ID` | for Google | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | for Google | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | optional | Default `${PUBLIC_URL}/auth/google/callback` |
| `SMTP_HOST` | for email | Transactional SMTP host |
| `SMTP_PORT` | for email | Usually `587` |
| `SMTP_USER` / `SMTP_PASS` | for email | Provider credentials |
| `SMTP_FROM` | for email | e.g. `noreply@yourdomain.com` |
| `SMTP_SECURE` | optional | `0` for 587 STARTTLS; `1` for 465 |
| `RESEND_API_KEY` | alt. to SMTP | Resend HTTPS API; preferred over SMTP when set |
| `EMAIL_FROM` | optional | From address (falls back to `SMTP_FROM`) |
| `PHOTO_STORAGE` | optional | `s3` or `r2` (omit / `local` = no object storage) |
| `S3_*` or `R2_*` | optional | Bucket, keys, region/endpoint, `S3_PUBLIC_BASE_URL` / `R2_PUBLIC_BASE_URL` |
| `BOOTSTRAP_EMAIL` / `BOOTSTRAP_PASSWORD` | **no** on public prod | Smoke-only; remove for real couples |
| `FEATURE_*` | optional | RSVP/landing default on in app when unset; set `0` to force off |

Redeploy after changing Variables (Railway usually redeploys automatically).

### 4. Google OAuth redirect URI

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth Web client:

**Authorized redirect URI** (must match exactly):

```
https://<your-PUBLIC_URL-host>/auth/google/callback
```

Example: if `PUBLIC_URL=https://covenant-api.up.railway.app`, register:

```
https://covenant-api.up.railway.app/auth/google/callback
```

Also set JavaScript origins / `CLIENT_APP_URL` to your planner origin. Full steps: [`AUTH.md`](./AUTH.md).

### 5. SMTP (RSVP + auth email)

Any transactional SMTP (SendGrid, Mailgun, SES, Postmark, workspace SMTP). Set `SMTP_*` in Railway Variables. Without SMTP, send endpoints return **503** `smtp_not_configured`; couples can still copy RSVP / invite links manually. Checklist: [`AUTH.md`](./AUTH.md).

Alternatively set `RESEND_API_KEY` (+ `EMAIL_FROM`) to send through Resend's HTTPS API; it takes precedence over SMTP and avoids blocked SMTP ports.

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

### 6. Optional PHOTO_STORAGE (R2 / S3)

1. Create a Cloudflare R2 or AWS S3 bucket + API keys + public/CDN base URL.
2. Set `PHOTO_STORAGE=r2` (or `s3`) and the matching `R2_*` / `S3_*` vars from `.env.production.example`.
3. Confirm `/setup/status` → `objectStorageConfigured: true`. Details: [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md). Phased ops / hardening checklist: [`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md).

### 7. Verify after deploy

```bash
curl -s https://<PUBLIC_URL>/health
# expect: "ok": true, "db": "up"

curl -s https://<PUBLIC_URL>/setup/status
# expect booleans: publicUrlConfigured, googleConfigured, smtpConfigured, objectStorageConfigured
# (never secret values)
```

Platforms also probe `/health` (see `railway.api.toml` / `railway.toml` `healthcheckPath`).

In the planner: **Settings → Cloud sync → Hosted setup checklist** shows the same readiness live.

### 8. Point the planner at HTTPS PUBLIC_URL

**Settings → Cloud sync (beta)** → paste `https://<PUBLIC_URL>` → **Save & enable**.

Or console:

```js
localStorage.setItem('covenant_cloud_api', 'https://<PUBLIC_URL>');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

Client base must match `PUBLIC_URL` (same origin string, no trailing slash).

### CORS (two hosts vs one)

```
# API + separate static planner
CORS_ORIGIN=https://app.example.com
PUBLIC_URL=https://api.example.com

# Single service (Dockerfile.single + SERVE_STATIC=1)
CORS_ORIGIN=https://your-app.up.railway.app
PUBLIC_URL=https://your-app.up.railway.app
CLIENT_APP_URL=https://your-app.up.railway.app
```

Optional custom domain: point DNS at Railway, then set `PUBLIC_URL` (and Google redirect) to that HTTPS origin.

---

## Alternate path: Fly.io

Same image (root `Dockerfile`). Root `fly.toml` force-HTTPS + `/health` check. App name in `fly.toml` is a placeholder — change it before first deploy.

```bash
# once — edit app name in fly.toml if needed
fly apps create covenant-sync-api
fly postgres create                 # or use an existing Fly Postgres
fly postgres attach <pg-app-name>   # injects DATABASE_URL

# Required + Google + SMTP (+ optional R2/S3) — paste real values in your shell, not in git
fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  PUBLIC_URL="https://covenant-sync-api.fly.dev" \
  CORS_ORIGIN="https://app.example.com" \
  CLIENT_APP_URL="https://app.example.com" \
  DATABASE_SSL=1 \
  TRUST_PROXY=1 \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  SMTP_HOST="..." \
  SMTP_PORT=587 \
  SMTP_USER="..." \
  SMTP_PASS="..." \
  SMTP_FROM="noreply@example.com"
  # optional photos:
  # PHOTO_STORAGE=r2 R2_BUCKET=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
  # R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com R2_PUBLIC_BASE_URL=https://photos.example.com

fly deploy

curl -s https://covenant-sync-api.fly.dev/health
curl -s https://covenant-sync-api.fly.dev/setup/status
```

Google redirect URI: `https://covenant-sync-api.fly.dev/auth/google/callback` (or your custom domain). Then set planner `covenant_cloud_api` to the same HTTPS `PUBLIC_URL` as in the Railway steps above.

Non-secret defaults already in `fly.toml` `[env]`: `NODE_ENV`, `PORT`, `HOST`, `TRUST_PROXY`, `DATABASE_SSL`. **Secrets never belong in `fly.toml`** — only `fly secrets set` / the dashboard.

---

## Self-host compose (optional)

Production-shaped Compose (password auth — **not** the local Windows trust stack):

```bash
cp server/.env.production.example server/.env.production
# edit POSTGRES_PASSWORD, SESSION_SECRET, PUBLIC_URL, CORS_ORIGIN, Google, SMTP, optional PHOTO_*
docker compose -f docker-compose.prod.yml --env-file server/.env.production up -d --build
curl http://127.0.0.1:18787/health
curl http://127.0.0.1:18787/setup/status
```

Put Caddy/nginx/Traefik or Cloudflare Tunnel in front for real HTTPS. Prefer Railway/Fly managed Postgres for anything public.

---

## Operator secrets checklist (copy/paste)

Paste these in the **Railway Variables** or **Fly secrets** UI — not into git.

**Core**

- [ ] `DATABASE_URL` from managed Postgres  
- [ ] `DATABASE_SSL=1`  
- [ ] `PUBLIC_URL=https://…` (no trailing slash)  
- [ ] `CORS_ORIGIN=https://…` (planner)  
- [ ] `CLIENT_APP_URL=https://…` (recommended)  
- [ ] `SESSION_SECRET` (≥32 random)  
- [ ] `TRUST_PROXY=1`  

**Google**

- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`  
- [ ] Console redirect URI = `${PUBLIC_URL}/auth/google/callback`  

**SMTP**

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`  

**Optional photos**

- [ ] `PHOTO_STORAGE=s3|r2` + bucket/keys + `S3_PUBLIC_BASE_URL` or `R2_PUBLIC_BASE_URL`  

**Verify**

- [ ] `GET /health` → 200, `"ok": true`, `"db": "up"` over HTTPS  
- [ ] `GET /setup/status` → expected booleans (confirm in Settings → Cloud sync checklist)  
- [ ] Planner `covenant_cloud_api` = `PUBLIC_URL`  
- [ ] No public `BOOTSTRAP_PASSWORD` for real couples  

---

## How `PUBLIC_URL` is used

| Use | Path / behavior |
|-----|-----------------|
| Health / setup | `publicUrl` on `/health` and `/setup/status` |
| Google OAuth | `${PUBLIC_URL}/auth/google/callback` |
| Password reset | `${PUBLIC_URL}/auth/reset-password?token=…` |
| RSVP / guest portal | `/guest/rsvp/…`, `/p/…` |
| Partner / vendor | `/invite/…`, `/vendor/portal/…` |

---

## Local demo still works

Unchanged — do **not** point production secrets at this stack.

```bat
git pull origin cursor/offline-cloud-sync-017e
docker compose up -d
curl http://127.0.0.1:18787/health
curl http://127.0.0.1:18787/setup/status
```

| Field | Value |
|-------|--------|
| Email | `demo@covenant.local` |
| Username | `demo` |
| Password | `covenant-demo` |
| API | `http://localhost:18787` |

See [`RECONNECT_AFTER_RESTART.md`](./RECONNECT_AFTER_RESTART.md).

---

## Config files in this repo

| File | Role |
|------|------|
| `Dockerfile` | **Railway default** — API-only image (repo-root context; auto-detected) |
| `railway.api.toml` | API: Dockerfile builder + `node index.js` + `/health` |
| `railway.toml` / `railway.hosted.toml` | Planner page: `Dockerfile.hosted` + `static-server.mjs` + `/health` |
| `fly.toml` | Fly app, force HTTPS, `/health` |
| `server/Dockerfile` | Same API image when build context is `./server` (Compose) |
| `Dockerfile.single` | Optional API + static planner |
| `server/.env.production.example` | **Every** production var with comments |
| `docker-compose.prod.yml` | Optional self-host |

## Status

**Polish trio done:** (1) hosted secrets checklist UX, (2) S3/R2 photo foundation, (3) Railway/Fly deploy wiring docs + config. Operator still pastes real Google + SMTP (+ optional R2/S3) secrets in the host dashboard.

After an incident or chat leak, rotate secrets with [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) (never paste secrets in chat). Optional photo ops phases: [`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md). Security policy (no backdoors, “lost my key” playbook, Postgres not public): [`SECURITY_PLAN.md`](./SECURITY_PLAN.md).

Related: [`DEPLOY_WALKTHROUGH.md`](./DEPLOY_WALKTHROUGH.md) · [`AUTH.md`](./AUTH.md) · [`BACKUP_AND_PHOTOS.md`](./BACKUP_AND_PHOTOS.md) · [`SECRET_ROTATION_PLAN.md`](./SECRET_ROTATION_PLAN.md) · [`SECURITY_PLAN.md`](./SECURITY_PLAN.md) · [`CLOUD_PHOTOS_PLAN.md`](./CLOUD_PHOTOS_PLAN.md) · [`RSVP_AND_GUEST_PORTAL.md`](./RSVP_AND_GUEST_PORTAL.md) · [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).
