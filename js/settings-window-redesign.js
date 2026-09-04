/* Settings window — Master s39 · 49c "Settings · gear pop-out window".

   1240px modal: forest header, green save-status banner, six labelled pane
   cards in a 3×2 grid. Relocate, don't re-author — live controls keep their
   ids and handlers via appendChild slots. */
(function () {
  'use strict';

  var OVERLAY_ID = 'rd-settings-overlay';
  var ALERT_RULES_KEY = 'rd-planner-alert-rules';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.2 2.2 4.8-5"/></svg>';
  var GEAR_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.6 7.4l2.3 1.3M17.1 15.3l2.3 1.3M4.6 16.6l2.3-1.3M17.1 8.7l2.3-1.3"/></svg>';
  var ALERT_RULE_DEFAULTS = {
    paymentDue: '7+1',
    contractWindow: true,
    rsvpDigest: true,
    taskUnblocked: true,
    vendorUpload: false
  };

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

  function card(title, desc, inner, extraClass, id) {
    return '<section class="rd-set__card' + (extraClass ? ' ' + extraClass : '') + '"'
      + (id ? ' id="' + esc(id) + '"' : '') + '><div class="rd-set__card-head">'
      + '<span class="rd-set__card-title">' + esc(title) + '</span></div>'
      + '<p class="rd-set__card-desc">' + esc(desc) + '</p>'
      + '<div class="rd-set__card-body">' + inner + '</div></section>';
  }

  function alertRules() {
    try {
      var raw = localStorage.getItem(ALERT_RULES_KEY);
      if (raw) return Object.assign({}, ALERT_RULE_DEFAULTS, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return Object.assign({}, ALERT_RULE_DEFAULTS);
  }

  function saveAlertRules(next) {
    try { localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    if (typeof window.rdSyncProfileAlertSummary === 'function') window.rdSyncProfileAlertSummary();
  }

  function segControl(ruleKey, options, active) {
    return '<div class="rd-seg rd-set__seg" role="group" data-alert-rule="' + esc(ruleKey) + '">'
      + options.map(function (opt) {
        return '<button type="button" class="rd-seg__opt' + (opt.value === active ? ' is-active' : '')
          + '" data-value="' + esc(opt.value) + '">' + esc(opt.label) + '</button>';
      }).join('')
      + '</div>';
  }

  function switchControl(ruleKey, on, locked) {
    return '<button type="button" class="rd-gaps-switch' + (on ? ' is-on' : '') + (locked ? ' is-locked' : '')
      + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-alert-toggle="' + esc(ruleKey) + '"'
      + (locked ? ' disabled' : '') + '><span class="rd-gaps-switch__dot"></span></button>';
  }

  function alertRulesCard() {
    var rules = alertRules();
    return card('Planner alert rules',
      'What earns an interruption. A notification is for something with a deadline and a consequence — never for activity.',
      cardRow('Payment due', 'Two reminders: seven days out and the morning of. A missed instalment can release a venue date.',
        segControl('paymentDue', [
          { value: 'off', label: 'Off' },
          { value: '7', label: '7 days' },
          { value: '7+1', label: '7 + 1 day' }
        ], rules.paymentDue))
      + cardRow('Contract expiring or unsigned', 'Fires on the cancellation window closing, not on the signature being late.',
        switchControl('contractWindow', rules.contractWindow))
      + cardRow('RSVP deadline passing', 'One digest of who has not answered, on the deadline. Not one per guest.',
        switchControl('rsvpDigest', rules.rsvpDigest))
      + cardRow('Blocked task became unblocked', 'The moment work can start is worth an interruption; the moment it was blocked is not.',
        switchControl('taskUnblocked', rules.taskUnblocked))
      + cardRow('Vendor uploaded a document', 'Off by default. It arrives in Planner History either way.',
        switchControl('vendorUpload', rules.vendorUpload))
      + cardRow('Someone else edited a record', 'Deliberately absent. A shared file that narrates itself teaches you to ignore it.',
        '<span class="rd-set__na">Not available</span>')
      + cardRow('Where they appear', 'No email, no push. The planner has no mail account and no server to send from.',
        segControl('delivery', [{ value: 'topbar', label: 'Top bar only' }], 'topbar'))
      + '<div class="rd-set__note">The notification panel behind the bell decides what needs you today. '
      + 'This pane decides what is allowed to reach it. Device settings live in this browser — restoring a backup '
      + 'on another machine brings the wedding, not these preferences.</div>',
      'rd-set__card--wide', 'rd-set-alert-rules');
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
      + alertRulesCard()
      + '</div>'
      + '<div class="rd-set__footnote">Auto-fit acts on one table. Pages with two or three tables fit the one you last touched.</div>';
  }

  var SETTING_NAV = [
    { group: 'This device', items: [
      { id: 'overview', label: 'Overview' },
      { id: 'display', label: 'Display & density' },
      { id: 'dayof', label: 'Day-of mode' },
      { id: 'notifications', label: 'Notifications' }
    ]},
    { group: 'The planner', items: [
      { id: 'setup', label: 'Wedding setup' },
      { id: 'people', label: 'People & roles' },
      { id: 'money', label: 'Money rules' },
      { id: 'documents', label: 'Documents & printing' }
    ]},
    { group: 'This file', items: [
      { id: 'backup', label: 'Backup & restore' },
      { id: 'import', label: 'Import' },
      { id: 'trash', label: 'Trash' },
      { id: 'about', label: 'About' }
    ]},
    { group: 'Help', items: [
      { id: 'getstarted', label: 'Get started' },
      { id: 'guide', label: 'Page-by-page guide' },
      { id: 'faq', label: 'FAQ' }
    ]}
  ];

  function paneShell(title, lead, body) {
    return '<div class="rd-set__pane">'
      + '<div class="rd-set__pane-head"><h3>' + esc(title) + '</h3>'
      + (lead ? '<p>' + esc(lead) + '</p>' : '') + '</div>'
      + '<div class="rd-set__pane-body">' + body + '</div></div>';
  }

  function navHtml(active) {
    return '<nav class="rd-set__nav" aria-label="Settings panes">'
      + SETTING_NAV.map(function (g) {
        return '<div class="rd-set__nav-grp">' + esc(g.group) + '</div>'
          + g.items.map(function (it) {
            return '<button type="button" class="rd-set__nav-item' + (it.id === active ? ' is-active' : '')
              + '" data-set-pane="' + esc(it.id) + '">' + esc(it.label) + '</button>';
          }).join('');
      }).join('')
      + '</nav>';
  }

  function paneHtml(id) {
    if (id === 'overview' || !id) return bannerHtml() + cardsHtml();
    if (id === 'display') {
      return paneShell('Display & density',
        'Look & feel lives in Profile & Display — density is the one people change hourly.',
        cardRow('Open Profile & Display', 'Appearance, font, planning view, density', btn('Open', 'rdSetProfile'))
        + cardRow('Region & format', 'Locale, currency, date order', '<span class="rd-set__muted">On Overview</span>'));
    }
    if (id === 'dayof') {
      return paneShell('Day-of mode',
        'On the day nobody edits records. They check the time, read the next cue, and phone somebody.',
        cardRow('Open day-of timeline', 'Wedding Day Timeline · current cue', btn('Open timeline', 'rdSetTimeline'))
        + '<div class="rd-set__note">Day-of mode hides edit chrome. It does not delete anything.</div>');
    }
    if (id === 'notifications') {
      return paneShell('Notifications',
        'What earns an interruption. A notification is for something with a deadline and a consequence.',
        alertRulesCard());
    }
    if (id === 'setup') {
      return paneShell('Wedding setup',
        'The eleven facts every other page reads — couple, date, venues, budget target, timezone.',
        cardRow('Open Wedding Setup', 'Couple, date, venues, menu visibility', btn('Open', 'rdSetSetup')));
    }
    if (id === 'people') {
      return paneShell('People & roles',
        'Who can reach which pages. Viewer preferences hold the link list; Profile Access holds this person.',
        cardRow('Viewer preferences', 'Who has a way in', btn('Open', 'rdSetViewerPrefs'))
        + cardRow('Your Access tab', 'What you can reach on this device', btn('Open Access', 'rdSetAccessTab')));
    }
    if (id === 'money') {
      return paneShell('Money rules',
        'Currency and date format apply to every money figure. Budget target lives on Wedding Setup.',
        cardRow('Currency & locale', 'On Overview · Region & format', '<span class="rd-set__muted">On Overview</span>')
        + cardRow('Budget target', 'Owned by Wedding Setup', btn('Open Setup', 'rdSetSetup')));
    }
    if (id === 'documents') {
      return paneShell('Documents & printing',
        'Print a page as it appears. Export one list at a time as CSV.',
        cardRow('Print page', '30 pages', btn('Print', 'printSelectedSection'))
        + cardRow('Export CSV', '13 lists', btn('Export', 'exportSelectedListCSV'))
        + cardRow('Auto-fit columns', 'Fits the table you last touched', btn('Auto-fit', 'autoFitActivePanelTables')));
    }
    if (id === 'backup') {
      return paneShell('Backup & restore',
        'A backup is the only copy that survives a cleared browser.',
        cardRow('Download backup', 'Single .sqlite file', btn('Download backup', 'downloadSqliteBackup'))
        + cardRow('Restore from backup', 'Accepts .sqlite, .db or .json', btn('Restore', 'rdSetRestore'))
        + cardRow('Save now', '', btn('Save now', 'saveNow')));
    }
    if (id === 'import') {
      return paneShell('Import',
        'Restore replaces this browser\'s copy with the file you choose.',
        cardRow('Restore from file', 'Same path as backup restore', btn('Choose file', 'rdSetRestore')));
    }
    if (id === 'trash') {
      return paneShell('Trash',
        'The planner does not keep a separate trash bin. Deleted rows leave Planner History.',
        '<div class="rd-set__note">Undo covers recent deletes on this device. Older deletes stay in Planner History as a record of what changed — they are not recoverable from a trash list.</div>'
        + cardRow('Open Planner History', '', btn('Open history', 'rdSetHistory')));
    }
    if (id === 'about') {
      return paneShell('About',
        'The Covenant Wedding Planner — offline-first, one file per wedding.',
        '<div class="rd-set__note">No account, no cloud, no tracking. The trade-off is that backups are your job. Look &amp; feel lives in Profile &amp; Display; this window holds backups, exports, printing, history and regional format.</div>');
    }
    if (id === 'getstarted') {
      return paneShell('Get started', 'How the planner works and your first steps.',
        cardRow('Open Get Started', '', btn('Open', 'rdSetGetStarted')));
    }
    if (id === 'guide') {
      return paneShell('Page-by-page guide', 'What each page does and what syncs.',
        cardRow('Open guide', '', btn('Open', 'rdSetGuide')));
    }
    if (id === 'faq') {
      return paneShell('FAQ', 'Answers to common questions.',
        cardRow('Open FAQ', '', btn('Open', 'rdSetFaq')));
    }
    return bannerHtml() + cardsHtml();
  }

  function bodyHtml(pane) {
    var active = pane || window._rdSetPane || 'overview';
    return '<div class="rd-set__grid">'
      + navHtml(active)
      + '<div class="rd-set__main" id="rd-set-main">' + paneHtml(active) + '</div>'
      + '</div>';
  }

  function wireAlertRules(ov) {
    var rules = alertRules();
    Array.prototype.forEach.call(ov.querySelectorAll('[data-alert-rule]'), function (group) {
      var key = group.getAttribute('data-alert-rule');
      if (key === 'delivery') return;
      Array.prototype.forEach.call(group.querySelectorAll('.rd-seg__opt'), function (opt) {
        opt.addEventListener('click', function () {
          rules[key] = opt.getAttribute('data-value');
          saveAlertRules(rules);
          Array.prototype.forEach.call(group.querySelectorAll('.rd-seg__opt'), function (o) {
            o.classList.toggle('is-active', o === opt);
          });
        });
      });
    });
    Array.prototype.forEach.call(ov.querySelectorAll('[data-alert-toggle]'), function (sw) {
      sw.addEventListener('click', function () {
        if (sw.disabled || sw.classList.contains('is-locked')) return;
        var key = sw.getAttribute('data-alert-toggle');
        rules[key] = !rules[key];
        saveAlertRules(rules);
        sw.classList.toggle('is-on', rules[key]);
        sw.setAttribute('aria-checked', rules[key] ? 'true' : 'false');
      });
    });
  }

  function wireNav(ov) {
    Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (btn) {
      btn.addEventListener('click', function () {
        window._rdSetPane = btn.getAttribute('data-set-pane') || 'overview';
        var main = ov.querySelector('#rd-set-main');
        if (main) {
          main.innerHTML = paneHtml(window._rdSetPane);
          moveSlots(ov);
          wireActions(ov);
        }
        Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
  }

  function wireActions(ov) {
    var closeBtn = ov.querySelector('.rd-set__close');
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', close);
    }
    Array.prototype.forEach.call(ov.querySelectorAll('[data-act]'), function (b) {
      if (b.dataset.actBound) return;
      b.dataset.actBound = '1';
      b.addEventListener('click', function () { run(b.getAttribute('data-act')); });
    });
    wireAlertRules(ov);
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
      + '<div class="rd-set__panebody">' + bodyHtml(window._rdSetPane || 'overview') + '</div>'
      + '</div>';

    moveSlots(ov);
    wireActions(ov);
    wireNav(ov);
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
      if (name === 'rdSetAccessTab') {
        close();
        window._pdDrawerTab = 'access';
        if (typeof openProfileDrawer === 'function') openProfileDrawer();
        else if (typeof toggleProfileDrawer === 'function') toggleProfileDrawer();
        if (typeof rdPdSetTab === 'function') rdPdSetTab('access');
        return;
      }
      if (name === 'rdSetSetup') {
        close();
        if (typeof showPanel === 'function') showPanel('setup', true);
        return;
      }
      if (name === 'rdSetTimeline') {
        close();
        if (typeof showPanel === 'function') showPanel('timeline', true);
        return;
      }
      if (name === 'rdSetViewerPrefs') {
        close();
        if (typeof showPanel === 'function') showPanel('viewer-prefs', true);
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

  function focusSection(section) {
    if (!section) return;
    if (section === 'alerts' || section === 'notifications') {
      window._rdSetPane = 'notifications';
      var ov = document.getElementById(OVERLAY_ID);
      if (ov) {
        var main = ov.querySelector('#rd-set-main');
        if (main) {
          main.innerHTML = paneHtml('notifications');
          moveSlots(ov);
          wireActions(ov);
        }
        Array.prototype.forEach.call(ov.querySelectorAll('[data-set-pane]'), function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-set-pane') === 'notifications');
        });
      }
      return;
    }
    var target = document.getElementById(section === 'alerts' ? 'rd-set-alert-rules' : section);
    if (!target) return;
    requestAnimationFrame(function () {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('rd-set__card--focus');
      setTimeout(function () { target.classList.remove('rd-set__card--focus'); }, 1400);
    });
  }

  function open(section) {
    build();
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.add('is-open');
    document.addEventListener('keydown', onEsc, true);
    focusSection(section);
  }
  function close() {
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.classList.remove('is-open');
    document.removeEventListener('keydown', onEsc, true);
  }
  function onEsc(e) { if (e.key === 'Escape') close(); }

  window.openSettingsWindow = open;
  window.closeSettingsWindow = close;
  window.rdGetPlannerAlertRules = alertRules;

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
