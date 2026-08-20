/* First-Month Rhythms - All.dc #13d
   Views: Table | Cards | Year. Rail: all | daily | weekly | monthly | yearly. */
(function () {
  'use strict';

  window._fmMode = window._fmMode || 'table';
  window._fmRailView = window._fmRailView || 'all';
  window._fmGroupBy = window._fmGroupBy || 'cadence';
  window._fmDrawerId = window._fmDrawerId || null;
  window._fmDrawerTab = window._fmDrawerTab || 0;

  const DRAWER_TABS = ['Rhythm', 'Cadence', 'Streak', 'History'];
  const CADENCE_FREQUENCY = { Daily: 'Every night', Weekly: 'Every week', Monthly: 'Every month', Yearly: 'Every year' };

  const BASE_ROWS = [
    { id: 'sabbath', key: 'sabbath', cadence: 'Weekly', title: 'Weekly Sabbath / Rest Day', area: 'Faith', owner: 'Both' },
    { id: 'date', key: 'date', cadence: 'Weekly', title: 'Weekly Date Night', area: 'Connection', owner: 'Both' },
    { id: 'devotion', key: 'devotion', cadence: 'Daily', title: 'Daily Devotion Time', area: 'Faith', owner: 'Both' },
    { id: 'budgetMeeting', key: 'budgetMeeting', cadence: 'Weekly', title: 'Weekly Budget Meeting', area: 'Money', owner: 'Both' },
    { id: 'checkin', key: 'checkin', cadence: 'Monthly', title: 'Monthly Check-In Day', area: 'Communication', owner: 'Both' },
    { id: 'church', key: 'church', cadence: 'Weekly', title: 'Local Church Plan', area: 'Faith', owner: 'Both' },
    { id: 'simple', key: 'simple', cadence: 'Monthly', title: 'Keep Simple This Month', area: 'Home', owner: 'Both' },
    { id: 'convos', key: 'convos', cadence: 'Monthly', title: 'Conversations To Have', area: 'Communication', owner: 'Both' }
  ];
  const CADENCES = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const AREAS = ['Faith', 'Connection', 'Money', 'Communication', 'Home', 'Family', 'Health', 'Other'];
  const OWNERS = ['Both', 'Bride', 'Groom'];

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
    if (!d.firstmonth || typeof d.firstmonth !== 'object' || Array.isArray(d.firstmonth)) d.firstmonth = {};
    if (d.rhythms && !Array.isArray(d.rhythms)) d.rhythms = [];
    return d;
  }
  function saveBase(key, val) {
    const d = ensureData();
    if (typeof rflSaveRhythm === 'function') rflSaveRhythm(key, val);
    else {
      d.firstmonth[key] = val;
      if (typeof save === 'function') save();
    }
  }
  function saveExtra(index, field, val) {
    const d = ensureData();
    if (!Array.isArray(d.rhythms)) d.rhythms = [];
    if (!d.rhythms[index]) return;
    d.rhythms[index][field] = val;
    if (field === 'status') d.rhythms[index].done = /kept|done|complete/i.test(String(val || ''));
    if (typeof save === 'function') save();
  }
  function normalizeCadence(c) {
    const raw = String(c || '').trim().toLowerCase();
    if (/day|daily/.test(raw)) return 'Daily';
    if (/month|monthly/.test(raw)) return 'Monthly';
    if (/year|annual/.test(raw)) return 'Yearly';
    return 'Weekly';
  }
  function allRows() {
    const d = ensureData();
    const fm = d.firstmonth || {};
    const base = BASE_ROWS.map((r, i) => ({
      id: 'base:' + r.id,
      source: 'base',
      index: i,
      key: r.key,
      title: r.title,
      cadence: r.cadence,
      area: r.area,
      owner: r.owner,
      value: String(fm[r.key] || ''),
      status: String(fm[r.key] || '').trim() ? 'Seeded' : 'Unwritten'
    }));
    const extras = Array.isArray(d.rhythms) ? d.rhythms.map((r, i) => ({
      id: r._id ? 'extra:' + r._id : 'extra:idx:' + i,
      source: 'extra',
      index: i,
      row: r,
      title: String(r.title || r.name || r.rhythm || 'Untitled rhythm'),
      cadence: normalizeCadence(r.cadence || r.frequency),
      area: String(r.area || r.category || 'Other'),
      owner: String(r.owner || 'Both'),
      value: String(r.value || r.notes || r.plan || ''),
      status: String(r.status || (r.done ? 'Kept' : 'Planned'))
    })) : [];
    return base.concat(extras);
  }
  function matchesRail(row) {
    const rail = window._fmRailView || 'all';
    if (rail === 'all') return true;
    return row.cadence.toLowerCase() === rail;
  }
  function visibleRows() { return allRows().filter(matchesRail); }
  function isKept(row) {
    if (/kept|done|complete/i.test(row.status || '')) return true;
    return !!String(row.value || '').trim();
  }

  function fmFigures() {
    const rows = allRows();
    const filled = rows.filter(r => String(r.value || '').trim()).length;
    const kept = rows.filter(isKept).length;
    const byCadence = { Daily: 0, Weekly: 0, Monthly: 0, Yearly: 0 };
    rows.forEach(r => { byCadence[r.cadence] = (byCadence[r.cadence] || 0) + 1; });
    return {
      rhythms: rows.length,
      filled: filled,
      keptThisMonth: Math.min(rows.length, kept),
      streaks: Math.min(4, Math.max(0, kept)),
      daily: byCadence.Daily || 0,
      weekly: byCadence.Weekly || 0,
      monthly: byCadence.Monthly || 0,
      yearly: byCadence.Yearly || 0,
      byCadence: byCadence,
      owners: rows.reduce((out, r) => { out[r.owner] = (out[r.owner] || 0) + 1; return out; }, {}),
      areas: rows.reduce((out, r) => { out[r.area] = (out[r.area] || 0) + 1; return out; }, {})
    };
  }
  function fmRailCounts() {
    const f = fmFigures();
    return { all: f.rhythms, daily: f.daily, weekly: f.weekly, monthly: f.monthly, yearly: f.yearly };
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdFmPrint()">Print rhythms</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdFmAdd()">+ Add rhythm</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-firstmonth');
    if (!panel) return;
    panel.classList.add('ued-scope', 'firstmonth-mockup');
    if (panel.dataset.uedShell === 'firstmonth-rd13d') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'firstmonth-rd13d';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Covenant</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">First-Month Rhythms</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="firstmonth-stats" aria-label="First-month rhythm summary"></div>
      <div class="rd-toolbar" id="firstmonth-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="firstmonth-surface-row">
          <div class="rd-surface__main" id="firstmonth-view-host">
            <div class="rd-view" id="fm-view-table"></div>
            <div class="rd-view" id="fm-view-cards" hidden></div>
            <div class="rd-view" id="fm-view-year" hidden></div>
          </div>
          <div id="firstmonth-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderStats() {
    const host = document.getElementById('firstmonth-stats');
    if (!host) return;
    const f = fmFigures();
    const stats = [
      { label: 'Rhythms', value: String(f.rhythms) },
      { label: 'Kept this month', value: String(f.keptThisMonth) },
      { label: 'Streaks', value: f.streaks + ' seeded' },
      { label: 'Written', value: f.filled + ' of ' + f.rhythms }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s => `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`).join('');
  }

  function groupItems() {
    const group = window._fmGroupBy || 'cadence';
    const out = {};
    visibleRows().forEach(r => {
      const key = group === 'owner' ? r.owner : (group === 'area' ? r.area : r.cadence);
      if (!out[key]) out[key] = [];
      out[key].push(r);
    });
    return Object.keys(out).sort().map(k => ({ key: k, rows: out[k] }));
  }
  function filterChip(id, label) {
    const on = (window._fmRailView || 'all') === id;
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="applyFirstmonthRailView('${esc(id)}')">${esc(label)}${on && id !== 'all' ? '<span class="rd-chip__clear">x</span>' : ''}</button>`;
  }
  function renderToolbar() {
    const host = document.getElementById('firstmonth-toolbar');
    if (!host) return;
    const mode = window._fmMode || 'table';
    const group = window._fmGroupBy || 'cadence';
    host.innerHTML = `<div class="rd-toolbar__left">
      ${filterChip('all', 'All')}
      ${filterChip('daily', 'Daily')}
      ${filterChip('weekly', 'Weekly')}
      ${filterChip('monthly', 'Monthly')}
      ${filterChip('yearly', 'Yearly')}
      <button type="button" class="rd-chip" onclick="rdFmCycleGroup()">Group by: ${esc(group)}</button>
      ${typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by cadence', "rdStdOpenSort(this,'firstmonth')") : ''}
      ${typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('firstmonth') : ''}
    </div>
    <div class="rd-toolbar__right">
      <div class="rd-viewswitch" role="group" aria-label="First-month view">
        <button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('table')">Table</button>
        <button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('cards')">Cards</button>
        <button type="button" class="rd-viewswitch__item${mode === 'year' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('year')">Year</button>
      </div>
    </div>`;
  }
  function applyMode() {
    const mode = window._fmMode || 'table';
    ['table', 'cards', 'year'].forEach(name => {
      const el = document.getElementById('fm-view-' + name);
      if (el) el.hidden = mode !== name;
    });
  }
  function rdSetFirstmonthView(mode) {
    window._fmMode = (mode === 'cards' || mode === 'year') ? mode : 'table';
    renderFirstmonthRd();
  }
  function applyFirstmonthRailView(viewId) {
    window._fmRailView = ['all', 'daily', 'weekly', 'monthly', 'yearly'].includes(viewId) ? viewId : 'all';
    if (typeof setSavedView === 'function') setSavedView('firstmonth', window._fmRailView);
    renderFirstmonthRd();
  }
  function applyFirstmonthGroupBy(id) {
    window._fmGroupBy = ['cadence', 'owner', 'area'].includes(id) ? id : 'cadence';
    renderFirstmonthRd();
  }
  function rdFmCycleGroup() {
    const order = ['cadence', 'owner', 'area'];
    const i = order.indexOf(window._fmGroupBy || 'cadence');
    applyFirstmonthGroupBy(order[(i + 1) % order.length]);
  }

  function selectHtml(opts, val) {
    return opts.map(o => `<option value="${esc(o)}"${String(o) === String(val) ? ' selected' : ''}>${esc(o)}</option>`).join('');
  }
  function saveCell(row, field, val) {
    if (row.source === 'base') {
      if (field === 'value') saveBase(row.key, val);
      return;
    }
    saveExtra(row.index, field, val);
  }
  function rowEditor(row) {
    const id = row.source + ':' + row.index;
    if (row.source === 'base') {
      return `<textarea rows="2" oninput="rdFmSave('${esc(id)}','value',this.value)">${esc(row.value)}</textarea>`;
    }
    return `<textarea rows="2" oninput="rdFmSave('${esc(id)}','value',this.value)">${esc(row.value)}</textarea>`;
  }
  function renderTableView() {
    const host = document.getElementById('fm-view-table');
    if (!host) return;
    const groups = groupItems();
    let html = '<section class="ued-table-card"><div class="ued-table-head"><div><div class="ued-kicker">Rhythms</div><div class="ued-table-title">First-month rhythm table</div></div></div>';
    html += '<div class="ued-table-wrap"><table class="ued-table rd-table"><thead><tr><th>Rhythm</th><th>Cadence</th><th>Area</th><th>Owner</th><th>Plan</th><th></th></tr></thead><tbody>';
    if (!groups.length) html += '<tr><td colspan="6" class="rd-empty">No rhythms match this view.</td></tr>';
    groups.forEach(g => {
      html += `<tr class="rd-group-row"><td colspan="6">${esc(g.key)}</td></tr>`;
      g.rows.forEach(r => {
        const id = r.source + ':' + r.index;
        const open = window._fmDrawerId === id;
        /* Editable cells stopPropagation so typing doesn't open the drawer;
           title (base rows) + Open button open Rhythm · Cadence · Streak · History. */
        html += `<tr class="${open ? 'is-open' : ''}" style="cursor:pointer" onclick="rdFmOpenDrawer('${esc(id)}')">
          <td>${r.source === 'extra' ? `<input value="${esc(r.title)}" onclick="event.stopPropagation()" oninput="rdFmSave('${esc(id)}','title',this.value)">` : `<strong>${esc(r.title)}</strong>`}</td>
          <td>${r.source === 'extra' ? `<select onclick="event.stopPropagation()" onchange="rdFmSave('${esc(id)}','cadence',this.value)">${selectHtml(CADENCES, r.cadence)}</select>` : esc(r.cadence)}</td>
          <td>${r.source === 'extra' ? `<select onclick="event.stopPropagation()" onchange="rdFmSave('${esc(id)}','area',this.value)">${selectHtml(AREAS, r.area)}</select>` : esc(r.area)}</td>
          <td>${r.source === 'extra' ? `<select onclick="event.stopPropagation()" onchange="rdFmSave('${esc(id)}','owner',this.value)">${selectHtml(OWNERS, r.owner)}</select>` : esc(r.owner)}</td>
          <td onclick="event.stopPropagation()">${rowEditor(r)}</td>
          <td onclick="event.stopPropagation()"><button type="button" class="rd-btn rd-btn--quiet" onclick="rdFmOpenDrawer('${esc(id)}')">Open</button></td>
        </tr>`;
      });
    });
    html += '</tbody></table></div></section>';
    host.innerHTML = html;
  }
  function renderCardsView() {
    const host = document.getElementById('fm-view-cards');
    if (!host) return;
    const rows = visibleRows();
    host.innerHTML = `<div class="hub-record-card-grid rd-fm-cards">${rows.map(r => {
      const id = r.source + ':' + r.index;
      return `<article class="hub-record-card rd-fm-card" onclick="rdFmOpenDrawer('${esc(id)}')">
        <div class="hub-record-card-head"><h3 class="hub-record-card-title">${esc(r.title)}</h3><span class="status-pill" data-pillscheme="${isKept(r) ? 'green' : 'amber'}">${esc(isKept(r) ? 'Seeded' : 'Open')}</span></div>
        <div class="hub-record-card-fields">
          <div class="hub-record-card-field"><span>Cadence</span><strong>${esc(r.cadence)}</strong></div>
          <div class="hub-record-card-field"><span>Area</span><strong>${esc(r.area)}</strong></div>
          <div class="hub-record-card-field"><span>Owner</span><strong>${esc(r.owner)}</strong></div>
          <div class="hub-record-card-field full" onclick="event.stopPropagation()"><span>Plan</span><textarea rows="3" oninput="rdFmSave('${esc(id)}','value',this.value)">${esc(r.value)}</textarea></div>
        </div>
      </article>`;
    }).join('') || '<div class="rd-empty">No rhythm cards match this view.</div>'}</div>`;
  }
  function renderYearView() {
    const host = document.getElementById('fm-view-year');
    if (!host) return;
    const rows = visibleRows();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cells = row => months.map((m, i) => {
      let on = row.cadence === 'Daily' || row.cadence === 'Weekly' || row.cadence === 'Monthly';
      if (row.cadence === 'Yearly') on = i === 0;
      return `<span class="rd-fm-year__cell${on ? ' is-on' : ''}" title="${esc(row.title + ' - ' + m)}"></span>`;
    }).join('');
    host.innerHTML = `<section class="ued-table-card">
      <div class="ued-table-head"><div><div class="ued-kicker">Year</div><div class="ued-table-title">Cadence plot</div></div></div>
      <div class="rd-fm-year">
        <div class="rd-fm-year__months"><span></span>${months.map(m => `<b>${esc(m)}</b>`).join('')}</div>
        ${rows.map(r => `<div class="rd-fm-year__row"><strong>${esc(r.title)}</strong>${cells(r)}</div>`).join('') || '<div class="rd-empty">No rhythms to plot.</div>'}
      </div>
    </section>`;
  }

  function findRow(ref) {
    const parts = String(ref || '').split(':');
    const source = parts[0];
    const index = parseInt(parts[1], 10);
    return allRows().find(r => r.source === source && r.index === index) || null;
  }
  function rdFmSave(ref, field, val) {
    const row = findRow(ref);
    if (!row) return;
    saveCell(row, field, val);
    renderStats();
    if (window._fmMode === 'year') renderYearView();
    if (window._fmDrawerId === ref) renderFmDrawer();
  }

  /* ── drawer (Rhythm · Cadence · Streak · History) ─────────────────────── */

  function parkSharedFmDrawerAway(slot) {
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
  function weddingDateLabel(offsetDays) {
    const d = store();
    const s = d.setup || {};
    const raw = s.weddingDate || s.date || '';
    if (!raw) return '—';
    const dt = new Date(String(raw).split('T')[0] + 'T00:00:00');
    if (Number.isNaN(dt.getTime())) return String(raw);
    if (offsetDays) dt.setDate(dt.getDate() + offsetDays);
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderFmDrawer() {
    const slot = document.getElementById('firstmonth-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const r = findRow(window._fmDrawerId);
    if (!r) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedFmDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedFmDrawerAway(slot);
    const id = r.source + ':' + r.index;
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._fmDrawerTab, 10) || 0));
    const kept = isKept(r);
    const f = fmFigures();
    let body = '';
    if (tab === 0) {
      body =
        field('Rhythm', r.title) +
        field('Area', r.area) +
        field('Owner', r.owner) +
        field('Cadence', r.cadence) +
        field('Begins', weddingDateLabel(1)) +
        `<div class="rd-drawer__section-title">What it means</div>` +
        `<div class="rd-fm-drawer__prose">${r.value ? esc(r.value).replace(/\n/g, '<br>') : '<em class="rd-empty">Not written yet.</em>'}</div>` +
        `<p class="rd-drawer__note">The definition matters more than the field. A rhythm with a vague meaning is one that gets quietly redefined until it is always kept.</p>`;
    } else if (tab === 1) {
      body =
        field('Frequency', CADENCE_FREQUENCY[r.cadence] || r.cadence) +
        field('Begins', weddingDateLabel(1)) +
        field('Reviewed', 'Each anniversary') +
        field('Paused', 'Never') +
        `<p class="rd-drawer__note">Rhythms begin the day after the wedding and never appear on the Timeline. They are not wedding work, and mixing them in would make the task list look unfinishable.</p>` +
        `<div class="rd-drawer__section-title">The ${f.rhythms}</div>` +
        field('Daily', String(f.daily)) +
        field('Weekly', String(f.weekly)) +
        field('Monthly', String(f.monthly)) +
        field('Yearly', String(f.yearly));
    } else if (tab === 2) {
      body =
        field('Streak', kept ? 'Seeded' : 'Not started') +
        field('This week', kept ? 'Seeded' : '0') +
        field('Longest run', kept ? 'Seeded' : '—') +
        `<p class="rd-drawer__note">A streak is counted, not scored. There is no target and no badge — the number exists so a slip is visible, not so it can be won. Streaks are seeded here, not scored.</p>` +
        `<div class="rd-drawer__section-title">Across the ${f.rhythms}</div>` +
        field('Kept this month', f.keptThisMonth + ' of ' + f.rhythms) +
        field('Streaks seeded', String(f.streaks));
    } else {
      body =
        `<div class="rd-drawer__section-title">This rhythm</div>` +
        (r.value
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Both<div>Written, before the wedding</div></div>`
          : `<div class="rd-drawer__hist"><strong>—</strong> · Both<div>Not yet written</div></div>`) +
        `<div class="rd-drawer__hist"><strong>—</strong> · Both<div>Added to the ${esc(r.cadence.toLowerCase())} rhythms</div></div>` +
        `<p class="rd-drawer__note">Written before the wedding, started after it. The gap between defining a rhythm and beginning it is deliberate — deciding under no pressure, keeping it under real conditions.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-fm-drawer" aria-label="Rhythm">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Rhythm · ${esc(r.cadence.toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(r.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="blue">${esc(r.cadence)}</span>` +
      `<span class="status-pill" data-pillscheme="${kept ? 'green' : 'gray'}">${esc(kept ? 'Seeded' : 'Unwritten')}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdFmCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdFmSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdFmCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdFmDrawerFullEditor('${esc(id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  function rdFmOpenDrawer(id) {
    window._fmDrawerId = id;
    window._fmDrawerTab = 0;
    renderFmDrawer();
  }
  function rdFmCloseDrawer() {
    window._fmDrawerId = null;
    const slot = document.getElementById('firstmonth-drawer-slot');
    if (slot) {
      parkSharedFmDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdFmSetDrawerTab(i) {
    window._fmDrawerTab = i;
    renderFmDrawer();
  }
  function rdFmDrawerFullEditor(id) {
    rdFmCloseDrawer();
    window._fmMode = 'cards';
    renderFirstmonthRd();
    setTimeout(() => {
      const el = document.querySelector('.rd-fm-card textarea');
      if (el) el.focus();
    }, 30);
  }
  function rdFmAdd() {
    const d = ensureData();
    if (!Array.isArray(d.rhythms)) d.rhythms = [];
    d.rhythms.push({ title: 'New rhythm', cadence: 'Weekly', area: 'Home', owner: 'Both', value: '', status: 'Planned' });
    if (typeof save === 'function') save();
    window._fmMode = 'table';
    window._fmRailView = 'all';
    renderFirstmonthRd();
  }
  function rdFmPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildRhythmsPrintSheets === 'function') {
      openCovenantPrintTemplate(buildRhythmsPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdFmExport() {
    const payload = { firstmonth: ensureData().firstmonth || {}, rhythms: ensureData().rhythms || [] };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'first-month-rhythms.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Rhythms exported.');
  }

  function renderFirstmonthRd() {
    ensureData();
    if (typeof getSavedView === 'function') window._fmRailView = getSavedView('firstmonth', window._fmRailView || 'all');
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('firstmonth');
    applyMode();
    renderStats();
    renderToolbar();
    renderTableView();
    renderCardsView();
    renderYearView();
    renderFmDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'firstmonth'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('firstmonth');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('firstmonth');
  }

  window.uedFirstmonthShell = ensureShell;
  window.renderFirstmonthPage = renderFirstmonthRd;
  window.renderFirstmonthRd = renderFirstmonthRd;
  window.rdSetFirstmonthView = rdSetFirstmonthView;
  window.applyFirstmonthRailView = applyFirstmonthRailView;
  window.applyFirstmonthGroupBy = applyFirstmonthGroupBy;
  window.fmRailCounts = fmRailCounts;
  window.fmFigures = fmFigures;
  window.rdFmCycleGroup = rdFmCycleGroup;
  window.rdFmSave = rdFmSave;
  window.rdFmAdd = rdFmAdd;
  window.rdFmPrint = rdFmPrint;
  window.rdFmExport = rdFmExport;
  window.rdFmOpenDrawer = rdFmOpenDrawer;
  window.rdFmCloseDrawer = rdFmCloseDrawer;
  window.rdFmSetDrawerTab = rdFmSetDrawerTab;
  window.rdFmDrawerFullEditor = rdFmDrawerFullEditor;

  function hookFirstmonthPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.firstmonth = function () { renderFirstmonthRd(); };
  }
  hookFirstmonthPanelRenderer();
  var _showPanelFm = window.showPanel;
  if (typeof _showPanelFm === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelFm.call(window, id, forceOpen);
      hookFirstmonthPanelRenderer();
      return out;
    };
  }
})();
