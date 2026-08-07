# Cursor Handoff — Component Consolidation (Phase 2) + Phase 3

**Read first:** `UI-UX-System-Unification-Plan.md` (same folder) is the spec. This file is the execution guide for the remaining consolidation and the page remediation.

## Non‑negotiable workflow (every step)

1. **Git checkpoint before each batch.** `git add -A && git commit -m "checkpoint: before <batch>"`. Commit after each verified sub‑step too, so any regression is a one‑line revert.
2. **Verify in the browser, not blind.** Run the local server, open the page, and use Cursor's browser/Playwright tool to screenshot the change in **light AND dark** and at desktop / ~860px / ~640px. Do **not** run this as a fully autonomous Auto pass — it changes appearance app‑wide.
3. **Caching:** `planner.js` and CSS cache on normal reloads. Hard‑refresh (Ctrl/Cmd+Shift+R), or temporarily add `?v=N` to the `<script src="js/planner.js">` tag in `index.html` for JS verification and remove it after.
4. **Regression guard:** after any change to shared CSS, re‑screenshot 2–3 previously‑fine pages (Dashboard, Vendors, a form page) to catch cascade regressions.
5. **Pin a strong model** for the CSS‑cascade work; don't rely on Auto's model pick.

## Key files

- `css/planner-tokens.css` — token definitions (gutter already consolidated here).
- `css/planner.css` — the big stylesheet; most `[class*="-card"]` rules, button styles, status pills.
- `css/planner-spacing-premium.css` — table‑head/spacing rules (already edited for the read‑only header).
- `css/planner-page-gutters.css` — more `[class*="-card"]` overrides.
- `css/planner-dark-editorial.css` — the `--dm-*` dark palette + card‑token dark values; loads LAST so it wins.
- `index.html` — panels, the UI/UX System dev page, the `<script src="js/planner.js">` tag.
- `js/planner.js` — component render helpers (`uedStat`, `uedCaption`, `uedBreakdownCard`, `injectMasthead`, `cwpRenderTable`, `cwpMergeReadOnlyHeaders`, etc.).

---

## Batch A — Card system + retire the override layer (highest risk; do first, most carefully)

**Target:** one canonical card = **transparent surface + hairline border + ~8px radius + no drop shadow** (the treatment already approved on the Dashboard), driven by tokens, applied through `.ued-panel`. Dark uses `#333` hairline on the `--dm-*` surfaces.

**Current state to fix:**
- Light card tokens are neutralized: in `planner.css` ~line 44119 → `--card-bg: transparent; --card-border: transparent; --card-radius: 0; --card-pad: 0`. Dark (`planner-dark-editorial.css` ~line 95) sets real values (`--dm-surface`, `--dm-border`, `3px`).
- Real light‑mode card painting is spread across competing rules: `planner.css` lines ~31441, ~33228, ~38328, ~38336, ~39208, ~41856; plus `planner-page-gutters.css`; plus the Dashboard‑scoped `#panel-dashboard .ued-panel` inset‑shadow rule already added.
- **Pitfall:** `[class*="-card"]` matches nested elements (`hub-record-card-head`, `-fields`, `-field`, `-badge`, `.ued-table-head`, etc.), so blanket rules paint/strip the wrong things. Any canonical rule must target the **card container only** (prefer the explicit `.ued-panel` / specific card classes, not a broad `[class*="-card"]`).

**Steps (commit + verify after each):**
1. Set the canonical card tokens (light) to `--card-border: <hairline, e.g. #d9cdb8>`, `--card-radius: 8px`, keep `--card-bg: transparent` (or a chosen subtle surface — decide once, globally). Leave dark as‑is.
2. Make the **authoritative** card rule (`body.editorial-v4 #main .panel :is(.ued-panel, .m-card, .m-panel, .ued-table-card, …)` ~planner.css 41856/43980) the single source, using the tokens. Ensure it targets **containers only**.
3. One‑by‑one, **neutralize/remove** the competing `[class*="-card"]` rules (31441, 33228, 38328, 38336, 39208, page‑gutters). After each removal, screenshot Dashboard + Vendors + Guests + a Faith page + a bespoke page (Honeymoon) in light **and** dark. Revert immediately if a page regresses.
4. Generalize the Dashboard's inset‑shadow hairline rule to all `.ued-panel` app‑wide (or fold it into the token rule) so every canonical card matches. Remove the now‑redundant Dashboard‑scoped `#panel-dashboard .ued-panel` overrides and the `#…card-grid .hub-record-card` inset‑shadow workarounds (~planner.css 34973+, 35002+) once the token rule covers them.
5. Confirm the record cards (`hub-record-card`) and stat cards (`.ued-band .ued-stat`) still read correctly (they currently use inset‑shadow workarounds because the border kept getting stripped — once the override layer is gone, switch them to a real `border`).

