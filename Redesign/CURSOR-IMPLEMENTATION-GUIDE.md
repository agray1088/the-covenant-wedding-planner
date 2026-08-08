# Implementing the Covenant redesign — a guide for Cursor

You have already built **Planning, People and Money** from an earlier handoff. Since then four
documents changed or appeared. This file explains what each one is, what to take from it, and —
most importantly — **what changed under the three categories you have already finished**.

Read §1 and §7 first. §7 is the delta list for work you have already done.

**For every remaining page, follow §11 · Page implementation playbook.** It is the standing
process distilled from Venue & Vendors (4c) and the People/Money redesign — do not wait for the
user to re-state it.

**When the user says “continue” (or equivalent), run §11.0 immediately** — pick the next page in
§11.7, find every mock for it, implement to **exact** mock fidelity, gap-pass, commit/push/PR.
No re-brief required.

---

## 1 · The five documents, and what each is for

| Document | What it holds | What you take from it |
|---|---|---|
| **`Covenant Design Spec.dc.html`** | The system. Tokens, type, spacing, component drawings, and §01–§23 of rules. | Every measurable value: hex codes, pixel sizes, the type scale, component anatomy. **This is the only place with real numbers.** |
| **`redesign/covenant-design-spec.md`** | The same rules in prose, deliberately with **no** hex codes or pixel values. | The reasoning. Read it when you need to know *why* a thing is shaped that way, or when a case comes up the drawings don't cover. |
| **`Planner Screens All.dc.html`** | 51 screens — the base state of every page. One screen per page, the page's first view. | The page you are building, its shell, stat strip, toolbar and default work surface. |
| **`Planner Screens Drawers.dc.html`** | 28 drawer types, every tab of each drawn. | The record drawer for whatever record type the page owns. |
| **`Planner Screens Views.dc.html`** | 73 screens — every alternate view of every page, plus system furniture, states, density rules, breakpoints and roles. | The 2nd and 3rd view of each page, and all the cross-cutting behaviour. |
| **`Planner Vendor Portal.dc.html`** | 7 screens — the vendor-facing product. | Only when you build vendor access. It is a separate product, not a mode of this app. |

Plus the implementation package you already have:

- `redesign/redesign-tokens.css`, `-components.css`, `-shell.css`, `-layouts.css` — the CSS
- `redesign/pages/` — **147 HTML page shells**, one per page *and per view state*
- `redesign/class-map.md` — every class name, including the 11 work-surface shapes
- `spec-update-notes.md` — change log; read the "traps worth not repeating" sections

### How to read a screen document

Every screen has three parts stacked vertically:

1. **A badge and a title** — e.g. `10a · Wedding Party · Cards view`. The badge is the page's id in the spec's page inventory.
2. **A "Build notes" panel** — dark box listing Purpose, where it lives, what the columns/cards show, and the binding rules. **Read this before the picture.** It contains the constraints the drawing can't show.
3. **The screen itself** at 1440px.

Groups are collapsed — click a group header to expand it.

**Chrome compaction:** only the first screen in each batch draws the full shell (top bar, tab
strip, sub-nav, rail). The rest show a green strip reading *"Same shell as above"* and start at
the page header. That is a file-size measure, not a design difference — every screen has the
same shell.

---

## 2 · What "a page" is made of

Every one of the 37 pages follows the same anatomy (spec §07). Build in this order:

```
┌─ Top bar ────────────────────────────────────────────┐  fixed, all pages
├─ Tab strip ──────────────────────────────────────────┤  8 tabs
├─ Sub-nav ────────────────────────────────────────────┤  pages within the tab
├─────────┬────────────────────────────────────────────┤
│  Rail   │  Page header + actions                     │
│  224px  ├────────────────────────────────────────────┤
│         │  Stat strip                                │
│  saved  ├────────────────────────────────────────────┤
│  views  │  Toolbar: filters · view switcher          │
│  +      ├────────────────────────────────────────────┤
│  meters │  Bulk bar (hidden until selection)         │
│         ├────────────────────────────────────────────┤
│         │  Work surface ← the only part that varies  │
└─────────┴────────────────────────────────────────────┘
                                    Drawer, 360px, overlays from the right
```

