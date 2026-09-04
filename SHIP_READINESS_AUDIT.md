# The Covenant Wedding Planner — Product Ship-Readiness Audit

**Branch audited:** `cursor/dashboard-views-017e`  
**Method:** Cleared `localStorage` + IndexedDB; fresh load **without** `applySampleData` / sample wedding; Playwright walk of all major panels + core actions + reload persistence; codebase review of persistence (`localStorage` + SQLite WASM/IndexedDB) and `schema.sql`.  
**Date:** 2026-09-04

---

## 1. Executive ship-readiness verdict

**Not ready to ship as a completed, fully functioning multi-device/multi-user product.**

The UI surface area is large and mostly navigable. Empty-state **guest** UX is strong. Many Add CTAs open real drawers/modals. Local save + `.sqlite` backup/restore plumbing exists.

It is **not** shippable as a finished product because:

1. **Fresh installs are not empty** — redesign modules auto-inject demo/mock wedding data (party, gifts, tables, packets with fake “LIVE” opens, appointments with fictional vendors, notes, prayer, counseling, essentials, entertainment, emails, homecoming).
2. **Data-loss race (P0)** — SQLite is treated as authoritative on boot, but IndexedDB persist is debounced (~400ms). A reload before flush lets hydrate overwrite newer `localStorage` edits (reproduced: guest saved to LS + in-memory SQL, lost after reload unless IDB flushed).
3. **No accounts, auth, server sync, or real sharing** — single-browser offline app. Vendor Portal is a same-origin demo/localStorage reader with fabricated counts, not a secured multi-user portal.
4. **Developer / mock fidelity residue** — title “Developer Editable Version”, `developer-mode` on, dual truth (JSON mirror vs SQLite) still in flux.

**Near-ready as:** a polished **single-device offline planner** *if* demo seeds are gated, the persist race is fixed, and product copy stops claiming live multi-party collaboration.

**Blockers for “completed product” ship:** demo-seed contamination, persistence race, no backend identity/sync, vendor portal not production-real.

---

## 2. Must-fix before ship (P0)

### P0-1 — Stop auto-seeding demo/mock data on empty planners
On a wiped browser (no sample wedding), visiting panels still seeds fictional Ghanaian names/vendors/activity:

| Domain | Mechanism | Examples |
|--------|-----------|----------|
| Party | `ensurePartyDemoSeed()` | Efua Mensah, Yaw Darko, … (10 members + 25 duties) |
| Gifts | `ensureGiftsDemoSeed()` | Mr & Mrs Owusu, Auntie Akua, … |
| Tables | `ensureTablesDemoSeed()` | 15 labeled tables (Mensah family, Grace Hall notes) |
| Packets | `MASTER_PACKETS` | “LIVE 3”, “38 opens”, Grace Hall / Adom Catering links |
| Appointments | `seedDefaults()` | Grace Manor, Harvest & Honey, Belle Amour Bridal |
| Notes / Prayer / Counseling / Essentials / Emails / Entertainment / Homecoming | `MASTER_*` / demo seeds | Full starter catalogs with story content |

**Impact:** Couples cannot trust the app as *their* wedding; empty-state audit is contaminated; backup exports include mock people.

### P0-2 — Fix SQLite boot hydrate vs debounced IndexedDB persist race
- `save()` → in-memory SQLite sync (250ms) → `DBRepo.schedulePersist()` (**400ms debounce** to IndexedDB).
- On boot, if IndexedDB DB exists, `hydrateDataFromSqlite()` is **authoritative** and `save()` mirrors it back to `localStorage`.
- **Reproduced:** guest “Persist Guest” present in LS + memory SQL → reload without IDB flush → guest gone from LS, SQL, and UI. With forced `persistDbToIndexedDB`, guest survives.

**Impact:** Silent data loss on refresh/tab close shortly after edits — unacceptable for a planner.

### P0-3 — Decide and implement a single persistence authority
Comments disagree (`sqlite-init.js`: SQLite SoT; older `planner.js` comments: LS SoT). Boot path currently: paint from LS → async hydrate from SQLite if “meaningful”. Combined with demo seeds calling `save()`, this is fragile.

**Ship requirement:** one authoritative store, flush-before-unload, no overwrite of newer client edits, crash-safe.

