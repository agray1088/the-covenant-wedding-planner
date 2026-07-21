# Regression Audit — Strategy Roadmap Build

## 2026-07-14 - Phase B Exit Review: Static Gate

**Scope:** Static closeout checks after the final Launch tracker conversion.

| Item | Status | Notes |
|------|--------|-------|
| JavaScript syntax | **PASS** | `node --check` passed for `js/planner.js`. |
| System consistency | **PASS** | `check-system-consistency.js` passed, including registry, shared editor, read-only preview, and rebundle contract checks. |
| Registry coverage guard | **PASS** | The checker now verifies every navigation page maps to a registry entry and every CWP table descriptor declares explicit bulk behavior. |
| Customer bundle isolation | **PASS** | Customer HTML contains none of `developer-mode`, `dev-only`, `panel-ui-system`, `DEV-ONLY-START`, or `DEV-ONLY-END`. |
| Launch registry | **PASS** | No registry entries remain marked `in_progress`. |
| Enhancement authorization | **OPEN** | Enhancement work remains gated on product-owner sign-off. |

## 2026-07-14 - Phase B Exit Review: Core Functional Smoke

**Scope:** Live-browser navigation and containment smoke across the core customer workflow pages.

| Item | Status | Notes |
|------|--------|-------|
| Core page navigation | **PASS** | Setup, Dashboard, Guest List, Budget, Payments, Vendors, Contracts, Ceremony & Reception, Smart Calendar, Notes, and Prayer Journal each opened from planner search and resolved to the expected active panel. |
| Page containment | **PASS** | Each smoke-tested page reported no document-level horizontal overflow. |
| Remaining functional QA | **OPEN** | Backup/restore, export/print, bulk mutation persistence, shared status behavior, and responsive-device checks remain to be exercised before the full program gate closes. |

## 2026-07-14 - Phase B Exit Review: Export / Print and Responsive Sample

**Scope:** Live-browser control smoke for the current Prayer Journal surface, plus responsive containment at representative viewport sizes.

| Item | Status | Notes |
|------|--------|-------|
| Export CSV control | **PASS** | The visible Prayer Journal Export CSV action is present and enabled; no download was triggered during this control-only smoke. |
| Print Section control | **PASS** | The visible Prayer Journal Print Section action is present and enabled; invoking the action left the planner stable and the document contained no horizontal overflow. Generated print-output verification remains open. |
| Hub control surface | **PASS** | The live People Database Hub exposes shared Auto-fit columns, View all, Delete Selected, and Apply controls; no mutation was performed during this inspection. |
| CSV blob lifecycle | **PASS** | CSV exporters now retain their object URLs briefly after the anchor click before revocation, improving reliability for browser download handling. The in-app browser did not expose a download event for blob URLs, so file-content inspection remains an environment-limited follow-up. |
| Responsive representative sample | **PASS** | Prayer Journal remained within the document viewport at 1440x900, 1024x768, 768x1024, and 390x844; temporary viewport overrides were reset. |
| Full responsive / export-print gate | **OPEN** | Remaining pages still need broader visual sampling, and backup/restore plus generated CSV/print artifacts still need end-to-end verification. |

## 2026-07-14 - Phase B Batch 5 Final Smoke / Regression Gate

**Scope:** Final live-browser smoke across the completed Batch 5 surfaces, including tracker editor/preview contracts, editorial exceptions, shared rails, containment, source checks, and customer rebundle verification.

| Item | Status | Notes |
|------|--------|-------|
| Completed Batch 5 surfaces | **PASS** | Prayer Journal, Counseling, Notes, Vision Board / Color Palette, Honeymoon / After, Get Started, and FAQ opened and rendered through the live browser. |
| Inline editor and preview contracts | **PASS** | Tracker pages exposed their inline editor and `.ro-preview` mounts; Honeymoon Details and Budget mounts were present; editorial Get Started and FAQ remained intentional exceptions. |
| Shared rails and containment | **PASS** | Key Batch 5 mounts were present and the live document reported no horizontal overflow. |
| Source validation | **PASS** | `node --check` and `check-system-consistency.js` passed after the Batch 5 changes. |
| Customer bundle | **PASS** | Rebundle script verification passed and the customer download was regenerated from the developer source. |
| Known non-blockers | **NOTE** | The local server continues to report the known WebAssembly MIME fallback and Statsig network noise; neither blocked the smoke pass. |

**Gate result:** Batch 5 completed-surface gate passed. Batch 6 then closed the last remaining Launch registry tracker, Gift Log.

## 2026-07-14 - Phase B Batch 6: Essentials Checklist

**Scope:** Essentials Checklist conversion from the legacy inline/Hub preview surface to the shared tracker contract.

| Item | Status | Notes |
|------|--------|-------|
| Inline editor | **PASS** | Checklist item editor is mounted on-page and supports the shared add/save/delete flow through the central record editor. |
| CWP preview | **PASS** | `#cwp-essentials.ro-preview` renders visible Category, Item, Packed, Assigned To, Location, and Notes headers with read-only row controls. |
| Toolbar and Hub controls | **PASS** | Live browser confirms Auto-fit and filter controls remain enabled, and the Design Hub CTA is present. |
| Packing workflow | **PASS** | Existing progress cards, category progress, starter checklist, and groom packing actions remain available. |
| Containment | **PASS** | Live Essentials document reports no horizontal overflow. |
| Registry | **PASS** | Essentials status is `standardized`; Gift Log is now the final Launch tracker marked `standardized`. |

## 2026-07-14 - Phase B Batch 6: Gift Log

**Scope:** Gift Log conversion from the legacy Hub preview surface to the shared tracker contract.

