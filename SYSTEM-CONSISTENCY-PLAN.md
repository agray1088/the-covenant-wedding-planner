# System Consistency Plan — The Covenant Wedding Planner

**Audience:** Codex / Claude / any implementer  
**Status:** Governing plan (execute in phases; do not invent parallel systems)  
**Created for:** Strategy Roadmap Build - Codex — Developer Editable Version  
**Last locked decisions:** 2026-07-12  

---

## 0. How to use this document

1. Read **§1 Summary**, **§2 Charter**, and **§3 Scope tiers** before writing code.  
2. Execute **Phase A** fully before **Phase B**.  
3. Execute **Phase B** one batch at a time; run the batch QA gate before starting the next batch.  
4. Do **not** implement **Enhancement** or **Future** items during Phase A or Phase B unless this document is explicitly amended.  
5. When unclear, follow the **Decision log (§16)** and the **Remove-nothing** principle (§15).  
6. Prefer extending existing systems (CWP, editorial shell, existing hubs) over creating new frameworks.

### Working tree (source of truth for edits)

```
Backup/Chat/The Covenant Wedding Planner - Strategy Roadmap Build - Codex/01 Developer Editable Version/
```

**Absolute working tree path:**

```
C:\Users\arian\OneDrive\Desktop\Christian Bridal Wedding Honey Moon Planner\Backup\Chat\The Covenant Wedding Planner - Strategy Roadmap Build - Codex\01 Developer Editable Version
```

Primary files:

| Area | Path |
|------|------|
| Shell / panels | `index.html` |
| Main behavior | `js/planner.js` |
| UX / CWP-related | `js/ux-kit.js` (and related JS as present) |
| Styles | `css/planner.css`, `css/planner-tokens.css`, `css/planner-page-gutters.css`, phase/shell CSS |
| Context sidebar | `js/planner-context-sidebar.js`, `css/planner-context-sidebar.css` |
| Rebundle | existing customer rebundle scripts/process for this build |

### Reference artifacts (do not fork a second product root)

| Role | Path |
|------|------|
| **Tracker UX reference** (inline full editor + RO preview + Hub) | `The Covenant Wedding Planner - Customer Download - Claude.html` (same Codex `01 Developer Editable Version` folder) |
| **Print / PDF visual source of truth** | `_CUSTOMER-DOWNLOAD-ESSENTIALS/The-Covenant-Wedding-Planner-Essentials/` (HTML printables designed for Print → Save as PDF) |

---

## 1. Summary

Improve the planner by formalizing it as **one governed product system**, not a set of individually redesigned pages.

Keep the full **premium Launch breadth**, but control it through:

- Scope tiers (Launch / Enhancement / Future)
- Five page archetypes
- One shared UI system
- One table / bulk-edit contract (CWP)
- One official **Tracker** contract (inline full editor + read-only CWP preview + Hub)
- Shared status, copy, shell, spacing, and print/PDF rules
- Shared page rails: page/category headers, sections, cards, tables, and grid rows align to the same left/right edges
- A repeatable Phase A → Phase B batch QA process

**North star:** Build one system, then assemble pages from that system.  
**Platform rule:** Platform first; pages are content in slots.

---

## 2. System Consistency Charter (non-negotiables)

### 2.1 One page rhythm

Every section follows the same information order:

1. Page title (mast / header)  
2. Short purpose line  
3. Key stats and/or primary actions  
4. Main table, form, timeline, or content  
5. Supporting notes / scripture / help  

Archetypes change **presentation**, not this rhythm.

### 2.2 One table system

Budget, guests, vendors, ceremony, payments, contracts, catering sub-tables, etc. use the **same table engine**:

- Same empty state patterns  
- Same add / edit / delete control language  
- Same filter chrome patterns  
- Same export / print entry points  
- Same mobile fallback behavior  
- Same bulk-edit model (where enabled)

**Visual reference:** Payment Schedule table.  
**Technical source of truth:** existing CWP table descriptors / mounts — **extend CWP; do not invent a second table stack.**

### 2.3 One save / export language

Use these labels everywhere (pages must not invent synonyms):

| Action | Exact customer label |
|--------|----------------------|
| Autosave / reassurance | **Saved on this device** |
| SQLite backup download | **Download backup** |
| Table/section CSV | **Export CSV** |
| Print / PDF of section or table | **Print section** |
| Destructive clear | **Reset data** |

### 2.4 One visual hierarchy

Buttons, cards, tabs, filters, modals, banners, empty states, and pagination must feel identical across sections. A buyer must not feel that Ceremony, Budget, and Honeymoon came from different products.

### 2.4.1 One page rail and card-gap system

All main pages use the same outer content rails:

- Category/page section headers align to the same left and right edges as the cards, tables, and sections below them.
- Full-width sections use the shared page rail; they do not set their own arbitrary max-width or side padding.
- Grid rows may divide internally into columns, but the row itself must still start and end on the shared rails.
- Spacing between cards uses one shared row/column gap token, not page-specific gap values.
- Card inner padding may vary only by approved compact/default/dense variants in the UI System.
- Dashboard blocks, tracker pages, editorial pages, and category headers must all follow this same rail system.

### 2.5 One data model

Canonical record types (freeze **names and meanings** in Launch; deeper schema unification may wait for Enhancement):

- `guest`
- `vendor`
- `task`
- `payment`
- `event` (calendar / appointment / timeline as applicable)
- `note`
- `ceremony item` (and related ceremony arrays as already modeled)

Pages **reference** these records; they must not invent parallel fields with slightly different names for the same meaning.

### 2.6 One customer mode

Customer builds must hide developer complexity. Do **not** expose:

- “phase”, “mockup”, “engine”, internal class-driven jargon  
- Developer UI System panel  
- Internal registry/debug language  

**Allowed customer product name:** Database Hub (and named hubs: People, Vendors, Planning, Finances, Catering, Music) — these are user-facing workspaces, not internal jargon.

---

## 3. Scope tiers

### 3.1 Launch scope (must work for a sellable premium planner)

Include and standardize (do not cut these areas out of the product):

- Wedding profile and planner settings  
- Dashboard  
- Tasks and planning timeline  
- Guest list  
- Budget, payments, invoices, and contracts (incl. rentals as present)  
- Vendors  
- Calendar and appointments  
- Ceremony, reception, catering, music/speeches, photography/shot list, logistics  
- Notes, prayer journal, and covenant-centered content  
- Backup, restore, export, and print  

**Launch rule:** No new Launch feature enters the program unless it **replaces** an existing feature or **fixes a serious usability problem**.

