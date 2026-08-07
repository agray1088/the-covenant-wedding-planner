# Covenant Wedding Planner — Redesign handoff

For Claude Code. Everything needed to replace the current planner design.

**Source of truth for visuals:** `screenshots/` in this folder, and the design documents
listed under *Authoritative references* below. Where this README and a screenshot
disagree, **the screenshot wins** — it was produced from the design document itself.

---

## 1. What is in this folder

```
redesign/
├── README.md                   ← you are here
├── pages/                      ← FOUR PAGE SHELLS, built on the CSS below
├── covenant-design-spec.md     ← THE SYSTEM, in markdown. Read this second.
├── class-map.md                ← planner class → redesign class, per phase
├── redesign-tokens.css         ← colour, type, spacing, radius, shadow · light + dark
├── redesign-components.css     ← pills, buttons, fields, panels, tables, stats, chips, drawer, modal
├── redesign-shell.css          ← top bar, tabs, sub-nav, 224px rail, page header, footer, gear menu
├── redesign-layouts.css        ← §07 page anatomy, 4 priority pages, floor plan, print
├── component-gallery.html      ← every component, light + dark, standalone. Open it.
└── screenshots/                ← authoritative PNGs to verify against
```

Load order — this matters, the redesign files are overrides:

```html
<link rel="stylesheet" href="css/planner.css">
<link rel="stylesheet" href="redesign/redesign-tokens.css">
<link rel="stylesheet" href="redesign/redesign-components.css">
<link rel="stylesheet" href="redesign/redesign-shell.css">
<link rel="stylesheet" href="redesign/redesign-layouts.css">
```

No JS ships with the redesign. Three behaviours need wiring and are noted in §5.

---

## 2. Do this first — the 20-minute win

The planner **already has a semantic token layer** (`css/planner-tokens.css`).
`redesign-tokens.css` redefines the same property names. So:

1. Add `redesign-tokens.css` after `planner.css`.
2. Change nothing else.
3. Look at the app.

Roughly 60% of the visual change lands with **zero markup edits** — surfaces, text
colours, borders, all five status schemes, spacing scale, square corners, control
heights, flat 24px gutters. Do this before anything else: it tells you how much of the
existing CSS is token-driven and how much is hard-coded hex, which sizes the real job.

Then add `redesign-components.css` — still no markup edits, because it re-selects the
planner's own class names (`.status-pill`, `.ued-btn`, `.cwp-table`, `.record-editor-*`,
`.ued-panel`, `.ued-band`, `.m-mast`). See `class-map.md` Phase 2 for the full list.

`redesign-shell.css` and `redesign-layouts.css` are the parts that **do** need new
markup, because they change information architecture, not paint. See `class-map.md`
Phase 3.

---

## 3. The system in one screen

| | |
|---|---|
| **Frame** | 1440px reference. Top bar 52 · tabs 46 · sub-nav 40 · rail 224 · drawer 360 · gutters 24 |
| **Type** | Inter for everything functional; Cormorant Garamond for brand chrome and Class B keepsakes only |
| **Page title** | 20px/600 — not 67px display |
| **Eyebrow** | 10px/700, .16em, uppercase, `--text-subtle` |
| **Table row** | 36px default (30 compact / 44 tall), 13px text, hairline separators, no zebra |
| **Table header** | `--table-header-bg` with a 1px `--table-header-rule` beneath. Sticky |
| **Radius** | 0 everywhere. Circles only for avatars and floor-plan tables |
| **Shadow** | None, except popovers and the full-editor modal. The drawer uses a border |
| **Primary action** | Exactly one per view, forest fill. Never gold |
| **Icons** | Top-bar utilities, toolbar affordances, drawer close, inline add rows, empty states. **Never** in stat strips, table headers, table cells, or beside a button label |
| **Colour** | Max 2 background tones per page. Gold on forest surfaces only, never gold on white |

### Non-negotiables that are easy to break
- **Progress tracks carry `overflow: hidden`** and fills cap at 100%. Over-target reads
  as a red fill at 100% plus the negative variance figure — never a >100% width.
- **A filter chip must describe the rows actually rendered.** Active (forest border + ✕)
  means the table IS filtered. If the full table is shown, every chip renders inactive.
- **One Columns chip per toolbar, and it states its count** (`Columns · 8 of 12`).
  A bare "Columns" beside a counted one is a bug, not a variant.
- **Column controls live in a toolbar, never in a section header.** A tab bar is
  navigation, so a tab-bar page still needs a toolbar beneath it.
- **Never pin a page height.** Content-sized shells only; a fixed height silently crops
  the last section.
- **The name column keeps ≥240px** after rail and drawer are subtracted. Trim the default
  column set rather than squeezing names; the rest live in the drawer.

---

## 4. Page shells — `pages/`

**All 38 pages of the planner**, built on the redesign CSS. Open `pages/index.html` for a
grouped index. They are **shells, not finished pages**, and that is deliberate: the planner
renders its own tables and stats with JavaScript, so the markup that matters is the frame
around the mount points.

