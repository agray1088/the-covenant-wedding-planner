# Desktop native polish — master implementation plan

Actionable end-to-end plan for Windows Electron desktop UX **and** shared-UI tablet / iPad fitness. Future agents should follow this file **checkbox-first** without re-asking scope.

**Sources merged here**

- [`DESKTOP_APP.md`](./DESKTOP_APP.md) — shell, build, menus, “Desktop native polish” checklist (incl. tablet track)
- [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) — Desktop native polish + tablet pointer
- [`PWA_INSTALL.md`](./PWA_INSTALL.md) — Safari / iPad Add to Home Screen + offline verify
- [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md) — one-time app + optional cloud; license serials / Stripe decisions (docs only until commerce pass)
- [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) — phased Stripe + redeem + tab-gate implementation (follow that file for commerce; not this polish track alone)
- Layout / sections / tables / tabs guidance (advisory; **not implemented** until Phases C–F / T)

**Branch:** `cursor/desktop-electron-017e` (docs track may land on `cursor/tablet-ipad-track-3a55`)  
**Constraint:** Prefer native menus + compact chrome over webby marketing chrome inside tool screens. **Do not lock critical actions to the Electron menu bar only** — keep equivalent in-UI paths so tablet / PWA / iPad (no native menu bar) stay fully usable. Web / PWA / Railway hosting stay unchanged unless a change is gated on `COVENANT_DESKTOP` / `body.covenant-desktop` **or** shared responsive / touch tokens that help all shells.

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

- [x] **Native dialogs** for destructive actions — `covenantDesktop.confirm` → Electron `dialog.showMessageBox`; `covConfirm` prefers native on desktop (import wipe, sign out, bulk deletes via shared bridge). Web keeps in-page modal / `confirm` fallback
- [x] Verify Settings / About do **not** surface favicon / manifest / theme-color as user concepts — desktop About points to Help → About; static server scrubs manifest / theme-color / apple-touch meta from served HTML
- [ ] **System tray** — optional sync / backup status
- [ ] **Backup file association** (`.sqlite` / planner backup open-with)
- [ ] **Native file pickers** polish (Electron `dialog.showOpenDialog` / `showSaveDialog` where HTML file inputs feel webby)
- [ ] Real **auto-update** (replace Help stub; electron-updater or equivalent + feed)
- [ ] Real **license activation** (replace Enter License stub)
- [ ] Code signing / SmartScreen (ops; documented in `DESKTOP_APP.md` — not blocking polish UX)

### C. Layout / sections / tables / tabs (advisory → implement Phases C–F)

Ordered later in the roadmap: **tighten per-section toolbars → row inspector → density → visual polish**. When touching layout, keep **tablet / touch** in mind (Phase T) so Electron density does not become the only path.

- [x] **Stable chrome + one primary job per screen** — compact forest brand bar + horizontal `.rd-tabs` section nav + pageheads demoted; KPI strips softened (Guests / Budget / Payments / Tasks / Dashboard). Deeper “one job” per remaining sections still open
- [x] **Horizontal app section nav (not left app sidebar)** — Overview · Planning · People · Money · Vendors · The Day · Covenant · Documents stay as top `.rd-tabs`; legacy `#nav-category-bar` stays retired; **in-page** left rails (views/filters) preserved. See **Decided shell layout** below
- [x] **Light command ribbon** — Home | Plan | View | Help under section tabs (`js/desktop-shell-layout.js`); additive to native menus; critical actions remain in-UI (Phase T)
- [ ] **Table-local toolbar** — Add / Filter / Sort / Search **directly above** the table they control (not duplicated in global chrome or page heroes); touch-usable (Phase T / D)
- [x] **Optional right inspector** on row select — Guests v1: persistent / collapsible CRM column with “Select a row” empty state; reuses `#record-drawer`. Tablet split/stack still Phase T
- [ ] **Adaptive density** — tighter row height under `body.covenant-desktop`; comfortable / touch-friendly density for tablet & PWA (not desktop-only)
- [ ] **Simpler empty states** — short copy + one primary action; no marketing blocks
- [x] **Reduce webby clutter inside tool screens** — first pass under `body.covenant-desktop`: hide eyebrows / teach blocks / dashboard view-leads; soften stats & payment insight; rewrite backup banner; hide version stamp (Help → About). More sections / empty-state redesign remain for Phase F

