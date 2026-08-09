/* ═══════════════════════════════════════════════════════════════════════════
   gaps-redesign.js — Planner Screens Gaps.dc.html, batches 45 / 47 / 48
   ───────────────────────────────────────────────────────────────────────────
   Draws the four top-bar menus (45), the settings window with every pane (47)
   and the retabbed 360px profile drawer (48). Loads AFTER redesign-shell.js so
   the `.rd-topbar` and the planner's live controls already exist; it mutates
   the built chrome rather than editing the shell.

   Source of truth: Redesign/Planner Screens Gaps.dc.html + /tmp/gaps-inventory.
   Every visible string is copied verbatim from the mock.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── small helpers ──────────────────────────────────────────────────── */
  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html).trim();
    return d.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function call(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    try {
      if (typeof window[name] === 'function') return window[name].apply(window, args);
    } catch (e) { /* soft */ }
    return undefined;
  }
  function hasFn(name) { return typeof window[name] === 'function'; }
  /* planner.js declares `data` with `let`, so it is a global *lexical* binding,
     not a property of window. Reach it by identifier, guarded. */
  function getData() { try { return (typeof data !== 'undefined') ? data : null; } catch (e) { return null; } }

  /* ═══════════════════════════════════════════════════════════════════════
     DEVICE PREFERENCES — one store, two doors (Settings ↔ Profile · Display)
     Batch 47 "Display & density" and batch 48 "Display" tab share this store.
     Persisted on data.setup.devicePrefs (travels nowhere in a backup that is
     device-only — but we mirror to localStorage so it survives a reload even
     before `data` exists), and applied as body classes + CSS vars.
     ═══════════════════════════════════════════════════════════════════════ */
  var PREFS_LS_KEY = 'covenant_gaps_device_prefs';
  var PREFS_DEFAULTS = {
    density: 'compact',        /* comfortable | compact  (mock shows Compact)  */
    derivedGrey: true,         /* toggle on                                    */
    reduceMotion: false,
    fontSize: 'default',       /* default | large                             */
    currency: '$',             /* $ | GH₵ | £                                 */
    dateFormat: 'long'         /* long (8 Nov 2026) | iso (2026-11-08)        */
  };

  function readPrefs() {
    var p = {};
    /* prefer the planner file's copy when present */
    try {
      var d = getData();
      if (d && d.setup && d.setup.devicePrefs) p = Object.assign({}, d.setup.devicePrefs);
    } catch (e) { /* soft */ }
    if (!Object.keys(p).length) {
      try { p = JSON.parse(localStorage.getItem(PREFS_LS_KEY) || '{}') || {}; }
      catch (e) { p = {}; }
    }
    return Object.assign({}, PREFS_DEFAULTS, p);
  }
  function writePrefs(p) {
    try { localStorage.setItem(PREFS_LS_KEY, JSON.stringify(p)); } catch (e) { /* soft */ }
    try {
      var d = getData();
      if (d) {
        if (!d.setup || typeof d.setup !== 'object') d.setup = {};
        d.setup.devicePrefs = Object.assign({}, p);
        if (hasFn('saveHistorySilent')) saveHistorySilent();
        else if (hasFn('saveData')) saveData();
      }
    } catch (e) { /* soft */ }
  }
  var _prefs = null;
  function getPrefs() { if (!_prefs) _prefs = readPrefs(); return _prefs; }
  function setPref(key, val) {
    var p = getPrefs();
    p[key] = val;
    _prefs = p;
    writePrefs(p);
    applyPrefs();
    refreshDeviceControls();
  }
  function applyPrefs() {
    var p = getPrefs();
    var b = document.body;
    if (!b) return;
    b.classList.toggle('rd-gaps-compact', p.density === 'compact');
    b.classList.toggle('rd-gaps-derived-grey', !!p.derivedGrey);
    b.classList.toggle('rd-gaps-reduce-motion', !!p.reduceMotion);
    b.classList.toggle('rd-gaps-font-large', p.fontSize === 'large');
    b.style.setProperty('--rd-gaps-row-h', p.density === 'compact' ? '32px' : '44px');
  }

  /* segmented control + toggle shared markup, bound to a pref key */
  function seg(prefKey, options) {
    var cur = getPrefs()[prefKey];
    return '<div class="rd-seg" role="group">' + options.map(function (o) {
      var active = String(o[0]) === String(cur);
      return '<button type="button" class="rd-seg__opt' + (active ? ' is-active' : '') +
        '" data-gaps-pref="' + esc(prefKey) + '" data-gaps-val="' + esc(o[0]) + '"' +
        (active ? ' aria-pressed="true"' : '') + '>' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function sw(prefKey) {
    var on = !!getPrefs()[prefKey];
    return '<button type="button" class="rd-gaps-switch' + (on ? ' is-on' : '') +
      '" role="switch" aria-checked="' + (on ? 'true' : 'false') +
      '" data-gaps-pref="' + esc(prefKey) + '" data-gaps-val="__toggle"><span class="rd-gaps-switch__dot"></span></button>';
  }

  /* re-render any open surface that mirrors device prefs */
  function refreshDeviceControls() {
    var win = document.getElementById('rd-settings-window');
    if (win && win.getAttribute('data-pane') === 'display') renderSettingsPane('display');
    var pd = document.getElementById('profile-drawer');
    if (pd && pd.getAttribute('data-gaps-tab') === 'display') renderProfileDisplayTab();
  }

  /* delegated handler for every pref control (settings + profile drawer) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-gaps-pref]');
    if (!t) return;
    var key = t.getAttribute('data-gaps-pref');
    var val = t.getAttribute('data-gaps-val');
    if (val === '__toggle') setPref(key, !getPrefs()[key]);
    else setPref(key, val);
    e.preventDefault();
  });

  /* ═══════════════════════════════════════════════════════════════════════
     BATCH 45 — the four top-bar menus
     ═══════════════════════════════════════════════════════════════════════ */

  var SVG_CHEV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  function viewerInitials() {
    /* the viewer is the planner (Ama Osei · AO) in the mock */
    try {
      var d = getData();
      if (d && d.setup) {
        var n = d.setup.plannerName || d.setup.viewerName;
        if (n) {
          var parts = String(n).trim().split(/\s+/);
          return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
        }
      }
    } catch (e) { /* soft */ }
    return 'AO';
  }
  function coupleInitials() {
    try {
      var d = getData();
      if (d && d.setup) {
        var a = (d.setup.bride || '').trim(), b = (d.setup.groom || '').trim();
        if (a || b) return ((a[0] || '') + (b[0] || '')).toUpperCase() || 'AK';
      }
    } catch (e) { /* soft */ }
    return 'AK';
  }

  /* current page display name, for the page-aware help entries */
  function currentPageName() {
    var active = document.body.getAttribute('data-active-panel') || '';
    var sub = document.querySelector('.rd-subnav__item.is-active');
    if (sub && sub.textContent.trim()) return sub.textContent.trim();
    var map = {
      guests: 'Guest List', households: 'Households', contacts: 'Contacts',
      dashboard: 'Dashboard', budget: 'Budget', payments: 'Payments',
      tasks: 'Timeline & Tasks', tables: 'Table Layout', 'print-centre': 'Print Centre'
    };
    if (map[active]) return map[active];
    return active ? active.charAt(0).toUpperCase() + active.slice(1) : 'this page';
  }

  /* ── generic popover plumbing ─────────────────────────────────────────── */
  var _openPopover = null;
  function closePopovers() {
    document.querySelectorAll('.rd-gaps-pop.is-open').forEach(function (p) {
      p.classList.remove('is-open');
      p.setAttribute('hidden', '');
    });
    if (_openPopover && _openPopover.btn) _openPopover.btn.setAttribute('aria-expanded', 'false');
    _openPopover = null;
  }
  function positionPop(pop, btn, alignRight) {
    var r = btn.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.top = (r.bottom + 6) + 'px';
    if (alignRight) {
      pop.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      pop.style.left = 'auto';
    } else {
      pop.style.left = Math.max(8, r.left) + 'px';
      pop.style.right = 'auto';
    }
  }
  function togglePop(pop, btn, alignRight) {
    var isOpen = pop.classList.contains('is-open');
    closePopovers();
    if (isOpen) return;
    pop.removeAttribute('hidden');
    pop.classList.add('is-open');
    positionPop(pop, btn, alignRight);
    if (btn) btn.setAttribute('aria-expanded', 'true');
    _openPopover = { pop: pop, btn: btn };
  }
  document.addEventListener('click', function (e) {
    if (!_openPopover) return;
    if (_openPopover.pop.contains(e.target)) return;
    if (_openPopover.btn && _openPopover.btn.contains(e.target)) return;
    closePopovers();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _openPopover) closePopovers();
  });
  window.addEventListener('resize', function () {
    if (_openPopover) positionPop(_openPopover.pop, _openPopover.btn, _openPopover.alignRight);
  });

  /* menu row helper — label + optional kbd hint */
  function mrow(label, kbd, extraClass) {
    return '<button type="button" class="rd-menu__row' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<span class="rd-menu__label">' + label + '</span>' +
      (kbd ? '<span class="rd-menu__kbd">' + esc(kbd) + '</span>' : '') + '</button>';
  }
  function mgrp(label) { return '<div class="rd-menu__grp">' + esc(label) + '</div>'; }
  function mdiv() { return '<div class="rd-menu__div"></div>'; }

  /* ── avatar menu ──────────────────────────────────────────────────────── */
  function buildAvatarMenu() {
    var pop = el('<div class="rd-gaps-pop rd-avatar-menu" id="rd-avatar-menu" role="menu" hidden></div>');
    pop.innerHTML =
      '<div class="rd-menu__person">' +
        '<span class="rd-menu__ava">' + esc(viewerInitials()) + '</span>' +
        '<div class="rd-menu__pmeta"><div class="rd-menu__pname">Ama Osei</div>' +
          '<div class="rd-menu__prole">Planner · full access</div></div>' +
      '</div>' +
      mgrp('This device') +
      mrow('Your profile &amp; display', '', 'js-profile') +
      mrow('Switch to couple view', '', 'js-couple') +
      mrow('Day-of mode', '⌥D', 'js-dayof') +
      mdiv() +
      mgrp('The planner') +
      mrow('Settings', '⌘,', 'js-settings') +
      mrow('Wedding setup', '', 'js-setup') +
      mrow('Backup &amp; restore', '', 'js-backup') +
      mrow('Trash', '30 days', 'js-trash') +
      mdiv() +
      mgrp('Help') +
      mrow('Keyboard shortcuts', '?', 'js-shortcuts') +
      mrow('Page-by-page guide', '', 'js-guide') +
      mrow('About &amp; version', '2.1', 'js-about') +
      mdiv() +
      mrow('Close this planner', '', 'js-close');
    document.body.appendChild(pop);

    function on(sel, fn) { var n = pop.querySelector(sel); if (n) n.addEventListener('click', function () { closePopovers(); fn(); }); }
    on('.js-profile', function () { call('openProfileDrawer'); });
    on('.js-couple', function () { call('rdSetViewerRole', 'couple'); });
    on('.js-dayof', function () { call('rdEnterDayOf'); });
    on('.js-settings', function () { openSettingsWindow('display'); });
    on('.js-setup', function () { call('showPanel', 'setup', true); });
    on('.js-backup', function () { openSettingsWindow('backup'); });
    on('.js-trash', function () { openSettingsWindow('trash'); });
    on('.js-shortcuts', function () { openShortcuts(); });
    on('.js-guide', function () { openSettingsWindow('guide'); });
    on('.js-about', function () { openSettingsWindow('about'); });
    on('.js-close', function () { /* no destructive close in the prototype */ });
    return pop;
  }

  /* ── help menu (4 fixed + 2 page-aware) ───────────────────────────────── */
  function buildHelpMenu() {
    var pop = el('<div class="rd-gaps-pop rd-help-menu" id="rd-help-menu" role="menu" hidden></div>');
    renderHelpMenu(pop);
    document.body.appendChild(pop);
    return pop;
  }
  function renderHelpMenu(pop) {
    var page = currentPageName();
    pop.innerHTML =
      mgrp('Help') +
      mrow('Get started', '', 'js-getstarted') +
      mrow('Page-by-page guide', '', 'js-guide') +
      mrow('FAQ', '', 'js-faq') +
      mrow('Keyboard shortcuts', '?', 'js-shortcuts') +
      mdiv() +
      mgrp('This page') +
      mrow('What is this column?', '', 'js-column') +
      mrow('How does ' + esc(page) + ' work?', '', 'js-howpage') +
      mdiv() +
      mrow('Report a problem', '', 'js-report') +
      mrow('Version 2.1 · offline', '', 'js-version');
    function on(sel, fn) { var n = pop.querySelector(sel); if (n) n.addEventListener('click', function () { closePopovers(); fn(); }); }
    on('.js-getstarted', function () { openSettingsWindow('get-started'); });
    on('.js-guide', function () { openSettingsWindow('guide'); });
    on('.js-faq', function () { openSettingsWindow('faq'); });
    on('.js-shortcuts', function () { openShortcuts(); });
    on('.js-column', function () { openSettingsWindow('guide'); });
    on('.js-howpage', function () { if (hasFn('openPlannerHelp')) call('openPlannerHelp'); else openSettingsWindow('get-started'); });
    on('.js-report', function () { if (hasFn('openPlannerHelp')) call('openPlannerHelp'); });
    on('.js-version', function () { openSettingsWindow('about'); });
  }

  function openShortcuts() {
    if (hasFn('openKeyboardShortcuts')) return call('openKeyboardShortcuts');
    if (hasFn('showKeyboardShortcuts')) return call('showKeyboardShortcuts');
    if (hasFn('openPlannerHelp')) return call('openPlannerHelp');
  }

  /* ── undo history flyout ──────────────────────────────────────────────── */
  function buildUndoFlyout() {
    var pop = el('<div class="rd-gaps-pop rd-undo-flyout" id="rd-undo-flyout" role="menu" hidden></div>');
    document.body.appendChild(pop);
    return pop;
  }
  function renderUndoFlyout(pop) {
    var d = getData();
    var log = (d && Array.isArray(d._historyLog)) ? d._historyLog : [];
    var steps = log.slice(0, 3);
    var canRedo = !!(d && d._redoSnapshots && d._redoSnapshots.length);

    var html = '<div class="rd-menu__grp">Undo history · ' + steps.length + (steps.length === 1 ? ' step' : ' steps') + '</div>';
    if (steps.length) {
      html += '<div class="rd-undo-flyout__list">';
      steps.forEach(function (s, i) {
        var who = s.source || 'Planner';
        var when = s.time || '';
        var title = s.details || s.action || 'Change';
        html += '<button type="button" class="rd-undo-step' + (i === 0 ? ' is-top' : '') + '" data-undo-to="' + (i + 1) + '">' +
          '<span class="rd-undo-step__main"><span class="rd-undo-step__title">' + esc(title) + '</span>' +
          '<span class="rd-undo-step__meta">' + esc(who) + (when ? ' · ' + esc(when) : '') + '</span></span>' +
          (i === 0 ? '<span class="rd-menu__kbd">⌘Z</span>' : '') + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="rd-undo-flyout__empty">Nothing to undo yet.</div>';
    }
    /* derived-effects note (verbatim from the mock) */
    html += '<div class="rd-undo-flyout__note">Undoing the seat change also un-derives the caterer’s table count. ' +
      'Derived effects are always undone with their cause.</div>' + mdiv() +
      '<button type="button" class="rd-menu__row js-history"><span class="rd-menu__label">Open Planner History</span>' +
      '<span class="rd-menu__kbd">⇧⌘H</span></button>' +
      '<button type="button" class="rd-menu__row is-muted js-redo"' + (canRedo ? '' : ' disabled') + '>' +
      '<span class="rd-menu__label">' + (canRedo ? 'Redo last change' : 'Nothing to redo') + '</span></button>';
    pop.innerHTML = html;

    pop.querySelectorAll('[data-undo-to]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = parseInt(btn.getAttribute('data-undo-to'), 10) || 1;
        closePopovers();
        if (hasFn('undoPlannerChange')) {
          for (var i = 0; i < n; i++) {
            var dd = getData();
            if (dd && dd._undoSnapshots && dd._undoSnapshots.length) undoPlannerChange();
            else break;
          }
        }
      });
    });
    var hist = pop.querySelector('.js-history');
    if (hist) hist.addEventListener('click', function () { closePopovers(); call('showPanel', 'history', true); });
    var redo = pop.querySelector('.js-redo');
    if (redo && canRedo) redo.addEventListener('click', function () { closePopovers(); call('redoPlannerChange'); });
  }

  /* ── wire the chrome into the built .rd-topbar ────────────────────────── */
  function buildTopbarChrome() {
    var bar = document.querySelector('.rd-topbar');
    if (!bar || bar.getAttribute('data-gaps-chrome') === '1') return;
    var right = bar.querySelector('.rd-topbar__right');
    if (!right) return;
    bar.setAttribute('data-gaps-chrome', '1');
    document.body.classList.add('rd-gaps-chrome');

    /* help (?) button — sits before the (now hidden) gear */
    var helpBtn = el('<button type="button" class="rd-topbar__help-btn" id="rd-help-btn" aria-label="Help" aria-haspopup="true" aria-expanded="false">' +
      '<svg ' + SVG_CHEV + ' width="17" height="17"><circle cx="12" cy="12" r="9"></circle>' +
      '<path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.2-1.2.9-1.2 1.6v.5"></path><path d="M12 17.5v.01"></path></svg></button>');
    var gear = document.getElementById('rd-gear-btn');
    if (gear) right.insertBefore(helpBtn, gear);
    else right.appendChild(helpBtn);

    /* avatar button — replaces the gear as the settings affordance */
    var avaBtn = el('<button type="button" class="rd-topbar__avatar-btn" id="rd-avatar-btn" aria-label="Ama Osei · viewer menu" aria-haspopup="true" aria-expanded="false">' +
      '<span class="rd-topbar__avatar-initials">' + esc(viewerInitials()) + '</span>' +
      '<svg ' + SVG_CHEV + ' width="13" height="13"><path d="m6 9 6 6 6-6"></path></svg></button>');
    right.appendChild(avaBtn);

    var avatarMenu = buildAvatarMenu();
    var helpMenu = buildHelpMenu();
    var undoFlyout = buildUndoFlyout();

    avaBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(avatarMenu, avaBtn, true); });
    helpBtn.addEventListener('click', function (e) { e.stopPropagation(); renderHelpMenu(helpMenu); togglePop(helpMenu, helpBtn, true); });

    /* undo button → flyout (intercept the plain single-undo click) */
    var undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.removeAttribute('onclick');
      undoBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        renderUndoFlyout(undoFlyout);
        togglePop(undoFlyout, undoBtn, true);
      });
      undoBtn.removeAttribute('disabled'); /* the flyout is always meaningful */
    }

    /* ⌘, opens settings, matching the avatar menu hint */
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); openSettingsWindow('display'); }
    });

    applyPrefs();
    enhanceSearchInterception();
  }

  /* ── search enhancement — records first, pages second, ⌘K footer ──────── */
  function enhanceSearchInterception() {
    if (!hasFn('runGlobalSearch') || window.__gapsSearchWrapped) return;
    var orig = window.runGlobalSearch;
    window.runGlobalSearch = function (q) {
      var r = orig.apply(this, arguments);
      try { enhanceSearchResults(); } catch (e) { /* soft */ }
      return r;
    };
    window.__gapsSearchWrapped = true;
  }
  function enhanceSearchResults() {
    var box = document.getElementById('gs-results');
    if (!box || !box.classList.contains('open')) return;
    var items = Array.prototype.slice.call(box.querySelectorAll('.gs-result'));
    if (!items.length) return; /* empty-state — leave the planner's message */
    var records = [], pages = [];
    items.forEach(function (it) {
      var t = (it.querySelector('.gs-type') || {}).textContent || '';
      t = t.trim();
      if (t === 'Page' || t === 'Setup') pages.push(it); else records.push(it);
    });
    box.innerHTML = '';
    box.classList.add('rd-gs-gaps');
    if (records.length) {
      box.appendChild(el('<div class="gs-group-label">Records · ' + records.length + '</div>'));
      records.forEach(function (it) { box.appendChild(it); });
    }
    if (pages.length) {
      box.appendChild(el('<div class="gs-group-label">Pages · ' + pages.length + '</div>'));
      pages.forEach(function (it) { box.appendChild(it); });
    }
    var foot = el('<button type="button" class="gs-cmdk-foot">Not finding it? Try <span class="rd-menu__kbd">⌘K</span> for actions</button>');
    foot.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (hasFn('closeGlobalSearch')) call('closeGlobalSearch', true);
      if (hasFn('openCommandPalette')) call('openCommandPalette');
      else { var i = document.getElementById('gs-input'); if (i) i.focus(); }
    });
    box.appendChild(foot);
  }

  /* the settings window + profile drawer builders live in part 2 (below) */
  window.__gapsCore = {
    getPrefs: getPrefs, setPref: setPref, seg: seg, sw: sw, esc: esc, el: el,
    call: call, hasFn: hasFn, closePopovers: closePopovers, currentPageName: currentPageName,
    viewerInitials: viewerInitials, applyPrefs: applyPrefs
  };

  /* ─── boot ────────────────────────────────────────────────────────────── */
  function boot() {
    applyPrefs();
    var tries = 0;
    (function wait() {
      if (document.querySelector('.rd-topbar')) {
        buildTopbarChrome();
        retabProfileDrawer();
        return;
      }
      if (tries++ > 200) return; /* ~10s */
      setTimeout(wait, 50);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ═══════════════════════════════════════════════════════════════════════
     BATCH 47 — the settings window, every pane
     1240px window on a dark translucent frame. Left nav (220px) with four
     groups. Fourteen entries; Wedding setup and the four "pointer" panes
     deep-link to the surface they arm. Display & density shares getPrefs().
     ═══════════════════════════════════════════════════════════════════════ */

  var SET_NAV = [
    { label: 'This device', items: [
      ['display', 'Display &amp; density'], ['day-of', 'Day-of mode'], ['notifications', 'Notifications'] ] },
    { label: 'The planner', items: [
      ['wedding-setup', 'Wedding setup'], ['people', 'People &amp; roles'], ['money', 'Money rules'], ['documents', 'Documents &amp; printing'] ] },
    { label: 'This file', items: [
      ['backup', 'Backup &amp; restore'], ['import', 'Import'], ['trash', 'Trash'], ['about', 'About'] ] },
    { label: 'Help', items: [
      ['get-started', 'Get started'], ['guide', 'Page-by-page guide'], ['faq', 'FAQ'] ] }
  ];

  /* pane content helpers (semantic classes; colours live in the CSS) */
  function pTitle(t, d) {
    return '<div class="rd-set__pane-head"><div class="rd-set__pane-title">' + t + '</div>' +
      (d ? '<div class="rd-set__pane-desc">' + d + '</div>' : '') + '</div>';
  }
  function pRow(title, desc, control) {
    return '<div class="rd-set__row"><div class="rd-set__row-text">' +
      '<div class="rd-set__row-title">' + title + '</div>' +
      (desc ? '<div class="rd-set__row-desc">' + desc + '</div>' : '') + '</div>' +
      '<div class="rd-set__row-control">' + (control || '') + '</div></div>';
  }
  function pNote(text, variant) {
    return '<div class="rd-set__note' + (variant ? ' rd-set__note--' + variant : '') + '">' + text + '</div>';
  }
  function pBtn(label, action, danger) {
    return '<button type="button" class="rd-set__btn' + (danger ? ' rd-set__btn--danger' : '') +
      '"' + (action ? ' data-gaps-action="' + esc(action) + '"' : '') + '>' + label + '</button>';
  }
  function pLink(label, action) {
    return '<button type="button" class="rd-set__link"' + (action ? ' data-gaps-action="' + esc(action) + '"' : '') + '>' + label + '</button>';
  }
  function staticSeg(options, activeIdx) {
    return '<div class="rd-seg rd-seg--static">' + options.map(function (o, i) {
      return '<span class="rd-seg__opt' + (i === activeIdx ? ' is-active' : '') + '">' + esc(o) + '</span>';
    }).join('') + '</div>';
  }
  function staticSwitch(on, locked) {
    return '<span class="rd-gaps-switch' + (on ? ' is-on' : '') + (locked ? ' is-locked' : '') +
      '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '"' + (locked ? ' aria-disabled="true"' : '') +
      '><span class="rd-gaps-switch__dot"></span></span>';
  }

  /* — colour themes + fonts (planner file) — shared by Settings Display + helpers — */
  function currentThemeName() {
    try {
      var d = getData();
      var name = (d && d.setup && d.setup.theme) || 'Forest & Gold';
      if (hasFn('resolveThemeName')) return resolveThemeName(name);
      return name;
    } catch (e) { return 'Forest & Gold'; }
  }
  function currentFontName() {
    try {
      var d = getData();
      return (d && d.setup && d.setup.font) || 'Cormorant & Inter';
    } catch (e) { return 'Cormorant & Inter'; }
  }
  function themeSwatchTriple(name) {
    var c1 = '#2D4A3E', c2 = '#B89968', c3 = '#EFE8DD';
    try {
      if (hasFn('themeMergedPalette')) {
        var m = themeMergedPalette(name) || {};
        c1 = m['--theme-primary'] || m['--forest'] || c1;
        c2 = m['--gold'] || c2;
        c3 = m['--gold-pale'] || m['--ivory-dk'] || c3;
      }
    } catch (e) { /* soft */ }
    return '<span class="rd-set__theme-swatches" aria-hidden="true">' +
      '<i style="background:' + esc(c1) + '"></i>' +
      '<i style="background:' + esc(c2) + '"></i>' +
      '<i style="background:' + esc(c3) + '"></i></span>';
  }
  function appearanceThemeGridHtml() {
    var names = [];
    try {
      if (typeof THEMES === 'object' && THEMES) names = Object.keys(THEMES);
      if (hasFn('customThemesMap')) {
        Object.keys(customThemesMap() || {}).forEach(function (n) {
          if (names.indexOf(n) === -1) names.push(n);
        });
      }
      /* Vision Board / mood palettes already applied as planner themes show up too */
      if (hasFn('allThemes')) {
        Object.keys(allThemes() || {}).forEach(function (n) {
          if (/^Vision Board - |^Mood Seasonal - /.test(n) && names.indexOf(n) === -1) names.push(n);
        });
      }
    } catch (e) { names = ['Forest & Gold']; }
    if (!names.length) names = ['Forest & Gold'];
    var cur = currentThemeName();
    return '<div class="rd-set__theme-grid" role="listbox" aria-label="Colour themes">' + names.map(function (name) {
      var on = name === cur;
      return '<button type="button" class="rd-set__theme' + (on ? ' is-active' : '') +
        '" role="option" aria-selected="' + (on ? 'true' : 'false') +
        '" data-gaps-action="theme:' + esc(name) + '">' +
        themeSwatchTriple(name) +
        '<span class="rd-set__theme-name">' + esc(name) + '</span></button>';
    }).join('') + '</div>';
  }
  function appearanceFontSelectHtml() {
    var fonts = {};
    try { if (typeof FONTS === 'object' && FONTS) fonts = FONTS; } catch (e) { fonts = {}; }
    var names = Object.keys(fonts);
    if (!names.length) names = ['Cormorant & Inter'];
    var cur = currentFontName();
    return '<select class="rd-set__select" data-gaps-font-select aria-label="Font pairing">' +
      names.map(function (n) {
        return '<option value="' + esc(n) + '"' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>';
      }).join('') + '</select>';
  }
  function appearanceBlockHtml() {
    var darkOn = false;
    try {
      var d = getData();
      if (d && d.setup && typeof d.setup.darkMode === 'boolean') darkOn = !!d.setup.darkMode;
      else darkOn = !!(document.body && document.body.classList.contains('dark-mode'));
    } catch (e) { /* soft */ }
    return '<div class="rd-set__appear">' +
      '<div class="rd-set__appear-head">Colour themes &amp; type</div>' +
      '<p class="rd-set__appear-desc">Built-in palettes, any theme you save in the Custom Theme Builder, and Vision Board palettes you have applied. Themes travel with the wedding file.</p>' +
      appearanceThemeGridHtml() +
      '<div class="rd-set__appear-actions">' +
        pBtn('Create Custom Colors', 'themeBuilder') +
        '<button type="button" class="rd-set__btn' + (darkOn ? ' is-on' : '') +
          '" data-gaps-action="darkMode">' + (darkOn ? 'Light Mode' : 'Dark Mode') + '</button>' +
      '</div>' +
      pRow('Font pairing', 'Serif for headings, sans for tables and forms. Print uses the same pairing.',
        appearanceFontSelectHtml()) +
      pNote('Create Custom Colors opens the five-swatch builder. Saved themes appear in this list and in Profile → Display.') +
      '</div>';
  }

  /* — device controls shared with the profile Display tab — */
  function paneDisplay() {
    return pTitle('Display &amp; density',
      'Everything in the <b>This device</b> group affects this browser only. Colour themes below are part of the wedding file and travel with a backup.') +
      pRow('Row density', 'Comfortable is 44px rows; compact is 32px and fits eleven more guests on a screen.',
        seg('density', [['comfortable', 'Comfortable'], ['compact', 'Compact']])) +
      pRow('Show derived figures in grey', 'Derived numbers can never be typed. Greying them is the fastest way to see which cells are yours.',
        sw('derivedGrey')) +
      pRow('Currency', 'Display only. Stored amounts never convert — the planner does no exchange-rate maths.',
        seg('currency', [['$', '$'], ['GH₵', 'GH₵'], ['£', '£']])) +
      pRow('Date format', 'Printed sheets always use long form regardless of this setting.',
        seg('dateFormat', [['long', '8 Nov 2026'], ['iso', '2026-11-08']])) +
      pRow('Reduce motion', 'Drawer and toast transitions become instant.', sw('reduceMotion')) +
      pRow('Font size', 'Print output is unaffected.', seg('fontSize', [['default', 'Default'], ['large', 'Large']])) +
      pNote('Device settings live in this browser. Restoring a backup on another machine brings the wedding, not these preferences.') +
      appearanceBlockHtml();
  }

  function paneDayOf() {
    return pTitle('Day-of mode',
      'A different app for one day. Editing is suppressed, the rail disappears, and the run sheet becomes the whole screen. It turns itself on automatically at midnight on the wedding date — this pane is where that is armed and rehearsed.') +
      pRow('Arm for 8 November 2026', 'On at 00:00, off at 06:00 the next morning. It can always be left manually from the avatar menu.', staticSwitch(true)) +
      pRow('What day-of mode hides', 'Fixed list, not a preference — the reason it exists is that nobody edits records on the day.',
        '<div class="rd-set__pillset"><span class="rd-set__pill">Rail · filters · bulk bar</span><span class="rd-set__pill">view switchers · all forms</span></div>') +
      pRow('Keep the screen awake', 'Only while day-of mode is on. A phone that sleeps mid-cue is the complaint this answers.', staticSwitch(true)) +
      pRow('Large type', '44px minimum hit targets and 18px body. Assume one hand, bright sun, and no reading glasses.', staticSwitch(true)) +
      pRow('Offline first', 'The run sheet, contacts and timings are cached before the day. A venue with no signal is the normal case.', staticSwitch(true)) +
      pRow('Rehearse it now', 'Opens day-of mode against today’s date so you can walk it through before the week of.', pLink('Preview the day', 'dayof')) +
      pNote('Day-of mode is drawn in full in <b>Planner Screens Views</b> — batch 42, “Responsive · day-of mode”. This pane only arms it.');
  }

  function paneNotifications() {
    return pTitle('Notifications',
      'What earns an interruption. The planner’s default position is that a notification is for something with a deadline and a consequence — never for activity.') +
      pRow('Payment due', 'Two reminders: seven days out and the morning of. A missed instalment can release a venue date.',
        staticSeg(['Off', '7 days', '7 + 1 day'], 2)) +
      pRow('Contract expiring or unsigned', 'Fires on the cancellation window closing, not on the signature being late.', staticSwitch(true)) +
      pRow('RSVP deadline passing', 'One digest of who has not answered, on the deadline. Not one per guest.', staticSwitch(true)) +
      pRow('Blocked task became unblocked', 'The moment work can start is worth an interruption; the moment it was blocked is not.', staticSwitch(true)) +
      pRow('Vendor uploaded a document', 'Off by default. It arrives in Planner History either way.', staticSwitch(false)) +
      pRow('Someone else edited a record', 'Deliberately absent. A shared file that narrates itself teaches you to ignore it.',
        '<span class="rd-set__na">Not available</span>') +
      pRow('Where they appear', 'No email, no push. The planner has no mail account and no server to send from.',
        staticSeg(['Top bar only'], 0)) +
      pNote('The notification panel itself is drawn in <b>Planner Screens Views</b> — batch 35. This pane decides what reaches it.');
  }

  function paneWeddingSetup() {
    return pTitle('Wedding setup',
      'The only nav entry that is not a pane. Names, date, venue, guest-count target and the eight tab labels are <b>content</b>, not configuration — they belong to a page you can print and share, not to a modal you open mid-task.') +
      pRow('Ama &amp; Kwesi · 8 November 2026', 'Names as they appear in the top bar, on invitations and on every printed sheet.',
        pBtn('Open Wedding Setup', 'showPanel:setup')) +
      pRow('Venue', 'Grace Hall, Accra. Drives the day-of weather line and the travel times on Weekend Logistics.', pLink('Open', 'showPanel:setup')) +
      pRow('Guest-count target', '180. Every capacity warning in the app is measured against this one number.', pLink('Open', 'showPanel:setup')) +
      pRow('Tab and page names', 'All eight tabs and thirty-seven pages can be renamed. Renaming is content; the underlying record type never changes.', pLink('Open', 'showPanel:setup')) +
      pRow('Currency of record', 'GH₵. Distinct from the display currency above — this is what amounts are stored in, and it is set once.',
        '<span class="rd-set__na">Set at creation</span>') +
      pNote('Why a pointer and not a pane: a modal cannot be printed, cannot be shared with the couple, and cannot hold the 40-field form that Wedding Setup actually is. The nav entry stays so the planner finds it where they look.');
  }

  function panewarePeopleRow(name, role, cov, covClass, seen) {
    return '<tr><td>' + esc(name) + '</td><td class="rd-set__muted">' + esc(role) + '</td>' +
      '<td class="' + covClass + '">' + esc(cov) + '</td><td class="rd-set__muted">' + esc(seen) + '</td></tr>';
  }
  function panePeople() {
    var rows =
      panewarePeopleRow('Ama Osei', 'Planner', 'Granted · revocable', 'rd-set__ok', 'Today') +
      panewarePeopleRow('Kwame Boateng', 'Couple', 'Owner', 'rd-set__ok', 'Today') +
      panewarePeopleRow('Ama Owusu', 'Couple', 'Owner', 'rd-set__ok', 'Yesterday') +
      panewarePeopleRow('Naa Adjeley', 'Helper', 'No access', 'rd-set__muted', '4 Aug') +
      panewarePeopleRow('Grace Hall', 'Vendor · portal', 'No access', 'rd-set__muted', '2 Aug') +
      panewarePeopleRow('Accra String Quartet', 'Vendor · portal', 'No access', 'rd-set__danger', 'Never');
    return pTitle('People &amp; roles',
      'Who can open this planner, and what each of them can reach. Covenant is the only category the couple grants rather than the planner claiming.') +
      '<table class="rd-set__table"><thead><tr><th>Person</th><th>Role</th><th>Covenant</th><th>Last seen</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      pRow('Helpers can see money', 'Off by default. A helper sees people, the day and documents — never amounts.', staticSwitch(false)) +
      pRow('Vendors see only their own scope', 'Cannot be turned off. It is the portal’s contract, not a preference.', staticSwitch(true, true)) +
      pRow('Revoke Covenant access', 'Immediate, and written to Planner History under the couple’s name.', pBtn('Revoke', '', true)) +
      pNote('Clicking any row opens that person’s <b>profile drawer</b> — batch 48. This pane sets the role; the drawer holds the person.');
  }

  function paneMoney() {
    return pTitle('Money rules',
      'The four decisions that make every figure in the Money tab mean the same thing twice. Set once, early, and then left alone — which is why they are here and not on the Budget page.') +
      pRow('A contract total is authoritative', 'Budget actuals derive from contracts, never the reverse. Cannot be turned off; it is the money model.', staticSwitch(true, true)) +
      pRow('Pledged money counts toward', 'Gifts and family contributions are either income or a reduction in cost. Choosing changes every category percentage in the app.',
        staticSeg(['Income', 'Cost offset'], 0)) +
      pRow('Over-budget threshold', 'When a category turns amber. Red is always 100%.', staticSeg(['80%', '90%', '95%'], 1)) +
      pRow('Deposits count as paid', 'On by default. Turning it off shows deposits as committed-but-unpaid, which some planners prefer for cash-flow.', staticSwitch(true)) +
      pRow('Joint-account rule', 'Free text, printed on the Money hour sheet. Not enforced by the app — it is an agreement, not a control.',
        '<span class="rd-set__freetext">No purchase over GH₵500 without both of us.</span>') +
      pRow('Rounding', 'Applies to display and print, never to stored amounts.', staticSeg(['Exact', 'Nearest 1'], 0)) +
      pNote('Changing the pledged rule re-derives every category percentage, the Dashboard money figure and eleven printed sheets. It confirms with a count of what will move.', 'amber');
  }

  function paneDocuments() {
    return pTitle('Documents &amp; printing',
      'Paper is the output of this app. Four of the six print views in the planner end up in one physical pack, and these are the defaults they are assembled with.') +
      pRow('Paper size', 'Every print view is laid out to fit both, but pick the one your printer actually holds.', staticSeg(['A4', 'Letter'], 0)) +
      pRow('Print derived figures in grey', 'Grey ink on a laser printer reads as light grey. Off means derived numbers print black like the rest.', staticSwitch(true)) +
      pRow('Include a “printed on” line', 'Footer with date, time and who printed it. The reason a stale run sheet on the day is spottable.', staticSwitch(true)) +
      pRow('Redact money on shared sheets', 'On by default. A day-of contact sheet handed to a vendor should not carry amounts.', staticSwitch(true)) +
      pRow('Default packet recipient', 'What Share Packets pre-selects. Vendors get scope-limited packets regardless.', staticSeg(['Nobody', 'Couple', 'Vendor'], 0)) +
      pRow('Storage for uploads', 'About 40 MB today. Files live beside the planner file, not in it, unless a backup includes them.',
        '<span class="rd-set__path">/covenant/documents</span>') +
      pNote('The Print Centre is drawn in <b>Planner Screens Views</b> — batch 33. This pane sets what it assembles with.') +
      '<div class="rd-set__pointer">' + pBtn('Open the Print Centre', 'showPanel:print-centre') + '</div>';
  }

  function paneBackup() {
    return pTitle('Backup &amp; restore',
      'There is no account and no cloud. The file on this device is the wedding — so a backup is not housekeeping, it is the only copy that survives a lost laptop.') +
      pNote('Last backup was 9 days ago. Since then: 41 guest replies, 3 payments and the seating chart. Losing this device today loses all of it.', 'amber') +
      pRow('Back up now', 'Writes one file — SQLite, plain, portable. Includes documents unless you exclude them.', pBtn('Back up now', 'backup')) +
      pRow('Remind me weekly', 'A reminder in the top bar, not an email — the planner has no mail account.', staticSwitch(true)) +
      pRow('Include uploaded documents', 'Adds about 40 MB. Excluding them makes the backup a data-only file.', staticSwitch(true)) +
      pRow('Restore from a file', 'Replaces everything. The current file goes to Trash first and is kept 30 days.', pLink('Choose a file…', 'restore')) +
      pRow('This planner', 'covenant-ama-kwesi.db · 62 MB', '<span class="rd-set__muted">1,412 records · 37 pages</span>') +
      pRow('Portability', 'Plain SQLite. Moving to a hosted account later is an import, not a rebuild.', '');
  }

  function paneImportRow(file, meta, note) {
    return '<div class="rd-set__implist-row"><span class="rd-set__implist-file">' + esc(file) + '</span>' +
      '<span class="rd-set__implist-meta">' + meta + '</span>' + (note ? '<span class="rd-set__implist-note">' + note + '</span>' : '') + '</div>';
  }
  function paneImport() {
    return pTitle('Import',
      'Most planners arrive with a spreadsheet and leave with this app. Import is therefore a first-run path, not an admin tool — and it never overwrites silently.') +
      pRow('Import guests, tasks or payments', 'Opens the three-step mapper: file, field mapping, then a preview of what will be created and what will be skipped.',
        pBtn('Start an import', 'import')) +
      '<div class="rd-set__subgrp">Previous imports · 3</div>' +
      '<div class="rd-set__implist">' +
        paneImportRow('guests-final-v4.xlsx', '<span class="rd-set__muted">· 142 rows</span> <span class="rd-set__ok">2 Mar · 138 created</span>', '4 skipped as duplicates <span class="rd-set__muted">reviewed</span>') +
        paneImportRow('vendor-quotes.csv', '<span class="rd-set__muted">· 22 rows</span> <span class="rd-set__ok">14 Jan · 22 created</span>', '') +
        paneImportRow('tasks-from-planner.csv', '<span class="rd-set__muted">· 84 rows</span> <span class="rd-set__ok">2 Feb · 84 created</span>', '') +
      '</div>' +
      pRow('On duplicate', 'Never overwrite. A duplicate becomes a merge decision you make row by row, in the mapper.', staticSeg(['Skip', 'Ask', 'Merge'], 1)) +
      pRow('Undo an import', 'Every import is one undoable transaction for 30 days, however many records it created.', pLink('Undo guests-final-v4')) +
      pRow('Export instead', 'CSV per page, or the whole file. Export is always available and never scoped by role.', pLink('Export…', 'export')) +
      pNote('The field-mapping step is drawn in <b>Planner Screens Views</b> — batch 35, “Import · field mapping”.');
  }

  function paneTrashRow(name, type, by, purge, danger) {
    return '<tr><td>' + esc(name) + '</td><td class="rd-set__muted">' + esc(type) + '</td>' +
      '<td class="rd-set__muted">' + esc(by) + '</td><td class="' + (danger ? 'rd-set__danger' : 'rd-set__muted') + '">' + esc(purge) + '</td></tr>';
  }
  function paneTrash() {
    var rows =
      paneTrashRow('Uncle Fiifi & family', 'Household · 4 guests', 'Kwame · 6 Aug', '24 days') +
      paneTrashRow('Second cake tasting', 'Appointment', 'Ama · 2 Aug', '20 days') +
      paneTrashRow('Photographer B quote', 'Vendor · shortlist', 'Ama · 28 Jul', '15 days') +
      paneTrashRow('Table 9', 'Table · 8 seats', 'Kwame · 14 Jul', '2 days', true);
    return pTitle('Trash',
      'Nothing is deleted immediately, because most deletions on a wedding planner are mistakes made at midnight. Thirty days, then gone for good.') +
      '<table class="rd-set__table"><thead><tr><th>Deleted</th><th>Type</th><th>By · when</th><th>Purges in</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      pNote('Restoring the Uncle Fiifi household brings back 4 guests, their seats at table 7 and the kept-apart rule with Adjoa Mensah. A restore is never partial.', 'amber') +
      pRow('Keep deleted records for', 'Thirty days is the default because a wedding’s planning cycle has monthly rhythm.', staticSeg(['7 days', '30 days', '90 days'], 1)) +
      pRow('Empty trash now', 'Irreversible, and the one action in the app with no undo.', pBtn('Empty trash', '', true)) +
      '<div class="rd-set__pointer">' + pLink('Open the full Trash', 'trash') + '</div>';
  }

  function paneAbout() {
    return pTitle('About', 'What this thing is, where the file lives, and what it does not do. The last pane is the honest one.') +
      '<div class="rd-set__factgrid">' +
        '<div class="rd-set__fact"><span class="rd-set__fact-k">Version</span><span class="rd-set__fact-v">2.1 · 8 Aug 2026</span></div>' +
        '<div class="rd-set__fact"><span class="rd-set__fact-k">Storage</span><span class="rd-set__fact-v">SQLite + localStorage mirror</span></div>' +
        '<div class="rd-set__fact"><span class="rd-set__fact-k">Network use</span><span class="rd-set__fact-v">None</span></div>' +
        '<div class="rd-set__fact"><span class="rd-set__fact-k">Accounts</span><span class="rd-set__fact-v">None</span></div>' +
      '</div>' +
      pRow('What it does not do', 'No cloud sync, no tracking, no email sending, no exchange-rate maths, no vendor marketplace. Each absence is a decision, not a backlog item.', '') +
      pRow('Crash safety', 'Every edit writes to localStorage as well as the file, so a browser crash loses nothing since the last keystroke.', '<span class="rd-set__ok">Active</span>') +
      pRow('Design spec', 'Tokens, components and §01–§23 of the rules this app is built from.', pLink('Open the spec', 'spec')) +
      pRow('Licences', 'Two typefaces and one date library. Nothing else is borrowed.', pLink('View')) +
      pRow('Reset this planner', 'Deletes the file and starts again. Requires typing the couple’s names.', pBtn('Reset…', '', true)) +
      pNote('No account, no cloud, no tracking. The trade-off is that backups are your job — which is why the Backup pane leads with what is at risk rather than a date.');
  }

  function paneGetStartedStep(chip, chipClass, title, desc, tail, tailClass, muted) {
    return '<div class="rd-set__gs-step' + (muted ? ' is-muted' : '') + '">' +
      '<span class="rd-set__gs-chip ' + chipClass + '">' + chip + '</span>' +
      '<div class="rd-set__gs-body"><div class="rd-set__gs-title">' + title + '</div>' +
      '<div class="rd-set__gs-desc">' + desc + '</div></div>' +
      '<span class="rd-set__gs-tail ' + (tailClass || '') + '">' + tail + '</span></div>';
  }
  function paneGetStarted() {
    return pTitle('Get started',
      'Six steps, in the order that stops rework. Guests before seating, contracts before payments, the day before the packet. Nothing here is skippable so much as expensive to skip.') +
      paneGetStartedStep('✓', 'rd-set__gs-chip--done', 'Name the wedding', 'Couple, date and venue. Every printed sheet and the top bar read from it.', 'Done', 'rd-set__ok') +
      paneGetStartedStep('✓', 'rd-set__gs-chip--done', 'Bring your spreadsheet in', '142 guests imported, 4 duplicates reviewed. Importing before seating saves doing seating twice.', 'Done', 'rd-set__ok') +
      paneGetStartedStep('✓', 'rd-set__gs-chip--done', 'Set the money rules', 'Whether pledged money is income or a cost offset. Changing it later re-derives every category.', 'Done', 'rd-set__ok') +
      paneGetStartedStep('4', 'rd-set__gs-chip--pend', 'Add your vendors and their contracts', '3 of 14 have a contract on file. A vendor without one has no authoritative total, so the budget is a guess.', pBtn('Continue', 'showPanel:vendors'), '') +
      paneGetStartedStep('5', 'rd-set__gs-chip--num', 'Build the day', 'Run sheet, then the vendor blocks that hang off it. The day drives four printed documents.', pLink('Start', 'showPanel:timeline'), '', true) +
      paneGetStartedStep('6', 'rd-set__gs-chip--num', 'Invite the couple and your helpers', 'Roles decide what each of them sees. Covenant is granted by the couple, not claimed by you.', pLink('Start', 'people'), '', true) +
      pRow('Explore with sample data', 'Prefer to click around a filled planner first? Loads demo guests, vendors, budget and day-of content — same action as Get Started → Load Sample Data.', pBtn('Load Sample Data', 'sample')) +
      '<div class="rd-set__pointer">' + pBtn('Open the full Get Started page', 'showPanel:instructions') + '</div>' +
      pNote('The full <b>Get Started</b> page — with the same six steps at reading width and a progress meter — is drawn in <b>Planner Screens All</b>. This pane is the same checklist reached mid-task, so you can see what is unfinished without leaving the page you are on.');
  }

  function paneGuideRow(page, tab, surface, owns) {
    return '<tr><td>' + esc(page) + '</td><td class="rd-set__muted">' + esc(tab) + '</td>' +
      '<td class="rd-set__gold">' + esc(surface) + '</td><td>' + esc(owns) + '</td></tr>';
  }
  function paneGuide() {
    var rows =
      paneGuideRow('Dashboard', 'Overview', 'Card grid', 'Nothing — reads all') +
      paneGuideRow('Guest List', 'People', 'Table', 'Guest') +
      paneGuideRow('Households', 'People', 'Group list', 'Household') +
      paneGuideRow('Table Layout', 'People', 'Canvas', 'Table · seat') +
      paneGuideRow('Budget', 'Money', 'Table', 'Line item') +
      paneGuideRow('Payments', 'Money', 'Table + calendar', 'Payment') +
      paneGuideRow('Contracts & Invoices', 'Money', 'Table', 'Contract') +
      paneGuideRow('Venue & Vendors', 'Vendors', 'Table', 'Vendor') +
      paneGuideRow('Wedding Day Timeline', 'The Day', 'Gantt', 'Event block') +
      paneGuideRow('Print Centre', 'Documents', 'Print sheet', 'Nothing — assembles');
    return pTitle('Page-by-page guide',
      'What each of the thirty-seven pages is for, which work surface it uses, and which record it owns. The column that matters is the last one: a page that owns no record is a reader, and editing happens somewhere else.') +
      '<div class="rd-set__guidefilter"><input type="search" class="rd-set__search" placeholder="Search the guide…" aria-label="Search the guide">' +
      staticSeg(['All', 'Overview', 'People', 'Money'], 0) + '</div>' +
      '<table class="rd-set__table rd-set__table--guide"><thead><tr><th>Page</th><th>Tab</th><th>Work surface</th><th>Owns</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<div class="rd-set__guidecount">10 of 37 shown. Scrolls to the rest; the tab filter above narrows it.</div>' +
      pNote('The full-page version — same table plus a printable one-sheet for a second person to carry — is drawn in <b>Planner Screens Views</b>, batch 33. This pane is the searchable one, opened when you are mid-task and cannot remember which page owns a field.');
  }

  function paneFaqItem(q, a) {
    return '<div class="rd-set__faq"><button type="button" class="rd-set__faq-q"><span class="rd-set__faq-caret">▸</span>' + esc(q) + '</button>' +
      '<div class="rd-set__faq-a">' + esc(a) + '</div></div>';
  }
  function paneFaq() {
    return pTitle('FAQ',
      'Twelve questions, and they are the ones actually asked — three about numbers that will not change, four about where the file lives, and five about what the app refuses to do. Answers state the reason, not the workaround.') +
      '<div class="rd-set__faqfilter">' + staticSeg(['All 12', 'Numbers', 'The file', 'Limits', 'Printing'], 0) + '</div>' +
      paneFaqItem('Why can’t I type this number?', 'It is derived. Confirmed guests, category totals and outstanding balances are calculated from the records beneath them — typing one would make two figures disagree. Edit the record it comes from; the drawer names it.') +
      paneFaqItem('Where is my planner stored?', 'In one file on this device, in plain SQLite, with a localStorage mirror for crash safety. No account, no cloud, nothing uploaded. That is why Backup is the only way to move to another machine.') +
      paneFaqItem('Why did changing one date move four things?', 'Tasks carry dependencies. The confirmation before a date change lists exactly what moves — it is not a warning, it is the receipt.') +
      paneFaqItem('Can the couple see everything I see?', 'Almost. They own Covenant and grant you access to it; you own nothing they cannot see. Helpers see no money by default, and vendors see only their own scope, which cannot be turned off.') +
      paneFaqItem('Why won’t it email my guests?', 'It has no mail account and no server. It composes the message and copies it out to yours, so the send comes from you and lands in your sent folder.') +
      paneFaqItem('What happens if I lose this laptop?', 'You lose everything since the last backup. There is no recovery, because there is nowhere for the app to recover from. Backup weekly is not advice, it is the design.') +
      pNote('The full <b>FAQ</b> page carries all twelve at reading width and prints — drawn in <b>Planner Screens All</b>. This pane is the searchable, filtered one.');
  }

  var SET_PANES = {
    'display': paneDisplay, 'day-of': paneDayOf, 'notifications': paneNotifications,
    'wedding-setup': paneWeddingSetup, 'people': panePeople, 'money': paneMoney, 'documents': paneDocuments,
    'backup': paneBackup, 'import': paneImport, 'trash': paneTrash, 'about': paneAbout,
    'get-started': paneGetStarted, 'guide': paneGuide, 'faq': paneFaq
  };

  function renderSettingsNav(active) {
    return SET_NAV.map(function (g) {
      return '<div class="rd-set__nav-grp">' + g.label + '</div>' + g.items.map(function (it) {
        var on = it[0] === active;
        return '<button type="button" class="rd-set__nav-item' + (on ? ' is-active' : '') +
          '" data-pane="' + it[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + it[1] + '</button>';
      }).join('');
    }).join('');
  }

  function applySettingsTheme(name) {
    try {
      var d = getData();
      if (!d) return;
      if (!d.setup || typeof d.setup !== 'object') d.setup = {};
      var resolved = hasFn('resolveThemeName') ? resolveThemeName(name) : name;
      d.setup.theme = resolved;
      var ts = document.getElementById('theme-select');
      if (ts) {
        if (hasFn('allThemes') && typeof escapeHtml === 'function') {
          ts.innerHTML = Object.keys(allThemes()).map(function (n) {
            return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
          }).join('');
        }
        ts.value = resolved;
      }
      if (hasFn('applyTheme')) applyTheme(resolved);
      if (hasFn('renderThemePicker')) renderThemePicker();
      if (hasFn('save')) save();
      else if (hasFn('saveAppearance')) saveAppearance();
    } catch (e) { /* soft */ }
    if (document.getElementById('rd-settings-window')) renderSettingsPane('display');
  }
  function applySettingsFont(name) {
    try {
      var d = getData();
      if (!d) return;
      if (!d.setup || typeof d.setup !== 'object') d.setup = {};
      d.setup.font = name;
      var fsel = document.getElementById('font-select');
      if (fsel) fsel.value = name;
      if (hasFn('applyFont')) applyFont(name);
      if (hasFn('renderFontPicker')) renderFontPicker();
      if (hasFn('save')) save();
      else if (hasFn('saveAppearance')) saveAppearance();
    } catch (e) { /* soft */ }
    if (document.getElementById('rd-settings-window')) renderSettingsPane('display');
  }

  function renderSettingsPane(pane) {
    var win = document.getElementById('rd-settings-window');
    if (!win) return;
    win.setAttribute('data-pane', pane);
    var nav = win.querySelector('.rd-set__nav');
    if (nav) nav.innerHTML = renderSettingsNav(pane);
    var body = win.querySelector('.rd-set__panebody');
    var fn = SET_PANES[pane] || SET_PANES.display;
    if (body) { body.innerHTML = fn(); body.scrollTop = 0; }
    if (pane === 'display' && body) {
      var fsel = body.querySelector('[data-gaps-font-select]');
      if (fsel && fsel.dataset.bound !== '1') {
        fsel.dataset.bound = '1';
        fsel.addEventListener('change', function () { applySettingsFont(fsel.value); });
      }
    }
  }

  function openSettingsWindow(pane) {
    pane = pane && SET_PANES[pane] ? pane : 'display';
    closePopovers();
    var overlay = document.getElementById('rd-settings-overlay');
    if (!overlay) {
      overlay = el('<div class="rd-settings-overlay" id="rd-settings-overlay" aria-hidden="true"></div>');
      var win = el(
        '<div class="rd-settings-window" id="rd-settings-window" role="dialog" aria-modal="true" aria-label="Settings">' +
          '<div class="rd-set__head">' +
            '<span class="rd-set__mark">&#10022;</span>' +
            '<span class="rd-set__title">Settings</span>' +
            '<span class="rd-set__saved">Saved automatically</span>' +
            '<button type="button" class="rd-set__close" aria-label="Close settings">&#10005;</button>' +
          '</div>' +
          '<div class="rd-set__grid">' +
            '<nav class="rd-set__nav" aria-label="Settings sections"></nav>' +
            '<div class="rd-set__panebody"></div>' +
          '</div>' +
        '</div>');
      overlay.appendChild(win);
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSettingsWindow(); });
      win.querySelector('.rd-set__close').addEventListener('click', closeSettingsWindow);
      /* nav clicks */
      win.querySelector('.rd-set__nav').addEventListener('click', function (e) {
        var b = e.target.closest('.rd-set__nav-item');
        if (b) renderSettingsPane(b.getAttribute('data-pane'));
      });
      /* pane actions (deep-links + primary buttons) */
      win.querySelector('.rd-set__panebody').addEventListener('click', function (e) {
        var a = e.target.closest('[data-gaps-action]');
        if (a) runSettingsAction(a.getAttribute('data-gaps-action'));
        var faqQ = e.target.closest('.rd-set__faq-q');
        if (faqQ) faqQ.parentNode.classList.toggle('is-open');
      });
    }
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rd-settings-open');
    renderSettingsPane(pane);
  }
  function closeSettingsWindow() {
    var overlay = document.getElementById('rd-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rd-settings-open');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var ov = document.getElementById('rd-settings-overlay');
      if (ov && ov.classList.contains('is-open')) closeSettingsWindow();
    }
  });

  function runSettingsAction(action) {
    var parts = action.split(':');
    switch (parts[0]) {
      case 'showPanel': closeSettingsWindow(); call('showPanel', parts[1], true); break;
      case 'people': renderSettingsPane('people'); break;
      case 'dayof': closeSettingsWindow(); call('rdEnterDayOf'); break;
      case 'import':
        closeSettingsWindow();
        if (hasFn('openImportModal')) call('openImportModal');
        else if (hasFn('openEntityCSVImport')) call('openEntityCSVImport', 'guests');
        else call('showPanel', 'data-hub', true);
        break;
      case 'export':
        if (hasFn('openExportModal')) call('openExportModal');
        else if (hasFn('downloadSqliteBackup')) call('downloadSqliteBackup');
        break;
      case 'trash':
        closeSettingsWindow();
        if (window.RdFurniture && RdFurniture.openTrash) {
          var items = [];
          try {
            var dt = getData();
            var trash = (dt && Array.isArray(dt.trash)) ? dt.trash : [];
            items = trash.map(function (t, i) {
              return { id: String(t._id || i), title: t.title || t.name || 'Deleted record',
                meta: (t.type || 'Record') + (t.deletedAt ? ' · ' + t.deletedAt : ''), daysLeft: t.daysLeft != null ? t.daysLeft : 30 };
            });
          } catch (e) { items = []; }
          RdFurniture.openTrash({ items: items });
        }
        break;
      case 'backup': if (hasFn('downloadSqliteBackup')) call('downloadSqliteBackup'); else call('startHereBackup'); break;
      case 'restore':
        if (hasFn('restoreFromBackup')) call('restoreFromBackup');
        else { var ri = document.getElementById('restore-file-input') || document.querySelector('input[type="file"][accept*="sqlite"], input[type="file"][accept*="db"]'); if (ri) ri.click(); }
        break;
      case 'spec': window.open('Redesign/Covenant Design Spec.dc.html', '_blank'); break;
      case 'sample':
        closeSettingsWindow();
        if (hasFn('loadSampleData')) call('loadSampleData');
        break;
      case 'theme':
        applySettingsTheme(parts.slice(1).join(':'));
        break;
      case 'themeBuilder':
        call('openThemeBuilder');
        break;
      case 'darkMode':
        call('toggleDarkMode');
        renderSettingsPane('display');
        break;
      default: break;
    }
  }

  window.openSettingsWindow = openSettingsWindow;
  window.closeSettingsWindow = closeSettingsWindow;

  /* ═══════════════════════════════════════════════════════════════════════
     BATCH 48 — the profile drawer, retabbed to the Gaps anatomy
     A person is a record: 360px drawer, tab strip, two-button footer. The
     original drawer's live controls (profile switcher, appearance, roles
     view-as, modes) are relocated into the Access tab so nothing is lost.
     ═══════════════════════════════════════════════════════════════════════ */

  var _pdTab = 'profile';

  function pdHeader(activeTab) {
    var tabs = [['profile', 'Profile'], ['display', 'Display'], ['alerts', 'Alerts'], ['access', 'Access']];
    return '<div class="rd-pd__head">' +
      '<div class="rd-pd__eyebrow"><span>Person · planner</span>' +
      '<button type="button" class="rd-pd__x" aria-label="Close">&#10005;</button></div>' +
      '<div class="rd-pd__person"><span class="rd-pd__ava">' + esc(viewerInitials()) + '</span>' +
      '<div><div class="rd-pd__name">Ama Osei</div><div class="rd-pd__role">Planner · full access</div></div></div>' +
      '<div class="rd-pd__pills"><span class="rd-pd__pill rd-pd__pill--planner">Planner</span>' +
      '<span class="rd-pd__pill rd-pd__pill--you">This is you</span>' +
      '<span class="rd-pd__pill rd-pd__pill--cov">Covenant granted</span></div>' +
      '<div class="rd-pd__tabs">' + tabs.map(function (t) {
        return '<button type="button" class="rd-pd__tab' + (t[0] === activeTab ? ' is-active' : '') + '" data-pd-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div></div>';
  }

  function pdFooter(tab) {
    var map = {
      profile: ['Save', 'Open settings', 'settings'],
      display: ['Done', 'All settings', 'settings'],
      alerts: ['Save', 'Open notifications', 'notifications'],
      access: ['Save role', 'Revoke Covenant', 'revoke']
    };
    var f = map[tab] || map.profile;
    return '<div class="rd-pd__foot">' +
      '<button type="button" class="rd-pd__foot-primary" data-pd-foot="primary">' + f[0] + '</button>' +
      '<button type="button" class="rd-pd__foot-secondary" data-pd-foot="' + f[2] + '">' + f[1] + '</button></div>';
  }

  function pdKV(k, v, vClass) {
    return '<div class="rd-pd__kv"><span class="rd-pd__k">' + esc(k) + '</span>' +
      '<span class="rd-pd__v' + (vClass ? ' ' + vClass : '') + '">' + esc(v) + '</span></div>';
  }
  function pdSub(label) { return '<div class="rd-pd__sub">' + esc(label) + '</div>'; }

  function pdProfileTab() {
    return '<div class="rd-pd__body" data-pd-panel="profile">' +
      pdSub('Identity') +
      '<div class="rd-pd__kvs">' + pdKV('Name', 'Ama Osei') + pdKV('Shown as', 'Ama') + pdKV('Role', 'Planner') + pdKV('Initials', 'AO') + pdKV('Joined', '14 Jan 2026') + '</div>' +
      pdSub('Reaching her') +
      '<div class="rd-pd__kvs">' + pdKV('Mobile', '+233 24 900 1174') + pdKV('Email', 'ama@oseievents.gh', 'rd-pd__v--link') + pdKV('Preferred', 'Call before 20:00') + '</div>' +
      pdSub('On the printed pack') +
      '<div class="rd-pd__kvs">' + pdKV('Day-of contacts sheet', 'Included', 'rd-pd__v--ok') + pdKV('Emergency card', 'Primary contact', 'rd-pd__v--ok') + pdKV('Vendor packets', 'Named as planner', 'rd-pd__v--ok') + '</div>' +
      '<div class="rd-pd__note rd-pd__note--amber">This name and number appear on nine printed sheets. Changing them re-marks the Print Centre pack as stale rather than silently reprinting.</div>' +
      '</div>';
  }

  /* Display tab shares the device-prefs store (one store, two doors) and
     hosts the live Appearance section (themes + Create Custom Colors). */
  function pdDisplayTabInner() {
    var pdSeg = function (key, opts) { return seg(key, opts); };
    return '<div class="rd-pd__body" data-pd-panel="display">' +
      pdSub('Colour themes &amp; type') +
      '<div class="rd-pd__appear" id="pd-appearance-mount"></div>' +
      '<div class="rd-pd__note rd-pd__note--ok">Pick a built-in theme or open Create Custom Colors. Themes save with the wedding file — the same list as Settings → Display &amp; density.</div>' +
      pdSub('This device') +
      '<div class="rd-pd__ctrls">' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Row density</span>' + pdSeg('density', [['comfortable', 'Comfy'], ['compact', 'Compact']]) + '</div>' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Derived in grey</span>' + sw('derivedGrey') + '</div>' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Reduce motion</span>' + sw('reduceMotion') + '</div>' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Font size</span>' + pdSeg('fontSize', [['default', 'Default'], ['large', 'Large']]) + '</div>' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Currency</span>' + pdSeg('currency', [['$', '$'], ['GH₵', 'GH₵']]) + '</div>' +
        '<div class="rd-pd__ctrl"><span class="rd-pd__ctrl-k">Dates</span>' + pdSeg('dateFormat', [['long', '8 Nov'], ['iso', '2026-11-08']]) + '</div>' +
      '</div>' +
      '<div class="rd-pd__note rd-pd__note--ok">These six device controls match Settings → Display &amp; density — one store, two doors.</div>' +
      pdSub('Day-of mode') +
      '<div class="rd-pd__kvs">' + pdKV('Armed for', '8 Nov · 00:00', 'rd-pd__v--ok') +
      '<div class="rd-pd__kv"><span class="rd-pd__k">Enter now</span>' +
      '<button type="button" class="rd-pd__v rd-pd__v--gold rd-pd__link" data-pd-action="dayof">Rehearsal only</button></div></div>' +
      '</div>';
  }
  function findLegacyAppearanceSection(root) {
    if (!root) return null;
    var direct = root.querySelector('.pd-sec #theme-select');
    if (direct) return direct.closest('.pd-sec');
    var secs = root.querySelectorAll('.pd-sec');
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].querySelector('#theme-select, #theme-picker, .pd-custom-colors')) return secs[i];
    }
    return null;
  }
  function relocateAppearanceToDisplay(drawer) {
    drawer = drawer || document.getElementById('profile-drawer');
    if (!drawer) return;
    var mount = drawer.querySelector('#pd-appearance-mount');
    if (!mount) return;
    if (mount.querySelector('#theme-select, #theme-picker, .pd-custom-colors')) return;
    var legacy = drawer.querySelector('#pd-legacy-mount');
    var appearance = findLegacyAppearanceSection(legacy) || findLegacyAppearanceSection(drawer);
    if (appearance) mount.appendChild(appearance);
  }
  function renderProfileDisplayTab() {
    var host = document.querySelector('#profile-drawer [data-pd-panel="display"]');
    if (!host) return;
    var wasActive = host.classList.contains('is-active');
    var held = null;
    var appearance = host.querySelector('#pd-appearance-mount');
    if (appearance && appearance.childNodes.length) {
      held = document.createDocumentFragment();
      while (appearance.firstChild) held.appendChild(appearance.firstChild);
    }
    var next = el(pdDisplayTabInner());
    if (wasActive) next.classList.add('is-active');
    host.parentNode.replaceChild(next, host);
    var mount = next.querySelector('#pd-appearance-mount');
    if (mount && held) mount.appendChild(held);
    else relocateAppearanceToDisplay();
    if (wasActive) call('loadAppearance');
  }

  function pdListRow(label, tail, tailClass, alt) {
    return '<div class="rd-pd__lrow' + (alt ? ' is-alt' : '') + '"><span class="rd-pd__lrow-label">' + esc(label) + '</span>' +
      '<span class="rd-pd__lrow-tail' + (tailClass ? ' ' + tailClass : '') + '">' + esc(tail) + '</span></div>';
  }
  function pdAlertsTab() {
    return '<div class="rd-pd__body" data-pd-panel="alerts">' +
      pdSub('Ama receives') +
      '<div class="rd-pd__list">' +
        pdListRow('Payment due · 7 days + morning', 'on', 'rd-pd__v--ok') +
        pdListRow('Contract window closing', 'on', 'rd-pd__v--ok', true) +
        pdListRow('RSVP deadline digest', 'on', 'rd-pd__v--ok') +
        pdListRow('Task unblocked', 'on', 'rd-pd__v--ok', true) +
        pdListRow('Vendor uploaded a document', 'off', 'rd-pd__v--muted') +
      '</div>' +
      pdSub('Watching · 6 records') +
      '<div class="rd-pd__list">' +
        pdListRow('Book the ceremony musicians', 'blocked', 'rd-pd__v--danger') +
        pdListRow('Grace Hall · second instalment', 'due 12d', 'rd-pd__v--warn', true) +
        pdListRow('Turnaround block · 14:30', 'at risk', 'rd-pd__v--danger') +
        pdListRow('+ 3 more', '', 'rd-pd__v--muted', true) +
      '</div>' +
      '<div class="rd-pd__note rd-pd__note--amber">Nine unread, oldest four days. A person’s unread count is never shown to anyone else — it is not a productivity signal.</div>' +
      '<div class="rd-pd__kvs">' + pdKV('Quiet hours', '21:00 – 07:00') + pdKV('On the day', 'All alerts off', 'rd-pd__v--gold') + '</div>' +
      '</div>';
  }

  function pdAccessTab() {
    return '<div class="rd-pd__body" data-pd-panel="access">' +
      pdSub('Can reach') +
      '<div class="rd-pd__list">' +
        pdListRow('Overview · Planning · People', 'full', 'rd-pd__v--ok') +
        pdListRow('Money · Vendors · The Day', 'full', 'rd-pd__v--ok', true) +
        pdListRow('Documents', 'full', 'rd-pd__v--ok') +
        pdListRow('Covenant', 'granted 14 Jan', 'rd-pd__v--gold', true) +
      '</div>' +
      '<div class="rd-pd__note rd-pd__note--amber">Covenant access was granted by the couple and can be revoked by them at any time, without warning and without explanation. That asymmetry is the point of the category.</div>' +
      pdSub('Cannot') +
      '<div class="rd-pd__list">' +
        pdListRow('Delete the planner', 'couple only', 'rd-pd__v--muted') +
        pdListRow('Change money rules', 'couple only', 'rd-pd__v--muted', true) +
        pdListRow('Revoke her own access', '—', 'rd-pd__v--muted') +
      '</div>' +
      pdSub('Audit') +
      '<div class="rd-pd__kvs">' + pdKV('Sessions this month', '34') + pdKV('Last export', '2 Aug · guests CSV') + pdKV('Last seen', 'Today · 09:41', 'rd-pd__v--ok') + '</div>' +
      pdSub('Wedding, roles &amp; modes') +
      '<div class="rd-pd__legacy" id="pd-legacy-mount"></div>' +
      '</div>';
  }

  function retabProfileDrawer() {
    var drawer = document.getElementById('profile-drawer');
    if (!drawer || drawer.getAttribute('data-gaps-retabbed') === '1') return;

    /* detach the original sections (keeps their live nodes + handlers intact) */
    var oldBody = drawer.querySelector('.profile-drawer-body');
    var holder = document.createDocumentFragment();
    if (oldBody) { while (oldBody.firstChild) holder.appendChild(oldBody.firstChild); }

    drawer.classList.add('rd-profile-drawer');
    drawer.setAttribute('data-gaps-retabbed', '1');
    drawer.setAttribute('data-gaps-tab', _pdTab);
    drawer.innerHTML =
      pdHeader(_pdTab) +
      '<div class="rd-pd__panels">' +
        pdProfileTab() + pdDisplayTabInner() + pdAlertsTab() + pdAccessTab() +
      '</div>' +
      pdFooter(_pdTab);

    /* re-home the preserved legacy controls into the Access tab */
    var mount = drawer.querySelector('#pd-legacy-mount');
    if (mount) mount.appendChild(holder);
    /* Appearance (themes + Create Custom Colors) lives on Display */
    relocateAppearanceToDisplay(drawer);

    /* tab strip */
    drawer.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-pd-tab]');
      if (tab) { setProfileTab(tab.getAttribute('data-pd-tab')); return; }
      var x = e.target.closest('.rd-pd__x');
      if (x) { call('closeProfileDrawer'); return; }
      var act = e.target.closest('[data-pd-action]');
      if (act) { if (act.getAttribute('data-pd-action') === 'dayof') { call('closeProfileDrawer'); call('rdEnterDayOf'); } return; }
      var foot = e.target.closest('[data-pd-foot]');
      if (foot) {
        var kind = foot.getAttribute('data-pd-foot');
        if (kind === 'primary') { call('closeProfileDrawer'); }
        else if (kind === 'settings') { call('closeProfileDrawer'); openSettingsWindow('display'); }
        else if (kind === 'notifications') { call('closeProfileDrawer'); openSettingsWindow('notifications'); }
        else if (kind === 'revoke') { if (hasFn('rdToggleCovenantAccess')) call('rdToggleCovenantAccess'); }
      }
    });

    setProfileTab(_pdTab);
  }

  function setProfileTab(tab) {
    _pdTab = tab;
    var drawer = document.getElementById('profile-drawer');
    if (!drawer) return;
    drawer.setAttribute('data-gaps-tab', tab);
    drawer.querySelectorAll('.rd-pd__tab').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-pd-tab') === tab);
    });
    drawer.querySelectorAll('[data-pd-panel]').forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-pd-panel') === tab);
    });
    var foot = drawer.querySelector('.rd-pd__foot');
    if (foot) foot.outerHTML = pdFooter(tab);
    /* refresh live appearance when Display is shown; templates stay on Access */
    if (tab === 'display') {
      relocateAppearanceToDisplay(drawer);
      call('loadAppearance');
    }
    if (tab === 'access') { call('renderTemplatesGalleryHosts'); }
  }

})();

