# Covenant Wedding Planner — Design System

**Version 1.8 · 2 August 2026**

---

## How this document relates to the HTML spec

This file and `Covenant Design Spec.dc.html` split the system between them. **They do not
overlap, so they cannot drift.**

| | Owns | Examples |
|---|---|---|
| **`Covenant Design Spec.dc.html`** | Everything **measurable** | colour values, radii, padding, sizes, weights, tracking, states, the component drawings |
| **This file** | Everything **unmeasurable** | what a colour *means*, when to use one variant over another, naming, decisions and their reasoning, scope |

**Rule for this file: no hex codes, no pixel values.** The moment it states a pill's padding
and fill colour, it is competing with the HTML instead of complementing it, and the two
begin to drift. Where a number is needed, this file points at where the number lives —
"see §02 of the HTML spec", or "see `redesign/redesign-tokens.css`".

A useful check before committing an edit here: search this file for `#` followed by six
characters, and for the string `px`. Both should return nothing but this paragraph.

Machine-readable values live in `redesign/redesign-tokens.css`. That file is the one to
diff against the planner's own `css/planner-tokens.css` — it reuses the same property
names deliberately.

---

## 01 · Principles

**Chrome is brand, content is software.** The top bar, the tabs and the print keepsakes
carry the wedding. Everything between them is a tool, and tools are dense, quiet and
predictable.

**One primary action per view.** If two things are equally important, neither reads as
important.

**Every page is the same shape.** All pages use the §07 frame. A page that invents its own
layout costs the user the thing they had already learned.

**Nothing decorative is load-bearing.** No icon carries meaning alone, no colour carries
status alone, no illustration fills an empty state.

---

## 02 · What the colours mean

Values: HTML spec §02, and `redesign-tokens.css`.

### Brand
Forest and gold are the wedding. They appear in chrome and in print keepsakes, and
almost nowhere else. **Gold appears on forest surfaces only — never gold on white.**

**A brand token is a surface, never text.** This is the single most important colour rule
in the system, because in light mode the same value serves as both a dark surface and a
dark text colour. Reuse it for text and dark mode makes every page title invisible. Text
that needs to read as "heading" has its own token; consult the token file rather than
reaching for a brand colour.

### Surfaces
The ramp exists so a page can express hierarchy without borders or shadows: the canvas
sits behind the frame, the work surface holds tables and forms, the rail and group rows
recede, the toolbar sits between. **Maximum two background tones per page** — more reads
as decoration.

Two row states are reserved and must not be reused for anything else: one means
*selected by checkbox*, the other means *open in the drawer*. A user should be able to
tell at a glance which of those two a highlighted row is.

### Status — five schemes, no more
| Scheme | Means | Typical labels |
|---|---|---|
| **green** | done, settled, confirmed, nothing owed | Complete · Paid · Accepted · Confirmed · Booked |
| **gold** | in motion, or needs a decision soon | In progress · Due · Pending · Held, unpaid · Deposit only |
| **gray** | not started, or deliberately inert | Not started · Scheduled · Declined · Left open · Aged out |
| **red** | wrong, late, or blocking something | Overdue · Unowned · At risk · No vendor · Not booked |
| **blue** | a fact, not a status | counts, roles, categories, quantities |

If a state does not fit one of these five, it is a wording problem, not a colour problem.
Rename the state.

**Blue is not "info you should read."** It is a neutral fact carrier — a role, a count, a
category. Anything actionable is green, gold or red.

**Never communicate status by colour alone.** Every pill carries a word.

---

## 03 · Type

Two families. **Inter** for the entire interface. **Cormorant Garamond** for the wordmark in
the top bar and for Class B print keepsakes — nowhere else. A serif heading inside a data
page is a mistake, not a flourish.

Sizes and weights: HTML spec §03.

**Numerals that can be compared use tabular figures.** Any column of money, counts, dates
or times. A column of proportional numerals cannot be scanned.

---

## 03b · Icons