### 3.2 Enhancement scope (IN THE PLAN — implement only after Phase B is stable)

- Advanced bulk editing **beyond** the shared bulk model  
- Multiple dashboard layouts / rearrangeable and resizable card systems as a **new product surface**  
- Complex calendar syncing  
- Seasonal palette libraries  
- Advanced file previews  
- Automated vendor review workflows  

### 3.3 Future scope (IN THE PLAN — later product versions only)

- Cloud accounts and synchronization  
- Vendor/client portals  
- Mobile app versions  
- AI recommendations  
- Collaborative planning  
- External calendar integrations  

### 3.4 One-in / one-out

When adding a substantial capability, state what is removed, simplified, deferred, or replaced (e.g. one Smart Calendar replaces scattered mini-calendars; one status primitive replaces per-page status colors).

---

## 4. Execution sequence (naming)

| Name | Meaning |
|------|---------|
| **Phase A — Foundation** | System infrastructure, contracts, registries, UI System, shell/tokens |
| **Phase B — Batches 1–5** | Standardize Launch pages onto Phase A contracts |
| **Enhancement tier** | After Phase B regression is stable |
| **Future tier** | Later product versions |

```text
Phase A — Foundation
        ↓
Phase B — Batch 1 → Batch 2 → Batch 3 → Batch 4 → Batch 5
        ↓ (regression gates between batches)
Enhancement tier
        ↓
Future tier
```

**Important:** Phase B **is** Batches 1–5. Do not skip Phase A. Do not run Batches 2–5 before Batch 1 exit criteria pass.

---

## 5. Phase A — Foundation (detailed)

**Goal:** Make the governing system real so Phase B pages assemble from contracts.  
**Do not:** redesign all pages in Phase A.  
**Do:** document, register, scaffold shared primitives, and ship a developer-only UI System.

### A1. Create / maintain this decision document

- Keep this file updated when decisions change.  
- Append to **§16 Decision log** rather than silently rewriting history.

### A2. Scope freeze (process)

- Treat §3 as binding for this program.  
- Reject PRs/changes that add Launch surface area without replace/fix justification.

### A3. Page registry (required)

Create a maintainable registry (JS module and/or documented table in-repo) with **every navigable page**:

| Field | Type / values | Required |
|-------|---------------|----------|
| `id` | panel id string (e.g. `guests`) | yes |
| `label` | customer-facing name | yes |
| `scopeTier` | `launch` \| `enhancement` \| `future` | yes |
| `archetype` | `dashboard` \| `tracker` \| `editorial` \| `calendarTimeline` \| `visualCollection` | yes |
| `status` | `todo` \| `in_progress` \| `standardized` \| `exception` | yes |
| `primaryAction` | string describing main CTA | yes |
| `usesCwpTable` | boolean + list of table keys | yes |
| `bulkMode` | `shared` \| `hubOnly` \| `disabled` + reason if disabled | yes |
| `hub` | `people` \| `vendors` \| `planning` \| `finances` \| `catering` \| `music` \| `none` | yes for trackers |
| `notes` | exceptions, multi-archetype tabs, etc. | optional |

**Initial assignment rules:**

- Guests, vendors, payments, tasks, contracts, rentals, party, gifts, catering tables, entertainment tables → **`tracker`**  
- Dashboard → **`dashboard`**  
- Instructions, FAQ, prayer, counseling, covenant foundation-style content → **`editorial`**  
- Smart calendar, appointments, wedding day timeline, logistics timelines → **`calendarTimeline`**  
- Vision board, color palette, galleries → **`visualCollection`**  
- Honeymoon / After: assign a **primary** archetype; if tabs differ, note secondary archetypes in `notes`

### A4. Official Tracker contract (LOCKED — from Claude customer download)

Every **tracker** page MUST implement this three-part layout:

#### A4.1 Inline full editor (on the page)

- Mount the **same full record editor fields** used by modal Full Edit / `openRecordEditor`.  
- Pattern reference: Claude file’s `cov-inline-editor`, `guest-inline-editor`, `covInlineEditorHTML`, `openRecordEditor(entity, index, null, { inline: mountId })`.  
- Supports **Add** and **Edit** in the same card (mode label updates).  
- Row selection / row click loads the record into the inline editor and scrolls it into view when appropriate.  
- **Multi-table pages** (e.g. catering): collapsible inline editors; **only one live editor at a time** (editor engine is a singleton).

#### A4.2 Shared CWP table in read-only preview

- Mount: `#cwp-<entity>` (or existing CWP mount id) with class **`ro-preview`**.  
- Header chrome includes:
  - **`ro-badge-inline`** text: `Read only`
  - Primary hub CTA: **`Edit in <Hub Name> Hub`** (`db-edit-btn` → `showDatabaseHub(...)`)
- Behavior:
  - Table **renders live** from CWP  
  - Cells are **not editable in place** (Claude CSS pattern: `pointer-events: none` on controls inside `.ro-preview` + overlay)  
  - Preview shows **core fields** suitable for scanning; Hub is for full-grid work  

#### A4.3 Hub workspace (same engine)

- Database Hub / named hubs remain **customer-facing**.  
- Hub provides full-grid editing, search, and **bulk** actions on the **same CWP engine**.  
- Hub is not a second visual design system.

```text
TRACKER PAGE
├── Mast / purpose
├── Stats / filters / primary actions
├── Inline full editor (all fields for one record)
├── CWP table.ro-preview (browse; not cell-editable)
└── CTA → Edit in <Hub> (full grid + bulk)
```

#### A4.4 Plan amendment: main editable pages + Budget

**Effective 2026-07-13:** the Tracker contract applies to every main customer-facing tracker/data-entry page, not only the first proof pages.

Every main customer-facing tracker/data-entry page gets:

- Inline full editor on the page  
- Read-only table/preview rows where applicable  
- Full editable Hub path  
- Shared QA checklist for row click, add, save, delete, save/add another, read-only preview, and Hub editing  

**Budget amendment:** Budget is no longer just a hybrid exception. Budget keeps its visual summary/snapshot structure, but it also gets an adapted inline editor for:

- Budget categories  
- Budget items  
- Planned/actual amounts  
- Payment/vendor links where applicable  

**True non-tracker exceptions:** Dashboard, Setup, FAQ, Guide, Email Templates, and Share Packets do not need the tracker inline editor. Visual/interaction-heavy pages such as Table Layout may remain exceptions only when the page registry documents why the tracker pattern does not fit that workflow.

Exceptions must be explicit in the registry (`status: exception` + `notes`). They should not be assumed because a page is complex.

