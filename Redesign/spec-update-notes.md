# Covenant Design Spec — change log & pending work

Spec file: `Covenant Design Spec.dc.html` — now **v1.6** (1 August 2026).
Screens: `Planner Screens.dc.html` (3a–9a) · `Planner Screens B.dc.html` (10a–13d) ·
`Planner Visual Directions.dc.html` (1a–2b).

---

## Folded into the spec — v1.1

- **§11 Record editors** — drawer (360px, tabbed, body scrolls, footer pinned) and
  full-editor pop-out (1140px). Tab sets listed for guest, budget line item, payment.
- **§12 Page header button order** — tertiary → Print section → Full editor → Export →
  ONE primary. Page-specific print actions stay in their own section header.
- **§13 Nested / child records** — 2px gold left rule, own column head, per-row ✕,
  "+ Add …". Parent totals DERIVED from children.
- **§04 frame sizing** — never pin a screen height in px; width only.
- **§08 table rules** — chip honesty, default column budget, one group-row format,
  tabular money, bars capped at 100%.
- **Appendix · cross-screen data invariants** — the single money and people ledger.

## Folded into the spec — v1.2 (this pass)

- **§14 Component gallery (new)** — every component rendered at ship size:
  shell (top bar 52 / tabs 46 / sub-nav 40), rail 224px, page header + stat strip,
  toolbar with active vs inactive chips, bulk bar, table (header, group row, default /
  selected / focused rows, spend bar, inline add), row drawer 360px, section header,
  two-tone progress bar, four card states, inline and destructive actions, empty state,
  and the raw data browser with sticky id column.
