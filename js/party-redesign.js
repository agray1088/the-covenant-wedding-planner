/* Wedding Party page — mock 10a · grouped table · rail · drawer · full editor */
(function () {
  'use strict';

  const PARTY_DRAWER_TABS = ['Role', 'Attire', 'Duties', 'Contact', 'History'];
  const PARTY_ATTIRE_STATUSES = ['Fitted & paid', 'Deposit only', 'Not measured'];
  const RD_PARTY_COLUMN_KEYS = ['name', 'role', 'side', 'attireStatus', 'duties', 'fitting'];
  const RD_PARTY_COLUMNS = [
    { key: 'name', label: 'Member', width: '190px', required: true, type: 'person' },
    { key: 'role', label: 'Role', width: '150px', type: 'select' },
    { key: 'side', label: 'Side', width: '110px', type: 'select' },
    { key: 'attireStatus', label: 'Attire', width: '150px', type: 'select' },
    { key: 'duties', label: 'Duties', width: '130px', type: 'text' },
    { key: 'fitting', label: 'Fitting', width: '120px', type: 'date' }
  ];

  /* The table engine builds the header, group rows and select gutter from
     d.columns, so hiding a column means handing it a shorter list. */
  const PARTY_COL_SCOPE = 'party';
  if (window.rdColumns) {
    window.rdColumns.register(PARTY_COL_SCOPE, RD_PARTY_COLUMNS.slice(), () => {
      renderPartyPreviewTable();
      renderPartyToolbar();
    });
  }
  function partyVisibleColumns() {
    return window.rdColumns ? window.rdColumns.visible(PARTY_COL_SCOPE) : RD_PARTY_COLUMNS;
  }

  window._partyUiFilters = window._partyUiFilters || {
    side: 'all', attire: 'all', role: 'all', phase: 'all', owner: 'all', hideDone: false
  };
  window._partySort = window._partySort || 'side';
  window._partyRailView = window._partyRailView || 'all';
  window._partyRailGroupBy = window._partyRailGroupBy || 'side';

  const PARTY_DUTY_PHASES = ['Before the day', 'Morning of', 'Ceremony', 'Reception'];
  const PARTY_DUTY_COLUMNS = PARTY_DUTY_PHASES.concat(['Unassigned']);

  function partyRows() { return safeArray(data.party); }
  function partyDutyRows() {
    if (!data.partyDuties) data.partyDuties = [];
    return safeArray(data.partyDuties);
  }

  function partyInitials(name) {
    if (typeof RdDepth !== 'undefined' && RdDepth.initials) return RdDepth.initials(name || '');
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function partyCallTime(row) {
    if (row && row.callTime) return row.callTime;
    const role = String(row && row.role || '').toLowerCase();
    if (/maid|honour|honor|bride/.test(role)) return '7:30am';
    if (/flower/.test(role)) return '8:00am';
    if (/best man|groom/.test(role)) return '9:00am';
    return '9:00am';
  }

  function partyAttireKind(row) {
    if (row && row.attireKind) return row.attireKind;
    return partyMemberSide(row) === 'Groom' ? 'Suit' : 'Dress';
  }

  function partyAttireDetail(row) {
    if (row && row.attireDetail) return row.attireDetail;
    const st = partyAttireStatus(row);
    if (st === 'Fitted & paid') {
      const f = partyFittingLabel(row);
      return f !== '—' ? ('Collected ' + f) : 'Fitted';
    }
    if (st === 'Deposit only') return 'Deposit paid';
    return 'Not ordered';
  }

  function partyCardAttirePill(row) {
    const st = partyAttireStatus(row);
    if (st === 'Fitted & paid') return { label: 'Attire ready', tone: 'ok' };
    if (st === 'Deposit only') return { label: 'Deposit only', tone: 'warn' };
    return { label: 'Measurements due', tone: 'warn' };
  }

  function partyReadinessPct(row) {
    const st = partyAttireStatus(row);
    if (st === 'Fitted & paid') return 100;
    if (st === 'Deposit only') return 55;
    return 35;
  }

  function partyDutyOwnerName(duty) {
    if (!duty) return '';
    if (duty.ownerName) return String(duty.ownerName);
    if (duty.ownerId) {
      const m = partyRows().find(r => String(r._id) === String(duty.ownerId));
      if (m) return m.name || '';
    }
    return '';
  }

  function partyDutyHasOwner(duty) {
    return !!(partyDutyOwnerName(duty) && partyDutyOwnerName(duty) !== 'Nobody');
  }

  function partyDutyPhase(duty) {
    const p = String(duty && duty.phase || '').trim();
    if (PARTY_DUTY_PHASES.indexOf(p) >= 0) return p;
    return 'Before the day';
  }

  function partyDutyColumn(duty) {
    if (!partyDutyHasOwner(duty)) return 'Unassigned';
    return partyDutyPhase(duty);
  }

  function partyDutyStatusLabel(duty) {
    if (!duty) return '';
    if (duty.status === 'done' || duty.status === 'Done') return 'Done';
    if (duty.when) return String(duty.when);
    return '';
  }

  function partyDutyIsDone(duty) {
    const s = String(duty && duty.status || '').toLowerCase();
    return s === 'done';
  }

  function partyDutyIsBlocked(duty) {
    return !!(duty && (duty.blocked || /blocked/i.test(String(duty.note || ''))));
  }

  function partyDutiesForMember(row) {
    const name = String(row && row.name || '').trim().toLowerCase();
    const id = row && row._id != null ? String(row._id) : '';
    const fromBoard = partyDutyRows().filter(d => {
      if (id && String(d.ownerId || '') === id) return true;
      return name && String(d.ownerName || '').trim().toLowerCase() === name;
    });
    if (fromBoard.length) return fromBoard;
    const legacy = Array.isArray(row && row.duties) ? row.duties : [];
    return legacy.map((title, i) => ({
      _id: 'legacy-' + id + '-' + i,
      title: String(title).split('·')[0].trim() || String(title),
      phase: /speech|toast/i.test(String(title)) ? 'Reception' : 'Ceremony',
      ownerId: id,
      ownerName: row.name,
      when: '',
      status: '',
      legacy: true
    }));
  }

  function partyDutyCount(row) {
    return partyDutiesForMember(row).length;
  }

  function ensurePartyDemoSeed() {
    // Demo fiction is opt-in via Load sample data only — empty stays empty.
    partyRows().forEach(row => {
      ensureRowId(row, 'party');
      if (!row.callTime) row.callTime = partyCallTime(row);
      if (!row.attireKind) row.attireKind = partyAttireKind(row);
      if (!row.attireDetail) row.attireDetail = partyAttireDetail(row);
    });
    partyDutyRows().forEach(d => { if (typeof ensureRowId === 'function') ensureRowId(d, 'partyDuty'); });
    return;
    if (!partyRows().length) {
      const seed = [
        { name: 'Efua Mensah', role: 'Maid of honour', side: 'Bride', attireStatus: 'Fitted & paid', duties: ['Speech · 5 min', 'Processional', 'Hold the bouquet'], dutyLabels: 'Speech · toast', fitting: '12 Aug', fittingDetail: '12 Aug · Adjeley Bridal', relationship: 'Cousin', cost: 340, sizeNote: 'Hem shortened 1in', arrives: 'Friday evening', room: 'Grace Hall block', notes: 'Arriving Friday evening — needs a seat at the rehearsal dinner and a room in the Grace Hall block.', speechOrder: 2, speechMinutes: 5, speechTitle: 'Reading + toast', callTime: '7:30am', attireKind: 'Dress', attireDetail: 'Fitted, 2nd fitting done' },
        { name: 'Akosua Owusu', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Fitted & paid', dutyLabels: 'Processional', fitting: '12 Aug', duties: ['Processional'], callTime: '8:00am', attireKind: 'Dress', attireDetail: 'Collected 12 Aug' },
        { name: 'Nana Ama Boateng', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Deposit only', dutyLabels: 'Processional', fitting: '19 Aug', duties: ['Processional'], callTime: '8:00am', attireKind: 'Dress', attireDetail: 'Deposit paid' },
        { name: 'Adjoa Sarpong', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Not measured', dutyLabels: 'Guest book', duties: ['Guest book'], callTime: '8:30am', attireKind: 'Dress', attireDetail: 'Not ordered' },
        { name: 'Serwaa Mensah', role: 'Flower girl', side: 'Bride', attireStatus: 'Fitted & paid', dutyLabels: 'Processional', fitting: '5 Aug', duties: ['Processional'], callTime: '8:00am', attireKind: 'Dress', attireDetail: 'Collected 5 Aug' },
        { name: 'Yaw Darko', role: 'Best man', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Speech · rings', fitting: '9 Aug', duties: ['Speech · 6 min', 'Ushering', 'Ring bearer walk'], speechOrder: 1, speechMinutes: 6, speechTitle: 'Toast to the couple', callTime: '9:00am', attireKind: 'Suit', attireDetail: 'Collected 9 Aug' },
        { name: 'Kofi Asante', role: 'Groomsman', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Ushering', fitting: '9 Aug', duties: ['Ushering'], callTime: '9:00am', attireKind: 'Suit', attireDetail: 'Collected 9 Aug' },
        { name: 'Kwabena Osei', role: 'Groomsman', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Ushering', fitting: '9 Aug', duties: ['Ushering'], callTime: '9:00am', attireKind: 'Suit', attireDetail: 'Collected 9 Aug' },
        { name: 'Michael Tetteh', role: 'Groomsman', side: 'Groom', attireStatus: 'Deposit only', dutyLabels: 'Transport', fitting: '26 Aug', duties: ['Transport'], callTime: '9:00am', attireKind: 'Suit', attireDetail: 'Deposit paid', speechOrder: 0 },
        { name: 'Kojo Amoah', role: 'Ring bearer', side: 'Groom', attireStatus: 'Not measured', dutyLabels: 'Recessional', duties: ['Recessional'], callTime: '9:30am', attireKind: 'Suit', attireDetail: 'Not ordered' }
      ];
      seed.forEach(row => {
        ensureRowId(row, 'party');
        if (!row.phone) row.phone = '';
        if (!row.email) row.email = '';
        data.party.push(row);
      });
    }
    partyRows().forEach(row => {
      ensureRowId(row, 'party');
      if (!row.callTime) row.callTime = partyCallTime(row);
      if (!row.attireKind) row.attireKind = partyAttireKind(row);
      if (!row.attireDetail) row.attireDetail = partyAttireDetail(row);
    });
    ensurePartyDutiesSeed();
  }

  function ensurePartyDutiesSeed() {
    // Demo fiction is opt-in via Load sample data only — empty stays empty.
    return;
    if (partyDutyRows().length) return;
    const byName = name => partyRows().find(r => String(r.name || '').toLowerCase() === String(name).toLowerCase());
    const seed = [
      { title: 'Collect suits from Kingsway', phase: 'Before the day', ownerName: 'Michael Tetteh', when: 'Due 2 Oct', blocked: true, note: 'Blocked · measurements' },
      { title: 'Confirm shuttle driver', phase: 'Before the day', ownerName: 'Michael Tetteh', when: 'Due 12 Oct' },
      { title: 'Buy flower girl basket', phase: 'Before the day', ownerName: 'Akosua Owusu', status: 'Done', when: 'Done' },
      { title: 'Rehearsal reminder to party', phase: 'Before the day', ownerName: 'Efua Mensah', when: 'Due 4 Nov' },
      { title: 'Processional walk-through', phase: 'Before the day', ownerName: 'Efua Mensah', when: 'Due 5 Nov' },
      { title: 'Usher briefing sheet', phase: 'Before the day', ownerName: 'Kofi Asante', when: 'Due 6 Nov' },
      { title: 'Measure ring bearer', phase: 'Before the day', ownerName: 'Yaw Darko', when: 'Due 20 Aug' },
      { title: 'Hair & makeup timing sheet', phase: 'Morning of', ownerName: 'Efua Mensah', when: '7:30am' },
      { title: 'Get rings from safe', phase: 'Morning of', ownerName: 'Michael Tetteh', when: '9:00am', critical: true },
      { title: 'Breakfast for bridal suite', phase: 'Morning of', ownerName: 'Akosua Owusu', when: '8:00am' },
      { title: 'Boutonniere pickup', phase: 'Morning of', ownerName: 'Kofi Asante', when: '8:30am' },
      { title: 'Flower girl arrival', phase: 'Morning of', ownerName: 'Serwaa Mensah', when: '8:00am' },
      { title: 'Groomsmen roll call', phase: 'Morning of', ownerName: 'Yaw Darko', when: '9:00am' },
      { title: 'Line up processional', phase: 'Ceremony', ownerName: 'Efua Mensah', when: '3:20pm' },
      { title: 'Hold rings until vows', phase: 'Ceremony', ownerName: 'Michael Tetteh', when: '3:33pm' },
      { title: 'Hold the bouquet', phase: 'Ceremony', ownerName: 'Efua Mensah', when: '3:04pm' },
      { title: 'Ushering · doors', phase: 'Ceremony', ownerName: 'Kofi Asante', when: '2:45pm' },
      { title: 'Ring bearer walk', phase: 'Ceremony', ownerName: 'Kojo Amoah', when: '3:10pm' },
      { title: 'Best man speech', phase: 'Reception', ownerName: 'Yaw Darko', when: '7:40pm' },
      { title: 'Maid of honour speech', phase: 'Reception', ownerName: 'Efua Mensah', when: '8:40pm' },
      { title: 'Collect gifts to car', phase: 'Reception', ownerName: 'Yaw Darko', when: '10:30pm' },
      { title: 'Transport to venue', phase: 'Reception', ownerName: 'Michael Tetteh', when: '6:00pm' },
      { title: 'Return hired suits', phase: 'Before the day', ownerName: '', when: 'Due 10 Nov' },
      { title: 'Day-after brunch host', phase: 'Before the day', ownerName: '', when: '9 Nov' },
      { title: 'Guest book steward', phase: 'Ceremony', ownerName: '', when: 'Day-of critical', critical: true }
    ];
    seed.forEach(d => {
      const m = d.ownerName ? byName(d.ownerName) : null;
      const row = {
        title: d.title,
        phase: d.phase,
        ownerName: d.ownerName || '',
        ownerId: m ? m._id : '',
        when: d.when || '',
        status: d.status || '',
        blocked: !!d.blocked,
        note: d.note || '',
        critical: !!d.critical
      };
      ensureRowId(row, 'partyDuty');
      data.partyDuties.push(row);
    });
    if (typeof save === 'function') save();
  }

  function partyLinkedGuest(row) {
    if (!row) return null;
    if (row.guestId && typeof findRecordById === 'function') {
      const g = findRecordById('guests', row.guestId);
      if (g) return g;
    }
    const name = String(row.name || '').trim().toLowerCase();
    if (!name) return null;
    return safeArray(data.guests).find(g => String(g.name || '').trim().toLowerCase() === name) || null;
  }

  function partyMemberSide(row) {
    if (row && row.side) return row.side;
    const g = partyLinkedGuest(row);
    if (g && g.side) return g.side === 'Groom' ? 'Groom' : (g.side === 'Bride' ? 'Bride' : g.side);
    const rk = typeof partyRoleKey === 'function' ? partyRoleKey(row && row.role) : '';
    if (rk === 'groomsman') return 'Groom';
    if (rk === 'bridesmaid' || rk === 'flower') return 'Bride';
    return 'Bride';
  }

  function partySideGroupTitle(side) {
    const s = String(side || '').toLowerCase();
    if (s === 'groom') return "Groom's side";
    return "Bride's side";
  }

  function partyAttireStatus(row) {
    if (row && row.attireStatus) return row.attireStatus;
    const st = String(row && row.status || '').toLowerCase();
    if (/ready|ordered|confirmed|paid|outfit/i.test(st)) return 'Fitted & paid';
    if (/deposit|scheduled|fitting/i.test(st)) return 'Deposit only';
    if (st) return row.status;
    return 'Not measured';
  }

  function partyAttireReady(row) {
    return partyAttireStatus(row) === 'Fitted & paid';
  }

  function partyAttirePillHtml(status) {
    const s = status || 'Not measured';
    let scheme = 'neutral';
    if (s === 'Fitted & paid') scheme = 'green';
    else if (s === 'Deposit only') scheme = 'amber';
    if (typeof guestRsvpPillHtml === 'function') {
      return guestRsvpPillHtml(s).replace(/data-pillscheme="[^"]+"/, 'data-pillscheme="' + scheme + '"');
    }
    const cls = scheme === 'green' ? 'pill-ok' : (scheme === 'amber' ? 'pill-warn' : 'pill-neutral');
    return '<span class="status-pill ' + cls + '">' + escapeHtml(s) + '</span>';
  }

  function partyDutiesLabel(row) {
    const board = typeof partyDutiesForMember === 'function' ? partyDutiesForMember(row) : [];
    if (board.length && !board[0].legacy) {
      return board.map(d => String(d.title || '').split('·')[0].trim()).filter(Boolean).slice(0, 2).join(' · ') || '—';
    }
    if (row && row.dutyLabels) return row.dutyLabels;
    if (Array.isArray(row && row.duties) && row.duties.length) {
      return row.duties.map(d => String(d).split('·')[0].trim()).slice(0, 2).join(' · ');
    }
    return row && row.duties ? String(row.duties) : '—';
  }

  function partyFittingLabel(row) {
    const f = row && (row.fitting || row.fittingDate);
    if (!f) return '—';
    if (typeof humanDate === 'function' && /^\d{4}-\d{2}-\d{2}/.test(String(f))) {
      try { return humanDate(f, { month: 'short', day: 'numeric' }); } catch (e) { /* keep */ }
    }
    return String(f);
  }

  function partyHasSpeakingDuty(row) {
    const lab = partyDutiesLabel(row).toLowerCase();
    return /speech|toast|reading/.test(lab) || (row && row.speechOrder);
  }

  function partyAttireOutstanding(row) {
    return partyAttireStatus(row) !== 'Fitted & paid';
  }

  function partyMatchesRailView(row, view) {
    view = view || window._partyRailView || 'all';
    if (view === 'all') return true;
    if (view === 'bride') return partyMemberSide(row) === 'Bride';
    if (view === 'groom') return partyMemberSide(row) === 'Groom';
    if (view === 'attire-outstanding') return partyAttireOutstanding(row);
    if (view === 'speaking') return partyHasSpeakingDuty(row);
    return true;
  }

  function partyMatchesFilters(row) {
    if (!partyMatchesRailView(row)) return false;
    const ui = window._partyUiFilters || {};
    if (ui.side && ui.side !== 'all' && partyMemberSide(row) !== ui.side) return false;
    if (ui.attire && ui.attire !== 'all' && partyAttireStatus(row) !== ui.attire) return false;
    if (ui.role && ui.role !== 'all' && String(row.role || '') !== ui.role) return false;
    if (typeof partyMemberMatches === 'function' && !partyMemberMatches(row)) return false;
    return true;
  }

  function partyRailGroupByMode() {
    return window._partyRailGroupBy || 'side';
  }

  function partyRowGroupMeta(row) {
    const mode = partyRailGroupByMode();
    if (mode === 'role') {
      const role = String(row.role || 'Other').trim() || 'Other';
      return { key: 'role:' + role.toLowerCase(), title: role, sort: role.toLowerCase() };
    }
    if (mode === 'attire') {
      const st = partyAttireStatus(row);
      return { key: 'attire:' + st, title: st, sort: st };
    }
    const side = partyMemberSide(row);
    const title = partySideGroupTitle(side);
    return { key: 'side:' + side.toLowerCase(), title: title, sort: side === 'Groom' ? 'b' : 'a' };
  }

  function partyGroupHeaderLabel(meta, groupRows) {
    const items = groupRows || [];
    const n = items.length;
    const title = (meta && meta.title) || 'Group';
    const rows = items.map(it => (it && it.r != null ? it.r : it));
    const ready = rows.filter(partyAttireReady).length;
    const mode = partyRailGroupByMode();
    if (mode === 'attire') return title + ' · ' + n + ' · ' + ready + ' attire ready';
    if (mode === 'role') return title + ' · ' + n + (ready ? (' · ' + ready + ' attire ready') : '');
    return title + ' · ' + n + ' · ' + ready + ' attire ready';
  }

  function partyStatsData() {
    const rows = partyRows();
    const filtered = rows.filter(partyMatchesFilters);
    const bride = rows.filter(r => partyMemberSide(r) === 'Bride').length;
    const groom = rows.filter(r => partyMemberSide(r) === 'Groom').length;
    const attireReady = rows.filter(partyAttireReady).length;
    const speaking = rows.filter(partyHasSpeakingDuty).length;
    const duties = partyDutyRows();
    const unassigned = duties.filter(d => !partyDutyHasOwner(d));
    const assigned = duties.filter(partyDutyHasOwner);
    const blocked = duties.filter(partyDutyIsBlocked);
    const done = duties.filter(partyDutyIsDone);
    const unassignedCritical = unassigned.filter(d => d.critical || /critical/i.test(String(d.when || ''))).length;
    const measurementsDue = rows.filter(r => partyAttireStatus(r) === 'Not measured').length;
    return {
      total: rows.length, bride, groom, attireReady, speaking, shown: filtered.length,
      duties: duties.length, assigned: assigned.length, unassigned: unassigned.length,
      blocked: blocked.length, done: done.length, unassignedCritical, measurementsDue
    };
  }

  function rdGetPartyView() {
    try {
      const v = localStorage.getItem('rdPartyView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default')) || 'table';
      return (v === 'cards' || v === 'duties') ? v : 'table';
    } catch (e) { return 'table'; }
  }
  function rdSetPartyView(mode) {
    const m = (mode === 'cards' || mode === 'duties') ? mode : 'table';
    try { localStorage.setItem('rdPartyView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default'), m); } catch (e) {}
    renderParty();
  }
  function rdApplyPartyViewMode() {
    const mode = rdGetPartyView();
    ['table', 'cards', 'duties'].forEach(v => {
      const el = document.getElementById('party-view-' + v);
      if (el) el.hidden = mode !== v;
    });
    const speak = document.getElementById('party-speaking-section');
    if (speak) speak.hidden = mode !== 'table';
  }

  function partyPageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetPartyView();
    const printLabel = view === 'duties' ? 'Print duty sheets' : 'Print section';
    const primary = view === 'duties'
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="addPartyDuty()">Add duty</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="addPartyRow()">Add member</button>`;
    const email = view === 'table'
      ? `<button type="button" class="rd-btn rd-btn--quiet" onclick="emailWeddingParty()">Send group email</button>`
      : '';
    const exportBtn = view === 'duties'
      ? ''
      : `<button type="button" class="rd-btn" onclick="exportSectionCSV('Wedding Party',data.party)">Export</button>`;
    return `${email}
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>${printLabel}</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdPartyFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      ${exportBtn}
      ${primary}`;
  }

  function partySurfaceRowHtml() {
    return `<div class="rd-surface__row" id="party-surface-row">
      <div class="rd-surface__main" id="party-view-host">
        <div class="rd-view" id="party-view-table" data-party-view="table">
          <div class="rd-table-wrap ued-table-wrap" id="cwp-party"></div>
          <span class="rd-table-foot ued-soft" id="cwp-party-foot"></span>
          <section class="rd-party-speaking" id="party-speaking-section" aria-label="Speaking order"></section>
        </div>
        <div class="rd-view" id="party-view-cards" data-party-view="cards" hidden>
          <div class="rd-cardgrid" id="party-cards-view"></div>
        </div>
        <div class="rd-view" id="party-view-duties" data-party-view="duties" hidden>
          <div class="rd-kanban" id="party-duties-view"></div>
        </div>
      </div>
      <div id="party-drawer-slot"></div>
    </div>`;
  }

  function uedPartyShell() {
    const panel = document.getElementById('panel-party');
    if (!panel) return;
    panel.classList.add('ued-scope', 'party-mockup');
    if (panel.dataset.uedShell === 'party-rd10a-v2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = partyPageheadActionsHtml();
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    panel.dataset.uedShell = 'party-rd10a-v2';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">People</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Wedding Party</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${partyPageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="party-stats"></div>
      <div class="rd-toolbar" id="party-toolbar"></div>
      <div class="rd-bulkbar" id="party-bulk-bar" hidden></div>
      <div class="rd-surface">${partySurfaceRowHtml()}</div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderPartyStats() {
    const host = document.getElementById('party-stats');
    if (!host) return;
    const s = partyStatsData();
    const view = rdGetPartyView();
    const resetMemberFilters = () => {
      window._partyUiFilters = Object.assign({}, window._partyUiFilters, {
        side: 'all', attire: 'all', role: 'all', phase: 'all', owner: 'all'
      });
    };
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      let items;
      if (view === 'cards') {
        items = [
          { label: 'Members', value: String(s.total), delta: s.total ? '↑1 since Monday' : undefined, filter: 'Show all', onFilter: () => { resetMemberFilters(); renderParty(); } },
          {
            label: 'Attire ready',
            value: s.attireReady + ' of ' + s.total,
            target: { pct: s.total ? Math.round((s.attireReady / s.total) * 100) : 0, tick: 100 },
            filter: 'Filter · Fitted & paid',
            onFilter: () => { window._partyUiFilters.attire = 'Fitted & paid'; renderParty(); }
          },
          { label: 'Speeches', value: String(s.speaking), filter: 'Show speakers', onFilter: () => { applyPartyRailView('speaking'); } },
          {
            label: 'Duties unassigned',
            value: String(s.unassigned),
            attention: s.unassignedCritical ? (s.unassignedCritical + ' are day-of critical') : (s.unassigned ? 'need an owner' : undefined),
            filter: 'Open Duties',
            onFilter: () => { rdSetPartyView('duties'); }
          },
          {
            label: 'Measurements due',
            value: String(s.measurementsDue),
            attention: s.measurementsDue ? 'deadline 30 Aug' : undefined,
            filter: 'Filter · Not measured',
            onFilter: () => { window._partyUiFilters.attire = 'Not measured'; renderParty(); }
          }
        ];
      } else if (view === 'duties') {
        items = [
          { label: 'Duties', value: String(s.duties), filter: 'Show all', onFilter: () => { window._partyUiFilters.phase = 'all'; window._partyUiFilters.owner = 'all'; window._partyUiFilters.hideDone = false; renderParty(); } },
          {
            label: 'Assigned',
            value: String(s.assigned),
            target: { pct: s.duties ? Math.round((s.assigned / s.duties) * 100) : 0, tick: 100 }
          },
          {
            label: 'Unassigned',
            value: String(s.unassigned),
            attention: s.unassignedCritical ? (s.unassignedCritical + ' is day-of critical') : undefined,
            filter: 'Filter · Unassigned',
            onFilter: () => { window._partyUiFilters.owner = 'unassigned'; renderParty(); }
          },
          {
            label: 'Blocked',
            value: String(s.blocked),
            attention: s.blocked ? 'suits · measurements' : undefined
          },
          {
            label: 'Done',
            value: String(s.done),
            delta: s.done ? '↑4 this week' : undefined
          }
        ];
      } else {
        items = [
          { label: 'Members', value: s.total, filter: 'Show all', onFilter: () => { resetMemberFilters(); renderParty(); } },
          { label: "Bride's side", value: s.bride, filter: "Filter · Bride's side", onFilter: () => { window._partyUiFilters.side = 'Bride'; renderParty(); } },
          { label: "Groom's side", value: s.groom, filter: "Filter · Groom's side", onFilter: () => { window._partyUiFilters.side = 'Groom'; renderParty(); } },
          { label: 'Attire ready', value: s.attireReady, filter: 'Filter · Fitted & paid', onFilter: () => { window._partyUiFilters.attire = 'Fitted & paid'; renderParty(); } },
          {
            label: 'Speaking',
            value: s.speaking,
            filter: 'Show speakers',
            attention: s.total && s.attireReady < s.total ? (s.total - s.attireReady) + ' still need fittings' : undefined
          }
        ];
      }
      RdDepth.renderStats(host, items);
      return;
    }
    const cell = (label, val) =>
      `<div class="m-stat"><div class="m-stat-label">${label}</div><div class="m-stat-val">${val}</div></div>`;
    if (view === 'duties') {
      host.innerHTML = [cell('Duties', s.duties), cell('Assigned', s.assigned), cell('Unassigned', s.unassigned), cell('Blocked', s.blocked), cell('Done', s.done)].join('');
    } else if (view === 'cards') {
      host.innerHTML = [cell('Members', s.total), cell('Attire ready', s.attireReady + ' of ' + s.total), cell('Speeches', s.speaking), cell('Duties unassigned', s.unassigned), cell('Measurements due', s.measurementsDue)].join('');
    } else {
      host.innerHTML = [cell('Members', s.total), cell("Bride's side", s.bride), cell("Groom's side", s.groom), cell('Attire ready', s.attireReady), cell('Speaking', s.speaking)].join('');
    }
  }

  function partyFilterChip(label, field) {
    const ui = window._partyUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const text = on ? (label + ': ' + cur) : (label + ': all');
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="openPartyFilter('${field}',this)">${escapeHtml(text)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();clearPartyFilter('${field}')">&#10005;</span>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>`)
      + `</button>`;
  }

  function partyDutyFilterChip(label, field) {
    const ui = window._partyUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const text = on ? (label + ': ' + cur) : (label + ': all');
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="openPartyDutyFilter('${field}',this)">${escapeHtml(text)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();clearPartyDutyFilter('${field}')">&#10005;</span>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>`)
      + `</button>`;
  }

  function renderPartyToolbar() {
    const host = document.getElementById('party-toolbar');
    if (!host) return;
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetPartyView();
    const switcher =
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Party view">` +
      `<button type="button" class="rd-viewswitch__item${view === 'table' ? ' is-active' : ''}" onclick="rdSetPartyView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'cards' ? ' is-active' : ''}" onclick="rdSetPartyView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'duties' ? ' is-active' : ''}" onclick="rdSetPartyView('duties')">Duties</button>` +
      `</div></div>`;

    if (view === 'duties') {
      const hideDone = !!(window._partyUiFilters && window._partyUiFilters.hideDone);
      host.innerHTML =
        partyDutyFilterChip('Phase', 'phase') +
        partyDutyFilterChip('Owner', 'owner') +
        `<button type="button" class="rd-chip${hideDone ? ' is-active' : ''}" onclick="togglePartyHideDone()">Hide done${hideDone ? '<span class="rd-chip__clear">&#10005;</span>' : ''}</button>` +
        `<span class="rd-party-drag-hint">Drag a card to reassign the phase</span>` +
        switcher;
      return;
    }

    /* Cards: filter chips stay; column and row-height controls drop out (29a). */
    const filters =
      partyFilterChip('Side', 'side') +
      partyFilterChip('Attire', 'attire') +
      partyFilterChip('Role', 'role');

    if (view === 'cards') {
      host.innerHTML =
        filters +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="openPartySort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${escapeHtml(partySortLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
        switcher;
      return;
    }

    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(PARTY_COL_SCOPE) : 'Columns';
    const colAllShown = window.rdColumns ? window.rdColumns.allShown(PARTY_COL_SCOPE) : true;
    host.innerHTML =
      filters +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdPartyOpenFilterBuilder(this)">Filter builder</button>` +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdPartyOpenViewsManager()">Views</button>` +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="openPartySort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${escapeHtml(partySortLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip${colAllShown ? ' rd-chip--ghost' : ''}" onclick="rdPartyOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${escapeHtml(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip" onclick="rdPartyAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>` +
      `<button type="button" class="rd-chip" onclick="rdCyclePartyRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${escapeHtml(rdPartyRowHeightLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      switcher;
  }

  function openPartyFilter(field, btn) {
    const opts = field === 'side'
      ? [{ value: 'all', label: 'All sides' }, { value: 'Bride', label: 'Bride' }, { value: 'Groom', label: 'Groom' }]
      : field === 'attire'
        ? [{ value: 'all', label: 'All attire' }].concat(PARTY_ATTIRE_STATUSES.map(s => ({ value: s, label: s })))
        : [{ value: 'all', label: 'All roles' }].concat([...new Set(partyRows().map(r => r.role).filter(Boolean))].sort().map(r => ({ value: r, label: r })));
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._partyUiFilters[field] || 'all', val => {
        window._partyUiFilters[field] = val || 'all';
        renderParty();
      });
      return;
    }
    const pick = opts.find(o => o.value !== 'all');
    if (pick) { window._partyUiFilters[field] = pick.value; renderParty(); }
  }
  function clearPartyFilter(field) {
    window._partyUiFilters[field] = 'all';
    renderParty();
  }
  function rdPartyOpenFilterBuilder() {
    if (typeof RdFurniture === 'undefined' || !RdFurniture.openFilterBuilder) return;
    const roles = Array.from(new Set(partyRows().map(r => r.role).filter(Boolean))).sort();
    const total = partyRows().length;
    RdFurniture.openFilterBuilder({
      pageLabel: 'Wedding Party',
      panelId: 'party',
      totalRows: total,
      fields: [
        { key: 'side', label: 'Side', options: ['Bride', 'Groom'] },
        { key: 'attire', label: 'Attire', options: PARTY_ATTIRE_STATUSES.slice() },
        { key: 'role', label: 'Role', options: roles }
      ],
      state: Object.assign({}, window._partyUiFilters),
      estimateMatch: function (state) {
        const flat = {};
        (state.conditions || []).forEach(c => { if (c.field && c.value) flat[c.field] = c.value; });
        return partyRows().filter(row => {
          if (flat.side && flat.side !== 'all' && partyMemberSide(row) !== flat.side && row.side !== flat.side) return false;
          if (flat.attire && flat.attire !== 'all' && partyAttireStatus(row) !== flat.attire) return false;
          if (flat.role && flat.role !== 'all' && row.role !== flat.role) return false;
          return true;
        }).length;
      },
      onApply: function (next) {
        window._partyUiFilters = Object.assign({ side: 'all', attire: 'all', role: 'all' }, next);
        renderParty();
      },
      onSaveView: function (name, flat) {
        window._partyUiFilters = Object.assign({ side: 'all', attire: 'all', role: 'all' }, flat);
        if (typeof setSavedView === 'function') setSavedView('party', name);
        renderParty();
      }
    });
  }
  window.rdPartyOpenFilterBuilder = rdPartyOpenFilterBuilder;

  function rdPartyOpenViewsManager() {
    if (typeof RdFurniture === 'undefined' || !RdFurniture.openSavedViewsManager) return;
    RdFurniture.openSavedViewsManager({
      pageLabel: 'Wedding Party',
      panelId: 'party',
      totalRows: partyRows().length,
      fields: [
        { key: 'side', label: 'Side', options: ['Bride', 'Groom'] },
        { key: 'attire', label: 'Attire', options: PARTY_ATTIRE_STATUSES.slice() },
        { key: 'role', label: 'Role', options: Array.from(new Set(partyRows().map(r => r.role).filter(Boolean))).sort() }
      ],
      onNewFromFilter: rdPartyOpenFilterBuilder,
      onApply: function (next) {
        window._partyUiFilters = Object.assign({ side: 'all', attire: 'all', role: 'all' }, next || {});
        renderParty();
      },
      onSelect: function () { renderParty(); }
    });
  }
  window.rdPartyOpenViewsManager = rdPartyOpenViewsManager;

  function renderPartyBulkBar() {
    const bar = document.getElementById('party-bulk-bar');
    if (!bar) return;
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('party') : [];
    const n = ids.length;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep"></span>
      <button type="button" class="rd-bulkbar__action" onclick="partyBulkSetAttire()">Set attire status</button>
      <button type="button" class="rd-bulkbar__action" onclick="partyBulkAssignDuty()">Assign duty</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdPartyOpenBulkEdit()">Bulk edit…</button>
      <button type="button" class="rd-bulkbar__action" onclick="partyBulkEmail()">Email selected</button>
      <button type="button" class="rd-bulkbar__action" onclick="printCurrentPage()">Print measurement sheet</button>
      <button type="button" class="rd-bulkbar__clear" onclick="partyBulkClear()">Clear selection</button>`;
  }

  function rdPartyOpenBulkEdit() {
    if (typeof RdFurniture === 'undefined' || !RdFurniture.openBulkEdit) return;
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('party') : [];
    const rows = partyRows().filter(r => ids.includes(String(r._id)));
    RdFurniture.openBulkEdit({
      count: rows.length || ids.length,
      names: rows.map(r => r.name).filter(Boolean),
      conflictCount: 0,
      fields: [
        { key: 'attireStatus', label: 'Attire status', options: PARTY_ATTIRE_STATUSES.slice() },
        { key: 'side', label: 'Side', options: ['Bride', 'Groom'] }
      ],
      onApply: function (values) {
        rows.forEach(r => {
          Object.keys(values || {}).forEach(k => { r[k] = values[k]; });
        });
        if (typeof save === 'function') save();
        renderParty();
        if (typeof RdFurniture.showUndoToast === 'function') {
          RdFurniture.showUndoToast({
            title: 'Updated ' + rows.length + ' members',
            detail: 'Attire and side changes applied to the selection.'
          });
        }
      }
    });
  }
  window.rdPartyOpenBulkEdit = rdPartyOpenBulkEdit;

  function partyBulkClear() {
    if (window.CWP && CWP.state && CWP.state.party && CWP.state.party.sel) CWP.state.party.sel.clear();
    renderPartyBulkBar();
  }
  async function partyBulkSetAttire() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('party') : [];
    if (!ids.length) return;
    const pick = typeof rdChoose === 'function' ? await rdChoose('Set attire status', PARTY_ATTIRE_STATUSES) : null;
    if (!pick) return;
    partyRows().forEach(r => { if (ids.includes(String(r._id))) { r.attireStatus = pick; r.status = pick; } });
    save(); renderParty();
  }
  async function partyBulkAssignDuty() {
    if (typeof showToast === 'function') showToast('Assign duty — edit in the member drawer or full editor');
  }
  function partyBulkEmail() {
    if (typeof emailWeddingParty === 'function') emailWeddingParty();
  }

  function rdPartyCellHtml(r, key) {
    if (key === 'name') {
      return '<td class="rd-party-td--name"><strong>' + escapeHtml(r.name || 'Member') + '</strong></td>';
    }
    if (key === 'role') return '<td>' + escapeHtml(r.role || '—') + '</td>';
    if (key === 'side') return '<td class="rd-guest-td--muted">' + escapeHtml(partyMemberSide(r)) + '</td>';
    if (key === 'attireStatus') return '<td>' + partyAttirePillHtml(partyAttireStatus(r)) + '</td>';
    if (key === 'duties') return '<td>' + escapeHtml(partyDutiesLabel(r)) + '</td>';
    if (key === 'fitting') {
      const f = partyFittingLabel(r);
      const empty = f === '—';
      return '<td class="' + (empty ? 'rd-guest-td--muted is-quiet' : '') + '">' + escapeHtml(f) + '</td>';
    }
    return '<td></td>';
  }

  function partyCompactRowRender(r) {
    return partyVisibleColumns().map(c => rdPartyCellHtml(r, c.key)).join('');
  }

  const PARTY_SORTS = [
    { value: 'side', label: 'Sort by side' },
    { value: 'name', label: 'Sort by member' },
    { value: 'role', label: 'Sort by role' },
    { value: 'attire', label: 'Sort by attire' },
    { value: 'fitting', label: 'Sort by fitting date' }
  ];
  function partySortLabel() {
    const cur = window._partySort || 'side';
    const hit = PARTY_SORTS.filter(o => o.value === cur)[0];
    return hit ? hit.label : 'Sort by side';
  }
  function partySortRows(a, b) {
    const mode = window._partySort || 'side';
    if (mode === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    if (mode === 'role') return String(a.role || '').localeCompare(String(b.role || ''));
    if (mode === 'attire') return String(partyAttireStatus(a)).localeCompare(String(partyAttireStatus(b)));
    if (mode === 'fitting') {
      /* members with no fitting booked sort last, not first */
      const fa = partyFittingLabel(a), fb = partyFittingLabel(b);
      if (fa === '—' && fb !== '—') return 1;
      if (fb === '—' && fa !== '—') return -1;
      return String(fa).localeCompare(String(fb));
    }
    const sa = partyMemberSide(a) === 'Groom' ? 1 : 0;
    const sb = partyMemberSide(b) === 'Groom' ? 1 : 0;
    if (sa !== sb) return sa - sb;
    return String(a.name || '').localeCompare(String(b.name || ''));
  }
  function openPartySort(btn) {
    if (typeof rdOpenPicker !== 'function') return;
    rdOpenPicker(btn, PARTY_SORTS, window._partySort || 'side', val => {
      window._partySort = val || 'side';
      renderPartyPreviewTable();
      renderPartyToolbar();
    });
  }
  function rdPartyOpenColumns(btn) {
    if (window.rdColumns) window.rdColumns.openChooser(btn, PARTY_COL_SCOPE);
  }

  function rdEnsurePartyTableLayout(forRedesign) {
    const d = (typeof CWP !== 'undefined' && CWP.TABLES) ? CWP.TABLES.party : null;
    if (!d) return;
    if (!d._rdBackup) {
      d._rdBackup = {
        columns: d.columns, rowRender: d.rowRender, sortRows: d.sortRows,
        afterRender: d.afterRender, afterChange: d.afterChange, pageSize: d.pageSize,
        extraFilter: d.extraFilter, rowGroup: d.rowGroup, groupHeader: d.groupHeader,
        hideToolbar: d.hideToolbar
      };
    }
    if (!forRedesign) {
      if (d._rdActive) { Object.assign(d, d._rdBackup); d._rdActive = false; }
      return;
    }
    d.columns = partyVisibleColumns().map(c => ({ key: c.key, label: c.label, width: c.width, type: c.type || undefined }));
    d.extraFilter = r => partyMatchesFilters(r);
    d.sortRows = (a, b) => partySortRows(a, b);
    d.rowGroup = r => partyRowGroupMeta(r);
    d.groupHeader = (meta, groupRows) => partyGroupHeaderLabel(meta, groupRows);
    d.hideToolbar = true;
    d.pageSize = 0;
    d.rowRender = partyCompactRowRender;
    d._rdActive = true;
    d.afterChange = () => {
      renderPartyStats();
      renderPartyToolbar();
      renderPartyBulkBar();
      if (typeof renderPageUxChrome === 'function') renderPageUxChrome('party');
      if (typeof renderContextSidebar === 'function' && document.body.getAttribute('data-active-panel') === 'party') {
        renderContextSidebar('party');
      }
    };
    d.afterRender = () => {
      bindPartyPreviewInline();
      appendPartyTableAddRow();
      rdApplyPartyDrawerRowFocus();
      rdApplyPartyRowHeight();
      renderPartyTableFoot();
    };
  }

  function renderPartyPreviewTable() {
    if (typeof cwpRenderTable !== 'function' || !document.getElementById('cwp-party') || rdGetPartyView() !== 'table') return;
    const wrap = document.getElementById('cwp-party');
    const total = partyRows().length;
    const shown = partyRows().filter(partyMatchesFilters).length;
    const filterOn = !!(window._partyUiFilters && (
      window._partyUiFilters.side !== 'all' ||
      window._partyUiFilters.attire !== 'all' ||
      window._partyUiFilters.role !== 'all'
    ));
    if (typeof RdStates !== 'undefined' && RdStates.applyOverlay && wrap &&
        RdStates.applyOverlay(wrap, {
          pageId: 'party',
          total: total,
          filtered: shown,
          filterOn: filterOn,
          onClear: function () {
            window._partyUiFilters = { side: 'all', attire: 'all', role: 'all' };
            if (typeof renderPartyRd === 'function') renderPartyRd();
            else renderPartyPreviewTable();
          }
        })) {
      renderPartyTableFoot();
      return;
    }
    rdEnsurePartyTableLayout(true);
    cwpRenderTable('party');
    bindPartyPreviewInline();
    rdApplyPartyDrawerRowFocus();
    rdApplyPartyRowHeight();
    renderPartyTableFoot();
    if (wrap && wrap.dataset.rdBulkBound !== '1') {
      wrap.dataset.rdBulkBound = '1';
      wrap.addEventListener('change', ev => {
        if (ev.target && ev.target.type === 'checkbox') setTimeout(renderPartyBulkBar, 0);
      });
    }
  }

  function renderPartyTableFoot() {
    const foot = document.getElementById('cwp-party-foot');
    if (!foot) return;
    const total = partyRows().length;
    const shown = partyRows().filter(partyMatchesFilters).length;
    foot.textContent = shown === total
      ? (total + ' member' + (total === 1 ? '' : 's'))
      : ('Showing ' + shown + ' of ' + total);
  }

  function appendPartyTableAddRow() {
    if (rdGetPartyView() !== 'table') return;
    const wrap = document.getElementById('cwp-party');
    if (!wrap) return;
    const tb = wrap.querySelector('#cwp-tbody-party') || wrap.querySelector('tbody');
    if (!tb || tb.querySelector('tr.cwp-empty')) return;
    tb.querySelectorAll('[data-party-add-row]').forEach(r => r.remove());
    const span = wrap.querySelectorAll('thead th').length;
    if (!span) return;
    const tr = document.createElement('tr');
    tr.className = 'rd-party-add-row';
    tr.setAttribute('data-party-add-row', '1');
    tr.innerHTML = '<td style="text-align:center;color:#cfc6b4">+</td><td colspan="' + (span - 1) + '" style="color:#b09f80;cursor:pointer">Add a member — starts from a guest record</td>';
    tr.addEventListener('click', () => addPartyRow());
    tb.appendChild(tr);
  }

  function bindPartyPreviewInline() {
    if (typeof bindRoPreviewInline === 'function') {
      bindRoPreviewInline('party', 'cwp-party', 'record-drawer-body');
    }
  }

  function rdPartyRowHeightKey() {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':party';
  }
  function rdPartyRowHeightLabel() {
    try { return localStorage.getItem(rdPartyRowHeightKey()) || 'compact'; } catch (e) { return 'compact'; }
  }
  function rdCyclePartyRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const cur = rdPartyRowHeightLabel();
    const idx = order.indexOf(cur);
    const next = order[(idx < 0 ? 0 : idx + 1) % order.length];
    try { localStorage.setItem(rdPartyRowHeightKey(), next); } catch (e) {}
    rdApplyPartyRowHeight();
    renderPartyToolbar();
  }
  function rdApplyPartyRowHeight() {
    const wrap = document.getElementById('cwp-party');
    if (!wrap) return;
    const h = rdPartyRowHeightLabel();
    wrap.setAttribute('data-rd-row-height', h);
    const table = wrap.querySelector('table');
    [wrap, table].forEach(el => {
      if (!el) return;
      el.classList.remove('rd-table--compact', 'rd-table--tall', 'rd-table--default');
      if (h === 'compact') el.classList.add('rd-table--compact');
      else if (h === 'tall') el.classList.add('rd-table--tall');
      else el.classList.add('rd-table--default');
    });
  }
  /* Scoped to the party table under this toolbar. autoFitColumns() resolves
     #cwp-tasks first, so the old path could size the Tasks table from here. */
  function rdPartyAutoFitColumns(btn) {
    const wrap = document.getElementById('cwp-party');
    const table = wrap && wrap.querySelector('table');
    if (table && typeof window.rdAutoFitTable === 'function') window.rdAutoFitTable(table);
  }

  function rdApplyPartyDrawerRowFocus() {
    const st = recordEditorState;
    if (!st || st.key !== 'party' || st.inlineMount !== 'record-drawer-body') return;
    const id = st.draft && st.draft._id;
    if (!id) return;
    document.querySelectorAll('#cwp-party tbody tr[data-id="' + id + '"]').forEach(tr => tr.classList.add('is-drawer-focus'));
  }

  function renderPartySpeakingSection() {
    const host = document.getElementById('party-speaking-section');
    if (!host) return;
    const speakers = partyRows()
      .filter(partyHasSpeakingDuty)
      .sort((a, b) => (parseInt(a.speechOrder, 10) || 99) - (parseInt(b.speechOrder, 10) || 99));
    if (!speakers.length) {
      speakers.push(
        { name: 'Yaw Darko', role: 'Best man', speechMinutes: 6, speechTitle: 'Toast to the couple', speechOrder: 1 },
        { name: 'Efua Mensah', role: 'Maid of honour', speechMinutes: 5, speechTitle: 'Reading + toast', speechOrder: 2 },
        { name: 'Mr Owusu', role: 'Father of the bride', speechMinutes: 3, speechTitle: 'Welcome and blessing', speechOrder: 3 }
      );
    }
    const totalMin = speakers.reduce((s, r) => s + (parseInt(r.speechMinutes, 10) || 0), 0);
    const cards = speakers.map((r, i) => {
      const num = String(r.speechOrder || (i + 1)).padStart(2, '0');
      const min = parseInt(r.speechMinutes, 10) || '—';
      return `<div class="rd-party-speaking__card">
        <div class="rd-party-speaking__top">
          <span class="rd-party-speaking__num">${num}</span>
          <span class="rd-party-speaking__name">${escapeHtml(r.name || '')}</span>
          <span class="rd-party-speaking__min">${min} min</span>
        </div>
        <div class="rd-party-speaking__role">${escapeHtml(r.role || '')}</div>
        <div class="rd-party-speaking__desc">${escapeHtml(r.speechTitle || partyDutiesLabel(r))}</div>
      </div>`;
    }).join('');
    host.innerHTML = `<div class="rd-party-speaking__head">
        <div class="rd-party-speaking__eyebrow">Speaking order · reception</div>
        <p class="rd-help">Three speeches, ${totalMin} minutes total, sits inside the 18-minute block on the Wedding Day Timeline</p>
        <button type="button" class="rd-btn rd-btn--quiet" onclick="showPanel('timeline')">Open timeline</button>
      </div>
      <div class="rd-party-speaking__grid">${cards}</div>`;
  }

  function renderPartyCardsView() {
    const host = document.getElementById('party-cards-view');
    if (!host) return;
    host.className = 'rd-cardgrid rd-party-cards';
    const rows = partyRows().filter(partyMatchesFilters).slice().sort(partySortRows);
    if (!rows.length) {
      host.innerHTML = '<p class="rd-help" style="grid-column:1/-1">No members match this view.</p>';
      return;
    }
    host.innerHTML = rows.map(r => {
      const sideTitle = partySideGroupTitle(partyMemberSide(r));
      const attirePill = partyCardAttirePill(r);
      const speaking = partyHasSpeakingDuty(r);
      const dutyN = partyDutyCount(r);
      const outstanding = !partyAttireReady(r);
      const pct = partyReadinessPct(r);
      const id = escapeHtml(r._id || '');
      const pills =
        `<span class="rd-party-card__pill rd-party-card__pill--${attirePill.tone}">${escapeHtml(attirePill.label)}</span>` +
        (speaking ? `<span class="rd-party-card__pill rd-party-card__pill--speech">Speech</span>` : '');
      const bar = outstanding
        ? `<div class="rd-party-card__ready" aria-hidden="true"><span style="width:${pct}%"></span></div>`
        : '';
      return `<article class="rd-party-card" data-id="${id}" onclick="partyOpenDrawerById('${id}')">
        <div class="rd-party-card__identity">
          <span class="rd-party-card__avatar">${escapeHtml(partyInitials(r.name))}</span>
          <div class="rd-party-card__who">
            <div class="rd-party-card__name">${escapeHtml(r.name || 'Member')}</div>
            <div class="rd-party-card__role">${escapeHtml(r.role || '')} · ${escapeHtml(sideTitle)}</div>
          </div>
        </div>
        <div class="rd-party-card__pills">${pills}</div>
        <div class="rd-party-card__rows">
          <div class="rd-party-card__row"><span>${escapeHtml(partyAttireKind(r))}</span><span>${escapeHtml(partyAttireDetail(r))}</span></div>
          <div class="rd-party-card__row"><span>Duties</span><span>${dutyN} assigned</span></div>
          <div class="rd-party-card__row"><span>Day-of call</span><span>${escapeHtml(partyCallTime(r))}</span></div>
        </div>
        ${bar}
      </article>`;
    }).join('');
  }

  function partyDutyMatchesFilters(duty) {
    const ui = window._partyUiFilters || {};
    if (ui.hideDone && partyDutyIsDone(duty)) return false;
    if (ui.phase && ui.phase !== 'all') {
      if (ui.phase === 'Unassigned') {
        if (partyDutyHasOwner(duty)) return false;
      } else if (partyDutyPhase(duty) !== ui.phase) return false;
    }
    if (ui.owner && ui.owner !== 'all') {
      if (ui.owner === 'unassigned' || ui.owner === 'Nobody') {
        if (partyDutyHasOwner(duty)) return false;
      } else if (partyDutyOwnerName(duty) !== ui.owner) return false;
    }
    return true;
  }

  function renderPartyDutiesView() {
    const host = document.getElementById('party-duties-view');
    if (!host) return;
    host.className = 'rd-kanban rd-party-duties';
    const duties = partyDutyRows().filter(partyDutyMatchesFilters);
    const cols = {};
    PARTY_DUTY_COLUMNS.forEach(k => { cols[k] = []; });
    duties.forEach(d => {
      const key = partyDutyColumn(d);
      if (!cols[key]) cols[key] = [];
      cols[key].push(d);
    });
    host.innerHTML = PARTY_DUTY_COLUMNS.map(key => {
      const cards = cols[key] || [];
      const danger = key === 'Unassigned' ? ' is-danger' : '';
      return `<div class="rd-kanban__col rd-party-duty-col${danger}" data-party-phase="${escapeHtml(key)}"
        ondragover="event.preventDefault()" ondrop="partyDutyDrop(event,'${escapeHtml(key)}')">
        <div class="rd-kanban__col-head"><span>${escapeHtml(key)}</span><span class="rd-rail__count">${cards.length}</span></div>
        ${cards.map(d => {
          const id = escapeHtml(d._id || '');
          const owner = partyDutyHasOwner(d) ? partyDutyOwnerName(d) : 'Nobody';
          const status = partyDutyStatusLabel(d);
          const statusCls = partyDutyIsDone(d) ? ' is-done' : (d.critical || /critical/i.test(status) ? ' is-critical' : (partyDutyIsBlocked(d) ? ' is-blocked' : ''));
          const note = d.note ? `<div class="rd-party-duty-card__note">${escapeHtml(d.note)}</div>` : (d.critical && !/critical/i.test(status) ? '<div class="rd-party-duty-card__note">Critical</div>' : '');
          const member = partyRows().find(r => String(r._id) === String(d.ownerId) || String(r.name || '').toLowerCase() === String(d.ownerName || '').toLowerCase());
          const open = member ? `partyOpenDrawerById('${escapeHtml(member._id)}')` : `addPartyDuty('${id}')`;
          return `<div class="rd-kanban__card rd-party-duty-card" draggable="true" data-duty-id="${id}"
            ondragstart="partyDutyDragStart(event,'${id}')" onclick="${open}">
            <div class="rd-party-duty-card__title">${escapeHtml(d.title || 'Duty')}</div>
            <div class="rd-party-duty-card__owner">${escapeHtml(owner)}</div>
            ${status ? `<span class="rd-party-duty-card__when${statusCls}">${escapeHtml(status)}</span>` : ''}
            ${note}
          </div>`;
        }).join('')}
        <button type="button" class="rd-party-duty-add" onclick="addPartyDuty(null,'${escapeHtml(key)}')">+ Add</button>
      </div>`;
    }).join('');
  }

  function partyDutyDragStart(ev, id) {
    if (ev && ev.dataTransfer) {
      ev.dataTransfer.setData('text/party-duty-id', id);
      ev.dataTransfer.effectAllowed = 'move';
    }
  }

  function partyDutyDrop(ev, column) {
    if (ev) ev.preventDefault();
    const id = ev && ev.dataTransfer ? ev.dataTransfer.getData('text/party-duty-id') : '';
    if (!id) return;
    const duty = partyDutyRows().find(d => String(d._id) === String(id));
    if (!duty) return;
    if (column === 'Unassigned') {
      duty.ownerName = '';
      duty.ownerId = '';
    } else if (PARTY_DUTY_PHASES.indexOf(column) >= 0) {
      duty.phase = column;
    }
    if (typeof save === 'function') save();
    renderParty();
  }

  async function addPartyDuty(existingId, phaseHint) {
    if (existingId) {
      const duty = partyDutyRows().find(d => String(d._id) === String(existingId));
      if (duty && typeof showToast === 'function') showToast(duty.title + ' — assign an owner in Full editor');
      return;
    }
    const title = typeof rdPrompt === 'function'
      ? await rdPrompt('New duty', 'Duty title')
      : window.prompt('Duty title');
    if (!title) return;
    const phase = phaseHint && PARTY_DUTY_PHASES.indexOf(phaseHint) >= 0 ? phaseHint : 'Before the day';
    const unassigned = phaseHint === 'Unassigned';
    const row = {
      title: String(title).trim(),
      phase: unassigned ? 'Before the day' : phase,
      ownerName: '',
      ownerId: '',
      when: '',
      status: '',
      note: '',
      critical: false
    };
    ensureRowId(row, 'partyDuty');
    partyDutyRows().push(row);
    if (typeof save === 'function') save();
    renderParty();
  }

  function openPartyDutyFilter(field, btn) {
    const opts = field === 'phase'
      ? [{ value: 'all', label: 'All phases' }].concat(PARTY_DUTY_COLUMNS.map(p => ({ value: p, label: p })))
      : [{ value: 'all', label: 'All owners' }, { value: 'unassigned', label: 'Nobody' }]
          .concat([...new Set(partyDutyRows().map(partyDutyOwnerName).filter(Boolean))].sort().map(n => ({ value: n, label: n })));
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._partyUiFilters[field] || 'all', val => {
        window._partyUiFilters[field] = val || 'all';
        renderParty();
      });
    }
  }
  function clearPartyDutyFilter(field) {
    window._partyUiFilters[field] = 'all';
    renderParty();
  }
  function togglePartyHideDone() {
    window._partyUiFilters.hideDone = !window._partyUiFilters.hideDone;
    renderParty();
  }

  function partyOpenDrawerById(id) {
    const idx = partyRows().findIndex(r => String(r._id) === String(id));
    if (idx < 0) return;
    if (typeof covInlineLoad === 'function') covInlineLoad('party', idx, 'record-drawer-body', null, { scroll: false });
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
      window.covenantShell.openDrawer('party', idx);
    }
  }

  /* ── Drawer tabs (Batch 23 · 10a) ─────────────────────────────────── */
  function partyDrawerShellTabs() { return PARTY_DRAWER_TABS.slice(); }
  function partyDrawerTabIndex() {
    const d = document.getElementById('record-drawer');
    const max = PARTY_DRAWER_TABS.length - 1;
    let n = parseInt(d && d.dataset ? d.dataset.drawerTab : '0', 10);
    if (!isFinite(n) || n < 0) n = 0;
    if (n > max) n = 0;
    return n;
  }
  function partyDrawerSelectTab(i) {
    const d = document.getElementById('record-drawer');
    if (d && d.dataset) d.dataset.drawerTab = String(i);
    if (typeof renderRecordEditor === 'function') renderRecordEditor();
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function partyDrawerFieldRow(label, html) {
    return `<div class="rd-field-row"><span class="rd-field-row__label">${escapeHtml(label)}</span>${html}</div>`;
  }
  function partyDrawerReadonly(val, link) {
    const cls = link ? ' rd-field-row__value--link' : '';
    return `<span class="rd-field-row__value${cls}">${escapeHtml(val || '—')}</span>`;
  }

  function partyDrawerRoleTab(d) {
    const g = partyLinkedGuest(d);
    const guestName = g ? g.name : (d.name || '');
    const table = g && g.table ? (typeof guestTableLabelShort === 'function' ? guestTableLabelShort(g.table) : g.table) : (d.table || '—');
    const seat = g && (g.seat || g.seatNo) ? (' · seat ' + (g.seat || g.seatNo)) : '';
    return partyDrawerFieldRow('Role', partyDrawerReadonly(d.role))
      + partyDrawerFieldRow('Side', partyDrawerReadonly(partyMemberSide(d)))
      + partyDrawerFieldRow('Relationship', partyDrawerReadonly(d.relationship))
      + partyDrawerFieldRow('Guest record', partyDrawerReadonly(guestName + ' →', true))
      + partyDrawerFieldRow('Table', partyDrawerReadonly(table + seat, !!g))
      + '<p class="rd-drawer-callout">A party member is a <strong>guest first</strong>. Name, side and table live on the guest record; this page adds only the four fields the guest table does not carry.</p>';
  }

  function partyDrawerAttireTab(d) {
    const rows = partyRows();
    const fitted = rows.filter(partyAttireReady).length;
    const deposit = rows.filter(r => partyAttireStatus(r) === 'Deposit only').length;
    const notMeas = rows.filter(r => partyAttireStatus(r) === 'Not measured').length;
    const cost = d.cost ? ('$' + d.cost + ' · paid by member') : '—';
    return partyDrawerFieldRow('Status', partyDrawerReadonly(partyAttireStatus(d)))
      + partyDrawerFieldRow('Fitting', partyDrawerReadonly(d.fittingDetail || d.fitting))
      + partyDrawerFieldRow('Cost', partyDrawerReadonly(cost))
      + partyDrawerFieldRow('Size note', partyDrawerReadonly(d.sizeNote || d.size))
      + '<div class="rd-drawer-section-title">Group deadline</div>'
      + `<div class="rd-drawer-kv"><span>All fittings by</span><span>12 September</span></div>`
      + `<div class="rd-drawer-kv"><span>Fitted &amp; paid</span><span>${fitted} of ${rows.length || 10}</span></div>`
      + `<div class="rd-drawer-kv"><span>Deposit only</span><span>${deposit}</span></div>`
      + `<div class="rd-drawer-kv"><span>Not measured</span><span>${notMeas}</span></div>`
      + '<p class="rd-drawer-callout">Cost is paid by the member, so it never reaches the Budget. Two members are unmeasured and the deadline is five weeks out.</p>';
  }

  function partyDrawerDutiesTab(d) {
    const structured = partyDutiesForMember(d);
    const dutyRows = structured.length
      ? structured.map(duty => {
          const left = duty.title || '';
          const ev = duty.when
            ? (partyDutyPhase(duty) + (duty.when ? ' ' + duty.when : ''))
            : partyDutyPhase(duty);
          return `<div class="rd-drawer-kv"><span>${escapeHtml(left)}</span><span class="rd-link-quiet">${escapeHtml(ev)}</span></div>`;
        }).join('')
      : `<div class="rd-drawer-kv"><span>${escapeHtml(partyDutiesLabel(d))}</span><span>Ceremony</span></div>`;
    const duties = structured;
    const speakers = partyRows().filter(partyHasSpeakingDuty).sort((a, b) => (a.speechOrder || 99) - (b.speechOrder || 99));
    const speakRows = speakers.map((s, i) =>
      `<div class="rd-drawer-kv"><span>${i + 1} · ${escapeHtml(s.name || '')}</span><span>${parseInt(s.speechMinutes, 10) || '—'} min</span></div>`
    ).join('');
    const dutyCount = duties.length || (partyDutiesLabel(d) !== '—' ? 1 : 0);
    return '<div class="rd-drawer-section-title">Duties · ' + dutyCount + '</div>' + dutyRows
      + '<p class="rd-drawer-callout">Each duty with a time appears on the Wedding Day Timeline and in the Ceremony order of service. Removing one here removes it from both.</p>'
      + '<div class="rd-drawer-section-title">Speaking order</div>' + speakRows
      + '<button type="button" class="rd-link-quiet" onclick="addPartyDuty()">+ Add a duty</button>';
  }

  function partyDrawerContactTab(d) {
    const g = partyLinkedGuest(d);
    const phone = d.phone || (g && g.phone) || '';
    const email = d.email || (g && g.email) || '';
    const roomWarn = d.room ? ' is-warn' : '';
    return partyDrawerFieldRow('Phone', partyDrawerReadonly(phone))
      + partyDrawerFieldRow('Email', partyDrawerReadonly(email))
      + partyDrawerFieldRow('Arrives', partyDrawerReadonly(d.arrives))
      + partyDrawerFieldRow('Room', `<span class="rd-field-row__value${roomWarn}">${escapeHtml(d.room || '—')}</span>`)
      + (d.room ? '<p class="rd-drawer-callout is-warn">She needs a room in the block and a seat at the rehearsal dinner. Neither is booked — both sit on Weekend Logistics as unowned rows.</p>' : '')
      + '<div class="rd-drawer-section-title">On the group email</div>'
      + '<div class="rd-drawer-kv"><span>Wedding party brief</span><span class="rd-link-quiet">7 opens</span></div>'
      + '<div class="rd-drawer-kv"><span>Fitting reminder</span><span>Sent 12 Jul</span></div>';
  }

  function partyDrawerHistoryTab(d) {
    const hist = typeof recordHistoryFor === 'function' ? recordHistoryFor('party', d._id) : [];
    const rows = hist.length
      ? hist.slice(0, 6).map(e => `<div class="rd-drawer-kv"><span>${escapeHtml((e.date || '') + ' · Ama')}</span><span>${escapeHtml(e.action || 'Edited')}</span></div>`).join('')
      : `<div class="rd-drawer-kv"><span>12 Aug · Ama</span><span>Fitting completed</span></div>
         <div class="rd-drawer-kv"><span>20 Jul · Ama</span><span>Note · ground-floor room</span></div>
         <div class="rd-drawer-kv"><span>3 Jun · Ama</span><span>Added as ${escapeHtml(String(d.role || 'member').toLowerCase())}</span></div>`;
    return '<div class="rd-drawer-section-title">This member</div>' + rows
      + '<p class="rd-drawer-callout">Changes to name, side or table are logged on the <strong>guest</strong> record, not here — this history covers only the four party fields.</p>';
  }

  function renderPartyDrawerEditor() {
    const d = recordEditorState.draft;
    const tabs = partyDrawerShellTabs();
    const tab = tabs[partyDrawerTabIndex()] || 'Role';
    const key = tab.toLowerCase();
    let body = '';
    if (key === 'role') body = partyDrawerRoleTab(d);
    else if (key === 'attire') body = partyDrawerAttireTab(d);
    else if (key === 'duties') body = partyDrawerDutiesTab(d);
    else if (key === 'contact') body = partyDrawerContactTab(d);
    else if (key === 'history') body = partyDrawerHistoryTab(d);
    return `<section class="record-editor-section rd-drawer-fields rd-party-drawer-pane" data-drawer-group="${escapeHtml(key)}" data-party-drawer-pane="1">${body}</section>`;
  }

  function renderPartyRecordEditorFull() {
    const d = recordEditorState.draft;
    return `<section class="record-editor-section"><h4>Role</h4><div class="record-editor-grid">
      ${recordInput('Member name','name','text',true)}
      ${recordDatalist('Role','role',(PARTY_ROLE_OPTIONS || []).concat(recordExistingFieldValues('party','role')))}
      ${recordSelect('Side','side',['Bride','Groom'])}
      ${recordInput('Relationship','relationship')}
      ${recordTextarea('Notes','notes')}
    </div></section>
    <section class="record-editor-section"><h4>Attire</h4><div class="record-editor-grid">
      ${recordSelect('Attire status','attireStatus',PARTY_ATTIRE_STATUSES)}
      ${recordInput('Fitting date','fitting')}
      ${recordInput('Fitting detail','fittingDetail')}
      ${recordInput('Cost','cost','number')}
      ${recordInput('Size note','sizeNote')}
    </div></section>
    <section class="record-editor-section"><h4>Contact</h4><div class="record-editor-grid">
      ${recordInput('Phone','phone','tel')}
      ${recordInput('Email','email','email')}
      ${recordInput('Arrives','arrives')}
      ${recordInput('Room','room')}
    </div></section>`;
  }

  function renderPartyRecordEditorRd() {
    if (recordEditorState?.inlineMount === 'record-drawer-body') return renderPartyDrawerEditor();
    return renderPartyRecordEditorFull();
  }

  function rdPartyFullEditor() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('party') : [];
    const rows = partyRows();
    let idx = ids.length ? rows.findIndex(r => String(r._id) === String(ids[0])) : -1;
    if (idx < 0 && recordEditorState && recordEditorState.key === 'party' && recordEditorState.index != null) idx = recordEditorState.index;
    if (idx < 0) idx = 0;
    if (!rows.length) { openRecordEditor('party'); return; }
    openRecordEditor('party', idx);
  }

  function addPartyRowRd() {
    if (document.body.getAttribute('data-active-panel') === 'party' && document.getElementById('record-drawer-body')) {
      covInlineLoad('party', null, 'record-drawer-body', null, { scroll: false });
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    openRecordEditor('party');
  }

  function applyPartyRailView(viewId) {
    window._partyRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('party', window._partyRailView);
    renderParty();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('party');
  }
  function applyPartyRailGroupBy(groupId) {
    window._partyRailGroupBy = groupId || 'side';
    if (typeof setSavedView === 'function') setSavedView('partyGroupBy', window._partyRailGroupBy);
    renderParty();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('party');
  }

  function renderPartyRd() {
    ensurePartyDemoSeed();
    uedPartyShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('party');
    rdApplyPartyViewMode();
    renderPartyStats();
    renderPartyToolbar();
    renderPartyBulkBar();
    const view = rdGetPartyView();
    if (view === 'table') {
      renderPartyPreviewTable();
      renderPartySpeakingSection();
    } else if (view === 'cards') {
      renderPartyCardsView();
    } else if (view === 'duties') {
      renderPartyDutiesView();
    }
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'party'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('party');
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
    rdApplyPartyDrawerRowFocus();
  }

  /* ── Public API (override planner.js legacy party page) ───────────── */
  window.__partyRenderRd = renderPartyRd;
  window.__uedPartyShellRd = uedPartyShell;
  window.uedPartyShell = uedPartyShell;
  window.renderParty = renderPartyRd;
  window.renderPartyStats = renderPartyStats;
  window.renderPartyRecordEditor = renderPartyRecordEditorRd;
  window.__partyRenderRecordEditorRd = renderPartyRecordEditorRd;
  window.addPartyRow = addPartyRowRd;
  window.rdPartyFullEditor = rdPartyFullEditor;
  window.rdSetPartyView = rdSetPartyView;
  window.rdGetPartyView = rdGetPartyView;
  window.applyPartyRailView = applyPartyRailView;
  window.applyPartyRailGroupBy = applyPartyRailGroupBy;
  window.partyDrawerShellTabs = partyDrawerShellTabs;
  window.partyDrawerSelectTab = partyDrawerSelectTab;
  window.partyGroupHeaderLabel = partyGroupHeaderLabel;
  window.partyRowGroupMeta = partyRowGroupMeta;
  window.partyMatchesFilters = partyMatchesFilters;
  window.partyOpenDrawerById = partyOpenDrawerById;
  window.addPartyDuty = addPartyDuty;
  window.partyDutyDragStart = partyDutyDragStart;
  window.partyDutyDrop = partyDutyDrop;
  window.openPartyDutyFilter = openPartyDutyFilter;
  window.clearPartyDutyFilter = clearPartyDutyFilter;
  window.togglePartyHideDone = togglePartyHideDone;
  window.openPartyFilter = openPartyFilter;
  window.clearPartyFilter = clearPartyFilter;
  window.partyBulkClear = partyBulkClear;
  window.partyBulkSetAttire = partyBulkSetAttire;
  window.partyBulkAssignDuty = partyBulkAssignDuty;
  window.partyBulkEmail = partyBulkEmail;
  window.rdCyclePartyRowHeight = rdCyclePartyRowHeight;
  window.rdPartyAutoFitColumns = rdPartyAutoFitColumns;
  window.rdPartyOpenColumns = rdPartyOpenColumns;
  window.openPartySort = openPartySort;
  window.rdApplyPartyDrawerRowFocus = rdApplyPartyDrawerRowFocus;

  function hookPartyPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.party = function () { renderPartyRd(); };
    }
  }
  hookPartyPanelRenderer();
  var _showPanelParty = window.showPanel;
  if (typeof _showPanelParty === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelParty.call(window, id, forceOpen);
      hookPartyPanelRenderer();
      return out;
    };
  }

  function emailWeddingParty() {
    if (typeof showPanel === 'function') showPanel('emails');
    if (typeof showToast === 'function') showToast('Open Wedding Party template in Emails');
  }
  window.emailWeddingParty = emailWeddingParty;
})();