### P0-4 — Remove / gate developer and mock product chrome
- Document title: “Developer Editable Version”
- `body.developer-mode` on fresh load
- Wizard still offers “Load sample data instead” (OK if explicit) but demo seeds fire *without* that choice
- Blocking stack on first run: Theme Builder modal + Smart Create modal + backup “Protect your planning” dialog can sit **over** the 3-minute wizard (pointer interception observed)

### P0-5 — Do not ship Vendor Portal as a real multi-vendor product yet
- No login; token/`?g=` is client-side theatre
- Without a real share session it still renders planner/demo vendor brief (headcounts like 142 covers) from localStorage / fallbacks
- Fake packet activity (“opened 2 hours ago in Accra”) is product-lying if presented as live

### P0-6 — Multi-device / multi-user claims need a backend (or must be removed from marketing)
There is **no auth**, no server API, no sync. Profiles = localStorage keys. Sharing = file export / same-browser portal. Shipping “completed product” for couples + planners + vendors on multiple devices **requires** relational server DB + accounts (see §5).

---

## 3. Should improve (P1)

### Functional / UX
- **Guests:** `logAdd('guests', …)` is a no-op for count (UI “+ New guest” drawer works). Wire programmatic add paths consistently.
- **Simple / Essentials mode** hides many pages (`logistics`, `contracts`, `party`, `tables`, `shotlist`, `mood`, `emails`, `packets`, `honeymoon`) — good for calm start, but easy to miss features; needs clearer unlock UX (partially present).
- **Contacts** show derived/demo-ish counts (e.g. “CONTACTS 13 … NO NUMBER 13”) while guests=0 — confusing empty state.
- **Packets / Emails / Print Centre** look “busy” with master catalogs before the couple creates anything — gate behind explicit “use templates”.
- **Calendar** shows seeded appointments immediately — looks like sample data.
- **Full record editor** open-from-audit was flaky when no guest row; ensure every domain’s Full editor + drawer save paths are covered by tests.
- **Backup restore** UI exists (`restorePlannerBackup`, `rdDhRestore`, file input) — needs E2E proof of round-trip after the persist race fix.
- **localStorage size** grows quickly (~1.3–2.3MB in light use with seeds + history) — quota risk on some browsers; prefer SQLite/IDB as sole heavy store.

### Architecture
- Dual write (JSON string in LS + WASM SQLite in IDB) doubles failure modes.
- Relationship model is mostly name+id soft links in a mega `data` object — works offline, weak for concurrent multi-user.
- `schema.sql` (~80 tables) is ahead of production ops (migrations, backups server-side, RLS).

### Product polish debt
- Coach ambient + multiple first-run overlays compete.
- Nav metric warns when fresh profile exposes too many destinations — signal that progressive disclosure still fights demo seeds.

---

## 4. Nice-to-have polish (P2)

- Dark mode toggle works (smoke OK).
- Quick Jump / ⌘K opens with useful actions.
- Database Hub / Print Centre / Vendor panel routes work (`data-hub`, `print-centre`, `vendor`).
- Scripture/banner voice is cohesive brand.
- Empty guests empty-state copy + dual CTAs (“Add your first guest” / “Import”) are excellent — reuse that pattern everywhere demo seeds are removed.
- Table assignment empty hints (“No guests assigned yet”) are clear once demo tables are removed or marked as templates.
- Settings vs Profile & Display split is understandable.
- `.sqlite` backup messaging is prominent (good for offline product).

---

## 5. Relational database: required domains & entities

### Current persistence (as shipped today)
| Layer | Role |
|-------|------|
| `localStorage` (`covenant_planner_v1`) | Fast mirror / crash safety; profiles |
| **SQLite WASM** (`sql.js`) in **IndexedDB** (`covenant_planner_db_v1`) | Intended SoT; `.sqlite` export/import |
| In-memory `data` object | Runtime model (`blankData()` + ~60 array keys) |
| **No server** | No Postgres/MySQL; no auth |

`schema.sql` already sketches a solid wedding-centric relational model (~80 tables). That schema should become the **server** schema (Postgres recommended), not only a client export format.

### Must be server RDBMS for multi-device / multi-user ship

**Identity & tenancy**
- `user`, `account` / org, `membership`, roles (couple, co-planner, viewer, vendor)
- `wedding` (tenant root) — already in schema
- invites, sessions, audit log (server-side)

