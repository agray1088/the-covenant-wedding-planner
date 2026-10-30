/* ═══════════════════════════════════════════════════════════════════════
   DESKTOP SHELL LAYOUT — Electron-only chrome (gated on covenant-desktop)
   ───────────────────────────────────────────────────────────────────────
   Stack (top → bottom), agreed direction:
     1. Native Electron menu (File/Edit/View/Go/Help) — main process
     2. Compact green brand bar — redesign-shell rd-topbar--desktop
     3. Horizontal section tabs (.rd-tabs) — Overview…Documents
     4. Light ribbon: Home | Plan | View | Help + grouped commands
     5. Per-page toolbars (unchanged)
     6. Content + optional right CRM inspector (Guests v1)
     7. In-page left panels stay (views/filters) — not app section nav

   Web / PWA: this module no-ops unless desktop detection succeeds.
   Critical actions remain reachable via Settings / page UI / native menus
   (ribbon is additive — Phase T / tablet constraint).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var RIBBON_ID = 'rd-desktop-ribbon';
  var INSPECTOR_EMPTY_ID = 'rd-crm-inspector-empty';
  var LS_INSPECTOR = 'covenant_desktop_inspector_collapsed';
  var LS_RIBBON_TAB = 'covenant_desktop_ribbon_tab';

  function isDesktopShell() {
    try {
      if (window.COVENANT_DESKTOP && window.COVENANT_DESKTOP.isDesktop) return true;
      if (window.covenantDesktop && window.covenantDesktop.isDesktop) return true;
      if (document.documentElement && document.documentElement.classList.contains('covenant-desktop')) return true;
      if (document.body && document.body.classList.contains('covenant-desktop')) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html).trim();
    return d.firstElementChild;
  }

  function runMenu(action, payload) {
    try {
      if (action === 'export-backup' && typeof downloadSqliteBackup === 'function') return downloadSqliteBackup();
      if (action === 'import-backup') {
        var i = document.getElementById('importInput');
        if (i) i.click();
        return;
      }
      if (action === 'undo' && typeof undoPlannerChange === 'function') return undoPlannerChange();
      if (action === 'redo' && typeof redoPlannerChange === 'function') return redoPlannerChange();
      if (action === 'dark-mode' && typeof toggleDarkMode === 'function') return toggleDarkMode();
      if (action === 'profile-display') {
        if (typeof toggleProfileDrawer === 'function') return toggleProfileDrawer();
        var w = document.getElementById('rd-wedding-btn');
        if (w) w.click();
        return;
      }
      if (action === 'quick-jump') {
        if (typeof openCommandPalette === 'function') return openCommandPalette();
        if (typeof toggleQuickJump === 'function') return toggleQuickJump();
        var s = document.getElementById('gs-input');
        if (s) { s.focus(); return; }
      }
      if (action === 'data-hub' && typeof openDataHub === 'function') return openDataHub();
      if (action === 'settings') {
        if (typeof openSettingsWindow === 'function') return openSettingsWindow();
        var g = document.getElementById('rd-gear-btn');
        if (g) g.click();
        return;
      }
      if (action === 'backup-help' && typeof openFooterBackupHelp === 'function') return openFooterBackupHelp();
      if (action === 'panel' && payload && typeof showPanel === 'function') return showPanel(payload, true);
      if (action === 'about') {
        if (window.covenantDesktop && typeof window.covenantDesktop.showAbout === 'function') {
          return window.covenantDesktop.showAbout();
        }
        if (typeof openSettingsWindow === 'function') return openSettingsWindow('about');
        return;
      }
      if (action === 'zoom-in' && window.covenantDesktop && typeof window.covenantDesktop.zoomIn === 'function') {
        return window.covenantDesktop.zoomIn();
      }
      if (action === 'zoom-out' && window.covenantDesktop && typeof window.covenantDesktop.zoomOut === 'function') {
        return window.covenantDesktop.zoomOut();
      }
      if (action === 'zoom-reset' && window.covenantDesktop && typeof window.covenantDesktop.zoomReset === 'function') {
        return window.covenantDesktop.zoomReset();
      }
      if (action === 'sync-now' && typeof window.cloudSyncNow === 'function') {
        return window.cloudSyncNow();
      }
      if (action === 'cloud-settings') {
        if (typeof openSettingsWindow === 'function') return openSettingsWindow('cloud');
        return runMenu('settings');
      }
      if (action === 'docs-guide' && typeof showPanel === 'function') return showPanel('guide', true);
      if (action === 'docs-faq' && typeof showPanel === 'function') return showPanel('faq', true);
      if (action === 'docs-started' && typeof showPanel === 'function') return showPanel('instructions', true);
    } catch (e) {
      try { console.error('desktop ribbon', e); } catch (_) { /* ignore */ }
    }
  }

  function saveStatusText() {
    var node = document.getElementById('last-saved');
    if (!node) return 'Save status';
    var t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    return t || 'Saved';
  }

  var RIBBON_TABS = [
    {
      id: 'home',
      label: 'Home',
      groups: [
        {
          label: 'Edit',
          items: [
            { id: 'undo', label: 'Undo', action: 'undo' },
            { id: 'redo', label: 'Redo', action: 'redo' }
          ]
        },
        {
          label: 'Backup',
          items: [
            { id: 'export', label: 'Export Backup', action: 'export-backup' },
            { id: 'import', label: 'Import Backup', action: 'import-backup' }
          ]
        },
        {
          label: 'Status',
          items: [
            { id: 'save-status', label: 'Save status', kind: 'status' }
          ]
        }
      ]
    },
    {
      id: 'plan',
      label: 'Plan',
      groups: [
        {
          label: 'Navigate',
          items: [
            { id: 'jump', label: 'Quick Jump', action: 'quick-jump' },
            { id: 'hub', label: 'Database Hub', action: 'data-hub' }
          ]
        },
        {
          label: 'Sync',
          items: [
            { id: 'sync', label: 'Sync now', action: 'sync-now', when: 'sync' },
            { id: 'cloud', label: 'Cloud sync…', action: 'cloud-settings' }
          ]
        }
      ]
    },
    {
      id: 'view',
      label: 'View',
      groups: [
        {
          label: 'Display',
          items: [
            { id: 'dark', label: 'Dark Mode', action: 'dark-mode' },
            { id: 'profile', label: 'Profile & Display', action: 'profile-display' }
          ]
        },
        {
          label: 'Zoom',
          items: [
            { id: 'zin', label: 'Zoom in', action: 'zoom-in', when: 'zoom' },
            { id: 'zout', label: 'Zoom out', action: 'zoom-out', when: 'zoom' },
            { id: 'zreset', label: 'Actual size', action: 'zoom-reset', when: 'zoom' }
          ]
        }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      groups: [
        {
          label: 'About',
          items: [
            { id: 'about', label: 'About', action: 'about' },
            { id: 'backup-help', label: 'Backup help', action: 'backup-help' }
          ]
        },
        {
          label: 'Docs',
          items: [
            { id: 'started', label: 'Get started', action: 'docs-started' },
            { id: 'guide', label: 'Page guide', action: 'docs-guide' },
            { id: 'faq', label: 'FAQ', action: 'docs-faq' }
          ]
        }
      ]
    }
  ];

  function itemAllowed(item) {
    if (item.when === 'zoom') {
      return !!(window.covenantDesktop && (
        typeof window.covenantDesktop.zoomIn === 'function' ||
        typeof window.covenantDesktop.zoomOut === 'function'
      ));
    }
    /* sync-now / cloud-settings always listed; sync-now disables when unavailable */
    return true;
  }

  function activeRibbonTab() {
    try {
      var t = localStorage.getItem(LS_RIBBON_TAB);
      if (t && RIBBON_TABS.some(function (x) { return x.id === t; })) return t;
    } catch (e) { /* ignore */ }
    return 'home';
  }

  function setActiveRibbonTab(id) {
    try { localStorage.setItem(LS_RIBBON_TAB, id); } catch (e) { /* ignore */ }
    renderRibbonCommands();
    var root = document.getElementById(RIBBON_ID);
    if (!root) return;
    root.querySelectorAll('.rd-ribbon__tab').forEach(function (b) {
      var on = b.getAttribute('data-ribbon-tab') === id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-selected', 'true');
      else b.removeAttribute('aria-selected');
    });
  }

  function renderRibbonCommands() {
    var root = document.getElementById(RIBBON_ID);
    if (!root) return;
    var host = root.querySelector('.rd-ribbon__commands');
    if (!host) return;
    var tabId = activeRibbonTab();
    var tab = RIBBON_TABS.filter(function (t) { return t.id === tabId; })[0] || RIBBON_TABS[0];
    host.innerHTML = '';
    tab.groups.forEach(function (grp) {
      var items = grp.items.filter(itemAllowed);
      if (!items.length) return;
      var g = el('<div class="rd-ribbon__group" role="group" aria-label="' + grp.label + '"></div>');
      var lab = el('<span class="rd-ribbon__group-label">' + grp.label + '</span>');
      g.appendChild(lab);
      var row = el('<div class="rd-ribbon__group-row"></div>');
      items.forEach(function (item) {
        if (item.kind === 'status') {
          var st = el('<span class="rd-ribbon__status" data-ribbon-save-status title="Save status">' +
            saveStatusText() + '</span>');
          row.appendChild(st);
          return;
        }
        var disabled = item.action === 'sync-now' && typeof window.cloudSyncNow !== 'function';
        var btn = el(
          '<button type="button" class="rd-ribbon__btn"' +
            (disabled ? ' disabled aria-disabled="true"' : '') +
            ' data-ribbon-action="' + item.action + '">' + item.label + '</button>'
        );
        if (!disabled) {
          btn.addEventListener('click', function () { runMenu(item.action); });
        }
        row.appendChild(btn);
      });
      g.appendChild(row);
      host.appendChild(g);
    });
  }

  function buildRibbon() {
    if (document.getElementById(RIBBON_ID)) {
      renderRibbonCommands();
      return;
    }
    var tabsEl = document.querySelector('.rd-tabs');
    var subnav = document.querySelector('.rd-subnav');
    if (!tabsEl) return;

    var ribbon = el(
      '<div class="rd-ribbon" id="' + RIBBON_ID + '" role="region" aria-label="Desktop command ribbon">' +
        '<div class="rd-ribbon__tabs" role="tablist" aria-label="Ribbon">' +
        '</div>' +
        '<div class="rd-ribbon__commands" role="tabpanel"></div>' +
      '</div>'
    );
    var tablist = ribbon.querySelector('.rd-ribbon__tabs');
    var current = activeRibbonTab();
    RIBBON_TABS.forEach(function (t) {
      var b = el(
        '<button type="button" class="rd-ribbon__tab' + (t.id === current ? ' is-active' : '') +
          '" role="tab" data-ribbon-tab="' + t.id + '"' +
          (t.id === current ? ' aria-selected="true"' : '') + '>' + t.label + '</button>'
      );
      b.addEventListener('click', function () { setActiveRibbonTab(t.id); });
      tablist.appendChild(b);
    });

    /* Place after horizontal section tabs; before page sub-nav when present. */
    if (subnav && subnav.parentNode === tabsEl.parentNode) {
      tabsEl.parentNode.insertBefore(ribbon, subnav);
    } else if (tabsEl.nextSibling) {
      tabsEl.parentNode.insertBefore(ribbon, tabsEl.nextSibling);
    } else {
      tabsEl.parentNode.appendChild(ribbon);
    }
    renderRibbonCommands();
  }

  function refreshSaveStatus() {
    var node = document.querySelector('[data-ribbon-save-status]');
    if (node) node.textContent = saveStatusText();
  }

  /* ── CRM inspector (Guests / People v1) ─────────────────────────────── */
  function inspectorCollapsed() {
    try { return localStorage.getItem(LS_INSPECTOR) === '1'; } catch (e) { return false; }
  }

  function setInspectorCollapsed(on) {
    try { localStorage.setItem(LS_INSPECTOR, on ? '1' : '0'); } catch (e) { /* ignore */ }
    document.body.classList.toggle('rd-crm-inspector-collapsed', !!on);
    syncGuestInspector();
  }

  function ensureInspectorEmpty(slot) {
    var empty = document.getElementById(INSPECTOR_EMPTY_ID);
    if (!empty) {
      empty = el(
        '<div class="rd-crm-inspector-empty" id="' + INSPECTOR_EMPTY_ID + '" hidden>' +
          '<div class="rd-crm-inspector-empty__title">Select a row</div>' +
          '<p class="rd-crm-inspector-empty__copy">Choose a guest in the list to review and edit details here. Collapse this panel anytime to give the table more room.</p>' +
        '</div>'
      );
      slot.appendChild(empty);
    }
    return empty;
  }

  function ensureInspectorChrome(slot) {
    if (!slot || slot.querySelector('[data-crm-inspector-toggle]')) return;
    var bar = el(
      '<div class="rd-crm-inspector-chrome" data-crm-inspector-chrome>' +
        '<span class="rd-crm-inspector-chrome__label">Details</span>' +
        '<button type="button" class="rd-crm-inspector-toggle" data-crm-inspector-toggle ' +
          'aria-label="Collapse details panel" title="Collapse">‹</button>' +
      '</div>'
    );
    slot.insertBefore(bar, slot.firstChild);
    bar.querySelector('[data-crm-inspector-toggle]').addEventListener('click', function () {
      setInspectorCollapsed(true);
    });
  }

  function ensureInspectorExpandBtn() {
    var panel = document.getElementById('panel-guests');
    if (!panel) return;
    var existing = panel.querySelector('[data-crm-inspector-expand]');
    if (existing) return;
    var surface = panel.querySelector('.rd-surface__row') || panel.querySelector('.rd-surface');
    if (!surface) return;
    var btn = el(
      '<button type="button" class="rd-crm-inspector-expand" data-crm-inspector-expand ' +
        'aria-label="Show details panel" title="Show details">Details ›</button>'
    );
    btn.addEventListener('click', function () { setInspectorCollapsed(false); });
    surface.appendChild(btn);
  }

  function syncGuestInspector() {
    if (!isDesktopShell()) return;
    var panel = document.getElementById('panel-guests');
    var slot = document.getElementById('guest-drawer-slot');
    if (!panel || !slot) return;

    document.body.classList.add('rd-crm-inspector');
    document.body.classList.toggle('rd-crm-inspector-collapsed', inspectorCollapsed());
    ensureInspectorChrome(slot);
    ensureInspectorEmpty(slot);
    ensureInspectorExpandBtn();

    var drawer = document.getElementById('record-drawer');
    var open = drawer && !drawer.hasAttribute('hidden') && drawer.parentElement === slot;
    var empty = document.getElementById(INSPECTOR_EMPTY_ID);
    var collapsed = inspectorCollapsed();

    if (collapsed) {
      slot.classList.remove('is-open');
      slot.classList.add('is-collapsed');
      if (empty) empty.setAttribute('hidden', '');
      return;
    }

    slot.classList.remove('is-collapsed');
    /* Keep the inspector column visible with empty or live drawer. */
    slot.classList.add('is-open');
    if (empty) {
      if (open) empty.setAttribute('hidden', '');
      else empty.removeAttribute('hidden');
    }
  }

  function observeDrawer() {
    var drawer = document.getElementById('record-drawer');
    if (!drawer || drawer._rdCrmObserved) return;
    drawer._rdCrmObserved = true;
    try {
      new MutationObserver(function () { syncGuestInspector(); })
        .observe(drawer, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { /* ignore */ }
  }

  function wrapDrawerHooks() {
    if (window._rdCrmDrawerWrapped) return;
    window._rdCrmDrawerWrapped = true;
    var open = window.rdOpenDrawer;
    var close = window.rdCloseDrawer;
    if (typeof open === 'function') {
      window.rdOpenDrawer = function (key, index, seed) {
        if (isDesktopShell() && key === 'guests' && inspectorCollapsed()) {
          setInspectorCollapsed(false);
        }
        var r = open.apply(this, arguments);
        syncGuestInspector();
        return r;
      };
    }
    if (typeof close === 'function') {
      window.rdCloseDrawer = function () {
        var r = close.apply(this, arguments);
        setTimeout(syncGuestInspector, 0);
        setTimeout(syncGuestInspector, 50);
        return r;
      };
    }
  }

  function ensureHorizontalSectionTabs() {
    /* Prior polish hid #nav-category-bar under covenant-desktop; redesign .rd-tabs
       is the agreed horizontal section menubar — force it visible. */
    var tabs = document.querySelector('.rd-tabs');
    if (tabs) {
      tabs.removeAttribute('hidden');
      tabs.style.removeProperty('display');
      tabs.classList.add('rd-tabs--desktop-app-nav');
    }
    var sub = document.querySelector('.rd-subnav');
    if (sub) {
      sub.removeAttribute('hidden');
      sub.classList.add('rd-subnav--desktop');
    }
  }

  function boot() {
    if (!isDesktopShell()) return;
    try {
      document.documentElement.classList.add('covenant-desktop');
      document.body.classList.add('covenant-desktop');
    } catch (e) { /* ignore */ }

    ensureHorizontalSectionTabs();
    buildRibbon();
    wrapDrawerHooks();
    observeDrawer();
    syncGuestInspector();

    try {
      new MutationObserver(function () {
        ensureHorizontalSectionTabs();
        buildRibbon();
        observeDrawer();
        syncGuestInspector();
        refreshSaveStatus();
      }).observe(document.body, {
        attributes: true,
        attributeFilter: ['data-active-panel', 'class']
      });
    } catch (e) { /* ignore */ }

    /* Keep ribbon save status roughly in sync with the top bar. */
    setInterval(refreshSaveStatus, 4000);
  }

  window.covenantDesktopShell = {
    boot: boot,
    runMenu: runMenu,
    syncInspector: syncGuestInspector,
    refreshRibbon: renderRibbonCommands,
    setInspectorCollapsed: setInspectorCollapsed
  };

  function start() {
    if (!isDesktopShell()) return;
    /* Wait for redesign-shell tabs when possible. */
    var tries = 0;
    (function tick() {
      tries += 1;
      if (document.querySelector('.rd-tabs') || tries > 40) {
        boot();
        return;
      }
      setTimeout(tick, 50);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
