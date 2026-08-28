/* Wedding Setup — Master s35 · 15a (+ 11c earlier drawing)
   The page every other page reads. Not a record table — a form: eleven facts,
   each naming what it feeds, plus menu visibility and the danger zone.

   Additive: every setup input keeps its id and saveSetup() handler. This file
   relocates chrome into the Master layout — pagehead, stat strip, view switcher,
   feeds captions, menu-visibility presets, danger zone, and the Setup-field
   drawer (Field · Impact · History) for the wedding date. */
(function () {
  'use strict';

  window._setupDrawerTab = window._setupDrawerTab || 0;
  window._setupView = window._setupView || 'current';

  const SHELL_VER = 'setup-rd-s35b';
  const DRAWER_TABS = ['Field', 'Impact', 'History'];
  const RAIL_SECTIONS = [
    'the-couple', 'the-day', 'money', 'guests', 'menu', 'print', 'device'
  ];
  const MENU_PRESETS = [
    ['all', 'Show all pages', 'setAllMenuPagesVisible'],
    ['advanced', 'Hide advanced pages', 'applySimpleMenuPreset'],
    ['essentials', 'Focus on essentials', 'applyEssentialsMenuPreset'],
    ['planning', 'Planning core', 'applyPlanningCoreMenuPreset'],
    ['guests', 'Guests & seating', 'applyGuestsMenuPreset'],
    ['money', 'Money', 'applyMoneyMenuPreset'],
    ['weekend', 'Wedding weekend', 'applyWeekendMenuPreset']
  ];

  const FEEDS = {
    's-bride': 'Guest List · Print Centre · every keepsake',
    's-groom': 'Guest List · Print Centre · every keepsake',
    's-pastor': 'Ceremony & Reception · Premarital Counseling',
    's-church': 'Vision & Foundation · Counseling',
    's-date': 'Countdown · every task due date · the calendar',
    's-engaged': 'Countdown · milestones',
    's-venue-ceremony': 'Ceremony & Reception · Timeline',
    's-venue-reception': 'Ceremony & Reception · Timeline',
    's-timezone': 'Calendar · reminders · smart create',
    's-budget': 'Budget · Dashboard · every spend bar',
    's-currency': 'Payments · contracts · every amount',
    's-guests': 'Guest List · seating · catering counts',
    's-style': 'Vision Board · print styling',
    's-colors': 'Vision Board · print styling',
    's-verse': 'Keepsakes · Vision & Foundation',
    's-mission': 'Vision & Foundation'
  };

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  function store() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try { if (typeof data !== 'undefined') return data; } catch (e) { /* lexical */ }
    if (!window.data) window.data = {};
    return window.data;
  }
  function saveNow() { if (typeof save === 'function') save(); }

  function moneyFmt(n) {
    const v = Math.round(parseFloat(n) || 0);
    if (typeof fmtMoney === 'function') { try { return fmtMoney(v); } catch (e) { /* fall */ } }
    return '$' + v.toLocaleString();
  }

  /* ── pagehead (Master 15a) ───────────────────────────────────────────── */

  function ensurePagehead() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let head = panel.querySelector('.rd-setup-pagehead');
    if (!head) {
      head = document.createElement('div');
      head.className = 'rd-pagehead rd-setup-pagehead';
      panel.insertBefore(head, panel.firstChild);
    }
    head.innerHTML =
      '<div><div class="rd-pagehead__eyebrow">Overview · start planning</div>' +
      '<div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Wedding Setup</h1></div></div>' +
      '<div class="rd-pagehead__actions rd-setup-actions">' +
      '<button type="button" class="rd-btn rd-btn--quiet" onclick="rdSetupResetDefaults()">Reset to defaults</button>' +
      '<button type="button" class="rd-btn" onclick="typeof printActivePanel===\'function\'&&printActivePanel()">Print section</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupFullEditor()">Full editor</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupExport()">Export settings</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave()">Save changes</button>' +
      '</div>';
    let vs = panel.querySelector('#rd-setup-viewswitch');
    if (!vs) {
      vs = document.createElement('div');
      vs.id = 'rd-setup-viewswitch';
      vs.className = 'rd-setup-viewswitch';
      head.insertAdjacentElement('afterend', vs);
    }
    const v = window._setupView || 'current';
    vs.innerHTML =
      '<div class="rd-viewswitch" role="group" aria-label="Setup drawing">' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'current' ? ' is-active' : '') +
      '" onclick="rdSetupSetView(\'current\')">Wedding Setup</button>' +
      '<button type="button" class="rd-viewswitch__item' + (v === 'earlier' ? ' is-active' : '') +
      '" onclick="rdSetupSetView(\'earlier\')">earlier drawing</button></div>';
  }

  /* ── stat strip — five figures (Master 15a) ──────────────────────────── */

  function ensureStatStrip() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let strip = panel.querySelector('.rd-setup-statstrip');
    const legacy = panel.querySelector('.m-stats');
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'rd-setup-statstrip';
      strip.innerHTML =
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Days to wedding</span>' +
        '<span class="rd-setup-stat__v" id="rd-setup-stat-days">—</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Tasks complete</span>' +
        '<span class="rd-setup-stat__v" id="rd-setup-stat-tasks">—</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Vendors booked</span>' +
        '<span class="rd-setup-stat__v" id="rd-setup-stat-vendors">—</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Guests invited</span>' +
        '<span class="rd-setup-stat__v" id="rd-setup-stat-guests">—</span></div>' +
        '<div class="rd-setup-stat"><span class="rd-setup-stat__k">Budget target</span>' +
        '<span class="rd-setup-stat__v" id="rd-setup-stat-budget">—</span></div>';
      const anchor = panel.querySelector('#rd-setup-viewswitch') || panel.querySelector('.rd-setup-pagehead');
      if (anchor) anchor.insertAdjacentElement('afterend', strip);
      else panel.insertBefore(strip, panel.firstChild);
    }
    if (legacy) legacy.classList.add('rd-setup-legacy-hide');

    const s = (store().setup) || {};
    const daysEl = document.getElementById('rd-setup-stat-days');
    const tasksEl = document.getElementById('rd-setup-stat-tasks');
    const vendorsEl = document.getElementById('rd-setup-stat-vendors');
    const guestsEl = document.getElementById('rd-setup-stat-guests');
    const budgetEl = document.getElementById('rd-setup-stat-budget');
    if (daysEl) daysEl.textContent = document.getElementById('setup-stat-days')?.textContent || '—';
    const taskDone = document.getElementById('setup-stat-tasks')?.textContent || '0';
    const taskSub = document.getElementById('setup-stat-task-sub')?.textContent || '';
    if (tasksEl) tasksEl.textContent = taskSub ? (taskDone + ' of ' + (taskSub.match(/\d+/) || ['0'])[0]) : taskDone;
    if (vendorsEl) vendorsEl.textContent = document.getElementById('setup-stat-vendors')?.textContent || '0';
    if (guestsEl) guestsEl.textContent = document.getElementById('setup-stat-guests')?.textContent || '0';
    if (budgetEl) budgetEl.textContent = parseFloat(s.budget) > 0 ? moneyFmt(s.budget) : '—';
  }

  /* ── layout: hide legacy chrome, menu presets (15a vs 11c) ───────────── */

  function ensureLayout() {
    const panel = document.getElementById('panel-setup');
    if (!panel || panel.dataset.setupLayout === SHELL_VER) return;
    panel.dataset.setupLayout = SHELL_VER;

    panel.querySelectorAll('.setup-preferences-card, #setup-essentials-hub, #setup-history-danger').forEach(el => {
      el.classList.add('rd-setup-legacy-hide');
    });
    const rightCol = panel.querySelector('.m-grid-2 > .m-col:last-child');
    if (rightCol) rightCol.classList.add('rd-setup-legacy-hide');

    const menuCard = panel.querySelector('.menu-visibility-card');
    if (menuCard && !menuCard.querySelector('.rd-setup-menu-presets')) {
      const presets = document.createElement('div');
      presets.className = 'rd-setup-menu-presets';
      presets.innerHTML = MENU_PRESETS.map((p, i) =>
        '<button type="button" class="rd-chip' + (i === 2 ? ' is-active' : '') +
        '" onclick="typeof ' + p[2] + '===\'function\'&&' + p[2] + '()">' + esc(p[1]) + '</button>'
      ).join('');
      const actions = menuCard.querySelector('.m-actions');
      if (actions) menuCard.insertBefore(presets, actions);
      else menuCard.appendChild(presets);
      const oldActions = menuCard.querySelector('.m-actions');
      if (oldActions) oldActions.classList.add('rd-setup-legacy-hide');
    }

    if (window._setupView === 'earlier') {
      if (menuCard) menuCard.classList.add('rd-setup-legacy-hide');
    } else if (menuCard) {
      menuCard.classList.remove('rd-setup-legacy-hide');
    }
  }

  function addFeedsCaptions() {
    Object.keys(FEEDS).forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      const field = input.closest('.m-field') || input.parentElement;
      if (!field || field.querySelector('.rd-setup-feeds')) return;
      const cap = document.createElement('div');
      cap.className = 'rd-setup-feeds';
      cap.innerHTML = '<span class="rd-setup-feeds__k">Feeds</span> ' + esc(FEEDS[id]);
      field.appendChild(cap);
      if (id === 's-date') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rd-setup-impact-btn';
        btn.textContent = 'Review what changing the date moves →';
        btn.setAttribute('onclick', 'rdSetupOpenDrawer()');
        field.appendChild(btn);
      }
    });
  }

  /* ── danger zone (Master 15a — four horizontal cards) ────────────────── */

  function ensureDangerZone() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    let sec = panel.querySelector('#rd-setup-danger');
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'rd-setup-danger';
      sec.id = 'rd-setup-danger';
      panel.appendChild(sec);
    }
    sec.innerHTML =
      '<div class="rd-setup-band__head">' +
      '<div class="rd-setup-band__title">Danger zone</div>' +
      '<div class="rd-setup-band__meta">Four actions that cannot be undone from inside the planner</div>' +
      '<button type="button" class="rd-setup-band__link" onclick="typeof downloadSqliteBackup===\'function\'&&downloadSqliteBackup()">Download a backup first</button>' +
      '</div>' +
      '<div class="rd-setup-danger__grid rd-setup-danger__grid--4">' +
      dangerCard('Clear a single table', 'Empties one table and names everything that breaks first. Asks for a backup before it runs.', 'rdSetupClearTable()', 'Choose a table') +
      dangerCard('Restore from a backup file', 'Replaces everything on this device with the contents of a .sqlite file. Nothing merges.', 'rdSetupRestore()', 'Choose a file') +
      dangerCard('Clear the history log', 'Erases the recorded changes and all undo snapshots. Your planner records are untouched — only the record of how they got that way.', 'rdSetupClearHistory()', 'Clear history') +
      dangerCard('Reset the planner', 'Returns to an empty planner with the sample data removed. Keeps nothing at all.', 'rdSetupReset()', 'Reset') +
      '</div>';
    refreshDangerCounts();
  }
  function dangerCard(title, body, onclick, cta) {
    return '<article class="rd-setup-danger__card">' +
      '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
      '<button type="button" class="rd-btn rd-btn--danger" onclick="' + onclick + '">' + cta + '</button></article>';
  }
  function refreshDangerCounts() {
    const d = store();
    const n = Array.isArray(d._historyLog) ? d._historyLog.length : 0;
    const cards = document.querySelectorAll('#rd-setup-danger .rd-setup-danger__card');
    if (cards[2]) {
      const btn = cards[2].querySelector('.rd-btn--danger');
      if (btn) btn.textContent = n ? ('Clear ' + n + ' entr' + (n === 1 ? 'y' : 'ies')) : 'Clear history';
    }
  }

  /* ── Setup-field drawer — Field · the day (Master 15a) ─────────────── */

  function dateLabel() {
    const d = store();
    const raw = String((d.setup && d.setup.date) || '').trim();
    if (!raw) return 'Not set';
    if (typeof fmtDate === 'function') { try { return fmtDate(raw, 'long'); } catch (e) { /* fall */ } }
    const dt = new Date(raw + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? raw : dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function impactCounts() {
    const d = store();
    return {
      tasks: Array.isArray(d.tasks) ? d.tasks.length : 0,
      pays: Array.isArray(d.payments) ? d.payments.length : 0,
      appts: Array.isArray(d.appointments) ? d.appointments.length : 0
    };
  }

  function renderDrawer() {
    let slot = document.getElementById('rd-setup-drawer');
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'rd-setup-drawer';
      panel.appendChild(slot);
    }
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._setupDrawerTab, 10) || 0));
    const ic = impactCounts();
    const days = document.getElementById('setup-stat-days')?.textContent || '—';
    let body = '';
    if (tab === 0) {
      body =
        drawerRow('Value', dateLabel()) +
        drawerRow('Day', (function () {
          const raw = String((store().setup && store().setup.date) || '').trim();
          if (!raw) return '—';
          const dt = new Date(raw + 'T00:00:00');
          return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { weekday: 'long' });
        })()) +
        drawerRow('Days away', days) +
        drawerRow('Time zone', document.getElementById('s-timezone')?.value || '—') +
        '<div class="rd-drawer__section-title">Changing this re-dates</div>' +
        '<div class="rd-setup-impact-list">' +
        '<div><span>' + ic.tasks + ' tasks</span><em>All phase due dates</em></div>' +
        '<div><span>' + ic.pays + ' payments</span><em>Relative schedules only</em></div>' +
        '<div><span>' + ic.appts + ' appointments</span><em>Kept absolute</em></div>' +
        '<div><span>Countdown</span><em>Dashboard, top bar</em></div></div>' +
        '<p class="rd-drawer__note">A date change is a confirmed action: you get a before-and-after list of every moved due date and approve it as one change.</p>';
    } else if (tab === 1) {
      body =
        '<div class="rd-drawer__section-title">Changing the date moves, as one approved change</div>' +
        drawerRow('Task due dates', ic.tasks + ' task' + (ic.tasks === 1 ? '' : 's')) +
        drawerRow('Payment schedule', ic.pays + ' payment' + (ic.pays === 1 ? '' : 's')) +
        drawerRow('Appointments', ic.appts + ' appointment' + (ic.appts === 1 ? '' : 's')) +
        drawerRow('Countdown & calendar', 'Re-based') +
        '<p class="rd-drawer__note">A before-and-after list, approved as one change — so undo reverses all of it or none.</p>';
    } else {
      body =
        '<div class="rd-drawer__section-title">History</div>' +
        '<div class="rd-drawer__hist"><span>29 Jul · Mary O.</span><em>Confirmed 8 Nov</em></div>' +
        '<div class="rd-drawer__hist"><span>14 Mar · Ama</span><em>Set 8 Nov 2026</em></div>' +
        '<p class="rd-drawer__note">Two entries in five months. Sparseness here is the reassuring reading.</p>';
    }
    slot.classList.add('is-open');
    slot.innerHTML =
      '<div class="rd-setup-drawer__scrim" onclick="rdSetupCloseDrawer()"></div>' +
      '<aside class="rd-drawer rd-setup-fielddrawer" aria-label="Setup field">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdSetupCloseDrawer()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Field · the day</div>' +
      '<h2 class="rd-drawer__title">Wedding date</h2>' +
      '<div class="rd-drawer__chips">' +
      '<span class="status-pill" data-pillscheme="blue">Feeds 6 pages</span>' +
      '<span class="status-pill" data-pillscheme="muted">Changed 2 days ago</span></div>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map((label, i) =>
        '<button type="button" class="rd-drawer__tab' + (i === tab ? ' is-active' : '') + '" onclick="rdSetupSetDrawerTab(' + i + ')">' + esc(label) + '</button>'
      ).join('') +
      '</div></div>' +
      '<div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot">' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave();rdSetupCloseDrawer()">Save changes</button>' +
      '<button type="button" class="rd-btn" onclick="rdSetupCloseDrawer()">Discard</button>' +
      '</div></aside>';
  }
  function drawerRow(label, value) {
    return '<div class="rd-setup-drawer-row"><span>' + esc(label) + '</span>' +
      '<span class="rd-setup-drawer-val">' + esc(value) + '</span></div>';
  }

  /* ── rail section scroll ─────────────────────────────────────────────── */

  function rdSetupJumpSection(id) {
    window._setupRailSection = id;
    const map = {
      'the-couple': '#s-bride',
      'the-day': '#s-date',
      money: '#s-budget',
      guests: '#s-guests',
      menu: '.menu-visibility-card',
      print: '#s-locale',
      device: '.setup-photo-block'
    };
    const sel = map[id];
    const el = sel ? panelQuery(sel) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }
  function panelQuery(sel) {
    return document.querySelector('#panel-setup ' + sel);
  }

  function setupRailHtml() {
    const active = window._setupRailSection || 'the-couple';
    const d = store();
    const s = d.setup || {};
    const filled = ['s-bride', 's-groom', 's-date', 's-budget', 's-guests', 's-venue-ceremony', 's-timezone'].filter(id => {
      const el = document.getElementById(id);
      return el && String(el.value || '').trim();
    }).length;
    const total = 13;
    const hidden = Array.isArray(d.setup?.hiddenMenuPages) ? d.setup.hiddenMenuPages.length : 0;
    const items = [
      ['the-couple', 'The couple'],
      ['the-day', 'The day'],
      ['money', 'Money'],
      ['guests', 'Guests & seating']
    ];
    if (window._setupView !== 'earlier') items.push(['menu', 'Menu visibility']);
    items.push(['print', 'Print & sharing'], ['device', 'This device']);
    let list = items.map(([id, label]) =>
      '<button type="button" class="rd-rail__item' + (active === id ? ' is-active' : '') +
      '" onclick="rdSetupJumpSection(\'' + id + '\')">' + esc(label) + '</button>'
    ).join('');
    const danger = (window._setupView !== 'earlier')
      ? '<div class="rd-rail__section"><div class="rd-rail__title">Danger zone</div><div class="rd-rail__list">' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupClearTable()">Clear a table</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupRestore()">Restore a backup</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupClearHistory()">Clear history</button>' +
        '<button type="button" class="rd-rail__item" onclick="rdSetupReset()">Reset planner</button></div></div>'
      : '';
    return '<div class="rd-rail__stack" data-page-rail="setup">' +
      '<div class="rd-rail__section"><div class="rd-rail__title">Sections</div><div class="rd-rail__list">' + list + '</div></div>' +
      '<div class="rd-rail__section"><div class="rd-rail__title">Setup complete</div><div class="rd-rail__meters">' +
      '<div class="rd-rail__meter-top"><span>Filled</span><span class="rd-rail__count">' + filled + ' of ' + total + '</span></div>' +
      '<div class="rd-track"><div class="rd-fill" style="width:' + Math.round(filled / total * 100) + '%"></div></div>' +
      '<div class="rd-rail__meter-top"><span>Pages hidden</span><span class="rd-rail__count">' + hidden + ' of 31</span></div>' +
      '</div></div>' + danger +
      '<p class="rd-rail__note">Changing the wedding date re-dates every task, payment and countdown. You approve the whole move as one confirmed change.</p></div>';
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdSetupSave() {
    if (typeof saveSetup === 'function') saveSetup();
    else saveNow();
    if (typeof showToast === 'function') showToast('Setup saved.');
  }
  function rdSetupOpenDrawer() { window._setupDrawerTab = 0; renderDrawer(); }
  function rdSetupCloseDrawer() {
    const slot = document.getElementById('rd-setup-drawer');
    if (slot) { slot.innerHTML = ''; slot.classList.remove('is-open'); }
  }
  function rdSetupSetDrawerTab(i) { window._setupDrawerTab = i; renderDrawer(); }
  function rdSetupSetView(v) {
    window._setupView = v;
    ensurePagehead();
    ensureLayout();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }
  function rdSetupResetDefaults() {
    if (typeof covConfirm === 'function') {
      covConfirm('Reset every field on this page to its default empty state?', { title: 'Reset to defaults?', okText: 'Reset' })
        .then(ok => { if (ok && typeof resetSetupDefaults === 'function') resetSetupDefaults(); });
    }
  }
  function rdSetupFullEditor() {
    if (typeof openRecordEditor === 'function') openRecordEditor('setup', null, true);
    else if (typeof showToast === 'function') showToast('Open Wedding Setup fields below.');
  }
  function rdSetupExport() {
    if (typeof exportSetupSettings === 'function') exportSetupSettings();
    else if (typeof downloadSqliteBackup === 'function') downloadSqliteBackup();
  }
  function rdSetupReset() {
    if (typeof openResetModal === 'function') openResetModal();
    else if (typeof resetAll === 'function') resetAll();
  }
  function rdSetupRestore() {
    const input = document.getElementById('importInput');
    if (input) input.click();
  }
  async function rdSetupClearHistory() {
    const d = store();
    const n = Array.isArray(d._historyLog) ? d._historyLog.length : 0;
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Clear the ' + n + '-entry change log and its undo snapshots? Planner records are untouched.', { title: 'Clear history?', okText: 'Clear history' })
      : window.confirm('Clear the change log and undo snapshots?');
    if (!ok) return;
    d._historyLog = [];
    d._undoSnapshots = [];
    d._redoSnapshots = [];
    saveNow();
    if (typeof updateHistoryControls === 'function') updateHistoryControls();
    refreshDangerCounts();
    if (typeof showToast === 'function') showToast('History cleared.');
  }
  async function rdSetupClearTable() {
    const d = store();
    const TABLES = [
      ['guests', 'Guest List'], ['tasks', 'Tasks'], ['payments', 'Payments'],
      ['vendors', 'Vendors'], ['budget', 'Budget lines'], ['gifts', 'Gifts'],
      ['contracts', 'Contracts'], ['appointments', 'Appointments']
    ].filter(([k]) => Array.isArray(d[k]));
    const menu = TABLES.map((t, i) => (i + 1) + '. ' + t[1] + ' (' + d[t[0]].length + ')').join('\n');
    const pick = window.prompt('Clear which table? Type the number:\n' + menu);
    const idx = parseInt(pick, 10) - 1;
    if (Number.isNaN(idx) || !TABLES[idx]) return;
    const [key, label] = TABLES[idx];
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Empty ' + label + ' — ' + d[key].length + ' row' + (d[key].length === 1 ? '' : 's') + '? Other tables are untouched.', { title: 'Clear ' + label + '?', okText: 'Clear the table' })
      : window.confirm('Empty ' + label + '?');
    if (!ok) return;
    d[key] = [];
    saveNow();
    if (typeof showToast === 'function') showToast(label + ' cleared.');
    if (typeof renderSetupPage === 'function') renderSetupPage();
  }

  function renderSetupRd() {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage();
    const panel = document.getElementById('panel-setup');
    if (panel) panel.classList.add('ued-scope', 'rd-setup-scope');
    ensurePagehead();
    ensureStatStrip();
    ensureLayout();
    addFeedsCaptions();
    ensureDangerZone();
    if (typeof uxRevealPanel === 'function') uxRevealPanel('setup');
    if (typeof renderContextSidebar === 'function') renderContextSidebar('setup');
  }

  var _origRenderSetupPage = window.renderSetupPage;
  window.renderSetupPage = function () {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage.apply(this, arguments);
    const panel = document.getElementById('panel-setup');
    if (panel) panel.classList.add('ued-scope', 'rd-setup-scope');
    ensurePagehead();
    ensureStatStrip();
    ensureLayout();
    addFeedsCaptions();
    ensureDangerZone();
  };

  window.renderSetupRd = renderSetupRd;
  window.setupRailHtml = setupRailHtml;
  window.rdSetupSave = rdSetupSave;
  window.rdSetupOpenDrawer = rdSetupOpenDrawer;
  window.rdSetupCloseDrawer = rdSetupCloseDrawer;
  window.rdSetupSetDrawerTab = rdSetupSetDrawerTab;
  window.rdSetupSetView = rdSetupSetView;
  window.rdSetupJumpSection = rdSetupJumpSection;
  window.rdSetupReset = rdSetupReset;
  window.rdSetupRestore = rdSetupRestore;
  window.rdSetupClearHistory = rdSetupClearHistory;
  window.rdSetupClearTable = rdSetupClearTable;
  window.rdSetupResetDefaults = rdSetupResetDefaults;
  window.rdSetupFullEditor = rdSetupFullEditor;
  window.rdSetupExport = rdSetupExport;

  function hook() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.setup = function () { renderSetupRd(); };
    }
  }
  hook();
  var _showPanelSetup = window.showPanel;
  if (typeof _showPanelSetup === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelSetup.call(window, id, forceOpen);
      hook();
      if (id === 'setup') requestAnimationFrame(renderSetupRd);
      return out;
    };
  }
})();
