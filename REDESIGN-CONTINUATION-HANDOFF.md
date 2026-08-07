# Covenant Redesign — Continuation Handoff

**Written:** 2 August 2026
**Supersedes nothing.** Read alongside `HANDOFF-TO-CLAUDE-CODE.md`, which is still binding.
This file records what has been done, what was learned, and what remains.

Run from `01 Developer Editable Version/`.

---

## 0 · The two rules still hold

1. **`Redesign/` is the single source of truth for everything visual.** If the planner
   disagrees, `Redesign/` wins. Do not preserve or merge earlier styling work.
2. **Visual redesign only — behaviour must not change.** Same saving, filters, sorting,
   bulk actions, pagination, add/edit/delete, imports/exports, calculations, presets,
   dark-mode toggle, profiles, backups.

### The six authoritative files
The user has confirmed these are the deliverable and must be matched strictly:

```
Redesign/Covenant Design Spec.dc.html      every measurable value + component drawings
Redesign/covenant-design-spec.md           meaning, rules, rationale (no hex, no px by design)
Redesign/component-gallery.html            every component, light
Redesign/component-gallery-dark.html       every component, dark
Redesign/Planner Screens All.dc.html       44 screens, light — THE TARGET
Redesign/Planner Screens Dark.dc.html      the same 44, dark — THE TARGET
```

**Precedence, from spec §14:** *"If the gallery and the screens disagree, the gallery is
wrong — the screens are the deliverable, the gallery is documentation of them."*
So: **screens > gallery > CSS package > markdown prose.**

### And one more, discovered mid-build
```
Redesign/pages/            38 finished page shells + index.html + tab-states.html (97 files)
Redesign/autofit-columns.js
```
`Redesign/pages/` is the **built markup** for every page, on the redesign CSS, deliberately
structured so planner.js still works: it preserves panel ids, JS mount-point ids, and
`onclick` handler names, and keeps legacy classes alongside new ones
(`class="rd-stats m-stats"`). **This is the primary source for all remaining page work.**

Note: every shell loads **only** the four redesign CSS files. **Zero** load `planner.css`.
They are a replacement for the old design, not a layer over it.

---

## 1 · Architecture decision (approved by the user)

The shells are 38 separate HTML documents; the planner is a single-page app where
`showPanel()` toggles 35 panels inside one `index.html`.

**Decision: harvest into the SPA.** Build the shared chrome once, and port each shell's
`<main>` block in as that panel's contents.

**Why, decisively:** the product ships as one self-contained file
(`02 Customer Download Version/The Covenant Wedding Planner - Customer Download.html`,
5.5 MB). A customer downloads one file and opens it offline. Thirty-eight separate HTML
files cannot ship that way. Multi-page is not a tradeoff here — it is incompatible with
how the product is delivered.

