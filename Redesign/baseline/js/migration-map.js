/* ============================================================
   migration-map.js — Track 4.2 support
   ------------------------------------------------------------
   Machine-readable mirror of FIELD-MAPPING.md. Drives
   json-to-sqlite-migrate.js so the migration stays DRY.

   Each collection entry:
     jsonKey   – key on the `data` object
     table     – target SQL table
     alias     – { jsonField: sqlColumn } for columns whose names differ
     bool      – json fields stored as 0/1 in SQL
     refs      – { jsonField: {table, by, as} } name/id -> FK resolution
     nested    – { jsonField: {table, alias, parentCol} } child-table arrays
     skip      – json fields NOT copied (handled elsewhere / runtime only)
   Fields not listed in alias are copied 1:1 when a same-named column exists.
   ============================================================ */

const MIGRATION_SINGLETONS = {
  setup: {
    table: 'wedding',
    alias: {
      date: 'wedding_date', engaged: 'engaged_date', budget: 'budget_total',
      guests: 'guest_target', 'venue-ceremony': 'venue_ceremony',
      'venue-reception': 'venue_reception', costAdult: 'cost_adult',
      costChild: 'cost_child', costVenue: 'cost_venue', costCake: 'cost_cake',
      costBeverage: 'cost_beverage', bannerVerse: 'banner_verse',
      bannerRef: 'banner_ref', moodStatement: 'mood_statement'
    },
    // theme/font/darkMode/scriptureTranslation live in misc_setting
    misc: ['theme', 'font', 'darkMode', 'scriptureTranslation', 'photo', 'photoPos', 'timezone', 'locale', 'currency', 'dateFormat']
  },
  ceremony: { table: 'ceremony', alias: { start: 'start_time' } },
  honeymoon: {
    table: 'honeymoon',
    alias: { dest: 'destination', depart: 'depart_date', return: 'return_date', flightout: 'flight_out', flightback: 'flight_back', confirm: 'confirmation' }
  },
  cateringMeta: { table: 'catering_meta', alias: { serviceCharge: 'service_charge', taxRate: 'tax_rate' } },
  marriageLicense: {
    table: 'marriage_license', pk: 'wedding_id',
    alias: {
      waitingPeriodDays: 'waiting_period_days', validityDays: 'validity_days',
      requiredDocuments: 'required_documents', appointmentRequired: 'appointment_required',
      issuedDate: 'issued_date', expiresDate: 'expires_date', officialUrl: 'official_url'
    },
    bool: ['appointment_required', 'filed']
  }
};

// Dynamic-key objects -> misc_setting(scope, field, value)
const MIGRATION_MISC_OBJECTS = ['reception', 'vision', 'firstmonth', 'hmBudget', 'visionBoard', 'vendorPackets', 'partyPackets', 'coordPacket'];

// notes {general,family,vendors,marriage} -> note(kind, body)
const MIGRATION_NOTE_KINDS = ['general', 'family', 'vendors', 'marriage'];

// venue c-*/r-* -> venue(role, ...)
const MIGRATION_VENUE_FIELDS = ['name', 'contact', 'address', 'phone', 'capacity', 'hours', 'cost', 'setup', 'parking', 'food', 'cancel', 'other'];
const MIGRATION_VENUE_ALIAS = { setup: 'setup_time', food: 'food_rules', cancel: 'cancel_policy' };

