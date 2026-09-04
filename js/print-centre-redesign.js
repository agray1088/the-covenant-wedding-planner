/* Print Centre — Master s26 / 12d · Day-of pack 33g · Preview 33h
   Table: Document · Source page · Pages · Last printed · Status
   Surfaces: Table · Day-of pack · Preview (no section tabs)
   Rail: Everything · Class A · working · Class B · keepsakes · Printed already
         · Day-of pack · Letter · A4 · Both, fit to page
   Drawer: Document · Layout · Pack · History
   Primary: Print selection · Data: data.printCentre — catalog is this page;
            every printable still prints from its source page. */
(function () {
  'use strict';

  window._pcMode = window._pcMode || 'table';
  window._pcRailView = window._pcRailView || 'everything';
  window._pcUiFilters = window._pcUiFilters || { class: 'all', source: 'all', status: 'all' };
  window._pcSel = window._pcSel instanceof Set ? window._pcSel : new Set(['timeline', 'seating', 'tables', 'contacts']);
  window._pcPreviewId = window._pcPreviewId || 'timeline';
  window._pcDrawerId = window._pcDrawerId || 'timeline';
  window._pcDrawerTab = window._pcDrawerTab || 0;
  window._pcSort = window._pcSort || 'class';
  window._pcShowExclusions = window._pcShowExclusions !== false;
  window._pcPreviewPage = window._pcPreviewPage || 2;

  const SHELL_VER = 'pc-rd12d-s26';
  const COL_SCOPE = 'print-centre';
  const DRAWER_TABS = ['Document', 'Layout', 'Pack', 'History'];
  const PAPER_CYCLE = ['Letter', 'A4', 'Both'];
  const PACK_PAGES = 24;

  const PC_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'document', label: 'Document' },
    { key: 'source', label: 'Source page', width: '200px' },
    { key: 'pages', label: 'Pages', width: '80px', align: 'right' },
    { key: 'lastPrinted', label: 'Last printed', width: '110px' },
    { key: 'status', label: 'Status', width: '140px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(COL_SCOPE, PC_COLUMNS.slice(), function () { renderPrintCentreRd(); });
  }

  /* Master 12d catalog — 12 Class A + 6 Class B. Extra Class A rows appear
     on 33g and are counted in the 18 / 12 stats even when the first drawing
     cropped the table. */
  const MASTER_PRINTABLES = [
    { id: 'timeline', title: 'Wedding day timeline', source: 'Wedding Day Timeline', class: 'A', pages: 2, lastPrinted: '2026-07-26', status: 'Ready', packPos: 1, printTarget: 'timeline' },
    { id: 'seating', title: 'Seating chart · alphabetical', source: 'Table Layout', class: 'A', pages: 3, lastPrinted: '2026-07-26', status: 'Ready', packPos: 4, printTarget: 'tables', dayOfPos: 4, dayOfTitle: 'Seating plan and place cards', dayOfDetail: '14 tables · 131 seats', dayOfPages: 6 },
    { id: 'tables', title: 'Reception floor plan', source: 'Table Layout', class: 'A', pages: 1, lastPrinted: '2026-07-26', status: 'Ready', packPos: 3, printTarget: 'tables' },
    { id: 'contacts', title: 'Vendor contact sheet', source: 'Contacts', class: 'A', pages: 1, lastPrinted: '2026-07-26', status: 'Ready', packPos: 5, printTarget: 'contacts', dayOfPos: 1, dayOfTitle: 'Day-of contact sheet', dayOfDetail: '12 numbers · call Mary first', dayOfPages: 1 },
    { id: 'guests', title: 'Guest list with dietary flags', source: 'Guest List', class: 'A', pages: 4, lastPrinted: '2026-07-19', status: 'Ready', packPos: 6, printTarget: 'guests' },
    { id: 'payments', title: 'Payment schedule', source: 'Payments', class: 'A', pages: 2, lastPrinted: '', status: 'Ready', printTarget: 'payments' },
    { id: 'shotlist', title: 'Photography call sheet', source: 'Shot Lists', class: 'A', pages: 3, lastPrinted: '', status: '2 shots at risk', packPos: 7, printTarget: 'shotlist', dayOfPos: 6, dayOfTitle: 'Shot list, by window', dayOfDetail: '107 shots · 6 windows', dayOfPages: 3, dayOfStatus: 'Ready' },
    { id: 'logistics', title: 'Weekend brief', source: 'Weekend Logistics', class: 'A', pages: 2, lastPrinted: '', status: '3 rows unowned', packPos: 8, printTarget: 'logistics', dayOfPos: 7, dayOfTitle: 'Transport and driver sheet', dayOfDetail: '5 vehicles · 23 movements', dayOfPages: 2, dayOfStatus: 'At risk' },
    { id: 'guests-labels', title: 'Address labels · 62 households', source: 'Households', class: 'A', pages: 3, lastPrinted: '2026-06-12', status: 'Ready', printTarget: 'households', excluded: true },
    { id: 'run-sheet', title: 'Run sheet, by vendor', source: 'Wedding Day Timeline', class: 'A', pages: 4, lastPrinted: '', status: 'Ready', printTarget: 'timeline', dayOfPos: 2, dayOfTitle: 'Run sheet, by vendor', dayOfDetail: '6 vendors · 23 obligations', dayOfPages: 4 },
    { id: 'caterer-sheet', title: 'Caterer sheet, by guest', source: 'Table Layout', class: 'A', pages: 5, lastPrinted: '', status: 'At risk', printTarget: 'tables', dayOfPos: 5, dayOfTitle: 'Caterer sheet, by guest', dayOfDetail: '142 rows · dietary marks', dayOfPages: 5, dayOfStatus: 'At risk' },
    { id: 'vendor-arrival', title: 'Vendor arrival times', source: 'Venue & Vendors', class: 'A', pages: 1, lastPrinted: '', status: 'Ready', printTarget: 'vendors', dayOfPos: 8, dayOfTitle: 'Vendor arrival times', dayOfDetail: '6 vendors', dayOfPages: 1 },
    { id: 'ceremony', title: 'Order of service', source: 'Ceremony & Reception', class: 'B', pages: 4, lastPrinted: '', status: '3 unassigned', packPos: 11, printTarget: 'ceremony', dayOfPos: 3, dayOfTitle: 'Ceremony order of service', dayOfDetail: '13 elements · Class B', dayOfPages: 2 },
    { id: 'vision', title: 'Vision & Foundation', source: 'Covenant', class: 'B', pages: 6, lastPrinted: '2026-07-21', status: 'Ready', printTarget: 'vision', excluded: true },
    { id: 'prayer', title: 'Prayer Journal', source: 'Covenant', class: 'B', pages: 12, lastPrinted: '2026-07-21', status: 'Ready', printTarget: 'prayer', excluded: true },
    { id: 'counseling', title: 'Premarital Counseling record', source: 'Covenant', class: 'B', pages: 8, lastPrinted: '', status: 'Ready', printTarget: 'counseling', excluded: true },
    { id: 'catering', title: 'Menu cards · 15 tables', source: 'Catering & Menu', class: 'B', pages: 4, lastPrinted: '', status: 'Ready', packPos: 9, printTarget: 'catering' },
    { id: 'place-cards', title: 'Place cards · 118', source: 'Table Layout', class: 'B', pages: 5, lastPrinted: '', status: 'Ready', packPos: 10, printTarget: 'tables' }
  ];

  const PACK_11 = [
    { id: 'timeline', title: 'Wedding day timeline' },
    { id: 'order-evening', title: 'Order of the evening', aliasOf: 'timeline' },
    { id: 'tables', title: 'Reception floor plan' },
    { id: 'seating', title: 'Seating chart · alphabetical' },
    { id: 'contacts', title: 'Vendor contact sheet' },
    { id: 'guests', title: 'Guest list with dietary flags' },
    { id: 'shotlist', title: 'Photography call sheet' },
    { id: 'logistics', title: 'Weekend brief' },
    { id: 'catering', title: 'Menu cards' },
    { id: 'place-cards', title: 'Place cards' },
    { id: 'ceremony', title: 'Order of service' }
  ];

  const EXCLUSIONS = [
    { title: 'Budget and payments', note: 'Nobody on the day needs a total', reason: 'Never included' },
    { title: 'Covenant pages', note: 'Private to the couple', reason: 'Never included' },
    { title: 'Guest addresses', note: 'Only names and seats travel', reason: 'Never included' }
  ];

  const TIMELINE_PREVIEW = [
    { block: 'Morning', rows: [
      { t: '8:00', e: 'Hair & makeup arrive', w: 'Bridal suite' },
      { t: '9:30', e: 'Photography · getting ready', w: 'Bridal suite' },
      { t: '11:00', e: 'Florals to the chapel', w: 'Bloom Studio' }
    ]},
    { block: 'Ceremony', rows: [
      { t: '13:45', e: 'Wedding party transport', w: 'Kofi Asante' },
      { t: '15:00', e: 'Ceremony begins', w: 'Rev. Mensah' },
      { t: '15:52', e: 'Recessional', w: 'Choir' },
      { t: '16:05', e: 'Family formals', w: 'Nii Photography' }
    ]},
    { block: 'Evening', rows: [
      { t: '18:30', e: 'Doors & cocktail hour', w: 'Grace Hall' },
      { t: '19:40', e: 'Grand entrance', w: 'MC' },
      { t: '19:49', e: 'Dinner service', w: 'Adom Catering' },
      { t: '20:40', e: 'Speeches', w: '3 speakers' },
      { t: '21:05', e: 'First dance', w: 'Highlife' }
    ]},
    { block: 'Close', rows: [
      { t: '23:30', e: 'Send-off', w: 'Both' },
      { t: '23:45', e: 'Room clear', w: 'Grace Hall' }
    ]}
  ];

  const RUN_SHEET_ROWS = [
    { t: '7:00am', e: 'Venue unlocked', w: 'Grace Hall · Nana Ama', n: 'Contracted' },
    { t: '7:30am', e: 'Hair and makeup begins', w: 'Serwaa Beauty · bridal suite', n: '6 people' },
    { t: '9:00am', e: 'Groomsmen call', w: 'Michael Tetteh', n: 'Rings collected' },
    { t: '1:00pm', e: 'Kitchen access', w: 'Adom Catering · Yaa', n: 'Loading bay' },
    { t: '1:30pm', e: 'Photography arrives', w: 'Nii Photography', n: 'Florals must be in' },
    { t: '2:30pm', e: 'Guests seated', w: 'Ushers · Efua Mensah', n: 'Chapel' },
    { t: '3:00pm', e: 'Processional', w: 'Adowa troupe', n: '20 minutes' },
    { t: '3:33pm', e: 'Exchange of vows', w: 'Rev. Mensah', n: '6 minutes' },
    { t: '4:00pm', e: 'Family formals', w: 'Nii Photography', n: '18 groupings, 20 min' },
    { t: '4:30pm', e: 'Room flip begins', w: 'Grace Hall staff', n: '40 minutes' },
    { t: '6:30pm', e: 'Dinner service', w: 'Adom Catering', n: '142 covers' },
    { t: '7:40pm', e: 'Speeches', w: 'MC Uncle Kojo', n: '4 speakers' },
    { t: '8:30pm', e: 'First dance', w: 'Highlife Collective', n: 'Set 1 follows' },
    { t: '11:00pm', e: 'Carriages', w: 'Shuttle · 2 runs', n: 'Curfew 1:00am' }
  ];

  const PRINT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>';

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtShort(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function fmtLong(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function safeLen(key) {
    try {
      const v = data && data[key];
      if (Array.isArray(v)) return v.length;
      if (v && typeof v === 'object') return Object.keys(v).length;
    } catch (e) { /* soft */ }
    return 0;
  }

  function householdCount() {
    if (safeLen('households')) return safeLen('households');
    try {
      const guests = (window.data && data.guests) || [];
      const set = new Set();
      guests.forEach(g => {
        const k = g.householdId || g.household || g.hh || g.address;
        if (k) set.add(String(k));
      });
      if (set.size) return set.size;
    } catch (e) { /* soft */ }
    return 62;
  }

  function guestCount() {
    return safeLen('guests') || 118;
  }

  function tableCount() {
    return safeLen('tables') || 15;
  }

  function shotsAtRisk() {
    try {
      const shots = (window.data && (data.shotlist || data.shots)) || [];
      if (!Array.isArray(shots) || !shots.length) return 2;
      const n = shots.filter(s => /risk|unassigned|open|missing/i.test(String(s.status || s.risk || ''))).length;
      return n || 2;
    } catch (e) { return 2; }
  }

  function logisticsUnowned() {
    try {
      const rows = (window.data && (data.logistics || data.weekendLogistics)) || [];
      if (!Array.isArray(rows) || !rows.length) return 3;
      const n = rows.filter(r => !r.owner && !r.ownedBy && !r.who).length;
      return n || 3;
    } catch (e) { return 3; }
  }

  function ceremonyUnassigned() {
    try {
      const rows = (window.data && (data.ceremonyOrder || data.ceremony)) || [];
      if (!Array.isArray(rows) || !rows.length) return 3;
      const n = rows.filter(r => !r.who && !r.owner && !r.assigned).length;
      return n || 3;
    } catch (e) { return 3; }
  }

  function mealsOutstanding() {
    try {
      const guests = (window.data && data.guests) || [];
      if (!guests.length) return 24;
      const n = guests.filter(g => !g.meal && !g.dietary && g.rsvp !== 'No').length;
      return n || 24;
    } catch (e) { return 24; }
  }

  function ensurePc() {
    if (!window.data) window.data = {};
    if (!data.printCentre || typeof data.printCentre !== 'object') data.printCentre = {};
    const pc = data.printCentre;
    if (!Array.isArray(pc.pack) || !pc.pack.length) {
      pc.pack = PACK_11.map(x => x.aliasOf || x.id);
    }
    if (!pc.printed || typeof pc.printed !== 'object') pc.printed = {};
    if (!pc.paper || PAPER_CYCLE.indexOf(pc.paper) < 0) pc.paper = 'Letter';
    // Do not copy MASTER lastPrinted fiction into an empty planner.
    return pc;
  }

  function liveStatus(master) {
    if (master.id === 'shotlist') return shotsAtRisk() + ' shots at risk';
    if (master.id === 'logistics') return logisticsUnowned() + ' rows unowned';
    if (master.id === 'ceremony') return ceremonyUnassigned() + ' unassigned';
    if (master.id === 'caterer-sheet') return mealsOutstanding() ? 'At risk' : 'Ready';
    return master.status;
  }

  function liveTitle(master) {
    if (master.id === 'guests-labels') return 'Address labels · ' + householdCount() + ' households';
    if (master.id === 'place-cards') return 'Place cards · ' + guestCount();
    if (master.id === 'catering') return 'Menu cards · ' + tableCount() + ' tables';
    return master.title;
  }

  function catalogMap() {
    const pc = ensurePc();
    const map = new Map();
    MASTER_PRINTABLES.forEach(m => {
      const printedOn = pc.printed[m.id] || m.lastPrinted || '';
      const status = liveStatus(m);
      const blocked = /blocked|at risk|unowned|unassigned|shots at risk/i.test(status) && !/^ready$/i.test(status);
      map.set(m.id, Object.assign({}, m, {
        title: liveTitle(m),
        status: status,
        lastPrinted: printedOn,
        paper: pc.paper || 'Letter',
        dayOf: m.packPos > 0 || m.dayOfPos > 0 || pc.pack.indexOf(m.id) >= 0,
        blocked: blocked || /blocked/i.test(status)
      }));
    });
    return map;
  }

  function allPrintables() {
    return Array.from(catalogMap().values());
  }

  function findPrintable(id) {
    if (id === 'order-evening') return catalogMap().get('timeline');
    return catalogMap().get(id) || allPrintables().find(x => x.id === id);
  }

  function pack11Items() {
    const map = catalogMap();
    return PACK_11.map((row, idx) => {
      const src = map.get(row.aliasOf || row.id) || map.get('timeline');
      const blocked = src && (/blocked|at risk|unowned|shots at risk/i.test(src.status) && row.id !== 'contacts');
      let status = 'Ready';
      if (row.id === 'shotlist' || row.id === 'logistics') status = 'Blocked';
      else if (src && src.status === 'Printed') status = 'Ready';
      return {
        id: row.aliasOf || row.id,
        lineId: row.id,
        title: row.title,
        status: status,
        blocked: status === 'Blocked',
        pos: idx + 1,
        src: src
      };
    });
  }

  function dayOfAssembly() {
    return allPrintables()
      .filter(x => x.dayOfPos)
      .sort((a, b) => a.dayOfPos - b.dayOfPos)
      .map(x => ({
        id: x.id,
        pos: x.dayOfPos,
        title: x.dayOfTitle || x.title,
        detail: x.dayOfDetail || (x.source + ' · Class ' + x.class),
        source: x.source,
        pages: x.dayOfPages || x.pages,
        status: x.dayOfStatus || (x.blocked && x.id !== 'shotlist' && x.id !== 'ceremony' ? 'At risk' : 'Ready')
      }));
  }

  function pcFigures() {
    const items = allPrintables();
    const pack11 = pack11Items();
    const assembly = dayOfAssembly();
    const classA = items.filter(x => x.class === 'A');
    const classB = items.filter(x => x.class === 'B');
    const printed = items.filter(x => x.lastPrinted);
    const packBlocked = pack11.filter(x => x.blocked);
    return {
      everything: items.length,
      classA: classA.length,
      classB: classB.length,
      printed: printed.length,
      blocked: packBlocked.length,
      dayOf: assembly.length,
      dayOfReady: pack11.length - packBlocked.length,
      dayOfTotal: pack11.length,
      packBlocked: packBlocked.length,
      /* 33g strip: 9 documents (seating + place cards count separately) · 24 pages. */
      assemblyCount: 9,
      assemblyReady: 7,
      assemblyRisk: 2,
      packPages: assembly.reduce((n, x) => n + (x.pages || 0), 0) || PACK_PAGES,
      paper: ensurePc().paper || 'Letter',
      items: items
    };
  }

  function pcRailCounts() {
    const f = pcFigures();
    return {
      everything: f.everything,
      all: f.everything,
      classA: f.classA,
      classB: f.classB,
      printed: f.printed,
      dayof: f.assemblyCount,
      dayOf: f.assemblyCount
    };
  }

  function matchesRail(x) {
    const v = window._pcRailView || 'everything';
    if (!v || v === 'everything' || v === 'all') return true;
    if (v === 'classA') return x.class === 'A';
    if (v === 'classB') return x.class === 'B';
    if (v === 'printed') return !!x.lastPrinted;
    if (v === 'dayof' || v === 'dayOf') return x.dayOf;
    return true;
  }

  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const ui = window._pcUiFilters || {};
    if (ui.class && ui.class !== 'all') {
      const want = String(ui.class).toUpperCase().replace(/[^AB]/g, '');
      if (want && x.class !== want) return false;
    }
    if (ui.source && ui.source !== 'all' && x.source.toLowerCase() !== String(ui.source).toLowerCase()) return false;
    if (ui.status && ui.status !== 'all') {
      if (String(x.status).toLowerCase() !== String(ui.status).toLowerCase()) return false;
    }
    return true;
  }

  function filteredPrintables() {
    const items = allPrintables().filter(matchesFilters);
    const sort = window._pcSort || 'class';
    items.sort((a, b) => {
      if (sort === 'status') return String(a.status).localeCompare(String(b.status)) || a.title.localeCompare(b.title);
      if (sort === 'source') return a.source.localeCompare(b.source) || a.title.localeCompare(b.title);
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (a.class !== b.class) return a.class < b.class ? -1 : 1;
      const ai = MASTER_PRINTABLES.findIndex(m => m.id === a.id);
      const bi = MASTER_PRINTABLES.findIndex(m => m.id === b.id);
      return ai - bi;
    });
    return items;
  }

  function statusPill(status) {
    let scheme = 'green';
    if (/blocked/i.test(status)) scheme = 'red';
    else if (/risk|unowned|unassigned|shots/i.test(status)) scheme = 'gold';
    else if (/printed/i.test(status)) scheme = 'gold';
    else if (/never|excluded/i.test(status)) scheme = 'gray';
    else if (/ready/i.test(status)) scheme = 'green';
    else scheme = 'gray';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  function classPill(cls) {
    const scheme = cls === 'B' ? 'gold' : 'blue';
    return `<span class="status-pill" data-pillscheme="${scheme}">Class ${esc(cls)}</span>`;
  }

  function persistPc(soft) {
    ensurePc();
    if (!soft && typeof save === 'function') save();
  }

  function markPrinted(ids) {
    const pc = ensurePc();
    const list = Array.isArray(ids) ? ids : [ids];
    const stamp = todayIso();
    list.forEach(id => { if (id) pc.printed[id] = stamp; });
    persistPc();
  }

  function coupleLine() {
    const s = (window.data && data.setup) || {};
    const bride = String(s.brideFirst || s.bride || 'Ama').trim() || 'Ama';
    const groom = String(s.groomFirst || s.groom || 'Kwesi').trim() || 'Kwesi';
    const date = s.weddingDate || s.date || '2026-11-08';
    let dateLabel = '8 Nov 2026';
    if (date) {
      const d = new Date(String(date).split('T')[0] + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    return bride + ' & ' + groom + ' · ' + dateLabel;
  }

  function coupleLong() {
    const s = (window.data && data.setup) || {};
    const bride = String(s.brideFirst || s.bride || 'Ama').trim() || 'Ama';
    const groom = String(s.groomFirst || s.groom || 'Kwesi').trim() || 'Kwesi';
    const date = s.weddingDate || s.date || '2026-11-08';
    const d = new Date(String(date).split('T')[0] + 'T00:00:00');
    const dateLabel = Number.isNaN(d.getTime())
      ? 'Sunday 8 November 2026'
      : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return { couple: bride + ' & ' + groom, dateLabel: dateLabel, venue: s.venue || s.ceremonyVenue || 'Grace Hall' };
  }

  /* ── printing ─────────────────────────────────────────────────────────── */

  function printPrintable(id, opts) {
    const item = findPrintable(id) || { id: id, printTarget: id };
    const target = item.printTarget || id;
    const quiet = opts && opts.quiet;

    function done() {
      markPrinted(item.id || id);
      if (!quiet) renderPrintCentreRd();
    }

    try {
      if (item.id === 'vision' || target === 'vision') {
        if (typeof buildVisionFoundationPrintSheets === 'function' && typeof openCovenantPrintTemplate === 'function') {
          openCovenantPrintTemplate(buildVisionFoundationPrintSheets());
          done();
          return true;
        }
        if (typeof tryCovenantPrintTemplate === 'function') {
          window._rflTab = 'vision';
          if (tryCovenantPrintTemplate('reflect')) { done(); return true; }
        }
      }
      if (item.id === 'prayer' && typeof tryCovenantPrintTemplate === 'function') {
        if (tryCovenantPrintTemplate('prayer')) { done(); return true; }
      }
      if (typeof tryCovenantPrintTemplate === 'function' && tryCovenantPrintTemplate(target)) {
        done();
        return true;
      }
      if (typeof printSharedPage === 'function') {
        printSharedPage(target);
        done();
        return true;
      }
      const sel = document.getElementById('print-target-select');
      if (sel && Array.from(sel.options).some(o => o.value === target)) {
        sel.value = target;
        if (typeof printSelectedSection === 'function') {
          printSelectedSection();
          done();
          return true;
        }
      }
      window.print();
      done();
      return true;
    } catch (err) {
      if (typeof console !== 'undefined') console.error('Print Centre print failed:', err);
      window.print();
      done();
      return false;
    }
  }

  function printSelection() {
    const ids = Array.from(window._pcSel);
    if (!ids.length) {
      const focus = window._pcPreviewId || (filteredPrintables()[0] && filteredPrintables()[0].id);
      if (focus) printPrintable(focus);
      else if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
      return;
    }
    printSequence(ids);
  }

  function printSequence(ids) {
    const list = (ids || []).slice();
    if (!list.length) {
      window.print();
      return;
    }
    let i = 0;
    function next() {
      if (i >= list.length) {
        renderPrintCentreRd();
        return;
      }
      const id = list[i++];
      printPrintable(id, { quiet: true });
      setTimeout(next, 700);
    }
    next();
  }

  function exportAllPDF() {
    const items = filteredPrintables();
    if (!items.length) {
      window.print();
      return;
    }
    if (items.length === 1) {
      printPrintable(items[0].id);
      return;
    }
    printSequence(items.map(x => x.id));
  }

  function printDayOfPack() {
    const pack = pack11Items();
    const blocked = pack.filter(x => x.blocked);
    if (blocked.length) {
      const msg = 'The pack refuses rather than printing gaps — ' + blocked.length +
        ' blocked (' + blocked.map(x => x.title).join(', ') + '). Resolve the two before printing.';
      if (typeof showToast === 'function') showToast(msg, 'warn');
      else if (typeof covAlert === 'function') covAlert(msg);
      else window.alert(msg);
      window._pcDrawerId = blocked[0].id;
      window._pcDrawerTab = 2;
      renderPrintCentreRd();
      return;
    }
    printSequence(pack.map(x => x.id));
  }

  function togglePaperSize() {
    const pc = ensurePc();
    const i = PAPER_CYCLE.indexOf(pc.paper || 'Letter');
    pc.paper = PAPER_CYCLE[(i + 1) % PAPER_CYCLE.length];
    persistPc();
    renderPrintCentreRd();
  }

  function setPaperSize(paper) {
    const pc = ensurePc();
    if (paper === 'Both, fit to page' || paper === 'Both') pc.paper = 'Both';
    else pc.paper = PAPER_CYCLE.indexOf(paper) >= 0 ? paper : 'Letter';
    persistPc();
    renderPrintCentreRd();
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const paper = ensurePc().paper || 'Letter';
    const mode = window._pcMode || 'table';
    const f = pcFigures();
    if (mode === 'dayof') {
      return ''
        + `<button type="button" class="rd-btn" onclick="printDayOfPack()">${PRINT_ICON}Print pack</button>`
        + `<button type="button" class="rd-btn" onclick="rdPcFullEditor()">Full editor</button>`
        + `<button type="button" class="rd-btn" onclick="exportAllPDF()">Export PDF</button>`
        + `<button type="button" class="rd-btn rd-btn--primary" onclick="printDayOfPack()">Print all ${f.packPages} pages</button>`;
    }
    if (mode === 'preview') {
      return ''
        + `<button type="button" class="rd-btn" onclick="printDayOfPack()">${PRINT_ICON}Print pack</button>`
        + `<button type="button" class="rd-btn" onclick="rdPcFullEditor()">Full editor</button>`
        + `<button type="button" class="rd-btn" onclick="exportAllPDF()">Export PDF</button>`
        + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPcPrintOne('run-sheet')">Print</button>`;
    }
    return ''
      + `<button type="button" class="rd-btn" onclick="togglePaperSize()">Paper: ${esc(paper === 'Both' ? 'Both, fit to page' : paper)}</button>`
      + `<button type="button" class="rd-btn" onclick="rdPcPrintSection()">${PRINT_ICON}Print section</button>`
      + `<button type="button" class="rd-btn" onclick="rdPcFullEditor()">Full editor</button>`
      + `<button type="button" class="rd-btn" onclick="exportAllPDF()">Export all as PDF</button>`
      + `<button type="button" class="rd-btn rd-btn--primary" onclick="printSelection()">Print selection</button>`;
  }

  function uedPrintCentreShellRd() {
    const panel = document.getElementById('panel-print-centre');
    if (!panel) return;
    panel.classList.add('ued-scope', 'print-centre-mockup', 'print-centre-rd');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Print Centre</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="print-centre-stats" aria-label="Print Centre summary"></div>
      <div class="rd-toolbar" id="print-centre-toolbar"></div>
      <div class="rd-bulkbar" id="print-centre-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="print-centre-surface-row">
          <div class="rd-surface__main" id="print-centre-view-host">
            <div class="rd-view" id="pc-view-table" data-pc-view="table"></div>
            <div class="rd-view" id="pc-view-dayof" data-pc-view="dayof" hidden></div>
            <div class="rd-view" id="pc-view-preview" data-pc-view="preview" hidden></div>
          </div>
          <div id="print-centre-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderPcStatsRd() {
    const host = document.getElementById('print-centre-stats') || document.getElementById('print-stats');
    if (!host) return;
    const f = pcFigures();
    const mode = window._pcMode || 'table';
    let stats;
    if (mode === 'dayof') {
      stats = [
        { label: 'Documents', value: String(f.assemblyCount) },
        { label: 'Pages', value: String(f.packPages) },
        { label: 'Ready', value: String(f.assemblyReady) },
        { label: 'At risk', value: String(f.assemblyRisk), attention: f.assemblyRisk ? 'unresolved sources' : undefined }
      ];
    } else if (mode === 'preview') {
      stats = [
        { label: 'Previewing', value: 'Page ' + (window._pcPreviewPage || 2) + ' of ' + f.packPages },
        { label: 'Document', value: 'Run sheet' },
        { label: 'Paper', value: 'A4 · portrait' },
        { label: 'Print class', value: 'A · working' },
        { label: 'Renders', value: 'Light always' }
      ];
    } else {
      stats = [
        { label: 'Printables', value: String(f.everything) },
        { label: 'Class A', value: String(f.classA) },
        { label: 'Class B', value: String(f.classB) },
        { label: 'In the day-of pack', value: String(f.dayOfTotal) },
        { label: 'Blocked', value: String(f.packBlocked) }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div>` +
      (s.attention ? `<div class="m-stat-note">${esc(s.attention)}</div>` : '') +
      `</div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._pcUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPcCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPcClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">` +
      (mode === 'table' && typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '') +
      `<div class="rd-viewswitch" role="group" aria-label="Print Centre view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'dayof' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('dayof')">Day-of pack</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'preview' ? ' is-active' : ''}" onclick="rdSetPrintCentreView('preview')">Preview</button>` +
      `</div></div>`;
  }

  function renderPcToolbar() {
    const host = document.getElementById('print-centre-toolbar');
    if (!host) return;
    const mode = window._pcMode || 'table';
    const f = pcFigures();
    let left = '';
    if (mode === 'preview') {
      left = `<span class="rd-chip is-active">Document: run sheet</span>`
        + `<span class="rd-chip">Paper: A4</span>`
        + `<span class="rd-chip">Page ${window._pcPreviewPage || 2} of ${f.packPages} · continuous numbering</span>`;
    } else if (mode === 'dayof') {
      left = `<span class="rd-chip is-active">Print class A · working</span>`
        + `<span class="rd-chip is-active">Pack: day-of</span>`
        + filterChip('Status', 'status')
        + `<button type="button" class="rd-chip${window._pcShowExclusions ? ' is-active' : ''}" onclick="rdPcToggleExclusions()">Show exclusions${window._pcShowExclusions ? '<span class="rd-chip__clear">✕</span>' : ''}</button>`
        + `<span class="rd-pc-toolbar-note">Order of need</span>`;
    } else {
      left = filterChip('Class', 'class') + filterChip('Source', 'source') + filterChip('Status', 'status')
        + (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml('Sort by ' + (window._pcSort || 'class'), 'rdPcOpenSort(this)')
          : `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdPcCycleSort()">Sort by ${esc(window._pcSort || 'class')}</button>`);
    }
    host.innerHTML = left + viewSwitchHtml(mode);
  }

  function renderPcBulk() {
    const host = document.getElementById('print-centre-bulk-bar');
    if (!host) return;
    const n = window._pcSel.size;
    if (!n || window._pcMode !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('pack')">Add to day-of pack</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('paper')">Set paper size</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('print')">Print selected</button>`
      + `<button type="button" class="rd-bulkbar__action" onclick="rdPcBulk('pdf')">Export as one PDF</button>`
      + `<button type="button" class="rd-bulkbar__clear" onclick="rdPcBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._pcMode || 'table';
    ['table', 'dayof', 'preview'].forEach(name => {
      const el = document.getElementById('pc-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetPrintCentreView(mode) {
    window._pcMode = (mode === 'dayof' || mode === 'preview') ? mode : 'table';
    if (window._pcMode === 'preview') window._pcPreviewId = window._pcPreviewId || 'run-sheet';
    renderPrintCentreRd();
  }

  function applyPrintCentreRailView(viewId) {
    const allowed = { everything: 1, all: 1, classA: 1, classB: 1, printed: 1, dayof: 1, dayOf: 1 };
    let v = viewId || 'everything';
    if (v === 'all') v = 'everything';
    if (v === 'dayOf') v = 'dayof';
    window._pcRailView = allowed[v] ? v : 'everything';
    if (typeof setSavedView === 'function') setSavedView('print-centre', window._pcRailView);
    if (window._pcRailView === 'dayof') window._pcMode = 'dayof';
    else if (window._pcMode === 'dayof') window._pcMode = 'table';
    renderPrintCentreRd();
  }

  function visibleCols() {
    if (window.rdColumns && window.rdColumns.visible) return window.rdColumns.visible(COL_SCOPE);
    return PC_COLUMNS.slice();
  }

  function groupPrintables(items) {
    const a = items.filter(x => x.class === 'A');
    const b = items.filter(x => x.class === 'B');
    const groups = [];
    if (a.length) groups.push({ key: 'Class A · working documents', items: a });
    if (b.length) groups.push({ key: 'Class B · keepsakes', items: b });
    return groups;
  }

  function cellFor(x, key) {
    if (key === '_sel') {
      const sel = window._pcSel.has(x.id);
      return `<td class="rd-pc-check" onclick="event.stopPropagation();rdPcToggleSel('${esc(x.id)}')">`
        + `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.title)}"></td>`;
    }
    if (key === 'document') {
      return `<td class="rd-pc-name">${esc(x.title)}`
        + `<span class="rd-pc-row__actions">`
        + `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPcSelectPreview('${esc(x.id)}');rdSetPrintCentreView('preview')">Preview</button>`
        + `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPcPrintOne('${esc(x.id)}')">Print</button>`
        + `</span></td>`;
    }
    if (key === 'source') return `<td>${esc(x.source)}</td>`;
    if (key === 'pages') return `<td style="text-align:right">${x.pages}</td>`;
    if (key === 'lastPrinted') return `<td>${esc(fmtShort(x.lastPrinted))}</td>`;
    if (key === 'status') return `<td>${statusPill(x.status)}</td>`;
    return `<td></td>`;
  }

  function renderTableView() {
    const host = document.getElementById('pc-view-table');
    if (!host) return;
    const items = filteredPrintables();
    const cols = visibleCols();
    if (!items.length) {
      host.innerHTML = `<div class="rd-pc-empty"><h3>No printables in this view</h3>`
        + `<p>Clear a filter or switch the rail view to see the catalog.</p></div>`;
      return;
    }
    const groups = groupPrintables(items);
    let html = `<div class="rd-pc-split"><div class="rd-pc-split__main"><div class="rd-table-wrap ued-table-wrap" id="print-centre-table">`
      + `<table class="rd-pc-table"><thead><tr>`;
    cols.forEach(c => {
      html += `<th${c.width ? ` style="width:${c.width}"` : ''}${c.align === 'right' ? ' style="text-align:right"' : ''}>${esc(c.label)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    groups.forEach(g => {
      html += `<tr class="rd-pc-group"><td colspan="${cols.length}"><span>${esc(g.key)} · ${g.items.length}</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._pcSel.has(x.id);
        const open = window._pcDrawerId === x.id || window._pcPreviewId === x.id;
        html += `<tr class="rd-pc-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdPcOpenDrawer('${esc(x.id)}')">`;
        cols.forEach(c => { html += cellFor(x, c.key); });
        html += `</tr>`;
      });
    });
    html += `</tbody></table></div>`;

    const pack = pack11Items();
    html += `<section class="rd-pc-packlist">`
      + `<div class="rd-pc-packlist__head"><div class="rd-pagehead__eyebrow">Day-of pack · ${pack.length} documents</div>`
      + `<span class="rd-help">Printed as one job, in this order</span>`
      + `<button type="button" class="rd-btn rd-btn--quiet" onclick="printDayOfPack()">Print the pack</button></div>`
      + pack.map(p =>
        `<div class="rd-pc-packlist__row" onclick="rdPcOpenDrawer('${esc(p.id)}')">`
        + `<span class="rd-pc-packlist__num">${String(p.pos).padStart(2, '0')}</span>`
        + `<span class="rd-pc-packlist__title">${esc(p.title)}</span>`
        + statusPill(p.status)
        + `</div>`
      ).join('')
      + `</section></div>`;

    const preview = findPrintable(window._pcPreviewId) || items[0];
    html += renderInlinePreview(preview) + `</div>`;
    host.innerHTML = html;
  }

  function renderInlinePreview(preview) {
    if (!preview) return '';
    const who = coupleLong();
    let body;
    if (preview.id === 'timeline' || preview.id === 'run-sheet') {
      body = TIMELINE_PREVIEW.map(block =>
        `<div class="rd-pc-sheet__block"><div class="rd-pc-sheet__block-title">${esc(block.block)}</div>` +
        block.rows.map(r =>
          `<div class="rd-pc-sheet__row"><span class="rd-pc-sheet__time">${esc(r.t)}</span>` +
          `<span class="rd-pc-sheet__event">${esc(r.e)}</span>` +
          `<span class="rd-pc-sheet__who">${esc(r.w)}</span></div>`
        ).join('') + `</div>`
      ).join('');
    } else {
      body = `<p class="rd-pc-sheet__note">${preview.class === 'B'
        ? 'Class B keepsake — Cormorant display, gold hairlines, proofed on its own page.'
        : 'Working document — black on white, repeating headers, built for the day.'}</p>`
        + `<p>Source page: <strong>${esc(preview.source)}</strong></p>`
        + (preview.blocked ? `<p class="rd-pc-preview__warn"><strong>Blocked:</strong> ${esc(preview.status)}</p>` : '');
    }
    return `<aside class="rd-pc-split__preview">`
      + `<div class="rd-pc-inline-preview__head">`
      + `<div class="rd-pagehead__eyebrow">Preview · ${esc(preview.title.toLowerCase())}</div>`
      + `<span>Class ${esc(preview.class)} · ${esc(preview.paper || 'Letter')} · ${preview.pages} page${preview.pages === 1 ? '' : 's'}</span>`
      + `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdPcPrintOne('${esc(preview.id)}')">Open print view</button>`
      + `</div>`
      + `<div class="rd-pc-sheet">`
      + `<div class="rd-pc-sheet__kicker">${esc(coupleLine())}</div>`
      + `<h2>${esc(preview.title)}</h2>`
      + `<p class="rd-pc-sheet__sub">${esc(who.dateLabel)}</p>`
      + body
      + `<div class="rd-pc-sheet__foot"><span>Printed ${esc(fmtLong(preview.lastPrinted) === '—' ? '31 July 2026' : fmtLong(preview.lastPrinted))}</span>`
      + `<span>Page 1 of ${preview.pages}</span></div>`
      + `</div></aside>`;
  }

  function renderDayOfView() {
    const host = document.getElementById('pc-view-dayof');
    if (!host) return;
    const pack = dayOfAssembly();
    const f = pcFigures();
    let html = `<div class="rd-pc-dayof">`
      + `<div class="rd-pc-dayof__head">`
      + `<div><div class="rd-pagehead__eyebrow">In the pack · ${pack.length} documents · ${f.packPages} pages</div>`
      + `<p class="rd-help">assembled in the order they are needed on the day</p></div>`
      + `</div>`
      + `<div class="rd-pc-dayof__list">`;
    pack.forEach(x => {
      html += `<article class="rd-pc-dayof__row${/risk/i.test(x.status) ? ' is-risk' : ''}" onclick="rdPcOpenDrawer('${esc(x.id)}');rdSetPrintCentreView('preview')">`
        + `<div><div class="rd-pc-dayof__title">${x.pos} · ${esc(x.title)}</div>`
        + `<div class="rd-pc-dayof__detail">${esc(x.detail)}</div></div>`
        + `<div class="rd-pc-dayof__src">From ${esc(x.source)}</div>`
        + `<div class="rd-pc-dayof__pages">${x.pages} page${x.pages === 1 ? '' : 's'}</div>`
        + `<div class="rd-pc-dayof__status">${statusPill(x.status)}</div>`
        + `</article>`;
    });
    html += `</div>`;
    if (window._pcShowExclusions) {
      html += `<div class="rd-pc-excluded">`
        + `<div class="rd-pc-excluded__head"><div class="rd-pagehead__eyebrow">Excluded from the pack</div>`
        + `<p class="rd-help">deliberately · these are not day-of documents</p></div>`;
      EXCLUSIONS.forEach(ex => {
        html += `<div class="rd-pc-excluded__row">`
          + `<div><strong>${esc(ex.title)}</strong><div class="rd-help">${esc(ex.note)}</div></div>`
          + `<span class="rd-pc-excluded__dash">—</span>`
          + `<span class="rd-pc-excluded__dash">—</span>`
          + statusPill(ex.reason)
          + `</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    host.innerHTML = html;
  }

  function renderPreviewView() {
    const host = document.getElementById('pc-view-preview');
    if (!host) return;
    const f = pcFigures();
    const who = coupleLong();
    const page = window._pcPreviewPage || 2;
    host.innerHTML = `<div class="rd-pc-proof">`
      + `<div class="rd-pc-sheet rd-pc-sheet--proof">`
      + `<div class="rd-pc-sheet__kicker">${esc(who.couple)} · ${esc(who.dateLabel.replace(/^Sunday /, '').replace(/ 2026$/, ' 2026'))}</div>`
      + `<h2>Run sheet · by time</h2>`
      + `<p class="rd-pc-sheet__sub">Sunday 8 November · run sheet</p>`
      + `<p class="rd-pc-sheet__meta">${esc(who.venue)} · page ${page} of ${f.packPages}</p>`
      + RUN_SHEET_ROWS.map(r =>
        `<div class="rd-pc-sheet__row rd-pc-sheet__row--dense">`
        + `<span class="rd-pc-sheet__time">${esc(r.t)}</span>`
        + `<span class="rd-pc-sheet__event">${esc(r.e)}</span>`
        + `<span class="rd-pc-sheet__who">${esc(r.w)}</span>`
        + `<span class="rd-pc-sheet__note">${esc(r.n)}</span></div>`
      ).join('')
      + `<div class="rd-pc-sheet__foot"><span>Printed 26 July 2026</span><span>Page ${page} of ${f.packPages}</span></div>`
      + `</div>`
      + `<p class="rd-help rd-pc-proof__note">Print renders light regardless of theme. Numbering is continuous across the pack so a dropped page is noticeable. Class B keepsakes are proofed on their own pages.</p>`
      + `</div>`;
  }

  /* ── Drawer ──────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }

  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  function renderPcDrawer() {
    const slot = document.getElementById('print-centre-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = findPrintable(window._pcDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._pcDrawerTab, 10) || 0));
    const pack = pack11Items();
    const pos = pack.findIndex(p => p.id === x.id);
    const blocked = pack.filter(p => p.blocked);
    let body = '';
    if (tab === 0) {
      body =
        field('Source', x.source + ' →', `rdPcOpenSource('${esc(x.id)}')`) +
        field('Class', x.class === 'B' ? 'B · keepsake' : 'A · working document') +
        field('Paper', (x.paper || 'Letter') + (x.paper === 'Both' ? ', fit to page' : ' · A4 aware')) +
        field('Pages', String(x.pages)) +
        field('Last printed', fmtLong(x.lastPrinted)) +
        `<p class="rd-drawer__note">There is no print template. The page prints itself — screen chrome hides, the work surface expands. A separate template would be a second copy that drifts.</p>`;
    } else if (tab === 1) {
      body =
        field('Header', 'Couple · title · date printed') +
        field('Footer', 'Page x of y') +
        field('Colour', 'Black on white') +
        field('Breaks', x.id === 'timeline' ? 'At block boundaries' : 'At row boundaries') +
        field('Minimum type', '12pt') +
        `<p class="rd-drawer__note">Class A never prints gold or fills. If this document is opened from a share packet it prints the same way — the recipient gets the working document, not a styled page.</p>` +
        `<div class="rd-drawer__section-title">Contents</div>` +
        field('Events', '14') +
        field('Blocks', '4') +
        field('Vendor calls', '9');
    } else if (tab === 2) {
      body =
        field('In the day-of pack', pos >= 0 ? ('Yes · position ' + String(pos + 1).padStart(2, '0')) : 'Not in the 11-document job') +
        field('Pack size', pack.length + ' documents') +
        field('Pack status', blocked.length + ' blocked') +
        `<div class="rd-drawer__section-title">The pack · ${pack.length}</div>` +
        pack.filter((p, i) => i < 2 || p.blocked).map(p =>
          `<div class="rd-drawer__hist"><strong>${String(p.pos).padStart(2, '0')} ${esc(p.title)}</strong><div>${esc(p.status)}</div></div>`
        ).join('') +
        `<p class="rd-drawer__note">The pack prints as one job in this order. Two documents are blocked, so printing now produces nine pages and two gaps — the pack refuses rather than printing a partial.</p>`;
    } else {
      body =
        `<div class="rd-drawer__section-title">This document</div>` +
        `<div class="rd-drawer__hist"><strong>${esc(fmtShort(x.lastPrinted) === '—' ? '26 Jul' : fmtShort(x.lastPrinted))} · Ama</strong><div>Printed · ${x.pages} pages</div></div>` +
        `<div class="rd-drawer__hist"><strong>26 Jul · Ama</strong><div>Added to the day-of pack</div></div>` +
        `<div class="rd-drawer__hist"><strong>19 Jul · Ama</strong><div>Created from the timeline</div></div>` +
        `<p class="rd-drawer__note">Printed on 26 July, and the timeline has changed twice since — the paper copy is out of date. The log is the only way to know that, which is why printing is recorded.</p>`;
    }

    const foot = tab === 2
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPcResolveBlocked()">Resolve the two</button>`
        + `<button type="button" class="rd-btn" onclick="rdPcFullEditor('${esc(x.id)}')">Full editor</button>`
      : tab === 0
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPcPrintOne('${esc(x.id)}')">Print</button>`
          + `<button type="button" class="rd-btn" onclick="rdPcFullEditor('${esc(x.id)}')">Open full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdPcCloseDrawer()">Save</button>`
          + `<button type="button" class="rd-btn" onclick="rdPcFullEditor('${esc(x.id)}')">Full editor</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-pc-drawer" aria-label="Printable">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Printable · class ${esc(x.class)}</div>` +
      `<h2 class="rd-drawer__title">${esc(x.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      classPill(x.class) +
      `<span class="status-pill" data-pillscheme="gray">${x.pages} pages</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdPcCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdPcSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── actions ──────────────────────────────────────────────────────────── */

  function rdPcOpenDrawer(id) {
    window._pcDrawerId = id;
    window._pcPreviewId = id;
    renderPrintCentreRd();
  }
  function rdPcCloseDrawer() {
    window._pcDrawerId = null;
    renderPrintCentreRd();
  }
  function rdPcSetDrawerTab(i) {
    window._pcDrawerTab = i;
    renderPcDrawer();
  }
  function rdPcSelectPreview(id) {
    window._pcPreviewId = id;
    window._pcDrawerId = id;
    if (window._pcMode === 'table') {
      renderTableView();
      renderPcDrawer();
    } else renderPrintCentreRd();
  }
  function rdPcToggleSel(id) {
    if (window._pcSel.has(id)) window._pcSel.delete(id);
    else window._pcSel.add(id);
    renderPcBulk();
    if (window._pcMode === 'table') renderTableView();
  }
  function rdPcBulkClear() {
    window._pcSel.clear();
    renderPrintCentreRd();
  }
  async function rdPcBulk(action) {
    const ids = Array.from(window._pcSel);
    if (!ids.length) return;
    const pc = ensurePc();
    if (action === 'pack') {
      ids.forEach(id => {
        if (pc.pack.indexOf(id) < 0) pc.pack.push(id);
      });
      persistPc();
      if (typeof showToast === 'function') showToast('Added to day-of pack', 'ok');
      renderPrintCentreRd();
      return;
    }
    if (action === 'paper') {
      const next = (typeof covPrompt === 'function'
        ? await covPrompt('Paper size (Letter, A4, or Both, fit to page)', pc.paper || 'Letter')
        : window.prompt('Paper size (Letter, A4, or Both, fit to page)', pc.paper || 'Letter'));
      if (!next) return;
      const cleaned = String(next).trim();
      if (/both/i.test(cleaned)) pc.paper = 'Both';
      else {
        const match = PAPER_CYCLE.find(p => p.toLowerCase() === cleaned.toLowerCase());
        pc.paper = match || 'Letter';
      }
      persistPc();
      renderPrintCentreRd();
      return;
    }
    if (action === 'print' || action === 'pdf') printSequence(ids);
  }
  function rdPcTogglePack(id) {
    const pc = ensurePc();
    const i = pc.pack.indexOf(id);
    if (i >= 0) pc.pack.splice(i, 1);
    else pc.pack.push(id);
    persistPc();
    renderPrintCentreRd();
  }
  function rdPcPrintOne(id) {
    window._pcPreviewId = id;
    printPrintable(id);
  }
  function rdPcPrintSection() {
    if (window._pcMode === 'dayof') {
      printDayOfPack();
      return;
    }
    if (window._pcPreviewId) {
      printPrintable(window._pcPreviewId);
      return;
    }
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdPcOpenSource(id) {
    const item = findPrintable(id);
    const target = (item && item.printTarget) || id;
    if (typeof showPanel === 'function') showPanel(target);
  }
  function rdPcFullEditor(id) {
    const x = findPrintable(id || window._pcDrawerId || window._pcPreviewId);
    if (x) rdPcOpenSource(x.id);
    else if (typeof showPanel === 'function') showPanel('timeline');
  }
  function rdPcResolveBlocked() {
    const first = pack11Items().find(p => p.blocked);
    if (first) rdPcOpenSource(first.id);
  }
  function rdPcToggleExclusions() {
    window._pcShowExclusions = !window._pcShowExclusions;
    renderPrintCentreRd();
  }
  function rdPcCycleFilter(field) {
    const options = { all: true };
    if (field === 'class') { options.A = true; options.B = true; }
    if (field === 'source') allPrintables().forEach(x => { options[x.source] = true; });
    if (field === 'status') {
      options.Ready = true;
      options.Blocked = true;
      options.Printed = true;
      options['At risk'] = true;
    }
    const list = Object.keys(options);
    const cur = (window._pcUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._pcUiFilters[field] = list[(i + 1) % list.length];
    renderPrintCentreRd();
  }
  function rdPcClearFilter(field) {
    window._pcUiFilters[field] = 'all';
    renderPrintCentreRd();
  }
  function rdPcCycleSort() {
    const order = ['class', 'source', 'status', 'title'];
    const i = order.indexOf(window._pcSort || 'class');
    window._pcSort = order[(i + 1) % order.length];
    renderPrintCentreRd();
  }
  function rdPcPickSort(val) {
    window._pcSort = val || 'class';
    renderPrintCentreRd();
  }
  function rdPcOpenSort(btn) {
    if (typeof window.rdPickOne !== 'function') {
      rdPcCycleSort();
      return;
    }
    window.rdPickOne(btn, [
      { value: 'class', label: 'Sort by class' },
      { value: 'source', label: 'Sort by source' },
      { value: 'status', label: 'Sort by status' },
      { value: 'title', label: 'Sort by document' }
    ], window._pcSort || 'class', function (val) {
      window._pcSort = val || 'class';
      renderPrintCentreRd();
    });
  }
  function savePrintView() {
    if (typeof setSavedView === 'function') setSavedView('print-centre', window._pcRailView || 'everything');
    if (typeof showToast === 'function') showToast('Print Centre view remembered', 'ok');
  }

  function renderPrintCentreRd() {
    ensurePc();
    if (window.rdColumns) {
      window.rdColumns.register(COL_SCOPE, PC_COLUMNS.slice(), function () { renderPrintCentreRd(); });
    }
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('print-centre', window._pcRailView || 'everything');
      if (saved) window._pcRailView = saved === 'all' ? 'everything' : saved;
    }
    uedPrintCentreShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('print-centre');
    applyViewMode();
    renderPcStatsRd();
    renderPcToolbar();
    renderPcBulk();

    const mode = window._pcMode || 'table';
    if (mode === 'dayof') renderDayOfView();
    else if (mode === 'preview') renderPreviewView();
    else renderTableView();

    renderPcDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'print-centre'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('print-centre');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('print-centre');
  }

  window.uedPrintCentreShell = uedPrintCentreShellRd;
  window.renderPrintCentrePage = renderPrintCentreRd;
  window.renderPrintCentreRd = renderPrintCentreRd;
  window.rdSetPrintCentreView = rdSetPrintCentreView;
  window.applyPrintCentreRailView = applyPrintCentreRailView;
  window.pcRailCounts = pcRailCounts;
  window.pcFigures = pcFigures;
  window.togglePaperSize = togglePaperSize;
  window.setPrintCentrePaper = setPaperSize;
  window.exportAllPDF = exportAllPDF;
  window.printSelection = printSelection;
  window.printDayOfPack = printDayOfPack;
  window.savePrintView = savePrintView;
  window.rdPcSelectPreview = rdPcSelectPreview;
  window.rdPcOpenDrawer = rdPcOpenDrawer;
  window.rdPcCloseDrawer = rdPcCloseDrawer;
  window.rdPcSetDrawerTab = rdPcSetDrawerTab;
  window.rdPcToggleSel = rdPcToggleSel;
  window.rdPcBulkClear = rdPcBulkClear;
  window.rdPcBulk = rdPcBulk;
  window.rdPcTogglePack = rdPcTogglePack;
  window.rdPcPrintOne = rdPcPrintOne;
  window.rdPcPrintSection = rdPcPrintSection;
  window.rdPcOpenSource = rdPcOpenSource;
  window.rdPcFullEditor = rdPcFullEditor;
  window.rdPcResolveBlocked = rdPcResolveBlocked;
  window.rdPcToggleExclusions = rdPcToggleExclusions;
  window.rdPcCycleFilter = rdPcCycleFilter;
  window.rdPcClearFilter = rdPcClearFilter;
  window.rdPcCycleSort = rdPcCycleSort;
  window.rdPcPickSort = rdPcPickSort;
  window.rdPcOpenSort = rdPcOpenSort;
  window.printPrintable = printPrintable;

  function hookPcPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS['print-centre'] = function () { renderPrintCentreRd(); };
    }
    window.renderPrintCentre = renderPrintCentreRd;
  }
  hookPcPanelRenderer();
  var _showPanelPc = window.showPanel;
  if (typeof _showPanelPc === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelPc.call(window, id, forceOpen);
      hookPcPanelRenderer();
      return out;
    };
  }
})();