**The work surface is the only part that changes between views of a page.** Everything above it
stays put. That is why switching views must never reload the page.

### The 11 work-surface shapes

Every view is one of these. Class names in `redesign/class-map.md`.

| Class | Shape |
|---|---|
| `.rd-table-wrap` | Grid with sticky header — **exists in the CSS already** |
| `.rd-cardgrid` | Card grid, 3–4 columns |
| `.rd-grouplist` | Collapsible group headers with rows |
| `.rd-kanban` | Draggable columns |
| `.rd-calendar` | Month grid |
| `.rd-gantt` | Time axis with positioned bars |
| `.rd-printsheet` | Centred paper on a desk background |
| `.rd-labelsheet` | Fixed grid at label-stock dimensions |
| `.rd-reading` | Single prose column, max 720px |
| `.rd-blockeditor` | Prose with block-insert affordances |
| `.rd-splitdetail` | Scrolling left pane + fixed 340px right panel |

**Only `.rd-table-wrap` is written.** The other ten need building. Drawings for each are in
`Planner Screens Views.dc.html`.

---

## 3 · Where every screen lives in the planner

### `Planner Screens All.dc.html` — the base state of each page

| Tab | Pages with a base screen |
|---|---|
| Overview | Dashboard · Get Started · Page-by-Page Guide · FAQ · Wedding Setup · Essentials Checklist · Notes · Viewer preferences |
| Planning | Timeline & Tasks · Appointments · Smart Calendar · Database Hub |
| People | Guest List · Households · Contacts · Wedding Party · Table Layout · Gifts |
| Money | Budget · Payments · Contracts & Invoices |
| Vendors | Venue & Vendors · **Venue Comparison** · Catering & Menu · Entertainment · Shot Lists |
| The Day | Wedding Day Timeline · Ceremony & Reception · Weekend Logistics · Newlywed Homecoming · Planner History |
| Covenant | Vision & Foundation · Prayer Journal · Premarital Counseling · First-Month Rhythms |
| Documents | Share Packets · Email Templates · Print Centre · Vision Board |

### `Planner Screens Views.dc.html` — organised in batches, newest first

| Batch | Contents | Applies to |
|---|---|---|
| **43** | Role views — planner, couple, vendor | Whole app |
| **41–42** | Responsive: 1024px, mobile, day-of mode | Whole app |
| **38–40** | Depth: tables, drawers, stat strips | Whole app |
| **37** | State library — empty, loading, error, first run + per-page copy | Whole app |
| **34–36** | Furniture: ⌘K, filter builder, saved views, bulk edit, import, shortcuts, notifications, share, small states, templates/trash/merge | Whole app |
| **33** | Notes, Share Packets, Email Templates, Print Centre, Guide, Essentials — 12 views | Documents, Overview |
| **32** | Vision, Prayer, Counseling, Rhythms — 8 views | Covenant |
| **31** | Wedding Day Timeline, Ceremony, Logistics, Homecoming, History — 10 views | The Day |
| **30** | Budget, Payments, Contracts, Vendors, Catering, Entertainment, Shot Lists — 14 views | **Money**, Vendors |
| **29** | Wedding Party, Table Layout, Gifts — 6 views | **People** |
| **28** | Households, Contacts — 4 views | **People** |

Batches 28–33 are per-page work. **Batches 34–43 are cross-cutting and affect every page you
have already built.**

---

## 4 · What to implement, in what order

### Phase 1 — finish the cross-cutting rules (affects work already done)
1. **Depth pass (38–40)** — tables, drawers, stat strips. See §7 below.
2. **State library (37)** — 4 archetypes × 4 states, plus the 30-page copy deck.
3. **Furniture (34–36)** — ⌘K, filter builder, saved views, bulk edit, import, shortcuts, notifications, share, small states.