### A5. Other archetype contracts

#### Dashboard
- Stat cards / progress / countdown / upcoming items  
- One dashboard layout in Launch/Phase B (multi-layout = Enhancement)  
- Uses shell, tokens, shared buttons/cards  

#### Editorial
- Readable content cards, section navigation, quotes/callouts, scripture footers  
- Used for Instructions, FAQ, prayer, counseling, covenant content  
- No inventing one-off card radii/shadows outside UI System  

#### Calendar / Timeline
- Date navigation, event cards, filters, timeline views  
- Shared chrome; no external calendar sync in Phase A/B  

#### Visual collection
- Image grids, upload areas, swatches, visual notes  
- Seasonal library expansion = Enhancement  

### A6. Developer-only UI System panel

**Requirements:**

- New panel (e.g. `#panel-ui-system`) listing approved:
  - Typography hierarchy  
  - Color tokens  
  - Buttons (primary / secondary / danger)  
  - Inputs, dropdowns, checkboxes  
  - Status controls  
  - Cards, stat cards  
  - Tables (Payment Schedule look)  
  - Bulk Edit card  
  - Filters  
  - Modals, toasts  
  - Empty states, pagination  
  - File-upload controls  
  - Icons  
  - Dark-mode examples  

**Visibility:**

- Developer HTML: `body` has developer-mode class when enabled  
- Dev-only nav + panel marked `.dev-only`  
- **Customer rebundle MUST strip/hide** developer-mode and `.dev-only` (including UI System)  

**Rule:** Nothing new ships on a planner page unless it already exists (or is being added first) in the UI System.

### A7. Lock global shell and spacing

Finalize and document:

- Top brand bar  
- Sidebar / category navigation  
- Page header / mast  
- Main content area (equal gutters; shared left/right edges for header, text, controls, cards)  
- Footer  

**Page rail rule:**

- Define one canonical content rail for every main panel.
- Page/category headers, mast blocks, cards, tables, hubs, stats bands, and full-width sections align to that same rail.
- Do not solve alignment by adding page-specific padding to individual cards or headers.
- If a page needs a narrower reading measure, constrain the text inside the shared rail, not the outer section edge.
- Use the shared grid/card gap token for horizontal and vertical spacing between cards.

