/* Venue & Vendors — All.dc screen 4c + Views 30f/30g.
   One table with views Table | Compare | Contacts (not Tracker/Shortlist tabs).
   Rail: All vendors · Booked · Shortlist · No contract on file · Balance outstanding.
   Stats: Vendors · Booked · Booked value · Paid to date · No contract.
   Columns: Vendor · Category · Quote · Balance · Rating (squares) · Status · Contract.
   Booked value / Paid to date count booked vendors only. */
(function () {
  'use strict';

  window._vndMode = window._vndMode || 'table';
  window._vndRailView = window._vndRailView || 'all';
  window._vndUiFilters = window._vndUiFilters || { category: 'all', status: 'all', dayof: 'all' };
  window._vndSort = window._vndSort || 'quote';
  window._vndRowHeight = window._vndRowHeight || 'compact';
  window._vndSel = window._vndSel instanceof Set ? window._vndSel : new Set();
  window._vndCompareCat = window._vndCompareCat || '';
  window._vndShowPassed = window._vndShowPassed !== false;
  window._vndDrawerId = window._vndDrawerId || null;
  window._vndDrawerTab = window._vndDrawerTab || 0;

  const VND_DRAWER_TABS = ['Vendor', 'Contract', 'Schedule', 'Contacts', 'History'];
  const VND_COL_SCOPE = 'vendors-4c';
  const VND_COLUMNS = [
    { key: 'tick', label: '', width: '36px', fixed: true },
    { key: 'name', label: 'Vendor', width: '220px' },
    { key: 'cat', label: 'Category', width: '116px' },
    { key: 'quote', label: 'Quote', width: '92px', num: true },
    { key: 'balance', label: 'Balance', width: '92px', num: true },
    { key: 'rating', label: 'Rating', width: '72px' },
    { key: 'status', label: 'Status', width: '116px' },
    { key: 'contract', label: 'Contract', width: '96px' }
  ];

  if (window.rdColumns) {
    window.rdColumns.register(VND_COL_SCOPE, VND_COLUMNS.map(c => ({
      key: c.key, label: c.label, width: c.width, num: !!c.num, fixed: !!c.fixed,
      cls: c.num ? 'rd-vnd-th--num' : ''
    })), () => { if (typeof renderVendors === 'function') renderVendors(); });
  }

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));
  function money0(n) {
    const v = Math.round(parseFloat(n) || 0);
    return '$' + v.toLocaleString();
  }
  function moneyOrDash(n) {
    const v = parseFloat(n) || 0;
    return v ? money0(v) : '—';
  }
  function vendorRows() {
    return typeof safeArray === 'function' ? safeArray(data.vendors) : (data.vendors || []);
  }
  function vid(v) {
    if (!v) return '';
    if (v._id) return String(v._id);
    const i = vendorRows().indexOf(v);
    return i >= 0 ? 'idx:' + i : '';
  }
  function isBooked(v) {
    return (typeof vendorBookedStatus === 'function' && vendorBookedStatus(v && v.status)) || !!(v && v.contract);
  }
  function hasContract(v) {
    if (!v) return false;
    if (v.contract === true || v.contract === 'Signed' || v.contractSigned) return true;
    const st = String(v.contract || '').toLowerCase();
    return st === 'signed' || st === 'yes' || st === '1';
  }
  function contractLabel(v) {
    if (/officiant|pastor/i.test(String(v && v.cat || ''))) return 'N/A';
    return hasContract(v) ? 'Signed →' : 'None';
  }
  function isShortlisted(v) {
    if (!v) return false;
    if (isBooked(v)) return false;
    if (v.shortlisted || v.onShortlist) return true;
    const st = String(v.status || '');
    return /shortlist|consider|quote|contact|research|meeting|tasting|deposit/i.test(st);
  }
  function statusLabel(v) {
    const raw = String((v && v.status) || 'Researching');
    if (isBooked(v) && !/deposit|paid|complete/i.test(raw)) return 'Booked';
    if (/deposit/i.test(raw)) return 'Deposit sent';
    if (isShortlisted(v) && !/deposit/i.test(raw)) {
      if (/shortlist/i.test(raw)) return 'Shortlisted';
      if (/pass/i.test(raw)) return 'Passed';
      return raw === 'Researching' || raw === 'Contacted' || raw === 'Considering' || raw === 'Quote Received'
        ? 'Shortlisted' : raw;
    }
    if (/pass/i.test(raw)) return 'Passed';
    return typeof vendorDisplayStatus === 'function' ? vendorDisplayStatus(raw) : raw;
  }
  function balanceOf(v) {
    if (!v) return 0;
    const bal = parseFloat(v.balance);
    if (Number.isFinite(bal)) return Math.max(0, bal);
    return Math.max(0, (parseFloat(v.quote) || 0) - (parseFloat(v.deposit) || 0));
  }
  function paidOf(v) {
    const q = parseFloat(v && v.quote) || 0;
    return Math.max(0, q - balanceOf(v));
  }
  function ratingOf(v) {
    return Math.max(0, Math.min(5, parseInt(v && v.rating, 10) || 0));
  }
  function vendorSubline(v) {
    const bits = [];
    if (v.contact) bits.push(v.contact);
    if (v.notes) bits.push(String(v.notes).split(/[.\n]/)[0].trim());
    else if (v.pros) bits.push(String(v.pros).split(/[.\n]/)[0].trim());
    return bits.filter(Boolean).join(' · ');
  }
  function isDayOf(v) {
    if (v && (v.dayOf === true || v.onSite || v.dayOfCritical)) return true;
    const cat = String(v && v.cat || '').toLowerCase();
    return /venue|cater|photo|film|video|dj|band|music|flor|officiant|pastor|planner|coord|baker|cake|rental|transport|beauty|hair|makeup/.test(cat);
  }

  /* ── figures / rail (4c) ─────────────────────────────────────────────── */

  function vendorFigures() {
    const rows = vendorRows();
    const booked = rows.filter(isBooked);
    const bookedValue = booked.reduce((s, v) => s + (parseFloat(v.quote) || 0), 0);
    const paid = booked.reduce((s, v) => s + paidOf(v), 0);
    const noContract = rows.filter(v => !hasContract(v) && !/officiant|pastor/i.test(String(v.cat || '')));
    const shortlist = rows.filter(isShortlisted);
    const balanceOut = rows.filter(v => balanceOf(v) > 0);
    return {
      count: rows.length,
      booked: booked.length,
      bookedValue: bookedValue,
      paid: paid,
      noContract: noContract.length,
      shortlist: shortlist.length,
      balanceOut: balanceOut.length
    };
  }

  function vendorRailCounts() {
    const f = vendorFigures();
    return {
      all: f.count,
      booked: f.booked,
      shortlist: f.shortlist,
      nocontract: f.noContract,
      balance: f.balanceOut
    };
  }

  function matchesRail(v, view) {
    view = view || window._vndRailView || 'all';
    if (view === 'all') return true;
    if (view === 'booked') return isBooked(v);
    if (view === 'shortlist') return isShortlisted(v);
    if (view === 'nocontract') {
      return !hasContract(v) && !/officiant|pastor/i.test(String(v.cat || ''));
    }
    if (view === 'balance') return balanceOf(v) > 0;
    return true;
  }

  function matchesFilters(v) {
    if (!matchesRail(v)) return false;
    const ui = window._vndUiFilters || {};
    if (ui.category && ui.category !== 'all') {
      if (String(v.cat || '').trim() !== ui.category) return false;
    }
    if (ui.status && ui.status !== 'all') {
      if (statusLabel(v) !== ui.status && String(v.status || '') !== ui.status) return false;
    }
    if (ui.dayof && ui.dayof !== 'all') {
      if (ui.dayof === 'day' && !isDayOf(v)) return false;
      if (ui.dayof === 'pre' && isDayOf(v)) return false;
    }
    return true;
  }

  function sortRows(a, b) {
    const mode = window._vndSort || 'quote';
    if (mode === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    if (mode === 'status') return statusLabel(a).localeCompare(statusLabel(b));
    if (mode === 'category') return String(a.cat || '').localeCompare(String(b.cat || '')) || String(a.name || '').localeCompare(String(b.name || ''));
    /* quote desc */
    return (parseFloat(b.quote) || 0) - (parseFloat(a.quote) || 0);
  }

  /* ── chrome ──────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const mode = window._vndMode || 'table';
    const fullEd = `<button type="button" class="rd-btn" data-rd-full-editor onclick="rdVndFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>`;
    if (mode === 'compare') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print comparison</button>
        ${fullEd}
        <button type="button" class="rd-btn" onclick="typeof exportVendorCSV==='function'?exportVendorCSV():exportSectionCSV('Vendors',data.vendors)">Export</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="addVendorRow()">Add vendor</button>`;
    }
    if (mode === 'contacts') {
      return `<button type="button" class="rd-btn" onclick="rdVndPrintContactSheet()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print contact sheet</button>
        ${fullEd}
        <button type="button" class="rd-btn" onclick="rdVndExportVCards()">Export vCards</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="addVendorRow()">Add vendor</button>`;
    }
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdVndVendorPacket()">Vendor packet</button>
      <button type="button" class="rd-btn" onclick="typeof exportVendorCSV==='function'?exportVendorCSV():exportSectionCSV('Vendors',data.vendors)">Export</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      ${fullEd}
      <button type="button" class="rd-btn rd-btn--primary" onclick="addVendorRow()">+ New vendor</button>`;
  }

  function uedVendorShellRd() {
    const panel = document.getElementById('panel-vendors');
    if (!panel) return;
    panel.classList.add('ued-scope', 'vendors-mockup');
    if (panel.dataset.uedShell === 'vendors-rd4c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      /* Keep pagehead in sync when Table / Compare / Contacts changes. */
      return;
    }
    panel.dataset.uedShell = 'vendors-rd4c';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Vendors</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Venue &amp; Vendors</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="vendor-stats" aria-label="Vendor summary"></div>
      <div class="rd-toolbar" id="vendors-toolbar"></div>
      <div class="rd-bulkbar" id="vendors-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="vendors-surface-row">
          <div class="rd-surface__main" id="vendors-view-host">
            <div class="rd-view" id="vnd-view-table" data-vnd-view="table">
              <div class="rd-table-wrap ued-table-wrap" id="vendors-4c-table"></div>
              <span class="rd-table-foot ued-soft" id="vendors-hub-preview-foot"></span>
            </div>
            <div class="rd-view" id="vnd-view-compare" data-vnd-view="compare" hidden>
              <div id="vendors-compare-view" class="rd-vnd-compare"></div>
            </div>
            <div class="rd-view" id="vnd-view-contacts" data-vnd-view="contacts" hidden>
              <div id="vendors-contacts-view" class="rd-vnd-contacts"></div>
            </div>
          </div>
          <div id="vendors-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderVendorStatsRd() {
    const host = document.getElementById('vendor-stats');
    if (!host) return;
    const f = vendorFigures();
    const mode = window._vndMode || 'table';

    if (mode === 'compare') {
      const short = vendorRows().filter(isShortlisted).length;
      const cats = new Set(vendorRows().map(v => String(v.cat || '').trim()).filter(Boolean));
      const decided = vendorRows().filter(isBooked).reduce((s, v) => { s.add(String(v.cat || '')); return s; }, new Set());
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Vendors', value: f.count + ' booked', filter: 'Show all' },
          { label: 'Shortlisted', value: short + ' open', filter: 'Shortlist', onFilter: () => applyVendorsRailView('shortlist') },
          { label: 'Categories decided', value: decided.size + ' of ' + Math.max(cats.size, decided.size), filter: 'Booked' },
          { label: 'Committed', value: money0(f.bookedValue), filter: 'Booked value' },
          { label: 'Quotes expiring', value: '—', filter: 'Compare' }
        ]);
        return;
      }
    }
    if (mode === 'contacts') {
      const day = vendorRows().filter(isDayOf).length;
      const noPhone = vendorRows().filter(v => !String(v.phone || '').trim()).length;
      const confirmed = vendorRows().filter(v => vendorTimeConfirmed(v) || vendorArrival(v)).length;
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Vendors', value: String(f.count), filter: 'Show all' },
          { label: 'On the day', value: String(day), filter: 'Day-of' },
          { label: 'Confirmed times', value: confirmed + ' of ' + f.count, filter: 'Contacts' },
          {
            label: 'No number',
            value: String(noPhone),
            filter: 'No number on file',
            attention: noPhone ? 'Vendors missing a phone number' : undefined
          },
          { label: 'Unsigned paper', value: String(f.noContract), filter: 'No contract', onFilter: () => applyVendorsRailView('nocontract') }
        ]);
        return;
      }
    }

    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Vendors', value: String(f.count), filter: 'Show all', onFilter: () => applyVendorsRailView('all') },
        { label: 'Booked', value: String(f.booked), filter: 'Filter · Booked', onFilter: () => applyVendorsRailView('booked') },
        { label: 'Booked value', value: money0(f.bookedValue), filter: 'Show booked' },
        { label: 'Paid to date', value: money0(f.paid), filter: 'Paid' },
        {
          label: 'No contract',
          value: String(f.noContract),
          filter: 'Filter · No contract',
          attention: f.noContract ? 'Vendors still missing a signed contract' : undefined,
          onFilter: () => applyVendorsRailView('nocontract')
        }
      ]);
      /* Force No contract value colour to match mock #9c3b34 when attention */
      const last = host.querySelector('.rd-stat.is-attention .rd-stat__value, .m-stat.is-attention .m-stat-val');
      if (last) last.style.color = '#9c3b34';
      return;
    }
    host.innerHTML = [
      ['Vendors', f.count],
      ['Booked', f.booked],
      ['Booked value', money0(f.bookedValue)],
      ['Paid to date', money0(f.paid)],
      ['No contract', f.noContract]
    ].map(([l, v], i) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val"${i === 4 && f.noContract ? ' style="color:#9c3b34"' : ''}>${v}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._vndUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdVndOpenFilter('${field}',this)">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdVndClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderVendorsToolbar() {
    const host = document.getElementById('vendors-toolbar');
    if (!host) return;
    const mode = window._vndMode || 'table';
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const switcher = `<div class="rd-viewswitch" role="group" aria-label="Vendors view">
        <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetVendorsView('table')">Table</button>
        <button type="button" class="rd-viewswitch__item${mode === 'compare' ? ' is-active' : ''}" onclick="rdSetVendorsView('compare')">Compare</button>
        <button type="button" class="rd-viewswitch__item${mode === 'contacts' ? ' is-active' : ''}" onclick="rdSetVendorsView('contacts')">Contacts</button>
      </div>`;

    if (mode === 'compare') {
      const showPassed = window._vndShowPassed !== false;
      host.innerHTML =
        filterChip('Category', 'category') +
        filterChip('Status', 'status') +
        `<button type="button" class="rd-chip${showPassed ? ' is-active' : ''}" onclick="rdVndTogglePassed()">Show passed${showPassed ? '<span class="rd-chip__clear" onclick="event.stopPropagation();rdVndTogglePassed()">&#10005;</span>' : ''}</button>` +
        `<div class="rd-toolbar__right">${switcher}</div>`;
      return;
    }
    if (mode === 'contacts') {
      host.innerHTML =
        filterChip('Category', 'category') +
        filterChip('Day-of', 'dayof') +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVndOpenSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort by arrival time</button>` +
        `<div class="rd-toolbar__right">${switcher}</div>`;
      return;
    }

    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(VND_COL_SCOPE) : 'Columns · 7 of 7';
    const sortLabel = ({ quote: 'Sort by quote', name: 'Sort by name', status: 'Sort by status', category: 'Sort by category' })[window._vndSort || 'quote'] || 'Sort by quote';
    host.innerHTML =
      filterChip('Category', 'category') +
      filterChip('Status', 'status') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVndOpenSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${esc(sortLabel)}</button>` +
      `<button type="button" class="rd-chip" onclick="rdVndOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${esc(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip" onclick="rdVndAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>` +
      `<button type="button" class="rd-chip" onclick="rdVndCycleRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(window._vndRowHeight || 'compact')}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<div class="rd-toolbar__right">${switcher}</div>`;
  }

  function renderVendorsBulkBar() {
    const bar = document.getElementById('vendors-bulk-bar');
    if (!bar) return;
    const n = window._vndSel.size;
    if (!n || (window._vndMode || 'table') !== 'table') {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep"></span>
      <button type="button" class="rd-bulkbar__action" onclick="rdVndBulkStatus()">Set status</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdVndBulkRequestQuote()">Request a quote</button>
      <button type="button" class="rd-bulkbar__clear" onclick="rdVndBulkClear()">Clear selection</button>`;
  }

  /* ── table (4c) ──────────────────────────────────────────────────────── */

  function ratingSquares(n) {
    const filled = '■'.repeat(n);
    const empty = '■'.repeat(5 - n);
    return `<span class="rd-vnd-rating" aria-label="${n} of 5"><span class="rd-vnd-rating__on">${filled}</span><span class="rd-vnd-rating__off">${empty}</span></span>`;
  }

  function statusPillHtml(v) {
    const label = statusLabel(v);
    let scheme = 'gray';
    if (/booked|paid|complete/i.test(label)) scheme = 'green';
    else if (/shortlist|deposit|consider|quote/i.test(label)) scheme = 'gold';
    else if (/pass|not booked/i.test(label)) scheme = 'gray';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(label)}</span>`;
  }

  function contractCell(v) {
    const label = contractLabel(v);
    if (label === 'None') return `<span class="rd-vnd-contract is-none">${esc(label)}</span>`;
    if (label === 'N/A') return `<span class="rd-vnd-contract is-na">${esc(label)}</span>`;
    return `<button type="button" class="rd-vnd-contract is-signed" onclick="event.stopPropagation();showPanel('contracts')">${esc(label)}</button>`;
  }

  function visibleCols() {
    return window.rdColumns ? window.rdColumns.visible(VND_COL_SCOPE) : VND_COLUMNS;
  }

  function groupVisibleRows(list) {
    /* 4c groups: undecided shortlist categories first ("Photographer · deciding between 2"),
       then "Booked · N vendors", then remaining. */
    const short = list.filter(v => isShortlisted(v) && !isBooked(v));
    const booked = list.filter(isBooked);
    const rest = list.filter(v => !isShortlisted(v) && !isBooked(v));

    const groups = [];
    const byCat = {};
    short.forEach(v => {
      const cat = String(v.cat || 'Uncategorised').trim() || 'Uncategorised';
      (byCat[cat] = byCat[cat] || []).push(v);
    });
    Object.keys(byCat).sort().forEach(cat => {
      const rows = byCat[cat].slice().sort(sortRows);
      if (rows.length >= 2) {
        groups.push({ key: 'decide:' + cat, title: cat + ' · deciding between ' + rows.length, rows: rows, residual: false });
      } else {
        groups.push({ key: 'short:' + cat, title: cat + ' · shortlist', rows: rows, residual: false });
      }
    });
    if (booked.length) {
      groups.push({ key: 'booked', title: 'Booked · ' + booked.length + ' vendor' + (booked.length === 1 ? '' : 's'), rows: booked.slice().sort(sortRows), residual: false });
    }
    if (rest.length) {
      const noContract = rest.filter(v => !hasContract(v) && !/officiant|pastor/i.test(String(v.cat || '')));
      const other = rest.filter(v => hasContract(v) || /officiant|pastor/i.test(String(v.cat || '')));
      if (other.length) groups.push({ key: 'other', title: 'Other · ' + other.length, rows: other.sort(sortRows), residual: false });
      if (noContract.length) {
        groups.push({
          key: 'nocontract',
          title: 'No contract on file · ' + noContract.length,
          rows: noContract.sort(sortRows),
          residual: true
        });
      }
    }
    return groups;
  }

  function rowHtml(v) {
    const id = vid(v);
    const sel = window._vndSel.has(id);
    const bal = balanceOf(v);
    const sub = vendorSubline(v);
    const cols = visibleCols();
    const idx = vendorRows().indexOf(v);
    const actions = `<span class="rd-row-actions" onclick="event.stopPropagation()">
        <button type="button" class="rd-row-actions__btn" onclick="rdVndOpenDrawer('${esc(id)}')">Open<span class="rd-row-actions__kbd">↵</span></button>
        <button type="button" class="rd-row-actions__btn" onclick="rdVndFullEditor(${idx >= 0 ? idx : 'null'})">Full editor<span class="rd-row-actions__kbd">⇧↵</span></button>
      </span>`;
    return `<tr class="rd-vnd-row${sel ? ' is-selected' : ''}" data-id="${esc(id)}" onclick="rdVndOpenDrawer('${esc(id)}')">` +
      cols.map(c => {
        if (c.key === 'tick') {
          return `<td class="rd-vnd-tick" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdVndToggleSel('${esc(id)}',this.checked)" aria-label="Select vendor"></td>`;
        }
        if (c.key === 'name') {
          return `<td class="rd-vnd-name"><div class="rd-vnd-name__primary">${esc(v.name || 'Untitled vendor')}</div>${sub ? `<div class="rd-vnd-name__sub">${esc(sub)}</div>` : ''}${actions}</td>`;
        }
        if (c.key === 'cat') return `<td class="rd-vnd-muted">${esc(v.cat || '—')}</td>`;
        if (c.key === 'quote') return `<td class="rd-vnd-num">${moneyOrDash(v.quote)}</td>`;
        if (c.key === 'balance') {
          return `<td class="rd-vnd-num${bal > 0 ? ' is-owing' : ''}">${moneyOrDash(bal)}</td>`;
        }
        if (c.key === 'rating') return `<td>${ratingSquares(ratingOf(v))}</td>`;
        if (c.key === 'status') return `<td>${statusPillHtml(v)}</td>`;
        if (c.key === 'contract') return `<td>${contractCell(v)}</td>`;
        return '<td></td>';
      }).join('') + '</tr>';
  }

  function renderVendorsTable() {
    const wrap = document.getElementById('vendors-4c-table');
    if (!wrap) return;
    const list = vendorRows().filter(matchesFilters);
    const total = vendorRows().length;
    if (typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
      const painted = RdStates.applyOverlay(wrap, {
        page: 'vendors',
        total: total,
        filtered: list.length,
        filterOn: (window._vndRailView && window._vndRailView !== 'all')
          || Object.values(window._vndUiFilters || {}).some(v => v && v !== 'all'),
        addLabel: '+ New vendor',
        onAdd: () => { if (typeof addVendorRow === 'function') addVendorRow(); }
      });
      if (painted) {
        const foot = document.getElementById('vendors-hub-preview-foot');
        if (foot) foot.textContent = '';
        return;
      }
    }
    const cols = visibleCols();
    const head = cols.map(c => {
      const align = c.num ? ' style="text-align:right;width:' + (c.width || '') + '"' : (c.width ? ' style="width:' + c.width + '"' : '');
      return `<th${align} data-col="${c.key}">${esc(c.label)}</th>`;
    }).join('');
    const groups = groupVisibleRows(list);
    let body = '';
    groups.forEach(g => {
      body += `<tr class="rd-vnd-group${g.residual ? ' is-danger' : ''}"><td colspan="${cols.length}">${esc(g.title)}</td></tr>`;
      body += g.rows.map(rowHtml).join('');
    });
    body += `<tr class="rd-vnd-add" data-no-bulk="true"><td colspan="${cols.length}"><button type="button" class="rd-vnd-addbtn" onclick="addVendorRow()"><span>+</span> Add a vendor…</button></td></tr>`;
    wrap.classList.remove('has-rd-state');
    wrap.classList.toggle('rd-row-compact', (window._vndRowHeight || 'compact') === 'compact');
    wrap.classList.toggle('rd-row-tall', window._vndRowHeight === 'tall');
    wrap.innerHTML = `<table class="rd-vnd-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    const foot = document.getElementById('vendors-hub-preview-foot');
    if (foot) foot.textContent = list.length + ' vendor' + (list.length === 1 ? '' : 's') + ' · booked value counts booked only';
  }

  /* ── Compare view (30f) ──────────────────────────────────────────────── */

  function compareCategories() {
    const cats = {};
    vendorRows().forEach(v => {
      const cat = String(v.cat || '').trim();
      if (!cat) return;
      (cats[cat] = cats[cat] || []).push(v);
    });
    return cats;
  }

  /* Decision extras drawn in Views 30f that sit beyond VENDOR_CATEGORY_SCHEMAS. */
  const COMPARE_DECISION_EXTRAS = {
    photo: [
      { id: 'drone', label: 'Drone', type: 'bool', compare: true, best: 'bool' },
      { id: 'gallerySeen', label: 'Seen their full gallery', type: 'bool', compare: true, best: 'bool' },
      { id: 'referenceCalled', label: 'Reference called', type: 'bool', compare: true, best: 'bool' },
      { id: 'travelCharged', label: 'Travel charged', type: 'bool', compare: true, best: 'bool' }
    ],
    video: [
      { id: 'drone', label: 'Drone', type: 'bool', compare: true, best: 'bool' },
      { id: 'gallerySeen', label: 'Seen their full gallery', type: 'bool', compare: true, best: 'bool' },
      { id: 'referenceCalled', label: 'Reference called', type: 'bool', compare: true, best: 'bool' },
      { id: 'travelCharged', label: 'Travel charged', type: 'bool', compare: true, best: 'bool' }
    ]
  };
  const COMPARE_LABEL_ALIASES = {
    hours: 'Hours covered',
    deliveryTimeline: 'Delivery',
    engagement: 'Engagement shoot',
    album: 'Album included'
  };

  /* Category schema fields (VENDOR_CATEGORY_SCHEMAS) — same compare rows as legacy shortlist. */
  function compareSchemaFields(cat) {
    const schema = typeof vendorCategorySchemaFromLabel === 'function'
      ? vendorCategorySchemaFromLabel(cat)
      : null;
    const base = (schema && Array.isArray(schema.fields))
      ? schema.fields.filter(f => f && f.compare !== false).map(f => {
        const label = COMPARE_LABEL_ALIASES[f.id] || f.label;
        return Object.assign({}, f, { label: label });
      })
      : [];
    const key = schema && schema.key;
    const extras = (key && COMPARE_DECISION_EXTRAS[key]) || [];
    const seen = new Set(base.map(f => f.id));
    extras.forEach(f => { if (!seen.has(f.id)) base.push(f); });
    return base;
  }

  function compareAttrRaw(v, field) {
    if (!v || !field) return '';
    if (typeof vendorAttrGet === 'function') return vendorAttrGet(v, field.id);
    const attrs = v.attrs && typeof v.attrs === 'object' && !Array.isArray(v.attrs) ? v.attrs : {};
    return attrs[field.id] == null ? '' : attrs[field.id];
  }

  function compareAttrDisplay(field, value) {
    const raw = value == null ? '' : String(value).trim();
    const low = raw.toLowerCase();
    if (low === 'partial' || low === 'o' || low === '○' || low === 'half') return '○';
    if (low === 'extra' || low === 'extra cost' || low === '●'
      || low === 'available at extra cost' || low === 'addon' || low === 'add-on') return '●';
    if (typeof vendorAttrDisplay === 'function') return vendorAttrDisplay(field, value);
    if (value == null || value === '') return '—';
    return String(value);
  }

  /* Mirror legacy vcmpAttrBestKey for a column of vendor records. */
  function compareAttrBestId(cols, field) {
    if (!field || !field.best || !cols.length) return null;
    const entries = cols.map(v => ({ id: vid(v), value: compareAttrRaw(v, field), v }))
      .filter(e => e.v);
    if (!entries.length) return null;
    if (field.best === 'bool') {
      const yes = entries.filter(e =>
        (typeof vendorAttrIsTruthy === 'function')
          ? vendorAttrIsTruthy(e.value)
          : (e.value === true || e.value === 'true' || e.value === 1 || e.value === '1' || e.value === 'yes')
      );
      return yes.length === 1 ? yes[0].id : null;
    }
    const nums = entries.map(e => {
      const n = (typeof vendorAttrNum === 'function')
        ? vendorAttrNum(e.value)
        : (isNaN(parseFloat(e.value)) ? null : parseFloat(e.value));
      return { id: e.id, n };
    }).filter(e => e.n != null);
    if (!nums.length) return null;
    if (field.best === 'min') {
      const min = Math.min.apply(null, nums.map(e => e.n));
      const winners = nums.filter(e => e.n === min);
      return winners.length === 1 ? winners[0].id : null;
    }
    if (field.best === 'max') {
      const max = Math.max.apply(null, nums.map(e => e.n));
      const winners = nums.filter(e => e.n === max);
      return winners.length === 1 ? winners[0].id : null;
    }
    return null;
  }

  function renderVendorsCompareView() {
    const host = document.getElementById('vendors-compare-view');
    if (!host) return;
    const cats = compareCategories();
    let cat = window._vndCompareCat;
    if (!cat || !cats[cat]) {
      cat = Object.keys(cats).sort().find(c => (cats[c] || []).filter(v => isShortlisted(v) || isBooked(v)).length >= 2)
        || Object.keys(cats).sort()[0] || '';
      window._vndCompareCat = cat;
    }
    let cols = (cats[cat] || []).slice();
    if (!window._vndShowPassed) cols = cols.filter(v => statusLabel(v) !== 'Passed');
    cols = cols.filter(v => isShortlisted(v) || isBooked(v) || statusLabel(v) === 'Passed').slice(0, 4);
    if (!cols.length) cols = (cats[cat] || []).slice(0, 4);

    if (!cat || !cols.length) {
      host.innerHTML = '<div class="empty-state">Add vendors in the same category to compare quotes side by side.</div>';
      return;
    }

    const schemaFields = compareSchemaFields(cat);
    const schemaRows = schemaFields.map(f => ({
      key: 'attr:' + f.id,
      label: f.label,
      field: f,
      kind: 'schema',
      render: v => compareAttrDisplay(f, compareAttrRaw(v, f))
    }));

    /* Quote first, then category qualities, then shared decision fields; Status last (30f). */
    const attrs = [
      { key: 'quote', label: 'Quote', kind: 'quote', render: v => moneyOrDash(v.quote) },
      { key: 'deposit', label: 'Deposit', kind: 'money', render: v => moneyOrDash(v.deposit) },
      { key: 'balance', label: 'Balance', kind: 'money', render: v => moneyOrDash(balanceOf(v)) },
      ...schemaRows,
      { key: 'rating', label: 'Rating', kind: 'text', render: v => ratingOf(v) ? (ratingOf(v) + ' / 5') : '—' },
      { key: 'contract', label: 'Contract', kind: 'text', render: v => contractLabel(v) },
      { key: 'contact', label: 'Contact', kind: 'text', render: v => v.contact || '—' },
      { key: 'pros', label: 'Pros', kind: 'text', render: v => v.pros || '—' },
      { key: 'cons', label: 'Cons', kind: 'text', render: v => v.cons || '—' },
      { key: 'status', label: 'Status', kind: 'status', render: v => statusLabel(v) }
    ];

    const quotes = cols.map(v => parseFloat(v.quote) || 0).filter(n => n > 0);
    const bestQuote = quotes.length ? Math.min.apply(null, quotes) : null;
    const schemaBest = {};
    schemaFields.forEach(f => { schemaBest[f.id] = compareAttrBestId(cols, f); });

    const catOpts = Object.keys(cats).sort().map(c =>
      `<button type="button" class="rd-chip${c === cat ? ' is-active' : ''}" onclick="rdVndSetCompareCat('${esc(c)}')">${esc(c)}</button>`
    ).join('');

    let head = `<th class="rd-vnd-cmp-attr">Field</th>` + cols.map(v => {
      const passed = statusLabel(v) === 'Passed';
      return `<th class="${passed ? 'is-passed' : ''}">${esc(v.name || 'Vendor')}</th>`;
    }).join('');

    let body = attrs.map(a => {
      const rowCls = a.kind === 'schema' ? ' class="rd-vnd-cmp-schema"' : '';
      return `<tr${rowCls}><th scope="row">${esc(a.label)}</th>` + cols.map(v => {
        const passed = statusLabel(v) === 'Passed';
        const id = vid(v);
        let cls = passed ? 'is-passed' : '';
        if (a.kind === 'quote' && bestQuote != null && (parseFloat(v.quote) || 0) === bestQuote && !passed) cls += ' is-best';
        if (a.kind === 'schema' && a.field && schemaBest[a.field.id] === id && !passed) cls += ' is-best';
        if (a.kind === 'status') return `<td class="${cls.trim()}">${statusPillHtml(v)}</td>`;
        const val = a.render(v);
        /* Marks (✓ ○ ● —) and money stay literal; escape everything else. */
        const mark = val === '✓' || val === '○' || val === '●' || val === '—';
        return `<td class="${cls.trim()}">${mark ? val : esc(String(val == null || val === '' ? '—' : val))}</td>`;
      }).join('') + '</tr>';
    }).join('');

    const totalInCat = (cats[cat] || []).length;
    const shown = cols.length;

    host.innerHTML = `
      <div class="rd-section__head">
        <div class="rd-pagehead__eyebrow">${esc(cat)} shortlist</div>
        <p class="rd-help">Four quotes side by side · ✓ included · ○ partial · ● extra cost · — not offered</p>
        <div class="rd-vnd-cmp-meta">${shown} of ${Math.max(shown, totalInCat)} quotes shown
          <button type="button" class="rd-link-quiet" onclick="rdVndAddCompareColumn()">Add a column</button>
        </div>
      </div>
      <div class="rd-vnd-cmp-cats">${catOpts}</div>
      <div class="rd-table-wrap"><table class="rd-vnd-cmp-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="rd-help">Rows are category qualities plus decision checks (drone, references, travel). Better values are shaded. Quote is the vendor&rsquo;s budget-line value. Edit qualities in the drawer or Full editor.</p>`;
  }

  /* ── Contacts view (30g) ─────────────────────────────────────────────── */

  function vendorArrival(v) {
    return String((v && (v.arrive || v.arrival || v.arriveTime || v.onSiteFrom)) || (v && v.attrs && (v.attrs.arrive || v.attrs.onSiteFrom)) || '').trim();
  }
  function vendorServiceCue(v) {
    return String((v && (v.service || v.serviceTime || v.cue)) || (v && v.attrs && (v.attrs.service || v.attrs.cue)) || '').trim();
  }
  function vendorTimeConfirmed(v) {
    if (!v) return false;
    if (v.timeConfirmed === true || v.confirmed === true) return true;
    const st = String(v.dayOfStatus || v.contactStatus || '').toLowerCase();
    return st === 'confirmed' || st === 'complete';
  }

  function renderVendorsContactsView() {
    const host = document.getElementById('vendors-contacts-view');
    if (!host) return;
    const list = vendorRows().filter(matchesFilters).slice().sort((a, b) =>
      vendorArrival(a).localeCompare(vendorArrival(b)) || String(a.name || '').localeCompare(String(b.name || ''))
    );
    const day = list.filter(v => isDayOf(v) && String(v.phone || '').trim());
    const pre = list.filter(v => !isDayOf(v) && String(v.phone || '').trim());
    const none = list.filter(v => !String(v.phone || '').trim());

    function card(v) {
      const id = vid(v);
      const arrive = vendorArrival(v);
      const cue = vendorServiceCue(v);
      const phone = String(v.phone || '').trim();
      const signed = hasContract(v);
      const confirmed = vendorTimeConfirmed(v);
      let chip = '';
      if (!phone) chip = '<span class="status-pill" data-pillscheme="red">No contact</span>';
      else if (!signed && isDayOf(v)) chip = '<span class="status-pill" data-pillscheme="gold">Unsigned</span>';
      else if (confirmed) chip = '<span class="status-pill" data-pillscheme="green">Confirmed</span>';
      else if (/hold|complete/i.test(statusLabel(v))) chip = statusPillHtml(v);
      else chip = '<span class="status-pill" data-pillscheme="gold">Unconfirmed</span>';
      const roleBits = [v.cat || 'Vendor'];
      if (isDayOf(v) && arrive) roleBits.push('on site from ' + arrive);
      else if (!isDayOf(v) && (v.notes || cue)) roleBits.push(String(v.notes || cue).split(/[.\n]/)[0].trim());
      return `<article class="rd-vnd-contact${!phone ? ' is-danger' : ''}" onclick="rdVndOpenDrawer('${esc(id)}')">
        <div class="rd-vnd-contact__name">${esc(v.name || 'Untitled')}${v.contact ? ' · ' + esc(v.contact) : ''}</div>
        <div class="rd-vnd-contact__meta">${esc(roleBits.filter(Boolean).join(' · '))}</div>
        <div class="rd-vnd-contact__phone">${esc(phone || 'No number on file')}</div>
        <div class="rd-vnd-contact__foot">
          <span class="rd-vnd-contact__cue">${esc(cue || (arrive ? ('Call ' + arrive) : '—'))}</span>
          ${chip}
        </div>
      </article>`;
    }

    function section(title, note, rows, danger) {
      if (!rows.length) return '';
      return `<div class="rd-grouplist__group${danger ? ' is-danger' : ''}">
        <div class="rd-grouplist__head">${esc(title)} · ${rows.length}${danger ? '' : ' vendors'}</div>
        ${note ? `<p class="rd-help rd-vnd-contact-note">${esc(note)}</p>` : ''}
        <div class="rd-vnd-contactgrid">${rows.map(card).join('')}</div>
      </div>`;
    }

    if (!list.length) {
      if (typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
        RdStates.applyOverlay(host, {
          page: 'vendors', total: vendorRows().length, filtered: 0, filterOn: true,
          addLabel: '+ New vendor', onAdd: () => addVendorRow()
        });
      } else host.innerHTML = '<div class="empty-state">No vendors match.</div>';
      return;
    }
    host.classList.remove('has-rd-state');
    host.innerHTML =
      section('Day-of critical', 'these numbers print on the day-of sheet', day, false) +
      section('Pre-day only', 'no day-of presence, so not on the sheet', pre, false) +
      section('No number on file', 'cannot be reached on the day', none, true);
  }

  /* ── drawer (4c) ─────────────────────────────────────────────────────── */

  function findVendorById(id) {
    return vendorRows().find(v => vid(v) === String(id)) || null;
  }

  function drawerSchemaFieldsHtml(v, id) {
    const fields = compareSchemaFields(v && v.cat);
    if (!fields.length) return '';
    const schema = typeof vendorCategorySchemaFromLabel === 'function'
      ? vendorCategorySchemaFromLabel(v.cat)
      : null;
    const title = schema ? schema.label : (v.cat || 'Category');
    const rows = fields.map(f => {
      const raw = compareAttrRaw(v, f);
      const fid = esc(f.id);
      if (f.type === 'bool') {
        const checked = (typeof vendorAttrIsTruthy === 'function')
          ? vendorAttrIsTruthy(raw)
          : (raw === true || raw === 'true' || raw === 1 || raw === 'yes');
        return `<label class="rd-drawer__attr rd-drawer__attr--bool">
          <span>${esc(f.label)}</span>
          <select onchange="rdVndSetAttr('${esc(id)}','${fid}',this.value)" aria-label="${esc(f.label)}">
            <option value=""${raw === '' || raw == null ? ' selected' : ''}>—</option>
            <option value="true"${checked ? ' selected' : ''}>✓ included</option>
            <option value="partial"${String(raw).toLowerCase() === 'partial' ? ' selected' : ''}>○ partial</option>
            <option value="extra"${String(raw).toLowerCase() === 'extra' ? ' selected' : ''}>● extra cost</option>
            <option value="false"${raw === false || raw === 'false' || raw === 'no' ? ' selected' : ''}>— not offered</option>
          </select>
        </label>`;
      }
      if (f.type === 'select') {
        const opts = ['<option value="">—</option>'].concat((f.options || []).map(o =>
          `<option value="${esc(o)}"${String(raw) === o ? ' selected' : ''}>${esc(o)}</option>`
        ));
        return `<label class="rd-drawer__attr"><span>${esc(f.label)}</span>
          <select onchange="rdVndSetAttr('${esc(id)}','${fid}',this.value)">${opts.join('')}</select></label>`;
      }
      const inputType = (f.type === 'number' || f.type === 'money') ? 'number' : 'text';
      const shown = raw === 0 || raw ? String(raw) : '';
      return `<label class="rd-drawer__attr"><span>${esc(f.label)}</span>
        <input type="${inputType}" min="0" value="${esc(shown)}"
          onchange="rdVndSetAttr('${esc(id)}','${fid}',this.value)"
          oninput="rdVndSetAttrQuiet('${esc(id)}','${fid}',this.value)"></label>`;
    }).join('');
    return `<div class="rd-drawer__section rd-drawer__section--attrs">
      <div class="rd-drawer__section-title">Category details — ${esc(title)}</div>
      <div class="rd-drawer__attrs">${rows}</div>
    </div>`;
  }

  function budgetLineForVendor(v) {
    if (!v) return null;
    const budget = (typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || []));
    if (v.budgetCategoryId) {
      const byId = budget.find(b => String(b._id) === String(v.budgetCategoryId));
      if (byId) return byId;
    }
    const cat = String(v.cat || v.budgetCat || '').trim().toLowerCase();
    if (!cat) return null;
    return budget.find(b => {
      const n = String(b.cat || '').toLowerCase();
      return n === cat || n.includes(cat) || cat.includes(n.split('&')[0].trim());
    }) || null;
  }
  function linkedTaskForVendor(v) {
    if (!v) return null;
    const tasks = (typeof safeArray === 'function' ? safeArray(data.tasks) : (data.tasks || []));
    const name = String(v.name || '').trim().toLowerCase();
    const id = v._id;
    return tasks.find(t =>
      (id && String(t.vendorId) === String(id)) ||
      (name && String(t.vendor || '').trim().toLowerCase() === name) ||
      (name && String(t.task || '').toLowerCase().includes(name.split(' ')[0]))
    ) || null;
  }
  function depositLabel(v) {
    const dep = parseFloat(v && v.deposit) || 0;
    const quote = parseFloat(v && v.quote) || 0;
    if (!dep) return '—';
    if (quote > 0) {
      const pct = Math.round((dep / quote) * 100);
      return money0(dep) + ' on signing · ' + pct + '%';
    }
    return money0(dep) + ' on signing';
  }

  function shortDate(v, withYear) {
    if (!v) return '—';
    const s = String(v).slice(0, 10);
    const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleDateString(undefined, withYear
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short' });
  }

  function linkedContract(v) {
    if (!v) return null;
    const list = typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []);
    if (v.contractId) {
      const byId = list.find(c => String(c._id || c.id || '') === String(v.contractId));
      if (byId) return byId;
    }
    const name = String(v.name || '').trim().toLowerCase();
    if (!name) return null;
    return list.find(c => {
      const vn = String(c.vendor || c.name || '').trim().toLowerCase();
      return vn === name || vn.includes(name) || name.includes(vn);
    }) || null;
  }

  function vendorDocs(v) {
    const docs = [];
    const c = linkedContract(v);
    if (c) {
      if (c.contractFile) docs.push({ name: typeof c.contractFile === 'string' ? c.contractFile : (c.contractFile.name || 'Signed contract'), status: 'On file' });
      if (c.invoiceFile) docs.push({ name: typeof c.invoiceFile === 'string' ? c.invoiceFile : (c.invoiceFile.name || 'Invoice'), status: 'On file' });
      if (Array.isArray(c.docs)) c.docs.forEach(d => docs.push({ name: d.name || d.label || 'Document', status: d.status || 'On file' }));
      if (Array.isArray(c.missingDocs)) c.missingDocs.forEach(m => docs.push({ name: m.label || m.name || m, status: 'Missing' }));
    }
    if (Array.isArray(v.docs)) v.docs.forEach(d => docs.push({ name: d.name || d.label || 'Document', status: d.status || 'On file' }));
    if (Array.isArray(v.missingDocs)) v.missingDocs.forEach(m => docs.push({ name: m.label || m.name || m, status: 'Missing' }));
    if (!docs.length && hasContract(v)) docs.push({ name: 'Signed contract', status: 'On file' });
    if (!docs.length && isBooked(v) && !hasContract(v)) {
      docs.push({ name: 'Signed contract', status: 'Missing' });
      docs.push({ name: 'Public liability cert', status: 'Missing' });
    }
    return docs;
  }

  function vendorScheduleBlocks(v) {
    if (Array.isArray(v.schedule) && v.schedule.length) return v.schedule;
    if (Array.isArray(v.dayBlocks) && v.dayBlocks.length) return v.dayBlocks;
    if (Array.isArray(v.onSiteBlocks) && v.onSiteBlocks.length) return v.onSiteBlocks;
    const blocks = [];
    const arrive = vendorArrival(v);
    const cue = vendorServiceCue(v);
    if (arrive) blocks.push({ time: arrive, label: 'On site / access', duration: v.setupDuration || '' });
    if (cue) blocks.push({ time: cue, label: 'Service / cue', duration: '' });
    /* Wedding Day Timeline items that name this vendor. */
    const wday = typeof safeArray === 'function' ? safeArray(data.weddingDay || data.wday || data.timeline) : (data.weddingDay || data.timeline || []);
    const name = String(v.name || '').trim().toLowerCase();
    if (name && Array.isArray(wday)) {
      wday.forEach(row => {
        const who = String(row.vendor || row.who || row.owner || '').toLowerCase();
        const label = String(row.item || row.event || row.label || row.task || '');
        if (who.includes(name.split(' ')[0]) || label.toLowerCase().includes(name.split(' ')[0])) {
          blocks.push({
            time: row.time || row.start || '',
            label: label || 'Run-sheet block',
            duration: row.duration || row.len || ''
          });
        }
      });
    }
    return blocks;
  }

  function vendorContactPeople(v) {
    if (Array.isArray(v.contacts) && v.contacts.length) return v.contacts;
    const out = [];
    if (v.contact || v.phone || v.email) {
      out.push({
        name: v.contact || v.name || 'Primary',
        role: v.contactRole || 'Day-of contact',
        phone: v.phone || '',
        email: v.email || '',
        hours: v.reachable || v.hours || '',
        primary: true
      });
    }
    if (Array.isArray(v.otherContacts)) v.otherContacts.forEach(c => out.push(Object.assign({ primary: false }, c)));
    return out;
  }

  function drawerField(label, control) {
    return `<div class="rd-drawer-field"><span class="rd-drawer-label">${esc(label)}</span>${control}</div>`;
  }
  function drawerInput(key, value, opts) {
    const o = opts || {};
    const type = o.type || 'text';
    const ro = o.readonly ? ' readonly' : '';
    return `<input type="${type}" data-vndf="${esc(key)}" value="${esc(value == null ? '' : value)}"${ro}${o.step ? ' step="' + o.step + '"' : ''}>`;
  }
  function drawerSection(t) {
    return `<div class="rd-con-eyebrow rd-drawer-sect">${esc(t)}</div>`;
  }
  function drawerRow(left, right, opts) {
    const o = opts || {};
    return `<div class="rd-vnd-histrow${o.missing ? ' is-missing' : ''}"><span>${esc(left)}</span><span>${esc(right)}</span></div>`;
  }

  function drawerVendorTab(v, id) {
    const c = linkedContract(v);
    const total = c ? (parseFloat(c.total || c.amount) || parseFloat(v.quote) || 0) : (parseFloat(v.quote) || 0);
    const paid = c && typeof window.contractFigures === 'function'
      ? paidOf(v)
      : paidOf(v);
    const next = (c && (c.nextDue || c.balanceDue)) || v.nextDue || '';
    const nextAmt = v.nextDueAmount || (c && c.nextDueAmount) || balanceOf(v);
    const docs = vendorDocs(v);
    const missingN = docs.filter(d => /missing/i.test(d.status || '')).length;
    let html = drawerSection('Supplies')
      + drawerField('Category', drawerInput('cat', v.cat || ''))
      + drawerField('Service', drawerInput('service', v.service || v.notes || vendorSubline(v) || ''))
      + drawerField('Capacity', drawerInput('capacity', v.capacity || v.covers || ''))
      + drawerField('Status', drawerInput('status', statusLabel(v)))
      + drawerField('Booked on', drawerInput('bookedOn', v.bookedOn || v.bookedDate || (isBooked(v) ? (v.date || '') : ''), { type: 'date' }));
    html += drawerSection('Money')
      + drawerField('Contract total', drawerInput('quote', total, { type: 'number', step: '0.01' }))
      + drawerField('Paid', `<input type="text" readonly value="${esc(money0(paid))}">`)
      + drawerField('Outstanding', `<input type="text" readonly value="${esc(money0(Math.max(0, total - paid)))}">`)
      + drawerField('Next due', `<input type="text" readonly value="${esc(next ? (shortDate(next) + (nextAmt ? ' · ' + money0(nextAmt) : '')) : '—')}">`);
    if (missingN) {
      html += `<div class="rd-vnd-callout">${missingN} document${missingN === 1 ? '' : 's'} outstanding: ${esc(docs.filter(d => /missing/i.test(d.status || '')).map(d => d.name).join(' and ') || 'required paperwork')}. Both are required before setup.</div>`;
    } else {
      html += `<div class="rd-drawer-note">Pros and cons live here when you are deciding; once booked, the money and paperwork above are the source of truth.</div>`;
    }
    html += drawerSection('Portal access')
      + drawerRow('Portal', v.portalActive === false ? 'Off' : (v.portal || 'Active'))
      + drawerRow('Last seen in portal', v.portalSeen ? shortDate(v.portalSeen, true) : '—')
      + drawerRow('Found via', v.foundVia || v.source || '—');
    html += drawerSchemaFieldsHtml(v, id);
    html += drawerSection('Pros') + `<p class="rd-drawer-note">${esc(v.pros || 'Add what works about this vendor.')}</p>`
      + drawerSection('Cons') + `<p class="rd-drawer-note">${esc(v.cons || 'Add what gives you pause.')}</p>`;
    return html;
  }

  function drawerContractTab(v) {
    const c = linkedContract(v);
    const total = c ? (parseFloat(c.total || c.amount) || parseFloat(v.quote) || 0) : (parseFloat(v.quote) || 0);
    const dep = c ? (parseFloat(c.deposit) || parseFloat(v.deposit) || 0) : (parseFloat(v.deposit) || 0);
    const signed = (c && (c.date || c.signed)) || v.contractDate || '';
    const instN = c && Array.isArray(c.installments) ? c.installments.length
      : (Array.isArray(v.installments) ? v.installments.length : (dep ? 2 : 0));
    const docs = vendorDocs(v);
    const onFile = docs.filter(d => !/missing/i.test(d.status || '')).length;
    let html = '';
    if (hasContract(v) || c) {
      html += `<div class="rd-drawer-note">Signed ${esc(signed ? shortDate(signed, true) : '—')}</div>`;
    } else {
      html += `<div class="rd-vnd-callout">No contract on file yet. The quote is still a number on the vendor — booking writes the Budget line and opens the Contract.</div>`;
    }
    html += drawerRow('Total', money0(total))
      + drawerRow('Deposit', dep ? (money0(dep) + (paidOf(v) >= dep ? ' · paid' : '')) : '—')
      + drawerRow('Instalments', String(instN || '—'))
      + drawerRow('Balance on the day', money0(balanceOf(v)));

    const clauses = [
      { label: 'Cancellation window', value: (c && (c.cancelBy || c.cancellation)) || v.cancelBy || v.cancellation || '' },
      { label: 'Date release after miss', value: v.dateRelease || (c && c.dateRelease) || '' },
      { label: 'Amplified music curfew', value: v.curfew || (c && c.curfew) || '' },
      { label: 'Own-caterer surcharge', value: v.surcharge || (c && c.surcharge) || '' }
    ].filter(x => x.value);
    html += drawerSection('Clauses that bite');
    if (clauses.length) {
      html += clauses.map(x => drawerRow(x.label, typeof x.value === 'number' || /^[\d$]/.test(String(x.value)) ? String(x.value) : (String(x.value).match(/^\d{4}-/) ? shortDate(x.value, true) : String(x.value)))).join('');
    } else {
      html += `<div class="rd-drawer-note">The clauses that decide what happens when something goes wrong — edit them on the linked contract.</div>`;
    }
    html += drawerSection('Documents · ' + onFile + ' of ' + Math.max(docs.length, onFile));
    if (docs.length) {
      html += docs.map(d => drawerRow(d.name, d.status || 'On file', { missing: /missing/i.test(d.status || '') })).join('');
    } else {
      html += `<div class="rd-drawer-note">No documents attached yet.</div>`;
    }
    return html;
  }

  function drawerScheduleTab(v) {
    const blocks = vendorScheduleBlocks(v);
    let html = drawerSection('On the day');
    if (blocks.length) {
      html += blocks.map(b => {
        const left = (b.time ? String(b.time) : '—') + ' · ' + (b.label || b.event || 'Block');
        return drawerRow(left, b.duration || b.len || '—');
      }).join('');
    } else {
      html += `<div class="rd-drawer-note">When they are on site, and the run-sheet blocks that belong to them. This is what the vendor sees in their portal.</div>`;
    }
    if (v.turnaroundNote || blocks.some(b => /turnaround/i.test(String(b.label || '')))) {
      html += `<div class="rd-vnd-callout">${esc(v.turnaroundNote || 'The tightest block on the day is flagged on the Wedding Day Timeline when Catering and Entertainment both need the room.')}</div>`;
    }
    html += drawerSection('Site visits')
      + drawerRow('Site visits so far', String(v.siteVisits != null ? v.siteVisits : (blocks.length ? '—' : '0')))
      + drawerRow('Next visit', v.nextVisit ? shortDate(v.nextVisit, true) + (v.nextVisitTime ? ' · ' + v.nextVisitTime : '') : '—')
      + drawerRow('Shared with vendor', v.sharedSchedule === false ? 'No' : 'Yes');
    return html;
  }

  function drawerContactsTab(v) {
    const people = vendorContactPeople(v);
    const primary = people.find(p => p.primary) || people[0];
    const others = people.filter(p => p !== primary);
    let html = drawerSection('Day-of contact');
    if (primary) {
      html += drawerField('Name', drawerInput('contact', primary.name || ''))
        + drawerField('Role', drawerInput('contactRole', primary.role || ''))
        + drawerField('Mobile', drawerInput('phone', primary.phone || ''))
        + drawerField('Reachable', drawerInput('reachable', primary.hours || v.reachable || ''));
    } else {
      html += drawerField('Name', drawerInput('contact', ''))
        + drawerField('Role', drawerInput('contactRole', ''))
        + drawerField('Mobile', drawerInput('phone', ''))
        + drawerField('Reachable', drawerInput('reachable', ''));
    }
    html += drawerSection('Other contacts · ' + others.length);
    if (others.length) {
      html += others.map(p => {
        const bit = [p.role, p.hours, p.email].filter(Boolean).join(' · ') || (p.phone || '—');
        return drawerRow(p.name || 'Contact', bit);
      }).join('');
    } else {
      html += `<div class="rd-drawer-note">A business is not a contact — the person who answers on a Saturday is.</div>`;
    }
    if (!String((primary && primary.phone) || v.phone || '').trim()) {
      html += `<div class="rd-vnd-callout">No day-of number on file. If nobody answers there is no escalation — worth asking for one before the week of.</div>`;
    }
    html += drawerSection('On the printed sheet')
      + drawerRow('Day-of contacts sheet', isDayOf(v) && String(v.phone || '').trim() ? 'Included' : 'Not included')
      + drawerRow('Emergency card', v.emergencyCard === false ? 'Off' : 'Included')
      + drawerRow('Portal shows', v.portalShows || 'Schedule only');
    return html;
  }

  function drawerHistoryTab(v) {
    const events = [];
    if (typeof recordHistoryFor === 'function') {
      const log = recordHistoryFor('vendors', vid(v) || v._id) || [];
      log.forEach(e => events.push({
        what: e.label || e.what || e.summary || e.action || 'Updated',
        who: e.who || e.by || e.actor || 'System',
        when: e.when || e.date || '',
        time: e.time || '',
        derived: !!e.derived
      }));
    }
    if (Array.isArray(v.history)) {
      v.history.forEach(e => events.push({
        what: e.label || e.what || e.summary || 'Updated',
        who: e.who || e.by || 'System',
        when: e.when || e.date || '',
        time: e.time || '',
        derived: !!e.derived
      }));
    }
    if (!events.length) {
      if (isBooked(v)) events.push({ what: 'Status → Booked', who: 'System', when: v.bookedOn || v.date || '', time: '' });
      if (hasContract(v)) events.push({ what: 'Contract on file', who: 'System', when: v.contractDate || '', time: '' });
      if (v.quote) events.push({ what: 'Quote ' + money0(v.quote), who: 'System', when: '', time: '' });
      if (v.portal) events.push({ what: 'Portal access granted', who: 'System', when: '', time: '' });
    }
    events.sort((a, b) => String(b.when || '').localeCompare(String(a.when || '')));
    return drawerSection('Activity')
      + (events.length
        ? events.map(e => {
          const when = [e.who, e.when ? shortDate(e.when) : '', e.time].filter(Boolean).join(' · ');
          return `<div class="rd-vnd-histrow"><span>${e.derived ? '→ ' : ''}${esc(e.what)}</span><span class="rd-vnd-muted">${esc(when || '—')}</span></div>`;
        }).join('')
        : '<div class="rd-vnd-empty">No dated activity on this vendor yet.</div>')
      + `<div class="rd-drawer-note">Booking, price changes, document chases — the record you read when a vendor says “that was always the price”.</div>`;
  }

  function drawerFootHtml(tabIdx, v, id) {
    const idx = vendorRows().indexOf(v);
    if (tabIdx === 0) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVndFullEditor(${idx >= 0 ? idx : 'null'})">Open full editor</button>
        <button type="button" class="rd-btn" onclick="rdVndMessageVendor('${esc(id)}')">Message vendor</button>`;
    }
    if (tabIdx === 1) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVndOpenContract('${esc(id)}')">Open contract</button>
        <button type="button" class="rd-btn" onclick="rdVndRequestDocs('${esc(id)}')">Request documents</button>`;
    }
    if (tabIdx === 2) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVndDrawerSave()">Save</button>
        <button type="button" class="rd-btn" onclick="typeof showPanel==='function'&&showPanel('timeline')">Open day timeline</button>`;
    }
    if (tabIdx === 3) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVndDrawerSave()">Save</button>
        <button type="button" class="rd-btn" onclick="rdVndAddContact('${esc(id)}')">Add a contact</button>`;
    }
    return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVndCloseDrawer()">Close</button>
      <button type="button" class="rd-btn" onclick="rdVndExportRecord('${esc(id)}')">Export record</button>`;
  }

  function renderVendorsDrawer() {
    const slot = document.getElementById('vendors-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._vndDrawerId;
    const v = id ? findVendorById(id) : null;
    if (!v) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    slot.classList.add('is-open');
    const tabIdx = Math.min(Math.max(0, window._vndDrawerTab | 0), VND_DRAWER_TABS.length - 1);
    const docs = vendorDocs(v);
    const missingN = docs.filter(d => /missing/i.test(d.status || '')).length;
    const pills = [statusPillHtml(v)];
    const total = parseFloat(v.quote) || 0;
    if (total) pills.push(`<span class="status-pill" data-pillscheme="blue">${money0(total)}</span>`);
    if (missingN) pills.push(`<span class="status-pill" data-pillscheme="gold">${missingN} doc${missingN === 1 ? '' : 's'} outstanding</span>`);

    let body;
    if (tabIdx === 0) body = drawerVendorTab(v, id);
    else if (tabIdx === 1) body = drawerContractTab(v);
    else if (tabIdx === 2) body = drawerScheduleTab(v);
    else if (tabIdx === 3) body = drawerContactsTab(v);
    else body = drawerHistoryTab(v);

    const eyebrow = 'Vendor · ' + (isBooked(v) ? 'booked' : String(v.cat || 'vendor').toLowerCase());

    slot.innerHTML = `<aside class="rd-drawer rd-vnd-drawer" aria-label="Vendor record">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrowrow">
          <span class="rd-drawer__eyebrow">${esc(eyebrow)}</span>
          <button type="button" class="rd-drawer__close" onclick="rdVndCloseDrawer()" aria-label="Close">×</button>
        </div>
        <h2 class="rd-drawer__title">${esc(v.name || 'Untitled')}</h2>
        <div class="rd-drawer__pills rd-drawer__chips">${pills.join('')}</div>
        <div class="rd-drawer__tabs is-guest-tabs">${VND_DRAWER_TABS.map((t, i) =>
      `<button type="button" class="rd-drawer__tab${i === tabIdx ? ' is-active' : ''}" onclick="rdVndDrawerTab(${i})">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="rd-drawer__body rd-drawer-fields">${body}</div>
      <div class="rd-drawer__foot">${drawerFootHtml(tabIdx, v, id)}</div>
    </aside>`;
  }

  /* ── interactions ────────────────────────────────────────────────────── */

  function applyViewMode() {
    const mode = window._vndMode || 'table';
    ['table', 'compare', 'contacts'].forEach(m => {
      const el = document.getElementById('vnd-view-' + m);
      if (el) el.hidden = m !== mode;
    });
  }

  function rdSetVendorsView(mode) {
    window._vndMode = (mode === 'compare' || mode === 'contacts') ? mode : 'table';
    renderVendorsRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('vendors');
  }

  function applyVendorsRailView(view) {
    window._vndRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('vendors', window._vndRailView);
    if (view === 'shortlist' && window._vndMode === 'table') {
      /* stay on table — shortlist is a rail filter, Compare is the view */
    }
    renderVendorsRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('vendors');
  }

  function rdVndOpenFilter(field, btn) {
    const rows = vendorRows();
    let opts = [{ value: 'all', label: 'All' }];
    if (field === 'category') {
      opts = opts.concat(Array.from(new Set(rows.map(v => String(v.cat || '').trim()).filter(Boolean))).sort()
        .map(n => ({ value: n, label: n })));
    } else if (field === 'status') {
      opts = opts.concat(Array.from(new Set(rows.map(statusLabel))).sort().map(n => ({ value: n, label: n })));
    } else if (field === 'dayof') {
      opts = opts.concat([
        { value: 'day', label: 'On the day' },
        { value: 'pre', label: 'Pre-day only' }
      ]);
    }
    const apply = val => { window._vndUiFilters[field] = val || 'all'; renderVendorsRd(); };
    if (typeof rdOpenPicker === 'function') rdOpenPicker(btn, opts, window._vndUiFilters[field] || 'all', apply);
    else apply(opts[1] ? opts[1].value : 'all');
  }
  function rdVndClearFilter(field) { window._vndUiFilters[field] = 'all'; renderVendorsRd(); }
  function rdVndOpenSort(btn) {
    const opts = [
      { value: 'quote', label: 'Sort by quote' },
      { value: 'name', label: 'Sort by name' },
      { value: 'category', label: 'Sort by category' },
      { value: 'status', label: 'Sort by status' }
    ];
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._vndSort || 'quote', val => { window._vndSort = val || 'quote'; renderVendorsRd(); });
    }
  }
  function rdVndOpenColumns(btn) {
    if (window.rdColumns && window.rdColumns.openChooser) window.rdColumns.openChooser(btn, VND_COL_SCOPE);
    else if (typeof rdOpenColumns === 'function') rdOpenColumns(btn, VND_COL_SCOPE);
  }
  function rdVndAutoFitColumns(btn) {
    if (typeof rdAutoFitTable === 'function') rdAutoFitTable(document.getElementById('vendors-4c-table'), btn);
    else if (typeof autoFitColumns === 'function') autoFitColumns(btn);
  }
  function rdVndCycleRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const i = order.indexOf(window._vndRowHeight || 'compact');
    window._vndRowHeight = order[(i < 0 ? 0 : i + 1) % order.length];
    renderVendorsRd();
  }
  function rdVndToggleSel(id, on) {
    if (on) window._vndSel.add(id); else window._vndSel.delete(id);
    renderVendorsBulkBar();
  }
  function rdVndBulkClear() { window._vndSel.clear(); renderVendorsRd(); }
  function rdVndBulkStatus() {
    const next = window.prompt('Set status to:', 'Booked');
    if (!next) return;
    vendorRows().forEach(v => { if (window._vndSel.has(vid(v))) v.status = next; });
    if (typeof save === 'function') save();
    renderVendorsRd();
  }
  function rdVndBulkRequestQuote() { applyVendorsRailView('nocontract'); }
  function rdVndTogglePassed() { window._vndShowPassed = !window._vndShowPassed; renderVendorsRd(); }
  function rdVndSetCompareCat(cat) { window._vndCompareCat = cat; renderVendorsRd(); }
  function vendorIndexById(id) {
    const rows = vendorRows();
    const byId = rows.findIndex(v => vid(v) === String(id) || String(v && v._id) === String(id));
    if (byId >= 0) return byId;
    if (/^idx:/.test(String(id || ''))) {
      const n = parseInt(String(id).slice(4), 10);
      return Number.isFinite(n) ? n : -1;
    }
    return -1;
  }
  function rdVndOpenDrawer(id) {
    window._vndDrawerId = id;
    window._vndDrawerTab = 0;
    const shared = document.getElementById('record-drawer');
    if (shared && !shared.hasAttribute('hidden') && typeof rdCloseDrawer === 'function') {
      try { rdCloseDrawer(); } catch (e) { /* soft */ }
    }
    renderVendorsDrawer();
  }
  function rdVndDrawerTab(i) {
    window._vndDrawerTab = i | 0;
    renderVendorsDrawer();
  }
  function rdVndDrawerSave() {
    const v = window._vndDrawerId ? findVendorById(window._vndDrawerId) : null;
    const slot = document.getElementById('vendors-drawer-slot');
    if (!v || !slot) return;
    const read = key => {
      const el = slot.querySelector('[data-vndf="' + key + '"]');
      return el ? el.value : null;
    };
    ['cat', 'service', 'capacity', 'status', 'contact', 'contactRole', 'phone', 'reachable'].forEach(k => {
      const val = read(k);
      if (val == null) return;
      if (k === 'cat') v.cat = val;
      else if (k === 'service') v.service = val;
      else if (k === 'capacity') v.capacity = val;
      else if (k === 'status') v.status = val;
      else if (k === 'contact') v.contact = val;
      else if (k === 'contactRole') v.contactRole = val;
      else if (k === 'phone') v.phone = val;
      else if (k === 'reachable') v.reachable = val;
    });
    const bookedOn = read('bookedOn');
    if (bookedOn != null) v.bookedOn = bookedOn;
    const quote = read('quote');
    if (quote != null && quote !== '') v.quote = parseFloat(String(quote).replace(/[^0-9.]/g, '')) || 0;
    if (typeof save === 'function') save();
    renderVendorsRd();
    if (typeof toast === 'function') toast('Vendor saved');
    else if (typeof showToast === 'function') showToast('Vendor saved');
  }
  function rdVndMessageVendor(id) {
    const v = findVendorById(id);
    if (typeof toast === 'function') toast(v && v.email ? ('Message drafted to ' + v.email) : 'Open the vendor portal or email from the full editor');
    else if (typeof showToast === 'function') showToast('Message vendor from the portal');
  }
  function rdVndOpenContract(id) {
    const v = findVendorById(id);
    const c = linkedContract(v);
    if (typeof showPanel === 'function') showPanel('contracts');
    if (c && typeof window.rdConOpenDrawer === 'function') {
      setTimeout(() => window.rdConOpenDrawer(String(c._id || c.id || '')), 80);
    } else if (typeof toast === 'function') toast(hasContract(v) ? 'Opened Contracts' : 'No contract linked yet — add one on Contracts');
  }
  function rdVndRequestDocs(id) {
    window._vndDrawerTab = 1;
    renderVendorsDrawer();
    if (typeof toast === 'function') toast('Document request flagged for ' + ((findVendorById(id) || {}).name || 'vendor'));
  }
  function rdVndAddContact(id) {
    const v = findVendorById(id);
    if (!v) return;
    if (!Array.isArray(v.otherContacts)) v.otherContacts = [];
    v.otherContacts.push({ name: 'New contact', role: '', phone: '', email: '', hours: '' });
    if (typeof save === 'function') save();
    window._vndDrawerTab = 3;
    renderVendorsDrawer();
  }
  function rdVndExportRecord(id) {
    const v = findVendorById(id);
    if (!v) return;
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Vendor', [{
        Vendor: v.name, Category: v.cat, Quote: v.quote, Balance: balanceOf(v), Status: statusLabel(v), Contract: contractLabel(v)
      }]);
    } else if (typeof toast === 'function') toast('Exported ' + (v.name || 'vendor'));
  }
  function rdVndCloseDrawer() {
    window._vndDrawerId = null;
    const shared = document.getElementById('record-drawer');
    if (shared && typeof rdCloseDrawer === 'function' && !shared.hasAttribute('hidden')) {
      try { rdCloseDrawer(); } catch (e) { /* soft */ }
    }
    renderVendorsDrawer();
  }
  function rdVndBookVendor(id) {
    const v = findVendorById(id);
    if (!v) return;
    v.status = 'Booked';
    if (typeof save === 'function') save();
    renderVendorsRd();
  }
  function rdVndSetAttrQuiet(id, fieldId, value) {
    const v = findVendorById(id);
    if (!v || !fieldId) return;
    if (typeof vendorAttrSet === 'function') vendorAttrSet(v, fieldId, value);
    else {
      if (!v.attrs || typeof v.attrs !== 'object' || Array.isArray(v.attrs)) v.attrs = {};
      v.attrs[fieldId] = value;
    }
  }
  function rdVndSetAttr(id, fieldId, value) {
    rdVndSetAttrQuiet(id, fieldId, value);
    if (typeof save === 'function') save();
    if (window._vndMode === 'compare') renderVendorsCompareView();
  }
  function rdVndFullEditor(index) {
    let idx = (typeof index === 'number' && index >= 0) ? index : -1;
    if (idx < 0 && window._vndDrawerId) idx = vendorIndexById(window._vndDrawerId);
    if (idx < 0 && window._vndSel && window._vndSel.size) {
      const first = window._vndSel.values().next().value;
      idx = vendorIndexById(first);
    }
    if (typeof openRecordEditor === 'function') {
      if (idx >= 0) openRecordEditor('vendors', idx);
      else openRecordEditor('vendors');
      return;
    }
    if (typeof openDataHub === 'function') openDataHub('vendors', 'vendors');
    else if (typeof addVendorRow === 'function') addVendorRow();
  }
  function rdVndAddCompareColumn() {
    const cat = window._vndCompareCat;
    if (!cat) { addVendorRow(); return; }
    if (typeof openRecordEditor === 'function') {
      openRecordEditor('vendors', null, { cat: cat, status: 'Shortlisted', attrs: {} });
      return;
    }
    addVendorRow();
  }
  function rdVndPrintContactSheet() {
    rdSetVendorsView('contacts');
    if (typeof printCurrentPage === 'function') printCurrentPage();
  }
  function rdVndExportVCards() {
    const list = vendorRows().filter(v => String(v.phone || v.email || '').trim());
    if (!list.length) {
      if (typeof showToast === 'function') showToast('No vendor phone or email to export');
      return;
    }
    const cards = list.map(v => {
      const lines = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'FN:' + String(v.name || 'Vendor').replace(/\n/g, ' '),
        'ORG:' + String(v.cat || 'Wedding vendor').replace(/\n/g, ' ')
      ];
      if (v.contact) lines.push('N:;' + String(v.contact).replace(/\n/g, ' ') + ';;;');
      if (v.phone) lines.push('TEL;TYPE=CELL:' + String(v.phone).replace(/\n/g, ' '));
      if (v.email) lines.push('EMAIL:' + String(v.email).replace(/\n/g, ' '));
      lines.push('END:VCARD');
      return lines.join('\r\n');
    }).join('\r\n');
    const blob = new Blob([cards], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vendor-contacts.vcf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function rdVndVendorPacket() {
    if (typeof showPanel === 'function') showPanel('packets');
  }
  function openVendorCompare() { rdSetVendorsView('compare'); }

  /* Coverage meters for Compare rail (Views 30f). */
  function vendorCoverageMeters() {
    const order = ['Venue', 'Catering', 'Photography', 'Florals', 'Music', 'Officiant', 'Cake'];
    const byKey = {};
    vendorRows().forEach(v => {
      const schema = typeof vendorCategorySchemaFromLabel === 'function'
        ? vendorCategorySchemaFromLabel(v.cat) : null;
      const label = schema ? schema.label : (String(v.cat || '').trim() || 'Other');
      const short = label.split(/[&/]/)[0].trim();
      const key = short || label;
      if (!byKey[key]) byKey[key] = { label: key, rows: [] };
      byKey[key].rows.push(v);
    });
    const keys = Object.keys(byKey).sort((a, b) => {
      const ia = order.findIndex(o => a.toLowerCase().includes(o.toLowerCase()));
      const ib = order.findIndex(o => b.toLowerCase().includes(o.toLowerCase()));
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return keys.map(k => {
      const rows = byKey[k].rows;
      const booked = rows.some(isBooked);
      const short = rows.filter(v => isShortlisted(v) && !isBooked(v));
      let status = 'Not started';
      if (booked) status = 'Booked';
      else if (short.length >= 2) status = 'Deciding';
      else if (rows.some(v => /deposit/i.test(String(v.status || '')))) status = 'Deposit sent';
      else if (short.length) status = 'Shortlisted';
      return { label: byKey[k].label, status: status };
    });
  }

  /* Prefer 4c drawer / record editor over the removed inline editor. */
  const _addVendorRow = window.addVendorRow;
  window.addVendorRow = function () {
    if (document.body.getAttribute('data-active-panel') === 'vendors'
      && document.getElementById('vendors-4c-table')) {
      if (typeof openRecordEditor === 'function') {
        openRecordEditor('vendors');
        return;
      }
    }
    if (typeof _addVendorRow === 'function') return _addVendorRow.apply(this, arguments);
  };

  /* Keep legacy tab helpers from breaking callers — map to views */
  function vndTabBridge(name) {
    if (name === 'shortlist') rdSetVendorsView('compare');
    else rdSetVendorsView('table');
  }

  /* ── main render ─────────────────────────────────────────────────────── */

  function renderVendorsRd() {
    uedVendorShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('vendors');
    applyViewMode();
    renderVendorStatsRd();
    renderVendorsToolbar();
    renderVendorsBulkBar();

    const mode = window._vndMode || 'table';
    if (mode === 'compare') renderVendorsCompareView();
    else if (mode === 'contacts') renderVendorsContactsView();
    else renderVendorsTable();
    renderVendorsDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'vendors'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('vendors');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('vendors');
  }

  window.uedVendorShell = uedVendorShellRd;
  window.renderVendors = renderVendorsRd;
  window.renderVendorStats = renderVendorStatsRd;
  window.openVendorCompare = openVendorCompare;
  window.rdSetVendorsView = rdSetVendorsView;
  window.applyVendorsRailView = applyVendorsRailView;
  window.vendorRailCounts = vendorRailCounts;
  window.vendorFigures = vendorFigures;
  window.vndTab = vndTabBridge;
  window.rdVndOpenFilter = rdVndOpenFilter;
  window.rdVndClearFilter = rdVndClearFilter;
  window.rdVndOpenSort = rdVndOpenSort;
  window.rdVndOpenColumns = rdVndOpenColumns;
  window.rdVndAutoFitColumns = rdVndAutoFitColumns;
  window.rdVndCycleRowHeight = rdVndCycleRowHeight;
  window.rdVndToggleSel = rdVndToggleSel;
  window.rdVndBulkClear = rdVndBulkClear;
  window.rdVndBulkStatus = rdVndBulkStatus;
  window.rdVndBulkRequestQuote = rdVndBulkRequestQuote;
  window.rdVndTogglePassed = rdVndTogglePassed;
  window.rdVndSetCompareCat = rdVndSetCompareCat;
  window.rdVndOpenDrawer = rdVndOpenDrawer;
  window.rdVndCloseDrawer = rdVndCloseDrawer;
  window.rdVndDrawerTab = rdVndDrawerTab;
  window.rdVndDrawerSave = rdVndDrawerSave;
  window.rdVndMessageVendor = rdVndMessageVendor;
  window.rdVndOpenContract = rdVndOpenContract;
  window.rdVndRequestDocs = rdVndRequestDocs;
  window.rdVndAddContact = rdVndAddContact;
  window.rdVndExportRecord = rdVndExportRecord;
  window.rdVndBookVendor = rdVndBookVendor;
  window.rdVndSetAttr = rdVndSetAttr;
  window.rdVndSetAttrQuiet = rdVndSetAttrQuiet;
  window.rdVndFullEditor = rdVndFullEditor;
  window.rdVndAddCompareColumn = rdVndAddCompareColumn;
  window.rdVndPrintContactSheet = rdVndPrintContactSheet;
  window.rdVndExportVCards = rdVndExportVCards;
  window.rdVndVendorPacket = rdVndVendorPacket;
  window.vendorCoverageMeters = vendorCoverageMeters;
  window.saveVendorView = function () {
    if (typeof RdFurniture !== 'undefined' && RdFurniture.saveView) RdFurniture.saveView('vendors');
  };

  function hookVendorsPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.vendors = function () { renderVendorsRd(); };
    }
  }
  hookVendorsPanelRenderer();
  var _showPanelVendors = window.showPanel;
  if (typeof _showPanelVendors === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelVendors.call(window, id, forceOpen);
      hookVendorsPanelRenderer();
      return out;
    };
  }
})();
