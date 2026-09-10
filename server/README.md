# Covenant sync API (optional cloud)

Offline-first planner stays the default. This Node + Postgres API is **opt-in** for multi-device guest + vendor + payment + budget + seating + contract + timeline + packet + rental sync (beta).

## Prerequisites

- Node 18+
- Postgres 16 (Docker Compose **or** local install)

## Quick start (Docker Postgres + API + browser pgAdmin) — recommended on Windows

Prefer running the API **and browser pgAdmin** inside Compose on the same Docker network (most reliable).

**Mandatory after pulling this stack:** wipe volumes and recreate so **db-proxy** owns host `:15432`:

```bat
cd /d C:\Users\arian\the-covenant-wedding-planner
git pull origin cursor/offline-cloud-sync-017e
docker compose down -v
docker compose build --no-cache postgres
docker compose up -d
docker compose ps
scripts\verify-pgbouncer-host.bat
docker compose logs -f api
```

`-v` removes the Postgres data volume — **required** when switching host auth / proxy. Local-dev data is wiped; that is expected for wedding-planner Docker Desktop only.

**`docker compose ps` must show:**

| Container | Host ports |
|-----------|------------|
| `covenant-db-proxy` | `0.0.0.0:15432->5432/tcp` |
| `covenant-sync-api` | `0.0.0.0:18787->8787/tcp` |
| `covenant-postgres` | `5432/tcp` only (**no** host port) |

If you still see `covenant-pgbouncer` on `:5433` or Postgres published on the host, you are on an **old** stack — run `down -v` + `up -d` again after `git pull`.

Host port **18787** avoids Windows Hyper-V/WinNAT excluded ranges that often block `:8787`. The container still listens on **8787** internally.

Wait until api logs show `listening on http://127.0.0.1:8787` (container port), then open from the host:
`http://127.0.0.1:18787/health`

Leave that running. Serve the planner in another terminal with `npm run serve`.

### Why desktop pgAdmin failed / how we fixed it

Two separate Windows traps caused `FATAL: password authentication failed for user "covenant"`:

1. **Docker Desktop SCRAM** — native Windows clients talking SCRAM to a published Postgres port often fail even with the right password. Internal Docker network clients (api, browser pgAdmin) were fine.
2. **Port steal on `:5433`** — a native Windows Postgres (or leftover mapping) can own `127.0.0.1:5433` while Compose still shows a healthy proxy. Desktop pgAdmin then authenticates against the **wrong** server. The old `verify-pgbouncer-host.bat` only ran `docker compose exec postgres psql` and printed `postgres_ok = 1` without ever touching the published port — a false pass.

**Fix (local Docker Desktop only — never ship this to production):**

1. Postgres image bakes `server/pg_hba.conf` (**trust**) and always starts with `hba_file` + `listen_addresses=*`.
2. Host tools connect to **`covenant-db-proxy`** (socat TCP forward) on **`127.0.0.1:15432`** → Postgres on the Docker network. No SCRAM on the host path; trust ignores the password.
3. Port **15432** avoids the common Windows Postgres bind on `5432`/`5433`.
4. Verify scripts require a **wrong password to succeed** on the published port (proves trust) and optionally run a host Node `pg` driver check.

### Browse guests / vendors / payments / budget / seating / contracts / timeline / packets / rentals — desktop pgAdmin → `127.0.0.1:15432` (db-proxy)

In desktop pgAdmin → **Register → Server** → **Connection**:

| Field | Value |
|-------|--------|
| Host name/address | `127.0.0.1` (use this, not `localhost`) |
| Port | `15432` (**not** 5433) |
| Maintenance database | `covenant` |
| Username | `covenant` |
| Password | `covenant` (any value works — backend is trust) |

On the **SSL** tab: **Disable** (simplest for local Docker Desktop).

Save, then expand **Servers → … → Databases → covenant → Schemas → public → Tables → guests** (or **vendors** / **payments** / **budget_categories** / **seating_tables** / **contracts** / **timeline_events** / **packets** / **rentals**).

Confirm the proxy is up:

```bat
docker compose ps
scripts\verify-pgbouncer-host.bat
docker compose logs db-proxy postgres --tail 30
```