**Spacing scale (use only these):**

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```

**Standard sizes:**

| Token concept | Value |
|---------------|-------|
| Card padding | 24px |
| Card row/column gap | 24px unless compact/dense variant is documented |
| Page section gap | 32px |
| Input height | 40px |
| Primary button height | 40px |
| Compact table row | ~40–44px |
| Icon-button size | 36px |
| Border radius | one or two approved values only |
| Modal widths | small / medium / large categories |

**CSS layering rule (engineering):**

1. Tokens  
2. Primitives (type, buttons, forms, tables)  
3. Page shell (gutters, mast, scripture, section rhythm)  
4. Feature CSS  
5. Theme (light/dark)  

Avoid new global layout `!important` rescue files. Prefer fixing shell/primitives.

### A8. One table system — technical rules

1. **Payment Schedule** remains the **visual** reference.  
2. **CWP table descriptors** remain the **technical** source of truth.  
3. Do **not** create a parallel `.data-table` framework that forks away from CWP.  
4. Page-specific classes may only handle legitimate differences (column widths, linked-record behavior).  
5. Avoid maintaining separate appearance systems via `.guest-table`, `.vendor-table`, etc. for general look — migrate appearance to shared CWP/editorial table styling over Phase B.  
6. Sub-tables (catering menu, beverages, rentals, etc.) use the **same** engine and RO/Hub/inline rules.

### A9. Bulk Edit — system-level pattern

- One shared bulk interaction model: selection count, select all, clear, edit, delete, clone (where allowed), confirmation, save, re-render, toast.  
- Each table descriptor declares **allowed bulk actions**.  
- Bespoke bulk bars remain only where the engine marks `bulk: { enabled: false }` **and** the reason is documented in the bulk registry.  
- On tracker pages, bulk primarily lives in **Hub** when `bulkMode` is `hubOnly`; page may still show selection affordances only if consistent with UI System.

Maintain a **bulk action registry** mapping table keys → allowed actions + exceptions.

### A10. Status meanings (semantic primitive)

Define a limited set of categories. Pages must not invent colors for the same meaning.

**Progress:** Not Started, In Progress, Complete, On Hold  

**Payment:** Not Paid, Partially Paid, Payment Due, Paid, Overdue  

**Response:** Awaiting Response, Confirmed, Declined, Maybe  

**Document:** Missing, Received, Reviewed, Signed  

Each status has consistent: label, background, text color, optional icon, dark-mode appearance — via one shared status primitive used by UI System and pages.

Map existing RSVP / payment / task labels onto these semantics during Phase B (document mapping table in registry or this file’s appendix when implemented).

### A11. Print / PDF contract (Launch capability; design from Essentials)

**Customer need:** Print button for each table (including sub-tables) into a PDF template design.

**Visual / template source of truth:**

```
_CUSTOMER-DOWNLOAD-ESSENTIALS/The-Covenant-Wedding-Planner-Essentials/
```

| File | Maps toward |
|------|-------------|
| `01-Quick-Start-Guide.html` | Instructions / onboarding print |
| `02-Couple-Profile-And-Covenant-Foundation.html` | Setup / covenant content print |
| `03-Wedding-Budget-Planner.html` | Budget print |
| `04-Vendor-Tracker.html` | Vendors print |
| `05-Guest-List.html` | Guests print |
| `06-Day-Of-Timeline.html` | Wedding day timeline print |
| `07-Honeymoon-Planner.html` | Honeymoon print |
| `08-United-As-One.html` | Covenant / after content print |

**Implementation rules:**

- Shared **Print section** action available for tables/sub-tables via the table system (descriptor-driven).  
- Template chrome (palette, page shell, headers, `@media print`) follows Essentials — forest/gold/linen language already present there.  
- Pages supply **data + columns**; they do not invent one-off print UIs.  
- Prefer print stylesheet / Print → Save as PDF aligned to Essentials first; richer PDF generators later must reuse the same template tokens.  
- Print is Launch-scope capability; polish of every template can roll with the page’s Phase B batch.

### A11.1 Universal shared print-template selector amendment

The shared **Print Section** selector must connect to the same new print template for every customer-facing planner page. The selector currently covers Dashboard, Smart Calendar, Budget, Guest List, Vendors, Ceremony & Reception, Entertainment, Essentials Checklist, and Share Packets. Add the missing page targets:

- Wedding Setup
- Payments
- Planning Timeline / Tasks
- Appointments
- Contracts
- Catering
- Gifts
- Wedding Party
- Honeymoon / After
- Logistics
- Notes
- Prayer Journal
- Premarital Counseling
- Design / Mood Board
- Photography Shot List
- Venue
- Table Layout
- Email Templates
- Guide
- FAQ

**Acceptance criteria:**

- Every listed target appears in the shared selector with one stable, customer-readable label.
- Selecting a target opens the shared new print template, not a page-specific legacy print path.
- Each target maps the correct page sections and applicable sub-tables into the template.
- Existing special print outputs (Day-Of Timeline, program, menu, labels, thank-you list, and similar artifacts) remain available where they are intentionally distinct, but do not replace the shared page-print option.
- Print labels are normalized to **Print page** for the shared selector action and **Print section** only for scoped table/sub-table actions.
- Each target receives manual print QA for content inclusion, page breaks, headers/footers, empty states, and usable Save as PDF output.
- The developer editable version and customer download version expose the same customer-facing selector coverage; the UI System page remains developer-only.

### A12. Decorative variation bounds

Allowed:

- Muted accent per nav category  
- Page-specific icon color within muted palette  
- Botanical artwork only in approved locations  

Not allowed:

- Unique card borders/shadows/radii per page  
- Full-page background color schemes that break shell unity  
- One-off button styles  

### A13. Engineering enforcement (Phase A scaffolding)

Implement as feasible in Phase A (complete early in Phase B if needed):

1. **Panel render registry:** `showPanel(id)` always calls registered `render` for that page (prevents empty lists like FAQ boot-only bugs).  
2. **Long-term:** reduce runtime layout mutation (`canonicalizeEditorialUI` stripping heroes, etc.) page-by-page; prefer stable HTML slots.  
3. **Static checks** (scripts or documented manual checklist):
   - Every nav page has a registry entry + archetype  
   - Every CWP table has explicit `bulkMode`  
   - Customer bundle contains no `developer-mode`, `.dev-only`, or `panel-ui-system`  
4. **CSS:** prefer shell/token fixes over new rescue overrides.

### A14. Phase A exit criteria

Phase A is done only when ALL are true:

- [ ] This plan file exists and decision log is current  
- [ ] Page registry exists with every Launch page assigned archetype + status + bulkMode + hub  
- [ ] Bulk action registry exists (even if some rows are `todo`)  
- [ ] UI System panel exists in developer build and is stripped from customer rebundle  
- [ ] Shell + spacing tokens documented and applied to shell chrome  
- [ ] Tracker / RO / Hub / inline editor contract documented and referenced by registry  
- [ ] Status primitive stub or documented mapping exists  
- [ ] Save/export/print labels documented; Print contract references Essentials paths  
- [ ] Customer-mode jargon rule documented for rebundle  
- [ ] Team/agent can start **Phase B Batch 1** without inventing new patterns  

---

## 6. Phase B — Batches 1–5 (detailed)

**Goal:** Bring Launch pages onto Phase A contracts.  
**Rule:** After each batch, run **§7 Batch QA** and update the regression audit before starting the next batch.  
**Principle:** Remove nothing of product value — merge, hide, or standardize duplicates.

### 6.0 Shared Phase B page checklist (every page)

**Structure**

- [ ] Uses assigned archetype  
- [ ] Uses global shell (mast, gutters, footer)  
- [ ] Page/category header, sections, cards, tables, and full-width rows align to the same left/right rails  
- [ ] Card rows use the shared card gap; no page-specific uneven spacing between cards  
- [ ] Uses standardized cards/controls from UI System  
- [ ] Clear primary action  

**If tracker**

- [ ] Inline full editor present and wired  
- [ ] CWP `.ro-preview` table with Read only badge  
- [ ] Edit in Hub CTA works  
- [ ] Bulk mode matches registry  
- [ ] Row click opens the same record in the inline editor  
- [ ] Add, save, save/add another, and delete work from the inline editor  
- [ ] Read-only preview blocks row-field editing while preserving toolbar, auto-fit, pagination/View all, and Hub controls  
- [ ] Hub table remains fully editable for the same data  

**Functionality**

- [ ] Add, edit, save, delete work  
- [ ] Filters work (if applicable)  
- [ ] Bulk works per registry  
- [ ] Pagination works (if applicable)  
- [ ] Calculations update  
- [ ] Data persists after refresh  
- [ ] Empty states work  
- [ ] Print section works for main table / sub-tables as scoped  
- [ ] Shared Print page selector target is present and routes to the new print template  

**Visual**

- [ ] Typography, spacing, icons, buttons, tables, statuses match UI System  
- [ ] Dark mode complete  

**Responsive**

- [x] Desktop, narrow laptop, tablet, mobile fallback  
- [x] No unintended page-wide horizontal scrolling  

---

### Phase B — Batch 1: Foundation pages

**Purpose:** Establish nearly every major shared component.

| Page / surface | Archetype | Implementation focus |
|----------------|-----------|----------------------|
| Global shell | — | Apply shell + gutters + footer tokens; equal header/body/card/table edges and shared card gaps |
| UI System panel | dev-only | Populate with real Batch 1 components |
| Dashboard | `dashboard` | Stats, progress, upcoming; **one** layout only |
| Guest List | `tracker` | Inline guest editor + `#cwp-guests.ro-preview` + People Hub |
| Budget | `tracker` | Adapted inline category/item editor + CWP/shared patterns; keep visual snapshot and print maps to Essentials budget |
| Payments | `tracker` | **Payment Schedule = visual SoT**; inline + RO preview + Finances Hub |

**Batch 1 also delivers:**

- Shared status usage on payment/guest response fields where applicable  
- Export CSV + Print section entry points on these tables  
- Bulk registry rows for guests/payments/budget tables  

**Batch 1 exit criteria:**

- [x] Guests, Payments, Budget, Dashboard feel like one product  
- [x] Payment Schedule look is the table reference others will copy  
- [x] Tracker contract proven on at least Guests + Payments  
- [x] UI System updated  
- [x] §7 QA passed; regression audit updated  

**Batch 1 implementation pass (Codex):**

- [x] Shared inline record-editor mode added to the central record editor engine.  
- [x] Guest List uses inline guest editor + `#cwp-guests.ro-preview` + People Hub CTA.  
- [x] Payments uses inline payment editor + `#cwp-payments.ro-preview` + Finances Hub CTA.  
- [x] UI System panel includes the real Batch 1 tracker contract proof.  
- [x] Customer Download Version rebundled from the Developer Editable Version.  
- [x] Manual visual/browser QA across Dashboard, Budget, Guests, and Payments before starting Batch 2. Completed 2026-07-13; see `REGRESSION-AUDIT.md`.  

