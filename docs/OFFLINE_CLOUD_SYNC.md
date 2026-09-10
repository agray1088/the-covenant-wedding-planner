# Offline-first + optional cloud sync

The Covenant Wedding Planner stays **offline-first**. Core planning never requires a network. Cloud sync is an **optional beta** layer for multi-device and a future vendor portal.

## Product model

| Mode | Behavior |
|------|----------|
| **Offline (default / GA)** | localStorage JSON + SQLite/IndexedDB on this device. Backups are `.sqlite` files. No account required. |
| **Cloud (optional)** | Sign-in links this device’s wedding to Postgres. **Guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals** sync in beta. Second-device pull uses the same account membership. Hosted vendor portal comes later. |

**Hard rule:** never block save, navigate, or guest/vendor/payment/budget/seating/contract/timeline/packet/rental/party edits on being online. If the API is down or cloud is disabled, the planner behaves exactly like offline GA.

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
│              /weddings/:id/payments         │
│              /weddings/:id/budget           │
│              /weddings/:id/seating          │
│              /weddings/:id/contracts        │
│              /weddings/:id/timeline         │
│              /weddings/:id/packets          │
│              /weddings/:id/rentals          │
│              /weddings/:id/party            │
└──────────────────────┬──────────────────────┘
                       ▼
                 Postgres
         users · sessions · memberships
         weddings · guests · vendors · payments
         budget_categories · seating_tables · contracts
         timeline_events · packets · rentals · party_members