### Phase 2 — the remaining view states
4. **Vendors, The Day, Covenant, Documents** base pages + their views (batches 30–33).
5. The **10 unwritten work-surface classes**, as each view needs them.

### Phase 3 — reach and roles
6. **Responsive (41–42)** — two breakpoints, plus day-of mode.
7. **Roles (43)** and, separately, the **Vendor Portal**.

---

## 5 · Binding rules you cannot see in a picture

These are from spec §18–§23. They decide behaviour, not appearance.

**Views**
- A view is a **layout, never a second copy of the data**. Every view of a page reads the same records. If two views of one page could disagree about a number, one is wrong.
- **Failure states get a group, not a filter.** "Not seated", "Unassigned", "No vendor attached", "No window assigned" render as the **last group, in red** — never as a filter the user must think to apply.
- **Toolbars shed controls that don't apply.** Column, auto-fit and row-height controls appear **only** on table and matrix surfaces. Filter chips appear everywhere.
- Print views **suppress derived times**; screen views show them. Toggle lives in the toolbar.

**Matrix marks** — `●` confirmed · `○` suspected/partial · `—` confirmed absent · `✓` suitable.
A blank cell is never rendered. `○` is never collapsed into `—`.

**Derived data**
- A derived column carries **ƒ**, a muted header, and **cannot be edited in the grid**.
- Instalments are child records of a contract. Category totals are derived from lines. Session completion is derived from homework. None of these can be typed.

**Empty states**
- Empty-because-nothing-exists and empty-because-a-filter-is-on are **different screens**.
- No empty state says "nothing here" and stops — each states the page's dependency.

**Never**
- Covenant records never enter a share packet, export, or vendor view.
- No stat shows a figure that exists nowhere else.
- No page-specific keyboard shortcuts.

---

## 6 · Traps that already cost rework

From `spec-update-notes.md` — worth knowing before you hit them:

1. **Bare boolean HTML attributes get dropped** by some template compilers. Write `open="open"`, not `open`.
2. **`{{field}}` in *content*** is consumed as a template hole. To display merge-field syntax as text, break it with markup.
3. **`list-style: none` on a `<summary>` removes the disclosure triangle** — replace it deliberately or the affordance vanishes.
4. **Style helpers silently diverge.** A hand-written copy of a shared component style missed `text-overflow: ellipsis` and `white-space: nowrap`; labels clipped mid-word. Use one source for a component style.
5. **Affordance copy must be generated from state**, not patched after the fact.

---

## 7 · ⚠ What changed under Planning, People and Money

**This is the section you asked for.** Everything below affects pages you have already built.

### 7.1 · Applies to all three categories (batches 38–40, the depth pass)

These are the largest changes. Every table, drawer and stat strip you built needs them.

**Tables — `Depth · table` in Views**
- [ ] Every column header gains a **type glyph** (`A` text, `#` number, `$` currency, `◉` select, `☺` person, `☑` checkbox, `↗` link, `❐` attachment, `ƒ` formula, `▤` date)
- [ ] **Alignment follows type** — text left; numbers and currency right, in tabular figures
- [ ] A person renders as an **avatar**, not a name string; a checkbox as a **mark**; a linked record as a **chip with an arrow**; an attachment as a **count**
- [ ] **Derived columns carry ƒ**, a muted header, and are not editable in the grid
- [ ] **Summary bar at the table foot** — one rollup per column, in that column's alignment, blanks and failures counted in colour
- [ ] **Row actions on hover only**, with keyboard equivalents shown. Open-in-drawer and open-full-editor are **separate actions**
- [ ] **First column freezes**, and the summary bar freezes with it
- [ ] **`＋` column at the right end** creates fields — in the grid, not a settings page