| Item | Status | Notes |
|------|--------|-------|
| Inline editor | **PASS** | Gift editor is mounted on-page and uses the shared add/save/delete flow through the central record editor. |
| CWP preview | **PASS** | `#cwp-gifts.ro-preview` renders visible Giver Name, Gift Description, Value, Category, Received Date, Thank-You, Phone, Email, Address, and Notes headers with read-only row controls. |
| Toolbar and Hub controls | **PASS** | Live browser confirms Auto-fit and filter controls remain enabled, and the Design Hub CTA is present. |
| Gift workflow | **PASS** | Existing gift dashboard summaries, category filters, thank-you print list, and CSV import action remain available. |
| Containment | **PASS** | Live Gift Log document reports no horizontal overflow. |
| Registry | **PASS** | Gift Log status is now `standardized`; no Launch registry entries remain `in_progress`. |

## 2026-07-14 - Phase B Batch 5 Partial QA: FAQ

**Scope:** Live browser QA for FAQ render-on-navigation, answer search/filtering, category controls, editorial rails, borderless answer cards, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| FAQ render path | **PASS** | FAQ opens from the visible planner search result and renders 45 answer cards with six category controls. |
| Search and categories | **PASS** | FAQ search returns matching answers and the category bar remains available; the FAQ stays an editorial help surface rather than a tracker. |
| Editorial rail treatment | **PASS** | Masthead, search, category bar, answer list, quick-help panel, and scripture footer share the page rails; FAQ cards and side card report no borders or shadows. |
| Containment | **PASS** | Live FAQ document width stayed within the viewport. |
| Console/checks | **PASS** | `node --check` and `check-system-consistency.js` passed; the local server's known WebAssembly MIME fallback remains a non-blocking environment warning. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Instructions / Get Started

**Scope:** Live browser QA for the Get Started editorial onboarding flow, dynamic onboarding mounts, shared rails, borderless card treatment, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Get Started opens through planner search with the live masthead, scripture footer, welcome content, learning sections, and action areas rendered. |
| Editorial exception | **PASS** | The page remains intentionally non-tracker and does not receive an inline data editor; onboarding content and actions remain the primary workflow. |
| Dynamic onboarding mounts | **PASS** | Guided path, templates gallery, Essentials hub, and setup checklist mounts render inside the shared page rails. |
| Rail and card containment | **PASS** | Sampled welcome, learning, wide-row, action, and dynamic onboarding surfaces report `0px` borders and no shadows; left/right rails match and document width stays within the viewport. |
| Console/checks | **PASS** | `node --check` and `check-system-consistency.js` passed; the local server's known WebAssembly MIME fallback remains a non-blocking environment warning. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Honeymoon / After

**Scope:** Live browser QA for Honeymoon / After tracker tabs, shared inline editor, read-only CWP previews, specialized Overview/Daily Journal surfaces, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell and tabs | **PASS** | Honeymoon / After opens through planner search and preserves Overview, Details, Transportation, Itinerary, Packing, Budget, and Daily Journal tabs. |
| Shared inline editor | **PASS** | Details, Transportation, Itinerary, Packing, and Honeymoon Budget use one inline editor with table switching, add, save, delete, and row position controls; Budget new records expose Category, Item, Budgeted, Actual, Status, and Notes. |
| Read-only CWP previews | **PASS** | All five tracker previews render visible headers and rows under `.ro-preview`; row controls are blocked while Auto-fit remains available. |
| Row-click editing | **PASS** | Clicking a Honeymoon Details preview row loads the matching record into the shared inline editor. |
| Specialized surfaces | **PASS** | Overview travel cards and Daily Journal remain intact as specialized post-wedding surfaces. |
| Rail and containment | **PASS** | Honeymoon cards, tracker sections, inline editor, and preview tables use the shared borderless gutter treatment; live document width stayed within the viewport. |
| Console/checks | **PASS** | `node --check` and `check-system-consistency.js` passed; the local server's known WebAssembly MIME fallback remains a non-blocking environment warning. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Color Palette

**Scope:** Live browser QA for the Color Palette visual-collection surface, preset/seasonal palette controls, custom palette builder, saved-palette specifications, nested card treatment, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Color Palette tab | **PASS** | Color Palette opens from the visible Vision Board tab bar and renders seasonal selectors, preset palette cards, custom builder, and saved palette area. |
| Native palette tools | **PASS** | Preset/seasonal Use actions, Specs toggles, custom palette inputs, and saved-palette specification fields remain present; no new seasonal library surface was added. |
| Editable/read-only behavior | **PASS** | Preset specification inputs remain read-only while saved palette specification inputs remain editable; custom builder inputs remain available. |
| Rail and card containment | **PASS** | Palette feature, nested palette-card grids, seasonal panel, builder, and swatch cards remain within the shared page rails; sampled cards report `0px` borders and no shadows. |
| Console/checks | **PASS** | Live palette inspection returned no document-level horizontal overflow; source checks and customer rebundle completed after the CSS standardization. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Vision Board

**Scope:** Live browser QA for Vision Board visual-collection/data-entry pattern, native palette/photo/favorite tools, inline Vision Details editor, read-only CWP preview, Design Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens through the visible Design & Details navigation with `data-active-panel="mood"`; the Details tab renders the inline editor and Vision Board Details Tracker preview while native palette and gallery surfaces remain present. |
| Inline full editor | **PASS** | `#mood-inline-editor-body` initializes with six editable fields and `Adding a new vision board detail`; clicking a preview row changes the editor to edit mode, shows Delete/Start New, and displays row position. |
| Read-only preview | **PASS** | `#cwp-moodItems.ro-preview` renders Section, Inspiration Item, Color Story, Vendor Match, Finalized Look, and Notes headers; row controls are disabled while Auto-fit remains enabled. |
| Inline save path | **PASS** | No-change save preserved the inline editor, visible CWP headers, 3 preview rows, `.ro-preview`, no row selectors, no page bulk controls, and no-overflow layout. |
| Design Hub edit path | **PASS** | `Edit in Design Hub` opens Data Hub with the Vision Board Items table editable; rows are enabled, Auto-fit and Add are enabled, `.ro-preview` is absent, and shared row selectors/bulk actions appear only in the Hub. |
| Native visual tools | **PASS** | Preset palettes and inspiration gallery mounts remain present; old `moodItems-hub-preview` and `.mood-bulk-card` are absent from the page. |
| Rail and card containment | **PASS** | Vision cards, inline editor, table card, CWP mount, and preview footer align to the shared rail; sampled card shells report `0px` borders and document width stayed inside the viewport. |
| Console/checks | **PASS** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Final Vision Board page log check returned no errors. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Notes

