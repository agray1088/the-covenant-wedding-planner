# Desktop native polish — master implementation plan

Actionable end-to-end plan for Windows Electron desktop UX. Future agents should follow this file **checkbox-first** without re-asking scope.

**Sources merged here**

- [`DESKTOP_APP.md`](./DESKTOP_APP.md) — shell, build, menus, “Desktop native polish” checklist
- [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) — Desktop native polish pointer
- Layout / sections / tables / tabs guidance (advisory; **not implemented** until Phases C–F)

**Branch:** `cursor/desktop-electron-017e`  
**Constraint:** Prefer native menus + compact chrome over webby marketing chrome inside tool screens. Web / PWA / Railway hosting stay unchanged unless a change is gated on `COVENANT_DESKTOP` / `body.covenant-desktop`.

---

## Status legend

| Mark | Meaning |
|------|---------|
| `[x]` | **DONE** on current branch (first pass acceptable unless noted) |
| `[ ]` | **TODO** — implement in the listed phase |
| `(stub)` | UI/menu exists; real behavior not wired |

---

## Inventory (single source of truth)

### A. Shell & chrome already shipped

- [x] Electron Windows shell under `desktop/` (NSIS + portable + zip; x64 + arm64 targets)
- [x] Loopback static server; offline planning without network
- [x] Compact **top toolbar** — Search + Save status + Alerts; Settings gear; brand / wedding chip
- [x] Undo/Redo, Dark Mode, Profile & Display, Database Hub, Quick Jump moved to **native menus** / chip (desktop CSS hide)
- [x] Collapsible **planner footer removed**; scripture banner retained
- [x] Expanded **File / Edit / View / Go / Help** menus with wired actions (export/import, print, preview, API base, nav jumps, etc.)
- [x] Hide **PWA / Install app** install chrome inside Electron; Settings explains desktop shell; SW not registered
- [x] Skip SW **“Update available – Reload”** banner on desktop
- [x] Prefer **File → Set Cloud API Base…**; soften localhost/Railway paste tips when `COVENANT_DESKTOP` is set
- [x] No duplicate in-app **window zoom** chrome in planner toolbar (View menu owns zoom)
- [x] Help → **Enter License…** `(stub)` — message box only
- [x] Help → **Check for Updates…** `(stub)` — “Coming soon”
- [x] Help → **About**; File → **Open Data Folder**
- [x] NSIS shortcuts retarget `$INSTDIR\CovenantWeddingPlanner.exe` (`desktop/build/installer.nsh`)
- [x] Desktop detection: `window.COVENANT_DESKTOP` / `window.covenantDesktop`; `html`/`body.covenant-desktop`

### B. Remaining shell / OS stubs (not layout UI)

- [ ] **Native dialogs** for destructive actions still on `window.confirm` / toast-only (import wipe, sign out, bulk deletes where desktop should feel OS-native)
- [ ] Verify Settings / About do **not** surface favicon / manifest / theme-color as user concepts
- [ ] **System tray** — optional sync / backup status
- [ ] **Backup file association** (`.sqlite` / planner backup open-with)
- [ ] **Native file pickers** polish (Electron `dialog.showOpenDialog` / `showSaveDialog` where HTML file inputs feel webby)
- [ ] Real **auto-update** (replace Help stub; electron-updater or equivalent + feed)
- [ ] Real **license activation** (replace Enter License stub)
- [ ] Code signing / SmartScreen (ops; documented in `DESKTOP_APP.md` — not blocking polish UX)

### C. Layout / sections / tables / tabs (advisory → implement Phases C–F)

Ordered later in the roadmap: **tighten per-section toolbars → row inspector → density → visual polish**.

- [ ] **Stable chrome + one primary job per screen** — app chrome (menu + compact top bar + section sidebar) stays put; each tool screen has one primary task, not a mini-dashboard
- [ ] **Sidebar for app sections**; **secondary tabs only for sub-views** within a section (not top-level navigation)
- [ ] **Table-local toolbar** — Add / Filter / Sort / Search **directly above** the table they control (not duplicated in global chrome or page heroes)
- [ ] **Optional right inspector** on row select (details / edit without leaving the list)
- [ ] **Desktop density pass** — tighter row height, padding, and control sizing under `body.covenant-desktop` (respect Profile density where it already exists)
- [ ] **Simpler empty states** — short copy + one primary action; no marketing blocks
- [ ] **Reduce webby clutter inside tool screens** — demote or hide on desktop: large heroes, duplicate toolbars, stat-card strips that compete with the primary job