### T. Tablet / iPad (same UI codebase — near-term PWA; later optional native shell)

Same planner UI must translate well to **tablet**, especially **iPad**. Near-term delivery is **hosted PWA / Safari Add to Home Screen** (not a separate app). Optional native iPad shell is a **later docs-only** phase (no Capacitor / App Store work in this plan’s implementation phases).

- [ ] **iPad PWA install** — Safari Share → Add to Home Screen; Settings → Install app copy remains accurate on iPadOS
- [ ] **Offline verify on iPad** — one online visit → airplane mode / offline → shell still loads; planning still works locally
- [ ] **Responsive breakpoints** — usable layouts at common iPad widths (portrait + landscape); no broken overflow of primary tool chrome
- [ ] **Collapsible sidebar / split view** — sidebar collapses or overlays on tablet; list + inspector can split or stack without trapping the user
- [ ] **Touch targets** — interactive controls ≥ ~44×44 px (or equivalent hit area) on touch / coarse pointer
- [ ] **No hover-only actions** — every critical control has a tap/focus path (menus, row actions, toolbar overflow)
- [ ] **Table toolbars on touch** — Add / Filter / Sort / Search usable without a mouse; adaptive density (not Electron-compact-only)
- [ ] **In-UI paths for critical actions** — export/import, settings, dark mode, profile, hub, jump, etc. remain reachable without Electron menus
- [ ] **Later (docs only):** optional native iPad shell (Capacitor / WKWebView / App Store) — research + decision notes; **do not implement** unless a later task explicitly scopes it

---

## Decided shell layout (Electron — `covenant-desktop`)

**Direction (agreed):** top → bottom stack. Web/PWA keep closer to the current look unless shared structure helps.

| # | Layer | Notes |
|---|--------|--------|
| 1 | Native Electron menu | File / Edit / View / Go / Help (already shipped) |
| 2 | Compact green brand bar | Brand + search + alerts (+ Save/settings as fits). Toolbar height — not a marketing hero. Forest accent kept |
| 3 | Horizontal section tabs | Overview · Planning · People · Money · Vendors · The Day · Covenant · Documents (`.rd-tabs`). **Do not** move these to a left app sidebar |
| 4 | Light ribbon | Home \| Plan \| View \| Help with grouped commands (Undo/Redo, backup, Quick Jump, Hub, Dark Mode, Profile, Zoom, About, docs stubs). Wired to existing actions / preload bridges. **Additive** — not ribbon-only for critical actions |
| 5 | Page toolbar | Existing per-section Add/Filter/Sort etc. kept |
| 6 | Content + optional right CRM inspector | Guests v1: select row → `#record-drawer` in inspector; empty “Select a row”; collapsible |
| 7 | In-page left panels | Views/filters/details **within** a section stay; only **app** section nav is horizontal across the top |

**Gate:** `COVENANT_DESKTOP` / `covenantDesktop` / `body.covenant-desktop`. Implementation: `js/desktop-shell-layout.js` + desktop compact topbar in `js/redesign-shell.js`.

---

## Principles (apply in every layout phase)

1. **Stable chrome** — menu bar + compact brand bar + horizontal section tabs (+ ribbon on desktop) do not jump when switching tools; on tablet/PWA, top bar + section nav stay stable even without a native menu bar.
2. **One job per screen** — headline + primary workspace; secondary stats/helpers below or in inspector, not in the first viewport of a tool.
3. **Tables own their chrome** — Add / Filter / Sort / Search live above that table only; controls must work with touch.
4. **App sections stay horizontal; in-page left rails OK** — do not replace Overview…Documents with a left app sidebar; keep page-local views/filters sidebars. Collapse page rails on tablet widths (Phase T).
5. **Desktop ≠ marketing site** — gate hero / promo / install / “this week” clutter with `covenant-desktop` where appropriate; tablet PWA still gets a task-focused first viewport.
6. **Web / tablet stay capable** — prefer CSS/class gates and desktop-only branches; do not gut mobile/web/tablet layouts. **Adaptive density**, not desktop-only density.
7. **Menu bar + ribbon are additive, not exclusive** — Electron menus / ribbon may surface chrome, but critical actions keep in-UI entry points for tablet / PWA / iPad.

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
**Status:** DONE (first pass) on `cursor/desktop-electron-017e`.

**Work**

