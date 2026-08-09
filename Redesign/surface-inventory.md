# Covenant Wedding Planner — Complete surface inventory

Extracted from Redesign mock docs (HTML stripped via Python). Badge IDs preserved. Anatomy from Build notes when available.

Type legend: `page` · `view` · `drawer` · `tab` · `system` · `portal` · `settings pane`

## 1. `Planner Screens All.dc.html` — every screen (51)

| ID | Title | Type | Key anatomy |
|---|---|---|---|
| **21a** | Guest List · Table | view | View switcher: Table/Households/Seating · Rail: All guests · Unconfirmed · No meal · Not invited · Needs address · Unseated · Thank-you pending · 6 of 24 columns · Drawer (catalog labels): Overview, Not, Invitation, Inv, Response, Identity, Contact, Party |
| **21b** | Guest List · Households | view | Same 142 guests → 62 households · same rail/switcher · Drawer labels: Overview, Not, Invitation, Inv, Identity, Response, Contact |
| **21c** | Guest List · Seating | view | Unseated queue + tables from Table Layout · same two fields · Drawer labels include Party, History |
| **20c** | Timeline & Tasks · Board | view | Same 59 tasks as 9a · Columns=status, swimlanes=phase · Drawer: Overview, Notes, Not, Con, Links, History |
| **20d** | Timeline & Tasks · Timeline | view | Phases as bands, tasks as bars · today + wedding rules · Drawer: Overview, Notes, Links, History, Not, Identity |
| **20a** | Appointments · Calendar | view | Views 14a named but never drew · two-week calendar not month · Drawer: Overview, Con, Not, History |
| **20b** | Appointments · Agenda | view | Reading/print target · Drawer: Overview, Con, History |
| **18a** | Newlywed Homecoming | page | Rail: Settling in · Name change · First month · Drawer: Overview, Sections, Not |
| **18b** | Planner History | page | No tab lit · from undo/redo or avatar · Rail: Everything · Guests · Budget & payments · Drawer: Overview, Not, Fields |
| **17a** | Essentials Checklist | page | View switcher: Checklist / By person / Print · Rail: Everything · Bride · Groom essentials · Drawer: Not, Overview, History |
| **17b** | Honeymoon & After | page | Six sections behind tab bar · Rail: Details & bookings · Itinerary · Packing · Drawer: Overview, Sections, Details, Not, Res, Con |
| **16a** | Viewer preferences · the avatar menu | system | Global chrome · undo/redo live in top bar (not here) · theme/display/shortcuts · Drawer labels in mock: Overview, Con, Par, Not |
| **15a** | Wedding Setup | page | Source of truth every page reads · Rail: The couple · The day · Money · Guests · Drawer: Overview, Notes, Sections, Res, Not, Contact, Con |
| **15b** | Get Started | page | Reference page · no stat strip/toolbar/bulk/drawer · rail = TOC |
| **15d** | Page-by-Page Guide | page | 31 entries · Expand all / Print · Drawer: Overview, Notes |
| **15c** | FAQ | page | Search + 6 categories + quick-answers aside (360px, not a drawer) · Rail: Everything · Saving & backups · … · Drawer labels: Overview, Notes, Sharing, Not, Contact |
| **14a** | Appointments | page | Feeds Smart Calendar · 9 appointments · Rail: All · Next 30 days · Needs · Drawer: Overview, Con, Res, History · Switcher names Calendar/Agenda (drawn as 20a/20b) |
| **14b** | Households | page | Derived view · no add-household · Rail: All · Invited · Fully replied · Drawer: Overview, Contact, Inv, Par, Invitation, History, Not |
| **14c** | Contacts | page | Derived guests+vendors with phones · Rail: Everyone · Day-of · Vendors · Drawer: Contact, Overview, Par, Con |
| **13a** | Vision & Foundation | page | Covenant serif/air · Rail: Our vision · Values · Scriptures · Drawer: Overview, Sections, Res, History |
| **13b** | Prayer Journal | page | Answer field closes entry · Rail: All · Answered · Still praying · Drawer: Overview, History |
| **13c** | Premarital Counseling | page | Completion derived from homework · Rail: All · Completed · Scheduled · Drawer: Overview, Not, Res, Con, Notes, History |
| **13d** | First-Month Rhythms | page | Cadence + streak not due dates · View switcher: Table / Cards / Year · Rail: All · Daily · Weekly · Monthly · Drawer: Overview, Res, History |
| **12a** | Notes | page | Pinned to records · Rail: All · Unpinned · Flagged · Mine · Drawer: Notes, Overview, Pin, Not, Con |
| **12b** | Share Packets | page | Link + expiry product · Rail: All · Live · Expired · Draft · Drawer: Overview, Res, Con, Par, Not, Sections, Contact |
| **12c** | Email Templates | page | Resolved preview + merge fields · Rail: All · Guests · Vendors · Wedding · Drawer: Overview, Audience, Merge fields, Fields, Res, Not |
| **12d** | Print Centre | page | Class A/B sort · Rail: Everything · Class A · Class B · Drawer: Overview, Contact, History, Con |
| **11a** | Ceremony & Reception | page | Duration-driven order of service · Rail: Both · Ceremony only · Reception · Drawer: Overview, Par, History |
| **11b** | Shot Lists | page | Four lists / two suppliers · Rail: All · Must have · Group · At risk · Drawer: Overview, Res, History |
| **11c** | Wedding Setup · earlier drawing | page | Superseded by **15a** · same rail anatomy |
| **11d** | Weekend Logistics | page | Fri/Sat/Sun schedule · Rail: Whole weekend · Friday · Saturday · Sunday · Drawer: Overview, Con |
| **10a** | Wedding Party | page | Guest records + 4 party fields · Rail: Everyone · Bride’s side · Groom’s side · Drawer: Overview, Contact, Not, History, Notes |
| **10b** | Gifts | page | Thank-you-centric · Rail: All · Thank-you due · Sent · Cash · Drawer: Overview, Contact, Not, Notes, History |
| **10c** | Contracts & Invoices | page | Payment schedule child panels · Rail: All · Signed · Awaiting · Drawer: Con, Overview, Inv |
| **10d** | Entertainment | page | Band/DJ/musicians + songs · Rail: Full set list · Must play · Do not play · Drawer: Overview, Con, Par, History, Notes |
| **9a** | Planning Timeline & Tasks | page | Origin screen · phase chips + progress · Drawer: Overview, Notes, Not, Links, History · Board/Timeline as 20c/20d |
| **6c** | Calendar · Week | view | Smart Calendar week geometry · Rail: Everything · August · Appointments · Payments · Drawer: Overview, Notes, Con |
| **6d** | Calendar · Agenda | view | List from today · skip empty days · Drawer: Overview, Notes, Con, Pin, Not, Links |
| **8a** | Table Layout | page | 15 tables as seat grids · Rail: All · Has free seats · Full · Unseated · Drawer: Overview, Not, Res, Notes, History |
| **8b** | Vision Board | page | Pins + palette + vendor/budget links · Rail: All pins · Linked to vendor · Drawer: Overview, Not, Pin, Links, History |
| **7a** | Catering & Menu | page | Owns Food/Cake/Drinks/Rentals budget lines · Rail: Full menu · Not yet chosen · Allergen · Drawer: Overview, Not, Con |
| **7b** | Database Hub | page | Backup/restore + ownership map · Rail: All tables · With records · Empty · Drawer: Overview, Res, Sharing, Links, Con, Not, Fields |
| **7c** | Database Hub · all tables | page | Raw 24 tables browser · Rail: guests · budget_items · … · Drawer: Overview, Res, Par, Not, Links, History |
| **6a** | Smart Calendar | page | Derived entries only · month · Rail: Everything · August · Appointments · Payments · Drawer: Not, Overview, Notes, Con, Res · Week/Agenda as 6c/6d |
| **6b** | Wedding Day Timeline | page | 14 events / 4 blocks · duration real · Rail: Full day · Vendor calls · Couple only · Drawer: Overview, Con, Not |
| **5a** | Guest · full editor window | system | All 24 fields / 5 groups / 3 columns · left rail switches records · tabs: Identity, Response, Contact, Invitation, Party, Not |
| **4a** | Budget — full page | page | By category / By vendor · Rail: All categories · Over target · Drawer: Not, Overview, Con |
| **4b** | Payments | page | Grouped by due month · gratuity columns · Drawer: Overview, Con, Not, Links, History, Inv |
| **4c** | Venue & Vendors | page | Tracker + Compare view · quote/deposit/balance/rating columns · Drawer: Overview, Not, Contact, Con |
| **3a** | Dashboard | page | Next best step primary · alerts list · day-of + budget/RSVP health · Drawer: Overview, Not, Con, Inv |
| **3b** | Guest List — full page | page | Earlier full guest page · superseded in depth by batch 21 · Drawer: Not |