### Also approved by the user
| Surface | Plan |
|---|---|
| Modals | Redesign on `--shadow-modal`, radius 0, forest primary |
| First-run wizard | Redesign |
| Command palette | Redesign (the ⌘K search in the shell's top bar) |
| Record editors | Not separate — they become the 360px right-hand drawer plus the 1140px full-editor pop-out, per §11/§16 and the drawn screens |
| Print keepsakes | Move to the Print Centre page, sorted by print class |
| Net-new pages | **Anything in the new design that is not in the original planner must be created.** |

`planner.css` is therefore retired progressively — nothing stays on the legacy design.
Pull it out area by area and verify after each, so the app never sits broken.

---

## 2 · What has been done

### Step 0 — superseded Material Design 3 work removed
Deleted, with their three wiring lines in `index.html`:
- `css/planner-inline-editor-color.css`
- `js/planner-inline-editor-color.js`
- `js/planner-table-status-pills.js`

Both scripts were pure DOM decorators (they only added classes/attributes), so nothing
functional went with them. Copies remain in `Redesign/baseline/` — **read-only; never
restore from it**, it is a *before* snapshot containing the obsolete design.

Also deleted (user-approved): the nested byte-identical `Redesign/redesign/` duplicate.

### Step 1 — token drop, and what it measured
`Redesign/redesign-tokens.css` loaded after every legacy sheet.

**Result: 9 of 29 measured properties landed (31%)** — not the ~60% the README estimated.

Landed: page background, flat 24px gutters, input/select/table radius 0, progress track
4px + radius 0 + `overflow:hidden`, table header size.

Did not land: page title (38px Cormorant → wanted 20px Inter), table rows 121px, panel and
button radius 8px, control heights, table header colour, hairlines.

**Only 44 of the 101 redesign tokens are referenced by any legacy rule.** The other 57 —
including `--component-table-row-height`, `--font-ui`, `--text-heading`, every type token
and every shadow token — are inert until CSS is written that reads them.

### Step 2 — components, pills, and the schemes
- Created `css/redesign-overrides.css` (~32 KB). Implementation glue, not design: it
  re-states redesign declarations at a specificity that beats
  `body.editorial-v4 #main .panel` chains, using the doubled-id prefix `#main#main`.
  **Every value is a token. No hex is authored in that file.**
- Created `js/planner-pill-scheme.js` implementing `pillSchemeFor()` — which planner.js
  calls in 8 places and **never defines in this build**, so pills silently fell back to
  neutral. Written fresh from the §02 semantics table; the deleted M3 script was *not*
  resurrected (its semantics were wrong — it mapped blue→"in progress", red→"declined").
- The same file tags the planner's legacy wrappers with `data-pillscheme`, because
  `taskStatusSelect()` emits `<span class="task-status-wrap">` directly and never calls
  `pillSchemeFor`. Without it, neutralising the wrappers left **zero** pills on Tasks.

**Verified against `component-gallery.html` hex-for-hex, light and dark:**

| Scheme | Light | Dark |
|---|---|---|
| green | `#EEF6F0 / #2F6B45 / #CFE3D5` | `rgba(111,156,128,.14) / #8FB99F` |
| gold | `#FFF7DF / #8A640F / #E7CE80` | `rgba(201,162,74,.12) / #CBAB6B` |
| gray | `#EEF1F2 / #626D74 / #DDE3E4` | `rgba(160,170,175,.12) / #A6B0B5` |
| red | `#FBEEEC / #9C3B34 / #ECCFC9` | `rgba(190,90,80,.14) / #D98A80` |
| blue | `#E9EEF8 / #4A5691 / #CFD8EF` | `rgba(120,140,200,.14) / #9AA8DC` |

### Step 3a — the shared shell
Created `js/redesign-shell.js`. It builds the redesign chrome and **relocates** the
planner's existing live controls into it.

**Relocate, do not re-author.** 18 top-bar ids are load-bearing in planner.js
(`#last-saved`, `#gs-input`, `#gs-results`, `#topbar-notifications-*`, `#quick-jump-drop`,
`#csv-export-select`, `#print-target-select`, `#heroPhotoInput`, `#undo-btn`, `#redo-btn`,
`#profile-drawer-btn`, `#save-btn`, `#dark-mode-btn`, …). `appendChild` **moves** a node
and keeps its listeners, so every handler and every `getElementById` still resolves.
Nothing is retyped, so nothing can be mistyped. **Keep using this technique.**

Verified 13/13 at 1440px:

| | Measured | Target |
|---|---|---|
| top bar / tabs / sub-nav | 52 / 46 / 40 | 52 / 46 / 40 |
| rail width | 224 | 224 |
| top bar · tabs · sub-nav bg | `#2D4A3E` · `#FDFCFA` · `#F9F7F4` | same |
| rail bg | `#F9F5EF` | `--surface-sunken` |
| page gutter | 24px | 24px |
| legacy top bar + category menubar | 0px | retired |
| tab count / active sync | 8 / tracks `showPanel()` | 8 |

Dark shell exact: top bar `#16241E`, page `#141414`, rail `#1C1C1C`.

§10 applied — the twelve gold buttons are gone. Undo/redo and the bell sit in the bar, the
⌘K search holds the real `#gs-input`, and 14 controls moved behind the gear as §17 viewer
preferences. The rail keeps its live data with the duplicated page stats, keyboard
shortcuts (→ gear) and ALL PAGES tree (→ tabs) dropped, per class-map Phase 3 and §10.

### planner.js edits (user-approved, two places only)
`planner.js:2711` — `DEFAULT_THEME` now authors the redesign's exact primitives
(`--forest-lt:#4A6B5C`, `--forest-deep:#20362D`, `--charcoal:#23211C`).

`planner.js:3004` — `applyThemeVarsToRoot()` uses the authored deep shades when the theme
keeps the Covenant forest, and still derives via `darkenHex()` for any theme that changes
`--forest`. Verified: Covenant → `#20362D`, Burgundy → `#62242F`.

**Why this was necessary:** planner.js writes ten brand primitives as *inline styles with
`!important`* on `<html>` and `<body>`. Inline + important beats every stylesheet, so
`redesign-tokens.css` could never win. Two of them (`--forest-deep`, `--forest-deeper`)
were *computed* by `darkenHex()`, producing `#243B32` instead of the authored `#20362D`.

### `planner-dark-editorial.css` retired (user-approved)
3,908 lines, 1,034 `!important`, a deliberate **greyscale** dark theme on a private
`--dm-*` namespace — its own comment reads *"Status — greyscale only (no green/blue/amber
chrome)."* The redesign's dark mode is coloured. Before retirement, **0 of 6** dark
spot-checks passed, and injecting the full dark ramp with `!important` moved **none** of
them, because the colours were literal hex on the elements. Unlinked from `index.html`;
file kept on disk for reference.