---

### Phase B — Batch 2: Financial and vendor workflows

| Page | Archetype | Focus |
|------|-----------|-------|
| Contracts | `tracker` | RO + Finances Hub; sub-table print rules |
| Invoices / Rentals (as present) | `tracker` | Same engine; RO + Hub |
| Vendors | `tracker` | Inline vendor editor + RO + Vendors Hub |
| Venue | per registry | Standardize to shell + shared cards/tables |
| Catering | `tracker` (multi-table) | Collapsible inline editors per sub-table + Catering Hub; each `#cwp-*` uses `.ro-preview` |

**Batch 2 implementation progress (2026-07-13):**

- [x] Contracts page now uses the Phase B tracker shell: inline contract/invoice editor, full `#cwp-contracts.ro-preview`, and Finances Hub edit handoff.  
- [x] Rentals now uses the same page-level pattern: inline rental editor, full `#cwp-rentals.ro-preview`, and Finances Hub edit handoff.  
- [x] Live browser QA confirmed Contracts/Rentals preview rows are read-only, toolbar controls remain clickable, row click opens inline editors, and Finances Hub Contracts/Rentals rows remain editable.  
- [x] Vendors page inline editor + RO preview + Vendors Hub pass.  
- [x] Shared CWP `.ro-preview` behavior tightened so page previews suppress add/bulk controls while preserving search/filter, Auto-fit, column filters, pagination/View all, and Hub controls.  
- [x] Venue page shell/shared table standardization: shared mast, preserved venue detail/shortlist cards, editable Vendor Comparisons table on-page, Vendors Hub editable handoff, and borderless Venue card shells.  
- [x] Catering multi-table inline editor + `#cwp-* .ro-preview` pass: shared Catering inline editor with table tabs, seven read-only CWP preview mounts, row-click-to-edit, Catering Hub handoff, and borderless Catering card shells.  

**Batch 2 exit criteria:**

- [x] Vendor + catering multi-table inline pattern matches Claude contract  
- [x] Finances Hub covers payments/contracts/rentals editing paths  
- [x] §7 QA passed; regression audit updated  

---

### Phase B — Batch 3: Scheduling

| Page | Archetype | Focus |
|------|-----------|-------|
| Tasks / Planning Timeline | `tracker` | RO preview + Planning Hub; keep presets (12-month, checklist) |
| Appointment Tracker | `calendarTimeline` / `tracker` per registry | Shared filters + CWP if applicable |
| Smart Calendar | `calendarTimeline` | Stabilize current product; **no** complex/external sync (Enhancement) |
| Wedding Day Timeline | `calendarTimeline` | Shared chrome; print maps toward Essentials day-of |

**Batch 3 implementation progress (2026-07-13):**

- [x] Tasks / Planning Timeline now uses the main editable page rule: inline full task editor on page, `#cwp-tasks.ro-preview` read-only preview rows, and Planning Hub handoff for full editable spreadsheet/bulk work.  
- [x] Tasks presets are preserved in the page chrome: `Load 12-Month Timeline` and `Load Full Checklist`.  
- [x] Live browser QA confirmed Tasks row click loads the inline editor, no-change save re-renders cleanly, preview toolbar/pager controls remain enabled, preview row controls are read-only, and Planning Hub Tasks rows remain editable.  
- [x] Appointment Tracker now keeps the smart scheduling view while adding inline full appointment editor, `#cwp-appointments.ro-preview` read-only preview rows, shared filters/search, and Planning Hub handoff for full editable spreadsheet/bulk work.  
- [x] Live browser QA confirmed Appointment row click loads the inline editor, no-change save re-renders cleanly, preview row controls are read-only, Auto-fit remains enabled, the page no longer overflows horizontally, and Planning Hub Appointments rows remain editable.  
- [x] Smart Calendar stabilization pass: Month/Week/Agenda product preserved, source language tightened, local `.ics` export retained, external calendar connection kept out of launch scope, and calendar cards/layout contained to the shared rail without hairline card outlines.  
- [x] Live browser QA confirmed Smart Calendar source filtering, Month/Week/Agenda modes, create/edit modal, local `.ics` path, shared rail alignment, and no page-wide horizontal overflow.  
- [x] Wedding Day Timeline shared chrome/print mapping pass: page now has header Print Day-Of and Planning Hub actions, Day-Of Details uses the full inline `#cwp-wdayTimeline` editor, synced vendor arrivals stay source-linked/read-only, and Print Day-Of maps to an Essentials-style handoff.  
- [x] Live browser QA confirmed Timeline dashboard entry, Day-Of Details tab, visible CWP headers/rows, Auto-fit and shared bulk controls, Planning Hub route, borderless card shells, and no page-wide horizontal overflow.  

**Batch 3 exit criteria:**

- [x] Scheduling pages share shell/filter/timeline language  
- [x] No Enhancement calendar-sync work slipped in  
- [x] §7 QA passed; regression audit updated  

---

### Phase B — Batch 4: Wedding details

| Page | Archetype | Focus |
|------|-----------|-------|
| Wedding Party | `tracker` | People Hub path; inline + RO |
| Ceremony & Reception | `tracker` / `editorial` per registry | Inline + RO/Hub as applicable |
| Music & Speeches | `tracker` | Music Hub; RO mounts for entertainment/songs/playlist/speeches |
| Photo Shot List | `tracker` | Shared table contract |
| Wedding Weekend Logistics | `calendarTimeline` / `tracker` | Shared shell + tables |

**Batch 4 implementation progress (2026-07-14):**