| Tab | Pages |
|---|---|
| Overview | dashboard · notes |
| Planning | tasks · calendar · appointments · logistics |
| People | guests · households† · contacts† · party · tables · gifts |
| Money | budget · payments · contracts |
| Vendors | vendors · catering · entertainment · shotlist |
| The Day | timeline · ceremony · honeymoon |
| Covenant | vision · prayer · counseling · firstmonth · homecoming |
| Documents | mood · essentials · packets · emails · print-centre† · data-hub |
| No tab | history · setup · instructions · guide · faq |

† New pages, approved for build — no existing markup to migrate.

**Start with these four**, in this order. Each teaches you something the next needs:
`tasks` (the template every table page follows) → `guests` (24 fields, proves the
column-budget rule) → `dashboard` (no table, no drawer) → `data-hub` (every column raw,
the hardest layout).

### What is preserved from `index.html`
This is what makes them pluggable rather than a rewrite:

- **Every panel id** — `id="panel-tasks"`, `id="panel-guests"`, `id="panel-data-hub"` …
  so `showPanel()` still finds them.
- **Every JS mount-point id** — `#task-stats`, `#tasks-hub-preview`, `#guest-stats`,
  `#cwp-menu`, `#cwp-wdayTimeline`, `#data-hub-table-mount`, `#setup-checklist`, and the
  rest. Each is commented `<!-- JS mount: … Do not rename. -->`.
- **Every `onclick` handler name**, unchanged: `addTaskRow()`, `saveGuestCosts()`,
  `exportSectionCSV(...)`, `showPanel(...)`, `openDataHub()`, `downloadBackup()`.
- **Legacy classes as second class names** — `class="rd-stats m-stats"`,
  `class="rd-panel m-block"`, `class="rd-table-wrap ued-table-wrap"`. Anything querying the
  old name still finds the element; the new name does the styling.

### What changed structurally
- The 11-category menubar becomes `.rd-tabs` + `.rd-subnav`.
- `#planner-context-sidebar` becomes `.rd-rail` — saved views and live meters, not repeated
  page stats.
- The display-size title block becomes `.rd-pagehead`, which also absorbs the `.m-actions`
  row. **One primary button per page**, always last.
- Filter controls move into `.rd-toolbar`, which also carries the three column controls.
- **Five pages have no tab lit** — history, setup, instructions, guide, faq. They use
  `.rd-subnav--context` instead of a sub-nav, showing where you came from. A log is
  somewhere you are *sent*, not somewhere you browse to.
- **Covenant pages** carry `.rd-main--keepsake` — serif work surface, Class B print.

### `autofit-columns.js` — written, not a TODO
The per-table replacement for the app's global `autoFitActivePanelTables()`. It finds the
first table after the calling toolbar **within the same `.rd-main`**, measures each column
against its widest rendered cell, and honours the §08 name-column floor of 240px. It does
not persist — it writes the same widths a drag would write. No dependencies; already wired
into all 38 shells, and you can fold it into `planner.js` if you prefer.

### Tab states — `pages/tab-states.html`

Fifteen pages in the app carry a tab bar **inside** the page. All of those states are
built: **57 files across 13 groups**, one per state, indexed at `pages/tab-states.html`.

Each carries the app's own `data-tab` values and handler names — `cerTab`, `hmTab`,
`entTab`, `visionTab`, `vndTab`, `shotlistTab` — so the existing JavaScript works
untouched. The app's `.m-tab` / `.on` classes ride along beside the new ones.

| Page | States | Treatment |
|---|---|---|
| Ceremony &amp; Reception | 9 | tab strip |
| Honeymoon &amp; After | 7 | tab strip |
| Entertainment | 5 | tab strip |
| Vision Board | 5 | tab strip; gallery categories became chips |
| Venue &amp; Vendors | 2 | tab strip — record surface vs decision surface |
| Shot Lists | 2 | **two levels** — supplier, then list |
| Share Packets | 4 | **two levels** — packet, then chapter |
| Weekend Logistics | 4 | tab strip — days do not overlap |
| Database Hub | 4 of 24 | the only strip allowed to scroll |
| Email Templates | 3 | tab strip; audience became chips |
| **Gifts** | 7 | **was tabs → two labelled chip groups** |
| **Smart Calendar** | 3 | **was tabs → view switcher** |
| **Wedding Day Timeline** | 2 | **was tabs → view switcher** |

**Three of the fifteen did not need a tab strip.** A tab promises different content; those
three promised the same content, filtered or redrawn. The four tests that decide this are
§07b of the spec, and every case is drawn in `Planner Sub-Tabs.dc.html`.

Gifts is worth a look: its seven tabs mixed **two axes** — gift type and thank-you status.
A gift can be both Registry and Pending, so one row of seven implied a falsehood. It is now
two labelled chip groups.

**Catering is the counter-case.** Nine sections, more than Ceremony, and deliberately no
tabs — all nine read the same headcount, so tabs would hide eight of the nine consequences
of changing one RSVP. Tabs are for sections that are independent; stacking is for sections
that are one argument.

### Opening them
The `<script>` tags point at `../../js/planner.js`, which resolves once this folder sits
inside the planner root. **Opened from anywhere else they 404 and the pages render empty
below the toolbar** — expected, not a bug.

