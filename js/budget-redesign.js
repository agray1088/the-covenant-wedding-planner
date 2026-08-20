/* Budget page — mock 4a + "Budget line item · 4a" drawer tabs (Batch 22).
   Rail + pagehead + 7-stat strip + budget-used bar, then every section in one
   scroll, in reading order: Budget by category → Reconciliation → True Total +
   Budget Logic → Tipping Etiquette → Itemized (grouped) → Pledged & paid.
   The 360px drawer is the full editor for a line item (Line item / Category /
   Payment / History) — same Money drawer language as Contract · 10c.

   Every figure is derived from the planner's own budget math (catSpent,
   catPlanned, budgetItemActual, computeTrueTotalProjection, budgetContributors)
   so nothing on this page is a second source of truth. */
(function () {
  'use strict';

  const BGT_DRAWER_TABS = ['Line item', 'Category', 'Payment', 'History'];

  const RD_BGT_COLUMNS = [
    { key: 'name', label: 'Item' },
    { key: 'vendor', label: 'Vendor', width: '130px' },
    { key: 'qty', label: 'Qty', width: '58px', align: 'right' },
    { key: 'unit', label: 'Unit', width: '82px', align: 'right' },
    { key: 'estimate', label: 'Estimate', width: '96px', align: 'right' },
    { key: 'paid', label: 'Paid', width: '92px', align: 'right' },
    { key: 'status', label: 'Status', width: '112px' },
    { key: 'contract', label: 'Contract', width: '96px' }
  ];

  /* The itemized table's column chooser. The select gutter is fixed: hiding it
     would strand the row checkboxes the bulk bar depends on. */
  const BGT_ITEM_SCOPE = 'budget-items';
  if (window.rdColumns) {
    window.rdColumns.register(BGT_ITEM_SCOPE,
      [{ key: 'tick', label: '', width: '36px', cls: 'rd-bgt-tick', fixed: true }].concat(
        RD_BGT_COLUMNS.map(c => ({
          key: c.key, label: c.label, width: c.width,
          num: c.align === 'right', cls: c.align === 'right' ? 'rd-bgt-th--num' : ''
        }))
      ),
      () => renderBudgetItemizedSection());
  }
  function bgtCols() {
    return window.rdColumns ? window.rdColumns.visible(BGT_ITEM_SCOPE) : [];
  }
  function bgtShows(key) {
    return window.rdColumns ? window.rdColumns.isVisible(BGT_ITEM_SCOPE, key) : true;
  }

  /* Customary gratuity guidance (Ghana + US). Ticks persist on
     data.setup.budgetTipping; "Add selected" writes real budget lines. */
  const TIPPING_ROWS = [
    { id: 'officiant', role: 'Officiant', customary: 'Gift or $100–300', when: 'Rehearsal or day of', by: 'Groom / best man', planned: 200 },
    { id: 'caterer', role: 'Caterer staff', customary: '15–20% or $50–100 each', when: 'End of reception', by: 'Planner', planned: 450 },
    { id: 'photographer', role: 'Photographer', customary: 'Optional · $100–200', when: 'After the send-off', by: 'Couple', planned: 150 },
    { id: 'dj', role: 'DJ / band', customary: '$50–150 each', when: 'End of the night', by: 'Best man', planned: 200 },
    { id: 'hairmakeup', role: 'Hair & makeup', customary: '15–20%', when: 'At the appointment', by: 'Bride', planned: 150 },
    { id: 'drivers', role: 'Delivery drivers', customary: '$5–20 each', when: 'On delivery', by: 'Planner', planned: 0 }
  ];

  window._budgetRailView = window._budgetRailView || 'all';
  window._budgetReconMode = window._budgetReconMode || 'category';
  window._budgetItemScope = window._budgetItemScope || 'all';
  window._budgetItemFilters = window._budgetItemFilters || { category: 'all', vendor: 'all', status: 'all' };
  window._budgetItemSort = window._budgetItemSort || 'category';
  window._budgetItemSel = window._budgetItemSel || new Set();
  window._budgetDrawerRef = window._budgetDrawerRef || null;
  window._budgetDrawerTab = window._budgetDrawerTab || 0;
  window._budgetPledgeSel = window._budgetPledgeSel || new Set();
  /* Views 30a/30b: the page-level surface the toolbar switcher shows.
     'category' = By category + Itemized (default) · 'pledged' = Pledged &
     paid only · 'scroll' = every section, the original single-scroll page. */
  window._bgtMode = window._bgtMode || 'category';

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));

  function money(n) {
    const v = parseFloat(n) || 0;
    if (typeof fmt === 'function') return fmt(v);
    return '$' + Math.round(v).toLocaleString();
  }
  function money0(n) {
    const v = Math.round(parseFloat(n) || 0);
    return '$' + v.toLocaleString();
  }
  function dash(v, formatter) {
    const n = parseFloat(v) || 0;
    if (!n) return '<span class="rd-bgt-nil">—</span>';
    return (formatter || money0)(n);
  }
  function pctOf(part, whole) {
    const w = parseFloat(whole) || 0;
    if (w <= 0) return 0;
    return Math.round(((parseFloat(part) || 0) / w) * 100);
  }
  function clampPct(n) { return Math.max(0, Math.min(100, parseFloat(n) || 0)); }

  function cats() { return (typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || [])); }
  function catItems(c) { return (typeof safeArray === 'function' ? safeArray(c && c.items) : ((c && c.items) || [])); }

  function shortDate(d) {
    if (!d) return '—';
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const dt = new Date(s.slice(0, 10) + 'T12:00:00');
      if (!isNaN(dt)) return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return s;
  }

  /* ── item-level derivations ──────────────────────────────────────────── */

  function itemActual(it) { return typeof budgetItemActual === 'function' ? budgetItemActual(it) : (parseFloat(it && (it.actual || it.cost)) || 0); }
  function itemEstimate(it) { return typeof itemBudgeted === 'function' ? itemBudgeted(it) : (parseFloat(it && it.budgeted) || 0); }
  function itemStatusRaw(it) { return typeof budgetStatus === 'function' ? budgetStatus(it) : (it && it.status) || 'Pending'; }

  function itemPaidAmount(it) {
    const st = itemStatusRaw(it);
    if (st === 'Paid') return itemActual(it);
    if (parseFloat(it && it.paidAmount)) return parseFloat(it.paidAmount) || 0;
    if (st === 'Partial') {
      const dep = typeof budgetItemLinkedActual === 'function' ? budgetItemLinkedActual(it) : 0;
      return dep > 0 ? dep : 0;
    }
    return 0;
  }

  function itemQty(it) {
    const q = parseFloat(it && it.qty);
    return q > 0 ? q : 1;
  }
  function itemUnit(it) {
    const u = parseFloat(it && it.unitPrice);
    if (u > 0) return u;
    const q = itemQty(it);
    return q > 0 ? itemEstimate(it) / q : itemEstimate(it);
  }

  function itemVendorName(it) {
    if (!it) return '';
    if (it.vendor) return String(it.vendor);
    if (it.paymentId) {
      const p = (typeof safeArray === 'function' ? safeArray(data.payments) : []).find(x => String(x._id) === String(it.paymentId));
      if (p && (p.vendor || p.payee || p.name)) return String(p.vendor || p.payee || p.name);
    }
    if (it.vendorId) {
      const v = (typeof safeArray === 'function' ? safeArray(data.vendors) : []).find(x => String(x._id) === String(it.vendorId));
      if (v && (v.name || v.vendor)) return String(v.name || v.vendor);
    }
    return '';
  }

  function itemHasContract(it) {
    if (!it) return false;
    if (it.contractId) return true;
    if (it.paymentLine) return true;
    const vend = itemVendorName(it);
    if (!vend) return false;
    return (typeof safeArray === 'function' ? safeArray(data.contracts) : []).some(c =>
      String(c.vendor || c.name || '').trim().toLowerCase() === vend.trim().toLowerCase());
  }

  function itemPill(it) {
    const est = itemEstimate(it);
    const act = itemActual(it);
    const st = itemStatusRaw(it);
    if (est > 0 && act > est) return { label: 'Over est.', scheme: 'red' };
    if (st === 'Paid') return { label: 'Paid', scheme: 'green' };
    if (st === 'Partial') return { label: 'Deposit', scheme: 'gold' };
    if (it && it.paymentLine && itemPaidAmount(it) > 0) return { label: 'Balance due', scheme: 'gold' };
    return { label: 'Not paid', scheme: 'gray' };
  }
  function pillHtml(p) {
    return '<span class="status-pill" data-pillscheme="' + p.scheme + '">' + esc(p.label) + '</span>';
  }

  /* ── page-level derivations ──────────────────────────────────────────── */

  function catSpentOf(c) { return typeof catSpent === 'function' ? catSpent(c) : catItems(c).reduce((s, it) => s + itemActual(it), 0); }
  function catTargetOf(c) { return typeof catPlanned === 'function' ? catPlanned(c) : (parseFloat(c && c.planned) || 0); }
  function catPaidOf(c) { return catItems(c).reduce((s, it) => s + itemPaidAmount(it), 0); }
  function catEntriesOf(c) { return catItems(c).filter(it => !it.paymentLine).reduce((s, it) => s + itemActual(it), 0); }
  function catPaymentsOf(c) { return catItems(c).filter(it => it.paymentLine).reduce((s, it) => s + itemActual(it), 0); }
  function catIsOver(c) { const t = catTargetOf(c); return t > 0 && catSpentOf(c) > t; }
  function catPaymentCount(c) { return catItems(c).filter(it => it.paymentLine).length; }

  function budgetFigures() {
    const list = cats();
    const overall = parseFloat(data.setup && data.setup.budget) || 0;
    const committed = list.reduce((s, c) => s + catSpentOf(c), 0);
    const paid = list.reduce((s, c) => s + catPaidOf(c), 0);
    const target = list.reduce((s, c) => s + catTargetOf(c), 0);
    const proj = typeof computeTrueTotalProjection === 'function' ? computeTrueTotalProjection() : null;
    const gratuity = proj ? proj.gratuity : 0;
    const unquoted = proj ? proj.buffer : 0;
    const trueTotal = proj ? proj.trueTotal : committed;
    const lineItems = list.reduce((s, c) => s + catItems(c).length, 0);
    return {
      overall: overall,
      target: target,
      committed: committed,
      paid: paid,
      outstanding: Math.max(0, committed - paid),
      remaining: overall - committed,
      committedPct: pctOf(committed, overall),
      trueTotal: trueTotal,
      gratuity: gratuity,
      unquoted: unquoted,
      projected: gratuity + unquoted,
      lineItems: lineItems,
      overCats: list.filter(catIsOver),
      entries: list.reduce((s, c) => s + catEntriesOf(c), 0),
      payments: list.reduce((s, c) => s + catPaymentsOf(c), 0)
    };
  }

  /* Rail views. A view narrows the category cards, the category table and the
     itemized table together, so the page always agrees with itself. */
  function catMatchesRailView(c, view) {
    view = view || window._budgetRailView || 'all';
    if (view === 'all') return true;
    if (view === 'over') return catIsOver(c);
    if (view === 'empty') return catSpentOf(c) <= 0;
    if (view === 'payments') return catPaymentCount(c) > 0;
    if (view === 'catering') return !!c.cateringOwned || /food|cater|drink|bar|cake|rental/i.test(String(c.cat || ''));
    if (view === 'gratuity') return catItems(c).some(it => /gratuity|tip/i.test(String(it.name || '')));
    return true;
  }
  function visibleCats() { return cats().filter(c => catMatchesRailView(c)); }

  function budgetRailCounts() {
    const list = cats();
    return {
      all: list.length,
      over: list.filter(catIsOver).length,
      empty: list.filter(c => catSpentOf(c) <= 0).length,
      payments: list.filter(c => catPaymentCount(c) > 0).length,
      catering: list.filter(c => catMatchesRailView(c, 'catering')).length,
      gratuity: list.filter(c => catMatchesRailView(c, 'gratuity')).length
    };
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    /* All.dc Budget pagehead leads with quiet "Import checklist" (same tertiary as Tasks). */
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdBudgetImportChecklist()">Import checklist</button>
      <button type="button" class="rd-btn rd-btn--quiet" onclick="printCurrentPage()">Print page</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Budget',budgetExportRows())">Export CSV</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdBudgetFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="addBudgetCategory()">+ Add category</button>`;
  }

  async function rdBudgetImportChecklist() {
    if (typeof rdChoose !== 'function') {
      if (typeof loadBudgetPreset === 'function') return loadBudgetPreset();
      return;
    }
    const choice = await rdChoose('Import checklist', ['Full categories', 'Full itemized budget']);
    if (choice === 'Full categories' && typeof loadBudgetPreset === 'function') {
      await loadBudgetPreset();
    } else if (choice === 'Full itemized budget' && typeof loadFullItemizedBudget === 'function') {
      await loadFullItemizedBudget();
    }
    if (typeof renderBudget === 'function') renderBudget();
    else renderBudgetRd();
  }
  window.rdBudgetImportChecklist = rdBudgetImportChecklist;

  function uedBudgetShellRd() {
    const panel = document.getElementById('panel-budget');
    if (!panel) return;
    panel.classList.add('ued-scope', 'budget-mockup');
    /* Views 30a/30b added a toolbar switcher above the used bar — bump the
       shell key when the anatomy changes so an already-mounted panel rebuilds
       instead of keeping the older markup. */
    if (panel.dataset.uedShell === 'budget-rd4b-views2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      renderBudgetViewSwitch();
      return;
    }
    panel.dataset.uedShell = 'budget-rd4b-views2';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Money</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Budget</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-bgt-viewbar" id="budget-viewbar">
        <span class="rd-bgt-eyebrow">Layout</span>
        <div class="rd-viewswitch" id="budget-viewswitch" role="group" aria-label="Budget view"></div>
        <span class="rd-bgt-viewbar__note" id="budget-viewbar-note"></span>
      </div>
      <div class="rd-toolbar" id="budget-toolbar"></div>
      <div class="rd-stats m-stats" id="budget-stats"></div>
      <div class="rd-bgt-usedbar" id="budget-used-bar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="budget-surface-row">
          <div class="rd-surface__main">
            <div class="rd-view rd-bgt-body" id="budget-body">
              <section class="rd-bgt-sect" id="bgt-sect-categories"></section>
              <section class="rd-bgt-sect" id="bgt-sect-recon"></section>
              <div class="rd-bgt-cols" id="bgt-sect-truetotal">
                <section class="rd-bgt-sect" id="bgt-sect-truetotal-card"></section>
                <section class="rd-bgt-sect" id="bgt-sect-logic"></section>
              </div>
              <section class="rd-bgt-sect" id="bgt-sect-tipping"></section>
              <section class="rd-bgt-sect" id="bgt-sect-itemized"></section>
              <section class="rd-bgt-sect" id="bgt-sect-pledged"></section>
            </div>
          </div>
          <div id="budget-drawer-slot"></div>
        </div>
      </div>
      <datalist id="budget-cat-options"></datalist>
    </div>`;
    renderBudgetViewSwitch();
  }

  /* Jump targets for the rail — mock 4a lists these under "Jump to". */
  const BGT_JUMPS = [
    { id: 'bgt-sect-categories', label: 'Budget by category' },
    { id: 'bgt-sect-recon', label: 'Reconciliation' },
    { id: 'bgt-sect-truetotal', label: 'True Total' },
    { id: 'bgt-sect-logic', label: 'Budget Logic' },
    { id: 'bgt-sect-tipping', label: 'Tipping Etiquette' },
    { id: 'bgt-sect-itemized', label: 'Itemized' },
    { id: 'bgt-sect-pledged', label: 'Pledged & paid' }
  ];

  /* The section ids every layout mode shows or hides together (Views 30a/30b).
     'scroll' is the original single-scroll page — every section, in order. */
  const BGT_SECTION_IDS = ['bgt-sect-categories', 'bgt-sect-recon', 'bgt-sect-truetotal', 'bgt-sect-tipping', 'bgt-sect-itemized', 'bgt-sect-pledged'];
  function bgtSectionVisible(id) {
    const m = window._bgtMode || 'category';
    if (m === 'scroll') return true;
    if (m === 'pledged') return id === 'bgt-sect-pledged';
    return id === 'bgt-sect-categories' || id === 'bgt-sect-itemized';
  }
  function applyBudgetSectionVisibility() {
    BGT_SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = !bgtSectionVisible(id);
    });
  }

  function budgetView() {
    /* Kept for rail callers that ask which "view" is active. */
    return window._bgtMode || 'category';
  }
  function bgtModeNote(m) {
    if (m === 'pledged') return 'Showing Pledged & paid only.';
    if (m === 'scroll') return 'Showing every section, one continuous scroll.';
    return 'Showing By category + Itemized.';
  }
  function renderBudgetViewSwitch() {
    const host = document.getElementById('budget-viewswitch');
    if (!host) return;
    const m = window._bgtMode || 'category';
    const item = (id, label) => `<button type="button" class="rd-viewswitch__item${m === id ? ' is-active' : ''}" onclick="rdBudgetSetView('${id}')">${esc(label)}</button>`;
    host.innerHTML = item('category', 'By category') + item('pledged', 'Pledged & paid') + item('scroll', 'All sections');
    const note = document.getElementById('budget-viewbar-note');
    if (note) note.textContent = bgtModeNote(m);
  }
  /* Views 30a/30b: the toolbar switcher jumps between showing primarily the
     By category surface, primarily Pledged & paid, or the full single-scroll
     page — Load full categories and Import checklist stay reachable in every
     mode that keeps the categories section on screen. */
  function rdBudgetSetView(mode) {
    window._bgtMode = (mode === 'pledged' || mode === 'scroll') ? mode : 'category';
    rerender();
    requestAnimationFrame(() => {
      const target = window._bgtMode === 'pledged' ? 'bgt-sect-pledged' : 'bgt-sect-categories';
      const el = document.getElementById(target);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ── stat strip (7 cells) ────────────────────────────────────────────── */

  function renderBudgetStatsRd() {
    const host = document.getElementById('budget-stats');
    if (!host) return;
    const f = budgetFigures();
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      const committedPct = f.overall ? f.committedPct : 0;
      RdDepth.renderStats(host, [
        { label: 'Total budget', value: money0(f.overall), filter: 'Show all categories' },
        { label: 'Committed', value: money0(f.committed), filter: 'Filter · Committed', target: f.overall ? { pct: committedPct, tick: 100 } : undefined },
        { label: 'Paid', value: money0(f.paid), filter: 'Filter · Paid', spark: f.overall ? [20, 28, 35, 42, 48, 55, 62, Math.min(100, f.paid && f.committed ? Math.round(f.paid / f.committed * 100) : 70)] : undefined },
        { label: 'Outstanding', value: money0(f.outstanding), filter: 'Filter · Outstanding' },
        {
          label: 'Remaining',
          value: money0(f.remaining),
          filter: 'Open reconciliation',
          attention: f.remaining < 0 ? 'Over your budget target' : undefined
        },
        { label: 'Committed %', value: f.overall ? f.committedPct + '%' : '—', filter: 'By category' },
        {
          label: 'True total',
          value: money0(f.trueTotal),
          filter: 'True Total',
          attention: f.overall && f.trueTotal > f.overall ? 'True total exceeds budget' : undefined
        }
      ]);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = [
      cell('Total budget', money0(f.overall)),
      cell('Committed', money0(f.committed)),
      cell('Paid', money0(f.paid)),
      cell('Outstanding', money0(f.outstanding)),
      cell('Remaining', money0(f.remaining), f.remaining < 0 ? 'warn' : ''),
      cell('Committed %', f.overall ? f.committedPct + '%' : '—'),
      cell('True total', money0(f.trueTotal), f.overall && f.trueTotal > f.overall ? 'warn' : '')
    ].join('');
  }

  /* ── budget-used bar ─────────────────────────────────────────────────── */

  function renderBudgetUsedBar() {
    const host = document.getElementById('budget-used-bar');
    if (!host) return;
    const f = budgetFigures();
    const base = f.overall > 0 ? f.overall : Math.max(1, f.committed + f.projected);
    const paidPct = clampPct(pctOf(f.paid, base));
    const unpaidPct = clampPct(pctOf(f.outstanding, base));
    const projPct = clampPct(pctOf(f.projected, base));
    const freePct = clampPct(100 - paidPct - unpaidPct - projPct);
    const free = Math.max(0, base - f.committed - f.projected);
    const legend = [
      ['paid', 'Paid'],
      ['unpaid', 'Committed, unpaid'],
      ['proj', 'Projected (gratuity + unquoted)'],
      ['free', 'Unallocated']
    ].map(([k, lab]) => `<span class="rd-bgt-legend__item"><span class="rd-bgt-swatch rd-bgt-swatch--${k}"></span>${esc(lab)}</span>`).join('');
    host.innerHTML = `<div class="rd-bgt-usedbar__main">
        <div class="rd-bgt-usedbar__top">
          <span class="rd-bgt-eyebrow">Budget used</span>
          <span class="rd-bgt-usedbar__breakdown">${money0(f.paid)} paid · ${money0(f.outstanding)} committed but unpaid · ${money0(f.projected)} projected · ${money0(free)} free</span>
          <span class="rd-bgt-usedbar__pct">${f.overall ? f.committedPct + '%' : '—'}</span>
        </div>
        <div class="rd-bgt-stack" role="img" aria-label="Budget used ${f.committedPct}%">
          <div class="rd-bgt-stack__seg rd-bgt-stack__seg--paid" style="width:${paidPct}%"></div>
          <div class="rd-bgt-stack__seg rd-bgt-stack__seg--unpaid" style="width:${unpaidPct}%"></div>
          <div class="rd-bgt-stack__seg rd-bgt-stack__seg--proj" style="width:${projPct}%"></div>
          <div class="rd-bgt-stack__seg rd-bgt-stack__seg--free" style="width:${freePct}%"></div>
        </div>
        <div class="rd-bgt-legend">${legend}</div>
      </div>
      <div class="rd-bgt-usedbar__side">
        <div class="rd-bgt-mini"><div class="rd-bgt-eyebrow">Over target</div><div class="rd-bgt-mini__val${f.overCats.length ? ' is-over' : ''}">${f.overCats.length}</div></div>
        <div class="rd-bgt-mini"><div class="rd-bgt-eyebrow">Line items</div><div class="rd-bgt-mini__val">${f.lineItems}</div></div>
        <div class="rd-bgt-mini"><div class="rd-bgt-eyebrow">Gratuity</div><div class="rd-bgt-mini__val">${money0(f.gratuity)}</div></div>
      </div>`;
  }

  /* ── shared section chrome ───────────────────────────────────────────── */

  function sectHead(eyebrow, note, right, opts) {
    opts = opts || {};
    return `<div class="rd-bgt-sect__head${opts.stack ? ' is-stacked' : ''}">
      <div class="rd-bgt-sect__headmain">
        <div class="rd-bgt-eyebrow">${esc(eyebrow)}</div>
        ${note ? `<${opts.stack ? 'p' : 'div'} class="rd-bgt-sect__note">${note}</${opts.stack ? 'p' : 'div'}>` : ''}
      </div>
      ${right ? `<div class="rd-bgt-sect__headright">${right}</div>` : ''}
    </div>`;
  }

  function barHtml(pct, tone, thin) {
    const p = clampPct(pct);
    return `<div class="rd-bgt-bar${thin ? ' is-thin' : ''}"><div class="rd-bgt-bar__fill${tone ? ' is-' + tone : ''}" style="width:${p}%"></div></div>`;
  }
  function barTone(spent, target) {
    if (target > 0 && spent > target) return 'over';
    if (target > 0 && spent / target >= 0.9) return 'warn';
    return '';
  }
  function varianceCell(v) {
    const n = Math.round(parseFloat(v) || 0);
    if (n === 0) return '<td class="rd-bgt-num">$0</td>';
    const cls = n > 0 ? 'is-under' : 'is-over';
    const sign = n > 0 ? '+' : '\u2212';
    return `<td class="rd-bgt-num ${cls}">${sign}${money0(Math.abs(n)).replace('$', '$')}</td>`;
  }

  /* ── §1 Budget by category ───────────────────────────────────────────── */

  function renderBudgetCategorySection() {
    const host = document.getElementById('bgt-sect-categories');
    if (!host) return;
    const all = cats();
    const shown = visibleCats();
    const showAll = typeof budgetShowAllCategories !== 'undefined' ? budgetShowAllCategories : false;
    const pageSize = typeof budgetVisibleCategoryCount !== 'undefined' ? budgetVisibleCategoryCount : 8;
    const page = typeof budgetCategoryPage !== 'undefined' ? budgetCategoryPage : 0;
    const cards = showAll ? shown : shown.slice(page * pageSize, page * pageSize + pageSize);
    const activeCat = all[typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0];

    const arrowSvg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"';
    const chev = 'viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"';

    const utilRow = `<div class="rd-bgt-utilrow">
      <button type="button" class="rd-btn" onclick="loadBudgetPreset()">Load full categories</button>
      <button type="button" class="rd-btn" onclick="loadFullItemizedBudget()">Load full itemized</button>
      <button type="button" class="rd-btn" onclick="rdBudgetChooseCategory(this)">Choose category<svg ${chev}><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-btn rd-btn--quiet" onclick="rdBudgetToggleShowAll()">${showAll ? 'Show 8 categories' : 'Show all categories'}</button>
      <div class="rd-bgt-utilrow__right">
        <span class="rd-bgt-count">Showing ${cards.length} of ${shown.length}</span>
        <span class="rd-bgt-pager">
          <button type="button" class="rd-bgt-pager__btn" ${page <= 0 || showAll ? 'disabled' : ''} onclick="rdBudgetSlide(-1)" aria-label="Previous categories"><svg ${arrowSvg}><path d="M15 5 8 12l7 7"/></svg></button>
          <button type="button" class="rd-bgt-pager__btn" ${showAll || (page + 1) * pageSize >= shown.length ? 'disabled' : ''} onclick="rdBudgetSlide(1)" aria-label="Next categories"><svg ${arrowSvg}><path d="m9 5 7 7-7 7"/></svg></button>
        </span>
      </div>
    </div>`;

    const cardRow = cards.length
      ? `<div class="rd-bgt-cards">${cards.map(c => {
        const ci = all.indexOf(c);
        const spent = catSpentOf(c);
        const target = catTargetOf(c);
        const pct = target > 0 ? Math.round((spent / target) * 100) : 0;
        const over = catIsOver(c);
        return `<button type="button" class="rd-bgt-card${c === activeCat ? ' is-active' : ''}${over ? ' is-over' : ''}" onclick="rdBudgetSelectCategory(${ci})">
          <span class="rd-bgt-card__name">${esc(c.cat || 'Category')}</span>
          <span class="rd-bgt-card__val">${money0(spent)}</span>
          ${barHtml(pct, barTone(spent, target))}
          <span class="rd-bgt-card__sub">of ${money0(target)} · ${pct}%</span>
        </button>`;
      }).join('')}</div>`
      : '<div class="rd-bgt-empty">No categories match this view. Load a preset or add your first category.</div>';

    const totalTarget = shown.reduce((s, c) => s + catTargetOf(c), 0);
    const totalSpent = shown.reduce((s, c) => s + catSpentOf(c), 0);
    const overall = parseFloat(data.setup && data.setup.budget) || 0;

    const rows = shown.map(c => {
      const ci = all.indexOf(c);
      const spent = catSpentOf(c);
      const target = catTargetOf(c);
      const pct = target > 0 ? Math.round((spent / target) * 100) : 0;
      const payN = catPaymentCount(c);
      const source = payN
        ? `<td class="rd-bgt-src is-linked">Payments · ${payN}</td>`
        : `<td class="rd-bgt-src is-manual">Manual entry</td>`;
      const owned = c.cateringOwned ? ' <span class="rd-bgt-owned">· owned by Catering &amp; Menu</span>' : '';
      return `<tr class="rd-bgt-catrow${c === activeCat ? ' is-active' : ''}" onclick="rdBudgetSelectCategory(${ci})">
        <td>${esc(c.cat || 'Category')}${owned}</td>
        <td class="rd-bgt-spendcell">${barHtml(pct, barTone(spent, target), true)}</td>
        <td class="rd-bgt-num rd-bgt-num--muted">${money0(target)}</td>
        <td class="rd-bgt-num">${spent ? money0(spent) : '<span class="rd-bgt-nil">$0</span>'}</td>
        ${varianceCell(target - spent)}
        ${source}
      </tr>`;
    }).join('');

    const totalPct = totalTarget > 0 ? Math.round((totalSpent / totalTarget) * 100) : 0;
    const totalRow = `<tr class="rd-bgt-totalrow">
      <td>Total</td>
      <td class="rd-bgt-spendcell">${barHtml(totalPct, barTone(totalSpent, totalTarget), true)}</td>
      <td class="rd-bgt-num">${money0(totalTarget)}</td>
      <td class="rd-bgt-num">${money0(totalSpent)}</td>
      ${varianceCell(totalTarget - totalSpent)}
      <td class="rd-bgt-src is-note">Budget set: ${money0(overall)}</td>
    </tr>`;

    host.innerHTML = sectHead('Budget by category',
      `${all.length} categor${all.length === 1 ? 'y' : 'ies'} · click a card to load its itemized table below`)
      + utilRow
      + cardRow
      + `<table class="cwp-table rd-bgt-table">
        <thead><tr>
          <th>Category</th>
          <th style="width:200px">Spend</th>
          <th class="rd-bgt-th--num" style="width:104px">Target</th>
          <th class="rd-bgt-th--num" style="width:104px">Actual</th>
          <th class="rd-bgt-th--num" style="width:110px">Variance</th>
          <th style="width:150px">Source</th>
        </tr></thead>
        <tbody>${rows}${shown.length ? totalRow : ''}
          <tr class="rd-bgt-addrow" onclick="addBudgetCategory()"><td>Add a category…</td><td colspan="5"></td></tr>
        </tbody>
      </table>`;
  }

  /* ── §2 Reconciliation ───────────────────────────────────────────────── */

  function reconVendorRows() {
    const map = {};
    cats().forEach(c => catItems(c).forEach(it => {
      const name = itemVendorName(it) || 'Unassigned';
      if (!map[name]) map[name] = { label: name, planned: 0, entries: 0, payments: 0 };
      map[name].planned += itemEstimate(it);
      if (it.paymentLine) map[name].payments += itemActual(it);
      else map[name].entries += itemActual(it);
    }));
    return Object.values(map).sort((a, b) => (b.entries + b.payments) - (a.entries + a.payments));
  }

  function renderBudgetReconSection() {
    const host = document.getElementById('bgt-sect-recon');
    if (!host) return;
    const mode = window._budgetReconMode === 'vendor' ? 'vendor' : 'category';
    const rows = mode === 'vendor'
      ? reconVendorRows()
      : visibleCats().map(c => ({ label: c.cat || 'Category', planned: catTargetOf(c), entries: catEntriesOf(c), payments: catPaymentsOf(c) }));

    const bodyRows = rows.map(r => {
      const spent = r.entries + r.payments;
      const pct = r.planned > 0 ? Math.round((spent / r.planned) * 100) : 0;
      const overPct = r.planned > 0 && spent > r.planned;
      return `<tr>
        <td>${esc(r.label)}</td>
        <td class="rd-bgt-num rd-bgt-num--muted">${dash(r.planned)}</td>
        <td class="rd-bgt-num">${dash(r.entries)}</td>
        <td class="rd-bgt-num">${dash(r.payments)}</td>
        <td class="rd-bgt-num">${spent ? money0(spent) : '<span class="rd-bgt-nil">$0</span>'}</td>
        <td class="rd-bgt-num${overPct ? ' is-over' : ' rd-bgt-num--muted'}">${r.planned > 0 ? pct + '%' : '—'}</td>
        ${varianceCell(r.planned - spent)}
      </tr>`;
    }).join('');

    const tPlanned = rows.reduce((s, r) => s + r.planned, 0);
    const tEntries = rows.reduce((s, r) => s + r.entries, 0);
    const tPayments = rows.reduce((s, r) => s + r.payments, 0);
    const tSpent = tEntries + tPayments;
    const totalRow = `<tr class="rd-bgt-totalrow">
      <td>Total</td>
      <td class="rd-bgt-num">${money0(tPlanned)}</td>
      <td class="rd-bgt-num">${money0(tEntries)}</td>
      <td class="rd-bgt-num">${money0(tPayments)}</td>
      <td class="rd-bgt-num">${money0(tSpent)}</td>
      <td class="rd-bgt-num">${tPlanned > 0 ? Math.round((tSpent / tPlanned) * 100) + '%' : '—'}</td>
      ${varianceCell(tPlanned - tSpent)}
    </tr>`;

    const toggle = `<div class="rd-viewswitch" role="group" aria-label="Reconciliation view">
      <button type="button" class="rd-viewswitch__item${mode === 'category' ? ' is-active' : ''}" onclick="rdBudgetSetReconMode('category')">By category</button>
      <button type="button" class="rd-viewswitch__item${mode === 'vendor' ? ' is-active' : ''}" onclick="rdBudgetSetReconMode('vendor')">By vendor</button>
    </div>`;

    host.innerHTML = sectHead('Budget reconciliation',
      'One roll-up of planned amounts, manual budget entries, synced payments, total spent and remaining variance.',
      toggle, { stack: true })
      + `<table class="cwp-table rd-bgt-table">
        <thead><tr>
          <th>${mode === 'vendor' ? 'Vendor' : 'Category'}</th>
          <th class="rd-bgt-th--num" style="width:110px">Planned</th>
          <th class="rd-bgt-th--num" style="width:130px">Budget entries</th>
          <th class="rd-bgt-th--num" style="width:110px">Payments</th>
          <th class="rd-bgt-th--num" style="width:110px">Spent</th>
          <th class="rd-bgt-th--num" style="width:90px">% used</th>
          <th class="rd-bgt-th--num" style="width:110px">Variance</th>
        </tr></thead>
        <tbody>${bodyRows}${rows.length ? totalRow : ''}</tbody>
      </table>`;
  }

  /* ── §3 True total projection ────────────────────────────────────────── */

  function emergencyCat() {
    return cats().find(c => /extra fees|emergency/i.test(String(c.cat || '')));
  }

  function renderBudgetTrueTotalSection() {
    const host = document.getElementById('bgt-sect-truetotal-card');
    if (!host) return;
    const f = budgetFigures();
    const emg = emergencyCat();
    const emgHeld = emg ? catTargetOf(emg) : 0;
    const headroom = f.overall - f.trueTotal;
    const overList = f.overCats.map(c => `${String(c.cat || 'category').toLowerCase()} by ${money0(catSpentOf(c) - catTargetOf(c))}`);
    const note = f.overall
      ? (headroom >= 0
        ? `${money0(headroom)} of headroom left.`
        : `${money0(Math.abs(headroom))} over the stated budget.`)
        + (overList.length
          ? ` ${overList.length === 1 ? 'One category is' : overList.length + ' categories are'} already over target — ${overList.join(' and ')}.`
          : ' No category is over target.')
      : 'Set a total budget on the Setup page to project headroom.';

    const row = (label, val, opts) => {
      opts = opts || {};
      return `<div class="rd-bgt-kv${opts.total ? ' is-total' : ''}">
        <span class="rd-bgt-kv__label">${label}</span>
        <span class="rd-bgt-kv__val${opts.muted ? ' is-muted' : ''}">${val}</span>
      </div>`;
    };

    host.innerHTML = sectHead('True total projection', 'What the day actually costs')
      + `<div class="rd-bgt-sect__body">
        <div class="rd-bgt-bignum">
          <span class="rd-bgt-bignum__val${f.overall && f.trueTotal > f.overall ? ' is-over' : ''}">${money0(f.trueTotal)}</span>
          <span class="rd-bgt-bignum__note">projected against a ${money0(f.overall)} budget</span>
        </div>
        <div class="rd-bgt-kvlist">
          ${row(`<span class="is-muted">Committed · ${money0(f.payments)} payments + ${money0(f.entries)} manual</span>`, money0(f.committed))}
          ${row('<span class="is-muted">Gratuity planned · ticked tipping rows</span>', '+ ' + money0(f.gratuity))}
          ${row('<span class="is-muted">Not yet quoted · buffer</span>', '+ ' + money0(f.unquoted))}
          ${row('<span class="is-muted">Emergency fund (held back)</span>', '\u2212 ' + money0(emgHeld), { muted: true })}
          ${row('True total', money0(f.trueTotal), { total: true })}
        </div>
        <p class="rd-bgt-callout${f.overall && headroom < 0 ? ' is-warn' : ''}">${esc(note)}</p>
      </div>`;
  }

  /* ── §4 Budget logic ─────────────────────────────────────────────────── */

  function renderBudgetLogicSection() {
    const host = document.getElementById('bgt-sect-logic');
    if (!host) return;
    const list = cats();
    const manual = list.filter(c => catPaymentCount(c) === 0);
    const linked = list.filter(c => catPaymentCount(c) > 0);
    const manualNames = manual.slice(0, 3).map(c => c.cat || 'category').join(', ');
    const gratuity = budgetFigures().gratuity;

    host.innerHTML = sectHead('Budget logic', 'How these numbers are produced')
      + `<div class="rd-bgt-sect__body rd-bgt-prose">
        <div><b>Planned</b> is what you set per category — either a target percentage of the total budget or a fixed dollar amount. Percentages recalculate when the total changes; fixed amounts don&rsquo;t.</div>
        <div><b>Spent</b> is budget entries plus synced payments, and a category is only ever counted in one of those two columns. The moment a payment record is linked to a category, that category&rsquo;s money moves wholly into Payments and its manual entries stop counting — so nothing double-counts.${manual.length && linked.length ? ` ${esc(manualNames)}${manual.length > 3 ? ' and others' : ''} ${manual.length === 1 ? 'is the only manual category' : 'are manual categories'} here; ${linked.length} ${linked.length === 1 ? 'is' : 'are'} payment-backed.` : ''}</div>
        <div><b>Category owners</b> — Catering &amp; Menu owns Food, Cake, Drinks and Rentals; Payments owns anything with a contract. Those rows are read-only here and edited on the page that owns them.</div>
        <div><b>Gratuity</b> is the sum of the ticked Tipping Etiquette rows — ${money0(gratuity)}. Where a vendor record already carries a gratuity that is the same money, counted once here, not added twice.</div>
        <div><b>Variance</b> is planned minus spent, so negative means over target. The Emergency fund is excluded from the True Total until you spend from it.</div>
      </div>`;
  }

  /* ── §5 Tipping etiquette ────────────────────────────────────────────── */

  function tippingState() {
    if (!data.setup) data.setup = {};
    if (!data.setup.budgetTipping || typeof data.setup.budgetTipping !== 'object') {
      /* First visit: tick the rows that carry a customary amount, matching 4a. */
      const seed = {};
      TIPPING_ROWS.forEach(r => { seed[r.id] = r.planned > 0 && r.id !== 'photographer'; });
      data.setup.budgetTipping = seed;
    }
    return data.setup.budgetTipping;
  }
  function tippingAmount(row) {
    const st = tippingState();
    const override = st['amt_' + row.id];
    const n = parseFloat(override);
    return n > 0 ? n : row.planned;
  }
  function tippingSelected() {
    const st = tippingState();
    return TIPPING_ROWS.filter(r => !!st[r.id] && tippingAmount(r) > 0);
  }

  function renderBudgetTippingSection() {
    const host = document.getElementById('bgt-sect-tipping');
    if (!host) return;
    const st = tippingState();
    const sel = tippingSelected();
    const selTotal = sel.reduce((s, r) => s + tippingAmount(r), 0);

    const rows = TIPPING_ROWS.map(r => {
      const on = !!st[r.id];
      const amt = tippingAmount(r);
      return `<tr class="rd-bgt-tiprow${on ? ' is-on' : ''}">
        <td class="rd-bgt-tick"><input type="checkbox" ${on ? 'checked' : ''} aria-label="Plan a gratuity for ${esc(r.role)}" onchange="rdBudgetToggleTip('${r.id}',this.checked)"></td>
        <td>${esc(r.role)}</td>
        <td class="rd-bgt-td--muted">${esc(r.customary)}</td>
        <td class="rd-bgt-td--muted">${esc(r.when)}</td>
        <td class="rd-bgt-td--muted">${esc(r.by)}</td>
        <td class="rd-bgt-num">${amt > 0 ? money0(amt) : '<span class="rd-bgt-nil">—</span>'}</td>
      </tr>`;
    }).join('');

    const action = `<button type="button" class="rd-btn" ${sel.length ? '' : 'disabled'} onclick="rdBudgetAddTipsToBudget()">Add ${sel.length} selected · ${money0(selTotal)}</button>`;

    host.innerHTML = sectHead('Tipping etiquette',
      'Customary in Ghana and the US — guidance, not obligation. Tick a row to add it to the budget as a planned gratuity.',
      action, { stack: true })
      + `<table class="cwp-table rd-bgt-table">
        <thead><tr>
          <th style="width:36px"></th>
          <th>Role</th>
          <th style="width:240px">Customary</th>
          <th style="width:200px">When</th>
          <th style="width:160px">Given by</th>
          <th class="rd-bgt-th--num" style="width:110px">Planned</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  /* ── §6 Itemized · all categories ────────────────────────────────────── */

  /* A flat row list annotated with its category, so one table can show every
     line item under per-category group headers without the CWP accessor's
     single-category scope. */
  function itemRefs() {
    const out = [];
    cats().forEach((c, ci) => {
      if (!catMatchesRailView(c)) return;
      catItems(c).forEach((it, ii) => out.push({ it: it, c: c, ci: ci, ii: ii }));
    });
    return out;
  }

  function refId(ref) { return String(ref.it._id || (ref.ci + ':' + ref.ii)); }

  function itemMatchesFilters(ref) {
    const f = window._budgetItemFilters || {};
    if (f.category && f.category !== 'all' && String(ref.c.cat || '') !== f.category) return false;
    if (f.vendor && f.vendor !== 'all' && itemVendorName(ref.it) !== f.vendor) return false;
    if (f.status && f.status !== 'all' && itemPill(ref.it).label !== f.status) return false;
    if (window._budgetItemScope === 'selected') {
      const active = cats()[typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0];
      if (ref.c !== active) return false;
    }
    return true;
  }

  function sortItemRefs(a, b) {
    const mode = window._budgetItemSort || 'category';
    if (mode === 'amount') return itemEstimate(b.it) - itemEstimate(a.it);
    if (mode === 'vendor') return itemVendorName(a.it).localeCompare(itemVendorName(b.it));
    if (mode === 'status') return itemPill(a.it).label.localeCompare(itemPill(b.it).label);
    if (mode === 'due') return String(a.it.due || '9999').localeCompare(String(b.it.due || '9999'));
    return 0;
  }

  function itemFilterChip(label, field, opts) {
    const cur = (window._budgetItemFilters || {})[field] || 'all';
    const on = cur !== 'all';
    const text = on ? (label + ': ' + cur) : (label + ': all');
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdBudgetOpenItemFilter('${field}',this)">${esc(text)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdBudgetClearItemFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function itemSortLabel() {
    const m = window._budgetItemSort || 'category';
    if (m === 'amount') return 'Sort by amount';
    if (m === 'vendor') return 'Sort by vendor';
    if (m === 'status') return 'Sort by status';
    if (m === 'due') return 'Sort by due date';
    return 'Sort by category';
  }

  function itemGroupHeader(c, groupRefs) {
    const spent = groupRefs.reduce((s, r) => s + itemActual(r.it), 0);
    const paid = groupRefs.reduce((s, r) => s + itemPaidAmount(r.it), 0);
    const target = catTargetOf(c);
    const n = groupRefs.length;
    const over = target > 0 && spent > target;
    return {
      html: `${esc(c.cat || 'Category')} · ${n} item${n === 1 ? '' : 's'} · ${money0(spent)} committed · ${money0(paid)} paid · target ${money0(target)}`,
      over: over
    };
  }

  function itemRowHtml(ref) {
    const it = ref.it;
    const id = refId(ref);
    const sel = window._budgetItemSel.has(id);
    const focus = window._budgetDrawerRef && window._budgetDrawerRef.id === id;
    const paidAmt = itemPaidAmount(it);
    const est = itemEstimate(it);
    const act = itemActual(it);
    const pill = itemPill(it);
    const over = est > 0 && act > est;
    const cls = ['rd-bgt-itemrow'];
    if (sel) cls.push('is-selected');
    if (focus) cls.push('is-drawer-focus');
    if (over) cls.push('is-over');
    if (it.paymentLine) cls.push('is-readonly');
    /* One cell per visible column, so hiding a column drops its data too. */
    const cell = key => {
      switch (key) {
        case 'tick': return `<td class="rd-bgt-tick" data-col="tick"><input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(it.name || 'line item')}" onclick="event.stopPropagation()" onchange="rdBudgetToggleItemSel('${esc(id)}',this.checked)"></td>`;
        case 'name': return `<td data-col="name">${esc(it.name || 'Line item')}${it.paymentLine ? ' <span class="rd-bgt-owned">· from Payments</span>' : ''}</td>`;
        case 'vendor': return `<td class="rd-bgt-td--muted" data-col="vendor">${itemVendorName(it) ? esc(itemVendorName(it)) : '<span class="rd-bgt-nil">—</span>'}</td>`;
        case 'qty': return `<td class="rd-bgt-num rd-bgt-num--muted" data-col="qty">${itemQty(it)}</td>`;
        case 'unit': return `<td class="rd-bgt-num rd-bgt-num--muted" data-col="unit">${money0(itemUnit(it))}</td>`;
        case 'estimate': return `<td class="rd-bgt-num" data-col="estimate">${est ? money0(est) : '<span class="rd-bgt-nil">—</span>'}</td>`;
        case 'paid': return `<td class="rd-bgt-num${paidAmt ? ' is-paid' : ''}" data-col="paid">${paidAmt ? money0(paidAmt) : '<span class="rd-bgt-nil">—</span>'}</td>`;
        case 'status': return `<td data-col="status">${pillHtml(pill)}</td>`;
        case 'contract': return `<td class="rd-bgt-src${itemHasContract(it) ? ' is-linked' : ' is-nil'}" data-col="contract">${itemHasContract(it) ? 'Contract' : '—'}</td>`;
        default: return '';
      }
    };
    return `<tr class="${cls.join(' ')}" data-bgt-id="${esc(id)}" onclick="rdBudgetOpenItemDrawer('${esc(id)}')">
      ${bgtCols().map(c => cell(c.key)).join('')}
    </tr>`;
  }

  function renderBudgetItemizedSection() {
    const host = document.getElementById('bgt-sect-itemized');
    if (!host) return;
    const f = budgetFigures();
    const allRefs = itemRefs();
    const refs = allRefs.filter(itemMatchesFilters);
    const bf = window._budgetItemFilters || {};
    const filterOn = ['category', 'vendor', 'status'].some(k => bf[k] && bf[k] !== 'all');
    if (typeof RdStates !== 'undefined' && RdStates.maybeEmpty &&
        (allRefs.length === 0 || (filterOn && refs.length === 0))) {
      const activeCat = cats()[typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0];
      const scope = window._budgetItemScope === 'selected' ? 'selected' : 'all';
      const head = `<div class="rd-bgt-sect__head is-stacked">
      <div class="rd-bgt-sect__headmain">
        <div class="rd-bgt-eyebrow">Itemized · ${scope === 'selected' ? esc(activeCat ? activeCat.cat : 'category') : 'all categories'}</div>
        <div class="rd-bgt-sect__title">${esc((typeof RdStates.copyFor === 'function' ? RdStates.copyFor('budget').heading : 'No budget lines yet'))}</div>
      </div></div>`;
      host.innerHTML = head + '<div id="cwp-budget-items" data-rd-state-slot="1"></div>';
      RdStates.maybeEmpty(host.querySelector('#cwp-budget-items'), {
        pageId: 'budget',
        total: allRefs.length,
        filtered: refs.length,
        filterOn: filterOn,
        onClear: function () {
          window._budgetItemFilters = { category: 'all', vendor: 'all', status: 'all' };
          renderBudgetItemizedSection();
        }
      });
      return;
    }
    const activeCat = cats()[typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0];
    const scope = window._budgetItemScope === 'selected' ? 'selected' : 'all';
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';

    /* Group in category order so the header lines read like the mockup. */
    const groups = [];
    refs.slice().sort(sortItemRefs).forEach(r => {
      let g = groups.find(x => x.c === r.c);
      if (!g) { g = { c: r.c, refs: [] }; groups.push(g); }
      g.refs.push(r);
    });
    if ((window._budgetItemSort || 'category') === 'category') {
      groups.sort((a, b) => cats().indexOf(a.c) - cats().indexOf(b.c));
      /* The selected category leads, the way clicking a card promises. */
      const ai = groups.findIndex(g => g.c === activeCat);
      if (ai > 0) groups.unshift(groups.splice(ai, 1)[0]);
    }

    /* Full-width rows span the select gutter plus every visible column. */
    const fullSpan = window.rdColumns ? window.rdColumns.span(BGT_ITEM_SCOPE) : 9;
    const restSpan = Math.max(1, fullSpan - 1);

    const bodyRows = groups.length
      ? groups.map(g => {
        const gh = itemGroupHeader(g.c, g.refs);
        return `<tr class="rd-bgt-grouprow${gh.over ? ' is-over' : ''}"><td colspan="${fullSpan}">${gh.html}</td></tr>`
          + g.refs.map(itemRowHtml).join('');
      }).join('') + `<tr class="rd-bgt-addrow" onclick="rdBudgetAddItem()"><td class="rd-bgt-tick">+</td><td colspan="${restSpan}">Add a line item…</td></tr>`
      : `<tr class="rd-bgt-addrow" onclick="rdBudgetAddItem()"><td class="rd-bgt-tick">+</td><td colspan="${restSpan}">No line items match these filters — add a line item…</td></tr>`;

    const head = `<div class="rd-bgt-sect__head is-stacked">
      <div class="rd-bgt-sect__headmain">
        <div class="rd-bgt-eyebrow">Itemized · ${scope === 'selected' ? esc(activeCat ? activeCat.cat : 'category') : 'all categories'}</div>
        <div class="rd-bgt-sect__title">${refs.length} line item${refs.length === 1 ? '' : 's'} across ${groups.length} categor${groups.length === 1 ? 'y' : 'ies'}</div>
        <div class="rd-bgt-sect__sub">${money0(f.committed)} committed · ${money0(f.paid)} paid${f.overCats.length ? ` · <span class="is-over">${f.overCats.length} categor${f.overCats.length === 1 ? 'y' : 'ies'} over target</span>` : ''}</div>
      </div>
      <div class="rd-bgt-sect__headright">
        <button type="button" class="rd-btn rd-btn--quiet" onclick="rdBudgetOpenCategoryDrawer()">Open category in drawer</button>
        <button type="button" class="rd-btn" onclick="rdBudgetToggleDetail()">${(typeof budgetDetailMode !== 'undefined' && budgetDetailMode === 'all') ? 'Hide details' : 'Show all details'}</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdBudgetAddItem()">+ Add item</button>
      </div>
    </div>`;

    const toolbar = `<div class="rd-toolbar rd-bgt-toolbar">
      ${itemFilterChip('Category', 'category')}
      ${itemFilterChip('Vendor', 'vendor')}
      ${itemFilterChip('Status', 'status')}
      <span class="rd-bgt-toolbar__sep"></span>
      <button type="button" class="rd-chip rd-chip--ghost" onclick="rdBudgetOpenItemSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${esc(itemSortLabel())}</button>
      <button type="button" class="rd-chip${window.rdColumns && !window.rdColumns.allShown(BGT_ITEM_SCOPE) ? '' : ' rd-chip--ghost'}" onclick="rdBudgetOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/></svg>${esc(window.rdColumns ? window.rdColumns.chipLabel(BGT_ITEM_SCOPE) : 'Columns')}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-chip" onclick="rdBudgetAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>
      <button type="button" class="rd-chip" onclick="rdBudgetCycleRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(rowHeightLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="rd-toolbar__right">
        <div class="rd-viewswitch" role="group" aria-label="Itemized scope">
          <button type="button" class="rd-viewswitch__item${scope === 'selected' ? ' is-active' : ''}" onclick="rdBudgetSetItemScope('selected')">Selected only</button>
          <button type="button" class="rd-viewswitch__item${scope === 'all' ? ' is-active' : ''}" onclick="rdBudgetSetItemScope('all')">All categories</button>
        </div>
      </div>
    </div>`;

    host.innerHTML = head + toolbar
      + '<div class="rd-bulkbar rd-bgt-bulkbar" id="budget-bulk-bar" hidden></div>'
      + `<div class="rd-bgt-tablewrap" id="cwp-budget-items" data-rd-row-height="${esc(rowHeightLabel())}">
        <table class="cwp-table rd-bgt-table rd-bgt-itemtable rd-table--${esc(rowHeightLabel())}">
          <thead><tr>${window.rdColumns ? window.rdColumns.headHtml(BGT_ITEM_SCOPE) : ''}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`
      + `<div class="rd-bgt-sect__foot">
        <span>The 360px drawer is the full editor — the Line item tab edits the row, the Category tab edits the group&rsquo;s name, target %, budget and note, History shows every change. Same component as the Guest List and Payments drawers.</span>
        <button type="button" class="rd-btn rd-btn--danger" onclick="rdBudgetDeleteCategory()">Delete category</button>
      </div>`;
    renderBudgetBulkBar();
  }

  /* ── §7b Pledged & paid, as its own jumpable/hideable surface (View 30b) ── */

  function renderBudgetPledgeSection() {
    const host = document.getElementById('bgt-sect-pledged');
    if (!host) return;
    host.innerHTML = pledgeBlockHtml();
  }

  function rowHeightKey() {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':budget';
  }
  function rowHeightLabel() {
    try { return localStorage.getItem(rowHeightKey()) || 'compact'; } catch (e) { return 'compact'; }
  }

  function renderBudgetBulkBar() {
    const bar = document.getElementById('budget-bulk-bar');
    if (!bar) return;
    const n = window._budgetItemSel.size;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep">|</span>
      <button type="button" class="rd-bulkbar__action" onclick="rdBudgetBulkSetVendor()">Set vendor</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdBudgetBulkSetStatus()">Set status</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdBudgetBulkMoveCategory()">Move category</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdBudgetBulkMarkPaid()">Mark paid</button>
      <button type="button" class="rd-bulkbar__action" onclick="showPanel('payments')">Link to payment</button>
      <button type="button" class="rd-bulkbar__clear rd-bulkbar__clear--danger" onclick="rdBudgetBulkDelete()">Delete</button>`;
  }

  /* ── §7 Pledged & paid ───────────────────────────────────────────────── */

  /* A pledge is not budget money until it lands. Received gifts reduce what the
     couple must find; promises are shown separately and never counted in the
     budget-used figure above. */
  function pledgeRows() {
    const rows = typeof budgetContributors === 'function' ? budgetContributors() : [];
    return rows.map(r => {
      const toward = r.items && r.items.length
        ? (r.items.length === 1 ? (r.items[0].cat || r.items[0].item || 'Unrestricted') : 'Multiple lines')
        : 'Unrestricted';
      const total = r.total || 0;
      const paid = r.paid || 0;
      const outstanding = Math.max(0, total - paid);
      let status = { label: 'Nothing yet', scheme: 'gray' };
      if (paid > 0 && outstanding <= 0) status = { label: 'Paid in full', scheme: 'green' };
      else if (paid > 0) status = { label: 'Part paid', scheme: 'gold' };
      const due = r.items && r.items.find(i => i.due);
      return {
        name: r.name,
        group: r.group || (/church|group|colleague|friend|small/i.test(String(r.name)) ? 'Community' : 'Family'),
        toward: toward,
        pledged: total,
        paid: paid,
        outstanding: outstanding,
        promisedBy: paid > 0 && outstanding <= 0 ? 'Paid' : (due ? shortDate(due.due) : ''),
        status: status
      };
    });
  }

  function pledgeBlockHtml() {
    const rows = pledgeRows();
    const pledged = rows.reduce((s, r) => s + r.pledged, 0);
    const received = rows.reduce((s, r) => s + r.paid, 0);
    const outstanding = Math.max(0, pledged - received);
    const pct = pctOf(received, pledged);
    const nOut = rows.filter(r => r.outstanding > 0).length;

    /* Where the received money went — by the category the gifted line sits in. */
    const byCat = {};
    (typeof budgetContributors === 'function' ? budgetContributors() : []).forEach(c =>
      (c.items || []).forEach(i => {
        if (i.status !== 'paid') return;
        const k = i.cat || 'Unrestricted';
        byCat[k] = (byCat[k] || 0) + (i.amount || 0);
      }));
    const catList = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).slice(0, 5);

    const stat = (label, val, sub, tone) =>
      `<div class="rd-bgt-pledge__stat"><div class="rd-bgt-eyebrow">${esc(label)}</div><div class="rd-bgt-pledge__val${tone ? ' is-' + tone : ''}">${val}</div><div class="rd-bgt-pledge__sub">${esc(sub)}</div></div>`;

    if (!rows.length) {
      return `<div class="rd-bgt-pledge">
        ${sectHead('Pledged & paid', 'Who promised what, and what has actually landed')}
        <div class="rd-bgt-empty">No pledges recorded yet. Add a gift amount and a name to any budget line and the contributor appears here.</div>
      </div>`;
    }

    const groups = [];
    rows.forEach(r => {
      let g = groups.find(x => x.name === r.group);
      if (!g) { g = { name: r.group, rows: [] }; groups.push(g); }
      g.rows.push(r);
    });

    const body = groups.map(g => {
      const gp = g.rows.reduce((s, r) => s + r.pledged, 0);
      const gpd = g.rows.reduce((s, r) => s + r.paid, 0);
      return `<tr class="rd-bgt-grouprow"><td colspan="8">${esc(g.name)} · ${g.rows.length} contributor${g.rows.length === 1 ? '' : 's'} · ${money0(gp)} pledged · ${money0(gpd)} paid</td></tr>`
        + g.rows.map(r => {
          const id = 'pledge:' + r.name;
          const sel = window._budgetPledgeSel.has(id);
          return `<tr class="rd-bgt-pledgerow${sel ? ' is-selected' : ''}">
            <td class="rd-bgt-tick"><input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(r.name)}" onchange="rdBudgetTogglePledgeSel('${esc(id)}',this.checked)"></td>
            <td><b>${esc(r.name)}</b></td>
            <td class="rd-bgt-td--muted">${esc(r.toward)}</td>
            <td class="rd-bgt-num">${money0(r.pledged)}</td>
            <td class="rd-bgt-num">${r.paid ? money0(r.paid) : '<span class="rd-bgt-nil">$0</span>'}</td>
            <td class="rd-bgt-num${r.outstanding ? ' is-over' : ''}">${r.outstanding ? money0(r.outstanding) : '<span class="rd-bgt-nil">$0</span>'}</td>
            <td class="rd-bgt-td--muted">${r.promisedBy ? esc(r.promisedBy) : '<span class="rd-bgt-nil">—</span>'}</td>
            <td>${pillHtml(r.status)}</td>
          </tr>`;
        }).join('');
    }).join('');

    /* Not pledged — money committed with no source behind it (group, not footnote). */
    const figs = budgetFigures();
    const shortfall = Math.max(0, (figs.committed || figs.planned || 0) - pledged);
    const notPledgedRow = shortfall > 0
      ? `<tr class="rd-bgt-grouprow is-residual"><td colspan="8">Not pledged · ${money0(shortfall)} committed with no source behind it</td></tr>
         <tr class="rd-bgt-pledgerow is-residual">
           <td class="rd-bgt-tick"></td>
           <td><b>Shortfall</b></td>
           <td class="rd-bgt-td--muted">Budget · unfunded</td>
           <td class="rd-bgt-num">—</td>
           <td class="rd-bgt-num"><span class="rd-bgt-nil">$0</span></td>
           <td class="rd-bgt-num is-over">${money0(shortfall)}</td>
           <td class="rd-bgt-td--muted">—</td>
           <td>${pillHtml({ label: 'Not pledged', scheme: 'red' })}</td>
         </tr>`
      : '';

    return `<div class="rd-bgt-pledge">
      ${sectHead('Pledged & paid',
      `Who promised what, and what has actually landed — ${money0(pledged)} pledged, ${money0(received)} received, ${money0(outstanding)} outstanding`,
      '<button type="button" class="rd-btn rd-btn--quiet" onclick="printCurrentPage()">Print pledge sheet</button>')}
      <div class="rd-bgt-pledge__stats">
        ${stat('Pledged', money0(pledged), rows.length + ' contributor' + (rows.length === 1 ? '' : 's'))}
        ${stat('Received', money0(received), pct + '% of pledges')}
        ${stat('Outstanding', money0(outstanding), nOut + ' contributor' + (nOut === 1 ? '' : 's'), outstanding ? 'over' : '')}
        ${stat('Applied to budget', money0(received), 'Offsets committed spend')}
        ${stat('Not pledged', money0(shortfall), shortfall ? 'Committed without a source' : 'Covered', shortfall ? 'over' : '')}
      </div>
      <div class="rd-bgt-pledge__bar">
        <span class="rd-bgt-eyebrow">Pledges collected</span>
        <div class="rd-bgt-pledgetrack">
          <div class="rd-bgt-pledgetrack__paid" style="width:${clampPct(pct)}%"></div>
          <div class="rd-bgt-pledgetrack__promised" style="width:${clampPct(100 - pct)}%"></div>
        </div>
        <span class="rd-bgt-pledge__barnote">${money0(received)} received · ${money0(outstanding)} promised</span>
        <span class="rd-bgt-pledge__barpct">${pct}%</span>
      </div>
      <table class="cwp-table rd-bgt-table">
        <thead><tr>
          <th style="width:34px"></th>
          <th>Contributor</th>
          <th style="width:200px">Toward</th>
          <th class="rd-bgt-th--num" style="width:110px">Pledged</th>
          <th class="rd-bgt-th--num" style="width:110px">Paid</th>
          <th class="rd-bgt-th--num" style="width:120px">Outstanding</th>
          <th style="width:130px">Promised by</th>
          <th style="width:140px">Status</th>
        </tr></thead>
        <tbody>${body}${notPledgedRow}
          <tr class="rd-bgt-addrow" onclick="rdBudgetAddItem()"><td class="rd-bgt-tick">+</td><td colspan="7">Record a pledge — name, amount, and what it is toward</td></tr>
        </tbody>
      </table>
      <div class="rd-bgt-pledge__foot">
        <div class="rd-bgt-pledge__footcol is-wide">
          <div class="rd-bgt-eyebrow">How pledges meet the budget</div>
          <p>A pledge is not budget money until it lands. Received pledges reduce what the couple must find themselves — ${money0(received)} of the ${money0(budgetFigures().paid)} already paid came from this table — while the ${money0(outstanding)} still promised is shown separately and never counted in the budget-used figure above.</p>
        </div>
        <div class="rd-bgt-pledge__footcol">
          <div class="rd-bgt-eyebrow">Where the ${money0(received)} went</div>
          <div class="rd-bgt-kvlist is-tight">${catList.length
        ? catList.map(k => `<div class="rd-bgt-kv"><span class="rd-bgt-kv__label is-muted">${esc(k)}</span><span class="rd-bgt-kv__val">${money0(byCat[k])}</span></div>`).join('')
        : '<div class="rd-bgt-kv"><span class="rd-bgt-kv__label is-muted">Nothing received yet</span><span class="rd-bgt-kv__val">$0</span></div>'}</div>
        </div>
        <div class="rd-bgt-pledge__footcol">
          <div class="rd-bgt-eyebrow">Chasing</div>
          <div class="rd-bgt-kvlist is-tight">
            <div class="rd-bgt-kv"><span class="rd-bgt-kv__label is-muted">Outstanding with a date</span><span class="rd-bgt-kv__val">${money0(rows.filter(r => r.outstanding > 0 && r.promisedBy).reduce((s, r) => s + r.outstanding, 0))}</span></div>
            <div class="rd-bgt-kv"><span class="rd-bgt-kv__label is-muted">No date given</span><span class="rd-bgt-kv__val is-over">${money0(rows.filter(r => r.outstanding > 0 && !r.promisedBy).reduce((s, r) => s + r.outstanding, 0))}</span></div>
          </div>
          <button type="button" class="rd-btn rd-btn--sm" onclick="showPanel('emails')">Send a reminder</button>
        </div>
      </div>
    </div>`;
  }

  /* ── the 360px drawer — "Budget line item · 4a" ──────────────────────── */

  function findRefById(id) {
    return itemRefs().find(r => refId(r) === String(id)) || null;
  }

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
      + ` data-bgtf="${key}" value="${esc(value == null ? '' : String(value))}"></div>`;
  }
  function fieldSelect(label, key, value, options) {
    return `<div class="rd-field-row"><span class="rd-field-row__label">${esc(label)}</span>`
      + `<select class="rd-field-row__value" data-bgtf="${key}">`
      + options.map(o => `<option value="${esc(o)}"${String(o) === String(value) ? ' selected' : ''}>${esc(o)}</option>`).join('')
      + '</select></div>';
  }
  function drawerSectionTitle(t) { return `<div class="rd-drawer-section-title">${esc(t)}</div>`; }
  function drawerKv(label, value, tone) {
    return `<div class="rd-drawer-kv"><span>${label}</span><span${tone ? ' class="is-' + tone + '"' : ''}>${value}</span></div>`;
  }

  function drawerLineItemTab(ref) {
    const it = ref.it;
    const est = itemEstimate(it);
    const act = itemActual(it);
    const over = est > 0 && act > est;
    const variance = act - est;
    return fieldRow('Vendor', (itemVendorName(it) ? esc(itemVendorName(it)) + ' →' : '—'), { link: !!itemVendorName(it) })
      + fieldInput('Quantity', 'qty', itemQty(it), { type: 'number', step: '1' })
      + fieldInput('Unit price', 'unitPrice', itemUnit(it).toFixed(2), { type: 'number', step: '0.01' })
      + fieldInput('Estimate', 'budgeted', est.toFixed(2), { type: 'number', step: '0.01' })
      + fieldInput('Actual', 'actual', act.toFixed(2), { type: 'number', step: '0.01', over: over })
      + fieldRow('Paid', money(itemPaidAmount(it)), { muted: !itemPaidAmount(it) })
      + fieldSelect('Status', 'status', itemStatusRaw(it), ['Pending', 'Partial', 'Paid'])
      + fieldInput('Due', 'due', (it.due || '').slice(0, 10), { type: 'date' })
      + (over
        ? `<p class="rd-drawer-callout is-warn">Actual exceeds estimate by ${money0(variance)}. The variance is carried on the category, not hidden on the line — ${esc(ref.c.cat || 'this category')} now reads ${money0(Math.max(0, catSpentOf(ref.c) - catTargetOf(ref.c)))} over.</p>`
        : '<p class="rd-drawer-callout">The line itself — quantity, unit price, estimate against actual. The one tab where a number is typed rather than derived.</p>')
      + (it.notes ? drawerSectionTitle('Notes') + `<div class="rd-drawer-note">${esc(it.notes)}</div>` : '');
  }

  function drawerCategoryTab(ref) {
    const c = ref.c;
    const target = catTargetOf(c);
    const spent = catSpentOf(c);
    const paid = catPaidOf(c);
    const variance = target - spent;
    const others = catItems(c).filter(it => it !== ref.it);
    return fieldRow('Category', esc(c.cat || 'Category') + ' →', { link: true })
      + fieldRow('Target %', (parseFloat(c.target) || 0) + '%')
      + fieldRow('Allowance', money(target))
      + fieldRow('Committed', money(spent), { over: spent > target && target > 0 })
      + fieldRow('Paid', money(paid))
      + fieldRow('Variance', variance >= 0 ? money0(variance) + ' under' : money0(Math.abs(variance)) + ' over', { over: variance < 0 })
      + fieldRow('Planning note', esc(c.tip || '—'))
      + drawerSectionTitle('Other lines in this category · ' + others.length)
      + (others.length
        ? others.map(it => drawerKv(esc(it.name || 'Line item'), money0(itemActual(it)),
          itemEstimate(it) > 0 && itemActual(it) > itemEstimate(it) ? 'over' : '')).join('')
        : '<div class="rd-drawer-kv"><span>Nothing else in this category yet</span><span>—</span></div>')
      + '<p class="rd-drawer-callout">Changing the category moves this money out of one allowance and into another. Both category totals re-derive; neither is typed.</p>';
  }

  function drawerPaymentTab(ref) {
    const it = ref.it;
    const f = budgetFigures();
    const payment = it.paymentId
      ? (typeof safeArray === 'function' ? safeArray(data.payments) : []).find(p => String(p._id) === String(it.paymentId))
      : null;
    const hasContract = itemHasContract(it);
    const scheduled = payment && payment.date
      ? shortDate(payment.date) + ' · ' + money0(payment.amount || itemEstimate(it))
      : '';
    const act = itemActual(it);
    /* Batch 22 / Contract · 10c: a missing contract is a stated warning in the
       tab that owns it — never left for a later reconciliation. */
    return fieldRow('Payment record', payment ? esc((payment.vendor || payment.payee || 'Payment')) + ' →' : '—', { link: !!payment })
      + fieldRow('Contract', hasContract ? 'On file' : 'None on file', { warn: !hasContract })
      + fieldRow('Scheduled', scheduled || '—', { muted: !scheduled })
      + fieldRow('Paid so far', money(itemPaidAmount(it)))
      + (hasContract
        ? '<p class="rd-drawer-callout">A contract covers this line, so the amount is held by signed terms rather than a verbal quote. Editing the contract total on Contracts &amp; Invoices re-derives this Budget row.</p>'
        : `<p class="rd-drawer-callout is-warn">No contract covers this line, so the ${money0(act)} is committed on a verbal quote. It counts toward the budget but nothing holds the vendor to it.</p>`)
      + drawerSectionTitle('Where this figure appears')
      + drawerKv('Budget · ' + esc(ref.c.cat || 'Category'), money0(act) + ' of ' + money0(catSpentOf(ref.c)), 'link')
      + drawerKv('Payments · ' + esc(itemVendorName(it) || 'unlinked'), payment ? 'In the ' + shortDate(payment.date) + ' instalment' : 'Not linked', 'link')
      + drawerKv('Contracts &amp; Invoices', hasContract ? 'Linked contract' : 'None on file', hasContract ? 'link' : 'warn')
      + drawerKv('Dashboard · money', 'Inside the ' + f.committedPct + '% used', 'link');
  }

  function drawerHistoryTab(ref) {
    const it = ref.it;
    const est = itemEstimate(it);
    const act = itemActual(it);
    const over = est > 0 && act > est;
    const all = itemRefs();
    const pos = all.findIndex(r => refId(r) === refId(ref));
    return drawerSectionTitle('This line')
      + (over ? drawerKv('Today · ' + esc((data.setup && data.setup.bride) || 'you'), 'actual ' + money0(est) + ' → ' + money0(act)) : '')
      + (it.notes ? drawerKv('Note added', esc(String(it.notes).slice(0, 40))) : '')
      + drawerKv(esc(shortDate(it.due) === '—' ? 'Created' : shortDate(it.due)), it.paymentLine ? 'Synced from Payments' : 'Created on this page')
      + `<p class="rd-drawer-callout">${over
        ? 'The variance appeared the moment the actual was typed. Nothing recalculated later and nothing needed saving — the category total is derived, so it moved in the same edit.'
        : 'Field-level history makes the derivation visible: a typed actual moves the category total in the same edit.'}</p>`
      + drawerSectionTitle('Snapshot')
      + drawerKv('Position', (pos + 1) + ' of ' + all.length)
      + drawerKv('Undo available', 'Yes', 'ok');
  }

  function renderBudgetDrawer() {
    const slot = document.getElementById('budget-drawer-slot');
    if (!slot) return;
    const ref = window._budgetDrawerRef ? findRefById(window._budgetDrawerRef.id) : null;
    if (!ref) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
      window._budgetDrawerRef = null;
      return;
    }
    const it = ref.it;
    const tabIdx = Math.min(Math.max(0, window._budgetDrawerTab | 0), BGT_DRAWER_TABS.length - 1);
    const est = itemEstimate(it);
    const act = itemActual(it);
    /* 4a shows the variance and the payment state side by side, so the header
       states the overage explicitly rather than collapsing to "Over est.". */
    const st = itemStatusRaw(it);
    const pills = [];
    if (est > 0 && act > est) pills.push({ label: money0(act - est) + ' over estimate', scheme: 'red' });
    if (st === 'Paid') pills.push({ label: 'Paid', scheme: 'green' });
    else if (st === 'Partial') pills.push({ label: 'Deposit', scheme: 'gold' });
    else pills.push({ label: 'Not paid', scheme: 'gray' });

    let body = '';
    if (tabIdx === 0) body = drawerLineItemTab(ref);
    else if (tabIdx === 1) body = drawerCategoryTab(ref);
    else if (tabIdx === 2) body = drawerPaymentTab(ref);
    else body = drawerHistoryTab(ref);

    slot.classList.add('is-open');
    slot.innerHTML = `<aside class="rd-drawer rd-bgt-drawer" aria-label="Budget line item">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrowrow">
          <span class="rd-drawer__eyebrow">Line item · ${esc(ref.c.cat || 'Category')}</span>
          <button type="button" class="rd-drawer__close" aria-label="Close" onclick="rdBudgetCloseDrawer()">&#10005;</button>
        </div>
        <div class="rd-drawer__title">${esc(it.name || 'Line item')}</div>
        <div class="rd-drawer__pills">${pills.map(pillHtml).join('')}</div>
        <div class="rd-drawer__tabs is-guest-tabs">${BGT_DRAWER_TABS.map((t, i) =>
      `<button type="button" class="rd-drawer__tab${i === tabIdx ? ' is-active' : ''}" onclick="rdBudgetDrawerTab(${i})">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="rd-drawer__body rd-drawer-fields">${body}</div>
      <div class="rd-drawer__foot">
        ${tabIdx === 0
        ? '<button type="button" class="rd-btn rd-btn--primary" onclick="rdBudgetDrawerSave()">Save</button>'
        : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdBudgetDrawerMarkPaid()">${itemPill(it).label === 'Paid' ? 'Mark unpaid' : 'Mark paid'}</button>`}
        <button type="button" class="rd-btn" onclick="rdBudgetDrawerFullEditor()">Full editor</button>
      </div>
    </aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function persist() { if (typeof save === 'function') save(); }
  function rerender() { renderBudgetRd(); }

  function rdBudgetSelectCategory(ci) {
    /* Mock 4a: clicking a category card loads that category's itemized table
       below — set the active category, narrow the table to it, then scroll. */
    window._budgetItemScope = 'selected';
    if (typeof setBudgetActiveCategory === 'function') {
      setBudgetActiveCategory(ci); /* calls renderBudget */
    } else {
      window.activeBudgetCategoryIndex = ci;
      rerender();
    }
    requestAnimationFrame(() => rdBudgetJumpTo('bgt-sect-itemized'));
  }
  function rdBudgetToggleShowAll() {
    if (typeof budgetShowAllCategories !== 'undefined') window.budgetShowAllCategories = !budgetShowAllCategories;
    rerender();
  }
  function rdBudgetSlide(dir) {
    if (typeof slideBudgetCategoryCards === 'function') { slideBudgetCategoryCards(dir); return; }
    window.budgetCategoryPage = Math.max(0, (window.budgetCategoryPage || 0) + dir);
    rerender();
  }
  function rdBudgetChooseCategory(btn) {
    const opts = cats().map((c, i) => ({ value: String(i), label: c.cat || 'Category' }));
    if (!opts.length) { if (typeof addBudgetCategory === 'function') addBudgetCategory(); return; }
    const cur = String(typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0);
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, cur, val => rdBudgetSelectCategory(parseInt(val, 10) || 0));
      return;
    }
    if (typeof toggleBudgetCategoryDropdown === 'function') toggleBudgetCategoryDropdown();
  }
  function rdBudgetSetReconMode(mode) {
    window._budgetReconMode = mode === 'vendor' ? 'vendor' : 'category';
    renderBudgetReconSection();
  }
  function rdBudgetJumpTo(sectionId) {
    window._budgetJumpSection = sectionId || '';
    /* A rail jump must always land somewhere visible — if the current layout
       mode (Views 30a/30b) is hiding this section, drop to 'scroll' first so
       jumping never lands on a zero-height, hidden section. */
    if (sectionId && !bgtSectionVisible(sectionId)) {
      window._bgtMode = 'scroll';
      rerender();
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderBudgetViewSwitch();
    });
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'budget') {
      renderContextSidebar('budget');
    }
  }
  function applyBudgetRailView(view) {
    window._budgetRailView = view || 'all';
    if (typeof setSavedView === 'function') setSavedView('budget', window._budgetRailView);
    rerender();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('budget');
  }

  function rdBudgetToggleTip(id, on) {
    const st = tippingState();
    st[id] = !!on;
    persist();
    renderBudgetTippingSection();
    renderBudgetTrueTotalSection();
    renderBudgetLogicSection();
  }

  /* Ticked rows become real budget lines in a gratuity-bearing category, so the
     True Total and the category totals move through the same math as any line. */
  function rdBudgetAddTipsToBudget() {
    const sel = tippingSelected();
    if (!sel.length) return;
    let cat = cats().find(c => /extra fees|emergency|gratuity/i.test(String(c.cat || '')));
    if (!cat) {
      if (!Array.isArray(data.budget)) data.budget = [];
      cat = { cat: 'Gratuity & extra fees', target: 0, planned: 0, tip: 'Planned gratuities from the Tipping Etiquette table.', items: [] };
      if (typeof ensureRowId === 'function') ensureRowId(cat, 'budget');
      data.budget.push(cat);
    }
    if (!Array.isArray(cat.items)) cat.items = [];
    sel.forEach(r => {
      const name = 'Gratuity · ' + r.role;
      let item = cat.items.find(it => String(it.name || '') === name);
      if (!item) {
        item = { name: name, budgeted: tippingAmount(r), actual: 0, status: 'Pending', paid: false, due: '', notes: r.customary + ' · given by ' + r.by };
        if (typeof ensureNestedRowId === 'function') ensureNestedRowId(item, 'budgetItems');
        cat.items.push(item);
      } else {
        item.budgeted = tippingAmount(r);
      }
    });
    persist();
    if (typeof showToast === 'function') showToast(sel.length + ' planned gratuit' + (sel.length === 1 ? 'y' : 'ies') + ' added to ' + cat.cat);
    rerender();
  }

  function rdBudgetOpenItemFilter(field, btn) {
    let opts = [{ value: 'all', label: 'All' }];
    if (field === 'category') {
      opts = opts.concat(cats().map(c => ({ value: c.cat || 'Category', label: c.cat || 'Category' })));
    } else if (field === 'vendor') {
      const names = Array.from(new Set(itemRefs().map(r => itemVendorName(r.it)).filter(Boolean))).sort();
      opts = opts.concat(names.map(n => ({ value: n, label: n })));
    } else {
      opts = opts.concat(['Paid', 'Deposit', 'Balance due', 'Not paid', 'Over est.'].map(s => ({ value: s, label: s })));
    }
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._budgetItemFilters[field] || 'all', val => {
        window._budgetItemFilters[field] = val || 'all';
        renderBudgetItemizedSection();
      });
      return;
    }
    const next = opts.find(o => o.value !== 'all');
    if (next) { window._budgetItemFilters[field] = next.value; renderBudgetItemizedSection(); }
  }
  function rdBudgetClearItemFilter(field) {
    window._budgetItemFilters[field] = 'all';
    renderBudgetItemizedSection();
  }
  function rdBudgetOpenItemSort(btn) {
    const opts = [
      { value: 'category', label: 'Sort by category' },
      { value: 'amount', label: 'Sort by amount' },
      { value: 'vendor', label: 'Sort by vendor' },
      { value: 'status', label: 'Sort by status' },
      { value: 'due', label: 'Sort by due date' }
    ];
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._budgetItemSort || 'category', val => {
        window._budgetItemSort = val || 'category';
        renderBudgetItemizedSection();
      });
      return;
    }
    const order = opts.map(o => o.value);
    const i = order.indexOf(window._budgetItemSort || 'category');
    window._budgetItemSort = order[(i + 1) % order.length];
    renderBudgetItemizedSection();
  }
  function rdBudgetSetItemScope(scope) {
    window._budgetItemScope = scope === 'selected' ? 'selected' : 'all';
    renderBudgetItemizedSection();
  }
  function rdBudgetCycleRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const i = order.indexOf(rowHeightLabel());
    const next = order[(i < 0 ? 0 : i + 1) % order.length];
    try { localStorage.setItem(rowHeightKey(), next); } catch (e) { /* private mode */ }
    renderBudgetItemizedSection();
  }
  /* Scoped to the itemized table under this toolbar. The old path handed the
     click to autoFitColumns(), which resolves #cwp-tasks first and so sized the
     Tasks table from here. */
  function rdBudgetAutoFitColumns(btn) {
    const host = document.getElementById('cwp-budget-items');
    const table = host && host.querySelector('table');
    if (table && typeof window.rdAutoFitTable === 'function') window.rdAutoFitTable(table);
  }
  function rdBudgetOpenColumns(btn) {
    if (window.rdColumns) window.rdColumns.openChooser(btn, BGT_ITEM_SCOPE);
  }
  function rdBudgetToggleDetail() {
    if (typeof budgetDetailMode !== 'undefined') window.budgetDetailMode = budgetDetailMode === 'all' ? 'single' : 'all';
    window._budgetItemScope = (typeof budgetDetailMode !== 'undefined' && budgetDetailMode === 'all') ? 'all' : window._budgetItemScope;
    renderBudgetItemizedSection();
  }

  function rdBudgetToggleItemSel(id, on) {
    if (on) window._budgetItemSel.add(String(id));
    else window._budgetItemSel.delete(String(id));
    const tr = document.querySelector('#cwp-budget-items tr[data-bgt-id="' + id + '"]');
    if (tr) tr.classList.toggle('is-selected', !!on);
    renderBudgetBulkBar();
  }
  function rdBudgetTogglePledgeSel(id, on) {
    if (on) window._budgetPledgeSel.add(String(id));
    else window._budgetPledgeSel.delete(String(id));
  }
  function selectedRefs() {
    return itemRefs().filter(r => window._budgetItemSel.has(refId(r)));
  }
  async function rdBudgetBulkSetVendor() {
    const refs = selectedRefs();
    if (!refs.length) return;
    const names = Array.from(new Set(itemRefs().map(r => itemVendorName(r.it)).filter(Boolean)));
    const pick = typeof rdChoose === 'function' ? await rdChoose('Set vendor', names.length ? names : ['Unassigned']) : names[0];
    if (!pick) return;
    refs.forEach(r => { if (!r.it.paymentLine) r.it.vendor = pick; });
    persist(); rerender();
  }
  async function rdBudgetBulkSetStatus() {
    const refs = selectedRefs();
    if (!refs.length) return;
    const pick = typeof rdChoose === 'function' ? await rdChoose('Set status', ['Pending', 'Partial', 'Paid']) : 'Paid';
    if (!pick) return;
    refs.forEach(r => { if (!r.it.paymentLine) { r.it.status = pick; r.it.paid = pick === 'Paid'; } });
    persist(); rerender();
  }
  async function rdBudgetBulkMoveCategory() {
    const refs = selectedRefs();
    if (!refs.length) return;
    const names = cats().map(c => c.cat || 'Category');
    const pick = typeof rdChoose === 'function' ? await rdChoose('Move to category', names) : null;
    if (!pick) return;
    const target = cats().find(c => String(c.cat || 'Category') === pick);
    if (!target) return;
    if (!Array.isArray(target.items)) target.items = [];
    /* Splice from the tail of each source so earlier indexes stay valid. */
    refs.slice().sort((a, b) => b.ii - a.ii).forEach(r => {
      if (r.it.paymentLine || r.c === target) return;
      const arr = r.c.items || [];
      const at = arr.indexOf(r.it);
      if (at > -1) arr.splice(at, 1);
      r.it.budgetCategory = target.cat || '';
      r.it.budgetCategoryId = target._id || '';
      target.items.push(r.it);
    });
    window._budgetItemSel.clear();
    persist(); rerender();
  }
  function rdBudgetBulkMarkPaid() {
    const refs = selectedRefs();
    if (!refs.length) return;
    refs.forEach(r => {
      if (r.it.paymentLine) return;
      r.it.status = 'Paid';
      r.it.paid = true;
      if (!parseFloat(r.it.actual)) r.it.actual = itemEstimate(r.it);
    });
    persist(); rerender();
  }
  async function rdBudgetBulkDelete() {
    const refs = selectedRefs().filter(r => !r.it.paymentLine);
    if (!refs.length) return;
    if (typeof rdConfirm === 'function') {
      const ok = await rdConfirm('Delete ' + refs.length + ' line item' + (refs.length === 1 ? '' : 's') + '?');
      if (!ok) return;
    } else if (typeof confirm === 'function' && !confirm('Delete ' + refs.length + ' line items?')) return;
    refs.forEach(r => {
      const arr = r.c.items || [];
      const at = arr.indexOf(r.it);
      if (at > -1) arr.splice(at, 1);
    });
    window._budgetItemSel.clear();
    persist(); rerender();
  }

  function rdBudgetAddItem() {
    const ci = typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0;
    const c = cats()[ci];
    if (!c) { if (typeof addBudgetCategory === 'function') addBudgetCategory(); return; }
    const finish = (shape) => {
      if (!Array.isArray(c.items)) c.items = [];
      const item = { name: '', budgeted: 0, actual: 0, status: 'Pending', paid: false, due: '', notes: '', template: shape || 'blank' };
      if (shape === 'instalments') {
        item.name = '';
        item.schedule = [{ label: 'Deposit', amount: '' }, { label: 'Balance', amount: '' }];
      } else if (shape === 'single') {
        item.schedule = [{ label: 'Due on delivery', amount: '' }];
      } else if (shape === 'percover') {
        item.qty = '';
        item.unitPrice = '';
        item.perCover = true;
      }
      if (typeof ensureNestedRowId === 'function') ensureNestedRowId(item, 'budgetItems');
      c.items.push(item);
      persist();
      window._budgetDrawerRef = { id: String(item._id) };
      window._budgetDrawerTab = 0;
      rerender();
    };
    if (typeof RdFurniture !== 'undefined' && RdFurniture.openTemplatePicker) {
      RdFurniture.openTemplatePicker({
        title: 'New from template · budget line',
        onPick: function (id) { finish(id); }
      });
      return;
    }
    finish('blank');
  }

  function rdBudgetOpenItemDrawer(id) {
    window._budgetDrawerRef = { id: String(id) };
    renderBudgetDrawer();
    document.querySelectorAll('#cwp-budget-items tr.is-drawer-focus').forEach(tr => tr.classList.remove('is-drawer-focus'));
    const tr = document.querySelector('#cwp-budget-items tr[data-bgt-id="' + id + '"]');
    if (tr) tr.classList.add('is-drawer-focus');
    revealDrawer();
  }

  /* The drawer is sticky inside the scrolling body, so bring the row it belongs
     to level with the top of the scroll port — otherwise the drawer opens half
     below the fold and its footer is unreachable. */
  function revealDrawer() {
    const row = document.getElementById('budget-surface-row');
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
  function rdBudgetOpenCategoryDrawer() {
    const ci = typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0;
    const c = cats()[ci];
    const first = c && catItems(c)[0];
    if (!first) { rdBudgetAddItem(); return; }
    window._budgetDrawerRef = { id: refId({ it: first, c: c, ci: ci, ii: 0 }) };
    window._budgetDrawerTab = 1;
    renderBudgetDrawer();
    revealDrawer();
  }
  function rdBudgetCloseDrawer() {
    window._budgetDrawerRef = null;
    renderBudgetDrawer();
    document.querySelectorAll('#cwp-budget-items tr.is-drawer-focus').forEach(tr => tr.classList.remove('is-drawer-focus'));
  }
  function rdBudgetDrawerTab(i) {
    window._budgetDrawerTab = i | 0;
    renderBudgetDrawer();
  }
  function rdBudgetDrawerFullEditor() {
    const ref = window._budgetDrawerRef ? findRefById(window._budgetDrawerRef.id) : null;
    if (!ref) return;
    if (typeof openBudgetItemEditor === 'function') openBudgetItemEditor(ref.ci, ref.ii);
  }
  function rdBudgetDrawerMarkPaid() {
    const ref = window._budgetDrawerRef ? findRefById(window._budgetDrawerRef.id) : null;
    if (!ref || ref.it.paymentLine) return;
    const paid = itemPill(ref.it).label === 'Paid';
    ref.it.status = paid ? 'Pending' : 'Paid';
    ref.it.paid = !paid;
    if (!paid && !parseFloat(ref.it.actual)) ref.it.actual = itemEstimate(ref.it);
    persist(); rerender();
  }
  function rdBudgetDrawerSave() {
    const ref = window._budgetDrawerRef ? findRefById(window._budgetDrawerRef.id) : null;
    const slot = document.getElementById('budget-drawer-slot');
    if (!ref || !slot) return;
    const read = key => {
      const el = slot.querySelector('[data-bgtf="' + key + '"]');
      return el ? el.value : null;
    };
    const num = key => {
      const v = read(key);
      return v == null || v === '' ? null : (parseFloat(v) || 0);
    };
    const it = ref.it;
    const qty = num('qty');
    const unit = num('unitPrice');
    if (qty != null) it.qty = qty;
    if (unit != null) it.unitPrice = unit;
    const est = num('budgeted');
    if (est != null) it.budgeted = est;
    else if (qty != null && unit != null) it.budgeted = qty * unit;
    const act = num('actual');
    if (act != null) { it.actual = act; delete it.cost; }
    const status = read('status');
    if (status) { it.status = status; it.paid = status === 'Paid'; }
    const due = read('due');
    if (due != null) it.due = due;
    persist(); rerender();
    if (typeof toast === 'function') toast('Line item saved');
  }
  function rdBudgetFullEditor() {
    const ref = window._budgetDrawerRef ? findRefById(window._budgetDrawerRef.id) : (itemRefs()[0] || null);
    if (ref && typeof openBudgetItemEditor === 'function') { openBudgetItemEditor(ref.ci, ref.ii); return; }
    if (typeof openDataHub === 'function') openDataHub('finances', 'budgetHub');
  }
  async function rdBudgetDeleteCategory() {
    const ci = typeof activeBudgetCategoryIndex !== 'undefined' ? activeBudgetCategoryIndex : 0;
    if (typeof deleteBudgetCategory === 'function') deleteBudgetCategory(ci);
  }

  /* ── main render ─────────────────────────────────────────────────────── */

  function renderBudgetPageToolbar() {
    const host = document.getElementById('budget-toolbar');
    if (!host) return;
    host.innerHTML =
      itemFilterChip('Category', 'category') +
      itemFilterChip('Vendor', 'vendor') +
      itemFilterChip('Status', 'status') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdBudgetOpenItemSort(this)">${esc(itemSortLabel())}</button>` +
      (typeof rdStandardRightHtml === 'function'
        ? rdStandardRightHtml(typeof BGT_ITEM_SCOPE !== 'undefined' ? BGT_ITEM_SCOPE : 'budget-items', {
            openColumns: 'rdBudgetOpenColumns(this)',
            autofit: 'rdBudgetAutoFitColumns(this)',
            rowHeight: 'rdBudgetCycleRowHeight()'
          })
        : '');
  }

  function renderBudgetRd() {
    if (typeof migrateBudget === 'function') migrateBudget();
    if (typeof ensureSuggestedGratuityLine === 'function') ensureSuggestedGratuityLine();
    if (typeof syncCateringToBudget === 'function') syncCateringToBudget();
    if (typeof syncPaymentsToBudget === 'function') syncPaymentsToBudget();
    if (typeof syncWeddingWeekendToBudget === 'function') syncWeddingWeekendToBudget();
    if (typeof loadBudgetGiftMode === 'function') loadBudgetGiftMode();
    if (typeof activeBudgetCategoryIndex !== 'undefined' && activeBudgetCategoryIndex >= cats().length) {
      window.activeBudgetCategoryIndex = Math.max(0, cats().length - 1);
    }

    uedBudgetShellRd();
    if (typeof refreshBudgetCatOptions === 'function') refreshBudgetCatOptions();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('budget');

    renderBudgetPageToolbar();
    renderBudgetStatsRd();
    renderBudgetUsedBar();
    renderBudgetCategorySection();
    renderBudgetReconSection();
    renderBudgetTrueTotalSection();
    renderBudgetLogicSection();
    renderBudgetTippingSection();
    renderBudgetItemizedSection();
    renderBudgetPledgeSection();
    renderBudgetDrawer();
    applyBudgetSectionVisibility();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'budget'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('budget');
    }
    requestAnimationFrame(() => {
      if (typeof makeColumnsResizable === 'function') makeColumnsResizable(document.getElementById('panel-budget'));
      /* Every itemized/category re-render rebuilds these <table> nodes from a
         fresh HTML string, so the depth pass (§7.1 type glyphs, summary bar,
         frozen first column) has to be re-applied here — not only on the
         initial showPanel() mount — or it disappears the moment a filter,
         sort or category click redraws the table. */
      if (typeof RdDepth !== 'undefined' && RdDepth.scheduleDecorate) {
        RdDepth.scheduleDecorate(document.getElementById('panel-budget'));
      }
    });
  }

  /* ── exports ─────────────────────────────────────────────────────────── */

  window.__budgetRenderRd = renderBudgetRd;
  window.uedBudgetShell = uedBudgetShellRd;
  window.renderBudget = renderBudgetRd;
  window.renderBudgetStats = renderBudgetStatsRd;
  window.budgetFigures = budgetFigures;
  window.budgetRailCounts = budgetRailCounts;
  window.budgetRailVisibleCats = visibleCats;
  window.budgetCatSpentOf = catSpentOf;
  window.budgetCatTargetOf = catTargetOf;
  window.budgetCatIsOver = catIsOver;
  window.applyBudgetRailView = applyBudgetRailView;
  window.rdBudgetJumpTo = rdBudgetJumpTo;
  window.rdBudgetSetView = rdBudgetSetView;
  window.budgetActiveView = budgetView;
  window.budgetViewList = () => BGT_JUMPS.map(v => ({ id: v.id, label: v.label }));
  window.budgetJumpSection = () => window._budgetJumpSection || 'bgt-sect-categories';
  window.rdBudgetSelectCategory = rdBudgetSelectCategory;
  window.rdBudgetToggleShowAll = rdBudgetToggleShowAll;
  window.rdBudgetSlide = rdBudgetSlide;
  window.rdBudgetChooseCategory = rdBudgetChooseCategory;
  window.rdBudgetSetReconMode = rdBudgetSetReconMode;
  window.rdBudgetToggleTip = rdBudgetToggleTip;
  window.rdBudgetAddTipsToBudget = rdBudgetAddTipsToBudget;
  window.rdBudgetOpenItemFilter = rdBudgetOpenItemFilter;
  window.rdBudgetClearItemFilter = rdBudgetClearItemFilter;
  window.rdBudgetOpenItemSort = rdBudgetOpenItemSort;
  window.rdBudgetSetItemScope = rdBudgetSetItemScope;
  window.rdBudgetCycleRowHeight = rdBudgetCycleRowHeight;
  window.rdBudgetAutoFitColumns = rdBudgetAutoFitColumns;
  window.rdBudgetOpenColumns = rdBudgetOpenColumns;
  window.rdBudgetToggleDetail = rdBudgetToggleDetail;
  window.rdBudgetToggleItemSel = rdBudgetToggleItemSel;
  window.rdBudgetTogglePledgeSel = rdBudgetTogglePledgeSel;
  window.rdBudgetBulkSetVendor = rdBudgetBulkSetVendor;
  window.rdBudgetBulkSetStatus = rdBudgetBulkSetStatus;
  window.rdBudgetBulkMoveCategory = rdBudgetBulkMoveCategory;
  window.rdBudgetBulkMarkPaid = rdBudgetBulkMarkPaid;
  window.rdBudgetBulkDelete = rdBudgetBulkDelete;
  window.rdBudgetAddItem = rdBudgetAddItem;
  window.rdBudgetOpenItemDrawer = rdBudgetOpenItemDrawer;
  window.rdBudgetOpenCategoryDrawer = rdBudgetOpenCategoryDrawer;
  window.rdBudgetCloseDrawer = rdBudgetCloseDrawer;
  window.rdBudgetDrawerTab = rdBudgetDrawerTab;
  window.rdBudgetDrawerFullEditor = rdBudgetDrawerFullEditor;
  window.rdBudgetDrawerMarkPaid = rdBudgetDrawerMarkPaid;
  window.rdBudgetDrawerSave = rdBudgetDrawerSave;
  window.rdBudgetFullEditor = rdBudgetFullEditor;
  window.rdBudgetDeleteCategory = rdBudgetDeleteCategory;

  function hookBudgetPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.budget = function () { renderBudgetRd(); };
    }
  }
  hookBudgetPanelRenderer();
  var _showPanelBudget = window.showPanel;
  if (typeof _showPanelBudget === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelBudget.call(window, id, forceOpen);
      hookBudgetPanelRenderer();
      return out;
    };
  }
})();