---

## 3 · Findings that will cost you hours if you don't know them

1. **`[hidden]` does not hide anything here.** It is a UA-level `display:none`, and
   planner.css's `display:flex` on `#topbar` / `#nav-category-bar` beats it. State it as an
   author rule.
2. **`html { font-size: 106.25% }`** in planner.css makes every `rem` render 6.25% large —
   13px arrived as 13.94px. The redesign type scale is px, so this resolves as components
   migrate, but any legacy rem rule left behind is wrong.
3. **58 `!important` custom-property declarations** in the legacy CSS beat the redesign
   tokens (46 in the retired dark sheet, 12 in planner.css).
4. **Table rows are not a padding problem.** The task-name cell holds an auto-growing
   `<textarea class="cell-ta">`, which is what made rows 121px.
5. **`data-active-panel` on `<body>`** is the reliable signal for which panel is showing.
   `js/redesign-shell.js` observes it to sync tabs and sub-nav.
6. **Measure, don't screenshot.** The preview pane composites dimmed and at reduced size,
   which has produced wrong conclusions repeatedly. Use `getComputedStyle` and
   `getBoundingClientRect`, and open the target screen in a second tab to diff against.
7. **Resize the viewport to 1440** before measuring. Below ~1000px the app switches to
   `layout-tablet` and adds an icon rail that is not in the redesign.

### Corrections already made by measuring the screens
These were wrong when derived from the token file or README prose alone:

| Thing | Wrong assumption | What the screens show |
|---|---|---|
| Cell padding | 6px 12px, forced to exactly 36px rows | **`9px 12px`**, row sizes to content — 35px text, 40px with a pill. Screens never pin 36px. Matches `redesign-components.css:271`. |
| Pills in cells | compact (11px, `1px 6px`) | **default** (12px, `2px 8px`). §14: compact only in compact-row tables. |
| Priority column | a pill (High→red, Medium→gold) | **plain 13px `--text-muted` text.** Only Status is a pill in screen 9a. |
| Group row | tinted `--surface-sunken` | **transparent**, 27px, `7px 12px`, 10px/700/.14em |
| Sub-nav bg | `--surface-sunken` (per redesign-shell.css) | **`--surface-canvas`** `#F9F7F4` |
| Page header actions | six buttons, wrapped | **four**, in §12 order |

Blue was swept across all 44 screens to confirm §02: it appears only as `4 guests`,
`Planner`, `$1,840`, `20 Aug · 4:00pm` — counts, roles, quantities. **Never a lifecycle
state.**

---

## 4b · Tasks = page template for ALL future redesign pages

**Remember this for every subsequent page/sub-tab.** Planning → **Timeline & Tasks**
(screen **9a**) is the canonical page shell. Do not invent new shell chrome.

### Pattern (reuse on every page)
| Piece | Spec | Live reference | Notes |
|---|---|---|---|
| **Left rail · 224px** | Design Spec **§14** “Rail · 224px”; Views / phases / group | `js/planner-context-sidebar.js` → `buildTasksContext`, `CONTEXT_BUILDERS` | Per-page builder; counts + meters; square rail items |
| **Full pop-out editor · ~1140px** | **§16** Full editor; multi-column forest shell | `js/redesign-shell.js` full-editor path / `openRecordEditor` | Hand off from drawer; not a one-off centered form |
| **Record editor / row drawer · 360px** | **§11**, **§14** “Row drawer · 360px” | `#record-drawer`, `#task-drawer-slot`, `openDrawer` in `redesign-shell.js` | Tabbed drawer **beside** the table surface — not a random modal that breaks Tasks UX |
| **Page shell chrome** | **§07** anatomy, **§12** header actions | `#panel-tasks` in `index.html`: `.rd-page` → pagehead → meta/scripture → stats → toolbar → bulk → surface | Eye brow + title + actions; stats where relevant; toolbar filters; bulk when multi-select |
| **Visual posture** | Visual Directions **1b** (Airtable/Notion warm neutrals), **2a** Notion-like tables; tokens `--radius-*: 0`; Inter UI | `css/redesign-overrides.css` Tasks block; `Redesign/redesign-*.css` | Warm neutrals; square radius; do **not** regress Tasks behaviour |