**Scope:** Live browser QA for Notes hybrid editorial/data-entry pattern, quick notes/cards/long-form note areas, inline Notes Tracker editor, read-only CWP preview, Planning Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens through the visible Planning navigation with `data-active-panel="notes"`; quick note, filters, visual cards, pinned notes, long-form note areas, inline editor, and Notes tracker preview all render on the shared rail. |
| Inline full editor | **PASS** | `#notes-inline-editor-body` initializes with ten editable fields and `Adding a new notes tracker entry`; clicking a preview row changes the editor to edit mode, shows Delete/Start New, and displays row position. |
| Read-only preview | **PASS** | `#cwp-notesDetails.ro-preview` renders Title, Category, Tags, Pinned, Date, Time, Last Edited, Note Details, Next Step, and Status headers; row controls are disabled while Auto-fit remains enabled. |
| Inline save path | **PASS** | No-change save preserved the inline editor, visible CWP headers, 5 preview rows, `.ro-preview`, and no-overflow layout. |
| Planning Hub edit path | **PASS** | `Edit in Planning Hub` opens Data Hub with the Notes Tracker table editable; rows are enabled, Auto-fit and Add are enabled, `.ro-preview` is absent, and shared row selectors/bulk actions appear only in the Hub. |
| Rail and card containment | **PASS** | Notes cards, side card, legacy note cards, inline editor, table card, CWP mount, and preview footer align to the shared rail; sampled card shells report `0px` borders and document width stayed inside the viewport. |
| Console/checks | **PASS** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Final Notes page log check returned no errors. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Premarital Counseling

**Scope:** Live browser QA for Premarital Counseling editorial/data-entry pattern, guided curriculum, inline editor, read-only CWP preview, Faith Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens through the visible Start Here navigation with `data-active-panel="counseling"`; verse, stats, guided curriculum, topic cards, inline editor, and Session tracker preview all render on the shared rail. |
| Guided curriculum | **PASS** | `#counseling-curriculum-host` renders the curriculum with five topic sections and remains editable independently of the CWP session tracker. |
| Inline full editor | **PASS** | `#counseling-inline-editor-body` initializes with seven editable fields and `Adding a new premarital counseling session`; clicking a preview row changes the editor to `Editing premarital counseling session`, shows Delete/Start New, and displays `1 of 4`. |
| Read-only preview | **PASS** | `#cwp-counseling.ro-preview` renders Date, Topic, Homework, Key Takeaway, Questions to Discuss, and Status headers; row controls are disabled while Auto-fit remains enabled. |
| Inline save path | **PASS** | No-change save preserved the inline editor, visible CWP headers, 4 preview rows, `.ro-preview`, and no-overflow layout. |
| Faith Hub edit path | **PASS** | `Edit in Faith Hub` opens Data Hub with Faith & Foundation > Counseling Sessions selected; rows are editable, Auto-fit and Add are enabled, `.ro-preview` is absent, and row selectors/bulk buttons remain hidden intentionally. |
| Rail and card containment | **PASS** | Curriculum, topic cards, inline editor, table card, CWP mount, and preview footer align to the shared rail; card shells report `0px` borders and document width stayed inside the viewport. |
| Console/checks | **PASS** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Final Counseling page log check returned no warnings/errors. |

## 2026-07-14 - Phase B Batch 5 Partial QA: Prayer Journal

**Scope:** Live browser QA for Prayer Journal editorial/data-entry pattern, inline editor, read-only CWP preview, Faith Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens through global search with `data-active-panel="prayer"`; devotional focus cards, prompt card, stats, inline editor, and Prayer log preview all render on the shared rail. |
| Inline full editor | **PASS** | `#prayer-inline-editor-body` initializes with six editable fields and `Adding a new prayer journal entry`; clicking a preview row changes the editor to `Editing prayer journal entry`, shows Delete/Start New, and displays `1 of 12`. |
| Read-only preview | **PASS** | `#cwp-prayer.ro-preview` renders Date, Prayer Focus, Request, Scripture Reference, Answer / Reflection, and Status headers; row controls are disabled while Auto-fit remains enabled. |
| Inline save path | **PASS** | No-change save preserved the inline editor, visible CWP headers, 12 preview rows, `.ro-preview`, and no-overflow layout. |
| Faith Hub edit path | **PASS** | `Edit in Faith Hub` opens Data Hub with Faith & Foundation > Prayer Journal selected; rows are editable, Auto-fit and Add are enabled, `.ro-preview` is absent, and bulk controls remain hidden intentionally. |
| Rail and card containment | **PASS** | Prayer focus cards, inline editor, table card, CWP mount, and preview footer align to the shared rail; card shells report `0px` borders and document width stayed inside the viewport. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed known SQLite WASM MIME fallback messages. |

## 2026-07-14 - Phase B Batch 4 Partial QA: Wedding Weekend Logistics

