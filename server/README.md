# Covenant sync API (optional cloud)

Offline-first planner stays the default. This Node + Postgres API is **opt-in** for multi-device guest sync (beta).

## Prerequisites

- Node 18+
- Postgres 16 (Docker Compose **or** local install)

## Quick start (Docker Postgres + API) — recommended on Windows

Host `npm run server` → `127.0.0.1:5433` can hit Docker Desktop networking/auth issues.
Prefer running the API **inside Compose** on the same Docker network:

```bat
cd /d C:\Users\arian\the-covenant-wedding-planner
git pull origin cursor/offline-cloud-sync-017e
docker compose down -v
docker compose up -d
docker compose logs -f api
```

Wait until you see `listening on http://127.0.0.1:8787`, then open:
`http://127.0.0.1:8787/health`

Leave that running. Serve the planner in another terminal with `npm run serve`.

### Quick start (Docker Postgres only, API on host)

Compose maps Postgres to host port **5433**. Auth error `28P01` for user `covenant` from the Windows host often means the published port path is broken — use the `api` service above instead.

```bash
# from repo root
docker compose up -d postgres
cp server/.env.example server/.env   # Windows CMD: copy /Y server\.env.example server\.env
npm install --prefix server
npm run server
# → http://127.0.0.1:8787/health
```

`DATABASE_URL` for host Node must use port **5433**:
`postgres://covenant:covenant@127.0.0.1:5433/covenant`

## Quick start (local Postgres, no Docker)

### macOS / Linux

```bash
# create role + db (once)
sudo -u postgres psql -c "CREATE USER covenant WITH PASSWORD 'covenant' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE covenant OWNER covenant;"

cp server/.env.example server/.env
npm install --prefix server
npm run server
```

### Windows (CMD)

`docker` / `cp` / `sudo` are not available in CMD by default. Either install [Docker Desktop](https://www.docker.com/products/docker-desktop/), use a hosted Postgres URL, or create the local role once:

```bat
REM Open "SQL Shell (psql)" or:
psql -U postgres
```

In `psql`:

```sql
CREATE USER covenant WITH PASSWORD 'covenant' SUPERUSER;
CREATE DATABASE covenant OWNER covenant;
\q
```

Then in CMD from the repo root:

```bat
copy server\.env.example server\.env
npm run server:install
npm run server
```

If you prefer your existing Windows `postgres` superuser instead of creating `covenant`, edit `server\.env`:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@127.0.0.1:5432/postgres
```

(or create a `covenant` database first and point at it). Auth error `28P01` means the username/password in `DATABASE_URL` does not match Postgres — fix the URL, don’t change the app code.

Bootstrap demo user (from `.env.example`):

- email: `demo@covenant.local`
- password: `covenant-demo`

## API surface (v1)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | DB ping |
| POST | `/auth/register` | `{ email, password, displayName? }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| POST | `/auth/logout` | Bearer token |
| GET | `/auth/me` | Current user |
| POST | `/auth/magic-link` | **501 stub** — reserved |
| GET/POST | `/weddings` | List / create (upload this wedding) |
| GET | `/weddings/:id` | Membership-gated |
| GET | `/weddings/:id/guests` | List guests |
| PUT | `/weddings/:id/guests/:guestId` | Upsert one (LWW) |
| POST | `/weddings/:id/guests/bulk` | Upsert many |
| DELETE | `/weddings/:id/guests/:guestId` | Delete |

Auth header: `Authorization: Bearer <token>`.

## Enable the client bridge

Serve the static planner (`npm run serve` → `:8000`), then:

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:8787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

Open **Settings → Cloud sync (beta)** to sign in, upload this wedding, and sync guests.

## Cloud host next steps (not in this pass)

1. Provision managed Postgres (Neon, RDS, Cloud SQL, …) and set `DATABASE_URL`.
2. Deploy this `server/` as a small Node service (Fly, Render, Railway, Cloud Run).
3. Put TLS in front; set `CORS_ORIGIN` to the real static origin (or Pages/CDN URL).
4. Turn off `BOOTSTRAP_*` in production; keep registration or add invite-only.
5. Wire magic-link SMTP when ready (`MAGIC_LINK_*` placeholders in `.env.example`).
6. Expand sync beyond guests (vendors, budget, …) per `docs/OFFLINE_CLOUD_SYNC.md`.

## Conflict policy

Last-write-wins using guest `updated_at`. Server only overwrites when the incoming timestamp is ≥ stored. Client prefers local-newer rows and ACK timestamps from the API. See the architecture doc for details.