**Drawers — `Depth · drawer` in Views**
- [ ] Header gains: initials avatar, status chips, **three quick actions** (call/email/WhatsApp), breadcrumb, and **prev/next with record position** ("47 of 142"). `⌥↑↓` moves between records without closing
- [ ] **Empty fields render "Add…" in pale text**, never a blank box
- [ ] **Related lists** — inline mini-tables for children the record owns or touches, each with an add action and a link to the owning page
- [ ] **Comments** — threaded, `@mention`, explicit Resolve. *A comment is not a note.* A note is a pinned fact with a kind; a comment is a conversation. Both exist
- [ ] **Activity log states derived consequences** — "Reply changed to Accepted · **+1 cover**" — dotted gold where a change had a downstream effect
- [ ] **Provenance line at the foot** — created and last-modified, by whom

**Stat strips — `Depth · stat strips` in Views**
- [ ] **Delta = change since a named moment** ("↑6 since Monday"), never a bare percentage
- [ ] **Sparklines only where a figure genuinely trends** (12 weeks, last bar in forest)
- [ ] **Target = a tick on a two-tone bar**, so over-target reads as *over*, not as full
- [ ] **At most one attention cell per strip**, and it must state why
- [ ] **Every stat names the view it filters to** — a number you can't click through to is decoration

### 7.2 · People — new view screens

| Page | Had | Now also needs |
|---|---|---|
| Guest List | Table, Households, Seating | *(complete — no change)* |
| **Households** | Table | **Labels** (batch 28) · **Cards** (28) |
| **Contacts** | Table | **Day-of sheet** (28) · **Cards** (28) |
| **Wedding Party** | Table | **Cards** (29) · **Duties** (29) |
| **Table Layout** | Plan | **List** (29) · **By guest** (29) |
| **Gifts** | Table | **Registry** (29) · **Notes** (29) |

Shells exist: `redesign/pages/households-labels.html`, `-cards.html`, `contacts-dayof.html`,
`contacts-cards.html`, `party-cards.html`, `party-duties.html`, `tables-list.html`,
`tables-byguest.html`, `gifts-registry.html`, `gifts-notes.html`

**Watch for:**
- `Table Layout · By guest` is the **caterer's export** — the only view where seat, meal and restriction sit on one line. Sticky first column, dietary columns as marks not text.
- `Table Layout · List` must carry a **"Not seated" group** — accepted guests with no table, red, last.
- `Wedding Party · Duties` must carry an **"Unassigned" column** — red, last.
- `Gifts · Notes` sorts by **days owed**, not by giver.
- `Households · Labels` **skips** households with no address rather than printing blank ones.

### 7.3 · Money — new view screens

| Page | Had | Now also needs |
|---|---|---|
| **Budget** | Itemized | **By category** (batch 30) · **Pledged & paid** (30) |
| **Payments** | Table | **Calendar** (30) |
| **Contracts & Invoices** | Table | **Documents** (30) · **Schedule** (30) |

Shells: `budget-bycategory.html`, `budget-pledged.html`, `payments-calendar.html`,
`contracts-documents.html`, `contracts-schedule.html`

**Watch for:**
- **Category totals are derived** from their lines. Over-target renders red **at the group row**, not just on the offending line.
- `Budget · Pledged & paid` needs a **"Not pledged" group** showing the shortfall — money committed with no source behind it. It is a group, not a footnote.
- Money **not tied to a line** renders amber "Unassigned" rather than silently inflating a category.
- `Payments · Calendar` — colour encodes **status, never size**. Dragging a payment *proposes* a date and flags the contract that sets it; it never rewrites a contracted date.
- `Contracts · Documents` — a **required document that doesn't exist yet still gets a card**, rendered red "Missing". Absence is a state.
- `Contracts · Schedule` — instalments are **child records**, so the timeline is drawn, never typed.

### 7.4 · Planning — no new view screens, but check these

Guest List, Timeline & Tasks, Appointments and Smart Calendar were already complete. But:

