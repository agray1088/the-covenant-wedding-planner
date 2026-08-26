/* Newlywed Homecoming — All.dc #18a
   Stacked: Settling in · Name change · First month budget · What we noticed.
   Viewswitch: Tasks | Name change | Budget (scrolls to section).
   Rail: Sections · Progress (+ bars) · Group by · note.
   Thank-you / post-wedding counts fold into Settling rows (Gifts-derived), not a separate tab. */
(function () {
  'use strict';

  window._hcMode = window._hcMode || 'tasks';
  window._hcRailView = window._hcRailView || 'settling';
  window._hcGroupBy = window._hcGroupBy || 'area';
  window._hcUiFilters = window._hcUiFilters || { area: 'all', owner: 'both', status: 'all' };
  window._hcSel = window._hcSel instanceof Set ? window._hcSel : new Set();
  window._hcDrawerId = window._hcDrawerId || null;
  window._hcDrawerTab = window._hcDrawerTab || 0;

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
    ['Setting up the home', 'First month rent', 600, 0, 'Due day 1 of the month'],
    ['Setting up the home', 'Utilities connection', 120, 0, ''],
    ['Admin', 'Passport reissue', 110, 0, 'Government fee · after-the-day budget'],
    ['Admin', 'Ghana Card + licence + certificate copies', 100, 0, 'Name-change government fees'],
    ["Living", 'Groceries above the usual', 340, 0, 'Hosting in the first month'],
    ['Living', 'Suit-return late fee', 0, 0, 'Contingent · $40 only if returned after 12 Nov, not a budget line']
  ];
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
    return d;
  }
  function ensureMasterHomecoming() {
    const d = store();
    if (d._hcMasterS33) return;
    const legacyNames = Array.isArray(d.nameChange) && d.nameChange.length > 0 &&
      !d.nameChange.some(r => /registrar|ghana card|ssnit|dvla/i.test(String(r.institution || r.task || '')));
    if (!Array.isArray(d.homecoming)) d.homecoming = [];
    if (!Array.isArray(d.nameChange)) d.nameChange = [];
    if (!Array.isArray(d.firstMonthBudget)) d.firstMonthBudget = [];
    const emptyAll = !d.homecoming.length && !d.nameChange.length && !d.firstMonthBudget.length;
    if (emptyAll || legacyNames) {
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
      d.firstMonthBudget = MASTER_BUDGET.map(([category, line, budgeted, spent, note]) => ({ category: category, line: line, item: line, budgeted: budgeted, spent: spent, note: note }));
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
    const budgeted = budget.reduce((s, r) => s + (parseFloat(r.budgeted) || 0), 0);
    const spent = budget.reduce((s, r) => s + (parseFloat(r.spent) || 0), 0);
    const begins = beginsDate();
    const totalTasks = home.length + names.length + budget.length;
    const totalDone = homeDone + nameDone + budget.filter(r => (parseFloat(r.spent) || 0) > 0).length;
    return {
      homecoming: home.length,
      homeDone,
      nameChange: names.length,
      nameDone,
      budgetRows: budget.length,
      budgeted,
      spent,
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
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHcLoadPreset()">Load a starter list</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcAddTask()">+ Add task</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-homecoming');
    if (!panel) return;
    panel.classList.add('ued-scope', 'homecoming-mockup');
    if (panel.dataset.uedShell === 'homecoming-rd-s33') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'homecoming-rd-s33';
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
            <section class="rd-hc-block" id="hc-sec-settling" data-hc-sec="settling"></section>
            <section class="rd-hc-block" id="hc-sec-namechange" data-hc-sec="namechange"></section>
            <section class="rd-hc-block" id="hc-sec-budget" data-hc-sec="budget"></section>
            <section class="rd-hc-block" id="hc-sec-noticed" data-hc-sec="noticed"></section>
          </div>
          <div id="homecoming-drawer-slot"></div>
        </div>
      </div>
    </div>`;
  }

  function renderStats() {
    const host = document.getElementById('homecoming-stats');
    if (!host) return;
    const f = hcFigures();
    const spend = money0(f.spent) + ' of ' + money0(f.budgeted || 2400);
    const stats = [
      { label: 'Tasks', value: String(f.tasksTotal) },
      { label: 'Done', value: String(f.tasksDone) },
      { label: 'Name change', value: f.nameDone + ' of ' + f.nameChange },
      { label: 'First month spend', value: spend },
      { label: 'Begins', value: f.beginsShort }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._hcUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all' && !(field === 'owner' && cur === 'both');
    const display = field === 'owner' && (!cur || cur === 'all') ? 'both' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHcCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHcClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderToolbar() {
    const host = document.getElementById('homecoming-toolbar');
    if (!host) return;
    const mode = window._hcMode || 'tasks';
    host.innerHTML =
      filterChip('Area', 'area') +
      filterChip('Owner', 'owner') +
      filterChip('Status', 'status') +
      (typeof rdSortChipHtml === 'function'
        ? rdSortChipHtml('Sort by due date', "rdHcSortDue()")
        : '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdHcSortDue()">Sort by due date</button>') +
      `<div class="rd-toolbar__right">` +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('homecoming') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="Homecoming view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'tasks' ? ' is-active' : ''}" onclick="rdSetHomecomingView('tasks')">Tasks</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'namechange' ? ' is-active' : ''}" onclick="rdSetHomecomingView('namechange')">Name change</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'budget' ? ' is-active' : ''}" onclick="rdSetHomecomingView('budget')">Budget</button>` +
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
    if (mode === 'nameChange') mode = 'namechange';
    if (mode === 'after' || mode === 'settling') mode = 'tasks';
    window._hcMode = (mode === 'namechange' || mode === 'budget') ? mode : 'tasks';
    window._hcRailView = window._hcMode === 'tasks' ? 'settling' : window._hcMode;
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    renderToolbar();
    scrollToSection(window._hcMode === 'tasks' ? 'settling' : window._hcMode);
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'homecoming') {
      renderContextSidebar('homecoming');
    }
  }
  function applyHomecomingRailView(viewId) {
    window._hcRailView = ['settling', 'namechange', 'budget', 'noticed'].includes(viewId) ? viewId : 'settling';
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    window._hcMode = window._hcRailView === 'settling' || window._hcRailView === 'noticed'
      ? 'tasks'
      : window._hcRailView;
    renderToolbar();
    scrollToSection(window._hcRailView);
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'homecoming') {
      renderContextSidebar('homecoming');
    }
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
    d.firstMonthBudget.push({ line: '', category: 'Living', budgeted: '', spent: '', note: '' });
    saveNow();
    renderHomecomingRd();
    scrollToSection('budget');
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
      [
        ['Setting up the home', 'First month rent', 600, 'Due day 1 of the month'],
        ['Setting up the home', 'Utilities connection', 120, ''],
        ['Admin', 'Passport renewal', 180, ''],
        ['Admin', 'Marriage certificate copies', 40, 'Institutions keep the original'],
        ['Living', 'Groceries above the usual', 340, 'Hosting in the first month']
      ].forEach(([category, line, budgeted, note]) => d.firstMonthBudget.push({
        category, line, budgeted, spent: 0, note
      }));
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
    if (field === 'status') d.homecoming.forEach(r => { opts[r.status || 'Not Started'] = true; });
    const list = Object.keys(opts);
    const cur = (window._hcUiFilters || {})[field] || (field === 'owner' ? 'both' : 'all');
    const i = Math.max(0, list.indexOf(cur));
    window._hcUiFilters[field] = list[(i + 1) % list.length];
    renderToolbar();
    renderSettling();
  }
  function rdHcClearFilter(field) {
    window._hcUiFilters[field] = field === 'owner' ? 'both' : 'all';
    renderToolbar();
    renderSettling();
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
    if (window._hcMode === 'after') window._hcMode = 'tasks';
    if (window._hcRailView === 'namechange') window._hcMode = 'namechange';
    else if (window._hcRailView === 'budget') window._hcMode = 'budget';
    else window._hcMode = 'tasks';
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('homecoming');
    renderStats();
    renderToolbar();
    renderBulkBar();
    renderSettling();
    renderNameChange();
    renderBudget();
    renderNoticed();
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
  window.rdHcNameFullEditor = rdHcNameFullEditor;

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