**Scope:** Live browser QA for Wedding Weekend Logistics shared inline editor, read-only CWP previews, Logistics Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens through global search with `data-active-panel="logistics"` and defaults to Weekend Timeline; main Logistics tabs remain available for Weekend, Travel & Hotels, Transportation, Family/VIP Care, Bachelor/ette, Maps, and Contacts. |
| Inline full editor | **PASS** | `#logistics-inline-editor-body` initializes for Weekend Timeline, switches to Travel & Accommodations, Hotel Blocks, Transportation, and Family/VIP Care, and keeps the correct inline tab/label/mode for each table. |
| Read-only previews | **PASS** | `#cwp-weekendTimeline.ro-preview`, `#cwp-travelAccommodations.ro-preview`, `#cwp-hotelBlocks.ro-preview`, `#cwp-transportation.ro-preview`, and `#cwp-vipCare.ro-preview` render visible CWP headers/rows; row controls are disabled while Auto-fit remains enabled. |
| Preview row editing | **PASS** | Clicking preview rows loads the selected record into the inline editor: Weekend (`Ceremony Rehearsal`), Hotel (`Comfort Suites Springfield`), Transportation (`Comfort Suites Springfield` pickup), and VIP (`Grandma Eleanor Whitfield`) all loaded with correct position text. |
| Inline save path | **PASS** | No-change save on a Weekend Timeline row preserved the inline editor, row count, read-only preview class, visible headers, and no-overflow layout. |
| Logistics Hub edit path | **PASS** | `Open Weekend Logistics Database Hub - Family/VIP Care` opens `#cwp-data-hub-active` with no `.ro-preview`, row selectors/select-all enabled, Auto-fit and Add enabled, and Edit/Delete Selected available. |
| Rail and card containment | **PASS** | Logistics tabs, inline editor, cards, preview tables, and footers are constrained to the shared rail; document width stayed inside the viewport during live QA. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed known SQLite WASM fallback/browser telemetry noise. |

## 2026-07-14 - Phase B Batch 4 Partial QA: Photo & Video Shot Lists

**Scope:** Live browser QA for Photo & Video Shot Lists shared inline editor, read-only CWP previews, Design Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Page shell | **PASS** | Page opens with `data-active-panel="shotlist"`; shared Photo/Video page tabs switch the visible panel and keep the inline editor label/tab aligned. |
| Inline full editor | **PASS** | `#shotlist-inline-editor-body` initializes for Photo, switches to Video, and exposes the full row fields for completed, must-have, notes, people, priority, section, shot, and timing. |
| Read-only previews | **PASS** | `#cwp-shotlist.ro-preview` and `#cwp-videoShots.ro-preview` render visible CWP headers/rows; row controls are disabled while search/filter/Auto-fit toolbar controls remain enabled. |
| Preview row editing | **PASS** | Clicking the first Photo preview row loads `Wedding dress hanging`; clicking the first Video preview row loads `Bride's first look in the mirror`, with the correct inline tab, label, mode, and row position. |
| Inline save path | **PASS** | No-change saves preserve inline editor state, row counts, read-only preview classes, and visible headers for both Photo and Video. |
| Design Hub edit path | **PASS** | `Edit in Design Hub` from the Video section opens `#cwp-data-hub-active` with Video Shot List fully editable: no `.ro-preview`, row selectors enabled, Auto-fit enabled, and `+ Add video shot` visible. |
| Rail and card containment | **PASS** | Shot List title, inline editor, stats, overview cards, preview tables, and footers are constrained to the shared rail; document width stayed inside the viewport during live QA. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed known SQLite WASM fallback/browser telemetry noise. |

## 2026-07-14 - Phase B Batch 4 Partial QA: Music & Speeches

**Scope:** Live browser QA for Music & Speeches shared inline editor, read-only CWP previews, Music Hub handoff, and page containment.

| Item | Status | Notes |
|------|--------|-------|
| Music page shell | **PASS** | Page opens from the visible Ceremony & Reception nav with `data-active-panel="entertainment"` and the existing Overview/Vendors/Cues/Speeches/Playlist tabs intact. |
| Inline full editor | **PASS** | `#music-inline-editor-body` initializes inside `#music-inline-editor-wrap`; the editor switches between Entertainment Vendors, Reception Music Cues, Speeches, Reception Playlist, and Do-Not-Play Songs. |
| Read-only previews | **PASS** | `#cwp-entertainment`, `#cwp-recSongs`, `#cwp-speeches`, `#cwp-receptionPlaylist`, and `#cwp-doNotPlay` all render as `.ro-preview` CWP tables with visible column labels, disabled row controls, and Auto-fit columns enabled. |
| Preview row editing | **PASS** | Clicking the first Reception Cue preview row loads `Editing reception music cue`, updates the inline table label to `Reception Music Cues`, sets the active inline tab to `recSongs`, shows Delete/Start new row, and displays `1 of 7`. |
| Inline save path | **PASS** | No-change inline save stays on Music & Speeches, keeps the cue editor active, preserves `Reception Music Cues` label/tab state, and re-renders the cue preview rows cleanly. |
| Music Hub edit path | **PASS** | `Edit in Music Hub` from the Cues tab opens Data Hub with Music & Speeches > Song Recommendations selected; rows are editable and Auto-fit/Add controls are available. |
| Rail and card containment | **PASS** | Inline editor, stats, tabs, overview cards, preview tables, and footer are constrained to the shared rail; document width stayed inside the viewport during live QA. Music card/table shells received the no-border/no-shadow Batch 4 styling. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-14 - Phase B Batch 4 Partial QA: Ceremony & Reception

**Scope:** Live browser QA for Ceremony & Reception editable CWP tables, Ceremony Hub handoff, documented native-form exception, and shared page rails.

| Item | Status | Notes |
|------|--------|-------|
| Ceremony page shell | **PASS** | Page opens from the visible Ceremony & Reception nav with `data-active-panel="ceremony"`, and header actions now show `Ceremony Hub` plus `Print Program`. |
| Editable CWP tables | **PASS** | `#cwp-ceremonyOrder`, `#cwp-ceremonyProcessional`, `#cwp-ceremonyRecessional`, `#cwp-scriptures`, `#cwp-ceremonyChecklist`, `#cwp-ceremonyReceptionDetails`, and `#cwp-ceremonyTraditions` all render tables with visible column labels and editable controls. |
| Order tab interaction | **PASS** | `Order of Worship` tab activates through the real tab control; the Order table stays visible with Step/Ceremony Moment/Suggested Length/Person Responsible/Music Cue/Notes headers and enabled inline inputs. |
| Ceremony Hub path | **PASS** | `Ceremony Hub` opens Data Hub with Ceremony & Reception > Order of Service selected; table rows are editable and Auto-fit columns is available. |
| Native editorial exception | **PASS** | Vows, rings, covenant moment, and officiant notes remain native ceremony form fields rather than CWP read-only previews; this is intentional for the hybrid ceremony/editorial page. |
| Rail and card containment | **PASS** | Ceremony table shells, cards, and CWP mounts are constrained to the shared rails; document width stayed inside the viewport during live QA. Card/table shells received the no-border/no-shadow Batch 4 styling. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-14 - Phase B Batch 4 Partial QA: Wedding Party