- [x] Inventory `window.confirm` / toast-only destructive paths (import wipe, sign out, bulk delete, clear history, etc.)
- [x] Bridge to Electron `dialog.showMessageBox` (preload `covenantDesktop.confirm` / IPC `covenant:confirm`) for desktop; keep in-page `covConfirm` / `confirm` fallback on web
- [x] Audit Settings / About / Help copy for favicon, manifest, theme-color, “install as PWA” wording; desktop-only strings where needed; scrub meta from desktop-served HTML
- [x] Keep license + updates as stubs until Phase G (do not fake activation)

**Acceptance**

- [x] Import backup / wipe and sign-out use native message boxes on desktop (`covConfirm` → bridge; restore path async)
- [x] At least the high-traffic bulk-delete confirms use the same bridge (Payments, Budget, Notes, Data Hub, etc. already call `covConfirm`)
- [x] No Settings pane teaches desktop users to “install the PWA” or edit manifest/theme-color
- [x] `desktop:smoke` still green; manual: File → Import Backup cancel path does not wipe

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
**Status:** DONE (first pass) — Guests / Budget / Payments / Tasks / Dashboard + shell banners. Remaining sections / empty states → Phase F.

**Work**

- [x] List tool panels with page heroes / promo strips / duplicate action rows / dense stat cards (Guests, Budget, Payments, Calendar, Tasks, etc.)
- [x] Under `body.covenant-desktop`, collapse or demote: large heroes, duplicate toolbar rows that repeat global actions, non-essential stat strips above the primary table/board
- [x] Preserve scripture / essential section titles; do not remove data the user needs—only chrome noise
- [ ] Simpler **empty-state** copy+CTA pass where empty UI is currently marketing-heavy (full empty-state redesign can finish in Phase F)

**Acceptance**

- [x] Opening Dashboard vs Guests vs Budget on desktop: first viewport is task-focused, not a marketing hero (eyebrows / teach / view-leads demoted; stats softened)
- [x] No second “global” action row that duplicates Search/Save/Settings already in the top bar (compact desktop topbar retained; quiet print duplicates hidden)
- [x] Web/mobile layout unchanged (or only improved if shared cleanup is clearly safe) — all gated on `covenant-desktop`

**Verify (Windows x64):** rebuild x64; spot-check 5+ sections for hero/stat clutter.

---

### Phase C — Information architecture: horizontal sections + one job + tabs policy

**Goal:** Stable **horizontal** nav for **app sections** (`.rd-tabs`); page-local left rails for views/filters; sub-view tabs only inside a section.  
**Depends on:** Phase B (clutter reduced so IA changes are visible).  
**Layout order note:** Establish structure before tightening every table toolbar.  
**Tablet weave:** Page-local left rails collapse / overlay at tablet breakpoints (Phase T); do not invent a left app-section sidebar.  
**Status:** DONE (decided layout first pass) — compact brand bar + `.rd-tabs` + Home|Plan|View|Help ribbon; legacy `#nav-category-bar` stays hidden. Calendar/Tasks deeper one-job polish still open.

**Work**

- [x] Restore / keep horizontal category menubar (`.rd-tabs`) as sole top-level section switcher; do **not** move Overview…Documents into a left app sidebar
- [x] Add light command ribbon (Home | Plan | View | Help) under section tabs; wire to existing menu/preload actions; keep in-UI duplicates for tablet
- [ ] Audit secondary tab strips: keep only true sub-views (e.g. Calendar month/week/agenda); remove or relocate strips that duplicate app-section destinations
- [x] Each section: one primary headline + one primary workspace region — first pass on Guests / Budget / Payments / Dashboard / Tasks pageheads
- [x] Inspector + page rail must remain collapsible (Guests CRM inspector collapses; context sidebar already collapses)
- [x] Document section → primary job mapping (see table below) + decided shell stack

**Section → primary job (desktop first pass)**

| Section | Primary job |
|---------|-------------|
| Dashboard | At-a-glance attention + countdown (marketing leads demoted) |
| Guests | Manage guest list table (+ toolbar); teach chrome hidden |
| Budget | Edit budget categories / line items |
| Payments | Track payment schedule / table |
| Tasks | Work the task list / board (sub-view tabs OK) |
| Calendar | Calendar sub-views only (month/week/agenda) — deeper audit TBD |

**Acceptance**