You should see `covenant-db-proxy` on host `:15432` and both `published_port_ok` / `trust_ok`. If desktop still fails after a volume wipe + recreate, use browser pgAdmin below (same data).

### Browse guests / vendors / payments / budget / seating / contracts / timeline / packets / rentals — browser pgAdmin (Docker network)

Compose also starts **pgAdmin** on the same Docker network as Postgres. Open:

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

Expand **Servers → Covenant Postgres → Databases → covenant → Schemas → public → Tables → guests** (or **vendors** / **payments** / **budget_categories** / **seating_tables** / **contracts** / **timeline_events** / **packets** / **rentals**).

### Quick start (Docker Postgres + db-proxy only, API on host)

Host tools use **db-proxy** on port **15432**. Prefer the full Compose stack (`api` + browser pgAdmin) when possible.

```bash
# from repo root
docker compose down -v
docker compose build postgres
docker compose up -d postgres db-proxy
cp server/.env.example server/.env   # Windows CMD: copy /Y server\.env.example server\.env
npm install --prefix server
npm run server
# → http://127.0.0.1:8787/health
```

`DATABASE_URL` for host Node must use port **15432** (db-proxy):
`postgres://covenant:covenant@127.0.0.1:15432/covenant`

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
| GET | `/weddings/:id/vendors` | List vendors |
| PUT | `/weddings/:id/vendors/:vendorId` | Upsert one (LWW) |
| POST | `/weddings/:id/vendors/bulk` | Upsert many |
| DELETE | `/weddings/:id/vendors/:vendorId` | Delete |
| GET | `/weddings/:id/payments` | List payments |
| PUT | `/weddings/:id/payments/:paymentId` | Upsert one (LWW) |
| POST | `/weddings/:id/payments/bulk` | Upsert many |
| DELETE | `/weddings/:id/payments/:paymentId` | Delete |
| GET | `/weddings/:id/budget` | List budget categories |
| PUT | `/weddings/:id/budget/:categoryId` | Upsert one (LWW) |
| POST | `/weddings/:id/budget/bulk` | Upsert many |
| DELETE | `/weddings/:id/budget/:categoryId` | Delete |
| GET | `/weddings/:id/seating` | List seating tables (+ floor fixtures) |
| PUT | `/weddings/:id/seating/:tableId` | Upsert one (LWW) |
| POST | `/weddings/:id/seating/bulk` | Upsert many (+ optional floorFixtures) |
| DELETE | `/weddings/:id/seating/:tableId` | Delete |
| GET | `/weddings/:id/contracts` | List contracts |
| PUT | `/weddings/:id/contracts/:contractId` | Upsert one (LWW) |
| POST | `/weddings/:id/contracts/bulk` | Upsert many |
| DELETE | `/weddings/:id/contracts/:contractId` | Delete |
| GET | `/weddings/:id/timeline` | List wedding-day timeline events |
| PUT | `/weddings/:id/timeline/:eventId` | Upsert one (LWW) |
| POST | `/weddings/:id/timeline/bulk` | Upsert many |
| DELETE | `/weddings/:id/timeline/:eventId` | Delete |
| GET | `/weddings/:id/packets` | List share packets |
| PUT | `/weddings/:id/packets/:packetId` | Upsert one (LWW) |
| POST | `/weddings/:id/packets/bulk` | Upsert many |
| DELETE | `/weddings/:id/packets/:packetId` | Delete |
| GET | `/weddings/:id/rentals` | List rentals |
| PUT | `/weddings/:id/rentals/:rentalId` | Upsert one (LWW) |
| POST | `/weddings/:id/rentals/bulk` | Upsert many |
| DELETE | `/weddings/:id/rentals/:rentalId` | Delete |

Auth header: `Authorization: Bearer <token>`.

## Enable the client bridge

Serve the static planner (`npm run serve` → `:8000`), then:

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

(Compose host port is **18787**. If you already set `covenant_cloud_api` to `:8787`, change it to `:18787`. Host-only `npm run server` still uses `:8787` — set the URL to match how you run the API.)

Open **Settings → Cloud sync (beta)** to sign in, upload this wedding, and sync guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals.

## Second-device sync (manual + automated)

Guests, vendors, payments, budget, seating, contracts, timeline events, packets, and rentals uploaded on one browser profile must appear on another after the same account signs in and syncs.