### All.dc batch headers (newest first)

| Batch | Contents |
|---|---|
| **27** | drawer tabs · Documents, and the last five |
| **26** | drawer tabs · Covenant |
| **25** | drawer tabs · The Day |
| **24** | drawer tabs · Vendors |
| **23** | drawer tabs · People |
| **22** | drawer tabs · Money |
| **21** | Guest List in full (+ record editor) |
| **20** | Appointments Calendar/Agenda · Tasks Board/Timeline |
| **18** | Homecoming · Planner History |
| **17** | Essentials · Honeymoon |
| **16** | global chrome · Viewer preferences |
| **15** | Start Planning · Setup, Get Started, Guide, FAQ |
| **14** | Appointments · Households · Contacts |
| **13** | Covenant |
| **12** | Documents |
| **11** | The day · settings behind it |
| **10** | People, money, vendors who play |
| **8** | origin screen brought across |
| **7** | Calendar views |
| **6** | 2a system · final pair |
| **5** | 2a system |
| **4** | 2a system |
| **3** | Editors |
| **2** | 2a system |
| **1** | 2a system |

## 2. `Planner Screens Views.dc.html` — alternate views + furniture/system (73)

| ID | Title | Type | Batch | Key anatomy |
|---|---|---|---|---|
| **43a** | Role views · planner, couple, vendor | system | Batch 43 · role views | Planner: Full access except Covenant, which the couple grants explicitly and can revoke. Default is off. Saved views are hers alone. Couple: Everything the planner sees plus Covena |
| **41a** | 1024px · rail collapses, drawer overlays | system | Batch 41 · responsive | Breakpoint: 1240px. Above it the drawer sits beside the work surface; below it the drawer overlays. Rail: Collapses to 48px icons with the group menu behind ☰. Tapping an icon open |
| **42a** | Mobile · table becomes cards, drawer becomes a screen | system | Batch 42 · responsive / day-of | Breakpoint: 720px. Below it tables render as cards, the drawer becomes a full screen, and the rail becomes a bottom sheet. Table → cards: One card per record carrying the same fiel |
| **42b** | Day-of mode · the phone in a corridor | system | Batch 42 · responsive / day-of | Why it exists: On the day nobody edits records. They check the time, read the next cue, and phone somebody. Every other affordance is noise. Dark by default: Not the theme toggle — |
| **38a** | Table depth · field types, rollups, summary bar, row actions | system | Batch 38 · tables 1 screen | Field types: Every header carries a type glyph. Alignment follows type — numbers and currency right, tabular figures throughout. A person is an avatar, a checkbox is a mark, a link |
| **39a** | Drawer depth · related lists, comments, activity, provenance | system | Batch 39 · drawers 1 screen | Header: Avatar, status chips, three quick actions, breadcrumb, and prev/next carrying the record position. ⌥↑↓ moves between records without closing. Empty fields: “Add…” in pale t |
| **40a** | Stat strip depth · deltas, sparklines, target lines | system | Batch 40 · stat strips 1 screen | Delta: Change since a named moment, never a bare percentage. “↑6 since Monday” is auditable; “+12%” is not. Sparkline: Twelve weeks, last bar in forest. Only for figures that genui |
| **37a** | State library · table page | system | Batch 37 · state library | Applies to: Every page whose work surface is a table — 24 of the 37. Two empties: “Nothing yet” teaches and offers the import path. “No match” states how many records exist and wha |
| **37b** | State library · the other three archetypes | system | Batch 37 · state library | Reference pages: 3 pages. An empty one is a writing task; the rail keeps its table of contents so the intended shape stays visible. Form pages: 2 pages. First run marks the six fie |
| **37c** | Per-page empty-state copy | system | Batch 37 · state library | The copy deck Cursor reads when implementing an empty state |
| **34a** | Command palette · ⌘K | system | Batch 34 · finding and changing things 4 screens | Keyboard-first navigation and action running |
| **34b** | Filter builder | system | Batch 34 · finding and changing things | Building the non-obvious filters: the ones with an or inside an and |
| **34c** | Saved views · management | system | Batch 34 · finding and changing things | Managing what appears in the 224px rail, per page and per person |
| **34d** | Bulk edit | system | Batch 34 · finding and changing things | Applying the same change to a selection without leaving the table |
| **35a** | Import · field mapping | system | Batch 35 · getting data in and out 4 screens | Bringing a spreadsheet in without destroying what is already there |
| **35b** | Keyboard shortcuts · ? | system | Batch 35 · getting data in and out | Making the app fast for the person who uses it daily — the planner, not the couple |
| **35c** | Notification centre | system | Batch 35 · getting data in and out | Surfacing derived urgency — expiries, blockers, deadlines with dependencies |
| **35d** | Share dialog | system | Batch 35 · getting data in and out | Sharing one page with one recipient, without building a full packet |
| **36a** | Undo, validation, offline and save states | system | Batch 36 · the small states 2 screens | Undo toast: States the change and its derived consequence, with the keyboard shortcut on the toast. Bulk actions undo as one entry. Validation: Keeps the invalid value in the field |
| **36b** | Templates, trash and duplicate merge | system | Batch 36 · the small states | Templates: Shapes, not values. A template creates the child structure with empty amounts and never invents a figure. Trash: 30 days, with children restored alongside their parent.  |
| **33g** | 12d Print Centre · Day-of pack view | view | Batch 33 · continued | Assembling and printing the single physical pack the planner carries on the day |
| **33h** | 12d Print Centre · Preview view | view | Batch 33 · view switchers · Documents and Overview | Proofing the assembled pack page by page |
| **33i** | 15d Page-by-Page Guide · Table view | view | Batch 33 · view switchers · Documents and Overview | Orientation for a new user, and the reference a developer checks before duplicating a field |
| **33j** | 15d Page-by-Page Guide · Print view | view | Batch 33 · view switchers · Documents and Overview | A physical reference for a second person — a mother, a planner, a helper — who has to use the planner without being taught it |
| **33k** | 17a Essentials Checklist · By person view | view | Batch 33 · view switchers · Documents and Overview | Packing |
| **33l** | 17a Essentials Checklist · Print view | view | Batch 33 · view switchers · Documents and Overview | A sheet that goes into the bag it describes, so it can be checked without a screen at 6am |
| **33a** | 12a Notes · Cards view | view | Batch 33 · view switchers · Documents and Overview | Reading the loose knowledge of the wedding — the things that live in someone’s head and nowhere else |
| **33b** | 12a Notes · Timeline view | view | Batch 33 · view switchers · Documents and Overview | Reading the planning as it happened, and seeing which notes are ageing without resolution |
| **33c** | 12b Share Packets · Cards view | view | Batch 33 · view switchers · Documents and Overview | Managing outbound access |
| **33d** | 12b Share Packets · Activity view | view | Batch 33 · view switchers · Documents and Overview | Auditing access |
| **33e** | 12c Email Templates · Preview view | view | Batch 33 · view switchers · Documents and Overview | Proofing a send |
| **33f** | 12c Email Templates · Sent log view | view | Batch 33 · view switchers · Documents and Overview | Closing the loop on a send |
| **32a** | 13a Vision & Foundation · Edit view | view | Batch 32 · view switchers · Covenant | Composing the seven sections |
| **32b** | 13a Vision & Foundation · Print preview | view | Batch 32 · view switchers · Covenant | Proofing the keepsake before it prints or is bound |
| **32c** | 13b Prayer Journal · Table view | view | Batch 32 · view switchers · Covenant | Scanning the whole journal at once: what is open, what closed, and how long it took |
| **32d** | 13b Prayer Journal · Print preview | view | Batch 32 · view switchers · Covenant | Producing the keepsake volume — typically given at an anniversary rather than at the wedding |
| **32e** | 13c Premarital Counseling · Cards view | view | Batch 32 · view switchers · Covenant | Seeing progress through the programme and who owes what |
| **32f** | 13c Premarital Counseling · Calendar view | view | Batch 32 · view switchers · Covenant | Booking the remaining sessions without colliding with appointments already in the planner |
| **32g** | 13d First-Month Rhythms · Cards view | view | Batch 32 · view switchers · Covenant | Setting the rhythms before the wedding, when there is still attention to spare for them |
| **32h** | 13d First-Month Rhythms · Year view | view | Batch 32 · view switchers · Covenant | Deciding how long a rhythm is meant to last, which is the question the first-month framing avoids |
| **31a** | 6b Wedding Day Timeline · Ribbon view | view | Batch 31 · view switchers · The Day | Reading the day end to end |
| **31b** | 6b Wedding Day Timeline · By vendor view | view | Batch 31 · view switchers · The Day | Generating per-vendor call sheets, and finding obligations nobody owns |
| **31c** | 11a Ceremony & Reception · Programme view | view | Batch 31 · view switchers · The Day | Proofing the printed order of service and order of the evening before it goes to print |
| **31d** | 11a Ceremony & Reception · Script view | view | Batch 31 · view switchers · The Day | Writing and rehearsing |
| **31e** | 11d Weekend Logistics · Rooms view | view | Batch 31 · view switchers · The Day | Managing the block: what is held, claimed, releasing, and who still has nowhere to sleep |
| **31f** | 11d Weekend Logistics · Transport view | view | Batch 31 · view switchers · The Day | Seeing vehicle coverage as time, which is the only way a driver double-booking is visible |
| **31g** | 18a Newlywed Homecoming · Name change view | view | Batch 31 · view switchers · The Day | Sequencing a name change so nothing is attempted before its prerequisite exists |
| **31h** | 18a Newlywed Homecoming · Budget view | view | Batch 31 · view switchers · The Day | The after-the-day budget: small, real, and invisible in the wedding budget by design |
| **31i** | 18b Planner History · By record view | view | Batch 31 · view switchers · The Day | Auditing one record’s life |
| **31j** | 18b Planner History · Field detail view | view | Batch 31 · view switchers · The Day | Restoring a single value with the consequences stated before you commit |
| **30j** | 10d Entertainment · Performers view | view | Batch 30 · continued · Entertainment and Shot Lists | Managing performers as people with call times and technical needs, not as set-list entries |
| **30k** | 10d Entertainment · Timeline view | view | Batch 30 · view switchers · Money / Vendors | Checking that music covers the evening with no silent gaps and no double-booked stage |
| **30l** | 11b Shot Lists · Cards view | view | Batch 30 · view switchers · Money / Vendors | Briefing the photographer per phase, and exposing lists whose time budget does not work |
| **30m** | 11b Shot Lists · By window view | view | Batch 30 · view switchers · Money / Vendors | The photographer’s working order on the day |
| **30f** | 4c Venue & Vendors · Compare view | view | Batch 30 · continued · Vendors | Deciding between quotes |
| **30g** | 4c Venue & Vendors · Contacts view | view | Batch 30 · view switchers · Money / Vendors | Reaching a vendor, and deciding who belongs on the day-of contact sheet |
| **30h** | 7a Catering & Menu · Tasting notes view | view | Batch 30 · view switchers · Money / Vendors | The decision record behind the menu |
| **30i** | 7a Catering & Menu · Allergens view | view | Batch 30 · view switchers · Money / Vendors | Safety |
| **30a** | 4a Budget · By category view | view | Batch 30 · view switchers · Money | Category-level variance |
| **30b** | 4a Budget · Pledged & paid view | view | Batch 30 · view switchers · Money / Vendors | Tracking funding sources against spend |
| **30c** | 4b Payments · Calendar view | view | Batch 30 · view switchers · Money / Vendors | Cash-flow shape |
| **30d** | 10c Contracts & Invoices · Documents view | view | Batch 30 · view switchers · Money / Vendors | Document custody |
| **30e** | 10c Contracts & Invoices · Schedule view | view | Batch 30 · view switchers · Money / Vendors | Seeing the obligation curve |
| **29a** | 10a Wedding Party · Cards view | view | Batch 29 · view switchers · People | A scannable roster used while chasing attire and duties |
| **29b** | 10a Wedding Party · Duties view | view | Batch 29 · view switchers · People | Assign and audit duties by phase; the Unassigned column is the point of the view |
| **29c** | 8a Table Layout · List view | view | Batch 29 · view switchers · People | Auditing seat assignments, dietary spread and the unseated tail; the plan view is for arranging, this is for checking |
| **29d** | 8a Table Layout · By guest view | view | Batch 29 · view switchers · People | The single sheet the caterer and the place-card printer both work from |
| **29e** | 10b Gifts · Registry view | view | Batch 29 · view switchers · People | Managing the registry itself: what is claimed, what is bare, what to promote |
| **29f** | 10b Gifts · Notes view | view | Batch 29 · view switchers · People | Working the thank-you backlog |
| **hh-labels** | 14b Households · Labels view | view | Batch 28 · the view switchers, drawn | Print-ready mailing labels for save-the-dates and invitations, one label per household rather than per guest |
| **hh-cards** | 14b Households · Cards view | view | Batch 28 · the view switchers, drawn | A quick-scan grid of reply status, used while calling around before a deadline |
| **ct-dayof** | 14c Contacts · Day-of sheet view | view | Batch 28 · the view switchers, drawn | A reading document for the wedding day itself, not a working table — no checkboxes, no columns |
| **ct-cards** | 14c Contacts · Cards view | view | Batch 28 · the view switchers, drawn | Quick-scan card grid, same 47 contacts as Table view |