**Scope:** Live browser QA for Wedding Party inline editor, read-only CWP preview, People Hub handoff, and shared page rails.

| Item | Status | Notes |
|------|--------|-------|
| Wedding Party page shell | **PASS** | Page opens from the visible People nav with `data-active-panel="party"` and `party-b4-tracker` shell active. Shared page heading is visible as `Wedding Party`. |
| Inline full editor | **PASS** | `#party-inline-editor-body` renders the full party member editor with member name, role, phone, email, outfit status, attire, size/measurements, and notes fields enabled. |
| Read-only preview rows | **PASS** | `#cwp-party.ro-preview` renders visible Member/Role/Phone/Email/Attire/Size/Status/Notes headers and 6 preview rows; row controls are disabled/read-only while toolbar controls remain active. |
| Preview controls | **PASS** | Search, Clear, Auto-fit columns, and per-column filters remain enabled on the read-only preview. |
| Inline row editing | **PASS** | Clicking the first preview row loads `Editing Sarah Whitfield`, shows Delete and Start new member, updates the position to `1 of 6`, and changes the primary button to `Save wedding party member`. |
| Inline save path | **PASS** | No-change inline save stays on Wedding Party, keeps the inline editor mounted, and re-renders the preview table cleanly. |
| People Hub edit path | **PASS** | `Edit in People Hub` opens Data Hub with Wedding Party selected; full table rows are editable and Add/Edit/Delete/Apply/Auto-fit controls are restored. |
| Rail and card containment | **PASS** | Party heading, stats, inline editor, read-only preview, and cards align on the shared rail; editor/table/card shells reported `0px` borders and no box-shadow. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-14 - Phase B Batch 3 QA Gate: Wedding Day Timeline

**Scope:** Live browser QA for Wedding Day Timeline shared chrome, full inline editor, Planning Hub handoff, and Essentials-style Day-Of print mapping.

| Item | Status | Notes |
|------|--------|-------|
| Timeline entry and page shell | **PASS** | Dashboard `Build day-of timeline` opens `data-active-panel="timeline"`; header actions show `Print Day-Of` and `Planning Hub`; document width stayed inside the viewport (`845 <= 860` during live QA). |
| Day-Of Details tab | **PASS** | Details tab activates through the real tab control and keeps Key Moments, Coordinator Notes, Contact Reminders, filters, Add event, Load starter, Print Day-Of, and Edit in Planning Hub visible. |
| Inline full editor | **PASS** | `#cwp-wdayTimeline` now renders a full CWP table with visible Time/Event/Location/Responsible/Duration/Notes/Source headers, 10 live rows in QA data, Auto-fit columns, selection/bulk controls, and editable manual row inputs. |
| Synced vendor arrivals | **PASS** | Vendor-arrival rows remain source-linked/read-only and expose `View Source` back to Vendors while manual timeline rows remain editable. |
| Planning Hub path | **PASS** | `Planning Hub` opens Data Hub with Planning > Wedding Day Timeline selected, full table headers/rows visible, Auto-fit, Add, and shared bulk controls available. |
| Print mapping | **PASS** | Source check confirms Print Day-Of uses `openWdayTimelinePrint()` with the Essentials-style handoff builder and Timeline-specific print CSS; Print Section routes the Timeline panel to the same handoff. |
| Rail and card containment | **PASS** | Timeline stats/tab/detail/table sections align to the shared rails; Timeline card shells reported `0px` borders and no box-shadow in live browser QA. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-14 - Phase B Batch 3 Partial QA: Smart Calendar

**Scope:** Live browser QA for Smart Calendar stabilization, planner-source filtering, launch-scope export behavior, and rail/card containment.

| Item | Status | Notes |
|------|--------|-------|
| Calendar page shell | **PASS** | Page activates on `data-active-panel="calendar"` with Smart Calendar headings, stats, side cards, source filters, and Month/Week/Agenda controls present. |
| Month/Week/Agenda modes | **PASS** | Month, Week, and Agenda modes each rendered nonblank calendar content and returned cleanly to Month view. |
| Source filtering | **PASS** | Selecting `Appointments` changed the visible calendar content to appointment events, then resetting to `All Sources` restored the full source set. |
| Create modal | **PASS** | `+ Create` opens the Smart Calendar modal with source options, local `.ics` export visible, Save enabled, and the Google/external calendar button hidden. |
| Edit modal | **PASS** | Opening `Venue Walkthrough` loads `Edit Appointment`, keeps Save/Delete enabled for the source appointment, and preserves the local `.ics` export path. |
| Launch scope guard | **PASS** | External calendar connection is hidden/guarded; local `Download .ics` and `Export All .ics` remain the launch path for outside calendars. |
| Rail and card containment | **PASS** | Panel, title, toolbar, and main calendar card shared the same left/right rails; document width stayed inside the viewport (`845 <= 860` during live QA). Calendar card shells reported `0px` borders. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-13 - Phase B Batch 3 Partial QA: Appointment Tracker

**Scope:** Live browser QA for the Appointment Tracker page and the Planning Hub Appointments edit path.

