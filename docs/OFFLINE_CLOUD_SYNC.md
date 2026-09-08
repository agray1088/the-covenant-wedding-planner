# Offline-first + optional cloud sync

The Covenant Wedding Planner stays **offline-first**. Core planning never requires a network. Cloud sync is an **optional beta** layer for multi-device and a future vendor portal.

## Product model

| Mode | Behavior |
|------|----------|
| **Offline (default / GA)** | localStorage JSON + SQLite/IndexedDB on this device. Backups are `.sqlite` files. No account required. |
| **Cloud (optional)** | Sign-in links this device’s wedding to Postgres. **Guests + vendors** sync in beta. Second-device pull uses the same account membership. Hosted vendor portal comes later. |

**Hard rule:** never block save, navigate, or guest/vendor edits on being online. If the API is down or cloud is disabled, the planner behaves exactly like offline GA.

## Architecture

```
┌─────────────────────────────────────────────┐
│ Browser (planner)                           │
│  data (in-memory) ──save()──► localStorage  │
│         │                    SQLite / IDB   │
│         └── optional ──► cloud-sync.js      │
│                            (feature-flagged)│
└──────────────────────┬──────────────────────┘
                       │ HTTPS (when enabled)
                       ▼
┌─────────────────────────────────────────────┐
│ API (Node)  /health  /auth/*  /weddings/*   │
│              /weddings/:id/guests           │
│              /weddings/:id/vendors          │
└──────────────────────┬──────────────────────┘
                       ▼
                 Postgres
         users · sessions · memberships
         weddings · guests · vendors
```

### Client responsibilities

- Always persist locally first (`save()` → LS + SQLite write-through).
- When cloud is **enabled + authenticated**, debounce a guests+vendors push/pull after saves.
- Surface honest status: `offline` | `signed out` | `syncing` | `synced` | `error` (labeled **Cloud sync (beta)**).
- Feature flag: cloud UI and network calls stay off until config is present (`window.COVENANT_CLOUD` or `localStorage` keys — see client bridge).

### Server responsibilities (v1)

- Authenticate couple/planner users (email + password; magic-link reserved).
- Own wedding rows and memberships (owner / partner / planner roles).
- Accept guest + vendor CRUD for a wedding the caller belongs to.
- Return `updated_at` so the client can ACK and apply conflict policy.

## Conflict policy (v1)

**Last-write-wins with local-newer preference and server ACK.**

1. Each guest, vendor, and wedding carries `updated_at` (ISO-8601).
2. **Push:** client sends rows whose local `updated_at` is newer than the last server ACK (or missing on server). Server upserts and returns the stored row + `updated_at`.
3. **Pull:** client fetches guests and vendors; if server `updated_at` is newer than local, replace local row; otherwise keep local and schedule a push.
4. **Upload this wedding:** one-shot migration — create (or claim) a cloud wedding, push **all** local guests and vendors, store `cloudWeddingId` on the device profile. Does not delete local data.
5. **Second device:** after sign-in, if this browser has no `covenant_cloud_wedding_id`, **Sync now** lists the account’s weddings and links the newest membership before pulling. It only creates a new cloud wedding when the account has none (avoids empty duplicates from per-device `clientKey`s).
6. No merge-by-field in v1. No live multi-user cursors. Do not claim “fully synced multi-user” in the UI.

Later revisions may add field-level merge and presence; until then the UI must stay honest.

## Auth roles

| Role | Access |
|------|--------|
| `owner` | Full wedding + guest/vendor CRUD; invite members |
| `partner` | Full guest/vendor CRUD (same wedding) |
| `planner` | Full guest/vendor CRUD (coordinator) |
| `vendor` (future) | Packet-scoped reads only — not in this pass |

Sessions are opaque bearer tokens in `sessions`. Passwords are bcrypt-hashed. Env vars are documented in `server/.env.example`.

## Migration: “Upload this wedding”

1. User enables cloud config and signs in.
2. **Upload this wedding** creates a Postgres `weddings` row (names/date from `data.setup`) and an `owner` membership.
3. All local `data.guests` and `data.vendors` upsert into `guests` / `vendors`.
4. Device stores `covenant_cloud_wedding_id` (+ session token) in localStorage.
5. Offline editing continues; next **Sync now** (or debounced auto-sync) reconciles both verticals.