## 3. `Planner Screens Drawers.dc.html` — every drawer type + tabs (30)

| Page ID | Record type | Type | Batch | Tab strip |
|---|---|---|---|---|
| **12a** | Note | drawer | Batch 27 · drawer tabs · Documents, and the last five | Note · Pin · Sharing · History |
| **12b** | Share packet | drawer |  | Packet · Sections · Link · Activity |
| **12c** | Email template | drawer |  | Template · Fields · Audience · Sent log |
| **12d** | Printable | drawer |  | Document · Layout · Pack · History |
| **7b** | Hub table | drawer |  | Table · Fields · Links · Activity |
| **7c** | Hub row | drawer |  | Row · Links · Raw · History |
| **17a** | Essentials item | drawer |  | Item · Who & where · Note · History |
| **18a** | Name-change step | drawer |  | Institution · Documents · Dates · History |
| **18b** | History entry | drawer |  | Change · Record · Snapshot |
| **15a** | Setup field | drawer |  | Field · Impact · History |
| **13a** | Vision section | drawer | Batch 26 · drawer tabs · Covenant | Section · Wording · Print · History |
| **13b** | Prayer entry | drawer |  | Entry · Answer · Privacy · History |
| **13c** | Counseling session | drawer |  | Session · Homework · Notes · History |
| **13d** | Rhythm | drawer |  | Rhythm · Cadence · Streak · History |
| **11a** | Ceremony element | drawer | Batch 25 · drawer tabs · The Day | Element · Script · People · History |
| **11d** | Weekend movement | drawer |  | Movement · People · Transport · History |
| **14a** | Appointment | drawer |  | Appointment · Travel · Who · History |
| **17b** | Honeymoon booking | drawer |  | Booking · Cost · Documents · History |
| **6b** | Wedding day event | drawer |  | Event · People · Run sheet · History |
| **7a** | Menu item | drawer | Batch 24 · drawer tabs · Vendors | Item · Guests · Costing · History |
| **10d** | Song | drawer |  | Song · Moment · Performer · History |
| **11b** | Shot | drawer |  | Shot · People · Timing · History |
| **8b** | Vision pin | drawer |  | Pin · Colours · Links · History |
| **10a** | Wedding party member | drawer | Batch 23 · drawer tabs · People | Role · Attire · Duties · Contact · History |
| **8a** | Table | drawer |  | Table · Seats · Notes · History |
| **10b** | Gift | drawer |  | Gift · Giver · Thank-you · History |
| **14b** | Household | drawer |  | Guests · Address · Invitation · History |
| **14c** | Contact | drawer |  | Contact · Reaches · Day-of · Source |
| **4a** | Budget line item | drawer | Batch 22 · drawer tabs · Money | Line item · Category · Payment · History |
| **10c** | Contract | drawer |  | Contract · Payment · Documents · History |