**Definition of done for A:** every card on every page is transparent + hairline + ~8px + no shadow (light) / charcoal + `#333` hairline (dark), from one rule; the `[class*="-card"]` override rules are gone; no nested element is mis‑painted.

---

## Batch B — Buttons (primary = forest green)

**Target hierarchy (theme‑aware where possible):**
- **Primary** = filled **forest** (`var(--forest)`), near‑white text.
- **Secondary** = transparent + hairline border, ink/forest text.
- **Danger** = red‑tinted (outline or subtle fill).
- **Toolbar** = compact secondary (the current `.cwp-btn` size).

**Map the three families to the above (CSS, no markup change needed):**
- Legacy `btn-forest` → primary; `btn-gold` → secondary (or a gold accent variant, decide once); `btn-outline` → secondary; `btn-danger` → danger.
- `ued-btn.primary` → primary; `ued-btn` → secondary.
- `cwp-btn` → toolbar/secondary; `cwp-btn-ghost` → ghost secondary; `cwp-btn-danger` → danger.
- Normalize size, padding, radius (token), font from tokens so all three families are visually identical per role.

Verify on: Wedding Setup (legacy `btn-*`), Dashboard/Budget (`ued-btn`), any table toolbar (`cwp-btn`), light + dark.

---

## Batch C — Status pills / badges

- One status treatment for `.status-pill--{neutral,blue,green,gold,red}` and the badges/chips (`.ro-badge-inline`, etc.), theme‑ and dark‑mapped.
- Retire duplicate status styling; ensure the desaturated "whisper" status colors in dark.

## Batch D — Progress

- `.ued-progress` / `.ued-progress-row` is the one progress component. Retire `ux-goal-bar` and any bespoke bars/rings; point them at the shared component. Squared track per the current look.

---

## Batch E — Merge "Wedding Venue" into "Vendors" → one "Venue & Vendors" page

**Goal (user‑approved):** collapse the two pages into a single **"Venue & Vendors"** page with a shared top tab bar `[ Vendors ] [ Venue ] [ Shortlist & Compare ]`. Keep the **Vendors** version of Shortlist & Compare (the preferred one) as the *only* compare; **remove** the venue page's duplicate "Vendor Comparisons". Rename the page to "Venue & Vendors"; **remove** the standalone "Wedding Venue" nav item.

**Why not a trivial edit:** the venue page (`#panel-venue`) is a customizable‑layout, multi‑sub‑tab page whose show/hide selectors are hard‑scoped to `#panel-venue` (e.g. `venTab()` at `js/planner.js` ~26292 toggles `#panel-venue .ven-tabbar .m-tab`). Re‑parenting its nodes into `#panel-vendors` breaks those selectors. **Recommended approach = keep both panels intact, unify them with a shared tab bar that navigates between them** — no node re‑parenting, so each panel's internal code keeps working.

**Key locations (verify line numbers; file has shifted before):**
- Nav config: `js/planner.js` ~3671–3673 — hub `venue-vendors` with child pages `{id:'venue',label:'Wedding Venue'…}` and `{id:'vendors',label:'Vendors'…}`.
- Page registry: ~3844 (`venue:{…}`) and ~3845 (`vendors:{…}`).
- Panel titles (masthead source): ~2327 and ~2338 (`vendors:'Vendors'`, `venue:'Wedding Venue'`).
- `PAGE_ORDER`: ~10804 (contains `'venue','vendors'`).
- Vendors shell markup (the tab bar lives here): `uedVendorShell()` ~15238; tab bar line ~15247; masthead `<h1>Vendors</h1>` ~15245.
- Tab state/switch: `_vndTab` ~15271, `syncVendorTabChrome()` ~15272, `vndTab()` ~15278.
- Venue render + shell: `renderVenuePage()` ~26330, `standardizeVenuePageShell()` ~26297, `venTab()` ~26292; the duplicate compare = `ensureVenueComparePreview()` / `renderVenueComparePreview()` ~26308–26328 and the `#venue-vendor-compare-card`.
- Panel render dispatch: ~5658 (`venue: () => { renderVenuePage(); … }`).