| Item | Status | Notes |
|------|--------|-------|
| Appointment page shell | **PASS** | Page activates on `data-active-panel="appointments"` with the existing smart scheduling stats/filters preserved plus inline appointment editor and `#cwp-appointments.ro-preview`. |
| Shared filters/search | **PASS** | Category, status, date-range, and search controls remain present and continue to drive the CWP appointment preview. |
| Read-only preview rows | **PASS** | `#cwp-appointments.ro-preview` renders visible column headers and 5 appointment rows; row inputs/selects/textareas are disabled/read-only. |
| Preview table controls | **PASS** | Auto-fit columns remains enabled on the read-only preview. Appointment preview is not paginated, so View all is not shown because all filtered rows are already visible. |
| Inline row editing | **PASS** | Clicking `APT-0001` loads `Editing Venue Walkthrough`, shows Delete, changes the primary button to `Save appointment`, and keeps appointment fields editable. |
| Inline save path | **PASS** | No-change inline save stays on Appointment Tracker, keeps the inline editor mounted, and re-renders the preview rows cleanly. |
| Layout containment | **PASS** | Wide CWP appointment columns now scroll inside the preview card; document width stayed within the viewport during live QA. |
| Planning Hub edit path | **PASS** | `Edit in Planning Hub` opens Data Hub with the Appointments table fully editable; row fields are enabled and Add/Edit/Duplicate/Delete/Apply controls are restored. |
| Console/checks | **PASS** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser dev logs returned no planner app errors during Appointment QA. |

## 2026-07-13 - Phase B Batch 3 Partial QA: Tasks / Planning Timeline

**Scope:** Live browser QA for the Tasks / Planning Timeline tracker page and the Planning Hub Tasks edit path.

| Item | Status | Notes |
|------|--------|-------|
| Tasks page shell | **PASS** | Page activates on `data-active-panel="tasks"` with `tasks-b3-tracker`, inline task editor, `#cwp-tasks.ro-preview`, preserved task cards, and Planning Hub handoff. |
| Presets preserved | **PASS** | `Load 12-Month Timeline` and `Load Full Checklist` remain visible in the Tasks page actions. |
| Read-only preview rows | **PASS** | `#cwp-tasks.ro-preview` renders visible column headers and 8 preview rows; row inputs/buttons are disabled/read-only while toolbar controls remain active. |
| Preview table controls | **PASS** | Clear, Auto-fit columns, pagination, and View all remain enabled on the read-only preview. |
| Inline row editing | **PASS** | Clicking `TSK-0001` loads `Editing Research ceremony venues`, shows Delete, changes the primary button to `Save task`, and leaves inline fields editable. |
| Inline save path | **PASS** | No-change inline save stays on Tasks, keeps the inline editor mounted, and re-renders the preview rows cleanly. |
| Planning Hub edit path | **PASS** | `Edit in Planning Hub` opens Data Hub with the Tasks table fully editable; row fields are enabled and Add/Edit/Delete/Apply controls are restored. |
| Console/checks | **PASS WITH KNOWN FALLBACK** | `node --check` passed for `planner.js`; `check-system-consistency.js` passed. Browser console only showed the existing SQLite WASM MIME fallback messages. |

## 2026-07-13 - Phase B Batch 2 Partial QA: Catering

**Scope:** Live browser QA for the Catering & Menu multi-table tracker and Catering Hub edit path.

| Item | Status | Notes |
|------|--------|-------|
| Catering page shell | **PASS** | Page activates on `data-active-panel="catering"` with the shared Catering inline editor and `catering-preview-grid` present below the existing overview cards. |
| Multi-table read-only previews | **PASS** | All seven mounts exist and carry `.ro-preview` / `.cwp-readonly-preview`: `#cwp-menu`, `#cwp-beverages`, `#cwp-kidsMenu`, `#cwp-placeSettings`, `#cwp-cateringRentals`, `#cwp-snacks`, and `#cwp-vendorMeals`. |
| Preview table controls | **PASS** | Column headers are visible; row controls are disabled/read-only; Auto-fit remains available on each preview table. |
| Inline row editing | **PASS** | Clicking the first Menu preview row loads the inline editor with `Editing Bruschetta & cheese board`, shows Delete, and changes the primary save button to `Save menu item`. |
| Catering Hub edit path | **PASS** | `Edit in Catering Hub` opens the Menu table in Data Hub with row controls enabled plus `+ Add Dish`, Edit Selected, Delete Selected, Apply, and Auto-fit controls restored. |
| Borderless Catering shells | **PASS** | Catering overview cards, inline editor shell, and table cards render with `0px none` card borders under the late page-gutters rule. |
| Console check | **PASS WITH KNOWN FALLBACK** | No new Catering-specific errors observed; existing `sql-wasm.js` MIME fallback messages remain and the app continues through ArrayBuffer instantiation. |

## 2026-07-13 - Phase B Batch 2 Partial QA: Venue

**Scope:** Live browser QA for the Wedding Venue page and Vendor Comparisons path through Vendors Hub.

| Item | Status | Notes |
|------|--------|-------|
| Venue page shell | **PASS** | Page activates with the `venue-b2-standard` class, shared `ued-mast` title, Venue & Vendors kicker, and preserved ceremony/reception actions. |
| Native venue tools | **PASS** | Venue Details and Shortlist tabs remain available; native venue detail fields, visual shortlist cards, and comparison card controls are preserved. |
| Vendor comparison editor correction | **SOURCE PASS / LIVE RECHECK BLOCKED** | `#cwp-venue-vendorCompare` now mounts without `.ro-preview`, the read-only badge was removed, and the page includes `+ Add comparison`; browser tab access timed out during the post-correction recheck. |
| Vendors Hub edit path | **PASS** | Open in Vendors Hub opens Data Hub with the full editable Vendor Comparisons table; Add, Edit Selected, Delete Selected, and editable row fields are restored. |
| Borderless Venue shells | **PASS** | Venue native cards and the shared comparison card render with `0px none` borders under the late page-gutters rule. |
| Startup helper | **PASS** | Hardened `ensureTableColumnTip()` so nested table wrappers do not throw `insertBefore` during app initialization. |

## 2026-07-13 - Phase B Batch 2 Partial QA: Vendors

**Scope:** Live browser QA for the Vendors page and the Vendors Hub tracker path.

