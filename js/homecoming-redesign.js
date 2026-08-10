/* Newlywed Homecoming — After the Day + Views #31
   Views: After the day | Settling | Name change | Budget.
   Rail: Settling in · Name change · First month budget · What we noticed · Progress.
   After the day merges Timeline & Tasks + homecoming + nameChange into one table,
   with thank-you notes due read from Gifts (moved here from Honeymoon). */
(function () {
  'use strict';

  window._hcMode = window._hcMode || 'after';
  window._hcRailView = window._hcRailView || 'settling';
  window._hcDrawerIndex = window._hcDrawerIndex == null ? null : window._hcDrawerIndex;
  window._hcDrawerTab = window._hcDrawerTab || 0;

  const DRAWER_TABS = ['Institution', 'Documents', 'Dates', 'History'];

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
    if (!Array.isArray(d.tasks)) d.tasks = [];
    if (!Array.isArray(d.gifts)) d.gifts = [];
    if (!Array.isArray(d.guests)) d.guests = [];
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
  function completeStatus(v) { return /complete|done|sent/i.test(String(v || '')); }
  function attentionRow(r) {
    return !completeStatus(r.status) || /note|notice|remember|follow/i.test(String(r.notes || ''));
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function thankYouDue() {
    const d = ensureData();
    if (d.gifts.length) return d.gifts.filter(g => !g.thankyou).length;
    if (d.guests.length) return d.guests.filter(g => !g.thankyou).length;
    return 0;
  }

  /* Unified After-the-day table: Timeline post-wedding tasks + homecoming + name change. */
  function afterTasks() {
    const d = ensureData();
    const out = [];
    d.tasks.forEach((t, i) => {
      const hay = [t.task, t.title, t.phase, t.category, t.notes, t.owner].join(' ').toLowerCase();
      if (/post[- ]?wedding|after the|thank[- ]?you|honeymoon return|newlywed|name change|homecoming/i.test(hay)
        || /after/i.test(String(t.phase || ''))) {
        out.push({
          id: 'tasks:' + (t._id || ('idx:' + i)),
          src: 'tasks', index: i, row: t,
          task: String(t.task || t.title || 'Task').trim(),
          owner: String(t.owner || t.who || '—').trim() || '—',
          due: String(t.due || t.date || '').trim() || '—',
          source: 'Timeline & Tasks',
          status: String(t.status || (t.done ? 'Complete' : 'Not started')).trim()
        });
      }
    });
    d.homecoming.forEach((r, i) => {
      out.push({
        id: 'homecoming:' + (r._id || ('idx:' + i)),
        src: 'homecoming', index: i, row: r,
        task: String(r.item || r.task || 'Homecoming item').trim(),
        owner: String(r.owner || '—').trim() || '—',
        due: String(r.due || '').trim() || '—',
        source: 'Settling in',
        status: String(r.status || (r.done ? 'Complete' : 'Not started')).trim()
      });
    });
    d.nameChange.forEach((r, i) => {
      out.push({
        id: 'nameChange:' + (r._id || ('idx:' + i)),
        src: 'nameChange', index: i, row: r,
        task: String(r.task || r.item || 'Name-change task').trim(),
        owner: String(r.owner || 'Both').trim() || 'Both',
        due: String(r.due || '').trim() || '—',
        source: 'Name change',
        status: String(r.status || (r.done ? 'Complete' : 'Not started')).trim()
      });
    });
    return out;
  }

  function hcFigures() {
    const d = ensureData();
    const home = d.homecoming;
    const names = d.nameChange;
    const homeDone = home.filter(r => completeStatus(r.status)).length;
    const nameDone = names.filter(r => r.done || completeStatus(r.status)).length;
    const attention = home.filter(attentionRow).length + names.filter(r => !r.done && !completeStatus(r.status)).length;
    const after = afterTasks();
    const afterDone = after.filter(t => completeStatus(t.status) || t.row.done).length;
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
      byCat: byCat,
      thankYouDue: thankYouDue(),
      afterTotal: after.length,
      afterDone: afterDone
    };
  }
  function hcRailCounts() {
    const f = hcFigures();
    return {
      settling: f.homecoming,
      namechange: f.nameChange,
      budget: f.budgetRows,
      noticed: f.noticed,
      after: f.afterTotal,
      thankYou: f.thankYouDue
    };
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHcLoadPreset()">Load starter list</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcPrint()">Print</button>'
      + '<button type="button" class="rd-btn" onclick="rdHcExport()">Export</button>'
      + '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'gifts\')">Open Gifts</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcAddTask()">+ Add task</button>';
  }
  function ensureShell() {
    const panel = document.getElementById('panel-homecoming');
    if (!panel) return;
    panel.classList.add('ued-scope', 'homecoming-mockup');
    if (panel.dataset.uedShell === 'homecoming-rd32') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'homecoming-rd32';
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
        <div class="rd-surface__row" id="homecoming-surface-row">
          <div class="rd-surface__main" id="homecoming-view-host">
            <div class="rd-view" id="hc-view-after"></div>
            <div class="rd-view" id="hc-view-tasks" hidden></div>
            <div class="rd-view" id="hc-view-namechange" hidden></div>
            <div class="rd-view" id="hc-view-budget" hidden></div>
          </div>
          <div id="homecoming-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }
  function renderStats() {
    const host = document.getElementById('homecoming-stats');
    if (!host) return;
    const f = hcFigures();
    const afterVal = f.afterDone + ' of ' + Math.max(f.afterTotal, f.afterDone || 0);
    const stats = [
      { label: 'Post-wedding tasks', value: afterVal },
      { label: 'Thank-you notes due', value: String(f.thankYouDue), attention: f.thankYouDue ? 'from Gifts' : undefined },
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
    const mode = window._hcMode || 'after';
    const counts = hcRailCounts();
    function chip(id, label, count) {
      const on = (window._hcRailView || 'settling') === id;
      const n = count == null ? counts[id] : count;
      return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="applyHomecomingRailView('${esc(id)}')">${esc(label)}${n === '' || n == null ? '' : ' <span>' + esc(n) + '</span>'}</button>`;
    }
    host.innerHTML = `<div class="rd-toolbar__left">
      ${chip('settling', 'Settling in')}
      ${chip('namechange', 'Name change')}
      ${chip('budget', 'First month budget')}
      ${chip('noticed', 'What we noticed', '')}
      ${typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by status', "rdStdOpenSort(this,'homecoming')") : ''}
      ${typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('homecoming') : ''}
    </div>
    <div class="rd-toolbar__right">
      <div class="rd-viewswitch" role="group" aria-label="Homecoming view">
        <button type="button" class="rd-viewswitch__item${mode === 'after' ? ' is-active' : ''}" onclick="rdSetHomecomingView('after')">After the day</button>
        <button type="button" class="rd-viewswitch__item${mode === 'tasks' ? ' is-active' : ''}" onclick="rdSetHomecomingView('tasks')">Settling</button>
        <button type="button" class="rd-viewswitch__item${mode === 'namechange' ? ' is-active' : ''}" onclick="rdSetHomecomingView('namechange')">Name change</button>
        <button type="button" class="rd-viewswitch__item${mode === 'budget' ? ' is-active' : ''}" onclick="rdSetHomecomingView('budget')">Budget</button>
      </div>
    </div>`;
  }
  function applyMode() {
    const mode = window._hcMode || 'after';
    ['after', 'tasks', 'namechange', 'budget'].forEach(name => {
      const el = document.getElementById('hc-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }
  function normalizeMode(mode) {
    if (mode === 'nameChange') return 'namechange';
    if (mode === 'tasks' || mode === 'settling') return 'tasks';
    if (mode === 'namechange' || mode === 'budget' || mode === 'after') return mode;
    return 'after';
  }
  function rdSetHomecomingView(mode) {
    window._hcMode = normalizeMode(mode);
    if (window._hcMode === 'namechange') window._hcRailView = 'namechange';
    else if (window._hcMode === 'budget') window._hcRailView = 'budget';
    else if (window._hcMode === 'tasks') {
      if (window._hcRailView !== 'noticed') window._hcRailView = 'settling';
    } else window._hcRailView = 'settling';
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

  function sectionHead(title, help, ctaLabel, ctaOnclick) {
    return `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">${esc(title)}</div>` +
      `<p class="rd-help">${esc(help)}</p></div>` +
      (ctaLabel ? `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="${ctaOnclick}">${esc(ctaLabel)}</button>` : '') +
      `</div>`;
  }

  function renderAfterView() {
    const host = document.getElementById('hc-view-after');
    if (!host) return;
    const rows = afterTasks();
    const f = hcFigures();
    let html = sectionHead(
      'After the wedding · ' + rows.length + ' task' + (rows.length === 1 ? '' : 's'),
      'None can close before the wedding day · two of these counts are read from elsewhere',
      'Open Gifts', "typeof showPanel==='function'&&showPanel('gifts')"
    );
    html += `<div class="rd-hm-callouts rd-hc-callouts">` +
      `<article class="rd-hm-callout"><strong>Two counts, not typed</strong><p>Thank-you notes due (${f.thankYouDue}) is read from Gifts. Post-wedding tasks (${f.afterDone} of ${f.afterTotal}) is read from Timeline &amp; Tasks and Newlywed Homecoming.</p></article>` +
      `<article class="rd-hm-callout"><strong>Where the lists live</strong><p>Settling in, Name change, and First-month budget stay on this page — use the view switcher or rail to edit them in place.</p></article>` +
      `</div>`;
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hc-table"><thead><tr>` +
      `<th>Task</th><th>Owner</th><th>Due</th><th>Source</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr><td colspan="5" class="rd-empty">No post-wedding tasks yet. Add one, or open Gifts and Settling — those counts feed this strip.</td></tr>`;
    } else {
      rows.forEach(t => {
        html += `<tr class="rd-hc-after-row" onclick="rdHcOpenAfter('${esc(t.id)}')">` +
          `<td class="rd-hc-name">${esc(t.task)}</td>` +
          `<td>${esc(t.owner)}</td><td>${esc(t.due)}</td><td>${esc(t.source)}</td><td>${esc(t.status)}</td>` +
          `</tr>`;
      });
    }
    html += `</tbody></table></div>`;
    html += `<button type="button" class="rd-hm-addbtn rd-hc-addbtn" onclick="rdHcAddAfter()"><span>+</span> Add a post-wedding task</button>`;
    host.innerHTML = html;
  }

  function renderTasksView() {
    const host = document.getElementById('hc-view-tasks');
    if (!host) return;
    const rows = visibleHomeRows();
    const noticed = window._hcRailView === 'noticed';
    let html = '<section class="ued-table-card"><div class="ued-table-head"><div><div class="ued-kicker">' +
      (noticed ? 'What we noticed' : 'Settling in') +
      '</div><div class="ued-table-title">' +
      (noticed ? 'Items that still need attention' : 'Homecoming checklist') +
      '</div></div><button type="button" class="rd-btn" onclick="rdHcAddTask()">+ Add task</button></div>';
    html += '<div class="ued-table-wrap"><table class="ued-table rd-table"><thead><tr><th>Item</th><th>Area</th><th>Owner</th><th>Status</th><th>Notes</th></tr></thead><tbody>';
    if (!rows.length) html += '<tr><td colspan="5" class="rd-empty">No homecoming tasks match this view.</td></tr>';
    rows.forEach(x => {
      const r = x.row;
      html += `<tr>
        <td><input class="no-currency" data-currency="false" value="${esc(r.item || '')}" placeholder="Task" oninput="rdHcSaveTask(${x.index},'item',this.value)"></td>
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
    html += '<div class="ued-table-wrap"><table class="ued-table rd-table"><thead><tr><th>Task</th><th>Category</th><th>Due</th><th>Status</th><th>Done</th><th>Notes</th><th></th></tr></thead><tbody>';
    if (!d.nameChange.length) html += '<tr><td colspan="7" class="rd-empty">No name-change tasks yet.</td></tr>';
    d.nameChange.forEach((r, i) => {
      const open = window._hcDrawerIndex === i;
      html += `<tr class="${open ? 'is-open' : ''}">
        <td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" value="${esc(r.task || '')}" placeholder="Task" oninput="rdHcSaveName(${i},'task',this.value)"></td>
        <td onclick="event.stopPropagation()"><select onchange="rdHcSaveName(${i},'category',this.value)">${selectHtml(nameCats(), r.category || 'Legal')}</select></td>
        <td onclick="event.stopPropagation()"><input type="date" value="${esc(r.due || '')}" onchange="rdHcSaveName(${i},'due',this.value)"></td>
        <td onclick="event.stopPropagation()"><select onchange="rdHcSaveName(${i},'status',this.value)">${selectHtml(nameStatuses(), r.status || 'Not Started')}</select></td>
        <td onclick="event.stopPropagation()"><input type="checkbox"${r.done || completeStatus(r.status) ? ' checked' : ''} onchange="rdHcSaveName(${i},'done',this.checked)"></td>
        <td onclick="event.stopPropagation()"><textarea rows="2" oninput="rdHcSaveName(${i},'notes',this.value)">${esc(r.notes || '')}</textarea></td>
        <td><button type="button" class="rd-btn rd-btn--quiet" onclick="rdHcOpenNameDrawer(${i})">Open</button></td>
      </tr>`;
    });
    html += '</tbody></table></div></section>';
    host.innerHTML = html;
  }

  /* ── Name-change drawer (Institution · Documents · Dates · History) ──── */

  function parkSharedHcDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function field(label, val, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(val)}</strong></div>`;
  }
  function fmtDrawerDate(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderHcNameDrawer() {
    const slot = document.getElementById('homecoming-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const d = ensureData();
    const i = window._hcDrawerIndex;
    const r = (i != null && d.nameChange[i]) ? d.nameChange[i] : null;
    if (!r || window._hcMode !== 'namechange') {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedHcDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedHcDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._hcDrawerTab, 10) || 0));
    const total = d.nameChange.length;
    const done = completeStatus(r.status) || r.done;
    const blocks = Math.max(0, total - i - 1);
    let body = '';
    if (tab === 0) {
      body =
        field('Institution', r.task || 'Untitled step') +
        field('Category', r.category || 'Legal') +
        field('Order', (i + 1) + ' of ' + total) +
        field('Owner', r.owner || 'Both') +
        field('Status', r.status || 'Not Started') +
        (i === 0 && blocks
          ? `<p class="rd-drawer__note">This one is first because every other institution can wait on it. ${blocks} of the ${total - 1} remaining steps assume it is done.</p>`
          : `<p class="rd-drawer__note">Order matters here — institutions later in the list often need what this one produces.</p>`);
    } else if (tab === 1) {
      const cat = String(r.category || '').toLowerCase();
      const needsCert = /legal|government|financial|household/.test(cat) || i === 0;
      body =
        `<div class="rd-drawer__section-title">Documents needed</div>` +
        field('Marriage certificate', needsCert ? (i === 0 ? 'Not yet issued' : (done ? 'Held' : 'Needed')) : 'Not required') +
        field('Notes on file', r.notes ? 'Yes' : 'None yet') +
        (r.notes ? `<p class="rd-drawer__note">${esc(r.notes)}</p>` : '') +
        `<p class="rd-drawer__note">${i === 0
          ? 'The certificate this step produces is the document every other institution on this list needs.'
          : 'This institution needs the marriage certificate the first step on the list produces.'}</p>`;
    } else if (tab === 2) {
      body =
        field('Due', r.due ? fmtDrawerDate(r.due) : '—') +
        field('Submitted', r.status === 'In Progress' || done ? fmtDrawerDate(r.due) : '—') +
        field('Confirmed', done ? fmtDrawerDate(r.due) : '—') +
        `<p class="rd-drawer__note">${done
          ? 'Confirmed and done.'
          : 'A step with a due date and no confirmed date is the one to chase.'}</p>`;
    } else {
      body =
        `<div class="rd-drawer__section-title">This institution</div>` +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added as step ${i + 1} of ${total}</div></div>` +
        (done
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Marked ${esc(r.status || 'Complete')}</div></div>`
          : '') +
        `<p class="rd-drawer__note">A short history here means the plan has not started, not that nothing was logged.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hc-drawer" aria-label="Name-change step">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Name change · step ${i + 1}</div>` +
      `<h2 class="rd-drawer__title">${esc(r.task || 'Untitled step')}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${done ? 'green' : 'gray'}">${esc(r.status || 'Not Started')}</span>` +
      `<span class="status-pill" data-pillscheme="gray">${esc(r.category || 'Legal')}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdHcCloseNameDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, idx) =>
        `<button type="button" class="rd-drawer__tab${idx === tab ? ' is-active' : ''}" onclick="rdHcSetNameDrawerTab(${idx})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHcCloseNameDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdHcAddNameChange()">Full editor</button>` +
      `</div></aside>`;
  }

  function rdHcOpenNameDrawer(index) {
    window._hcDrawerIndex = index;
    window._hcDrawerTab = 0;
    window._hcMode = 'namechange';
    window._hcRailView = 'namechange';
    renderHomecomingRd();
  }
  function rdHcCloseNameDrawer() {
    window._hcDrawerIndex = null;
    const slot = document.getElementById('homecoming-drawer-slot');
    if (slot) {
      parkSharedHcDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdHcSetNameDrawerTab(i) {
    window._hcDrawerTab = i;
    renderHcNameDrawer();
  }

  function renderBudgetView() {
    const host = document.getElementById('hc-view-budget');
    if (!host) return;
    const f = hcFigures();
    const note = f.firstMonthBudgetNote
      ? esc(f.firstMonthBudgetNote)
      : 'Add the first-month budget meeting in First-Month Rhythms, then open Budget for the numbers.';
    host.innerHTML = `<section class="ued-table-card rd-hc-budget">
      <div class="ued-table-head"><div><div class="ued-kicker">First month budget</div><div class="ued-table-title">First-month money handoff</div></div></div>
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
    if (window._hcDrawerIndex === index) renderHcNameDrawer();
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
  function rdHcAddAfter() {
    if (typeof openRecordEditor === 'function') openRecordEditor('tasks');
    else if (typeof addTaskRow === 'function') addTaskRow();
  }
  function rdHcOpenAfter(id) {
    const t = afterTasks().find(x => x.id === id);
    if (!t) return;
    if (t.src === 'homecoming') {
      window._hcMode = 'tasks';
      window._hcRailView = 'settling';
      renderHomecomingRd();
      return;
    }
    if (t.src === 'nameChange') {
      window._hcMode = 'namechange';
      window._hcRailView = 'namechange';
      renderHomecomingRd();
      return;
    }
    if (typeof openRecordEditor === 'function') openRecordEditor(t.src, t.index);
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
    const payload = { homecoming: d.homecoming, nameChange: d.nameChange, afterTasks: afterTasks() };
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
    else if (window._hcRailView === 'noticed') window._hcMode = 'tasks';
    else if (window._hcMode !== 'namechange' && window._hcMode !== 'budget' && window._hcMode !== 'tasks') {
      window._hcMode = 'after';
    }
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('homecoming');
    applyMode();
    renderStats();
    renderToolbar();
    renderAfterView();
    renderTasksView();
    renderNameChangeView();
    renderBudgetView();
    renderHcNameDrawer();
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
  window.hcAfterTasks = afterTasks;
  window.hcThankYouDue = thankYouDue;
  window.rdHcSaveTask = rdHcSaveTask;
  window.rdHcSaveName = rdHcSaveName;
  window.rdHcAddTask = rdHcAddTask;
  window.rdHcAddNameChange = rdHcAddNameChange;
  window.rdHcAddAfter = rdHcAddAfter;
  window.rdHcOpenAfter = rdHcOpenAfter;
  window.rdHcLoadPreset = rdHcLoadPreset;
  window.rdHcPrint = rdHcPrint;
  window.rdHcExport = rdHcExport;
  window.rdHcOpenBudget = rdHcOpenBudget;
  window.rdHcOpenNameDrawer = rdHcOpenNameDrawer;
  window.rdHcCloseNameDrawer = rdHcCloseNameDrawer;
  window.rdHcSetNameDrawerTab = rdHcSetNameDrawerTab;

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