---

## Principles (apply in every layout phase)

1. **Stable chrome** — menu bar + compact top bar + left section nav do not jump when switching tools.
2. **One job per screen** — headline + primary workspace; secondary stats/helpers below or in inspector, not in the first viewport of a tool.
3. **Tables own their chrome** — Add / Filter / Sort / Search live above that table only.
4. **Sidebar = sections; tabs = sub-views** — do not add another top-level tab strip that mirrors the sidebar.
5. **Desktop ≠ marketing site** — gate hero / promo / install / “this week” clutter with `covenant-desktop`.
6. **Web stays capable** — prefer CSS/class gates and desktop-only branches; do not gut mobile/web layouts.

---

## Phased delivery

### Phase 0 — Baseline verify (DONE)

**Goal:** Confirm shipped shell before new work.  
**Depends on:** nothing.  
**Status:** DONE on `cursor/desktop-electron-017e`.

**Acceptance**

- [x] `npm run desktop:smoke` passes
- [x] Compact toolbar + menus + no `#planner-footer` in shell HTML
- [x] PWA SW / install / update banner behavior gated for desktop
- [x] Docs: `DESKTOP_APP.md` checklist items B, 1–3, 5 marked Done (first pass)

**Verify (any OS agent)**

```bash
npm install --prefix desktop
npm run desktop:smoke
```

---

### Phase A — Destructive dialogs + copy cleanup

**Goal:** Desktop feels OS-native for irreversible actions; no browser-install jargon.  
**Depends on:** Phase 0.  
**Order:** Do before large layout refactors so dialogs work from menus and in-app alike.

**Work**

- [ ] Inventory `window.confirm` / toast-only destructive paths (import wipe, sign out, bulk delete, clear history, etc.)
- [ ] Bridge to Electron `dialog.showMessageBox` (or preload `covenantDesktop.confirm`) for desktop; keep `confirm` fallback on web
- [ ] Audit Settings / About / Help copy for favicon, manifest, theme-color, “install as PWA” wording; desktop-only strings where needed
- [ ] Keep license + updates as stubs until Phase G (do not fake activation)

**Acceptance**

- [ ] Import backup / wipe and sign-out use native message boxes on desktop
- [ ] At least the high-traffic bulk-delete confirms use the same bridge
- [ ] No Settings pane teaches desktop users to “install the PWA” or edit manifest/theme-color
- [ ] `desktop:smoke` still green; manual: File → Import Backup cancel path does not wipe

**Verify (Windows x64)**

```bat
npm install
npm install --prefix desktop
npm run desktop:build:win:x64
REM install/run from desktop\dist\ *-win-x64-setup.exe or portable
REM Exercise: Import Backup → Cancel; Sign out; one bulk delete Cancel/OK
```

---

### Phase B — Demote remaining web chrome in tool screens (light pass)

**Goal:** Quick wins before structural layout work — hide/demote heroes, duplicate global-ish toolbars, and stat-card clutter **inside tool panels** on desktop only.  
**Depends on:** Phase 0 (Phase A nice-to-have first).  
**Does not** yet relocate Add/Filter/Sort or add inspector.

**Work**

- [ ] List tool panels with page heroes / promo strips / duplicate action rows / dense stat cards (Guests, Budget, Payments, Calendar, Tasks, etc.)
- [ ] Under `body.covenant-desktop`, collapse or demote: large heroes, duplicate toolbar rows that repeat global actions, non-essential stat strips above the primary table/board
- [ ] Preserve scripture / essential section titles; do not remove data the user needs—only chrome noise
- [ ] Simpler **empty-state** copy+CTA pass where empty UI is currently marketing-heavy (full empty-state redesign can finish in Phase F)

**Acceptance**