### Each drawer tab

| Page ID | Record | Tab | Type | Build-note intro |
|---|---|---|---|---|
| 12a | Note | **Note** | tab | The text and its flag. This one explains a $1,000 gap between two budget totals. |
| 12a | Note | **Pin** | tab | Pinned to a vendor, so it shows in that drawer. Deleting the vendor leaves the note loose. |
| 12a | Note | **Sharing** | tab | Never in a share packet — sending this would quote the vendor against themselves. |
| 12a | Note | **History** | tab | The only record whose history is mostly conversation. |
| 12b | Share packet | **Packet** | tab | Live versus snapshot — the difference only matters after you edit, which is why the row states it. |
| 12b | Share packet | **Sections** | tab | Four of thirty. Withheld sections are greyed, not hidden, so you can see what you kept back. |
| 12b | Share packet | **Link** | tab | No passcode, and the tab says why that is acceptable here and not for the Budget. |
| 12b | Share packet | **Activity** | tab | Fourteen opens, one city, two browsers — a day-of packet should be opened repeatedly. |
| 12c | Email template | **Template** | tab | The letter. The planner writes it and logs the send; your mail client does the sending. |
| 12c | Email template | **Fields** | tab | Six merge fields, one blank — so this template cannot be sent until Wedding Setup is fixed. |
| 12c | Email template | **Audience** | tab | A query, not a list. It was 31 yesterday and three of them have no email at all. |
| 12c | Email template | **Sent log** | tab | Twenty-six sends, 31 still pending — evidence that email has stopped working on this group. |
| 12d | Printable | **Document** | tab | No print template exists. The page prints itself, because a template is a second copy that drifts. |
| 12d | Printable | **Layout** | tab | Class A never prints gold. Even from a share packet, the recipient gets the working document. |
| 12d | Printable | **Pack** | tab | Eleven documents as one job. Two blocked, so the pack refuses rather than printing gaps. |
| 12d | Printable | **History** | tab | Printed 26 July; the timeline has changed twice since. The paper copy is out of date. |
| 7b | Hub table | **Table** | tab | One owner page per table. The hub is a second way in, never a second copy. |
| 7b | Hub table | **Fields** | tab | Twenty-four fields, six of them enumerated — raw here, pills on the owner page. |
| 7b | Hub table | **Links** | tab | Four links out, and the six orphans pointing at a table that no longer exists. |
| 7b | Hub table | **Activity** | tab | Table-level, not row-level. A single row has its own History tab. |
| 7c | Hub row | **Row** | tab | Seven of twenty-four fields. The same record the Guest List edits, not a copy. |
| 7c | Hub row | **Links** | tab | A valid link pointing at an incomplete thing — the tab distinguishes those two failures. |
| 7c | Hub row | **Raw** | tab | Read-only JSON, so a developer can see the real field names before writing a migration. |
| 7c | Hub row | **History** | tab | The same history the Guest List shows, because it is the same record. |
| 17a | Essentials item | **Item** | tab | Ready means bought and in a kit. Both columns must be true, so 28 bought is not 28 ready. |
| 17a | Essentials item | **Who & where** | tab | The only object in the planner whose absence stops the day. |
| 17a | Essentials item | **Note** | tab | A self-contradicting note nobody has corrected — which is exactly what a note is for. |
| 17a | Essentials item | **History** | tab | Marked in the bag, but not collected. A checklist can be truthful and still wrong. |
| 18a | Name-change step | **Institution** | tab | First in the order because every other institution waits on it. |
| 18a | Name-change step | **Documents** | tab | The registry needs the document it makes — the certificate the ceremony produces. |
| 18a | Name-change step | **Dates** | tab | Nothing can be filled before 9 November. Submitted-but-not-confirmed is the state to chase. |
| 18a | Name-change step | **History** | tab | One entry. A short history here means the plan has not started, not that nothing was logged. |
| 18b | History entry | **Change** | tab | Three edits in three seconds are one entry. Grouped by time, because intent cannot be known. |
| 18b | History entry | **Record** | tab | Names the record rather than copying it — so the entry survives the record being deleted. |
| 18b | History entry | **Snapshot** | tab | Undo is not per-field. It rolls the whole planner back, and says what else would move. |
| 15a | Setup field | **Field** | tab | The one setup field that feeds the most pages, and the only one whose edit confirms first. |
| 15a | Setup field | **Impact** | tab | A before-and-after list, approved as one change — so undo reverses all of it or none. |
| 15a | Setup field | **History** | tab | Two entries in five months. Sparseness here is the reassuring reading. |
| 13a | Vision section | **Section** | tab | Position and authorship, plus the two other Covenant pages that reference this value by id. |
| 13a | Vision section | **Wording** | tab | The one tab where prose is the record. It renders in Cormorant because it will print in Cormorant. |
| 13a | Vision section | **Print** | tab | A tab that exists only for Covenant records, because here the printed page is the deliverable. |
| 13a | Vision section | **History** | tab | Printing is logged — an edited keepsake means the paper copy is now wrong. |
| 13b | Prayer entry | **Entry** | tab | What was asked, and the fact that status is derived — an entry is answered when an answer exists. |
| 13b | Prayer entry | **Answer** | tab | Writing here marks it answered, moves it out of "Still praying" and changes the page stat. One field, three consequences. |
| 13b | Prayer entry | **Privacy** | tab | The only record type that cannot be shared at all. Facts, not toggles — privacy belongs to the type. |
| 13b | Prayer entry | **History** | tab | Two edits in twenty-four days. Here a sparse history is the point, not a gap. |
| 13c | Counseling session | **Session** | tab | Its own table, not an appointment record — so the Smart Calendar shows it without anything being entered twice. |
| 13c | Counseling session | **Homework** | tab | The page bar is derived from these two rows. No separate "complete" tick to fall out of step. |
| 13c | Counseling session | **Notes** | tab | Written after, not before. Class B prose because they print as one continuous record. |
| 13c | Counseling session | **History** | tab | Five of eight sessions still have no date, because the eight were created as a plan. |
| 13d | Rhythm | **Rhythm** | tab | The definition matters more than the field. A vague rhythm gets redefined until it is always kept. |
| 13d | Rhythm | **Cadence** | tab | Begins the day after the wedding and never touches the Timeline. Not wedding work. |
| 13d | Rhythm | **Streak** | tab | Counted, not scored. No target, no badge — the number exists so a slip is visible. |
| 13d | Rhythm | **History** | tab | Written in July, started in November. The gap is deliberate. |
| 11a | Ceremony element | **Element** | tab | Duration is the input; the start time is a consequence. Editing it moves everything after it. |
| 11a | Ceremony element | **Script** | tab | Nothing written yet, and the rehearsal is the only chance to hear it aloud. One deadline that cannot slip. |
| 11a | Ceremony element | **People** | tab | Three guest records — including the officiant, who is a guest but not a catering cover. |
| 11a | Ceremony element | **History** | tab | One typed minute, six derived changes, one log entry. |
| 11d | Weekend movement | **Movement** | tab | Friday and Saturday movements live only here. Sunday ones are mirrored on the Timeline. |
| 11d | Weekend movement | **People** | tab | Eleven arriving in three groups — and the clash: the owner is at the rehearsal when the last flight lands. |
| 11d | Weekend movement | **Transport** | tab | Two vehicles, three runs, one driver who leaves at 5pm. The second driver is not booked. |
| 11d | Weekend movement | **History** | tab | Today’s edit created the clash, and nothing warned — no check runs across movements and appointments. |
| 14a | Appointment | **Appointment** | tab | A tasting whose outcome is meant to decide the vegetarian main nine guests are waiting on. |
| 14a | Appointment | **Travel** | tab | A margin on the block, not a second event — and the reason the 5:00pm walkthrough cannot happen. |
| 14a | Appointment | **Who** | tab | Three attendees, and the one who should be there but is not: the planner, at the tasting that sets the menu. |
| 14a | Appointment | **History** | tab | Moving it one hour turned ninety minutes of slack into minus fifteen. |
| 17b | Honeymoon booking | **Booking** | tab | A flight tied to the wedding date, so the planner flags it if the date moves. |
| 17b | Honeymoon booking | **Cost** | tab | Non-refundable, 44% of the committed trip budget — the largest single exposure in either budget. |
| 17b | Honeymoon booking | **Documents** | tab | Two files held, two missing. Zanzibar checks yellow fever cards on arrival. |
| 17b | Honeymoon booking | **History** | tab | Separate from the wedding budget by design, but still real money spent. |
| 6b | Wedding day event | **Event** | tab | A block, not a list of cues. The cues are one tab across, and that is what gets printed. |
| 6b | Wedding day event | **People** | tab | Everyone resolves to a guest or vendor record, so the contact sheet is generated rather than typed. |
| 6b | Wedding day event | **Run sheet** | tab | Minute-level cues, and the one nobody owns: who presses play on cue 1. |
| 6b | Wedding day event | **History** | tab | Five extra minutes moved every block after it, logged as one change. |
| 7a | Menu item | **Item** | tab | A menu line with a headcount but no price — the only one the Budget cannot cost, and it says so. |
| 7a | Menu item | **Guests** | tab | Nine guests derived from the dietary field. Not editable here: a guest changing their meal changes this count. |
| 7a | Menu item | **Costing** | tab | What it would cost if priced, shown as an estimate. A projected figure never joins a committed total. |
| 7a | Menu item | **History** | tab | The serves count changed because a guest did, not because anyone typed it. |
| 10d | Song | **Song** | tab | The song itself, and what a must-play means: a promise, so the printed set list keeps it separate. |
| 10d | Song | **Moment** | tab | Where it sits on the day, and whether its length fits the block. Four songs have no moment at all. |
| 10d | Song | **Performer** | tab | Who plays it, and the one thing that could go wrong — unamplified kora in a room that has to carry. |
| 10d | Song | **History** | tab | Placing it created the timeline block. Unplacing removes it. |
| 11b | Shot | **Shot** | tab | The shot and its setting — including the thing the list itself would not catch: south-facing steps at 4:05pm. |
| 11b | Shot | **People** | tab | Six guest records, so a declined RSVP surfaces before the day. Two other shots are already at risk. |
| 11b | Shot | **Timing** | tab | Fourteen formals in twelve minutes is 51 seconds each. Third in the order, deliberately. |
| 11b | Shot | **History** | tab | Reordering inside a fixed window only changes who waits. |
| 8b | Vision pin | **Pin** | tab | The image and what it is attached to. Twelve of thirty-four pins are attached to nothing and are still just pictures. |
| 8b | Vision pin | **Colours** | tab | Three colours sampled, one off-palette — which becomes the wedding’s colour by accident if it reaches a vendor unapproved. |
| 8b | Vision pin | **Links** | tab | Sharing sends the image and the approved colours, not the note. The vendor sees what to make. |
| 8b | Vision pin | **History** | tab | Once shared, it cannot be un-shared. Changing it after means telling the vendor. |
| 10a | Wedding party member | **Role** | tab | What they are and where they sit — all of it read from the guest record. This page adds only what the guest table cannot hold. |
| 10a | Wedding party member | **Attire** | tab | Status, fitting and cost, against the group deadline. The cost is paid by the member, so it never reaches the Budget. |
| 10a | Wedding party member | **Duties** | tab | Three duties, two of them with times — so they also appear on the Timeline and the order of service. |
| 10a | Wedding party member | **Contact** | tab | How to reach her, plus the two things she needs that nobody has booked. |
| 10a | Wedding party member | **History** | tab | Only the four party fields. Name, side and table changes are logged on the guest record. |
| 8a | Table | **Table** | tab | The table as an object — capacity, shape, where it sits. Reducing capacity below the seated count refuses and names who it would displace. |
| 8a | Table | **Seats** | tab | Who is here, and one suggestion derived from the household. One seated guest is still Pending, which the tab says. |
| 8a | Table | **Notes** | tab | Constraints, not prose — and they print on the floor plan so the person setting the room sees them. |
| 8a | Table | **History** | tab | The capacity change that created two of the 24 unseated guests, still traceable. |
| 10b | Gift | **Gift** | tab | What it is and where it went. A cash gift can be earmarked, which is why the Budget venue row is $1,200 below the contract. |
| 10b | Gift | **Giver** | tab | A guest record, so the thank-you address comes from the household. Also the warning: the pledge and the gift are two records. |
| 10b | Gift | **Thank-you** | tab | The note itself and the wider count — 5 of 9 sent, with a three-week target. |
| 10b | Gift | **History** | tab | The earmarking on 16 July is what moved a Budget row, and it is reversible from here. |
| 14b | Household | **Guests** | tab | The four people inside the envelope, and the fact that this is a group rather than a record of its own. |
| 14b | Household | **Address** | tab | One address, four guests. The warning is the point: editing here rewrites all four. |
| 14b | Household | **Invitation** | tab | One envelope, four separate RSVPs — which is why the household reads "All replied" and the guests read four states. |
| 14b | Household | **History** | tab | Envelope events only. Guest-level changes are logged on each guest. |
| 14c | Contact | **Contact** | tab | The fields, and the honest statement that saving them writes to the vendor record underneath. |
| 14c | Contact | **Reaches** | tab | The escalation chain — what makes a contact sheet usable at 7am. Nobody above her, and the sheet says so. |
| 14c | Contact | **Day-of** | tab | Ordered by who you call first, not alphabetically. Twelve fit on one printed page. |
| 14c | Contact | **Source** | tab | Where the row comes from, and why this page cannot create one. |
| 4a | Budget line item | **Line item** | tab | The line itself — quantity, unit price, estimate against actual. The one tab where a number is typed rather than derived. |
| 4a | Budget line item | **Category** | tab | Which allowance this $265 sits inside, and the six other lines it competes with. Moving the category re-derives two totals. |
| 4a | Budget line item | **Payment** | tab | How it gets paid, and the warning that matters: $265 committed on a verbal quote with no contract behind it. |
| 4a | Budget line item | **History** | tab | Field-level, and it makes the derivation visible — the variance moved in the same edit that typed the actual. |
| 10c | Contract | **Contract** | tab | The signed terms, and what the money actually buys — the four things Grace Hall owes on the day. |
| 10c | Contract | **Payment** | tab | The exception in the whole planner: this contract has no schedule of its own. The tab explains where the instalments live instead of showing a blank o |
| 10c | Contract | **Documents** | tab | Three files attached, and two that are missing. A missing document is stated here rather than discovered when the venue asks. |
| 10c | Contract | **History** | tab | A contract total is authoritative money, so editing it re-derives three other pages and asks for confirmation first. |
---