Geometry and stroke weights: HTML spec §03b.

**Allowed:** top-bar utilities, toolbar affordances, the drawer close, inline add rows,
empty states.

**Not allowed:** stat strips, table headers, table cells, buttons that already have a text
label, tab and sub-nav items, rail rows, page titles.

The test: *if a label says it, an icon does not need to repeat it.* An icon beside the
word "Export" adds nothing but noise at every scale.

**Never alone.** An icon-only control needs a tooltip and an aria-label.

---

## 04 · Spacing & geometry

Scale and values: HTML spec §04.

**The system is square.** Radius zero everywhere. Circles are reserved for two things:
avatars, and tables on the reception floor plan. A rounded card is off-system.

**Elevation is near-flat.** The drawer is separated by a border, not a shadow. Only two
things cast shadows: popovers and the full-editor modal — surfaces that genuinely float
above the page.

---

## 05 · Button hierarchy

| Level | When | Rule |
|---|---|---|
| **Primary** | the one thing this page is for | exactly one per view |
| **Secondary** | anything else the page offers | any number |
| **Tertiary** | an action that is nearly a link | no border; reads quiet |
| **Destructive** | anything irreversible | always confirms in a modal |
| **Icon-only** | space-constrained utilities | tooltip and aria-label required |

**The primary is forest, never gold.** Gold is brand, not emphasis.

---

## 06 · Navigation model

Eight tabs, each with its own sub-nav. The full page list is in the appendix.

The tabs answer *what kind of thing am I working on*, the sub-nav answers *which one*. A
page belongs to exactly one tab. If a page seems to belong to two, its scope is wrong.

**One page sits outside the tab rule.** Planner History is reached only from the top-bar
undo/redo cluster and the avatar menu, so its tab strip shows nothing lit and its sub-nav
row says where you came from instead. A log is somewhere you are *sent*, not somewhere you
browse to.

Also outside the tabs, reached from help and setup entry points: Get Started, FAQ,
Page-by-Page Guide, Wedding Setup.

---

## 07 · Page anatomy

Top bar → tab strip → sub-nav → **[ rail | page header → stat strip → toolbar → bulk bar →
work surface | drawer ]**

Measurements: HTML spec §07.

Every page uses this frame. **A page with no filters drops the toolbar; a page with no
records drops the drawer.** Nothing else is optional, and nothing may be reordered.

**Never pin a page height.** Content-sized shells only — a fixed height silently crops the
last section, and the crop is invisible until someone scrolls looking for something that
was never rendered.

---

## 07b · When a strip of labels is a tab strip

Fifteen pages split themselves internally. Before drawing one, decide what the strip
actually is — only about half of them turn out to be tab strips.

| Then it is | Test | Where it goes |
|---|---|---|
| **Section** | the content is different — different columns, different shape, sometimes a different primary action | a tab strip |
| **Filter** | same rows, fewer of them | toolbar chips; the active one carries a ✕ and the count changes |
| **View** | same data, drawn differently | the view switcher, which already exists |
| **Page** | it owns its own records, print class and primary action | the sub-nav, with the other pages |

**Position:** between the stat strip and the toolbar. The stats describe the whole page,
the tabs choose the content, the toolbar filters what the tabs chose. Put the toolbar
above the strip and its chips appear to apply to every tab at once.

**Two levels is the ceiling.** A page may nest one strip inside another — supplier then
list, packet then chapter. Nothing gets a third: at that depth the page is two pages
wearing one name.

**A strip that scrolls means too many sections.** The single exception is the raw table
browser, where two dozen tables cannot be anything else.

**Two axes need two groups.** A filter set that mixes two independent axes — a type *and*
a status — must be drawn as two labelled chip groups. One row implies they are
alternatives, and they are not: a thing can be both.

**Tabs are for sections that are independent; stacking is for sections that are one
argument.** The catering page has more sections than any tabbed page and deliberately has
no tabs, because every section reads the same headcount. Tabs would hide all but one of
the consequences of changing a single RSVP.

