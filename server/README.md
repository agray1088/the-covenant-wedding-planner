# Covenant sync API (optional cloud)

Offline-first planner stays the default. This Node + Postgres API is **opt-in** for multi-device guest sync (beta).

## Prerequisites

- Node 18+
- Postgres 16 (Docker Compose **or** local install)

## Quick start (Docker Postgres + API + browser pgAdmin) — recommended on Windows

Prefer running the API **and browser pgAdmin** inside Compose on the same Docker network (most reliable).

**Mandatory after any auth / `pg_hba` change:** recreate the volume with `-v` so Postgres re-inits (and so the mounted `server/pg_hba.conf` is what the server uses via `hba_file`):

```bat
cd /d C:\Users\arian\the-covenant-wedding-planner
git pull origin cursor/offline-cloud-sync-017e
docker compose down -v
docker compose up -d
docker compose logs -f api
```

`-v` removes the Postgres data volume — **required** when switching host auth (`trust` / md5 / custom `pg_hba.conf`). Local-dev data is wiped; that is expected for wedding-planner Docker Desktop only.

Wait until you see `listening on http://127.0.0.1:8787`, then open:
`http://127.0.0.1:8787/health`

Leave that running. Serve the planner in another terminal with `npm run serve`.

### Browse guests — preferred: browser pgAdmin (no host:5433)

Compose starts **pgAdmin** on the same Docker network as Postgres. Open:

**http://localhost:5050**

| Field | Value |
|-------|--------|
| Email | `admin@covenant.dev` |
| Password | `covenant` |

A server named **Covenant Postgres** is preconfigured:

| Field | Value |
|-------|--------|
| Host | `postgres` (Docker DNS — not `127.0.0.1`) |
| Port | `5432` |
| Database | `covenant` |
| Username | `covenant` |
| Password | `covenant` |

Expand **Servers → Covenant Postgres → Databases → covenant → Schemas → public → Tables → guests**.

This path never uses the published host port, so Windows desktop auth to `127.0.0.1:5433` is irrelevant.

### Browse guests — optional: desktop pgAdmin → host port 5433

Compose still publishes Postgres on **127.0.0.1:5433**. Auth is forced to **trust** by mounting `server/pg_hba.conf` and starting Postgres with `hba_file=/etc/postgresql/pg_hba.conf` (env `POSTGRES_HOST_AUTH_METHOD` alone only applies on first init). **Local Docker Desktop only — never use trust in production.**

In desktop pgAdmin → Register → Server:

| Field | Value |
|-------|--------|
| Host | `127.0.0.1` |
| Port | `5433` |
| Maintenance database | `covenant` |
| Username | `covenant` |
| Password | `covenant` (accepted; trust also allows empty) |

If you still see `FATAL: password authentication failed for user "covenant"`:

1. Run `docker compose down -v && docker compose up -d` again (old volume / old `pg_hba`).
2. Prefer **http://localhost:5050** instead of desktop pgAdmin.

### Quick start (Docker Postgres only, API on host)

Compose maps Postgres to host port **5433**. Prefer browser pgAdmin (`:5050`) or the `api` service; for host Node use trust + `hba_file`, or fall back to `docker exec` queries below.

```bash
# from repo root
docker compose down -v
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

## Verify guests landed in Postgres (Windows)

After status shows **Synced · … · wedding linked**, browse guests in **browser pgAdmin** at http://localhost:5050 (preferred), desktop pgAdmin on `127.0.0.1:5433`, or use `docker exec` as a fallback that never depends on the published port:

```bat
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, household, rsvp, updated_at FROM guests ORDER BY updated_at DESC LIMIT 50;"
```

Count + wedding ids:

```bat
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS guests FROM guests GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, name, bride, groom FROM weddings;"
```

Optional API check (PowerShell) — token is in browser `localStorage.covenant_cloud_token`:

```powershell
$token = "PASTE_TOKEN_HERE"
$wid = "PASTE_WEDDING_UUID_HERE"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:8787/weddings/$wid/guests"
```

## Cloud host next steps (not in this pass)

1. Provision managed Postgres (Neon, RDS, Cloud SQL, …) and set `DATABASE_URL`.
2. Deploy this `server/` as a small Node service (Fly, Render, Railway, Cloud Run).
3. Put TLS in front; set `CORS_ORIGIN` to the real static origin (or Pages/CDN URL).
4. Turn off `BOOTSTRAP_*` in production; keep registration or add invite-only.
5. Wire magic-link SMTP when ready (`MAGIC_LINK_*` placeholders in `.env.example`).
6. Expand sync beyond guests (vendors, budget, …) per `docs/OFFLINE_CLOUD_SYNC.md`.

## Conflict policy

Last-write-wins using guest `updated_at`. Server only overwrites when the incoming timestamp is ≥ stored. Client prefers local-newer rows and ACK timestamps from the API. See the architecture doc for details.