## 4. `Planner Screens Gaps.dc.html` — batches 44–48

Intro count: 18 drawer tabs · 4 record types; 4 top-bar menus; 3 record editor windows; settings panes (14 nav entries / “eleven panes” + Help group).

### Batch 44 — four high-traffic drawers (18 tabs)

| ID / badge | Title | Type | Tabs | Key anatomy |
|---|---|---|---|---|
| **44-guest** | Guest drawer | drawer | Guest · Household · Seating · RSVP · History | 360px drawer; inherited address from household; seating writes back to Table Layout; History separates typed vs derived |
| **44-task** | Task drawer | drawer | Task · Depends on · People · History | Same IA as Task full editor (batch 46) |
| **44-payment** | Payment drawer | drawer | Payment · Contract · Method · History | Same IA as Payment full editor |
| **44-vendor** | Vendor drawer | drawer | Vendor · Contract · Schedule · Contacts · History | Same IA as Vendor full editor; portal scope on vendor |

#### Batch 44 tabs

| Drawer | Tab | Type | Note |
|---|---|---|---|
| Guest | **Guest** | tab | The person — place-card name, side, group, contact; address inherited from household |
| Guest | **Household** | tab | Addressable unit — one invitation/envelope; member list + seats held |
| Guest | **Seating** | tab | Table/seat placement; reads/writes Table Layout; keep-apart rules |
| Guest | **RSVP** | tab | Reply, meal, allergies, event attendance; meal locks before day |
| Guest | **History** | tab | Typed vs derived audit lines |
| Task | **Task** | tab | Title, area, owner, due, priority, status, effort, notes |
| Task | **Depends on** | tab | Blockers / blocks / critical path |
| Task | **People** | tab | People on the task |
| Task | **History** | tab | Change log |
| Payment | **Payment** | tab | Instalment amount, due, status, budget line |
| Payment | **Contract** | tab | Parent contract link |
| Payment | **Method** | tab | How it is paid |
| Payment | **History** | tab | Change log |
| Vendor | **Vendor** | tab | Business fields, category, service, capacity, status |
| Vendor | **Contract** | tab | Contract / documents |
| Vendor | **Schedule** | tab | Day obligations / schedule |
| Vendor | **Contacts** | tab | Day-of contacts |
| Vendor | **History** | tab | Change log |