## 08 · Table rules

Measurements: HTML spec §08.

- **Editing happens in place.** Click a cell, type, tab. Borders appear on focus only,
  never at rest. Clicking anywhere outside an editable cell opens the row drawer.
- **Modals are reserved for destructive confirms.** Editing never opens one.
- **No zebra striping.** Hairline separators and a hover state carry the rhythm.
- **Group rows use one format everywhere** so they can be scanned across pages:
  *count · committed · paid · target*. Collapsible.
- **The inline add row is always last** and always present. It is how records are created;
  there is no separate "new" screen.
- **Empty states are one line of plain text plus the add row.** No illustrations.

### Chip honesty
A filter chip must describe the rows actually rendered. An **active** chip (accent border,
carries a clear ✕) means the table *is* filtered. If the full table is shown, every chip
renders inactive. A chip that says "Side: all" while the table is filtered is a lie the
user will only catch after making a decision on bad data.

### Column controls
Three controls, in this order, at the right of the toolbar: **Columns**, **Auto-fit
columns**, **Row height**.

- **Auto-fit is an action, not a menu** — no chevron, no active state, no persistence. It
  writes the same widths a drag would write.
- **Row height persists**, per table per profile, like column widths. Compact is for
  scanning long lists; tall is for tables whose cells wrap.
- **One Columns chip per toolbar, and it states its count.** A bare "Columns" beside a
  counted one is a bug, not a variant.
- **They live in a toolbar, never a section header.** A section header introduces content;
  a control wedged between prose and a view switcher reads as neither. A page whose
  sections are chosen by a tab bar still needs a toolbar beneath that bar — **a tab bar is
  navigation, not a toolbar.**

### Column budget
The name column has a floor, below which a table stops being readable. Trim the default
column set rather than squeezing names; everything else lives in the drawer. Guest List
shows six of twenty-four columns; Budget shows eight of twelve. Floor value: HTML spec §08.

### Progress bars
Tracks clip their fills. **Over-target reads as a full red track plus the negative variance
figure — never a bar wider than its track.** A bar that overflows its own container is the
clearest possible signal that nobody checked the maths.

---

## 09 · Print

Two classes, no more. **Both print from the page itself** — there are no separate print
templates, because a separate template is a second copy that drifts. Screen chrome hides;
the work surface expands to the full measure.

**Class A · working documents.** Vendor packets, day-of timelines, task lists, guest lists,
seating charts. Black on white, hairline rules, no gold, no fills. Repeating header with
couple, page title and date printed; footer with page numbers. Tables break at row
boundaries and group rows repeat on carry-over pages, so a page torn from the middle still
makes sense.

**Class B · keepsakes.** Vision & Foundation, Prayer Journal, Premarital Counseling,
ceremony programmes. Cormorant returns for headings and Scripture, margins open, a single
gold hairline as the only ornament. These are the pages a couple keeps — they should look
*printed*, not *exported*.

**Print is always light.** Paper has no dark mode.

---

## 10 · What changes, and why

The full before/after table is in HTML spec §10. The reasoning, which is the part worth
reading:

- **Twelve equally-weighted gold buttons in the top bar meant none of them read as
  important.** Four elements and a command palette.
- **A wrapping menubar has no stable position to aim at** — the same item moves row
  depending on window width. Eight fixed tabs.
- **A display-size title on a data page is a magazine cover on a spreadsheet.** It cost
  roughly a fifth of the vertical space on every page.
- **Viewport-scaled gutters gave the widest screens the least data.** Flat gutters.
- **A sidebar that repeats the page's own stats is width spent twice.** Saved views and
  live progress are worth the width; duplicated numbers are not.
- **Seven stats with icons is a report, not a page heading.** Three to five, hairline-
  divided, no icons.
- **Pop-out editors hid the list you were working through.** Inline cells plus a drawer,
  with a pop-out only for the records too large for a drawer.
