/* Wedding Setup — Master s35 · 15a (+ 11c earlier drawing)
   The page every other page reads. Not a record table — a form: eleven facts,
   each naming what it feeds, plus menu visibility and the danger zone.

   This is an ADDITIVE redesign shell. Every setup input keeps its id and its
   saveSetup() handler (relocate, don't re-author) — this file only adds the
   redesign pagehead, the "Feeds …" captions, the danger zone, and the
   Setup-field drawer (Field · Impact · History) for the wedding date, the one
   field whose edit re-dates the whole planner. */
(function () {
  'use strict';

  window._setupDrawerTab = window._setupDrawerTab || 0;

  const SHELL_VER = 'setup-rd-s35';
  const DRAWER_TABS = ['Field', 'Impact', 'History'];

  /* Field id → what it feeds (Master 15a). */
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

  /* ── shell ───────────────────────────────────────────────────────────── */

  function ensureShell() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    panel.classList.add('ued-scope', 'rd-setup-scope');
    if (panel.dataset.setupRdShell === SHELL_VER) return;
    panel.dataset.setupRdShell = SHELL_VER;

    /* Prepend a redesign pagehead without disturbing the existing form. */
    if (!panel.querySelector('.rd-setup-pagehead')) {
      const head = document.createElement('div');
      head.className = 'rd-pagehead rd-setup-pagehead';
      head.innerHTML =
        '<div><div class="rd-pagehead__eyebrow">No tab · reached from the top bar</div>' +
        '<div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Wedding Setup</h1></div>' +
        '<p class="rd-help rd-setup-lead">The page every other page reads. Eleven facts, each naming what it feeds — and the danger zone at the foot.</p></div>' +
        '<div class="rd-pagehead__actions">' +
        '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupSave()">Save changes</button>' +
        '</div>';
      panel.insertBefore(head, panel.firstChild);
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
      /* The wedding date is the one field whose edit re-dates the planner —
         give it the "review impact" affordance that opens the drawer. */
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

  /* ── danger zone (Master 15a rail: Clear a table · Restore a backup ·
        Clear history · Reset planner) ────────────────────────────────────── */

  function ensureDangerZone() {
    const panel = document.getElementById('panel-setup');
    if (!panel) return;
    if (panel.querySelector('#rd-setup-danger')) { refreshDangerCounts(); return; }
    const sec = document.createElement('section');
    sec.className = 'rd-setup-danger';
    sec.id = 'rd-setup-danger';
    sec.innerHTML =
      '<div class="rd-section__head"><div>' +
      '<div class="rd-pagehead__eyebrow rd-setup-danger__eyebrow">Danger zone</div>' +
      '<p class="rd-help">Irreversible actions live here, one place, away from the fields they would undo.</p>' +
      '</div></div>' +
      '<div class="rd-setup-danger__grid">' +
      dangerCard('Clear a table', 'Empty one table’s rows — guests, budget lines, tasks. The other tables are untouched.', 'rdSetupClearTable()', 'Clear a table') +
      dangerCard('Restore a backup', 'Replace everything with a downloaded backup file. The current plan is overwritten.', 'rdSetupRestore()', 'Choose a file') +
      dangerCard('Clear history', 'Drop the readable change log and its undo snapshots. Planner records are untouched.', 'rdSetupClearHistory()', 'Clear <span id="rd-setup-hist-count"></span>') +
      dangerCard('Reset planner', 'Erase every table and setting and start over. This cannot be undone.', 'rdSetupReset()', 'Reset everything') +
      '</div>';
    panel.appendChild(sec);
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
    const el = document.getElementById('rd-setup-hist-count');
    if (el) el.textContent = n ? (n + ' entr' + (n === 1 ? 'y' : 'ies')) : 'the log';
  }

  /* ── Setup-field drawer (Field · Impact · History) for the wedding date ── */

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
    const tasks = Array.isArray(d.tasks) ? d.tasks.length : 0;
    const pays = Array.isArray(d.payments) ? d.payments.length : 0;
    const appts = Array.isArray(d.appointments) ? d.appointments.length : 0;
    return { tasks, pays, appts };
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
    let body = '';
    if (tab === 0) {
      body =
        field('Field', 'Wedding date') +
        field('Value', dateLabel()) +
        field('Feeds', FEEDS['s-date']) +
        '<p class="rd-drawer__note">The one setup field that feeds the most pages, and the only one whose edit confirms first — changing it re-dates the whole planner.</p>';
    } else if (tab === 1) {
      body =
        '<div class="rd-drawer__section-title">Changing the date moves, as one approved change</div>' +
        field('Task due dates', ic.tasks + ' task' + (ic.tasks === 1 ? '' : 's')) +
        field('Payment schedule', ic.pays + ' payment' + (ic.pays === 1 ? '' : 's')) +
        field('Appointments', ic.appts + ' appointment' + (ic.appts === 1 ? '' : 's')) +
        field('Countdown & calendar', 'Re-based') +
        '<p class="rd-drawer__note">A before-and-after list, approved as one change — so undo reverses all of it or none. This is why the date confirms before it saves.</p>';
    } else {
      body =
        '<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Wedding date set</div></div>' +
        '<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Field created in setup</div></div>' +
        '<p class="rd-drawer__note">Two entries in five months. Sparseness here is the reassuring reading — the date does not change often.</p>';
    }
    slot.classList.add('is-open');
    slot.innerHTML =
      '<div class="rd-setup-drawer__scrim" onclick="rdSetupCloseDrawer()"></div>' +
      '<aside class="rd-drawer rd-setup-fielddrawer" aria-label="Setup field">' +
      '<div class="rd-drawer__head">' +
      '<button type="button" class="rd-drawer__close" onclick="rdSetupCloseDrawer()" aria-label="Close">×</button>' +
      '<div class="rd-drawer__eyebrow">Setup field</div>' +
      '<h2 class="rd-drawer__title">Wedding date</h2>' +
      '<div class="rd-drawer__chips"><span class="status-pill" data-pillscheme="gold">Confirms first</span></div>' +
      '<div class="rd-drawer__tabs" role="tablist">' +
      DRAWER_TABS.map((label, i) =>
        '<button type="button" class="rd-drawer__tab' + (i === tab ? ' is-active' : '') + '" onclick="rdSetupSetDrawerTab(' + i + ')">' + esc(label) + '</button>'
      ).join('') +
      '</div></div>' +
      '<div class="rd-drawer__body">' + body + '</div>' +
      '<div class="rd-drawer__foot">' +
      '<button type="button" class="rd-btn rd-btn--primary" onclick="rdSetupCloseDrawer()">Done</button>' +
      '</div></aside>';
  }
  function field(label, value) {
    return '<div class="rd-drawer__field"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
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

  function rdSetupReset() {
    if (typeof resetAll === 'function') resetAll();
    else if (typeof covAlert === 'function') covAlert('Reset is unavailable in this build.');
  }
  function rdSetupRestore() {
    const input = document.getElementById('importInput');
    if (input) input.click();
    else if (typeof showToast === 'function') showToast('Use the Import control in the top bar.');
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

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderSetupRd() {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage();
    ensureShell();
    addFeedsCaptions();
    ensureDangerZone();
    if (typeof uxRevealPanel === 'function') uxRevealPanel('setup');
  }

  /* Wrap the legacy renderer so stats/checklist still update, then add chrome. */
  var _origRenderSetupPage = window.renderSetupPage;
  window.renderSetupPage = function () {
    if (typeof _origRenderSetupPage === 'function') _origRenderSetupPage.apply(this, arguments);
    ensureShell();
    addFeedsCaptions();
    ensureDangerZone();
  };

  window.renderSetupRd = renderSetupRd;
  window.rdSetupSave = rdSetupSave;
  window.rdSetupOpenDrawer = rdSetupOpenDrawer;
  window.rdSetupCloseDrawer = rdSetupCloseDrawer;
  window.rdSetupSetDrawerTab = rdSetupSetDrawerTab;
  window.rdSetupReset = rdSetupReset;
  window.rdSetupRestore = rdSetupRestore;
  window.rdSetupClearHistory = rdSetupClearHistory;
  window.rdSetupClearTable = rdSetupClearTable;

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
      return out;
    };
  }
})();
