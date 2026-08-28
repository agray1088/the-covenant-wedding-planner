/* Settings window — Master s39 · 49c "Settings · gear pop-out window".

   The drawing is a 1240px modal window, not a dropdown: a header, the save-status
   banner, then six labelled panes each with a description and rows of
   title + description + control. Its CSS already shipped (batch 47:
   .rd-settings-overlay / .rd-settings-window / .rd-set__*) but nothing ever
   built it, so the gear opened an unstyled menu instead. This builds it.

   Six panes, exactly as drawn:
     Save & backup · History · Export · Print · Region & format · Help & tools
   Look & feel is deliberately NOT here — the drawing says it lives in
   Profile & Display, and the header points at it.

   Relocate, don't re-author: the live controls (#csv-export-select,
   #print-target-select and the three regional selects #s-locale / #s-currency
   / #s-dateformat that the drawing moves out of Wedding Setup) are moved into
   the window with appendChild, so their ids, options and handlers survive.
   Buttons call the planner's own functions rather than cloning behaviour.

   Undo and Redo are drawn in their real disabled state — "Nothing to undo /
   Nothing yet" — so the window never lies about what is available. */
(function () {
  'use strict';

  var OVERLAY_ID = 'rd-settings-overlay';

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
  }

  function onboard() {
    try { if (typeof ensureOnboardData === 'function') return ensureOnboardData() || {}; } catch (e) {}
    try { return (typeof data !== 'undefined' && data && data.onboard) ? data.onboard : {}; } catch (e) {}
    return {};
  }

  function relTime(iso) {
    if (!iso) return null;
    var t = new Date(iso);
    if (isNaN(t.getTime())) return null;
    var mins = Math.max(0, Math.round((Date.now() - t.getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + ' hour' + (hrs === 1 ? '' : 's') + ' ago';
    var days = Math.round(hrs / 24);
    return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  }

  /* ── the save-status banner ───────────────────────────────────────────── */
  function bannerHtml() {
    var ob = onboard();
    var last = relTime(ob.lastBackupTime);
    var edits = ob.editsSinceBackup || 0;
    var stale = !last || edits >= 10;
    return '<div class="rd-set__note' + (stale ? ' rd-set__note--amber' : '') + '" id="rd-set-banner">'
      + '<b>Saved on this device.</b> This planner is not a cloud account — download a backup '
      + 'before clearing browser data, switching browsers or moving devices.'
      + '<div style="margin-top:5px">Last backup <b>' + esc(last || 'never') + '</b> · <b>'
      + edits + '</b> edit' + (edits === 1 ? '' : 's') + ' since</div>'
      + '</div>';
  }

  function paneHead(title, desc) {
    return '<div class="rd-set__pane-head" style="margin-top:26px">'
      + '<div class="rd-set__pane-title">' + esc(title) + '</div>'
      + '<div class="rd-set__pane-desc">' + esc(desc) + '</div></div>';
  }
  function row(title, desc, control) {
    return '<div class="rd-set__row"><div class="rd-set__row-text">'
      + '<div class="rd-set__row-title">' + esc(title) + '</div>'
      + (desc ? '<div class="rd-set__row-desc">' + esc(desc) + '</div>' : '')
      + '</div><div class="rd-set__row-control">' + control + '</div></div>';
  }
  function btn(label, onclick, danger) {
    return '<button type="button" class="rd-set__btn' + (danger ? ' rd-set__btn--danger' : '')
      + '" data-act="' + esc(onclick) + '">' + esc(label) + '</button>';
  }
  /* a slot the live control is moved into, so ids and handlers survive */
  function slot(id) { return '<span class="rd-set__slot" data-slot="' + esc(id) + '"></span>'; }

  /* ── undo / redo, drawn in their real state ───────────────────────────── */
  function undoRow(which) {
    var b = document.getElementById(which === 'undo' ? 'undo-btn' : 'redo-btn');
    var disabled = !b || b.disabled;
    var label = which === 'undo' ? 'Undo' : 'Redo';
    var control = disabled
      ? '<span class="rd-set__pillset"><span class="rd-set__pill rd-set__na">Nothing to '
        + which + '</span><span class="rd-set__pill rd-set__muted">Nothing yet</span></span>'
      : btn(label, which === 'undo' ? 'undoPlannerChange' : 'redoPlannerChange');
    return row(label, '', control);
  }

  function bodyHtml() {
    return bannerHtml()

      + paneHead('Save & backup', 'Everything saves automatically. A backup is the only copy that survives a cleared browser.')
      + row('Save now', 'Last saved ' + (relTime(onboard().lastSaveTime) || 'a moment ago'), btn('Save now', 'saveNow'))
      + row('Protect plan (backup)', 'Downloads a .sqlite file', btn('Download backup', 'downloadSqliteBackup'))
      + row('Restore from backup', 'Accepts .sqlite, .db or .json', btn('Restore', 'rdSetRestore'))

      + paneHead('History', 'Undo and redo cover recent changes on this device.')
      + undoRow('undo')
      + undoRow('redo')
      + row('Open change history', 'Every edit, by record and by field', btn('Open history', 'rdSetHistory'))

      + paneHead('Export', 'One list at a time, or the whole planner as spreadsheets.')
      + row('List to export', '13 lists', slot('csv-export-select'))
      + row('Export CSV', 'Opens in Excel, Numbers or Sheets', btn('Export CSV', 'exportSelectedListCSV'))

      + paneHead('Print', 'Choose a page, then print it as it appears on screen.')
      + row('Page to print', '30 pages', slot('print-target-select'))
      + row('Print page', 'Print styles are built into each page', btn('Print page', 'printSelectedSection'))

      + paneHead('Region & format', 'Applies to every date, time and money figure in the planner.')
      + row('Region / locale', '12 locales', slot('s-locale'))
      + row('Currency', '14 currencies', slot('s-currency'))
      + row('Date format', 'MDY · DMY · YMD', slot('s-dateformat'))

      + paneHead('Help & tools', '')
      + row('Auto-fit columns', 'Fits the table you are looking at', btn('Auto-fit', 'autoFitActivePanelTables'))
      + row('Open planner help', 'Get started, page guide and FAQ', btn('Open help', 'openPlannerHelp'))
      + '<div class="rd-set__note" style="margin-top:16px">Auto-fit acts on one table. '
      + 'Pages with two or three tables fit the one you last touched.</div>';
  }

  function build() {
    var ov = document.getElementById(OVERLAY_ID);
    if (!ov) {
      ov = document.createElement('div');
      ov.id = OVERLAY_ID;
      ov.className = 'rd-settings-overlay';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    }
    ov.innerHTML =
      '<div class="rd-settings-window" role="dialog" aria-modal="true" aria-label="Settings">'
      + '<div class="rd-set__head">'
      + '<span class="rd-set__mark" aria-hidden="true">&#10022;</span>'
      + '<span class="rd-set__title">Settings</span>'
      + '<span class="rd-set__saved">Backups, exports, printing, history and regional format. '
      + 'Look &amp; feel lives in Profile &amp; Display.</span>'
      + '<button type="button" class="rd-set__link" data-act="rdSetProfile">Profile &amp; Display</button>'
      + '<button type="button" class="rd-set__close" aria-label="Close settings">&times;</button>'
      + '</div>'
      + '<div class="rd-set__panebody">' + bodyHtml() + '</div>'
      + '</div>';

    /* move the live controls in — ids, options and handlers survive */
    Array.prototype.forEach.call(ov.querySelectorAll('[data-slot]'), function (s) {
      var el = document.getElementById(s.getAttribute('data-slot'));
      if (el) s.appendChild(el);
    });

    ov.querySelector('.rd-set__close').addEventListener('click', close);
    Array.prototype.forEach.call(ov.querySelectorAll('[data-act]'), function (b) {
      b.addEventListener('click', function () { run(b.getAttribute('data-act')); });
    });
    return ov;
  }

  function run(name) {
    try {
      if (name === 'rdSetRestore') {
        var inp = document.getElementById('importInput');
        if (inp) inp.click();
        return;
      }
      if (name === 'rdSetHistory') {
        close();
        window._histReturnPanel = document.body.getAttribute('data-active-panel') || 'dashboard';
        if (typeof showPanel === 'function') showPanel('history', true);
        return;
      }
      if (name === 'rdSetProfile') {
        close();
        if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
        return;
      }
      if (typeof window[name] === 'function') window[name]();
    } catch (e) { /* never let one control break the window */ }
  }

  function open() {
    var ov = build();
    ov.classList.add('is-open');
    document.addEventListener('keydown', onEsc, true);
  }
  function close() {
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.remove('is-open');
    document.removeEventListener('keydown', onEsc, true);
  }
  function onEsc(e) { if (e.key === 'Escape') close(); }

  window.openSettingsWindow = open;
  window.closeSettingsWindow = close;

  /* ── the gear opens the window, not a dropdown ────────────────────────── */
  function bindGear() {
    var gear = document.getElementById('rd-gear-btn');
    if (!gear || gear.dataset.rdSetBound) return false;
    gear.dataset.rdSetBound = '1';
    gear.setAttribute('aria-label', 'Settings');
    /* capture so redesign-shell's own toggle never runs */
    gear.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var prefs = document.getElementById('rd-prefs');
      if (prefs) prefs.setAttribute('hidden', '');
      open();
    }, true);
    return true;
  }

  function boot() {
    if (!bindGear()) { setTimeout(boot, 300); return; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 500); });
  } else {
    setTimeout(boot, 500);
  }
})();
