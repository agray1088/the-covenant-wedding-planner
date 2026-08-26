# Page-by-page fidelity pass

Follow-along spec for Cursor. Implement **one section at a time**. Finish the section, wait for review, then continue only when the user says **next** (or “move to next”). Do not batch 1–42.

**Visual source of truth:** `Redesign/Planner Screens Master.dc.html` — 42 sections, 310 screens, 44 record drawers. Screen ids (`21a`, `30f`, `49a`) are unchanged.

This file is the written pass of that Master: the Legend, then every section’s five parts, build notes, view names, drawers, rails, stats, and honesty rules. Where this file and the Master drawing disagree, **the Master drawing wins**.

**Completeness, not a gap list.** Each section is a full rebuild to the Master, not a punch-list of the most obvious misses. When the user says **next**, inventory the live page against every drawing and build note in that section, then implement **all** of it: everything missing, not implemented, not created, not wired, or not yet redesigned. Do not stop at the headline views, the drawer tab labels, or “the main gaps.” A section is not finished while any Master surface, column, chip, group row, empty state, rail view, stat, primary action, or drawer tab still ships as the old planner, a stub, or a missing control.

## Legend

Every section uses the **same five parts** wherever they apply. A part that is absent from a section is not missing work — it does not exist on that page. Do not invent a tab strip, extra view, or extra drawer to fill the slot.

| # | Part | Meaning |
|---|---|---|
| 1 | **Full page** | The page as it ships — header, rail, stats, toolbar, default work surface, primary action. |
| 2 | **View switcher views** | One drawing per option in this page’s view menu. Switching views must not reload the page. The work surface is what changes. |
| 3 | **Section tabs** | The page’s own tab strip. Omit when the Master does not draw it. Many pages put Table / Board / Timeline (and similar) in the **view switcher**, not as section tabs (`19i`). |
| 4 | **Record drawer tabs** | One drawing per tab of every record this page opens. Tab labels and order are exact. |
| 5 | **Night theme** | The same surfaces in dark mode. Do not block a section on night theme; match light first, then reuse tokens. |

### How to use a section

1. Read the Legend, then that section’s **Five parts** table.
2. Open the matching section in `Planner Screens Master.dc.html` and read **Build notes before the picture**.
3. Diff the live page against **every** drawing in the section — full page, each view-switcher view, section tabs if drawn, every drawer tab, empty states, rails, stats, toolbars. List what is missing, not implemented, not created, or still on the old design.
4. Implement the **whole** list, not only the largest gaps. Match columns, chips, group rows, empty states, and drawer tabs exactly. Create what does not exist; redesign what still looks like the previous planner.
5. Follow spec §07 page anatomy: top bar → tabs → sub-nav → rail + header / stats / toolbar / table + drawer.
6. Any figure shown is derived from the owning record — never typed twice.
7. Cache-bust touched CSS/JS in `index.html`. Commit, push, update the PR.
8. Stop. Give the three git commands. Wait for review before the next section.

### Standing rules

- A section is complete only when every Master surface in it exists in the product and matches the drawing. “Fixed the main gaps” is not done.
- Missing, not implemented, not created, and not redesigned all count as remaining work. Stubs, hidden placeholders, and leftover legacy chrome count too.
- Match Master drawings exactly. Do not invent UX, extra buttons, extra tabs, or extra stats.
- Screen ids stay as drawn (`21a`, `6b`, `31a`, `49a`, …).
- View-switcher options live in the view menu, not a second tab strip, unless Section tabs is drawn.
- Stack product work on `cursor/dashboard-views-017e` unless asked otherwise.
- After each finished section, the Windows pull is:

```
git fetch origin
git checkout cursor/dashboard-views-017e
git pull
```

Then **Ctrl+Shift+R**. Refresh alone does not pull GitHub.

- Night theme is global CSS. Do not hold a section for it.
- Do not commit `Planner Screens Master.dc.html` unless asked.

## Progress

| Range | Status |
|---|---|
| **01–09** | Done in product (Dashboard through Payments). Keep in this file as the contract. |
| **10 Contracts & Invoices** | Next when the user says next. |
| **11–42** | Not started. |

## Contents

