/* Settings window — Master s39 · 49c "Settings · gear pop-out window".

   1240px modal: forest header, green save-status banner, six labelled pane
   cards in a 3×2 grid. Relocate, don't re-author — live controls keep their
   ids and handlers via appendChild slots. */
(function () {
  'use strict';

  var OVERLAY_ID = 'rd-settings-overlay';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.2 2.2 4.8-5"/></svg>';
  var GEAR_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.6 7.4l2.3 1.3M17.1 15.3l2.3 1.3M4.6 16.6l2.3-1.3M17.1 8.7l2.3-1.3"/></svg>';

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

  function bannerHtml() {
    var ob = onboard();
    var last = relTime(ob.lastBackupTime);
    var edits = ob.editsSinceBackup || 0;
    var stale = !ob.lastBackupTime || edits >= 10;
    return '<div class="rd-set__banner' + (stale ? ' rd-set__banner--amber' : '') + '" id="rd-set-banner">'
      + '<span class="rd-set__banner-icon">' + CHECK_SVG + '</span>'
      + '<span class="rd-set__banner-text"><b>Saved on this device.</b> This planner is not a cloud account — download a backup '
      + 'before clearing browser data, switching browsers or moving devices.</span>'
      + '<span class="rd-set__banner-meta">Last backup ' + esc(last || 'never') + ' · '
      + edits + ' edit' + (edits === 1 ? '' : 's') + ' since</span>'
      + '</div>';
  }

  function btn(label, onclick, danger) {
    return '<button type="button" class="rd-set__btn' + (danger ? ' rd-set__btn--danger' : '')
      + '" data-act="' + esc(onclick) + '">' + esc(label) + '</button>';
  }
  function slot(id) { return '<span class="rd-set__slot" data-slot="' + esc(id) + '"></span>'; }

  function cardRow(title, desc, control) {
    return '<div class="rd-set__card-row"><div class="rd-set__card-row-text">'
      + '<div class="rd-set__card-row-title">' + esc(title) + '</div>'
      + (desc ? '<div class="rd-set__card-row-desc">' + esc(desc) + '</div>' : '')
      + '</div><div class="rd-set__card-row-control">' + control + '</div></div>';
  }

  function card(title, desc, inner) {
    return '<section class="rd-set__card"><div class="rd-set__card-head">'
      + '<span class="rd-set__card-title">' + esc(title) + '</span></div>'
      + '<p class="rd-set__card-desc">' + esc(desc) + '</p>'
      + '<div class="rd-set__card-body">' + inner + '</div></section>';
  }

  function undoControl(which) {
    var b = document.getElementById(which === 'undo' ? 'undo-btn' : 'redo-btn');
    var disabled = !b || b.disabled;
    if (disabled) {
      return '<span class="rd-set__pillset"><span class="rd-set__pill rd-set__na">Nothing to '
        + which + '</span><span class="rd-set__pill rd-set__muted">Nothing yet</span></span>';
    }
    return btn(which === 'undo' ? 'Undo' : 'Redo', which === 'undo' ? 'undoPlannerChange' : 'redoPlannerChange');
  }

  function cardsHtml() {
    var ob = onboard();
    return '<div class="rd-set__cards">'
      + card('Save & backup', 'Everything saves automatically. A backup is the only copy that survives a cleared browser.',
        cardRow('Save now', 'Last saved ' + (relTime(ob.lastSaveTime) || 'a moment ago'), btn('Save now', 'saveNow'))
        + cardRow('Protect plan (backup)', 'Downloads a .sqlite file', btn('Download backup', 'downloadSqliteBackup'))
        + cardRow('Restore from backup', 'Accepts .sqlite, .db or .json', btn('Restore', 'rdSetRestore')))
      + card('History', 'Undo and redo cover recent changes on this device.',
        cardRow('Undo', '', undoControl('undo'))
        + cardRow('Redo', '', undoControl('redo'))
        + cardRow('Open change history', 'Every edit, by record and by field', btn('Open history', 'rdSetHistory')))
      + card('Export', 'One list at a time, or the whole planner as spreadsheets.',
        cardRow('List to export', '13 lists', slot('csv-export-select'))
        + cardRow('Export CSV', 'Opens in Excel, Numbers or Sheets', btn('Export CSV', 'exportSelectedListCSV')))
      + card('Print', 'Choose a page, then print it as it appears on screen.',
        cardRow('Page to print', '30 pages', slot('print-target-select'))
        + cardRow('Print page', 'Print styles are built into each page', btn('Print page', 'printSelectedSection')))
      + card('Region & format', 'Applies to every date, time and money figure in the planner.',
        cardRow('Region / locale', '12 locales', slot('s-locale'))
        + cardRow('Currency', '14 currencies', slot('s-currency'))
        + cardRow('Date format', 'MDY · DMY · YMD', slot('s-dateformat')))
      + card('Help & tools', 'Shortcuts to the help pages and table tools.',
        cardRow('Auto-fit columns', 'Fits the table you are looking at', btn('Auto-fit', 'autoFitActivePanelTables'))
        + cardRow('Get Started', 'How the planner works and your first steps', btn('Open', 'rdSetGetStarted'))
        + cardRow('Page-by-Page Guide', 'What each page does and what syncs', btn('Open', 'rdSetGuide'))
        + cardRow('FAQ', 'Answers to common questions', btn('Open', 'rdSetFaq')))
      + '</div>'
      + '<div class="rd-set__footnote">Auto-fit acts on one table. Pages with two or three tables fit the one you last touched.</div>';
  }

  function bodyHtml() {
    return bannerHtml() + cardsHtml();
  }

  function wireActions(ov) {
    ov.querySelector('.rd-set__close').addEventListener('click', close);
    Array.prototype.forEach.call(ov.querySelectorAll('[data-act]'), function (b) {
      b.addEventListener('click', function () { run(b.getAttribute('data-act')); });
    });
  }

  function moveSlots(ov) {
    Array.prototype.forEach.call(ov.querySelectorAll('[data-slot]'), function (s) {
      var el = document.getElementById(s.getAttribute('data-slot'));
      if (el) s.appendChild(el);
    });
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
      + '<div class="rd-set__head rd-set__head--forest">'
      + '<span class="rd-set__mark">' + GEAR_SVG + '</span>'
      + '<div class="rd-set__head-copy">'
      + '<span class="rd-set__title">Settings</span>'
      + '<span class="rd-set__saved">Backups, exports, printing, history and regional format. '
      + 'Look &amp; feel lives in Profile &amp; Display.</span>'
      + '</div>'
      + '<button type="button" class="rd-set__profile-chip" data-act="rdSetProfile">Profile &amp; Display</button>'
      + '<button type="button" class="rd-set__close" aria-label="Close settings">&times;</button>'
      + '</div>'
      + '<div class="rd-set__panebody">' + bodyHtml() + '</div>'
      + '</div>';

    moveSlots(ov);
    wireActions(ov);
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
      if (name === 'rdSetGetStarted' || name === 'rdSetGuide' || name === 'rdSetFaq') {
        var panel = name === 'rdSetGetStarted' ? 'instructions'
          : name === 'rdSetGuide' ? 'guide' : 'faq';
        close();
        if (typeof showPanel === 'function') showPanel(panel, true);
        requestAnimationFrame(function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        return;
      }
      if (typeof window[name] === 'function') window[name]();
    } catch (e) { /* never let one control break the window */ }
  }

  function open() {
    build();
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.add('is-open');
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

  function bindGear() {
    var gear = document.getElementById('rd-gear-btn');
    if (!gear || gear.dataset.rdSetBound) return false;
    gear.dataset.rdSetBound = '1';
    gear.setAttribute('aria-label', 'Settings');
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