- [x] Wedding Party now follows the main editable page rule: full inline party member editor on-page, `#cwp-party.ro-preview` read-only tracker rows, Import/Export actions, and People Hub handoff for full editable spreadsheet/bulk work.  
- [x] Live browser QA confirmed Wedding Party opens from the People nav, preview row click loads the inline editor, no-change save re-renders cleanly, preview rows stay read-only while Auto-fit/filter controls remain enabled, and People Hub rows remain editable.  
- [x] Ceremony & Reception now mounts the seven ceremony sub-trackers as full editable CWP tables on the page (`ceremonyOrder`, processional, recessional, scriptures, checklist, reception details, and traditions), with direct Ceremony Hub handoffs for spreadsheet/bulk work. Vows/Rings remains a documented native editorial form exception.  
- [x] Live browser QA confirmed Ceremony opens from the visible nav, CWP headers and editable row controls render on-page, Order of Worship tab switching works, Ceremony Hub opens with Order of Service selected and editable, Auto-fit is available, and the page has no document-level horizontal overflow.  
- [x] Music & Speeches now follows the tracker contract with one shared inline editor that switches between Entertainment Vendors, Reception Music Cues, Speeches, Reception Playlist, and Do-Not-Play Songs; the tabbed CWP tables on-page are read-only previews with row-click-to-inline editing and Music Hub handoffs.  
- [x] Live browser QA confirmed Music opens from the visible nav, the inline editor initializes, all five read-only CWP previews render headers/rows with Auto-fit enabled, Reception Cue row click loads the cue into the inline editor with the correct tab/label, no-change save preserves the inline editor, Music Hub opens the editable cue table, and the page has no document-level horizontal overflow.  
- [x] Photo & Video Shot Lists now follows the tracker contract with one shared inline editor that switches between Photo Shot List and Video Shot List, read-only CWP previews for both tables, row-click-to-inline editing, and Design Hub handoffs for full editable spreadsheet/bulk work.  
- [x] Live browser QA confirmed Photo and Video tabs initialize the correct inline editor, preview table headers render visibly, preview row controls stay read-only while Auto-fit remains enabled, Photo and Video row click load the correct inline record, no-change saves preserve the editor, Video opens in Design Hub as a fully editable table, and the page has no document-level horizontal overflow.  
- [x] Wedding Weekend Logistics now follows the tracker contract for its five launch logistics tables with one shared inline editor that switches between Weekend Timeline, Travel & Accommodations, Hotel Blocks, Transportation, and Family/VIP Care; on-page CWP previews are read-only and Logistics Hub owns full editable/bulk table work.  
- [x] Live browser QA confirmed Logistics opens from global search, Weekend/Travel/Hotels/Transportation/VIP initialize the correct inline editor, all five preview tables render visible headers/rows with Auto-fit enabled and disabled row controls, preview row clicks load the correct inline record, VIP opens in Logistics Hub as a fully editable table, and the page has no document-level horizontal overflow.  

**Batch 4 exit criteria:**

- [x] Party/ceremony/music/shotlist/logistics standardized or documented exceptions  
- [x] §7 QA passed; regression audit updated  

---

### Phase B — Batch 5: Content, inspiration, after

| Page | Archetype | Focus |
|------|-----------|-------|
| Prayer Journal | `editorial` | Content cards, quotes, callouts |
| Premarital Counseling | `editorial` | Same editorial system |
| Notes | `editorial` / `tracker` per registry | |
| Vision Board | `visualCollection` | Grids/uploads; no seasonal library expansion |
| Color Palette | `visualCollection` | Swatches; no seasonal library expansion |
| Honeymoon / After | primary + notes | Print maps toward Essentials honeymoon; tabs documented |
| Instructions / Get Started | `editorial` | Onboarding; print maps toward quick start |
| FAQ | `editorial` | Match editorial contract; ensure `renderFAQ` on `showPanel('faq')` |

**Batch 5 implementation progress (2026-07-14):**

- [x] Prayer Journal now follows the Batch 5 editorial/data-entry pattern with devotional focus cards, one on-page inline full editor, `#cwp-prayer.ro-preview` read-only journal rows, and Faith Hub handoff for full editable single-row work while bulk remains intentionally disabled.  
- [x] Live browser QA confirmed Prayer Journal opens from global search, inline editor initializes, read-only CWP preview renders visible headers/rows with Auto-fit enabled and disabled row controls, preview row click loads the inline editor, no-change save preserves the editor/preview, Faith Hub opens Prayer Journal editable without `.ro-preview`, and the page has no document-level horizontal overflow.  
- [x] Premarital Counseling now follows the Batch 5 editorial/data-entry pattern with the guided curriculum preserved, one on-page inline full session editor, `#cwp-counseling.ro-preview` read-only session rows, and Faith Hub handoff for full editable single-row work while bulk remains intentionally disabled.  
- [x] Live browser QA confirmed Premarital Counseling opens from the visible Start Here navigation, inline editor initializes, read-only CWP preview renders visible headers/rows with Auto-fit enabled and disabled row controls, preview row click loads the inline editor, no-change save preserves the editor/preview, Faith Hub opens Counseling Sessions editable without `.ro-preview`, no row selectors/bulk buttons appear, and the page has no document-level horizontal overflow.  
- [x] Notes now follows the Batch 5 hybrid editorial/data-entry pattern with quick notes, visual note cards, and long-form note areas preserved, plus one on-page inline Notes Tracker editor, `#cwp-notesDetails.ro-preview` read-only tracker rows, and Planning Hub handoff for full editable table work with shared bulk actions.  
- [x] Live browser QA confirmed Notes opens from the visible Planning navigation, inline editor initializes, read-only CWP preview renders visible headers/rows with Auto-fit enabled and disabled row controls, preview row click loads the inline editor, no-change save preserves the editor/preview, Planning Hub opens Notes Tracker editable without `.ro-preview`, row selectors/bulk buttons appear only in the Hub, card hairline borders are removed, and the page has no document-level horizontal overflow.  
- [x] Vision Board now follows the Batch 5 visual-collection/data-entry pattern with native palette, inspiration card, gallery, and favorite-detail tools preserved, plus one on-page inline Vision Details editor, `#cwp-moodItems.ro-preview` read-only tracker rows, and Design Hub handoff for full editable table work with shared bulk actions.  
- [x] Live browser QA confirmed Vision Board opens from the visible Design & Details navigation, the Details tab initializes the inline editor, read-only CWP preview renders visible headers/rows with Auto-fit enabled and disabled row controls, preview row click loads the inline editor, no-change save preserves the editor/preview, Design Hub opens Vision Board Items editable without `.ro-preview`, row selectors/bulk buttons appear only in the Hub, old custom bulk controls are removed, card hairline borders are removed, and the page has no document-level horizontal overflow.  
- [x] Color Palette now follows the shared visual-collection treatment: seasonal/preset palette sections, custom palette builder, saved palette specifications, nested swatch cards, and the shared borderless card/gutter rules remain intact without adding a new seasonal library surface.  
- [x] Live browser QA confirmed the Color Palette tab opens from Vision Board, preset and seasonal controls render, saved-palette specification inputs preserve read-only/editable behavior by palette type, nested palette cards have no hairline borders or shadows, palette rails remain inside the page shell, and the palette has no document-level horizontal overflow.  
- [x] Honeymoon / After now follows the primary tracker pattern for Details, Transportation, Itinerary, Packing, and Honeymoon Budget: one shared on-page inline editor, read-only CWP preview rows with active table controls, row-click editing, and a shared Honeymoon / After tracker tab model. Overview and Daily Journal remain specialized surfaces.  
- [x] Live browser QA confirmed Honeymoon / After opens from planner search, Details row click loads the inline editor, Transportation and Budget tabs switch the editor and preview table correctly, budget new-record fields are present, preview headers remain visible, preview rows are non-interactive, and the page has no document-level horizontal overflow.  
- [x] Instructions / Get Started now follows the editorial page contract: onboarding remains a non-tracker exception, while the live masthead, scripture footer, welcome card, guided path, templates, Essentials hub, checklist, learning grids, and action cards share the same page rails, borderless treatment, and spacing tokens.  
- [x] Live browser QA confirmed Get Started opens from planner search, all onboarding sections render, dynamic onboarding mounts remain inside the shared rails, sampled cards have no borders or shadows, and the page has no document-level horizontal overflow.  
- [x] FAQ now follows the editorial page contract: dynamic answer cards, category controls, search, quick-help panel, and scripture footer use the shared rails, spacing, and borderless treatment; FAQ remains a non-tracker exception.  
- [x] Live browser QA confirmed FAQ opens through its visible search result, 45 answer cards and six category controls render, search filtering returns matching answers, the page remains within the shared rails, and there is no document-level horizontal overflow.  

