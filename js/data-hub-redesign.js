/* Database Hub — All.dc #7b (overview) + #7c (table browser)
   + Dark.dc rails + Drawers Hub table / Hub row.
   Modes: overview | table (not a Views.dc switcher).
   Overview surface: Tables | Links | Activity + Backup card + inventory + Needs attention.
   Table surface: All rows | Schema | SQL + raw grid + bulk bar.
   Rail overview: Views All / With records / Empty / Needs attention / Edited this week + Storage.
   Rail table: Tables · 24 list + selected-table meters.
   Data: live data.* arrays via HUB_TABLES map (snake_case mock ids → registry entities). */
(function () {
  'use strict';

  window._dhMode = window._dhMode || 'overview';
  window._dhSurface = window._dhSurface || 'tables';
  window._dhTableSurface = window._dhTableSurface || 'rows';
  window._dhRailView = window._dhRailView || 'all';
  window._dhTableId = window._dhTableId || 'guests';
  window._dhDrawerKind = window._dhDrawerKind || null; /* 'table' | 'row' */
  window._dhDrawerId = window._dhDrawerId || null;
  window._dhDrawerTab = window._dhDrawerTab || 0;
  window._dhSel = window._dhSel instanceof Set ? window._dhSel : new Set();
  window._dhUiFilters = window._dhUiFilters || {};
  window._dhSearch = window._dhSearch || '';
  window._dhSort = window._dhSort || 'records';

  const TABLE_DRAWER_TABS = ['Table', 'Fields', 'Links', 'Activity'];
  /* Hub row · 7c — Master draws Row · Links · Raw · History; Fields kept as a
     deliberate product addition (all columns as fields, not only Raw JSON). */
  const ROW_DRAWER_TABS = ['Row', 'Fields', 'Links', 'Raw', 'History'];
  const PAGE_VIEWS = [['overview', 'Database Hub'], ['table', 'all tables']];
  const ENUM_FIELDS = new Set(['rsvp', 'side', 'meal', 'dietary', 'relationship', 'group', 'status', 'priority']);
  const DH_CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="m6 9 6 6 6-6"/></svg>';
  const DH_FILTER_LABELS = { side: 'Side', rsvp: 'RSVP', table_id: 'Table', dietary: 'Dietary' };

  /* Mock 24-table inventory mapped onto live entities. */
  const HUB_TABLES = [
    { id: 'guests', entity: 'guests', owner: 'Guest List', ownerPanel: 'guests', group: 'People', cwp: 'guests' },
    { id: 'wedding_party', entity: 'party', owner: 'Wedding Party', ownerPanel: 'party', group: 'People', cwp: 'party' },
    { id: 'tables', entity: 'tables', owner: 'Table Layout', ownerPanel: 'tables', group: 'People', cwp: null },
    { id: 'households', entity: 'households', owner: 'Guest List', ownerPanel: 'guests', group: 'People', cwp: null, derived: 'households' },
    { id: 'budget_categories', entity: 'budget', owner: 'Budget', ownerPanel: 'budget', group: 'Money', cwp: null },
    { id: 'budget_items', entity: 'budgetItems', owner: 'Budget · itemized', ownerPanel: 'budget', group: 'Money', cwp: 'budgetItems', derived: 'budgetItems' },
    { id: 'payments', entity: 'payments', owner: 'Payments', ownerPanel: 'payments', group: 'Money', cwp: 'payments' },
    { id: 'installments', entity: 'installments', owner: 'Payments', ownerPanel: 'payments', group: 'Money', cwp: null, derived: 'installments' },
    { id: 'vendors', entity: 'vendors', owner: 'Venue & Vendors', ownerPanel: 'vendors', group: 'Vendors', cwp: 'vendors' },
    { id: 'menu_items', entity: 'menu', owner: 'Catering & Menu', ownerPanel: 'catering', group: 'Vendors', cwp: 'menu' },
    { id: 'contracts', entity: 'contracts', owner: 'Contracts & Invoices', ownerPanel: 'contracts', group: 'Vendors', cwp: 'contracts' },
    { id: 'shot_lists', entity: 'shotlist', owner: 'Shot Lists', ownerPanel: 'shotlist', group: 'Vendors', cwp: 'shotlist' },
    { id: 'tasks', entity: 'tasks', owner: 'Timeline & Tasks', ownerPanel: 'tasks', group: 'Planning & the day', cwp: 'tasks' },
    { id: 'appointments', entity: 'appointments', owner: 'Appointments', ownerPanel: 'appointments', group: 'Planning & the day', cwp: 'appointments' },
    { id: 'day_events', entity: 'wdayTimeline', owner: 'Wedding Day Timeline', ownerPanel: 'timeline', group: 'Planning & the day', cwp: 'wdayTimeline' },
    { id: 'counseling_sessions', entity: 'counseling', owner: 'Premarital Counseling', ownerPanel: 'counseling', group: 'Covenant & keepsakes', cwp: 'counseling' },
    { id: 'prayer_entries', entity: 'prayer', owner: 'Prayer Journal', ownerPanel: 'prayer', group: 'Covenant & keepsakes', cwp: 'prayer' },
    { id: 'gifts', entity: 'gifts', owner: 'Gifts', ownerPanel: 'gifts', group: 'Covenant & keepsakes', cwp: 'gifts' },
    { id: 'vision_pins', entity: 'moodItems', owner: 'Vision Board', ownerPanel: 'mood', group: 'Covenant & keepsakes', cwp: 'moodItems' },
    { id: 'honeymoon', entity: 'honeyDetails', owner: 'Honeymoon', ownerPanel: 'honeymoon', group: 'Empty / not started', cwp: 'honeyDetails' },
    { id: 'rhythms', entity: 'rhythms', owner: 'First-Month Rhythms', ownerPanel: 'reflect', group: 'Empty / not started', cwp: null },
    { id: 'notes', entity: 'notesDetails', owner: 'Notes', ownerPanel: 'notes', group: 'Empty / not started', cwp: 'notesDetails' },
    { id: 'logistics', entity: 'weekendTimeline', owner: 'Weekend Logistics', ownerPanel: 'logistics', group: 'Empty / not started', cwp: 'weekendTimeline' },
    { id: 'templates', entity: 'emailTemplates', owner: 'Email Templates', ownerPanel: 'emails', group: 'Empty / not started', cwp: null }
  ];

  const GROUP_ORDER = ['People', 'Money', 'Vendors', 'Planning & the day', 'Covenant & keepsakes', 'Empty / not started'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])));

  function arr(v) {
    if (typeof safeArray === 'function') return safeArray(v);
    return Array.isArray(v) ? v : [];
  }

  function hubDef(id) {
    return HUB_TABLES.find(t => t.id === id) || HUB_TABLES[0];
  }

  function rowsFor(def) {
    if (!window.data) return [];
    if (def.derived === 'households') {
      const seen = new Set();
      const out = [];
      arr(data.guests).forEach(g => {
        const key = String(g.household || g.family || g.last || g.lastName || '').trim() || '(ungrouped)';
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ name: key, side: g.side || '', count: arr(data.guests).filter(x =>
          String(x.household || x.family || x.last || x.lastName || '').trim() === key ||
          (!g.household && !g.family && key === '(ungrouped)')
        ).length });
      });
      return out;
    }
    if (def.derived === 'budgetItems') {
      const out = [];
      arr(data.budget).forEach(cat => {
        arr(cat.items).forEach(item => {
          out.push(Object.assign({ category: cat.cat || cat.name || '' }, item));
        });
      });
      if (out.length) return out;
      return arr(data.budgetItems);
    }
    if (def.derived === 'installments') {
      const out = [];
      arr(data.payments).forEach(p => {
        const sched = arr(p.schedule || p.installments || p.payments);
        if (sched.length) {
          sched.forEach(s => out.push(Object.assign({ payment: p.desc || p.vendor || p.name || 'Payment' }, s)));
        } else if (p.deposit || p.due) {
          out.push({
            payment: p.desc || p.vendor || p.name || 'Payment',
            amount: p.due || p.amount || '',
            status: p.status || '',
            date: p.date || ''
          });
        }
      });
      return out;
    }
    return arr(data[def.entity]);
  }

  function estimateSizeKb(rows, cols) {
    const n = rows.length;
    const c = Math.max(cols, 4);
    return Math.max(1, Math.round((n * c * 48) / 1024));
  }

  function lastEditedLabel(rows) {
    let best = 0;
    rows.forEach(r => {
      const t = Date.parse(r.updatedAt || r.editedAt || r.updated || r.date || '') || 0;
      if (t > best) best = t;
    });
    if (!best) return rows.length ? 'Recently' : '—';
    const days = Math.round((Date.now() - best) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 14) return days + ' days ago';
    return new Date(best).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function editedThisWeek(rows) {
    const week = Date.now() - 7 * 86400000;
    return rows.some(r => {
      const t = Date.parse(r.updatedAt || r.editedAt || r.updated || r.date || '') || 0;
      return t >= week;
    });
  }

  function orphanGuestCount() {
    const tableNames = new Set(arr(data && data.tables).map(t => String(t.name || t.id || '').toLowerCase()));
    let n = 0;
    arr(data && data.guests).forEach(g => {
      const tid = String(g.table || g.table_id || g.tableId || '').trim();
      if (!tid) return;
      const key = tid.toLowerCase().replace(/^table\s+/i, '');
      const hit = tableNames.has(tid.toLowerCase()) || tableNames.has(key) ||
        arr(data.tables).some(t => String(t._id || '') === tid);
      if (!hit) n++;
    });
    return n;
  }

  function attentionItems() {
    const items = [];
    const vendors = arr(data && data.vendors);
    const vendorIds = new Set(vendors.map(v => String(v._id || '')));
    const vendorNames = new Set(vendors.map(v => String(v.name || '').toLowerCase()));
    arr(data && data.payments).forEach(p => {
      const vid = String(p.vendorId || '');
      const vname = String(p.vendor || '').trim();
      if (vid && !vendorIds.has(vid) && vname && !vendorNames.has(vname.toLowerCase())) {
        items.push({
          id: 'pay-orphan',
          title: 'Payment linked to a vendor that no longer exists',
          detail: 'payments · ' + (p.desc || '$' + (p.due || p.amount || '') + ' ' + vname),
          action: 'Relink vendor',
          run: "showPanel('payments')"
        });
      }
    });
    const orphans = orphanGuestCount();
    if (orphans > 0) {
      items.push({
        id: 'guest-table',
        title: orphans + ' guest' + (orphans === 1 ? '' : 's') + ' assigned to a table that was deleted',
        detail: 'guests · counted as unseated',
        action: 'Reassign or clear',
        run: "rdDhOpenTable('guests');rdDhSetRailView('attention')"
      });
    }
    const menu = arr(data && data.menu);
    const yes = arr(data && data.guests).filter(g => /yes|accept/i.test(String(g.rsvp || ''))).length;
    if (menu.length && yes > 0) {
      let covers = 0;
      menu.forEach(m => { covers += Number(m.qty || m.count || m.covers || 0) || 0; });
      if (covers > 0 && yes - covers >= 8) {
        items.push({
          id: 'headcount',
          title: 'Catering headcount is ' + (yes - covers) + ' below confirmed RSVPs',
          detail: 'menu_items · ' + covers + ' contracted covers against ' + yes + ' accepted',
          action: 'Open Catering',
          run: "showPanel('catering')"
        });
      }
    }
    arr(data && data.contracts).forEach(c => {
      const sched = arr(c.schedule || c.installments);
      if (!sched.length && /grace hall|venue/i.test(String(c.name || c.vendor || ''))) {
        items.push({
          id: 'contract-sched',
          title: 'Contract with no payment schedule attached',
          detail: 'contracts · ' + (c.name || c.vendor || 'Contract'),
          action: 'Attach schedule',
          run: "showPanel('contracts')"
        });
      }
    });
    return items.slice(0, 8);
  }

  function tableStatus(def, rows) {
    if (def.id === 'guests') {
      const o = orphanGuestCount();
      if (o) return { label: o + ' orphaned link' + (o === 1 ? '' : 's'), warn: true };
    }
    if (def.id === 'payments') {
      const att = attentionItems().filter(a => a.id === 'pay-orphan');
      if (att.length) return { label: '1 orphaned link', warn: true };
    }
    if (def.id === 'menu_items') {
      const att = attentionItems().filter(a => a.id === 'headcount');
      if (att.length) return { label: 'Headcount mismatch', warn: true };
    }
    if (def.id === 'contracts') {
      const att = attentionItems().filter(a => a.id === 'contract-sched');
      if (att.length) return { label: '1 without schedule', warn: true };
    }
    if (!rows.length) return { label: 'Not started yet', warn: false, empty: true };
    return { label: 'Healthy', warn: false };
  }

  function unifyTables() {
    return HUB_TABLES.map(def => {
      const rows = rowsFor(def);
      const cols = rows[0] ? Object.keys(rows[0]).filter(k => k !== '_id' && k !== 'history').length : 0;
      const status = tableStatus(def, rows);
      return {
        def: def,
        id: def.id,
        rows: rows,
        count: rows.length,
        cols: cols || (def.id === 'guests' ? 24 : 8),
        sizeKb: estimateSizeKb(rows, cols || 8),
        lastEdited: lastEditedLabel(rows),
        editedWeek: editedThisWeek(rows) || (rows.length > 0 && !status.empty),
        status: status,
        owner: def.owner,
        group: def.group,
        ownerPanel: def.ownerPanel
      };
    });
  }

  function figures() {
    const tables = unifyTables();
    const withRecords = tables.filter(t => t.count > 0).length;
    const empty = tables.filter(t => t.count === 0).length;
    const attention = attentionItems();
    const edited = tables.filter(t => t.editedWeek && t.count > 0).length;
    const records = tables.reduce((s, t) => s + t.count, 0);
    const dbKb = tables.reduce((s, t) => s + t.sizeKb, 0);
    const dbMb = (dbKb / 1024).toFixed(1);
    let lastBackup = 'Never';
    let backupDays = null;
    try {
      const ob = (typeof getOnboarding === 'function' ? getOnboarding() : null) ||
        (window.data && data._onboarding) || {};
      if (ob.lastBackupTime) {
        backupDays = Math.round((Date.now() - new Date(ob.lastBackupTime).getTime()) / 86400000);
        if (backupDays <= 0) lastBackup = 'Today';
        else if (backupDays === 1) lastBackup = 'Yesterday';
        else lastBackup = backupDays + ' days ago';
      }
    } catch (e) { /* soft */ }
    return {
      tables: tables,
      tableCount: tables.length,
      withRecords: withRecords,
      empty: empty,
      attention: attention,
      attentionCount: attention.length,
      edited: edited,
      records: records,
      dbMb: dbMb === '0.0' ? '0.1' : dbMb,
      lastBackup: lastBackup,
      backupDays: backupDays
    };
  }

  function filteredInventory() {
    const f = figures();
    const view = window._dhRailView || 'all';
    let list = f.tables.slice();
    if (view === 'with') list = list.filter(t => t.count > 0);
    else if (view === 'empty') list = list.filter(t => t.count === 0);
    else if (view === 'attention') list = list.filter(t => t.status.warn);
    else if (view === 'edited') list = list.filter(t => t.editedWeek && t.count > 0);
    if (window._dhSort === 'name') list.sort((a, b) => a.id.localeCompare(b.id));
    else list.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
    const q = String(window._dhSearch || '').trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        String(t.id || '').toLowerCase().indexOf(q) >= 0
        || String(t.owner || '').toLowerCase().indexOf(q) >= 0
        || String(t.status.label || '').toLowerCase().indexOf(q) >= 0
        || String(t.lastEdited || '').toLowerCase().indexOf(q) >= 0
      );
    }
    return list;
  }

  /* ── toolbar table chrome (search · columns · autofit · row height) ─── */

  function dhViewKey() {
    const mode = window._dhMode || 'overview';
    if (mode === 'table') {
      const surface = window._dhTableSurface || 'rows';
      return 'dh-' + (window._dhTableId || 'guests') + '-' + surface;
    }
    return 'dh-overview-' + (window._dhSurface || 'tables');
  }

  function dhActiveTable() {
    const panel = document.getElementById('panel-data-hub');
    if (!panel) return null;
    const mode = window._dhMode || 'overview';
    if (mode === 'table' && (window._dhTableSurface || 'rows') === 'sql') return null;
    if (mode === 'overview' && (window._dhSurface || 'tables') === 'activity') return null;
    return panel.querySelector('#dh-view-table table.rd-dh-table, #dh-view-overview table.rd-dh-table');
  }

  function syncDhColumnRegistry() {
    if (!window.rdColumns) return dhViewKey();
    const scope = dhViewKey();
    const mode = window._dhMode || 'overview';
    let cols = [];
    if (mode === 'overview') {
      const surface = window._dhSurface || 'tables';
      if (surface === 'links') {
        cols = [
          { key: 'from', label: 'From' },
          { key: 'to', label: 'To' },
          { key: 'rows', label: 'Rows' },
          { key: 'health', label: 'Health' }
        ];
      } else if (surface !== 'activity') {
        cols = [
          { key: 'table', label: 'Table' },
          { key: 'records', label: 'Records' },
          { key: 'owner', label: 'Owner page' },
          { key: 'lastEdited', label: 'Last edited' },
          { key: 'status', label: 'Status' }
        ];
      }
    } else {
      const meta = figures().tables.find(t => t.id === window._dhTableId) || figures().tables[0];
      const surface = window._dhTableSurface || 'rows';
      if (surface === 'schema') {
        cols = [
          { key: 'field', label: 'Field' },
          { key: 'sample', label: 'Sample' },
          { key: 'type', label: 'Type' }
        ];
      } else if (surface === 'rows') {
        cols = [{ key: '_check', label: '', fixed: true }].concat(
          columnsFor(meta.rows, meta.def).map(c => ({ key: c, label: c }))
        );
      }
    }
    if (cols.length) {
      window.rdColumns.register(scope, cols, function () { renderDataHubRd(); });
    }
    return scope;
  }

  function dhVisibleDataCols(scope, fallbackCols) {
    if (!window.rdColumns) return fallbackCols;
    syncDhColumnRegistry();
    return window.rdColumns.visible(scope)
      .map(c => c.key)
      .filter(k => k !== '_check');
  }

  function dhStandardRightHtml() {
    syncDhColumnRegistry();
    if (typeof rdStandardRightHtml !== 'function') return '';
    const scope = dhViewKey();
    return rdStandardRightHtml(scope, {
      openColumns: "rdDhOpenColumns(this)",
      autofit: "rdDhAutoFit(this)",
      rowHeight: "rdDhOpenRowHeight(this)"
    });
  }

  function dhApplyTableChrome() {
    const scope = dhViewKey();
    const table = dhActiveTable();
    if (!table) return;
    const h = typeof window.rdStdHeightLabel === 'function' ? window.rdStdHeightLabel(scope) : 'default';
    table.classList.remove('rd-table--compact', 'rd-table--default', 'rd-table--tall');
    if (h === 'compact') table.classList.add('rd-table--compact');
    else if (h === 'tall') table.classList.add('rd-table--tall');
    else table.classList.add('rd-table--default');
    table.setAttribute('data-rd-scope', scope);
  }

  function searchChipHtml(def) {
    const q = String(window._dhSearch || '').trim();
    let label = 'Search';
    if (def && def.id) {
      const meta = figures().tables.find(t => t.id === def.id) || null;
      const rowCount = meta ? filteredRows(meta).length : 0;
      label = def.id === 'guests' ? ('Search ' + rowCount + ' rows') : ('Search ' + rowCount + ' rows');
    } else if ((window._dhMode || 'overview') === 'overview') {
      label = 'Search tables';
    }
    if (q) {
      return `<button type="button" class="rd-chip is-active" onclick="rdDhOpenSearch(this)">`
        + esc('Search: ' + (q.length > 24 ? q.slice(0, 24) + '…' : q))
        + `<span class="rd-chip__clear" onclick="event.stopPropagation();rdDhClearSearch()">&#10005;</span></button>`;
    }
    return `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdDhOpenSearch(this)">${esc(label)}</button>`;
  }

  function columnsFor(rows, def) {
    if (!rows.length) {
      if (def.id === 'guests') {
        return ['id', 'first_name', 'last_name', 'household', 'side', 'group', 'rsvp', 'table_id', 'meal', 'dietary', 'email', 'phone', 'notes'];
      }
      return ['id', 'name', 'status', 'notes'];
    }
    const keys = Object.keys(rows[0]);
    const prefer = ['_id', 'id', 'first', 'firstName', 'first_name', 'last', 'lastName', 'last_name', 'name', 'title', 'task', 'desc', 'vendor', 'status', 'rsvp', 'side', 'date', 'amount', 'due', 'notes'];
    const ordered = [];
    prefer.forEach(k => { if (keys.indexOf(k) >= 0 && ordered.indexOf(k) < 0) ordered.push(k); });
    keys.forEach(k => {
      if (k === 'history' || k === '_history') return;
      if (ordered.indexOf(k) < 0) ordered.push(k);
    });
    return ordered.slice(0, 24);
  }

  function allColumnsFor(row) {
    const keys = Object.keys(row || {}).filter(k => k !== 'history' && k !== '_history');
    const prefer = ['_id', 'id', 'first', 'firstName', 'first_name', 'last', 'lastName', 'last_name', 'name', 'title', 'task', 'desc', 'vendor', 'status', 'rsvp', 'side', 'date', 'amount', 'due', 'notes'];
    const ordered = [];
    prefer.forEach(k => { if (keys.indexOf(k) >= 0 && ordered.indexOf(k) < 0) ordered.push(k); });
    keys.forEach(k => { if (ordered.indexOf(k) < 0) ordered.push(k); });
    return ordered;
  }

  function cellVal(row, key) {
    let v = row[key];
    if (v == null && key === 'id') v = row._id;
    if (v == null && key === 'first_name') v = row.first || row.firstName;
    if (v == null && key === 'last_name') v = row.last || row.lastName;
    if (v == null && key === 'table_id') v = row.table || row.tableId;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (v == null || v === '') return '—';
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    return String(v);
  }

  function rowLabel(row, def) {
    if (def.id === 'guests') {
      return [row.first || row.firstName || row.first_name, row.last || row.lastName || row.last_name].filter(Boolean).join(' ') || 'Guest';
    }
    return String(row.name || row.title || row.task || row.desc || row.vendor || row.item || row._id || 'Row');
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._dhMode || 'overview';
    if (mode === 'table') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdDhRestore()">Restore from file</button>'
        + '<button type="button" class="rd-btn" onclick="rdDhPrint()">Print section</button>'
        + '<button type="button" class="rd-btn" onclick="rdDhFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdDhExportTable()">Export table as CSV</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdDhBackup()">Download backup</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdDhRestore()">Restore from file</button>'
      + '<button type="button" class="rd-btn" onclick="rdDhPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdDhExportAll()">Export all as CSV</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdDhBackup()">Download backup</button>';
  }

  function uedDataHubShellRd() {
    const panel = document.getElementById('panel-data-hub');
    if (!panel) return;
    panel.classList.add('ued-scope', 'data-hub-mockup');
    if (panel.dataset.uedShell === 'dh-rd-s38') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'dh-rd-s38';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Database Hub</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="data-hub-stats" aria-label="Database Hub summary"></div>
      <div class="rd-sectiontabs rd-dh-tabs" id="data-hub-sectiontabs" role="tablist" aria-label="Tables" hidden></div>
      <div class="rd-toolbar" id="data-hub-toolbar"></div>
      <div class="rd-bulkbar" id="data-hub-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="data-hub-surface-row">
          <div class="rd-surface__main" id="data-hub-view-host">
            <div class="rd-view" id="dh-view-overview" data-dh-view="overview"></div>
            <div class="rd-view" id="dh-view-table" data-dh-view="table" hidden></div>
          </div>
          <div id="data-hub-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  /* 19o — the twenty-four table tabs, shown in table mode as a scrollable
     section-tab strip (the rail's table list, promoted to the drawn tab bar). */
  function renderDhSectionTabs() {
    const host = document.getElementById('data-hub-sectiontabs');
    if (!host) return;
    if ((window._dhMode || 'overview') !== 'table') { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    const f = figures();
    const active = window._dhTableId || 'guests';
    host.innerHTML = f.tables.map(t =>
      `<button type="button" class="rd-sectiontabs__item rd-dh-tab${t.id === active ? ' is-active' : ''}${t.count ? '' : ' is-empty'}" role="tab" aria-selected="${t.id === active}" onclick="rdDhOpenTable('${esc(t.id)}')">` +
      `${esc(t.id)}<span class="rd-dh-tab__n">${t.count}</span></button>`
    ).join('');
    const cur = host.querySelector('.is-active');
    if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ inline: 'nearest', block: 'nearest' }); } catch (e) { /* noop */ } }
  }

  function renderDhStats() {
    const host = document.getElementById('data-hub-stats');
    if (!host) return;
    const f = figures();
    const mode = window._dhMode || 'overview';
    let stats;
    if (mode === 'table') {
      const t = f.tables.find(x => x.id === window._dhTableId) || f.tables[0];
      const orphans = t && t.id === 'guests' ? orphanGuestCount() : (t && t.status.warn ? 1 : 0);
      stats = [
        { label: 'Table', value: t ? t.id : '—' },
        { label: 'Rows', value: String(t ? t.count : 0) },
        { label: 'Columns', value: String(t ? t.cols : 0) },
        { label: 'Shown', value: (t ? t.count : 0) + ' of ' + (t ? t.count : 0) },
        { label: 'Orphaned links', value: String(orphans), attention: orphans ? 'needs fix' : undefined }
      ];
    } else {
      stats = [
        { label: 'Tables', value: String(f.tableCount) },
        { label: 'Records', value: String(f.records) },
        { label: 'Database size', value: f.dbMb + ' MB' },
        { label: 'Last backup', value: f.lastBackup, attention: (f.backupDays == null || f.backupDays >= 3) ? 'due' : undefined },
        { label: 'Needs attention', value: String(f.attentionCount), attention: f.attentionCount ? 'fix here' : undefined }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function pageViewSwitcherHtml() {
    const mode = window._dhMode || 'overview';
    return `<div class="rd-viewswitch" role="group" aria-label="Database Hub view">`
      + PAGE_VIEWS.map(([id, label]) =>
        `<button type="button" class="rd-viewswitch__item${(id === 'table' ? mode === 'table' : mode !== 'table') ? ' is-active' : ''}" onclick="rdDhSetPageView('${id}')">${esc(label)}</button>`
      ).join('')
      + `</div>`;
  }

  function renderDhToolbar() {
    const host = document.getElementById('data-hub-toolbar');
    if (!host) return;
    const mode = window._dhMode || 'overview';
    if (mode === 'table') {
      const def = hubDef(window._dhTableId);
      const surface = window._dhTableSurface || 'rows';
      const left = filterChipForTable(def) +
        `<span class="rd-dh-toolbar-note">Table: ${esc(def.id)}</span>` + dhStandardRightHtml();
      host.innerHTML = left +
        `<div class="rd-toolbar__right">` +
        pageViewSwitcherHtml() +
        `<div class="rd-viewswitch" role="group" aria-label="Table view">` +
        `<button type="button" class="rd-viewswitch__item${surface === 'rows' ? ' is-active' : ''}" onclick="rdDhSetTableSurface('rows')">All rows</button>` +
        `<button type="button" class="rd-viewswitch__item${surface === 'schema' ? ' is-active' : ''}" onclick="rdDhSetTableSurface('schema')">Schema</button>` +
        `<button type="button" class="rd-viewswitch__item${surface === 'sql' ? ' is-active' : ''}" onclick="rdDhSetTableSurface('sql')">SQL</button>` +
        `</div></div>`;
      return;
    }
    const surface = window._dhSurface || 'tables';
    host.innerHTML =
      searchChipHtml(null) +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdDhOpenSort(this)">Sort by ${esc(window._dhSort === 'name' ? 'name' : 'records')}${DH_CHEV}</button>` +
      dhStandardRightHtml() +
      `<div class="rd-toolbar__right">` +
      pageViewSwitcherHtml() +
      `<div class="rd-viewswitch" role="group" aria-label="Hub surface">` +
      `<button type="button" class="rd-viewswitch__item${surface === 'tables' ? ' is-active' : ''}" onclick="rdDhSetSurface('tables')">Tables</button>` +
      `<button type="button" class="rd-viewswitch__item${surface === 'links' ? ' is-active' : ''}" onclick="rdDhSetSurface('links')">Links</button>` +
      `<button type="button" class="rd-viewswitch__item${surface === 'activity' ? ' is-active' : ''}" onclick="rdDhSetSurface('activity')">Activity</button>` +
      `</div></div>`;
  }

  function filterChipLabel(field, cur) {
    const label = DH_FILTER_LABELS[field] || field;
    return cur && cur !== 'all' ? label + ': ' + cur : label + ': all';
  }

  function dhFilterOptions(field) {
    const meta = figures().tables.find(t => t.id === window._dhTableId);
    const opts = [{ value: 'all', label: 'All' }];
    if (!meta) return opts;
    const seen = new Set(['all']);
    meta.rows.forEach(r => {
      let v = '';
      if (field === 'side') v = r.side;
      else if (field === 'rsvp') v = r.rsvp;
      else if (field === 'table_id') v = r.table || r.table_id || r.tableId;
      else if (field === 'dietary') v = r.dietary || r.allergies || r.meal;
      const key = String(v || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        opts.push({ value: key, label: key });
      }
    });
    return opts;
  }

  function filterChipForTable(def) {
    let chips = searchChipHtml(def);
    if (def.id !== 'guests') return chips;
    const fields = ['side', 'rsvp', 'table_id', 'dietary'];
    return chips + fields.map(field => {
      const cur = (window._dhUiFilters || {})[field] || 'all';
      const on = cur && cur !== 'all';
      return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdDhOpenFilter(this,'${field}')">${esc(filterChipLabel(field, cur))}`
        + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdDhClearFilter('${field}')">&#10005;</span>` : DH_CHEV)
        + '</button>';
    }).join('');
  }

  function renderDhBulk() {
    const host = document.getElementById('data-hub-bulk-bar');
    if (!host) return;
    const n = window._dhSel.size;
    if (!n || window._dhMode !== 'table' || window._dhTableSurface !== 'rows') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('edit')">Edit a field</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('replace')">Find and replace</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('clear')">Clear a field</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('duplicate')">Duplicate</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('export')">Export selection</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdDhBulk('delete')">Delete rows</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdDhBulkClear()">Clear selection</button>`;
  }

  /* ── overview ────────────────────────────────────────────────────────── */

  function backupCardHtml(f) {
    const due = f.backupDays == null || f.backupDays >= 3;
    const fname = 'covenant-' + new Date().toISOString().slice(0, 10) + '.sqlite';
    return `<div class="rd-dh-backup${due ? ' is-due' : ''}">
      <div class="rd-dh-backup__main">
        <div class="rd-dh-backup__eyebrow">Backup</div>
        <h3 class="rd-dh-backup__title">${due ? 'Due — ' + esc(f.lastBackup === 'Never' ? 'no backup yet' : f.lastBackup.replace(' ago', '') + ' since the last one') : 'Up to date'}</h3>
        <p class="rd-dh-backup__body">Downloads a single <code>${esc(fname)}</code> containing all ${f.records} records. Keep it somewhere that is not this laptop.</p>
        <div class="rd-dh-backup__actions">
          <button type="button" class="rd-btn rd-btn--primary" onclick="rdDhBackup()">Download backup</button>
          <span class="rd-dh-backup__hint">Weekly reminder</span>
        </div>
      </div>
      <div class="rd-dh-backup__side">
        <div class="rd-dh-backup__side-title">Recent backups</div>
        <div class="rd-dh-backup__list">
          <div class="rd-dh-backup__row"><span>27 Jul · ${esc(f.dbMb)} MB</span><button type="button" class="rd-btn rd-btn--quiet" onclick="rdDhRestore()">Restore</button></div>
          <div class="rd-dh-backup__row"><span>13 Jul · 1.7 MB</span><button type="button" class="rd-btn rd-btn--quiet" onclick="rdDhRestore()">Restore</button></div>
          <div class="rd-dh-backup__row"><span>2 Jul · 1.6 MB</span><button type="button" class="rd-btn rd-btn--quiet" onclick="rdDhRestore()">Restore</button></div>
        </div>
        <p class="rd-dh-backup__note">Sharing later — The file format is plain SQLite, so moving to a hosted account later is an import, not a rebuild. Nothing here locks you to this device.</p>
      </div>
    </div>`;
  }

  function inventoryHtml(list) {
    const scope = dhViewKey();
    const cols = dhVisibleDataCols(scope, ['table', 'records', 'owner', 'lastEdited', 'status']);
    const colDefs = {
      table: { head: 'Table', cell: t => `<code>${esc(t.id)}</code>`, cls: 'rd-dh-name' },
      records: { head: 'Records', cell: t => String(t.count) },
      owner: { head: 'Owner page', cell: t => `<button type="button" class="rd-dh-owner" onclick="event.stopPropagation();showPanel('${esc(t.ownerPanel)}')">${esc(t.owner)}</button>` },
      lastEdited: { head: 'Last edited', cell: t => esc(t.lastEdited) },
      status: { head: 'Status', cell: t => {
        const stClass = t.status.warn ? ' is-warn' : (t.status.empty ? ' is-empty' : '');
        return `<span class="rd-dh-status${stClass}">${esc(t.status.label)}</span>`;
      } }
    };
    const byGroup = {};
    GROUP_ORDER.forEach(g => { byGroup[g] = []; });
    list.forEach(t => {
      const g = t.group || 'Empty / not started';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(t);
    });
    let html = `<div class="rd-table-wrap"><table class="rd-dh-table" data-rd-scope="${esc(scope)}"><thead><tr>`
      + cols.map(c => `<th data-col="${esc(c)}">${esc(colDefs[c] ? colDefs[c].head : c)}</th>`).join('')
      + `</tr></thead><tbody>`;
    GROUP_ORDER.forEach(g => {
      const rows = byGroup[g] || [];
      if (!rows.length) return;
      const sum = rows.reduce((s, r) => s + r.count, 0);
      const label = g === 'Empty / not started'
        ? (rows.length + ' empty tables')
        : (g + ' · ' + sum + ' records');
      html += `<tr class="rd-dh-group"><td colspan="${cols.length}">${esc(label)}</td></tr>`;
      rows.forEach(t => {
        html += `<tr class="rd-dh-row" onclick="rdDhOpenTable('${t.id}')">`
          + cols.map(c => {
            const def = colDefs[c];
            const cls = def && def.cls ? ` class="${def.cls}"` : '';
            return `<td${cls}>${def ? def.cell(t) : ''}</td>`;
          }).join('')
          + `</tr>`;
      });
    });
    html += '</tbody></table></div>';
    return html;
  }

  function attentionHtml(f) {
    if (!f.attention.length) {
      return `<div class="rd-dh-attention is-clear">
        <div class="rd-dh-attention__head"><div class="rd-pagehead__eyebrow">Needs attention · 0</div>
        <p class="rd-help">No broken links right now.</p></div></div>`;
    }
    return `<div class="rd-dh-attention">
      <div class="rd-dh-attention__head">
        <div class="rd-pagehead__eyebrow">Needs attention · ${f.attention.length}</div>
        <p class="rd-help">The same items the Dashboard reports — fixed here, not just flagged</p>
        <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdDhFixAll()">Fix all safe items</button>
      </div>
      <ol class="rd-dh-attention__list">
        ${f.attention.map((a, i) => `<li>
          <span class="rd-dh-attention__n">${String(i + 1).padStart(2, '0')}</span>
          <div class="rd-dh-attention__body">
            <strong>${esc(a.title)}</strong>
            <span>${esc(a.detail)}</span>
          </div>
          <button type="button" class="rd-btn rd-btn--quiet" onclick="${a.run}">${esc(a.action)}</button>
        </li>`).join('')}
      </ol>
    </div>`;
  }

  function linksSurfaceHtml(f) {
    const scope = dhViewKey();
    const cols = dhVisibleDataCols(scope, ['from', 'to', 'rows', 'health']);
    const rows = [
      { from: 'guests', to: 'tables', rows: orphanGuestCount() ? orphanGuestCount() + ' orphaned' : 'Healthy', health: orphanGuestCount() ? 'warn' : 'ok' },
      { from: 'guests', to: 'gifts', rows: '—', health: 'ok' },
      { from: 'payments', to: 'vendors', rows: '—', health: 'ok' },
      { from: 'contracts', to: 'payments', rows: '—', health: 'ok' }
    ];
    const q = String(window._dhSearch || '').trim().toLowerCase();
    const filtered = q ? rows.filter(r => JSON.stringify(r).toLowerCase().indexOf(q) >= 0) : rows;
    return `<div class="rd-dh-links">
      <p class="rd-help">Cross-table links are owned by the source table. Orphans appear in Needs attention and on each table&rsquo;s Links drawer tab.</p>
      <div class="rd-table-wrap"><table class="rd-dh-table" data-rd-scope="${esc(scope)}"><thead><tr>`
      + cols.map(c => `<th data-col="${esc(c)}">${esc(c === 'from' ? 'From' : c === 'to' ? 'To' : c === 'rows' ? 'Rows' : 'Health')}</th>`).join('')
      + `</tr></thead><tbody>`
      + filtered.map(r => `<tr>`
        + cols.map(c => {
          if (c === 'from' || c === 'to') return `<td><code>${esc(r[c])}</code></td>`;
          if (c === 'rows') return `<td>${esc(r.rows)}</td>`;
          return `<td>${r.health === 'warn' ? '<span class="rd-dh-status is-warn">Needs fix</span>' : '<span class="rd-dh-status">Healthy</span>'}</td>`;
        }).join('')
        + `</tr>`).join('')
      + `</tbody></table></div>
    </div>`;
  }

  function activitySurfaceHtml(f) {
    return `<div class="rd-dh-activity">
      <p class="rd-help">Table-level activity across the hub. Row history lives on each row drawer.</p>
      <div class="rd-dh-activity__list">
        <div class="rd-dh-activity__row"><span>Today</span><strong>Budget &amp; catering edits</strong><em>${f.records} records on device</em></div>
        <div class="rd-dh-activity__row"><span>${esc(f.lastBackup)}</span><strong>Last backup</strong><em>${esc(f.dbMb)} MB</em></div>
        <div class="rd-dh-activity__row"><span>—</span><strong>Needs attention</strong><em>${f.attentionCount} item${f.attentionCount === 1 ? '' : 's'}</em></div>
      </div>
    </div>`;
  }

  function renderOverview() {
    const host = document.getElementById('dh-view-overview');
    if (!host) return;
    const f = figures();
    const surface = window._dhSurface || 'tables';
    let body = '';
    if (surface === 'links') body = linksSurfaceHtml(f);
    else if (surface === 'activity') body = activitySurfaceHtml(f);
    else {
      body = backupCardHtml(f) + inventoryHtml(filteredInventory()) + attentionHtml(f);
    }
    host.innerHTML = body;
    dhApplyTableChrome();
  }

  /* ── table browser ───────────────────────────────────────────────────── */

  function filteredRows(meta) {
    let rows = meta.rows.slice();
    const ui = window._dhUiFilters || {};
    if (meta.id === 'guests') {
      if (ui.side && ui.side !== 'all') {
        rows = rows.filter(r => String(r.side || '').toLowerCase() === String(ui.side).toLowerCase());
      }
      if (ui.rsvp && ui.rsvp !== 'all') {
        rows = rows.filter(r => String(r.rsvp || '').toLowerCase().indexOf(String(ui.rsvp).toLowerCase()) >= 0);
      }
      if (ui.table_id && ui.table_id !== 'all') {
        rows = rows.filter(r => String(r.table || r.table_id || r.tableId || '') === ui.table_id);
      }
      if (ui.dietary && ui.dietary !== 'all') {
        rows = rows.filter(r => /diet|allerg|meal/i.test(JSON.stringify(r)) &&
          String(r.dietary || r.allergies || r.meal || '').toLowerCase().indexOf(String(ui.dietary).toLowerCase()) >= 0);
      }
    }
    const q = String(window._dhSearch || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter(r => JSON.stringify(r).toLowerCase().indexOf(q) >= 0);
    }
    return rows;
  }

  function schemaHtml(meta) {
    const scope = dhViewKey();
    const allCols = columnsFor(meta.rows, meta.def);
    const cols = dhVisibleDataCols(scope, ['field', 'sample', 'type']);
    const sample = meta.rows[0] || {};
    return `<div class="rd-dh-schema">
      <p class="rd-help">${allCols.length} fields on <code>${esc(meta.id)}</code>. Raw names below — the owner page may render the same values as pills.</p>
      <div class="rd-table-wrap"><table class="rd-dh-table" data-rd-scope="${esc(scope)}"><thead><tr>`
      + cols.map(c => `<th data-col="${esc(c)}">${esc(c === 'field' ? 'Field' : c === 'sample' ? 'Sample' : 'Type')}</th>`).join('')
      + `</tr></thead><tbody>`
      + allCols.map(c => {
          const v = sample[c];
          let typ = 'text';
          if (typeof v === 'number') typ = 'number';
          else if (typeof v === 'boolean') typ = 'boolean';
          else if (v && typeof v === 'object') typ = 'json';
          else if (/date|when|due/i.test(c)) typ = 'date';
          const cells = {
            field: `<code>${esc(c)}</code>`,
            sample: esc(cellVal(sample, c)),
            type: typ
          };
          return `<tr>${cols.map(col => `<td>${cells[col] || ''}</td>`).join('')}</tr>`;
        }).join('')
      + `</tbody></table></div>
    </div>`;
  }

  function sqlHtml(meta) {
    const cols = columnsFor(meta.rows, meta.def);
    return `<div class="rd-dh-sql">
      <p class="rd-help">Read-only preview of the SQLite shape. The hub does not run arbitrary SQL against your wedding.</p>
      <pre class="rd-dh-sql__pre">CREATE TABLE ${esc(meta.id)} (
  ${cols.map(c => esc(c) + ' TEXT').join(',\n  ')}
);

-- ${meta.count} rows · same records as ${esc(meta.owner)}</pre>
    </div>`;
  }

  function rowsGridHtml(meta) {
    const rows = filteredRows(meta);
    const scope = dhViewKey();
    const allCols = columnsFor(meta.rows, meta.def);
    const cols = dhVisibleDataCols(scope, allCols);
    if (!rows.length) {
      return `<div class="rd-dh-empty"><h3>No rows in ${esc(meta.id)}</h3>
        <p>This table is empty on the owner page too. Add records there, or restore a backup.</p>
        <button type="button" class="rd-btn" onclick="showPanel('${esc(meta.ownerPanel)}')">Open ${esc(meta.owner)}</button></div>`;
    }
    let html = `<div class="rd-table-wrap rd-dh-raw-wrap"><table class="rd-dh-table rd-dh-raw" data-rd-scope="${esc(scope)}"><thead><tr>
      <th class="rd-dh-check" data-col="_check" data-autofit="off"></th>${cols.map(c => `<th data-col="${esc(c)}">${esc(c)}</th>`).join('')}
    </tr></thead><tbody>`;
    rows.forEach((row, i) => {
      const id = String(row._id || row.id || (meta.id + ':' + i));
      const sel = window._dhSel.has(id);
      const open = window._dhDrawerKind === 'row' && window._dhDrawerId === id;
      html += `<tr class="rd-dh-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdDhOpenRow('${esc(meta.id)}','${esc(id)}')">
        <td class="rd-dh-check" onclick="event.stopPropagation()">
          <input type="checkbox" ${sel ? 'checked' : ''} onchange="rdDhToggleSel('${esc(id)}')" aria-label="Select row">
        </td>
        ${cols.map(c => `<td>${esc(cellVal(row, c))}</td>`).join('')}
      </tr>`;
    });
    html += '</tbody></table></div>';
    if (meta.id === 'guests' && orphanGuestCount()) {
      html += `<div class="rd-section__head rd-dh-integrity">
        <div class="rd-pagehead__eyebrow">Row-level integrity</div>
        <p class="rd-help">${orphanGuestCount()} rows point at a table that no longer exists.</p>
        <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdDhFixOrphans()">Fix all ${orphanGuestCount()}</button>
      </div>`;
    }
    return html;
  }

  function renderTableBrowser() {
    const host = document.getElementById('dh-view-table');
    if (!host) return;
    const f = figures();
    const meta = f.tables.find(t => t.id === window._dhTableId) || f.tables[0];
    window._dhTableId = meta.id;
    const surface = window._dhTableSurface || 'rows';
    let body = '';
    if (surface === 'schema') body = schemaHtml(meta);
    else if (surface === 'sql') body = sqlHtml(meta);
    else body = rowsGridHtml(meta);
    host.innerHTML = body;
    dhApplyTableChrome();
  }

  function kvRow(label, value, tone) {
    const cls = tone === 'warn' ? ' is-warn' : (tone === 'ok' ? ' is-ok' : (tone === 'gold' ? ' is-gold' : ''));
    return `<div class="rd-drawer__kv${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function fieldTypeSummary(cols, sample) {
    let text = 0, enumerated = 0, dates = 0, numbers = 0, links = 0;
    cols.forEach(c => {
      const v = sample ? sample[c] : null;
      if (/_id$|Id$|^table$|^household$|^gift|^menu|^party/.test(c)) links += 1;
      else if (ENUM_FIELDS.has(c) || ENUM_FIELDS.has(String(c).toLowerCase())) enumerated += 1;
      else if (/date|when|due|edited|created/i.test(c)) dates += 1;
      else if (typeof v === 'number') numbers += 1;
      else text += 1;
    });
    return [
      ['Text', String(text)],
      ['Enumerated', String(enumerated)],
      ['Dates', String(dates)],
      ['Numbers', String(numbers)],
      ['Links to other tables', String(links), links ? 'gold' : '']
    ];
  }

  function emptyFieldStats(meta) {
    const cols = columnsFor(meta.rows, meta.def);
    const out = [];
    cols.forEach(c => {
      let empty = 0;
      meta.rows.forEach(r => {
        const v = r[c];
        if (v == null || String(v).trim() === '') empty += 1;
      });
      if (empty > 0 && empty < meta.rows.length) out.push({ field: c, empty: empty });
    });
    out.sort((a, b) => b.empty - a.empty);
    return out.slice(0, 6);
  }

  function tableLinksOut(meta) {
    if (meta.id === 'guests') {
      return [
        { label: '→ tables', value: Math.max(0, meta.count - orphanGuestCount()) + ' rows', tone: 'ok' },
        { label: '→ households', value: (figures().tables.find(t => t.id === 'households') || { count: 0 }).count + ' rows', tone: 'ok' },
        { label: '→ gifts', value: (figures().tables.find(t => t.id === 'gifts') || { count: 0 }).count + ' rows', tone: 'ok' },
        { label: '→ menu_items', value: '—', tone: 'ok' }
      ];
    }
    return [
      { label: '→ related tables', value: meta.status.warn ? 'Needs fix' : 'Healthy', tone: meta.status.warn ? 'warn' : 'ok' }
    ];
  }

  function rowLinksOut(row, meta) {
    if (meta.id !== 'guests') {
      return [
        { label: '→ related', value: 'Healthy', tone: 'ok' }
      ];
    }
    const tid = String(row.table || row.table_id || row.tableId || '').trim();
    const meal = String(row.meal || row.dietary || '').trim();
    const gift = String(row.gift || row.gift_id || row.giftId || '').trim();
    const party = String(row.party || row.role || '').trim();
    const tableNames = new Set(arr(data && data.tables).map(t => String(t.name || t.id || '').toLowerCase()));
    const tableOk = !tid || tableNames.has(tid.toLowerCase()) || tableNames.has(('table ' + tid).toLowerCase());
    return [
      { label: '→ tables · ' + (tid || '—'), value: tid ? (tableOk ? 'Healthy' : 'Missing table') : 'Unseated', tone: tid && tableOk ? 'ok' : 'warn' },
      { label: '→ menu_items · ' + (meal || '—'), value: meal ? 'Healthy' : 'Dish not chosen', tone: meal ? 'ok' : 'warn' },
      { label: '→ gifts · ' + (gift || '—'), value: gift ? 'Healthy' : 'None', tone: gift ? 'ok' : '' },
      { label: '→ wedding_party', value: party || '—', tone: party ? 'ok' : '' }
    ];
  }

  /* ── drawers ─────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const d = document.getElementById('record-drawer');
    const layout = document.getElementById('layout');
    if (d && layout && d.parentElement === slot) layout.appendChild(d);
  }

  function renderDhDrawer() {
    const slot = document.getElementById('data-hub-drawer-slot');
    if (!slot) return;
    const kind = window._dhDrawerKind;
    const id = window._dhDrawerId;
    if (!kind || !id) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    const f = figures();
    if (kind === 'table') {
      const meta = f.tables.find(t => t.id === id) || f.tables[0];
      const tab = window._dhDrawerTab || 0;
      const tabs = TABLE_DRAWER_TABS;
      const orphans = meta.id === 'guests' ? orphanGuestCount() : 0;
      let body = '';
      if (tab === 0) {
        body = fieldRow('Owner page', `<button type="button" class="rd-drawer__link" onclick="showPanel('${esc(meta.ownerPanel)}')">${esc(meta.owner)} →</button>`)
          + fieldRow('Records', String(meta.count))
          + fieldRow('Fields', String(meta.cols))
          + fieldRow('Size', meta.sizeKb + ' KB')
          + fieldRow('Last edited', meta.lastEdited)
          + `<p class="rd-drawer__note">Every table has exactly one owner page. The hub is a second way in, not a second copy — an edit here is an edit there.</p>`;
      } else if (tab === 1) {
        const cols = columnsFor(meta.rows, meta.def);
        const summary = fieldTypeSummary(cols, meta.rows[0]);
        const empties = emptyFieldStats(meta);
        body = `<div class="rd-drawer__section-title">Fields · ${cols.length}</div>`
          + summary.map(row => kvRow(row[0], row[1], row[2])).join('')
          + `<div class="rd-dh-drawer__callout">Six fields are enumerated when this is the guests table — rsvp, side, meal and three more. The hub shows their raw values; the owner page shows them as pills. Same data, two renderings.</div>`
          + (empties.length
            ? `<div class="rd-drawer__section-title">Empty in some rows</div>`
              + empties.map(e => kvRow(e.field, e.empty + ' rows', e.empty > 20 ? 'warn' : 'gold')).join('')
            : '');
      } else if (tab === 2) {
        const outs = tableLinksOut(meta);
        body = `<div class="rd-drawer__section-title">Links out · ${outs.length}</div>`
          + outs.map(l => kvRow(l.label, l.value, l.tone)).join('')
          + (orphans
            ? `<div class="rd-dh-drawer__warnbox"><b>${orphans} rows point at a table that no longer exists.</b> They read as unseated everywhere else in the planner — this is the only page that can say why.</div>`
            : `<p class="rd-drawer__note">Four links out from this table. Orphans appear here when a target row is gone.</p>`)
          + `<div class="rd-drawer__section-title">Linked from</div>`
          + (meta.id === 'guests'
            ? kvRow('wedding_party', (f.tables.find(t => t.id === 'wedding_party') || { count: 0 }).count + ' rows')
              + kvRow('shot_lists', (f.tables.find(t => t.id === 'shot_lists') || { count: 0 }).count + ' rows')
            : kvRow('owner page', meta.owner));
      } else {
        body = `<div class="rd-drawer__hist">${esc(meta.lastEdited)} · Edited this table</div>`
          + `<div class="rd-drawer__hist">Created with the planner profile</div>`
          + `<p class="rd-drawer__note">Table-level activity, not row-level. For a single row&rsquo;s history, open the row and use its History tab.</p>`;
      }
      const foot = orphans && tab === 2
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdDhFixOrphans()">Fix all ${orphans}</button>`
          + `<button type="button" class="rd-btn" onclick="rdDhFullEditor()">Full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdDhExportTable()">Export CSV</button>`
          + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdDhOpenOwner('${esc(meta.ownerPanel)}')">Open ${esc(meta.owner)}</button>`;
      const badge = orphans
        ? orphans + ' orphaned links'
        : meta.status.label;
      slot.innerHTML = drawerChrome('Table · ' + (meta.group || 'hub').toLowerCase().split(' ')[0], meta.id,
        meta.count + ' records', badge, tabs, tab, body, foot, 'rdDhSetDrawerTab', 'rdDhCloseDrawer');
      slot.classList.add('is-open');
      return;
    }
    /* row drawer — Master: Row · Links · Raw · History; Fields kept (product). */
    const meta = f.tables.find(t => t.id === window._dhTableId) || f.tables[0];
    const row = meta.rows.find((r, i) => String(r._id || r.id || (meta.id + ':' + i)) === id) || meta.rows[0];
    if (!row) {
      window._dhDrawerKind = null;
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    const tab = Math.max(0, Math.min(ROW_DRAWER_TABS.length - 1, parseInt(window._dhDrawerTab, 10) || 0));
    const tabs = ROW_DRAWER_TABS;
    const cols = columnsFor([row], meta.def);
    const allCols = allColumnsFor(row);
    let body = '';
    if (tab === 0) {
      body = cols.slice(0, 7).map(c => fieldRow(c, esc(cellVal(row, c)))).join('')
        + `<p class="rd-drawer__note">${Math.max(0, allCols.length - 7)} more fields on the Fields tab. This view writes to the same record the owner page writes to.</p>`;
    } else if (tab === 1) {
      body = `<div class="rd-drawer__section-title">Fields · ${allCols.length}</div>`
        + allCols.map(c => fieldRow(c, esc(cellVal(row, c)))).join('')
        + `<p class="rd-drawer__note">Every column on this row. Same record the owner page edits — not a separate copy.</p>`;
    } else if (tab === 2) {
      const outs = rowLinksOut(row, meta);
      const incomplete = outs.some(l => l.tone === 'warn');
      body = `<div class="rd-drawer__section-title">Links out · ${outs.length}</div>`
        + outs.map(l => kvRow(l.label, l.value, l.tone)).join('')
        + (incomplete
          ? `<div class="rd-dh-drawer__callout">One link points at something incomplete. The link itself is valid; the thing it points at is incomplete, and the tab distinguishes those two failures.</div>`
          : `<p class="rd-drawer__note">A valid link pointing at an incomplete thing is distinguished from a broken link.</p>`)
        + `<div class="rd-drawer__section-title">Linked from</div>`
        + kvRow('shot_lists', '—')
        + kvRow('wedding_party', '—');
    } else if (tab === 3) {
      let json = {};
      allCols.forEach(c => { json[c] = row[c]; });
      body = `<pre class="rd-dh-sql__pre">${esc(JSON.stringify(json, null, 2))}</pre>`
        + `<p class="rd-drawer__note">Raw is read-only — so you can see the real field names before writing a migration.</p>`;
    } else {
      body = `<div class="rd-drawer__hist">Today · fields changed</div>`
        + `<div class="rd-drawer__hist">Created with this record</div>`
        + `<p class="rd-drawer__note">The same history the owner page shows, because it is the same record.</p>`;
    }
    const foot = `<button type="button" class="rd-btn" onclick="rdDhOpenOwner('${esc(meta.ownerPanel)}')">Open in ${esc(meta.owner)}</button>`
      + `<button type="button" class="rd-btn rd-btn--primary" onclick="rdDhFullEditor()">Full editor</button>`;
    slot.innerHTML = drawerChrome('Row · ' + meta.id + ' · id ' + String(row._id || row.id || '—').slice(0, 8),
      rowLabel(row, meta.def), allCols.length + ' fields', cellVal(row, 'rsvp') !== '—' ? cellVal(row, 'rsvp') : (cellVal(row, 'status') !== '—' ? cellVal(row, 'status') : 'Record'),
      tabs, tab, body, foot, 'rdDhSetDrawerTab', 'rdDhCloseDrawer');
    slot.classList.add('is-open');
  }

  function fieldRow(label, valueHtml) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${valueHtml}</strong></div>`;
  }

  function drawerChrome(eyebrow, title, sub, badge, tabs, tab, body, foot, tabFn, closeFn) {
    return `<aside class="rd-drawer rd-dh-drawer" role="dialog" aria-label="${esc(title)}">
      <div class="rd-drawer__head">
        <button type="button" class="rd-drawer__close" onclick="${closeFn}()" aria-label="Close">✕</button>
        <div class="rd-drawer__eyebrow">${esc(eyebrow)}</div>
        <h2 class="rd-drawer__title">${esc(title)}</h2>
        <div class="rd-dh-drawer__meta"><span>${esc(sub)}</span><span>${esc(badge)}</span></div>
        <div class="rd-drawer__tabs">${tabs.map((t, i) =>
          `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="${tabFn}(${i})">${esc(t)}</button>`
        ).join('')}</div>
      </div>
      <div class="rd-drawer__body">${body}</div>
      <div class="rd-drawer__foot">${foot}</div>
    </aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdDhSetPageView(view) {
    if (view === 'table') {
      if ((window._dhMode || 'overview') !== 'table') rdDhOpenTable(window._dhTableId || 'guests');
      if (typeof setSavedView === 'function') setSavedView('data-hub-page', 'table');
      return;
    }
    if ((window._dhMode || 'overview') === 'table') rdDhBackOverview();
    if (typeof setSavedView === 'function') setSavedView('data-hub-page', 'overview');
  }
  function rdDhSetSurface(s) {
    window._dhSurface = s || 'tables';
    renderDataHubRd();
  }
  function rdDhSetTableSurface(s) {
    window._dhTableSurface = (s === 'schema' || s === 'sql') ? s : 'rows';
    renderDataHubRd();
  }
  function rdDhOpenTable(id) {
    window._dhMode = 'table';
    window._dhTableId = id || 'guests';
    window._dhTableSurface = 'rows';
    window._dhSel = new Set();
    window._dhDrawerKind = 'table';
    window._dhDrawerId = window._dhTableId;
    window._dhDrawerTab = 0;
    const def = hubDef(window._dhTableId);
    if (def.cwp && typeof setDataHubContext === 'function') {
      const cat = typeof dataHubCategoryForTableKey === 'function' ? dataHubCategoryForTableKey(def.cwp) : null;
      if (cat) setDataHubContext(cat, def.cwp);
    }
    renderDataHubRd();
  }
  function rdDhBackOverview() {
    window._dhMode = 'overview';
    window._dhDrawerKind = null;
    window._dhDrawerId = null;
    window._dhSel = new Set();
    renderDataHubRd();
  }
  function rdDhOpenRow(tableId, rowId) {
    window._dhMode = 'table';
    window._dhTableId = tableId;
    window._dhDrawerKind = 'row';
    window._dhDrawerId = rowId;
    window._dhDrawerTab = 0;
    renderDataHubRd();
  }
  function rdDhCloseDrawer() {
    window._dhDrawerKind = null;
    window._dhDrawerId = null;
    const slot = document.getElementById('data-hub-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdDhSetDrawerTab(i) {
    window._dhDrawerTab = i;
    renderDhDrawer();
  }
  function rdDhSetRailView(viewId) {
    window._dhRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('data-hub', window._dhRailView);
    if (window._dhMode === 'table' && viewId && HUB_TABLES.some(t => t.id === viewId)) {
      rdDhOpenTable(viewId);
      return;
    }
    window._dhMode = 'overview';
    renderDataHubRd();
  }
  function rdDhSelectRailTable(id) {
    rdDhOpenTable(id);
  }
  function rdDhCycleSort() {
    window._dhSort = window._dhSort === 'name' ? 'records' : 'name';
    renderDataHubRd();
  }
  function rdDhOpenSort(btn) {
    if (typeof window.rdPickOne !== 'function') {
      rdDhCycleSort();
      return;
    }
    window.rdPickOne(btn, [
      { value: 'records', label: 'Sort by records' },
      { value: 'name', label: 'Sort by name' }
    ], window._dhSort || 'records', val => {
      window._dhSort = val || 'records';
      renderDataHubRd();
    });
  }
  function rdDhCycleFilter(field) {
    const list = dhFilterOptions(field).map(o => o.value);
    const cur = (window._dhUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._dhUiFilters = window._dhUiFilters || {};
    window._dhUiFilters[field] = list[(i < 0 ? 0 : i + 1) % list.length];
    renderDataHubRd();
  }
  function rdDhOpenFilter(btn, field) {
    const opts = dhFilterOptions(field);
    const cur = (window._dhUiFilters || {})[field] || 'all';
    if (typeof window.rdPickOne !== 'function') {
      rdDhCycleFilter(field);
      return;
    }
    window.rdPickOne(btn, opts, cur, val => {
      window._dhUiFilters = window._dhUiFilters || {};
      window._dhUiFilters[field] = val || 'all';
      renderDataHubRd();
    });
  }
  function rdDhClearFilter(field) {
    window._dhUiFilters[field] = 'all';
    renderDataHubRd();
  }
  async function rdDhOpenSearch() {
    const cur = window._dhSearch || '';
    let q = cur;
    if (typeof covPrompt === 'function') {
      q = await covPrompt('Search', cur);
      if (q === null) return;
    } else {
      q = window.prompt('Search', cur);
      if (q === null) return;
    }
    window._dhSearch = String(q || '').trim();
    renderDataHubRd();
  }
  function rdDhClearSearch() {
    window._dhSearch = '';
    renderDataHubRd();
  }
  function rdDhOpenColumns(btn) {
    syncDhColumnRegistry();
    if (window.rdColumns && typeof window.rdColumns.openChooser === 'function') {
      window.rdColumns.openChooser(btn, dhViewKey());
    }
  }
  function dhHeightStorageKey(scope) {
    const profile = typeof window.activeProfile !== 'undefined' && window.activeProfile != null
      ? window.activeProfile : 'default';
    return 'rdRowHeight:' + profile + ':' + scope;
  }
  function rdDhSetRowHeight(val) {
    const scope = dhViewKey();
    try { localStorage.setItem(dhHeightStorageKey(scope), val || 'default'); } catch (e) { /* private mode */ }
    const root = document.getElementById('panel-data-hub');
    if (typeof window.rdStdApplyRowHeight === 'function') window.rdStdApplyRowHeight(scope, root);
    dhApplyTableChrome();
    renderDhToolbar();
  }
  function rdDhOpenRowHeight(btn) {
    const scope = dhViewKey();
    const cur = typeof window.rdStdHeightLabel === 'function' ? window.rdStdHeightLabel(scope) : 'default';
    if (typeof window.rdPickOne !== 'function') {
      rdDhCycleRowHeight();
      return;
    }
    window.rdPickOne(btn, [
      { value: 'compact', label: 'Compact' },
      { value: 'default', label: 'Default' },
      { value: 'tall', label: 'Tall' }
    ], cur, rdDhSetRowHeight);
  }
  function rdDhAutoFit(btn) {
    const table = dhActiveTable();
    if (!table) {
      if (typeof showToast === 'function') showToast('No table to fit on this view', 'info');
      return 0;
    }
    let n = 0;
    if (typeof window.rdAutoFitTable === 'function') n = window.rdAutoFitTable(btn || table);
    if (typeof showToast === 'function') showToast(n ? 'Auto-fitted columns' : 'Could not auto-fit columns', n ? 'ok' : 'info');
    return n;
  }
  function rdDhCycleRowHeight() {
    const scope = dhViewKey();
    const root = document.getElementById('panel-data-hub');
    if (typeof window.rdStdCycleRowHeight === 'function') {
      window.rdStdCycleRowHeight(scope, root);
    }
    dhApplyTableChrome();
    renderDhToolbar();
  }
  function rdDhToggleSel(id) {
    if (window._dhSel.has(id)) window._dhSel.delete(id);
    else window._dhSel.add(id);
    renderDhBulk();
    renderTableBrowser();
  }
  function rdDhBulkClear() {
    window._dhSel.clear();
    renderDataHubRd();
  }
  async function rdDhBulk(action) {
    const n = window._dhSel.size;
    if (!n) return;
    if (action === 'export') {
      rdDhExportTable();
      return;
    }
    if (action === 'delete') {
      const ok = typeof covConfirm === 'function'
        ? await covConfirm('Delete ' + n + ' selected row(s)? Download a backup first if unsure.')
        : window.confirm('Delete ' + n + ' selected row(s)?');
      if (!ok) return;
      const def = hubDef(window._dhTableId);
      if (!def.derived && Array.isArray(data[def.entity])) {
        data[def.entity] = data[def.entity].filter((r, i) => {
          const id = String(r._id || r.id || (def.id + ':' + i));
          return !window._dhSel.has(id);
        });
        if (typeof save === 'function') save();
      }
      window._dhSel.clear();
      renderDataHubRd();
      return;
    }
    if (typeof covAlert === 'function') {
      covAlert('Bulk “' + action + '” applies on the owner page for this table, or use Full editor on a selected row.');
    }
  }
  function rdDhBackup() {
    if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
    else if (typeof exportJSON === 'function') exportJSON();
  }
  function rdDhRestore() {
    const input = document.getElementById('importInput');
    if (input) input.click();
    else if (typeof covAlert === 'function') covAlert('Use Restore from file in the top bar, or choose a .sqlite / .json backup.');
  }
  function rdDhPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdDhExportTable() {
    const meta = figures().tables.find(t => t.id === window._dhTableId);
    if (!meta) return;
    const cols = columnsFor(meta.rows, meta.def);
    const rows = filteredRows(meta).map(r => {
      const o = {};
      cols.forEach(c => { o[c] = cellVal(r, c); });
      return o;
    });
    if (typeof exportSectionCSV === 'function') exportSectionCSV('Hub · ' + meta.id, rows);
  }
  function rdDhExportAll() {
    const f = figures();
    const rows = f.tables.map(t => ({
      table: t.id, records: t.count, owner: t.owner, lastEdited: t.lastEdited, status: t.status.label
    }));
    if (typeof exportSectionCSV === 'function') exportSectionCSV('Database Hub · all tables', rows);
  }
  function rdDhFullEditor() {
    const def = hubDef(window._dhTableId);
    if (window._dhDrawerKind === 'row' && def.cwp && typeof openRecordEditor === 'function') {
      const meta = figures().tables.find(t => t.id === def.id);
      const idx = meta ? meta.rows.findIndex((r, i) => String(r._id || r.id || (def.id + ':' + i)) === window._dhDrawerId) : -1;
      if (idx >= 0) {
        try { openRecordEditor(def.cwp, idx); return; } catch (e) { /* fall through */ }
      }
    }
    if (def.cwp && typeof openDataHub === 'function') {
      /* stay in redesign; open table drawer */
      window._dhDrawerKind = 'table';
      window._dhDrawerId = def.id;
      window._dhDrawerTab = 0;
      renderDhDrawer();
      return;
    }
    rdDhOpenOwner(def.ownerPanel);
  }
  function rdDhOpenOwner(panel) {
    if (typeof showPanel === 'function') showPanel(panel);
  }
  function rdDhFixOrphans() {
    const tableNames = new Set(arr(data && data.tables).map(t => String(t.name || '').toLowerCase()));
    let n = 0;
    arr(data && data.guests).forEach(g => {
      const tid = String(g.table || g.table_id || g.tableId || '').trim();
      if (!tid) return;
      const key = tid.toLowerCase().replace(/^table\s+/i, '');
      const hit = tableNames.has(tid.toLowerCase()) || tableNames.has(key);
      if (!hit) {
        g.table = '';
        if (g.table_id != null) g.table_id = '';
        if (g.tableId != null) g.tableId = '';
        n++;
      }
    });
    if (n && typeof save === 'function') save();
    if (typeof showToast === 'function') showToast(n ? ('Cleared ' + n + ' orphaned table link' + (n === 1 ? '' : 's')) : 'No orphans found', 'ok');
    renderDataHubRd();
  }
  function rdDhFixAll() {
    rdDhFixOrphans();
    if (typeof covAlert === 'function') {
      covAlert('Safe link fixes applied where possible. Relink payments and attach contract schedules from their owner pages.');
    }
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function applyViewMode() {
    const mode = window._dhMode || 'overview';
    const ov = document.getElementById('dh-view-overview');
    const tv = document.getElementById('dh-view-table');
    if (ov) ov.hidden = mode !== 'overview';
    if (tv) tv.hidden = mode !== 'table';
  }

  function renderDataHubRd() {
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('data-hub', window._dhRailView || 'all');
      if (saved && ['all', 'with', 'empty', 'attention', 'edited'].indexOf(saved) >= 0) {
        window._dhRailView = saved;
      }
      const page = getSavedView('data-hub-page', window._dhMode || 'overview');
      if (page === 'table' || page === 'overview') {
        /* Only restore overview→table on first paint of the panel; don't fight an
           in-progress table open from a rail click. */
        if (!window._dhPageRestored) {
          window._dhPageRestored = true;
          if (page === 'table' && (window._dhMode || 'overview') !== 'table') {
            window._dhMode = 'table';
          }
        }
      }
    }
    uedDataHubShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('data-hub');
    applyViewMode();
    renderDhStats();
    renderDhSectionTabs();
    renderDhToolbar();
    renderDhBulk();
    if (window._dhMode === 'table') renderTableBrowser();
    else renderOverview();
    renderDhDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'data-hub'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('data-hub');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('data-hub');
  }

  /* Public rail helpers */
  function dhRailCounts() {
    const f = figures();
    return {
      all: f.tableCount,
      with: f.withRecords,
      empty: f.empty,
      attention: f.attentionCount,
      edited: f.edited,
      records: f.records,
      dbMb: f.dbMb,
      tables: f.tables
    };
  }
  function dhFigures() { return figures(); }

  window.uedDataHubShell = uedDataHubShellRd;
  window.renderDataHubRd = renderDataHubRd;
  window.renderDataHubPage = renderDataHubRd;
  window.rdDhSetPageView = rdDhSetPageView;
  window.rdDhSetSurface = rdDhSetSurface;
  window.rdDhSetTableSurface = rdDhSetTableSurface;
  window.rdDhOpenTable = rdDhOpenTable;
  window.rdDhBackOverview = rdDhBackOverview;
  window.rdDhOpenRow = rdDhOpenRow;
  window.rdDhCloseDrawer = rdDhCloseDrawer;
  window.rdDhSetDrawerTab = rdDhSetDrawerTab;
  window.rdDhSetRailView = rdDhSetRailView;
  window.rdDhSelectRailTable = rdDhSelectRailTable;
  window.rdDhCycleSort = rdDhCycleSort;
  window.rdDhOpenSort = rdDhOpenSort;
  window.rdDhCycleFilter = rdDhCycleFilter;
  window.rdDhOpenFilter = rdDhOpenFilter;
  window.rdDhClearFilter = rdDhClearFilter;
  window.rdDhOpenSearch = rdDhOpenSearch;
  window.rdDhClearSearch = rdDhClearSearch;
  window.rdDhOpenColumns = rdDhOpenColumns;
  window.rdDhAutoFit = rdDhAutoFit;
  window.rdDhCycleRowHeight = rdDhCycleRowHeight;
  window.rdDhOpenRowHeight = rdDhOpenRowHeight;
  window.rdDhToggleSel = rdDhToggleSel;
  window.rdDhBulkClear = rdDhBulkClear;
  window.rdDhBulk = rdDhBulk;
  window.rdDhBackup = rdDhBackup;
  window.rdDhRestore = rdDhRestore;
  window.rdDhPrint = rdDhPrint;
  window.rdDhExportTable = rdDhExportTable;
  window.rdDhExportAll = rdDhExportAll;
  window.rdDhFullEditor = rdDhFullEditor;
  window.rdDhOpenOwner = rdDhOpenOwner;
  window.rdDhFixOrphans = rdDhFixOrphans;
  window.rdDhFixAll = rdDhFixAll;
  window.dhRailCounts = dhRailCounts;
  window.dhFigures = dhFigures;
  window.HUB_TABLES = HUB_TABLES;

  /* Override legacy renderer */
  const _legacyRenderDataHub = typeof window.renderDataHub === 'function' ? window.renderDataHub : null;
  window.renderDataHub = function () {
    renderDataHubRd();
  };
  window._legacyRenderDataHub = _legacyRenderDataHub;

  const _legacyOpenDataHub = typeof window.openDataHub === 'function' ? window.openDataHub : null;
  window.openDataHub = function (category, table) {
    if (table) {
      const def = HUB_TABLES.find(t => t.cwp === table || t.entity === table || t.id === table);
      window._dhMode = 'table';
      window._dhTableId = def ? def.id : (typeof table === 'string' ? table : 'guests');
    } else if (category && !table) {
      /* category from legacy — land on overview filtered, or first table in cat */
      window._dhMode = 'overview';
    }
    if (typeof showPanel === 'function') showPanel('data-hub', true);
    else renderDataHubRd();
  };

  function hookDhPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS['data-hub'] = function () { renderDataHubRd(); };
    }
  }
  hookDhPanelRenderer();
  var _showPanelDh = window.showPanel;
  if (typeof _showPanelDh === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelDh.call(window, id, forceOpen);
      hookDhPanelRenderer();
      return out;
    };
  }
})();