### Batch 45 — top bar menus (4)

| ID / badge | Title | Type | Key anatomy |
|---|---|---|---|
| **45-avatar** | Avatar menu (open) | system | No gear icon. Groups: **This device** (Your profile & display → profile drawer; Switch to couple view; Day-of mode ⌥D); **The planner** (Settings ⌘,; Wedding setup; Backup & restore; Trash 30 days); **Help** (Keyboard shortcuts ?; Page-by-page guide; About & version); Close this planner |
| **45-search** | Search field (focused) | system | Finds nouns: Records first, Pages second; Actions escalate to ⌘K command palette. Not the palette itself |
| **45-undo** | Undo flyout | system | Named actor + time per step; derived effects undo with cause; link to Open Planner History |
| **45-help** | Help menu | system | Fixed: Get started, Page-by-page guide, FAQ, Keyboard shortcuts ?; **This page** (page-aware entries e.g. What Guest List is for / Why a count is derived); Report a problem; Version |

### Batch 46 — full record editors (3)

| ID / badge | Title | Type | Tabs (left rail) | Key anatomy |
|---|---|---|---|---|
| **46-task** | Task · full editor window | system | Task · Depends on · People · History | 1240px; same tabs/order as drawer; tabs as left rail; Prev/Next inherits page filter (“12 of 84”); consequence column |
| **46-vendor** | Vendor · full editor window | system | Vendor · Contract · Schedule · Contacts · History | Money block read-only (owned by contract); documents; portal access |
| **46-payment** | Payment · full editor window | system | Payment · Contract · Method · History | Same tabs as drawer; three-column layout |

### Batch 47 — Settings window panes

Nav groups from mock: **This device** · **The planner** · **This file** · **Help**. Guide §11.7: 14 panes. Section badge: “eleven panes” + separate Help panes group.

| ID / badge | Title | Type | Group | Key anatomy |
|---|---|---|---|---|
| **47-display** | Display & density | settings pane | This device | Row density Comfortable/Compact; derived figures in grey; currency display; date format; reduce motion; font size. Device-only — not in backup |
| **47-dayof** | Day-of mode | settings pane | This device | Arms mode (Views batch 42). Auto on at midnight wedding date; hides rail/filters/bulk/view switchers/forms; keep awake; large type; offline first; Rehearse it now |
| **47-notifications** | Notifications | settings pane | This device | What reaches notification centre (Views 35). Payment due, contract window, RSVP digest, task unblocked, vendor upload; no activity-feed edits; top bar only |
| **47-wedding-setup** | Wedding setup | settings pane | The planner | Pointer only — opens Wedding Setup page (15a), not a pane. Names/date/venue/guest target/tab labels/currency of record |
| **47-people-roles** | People & roles | settings pane | The planner | Who can open planner; Covenant grant/revoke; helpers money toggle; vendor scope locked on; row opens profile drawer (48) |
| **47-money-rules** | Money rules | settings pane | The planner | Contract total authoritative (locked); pledged as income vs cost offset; over-budget threshold; deposits as paid; joint-account free text; rounding |
| **47-documents** | Documents & printing | settings pane | The planner | Paper size; print derived grey; printed-on line; redact money on shared sheets; default packet recipient; upload storage path |
| **47-backup** | Backup & restore | settings pane | This file | Back up now; weekly reminder; include uploads; restore replaces file (old → Trash 30 days); plain SQLite portability |
| **47-import** | Import | settings pane | This file | Pointer to three-step mapper (Views 35a). Guests/tasks/payments; previous imports list; never overwrites silently |
| **47-trash** | Trash | settings pane | This file | Soft-deleted records; 30-day retain; emptying trash has no undo — only irreversible action stated as such |
| **47-about** | About | settings pane | This file | What the app is, where the file lives, what it does not do |
| **47-get-started** | Get started | settings pane | Help | Six-step checklist mid-task (same as All 15b page at reading width) |
| **47-guide** | Page-by-page guide | settings pane | Help | 37-page guide table: Page / Tab / Work surface / Owns |
| **47-faq** | FAQ | settings pane | Help | 12 questions in categories: Numbers / The file / Limits / Printing |

### Batch 48 — Profile drawer

| ID / badge | Title | Type | Tabs | Key anatomy |
|---|---|---|---|---|
| **48-profile** | Profile drawer | drawer | Profile · Display · Alerts · Access | 360px person record; opens from avatar or People & roles row; Display = same six device controls as Settings → Display & density (one store, two doors); day-of mode arming on Display; depth varies for helper/vendor |

