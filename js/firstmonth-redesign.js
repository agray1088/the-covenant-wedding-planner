/* First-Month Rhythms — Master s30 · 13d · Cards 32g · Year 32h
   Views: Table (default, with the first-year plot under it) | Cards | Year view.
     — switching views never reloads the page.
   Columns (13d): Rhythm · Cadence · Owner · Area · Kept · Since.
   Rail: All rhythms · Daily · Weekly · Monthly · Yearly + Since-the-wedding
         meters + Group by Cadence / Owner / Area (planner-context-sidebar.js).
   Drawer (1 record): Rhythm · Cadence · Streak · History.
   Primary: New rhythm.

   Master honesty rules built in here:
   - 32g not-yet state: Kept shows "—" before the start date, never "0".
     Zero implies failure; an em dash implies it has not begun.
   - 32g provenance: two cards cite where the rhythm came from — the money
     rhythm from counseling session 04, the prayer rhythm from the vision
     document. Figures are read from the owning record, never typed twice.
   - 32h marks are a horizon, not a density: ● committed · ○ intended, to be
     reviewed · — beyond the horizon. No mark ever means "failed". */
(function () {
  'use strict';

  window._fmMode = window._fmMode || 'table';
  window._fmRailView = window._fmRailView || 'all';
  window._fmGroupBy = window._fmGroupBy || 'cadence';
  window._fmUiFilters = window._fmUiFilters || { cadence: 'all', owner: 'both', area: 'all' };
  window._fmSel = window._fmSel instanceof Set ? window._fmSel : new Set();
  window._fmDrawerId = window._fmDrawerId || null;
  window._fmDrawerTab = window._fmDrawerTab || 0;

  const SHELL_VER = 'firstmonth-rd-s30';
  const DRAWER_TABS = ['Rhythm', 'Cadence', 'Streak', 'History'];
  const CADENCE_ORDER = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const CADENCE_LABELS = ['Every night', 'Weekly', 'Weekly · Thu', 'Weekly · Sun', 'Monthly', 'Monthly · 1st', 'Yearly · 8 Nov'];
  const AREAS = ['Spiritual', 'Attention', 'Rest', 'Communication', 'Hospitality', 'Money', 'Us', 'Covenant', 'Faith', 'Home', 'Other'];
  const OWNERS = ['Both', 'Ama', 'Kwesi', 'Ama calls it', 'Kwesi prepares', 'Alternating'];
  /* Horizon = how long the rhythm is meant to last. Drives the 32h marks. */
  const HORIZONS = ['First month', 'First year', 'Ongoing', 'Anniversary'];

  /* Master 13d rhythms. `startISO` is the real begin date (the day after the
     wedding onward); `since` is its short display; `source` is the provenance
     citation shown on Cards (32g); `horizon` drives the Year plot (32h). */
  const SEED_RHYTHMS = [
    {
      id: 'pray', title: 'Pray together before sleep',
      meaning: 'Out loud, by name, even on the short nights.',
      cadence: 'Every night', cadenceKind: 'Daily', owner: 'Both', area: 'Spiritual',
      kept: '14 nights', since: '9 Nov', startISO: '2026-11-09', horizon: 'Ongoing',
      source: { label: 'From the vision document', page: 'Vision & Foundation', go: "showPanel('vision')" }
    },
    {
      id: 'screens', title: 'No screens after 10pm',
      meaning: 'The phones charge in the kitchen, not the bedroom.',
      cadence: 'Every night', cadenceKind: 'Daily', owner: 'Both', area: 'Attention',
      kept: '9 of 14', since: '9 Nov', startISO: '2026-11-09', horizon: 'First year'
    },
    {
      id: 'sabbath', title: 'Sabbath · Sunday afternoon, nothing scheduled',
      meaning: 'No errands, no wedding admin, no catching up on work.',
      cadence: 'Weekly · Sun', cadenceKind: 'Weekly', owner: 'Both', area: 'Rest',
      kept: '2 of 2 weeks', since: '15 Nov', startISO: '2026-11-15', horizon: 'Ongoing'
    },
    {
      id: 'state', title: 'The state-of-us conversation',
      meaning: 'Twenty minutes. What is good, what is heavy, what is next.',
      cadence: 'Weekly · Thu', cadenceKind: 'Weekly', owner: 'Ama calls it', area: 'Communication',
      kept: '2 of 2 weeks', since: '13 Nov', startISO: '2026-11-13', horizon: 'First year'
    },
    {
      id: 'meal', title: 'One meal with someone outside the two of us',
      meaning: 'So the marriage does not close in on itself.',
      cadence: 'Weekly', cadenceKind: 'Weekly', owner: 'Both', area: 'Hospitality',
      kept: '1 of 2 weeks', since: '9 Nov', startISO: '2026-11-09', horizon: 'First month'
    },
    {
      id: 'church', title: 'Church together, in person',
      meaning: 'The same church, the same seats, most Sundays.',
      cadence: 'Weekly · Sun', cadenceKind: 'Weekly', owner: 'Both', area: 'Spiritual',
      kept: '2 of 2 weeks', since: '15 Nov', startISO: '2026-11-15', horizon: 'Ongoing'
    },
    {
      id: 'money', title: 'Money hour · every account open on the table',
      meaning: 'No purchase over $200 without both of us — the rule from counseling.',
      cadence: 'Monthly · 1st', cadenceKind: 'Monthly', owner: 'Kwesi prepares', area: 'Money',
      kept: '', since: '1 Dec', startISO: '2026-12-01', horizon: 'Ongoing',
      source: { label: 'From counseling · session 04', page: 'Premarital Counseling', go: "showPanel('counseling')" }
    },
    {
      id: 'nightout', title: 'A night out that costs something',
      meaning: 'Booked, paid for, on the calendar — not "sometime".',
      cadence: 'Monthly', cadenceKind: 'Monthly', owner: 'Alternating', area: 'Us',
      kept: '', since: '1 Dec', startISO: '2026-12-01', horizon: 'First year'
    },
    {
      id: 'vows', title: 'Read the vows aloud on the anniversary',
      meaning: 'The same page, read to each other, once a year.',
      cadence: 'Yearly · 8 Nov', cadenceKind: 'Yearly', owner: 'Both', area: 'Covenant',
      kept: '', since: '8 Nov 2027', startISO: '2027-11-08', horizon: 'Anniversary'
    }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));
  function jsId(id) { return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function parseISO(v) {
    if (!v) return null;
    const d = new Date(String(v).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  function weddingDate() {
    const d = store();
    return parseISO((d.setup && d.setup.date) || '');
  }
  function beginsDate() {
    const wed = weddingDate();
    if (!wed) return parseISO('2026-11-09');
    const next = new Date(wed.getTime());
    next.setDate(next.getDate() + 1);
    return next;
  }
  /* The rhythms' own "present": a fortnight into the first month, so the daily
     and weekly streaks read as kept while December rhythms have not begun.
     This is what makes the 32g "—, not 0" rule land on the right rows. */
  function fmNow() {
    const b = beginsDate();
    if (!b) return parseISO('2026-11-23');
    const n = new Date(b.getTime());
    n.setDate(n.getDate() + 14);
    return n;
  }
  function fmtShort(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  function fmtLong(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtBeginsShort(dt) {
    if (!dt) return '—';
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
  }

  function cadenceKindOf(c) {
    const raw = String(c || '').toLowerCase();
    if (/year|annual|anniversary/.test(raw)) return 'Yearly';
    if (/month/.test(raw)) return 'Monthly';
    if (/week/.test(raw)) return 'Weekly';
    if (/night|day|daily/.test(raw)) return 'Daily';
    return 'Weekly';
  }
  function horizonOf(r) {
    const h = String(r.horizon || '').trim();
    if (HORIZONS.includes(h)) return h;
    if (r.cadenceKind === 'Yearly' || /anniversary/i.test(String(r.cadence || ''))) return 'Anniversary';
    return 'Ongoing';
  }

  const LEGACY = /Weekly Sabbath|Weekly Date Night|Daily Devotion|Budget Meeting|Monthly Check-In|Local Church Plan|Keep Simple|Conversations To Have|New rhythm/i;

  function ensureData() {
    const d = store();
    if (!d.firstmonth || typeof d.firstmonth !== 'object' || Array.isArray(d.firstmonth)) d.firstmonth = {};
    if (!Array.isArray(d.rhythms)) d.rhythms = [];
    const looksLegacy = d.rhythms.length > 0 && d.rhythms.every(r => LEGACY.test(String(r.title || r.name || '')));
    /* Seed / replace once for Master s30. Existing Master rows are left alone. */
    if ((!d.rhythms.length && !d.firstmonth._fmS30Seeded) || (looksLegacy && !d.firstmonth._fmS30Seeded)) {
      d.rhythms = SEED_RHYTHMS.map(seed => ({
        _id: 'fm-' + seed.id,
        title: seed.title,
        meaning: seed.meaning,
        cadence: seed.cadence,
        cadenceKind: seed.cadenceKind,
        owner: seed.owner,
        area: seed.area,
        kept: seed.kept,
        since: seed.since,
        startISO: seed.startISO,
        horizon: seed.horizon,
        source: seed.source || null,
        paused: false,
        status: seed.kept && !/^0\b/.test(seed.kept) ? 'Kept' : 'Planned',
        history: [
          { when: '2026-07', who: 'Ama', what: 'Written into the plan' },
          { when: seed.startISO, who: '', what: 'Rhythm begins' }
        ]
      }));
      d.firstmonth._fmS30Seeded = true;
      d.firstmonth._fm13dSeeded = true;
    } else {
      d.rhythms.forEach(r => {
        if (!r.cadenceKind) r.cadenceKind = cadenceKindOf(r.cadence || r.frequency);
        if (r.title == null && r.name) r.title = r.name;
        if (r.meaning == null) r.meaning = r.subtitle || '';
        if (r.kept == null) r.kept = r.streak || '';
        if (r.since == null) r.since = r.starts || '';
        if (r.owner == null) r.owner = 'Both';
        if (r.area == null) r.area = r.category || 'Other';
        if (r.paused == null) r.paused = false;
        if (r.horizon == null) r.horizon = horizonOf(r);
        if (!Array.isArray(r.history)) r.history = [];
      });
    }
    return d;
  }

  function allRows() {
    const d = ensureData();
    return d.rhythms.map((row, index) => {
      const kind = row.cadenceKind || cadenceKindOf(row.cadence || row.frequency);
      const start = parseISO(row.startISO) || (row.since ? parseISO(sinceToISO(row.since)) : null);
      return {
        row, index,
        id: row._id || ('fm:' + index),
        title: String(row.title || row.name || 'Untitled rhythm'),
        meaning: String(row.meaning || row.subtitle || ''),
        cadence: String(row.cadence || row.frequency || 'Weekly'),
        cadenceKind: kind,
        owner: String(row.owner || 'Both'),
        area: String(row.area || 'Other'),
        kept: String(row.kept || row.streak || ''),
        since: String(row.since || row.starts || ''),
        startDate: start,
        horizon: horizonOf({ horizon: row.horizon, cadence: row.cadence, cadenceKind: kind }),
        source: row.source || null,
        history: Array.isArray(row.history) ? row.history : [],
        paused: !!row.paused
      };
    });
  }

  /* Best-effort parse of a "since" display string into an ISO date, only used
     as a fallback when a row predates startISO. */
  function sinceToISO(since) {
    const m = String(since || '').match(/(\d{1,2})\s+([A-Za-z]{3,})(?:\s+(\d{4}))?/);
    if (!m) return '';
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const mi = months[m[2].slice(0, 3).toLowerCase()];
    if (mi == null) return '';
    const yr = m[3] ? Number(m[3]) : (beginsDate() ? beginsDate().getFullYear() : 2026);
    return yr + '-' + pad2(mi + 1) + '-' + pad2(Number(m[1]));
  }

  function findById(id) { return allRows().find(r => r.id === id) || null; }

  /* Has the rhythm started yet, relative to the rhythms' own present? */
  function notBegun(r) {
    if (!r.startDate) return false;
    const now = fmNow();
    return now ? r.startDate.getTime() > now.getTime() : false;
  }
  /* 32g: an em dash before the start date, never a bare 0. */
  function keptDisplay(r) {
    if (notBegun(r)) return '—';
    return r.kept || '—';
  }

  function matchesFilters(r) {
    const ui = window._fmUiFilters || {};
    const rail = window._fmRailView || 'all';
    if (rail !== 'all' && r.cadenceKind.toLowerCase() !== rail) return false;
    if (ui.cadence && ui.cadence !== 'all' && r.cadenceKind.toLowerCase() !== String(ui.cadence).toLowerCase()) return false;
    if (ui.owner && ui.owner !== 'all' && ui.owner !== 'both' && r.owner !== ui.owner) return false;
    if (ui.area && ui.area !== 'all' && r.area !== ui.area) return false;
    return true;
  }
  function visibleRows() { return allRows().filter(matchesFilters); }

  function isKept(r) {
    if (r.paused) return false;
    const k = String(r.kept || '');
    if (!k) return false;
    if (/^0\b/.test(k)) return false;
    return true;
  }

  function fmFigures() {
    const rows = allRows();
    const by = { Daily: 0, Weekly: 0, Monthly: 0, Yearly: 0 };
    const byHorizon = { 'First month': 0, 'First year': 0, 'Ongoing': 0, 'Anniversary': 0 };
    rows.forEach(r => {
      by[r.cadenceKind] = (by[r.cadenceKind] || 0) + 1;
      byHorizon[r.horizon] = (byHorizon[r.horizon] || 0) + 1;
    });
    const kept = rows.filter(isKept).length;
    const begins = beginsDate();
    const pray = rows.find(r => /pray together/i.test(r.title));
    const streakLabel = pray && isKept(pray)
      ? 'Prayer · ' + (pray.kept || '14 nights')
      : (kept ? (kept + ' kept') : '—');
    return {
      rhythms: rows.length,
      daily: by.Daily || 0,
      weekly: by.Weekly || 0,
      monthly: by.Monthly || 0,
      yearly: by.Yearly || 0,
      ongoing: byHorizon['Ongoing'] || 0,
      firstYear: byHorizon['First year'] || 0,
      anniversary: byHorizon['Anniversary'] || 0,
      keptThisMonth: kept,
      streaks: streakLabel,
      longestStreak: streakLabel,
      beginsShort: fmtBeginsShort(begins),
      beginsLong: fmtLong(begins),
      startsLong: fmtLong(begins),
      review: 'Every anniversary',
      byCadence: by
    };
  }
  function fmRailCounts() {
    const f = fmFigures();
    return { all: f.rhythms, daily: f.daily, weekly: f.weekly, monthly: f.monthly, yearly: f.yearly };
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdFmTemplate()">Add from a template</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmPrint()">Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdFmExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdFmAdd()">New rhythm</button>';
  }

  function ensureShell() {
    const panel = document.getElementById('panel-firstmonth');
    if (!panel) return;
    panel.classList.add('ued-scope', 'firstmonth-mockup');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
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
      <div class="rd-bulkbar" id="firstmonth-bulk-bar" hidden></div>
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
  }

  function renderStats() {
    const host = document.getElementById('firstmonth-stats');
    if (!host) return;
    const f = fmFigures();
    const mode = window._fmMode || 'table';
    let stats;
    if (mode === 'cards') {
      stats = [
        { label: 'Rhythms', value: String(f.rhythms) },
        { label: 'Kept', value: String(f.keptThisMonth) },
        { label: 'Daily', value: String(f.daily) },
        { label: 'Weekly', value: String(f.weekly) },
        { label: 'Begins', value: f.beginsShort }
      ];
    } else if (mode === 'year') {
      stats = [
        { label: 'Rhythms', value: String(f.rhythms) },
        { label: 'Ongoing', value: String(f.ongoing) },
        { label: 'First year', value: String(f.firstYear) },
        { label: 'Anniversary', value: String(f.anniversary) },
        { label: 'Begins', value: f.beginsShort }
      ];
    } else {
      stats = [
        { label: 'Rhythms', value: String(f.rhythms) },
        { label: 'Daily', value: String(f.daily) },
        { label: 'Weekly', value: String(f.weekly) },
        { label: 'Monthly', value: String(f.monthly) },
        { label: 'Begins', value: f.beginsShort }
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

  function filterChip(label, field) {
    const ui = window._fmUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all' && !(field === 'owner' && cur === 'both');
    const display = field === 'owner' && (!cur || cur === 'all') ? 'both' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdFmCycleFilter('${field}')">${esc(label + ': ' + display)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdFmClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderToolbar() {
    const host = document.getElementById('firstmonth-toolbar');
    if (!host) return;
    const mode = window._fmMode || 'table';
    let left = filterChip('Cadence', 'cadence') + filterChip('Owner', 'owner') + filterChip('Area', 'area');
    if (mode !== 'year') {
      left += (typeof rdSortChipHtml === 'function'
        ? rdSortChipHtml('Sort by cadence', "rdFmSortCadence()")
        : '<button type="button" class="rd-chip rd-chip--ghost" onclick="rdFmSortCadence()">Sort by cadence</button>');
    } else {
      left += '<span class="rd-fm-toolbar-note">● committed · ○ intended · — beyond the horizon</span>';
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      (mode === 'table' && typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('firstmonth') : '') +
      `<div class="rd-viewswitch" role="group" aria-label="First-month view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'year' ? ' is-active' : ''}" onclick="rdSetFirstmonthView('year')">Year view</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('firstmonth-bulk-bar');
    if (!host) return;
    const n = window._fmSel.size;
    if (!n || (window._fmMode || 'table') !== 'table') { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkCadence()">Change cadence</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkOwner()">Assign owner</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmBulkPause()">Pause</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdFmPrintCard()">Print the card</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdFmBulkClear()">Clear selection</button>`;
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

  function selectHtml(list, val) {
    const opts = list.slice();
    if (val && !opts.includes(val)) opts.push(val);
    return opts.map(x => `<option value="${esc(x)}"${String(x) === String(val || '') ? ' selected' : ''}>${esc(x)}</option>`).join('');
  }

  function groupItems() {
    const group = window._fmGroupBy || 'cadence';
    const rows = visibleRows();
    const map = {};
    rows.forEach(r => {
      let key = r.cadenceKind;
      if (group === 'owner') key = r.owner;
      else if (group === 'area') key = r.area;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    const keys = Object.keys(map);
    if (group === 'cadence') keys.sort((a, b) => CADENCE_ORDER.indexOf(a) - CADENCE_ORDER.indexOf(b));
    else keys.sort();
    return keys.map(k => ({ key: k, rows: map[k] }));
  }

  /* ── Year plot (32h) — a horizon, not a density ──────────────────────── */

  function yearMonths() {
    const start = beginsDate() || new Date();
    const months = [];
    for (let i = 0; i < 13; i++) {
      const dt = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({ key: dt.getFullYear() + '-' + dt.getMonth(), label: dt.toLocaleDateString('en-US', { month: 'short' }), dt });
    }
    return months;
  }
  function monthsBetween(from, to) {
    if (!from || !to) return null;
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  }
  /* ● committed · ○ intended, to be reviewed · — beyond the horizon.
     A mark never means "failed" — this records intent, not what happened. */
  function horizonMark(r, monthDate) {
    const start = r.startDate || beginsDate();
    const k = monthsBetween(new Date(start.getFullYear(), start.getMonth(), 1), monthDate);
    if (k == null || k < 0) return { ch: '—', cls: '' };
    const h = r.horizon;
    if (h === 'First month') {
      if (k === 0) return { ch: '●', cls: ' is-committed' };
      if (k <= 2) return { ch: '○', cls: ' is-intended' };
      return { ch: '—', cls: '' };
    }
    if (h === 'First year') {
      if (k <= 11) return { ch: '●', cls: ' is-committed' };
      return { ch: '○', cls: ' is-intended' };
    }
    if (h === 'Anniversary') {
      if (k >= 12) return { ch: '●', cls: ' is-committed' };
      return { ch: '○', cls: ' is-intended' };
    }
    /* Ongoing */
    return { ch: '●', cls: ' is-committed' };
  }

  function yearplotHtml(rows) {
    const months = yearMonths();
    const legend =
      '<span class="rd-yearplot__leg rd-yearplot__leg--committed">Committed</span>' +
      '<span class="rd-yearplot__leg rd-yearplot__leg--intended">Intended, to be reviewed</span>' +
      '<span class="rd-yearplot__leg rd-yearplot__leg--beyond">Beyond the horizon</span>';
    let html = `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">The first year</div>` +
      `<p class="rd-help">${rows.length} rhythm${rows.length === 1 ? '' : 's'}, plotted from the day after the wedding — how long each is meant to last, not whether it was kept</p></div>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdFmPrintCard()">Print the card</button>` +
      `</div>`;
    html += `<div class="rd-yearplot" id="firstmonth-year-plot">`;
    html += `<div class="rd-yearplot__months"><span></span>${months.map(m => `<b>${esc(m.label)}</b>`).join('')}</div>`;
    rows.forEach(r => {
      const short = r.title.length > 28 ? r.title.slice(0, 26) + '…' : r.title;
      html += `<div class="rd-yearplot__row" onclick="rdFmOpenDrawer('${jsId(r.id)}')"><strong title="${esc(r.title)}">${esc(short)}</strong>`;
      months.forEach(m => {
        const mark = horizonMark(r, m.dt);
        html += `<span class="rd-yearplot__cell${mark.cls}" title="${esc(r.title + ' · ' + m.label)}">${mark.ch}</span>`;
      });
      html += `</div>`;
    });
    if (!rows.length) html += `<div class="rd-empty">No rhythms match this view.</div>`;
    html += `<div class="rd-yearplot__legend">${legend}</div></div>`;
    return html;
  }

  /* ── Table (13d) ─────────────────────────────────────────────────────── */

  function renderTableView() {
    const host = document.getElementById('fm-view-table');
    if (!host) return;
    const groups = groupItems();
    const all = allRows();
    let html = `<div class="ued-table-wrap"><table class="ued-table rd-table rd-fm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Rhythm</th><th>Cadence</th><th>Owner</th><th>Area</th><th>Kept</th><th>Since</th>` +
      `</tr></thead><tbody>`;
    if (!groups.length) {
      html += `<tr><td colspan="7" class="rd-empty">No rhythms match this view.</td></tr>`;
    } else {
      groups.forEach(g => {
        const bandLabel = (window._fmGroupBy || 'cadence') === 'cadence'
          ? `${g.key} · ${g.rows.length} rhythm${g.rows.length === 1 ? '' : 's'}`
          : `${g.key} · ${g.rows.length}`;
        html += `<tr class="rd-group-row rd-fm-group"><td colspan="7">${esc(bandLabel)}</td></tr>`;
        g.rows.forEach(r => {
          const sel = window._fmSel.has(r.id);
          const sid = jsId(r.id);
          const open = window._fmDrawerId === r.id;
          html += `<tr class="rd-fm-row${sel ? ' is-selected' : ''}${r.paused ? ' is-paused' : ''}${open ? ' is-open' : ''}" data-fm-id="${esc(r.id)}" onclick="rdFmRowClick(event,'${sid}')">` +
            `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdFmToggleSel('${sid}')"></td>` +
            `<td class="rd-fm-rhythmcell">` +
            `<input class="no-currency rd-fm-title" data-currency="false" value="${esc(r.title)}" placeholder="Rhythm" onclick="event.stopPropagation()" oninput="rdFmSave(${r.index},'title',this.value)">` +
            `<textarea class="no-currency rd-fm-meaning" data-currency="false" rows="1" placeholder="What it means" onclick="event.stopPropagation()" oninput="rdFmSave(${r.index},'meaning',this.value)">${esc(r.meaning)}</textarea>` +
            `<span class="rd-fm-row__open">Open ›</span>` +
            `</td>` +
            `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" list="fm-cadence-list" value="${esc(r.cadence)}" oninput="rdFmSave(${r.index},'cadence',this.value)"></td>` +
            `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" list="fm-owner-list" value="${esc(r.owner)}" oninput="rdFmSave(${r.index},'owner',this.value)"></td>` +
            `<td onclick="event.stopPropagation()"><select onchange="rdFmSave(${r.index},'area',this.value)">${selectHtml(AREAS, r.area)}</select></td>` +
            `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" value="${esc(r.kept)}" placeholder="—" oninput="rdFmSave(${r.index},'kept',this.value)"></td>` +
            `<td onclick="event.stopPropagation()"><input class="no-currency" data-currency="false" value="${esc(r.since)}" placeholder="—" oninput="rdFmSave(${r.index},'since',this.value)"></td>` +
            `</tr>`;
        });
      });
    }
    html += `</tbody></table></div>`;
    html += `<datalist id="fm-cadence-list">${CADENCE_LABELS.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    html += `<datalist id="fm-owner-list">${OWNERS.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    html += `<button type="button" class="rd-fm-addbtn" onclick="rdFmAdd()"><span>+</span> Add a rhythm</button>`;
    html += yearplotHtml(all);
    host.innerHTML = html;
  }

  /* ── Cards (32g) ─────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('fm-view-cards');
    if (!host) return;
    const rows = visibleRows();
    const beginsLong = fmFigures().beginsLong;
    host.innerHTML = `<div class="rd-fm-cards">${rows.map(r => {
      const kept = keptDisplay(r);
      const notYet = notBegun(r);
      const startLabel = r.startDate ? fmtShort(r.startDate) : (r.since || '—');
      const sourceHtml = r.source
        ? `<p class="rd-fm-card__source"><span class="rd-fm-card__source-mark">↳</span>${
            r.source.go
              ? `<button type="button" class="rd-fm-card__source-link" onclick="event.stopPropagation();${esc(r.source.go)}">${esc(r.source.label)}</button>`
              : esc(r.source.label)
          }</p>`
        : '';
      return `<article class="rd-fm-card${r.paused ? ' is-paused' : ''}${notYet ? ' is-notyet' : ''}" onclick="rdFmOpenDrawer('${jsId(r.id)}')">` +
        `<header><h3>${esc(r.title)}</h3><span class="rd-fm-card__cadence">${esc(r.cadence)}</span></header>` +
        (r.meaning ? `<p class="rd-fm-card__meaning">${esc(r.meaning)}</p>` : '') +
        `<div class="rd-fm-card__meta">` +
        `<span><b>Owner</b> ${esc(r.owner)}</span>` +
        `<span><b>Area</b> ${esc(r.area)}</span>` +
        `<span><b>Starts</b> ${esc(startLabel)}</span>` +
        `<span><b>Kept</b> ${esc(kept)}${notYet ? ' <i class="rd-fm-card__notyet">not begun</i>' : ''}</span>` +
        `</div>` +
        sourceHtml +
        `</article>`;
    }).join('') || '<div class="rd-empty">No rhythm cards match this view.</div>'}</div>`;
  }

  function renderYearView() {
    const host = document.getElementById('fm-view-year');
    if (!host) return;
    host.innerHTML = yearplotHtml(visibleRows());
  }

  /* ── Drawer (Rhythm · Cadence · Streak · History) ────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function drawerField(label, value, onclick) {
    const empty = value == null || value === '' || value === '—';
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : (empty ? ' class="rd-drawer__add"' : '');
    const shown = empty ? 'Add…' : value;
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(shown)}</strong></div>`;
  }

  function renderDrawer() {
    const slot = document.getElementById('firstmonth-drawer-slot');
    if (!slot) return;
    const r = findById(window._fmDrawerId);
    if (!r) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
      return;
    }
    parkSharedDrawerAway(slot);
    const rows = allRows();
    const pos = rows.findIndex(x => x.id === r.id);
    const total = rows.length;
    const prev = pos > 0 ? rows[pos - 1] : null;
    const next = pos < total - 1 ? rows[pos + 1] : null;
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._fmDrawerTab, 10) || 0));
    const sid = jsId(r.id);
    const notYet = notBegun(r);
    const streakLabel = notYet ? '—' : (r.kept || '—');
    const inits = (typeof RdDepth !== 'undefined' && RdDepth.initials) ? RdDepth.initials(r.owner) : (r.owner || '?').slice(0, 2).toUpperCase();

    let body = '';
    if (tab === 0) {
      /* Rhythm — the definition matters more than the field. */
      body =
        `<label class="rd-drawer__inputlabel">Rhythm</label>` +
        `<input class="rd-fm-drawer__input" value="${esc(r.title)}" placeholder="Name the rhythm" oninput="rdFmSave(${r.index},'title',this.value)">` +
        `<label class="rd-drawer__inputlabel">What it means</label>` +
        `<textarea class="rd-fm-drawer__input rd-fm-drawer__input--tall" rows="4" placeholder="Say it plainly enough that a slip is obvious." oninput="rdFmSave(${r.index},'meaning',this.value)">${esc(r.meaning)}</textarea>` +
        `<div class="rd-drawer__field"><span>Area</span><strong>${esc(r.area)}</strong></div>` +
        (r.source
          ? `<div class="rd-drawer__section-title">Where it came from</div>` +
            drawerField(r.source.page || 'Source', r.source.label, r.source.go || '')
          : '') +
        `<p class="rd-drawer__note">A vague rhythm gets redefined until it is always kept. The wording here is the rhythm — not the checkbox.</p>`;
    } else if (tab === 1) {
      /* Cadence — begins the day after the wedding, never the Timeline. */
      body =
        `<label class="rd-drawer__inputlabel">Cadence</label>` +
        `<input class="rd-fm-drawer__input" list="fm-cadence-list" value="${esc(r.cadence)}" oninput="rdFmSave(${r.index},'cadence',this.value)">` +
        `<div class="rd-drawer__field"><span>Owner</span><strong>${esc(r.owner)}</strong></div>` +
        drawerField('Starts', r.startDate ? fmtLong(r.startDate) : (r.since || '—')) +
        `<datalist id="fm-cadence-list-drawer">${CADENCE_LABELS.map(c => `<option value="${esc(c)}">`).join('')}</datalist>` +
        `<p class="rd-drawer__note">Begins the day after the wedding and never touches the Timeline. This is not wedding work — nothing here appears on Timeline & Tasks.</p>`;
    } else if (tab === 2) {
      /* Streak — counted, not scored. No target, no badge. */
      body =
        `<div class="rd-fm-streak">` +
        `<div class="rd-fm-streak__num">${esc(streakLabel)}</div>` +
        `<div class="rd-fm-streak__cap">${notYet ? 'Has not begun' : 'kept'}</div>` +
        `</div>` +
        `<label class="rd-drawer__inputlabel">Kept</label>` +
        `<input class="rd-fm-drawer__input" value="${esc(r.kept)}" placeholder="—" oninput="rdFmSave(${r.index},'kept',this.value)">` +
        `<p class="rd-drawer__note">Counted, not scored. There is no target and no badge — the number exists only so a slip is visible. Before the start date it reads “—”, never “0”.</p>`;
    } else {
      /* History — written in July, started in November. */
      const hist = (r.history && r.history.length) ? r.history : [
        { when: '2026-07', who: 'Ama', what: 'Written into the plan' }
      ];
      body =
        `<div class="rd-drawer__section-title">This rhythm</div>` +
        hist.map(h => {
          const w = h.when && /^\d{4}-\d{2}$/.test(String(h.when))
            ? new Date(h.when + '-01T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : (parseISO(h.when) ? fmtShort(parseISO(h.when)) : (h.when || '—'));
          return `<div class="rd-drawer__hist"><strong>${esc(w)}${h.who ? ' · ' + esc(h.who) : ''}</strong><div>${esc(h.what)}</div></div>`;
        }).join('') +
        `<p class="rd-drawer__note">Written in July, started in November. The gap between the two dates is deliberate — the rhythm is decided long before it begins.</p>` +
        (typeof RdDepth !== 'undefined' && RdDepth.provenanceLine
          ? RdDepth.provenanceLine({ created: 'Jul 2026', createdBy: 'Ama', modified: r.startDate ? fmtShort(r.startDate) : 'Nov 2026', modifiedBy: r.owner || 'Both' })
          : '');
    }

    const chips =
      `<span class="status-pill" data-pillscheme="forest">${esc(r.cadence)}</span>` +
      `<span class="status-pill" data-pillscheme="gray">${esc(r.area)}</span>` +
      (notYet
        ? `<span class="status-pill" data-pillscheme="gray">Not begun</span>`
        : (r.kept ? `<span class="status-pill" data-pillscheme="gold">${esc(r.kept)}</span>` : ''));

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-fm-drawer" aria-label="Rhythm">` +
      `<div class="rd-drawer__head">` +
      `<button type="button" class="rd-drawer__close" onclick="rdFmCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__eyebrow">Rhythm · ${pos + 1} of ${total}</div>` +
      `<h2 class="rd-drawer__title">${esc(r.title || 'Untitled rhythm')}</h2>` +
      `<div class="rd-drawer__chips">${chips}</div>` +
      `<div class="rd-fm-drawer__nav">` +
      `<span class="rd-fm-drawer__avatar" aria-hidden="true">${esc(inits)}</span>` +
      `<span class="rd-fm-drawer__pos">${pos + 1} of ${total}</span>` +
      `<span class="rd-fm-drawer__navbtns">` +
      `<button type="button" class="rd-btn rd-btn--quiet"${prev ? '' : ' disabled'} onclick="${prev ? `rdFmOpenDrawer('${jsId(prev.id)}')` : ''}" aria-label="Previous rhythm">↑</button>` +
      `<button type="button" class="rd-btn rd-btn--quiet"${next ? '' : ' disabled'} onclick="${next ? `rdFmOpenDrawer('${jsId(next.id)}')` : ''}" aria-label="Next rhythm">↓</button>` +
      `</span></div>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdFmSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdFmCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdFmFullEditor('${sid}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdFmRowClick(ev, id) {
    if (ev && ev.target && ev.target.closest && ev.target.closest('input,textarea,select,button,label,a')) return;
    rdFmOpenDrawer(id);
  }
  function rdFmOpenDrawer(id) {
    window._fmDrawerId = id;
    window._fmDrawerTab = 0;
    renderFirstmonthRd();
  }
  function rdFmCloseDrawer() {
    window._fmDrawerId = null;
    const slot = document.getElementById('firstmonth-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    renderTableView();
  }
  function rdFmSetDrawerTab(i) {
    window._fmDrawerTab = i;
    renderDrawer();
  }

  function rdFmSave(index, field, val) {
    const d = ensureData();
    if (!d.rhythms[index]) return;
    d.rhythms[index][field] = val;
    if (field === 'cadence') {
      d.rhythms[index].cadenceKind = cadenceKindOf(val);
      d.rhythms[index].horizon = horizonOf(d.rhythms[index]);
    }
    if (field === 'title') d.rhythms[index].name = val;
    saveNow();
    renderStats();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'firstmonth') {
      renderContextSidebar('firstmonth');
    }
  }
  function rdFmAdd() {
    const d = ensureData();
    const begins = beginsDate();
    d.rhythms.push({
      _id: 'fm-' + Date.now().toString(16),
      title: '', meaning: '', cadence: 'Weekly', cadenceKind: 'Weekly',
      owner: 'Both', area: 'Us', kept: '', since: fmtShort(begins),
      startISO: begins ? (begins.getFullYear() + '-' + pad2(begins.getMonth() + 1) + '-' + pad2(begins.getDate())) : '',
      horizon: 'Ongoing', source: null, paused: false, status: 'Planned',
      history: [{ when: '2026-07', who: 'Ama', what: 'Written into the plan' }]
    });
    saveNow();
    window._fmMode = 'table';
    window._fmRailView = 'all';
    window._fmDrawerId = d.rhythms[d.rhythms.length - 1]._id;
    window._fmDrawerTab = 0;
    renderFirstmonthRd();
  }
  function rdFmTemplate() {
    const d = ensureData();
    const existing = new Set(d.rhythms.map(r => String(r.title || '').toLowerCase()));
    let added = 0;
    SEED_RHYTHMS.forEach(seed => {
      if (existing.has(seed.title.toLowerCase())) return;
      d.rhythms.push({
        _id: 'fm-' + seed.id + '-' + Date.now().toString(16),
        title: seed.title, meaning: seed.meaning, cadence: seed.cadence,
        cadenceKind: seed.cadenceKind, owner: seed.owner, area: seed.area,
        kept: seed.kept, since: seed.since, startISO: seed.startISO,
        horizon: seed.horizon, source: seed.source || null, paused: false, status: 'Planned',
        history: [{ when: '2026-07', who: 'Ama', what: 'Written into the plan' }]
      });
      added += 1;
    });
    saveNow();
    renderFirstmonthRd();
    if (typeof showToast === 'function') {
      showToast(added ? ('Added ' + added + ' rhythm' + (added === 1 ? '' : 's') + ' from the starter list.') : 'Starter rhythms are already on the page.');
    }
  }
  function rdFmPrint() {
    if (typeof openCovenantPrintTemplate === 'function' && typeof buildRhythmsPrintSheets === 'function') {
      openCovenantPrintTemplate(buildRhythmsPrintSheets());
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdFmPrintCard() { rdFmPrint(); }
  function rdFmFullEditor(id) {
    if (typeof openRecordEditor === 'function') {
      const e = id ? findById(id) : null;
      if (e) openRecordEditor('rhythms', e.index);
      else openRecordEditor('rhythms');
    } else if (typeof showToast === 'function') {
      showToast('Edit rhythms in the table, or open Full editor when available.');
    }
  }
  function rdFmExport() {
    const d = ensureData();
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('First-Month Rhythms', allRows().map(r => ({
        rhythm: r.title, cadence: r.cadence, owner: r.owner, area: r.area,
        kept: keptDisplay(r), since: r.since
      })));
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ rhythms: d.rhythms }, null, 2)], { type: 'application/json' }));
    a.download = 'first-month-rhythms.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    if (typeof showToast === 'function') showToast('Rhythms exported.');
  }
  function rdFmCycleFilter(field) {
    const opts = { all: true };
    const rows = allRows();
    if (field === 'cadence') CADENCE_ORDER.forEach(c => { opts[c.toLowerCase()] = true; });
    if (field === 'owner') { opts.both = true; rows.forEach(r => { opts[r.owner] = true; }); }
    if (field === 'area') rows.forEach(r => { opts[r.area] = true; });
    const list = Object.keys(opts);
    const cur = (window._fmUiFilters || {})[field] || (field === 'owner' ? 'both' : 'all');
    const i = Math.max(0, list.indexOf(cur));
    window._fmUiFilters[field] = list[(i + 1) % list.length];
    renderToolbar();
    renderTableView();
    renderCardsView();
    renderYearView();
  }
  function rdFmClearFilter(field) {
    window._fmUiFilters[field] = field === 'owner' ? 'both' : 'all';
    renderToolbar();
    renderTableView();
    renderCardsView();
    renderYearView();
  }
  function rdFmSortCadence() {
    const d = ensureData();
    d.rhythms.sort((a, b) => {
      const ka = CADENCE_ORDER.indexOf(a.cadenceKind || cadenceKindOf(a.cadence));
      const kb = CADENCE_ORDER.indexOf(b.cadenceKind || cadenceKindOf(b.cadence));
      return (ka < 0 ? 99 : ka) - (kb < 0 ? 99 : kb);
    });
    saveNow();
    renderTableView();
  }
  function rdFmToggleSel(id) {
    if (window._fmSel.has(id)) window._fmSel.delete(id);
    else window._fmSel.add(id);
    renderBulkBar();
    renderTableView();
  }
  function rdFmBulkClear() {
    window._fmSel.clear();
    renderBulkBar();
    renderTableView();
  }
  function selectedIndexes() {
    const d = ensureData();
    const out = [];
    d.rhythms.forEach((r, i) => {
      const id = r._id || ('fm:' + i);
      if (window._fmSel.has(id)) out.push(i);
    });
    return out;
  }
  function rdFmBulkCadence() {
    const cadence = window.prompt('Cadence (e.g. Weekly · Thu)', 'Weekly');
    if (!cadence) return;
    const d = ensureData();
    selectedIndexes().forEach(i => {
      d.rhythms[i].cadence = cadence;
      d.rhythms[i].cadenceKind = cadenceKindOf(cadence);
      d.rhythms[i].horizon = horizonOf(d.rhythms[i]);
    });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }
  function rdFmBulkOwner() {
    const owner = window.prompt('Assign owner', 'Both');
    if (!owner) return;
    const d = ensureData();
    selectedIndexes().forEach(i => { d.rhythms[i].owner = owner; });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }
  function rdFmBulkPause() {
    const d = ensureData();
    selectedIndexes().forEach(i => { d.rhythms[i].paused = true; d.rhythms[i].status = 'Paused'; });
    saveNow();
    rdFmBulkClear();
    renderFirstmonthRd();
  }

  function renderFirstmonthRd() {
    ensureData();
    if (typeof getSavedView === 'function') window._fmRailView = getSavedView('firstmonth', window._fmRailView || 'all');
    ensureShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('firstmonth');
    applyMode();
    renderStats();
    renderToolbar();
    renderBulkBar();
    renderTableView();
    renderCardsView();
    renderYearView();
    renderDrawer();
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
  window.rdFmSave = rdFmSave;
  window.rdFmAdd = rdFmAdd;
  window.rdFmTemplate = rdFmTemplate;
  window.rdFmPrint = rdFmPrint;
  window.rdFmPrintCard = rdFmPrintCard;
  window.rdFmFullEditor = rdFmFullEditor;
  window.rdFmExport = rdFmExport;
  window.rdFmCycleFilter = rdFmCycleFilter;
  window.rdFmClearFilter = rdFmClearFilter;
  window.rdFmSortCadence = rdFmSortCadence;
  window.rdFmToggleSel = rdFmToggleSel;
  window.rdFmBulkClear = rdFmBulkClear;
  window.rdFmBulkCadence = rdFmBulkCadence;
  window.rdFmBulkOwner = rdFmBulkOwner;
  window.rdFmBulkPause = rdFmBulkPause;
  window.rdFmRowClick = rdFmRowClick;
  window.rdFmOpenDrawer = rdFmOpenDrawer;
  window.rdFmCloseDrawer = rdFmCloseDrawer;
  window.rdFmSetDrawerTab = rdFmSetDrawerTab;
  window.openRhythmTemplates = rdFmTemplate;
  window.addRhythmRow = rdFmAdd;

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