- **§15 Dark mode (new)** — the seven-token ramp (page #141414 · surface #1A1A1A ·
  raised #222 · border #2E2E2E · bar #16241E · text #E6E6E6 · muted #8A8A8A) plus a
  full page drawn in dark. Forest → #2F5645 on buttons, gold → #B08D55, header rule
  → #6B5738. Geometry is identical to light. Print always renders light.
- **§16 Full editor pop-out (new)** — drawn at 1140px: forest title bar with traffic
  lights and "Saved 4 seconds ago", 210px sibling rail, four 3-column field groups,
  live linked panels (togglable event pills, gold cross-links), append-only history,
  Previous / Next / Done footer.
- **§06 navigation** — sub-navs corrected to the ones actually built.
- **Appendix · page inventory (new)** — all 30 pages mapped to tab, screen id and what
  they own. All 37 drawn (15a–15d added the Start Planning group).
- Header restated as v1.2 with a date; footer now names all three companion files.

## Folded into the spec — v1.3 (this pass)

- **§06 Overview sub-nav restored** to the app's real Start Planning group:
  Dashboard · Get Started · Page-by-Page Guide · FAQ · Wedding Setup · Notes.
  v1.1 had silently replaced it with "Dashboard · Essentials · Notes", which dropped
  three pages from the system and renamed a fourth.
- **Reference-page variant of §07** — Get Started, the Guide and the FAQ keep the shell,
  rail and page header but carry prose: no stat strip, no toolbar, no bulk bar, no
  drawer, because no record is open. The rail becomes a table of contents. FAQ's right
  column is a plain 360px aside, not a drawer.
- **§10 decision recorded** — the setup page is **Wedding Setup**, not Essentials. The
  app already has an *Essentials Checklist* (what to buy); two pages cannot share a name
  and the setup page was named first. 11c stands as the earlier drawing of it.
- **§17 Viewer preferences (v1.4)** — the avatar menu, drawn at size in 16a. No gear
  icon: the avatar is the affordance. The test — a setting belongs there only if it
  changes what this viewer sees and nothing a share-packet recipient receives.
  Preferences persist per device and never travel in a backup or packet. Panel height is
  capped at calc(100% − 60px) with scroll — a dropdown must never render past the window.
- Page inventory now 34 rows, all drawn, incl. Essentials Checklist marked undrawn-but-distinct.

---

## Screens built

`Planner Screens.dc.html`
3a Dashboard · 3b Guest List · 4a Budget (now incl. **Pledged & paid**) · 4b Payments ·
4c Venue & Vendors · 5a Guest full-editor pop-out · 6a/6c/6d Smart Calendar ·
6b Wedding Day Timeline · 7a Catering & Menu (nine sections) · 7b Database Hub ·
**7c Database Hub · all tables** · 8a Table Layout (floor plan, assignments, detail
cards) · 8b Vision Board · 9a Timeline & Tasks

`Planner Screens B.dc.html`
10a Wedding Party · 10b Gifts · 10c Contracts & Invoices · 10d Entertainment ·
11a Ceremony & Reception · 11b Shot Lists · 11c Wedding Setup (earlier drawing, superseded by 15a) · 11d Weekend Logistics ·
12a Notes · 12b Share Packets · 12c Email Templates · 12d Print Centre ·
13a Vision & Foundation · 13b Prayer Journal · 13c Premarital Counseling ·
13d Marriage Rhythms · 14a Appointments · 14b Households · 14c Contacts · 17a Essentials Checklist · 17b Honeymoon & After · 18a Newlywed Homecoming · 18b Planner History · 15a Wedding Setup · 15b Get Started · 15c FAQ ·
15d Page-by-Page Guide

---

## Still open

1. **All 37 pages are drawn** — the 31 Jul audit is closed. 13d renamed **First-Month
   Rhythms** so the Marriage Rhythms group is two pages again. Decisions: history is
   view-only EXCEPT per-row undo while the snapshot is one of the 15 kept; entries are
   summary lines expandable to field-level diffs; grouped by day with a record filter;
   retention stated on the page with a warning at 86%; Clear History moved to Wedding
   Setup's danger zone; Planner History has no tab. 17b rebuilt table-first — it had
   drifted to a card grid.
   Superseded note, found in the 31 Jul audit against the app's real panels:
   **Newlywed Homecoming** (the app's Marriage Rhythms group has two pages; 13d collapsed
   them into one) and **Planner History** (view-only day-by-day change log — the top-bar
   undo/redo buttons and the 16a menu both link to it).
   Closed this pass: Essentials Checklist (17a) and Honeymoon & After (17b).
2. **Global chrome, remaining pieces** — the five-column footer, the first-run Wedding
   Wizard, Backup & Restore Help, and the legal modals. §17 covers only the avatar menu.
3. **Three pages are inventions, not recreations** — Households, Contacts and Print Centre
   have no panel in the app. Defensible additions, but the spec does not mark them as such.
4. **Dark mode is specced, not applied** — only §15 and direction 2b exist in dark.
   No built screen has a dark counterpart.
5. **Covenant keepsake print templates** — §09 Class B is described; the actual
   printable layouts still live in the old `mockups/` HTML files and have not been
   brought into the system.
6. `Planner Visual Directions.dc.html` has not been verified since the 2a phase-chips
   and progress-card edit.
7. **Font packaging** — the base64 @font-face faces embedded in `planner.css`
   (Lato 400/700, Lora) must be re-cut for Inter and Cormorant so the app still
   renders offline once the other twelve families are dropped.

## Rule that keeps paying for itself

Every label, chip, toggle and count must agree with the rows beneath it. Six of the ten
verification failures on this project were a caption, chip or stat contradicting its own
table — not a visual defect. The other recurring one is authoring literal `{{ }}` in a
template: split the braces across elements or the runtime eats them.


---

## v1.6 — 1 August 2026

**Auto-fit and row height are now part of the system.** Two controls sit in every
table toolbar, immediately after the Columns chip:

- **Auto-fit columns** — an *action*, so no chevron and no active state. Sizes each
  column to its widest rendered cell, capped so the name column keeps its 240px floor.
  Does not persist; it writes the same widths a drag would write.
- **Row height** — chevron, three states: Compact 30px / Default 36px / Tall 44px.
  Persists per table per profile, like column widths.

Applied to all 38 table toolbars across both screen files. 7c Database Hub's
hand-written chips were replaced rather than doubled, so its Columns chip keeps its
real "24 of 24" count.

**Deliberate divergence from the app, recorded in §10.** The app has
`autoFitActivePanelTables()` as a global top-bar button. That is gone, not moved: the
top bar shows on all 37 pages but auto-fit acts on one table, and several pages carry
two or three — "the table I think you mean" misfires on exactly those pages. In the
toolbar the scope is the table above it and cannot be misread.

Spec sections touched: §08 (two new rules), §10 (divergence row), §14 (the canonical
toolbar drawing now shows all three chips — if the gallery and the screens disagree,
the gallery is wrong).

**New file: `Planner Prototype.dc.html`** — a working prototype, not a drawing. Six
pages (Guest List → Table Layout → Catering, and Budget → Payments → Contracts) share
one store. Every number is computed: no typed-in totals anywhere. The cross-slice hop
is the point — declining a guest empties their seat, drops the headcount, re-counts the
dietary summary, re-derives food at $58/head and place settings at $6.50/seat, and both
land in the Budget's Catering and Rentals rows, which are marked *Derived* to separate
them from contract-backed rows. Absent by design: add/delete, print, and the other 31
pages. Budget rows filter Derived / From a contract; Payments filter Paid / Scheduled;
Catering and Contracts say they have no filters rather than showing dead chips.

## Files, as of v1.6

- `Covenant Design Spec.dc.html` — the system. §01–§17 plus the page-inventory appendix.
- `Planner Screens All.dc.html` — all 44 screens in one document, newest batch first,
  every id badge and description intact. ~2.2 MB; give it a few seconds to settle.
- `Planner Screens Dark.dc.html` — the same 44 on the §15 dark ramp. Same markup, one
  ramp swapped: identical geometry, spacing, weights and blurbs. Print stays light.
- `Planner Prototype.dc.html` — six pages as working software on one shared store.
- `Planner Visual Directions.dc.html` — 1a baseline, 1b–1d directions, 2a chosen, 2b dark.

The two source files `Planner Screens.dc.html` and `Planner Screens B.dc.html` are
superseded by `Planner Screens All`. They are left in place until the combined file has
been reviewed, then they should be deleted rather than maintained in parallel.

### Dark-mode hazard worth remembering
`#20362D` was doing two jobs in light mode — table-header *background* and dark *text*.
A flat token swap made every page title and stat value invisible. Any future ramp swap
must split by property (`color:` vs `background:`), not by hex alone. Same trap with
`#2D4A3E`: the top bar and the primary button share it in light mode but need different
dark values (#16241E bar, #2F5645 button).

### v1.6a — toolbar control placement, hard-won
Three passes to get the auto-fit chips right. Recording the traps:

1. Keying the insertion on the view-switcher string also matched one hand-written
   section-header row on 4a, which carries its own By-category/By-vendor switcher.
   A section header is not a toolbar.
2. The repair used a 500-char look-back to tell toolbar from section header, but a
   toolbar's opening sits further back than that behind its filter chips — so every
   toolbar misread as a section header and lost its chips. 8000 chars is enough.
3. The insertion prepended a bare "Columns" chip unconditionally, duplicating the
   hand-written "Columns · N of M" on 4a, 3b, 7a, 6b and 9a. Now conditional.

§08 gained two rules from this: where the controls live (toolbar only; a tab bar is
navigation and still needs a toolbar beneath it), and one counted Columns chip per
toolbar. 17b Honeymoon got a real toolbar row beneath its section tab bar.

### v1.6b — developer handoff package
New folder `redesign/` in the PROJECT (not the mounted local folder — it has to be
downloaded and dropped into `01 Developer Editable Version/redesign/`).

```
redesign-tokens.css      light + dark, reusing the planner's OWN property names
redesign-components.css  pills, buttons, chips, fields, panels, stats, progress,
                         tables, toolbar, bulk bar, drawer, modal, empty state
redesign-shell.css       top bar, tabs, sub-nav, rail, page header, footer, gear menu
redesign-layouts.css     §07 anatomy, 4 priority pages, floor plan, print (A and B)
component-gallery.html   every component, light
component-gallery-dark.html   the same, dark
class-map.md             planner class → redesign, in three phases
README.md                the handoff brief
screenshots/             component-gallery-light.png
```

**The key finding.** The planner already ships a semantic token layer at
`css/planner-tokens.css` (`--surface-*`, `--text-*`, `--status-*-bg/text/border`,
`--space-*`, `--btn-*`, `--radius-*`). `redesign-tokens.css` redefines the SAME names,
so phase one of the migration is a values-only swap with zero markup edits — roughly
60% of the visual change. That reframes the job from page-by-page hand-editing to three
ordered phases, which is what `class-map.md` is organised around.

**Spec §15b added:** every semantic token paired light/dark, plus the same component set
rendered in both themes side by side.

**New token: `--text-heading`.** I hit the exact trap the notes warned about while
building the gallery: I used `--forest-deep` for page titles and stat values, and in
dark mode that resolves to #16241E — near-black text on a near-black surface. Brand
tokens are surfaces. Heading text now has its own token in both themes.

**Not delivered: a dark component-gallery PNG.** The screenshot pipeline strips the
theme hook when it clones the DOM, so five capture attempts all came back rendering
light. Shipping a PNG that contradicts the CSS would be worse than shipping none, so
README §6 points at the dark HTML file plus a six-row table of expected computed values
to check against.

## v1.7 — 1 August 2026 · the five open items, closed

**1. Page screenshots — not needed.** The component gallery PNG plus the HTML documents
are the verification surface. README §6 no longer promises per-page PNGs.

**2. The two merged files are archived, not deleted.** `Planner Screens.dc.html` and
`Planner Screens B.dc.html` each open with a "do not edit" band explaining that they are
superseded by `Planner Screens All` and that edits made in them appear nowhere.

**3. Spec split — the two files no longer overlap, so they cannot drift.**
- `Covenant Design Spec.dc.html` owns everything **measurable**: colour values, radii,
  padding, sizes, weights, states, component drawings. This is what you diff against the
  planner.
- `redesign/covenant-design-spec.md` owns everything **unmeasurable**: what a colour
  means, when to use one variant over another, naming, decisions and rationale, scope.
- **Enforced rule: no hex codes and no pixel values in the markdown.** It was rewritten
  from scratch under that constraint and now contains neither — searching it for a
  six-character hex or the string "px" returns only the paragraph stating the rule.
  Where a number is needed it references the HTML spec section or the token file.

**4. Essentials Checklist lives under Documents.** It is a printable list. The screens
already had it there; the markdown index was the thing that was wrong.

**5. Households, Contacts and Print Centre are approved for build**, and marked † as
additions to scope in both specs' page inventories and in `class-map.md`, with a line
saying there is no existing markup to migrate.

**Also settled:**
- **Honeymoon itinerary** nudges gently — the three unplanned days read "Nothing planned"
  and the caption says "shown, not chased". They are never counted as gaps.
- **Visual Directions** — 1b, 1c and 1d updated to the final §06 model ("Smart Calendar",
  "Weekend Logistics", Notes out of Planning, 1c's exploratory "Faith" tab renamed
  Covenant). **1a is deliberately not updated**: it is the record of today's app, and a
  baseline that quietly adopts the new system stops being a baseline. A note on the screen
  says so. All six screens now carry `data-screen-label`.

## v1.8 — 2 August 2026 · implementation package finished

**All 38 page shells built** in `redesign/pages/`, one per planner page plus a grouped
index. Every panel id, JS mount-point id and `onclick` handler name is preserved from
`index.html`; legacy classes ride along as second class names.

**`autofit-columns.js` written.** The per-table replacement for the app's global
`autoFitActivePanelTables()`. Scopes to the first table after the calling toolbar within
the same `.rd-main`, measures each column against its widest rendered cell, honours the
§08 240px name-column floor, does not persist. Wired into all 38 shells.

### Three bugs found in review, all now fixed
1. **`[hidden]` was being overridden.** `.rd-drawer`, `.rd-toolbar` and `.rd-bulkbar` all
   set `display: flex`, which beats the UA `[hidden] { display: none }`. An empty 360px
   drawer was rendering over the right third of 33 pages, covering the very toolbar chips
   the auto-fit work was about. Fixed with **one** guard at the end of
   `redesign-components.css` — `[hidden] { display: none !important; }` — rather than a
   rule per component, so any future flex component inherits it. Must stay last in the
   file: same specificity, so source order decides.
2. **Top-bar search overflowed at narrow widths.** Now `nowrap` + `overflow: hidden`, and
   below 1180px the label drops to leave just the magnifier.
3. **14 classes were used by the pages but never defined** — `.rd-floorplan`,
   `.rd-moodgrid`, `.rd-calendar`, `.rd-yearplot`, `.rd-keepsake`, `.rd-journal`,
   `.rd-steps`, `.rd-faq`, `.rd-prose`, `.rd-callout`, `.rd-grid-4`, `.rd-scope`,
   `.rd-main--keepsake`, `.rd-bulkbar__action`. Written into `redesign-layouts.css` §7.
   A class audit across all 38 pages now returns zero undefined `rd-` classes.

### Lesson worth keeping
A UA-default rule like `[hidden]` loses to **any** author rule that sets `display`. When a
design system gives components their own display value, it owes them a global hidden
guard — the alternative is discovering the same bug once per component.

## v1.9 — 2 August 2026 · the sub-tab layer

**New file: `Planner Sub-Tabs.dc.html`** (batch 19, 16 screens). Fifteen pages in the app
carry a tab bar *inside* the page — roughly sixty states that had never been drawn, and
which the shells had silently flattened into stacked sections.

**The finding: only seven of the fifteen should have a tab strip.** Drawing them forced a
question the system had not answered — when is a strip of labels a set of sections, and
when is it something else wearing tab clothing? Four tests, proposed for **§07b**:

1. **Section** — the content is different (different columns, shape, primary action).
   Tab strip. Ceremony (9), Honeymoon (7), Entertainment (5), Vision Board (5),
   Vendors (2), Shot Lists, Share Packets, Database Hub, Weekend Logistics.
2. **Filter** — same rows, fewer of them. Toolbar chips, active one carrying a ✕ and a
   count. Mood categories, Gift type/thank-you, Email audience.
3. **View** — same data, drawn differently. The toolbar's view switcher, which already
   exists. Smart Calendar's Month/Week/Agenda, Wedding Day's Vertical/Details.
4. **Page** — owns its own records, print class and primary action. The sub-nav.
   Covenant's five.

**Placement rule:** the strip sits **between the stat strip and the toolbar**. Stats
describe the page, tabs choose the content, toolbar filters what the tabs chose. Above the
strip, the toolbar's chips appear to apply to all tabs at once.

**Two levels is the ceiling.** Shot Lists (supplier → list) and Share Packets
(packet → chapter) earn a second strip. A third means the page is two pages.

**Gifts revealed a second bug:** its seven "tabs" mix two axes — gift type and thank-you
status. One row of seven implies they are alternatives. Drawn as two labelled chip groups.

**19p Catering is the counter-case**, drawn last and deliberately: nine sections, more
than Ceremony, and no tabs. All nine read the same headcount, so tabs would hide eight of
the nine consequences of changing one RSVP. **Tabs are for sections that are independent;
stacking is for sections that are one argument.**

### Still open after this
The 38 page shells in `redesign/pages/` still stack these sections. Now that the calls are
made, seven pages need their strip restored using `.rd-tabstrip` with the app's existing
`data-tab` values and `onclick` names (`cerTab`, `hmTab`, `entTab`, `visionTab`, `vndTab`),
three need their strip replaced with toolbar chips, two with the view switcher, and
Covenant's needs deleting. That is a mechanical pass, and it should follow this document
rather than precede it.

## v1.10 — 4 August 2026 · 20a/20b, and the column chip made consistent

**New screens 20a and 20b** in `Planner Screens All` — the Calendar and Agenda views that
14a's switcher names but never drew. Batch 20 rather than 14b/14c, which were already
Households and Contacts.

**Both had to earn their place against Smart Calendar**, which already has month/week/agenda.
The answer is travel: Smart Calendar carries 83 entries from five sources and most have no
travel field, so it cannot draw one. These nine do.

- **20a Calendar** — a two-week time grid, empty days collapsed, because a month grid with
  nine appointments across five months is 90% empty cells. Travel is a hatched band
  **before each block only**: one journey, one band. My first pass drew padding on both
  sides, which double-counts — the trip out of the tasting and the trip into the
  walkthrough are the same journey.
- That correction forced honest numbers. At 42 min travel there is no clash: 4pm end, 5pm
  start, it fits. Adenta→Osu on a Thursday evening is 75 min, so you must leave at 3:45pm
  and the tasting runs to 4:00pm — 15 minutes over, drawn as a red sliver at the overlap.
- **20b Agenda** — the page's print target. Group headers become date headers; travel
  becomes a gap row between entries. Drops checkboxes, column controls and the drawer, with
  a panel giving the reason for each.

**Column chip: 33 screens corrected.** §08 says the chip states its count
(`Columns · 8 of 12`), and `redesign-components.css`, the §14 gallery and all 95 page
shells emit the counted form — but 35 bare `Columns` chips across 33 reference screens did
not, so 85% of the drawings contradicted both the spec and the implementation.

Counts are **derived, not invented**: each screen's widest `<thead>` is read and its `<th>`
cells counted, subtracting the first cell **only when its text is empty** (the checkbox
column). None of those drawn tables defines a hidden column set, so `N of N` is literally
true. Four screens genuinely hide columns and already stated it — Guest List `6 of 24`,
Catering `6 of 12`, Budget `8 of 12`, Wedding Day `5 of 11` — and were left alone.

### Getting this wrong twice, and what it cost
**My first pass had a `n = 6` fallback for screens where the count could not be derived.**
That put `Columns · 6 of 6` on eight screens that have **no table at all** — 15d, 13a, 13b,
11a, 6a, 6c, 6d, 8b. That is worse than the bare chip it replaced: a bare chip is merely
incomplete, whereas a fallback count asserts six columns that do not exist. It also
contradicted 20b, which drops the trio precisely because it has no columns and carries a
panel explaining why. **Never substitute a literal fallback for a derived value** — if it
cannot be derived, the control does not belong on that screen.

Those eight now **drop the Columns / Auto-fit / Row height trio entirely**, keeping their
filters and view switcher. That is now the rule: no table, no column controls.

**The derivation itself was brittle in two ways**, each producing an off-by-one:
- Testing for a literal `width: 34px` to find the checkbox column missed **9a**, whose
  checkbox `<th>` is 36px — it claimed 7 columns against 6 real ones. Test for an *empty
  first cell* instead of a pixel value.
- A strict `<thead><tr>` regex skipped **4c**'s main vendor table and landed on a narrower
  one, claiming 6 against 7. Match `<thead[^>]*>` and take the **widest** thead, not the
  first — 4c has three theads of 7, 3 and 6 columns, and the toolbar governs the widest.

**Also corrected: 17b Honeymoon `8 of 8` → `7 of 7`.** Pre-existing rather than introduced,
but the same class of factual error in a reference drawing.

**And the removal itself broke 6a.** Deleting the trio walked `lastIndexOf` back past the
chip's own opening tag to an earlier sibling, removing one `<div` too many and leaving an
orphaned closer — 227 opens against 228 closes. Found by walking the tags and stopping
where depth first goes negative, which points straight at the orphan. **Any scripted
deletion of a DOM range must re-check div balance on the screen it touched**, not just the
document total, since two screens can cancel each other out.

- **7c** has two `Columns` strings that are a rail meter label and a stat eyebrow, not
  chips. Correctly left alone.

**`data-screen-label` uniqueness.** 20a/20b were spliced from 14a's chrome and inherited
its label, so three screens read `Appointments`. That attribute is what identifies a screen
in comment context, so a comment on the Calendar view was indistinguishable from one on the
Table view. Now `Appointments · Calendar view` and `Appointments · Agenda view`.
**Any future splice of one screen's chrome into another must re-set the label.**

### The 6a repair — three attempts, and the lesson
Removing the column-control trio from 6a Smart Calendar broke its §07 frame, and it took
three passes to put right. Worth recording because the failure mode is invisible to the
obvious check.

1. **The deletion.** I located the chip's opening tag with
   `lastIndexOf('<div style="display: inline-flex', i)`. 6a is hand-built and its chip does
   not carry that signature, so the search walked back past it into a preceding rail group
   and the slice ate that group's opening `<div>` along with the chip.
2. **The wrong repair.** Source-level tag balance showed 227 opens against 228 closes, so I
   deleted the orphaned closer. That balanced the count and left the nesting wrong: the main
   column was promoted out of the body row and rendered at 1438px as a sibling, stacking the
   whole page beneath a lone 224px rail. Frame height 1810px against a 996px reference.
3. **The second wrong repair.** I restored the group's `<div>` but put the recovered closer
   *before* the main column, which closed the body row early — same symptom, five frame
   children instead of four.
4. **The fix.** Restore the group's opening tag, then walk forward from the main column's
   open tag counting depth and place the closer after its matching close. 228/228, four
   frame children.

**Two rules from this:**
- **Never locate an element's opening tag by string-guessing its style signature.** Walk
  forward from a known inner point, count div depth, and act when depth returns to zero.
- **Tag balance is not a structure check.** A document can be perfectly balanced and
  completely mis-nested, and two screens can cancel each other's error out in the total.
  After any scripted DOM-range deletion, assert the frame's own child count and the body
  row's child widths on the screen that was touched.

### 20c / 20d — and the ledger rule applied to tasks
Board and Timeline views for the Timeline & Tasks page. Four defects in the first pass, all
one root cause: **I took figures from `redesign/pages/tasks.html`'s rail instead of from 9a,
the screen I spliced and cited.** The result contradicted itself inside a single viewport —
board columns totalling 40 open against a stat strip saying 56, Complete 19 against 3, and
lane notes that did not sum to their own column headers. Two vocabularies for one field sat
40px apart: 9a's phases are time-to-wedding names (12+ months … After the day) and I had
invented "Phase 3 · Two months out".

**Fixed by reconciling 9a first, then deriving both views from it.** 9a's own strip was
already inconsistent — Complete 3 while its group rows describe 4 completed, and "102 days
to wedding" puts the date at 29 July rather than today. 9a now reads Open 55 · Complete 4 ·
Overdue 2 · Unassigned 11 · Days to wedding 96, and both new views inherit it.

The partition now sums: **59 = 43 not started + 10 in progress + 2 blocked + 4 complete**,
open 55, and every swimlane's per-column count adds to its column header. Both blocked tasks
are also the two overdue ones, which is stated rather than left to coincidence. All eight
phases appear in 20d, named exactly as 9a names them.

**Rule, now general:** a view of an existing page must derive every figure from that page,
not from the implementation shells — the shells carry placeholder counts and are not the
ledger. Same discipline as the money contract in the appendix, applied to task status.

## v1.11 — 4 August 2026 · Guest List in full, and the record editor

**Batch 21** in `Planner Screens All` — 51 screens now.

- **21a Table view** — the canonical guest page. Six columns of twenty-four, with a panel
  stating why: the name column has a 240px floor, so after the rail and the drawer six is
  what fits. A seventh column takes a sixth away; the chip reads `6 of 24`.
- **21b Households view** — the same 142 guests as 62 envelopes, because invitations,
  save-the-dates and thank-you notes go to a household. Split households read amber, not
  red: the Mensah household spans T1 and T14 because two of its four are children, and that
  is often deliberate. The panel distinguishes this **view** from the separate **Households
  page** — the view groups guest records and owns nothing; the page adds fields an envelope
  needs that a guest does not.
- **21c Seating view** — unseated queue on the left, the fifteen tables on the right, and
  only two free seats between them, so the shortfall is stated rather than discovered one
  drag at a time. Table Layout owns the room; this owns the queue. Both write
  `table_id` and `seat` on the guest record.
- **Seven record-editor tabs** drawn at their real 360px rather than as seven 1440px
  screens, since the frame is identical on all seven. Identity · Response · Contact ·
  Invitation · Party · Note · History.

**Figures reconciled to 3b's own rail**, not to memory. 3b defines a three-way side split —
Bride 64 · Groom 58 · Both 20 = 142 — and my first pass wrote a two-way 74/68 from memory,
dropping the twenty "Both" guests entirely. 21a now groups by those three sides with
accepted counts summing to 86, and the twelve not-invited guests sit inside their side group
with a pill rather than forming a fourth group on a different axis. 21b's 62 envelopes now
partition 32 + 27 + 3, and single-guest households are counted as households, because one
person still needs one envelope.

### Deleting a section by accident
The rebuild pass that fixed the frame splice also **destroyed the record-editor section**.
The loop bounded each screen with `doc.indexOf('<div id="', da + 10)` — but the seven
drawers are plain divs inside a `<section>` with no `id=` wrapper, so for the last screen
the "next screen" boundary jumped past the whole section and the slice discarded it. The
scratch file had already been deleted, so it had to be redrawn from scratch.

**Rule:** bound a screen by walking its own frame to depth zero. Never by the next
occurrence of a sibling's opening tag — anything between them that lacks that tag is
invisible to the boundary and gets swallowed.

**Also fixed: the intro stated two different screen counts three lines apart** (51 in one
sentence, 44 in the next) and an eyebrow still reading "batches 1–18". Each insertion had
updated only the first count. All three now read from the same number.

**Two things the tab set decided:**
- **Tabs group by errand, not by data type.** Response holds the RSVP, the meal and the
  allergies together because chasing a reply and recording what someone eats is one job. A
  type-based grouping would put the meal under Identity and the allergy under Note.
- **Party is conditional** — ten of 142 guests see it. A tab that is empty for 93% of
  records teaches people to ignore the strip.

### Splicing a screen's chrome: the boundary matters
The first attempt left all three screens five closers over. Two causes, both in how I sliced
3b:
- **3b is the last screen in the document**, so bounding it by "the next `id=`" ran the slice
  to `</x-dc></body></html>`. Bound the last screen by walking its own frame to depth zero.
- **I guessed the head boundary by searching for the toolbar's background colour.** 3b's main
  column has three children — page header, stat strip, content wrapper — and no separate
  toolbar child, so the search missed and the slice swallowed the frame's closers. Take the
  boundary from a **depth walk of the parent's children**, not a string match.

Corrected, the parts net exactly: chromeTop +2 (frame, body row), rail 0, head +1 (main
column), screen wrapper +1 — so the template's four closers balance. All three verified at
4 frame children before writing.

### A household is not a guest
One defect survived into the last pass: 21a's "Both sides" group ended with a row reading
`Grace Chapel small group | 8 guests | Both | Pending | T3 | Mixed`. That is an envelope
drawn as a person, and it broke four things at once — the screen is headed "Guest list · 142
records" with a "Guest" column, so one row is one person; the Household column held a count
rather than a name; there was no seat number and "Mixed" is not a meal anyone eats; and the
appendix data contract derives headcount from accepted RSVPs **per guest**, so one Pending
row standing for eight people cannot be counted at all.

Worse, 21b one screen away modelled the same entity correctly — as a household with eight
members, eight seats and one invitation. Two views of one record disagreeing about what the
record *is*.

Replaced with a named member: `Adjoa Sarpong | Sarpong · small group | Both | Accepted |
T3 · 1 | Jollof`. The group header stays "Both sides · 20 guests · 8 accepted · 2 not
invited" — showing 2 of 20 rows is consistent with the Bride's side group showing 6 of 64.

**Rule:** a table's row grain is set by its header and its first column. A group, a
household or a total may appear as a **group row**, never as a body row.