- [ ] The **depth pass (§7.1)** applies to all of them
- [ ] `Appointments` — travel time renders **hatched**, and the same hatch language now means "not the thing itself" everywhere (load-in on Entertainment, setup on the vendor schedule). Keep them consistent
- [ ] `Database Hub` — see the drawer document for `Hub table · 7b` and `Hub row · 7c`

### 7.5 · Also new since your handoff, and cross-cutting

- [ ] **State library (37)** — every page needs its 4 states. Copy deck for all 30 pages is in Views
- [ ] **Furniture (34–36)** — 10 overlays that belong to no page: ⌘K, filter builder, saved views, bulk edit, import, shortcuts, notifications, share, small states, templates/trash/merge
- [ ] **All 28 drawer types** now have every tab drawn in `Planner Screens Drawers.dc.html` — previously only the first tab existed. Check the record types on your finished pages: Household `14b`, Contact `14c`, Wedding party member `10a`, Table `8a`, Gift `10b`, Appointment `14a`
- [ ] **Responsive (41–42)** — 1240px and 720px
- [ ] **Roles (43)**

---

## 8 · The page shells in `redesign/pages/`

147 files. Naming: `{page}.html` for a base view, `{page}-{view}.html` for a view state —
`households-labels.html`, `budget-bycategory.html`, `tables-byguest.html`.

Each shell is complete: same top bar, tab strip, sub-nav and rail as its base page, with four
things varying —

1. **Rail views and meters** for that view
2. **Page-head actions**
3. **Toolbar** — correct switcher pill active, and table-only controls already omitted on non-table surfaces
4. **One empty work-surface div** for you to fill

**The rail note on each shell states that view's binding rule.** It is the shortest place the
constraint could be put where it would actually be read.

Mount ids: `#{page}-{view}-mount` for the surface, `-foot` for the row count, `-stats` for the
stat strip. The panel is `#panel-{page}-{view}` with `data-panel` and `data-view`.

---

## 9 · Quick reference — which document answers which question

| Question | Look in |
|---|---|
| What hex is this? What size? | `Covenant Design Spec.dc.html` |
| Why is it shaped this way? | `redesign/covenant-design-spec.md` |
| What does this page look like by default? | `Planner Screens All.dc.html` |
| What are its other views? | `Planner Screens Views.dc.html`, batches 28–33 |
| What does the drawer look like, every tab? | `Planner Screens Drawers.dc.html` |
| How dense should the table be? | Views, batch 38 |
| What happens when it's empty / loading / broken? | Views, batch 37 |
| How does ⌘K / filtering / bulk edit work? | Views, batches 34–36 |
| What happens on a tablet or phone? | Views, batches 41–42 |
| Who can see what? | Views batch 43, then `Planner Vendor Portal.dc.html` |
| What class name do I use? | `redesign/class-map.md` |
| What went wrong last time? | `spec-update-notes.md` |

---

## 10 · Known gaps — not your bugs

- **10 of the 11 work-surface classes are not written.** Only `.rd-table-wrap` exists.
- **No shells for furniture, states or responsive** — they are overlays, per-archetype states and breakpoint behaviours, not pages. Reserved class names are at the foot of `class-map.md`.
- **`Planner Screens All.dc.html` is 2.2MB** and slow to open. Give it time.
- **`Planner Screens Views.dc.html` is 1.3MB** — over a minute to first paint, and it cannot be exported to PNG or PDF.

---

## 11 · Page implementation playbook (standing process)

Use this for **every** unfinished page. The user should not have to re-explain fidelity, mock
lookup, or queue order.

### 11.0 · “Continue” trigger

When the user says **continue**, **keep going**, **next page**, or similar:

1. Take the **next unfinished page** from §11.7 — that queue follows **live category → sub-page
   order** from `js/redesign-shell.js` `TABS` (not a reshuffled “priority” list).
2. Resolve its panel key / All.dc badge and find **all** mocks (§11.1a).
3. Complete the mandatory inventory (§11.2) — no coding until that is done.
4. Implement so the live UI **matches the mockups exactly** (§11.1 fidelity rule).
5. Run the gap pass (§11.5), then commit, push, and update the PR.

