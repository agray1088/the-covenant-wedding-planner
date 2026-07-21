# Database Hub Implementation Plan

**Status:** Phase C complete (Strategy Roadmap Build, July 2026)

## Overview

The **Database Hub** (`#panel-data-hub`) is the 34th documented panel. It centralizes full CWP tables with bulk edit, search, column filters, pagination, and auto-fit columns. Minimal destination pages show stats, relationship record cards, and hub deep-links — not duplicate full tables.

## Naming

- User-facing label: **Database Hub** (nav, top bar, dashboard, page titles, FAQ)
- Internal ids unchanged: `data-hub`, `openDataHub()`, `#panel-data-hub`, `#cwp-data-hub-active`

## Registry categories (10)

| Category | Tables |
|----------|--------|
| People | guests, party |
| Finances | payments, contracts, rentals, budgetHub |
| Catering | menu, beverages, kidsMenu, placeSettings, cateringRentals, snacks, vendorMeals |
| Planning | tasks, appointments, notesDetails, wdayTimeline |
| Vendors | vendors, vtimeline, vendorCompare |
| Ceremony & Reception | ceremonyOrder, ceremonyProcessional, ceremonyRecessional, scriptures, ceremonyChecklist, ceremonyReceptionDetails, ceremonyTraditions |
| Music & Speeches | entertainment, recSongs, speeches, receptionPlaylist, doNotPlay |
| Weekend Logistics | 11 tables (weekendTimeline through contactsDirectory) |
| Design & Details | essentials, moodItems, shotlist, videoShots, gifts |
| Faith & Foundation | counseling, prayer |
| Honeymoon & After | honeyDetails, honeyTransport, honeyItinerary, packing, hmBudgetItems, homecoming, nameChange |

## Minimal page pattern

1. Stats / alerts at top
2. `renderHubRecordCards(entityKey)` — cards mirroring record editor fields; click opens `openRecordEditor`
3. `hubPreviewFoot(category, table)` link to Database Hub
4. No `#cwp-*` mount on source panel (`cwpMountOnPanel` returns false)

## Card pages (first pass)

- Guest List, Wedding Party, Vendors (tracker tab), Planning Timeline (tasks), Payments

## Hub table parity

- `cwpRenderTable(key, 'cwp-data-hub-active')` renders **full** CWP toolbar in hub (not hideToolbar slim bar)
- Hub toolbar row: Auto-fit Columns, Export CSV (when applicable), primary Add action
- After render: `makeColumnsResizable`, `enhanceAllTables` on `#panel-data-hub`

## Entry points

- Start Planning → Database Hub
- Top bar Database Hub button
- Dashboard card
- Page hub links and ⌘K search

## Verification

```bash
node --check js/planner.js
node tools/check-panel-nesting.js
powershell -File "../03 Tools/Rebundle Developer Version.ps1"
```
