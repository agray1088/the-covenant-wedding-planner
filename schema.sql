-- ============================================================
-- The Covenant Wedding Planner — Relational Schema (SQLite)
-- FULL schema for the UNIFIED SYSTEM BUILD (js/planner.js)
-- ============================================================
-- Supersedes the earlier partial schema (which was derived from the
-- older dashboard file). This version is re-derived from the unified
-- build's blankData(), SAMPLE_DATA, PLANNER_DATA_REGISTRY, and the
-- logAdd() row templates.
--
-- Conventions
--   • App-generated TEXT ids matching the app's own scheme (e.g. 'GST-0001').
--     The app already assigns row._id via ensureRowId()/nextRecordId(),
--     so migration can reuse those ids directly.
--   • Booleans stored as INTEGER 0/1  (Postgres: BOOLEAN, MySQL: TINYINT(1)).
--   • Dates/times stored as TEXT ISO 'YYYY-MM-DD' / 'HH:MM'.
--   • Every domain table carries wedding_id (replaces localStorage "profiles").
--   • ON DELETE CASCADE from wedding; ON DELETE SET NULL for soft cross-refs.
--
-- EXCLUDED (app runtime state, intentionally not relational):
--   _historyLog, _undoSnapshots, _redoSnapshots, _historyPrefs
--
-- INFERRED shapes (flagged inline): payment_installment, guest_companion,
--   attire_item, decor_item, stationery_item, snack, vendor_meal,
--   ceremony_tradition. Confirm columns against the app before relying on them.
--
-- Requires: PRAGMA foreign_keys = ON;
-- ============================================================

PRAGMA foreign_keys = ON;

-- ================================================================
-- CORE / SINGLETON-PER-WEDDING
-- ================================================================

-- The wedding (was `setup` + a profiles entry + `onboard`).
CREATE TABLE wedding (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT 'My Wedding',
    bride           TEXT,
    groom           TEXT,
    wedding_date    TEXT,
    engaged_date    TEXT,
    budget_total    REAL,
    guest_target    INTEGER,
    venue_ceremony  TEXT,
    venue_reception TEXT,
    pastor          TEXT,
    church          TEXT,
    style           TEXT,
    colors          TEXT,
    timezone        TEXT,
    verse           TEXT,
    mission         TEXT,
    cost_adult      REAL,
    cost_child      REAL,
    cost_venue      REAL,
    cost_cake       REAL,
    cost_beverage   REAL,
    banner_verse    TEXT,
    banner_ref      TEXT,
    mood_statement  TEXT,
    onboard_wizard_seen INTEGER DEFAULT 0,   -- onboard.wizardSeen
    onboard_backup_done INTEGER DEFAULT 0,   -- onboard.backupDone
    schema_version  INTEGER NOT NULL DEFAULT 2,
    created_at      TEXT,
    updated_at      TEXT,
    -- Phase B: JSON safety-net for anything not faithfully captured by the
    -- relational tables (unmapped top-level keys, extra per-record fields, and
    -- scalar values that column affinity would coerce). Written by
    -- syncDataToSqlite()/populate() and deep-merged back in
    -- hydrateDataFromSqlite() so a SQLite round-trip is guaranteed lossless.
    -- Older DBs missing this column are upgraded via ensureSchemaColumns().
    overflow_json   TEXT
);

-- Ceremony header (1:1). Detail lives in ceremony_* child tables below.
CREATE TABLE ceremony (
    wedding_id   TEXT PRIMARY KEY REFERENCES wedding(id) ON DELETE CASCADE,
    start_time   TEXT,
    duration     TEXT,
    processional TEXT,
    recessional  TEXT,
    worship      TEXT,
    vows         TEXT,
    rings        TEXT,
    unity        TEXT,
    blessing     TEXT,
    notes        TEXT
);

-- Honeymoon summary (1:1). Detail in honey_* child tables.
CREATE TABLE honeymoon (
    wedding_id   TEXT PRIMARY KEY REFERENCES wedding(id) ON DELETE CASCADE,
    destination  TEXT,
    depart_date  TEXT,
    return_date  TEXT,
    flight_out   TEXT,
    flight_back  TEXT,
    hotel        TEXT,
    confirmation TEXT
);

