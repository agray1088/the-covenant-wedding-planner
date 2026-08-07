/* Venue & Vendors — redesign shell (Phase 2 · mock shells vendors / tracker / shortlist).
   Tracker = record surface; Shortlist & Compare = decision surface.
   Views: Table · Cards on Tracker; Side by side · Scorecard · Cost only on Shortlist.
   Rail residual: No quote (warn). Binding: booked vendor creates Budget line + Contract. */
(function () {
  'use strict';

  window._vndTab = (typeof window._vndTab === 'string' && window._vndTab) || 'tracker';
  window._vndMode = window._vndMode || 'table';
  window._vndRailView = window._vndRailView || 'all';
  window._vndRailGroupBy = window._vndRailGroupBy || 'category';
  window._vndUiFilters = window._vndUiFilters || { category: 'all', status: 'all', quote: 'all' };
  window._vndRowHeight = window._vndRowHeight || 'compact';
  window._vndSel = window._vndSel || new Set();
  window._vndCompareStyle = window._vndCompareStyle || null;

  const VND_COL_SCOPE = 'vendors-rd';
  const VND_COLUMNS = [
    { key: 'name', label: 'Vendor', width: '160px' },
    { key: 'cat', label: 'Category', width: '120px' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'quote', label: 'Quote', width: '90px', num: true },
    { key: 'deposit', label: 'Deposit', width: '90px', num: true },
    { key: 'balance', label: 'Balance', width: '90px', num: true },
    { key: 'contract', label: 'Contract', width: '88px' },
    { key: 'contact', label: 'Contact', width: '120px' },
    { key: 'phone', label: 'Phone', width: '110px' },
    { key: 'email', label: 'Email', width: '150px' },
    { key: 'rating', label: 'Rating', width: '80px' },
    { key: 'notes', label: 'Notes', width: '140px' }
  ];
  const VND_DEFAULT_VISIBLE = ['name', 'cat', 'status', 'quote', 'deposit', 'balance', 'contract', 'contact'];

  if (window.rdColumns) {
    window.rdColumns.register(VND_COL_SCOPE,
      VND_COLUMNS.map(c => ({
        key: c.key, label: c.label, width: c.width,
        num: !!c.num, cls: c.num ? 'rd-vnd-th--num' : ''
      })),
      () => { if (typeof renderVendors === 'function') renderVendors(); }
    );
    /* Prefer the mock's 8-of-12 default when the chooser has no hidden set yet. */
    try {
      const hid = window.rdColumns.hidden(VND_COL_SCOPE);
      if (hid && hid.size === 0) {
        VND_COLUMNS.forEach(c => {
          if (VND_DEFAULT_VISIBLE.indexOf(c.key) < 0) hid.add(c.key);
        });
      }
    } catch (e) { /* private mode */ }
  }

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));
  function money0(n) {
    const v = Math.round(parseFloat(n) || 0);
    if (typeof fmt === 'function') return fmt(v);
    return '$' + v.toLocaleString();
  }
  function vendorRows() {
    return typeof safeArray === 'function' ? safeArray(data.vendors) : (data.vendors || []);
  }
  function isBooked(v) {
    return (typeof vendorBookedStatus === 'function' && vendorBookedStatus(v && v.status)) || !!(v && v.contract);
  }
  function hasQuote(v) {
    return (parseFloat(v && v.quote) || 0) > 0;
  }
  function isShortlisted(v) {
    if (!v) return false;
    if (v.shortlisted || v.onShortlist) return true;
    const st = String(v.status || '');
    return /consider|quote|contact|research|meeting|tasting/i.test(st) && !isBooked(v);
  }
  function isPaidInFull(v) {
    if (!v) return false;
    if (String(v.status || '') === 'Paid' || String(v.status || '') === 'Complete') return true;
    const q = parseFloat(v.quote) || 0;
    const bal = parseFloat(v.balance);
    if (q > 0 && Number.isFinite(bal) && bal <= 0) return true;
    const dep = parseFloat(v.deposit) || 0;
    return q > 0 && dep >= q;
  }
  function paidAmount(v) {
    const q = parseFloat(v && v.quote) || 0;
    const d = parseFloat(v && v.deposit) || 0;
    const bal = parseFloat(v && v.balance);
    if (Number.isFinite(bal) && q > 0) return Math.max(0, q - bal);
    return d;
  }
  function statusLabel(v) {
    if (typeof vendorDisplayStatus === 'function') return vendorDisplayStatus(v && v.status);
    return (v && v.status) || 'Researching';
  }

  /* ── figures / rail ──────────────────────────────────────────────────── */

  function vendorFigures() {
    const rows = vendorRows();
    const booked = rows.filter(isBooked);
    const contracted = booked.reduce((s, v) => s + (parseFloat(v.quote) || 0), 0);
    const paid = booked.reduce((s, v) => s + paidAmount(v), 0);
    const outstanding = Math.max(0, contracted - paid);
    const noQuote = rows.filter(v => !hasQuote(v));
    const unquotedValue = noQuote.length; /* count for residual; meter uses placeholder estimate */
    const shortlisted = rows.filter(isShortlisted);
    const paidFull = rows.filter(isPaidInFull);
    return {
      count: rows.length,
      booked: booked.length,
      bookedValue: contracted,
      paid: paid,
      outstanding: outstanding,
      noQuote: noQuote.length,
      shortlisted: shortlisted.length,
      paidFull: paidFull.length,
      unquotedMeter: noQuote.reduce((s, v) => s + Math.max(0, parseFloat(v.estimate) || 0), 0) || (noQuote.length ? 1000 : 0),
      contracted: contracted
    };
  }

  function vendorRailCounts() {
    const f = vendorFigures();
    return {
      all: f.count,
      booked: f.booked,
      shortlisted: f.shortlisted,
      noquote: f.noQuote,
      paidfull: f.paidFull
    };
  }

  function vendorMatchesRailView(row, view) {
    view = view || window._vndRailView || 'all';
    if (view === 'all') return true;
    if (view === 'booked') return isBooked(row);
    if (view === 'shortlisted') return isShortlisted(row);
    if (view === 'noquote') return !hasQuote(row);
    if (view === 'paidfull') return isPaidInFull(row);
    return true;
  }

  function vendorMatchesFilters(row) {
    if (!vendorMatchesRailView(row)) return false;
    const ui = window._vndUiFilters || {};
    if (ui.category && ui.category !== 'all') {
      const cat = String(row.cat || '').trim() || 'Uncategorised';
      if (cat !== ui.category) return false;
    }
    if (ui.status && ui.status !== 'all') {
      if (statusLabel(row) !== ui.status && String(row.status || '') !== ui.status) return false;
    }
    if (ui.quote && ui.quote !== 'all') {
      if (ui.quote === 'quoted' && !hasQuote(row)) return false;
      if (ui.quote === 'unquoted' && hasQuote(row)) return false;
    }
    /* Keep legacy category-tab filter when present */
    if (typeof vendorTrackerCatKey === 'function') {
      const key = vendorTrackerCatKey();
      if (key && key !== 'all') {
        const schema = typeof vendorCategoryByKey === 'function' ? vendorCategoryByKey(key) : null;
        if (schema && typeof vendorCategoryMatches === 'function' && !vendorCategoryMatches(row.cat, schema.label)) return false;
      }
    }
    return true;
  }

  function vendorRowGroupMeta(row) {
    const mode = window._vndRailGroupBy || 'category';
    if (!hasQuote(row) && mode !== 'status') {
      /* Residual failure group always last when grouping by category / next payment */
      if (mode === 'category' || mode === 'nextpay') {
        return { key: '__residual_noquote__', title: 'No quote', sort: 'zzz', residual: true };
      }
    }
    if (mode === 'status') {
      const st = statusLabel(row) || 'No status';
      const residual = st === 'Not Booked' || (!hasQuote(row) && !isBooked(row));
      return {
        key: residual && !hasQuote(row) ? '__residual_noquote__' : ('status:' + st.toLowerCase()),
        title: !hasQuote(row) && !isBooked(row) ? 'No quote' : st,
        sort: residual && !hasQuote(row) ? 'zzz' : st.toLowerCase(),
        residual: !!(residual && !hasQuote(row))
      };
    }
    if (mode === 'nextpay') {
      const bal = parseFloat(row.balance) || 0;
      if (bal <= 0) return { key: 'next:none', title: 'No balance due', sort: 'z2', residual: false };
      return { key: 'next:due', title: 'Balance outstanding', sort: 'a', residual: false };
    }
    const cat = String(row.cat || '').trim() || 'Uncategorised';
    return { key: 'cat:' + cat.toLowerCase(), title: cat, sort: cat.toLowerCase(), residual: false };
  }

  function vendorGroupHeaderLabel(meta, groupRows) {
    const items = (groupRows || []).map(it => (it && it.r != null ? it.r : it));
    const n = items.length;
    const title = (meta && meta.title) || 'Group';
    if (meta && meta.residual) {
      return title + ' · ' + n + ' vendor' + (n === 1 ? '' : 's');
    }
    const value = items.reduce((s, v) => s + (parseFloat(v.quote) || 0), 0);
    return title + ' · ' + n + ' · ' + money0(value);
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    return `<button type="button" class="rd-btn" onclick="openVendorCompare()">Compare shortlist</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" onclick="typeof exportVendorCSV==='function'?exportVendorCSV():exportSectionCSV('Vendors',data.vendors)">Export CSV</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="addVendorRow()">+ Add vendor</button>`;
  }

  function uedVendorShellRd() {
    const panel = document.getElementById('panel-vendors');
    if (!panel) return;
    panel.classList.add('ued-scope', 'vendors-mockup');
    if (panel.dataset.uedShell === 'vendors-rd4c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      syncVendorTabChromeRd();
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
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
      <div class="rd-tabstrip" role="tablist" aria-label="Sections" id="vnd-tabstrip">
        <button type="button" role="tab" class="m-tab" data-tab="tracker" onclick="vndTab('tracker')">Vendor Tracker</button>
        <button type="button" role="tab" class="m-tab" data-tab="shortlist" onclick="vndTab('shortlist')">Shortlist &amp; Compare</button>
        <span class="rd-tabstrip__note">2 sections · record vs decision</span>
      </div>
      <div class="rd-toolbar" id="vendors-toolbar"></div>
      <div class="rd-bulkbar" id="vendors-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div data-vnd-tab="tracker" id="vnd-tracker-pane">
          <div class="rd-view" id="vnd-view-table" data-vnd-view="table">
            <div class="rd-table-wrap ued-table-wrap" id="cwp-vendors"></div>
            <span class="rd-table-foot ued-soft" id="vendors-hub-preview-foot"></span>
          </div>
          <div class="rd-view" id="vnd-view-cards" data-vnd-view="cards" hidden>
            <div class="rd-cardgrid" id="vendor-card-grid"></div>
            <div class="hub-record-card-pager"><span class="ued-soft" id="vendor-card-foot"></span><span id="vendor-card-pager"></span></div>
          </div>
          <div class="rd-section__head">
            <div class="rd-pagehead__eyebrow">Venue arrangements</div>
            <p class="rd-help">Rooms, timings and what the hire includes.</p>
            <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="goVenueTab('details')">Open the contract</button>
          </div>
          <div class="rd-grid-3 venue-arrange-grid" id="venue-arrange-grid"></div>
          <div class="rd-section__head">
            <div class="rd-pagehead__eyebrow">Reminders</div>
            <p class="rd-help">Dates the venue has set that nothing else tracks.</p>
          </div>
          <div class="venue-reminder-list" id="venue-reminder-list"></div>
        </div>
        <div data-vnd-tab="shortlist" id="vnd-shortlist-pane" hidden>
          <div class="rd-section__head">
            <div class="rd-pagehead__eyebrow">Shortlist &amp; compare</div>
            <p class="rd-help">A decision surface, not a record surface — which is why it is its own tab.</p>
            <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="logAdd('vendorCompare',{category:'',a:'',qa:'',b:'',qb:'',c:'',qc:'',decision:''});renderVendorCompare();">Request quotes</button>
          </div>
          <div class="rd-toolbar rd-vnd-compare-styles" id="vnd-compare-stylebar" role="tablist" aria-label="Comparison view style"></div>
          <div class="vcmp-caption" aria-live="polite"></div>
          <div class="rd-table-wrap ued-table-wrap" id="vendor-compare-preview"></div>
        </div>
      </div>
    </div>`;
    syncVendorTabChromeRd();
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function syncVendorTabChromeRd() {
    const tab = window._vndTab || 'tracker';
    const panel = document.getElementById('panel-vendors');
    if (!panel) return;
    panel.dataset.activeTab = tab;
    panel.querySelectorAll('[data-vnd-tab]').forEach(el => {
      const on = el.dataset.vndTab === tab;
      el.hidden = !on;
      el.style.display = on ? '' : 'none';
    });
    panel.querySelectorAll('#vnd-tabstrip .m-tab, .rd-tabstrip .m-tab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function vndTabRd(name) {
    window._vndTab = name === 'shortlist' ? 'shortlist' : 'tracker';
    if (typeof window._vndTab !== 'undefined') {
      try { /* keep planner global in sync */ if (typeof _vndTab !== 'undefined') { /* eslint-disable-line */ } } catch (e) { /* ignore */ }
    }
    /* planner.js still owns `let _vndTab` — mirror via assignment when possible */
    try { if (typeof window !== 'undefined') { /* set via render path */ } } catch (e) { /* ignore */ }
    syncVendorTabChromeRd();
    renderVendorsRd();
  }

  /* Bridge planner's let _vndTab through window when vndTab is called from chrome */
  function installVndTabBridge() {
    window.vndTab = function (name) {
      window._vndTab = name === 'shortlist' ? 'shortlist' : 'tracker';
      try {
        /* Mutate planner module scope via Function if exposed — fall back to window flag */
        if (typeof window.__setVndTab === 'function') window.__setVndTab(window._vndTab);
      } catch (e) { /* ignore */ }
      syncVendorTabChromeRd();
      renderVendorsRd();
    };
  }

  /* ── stats / toolbar / bulk ──────────────────────────────────────────── */

  function renderVendorStatsRd() {
    const host = document.getElementById('vendor-stats');
    if (!host) return;
    const f = vendorFigures();
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Vendors', value: String(f.count), filter: 'Show all', onFilter: () => applyVendorsRailView('all') },
        { label: 'Booked', value: String(f.booked), filter: 'Filter · Booked', onFilter: () => applyVendorsRailView('booked') },
        { label: 'Booked value', value: money0(f.bookedValue), filter: 'Show booked' },
        { label: 'Paid to date', value: money0(f.paid), filter: 'Filter · Paid' },
        {
          label: 'No quote',
          value: String(f.noQuote),
          filter: 'Filter · No quote',
          attention: f.noQuote ? 'Vendors still missing a quote' : undefined,
          onFilter: () => applyVendorsRailView('noquote')
        }
      ]);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = [
      cell('Vendors', String(f.count)),
      cell('Booked', String(f.booked)),
      cell('Booked value', money0(f.bookedValue)),
      cell('Paid to date', money0(f.paid)),
      cell('No quote', String(f.noQuote), f.noQuote ? 'warn' : '')
    ].join('');
  }

  function filterChip(label, field) {
    const ui = window._vndUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const display = field === 'quote'
      ? ({ quoted: 'Quoted', unquoted: 'No quote', all: 'all' }[cur] || cur)
      : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdVndOpenFilter('${field}',this)">${esc(on ? label + ': ' + display : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdVndClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function compareStyleChipsHtml() {
    const style = currentCompareStyle();
    const chips = [
      { id: 'matrix', label: 'Side by side' },
      { id: 'cards', label: 'Scorecard' },
      { id: 'h2h', label: 'Cost only' }
    ];
    return chips.map(c =>
      `<button type="button" class="rd-chip${style === c.id ? ' is-active' : ''}" data-style="${c.id}" onclick="rdVndSetCompareStyle('${c.id}')">${esc(c.label)}</button>`
    ).join('');
  }

  function currentCompareStyle() {
    if (window._vndCompareStyle) return window._vndCompareStyle;
    return (data.setup && data.setup.vendorCompareStyle) || 'matrix';
  }

  function renderVendorsToolbar() {
    const host = document.getElementById('vendors-toolbar');
    if (!host) return;
    const tab = window._vndTab || 'tracker';
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    if (tab === 'shortlist') {
      host.innerHTML =
        filterChip('Category', 'category') +
        filterChip('Quoted', 'quote') +
        `<div class="rd-toolbar__right"></div>`;
      const styleBar = document.getElementById('vnd-compare-stylebar');
      if (styleBar) styleBar.innerHTML = compareStyleChipsHtml();
      return;
    }
    const mode = window._vndMode || 'table';
    const isTable = mode === 'table';
    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(VND_COL_SCOPE) : 'Columns';
    const colAllShown = window.rdColumns ? window.rdColumns.allShown(VND_COL_SCOPE) : true;
    const tableCtrls = isTable
      ? `<button type="button" class="rd-chip${colAllShown ? ' rd-chip--ghost' : ''}" onclick="rdVndOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${esc(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>
         <button type="button" class="rd-chip" onclick="rdVndAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>
         <button type="button" class="rd-chip" onclick="rdVndCycleRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(window._vndRowHeight || 'compact')}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>`
      : '';
    host.innerHTML =
      filterChip('Category', 'category') +
      filterChip('Status', 'status') +
      filterChip('Quote', 'quote') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVndOpenSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort by category<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<div class="rd-toolbar__right">${tableCtrls}
        <div class="rd-viewswitch" role="group" aria-label="Vendors view">
          <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetVendorsView('table')">Table</button>
          <button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetVendorsView('cards')">Cards</button>
          <button type="button" class="rd-viewswitch__item" onclick="openVendorCompare()">Comparison</button>
        </div>
      </div>`;
  }

  function renderVendorsBulkBar() {
    const bar = document.getElementById('vendors-bulk-bar');
    if (!bar) return;
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('vendors') : [];
    const n = ids.length;
    if (!n || (window._vndTab || 'tracker') === 'shortlist') {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep"></span>
      <button type="button" class="rd-bulkbar__action" onclick="rdVndBulkStatus()">Set status</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdVndBulkRequestQuote()">Request a quote</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdVndBulkEmail()">Email selected</button>
      <button type="button" class="rd-bulkbar__action" onclick="typeof exportVendorCSV==='function'&&exportVendorCSV()">Export selection</button>
      <button type="button" class="rd-bulkbar__clear" onclick="rdVndBulkClear()">Clear selection</button>`;
  }

  /* ── table / cards surfaces ──────────────────────────────────────────── */

  function rdEnsureVendorsTableLayout(forRedesign) {
    const d = (typeof CWP !== 'undefined' && CWP.TABLES) ? CWP.TABLES.vendors : null;
    if (!d) return;
    if (!d._rdBackup) {
      d._rdBackup = {
        extraFilter: d.extraFilter, rowGroup: d.rowGroup, groupHeader: d.groupHeader,
        hideToolbar: d.hideToolbar, search: d.search, afterChange: d.afterChange, afterRender: d.afterRender
      };
    }
    if (!forRedesign) {
      if (d._rdActive) { Object.assign(d, d._rdBackup); d._rdActive = false; }
      return;
    }
    d.extraFilter = r => vendorMatchesFilters(r);
    d.rowGroup = r => vendorRowGroupMeta(r);
    d.groupHeader = (meta, groupRows) => vendorGroupHeaderLabel(meta, groupRows);
    d.hideToolbar = true;
    d.search = false;
    d._rdActive = true;
    d.afterChange = () => {
      renderVendorStatsRd();
      if (typeof renderPageUxChrome === 'function') renderPageUxChrome('vendors');
      if (typeof uxSavedFlashForPanel === 'function') uxSavedFlashForPanel('vendors');
      if (typeof renderContextSidebar === 'function' && document.body.getAttribute('data-active-panel') === 'vendors') {
        renderContextSidebar('vendors');
      }
    };
    d.afterRender = () => {
      applyVendorsRowHeight();
      const wrap = document.getElementById('cwp-vendors');
      if (wrap && typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
        const total = vendorRows().length;
        const filtered = vendorRows().filter(vendorMatchesFilters).length;
        const filterOn = (window._vndRailView && window._vndRailView !== 'all')
          || Object.values(window._vndUiFilters || {}).some(v => v && v !== 'all');
        RdStates.applyOverlay(wrap, {
          page: 'vendors',
          total: total,
          filtered: filtered,
          filterOn: filterOn,
          addLabel: '+ Add vendor',
          onAdd: () => { if (typeof addVendorRow === 'function') addVendorRow(); }
        });
      }
    };
  }

  function applyVendorsRowHeight() {
    const wrap = document.getElementById('cwp-vendors');
    if (!wrap) return;
    wrap.classList.remove('rd-row-compact', 'rd-row-default', 'rd-row-tall');
    const h = window._vndRowHeight || 'compact';
    wrap.classList.add(h === 'tall' ? 'rd-row-tall' : (h === 'default' ? 'rd-row-default' : 'rd-row-compact'));
  }

  function applyVendorsViewMode() {
    const mode = window._vndMode || 'table';
    const table = document.getElementById('vnd-view-table');
    const cards = document.getElementById('vnd-view-cards');
    if (table) { table.hidden = mode !== 'table'; }
    if (cards) { cards.hidden = mode !== 'cards'; }
  }

  function vendorPillHtml(v) {
    const st = statusLabel(v);
    let scheme = 'gray';
    if (isBooked(v)) scheme = 'green';
    else if (st === 'Not Booked') scheme = 'red';
    else if (/consider|quote|meeting|tasting|contact/i.test(String(v.status || ''))) scheme = 'gold';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(st)}</span>`;
  }

  function renderVendorCardsView() {
    const host = document.getElementById('vendor-card-grid');
    if (!host) return;
    host.classList.add('rd-cardgrid');
    const rows = vendorRows().filter(vendorMatchesFilters);
    if (!rows.length) {
      if (typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
        RdStates.applyOverlay(host, {
          page: 'vendors',
          total: vendorRows().length,
          filtered: 0,
          filterOn: vendorRows().length > 0,
          addLabel: '+ Add vendor',
          onAdd: () => { if (typeof addVendorRow === 'function') addVendorRow(); }
        });
      } else {
        host.innerHTML = '<div class="empty-state">No vendors match this view.</div>';
      }
      const foot = document.getElementById('vendor-card-foot');
      if (foot) foot.textContent = '';
      return;
    }
    host.classList.remove('has-rd-state');
    const residual = rows.filter(v => !hasQuote(v));
    const booked = rows.filter(v => isBooked(v) && hasQuote(v));
    const rest = rows.filter(v => hasQuote(v) && !isBooked(v));
    const ordered = booked.concat(rest).concat(residual);
    host.innerHTML = ordered.map(v => {
      const id = v._id || '';
      const danger = !hasQuote(v) ? ' is-residual' : '';
      return `<article class="rd-cardgrid__card${danger}" data-id="${esc(id)}" onclick="rdVndOpenDrawer('${esc(id)}')">
        <div class="rd-cardgrid__title">${esc(v.name || 'Untitled vendor')}</div>
        <div class="rd-cardgrid__meta">${esc(v.cat || 'Uncategorised')} · ${vendorPillHtml(v)}</div>
        <div class="rd-cardgrid__meta">${hasQuote(v) ? money0(v.quote) : '<span class="rd-danger-text">No quote</span>'}${v.contract ? ' · Contract on file' : ''}</div>
        <div class="rd-cardgrid__meta">${esc(v.contact || v.phone || v.email || 'No contact')}</div>
      </article>`;
    }).join('');
    const foot = document.getElementById('vendor-card-foot');
    if (foot) foot.textContent = rows.length + ' vendor' + (rows.length === 1 ? '' : 's');
  }

  function renderVendorCompareRd() {
    if (!Array.isArray(data.vendorCompare)) data.vendorCompare = [];
    const style = currentCompareStyle();
    if (!data.setup) data.setup = {};
    data.setup.vendorCompareStyle = style;
    document.querySelectorAll('#vnd-compare-stylebar .rd-chip, .vcmp-style-btn').forEach(b => {
      const s = b.dataset.style;
      b.classList.toggle('is-active', s === style);
      b.classList.toggle('on', s === style);
    });
    const caps = (typeof VCMP_STYLE_CAPS !== 'undefined') ? VCMP_STYLE_CAPS : {};
    document.querySelectorAll('.vcmp-caption').forEach(el => {
      el.innerHTML = caps[style] || caps.matrix || '';
    });
    const mount = document.getElementById('vendor-compare-preview')
      || document.getElementById('vendor-compare-grid')
      || document.getElementById('cwp-vendorCompare');
    if (!mount) return;
    if (style === 'cards' && typeof vcmpCards === 'function') mount.innerHTML = vcmpCards();
    else if (style === 'h2h' && typeof vcmpH2H === 'function') mount.innerHTML = vcmpH2H();
    else if (typeof vcmpMatrix === 'function') mount.innerHTML = vcmpMatrix();
    else if (typeof cwpRenderTable === 'function') {
      mount.id = mount.id || 'cwp-vendorCompare';
      cwpRenderTable('vendorCompare');
    }
    if (typeof RdStates !== 'undefined' && RdStates.applyOverlay) {
      RdStates.applyOverlay(mount, {
        page: 'vendors',
        total: data.vendorCompare.length,
        filtered: data.vendorCompare.length,
        filterOn: false,
        addLabel: '+ Add comparison',
        emptyHeading: 'No shortlist yet',
        emptyBody: 'Shortlist before booking; passed vendors stay on record.',
        onAdd: () => {
          if (typeof logAdd === 'function') logAdd('vendorCompare', { category: '', a: '', qa: '', b: '', qb: '', c: '', qc: '', decision: '' });
          renderVendorCompareRd();
        }
      });
    }
  }

  /* ── interactions ────────────────────────────────────────────────────── */

  function rdSetVendorsView(mode) {
    window._vndMode = mode === 'cards' ? 'cards' : 'table';
    if (window._vndTab === 'shortlist') {
      window._vndTab = 'tracker';
    }
    renderVendorsRd();
  }

  function openVendorCompareRd() {
    window._vndTab = 'shortlist';
    renderVendorsRd();
  }

  function rdVndSetCompareStyle(style) {
    window._vndCompareStyle = style;
    if (!data.setup) data.setup = {};
    data.setup.vendorCompareStyle = style;
    if (typeof save === 'function') save();
    renderVendorCompareRd();
    renderVendorsToolbar();
  }

  function applyVendorsRailView(view) {
    window._vndRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('vendors', window._vndRailView);
    if (view === 'shortlisted') {
      window._vndTab = 'shortlist';
    } else if (window._vndTab === 'shortlist' && view !== 'shortlisted') {
      window._vndTab = 'tracker';
    }
    renderVendorsRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('vendors');
  }

  function applyVendorsRailGroupBy(groupId) {
    window._vndRailGroupBy = groupId || 'category';
    if (typeof setSavedView === 'function') setSavedView('vendorsGroupBy', window._vndRailGroupBy);
    renderVendorsRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('vendors');
  }

  function rdVndOpenFilter(field, btn) {
    const rows = vendorRows();
    let opts = [{ value: 'all', label: 'All' }];
    if (field === 'category') {
      const names = Array.from(new Set(rows.map(v => String(v.cat || '').trim() || 'Uncategorised'))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    } else if (field === 'status') {
      const names = Array.from(new Set(rows.map(statusLabel))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    } else {
      opts = opts.concat([
        { value: 'quoted', label: 'Quoted' },
        { value: 'unquoted', label: 'No quote' }
      ]);
    }
    const apply = val => {
      window._vndUiFilters[field] = val || 'all';
      renderVendorsRd();
    };
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._vndUiFilters[field] || 'all', apply);
      return;
    }
    apply(opts[1] ? opts[1].value : 'all');
  }
  function rdVndClearFilter(field) {
    window._vndUiFilters[field] = 'all';
    renderVendorsRd();
  }
  function rdVndOpenSort(btn) {
    const opts = [
      { value: 'category', label: 'Sort by category' },
      { value: 'status', label: 'Sort by status' },
      { value: 'quote', label: 'Sort by quote' },
      { value: 'name', label: 'Sort by name' }
    ];
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._vndSort || 'category', val => {
        window._vndSort = val || 'category';
        renderVendorsRd();
      });
    }
  }
  function rdVndOpenColumns(btn) {
    if (window.rdColumns && typeof window.rdColumns.openChooser === 'function') {
      window.rdColumns.openChooser(btn, VND_COL_SCOPE);
      return;
    }
    if (typeof rdOpenColumns === 'function') rdOpenColumns(btn, VND_COL_SCOPE);
  }
  function rdVndAutoFitColumns(btn) {
    if (typeof rdAutoFitTable === 'function') rdAutoFitTable(document.getElementById('cwp-vendors'), btn);
    else if (typeof autoFitColumns === 'function') autoFitColumns(btn);
  }
  function rdVndCycleRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const i = order.indexOf(window._vndRowHeight || 'compact');
    window._vndRowHeight = order[(i < 0 ? 0 : i + 1) % order.length];
    renderVendorsRd();
  }
  function rdVndOpenDrawer(id) {
    if (!id) return;
    if (typeof rdOpenDrawer === 'function') {
      rdOpenDrawer('vendors', id);
      return;
    }
    const idx = vendorRows().findIndex(v => String(v._id) === String(id));
    if (idx >= 0 && typeof openRecordEditor === 'function') openRecordEditor('vendors', idx);
  }
  function rdVndBulkClear() {
    if (typeof cwpClearSelection === 'function') cwpClearSelection('vendors');
    renderVendorsBulkBar();
  }
  function rdVndBulkStatus() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('vendors') : [];
    if (!ids.length) return;
    const next = window.prompt('Set status to:', 'Booked');
    if (!next) return;
    ids.forEach(id => {
      const v = vendorRows().find(r => String(r._id) === String(id));
      if (v) v.status = next;
    });
    if (typeof save === 'function') save();
    renderVendorsRd();
  }
  function rdVndBulkRequestQuote() {
    applyVendorsRailView('noquote');
  }
  function rdVndBulkEmail() {
    if (typeof toast === 'function') toast('Select vendors with email addresses, then use Export or your mail client.');
  }

  function paintVenueExtras() {
    if (typeof renderVenueReminders === 'function') {
      try { renderVenueReminders(); } catch (e) { /* venue panel may own richer markup */ }
    }
    const grid = document.getElementById('venue-arrange-grid');
    if (grid && !grid.children.length) {
      grid.innerHTML = `<div class="rd-help">Venue rooms and hire details live on the Venue page.
        <button type="button" class="rd-btn rd-btn--quiet" onclick="goVenueTab('details')">Open Venue Details</button></div>`;
    }
  }

  /* ── main render ─────────────────────────────────────────────────────── */

  function renderVendorsRd() {
    /* Keep planner's module-scoped _vndTab aligned when possible */
    try {
      if (typeof window.__vndTabRef === 'object') window.__vndTabRef.value = window._vndTab;
    } catch (e) { /* ignore */ }

    uedVendorShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('vendors');
    syncVendorTabChromeRd();
    renderVendorStatsRd();
    renderVendorsToolbar();
    renderVendorsBulkBar();

    const tab = window._vndTab || 'tracker';
    if (tab === 'shortlist') {
      renderVendorCompareRd();
      if (typeof uxRevealPanel === 'function') uxRevealPanel('vendors');
    } else {
      applyVendorsViewMode();
      rdEnsureVendorsTableLayout(true);
      const mode = window._vndMode || 'table';
      if (mode === 'cards') {
        renderVendorCardsView();
      } else if (typeof cwpRenderTable === 'function') {
        cwpRenderTable('vendors');
      }
      paintVenueExtras();
    }

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'vendors'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('vendors');
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
    if (typeof uxRevealPanel === 'function') uxRevealPanel('vendors');
  }

  /* ── exports / hooks ─────────────────────────────────────────────────── */

  window.uedVendorShell = uedVendorShellRd;
  window.renderVendors = renderVendorsRd;
  window.renderVendorStats = renderVendorStatsRd;
  window.renderVendorCompare = renderVendorCompareRd;
  window.openVendorCompare = openVendorCompareRd;
  window.rdSetVendorsView = rdSetVendorsView;
  window.applyVendorsRailView = applyVendorsRailView;
  window.applyVendorsRailGroupBy = applyVendorsRailGroupBy;
  window.vendorRailCounts = vendorRailCounts;
  window.vendorFigures = vendorFigures;
  window.vendorMatchesFilters = vendorMatchesFilters;
  window.rdVndOpenFilter = rdVndOpenFilter;
  window.rdVndClearFilter = rdVndClearFilter;
  window.rdVndOpenSort = rdVndOpenSort;
  window.rdVndOpenColumns = rdVndOpenColumns;
  window.rdVndAutoFitColumns = rdVndAutoFitColumns;
  window.rdVndCycleRowHeight = rdVndCycleRowHeight;
  window.rdVndOpenDrawer = rdVndOpenDrawer;
  window.rdVndBulkClear = rdVndBulkClear;
  window.rdVndBulkStatus = rdVndBulkStatus;
  window.rdVndBulkRequestQuote = rdVndBulkRequestQuote;
  window.rdVndBulkEmail = rdVndBulkEmail;
  window.rdVndSetCompareStyle = rdVndSetCompareStyle;
  window.saveVendorView = function () {
    if (typeof RdFurniture !== 'undefined' && RdFurniture.saveView) RdFurniture.saveView('vendors');
    else if (typeof toast === 'function') toast('View saved for this session');
  };

  installVndTabBridge();

  /* Keep setVendorCompareStyle in sync with redesign chips */
  const _setStyle = window.setVendorCompareStyle;
  window.setVendorCompareStyle = function (s) {
    window._vndCompareStyle = s;
    if (typeof _setStyle === 'function') _setStyle(s);
    else {
      if (!data.setup) data.setup = {};
      data.setup.vendorCompareStyle = s;
      if (typeof save === 'function') save();
      renderVendorCompareRd();
    }
    renderVendorsToolbar();
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
