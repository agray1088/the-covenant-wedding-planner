/* Newlywed Homecoming — Master s33 · 18a · 31g · 31h
   Views: Newlywed Homecoming (18a default) · Name change view (31g) · Budget view (31h).
   18a: Settling in · Name change · First month budget · What we noticed (stacked).
   31g: dependency-ordered name-change list with step bands.
   31h: after-the-day budget cards (Budgeted · Committed · Paid) — separate from wedding budget.
   Rail: Settling in · Name change · First month budget · What we noticed · Group by.
   Drawer: Name-change step · Institution · Documents · Dates · History.
   Thank-you counts fold into Settling rows (Gifts-derived), not typed twice. */
(function () {
  'use strict';

  window._hcPageView = window._hcPageView || 'tasksView';
  window._hcMode = window._hcMode || 'tasks';
  window._hcRailView = window._hcRailView || 'settling';
  window._hcGroupBy = window._hcGroupBy || 'area';
  window._hcUiFilters = window._hcUiFilters || { area: 'all', owner: 'both', status: 'all', person: 'both', category: 'all' };
  window._hcShowDeps = window._hcShowDeps !== false;
  window._hcSel = window._hcSel instanceof Set ? window._hcSel : new Set();
  window._hcDrawerId = window._hcDrawerId || null;
  window._hcDrawerTab = window._hcDrawerTab || 0;

  /* View switcher (31g / 31h) — exact labels per fidelity pass §33. */
  const PAGE_VIEWS = [
    ['tasksView', 'Newlywed Homecoming'],
    ['namechangeView', 'Name change view'],
    ['budgetView', 'Budget view']
  ];

  const AREAS = ['The home', 'Wedding wrap-up', 'Money', 'Church', 'Documents', 'Home Setup', 'Thank-You Notes', 'Other'];
  const OWNERS = ['Both', 'Bride', 'Groom', 'Ama', 'Kwesi', 'Akosua', 'Michael'];
  const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Ready', 'Complete', 'Waiting'];
  const DRAWER_TABS = ['Institution', 'Documents', 'Dates', 'History'];
  /* Four dependency steps (Master 31g). */
  const NAME_BANDS = [
    { id: 'step1', label: 'Step 1 · The document everything else needs' },
    { id: 'step2', label: 'Step 2 · Government · order matters' },
    { id: 'step3', label: 'Step 3 · Money · each needs the passport, not the certificate' },
    { id: 'step4', label: 'Step 4 · Everything else · no dependency, do in any order' },
    { id: 'first', label: 'Step 1 · The document everything else needs' },
    { id: 'then', label: 'Step 2 · Government · order matters' },
    { id: 'any', label: 'Step 4 · Everything else · no dependency, do in any order' }
  ];
  /* Master 18a/31g example: the drawn settling tasks, the eleven-institution
     name-change sequence with its dependency steps and government fees, and
     the first-month budget (incl. the contingent suit-return late fee). */
  const MASTER_SETTLING = [
    ['Sign the tenancy · both names', 'The home', 'Kwesi', '2026-11-14', '', 'Not Started'],
    ['Utilities into both names', 'The home', 'Kwesi', '2026-11-30', 'Tenancy signed', 'Blocked'],
    ['Return the hired suits', 'Wedding wrap-up', 'Michael', '2026-11-10', '', 'Not Started'],
    ['Dress to the cleaner, then boxed', 'Wedding wrap-up', 'Akosua', '2026-11-16', '', 'Not Started'],
    ['Write the last thank-you notes', 'Wedding wrap-up', 'Ama', '2026-11-29', 'Counted from Gifts', 'Not Started'],
    ['Open the joint account', 'Money', 'Both', '2026-11-21', 'Needs new passport', 'Blocked']
  ];
  const MASTER_NAMECHANGE = [
    ['step1', 'Registrar, Accra', 'from 12 Nov · Rev. Mensah files the register', 'Marriage certificate · 3 certified copies', 'Blocks 11 downstream steps', 45, 'Not Started'],
    ['step2', 'Ghana Card update', 'NIA office · in person', 'Needs certificate', 'Passport, mobile money, voter', 20, 'Blocked'],
    ['step2', 'Passport reissue', 'Passport Office, Accra · 6–8 weeks · do not book travel', 'Certificate + old passport', 'Bank, licence, NHIS', 110, 'Blocked'],
    ["step2", "Driver's licence", 'DVLA · after passport', 'Needs passport', '', 35, 'Blocked'],
    ['step2', 'Voter register', 'Electoral Commission', 'Needs Ghana Card', '', 0, 'Blocked'],
    ['step3', 'Bank · primary current account', 'Branch visit', 'Needs passport', 'Joint account', 0, 'Blocked'],
    ['step3', 'Mobile money account', 'Telco shop', 'Needs Ghana Card', '', 0, 'Blocked'],
    ['step3', 'Pension and SSNIT', 'Employer HR handles', 'Needs certificate', '', 0, 'Blocked'],
    ['step4', 'Employer HR record', 'Ama · Kwesi', '—', '', 0, 'Ready'],
    ['step4', 'Insurance policies · 3', 'Health, car, contents', '—', '', 0, 'Ready'],
    ['step4', 'Utilities and landlord', '2 accounts', '—', '', 0, 'Ready'],
    ['step4', 'Email, subscriptions, loyalty', '14 small accounts', '—', '', 0, 'Ready']
  ];
  const MASTER_BUDGET = [
    ['Setting up the home', 'First month rent', 600, 600, 0, 'Due day 1 of the month', 'Committed'],
    ['Setting up the home', 'Utilities connection', 120, 120, 0, '', 'Committed'],
    ['Admin', 'Passport reissue', 110, 110, 0, 'Government fee · after-the-day budget', 'Committed'],
    ['Admin', 'Ghana Card + licence + certificate copies', 100, 100, 0, 'Name-change government fees', 'Committed'],
    ['Living', 'Groceries above the usual', 340, 340, 0, 'Hosting in the first month', 'Underway'],
    ['Living', 'Suit-return late fee', 0, 0, 0, 'Contingent · $40 only if returned after 12 Nov, not a budget line', 'Contingent']
  ];
  /* 31h card ledger — same records as firstMonthBudget; card rows are the canonical set. */
  const MASTER_BUDGET_CARDS = [
    ['Admin', 'Name change fees', '4 government offices', 250, 210, 0, 'Committed'],
    ['Wedding wrap-up', 'Thank-you notes', 'Cards, stamps, printing', 180, 145, 95, 'Underway'],
    ['Wedding wrap-up', 'Dress preservation', 'Clean and box', 300, 0, 0, 'Quote needed'],
    ['Wedding wrap-up', 'Album and prints', 'From Nii Photography', 400, 400, 0, 'In contract'],
    ['Wedding wrap-up', 'Suit and dress returns', 'Kingsway hire · late fees risk', 0, 540, 200, 'Unowned'],
    ['Living', 'Homecoming dinner', 'First meal as a household', 200, 200, 0, 'Planned'],
    ['Setting up the home', 'First month rent', 'Due day 1 of the month', 600, 600, 0, 'Committed'],
    ['Setting up the home', 'Utilities connection', '', 120, 120, 0, 'Committed'],
    ['Living', 'Groceries above the usual', 'Hosting in the first month', 340, 340, 0, 'Underway']
  ];
  const BUDGET_STATUSES = ['Committed', 'Underway', 'Quote needed', 'In contract', 'Unowned', 'Planned', 'Contingent', 'Not started'];
  const NAME_LIST_TITLES = {
    'registrar, accra': 'Collect certified copies · 3',
    'ghana card update': 'Ghana Card update',
    'passport reissue': 'Passport reissue',
    "driver's licence": "Driver's licence",
    'voter register': 'Voter register',
    'bank · primary current account': 'Bank · primary current account',
    'mobile money account': 'Mobile money account',
    'pension and ssnit': 'Pension and SSNIT',
    'employer hr record': 'Employer HR record',
    'insurance policies · 3': 'Insurance policies · 3',
    'utilities and landlord': 'Utilities and landlord',
    'email, subscriptions, loyalty': 'Email, subscriptions, loyalty'
  };
  const BUDGET_CATS = ['Setting up the home', 'Admin', 'Living'];
  const NOTICED_PROMPTS = [
    { id: 'surprised', n: '01', q: 'What surprised us about living together', hint: 'Left blank until the first month ends' },
    { id: 'rhythm', n: '02', q: 'Which rhythm we actually kept, and which we did not', hint: 'The Rhythms page has the counts; this is the honest version' },
    { id: 'advise', n: '03', q: 'One thing we would tell a couple a month behind us', hint: 'Not written yet' }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical global */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function ensureData() {
    const d = store();
    ensureMasterHomecoming();
    if (!Array.isArray(d.homecoming)) d.homecoming = [];
    if (!Array.isArray(d.nameChange)) d.nameChange = [];
    if (!Array.isArray(d.firstMonthBudget)) d.firstMonthBudget = [];
    if (!Array.isArray(d.gifts)) d.gifts = [];
    if (!Array.isArray(d.guests)) d.guests = [];
    if (!d.homecomingReflection || typeof d.homecomingReflection !== 'object') {
      d.homecomingReflection = { surprised: '', rhythm: '', advise: '' };
    }
    if (!d.setup || typeof d.setup !== 'object') d.setup = {};
    /* Normalize legacy settling rows toward 18a fields. */
    d.homecoming.forEach(r => {
      if (r.item != null && r.task == null) r.task = r.item;
      if (r.cat != null && r.area == null) r.area = mapLegacyArea(r.cat);
      if (!r.owner) r.owner = 'Both';
      if (!r.status) r.status = r.done ? 'Complete' : 'Not Started';
      if (r.due == null) r.due = '';
      if (r.dependsOn == null) r.dependsOn = '';
    });
    d.nameChange.forEach(r => {
      if (r.task != null && r.institution == null) r.institution = r.task;
      if (r.category != null && r.band == null) r.band = mapNameBand(r.category, r.status);
      if (r.document == null) r.document = r.notes || '';
      if (r.submitted == null) r.submitted = '';
      if (r.confirmed == null) r.confirmed = '';
      if (r.blocks == null) r.blocks = '';
      if (!r.status) r.status = r.done ? 'Complete' : 'Not Started';
    });
    d.firstMonthBudget.forEach(r => {
      if (r.spent == null && r.paid != null) r.spent = r.paid;
      if (r.committed == null) r.committed = r.budgeted != null ? r.budgeted : 0;
      if (!r.status) {
        if (/contingent/i.test(String(r.note || ''))) r.status = 'Contingent';
        else if ((parseFloat(r.spent) || 0) > 0) r.status = 'Underway';
        else r.status = 'Committed';
      }
    });
    return d;
  }
  function budgetRow(category, line, note, budgeted, committed, spent, status) {
    return {
      category: category, line: line, item: line, note: note || '',
      budgeted: budgeted, committed: committed, spent: spent, paid: spent, status: status || 'Committed'
    };
  }
  function ensureMasterHomecoming() {
    const d = store();
    const legacyNames = Array.isArray(d.nameChange) && d.nameChange.length > 0 &&
      !d.nameChange.some(r => /registrar|ghana card|ssnit|dvla/i.test(String(r.institution || r.task || '')));
    if (!Array.isArray(d.homecoming)) d.homecoming = [];
    if (!Array.isArray(d.nameChange)) d.nameChange = [];
    if (!Array.isArray(d.firstMonthBudget)) d.firstMonthBudget = [];
    const legacyBudget = d.firstMonthBudget.length > 0 &&
      !d.firstMonthBudget.some(r => /thank-you|dress preservation|homecoming dinner|name change fees/i.test(String(r.line || r.item || '')));
    const emptyAll = !d.homecoming.length && !d.nameChange.length && !d.firstMonthBudget.length;
    if (d._hcMasterS33 && !legacyNames && !legacyBudget && !emptyAll) return;
    if (emptyAll || legacyNames || legacyBudget || !d._hcMasterS33) {
      d.homecoming = MASTER_SETTLING.map(([task, area, owner, due, dependsOn, status]) => {
        const row = { task: task, item: task, area: area, cat: area, owner: owner, due: due, dependsOn: dependsOn, status: status, notes: '' };
        if (typeof nextRecordId === 'function') row._id = nextRecordId('homecoming');
        return row;
      });
      d.nameChange = MASTER_NAMECHANGE.map(([band, institution, office, document, blocks, cost, status]) => {
        const row = { band: band, institution: institution, task: institution, office: office, document: document, blocks: blocks, cost: cost, submitted: '', confirmed: '', status: status, done: false, notes: '' };
        if (typeof nextRecordId === 'function') row._id = nextRecordId('nameChange');
        return row;
      });
      d.firstMonthBudget = MASTER_BUDGET_CARDS.map(([category, line, note, budgeted, committed, spent, status]) =>
        budgetRow(category, line, note, budgeted, committed, spent, status));
    }
    d._hcMasterS33 = true;
    if (typeof save === 'function') save();
  }
  function mapLegacyArea(cat) {
    const c = String(cat || '');
    if (/home|address|setup/i.test(c)) return 'The home';
    if (/thank|gift|photo|wrap/i.test(c)) return 'Wedding wrap-up';
    if (/bank|money|insur/i.test(c)) return 'Money';
    if (/church|document|name|legal/i.test(c)) return 'Documents';
    return AREAS.includes(c) ? c : (c || 'Other');
  }
  function mapNameBand(category, status) {
    const c = String(category || '') + ' ' + String(status || '');
    if (/legal|registry|birth|death|certificate/i.test(c)) return 'first';
    if (/passport|bank|licence|license|nhis|driver/i.test(c)) return 'then';
    return 'any';
  }
  function completeStatus(v) { return /complete|done|sent|confirmed/i.test(String(v || '')); }
  function saveNow() { if (typeof save === 'function') save(); }
  function money0(n) {
    const v = Math.round(parseFloat(n) || 0);
    if (typeof fmt === 'function') { try { return fmt(v); } catch (e) { /* fall */ } }
    return '$' + v.toLocaleString();
  }
  function selectHtml(list, val) {
    return list.map(x => `<option value="${esc(x)}"${String(x) === String(val || '') ? ' selected' : ''}>${esc(x)}</option>`).join('');
  }
  function weddingDate() {
    const d = ensureData();
    const raw = String((d.setup && d.setup.date) || '').trim();
    if (!raw) return null;
    const dt = new Date(raw.split('T')[0] + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  function beginsDate() {
    const wed = weddingDate();
    if (!wed) return null;
    const next = new Date(wed.getTime());
    next.setDate(next.getDate() + 1);
    return next;
  }
  function fmtShort(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function fmtLong(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function thankYouDue() {
    const d = ensureData();
    if (d.gifts.length) return d.gifts.filter(g => !g.thankyou).length;
    if (d.guests.length) return d.guests.filter(g => !g.thankyou).length;
    return 0;
  }
  function syncThankYouRow() {
    const d = ensureData();
    const due = thankYouDue();
    let row = d.homecoming.find(r => /thank-?you notes/i.test(String(r.task || r.item || '')));
    const nextStatus = due ? (due + ' outstanding') : 'Complete';
    if (!row && due > 0) {
      d.homecoming.push({
        task: 'Write the last thank-you notes',
        item: 'Write the last thank-you notes',
        area: 'Wedding wrap-up', cat: 'Thank-You Notes',
        owner: 'Both', due: '', dependsOn: 'Counted from Gifts',
        status: nextStatus, notes: ''
      });
      return;
    }
    if (!row) return;
    if (row.dependsOn !== 'Counted from Gifts') row.dependsOn = 'Counted from Gifts';
    if (!completeStatus(row.status) || due === 0) {
      if (String(row.status) !== nextStatus) row.status = nextStatus;
    }
  }

  function hcFigures() {
    const d = ensureData();
    syncThankYouRow();
    const home = d.homecoming;
    const names = d.nameChange;
    const budget = d.firstMonthBudget;
    const homeDone = home.filter(r => completeStatus(r.status) || r.done).length;
    const nameDone = names.filter(r => r.done || completeStatus(r.status) || /confirmed/i.test(String(r.confirmed || ''))).length;
    const nameReady = names.filter(r => /ready/i.test(String(r.status || ''))).length;
    const nameBlocked = names.filter(r => /blocked/i.test(String(r.status || ''))).length;
    const nameFees = names.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
    const budgeted = budget.reduce((s, r) => s + (parseFloat(r.budgeted) || 0), 0);
    const committed = budget.reduce((s, r) => s + (parseFloat(r.committed != null ? r.committed : r.budgeted) || 0), 0);
    const spent = budget.reduce((s, r) => s + (parseFloat(r.spent != null ? r.spent : r.paid) || 0), 0);
    const noQuote = budget.filter(r => /quote needed/i.test(String(r.status || ''))).length;
    const contingentTotal = budget.filter(r => /contingent|late fee|returns/i.test(String(r.line || '') + String(r.note || '')))
      .reduce((s, r) => s + Math.max(parseFloat(r.committed) || 0, parseFloat(r.budgeted) || 0, 120), 0);
    const begins = beginsDate();
    const totalTasks = home.length + names.length + budget.length;
    const totalDone = homeDone + nameDone + budget.filter(r => (parseFloat(r.spent) || 0) > 0).length;
    return {
      homecoming: home.length,
      homeDone,
      nameChange: names.length,
      nameDone,
      nameReady,
      nameBlocked,
      nameFees,
      budgetRows: budget.length,
      budgeted,
      committed,
      spent,
      noQuote,
      contingentTotal,
      tasksTotal: totalTasks,
      tasksDone: totalDone,
      beginsShort: fmtShort(begins),
      beginsLong: fmtLong(begins),
      thankYouDue: thankYouDue(),
      firstMonthStatus: budget.length ? (spent > 0 ? 'In progress' : 'Not started') : 'Not started'
    };
  }
  function hcRailCounts() {
    const f = hcFigures();
    return {
      settling: f.homecoming,
      namechange: f.nameChange,
      budget: f.budgetRows,
      noticed: ''
    };
  }

  function pageheadActionsHtml() {
    const view = window._hcPageView || 'tasksView';
    if (view === 'namechangeView') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdHcPrintNamePack()">Print checklist</button>'
        + '<button type="button" class="rd-btn" onclick="rdHcFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcMarkStepDone()">Mark step done</button>';
    }
    if (view === 'budgetView') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdHcPrint()">Print summary</button>'
        + '<button type="button" class="rd-btn" onclick="rdHcFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcAddBudget()">Add a line</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHcLoadPreset()">Load a starter list</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcAddTask()">Add task</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-homecoming');
    if (!panel) return;
    panel.classList.add('ued-scope', 'homecoming-mockup');
    if (panel.dataset.uedShell === 'homecoming-rd-s33v2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'homecoming-rd-s33v2';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Newlywed Homecoming</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="homecoming-stats" aria-label="Homecoming summary"></div>
      <div class="rd-toolbar" id="homecoming-toolbar"></div>
      <div class="rd-bulkbar" id="homecoming-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="homecoming-surface-row">
          <div class="rd-surface__main" id="homecoming-view-host">
            <div class="rd-view" id="hc-view-tasksView">
              <section class="rd-hc-block" id="hc-sec-settling" data-hc-sec="settling"></section>
              <section class="rd-hc-block" id="hc-sec-namechange" data-hc-sec="namechange"></section>
              <section class="rd-hc-block" id="hc-sec-budget" data-hc-sec="budget"></section>
              <section class="rd-hc-block" id="hc-sec-noticed" data-hc-sec="noticed"></section>
            </div>
            <div class="rd-view" id="hc-view-namechangeView" hidden></div>
            <div class="rd-view" id="hc-view-budgetView" hidden></div>
          </div>
          <div id="homecoming-drawer-slot"></div>
        </div>
      </div>
    </div>`;
  }

  function applyPageViewMode() {
    const mode = window._hcPageView || 'tasksView';
    PAGE_VIEWS.forEach(([id]) => {
      const el = document.getElementById('hc-view-' + id);
      if (el) el.hidden = id !== mode;
    });
  }

  function renderStats() {
    const host = document.getElementById('homecoming-stats');
    if (!host) return;
    const f = hcFigures();
    const view = window._hcPageView || 'tasksView';
    let stats = [];
    if (view === 'namechangeView') {
      stats = [
        { label: 'Steps', value: String(f.nameChange) },
        { label: 'Ready now', value: String(f.nameReady) },
        { label: 'Blocked', value: String(f.nameBlocked), sub: 'all on the certificate chain' },
        { label: 'Longest lead', value: '8 weeks', sub: 'passport reissue' },
        { label: 'Fees', value: money0(f.nameFees), sub: 'after-the-day budget' }
      ];
    } else if (view === 'budgetView') {
      stats = [
        { label: 'Budgeted', value: money0(f.budgeted) },
        { label: 'Committed', value: money0(f.committed), bar: f.budgeted ? Math.round((f.committed / f.budgeted) * 100) : 0 },
        { label: 'Paid', value: money0(f.spent) },
        { label: 'No quote yet', value: String(f.noQuote), sub: f.noQuote === 1 ? 'dress preservation' : '', tone: 'warn' },
        { label: 'Contingent', value: money0(f.contingentTotal || 120), sub: 'suit return, 10 Nov', tone: 'risk' }
      ];
    } else {
      const spend = money0(f.spent) + ' of ' + money0(f.budgeted || 1730);
      stats = [
        { label: 'Tasks', value: String(f.tasksTotal) },
        { label: 'Done', value: String(f.tasksDone) },
        { label: 'Name change', value: f.nameDone + ' of ' + f.nameChange },
        { label: 'First month spend', value: spend },
        { label: 'Begins', value: f.beginsShort }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats.map(s => ({ label: s.label, value: s.value })));
      return;
    }
    host.innerHTML = stats.map(s => {
      let html = `<div class="m-stat${s.tone === 'warn' ? ' m-stat--warn' : ''}${s.tone === 'risk' ? ' m-stat--risk' : ''}">` +
        `<div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div>`;
      if (s.sub) html += `<div class="m-stat-sub">${esc(s.sub)}</div>`;
      if (s.bar != null) html += `<div class="rd-track m-stat-bar"><div class="rd-fill" style="width:${s.bar}%"></div></div>`;
      html += `</div>`;
      return html;
    }).join('');
  }

  function filterChip(label, field) {
    const ui = window._hcUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all' && !(field === 'owner' && cur === 'both') && !(field === 'person' && cur === 'both');
    const display = (field === 'owner' || field === 'person') && (!cur || cur === 'all') ? 'both' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHcCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHcClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderToolbar() {
    const host = document.getElementById('homecoming-toolbar');
    if (!host) return;
    const view = window._hcPageView || 'tasksView';
    let left = '';
    if (view === 'namechangeView') {
      left = filterChip('Person', 'person') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip${window._hcShowDeps ? ' is-active' : ''}" onclick="rdHcToggleDeps()">Show dependencies${window._hcShowDeps ? '<span class="rd-chip__clear" onclick="event.stopPropagation();rdHcToggleDeps()">&#10005;</span>' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdHcSortDeps()">Sort by dependency order</button>`;
    } else if (view === 'budgetView') {
      left = filterChip('Category', 'category') + filterChip('Status', 'status') +
        `<span class="rd-ess-toolbar-note">Separate from the wedding budget</span>`;
    } else {
      left = filterChip('Area', 'area') + filterChip('Owner', 'owner') + filterChip('Status', 'status') +
        (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml('Sort by due date', "rdHcSortDue()")
          : '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdHcSortDue()">Sort by due date</button>');
    }
    const pv = view || 'tasksView';
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      (view === 'tasksView' && typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('homecoming') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="Homecoming view">` +
      PAGE_VIEWS.map(([id, label]) =>
        `<button type="button" class="rd-viewswitch__item${pv === id ? ' is-active' : ''}" onclick="rdSetHomecomingView('${id}')">${esc(label)}</button>`
      ).join('') +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('homecoming-bulk-bar');
    if (!host) return;
    const n = window._hcSel.size;
    if (!n) {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHcBulkOwner()">Assign owner</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHcBulkDue()">Set due date</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHcBulkDone()">Mark done</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHcPrint()">Print the list</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdHcBulkClear()">Clear selection</button>`;
  }

  function scrollToSection(id) {
    const el = document.getElementById('hc-sec-' + id);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function rdSetHomecomingView(mode) {
    if (mode === 'tasks' || mode === 'after' || mode === 'settling') mode = 'tasksView';
    if (mode === 'namechange' || mode === 'nameChange') mode = 'namechangeView';
    if (mode === 'budget') mode = 'budgetView';
    window._hcPageView = PAGE_VIEWS.some(([id]) => id === mode) ? mode : 'tasksView';
    window._hcMode = window._hcPageView === 'tasksView' ? 'tasks'
      : (window._hcPageView === 'namechangeView' ? 'namechange' : 'budget');
    if (window._hcPageView === 'tasksView') {
      /* keep rail section when returning to stacked view */
    } else if (window._hcPageView === 'namechangeView') {
      window._hcRailView = 'namechange';
    } else if (window._hcPageView === 'budgetView') {
      window._hcRailView = 'budget';
    }
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    window._hcDrawerId = null;
    renderHomecomingRd();
  }
  function applyHomecomingRailView(viewId) {
    window._hcRailView = ['settling', 'namechange', 'budget', 'noticed'].includes(viewId) ? viewId : 'settling';
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    if (viewId === 'namechange') {
      window._hcPageView = 'namechangeView';
      window._hcMode = 'namechange';
    } else if (viewId === 'budget') {
      window._hcPageView = 'budgetView';
      window._hcMode = 'budget';
    } else {
      window._hcPageView = 'tasksView';
      window._hcMode = 'tasks';
    }
    window._hcDrawerId = null;
    renderHomecomingRd();
    if (window._hcPageView === 'tasksView') scrollToSection(viewId);
  }
  function applyHomecomingGroupBy(id) {
    window._hcGroupBy = ['area', 'owner', 'due'].includes(id) ? id : 'area';
    renderSettling();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'homecoming') {
      renderContextSidebar('homecoming');
    }
  }

  function matchesSettlingFilters(r) {
    const ui = window._hcUiFilters || {};
    if (ui.area && ui.area !== 'all' && String(r.area || r.cat || '') !== ui.area) return false;
    if (ui.owner && ui.owner !== 'all' && ui.owner !== 'both' && String(r.owner || 'Both') !== ui.owner) return false;
    if (ui.status && ui.status !== 'all' && String(r.status || '') !== ui.status) return false;
    return true;
  }
  function settlingRows() {
    const d = ensureData();
    return d.homecoming.map((row, index) => ({ row, index })).filter(x => matchesSettlingFilters(x.row));
  }
  function groupSettling(rows) {
    const by = window._hcGroupBy || 'area';
    const map = {};
    rows.forEach(x => {
      let key = 'Other';
      if (by === 'owner') key = String(x.row.owner || 'Both');
      else if (by === 'due') key = String(x.row.due || 'No due date');
      else key = String(x.row.area || x.row.cat || 'Other');
      if (!map[key]) map[key] = [];
      map[key].push(x);
    });
    return Object.keys(map).sort().map(k => ({ key: k, rows: map[k] }));
  }

  function sectionHead(eyebrow, help, ctaLabel, ctaOnclick) {
    return `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">${esc(eyebrow)}</div>` +
      `<p class="rd-help">${esc(help)}</p></div>` +
      (ctaLabel ? `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="${ctaOnclick}">${esc(ctaLabel)}</button>` : '') +
      `</div>`;
  }

  function renderSettling() {
    const host = document.getElementById('hc-sec-settling');
    if (!host) return;
    const d = ensureData();
    syncThankYouRow();
    const rows = settlingRows();
    const begins = hcFigures().beginsLong;
    const groups = groupSettling(rows);
    let html = `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hc-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Task</th><th>Area</th><th>Owner</th><th>Due</th><th>Depends on</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    html += `<tr class="rd-group-row rd-hc-group"><td colspan="7">Settling in · ${d.homecoming.length} task${d.homecoming.length === 1 ? '' : 's'} · none can close before ${esc(begins === '—' ? 'the wedding day' : begins)}</td></tr>`;
    if (!rows.length) {
      html += `<tr><td colspan="7" class="rd-empty">No settling-in tasks match this view.</td></tr>`;
    } else {
      groups.forEach(g => {
        if ((window._hcGroupBy || 'area') !== 'area' || groups.length > 1) {
          /* When grouped by owner/due, show sub-bands; area already has the main band. */
          if ((window._hcGroupBy || 'area') !== 'area') {
            html += `<tr class="rd-group-row"><td colspan="7">${esc(g.key)} · ${g.rows.length}</td></tr>`;
          }
        }
        g.rows.forEach(x => {
          const r = x.row;
          const id = 'homecoming:' + x.index;
          const sel = window._hcSel.has(id);
          html += `<tr class="${sel ? 'is-selected' : ''}">` +
            `<td><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdHcToggleSel('${esc(id)}')"></td>` +
            `<td><input class="no-currency" data-currency="false" value="${esc(r.task || r.item || '')}" placeholder="Task" oninput="rdHcSaveTask(${x.index},'task',this.value)"></td>` +
            `<td><select onchange="rdHcSaveTask(${x.index},'area',this.value)">${selectHtml(AREAS, r.area || mapLegacyArea(r.cat))}</select></td>` +
            `<td><select onchange="rdHcSaveTask(${x.index},'owner',this.value)">${selectHtml(OWNERS, r.owner || 'Both')}</select></td>` +
            `<td><input type="date" value="${esc(r.due || '')}" onchange="rdHcSaveTask(${x.index},'due',this.value)"></td>` +
            `<td><input class="no-currency" data-currency="false" value="${esc(r.dependsOn || '')}" placeholder="—" oninput="rdHcSaveTask(${x.index},'dependsOn',this.value)"></td>` +
            `<td><select onchange="rdHcSaveTask(${x.index},'status',this.value)">${selectHtml(STATUSES.concat(r.status && !STATUSES.includes(r.status) ? [r.status] : []), r.status || 'Not Started')}</select></td>` +
            `</tr>`;
        });
      });
    }
    html += `</tbody></table></div>`;
    html += `<button type="button" class="rd-hc-addbtn" onclick="rdHcAddTask()"><span>+</span> Add a settling-in task</button>`;
    host.innerHTML = html;
  }

  function renderNameChange() {
    const host = document.getElementById('hc-sec-namechange');
    if (!host) return;
    const d = ensureData();
    const n = d.nameChange.length;
    let html = sectionHead(
      'Name change · ' + n + ' institution' + (n === 1 ? '' : 's'),
      'Nothing can start until the marriage certificate is in hand · order matters, three of these need the passport first',
      'Print the pack', 'rdHcPrintNamePack()'
    );
    /* De-dup band ids so the four steps render once each, in order. */
    const seenBands = {};
    const bandOrder = NAME_BANDS.filter(b => { if (seenBands[b.label]) return false; seenBands[b.label] = 1; return true; });
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hc-table rd-hc-nametable"><thead><tr>` +
      `<th style="width:34px"></th><th>Institution</th><th>Document needed</th><th>Submitted</th><th>Confirmed</th><th>Cost</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    bandOrder.forEach(band => {
      const labelSet = new Set(NAME_BANDS.filter(b => b.label === band.label).map(b => b.id));
      const rows = d.nameChange
        .map((row, index) => ({ row, index }))
        .filter(x => labelSet.has(x.row.band || mapNameBand(x.row.category, x.row.status)));
      if (!rows.length) return;
      html += `<tr class="rd-group-row rd-hc-group"><td colspan="7">${esc(band.label)} · ${rows.length}</td></tr>`;
      rows.forEach(x => {
        const r = x.row;
        const id = 'nameChange:' + x.index;
        const sel = window._hcSel.has(id);
        const blocked = /blocked/i.test(String(r.status || ''));
        /* Route by the stable row index — seed-time _ids are not unique. */
        html += `<tr class="rd-hc-namerow${sel ? ' is-selected' : ''}${blocked ? ' is-blocked' : ''}" onclick="rdHcOpenDrawer('${esc(id)}')">` +
          `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdHcToggleSel('${esc(id)}')"></td>` +
          `<td class="rd-hc-instcell"><input class="no-currency" data-currency="false" value="${esc(r.institution || r.task || '')}" placeholder="Institution" onclick="event.stopPropagation()" oninput="rdHcSaveName(${x.index},'institution',this.value)">` +
          (r.office ? `<span class="rd-hc-instcell__sub">${esc(r.office)}</span>` : '') + `</td>` +
          `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" value="${esc(r.document || '')}" placeholder="Document" oninput="rdHcSaveName(${x.index},'document',this.value)"></td>` +
          `<td onclick="event.stopPropagation()"><input type="date" value="${esc(r.submitted || '')}" onchange="rdHcSaveName(${x.index},'submitted',this.value)"></td>` +
          `<td onclick="event.stopPropagation()"><input type="date" value="${esc(r.confirmed || '')}" onchange="rdHcSaveName(${x.index},'confirmed',this.value)"></td>` +
          `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" inputmode="decimal" value="${esc(r.cost == null || r.cost === '' ? '' : r.cost)}" placeholder="$0" oninput="rdHcSaveName(${x.index},'cost',this.value)"></td>` +
          `<td onclick="event.stopPropagation()"><select onchange="rdHcSaveName(${x.index},'status',this.value)">${selectHtml(STATUSES, r.status || 'Not Started')}</select></td>` +
          `</tr>`;
      });
    });
    if (!n) html += `<tr><td colspan="7" class="rd-empty">No institutions yet. Add the registry first — everything else waits on the certificate.</td></tr>`;
    html += `</tbody></table></div>`;
    html += `<button type="button" class="rd-hc-addbtn" onclick="rdHcAddNameChange()"><span>+</span> Add an institution</button>`;
    host.innerHTML = html;
  }

  function renderBudget() {
    const host = document.getElementById('hc-sec-budget');
    if (!host) return;
    const d = ensureData();
    const rows = d.firstMonthBudget;
    const f = hcFigures();
    const begins = beginsDate();
    const end = begins ? new Date(begins.getTime()) : null;
    if (end) end.setMonth(end.getMonth() + 1);
    const range = begins && end
      ? (fmtLong(begins).replace(/,\s*\d{4}/, '') + ' to ' + fmtLong(end).replace(/,\s*\d{4}/, '') + ' · the first month with no wedding in it')
      : 'The first month with no wedding in it';
    let html = sectionHead(
      'First month budget · ' + rows.length + ' line' + (rows.length === 1 ? '' : 's'),
      range,
      'Open the Budget', "typeof showPanel==='function'&&showPanel('budget')"
    );
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hc-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Line</th><th>Category</th><th>Budgeted</th><th>Spent</th><th>Left</th><th>Note</th>` +
      `</tr></thead><tbody>`;
    BUDGET_CATS.forEach(cat => {
      const list = rows.map((row, index) => ({ row, index })).filter(x => String(x.row.category || '') === cat);
      if (!list.length) return;
      const sum = list.reduce((s, x) => s + (parseFloat(x.row.budgeted) || 0), 0);
      html += `<tr class="rd-group-row rd-hc-group"><td colspan="7">${esc(cat)} · ${money0(sum)} budgeted</td></tr>`;
      list.forEach(x => {
        const r = x.row;
        const budgeted = parseFloat(r.budgeted) || 0;
        const spent = parseFloat(r.spent) || 0;
        const left = budgeted - spent;
        const id = 'firstMonthBudget:' + x.index;
        const sel = window._hcSel.has(id);
        html += `<tr class="${sel ? 'is-selected' : ''}">` +
          `<td><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdHcToggleSel('${esc(id)}')"></td>` +
          `<td><input class="no-currency" data-currency="false" value="${esc(r.line || r.item || '')}" placeholder="Line" oninput="rdHcSaveBudget(${x.index},'line',this.value)"></td>` +
          `<td><select onchange="rdHcSaveBudget(${x.index},'category',this.value)">${selectHtml(BUDGET_CATS, r.category || 'Living')}</select></td>` +
          `<td><input class="no-currency" data-currency="false" inputmode="decimal" value="${esc(r.budgeted == null ? '' : r.budgeted)}" oninput="rdHcSaveBudget(${x.index},'budgeted',this.value)"></td>` +
          `<td><input class="no-currency" data-currency="false" inputmode="decimal" value="${esc(r.spent == null ? '' : r.spent)}" oninput="rdHcSaveBudget(${x.index},'spent',this.value)"></td>` +
          `<td>${esc(money0(left))}</td>` +
          `<td><input class="no-currency" data-currency="false" value="${esc(r.note || r.notes || '')}" placeholder="Note" oninput="rdHcSaveBudget(${x.index},'note',this.value)"></td>` +
          `</tr>`;
      });
    });
    const orphan = rows.map((row, index) => ({ row, index })).filter(x => !BUDGET_CATS.includes(String(x.row.category || '')));
    orphan.forEach(x => {
      const r = x.row;
      const budgeted = parseFloat(r.budgeted) || 0;
      const spent = parseFloat(r.spent) || 0;
      html += `<tr>` +
        `<td></td>` +
        `<td><input class="no-currency" data-currency="false" value="${esc(r.line || '')}" oninput="rdHcSaveBudget(${x.index},'line',this.value)"></td>` +
        `<td><select onchange="rdHcSaveBudget(${x.index},'category',this.value)">${selectHtml(BUDGET_CATS, r.category || 'Living')}</select></td>` +
        `<td><input class="no-currency" data-currency="false" value="${esc(r.budgeted == null ? '' : r.budgeted)}" oninput="rdHcSaveBudget(${x.index},'budgeted',this.value)"></td>` +
        `<td><input class="no-currency" data-currency="false" value="${esc(r.spent == null ? '' : r.spent)}" oninput="rdHcSaveBudget(${x.index},'spent',this.value)"></td>` +
        `<td>${esc(money0(budgeted - spent))}</td>` +
        `<td><input class="no-currency" data-currency="false" value="${esc(r.note || '')}" oninput="rdHcSaveBudget(${x.index},'note',this.value)"></td>` +
        `</tr>`;
    });
    if (!rows.length) {
      html += `<tr><td colspan="7" class="rd-empty">No first-month budget lines yet. Add rent, admin, and living — this total never appears on the wedding Budget page.</td></tr>`;
    } else {
      html += `<tr class="rd-hc-total"><td colspan="3">Total</td><td>${esc(money0(f.budgeted))}</td><td>${esc(money0(f.spent))}</td><td>${esc(money0(f.budgeted - f.spent))}</td><td>Separate from the wedding budget</td></tr>`;
    }
    html += `</tbody></table></div>`;
    html += `<button type="button" class="rd-hc-addbtn" onclick="rdHcAddBudget()"><span>+</span> Add a budget line</button>`;
    host.innerHTML = html;
  }

  function renderNoticed() {
    const host = document.getElementById('hc-sec-noticed');
    if (!host) return;
    const d = ensureData();
    const ref = d.homecomingReflection;
    let html = sectionHead(
      'What we noticed',
      'One page in the whole planner that asks a question instead of tracking an answer',
      'Write an entry', "rdHcFocusNoticed()"
    );
    html += `<div class="rd-keepsake rd-hc-keepsake" id="homecoming-reflection">` +
      `<p class="rd-hc-keepsake__lead">Three questions to answer together at the end of the first month, written down rather than remembered.</p>` +
      NOTICED_PROMPTS.map(p => {
        const val = String(ref[p.id] || '');
        return `<article class="rd-hc-keepsake__q" id="hc-noticed-${p.id}">` +
          `<div class="rd-hc-keepsake__n">${esc(p.n)}</div>` +
          `<div class="rd-hc-keepsake__body">` +
          `<h3>${esc(p.q)}</h3>` +
          `<textarea rows="3" placeholder="${esc(p.hint)}" oninput="rdHcSaveNoticed('${p.id}',this.value)">${esc(val)}</textarea>` +
          `</div></article>`;
      }).join('') +
      `</div>`;
    host.innerHTML = html;
  }

  function nameListTitle(row) {
    const key = String(row.institution || row.task || '').trim().toLowerCase();
    if (NAME_LIST_TITLES[key]) return NAME_LIST_TITLES[key];
    if (/registrar/i.test(key)) return 'Collect certified copies · 3';
    return row.institution || row.task || '';
  }
  function nameDepNote(row) {
    const doc = String(row.document || '').trim();
    if (doc && !/^needs/i.test(doc)) return doc;
    return row.blocks || row.document || '—';
  }
  function statusPill(status) {
    const s = String(status || 'Not Started');
    let scheme = 'muted';
    if (/complete|confirmed|ready|committed|underway|planned|in contract/i.test(s)) scheme = /ready|underway|planned|in contract/i.test(s) ? 'green' : 'green';
    else if (/blocked|quote needed|unowned|waiting|not started/i.test(s)) scheme = /blocked|quote needed|unowned/i.test(s) ? 'gold' : 'muted';
    else if (/contingent|risk|late/i.test(s)) scheme = 'red';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(s)}</span>`;
  }
  function bandHint(bandId) {
    if (bandId === 'step1') return 'marriage certificate · blocks 11 downstream steps';
    if (bandId === 'step2') return 'passport before bank, bank before everything else';
    if (bandId === 'step3') return 'each needs the passport, not the certificate';
    if (bandId === 'step4') return 'no dependency, do in any order';
    return '';
  }

  function renderNamechangeViewPage() {
    const host = document.getElementById('hc-view-namechangeView');
    if (!host) return;
    const d = ensureData();
    const ui = window._hcUiFilters || {};
    const seenBands = {};
    const bandOrder = NAME_BANDS.filter(b => { if (seenBands[b.label]) return false; seenBands[b.label] = 1; return true; });
    let html = '<div class="rd-hc-nameview">';
    bandOrder.forEach(band => {
      const labelSet = new Set(NAME_BANDS.filter(b => b.label === band.label).map(b => b.id));
      const rows = d.nameChange
        .map((row, index) => ({ row, index }))
        .filter(x => labelSet.has(x.row.band || mapNameBand(x.row.category, x.row.status)))
        .filter(x => {
          if (ui.status && ui.status !== 'all' && String(x.row.status || '') !== ui.status) return false;
          return true;
        });
      if (!rows.length) return;
      html += `<div class="rd-hc-nameview__band"><div class="rd-hc-nameview__bandhead">` +
        `<span class="rd-hc-nameview__bandtitle">${esc(band.label)}</span>` +
        `<span class="rd-hc-nameview__bandhint">${esc(bandHint(band.id))}</span></div>`;
      rows.forEach(x => {
        const r = x.row;
        const blocked = /blocked/i.test(String(r.status || ''));
        const id = 'nameChange:' + x.index;
        html += `<button type="button" class="rd-hc-nameview__row${blocked ? ' is-blocked' : ''}" onclick="rdHcOpenDrawer('${esc(id)}')">` +
          `<div class="rd-hc-nameview__main"><div class="rd-hc-nameview__title">${esc(nameListTitle(r))}</div>` +
          (r.office ? `<div class="rd-hc-nameview__sub">${esc(r.office)}</div>` : '') + `</div>` +
          (window._hcShowDeps ? `<div class="rd-hc-nameview__dep">${esc(nameDepNote(r))}</div>` : '') +
          `<div class="rd-hc-nameview__cost">${esc(Number(r.cost) > 0 ? money0(r.cost) : '—')}</div>` +
          `<div class="rd-hc-nameview__pill">${statusPill(r.status)}</div>` +
          `</button>`;
      });
      html += `</div>`;
    });
    if (!d.nameChange.length) {
      html += `<div class="rd-empty">No institutions yet. Add the registry first — everything else waits on the certificate.</div>`;
    }
    html += `<button type="button" class="rd-hc-addbtn" onclick="rdHcAddNameChange()"><span>+</span> Add an institution</button></div>`;
    host.innerHTML = html;
  }

  function renderBudgetViewPage() {
    const host = document.getElementById('hc-view-budgetView');
    if (!host) return;
    const d = ensureData();
    const ui = window._hcUiFilters || {};
    const rows = d.firstMonthBudget.map((row, index) => ({ row, index })).filter(x => {
      if (ui.category && ui.category !== 'all' && String(x.row.category || '') !== ui.category) return false;
      if (ui.status && ui.status !== 'all' && String(x.row.status || '') !== ui.status) return false;
      return true;
    });
    let html = `<div class="rd-hc-budgetview"><div class="rd-hc-budgetview__grid">`;
    if (!rows.length) {
      html += `<div class="rd-empty">No after-the-day budget lines yet. Add rent, admin, and living — this total never appears on the wedding Budget page.</div>`;
    }
    rows.forEach(x => {
      const r = x.row;
      const budgeted = parseFloat(r.budgeted) || 0;
      const committed = parseFloat(r.committed != null ? r.committed : r.budgeted) || 0;
      const paid = parseFloat(r.spent != null ? r.spent : r.paid) || 0;
      const pct = budgeted > 0 ? Math.round((committed / budgeted) * 100) : (committed > 0 ? 100 : 0);
      html += `<article class="rd-hc-budgetcard">` +
        `<div class="rd-hc-budgetcard__head"><div><div class="rd-hc-budgetcard__title">${esc(r.line || r.item || '')}</div>` +
        (r.note ? `<div class="rd-hc-budgetcard__sub">${esc(r.note)}</div>` : '') + `</div></div>` +
        `<div class="rd-hc-budgetcard__pills">${statusPill(r.status || 'Committed')}</div>` +
        `<div class="rd-hc-budgetcard__lines">` +
        `<div><span>Budgeted</span><strong>${esc(money0(budgeted))}</strong></div>` +
        `<div><span>Committed</span><strong>${esc(money0(committed))}</strong></div>` +
        `<div><span>Paid</span><strong>${esc(money0(paid))}</strong></div>` +
        `</div><div class="rd-track rd-hc-budgetcard__bar"><div class="rd-fill" style="width:${Math.min(pct, 100)}%"></div></div>` +
        `</article>`;
    });
    html += `</div><button type="button" class="rd-hc-addbtn" onclick="rdHcAddBudget()"><span>+</span> Add a budget line</button></div>`;
    host.innerHTML = html;
  }

  /* ── Name-change step drawer (Institution · Documents · Dates · History) ── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function findName(id) {
    const d = ensureData();
    const key = String(id || '').replace(/^nameChange:/, '');
    let index = d.nameChange.findIndex(r => String(r._id) === key);
    if (index < 0 && /^\d+$/.test(key)) index = parseInt(key, 10);
    const row = d.nameChange[index];
    return row ? { row, index } : null;
  }
  function drawerField(label, value, onclick) {
    const empty = value == null || value === '' || value === '—';
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : (empty ? ' class="rd-drawer__add"' : '');
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(empty ? 'Add…' : value)}</strong></div>`;
  }
  function bandLabelFor(bandId) {
    const b = NAME_BANDS.find(x => x.id === bandId);
    return b ? b.label.replace(/ · .*/, '') : 'Step';
  }

  function renderNameDrawer() {
    const slot = document.getElementById('homecoming-drawer-slot');
    if (!slot) return;
    const found = findName(window._hcDrawerId);
    if (!found) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    parkSharedDrawerAway(slot);
    const r = found.row;
    const idx = found.index;
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._hcDrawerTab, 10) || 0));
    const blocked = /blocked/i.test(String(r.status || ''));
    const jid = 'nameChange:' + idx;
    const costLabel = (r.cost == null || r.cost === '' || Number(r.cost) === 0) ? 'No fee' : money0(r.cost);
    let body = '';
    if (tab === 0) {
      body =
        drawerField('Institution', r.institution || r.task) +
        drawerField('Office', r.office) +
        drawerField('Fee', costLabel) +
        drawerField('Step', bandLabelFor(r.band || mapNameBand(r.category, r.status))) +
        (r.blocks ? drawerField('Blocks', r.blocks) : '') +
        `<p class="rd-drawer__note">${r.band === 'step1'
          ? 'First in the order, because every other institution waits on the certificate this step produces.'
          : 'One of the institutions that changes the name. Its place in the order is set by what it needs first.'}</p>`;
    } else if (tab === 1) {
      body =
        drawerField('Document needed', r.document) +
        `<p class="rd-drawer__note">The registry needs the document it makes — the marriage certificate the ceremony produces. Nothing downstream can be attempted before the certificate is in hand.</p>`;
    } else if (tab === 2) {
      body =
        drawerField('Submitted', r.submitted ? fmtLong(new Date(r.submitted + 'T00:00:00')) : '') +
        drawerField('Confirmed', r.confirmed ? fmtLong(new Date(r.confirmed + 'T00:00:00')) : '') +
        `<p class="rd-drawer__note">Nothing can be filled before 9 November. Submitted-but-not-confirmed is the state to chase.${blocked ? ' This step is blocked — a prerequisite is still outstanding, so it is amber, not late.' : ''}</p>`;
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added to the name-change plan · ${esc(r.institution || r.task || '')}</div></div>` +
        `<p class="rd-drawer__note">One entry. A short history here means the plan has not started, not that nothing was logged.</p>`;
    }
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hc-drawer" aria-label="Name-change step">` +
      `<div class="rd-drawer__head">` +
      `<button type="button" class="rd-drawer__close" onclick="rdHcCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__eyebrow">Name-change step</div>` +
      `<h2 class="rd-drawer__title">${esc(r.institution || r.task || 'Institution')}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${blocked ? 'gold' : (/ready/i.test(String(r.status || '')) ? 'green' : (/complete/i.test(String(r.status || '')) ? 'green' : 'muted'))}">${esc(r.status || 'Not Started')}</span>` +
      (Number(r.cost) > 0 ? `<span class="status-pill" data-pillscheme="muted">${esc(money0(r.cost))}</span>` : '') +
      `</div>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdHcSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdHcNameFullEditor('${esc(jid)}')">Full editor</button>` +
      `</div></aside>`;
  }

  function rdHcOpenDrawer(id) {
    window._hcDrawerId = id;
    window._hcDrawerTab = 0;
    renderNameDrawer();
  }
  function rdHcCloseDrawer() {
    window._hcDrawerId = null;
    const slot = document.getElementById('homecoming-drawer-slot');
    if (slot) { parkSharedDrawerAway(slot); slot.innerHTML = ''; slot.classList.remove('is-open'); }
  }
  function rdHcSetDrawerTab(i) { window._hcDrawerTab = i; renderNameDrawer(); }
  function rdHcNameFullEditor(id) {
    const found = findName(id);
    rdHcCloseDrawer();
    if (typeof openRecordEditor === 'function') {
      if (found) openRecordEditor('nameChange', found.index);
      else openRecordEditor('nameChange');
    }
  }

  /* ── mutations ───────────────────────────────────────────────────────── */

  function rdHcSaveTask(index, key, val) {
    const d = ensureData();
    if (!d.homecoming[index]) return;
    d.homecoming[index][key] = val;
    if (key === 'task') d.homecoming[index].item = val;
    if (key === 'area') d.homecoming[index].cat = val;
    saveNow();
    renderStats();
  }
  function rdHcSaveName(index, key, val) {
    const d = ensureData();
    if (!d.nameChange[index]) return;
    d.nameChange[index][key] = val;
    if (key === 'institution') d.nameChange[index].task = val;
    if (key === 'status') d.nameChange[index].done = completeStatus(val);
    if (key === 'confirmed' && val) d.nameChange[index].status = 'Complete';
    saveNow();
    renderStats();
  }
  function rdHcSaveBudget(index, key, val) {
    const d = ensureData();
    if (!d.firstMonthBudget[index]) return;
    d.firstMonthBudget[index][key] = val;
    saveNow();
    renderStats();
    if (key === 'budgeted' || key === 'spent' || key === 'category') renderBudget();
  }
  function rdHcSaveNoticed(id, val) {
    const d = ensureData();
    d.homecomingReflection[id] = val;
    saveNow();
  }
  function rdHcAddTask() {
    const d = ensureData();
    d.homecoming.push({
      task: '', item: '', area: 'The home', cat: 'Home Setup',
      owner: 'Both', due: '', dependsOn: '', status: 'Not Started', notes: ''
    });
    saveNow();
    renderHomecomingRd();
    scrollToSection('settling');
  }
  function rdHcAddNameChange() {
    const d = ensureData();
    d.nameChange.push({
      institution: '', task: '', document: '', submitted: '', confirmed: '',
      blocks: '', status: 'Not Started', band: 'any', category: 'Other', done: false, notes: ''
    });
    saveNow();
    renderHomecomingRd();
    scrollToSection('namechange');
  }
  function rdHcAddBudget() {
    const d = ensureData();
    d.firstMonthBudget.push({ line: '', category: 'Living', budgeted: '', committed: '', spent: '', paid: '', note: '', status: 'Planned' });
    saveNow();
    window._hcPageView = 'budgetView';
    window._hcRailView = 'budget';
    renderHomecomingRd();
  }
  async function rdHcLoadPreset() {
    if (typeof loadHCPreset === 'function') {
      const out = loadHCPreset();
      if (out && typeof out.then === 'function') await out;
    } else {
      const d = ensureData();
      [
        ['The home', 'Move things into the new home', 'Both'],
        ['The home', 'Sign the tenancy · both names', 'Both'],
        ['Wedding wrap-up', 'Return hired attire', 'Both'],
        ['Wedding wrap-up', 'Write the last thank-you notes', 'Both'],
        ['Documents', 'Collect the marriage certificate', 'Both'],
        ['Church', 'Thank the officiant in person', 'Both']
      ].forEach(([area, task, owner]) => d.homecoming.push({
        task, item: task, area, cat: area, owner, due: '', dependsOn: '', status: 'Not Started', notes: ''
      }));
    }
    const d = ensureData();
    if (!d.nameChange.length) {
      [
        ['first', 'Births & Deaths Registry', 'Marriage certificate', 'All ten below'],
        ['first', 'Passport office', 'Certificate + old passport', 'Bank, licence, NHIS'],
        ['then', 'Bank', 'New passport + Ghana Card', 'Joint account'],
        ['then', 'Driver’s licence', 'New passport', ''],
        ['any', 'Employer · payroll and HR', 'Certificate', 'Pension, tax']
      ].forEach(([band, institution, document, blocks]) => d.nameChange.push({
        band, institution, task: institution, document, blocks,
        submitted: '', confirmed: '', status: 'Not Started', done: false, notes: ''
      }));
    }
    if (!d.firstMonthBudget.length) {
      MASTER_BUDGET_CARDS.forEach(([category, line, note, budgeted, committed, spent, status]) =>
        d.firstMonthBudget.push(budgetRow(category, line, note, budgeted, committed, spent, status)));
    }
    saveNow();
    renderHomecomingRd();
  }
  function rdHcPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildHomecomingPrintSheets === 'function') {
      openCovenantPrintTemplate(buildHomecomingPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdHcPrintNamePack() { rdHcPrint(); }
  function rdHcFullEditor() {
    if (typeof openRecordEditor !== 'function') return;
    const mode = window._hcMode || 'tasks';
    if (mode === 'namechange') openRecordEditor('nameChange');
    else if (mode === 'budget') openRecordEditor('homecoming');
    else openRecordEditor('homecoming');
  }
  function rdHcExport() {
    const d = ensureData();
    const payload = {
      homecoming: d.homecoming,
      nameChange: d.nameChange,
      firstMonthBudget: d.firstMonthBudget,
      homecomingReflection: d.homecomingReflection
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'newlywed-homecoming.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Homecoming exported.');
  }
  function rdHcFocusNoticed() {
    applyHomecomingRailView('noticed');
    const ta = document.querySelector('#hc-sec-noticed textarea');
    if (ta) ta.focus();
  }
  function rdHcCycleFilter(field) {
    const opts = { all: true };
    const d = ensureData();
    if (field === 'area') d.homecoming.forEach(r => { opts[r.area || mapLegacyArea(r.cat) || 'Other'] = true; });
    if (field === 'owner') { opts.both = true; d.homecoming.forEach(r => { opts[r.owner || 'Both'] = true; }); }
    if (field === 'person') { opts.both = true; opts.bride = true; opts.groom = true; }
    if (field === 'category') d.firstMonthBudget.forEach(r => { opts[r.category || 'Other'] = true; });
    if (field === 'status') {
      if ((window._hcPageView || 'tasksView') === 'namechangeView') d.nameChange.forEach(r => { opts[r.status || 'Not Started'] = true; });
      else if ((window._hcPageView || 'tasksView') === 'budgetView') BUDGET_STATUSES.forEach(s => { opts[s] = true; });
      else d.homecoming.forEach(r => { opts[r.status || 'Not Started'] = true; });
    }
    const list = Object.keys(opts);
    const cur = (window._hcUiFilters || {})[field] || (field === 'owner' || field === 'person' ? 'both' : 'all');
    const i = Math.max(0, list.indexOf(cur));
    window._hcUiFilters[field] = list[(i + 1) % list.length];
    renderToolbar();
    if ((window._hcPageView || 'tasksView') === 'namechangeView') renderNamechangeViewPage();
    else if ((window._hcPageView || 'tasksView') === 'budgetView') renderBudgetViewPage();
    else renderSettling();
  }
  function rdHcClearFilter(field) {
    window._hcUiFilters[field] = (field === 'owner' || field === 'person') ? 'both' : 'all';
    renderToolbar();
    if ((window._hcPageView || 'tasksView') === 'namechangeView') renderNamechangeViewPage();
    else if ((window._hcPageView || 'tasksView') === 'budgetView') renderBudgetViewPage();
    else renderSettling();
  }
  function rdHcToggleDeps() {
    window._hcShowDeps = !window._hcShowDeps;
    renderToolbar();
    renderNamechangeViewPage();
  }
  function rdHcSortDeps() { /* order is fixed by dependency bands in Master 31g */ renderNamechangeViewPage(); }
  function rdHcMarkStepDone() {
    const d = ensureData();
    const next = d.nameChange.find(r => !completeStatus(r.status) && !/blocked/i.test(String(r.status || '')));
    if (next) { next.status = 'Complete'; next.done = true; saveNow(); renderHomecomingRd(); }
    else if (typeof showToast === 'function') showToast('Every step that can move is already done.');
  }
  function rdHcSortDue() {
    const d = ensureData();
    d.homecoming.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
    saveNow();
    renderSettling();
  }
  function rdHcToggleSel(id) {
    if (window._hcSel.has(id)) window._hcSel.delete(id);
    else window._hcSel.add(id);
    renderBulkBar();
    renderSettling();
    renderNameChange();
    renderBudget();
  }
  function rdHcBulkClear() {
    window._hcSel.clear();
    renderBulkBar();
    renderHomecomingRd();
  }
  function rdHcBulkDone() {
    const d = ensureData();
    window._hcSel.forEach(id => {
      const [src, idx] = id.split(':');
      const i = parseInt(idx, 10);
      if (src === 'homecoming' && d.homecoming[i]) d.homecoming[i].status = 'Complete';
      if (src === 'nameChange' && d.nameChange[i]) { d.nameChange[i].status = 'Complete'; d.nameChange[i].done = true; }
    });
    saveNow();
    rdHcBulkClear();
  }
  function rdHcBulkOwner() {
    const owner = window.prompt('Assign owner', 'Both');
    if (!owner) return;
    const d = ensureData();
    window._hcSel.forEach(id => {
      const [src, idx] = id.split(':');
      const i = parseInt(idx, 10);
      if (src === 'homecoming' && d.homecoming[i]) d.homecoming[i].owner = owner;
    });
    saveNow();
    rdHcBulkClear();
  }
  function rdHcBulkDue() {
    const due = window.prompt('Due date (YYYY-MM-DD)', '');
    if (!due) return;
    const d = ensureData();
    window._hcSel.forEach(id => {
      const [src, idx] = id.split(':');
      const i = parseInt(idx, 10);
      if (src === 'homecoming' && d.homecoming[i]) d.homecoming[i].due = due;
    });
    saveNow();
    rdHcBulkClear();
  }

  function renderHomecomingRd() {
    ensureData();
    if (typeof getSavedView === 'function') {
      let saved = getSavedView('homecoming', window._hcRailView || 'settling');
      if (saved === 'after') saved = 'settling';
      window._hcRailView = ['settling', 'namechange', 'budget', 'noticed'].includes(saved) ? saved : 'settling';
    }
    if (window._hcRailView === 'namechange' && !window._hcPageView) window._hcPageView = 'namechangeView';
    if (window._hcRailView === 'budget' && !window._hcPageView) window._hcPageView = 'budgetView';
    if (!window._hcPageView) window._hcPageView = 'tasksView';
    if (window._hcPageView === 'tasksView') {
      window._hcMode = 'tasks';
    } else if (window._hcPageView === 'namechangeView') {
      window._hcMode = 'namechange';
      window._hcRailView = 'namechange';
    } else if (window._hcPageView === 'budgetView') {
      window._hcMode = 'budget';
      window._hcRailView = 'budget';
    }
    ensureShell();
    applyPageViewMode();
    const actions = document.querySelector('#panel-homecoming .rd-pagehead__actions');
    if (actions) actions.innerHTML = pageheadActionsHtml();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('homecoming');
    renderStats();
    renderToolbar();
    renderBulkBar();
    renderSettling();
    renderNameChange();
    renderBudget();
    renderNoticed();
    renderNamechangeViewPage();
    renderBudgetViewPage();
    renderNameDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'homecoming'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('homecoming');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('homecoming');
  }

  window.uedHomecomingShell = ensureShell;
  window.renderHomecomingPage = renderHomecomingRd;
  window.renderHomecomingRd = renderHomecomingRd;
  window.rdSetHomecomingView = rdSetHomecomingView;
  window.applyHomecomingRailView = applyHomecomingRailView;
  window.applyHomecomingGroupBy = applyHomecomingGroupBy;
  window.hcRailCounts = hcRailCounts;
  window.hcFigures = hcFigures;
  window.hcThankYouDue = thankYouDue;
  window.rdHcSaveTask = rdHcSaveTask;
  window.rdHcSaveName = rdHcSaveName;
  window.rdHcSaveBudget = rdHcSaveBudget;
  window.rdHcSaveNoticed = rdHcSaveNoticed;
  window.rdHcAddTask = rdHcAddTask;
  window.rdHcAddNameChange = rdHcAddNameChange;
  window.rdHcAddBudget = rdHcAddBudget;
  window.rdHcLoadPreset = rdHcLoadPreset;
  window.rdHcPrint = rdHcPrint;
  window.rdHcPrintNamePack = rdHcPrintNamePack;
  window.rdHcFullEditor = rdHcFullEditor;
  window.rdHcExport = rdHcExport;
  window.rdHcFocusNoticed = rdHcFocusNoticed;
  window.rdHcCycleFilter = rdHcCycleFilter;
  window.rdHcClearFilter = rdHcClearFilter;
  window.rdHcSortDue = rdHcSortDue;
  window.rdHcToggleSel = rdHcToggleSel;
  window.rdHcBulkClear = rdHcBulkClear;
  window.rdHcBulkDone = rdHcBulkDone;
  window.rdHcBulkOwner = rdHcBulkOwner;
  window.rdHcBulkDue = rdHcBulkDue;
  window.rdHcOpenDrawer = rdHcOpenDrawer;
  window.rdHcCloseDrawer = rdHcCloseDrawer;
  window.rdHcSetDrawerTab = rdHcSetDrawerTab;
  window.rdHcMarkStepDone = rdHcMarkStepDone;
  window.rdHcToggleDeps = rdHcToggleDeps;
  window.rdHcSortDeps = rdHcSortDeps;

  function hookHomecomingPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.homecoming = function () { renderHomecomingRd(); };
  }
  hookHomecomingPanelRenderer();
  var _showPanelHc = window.showPanel;
  if (typeof _showPanelHc === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelHc.call(window, id, forceOpen);
      hookHomecomingPanelRenderer();
      return out;
    };
  }
  var _loadHCPreset = window.loadHCPreset;
  if (typeof _loadHCPreset === 'function' && !_loadHCPreset.__rdHomecomingWrapped) {
    var wrapped = async function () {
      var out = _loadHCPreset.apply(this, arguments);
      if (out && typeof out.then === 'function') out = await out;
      if (typeof renderHomecomingRd === 'function') renderHomecomingRd();
      return out;
    };
    wrapped.__rdHomecomingWrapped = true;
    window.loadHCPreset = wrapped;
  }
})();
