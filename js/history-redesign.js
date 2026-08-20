/* Planner History — All.dc 18b + Views 31i/31j + Drawers batch
   (Change · Record · Snapshot).
   Untabbed. Three views share one shell:
     Log         — data._historyLog, one row per saved change, filterable by day.
     By record   — data._recordHistory grouped by entity+id, newest activity first.
     Field detail — every value one field on one record has held, newest first.
   Stat strip: Saved changes · Selected day · Undo steps · Redo steps. The four
   stat ids and the Undo/Redo buttons keep their legacy ids (`history-stat-*`,
   `history-undo-btn`, `history-redo-btn`) so updateHistoryControls() — called
   from dozens of places whenever data changes — keeps them live without any
   changes to planner.js's undo/redo/save code. */
(function () {
  'use strict';

  window._histView = window._histView || 'log';
  window._histRailCat = window._histRailCat || 'all';
  window._histDrawer = window._histDrawer || null;   /* {kind:'log', id} | {kind:'record', bucket, entryIndex, field} */
  window._histDrawerTab = window._histDrawerTab || 0;
  window._histRecordBucket = window._histRecordBucket || null;
  window._histFieldKey = window._histFieldKey || null;

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  /* ── entity + rail category maps ────────────────────────────────────────── */

  const ENTITY_META = {
    guests: { label: 'Guest', plural: 'Guest List', panel: 'guests', category: 'guests' },
    tasks: { label: 'Task', plural: 'Planning Timeline', panel: 'tasks', category: 'tasks' },
    vendors: { label: 'Vendor', plural: 'Venue & Vendors', panel: 'vendors', category: 'vendors' },
    budget: { label: 'Budget line', plural: 'Budget', panel: 'budget', category: 'budget' },
    payments: { label: 'Payment', plural: 'Payments', panel: 'payments', category: 'budget' },
    party: { label: 'Wedding party member', plural: 'Wedding Party', panel: 'party', category: null },
    tables: { label: 'Table', plural: 'Table Layout', panel: 'tables', category: null },
    gifts: { label: 'Gift', plural: 'Gift Log', panel: 'gifts', category: null },
    contracts: { label: 'Contract', plural: 'Contracts, Invoices & Rentals', panel: 'contracts', category: null },
    appointments: { label: 'Appointment', plural: 'Appointments', panel: 'appointments', category: null },
    calendarEvents: { label: 'Calendar event', plural: 'Smart Calendar', panel: 'calendar', category: null },
    notesDetails: { label: 'Note', plural: 'Notes', panel: 'notes', category: null },
    vtimeline: { label: 'Arrival', plural: 'Vendor Arrival Timeline', panel: 'venue', category: 'vendors' }
  };
  function entityMeta(entity) {
    return ENTITY_META[entity] || {
      label: (typeof historySectionLabel === 'function' ? historySectionLabel(entity) : entity),
      plural: (typeof historySectionLabel === 'function' ? historySectionLabel(entity) : entity),
      panel: entity, category: null
    };
  }

  const RAIL_CATEGORIES = [
    { id: 'all', label: 'Everything', logSources: null, entities: null },
    { id: 'guests', label: 'Guests', logSources: ['Guest List'], entities: ['guests'] },
    { id: 'budget', label: 'Budget & payments', logSources: ['Budget', 'Payments'], entities: ['budget', 'payments'] },
    { id: 'tasks', label: 'Tasks', logSources: ['Planning Timeline'], entities: ['tasks'] },
    { id: 'vendors', label: 'Vendors', logSources: ['Venue & Vendors'], entities: ['vendors', 'vtimeline'] }
  ];
  function railCategory(id) { return RAIL_CATEGORIES.find(c => c.id === id) || RAIL_CATEGORIES[0]; }
  function logMatchesCategory(item, catId) {
    const cat = railCategory(catId);
    if (!cat.logSources) return true;
    return cat.logSources.indexOf(item.source) !== -1;
  }
  function entityMatchesCategory(entity, catId) {
    const cat = railCategory(catId);
    if (!cat.entities) return true;
    return cat.entities.indexOf(entity) !== -1;
  }

  const SOURCE_LABEL_TO_PANEL = {
    'Get Started': 'instructions', 'FAQ': 'faq', 'Planner History': 'history', 'Dashboard': 'dashboard',
    'Wedding Setup': 'setup', 'Database Hub': 'data-hub', 'Budget': 'budget', 'Payments': 'payments',
    'Venue & Vendors': 'vendors', 'Guest List': 'guests', 'Planning Timeline': 'tasks', 'Smart Calendar': 'calendar',
    'Appointments': 'appointments', 'Notes': 'notes', 'Contracts, Invoices & Rentals': 'contracts',
    'Catering & Menu': 'catering', 'Wedding Party': 'party', 'Table Layout': 'tables',
    'Ceremony & Reception': 'ceremony', 'Wedding Day Timeline': 'timeline', 'Music & Speeches': 'entertainment',
    'Photo & Video Shot Lists': 'shotlist', 'Vision Board': 'mood', 'Essentials Checklist': 'essentials',
    'Gift Log': 'gifts', 'Honeymoon & After': 'honeymoon', 'Prayer Journal': 'prayer', 'Premarital Counseling': 'counseling'
  };

  function ensureHistoryData() {
    if (typeof normalizeHistoryState === 'function') normalizeHistoryState();
    if (!window.data) window.data = {};
    if (!Array.isArray(data._historyLog)) data._historyLog = [];
    if (!Array.isArray(data._undoSnapshots)) data._undoSnapshots = [];
    if (!Array.isArray(data._redoSnapshots)) data._redoSnapshots = [];
    if (!data._historyPrefs || typeof data._historyPrefs !== 'object') data._historyPrefs = {};
    if (!data._recordHistory || typeof data._recordHistory !== 'object') data._recordHistory = {};
    return data;
  }

  function relTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) {
      const h = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return 'today ' + h;
    }
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function historyTodayISOSafe() {
    return typeof historyTodayISO === 'function' ? historyTodayISO() : new Date().toISOString().slice(0, 10);
  }

  /* ── shell ───────────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHistPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print log</button>'
      + '<button type="button" class="rd-btn" onclick="rdHistExport()">Export</button>';
  }

  function viewSwitchHtml() {
    const views = [['log', 'Log'], ['record', 'By record'], ['field', 'Field detail']];
    return '<div class="rd-viewswitch" role="tablist" aria-label="Planner History view">'
      + views.map(([id, label]) =>
        `<button type="button" class="rd-viewswitch__item${window._histView === id ? ' is-active' : ''}" onclick="rdHistSetView('${id}')">${esc(label)}</button>`
      ).join('')
      + '</div>';
  }

  function toolbarHtml() {
    ensureHistoryData();
    const dateBit = window._histView === 'log'
      ? `<label class="rd-hist-datefield">Date to review
          <input id="history-date-filter" type="date" value="${esc(data._historyPrefs.selectedDate || historyTodayISOSafe())}" onchange="rdHistDateChanged(this.value)">
        </label>`
      : `<div class="rd-hist-help">${window._histView === 'record'
          ? 'Grouped by the record each change touched — click a record to see one field&rsquo;s full history.'
          : 'Every value one field has held on one record, newest first.'}</div>`;
    return '<section class="rd-toolbar">'
      + dateBit
      + '<div class="rd-toolbar__right" style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
      + viewSwitchHtml()
      + '<button class="rd-btn" onclick="undoPlannerChange()" id="history-undo-btn" disabled>Undo</button>'
      + '<button class="rd-btn" onclick="redoPlannerChange()" id="history-redo-btn" disabled>Redo</button>'
      + '<button class="rd-btn rd-btn--danger" onclick="clearPlannerHistory()">Clear history</button>'
      + '</div></section>';
  }

  function uedHistoryShellRd() {
    const panel = document.getElementById('panel-history');
    if (!panel) return;
    panel.classList.add('ued-scope', 'history-page');
    if (panel.dataset.uedShell === 'history-rd18b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      const toolbar = panel.querySelector('.rd-toolbar');
      if (toolbar) toolbar.outerHTML = toolbarHtml();
      return;
    }
    panel.dataset.uedShell = 'history-rd18b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">History</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Planner History</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats" id="history-stats" aria-label="Planner History summary">
        <div class="rd-stat"><div class="rd-stat__label">Saved changes</div><div class="rd-stat__value" id="history-stat-total">0</div><div class="rd-stat__note">Recorded entries</div></div>
        <div class="rd-stat"><div class="rd-stat__label">Selected day</div><div class="rd-stat__value" id="history-stat-day">0</div><div class="rd-stat__note">Changes that day</div></div>
        <div class="rd-stat"><div class="rd-stat__label">Undo steps</div><div class="rd-stat__value" id="history-stat-undo">0</div><div class="rd-stat__note">Available</div></div>
        <div class="rd-stat"><div class="rd-stat__label">Redo steps</div><div class="rd-stat__value" id="history-stat-redo">0</div><div class="rd-stat__note">Available</div></div>
      </div>
      ${toolbarHtml()}
      <div class="rd-page__surface">
        <div class="rd-page__work" id="history-surface-body"></div>
        <div id="history-drawer-slot"></div>
      </div>
    </div>`;
  }

  /* ── Log view ────────────────────────────────────────────────────────────── */

  function renderLogViewRd(host) {
    ensureHistoryData();
    const selectedDate = data._historyPrefs.selectedDate || historyTodayISOSafe();
    data._historyPrefs.selectedDate = selectedDate;
    const rows = data._historyLog
      .filter(item => item.date === selectedDate)
      .filter(item => logMatchesCategory(item, window._histRailCat));
    const dayStat = document.getElementById('history-stat-day');
    if (dayStat) dayStat.textContent = rows.length;
    host.innerHTML = `<div class="rd-table-wrap"><table class="rd-table">
      <thead><tr><th>Time</th><th>Page / Source</th><th>Action</th><th>Details</th></tr></thead>
      <tbody id="history-log-body">${rows.length ? rows.map(item => `<tr onclick="rdHistOpenLogDrawer('${esc(item.id)}')" style="cursor:pointer">
        <td>${esc(item.time || '')}</td>
        <td>${esc(item.source || 'Planner')}</td>
        <td><span class="status-pill">${esc(item.action || 'Updated Planner')}</span></td>
        <td>${esc(item.details || '')}</td>
      </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:28px 12px">No changes were recorded for this date${window._histRailCat !== 'all' ? ' in ' + esc(railCategory(window._histRailCat).label) : ''}.</td></tr>`}</tbody>
    </table></div>`;
  }

  /* ── By record view ──────────────────────────────────────────────────────── */

  function recordBuckets() {
    ensureHistoryData();
    const store = data._recordHistory;
    return Object.keys(store).map(bucket => {
      const idx = bucket.lastIndexOf(':');
      const entity = idx === -1 ? bucket : bucket.slice(0, idx);
      const id = idx === -1 ? '' : bucket.slice(idx + 1);
      const entries = Array.isArray(store[bucket]) ? store[bucket] : [];
      if (!entries.length) return null;
      const record = typeof findRecordById === 'function' ? findRecordById(entity, id) : null;
      const displayName = record
        ? (typeof relationshipDisplay === 'function' ? relationshipDisplay(record, 'Untitled') : (record.name || id))
        : 'Deleted record';
      return { bucket, entity, id, entries, record, displayName, lastIso: entries[0]?.iso || '' };
    }).filter(Boolean)
      .filter(b => entityMatchesCategory(b.entity, window._histRailCat))
      .sort((a, b) => new Date(b.lastIso) - new Date(a.lastIso));
  }

  function renderRecordViewRd(host) {
    const buckets = recordBuckets();
    if (!buckets.length) {
      host.innerHTML = `<div class="rd-page__work" style="padding:36px 24px;text-align:center;color:var(--text-muted)">No per-record edits recorded yet${window._histRailCat !== 'all' ? ' for ' + esc(railCategory(window._histRailCat).label) : ''}. Editing a guest, task, vendor, or payment records field-level history here.</div>`;
      return;
    }
    host.innerHTML = '<div class="rd-grouplist">' + buckets.map(b => {
      const meta = entityMeta(b.entity);
      const editors = 'You';
      const rows = b.entries.map((entry, entryIndex) => ({ entry, entryIndex })).slice(0, 6).map(({ entry, entryIndex }) => {
        const changes = entry.changes && entry.changes.length ? entry.changes : [{ field: '', label: entry.action, from: '', to: '' }];
        return changes.slice(0, 3).map(change => {
          const headline = change.label
            ? `${esc(change.label)} ${entry.action === 'Created' ? 'set at creation' : 'changed'}${change.to && change.to !== '—' ? ' to ' + esc(change.to) : ''}`
            : esc(entry.action + ' record');
          return `<div class="rd-grouplist__row" onclick="rdHistOpenRecordDrawer('${esc(b.bucket)}',${entryIndex},'${esc(change.field || '')}')" style="cursor:pointer">
            <div><div>${headline}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">${esc(editors)} · ${esc(entry.date || '')} ${esc(entry.time || '')}</div></div>
            <div style="text-align:right;font-size:12px;color:var(--text-muted)">${change.from && change.from !== '—' ? 'was ' + esc(change.from) : ''}</div>
          </div>`;
        }).join('');
      }).join('');
      return `<div class="rd-grouplist__group">
        <div class="rd-grouplist__head">
          <span>${esc(meta.label)} · ${esc(b.displayName)}</span>
          <span class="rd-grouplist__count">${b.entries.length} change${b.entries.length === 1 ? '' : 's'} · last ${relTime(b.lastIso)}</span>
          <button type="button" class="rd-btn--quiet rd-btn" style="margin-left:12px;height:24px;padding:0 8px;font-size:12px" onclick="event.stopPropagation();rdHistViewFieldDetail('${esc(b.bucket)}')">Field detail →</button>
        </div>
        <div class="rd-grouplist__rows">${rows}</div>
      </div>`;
    }).join('') + '</div>';
  }

  /* ── Field detail view ───────────────────────────────────────────────────── */

  function fieldsForBucket(bucket) {
    const store = ensureHistoryData()._recordHistory;
    const entries = Array.isArray(store[bucket]) ? store[bucket] : [];
    const seen = new Map();
    entries.forEach(entry => (entry.changes || []).forEach(change => {
      if (!change.field) return;
      if (!seen.has(change.field)) seen.set(change.field, { field: change.field, label: change.label, count: 0, lastIso: entry.iso });
      seen.get(change.field).count++;
    }));
    return Array.from(seen.values());
  }

  function renderFieldViewRd(host) {
    const bucket = window._histRecordBucket;
    if (!bucket || !ensureHistoryData()._recordHistory[bucket]) {
      const buckets = recordBuckets();
      host.innerHTML = buckets.length
        ? `<div class="rd-splitdetail" style="grid-template-columns:1fr">
             <div class="rd-splitdetail__list">
               <div class="rd-section__head">Choose a record to see one field&rsquo;s full history</div>
               ${buckets.map(b => `<div class="rd-grouplist__row" onclick="rdHistViewFieldDetail('${esc(b.bucket)}')" style="cursor:pointer">
                 <div>${esc(entityMeta(b.entity).label)} · ${esc(b.displayName)}</div>
                 <div style="color:var(--text-muted);font-size:12px">${b.entries.length} change${b.entries.length === 1 ? '' : 's'} · last ${relTime(b.lastIso)}</div>
               </div>`).join('')}
             </div>
           </div>`
        : `<div style="padding:36px 24px;text-align:center;color:var(--text-muted)">No per-record history yet. Field detail needs at least one edited guest, task, vendor, or payment.</div>`;
      return;
    }
    const idx = bucket.lastIndexOf(':');
    const entity = idx === -1 ? bucket : bucket.slice(0, idx);
    const id = idx === -1 ? '' : bucket.slice(idx + 1);
    const meta = entityMeta(entity);
    const record = typeof findRecordById === 'function' ? findRecordById(entity, id) : null;
    const displayName = record
      ? (typeof relationshipDisplay === 'function' ? relationshipDisplay(record, 'Untitled') : id)
      : 'Deleted record';
    const fields = fieldsForBucket(bucket);
    if (!fields.length) {
      host.innerHTML = `<div style="padding:36px 24px;text-align:center;color:var(--text-muted)">No field-level changes recorded for ${esc(displayName)} yet.</div>`;
      return;
    }
    if (!window._histFieldKey || !fields.some(f => f.field === window._histFieldKey)) {
      window._histFieldKey = fields.slice().sort((a, b) => new Date(b.lastIso) - new Date(a.lastIso))[0].field;
    }
    const fieldKey = window._histFieldKey;
    const entries = data._recordHistory[bucket] || [];
    const transitions = [];
    entries.forEach((entry, entryIndex) => {
      const change = (entry.changes || []).find(c => c.field === fieldKey);
      if (change) transitions.push({ entry, entryIndex, change });
    });

    const listHtml = fields.map(f => `<button type="button" class="rd-rail__item${f.field === fieldKey ? ' is-active' : ''}" style="display:flex;width:100%;text-align:left" onclick="rdHistSetField('${esc(f.field)}')">${esc(f.label)}<span class="rd-rail__count">${f.count}</span></button>`).join('');

    const detailRows = transitions.map((t, i) => {
      const isCurrent = i === 0;
      return `<div style="display:flex;gap:16px;padding:13px 20px;border-bottom:1px solid var(--border-hairline);cursor:pointer" onclick="rdHistOpenRecordDrawer('${esc(bucket)}',${t.entryIndex},'${esc(fieldKey)}')" role="button" tabindex="0">
        <div style="flex:0 0 130px;font:600 15px/1.3 var(--font-ui);color:${isCurrent ? 'var(--forest)' : 'var(--text-heading)'}">${esc(t.change.to)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--text-muted)">${esc(t.entry.date || '')} ${esc(t.entry.time || '')} · You</div>
          <div style="font-size:13px;color:var(--text-body);margin-top:3px">${isCurrent ? 'Current value' : ''}${t.change.from && t.change.from !== '—' ? (isCurrent ? ' · ' : '') + 'was ' + esc(t.change.from) : (isCurrent ? '' : 'Set at creation')}</div>
        </div>
      </div>`;
    }).join('');

    host.innerHTML = `<div class="rd-splitdetail">
      <div class="rd-splitdetail__list">
        <div class="rd-section__head" style="flex-direction:column;align-items:flex-start;gap:4px">
          <span>${esc(meta.label)} · ${esc(displayName)}</span>
          <button type="button" class="rd-btn--quiet rd-btn" style="height:22px;padding:0" onclick="rdHistBackToRecords()">← All records</button>
        </div>
        <div class="rd-rail__list">${listHtml}</div>
      </div>
      <div class="rd-splitdetail__detail" style="padding:0">
        <div style="display:flex;align-items:baseline;gap:12px;padding:13px 20px;border-bottom:1px solid var(--border-subtle)">
          <div class="rd-panel__eyebrow">Field · ${esc(meta.label)} · ${esc(displayName)} · ${esc((fields.find(f => f.field === fieldKey) || {}).label || fieldKey)}</div>
          <div style="margin-left:auto;font-size:12px;color:var(--text-muted)">Every value this field has held, newest first</div>
        </div>
        ${detailRows || '<div style="padding:20px;color:var(--text-muted)">No history for this field.</div>'}
      </div>
    </div>`;
  }

  /* ── drawer: Change · Record · Snapshot ─────────────────────────────────── */

  const DRAWER_TABS = ['Change', 'Record', 'Snapshot'];

  function drawerFrame(eyebrow, title, body) {
    return `<aside class="rd-drawer rd-hist-drawer" aria-label="History entry">
      <div class="rd-drawer__head">
        <div class="rd-drawer__eyebrow">${esc(eyebrow)}</div>
        <h2 class="rd-drawer__title">${esc(title)}</h2>
        <button type="button" class="rd-drawer__close" onclick="rdHistCloseDrawer()" aria-label="Close">×</button>
        <div class="rd-drawer__tabs" role="tablist">
          ${DRAWER_TABS.map((label, i) => `<button type="button" class="rd-drawer__tab${i === window._histDrawerTab ? ' is-active' : ''}" onclick="rdHistSetDrawerTab(${i})">${esc(label)}</button>`).join('')}
        </div>
      </div>
      <div class="rd-drawer__body">${body}</div>
      <div class="rd-drawer__foot">
        <button type="button" class="rd-btn" onclick="rdHistCloseDrawer()">Close</button>
      </div>
    </aside>`;
  }

  function renderLogDrawer(id) {
    ensureHistoryData();
    const index = data._historyLog.findIndex(e => e.id === id);
    const entry = index !== -1 ? data._historyLog[index] : null;
    if (!entry) { window._histDrawer = null; return ''; }
    const tab = window._histDrawerTab;
    let body = '';
    if (tab === 0) {
      const parts = String(entry.details || '').split('; ').filter(Boolean);
      body = `<div class="rd-drawer__field"><span>Action</span><strong>${esc(entry.action || 'Updated Planner')}</strong></div>`
        + `<div class="rd-drawer__field"><span>When</span><strong>${esc(entry.date || '')} · ${esc(entry.time || '')}</strong></div>`
        + `<div class="rd-drawer__field"><span>Actor</span><strong>You</strong></div>`
        + `<div class="rd-drawer__section-title">What changed${parts.length > 1 ? ' (' + parts.length + ' items)' : ''}</div>`
        + (parts.length ? parts.map(p => `<div class="rd-drawer__field"><span>·</span><strong>${esc(p)}</strong></div>`).join('') : '<p class="rd-drawer__note">No further detail was recorded for this change.</p>');
    } else if (tab === 1) {
      const panelId = SOURCE_LABEL_TO_PANEL[entry.source];
      body = `<div class="rd-drawer__field"><span>Page / source</span><strong>${esc(entry.source || 'Planner')}</strong></div>`
        + `<p class="rd-drawer__note">Planner History logs changes at the page level, not by individual record — this entry may cover more than one field on ${esc(entry.source || 'this page')}.</p>`
        + (panelId ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHistCloseDrawer();showPanel('${esc(panelId)}',true)">Open ${esc(entry.source)} →</button>` : '');
    } else {
      const undoCount = data._undoSnapshots.length;
      const redoCount = data._redoSnapshots.length;
      body = index === 0
        ? `<div class="rd-drawer__field"><span>Undo consequence</span><strong>Restores the planner to just before this change</strong></div>`
          + `<p class="rd-drawer__note">This is the most recent saved change — pressing Undo once reverses it.</p>`
        : `<div class="rd-drawer__field"><span>Undo consequence</span><strong>${index + 1} steps back</strong></div>`
          + `<p class="rd-drawer__note">Undo moves backward one saved change at a time. Reaching the moment before this change takes ${index + 1} presses of Undo, reversing every change made after it too.</p>`;
      body += `<div class="rd-drawer__field"><span>Undo steps available</span><strong>${undoCount}</strong></div>`
        + `<div class="rd-drawer__field"><span>Redo steps available</span><strong>${redoCount}</strong></div>`;
    }
    return drawerFrame('Change · ' + (entry.source || 'Planner').toLowerCase(), entry.action || 'Planner change', body);
  }

  function renderRecordDrawer(bucket, entryIndex, field) {
    const store = ensureHistoryData()._recordHistory;
    const entries = store[bucket] || [];
    const entry = entries[entryIndex];
    if (!entry) { window._histDrawer = null; return ''; }
    const idx = bucket.lastIndexOf(':');
    const entity = idx === -1 ? bucket : bucket.slice(0, idx);
    const id = idx === -1 ? '' : bucket.slice(idx + 1);
    const meta = entityMeta(entity);
    const record = typeof findRecordById === 'function' ? findRecordById(entity, id) : null;
    const displayName = record
      ? (typeof relationshipDisplay === 'function' ? relationshipDisplay(record, 'Untitled') : id)
      : 'Deleted record';
    const change = field ? (entry.changes || []).find(c => c.field === field) : null;
    const tab = window._histDrawerTab;
    let body = '';
    if (tab === 0) {
      if (change) {
        body = `<div class="rd-drawer__field"><span>Field</span><strong>${esc(change.label)}</strong></div>`
          + `<div class="rd-drawer__field"><span>Changed to</span><strong>${esc(change.to)}</strong></div>`
          + `<div class="rd-drawer__field"><span>Previous value</span><strong>${esc(change.from)}</strong></div>`
          + `<div class="rd-drawer__field"><span>When</span><strong>${esc(entry.date || '')} · ${esc(entry.time || '')}</strong></div>`
          + `<div class="rd-drawer__field"><span>Actor</span><strong>You</strong></div>`;
      } else {
        const changes = entry.changes || [];
        body = `<div class="rd-drawer__field"><span>Action</span><strong>${esc(entry.action)}</strong></div>`
          + `<div class="rd-drawer__field"><span>When</span><strong>${esc(entry.date || '')} · ${esc(entry.time || '')}</strong></div>`
          + `<div class="rd-drawer__section-title">Fields touched (${changes.length})</div>`
          + (changes.length ? changes.map(c => `<div class="rd-drawer__field"><span>${esc(c.label)}</span><strong>${esc(c.from)} → ${esc(c.to)}</strong></div>`).join('') : '<p class="rd-drawer__note">This created the record — nothing existed to compare against.</p>');
      }
    } else if (tab === 1) {
      const openIdx = record && Array.isArray(data[entity]) ? data[entity].findIndex(r => String((typeof recordIdentity === 'function' ? recordIdentity(r) : r._id || r.id)) === String(id)) : -1;
      body = `<div class="rd-drawer__field"><span>Record type</span><strong>${esc(meta.label)}</strong></div>`
        + `<div class="rd-drawer__field"><span>Record</span><strong>${esc(displayName)}</strong></div>`
        + (openIdx > -1
          ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHistCloseDrawer();showPanel('${esc(meta.panel)}',true);if(typeof openRecordEditor==='function')openRecordEditor('${esc(entity)}',${openIdx});">Open this ${esc(meta.label.toLowerCase())} →</button>`
          : `<p class="rd-drawer__note">This record has since been deleted or moved — its field history is kept here for reference only.</p>`);
    } else {
      body = `<div class="rd-drawer__field"><span>Reversible?</span><strong>Not directly</strong></div>`
        + `<p class="rd-drawer__note">Field history is a read-only note, separate from Undo/Redo. Undo reverses the whole planner one saved change at a time; it does not target a single field.</p>`
        + (change ? `<p class="rd-drawer__note">Setting ${esc(change.label.toLowerCase())} back to <strong>${esc(change.from)}</strong> would change only this one field on this ${esc(meta.label.toLowerCase())} — nothing else in the planner is affected.</p>`
          + `<button type="button" class="rd-btn" onclick="rdHistCopyValue('${esc(String(change.from == null ? '' : change.from).replace(/'/g, "\\'"))}')">Copy previous value</button>` : '');
    }
    const eyebrow = 'Change · ' + meta.label.toLowerCase();
    const title = change ? change.label : (entry.action + ' · ' + displayName);
    return drawerFrame(eyebrow, title, body);
  }

  function renderHistoryDrawerRd() {
    const slot = document.getElementById('history-drawer-slot');
    if (!slot) return;
    const d = window._histDrawer;
    if (!d) { slot.innerHTML = ''; slot.classList.remove('is-open'); return; }
    let html = '';
    if (d.kind === 'log') html = renderLogDrawer(d.id);
    else if (d.kind === 'record') html = renderRecordDrawer(d.bucket, d.entryIndex, d.field);
    if (!html) { slot.innerHTML = ''; slot.classList.remove('is-open'); return; }
    slot.classList.add('is-open');
    slot.innerHTML = html;
  }

  /* ── actions ─────────────────────────────────────────────────────────────── */

  function rdHistSetView(view) {
    window._histView = view;
    window._histDrawer = null;
    renderHistoryRd();
  }
  function rdHistDateChanged(v) {
    ensureHistoryData();
    data._historyPrefs.selectedDate = v;
    renderHistoryRd();
  }
  function rdHistOpenLogDrawer(id) {
    window._histDrawer = { kind: 'log', id };
    window._histDrawerTab = 0;
    renderHistoryDrawerRd();
  }
  function rdHistOpenRecordDrawer(bucket, entryIndex, field) {
    window._histDrawer = { kind: 'record', bucket, entryIndex, field: field || null };
    window._histDrawerTab = 0;
    renderHistoryDrawerRd();
  }
  function rdHistCloseDrawer() {
    window._histDrawer = null;
    renderHistoryDrawerRd();
  }
  function rdHistSetDrawerTab(i) {
    window._histDrawerTab = i;
    renderHistoryDrawerRd();
  }
  function rdHistViewFieldDetail(bucket) {
    window._histRecordBucket = bucket;
    window._histFieldKey = null;
    window._histView = 'field';
    renderHistoryRd();
  }
  function rdHistSetField(field) {
    window._histFieldKey = field;
    renderHistoryRd();
  }
  function rdHistBackToRecords() {
    window._histRecordBucket = null;
    window._histFieldKey = null;
    window._histView = 'record';
    renderHistoryRd();
  }
  function rdHistCopyValue(value) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value || '');
      if (typeof showToast === 'function') showToast('Value copied.', 'ok');
    } catch (e) { /* soft */ }
  }
  function rdHistPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdHistExport() {
    ensureHistoryData();
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Planner History', data._historyLog, ['date', 'time', 'source', 'action', 'details']);
    } else if (typeof showToast === 'function') {
      showToast('Export is unavailable right now.', 'warn');
    }
  }
  function applyHistoryRailFilter(catId) {
    window._histRailCat = catId || 'all';
    window._histDrawer = null;
    renderHistoryRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('history');
  }

  /* ── main ────────────────────────────────────────────────────────────────── */

  function renderHistoryRd() {
    ensureHistoryData();
    uedHistoryShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('history');

    const host = document.getElementById('history-surface-body');
    if (host) {
      if (window._histView === 'record') renderRecordViewRd(host);
      else if (window._histView === 'field') renderFieldViewRd(host);
      else renderLogViewRd(host);
    }
    renderHistoryDrawerRd();
    if (typeof updateHistoryControls === 'function') updateHistoryControls();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'history'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('history');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('history');
  }

  window.uedHistoryShell = uedHistoryShellRd;
  window.renderHistoryRd = renderHistoryRd;
  window.renderHistoryPage = renderHistoryRd;
  window.rdHistSetView = rdHistSetView;
  window.rdHistDateChanged = rdHistDateChanged;
  window.rdHistOpenLogDrawer = rdHistOpenLogDrawer;
  window.rdHistOpenRecordDrawer = rdHistOpenRecordDrawer;
  window.rdHistCloseDrawer = rdHistCloseDrawer;
  window.rdHistSetDrawerTab = rdHistSetDrawerTab;
  window.rdHistViewFieldDetail = rdHistViewFieldDetail;
  window.rdHistSetField = rdHistSetField;
  window.rdHistBackToRecords = rdHistBackToRecords;
  window.rdHistCopyValue = rdHistCopyValue;
  window.rdHistPrint = rdHistPrint;
  window.rdHistExport = rdHistExport;
  window.applyHistoryRailFilter = applyHistoryRailFilter;
  window.histRailCategories = RAIL_CATEGORIES;
  window.histEntityMeta = entityMeta;
  window.histLogMatchesCategory = logMatchesCategory;
  window.histEntityMatchesCategory = entityMatchesCategory;

  function hookHistoryPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.history = function () { renderHistoryRd(); };
    }
  }
  hookHistoryPanelRenderer();
  var _showPanelHistory = window.showPanel;
  if (typeof _showPanelHistory === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelHistory.call(window, id, forceOpen);
      hookHistoryPanelRenderer();
      return out;
    };
  }
})();