Do not ask which page unless the queue is ambiguous or blocked. Do not wait for mock file paths —
look them up. Do **not** skip ahead inside a category (e.g. after Venue & Vendors, next is
**Venue Comparison**, not Catering & Menu).

### 11.1 · Fidelity rule (non-negotiable)

**What you implement must match the mockups exactly** from the files in §11.1a — rail, stats,
pagehead, toolbar, view switcher, work surface, drawer, marks, copy, and view-specific chrome.

- Match the drawings. **Do not approximate**, restyle “in the spirit of”, or invent alternate UX.
- If All.dc / Views / Drawers disagree with older shells or Sub-Tabs, **All.dc + Views + Drawers win**.
- If something is undrawn (e.g. no vendor-only Full editor screen), reuse the shared pattern
  (`openRecordEditor` / §16) and say so in the PR — do not invent a third chrome.
- Keep legacy `data.*` models and schemas; restyle into the redesign surface.

### 11.1a · How to find every mock for a page

Lookup by **live sub-nav order** first, then **page / badge id** — not by guessing filenames.

| Step | Where | What to do |
|---|---|---|
| 0 | `js/redesign-shell.js` → `TABS` | Authoritative **category → sub-page** order for “continue” |
| A | Guide §3 + `planner-screens-all-catalog.md` | Map page name → All.dc badge id when one exists (`4c`, `7a`, `10d`, …) |
| B | `Planner Screens All.dc.html` | Open `id="{badge}"`. Read **Build notes**, then the full 1440px screen |
| C | `Planner Screens Views.dc.html` | §3 batch map (30 Vendors/Money, 31 The Day, 32 Covenant, 33 Documents). Collect every sibling view for that page |
| D | `Planner Screens Drawers.dc.html` | Tab-group batch (Vendors 24, The Day 25, Covenant 26, Documents 27). Every tab of the record type |
| E | `redesign/pages/{page}*.html` | Shell/rail hints only — secondary |
| F | Views batches **34–43** | Depth, states, furniture, responsive, roles — apply when relevant |

If a **live sub-nav page has no All.dc badge yet** (e.g. Venue Comparison may be inventory-thin):
search All/Views/Drawers/Dark/Spec by page title and panel id (`#panel-venue`), use every
drawing that applies, keep legacy `data.venue` behaviour, and still apply §07 frame + exact
match to whatever is drawn. Note undrawn gaps in the PR — do not skip the page in the queue.