### Source-of-truth files (precedence)
1. `Redesign/Planner Screens All.dc.html` — especially **screen 9a** (Tasks archetype)
2. `Redesign/Covenant Design Spec.dc.html` — §07 · §08 · §11 · §12 · §14 · §16
3. `Redesign/Planner Visual Directions.dc.html` — **1b**, **2a**
4. `Redesign/pages/tasks.html` — harvested markup ids
5. Live: `index.html` `#panel-tasks`, `js/planner-context-sidebar.js`, `js/redesign-shell.js`, `css/redesign-overrides.css`

### Planning tab order (sub-nav)
`Timeline & Tasks` → **Smart Calendar** → `Appointments` → `Weekend Logistics`  
(`js/redesign-shell.js` `TABS.planning`).

### Calendar exception (document, don't fight it)
Smart Calendar is a **view surface** of aggregated dating sources, not a CWP multi-select table. It follows Tasks for **pagehead / stats / toolbar+viewswitch / 224 rail**; create/edit stays the multi-source **`#smart-create-modal`** (write into the chosen source page), not the 360 drawer. Rows that belong to Tasks/Appointments still own those pages' drawer/full-editor patterns on their home pages.

### Residual-bucket convention (table row grouping)

When a page groups table rows (header bar spanning all columns → data rows → next header), undated / unattached rows **must not** sort among real date-or-place buckets. They form a **residual** group that is **always last**, with a summary that states **why** (never only the count).

**CWP hooks** (shared engine, used by Appointments):
- `TABLES[key].rowGroup(r)` → `{ key, residual, sort, title, why?, … }`
- `TABLES[key].groupHeader(meta, groupRows)` → label string
- Header row: `<tr class="is-group">` or `is-group is-group--residual` with `colspan` across all columns

| Page | Residual name | Summary shape | Status |
|---|---|---|---|
| **Appointments** | **Held** | `Held · N appointments · no date set` | **Live** — Group by Month (default table view); months: `MonthName · N appointments` + `· 1 clash` / `· M clashes` when clash roll-up > 0. Rail Group by Vendor / Who attends also residual-last for empty vendor/who. |
| **Notes** | **Loose** | `Loose · N notes · not pinned to anything` | **Document only** until Notes table is redesigned. Shell already shows rail meter “Loose” and pagehead “Loose notes” (`Redesign/pages/notes.html`) — keep residual copy aligned when wiring group headers. Do not invent alternate residual names. |
| **Entertainment** | **Unplaced** | `Unplaced · N … · [why not placed]` (e.g. not assigned a moment / not on a playlist) | **Document only** until Entertainment list grouping is built. Shell rail already has “Unplaced” view/meter — carry through as residual header wording, not as a fifth pseudo-moment. |

**Rules for any future grouped table**
1. Partition: real key buckets first (chronological / alpha as appropriate).
2. Residual last, always — never interleaved with month/vendor/moment keys.
3. Residual summary includes the **why** clause after the count.
4. Residual header styling is muted / distinct (`.is-group--residual`) so it does not read as another normal group.
5. Rail meters or view chips may use the same residual name (Loose / Unplaced / Held) for consistency.

Live implementation reference: `js/planner.js` `apptRowGroupMeta` / `apptGroupHeaderLabel` / CWP `applyRowGroups`; CSS under `#panel-appointments … tr.is-group` in `css/redesign-overrides.css` (cache `redesign-step10b`).

---

## 4 · File inventory


### Created
| File | Purpose |
|---|---|
| `css/redesign-overrides.css` | Specificity glue. Tokens only, no authored hex. |
| `js/planner-pill-scheme.js` | `pillSchemeFor()` + tags legacy wrappers with `data-pillscheme` |
| `js/redesign-shell.js` | Builds the shell, relocates live controls, syncs tabs/sub-nav |
| `.claude/launch.json` (repo root) | `py -m http.server 8000 --directory "01 Developer Editable Version"` |

### Modified
| File | Change |
|---|---|
| `index.html` | Removed 3 M3 wiring lines; unlinked `planner-dark-editorial.css`; added 4 redesign sheets + overrides; added pill-scheme, autofit and shell scripts |
| `js/planner.js` | Two edits only, lines 2711 and 3004 (above) |