| Tab | Type | Note |
|---|---|---|
| **Profile** | tab | Identity, reaching them, printed-pack inclusion |
| **Display** | tab | Density, derived grey, reduce motion, font size, currency, dates; day-of mode controls |
| **Alerts** | tab | Per-person interruptions + quiet hours; unread private to person |
| **Access** | tab | What they can reach; Covenant grant; audit; revoke |

---

## 5. `Planner Vendor Portal.dc.html` — portal screens (7)

Chrome tabs (every portal screen): **Your brief** · **Your schedule** · **Your paperwork** · **Upload**. Provenance banner on each: who shared, expiry, live records not a copy. Rule: counts without names.

| ID | Title | Type | Key anatomy (Build notes) |
|---|---|---|---|
| **V1** | Your brief | portal | Landing tab. Counts never names; derived times from Wedding Day Timeline; You owe us; two day-of numbers (planner + venue) only |
| **V2** | Your schedule | portal | Their window only on a clock; hatch for load-in/clear-down; dependencies that cut both ways |
| **V3** | Your paperwork | portal | One contract + child instalments + invoices; instalments derived; nothing of other vendors reachable |
| **V4** | Upload | portal | Outstanding uploads; overdue vs scheduled distinction; keeps relationship civil |
| **V5** | Mobile, and the expired link | portal | Mobile primary layout + expired-link end state; tabs scroll never collapse; next obligation + overdue + call |
| **V6** | The scope contract | system | Fifteen scope rules — security model not settings; ✕ rows absent from query |
| **V7** | Access lifecycle | system | Five steps packet→expiry; no login (token in link); no content picker — scope contract chooses contents |

### Portal tabs

| Tab | Type | Screen |
|---|---|---|
| **Your brief** | tab | V1 |
| **Your schedule** | tab | V2 |
| **Your paperwork** | tab | V3 |
| **Upload** | tab | V4 |
---

## 6. `CURSOR-IMPLEMENTATION-GUIDE.md` §3 page inventory

### All.dc — base state of each page (by tab)

| Tab | Pages (base screen) | Type |
|---|---|---|
| **Overview** | Dashboard · Get Started · Page-by-Page Guide · FAQ · Wedding Setup · Essentials Checklist · Notes · Viewer preferences | page |
| **Planning** | Timeline & Tasks · Appointments · Smart Calendar · Database Hub | page |
| **People** | Guest List · Households · Contacts · Wedding Party · Table Layout · Gifts | page |
| **Money** | Budget · Payments · Contracts & Invoices | page |
| **Vendors** | Venue & Vendors · Venue Comparison · Catering & Menu · Entertainment · Shot Lists | page |
| **The Day** | Wedding Day Timeline · Ceremony & Reception · Weekend Logistics · Newlywed Homecoming · Planner History | page |
| **Covenant** | Vision & Foundation · Prayer Journal · Premarital Counseling · First-Month Rhythms | page |
| **Documents** | Share Packets · Email Templates · Print Centre · Vision Board | page |

### Views.dc — batch map

| Batch | Contents | Applies to | Type |
|---|---|---|---|
| **43** | Role views — planner, couple, vendor | Whole app | system |
| **41–42** | Responsive: 1024px, mobile, day-of mode | Whole app | system |
| **38–40** | Depth: tables, drawers, stat strips | Whole app | system |
| **37** | State library — empty, loading, error, first run + per-page copy | Whole app | system |
| **34–36** | Furniture: ⌘K, filter builder, saved views, bulk edit, import, shortcuts, notifications, share, small states, templates/trash/merge | Whole app | system |
| **33** | Notes, Share Packets, Email Templates, Print Centre, Guide, Essentials — 12 views | Documents, Overview | view |
| **32** | Vision, Prayer, Counseling, Rhythms — 8 views | Covenant | view |
| **31** | Wedding Day Timeline, Ceremony, Logistics, Homecoming, History — 10 views | The Day | view |
| **30** | Budget, Payments, Contracts, Vendors, Catering, Entertainment, Shot Lists — 14 views | Money, Vendors | view |
| **29** | Wedding Party, Table Layout, Gifts — 6 views | People | view |
| **28** | Households, Contacts — 4 views | People | view |

---

## 7. Guide §11.7 — remaining page queue (status)

Playbook notes queue complete for live TABS + cross-cutting Responsive / Roles / Vendor Portal. Gaps 44–48 marked complete. Next: depth/state/furniture gap passes (34–40).

### People

| Status | Sub-page | Panel key | All.dc / notes | Type |
|---|---|---|---|---|
| ✓ | Guest List | `guests` | Batch 21 · guest shell | page |
| ✓ | Households | `households` | All **14b** · Views **28** · derived · `js/households-redesign.js` | page |
| ✓ | Contacts | `contacts` | All **14c** · Views **28** · derived · `js/contacts-redesign.js` | page |
| ✓ | Wedding Party | `party` | All **10a** · `js/party-redesign.js` | page |
| ✓ | Table Layout | `tables` | All **8a** · `js/tables-redesign.js` | page |
| ✓ | Gifts | `gifts` | All **10b** · `js/gifts-redesign.js` | page |

### The Day

| Status | Sub-page | Panel key | All.dc | Type |
|---|---|---|---|---|
| ✓ | Wedding Day Timeline | `timeline` | All **6b** · Views `#31a`/`#31b` · `js/timeline-redesign.js` | page |
| ✓ | Ceremony & Reception | `ceremony` | All **11a** · Views `#31c`/`#31d` · `js/ceremony-redesign.js` | page |
| ✓ | Weekend Logistics | `logistics` | Moved under The Day per §3 IA | page |
| ✓ | Newlywed Homecoming | `homecoming` | Views **31** · `js/homecoming-redesign.js` | page |
| ✓ | Honeymoon & After | `honeymoon` | All **17b** · Dark rail · `js/honeymoon-redesign.js` | page |

### Covenant

| Status | Sub-page | Panel key | All.dc | Type |
|---|---|---|---|---|
| ✓ | Vision & Foundation | `vision` | All **13a** · Views **32** · `js/vision-redesign.js` | page |
| ✓ | Prayer Journal | `prayer` | All **13b** · Views `#32c`/`#32d` · `js/prayer-redesign.js` | page |
| ✓ | Premarital Counseling | `counseling` | All **13c** · Views `#32e`/`#32f` · `js/counseling-redesign.js` | page |
| ✓ | First-Month Rhythms | `firstmonth` | All **13d** · Views **32** · `js/firstmonth-redesign.js` | page |

### Documents

| Status | Sub-page | Panel key | All.dc | Type |
|---|---|---|---|---|
| ✓ | Share Packets | `packets` | All **12b** · Views Cards/Activity · `js/packets-redesign.js` | page |
| ✓ | Email Templates | `emails` | All **12c** · Views Preview/Sent log · `js/emails-redesign.js` | page |
| ✓ | Print Centre | `print-centre` | All **12d** · Views **33** · `js/print-centre-redesign.js` | page |
| ✓ | Vision Board | `mood` | All **8b** · Dark rail · `js/mood-redesign.js` | page |
| ✓ | Essentials Checklist | `essentials` | All **17a** · Views By person/Print · `js/essentials-redesign.js` | page |

### Planning

| Status | Sub-page | Panel key | All.dc | Type |
|---|---|---|---|---|
| ✓ | Timeline & Tasks | `tasks` | existing | page |
| ✓ | Smart Calendar | `calendar` | existing | page |
| ✓ | Appointments | `appointments` | existing | page |
| ✓ | Database Hub | `data-hub` | All **7b** / **7c** · `js/data-hub-redesign.js` | page |

