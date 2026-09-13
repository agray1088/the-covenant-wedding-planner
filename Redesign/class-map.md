# Class-name map — planner → redesign

Derived by reading `01 Developer Editable Version/css/*.css` and `index.html`.
**You have permission to extend this map**; where a row says *derive*, I could not
find a single authoritative class and you should confirm against the live DOM.

The strategy below means **most rows need no HTML change at all** — the redesign CSS
re-selects the planner's existing class names. Rows marked **NEW MARKUP** are the ones
that genuinely need editing, and they are almost all in the shell.

---

## Phase 1 — values only, no markup edits

The planner already has a semantic token layer at `css/planner-tokens.css`.
`redesign-tokens.css` redefines **the same custom-property names**, so dropping it in
after `planner.css` restyles everything that reads a token — roughly 60% of the visual
change — without touching one line of HTML.

| Existing property | Still used | Note |
|---|---|---|
| `--surface-canvas` `--surface-content` `--surface-raised` `--surface-chrome` `--surface-footer` | yes | same names, new values |
| `--text-primary` `--text-muted` | yes | plus new `--text-body/subtle/faint/empty/link` |
| `--border-subtle` | yes | plus new `--border-hairline/control/field` |
| `--status-{green,gold,gray,red,blue}-{bg,text,border}` | yes | all 15 kept verbatim |
| `--space-1…8` | yes | rem → px, same scale positions |
| `--btn-radius` `--radius-sm/md/lg` | yes | **all set to 0** — the system is square |
| `--btn-pad-y/x` `--btn-font-size` `--btn-toolbar-*` | yes | resized to the 32px/28px control heights |
| `--component-table-row-height` | yes | 42px → 36px |
| `--component-input-height` `--component-button-height` | yes | 40px → 32px |
| `--progress-track-height` | yes | 9px → 4px (rail) / 12px (page bars) |
| `--planner-page-gutter` | yes | `clamp(2.5rem,8vw,8.5rem)` → flat 24px |
| `--modal-width-lg` | yes | 920px → 1140px (the 24-field full editor) |

Deleted deliberately: nothing. Every existing property still resolves.

---

## Phase 2 — component restyle, no markup edits

| Planner class | Redesign treatment | Markup change |
|---|---|---|
| `.status-pill` | restyled in place; 5 schemes via `--status-*` | none |
| `.status-pill--interactive` | kept; pill-as-select, chevron via `::after` | none |
| `.status-pill--forest` `.status-pill--gold` | aliased to green/gold schemes | none |
| `.ued-btn` | → `.rd-btn` styling | none |
| `.ued-btn.primary` | forest fill, one per view | none |
| `.m-btn-quiet` | → quiet/tertiary button | none |
| `.ued-link` | gold-brown link | none |
| `.ued-field` | label + control stack | none |
| `.record-editor-field` `.record-editor-mini-label` `.record-editor-check` | restyled | none |
| `.record-editor-overlay` `.record-editor-shell` `.record-editor-head` `.record-editor-kicker` `.record-editor-title` `.record-editor-sub` `.record-editor-nav` `.record-editor-position` `.record-editor-close` `.record-editor-body` `.record-editor-section` `.record-editor-grid` `.record-editor-actions` `.record-editor-actions-right` `.record-editor-small-table` `.record-editor-note` | full-editor pop-out, restyled in place | none |
| `.ued-panel` `.ued-table-card` `.ued-bulk-card` | → flat bordered panel, radius 0, no shadow | none |
| `.ued-band` `.ued-stat` | → hairline stat strip; **icons hidden via CSS** | none |
| `.ued-track` `.ued-fill` `.ued-bar-track` `.ued-bar-fill` `.ued-progress-line` | → 4px/12px square track, `overflow:hidden` | none |
| `.cwp-table` `.cwp-table-wrap` | → redesign table: forest header, gold rule, 36px rows | none |
| `.ued-kicker` `.m-eyebrow` | → 10px/700/.16em uppercase eyebrow | none |
| `.ued-caption` `.ued-tag` | restyled | none |
| `.ued-filter-preset` | → filter chip, active state carries ✕ | ✕ glyph is new markup |
| `.m-mast` `.m-title` `.m-mast-actions` | → page header, 20px title | none |
| `.m-thinrule` | **hidden** — the header's own border is the rule | none |
| `.ued-pill` | audit: overlaps `.status-pill`; *derive* | maybe |
| `.pcs-*` (context sidebar) | superseded by `.rd-rail`; see Phase 3 | yes |

