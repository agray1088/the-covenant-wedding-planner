# Strategy Report Roadmap — Complete (Phases 0–5)

**Status:** Phases 0–5 shipped in this developer build (2026-07-09).  
**Source plan:** `../Strategy Report Roadmap.md`

## Page count freeze (Phase 5 restraint)

The planner has **33 primary destination panels** plus **`#panel-data-hub`** as a documented **34th panel** (`index.html`). The original freeze counted 33 panels; the Data Hub is an **approved exception** — unification (moving full tables off cluttered minimal pages), not nav sprawl.

Per Part IV §8 (*Discipline of restraint*):

- **Do not add further destination pages** without explicit product approval.
- Highest leverage is **subtraction + unification**, not breadth.
- Refine existing panels: copy, craft, progressive disclosure, CWP tables, dashboard cards — not new nav sprawl.
- Treat **“no / not yet”** as a feature.

**Data Hub exception (2026-07):** One omnichannel hub (`#panel-data-hub`) hosts People, Finances, and Catering CWP tables. Minimal pages (Guest List, Budget, Catering & Menu) keep stats and previews; full tables and bulk edit live in the hub. Entry: Start Planning category, top bar, Dashboard card, page deep-links, ⌘K.

Enforcement:

- Code comment above `NAV_CATEGORIES` in `js/planner.js`.
- `#nav-category-bar` menubar structure is preserved; Data Hub is registered under **Start Planning** only (no new top-level category).

## What “complete” means

All Strategy Report items mapped to Phases 0–5 in the roadmap are **implemented** (2026-07-09 completion sprint). Part V (Going Online — accounts, email sending, cloud collab) remains out of scope by design.

## CWP vs legacy-bulk table matrix (Phase 0b)

**Primary path — CWP engine** (`cwpRenderTable` + in-table bulk bar):  
`guests`, `vendors`, `tasks`, `payments`, `appointments`, `essentials`, `counseling`, `party`, `gifts`, `shotlist`, `videoShots`, `prayer`, `contracts`, `rentals`, `menu`, `beverages`, `kidsMenu`, `placeSettings`, `cateringRentals`, `snacks`, `vendorMeals`, `wdayTimeline`, `notesDetails`, `entertainment`, ceremony CWP mounts, and other `#cwp-*` mounts in `index.html`. Catering and guest full tables also render into `#cwp-data-hub-active` when the Data Hub owns them.

**Legacy-bulk path** (`decorateBulk` + `BULK_TABLES` tbody):  
Used only when a panel still renders into legacy `<tbody id="*-body">` without a CWP mount. Current fallbacks: `guest-body`, `payment-body` (hidden when CWP active), `plan-body` (planning timeline spreadsheet), and legacy branches inside `renderTimeline` / catering renderers when `#cwp-*` mount is absent.

`decorateBulk()` early return **removed** — legacy bulk bars render again for non-CWP tables.

## After this roadmap

Future work should be **depth and polish** on existing surfaces: regression QA, craft passes, copy, backup trust, and CWP parity — not new panel count.