- **A pinned page height silently crops the last section.**
- **Greyscale dark mode made the product generic at night.** The forest bar survives.

### Two deliberate divergences from the current app
1. **Auto-fit moved out of the top bar.** The top bar is global chrome on every page, but
   auto-fit acts on one table — and several pages carry two or three. "The table I think
   you mean" misfires on exactly those pages. In the toolbar its scope cannot be misread.
   **The global button is removed, not relocated.**
2. **The setup page is called Wedding Setup, not Essentials.** The app already has an
   Essentials Checklist, which is a list of things to buy. Two pages cannot share a name,
   and the setup page was named first.

---

## 11 · Record editors

Two surfaces, one component per record type.

**The drawer** keeps the list in view while one row is edited. It tabs by field group,
because the largest record in the product has twenty-four fields and a single scrolling
column would bury half of them.

**The full-editor pop-out** shows everything at once, for the moments when tabbing through
groups is slower than seeing the whole record.

The pairing is the point: neither surface alone handles both "change one field" and "fill
in everything".

---

## 12 · Page header button order

Right-aligned, always the same order, so the primary action lands in the same place on
every page:

`tertiary → Print section → Full editor → Export → PRIMARY`

Consistency here is worth more than optimising any individual page, because the primary
button becomes a place rather than a thing to find.

---

## 13 · Nested records

Rows that own children expand in place rather than opening another screen — contract
instalments, counseling homework, table assignments.

**Completion is derived from the children, never stored on the parent.** A parent tick that
can be set independently will eventually disagree with the rows beneath it, and the user
will believe the tick.

---

## 14 · Component gallery

Every component at ship size lives in HTML spec §14, and as working CSS in
`redesign/component-gallery.html`.

**If the gallery and the screens disagree, the gallery is wrong** — the screens are the
deliverable, the gallery is documentation of them.

### Choosing a pill variant
- **Default** — anywhere with a normal row height.
- **Compact** — only in tables set to compact row height, where the default would crowd.
- **Interactive** — when the pill *is* the control, i.e. the field is a short enumeration
  the user changes often (RSVP, payment status). Do not make a pill interactive just
  because the value is editable; a value edited rarely belongs in the drawer.

---

## 15 · Dark mode

**Not a filter over the light theme — a second surface ramp with the same geometry.**

The forest bar survives and the gold rule dims rather than disappearing, so the product is
still recognisably itself at night. Everything else desaturates: dark mode is for reading
at 11pm, not for looking at.

**Geometry never changes between themes.** Identical spacing, weights, column widths and
copy. If a dark screen differs from its light twin in anything but colour, that is a bug in
the dark file, not a dark-mode decision.

**Status fills go translucent in dark.** The light pastels glow at low luminance; a tinted
overlay on the dark surface reads correctly.

Values and the theme hook: HTML spec §15 and §15b, and `redesign-tokens.css`.

---

## 16 · Full editor pop-out

The second record surface from §11, drawn at size in HTML spec §16. Sections stack, each a
labelled grid of fields; the footer carries record position and previous/next, so a user
can work through a list without closing and reopening.

---

## 17 · Viewer preferences

The only surface that appears on every page. It hangs off the avatar already in the top
bar.

Theme and dark mode · font and display size · Preview Mode · focus presets · keyboard
shortcuts · a link out to backup.

**These are viewer preferences: they change nothing another person would see in a share
packet.** That is precisely why they do not belong on a planner page — a planner page holds
facts about the wedding, and none of these are.

---

## Appendix · cross-screen data contract

One ledger drives every money and headcount figure in the product. **Any new screen must
reconcile to it — a screen that computes its own total is a screen that will disagree.**

| Figure | Derived from | Ever typed? |
|---|---|---|
| Committed | contract totals + derived lines | no |
| Paid | payment rows marked paid | no |
| Outstanding | committed − paid | no |
| Headcount | accepted RSVPs | no |
| Catering food | headcount × per-head rate | no |
| Place settings | seated count × per-setting rate | no |
| Pledges received | pledge rows marked received | no |
| Couple to find | committed − received | no |