---

## Phase 3 — shell, **NEW MARKUP**

This is the part that cannot be done with CSS alone, because the redesign changes the
information architecture, not just the paint.

| Planner today | Redesign | What to do |
|---|---|---|
| 12 gold buttons in the top bar | `.rd-topbar`: brand · wedding-switcher · ⌘K search · save-state · undo/redo · bell · gear/avatar | rebuild the top-bar markup; move theme/font/display/preview/focus/shortcuts into `.rd-prefs` behind the gear |
| 11 category menus wrapping to 2 rows | `.rd-tabs` — 8 fixed tabs | replace the menubar; map the 11 categories onto the 8 tabs (see below) |
| per-category page lists | `.rd-subnav` — pages inside the active tab | new row beneath the tabs |
| `#planner-context-sidebar` / `.pcs-*` | `.rd-rail` — 224px working rail: saved views + live meters | reuse the sidebar's data, drop the duplicated page stats |
| `.ued-category-strip` `.ued-category-nav` | superseded by tabs + sub-nav | remove |
| `autoFitActivePanelTables()` in the top bar | per-table `.rd-chip--action` in `.rd-toolbar` | move the call; scope it to the table whose toolbar was clicked |
| `.ued-progress-card` | `.rd-rail__meter` | fold into the rail |
| footer | `.rd-footer` — 5-column | restyle in place |

### Tab mapping (11 categories → 8 tabs)
```
Overview   → Dashboard · Notes
Planning   → Timeline & Tasks · Smart Calendar · Appointments · Weekend Logistics
People     → Guest List · Households† · Contacts† · Wedding Party · Table Layout · Gifts
Money      → Budget · Payments · Contracts & Invoices
Vendors    → Venue & Vendors · Catering & Menu · Entertainment · Shot Lists
The Day    → Wedding Day Timeline · Ceremony & Reception · Weekend Logistics · Honeymoon & After
Covenant   → Vision & Foundation · Prayer Journal · Premarital Counseling ·
             First-Month Rhythms · Newlywed Homecoming
Documents  → Vision Board · Essentials Checklist · Share Packets · Email Templates ·
             Print Centre† · Database Hub
No tab     → Planner History (top bar only) · Get Started · FAQ · Page-by-Page · Wedding Setup
```
† **Not in the current app — new pages, APPROVED FOR BUILD.** They are additions to scope,
not recreations of anything you are replacing, so there is no existing markup to migrate:

- **Households** — a derived view over guest records, grouped by household. Owns the
  address, the invitation, and "how many seats does this family need".
- **Contacts** — a derived view over vendors and guests, for when someone needs a phone
  number and does not care which table it lives in.
- **Print Centre** — collects the current top-bar print dropdown into a page that sorts
  every printable by print class and can produce the day-of pack as one job.

**Essentials Checklist lives under Documents**, not Overview. Decided — it is a printable
list, and grouping it with the other printables is what makes Documents coherent.

---

## Naming convention for anything new
`.rd-<block>__<element>--<modifier>`. State classes are `.is-active`, `.is-selected`,
`.is-focused`, `.is-group`, `.is-add`, `.is-partial`, `.is-on`, `.is-danger`.
Prefer `aria-current="page"` over `.is-active` for nav items — the CSS honours both.

## Dark mode
Hook: `body[data-theme="dark"]` (also `body.dark-mode`, `body.dark`,
`body.editorial-v4[data-theme="dark"]` — all four are in the token file's selector list,
so whichever the planner sets will work).