-- Catering meta (1:1) — cateringMeta { serviceCharge, taxRate, gratuity, notes }.
CREATE TABLE catering_meta (
    wedding_id     TEXT PRIMARY KEY REFERENCES wedding(id) ON DELETE CASCADE,
    service_charge TEXT,
    tax_rate       TEXT,
    gratuity       TEXT,
    notes          TEXT
);

-- Freeform note blocks (general/family/vendors/marriage).
CREATE TABLE note (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    body       TEXT,
    UNIQUE (wedding_id, kind)
);

-- Generic key/value store for the dynamic-key object sections:
-- reception, vision, firstmonth, hmBudget, visionBoard, vendorPackets,
-- partyPackets, coordPacket. scope = section name, field = object key.
CREATE TABLE misc_setting (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    scope      TEXT NOT NULL,
    field      TEXT NOT NULL,
    value      TEXT,
    UNIQUE (wedding_id, scope, field)
);

-- Venue detail rows (ceremony + reception).
CREATE TABLE venue (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    role         TEXT NOT NULL,          -- 'ceremony' | 'reception'
    name         TEXT,
    contact      TEXT,
    address      TEXT,
    phone        TEXT,
    capacity     TEXT,
    space        TEXT,                   -- indoor / outdoor
    hours        TEXT,
    cost         TEXT,
    deposit      TEXT,
    setup_time   TEXT,
    parking      TEXT,
    best_for     TEXT,
    amenities    TEXT,
    food_rules   TEXT,
    cancel_policy TEXT,
    other        TEXT,
    UNIQUE (wedding_id, role)
);

-- ================================================================
-- VENDORS  (parent of payments, contracts, rentals, appointments,
--           vendor_timeline — per PLANNER_DATA_REGISTRY)
-- ================================================================
CREATE TABLE vendor (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category     TEXT,                   -- vendor taxonomy (Venue, Catering, ...)
    name         TEXT NOT NULL,
    contact      TEXT,
    phone        TEXT,
    email        TEXT,
    quote        REAL,
    deposit      REAL,
    balance      REAL,
    status       TEXT,
    rating       REAL,                   -- vendor.rating (0–5 stars)
    has_contract INTEGER DEFAULT 0,
    pros         TEXT,
    cons         TEXT,
    review       TEXT,
    notes        TEXT
);

-- ================================================================
-- BUDGET  (category rollups + line items; payments link by category)
-- ================================================================
CREATE TABLE budget_category (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,            -- the `cat` label
    target_pct REAL,
    planned    REAL,
    tip        TEXT,
    UNIQUE (wedding_id, name)
);

CREATE TABLE budget_item (
    id                 TEXT PRIMARY KEY,
    budget_category_id TEXT NOT NULL REFERENCES budget_category(id) ON DELETE CASCADE,
    name               TEXT NOT NULL,
    cost               REAL,
    actual             REAL,
    budgeted           REAL,
    status             TEXT,             -- Paid | Partial | Pending
    paid               INTEGER DEFAULT 0,
    due_date           TEXT,
    notes              TEXT
);

-- ================================================================
-- PAYMENTS  (FK → vendor and → budget_category; installments child)
-- ================================================================
CREATE TABLE payment (
    id                 TEXT PRIMARY KEY,
    wedding_id         TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor_id          TEXT REFERENCES vendor(id) ON DELETE SET NULL,
    budget_category_id TEXT REFERENCES budget_category(id) ON DELETE SET NULL, -- was budgetCat
    descr              TEXT,
    due_amount         REAL,
    paid_amount        REAL,
    gratuity           REAL,             -- payment.gratuity
    gratuity_status    TEXT,             -- payment.gratuityStatus
    budget_item        TEXT,             -- payment.budgetItem (line-item name)
    budget_item_id     TEXT,             -- payment.budgetItemId
    contract_idx       TEXT,             -- payment.contractIdx (as-typed index string)
    due_date           TEXT,
    paid_date          TEXT,
    method             TEXT,             -- was ptype
    status             TEXT,             -- Not Paid | Partially Paid | Paid
    notes              TEXT
);

-- Nested payment schedule (payment.installments).
-- Shape confirmed against the app's installment editor (Track 4 / Phase B):
-- rows are { label, dueDate, amountDue, amountPaid, status, paidDate, notes }.
-- `amount` is retained for backward-compat with the original inferred shape.
CREATE TABLE payment_installment (
    id          TEXT PRIMARY KEY,
    payment_id  TEXT NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
    label       TEXT,
    amount      REAL,
    amount_due  REAL,
    amount_paid REAL,
    due_date    TEXT,
    paid_date   TEXT,
    status      TEXT,
    notes       TEXT
);

