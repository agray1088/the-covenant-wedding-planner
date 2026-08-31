/* §39 · Top-bar menus — Master Gaps batch 45 (avatar menu is §37 viewer-prefs).
   Help flyout, undo history flyout, and search regrouped Records · Pages + ⌘K foot. */
(function () {
  'use strict';

  var SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

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
  }
  function hasFn(name) { return typeof window[name] === 'function'; }
  function getData() {
    try { return (typeof data !== 'undefined') ? data : null; } catch (e) { return null; }
  }

  function currentPageName() {
    var panel = document.body.getAttribute('data-active-panel') || 'dashboard';
    var nav = document.querySelector('.rd-subnav .is-active');
    if (nav) return (nav.textContent || '').trim() || panel;
    return panel.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function closePopovers(except) {
    ['rd-help-menu', 'rd-undo-flyout'].forEach(function (id) {
      if (except && except.id === id) return;
      var pop = document.getElementById(id);
      var btn = document.getElementById(id === 'rd-help-menu' ? 'rd-help-btn' : 'undo-btn');
      if (pop) pop.setAttribute('hidden', 'hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function positionPop(pop, anchor) {
    if (!pop || !anchor) return;
    var r = anchor.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.top = Math.round(r.bottom + 6) + 'px';
    pop.style.left = Math.round(Math.min(r.left, window.innerWidth - (pop.offsetWidth || 260) - 8)) + 'px';
    pop.style.zIndex = '5000';
  }

  function togglePop(pop, anchor) {
    var open = pop.hasAttribute('hidden');
    closePopovers(open ? pop : null);
    if (open) {
      positionPop(pop, anchor);
      pop.removeAttribute('hidden');
      anchor.setAttribute('aria-expanded', 'true');
    }
  }

  function mgrp(label) {
    return '<div class="rd-menu__grp">' + esc(label) + '</div>';
  }
  function mrow(label, kbd, cls) {
    return '<button type="button" class="rd-menu__row' + (cls ? ' ' + cls : '') + '">'
      + '<span class="rd-menu__label">' + label + '</span>'
      + (kbd ? '<span class="rd-menu__kbd">' + esc(kbd) + '</span>' : '')
      + '</button>';
  }
  function mdiv() { return '<div class="rd-menu__div"></div>'; }

  /* ── help menu ─────────────────────────────────────────────────────────── */
  function buildHelpMenu() {
    if (document.getElementById('rd-help-menu')) return;
    var pop = el('<div class="rd-gaps-pop rd-help-menu" id="rd-help-menu" role="menu" hidden></div>');
    document.body.appendChild(pop);
  }

  function renderHelpMenu() {
    var pop = document.getElementById('rd-help-menu');
    if (!pop) return;
    var page = currentPageName();
    pop.innerHTML =
      mgrp('Help')
      + mrow('Get started', '', 'js-getstarted')
      + mrow('Page-by-page guide', '', 'js-guide')
      + mrow('FAQ', '', 'js-faq')
      + mrow('Keyboard shortcuts', '?', 'js-shortcuts')
      + mdiv()
      + mgrp('This page')
      + mrow('What is this column?', '', 'js-column')
      + mrow('How does ' + esc(page) + ' work?', '', 'js-howpage')
      + mdiv()
      + mrow('Report a problem', '', 'js-report')
      + mrow('Version 2.1 · offline', '', 'js-version');

    function on(sel, fn) {
      var n = pop.querySelector(sel);
      if (n) n.addEventListener('click', function () { closePopovers(); fn(); });
    }
    on('.js-getstarted', function () { call('showPanel', 'instructions', true); });
    on('.js-guide', function () { call('showPanel', 'guide', true); });
    on('.js-faq', function () { call('showPanel', 'faq', true); });
    on('.js-shortcuts', function () {
      if (hasFn('openKeyboardShortcuts')) call('openKeyboardShortcuts');
      else if (hasFn('showKeyboardShortcuts')) call('showKeyboardShortcuts');
      else if (hasFn('openPlannerHelp')) call('openPlannerHelp');
    });
    on('.js-column', function () { call('showPanel', 'guide', true); });
    on('.js-howpage', function () {
      if (hasFn('openPlannerHelp')) call('openPlannerHelp');
      else call('showPanel', 'instructions', true);
    });
    on('.js-report', function () { if (hasFn('openPlannerHelp')) call('openPlannerHelp'); });
    on('.js-version', function () { if (hasFn('openSettingsWindow')) call('openSettingsWindow'); });
  }

  /* ── undo flyout ───────────────────────────────────────────────────────── */
  function buildUndoFlyout() {
    if (document.getElementById('rd-undo-flyout')) return;
    document.body.appendChild(el('<div class="rd-gaps-pop rd-undo-flyout" id="rd-undo-flyout" role="menu" hidden></div>'));
  }

  function renderUndoFlyout() {
    var pop = document.getElementById('rd-undo-flyout');
    if (!pop) return;
    var d = getData();
    var log = (d && Array.isArray(d._historyLog)) ? d._historyLog : [];
    var steps = log.slice(0, 3);
    var canRedo = !!(d && d._redoSnapshots && d._redoSnapshots.length);

    var html = '<div class="rd-menu__grp">Undo history · ' + steps.length
      + (steps.length === 1 ? ' step' : ' steps') + '</div>';
    if (steps.length) {
      html += '<div class="rd-undo-flyout__list">';
      steps.forEach(function (s, i) {
        var who = s.source || 'Planner';
        var when = s.time || '';
        var title = s.details || s.action || 'Change';
        html += '<button type="button" class="rd-undo-step' + (i === 0 ? ' is-top' : '') + '" data-undo-to="' + (i + 1) + '">'
          + '<span class="rd-undo-step__main"><span class="rd-undo-step__title">' + esc(title) + '</span>'
          + '<span class="rd-undo-step__meta">' + esc(who) + (when ? ' · ' + esc(when) : '') + '</span></span>'
          + (i === 0 ? '<span class="rd-menu__kbd">⌘Z</span>' : '') + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="rd-undo-flyout__empty">Nothing to undo yet.</div>';
    }
    html += '<div class="rd-undo-flyout__note">Undoing the seat change also un-derives the caterer\u2019s table count. '
      + 'Derived effects are always undone with their cause.</div>' + mdiv()
      + '<button type="button" class="rd-menu__row js-history"><span class="rd-menu__label">Open Planner History</span>'
      + '<span class="rd-menu__kbd">⇧⌘H</span></button>'
      + '<button type="button" class="rd-menu__row is-muted js-redo"' + (canRedo ? '' : ' disabled') + '>'
      + '<span class="rd-menu__label">' + (canRedo ? 'Redo last change' : 'Nothing to redo') + '</span></button>';
    pop.innerHTML = html;

    pop.querySelectorAll('[data-undo-to]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = parseInt(btn.getAttribute('data-undo-to'), 10) || 1;
        closePopovers();
        if (hasFn('undoPlannerChange')) {
          for (var i = 0; i < n; i++) {
            var dd = getData();
            if (dd && dd._undoSnapshots && dd._undoSnapshots.length) call('undoPlannerChange');
            else break;
          }
        }
      });
    });
    var hist = pop.querySelector('.js-history');
    if (hist) hist.addEventListener('click', function () {
      closePopovers();
      window._histReturnPanel = document.body.getAttribute('data-active-panel') || 'dashboard';
      if (hasFn('showPanel')) call('showPanel', 'history', true);
    });
    var redo = pop.querySelector('.js-redo');
    if (redo && canRedo) redo.addEventListener('click', function () { closePopovers(); call('redoPlannerChange'); });
  }

  /* ── search: Records first, Pages second, ⌘K footer ────────────────────── */
  function enhanceSearchResults() {
    var box = document.getElementById('gs-results');
    if (!box || !box.classList.contains('open')) return;
    var items = Array.prototype.slice.call(box.querySelectorAll('.gs-result'));
    if (!items.length) return;
    var records = [], pages = [];
    items.forEach(function (it) {
      var t = ((it.querySelector('.gs-type') || {}).textContent || '').trim();
      if (t === 'Page' || t === 'Setup') pages.push(it);
      else records.push(it);
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

  function wrapGlobalSearch() {
    if (!hasFn('runGlobalSearch') || window.__rdGsGapsWrapped) return;
    var orig = window.runGlobalSearch;
    window.runGlobalSearch = function () {
      var r = orig.apply(this, arguments);
      try { enhanceSearchResults(); } catch (e) { /* soft */ }
      return r;
    };
    window.__rdGsGapsWrapped = true;
  }

  /* ── wire top bar ──────────────────────────────────────────────────────── */
  function buildTopbarMenus() {
    var bar = document.querySelector('.rd-topbar');
    if (!bar || bar.getAttribute('data-chrome-menus') === '1') return;
    var right = bar.querySelector('.rd-topbar__right');
    if (!right) return;
    bar.setAttribute('data-chrome-menus', '1');

    buildHelpMenu();
    buildUndoFlyout();

    var helpBtn = el('<button type="button" class="rd-topbar__help-btn" id="rd-help-btn" aria-label="Help" aria-haspopup="true" aria-expanded="false">'
      + '<svg ' + SVG + ' width="17" height="17"><circle cx="12" cy="12" r="9"></circle>'
      + '<path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.2-1.2.9-1.2 1.6v.5"></path><path d="M12 17.5v.01"></path></svg></button>');
    var gear = document.getElementById('rd-gear-btn');
    if (gear) right.insertBefore(helpBtn, gear);
    else right.appendChild(helpBtn);

    helpBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      renderHelpMenu();
      togglePop(document.getElementById('rd-help-menu'), helpBtn);
    });

    var undoBtn = document.getElementById('undo-btn');
    if (undoBtn && !undoBtn.dataset.rdFlyout) {
      undoBtn.dataset.rdFlyout = '1';
      undoBtn.addEventListener('click', function (e) {
        if (e.altKey || e.metaKey) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        renderUndoFlyout();
        togglePop(document.getElementById('rd-undo-flyout'), undoBtn);
      }, true);
    }

    wrapGlobalSearch();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.rd-gaps-pop') || e.target.closest('#rd-help-btn') || e.target.closest('#undo-btn')) return;
    closePopovers();
  });

  function boot() {
    if (document.querySelector('.rd-topbar')) buildTopbarMenus();
    else setTimeout(boot, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 600); });
  } else {
    setTimeout(boot, 600);
  }
})();