**Steps (commit + verify each):**
1. **Rename to "Venue & Vendors"** everywhere the label is shown for the vendors page: nav label (~3673), page registry label (~3845), panel‑title maps (~2327/~2338), and the shell `<h1>Vendors</h1>` (~15245) → `Venue &amp; Vendors`. Leave the eyebrow (already "Venue & Vendors").
2. **Shared tab bar on the Vendors panel.** In `uedVendorShell` (~15247) make the bar three tabs: `Vendors` (data-tab `tracker`), `Venue`, `Shortlist & Compare`. The `Venue` button calls a new `goVenueTab()` that does `showPanel('venue')`. Keep the existing `data-vnd-tab="tracker"` / `"shortlist"` panes.
3. **Shared tab bar on the Venue panel.** Add the *same* three‑tab bar at the top of `#panel-venue` (in `standardizeVenuePageShell` or the index.html panel), with `Venue` marked active; `Vendors` → `showPanel('vendors')` + `vndTab('tracker')`, `Shortlist & Compare` → `showPanel('vendors')` + `vndTab('shortlist')`. Keep the venue's existing sub‑tabs (Ceremony/Reception/Details/Notes/Reminders) as a secondary bar **but remove its "Shortlist & Compare" sub‑tab** (the duplicate).
4. **Remove the duplicate compare:** delete/disable `ensureVenueComparePreview` + `renderVenueComparePreview` calls in `renderVenuePage` (~26365) and drop `#venue-vendor-compare-card`. The Vendors `Shortlist & Compare` tab is now the single compare (it already supports the venue category schema).
5. **Set the venue panel's masthead title** to "Venue & Vendors" (`standardizeVenuePageShell` ~26305 sets `<h1 class="ued-title">Wedding Venue</h1>`).
6. **Nav:** remove the `{id:'venue',…}` child (~3672) so only "Venue & Vendors" remains. Add a `showPanel` guard so any legacy `showPanel('venue')` still works (it stays a real panel, just reached via the tab).
7. **Housekeeping:** leave `'venue'` in `PAGE_ORDER`/print maps (the print sheet + data model still use it), but confirm it no longer appears as its own nav row. Sample data, `data.venue`, and `renderVenuePage` are unchanged.

**Verify:** nav shows one "Venue & Vendors"; all three tabs switch correctly; venue details/shortlist/notes/reminders still edit and save; only one Shortlist & Compare exists; light + dark; ~860/640px. Screenshot each tab.

**Definition of done for E:** one nav entry, one page identity, three tabs, a single compare; no orphaned/broken venue sub‑tab; venue editing fully works.

---

## Phase 3 — Page‑by‑page remediation (after A–D)

Use the audit checklist and page inventory in `UI-UX-System-Unification-Plan.md` §3. For each page: screenshot (light) → run the 10‑point checklist → dark → responsive → swap any bespoke markup to the canonical components (cards, stat band, buttons, tables, tabs, forms, status, progress, masthead) → re‑verify → commit. Batch order in the plan §3.4. Keep the "no page‑local title/hero duplicating the masthead" guard.

**Custom body, shared frame:** leave the unique interaction cores custom (Smart Calendar grid, Table Layout/seating, Vendor Comparison matrix, Vision Board palette), but put their header, toolbar, cards, buttons, stats, badges, and empty states on the shared systems. `cvp-*` print templates stay separate (token‑consistent only).

## Already done (don't redo)

- Gutter token consolidated (`--planner-page-gutter`, applied via `#main`).
- Dashboard fully rebuilt (split keepsake hero, hairline cards, centered stat cards) — use it as the reference implementation.
- Read‑only preview headers merged into the table toolbar via `cwpMergeReadOnlyHeaders()` (Prayer, Counseling, Vendors, Tasks, Guests, Payments, Party, Contracts, Rentals, Appointments).
- UI/UX System page put on the shared masthead + gutter; documents tokens, dark mode, and the "Shared systems" architecture.
- Duplicate‑header concern investigated — not a live defect (masthead is the single title); keep the guard only.
