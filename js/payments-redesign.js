/* Payments page — Master §09: 4b + Calendar 30c + Payment drawer.
   View switcher (not a tab strip): Table · Calendar.
   Table (4b) is grouped by due month; instalment plans expand on the row.
   Calendar (30c) is cash-flow shape: colour is status, never size; drag
   proposes a due date and never silently rewrites a contracted one.
   Drawer tabs: Payment · Contract · Method · History.

   Every figure comes from the planner's own payment math (paymentPlanSummary,
   paymentBudgetDueTotal, paymentBudgetPaidTotal, paymentGratuityPlanned,
   paymentDisplayStatus) so this page is never a second source of truth. */
(function () {
  'use strict';

  const PAY_DRAWER_TABS = ['Payment', 'Contract', 'Method', 'History'];

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
  window._payCalUnpaid = !!window._payCalUnpaid;

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

  function payContract(p) {
    if (!p) return null;
    const list = typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []);
    if (typeof findContractByIdOrIndex === 'function') {
      const hit = findContractByIdOrIndex(p.contractId || p.contractIdx);
      if (hit) return hit;
    }
    if (p.contractId) {
      const byId = list.find(c => String(c._id) === String(p.contractId));
      if (byId) return byId;
    }
    if (p.contractIdx !== '' && p.contractIdx != null && list[Number(p.contractIdx)]) {
      return list[Number(p.contractIdx)];
    }
    return null;
  }
  function contractLabel(p) {
    const c = payContract(p);
    if (!c) return '';
    return c.name || c.vendor || c.doc || 'Contract';
  }
  function contractIsLinked(p) { return !!payContract(p); }
  function nextInstalmentLabel(p) {
    const list = Array.isArray(p.installments) ? p.installments : [];
    if (!list.length) return 'Single payment';
    const unpaid = list.find(inst => {
      const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : (inst.status || '');
      return st !== 'Paid';
    });
    return (unpaid && unpaid.label) || list[0].label || (list.length + ' instalments');
  }

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
      { key: 'vendor', label: 'Vendor & description' },
      { key: 'dueamt', label: 'Due', width: '96px', num: true },
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
    const cal = window._payMode === 'calendar';
    if (cal) {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print schedule</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdPayFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Payments',paymentsExportRows())">Export</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="rdPayAddPayment()">Record a payment</button>`;
    }
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
    if (panel.dataset.uedShell === 'payments-rd09') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'payments-rd09';
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

  function calendarFigures() {
    const cursor = payCalCursor();
    const list = tableRows();
    let dueMonth = 0, overdue = 0, next90 = 0, left = 0;
    let overdueLabel = '';
    list.forEach(p => {
      if (isSettled(p)) {
        return;
      }
      const remain = Math.max(0, payDue(p) - payPaid(p));
      const d = daysUntil(payDueDate(p));
      if (monthKey(payDueDate(p)) === cursor) dueMonth += remain;
      if (d != null && d < 0) {
        overdue += remain;
        if (!overdueLabel) {
          overdueLabel = (payVendor(p) || payDesc(p) || 'Payment')
            + (payDueDate(p) ? ', ' + shortDate(payDueDate(p)) : '');
        }
      }
      if (d != null && d >= 0 && d <= 90) next90 += remain;
      const inst = Array.isArray(p.installments) ? p.installments : [];
      if (inst.length) {
        left += inst.filter(i => {
          const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(i) : (i.status || '');
          return st !== 'Paid';
        }).length;
      } else {
        left += 1;
      }
    });
    const monthCount = list.filter(p => monthKey(payDueDate(p)) === cursor).length;
    return {
      dueMonth: dueMonth, overdue: overdue, overdueLabel: overdueLabel,
      next90: next90, left: left, paid: paymentFigures().paid,
      monthCount: monthCount, cursor: cursor
    };
  }

  function renderPaymentStatsRd() {
    const host = document.getElementById('payment-stats');
    if (!host) return;
    const cal = window._payMode === 'calendar';
    if (cal) {
      const c = calendarFigures();
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Due this month', value: money0(c.dueMonth), filter: 'Due this month' },
          {
            label: 'Overdue',
            value: money0(c.overdue),
            filter: 'Filter · Overdue',
            attention: c.overdue > 0 ? (c.overdueLabel || 'Overdue payments') : undefined
          },
          { label: 'Next 90 days', value: money0(c.next90), filter: 'Due in 90 days' },
          { label: 'Paid to date', value: money0(c.paid), filter: 'Filter · Paid' },
          { label: 'Instalments left', value: String(c.left), filter: 'Filter · Unpaid' }
        ]);
        return;
      }
      const cell = (label, val, tone) =>
        `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
      host.innerHTML = [
        cell('Due this month', money0(c.dueMonth)),
        cell('Overdue', money0(c.overdue), c.overdue > 0 ? 'warn' : ''),
        cell('Next 90 days', money0(c.next90)),
        cell('Paid to date', money0(c.paid)),
        cell('Instalments left', String(c.left))
      ].join('');
      return;
    }
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

  function viewSwitchHtml() {
    const mode = window._payMode === 'calendar' ? 'calendar' : 'table';
    return `<div class="rd-viewswitch" role="group" aria-label="Payments view">
        <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdPaySetMode('table')">Table</button>
        <button type="button" class="rd-viewswitch__item${mode === 'calendar' ? ' is-active' : ''}" onclick="rdPaySetMode('calendar')">Calendar</button>
      </div>`;
  }
  function renderPaymentsToolbar() {
    return toolbarHtml('main', 7, viewSwitchHtml());
  }
  function calendarToolbarHtml() {
    const unpaid = !!window._payCalUnpaid;
    return `<div class="rd-toolbar rd-pay-toolbar">
      ${filterChip('Vendor', 'vendor', 'main')}
      ${filterChip('Status', 'status', 'main')}
      <button type="button" class="rd-chip${unpaid ? ' is-active' : ''}" onclick="rdPayCalUnpaidOnly()">${unpaid ? 'Unpaid only<span class="rd-chip__clear">✕</span>' : 'Unpaid only'}</button>
      <span class="rd-pay-toolbar__hint">Drag to propose a new date</span>
      <div class="rd-toolbar__right">${viewSwitchHtml()}</div>
    </div>`;
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
    /* A payment with a plan expands on the row — the drawer has no
       Installments tab. Creating a plan lives on the row. */
    const planLink = s.count
      ? `<button type="button" class="rd-pay-planlink" onclick="event.stopPropagation();rdPayTogglePlan('${esc(id)}')">${s.count} instalment${s.count === 1 ? '' : 's'}${expanded ? ' ▾' : ''}</button>`
      : `<button type="button" class="rd-pay-planlink" onclick="event.stopPropagation();rdPayStartPlan('${esc(id)}')">Set up plan</button>`;

    const cell = key => {
      switch (key) {
        case 'vendor': return `<td class="rd-pay-namecell" data-col="vendor"><span class="rd-pay-vendor">${esc(payVendor(p) || 'Untitled')}</span>${payDesc(p) ? ` <span class="rd-pay-desc">· ${esc(payDesc(p))}</span>` : ''} ${planLink}</td>`;
        case 'dueamt': return `<td class="rd-pay-num" data-col="dueamt">${money0(due)}</td>`;
        case 'paid': return `<td class="rd-pay-num${paid ? ' is-paid' : ''}" data-col="paid">${paid ? money0(paid) : nil('$0')}</td>`;
        case 'gratuity': return `<td class="rd-pay-num" data-col="gratuity">${grat ? money0(grat) : nil()}</td>`;
        case 'duedate': return `<td class="${overdue ? 'rd-pay-due' : 'rd-pay-muted'}" data-col="duedate">${dueDate ? esc(shortDate(dueDate)) : nil()}</td>`;
        case 'status': return `<td data-col="status">${pillHtml(pill)}</td>`;
        case 'category': return `<td class="rd-pay-cat" data-col="category">${payCategory(p) ? esc(payCategory(p)) : nil()}</td>`;
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
    if (window._payMode === 'calendar') {
      const calList = window._payCalUnpaid ? list.filter(p => !isSettled(p)) : list;
      host.innerHTML = calendarToolbarHtml() + calendarViewHtml(calList);
      return;
    }
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
      + `<div class="rd-pay-tablewrap" id="cwp-payments" data-rd-row-height="${esc(rowHeightLabel())}">
        <table class="cwp-table rd-pay-table rd-pay-maintable rd-table--${esc(rowHeightLabel())}">
          <thead><tr>
            <th class="rd-pay-tick" style="width:36px"></th>
            ${colHeadHtml('main')}
          </tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`
      + `<div class="rd-pay-sect__foot">
        <span>The 360px drawer is the full editor — Payment is the instalment, Contract is the paper (read-only), Method is how and from which pot, History shows every date and amount change. Expand a row for the payment plan.</span>
      </div>`;
    renderPaymentsBulkBar();
  }

  function railViewLabel(id) {
    return ({
      all: 'all payments', due30: 'due in 30 days', unpaid: 'unpaid',
      deposits: 'deposits only', nogratuity: 'gratuity not planned', nocategory: 'no budget category'
    })[id] || 'all';
  }

  /* Calendar (30c) is cash-flow shape: when money clusters, not a list of
     months. Colour is status, never size. Drag proposes a due date. Week
     starts Monday, matching the Master drawing. */
  function payCalCursor() {
    if (window._payCalCursor && /^\d{4}-\d{2}$/.test(window._payCalCursor)) return window._payCalCursor;
    const first = tableRows().map(payDueDate).filter(Boolean).sort()[0];
    const iso = first || new Date().toISOString().slice(0, 10);
    window._payCalCursor = monthKey(iso) || iso.slice(0, 7);
    return window._payCalCursor;
  }
  function calTone(p) {
    const d = daysUntil(payDueDate(p));
    const funded = !!payCategory(p) || contractIsLinked(p) || payPaid(p) > 0 || isSettled(p);
    if (!isSettled(p) && d != null && (d < 0 || d <= 7)) return 'red';
    const dueMonth = monthKey(payDueDate(p));
    if (!isSettled(p) && dueMonth && dueMonth === payCalCursor()) return 'amber';
    if (funded) return 'blue';
    return 'gray';
  }
  function calChipLabel(p) {
    const name = payVendor(p) || payDesc(p) || 'Payment';
    const remain = Math.max(0, payDue(p) - payPaid(p)) || payDue(p);
    return name + ' · ' + money0(remain);
  }
  function calendarViewHtml(list) {
    const cursor = payCalCursor();
    const [yy, mm] = cursor.split('-').map(Number);
    const first = new Date(yy, mm - 1, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(yy, mm, 0).getDate();
    const prevDays = new Date(yy, mm - 1, 0).getDate();
    const title = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const byDay = {};
    list.forEach(p => {
      const due = payDueDate(p);
      if (!due || monthKey(due) !== cursor) return;
      const day = parseInt(String(due).slice(8, 10), 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(p);
    });
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let cells = '';
    for (let i = 0; i < startPad; i++) {
      const day = prevDays - startPad + 1 + i;
      const prev = new Date(yy, mm - 2, day);
      const iso = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      cells += `<div class="rd-pay-calgrid__cell is-pad" data-cal-day="${esc(iso)}" ondragover="event.preventDefault()" ondrop="rdPayCalDrop(event,'${esc(iso)}')" onclick="rdPayCalAddOn('${esc(iso)}')">
        <span class="rd-pay-calgrid__num">${day}</span>
      </div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = cursor + '-' + String(day).padStart(2, '0');
      const items = byDay[day] || [];
      const chips = items.map(p => {
        const tone = calTone(p);
        return `<button type="button" class="rd-pay-calchip is-${esc(tone)}" draggable="true" data-pay-id="${esc(payId(p))}" ondragstart="rdPayCalDrag(event,'${esc(payId(p))}')" onclick="event.stopPropagation();rdPayOpenDrawer('${esc(payId(p))}')">${esc(calChipLabel(p))}</button>`;
      }).join('');
      cells += `<div class="rd-pay-calgrid__cell" data-cal-day="${esc(iso)}" ondragover="event.preventDefault()" ondrop="rdPayCalDrop(event,'${esc(iso)}')" onclick="rdPayCalAddOn('${esc(iso)}')">
        <span class="rd-pay-calgrid__num">${day}</span>
        <div class="rd-pay-calgrid__chips">${chips}</div>
      </div>`;
    }
    const trailing = (7 - ((startPad + daysInMonth) % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      const next = new Date(yy, mm, i);
      const iso = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
      cells += `<div class="rd-pay-calgrid__cell is-pad" data-cal-day="${esc(iso)}" ondragover="event.preventDefault()" ondrop="rdPayCalDrop(event,'${esc(iso)}')" onclick="rdPayCalAddOn('${esc(iso)}')">
        <span class="rd-pay-calgrid__num">${i}</span>
      </div>`;
    }
    const cf = calendarFigures();
    return `<div class="rd-pay-cal">
      <div class="rd-pay-cal__head">
        <button type="button" class="rd-pay-link" onclick="rdPayCalShift(-1)">Previous</button>
        <div class="rd-pay-cal__title">${esc(title)} · ${cf.monthCount} payment${cf.monthCount === 1 ? '' : 's'} · ${money0(cf.dueMonth)} due</div>
        <span class="rd-pay-cal__hint">Click a day to add · drag an event to move it</span>
        <button type="button" class="rd-pay-link rd-pay-cal__today" onclick="rdPayCalToday()">Today</button>
        <button type="button" class="rd-pay-link" onclick="rdPayCalShift(1)">Next</button>
      </div>
      <div class="rd-pay-cal__legend">
        <span><i class="is-red"></i> Overdue or at-risk</span>
        <span><i class="is-amber"></i> Due this month</span>
        <span><i class="is-blue"></i> Scheduled and funded</span>
        <span>Colour never encodes size.</span>
      </div>
      <div class="rd-pay-calgrid">
        ${weekdays.map(d => `<div class="rd-pay-calgrid__dow">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>`;
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

  function linkedVendor(p) {
    if (typeof findRecordById === 'function' && p.vendorId) {
      const byId = findRecordById('vendors', p.vendorId);
      if (byId) return byId;
    }
    if (typeof findVendorByName === 'function') return findVendorByName(payVendor(p));
    return null;
  }
  function instalmentIndex(p) {
    const list = Array.isArray(p.installments) ? p.installments : [];
    if (list.length) {
      const unpaid = list.findIndex(inst => {
        const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : (inst.status || '');
        return st !== 'Paid';
      });
      return { n: (unpaid >= 0 ? unpaid : 0) + 1, of: list.length };
    }
    const c = payContract(p);
    if (!c) return { n: 1, of: 1 };
    const siblings = rows().filter(x => payContract(x) === c)
      .sort((a, b) => String(payDueDate(a) || '').localeCompare(String(payDueDate(b) || '')));
    const pos = siblings.indexOf(p);
    return { n: pos >= 0 ? pos + 1 : 1, of: Math.max(1, siblings.length) };
  }

  function drawerPaymentTab(p) {
    const overdue = payPill(p).scheme === 'red';
    const proposed = window._payProposedDate && window._payProposedDate.id === payId(p)
      ? window._payProposedDate.date : '';
    const idx = instalmentIndex(p);
    const d = daysUntil(payDueDate(p));
    const c = payContract(p);
    const siblings = c
      ? rows().filter(x => payContract(x) === c)
      : [];
    const remainAfter = siblings.reduce((n, x) => {
      if (x === p) return n;
      return n + Math.max(0, payDue(x) - payPaid(x));
    }, 0);
    const cat = payCategory(p);
    const budgetLine = p.budgetItem || '';
    return drawerSectionTitle('The instalment')
      + fieldInput('Amount', 'due', (parseFloat(p.due) || 0).toFixed(2), { type: 'number', step: '0.01' })
      + fieldRow('Instalment', idx.n + ' of ' + idx.of)
      + fieldInput('Due', 'date', String(p.date || '').slice(0, 10), { type: 'date', over: overdue })
      + fieldSelect('Status', 'status', (function () { const n = typeof normalizePaymentStatus === 'function' ? normalizePaymentStatus(p.status || '') : p.status; return n || payStatus(p); })(), statusOptions())
      + fieldRow('Days out', d == null ? '—' : String(d), { over: d != null && d < 0 })
      + drawerSectionTitle('Against')
      + fieldRow('Contract', c ? esc(c.name || c.doc || c.vendor || 'Contract') : '—', { link: !!c, muted: !c })
      + fieldSelect('Budget category', 'budgetCat', cat, categoryOptions())
      + fieldRow('Line item', budgetLine || '—', { muted: !budgetLine })
      + (proposed
        ? `<p class="rd-drawer-callout is-warn">Calendar proposed ${esc(shortDate(proposed, true))} as a new due date. This instalment is held by a contract, so the date was not rewritten. Open the Contract tab.</p>`
        : (remainAfter
          ? `<p class="rd-drawer-callout is-warn">Paying this leaves ${money0(remainAfter)} outstanding across the rest of the schedule${cat ? ', and writes through to the ' + esc(cat) + ' category' : ''}.</p>`
          : '<p class="rd-drawer-callout">One instalment. Amount, date and the state it is in — never a running balance, which belongs to the contract.</p>'))
      + (c && (c.cancelNote || c.cancellation || /forfeit|cancel/i.test(String(c.notes || '')))
        ? drawerSectionTitle('If it is missed') + `<p class="rd-drawer-note">${esc(c.cancelNote || c.cancellation || c.notes)}</p>`
        : '');
  }

  function drawerContractTab(p) {
    const c = payContract(p);
    const list = typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []);
    const proposed = window._payProposedDate && window._payProposedDate.id === payId(p)
      ? window._payProposedDate.date : '';
    if (!c) {
      return '<div class="rd-pay-empty">No contract is wired to this instalment. The paper owns its own totals — link one from the Full editor if this cash-out is held by signed terms.</div>'
        + '<button type="button" class="rd-btn" onclick="showPanel(\'contracts\')">Open Contracts &amp; Invoices</button>';
    }
    const siblings = rows().filter(x => payContract(x) === c)
      .sort((a, b) => String(payDueDate(a) || '').localeCompare(String(payDueDate(b) || '')));
    const total = parseFloat(c.total) || parseFloat(c.amount) || siblings.reduce((n, x) => n + payDue(x), 0);
    const paidOnContract = siblings.reduce((n, x) => n + payPaid(x), 0);
    const remainAfter = Math.max(0, total - paidOnContract - (isSettled(p) ? 0 : payDue(p)));
    const signed = c.signed || c.signedOn || c.signedBy || c.status || '';
    const planRows = Array.isArray(p.installments) && p.installments.length
      ? p.installments.map((inst, j) => {
        const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : (inst.status || '');
        const isThis = (st !== 'Paid' && !p.installments.slice(0, j).some(x => {
          const s = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(x) : (x.status || '');
          return s !== 'Paid';
        }));
        return { label: (j + 1) + ' · ' + (inst.label || 'Instalment'), when: inst.paidDate ? 'Paid ' + shortDate(inst.paidDate) : (inst.dueDate ? 'Due ' + shortDate(inst.dueDate) : '—'), thisRow: isThis, paid: st === 'Paid' };
      })
      : siblings.map((x, j) => ({
        label: (j + 1) + ' · ' + (payDesc(x) || nextInstalmentLabel(x)),
        when: isSettled(x) ? 'Paid ' + shortDate(x.paiddate || payDueDate(x)) : (payDueDate(x) ? 'Due ' + shortDate(payDueDate(x)) : '—'),
        thisRow: x === p,
        paid: isSettled(x)
      }));
    const docs = c.docs || c.documents || c.files;
    const docCount = Array.isArray(docs) ? docs.length : (parseInt(c.docCount, 10) || 0);
    return drawerSectionTitle((c.vendor || payVendor(p) || 'Contract') + (signed ? ' · ' + signed : ''))
      + drawerKv('Total', money0(total))
      + drawerKv('Paid to date', money0(paidOnContract), 'paid')
      + drawerKv('This instalment', money0(payDue(p)))
      + drawerKv('Remaining after', money0(remainAfter), remainAfter ? 'over' : 'paid')
      + drawerSectionTitle('Schedule · ' + planRows.length + ' instalment' + (planRows.length === 1 ? '' : 's'))
      + (planRows.length
        ? `<div class="rd-pay-sched">${planRows.map(r =>
          `<div class="rd-pay-sched__row${r.thisRow ? ' is-this' : ''}"><span>${esc(r.label)}${r.thisRow ? ' <em>· this</em>' : ''}</span><span class="${r.paid ? 'is-paid' : (r.thisRow ? 'is-warn' : '')}">${esc(r.when)}</span></div>`
        ).join('')}</div>`
        : '<div class="rd-pay-empty">This is the only payment on the contract.</div>')
      + (proposed
        ? `<p class="rd-drawer-callout is-warn">${esc(payVendor(p) || 'This vendor')}&rsquo;s contract sets the due date. Calendar asked for ${esc(shortDate(proposed, true))} — change the date on the contract, not here.</p>`
        : '<p class="rd-drawer-callout">The paper this instalment came from, and where it sits in the schedule. Read-only here — the contract owns its own totals.</p>')
      + drawerKv('Signed by', signed || '—', /both|signed/i.test(String(signed)) ? 'paid' : '')
      + drawerKv('Documents', docCount ? docCount + ' on file' : '—');
  }

  function drawerMethodTab(p) {
    const cat = payCategory(p);
    const v = linkedVendor(p);
    const ref = p.reference || p.ref || '';
    const payer = p.payer || p.paidBy || '';
    const acct = (v && (v.accountName || v.bankAccount || v.payee)) || payVendor(p) || '';
    const bank = (v && (v.bank || v.bankName)) || '';
    const last4 = (v && (v.accountLast4 || v.account)) || '';
    const verified = (v && (v.verified || v.verifiedOn)) || '';
    return drawerSectionTitle('Payment method')
      + fieldSelect('Method', 'ptype', payMethod(p), methodOptions())
      + fieldSelect('From', 'budgetCat', cat, categoryOptions())
      + fieldRow('Reference', ref || '—', { muted: !ref })
      + fieldRow('Payer', payer || '—', { muted: !payer })
      + drawerSectionTitle('Vendor details')
      + fieldRow('Account name', acct || '—', { muted: !acct })
      + fieldRow('Bank', bank || '—', { muted: !bank })
      + fieldRow('Account', last4 ? (String(last4).indexOf('•') >= 0 ? last4 : '•••• ' + String(last4).slice(-4)) : '—', { muted: !last4 })
      + fieldRow('Verified', verified || '—', { muted: !verified })
      + '<p class="rd-drawer-callout is-warn">Re-verify before sending — changed bank details on an emailed invoice are the common fraud here.</p>'
      + fieldRow('Receipt required', p.receiptRequired === false ? 'No' : 'Yes')
      + fieldRow('Receipt on file', p.receipt || p.receiptOnFile ? 'Yes' : 'No', { over: !(p.receipt || p.receiptOnFile) })
      + fieldRow('Reminder', p.reminder || '—', { muted: !p.reminder })
      + '<p class="rd-drawer-callout">How it will actually be paid, and from which pot. The tab that stops two people paying the same invoice twice.</p>';
  }

  function drawerHistoryTab(p) {
    const log = typeof recordHistoryFor === 'function' ? recordHistoryFor('payments', payId(p)) : [];
    const events = [];
    log.forEach(entry => {
      const when = entry.iso || ((entry.date || '') + 'T' + (entry.time || '12:00'));
      (entry.changes || []).forEach(ch => {
        const field = (ch.label || ch.field || '').toLowerCase();
        let what = (ch.label || ch.field || 'Field') + ' ' + (ch.from || '—') + ' → ' + (ch.to || '—');
        let derived = '';
        if (field.indexOf('date') >= 0 || field === 'due') {
          derived = '→ Payments calendar re-flowed';
        } else if (field.indexOf('due') >= 0 || field.indexOf('amount') >= 0 || field === 'paid') {
          derived = '→ Money tab figures re-derived from this edit';
        }
        events.push({ when: when, date: entry.date, time: entry.time, who: entry.who || entry.action || '', what: what, derived: derived, tone: 'gold' });
      });
      if (!(entry.changes || []).length) {
        events.push({ when: when, date: entry.date, time: entry.time, who: entry.who || '', what: entry.action || 'Edited', derived: '', tone: 'gold' });
      }
    });
    if (p.paiddate) events.push({ when: p.paiddate, date: p.paiddate, what: 'Marked paid · ' + money0(payPaid(p)), derived: '', tone: 'green' });
    (Array.isArray(p.installments) ? p.installments : []).forEach(inst => {
      if (inst.paidDate) events.push({ when: inst.paidDate, date: inst.paidDate, what: (inst.label || 'Instalment') + ' paid · ' + money0(inst.amountPaid), derived: '', tone: 'green' });
    });
    if (!events.length && p.date) {
      events.push({ when: p.date, date: p.date, what: 'Instalment created' + (contractLabel(p) ? ' with the contract' : ''), derived: '', tone: 'gold' });
    }
    events.sort((a, b) => String(b.when).localeCompare(String(a.when)));
    const rowsHtml = events.length
      ? events.map(e => {
        const meta = [e.who, e.date ? shortDate(e.date, true) : '', e.time].filter(Boolean).join(' · ');
        return `<div class="rd-pay-histline"><i class="is-${esc(e.tone || 'gold')}"></i><div><div class="rd-pay-histline__what">${esc(e.what)}</div>${e.derived ? `<div class="rd-pay-histline__derived">${esc(e.derived)}</div>` : ''}${meta ? `<div class="rd-pay-histline__meta">${esc(meta)}</div>` : ''}</div></div>`;
      }).join('')
      : '<div class="rd-pay-empty">No dated activity on this payment yet.</div>';
    return rowsHtml
      + '<p class="rd-drawer-callout is-ok">An amount edit re-derives the contract total, the category percentage and the Dashboard money figure. That is why it confirms first.</p>';
  }

  function drawerFootHtml(tabIdx, p) {
    if (tabIdx === 0) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPayDrawerMarkPaid()">${isSettled(p) ? 'Mark unpaid' : 'Mark paid'}</button>`
        + '<button type="button" class="rd-btn" onclick="rdPayDrawerReschedule()">Reschedule</button>';
    }
    if (tabIdx === 1) {
      return '<button type="button" class="rd-btn rd-btn--primary" onclick="showPanel(\'contracts\')">Open contract</button>'
        + '<button type="button" class="rd-btn" onclick="rdPayJumpTo(\'pay-sect-tracker\')">View schedule</button>';
    }
    if (tabIdx === 2) {
      return `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPayDrawerSave({quiet:true});rdPayDrawerMarkPaid()">${isSettled(p) ? 'Mark unpaid' : 'Mark paid'}</button>`
        + '<button type="button" class="rd-btn" onclick="rdPayDrawerCopyMethod()">Copy details</button>';
    }
    return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPayCloseDrawer()">Close</button>'
      + '<button type="button" class="rd-btn" onclick="rdPayDrawerExport()">Export record</button>';
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
    const pills = [
      { label: money0(payDue(p)), scheme: 'gray' },
      { label: payDueDate(p) ? 'Due ' + shortDate(payDueDate(p)) : 'No due date', scheme: 'gold' },
      isSettled(p) ? { label: 'Paid', scheme: 'green' } : { label: 'Unpaid', scheme: 'red' }
    ];

    let body;
    if (tabIdx === 0) body = drawerPaymentTab(p);
    else if (tabIdx === 1) body = drawerContractTab(p);
    else if (tabIdx === 2) body = drawerMethodTab(p);
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
      <div class="rd-drawer__foot">${drawerFootHtml(tabIdx, p)}</div>
    </aside>`;
    const slotEl = slot.querySelector('.rd-drawer__body');
    if (slotEl) {
      slotEl.querySelectorAll('[data-payf]').forEach(el => {
        el.addEventListener('change', () => rdPayDrawerSave({ quiet: true }));
      });
    }
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
  function rdPayDrawerSave(opts) {
    opts = opts || {};
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    const slot = document.getElementById('payments-drawer-slot');
    if (!p || !slot) return;
    const before = typeof recordClone === 'function' ? recordClone(p) : JSON.parse(JSON.stringify(p));
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
    if (typeof recordHistoryLog === 'function') recordHistoryLog('payments', before, p);
    syncBudget();
    persist();
    rerender();
    if (!opts.quiet && typeof toast === 'function') toast('Payment saved');
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
    window._payMode = 'table';
    window._payJumpSection = sectionId || '';
    renderPaymentsRd();
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function applyPaymentsRailView(view) {
    window._payRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('payments', window._payRailView);
    rerender();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('payments');
  }
  function rdPaySetMode(mode) {
    window._payMode = mode === 'calendar' ? 'calendar' : 'table';
    renderPaymentsRd();
  }
  function applyPayViewMode() {
    const cal = window._payMode === 'calendar';
    const page = document.querySelector('#panel-payments .rd-page');
    if (page) {
      page.classList.toggle('is-pay-calendar', cal);
      page.classList.toggle('is-pay-table', !cal);
    }
    const tracker = document.getElementById('pay-sect-tracker');
    const insight = document.getElementById('payment-insight');
    if (tracker) tracker.hidden = cal;
    if (insight) insight.hidden = cal;
  }
  function rdPayCalShift(dir) {
    const [y, m] = payCalCursor().split('-').map(Number);
    const d = new Date(y, m - 1 + (dir || 0), 1);
    window._payCalCursor = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    renderPaymentsTable();
  }
  function rdPayCalDrag(ev, id) {
    if (ev.dataTransfer) {
      ev.dataTransfer.setData('text/plain', String(id));
      ev.dataTransfer.effectAllowed = 'move';
    }
    window._payCalDragId = String(id);
  }
  function applyDueDate(p, iso) {
    const before = typeof recordClone === 'function' ? recordClone(p) : JSON.parse(JSON.stringify(p));
    if (contractIsLinked(p)) {
      window._payProposedDate = { id: payId(p), date: iso };
      window._payDrawerId = payId(p);
      window._payDrawerTab = 1;
      renderPaymentsDrawer();
      if (typeof toast === 'function') {
        toast((payVendor(p) || 'Vendor') + '’s contract sets this date — it was not rewritten.');
      }
      return false;
    }
    window._payProposedDate = null;
    p.date = iso;
    if (Array.isArray(p.installments) && p.installments.length) {
      const next = p.installments.find(inst => {
        const st = typeof paymentInstallmentStatus === 'function' ? paymentInstallmentStatus(inst) : inst.status;
        return st !== 'Paid';
      }) || p.installments[0];
      if (next) next.dueDate = iso;
    }
    if (typeof recordHistoryLog === 'function') recordHistoryLog('payments', before, p);
    persist();
    rerender();
    if (typeof toast === 'function') toast('Due date moved to ' + shortDate(iso, true));
    return true;
  }
  function rdPayCalDrop(ev, iso) {
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    const id = (ev.dataTransfer && ev.dataTransfer.getData('text/plain')) || window._payCalDragId;
    window._payCalDragId = null;
    if (!id || !iso) return;
    const p = rowById(id);
    if (!p) return;
    applyDueDate(p, iso);
  }
  function rdPayCalToday() {
    const t = new Date();
    window._payCalCursor = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');
    renderPaymentsTable();
  }
  function rdPayCalUnpaidOnly() {
    window._payCalUnpaid = !window._payCalUnpaid;
    renderPaymentsTable();
  }
  function rdPayCalAddOn(iso) {
    const list = typeof safeArray === 'function' ? safeArray(data.payments) : (data.payments || (data.payments = []));
    const row = {
      vendor: '', desc: '', due: 0, paid: 0, gratuity: 0, gratuityStatus: 'Not Planned',
      date: iso, paiddate: '', ptype: '', status: 'Not Paid', notes: '',
      installments: [], budgetCat: ''
    };
    if (typeof ensureRowId === 'function') ensureRowId(row, 'payments');
    list.push(row);
    persist();
    window._payDrawerId = payId(row);
    window._payDrawerTab = 0;
    rerender();
  }
  async function rdPayDrawerReschedule() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p) return;
    const cur = String(payDueDate(p) || p.date || '').slice(0, 10);
    const iso = typeof covPrompt === 'function'
      ? await covPrompt('New due date (YYYY-MM-DD)', { value: cur })
      : window.prompt('New due date (YYYY-MM-DD)', cur);
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso).slice(0, 10))) return;
    applyDueDate(p, String(iso).slice(0, 10));
  }
  function rdPayDrawerCopyMethod() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p) return;
    const v = linkedVendor(p);
    const lines = [
      'Method: ' + (payMethod(p) || '—'),
      'From: ' + (payCategory(p) || '—'),
      'Vendor: ' + (payVendor(p) || '—'),
      v && (v.accountName || v.bank) ? 'Payee: ' + (v.accountName || v.bank) : ''
    ].filter(Boolean).join('\n');
    const done = () => { if (typeof toast === 'function') toast('Payment details copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lines).then(done).catch(done);
    } else {
      done();
    }
  }
  function rdPayDrawerExport() {
    const p = window._payDrawerId ? rowById(window._payDrawerId) : null;
    if (!p || typeof exportSectionCSV !== 'function') return;
    exportSectionCSV('Payment', [{
      Vendor: payVendor(p), Description: payDesc(p), Due: payDue(p), Paid: payPaid(p),
      Date: payDueDate(p), Status: payStatus(p), Method: payMethod(p), Category: payCategory(p)
    }]);
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
    applyPayViewMode();
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
  window.rdPayCalShift = rdPayCalShift;
  window.rdPayCalDrag = rdPayCalDrag;
  window.rdPayCalDrop = rdPayCalDrop;
  window.rdPayCalToday = rdPayCalToday;
  window.rdPayCalUnpaidOnly = rdPayCalUnpaidOnly;
  window.rdPayCalAddOn = rdPayCalAddOn;
  window.rdPayDrawerReschedule = rdPayDrawerReschedule;
  window.rdPayDrawerCopyMethod = rdPayDrawerCopyMethod;
  window.rdPayDrawerExport = rdPayDrawerExport;

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