### Current load order in `index.html`
```html
<!-- legacy, being retired progressively -->
css/planner-tokens.css → planner-components.css → phase2/3/4-roadmap.css
→ planner.css → planner-shell.css → phase-data-hub.css → phase-record-cards.css
→ phase-guest-insight-cards.css → planner-context-sidebar.css
→ planner-page-gutters.css → planner-spacing-premium.css

<!-- the redesign, last so it wins -->
Redesign/redesign-tokens.css
Redesign/redesign-components.css
Redesign/redesign-shell.css
Redesign/redesign-layouts.css
css/redesign-overrides.css
```
```html
<!-- scripts -->
js/planner-pill-scheme.js
Redesign/autofit-columns.js
js/planner.js
js/redesign-shell.js        <!-- must be AFTER planner.js so handlers exist -->
```
All carry `?v=redesign-step3c`. **Bump that string on every change** — the browser caches
hard and you will otherwise debug a stale file.

---

## 5 · What remains

Ordered. Each item states its source and its acceptance test.

### 5.1 · Tasks page body — the archetype (SHIPPED as template; keep green)

**Template live in app:** `#panel-tasks` with rail (`buildTasksContext`), 360 drawer
(`#task-drawer-slot` + `#record-drawer`), §16 full editor, pagehead/stats/toolbar/bulk/
surface. See **§4b** above — **all future pages follow this**.

Continue fidelity polish against screen **9a** only when touching Tasks; do not regress.

### 5.1b · Smart Calendar — next Planning sub-tab (shell parity · redesign-step8a)

**Source shells:** `Redesign/pages/calendar.html`, `calendar-month.html`, `calendar-week.html`,
`calendar-agenda.html`. Design posture: views 6a–6d family; Spec §07 / §14 rail; Visual
Directions 1b.

**Done this pass:**
- `#panel-calendar` harvested into `.rd-page` + pagehead + stats + toolbar + viewswitch + surface
- Calendar left rail: Shows (source filter) · This month meters · View (Month/Week/Agenda)
- Preserved: `renderSmartCalendar`, month/week/agenda, create modal, ICS export, filter mounts
- Cache-bust `?v=redesign-step8a` on changed assets

**Still open / later polish:**
- Pixel fidelity of day cells / agenda list vs drawn screens
- Insight band density
- Optional: route editable task/appointment clicks into home-page drawer when practical
  (default remains `openSmartCalendarEditor` modal for multi-source safety)
- Dark-mode spot-check on calendar grid

**Acceptance for this slice:** Planning → Smart Calendar looks redesign-complete enough
for chrome (header, rail, surface, modes); Tasks still loads and drawer works.

### 5.2 · The remaining pages
Same treatment as Tasks/Calendar, priority after Planning:
**Appointments → Weekend Logistics**, then Guest List → Dashboard → Data Hub, then
Budget → Payments → Contracts → Table Layout → Catering & Menu, then the rest.

Each has a shell in `Redesign/pages/`. Map by panel id — the filenames match
(`guests.html` → `#panel-guests`).

Watch for: `venue` and `vendors` are two distinct app panels both titled "Venue & Vendors".
`reflect` renders empty. `ui-system` has no shell.

### 5.3 · Six net-new pages — the user has confirmed these must be built
Present in `Redesign/pages/` but **absent from the app**:
```
households    contacts    print-centre    vision    firstmonth    homecoming
```
These are additions to scope with no existing markup to migrate. `households` and
`contacts` are *derived views* over existing guest/vendor records — per the appendix data
contract, **a screen that computes its own total is a screen that will disagree**, so
derive, never store. `print-centre` collects the existing top-bar print dropdown by print
class. Add each to `TABS` in `js/redesign-shell.js` once its panel exists.

### 5.4 · Record editors → drawer + full-editor pop-out
**Source:** §11, §16, screen `Guest · full editor window`, and `.rd-drawer` in the shells.
The 360px right drawer tabs by field group; the 1140px pop-out shows everything at once.
Replaces `.record-editor-*`. The 24-field guest record is the hardest piece — README §8
says to push back rather than cram 24 fields into 360px if the pairing fails on real data.

### 5.5 · Modals, wizard, command palette
Per the user's approved table. The command palette should host the relocated
`#global-search` / `#gs-input` / `#gs-results`, which are already in the shell's search slot.

### 5.6 · Print Centre + print classes
§09: Class A working documents (black on white, hairlines, no gold, repeating header,
group rows repeat on carry-over pages); Class B keepsakes (Cormorant returns, open margins,
one gold hairline). **Print is always light.** Move the keepsake templates currently in
`mockups/` into the system.