## 5. Migration order

Build in this order. Each one teaches you something the next needs.

1. **Timeline & Tasks** — the archetype. Grouped table, collapsible group rows, bulk bar,
   drawer. Get this right and 25 pages follow mechanically.
2. **Guest List** — 6 of 24 columns on screen, 18 in the drawer; the full-editor pop-out;
   the RSVP pill as an interactive control. Proves the column budget and the editor pair.
3. **Dashboard** — the only card page. 12-column grid, no drawer. Proves the system does
   not force a table where a table is wrong.
4. **Data Hub** — raw view: all 24 columns, pinned checkbox + id, horizontal scroll inside
   the pane only, integrity strip. Proves the escape hatch still feels first-class.

Then: Budget → Payments → Contracts (money derivations), Table Layout (floor plan),
Catering & Menu (nine sections), then the remaining pages in any order.

---

## 6. Behaviour that needs JS

Only three things, and all three are already stubbed in the design:

1. **Auto-fit columns** — sizes each column to its widest rendered cell, capped so the
   name column keeps its 240px floor. It is an *action*: no chevron, no active state,
   does not persist. The planner's existing `autoFitActivePanelTables()` does most of
   this; scope it to the table whose toolbar was clicked instead of "the active panel".
2. **Row height** — three states (compact 30 / default 36 / tall 44). Persists per table
   per profile, like column widths. Swap `.rd-table--compact` / `--tall`.
3. **Gear menu** — theme, font, display size, Preview Mode, focus presets, keyboard
   shortcuts, link out to backup. These are *viewer preferences*: they change nothing
   another person would see in a share packet, which is why they are not on a page.

Everything else in the redesign is CSS.

---

## 7. Verifying your work

Two standalone gallery files. Both load the four CSS files directly, so if a gallery
looks right, the files are right.

- `component-gallery.html` — light. Also captured as `screenshots/component-gallery-light.png`.
- `component-gallery-dark.html` — dark. **Open this one in a browser rather than looking
  for a PNG.** My screenshot pipeline strips the theme hook when it clones the DOM, so
  every dark capture came back rendering light. Rather than ship a PNG that lies, there
  isn't one. The dark values themselves are unambiguous — they are literal hex in
  `redesign-tokens.css`, and the dark file applies them directly on `:root`.
- For dark-mode *pages* (not components), `Planner Screens Dark` has all 44 screens and
  renders correctly.

**Verify dark mode like this** — open `component-gallery-dark.html` and check these six.
If they match, the ramp is applied correctly:

| Element | Expected |
|---|---|
| page background | `#141414` |
| work surface / table background | `#1A1A1A` |
| top bar | `#16241E` — forest, not grey |
| table header | `#1D2F27` with a `#6B5738` rule beneath |
| page title, stat value, drawer title | `#EDE8DE` — **not** `#16241E` |
| green status pill | `rgba(111,156,128,.14)` fill, `#8FB99F` text |

That fifth row is the one to check first. `--forest-deep` is a *surface* token: in light
mode it is both the table-header background and a heading colour, and if you reuse it
for headings in dark mode every page title goes near-black on near-black. That is why
`--text-heading` exists. I made exactly this mistake while building the gallery.

---

## 8. Authoritative references

These are design documents, not code. Open them for intent and for any screen not
covered by a screenshot.

| File | What it is |
|---|---|
| `covenant-design-spec.md` | **In this folder.** The whole system as markdown: every token paired light/dark, page anatomy, table rules, print classes, the data contract, the page inventory, and §10 — every deliberate divergence from the current app with the reasoning. Start here after this README |
| `Covenant Design Spec.dc.html` | The same system, drawn. Open it when you need to see a component rather than read about it |
| `Planner Screens All` | All 44 screens, light mode, newest batch first |
| `Planner Screens Dark` | The same 44 on the dark ramp |
| `Planner Prototype` | Six pages built as working software on one shared store — Guest List → Table Layout → Catering, and Budget → Payments → Contracts. Open this to see which numbers are derived from which; it is the only place the wiring is real |
| `spec-update-notes.md` | Change log, and the traps I hit so you do not repeat them |

---

## 9. Things you should push back on

I would rather you question these than implement them silently.

- **Households, Contacts and Print Centre do not exist in the current app.** You approved
  all three for build. They are additions to scope — there is no existing markup to
  migrate, and nothing in the planner is being replaced by them. Marked with † in the
  page inventory of both specs and in `class-map.md`.
- **`autoFitActivePanelTables()` in the top bar is removed, not moved.** A global button
  that means "the table I think you mean" misfires on the pages that carry two or three
  tables. If you disagree, §10 of the spec has the argument.
- **The 24-field guest record is the hardest thing here.** The drawer tabs by field group
  and a pop-out shows everything at once. If that pairing does not survive contact with
  the real data, tell me rather than cramming 24 fields into 360px.
- **Base64 @font-face faces in `planner.css`** are cut for Lato and Lora. They need
  re-cutting for Inter and Cormorant Garamond or the app loses its fonts offline.