-- ================================================================
-- GUESTS, EVENTS, SEATING, PARTY
-- ================================================================
CREATE TABLE reception_table (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    capacity   INTEGER,
    placement  TEXT
);

CREATE TABLE guest (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    table_id   TEXT REFERENCES reception_table(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    household  TEXT,
    guest_group TEXT,                 -- guest.group (SQL keyword-safe column name)
    side       TEXT,
    role       TEXT,                  -- guest.role (Adult Guest, Child, ...)
    invite_decision TEXT,             -- guest.inviteDecision (Invite | Maybe | ...)
    phone      TEXT,
    email      TEXT,
    address    TEXT,
    invited    INTEGER DEFAULT 1,
    rsvp       TEXT,
    meal       TEXT,
    dietary    TEXT,
    plus_one   INTEGER DEFAULT 0,
    children   INTEGER DEFAULT 0,
    family     INTEGER DEFAULT 0,   -- guest.family toggle (mirrors migration-map `bool` list)
    thankyou   INTEGER DEFAULT 0,
    notes      TEXT
);

-- Nested plus-ones / household members (guest.companions). INFERRED shape.
CREATE TABLE guest_companion (
    id       TEXT PRIMARY KEY,
    guest_id TEXT NOT NULL REFERENCES guest(id) ON DELETE CASCADE,
    name     TEXT,
    meal     TEXT,
    notes    TEXT
);

-- Sub-events (rehearsal, reception, brunch...) guests can be invited to.
CREATE TABLE guest_event (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    category   TEXT,
    active     INTEGER DEFAULT 1
);

-- Associative entity: guest <-> guest_event (per-event RSVP & meal).
CREATE TABLE guest_event_assignment (
    id             TEXT PRIMARY KEY,
    wedding_id     TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    guest_id       TEXT NOT NULL REFERENCES guest(id) ON DELETE CASCADE,
    event_id       TEXT NOT NULL REFERENCES guest_event(id) ON DELETE CASCADE,
    invite_decision TEXT,               -- Invite | ...
    invite_sent    INTEGER DEFAULT 0,
    rsvp           TEXT,
    meal           TEXT,
    notes          TEXT,
    UNIQUE (guest_id, event_id)
);

-- Wedding party (guest_id links to a guest when possible).
CREATE TABLE party_member (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    guest_id    TEXT REFERENCES guest(id) ON DELETE SET NULL,
    member_name TEXT,                   -- fallback / non-guest
    role        TEXT,
    phone       TEXT,
    email       TEXT,
    attire      TEXT,
    size        TEXT
);

-- ================================================================
-- GIFTS
-- ================================================================
CREATE TABLE gift (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    guest_id   TEXT REFERENCES guest(id) ON DELETE SET NULL,
    from_name  TEXT,
    phone      TEXT,
    email      TEXT,
    address    TEXT,
    descr      TEXT,
    value      REAL,
    gift_date  TEXT,
    category   TEXT,                     -- Cash | Gift Card | ...
    thankyou   INTEGER DEFAULT 0,
    notes      TEXT
);

-- ================================================================
-- TASKS, PLAN, CALENDAR, APPOINTMENTS
-- ================================================================
CREATE TABLE task (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category     TEXT,
    title        TEXT NOT NULL,
    phase        TEXT,               -- task.phase
    priority     TEXT,
    due_date     TEXT,
    suggested_due TEXT,              -- task.suggestedDue
    status       TEXT,
    assigned     TEXT,
    notes        TEXT
);

-- Nested task checklist (task.subtasks[] = { text, done }). First-class child
-- table (mirrors guest_companion / payment_installment). Order preserved by
-- insertion order; `position` is a convenience hint (not reversed into JSON).
CREATE TABLE task_subtask (
    id        TEXT PRIMARY KEY,
    task_id   TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    body      TEXT,                  -- subtask.text
    done      INTEGER DEFAULT 0,
    position  INTEGER
);

CREATE TABLE plan_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    phase      TEXT,
    title      TEXT NOT NULL,
    owner      TEXT,
    due_date   TEXT,
    priority   TEXT,
    status     TEXT,
    done       INTEGER DEFAULT 0,
    notes      TEXT
);