- [x] Switching sections does not remount or reshuffle menu / brand bar / section tabs / ribbon
- [x] App section nav remains horizontal (`.rd-tabs`); in-page left panels stay page-local
- [ ] “One primary job” is true for Guests, Budget, Payments, Calendar, Tasks at minimum — Guests/Budget/Payments/Tasks improved; Calendar deeper pass still open
- [x] Inspector + page rails leave a clear collapse path for tablet widths (even if Phase T wires the breakpoints)

**Verify (Windows x64):** navigate Go menu + horizontal tabs across sections; chrome stays stable; ribbon commands fire.  
**Verify (tablet-minded):** at ~768–1024 px width in browser DevTools, page rails / inspector do not permanently consume the whole workspace with no escape.

---

### Phase D — Table-local toolbars (tighten per-section)

**Goal:** Add / Filter / Sort / Search sit **above the table they control**.  
**Depends on:** Phase C.  
**Priority:** First layout implementation slice after IA (per advisory order).  
**Tablet weave:** Toolbar pattern must be **touch-usable** (spacing, overflow menus, no hover-only filter chips). Phase T verifies on iPad; this phase must not ship mouse-only affordances.

**Work**

- [ ] Define a shared table-toolbar pattern (structure + CSS; desktop gate OK, but shared markup preferred for PWA/tablet)
- [ ] Migrate high-traffic tables first: Guests, Budget lines, Payments, Contacts/Vendors as applicable
- [ ] Remove duplicate Add/Filter/Sort/Search from page headers / distant toolbars once local toolbar exists
- [ ] Keyboard: keep existing shortcuts; ensure focus order is toolbar → table → inspector (if present later)
- [ ] Touch: ensure primary toolbar controls have adequate hit targets; wrap / overflow rather than clipping on narrow tablet widths

**Acceptance**

- [ ] On desktop, primary CRUD tables show Add + Filter + Sort + Search in one strip immediately above the grid
- [ ] No orphan duplicate of those controls higher on the same screen
- [ ] Web / PWA keeps a usable toolbar (shared component or web-specific layout OK)
- [ ] No critical table action is hover-only (visible on tap / focus)

**Verify (Windows x64):** Guests/Budget/Payments — add row, filter, sort, search without using top app bar.  
**Verify (touch / DevTools coarse pointer):** same flows without relying on hover.

---

### Phase E — Optional right inspector on row select

**Goal:** Select a row → details/edit in a right inspector; list stays put.  
**Depends on:** Phase D preferred; Guests v1 shipped with shell layout ahead of full table-toolbar pass.  
**Priority:** After per-section toolbars for remaining sections.  
**Tablet weave:** Prefer **split view** on wide tablets; **drawer / full-sheet** below breakpoint. Same shell as desktop inspector — responsive behavior, not a second product.  
**Status:** DONE (Guests v1 first pass) — collapsible CRM column + empty state; reuses `#record-drawer` / existing guest editor.

**Work**

- [x] Inspector shell: open on row select (existing `rdOpenDrawer`); empty state when none selected; collapse control
- [x] Start with Guests / People; pattern reusable via `#*-drawer-slot` + empty chrome
- [x] Collapse path on desktop (persist preference); tablet breakpoint polish still Phase T
- [x] Reuse existing detail / drawer / editors rather than rewriting forms
- [x] Close / collapse control is visible (not hover-dismiss only)

**Acceptance**

- [x] Selecting a guest row opens inspector with that record; changing selection updates it
- [x] Collapsing inspector returns space to the table; expand control restores it
- [x] No full-page navigation required for common field edits on Guests
- [ ] Below tablet breakpoint, inspector does not permanently crush the table (Phase T verify)

**Verify (Windows x64):** select/deselect guest rows; edit a field; collapse / expand inspector.  
**Verify (tablet width):** open inspector in portrait-like width; dismiss via visible control.

---

### Phase F — Desktop density + empty states + visual polish

**Goal:** Tighter desktop density; simple empties; final visual pass.  
**Depends on:** Phases D–E (structure done).  
**Priority:** After inspector.  
**Tablet weave:** Density is **adaptive** — Electron may go compact; tablet / touch / PWA keep comfortable targets. Do not apply `covenant-desktop` compact tokens to iPad Safari.

**Work**