- [ ] Opening Dashboard vs Guests vs Budget on desktop: first viewport is task-focused, not a marketing hero
- [ ] No second “global” action row that duplicates Search/Save/Settings already in the top bar
- [ ] Web/mobile layout unchanged (or only improved if shared cleanup is clearly safe)

**Verify (Windows x64):** rebuild x64; spot-check 5+ sections for hero/stat clutter.

---

### Phase C — Information architecture: sidebar + one job + tabs policy

**Goal:** Stable left nav for **app sections**; tabs only for **sub-views**.  
**Depends on:** Phase B (clutter reduced so IA changes are visible).  
**Layout order note:** Establish structure before tightening every table toolbar.

**Work**

- [ ] Confirm / harden desktop sidebar as the sole top-level section switcher
- [ ] Audit secondary tab strips: keep only true sub-views (e.g. Calendar month/week/agenda); remove or relocate strips that duplicate sidebar destinations
- [ ] Each section: one primary headline + one primary workspace region
- [ ] Document section → primary job mapping in a short table at the bottom of this phase’s PR description

**Acceptance**

- [ ] Switching sections does not remount or reshuffle menu/top-bar chrome
- [ ] No tool screen uses a tab row as a substitute for the app sidebar
- [ ] “One primary job” is true for Guests, Budget, Payments, Calendar, Tasks at minimum

**Verify (Windows x64):** navigate Go menu + sidebar across sections; chrome stays stable.

---

### Phase D — Table-local toolbars (tighten per-section)

**Goal:** Add / Filter / Sort / Search sit **above the table they control**.  
**Depends on:** Phase C.  
**Priority:** First layout implementation slice after IA (per advisory order).

**Work**

- [ ] Define a shared desktop table-toolbar pattern (structure + CSS under `covenant-desktop`)
- [ ] Migrate high-traffic tables first: Guests, Budget lines, Payments, Contacts/Vendors as applicable
- [ ] Remove duplicate Add/Filter/Sort/Search from page headers / distant toolbars once local toolbar exists
- [ ] Keyboard: keep existing shortcuts; ensure focus order is toolbar → table → inspector (if present later)

**Acceptance**

- [ ] On desktop, primary CRUD tables show Add + Filter + Sort + Search in one strip immediately above the grid
- [ ] No orphan duplicate of those controls higher on the same screen
- [ ] Web keeps a usable toolbar (shared component or web-specific layout OK)

**Verify (Windows x64):** Guests/Budget/Payments — add row, filter, sort, search without using top app bar.

---

### Phase E — Optional right inspector on row select

**Goal:** Select a row → details/edit in a right inspector; list stays put.  
**Depends on:** Phase D (table chrome stable).  
**Priority:** After per-section toolbars.

**Work**

- [ ] Inspector shell: open on row select / Enter; close on Escape / clear selection
- [ ] Start with one section (recommend Guests or Payments), then replicate pattern
- [ ] Do not force inspector on tiny windows — collapse to drawer/modal below a width breakpoint
- [ ] Avoid stacking inspector + unrelated side panels

**Acceptance**

- [ ] Selecting a row opens inspector with that record; changing selection updates it
- [ ] Closing inspector returns focus to the table
- [ ] No full-page navigation required for common field edits in the pilot section

**Verify (Windows x64):** select/deselect rows; edit a field; Escape closes.

---

### Phase F — Desktop density + empty states + visual polish

**Goal:** Tighter desktop density; simple empties; final visual pass.  
**Depends on:** Phases D–E (structure done).  
**Priority:** After inspector.

**Work**

- [ ] Density tokens / CSS for `body.covenant-desktop` (row height, cell padding, control height) aligned with Profile density where possible
- [ ] Finish **simpler empty states** (title, one sentence, one primary button)
- [ ] Visual polish: alignment of sidebar, table toolbar, inspector; reduce leftover cards that aren’t interactive containers
- [ ] Regression pass: Calendar / floorplan / vision board still usable (density must not break canvas tools)

**Acceptance**