```

### Client responsibilities

- Always persist locally first (`save()` → LS + SQLite write-through).
- When cloud is **enabled + authenticated**, debounce a guests+vendors+payments+budget+seating+contracts+timeline+packets+rentals push/pull after saves.
- Surface honest status: `offline` | `signed out` | `syncing` | `synced` | `error` (labeled **Cloud sync (beta)**).
- Feature flag: cloud UI and network calls stay off until config is present (`window.COVENANT_CLOUD` or `localStorage` keys — see client bridge).

### Server responsibilities (v1)

- Authenticate couple/planner users (email + password; magic-link reserved).
- Own wedding rows and memberships (owner / partner / planner roles).
- Accept guest + vendor + payment + budget + seating + contract + timeline + packet + rental + party CRUD for a wedding the caller belongs to.
- Return `updated_at` so the client can ACK and apply conflict policy.

## Conflict policy (v1)

**Last-write-wins with local-newer preference and server ACK.**

1. Each guest, vendor, payment, budget category, seating table, contract, timeline event, packet, rental, party member, and wedding carries `updated_at` (ISO-8601).
2. **Push:** client sends rows whose local `updated_at` is newer than the last server ACK (or missing on server). Server upserts and returns the stored row + `updated_at`.
3. **Pull:** client fetches guests, vendors, payments, budget, seating, contracts, timeline, packets, rentals, and party; if server `updated_at` is newer than local, replace local row; otherwise keep local and schedule a push.
4. **Upload this wedding:** one-shot migration — create (or claim) a cloud wedding, push **all** local guests, vendors, payments, budget categories, seating tables, contracts, timeline events, packets, rentals, and party, store `cloudWeddingId` on the device profile. Does not delete local data.
5. **Second device:** after sign-in, if this browser has no `covenant_cloud_wedding_id`, **Sync now** lists the account’s weddings and links the newest membership before pulling. It only creates a new cloud wedding when the account has none (avoids empty duplicates from per-device `clientKey`s).
6. No merge-by-field in v1. No live multi-user cursors. Do not claim “fully synced multi-user” in the UI.

Later revisions may add field-level merge and presence; until then the UI must stay honest.

## Auth roles

| Role | Access |
|------|--------|
| `owner` | Full wedding + guest/vendor/payment/budget/seating/contract/timeline/packet/rental/party CRUD; invite members |
| `partner` | Full guest/vendor/payment/budget/seating/contract/timeline/packet/rental/party CRUD (same wedding) |
| `planner` | Full guest/vendor/payment/budget/seating/contract/timeline/packet/rental/party CRUD (coordinator) |
| `vendor` (future) | Packet-scoped reads only — not in this pass |

Sessions are opaque bearer tokens in `sessions`. Passwords are bcrypt-hashed. Env vars are documented in `server/.env.example`.

## Migration: “Upload this wedding”

1. User enables cloud config and signs in.
2. **Upload this wedding** creates a Postgres `weddings` row (names/date from `data.setup`) and an `owner` membership.
3. All local `data.guests`, `data.vendors`, `data.payments`, `data.budget`, `data.tables`, `data.contracts`, `data.timeline`, `data.packets`, `data.rentals`, and `data.party` upsert into `guests` / `vendors` / `payments` / `budget_categories` / `seating_tables` / `contracts` / `timeline_events` / `packets` / `rentals` / `party_members` (plus floor fixtures on the wedding).
4. Device stores `covenant_cloud_wedding_id` (+ session token) in localStorage.
5. Offline editing continues; next **Sync now** (or debounced auto-sync) reconciles all synced verticals.

If the device already has a linked wedding id, Upload reuses it (upsert) rather than spawning duplicates unless the user explicitly creates a new cloud wedding later.

## Synced vendor fields

Trimmed from planner `schema.sql` / `data.vendors`:

`id` (`_id`), `cat`/`category`, `name`, `contact`, `phone`, `email`, `quote`, `deposit`, `balance`, `status`, `rating`, `contract`/`has_contract`, `pros`, `cons`, `review`, `notes`, `updatedAt`.

Category-schema `attrs` stay on-device for now (not in the Postgres `vendors` table).

## Synced payment fields

Trimmed from planner `schema.sql` / `data.payments`:

`id` (`_id`), `vendor`, `vendorId`, `budgetCat`, `budgetCategoryId`, `desc`, `due`, `paid`, `gratuity`, `gratuityStatus`, `budgetItem`, `budgetItemId`, `contractIdx`, `contractId`, `date`, `paiddate`, `ptype`, `status`, `notes`, nested `installments` (JSON), `updatedAt`.

Installments sync as a nested JSON array on the payment row (same pattern as guest companions). Budget category / contract / vendor **rows** themselves are not required to exist in cloud tables — link ids and names travel with the payment.

## Synced budget fields

Trimmed from planner `schema.sql` / `data.budget` (categories + nested line items):

`id` (`_id`), `cat`/`name`, `target`/`target_pct`, `planned`, `tip`, nested `items` (JSON), `updatedAt`.

Each nested item carries the planner line-item shape (`name`, `budgeted`, `actual`, `cost`, `status`, `paid`, `due`, `notes`, plus optional link ids like `paymentId` / `vendorId`). Items sync as nested JSON on the category row (same LWW pattern as payment installments) — there is no separate cloud `budget_items` table in this pass.

## Synced seating fields

Trimmed from planner `data.tables` (+ floor plan):

`id` (`_id`), `name`, `capacity`, `placement`, `type`, `shape`, `vip`, `facing`, `label`, `group`, `notes`, floor layout (`x`, `y`, `w`, `h`, `vert`, `preset` in `layout_json`), `updatedAt`.

Guest→table assignments continue to travel on **guests** (`table` / `table_name`) — not duplicated on seating rows. Wedding-scoped floor fixtures (`data.floorFixtures`: DJ / cake / dance) sync as JSON on the wedding (`floor_fixtures_json`) with LWW via `floorFixturesUpdatedAt`.

## Synced contract fields

Trimmed from planner `schema.sql` / `data.contracts`:

`id` (`_id`), `name`, `vendor`, `vendorId`, `type`/`doc_type`, `date`/`doc_date`, `amount`, `total`, `deposit`, `status`, `where`/`location`, `notes`, nested file metadata (`contractFile` / `invoiceFile` name+type; large base64 `img` payloads are stripped), `updatedAt`.

Vendor **rows** themselves are not required to exist in cloud tables — link ids and names travel with the contract. Large attachment binaries stay on-device; only metadata (and small non-data-URL snapshots) sync in this pass.

## Synced timeline fields

Trimmed from planner `schema.sql` / `data.timeline` (Wedding Day Timeline):

`id` (`_id`), `time`/`start_time`, `event`, `location`, `responsible`/`person`, `duration`, `notes`, `date`/`event_date`, `endTime`/`end_time`, `allDay`/`all_day`, `status`, nested calendar extras in `meta_json` (`description`, color/icon/reminder when present), `updatedAt`.

This is the minute-by-minute day-of schedule shown on Wedding Day Timeline / Dashboard. Vendor arrival rows (`data.vtimeline`), weekend logistics, entertainment playlists, and planning tasks stay on-device in this pass.

## Synced packet fields

Trimmed from planner `data.packets[]` (Share Packets — vendor / party / info handoff rows):

`id` (`_id`), `name`, `recipient`, `recipientType`/`type`, `contains`, `mode`, `opens`, `expires`, `status`, `created`, `sent`, `lastOpen`, `contact`, `link`, `passcode`, `hides`, `revoked`, nested `sections` (JSON), nested extras in `meta_json` (`activity`, `withheld`, `previewCards`, card labels, …), `updatedAt`.

This is the Share Packets list used for day-of / vendor / family info packets. Print field overrides (`data.vendorPackets`, `data.partyPackets`, `data.coordPacket`) and hosted `covenant.link` portal delivery stay on-device in this pass.

## Synced rental fields

Trimmed from planner `schema.sql` / `data.rentals[]` (Contracts & Rentals — finances rental tracker):

`id` (`_id`), `item`, `vendor`, `vendorId`/`vendor_id`, `pickup`/`pickup_date`, `ret`/`return_date`, `cost`, `details`, optional extras in `meta_json`, `updatedAt`.

This is the rentals list on Contracts, Invoices & Rentals / Finances Hub. Catering rentals (`data.cateringRentals`) stay on-device in this pass.

## Synced party fields

Trimmed from planner `schema.sql` / `data.party[]` (Wedding Party tracker):

`id` (`_id`), `name`, `role`, `phone`, `email`, `attire`, `size`, `status`, `notes`, `guestId`/`guest_id` (opaque), optional extras in `meta_json` (`side`, `attireStatus`, duties, fitting, …), `updatedAt`.

This is the wedding / bridal party list on Wedding Party / People Hub. Party duties board extras beyond meta and print field overrides (`data.partyPackets`) stay on-device in this pass.

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

**Schema recreate note:** after pulling party sync (or any new cloud table), run `docker compose down -v` then `up -d` so Postgres applies the new `party_members` table (and prior rentals/packets/timeline/contracts/seating/budget columns). Volume wipe is expected for local Docker Desktop.

Then in the browser console (or a small local config):

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

(Compose publishes the sync API on **host** `:18787` → container `:8787`. If you previously set `covenant_cloud_api` to `:8787`, update it to `:18787`.)

## Manual test: second device (guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + party)

Prove a guest, vendor, payment, budget category, seating table, **or** contract added on device A appears on device B after sign-in + sync.

### Automated (preferred)

**Prereqs:** Docker stack up (sync API on host `:18787`), root `npm install`, and Playwright Chromium.

Windows CMD (repo root):

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

(`playwright` is a root `devDependency`. Skip `npx playwright install chromium` on later runs if Chromium is already installed.)

Unix / Git Bash:

```bash
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
# or: node scripts/_verify-rental-sync.mjs
```

Guest verify uses two isolated Playwright storage contexts, demo login `demo@covenant.local` / `covenant-demo`, and asserts the unique guest pulled onto device B. Vendor / payment / budget / seating / contract / timeline / packet / rental verifies do the same for a unique vendor name, payment description, budget category name, table name, contract name, timeline event title, packet name, or rental item.

If you see `Cannot find package 'playwright'`, you skipped root `npm install` — run the Windows block above from the repo root (not only `server/`).

### Manual (Chrome)

1. Start stack: `docker compose up -d` and `npm run serve` (planner `:8000`, API host `:18787`).
2. **Device A** — normal Chrome window:
   - DevTools console:
     ```js
     localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');
     localStorage.setItem('covenant_cloud_enabled', '1');
     location.reload();
     ```
   - **Settings → Cloud sync (beta)** → sign in `demo@covenant.local` / `covenant-demo`.
   - **Upload this wedding**, then add a uniquely named guest, vendor, payment, budget category, seating table, contract, timeline event, share packet, and/or rental, then **Sync now**.
3. **Device B** — second Chrome profile **or** an Incognito window (separate storage):
   - Same API flags as above, reload, same demo sign-in.
   - Do **not** expect a wedding id yet — click **Sync now** (or **Upload this wedding**).
   - The client links the account’s existing cloud wedding, pulls guests + vendors + payments + budget + seating + contracts + timeline + packets + rentals + party, and the unique name from device A should appear.
4. Optional DB check: see `server/README.md` (pgAdmin / `docker exec` … `SELECT … FROM guests` / `vendors` / `payments` / `budget_categories` / `seating_tables` / `contracts` / `timeline_events` / `packets` / `rentals` / `party_members`).

**Pull this branch:** `git pull origin cursor/offline-cloud-sync-017e`

## Out of scope for this foundation pass

- Full table sync (vendor arrivals / vtimeline, catering rentals, print packet field overrides, planning tasks, …)
- Separate cloud `budget_items` table (items remain nested JSON on categories)
- Guest seat numbers beyond whatever travels on guest rows (seat / seatNo fields are still local-only unless guests vertical is extended)
- Vendor `attrs` / category-schema extras in Postgres
- Real magic-link email delivery
- Hosted vendor portal / `covenant.link` packets
- Production deploy (document next steps only)
- Claiming multi-user realtime collaboration
