/* Newlywed Homecoming - Views #31
   Views: Tasks | Name change | Budget. Rail: settling | namechange | budget | noticed. */
(function () {
  'use strict';

  window._hcMode = window._hcMode || 'tasks';
  window._hcRailView = window._hcRailView || 'settling';

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
    if (!d.firstmonth || typeof d.firstmonth !== 'object' || Array.isArray(d.firstmonth)) d.firstmonth = {};
    return d;
  }
  function cats() {
    return (typeof HC_CATEGORIES !== 'undefined' && Array.isArray(HC_CATEGORIES))
      ? HC_CATEGORIES
      : ['Names', 'Banking', 'Insurance', 'Vehicles', 'Address', 'Documents', 'Home Setup', 'Thank-You Notes', 'Photos', 'Other'];
  }
  function statuses() {
    return (typeof HC_STATUSES !== 'undefined' && Array.isArray(HC_STATUSES))
      ? HC_STATUSES
      : ['Not Started', 'In Progress', 'Complete'];
  }
  function owners() {
    return (typeof HC_OWNERS !== 'undefined' && Array.isArray(HC_OWNERS))
      ? HC_OWNERS
      : ['Bride', 'Groom', 'Both'];
  }
  function nameCats() {
    return (typeof HM_NAME_CATS !== 'undefined' && Array.isArray(HM_NAME_CATS))
      ? HM_NAME_CATS
      : ['Legal', 'Government ID', 'Financial', 'Employment', 'Insurance', 'Household', 'Online Accounts', 'Other'];
  }
  function nameStatuses() {
    return (typeof HM_NAME_STATUS !== 'undefined' && Array.isArray(HM_NAME_STATUS))
      ? HM_NAME_STATUS
      : ['Not Started', 'In Progress', 'Complete'];
  }
  function selectHtml(list, val) {
    return list.map(x => `<option value="${esc(x)}"${String(x) === String(val || '') ? ' selected' : ''}>${esc(x)}</option>`).join('');
  }
  function completeStatus(v) { return /complete|done/i.test(String(v || '')); }
  function attentionRow(r) {
    return !completeStatus(r.status) || /note|notice|remember|follow/i.test(String(r.notes || ''));
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function hcFigures() {
    const d = ensureData();
    const home = d.homecoming;
    const names = d.nameChange;
    const homeDone = home.filter(r => completeStatus(r.status)).length;
    const nameDone = names.filter(r => r.done || completeStatus(r.status)).length;
    const attention = home.filter(attentionRow).length + names.filter(r => !r.done && !completeStatus(r.status)).length;
    const byCat = home.reduce((out, r) => {
      const k = String(r.cat || 'Other');
      out[k] = (out[k] || 0) + 1;
      return out;
    }, {});
    return {
      homecoming: home.length,
      homeDone: homeDone,
      nameChange: names.length,
      nameDone: nameDone,
      open: Math.max(0, home.length - homeDone),
      nameOpen: Math.max(0, names.length - nameDone),
      noticed: attention,
      budgetRows: Array.isArray(d.budget) ? d.budget.length : 0,
      firstMonthBudgetNote: String((d.firstmonth || {}).budgetMeeting || ''),
      byCat: byCat
    };
  }
  function hcRailCounts() {
    const f = hcFigures();
    return {
      settling: f.homecoming,
      namechange: f.nameChange,
      budget: f.budgetRows,
      noticed: f.noticed
    };
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHcLoadPreset()">Load starter list</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcPrint()">Print</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcAddTask()">+ Add task</button>';
  }
  function ensureShell() {
    const panel = document.getElementById('panel-homecoming');
    if (!panel) return;
    panel.classList.add('ued-scope', 'homecoming-mockup');
    if (panel.dataset.uedShell === 'homecoming-rd31') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'homecoming-rd31';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">The Day</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Newlywed Homecoming</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="homecoming-stats" aria-label="Homecoming summary"></div>
      <div class="rd-toolbar" id="homecoming-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="homecoming-view-host">
            <div class="rd-view" id="hc-view-tasks"></div>
            <div class="rd-view" id="hc-view-namechange" hidden></div>
            <div class="rd-view" id="hc-view-budget" hidden></div>
          </div>
        </div>
      </div>
    </div>`;
  }
  function renderStats() {
    const host = document.getElementById('homecoming-stats');
    if (!host) return;
    const f = hcFigures();
    const stats = [
      { label: 'Homecoming tasks', value: String(f.homecoming) },
      { label: 'Settled', value: f.homeDone + ' of ' + f.homecoming },
      { label: 'Name change', value: f.nameDone + ' of ' + f.nameChange },
      { label: 'Needs notice', value: String(f.noticed) }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s => `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`).join('');
  }
  function renderToolbar() {
    const host = document.getElementById('homecoming-toolbar');
    if (!host) return;
    const mode = window._hcMode || 'tasks';
    const counts = hcRailCounts();
    function chip(id, label) {
      const on = (window._hcRailView || 'settling') === id;
      return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="applyHomecomingRailView('${esc(id)}')">${esc(label)} <span>${esc(counts[id] || 0)}</span></button>`;
    }
    host.innerHTML = `<div class="rd-toolbar__left">
      ${chip('settling', 'Settling')}
      ${chip('namechange', 'Name change')}
      ${chip('budget', 'Budget')}
      ${chip('noticed', 'Noticed')}
      ${typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by status', "rdStdOpenSort(this,'homecoming')") : ''}
      ${typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('homecoming') : ''}
    </div>
    <div class="rd-toolbar__right">
      <div class="rd-viewswitch" role="group" aria-label="Homecoming view">
        <button type="button" class="rd-viewswitch__item${mode === 'tasks' ? ' is-active' : ''}" onclick="rdSetHomecomingView('tasks')">Tasks</button>
        <button type="button" class="rd-viewswitch__item${mode === 'namechange' ? ' is-active' : ''}" onclick="rdSetHomecomingView('namechange')">Name change</button>
        <button type="button" class="rd-viewswitch__item${mode === 'budget' ? ' is-active' : ''}" onclick="rdSetHomecomingView('budget')">Budget</button>
      </div>
    </div>`;
  }
  function applyMode() {
    const mode = window._hcMode || 'tasks';
    ['tasks', 'namechange', 'budget'].forEach(name => {
      const el = document.getElementById('hc-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }
  function rdSetHomecomingView(mode) {
    if (mode === 'nameChange') mode = 'namechange';
    window._hcMode = (mode === 'namechange' || mode === 'budget') ? mode : 'tasks';
    if (window._hcMode === 'namechange') window._hcRailView = 'namechange';
    else if (window._hcMode === 'budget') window._hcRailView = 'budget';
    else if (window._hcRailView === 'namechange' || window._hcRailView === 'budget') window._hcRailView = 'settling';
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    renderHomecomingRd();
  }
  function applyHomecomingRailView(viewId) {
    window._hcRailView = ['settling', 'namechange', 'budget', 'noticed'].includes(viewId) ? viewId : 'settling';
    if (typeof setSavedView === 'function') setSavedView('homecoming', window._hcRailView);
    if (window._hcRailView === 'namechange') window._hcMode = 'namechange';
    else if (window._hcRailView === 'budget') window._hcMode = 'budget';
    else window._hcMode = 'tasks';
    renderHomecomingRd();
  }
  function visibleHomeRows() {
    const d = ensureData();
    let rows = d.homecoming.map((row, index) => ({ row, index }));
    if (window._hcRailView === 'noticed') rows = rows.filter(x => attentionRow(x.row));
    return rows;
  }

  function renderTasksView() {
    const host = document.getElementById('hc-view-tasks');
    if (!host) return;
    const rows = visibleHomeRows();
    let html = '<section class="ued-table-card"><div class="ued-table-head"><div><div class="ued-kicker">Tasks</div><div class="ued-table-title">Homecoming checklist</div></div><button type="button" class="rd-btn" onclick="rdHcAddTask()">+ Add task</button></div>';
    html += '<div class="ued-table-wrap"><table class="ued-table rd-table"><thead><tr><th>Item</th><th>Area</th><th>Owner</th><th>Status</th><th>Notes</th></tr></thead><tbody>';
    if (!rows.length) html += '<tr><td colspan="5" class="rd-empty">No homecoming tasks match this view.</td></tr>';
    rows.forEach(x => {
      const r = x.row;
      html += `<tr>
        <td><input value="${esc(r.item || '')}" placeholder="Task" oninput="rdHcSaveTask(${x.index},'item',this.value)"></td>
        <td><select onchange="rdHcSaveTask(${x.index},'cat',this.value)">${selectHtml(cats(), r.cat || 'Other')}</select></td>
        <td><select onchange="rdHcSaveTask(${x.index},'owner',this.value)">${selectHtml(owners(), r.owner || 'Both')}</select></td>
        <td><select onchange="rdHcSaveTask(${x.index},'status',this.value)">${selectHtml(statuses(), r.status || 'Not Started')}</select></td>
        <td><textarea rows="2" oninput="rdHcSaveTask(${x.index},'notes',this.value)">${esc(r.notes || '')}</textarea></td>
      </tr>`;
    });
    html += '</tbody></table></div></section>';
    host.innerHTML = html;
  }

  function renderNameChangeView() {
    const host = document.getElementById('hc-view-namechange');
    if (!host) return;
    const d = ensureData();
    let html = '<section class="ued-table-card"><div class="ued-table-head"><div><div class="ued-kicker">Name change</div><div class="ued-table-title">Legal and account updates</div></div><button type="button" class="rd-btn" onclick="rdHcAddNameChange()">+ Add name-change task</button></div>';
    html += '<div class="ued-table-wrap"><table class="ued-table rd-table"><thead><tr><th>Task</th><th>Category</th><th>Due</th><th>Status</th><th>Done</th><th>Notes</th></tr></thead><tbody>';
    if (!d.nameChange.length) html += '<tr><td colspan="6" class="rd-empty">No name-change tasks yet.</td></tr>';
    d.nameChange.forEach((r, i) => {
      html += `<tr>
        <td><input value="${esc(r.task || '')}" placeholder="Task" oninput="rdHcSaveName(${i},'task',this.value)"></td>
        <td><select onchange="rdHcSaveName(${i},'category',this.value)">${selectHtml(nameCats(), r.category || 'Legal')}</select></td>
        <td><input type="date" value="${esc(r.due || '')}" onchange="rdHcSaveName(${i},'due',this.value)"></td>
        <td><select onchange="rdHcSaveName(${i},'status',this.value)">${selectHtml(nameStatuses(), r.status || 'Not Started')}</select></td>
        <td><input type="checkbox"${r.done || completeStatus(r.status) ? ' checked' : ''} onchange="rdHcSaveName(${i},'done',this.checked)"></td>
        <td><textarea rows="2" oninput="rdHcSaveName(${i},'notes',this.value)">${esc(r.notes || '')}</textarea></td>
      </tr>`;
    });
    html += '</tbody></table></div></section>';
    host.innerHTML = html;
  }

  function renderBudgetView() {
    const host = document.getElementById('hc-view-budget');
    if (!host) return;
    const f = hcFigures();
    const note = f.firstMonthBudgetNote
      ? esc(f.firstMonthBudgetNote)
      : 'Add the first-month budget meeting in First-Month Rhythms, then open Budget for the numbers.';
    host.innerHTML = `<section class="ued-table-card rd-hc-budget">
      <div class="ued-table-head"><div><div class="ued-kicker">Budget</div><div class="ued-table-title">First-month money handoff</div></div></div>
      <div class="rd-hc-budget__body">
        <p><strong>First-month note:</strong> ${note}</p>
        <p>Use this as a handoff: decide when you will sit down together, then open Budget to review wedding closeout, gift deposits, shared expenses, and first household categories.</p>
        <div class="rd-hc-budget__actions">
          <button type="button" class="rd-btn rd-btn--primary" onclick="rdHcOpenBudget()">Open Budget</button>
          <button type="button" class="rd-btn" onclick="typeof showPanel==='function'&&showPanel('firstmonth', true)">Open First-Month Rhythms</button>
        </div>
      </div>
    </section>`;
  }

  function rdHcSaveTask(index, key, val) {
    const d = ensureData();
    if (!d.homecoming[index]) return;
    d.homecoming[index][key] = val;
    saveNow();
    renderStats();
    if (key === 'status') renderToolbar();
  }
  function rdHcSaveName(index, key, val) {
    const d = ensureData();
    if (!d.nameChange[index]) return;
    d.nameChange[index][key] = val;
    if (key === 'status') d.nameChange[index].done = completeStatus(val);
    if (key === 'done') d.nameChange[index].status = val ? 'Complete' : (d.nameChange[index].status === 'Complete' ? 'In Progress' : d.nameChange[index].status || 'Not Started');
    saveNow();
    renderStats();
    renderToolbar();
  }
  function rdHcAddTask() {
    if (typeof addHCRow === 'function') {
      addHCRow();
      setTimeout(() => { if (typeof renderHomecomingRd === 'function') renderHomecomingRd(); }, 60);
      return;
    }
    const d = ensureData();
    d.homecoming.push({ cat: 'Home Setup', item: '', status: 'Not Started', owner: 'Both', notes: '' });
    saveNow();
    renderHomecomingRd();
  }
  function rdHcAddNameChange() {
    const d = ensureData();
    if (typeof openRecordEditor === 'function') {
      openRecordEditor('nameChange');
      return;
    }
    d.nameChange.push({ task: '', category: 'Legal', due: '', status: 'Not Started', done: false, notes: '' });
    saveNow();
    renderHomecomingRd();
  }
  async function rdHcLoadPreset() {
    if (typeof loadHCPreset === 'function') {
      const out = loadHCPreset();
      if (out && typeof out.then === 'function') await out;
      renderHomecomingRd();
      return;
    }
    const d = ensureData();
    [
      ['Documents', 'Place marriage certificate copies in a safe folder'],
      ['Thank-You Notes', 'Begin thank-you note batches'],
      ['Home Setup', 'Unpack wedding day and honeymoon bags'],
      ['Photos', 'Back up wedding photos and videos'],
      ['Banking', 'Deposit cash gifts and record totals']
    ].forEach(([cat, item]) => d.homecoming.push({ cat, item, status: 'Not Started', owner: 'Both', notes: '' }));
    saveNow();
    renderHomecomingRd();
  }
  function rdHcPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildHomecomingPrintSheets === 'function') {
      openCovenantPrintTemplate(buildHomecomingPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdHcExport() {
    const d = ensureData();
    const payload = { homecoming: d.homecoming, nameChange: d.nameChange };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'newlywed-homecoming.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Homecoming exported.');
  }
  function rdHcOpenBudget() {
    if (typeof showToast === 'function') showToast('Review wedding closeout and first household categories together.');
    if (typeof showPanel === 'function') showPanel('budget', true);
  }

  function renderHomecomingRd() {
    ensureData();
    if (typeof getSavedView === 'function') window._hcRailView = getSavedView('homecoming', window._hcRailView || 'settling');
    if (window._hcRailView === 'namechange') window._hcMode = 'namechange';
    else if (window._hcRailView === 'budget') window._hcMode = 'budget';
    else if (window._hcMode !== 'namechange' && window._hcMode !== 'budget') window._hcMode = 'tasks';
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('homecoming');
    applyMode();
    renderStats();
    renderToolbar();
    renderTasksView();
    renderNameChangeView();
    renderBudgetView();
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
  window.hcRailCounts = hcRailCounts;
  window.hcFigures = hcFigures;
  window.rdHcSaveTask = rdHcSaveTask;
  window.rdHcSaveName = rdHcSaveName;
  window.rdHcAddTask = rdHcAddTask;
  window.rdHcAddNameChange = rdHcAddNameChange;
  window.rdHcLoadPreset = rdHcLoadPreset;
  window.rdHcPrint = rdHcPrint;
  window.rdHcExport = rdHcExport;
  window.rdHcOpenBudget = rdHcOpenBudget;

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
