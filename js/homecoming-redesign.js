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

  const AREAS = ['The home', 'Wedding wrap-up', 'Money', 'Church', 'Documents', 'Home Setup', 'Thank-You Notes', 'Other'];
  const OWNERS = ['Both', 'Bride', 'Groom', 'Ama', 'Kwesi', 'Akosua', 'Michael'];
  const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Complete', 'Waiting'];
  const NAME_BANDS = [
    { id: 'first', label: 'First · everything else depends on these' },
    { id: 'then', label: 'Then · needs the new passport' },
    { id: 'any', label: 'Any time' }
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
    if (panel.dataset.uedShell === 'homecoming-rd18a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'homecoming-rd18a';
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
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="homecoming-view-host">
            <section class="rd-hc-block" id="hc-sec-settling" data-hc-sec="settling"></section>
            <section class="rd-hc-block" id="hc-sec-namechange" data-hc-sec="namechange"></section>
            <section class="rd-hc-block" id="hc-sec-budget" data-hc-sec="budget"></section>
            <section class="rd-hc-block" id="hc-sec-noticed" data-hc-sec="noticed"></section>
          </div>
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
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hc-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Institution</th><th>Document needed</th><th>Submitted</th><th>Confirmed</th><th>Blocks</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    NAME_BANDS.forEach(band => {
      const rows = d.nameChange
        .map((row, index) => ({ row, index }))
        .filter(x => (x.row.band || mapNameBand(x.row.category, x.row.status)) === band.id);
      if (!rows.length) return;
      html += `<tr class="rd-group-row rd-hc-group"><td colspan="7">${esc(band.label)} · ${rows.length}</td></tr>`;
      rows.forEach(x => {
        const r = x.row;
        const id = 'nameChange:' + x.index;
        const sel = window._hcSel.has(id);
        html += `<tr class="${sel ? 'is-selected' : ''}">` +
          `<td><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdHcToggleSel('${esc(id)}')"></td>` +
          `<td><input class="no-currency" data-currency="false" value="${esc(r.institution || r.task || '')}" placeholder="Institution" oninput="rdHcSaveName(${x.index},'institution',this.value)"></td>` +
          `<td><input class="no-currency" data-currency="false" value="${esc(r.document || '')}" placeholder="Document" oninput="rdHcSaveName(${x.index},'document',this.value)"></td>` +
          `<td><input type="date" value="${esc(r.submitted || '')}" onchange="rdHcSaveName(${x.index},'submitted',this.value)"></td>` +
          `<td><input type="date" value="${esc(r.confirmed || '')}" onchange="rdHcSaveName(${x.index},'confirmed',this.value)"></td>` +
          `<td><input class="no-currency" data-currency="false" value="${esc(r.blocks || '')}" placeholder="—" oninput="rdHcSaveName(${x.index},'blocks',this.value)"></td>` +
          `<td><select onchange="rdHcSaveName(${x.index},'status',this.value)">${selectHtml(STATUSES, r.status || 'Not Started')}</select></td>` +
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