**Core planning graph (normalize; stop relying on JSON blobs)**
- `guest`, `guest_companion`, `guest_event`, `guest_event_assignment`
- `reception_table` + seating assignments (FK, not free-text table name alone)
- `party_member` + duties
- `vendor`, `contract`, `rental`, `payment`, `payment_installment`
- `budget_category`, `budget_item`
- `task` / `task_subtask`, `plan_item`, `appointment`, `calendar_event`
- `wedding_day_timeline_item`, `vendor_timeline`, weekend logistics tables
- catering: `menu_item`, `beverage`, dietary counts derived from guests
- `gift`, ceremony/prayer/counseling tables
- share: `packet` / access token / activity (real), vendor portal sessions

**What can stay client-local**
- UI prefs (row height, hidden columns, nav collapse, theme preview)
- Undo/redo snapshots, ephemeral drawers
- Device-only drafts before sync
- Optional offline cache of the wedding subset (IndexedDB replica of server rows)

**What must not remain “demo JSON master lists written into wedding data”**
- Template catalogs (email templates, essentials checklist, prayer prompts) → `template_*` tables or CMS, **copied on explicit user action**, not auto-merged as live rows with fake opens/status

### Gaps vs production relational needs
- No `user_id` / ACL on rows; only `wedding_id`
- Soft name matching still used for vendor/guest links — needs strict FKs + migration
- Vendor portal security model is documentation-in-UI, not enforced server authorization
- Sync: need conflict policy (LWW vs field-level), attachment storage (contracts PDFs, mood photos)
- Backups: client `.sqlite` OK for offline SKU; cloud SKU needs server PITR + export

---

## 6. Suggested ship sequence (technical order)

1. **Gate all `*DemoSeed` / `MASTER_*` auto-writes** — empty means empty; templates only on explicit CTA.
2. **Fix persistence race** — flush IDB on `save` completion / `beforeunload` / `visibilitychange`; skip hydrate when LS `updatedAt` newer than DB; or make LS authoritative until sync ACK.
3. **E2E persistence suite** — guests, vendors, payments, seating, packets; kill-tab and reload tests.
4. **Strip developer-mode defaults**; fix first-run modal stacking (wizard on top, one path).
5. **Offline single-device GA** (optional SKU) — marketing aligned with “this device + sqlite backups”.
6. **Stand up Postgres from `schema.sql`** + auth (couple accounts) + sync API for `wedding` subgraph.
7. **Move attachments & vendor portal** to server tokens with expiry/revoke; stop demo fallbacks in production builds.
8. **Multi-planner sharing & viewer roles** using real ACL.
9. **Hardening** — quota, migration versioning, import/export, privacy review, remove mock fidelity seeds from production bundles.

---

## Browser audit evidence (empty / wiped storage)

### First run
- Wizard “Welcome — 3-Minute Setup” with Skip / Continue / **Load sample data instead**
- Competing overlays: backup protect dialog, theme builder, smart-create modal
- After dismiss: Dashboard shows countdown empty, needs-attention, setup checklist

### Panel walk (40 ids)
- Most panels exist and render; Add CTAs generally open modals/drawers (**wired** for guests, vendors, tasks, budget, payments, contracts, party, tables, appointments, gifts, notes, catering, ceremony, prayer, counseling, entertainment, shotlist, essentials, honeymoon, emails, packets, mood, timeline, contacts, households).
- `roles` has no `#panel-roles` (roles live under settings/profile conceptually).
- Hub/print ids are `data-hub` / `print-centre` (not `datahub` / `print`).

### Persistence
- Setup bride/groom, vendors, tasks, budget, payments, appointments, notes, tables: generally persist when IDB caught up.
- **Guests: lost on reload** unless IndexedDB persist forced — P0.

### Vendor portal
- Reachable; renders brief/schedule/paperwork/upload UI; expired state works; not a real secured product.

### Console
- Mostly clean; transient 404s possible depending on asset timing; no pageerrors in main walk.

---

## Artifact index
See `/opt/cursor/artifacts/audit_*.png` and `/opt/cursor/artifacts/ship-audit/` for full panel captures and `audit-report.json` / `audit-followup.json`.