**Batch 5 / Phase B exit criteria:**

- [x] All Launch pages `standardized` or documented `exception` in registry  
- [x] Customer rebundle still strips UI System / dev-only  
- [x] Full §8 Test plan smoke passed for the completed Batch 5 surfaces  
- [x] Regression audit updated for Batch 5  
- [ ] Enhancement tier may begin only after product owner sign-off  

**Batch 5 gate note:** Final live-browser smoke passed for Prayer Journal, Counseling, Notes, Vision Board / Color Palette, Honeymoon / After, Get Started, and FAQ. Batch 6 then closed the last remaining in-progress Launch tracker, Gift Log; the overall Phase B exit gate can now be reviewed before enhancement work begins.

### Phase B — Batch 6: Essentials and remaining design trackers

**Implementation progress:**

- [x] Essentials Checklist now uses the main editable page rule: inline full checklist-item editor, `#cwp-essentials.ro-preview` read-only rows, preserved packing progress/preset tools, and Design Hub handoff for full spreadsheet/bulk editing.
- [x] Live browser QA confirmed Essentials opens from planner search, visible CWP headers render, row controls are read-only while Auto-fit and filter controls remain enabled, the inline editor is present, the Design Hub CTA is present, and the page has no document-level horizontal overflow.
- [x] Gift Log now uses the main editable page rule: inline full gift editor, `#cwp-gifts.ro-preview` read-only rows, preserved thank-you dashboard/filter/print tools, and Design Hub handoff for full spreadsheet/bulk editing.
- [x] Live browser QA confirmed Gift Log opens from planner search, visible CWP headers render for all ten fields, the inline editor is present, preview row controls are read-only while Auto-fit and filter controls remain enabled, the Design Hub CTA is present, and the page has no document-level horizontal overflow.

---

## 7. Batch QA gate (mandatory between Phase B batches)

Before starting the next batch:

1. Run structure / function / visual / responsive checks in §6.0 for every page touched in the batch.  
2. Update `REGRESSION-AUDIT.md` (or equivalent) with pass/fail notes, date, and known non-blockers.  
3. Confirm no new Launch features were added without replace/fix justification.  
4. Confirm UI System still reflects any new shared components introduced.  
5. Confirm customer rebundle checklist still passes (no UI System leak).

**Fail the gate → fix before next batch. Do not “carry forward” broken contracts.**

---

## 8. Test plan (program-level)

### 8.1 Static checks

- [x] JS syntax check after implementation waves  
- [x] Customer bundle does not contain `developer-mode`, `dev-only`, or `panel-ui-system`  
- [x] Every navigation page has registry entry + archetype  
- [x] Every CWP table has explicit `bulkMode`  
- [ ] Print actions do not use alternate labels for the same action  

### 8.2 Functional smoke

- [x] Setup, dashboard, guests, budget, payments, vendors, contracts, ceremony, calendar, notes/prayer  
- [ ] Backup / restore, export CSV, print section  
- [ ] Bulk: select none / one / many, clear, apply edit, delete with confirm, persistence after refresh  
- [x] Status changes: shared colors/labels in light and dark mode
- [ ] Tracker: inline add/edit, RO preview not cell-editable, Hub edit path works  

### 8.3 Visual QA

- [ ] Desktop, narrow laptop, tablet, mobile  
- [ ] No unintended page-wide horizontal scrolling  
- [ ] Tables, filters, bulk cards, buttons, modals, empty states, footer match UI System  
- [ ] Page/category headers, body sections, cards, tables, and grid rows share the same left/right rails  
- [ ] Spacing between cards is even and uses the shared card gap token  

### 8.4 Print QA

- [ ] Print section from Guest / Budget / Vendor / Timeline-style tables produces Essentials-aligned layout  
- [ ] Sub-tables printable where registry says so  
- [ ] Every customer-facing page is available from the shared Print page selector  
- [ ] Every selector target opens the new shared print template with the correct page content  
- [ ] Manual print QA passes for each selector target, including page breaks, headers/footers, empty states, and Save as PDF output  
- [ ] Background graphics / color guidance documented for users if required (as in Essentials quick start)  

---

## 9. Enhancement tier (detailed — after Phase B)

**Gate:** Phase B complete + regression stable + owner approval.

| Item | Description | Must still obey |
|------|-------------|-----------------|
| Advanced bulk beyond shared model | Extra bulk operations not in the shared descriptor set | One bulk framework; extend descriptors |
| Multiple dashboard layouts / rearrangeable cards | New dashboard product surface | UI System; shell; one-in/one-out |
| Complex calendar syncing | Deeper sync behavior beyond current Smart Calendar | calendarTimeline archetype |
| Seasonal palette libraries | Expanded visualCollection content | visualCollection contract |
| Advanced file previews | Richer attachment/preview UX | Shared primitives |
| Automated vendor review workflows | Guided vendor evaluation beyond tracker | tracker + Vendors Hub |

Do **not** start these during Batches 1–5.

---

## 10. Future tier (detailed — later product versions)

| Item | Notes |
|------|-------|
| Cloud accounts and synchronization | Out of offline-first Launch promise until deliberately revisited |
| Collaborative planning | Multi-user |
| Vendor/client portals | External roles |
| Mobile app versions | Native/responsive apps beyond current mobile fallback |
| AI recommendations | Not part of consistency program |
| External calendar integrations | Distinct from in-app Smart Calendar |