### 5.7 · Icon sweep (§03b)
Currently hidden in stat strips and table headers. The ban is wider — **also**: table cells,
buttons that already carry a text label, tab and sub-nav items, rail rows, page titles.
Allowed: top-bar utilities, toolbar affordances, drawer close, inline add rows, empty states.

### 5.8 · Three behaviours needing JS (README §5)
1. **Auto-fit** — `Redesign/autofit-columns.js` is wired and defines `autoFitColumns(btn)`.
   The global top-bar `autoFitActivePanelTables()` is **removed, not moved** (§10). It
   currently still sits in the gear menu and should go once toolbars carry the chip.
2. **Row height** — compact 30 / default 36 / tall 44, persisted per table per profile.
   Swap `.rd-table--compact` / `--tall`. Not implemented.
3. **Gear menu** — exists and holds 14 relocated controls; needs the redesign's §17 layout,
   and its panel height capped at `calc(100% − 60px)` with scroll.

### 5.9 · Retire the legacy CSS
As each area lands, stop loading the sheet that owned it. Target: `index.html` loads only
the four redesign sheets. `planner.css` alone is 48,013 lines with 5,468 `!important`.

### 5.10 · Fonts
`planner.css` embeds base64 `@font-face` for Lato and Lora. The redesign needs **Inter** and
**Cormorant Garamond** re-cut, or the app loses its fonts offline (README §8). `index.html`
currently pulls both from Google Fonts, which fails offline — and offline is the product.

---

## 5A · Bulk bars — the rule and the register

**The rule, set by the user:** every bulk bar follows exactly what
`Planner Screens All.dc.html` draws for that page. Where a page has selectable
rows but the file draws no bar, the actions are agreed with the user and
recorded here. Do not invent one silently.

### What is systematic (all 23 drawn bars, without exception)
Background `#F4F1EA` · `gap: 14px` · leading `N selected` then two separators.
The bar is **one shared component with a per-page action list** — not a
per-page component.

Two conventions, splitting on the same batch boundary as the red pill (§8.7):

| | Padding | Height | Actions | Ends with |
|---|---|---|---|---|
| Newer batches | `9px 24px` | 34 | exactly 4 | **Clear selection** |
| Older batches (Tasks 9a, Budget 4a, Guest List 3b) | `8px 20–24px` | 32 | 5–7 | **Delete** |

`Database Hub · all tables` is a deliberate outlier — ten actions incl. Find and replace.

### Drawn (copy verbatim — do not redesign)
| Page | Actions |
|---|---|
| Planning Timeline & Tasks | Set owner · Set due date · Set status · Move phase · Delete |
| Guest List | Set RSVP · Set meal · Assign table · Mark invited · Add to event · Add to group · Delete |
| Budget | Set vendor · Set status · Move category · Mark paid · Link to payment · Delete |
| Table Layout | Move to a table · Seat together · Unseat · Print place cards · Clear selection |
| Gifts | Mark note sent · Draft notes · Assign writer · Print address labels · Clear selection |
| Shot Lists | Mark must-have · Set window · Assign supplier · Print call sheet · Clear selection |
| Contracts & Invoices | Attach document · Set reminder · Export as PDF · Print packet · Clear selection |
| Appointments | Reschedule · Confirm · Add travel time · Add to calendar · Clear selection |
| Wedding Party | Set attire status · Assign duty · Email selected · Print measurement sheet · Clear selection |
| Entertainment | Assign moment · Set performer · Mark must-play · Remove from list · Clear selection |
| Weekend Logistics | Assign owner · Change day · Add to timeline · Print brief · Clear selection |
| Ceremony & Reception | Assign person · Set duration · Move to reception · Print programme · Clear selection |
| Essentials Checklist | Mark packed · Assign to a person · Move to a kit · Set location · Print kit card · Clear selection |
| Newlywed Homecoming | Assign owner · Set due date · Mark done · Print the list · Clear selection |
| First-Month Rhythms | Change cadence · Assign owner · Pause · Print the card · Clear selection |
| Premarital Counseling | Reschedule · Mark homework done · Add note · Print record · Clear selection |
| Households | Print address labels · Send reminder · Set city · Merge selected · Clear selection |
| Contacts | Add to day-of sheet · Verify number · Send a text · Export vCards · Clear selection |
| Notes | Flag · Pin to a record · Share with … · Delete · Clear selection |
| Share Packets | Extend expiry · Revoke link · Copy links · Resend · Clear selection |
| Email Templates | Duplicate · Change audience · Archive · Send test · Clear selection |
| Print Centre | Add to day-of pack · Set paper size · Print selected · Export as one PDF · Clear selection |
| Database Hub · all tables | Edit a field on both · Find and replace · Set … · Clear a field · Duplicate · Export selection · Delete N rows · Select all · Clear selection |

