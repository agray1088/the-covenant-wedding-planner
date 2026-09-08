# Offline-first + optional cloud sync

The Covenant Wedding Planner stays **offline-first**. Core planning never requires a network. Cloud sync is an **optional beta** layer for multi-device and a future vendor portal.

## Product model

| Mode | Behavior |
|------|----------|
| **Offline (default / GA)** | localStorage JSON + SQLite/IndexedDB on this device. Backups are `.sqlite` files. No account required. |
| **Cloud (optional)** | Sign-in links this device’s wedding to Postgres. Guests are the first synced vertical. Multi-device and vendor portal come later. |

**Hard rule:** never block save, navigate, or guest edits on being online. If the API is down or cloud is disabled, the planner behaves exactly like offline GA.

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
└──────────────────────┬──────────────────────┘
                       ▼
                 Postgres
         users · sessions · memberships
         weddings · guests
```

### Client responsibilities

- Always persist locally first (`save()` → LS + SQLite write-through).
- When cloud is **enabled + authenticated**, debounce a guest push/pull after saves.
- Surface honest status: `offline` | `signed out` | `syncing` | `synced` | `error` (labeled **Cloud sync (beta)**).
- Feature flag: cloud UI and network calls stay off until config is present (`window.COVENANT_CLOUD` or `localStorage` keys — see client bridge).

### Server responsibilities (v1)

- Authenticate couple/planner users (email + password; magic-link reserved).
- Own wedding rows and memberships (owner / partner / planner roles).
- Accept guest CRUD for a wedding the caller belongs to.
- Return `updated_at` so the client can ACK and apply conflict policy.

## Conflict policy (v1)

**Last-write-wins with local-newer preference and server ACK.**

1. Each guest and wedding carries `updated_at` (ISO-8601).
2. **Push:** client sends guests whose local `updated_at` is newer than the last server ACK (or missing on server). Server upserts and returns the stored row + `updated_at`.
3. **Pull:** client fetches guests; if server `updated_at` is newer than local, replace local row; otherwise keep local and schedule a push.
4. **Upload this wedding:** one-shot migration — create (or claim) a cloud wedding, push **all** local guests, store `cloudWeddingId` on the device profile. Does not delete local data.
5. No merge-by-field in v1. No live multi-user cursors. Do not claim “fully synced multi-user” in the UI.

Later revisions may add field-level merge and presence; until then the UI must stay honest.

## Auth roles

| Role | Access |
|------|--------|
| `owner` | Full wedding + guest CRUD; invite members |
| `partner` | Full guest CRUD (same wedding) |
| `planner` | Full guest CRUD (coordinator) |
| `vendor` (future) | Packet-scoped reads only — not in this pass |

Sessions are opaque bearer tokens in `sessions`. Passwords are bcrypt-hashed. Env vars are documented in `server/.env.example`.

## Migration: “Upload this wedding”

1. User enables cloud config and signs in.
2. **Upload this wedding** creates a Postgres `weddings` row (names/date from `data.setup`) and an `owner` membership.
3. All local `data.guests` upsert into `guests`.
4. Device stores `covenant_cloud_wedding_id` (+ session token) in localStorage.
5. Offline editing continues; next **Sync now** (or debounced auto-sync) reconciles guests.

If the device already has a linked wedding id, Upload reuses it (upsert) rather than spawning duplicates unless the user explicitly creates a new cloud wedding later.

## Feature flag / GA safety

- Default: cloud **disabled**. Offline GA verify scripts and persist suite must keep passing with no server.
- Enabling requires an API base URL (`COVENANT_CLOUD.apiBase` or `localStorage.covenant_cloud_api`).
- With flag off, Settings shows a short “Cloud sync (beta) — not configured” note only; no fake signed-in state.

## Local run (summary)

See `server/README.md`. Typical path:

```bash
docker compose down -v
docker compose build postgres
docker compose up -d          # postgres + pgbouncer :5433 + api + browser pgAdmin :5050
docker compose ps             # pgbouncer must own :5433; postgres must NOT
bash scripts/verify-pgbouncer-host.sh
cp server/.env.example server/.env
npm install --prefix server
# Prefer API via Compose; host Node uses 127.0.0.1:5433 (pgbouncer)
npm run serve                 # static planner on :8000
```


Then in the browser console (or a small local config):

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:8787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

## Out of scope for this foundation pass

- Full table sync (budget, vendors, timeline, …)
- Real magic-link email delivery
- Hosted vendor portal / `covenant.link` packets
- Production deploy (document next steps only)
- Claiming multi-user realtime collaboration