- [ ] Density tokens / CSS for `body.covenant-desktop` (row height, cell padding, control height) aligned with Profile density where possible
- [ ] Keep separate (or media-query / pointer-based) comfortable density for touch / tablet so Phase T is not blocked by desktop-only tokens
- [ ] Finish **simpler empty states** (title, one sentence, one primary button)
- [ ] Visual polish: alignment of sidebar, table toolbar, inspector; reduce leftover cards that aren’t interactive containers
- [ ] Regression pass: Calendar / floorplan / vision board still usable (density must not break canvas tools)

**Acceptance**

- [ ] Default desktop list density shows more rows than web “comfortable” without feeling cramped vs Profile compact
- [ ] Touch / tablet path is not forced into desktop-compact row heights
- [ ] Empty Guests/Budget/Payments match the simple pattern
- [ ] No new purple-marketing / hero regressions in tool screens

**Verify (Windows x64):** density toggle if applicable; empty + populated states; Calendar still OK.

---

### Phase T — Tablet / iPad fitness (PWA near-term)

**Goal:** Same UI codebase works well on tablet — especially **iPad** via **PWA / Safari Add to Home Screen** — with responsive chrome, touch targets, and in-UI actions (no Electron menu bar).  
**Depends on:** Phase 0; layout work in C–F should be tablet-aware as noted above. Phase T can start after B for install/offline verify, and finish after D–F for toolbar / density / inspector acceptance.  
**Near-term product:** hosted PWA on iPadOS Safari — **not** a separate native app.  
**Out of this phase’s implementation:** Capacitor / WKWebView / App Store shell (see **Phase T-later** docs stub below).

**Work**

- [ ] Confirm iPad install path: Safari → Share → **Add to Home Screen**; Settings → Install app hints match [`PWA_INSTALL.md`](./PWA_INSTALL.md)
- [ ] Verify offline: open once online → go offline / airplane mode → planner shell loads; local planning still works; document any iPadOS SW quirks
- [ ] Define / document responsive breakpoints for tablet (portrait + landscape); apply to sidebar collapse and inspector split/stack
- [ ] Collapsible sidebar (overlay or icon rail) at tablet widths; restore stable section switching without a permanent wide nav
- [ ] Touch targets: audit primary chrome + table toolbar + inspector close — min hit area ~**44×44 px** (or equivalent padding)
- [ ] Remove or dual-path **hover-only** actions (row kebab that only appears on hover, tooltip-only commands, etc.)
- [ ] Table toolbars: confirm Add / Filter / Sort / Search work with touch; adaptive density (comfortable on tablet)
- [ ] Critical-action audit: every File/Edit/View/Go action users need on tablet has an **in-UI** path (Settings, Backup, Dark Mode, Profile, Hub, Quick Jump, etc.) — menu bar remains Electron-additive
- [ ] Spot-check high-traffic sections on iPad (or Safari responsive + touch emulation): Guests, Budget, Payments, Calendar, Tasks

**Acceptance**

- [ ] iPad can install via Add to Home Screen and relaunch as a standalone-ish home-screen app
- [ ] After one online visit, offline open still shows the planner shell (SW / cache path per `PWA_INSTALL.md`)
- [ ] At tablet breakpoints: sidebar collapses/overlays; primary workspace remains usable in portrait and landscape
- [ ] Primary interactive controls meet ~44 px touch guidance; no critical hover-only actions remain in audited sections
- [ ] Table toolbars usable with touch; density is not locked to Electron-compact
- [ ] Critical planning actions reachable without any Electron menu bar
- [ ] Web phone layout and Windows Electron layout are not regressed

**Verify (iPad or Safari)**

1. Hosted (or local HTTPS) URL in Safari on iPad → Share → Add to Home Screen → open from home screen.  
2. Online once → Airplane Mode → relaunch → shell loads; edit a guest / budget row locally.  
3. Rotate portrait/landscape; collapse/open sidebar; use table toolbar; open/close inspector if present.  
4. Confirm Settings / Backup / Dark Mode / Profile reachable from in-app UI.

**Verify (any agent without iPad hardware)**

```bash
# Docs + PWA install notes present; no UI implementation required for this docs phase.
test -f docs/PWA_INSTALL.md && test -f docs/DESKTOP_NATIVE_POLISH_PLAN.md
# Manual: Chrome/Safari DevTools → iPad dimensions + coarse pointer; exercise sidebar + toolbar.
```