### Agreed with the user (no bar drawn — these are the source of truth now)
| Page | Actions |
|---|---|
| Payments | Record a payment · Mark paid · Set due date · Set status · Set vendor · Link to contract |
| Venue & Vendors | Set status · Set category · Add appointment · Request quote · Email selected · Compare selected · Print contact sheet · Delete |
| Catering & Menu | Set course · Mark confirmed · Set dietary · Assign supplier · Print tasting sheet |
| Honeymoon & After | Mark packed · Assign owner · Move to a kit · Set location · Set day · Mark booked · Print itinerary · Clear selection |

*Honeymoon deduped:* the user asked for the Essentials bar verbatim **plus** a
second list; "Mark packed" and "Set location" appeared in both, and "Assign to a
person" and "Assign owner" are the same action. Merged above.

*Open on Payments:* "Record a payment" is the only agreed action that does not
transform the selection — every other action on every bar does. Implemented as
"log a payment against each selected row". **Confirm the intent** before relying
on it; if it means "add a new payment", it belongs in the page header instead.

### Deliberately left without a bar
- **Viewer preferences** — its 24 checkboxes are settings toggles, not records.
- **Planner History** — rows are undo targets, and §18b states a row is only
  undoable while its snapshot survives. That is per-row, not bulk.
- **Dashboard, the three Calendars, Vision Board, the Guest full-editor modal,
  Wedding Setup ×2, Get Started, Guide, FAQ** — no selectable record rows.
- **Still open:** Wedding Day Timeline and Database Hub (single-table view) draw
  tables but no checkboxes. Vision & Foundation and Prayer Journal draw no table
  yet are record lists in the live app. Ask before adding bars to these.

### Sub-pages
`Redesign/pages/` holds shells the screens never draw individually
(`gifts-cash`, `gifts-registry`, `ceremony-vows`, `emails-log`, …). **Default:
a sub-page inherits its parent page's bar.** Not yet ratified by the user.

---

## 6 · How to verify

```bash
py -m http.server 8000
```
- Planner: `http://localhost:8000/index.html`
- Target: `http://localhost:8000/Redesign/Planner%20Screens%20All.dc.html`
- Dark: `http://localhost:8000/Redesign/Planner%20Screens%20Dark.dc.html`
- Galleries: `.../Redesign/component-gallery.html` and `-dark.html`
- Shells: `http://localhost:8000/Redesign/pages/index.html`

Set the viewport to **1440×900**. Screens carry `data-screen-label`, so:
```js
[...document.querySelectorAll('[data-screen-label]')]
  .find(e => e.getAttribute('data-screen-label') === 'Planning Timeline & Tasks')
```

Per page, diff at minimum: surfaces · type (family, size, weight, tracking, line-height,
colour) · spacing (gutters, section gaps, panel padding, row height, control heights) ·
shape (radius 0 everywhere except avatars and floor-plan tables) · components (all 5 pill
schemes + variants, buttons, fields, selects, checkboxes, tables, stat strips, chips,
progress, drawer, modal) · states (hover, focus, active, disabled, selected row, empty) ·
shell (52/46/40/224/360/24) · **then the whole list again in dark.**

**Dark spot-check (README §6) — all six currently pass:**
page `#141414` · work surface `#1A1A1A` · top bar `#16241E` · table header `#1D2F27` with a
`#6B5738` rule · page title / stat value / drawer title `#EDE8DE` · green pill
`rgba(111,156,128,.14)` fill with `#8FB99F` text.

### Regression, after every page
Add / edit / delete a row · save and reload (data persists) · filters and search · sort ·
bulk select and bulk actions · pagination · inline editor and pop-out editor · CSV export ·
dark-mode toggle · panel navigation · theme switch (Covenant *and* one other, to confirm
`darkenHex` still derives).

Useful seeding for a fresh browser profile: `seedTaskTimelineSilent(); save();` —
`applySampleData()` throws, and `loadSampleData()` opens a confirm dialog.

**Diff against `Redesign/baseline/`** to prove behaviour is unchanged: serve it side by
side and confirm same rows, same totals, same filter results. Read-only — never copy files
out of it, it still contains the three superseded Step 0 files.