| Item | Status | Notes |
|------|--------|-------|
| Vendors page shell | **PASS** | Page mounts the `vendors-tracker-b2` shell with stats, category tabs, inline vendor editor, `#cwp-vendors.ro-preview`, vendor cards, and Vendors Hub handoff. |
| Inline vendor editor | **PASS** | Initial load renders 15 vendor fields; row click on `VEN-0001` loads "Editing Grace Community Church", shows Delete, and changes the primary save button to "Save vendor". |
| Read-only vendor preview | **PASS** | Preview suppresses Add/Bulk controls, keeps Clear and Auto-fit, keeps visible column headers, disables row controls, and preserves row click into the inline editor. |
| Vendors Hub edit path | **PASS** | Edit in Vendors Hub opens the full editable Vendors CWP table with Add/Bulk controls restored and 9 vendor rows visible. |
| Shared CWP preview rule | **PASS** | CWP `.ro-preview` mounts now keep toolbar/pager controls active while rows remain read-only; full Hub mounts remain editable. |

## 2026-07-13 - Phase B Batch 2 Partial QA: Contracts/Rentals

**Scope:** Live browser QA for the Contracts, Invoices & Rentals page and the Finances Hub Contracts/Rentals paths.

| Item | Status | Notes |
|------|--------|-------|
| Contracts page shell | **PASS** | Page mounts the `contracts-rentals-b2` shell with inline contract/invoice editor, stats, filters, `#cwp-contracts.ro-preview`, and Finances Hub handoff. |
| Rentals page shell | **PASS** | Rentals uses the same page-level pattern with inline rental editor, filters, `#cwp-rentals.ro-preview`, and Finances Hub handoff. |
| Read-only preview rows | **PASS** | Contract and rental row inputs/selects/buttons have pointer-events blocked inside `.ro-preview`; table controls such as Auto-fit and column filters remain clickable. |
| Inline row editing | **PASS** | Clicking a contract row loads "Editing Reception venue agreement"; clicking a rental row loads "Editing Tables & chairs (180 guests)". |
| Finances Hub edit path | **PASS** | Contracts and Rentals open in Finances Hub with full editable CWP tables; row fields have pointer-events enabled there. |
| Startup blocker | **PASS** | Fixed vendor card filtering to use `vendorTrackerCatKey()` instead of undeclared `_activeVendorCat`, preventing init failure on reload. |

## 2026-07-13 - Phase B Batch 1 QA Gate

**Scope:** Live browser QA across Dashboard, Budget, Guest List, Payments, People Hub, and Finances Hub before starting Phase B Batch 2.

| Item | Status | Notes |
|------|--------|-------|
| Dashboard layout | **PASS** | Feeling Overwhelmed sits directly below Setup Checklist; Budget Snapshot precedes Database Hub; desktop RSVP Status, Payments, and Vendor Booking circle cards share one row with equal gaps. |
| Borderless card shells | **PASS** | Card shell hairlines removed, including Budget category cards; table cells and form fields keep their structural borders. |
| Budget hybrid | **PASS** | Shared gutters/card treatment holds; Export CSV, Add category, Load full categories, Load full itemized, Choose category, and Print Budget are enabled. |
| Guest inline editor | **PASS** | Event Invitations and Companions mini-table headers remain visible; Event Invitations Use column shows a native editable checkbox. |
| Guest read-only tracker | **PASS** | Rows are non-interactive in `#cwp-guests.ro-preview`; Auto-fit, filters, bulk controls, View all, and hub entry points remain available; Family is its own column. |
| People Hub full table | **PASS** | Guest List opens in People Hub and View all expands the table to all 16 guest rows. |
| Payments inline editor | **PASS** | Installment Payments mini-table headers remain visible and the editor table is not styled as read-only. |
| Payment Schedule read-only tracker | **PASS** | Rows are non-interactive in `#cwp-payments.ro-preview`; Auto-fit, filters, View all, and Edit in Finances Hub remain available. |
| Finances Hub full table | **PASS** | Payment Schedule opens in Finances Hub and View all expands the table to all 12 payment rows. |
| Responsive rails | **PASS** | Desktop, 1024px narrow laptop, tablet, and mobile checks showed no page-wide horizontal overflow; patched the 1024px sidebar/grid squeeze on Batch 1 grids and Guest top cards. |

**Fixes made during this gate:**

- Extended the shared borderless-card rule to Budget category cards.
- Added a sidebar-aware `.ued-grid` stacking breakpoint at 1120px.
- Overrode the Guest tablet-landscape split view when the content rail is too narrow, so Guest top cards span the full rail.

**Known non-blockers:**

- Budget remains the documented Batch 1 hybrid rather than a full tracker conversion.
- Read-only preview row controls are visually present but blocked through pointer-events instead of being disabled; toolbar/hub controls remain clickable by design.

**Date:** 2026-07-09  
**Scope:** Phase 2j–2k preserve checklist + spot fixes from roadmap completion sprint.

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| Themes / fonts / dark mode render | **PASS** | Editorial + dark tokens unchanged; dashboard masthead uses couple names |
| Couple names on dashboard | **PASS** | `renderDashboard()` ued-title + couple-info footer |
| Vision / verse on reflect & dashboard hooks | **PASS** | Setup checklist verse step; hero photo / themes via `renderHeroPhoto` |
| Profile switch preserves data | **PASS** | SQLite + localStorage profile keys unchanged |
| Toast on save | **PASS** | Existing `showToast` / `uxSavedFlashForPanel` on CWP afterChange |
| Toast on import / restore | **PASS** | Partner packet, backup restore, CSV import paths |
| `covConfirm` on `resetAll` | **PASS** | Danger confirm before erase; toast on success |
| `covConfirm` on `deleteProfile` | **PASS** | Pre-existing double confirm |
| `covConfirm` on bulk delete | **PASS** | `deleteBulkRows` + CWP bulk delete |
| Icon-only buttons — title/aria (top panels) | **PASS** | Sample audit: dashboard layout moves, payment pager, guest trash via `plannerTrashButton`, shotlist pick buttons |
| Progress bars (checklist ↔ foundation) | **PASS** | Setup checklist ring + foundation meter coexist |
| Empty-state primary CTAs on CWP | **PASS** | `cwpGhostRowsHtml` + expanded `CWP_GHOST_TEMPLATES` |
| Essentials v2 layout active | **PASS** | `data-essentials-v2` set in `renderEssentials()` |
| Nav resident-first metric (≤8 destinations) | **PASS** | `countVisiblePrimaryDestinations` + dev warn + dashboard tip |
| Menubar `#nav-category-bar` unchanged | **PASS** | Structure preserved |