**An overpayment is its own state.** When paid exceeds committed, the cell says so in words
and reads gold — never the muted grey used for a settled zero, which would make an
overpayment look like a closed row.

**Promised money is not budget money.** Pledges that have not landed are shown separately
and never counted in "budget used".

Working proof: `Planner Prototype.dc.html` — six pages on one shared store, where every
number is computed and none is typed.

---

## Appendix · page inventory

Thirty-seven pages, all drawn. Forty-four screens, since some pages have more than one
state. Screen ids refer to **Planner Screens All**; **Planner Screens Dark** carries the
same forty-four on the dark ramp.

| Tab | Page | Screen |
|---|---|---|
| Overview | Dashboard | 3a |
| | Notes | 12a |
| Planning | Timeline & Tasks | 9a |
| | Smart Calendar | 6a, 6c, 6d |
| | Appointments | 6b |
| | Weekend Logistics | 11d |
| People | Guest List | 3b |
| | Households **†** | 4b |
| | Contacts **†** | 4c |
| | Wedding Party | 10a |
| | Table Layout | 8a |
| | Gifts | 10b |
| Money | Budget | 4a |
| | Payments | 5a-adjacent |
| | Contracts & Invoices | 10c |
| Vendors | Venue & Vendors | 8b |
| | Catering & Menu | 7a |
| | Entertainment | 10d |
| | Shot Lists | 11b |
| The Day | Wedding Day Timeline | 6b |
| | Ceremony & Reception | 11a |
| | Honeymoon & After | 17b |
| Covenant | Vision & Foundation | 13a |
| | Prayer Journal | 13b |
| | Premarital Counseling | 13c |
| | First-Month Rhythms | 13d |
| | Newlywed Homecoming | 18a |
| Documents | Vision Board | 8b-adjacent |
| | Essentials Checklist | 17a |
| | Share Packets | 12b |
| | Email Templates | 12c |
| | Print Centre **†** | 12d |
| | Database Hub | 7b, 7c |
| No tab | Planner History | 18b |
| | Get Started | 15b |
| | FAQ | 15c |
| | Page-by-Page Guide | 15d |
| | Wedding Setup | 11c, 15a |
| | Viewer preferences | 16a |

### † New pages — additions to scope, not recreations
Three pages do not exist in the current app. All three are **approved for build**, and are
marked here, in the HTML spec's inventory, and in `class-map.md` so nobody mistakes them
for something being replaced.

- **Households** — a derived view over guest records, grouped by household. Owns the
  address, the invitation, and the "how many seats does this family need" question that
  the flat guest list answers badly.
- **Contacts** — a derived view over vendors and guests, for the day when someone needs a
  phone number and does not care which table it lives in.
- **Print Centre** — collects what is currently the top-bar print dropdown into a page that
  sorts every printable by print class and can produce the day-of pack as one job.

**Essentials Checklist lives under Documents**, not Overview. It is a printable list, and
grouping it with the other printables is what makes the Documents tab coherent.

---

## Companion files

| File | What it is |
|---|---|
| `Covenant Design Spec.dc.html` | every measurable value, and the component drawings |
| `Planner Screens All.dc.html` | all 44 screens, light |
| `Planner Screens Dark.dc.html` | the same 44, dark ramp |
| `Planner Prototype.dc.html` | six pages as working software on one store |
| `Planner Visual Directions.dc.html` | baseline, three explored directions, the chosen system light and dark |
| `redesign/` | the implementation package — CSS, class map, galleries |
| `spec-update-notes.md` | change log, and the traps worth not repeating |

**Archived, do not edit:** `Planner Screens.dc.html` and `Planner Screens B.dc.html` are the
two files that were merged into `Planner Screens All`. They are kept as a record of how the
work was built. Any change made to them will not appear anywhere.