CREATE TABLE calendar_event (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    title      TEXT,
    category   TEXT,
    event_date TEXT,
    event_time TEXT,
    status     TEXT,
    notes      TEXT
);

CREATE TABLE appointment (
    id            TEXT PRIMARY KEY,
    wedding_id    TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor_id     TEXT REFERENCES vendor(id) ON DELETE SET NULL,
    title         TEXT,
    category      TEXT,
    vendor_name   TEXT,                  -- as typed; may differ from vendor_id
    contact       TEXT,
    appt_date     TEXT,
    appt_time     TEXT,
    location      TEXT,
    status        TEXT,
    reminder      TEXT,                  -- 'YYYY-MM-DDThh:mm'
    followup_date TEXT,
    notes         TEXT
);

-- ================================================================
-- CONTRACTS & RENTALS  (FK → vendor)
-- ================================================================
CREATE TABLE contract (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor_id  TEXT REFERENCES vendor(id) ON DELETE SET NULL,
    name       TEXT,
    doc_type   TEXT,                     -- Contract | Invoice
    doc_date   TEXT,
    amount     REAL,
    status     TEXT,
    location   TEXT,                     -- was `where`
    img        TEXT,
    notes      TEXT
);

CREATE TABLE rental (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor_id   TEXT REFERENCES vendor(id) ON DELETE SET NULL,
    item        TEXT,
    pickup_date TEXT,
    return_date TEXT,
    cost        REAL,
    details     TEXT
);

-- ================================================================
-- FAITH / MARRIAGE PREP
-- ================================================================
CREATE TABLE prayer_entry (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    entry_date TEXT,
    focus      TEXT,
    request    TEXT,
    scripture  TEXT,
    answer     TEXT
);

CREATE TABLE counseling_session (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    seq          INTEGER,
    session_date TEXT,
    topic        TEXT,
    homework     TEXT,
    takeaway     TEXT,
    questions    TEXT,
    status       TEXT
);

-- ================================================================
-- CEREMONY CONTENT (child tables of the ceremony header)
-- ================================================================
CREATE TABLE scripture (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    seq        INTEGER,
    passage    TEXT,
    body       TEXT,
    reader     TEXT,
    notes      TEXT
);

CREATE TABLE ceremony_order (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    step       TEXT,
    moment     TEXT,
    person     TEXT,
    cue        TEXT,
    notes      TEXT
);

CREATE TABLE ceremony_processional (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    seq        TEXT,
    name       TEXT,
    role       TEXT,
    notes      TEXT
);

CREATE TABLE ceremony_recessional (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    seq        TEXT,
    name       TEXT,
    role       TEXT,
    notes      TEXT
);

CREATE TABLE ceremony_checklist (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    done       INTEGER DEFAULT 0,
    notes      TEXT
);

CREATE TABLE ceremony_reception_detail (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    moment     TEXT,
    category   TEXT,
    person     TEXT,
    timing     TEXT,
    notes      TEXT
);

-- Traditions / cultural moments. INFERRED shape (mirrors reception_detail).
CREATE TABLE ceremony_tradition (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    moment     TEXT,
    category   TEXT,
    person     TEXT,
    timing     TEXT,
    notes      TEXT
);

-- ================================================================
-- PHOTOGRAPHY
-- ================================================================
CREATE TABLE shotlist_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    section    TEXT,
    shot       TEXT,
    must_have  TEXT,
    people     TEXT,
    notes      TEXT
);

-- ================================================================
-- FOOD & DRINK
-- ================================================================
CREATE TABLE menu_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    course     TEXT,
    item       TEXT,                     -- labelField 'dish'
    cost_basis TEXT,
    unit_cost  TEXT,
    servings   INTEGER,
    status     TEXT,
    notes      TEXT
);

CREATE TABLE beverage (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT,
    bar_type   TEXT,                     -- Beer & Wine | Non-Alcoholic ...
    kind       TEXT,                     -- was type
    cost_basis TEXT,
    unit_cost  TEXT,
    qty        INTEGER,
    included   INTEGER DEFAULT 0,
    specialty  INTEGER DEFAULT 0,
    status     TEXT,
    notes      TEXT
);

CREATE TABLE kids_menu (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    option     TEXT,
    count      INTEGER,
    cost_child TEXT,
    dietary    TEXT,
    status     TEXT,
    notes      TEXT
);