**Automated** (two Playwright storage contexts). Windows CMD from repo root:

```bat
npm install
npx playwright install chromium
docker compose up -d
npm run verify:second-device
npm run verify:vendor-sync
npm run verify:payment-sync
npm run verify:budget-sync
npm run verify:seating-sync
npm run verify:contract-sync
npm run verify:timeline-sync
npm run verify:packet-sync
npm run verify:rental-sync
```

Keep `docker compose up -d` running so the API stays on host `:18787`. If you see `Cannot find package 'playwright'`, run `npm install` at the **repo root** (not only under `server/`).

**Manual:** open a second Chrome profile or Incognito, set the same `covenant_cloud_api` / `covenant_cloud_enabled` flags, sign in as `demo@covenant.local` / `covenant-demo`, then **Sync now**. Full steps: `docs/OFFLINE_CLOUD_SYNC.md` → *Manual test: second device*.

On a fresh device the client **links the account’s newest wedding** (GET `/weddings`) before creating a new one — different devices use different `clientKey`s, so a blind POST would otherwise spawn an empty duplicate.

## Verify guests / vendors / payments / budget / seating / contracts / timeline / packets / rentals landed in Postgres (Windows)

After status shows **Synced · … · wedding linked**, browse tables in **desktop pgAdmin** (`127.0.0.1:15432` → db-proxy), **browser pgAdmin** at http://localhost:5050, or use `docker exec` as a fallback that never depends on the published port:

```bat
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, household, rsvp, updated_at FROM guests ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, category, status, quote, updated_at FROM vendors ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, vendor, descr, due_amount, paid_amount, status, updated_at FROM payments ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, target_pct, planned, updated_at FROM budget_categories ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, capacity, shape, table_type, updated_at FROM seating_tables ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, vendor, doc_type, amount, total, deposit, status, updated_at FROM contracts ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, start_time, event, location, responsible, duration, status, updated_at FROM timeline_events ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, name, recipient, recipient_type, mode, opens, status, expires, updated_at FROM packets ORDER BY updated_at DESC LIMIT 50;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, wedding_id, item, vendor, pickup_date, return_date, cost, details, updated_at FROM rentals ORDER BY updated_at DESC LIMIT 50;"
```

Count + wedding ids:

```bat
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS guests FROM guests GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS vendors FROM vendors GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS payments FROM payments GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS budget_cats FROM budget_categories GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS seating_tables FROM seating_tables GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS contracts FROM contracts GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS timeline_events FROM timeline_events GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS packets FROM packets GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT wedding_id, COUNT(*) AS rentals FROM rentals GROUP BY wedding_id;"
docker exec -it covenant-postgres psql -U covenant -d covenant -c "SELECT id, name, bride, groom FROM weddings;"
```

Optional API check (PowerShell) — token is in browser `localStorage.covenant_cloud_token`:

```powershell
$token = "PASTE_TOKEN_HERE"
$wid = "PASTE_WEDDING_UUID_HERE"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/guests"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/vendors"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/payments"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/budget"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/seating"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/contracts"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/timeline"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/packets"
curl.exe -s -H "Authorization: Bearer $token" "http://127.0.0.1:18787/weddings/$wid/rentals"
```

## Cloud host next steps (not in this pass)

1. Provision managed Postgres (Neon, RDS, Cloud SQL, …) and set `DATABASE_URL`.
2. Deploy this `server/` as a small Node service (Fly, Render, Railway, Cloud Run).
3. Put TLS in front; set `CORS_ORIGIN` to the real static origin (or Pages/CDN URL).
4. Turn off `BOOTSTRAP_*` in production; keep registration or add invite-only.
5. Wire magic-link SMTP when ready (`MAGIC_LINK_*` placeholders in `.env.example`).
6. Expand sync beyond guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals (party, vendor arrivals, catering rentals, print packet field overrides, planning tasks, …) per `docs/OFFLINE_CLOUD_SYNC.md`.

## Conflict policy

Last-write-wins using guest/vendor/payment/budget/seating/contract/timeline/packet/rental `updated_at`. Server only overwrites when the incoming timestamp is ≥ stored. Client prefers local-newer rows and ACK timestamps from the API. See the architecture doc for details.
