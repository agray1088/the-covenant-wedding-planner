/* Planner History — All.dc #18b
   No-tab page reached from the top-bar undo/redo cluster and prefs.
   Views: By day | By record | Field detail.
   Rail: Filter by record · Retention · Jump to.
   Log capped at HISTORY_LOG_LIMIT (200). Undo snapshots stay at HISTORY_SNAPSHOT_LIMIT. */
(function () {
  'use strict';

  window._histMode = window._histMode || 'day';
  window._histRailFilter = window._histRailFilter || 'all';
  window._histJump = window._histJump || 'all';
  window._histUiFilters = window._histUiFilters || { record: 'all', who: 'both', date: 'all' };
  window._histSortNewest = window._histSortNewest !== false;
  window._histPageSize = window._histPageSize || 50;
  window._histVisible = window._histVisible || 50;
  window._histSel = window._histSel instanceof Set ? window._histSel : new Set();

  const RECORD_FILTERS = [
    { id: 'all', label: 'Everything', match: null },
    { id: 'guests', label: 'Guests', match: /guest|household|party|gift|table/i },
    { id: 'budget', label: 'Budget & payments', match: /budget|payment|contract|rental/i },
    { id: 'tasks', label: 'Tasks', match: /task|timeline|planning|appointment|calendar/i },
    { id: 'vendors', label: 'Vendors', match: /vendor|venue|catering|entertainment|shot/i },
    { id: 'tables', label: 'Table layout', match: /table layout|seating|tables/i },
    { id: 'other', label: 'Everything else', match: null }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function ensureData() {
    const d = store();
    if (!Array.isArray(d._historyLog)) d._historyLog = [];
    if (!Array.isArray(d._undoSnapshots)) d._undoSnapshots = [];
    if (!Array.isArray(d._redoSnapshots)) d._redoSnapshots = [];
    if (!d._historyPrefs || typeof d._historyPrefs !== 'object') d._historyPrefs = {};
    return d;
  }
  function logLimit() {
    return (typeof HISTORY_LOG_LIMIT === 'number' && HISTORY_LOG_LIMIT > 0) ? HISTORY_LOG_LIMIT : 200;
  }
  function snapLimit() {
    return (typeof HISTORY_SNAPSHOT_LIMIT === 'number' && HISTORY_SNAPSHOT_LIMIT > 0) ? HISTORY_SNAPSHOT_LIMIT : 15;
  }
  function todayISO() {
    return typeof historyTodayISO === 'function' ? historyTodayISO() : new Date().toISOString().slice(0, 10);
  }
  function parseISODate(iso) {
    if (!iso) return null;
    const dt = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  function fmtDayLong(iso) {
    const dt = parseISODate(iso);
    if (!dt) return iso || '—';
    return dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function fmtDayShort(iso) {
    const dt = parseISODate(iso);
    if (!dt) return iso || '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  function whoLabel() {
    const d = ensureData();
    const s = d.setup || {};
    const bride = String(s.bride || '').trim();
    if (bride) return bride.split(/\s+/)[0];
    return 'You';
  }
  function entryWho(item) {
    return String(item.who || whoLabel());
  }
  function entryRecord(item) {
    if (item.record) return String(item.record);
    return String(item.source || 'Planner');
  }
  function entryChange(item) {
    if (item.change) return String(item.change);
    if (item.action) return String(item.action);
    return String(item.details || 'Updated the planner');
  }
  function entryFields(item) {
    if (Array.isArray(item.fields) && item.fields.length) return item.fields;
    const details = String(item.details || '');
    const parts = details.split(/;\s*/).filter(Boolean);
    return parts.map(part => {
      const m = part.match(/^([^:]+):\s*(.+)$/);
      if (!m) return { label: part, from: '', to: '' };
      const arrow = m[2].match(/^(.*?)\s*→\s*(.*)$/);
      if (arrow) return { label: m[1].trim(), from: arrow[1].trim(), to: arrow[2].trim() };
      return { label: m[1].trim(), from: '', to: m[2].trim() };
    });
  }
  function recordBucket(item) {
    const hay = (entryRecord(item) + ' ' + entryChange(item) + ' ' + (item.source || '') + ' ' + (item.details || '')).toLowerCase();
    for (let i = 1; i < RECORD_FILTERS.length - 1; i++) {
      if (RECORD_FILTERS[i].match && RECORD_FILTERS[i].match.test(hay)) return RECORD_FILTERS[i].id;
    }
    return 'other';
  }
  function markUndoability() {
    const d = ensureData();
    const undoN = d._undoSnapshots.length;
    let seen = 0;
    d._historyLog.forEach(item => {
      if (item && item.hasSnapshot) {
        item.undoable = seen < undoN;
        item.undoRank = seen;
        seen += 1;
      } else if (item) {
        item.undoable = false;
        item.undoRank = -1;
      }
    });
  }
  function histFigures() {
    const d = ensureData();
    markUndoability();
    const log = d._historyLog;
    const today = todayISO();
    const todayCount = log.filter(i => i.date === today).length;
    const limit = logLimit();
    const snapMax = snapLimit();
    const oldest = log.length ? log[log.length - 1] : null;
    let oldestUndo = null;
    for (let i = 0; i < log.length; i++) {
      if (log[i] && log[i].undoable) oldestUndo = log[i];
    }
    const capacity = limit ? Math.round((log.length / limit) * 100) : 0;
    const counts = {};
    RECORD_FILTERS.forEach(f => { counts[f.id] = 0; });
    log.forEach(item => {
      counts.all += 1;
      counts[recordBucket(item)] = (counts[recordBucket(item)] || 0) + 1;
    });
    return {
      total: log.length,
      today: todayCount,
      undo: d._undoSnapshots.length,
      redo: d._redoSnapshots.length,
      capacity,
      logLimit: limit,
      snapLimit: snapMax,
      oldestShort: oldest ? fmtDayShort(oldest.date) : '—',
      oldestUndoShort: oldestUndo
        ? (fmtDayShort(oldestUndo.date) + (oldestUndo.time ? ' · ' + oldestUndo.time : ''))
        : '—',
      counts,
      warn: capacity >= 80
    };
  }
  function histRailCounts() {
    return histFigures().counts;
  }

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHistJumpDate()">Jump to a date</button>'
      + '<button type="button" class="rd-btn" onclick="rdHistPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdHistFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdHistExport()">Export the log</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHistUndoLast()">Undo last change</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-history');
    if (!panel) return;
    panel.classList.add('ued-scope', 'history-mockup');
    if (panel.dataset.uedShell === 'history-rd18b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'history-rd18b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Reached from the top bar</div>
          <div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Planner History</h1></div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="history-stats" aria-label="History summary"></div>
      <div class="rd-toolbar" id="history-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row">
          <div class="rd-surface__main" id="history-view-host"></div>
        </div>
      </div>
      <input type="date" id="history-date-filter" class="rd-hist-date-hidden" aria-hidden="true" tabindex="-1">
    </div>`;
  }

  function renderStats() {
    const host = document.getElementById('history-stats');
    if (!host) return;
    const f = histFigures();
    const stats = [
      { label: 'Recorded changes', value: String(f.total) },
      { label: 'Today', value: String(f.today) },
      { label: 'Undo available', value: String(f.undo) },
      { label: 'Redo available', value: String(f.redo) },
      { label: 'Log capacity', value: f.capacity + '%' }
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
    const ui = window._histUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all' && !(field === 'who' && cur === 'both');
    const display = field === 'who' && (!cur || cur === 'all') ? 'both' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHistCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHistClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderToolbar() {
    const host = document.getElementById('history-toolbar');
    if (!host) return;
    const mode = window._histMode || 'day';
    host.innerHTML =
      filterChip('Record', 'record') +
      filterChip('Who', 'who') +
      filterChip('Date', 'date') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdHistToggleSort()">${window._histSortNewest ? 'Newest first' : 'Oldest first'}</button>` +
      `<div class="rd-toolbar__right">` +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('history') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="History view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'day' ? ' is-active' : ''}" onclick="rdSetHistoryView('day')">By day</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'record' ? ' is-active' : ''}" onclick="rdSetHistoryView('record')">By record</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'fields' ? ' is-active' : ''}" onclick="rdSetHistoryView('fields')">Field detail</button>` +
      `</div></div>`;
  }

  function filteredEntries() {
    const d = ensureData();
    markUndoability();
    const ui = window._histUiFilters || {};
    const rail = window._histRailFilter || 'all';
    const jump = window._histJump || 'all';
    const today = todayISO();
    const yest = (() => {
      const dt = parseISODate(today);
      if (!dt) return '';
      dt.setDate(dt.getDate() - 1);
      return dt.toISOString().slice(0, 10);
    })();
    const weekStart = (() => {
      const dt = parseISODate(today);
      if (!dt) return '';
      const day = dt.getDay();
      dt.setDate(dt.getDate() - day);
      return dt.toISOString().slice(0, 10);
    })();
    let rows = d._historyLog.map((row, index) => ({ row, index }));
    if (rail !== 'all') rows = rows.filter(x => recordBucket(x.row) === rail);
    if (ui.record && ui.record !== 'all') rows = rows.filter(x => recordBucket(x.row) === ui.record);
    if (ui.who && ui.who !== 'all' && ui.who !== 'both') {
      rows = rows.filter(x => entryWho(x.row).toLowerCase() === String(ui.who).toLowerCase());
    }
    if (ui.date && ui.date !== 'all') rows = rows.filter(x => x.row.date === ui.date);
    if (jump === 'today') rows = rows.filter(x => x.row.date === today);
    else if (jump === 'yesterday') rows = rows.filter(x => x.row.date === yest);
    else if (jump === 'week') rows = rows.filter(x => String(x.row.date || '') >= weekStart);
    else if (jump && jump !== 'all' && /^\d{4}-\d{2}-\d{2}$/.test(jump)) {
      rows = rows.filter(x => x.row.date === jump);
    }
    rows.sort((a, b) => {
      const cmp = String(a.row.iso || a.row.date || '').localeCompare(String(b.row.iso || b.row.date || ''));
      return window._histSortNewest ? -cmp : cmp;
    });
    return rows;
  }

  function fieldDiffHtml(fields) {
    if (!fields || !fields.length) return '';
    return `<div class="rd-hist-diffs">` + fields.slice(0, 4).map(f => {
      if (f.from || f.to) {
        return `<span class="rd-hist-diff"><span class="rd-hist-diff__k">${esc(f.label)}</span>` +
          `<span class="rd-hist-diff__from">${esc(f.from || '—')}</span><span class="rd-hist-diff__arrow">→</span>` +
          `<span class="rd-hist-diff__to">${esc(f.to || '—')}</span></span>`;
      }
      return `<span class="rd-hist-diff"><span class="rd-hist-diff__k">${esc(f.label)}</span><span class="rd-hist-diff__to">${esc(f.to || '')}</span></span>`;
    }).join('') + `</div>`;
  }

  function undoCellHtml(item, index) {
    if (item.undoable) {
      return `<button type="button" class="rd-hist-undo" onclick="rdHistUndoEntry(${index})">Undo this</button>`;
    }
    if (item.hasSnapshot) {
      return `<span class="rd-hist-aged">Snapshot aged out</span>`;
    }
    return `<span class="rd-hist-aged">Nothing to undo</span>`;
  }

  function retentionCalloutHtml(f) {
    if (!f.warn) return '';
    return `<div class="rd-callout rd-callout--warn" id="history-retention-warning">` +
      `<div><strong>Log is ${f.capacity}% full</strong>` +
      `<p>At ${f.logLimit} entries the oldest are dropped, oldest first. That removes the readable record only — it never touches a planner record. Export the log before it fills if you want to keep a copy.</p></div>` +
      `<button type="button" class="rd-btn" onclick="rdHistExport()">Export now</button></div>`;
  }

  function explainerHtml() {
    const f = histFigures();
    return `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">Why some rows cannot be undone</div>` +
      `<p class="rd-help">Two different things are kept, and they run out at different speeds.</p></div>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="typeof showPanel==='function'&&showPanel('instructions',true)">Read about backups</button>` +
      `</div>` +
      `<div class="rd-grid-3 rd-hist-explainer" id="history-explainer">` +
      `<article><h3>The log · ${f.logLimit}</h3><p>Every change is written here as a readable line. When the log fills, the oldest lines drop — the planner itself is untouched.</p></article>` +
      `<article><h3>Snapshots · ${f.snapLimit}</h3><p>Undo restores a whole planner snapshot. Only the last ${f.snapLimit} are kept, so older rows read “snapshot aged out.”</p></article>` +
      `<article><h3>Neither is a backup</h3><p>Clearing history or losing the browser profile still needs a downloaded backup from Get Started or the top bar.</p></article>` +
      `</div>` +
      `<p class="rd-help rd-hist-clear-note">Clearing the log lives on <b>Wedding Setup</b>, in the danger zone with the other irreversible actions — not here, where it would sit one click from the thing it destroys. ` +
      `<button type="button" class="rd-linkbtn" onclick="typeof showPanel==='function'&&showPanel('setup',true)">Open Wedding Setup →</button></p>`;
  }

  function rowHtml(x) {
    const r = x.row;
    const id = r.id || ('h' + x.index);
    const sel = window._histSel.has(id);
    const fields = entryFields(r);
    return `<tr class="${sel ? 'is-selected' : ''}" data-hist-id="${esc(id)}" onclick="rdHistOpenEntry('${esc(id)}')">` +
      `<td><input type="checkbox" ${sel ? 'checked' : ''} onclick="event.stopPropagation()" onchange="rdHistToggleSel('${esc(id)}')"></td>` +
      `<td><div class="rd-hist-change">${esc(entryChange(r))}</div>${fieldDiffHtml(fields)}</td>` +
      `<td>${esc(entryRecord(r))}</td>` +
      `<td>${esc(entryWho(r))}</td>` +
      `<td>${esc(r.time || '')}</td>` +
      `<td onclick="event.stopPropagation()">${undoCellHtml(r, x.index)}</td>` +
      `</tr>`;
  }

  function renderByDay() {
    const host = document.getElementById('history-view-host');
    if (!host) return;
    const f = histFigures();
    const all = filteredEntries();
    const visible = all.slice(0, window._histVisible || 50);
    const groups = [];
    const map = {};
    visible.forEach(x => {
      const key = x.row.date || 'unknown';
      if (!map[key]) {
        map[key] = { date: key, rows: [] };
        groups.push(map[key]);
      }
      map[key].rows.push(x);
    });
    let html = retentionCalloutHtml(f);
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hist-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Change</th><th>Record</th><th>Who</th><th>Time</th><th>Undo</th>` +
      `</tr></thead><tbody>`;
    if (!visible.length) {
      html += `<tr><td colspan="6" class="rd-empty">No changes were recorded for this view.</td></tr>`;
    } else {
      groups.forEach(g => {
        const label = (g.date === todayISO() ? 'Today · ' : (g.date === (() => {
          const dt = parseISODate(todayISO());
          if (!dt) return '';
          dt.setDate(dt.getDate() - 1);
          return dt.toISOString().slice(0, 10);
        })() ? 'Yesterday · ' : '')) + fmtDayLong(g.date) + ' · ' + g.rows.length + ' change' + (g.rows.length === 1 ? '' : 's');
        const oldestSnap = g.rows.find(x => x.row.undoable && !g.rows.some(y => y.row.undoable && y.row.undoRank > x.row.undoRank));
        let band = label;
        const undoables = g.rows.filter(x => x.row.undoable);
        if (undoables.length) {
          const oldest = undoables.reduce((a, b) => (a.row.undoRank > b.row.undoRank ? a : b));
          if (oldest.row.undoRank === (f.undo - 1)) {
            band += ' · ' + (oldest.row.time || '') + ' is the oldest snapshot still kept';
          }
        }
        html += `<tr class="rd-group-row rd-hist-group"><td colspan="6">${esc(band)}</td></tr>`;
        g.rows.forEach(x => { html += rowHtml(x); });
      });
    }
    html += `</tbody></table></div>`;
    if (all.length > visible.length) {
      html += `<button type="button" class="rd-hist-loadmore" onclick="rdHistLoadMore()">+ Load 50 older entries · ${f.total} recorded, ${all.length - visible.length} before this page</button>`;
    }
    html += explainerHtml();
    host.innerHTML = html;
  }

  function renderByRecord() {
    const host = document.getElementById('history-view-host');
    if (!host) return;
    const f = histFigures();
    const all = filteredEntries().slice(0, window._histVisible || 50);
    const map = {};
    all.forEach(x => {
      const key = entryRecord(x.row);
      if (!map[key]) map[key] = [];
      map[key].push(x);
    });
    let html = retentionCalloutHtml(f);
    html += `<div class="ued-table-wrap"><table class="ued-table rd-table rd-hist-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Change</th><th>Record</th><th>Who</th><th>Time</th><th>Undo</th>` +
      `</tr></thead><tbody>`;
    const keys = Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    if (!keys.length) {
      html += `<tr><td colspan="6" class="rd-empty">No changes were recorded for this view.</td></tr>`;
    } else {
      keys.forEach(key => {
        const rows = map[key];
        const last = rows[0];
        const lastLabel = last.row.date === todayISO() ? 'last today' : ('last ' + fmtDayShort(last.row.date));
        html += `<tr class="rd-group-row rd-hist-group"><td colspan="6">${esc(key)} · ${rows.length} change${rows.length === 1 ? '' : 's'} · ${esc(lastLabel)}</td></tr>`;
        rows.forEach(x => { html += rowHtml(x); });
      });
    }
    html += `</tbody></table></div>` + explainerHtml();
    host.innerHTML = html;
  }

  function renderFieldDetail() {
    const host = document.getElementById('history-view-host');
    if (!host) return;
    const f = histFigures();
    const all = filteredEntries().slice(0, window._histVisible || 50);
    let html = retentionCalloutHtml(f);
    html += `<div class="rd-hist-fields">`;
    if (!all.length) {
      html += `<p class="rd-empty">No field-level changes in this view.</p>`;
    } else {
      all.forEach(x => {
        const fields = entryFields(x.row);
        html += `<article class="rd-hist-fieldcard">` +
          `<header><div class="rd-hist-fieldcard__title">${esc(entryChange(x.row))}</div>` +
          `<div class="rd-hist-fieldcard__meta">${esc(entryRecord(x.row))} · ${esc(entryWho(x.row))} · ${esc(x.row.time || '')}</div></header>` +
          (fields.length ? `<ul>${fields.map(fld =>
            `<li><span>${esc(fld.label)}</span><span>${esc(fld.from || '—')}</span><span>→</span><span>${esc(fld.to || '—')}</span>` +
            (x.row.undoable ? `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdHistUndoEntry(${x.index})">Restore</button>` : `<span class="rd-hist-aged">Unavailable</span>`) +
            `</li>`
          ).join('')}</ul>` : `<p class="rd-help">No field diffs were captured for this change. Restore acts on one field when diffs are present — never a whole record from this view.</p>`) +
          `</article>`;
      });
    }
    html += `</div>` + explainerHtml();
    host.innerHTML = html;
  }

  function renderView() {
    const mode = window._histMode || 'day';
    if (mode === 'record') renderByRecord();
    else if (mode === 'fields') renderFieldDetail();
    else renderByDay();
  }

  function rdSetHistoryView(mode) {
    window._histMode = (mode === 'record' || mode === 'fields') ? mode : 'day';
    if (typeof setSavedView === 'function') setSavedView('history', window._histMode);
    renderToolbar();
    renderView();
    refreshRail();
  }
  function applyHistoryRailFilter(id) {
    window._histRailFilter = RECORD_FILTERS.some(f => f.id === id) ? id : 'all';
    window._histVisible = 50;
    renderView();
    refreshRail();
  }
  function applyHistoryJump(id) {
    window._histJump = id || 'all';
    window._histVisible = 50;
    if (/^\d{4}-\d{2}-\d{2}$/.test(window._histJump)) {
      window._histUiFilters.date = window._histJump;
      const input = document.getElementById('history-date-filter');
      if (input) input.value = window._histJump;
    }
    renderToolbar();
    renderView();
    refreshRail();
  }
  function refreshRail() {
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'history'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('history');
    }
  }

  function rdHistCycleFilter(field) {
    const d = ensureData();
    const opts = { all: true };
    if (field === 'record') RECORD_FILTERS.forEach(f => { if (f.id !== 'all') opts[f.id] = true; });
    if (field === 'who') {
      opts.both = true;
      d._historyLog.forEach(r => { opts[entryWho(r)] = true; });
    }
    if (field === 'date') d._historyLog.forEach(r => { if (r.date) opts[r.date] = true; });
    const list = Object.keys(opts);
    const cur = (window._histUiFilters || {})[field] || (field === 'who' ? 'both' : 'all');
    const i = Math.max(0, list.indexOf(cur));
    window._histUiFilters[field] = list[(i + 1) % list.length];
    window._histVisible = 50;
    renderToolbar();
    renderView();
  }
  function rdHistClearFilter(field) {
    window._histUiFilters[field] = field === 'who' ? 'both' : 'all';
    renderToolbar();
    renderView();
  }
  function rdHistToggleSort() {
    window._histSortNewest = !window._histSortNewest;
    renderToolbar();
    renderView();
  }
  function rdHistLoadMore() {
    window._histVisible = (window._histVisible || 50) + 50;
    renderView();
  }
  function rdHistToggleSel(id) {
    if (window._histSel.has(id)) window._histSel.delete(id);
    else window._histSel.add(id);
    renderView();
  }
  function rdHistJumpDate() {
    const input = document.getElementById('history-date-filter');
    if (!input) return;
    const picked = window.prompt('Jump to a date (YYYY-MM-DD)', input.value || todayISO());
    if (!picked) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(picked)) {
      if (typeof showToast === 'function') showToast('Use YYYY-MM-DD.');
      return;
    }
    input.value = picked;
    applyHistoryJump(picked);
  }
  function rdHistPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdHistFullEditor() {
    if (typeof openHistoryDrawer === 'function') openHistoryDrawer();
    else if (typeof showToast === 'function') showToast('Open a change row for details.');
  }
  function rdHistExport() {
    const d = ensureData();
    const payload = {
      exportedAt: new Date().toISOString(),
      logLimit: logLimit(),
      snapshotLimit: snapLimit(),
      entries: d._historyLog
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'planner-history-log.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('History log exported.');
  }
  function rdHistUndoLast() {
    if (typeof undoPlannerChange === 'function') undoPlannerChange();
    else if (typeof undoLastChange === 'function') undoLastChange();
  }
  async function rdHistUndoEntry(index) {
    const d = ensureData();
    markUndoability();
    const item = d._historyLog[index];
    if (!item || !item.undoable) {
      if (typeof showToast === 'function') showToast('That snapshot has aged out.');
      return;
    }
    const depth = (item.undoRank || 0) + 1;
    if (depth > 1) {
      const ok = typeof covConfirm === 'function'
        ? await covConfirm('Undo this and the ' + (depth - 1) + ' newer change' + (depth - 1 === 1 ? '' : 's') + '? Undo restores whole planner snapshots.', { title: 'Undo to this change?', okText: 'Undo' })
        : window.confirm('Undo this and newer changes?');
      if (!ok) return;
    }
    for (let i = 0; i < depth; i++) {
      if (typeof undoPlannerChange === 'function') undoPlannerChange();
      else break;
    }
  }
  function rdHistOpenEntry(id) {
    const d = ensureData();
    const item = d._historyLog.find(r => r.id === id);
    if (!item) return;
    const slot = document.getElementById('history-drawer-body') || document.getElementById('record-drawer-body');
    if (typeof openHistoryDrawer === 'function') {
      openHistoryDrawer();
      const body = document.getElementById('history-drawer-body');
      if (body) {
        const fields = entryFields(item);
        body.innerHTML =
          `<div class="rd-hist-drawer">` +
          `<div class="rd-pagehead__eyebrow">Change</div>` +
          `<h3>${esc(entryChange(item))}</h3>` +
          `<p class="rd-help">${esc(entryRecord(item))} · ${esc(entryWho(item))} · ${esc(item.date || '')} ${esc(item.time || '')}</p>` +
          (fields.length ? `<ul class="rd-hist-drawer__fields">${fields.map(f =>
            `<li><b>${esc(f.label)}</b> ${esc(f.from || '—')} → ${esc(f.to || '—')}</li>`).join('')}</ul>` : `<p>${esc(item.details || '')}</p>`) +
          `<p class="rd-help">Undo restores the whole planner, not this row alone.</p>` +
          (item.undoable
            ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHistUndoEntry(${d._historyLog.indexOf(item)})">Undo this change</button>`
            : `<span class="rd-hist-aged">${item.hasSnapshot ? 'Snapshot aged out' : 'Nothing to undo'}</span>`) +
          `</div>`;
      }
      return;
    }
    if (slot) {
      /* fallback */
    }
  }

  function renderHistoryRd() {
    ensureData();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('history', window._histMode || 'day');
      window._histMode = (saved === 'record' || saved === 'fields') ? saved : 'day';
    }
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('history');
    markUndoability();
    renderStats();
    renderToolbar();
    renderView();
    refreshRail();
    if (typeof updateHistoryControls === 'function') updateHistoryControls();
    if (typeof uxRevealPanel === 'function') uxRevealPanel('history');
  }

  window.uedHistoryShell = ensureShell;
  window.renderHistoryPage = renderHistoryRd;
  window.renderHistoryRd = renderHistoryRd;
  window.rdSetHistoryView = rdSetHistoryView;
  window.applyHistoryRailFilter = applyHistoryRailFilter;
  window.applyHistoryJump = applyHistoryJump;
  window.histFigures = histFigures;
  window.histRailCounts = histRailCounts;
  window.rdHistCycleFilter = rdHistCycleFilter;
  window.rdHistClearFilter = rdHistClearFilter;
  window.rdHistToggleSort = rdHistToggleSort;
  window.rdHistLoadMore = rdHistLoadMore;
  window.rdHistToggleSel = rdHistToggleSel;
  window.rdHistJumpDate = rdHistJumpDate;
  window.rdHistPrint = rdHistPrint;
  window.rdHistFullEditor = rdHistFullEditor;
  window.rdHistExport = rdHistExport;
  window.rdHistUndoLast = rdHistUndoLast;
  window.rdHistUndoEntry = rdHistUndoEntry;
  window.rdHistOpenEntry = rdHistOpenEntry;
  window.openHistoryDatePicker = rdHistJumpDate;
  window.exportHistoryLog = rdHistExport;

  function hookHistoryPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.history = function () { renderHistoryRd(); };
  }
  hookHistoryPanelRenderer();
  var _showPanelHist = window.showPanel;
  if (typeof _showPanelHist === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelHist.call(window, id, forceOpen);
      hookHistoryPanelRenderer();
      return out;
    };
  }
})();