CREATE TABLE place_setting (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    qty        INTEGER,
    cost       TEXT,
    notes      TEXT
);

CREATE TABLE catering_rental (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    vendor     TEXT,
    cost       REAL,
    details    TEXT,
    notes      TEXT
);

-- Snacks. INFERRED shape.
CREATE TABLE snack (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    cost_basis TEXT,
    status     TEXT,
    notes      TEXT
);

-- Vendor meals. INFERRED shape.
CREATE TABLE vendor_meal (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor     TEXT,
    count      INTEGER,
    cost       TEXT,
    notes      TEXT
);

-- ================================================================
-- MUSIC & RECEPTION PROGRAM
-- ================================================================
CREATE TABLE vendor_timeline (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    vendor_id   TEXT REFERENCES vendor(id) ON DELETE SET NULL,
    arrive_time TEXT,
    location    TEXT,
    contact     TEXT,
    notes       TEXT
);

CREATE TABLE reception_moment (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    moment_time TEXT,
    moment      TEXT,
    who         TEXT,
    notes       TEXT
);

CREATE TABLE speech (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    seq        TEXT,
    speaker    TEXT,
    role       TEXT,
    moment     TEXT,
    time_limit TEXT,
    notes      TEXT
);

CREATE TABLE entertainment (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    kind       TEXT,
    name       TEXT,
    contact    TEXT,
    cost       REAL,
    notes      TEXT
);

CREATE TABLE reception_song (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    moment     TEXT,
    song       TEXT,
    artist     TEXT,
    notes      TEXT
);

CREATE TABLE reception_playlist (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    title      TEXT,
    song       TEXT,
    artist     TEXT,
    genre      TEXT,
    assignment TEXT,
    must       INTEGER DEFAULT 0
);

CREATE TABLE music_request (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    song         TEXT,
    artist       TEXT
);

CREATE TABLE palette (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT
);

CREATE TABLE palette_color (
    id         TEXT PRIMARY KEY,
    palette_id TEXT NOT NULL REFERENCES palette(id) ON DELETE CASCADE,
    hex        TEXT NOT NULL,
    position   INTEGER
);

CREATE TABLE mood_photo (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    src        TEXT,
    caption    TEXT
);

CREATE TABLE mood_favorite (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    body       TEXT
);

CREATE TABLE mood_item (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    section      TEXT,
    item         TEXT,
    color_story  TEXT,
    vendor_match TEXT,
    finalized    TEXT,
    notes        TEXT
);

CREATE TABLE attire_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    category   TEXT,
    who        TEXT,
    status     TEXT,
    cost       TEXT,
    notes      TEXT
);

CREATE TABLE decor_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    category   TEXT,
    location   TEXT,
    status     TEXT,
    cost       TEXT,
    notes      TEXT
);

CREATE TABLE stationery_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    quantity   TEXT,
    status     TEXT,
    cost       TEXT,
    notes      TEXT
);

CREATE TABLE weekend_timeline_item (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    event_date  TEXT,
    start_time  TEXT,
    end_time    TEXT,
    event       TEXT,
    location    TEXT,
    host        TEXT,
    guest_group TEXT,
    attire      TEXT,
    status      TEXT,
    cost        TEXT,
    notes       TEXT
);

CREATE TABLE travel_accommodation (
    id               TEXT PRIMARY KEY,
    wedding_id       TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    guest            TEXT,
    guest_group      TEXT,
    arrival          TEXT,
    arrival_time     TEXT,
    departure        TEXT,
    hotel            TEXT,
    confirmation     TEXT,
    room_block       TEXT,
    transport_needed INTEGER DEFAULT 0,
    cost             TEXT,
    notes            TEXT
);

CREATE TABLE hotel_block (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    hotel      TEXT,
    address    TEXT,
    link       TEXT,
    block_name TEXT,
    rate       TEXT,
    cutoff     TEXT,
    reserved   TEXT,
    booked     TEXT,
    contact    TEXT,
    notes      TEXT
);

CREATE TABLE transportation_route (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    route_date   TEXT,
    pickup_time  TEXT,
    dropoff_time TEXT,
    pickup       TEXT,
    dropoff      TEXT,
    driver       TEXT,
    vehicle      TEXT,
    guest_group  TEXT,
    capacity     TEXT,
    status       TEXT,
    cost         TEXT,
    notes        TEXT
);

