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

  window._partyUiFilters = window._partyUiFilters || { side: 'all', attire: 'all', role: 'all' };
  window._partySort = window._partySort || 'side';
  window._partyRailView = window._partyRailView || 'all';
  window._partyRailGroupBy = window._partyRailGroupBy || 'side';

  function partyRows() { return safeArray(data.party); }

  function ensurePartyDemoSeed() {
    if (partyRows().length) return;
    const seed = [
      { name: 'Efua Mensah', role: 'Maid of honour', side: 'Bride', attireStatus: 'Fitted & paid', duties: ['Speech · 5 min', 'Processional', 'Hold the bouquet'], dutyLabels: 'Speech · toast', fitting: '12 Aug', fittingDetail: '12 Aug · Adjeley Bridal', relationship: 'Cousin', cost: 340, sizeNote: 'Hem shortened 1in', arrives: 'Friday evening', room: 'Grace Hall block', notes: 'Arriving Friday evening — needs a seat at the rehearsal dinner and a room in the Grace Hall block.', speechOrder: 2, speechMinutes: 5, speechTitle: 'Reading + toast' },
      { name: 'Akosua Owusu', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Fitted & paid', dutyLabels: 'Processional', fitting: '12 Aug', duties: ['Processional'] },
      { name: 'Nana Ama Boateng', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Deposit only', dutyLabels: 'Processional', fitting: '19 Aug', duties: ['Processional'] },
      { name: 'Adjoa Sarpong', role: 'Bridesmaid', side: 'Bride', attireStatus: 'Not measured', dutyLabels: 'Guest book', duties: ['Guest book'] },
      { name: 'Serwaa Mensah', role: 'Flower girl', side: 'Bride', attireStatus: 'Fitted & paid', dutyLabels: 'Processional', fitting: '5 Aug', duties: ['Processional'] },
      { name: 'Yaw Darko', role: 'Best man', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Speech · rings', fitting: '9 Aug', duties: ['Speech · 6 min', 'Ushering', 'Ring bearer walk'], speechOrder: 1, speechMinutes: 6, speechTitle: 'Toast to the couple' },
      { name: 'Kofi Asante', role: 'Groomsman', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Ushering', fitting: '9 Aug', duties: ['Ushering'] },
      { name: 'Kwabena Osei', role: 'Groomsman', side: 'Groom', attireStatus: 'Fitted & paid', dutyLabels: 'Ushering', fitting: '9 Aug', duties: ['Ushering'] },
      { name: 'Michael Tetteh', role: 'Groomsman', side: 'Groom', attireStatus: 'Deposit only', dutyLabels: 'Transport', fitting: '26 Aug', duties: ['Transport'] },
      { name: 'Kojo Amoah', role: 'Ring bearer', side: 'Groom', attireStatus: 'Not measured', dutyLabels: 'Recessional', duties: ['Recessional'] }
    ];
    seed.forEach(row => {
      ensureRowId(row, 'party');
      if (!row.phone) row.phone = '';
      if (!row.email) row.email = '';
      data.party.push(row);
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
    return { total: rows.length, bride, groom, attireReady, speaking, shown: filtered.length };
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
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="emailWeddingParty()">Send group email</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdPartyFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Wedding Party',data.party)">Export</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="addPartyRow()">Add member</button>`;
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
          <div class="rd-party-cards" id="party-cards-view"></div>
        </div>
        <div class="rd-view" id="party-view-duties" data-party-view="duties" hidden>
          <div class="rd-party-duties" id="party-duties-view"></div>
        </div>
      </div>
      <div id="party-drawer-slot"></div>
    </div>`;
  }

  function uedPartyShell() {
    const panel = document.getElementById('panel-party');
    if (!panel) return;
    panel.classList.add('ued-scope', 'party-mockup');
    if (panel.dataset.uedShell === 'party-rd10a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = partyPageheadActionsHtml();
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    panel.dataset.uedShell = 'party-rd10a';
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
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Members', value: s.total, filter: 'Show all', onFilter: () => { window._partyUiFilters = { side: 'all', attire: 'all', role: 'all' }; renderParty(); } },
        { label: "Bride's side", value: s.bride, filter: "Filter · Bride's side", onFilter: () => { window._partyUiFilters.side = 'Bride'; renderParty(); } },
        { label: "Groom's side", value: s.groom, filter: "Filter · Groom's side", onFilter: () => { window._partyUiFilters.side = 'Groom'; renderParty(); } },
        { label: 'Attire ready', value: s.attireReady, filter: 'Filter · Fitted & paid', onFilter: () => { window._partyUiFilters.attire = 'Fitted & paid'; renderParty(); } },
        {
          label: 'Speaking',
          value: s.speaking,
          filter: 'Show speakers',
          attention: s.total && s.attireReady < s.total ? (s.total - s.attireReady) + ' still need fittings' : undefined
        }
      ]);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${label}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = [
      cell('Members', s.total),
      cell("Bride's side", s.bride),
      cell("Groom's side", s.groom),
      cell('Attire ready', s.attireReady),
      cell('Speaking', s.speaking)
    ].join('');
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

  function renderPartyToolbar() {
    const host = document.getElementById('party-toolbar');
    if (!host) return;
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetPartyView();
    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(PARTY_COL_SCOPE) : 'Columns';
    const colAllShown = window.rdColumns ? window.rdColumns.allShown(PARTY_COL_SCOPE) : true;
    host.innerHTML =
      partyFilterChip('Side', 'side') +
      partyFilterChip('Attire', 'attire') +
      partyFilterChip('Role', 'role') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="openPartySort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${escapeHtml(partySortLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip${colAllShown ? ' rd-chip--ghost' : ''}" onclick="rdPartyOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${escapeHtml(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip" onclick="rdPartyAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>` +
      `<button type="button" class="rd-chip" onclick="rdCyclePartyRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${escapeHtml(rdPartyRowHeightLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Party view">` +
      `<button type="button" class="rd-viewswitch__item${view === 'table' ? ' is-active' : ''}" onclick="rdSetPartyView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'cards' ? ' is-active' : ''}" onclick="rdSetPartyView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'duties' ? ' is-active' : ''}" onclick="rdSetPartyView('duties')">Duties</button>` +
      `</div></div>`;
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
      <button type="button" class="rd-bulkbar__action" onclick="partyBulkEmail()">Email selected</button>
      <button type="button" class="rd-bulkbar__action" onclick="printCurrentPage()">Print measurement sheet</button>
      <button type="button" class="rd-bulkbar__clear" onclick="partyBulkClear()">Clear selection</button>`;
  }

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
    rdEnsurePartyTableLayout(true);
    cwpRenderTable('party');
    bindPartyPreviewInline();
    rdApplyPartyDrawerRowFocus();
    rdApplyPartyRowHeight();
    renderPartyTableFoot();
    const wrap = document.getElementById('cwp-party');
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
    const rows = partyRows().filter(partyMatchesFilters);
    host.innerHTML = rows.length ? rows.map(r => {
      const side = partySideGroupTitle(partyMemberSide(r)).replace("'s side", '');
      return `<article class="rd-party-card" data-id="${escapeHtml(r._id || '')}" onclick="partyOpenDrawerById('${escapeHtml(r._id || '')}')">
        <div class="rd-party-card__head">
          <strong>${escapeHtml(r.name || '')}</strong>
          ${partyAttirePillHtml(partyAttireStatus(r))}
        </div>
        <div class="rd-party-card__meta">${escapeHtml(r.role || '')} · ${escapeHtml(side)}</div>
        <div class="rd-party-card__duties">${escapeHtml(partyDutiesLabel(r))}</div>
        <div class="rd-party-card__fit">Fitting ${escapeHtml(partyFittingLabel(r))}</div>
      </article>`;
    }).join('') : '<p class="rd-help">No members match this view.</p>';
  }

  function renderPartyDutiesView() {
    const host = document.getElementById('party-duties-view');
    if (!host) return;
    const rows = partyRows().filter(partyMatchesFilters);
    const blocks = rows.map(r => {
      const duties = Array.isArray(r.duties) ? r.duties : (r.dutyLabels ? [r.dutyLabels] : []);
      const list = duties.length
        ? duties.map(d => `<li>${escapeHtml(String(d))}</li>`).join('')
        : '<li class="rd-help">No duties yet</li>';
      return `<div class="rd-party-duty-block">
        <div class="rd-party-duty-block__head"><strong>${escapeHtml(r.name || '')}</strong><span>${escapeHtml(r.role || '')}</span></div>
        <ul class="rd-party-duty-block__list">${list}</ul>
      </div>`;
    }).join('');
    host.innerHTML = blocks || '<p class="rd-help">No members match this view.</p>';
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
    const duties = Array.isArray(d.duties) ? d.duties : [];
    const dutyRows = duties.length
      ? duties.map(duty => {
          const parts = String(duty).split('·');
          const left = parts[0].trim();
          const ev = parts[1] ? parts[1].trim() : (/speech/i.test(left) ? 'Reception' : 'Ceremony');
          return `<div class="rd-drawer-kv"><span>${escapeHtml(left)}</span><span class="rd-link-quiet">${escapeHtml(ev)}</span></div>`;
        }).join('')
      : `<div class="rd-drawer-kv"><span>${escapeHtml(partyDutiesLabel(d))}</span><span>Ceremony</span></div>`;
    const speakers = partyRows().filter(partyHasSpeakingDuty).sort((a, b) => (a.speechOrder || 99) - (b.speechOrder || 99));
    const speakRows = speakers.map((s, i) =>
      `<div class="rd-drawer-kv"><span>${i + 1} · ${escapeHtml(s.name || '')}</span><span>${parseInt(s.speechMinutes, 10) || '—'} min</span></div>`
    ).join('');
    return '<div class="rd-drawer-section-title">Duties · ' + (duties.length || 1) + '</div>' + dutyRows
      + '<p class="rd-drawer-callout">Each duty with a time appears on the Wedding Day Timeline and in the Ceremony order of service. Removing one here removes it from both.</p>'
      + '<div class="rd-drawer-section-title">Speaking order</div>' + speakRows
      + '<button type="button" class="rd-link-quiet" onclick="showToast(\'Add duty in full editor\')">+ Add a duty</button>';
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
