/* Planner History — All.dc #18b / Master s34
   No-tab page reached from the top-bar undo/redo cluster and prefs.
   Views: Planner History (day) · By record view (31i) · Field detail view (31j).
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
  window._histDrawerId = window._histDrawerId || null;
  window._histDrawerTab = window._histDrawerTab || 0;
  window._histFieldRecord = window._histFieldRecord || '';
  window._histFieldName = window._histFieldName || '';

  const DRAWER_TABS = ['Change', 'Record', 'Snapshot'];
  const PAGE_VIEWS = [
    ['day', 'Planner History'],
    ['record', 'By record view'],
    ['fields', 'Field detail view']
  ];

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
    ensureMasterHistory();
    return d;
  }
  function shiftISO(days) {
    const dt = parseISODate(todayISO());
    if (!dt) return todayISO();
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
  }
  function histSeedEntry(id, date, time, who, record, change, opts) {
    opts = opts || {};
    return {
      id: id,
      iso: date + 'T12:00:00',
      date: date,
      time: time,
      who: who,
      record: record,
      source: record,
      change: change,
      action: change,
      details: opts.details || '',
      fields: opts.fields || [],
      hasSnapshot: opts.hasSnapshot !== false,
      groupKey: opts.groupKey || change
    };
  }
  /* Master 18b/31i/31j demo log — gated: empty history stays empty. */
  function ensureMasterHistory() {
    // Demo fiction is opt-in via Load sample data only — empty stays empty.
    return;
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
  /* Consequence chips (31i): a change that caused a derived effect is chipped
     with the effect, not just the field. Derived from the entry text, since
     the effect is not stored separately. */
  function entryConsequence(item) {
    if (item.consequence) return String(item.consequence);
    const hay = (entryChange(item) + ' ' + (item.details || '') + ' ' +
      entryFields(item).map(f => f.label + ' ' + f.from + ' ' + f.to).join(' ')).toLowerCase();
    if (/\+\s*\d+\s*cover|cover added|extra cover/.test(hay)) return '+1 cover';
    if (/-\s*\d+\s*cover|cover removed|fewer cover/.test(hay)) return '−1 cover';
    if (/clash|conflict|double[-\s]?book/.test(hay)) return 'created a clash';
    if (/over budget|category over|over the target|over target/.test(hay)) return 'category over';
    if (/(accepted|declined|rsvp).*(seat|meal|cover)|(seat|meal|cover).*(accepted|declined|rsvp)/.test(hay)) return 'seating affected';
    return '';
  }
  function recordBucket(item) {
    const hay = (entryRecord(item) + ' ' + entryChange(item) + ' ' + (item.source || '') + ' ' + (item.details || '')).toLowerCase();
    for (let i = 1; i < RECORD_FILTERS.length - 1; i++) {
      if (RECORD_FILTERS[i].match && RECORD_FILTERS[i].match.test(hay)) return RECORD_FILTERS[i].id;
    }
    return 'other';
  }
  function recordParts(recordStr) {
    const raw = String(recordStr || 'Planner').trim();
    const i = raw.indexOf(' · ');
    if (i < 0) return { type: raw, name: raw };
    return { type: raw.slice(0, i).trim(), name: raw.slice(i + 3).trim() };
  }
  function distinctEditors(rows) {
    const set = new Set();
    rows.forEach(x => set.add(entryWho(x.row)));
    return set.size;
  }
  function editorCountLabel(n) {
    if (n <= 1) return '1 person has edited it';
    return n + ' people have edited it';
  }
  function lastChangeLabel(row) {
    if (!row) return '—';
    if (row.date === todayISO()) return 'last today' + (row.time ? ' ' + row.time : '');
    return 'last ' + fmtDayShort(row.date) + (row.time ? ' ' + row.time : '');
  }
  function fieldCatalog() {
    const map = {};
    ensureData()._historyLog.forEach(item => {
      const rec = entryRecord(item);
      entryFields(item).forEach(fld => {
        const label = String(fld.label || '').trim();
        if (!label) return;
        const key = rec + '\u0000' + label;
        if (!map[key]) map[key] = { record: rec, field: label, key };
      });
    });
    return Object.values(map).sort((a, b) => a.record.localeCompare(b.record) || a.field.localeCompare(b.field));
  }
  function ensureFieldSelection() {
    const catalog = fieldCatalog();
    if (!catalog.length) {
      window._histFieldRecord = '';
      window._histFieldName = '';
      return null;
    }
    const cur = catalog.find(c => c.record === window._histFieldRecord && c.field === window._histFieldName);
    if (cur) return cur;
    window._histFieldRecord = catalog[0].record;
    window._histFieldName = catalog[0].field;
    return catalog[0];
  }
  function fieldTimeline(record, fieldName) {
    const rows = [];
    filteredEntries().forEach(x => {
      if (entryRecord(x.row) !== record) return;
      entryFields(x.row).forEach(fld => {
        if (String(fld.label || '').trim() !== fieldName) return;
        rows.push({
          index: x.index,
          row: x.row,
          from: fld.from || '',
          to: fld.to || '',
          who: entryWho(x.row),
          date: x.row.date,
          time: x.row.time || '',
          iso: x.row.iso || x.row.date || '',
          undoable: !!x.row.undoable,
          consequence: entryConsequence(x.row)
        });
      });
    });
    rows.sort((a, b) => String(b.iso).localeCompare(String(a.iso)));
    return rows;
  }
  function fieldTouchRows(fieldName, consequence) {
    const label = String(fieldName || '').toLowerCase();
    const rows = [];
    if (/time|date|start|end/.test(label)) {
      rows.push(['Smart Calendar block', 'moves']);
      rows.push(['Travel allowance window', 're-derives']);
      if (/clash|conflict/.test(consequence || '') || consequence === 'created a clash') {
        rows.push(['Clash check vs other appointments', 'fails at current value']);
      }
    } else if (/meal|diet|cover|rsvp|reply|guest|seat/.test(label)) {
      rows.push(['Catering · dietary summary', 're-derives']);
      rows.push(['Table Layout · meal assignment', 'may change']);
      if (consequence === '+1 cover' || consequence === '−1 cover') {
        rows.push(['Guest count · covers', consequence]);
      }
    } else if (/budget|amount|cost|fee|payment/.test(label)) {
      rows.push(['Budget totals', 're-derives']);
      rows.push(['Category committed %', 'may change']);
      if (consequence === 'category over') rows.push(['Category cap check', 'over target']);
    } else {
      rows.push(['Linked planner views', 'may refresh']);
    }
    rows.push(['Other planner records', 'unaffected']);
    return rows;
  }
  function fieldRestoreNote(fieldName, targetValue, consequence) {
    const field = String(fieldName || 'this field');
    const val = targetValue ? ('Restoring ' + targetValue) : ('Restoring ' + field);
    const bits = [val];
    if (consequence === 'created a clash') bits.push('clears the clash');
    else if (consequence === '+1 cover') bits.push('may reduce cover count');
    else if (consequence === 'category over') bits.push('may bring the category back under target');
    else bits.push('updates derived summaries that read this field');
    bits.push('It does not undo other fields on the same record, and it does not replace a whole-record rollback — that remains a confirmed snapshot action.');
    return bits.join('. ') + '.';
  }
  function histJumpDates() {
    const counts = {};
    ensureData()._historyLog.forEach(item => {
      if (!item.date) return;
      counts[item.date] = (counts[item.date] || 0) + 1;
    });
    const today = todayISO();
    const yest = (() => {
      const dt = parseISODate(today);
      if (!dt) return '';
      dt.setDate(dt.getDate() - 1);
      return dt.toISOString().slice(0, 10);
    })();
    const out = [];
    if (counts[today]) out.push({ id: 'today', label: 'Today', count: counts[today] });
    const others = Object.keys(counts)
      .filter(iso => iso !== today && iso !== yest)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 3)
      .map(iso => ({ id: iso, label: fmtDayShort(iso), count: counts[iso] }));
    out.push(...others);
    if (counts[yest]) out.splice(Math.min(1, out.length), 0, { id: 'yesterday', label: 'Yesterday', count: counts[yest] });
    return out;
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
    if (panel.dataset.uedShell === 'history-rd-s34') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'history-rd-s34';
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
        <div class="rd-surface__row" id="history-surface-row">
          <div class="rd-surface__main" id="history-view-host"></div>
          <div id="history-drawer-slot"></div>
        </div>
      </div>
      <input type="date" id="history-date-filter" class="rd-hist-date-hidden" aria-hidden="true" tabindex="-1">
    </div>`;
  }

  function renderStats() {
    const host = document.getElementById('history-stats');
    if (!host) return;
    const f = histFigures();
    const snapPct = f.snapLimit ? Math.min(100, Math.round((f.undo / f.snapLimit) * 100)) : 0;
    const stats = [
      { label: 'Recorded changes', value: String(f.total) },
      { label: 'Today', value: String(f.today) },
      { label: 'Undo available', value: String(f.undo), bar: snapPct },
      { label: 'Redo available', value: String(f.redo) },
      { label: 'Log capacity', value: f.capacity + '%', bar: f.capacity, tone: f.warn ? 'warn' : '' }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats.map(s => {
        const it = { label: s.label, value: s.value };
        if (s.bar != null) it.target = { pct: s.bar };
        if (s.tone === 'warn') it.attention = 'export before it fills';
        return it;
      }));
      return;
    }
    host.innerHTML = stats.map(s => {
      let html = `<div class="m-stat${s.tone === 'warn' ? ' m-stat--warn' : ''}">` +
        `<div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div>`;
      if (s.bar != null) html += `<div class="rd-track m-stat-bar"><div class="rd-fill" style="width:${s.bar}%"></div></div>`;
      return html + `</div>`;
    }).join('');
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
    let left = '';
    if (mode === 'fields') {
      ensureFieldSelection();
      left =
        `<button type="button" class="rd-chip${window._histFieldRecord ? ' is-active' : ''}" onclick="rdHistCycleFieldFilter('record')">Record: ${esc(window._histFieldRecord || '—')}</button>` +
        `<button type="button" class="rd-chip${window._histFieldName ? ' is-active' : ''}" onclick="rdHistCycleFieldFilter('field')">Field: ${esc(window._histFieldName || '—')}</button>` +
        `<span class="rd-chip rd-chip--ghost">Newest value first</span>`;
    } else {
      left =
        filterChip('Record', 'record') +
        filterChip('Who', 'who') +
        filterChip('Date', 'date') +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdHistToggleSort()">${window._histSortNewest ? 'Newest first' : 'Oldest first'}</button>`;
    }
    host.innerHTML =
      left +
      `<div class="rd-toolbar__right">` +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('history') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="History view">` +
      PAGE_VIEWS.map(([id, label]) =>
        `<button type="button" class="rd-viewswitch__item${mode === id ? ' is-active' : ''}" onclick="rdSetHistoryView('${id}')">${esc(label)}</button>`
      ).join('') +
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
    const consequence = entryConsequence(r);
    const open = window._histDrawerId === id;
    return `<tr class="rd-hist-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" data-hist-id="${esc(id)}" onclick="rdHistOpenEntry('${esc(id)}')">` +
      `<td><input type="checkbox" ${sel ? 'checked' : ''} onclick="event.stopPropagation()" onchange="rdHistToggleSel('${esc(id)}')"></td>` +
      `<td><div class="rd-hist-change">${esc(entryChange(r))}` +
      (consequence ? ` <span class="rd-hist-conseq" title="Downstream effect of this change">${esc(consequence)}</span>` : '') +
      `</div>${fieldDiffHtml(fields)}</td>` +
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
    html += `<div class="rd-hist-byrecord">`;
    const keys = Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    if (!keys.length) {
      html += `<p class="rd-empty">No changes were recorded for this view.</p>`;
    } else {
      keys.forEach(key => {
        const rows = map[key];
        const parts = recordParts(key);
        const editors = distinctEditors(rows);
        const last = rows[0];
        html += `<div class="rd-hist-recgroup">` +
          `<div class="rd-hist-recgroup__head">` +
          `<span class="rd-hist-recgroup__title">${esc(parts.type + ' · ' + parts.name)}</span>` +
          `<span class="rd-hist-recgroup__meta">${rows.length} change${rows.length === 1 ? '' : 's'} · ${esc(lastChangeLabel(last.row))} · ${esc(editorCountLabel(editors))}</span>` +
          `</div>`;
        rows.forEach(x => {
          const r = x.row;
          const fields = entryFields(r);
          const consequence = entryConsequence(r);
          const prior = fields.length ? (fields[0].from || fields.map(fl => fl.label).join(', ')) : '';
          const chip = consequence
            ? `<span class="rd-hist-chip rd-hist-chip--derived">${esc(consequence === '+1 cover' ? 'Derived +1' : consequence)}</span>`
            : `<span class="rd-hist-chip">Field</span>`;
          const when = (r.date === todayISO() ? 'Today ' : fmtDayShort(r.date) + ' ') + (r.time || '');
          html += `<div class="rd-hist-recrow" onclick="rdHistOpenEntry('${esc(r.id || ('h' + x.index))}')">` +
            `<div class="rd-hist-recrow__main"><div class="rd-hist-recrow__change">${esc(entryChange(r))}</div>` +
            `<div class="rd-hist-recrow__who">${esc(entryWho(r))}</div></div>` +
            `<div class="rd-hist-recrow__when">${esc(when.trim())}</div>` +
            `<div class="rd-hist-recrow__prior">${esc(prior ? (consequence || prior) : '—')}</div>` +
            `<div class="rd-hist-recrow__chip">${chip}</div>` +
            `</div>`;
        });
        html += `</div>`;
      });
    }
    html += `</div>` + explainerHtml();
    host.innerHTML = html;
  }

  function renderFieldDetail() {
    const host = document.getElementById('history-view-host');
    if (!host) return;
    const f = histFigures();
    const sel = ensureFieldSelection();
    let html = retentionCalloutHtml(f);
    if (!sel) {
      html += `<p class="rd-empty">No field-level changes in this view.</p>` + explainerHtml();
      host.innerHTML = html;
      return;
    }
    const timeline = fieldTimeline(sel.record, sel.field);
    const values = [];
    const seen = new Set();
    timeline.forEach(t => {
      const val = String(t.to || '').trim();
      if (!val || seen.has(val)) return;
      seen.add(val);
      values.push(t);
    });
    const current = timeline[0];
    const currentSince = current ? fmtDayShort(current.date) : '—';
    const downstream = timeline.filter(t => entryConsequence(t.row)).length;
    const openClash = timeline.some(t => entryConsequence(t.row) === 'created a clash');
    const editors = distinctEditors(timeline.map(t => ({ row: t.row })));
    const restoreTarget = current && current.from ? current.from : (values[1] ? values[1].to : '');
    html += `<div class="rd-hist-fieldstats">` +
      statCell('Field', sel.field) +
      statCell('Values held', String(values.length || timeline.length)) +
      statCell('Current since', currentSince) +
      statCell('Downstream effects', String(downstream), downstream ? 'rd-hist-stat--warn' : '') +
      statCell('Open clash', openClash ? 'Yes' : 'No', openClash ? 'rd-hist-stat--danger' : '') +
      `</div>`;
    html += `<div class="rd-hist-fieldlayout">` +
      `<div class="rd-hist-fieldlist">` +
      `<div class="rd-hist-fieldlist__head">` +
      `<div class="rd-hist-fieldlist__eyebrow">Field · ${esc(recordParts(sel.record).type)} · ${esc(recordParts(sel.record).name)} · ${esc(sel.field)}</div>` +
      `<div class="rd-hist-fieldlist__note">Every value this one field has held, newest first</div>` +
      `<div class="rd-hist-fieldlist__action">Restore a value</div>` +
      `</div>`;
    if (!timeline.length) {
      html += `<p class="rd-empty">No values recorded for this field.</p>`;
    } else {
      timeline.forEach((t, i) => {
        const isCurrent = i === 0;
        const note = isCurrent && t.consequence
          ? ('Current value · ' + (t.consequence === 'created a clash' ? 'created the clash with a linked appointment' : t.consequence))
          : (t.from ? ('was ' + t.from) : 'Set at change');
        html += `<div class="rd-hist-fieldval${isCurrent ? ' is-current' : ''}">` +
          `<div class="rd-hist-fieldval__value">${esc(t.to || '—')}</div>` +
          `<div class="rd-hist-fieldval__meta"><div>${esc(fmtDayShort(t.date) + (t.time ? ' · ' + t.time : '') + ' · ' + t.who)}</div>` +
          `<div class="rd-hist-fieldval__note">${esc(note)}</div></div>` +
          (t.undoable
            ? `<button type="button" class="rd-hist-fieldval__restore" onclick="event.stopPropagation();rdHistUndoEntry(${t.index})">Restore</button>`
            : `<span class="rd-hist-aged rd-hist-fieldval__restore">Unavailable</span>`) +
          `</div>`;
      });
    }
    html += `</div>`;
    const touches = fieldTouchRows(sel.field, current && current.consequence);
    html += `<aside class="rd-hist-fieldpanel">` +
      `<div class="rd-hist-fieldpanel__title">What this field touches</div>` +
      `<div class="rd-hist-fieldpanel__list">` +
      touches.map(([name, effect]) =>
        `<div><span>${esc(name)}</span><span class="rd-hist-fieldpanel__effect${/fail|over|\+1|−1|clash/i.test(effect) ? ' is-warn' : ''}">${esc(effect)}</span></div>`
      ).join('') +
      `</div>` +
      `<div class="rd-hist-fieldpanel__callout">${esc(fieldRestoreNote(sel.field, restoreTarget, current && current.consequence))}</div>` +
      `<div class="rd-hist-fieldpanel__title">Field facts</div>` +
      `<div class="rd-hist-fieldpanel__facts">` +
      `<div><span>Type</span><span>${esc(/time|date/.test(sel.field) ? 'Time range' : 'Text')}</span></div>` +
      `<div><span>Times changed</span><span>${timeline.length}</span></div>` +
      `<div><span>Editors</span><span>${editors <= 1 ? esc(timeline[0] ? entryWho(timeline[0].row) + ' only' : '—') : editors + ' people'}</span></div>` +
      `<div><span>Derived from</span><span>Typed</span></div>` +
      `</div></aside></div>`;
    html += explainerHtml();
    host.innerHTML = html;
  }

  function statCell(label, value, extraClass) {
    return `<div class="rd-hist-fieldstats__cell${extraClass ? ' ' + extraClass : ''}">` +
      `<div class="rd-hist-fieldstats__k">${esc(label)}</div>` +
      `<div class="rd-hist-fieldstats__v">${esc(value)}</div>` +
      (label === 'Open clash' && value === 'Yes' ? `<div class="rd-hist-fieldstats__sub">clears if restored</div>` : '') +
      `</div>`;
  }

  function renderView() {
    const mode = window._histMode || 'day';
    if (mode === 'record') renderByRecord();
    else if (mode === 'fields') renderFieldDetail();
    else renderByDay();
  }

  function rdSetHistoryView(mode) {
    window._histMode = PAGE_VIEWS.some(([id]) => id === mode) ? mode : 'day';
    if (window._histMode === 'fields') ensureFieldSelection();
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

  function rdHistCycleFieldFilter(which) {
    const catalog = fieldCatalog();
    if (!catalog.length) return;
    if (which === 'record') {
      const records = [...new Set(catalog.map(c => c.record))];
      const i = Math.max(0, records.indexOf(window._histFieldRecord));
      window._histFieldRecord = records[(i + 1) % records.length];
      const fields = catalog.filter(c => c.record === window._histFieldRecord).map(c => c.field);
      if (!fields.includes(window._histFieldName)) window._histFieldName = fields[0] || '';
    } else {
      const fields = catalog.filter(c => c.record === window._histFieldRecord).map(c => c.field);
      if (!fields.length) return;
      const i = Math.max(0, fields.indexOf(window._histFieldName));
      window._histFieldName = fields[(i + 1) % fields.length];
    }
    renderToolbar();
    renderView();
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
  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      (document.getElementById('layout') || document.body).appendChild(shared);
    }
  }
  const BUCKET_PANEL = { guests: 'guests', budget: 'budget', tasks: 'tasks', vendors: 'vendors', tables: 'tables', other: 'dashboard' };

  function renderHistDrawer() {
    const slot = document.getElementById('history-drawer-slot');
    if (!slot) return;
    const d = ensureData();
    markUndoability();
    const item = d._historyLog.find(r => (r.id || '') === window._histDrawerId);
    if (!item) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    parkSharedDrawerAway(slot);
    const idx = d._historyLog.indexOf(item);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._histDrawerTab, 10) || 0));
    const fields = entryFields(item);
    const consequence = entryConsequence(item);
    const panel = BUCKET_PANEL[recordBucket(item)] || 'dashboard';
    const depth = (item.undoRank || 0) + 1;
    let body = '';
    if (tab === 0) {
      body =
        `<div class="rd-drawer__field"><span>Change</span><strong>${esc(entryChange(item))}</strong></div>` +
        `<div class="rd-drawer__field"><span>When</span><strong>${esc((item.date || '') + (item.time ? ' · ' + item.time : ''))}</strong></div>` +
        (consequence ? `<div class="rd-drawer__field"><span>Downstream effect</span><strong><span class="rd-hist-conseq">${esc(consequence)}</span></strong></div>` : '') +
        (fields.length ? `<div class="rd-drawer__section-title">Fields</div>` + fields.map(fl =>
          `<div class="rd-hist-drawer__field"><b>${esc(fl.label)}</b><span>${esc(fl.from || '—')}</span><span class="rd-hist-diff__arrow">→</span><span>${esc(fl.to || '—')}</span></div>`
        ).join('') : `<p class="rd-drawer__note">${esc(item.details || 'No field diff captured.')}</p>`) +
        `<p class="rd-drawer__note">Three edits in three seconds are one entry. Changes are grouped by time, because intent cannot be known.</p>`;
    } else if (tab === 1) {
      body =
        `<div class="rd-drawer__field"><span>Record</span><strong>${esc(entryRecord(item))}</strong></div>` +
        `<div class="rd-drawer__field"><span>Edited by</span><strong>${esc(entryWho(item))}</strong></div>` +
        `<div class="rd-drawer__field"><span>Area</span><strong>${esc((RECORD_FILTERS.find(f => f.id === recordBucket(item)) || {}).label || 'Everything else')}</strong></div>` +
        `<p class="rd-drawer__note">The entry names the record rather than copying it — so it survives the record being deleted.</p>` +
        `<button type="button" class="rd-btn" onclick="rdHistCloseDrawer();typeof showPanel==='function'&&showPanel('${panel}',true)">Open the record →</button>`;
    } else {
      body =
        `<div class="rd-drawer__field"><span>Undo state</span><strong>${item.undoable ? 'Available' : (item.hasSnapshot ? 'Snapshot aged out' : 'Nothing to undo')}</strong></div>` +
        (item.undoable ? `<div class="rd-drawer__field"><span>Rolls back</span><strong>${depth} change${depth === 1 ? '' : 's'}</strong></div>` : '') +
        `<p class="rd-drawer__note">Undo is not per-field. It rolls the whole planner back to this snapshot, and moves everything changed since — not this row alone.</p>` +
        (item.undoable
          ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHistUndoEntry(${idx})">Undo to this change</button>`
          : `<span class="rd-hist-aged">Only the last ${snapLimit()} snapshots are kept.</span>`);
    }
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hist-drawer" aria-label="History entry">` +
      `<div class="rd-drawer__head">` +
      `<button type="button" class="rd-drawer__close" onclick="rdHistCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__eyebrow">History entry</div>` +
      `<h2 class="rd-drawer__title">${esc(entryChange(item))}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${item.undoable ? 'green' : 'muted'}">${item.undoable ? 'Undoable' : 'Read-only'}</span>` +
      (consequence ? `<span class="status-pill" data-pillscheme="gold">${esc(consequence)}</span>` : '') +
      `</div>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdHistSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn" onclick="rdHistCloseDrawer()">Close</button>` +
      `<button type="button" class="rd-btn" onclick="rdHistExport()">Export the log</button>` +
      `</div></aside>`;
  }

  function rdHistOpenEntry(id) {
    window._histDrawerId = id;
    window._histDrawerTab = 0;
    renderView();
    renderHistDrawer();
  }
  function rdHistCloseDrawer() {
    window._histDrawerId = null;
    const slot = document.getElementById('history-drawer-slot');
    if (slot) { parkSharedDrawerAway(slot); slot.innerHTML = ''; slot.classList.remove('is-open'); }
    renderView();
  }
  function rdHistSetDrawerTab(i) { window._histDrawerTab = i; renderHistDrawer(); }

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
    renderHistDrawer();
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
  window.histJumpDates = histJumpDates;
  window.rdHistCycleFilter = rdHistCycleFilter;
  window.rdHistCycleFieldFilter = rdHistCycleFieldFilter;
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
  window.rdHistCloseDrawer = rdHistCloseDrawer;
  window.rdHistSetDrawerTab = rdHistSetDrawerTab;
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