If the device already has a linked wedding id, Upload reuses it (upsert) rather than spawning duplicates unless the user explicitly creates a new cloud wedding later.

## Synced vendor fields

Trimmed from planner `schema.sql` / `data.vendors`:

`id` (`_id`), `cat`/`category`, `name`, `contact`, `phone`, `email`, `quote`, `deposit`, `balance`, `status`, `rating`, `contract`/`has_contract`, `pros`, `cons`, `review`, `notes`, `updatedAt`.

Category-schema `attrs` stay on-device for now (not in the Postgres `vendors` table).

## Feature flag / GA safety

- Default: cloud **disabled**. Offline GA verify scripts and persist suite must keep passing with no server.
- Enabling requires an API base URL (`COVENANT_CLOUD.apiBase` or `localStorage.covenant_cloud_api`).
- With flag off, Settings shows a short “Cloud sync (beta) — not configured” note only; no fake signed-in state.

## Local run (summary)

See `server/README.md`. Typical path:

```bash
docker compose down -v
docker compose build postgres
docker compose up -d          # postgres + db-proxy :15432 + api + browser pgAdmin :5050
docker compose ps             # db-proxy must own :15432; postgres must NOT be published
scripts/verify-pgbouncer-host.sh   # Windows: scripts\verify-pgbouncer-host.bat
cp server/.env.example server/.env
npm install --prefix server
# Prefer API via Compose; host Node uses 127.0.0.1:15432 (db-proxy)
npm run serve                 # static planner on :8000
```


Then in the browser console (or a small local config):

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:8787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

## Manual test: second device (guests + vendors)

Prove a guest **or** vendor added on device A appears on device B after sign-in + sync.

### Automated (preferred)

**Prereqs:** Docker stack up (sync API on `:8787`), root `npm install`, and Playwright Chromium.

Windows CMD (repo root):

```bat
npm install
npx playwright install chromium
docker compose up -d
npm run verify:second-device
npm run verify:vendor-sync
```

(`playwright` is a root `devDependency`. Skip `npx playwright install chromium` on later runs if Chromium is already installed.)

Unix / Git Bash:

```bash
npm install
npx playwright install chromium
docker compose up -d
npm run verify:second-device
npm run verify:vendor-sync
# or: node scripts/_verify-vendor-sync.mjs
```

Guest verify uses two isolated Playwright storage contexts, demo login `demo@covenant.local` / `covenant-demo`, and asserts the unique guest pulled onto device B. Vendor verify does the same for a unique vendor name.

If you see `Cannot find package 'playwright'`, you skipped root `npm install` — run the Windows block above from the repo root (not only `server/`).

### Manual (Chrome)

1. Start stack: `docker compose up -d` and `npm run serve` (planner `:8000`, API `:8787`).
2. **Device A** — normal Chrome window:
   - DevTools console:
     ```js
     localStorage.setItem('covenant_cloud_api', 'http://localhost:8787');
     localStorage.setItem('covenant_cloud_enabled', '1');
     location.reload();
     ```
   - **Settings → Cloud sync (beta)** → sign in `demo@covenant.local` / `covenant-demo`.
   - **Upload this wedding**, then add a uniquely named guest and/or vendor, then **Sync now**.
3. **Device B** — second Chrome profile **or** an Incognito window (separate storage):
   - Same API flags as above, reload, same demo sign-in.
   - Do **not** expect a wedding id yet — click **Sync now** (or **Upload this wedding**).
   - The client links the account’s existing cloud wedding, pulls guests + vendors, and the unique name from device A should appear.
4. Optional DB check: see `server/README.md` (pgAdmin / `docker exec` … `SELECT … FROM guests` / `vendors`).

**Pull this branch:** `git pull origin cursor/offline-cloud-sync-017e`

## Out of scope for this foundation pass

- Full table sync (budget, timeline, packets, …)
- Vendor `attrs` / category-schema extras in Postgres
- Real magic-link email delivery
- Hosted vendor portal / `covenant.link` packets
- Production deploy (document next steps only)
- Claiming multi-user realtime collaboration