---

## 11. Interfaces and build behavior

### 11.1 Developer visibility convention

- Developer HTML uses a **developer-mode** body class when enabled.  
- Developer-only nav items and panels use **`.dev-only`**.  
- Customer rebundling **removes** developer-mode and strips/hides `.dev-only` content.  
- UI System must not appear in customer output.

### 11.2 Central page registry

Maintain registry with fields listed in §A3.  
`showPanel` should resolve render via registry.

### 11.3 Bulk action registry

Map table keys → allowed actions; document exceptions with reasons.

### 11.4 Rebundle

Keep existing rebundle flow as shipping path. Verify UI System absence in customer artifact.

---

## 12. Assumptions

1. Launch product remains **broad and premium**; this plan controls **consistency**, not cutting major planner areas.  
2. **Database Hub** (and named hubs) remain **customer-facing** as full-table / bulk-edit workspaces on CWP.  
3. **UI System** is developer-facing only.  
4. **Bulk Edit** remains a premium customer-facing feature, centrally governed through CWP or a documented exception.  
5. **“Remove nothing”** is the implementation principle: weak or duplicated behavior is merged, hidden, or standardized — not silently deleted as product features. Dead duplicate code paths may be removed only after the page is on the standard contract.  
6. Working tree is Strategy Roadmap Build - Codex `01 Developer Editable Version`; Claude HTML in that same folder is **reference** for tracker UX; Essentials HTML is **reference** for print/PDF design.  
7. Tracker official contract = **inline full editor + RO CWP preview + Hub** (locked).  

---

## 13. Limit decorative variation (quick reference)

- Category muted accents OK  
- Same icon line weight/dimensions  
- Botanical art only in approved slots  
- Cards: no unique borders/shadows/radii outside UI System  
- Accents for icons/small headings/progress/selected controls — not whole page backgrounds  

---

## 14. Stop modifying stable components page-by-page

Shared components (checkbox, delete icon, pagination, buttons, RO overlay, inline editor chrome, status pills/rectangles, modals) are edited **centrally**. A checkbox fix on Guests must not leave Tasks/Vendors/Payments broken or divergent.

---

## 15. Remove-nothing / merge rules

When two behaviors exist (legacy editable wide table vs RO+Hub+inline):

1. Prefer the **Tracker contract** (§A4).  
2. Migrate data and features forward.  
3. Hide or delete only obsolete UI paths after parity.  
4. Document exceptions in the page registry (`status: exception` + `notes`).

---

## 16. Decision log (locked)

| Decision | Value |
|----------|-------|
| Working tree | Strategy Roadmap Build - Codex `01 Developer Editable Version` (absolute path in §0) |
| Tracker reference build | Claude `Customer Download - Claude.html` (same working-tree folder) |
| Print visual SoT | `_CUSTOMER-DOWNLOAD-ESSENTIALS/The-Covenant-Wedding-Planner-Essentials/` |
| Table visual SoT | Payment Schedule |
| Table technical SoT | CWP descriptors / mounts |
| Tracker contract | Inline full editor + `.ro-preview` CWP table + Edit in Hub |
| Bulk Edit | System pattern via CWP; Hub primary for multi-row on trackers |
| Database Hub | Remains customer-facing |
| UI System | Developer-only; stripped on rebundle |
| Status controls | Shared semantic primitive (see §A10) |
| Save/export labels | Saved on this device / Download backup / Export CSV / Print section / Reset data |
| Phase naming | Phase A Foundation → Phase B Batches 1–5 → Enhancement → Future |
| Enhancement items | Listed in §3.2 / §9; not built in Phase A/B |
| Future items | Listed in §3.3 / §10 |
| Launch breadth | Keep premium areas; standardize rather than cut |
| Remove-nothing | Merge/hide/standardize; no silent product deletion |
| Fonts (current editorial direction) | Body Inter; editorial headings Cormorant (reopen only for usability/brand cause) |
| Dark mode | Layered charcoal surfaces, not pure black |
| Cards | Approved radius/shadow only via UI System |
| Page rails and card gaps | Category/page headers, sections, cards, tables, and grid rows align to shared left/right rails; inter-card spacing uses one shared gap token |
| One-in/one-out | Required for substantial additions |

*Do not reopen a logged decision without a clear usability or product reason recorded here.*

---

## 17. Suggested implementation order for agents

1. **Write/confirm registries** (pages + bulk) as code or structured data.  
2. **UI System panel** + developer-mode / `.dev-only` + rebundle strip.  
3. **Shell/token pass** on chrome only.  
4. **Prove Tracker contract** on Guests + Payments (Batch 1).  
5. Continue Batch 1 → gate → Batch 2 → … → Batch 5.  
6. Stop. Await approval for Enhancement.

---

## 18. Out of scope for this program

- Building Enhancement or Future features during Phase A/B  
- Creating a second table framework beside CWP  
- Shipping UI System to customers  
- Big-bang renames of all `*-table` classes in one PR without batch migration  
- Full schema normalization as a blocker for Phase B (freeze meanings first; deepen later)  

---

## 19. Appendix — Essentials print file list

Absolute-ish repo path:

`_CUSTOMER-DOWNLOAD-ESSENTIALS/The-Covenant-Wedding-Planner-Essentials/`

1. `01-Quick-Start-Guide.html`  
2. `02-Couple-Profile-And-Covenant-Foundation.html`  
3. `03-Wedding-Budget-Planner.html`  
4. `04-Vendor-Tracker.html`  
5. `05-Guest-List.html`  
6. `06-Day-Of-Timeline.html`  
7. `07-Honeymoon-Planner.html`  
8. `08-United-As-One.html`  

These are printable HTML templates (browser Print → Save as PDF). Interactive planner print output must match their design language.

---

## 20. Appendix — Claude tracker reference behaviors to preserve

From `The Covenant Wedding Planner - Customer Download - Claude.html`:

- `openRecordEditor(..., { inline: mountId })`  
- `covInlineEditorHTML` / `COV_INLINE_META` (collapsible for multi-table)  
- `guest-inline-editor-wrap` / `vendor-inline-editor-wrap`  
- `.ro-preview` + `.ro-badge-inline` + `db-edit-btn` / `showDatabaseHub(...)`  
- CSS: read-only preview renders live but cannot be edited in place  

Implementers should inspect that file when porting tracker behavior into the other panels/JS of this same Codex working tree.

---

**End of System Consistency Plan**
