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
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdVndVendorPacket()">Vendor packet</button>
      <button type="button" class="rd-btn" onclick="typeof exportVendorCSV==='function'?exportVendorCSV():exportSectionCSV('Vendors',data.vendors)">Export</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdVndFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="addVendorRow()">+ New vendor</button>`;
  }

  function uedVendorShellRd() {
    const panel = document.getElementById('panel-vendors');
    if (!panel) return;
    panel.classList.add('ued-scope', 'vendors-mockup');
    if (panel.dataset.uedShell === 'vendors-rd4c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
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
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Vendors', value: String(f.count), filter: 'Show all' },
          { label: 'On the day', value: String(day), filter: 'Day-of' },
          { label: 'Confirmed times', value: '—', filter: 'Contacts' },
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
    return `<tr class="rd-vnd-row${sel ? ' is-selected' : ''}" data-id="${esc(id)}" onclick="rdVndOpenDrawer('${esc(id)}')">` +
      cols.map(c => {
        if (c.key === 'tick') {
          return `<td class="rd-vnd-tick" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdVndToggleSel('${esc(id)}',this.checked)" aria-label="Select vendor"></td>`;
        }
        if (c.key === 'name') {
          return `<td class="rd-vnd-name"><div class="rd-vnd-name__primary">${esc(v.name || 'Untitled vendor')}</div>${sub ? `<div class="rd-vnd-name__sub">${esc(sub)}</div>` : ''}</td>`;
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

  /* Category schema fields (VENDOR_CATEGORY_SCHEMAS) — same compare rows as legacy shortlist. */
  function compareSchemaFields(cat) {
    const schema = typeof vendorCategorySchemaFromLabel === 'function'
      ? vendorCategorySchemaFromLabel(cat)
      : null;
    if (!schema || !Array.isArray(schema.fields)) return [];
    return schema.fields.filter(f => f && f.compare !== false);
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

    const schemaNote = schemaFields.length
      ? ` · ${schemaFields.length} ${esc(cat)} qualities from the category schema`
      : '';

    host.innerHTML = `
      <div class="rd-section__head">
        <div class="rd-pagehead__eyebrow">${esc(cat)} shortlist</div>
        <p class="rd-help">Four quotes side by side · ✓ included · ○ partial · ● extra cost · — not offered${schemaNote}.</p>
      </div>
      <div class="rd-vnd-cmp-cats">${catOpts}</div>
      <div class="rd-table-wrap"><table class="rd-vnd-cmp-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="rd-help">Category rows come from each vendor&rsquo;s attrs for this category (Coverage hrs, Capacity, Trial, etc.). Better values are shaded. Quote is the vendor&rsquo;s budget-line value. Edit qualities in the drawer or Full editor.</p>`;
  }

  /* ── Contacts view (30g) ─────────────────────────────────────────────── */

  function renderVendorsContactsView() {
    const host = document.getElementById('vendors-contacts-view');
    if (!host) return;
    const list = vendorRows().filter(matchesFilters);
    const day = list.filter(v => isDayOf(v) && String(v.phone || '').trim());
    const pre = list.filter(v => !isDayOf(v) && String(v.phone || '').trim());
    const none = list.filter(v => !String(v.phone || '').trim());

    function card(v) {
      const id = vid(v);
      return `<article class="rd-vnd-contact${ !String(v.phone || '').trim() ? ' is-danger' : ''}" onclick="rdVndOpenDrawer('${esc(id)}')">
        <div class="rd-vnd-contact__name">${esc(v.name || 'Untitled')}</div>
        <div class="rd-vnd-contact__meta">${esc(v.contact || '—')} · ${esc(v.cat || 'Vendor')}</div>
        <div class="rd-vnd-contact__phone">${esc(v.phone || 'No number on file')}</div>
        <div class="rd-vnd-contact__meta">${esc(v.email || '')}${hasContract(v) ? '' : ' · Unsigned paper'}</div>
      </article>`;
    }

    function section(title, rows, danger) {
      if (!rows.length) return '';
      return `<div class="rd-grouplist__group${danger ? ' is-danger' : ''}">
        <div class="rd-grouplist__head">${esc(title)} · ${rows.length}${danger ? '' : ' vendors'}</div>
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
      section('Day-of critical', day, false) +
      section('Pre-day only', pre, false) +
      section('No number on file', none, true);
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

  function renderVendorsDrawer() {
    const slot = document.getElementById('vendors-drawer-slot');
    if (!slot) return;
    const id = window._vndDrawerId;
    const v = id ? findVendorById(id) : null;
    if (!v) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    slot.classList.add('is-open');
    const st = statusLabel(v);
    const overdue = /shortlist/i.test(st) && !isBooked(v);
    slot.innerHTML = `<aside class="rd-drawer rd-vnd-drawer" aria-label="Vendor record">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrow">Vendor · ${esc(String(v.cat || 'vendor').toLowerCase())}</div>
        <h2 class="rd-drawer__title">${esc(v.name || 'Untitled')}</h2>
        <div class="rd-drawer__chips">
          ${statusPillHtml(v)}
          ${overdue ? '<span class="status-pill" data-pillscheme="red">Decision overdue</span>' : ''}
        </div>
        <button type="button" class="rd-drawer__close" onclick="rdVndCloseDrawer()" aria-label="Close">×</button>
      </div>
      <div class="rd-drawer__body">
        <div class="rd-drawer__field"><span>Contact</span><strong>${esc(v.contact || '—')}</strong></div>
        <div class="rd-drawer__field"><span>Quote</span><strong>${moneyOrDash(v.quote)}</strong></div>
        <div class="rd-drawer__field"><span>Deposit</span><strong>${moneyOrDash(v.deposit)}</strong></div>
        <div class="rd-drawer__field"><span>Balance</span><strong class="${balanceOf(v) > 0 ? 'is-owing' : ''}">${moneyOrDash(balanceOf(v))}</strong></div>
        <div class="rd-drawer__field"><span>Rating</span><strong>${ratingSquares(ratingOf(v))}</strong></div>
        <div class="rd-drawer__field"><span>Contract</span><strong>${esc(contractLabel(v))}</strong></div>
        ${drawerSchemaFieldsHtml(v, id)}
        <div class="rd-drawer__section"><div class="rd-drawer__section-title">Pros</div><p>${esc(v.pros || 'Add what works about this vendor.')}</p></div>
        <div class="rd-drawer__section"><div class="rd-drawer__section-title">Cons</div><p>${esc(v.cons || 'Add what gives you pause.')}</p></div>
        <div class="rd-drawer__section"><div class="rd-drawer__section-title">Notes</div><p>${esc(v.notes || '—')}</p></div>
      </div>
      <div class="rd-drawer__foot">
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdVndBookVendor('${esc(id)}')">Book vendor</button>
        <button type="button" class="rd-btn" onclick="rdSetVendorsView('compare')">Compare</button>
      </div>
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
  function rdVndOpenDrawer(id) {
    window._vndDrawerId = id;
    if (typeof rdOpenDrawer === 'function') {
      try { rdOpenDrawer('vendors', id); } catch (e) { /* fall through */ }
    }
    renderVendorsDrawer();
  }
  function rdVndCloseDrawer() { window._vndDrawerId = null; renderVendorsDrawer(); }
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
  function rdVndFullEditor() {
    if (typeof openDataHub === 'function') openDataHub('vendors', 'vendors');
    else if (typeof addVendorRow === 'function') addVendorRow();
  }
  function rdVndVendorPacket() {
    if (typeof showPanel === 'function') showPanel('packets');
  }
  function openVendorCompare() { rdSetVendorsView('compare'); }

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
  window.rdVndBookVendor = rdVndBookVendor;
  window.rdVndSetAttr = rdVndSetAttr;
  window.rdVndSetAttrQuiet = rdVndSetAttrQuiet;
  window.rdVndFullEditor = rdVndFullEditor;
  window.rdVndVendorPacket = rdVndVendorPacket;
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