- [01 · Dashboard](#section-01) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [02 · Guest List](#section-02) — done — 10 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [03 · Planning Timeline & Tasks](#section-03) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [04 · Appointments](#section-04) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [05 · Smart Calendar](#section-05) — done — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [06 · Calendar · Week & Agenda](#section-06) — done — 4 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [07 · Wedding Day Timeline](#section-07) — done — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [08 · Budget](#section-08) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [09 · Payments](#section-09) — done — 4 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [10 · Contracts & Invoices](#section-10) — next — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [11 · Venue & Vendors](#section-11) — queued — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [12 · Catering & Menu](#section-12) — queued — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [13 · Table Layout](#section-13) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [14 · Vision Board](#section-14) — done — 8 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [15 · Wedding Party](#section-15) — done — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [16 · Gifts](#section-16) — done — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [17 · Entertainment](#section-17) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [18 · Ceremony & Reception](#section-18) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [19 · Shot Lists](#section-19) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [20 · Weekend Logistics](#section-20) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [21 · Households](#section-21) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [22 · Contacts](#section-22) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [23 · Notes](#section-23) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [24 · Share Packets](#section-24) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [25 · Email Templates](#section-25) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [26 · Print Centre](#section-26) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [27 · Vision & Foundation](#section-27) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [28 · Prayer Journal](#section-28) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [29 · Premarital Counseling](#section-29) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [30 · First-Month Rhythms](#section-30) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [31 · Essentials Checklist](#section-31) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [32 · Honeymoon & After](#section-32) — done on `cursor/dashboard-views-017e` — 7 screens · 1 record drawer — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [33 · Newlywed Homecoming](#section-33) — done on `cursor/dashboard-views-017e` — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [34 · Planner History](#section-34) — queued — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [35 · Wedding Setup](#section-35) — queued — 4 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [36 · Get Started, Guide & FAQ](#section-36) — queued — 10 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [37 · Viewer Preferences](#section-37) — queued — 6 screens · 1 record drawer — Full page · View switcher views · Record drawer tabs · Night theme
- [38 · Database Hub](#section-38) — queued — 5 screens · 2 record drawers — Full page · View switcher views · Section tabs · Record drawer tabs · Night theme
- [39 · App chrome, settings & record editor](#section-39) — queued — 8 screens · 5 record drawers — Full page · Record drawer tabs · Night theme
- [40 · Vendor Portal](#section-40) — queued — 7 screens — Full page
- [41 · House style & visual directions](#section-41) — queued — 11 screens — Full page · View switcher views · Night theme
- [42 · System-wide patterns](#section-42) — queued — 40 screens — Full page · View switcher views · Night theme

---

<a id="section-01"></a>

## 01 · Dashboard

- **Master section:** `s01` · slug `dashboard`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `3a`, `44a`, `44b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `3a` |
| View switcher views | yes | `44a`, `44b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Attention item drawer · 4 tabs: Item · Why · Owner · History |
| Night theme | yes | `3a` |

**View switcher options (exact labels):** Dashboard · Attention view · Dashboard · Week ahead view

**Record drawers:**
- Attention item drawer · 4 tabs · Item · Why · Owner · History: Item · Why · Owner · History

**Stat strips:**
- `3a` Days left: 102 · Budget committed: 73% · Guests yes: 86 · Tasks done: 3/59 · Needs attention: 5

**Primary actions:**
- `3a` Open task

**Standing rules on this page:**
- `44a` **Ordering:** Late first, then Act now, then Watch; inside a band, oldest flag first.
- `44a` **Honesty rule:** Every row names the page that owns the number and the rule that raised it.
- `44b` **Honesty rule:** Empty days are drawn empty rather than hidden — an empty Thursday is information.
- `44b` **Card shows:** Each day with its appointments, task due dates and payments, in time order.
- `3a` **Ordering:** Late first, then Act now, then Watch; inside a band, oldest flag first.
- `3a` **Honesty rule:** Empty days are drawn empty rather than hidden — an empty Thursday is information.
- `3a` **Card shows:** Each day with its appointments, task due dates and payments, in time order.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `3a`.

Drawings:
- `3a` — Dashboard

##### `3a` — Dashboard

- **Purpose.** Answers one question on load: what needs me today. Next best step gets the only primary button; alerts are a list, not badges; the day-of timeline preview and budget/RSVP health sit below. The rail carries jump links rather than saved views, because there is nothing here to filter. Carried over from today's dashboard: the live months/days/hours/minutes/seconds countdown, the three ring charts (budget, RSVP, task completion), the guided planning path, planning health, data health, and the full 18-row section progress list — all rebuilt on the 2a grid.
- **Lives under tab:** Overview
- **Stat strip:** Days left: 102 · Budget committed: 73% · Guests yes: 86 · Tasks done: 3/59 · Needs attention: 5
- **Primary action:** Open task
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `44a`, `44b`.

Drawings:
- `44a` — Dashboard · Attention view
- `44b` — Dashboard · Week ahead view

##### `44a` — Dashboard · Attention view

- **Purpose:** One list of every flag in the planner, so the morning check is one screen instead of nine pages.
- **Lives under tab:** Overview · Dashboard · view switcher
- **Ordering:** Late first, then Act now, then Watch; inside a band, oldest flag first.
- **Honesty rule:** Every row names the page that owns the number and the rule that raised it.

##### `44b` — Dashboard · Week ahead view

- **Purpose:** What actually happens between now and next Monday — the view for a Sunday evening.
- **Lives under tab:** Overview · Dashboard · view switcher
- **Card shows:** Each day with its appointments, task due dates and payments, in time order.
- **Honesty rule:** Empty days are drawn empty rather than hidden — an empty Thursday is information.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Attention item drawer · 4 tabs · Item · Why · Owner · History

Tabs, in this order: **Item** · **Why** · **Owner** · **History**.

- **Item** — `Attention item · Item tab`. What the dashboard is flagging, in the words the planner will act on. Opened from any row of Needs attention.
- **Why** — `Attention item · Why tab`. The rule behind the flag, written out, so nobody has to guess why it appeared today and not last week.
- **Owner** — `Attention item · Owner tab`. Who is expected to clear it and by when. A flag with no owner is a complaint, not a task.
- **History** — `Attention item · History tab`. Every time this flag has appeared, cleared and come back. The pattern matters more than today’s state.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `3a`.

Drawings:
- `3a` — Dashboard
- Dashboard · Attention view · night
- Dashboard · Week ahead view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-02"></a>

## 02 · Guest List

- **Master section:** `s02` · slug `guest-list`
- **Header counts:** 10 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `3b`, `21a`, `21b`, `21c`, `5a`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `3b` |
| View switcher views | yes | `21a`, `21b`, `21c`, `5a` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Guest drawer · 5 tabs: Guest · Household · Seating · RSVP · History |
| Night theme | yes | `3b`, `5a` |

**View switcher options (exact labels):** Guest List · Table view · Guest List · Households view · Guest List · Seating view · Guest · full editor window

**Record drawers:**
- Guest drawer · 5 tabs · Guest · Household · Seating · RSVP · History: Guest · Household · Seating · RSVP · History

**Rail:**
- `3b` All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- `21a` All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- `21b` All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- `21c` All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- `5a` Efua Mensah
- `3b` All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending

**Primary actions:**
- `3b` + New guest
- `21a` + New guest
- `21b` + New guest
- `21c` + New guest
- `5a` Save & close
- `3b` + New guest
- + New guest

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `3b`.

Drawings:
- `3b` — Guest List — full page

##### `3b` — Guest List — full page

- **Purpose.** Stat strip with RSVPs → Estimated headcount costs, Headcount & budget, Seating count → Event Invitations → Invitation Workflow → the guest table grouped by household → Companions, plus-ones & family members. Eight of the record’s 24 fields show in the table; the drawer holds all of them. Note: Event Invitations, Invitation Workflow, and the split address fields (Address 1/2, City, State, Zip, Country) are new — today’s record has one address string and no events array.
- **Lives under tab:** People
- **Table columns / fields shown:** Event · When · Invited · Accepted · Declined · Pending · Response · Guest · Side · RSVP · …
- **Rail (saved views/meters):** All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- **Primary action:** + New guest
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `21a`, `21b`, `21c`, `5a`.

Drawings:
- `21a` — Guest List · Table view
- `21b` — Guest List · Households view
- `21c` — Guest List · Seating view
- `5a` — Guest · full editor window

##### `21a` — Guest List · Table view

- **Purpose.** The canonical guest page. Six columns of twenty-four — the six you scan by, with the other eighteen in the record editor. That is the column budget doing its job: the name column has a 240px floor, and after the rail and the drawer six is what fits without squeezing names. The Columns chip reads 6 of 24 and swaps one in by taking one out.
- **Lives under tab:** People (view)
- **Table columns / fields shown:** Guest · Household · Side · RSVP · Table · Meal · Event · When · Invited · Accepted · …
- **Rail (saved views/meters):** All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- **Primary action:** + New guest
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `21b` — Guest List · Households view

- **Purpose.** Same 142 guests, grouped into 62 households — because invitations, save-the-dates and thank-you letters go to an envelope, not a person. The Mensah household shows amber across two tables: two of its four are children seated at T14. Sometimes that is deliberate, so the view states it rather than judging it.
- **Lives under tab:** People (view)
- **Table columns / fields shown:** Household · Members · Seats needed · Address · Invitation · Table
- **Rail (saved views/meters):** All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- **Primary action:** + New guest
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `21c` — Guest List · Seating view

- **Purpose.** The worklist half of seating. Twenty-four unseated guests on the left, the fifteen tables from Table Layout on the right, and only two free seats between them — so the page shows the shortfall rather than letting you discover it one drag at a time. Table Layout owns the room; this owns the queue. Both write the same two fields on the guest record.
- **Lives under tab:** People (view)
- **Rail (saved views/meters):** All guests · Unconfirmed · No meal chosen · Not invited yet · Needs address · Unseated · Thank-you pending
- **Primary action:** + New guest
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `5a` — Guest · full editor window

- **Purpose.** All 24 fields in five groups, three columns. Left rail switches records without closing the window, so a planner can work down a household. Linked panels — household members, events, companions — are live, not read-only text.
- **Lives under tab:** Money
- **Rail (saved views/meters):** Efua Mensah
- **Primary action:** Save & close
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Guest drawer · 5 tabs · Guest · Household · Seating · RSVP · History

Tabs, in this order: **Guest** · **Household** · **Seating** · **RSVP** · **History**.

- **Guest** — `Guest drawer · Guest tab`. The person. Name as it goes on a place card, side, group, and the two contact fields the planner actually chases.
- **Household** — `Guest drawer · Household tab`. The addressable unit. One invitation, one address, one envelope — the guest is a member of it, and the count follows.
- **Seating** — `Guest drawer · Seating tab`. Where she sits and who she sits with. Reads from Table Layout; editing here writes back to it and to the caterer’s sheet.
- **RSVP** — `Guest drawer · RSVP tab`. The reply and everything the caterer needs from it — meal, allergies, and the date the answer arrived.
- **History** — `Guest drawer · History tab`. Who changed what, and what each change re-derived. The audit line is the same shape on every record in the planner.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `3b`, `5a`.

Drawings:
- `3b` — Guest List — full page
- `5a` — Guest List · Table view · night
- Guest List · Households view · night
- Guest List · Seating view · night
- Guest · full editor window

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-03"></a>

## 03 · Planning Timeline & Tasks

- **Master section:** `s03` · slug `planning-timeline-tasks`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `9a`, `20c`, `20d`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `9a` |
| View switcher views | yes | `20c`, `20d` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Task drawer · 4 tabs: Task · Depends on · People · History |
| Night theme | yes | `9a` |

**View switcher options (exact labels):** Timeline & Tasks · Board view · Timeline & Tasks · Timeline view

**Record drawers:**
- Task drawer · 4 tabs · Task · Depends on · People · History: Task · Depends on · People · History

**Stat strips:**
- `9a` Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- `20c` Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- `20d` Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- `9a` Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96

**Rail:**
- `9a` All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- `20c` All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- `20d` All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- `9a` All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete

**Primary actions:**
- `9a` + New task
- `20c` + New task
- `20d` + New task
- `9a` + New task
- + New task

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `9a`.

Drawings:
- `9a` — Planning Timeline & Tasks

##### `9a` — Planning Timeline & Tasks

- **Purpose.** The screen the whole system was derived from, carried across into the screen set. Phase-checklist chips sit under the stat strip and the overall-progress card closes the page — both from the current planner. Its header predates the button order in §12, so Print section and Full editor are added here to match the other eleven screens.
- **Lives under tab:** Planning
- **Table columns / fields shown:** Task · Owner · Due · Priority · Status · Linked
- **Stat strip:** Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- **Rail (saved views/meters):** All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- **Primary action:** + New task
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `20c`, `20d`.

Drawings:
- `20c` — Timeline & Tasks · Board view
- `20d` — Timeline & Tasks · Timeline view

##### `20c` — Timeline & Tasks · Board view

- **Purpose.** Same 59 tasks as 9a. Columns are status; swimlanes are phase — and that way round is the whole decision. Phase is already the rail and the Timeline view, so making it the columns too would give three views of one axis and none of status. Dragging a card changes what you change constantly; phase is set once. Blocked gets its own column rather than being an amber note, because it is a stop, not a stage — and both blocked cards are also the page’s two overdue tasks. Lane and column counts partition all fifty-nine: 43 not started, 10 in progress, 2 blocked, 4 complete.
- **Lives under tab:** Planning (view)
- **Stat strip:** Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- **Rail (saved views/meters):** All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- **Primary action:** + New task
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `20d` — Timeline & Tasks · Timeline view

- **Purpose.** Phases as bands, tasks as bars, with today and 8 November both drawn as rules. All eight of 9a’s phases, using 9a’s own names. The point is the two red bars: “Order the cake” is three days overdue with a six-week lead time, so its latest possible start was 27 September, and “Send final headcount” waits on an RSVP deadline that is not set on Wedding Setup — a task with a due date whose blocker has none. A due-date column sorts those among fifty-five others; only this view puts them beside the date they cannot cross.
- **Lives under tab:** Planning (view)
- **Stat strip:** Open: 55 · Complete: 4 · Overdue: 2 · Unassigned: 11 · Days to wedding: 96
- **Rail (saved views/meters):** All tasks · Due this month · Overdue · Unassigned · Waiting on vendor · Complete
- **Primary action:** + New task
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Task drawer · 4 tabs · Task · Depends on · People · History

Tabs, in this order: **Task** · **Depends on** · **People** · **History**.

- **Task** — `Task drawer · Task tab`. The work itself. A task is a sentence with a verb, an owner and a date — never a category heading pretending to be work.
- **Depends on** — `Task drawer · Depends on tab`. The chain, both directions. What must happen first, and what is waiting on this — the reason a due date is not a wish.
- **People** — `Task drawer · People tab`. Owner, watchers and the vendor on the other end. Everyone who gets a notification when this moves.
- **History** — `Task drawer · History tab`. Every move of the date, and what each move cost downstream.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `9a`.

Drawings:
- `9a` — Planning Timeline & Tasks
- Timeline & Tasks · Board view · night
- Timeline & Tasks · Timeline view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-04"></a>

## 04 · Appointments

- **Master section:** `s04` · slug `appointments`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `14a`, `20a`, `20b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `14a` |
| View switcher views | yes | `20a`, `20b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Appointment · 14a: Appointment · Travel · Who · History |
| Night theme | yes | `14a` |

**View switcher options (exact labels):** Appointments · Calendar view · Appointments · Agenda view

**Record drawers:**
- Appointment · 14a · 4 drawers: Appointment · Travel · Who · History

**Rail:**
- `14a` All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- `20a` All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- `20b` All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- `14a` All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends

**Primary actions:**
- `14a` Book appointment
- `20a` Book appointment
- `20b` Book appointment
- `14a` Book appointment
- Book appointment

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `14a`.

Drawings:
- `14a` — Appointments

##### `14a` — Appointments

- **Purpose.** The page that feeds the Smart Calendar. Nine appointments, each owning a vendor, a place and a travel allowance — the field the calendar cannot show but the day depends on, which is why a conflict here reads as a clash of travel time rather than of start times.
- **Lives under tab:** Planning
- **Table columns / fields shown:** Appointment · Vendor · When · Where · Travel · Who · Status
- **Rail (saved views/meters):** All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- **Primary action:** Book appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `20a`, `20b`.

Drawings:
- `20a` — Appointments · Calendar view
- `20b` — Appointments · Agenda view

##### `20a` — Appointments · Calendar view

- **Purpose.** The two views 14a names in its switcher but never draws. Same nine records, drawn on time. A month grid would be ninety per cent empty, so this is a two-week time grid with empty days collapsed — and travel is a hatched band before each block: one journey, one band, drawn only on the arrival side so the trip between two appointments is never counted twice. On 20 August the blocks never touch, but the 75-minute run from Adenta overlaps the tasting by fifteen minutes. That red sliver is the clash.
- **Lives under tab:** The Day (view)
- **Rail (saved views/meters):** All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- **Primary action:** Book appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `20b` — Appointments · Agenda view

- **Purpose.** The reading view, and this page’s print target — “Print section” should produce this, not the table. Group headers become date headers, and travel becomes a gap row between entries, which is how an itinerary actually reads. Held sits last with its reason stated, because three appointments have no date and cannot sort into a month.
- **Lives under tab:** The Day (view)
- **Rail (saved views/meters):** All appointments · Next 30 days · Needs confirming · Clashes · Past · Month · Vendor · Who attends
- **Primary action:** Book appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Appointment · 14a · 4 drawers

Tabs, in this order: **Appointment** · **Travel** · **Who** · **History**.

- **Appointment**. A tasting whose outcome is meant to decide the vegetarian main nine guests are waiting on.
- **Travel**. A margin on the block, not a second event — and the reason the 5:00pm walkthrough cannot happen.
- **Who**. Three attendees, and the one who should be there but is not: the planner, at the tasting that sets the menu.
- **History**. Moving it one hour turned ninety minutes of slack into minus fifteen.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `14a`.

Drawings:
- `14a` — Appointments
- Appointments · Calendar view · night
- Appointments · Agenda view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-05"></a>

## 05 · Smart Calendar

- **Master section:** `s05` · slug `smart-calendar`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `6a`, `45a`, `45b`, `19i`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `6a` |
| View switcher views | yes | `45a`, `45b` |
| Section tabs | yes | `19i` |
| Record drawer tabs | yes | Calendar entry drawer · 4 tabs: Entry · Source · People · History |
| Night theme | yes | `6a` |

**View switcher options (exact labels):** Smart Calendar · Month view · Smart Calendar · By source view

**Record drawers:**
- Calendar entry drawer · 4 tabs · Entry · Source · People · History: Entry · Source · People · History

**Stat strips:**
- `6a` Entries · August: 10 · Appointments · Aug: 3 · Payments due · Aug: $4,200 · Tasks due · Aug: 3 · Conflicts: 1

**Rail:**
- `6a` Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts

**Primary actions:**
- `6a` + New appointment

**Standing rules on this page:**
- `45a` **Honesty rule:** The calendar owns no records; every cell opens the record on the page that owns it.
- `45a` **Card shows:** Up to three items a day, then a count. Colour is the owning page, never the status.
- `45b` **Honesty rule:** Counts are of entries, not records: one appointment with two reminders is one entry.
- `45b` **Card shows:** Each owning page, its entry count, and every entry with its date.
- `6a` **Honesty rule:** Counts are of entries, not records: one appointment with two reminders is one entry.
- `6a` **Card shows:** Each owning page, its entry count, and every entry with its date.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `6a`.

Drawings:
- `6a` — Smart Calendar

##### `6a` — Smart Calendar

- **Purpose.** Nothing is authored here — every entry is a task, payment, appointment or counseling session that already exists elsewhere, colour-coded by source and read back onto the month. That is what makes it “smart”, and it is why the rail lists sources rather than filters you have to maintain. Overlaps are detected rather than allowed: 20 August holds two 6-o’clock commitments and is flagged. The stat strip counts only the month on screen — 10 entries, 3 appointments, 3 dated tasks — while the rail counts all dates, so the two sections are labelled with their scope rather than left to be guessed.
- **Lives under tab:** Planning
- **Stat strip:** Entries · August: 10 · Appointments · Aug: 3 · Payments due · Aug: $4,200 · Tasks due · Aug: 3 · Conflicts: 1
- **Rail (saved views/meters):** Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts
- **Primary action:** + New appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `45a`, `45b`.

Drawings:
- `45a` — Smart Calendar · Month view
- `45b` — Smart Calendar · By source view

##### `45a` — Smart Calendar · Month view

- **Purpose:** The shape of a month, at the density a planner scans rather than reads.
- **Lives under tab:** Planning · Smart Calendar · view switcher
- **Card shows:** Up to three items a day, then a count. Colour is the owning page, never the status.
- **Honesty rule:** The calendar owns no records; every cell opens the record on the page that owns it.

##### `45b` — Smart Calendar · By source view

- **Purpose:** Answering “why is this on my calendar?” without opening nine pages.
- **Lives under tab:** Planning · Smart Calendar · view switcher
- **Card shows:** Each owning page, its entry count, and every entry with its date.
- **Honesty rule:** Counts are of entries, not records: one appointment with two reminders is one entry.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19i`.

Drawings:
- `19i` — Smart Calendar · views, not sections

##### `19i` — Smart Calendar · views, not sections


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Calendar entry drawer · 4 tabs · Entry · Source · People · History

Tabs, in this order: **Entry** · **Source** · **People** · **History**.

- **Entry** — `Calendar entry · Entry tab`. One dated thing, whatever page it came from. The Smart Calendar owns no records of its own.
- **Source** — `Calendar entry · Source tab`. Which page owns this entry. Editing here writes to that page, and the drawer says so plainly.
- **People** — `Calendar entry · People tab`. Who is expected, and who has actually answered. A tasting slips because one person never replied.
- **History** — `Calendar entry · History tab`. What moved, when, and who moved it — including the two reschedules the bakery asked for.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `6a`.

Drawings:
- `6a` — Smart Calendar
- Smart Calendar · Month view · night
- Smart Calendar · By source view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-06"></a>

## 06 · Calendar · Week & Agenda

- **Master section:** `s06` · slug `calendar-week-agenda`
- **Header counts:** 4 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `6c`, `6d`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `6c` |
| View switcher views | yes | `6d` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Time block drawer · 4 tabs: Block · Conflicts · People · History |
| Night theme | yes | `6c`, `6d` |

**View switcher options (exact labels):** Calendar · Agenda

**Record drawers:**
- Time block drawer · 4 tabs · Block · Conflicts · People · History: Block · Conflicts · People · History

**Stat strips:**
- `6c` Entries · this week: 3 · Appointments: 1 · Payments due: $0 · Tasks due: 2 · Conflicts: 1
- `6d` Entries in range: 10 · Overdue: 2 · Payments due: $4,200 · Days to wedding: 96 · Conflicts: 1

**Rail:**
- `6c` Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts
- `6d` Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts

**Primary actions:**
- `6c` + New appointment
- `6d` + New appointment

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `6c`.

Drawings:
- `6c` — Calendar · Week

##### `6c` — Calendar · Week

- **Purpose.** The only view where time of day is geometry rather than a label, which is why it is the one that shows the overlap properly: the tasting and the counseling session sit side by side in the 6 pm row with the shared half-hour hatched. All-day and due-date entries can’t be placed on an hour, so they get their own band above the grid instead of being dropped at midnight.
- **Lives under tab:** Planning
- **Stat strip:** Entries · this week: 3 · Appointments: 1 · Payments due: $0 · Tasks due: 2 · Conflicts: 1
- **Rail (saved views/meters):** Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts
- **Primary action:** + New appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `6d`.

Drawings:
- `6d` — Calendar · Agenda

##### `6d` — Calendar · Agenda

- **Purpose.** A list from today forward, skipping empty days entirely — which is why it is the useful view when the wedding is still 102 days out and the month grid is mostly white space. Overdue items are pinned above today rather than left behind in July where nobody scrolls back to find them. Every row names its source, so you always know which page to edit.
- **Lives under tab:** Planning
- **Stat strip:** Entries in range: 10 · Overdue: 2 · Payments due: $4,200 · Days to wedding: 96 · Conflicts: 1
- **Rail (saved views/meters):** Everything · August · Appointments · Payments due · Tasks with dates · Vendor arrivals · Conflicts
- **Primary action:** + New appointment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Time block drawer · 4 tabs · Block · Conflicts · People · History

Tabs, in this order: **Block** · **Conflicts** · **People** · **History**.

- **Block** — `Time block · Block tab`. A span of the week rather than a single event: what is held, and what may not be booked over it.
- **Conflicts** — `Time block · Conflicts tab`. What already collides with it. The week view draws this; the drawer explains it.
- **People** — `Time block · People tab`. Who is inside the block, and who only needs to know it exists.
- **History** — `Time block · History tab`. Every move of this block, because the week either side of the wedding moves constantly.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `6c`, `6d`.

Drawings:
- `6c` — Calendar · Week
- `6d` — Calendar · Agenda

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-07"></a>

## 07 · Wedding Day Timeline

- **Master section:** `s07` · slug `wedding-day-timeline`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `6b`, `31a`, `31b`, `19g`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `6b` |
| View switcher views | yes | `31a`, `31b` |
| Section tabs | yes | `19g` |
| Record drawer tabs | yes | Wedding day event · 6b: Event · People · Run sheet · History |
| Night theme | yes | `6b` |

**View switcher options (exact labels):** Wedding Day Timeline · Ribbon view · Wedding Day Timeline · By vendor view

**Record drawers:**
- Wedding day event · 6b · 4 drawers: Event · People · Run sheet · History

**Stat strips:**
- `6b` Events: 14 · First call: 7:00 am · Ceremony: 4:00 pm · Send-off: 10:30 pm · Gaps: 1

**Rail:**
- `6b` Full day · Vendor calls · Couple only · Wedding party · Unassigned

**Primary actions:**
- `6b` + New event

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `6b`.

Drawings:
- `6b` — Wedding Day Timeline

##### `6b` — Wedding Day Timeline

- **Purpose.** Fourteen events grouped into four blocks. Duration is a real field, so the page can compute what sits between events — the 45-minute hole after portraits that Planning health flags on the Dashboard shows up here as a row, not a note. Owner and location move to the drawer so the event name keeps 400px; vendor calls match the Contacts sheet exactly.
- **Lives under tab:** The Day
- **Table columns / fields shown:** Time · Length · Event · Vendor · Status
- **Stat strip:** Events: 14 · First call: 7:00 am · Ceremony: 4:00 pm · Send-off: 10:30 pm · Gaps: 1
- **Rail (saved views/meters):** Full day · Vendor calls · Couple only · Wedding party · Unassigned
- **Primary action:** + New event
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `31a`, `31b`.

Drawings:
- `31a` — Wedding Day Timeline · Ribbon view
- `31b` — Wedding Day Timeline · By vendor view

##### `31a` — Wedding Day Timeline · Ribbon view

- **Purpose:** Reading the day end to end. Blocks, not events — the table view holds the fourteen individual events.
- **Lives under tab:** The Day · Wedding Day Timeline · view switcher
- **How it connects:** Same records as this page’s first view. Times are derived from the owning timeline block; editing one moves everything after it.
- **Bars:** Amber marks a block with no slack: formals at 66 seconds per grouping, and carriages against the venue’s 1:00am curfew.
- **Derivation:** Block start times are derived from the durations inside them. Adding five minutes to the ceremony moves everything to its right.

##### `31b` — Wedding Day Timeline · By vendor view

- **Purpose:** Generating per-vendor call sheets, and finding obligations nobody owns.
- **Lives under tab:** The Day · Wedding Day Timeline · view switcher
- **Group row format:** vendor · on-site window · obligation count.
- **How it connects:** Same records as this page’s first view. Times are derived from the owning timeline block; editing one moves everything after it.
- **Rule:** “No vendor attached” is a group, not a filter. An unowned obligation on the wedding day is the highest-severity state this page has.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19g`.

Drawings:
- `19g` — Wedding Day Timeline · two tabs

##### `19g` — Wedding Day Timeline · two tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Wedding day event · 6b · 4 drawers

Tabs, in this order: **Event** · **People** · **Run sheet** · **History**.

- **Event**. A block, not a list of cues. The cues are one tab across, and that is what gets printed.
- **People**. Everyone resolves to a guest or vendor record, so the contact sheet is generated rather than typed.
- **Run sheet**. Minute-level cues, and the one nobody owns: who presses play on cue 1.
- **History**. Five extra minutes moved every block after it, logged as one change.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `6b`.

Drawings:
- `6b` — Wedding Day Timeline
- Wedding Day Timeline · Ribbon view · night
- Wedding Day Timeline · By vendor view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-08"></a>

## 08 · Budget

- **Master section:** `s08` · slug `budget`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `4a`, `30a`, `30b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `4a` |
| View switcher views | yes | `30a`, `30b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Budget line drawer · 4 tabs: Line · Estimate vs actual · Payments · History |
| Night theme | yes | `4a` |

**View switcher options (exact labels):** Budget · By category view · Budget · Pledged & paid view

**Record drawers:**
- Budget line drawer · 4 tabs · Line · Estimate vs actual · Payments · History: Line · Estimate vs actual · Payments · History

**Rail:**
- `4a` All categories · Over target · Nothing spent · Linked from Payments · Owned by Catering · Gratuity planned

**Primary actions:**
- `4a` + Add category

**Standing rules on this page:**
- `30a` **Honesty rule:** Over-target categories render red at the group row, not just on the offending line, because the decision is made at category level.
- `4a` **Honesty rule:** Over-target categories render red at the group row, not just on the offending line, because the decision is made at category level.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `4a`.

Drawings:
- `4a` — Budget — full page

##### `4a` — Budget — full page

- **Purpose.** Every section of the current page, in reading order: stat strip → budget-used bar → Budget by Category (all six utility buttons, ranked) → category rows → Budget Reconciliation with By category / By vendor → True Total projection → Budget Logic → Tipping Etiquette → the itemized table for the selected category, built on the Guest List pattern (grouped rows, checkbox column, bulk bar, filter chips, inline add row, row drawer). Note: Budget Logic and Tipping Etiquette exist in planner.css but have no markup in today's page, and True Total only appears in the m3 dashboard mockup — so those three are new here, built to match.
- **Lives under tab:** Money
- **Table columns / fields shown:** Category · Spend · Target · Actual · Variance · Source · Planned · Budget entries · Payments · Spent · …
- **Rail (saved views/meters):** All categories · Over target · Nothing spent · Linked from Payments · Owned by Catering · Gratuity planned
- **Primary action:** + Add category
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30a`, `30b`.

Drawings:
- `30a` — Budget · By category view
- `30b` — Budget · Pledged & paid view

##### `30a` — Budget · By category view

- **Purpose:** Category-level variance. The itemized view is for editing lines; this is for deciding what to cut.
- **Lives under tab:** Money · Budget · view switcher
- **Group row format:** category · committed of target · variance · line count · paid — the one roll-up format used across the planner.
- **Honesty rule:** Over-target categories render red at the group row, not just on the offending line, because the decision is made at category level.
- **How it connects:** Same records as this page’s first view — a layout, not a new data source. Every money figure is derived from the owning line item or payment, never typed twice.

##### `30b` — Budget · Pledged & paid view

- **Purpose:** Tracking funding sources against spend. Two different questions live here: has it been promised, and has it arrived.
- **Lives under tab:** Money · Budget · view switcher
- **Group row format:** source · pledged · paid · % honoured · next promise.
- **How it connects:** Same records as this page’s first view — a layout, not a new data source. Every money figure is derived from the owning line item or payment, never typed twice.
- **The shortfall group:** Rendered as a group, not a footnote — unfunded commitment is a state of the budget, so it gets a row.
- **Unassigned money:** A contribution not tied to a line renders amber Unassigned rather than silently inflating a category.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Budget line drawer · 4 tabs · Line · Estimate vs actual · Payments · History

Tabs, in this order: **Line** · **Estimate vs actual** · **Payments** · **History**.

- **Line** — `Budget line · Line tab`. One row of the budget, opened. Estimate, commitment and the gap between them, in that order.
- **Estimate vs actual** — `Budget line · Estimate vs actual tab`. Where the number came from and how it moved. A budget that hides its revisions teaches nothing.
- **Payments** — `Budget line · Payments tab`. Each payment against this line, and the two that have not happened yet.
- **History** — `Budget line · History tab`. Every change to this line, including the ones the couple made without telling the planner.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `4a`.

Drawings:
- `4a` — Budget — full page
- Budget · By category view · night
- Budget · Pledged & paid view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-09"></a>

## 09 · Payments

- **Master section:** `s09` · slug `payments`
- **Header counts:** 4 screens · 1 record drawer
- **Status:** done — reviewed in product; keep as reference, do not reopen unless asked
- **Screen ids:** `4b`, `30c`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `4b` |
| View switcher views | yes | `30c` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Payment drawer · 4 tabs: Payment · Contract · Method · History |
| Night theme | yes | `4b` |

**View switcher options (exact labels):** Payments · Calendar view

**Record drawers:**
- Payment drawer · 4 tabs · Payment · Contract · Method · History: Payment · Contract · Method · History

**Stat strips:**
- `4b` Committed: $20,440 · Paid: $11,360 · Outstanding: $9,080 · Due in 30 days: $3,740 · Gratuity planned: $1,000

**Rail:**
- `4b` All payments · Due in 30 days · Unpaid · Deposits only · Gratuity not planned · No budget category

**Primary actions:**
- `4b` + New payment

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `4b`.

Drawings:
- `4b` — Payments

##### `4b` — Payments

- **Purpose.** Grouped by due month so the next cash-out is always at the top. The record's gratuity fields (amount and status) get their own columns rather than hiding in notes, and the drawer shows the budget category and contract each payment is wired to. Each payment can carry an installment plan — expand a row, or use the drawer’s Installments tab. Committed here counts payment records only ($20,440); Budget’s $22,040 adds the $1,600 of manual entries with no payment record behind them.
- **Lives under tab:** People
- **Table columns / fields shown:** Vendor · Instalment · Amount · Due · Paid on · Method · Status · Vendor & description · Paid · Gratuity · …
- **Stat strip:** Committed: $20,440 · Paid: $11,360 · Outstanding: $9,080 · Due in 30 days: $3,740 · Gratuity planned: $1,000
- **Rail (saved views/meters):** All payments · Due in 30 days · Unpaid · Deposits only · Gratuity not planned · No budget category
- **Primary action:** + New payment
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30c`.

Drawings:
- `30c` — Payments · Calendar view

##### `30c` — Payments · Calendar view

- **Purpose:** Cash-flow shape. The question is not what is owed but when it clusters.
- **Lives under tab:** Money · Payments · view switcher
- **How it connects:** Same records as this page’s first view — a layout, not a new data source. Every money figure is derived from the owning line item or payment, never typed twice.
- **Colour:** Red is overdue or at-risk, amber is due this month, blue is scheduled and funded. Colour never encodes size.
- **Interaction:** Dragging a payment to another day proposes a new due date and flags the vendor whose contract sets it — it never silently rewrites a contracted date.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Payment drawer · 4 tabs · Payment · Contract · Method · History

Tabs, in this order: **Payment** · **Contract** · **Method** · **History**.

- **Payment** — `Payment drawer · Payment tab`. One instalment. Amount, date and the state it is in — never a running balance, which belongs to the contract.
- **Contract** — `Payment drawer · Contract tab`. The paper this instalment came from, and where it sits in the schedule. Read-only here — the contract owns its own totals.
- **Method** — `Payment drawer · Method tab`. How it will actually be paid, and from which pot. The tab that stops two people paying the same invoice twice.
- **History** — `Payment drawer · History tab`. The date moves, the amount corrections, and what each did to the Money tab.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `4b`.

Drawings:
- `4b` — Payments
- Payments · Calendar view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-10"></a>

## 10 · Contracts & Invoices

- **Master section:** `s10` · slug `contracts-invoices`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §11
- **Screen ids:** `10c`, `30d`, `30e`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `10c` |
| View switcher views | yes | `30d`, `30e` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Contract drawer · 4 tabs: Document · Terms · Payments · History |
| Night theme | yes | `10c` |

**View switcher options (exact labels):** Contracts & Invoices · Documents view · Contracts & Invoices · Schedule view

**Record drawers:**
- Contract drawer · 4 tabs · Document · Terms · Payments · History: Document · Terms · Payments · History

**Rail:**
- `10c` All contracts · Signed · Awaiting signature · Cancellation window open · Needs schedule · Vendor · Due date · Status

**Primary actions:**
- `10c` Add contract

**Standing rules on this page:**
- `30d` **Card shows:** Document, signature state, page count, value, the one clause that governs a deadline, instalment count.
- `10c` **Card shows:** Document, signature state, page count, value, the one clause that governs a deadline, instalment count.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `10c`.

Drawings:
- `10c` — Contracts & Invoices

##### `10c` — Contracts & Invoices

- **Purpose.** Five signed contracts holding $20,440 of committed money. Each row carries its own payment schedule as a child panel, which is how the Database Hub knows Grace Hall is the one contract whose instalments live on the payment record instead.
- **Lives under tab:** Money
- **Table columns / fields shown:** Contract · Vendor · Signed · Total · Paid · Next due · Status
- **Rail (saved views/meters):** All contracts · Signed · Awaiting signature · Cancellation window open · Needs schedule · Vendor · Due date · Status
- **Primary action:** Add contract
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30d`, `30e`.

Drawings:
- `30d` — Contracts & Invoices · Documents view
- `30e` — Contracts & Invoices · Schedule view

##### `30d` — Contracts & Invoices · Documents view

- **Purpose:** Document custody. The question is what is signed, what is missing, and what expires.
- **Lives under tab:** Money · Contracts & Invoices · view switcher
- **Card shows:** Document, signature state, page count, value, the one clause that governs a deadline, instalment count.
- **How it connects:** Same records as this page’s first view — a layout, not a new data source. Every money figure is derived from the owning line item or payment, never typed twice.
- **Rule:** A required document that does not exist yet still gets a card, rendered red Missing — absence is a state, not an empty row.

##### `30e` — Contracts & Invoices · Schedule view

- **Purpose:** Seeing the obligation curve. Contracts create instalments; this is the shape they make together.
- **Lives under tab:** Money · Contracts & Invoices · view switcher
- **How it connects:** Same records as this page’s first view — a layout, not a new data source. Every money figure is derived from the owning line item or payment, never typed twice.
- **Bars:** Green is paid, amber is scheduled and unpaid, red belongs to an unsigned contract — a payment nobody is yet obliged to make.
- **Derivation:** Instalments are child records of a contract (§13), so this timeline is drawn, never typed. Editing an instalment date here writes to the contract.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Contract drawer · 4 tabs · Document · Terms · Payments · History

Tabs, in this order: **Document** · **Terms** · **Payments** · **History**.

- **Document** — `Contract · Document tab`. The document itself: what it is, who signed it, and where the file lives.
- **Terms** — `Contract · Terms tab`. The four clauses that decide what happens when something goes wrong.
- **Payments** — `Contract · Payments tab`. The invoices raised against this contract, and what is still outstanding.
- **History** — `Contract · History tab`. Version by version — including the clause the studio quietly changed between drafts.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `10c`.

Drawings:
- `10c` — Contracts & Invoices
- Contracts & Invoices · Documents view · night
- Contracts & Invoices · Schedule view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-11"></a>

## 11 · Venue & Vendors

- **Master section:** `s11` · slug `venue-vendors`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §12
- **Screen ids:** `4c`, `30f`, `30g`, `19f`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `4c` |
| View switcher views | yes | `30f`, `30g` |
| Section tabs | yes · resolved by `4c` | `19f` — Master purpose on `4c` replaces Tracker / Shortlist tabs with **Table · Compare · Contacts** view switcher; do not re-add the two-tab strip |
| Record drawer tabs | yes | Vendor drawer · 5 tabs: Vendor · Contract · Schedule · Contacts · History |
| Night theme | yes | `4c` |

**View switcher options (exact labels):** Venue & Vendors · Compare view · Venue & Vendors · Contacts view

**Record drawers:**
- Vendor drawer · 5 tabs · Vendor · Contract · Schedule · Contacts · History: Vendor · Contract · Schedule · Contacts · History

**Stat strips:**
- `4c` Vendors: 10 · Booked: 5 · Booked value: $20,440 · Paid to date: $11,360 · No contract: 4

**Rail:**
- `4c` All vendors · Booked · Shortlist · No contract on file · Balance outstanding

**Primary actions:**
- `4c` + New vendor

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `4c`.

Drawings:
- `4c` — Venue & Vendors

##### `4c` — Venue & Vendors

- **Purpose.** Keeps the two jobs the current page does — tracking booked vendors and comparing a shortlist — but as one table with a Compare view rather than two tabs. Quote, deposit, balance and rating are columns; pros and cons live in the drawer. Rating uses filled/empty squares, not stars, so it survives print. Booked value and Paid to date count booked vendors only ($20,440 / $11,360, matching Payments); the two shortlisted photography quotes are visible in their rows but excluded until one is booked.
- **Lives under tab:** People
- **Table columns / fields shown:** Vendor · Category · Quote · Balance · Rating · Status · Contract · Field · Nuru Studio · Still & Light · …
- **Stat strip:** Vendors: 10 · Booked: 5 · Booked value: $20,440 · Paid to date: $11,360 · No contract: 4
- **Rail (saved views/meters):** All vendors · Booked · Shortlist · No contract on file · Balance outstanding
- **Primary action:** + New vendor
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30f`, `30g`.

Drawings:
- `30f` — Venue & Vendors · Compare view
- `30g` — Venue & Vendors · Contacts view

##### `30f` — Venue & Vendors · Compare view

- **Purpose:** Deciding between quotes. Rows are the attributes that actually differed, not every field a vendor record holds.
- **Lives under tab:** Vendors · Venue & Vendors · view switcher
- **How it connects:** Same records as this page’s first view. Vendor money is derived from the budget line the vendor owns; changing it here changes it there.
- **Column source:** Each column is a vendor record; the Quote row is the vendor’s budget-line value, derived not typed.
- **Marks:** ✓ included · ○ partial · ● available at extra cost · — not offered. A blank cell is never rendered.
- **Rule:** Passed vendors stay in the matrix, greyed in the Status row, so the reason a choice was made survives after the choice.

##### `30g` — Venue & Vendors · Contacts view

- **Purpose:** Reaching a vendor, and deciding who belongs on the day-of contact sheet.
- **Lives under tab:** Vendors · Venue & Vendors · view switcher
- **Groups:** Day-of critical · Pre-day only · No number on file. The third group exists so a missing number is visible rather than absent.
- **How it connects:** Same records as this page’s first view. Vendor money is derived from the budget line the vendor owns; changing it here changes it there.
- **Overlap with Contacts page:** The People · Contacts page unions guests and vendors; this view is vendors only, with arrival and service times the Contacts page has no field for.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19f`.

Drawings:
- `19f` — Venue & Vendors · two tabs

##### `19f` — Venue & Vendors · two tabs

`4c` purpose: one table with a Compare view **rather than two tabs**. Shipping UI uses the view switcher (**Table · Compare · Contacts**). Table is the record surface; Compare is the decision surface; Contacts is the day-of reachability surface. Do not reintroduce Vendor Tracker / Shortlist & Compare section tabs on top of that.
#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Vendor drawer · 5 tabs · Vendor · Contract · Schedule · Contacts · History

Tabs, in this order: **Vendor** · **Contract** · **Schedule** · **Contacts** · **History**.

- **Vendor** — `Vendor drawer · Vendor tab`. The business. What they supply, what they cost, and the one line that says whether they are actually confirmed.
- **Contract** — `Vendor drawer · Contract tab`. The paper, the clauses that bite, and the documents still missing. The only authoritative total in the planner.
- **Schedule** — `Vendor drawer · Schedule tab`. When they are on site, and the run-sheet blocks that belong to them. This is what the vendor sees in their portal.
- **Contacts** — `Vendor drawer · Contacts tab`. Who to actually ring. A business is not a contact — the person who answers on a Saturday is.
- **History** — `Vendor drawer · History tab`. Booking, price changes, document chases — the record you read when a vendor says “that was always the price”.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `4c`.

Drawings:
- `4c` — Venue & Vendors
- Venue & Vendors · Compare view · night
- Venue & Vendors · Contacts view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-12"></a>

## 12 · Catering & Menu

- **Master section:** `s12` · slug `catering-menu`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §13
- **Screen ids:** `7a`, `30h`, `30i`, `19p`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `7a` |
| View switcher views | yes | `30h`, `30i` |
| Section tabs | yes · deliberately not tabbed | `19p` — nine sections stacked; rail **Sections · jump** scrolls; do not add a tab strip |
| Record drawer tabs | yes | Menu item · Item · Guests · Costing · History |
| Night theme | yes | `7a` |

**View switcher options (exact labels):** Catering & Menu · Tasting notes view · Catering & Menu · Allergens view

**Record drawers:**
- Menu item · 7a · 4 drawers: Item · Guests · Costing · History

**Stat strips:**
- `7a` Covers contracted: 74 · Guests accepted: 86 · Shortfall: 12 · Food committed: $4,800 · Catering target: $8,900

**Rail:**
- `7a` Full menu · Not yet chosen · Allergen-relevant · Cake & dessert · Drinks · Rentals

**Primary actions:**
- `7a` + New item

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `7a`.

Drawings:
- `7a` — Catering & Menu

##### `7a` — Catering & Menu

- **Purpose.** Owns the Food, Cake, Drinks and Rentals budget lines — which is why those rows are read-only on the Budget page. The headcount panel is the point of the screen: 74 covers contracted against 86 accepted, the twelve-cover shortfall the Dashboard reports, and what closing it would cost against the $4,100 still unspent in the Catering target.
- **Lives under tab:** Vendors
- **Table columns / fields shown:** Item · Serves · Unit · Line total · Allergens · Status · Line · Category · Qty · Total · …
- **Stat strip:** Covers contracted: 74 · Guests accepted: 86 · Shortfall: 12 · Food committed: $4,800 · Catering target: $8,900
- **Rail (saved views/meters):** Full menu · Not yet chosen · Allergen-relevant · Cake & dessert · Drinks · Rentals
- **Primary action:** + New item
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30h`, `30i`.

Drawings:
- `30h` — Catering & Menu · Tasting notes view
- `30i` — Catering & Menu · Allergens view

##### `30h` — Catering & Menu · Tasting notes view

- **Purpose:** The decision record behind the menu. Scores and verbatim comments per dish, per tasting.
- **Lives under tab:** Vendors · Catering & Menu · view switcher
- **Row shows:** Dish, the one quote that decided it, per-taster scores, verdict chip.
- **How it connects:** Same records as this page’s first view. Vendor money is derived from the budget line the vendor owns; changing it here changes it there.
- **Open loop:** Tasting 2 carries the vegetarian main nine guests are waiting on — the same fact the appointment record surfaces.
- **Rule:** A rejected dish keeps its row. The Menu view shows what is served; this view shows what was considered.

##### `30i` — Catering & Menu · Allergens view

- **Purpose:** Safety. Dish against allergen, with the guest counts affected beside it.
- **Lives under tab:** Vendors · Catering & Menu · view switcher
- **How it connects:** Same records as this page’s first view. Vendor money is derived from the budget line the vendor owns; changing it here changes it there.
- **Cross-check:** Guest dietary flags come from the guest records; the collision warning is derived by comparing the two, not typed by hand.
- **Marks:** ● contains · ○ may contain, shared kitchen · — free of · ✓ suitable for that diet. “May contain” is never collapsed into “free of”.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19p`.

Drawings:
- `19p` — Catering & Menu · nine sections, deliberately NOT tabbed

##### `19p` — Catering & Menu · nine sections, deliberately NOT tabbed

Tabs would hide eight of nine consequences of a headcount change. Shipping UI stacks Menu builder · Beverage & bar · Children’s menu · Place settings · Tableware & rentals · Pre-wedding snacks · Vendor meals · Catering costs · Dietary summary under the Menu table, and the rail **Sections · jump** scrolls to them. Do not introduce a section tab strip.
#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Menu item · 7a · 4 drawers

Tabs, in this order: **Item** · **Guests** · **Costing** · **History**.

- **Item**. A menu line with a headcount but no price — the only one the Budget cannot cost, and it says so.
- **Guests**. Nine guests derived from the dietary field. Not editable here: a guest changing their meal changes this count.
- **Costing**. What it would cost if priced, shown as an estimate. A projected figure never joins a committed total.
- **History**. The serves count changed because a guest did, not because anyone typed it.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `7a`.

Drawings:
- `7a` — Catering & Menu
- Catering & Menu · Tasting notes view · night
- Catering & Menu · Allergens view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-13"></a>

## 13 · Table Layout

- **Master section:** `s13` · slug `table-layout`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §14
- **Screen ids:** `8a`, `29c`, `29d`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `8a` |
| View switcher views | yes | `29c`, `29d` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Table · 8a: Table · Seats · Notes · History |
| Night theme | yes | `8a` |

**View switcher options (exact labels):** Table Layout · List view · Table Layout · By guest view

**Record drawers:**
- Table · 8a · 4 drawers: Table · Seats · Notes · History

**Stat strips:**
- `8a` Tables: 15 · Seats: 120 · Assigned: 118 · Free seats: 2 · Short by: 22

**Rail:**
- `8a` All tables · Has free seats · Full · Unseated guests

**Primary actions:**
- `8a` + New table

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `8a`.

Drawings:
- `8a` — Table Layout

##### `8a` — Table Layout

- **Purpose.** Fifteen tables as seat grids rather than drawn circles — a filled square is an assigned guest, so capacity is readable at a glance and the page prints. The arithmetic is the honest part: 120 seats, 118 assigned, 2 free, and 24 guests still unseated, which means the room is 22 seats short. The rail says why each of the 24 can’t be seated yet.
- **Lives under tab:** People
- **Table columns / fields shown:** Guest · Table · Seat · Side · Group · RSVP · Meal
- **Stat strip:** Tables: 15 · Seats: 120 · Assigned: 118 · Free seats: 2 · Short by: 22
- **Rail (saved views/meters):** All tables · Has free seats · Full · Unseated guests
- **Primary action:** + New table
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `29c`, `29d`.

Drawings:
- `29c` — Table Layout · List view
- `29d` — Table Layout · By guest view

##### `29c` — Table Layout · List view

- **Purpose:** Auditing seat assignments, dietary spread and the unseated tail; the plan view is for arranging, this is for checking.
- **Lives under tab:** People · Table Layout · view switcher
- **Group rows:** One per table, carrying seated / capacity · free seats · dietary count — the same roll-up format used everywhere else.
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.
- **Rule:** “Not seated” is a group, not a filter, so accepted-but-unseated guests cannot fall out of view.

##### `29d` — Table Layout · By guest view

- **Purpose:** The single sheet the caterer and the place-card printer both work from.
- **Lives under tab:** People · Table Layout · view switcher
- **Columns:** Guest · Table · Seat · Side · Reply · Meal · Nut · GF · Veg · Place card. Sticky first column; dietary columns are marks, not text, so 142 rows stay scannable.
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.
- **Legend:** ● confirmed restriction · ○ suspected, awaiting confirmation · — none on file. A blank is never rendered as “no restriction”.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Table · 8a · 4 drawers

Tabs, in this order: **Table** · **Seats** · **Notes** · **History**.

- **Table**. The table as an object — capacity, shape, where it sits. Reducing capacity below the seated count refuses and names who it would displace.
- **Seats**. Who is here, and one suggestion derived from the household. One seated guest is still Pending, which the tab says.
- **Notes**. Constraints, not prose — and they print on the floor plan so the person setting the room sees them.
- **History**. The capacity change that created two of the 24 unseated guests, still traceable.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `8a`.

Drawings:
- `8a` — Table Layout
- Table Layout · List view · night
- Table Layout · By guest view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-14"></a>

## 14 · Vision Board

- **Master section:** `s14` · slug `vision-board`
- **Header counts:** 8 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §15
- **Screen ids:** `8b`, `46a`, `46b`, `19d`, `19e`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `8b` |
| View switcher views | yes | `46a`, `46b` |
| Section tabs | yes | `19d`, `19e` |
| Record drawer tabs | yes | Vision pin · 8b: Pin · Colours · Links · History |
| Night theme | yes | `8b` |

**View switcher options (exact labels):** Vision Board · List view · Vision Board · By category view

**Record drawers:**
- Vision pin · 8b · 4 drawers: Pin · Colours · Links · History

**Stat strips:**
- `8b` Pins: 6 · Categories: 4 · Palette: 5 · Linked to a vendor: 3 · Uncategorised: 1

**Rail:**
- `8b` All pins · Linked to a vendor · Linked to budget · Not categorised · Shared with vendors

**Primary actions:**
- `8b` + Add a pin

**Standing rules on this page:**
- `46a` **Honesty rule:** Position on the canvas carries no meaning here, so it is not shown as a column.
- `46b` **Honesty rule:** A category with no pins is drawn empty rather than omitted — silence is a finding.
- `46b` **Card shows:** Category, pin count, decided count and a settled bar capped at 100%.
- `8b` **Honesty rule:** A category with no pins is drawn empty rather than omitted — silence is a finding.
- `8b` **Card shows:** Category, pin count, decided count and a settled bar capped at 100%.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `8b`.

Drawings:
- `8b` — Vision Board

##### `8b` — Vision Board

- **Purpose.** Six pins, a five-colour palette, and a link from each pin to the vendor or budget line it commits you to — that link is what stops a mood board from being decoration. The image wells are deliberate placeholders: drop your own references in. I haven’t drawn stand-in artwork, because invented imagery would misrepresent the palette you’re choosing.
- **Lives under tab:** Vendors
- **Stat strip:** Pins: 6 · Categories: 4 · Palette: 5 · Linked to a vendor: 3 · Uncategorised: 1
- **Rail (saved views/meters):** All pins · Linked to a vendor · Linked to budget · Not categorised · Shared with vendors
- **Primary action:** + Add a pin
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `46a`, `46b`.

Drawings:
- `46a` — Vision Board · List view
- `46b` — Vision Board · By category view

##### `46a` — Vision Board · List view

- **Purpose:** A canvas is for looking; a list is for deciding. Same pins, sortable by status.
- **Lives under tab:** Vendors · Vision Board · view switcher
- **Row shows:** Pin, category, source, decision status and who added it.
- **Honesty rule:** Position on the canvas carries no meaning here, so it is not shown as a column.

##### `46b` — Vision Board · By category view

- **Purpose:** Seeing which part of the look is still open, rather than which pin is prettiest.
- **Lives under tab:** Vendors · Vision Board · view switcher
- **Card shows:** Category, pin count, decided count and a settled bar capped at 100%.
- **Honesty rule:** A category with no pins is drawn empty rather than omitted — silence is a finding.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19d`, `19e`.

Drawings:
- `19d` — Vision Board · five section tabs
- `19e` — Inspiration categories · a filter wearing tab clothing

##### `19d` — Vision Board · five section tabs


##### `19e` — Inspiration categories · a filter wearing tab clothing


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Vision pin · 8b · 4 drawers

Tabs, in this order: **Pin** · **Colours** · **Links** · **History**.

- **Pin**. The image and what it is attached to. Twelve of thirty-four pins are attached to nothing and are still just pictures.
- **Colours**. Three colours sampled, one off-palette — which becomes the wedding’s colour by accident if it reaches a vendor unapproved.
- **Links**. Sharing sends the image and the approved colours, not the note. The vendor sees what to make.
- **History**. Once shared, it cannot be un-shared. Changing it after means telling the vendor.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `8b`.

Drawings:
- `8b` — Vision Board
- Vision Board · List view · night
- Vision Board · By category view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-15"></a>

## 15 · Wedding Party

- **Master section:** `s15` · slug `wedding-party`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §17
- **Screen ids:** `10a`, `29a`, `29b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `10a` |
| View switcher views | yes | `29a`, `29b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Wedding party member · 10a: Role · Attire · Duties · Contact · History |
| Night theme | yes | `10a` |

**View switcher options (exact labels):** Wedding Party · Cards view · Wedding Party · Duties view

**Record drawers:**
- Wedding party member · 10a · 5 drawers: Role · Attire · Duties · Contact · History

**Rail:**
- `10a` Everyone · Bride’s side · Groom’s side · Attire outstanding · Speaking · Side · Role · Attire status

**Primary actions:**
- `10a` Add member

**Standing rules on this page:**
- `29a` **Card shows:** Name, role, side, attire status, duty count, day-of call time, readiness bar when something is outstanding.
- `10a` **Card shows:** Name, role, side, attire status, duty count, day-of call time, readiness bar when something is outstanding.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `10a`.

Drawings:
- `10a` — Wedding Party

##### `10a` — Wedding Party

- **Purpose.** Ten people who owe you something on the day — a fitting, a speech, a walk down an aisle. Every row is a guest record already, so the party page adds only the four fields the guest table does not carry: role, side, attire status and duties.
- **Lives under tab:** People
- **Table columns / fields shown:** Member · Role · Side · Attire · Duties · Fitting
- **Rail (saved views/meters):** Everyone · Bride’s side · Groom’s side · Attire outstanding · Speaking · Side · Role · Attire status
- **Primary action:** Add member
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `29a`, `29b`.

Drawings:
- `29a` — Wedding Party · Cards view
- `29b` — Wedding Party · Duties view

##### `29a` — Wedding Party · Cards view

- **Purpose:** A scannable roster used while chasing attire and duties.
- **Lives under tab:** People · Wedding Party · view switcher
- **Card shows:** Name, role, side, attire status, duty count, day-of call time, readiness bar when something is outstanding.
- **Toolbar:** Filter chips stay; column and row-height controls drop out (not a table).
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.

##### `29b` — Wedding Party · Duties view

- **Purpose:** Assign and audit duties by phase; the Unassigned column is the point of the view.
- **Lives under tab:** People · Wedding Party · view switcher
- **Columns:** Before the day · Morning of · Ceremony · Reception · Unassigned. Cards drag between columns; dropping into a phase sets the timing field, it does not invent one.
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.
- **Rule:** A duty with no owner renders in the red Unassigned column, never hidden inside a person’s card.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Wedding party member · 10a · 5 drawers

Tabs, in this order: **Role** · **Attire** · **Duties** · **Contact** · **History**.

- **Role**. What they are and where they sit — all of it read from the guest record. This page adds only what the guest table cannot hold.
- **Attire**. Status, fitting and cost, against the group deadline. The cost is paid by the member, so it never reaches the Budget.
- **Duties**. Three duties, two of them with times — so they also appear on the Timeline and the order of service.
- **Contact**. How to reach her, plus the two things she needs that nobody has booked.
- **History**. Only the four party fields. Name, side and table changes are logged on the guest record.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `10a`.

Drawings:
- `10a` — Wedding Party
- Wedding Party · Cards view · night
- Wedding Party · Duties view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-16"></a>

## 16 · Gifts

- **Master section:** `s16` · slug `gifts`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §17
- **Screen ids:** `10b`, `29e`, `29f`, `19j`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `10b` |
| View switcher views | yes | `29e`, `29f` |
| Section tabs | yes | `19j` |
| Record drawer tabs | yes | Gift · 10b: Gift · Giver · Thank-you · History |
| Night theme | yes | `10b` |

**View switcher options (exact labels):** Gifts · Registry view · Gifts · Notes view

**Record drawers:**
- Gift · 10b · 4 drawers: Gift · Giver · Thank-you · History

**Rail:**
- `10b` All gifts · Thank-you due · Sent · Cash & transfers · Registry · Type · Giver · Date received

**Primary actions:**
- `10b` Log a gift

**Standing rules on this page:**
- `29e` **Honesty rule:** The honeymoon fund and charity totals are contributions, not item counts, and are labelled as such rather than blended into a claim rate.
- `29e` **Card shows:** Category, item count, claimed count, value claimed, and a claim-rate bar capped at 100%.
- `10b` **Honesty rule:** The honeymoon fund and charity totals are contributions, not item counts, and are labelled as such rather than blended into a claim rate.
- `10b` **Card shows:** Category, item count, claimed count, value claimed, and a claim-rate bar capped at 100%.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `10b`.

Drawings:
- `10b` — Gifts

##### `10b` — Gifts

- **Purpose:** A gift is a guest plus a thing plus a thank-you. The page is built around the third one: the only status that matters after the wedding is whether the note went out, so it is the column you cannot hide.
- **Lives under tab:** People
- **Table columns / fields shown:** Gift · From · Type · Value · Received · Thank-you
- **Rail (saved views/meters):** All gifts · Thank-you due · Sent · Cash & transfers · Registry · Type · Giver · Date received
- **Primary action:** Log a gift
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `29e`, `29f`.

Drawings:
- `29e` — Gifts · Registry view
- `29f` — Gifts · Notes view

##### `29e` — Gifts · Registry view

- **Purpose:** Managing the registry itself: what is claimed, what is bare, what to promote.
- **Lives under tab:** People · Gifts · view switcher
- **Card shows:** Category, item count, claimed count, value claimed, and a claim-rate bar capped at 100%.
- **Honesty rule:** The honeymoon fund and charity totals are contributions, not item counts, and are labelled as such rather than blended into a claim rate.
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.

##### `29f` — Gifts · Notes view

- **Purpose:** Working the thank-you backlog. Aging is the sort, because the social cost is time, not amount.
- **Lives under tab:** People · Gifts · view switcher
- **Groups:** Owed (aged) · Written, not sent · Sent. Each group row carries count · oldest age.
- **How it connects:** Same records as the Table view of this page — a layout, not a new data source. Any figure shown is derived from the owning record per the cross-screen data contract.
- **Blocked state:** “Written, not sent” with no address shows amber Blocked and links to the household — the fix is an address, not a note.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19j`.

Drawings:
- `19j` — Gifts · seven filters, correctly placed

##### `19j` — Gifts · seven filters, correctly placed


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Gift · 10b · 4 drawers

Tabs, in this order: **Gift** · **Giver** · **Thank-you** · **History**.

- **Gift**. What it is and where it went. A cash gift can be earmarked, which is why the Budget venue row is $1,200 below the contract.
- **Giver**. A guest record, so the thank-you address comes from the household. Also the warning: the pledge and the gift are two records.
- **Thank-you**. The note itself and the wider count — 5 of 9 sent, with a three-week target.
- **History**. The earmarking on 16 July is what moved a Budget row, and it is reversible from here.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `10b`.

Drawings:
- `10b` — Gifts
- Gifts · Registry view · night
- Gifts · Notes view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-17"></a>

## 17 · Entertainment

- **Master section:** `s17` · slug `entertainment`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §18
- **Screen ids:** `10d`, `30j`, `30k`, `19c`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `10d` |
| View switcher views | yes | `30j`, `30k` |
| Section tabs | yes | `19c` |
| Record drawer tabs | yes | Song · 10d: Song · Moment · Performer · History |
| Night theme | yes | `10d` |

**View switcher options (exact labels):** Entertainment · Performers view · Entertainment · Timeline view

**Record drawers:**
- Song · 10d · 4 drawers: Song · Moment · Performer · History

**Rail:**
- `10d` Full set list · Must play · Do not play · Unplaced · Ceremony music · Moment · Performer · Source

**Primary actions:**
- `10d` Add song

**Standing rules on this page:**
- `30j` **Card shows:** Act, type, fee, soundcheck, performance window, and power draw — the field the venue asks for and nothing else on the page records.
- `10d` **Card shows:** Act, type, fee, soundcheck, performance window, and power draw — the field the venue asks for and nothing else on the page records.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `10d`.

Drawings:
- `10d` — Entertainment

##### `10d` — Entertainment

- **Purpose.** The band, the DJ and the two ceremony musicians, plus the only list that outlives the wedding: songs. Set list rows own a moment on the day, so a song without a moment reads as unplaced rather than as a row of blank fields.
- **Lives under tab:** Vendors
- **Table columns / fields shown:** Song · Artist · Moment · Performer · Source · Flag
- **Rail (saved views/meters):** Full set list · Must play · Do not play · Unplaced · Ceremony music · Moment · Performer · Source
- **Primary action:** Add song
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30j`, `30k`.

Drawings:
- `30j` — Entertainment · Performers view
- `30k` — Entertainment · Timeline view

##### `30j` — Entertainment · Performers view

- **Purpose:** Managing performers as people with call times and technical needs, not as set-list entries.
- **Lives under tab:** Vendors · Entertainment · view switcher
- **Card shows:** Act, type, fee, soundcheck, performance window, and power draw — the field the venue asks for and nothing else on the page records.
- **How it connects:** Same records as this page’s first view. People are guest records, times are derived from the owning timeline block.
- **Rule:** An unfilled role gets a red card with a zero bar rather than being absent, because the run sheet already references it.

##### `30k` — Entertainment · Timeline view

- **Purpose:** Checking that music covers the evening with no silent gaps and no double-booked stage.
- **Lives under tab:** Vendors · Entertainment · view switcher
- **How it connects:** Same records as this page’s first view. People are guest records, times are derived from the owning timeline block.
- **Bars:** Solid is performance, hatched is load-in or soundcheck — the same hatch language as travel time on 14a, so the pattern means “not the thing itself” everywhere.
- **Derivation:** Performance windows are read from the Wedding Day Timeline blocks; editing a block moves the bar.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19c`.

Drawings:
- `19c` — Entertainment · five section tabs

##### `19c` — Entertainment · five section tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Song · 10d · 4 drawers

Tabs, in this order: **Song** · **Moment** · **Performer** · **History**.

- **Song**. The song itself, and what a must-play means: a promise, so the printed set list keeps it separate.
- **Moment**. Where it sits on the day, and whether its length fits the block. Four songs have no moment at all.
- **Performer**. Who plays it, and the one thing that could go wrong — unamplified kora in a room that has to carry.
- **History**. Placing it created the timeline block. Unplacing removes it.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `10d`.

Drawings:
- `10d` — Entertainment
- Entertainment · Performers view · night
- Entertainment · Timeline view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-18"></a>

## 18 · Ceremony & Reception

- **Master section:** `s18` · slug `ceremony-reception`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §19
- **Screen ids:** `11a`, `31c`, `31d`, `19a`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `11a` |
| View switcher views | yes | `31c`, `31d` |
| Section tabs | yes | `19a` |
| Record drawer tabs | yes | Ceremony element · 11a: Element · Script · People · History |
| Night theme | yes | `11a` |

**View switcher options (exact labels):** Ceremony & Reception · Programme view · Ceremony & Reception · Script view

**Record drawers:**
- Ceremony element · 11a · 4 drawers: Element · Script · People · History

**Rail:**
- `11a` Both services · Ceremony only · Reception only · Needs a person · Scripture & vows · Service · Person · Element type

**Primary actions:**
- `11a` Add element

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `11a`.

Drawings:
- `11a` — Ceremony & Reception

##### `11a` — Ceremony & Reception

- **Purpose.** The order of service and the order of the evening, in one page because they are one document to the officiant and the MC. Every element carries a duration, so the two columns total against the 3:00pm and 6:30pm start times rather than drifting.
- **Lives under tab:** The Day
- **Rail (saved views/meters):** Both services · Ceremony only · Reception only · Needs a person · Scripture & vows · Service · Person · Element type
- **Primary action:** Add element
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `31c`, `31d`.

Drawings:
- `31c` — Ceremony & Reception · Programme view
- `31d` — Ceremony & Reception · Script view

##### `31c` — Ceremony & Reception · Programme view

- **Purpose:** Proofing the printed order of service and order of the evening before it goes to print.
- **Lives under tab:** The Day · Ceremony & Reception · view switcher
- **How it connects:** Same records as this page’s first view. Durations are the input; start times are derived, so editing one element moves everything after it.
- **Print class:** Class B keepsake — serif, generous measure, no chrome, prints from the page with no separate template.
- **Rule:** Derived times display on screen for checking and suppress on the printed sheet; the toggle is in the toolbar, not hidden in print settings.

##### `31d` — Ceremony & Reception · Script view

- **Purpose:** Writing and rehearsing. The officiant works from this view; the couple write their vows into it.
- **Lives under tab:** The Day · Ceremony & Reception · view switcher
- **How it connects:** Same records as this page’s first view. Durations are the input; start times are derived, so editing one element moves everything after it.
- **Timing warning:** Derived from the element duration against the number of speakers, so it updates when the duration does.
- **Unwritten text:** Rendered as a bracketed grey placeholder naming who owes it and when — never as an empty block, and never as invented text.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19a`.

Drawings:
- `19a` — Ceremony & Reception · nine section tabs

##### `19a` — Ceremony & Reception · nine section tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Ceremony element · 11a · 4 drawers

Tabs, in this order: **Element** · **Script** · **People** · **History**.

- **Element**. Duration is the input; the start time is a consequence. Editing it moves everything after it.
- **Script**. Nothing written yet, and the rehearsal is the only chance to hear it aloud. One deadline that cannot slip.
- **People**. Three guest records — including the officiant, who is a guest but not a catering cover.
- **History**. One typed minute, six derived changes, one log entry.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `11a`.

Drawings:
- `11a` — Ceremony & Reception
- Ceremony & Reception · Programme view · night
- Ceremony & Reception · Script view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-19"></a>

## 19 · Shot Lists

- **Master section:** `s19` · slug `shot-lists`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §20
- **Screen ids:** `11b`, `30l`, `30m`, `19h`


### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `11b` |
| View switcher views | yes | `30l`, `30m` |
| Section tabs | yes | `19h` |
| Record drawer tabs | yes | Shot · 11b: Shot · People · Timing · History |
| Night theme | yes | `11b` |

**View switcher options (exact labels):** Shot Lists · Cards view · Shot Lists · By window view

**Record drawers:**
- Shot · 11b · 4 drawers: Shot · People · Timing · History

**Rail:**
- `11b` All shots · Must have · Group shots · At risk · Video only · List · Window · Supplier

**Primary actions:**
- `11b` Add shot

**Standing rules on this page:**
- `30l` **Card shows:** List, shot count, location, window, people named, must-have count, and a derived feasibility figure where one exists (time per group).
- `11b` **Card shows:** List, shot count, location, window, people named, must-have count, and a derived feasibility figure where one exists (time per group).

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `11b`.

Drawings:
- `11b` — Shot Lists

##### `11b` — Shot Lists

- **Purpose.** Four lists for two suppliers. A shot is only useful if the photographer can find the people in it, so every group shot carries its named guests — and a shot whose people have not RSVPd accepted is flagged rather than quietly impossible.
- **Lives under tab:** Vendors
- **Table columns / fields shown:** Shot · People · Window · Supplier · Priority
- **Rail (saved views/meters):** All shots · Must have · Group shots · At risk · Video only · List · Window · Supplier
- **Primary action:** Add shot
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `30l`, `30m`.

Drawings:
- `30l` — Shot Lists · Cards view
- `30m` — Shot Lists · By window view

##### `30l` — Shot Lists · Cards view

- **Purpose:** Briefing the photographer per phase, and exposing lists whose time budget does not work.
- **Lives under tab:** Vendors · Shot Lists · view switcher
- **Card shows:** List, shot count, location, window, people named, must-have count, and a derived feasibility figure where one exists (time per group).
- **How it connects:** Same records as this page’s first view. People are guest records, times are derived from the owning timeline block.
- **Rule:** Shots with no window get their own red card — a shot nobody scheduled is a shot that will not happen.

##### `30m` — Shot Lists · By window view

- **Purpose:** The photographer’s working order on the day. Time is the spine, not list membership.
- **Lives under tab:** Vendors · Shot Lists · view switcher
- **Group row format:** window · shot count · locations · constraint. The constraint is the honest part: dependencies and crew gaps are stated.
- **How it connects:** Same records as this page’s first view. People are guest records, times are derived from the owning timeline block.
- **Unscheduled group:** Kept last and red. A must-have shot with no time is the highest-value warning this page can give.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19h`.

Drawings:
- `19h` — Shot Lists · a tab strip and an inline strip

##### `19h` — Shot Lists · a tab strip and an inline strip


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Shot · 11b · 4 drawers

Tabs, in this order: **Shot** · **People** · **Timing** · **History**.

- **Shot**. The shot and its setting — including the thing the list itself would not catch: south-facing steps at 4:05pm.
- **People**. Six guest records, so a declined RSVP surfaces before the day. Two other shots are already at risk.
- **Timing**. Fourteen formals in twelve minutes is 51 seconds each. Third in the order, deliberately.
- **History**. Reordering inside a fixed window only changes who waits.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `11b`.

Drawings:
- `11b` — Shot Lists
- Shot Lists · Cards view · night
- Shot Lists · By window view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-20"></a>

## 20 · Weekend Logistics

- **Master section:** `s20` · slug `weekend-logistics`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §21
- **Screen ids:** `11d`, `31e`, `31f`, `19k`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `11d` |
| View switcher views | yes | `31e`, `31f` |
| Section tabs | yes | `19k` |
| Record drawer tabs | yes | Weekend movement · 11d: Movement · People · Transport · History |
| Night theme | yes | `11d` |

**View switcher options (exact labels):** Weekend Logistics · Rooms view · Weekend Logistics · Transport view

**Record drawers:**
- Weekend movement · 11d · 4 drawers: Movement · People · Transport · History

**Rail:**
- `11d` Whole weekend · Friday · Saturday · Sunday · wedding day · Unowned · Day · Owner · Type

**Primary actions:**
- `11d` Add movement

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `11d`.

Drawings:
- `11d` — Weekend Logistics

##### `11d` — Weekend Logistics

- **Purpose:** Three days, not one. Every row is a movement of people or things with a time, an owner and a place — which is why the page is a schedule rather than a checklist, and why an unowned row reads as a hole in the weekend.
- **Lives under tab:** Planning
- **Table columns / fields shown:** Movement · Day · Time · Owner · Place · Status
- **Rail (saved views/meters):** Whole weekend · Friday · Saturday · Sunday · wedding day · Unowned · Day · Owner · Type
- **Primary action:** Add movement
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `31e`, `31f`.

Drawings:
- `31e` — Weekend Logistics · Rooms view
- `31f` — Weekend Logistics · Transport view

##### `31e` — Weekend Logistics · Rooms view

- **Purpose:** Managing the block: what is held, claimed, releasing, and who still has nowhere to sleep.
- **Lives under tab:** The Day · Weekend Logistics · view switcher
- **Group row format:** block · rooms held · rooms taken · release date.
- **Money rule:** Rooms the couple pays for post to the Accommodation budget line; rooms guests pay direct show a figure but post nothing — the chip says which.
- **How it connects:** Same records as this page’s first view. Guest counts come from the guest records; vehicle costs post to the Transport budget line.

##### `31f` — Weekend Logistics · Transport view

- **Purpose:** Seeing vehicle coverage as time, which is the only way a driver double-booking is visible.
- **Lives under tab:** The Day · Weekend Logistics · view switcher
- **How it connects:** Same records as this page’s first view. Guest counts come from the guest records; vehicle costs post to the Transport budget line.
- **Known gap:** The conflict is between a movement and an appointment. Nothing checks across the two — this view states that rather than implying a check that does not run.
- **Bars:** Green is a covered run, amber is the owner being elsewhere, red is a run with no driver assigned.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19k`.

Drawings:
- `19k` — Weekend Logistics · three day tabs

##### `19k` — Weekend Logistics · three day tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Weekend movement · 11d · 4 drawers

Tabs, in this order: **Movement** · **People** · **Transport** · **History**.

- **Movement**. Friday and Saturday movements live only here. Sunday ones are mirrored on the Timeline.
- **People**. Eleven arriving in three groups — and the clash: the owner is at the rehearsal when the last flight lands.
- **Transport**. Two vehicles, three runs, one driver who leaves at 5pm. The second driver is not booked.
- **History**. Today’s edit created the clash, and nothing warned — no check runs across movements and appointments.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `11d`.

Drawings:
- `11d` — Weekend Logistics
- Weekend Logistics · Rooms view · night
- Weekend Logistics · Transport view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-21"></a>

## 21 · Households

- **Master section:** `s21` · slug `households`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §22

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `14b` |
| View switcher views | yes | `14b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Household · 14b: Guests · Address · Invitation · History |
| Night theme | yes | `14b` |

**View switcher options (exact labels):** Households · Labels view · Households · Cards view

**Record drawers:**
- Household · 14b · 4 drawers: Guests · Address · Invitation · History

**Rail:**
- `14b` All households · Invited · Fully replied · Partly replied · No reply · No address · Side · Reply status · City

**Primary actions:**
- `14b` Add guest
- `14b` Print labels
- Print labels

**Standing rules on this page:**
- `14b` **Card shows:** Household, address, guest count, reply-status chip — the same fields the table columns carry, no more.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `14b`.

Drawings:
- `14b` — Households

##### `14b` — Households

- **Purpose.** A derived view, not a table of its own. Sixty-two households are the same 142 guest records grouped by address — which is why the page has no add button for a household and every count is read-only. It exists because you post to a household, not to a person.
- **Lives under tab:** People
- **Table columns / fields shown:** Household · Guests · Replied · Side · Address · City · Status
- **Rail (saved views/meters):** All households · Invited · Fully replied · Partly replied · No reply · No address · Side · Reply status · City
- **Primary action:** Add guest
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `14b`.

Drawings:
- `14b` — Households · Labels view
- Households · Cards view

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Household · 14b · 4 drawers

Tabs, in this order: **Guests** · **Address** · **Invitation** · **History**.

- **Guests**. The four people inside the envelope, and the fact that this is a group rather than a record of its own.
- **Address**. One address, four guests. The warning is the point: editing here rewrites all four.
- **Invitation**. One envelope, four separate RSVPs — which is why the household reads "All replied" and the guests read four states.
- **History**. Envelope events only. Guest-level changes are logged on each guest.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `14b`.

Drawings:
- `14b` — Households
- Households · Labels view · night
- Households · Cards view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-22"></a>

## 22 · Contacts

- **Master section:** `s22` · slug `contacts`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §23
- **Screen ids:** `14c`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `14c` |
| View switcher views | yes | `14c` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Contact · 14c: Contact · Reaches · Day-of · Source |
| Night theme | yes | `14c` |

**View switcher options (exact labels):** Contacts · Day-of sheet view · Contacts · Cards view

**Record drawers:**
- Contact · 14c · 4 drawers: Contact · Reaches · Day-of · Source

**Rail:**
- `14c` Everyone · Day-of numbers · Vendors · Wedding party · Family · No number · Role · Side · On the day-of sheet

**Primary actions:**
- `14c` Add contact
- `14c` Print sheet
- Print sheet

**Standing rules on this page:**
- `14c` **Card shows:** Name, role chip, phone, day-of-sheet status.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `14c`.

Drawings:
- `14c` — Contacts

##### `14c` — Contacts

- **Purpose.** The other derived view: everyone with a phone number, guests and vendors in one list, because on the day nobody cares which table a number came from. It is the source of the printed contact sheet, so the only field it adds is who calls whom.
- **Lives under tab:** People
- **Table columns / fields shown:** Contact · Role · Phone · Email · Reaches · Day-of · Source
- **Rail (saved views/meters):** Everyone · Day-of numbers · Vendors · Wedding party · Family · No number · Role · Side · On the day-of sheet
- **Primary action:** Add contact
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `14c`.

Drawings:
- `14c` — Contacts · Day-of sheet view
- Contacts · Cards view

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Contact · 14c · 4 drawers

Tabs, in this order: **Contact** · **Reaches** · **Day-of** · **Source**.

- **Contact**. The fields, and the honest statement that saving them writes to the vendor record underneath.
- **Reaches**. The escalation chain — what makes a contact sheet usable at 7am. Nobody above her, and the sheet says so.
- **Day-of**. Ordered by who you call first, not alphabetically. Twelve fit on one printed page.
- **Source**. Where the row comes from, and why this page cannot create one.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `14c`.

Drawings:
- `14c` — Contacts
- Contacts · Day-of sheet view · night
- Contacts · Cards view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-23"></a>

## 23 · Notes

- **Master section:** `s23` · slug `notes`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §24
- **Screen ids:** `12a`, `33a`, `33b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `12a` |
| View switcher views | yes | `33a`, `33b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Note · 12a: Note · Pin · Sharing · History |
| Night theme | yes | `12a` |

**View switcher options (exact labels):** Notes · Cards view · Notes · Timeline view

**Record drawers:**
- Note · 12a · 4 drawers: Note · Pin · Sharing · History

**Rail:**
- `12a` All notes · Unpinned · Flagged · Mine · Shared with Mary · Pinned to · Author · Date

**Primary actions:**
- `12a` New note

**Standing rules on this page:**
- `33a` **Card shows:** The note, what it is pinned to, its kind, author, date, and what it affects.
- `12a` **Card shows:** The note, what it is pinned to, its kind, author, date, and what it affects.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `12a`.

Drawings:
- `12a` — Notes

##### `12a` — Notes

- **Purpose.** The page that catches everything the other twenty-nine cannot hold. A note is free text, but it is pinned to a record — so the note about the cake sits on the cake, and the page is a list of loose ends rather than a diary.
- **Lives under tab:** Overview
- **Table columns / fields shown:** Note · Pinned to · Author · Written · Flag
- **Rail (saved views/meters):** All notes · Unpinned · Flagged · Mine · Shared with Mary · Pinned to · Author · Date
- **Primary action:** New note
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33a`, `33b`.

Drawings:
- `33a` — Notes · Cards view
- `33b` — Notes · Timeline view

##### `33a` — Notes · Cards view

- **Purpose:** Reading the loose knowledge of the wedding — the things that live in someone’s head and nowhere else.
- **Lives under tab:** Overview · Notes · view switcher
- **Card shows:** The note, what it is pinned to, its kind, author, date, and what it affects.
- **How it connects:** Same records as this page’s first view. A note is pinned to a record; deleting the record archives the note rather than losing it.
- **Kinds:** Open question · Blocker · Decision needed · Deadline · Preference · Sensitive. A note is never just text; it declares what it wants from you.

##### `33b` — Notes · Timeline view

- **Purpose:** Reading the planning as it happened, and seeing which notes are ageing without resolution.
- **Lives under tab:** Overview · Notes · view switcher
- **Group row format:** period · note count · resolved count.
- **Ordering rule:** Strictly chronological, newest first — no promotion of blockers to the top. The Cards view is where urgency sorts; here time does.
- **How it connects:** Same records as this page’s first view. A note is pinned to a record; deleting the record archives the note rather than losing it.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Note · 12a · 4 drawers

Tabs, in this order: **Note** · **Pin** · **Sharing** · **History**.

- **Note**. The text and its flag. This one explains a $1,000 gap between two budget totals.
- **Pin**. Pinned to a vendor, so it shows in that drawer. Deleting the vendor leaves the note loose.
- **Sharing**. Never in a share packet — sending this would quote the vendor against themselves.
- **History**. The only record whose history is mostly conversation.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `12a`.

Drawings:
- `12a` — Notes
- Notes · Cards view · night
- Notes · Timeline view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-24"></a>

## 24 · Share Packets

- **Master section:** `s24` · slug `share-packets`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §25
- **Screen ids:** `12b`, `33c`, `33d`, `19m`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `12b` |
| View switcher views | yes | `33c`, `33d` |
| Section tabs | yes | `19m` |
| Record drawer tabs | yes | Share packet · 12b: Packet · Sections · Link · Activity |
| Night theme | yes | `12b` |

**View switcher options (exact labels):** Share Packets · Cards view · Share Packets · Activity view

**Record drawers:**
- Share packet · 12b · 4 drawers: Packet · Sections · Link · Activity

**Rail:**
- `12b` All packets · Live · Expired · Draft · Opened this week · Recipient type · Status · Created

**Primary actions:**
- `12b` New packet

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `12b`.

Drawings:
- `12b` — Share Packets

##### `12b` — Share Packets

- **Purpose:** A packet is a read-only slice of the planner behind a link. Because the link is the product, the page is built around what the recipient will see and when it stops working — not around the pages that went into it.
- **Lives under tab:** Documents
- **Table columns / fields shown:** Packet · Recipient · Contains · Mode · Opens · Expires · Status
- **Rail (saved views/meters):** All packets · Live · Expired · Draft · Opened this week · Recipient type · Status · Created
- **Primary action:** New packet
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33c`, `33d`.

Drawings:
- `33c` — Share Packets · Cards view
- `33d` — Share Packets · Activity view

##### `33c` — Share Packets · Cards view

- **Purpose:** Managing outbound access. The card leads with contents and exclusions because the risk is over-sharing, not under-sharing.
- **Lives under tab:** Documents · Share Packets · view switcher
- **How it connects:** Same records as this page’s first view. A packet is a filtered projection of live records — it never contains a copy, so revoking access revokes everything.
- **Contains / Hides:** Both are shown on every card, always. A packet whose exclusions are not visible cannot be audited.
- **Covenant:** Covenant records cannot be added to any packet. The option does not exist rather than being disabled.
- **Never opened:** Rendered amber with an age. A sent packet nobody read is functionally an unsent packet.

##### `33d` — Share Packets · Activity view

- **Purpose:** Auditing access. Two questions: who has looked, and what could they possibly have seen.
- **Lives under tab:** Documents · Share Packets · view switcher
- **How it connects:** Same records as this page’s first view. A packet is a filtered projection of live records — it never contains a copy, so revoking access revokes everything.
- **Honesty about revocation:** Revoking access stops the link. It cannot recall a PDF somebody already downloaded, and the panel says so.
- **Right panel:** The permanent exclusions, stated as facts rather than toggles. There is no control to include Covenant pages or budget totals in a packet.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19m`.

Drawings:
- `19m` — Share Packets · two strips, both earned

##### `19m` — Share Packets · two strips, both earned


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Share packet · 12b · 4 drawers

Tabs, in this order: **Packet** · **Sections** · **Link** · **Activity**.

- **Packet**. Live versus snapshot — the difference only matters after you edit, which is why the row states it.
- **Sections**. Four of thirty. Withheld sections are greyed, not hidden, so you can see what you kept back.
- **Link**. No passcode, and the tab says why that is acceptable here and not for the Budget.
- **Activity**. Fourteen opens, one city, two browsers — a day-of packet should be opened repeatedly.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `12b`.

Drawings:
- `12b` — Share Packets
- Share Packets · Cards view · night
- Share Packets · Activity view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-25"></a>

## 25 · Email Templates

- **Master section:** `s25` · slug `email-templates`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §26
- **Screen ids:** `12c`, `33e`, `33f`, `19n`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `12c` |
| View switcher views | yes | `33e`, `33f` |
| Section tabs | yes | `19n` |
| Record drawer tabs | yes | Email template · 12c: Template · Fields · Audience · Sent log |
| Night theme | yes | `12c` |

**View switcher options (exact labels):** Email Templates · Preview view · Email Templates · Sent log view

**Record drawers:**
- Email template · 12c · 4 drawers: Template · Fields · Audience · Sent log

**Rail:**
- `12c` All templates · Guests · Vendors · Wedding party · With blank fields · Audience · Last used · Author

**Primary actions:**
- `12c` New template

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `12c`.

Drawings:
- `12c` — Email Templates

##### `12c` — Email Templates

- **Purpose:** Nine letters the couple will send more than once. A template is only worth keeping if the merge fields resolve, so the page shows the resolved preview beside the source and names any field that would come out blank.
- **Lives under tab:** Documents
- **Table columns / fields shown:** Template · Audience · Fields · Sent · Last used · Status
- **Rail (saved views/meters):** All templates · Guests · Vendors · Wedding party · With blank fields · Audience · Last used · Author
- **Primary action:** New template
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33e`, `33f`.

Drawings:
- `33e` — Email Templates · Preview view
- `33f` — Email Templates · Sent log view

##### `33e` — Email Templates · Preview view

- **Purpose:** Proofing a send. You are never previewing a template; you are previewing a specific person’s copy of it.
- **Lives under tab:** Documents · Email Templates · view switcher
- **How it connects:** Same records as this page’s first view. Merge fields resolve against live records, so a preview is the actual message, not an approximation.
- **Conditional text:** A sentence whose merge field is empty is dropped whole. Stated in the panel with the count affected.
- **Exclusions:** Recipients missing an email are excluded and counted, never silently skipped.
- **Merge panel:** Every field and its resolved value. An unresolved field is an error, not a blank.

##### `33f` — Email Templates · Sent log view

- **Purpose:** Closing the loop on a send. Delivery is not the same as receipt, and receipt is not the same as reply.
- **Lives under tab:** Documents · Email Templates · view switcher
- **Group row format:** send · sent · delivered · opened · replied. Four numbers, always in that order.
- **How it connects:** Same records as this page’s first view. Merge fields resolve against live records, so a preview is the actual message, not an approximation.
- **Failure rows:** Bounced and Excluded are rendered red at row level, so a chase that never arrived cannot be mistaken for a guest who ignored you.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19n`.

Drawings:
- `19n` — Email Templates · audience is a filter

##### `19n` — Email Templates · audience is a filter


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Email template · 12c · 4 drawers

Tabs, in this order: **Template** · **Fields** · **Audience** · **Sent log**.

- **Template**. The letter. The planner writes it and logs the send; your mail client does the sending.
- **Fields**. Six merge fields, one blank — so this template cannot be sent until Wedding Setup is fixed.
- **Audience**. A query, not a list. It was 31 yesterday and three of them have no email at all.
- **Sent log**. Twenty-six sends, 31 still pending — evidence that email has stopped working on this group.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `12c`.

Drawings:
- `12c` — Email Templates
- Email Templates · Preview view · night
- Email Templates · Sent log view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-26"></a>

## 26 · Print Centre

- **Master section:** `s26` · slug `print-centre`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §27
- **Screen ids:** `12d`, `33g`, `33h`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `12d` |
| View switcher views | yes | `33g`, `33h` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Printable · 12d: Document · Layout · Pack · History |
| Night theme | yes | `12d` |

**View switcher options (exact labels):** Print Centre · Day-of pack view · Print Centre · Preview view

**Record drawers:**
- Printable · 12d · 4 drawers: Document · Layout · Pack · History

**Rail:**
- `12d` Everything · Class A · working · Class B · keepsakes · Printed already · Day-of pack · Letter · A4 · Both, fit to page

**Primary actions:**
- `12d` Print selection

**Standing rules on this page:**
- `33g` **Ordering:** Sequence is the order of need on the day, not alphabetical and not by source page.
- `12d` **Ordering:** Sequence is the order of need on the day, not alphabetical and not by source page.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `12d`.

Drawings:
- `12d` — Print Centre

##### `12d` — Print Centre

- **Purpose.** Every printable in one place, sorted into the two print classes rather than by the page it came from. Working documents are black on white for the day; keepsakes are the ones the couple keeps — and the page never lets you confuse them.
- **Lives under tab:** Documents
- **Table columns / fields shown:** Document · Source page · Pages · Last printed · Status
- **Rail (saved views/meters):** Everything · Class A · working · Class B · keepsakes · Printed already · Day-of pack · Letter · A4 · Both, fit to page
- **Primary action:** Print selection
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33g`, `33h`.

Drawings:
- `33g` — Print Centre · Day-of pack view
- `33h` — Print Centre · Preview view

##### `33g` — Print Centre · Day-of pack view

- **Purpose:** Assembling and printing the single physical pack the planner carries on the day.
- **Lives under tab:** Documents · Print Centre · view switcher
- **Ordering:** Sequence is the order of need on the day, not alphabetical and not by source page.
- **How it connects:** Every printable in the planner prints from its own page. This page collects them; it does not hold separate templates.
- **Exclusions:** Budget, Covenant and addresses are listed as permanently excluded so their absence reads as a decision.
- **Source-derived risk:** A document inherits the state of its source. The caterer sheet is amber because meals are outstanding; nothing here is typed.

##### `33h` — Print Centre · Preview view

- **Purpose:** Proofing the assembled pack page by page.
- **Lives under tab:** Documents · Print Centre · view switcher
- **How it connects:** Every printable in the planner prints from its own page. This page collects them; it does not hold separate templates.
- **Always light:** Print renders light regardless of theme, in every class.
- **Page numbering:** Continuous across the pack, so a dropped page is noticeable.
- **Print class:** A — working document. Tabular times, tight leading, high contrast. Class B keepsakes (order of service, Covenant) render differently and are proofed on their own pages.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Printable · 12d · 4 drawers

Tabs, in this order: **Document** · **Layout** · **Pack** · **History**.

- **Document**. No print template exists. The page prints itself, because a template is a second copy that drifts.
- **Layout**. Class A never prints gold. Even from a share packet, the recipient gets the working document.
- **Pack**. Eleven documents as one job. Two blocked, so the pack refuses rather than printing gaps.
- **History**. Printed 26 July; the timeline has changed twice since. The paper copy is out of date.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `12d`.

Drawings:
- `12d` — Print Centre
- Print Centre · Day-of pack view · night
- Print Centre · Preview view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-27"></a>

## 27 · Vision & Foundation

- **Master section:** `s27` · slug `vision-foundation`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §28
- **Screen ids:** `13a`, `32a`, `32b`, `19l`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `13a` |
| View switcher views | yes | `32a`, `32b` |
| Section tabs | yes | `19l` |
| Record drawer tabs | yes | Vision section · 13a: Section · Wording · Print · History |
| Night theme | yes | `13a` |

**View switcher options (exact labels):** Vision & Foundation · Edit view · Vision & Foundation · Print preview

**Record drawers:**
- Vision section · 13a · 4 drawers: Section · Wording · Print · History

**Rail:**
- `13a` Our vision · Values · 5 · Scriptures · 4 · Promises · 6 · What we are building · Class B · Letter · Gold hairline · Cormorant headings

**Primary actions:**
- `13a` Print keepsake

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `13a`.

Drawings:
- `13a` — Vision & Foundation

##### `13a` — Vision & Foundation

- **Purpose.** The Covenant pages are the only ones the couple will still open in ten years, so the work surface earns serif and air the other twenty-nine do not get. The frame is unchanged — the same rail, header, stats and drawer — but the prose is set to be read, not scanned.
- **Lives under tab:** Covenant
- **Rail (saved views/meters):** Our vision · Values · 5 · Scriptures · 4 · Promises · 6 · What we are building · Class B · Letter · Gold hairline · Cormorant headings
- **Primary action:** Print keepsake
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `32a`, `32b`.

Drawings:
- `32a` — Vision & Foundation · Edit view
- `32b` — Vision & Foundation · Print preview

##### `32a` — Vision & Foundation · Edit view

- **Purpose:** Composing the seven sections. Read view is for reading; this is the only place text changes.
- **Lives under tab:** Covenant · Vision & Foundation · view switcher
- **How it connects:** Same records as this page’s first view. Covenant pages keep the forest-and-serif treatment; nothing here posts to a budget or a guest count.
- **Autosave:** Stated in the strip with elapsed time, matching the top-bar save indicator.
- **Block set:** Scripture reference, quote, prayer, divider. Deliberately four — a document with thirty block types stops being written and starts being formatted.
- **Co-editing:** Both partners can edit. Simultaneous editing is shown with a named cursor, never merged silently.

##### `32b` — Vision & Foundation · Print preview

- **Purpose:** Proofing the keepsake before it prints or is bound.
- **Lives under tab:** Covenant · Vision & Foundation · view switcher
- **How it connects:** Same records as this page’s first view. Covenant pages keep the forest-and-serif treatment; nothing here posts to a budget or a guest count.
- **Dark mode:** Print always renders light, even when the app is in dark mode. Stated on the screen so nobody is surprised by the output.
- **Empty sections:** A section with no body prints nothing but is flagged in preview — a printed heading with blank paper under it is worse than an absence.
- **Print class:** B — serif, centred title page, gold rule, generous measure, no UI chrome. Prints from the page; there is no separate print template.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19l`.

Drawings:
- `19l` — Covenant · the tab strip that is really a sub-nav

##### `19l` — Covenant · the tab strip that is really a sub-nav


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Vision section · 13a · 4 drawers

Tabs, in this order: **Section** · **Wording** · **Print** · **History**.

- **Section**. Position and authorship, plus the two other Covenant pages that reference this value by id.
- **Wording**. The one tab where prose is the record. It renders in Cormorant because it will print in Cormorant.
- **Print**. A tab that exists only for Covenant records, because here the printed page is the deliverable.
- **History**. Printing is logged — an edited keepsake means the paper copy is now wrong.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `13a`.

Drawings:
- `13a` — Vision & Foundation
- Vision & Foundation · Edit view · night
- Vision & Foundation · Print preview · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-28"></a>

## 28 · Prayer Journal

- **Master section:** `s28` · slug `prayer-journal`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §29
- **Screen ids:** `13b`, `32c`, `32d`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `13b` |
| View switcher views | yes | `32c`, `32d` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Prayer entry · 13b: Entry · Answer · Privacy · History |
| Night theme | yes | `13b` |

**View switcher options (exact labels):** Prayer Journal · Table view · Prayer Journal · Print preview

**Record drawers:**
- Prayer entry · 13b · 4 drawers: Entry · Answer · Privacy · History

**Rail:**
- `13b` All entries · Answered · Still praying · Laid down · Written together · Status · Author · Month

**Primary actions:**
- `13b` New entry

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `13b`.

Drawings:
- `13b` — Prayer Journal

##### `13b` — Prayer Journal

- **Purpose.** Eleven entries, and the only field that makes the page worth keeping is the answer. An entry with an answer is closed and set in serif; an open one stays plain, so the page reads as a record of what happened rather than a list of requests.
- **Lives under tab:** Covenant
- **Rail (saved views/meters):** All entries · Answered · Still praying · Laid down · Written together · Status · Author · Month
- **Primary action:** New entry
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `32c`, `32d`.

Drawings:
- `32c` — Prayer Journal · Table view
- `32d` — Prayer Journal · Print preview

##### `32c` — Prayer Journal · Table view

- **Purpose:** Scanning the whole journal at once: what is open, what closed, and how long it took.
- **Lives under tab:** Covenant · Prayer Journal · view switcher
- **Groups:** Answered · Still asking · Set down. Set down is kept rather than deleted — a prayer you stopped praying is part of the record.
- **Honesty chip:** “Answered · not as asked” is a distinct state from Answered. The system does not flatten the two.
- **How it connects:** Same records as this page’s first view. Covenant records are private to the couple and never travel in a share packet.
- **Privacy:** Covenant records never appear in a share packet, an export, or a vendor view.

##### `32d` — Prayer Journal · Print preview

- **Purpose:** Producing the keepsake volume — typically given at an anniversary rather than at the wedding.
- **Lives under tab:** Covenant · Prayer Journal · view switcher
- **How it connects:** Same records as this page’s first view. Covenant records are private to the couple and never travel in a share packet.
- **Default selection:** Answered entries only. The toolbar chip states it; including open prayers is a deliberate toggle, not a default.
- **Print class:** B — keepsake. Serif throughout, dates spelled out, no chrome, prints light always.
- **Privacy:** Even the printed volume is a couple artefact. Nothing here can be attached to a share packet.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Prayer entry · 13b · 4 drawers

Tabs, in this order: **Entry** · **Answer** · **Privacy** · **History**.

- **Entry**. What was asked, and the fact that status is derived — an entry is answered when an answer exists.
- **Answer**. Writing here marks it answered, moves it out of "Still praying" and changes the page stat. One field, three consequences.
- **Privacy**. The only record type that cannot be shared at all. Facts, not toggles — privacy belongs to the type.
- **History**. Two edits in twenty-four days. Here a sparse history is the point, not a gap.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `13b`.

Drawings:
- `13b` — Prayer Journal
- Prayer Journal · Table view · night
- Prayer Journal · Print preview · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-29"></a>

## 29 · Premarital Counseling

- **Master section:** `s29` · slug `premarital-counseling`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §30
- **Screen ids:** `13c`, `32e`, `32f`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `13c` |
| View switcher views | yes | `32e`, `32f` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Counseling session · 13c: Session · Homework · Notes · History |
| Night theme | yes | `13c` |

**View switcher options (exact labels):** Premarital Counseling · Cards view · Premarital Counseling · Calendar view

**Record drawers:**
- Counseling session · 13c · 4 drawers: Session · Homework · Notes · History

**Rail:**
- `13c` All sessions · Completed · Scheduled · Not booked · Homework due · Status · Topic · Month

**Primary actions:**
- `13c` Book a session

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `13c`.

Drawings:
- `13c` — Premarital Counseling

##### `13c` — Premarital Counseling

- **Purpose.** Eight sessions with Rev. Mensah, four done. A session is not finished when it is attended — it is finished when the homework is done, which is why completion is derived from the child rows and not from a tick on the parent.
- **Lives under tab:** Covenant
- **Table columns / fields shown:** Session · Topic · Date · Homework · Status
- **Rail (saved views/meters):** All sessions · Completed · Scheduled · Not booked · Homework due · Status · Topic · Month
- **Primary action:** Book a session
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `32e`, `32f`.

Drawings:
- `32e` — Premarital Counseling · Cards view
- `32f` — Premarital Counseling · Calendar view

##### `32e` — Premarital Counseling · Cards view

- **Purpose:** Seeing progress through the programme and who owes what.
- **Lives under tab:** Covenant · Premarital Counseling · view switcher
- **How it connects:** Same records as this page’s first view. Session completion is derived from homework done, never set by hand.
- **Derived completion:** A session is complete when its homework is complete. The bar is derived from child homework records (§13) and cannot be set directly.
- **Two unscheduled sessions:** 06 and 07 must happen before the rehearsal on 6 November. The card states the constraint rather than leaving the date blank.

##### `32f` — Premarital Counseling · Calendar view

- **Purpose:** Booking the remaining sessions without colliding with appointments already in the planner.
- **Lives under tab:** Covenant · Premarital Counseling · view switcher
- **How it connects:** Same records as this page’s first view. Session completion is derived from homework done, never set by hand.
- **Deadline:** Sessions 06 and 07 must sit before the rehearsal on 6 November; the header states it.
- **Other commitments:** Appointments from 14a render amber and read-only, so you can see what a date would collide with without leaving the page.
- **Proposed slots:** Red entries are suggestions for unscheduled sessions, clearly labelled — the planner never books on your behalf.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Counseling session · 13c · 4 drawers

Tabs, in this order: **Session** · **Homework** · **Notes** · **History**.

- **Session**. Its own table, not an appointment record — so the Smart Calendar shows it without anything being entered twice.
- **Homework**. The page bar is derived from these two rows. No separate "complete" tick to fall out of step.
- **Notes**. Written after, not before. Class B prose because they print as one continuous record.
- **History**. Five of eight sessions still have no date, because the eight were created as a plan.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `13c`.

Drawings:
- `13c` — Premarital Counseling
- Premarital Counseling · Cards view · night
- Premarital Counseling · Calendar view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-30"></a>

## 30 · First-Month Rhythms

- **Master section:** `s30` · slug `first-month-rhythms`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §31
- **Screen ids:** `13d`, `32g`, `32h`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `13d` |
| View switcher views | yes | `32g`, `32h` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Rhythm · 13d: Rhythm · Cadence · Streak · History |
| Night theme | yes | `13d` |

**View switcher options (exact labels):** First-Month Rhythms · Cards view · First-Month Rhythms · Year view

**Record drawers:**
- Rhythm · 13d · 4 drawers: Rhythm · Cadence · Streak · History

**Rail:**
- `13d` All rhythms · Daily · Weekly · Monthly · Yearly · Cadence · Owner · Area

**Primary actions:**
- `13d` New rhythm

**Standing rules on this page:**
- `32g` **Card shows:** Rhythm, cadence, start date, kept count, owner. Two cards cite where the rhythm came from — counseling 04, the vision document.
- `13d` **Card shows:** Rhythm, cadence, start date, kept count, owner. Two cards cite where the rhythm came from — counseling 04, the vision document.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `13d`.

Drawings:
- `13d` — First-Month Rhythms

##### `13d` — First-Month Rhythms

- **Purpose.** The one page that is about after the wedding. Rhythms are recurring commitments rather than tasks, so they carry a cadence and a streak instead of a due date — and the page starts on 9 November, the day the rest of the planner stops.
- **Lives under tab:** Covenant
- **Table columns / fields shown:** Rhythm · Cadence · Owner · Area · Kept · Since
- **Rail (saved views/meters):** All rhythms · Daily · Weekly · Monthly · Yearly · Cadence · Owner · Area
- **Primary action:** New rhythm
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `32g`, `32h`.

Drawings:
- `32g` — First-Month Rhythms · Cards view
- `32h` — First-Month Rhythms · Year view

##### `32g` — First-Month Rhythms · Cards view

- **Purpose:** Setting the rhythms before the wedding, when there is still attention to spare for them.
- **Lives under tab:** Covenant · First-Month Rhythms · view switcher
- **Card shows:** Rhythm, cadence, start date, kept count, owner. Two cards cite where the rhythm came from — counseling 04, the vision document.
- **How it connects:** Same records as this page’s first view. Rhythms start 9 November, the day after the wedding, and are the only Covenant records with a recurrence.
- **Not-yet state:** Kept shows — rather than 0 before the start date. Zero implies failure; an em dash implies it has not begun.

##### `32h` — First-Month Rhythms · Year view

- **Purpose:** Deciding how long a rhythm is meant to last, which is the question the first-month framing avoids.
- **Why it exists:** A rhythm with no end date quietly becomes a debt. Setting a horizon makes stopping a decision rather than a lapse.
- **Lives under tab:** Covenant · First-Month Rhythms · view switcher
- **How it connects:** Same records as this page’s first view. Rhythms start 9 November, the day after the wedding, and are the only Covenant records with a recurrence.
- **Marks:** ● committed · ○ intended, to be reviewed · — beyond the horizon. No mark ever means “failed”; this view records nothing about what happened.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Rhythm · 13d · 4 drawers

Tabs, in this order: **Rhythm** · **Cadence** · **Streak** · **History**.

- **Rhythm**. The definition matters more than the field. A vague rhythm gets redefined until it is always kept.
- **Cadence**. Begins the day after the wedding and never touches the Timeline. Not wedding work.
- **Streak**. Counted, not scored. No target, no badge — the number exists so a slip is visible.
- **History**. Written in July, started in November. The gap is deliberate.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `13d`.

Drawings:
- `13d` — First-Month Rhythms
- First-Month Rhythms · Cards view · night
- First-Month Rhythms · Year view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-31"></a>

## 31 · Essentials Checklist

- **Master section:** `s31` · slug `essentials-checklist`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §32
- **Screen ids:** `17a`, `33k`, `33l`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `17a` |
| View switcher views | yes | `33k`, `33l` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Essentials item · 17a: Item · Who & where · Note · History |
| Night theme | yes | `17a` |

**View switcher options (exact labels):** Essentials Checklist · By person view · Essentials Checklist · Print view

**Record drawers:**
- Essentials item · 17a · 4 drawers: Item · Who & where · Note · History

**Rail:**
- `17a` Everything · Bride essentials · Groom essentials · Emergency kit · Ceremony documents · Reception bag · Beauty & medicine · Exit / send-off · Tech kit · Kit · Person · Where it lives

**Primary actions:**
- `17a` Add item

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `17a`.

Drawings:
- `17a` — Essentials Checklist

##### `17a` — Essentials Checklist

- **Purpose.** Not a settings page — the thing you physically pack. Every row is an object that must be in a named bag, held by a named person, in a named place, and the only status that matters on the morning is whether it is in the bag. Distinct from Wedding Setup, which is why the naming collision had to be resolved.
- **Lives under tab:** Documents
- **Table columns / fields shown:** Item · Kit · Who carries it · Where it lives · Status · Note
- **Rail (saved views/meters):** Everything · Bride essentials · Groom essentials · Emergency kit · Ceremony documents · Reception bag · Beauty & medicine · Exit / send-off · Tech kit · Kit · Person · Where it lives
- **Primary action:** Add item
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33k`, `33l`.

Drawings:
- `33k` — Essentials Checklist · By person view
- `33l` — Essentials Checklist · Print view

##### `33k` — Essentials Checklist · By person view

- **Purpose:** Packing. A kit list is useless on the morning; a per-person bag list is what you actually work from.
- **Lives under tab:** Overview · Essentials Checklist · view switcher
- **Group row format:** person · item count · packed count, with the bag named on each row.
- **How it connects:** Same records as this page’s first view. An essentials item belongs to a kit and a person; nothing here posts to the wedding budget.
- **Unassigned group:** Red and last. An item with no carrier will not arrive, and the checklist view can hide that inside a kit.

##### `33l` — Essentials Checklist · Print view

- **Purpose:** A sheet that goes into the bag it describes, so it can be checked without a screen at 6am.
- **Lives under tab:** Overview · Essentials Checklist · view switcher
- **How it connects:** Same records as this page’s first view. An essentials item belongs to a kit and a person; nothing here posts to the wedding budget.
- **Print class:** A — working. Real ☐ boxes, one line per item, grouped by bag.
- **Rule:** Unassigned items are printed, not omitted. A packing list that quietly drops what nobody claimed is worse than no list.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Essentials item · 17a · 4 drawers

Tabs, in this order: **Item** · **Who & where** · **Note** · **History**.

- **Item**. Ready means bought and in a kit. Both columns must be true, so 28 bought is not 28 ready.
- **Who & where**. The only object in the planner whose absence stops the day.
- **Note**. A self-contradicting note nobody has corrected — which is exactly what a note is for.
- **History**. Marked in the bag, but not collected. A checklist can be truthful and still wrong.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `17a`.

Drawings:
- `17a` — Essentials Checklist
- Essentials Checklist · By person view · night
- Essentials Checklist · Print view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-32"></a>

## 32 · Honeymoon & After

- **Master section:** `s32` · slug `honeymoon-after`
- **Header counts:** 7 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §33
- **Screen ids:** `17b`, `47a`, `47b`, `19b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `17b` |
| View switcher views | yes | `47a`, `47b` |
| Section tabs | yes | `19b` |
| Record drawer tabs | yes | Honeymoon booking · 17b: Booking · Cost · Documents · History |
| Night theme | yes | `17b` |

**View switcher options (exact labels):** Honeymoon & After · Itinerary view · Honeymoon & After · Budget view

**Record drawers:**
- Honeymoon booking · 17b · 4 drawers: Booking · Cost · Documents · History

**Rail:**
- `17b` Details & bookings · Itinerary · Packing · Budget · Daily journal · Thank-you notes · Post-wedding tasks · Newlywed Homecoming

**Primary actions:**
- `17b` Add booking

**Standing rules on this page:**
- `47a` **Honesty rule:** Gaps are shown as gaps. A day with nothing booked says so instead of inheriting the day before.
- `47b` **Honesty rule:** Gift-fund contributions are contributions, not budget. They are totalled separately and labelled.
- `17b` **Honesty rule:** Gift-fund contributions are contributions, not budget. They are totalled separately and labelled.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `17b`.

Drawings:
- `17b` — Honeymoon & After

##### `17b` — Honeymoon & After

- **Purpose.** The page that starts the day the rest of the planner stops. Six sections behind one tab bar, because a honeymoon is a small planner of its own — but it keeps the wedding’s frame, and its two after-the-day counts are read from Gifts and Tasks rather than typed, so they cannot drift.
- **Lives under tab:** The Day
- **Table columns / fields shown:** Booking · Type · Provider · Dates · Cost · Reference · Status · Day · Date · Plan · …
- **Rail (saved views/meters):** Details & bookings · Itinerary · Packing · Budget · Daily journal · Thank-you notes · Post-wedding tasks · Newlywed Homecoming
- **Primary action:** Add booking
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `47a`, `47b`.

Drawings:
- `47a` — Honeymoon & After · Itinerary view
- `47b` — Honeymoon & After · Budget view

##### `47a` — Honeymoon & After · Itinerary view

- **Purpose:** The bookings list answers “what did we book?”. The itinerary answers “where are we on Thursday?”.
- **Lives under tab:** The Day · Honeymoon & After · view switcher
- **Row shows:** Each day with transport, accommodation and anything already reserved, in time order.
- **Honesty rule:** Gaps are shown as gaps. A day with nothing booked says so instead of inheriting the day before.

##### `47b` — Honeymoon & After · Budget view

- **Purpose:** The honeymoon has its own pot. Blending it into the wedding budget hides both.
- **Lives under tab:** The Day · Honeymoon & After · view switcher
- **Row shows:** Each booking with estimate, paid, outstanding and who paid it.
- **Honesty rule:** Gift-fund contributions are contributions, not budget. They are totalled separately and labelled.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19b`.

Drawings:
- `19b` — Honeymoon & After · seven section tabs

##### `19b` — Honeymoon & After · seven section tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Honeymoon booking · 17b · 4 drawers

Tabs, in this order: **Booking** · **Cost** · **Documents** · **History**.

- **Booking**. A flight tied to the wedding date, so the planner flags it if the date moves.
- **Cost**. Non-refundable, 44% of the committed trip budget — the largest single exposure in either budget.
- **Documents**. Two files held, two missing. Zanzibar checks yellow fever cards on arrival.
- **History**. Separate from the wedding budget by design, but still real money spent.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `17b`.

Drawings:
- `17b` — Honeymoon & After
- Honeymoon & After · Itinerary view · night
- Honeymoon & After · Budget view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-33"></a>

## 33 · Newlywed Homecoming

- **Master section:** `s33` · slug `newlywed-homecoming`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** done on `cursor/dashboard-views-017e` — review, then say “next” for §34
- **Screen ids:** `18a`, `31g`, `31h`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `18a` |
| View switcher views | yes | `31g`, `31h` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Name-change step · 18a: Institution · Documents · Dates · History |
| Night theme | yes | `18a` |

**View switcher options (exact labels):** Newlywed Homecoming · Name change view · Newlywed Homecoming · Budget view

**Record drawers:**
- Name-change step · 18a · 4 drawers: Institution · Documents · Dates · History

**Rail:**
- `18a` Settling in · Name change · First month budget · What we noticed · Area · Owner · Due

**Primary actions:**
- `18a` Add task

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `18a`.

Drawings:
- `18a` — Newlywed Homecoming

##### `18a` — Newlywed Homecoming

- **Purpose.** The admin of becoming a household: settling in, changing a name across eleven institutions, and a first month of money that no longer has a wedding in it. Practical tables throughout, with one reflective section at the end — the only place this page allows itself prose.
- **Lives under tab:** Covenant
- **Table columns / fields shown:** Task · Area · Owner · Due · Depends on · Status · Institution · Document needed · Submitted · Confirmed · …
- **Rail (saved views/meters):** Settling in · Name change · First month budget · What we noticed · Area · Owner · Due
- **Primary action:** Add task
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `31g`, `31h`.

Drawings:
- `31g` — Newlywed Homecoming · Name change view
- `31h` — Newlywed Homecoming · Budget view

##### `31g` — Newlywed Homecoming · Name change view

- **Purpose:** Sequencing a name change so nothing is attempted before its prerequisite exists.
- **Lives under tab:** The Day · Newlywed Homecoming · view switcher
- **How it connects:** Same records as this page’s first view. Money here posts to the after-the-day budget, which is kept separate from the wedding budget on purpose.
- **Blocked is not late:** Amber Blocked means a prerequisite is outstanding, and the row names it. A step is only red once its prerequisite is met and it still has not moved.
- **Cost column:** Government fees post to the after-the-day budget, not the wedding budget.

##### `31h` — Newlywed Homecoming · Budget view

- **Purpose:** The after-the-day budget: small, real, and invisible in the wedding budget by design.
- **Lives under tab:** The Day · Newlywed Homecoming · view switcher
- **Separation rule:** These figures never roll into the wedding budget totals. Two ledgers, stated once, in both places.
- **How it connects:** Same records as this page’s first view. Money here posts to the after-the-day budget, which is kept separate from the wedding budget on purpose.
- **Contingent cost:** The suit-return card shows a late fee, not a budget line — a cost that exists only on failure is labelled as such.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Name-change step · 18a · 4 drawers

Tabs, in this order: **Institution** · **Documents** · **Dates** · **History**.

- **Institution**. First in the order because every other institution waits on it.
- **Documents**. The registry needs the document it makes — the certificate the ceremony produces.
- **Dates**. Nothing can be filled before 9 November. Submitted-but-not-confirmed is the state to chase.
- **History**. One entry. A short history here means the plan has not started, not that nothing was logged.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `18a`.

Drawings:
- `18a` — Newlywed Homecoming
- Newlywed Homecoming · Name change view · night
- Newlywed Homecoming · Budget view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-34"></a>

## 34 · Planner History

- **Master section:** `s34` · slug `planner-history`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `18b`, `31i`, `31j`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `18b` |
| View switcher views | yes | `31i`, `31j` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | History entry · 18b: Change · Record · Snapshot |
| Night theme | yes | `18b` |

**View switcher options (exact labels):** Planner History · By record view · Planner History · Field detail view

**Record drawers:**
- History entry · 18b · 3 drawers: Change · Record · Snapshot

**Rail:**
- `18b` Everything · Guests · Budget & payments · Tasks · Vendors · Table layout · Everything else · Today · 31 Jul · Yesterday · 29 July · This week · Pick a date…

**Primary actions:**
- `18b` Undo last change

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `18b`.

Drawings:
- `18b` — Planner History

##### `18b` — Planner History

- **Purpose.** A page with no tab. It is reached from the undo and redo buttons in the top bar, or from the avatar menu — so the tab strip shows nothing lit, and the sub-nav is replaced by a line saying where you came from. Read-only by default: a row can be undone only while its snapshot is still one of the fifteen the planner keeps.
- **Lives under tab:** no-tab (Planner History)
- **Table columns / fields shown:** Change · Record · Who · Time · Undo
- **Rail (saved views/meters):** Everything · Guests · Budget & payments · Tasks · Vendors · Table layout · Everything else · Today · 31 Jul · Yesterday · 29 July · This week · Pick a date…
- **Primary action:** Undo last change
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `31i`, `31j`.

Drawings:
- `31i` — Planner History · By record view
- `31j` — Planner History · Field detail view

##### `31i` — Planner History · By record view

- **Purpose:** Auditing one record’s life. The day view is for “what happened Tuesday”; this is for “what happened to Efua”.
- **Lives under tab:** Reached from undo/redo and the avatar menu · view switcher
- **Group row format:** record · change count · last change · distinct editors.
- **How it connects:** The log is append-only and derived from every write in the planner. Nothing here is editable; the only actions are restore and open the record.
- **Consequence chips:** A change that caused a derived effect is chipped with the effect, not just the field — “+1 cover”, “created a clash”, “category over”.

##### `31j` — Planner History · Field detail view

- **Purpose:** Restoring a single value with the consequences stated before you commit.
- **Lives under tab:** Reached from undo/redo and the avatar menu · view switcher
- **How it connects:** The log is append-only and derived from every write in the planner. Nothing here is editable; the only actions are restore and open the record.
- **Right panel:** Lists what the field feeds, and what a restore would and would not do. The honesty is in the “does not” list.
- **Rule:** Restore acts on one field, never a whole record — a record-level rollback is a different, confirmed action.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### History entry · 18b · 3 drawers

Tabs, in this order: **Change** · **Record** · **Snapshot**.

- **Change**. Three edits in three seconds are one entry. Grouped by time, because intent cannot be known.
- **Record**. Names the record rather than copying it — so the entry survives the record being deleted.
- **Snapshot**. Undo is not per-field. It rolls the whole planner back, and says what else would move.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `18b`.

Drawings:
- `18b` — Planner History
- Planner History · By record view · night
- Planner History · Field detail view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-35"></a>

## 35 · Wedding Setup

- **Master section:** `s35` · slug `wedding-setup`
- **Header counts:** 4 screens · 1 record drawer
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `15a`, `11c`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `15a` |
| View switcher views | yes | `11c` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Setup field · 15a: Field · Impact · History |
| Night theme | yes | `15a`, `11c` |

**View switcher options (exact labels):** Wedding Setup · earlier drawing

**Record drawers:**
- Setup field · 15a · 3 drawers: Field · Impact · History

**Rail:**
- `15a` The couple · The day · Money · Guests & seating · Menu visibility · Print & sharing · This device · Clear a table · Restore a backup · Clear history · Reset planner
- `11c` The couple · The day · Money · Guests & seating · Print & sharing · This device · Clear a table · Reset planner

**Primary actions:**
- `15a` Save changes
- `11c` Save changes

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `15a`.

Drawings:
- `15a` — Wedding Setup

##### `15a` — Wedding Setup

- **Purpose.** The page every other page reads. Restored to its own name — it is the setup surface the app has always had, and the Essentials Checklist is a different page about buying things. Nothing here is a record you browse, so it is a form: eleven facts, each naming what it feeds, plus menu visibility and the danger zone.
- **Lives under tab:** no-tab (Wedding Setup)
- **Rail (saved views/meters):** The couple · The day · Money · Guests & seating · Menu visibility · Print & sharing · This device · Clear a table · Restore a backup · Clear history · Reset planner
- **Primary action:** Save changes
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `11c`.

Drawings:
- `11c` — Wedding Setup · earlier drawing

##### `11c` — Wedding Setup · earlier drawing

- **Purpose:** See screen name.
- **Lives under tab:** no-tab (Wedding Setup)
- **Rail (saved views/meters):** The couple · The day · Money · Guests & seating · Print & sharing · This device · Clear a table · Reset planner
- **Primary action:** Save changes
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Setup field · 15a · 3 drawers

Tabs, in this order: **Field** · **Impact** · **History**.

- **Field**. The one setup field that feeds the most pages, and the only one whose edit confirms first.
- **Impact**. A before-and-after list, approved as one change — so undo reverses all of it or none.
- **History**. Two entries in five months. Sparseness here is the reassuring reading.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `15a`, `11c`.

Drawings:
- `15a` — Wedding Setup
- `11c` — Wedding Setup · earlier drawing

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-36"></a>

## 36 · Get Started, Guide & FAQ

- **Master section:** `s36` · slug `get-started-guide-faq`
- **Header counts:** 10 screens · 1 record drawer
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `15b`, `15d`, `15c`, `33i`, `33j`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `15b`, `15d`, `15c` |
| View switcher views | yes | `33i`, `33j` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Guide entry drawer · 4 tabs: Entry · Steps · Links · History |
| Night theme | yes | `15b`, `15d`, `15c` |

**View switcher options (exact labels):** Page-by-Page Guide · Table view · Page-by-Page Guide · Print view

**Record drawers:**
- Guide entry drawer · 4 tabs · Entry · Steps · Links · History: Entry · Steps · Links · History

**Rail:**
- `15b` Before anything else · How the planner connects · Editing & navigation · Planning with your partner · What it cannot do · Your first hour · Page-by-Page Guide · FAQ · Wedding Setup
- `15d` Every page · Overview · Planning · People · Money · Vendors · The Day · Covenant · Documents · Get Started · FAQ · Wedding Setup
- `15c` Everything · Saving & backups · Guests & RSVPs · Money · Printing · Sharing · Troubleshooting · Get Started · Page-by-Page Guide · Wedding Setup

**Primary actions:**
- `15b` Download backup
- `15d` Open Get Started
- `15c` Open Get Started

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `15b`, `15d`, `15c`.

Drawings:
- `15b` — Get Started
- `15d` — Page-by-Page Guide
- `15c` — FAQ

##### `15b` — Get Started

- **Purpose.** A reference page, so the §07 frame holds but the work surface carries prose instead of rows — no stat strip, no toolbar, no bulk bar, no drawer. The rail becomes a table of contents. The one thing this page must do is make the backup warning impossible to skim past.
- **Lives under tab:** no-tab (Get Started)
- **Rail (saved views/meters):** Before anything else · How the planner connects · Editing & navigation · Planning with your partner · What it cannot do · Your first hour · Page-by-Page Guide · FAQ · Wedding Setup
- **Primary action:** Download backup
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `15d` — Page-by-Page Guide

- **Purpose.** Thirty-one entries, one per page, each answering the same three questions: what it does, what it syncs, and when to use it. Collapsed it is a table of contents; expanded, one entry is a three-column brief. The rail counts entries per tab so nothing goes missing.
- **Lives under tab:** no-tab (Page-by-Page Guide)
- **Rail (saved views/meters):** Every page · Overview · Planning · People · Money · Vendors · The Day · Covenant · Documents · Get Started · FAQ · Wedding Setup
- **Primary action:** Open Get Started
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

##### `15c` — FAQ

- **Purpose.** Search, six categories, and a quick-answers column that repeats the five things people ask most. The right column is not a drawer — no record is open — so it is a plain aside at the same 360px, which keeps the frame honest without pretending there is a record behind it.
- **Lives under tab:** no-tab (FAQ)
- **Rail (saved views/meters):** Everything · Saving & backups · Guests & RSVPs · Money · Printing · Sharing · Troubleshooting · Get Started · Page-by-Page Guide · Wedding Setup
- **Primary action:** Open Get Started
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `33i`, `33j`.

Drawings:
- `33i` — Page-by-Page Guide · Table view
- `33j` — Page-by-Page Guide · Print view

##### `33i` — Page-by-Page Guide · Table view

- **Purpose:** Orientation for a new user, and the reference a developer checks before duplicating a field.
- **Lives under tab:** Overview · Page-by-Page Guide · view switcher
- **Columns:** Page · Tab · Owns · Reads from · Feeds · Prints. “Owns” is the important one: only one page owns any given field.
- **How it connects:** Reference pages keep the shell, rail and page header but carry prose: no stat strip in the usual sense, no bulk bar, no drawer, because no record is open.
- **Reference page:** Keeps the shell and rail but the rail is a table of contents, not saved views.

##### `33j` — Page-by-Page Guide · Print view

- **Purpose:** A physical reference for a second person — a mother, a planner, a helper — who has to use the planner without being taught it.
- **Lives under tab:** Overview · Page-by-Page Guide · view switcher
- **How it connects:** Reference pages keep the shell, rail and page header but carry prose: no stat strip in the usual sense, no bulk bar, no drawer, because no record is open.
- **Print class:** A — working document, grouped by tab, one line per page.
- **Rule:** The printed guide states which page owns each thing, because the most common misuse is typing a number into the page that only reads it.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Guide entry drawer · 4 tabs · Entry · Steps · Links · History

Tabs, in this order: **Entry** · **Steps** · **Links** · **History**.

- **Entry** — `Guide entry · Entry tab`. One entry of the Page-by-Page Guide, opened for editing. Help text is a record like any other.
- **Steps** — `Guide entry · Steps tab`. The first three things a new planner should do on that page, in order.
- **Links** — `Guide entry · Links tab`. What this entry points at, and the FAQ answers that lean on it.
- **History** — `Guide entry · History tab`. Edits to the help text, because out-of-date help is worse than none.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `15b`, `15d`, `15c`.

Drawings:
- `15b` — Get Started
- `15d` — Page-by-Page Guide
- `15c` — FAQ
- Page-by-Page Guide · Table view · night
- Page-by-Page Guide · Print view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-37"></a>

## 37 · Viewer Preferences

- **Master section:** `s37` · slug `viewer-preferences`
- **Header counts:** 6 screens · 1 record drawer
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `16a`, `48a`, `48b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `16a` |
| View switcher views | yes | `48a`, `48b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | Viewer drawer · 4 tabs: Viewer · Access · Alerts · History |
| Night theme | yes | `16a` |

**View switcher options (exact labels):** Viewer preferences · By viewer view · Viewer preferences · By permission view

**Record drawers:**
- Viewer drawer · 4 tabs · Viewer · Access · Alerts · History: Viewer · Access · Alerts · History

**Rail:**
- `16a` All lines · Over target · Unpaid · Pledged & paid

**Primary actions:**
- `16a` + New line

**Standing rules on this page:**
- `48a` **Honesty rule:** Pages a viewer cannot use are absent from their navigation, not greyed out — the count reflects that.
- `48b` **Honesty rule:** Money and Notes are listed first because they are the two groups most often shared by accident.
- `16a` **Honesty rule:** Money and Notes are listed first because they are the two groups most often shared by accident.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `16a`.

Drawings:
- `16a` — Viewer preferences · the avatar menu

##### `16a` — Viewer preferences · the avatar menu

- **Purpose.** Undo and redo now sit in the top bar on every screen — the second piece of always-present chrome, and the reason this menu carries only a shortcut reminder rather than the controls themselves. No gear icon — the avatar already sits top-right and clicking it opens this, so there is one affordance rather than two side by side. Everything inside changes what you see; nothing in it changes a record, a total, or anything a share-packet recipient would receive. That is the test for whether a setting belongs here or on Wedding Setup.
- **Lives under tab:** no-tab (Viewer preferences)
- **Table columns / fields shown:** Line item · Category · Committed · Paid · Status
- **Rail (saved views/meters):** All lines · Over target · Unpaid · Pledged & paid
- **Primary action:** + New line
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `48a`, `48b`.

Drawings:
- `48a` — Viewer preferences · By viewer view
- `48b` — Viewer preferences · By permission view

##### `48a` — Viewer preferences · By viewer view

- **Purpose:** The question is usually “what can Efua see?”, so the default view answers it per person.
- **Lives under tab:** Overview · Viewer preferences · view switcher
- **Row shows:** Viewer, role, pages visible, money visibility, link expiry and last opened.
- **Honesty rule:** Pages a viewer cannot use are absent from their navigation, not greyed out — the count reflects that.

##### `48b` — Viewer preferences · By permission view

- **Purpose:** “Who can see the Budget?” is a different question from “what can Efua see?”, and needs its own view.
- **Lives under tab:** Overview · Viewer preferences · view switcher
- **Row shows:** Each page or field group with the viewers who hold it, and the count.
- **Honesty rule:** Money and Notes are listed first because they are the two groups most often shared by accident.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Viewer drawer · 4 tabs · Viewer · Access · Alerts · History

Tabs, in this order: **Viewer** · **Access** · **Alerts** · **History**.

- **Viewer** — `Viewer · Viewer tab`. A person who has been given a way in, and what they see when they use it.
- **Access** — `Viewer · Access tab`. Exactly which pages and which fields, and when the link stops working.
- **Alerts** — `Viewer · Alerts tab`. What reaches them without them opening anything.
- **History** — `Viewer · History tab`. Every access change, which is the part you will want in writing later.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `16a`.

Drawings:
- `16a` — Viewer preferences · the avatar menu
- Viewer preferences · By viewer view · night
- Viewer preferences · By permission view · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-38"></a>

## 38 · Database Hub

- **Master section:** `s38` · slug `database-hub`
- **Header counts:** 5 screens · 2 record drawers
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `7b`, `7c`, `19o`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `7b` |
| View switcher views | yes | `7c` |
| Section tabs | yes | `19o` |
| Record drawer tabs | yes | Hub table · 7b: Table · Fields · Links · Activity; Hub row · 7c: Row · Links · Raw · History |
| Night theme | yes | `7b`, `7c` |

**View switcher options (exact labels):** Database Hub · all tables

**Record drawers:**
- Hub table · 7b · 4 drawers: Table · Fields · Links · Activity
- Hub row · 7c · 4 drawers: Row · Links · Raw · History

**Stat strips:**
- `7b` Tables: 24 · Records: 359 · Database size: 1.8 MB · Last backup: 3 days ago · Needs attention: 4

**Rail:**
- `7b` All tables · With records · Empty · Needs attention · Edited this week
- `7c` guests · 142 · budget_items · 34 · installments · 18 · tables · 15 · day_events · 14 · payments · 11 · prayer_entries · 11 · vendors · 10 · wedding_party · 10 · appointments · 9 · gifts · 9 · budget_categories · 8 · counseling_sessions · 8 · vision_pins · 6 · contracts · 5 · shot_lists · 4 · + 8 more

**Primary actions:**
- `7b` Download backup
- `7c` Download backup

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `7b`.

Drawings:
- `7b` — Database Hub

##### `7b` — Database Hub

- **Purpose.** Moved out of the top bar into Documents, where it belongs. Three jobs: show what is stored and which page owns it, make backup and restore obvious enough that a couple actually does it, and resolve the four broken links the Dashboard reports — each with the fix inline rather than a warning to act on elsewhere.
- **Lives under tab:** Documents
- **Table columns / fields shown:** Table · Records · Owner page · Last edited · Status
- **Stat strip:** Tables: 24 · Records: 359 · Database size: 1.8 MB · Last backup: 3 days ago · Needs attention: 4
- **Rail (saved views/meters):** All tables · With records · Empty · Needs attention · Edited this week
- **Primary action:** Download backup
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `7c`.

Drawings:
- `7c` — Database Hub · all tables

##### `7c` — Database Hub · all tables

- **Purpose.** The second half of the hub: pick any of the 24 tables and read every row and every column as it is actually stored — all 24 guest fields rather than the 6 the Guest List shows, the full filters bar, and the bulk edit bar working on raw fields. This is the escape hatch for anything the owning page will not let you do.
- **Lives under tab:** Documents
- **Table columns / fields shown:** id · first_name · last_name · household · side · group · relationship · rsvp · invited · plus_one · …
- **Rail (saved views/meters).** guests · 142 · budget_items · 34 · installments · 18 · tables · 15 · day_events · 14 · payments · 11 · prayer_entries · 11 · vendors · 10 · wedding_party · 10 · appointments · 9 · gifts · 9 · budget_categories · 8 · counseling_sessions · 8 · vision_pins · 6 · contracts · 5 · shot_lists · 4 · + 8 more
- **Primary action:** Download backup
- **How it connects to the rest of the planner.** Follows §07 page anatomy (top bar → tabs → sub-nav → rail + header/stats/toolbar/table + drawer). Any figure shown here is derived from the owning record — never typed twice — per the cross-screen data contract in the spec appendix. Editing a record here updates every other page/drawer/view that reads the same field.

#### Part · Section tabs

*the page’s own tab strip*

Screen ids: `19o`.

Drawings:
- `19o` — Database Hub · twenty-four table tabs

##### `19o` — Database Hub · twenty-four table tabs


#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

##### Hub table · 7b · 4 drawers

Tabs, in this order: **Table** · **Fields** · **Links** · **Activity**.

- **Table**. One owner page per table. The hub is a second way in, never a second copy.
- **Fields**. Twenty-four fields, six of them enumerated — raw here, pills on the owner page.
- **Links**. Four links out, and the six orphans pointing at a table that no longer exists.
- **Activity**. Table-level, not row-level. A single row has its own History tab.

##### Hub row · 7c · 4 drawers

Tabs, in this order: **Row** · **Links** · **Raw** · **History**.

- **Row**. Seven of twenty-four fields. The same record the Guest List edits, not a copy.
- **Links**. A valid link pointing at an incomplete thing — the tab distinguishes those two failures.
- **Raw**. Read-only JSON, so a developer can see the real field names before writing a migration.
- **History**. The same history the Guest List shows, because it is the same record.

#### Part · Night theme

*the same surfaces in dark mode*

Screen ids: `7b`, `7c`.

Drawings:
- `7b` — Database Hub
- `7c` — Database Hub · all tables

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-39"></a>

## 39 · App chrome, settings & record editor

- **Master section:** `s39` · slug `app-chrome-settings-record-editor`
- **Header counts:** 8 screens · 5 record drawers
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `49d`, `49a`, `49b`, `49c`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `49d`, `49a`, `49b`, `49c` |
| View switcher views | omit | does not apply — do not invent this surface |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | yes | The avatar menu, open; Search, focused and typing; The undo flyout; The help menu — Top bar menus · avatar, search, undo, help: ; Profile drawer · 4 tabs: Profile · Display · Alerts · Access; Settings window · eleven panes: ; Help panes · get started, page-by-page, FAQ: ; Record editor window · Task, Vendor, Payment:  |
| Night theme | yes | Chrome top bar · three states · night; Profile & Display · pop-out drawer · night; Custom Theme Builder · opened from Appearance · night; Settings · gear pop-out window · night |

**Record drawers:**
- Top bar menus · avatar, search, undo, help · 4 screens · 1440px: 
- Profile drawer · 4 tabs · Profile · Display · Alerts · Access: Profile · Display · Alerts · Access
- Settings window · eleven panes · 11 screens · 1240px: 
- Help panes · get started, page-by-page, FAQ · 3 screens · 1240px: 
- Record editor window · Task, Vendor, Payment · 3 screens · 1240px: 

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*top bar, Profile & Display, the theme builder and the Settings window — every control kept*

Screen ids: `49d`, `49a`, `49b`, `49c`.

Drawings:
- `49d` — Chrome top bar · three states
- `49a` — Profile & Display · pop-out drawer
- `49b` — Custom Theme Builder · opened from Appearance
- `49c` — Settings · gear pop-out window

##### `49d` — Chrome top bar · three states

- **Below the bar:** Tab strip in the deeper forest, then the sub-nav on the work surface — so the eye can tell global chrome from page navigation.
- **Chrome is brand:** Forest bar, gold accents, Cormorant wordmark. Profile & Display is the one solid-gold button, because it is the most-used control in the bar.
- **Nothing removed:** Wordmark and sub-line, save status, global search, photo cutout, Save, Alerts with badge, Profile & Display, Database Hub, Quick Jump, Dark Mode, and the overflow — now labelled Settings.
- **Recreated from:** index.html · header — brand, topbar-row-primary, topbar-photo-wrap, actions
- **Two rows, not one.** Nine controls plus a wordmark and a search field do not fit on one 1440px line. Identity, photo, save status and the countdown take the upper row; search and the nine action buttons take the lower. Nothing is hidden behind a chevron.
- **What changed:** “More” becomes “Settings” with a gear — a menu holding backups and print is not overflow, it is the settings surface. Search gains a real result list grouped by record type, with keyboard hints.

##### `49a` — Profile & Display · pop-out drawer

- **Gold rule:** Gold appears on the forest header only. Inside the body, on white, the accent is forest — never gold on white.
- **Nothing removed:** This Wedding, Wedding Profile, Planning Categories, Appearance, Menu & Focus, Modes & Tools — all six sections, all controls, all helper text.
- **Recreated from:** index.html · #profile-drawer (pd-modern)
- **What changed.** Radius to zero; header becomes forest chrome with gold sub-line; category radios become four cards with their own explanation; Planning view becomes a three-way segmented control instead of a select, because there are exactly three and the choice is structural.
- **Width:** 460px, up from 380px, so category cards fit two-up and the toggle rows stop wrapping.

##### `49b` — Custom Theme Builder · opened from Appearance

- **Honest default:** Card Corners defaults to None (square) because the system is square. The other two options stay, since existing themes use them.
- **Nothing removed:** Twelve colour fields with their captions, theme name, Card Corners select, live preview, saved list, Cancel and Save & Apply.
- **Recreated from:** #theme-builder-overlay · tb-modal
- **What changed:** Colour fields become a 4×3 grid of swatch rows so all twelve are visible without scrolling; the preview shows real components (button, chip, swatch strip) rather than a bare colour strip.

##### `49c` — Settings · gear pop-out window

- **Nothing removed:** Save, backup, restore, undo, redo, history, CSV export (13 lists), print (30 pages), auto-fit columns, help — plus locale, currency and date format.
- **Recreated from:** #topbar-overflow and the locale block of #setup
- **Save status is a banner:** “Saved on this device” was a small line in the top bar. Here it is a green banner with the last backup date and the edit count since — the two numbers that decide whether you act.
- **What changed:** A flat 14-item dropdown becomes six labelled panes. Undo and Redo are drawn in their real disabled state rather than hidden, so the menu stops lying about what is available.
- **Width:** 1240px, matching the record editor pop-out.

#### Part · View switcher views

*View switcher views does not apply on this page.* one drawing per option in this page’s view menu Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*one drawing per tab of every record this page opens*

Drawings:
- The avatar menu, open
- Search, focused and typing
- The undo flyout
- The help menu

##### Top bar menus · avatar, search, undo, help · 4 screens · 1440px

##### Profile drawer · 4 tabs · Profile · Display · Alerts · Access

Tabs, in this order: **Profile** · **Display** · **Alerts** · **Access**.

- **Profile** — `Profile drawer · Profile tab`. The person, as everyone else in the planner sees them. Name, role and how to reach them — this is what a vendor sees on a day-of contact sheet.
- **Display** — `Profile drawer · Display tab`. The same six device controls as the settings window, reachable without leaving the page. Density is the one people change hourly — it belongs one click from the work, not four.
- **Alerts** — `Profile drawer · Alerts tab`. What reaches this person, as opposed to what the planner generates. Two people on the same file can want very different interruptions.
- **Access** — `Profile drawer · Access tab`. What this person can reach, who granted it, and the one category that can be taken back. The same drawer opened on a helper or a vendor shows far less.

##### Settings window · eleven panes · 11 screens · 1240px

##### Help panes · get started, page-by-page, FAQ · 3 screens · 1240px

##### Record editor window · Task, Vendor, Payment · 3 screens · 1240px

#### Part · Night theme

*the same surfaces in dark mode*

Drawings:
- Chrome top bar · three states · night
- Profile & Display · pop-out drawer · night
- Custom Theme Builder · opened from Appearance · night
- Settings · gear pop-out window · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-40"></a>

## 40 · Vendor Portal

- **Master section:** `s40` · slug `vendor-portal`
- **Header counts:** 7 screens
- **Status:** not started — do not implement until every earlier section is reviewed

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | Your brief; Your schedule; Your paperwork; Upload; Mobile, and the expired link; The scope contract… |
| View switcher views | omit | does not apply — do not invent this surface |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | omit | does not apply — do not invent this surface |
| Night theme | omit | does not apply — do not invent this surface |

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*brief, schedule, paperwork, upload, mobile, expiry, scope, lifecycle*

Drawings:
- Your brief
- Your schedule
- Your paperwork
- Upload
- Mobile, and the expired link
- The scope contract
- Access lifecycle

Named screens (no numeric id in the Master):
- **Your brief**
- **Your schedule**
- **Your paperwork**
- **Upload**
- **Mobile, and the expired link**
- **The scope contract**
- **Access lifecycle**

#### Part · View switcher views

*View switcher views does not apply on this page.* one drawing per option in this page’s view menu Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*Record drawer tabs does not apply on this page.* one drawing per tab of every record this page opens Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Night theme

*Night theme does not apply on this page.* the same surfaces in dark mode Do not invent a tab strip, extra views, or extra drawers to fill the slot.

---

<a id="section-41"></a>

## 41 · House style & visual directions

- **Master section:** `s41` · slug `house-style-visual-directions`
- **Header counts:** 11 screens
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `2a`, `2b`, `1a`, `1b`, `1c`, `1d`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `2a`, `2b` |
| View switcher views | yes | `1a`, `1b`, `1c`, `1d` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | omit | does not apply — do not invent this surface |
| Night theme | yes | Neutral Records × Editorial chrome · night; Baseline — today's screen · night; Direction A — Neutral Records · night; Direction B — Editorial Professional · night; Direction C — Pipeline · night |

**View switcher options (exact labels):** Baseline — today's screen · Direction A — Neutral Records · Direction B — Editorial Professional · Direction C — Pipeline

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `2a`, `2b`.

Drawings:
- `2a` — Neutral Records × Editorial chrome
- `2b` — Same screen, dark mode

##### `2a` — Neutral Records × Editorial chrome


##### `2b` — Same screen, dark mode


#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `1a`, `1b`, `1c`, `1d`.

Drawings:
- `1a` — Baseline — today's screen
- `1b` — Direction A — Neutral Records
- `1c` — Direction B — Editorial Professional
- `1d` — Direction C — Pipeline

##### `1a` — Baseline — today's screen


##### `1b` — Direction A — Neutral Records


##### `1c` — Direction B — Editorial Professional


##### `1d` — Direction C — Pipeline


#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*Record drawer tabs does not apply on this page.* one drawing per tab of every record this page opens Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Night theme

*the same surfaces in dark mode*

Drawings:
- Neutral Records × Editorial chrome · night
- Baseline — today's screen · night
- Direction A — Neutral Records · night
- Direction B — Editorial Professional · night
- Direction C — Pipeline · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

<a id="section-42"></a>

## 42 · System-wide patterns

- **Master section:** `s42` · slug `system-wide-patterns`
- **Header counts:** 40 screens
- **Status:** not started — do not implement until every earlier section is reviewed
- **Screen ids:** `43a`, `41a`, `42a`, `42b`, `38a`, `39a`, `40a`, `37a`, `37b`, `37c`, `34a`, `34b`, `34c`, `34d`, `35a`, `35b`, `35c`, `35d`, `36a`, `36b`

### Five parts on this page

| Part | Applies | What to build |
|---|---|---|
| Full page | yes | `43a` |
| View switcher views | yes | `41a`, `42a`, `42b`, `38a`, `39a`, `40a`, `37a`, `37b`, `37c`, `34a`, `34b`, `34c`, `34d`, `35a`, `35b`, `35c`, `35d`, `36a`, `36b` |
| Section tabs | omit | does not apply — do not invent this surface |
| Record drawer tabs | omit | does not apply — do not invent this surface |
| Night theme | yes | Role views · planner, couple, vendor · night; 1024px · rail collapses, drawer overlays · night; Mobile · table becomes cards, drawer becomes a screen, rail becomes a sheet · night; Day-of mode · the phone in a corridor · night; Table depth · field types, rollups, summary bar, row actions · night; Drawer depth · related lists, comments, activity, provenance · night… |

**View switcher options (exact labels):** 1024px · rail collapses, drawer overlays · Mobile · table becomes cards, drawer becomes a screen, rail becomes a sheet · Day-of mode · the phone in a corridor · Table depth · field types, rollups, summary bar, row actions · Drawer depth · related lists, comments, activity, provenance · Stat strip depth · deltas, sparklines, target lines, attention · State library · table page · State library · the other three archetypes · Per-page empty-state copy · Command palette · ⌘K · Filter builder · Saved views · management · Bulk edit · Import · field mapping · Keyboard shortcuts · ? · Notification centre · Share dialog · Undo, validation, offline and save states · Templates, trash and duplicate merge

**Stat strips:**
- `41a` Drops from five cells to four; the fifth moves into the toolbar as a chip rather than being hidden.
- Drops from five cells to four; the fifth moves into the toolbar as a chip rather than being hidden.

### Build notes, part by part

Match the Master drawings. Do not invent UX. Figures come from the owning record — never typed twice. Implement **everything** this section draws — missing, not implemented, not created, and not redesigned — not only the headline gaps.

#### Part · Full page

*the page as it ships*

Screen ids: `43a`.

Drawings:
- `43a` — Role views · planner, couple, vendor

##### `43a` — Role views · planner, couple, vendor

- **Counts without names:** The vendor sees 3 nut allergies and 9 vegetarian covers, never which guests. This single rule is what makes vendor access safe to hand out.
- **Couple:** Everything the planner sees plus Covenant, and ownership of every sharing decision. Both partners edit the same records with named cursors.
- **Planner:** Full access except Covenant, which the couple grants explicitly and can revoke. Default is off. Saved views are hers alone.
- **Provenance banner:** Every vendor session states who shared it, when, and when access expires. Live records, not a copy — said on the screen.
- **Vendor:** Not the app with things hidden — a different shell with four tabs: your brief, your schedule, your paperwork, upload. Muted chrome so it is visibly not the planner.
- **You owe us:** The vendor view leads with their obligations to you, dated and reasoned. It is the only role view with a section about what is outstanding from the viewer.

#### Part · View switcher views

*one drawing per option in this page’s view menu*

Screen ids: `41a`, `42a`, `42b`, `38a`, `39a`, `40a`, `37a`, `37b`, `37c`, `34a`, `34b`, `34c`, `34d`, `35a`, `35b`, `35c`, `35d`, `36a`, `36b`.

Drawings:
- `41a` — 1024px · rail collapses, drawer overlays
- `42a` — Mobile · table becomes cards, drawer becomes a screen, rail becomes a sheet
- `42b` — Day-of mode · the phone in a corridor
- `38a` — Table depth · field types, rollups, summary bar, row actions
- `39a` — Drawer depth · related lists, comments, activity, provenance
- `40a` — Stat strip depth · deltas, sparklines, target lines, attention
- `37a` — State library · table page
- `37b` — State library · the other three archetypes
- `37c` — Per-page empty-state copy
- `34a` — Command palette · ⌘K
- `34b` — Filter builder
- `34c` — Saved views · management
- `34d` — Bulk edit
- `35a` — Import · field mapping
- `35b` — Keyboard shortcuts · ?
- `35c` — Notification centre
- `35d` — Share dialog
- `36a` — Undo, validation, offline and save states
- `36b` — Templates, trash and duplicate merge

##### `41a` — 1024px · rail collapses, drawer overlays

- **Table:** Unchanged. Column hiding is a user decision, not a breakpoint decision — a tablet user auditing seating still needs the seat column.
- **Stat strip:** Drops from five cells to four; the fifth moves into the toolbar as a chip rather than being hidden.
- **Rail:** Collapses to 48px icons with the group menu behind ☰. Tapping an icon opens the rail as a temporary overlay, it does not push the table.
- **Breakpoint:** 1240px. Above it the drawer sits beside the work surface; below it the drawer overlays.
- **Tab strip:** Horizontally scrollable with a fade at the right edge. Tabs are never wrapped onto two lines and never collapsed into a picker at this size.

##### `42a` — Mobile · table becomes cards, drawer becomes a screen, rail becomes a sheet

- **Breakpoint:** 720px. Below it tables render as cards, the drawer becomes a full screen, and the rail becomes a bottom sheet.
- **Drawer → screen:** Pushes as a full screen with a back chevron and prev/next in the bar. Tabs scroll horizontally; fields stack label-above-value at 44px.
- **Not supported:** Canvas pages (Table Layout plan, Vision Board) are read-only below 720px. Dragging a table plan on a phone is worse than not offering it, and the page says so.
- **Rail → sheet:** A bottom sheet, each row keeping its count. Counts are the reason a planner taps a rail entry, so they survive the collapse.
- **Tab bar:** Four destinations plus More, with the primary action as a floating button. Never eight tabs squeezed into a bar.
- **Table → cards:** One card per record carrying the same fields the visible columns held, plus the reason chip. Actions are 44px minimum.

##### `42b` — Day-of mode · the phone in a corridor

- **Why it exists:** On the day nobody edits records. They check the time, read the next cue, and phone somebody. Every other affordance is noise.
- **Dark by default:** Not the theme toggle — this mode is dark because it is used in dim rooms and it saves battery across an 18-hour day.
- **Entry:** Offered automatically on the wedding date from the top bar, and manually from the avatar menu. Leaving it returns to the normal app.
- **No editing:** Deliberately read-only except for marking a timeline item done. A mistyped field at 15:33 is worse than no field.
- **Offline first:** Shows held-change count in the header. This is the mode the offline banner was designed around.
- **Type scale:** Current item at 26px, next items at 15px, times in tabular figures. Nothing below 11.5px.

##### `38a` — Table depth · field types, rollups, summary bar, row actions

- **Add field:** The ＋ column at the right end is how fields are created, in the grid, not in a settings page.
- **Derived columns:** Marked ƒ with a muted header and not editable in the grid. This is how a planner knows a number came from somewhere else before trying to change it.
- **Field types:** Every header carries a type glyph. Alignment follows type — numbers and currency right, tabular figures throughout. A person is an avatar, a checkbox is a mark, a linked record is a chip with an arrow.
- **Frozen column:** The guest name stays put while the rest scrolls; the summary bar freezes with it.
- **Row actions:** Hidden until hover, keyboard equivalents shown. Open-in-drawer and open-full-editor are separate actions, not the same click.
- **Summary bar:** One rollup per column, in the column’s own alignment. Blanks and failures are counted in colour — 24 blank meals amber, 5 unseated red.

##### `39a` — Drawer depth · related lists, comments, activity, provenance

- **Activity:** Derived consequences are stated in the entry (“+1 cover”) and dotted gold, so the log explains effects rather than only listing fields.
- **Comments vs notes:** A comment is a conversation on a record and can be resolved. A note is a pinned fact with a kind. Both exist; they are not the same object.
- **Empty fields:** “Add…” in pale text, never a blank box. Missing and unfilled must look different.
- **Header:** Avatar, status chips, three quick actions, breadcrumb, and prev/next carrying the record position. ⌥↑↓ moves between records without closing.
- **Provenance:** Created and last-modified at the foot. Always present, never a section of its own.
- **Related lists:** Inline mini-tables for the children this record owns or touches, each with an add action and a link out to the owning page.

##### `40a` — Stat strip depth · deltas, sparklines, target lines, attention

- **Attention:** At most one amber or red cell per strip, and it must state why. A strip where everything is coloured teaches nothing.
- **Click to filter:** Each stat names the view it would apply. A number you cannot get to the rows behind is decoration.
- **Delta:** Change since a named moment, never a bare percentage. “↑6 since Monday” is auditable; “+12%” is not.
- **Never:** No stat shows a figure that exists nowhere else — every value is derived from records on the page.
- **Sparkline:** Twelve weeks, last bar in forest. Only for figures that genuinely trend — a count of tables does not.
- **Target line:** Two-tone bar with the target marked as a tick, so over-target reads as over rather than as full.

##### `37a` — State library · table page

- **Applies to:** Every page whose work surface is a table — 24 of the 37.
- **Error:** Leads with the state of the user’s data, not with the failure. Offers offline working, because the planner is offline-first. Reference code is selectable, small, last.
- **Loading:** Skeleton rows in the table’s own geometry with a fading ramp, plus the count being fetched. Never a spinner in a blank rectangle.
- **Two empties:** “Nothing yet” teaches and offers the import path. “No match” states how many records exist and what the filter is doing, and offers to clear it. Conflating them is the most common empty-state failure.

##### `37b` — State library · the other three archetypes

- **Canvas pages:** 2 pages. Empty offers the venue’s own plan before offering blank, because starting from blank is the slower path.
- **Coverage:** 4 archetypes × 4 states covers all 37 pages. Per-page copy lives in the list beside this batch rather than as 148 separate drawings.
- **First run:** One sequence, four steps, never blocking. It disappears when complete and does not return.
- **Form pages:** 2 pages. First run marks the six fields that change other pages, and states what renders until they are set (an em dash, never a zero).
- **Reference pages:** 3 pages. An empty one is a writing task; the rail keeps its table of contents so the intended shape stays visible.

##### `37c` — Per-page empty-state copy

- **Purpose:** The copy deck Cursor reads when implementing an empty state. Archetype gives the layout; this gives the words.
- **Actions:** Where import is the faster path it is offered second but named. Where records are derived, the action points at the owning page instead.
- **Excluded:** Seven derived or reference pages cannot be independently empty; they inherit the empty state of their source.
- **Rule:** No empty state says “nothing here” and stops. Each body sentence states the page’s dependency — what has to exist before this page can fill.

##### `34a` — Command palette · ⌘K

- **Purpose:** Keyboard-first navigation and action running. Opens on ⌘K from anywhere, including inside a drawer.
- **Empty state:** Never blank. With nothing typed it shows the four most-used pages and a derived “needs you” group, so the palette teaches the app.
- **Keys:** ↑↓ navigate · ↵ open · ⌘↵ open in the drawer without leaving the page · esc close. Shown in the footer at all times.
- **Result groups:** Actions · Records · Recent. Actions rank above records because they resolve intent in one keystroke; records rank by page relevance, not alphabetically.
- **Rule:** Every count in a result row is live and derived. The palette never shows a stale cached label.

##### `34b` — Filter builder

- **Purpose:** Building the non-obvious filters: the ones with an or inside an and.
- **Match count:** Shown before applying. A filter that would return zero says so here rather than emptying the table first.
- **Plain-English restatement:** Always visible, always below the builder, regenerated live. It is the honesty check on the logic.
- **Saving:** A built filter can be saved into the rail as a view — that is the only way rail views are created.
- **Structure:** Flat conditions join with and. A nested group joins internally with or (or and) and joins outward as one unit — the indentation is the parenthesis.

##### `34c` — Saved views · management

- **Purpose:** Managing what appears in the 224px rail, per page and per person.
- **Creation path:** Views are only ever created from the filter builder, so every view can be read back as a sentence.
- **Personal, not global:** Rail order is per viewer. It never travels in a share packet or a backup, matching the viewer-preferences rule in §17.
- **Three groups:** Pinned to the rail · Not pinned · Shared with you. A shared view is read-only until duplicated, so nobody silently rewrites a colleague’s list.
- **Unsaved changes:** A modified view shows an amber chip in the toolbar until resolved. Three explicit choices, no default — silently overwriting a saved view is the worst outcome.

##### `34d` — Bulk edit

- **Purpose:** Applying the same change to a selection without leaving the table.
- **Conflict handling:** Rows that already hold a value are named and skipped by default. Overwriting requires unticking the box.
- **Downstream statement:** What the edit will and will not change elsewhere, stated before applying — and the “will not” half matters as much.
- **Selection is shown:** The affected records are listed, not just counted. A count alone is not consent.
- **Undo:** Applies as one history entry, reversible with a single ⌘Z and shown as one line in Planner History.

##### `35a` — Import · field mapping

- **Purpose:** Bringing a spreadsheet in without destroying what is already there. Most planners start in a spreadsheet.
- **Conflicts:** Same name with a different email goes to a review step rather than being merged or duplicated automatically.
- **Pre-flight counts:** Create, match, conflict, skip, and “existing rows not in this file”. Import never deletes; that last line states it.
- **Unmapped columns:** Shown, not hidden. A column with no destination says why — either no field exists, or the planner owns that data and will not take it from a file.
- **Value mapping:** Columns whose values need translating (B/G → Bride/Groom, Y/N → yes/no) are chipped amber and expand to a value map.

##### `35b` — Keyboard shortcuts · ?

- **Purpose:** Making the app fast for the person who uses it daily — the planner, not the couple.
- **Consistency rule:** No page-specific shortcuts. Stated on the sheet itself so the constraint survives future pages.
- **Discovery:** ? is shown in the avatar menu and in the empty command palette, since a shortcut sheet nobody finds is a shortcut sheet that does not exist.
- **Three contexts:** Everywhere · In a table · In a drawer. Context is where the key applies, not which page you are on.

##### `35c` — Notification centre

- **Purpose:** Surfacing derived urgency — expiries, blockers, deadlines with dependencies.
- **Derived, not queued:** Every entry is recomputed from records. Dismissing a “needs you” item is impossible; fixing the record clears it.
- **Placement:** Behind the bell in the top bar. Count badge shows the “needs you” number only.
- **The quiet list:** What the system will not alert on is stated in the panel. It is the design commitment that keeps this list at three items rather than thirty.
- **Two groups:** Needs you (derived, actionable) and Changed since you last looked (activity by other people). Never blended.

##### `35d` — Share dialog

- **Purpose:** Sharing one page with one recipient, without building a full packet.
- **Expiry:** Every share carries an expiry, defaulting to four days after the wedding. A permanent share is not offered.
- **Honest revocation:** Revoking kills the link, not the PDF someone downloaded. Said plainly rather than implied.
- **Live, not a copy:** The link projects live records. Stated explicitly, because the mental model people bring from email attachments is wrong here.
- **See / Never:** Both stated as chips. The Never list is fixed — there is no control to include budget, guest names or Covenant records.

##### `36a` — Undo, validation, offline and save states

- **Offline:** An amber banner, not an error. The planner is offline-first by design — the day-of pack exists because venues have no signal.
- **Save states:** Four states on one dot in the top bar. “Saved” only after the write lands; never optimistic.
- **Undo toast:** States the change and its derived consequence, with the keyboard shortcut on the toast. Bulk actions undo as one entry.
- **Validation:** Keeps the invalid value in the field, disables save, explains the consequence in human terms, and offers the two real fixes.

##### `36b` — Templates, trash and duplicate merge

- **Merge:** Field-by-field comparison, explicit keep decisions, and the discarded values written into the merged record’s history so a merge is reversible in evidence if not in one click.
- **Templates:** Shapes, not values. A template creates the child structure with empty amounts and never invents a figure.
- **Trash:** 30 days, with children restored alongside their parent. Restoring into a missing parent is impossible rather than orphaning a row.
- **Where they appear:** Templates from any + Add. Trash from the avatar menu. Merge from the duplicate warning on Guest List and Contacts.

#### Part · Section tabs

*Section tabs does not apply on this page.* the page’s own tab strip (omit when this part is absent — those options live in the view switcher, not as sections) Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Record drawer tabs

*Record drawer tabs does not apply on this page.* one drawing per tab of every record this page opens Do not invent a tab strip, extra views, or extra drawers to fill the slot.

#### Part · Night theme

*the same surfaces in dark mode*

Drawings:
- Role views · planner, couple, vendor · night
- 1024px · rail collapses, drawer overlays · night
- Mobile · table becomes cards, drawer becomes a screen, rail becomes a sheet · night
- Day-of mode · the phone in a corridor · night
- Table depth · field types, rollups, summary bar, row actions · night
- Drawer depth · related lists, comments, activity, provenance · night
- Stat strip depth · deltas, sparklines, target lines, attention · night
- State library · table page · night
- State library · the other three archetypes · night
- Per-page empty-state copy · night
- Command palette · ⌘K · night
- Filter builder · night
- Saved views · management · night
- Bulk edit · night
- Import · field mapping · night
- Keyboard shortcuts · ? · night
- Notification centre · night
- Share dialog · night
- Undo, validation, offline and save states · night
- Templates, trash and duplicate merge · night

Night theme is the same page and views in dark surfaces. Do not block a section on night theme; match light first, then reuse tokens.

---

## End of pass

42 sections. After 08–42 each land and are reviewed, this file remains the checklist for later gap passes. Source: `Planner Screens Master.dc.html`.
