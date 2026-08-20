/* Contracts & Invoices page — Master 10c / 30d / 30e.
   Rail + pagehead + 5-stat strip (per view) + toolbar + table (instalment children)
   + Documents custody cards + Schedule obligation timeline + 360px drawer
   (Document · Terms · Payments · History).

   Figures come from contract rows and linked payments (contractIdx / contractId)
   so this page is never a second source of truth. Rentals stay in the Finances
   Hub; 10c does not carry a rentals section. */
(function () {
  'use strict';

  const CON_DRAWER_TABS = ['Document', 'Terms', 'Payments', 'History'];
  const CON_COLUMNS = [
    { key: 'name', label: 'Contract' },
    { key: 'vendor', label: 'Vendor', width: '180px' },
    { key: 'signed', label: 'Signed', width: '110px' },
    { key: 'total', label: 'Total', width: '110px', num: true },
    { key: 'paid', label: 'Paid', width: '110px', num: true },
    { key: 'nextdue', label: 'Next due', width: '130px' },
    { key: 'status', label: 'Status', width: '150px' }
  ];
  const CON_SORT_OPTIONS = [
    { value: 'due', label: 'Sort by next due' },
    { value: 'total', label: 'Sort by total' },
    { value: 'paid', label: 'Sort by paid' },
    { value: 'vendor', label: 'Sort by vendor' },
    { value: 'signed', label: 'Sort by signed date' },
    { value: 'status', label: 'Sort by status' },
    { value: 'name', label: 'Sort by name' }
  ];
  const ROW_HEIGHTS = ['compact', 'regular', 'comfortable'];

  window._conRailView = window._conRailView || 'all';
  window._conGroupBy = window._conGroupBy || 'vendor';
  window._conFilters = window._conFilters || { vendor: 'all', status: 'all', due: 'all' };
  window._conSort = window._conSort || 'due';
  window._conSel = window._conSel || new Set();
  window._conDrawerId = window._conDrawerId || null;
  window._conDrawerTab = window._conDrawerTab || 0;
  window._conMode = window._conMode || 'table';
  window._conExpanded = window._conExpanded || null;
  window._conColsHidden = window._conColsHidden || null;

  const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s));

  function money(n) {
    const v = parseFloat(n) || 0;
    if (typeof fmt === 'function') return fmt(v);
    return '$' + Math.round(v).toLocaleString();
  }
  function money0(n) { return '$' + Math.round(parseFloat(n) || 0).toLocaleString(); }
  function nil(txt) { return '<span class="rd-con-nil">' + (txt || '—') + '</span>'; }

  function rows() {
    return typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []);
  }
  function payments() {
    return typeof safeArray === 'function' ? safeArray(data.payments) : (data.payments || []);
  }

  function toDate(v) {
    if (!v) return null;
    const s = String(v).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(s + 'T12:00:00');
    return isNaN(d) ? null : d;
  }
  function today() { const t = new Date(); t.setHours(12, 0, 0, 0); return t; }
  function shortDate(v, withYear) {
    const d = toDate(v);
    if (!d) return String(v || '') || '—';
    const opts = withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' };
    return d.toLocaleDateString(undefined, opts);
  }
  function longDate(v) {
    const d = toDate(v);
    if (!d) return String(v || '') || '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function conId(c) { return String((c && (c._id || c.id)) || ''); }
  function indexOfRow(c) { return rows().indexOf(c); }
  function rowById(id) {
    const s = String(id);
    return rows().find((c, i) => conId(c) === s || String(i) === s) || null;
  }
  function conName(c) { return String((c && c.name) || '').trim() || 'Untitled contract'; }
  function conVendor(c) { return String((c && c.vendor) || '').trim(); }
  function conType(c) { return String((c && c.type) || 'Contract').trim() || 'Contract'; }
  function conStatus(c) { return String((c && c.status) || 'Not Signed').trim() || 'Not Signed'; }
  function conTotal(c) {
    if (typeof contractNumber === 'function') return contractNumber(c, 'total');
    return parseFloat((c && (c.total != null ? c.total : c.amount)) || 0) || 0;
  }
  function conDeposit(c) {
    if (typeof contractNumber === 'function') return contractNumber(c, 'deposit');
    return parseFloat((c && c.deposit) || 0) || 0;
  }
  function conSigned(c) { return String((c && (c.date || c.signed || c.signedDate)) || '').slice(0, 10); }
  function conCancelBy(c) { return String((c && (c.cancelBy || c.cancelUntil || c.freeCancelUntil)) || '').slice(0, 10); }
  function conPages(c) {
    const docs = docList(c);
    const withPages = docs.find(d => d.pages != null && d.pages !== '');
    if (withPages) return parseInt(withPages.pages, 10) || 0;
    if (c && c.pages != null && c.pages !== '') return parseInt(c.pages, 10) || 0;
    return docs.length ? 0 : 0;
  }
  function conFileName(c) {
    const docs = docList(c);
    const contractDoc = docs.find(d => /contract/i.test(d.kind || '')) || docs[0];
    if (contractDoc && contractDoc.name) return contractDoc.name;
    if (c && c.contractFile) {
      if (typeof c.contractFile === 'string') return c.contractFile;
      if (c.contractFile.name) return c.contractFile.name;
    }
    return '';
  }
  function conTerm(c, key, fallbacks) {
    const keys = [key].concat(fallbacks || []);
    for (let i = 0; i < keys.length; i++) {
      const v = c && c[keys[i]];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }
  function conClauseRows(c) {
    return [
      { key: 'cancellation', label: 'Cancellation', value: conTerm(c, 'cancellation', ['cancelClause', 'cancelNote', 'cancelTerms']) },
      { key: 'reschedule', label: 'Reschedule', value: conTerm(c, 'reschedule', ['rescheduleClause', 'rescheduleTerms']) },
      { key: 'delivery', label: 'Delivery', value: conTerm(c, 'delivery', ['deliveryClause', 'deliveryTerms']) },
      { key: 'copyright', label: 'Copyright', value: conTerm(c, 'copyright', ['copyrightClause', 'copyrightTerms']) }
    ];
  }
  function governingClause(c) {
    if (c && c.governingLabel && c.governingValue) {
      return { label: String(c.governingLabel), value: String(c.governingValue) };
    }
    if (c && c.expires) return { label: 'Expires', value: shortDate(c.expires) };
    if (c && c.cutDate) return { label: 'Cut date', value: shortDate(c.cutDate) };
    if (c && c.finalCount) return { label: 'Final count', value: String(c.finalCount) };
    if (c && c.finalHeadcount) return { label: 'Final headcount', value: shortDate(c.finalHeadcount) || String(c.finalHeadcount) };
    if (c && c.setLength) return { label: 'Set length', value: String(c.setLength) };
    const cancel = conTerm(c, 'cancellation', ['cancelClause', 'cancelNote']);
    if (cancel) {
      const days = cancel.match(/(\d+)\s*days?/i);
      return { label: 'Cancellation', value: days ? (days[1] + ' days') : cancel.slice(0, 28) };
    }
    const delivery = conTerm(c, 'delivery', ['deliveryClause']);
    if (delivery) return { label: 'Delivery', value: delivery.slice(0, 28) };
    if (conCancelBy(c)) return { label: 'Free-cancel until', value: shortDate(conCancelBy(c)) };
    const n = linkedInstallments(c).length;
    return { label: 'Instalments', value: String(n) };
  }
  function conSignatories(c) {
    if (Array.isArray(c.signatories) && c.signatories.length) return c.signatories;
    const out = [];
    const setup = (typeof data !== 'undefined' && data.setup) ? data.setup : {};
    const couple = [setup.bride, setup.groom].filter(Boolean).join(' & ') || setup.bride || setup.groom || '';
    if (isSigned(c) && couple) out.push({ name: couple.split(' & ')[0] || couple, date: conSigned(c) });
    if (isSigned(c) && conVendor(c)) out.push({ name: conVendor(c), date: conSigned(c) });
    if (!out.length) out.push({ name: 'Witness', date: '', note: 'Not required' });
    return out;
  }
  function invoiceCount(c) {
    const linked = linkedPayments(c);
    if (linked.length) return linked.length;
    const stages = linkedInstallments(c);
    return stages.length ? Math.min(stages.length, 2) : 0;
  }
  function balanceDueDate(c) {
    return String((c && (c.balanceDue || c.balanceDueDate || c.balanceDate)) || '').slice(0, 10)
      || ((nextDueInfo(c) && nextDueInfo(c).due) || '');
  }
  function deliveryDueDate(c) {
    return String((c && (c.deliveryDue || c.deliveryDueDate || c.deliveryDate)) || '').slice(0, 10);
  }

  function linkedPayments(c) {
    const idx = indexOfRow(c);
    const id = conId(c);
    const explicit = payments().filter(p => {
      const ci = p.contractId != null && p.contractId !== '' ? String(p.contractId) : '';
      const cx = p.contractIdx != null && p.contractIdx !== '' ? String(p.contractIdx) : '';
      if (id && (ci === id || cx === id)) return true;
      if (idx >= 0 && cx === String(idx)) return true;
      return false;
    });
    if (explicit.length) return explicit;
    /* Fallback: same vendor, payment not already pointed at another contract. */
    const v = conVendor(c);
    if (!v) return [];
    return payments().filter(p => {
      const linked = (p.contractId != null && p.contractId !== '')
        || (p.contractIdx != null && p.contractIdx !== '');
      return !linked && String(p.vendor || '').trim() === v;
    });
  }

  function linkedInstallments(c) {
    const out = [];
    linkedPayments(c).forEach(p => {
      const list = Array.isArray(p.installments) ? p.installments : [];
      list.forEach((inst, j) => out.push({ p: p, inst: inst, j: j }));
    });
    if (Array.isArray(c.installments) && c.installments.length) {
      c.installments.forEach((inst, j) => out.push({ p: null, inst: inst, j: j }));
    }
    return out;
  }

  function hasOwnSchedule(c) {
    return Array.isArray(c.installments) && c.installments.length > 0;
  }
  function hasSchedule(c) {
    if (hasOwnSchedule(c)) return true;
    return linkedPayments(c).some(p => Array.isArray(p.installments) && p.installments.length > 0);
  }
  function needsSchedule(c) {
    if (/paid/i.test(conStatus(c))) return false;
    return !hasSchedule(c);
  }
  function cancelWindowOpen(c) {
    const d = toDate(conCancelBy(c));
    if (!d) return false;
    return d >= today();
  }
  function isSigned(c) {
    const s = conStatus(c);
    if (/not signed|await|pending|unsigned|quote|received/i.test(s)) return false;
    return ['Signed', 'Invoiced', 'Paid'].includes(s) || /^signed\b/i.test(s);
  }
  function awaitingSignature(c) {
    const s = conStatus(c);
    return !isSigned(c) && /not signed|await|pending|unsigned|quote/i.test(s);
  }

  function conPaid(c) {
    const linked = linkedPayments(c);
    if (linked.length) {
      return linked.reduce((n, p) => {
        if (typeof paymentBudgetPaidTotal === 'function') return n + (paymentBudgetPaidTotal(p) || 0);
        const plan = typeof paymentPlanSummary === 'function' ? paymentPlanSummary(p) : null;
        return n + (plan ? (parseFloat(plan.paidTotal) || 0) : (parseFloat(p.paid) || 0));
      }, 0);
    }
    return conDeposit(c);
  }
  function conOutstanding(c) {
    return Math.max(0, conTotal(c) - conPaid(c));
  }
  function nextDueInfo(c) {
    const stages = linkedInstallments(c);
    let best = null;
    stages.forEach(({ inst }) => {
      const st = typeof paymentInstallmentStatus === 'function'
        ? paymentInstallmentStatus(inst)
        : (inst.status || 'Not Paid');
      if (st === 'Paid') return;
      const due = inst.dueDate || '';
      const amount = parseFloat(inst.amountDue) || 0;
      if (!best || String(due || '9999') < String(best.due || '9999')) {
        best = { due: due, amount: amount, label: inst.label || '' };
      }
    });
    if (!best) {
      const linked = linkedPayments(c);
      linked.forEach(p => {
        const st = typeof paymentDisplayStatus === 'function' ? paymentDisplayStatus(p) : (p.status || '');
        if (st === 'Paid') return;
        const due = p.date || '';
        const amount = Math.max(0, (typeof paymentBudgetDueTotal === 'function' ? paymentBudgetDueTotal(p) : parseFloat(p.due) || 0)
          - (typeof paymentBudgetPaidTotal === 'function' ? paymentBudgetPaidTotal(p) : parseFloat(p.paid) || 0));
        if (amount <= 0) return;
        if (!best || String(due || '9999') < String(best.due || '9999')) {
          best = { due: due, amount: amount, label: p.desc || '' };
        }
      });
    }
    return best;
  }

  function docList(c) {
    const docs = [];
    function push(obj, kind) {
      if (!obj) return;
      if (typeof obj === 'string' && obj) docs.push({ name: obj, kind: kind, date: conSigned(c) });
      else if (obj && typeof obj === 'object') {
        docs.push({
          name: obj.name || kind,
          kind: kind,
          date: obj.date || conSigned(c),
          pages: obj.pages,
          amount: obj.amount
        });
      }
    }
    if (typeof contractFileObject === 'function') {
      push(contractFileObject(c, 'contractFile'), 'Contract');
      push(contractFileObject(c, 'invoiceFile'), 'Invoice');
    } else {
      push(c.contractFile, 'Contract');
      push(c.invoiceFile, 'Invoice');
    }
    if (Array.isArray(c.docs)) c.docs.forEach(d => push(d, d.kind || d.type || 'Document'));
    if (c.img && !docs.length) docs.push({ name: 'Contract snapshot', kind: 'Contract', date: conSigned(c) });
    return docs;
  }
  function docCount(c) { return docList(c).length; }

  function conPill(c) {
    if (needsSchedule(c)) return { label: 'No schedule attached', scheme: 'gold' };
    const s = conStatus(c);
    if (s === 'Paid') return { label: 'Paid', scheme: 'green' };
    if (s === 'Invoiced') return { label: 'Invoiced', scheme: 'blue' };
    if (awaitingSignature(c) || s === 'Not Signed') return { label: 'Awaiting signature', scheme: 'gold' };
    if (isSigned(c)) return { label: 'Signed', scheme: 'green' };
    const scheme = typeof pillSchemeFor === 'function' ? pillSchemeFor(s, 'contract') : 'gray';
    return { label: s, scheme: scheme === 'neutral' ? 'gray' : scheme };
  }
  function pillHtml(p) {
    return '<span class="status-pill" data-pillscheme="' + p.scheme + '">' + esc(p.label) + '</span>';
  }
  function instPill(inst) {
    const st = typeof paymentInstallmentStatus === 'function'
      ? paymentInstallmentStatus(inst)
      : (inst.status || 'Not Paid');
    if (st === 'Paid') return { label: 'Paid', scheme: 'green' };
    if (st === 'Payment Due') return { label: 'Payment due', scheme: 'red' };
    if (st === 'Partially Paid') return { label: 'Part paid', scheme: 'gold' };
    if (/schedul/i.test(st) || (inst.dueDate && st === 'Not Paid')) return { label: 'Scheduled', scheme: 'gray' };
    return { label: st || 'Not paid', scheme: 'gray' };
  }

  /* ── page figures ─────────────────────────────────────────────────────── */

  function contractFigures() {
    const list = rows();
    let contracted = 0, paid = 0, docs = 0, signed = 0, awaiting = 0, cancelOpen = 0, needSched = 0;
    list.forEach(c => {
      contracted += conTotal(c);
      paid += conPaid(c);
      docs += docCount(c);
      if (isSigned(c)) signed += 1;
      if (awaitingSignature(c) || conStatus(c) === 'Not Signed') awaiting += 1;
      if (cancelWindowOpen(c)) cancelOpen += 1;
      if (needsSchedule(c)) needSched += 1;
    });
    const budgetTarget = parseFloat((data.setup && data.setup.budget) || 0) || 0;
    const pct = budgetTarget > 0 ? Math.round((contracted / budgetTarget) * 100) : 0;
    return {
      count: list.length,
      contracted: contracted,
      paid: paid,
      outstanding: Math.max(0, contracted - paid),
      docs: docs,
      signed: signed,
      awaiting: awaiting,
      cancelOpen: cancelOpen,
      needSched: needSched,
      budgetTarget: budgetTarget,
      pct: pct
    };
  }
  function contractRailCounts() {
    const f = contractFigures();
    return {
      all: f.count,
      signed: f.signed,
      awaiting: f.awaiting,
      cancel: f.cancelOpen,
      needschedule: f.needSched
    };
  }

  /* ── rail filtering ───────────────────────────────────────────────────── */

  function railMatch(c) {
    const v = window._conRailView || 'all';
    if (v === 'signed') return isSigned(c);
    if (v === 'awaiting') return awaitingSignature(c) || conStatus(c) === 'Not Signed';
    if (v === 'cancel') return cancelWindowOpen(c);
    if (v === 'needschedule') return needsSchedule(c);
    return true;
  }
  function matchesFilters(c) {
    const f = window._conFilters || {};
    if (f.vendor && f.vendor !== 'all' && conVendor(c) !== f.vendor) return false;
    if (f.status && f.status !== 'all') {
      const pill = conPill(c);
      if (pill.label !== f.status && conStatus(c) !== f.status) return false;
    }
    if (f.due && f.due !== 'all') {
      const next = nextDueInfo(c);
      const due = next && next.due ? toDate(next.due) : null;
      const t = today();
      if (f.due === 'overdue') { if (!due || due >= t) return false; }
      else if (f.due === '30') {
        if (!due) return false;
        const days = Math.round((due - t) / 86400000);
        if (days < 0 || days > 30) return false;
      } else if (f.due === 'none') { if (next && next.due) return false; }
    }
    return true;
  }
  function visibleRows() {
    return rows().filter(c => railMatch(c) && matchesFilters(c));
  }

  function sortRows(list) {
    const mode = window._conSort || 'due';
    const copy = list.slice();
    copy.sort((a, b) => {
      if (mode === 'total') return conTotal(b) - conTotal(a);
      if (mode === 'paid') return conPaid(b) - conPaid(a);
      if (mode === 'vendor') return conVendor(a).localeCompare(conVendor(b));
      if (mode === 'signed') return String(conSigned(a) || '').localeCompare(String(conSigned(b) || ''));
      if (mode === 'status') return conStatus(a).localeCompare(conStatus(b));
      if (mode === 'name') return conName(a).localeCompare(conName(b));
      const na = nextDueInfo(a);
      const nb = nextDueInfo(b);
      return String((na && na.due) || '9999-12-31').localeCompare(String((nb && nb.due) || '9999-12-31'));
    });
    return copy;
  }

  /* ── columns / row height ─────────────────────────────────────────────── */

  function colsKey() {
    return 'rdCols:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':contracts';
  }
  function hiddenCols() {
    if (!window._conColsHidden) {
      let stored = [];
      try { stored = JSON.parse(localStorage.getItem(colsKey()) || '[]'); } catch (e) { stored = []; }
      window._conColsHidden = new Set(Array.isArray(stored) ? stored : []);
    }
    return window._conColsHidden;
  }
  function visibleCols() { return CON_COLUMNS.filter(c => !hiddenCols().has(c.key)); }
  function persistCols() {
    try { localStorage.setItem(colsKey(), JSON.stringify(Array.from(hiddenCols()))); } catch (e) { /* private */ }
  }
  function rowHeightKey() {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':contracts';
  }
  function rowHeightLabel() {
    try { return localStorage.getItem(rowHeightKey()) || 'compact'; } catch (e) { return 'compact'; }
  }

  function sortLabel() {
    const hit = CON_SORT_OPTIONS.find(o => o.value === (window._conSort || 'due'));
    return hit ? hit.label : 'Sort by next due';
  }

  function filterChip(label, field) {
    const cur = (window._conFilters || {})[field] || 'all';
    const on = cur !== 'all';
    const display = field === 'due' ? dueFilterLabel(cur) : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdConOpenFilter('${field}',this)">${esc(on ? label + ': ' + display : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdConClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }
  function dueFilterLabel(v) {
    return ({ overdue: 'Overdue', '30': 'Next 30 days', none: 'No due date', all: 'all' })[v] || v;
  }

  function toolbarHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const total = CON_COLUMNS.length;
    const shown = visibleCols().length;
    const mode = window._conMode || 'table';
    const viewswitch = `<div class="rd-viewswitch" role="group" aria-label="Contracts view">
        <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdConSetMode('table')">Table</button>
        <button type="button" class="rd-viewswitch__item${mode === 'documents' ? ' is-active' : ''}" onclick="rdConSetMode('documents')">Documents</button>
        <button type="button" class="rd-viewswitch__item${mode === 'schedule' ? ' is-active' : ''}" onclick="rdConSetMode('schedule')">Schedule</button>
      </div>`;
    return `<div class="rd-toolbar rd-con-toolbar">
      ${filterChip('Vendor', 'vendor')}
      ${filterChip('Status', 'status')}
      ${filterChip('Due', 'due')}
      <button type="button" class="rd-chip rd-chip--ghost" onclick="rdConOpenSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${esc(sortLabel())}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-chip${shown < total ? '' : ' rd-chip--ghost'}" onclick="rdConOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>Columns · ${shown} of ${total}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      <button type="button" class="rd-chip" onclick="rdConAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>
      <button type="button" class="rd-chip" onclick="rdConCycleRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${esc(rowHeightLabel())}<svg ${svg} stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="rd-toolbar__right">${viewswitch}</div>
    </div>`;
  }

  /* ── shell ────────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    const mode = window._conMode || 'table';
    if (mode === 'documents') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print pack</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdConFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="rdConDownloadAll()">Download all</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="rdConUploadDoc()">Upload document</button>`;
    }
    if (mode === 'schedule') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print schedule</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdConFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Contracts',typeof contractsExportRows==='function'?contractsExportRows():data.contracts)">Export</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="rdConAddInstalment()">Add instalment</button>`;
    }
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdConUploadDoc()">Upload document</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdConFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Contracts',typeof contractsExportRows==='function'?contractsExportRows():data.contracts)">Export</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="rdConAddContract()">Add contract</button>`;
  }

  function uedContractsShellRd() {
    const panel = document.getElementById('panel-contracts');
    if (!panel) return;
    panel.classList.add('ued-scope', 'contracts-mockup');
    if (panel.dataset.uedShell === 'contracts-rd10c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'contracts-rd10c';
    panel.innerHTML = `<div class="rd-page">
      <datalist id="vendor-name-options"></datalist>
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Money</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Contracts &amp; Invoices</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="contracts-stats"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="contracts-surface-row">
          <div class="rd-surface__main">
            <div class="rd-con-body" id="contracts-body"></div>
          </div>
          <div id="contracts-drawer-slot"></div>
        </div>
      </div>
    </div>`;
  }

  function renderContractStatsRd() {
    const host = document.getElementById('contracts-stats');
    if (!host) return;
    const f = contractFigures();
    const mode = window._conMode || 'table';
    let cells;
    if (mode === 'documents') {
      const unsigned = Math.max(0, f.count - f.signed);
      const missing = documentsMissingCards().length;
      const attention = unsigned
        ? (rows().find(c => !isSigned(c) && (c.expires || awaitingSignature(c)))
          ? ((conName(rows().find(c => !isSigned(c))) || 'Quote') + (rows().find(c => c.expires) ? ' expires ' + shortDate(rows().find(c => c.expires).expires) : ''))
          : undefined)
        : undefined;
      const missNote = missing
        ? (documentsMissingCards()[0].neededBy
          ? 'venue requires by ' + shortDate(documentsMissingCards()[0].neededBy)
          : 'Required document absent')
        : undefined;
      cells = [
        { label: 'Documents', value: String(Math.max(f.docs, f.count + missing)), filter: 'Documents view' },
        { label: 'Signed', value: String(f.signed), filter: 'Filter · Signed' },
        { label: 'Unsigned', value: String(unsigned), filter: 'Filter · Unsigned', attention: attention },
        { label: 'Missing', value: String(missing), filter: 'Missing docs', attention: missNote, attentionTone: missing ? 'red' : undefined },
        { label: 'Contracted value', value: money0(f.contracted), filter: 'Show contracts' }
      ];
    } else if (mode === 'schedule') {
      const stages = [];
      let paidN = 0, paidAmt = 0, unsignedAmt = 0, peakN = 0, peakAmt = 0;
      const byMonth = {};
      rows().forEach(c => {
        const signed = isSigned(c);
        linkedInstallments(c).forEach(({ inst }) => {
          stages.push({ c: c, inst: inst });
          const st = instPill(inst);
          const amt = parseFloat(inst.amountDue) || 0;
          if (st.scheme === 'green') { paidN += 1; paidAmt += (parseFloat(inst.amountPaid) || amt); }
          if (!signed) unsignedAmt += amt;
          const d = toDate(inst.dueDate);
          if (d) {
            const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            byMonth[key] = byMonth[key] || { n: 0, amt: 0 };
            byMonth[key].n += 1;
            byMonth[key].amt += amt;
          }
        });
      });
      const t = today();
      const peakKeys = [];
      for (let i = 0; i < 2; i++) {
        const d = new Date(t.getFullYear(), t.getMonth() + i, 1);
        /* Prefer Oct–Nov load when those months exist in the schedule; else next two months. */
        peakKeys.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
      }
      const oct = Object.keys(byMonth).find(k => k.endsWith('-10'));
      const nov = Object.keys(byMonth).find(k => k.endsWith('-11'));
      const loadKeys = (oct || nov) ? [oct, nov].filter(Boolean) : peakKeys;
      loadKeys.forEach(k => {
        if (!byMonth[k]) return;
        peakN += byMonth[k].n;
        peakAmt += byMonth[k].amt;
      });
      const pct = stages.length ? Math.round((peakN / stages.length) * 100) : 0;
      const loadLabel = (oct || nov) ? 'Oct–Nov load' : 'Near-term load';
      cells = [
        { label: 'Contracts', value: String(f.count), filter: 'Show all' },
        { label: 'Instalments', value: String(stages.length), filter: 'Schedule view' },
        { label: 'Paid', value: paidN + ' · ' + money0(paidAmt), filter: 'Filter · Paid' },
        { label: loadLabel, value: peakN + ' · ' + money0(peakAmt), filter: 'Peak months', attention: pct ? (pct + '% of all instalments') : undefined },
        { label: 'On unsigned paper', value: money0(unsignedAmt), filter: 'Unsigned', attention: unsignedAmt > 0 ? 'Not yet obliged' : undefined, attentionTone: unsignedAmt > 0 ? 'red' : undefined }
      ];
    } else {
      cells = [
        { label: 'Contracts', value: String(f.count), filter: 'Show all' },
        { label: 'Contracted value', value: money0(f.contracted), filter: 'Show contracts' },
        { label: 'Paid', value: money0(f.paid), filter: 'Filter · Paid' },
        {
          label: 'Outstanding',
          value: money0(f.outstanding),
          filter: 'Filter · Outstanding',
          attention: f.outstanding > 0 ? 'Balance still owed on signed contracts' : undefined
        },
        { label: 'Documents', value: String(f.docs), filter: 'Documents view' }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, cells);
      return;
    }
    const cell = (label, val) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(label)}</div><div class="m-stat-val">${val}</div></div>`;
    host.innerHTML = cells.map(c => cell(c.label, c.value)).join('');
  }

  /* ── table ────────────────────────────────────────────────────────────── */

  function groupKey(c) {
    const g = window._conGroupBy || 'vendor';
    if (g === 'status') return conPill(c).label || conStatus(c) || 'No status';
    if (g === 'due') {
      const n = nextDueInfo(c);
      if (!n || !n.due) return 'No due date';
      const d = toDate(n.due);
      if (!d) return 'No due date';
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return conVendor(c) || 'Unassigned vendor';
  }
  function groupLabel(key, groupRows, f) {
    const g = window._conGroupBy || 'vendor';
    if (g === 'vendor') {
      const target = f.budgetTarget ? ' · target ' + money0(f.budgetTarget) : '';
      return (key === (conVendor(groupRows[0]) || 'Unassigned vendor') && groupRows.length === visibleRows().length
        ? 'Booked'
        : key)
        + ' · ' + groupRows.length + ' contract' + (groupRows.length === 1 ? '' : 's')
        + ' · ' + money0(groupRows.reduce((n, c) => n + conTotal(c), 0)) + ' committed'
        + ' · ' + money0(groupRows.reduce((n, c) => n + conPaid(c), 0)) + ' paid'
        + (key === (conVendor(groupRows[0]) || 'Unassigned vendor') && groupRows.length === visibleRows().length ? target : '');
    }
    return key + ' · ' + groupRows.length + ' contract' + (groupRows.length === 1 ? '' : 's');
  }

  function colHeadHtml() {
    return visibleCols().map(c =>
      `<th${c.num ? ' class="rd-con-th--num"' : ''}${c.width ? ' style="width:' + c.width + '"' : ''} data-col="${c.key}">${esc(c.label)}</th>`
    ).join('');
  }

  function contractRowHtml(c) {
    const id = conId(c) || String(indexOfRow(c));
    const pill = conPill(c);
    const paid = conPaid(c);
    const next = nextDueInfo(c);
    const sel = window._conSel.has(id);
    const expanded = String(window._conExpanded || '') === id;
    const stages = linkedInstallments(c);
    const planLink = stages.length
      ? `<button type="button" class="rd-con-planlink" onclick="event.stopPropagation();rdConTogglePlan('${esc(id)}')">${stages.length} instalment${stages.length === 1 ? '' : 's'}${expanded ? ' ▾' : ''}</button>`
      : '';

    const cell = key => {
      switch (key) {
        case 'name': return `<td data-col="name"><b class="rd-con-name">${esc(conName(c))}</b>${planLink}</td>`;
        case 'vendor': return `<td data-col="vendor">${esc(conVendor(c) || '—')}</td>`;
        case 'signed': return `<td class="rd-con-muted" data-col="signed">${conSigned(c) ? esc(shortDate(conSigned(c))) : nil()}</td>`;
        case 'total': return `<td class="rd-con-num" data-col="total">${money0(conTotal(c))}</td>`;
        case 'paid': return `<td class="rd-con-num" data-col="paid">${paid ? money0(paid) : nil('$0')}</td>`;
        case 'nextdue': return `<td class="rd-con-muted" data-col="nextdue">${next && next.due
          ? esc(shortDate(next.due)) + (next.amount ? ' · ' + money0(next.amount) : '')
          : nil()}</td>`;
        case 'status': return `<td data-col="status">${pillHtml(pill)}</td>`;
        default: return '';
      }
    };

    let html = `<tr class="rd-con-row${sel ? ' is-selected' : ''}${pill.scheme === 'gold' && needsSchedule(c) ? ' is-warn' : ''}" data-con-id="${esc(id)}" onclick="rdConOpenDrawer('${esc(id)}')">
      <td class="rd-con-tick"><input type="checkbox" ${sel ? 'checked' : ''} onclick="event.stopPropagation()" onchange="rdConToggleSel('${esc(id)}',this.checked)" aria-label="Select contract"></td>
      ${visibleCols().map(col => cell(col.key)).join('')}
    </tr>`;
    if (expanded && stages.length) html += planSubRowHtml(c, stages);
    return html;
  }

  function planSubRowHtml(c, stages) {
    const span = visibleCols().length + 1;
    const paidN = stages.filter(s => instPill(s.inst).scheme === 'green').length;
    const remain = stages.reduce((n, s) => {
      const st = instPill(s.inst);
      if (st.scheme === 'green') return n;
      return n + (parseFloat(s.inst.amountDue) || 0) - (parseFloat(s.inst.amountPaid) || 0);
    }, 0);
    const body = stages.map(({ inst }, j) => {
      const pill = instPill(inst);
      return `<tr>
        <td style="padding:8px 10px 8px 0;border-bottom:1px solid var(--border-hairline,#f0ebe0)">${esc(inst.label || ('Instalment ' + (j + 1)))}</td>
        <td class="rd-con-muted" style="padding:8px 10px;border-bottom:1px solid var(--border-hairline,#f0ebe0);width:130px">${inst.dueDate ? esc(shortDate(inst.dueDate)) : '—'}</td>
        <td class="rd-con-num" style="padding:8px 10px;border-bottom:1px solid var(--border-hairline,#f0ebe0);width:110px">${money0(inst.amountDue)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--border-hairline,#f0ebe0);width:140px">${pillHtml(pill)}</td>
        <td style="width:34px;border-bottom:1px solid var(--border-hairline,#f0ebe0)"></td>
      </tr>`;
    }).join('');
    return `<tr class="rd-con-planrow"><td></td><td colspan="${span - 1}">
      <div class="rd-con-plan">
        <div class="rd-con-plan__head">
          <div class="rd-con-eyebrow">Instalments · ${esc(conVendor(c) || conName(c))}</div>
          <span class="rd-con-muted">${paidN} of ${stages.length} paid · ${money0(remain)} remaining</span>
          <button type="button" class="rd-con-link" style="margin-left:auto" onclick="event.stopPropagation();rdConOpenDrawer('${esc(conId(c) || indexOfRow(c))}');rdConDrawerTab(2)">+ Add instalment</button>
        </div>
        <table><thead><tr>
          <th>Instalment</th><th>Due</th><th style="text-align:right">Amount</th><th>Status</th><th></th>
        </tr></thead><tbody>${body}</tbody></table>
      </div>
    </td></tr>`;
  }

  function allDocuments() {
    const out = [];
    rows().forEach(c => {
      docList(c).forEach(d => out.push({ c: c, d: d }));
    });
    return out;
  }

  function documentsMissingCards() {
    const out = [];
    rows().forEach(c => {
      const named = Array.isArray(c.missingDocs) ? c.missingDocs : [];
      named.forEach(m => {
        out.push({
          name: m.label || m.name || m,
          meta: m.detail || m.requiredBy || ('Required by ' + (conVendor(c) || conName(c) || 'vendor')),
          owner: m.owner || conVendor(c) || '',
          neededBy: m.neededBy || m.due || '',
          chased: m.chased || m.chase || '',
          missing: true,
          contractId: conId(c) || String(indexOfRow(c))
        });
      });
      if (!named.length && !docList(c).length && !isSigned(c)) {
        out.push({
          name: 'Signed contract · ' + (conType(c).toLowerCase() || 'document'),
          meta: 'Required for ' + (conName(c) || 'this booking'),
          owner: conVendor(c) || '',
          neededBy: conCancelBy(c) || '',
          chased: '',
          missing: true,
          contractId: conId(c) || String(indexOfRow(c))
        });
      }
    });
    return out;
  }

  function signatureState(c) {
    const s = conStatus(c);
    if (/hold/i.test(s) || /hold/i.test(conName(c))) return { label: 'On hold', scheme: 'gold' };
    if (awaitingSignature(c) || s === 'Not Signed' || /unsigned|quote|received/i.test(s)) {
      return { label: 'Unsigned', scheme: 'gold' };
    }
    if (isSigned(c)) return { label: 'Signed', scheme: 'green' };
    return { label: s || 'Document', scheme: 'gray' };
  }

  function documentsCustodyHtml() {
    const cards = [];
    sortRows(visibleRows()).forEach(c => {
      const docs = docList(c);
      const primary = docs.find(d => /contract/i.test(d.kind || '')) || docs[0];
      const pages = (primary && primary.pages) || c.pages || '';
      const signedOn = conSigned(c);
      const state = signatureState(c);
      let sub;
      if (!isSigned(c) && (c.received || signedOn)) {
        sub = 'Received ' + shortDate(c.received || signedOn) + ' · not signed';
      } else if (/hold/i.test(state.label)) {
        sub = c.holdNote || 'Held pending measurements';
      } else if (signedOn) {
        sub = 'Signed ' + shortDate(signedOn) + (pages ? ' · ' + pages + ' pages' : '');
      } else {
        sub = pages ? (pages + ' pages') : (conType(c) || 'Document');
      }
      const title = conName(c);
      const clause = governingClause(c);
      const instN = linkedInstallments(c).length;
      const pills = [pillHtml(state)];
      if (primary || conFileName(c)) pills.push('<span class="status-pill" data-pillscheme="gray">PDF</span>');
      cards.push(`<button type="button" class="rd-con-card" onclick="rdConOpenDrawer('${esc(conId(c) || indexOfRow(c))}')">
        <div class="rd-con-card__title">${esc(title)}</div>
        <div class="rd-con-card__sub">${esc(sub)}</div>
        <div class="rd-con-card__pills">${pills.join('')}</div>
        <div class="rd-con-card__rows">
          <div class="rd-con-card__row"><span>Value</span><span>${money0(conTotal(c))}</span></div>
          <div class="rd-con-card__row"><span>${esc(clause.label)}</span><span>${esc(clause.value)}</span></div>
          <div class="rd-con-card__row"><span>Instalments</span><span>${instN}</span></div>
        </div>
      </button>`);
    });
    documentsMissingCards().forEach(m => {
      cards.push(`<button type="button" class="rd-con-card is-missing" onclick="${m.contractId ? `rdConOpenDrawer('${esc(m.contractId)}')` : 'rdConSetMode(\'documents\')'}">
        <div class="rd-con-card__title">${esc(m.name)}</div>
        <div class="rd-con-card__sub">${esc(m.meta)}</div>
        <div class="rd-con-card__pills"><span class="status-pill" data-pillscheme="red">Missing</span></div>
        <div class="rd-con-card__rows">
          <div class="rd-con-card__row"><span>Owner</span><span>${esc(m.owner || '—')}</span></div>
          <div class="rd-con-card__row"><span>Needed by</span><span>${m.neededBy ? esc(shortDate(m.neededBy)) : '—'}</span></div>
          <div class="rd-con-card__row"><span>Chased</span><span>${esc(m.chased || '—')}</span></div>
        </div>
      </button>`);
    });
    return `<div class="rd-con-custody">${cards.join('') || '<div class="rd-con-empty">No documents attached yet.</div>'}</div>`;
  }

  function documentsStripHtml() {
    const docs = allDocuments();
    const cells = docs.map(({ c, d }) => {
      const sub = (d.kind || 'Document') + (d.pages ? ' · ' + d.pages + ' pages' : '') + (d.amount ? ' · ' + money0(d.amount) : '');
      return `<button type="button" class="rd-con-doc" onclick="rdConOpenDrawer('${esc(conId(c) || indexOfRow(c))}')">
        <div class="rd-con-doc__name">${esc(d.name)}</div>
        <div class="rd-con-doc__meta">${esc(sub)}</div>
        <div class="rd-con-doc__date">${d.date ? esc(shortDate(d.date)) : ''}</div>
      </button>`;
    }).join('');
    return `<div class="rd-con-docshead">
        <div class="rd-con-eyebrow">Documents · ${docs.length}</div>
        <div class="rd-con-muted">Every file is attached to a contract; nothing floats loose</div>
        <button type="button" class="rd-con-link" style="margin-left:auto" onclick="rdConUploadDoc()">Upload</button>
      </div>
      <div class="rd-con-docsgrid">${cells || '<div class="rd-con-empty">No documents attached yet.</div>'}</div>`;
  }

  function scheduleRange(list) {
    let min = null, max = null;
    list.forEach(c => {
      linkedInstallments(c).forEach(({ inst }) => {
        const d = toDate(inst.dueDate);
        if (!d) return;
        if (!min || d < min) min = d;
        if (!max || d > max) max = d;
      });
      const signed = toDate(conSigned(c));
      if (signed) {
        if (!min || signed < min) min = signed;
        if (!max || signed > max) max = signed;
      }
    });
    if (!min || !max) {
      const t = today();
      min = new Date(t.getFullYear(), t.getMonth() - 2, 1);
      max = new Date(t.getFullYear(), t.getMonth() + 6, 1);
    }
    min = new Date(min.getFullYear(), min.getMonth(), 1);
    max = new Date(max.getFullYear(), max.getMonth(), 1);
    const months = [];
    const cursor = new Date(min);
    while (cursor <= max && months.length < 12) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    if (months.length < 3) {
      while (months.length < 6) {
        const last = months[months.length - 1];
        months.push(new Date(last.getFullYear(), last.getMonth() + 1, 1));
      }
    }
    return months;
  }

  function scheduleBarTone(c, inst) {
    if (!isSigned(c)) return 'red';
    const st = instPill(inst);
    if (st.scheme === 'green') return 'green';
    return 'amber';
  }

  function scheduleViewHtml(list) {
    const months = scheduleRange(list);
    const start = months[0];
    const end = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1);
    const spanMs = Math.max(1, end - start);
    const monthLabels = months.map(d =>
      `<span class="rd-con-sched__m">${esc(d.toLocaleDateString(undefined, { month: 'short' }))}</span>`
    ).join('');
    const rangeLabel = months.length
      ? (months.length + ' months, '
        + months[0].toLocaleDateString(undefined, { month: 'long' })
        + ' to '
        + months[months.length - 1].toLocaleDateString(undefined, { month: 'long' }))
      : 'Schedule';

    const rowsHtml = list.map(c => {
      const stages = linkedInstallments(c);
      const typeBit = (conType(c) || 'Contract').replace(/contract/i, '').trim() || conType(c);
      const meta = typeBit + ' · ' + money0(conTotal(c))
        + (!isSigned(c) ? ' · unsigned' : (/hold/i.test(conStatus(c)) ? ' · held' : ''));
      const bars = stages.map(({ inst, p, j }, idx) => {
        const due = toDate(inst.dueDate) || toDate(conSigned(c)) || start;
        const left = Math.max(0, Math.min(96, ((due - start) / spanMs) * 100));
        const width = Math.max(8, Math.min(18, 100 / Math.max(months.length, 1) + 2));
        const tone = scheduleBarTone(c, inst);
        const label = (inst.label || ('Instalment ' + (idx + 1))) + ' ' + money0(inst.amountDue);
        const cid = conId(c) || indexOfRow(c);
        const payKey = p ? (p._id || p.id || '') : '';
        return `<button type="button" class="rd-con-sched__bar is-${tone}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"
          title="${esc(label + (inst.dueDate ? ' · ' + shortDate(inst.dueDate, true) : ''))}"
          onclick="event.stopPropagation();rdConOpenDrawer('${esc(cid)}');rdConDrawerTab(2)"
          oncontextmenu="event.preventDefault();rdConEditInstDate('${esc(cid)}',${p ? `'${esc(String(payKey))}'` : 'null'},${j})">${esc(label)}</button>`;
      }).join('');
      return `<div class="rd-con-sched__row" onclick="rdConOpenDrawer('${esc(conId(c) || indexOfRow(c))}')">
        <div class="rd-con-sched__label">
          <div class="rd-con-sched__name">${esc(conVendor(c) || conName(c))}</div>
          <div class="rd-con-sched__meta">${esc(meta)}</div>
        </div>
        <div class="rd-con-sched__track" style="--con-sched-months:${months.length}">${bars || '<span class="rd-con-sched__empty">No instalments</span>'}</div>
      </div>`;
    }).join('');

    if (!list.length) return '<div class="rd-con-empty">No contracts to schedule yet.</div>';
    return `<div class="rd-con-sched">
      <div class="rd-con-sched__head">
        <div class="rd-con-eyebrow">${esc(rangeLabel)}</div>
        <div class="rd-con-muted">Green paid · amber scheduled · red unsigned — edit a bar to change its due date</div>
      </div>
      <div class="rd-con-sched__months"><span class="rd-con-sched__mspacer"></span>${monthLabels}</div>
      <div class="rd-con-sched__body">${rowsHtml}</div>
    </div>`;
  }

  function documentsGridHtml() {
    /* Legacy name — custody cards are the Documents view. */
    return documentsCustodyHtml();
  }

  function renderContractsTable() {
    const host = document.getElementById('contracts-body');
    if (!host) return;
    const f = contractFigures();
    const all = rows().filter(railMatch);
    const list = sortRows(visibleRows());
    const mode = window._conMode || 'table';
    const cf = window._conFilters || {};
    const filterOn = ['vendor', 'status', 'due'].some(k => cf[k] && cf[k] !== 'all');
    if (mode === 'table' && typeof RdStates !== 'undefined' && RdStates.maybeEmpty &&
        (all.length === 0 || (filterOn && list.length === 0))) {
      host.innerHTML = toolbarHtml()
        + '<div class="rd-bulkbar rd-con-bulkbar" id="contracts-bulk-bar" hidden></div>'
        + '<div id="rd-contracts-table" data-rd-state-slot="1"></div>';
      RdStates.maybeEmpty(host.querySelector('#rd-contracts-table'), {
        pageId: 'contracts',
        total: all.length,
        filtered: list.length,
        filterOn: filterOn,
        onClear: function () {
          window._conFilters = { vendor: 'all', status: 'all', due: 'all' };
          renderContractsTable();
        }
      });
      return;
    }
    const dataSpan = visibleCols().length;
    const fullSpan = dataSpan + 1;

    let main;
    if (mode === 'documents') {
      main = documentsGridHtml();
    } else if (mode === 'schedule') {
      main = scheduleViewHtml(list);
    } else {
      const groups = [];
      list.forEach(c => {
        const key = groupKey(c);
        let g = groups.find(x => x.key === key);
        if (!g) { g = { key: key, rows: [] }; groups.push(g); }
        g.rows.push(c);
      });
      /* When grouping by vendor and every row shares one vendor bucket label
         style, still show a Booked summary if there's only one group covering
         the whole list — matching 10c's single Booked band. */
      let body = '';
      if (groups.length === 1 && (window._conGroupBy || 'vendor') === 'vendor') {
        const g = groups[0];
        body += `<tr class="rd-con-grouprow"><td colspan="${fullSpan}">${esc(groupLabel(g.key, g.rows, f))}</td></tr>`
          + g.rows.map(contractRowHtml).join('');
      } else {
        body = groups.map(g =>
          `<tr class="rd-con-grouprow"><td colspan="${fullSpan}">${esc(groupLabel(g.key, g.rows, f))}</td></tr>`
          + g.rows.map(contractRowHtml).join('')
        ).join('');
      }
      body += `<tr class="rd-con-addrow" onclick="rdConAddContract()"><td class="rd-con-tick">+</td><td colspan="${dataSpan}">Add a contract — pick a vendor first</td></tr>`;
      if (!list.length) {
        body = `<tr class="rd-con-addrow" onclick="rdConAddContract()"><td class="rd-con-tick">+</td><td colspan="${dataSpan}">${anyFilter() ? 'No contracts match these filters' : 'No contracts yet'} — add the first one…</td></tr>`;
      }
      main = `<div class="rd-con-tablewrap" id="rd-contracts-table" data-rd-row-height="${esc(rowHeightLabel())}">
        <table class="rd-con-table rd-table rd-table--${esc(rowHeightLabel())}">
          <thead><tr>
            <th class="rd-con-tick" style="width:34px"></th>
            ${colHeadHtml()}
          </tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>` + documentsStripHtml();
    }

    host.innerHTML = toolbarHtml()
      + '<div class="rd-bulkbar rd-con-bulkbar" id="contracts-bulk-bar" hidden></div>'
      + main;
    renderContractsBulkBar();
  }

  function anyFilter() {
    const f = window._conFilters || {};
    return ['vendor', 'status', 'due'].some(k => f[k] && f[k] !== 'all') || (window._conRailView && window._conRailView !== 'all');
  }

  function renderContractsBulkBar() {
    const bar = document.getElementById('contracts-bulk-bar');
    if (!bar) return;
    const n = window._conSel.size;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep"></span>
      <button type="button" class="rd-bulkbar__action" onclick="rdConBulkAttach()">Attach document</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdConBulkRemind()">Set reminder</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdConBulkExport()">Export as PDF</button>
      <button type="button" class="rd-bulkbar__action" onclick="rdConBulkPrint()">Print packet</button>
      <button type="button" class="rd-bulkbar__clear" onclick="rdConClearSel()">Clear selection</button>`;
  }

  /* ── drawer ───────────────────────────────────────────────────────────── */

  function drawerField(label, control) {
    return `<div class="rd-drawer-field"><span class="rd-drawer-label">${esc(label)}</span>${control}</div>`;
  }
  function drawerInput(key, value, opts) {
    const o = opts || {};
    const type = o.type || 'text';
    const list = o.list ? ` list="${o.list}"` : '';
    const cls = o.link ? ' class="rd-con-linkfield"' : '';
    return `<input${cls} type="${type}" data-conf="${esc(key)}" value="${esc(value == null ? '' : value)}"${list}${o.step ? ' step="' + o.step + '"' : ''}>`;
  }
  function drawerSectionTitle(t) {
    return `<div class="rd-con-eyebrow rd-drawer-sect">${esc(t)}</div>`;
  }

  function drawerDocumentTab(c) {
    const file = conFileName(c);
    const pages = conPages(c);
    let html = drawerSectionTitle('The document')
      + drawerField('Kind', drawerInput('type', conType(c)))
      + drawerField('Vendor', drawerInput('vendor', conVendor(c), { list: 'vendor-name-options', link: true }))
      + drawerField('Value', drawerInput('total', conTotal(c), { type: 'number', step: '0.01' }))
      + drawerField('Signed', drawerInput('date', conSigned(c), { type: 'date' }))
      + drawerField('File', drawerInput('fileName', file || (pages ? pages + ' pages' : ''), { link: !!file }));

    html += drawerSectionTitle('Signatories');
    const sigs = conSignatories(c);
    html += sigs.map(s => {
      if (s.note) {
        return `<div class="rd-con-histrow"><span>${esc(s.name || 'Witness')}</span><span class="rd-con-muted">${esc(s.note)}</span></div>`;
      }
      return `<div class="rd-con-histrow"><span>${esc(s.name || '')}</span><span class="rd-con-muted">${s.date ? esc(shortDate(s.date)) : '—'}</span></div>`;
    }).join('');
    html += `<div class="rd-drawer-note">The planner stores the file and the figures separately. Change the figure here and the budget line follows; the PDF does not.</div>`;
    return html;
  }

  function drawerTermsTab(c) {
    const clauses = conClauseRows(c);
    let html = drawerSectionTitle('Key terms');
    clauses.forEach(row => {
      html += drawerField(row.label, drawerInput(row.key, row.value));
    });
    html += drawerSectionTitle('Dates that matter')
      + drawerField('Free-cancel until', drawerInput('cancelBy', conCancelBy(c), { type: 'date' }))
      + drawerField('Balance due', drawerInput('balanceDue', balanceDueDate(c), { type: 'date' }))
      + drawerField('Delivery due', drawerInput('deliveryDue', deliveryDueDate(c), { type: 'date' }));
    const cancel = conCancelBy(c);
    const dep = conDeposit(c);
    if (cancel) {
      html += `<div class="rd-con-callout">Free-cancellation closes on ${esc(longDate(cancel))}.${dep ? ' After that the ' + money0(dep) + ' deposit is gone whatever happens.' : ''}</div>`;
    } else {
      html += `<div class="rd-drawer-note">The four clauses that decide what happens when something goes wrong.</div>`;
    }
    return html;
  }

  function drawerPaymentsTab(c) {
    const linked = linkedPayments(c);
    const stages = linkedInstallments(c);
    const own = hasOwnSchedule(c);
    let html = '';
    if (!own && stages.length) {
      html += `<div class="rd-con-callout">This contract has no schedule of its own — its instalments sit on the ${esc(conVendor(c) || 'linked')} <b>payment</b> record. Attaching a schedule moves them here and clears item 04 in the Database Hub.</div>`;
    }
    html += drawerSectionTitle('Invoices');
    if (linked.length) {
      html += linked.map(p => {
        const st = typeof paymentDisplayStatus === 'function' ? paymentDisplayStatus(p) : (p.status || '');
        const due = typeof paymentBudgetDueTotal === 'function' ? paymentBudgetDueTotal(p) : (parseFloat(p.due) || 0);
        const paid = typeof paymentBudgetPaidTotal === 'function' ? paymentBudgetPaidTotal(p) : (parseFloat(p.paid) || 0);
        const remain = Math.max(0, due - paid);
        const inv = p.invoice || p.inv || p.ref || p._id || 'Invoice';
        const label = String(inv) + (p.desc ? ' · ' + p.desc : '');
        const right = st === 'Paid' || remain <= 0
          ? money0(paid || due) + ' paid'
          : money0(remain) + (p.date ? ' due ' + shortDate(p.date) : ' due');
        return `<div class="rd-con-histrow"><span>${esc(label)}</span><span style="color:${remain <= 0 ? 'var(--status-green-text,#2f6b45)' : 'var(--text)'}">${esc(right)}</span></div>`;
      }).join('');
    } else if (stages.length) {
      html += stages.map(({ inst }) => {
        const paid = /paid/i.test(inst.status || '') || ((parseFloat(inst.amountPaid) || 0) >= (parseFloat(inst.amountDue) || 0) && (parseFloat(inst.amountDue) || 0) > 0);
        const right = paid
          ? money0(inst.amountPaid || inst.amountDue) + ' paid'
          : money0(inst.amountDue) + (inst.dueDate ? ' due ' + shortDate(inst.dueDate) : '');
        return `<div class="rd-con-histrow"><span>${esc(inst.label || 'Instalment')}</span><span style="color:${paid ? 'var(--status-green-text,#2f6b45)' : 'var(--text)'}">${esc(right)}</span></div>`;
      }).join('');
    } else {
      html += '<div class="rd-con-empty">No invoices raised against this contract yet.</div>';
    }

    const invoiced = linked.length
      ? linked.reduce((n, p) => n + (typeof paymentBudgetDueTotal === 'function' ? paymentBudgetDueTotal(p) : (parseFloat(p.due) || 0)), 0)
      : stages.reduce((n, s) => n + (parseFloat(s.inst.amountDue) || 0), 0);
    html += drawerSectionTitle('Totals')
      + `<div class="rd-con-histrow"><span>Contract value</span><span>${money0(conTotal(c))}</span></div>`
      + `<div class="rd-con-histrow"><span>Invoiced</span><span>${money0(invoiced)}</span></div>`
      + `<div class="rd-con-histrow"><span>Paid</span><span>${money0(conPaid(c))}</span></div>`
      + `<div class="rd-con-histrow"><span>Outstanding</span><span>${money0(conOutstanding(c))}</span></div>`;
    if (Math.abs(invoiced - conTotal(c)) < 0.5 && invoiced > 0) {
      html += `<div class="rd-drawer-note">Invoiced equals contract value, so nothing is unbilled. A mismatch here is the first sign of a scope change nobody recorded.</div>`;
    } else if (!stages.length && !linked.length) {
      html += `<div class="rd-con-callout">No payment schedule yet. Attach a schedule so instalments live on this contract, or link a payment record.</div>`;
    }
    return html;
  }

  function drawerHistoryTab(c) {
    const events = [];
    if (typeof recordHistoryFor === 'function') {
      const log = recordHistoryFor('contracts', conId(c) || indexOfRow(c)) || [];
      log.forEach(e => {
        events.push({
          what: e.label || e.what || e.summary || e.action || 'Updated',
          who: e.who || e.by || e.actor || 'System',
          when: e.when || e.date || e.at || '',
          time: e.time || ''
        });
      });
    }
    if (Array.isArray(c.history)) {
      c.history.forEach(e => {
        events.push({
          what: e.label || e.what || e.summary || 'Updated',
          who: e.who || e.by || 'System',
          when: e.when || e.date || '',
          time: e.time || ''
        });
      });
    }
    if (!events.length) {
      if (conSigned(c)) events.push({ what: 'Signed by couple', who: 'System', when: conSigned(c), time: '' });
      docList(c).forEach(d => {
        if (d.date) events.push({ what: (d.kind || 'Document') + ' attached · ' + d.name, who: 'System', when: d.date, time: '' });
      });
      linkedInstallments(c).forEach(({ inst }) => {
        if (inst.paidDate) {
          events.push({
            what: (inst.label || 'Instalment') + ' paid · ' + money0(inst.amountPaid || inst.amountDue),
            who: 'System',
            when: inst.paidDate,
            time: ''
          });
        }
      });
      if (conTotal(c)) {
        events.push({
          what: 'Budget line committed ' + money0(conTotal(c)),
          who: 'System',
          when: conSigned(c) || '',
          time: ''
        });
      }
    }
    events.sort((a, b) => String(b.when || '').localeCompare(String(a.when || '')));
    return drawerSectionTitle('Activity')
      + (events.length
        ? events.map(e => {
          const when = [e.who, e.when ? shortDate(e.when) : '', e.time].filter(Boolean).join(' · ');
          return `<div class="rd-con-histrow"><span>${esc(e.what)}</span><span class="rd-con-muted">${esc(when || '—')}</span></div>`;
        }).join('')
        : '<div class="rd-con-empty">No dated activity on this contract yet.</div>')
      + `<div class="rd-drawer-note">Version by version — including the clause the studio quietly changed between drafts.</div>`;
  }

  function drawerFootHtml(tabIdx, c) {
    if (tabIdx === 0) {
      return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdConDrawerSave()">Save</button>'
        + '<button type="button" class="rd-btn" onclick="rdConOpenFile()">Open file</button>';
    }
    if (tabIdx === 1) {
      return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdConDrawerSave()">Save</button>'
        + '<button type="button" class="rd-btn" onclick="rdConAddReminder()">Add reminder</button>';
    }
    if (tabIdx === 2) {
      if (needsSchedule(c)) {
        return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdConAttachSchedule()">Attach schedule</button>'
          + '<button type="button" class="rd-btn" onclick="rdConOpenPayments()">Open Payments</button>';
      }
      return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdConDrawerSave()">Save</button>'
        + '<button type="button" class="rd-btn" onclick="rdConOpenPayments()">Open Payments</button>';
    }
    return '<button type="button" class="rd-btn rd-btn--primary" onclick="rdConCloseDrawer()">Close</button>'
      + '<button type="button" class="rd-btn" onclick="rdConExportRecord()">Export record</button>';
  }

  function renderContractsDrawer() {
    const slot = document.getElementById('contracts-drawer-slot');
    if (!slot) return;
    const c = window._conDrawerId != null && window._conDrawerId !== '' ? rowById(window._conDrawerId) : null;
    if (!c) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
      window._conDrawerId = null;
      return;
    }
    const tabIdx = Math.min(Math.max(0, window._conDrawerTab | 0), CON_DRAWER_TABS.length - 1);
    const invN = invoiceCount(c);
    const pills = [conPill(c)];
    if (invN) pills.unshift({ label: invN + ' invoice' + (invN === 1 ? '' : 's'), scheme: 'blue' });
    let body;
    if (tabIdx === 0) body = drawerDocumentTab(c);
    else if (tabIdx === 1) body = drawerTermsTab(c);
    else if (tabIdx === 2) body = drawerPaymentsTab(c);
    else body = drawerHistoryTab(c);

    const typeEyebrow = 'Document · ' + (conType(c).toLowerCase() === 'contract' && /venue|hall|chapel/i.test(conVendor(c) + ' ' + conName(c))
      ? 'venue'
      : (conType(c).toLowerCase() || 'contract'));

    slot.classList.add('is-open');
    slot.innerHTML = `<aside class="rd-drawer rd-con-drawer" aria-label="Contract">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrowrow">
          <span class="rd-drawer__eyebrow">${esc(typeEyebrow)}</span>
          <button type="button" class="rd-drawer__close" aria-label="Close" onclick="rdConCloseDrawer()">&#10005;</button>
        </div>
        <div class="rd-drawer__title">${esc(conName(c))}</div>
        <div class="rd-drawer__pills">${pills.map(pillHtml).join('')}</div>
        <div class="rd-drawer__tabs is-guest-tabs">${CON_DRAWER_TABS.map((t, i) =>
      `<button type="button" class="rd-drawer__tab${i === tabIdx ? ' is-active' : ''}" onclick="rdConDrawerTab(${i})">${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="rd-drawer__body rd-drawer-fields">${body}</div>
      <div class="rd-drawer__foot">${drawerFootHtml(tabIdx, c)}</div>
    </aside>`;
  }

  /* ── actions ──────────────────────────────────────────────────────────── */

  function persist() { if (typeof save === 'function') save(); }
  function rerender() { renderContractsRd(); }

  function rdConOpenDrawer(id) {
    /* Ensure every contract has a stable id so row clicks resolve after sort/filter. */
    rows().forEach(c => {
      if (!c._id && typeof ensureRowId === 'function') ensureRowId(c, 'contracts');
    });
    let key = id == null ? '' : String(id);
    let c = key ? rowById(key) : null;
    if (!c && key !== '' && /^\d+$/.test(key)) {
      const list = rows();
      const i = parseInt(key, 10);
      if (i >= 0 && i < list.length) c = list[i];
    }
    if (!c) return;
    if (!conId(c) && typeof ensureRowId === 'function') ensureRowId(c, 'contracts');
    window._conDrawerId = conId(c) || String(indexOfRow(c));
    window._conDrawerTab = 0;
    renderContractsDrawer();
    const slot = document.getElementById('contracts-drawer-slot');
    if (!slot) {
      /* Fallback: full record editor if the page drawer slot is missing. */
      const i = indexOfRow(c);
      if (i >= 0 && typeof openRecordEditor === 'function') openRecordEditor('contracts', i);
      return;
    }
    slot.classList.add('is-open');
    const row = document.getElementById('contracts-surface-row');
    if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function rdConCloseDrawer() {
    window._conDrawerId = null;
    renderContractsDrawer();
  }
  function rdConDrawerTab(i) {
    window._conDrawerTab = i | 0;
    renderContractsDrawer();
  }
  function rdConDrawerSave() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    const slot = document.getElementById('contracts-drawer-slot');
    if (!c || !slot) return;
    const read = key => {
      const el = slot.querySelector('[data-conf="' + key + '"]');
      return el ? el.value : null;
    };
    const vendor = read('vendor');
    if (vendor != null) c.vendor = vendor;
    const type = read('type');
    if (type != null) c.type = type;
    const date = read('date');
    if (date != null) c.date = date;
    const total = read('total');
    if (total != null && total !== '') {
      const n = parseFloat(String(total).replace(/[^0-9.]/g, '')) || 0;
      c.total = n;
      c.amount = n;
    }
    const fileName = read('fileName');
    if (fileName != null && fileName !== '') {
      if (c.contractFile && typeof c.contractFile === 'object') c.contractFile.name = fileName;
      else c.contractFile = { name: fileName };
    }
    ['cancellation', 'reschedule', 'delivery', 'copyright'].forEach(k => {
      const v = read(k);
      if (v != null) c[k] = v;
    });
    const cancel = read('cancelBy');
    if (cancel != null) c.cancelBy = cancel;
    const balDue = read('balanceDue');
    if (balDue != null) c.balanceDue = balDue;
    const delDue = read('deliveryDue');
    if (delDue != null) c.deliveryDue = delDue;
    persist();
    rerender();
    if (typeof toast === 'function') toast('Contract saved');
  }
  function rdConDrawerFullEditor() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    const i = c ? indexOfRow(c) : -1;
    if (i >= 0 && typeof openRecordEditor === 'function') openRecordEditor('contracts', i);
    else if (typeof openDataHub === 'function') openDataHub('finances', 'contracts');
  }
  function rdConFullEditor() {
    if (window._conDrawerId != null) rdConDrawerFullEditor();
    else if (typeof openDataHub === 'function') openDataHub('finances', 'contracts');
  }
  function rdConAttachSchedule() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    if (!c) return;
    if (!Array.isArray(c.installments)) c.installments = [];
    if (!c.installments.length) {
      const stages = linkedInstallments(c);
      if (stages.length) {
        c.installments = stages.map(({ inst }) => Object.assign({}, inst));
      } else {
        const remain = conOutstanding(c);
        c.installments = [
          { label: 'Deposit', dueDate: conSigned(c) || '', amountDue: conDeposit(c) || 0, amountPaid: conDeposit(c) || 0, status: conDeposit(c) ? 'Paid' : 'Not Paid', paidDate: conDeposit(c) ? (conSigned(c) || '') : '', notes: '' },
          { label: 'Balance', dueDate: '', amountDue: remain, amountPaid: 0, status: 'Not Paid', paidDate: '', notes: '' }
        ];
      }
    }
    persist();
    window._conDrawerTab = 2;
    rerender();
    if (typeof toast === 'function') toast('Schedule attached to contract');
  }
  function rdConAddContract() {
    if (typeof blankRecord === 'function') {
      const row = blankRecord('contracts');
      data.contracts = data.contracts || [];
      data.contracts.push(row);
      persist();
      rerender();
      rdConOpenDrawer(conId(row) || String(data.contracts.length - 1));
      return;
    }
    if (typeof addContractRow === 'function' && addContractRow !== rdConAddContract) {
      /* fall through — we replaced addContractRow below */
    }
    data.contracts = data.contracts || [];
    data.contracts.push({
      _id: typeof nextRecordId === 'function' ? nextRecordId('contracts') : ('CON-' + Date.now()),
      name: '', vendor: '', type: 'Contract', date: '', amount: 0, total: 0, deposit: 0,
      status: 'Not Signed', where: '', contractFile: null, invoiceFile: null, notes: ''
    });
    persist();
    rerender();
    rdConOpenDrawer(String(data.contracts.length - 1));
  }
  function rdConUploadDoc(id) {
    if (id != null) rdConOpenDrawer(id);
    window._conDrawerTab = 0;
    renderContractsDrawer();
    if (typeof toast === 'function') toast('Attach the file on the Document tab, or use the full editor');
  }

  function rdConOpenFile() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    if (!c) return;
    const name = conFileName(c);
    if (name && typeof toast === 'function') toast('Open “' + name + '” from Downloads or the full editor');
    else if (typeof toast === 'function') toast('No file attached yet — upload one on the Document tab');
    else rdConDrawerFullEditor();
  }
  function rdConAddReminder() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    const when = c ? (conCancelBy(c) || balanceDueDate(c) || '') : '';
    if (typeof toast === 'function') {
      toast(when
        ? 'Reminder flagged for ' + shortDate(when, true)
        : 'Reminder flagged on this contract');
    }
  }
  function rdConOpenPayments() {
    if (typeof showPanel === 'function') showPanel('payments');
    else if (typeof toast === 'function') toast('Open Payments from Money');
  }
  function rdConExportRecord() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : null;
    if (!c) return;
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Contract', [contractsExportRows().find(r => r.Contract === conName(c)) || {
        Contract: conName(c), Vendor: conVendor(c), Total: conTotal(c), Paid: conPaid(c), Status: conStatus(c)
      }]);
    } else if (typeof toast === 'function') toast('Exported ' + conName(c));
  }
  function rdConDownloadAll() {
    const n = allDocuments().length;
    if (typeof toast === 'function') toast(n ? ('Preparing download of ' + n + ' file' + (n === 1 ? '' : 's')) : 'No files to download yet');
  }
  function rdConAddInstalment() {
    const c = window._conDrawerId != null ? rowById(window._conDrawerId) : (visibleRows()[0] || rows()[0] || null);
    if (!c) {
      rdConAddContract();
      return;
    }
    if (!Array.isArray(c.installments)) c.installments = [];
    c.installments.push({
      label: 'Instalment',
      dueDate: '',
      amountDue: 0,
      amountPaid: 0,
      status: 'Not Paid',
      paidDate: '',
      notes: ''
    });
    persist();
    window._conDrawerId = conId(c) || String(indexOfRow(c));
    window._conDrawerTab = 2;
    window._conMode = 'schedule';
    rerender();
    if (typeof toast === 'function') toast('Instalment added — set the due date on the schedule');
  }
  function rdConEditInstDate(cid, payId, instIdx) {
    const c = rowById(cid);
    if (!c) return;
    let inst = null;
    let owner = null;
    if (payId && payId !== 'null' && payId !== 'undefined') {
      const p = payments().find(x => String(x._id || x.id || '') === String(payId));
      if (p && Array.isArray(p.installments) && p.installments[instIdx]) {
        inst = p.installments[instIdx];
        owner = 'payment';
      }
    }
    if (!inst && Array.isArray(c.installments) && c.installments[instIdx]) {
      inst = c.installments[instIdx];
      owner = 'contract';
    }
    if (!inst) {
      const stages = linkedInstallments(c);
      if (stages[instIdx]) {
        inst = stages[instIdx].inst;
        owner = stages[instIdx].p ? 'payment' : 'contract';
      }
    }
    if (!inst) return;
    const cur = inst.dueDate || '';
    const next = typeof prompt === 'function'
      ? prompt('Due date for ' + (inst.label || 'instalment') + ' (YYYY-MM-DD). Writes to the ' + owner + '.', cur)
      : cur;
    if (next == null) return;
    const cleaned = String(next).trim().slice(0, 10);
    if (cleaned && !/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      if (typeof toast === 'function') toast('Use YYYY-MM-DD');
      return;
    }
    inst.dueDate = cleaned;
    /* Prefer writing onto the contract’s own schedule when present. */
    if (owner === 'payment' && !hasOwnSchedule(c) && Array.isArray(c.installments)) {
      /* already on payment — leave there */
    }
    persist();
    rerender();
    if (typeof toast === 'function') toast('Instalment date updated on the contract schedule');
  }

  function rdConSetMode(mode) {
    window._conMode = mode === 'documents' || mode === 'schedule' ? mode : 'table';
    const panel = document.getElementById('panel-contracts');
    const actions = panel && panel.querySelector('.rd-pagehead__actions');
    if (actions) actions.innerHTML = pageheadActionsHtml();
    renderContractStatsRd();
    renderContractsTable();
  }
  function rdConTogglePlan(id) {
    window._conExpanded = String(window._conExpanded || '') === String(id) ? null : String(id);
    renderContractsTable();
  }
  function rdConToggleSel(id, on) {
    if (on) window._conSel.add(String(id));
    else window._conSel.delete(String(id));
    renderContractsBulkBar();
    const safe = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(id)) : String(id).replace(/"/g, '');
    const row = document.querySelector('tr[data-con-id="' + safe + '"]');
    if (row) row.classList.toggle('is-selected', !!on);
  }
  function rdConClearSel() {
    window._conSel.clear();
    renderContractsTable();
  }
  function rdConBulkAttach() {
    if (!window._conSel.size) return;
    const id = Array.from(window._conSel)[0];
    rdConOpenDrawer(id);
    window._conDrawerTab = 0;
    renderContractsDrawer();
  }
  function rdConBulkRemind() {
    if (typeof toast === 'function') toast('Reminder flagged on ' + window._conSel.size + ' contract' + (window._conSel.size === 1 ? '' : 's'));
  }
  function rdConBulkExport() {
    if (typeof exportSectionCSV === 'function') exportSectionCSV('Contracts', contractsExportRows());
  }
  function rdConBulkPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
  }

  function rdConOpenFilter(field, btn) {
    let opts;
    if (field === 'vendor') {
      const names = [...new Set(rows().map(conVendor).filter(Boolean))].sort();
      opts = [{ value: 'all', label: 'All' }].concat(names.map(n => ({ value: n, label: n })));
    } else if (field === 'status') {
      const labels = [...new Set(rows().map(c => conPill(c).label).concat(typeof CONTRACT_STATUS !== 'undefined' ? CONTRACT_STATUS : []))];
      opts = [{ value: 'all', label: 'All' }].concat(labels.map(n => ({ value: n, label: n })));
    } else {
      opts = [
        { value: 'all', label: 'All' },
        { value: 'overdue', label: 'Overdue' },
        { value: '30', label: 'Next 30 days' },
        { value: 'none', label: 'No due date' }
      ];
    }
    const cur = (window._conFilters || {})[field] || 'all';
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, cur, val => {
        window._conFilters[field] = val || 'all';
        renderContractsTable();
      });
    }
  }
  function rdConClearFilter(field) {
    window._conFilters[field] = 'all';
    renderContractsTable();
  }
  function rdConOpenSort(btn) {
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, CON_SORT_OPTIONS, window._conSort || 'due', val => {
        window._conSort = val || 'due';
        renderContractsTable();
      });
    }
  }
  function rdConOpenColumns(btn) {
    const hid = hiddenCols();
    const opts = CON_COLUMNS.map(c => ({ value: c.key, label: c.label, on: !hid.has(c.key) }));
    if (typeof window.rdPickMany === 'function') {
      window.rdPickMany(btn, opts, null, (key, on) => {
        if (on) hid.delete(key);
        else {
          if (hid.size >= CON_COLUMNS.length - 1) return;
          hid.add(key);
        }
        persistCols();
        renderContractsTable();
      });
    } else if (window.rdColumns && typeof window.rdColumns.open === 'function') {
      window.rdColumns.open(btn, 'contracts');
    }
  }
  function rdConAutoFitColumns() {
    const mount = document.getElementById('rd-contracts-table');
    const table = mount && mount.querySelector('table');
    if (!table) return;
    if (typeof window.rdAutoFitTable === 'function') window.rdAutoFitTable(table);
  }
  function rdConCycleRowHeight() {
    const cur = rowHeightLabel();
    const i = ROW_HEIGHTS.indexOf(cur);
    const next = ROW_HEIGHTS[(i + 1) % ROW_HEIGHTS.length];
    try { localStorage.setItem(rowHeightKey(), next); } catch (e) { /* private */ }
    renderContractsTable();
  }

  function applyContractsRailView(id) {
    window._conRailView = id || 'all';
    if (typeof setSavedView === 'function') setSavedView('contracts', window._conRailView);
    rerender();
  }
  function applyContractsGroupBy(id) {
    window._conGroupBy = id === 'due' || id === 'status' ? id : 'vendor';
    rerender();
  }

  function contractsExportRows() {
    return sortRows(visibleRows()).map(c => {
      const next = nextDueInfo(c);
      return {
        Contract: conName(c),
        Vendor: conVendor(c),
        Type: conType(c),
        Signed: conSigned(c),
        Total: conTotal(c),
        Paid: conPaid(c),
        Outstanding: conOutstanding(c),
        'Next due': next ? (next.due || '') : '',
        'Next due amount': next ? (next.amount || 0) : 0,
        Status: conStatus(c),
        Documents: docCount(c)
      };
    });
  }

  /* ── orchestration ────────────────────────────────────────────────────── */

  function wireContractsRowClicks() {
    const host = document.getElementById('contracts-body');
    if (!host || host.dataset.rdConClickWired === '1') return;
    host.dataset.rdConClickWired = '1';
    host.addEventListener('click', function (ev) {
      const t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('input,select,textarea,button,a,label,.rd-con-planlink,.rd-chip,.rd-viewswitch,.rd-con-sched__bar,.rd-con-card,.rd-con-doc')) return;
      const row = t.closest('tr.rd-con-row[data-con-id]');
      if (!row) return;
      const id = row.getAttribute('data-con-id');
      if (id != null && id !== '') rdConOpenDrawer(id);
    });
  }

  function renderContractsRd() {
    rows().forEach(c => {
      if (!c._id && typeof ensureRowId === 'function') ensureRowId(c, 'contracts');
    });
    uedContractsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('contracts');
    if (typeof syncVendorNameOptions === 'function') syncVendorNameOptions();
    renderContractStatsRd();
    renderContractsTable();
    wireContractsRowClicks();
    renderContractsDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'contracts'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('contracts');
    }
    requestAnimationFrame(() => {
      if (typeof makeColumnsResizable === 'function') makeColumnsResizable(document.getElementById('panel-contracts'));
    });
  }

  /* Keep rentals available for the Finances Hub without rebuilding the old
     contracts+rentals shell when this redesign is mounted. */
  const _origRenderRentals = typeof window.renderRentals === 'function' ? window.renderRentals : null;
  function renderRentalsRd() {
    const panel = document.getElementById('panel-contracts');
    if (panel && panel.dataset.uedShell === 'contracts-rd10c') {
      if (typeof isDataHubPanelActive === 'function' && isDataHubPanelActive()
        && typeof _dataHub !== 'undefined' && _dataHub.category === 'finances' && _dataHub.table === 'rentals'
        && typeof cwpRenderTable === 'function') {
        cwpRenderTable('rentals', 'cwp-data-hub-active');
      }
      return;
    }
    if (_origRenderRentals) _origRenderRentals();
  }

  /* ── exports ──────────────────────────────────────────────────────────── */

  window.__contractsRenderRd = renderContractsRd;
  window.uedContractsShell = uedContractsShellRd;
  window.renderContracts = renderContractsRd;
  window.renderContractStats = renderContractStatsRd;
  window.renderRentals = renderRentalsRd;
  window.addContractRow = rdConAddContract;
  window.openContractUpload = rdConUploadDoc;

  window.contractFigures = contractFigures;
  window.contractRailCounts = contractRailCounts;
  window.contractsExportRows = contractsExportRows;
  window.applyContractsRailView = applyContractsRailView;
  window.applyContractsGroupBy = applyContractsGroupBy;

  window.rdConJumpTo = function (id) {
    const el = document.getElementById(id);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  window.rdConSetMode = rdConSetMode;
  window.rdConOpenFilter = rdConOpenFilter;
  window.rdConClearFilter = rdConClearFilter;
  window.rdConOpenSort = rdConOpenSort;
  window.rdConOpenColumns = rdConOpenColumns;
  window.rdConCycleRowHeight = rdConCycleRowHeight;
  window.rdConAutoFitColumns = rdConAutoFitColumns;
  window.rdConToggleSel = rdConToggleSel;
  window.rdConClearSel = rdConClearSel;
  window.rdConBulkAttach = rdConBulkAttach;
  window.rdConBulkRemind = rdConBulkRemind;
  window.rdConBulkExport = rdConBulkExport;
  window.rdConBulkPrint = rdConBulkPrint;
  window.rdConOpenDrawer = rdConOpenDrawer;
  window.rdConCloseDrawer = rdConCloseDrawer;
  window.rdConDrawerTab = rdConDrawerTab;
  window.rdConDrawerSave = rdConDrawerSave;
  window.rdConDrawerFullEditor = rdConDrawerFullEditor;
  window.rdConFullEditor = rdConFullEditor;
  window.rdConAttachSchedule = rdConAttachSchedule;
  window.rdConAddContract = rdConAddContract;
  window.rdConUploadDoc = rdConUploadDoc;
  window.rdConTogglePlan = rdConTogglePlan;
  window.rdConOpenFile = rdConOpenFile;
  window.rdConAddReminder = rdConAddReminder;
  window.rdConOpenPayments = rdConOpenPayments;
  window.rdConExportRecord = rdConExportRecord;
  window.rdConDownloadAll = rdConDownloadAll;
  window.rdConAddInstalment = rdConAddInstalment;
  window.rdConEditInstDate = rdConEditInstDate;

  function hookContractsPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.contracts = function () { renderContractsRd(); };
    }
  }
  hookContractsPanelRenderer();
  var _showPanelContracts = window.showPanel;
  if (typeof _showPanelContracts === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelContracts.call(window, id, forceOpen);
      hookContractsPanelRenderer();
      return out;
    };
  }
})();
