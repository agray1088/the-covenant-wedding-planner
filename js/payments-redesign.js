/* Payments page — mock 4b.
   Rail + pagehead + 5-stat strip + insight row, then the payment schedule
   tracker (every instalment on one timeline, grouped by vendor), the toolbar,
   and the main table grouped by due month with an expandable payment plan.
   The 360px drawer is the full editor for a payment.

   Every figure comes from the planner's own payment math (paymentPlanSummary,
   paymentBudgetDueTotal, paymentBudgetPaidTotal, paymentGratuityPlanned,
   paymentDisplayStatus) so this page is never a second source of truth. */
(function () {
  'use strict';

  const PAY_DRAWER_TABS = ['Payment', 'Installments', 'Links', 'History'];

  window._payRailView = window._payRailView || 'all';
  window._payFilters = window._payFilters || { status: 'all', vendor: 'all', category: 'all' };
  window._payTrkFilters = window._payTrkFilters || { status: 'all', vendor: 'all', category: 'all' };
  window._paySort = window._paySort || 'due';
  window._payTrkSort = window._payTrkSort || 'due';
  window._paySel = window._paySel || new Set();
  window._payDrawerId = window._payDrawerId || null;
  window._payDrawerTab = window._payDrawerTab || 0;
  window._payMode = window._payMode || 'table';
  window._payExpanded = window._payExpanded || null;

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));

  function money(n) {
    const v = parseFloat(n) || 0;
    if (typeof fmt === 'function') return fmt(v);
    return '$' + Math.round(v).toLocaleString();
  }
  function money0(n) { return '$' + Math.round(parseFloat(n) || 0).toLocaleString(); }
  function nil(txt) { return '<span class="rd-pay-nil">' + (txt || '—') + '</span>'; }
  function dashMoney(v) { const n = parseFloat(v) || 0; return n ? money0(n) : nil(); }
  function pctOf(part, whole) {
    const w = parseFloat(whole) || 0;
    return w <= 0 ? 0 : Math.round(((parseFloat(part) || 0) / w) * 100);
  }
  function clampPct(n) { return Math.max(0, Math.min(100, parseFloat(n) || 0)); }

  function rows() { return typeof safeArray === 'function' ? safeArray(data.payments) : (data.payments || []); }

  function toDate(v) {
    if (!v) return null;
    const s = String(v).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(s + 'T12:00:00');
    return isNaN(d) ? null : d;
  }
  function today() { const t = new Date(); t.setHours(12, 0, 0, 0); return t; }
  function daysUntil(v) {
    const d = toDate(v);
    if (!d) return null;
    return Math.round((d - today()) / 86400000);
  }
  function shortDate(v, withYear) {
    const d = toDate(v);
    if (!d) return String(v || '') || '—';
    const opts = withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' };
    return d.toLocaleDateString(undefined, opts);
  }
  function monthKey(v) {
    const d = toDate(v);
    return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') : '';
  }
  function monthLabel(key) {
    if (!key) return 'No due date';
    const d = new Date(key + '-01T12:00:00');
    return isNaN(d) ? key : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  /* ── row-level derivations ───────────────────────────────────────────── */

  function plan(p) {
    return typeof paymentPlanSummary === 'function'
      ? paymentPlanSummary(p)
      : { hasPlan: false, count: 0, dueTotal: parseFloat(p.due) || 0, paidTotal: parseFloat(p.paid) || 0, balance: 0, nextDate: p.date || '', displayStatus: p.status || 'Not Paid' };
  }
  function payDue(p) {
    return typeof paymentBudgetDueTotal === 'function' ? paymentBudgetDueTotal(p) : (parseFloat(p.due) || 0);
  }
  function payPaid(p) {
    return typeof paymentBudgetPaidTotal === 'function' ? paymentBudgetPaidTotal(p) : (parseFloat(p.paid) || 0);
  }
  function payGratuity(p) { return parseFloat(p && p.gratuity) || 0; }
  function payGratuityStatus(p) { return String((p && p.gratuityStatus) || '').trim() || 'Not Planned'; }
  function payStatus(p) {
    return typeof paymentDisplayStatus === 'function' ? paymentDisplayStatus(p) : (p.status || 'Not Paid');
  }
  function payDueDate(p) {
    const s = plan(p);
    return s.nextDate || p.date || '';
  }
  function payVendor(p) { return String((p && p.vendor) || '').trim(); }
  function payDesc(p) { return String((p && p.desc) || '').trim(); }
  function payLabel(p) {
    const v = payVendor(p);
    const d = payDesc(p);
    if (v && d) return v + ' · ' + d;
    return v || d || 'Untitled payment';
  }
  function payCategory(p) { return String((p && p.budgetCat) || '').trim(); }
  function payMethod(p) { return String((p && p.ptype) || '').trim(); }
  function isAutoPay(p) { return /auto/i.test(String((p && p.ptype) || '') + ' ' + String((p && p.notes) || '')); }
  function isSettled(p) { return payStatus(p) === 'Paid'; }
  function payId(p) { return String((p && p._id) || ''); }
  function indexOfRow(p) { return rows().indexOf(p); }
  function rowById(id) { return rows().find(p => payId(p) === String(id)) || null; }

  /* The pill states the next thing that will happen to the money — the spec's
     "a chip that lies is worse than no chip". */
  function payPill(p) {
    const st = payStatus(p);
    if (st === 'Paid') return { label: 'Paid', scheme: 'green' };
    const d = daysUntil(payDueDate(p));
    if (d != null && d < 0) return { label: Math.abs(d) + ' day' + (d === -1 ? '' : 's') + ' overdue', scheme: 'red' };
    /* The 30-day window outranks "deposit paid": a part-paid balance falling due
       next week is the next cash-out, and a gold chip would bury it. */
    if (d != null && d <= 30) return { label: 'Due in ' + d + ' day' + (d === 1 ? '' : 's'), scheme: 'red' };
    if (st === 'Payment Due') return { label: 'Due soon', scheme: 'red' };
    if (st === 'Partially Paid') return { label: 'Deposit paid', scheme: 'gold' };
    if (isAutoPay(p)) return { label: 'Scheduled', scheme: 'gold' };
    return { label: 'Not paid', scheme: 'gray' };
  }
  function pillHtml(p) {
    return '<span class="status-pill" data-pillscheme="' + p.scheme + '">' + esc(p.label) + '</span>';
  }
  /* Installment pills use the same 30-day window as the payment pill, so a
     stage that is 9 days out reads "Due in 9 days" on the tracker instead of a
     grey "Not paid" that hides the next cash-out. */
  function instPill(inst, opts) {
    const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : (inst.status || 'Not Paid');
    if (st === 'Paid') return { label: 'Paid', scheme: 'green' };
    if (st === 'Payment Due') return { label: 'Payment due', scheme: 'red' };
    if (st === 'Partially Paid') return { label: 'Part paid', scheme: 'gold' };
    const d = daysUntil(inst && inst.dueDate);
    if (opts && opts.auto) return { label: 'Scheduled', scheme: 'gold' };
    if (d != null && d >= 0 && d <= 30) return { label: 'Due in ' + d + ' day' + (d === 1 ? '' : 's'), scheme: 'red' };
    return { label: 'Not paid', scheme: 'gray' };
  }

  /* ── page-level derivations ──────────────────────────────────────────── */

  function paymentFigures() {
    const list = rows();
    let committed = 0, paid = 0, gratuity = 0, due30 = 0, upcoming = 0, auto = 0;
    const months = {};
    list.forEach(p => {
      const covered = typeof paymentIsGiftCovered === 'function' && paymentIsGiftCovered(p);
      const d = payDue(p), pd = payPaid(p);
      if (!covered) { committed += d; paid += pd; }
      if (/planned|prepared|given|included/i.test(payGratuityStatus(p))) gratuity += payGratuity(p);
      if (isAutoPay(p)) auto += 1;
      const days = daysUntil(payDueDate(p));
      if (!isSettled(p) && !covered && days != null && days <= 30) {
        due30 += Math.max(0, d - pd);
        upcoming += 1;
      }
      if (!isSettled(p)) {
        const k = monthKey(payDueDate(p));
        if (k) months[k] = (months[k] || 0) + Math.max(0, d - pd);
      }
    });
    const outstanding = Math.max(0, committed - paid);
    const monthList = Object.keys(months).sort().map(k => ({ key: k, label: monthLabel(k), amount: months[k] }));
    const monthMax = monthList.reduce((m, x) => Math.max(m, x.amount), 0);
    return {
      committed: committed, paid: paid, outstanding: outstanding, gratuity: gratuity,
      due30: due30, upcoming: upcoming, auto: auto, milestones: list.length,
      pct: pctOf(paid, committed), months: monthList, monthMax: monthMax,
      nextAuto: (list.find(isAutoPay) || {}).vendor || '',
      vendors: new Set(list.map(payVendor).filter(Boolean)).size
    };
  }

  /* ── rail views ──────────────────────────────────────────────────────── */

  function matchesRailView(p, view) {
    view = view || window._payRailView || 'all';
    if (view === 'all') return true;
    if (view === 'due30') { const d = daysUntil(payDueDate(p)); return !isSettled(p) && d != null && d <= 30; }
    if (view === 'unpaid') return !isSettled(p);
    if (view === 'deposits') return payStatus(p) === 'Partially Paid' || plan(p).count > 1;
    if (view === 'nogratuity') return !payGratuity(p) || /not planned/i.test(payGratuityStatus(p));
    if (view === 'nocategory') return !payCategory(p);
    return true;
  }
  function railRows() { return rows().filter(p => matchesRailView(p)); }
  function paymentRailCounts() {
    const list = rows();
    return {
      all: list.length,
      due30: list.filter(p => matchesRailView(p, 'due30')).length,
      unpaid: list.filter(p => matchesRailView(p, 'unpaid')).length,
      deposits: list.filter(p => matchesRailView(p, 'deposits')).length,
      nogratuity: list.filter(p => matchesRailView(p, 'nogratuity')).length,
      nocategory: list.filter(p => matchesRailView(p, 'nocategory')).length
    };
  }

  /* ── toolbar filters + sort ──────────────────────────────────────────────
     Both tables carry the same seven controls, but each keeps its own state:
     the tracker is a stage-level read and the main table is a payment-level
     one, so filtering one to "Paid" should not silently gut the other. The rail
     view still scopes both, because that is a page-level choice. */

  function filterState(scope) {
    return scope === 'trk' ? window._payTrkFilters : window._payFilters;
  }
  function matchesFilters(p, scope) {
    const f = filterState(scope) || {};
    if (f.vendor && f.vendor !== 'all' && payVendor(p) !== f.vendor) return false;
    if (f.category && f.category !== 'all' && (payCategory(p) || 'No category') !== f.category) return false;
    if (scope !== 'trk' && f.status && f.status !== 'all'
      && payPill(p).label !== f.status && payStatus(p) !== f.status) return false;
    return true;
  }
  function tableRows() { return railRows().filter(p => matchesFilters(p)); }
  function anyTrackerFilter() {
    const f = filterState('trk') || {};
    return ['status', 'vendor', 'category'].some(k => f[k] && f[k] !== 'all');
  }

  function sortRows(list) {
    const mode = window._paySort || 'due';
    const copy = list.slice();
    copy.sort((a, b) => {
      if (mode === 'amount') return payDue(b) - payDue(a);
      if (mode === 'vendor') return payVendor(a).localeCompare(payVendor(b));
      if (mode === 'status') return payStatus(a).localeCompare(payStatus(b));
      if (mode === 'paid') return payPaid(b) - payPaid(a);
      const da = payDueDate(a) || '9999-12-31';
      const db = payDueDate(b) || '9999-12-31';
      return String(da).localeCompare(String(db));
    });
    return copy;
  }

  const SORT_OPTIONS = {
    main: [
      { value: 'due', label: 'Sort by due date' },
      { value: 'amount', label: 'Sort by amount' },
      { value: 'paid', label: 'Sort by amount paid' },
      { value: 'vendor', label: 'Sort by vendor' },
      { value: 'status', label: 'Sort by status' }
    ],
    trk: [
      { value: 'due', label: 'Sort by due date' },
      { value: 'vendor', label: 'Sort by vendor' },
      { value: 'amount', label: 'Sort by amount' },
      { value: 'stage', label: 'Sort by instalment' },
      { value: 'status', label: 'Sort by status' }
    ]
  };
  function sortValue(scope) {
    return (scope === 'trk' ? window._payTrkSort : window._paySort) || 'due';
  }
  function sortLabel(scope) {
    const cur = sortValue(scope);
    const hit = SORT_OPTIONS[scope === 'trk' ? 'trk' : 'main'].find(o => o.value === cur);
    return hit ? hit.label : 'Sort by due date';
  }

  function filterChip(label, field, scope) {
    const cur = (filterState(scope) || {})[field] || 'all';
    const on = cur !== 'all';
    const s = scope === 'trk' ? 'trk' : 'main';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPayOpenFilter('${field}',this,'${s}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPayClearFilter('${field}','${s}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function rowHeightKey(scope) {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default')
      + ':payments' + (scope === 'trk' ? '-tracker' : '');
  }
  function rowHeightLabel(scope) {
    try { return localStorage.getItem(rowHeightKey(scope)) || 'compact'; } catch (e) { return 'compact'; }
  }

  /* ── columns ─────────────────────────────────────────────────────────────
     §08 gives every table a column budget, so both tables get a real chooser
     rather than a decorative count. Hidden keys persist per table. */

  const PAY_COLUMNS = {
    trk: [
      { key: 'vendor', label: 'Vendor' },
      { key: 'stage', label: 'Instalment', width: '150px' },
      { key: 'amount', label: 'Amount', width: '100px', num: true },
      { key: 'due', label: 'Due', width: '110px' },
      { key: 'paidon', label: 'Paid on', width: '110px' },
      { key: 'method', label: 'Method', width: '120px' },
      { key: 'status', label: 'Status', width: '120px' }
    ],
    main: [
      { key: 'name', label: 'Vendor & description' },
      { key: 'due', label: 'Due', width: '96px', num: true },
      { key: 'paid', label: 'Paid', width: '92px', num: true },
      { key: 'gratuity', label: 'Gratuity', width: '88px', num: true },
      { key: 'duedate', label: 'Due date', width: '96px' },
      { key: 'status', label: 'Status', width: '112px' },
      { key: 'category', label: 'Category', width: '110px' }
    ]
  };

  function colsKey(scope) {
    return 'rdCols:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default')
      + ':payments' + (scope === 'trk' ? '-tracker' : '');
  }
  function hiddenCols(scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const prop = s === 'trk' ? '_payTrkColsHidden' : '_payColsHidden';
    if (!window[prop]) {
      let stored = [];
      try { stored = JSON.parse(localStorage.getItem(colsKey(s)) || '[]'); } catch (e) { stored = []; }
      window[prop] = new Set(Array.isArray(stored) ? stored : []);
    }
    return window[prop];
  }
  function visibleCols(scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const hid = hiddenCols(s);
    return PAY_COLUMNS[s].filter(c => !hid.has(c.key));
  }
  function persistCols(scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    try { localStorage.setItem(colsKey(s), JSON.stringify(Array.from(hiddenCols(s)))); } catch (e) { /* private mode */ }
  }
  function colHeadHtml(scope) {
    return visibleCols(scope).map(c =>
      `<th${c.num ? ' class="rd-pay-th--num"' : ''}${c.width ? ' style="width:' + c.width + '"' : ''} data-col="${c.key}">${esc(c.label)}</th>`
    ).join('');
  }

  /* The picker now lives in js/rd-table-controls.js so every redesigned page
     shares one implementation. */
  function openPayPicker(btn, opts, current, onPick, multi) {
    if (typeof window.rdOpenPicker === 'function') {
      window.rdOpenPicker(btn, opts, current, onPick, multi);
    }
  }

  /* ── auto-fit ────────────────────────────────────────────────────────────
     Delegates to the shared rdAutoFitTable(), which measures every body row —
     group, plan and add rows included — and scopes itself to the table under
     the clicked toolbar rather than resolving #cwp-tasks first. */
  function autoFitPayTable(scope) {
    const mount = document.getElementById(scope === 'trk' ? 'cwp-payment-stages' : 'cwp-payments');
    const table = mount && mount.querySelector('table');
    if (!table) return 0;
    return typeof window.rdAutoFitTable === 'function' ? window.rdAutoFitTable(table) : 0;
  }

  /* The seven controls of §08's toolbar. Both tables carry seven data columns,
     so the count is read from the column defs rather than passed in. */
  function toolbarHtml(scope, _legacyCount, extraRight) {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const s = scope === 'trk' ? 'trk' : 'main';
    const total = PAY_COLUMNS[s].length;
    const shown = visibleCols(s).length;
    return `<div class="rd-toolbar rd-pay-toolbar">
      ${filterChip('Status', 'status', s)}
      ${filterChip('Vendor', 'vendor', s)}
      ${filterChip('Category', 'category', s)}
      <span class="rd-pay-toolbar__sep"></span>
      <button type="button" class="rd-chip rd-chip--ghost" onclick="rdPayOpenSort(this,'${s}')"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${esc(sortLabel(s))}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-chip${shown < total ? '' : ' rd-chip--ghost'}" onclick="rdPayOpenColumns(this,'${s}')"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>Columns · ${shown} of ${total}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-chip" onclick="rdPayAutoFitColumns(this,'${s}')"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>
      <button type="button" class="rd-chip" onclick="rdPayCycleRowHeight('${s}')"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(rowHeightLabel(s))}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      ${extraRight ? `<div class="rd-toolbar__right">${extraRight}</div>` : ''}
    </div>`;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdPayJumpTo('pay-sect-tracker')">Payment schedule</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Payments',paymentsExportRows())">Export</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdPayFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="rdPayAddPayment()">+ New payment</button>`;
  }

  function uedPaymentsShellRd() {
    const panel = document.getElementById('panel-payments');
    if (!panel) return;
    panel.classList.add('ued-scope', 'payments-mockup');
    if (panel.dataset.uedShell === 'payments-rd4b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'payments-rd4b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Money</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Payments</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="payment-stats"></div>
      <div class="rd-pay-insight" id="payment-insight"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="payments-surface-row">
          <div class="rd-surface__main">
            <div class="rd-view rd-pay-body" id="payments-body">
              <section class="rd-pay-sect" id="pay-sect-tracker"></section>
              <section class="rd-pay-sect" id="pay-sect-table"></section>
            </div>
          </div>
          <div id="payments-drawer-slot"></div>
        </div>
      </div>
    </div>`;
  }

  /* ── stat strip (5 cells) ────────────────────────────────────────────── */

  function renderPaymentStatsRd() {
    const host = document.getElementById('payment-stats');
    if (!host) return;
    const f = paymentFigures();
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Committed', value: money0(f.committed), filter: 'Show all payments' },
        { label: 'Paid', value: money0(f.paid), filter: 'Filter · Paid' },
        { label: 'Outstanding', value: money0(f.outstanding), filter: 'Filter · Outstanding' },
        {
          label: 'Due in 30 days',
          value: money0(f.due30),
          filter: 'Due this month',
          attention: f.due30 > 0 ? 'Payments due within 30 days' : undefined
        },
        { label: 'Gratuity planned', value: money0(f.gratuity), filter: 'Show gratuity' }
      ]);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = [
      cell('Committed', money0(f.committed)),
      cell('Paid', money0(f.paid)),
      cell('Outstanding', money0(f.outstanding)),
      cell('Due in 30 days', money0(f.due30), f.due30 > 0 ? 'warn' : ''),
      cell('Gratuity planned', money0(f.gratuity))
    ].join('');
  }

  /* ── insight row: progress + three counters ──────────────────────────── */

  function renderPaymentsInsight() {
    const host = document.getElementById('payment-insight');
    if (!host) return;
    const f = paymentFigures();
    const cal = 'viewBox="0 0 24 24" aria-hidden="true" style="flex:0 0 auto;width:17px;height:17px;fill:none;stroke:var(--gold,#b89968);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const counter = (label, val, sub) => `<div class="rd-pay-insight__cell">
        <svg ${cal}><rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>
        <div class="rd-pay-insight__cellmain">
          <div class="rd-pay-eyebrow">${esc(label)}</div>
          <div class="rd-pay-insight__val">${val}</div>
          <div class="rd-pay-insight__sub">${sub}</div>
        </div>
      </div>`;
    host.innerHTML = `<div class="rd-pay-insight__progress">
        <div class="rd-pay-insight__progresstop">
          <span class="rd-pay-eyebrow">Payment progress</span>
          <span class="rd-pay-insight__pct">${f.committed ? f.pct + '%' : '—'}</span>
        </div>
        <div class="rd-pay-bar"><div class="rd-pay-bar__fill" style="width:${clampPct(f.pct)}%"></div></div>
        <div class="rd-pay-insight__note">${money0(f.paid)} paid of ${money0(f.committed)} contracted · ${money0(f.outstanding)} outstanding</div>
      </div>`
      + counter('Upcoming', f.upcoming, 'Next 30 days · ' + money0(f.due30))
      + counter('Auto payments', f.auto, f.nextAuto ? 'Scheduled · ' + esc(f.nextAuto) : 'None scheduled')
      + counter('Milestones', f.milestones, 'Tracked across ' + f.vendors + ' vendor' + (f.vendors === 1 ? '' : 's'));
  }

  /* ── shared section chrome ───────────────────────────────────────────── */

  function sectHead(eyebrow, note, right) {
    return `<div class="rd-pay-sect__head">
      <div class="rd-pay-eyebrow">${esc(eyebrow)}</div>
      ${note ? `<div class="rd-pay-sect__note">${note}</div>` : ''}
      ${right ? `<div class="rd-pay-sect__headright">${right}</div>` : ''}
    </div>`;
  }

  /* ── §1 payment schedule tracker ─────────────────────────────────────────
     One row per instalment across every vendor. A payment with no plan still
     appears as a single stage so the timeline is complete — the tracker is the
     answer to "what leaves the account next", and a hidden payment would make
     it wrong. */

  function stageRows() {
    const f = window._payTrkFilters || {};
    const out = [];
    railRows().filter(p => matchesFilters(p, 'trk')).forEach(p => {
      const list = Array.isArray(p.installments) ? p.installments : [];
      if (list.length) {
        list.forEach((inst, j) => out.push({
          p: p, inst: inst, j: j,
          label: inst.label || 'Instalment ' + (j + 1),
          amount: parseFloat(inst.amountDue) || 0,
          due: inst.dueDate || '',
          paidOn: inst.paidDate || '',
          method: payMethod(p),
          status: typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : (inst.status || 'Not Paid'),
          pill: instPill(inst, { auto: isAutoPay(p) })
        }));
      } else {
        out.push({
          p: p, inst: null, j: -1,
          label: payDesc(p) || 'Single payment',
          amount: payDue(p),
          due: p.date || '',
          paidOn: p.paiddate || '',
          method: payMethod(p),
          status: payStatus(p),
          pill: payPill(p)
        });
      }
      /* Gratuity is a real cash-out with its own date and envelope, so the
         tracker lists it rather than burying it in the payment total. */
      if (payGratuity(p) > 0) {
        const given = /given/i.test(payGratuityStatus(p));
        out.push({
          p: p, inst: null, j: -2,
          label: 'Gratuity',
          amount: payGratuity(p),
          due: 'Day of',
          paidOn: given ? (p.paiddate || '') : '',
          method: 'Cash envelope',
          status: given ? 'Paid' : 'Not Paid',
          pill: given ? { label: 'Paid', scheme: 'green' } : { label: 'Planned', scheme: 'gray' }
        });
      }
    });
    /* Status is a per-stage fact here, so the tracker's Status filter runs on
       the stage rather than on the payment that owns it. */
    const filtered = (f.status && f.status !== 'all')
      ? out.filter(s => s.status === f.status || s.pill.label === f.status)
      : out;
    return sortStages(filtered);
  }

  function sortStages(list) {
    const mode = sortValue('trk');
    const copy = list.slice();
    copy.sort((a, b) => {
      if (mode === 'vendor') return payVendor(a.p).localeCompare(payVendor(b.p));
      if (mode === 'amount') return b.amount - a.amount;
      if (mode === 'stage') return String(a.label).localeCompare(String(b.label));
      if (mode === 'status') return String(a.status).localeCompare(String(b.status));
      const da = /^\d{4}-/.test(String(a.due)) ? a.due : '9999-12-31';
      const db = /^\d{4}-/.test(String(b.due)) ? b.due : '9999-12-31';
      return String(da).localeCompare(String(db));
    });
    return copy;
  }

  function renderPaymentsTracker() {
    const host = document.getElementById('pay-sect-tracker');
    if (!host) return;
    const stages = stageRows();

    const groups = [];
    stages.forEach(s => {
      const name = payVendor(s.p) || 'Unassigned vendor';
      let g = groups.find(x => x.name === name);
      if (!g) { g = { name: name, stages: [] }; groups.push(g); }
      g.stages.push(s);
    });

    const cols = visibleCols('trk');
    const span = cols.length;

    /* One cell per visible column, so hiding a column drops its data too. */
    function stageCell(key, s) {
      const overdue = s.pill.scheme === 'red';
      switch (key) {
        case 'vendor': return `<td class="rd-pay-muted" data-col="vendor">${esc(payVendor(s.p) || '—')}</td>`;
        case 'stage': return `<td data-col="stage">${esc(s.label)}</td>`;
        case 'amount': return `<td class="rd-pay-num" data-col="amount">${money0(s.amount)}</td>`;
        case 'due': return `<td class="${overdue ? 'rd-pay-due' : 'rd-pay-muted'}" data-col="due">${esc(/^\d{4}-/.test(String(s.due)) ? shortDate(s.due, true) : (s.due || '—'))}</td>`;
        case 'paidon': return `<td class="${s.paidOn ? 'rd-pay-muted' : ''}" data-col="paidon">${s.paidOn ? esc(shortDate(s.paidOn, true)) : nil()}</td>`;
        case 'method': return `<td class="rd-pay-muted" data-col="method">${esc(s.method || '—')}</td>`;
        case 'status': return `<td data-col="status">${pillHtml(s.pill)}</td>`;
        default: return '';
      }
    }

    const body = groups.length
      ? groups.map(g => {
        const total = g.stages.reduce((n, s) => n + s.amount, 0);
        const settled = g.stages.filter(s => s.pill.scheme === 'green').length;
        const autoPay = g.stages.some(s => isAutoPay(s.p));
        /* "0 of 1 stages" says nothing, so a vendor with a single cash-out just
           carries its total. */
        const meta = autoPay ? 'auto-pay'
          : g.stages.length > 1 ? settled + ' of ' + g.stages.length + ' stages'
            : (settled ? 'settled' : 'one payment');
        return `<tr class="rd-pay-grouprow"><td colspan="${span}">${esc(g.name)} · ${money0(total)} · ${esc(meta)}</td></tr>`
          + g.stages.map(s =>
            `<tr class="rd-pay-stagerow${s.pill.scheme === 'red' ? ' is-due' : ''}" onclick="rdPayOpenDrawer('${esc(payId(s.p))}')">`
            + cols.map(c => stageCell(c.key, s)).join('') + '</tr>'
          ).join('');
      }).join('') + `<tr class="rd-pay-addrow" onclick="rdPayAddPayment()"><td colspan="${span}">Add an instalment…</td></tr>`
      : `<tr class="rd-pay-addrow" onclick="rdPayAddPayment()"><td colspan="${span}">${anyTrackerFilter() ? 'No instalments match these filters' : 'No payments yet'} — add the first one…</td></tr>`;

    host.innerHTML = sectHead('Payment schedule tracker',
      'Every instalment on one timeline — deposits, balances and gratuity',
      '<button type="button" class="rd-pay-link" onclick="printCurrentPage()">Print schedule</button>')
      + toolbarHtml('trk', 7)
      + `<div class="rd-pay-tablewrap" id="cwp-payment-stages" data-rd-row-height="${esc(rowHeightLabel('trk'))}">
        <table class="cwp-table rd-pay-table rd-pay-trktable rd-table--${esc(rowHeightLabel('trk'))}">
          <thead><tr>${colHeadHtml('trk')}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }

  /* ── §2 toolbar + main table grouped by due month ────────────────────── */

  function renderPaymentsToolbar() {
    const mode = window._payMode === 'calendar' ? 'calendar' : 'table';
    const viewswitch = `<div class="rd-viewswitch" role="group" aria-label="Payments view">
        <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdPaySetMode('table')">Table</button>
        <button type="button" class="rd-viewswitch__item${mode === 'calendar' ? ' is-active' : ''}" onclick="rdPaySetMode('calendar')">Calendar</button>
      </div>`;
    return toolbarHtml('main', 8, viewswitch);
  }

  function paymentRowHtml(p) {
    const id = payId(p);
    const i = indexOfRow(p);
    const s = plan(p);
    const due = payDue(p), paid = payPaid(p), grat = payGratuity(p);
    const pill = payPill(p);
    const dueDate = payDueDate(p);
    const overdue = pill.scheme === 'red';
    const sel = window._paySel.has(id);
    const settled = isSettled(p);
    const expanded = String(window._payExpanded || '') === id;
    /* Only a payment that actually has a plan advertises one; creating a plan
       lives in the drawer's Installments tab rather than under every row. */
    const planLink = s.count
      ? `<button type="button" class="rd-pay-planlink" onclick="event.stopPropagation();rdPayTogglePlan('${esc(id)}')">${s.count} instalment${s.count === 1 ? '' : 's'}${expanded ? ' ▾' : ''}</button>`
      : '';

    const cell = key => {
      switch (key) {
        case 'name': return `<td class="rd-pay-namecell" data-col="name"><span class="rd-pay-vendor">${esc(payVendor(p) || 'Untitled')}</span>${payDesc(p) ? ` <span class="rd-pay-desc">· ${esc(payDesc(p))}</span>` : ''}${planLink}</td>`;
        case 'due': return `<td class="rd-pay-num" data-col="due">${money0(due)}</td>`;
        case 'paid': return `<td class="rd-pay-num${paid ? ' is-paid' : ''}" data-col="paid">${paid ? money0(paid) : nil('$0')}</td>`;
        case 'gratuity': return `<td class="rd-pay-num" data-col="gratuity">${grat ? money0(grat) : nil()}</td>`;
        case 'duedate': return `<td class="${overdue ? 'rd-pay-due' : 'rd-pay-muted'}" data-col="duedate">${dueDate ? esc(shortDate(dueDate)) : nil()}</td>`;
        case 'status': return `<td data-col="status">${pillHtml(pill)}</td>`;
        case 'category': return `<td class="rd-pay-cat" data-col="category">${payCategory(p) ? esc(payCategory(p)) : nil('No category')}</td>`;
        default: return '';
      }
    };

    let html = `<tr class="rd-pay-row${sel ? ' is-selected' : ''}${overdue ? ' is-due' : ''}${settled ? ' is-settled' : ''}" data-pay-id="${esc(id)}" onclick="rdPayOpenDrawer('${esc(id)}')">
      <td class="rd-pay-tick"><input type="checkbox" ${sel ? 'checked' : ''} onclick="event.stopPropagation()" onchange="rdPayToggleSel('${esc(id)}',this.checked)" aria-label="Select payment"></td>
      ${visibleCols('main').map(c => cell(c.key)).join('')}
    </tr>`;

    if (expanded && s.count) html += planSubRowHtml(p, i);
    return html;
  }

  /* The expanded plan is the same rows the drawer's Installments tab edits —
     one plan, shown at two densities. */
  function planSubRowHtml(p, i) {
    const list = Array.isArray(p.installments) ? p.installments : [];
    const head = `<div class="rd-pay-plan__grid rd-pay-plan__grid--head">
        <span>Instalment</span><span>Due date</span><span class="is-num">Amount due</span>
        <span class="is-num">Amount paid</span><span>Status</span><span>Paid date</span><span></span>
      </div>`;
    const body = list.map((inst, j) => {
      const pill = instPill(inst);
      const overdue = pill.scheme === 'red';
      return `<div class="rd-pay-plan__grid">
        <span>${esc(inst.label || 'Instalment ' + (j + 1))}</span>
        <span class="${overdue ? 'rd-pay-due' : 'rd-pay-muted'}">${inst.dueDate ? esc(shortDate(inst.dueDate, true)) : nil()}</span>
        <span class="is-num">${money0(inst.amountDue)}</span>
        <span class="is-num${parseFloat(inst.amountPaid) ? ' is-paid' : ''}">${parseFloat(inst.amountPaid) ? money0(inst.amountPaid) : nil('$0')}</span>
        <span>${pillHtml(pill)}</span>
        <span class="rd-pay-muted">${inst.paidDate ? esc(shortDate(inst.paidDate, true)) : nil()}</span>
        <span class="rd-pay-plan__del"><button type="button" aria-label="Delete instalment" onclick="event.stopPropagation();deletePaymentInstallment(${i},${j})">&#10005;</button></span>
      </div>`;
    }).join('');
    return `<tr class="rd-pay-planrow"><td></td><td colspan="${visibleCols('main').length}">
      <div class="rd-pay-plan">
        <div class="rd-pay-plan__head">
          <span class="rd-pay-eyebrow">Payment plan · ${list.length} instalment${list.length === 1 ? '' : 's'}</span>
          <button type="button" class="rd-pay-link" onclick="event.stopPropagation();addPaymentInstallment(${i})">+ Add instalment</button>
        </div>
        ${head}${body}
      </div>
    </td></tr>`;
  }

  function renderPaymentsTable() {
    const host = document.getElementById('pay-sect-table');
    if (!host) return;
    const total = railRows().length;
    const list = sortRows(tableRows());
    const pf = window._payFilters || {};
    const filterOn = ['status', 'vendor', 'category'].some(k => pf[k] && pf[k] !== 'all');
    if (typeof RdStates !== 'undefined' && RdStates.maybeEmpty &&
        (total === 0 || (filterOn && list.length === 0))) {
      const head = `<div class="rd-pay-sect__head is-stacked">
      <div class="rd-pay-sect__headmain">
        <div class="rd-pay-eyebrow">Payments · ${window._payRailView === 'all' ? 'all' : esc(railViewLabel(window._payRailView))}</div>
      </div></div>`;
      host.innerHTML = head + (typeof renderPaymentsToolbar === 'function' ? renderPaymentsToolbar() : '')
        + '<div id="cwp-payments" data-rd-state-slot="1"></div>';
      RdStates.maybeEmpty(host.querySelector('#cwp-payments'), {
        pageId: 'payments',
        total: total,
        filtered: list.length,
        filterOn: filterOn,
        onClear: function () {
          window._payFilters = { status: 'all', vendor: 'all', category: 'all' };
          renderPaymentsTable();
        }
      });
      return;
    }
    const open = list.filter(p => !isSettled(p));
    const settled = list.filter(isSettled);

    /* Grouped by due month so the next cash-out is always at the top; settled
       payments collapse into one trailing group rather than interleaving. */
    const groups = [];
    open.forEach(p => {
      const key = monthKey(payDueDate(p));
      let g = groups.find(x => x.key === key);
      if (!g) { g = { key: key, label: monthLabel(key), rows: [] }; groups.push(g); }
      g.rows.push(p);
    });
    groups.sort((a, b) => String(a.key || '9999-99').localeCompare(String(b.key || '9999-99')));

    /* Group and add rows span the tick column plus every visible data column. */
    const dataSpan = visibleCols('main').length;
    const fullSpan = dataSpan + 1;

    let body = groups.map(g => {
      const owed = g.rows.reduce((n, p) => n + Math.max(0, payDue(p) - payPaid(p)), 0);
      return `<tr class="rd-pay-grouprow"><td colspan="${fullSpan}">${esc(g.label)} · ${money0(owed)} due</td></tr>`
        + g.rows.map(paymentRowHtml).join('');
    }).join('');
    if (settled.length) {
      body += `<tr class="rd-pay-grouprow"><td colspan="${fullSpan}">Settled · ${settled.length} payment${settled.length === 1 ? '' : 's'}</td></tr>`
        + settled.map(paymentRowHtml).join('');
    }
    body += `<tr class="rd-pay-addrow" onclick="rdPayAddPayment()"><td class="rd-pay-tick">+</td><td colspan="${dataSpan}">Add a payment…</td></tr>`;
    if (!list.length) {
      body = `<tr class="rd-pay-addrow" onclick="rdPayAddPayment()"><td class="rd-pay-tick">+</td><td colspan="${dataSpan}">No payments match these filters — add a payment…</td></tr>`;
    }

    const f = paymentFigures();
    const head = `<div class="rd-pay-sect__head is-stacked">
      <div class="rd-pay-sect__headmain">
        <div class="rd-pay-eyebrow">Payments · ${window._payRailView === 'all' ? 'all' : esc(railViewLabel(window._payRailView))}</div>
        <div class="rd-pay-sect__title">${list.length} payment${list.length === 1 ? '' : 's'} across ${groups.length} due month${groups.length === 1 ? '' : 's'}</div>
        <div class="rd-pay-sect__sub">${money0(f.committed)} committed · ${money0(f.paid)} paid${f.due30 ? ` · <span class="is-over">${money0(f.due30)} due in 30 days</span>` : ''}</div>
      </div>
      <div class="rd-pay-sect__headright">
        <button type="button" class="rd-btn rd-btn--quiet" onclick="showPanel('contracts')">Open contracts</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdPayAddPayment()">+ Add payment</button>
      </div>
    </div>`;

    host.innerHTML = head + renderPaymentsToolbar()
      + '<div class="rd-bulkbar rd-pay-bulkbar" id="payments-bulk-bar" hidden></div>'
      + (window._payMode === 'calendar' ? calendarViewHtml(list) : `<div class="rd-pay-tablewrap" id="cwp-payments" data-rd-row-height="${esc(rowHeightLabel())}">
        <table class="cwp-table rd-pay-table rd-pay-maintable rd-table--${esc(rowHeightLabel())}">
          <thead><tr>
            <th class="rd-pay-tick" style="width:36px"></th>
            ${colHeadHtml('main')}
          </tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`)
      + `<div class="rd-pay-sect__foot">
        <span>The 360px drawer is the full editor — the Payment tab edits the record, Installments edits the plan, Links shows the budget line and contract this payment is wired to, History shows every change.</span>
      </div>`;
    renderPaymentsBulkBar();
  }

  function railViewLabel(id) {
    return ({
      all: 'all payments', due30: 'due in 30 days', unpaid: 'unpaid',
      deposits: 'deposits only', nogratuity: 'gratuity not planned', nocategory: 'no budget category'
    })[id] || 'all';
  }

  /* Calendar is a month-by-month cash-out read of the same rows — no second
     store, no second set of figures. */
  function calendarViewHtml(list) {
    const buckets = [];
    list.forEach(p => {
      const key = monthKey(payDueDate(p));
      let b = buckets.find(x => x.key === key);
      if (!b) { b = { key: key, label: monthLabel(key), rows: [] }; buckets.push(b); }
      b.rows.push(p);
    });
    buckets.sort((a, b) => String(a.key || '9999-99').localeCompare(String(b.key || '9999-99')));
    if (!buckets.length) return '<div class="rd-pay-empty">No payments to place on the calendar yet.</div>';
    return '<div class="rd-pay-cal">' + buckets.map(b => {
      const owed = b.rows.reduce((n, p) => n + Math.max(0, payDue(p) - payPaid(p)), 0);
      return `<div class="rd-pay-cal__month">
        <div class="rd-pay-cal__head"><span>${esc(b.label)}</span><span class="rd-pay-cal__total">${money0(owed)}</span></div>
        ${b.rows.map(p => {
          const pill = payPill(p);
          return `<button type="button" class="rd-pay-cal__item is-${esc(pill.scheme || 'gray')}" onclick="rdPayOpenDrawer('${esc(payId(p))}')">
          <span class="rd-pay-cal__day">${payDueDate(p) ? esc(shortDate(payDueDate(p))) : '—'}</span>
          <span class="rd-pay-cal__name">${esc(payLabel(p))}</span>
          <span class="rd-pay-cal__amt">${money0(payDue(p))}</span>
          ${pillHtml(pill)}
        </button>`;
        }).join('')}
      </div>`;
    }).join('') + '</div>';
  }

  function renderPaymentsBulkBar() {
    const bar = document.getElementById('payments-bulk-bar');
    if (!bar) return;
    const n = window._paySel.size;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep">|</span>
      <button type="button" class="rd-bulkbar__action" onclick="rdPayBulkMarkPaid()">Mark paid</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdPayBulkSetStatus()">Set status</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdPayBulkSetMethod()">Set method</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdPayBulkSetCategory()">Set budget category</button>
      <button type="button" class="rd-bulkbar__clear rd-bulkbar__clear--danger" onclick="rdPayBulkDelete()">Delete</button>`;
  }

  /* ── §3 the 360px drawer ─────────────────────────────────────────────── */

  function fieldRow(label, value, opts) {
    opts = opts || {};
    const cls = ['rd-field-row__value'];
    if (opts.link) cls.push('rd-field-row__value--link');
    if (opts.over) cls.push('is-over');
    if (opts.warn) cls.push('is-warn');
    if (opts.muted) cls.push('is-muted');
    return `<div class="rd-field-row"><span class="rd-field-row__label">${esc(label)}</span><span class="${cls.join(' ')}">${value}</span></div>`;
  }
  function fieldInput(label, key, value, opts) {
    opts = opts || {};
    const cls = ['rd-field-row__value'];
    if (opts.over) cls.push('is-over');
    if (opts.warn) cls.push('is-warn');
    return `<div class="rd-field-row"><span class="rd-field-row__label">${esc(label)}</span>`
      + `<input class="${cls.join(' ')}" type="${opts.type || 'text'}"${opts.step ? ' step="' + opts.step + '"' : ''}`
      + ` data-payf="${key}" value="${esc(value == null ? '' : String(value))}"></div>`;
  }
  function fieldSelect(label, key, value, options, opts) {
    opts = opts || {};
    const cls = ['rd-field-row__value'];
    if (opts.warn) cls.push('is-warn');
    return `<div class="rd-field-row"><span class="rd-field-row__label">${esc(label)}</span>`
      + `<select class="${cls.join(' ')}" data-payf="${key}">`
      + options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return `<option value="${esc(v)}"${String(v) === String(value == null ? '' : value) ? ' selected' : ''}>${esc(l)}</option>`;
      }).join('')
      + '</select></div>';
  }
  function drawerSectionTitle(t, right) {
    return `<div class="rd-drawer-section-title">${esc(t)}${right ? `<span class="rd-pay-link">${right}</span>` : ''}</div>`;
  }
  function drawerKv(label, value, tone) {
    return `<div class="rd-drawer-kv"><span>${esc(label)}</span><span${tone ? ' class="is-' + tone + '"' : ''}>${value}</span></div>`;
  }

  function methodOptions() {
    const list = typeof PAYMENT_TYPES !== 'undefined' && Array.isArray(PAYMENT_TYPES) ? PAYMENT_TYPES : ['', 'Cash', 'Bank Transfer', 'Card', 'Check', 'Auto Pay'];
    return list.map(t => ({ value: t, label: t || '—' }));
  }
  function statusOptions() {
    const list = typeof PAYMENT_STATUS !== 'undefined' && Array.isArray(PAYMENT_STATUS) ? PAYMENT_STATUS : ['Not Paid', 'Paid', 'Partially Paid', 'Payment Due'];
    return list.slice();
  }
  function gratuityStatusOptions() {
    return ['Not Planned', 'Planned', 'Included in Quote', 'Prepared Cash', 'Given', 'Not Needed'];
  }
  function categoryOptions() {
    const cats = typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || []);
    return [{ value: '', label: 'No category' }].concat(cats.map(c => ({ value: c.cat || '', label: c.cat || 'Category' })));
  }
  function contractLabel(p) {
    const list = typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []);
    const idx = p && p.contractIdx;
    if (idx === '' || idx == null) return '';
    const c = list[Number(idx)];
    if (!c) return '';
    return c.name || c.vendor || c.doc || ('Contract ' + (Number(idx) + 1));
  }

  function drawerPaymentTab(p) {
    const s = plan(p);
    const due = payDue(p), paid = payPaid(p);
    const dueDate = payDueDate(p);
    const overdue = payPill(p).scheme === 'red';
    const cat = payCategory(p);
    const catTotal = (function () {
      const cats = typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || []);
      const c = cats.find(x => String(x.cat || '') === cat);
      if (!c) return 0;
      return typeof catPlanned === 'function' ? catPlanned(c) : (parseFloat(c.planned) || 0);
    })();
    const contract = contractLabel(p);
    return fieldInput('Vendor', 'vendor', payVendor(p))
      + fieldInput('Description', 'desc', payDesc(p))
      + fieldInput('Amount due', 'due', (parseFloat(p.due) || 0).toFixed(2), { type: 'number', step: '0.01' })
      + fieldRow('Paid to date', money(paid) + (s.hasPlan ? ' · from plan' : ''), { muted: !paid })
      + fieldInput('Gratuity', 'gratuity', (payGratuity(p) || 0).toFixed(2), { type: 'number', step: '0.01' })
      + fieldSelect('Gratuity status', 'gratuityStatus', payGratuityStatus(p), gratuityStatusOptions())
      + fieldInput('Due date', 'date', String(p.date || '').slice(0, 10), { type: 'date', over: overdue })
      + fieldInput('Paid date', 'paiddate', String(p.paiddate || '').slice(0, 10), { type: 'date' })
      + fieldSelect('Method', 'ptype', payMethod(p), methodOptions())
      + fieldSelect('Status', 'status', (function () { const n = typeof normalizePaymentStatus === 'function' ? normalizePaymentStatus(p.status || '') : p.status; return n || payStatus(p); })(), statusOptions())
      + fieldSelect('Budget line', 'budgetCat', cat, categoryOptions())
      + fieldRow('Contract', contract ? esc(contract) + ' →' : '—', { link: !!contract, muted: !contract })
      + drawerSectionTitle('Balance')
      + drawerKv('Amount due', money0(due))
      + drawerKv('Paid', money0(paid), paid ? 'paid' : '')
      + drawerKv('Balance', money0(Math.max(0, due - paid)), due - paid > 0 ? 'over' : '')
      + (dueDate ? drawerKv('Next date', shortDate(dueDate, true), overdue ? 'over' : '') : '')
      + (cat && catTotal ? `<div class="rd-drawer-note">Wired to <b>${esc(cat)}</b> (${money0(catTotal)} planned) — editing this payment moves the Budget figure through the same math.</div>` : '')
      + `<div class="rd-drawer-note">The payment&rsquo;s totals and status are recalculated from its instalment rows, so editing one instalment updates this table and Budget.</div>`;
  }

  function drawerInstallmentsTab(p) {
    const i = indexOfRow(p);
    const list = Array.isArray(p.installments) ? p.installments : [];
    if (!list.length) {
      return `<div class="rd-pay-empty">No payment plan yet. A plan splits this payment into deposit, balance and gratuity stages that roll up into the totals above.</div>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdPayStartPlan('${esc(payId(p))}')">Set up payment plan</button>`;
    }
    const head = `<div class="rd-pay-instgrid rd-pay-instgrid--head"><span>Label</span><span class="is-num">Due</span><span class="is-num">Amount</span><span class="is-num">Paid</span><span></span></div>`;
    const body = list.map((inst, j) => {
      const pill = instPill(inst);
      return `<div class="rd-pay-instrow">
        <div class="rd-pay-instgrid">
          <div class="rd-pay-instname">
            <div class="rd-pay-instlabel">${esc(inst.label || 'Instalment ' + (j + 1))}</div>
            ${inst.notes ? `<div class="rd-pay-instnote">${esc(inst.notes)}</div>` : ''}
          </div>
          <span class="is-num rd-pay-muted">${inst.dueDate ? esc(shortDate(inst.dueDate)) : nil()}</span>
          <span class="is-num">${money0(inst.amountDue)}</span>
          <span class="is-num${parseFloat(inst.amountPaid) ? ' is-paid' : ''}">${parseFloat(inst.amountPaid) ? money0(inst.amountPaid) : nil('$0')}</span>
          <span class="rd-pay-instdel"><button type="button" aria-label="Delete instalment" onclick="deletePaymentInstallment(${i},${j})">&#10005;</button></span>
        </div>
        <div class="rd-pay-instfoot">${pillHtml(pill)}<span>${inst.paidDate ? 'Paid ' + esc(shortDate(inst.paidDate, true)) : 'Not paid'}</span></div>
      </div>`;
    }).join('');
    const dueTotal = list.reduce((n, x) => n + (parseFloat(x.amountDue) || 0), 0);
    const paidTotal = list.reduce((n, x) => n + (parseFloat(x.amountPaid) || 0), 0);
    return drawerSectionTitle('Installment payments · ' + list.length,
      `<button type="button" class="rd-pay-link" onclick="addPaymentInstallment(${i})">+ Add</button>`)
      + head + body
      + `<div class="rd-pay-insttotal"><span>Plan total</span><span>${money0(dueTotal)} due · ${money0(paidTotal)} paid</span></div>`
      + `<div class="rd-drawer-note">Deposit, balance and payment-plan rows stay attached to this payment. The payment&rsquo;s own totals and status are recalculated from these rows, so editing an instalment updates the table and Budget.</div>`;
  }

  function drawerLinksTab(p) {
    const cat = payCategory(p);
    const contract = contractLabel(p);
    const item = typeof paymentLinkedBudgetItem === 'function' ? paymentLinkedBudgetItem(p) : null;
    const vendorList = typeof safeArray === 'function' ? safeArray(data.vendors) : (data.vendors || []);
    const vendor = vendorList.find(v => String(v.name || '') === payVendor(p));
    const siblings = rows().filter(x => x !== p && payVendor(x) && payVendor(x) === payVendor(p));
    return fieldRow('Vendor', payVendor(p) ? esc(payVendor(p)) + ' →' : '—', { link: !!vendor, muted: !payVendor(p) })
      + fieldRow('Budget category', cat ? esc(cat) + ' →' : 'Not linked', { link: !!cat, muted: !cat })
      + fieldRow('Budget line', item && item.name ? esc(item.name) : (p.budgetItem ? esc(p.budgetItem) : '—'), { muted: !(item || p.budgetItem) })
      + fieldRow('Contract', contract ? esc(contract) + ' →' : 'Not linked', { link: !!contract, muted: !contract })
      + drawerSectionTitle('Same vendor · ' + siblings.length)
      + (siblings.length
        ? siblings.map(x => `<button type="button" class="rd-pay-sibling" onclick="rdPayOpenDrawer('${esc(payId(x))}')">
            <span class="rd-pay-sibling__name">${esc(payDesc(x) || 'Payment')}</span>
            <span class="rd-pay-sibling__meta">${money0(payDue(x))}</span>
            ${pillHtml(payPill(x))}
          </button>`).join('')
        : '<div class="rd-pay-empty">This is the only payment for this vendor.</div>')
      + `<div class="rd-drawer-note">${cat
        ? 'Every figure here is derived from the owning record — changing the amount updates Budget, Contracts and the Dashboard at once.'
        : 'Without a budget category this payment is invisible to the Budget page. Set one so the committed figures agree.'}</div>`;
  }

  function drawerHistoryTab(p) {
    const events = [];
    if (p.paiddate) events.push({ when: p.paiddate, what: 'Marked paid · ' + money0(payPaid(p)) });
    (Array.isArray(p.installments) ? p.installments : []).forEach(inst => {
      if (inst.paidDate) events.push({ when: inst.paidDate, what: (inst.label || 'Instalment') + ' paid · ' + money0(inst.amountPaid) });
      else if (inst.dueDate) events.push({ when: inst.dueDate, what: (inst.label || 'Instalment') + ' due · ' + money0(inst.amountDue) });
    });
    if (p.date) events.push({ when: p.date, what: 'Payment due · ' + money0(payDue(p)) });
    events.sort((a, b) => String(b.when).localeCompare(String(a.when)));
    return drawerSectionTitle('History · ' + events.length)
      + (events.length
        ? events.map(e => `<div class="rd-pay-histrow"><span class="rd-pay-muted">${esc(shortDate(e.when, true))}</span><span>${esc(e.what)}</span></div>`).join('')
        : '<div class="rd-pay-empty">No dated activity on this payment yet.</div>')
      + (p.notes ? drawerSectionTitle('Notes') + `<div class="rd-drawer-note">${esc(p.notes)}</div>` : '')
      + `<div class="rd-drawer-note">History is derived from the dates on the record and its instalments — it is a read of the data, not a second log.</div>`;
  }

  function renderPaymentsDrawer() {
    const slot = document.getElementById('payments-drawer-slot');
    if (!slot) return;
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
      window._payDrawerId = null;
      return;
    }
    const tabIdx = Math.min(Math.max(0, window._payDrawerTab | 0), PAY_DRAWER_TABS.length - 1);
    const pills = [payPill(p)];
    if (contractLabel(p)) pills.push({ label: 'Contract linked', scheme: 'blue' });
    else if (!payCategory(p)) pills.push({ label: 'No budget category', scheme: 'gold' });

    let body;
    if (tabIdx === 0) body = drawerPaymentTab(p);
    else if (tabIdx === 1) body = drawerInstallmentsTab(p);
    else if (tabIdx === 2) body = drawerLinksTab(p);
    else body = drawerHistoryTab(p);

    const month = monthKey(payDueDate(p));
    const eyebrow = 'Payment' + (month ? ' · ' + monthLabel(month).replace(/\s+\d{4}$/, '') : '');

    slot.classList.add('is-open');
    slot.innerHTML = `<aside class="rd-drawer rd-pay-drawer" aria-label="Payment">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrowrow">
          <span class="rd-drawer__eyebrow">${esc(eyebrow)}</span>
          <button type="button" class="rd-drawer__close" aria-label="Close" onclick="rdPayCloseDrawer()">&#10005;</button>
        </div>
        <div class="rd-drawer__title">${esc(payLabel(p))}</div>
        <div class="rd-drawer__pills">${pills.map(pillHtml).join('')}</div>
        <div class="rd-drawer__tabs is-guest-tabs">${PAY_DRAWER_TABS.map((t, i) =>
      `<button type="button" class="rd-drawer__tab${i === tabIdx ? ' is-active' : ''}" onclick="rdPayDrawerTab(${i})">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="rd-drawer__body rd-drawer-fields">${body}</div>
      <div class="rd-drawer__foot">
        ${tabIdx === 0
        ? '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPayDrawerSave()">Save</button>'
        : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPayDrawerMarkPaid()">${isSettled(p) ? 'Mark unpaid' : 'Mark paid'}</button>`}
        <button type="button" class="rd-btn" onclick="rdPayDrawerFullEditor()">Full editor</button>
      </div>
    </aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function persist() { if (typeof save === 'function') save(); }
  function rerender() { renderPaymentsRd(); }
  function syncBudget() { if (typeof syncPaymentsToBudget === 'function') syncPaymentsToBudget(); }

  function revealDrawer() {
    const row = document.getElementById('payments-surface-row');
    if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function rdPayOpenDrawer(id) {
    window._payDrawerId = String(id);
    renderPaymentsDrawer();
    revealDrawer();
  }
  function rdPayCloseDrawer() {
    window._payDrawerId = null;
    renderPaymentsDrawer();
  }
  function rdPayDrawerTab(i) {
    window._payDrawerTab = i | 0;
    renderPaymentsDrawer();
  }
  function rdPayDrawerSave() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    const slot = document.getElementById('payments-drawer-slot');
    if (!p || !slot) return;
    const read = key => {
      const el = slot.querySelector('[data-payf="' + key + '"]');
      return el ? el.value : null;
    };
    ['vendor', 'desc', 'date', 'paiddate', 'ptype', 'status', 'gratuityStatus', 'budgetCat'].forEach(k => {
      const v = read(k);
      if (v != null) p[k] = v;
    });
    ['due', 'gratuity'].forEach(k => {
      const v = read(k);
      if (v != null && v !== '') p[k] = parseFloat(v) || 0;
    });
    if (Array.isArray(p.installments) && p.installments.length && typeof syncPaymentRowFromInstallments === 'function') {
      syncPaymentRowFromInstallments(p);
    }
    if (typeof syncRelationshipIdsForRow === 'function') syncRelationshipIdsForRow('payments', p);
    syncBudget();
    persist();
    rerender();
    if (typeof toast === 'function') toast('Payment saved');
  }
  function rdPayDrawerMarkPaid() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p) return;
    markPaid(p, !isSettled(p));
    persist();
    rerender();
  }
  function markPaid(p, on) {
    if (on) {
      p.status = 'Paid';
      p.paid = parseFloat(p.due) || parseFloat(p.paid) || 0;
      if (!p.paiddate) p.paiddate = new Date().toISOString().slice(0, 10);
      (Array.isArray(p.installments) ? p.installments : []).forEach(inst => {
        inst.amountPaid = parseFloat(inst.amountDue) || 0;
        if (!inst.paidDate) inst.paidDate = p.paiddate;
        inst.status = 'Paid';
      });
    } else {
      p.status = 'Not Paid';
      p.paid = 0;
      p.paiddate = '';
      (Array.isArray(p.installments) ? p.installments : []).forEach(inst => {
        inst.amountPaid = 0;
        inst.paidDate = '';
        inst.status = 'Not Paid';
      });
    }
    if (Array.isArray(p.installments) && p.installments.length && typeof syncPaymentRowFromInstallments === 'function') {
      syncPaymentRowFromInstallments(p);
    }
    syncBudget();
  }
  function rdPayDrawerFullEditor() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p || typeof openRecordEditor !== 'function') return;
    openRecordEditor('payments', indexOfRow(p));
  }
  function rdPayFullEditor() {
    if (typeof openRecordEditor !== 'function') return;
    const list = rows();
    let idx = -1;
    if (window._payDrawerId) idx = list.findIndex(p => payId(p) === String(window._payDrawerId));
    if (idx < 0) {
      const sel = Array.from(window._paySel);
      if (sel.length) idx = list.findIndex(p => payId(p) === sel[0]);
    }
    if (idx < 0 && list.length) idx = 0;
    if (!list.length) { openRecordEditor('payments'); return; }
    openRecordEditor('payments', idx);
  }
  function rdPayAddPayment() {
    if (typeof openRecordEditor === 'function') { openRecordEditor('payments'); return; }
    if (typeof addPaymentRow === 'function') addPaymentRow();
  }

  function rdPayTogglePlan(id) {
    window._payExpanded = String(window._payExpanded || '') === String(id) ? null : String(id);
    renderPaymentsTable();
  }
  function rdPayStartPlan(id) {
    const p = rowById(id);
    if (!p) return;
    if (typeof startPaymentPlan === 'function') { startPaymentPlan(indexOfRow(p)); window._payExpanded = String(id); return; }
    p.installments = [{ label: 'Instalment 1', dueDate: p.date || '', amountDue: parseFloat(p.due) || 0, amountPaid: parseFloat(p.paid) || 0, status: p.status || 'Not Paid', paidDate: p.paiddate || '', notes: '' }];
    window._payExpanded = String(id);
    persist();
    rerender();
  }

  function rdPayJumpTo(sectionId) {
    const el = document.getElementById(sectionId);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function applyPaymentsRailView(view) {
    window._payRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('payments', window._payRailView);
    rerender();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('payments');
  }
  function rdPaySetMode(mode) {
    window._payMode = mode === 'calendar' ? 'calendar' : 'table';
    renderPaymentsTable();
  }

  /* Each toolbar redraws only the section it belongs to. */
  function repaint(scope) {
    if (scope === 'trk') renderPaymentsTracker();
    else renderPaymentsTable();
  }

  function rdPayOpenFilter(field, btn, scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const state = filterState(s);
    let opts = [{ value: 'all', label: 'All' }];
    if (field === 'vendor') {
      const names = Array.from(new Set(rows().map(payVendor).filter(Boolean))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    } else if (field === 'category') {
      const names = Array.from(new Set(rows().map(p => payCategory(p) || 'No category'))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    } else {
      opts = opts.concat(statusOptions().map(x => ({ value: x, label: x })));
    }
    openPayPicker(btn, opts, state[field] || 'all', val => {
      state[field] = val || 'all';
      repaint(s);
    });
  }
  function rdPayClearFilter(field, scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    filterState(s)[field] = 'all';
    repaint(s);
  }
  function rdPayOpenSort(btn, scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const opts = SORT_OPTIONS[s];
    const apply = val => {
      if (s === 'trk') window._payTrkSort = val || 'due';
      else window._paySort = val || 'due';
      repaint(s);
    };
    openPayPicker(btn, opts, sortValue(s), apply);
  }
  /* Multi-select: the menu stays open, and the last visible column cannot be
     hidden or the table would render as an empty frame. */
  function rdPayOpenColumns(btn, scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const hid = hiddenCols(s);
    const opts = PAY_COLUMNS[s].map(c => ({ value: c.key, label: c.label, checked: !hid.has(c.key) }));
    openPayPicker(btn, opts, null, key => {
      if (hid.has(key)) hid.delete(key);
      else if (visibleCols(s).length > 1) hid.add(key);
      else return false;
      persistCols(s);
      repaint(s);
    }, true);
  }
  function rdPayCycleRowHeight(scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const order = ['compact', 'default', 'tall'];
    const i = order.indexOf(rowHeightLabel(s));
    try { localStorage.setItem(rowHeightKey(s), order[(i < 0 ? 0 : i + 1) % order.length]); } catch (e) { /* private mode */ }
    repaint(s);
  }
  function rdPayAutoFitColumns(btn, scope) {
    const s = scope === 'trk' ? 'trk' : 'main';
    const fitted = autoFitPayTable(s);
    if (fitted && typeof toast === 'function') toast('Fitted ' + fitted + ' columns to content');
  }

  function rdPayToggleSel(id, on) {
    if (on) window._paySel.add(String(id));
    else window._paySel.delete(String(id));
    const tr = document.querySelector('#cwp-payments tr[data-pay-id="' + id + '"]');
    if (tr) tr.classList.toggle('is-selected', !!on);
    renderPaymentsBulkBar();
  }
  function selectedRows() { return rows().filter(p => window._paySel.has(payId(p))); }
  function rdPayBulkMarkPaid() {
    const sel = selectedRows();
    if (!sel.length) return;
    sel.forEach(p => markPaid(p, true));
    window._paySel.clear();
    persist();
    rerender();
  }
  async function rdPayBulkSetStatus() {
    const sel = selectedRows();
    if (!sel.length) return;
    const val = typeof covPrompt === 'function'
      ? await covPrompt('Set status for ' + sel.length + ' payment' + (sel.length === 1 ? '' : 's') + ' (' + statusOptions().join(' / ') + ')', { value: 'Paid' })
      : window.prompt('Status', 'Paid');
    if (!val) return;
    sel.forEach(p => { p.status = val; if (val === 'Paid') markPaid(p, true); });
    syncBudget();
    persist();
    rerender();
  }
  async function rdPayBulkSetMethod() {
    const sel = selectedRows();
    if (!sel.length) return;
    const val = typeof covPrompt === 'function'
      ? await covPrompt('Payment method for ' + sel.length + ' payment' + (sel.length === 1 ? '' : 's'), { value: '' })
      : window.prompt('Method', '');
    if (val == null) return;
    sel.forEach(p => { p.ptype = val; });
    persist();
    rerender();
  }
  async function rdPayBulkSetCategory() {
    const sel = selectedRows();
    if (!sel.length) return;
    const val = typeof covPrompt === 'function'
      ? await covPrompt('Budget category for ' + sel.length + ' payment' + (sel.length === 1 ? '' : 's'), { value: payCategory(sel[0]) })
      : window.prompt('Budget category', payCategory(sel[0]));
    if (val == null) return;
    sel.forEach(p => {
      p.budgetCat = val;
      if (typeof syncRelationshipIdsForRow === 'function') syncRelationshipIdsForRow('payments', p);
    });
    syncBudget();
    persist();
    rerender();
  }
  async function rdPayBulkDelete() {
    const sel = selectedRows();
    if (!sel.length) return;
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Delete ' + sel.length + ' payment' + (sel.length === 1 ? '' : 's') + '? This cannot be undone from here.', { title: 'Delete payments?', danger: true, okText: 'Delete', cancelText: 'Keep' })
      : window.confirm('Delete ' + sel.length + ' payments?');
    if (!ok) return;
    data.payments = rows().filter(p => !window._paySel.has(payId(p)));
    window._paySel.clear();
    window._payDrawerId = null;
    syncBudget();
    persist();
    rerender();
  }

  function paymentsExportRows() {
    return sortRows(tableRows()).map(p => ({
      Vendor: payVendor(p),
      Description: payDesc(p),
      'Amount due': payDue(p),
      Paid: payPaid(p),
      Gratuity: payGratuity(p),
      'Gratuity status': payGratuityStatus(p),
      'Due date': payDueDate(p),
      'Paid date': p.paiddate || '',
      Method: payMethod(p),
      Status: payStatus(p),
      'Budget category': payCategory(p),
      Contract: contractLabel(p),
      Instalments: plan(p).count
    }));
  }

  /* ── orchestration ───────────────────────────────────────────────────── */

  function renderPaymentsRd() {
    if (typeof migrateBudget === 'function') migrateBudget();
    if (typeof ensurePaymentIds === 'function') ensurePaymentIds();
    rows().forEach(p => {
      if (!p._id && typeof ensureRowId === 'function') ensureRowId(p, 'payments');
    });

    uedPaymentsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('payments');

    renderPaymentStatsRd();
    renderPaymentsInsight();
    renderPaymentsTracker();
    renderPaymentsTable();
    renderPaymentsDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'payments'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('payments');
    }
    requestAnimationFrame(() => {
      if (typeof makeColumnsResizable === 'function') makeColumnsResizable(document.getElementById('panel-payments'));
    });
  }

  /* ── exports ─────────────────────────────────────────────────────────── */

  window.__paymentsRenderRd = renderPaymentsRd;
  window.uedPaymentsShell = uedPaymentsShellRd;
  window.renderPayments = renderPaymentsRd;
  window.renderPaymentStats = renderPaymentStatsRd;

  window.paymentFigures = paymentFigures;
  window.paymentRailCounts = paymentRailCounts;
  window.paymentsRailVisibleRows = railRows;
  window.paymentsExportRows = paymentsExportRows;
  window.applyPaymentsRailView = applyPaymentsRailView;
  window.paymentRowDueOf = payDue;
  window.paymentRowPaidOf = payPaid;
  window.paymentRowPillOf = payPill;
  window.paymentRowLabelOf = payLabel;

  window.rdPayJumpTo = rdPayJumpTo;
  window.rdPaySetMode = rdPaySetMode;
  window.rdPayOpenFilter = rdPayOpenFilter;
  window.rdPayClearFilter = rdPayClearFilter;
  window.rdPayOpenSort = rdPayOpenSort;
  window.rdPayOpenColumns = rdPayOpenColumns;
  window.rdPayCycleRowHeight = rdPayCycleRowHeight;
  window.rdPayAutoFitColumns = rdPayAutoFitColumns;
  window.rdPayToggleSel = rdPayToggleSel;
  window.rdPayBulkMarkPaid = rdPayBulkMarkPaid;
  window.rdPayBulkSetStatus = rdPayBulkSetStatus;
  window.rdPayBulkSetMethod = rdPayBulkSetMethod;
  window.rdPayBulkSetCategory = rdPayBulkSetCategory;
  window.rdPayBulkDelete = rdPayBulkDelete;
  window.rdPayOpenDrawer = rdPayOpenDrawer;
  window.rdPayCloseDrawer = rdPayCloseDrawer;
  window.rdPayDrawerTab = rdPayDrawerTab;
  window.rdPayDrawerSave = rdPayDrawerSave;
  window.rdPayDrawerMarkPaid = rdPayDrawerMarkPaid;
  window.rdPayDrawerFullEditor = rdPayDrawerFullEditor;
  window.rdPayFullEditor = rdPayFullEditor;
  window.rdPayAddPayment = rdPayAddPayment;
  window.rdPayTogglePlan = rdPayTogglePlan;
  window.rdPayStartPlan = rdPayStartPlan;

  function hookPaymentsPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.payments = function () { renderPaymentsRd(); };
    }
  }
  hookPaymentsPanelRenderer();
  var _showPanelPayments = window.showPanel;
  if (typeof _showPanelPayments === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelPayments.call(window, id, forceOpen);
      hookPaymentsPanelRenderer();
      return out;
    };
  }
})();