---

## 7 · Non-negotiables (README §3)

- Progress tracks carry `overflow:hidden`; fills cap at 100%. Over-target = red fill at
  100% plus the negative figure — **never a >100% width.**
- A filter chip must describe the rows actually rendered.
- One Columns chip per toolbar, stating its count (`Columns · 8 of 12`).
- Column controls live in a toolbar, never a section header. A tab bar is navigation, so a
  tab-bar page still needs a toolbar beneath it.
- Never pin a page height — content-sized shells only.
- The name column keeps ≥240px; trim the default column set rather than squeezing names.
- Radius 0 everywhere. Shadows only on popovers and the full-editor modal.
- One primary action per view, forest fill, never gold.
- Icons never in stat strips, table headers, table cells, or beside a button label.
- Max 2 background tones per page; gold only on forest surfaces, never gold on white.
- Never communicate status by colour alone — every pill carries a word.
- Completion on a parent row is **derived from children, never stored** (§13).

---

## 8 · Open risks

1. **No full per-page fidelity score has been re-run since the shell landed.** The 13/13 is
   shell geometry only. Re-baseline Tasks before claiming a percentage.
2. **Two header sources.** `index.html` and the `js/planner.js:16499` template string both
   render page headers. Fixing one leaves the other.
3. **Fonts fail offline** (§5.10). The product is offline-first; this is not cosmetic.
4. **`bulk-bar`** is referenced 5× in planner.js but does not exist in `index.html` under
   that id — reconcile before wiring the redesign bulk bar.
5. **`record-drawer`, `save-state`, `profile-initials`** are new mount points the shells
   introduce. They need wiring to real data; that is new behaviour, not restyling.
6. **`Redesign/pages/index.html` claims 38 pages; the appendix says 37 pages / 44 screens.**
   Some pages have more than one screen. Do not treat the counts as contradictory.

7. **RED IS DRAWN TWO WAYS — open question for the design author.**
   Measured across all 44 screens in `Planner Screens All`. Green, gold, gray and
   blue each resolve to exactly one value. Red resolves to two, splitting by batch:

   | Red | Screens | Count |
   |---|---|---|
   | `#FFF0ED / #A33B28 / #EBB4AA` | Dashboard, Guest List, Budget, Payments, Venue & Vendors, Guest editor, all four Calendars, Wedding Day Timeline, **Planning Timeline & Tasks** | 27 |
   | `#FBEEEC / #9C3B34 / #ECCFC9` | Notes, Shot Lists, Entertainment, Households, Contacts, Appointments, Viewer preferences, Essentials, Honeymoon, Newlywed Homecoming | 24 |

   `Catering & Menu` contains both — it is the crossover screen, around batch 7.

   Two problems this creates:
   - The first red is **the Material Design 3 red deleted in Step 0**.
     `HANDOFF-TO-CLAUDE-CODE.md` names those exact hexes as the reason Step 0 is
     "a deletion, not a merge."
   - That same file states the generator's pill hexes match `redesign-tokens.css`
     "exactly — including red". **That is not true for roughly half the red pills.**

   The §14 precedence order cannot settle this: the conflict is *inside* the
   screens, not between the screens and another file.

   **Current build uses the token red** (`#FBEEEC / #9C3B34 / #ECCFC9`) — it matches
   the tokens, both galleries, and every batch from 10 onward. This is provisional
   and awaiting the design author. Reversing it is a three-value token edit, not a
   code change. Note that screen 9a — the Tasks archetype — is an *old* screen, so
   any per-page fidelity score for Tasks carries this one knowing divergence.

8. **`.status-pill` metrics: the CSS package is wrong, the screens agree.**
   `redesign-components.css` sets `font: 500 var(--type-meta)/1.35`, rendering a
   26px pill. All 44 screens — every batch, no exceptions — draw 400 weight at
   line-height normal, giving 21px. Corrected in `css/redesign-overrides.css`
   under §14. Unlike the red above, this one is not ambiguous.

---

## 9 · When to ask rather than guess

- A screen you need isn't in the export, or a `.dc.html` file won't render.
- The redesign and the **data model** conflict (a screen shows a field the planner doesn't
  store) — especially likely on Households, Contacts and the 24-field guest record.
- Achieving a visual would require changing behaviour or planner.js logic beyond the two
  approved edits.
- `Redesign/` contradicts itself between two files — resolve with the precedence order in
  §0 first, and only ask if that doesn't settle it.