Worked examples: Venue & Vendors = All `#4c` + Views `#30f` / `#30g` + 4c drawer panel.
Venue Comparison (`venue`) = thin inventory → `js/venue-redesign.js`.
Catering & Menu = All `#7a` + Views `#30h` / `#30i` + Drawers batch 24 → `js/catering-redesign.js`.
Entertainment = All `#10d` + Views `#30j` / `#30k` + Drawers Song → `js/entertainment-redesign.js`.
Shot Lists = All `#11b` + Views `#30l` / `#30m` + Drawers Shot → `js/shotlist-redesign.js`.
Wedding Day Timeline = All `#6b` + Views `#31a` / `#31b` + Drawers Event → `js/timeline-redesign.js`.
Ceremony & Reception = All `#11a` + Views `#31c` / `#31d` + Drawers Element → `js/ceremony-redesign.js`.
Honeymoon & After = All `#17b` + Dark rail + Drawers Booking → `js/honeymoon-redesign.js`.
**Next on continue:** Prayer Journal (`prayer` / All **13b`).

### 11.1b · Sources of truth (priority order)

1. **`Planner Screens All.dc.html`** — base state for the page id.
2. **`Planner Screens Views.dc.html`** — every alternate view; build notes before the picture.
3. **`Planner Screens Drawers.dc.html`** — every drawer tab for the record type.
4. **Guest `5a` / §16** — shared Full editor chrome when no page-specific drawing exists.
5. **`redesign/pages/` shells** — secondary; superseded when All/Views disagree.
6. **`spec-update-notes.md`** + **`class-map.md`**.
7. **Legacy `js/planner.js` (and page modules)** — data/schemas only; UI follows mocks.

### 11.2 · Read before you write (mandatory inventory)

For the page id you are building, extract and keep a checklist from:

| Surface | What to capture |
|---|---|
| All.dc build notes | Purpose, rail views/meters, columns, stats, primary action, connections |
| All.dc picture | Pagehead button order, toolbar chips, view switcher, groups, empty/add row, drawer fields |
| Each Views screen | Purpose, marks/rules, alternate stats/rail, work-surface shape, pagehead deltas |
| Drawers.dc | Every tab label + fields; footer actions (Save / Full editor / domain CTA) |
| Legacy code | Entity key, `data.*` arrays, status helpers, schemas/attrs, linked records |

If you only skimmed All.dc chrome and skipped drawer / Full editor / view build notes, **stop and
finish the inventory** before coding. A partial read is how 4c missed Budget line →, Coverage
rail, and §16 Full editor.

### 11.3 · Build order (same anatomy every page)

1. **Shell** — `#panel-{page}` → `.rd-page` with pagehead, `#…-stats`, toolbar, bulk bar,
   `.rd-surface > .rd-surface__row` containing `.rd-surface__main` + `#{page}-drawer-slot`.
2. **Rail** — `js/planner-context-sidebar.js` `build{Page}Context()`: Views list + meters + note
   from the mock. View switching must not reload the page.
3. **Stat strip** — labels/values/attention from All.dc; alternate strips per view when Views
   draw them (use `RdDepth.renderStats` when available).
4. **Toolbar** — filters, sort, columns, density, **view switcher on the right**.
5. **Default work surface** — table/cards/plan/etc. from All.dc (columns, groups, rating marks,
   contract chips, add row).
6. **Alternate views** — one render path per Views screen; only the work surface + relevant
   chrome change.
7. **Drawer** — 360px docked **right of the table**, not under it. See §11.4.
8. **Full editor** — pagehead + drawer + row action → `openRecordEditor(entity, idx)` (§16).
   Open-in-drawer and open-full-editor are **separate** actions (hover row actions with kbd hints).
9. **Wire-up** — `SYSTEM_PANEL_RENDERERS`, cache-bust `?v=` on touched CSS/JS in `index.html`,
   rail counts helpers on `window`, commit / push / update PR.

Prefer a focused `{page}-redesign.js` (pattern: `vendors-redesign.js`, `party-redesign.js`) over
growing `planner.js` further.

### 11.4 · Drawer docking (do not skip)

Other redesigned pages already do this; copy the pattern or the drawer stacks under the table:

```css
#panel-{page} .rd-surface { flex column; flex 1; min-height 0; overflow hidden; }
#panel-{page} .rd-surface__row { display flex; align-items stretch; flex 1; min-height 0; }
#panel-{page} .rd-surface__main { flex 1; min-width 0; overflow hidden; }
#panel-{page} #{page}-drawer-slot { display: none; }
#panel-{page} #{page}-drawer-slot.is-open {
  display: flex; flex: 0 0 360px; width/min/max 360px; border-left; background;
}
```

Also register the slot in `redesign-shell.js` `syncDrawerSlot()` and `DRAWER_PAGE_CRUMB` when using
the shared `#record-drawer`. Custom decision drawers (like Vendors 4c) still live in the same
slot and must set `.is-open` on it.

### 11.5 · Fidelity gap pass (before you call the page done)

Re-diff live UI against the **exact** mock inventory from §11.1a:

- [ ] Rail views + meters (and per-view meter swaps)
- [ ] Pagehead actions **per view**
- [ ] Stats per view
- [ ] Every view's work surface (not just the default table)
- [ ] Drawer fields exactly as drawn (links with →, overdue chips, pros/cons, domain CTAs)
- [ ] Full editor opens §16 pop-out for the correct index
- [ ] Row actions: Open (drawer) ≠ Full editor
- [ ] Legacy schemas/attrs/linked data still drive the matrix/forms
- [ ] Drawer docks right (flex row), desktop + narrow overlay behaviour
- [ ] Hard-refresh cache bust on changed assets

Call out deferred items honestly in the PR (whole-app depth 38–40, responsive 41–42, roles 43,
missing dedicated Full-editor drawings, etc.). Do not pretend a skim equals a gap pass.

### 11.6 · Reference implementation

**Venue & Vendors (`4c`)** is the template for this playbook:

| Piece | Where |
|---|---|
| Page module | `js/vendors-redesign.js` |
| Rail | `js/planner-context-sidebar.js` → `buildVendorsContext` |
| Drawer slot + crumb | `js/redesign-shell.js` |
| Layout / drawer dock CSS | `css/redesign-overrides.css` (`#panel-vendors` surface row) |
| Mocks | All.dc `#4c`, Views `#30f` `#30g` |

People/Money pages (`party-`, `gifts-`, `budget-`, `payments-`, `contracts-`, `tables-redesign.js`)
follow the same shell + slot + renderer shape — reuse their CSS dock blocks when starting a new
panel.

### 11.7 · Remaining page queue (default order for “continue”)

**Order = live `TABS` in `js/redesign-shell.js`:** finish each category’s sub-pages left-to-right
before moving to the next category. Do not jump ahead inside Vendors.

**Vendors** (complete):

| # | Sub-page (nav label) | Panel key | All.dc / notes |
|---|---|---|---|
| ✓ | Venue Comparison | `venue` | Thin inventory; `js/venue-redesign.js` |
| ✓ | Catering & Menu | `catering` | All **7a** · Views `#30h`/`#30i` · `js/catering-redesign.js` |
| ✓ | Entertainment | `entertainment` | All **10d** · Views `#30j`/`#30k` · `js/entertainment-redesign.js` |
| ✓ | Shot Lists | `shotlist` | All **11b** · Views `#30l`/`#30m` · `js/shotlist-redesign.js` |

**The Day** (current category):

| # | Sub-page | Panel key | All.dc |
|---|---|---|---|
| ✓ | Wedding Day Timeline | `timeline` | All **6b** · Views `#31a`/`#31b` · `js/timeline-redesign.js` |
| ✓ | Ceremony & Reception | `ceremony` | All **11a** · Views `#31c`/`#31d` · `js/ceremony-redesign.js` |
| ✓ | Honeymoon & After | `honeymoon` | All **17b** · Dark rail · `js/honeymoon-redesign.js` |

**Covenant** (live nav order):

| # | Sub-page | Panel key | All.dc |
|---|---|---|---|
| ▶ | **Prayer Journal** | `prayer` | **13b** · Views 32 · Drawers 26 |
| 9 | Premarital Counseling | `counseling` | **13c** · Views 32 · Drawers 26 |

(Also redesign **13a** Vision & Foundation / **13d** First-Month Rhythms when they appear in nav
or when the user asks — inventory may list more than the current `TABS` strip.)

**Documents** (live nav order):

| # | Sub-page | Panel key | All.dc |
|---|---|---|---|
| 10 | Vision Board | `mood` | **8b** |
| 11 | Essentials Checklist | `essentials` | **17a** |
| 12 | Share Packets | `packets` | **12b** · Views 33 · Drawers 27 |
| 13 | Email Templates | `emails` | **12c** · Views 33 |
| 14 | Database Hub | `data-hub` | **7b** / **7c** |

Then cross-cutting: Responsive **41–42**, Roles **43**, Vendor Portal last.

For each page: **§11.1a find mocks → §11.2 inventory → §11.3–11.4 build → §11.5 gap pass →
commit / push / PR update.**
