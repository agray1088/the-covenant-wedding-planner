/* Table Layout page — mock 8a · grouped assignments · rail · drawer · Plan | List | By guest */
(function () {
  'use strict';

  const TABLES_DRAWER_TABS = ['Table', 'Seats', 'Notes', 'History'];
  /* Plan · 8a columns — Diet lives on By guest as Nut · GF · Veg marks, not here. */
  const RD_TABLES_COLUMNS = [
    { key: 'guest', label: 'Guest', width: '190px', type: 'person' },
    { key: 'table', label: 'Table', width: '110px', type: 'link' },
    { key: 'seat', label: 'Seat', width: '80px', type: 'text' },
    { key: 'side', label: 'Side', width: '120px', type: 'select' },
    { key: 'group', label: 'Group', width: '170px', type: 'select' },
    { key: 'rsvp', label: 'RSVP', width: '120px', type: 'select' },
    { key: 'meal', label: 'Meal', width: '150px', type: 'select' }
  ];
  /* By guest · 29d — caterer / place-card sheet. Marks, not text. */
  const RD_TABLES_BYGUEST_COLUMNS = [
    { key: 'guest', label: 'Guest', width: '200px', type: 'person' },
    { key: 'table', label: 'Table', width: '72px', type: 'link' },
    { key: 'seat', label: 'Seat', width: '56px', type: 'text' },
    { key: 'side', label: 'Side', width: '90px', type: 'select' },
    { key: 'rsvp', label: 'Reply', width: '110px', type: 'select' },
    { key: 'meal', label: 'Meal', width: '120px', type: 'select' },
    { key: 'nut', label: 'Nut', width: '48px', type: 'mark' },
    { key: 'gf', label: 'GF', width: '48px', type: 'mark' },
    { key: 'veg', label: 'Veg', width: '48px', type: 'mark' },
    { key: 'placeCard', label: 'Place card', width: '88px', type: 'mark' }
  ];

  /* The table engine builds the header, group rows and select gutter from
     d.columns, so hiding a column means handing it a shorter list. */
  const TABLES_COL_SCOPE = 'table-assignments';
  if (window.rdColumns) {
    window.rdColumns.register(TABLES_COL_SCOPE, RD_TABLES_COLUMNS.slice(), () => {
      renderTablesAssignmentTable(currentTablesMountId());
      renderTablesAssignToolbar();
    });
  }
  function tablesVisibleColumns() {
    if (rdGetTablesView() === 'byguest') return RD_TABLES_BYGUEST_COLUMNS;
    return window.rdColumns ? window.rdColumns.visible(TABLES_COL_SCOPE) : RD_TABLES_COLUMNS;
  }
  /* The three views each mount the same table definition in a different host. */
  function currentTablesMountId() {
    const view = rdGetTablesView();
    if (view === 'byguest') return 'cwp-tables-byguest';
    return 'cwp-tables-assignments';
  }

  window._tablesUiFilters = window._tablesUiFilters || { side: 'all', group: 'all', table: 'all', rsvp: 'all' };
  window._tablesAssignSort = window._tablesAssignSort || 'table';
  window._tablesRailView = window._tablesRailView || 'all';
  window._tablesListGroupBy = window._tablesListGroupBy || 'table';

  if (!Array.isArray(data.tableAssignmentRows)) data.tableAssignmentRows = [];

  function tableRows() {
    return safeArray(data.tables).map((t, i) => {
      if (typeof normalizeTableRecord === 'function') normalizeTableRecord(t);
      return Object.assign(t, { _i: i });
    });
  }

  function tableCode(t, idx) {
    const n = String(t && t.name || '').trim();
    if (/^t?\d+$/i.test(n)) return 'T' + n.replace(/^t/i, '');
    if (/^table\s*\d+/i.test(n)) return 'T' + n.replace(/^table\s*/i, '');
    if (/kids|children/i.test(n)) return 'Kids';
    if (idx != null) return 'T' + (idx + 1);
    return 'T?';
  }

  function tableDisplayName(t) {
    const n = String(t && (t.label || t.displayName || t.name) || '').trim();
    if (!n) return 'Untitled table';
    if (/^t?\d+$/i.test(n) || /^table\s*\d+$/i.test(n)) return t.label || t.placement || 'Table';
    return typeof tableLabel === 'function' ? tableLabel(n) : n;
  }

  function tableCapacity(t) { return parseInt(t && (t.capacity || t.cap), 10) || 0; }

  function tableSeatedCount(t) {
    const key = typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : String(t.name || '');
    const map = typeof tableGuestMap === 'function' ? tableGuestMap() : {};
    const people = map[key] || [];
    return people.reduce((s, p) => s + 1 + (p.plus || 0) + (p.kids || 0), 0);
  }

  function guestsAtTable(tableName) {
    if (typeof seatedGuestsAtTable === 'function') return seatedGuestsAtTable(tableName);
    const key = typeof tableMatchKey === 'function' ? tableMatchKey(tableName) : String(tableName || '');
    return safeArray(data.guests).map((g, i) => ({ g, i })).filter(({ g }) =>
      (typeof tableMatchKey === 'function' ? tableMatchKey(g.table) : String(g.table || '')) === key
    );
  }

  function unseatedGuests() {
    return safeArray(data.guests).filter(g => {
      const k = typeof tableMatchKey === 'function' ? tableMatchKey(g && g.table) : String(g && g.table || '').trim();
      return !k;
    });
  }

  /* List · Not seated: accepted guests with no table (failure group, not a filter). */
  function notSeatedGuests() {
    return unseatedGuests().filter(g => {
      const r = String(g && g.rsvp || '').toLowerCase();
      return /accept|yes|attending/.test(r);
    });
  }

  function dietaryMarks(row) {
    const raw = String((row && (row.dietary || row.mealNote || row.restriction)) || '').toLowerCase();
    const meal = String((row && row.meal) || '').toLowerCase();
    const marks = [];
    if (/gluten|gf\b|coeliac|celiac/.test(raw)) marks.push({ key: 'gf', title: 'Gluten-free' });
    if (/nut|peanut|tree nut/.test(raw)) marks.push({ key: 'nut', title: 'Nut allergy' });
    if (/dairy|lactose|milk/.test(raw)) marks.push({ key: 'dairy', title: 'Dairy-free' });
    if ((/veggie|vegetarian/.test(raw) && !/vegan/.test(raw)) || /veg main|vegetarian/.test(meal)) {
      marks.push({ key: 'veg', title: 'Vegetarian' });
    }
    if (/vegan/.test(raw) || /vegan/.test(meal)) marks.push({ key: 'vegan', title: 'Vegan' });
    if (/shellfish|seafood|fish allergy/.test(raw)) marks.push({ key: 'shell', title: 'Shellfish' });
    if (/halal/.test(raw)) marks.push({ key: 'halal', title: 'Halal' });
    if (/kosher/.test(raw)) marks.push({ key: 'kosher', title: 'Kosher' });
    if (!marks.length && raw.trim()) marks.push({ key: 'other', title: raw.trim() });
    return marks;
  }

  /* ● confirmed · ○ suspected · — none. A blank is never “no restriction”. */
  function dietaryRestrictionState(row, kind) {
    const raw = String((row && (row.dietary || row.mealNote || row.restriction)) || '');
    const meal = String((row && row.meal) || '');
    const blob = (raw + ' ' + meal).toLowerCase();
    const status = String((row && (row.dietaryStatus || row.restrictionStatus)) || '').toLowerCase();
    let hit = false;
    if (kind === 'nut') hit = /nut|peanut/.test(blob);
    else if (kind === 'gf') hit = /gluten|gf\b|coeliac|celiac/.test(blob);
    else if (kind === 'veg') hit = /veggie|vegetarian|vegan|veg main/.test(blob);
    if (!hit) return 'none';
    if (row && row.dietaryConfirmed === false) return 'suspected';
    if (/suspect|await|unconfirm|\?/.test(status + ' ' + raw.toLowerCase())) return 'suspected';
    return 'confirmed';
  }

  function dietaryMarkGlyph(state) {
    if (state === 'confirmed') return '●';
    if (state === 'suspected') return '○';
    return '—';
  }

  function dietaryMarkCellHtml(row, kind, title) {
    if (row && (row._isEmpty || row._rowKind === 'empty')) {
      return '<td class="rd-tables-mark rd-guest-td--muted">—</td>';
    }
    const state = dietaryRestrictionState(row, kind);
    const glyph = dietaryMarkGlyph(state);
    const tip = state === 'confirmed' ? ('Confirmed · ' + title)
      : state === 'suspected' ? ('Suspected · ' + title + ' · awaiting confirmation')
      : 'None on file';
    return '<td class="rd-tables-mark" data-mark-state="' + state + '" title="' + escapeHtml(tip) + '">'
      + '<span class="rd-tables-mark__glyph" aria-label="' + escapeHtml(tip) + '">' + glyph + '</span></td>';
  }

  function guestHasAddressLocal(g) {
    if (typeof guestHasAddress === 'function') return guestHasAddress(g);
    return !!(String(g && (g.address1 || g.address) || '').trim()
      || String(g && g.city || '').trim()
      || String(g && g.zip || '').trim());
  }

  function guestIsInvitedLocal(g) {
    if (typeof guestIsInvited === 'function') return guestIsInvited(g);
    return !!(g && g.invited);
  }

  function guestPlaceCardReady(g, seated) {
    if (!seated) return false;
    const name = String(g && g.name || '').trim();
    if (!name || /^\(unnamed/i.test(name) || /^plus.?one$/i.test(name) || name === '—') return false;
    if (g && g.placeCard === false) return false;
    return true;
  }

  function tablesDietaryFlagCounts(guests) {
    let veg = 0, gf = 0, nut = 0;
    (guests || []).forEach(g => {
      const marks = dietaryMarks(g);
      if (marks.some(m => m.key === 'veg' || m.key === 'vegan')) veg += 1;
      if (marks.some(m => m.key === 'gf')) gf += 1;
      if (marks.some(m => m.key === 'nut')) nut += 1;
    });
    return { veg, gf, nut, total: veg + gf + nut };
  }

  /* Why N are unseated — derived from guest records, never hardcoded. */
  function tablesUnseatedReasons() {
    const unseated = unseatedGuests();
    let notInvited = 0;
    let noAddress = 0;
    let unnamedPlus = 0;
    let other = 0;
    unseated.forEach(g => {
      const name = String(g && g.name || '').trim();
      const isUnnamed = !name || /^\(unnamed/i.test(name) || /^plus.?one$/i.test(name) || /^guest\s*\+/i.test(name);
      const plusSlot = !!(g && (g.plusone || g.isPlusOne || /plus.?one/i.test(String(g.role || ''))));
      if (isUnnamed || plusSlot && isUnnamed) {
        unnamedPlus += 1;
        return;
      }
      if (!guestIsInvitedLocal(g)) {
        notInvited += 1;
        return;
      }
      if (!guestHasAddressLocal(g)) {
        noAddress += 1;
        return;
      }
      other += 1;
    });
    /* Master draws three meters that sum to the unseated count. Guests who
       are invited and addressed but still unseated fold into “No address”
       only when that is the gap; otherwise into “Not invited yet” as the
       remaining readiness blocker the rail names. */
    if (other) notInvited += other;
    return {
      unseated: unseated.length,
      notInvited,
      noAddress,
      unnamedPlus
    };
  }

  function tablesStatsData() {
    const rows = tableRows();
    const guests = safeArray(data.guests);
    const cap = rows.reduce((s, t) => s + tableCapacity(t), 0);
    const assigned = rows.reduce((s, t) => s + tableSeatedCount(t), 0);
    const free = Math.max(0, cap - assigned);
    const unseated = unseatedGuests().length;
    const shortBy = Math.max(0, unseated - free);
    const full = rows.filter(t => {
      const c = tableCapacity(t);
      return c > 0 && tableSeatedCount(t) >= c;
    }).length;
    const hasFree = rows.filter(t => {
      const c = tableCapacity(t);
      const s = tableSeatedCount(t);
      return c > 0 && s < c;
    }).length;
    const acceptedUnseated = notSeatedGuests().length;
    const mealChosen = guests.filter(g => String(g.meal || '').trim()).length;
    const mealOutstanding = Math.max(0, guests.length - mealChosen);
    const flags = tablesDietaryFlagCounts(guests);
    const placeReady = guests.filter(g => {
      const seated = !!(typeof tableMatchKey === 'function'
        ? tableMatchKey(g.table)
        : String(g.table || '').trim());
      return guestPlaceCardReady(g, seated);
    }).length;
    const reasons = tablesUnseatedReasons();
    return {
      tables: rows.length,
      seats: cap,
      assigned,
      free,
      unseated,
      shortBy,
      full,
      hasFree,
      venueMax: 160,
      roomFor: Math.max(0, 160 - cap),
      guestCount: guests.length,
      acceptedUnseated,
      mealChosen,
      mealOutstanding,
      dietaryFlags: flags.total,
      dietaryVeg: flags.veg,
      dietaryGf: flags.gf,
      dietaryNut: flags.nut,
      placeCardsReady: placeReady,
      reasons
    };
  }

  function ensureTablesDemoSeed() {
    // Demo fiction is opt-in via Load sample data only — empty stays empty.
    return;
    if (tableRows().length) return;
    const seed = [
      { name: '1', label: 'Head table', capacity: 10, shape: 'rect', group: 'Wedding party', notes: 'Nearest the stage · no children' },
      { name: '2', label: 'Asare & kids', capacity: 8, shape: 'circle', group: 'Family' },
      { name: '3', label: 'Church small group', capacity: 8, shape: 'circle', group: 'Community' },
      { name: '4', label: 'Mensah family', capacity: 8, shape: 'round', group: 'Family · bride', notes: 'Grandmother needs the chair nearest the door.' },
      { name: '5', label: "Groom's cousins", capacity: 8, shape: 'circle', group: 'Family' },
      { name: '6', label: 'University friends', capacity: 8, shape: 'circle', group: 'Friends' },
      { name: '7', label: 'Owusu & elders', capacity: 8, shape: 'circle', group: 'Community' },
      { name: '8', label: 'Work · bride', capacity: 8, shape: 'circle', group: 'Colleagues' },
      { name: '9', label: 'Nkrumah & colleagues', capacity: 8, shape: 'circle', group: 'Colleagues' },
      { name: '10', label: 'Work · groom', capacity: 8, shape: 'circle', group: 'Colleagues' },
      { name: '11', label: 'Amponsah & neighbours', capacity: 8, shape: 'circle', group: 'Community' },
      { name: '12', label: 'Church youth', capacity: 8, shape: 'circle', group: 'Community' },
      { name: '13', label: 'Family friends', capacity: 8, shape: 'circle', group: 'Friends' },
      { name: '14', label: 'Travelling guests', capacity: 8, shape: 'circle', group: 'Mixed' },
      { name: 'Kids', label: "Children's table", capacity: 6, shape: 'circle', group: 'Family' }
    ];
    seed.forEach(row => {
      if (typeof ensureRowId === 'function') ensureRowId(row, 'tables');
      data.tables.push(row);
    });
    if (typeof save === 'function') save();
  }

  function guestRsvpCell(rsvp) {
    const lab = String(rsvp || 'Pending').trim() || 'Pending';
    if (typeof guestRsvpPillHtml === 'function') return guestRsvpCellHtml(lab);
    const ok = /yes|accept/i.test(lab);
    return '<span class="status-pill ' + (ok ? 'pill-ok' : 'pill-warn') + '">' + escapeHtml(lab) + '</span>';
  }
  function guestRsvpCellHtml(lab) {
    return guestRsvpPillHtml(lab);
  }

  function refreshTableAssignmentRows() {
    const groupMode = window._tablesListGroupBy || 'table';
    const rows = [];
    const stats = tablesStatsData();
    const tables = tableRows();

    function pushGuest(g, gi, meta) {
      const seated = !!meta;
      rows.push({
        _id: 'tar-g-' + String(g._id || gi),
        _rowKind: 'guest',
        guestIndex: gi,
        displayName: g.name || '(unnamed guest)',
        tableLabel: meta ? meta.code : (typeof guestTableLabelShort === 'function' ? guestTableLabelShort(g.table) : g.table),
        seat: g.seat || g.seatNo || '—',
        side: g.side || '—',
        group: g.group || '—',
        role: g.role || '',
        household: g.household || '',
        rsvp: g.rsvp || 'Pending',
        meal: g.meal || '—',
        dietary: g.dietary || '',
        dietaryStatus: g.dietaryStatus || g.restrictionStatus || '',
        dietaryConfirmed: g.dietaryConfirmed,
        placeCardReady: guestPlaceCardReady(g, seated),
        tableKey: meta ? meta.key : '',
        tableMeta: meta || null,
        sideGroup: String(g.side || 'Mixed').trim() || 'Mixed'
      });
    }

    function pushEmpty(meta, seatNum) {
      rows.push({
        _id: 'tar-e-' + meta.key + '-' + seatNum,
        _rowKind: 'empty',
        guestIndex: null,
        displayName: 'Seat ' + seatNum + ' · empty',
        tableLabel: meta.code,
        seat: seatNum,
        side: '—',
        group: '—',
        rsvp: '—',
        meal: '—',
        dietary: '',
        tableKey: meta.key,
        tableMeta: meta,
        sideGroup: '—',
        _isEmpty: true
      });
    }

    if (groupMode === 'guest') {
      tables.forEach((t, ti) => {
        const cap = tableCapacity(t);
        const seatedN = tableSeatedCount(t);
        const meta = {
          key: typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : String(t.name),
          code: tableCode(t, ti),
          name: tableDisplayName(t),
          capacity: cap,
          seated: seatedN,
          free: Math.max(0, cap - seatedN)
        };
        guestsAtTable(t.name).forEach(({ g, i }) => pushGuest(g, i, meta));
      });
      /* Caterer export includes every guest — unseated sit after seated tables. */
      unseatedGuests().forEach((g, i) => {
        const gi = data.guests.indexOf(g);
        pushGuest(g, gi >= 0 ? gi : i, null);
      });
      data.tableAssignmentRows = rows;
      return rows;
    }

    tables.forEach((t, ti) => {
      const cap = tableCapacity(t);
      const seatedN = tableSeatedCount(t);
      const meta = {
        key: typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : String(t.name),
        code: tableCode(t, ti),
        name: tableDisplayName(t),
        capacity: cap,
        seated: seatedN,
        free: Math.max(0, cap - seatedN),
        sort: ti
      };
      const atTable = guestsAtTable(t.name);
      atTable.forEach(({ g, i }) => pushGuest(g, i, meta));
      if (cap > seatedN) {
        for (let s = seatedN + 1; s <= cap; s++) pushEmpty(meta, s);
      }
    });

    /* List · Not seated last — accepted guests with no table only. */
    notSeatedGuests().forEach((g, i) => {
      const gi = data.guests.indexOf(g);
      pushGuest(g, gi >= 0 ? gi : i, null);
    });

    data.tableAssignmentRows = rows;
    return rows;
  }

  function tablesAssignmentRowGroupMeta(row) {
    const mode = window._tablesListGroupBy || 'table';
    /* By guest · 29d is a flat caterer sheet — no side groups. */
    if (mode === 'guest') {
      return null;
    }
    if (!row.tableMeta) {
      const n = notSeatedGuests().length;
      const free = tablesStatsData().free;
      return {
        key: '__unseated__',
        title: 'Not seated',
        sort: '\uffff',
        residual: true,
        unseatedN: n,
        freeSeats: free
      };
    }
    const m = row.tableMeta;
    return {
      key: 'table:' + m.key,
      title: m.code + ' · ' + m.name,
      sort: String(m.sort != null ? m.sort : m.code).padStart(3, '0'),
      residual: false,
      meta: m
    };
  }

  function tablesAssignmentGroupHeader(meta, groupRows) {
    const items = groupRows || [];
    const rows = items.map(it => (it && it.r != null ? it.r : it));
    if (meta && meta.key === '__unseated__') {
      const n = rows.length;
      const free = tablesStatsData().free;
      return 'Not seated · ' + n + ' accepted · only ' + free + ' free seats on the plan';
    }
    const m = (meta && meta.meta) || (rows[0] && rows[0].tableMeta);
    if (!m) return (meta && meta.title) || 'Group';
    const seated = m.seated != null ? m.seated : rows.filter(r => r._rowKind === 'guest').length;
    const guests = rows.filter(r => r._rowKind === 'guest');
    const flags = tablesDietaryFlagCounts(guests);
    const dietBit = flags.total
      ? (flags.veg + flags.gf + flags.nut) + ' dietary'
      : 'no dietary conflicts';
    if (m.free > 0) {
      return m.code + ' · ' + m.name + ' · ' + seated + ' of ' + m.capacity + ' seated · ' + m.free + ' free · ' + dietBit;
    }
    return m.code + ' · ' + m.name + ' · ' + seated + ' of ' + m.capacity + ' seated · ' + dietBit;
  }

  function tablesMatchesRailView(row) {
    const view = window._tablesRailView || 'all';
    if (view === 'all') return true;
    if (view === 'unseated') return !row.tableMeta;
    if (view === 'free') return row.tableMeta && row.tableMeta.free > 0;
    if (view === 'full') return row.tableMeta && row.tableMeta.capacity > 0 && row.tableMeta.free === 0;
    return true;
  }

  function tablesMatchesFilters(row) {
    if (!tablesMatchesRailView(row)) return false;
    const ui = window._tablesUiFilters || {};
    if (ui.side && ui.side !== 'all' && String(row.side || '') !== ui.side) return false;
    if (ui.group && ui.group !== 'all' && String(row.group || '') !== ui.group) return false;
    if (ui.table && ui.table !== 'all') {
      if (ui.table === 'unseated') {
        if (row.tableMeta) return false;
      } else {
        const key = String(row.tableKey || (row.tableMeta && row.tableMeta.key) || '');
        if (key !== String(ui.table)) return false;
      }
    }
    if (ui.rsvp && ui.rsvp !== 'all') {
      const r = String(row.rsvp || '').toLowerCase();
      const want = String(ui.rsvp).toLowerCase();
      if (want === 'accepted' && !/accept|yes|attending/i.test(r)) return false;
      if (want === 'pending' && !/pending|no response|await/i.test(r)) return false;
      if (want === 'declined' && !/declin|no\b|regret/i.test(r)) return false;
    }
    return true;
  }

  function tablesAssignmentSortRows(a, b) {
    const mode = window._tablesAssignSort || 'table';
    if (mode === 'unseated') {
      const ua = a.tableMeta ? 1 : 0;
      const ub = b.tableMeta ? 1 : 0;
      if (ua !== ub) return ua - ub;
    }
    if (mode === 'side') {
      const cmp = String(a.side || '').localeCompare(String(b.side || ''));
      if (cmp) return cmp;
    }
    if (mode === 'guest' || mode === 'name') {
      return String(a.displayName || '').localeCompare(String(b.displayName || ''));
    }
    const sa = a.tableMeta ? (a.tableMeta.sort != null ? a.tableMeta.sort : 0) : 9999;
    const sb = b.tableMeta ? (b.tableMeta.sort != null ? b.tableMeta.sort : 0) : 9999;
    if (sa !== sb) return sa - sb;
    if (a._isEmpty && !b._isEmpty) return 1;
    if (!a._isEmpty && b._isEmpty) return -1;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  }

  function registerTablesCwp() {
    if (typeof CWP === 'undefined' || !CWP.registerEntity) return;
    CWP.registerEntity('tableAssignmentRows', {
      array: () => data.tableAssignmentRows || [],
      label: 'Seat assignment',
      labelField: 'displayName',
      prefix: 'TAR'
    });
    if (CWP.TABLES.tableAssignments) return;
    CWP.registerTable('tableAssignments', {
      entity: 'tableAssignmentRows',
      title: 'Table assignments',
      mount: 'cwp-tables-assignments',
      search: false,
      filters: [],
      bulk: { enabled: true, actions: ['edit'] },
      rowClickEdit: false,
      hideToolbar: true,
      pageSize: 0,
      recordLabel: 'Guest',
      rowGroup: r => tablesAssignmentRowGroupMeta(r),
      groupHeader: (meta, groupRows) => tablesAssignmentGroupHeader(meta, groupRows),
      extraFilter: r => tablesMatchesFilters(r),
      sortRows: (a, b) => tablesAssignmentSortRows(a, b),
      afterChange: () => {
        renderTablesStats();
        renderTablesToolbar();
        renderTablesBulkBar();
        if (typeof renderContextSidebar === 'function' && document.body.getAttribute('data-active-panel') === 'tables') {
          renderContextSidebar('tables');
        }
      },
      afterRender: () => {
        bindTablesAssignmentRows();
        rdApplyTablesDrawerRowFocus();
        rdApplyTablesRowHeight();
        appendTablesAssignmentAddRow();
      },
      columns: RD_TABLES_COLUMNS.map(c => ({ key: c.key, label: c.label, width: c.width })),
      rowRender: r => tablesAssignmentRowHtml(r)
    });
  }

  /* One cell per visible column, so hiding a column drops its data too. */
  function tablesAssignmentCellHtml(r, key) {
    const empty = r._isEmpty || r._rowKind === 'empty';
    switch (key) {
      case 'guest': return empty
        ? '<td class="rd-tables-sticky"><span class="rd-tables-empty-seat">' + escapeHtml(r.displayName) + '</span></td>'
        : '<td class="rd-party-td--name rd-tables-sticky"><strong>' + escapeHtml(r.displayName) + '</strong></td>';
      case 'table': return !r.tableMeta
        ? '<td class="rd-tables-unseated">—</td>'
        : '<td>' + escapeHtml(r.tableLabel || '—') + '</td>';
      case 'seat': return '<td style="text-align:right;font-variant-numeric:tabular-nums;">'
        + escapeHtml(String(r.seat != null ? r.seat : '—')) + '</td>';
      case 'side': return '<td class="rd-guest-td--muted">' + escapeHtml(r.side || '—') + '</td>';
      case 'group': return '<td class="rd-guest-td--muted">' + escapeHtml(r.group || '—') + '</td>';
      case 'rsvp': return '<td>' + (empty || r.rsvp === '—' ? '<span class="rd-guest-td--muted">—</span>' : guestRsvpCell(r.rsvp)) + '</td>';
      case 'meal': return '<td class="rd-guest-td--muted">' + escapeHtml(r.meal || '—') + '</td>';
      case 'nut': return dietaryMarkCellHtml(r, 'nut', 'Nut allergy');
      case 'gf': return dietaryMarkCellHtml(r, 'gf', 'Gluten-free');
      case 'veg': return dietaryMarkCellHtml(r, 'veg', 'Vegetarian');
      case 'placeCard': {
        if (empty) return '<td class="rd-tables-mark rd-guest-td--muted">—</td>';
        const ready = !!r.placeCardReady;
        return '<td class="rd-tables-mark" data-mark-state="' + (ready ? 'ready' : 'none') + '" title="'
          + (ready ? 'Place card ready' : 'Place card not ready') + '">'
          + '<span class="rd-tables-mark__glyph">' + (ready ? '✓' : '—') + '</span></td>';
      }
      default: return '';
    }
  }

  function tablesAssignmentRowHtml(r) {
    return tablesVisibleColumns().map(c => tablesAssignmentCellHtml(r, c.key)).join('');
  }

  function rdGetTablesView() {
    try {
      const v = localStorage.getItem('rdTablesView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default')) || 'plan';
      return (v === 'list' || v === 'byguest') ? v : 'plan';
    } catch (e) { return 'plan'; }
  }
  function rdSetTablesView(mode) {
    const m = (mode === 'list' || mode === 'byguest') ? mode : 'plan';
    window._tablesListGroupBy = m === 'byguest' ? 'guest' : 'table';
    try { localStorage.setItem('rdTablesView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default'), m); } catch (e) {}
    renderTables();
  }

  function tablesPageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetTablesView();
    const fullEd = `<button type="button" class="rd-btn" data-rd-full-editor onclick="rdTablesFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>`;
    if (view === 'list') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print place cards</button>
        ${fullEd}
        <button type="button" class="rd-btn" onclick="tablesExportAssignments('list')">Export</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="tablesAddTable()">Add table</button>`;
    }
    if (view === 'byguest') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print place cards</button>
        ${fullEd}
        <button type="button" class="rd-btn" onclick="tablesExportAssignments('caterer')">Export for caterer</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="tablesAddTable()">Add table</button>`;
    }
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="typeof autoSeatHouseholds==='function'&&autoSeatHouseholds()||showToast('Auto-seat households')">Auto-seat households</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      ${fullEd}
      <button type="button" class="rd-btn" onclick="showToast('Place cards — print run')">Place cards</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="tablesAddTable()">+ New table</button>`;
  }

  function tablesExportAssignments(kind) {
    const rows = refreshTableAssignmentRows() || [];
    const guests = rows.filter(r => r._rowKind === 'guest');
    if (typeof showToast === 'function') {
      showToast(kind === 'caterer'
        ? ('Export for caterer · ' + guests.length + ' guest rows')
        : ('Export · ' + guests.length + ' assignment rows'));
    }
  }

  function tablesSurfaceRowHtml() {
    return `<div class="rd-surface__row" id="tables-surface-row">
      <div class="rd-surface__main" id="tables-view-host">
        <div class="rd-view" id="tables-view-plan" data-tables-view="plan">
          <div class="rd-tables-plan-scroll">
            <div class="rd-tables-seat-grid" id="tables-seat-grid"></div>
            <div class="rd-tables-shortfall" id="tables-shortfall"></div>
            <div class="rd-tables-section-head" id="tables-floor-head">
              <div class="rd-tables-section-head__title">Reception floor plan</div>
              <div class="rd-tables-section-head__sub" id="tables-floor-sub">Grace Hall ballroom · drag a table to move it, drag a guest onto a seat to assign</div>
              <div class="rd-tables-floor-actions">
                <button type="button" class="rd-btn rd-btn--quiet" id="table-edit-layout-btn" onclick="toggleTableEditMode()">Edit Layout</button>
                <span class="rd-tables-zoom" aria-label="Zoom controls">
                  <button type="button" class="rd-btn rd-btn--quiet" onclick="setTableZoom(-.1)" aria-label="Zoom out">−</button>
                  <span id="table-zoom-label">100%</span>
                  <button type="button" class="rd-btn rd-btn--quiet" onclick="setTableZoom(.1)" aria-label="Zoom in">+</button>
                </span>
                <button type="button" class="rd-btn rd-btn--quiet" onclick="toggleTableMapFull()" title="Expand floor plan">Expand</button>
                <button type="button" class="rd-link-quiet" onclick="typeof resetTableLayout==='function'&&resetTableLayout()||showToast('Reset to venue plan')">Reset to venue plan</button>
              </div>
            </div>
            <div id="seating-guest-pool" class="rd-tables-guest-pool" aria-label="Unseated guests — drag onto tables"></div>
            <div class="rd-tables-floor-wrap table-layout-floor-card" id="tables-floor-card">
              <div class="table-map-viewport" id="table-map-viewport"><div id="table-map"></div></div>
              <div class="rd-tables-floor-legend" id="tables-floor-legend"></div>
            </div>
            <div class="rd-tables-section-head" id="tables-assign-head">
              <div class="rd-tables-section-head__title">Table assignments</div>
              <div class="rd-tables-section-head__sub" id="tables-assign-sub"></div>
              <button type="button" class="rd-link-quiet" id="tables-assign-autoseat" onclick="typeof autoSeatGuests==='function'&&autoSeatGuests()||showToast('Auto-seat the remaining guests')">Auto-seat the remaining</button>
            </div>
            <div class="rd-toolbar rd-tables-assign-toolbar" id="tables-assign-toolbar" aria-label="Table assignments filters"></div>
            <div class="rd-bulkbar" id="tables-assign-bulk" hidden></div>
            <div class="rd-table-wrap ued-table-wrap" id="cwp-tables-assignments"></div>
            <div class="rd-tables-section-head">
              <div class="rd-tables-section-head__title">Table detail cards</div>
              <div class="rd-tables-section-head__sub">One card per table · edit the name, capacity and who sits there without leaving the plan</div>
              <button type="button" class="rd-link-quiet" onclick="printCurrentPage()">Print all cards</button>
            </div>
            <div class="rd-tables-detail-grid" id="tables-detail-grid"></div>
          </div>
        </div>
        <div class="rd-view" id="tables-view-list" data-tables-view="list" hidden>
          <div class="rd-tables-section-head">
            <div class="rd-tables-section-head__title">Table assignments</div>
            <div class="rd-tables-section-head__sub" id="tables-list-assign-sub">Auditing seat assignments, dietary spread and the unseated tail</div>
          </div>
          <div class="rd-bulkbar" id="tables-list-bulk" hidden></div>
          <div class="rd-tables-audit" id="tables-list-audit" aria-label="Table layout list audit"></div>
        </div>
        <div class="rd-view" id="tables-view-byguest" data-tables-view="byguest" hidden>
          <div class="rd-tables-section-head">
            <div class="rd-tables-section-head__title">By guest</div>
            <div class="rd-tables-section-head__sub" id="tables-byguest-sub">The caterer’s sheet — seat, meal and restriction on one line</div>
            <button type="button" class="rd-link-quiet" onclick="tablesExportAssignments('caterer')">Export for the caterer</button>
          </div>
          <div class="rd-tables-byguest-legend" id="tables-byguest-legend"></div>
          <div class="rd-bulkbar" id="tables-byguest-bulk" hidden></div>
          <div class="rd-table-wrap ued-table-wrap" id="cwp-tables-byguest"></div>
        </div>
      </div>
      <div id="tables-drawer-slot"></div>
    </div>`;
  }

  function uedTablesShell() {
    const panel = document.getElementById('panel-tables');
    if (!panel) return;
    panel.classList.add('ued-scope', 'tables-mockup');
    if (panel.dataset.uedShell === 'tables-rd8a-v3') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = tablesPageheadActionsHtml();
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    panel.dataset.uedShell = 'tables-rd8a-v3';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">People</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Table Layout</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${tablesPageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="tables-stats"></div>
      <div class="rd-toolbar" id="tables-toolbar"></div>
      <div class="rd-bulkbar" id="tables-bulk-bar" hidden></div>
      <div class="rd-surface">${tablesSurfaceRowHtml()}</div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderTablesStats() {
    const host = document.getElementById('tables-stats');
    if (!host) return;
    const s = tablesStatsData();
    const view = rdGetTablesView();
    let cells;
    if (view === 'list') {
      cells = [
        { label: 'Tables', value: s.tables, filter: 'Show all tables' },
        { label: 'Seats used', value: s.assigned + ' of ' + s.guestCount, filter: 'Show seating' },
        { label: 'Free seats', value: s.free, filter: 'Filter · Free seats' },
        {
          label: 'Accepted, unseated',
          value: s.acceptedUnseated,
          filter: 'Not seated',
          attention: s.acceptedUnseated > 0 ? 'seat before place cards print' : undefined,
          onFilter: () => {
            window._tablesUiFilters = window._tablesUiFilters || {};
            window._tablesUiFilters.table = 'unseated';
            if (typeof renderTables === 'function') renderTables();
          }
        },
        {
          label: 'Dietary flags',
          value: s.dietaryFlags,
          filter: 'Dietary shown',
          attention: s.dietaryFlags
            ? (s.dietaryVeg + ' vegetarian · ' + s.dietaryGf + ' GF · ' + s.dietaryNut + ' nut')
            : undefined
        }
      ];
    } else if (view === 'byguest') {
      cells = [
        { label: 'Guests', value: s.guestCount, filter: 'Show all guests' },
        { label: 'Seated', value: s.assigned, filter: 'Filter · Assigned' },
        {
          label: 'Meal chosen',
          value: s.mealChosen,
          filter: 'Meal outstanding',
          attention: s.mealOutstanding > 0 ? (s.mealOutstanding + ' outstanding') : undefined
        },
        { label: 'Dietary flags', value: s.dietaryFlags, filter: 'Dietary shown' },
        {
          label: 'Place cards ready',
          value: s.placeCardsReady + ' of ' + s.assigned,
          filter: 'Place cards'
        }
      ];
    } else {
      cells = [
        { label: 'Tables', value: s.tables, filter: 'Show all tables' },
        { label: 'Seats', value: s.seats, filter: 'Show seating' },
        { label: 'Assigned', value: s.assigned, filter: 'Filter · Assigned' },
        { label: 'Free seats', value: s.free, filter: 'Filter · Free seats' },
        {
          label: 'Short by',
          value: s.shortBy,
          filter: 'Not seated',
          attention: s.shortBy > 0 ? 'Accepted guests with no table' : undefined,
          onFilter: () => {
            window._tablesUiFilters = window._tablesUiFilters || {};
            window._tablesUiFilters.table = 'unseated';
            if (typeof renderTables === 'function') renderTables();
            else if (typeof window.__tablesRenderRd === 'function') window.__tablesRenderRd();
          }
        }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, cells);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${label}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = cells.map(c => cell(c.label, c.value, c.attention ? 'warn' : '')).join('');
  }

  function tablesFilterChip(label, field) {
    const ui = window._tablesUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    let display = cur;
    if (field === 'rsvp' && on) display = cur.charAt(0).toUpperCase() + cur.slice(1);
    if (field === 'table' && cur === 'unseated') display = 'unseated';
    const text = on ? (label + ': ' + display) : (label + ': all');
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="openTablesFilter('${field}',this)">${escapeHtml(text)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();clearTablesFilter('${field}')">&#10005;</span>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>`)
      + `</button>`;
  }

  function tablesSortLabel() {
    const mode = window._tablesAssignSort || 'table';
    if (mode === 'guest' || mode === 'name') return 'Sort by guest';
    if (mode === 'side') return 'Sort by side';
    if (mode === 'unseated') return 'Unseated first';
    return 'Sort by table';
  }

  function renderTablesToolbar() {
    const host = document.getElementById('tables-toolbar');
    if (!host) return;
    const view = rdGetTablesView();
    const seatSize = 8;
    const switcher =
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Table layout view">` +
      `<button type="button" class="rd-viewswitch__item${view === 'plan' ? ' is-active' : ''}" onclick="rdSetTablesView('plan')">Plan</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'list' ? ' is-active' : ''}" onclick="rdSetTablesView('list')">List</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'byguest' ? ' is-active' : ''}" onclick="rdSetTablesView('byguest')">By guest</button>` +
      `</div></div>`;
    if (view === 'list') {
      const dietOn = !!(window._tablesUiFilters && window._tablesUiFilters.dietary === 'shown');
      host.innerHTML =
        tablesFilterChip('Table', 'table') +
        tablesFilterChip('Side', 'side') +
        `<button type="button" class="rd-chip${dietOn ? ' is-active' : ''}" onclick="tablesToggleDietaryShown()">Dietary shown${dietOn ? '<span class="rd-chip__clear" onclick="event.stopPropagation();tablesToggleDietaryShown(false)">&#10005;</span>' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="openTablesSort(this)">${escapeHtml(tablesSortLabel())}</button>` +
        switcher;
      return;
    }
    if (view === 'byguest') {
      const s = tablesStatsData();
      host.innerHTML =
        tablesFilterChip('Table', 'table') +
        `<span class="rd-tables-legend-note">${s.guestCount} rows · sticky first column · ● confirmed restriction, ○ suspected, — none</span>` +
        switcher;
      return;
    }
    host.innerHTML =
      tablesFilterChip('Side', 'side') +
      tablesFilterChip('Group', 'group') +
      `<span class="rd-chip rd-chip--ghost">Seat size · ${seatSize}</span>` +
      `<span class="rd-tables-legend"><span class="rd-tables-legend__sq is-filled"></span>Assigned</span>` +
      `<span class="rd-tables-legend"><span class="rd-tables-legend__sq"></span>Free</span>` +
      switcher;
    renderTablesAssignToolbar();
  }

  function tablesToggleDietaryShown(force) {
    window._tablesUiFilters = window._tablesUiFilters || {};
    if (force === false) window._tablesUiFilters.dietary = 'all';
    else if (force === true) window._tablesUiFilters.dietary = 'shown';
    else window._tablesUiFilters.dietary = window._tablesUiFilters.dietary === 'shown' ? 'all' : 'shown';
    renderTables();
  }

  function renderTablesAssignToolbar() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(TABLES_COL_SCOPE) : 'Columns';
    const colAllShown = window.rdColumns ? window.rdColumns.allShown(TABLES_COL_SCOPE) : true;
    const html =
      tablesFilterChip('Table', 'table') +
      tablesFilterChip('Side', 'side') +
      tablesFilterChip('RSVP', 'rsvp') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="openTablesSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${escapeHtml(tablesSortLabel())}</button>` +
      `<button type="button" class="rd-chip${colAllShown ? ' rd-chip--ghost' : ''}" onclick="rdTablesOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${escapeHtml(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip" onclick="rdTablesAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>` +
      `<button type="button" class="rd-chip" onclick="rdCycleTablesRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${escapeHtml(rdTablesRowHeightLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>`;
    ['tables-assign-toolbar'].forEach(id => {
      const host = document.getElementById(id);
      if (host) host.innerHTML = html;
    });
  }

  function tablesFilterOptions(field) {
    if (field === 'side') {
      return ['all', 'Bride', 'Groom', 'Both'].map(s => ({ value: s, label: s === 'all' ? 'All sides' : s }));
    }
    if (field === 'group') {
      const groups = ['all'].concat([...new Set(safeArray(data.guests).map(g => g.group).filter(Boolean))].sort());
      return groups.map(g => ({ value: g, label: g === 'all' ? 'All groups' : g }));
    }
    if (field === 'rsvp') {
      return [
        { value: 'all', label: 'All RSVPs' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'pending', label: 'Pending' },
        { value: 'declined', label: 'Declined' }
      ];
    }
    if (field === 'table') {
      const opts = [
        { value: 'all', label: 'All tables' },
        { value: 'unseated', label: 'Unseated' }
      ];
      tableRows().forEach((t, i) => {
        const key = typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : String(t.name || '');
        const label = tableCode(t, i) + ' · ' + tableDisplayName(t);
        opts.push({ value: key || String(t.name || i), label });
      });
      return opts;
    }
    return [{ value: 'all', label: 'All' }];
  }

  function openTablesFilter(field, btn) {
    const opts = tablesFilterOptions(field);
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._tablesUiFilters[field] || 'all', val => {
        window._tablesUiFilters[field] = val || 'all';
        renderTables();
      });
      return;
    }
    const pick = opts.find(o => o.value !== 'all');
    if (pick) { window._tablesUiFilters[field] = pick.value; renderTables(); }
  }
  function clearTablesFilter(field) {
    window._tablesUiFilters[field] = 'all';
    renderTables();
  }

  function openTablesSort(btn) {
    const opts = [
      { value: 'table', label: 'Sort by table' },
      { value: 'guest', label: 'Sort by guest' },
      { value: 'side', label: 'Sort by side' },
      { value: 'unseated', label: 'Unseated first' }
    ];
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._tablesAssignSort || 'table', val => {
        window._tablesAssignSort = val || 'table';
        renderTables();
      });
      return;
    }
    const order = opts.map(o => o.value);
    const idx = order.indexOf(window._tablesAssignSort || 'table');
    window._tablesAssignSort = order[(idx + 1) % order.length];
    renderTables();
  }

  function tablesBulkBarHtml(countId) {
    return `<span class="rd-bulkbar__count"><span data-bulk-count>0</span> selected</span>
      <span class="rd-bulkbar__sep">|</span>
      <button type="button" class="rd-bulkbar__action" onclick="showToast('Move to a table')">Move to a table</button>
      <button type="button" class="rd-bulkbar__action" onclick="showToast('Seat together')">Seat together</button>
      <button type="button" class="rd-bulkbar__action" onclick="showToast('Unseat selected')">Unseat</button>
      <button type="button" class="rd-bulkbar__action" onclick="printCurrentPage()">Print place cards</button>
      <button type="button" class="rd-bulkbar__clear" onclick="tablesBulkClear()">Clear selection</button>`;
  }

  function renderTablesBulkBar() {
    ['tables-bulk-bar', 'tables-assign-bulk', 'tables-list-bulk', 'tables-byguest-bulk'].forEach(id => {
      const bar = document.getElementById(id);
      if (!bar) return;
      const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('tableAssignments') : [];
      const n = ids.length;
      if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      if (!bar.innerHTML) bar.innerHTML = tablesBulkBarHtml();
      const cnt = bar.querySelector('[data-bulk-count]');
      if (cnt) cnt.textContent = String(n);
    });
  }

  function tablesBulkClear() {
    if (window.CWP && CWP.state && CWP.state.tableAssignments && CWP.state.tableAssignments.sel) {
      CWP.state.tableAssignments.sel.clear();
    }
    renderTablesBulkBar();
  }

  function tablesDietLabelForGuest(g) {
    const marks = dietaryMarks(g);
    if (!marks.length) return 'No restriction';
    if (marks.some(m => m.key === 'nut')) return 'Nut allergy';
    if (marks.some(m => m.key === 'gf')) return 'Gluten-free';
    if (marks.some(m => m.key === 'veg' || m.key === 'vegan')) {
      const n = marks.filter(m => m.key === 'veg' || m.key === 'vegan').length;
      return n > 1 ? n + ' vegetarian' : (marks[0].key === 'vegan' ? 'Vegan' : '1 vegetarian');
    }
    return marks[0].title || 'Restriction on file';
  }

  function tablesDietLabelForHousehold(guests) {
    const flags = tablesDietaryFlagCounts(guests);
    if (!flags.total) return 'No restriction';
    const bits = [];
    if (flags.nut) bits.push(flags.nut === 1 ? 'Nut allergy' : flags.nut + ' nut');
    if (flags.gf) bits.push(flags.gf === 1 ? '1 gluten-free' : flags.gf + ' gluten-free');
    if (flags.veg) bits.push(flags.veg === 1 ? '1 vegetarian' : flags.veg + ' vegetarian');
    return bits.join(' · ') || 'Restriction on file';
  }

  function tablesAuditMetaForGuest(g, seat) {
    const role = String(g.role || '').trim();
    const side = String(g.side || '').trim();
    const seatTxt = seat != null && seat !== '—' ? ('seat ' + seat) : 'no seat yet';
    if (role) return role + ' · ' + seatTxt;
    if (side && side !== '—') return side + ' · ' + seatTxt;
    return seatTxt;
  }

  function tablesListAuditGroupHeader(t, ti, atTable, free) {
    const cap = tableCapacity(t);
    const seated = atTable.length;
    const code = tableCode(t, ti);
    const name = tableDisplayName(t);
    const flags = tablesDietaryFlagCounts(atTable.map(x => x.g));
    const pending = atTable.filter(({ g }) => /pending|no response|await/i.test(String(g.rsvp || ''))).length;
    let roll;
    if (free > 0) roll = seated + ' of ' + cap + ' seated · ' + free + ' seat' + (free === 1 ? '' : 's') + ' free';
    else if (pending) roll = seated + ' of ' + cap + ' seated · ' + pending + ' unreplied';
    else if (flags.total) roll = seated + ' of ' + cap + ' seated · ' + flags.total + ' dietary';
    else roll = seated + ' of ' + cap + ' seated · no dietary conflicts';
    if (ti === 0 || /head|top/i.test(name + ' ' + code)) {
      return escapeHtml((/head|top/i.test(name) ? 'Top table' : (code + ' · ' + name))) + '<span class="rd-tables-audit-group__roll">' + escapeHtml(roll) + '</span>';
    }
    return escapeHtml(code + ' · ' + name) + '<span class="rd-tables-audit-group__roll">' + escapeHtml(roll) + '</span>';
  }

  function tablesListAuditRowsHtml(entries) {
    return entries.map(entry => {
      const statusClass = entry.status === 'Free' ? 'is-free'
        : entry.status === 'Unseated' || entry.status === 'Needs a table' || entry.status === 'Waiting' ? 'is-unseated'
        : 'is-seated';
      const open = entry.guestIndex != null
        ? ` onclick="typeof covInlineLoad==='function'&&covInlineLoad('guests',${entry.guestIndex},'record-drawer-body',null,{scroll:false})"`
        : (entry.tableIndex != null ? ` onclick="tablesOpenTableDrawer(${entry.tableIndex})"` : '');
      return `<button type="button" class="rd-tables-audit-row ${statusClass}"${open}>
        <span class="rd-tables-audit-row__name">${escapeHtml(entry.name)}</span>
        <span class="rd-tables-audit-row__meta">${escapeHtml(entry.meta)}</span>
        <span class="rd-tables-audit-row__diet">${escapeHtml(entry.diet)}</span>
        <span class="rd-tables-audit-row__status">${escapeHtml(entry.status)}</span>
      </button>`;
    }).join('');
  }

  function renderTablesListAudit() {
    const host = document.getElementById('tables-list-audit');
    if (!host) return;
    const ui = window._tablesUiFilters || {};
    const dietOnly = ui.dietary === 'shown';
    const tables = tableRows();
    const parts = [];

    tables.forEach((t, ti) => {
      const key = typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : String(t.name || '');
      if (ui.table && ui.table !== 'all' && ui.table !== 'unseated' && key !== String(ui.table)) return;
      if (ui.table === 'unseated') return;
      const atTable = guestsAtTable(t.name).filter(({ g }) => {
        if (ui.side && ui.side !== 'all' && String(g.side || '') !== ui.side) return false;
        if (dietOnly && !dietaryMarks(g).length) return false;
        return true;
      });
      const cap = tableCapacity(t);
      const seatedN = tableSeatedCount(t);
      const free = Math.max(0, cap - seatedN);
      const byHousehold = {};
      atTable.forEach(({ g, i }) => {
        const hk = String(g.household || g.name || i);
        if (!byHousehold[hk]) byHousehold[hk] = [];
        byHousehold[hk].push({ g, i });
      });
      const entries = [];
      Object.keys(byHousehold).forEach(hk => {
        const group = byHousehold[hk];
        if (group.length === 1) {
          const { g, i } = group[0];
          entries.push({
            name: g.name || '(unnamed guest)',
            meta: tablesAuditMetaForGuest(g, g.seat || g.seatNo || '—'),
            diet: /officiant/i.test(String(g.role || '') + ' ' + String(g.notes || ''))
              ? 'Not a catering cover'
              : tablesDietLabelForGuest(g),
            status: 'Seated',
            guestIndex: i,
            tableIndex: ti
          });
          return;
        }
        const seats = group.map(({ g }) => g.seat || g.seatNo).filter(Boolean);
        const seatSpan = seats.length
          ? ('seats ' + seats[0] + (seats.length > 1 ? '–' + seats[seats.length - 1] : ''))
          : (group.length + ' seated');
        const roleHint = group[0].g.role || (group[0].g.household ? (group[0].g.household + ' household') : 'Household');
        entries.push({
          name: (group[0].g.household || group[0].g.name || 'Household') + ' · ' + group.length,
          meta: String(roleHint).replace(/household/i, '').trim()
            ? (String(group[0].g.notes || group[0].g.role || 'household').slice(0, 40) + ' · ' + seatSpan)
            : seatSpan,
          diet: tablesDietLabelForHousehold(group.map(x => x.g)),
          status: 'Seated',
          guestIndex: group[0].i,
          tableIndex: ti
        });
      });
      for (let s = seatedN + 1; s <= cap; s++) {
        entries.push({
          name: '—',
          meta: 'seat ' + s + ' · empty',
          diet: 'Held for late reply',
          status: 'Free',
          tableIndex: ti
        });
      }
      if (!entries.length && dietOnly) return;
      parts.push(`<section class="rd-tables-audit-group">
        <header class="rd-tables-audit-group__head">${tablesListAuditGroupHeader(t, ti, atTable, free)}</header>
        <div class="rd-tables-audit-group__body">${tablesListAuditRowsHtml(entries)}</div>
      </section>`);
    });

    /* Not seated is a group, not a filter — accepted-but-unseated cannot fall out of view. */
    if (ui.table !== 'unseated') {
      /* table groups already pushed above */
    } else {
      parts.length = 0;
    }
    {
      let unseatedAccepted = notSeatedGuests();
      let unreplied = unseatedGuests().filter(g => {
        const r = String(g.rsvp || '').toLowerCase();
        return !/accept|yes|attending|declin|no\b|regret/.test(r);
      });
      if (ui.side && ui.side !== 'all') {
        unseatedAccepted = unseatedAccepted.filter(g => String(g.side || '') === ui.side);
        unreplied = unreplied.filter(g => String(g.side || '') === ui.side);
      }
      if (dietOnly) {
        unseatedAccepted = unseatedAccepted.filter(g => dietaryMarks(g).length);
        unreplied = unreplied.filter(g => dietaryMarks(g).length);
      }
      const byHh = {};
      unseatedAccepted.forEach(g => {
        const gi = data.guests.indexOf(g);
        const hk = String(g.household || g.name || gi);
        if (!byHh[hk]) byHh[hk] = [];
        byHh[hk].push({ g, i: gi });
      });
      const entries = [];
      Object.keys(byHh).forEach(hk => {
        const group = byHh[hk];
        const label = group.length > 1
          ? ((group[0].g.household || group[0].g.name || 'Household') + ' · ' + group.length)
          : (group[0].g.name || '(unnamed guest)');
        entries.push({
          name: label,
          meta: /accept/i.test(String(group[0].g.rsvp || '')) ? 'Accepted' : String(group[0].g.rsvp || 'Pending'),
          diet: tablesDietLabelForHousehold(group.map(x => x.g)),
          status: 'Needs a table',
          guestIndex: group[0].i
        });
      });
      if (unreplied.length) {
        entries.push({
          name: unreplied.length + ' guest' + (unreplied.length === 1 ? '' : 's'),
          meta: 'No reply',
          diet: '—',
          status: 'Waiting'
        });
      }
      const nAcc = unseatedAccepted.length;
      const nWait = unreplied.length;
      const head = 'Not seated<span class="rd-tables-audit-group__roll">'
        + escapeHtml((nAcc + nWait) + ' guests · ' + nWait + ' unreplied, ' + nAcc + ' accepted with no table')
        + '</span>';
      if (ui.table === 'unseated' || nAcc || nWait || !parts.length) {
        parts.push(`<section class="rd-tables-audit-group is-residual">
          <header class="rd-tables-audit-group__head">${head}</header>
          <div class="rd-tables-audit-group__body">${tablesListAuditRowsHtml(entries)}</div>
        </section>`);
      }
    }

    host.innerHTML = parts.join('') || '<p class="rd-help">No tables to audit yet.</p>';
  }

  function renderTablesByGuestLegend() {
    const host = document.getElementById('tables-byguest-legend');
    if (!host) return;
    const s = tablesStatsData();
    host.innerHTML = `<span>${s.guestCount} rows · sticky first column</span>
      <span class="rd-tables-byguest-legend__marks"><b>●</b> confirmed restriction · <b>○</b> suspected, awaiting confirmation · <b>—</b> none on file</span>`;
  }

  function renderTablesSeatGrid() {
    const host = document.getElementById('tables-seat-grid');
    if (!host) return;
    const tables = tableRows();
    host.innerHTML = tables.map((t, i) => {
      const cap = tableCapacity(t);
      const seated = tableSeatedCount(t);
      const free = Math.max(0, cap - seated);
      const warn = free > 0;
      const selected = recordEditorState && recordEditorState.key === 'tables' && recordEditorState.index === i;
      const squares = [];
      for (let s = 0; s < cap; s++) {
        squares.push('<span class="rd-tables-seat-sq' + (s < seated ? ' is-filled' : '') + '"></span>');
      }
      return `<button type="button" class="rd-tables-seat-card${warn ? ' has-free' : ''}${selected ? ' is-selected' : ''}" data-table-idx="${i}" onclick="tablesOpenTableDrawer(${i})">
        <div class="rd-tables-seat-card__head">
          <b>${escapeHtml(tableCode(t, i))}</b>
          <span class="rd-tables-seat-card__name">${escapeHtml(tableDisplayName(t))}</span>
          <span class="rd-tables-seat-card__count${warn ? ' is-warn' : ''}">${seated}/${cap || '?'}</span>
        </div>
        <div class="rd-tables-seat-card__grid">${squares.join('')}</div>
      </button>`;
    }).join('');
  }

  function renderTablesShortfall() {
    const host = document.getElementById('tables-shortfall');
    if (!host) return;
    const s = tablesStatsData();
    if (s.shortBy <= 0) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false;
    const needTables = Math.ceil(s.shortBy / 8);
    host.innerHTML = `<span class="rd-tables-shortfall__label">${s.shortBy} seats short</span>
      <span class="rd-tables-shortfall__text">${s.unseated} guests are unseated and only ${s.free} seats are free. Three more eight-seat tables would cover it and Grace Hall has room for ${s.roomFor}.</span>
      <button type="button" class="rd-btn rd-btn--primary rd-tables-shortfall__btn" onclick="tablesAddTables(${needTables})">Add ${needTables} tables</button>`;
  }

  function renderTablesFloorLegend() {
    const host = document.getElementById('tables-floor-legend');
    if (!host) return;
    host.innerHTML = `<span><span class="rd-tables-floor-legend__head"></span>Head table</span>
      <span><span class="rd-tables-floor-legend__round"></span>Full</span>
      <span><span class="rd-tables-floor-legend__round is-free"></span>Has free seats</span>
      <span class="rd-tables-floor-legend__hint">Drag to move · double-click to rename · ⌫ to remove an empty table</span>`;
  }

  function renderTablesAssignSub() {
    const s = tablesStatsData();
    const totalGuests = safeArray(data.guests).length;
    const txt = s.assigned + ' of ' + (totalGuests || s.assigned + s.unseated) + ' guests seated · every row is a guest record, so an RSVP change moves the seat';
    ['tables-assign-sub', 'tables-list-assign-sub'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    });
    const auto = document.getElementById('tables-assign-autoseat');
    if (auto) {
      const n = s.unseated;
      auto.textContent = n > 0 ? ('Auto-seat the remaining ' + n) : 'All guests seated';
      auto.hidden = n <= 0;
    }
  }

  function renderTablesDetailGrid() {
    const host = document.getElementById('tables-detail-grid');
    if (!host) return;
    const tables = tableRows();
    const byTable = typeof tableGuestMap === 'function' ? tableGuestMap() : {};
    const cards = tables.map((t, i) => {
      const cap = tableCapacity(t);
      const seated = tableSeatedCount(t);
      const free = Math.max(0, cap - seated);
      const over = cap > 0 && seated > cap;
      const pct = cap > 0 ? Math.min(100, Math.round(seated / cap * 100)) : 0;
      const people = byTable[typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : t.name] || [];
      const chips = people.length
        ? people.map(p => {
            const extra = [];
            if (p.plus) extra.push('+1');
            if (p.kids) extra.push('+' + p.kids + ' kid' + (p.kids > 1 ? 's' : ''));
            return `<span class="rd-tables-guest-chip">${escapeHtml(p.name)}${extra.length ? ' <em>' + escapeHtml(extra.join(', ')) + '</em>' : ''}</span>`;
          }).join('')
        : '<span class="rd-tables-empty">No guests assigned yet</span>';
      const type = typeof tableType === 'function' ? tableType(t) : (t.type || 'guest');
      const vip = typeof tableIsVip === 'function' ? tableIsVip(t) : !!t.vip;
      const label = typeof tableLabel === 'function' ? tableLabel(t.name) : (t.name || 'Table');
      const typeOpts = [
        ['guest', 'Guest Table'],
        ['head', 'Head Table'],
        ['sweetheart', 'Sweetheart Table'],
        ['parents', 'Parents Table']
      ].map(([opt, lab]) => `<option value="${opt}" ${type === opt ? 'selected' : ''}>${lab}</option>`).join('');
      const presetOpts = typeof tablePresetOptions === 'function'
        ? tablePresetOptions(t.preset || '')
        : '<option value="">Custom size / shape</option>';
      const facingOpts = ['down', 'up', 'left', 'right'].map(opt =>
        `<option value="${opt}" ${(t.facing || 'down') === opt ? 'selected' : ''}>Chairs ${opt}</option>`
      ).join('');
      const guide = typeof tablePresetGuide === 'function' ? tablePresetGuide(t.preset) : '';
      return `<article class="rd-tables-detail-card${free ? ' has-free' : ''}${vip ? ' is-vip' : ''}${over ? ' is-over' : ''}" data-table-idx="${i}">
        <div class="rd-tables-detail-card__head">
          <span class="rd-tables-detail-card__label">${vip ? '<span class="rd-tables-detail-card__crown" title="VIP table">♛</span>' : ''}${escapeHtml(label)}</span>
          <span class="rd-tables-detail-card__count${over ? ' is-over' : (free ? ' is-warn' : '')}">${seated} of ${cap || '?'} seated</span>
          <button type="button" class="rd-tables-detail-card__del" onclick="removeTable(${i})" aria-label="Remove table">✕</button>
        </div>
        <div class="rd-tables-detail-card__body">
          <label class="rd-tables-detail-field">
            <span>Name / number</span>
            <input type="text" value="${escapeHtml(t.name || '')}" placeholder="e.g. 3 or Head Table"
              oninput="tablesUpdateField(${i},'name',this.value)">
          </label>
          <div class="rd-tables-detail-seatrow">
            <span class="rd-tables-detail-seatcount${over ? ' is-over' : ''}">${seated} of ${cap || '?'} seated</span>
            <label class="rd-tables-detail-field rd-tables-detail-field--inline">
              <span>Seats</span>
              <input type="number" min="1" value="${cap || ''}"
                oninput="tablesUpdateField(${i},'capacity',this.value)">
            </label>
          </div>
          <div class="rd-tables-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
          <label class="rd-tables-detail-field">
            <span>Table Type</span>
            <select onchange="tablesUpdateField(${i},'type',this.value)">${typeOpts}</select>
          </label>
          <label class="rd-tables-detail-field">
            <span>Size &amp; Shape</span>
            <select onchange="tablesUpdateField(${i},'preset',this.value)">${presetOpts}</select>
          </label>
          <label class="rd-tables-detail-field">
            <span>Chair Side</span>
            <select onchange="tablesUpdateField(${i},'facing',this.value)">${facingOpts}</select>
          </label>
          <label class="rd-tables-vip-toggle">
            <span class="rd-tables-vip-toggle__row">
              <input type="checkbox" ${vip ? 'checked' : ''} onchange="tablesUpdateField(${i},'vip',this.checked)">
              <span class="rd-tables-vip-toggle__text">VIP Table</span>
            </span>
          </label>
          ${guide ? `<p class="rd-tables-preset-guide">${escapeHtml(guide)}</p>` : '<p class="rd-tables-preset-guide">The reception floor plan uses this Size &amp; Shape for the table footprint. Seats sets how many chairs are drawn.</p>'}
          <label class="rd-tables-detail-field">
            <span>Group</span>
            <input type="text" value="${escapeHtml(t.group || '')}" placeholder="e.g. Family · bride"
              oninput="tablesUpdateField(${i},'group',this.value)">
          </label>
          <label class="rd-tables-detail-field">
            <span>Placement note</span>
            <input type="text" value="${escapeHtml(t.placement || '')}" placeholder="e.g. Faces the outdoor windows"
              oninput="tablesUpdateField(${i},'placement',this.value)">
          </label>
          <div class="rd-tables-detail-field">
            <span>Seated guests</span>
            <div class="rd-tables-detail-seated">${chips}</div>
          </div>
        </div>
        <div class="rd-tables-detail-card__foot">
          <button type="button" class="rd-link-quiet" onclick="tablesOpenTableDrawer(${i})">Seat a guest</button>
          <button type="button" class="rd-link-quiet" onclick="printCurrentPage()">Print card</button>
          <button type="button" class="rd-link-quiet" onclick="tablesOpenTableDrawer(${i})">Open drawer</button>
          <span class="rd-tables-detail-card__status">${free ? free + ' free' : 'Full'}</span>
        </div>
      </article>`;
    }).join('');
    host.innerHTML = cards
      + `<div class="rd-tables-detail-add-wrap">
          <button type="button" class="rd-tables-detail-add" onclick="tablesAddTable()">+ Add a table</button>
          <div class="rd-tables-special-actions">
            <button type="button" class="rd-btn rd-btn--quiet" onclick="addSpecialTable('head')">+ Head table</button>
            <button type="button" class="rd-btn rd-btn--quiet" onclick="addSpecialTable('sweetheart-rect')">+ Sweetheart Rectangle</button>
            <button type="button" class="rd-btn rd-btn--quiet" onclick="addSpecialTable('sweetheart-circle')">+ Sweetheart Circle</button>
            <button type="button" class="rd-btn rd-btn--quiet" onclick="addSpecialTable('parents')">+ Parents table</button>
          </div>
        </div>`;
  }

  function tablesUpdateField(i, key, val) {
    if (key === 'capacity' && data.tables[i]) {
      const seated = tableSeatedCount(data.tables[i]);
      const next = Math.max(1, parseInt(val, 10) || 1);
      if (next < seated) {
        const at = guestsAtTable(data.tables[i].name);
        const displaced = at.slice(next).map(({ g }) => g.name || '(unnamed)').filter(Boolean);
        const msg = 'Capacity cannot drop below ' + seated + ' — that would unseat '
          + (displaced.length ? displaced.join(', ') : (seated - next) + ' guests') + '.';
        if (typeof covAlert === 'function') covAlert(msg);
        else if (typeof showToast === 'function') showToast(msg);
        renderTablesDetailGrid();
        return;
      }
    }
    if (typeof updateTable === 'function') {
      updateTable(i, key, val);
      /* Soft refresh — don't rebuild while typing name/note */
      if (['capacity', 'type', 'shape', 'vip', 'preset', 'facing'].includes(key)) {
        renderTablesSeatGrid();
        renderTablesShortfall();
        renderTablesStats();
        if (typeof renderTableMap === 'function') renderTableMap();
        refreshTableAssignmentRows();
        const view = rdGetTablesView();
        if (view === 'plan') renderTablesAssignmentTable('cwp-tables-assignments');
        if (view === 'list') renderTablesListAudit();
        if (view === 'byguest') renderTablesAssignmentTable('cwp-tables-byguest');
        renderTablesDetailGrid();
      } else {
        renderTablesSeatGrid();
        renderTablesStats();
        if (typeof renderTableMap === 'function') renderTableMap();
        const cardEl = document.querySelector('.rd-tables-detail-card[data-table-idx="' + i + '"]');
        if (cardEl && data.tables[i]) {
          const seated = tableSeatedCount(data.tables[i]);
          const cap = tableCapacity(data.tables[i]);
          const countTxt = seated + ' of ' + (cap || '?') + ' seated';
          cardEl.querySelectorAll('.rd-tables-detail-card__count, .rd-tables-detail-seatcount').forEach(el => {
            el.textContent = countTxt;
          });
          const lab = cardEl.querySelector('.rd-tables-detail-card__label');
          if (lab && key === 'name') {
            const vip = typeof tableIsVip === 'function' ? tableIsVip(data.tables[i]) : !!data.tables[i].vip;
            const label = typeof tableLabel === 'function' ? tableLabel(data.tables[i].name) : data.tables[i].name;
            lab.innerHTML = (vip ? '<span class="rd-tables-detail-card__crown" title="VIP table">♛</span>' : '') + escapeHtml(label);
          }
        }
      }
      return;
    }
    if (!data.tables[i]) return;
    data.tables[i][key] = val;
    if (typeof save === 'function') save();
    renderTables();
  }

  function rdEnsureTablesAssignmentLayout(mountId) {
    registerTablesCwp();
    refreshTableAssignmentRows();
    const d = CWP.TABLES.tableAssignments;
    if (!d) return;
    if (!d._rdBackup) {
      d._rdBackup = {
        columns: d.columns, rowRender: d.rowRender, sortRows: d.sortRows,
        afterRender: d.afterRender, afterChange: d.afterChange, pageSize: d.pageSize,
        extraFilter: d.extraFilter, rowGroup: d.rowGroup, groupHeader: d.groupHeader,
        hideToolbar: d.hideToolbar, mount: d.mount
      };
    }
    d.mount = mountId || 'cwp-tables-assignments';
    d.hideToolbar = true;
    d.pageSize = 0;
    /* Re-read on every render so the chooser takes effect immediately. */
    d.columns = tablesVisibleColumns().map(c => ({ key: c.key, label: c.label, width: c.width, type: c.type || undefined }));
    /* By guest is a flat caterer sheet; Plan assignments keep table groups. */
    if (rdGetTablesView() === 'byguest') {
      d.rowGroup = null;
      d.groupHeader = null;
    } else {
      d.rowGroup = r => tablesAssignmentRowGroupMeta(r);
      d.groupHeader = (meta, groupRows) => tablesAssignmentGroupHeader(meta, groupRows);
    }
    d._rdActive = true;
  }

  function renderTablesAssignmentTable(mountId) {
    if (typeof cwpRenderTable !== 'function') return;
    rdEnsureTablesAssignmentLayout(mountId);
    refreshTableAssignmentRows();
    const wrap = document.getElementById(mountId);
    const all = (data.tableAssignmentRows || []);
    const total = all.length;
    const shown = all.filter(tablesMatchesFilters).length;
    const ui = window._tablesUiFilters || {};
    const filterOn = ['side', 'group', 'table', 'rsvp'].some(k => ui[k] && ui[k] !== 'all');
    if (typeof RdStates !== 'undefined' && RdStates.applyOverlay && wrap &&
        RdStates.applyOverlay(wrap, {
          pageId: 'tables',
          total: total,
          filtered: shown,
          filterOn: filterOn,
          onClear: function () {
            window._tablesUiFilters = { side: 'all', group: 'all', table: 'all', rsvp: 'all' };
            if (typeof renderTablesRd === 'function') renderTablesRd();
            else renderTablesAssignmentTable(mountId || currentTablesMountId());
          }
        })) {
      return;
    }
    cwpRenderTable('tableAssignments', mountId);
    bindTablesAssignmentRows();
    rdApplyTablesDrawerRowFocus();
    rdApplyTablesRowHeight();
    appendTablesAssignmentAddRow(mountId);
    if (wrap) {
      wrap.classList.toggle('rd-tables-byguest', mountId === 'cwp-tables-byguest');
      const table = wrap.querySelector('table');
      if (table) table.classList.toggle('rd-tables-sticky-guest', mountId === 'cwp-tables-byguest');
    }
    if (wrap && wrap.dataset.rdBulkBound !== '1') {
      wrap.dataset.rdBulkBound = '1';
      wrap.addEventListener('change', ev => {
        if (ev.target && ev.target.type === 'checkbox') setTimeout(renderTablesBulkBar, 0);
      });
    }
  }

  function appendTablesAssignmentAddRow(mountId) {
    mountId = mountId || 'cwp-tables-assignments';
    const wrap = document.getElementById(mountId);
    if (!wrap) return;
    const tb = wrap.querySelector('#cwp-tbody-tableAssignments') || wrap.querySelector('tbody');
    if (!tb || tb.querySelector('tr.cwp-empty')) return;
    tb.querySelectorAll('[data-tables-add-row]').forEach(r => r.remove());
    const span = wrap.querySelectorAll('thead th').length;
    if (!span) return;
    const tr = document.createElement('tr');
    tr.className = 'rd-tables-add-row';
    tr.setAttribute('data-tables-add-row', '1');
    tr.innerHTML = '<td style="text-align:center;color:#cfc6b4">+</td><td colspan="' + (span - 1) + '" style="color:#b09f80;cursor:pointer">Seat a guest — type a name, then a table</td>';
    tr.addEventListener('click', () => { if (typeof showPanel === 'function') showPanel('guests'); });
    tb.appendChild(tr);
  }

  function bindTablesAssignmentRows() {
    ['cwp-tables-assignments', 'cwp-tables-byguest'].forEach(mountId => {
      const preview = document.getElementById(mountId);
      if (!preview) return;
      preview.querySelectorAll('tr[data-id]').forEach(tr => {
        if (tr.dataset.tablesInlineBound === '1') return;
        tr.dataset.tablesInlineBound = '1';
        tr.addEventListener('click', event => {
          if (event.target.closest('input,select,textarea,button,a,label,.cwp-sel,.cwp-rowsel')) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const id = tr.getAttribute('data-id');
          const row = safeArray(data.tableAssignmentRows).find(r => String(r._id) === String(id));
          if (!row) return;
          if (row._rowKind === 'guest' && row.guestIndex != null) {
            covInlineLoad('guests', row.guestIndex, 'record-drawer-body', null, { scroll: false });
            if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
              window.covenantShell.openDrawer('guests', row.guestIndex);
            }
          } else if (row.tableMeta) {
            const ti = tableRows().findIndex(t =>
              (typeof tableMatchKey === 'function' ? tableMatchKey(t.name) : t.name) === row.tableMeta.key
            );
            if (ti >= 0) tablesOpenTableDrawer(ti);
          }
        }, true);
      });
    });
  }

  function rdApplyTablesViewMode() {
    const mode = rdGetTablesView();
    window._tablesListGroupBy = mode === 'byguest' ? 'guest' : 'table';
    ['plan', 'list', 'byguest'].forEach(v => {
      const el = document.getElementById('tables-view-' + v);
      if (el) el.hidden = mode !== v;
    });
  }

  function rdTablesRowHeightKey() {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':tables';
  }
  function rdTablesRowHeightLabel() {
    try { return localStorage.getItem(rdTablesRowHeightKey()) || 'compact'; } catch (e) { return 'compact'; }
  }
  function rdCycleTablesRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const cur = rdTablesRowHeightLabel();
    const idx = order.indexOf(cur);
    const next = order[(idx < 0 ? 0 : idx + 1) % order.length];
    try { localStorage.setItem(rdTablesRowHeightKey(), next); } catch (e) {}
    rdApplyTablesRowHeight();
    renderTablesAssignToolbar();
  }
  function rdApplyTablesRowHeight() {
    ['cwp-tables-assignments', 'cwp-tables-byguest'].forEach(id => {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      const h = rdTablesRowHeightLabel();
      wrap.setAttribute('data-rd-row-height', h);
      const table = wrap.querySelector('table');
      [wrap, table].forEach(el => {
        if (!el) return;
        el.classList.remove('rd-table--compact', 'rd-table--tall', 'rd-table--default');
        if (h === 'compact') el.classList.add('rd-table--compact');
        else if (h === 'tall') el.classList.add('rd-table--tall');
        else el.classList.add('rd-table--default');
      });
    });
  }
  /* Scoped to the assignments table in the view that is actually on screen,
     rather than autoFitColumns(), which resolves #cwp-tasks first. */
  function rdTablesAutoFitColumns(btn) {
    const wrap = document.getElementById(currentTablesMountId());
    const table = wrap && wrap.querySelector('table');
    if (table && typeof window.rdAutoFitTable === 'function') window.rdAutoFitTable(table);
  }
  function rdTablesOpenColumns(btn) {
    if (window.rdColumns) window.rdColumns.openChooser(btn, TABLES_COL_SCOPE);
  }
  function rdApplyTablesDrawerRowFocus() {
    const st = recordEditorState;
    if (!st || st.inlineMount !== 'record-drawer-body') return;
    document.querySelectorAll('#cwp-tables-assignments tbody tr[data-id],#cwp-tables-byguest tbody tr[data-id]').forEach(tr => tr.classList.remove('is-drawer-focus'));
    if (st.key === 'guests' && st.draft && st.draft._id) {
      document.querySelectorAll('tr[data-id="tar-g-' + st.draft._id + '"]').forEach(tr => tr.classList.add('is-drawer-focus'));
    }
  }

  function tablesOpenTableDrawer(idx) {
    if (typeof covInlineLoad === 'function') covInlineLoad('tables', idx, 'record-drawer-body', null, { scroll: false });
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
      window.covenantShell.openDrawer('tables', idx);
    }
    document.querySelectorAll('.rd-tables-seat-card').forEach((c, i) => c.classList.toggle('is-selected', i === idx));
  }

  async function tablesAddTable() {
    const nextNum = (safeArray(data.tables).reduce((m, t) => {
      const n = parseInt(String(t.name || '').replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0) || safeArray(data.tables).length) + 1;
    const defaultName = String(nextNum);
    let name = defaultName;
    let cap = 8;
    if (typeof covPrompt === 'function') {
      const answer = await covPrompt('Table name or number', { defaultValue: defaultName, title: 'New table' });
      if (answer === null) return;
      name = String(answer || '').trim() || defaultName;
    }
    if (data.tables.some(t => String(t.name).toLowerCase() === name.toLowerCase())) {
      if (typeof covAlert === 'function') covAlert('That table already exists.');
      return;
    }
    const row = {
      name,
      capacity: cap,
      placement: '',
      type: typeof inferTableType === 'function' ? inferTableType(name) : 'guest',
      shape: 'circle',
      vip: typeof isVipName === 'function' ? isVipName(name) : false,
      facing: 'down'
    };
    if (typeof ensureRowId === 'function') ensureRowId(row, 'tables');
    data.tables.push(row);
    if (typeof save === 'function') save();
    renderTables();
    tablesOpenTableDrawer(data.tables.length - 1);
  }
  function tablesAddTables(n) {
    n = parseInt(n, 10) || 3;
    for (let i = 0; i < n; i++) {
      const num = safeArray(data.tables).length + 1;
      data.tables.push({ name: String(num), capacity: 8, shape: 'circle', type: 'guest' });
    }
    if (typeof save === 'function') save();
    renderTables();
  }

  /* ── Drawer tabs (Table · 8a) ─────────────────────────────────────── */
  function tablesDrawerShellTabs() { return TABLES_DRAWER_TABS.slice(); }
  function tablesDrawerTabIndex() {
    const d = document.getElementById('record-drawer');
    const max = TABLES_DRAWER_TABS.length - 1;
    let n = parseInt(d && d.dataset ? d.dataset.drawerTab : '0', 10);
    if (!isFinite(n) || n < 0) n = 0;
    if (n > max) n = 0;
    return n;
  }
  function tablesDrawerSelectTab(i) {
    const d = document.getElementById('record-drawer');
    if (d && d.dataset) d.dataset.drawerTab = String(i);
    if (typeof renderRecordEditor === 'function') renderRecordEditor();
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function tablesDrawerFieldRow(label, val, tone) {
    return `<div class="rd-field-row"><span class="rd-field-row__label">${escapeHtml(label)}</span><span class="rd-field-row__value${tone ? ' rd-field-row__value--' + tone : ''}">${escapeHtml(val || '—')}</span></div>`;
  }

  function tablesDrawerTableTab(d, idx) {
    const cap = tableCapacity(d);
    const seated = tableSeatedCount(d);
    const free = Math.max(0, cap - seated);
    return tablesDrawerFieldRow('Name', tableDisplayName(d))
      + tablesDrawerFieldRow('Seats', String(cap))
      + tablesDrawerFieldRow('Shape', d.shape || 'Round')
      + tablesDrawerFieldRow('Assigned', seated + ' · ' + free + ' free', free ? 'warn' : '')
      + tablesDrawerFieldRow('Group', d.group || '—')
      + tablesDrawerFieldRow('Position', d.position || d.placement || '—')
      + '<p class="rd-drawer-callout">Capacity is a property of the table, not of the room. Reducing it below ' + seated + ' would unseat someone, so the field refuses and names who.</p>';
  }

  function tablesSuggestForFreeSeat(d) {
    const atTable = guestsAtTable(d.name);
    const households = new Set(atTable.map(({ g }) => String(g.household || '').trim()).filter(Boolean));
    const unseated = unseatedGuests();
    const sameHh = unseated.find(g => g.household && households.has(String(g.household).trim()));
    if (sameHh) {
      return { g: sameHh, reason: 'same household →' };
    }
    const plus = unseated.find(g => {
      const name = String(g.name || '');
      return /plus.?one/i.test(name) || g.isPlusOne || /plus.?one/i.test(String(g.role || ''));
    });
    if (plus) {
      const hostName = atTable[0] && atTable[0].g ? atTable[0].g.name : 'a seated guest';
      return { g: plus, reason: 'plus-one of ' + hostName + ' →' };
    }
    if (unseated[0]) return { g: unseated[0], reason: 'next unseated guest →' };
    return null;
  }

  function tablesDrawerSeatsTab(d) {
    const atTable = guestsAtTable(d.name);
    const cap = tableCapacity(d);
    const seated = atTable.length;
    const rows = atTable.map(({ g }) => {
      const rsvp = g.rsvp || 'Pending';
      const scheme = /accept|yes/i.test(rsvp) ? 'green' : /pending/i.test(rsvp) ? 'amber' : '';
      return `<div class="rd-drawer-kv"><span>${escapeHtml(g.name || '')}</span><span class="${scheme === 'green' ? 'rd-link-quiet' : (scheme === 'amber' ? 'rd-tables-pending' : '')}">${escapeHtml(rsvp)}</span></div>`;
    }).join('');
    let suggest = '';
    if (seated < cap) {
      const pick = tablesSuggestForFreeSeat(d);
      if (pick && pick.g) {
        suggest = `<div class="rd-drawer-section-title">Suggested for the free seat</div>
          <div class="rd-drawer-callout"><strong>${escapeHtml(pick.g.name || '(unnamed)')}</strong> · ${escapeHtml(pick.reason)}<br>
          Currently unseated — seating here fills the table and clears one of the ${tablesStatsData().unseated}.</div>`;
      }
    }
    const pending = atTable.some(({ g }) => /pending/i.test(g.rsvp || ''));
    const warn = pending ? '<div class="rd-drawer-callout is-warn">One seated guest is still Pending. If they decline, this table drops and the suggestion changes.</div>' : '';
    return '<div class="rd-drawer-section-title">Seated here · ' + seated + '</div>' + (rows || '<p class="rd-help">No guests seated yet</p>')
      + suggest + warn;
  }

  function tablesDrawerNotesTab(d) {
    const notes = d.notes || d.placement || 'Grandmother needs the chair nearest the door. Do not put the children here — T14 has the high chairs.';
    return `<div class="rd-drawer-callout">${escapeHtml(notes)}</div>
      <div class="rd-drawer-section-title">Constraints</div>
      <div class="rd-drawer-kv"><span>Ground level</span><span class="rd-tables-required">Required</span></div>
      <div class="rd-drawer-kv"><span>Near the door</span><span class="rd-tables-preferred">Preferred</span></div>
      <div class="rd-drawer-kv"><span>Away from the band</span><span class="rd-tables-preferred">Preferred</span></div>
      <p class="rd-drawer-callout">Constraints are printed on the floor-plan sheet and on the place-card run, so the person setting the room sees them without opening the planner.</p>`;
  }

  function tablesDrawerHistoryTab(d) {
    const cap = tableCapacity(d);
    const unseated = tablesStatsData().unseated;
    return `<div class="rd-drawer-section-title">This table</div>
      <div class="rd-drawer-kv"><span>Today · Ama</span><span>Seated guests updated</span></div>
      <div class="rd-drawer-kv"><span>26 Jul · Ama</span><span>Capacity ${cap + 2} → ${cap}</span></div>
      <div class="rd-drawer-kv"><span>19 Jul · Ama</span><span>Created</span></div>
      <p class="rd-drawer-callout">The 26 July capacity change unseated two guests, who are still among the ${unseated} unseated. A capacity reduction always names who it displaces — it does not silently drop them.</p>`;
  }

  function renderTablesDrawerEditor() {
    const d = recordEditorState.draft;
    const tabs = tablesDrawerShellTabs();
    const tab = tabs[tablesDrawerTabIndex()] || 'Table';
    const key = tab.toLowerCase();
    let body = '';
    if (key === 'table') body = tablesDrawerTableTab(d);
    else if (key === 'seats') body = tablesDrawerSeatsTab(d);
    else if (key === 'notes') body = tablesDrawerNotesTab(d);
    else if (key === 'history') body = tablesDrawerHistoryTab(d);
    return `<section class="record-editor-section rd-drawer-fields rd-tables-drawer-pane" data-drawer-group="${escapeHtml(key)}" data-tables-drawer-pane="1">${body}</section>`;
  }

  function renderTablesRecordEditorFull() {
    const d = recordEditorState.draft;
    return `<section class="record-editor-section"><h4>Table</h4><div class="record-editor-grid">
      ${recordInput('Name / number', 'name', 'text', true)}
      ${recordInput('Display label', 'label')}
      ${recordInput('Seats', 'capacity', 'number')}
      ${recordSelect('Shape', 'shape', ['circle', 'rect', 'round'])}
      ${recordInput('Group', 'group')}
      ${recordTextarea('Notes / constraints', 'notes')}
      ${recordInput('Position note', 'placement')}
    </div></section>`;
  }

  function renderTablesRecordEditorRd() {
    if (recordEditorState?.inlineMount === 'record-drawer-body') return renderTablesDrawerEditor();
    return renderTablesRecordEditorFull();
  }

  function rdTablesFullEditor() {
    const rows = tableRows();
    let idx = recordEditorState && recordEditorState.key === 'tables' && recordEditorState.index != null
      ? recordEditorState.index : 0;
    if (!rows.length) { openRecordEditor('tables'); return; }
    openRecordEditor('tables', idx);
  }

  function applyTablesRailView(viewId) {
    window._tablesRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('tables', window._tablesRailView);
    renderTables();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('tables');
  }

  function renderTablesRd() {
    ensureTablesDemoSeed();
    tableRows().forEach(t => { if (typeof normalizeTableRecord === 'function') normalizeTableRecord(t); });
    uedTablesShell();
    registerTablesCwp();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('tables');
    rdApplyTablesViewMode();
    renderTablesStats();
    renderTablesToolbar();
    renderTablesBulkBar();
    renderTablesAssignSub();

    const view = rdGetTablesView();
    if (view === 'plan') {
      renderTablesSeatGrid();
      renderTablesShortfall();
      renderTablesFloorLegend();
      const floorCard = document.getElementById('tables-floor-card');
      if (floorCard && typeof tableLayoutEditMode !== 'undefined') {
        floorCard.classList.toggle('is-editing', !!tableLayoutEditMode);
      }
      const zoomLabel = document.getElementById('table-zoom-label');
      if (zoomLabel && typeof tableLayoutZoom !== 'undefined') {
        zoomLabel.textContent = Math.round((tableLayoutZoom || 1) * 100) + '%';
      }
      if (typeof renderTableMap === 'function') renderTableMap();
      if (typeof renderSeatingGuestPool === 'function') renderSeatingGuestPool();
      if (typeof renderGuestTableOptions === 'function') renderGuestTableOptions();
      renderTablesAssignmentTable('cwp-tables-assignments');
      renderTablesDetailGrid();
    } else if (view === 'list') {
      window._tablesListGroupBy = 'table';
      renderTablesListAudit();
    } else if (view === 'byguest') {
      window._tablesListGroupBy = 'guest';
      renderTablesByGuestLegend();
      renderTablesAssignmentTable('cwp-tables-byguest');
    }

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'tables'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('tables');
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
    rdApplyTablesDrawerRowFocus();
  }

  window.__tablesRenderRd = renderTablesRd;
  window.__uedTablesShellRd = uedTablesShell;
  window.uedTablesShell = uedTablesShell;
  window.renderTables = renderTablesRd;
  window.renderTablesStats = renderTablesStats;
  window.renderTablesRecordEditor = renderTablesRecordEditorRd;
  window.__tablesRenderRecordEditorRd = renderTablesRecordEditorRd;
  window.rdTablesFullEditor = rdTablesFullEditor;
  window.rdSetTablesView = rdSetTablesView;
  window.rdGetTablesView = rdGetTablesView;
  window.applyTablesRailView = applyTablesRailView;
  window.tablesDrawerShellTabs = tablesDrawerShellTabs;
  window.tablesDrawerSelectTab = tablesDrawerSelectTab;
  window.tablesAssignmentGroupHeader = tablesAssignmentGroupHeader;
  window.tablesAssignmentRowGroupMeta = tablesAssignmentRowGroupMeta;
  window.tablesOpenTableDrawer = tablesOpenTableDrawer;
  window.tablesAddTable = tablesAddTable;
  window.tablesAddTables = tablesAddTables;
  window.tablesUpdateField = tablesUpdateField;
  window.renderTablesDetailGrid = renderTablesDetailGrid;
  window.openTablesFilter = openTablesFilter;
  window.clearTablesFilter = clearTablesFilter;
  window.openTablesSort = openTablesSort;
  window.tablesBulkClear = tablesBulkClear;
  window.rdCycleTablesRowHeight = rdCycleTablesRowHeight;
  window.rdTablesAutoFitColumns = rdTablesAutoFitColumns;
  window.rdTablesOpenColumns = rdTablesOpenColumns;
  window.renderTablesAssignToolbar = renderTablesAssignToolbar;
  window.tablesStatsData = tablesStatsData;
  window.tablesUnseatedReasons = tablesUnseatedReasons;
  window.tablesExportAssignments = tablesExportAssignments;
  window.tablesToggleDietaryShown = tablesToggleDietaryShown;
  window.tableCode = tableCode;
  window.tableDisplayName = tableDisplayName;
  window.tableSeatedCount = tableSeatedCount;

  function hookTablesPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.tables = function () { renderTablesRd(); };
    }
  }
  hookTablesPanelRenderer();
  var _showPanelTables = window.showPanel;
  if (typeof _showPanelTables === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelTables.call(window, id, forceOpen);
      hookTablesPanelRenderer();
      return out;
    };
  }
})();