CREATE TABLE vip_care (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    person       TEXT,
    relationship TEXT,
    need         TEXT,
    helper       TEXT,
    phone        TEXT,
    location     TEXT,
    status       TEXT,
    notes        TEXT
);

CREATE TABLE event_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    event      TEXT,
    event_date TEXT,
    host       TEXT,
    location   TEXT,
    guests     TEXT,
    budget     TEXT,
    actual     TEXT,
    notes      TEXT
);

CREATE TABLE location_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name       TEXT,
    address    TEXT,
    contact    TEXT,
    phone      TEXT,
    arrival    TEXT,
    parking    TEXT,
    who        TEXT
);

CREATE TABLE contact_item (
    id           TEXT PRIMARY KEY,
    wedding_id   TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    name         TEXT,
    role         TEXT,
    category     TEXT,
    email        TEXT,
    phone        TEXT,
    company      TEXT,
    emergency    INTEGER DEFAULT 0,
    last_contact TEXT,
    notes        TEXT
);

CREATE TABLE vendor_compare (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category   TEXT,
    vendor_a   TEXT, quote_a REAL,
    vendor_b   TEXT, quote_b REAL,
    vendor_c   TEXT, quote_c REAL,
    decision   TEXT
);

CREATE TABLE homecoming_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category   TEXT,
    item       TEXT,
    status     TEXT,
    owner      TEXT,
    notes      TEXT
);

CREATE TABLE name_change_task (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    task       TEXT,
    done       INTEGER DEFAULT 0,
    notes      TEXT
);

CREATE TABLE honey_detail (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    section    TEXT,
    item       TEXT,
    timeline   TEXT,
    vendor     TEXT,
    status     TEXT,
    reference  TEXT,
    notes      TEXT
);

CREATE TABLE honey_transport (
    id            TEXT PRIMARY KEY,
    wedding_id    TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    kind          TEXT,
    leg           TEXT,
    leg_date      TEXT,
    depart_time   TEXT,
    arrival_time  TEXT,
    from_place    TEXT,
    to_place      TEXT,
    company       TEXT,
    flight        TEXT,
    ticket        TEXT,
    travelers     TEXT,
    seat_vehicle  TEXT,
    terminal_gate TEXT,
    arrive_by     TEXT,
    baggage       TEXT,
    cost          TEXT,
    status        TEXT,
    notes         TEXT
);

CREATE TABLE honey_itinerary (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    day_label  TEXT,
    plan       TEXT,
    notes      TEXT
);

CREATE TABLE hm_journal (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    entry_date TEXT,
    title      TEXT,
    entry      TEXT,
    grateful   TEXT
);

CREATE TABLE packing_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    item       TEXT,
    packed     INTEGER DEFAULT 0,
    notes      TEXT
);

CREATE TABLE essential_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category   TEXT,
    item       TEXT,
    packed     INTEGER DEFAULT 0,
    notes      TEXT
);

-- ================================================================
-- GAP TABLES (Track 0.1) — collections present in blankData()/
-- RELATIONAL_ARRAY_KEYS that the earlier schema pass missed.
-- ================================================================

-- Notes Details Tracker (data.notesDetails[]). CWP table 'notesDetails'.
CREATE TABLE notes_detail (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    title       TEXT,
    category    TEXT,
    tags        TEXT,                    -- comma-separated; kept as-is
    pinned      INTEGER DEFAULT 0,
    entry_date  TEXT,                    -- was `date`
    entry_time  TEXT,                    -- was `time`
    last_edited TEXT,
    status      TEXT,
    body        TEXT,                    -- was `note`
    next_step   TEXT,
    icon        TEXT
);

-- Wedding-day timeline moments (data.timeline[]).
-- Distinct from weekend_timeline_item (weekend logistics) and
-- vendor_timeline (vendor arrivals).
CREATE TABLE wedding_day_timeline_item (
    id          TEXT PRIMARY KEY,
    wedding_id  TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    start_time  TEXT,                    -- was `time`
    event       TEXT,
    location    TEXT,
    responsible TEXT,
    duration    TEXT,
    notes       TEXT
);

-- Video shot list (data.videoShotlist[]). Mirrors shotlist_item.
CREATE TABLE video_shotlist_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    section    TEXT,
    shot       TEXT,
    must_have  TEXT,
    people     TEXT,
    timing     TEXT,
    notes      TEXT
);