### Gaps 44–48 (guide status: complete)

| Batch | What | Implementation | Type |
|---|---|---|---|
| **44** | Guest / Task / Payment / Vendor drawers (18 tabs) | `planner.js` guest tabs · `redesign-shell.js` Task · `payments-redesign.js` · `vendors-redesign.js` | drawer |
| **45** | Avatar menu · search · undo flyout · help | `js/gaps-redesign.js` (gear retired) | system |
| **46** | Full editors for Task / Vendor / Payment | Same tab IA as drawers in `render*RecordEditor` | system |
| **47** | Settings window · 14 panes | `openSettingsWindow(paneId)` | system |
| **48** | Profile drawer · Profile / Display / Alerts / Access | `#profile-drawer` retabbed; device prefs shared with Settings | drawer |

**Also marked complete in §11.7:** Vendors / Money / Overview / Cross-cutting (venue→shotlist, budget→contracts, dashboard+notes, Responsive **41–42**, Roles **43a**, Vendor Portal V1–V5).

---

## 8. Covenant Design Spec — named chrome that must exist

Sources: `covenant-design-spec.md` + `Covenant Design Spec.dc.html` (§06–§07, §11, §16–§17).

| Component | Type | Spec notes |
|---|---|---|
| **Top bar (52px)** | system | Wordmark (Cormorant) · couple switcher · search (⌘K) · undo/redo icons · save state · alerts · avatar/account. Nothing else. No gear icon. |
| **Command palette (⌘K)** | system | Receives Database Hub jump, Backup/Restore, CSV, Print, Undo/Redo routing, Auto-fit moved out of top bar into per-table toolbar. |
| **Search field** | system | Top-bar search; distinct from palette in Gaps 45 (nouns vs verbs). |
| **Tab strip (8 tabs)** | system | Overview · Planning · People · Money · Vendors · The Day · Covenant · Documents (Docs). |
| **Sub-nav** | system | ≤6 pages per tab; only per-page variable with lit tab. |
| **Working rail (224px)** | system | Saved views, phase progress, grouping — never duplicated stats. Replaces 288px context sidebar. |
| **Page header** | system | Title + primary/secondary actions (§12 button order). |
| **Stat strip** | system | Page meters; depth in Views 40a. |
| **Toolbar** | system | Filters/chips; Columns · Auto-fit · Row height on table/matrix only; view switcher right of toolbar. |
| **Bulk bar** | system | Appears when rows selected. |
| **Work surface** | system | One of 11 shapes; content-sized shell — never pinned height. |
| **Record drawer (360px)** | drawer | Border not shadow; tabs by field group; row-open highlight reserved; Full editor footer. |
| **Full editor pop-out** | system | §16 — for records too large for drawer; list stays available via prev/next. |
| **Avatar / viewer preferences menu** | system | §17 / All **16a** / Gaps **45** — theme, font/display, Preview Mode, focus presets, shortcuts, backup link. Test: changes nothing a share-packet recipient would see. |
| **Planner History (no tab)** | page | Reached from undo/redo + avatar menu only; tab strip unlit. |
| **Start Planning outsides** | page | Get Started, FAQ, Page-by-Page Guide, Wedding Setup — outside normal browse tabs, from help/setup. |
| **Day-of mode** | system | Spec + Gaps 47 + Views 42b — editing suppressed, rail gone, run sheet primary. |
| **Density / row height** | system | Compact / Default / Tall (or Comfortable/Compact in settings); persists per table per profile. |
| **Notifications / alerts** | system | Top-bar alerts; centre in Views 35c; rules in Settings Notifications. |
| **Trash** | system | Avatar menu + Settings This file; 30-day soft delete; empty = irreversible. |
| **Print (Class A / Class B)** | system | From page itself; screen chrome hides; Print Centre page collects pack. |
| **Share packets / vendor scope** | system | §23 companion; Covenant never in share/export/vendor view. |
| **Dark mode** | system | §15 ramp; same screens in Planner Screens Dark. |

### Spec appendix page inventory (named pages — note: some badge IDs are stale vs All.dc)

| Tab | Page | Screen ID (spec appendix) | Type |
|---|---|---|---|
| Overview | Dashboard | 3a | page |
| Overview | Notes | 12a | page |
| Planning | Timeline & Tasks | 9a | page |
| Planning | Smart Calendar | 6a, 6c, 6d | page |
| Planning | Appointments | 6b †stale — live All uses 14a/20a/20b; 6b is Wedding Day Timeline | page |
| Planning | Weekend Logistics | 11d †moved to The Day in guide §3 | page |
| People | Guest List | 3b (canonical later 21a) | page |
| People | Households † | 4b †stale — live All **14b** | page |
| People | Contacts † | 4c †stale — live All **14c**; 4c is Venue & Vendors | page |
| People | Wedding Party | 10a | page |
| People | Table Layout | 8a | page |
| People | Gifts | 10b | page |
| Money | Budget | 4a | page |
| Money | Payments | 5a-adjacent †stale — live All **4b**; 5a is Guest full editor | page |
| Money | Contracts & Invoices | 10c | page |
| Vendors | Venue & Vendors | 8b †stale — live All **4c**; 8b is Vision Board | page |
| Vendors | Catering & Menu | 7a | page |
| Vendors | Entertainment | 10d | page |
| Vendors | Shot Lists | 11b | page |
| The Day | Wedding Day Timeline | 6b | page |
| The Day | Ceremony & Reception | 11a | page |
| The Day | Honeymoon & After | 17b | page |
| Covenant | Vision & Foundation | 13a | page |
| Covenant | Prayer Journal | 13b | page |
| Covenant | Premarital Counseling | 13c | page |
| Covenant | First-Month Rhythms | 13d | page |
| Covenant | Newlywed Homecoming | 18a †guide places under The Day | page |
| Documents | Vision Board | 8b-adjacent | page |
| Documents | Essentials Checklist | 17a | page |
| Documents | Share Packets | 12b | page |
| Documents | Email Templates | 12c | page |
| Documents | Print Centre † | 12d | page |
| Documents | Database Hub | 7b, 7c †guide places under Planning | page |
| No tab | Planner History | 18b | page |
| No tab | Get Started | 15b | page |
| No tab | FAQ | 15c | page |
| No tab | Page-by-Page Guide | 15d | page |
| No tab | Wedding Setup | 11c, 15a | page |
| No tab | Viewer preferences | 16a | page |

---

## 9. Counts

| Source | Surfaces |
|---|---|
| All.dc screens (id anchors) | **51** |
| Views.dc screens (id anchors) | **73** |
| Drawers.dc record types | **30** (≈119 tab mocks) |
| Drawers.dc unique tab strips | **30** tab IAs |
| Gaps 44 drawers | **4** (18 tabs) |
| Gaps 45 top-bar menus | **4** |
| Gaps 46 full editors | **3** |
| Gaps 47 settings panes | **14** |
| Gaps 48 profile drawer | **1** (4 tabs) |
| Vendor Portal | **7** (4 tabs + mobile/expiry + scope + lifecycle) |
| Guide §3 base pages (unique names) | **37+** across 8 tabs |
| Design Spec chrome components (named) | **23** in table above |

### Notes on completeness

- All.dc catalog “Drawer tabs seen” labels are often **truncated mock labels** (e.g. Not, Inv, Con, Par). Prefer Drawers.dc + Gaps 44 for canonical tab names.
- Guest drawer IA in Gaps **44** (Guest · Household · Seating · RSVP · History) supersedes earlier truncated Overview/Invitation strips on All **21a**.
- Spec appendix badge IDs for some pages are historical; **All.dc badges + Guide §3 IA** are the implementation source of truth.
- Venue Comparison is named in Guide §3 Vendors row; Compare view is Views **30f**.