## Manual smoke (recommended)

1. Fresh profile → Essentials view → ≤8 menubar destinations (tip if over cap until checklist 40%+).
2. Tables panel → drag unseated chip to table row + floor node; drag seated chip table→table; drop on pool to unseat.
3. Dashboard → Customize → toggle/reorder all secondary cards including payments-due, planning-health, couple-info.
4. Empty CWP table → ghost example rows (party, shotlist, contracts, etc.).
5. Reset All → confirm dialog → toast.

## Known non-blockers

- Legacy `guest-body` / `payment-body` fallbacks remain for edge DOM; primary path is CWP mounts.
- Catering legacy `cat-pill` styling retained in legacy render fallbacks only (CWP uses `statusPill`).

## 2026-07-14 - Phase B Exit Review: Shared Status Theme Smoke

| Item | Status | Notes |
|------|--------|-------|
| Guest status controls in light mode | **PASS** | Guest List rendered the shared status selects with selected value `Pending` and canonical `guest-status-select guest-status-pending` classes. |
| Guest status controls in dark mode | **PASS** | Toggling the live app to dark mode added `dark-mode`, changed the mode control to Light Mode, and preserved the same status values/classes. |
| Theme restoration | **PASS** | Toggling back restored the light-mode body class and Dark Mode control without losing the status structure. |

**Remaining gate:** full tracker persistence smoke, complete responsive matrix, and file-level export/print verification remain open where they require broader coverage or an artifact capture path beyond the in-app browser.

## 2026-07-14 - Phase B Exit Review: Guest Persistence Smoke

| Item | Status | Notes |
|------|--------|-------|
| Guest inline no-change save | **PASS** | Opened `GST-0001`, used Save guest without changing fields, received the `Saved` confirmation, and remained on the same editor record. |
| Guest refresh stability | **PASS** | Reloaded the live app; Guest List data and the saved guest name were still present, the inline editor reinitialized, and document overflow remained false. |

**Scope note:** This is a representative persistence smoke only. Cross-page add/edit/delete persistence and bulk persistence remain open for the final exit gate.

## 2026-07-14 - Phase B Exit Review: Responsive Shell Matrix

| Item | Status | Notes |
|------|--------|-------|
| Desktop shell | **PASS** | 1440x900 rendered the main shell with no document overflow or heading overflow. |
| Narrow laptop shell | **PASS** | 1024x768 rendered the main shell with no document overflow or heading overflow. |
| Tablet shell | **PASS** | 768x1024 rendered the main shell with no document overflow or heading overflow. |
| Mobile shell | **PASS** | 390x844 rendered the main shell with no document overflow or heading overflow. |

**Scope note:** This closes representative responsive shell coverage. Full visual review of every page, table, modal, and empty state remains separate.

## 2026-07-14 - Phase B Exit Review: Database Hub Control Surface

| Item | Status | Notes |
|------|--------|-------|
| Shared Hub controls | **PASS** | Live Database Hub exposed Auto-fit columns, View all, Delete Selected, and Apply controls together. |
| View all expansion | **PASS** | View all expanded the Guest tracker to 16 rows and the document remained within the viewport. |
| Mutation safety | **PASS** | This smoke did not apply edits or delete rows; bulk persistence remains open for a controlled test. |

## 2026-07-14 - Phase B Exit Review: Final Lifecycle Implementation

| Item | Status | Notes |
|------|--------|-------|
| Bulk selection lifecycle | **PARTIAL** | Shared tables expose selection, select-all, edit/delete/clone affordances, and delete confirmation. The explicit Clear selection/post-apply clearing enhancement remains open for a later focused pass. |
| Bulk persistence implementation | **IMPLEMENTED** | Bulk apply saves through the shared persistence path, re-renders the table, and reports the affected row count. |
| CSV download reliability | **IMPLEMENTED** | CSV, JSON, partner packet, guest, vendor, address, and task download paths retain object URLs for 1 second before revocation. |
| Print label normalization | **PARTIAL** | Shared print-view and core Budget/Timeline actions now use Print or Print section; three packet templates still contain the legacy Print / Save as PDF label and require a small follow-up replacement. |
| Customer bundle synchronization | **PASS** | Rebundle completed and reported Bundle verification passed; customer output was regenerated at 5,148,587 bytes. |
| Static validation | **PASS** | `node --check planner.js` and `check-system-consistency.js` both pass. |
| Live final interaction pass | **PARTIAL** | A fresh live server rendered Guest List, Budget, Payments, Vendors, and Planning Timeline through planner search, with tracker headers, filters/Clear Filters, View All, backup/export/print and Auto-fit controls present and no document overflow. The shared Print page selector now exposes 30 customer-facing page targets, and the shared print scaffold now carries the Essentials palette, typography roles, masthead, dividers, card/KPI/writing treatments, tables, and footer. Manual print testing was confirmed working. The live popup test opened a blank separate tab in the harness, so shared-template rendering still needs manual confirmation for the newly added targets. No records were mutated; one/many selection, delete-confirmation cancellation, refresh persistence, and artifact-level CSV inspection remain open. |
| Backup/restore, CSV, print artifacts | **CONTROL VERIFIED / ARTIFACT OPEN** | Controls and source paths are present; the in-app browser did not expose downloaded files or printed PDF artifacts for byte-level inspection. |
