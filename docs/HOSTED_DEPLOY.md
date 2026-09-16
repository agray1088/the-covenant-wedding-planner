# Hosted deploy — public HTTPS for the sync API

This is **roadmap step 1**. Couples never install Postgres. The planner stays offline-first; cloud sync is opt-in against a hosted API + managed database.

Local Docker Desktop (`docker compose up -d`, host API **:18787**) is unchanged — see `docs/RECONNECT_AFTER_RESTART.md`.

## What users need

| Audience | Requirement |
|----------|-------------|
| **Couple / planner (end user)** | A browser. No Postgres, no Docker, no CLI. |
| **You (operator)** | A Railway (or Fly) account, secrets from the checklist below, and a domain (optional — platform HTTPS URL works). |

## Architecture (hosted)

```
Browser (planner)  ──opt-in──►  HTTPS sync API  ──►  managed Postgres
     │ localStorage + SQLite/IDB (always)
     └── file backup (.sqlite) — never requires cloud
```

- **Privacy:** local-first; cloud is opt-in. When cloud backup is enabled we store wedding sync data the user uploads — do **not** claim “we store nothing.” We do not sell data.
- **Auth (next):** password accounts + Google Sign-In + email recovery. Redirect URIs and reset links use `PUBLIC_URL`.
- **RSVP / guest portal / landing (later):** invitation and portal URLs are built from `PUBLIC_URL` (e.g. `${PUBLIC_URL}/r/...`). Wedding landing pages are **gated** (unlisted link and/or guest email and/or couple code) — not a public directory.

Full product order: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

## Recommended path: Railway (Node + Postgres)

Railway fits this stack well: managed Postgres, automatic HTTPS, Dockerfile deploy, env injection.

### Checklist

1. **Pull the branch**
   ```bat
   git checkout cursor/offline-cloud-sync-017e
   git pull origin cursor/offline-cloud-sync-017e
   ```
2. **Create a Railway project** from this GitHub repo.
3. **Add a Postgres** plugin/service. Copy `DATABASE_URL` (Railway injects it automatically when linked).
4. **Deploy the API** with Dockerfile `server/Dockerfile` (see root `railway.toml`).
   - Optional single-service UI+API: set dockerfile to `Dockerfile.hosted` and `SERVE_STATIC=1`.
5. **Set secrets** (Variables) from `server/.env.production.example`:

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `DATABASE_URL` | yes | From Railway Postgres |
   | `DATABASE_SSL` | yes | `1` |
   | `PUBLIC_URL` | yes | `https://<your-api>.up.railway.app` (no trailing slash) |
   | `CORS_ORIGIN` | yes | Origin(s) of the planner UI, comma-separated |
   | `SESSION_SECRET` | yes | ≥32 random chars |
   | `TRUST_PROXY` | yes | `1` |
   | `BOOTSTRAP_EMAIL` / `BOOTSTRAP_PASSWORD` | optional | Only for a private smoke user; remove after real accounts |
   | `GOOGLE_*` / `SMTP_*` | later | Placeholders until accounts + email ship |
   | `FEATURE_*` | optional | Keep `0` until features ship |

6. **Health check:** open `https://<PUBLIC_URL>/health` — expect `"ok": true`, `"db": "up"`. Platforms probe this path behind the HTTPS proxy.
7. **DNS (optional):** point `api.yourdomain.com` at Railway; set `PUBLIC_URL` to that HTTPS origin.
8. **Point the planner at the API** (Settings → Cloud sync, or console):
   ```js
   localStorage.setItem('covenant_cloud_api', 'https://<PUBLIC_URL>');
   localStorage.setItem('covenant_cloud_enabled', '1');
   location.reload();
   ```
9. **Do not** enable demo bootstrap credentials on a public internet deployment used by real couples.

### CORS

If the static planner is on `https://app.example.com` and the API on `https://api.example.com`:

```
CORS_ORIGIN=https://app.example.com
PUBLIC_URL=https://api.example.com
```

If one service serves both (`Dockerfile.hosted` + `SERVE_STATIC=1`), set both to the same HTTPS origin.

## Alternate path: Fly.io

Same Docker image (`server/Dockerfile`). Root `fly.toml` includes an HTTP health check on `/health` and `force_https`.

```bash
# once
fly apps create covenant-sync-api   # pick a unique name; edit fly.toml
fly postgres create                 # or attach an existing Fly Postgres
fly postgres attach <pg-app-name>
fly secrets set SESSION_SECRET="$(openssl rand -hex 32)" \
  PUBLIC_URL="https://covenant-sync-api.fly.dev" \
  CORS_ORIGIN="https://app.example.com" \
  DATABASE_SSL=1 \
  TRUST_PROXY=1
fly deploy
curl https://covenant-sync-api.fly.dev/health
```

## Self-host compose (optional)

Production-shaped Compose (password auth, **not** the local Windows trust stack):

```bash
cp server/.env.production.example server/.env.production
# edit POSTGRES_PASSWORD, SESSION_SECRET, PUBLIC_URL, CORS_ORIGIN
docker compose -f docker-compose.prod.yml --env-file server/.env.production up -d --build
curl http://127.0.0.1:18787/health
```

Put a reverse proxy (Caddy/nginx/Traefik) or Cloudflare Tunnel in front for real HTTPS. Prefer Railway/Fly managed Postgres for anything public.

## How `PUBLIC_URL` is used (now + later)

| Now | Later (same env) |
|-----|------------------|
| Health payload `publicUrl` | Google OAuth redirect: `${PUBLIC_URL}/auth/google/callback` |
| Operator docs / client config | Password-reset + “forgot username” email links |
| | RSVP + guest-portal links |
| | Gated wedding landing base URL |
| | Partner invite + vendor token accept URLs |

Configure Google Cloud Console redirect URIs and email templates **only after** `PUBLIC_URL` is stable HTTPS.

## Client enable steps (production)

1. Serve or open the planner (static hosting or `Dockerfile.hosted`).
2. **Settings → Cloud sync (beta)** → paste the HTTPS API base → **Save & enable**.
3. Or console:
   ```js
   localStorage.setItem('covenant_cloud_api', 'https://api.example.com');
   localStorage.setItem('covenant_cloud_enabled', '1');
   location.reload();
   ```
4. Sign in (demo user only on private/local stacks). Offline file backup still works with cloud off.

## Operator secrets checklist (copy/paste)

- [ ] `DATABASE_URL` from managed Postgres  
- [ ] `DATABASE_SSL=1`  
- [ ] `PUBLIC_URL=https://…`  
- [ ] `CORS_ORIGIN=https://…` (planner)  
- [ ] `SESSION_SECRET` (≥32 random)  
- [ ] `TRUST_PROXY=1`  
- [ ] `/health` returns 200 over HTTPS  
- [ ] Planner `covenant_cloud_api` points at `PUBLIC_URL`  
- [ ] No public `BOOTSTRAP_PASSWORD` for real couples  
- [ ] (Later) `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` + redirect URI  
- [ ] (Later) `SMTP_*` or email provider API key  

## Local demo still works

```bat
git pull origin cursor/offline-cloud-sync-017e
docker compose up -d
curl http://127.0.0.1:18787/health
```

Demo login: `demo@covenant.local` / `covenant-demo` against `http://localhost:18787`.

## What’s next

**Roadmap step 2 — Real accounts:** password accounts + Google Sign-In + forgot password/username via email. See [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).