**The trap:** in light mode `#20362D` is used for BOTH table-header backgrounds and dark
text, and `#2D4A3E` for BOTH the top bar and primary buttons. A find-and-replace on hex
alone makes every page title invisible and flattens the bar. That is why the token file
carries `--table-header-bg`, `--table-header-rule` and `--shell-topbar-bg` as separate
properties. Use them; never hard-code forest for a surface.

---

## Depth pass + work surfaces (CURSOR-IMPLEMENTATION-GUIDE §2 / §7.1)

Added after the Phase 1–3 map. Opt-in markup; existing tables keep working without these classes.

| Class | Role |
|---|---|
| `.rd-th__type` | Type glyph in a column header (`A # $ ◉ ☺ ☑ ↗ ❐ ƒ ▤`) |
| `th[data-col-type]` / `td[data-col-type]` | Drives alignment and derived styling |
| `.rd-avatar` `.rd-cell-person` `.rd-cell-chip` `.rd-cell-attach` `.rd-cell-mark` | Typed cell renderings |
| `.rd-table-summary` / `__row` / `__cell` | Sticky foot rollups per column |
| `.rd-table-wrap--depth` `.rd-table--freeze-first` | Depth table chrome + frozen first column |
| `.rd-row-actions` | Hover/focus row actions (drawer vs full editor) |
| `.rd-th--add` `.rd-td--add` | ＋ column that creates fields in-grid |
| `.rd-drawer__identity` `.rd-drawer__nav` `.rd-drawer__quick` `.rd-drawer__provenance` | Drawer depth header / foot |
| `.rd-related` `.rd-comments` `.rd-activity` | Drawer related lists, comments, activity |
| `.rd-empty-add` | Pale “Add…” for empty fields |
| `.rd-stat__delta` `.rd-stat__spark` `.rd-stat__target` `.rd-stat__filter` `.rd-stat.is-attention` | Stat strip depth |
| `.rd-cardgrid` `.rd-grouplist` `.rd-kanban` `.rd-calendar` `.rd-gantt` | Work-surface shapes |
| `.rd-printsheet` `.rd-labelsheet` `.rd-reading` `.rd-blockeditor` `.rd-splitdetail` | Work-surface shapes |
| `.rd-hatch` | Travel / load-in / setup hatch language |

JS helper: `js/rd-depth.js` → `window.RdDepth`.
State library: `js/rd-states.js` → `window.RdStates` (empty / filter-empty / loading / error + per-page copy).
`RdStates.applyOverlay(wrap, opts)` paints the overlay on CWP wraps (Guests, Party, Gifts, Tables, Tasks).

| Class | Role |
|---|---|
| `.rd-state` `.rd-state--empty` `.rd-state--filter` `.rd-state--loading` `.rd-state--error` | Page state surfaces |
| `.rd-state--table` `.rd-state--reference` `.rd-state--form` `.rd-state--canvas` | Archetype variants |
| `.rd-state__heading` `.rd-state__body` `.rd-state__actions` | State copy + CTAs |
| `.rd-cmd` `.rd-cmd__group` `.rd-cmd__foot` | Command palette furniture (batch 34) |
| `.rd-filter-builder` / `__row` / `__foot` / `__readas` / `__nested` | Filter builder overlay (Views S2) |
| `.rd-views-mgr` | Saved views management (Views S3) |
| `.rd-bulk-edit` | Bulk edit dialog (Views S4) |
| `.rd-kbd` | Keyboard shortcuts sheet (Views S6) |
| `.rd-share` | Share dialog (Views S8) |
| `.rd-undo-toast` | Forest undo toast (Views S9) |

JS: `js/rd-furniture.js` → `window.RdFurniture` (filter builder, views mgr, shortcuts, bulk edit, share, undo toast).

View shells (§7.2–§7.3): `households-{labels,cards}`, `contacts-{dayof,cards}`, `party-{cards,duties}`, `tables-{list,byguest}`, `gifts-notes`, `budget-{bycategory,pledged}`, `payments-calendar`, `contracts-{documents,schedule}`.