const MIGRATION_COLLECTIONS = [
  // attrs stays JSON-first (category schema extras). Skip until vendor.attrs SQL/JSON column exists.
  { jsonKey: 'vendors', table: 'vendor', alias: { cat: 'category', contract: 'has_contract' }, bool: ['has_contract'], skip: ['attrs'] },
  { jsonKey: 'budget', table: 'budget_category', alias: { cat: 'name', target: 'target_pct' },
    nested: { items: { table: 'budget_item', alias: { due: 'due_date' }, bool: ['paid'], parentCol: 'budget_category_id' } } },
  { jsonKey: 'payments', table: 'payment',
    alias: { desc: 'descr', due: 'due_amount', paid: 'paid_amount', gratuityStatus: 'gratuity_status', budgetItem: 'budget_item', budgetItemId: 'budget_item_id', contractIdx: 'contract_idx', date: 'due_date', paiddate: 'paid_date', ptype: 'method' },
    refs: {
      vendor: { table: 'vendor', by: 'name', as: 'vendor_id' },
      budgetCat: { table: 'budget_category', by: 'name', as: 'budget_category_id' }
    },
    nested: { installments: { table: 'payment_installment', alias: { amountDue: 'amount_due', amountPaid: 'amount_paid', dueDate: 'due_date', paidDate: 'paid_date' }, parentCol: 'payment_id' } } },
  { jsonKey: 'guests', table: 'guest', alias: { plusone: 'plus_one', group: 'guest_group', inviteDecision: 'invite_decision' }, bool: ['plus_one', 'family', 'invited', 'thankyou'],
    refs: { table: { table: 'reception_table', by: 'name', as: 'table_id' } },
    nested: { companions: { table: 'guest_companion', parentCol: 'guest_id' } } },
  { jsonKey: 'tables', table: 'reception_table' },
  // guestEvents/guestEventAssignments are first-class (parents of assignments).
  // guest_event_assignment.guest_id / event_id are direct id copies (aliases,
  // not name refs) so ordering only needs guest + guest_event inserted first
  // (handled by the priority sort in migrateCollections()).
  { jsonKey: 'guestEvents', table: 'guest_event', bool: ['active'], emitId: 'id' },
  { jsonKey: 'guestEventAssignments', table: 'guest_event_assignment',
    alias: { guestId: 'guest_id', eventId: 'event_id', inviteDecision: 'invite_decision', inviteSent: 'invite_sent' },
    bool: ['invite_sent'] },
  { jsonKey: 'emailTemplates', table: 'email_template', alias: { cat: 'category' } },
  { jsonKey: 'tasks', table: 'task', alias: { task: 'title', cat: 'category', date: 'due_date', suggestedDue: 'suggested_due' },
    nested: { subtasks: { table: 'task_subtask', alias: { text: 'body' }, bool: ['done'], parentCol: 'task_id', keepId: false, orderCol: 'position' } } },
  { jsonKey: 'plan', table: 'plan_item', alias: { task: 'title', due: 'due_date' }, bool: ['done'] },
  { jsonKey: 'appointments', table: 'appointment', alias: { date: 'appt_date', time: 'appt_time', vendor: 'vendor_name', followup: 'followup_date' },
    refs: { vendor: { table: 'vendor', by: 'name', as: 'vendor_id' } } },
  { jsonKey: 'calendarEvents', table: 'calendar_event', alias: { date: 'event_date', time: 'event_time' } },
  { jsonKey: 'timeline', table: 'wedding_day_timeline_item', alias: { time: 'start_time' } },
  { jsonKey: 'vtimeline', table: 'vendor_timeline', alias: { time: 'arrive_time' }, refs: { vendor: { table: 'vendor', by: 'name', as: 'vendor_id' } } },
  { jsonKey: 'contracts', table: 'contract', alias: { where: 'location', type: 'doc_type', date: 'doc_date' }, refs: { vendor: { table: 'vendor', by: 'name', as: 'vendor_id' } } },
  { jsonKey: 'rentals', table: 'rental', alias: { pickup: 'pickup_date', ret: 'return_date' }, refs: { vendor: { table: 'vendor', by: 'name', as: 'vendor_id' } } },
  { jsonKey: 'gifts', table: 'gift', alias: { from: 'from_name', desc: 'descr', date: 'gift_date' }, bool: ['thankyou'] },
  { jsonKey: 'party', table: 'party_member', alias: { name: 'member_name' }, refs: { name: { table: 'guest', by: 'name', as: 'guest_id' } } },
  { jsonKey: 'notesDetails', table: 'notes_detail', alias: { date: 'entry_date', time: 'entry_time', lastEdited: 'last_edited', note: 'body', nextStep: 'next_step' }, bool: ['pinned'] },
  { jsonKey: 'scriptures', table: 'scripture', alias: { num: 'seq', fullPassage: 'body' } },
  { jsonKey: 'prayer', table: 'prayer_entry', alias: { date: 'entry_date' } },
  { jsonKey: 'counseling', table: 'counseling_session', alias: { num: 'seq', date: 'session_date' } },
  { jsonKey: 'shotlist', table: 'shotlist_item', alias: { must: 'must_have' } },
  { jsonKey: 'videoShotlist', table: 'video_shotlist_item', alias: { must: 'must_have' } },
  { jsonKey: 'ceremonyOrder', table: 'ceremony_order' },
  { jsonKey: 'ceremonyProcessional', table: 'ceremony_processional' },
  { jsonKey: 'ceremonyRecessional', table: 'ceremony_recessional' },
  { jsonKey: 'ceremonyChecklist', table: 'ceremony_checklist' },
  { jsonKey: 'ceremonyReceptionDetails', table: 'ceremony_reception_detail' },
  { jsonKey: 'ceremonyTraditions', table: 'ceremony_tradition' },
  { jsonKey: 'menu', table: 'menu_item', alias: { dish: 'item' } },
  { jsonKey: 'beverages', table: 'beverage', alias: { type: 'kind' } },
  { jsonKey: 'kidsMenu', table: 'kids_menu' },
  { jsonKey: 'placeSettings', table: 'place_setting' },
  { jsonKey: 'cateringRentals', table: 'catering_rental' },
  { jsonKey: 'snacks', table: 'snack' },
  { jsonKey: 'vendorMeals', table: 'vendor_meal' },
  { jsonKey: 'entertainment', table: 'entertainment', alias: { type: 'kind' } },
  { jsonKey: 'recSongs', table: 'reception_song' },
  { jsonKey: 'recMoments', table: 'reception_moment' },
  { jsonKey: 'speeches', table: 'speech' },
  { jsonKey: 'receptionPlaylist', table: 'reception_playlist' },
  { jsonKey: 'mustPlay', table: 'music_request', constant: { request_type: 'must' } },
  { jsonKey: 'doNotPlay', table: 'music_request', constant: { request_type: 'avoid' } },
  { jsonKey: 'palettes', table: 'palette', nested: { colors: { table: 'palette_color', parentCol: 'palette_id' } } },
  { jsonKey: 'moodPhotos', table: 'mood_photo' },
  { jsonKey: 'moodFavorites', table: 'mood_favorite' },
  { jsonKey: 'moodItems', table: 'mood_item' },
  { jsonKey: 'attire', table: 'attire_item' },
  { jsonKey: 'decor', table: 'decor_item' },
  { jsonKey: 'stationery', table: 'stationery_item' },
  { jsonKey: 'weekendTimeline', table: 'weekend_timeline_item' },
  { jsonKey: 'travelAccommodations', table: 'travel_accommodation' },
  { jsonKey: 'hotelBlocks', table: 'hotel_block' },
  { jsonKey: 'transportation', table: 'transportation_route' },
  { jsonKey: 'vipCare', table: 'vip_care' },
  { jsonKey: 'events', table: 'event_item' },
  { jsonKey: 'locations', table: 'location_item' },
  { jsonKey: 'contacts', table: 'contact_item' },
  { jsonKey: 'vendorCompare', table: 'vendor_compare' },
  { jsonKey: 'homecoming', table: 'homecoming_item' },
  { jsonKey: 'nameChange', table: 'name_change_task' },
  { jsonKey: 'honeyDetails', table: 'honey_detail' },
  { jsonKey: 'honeyTransport', table: 'honey_transport' },
  { jsonKey: 'honeyItinerary', table: 'honey_itinerary' },
  { jsonKey: 'hmJournal', table: 'hm_journal' },
  { jsonKey: 'hmBudgetItems', table: 'hm_budget_item' },
  { jsonKey: 'packing', table: 'packing_item' },
  { jsonKey: 'essentials', table: 'essential_item' }
];

if (typeof window !== 'undefined') {
  window.MIGRATION_SINGLETONS = MIGRATION_SINGLETONS;
  window.MIGRATION_COLLECTIONS = MIGRATION_COLLECTIONS;
  window.MIGRATION_MISC_OBJECTS = MIGRATION_MISC_OBJECTS;
  window.MIGRATION_NOTE_KINDS = MIGRATION_NOTE_KINDS;
  window.MIGRATION_VENUE_FIELDS = MIGRATION_VENUE_FIELDS;
  window.MIGRATION_VENUE_ALIAS = MIGRATION_VENUE_ALIAS;
}
