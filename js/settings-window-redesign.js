/* Settings window — Master s39 · 49c (the gear pop-out, read as a Settings window)
   The gear menu (#rd-prefs) already holds every control the old top-bar overflow
   held — Save, backup, restore, undo, redo, history, CSV export, print, auto-fit,
   help — and redesign-shell.js moved Undo/Redo in with their real `disabled`
   state, so the menu no longer hides them. Two things the 49c drawing shows are
   still missing, and this file adds them without re-authoring the menu:

     · the green save-status banner — "Saved on this device", the last backup
       date and the number of edits since, the two figures that decide whether
       you act. Both come from data.onboard (lastBackupTime / editsSinceBackup);
       never typed here, never a second copy.
     · six labelled panes — the flat list gets group headers so Save & backup,
       Undo & history, Export, Print, Display and Viewer read as distinct panes
       rather than one 14-item dropdown.

   Purely additive: no button is moved, renamed or rebound — headers are inserted
   before anchor controls, and the banner is refreshed each time the menu opens,
   so the figures are current every time. Idempotent; safe to re-run. */
(function () {
  'use strict';

  /* Labels track wherever redesign-shell.js placed each control — panes are
     inserted before the first control of each group, in DOM order, so the
     header always sits above controls that really exist. Undo/Redo are not
     listed: the shell keeps them in the top-bar undo slot (visible, in their
     real disabled state) rather than in this menu. */
  var PANES = [
    { key: 'history', label: 'History & trash', match: function (b) { return /data-rd-history|data-rd-trash/.test(sig(b)); } },
    { key: 'display', label: 'Display',         match: function (b) { return /id="dark-mode-btn"|id="profile-drawer-btn"/.test(sig(b)); } },
    { key: 'save',    label: 'Save & backup',   match: function (b) { return /downloadSqliteBackup|restorePlannerBackup|importInput|openPlannerHelp|id="save-btn"/.test(sig(b)); } },
    { key: 'export',  label: 'Export',          match: function (b) { return /csv-export-select|exportSelectedListCSV|autoFitActivePanelTables/.test(sig(b)); } },
    { key: 'print',   label: 'Print',           match: function (b) { return /print-target-select|printSelectedSection/.test(sig(b)); } }
  ];

  function sig(node) {
    if (!node || node.nodeType !== 1) return '';
    var parts = [];
    function add(el) {
      if (!el || el.nodeType !== 1) return;
      if (el.id) parts.push('id="' + el.id + '"');
      if (el.className && typeof el.className === 'string') parts.push(el.className);
      var oc = el.getAttribute && el.getAttribute('onclick');
      if (oc) parts.push(oc);
      /* data- flags that redesign-shell.js stamps on its own buttons */
      if (el.attributes) {
        for (var i = 0; i < el.attributes.length; i++) {
          var a = el.attributes[i];
          if (a.name.indexOf('data-') === 0) parts.push(a.name);
        }
      }
    }
    add(node);
    /* selects/inputs sit inside a wrapper; look one level in */
    var inner = node.querySelector && node.querySelector('[id],[onclick]');
    add(inner);
    return parts.join(' ');
  }

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
  }

  function onboard() {
    try { if (typeof ensureOnboardData === 'function') return ensureOnboardData() || {}; } catch (e) {}
    try { return (typeof data !== 'undefined' && data && data.onboard) ? data.onboard : {}; } catch (e) { return {}; }
  }

  /* ── the green save-status banner ─────────────────────────────────────── */
  function refreshBanner() {
    var prefs = document.getElementById('rd-prefs');
    if (!prefs) return;
    var banner = prefs.querySelector('#rd-settings-status');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'rd-settings-status';
      banner.className = 'rd-settings-status';
      prefs.insertBefore(banner, prefs.firstChild);
    }
    var ob = onboard();
    var lastRaw = ob.lastBackupTime;
    var last = lastRaw ? new Date(lastRaw) : null;
    var lastTxt = (last && !isNaN(last.getTime()))
      ? last.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : 'never';
    var edits = ob.editsSinceBackup || 0;
    /* green when the file is safe (a backup exists and little has changed);
       amber when edits have piled up since the last backup, or none was made. */
    var stale = (!last || isNaN(last.getTime())) || edits >= 10;
    banner.className = 'rd-settings-status' + (stale ? ' is-stale' : ' is-ok');
    banner.innerHTML =
      '<div class="rd-settings-status__row">' +
      '<span class="rd-settings-status__dot" aria-hidden="true"></span>' +
      '<span class="rd-settings-status__lead">Saved on this device</span>' +
      '</div>' +
      '<div class="rd-settings-status__meta">' +
      '<span>Last backup <b>' + esc(lastTxt) + '</b></span>' +
      '<span aria-hidden="true">·</span>' +
      '<span><b>' + edits + '</b> edit' + (edits === 1 ? '' : 's') + ' since</span>' +
      '</div>' +
      (stale
        ? '<div class="rd-settings-status__hint">' +
          (last && !isNaN(last.getTime())
            ? 'Enough has changed to be worth a fresh backup.'
            : 'No backup yet — this planner lives only in this browser.') +
          '</div>'
        : '');
  }

  /* ── six labelled panes ───────────────────────────────────────────────── */
  function paneLabels() {
    var prefs = document.getElementById('rd-prefs');
    if (!prefs) return;
    /* clear any headers we added on a previous run, then re-place them so the
       order tracks whatever redesign-shell.js moved into the menu. */
    Array.prototype.slice.call(prefs.querySelectorAll('.rd-settings-pane')).forEach(function (h) { h.remove(); });
    var kids = Array.prototype.slice.call(prefs.children);
    PANES.forEach(function (pane) {
      for (var i = 0; i < kids.length; i++) {
        var node = kids[i];
        if (node.classList && node.classList.contains('rd-settings-status')) continue;
        if (pane.match(node)) {
          var h = document.createElement('div');
          h.className = 'rd-settings-pane';
          h.setAttribute('data-pane', pane.key);
          h.textContent = pane.label;
          prefs.insertBefore(h, node);
          break;
        }
      }
    });
  }

  function enhance() {
    var prefs = document.getElementById('rd-prefs');
    if (!prefs) return;
    prefs.classList.add('rd-prefs-settings');
    refreshBanner();
    paneLabels();
  }

  /* refresh the live figures every time the gear opens */
  function watchOpen() {
    var prefs = document.getElementById('rd-prefs');
    var gear = document.getElementById('rd-gear-btn');
    if (!prefs || !gear || gear.dataset.rdSettingsBound) return;
    gear.dataset.rdSettingsBound = '1';
    gear.addEventListener('click', function () {
      /* run after redesign-shell.js has toggled the hidden attribute */
      setTimeout(function () {
        if (!prefs.hasAttribute('hidden')) enhance();
      }, 0);
    });
  }

  function boot() {
    if (!document.getElementById('rd-prefs')) { setTimeout(boot, 250); return; }
    enhance();
    watchOpen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }
})();