- [ ] Default desktop list density shows more rows than web “comfortable” without feeling cramped vs Profile compact
- [ ] Empty Guests/Budget/Payments match the simple pattern
- [ ] No new purple-marketing / hero regressions in tool screens

**Verify (Windows x64):** density toggle if applicable; empty + populated states; Calendar still OK.

---

### Phase G — OS integrations (tray, file assoc, pickers, auto-update, license)

**Goal:** Finish remaining stubs from the original checklist.  
**Depends on:** Phase A recommended; can parallelize with C–F if staffed separately, but **auto-update + license** need product decisions (feed URL, key scheme).

**Work**

- [ ] Tray icon + sync/backup status menu (optional show/hide in Settings)
- [ ] File associations for backup / `.sqlite` open → import or open-in-place flow (careful with data safety)
- [ ] Replace HTML file inputs with native open/save dialogs for backup export/import on desktop
- [ ] Wire **auto-update** (electron-updater or similar); Help → Check for Updates becomes real; keep SW banner off
- [ ] Wire **license** entry + validation; Keep stub messaging until backend/key format exists
- [ ] Document update feed + signing requirements in `DESKTOP_APP.md`

**Acceptance**

- [ ] Tray reflects at least online/offline or last backup/sync hint
- [ ] Double-click backup file (once associated) opens a safe import prompt
- [ ] Backup export/import use native dialogs on desktop
- [ ] Check for Updates queries a real feed (or documented staging feed); no SW reload banner
- [ ] Enter License accepts/validates keys when product is ready — until then remain honest stubs

**Verify (Windows x64):** full NSIS install; tray; update check; file open assoc on a test backup.

---

## Suggested agent order (checklist for the next implementer)

1. [ ] Read this plan + `DESKTOP_APP.md` polish section  
2. [ ] Run Phase 0 verify (`desktop:smoke`)  
3. [ ] Phase A — native destructive dialogs + copy  
4. [ ] Phase B — demote heroes / duplicate toolbars / stat clutter  
5. [ ] Phase C — sidebar IA + one job + tabs policy  
6. [ ] Phase D — table-local toolbars  
7. [ ] Phase E — row inspector  
8. [ ] Phase F — density + empty states + polish  
9. [ ] Phase G — tray / file assoc / pickers / auto-update / license  
10. [ ] Update status marks in **this file** and in `DESKTOP_APP.md` checklist when a phase lands  
11. [ ] Windows x64 rebuild + install smoke after each phase that touches `desktop/` or shipped UI  

---

## Rebuild / verify commands (Windows x64 desktop)

From repo root on a **Windows x64** machine (preferred for NSIS):

```bat
git checkout cursor/desktop-electron-017e
git pull origin cursor/desktop-electron-017e

npm install
npm install --prefix desktop

REM Quick non-GUI checks:
npm run desktop:smoke
npm run syntax --prefix desktop

REM Dev (no installer):
npm run desktop:dev

REM Production-like artifacts (x64 only):
npm run desktop:build:win:x64
```

Outputs under `desktop\dist\` (names may include version):

- `The Covenant Wedding Planner-*-win-x64-setup.exe` — NSIS installer  
- `The Covenant Wedding Planner-*-win-x64-portable.exe` — portable  
- `The Covenant Wedding Planner-*-win-x64.zip` — zip / unpacked fallback  

Post-install check:

```bat
dir "%LOCALAPPDATA%\Programs\CovenantWeddingPlanner\CovenantWeddingPlanner.exe"
```

Linux/CI agents: `npm run desktop:smoke` + `npm run desktop:build:win:zip` (NSIS needs Wine/Windows). GUI polish acceptance requires a Windows run.

---

## Out of scope (unless a later task says otherwise)

- Changing Railway / PWA hosted install flow for browser users  
- Implementing layout UI in the same PR as this plan document  
- Purchasing code-signing certificates  
- macOS/Linux first-class installers (shell may run; Windows is the product target)

---

## Doc sync

When completing a phase, update:

1. Checkboxes in **this file**  
2. Status column in [`DESKTOP_APP.md`](./DESKTOP_APP.md#desktop-native-polish)  
3. Theme table in [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md#desktop-native-polish) if a theme flips from open → shipped  