---

### Phase T-later — Optional native iPad shell (**docs only — do not implement**)

**Goal:** Capture a future option for a native iPad wrapper; **no code** in this plan’s delivery track.  
**Depends on:** Phase T (PWA fitness) proven useful.  
**Status:** Documentation stub only.

**Work (documentation only)**

- [ ] Short decision note: Capacitor vs WKWebView wrapper vs stay-PWA — pros/cons for offline SQLite, file backup, App Store review, update cadence
- [ ] Explicit non-goal until product asks: App Store listing, push certs, IAP, Capacitor project scaffold
- [ ] Cross-link from `DESKTOP_APP.md` / this plan when the note exists

**Acceptance (docs)**

- [ ] A short “optional native iPad shell” subsection exists (here or linked) stating **not scheduled for implementation**
- [ ] No Capacitor / Xcode / App Store project added under this phase

---

### Phase G — OS integrations (tray, file assoc, pickers, auto-update, license)

**Goal:** Finish remaining stubs from the original checklist.  
**Depends on:** Phase A recommended; can parallelize with C–F if staffed separately, but **auto-update + license** need product decisions (feed URL, key scheme).

**Licensing / packaging decisions** (prices, trial, 16-char codes, `app_licensed` / `cloud_active`): see [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md). **Build plan** (Stripe Checkout, webhooks, hashed serials, admin codes, tab grey-out): [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md). Do **not** build Stripe Checkout in this polish phase — keep Enter License… stubs until a dedicated commerce pass; Phase G can still wire validation against the agreed key scheme once the backend exists.

**Work**

- [ ] Tray icon + sync/backup status menu (optional show/hide in Settings)
- [ ] File associations for backup / `.sqlite` open → import or open-in-place flow (careful with data safety)
- [ ] Replace HTML file inputs with native open/save dialogs for backup export/import on desktop
- [ ] Wire **auto-update** (electron-updater or similar); Help → Check for Updates becomes real; keep SW banner off
- [ ] Wire **license** entry + validation per [`PRICING_AND_PLANS.md`](./PRICING_AND_PLANS.md) / [`LICENSING_AND_STRIPE_PLAN.md`](./LICENSING_AND_STRIPE_PLAN.md) Phase 4; keep stub messaging until backend/key format exists
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

1. [x] Read this plan + `DESKTOP_APP.md` polish section (incl. tablet checklist)  
2. [x] Run Phase 0 verify (`desktop:smoke`)  
3. [x] Phase A — native destructive dialogs + copy  
4. [x] Phase B — demote heroes / duplicate toolbars / stat clutter (first pass)  
5. [x] Phase C — sidebar IA + one job + tabs policy (**tablet-aware** collapse path) — **started**; finish Calendar/tab audit next  
6. [ ] Phase D — table-local toolbars (**touch-usable**)  
7. [ ] Phase E — row inspector (**split / drawer** for tablet widths)  
8. [ ] Phase F — density + empty states + polish (**adaptive** density, not desktop-only)  
9. [ ] Phase T — iPad PWA install + offline + breakpoints + touch + in-UI critical actions  
10. [ ] Phase G — tray / file assoc / pickers / auto-update / license (Windows Electron)  
11. [ ] Phase T-later — optional native iPad shell notes only if product asks (**docs only**)  
12. [x] Update status marks in **this file** and in `DESKTOP_APP.md` checklist when a phase lands  
13. [ ] Windows x64 rebuild + install smoke after each phase that touches `desktop/` or shipped UI; iPad / Safari verify after Phase T  

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

- Changing Railway / PWA hosted install flow for browser users **except** tablet/iPad fitness improvements that keep the same hosted PWA  
- Implementing layout / tablet UI in the same PR as this plan document (**docs only** until a phase is staffed)  
- Purchasing code-signing certificates  
- macOS/Linux first-class installers (shell may run; Windows is the Electron product target)  
- **Native iPad App Store / Capacitor / WKWebView shell** — Phase T-later docs stub only; do not scaffold unless explicitly tasked  

---

## Doc sync

When completing a phase, update:

1. Checkboxes in **this file**  
2. Status column in [`DESKTOP_APP.md`](./DESKTOP_APP.md#desktop-native-polish) (desktop + tablet rows)  
3. Theme table in [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md#desktop-native-polish) if a theme flips from open → shipped  