-- Honeymoon budget line items (data.hmBudgetItems[]).
-- The hmBudget summary object maps to misc_setting(scope='hmBudget').
CREATE TABLE hm_budget_item (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category   TEXT,
    item       TEXT,
    budgeted   REAL,
    actual     REAL,
    status     TEXT,
    notes      TEXT
);

-- Marriage-license helper (FEATURE-SPEC #7). 1:1 with wedding.
-- App supplies structure + validity math; the couple enters the facts
-- their county clerk gives them. No legal facts are hardcoded.
CREATE TABLE marriage_license (
    wedding_id           TEXT PRIMARY KEY REFERENCES wedding(id) ON DELETE CASCADE,
    state                TEXT,
    county               TEXT,
    waiting_period_days  INTEGER,        -- as told to them by the clerk
    validity_days        INTEGER,        -- valid window in days
    required_documents   TEXT,
    fee                  TEXT,
    appointment_required INTEGER DEFAULT 0,
    issued_date          TEXT,
    expires_date         TEXT,           -- derived from issued_date + validity_days
    filed                INTEGER DEFAULT 0,
    official_url         TEXT,
    notes                TEXT
);

-- Optional: customized email templates (only if the user edits the
-- built-in EMAIL_TEMPLATES). Built-ins live in code, not the DB.
CREATE TABLE email_template (
    id         TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
    category   TEXT,
    title      TEXT,
    subject    TEXT,
    body       TEXT
);

-- ================================================================
-- INDEXES on foreign keys
-- ================================================================
CREATE INDEX idx_venue_wedding       ON venue(wedding_id);
CREATE INDEX idx_note_wedding        ON note(wedding_id);
CREATE INDEX idx_misc_wedding        ON misc_setting(wedding_id);
CREATE INDEX idx_vendor_wedding      ON vendor(wedding_id);
CREATE INDEX idx_budcat_wedding      ON budget_category(wedding_id);
CREATE INDEX idx_buditem_budcat      ON budget_item(budget_category_id);
CREATE INDEX idx_payment_wedding     ON payment(wedding_id);
CREATE INDEX idx_payment_vendor      ON payment(vendor_id);
CREATE INDEX idx_payment_budcat      ON payment(budget_category_id);
CREATE INDEX idx_installment_payment ON payment_installment(payment_id);
CREATE INDEX idx_table_wedding       ON reception_table(wedding_id);
CREATE INDEX idx_guest_wedding       ON guest(wedding_id);
CREATE INDEX idx_guest_table         ON guest(table_id);
CREATE INDEX idx_companion_guest     ON guest_companion(guest_id);
CREATE INDEX idx_gevent_wedding      ON guest_event(wedding_id);
CREATE INDEX idx_gea_wedding         ON guest_event_assignment(wedding_id);
CREATE INDEX idx_gea_guest           ON guest_event_assignment(guest_id);
CREATE INDEX idx_gea_event           ON guest_event_assignment(event_id);
CREATE INDEX idx_party_wedding       ON party_member(wedding_id);
CREATE INDEX idx_party_guest         ON party_member(guest_id);
CREATE INDEX idx_gift_wedding        ON gift(wedding_id);
CREATE INDEX idx_gift_guest          ON gift(guest_id);
CREATE INDEX idx_task_wedding        ON task(wedding_id);
CREATE INDEX idx_subtask_task        ON task_subtask(task_id);
CREATE INDEX idx_plan_wedding        ON plan_item(wedding_id);
CREATE INDEX idx_cal_wedding         ON calendar_event(wedding_id);
CREATE INDEX idx_appt_wedding        ON appointment(wedding_id);
CREATE INDEX idx_appt_vendor         ON appointment(vendor_id);
CREATE INDEX idx_contract_wedding    ON contract(wedding_id);
CREATE INDEX idx_contract_vendor     ON contract(vendor_id);
CREATE INDEX idx_rental_wedding      ON rental(wedding_id);
CREATE INDEX idx_rental_vendor       ON rental(vendor_id);
CREATE INDEX idx_prayer_wedding      ON prayer_entry(wedding_id);
CREATE INDEX idx_counsel_wedding     ON counseling_session(wedding_id);
CREATE INDEX idx_scripture_wedding   ON scripture(wedding_id);
CREATE INDEX idx_corder_wedding      ON ceremony_order(wedding_id);
CREATE INDEX idx_cproc_wedding       ON ceremony_processional(wedding_id);
CREATE INDEX idx_crec_wedding        ON ceremony_recessional(wedding_id);
CREATE INDEX idx_cchk_wedding        ON ceremony_checklist(wedding_id);
CREATE INDEX idx_crd_wedding         ON ceremony_reception_detail(wedding_id);
CREATE INDEX idx_ctr_wedding         ON ceremony_tradition(wedding_id);
CREATE INDEX idx_shot_wedding        ON shotlist_item(wedding_id);
CREATE INDEX idx_menu_wedding        ON menu_item(wedding_id);
CREATE INDEX idx_bev_wedding         ON beverage(wedding_id);
CREATE INDEX idx_kids_wedding        ON kids_menu(wedding_id);
CREATE INDEX idx_place_wedding       ON place_setting(wedding_id);
CREATE INDEX idx_crental_wedding     ON catering_rental(wedding_id);
CREATE INDEX idx_snack_wedding       ON snack(wedding_id);
CREATE INDEX idx_vmeal_wedding       ON vendor_meal(wedding_id);
CREATE INDEX idx_vtl_wedding         ON vendor_timeline(wedding_id);
CREATE INDEX idx_vtl_vendor          ON vendor_timeline(vendor_id);
CREATE INDEX idx_rmoment_wedding     ON reception_moment(wedding_id);
CREATE INDEX idx_speech_wedding      ON speech(wedding_id);
CREATE INDEX idx_ent_wedding         ON entertainment(wedding_id);
CREATE INDEX idx_rsong_wedding       ON reception_song(wedding_id);
CREATE INDEX idx_rplay_wedding       ON reception_playlist(wedding_id);
CREATE INDEX idx_music_wedding       ON music_request(wedding_id);
CREATE INDEX idx_palette_wedding     ON palette(wedding_id);
CREATE INDEX idx_pcolor_palette      ON palette_color(palette_id);
CREATE INDEX idx_mphoto_wedding      ON mood_photo(wedding_id);
CREATE INDEX idx_mfav_wedding        ON mood_favorite(wedding_id);
CREATE INDEX idx_mitem_wedding       ON mood_item(wedding_id);
CREATE INDEX idx_attire_wedding      ON attire_item(wedding_id);
CREATE INDEX idx_decor_wedding       ON decor_item(wedding_id);
CREATE INDEX idx_stat_wedding        ON stationery_item(wedding_id);
CREATE INDEX idx_wkt_wedding         ON weekend_timeline_item(wedding_id);
CREATE INDEX idx_travel_wedding      ON travel_accommodation(wedding_id);
CREATE INDEX idx_hotel_wedding       ON hotel_block(wedding_id);
CREATE INDEX idx_tsp_wedding         ON transportation_route(wedding_id);
CREATE INDEX idx_vip_wedding         ON vip_care(wedding_id);
CREATE INDEX idx_event_wedding       ON event_item(wedding_id);
CREATE INDEX idx_loc_wedding         ON location_item(wedding_id);
CREATE INDEX idx_contact_wedding     ON contact_item(wedding_id);
CREATE INDEX idx_vcompare_wedding    ON vendor_compare(wedding_id);
CREATE INDEX idx_home_wedding        ON homecoming_item(wedding_id);
CREATE INDEX idx_namechg_wedding     ON name_change_task(wedding_id);
CREATE INDEX idx_hdetail_wedding     ON honey_detail(wedding_id);
CREATE INDEX idx_htrans_wedding      ON honey_transport(wedding_id);
CREATE INDEX idx_hitin_wedding       ON honey_itinerary(wedding_id);
CREATE INDEX idx_hmjournal_wedding   ON hm_journal(wedding_id);
CREATE INDEX idx_packing_wedding     ON packing_item(wedding_id);
CREATE INDEX idx_essential_wedding   ON essential_item(wedding_id);

-- Gap-table indexes (Track 0.1)
CREATE INDEX idx_notesdetail_wedding ON notes_detail(wedding_id);
CREATE INDEX idx_wdaytl_wedding      ON wedding_day_timeline_item(wedding_id);
CREATE INDEX idx_vshot_wedding       ON video_shotlist_item(wedding_id);
CREATE INDEX idx_hmbuditem_wedding   ON hm_budget_item(wedding_id);
CREATE INDEX idx_emailtpl_wedding    ON email_template(wedding_id);
