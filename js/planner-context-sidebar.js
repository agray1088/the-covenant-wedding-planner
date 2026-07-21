/* Planner context sidebar — page context + quick access (single scroll) */
(function () {
  'use strict';

  function plannerData() {
    if (typeof getCovenantPlannerData === 'function') return getCovenantPlannerData();
    try {
      if (typeof data !== 'undefined') return data;
    } catch (e) { /* cross-script let binding */ }
    return null;
  }

  function esc(v) {
    return typeof escapeHtml === 'function' ? escapeHtml(v == null ? '' : v) : String(v == null ? '' : v);
  }

  function panelLabel(id) {
    return (typeof QJ_PAGES !== 'undefined' && QJ_PAGES[id]) ? QJ_PAGES[id] : id;
  }

  function isActive() {
    return document.body.classList.contains('context-sidebar-mode');
  }

  function pcsHead(title, kicker) {
    return '<div class="pcs-head"><div class="pcs-head__kicker">' + esc(kicker || 'This page') + '</div><h2 class="pcs-head__title">' + esc(title) + '</h2></div>';
  }

  function pcsStats(stats) {
    if (!stats || !stats.length) return '';
    return '<div class="pcs-block"><div class="pcs-stat-row">' + stats.map(function (s) {
      return '<div class="pcs-stat"><div class="pcs-stat__val">' + esc(s.val) + '</div><div class="pcs-stat__lbl">' + esc(s.lbl) + '</div></div>';
    }).join('') + '</div></div>';
  }

  function pcsLinks(rows) {
    if (!rows || !rows.length) return '';
    return '<div class="pcs-block"><div class="pcs-block__title">Related</div>' + rows.map(function (r) {
      var action = r.panel ? "showPanel('" + r.panel + "')" : (r.action || '');
      return '<div class="pcs-sync-row"><span>' + esc(r.label) + '</span><button type="button" onclick="' + action + '">Open</button></div>';
    }).join('') + '</div>';
  }

  function buildGuestContext() {
    var d = plannerData() || {};
    var guests = typeof safeArray === 'function' ? safeArray(d.guests) : [];
    var total = guests.length;
    var yes = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || ''); }).length;
    var pending = guests.filter(function (g) { return !/yes|accepted|no|declined/i.test(g.rsvp || ''); }).length;
    var rate = total ? Math.round((yes / total) * 100) + '%' : '—';
    var chase = typeof getGuestChaseQueue === 'function' ? getGuestChaseQueue(8) : [];
    var mealsMissing = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || '') && !String(g.meal || '').trim(); });
    var preset = typeof _guestFilterPreset !== 'undefined' ? _guestFilterPreset : '';

    var chips = [
      { id: '', label: 'All' },
      { id: 'non-responders', label: 'Pending' }
    ];
    var chipsHtml = chips.map(function (c) {
      var active = (c.id || '') === (preset || '') ? ' is-active' : '';
      return '<button type="button" class="pcs-chip' + active + '" onclick="applyGuestFilterPreset(\'' + (c.id || 'all') + '\');if(typeof renderGuests===\'function\')renderGuests();if(typeof renderContextSidebar===\'function\')renderContextSidebar(\'guests\');">' + esc(c.label) + '</button>';
    }).join('');

    var chaseHtml = chase.length
      ? chase.map(function (item) {
          var name = esc(item.g && item.g.name ? item.g.name : 'Guest');
          return '<li class="is-clickable" onclick="contextSidebarHighlightGuest(' + item.idx + ')"><span>' + name + '</span><button type="button" onclick="event.stopPropagation();copyRsvpFollowUpForGuest(' + item.idx + ')">Copy</button></li>';
        }).join('')
      : '<li><span class="pcs-empty">All set — no pending chase.</span></li>';

    var target = parseInt(d.setup && d.setup.guests, 10) || 0;
    var seated = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || '') && String(g.table || '').trim(); }).length;

    return pcsHead('Guest List', 'This page') +
      pcsStats([
        { val: String(total), lbl: 'Invited' },
        { val: String(yes), lbl: 'Attending' },
        { val: String(pending), lbl: 'Pending' },
        { val: rate, lbl: 'RSVP rate' }
      ]) +
      (total ? '<div class="pcs-block"><div class="pcs-block__title">Filters</div><div class="pcs-chip-row">' + chipsHtml + '</div></div>' : '') +
      (chase.length ? '<div class="pcs-block"><div class="pcs-block__title">RSVP chase <span class="pcs-badge pcs-badge--warn">' + chase.length + '</span></div><ul class="pcs-queue">' + chaseHtml + '</ul></div>' : '') +
      (mealsMissing.length ? '<div class="pcs-block"><div class="pcs-block__title">Meals missing <span class="pcs-badge pcs-badge--warn">' + mealsMissing.length + '</span></div><ul class="pcs-queue">' +
        mealsMissing.slice(0, 6).map(function (g) { return '<li><span>' + esc(g.name || 'Guest') + '</span></li>'; }).join('') +
        '</ul></div>' : '') +
      '<div class="pcs-block"><div class="pcs-block__title">Sync</div>' +
      '<div class="pcs-sync-row"><span>Catering: ' + yes + (target ? ' / ' + target + ' target' : '') + '</span><button type="button" onclick="showPanel(\'catering\')">Open</button></div>' +
      '<div class="pcs-sync-row"><span>Seated: ' + seated + ' / ' + yes + '</span><button type="button" onclick="showPanel(\'tables\')">Open</button></div></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">Actions</div><div class="pcs-actions">' +
      '<button type="button" class="ued-btn primary" onclick="addGuestRow()">+ Add guest</button>' +
      '<button type="button" class="ued-btn" onclick="openGuestCSVImport(\'guests\')">Import CSV</button>' +
      '<button type="button" class="ued-btn" onclick="copyRsvpFollowUpTemplate()">Copy follow-up</button>' +
      '<button type="button" class="ued-btn" onclick="openDataHub(\'people\',\'guests\')">Database Hub</button></div></div>';
  }

  function buildDashboardContext() {
    var d = plannerData() || {};
    var days = '—';
    if (d.setup && d.setup.date && typeof todayISO === 'function' && typeof dateDiffDays === 'function') {
      days = String(Math.max(0, dateDiffDays(todayISO(), d.setup.date)));
    } else if (d.setup && d.setup.date) {
      var weddingDate = new Date(d.setup.date);
      var t = new Date();
      days = String(Math.max(0, Math.ceil((weddingDate - t) / 86400000)));
    }
    var tasks = typeof safeArray === 'function' ? safeArray(d.tasks) : [];
    var done = tasks.filter(function (t) { return t.status === 'Complete'; }).length;
    var guests = typeof safeArray === 'function' ? safeArray(d.guests) : [];
    var yes = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || ''); }).length;
    var spent = typeof budgetTotalActual === 'function' ? budgetTotalActual() : 0;
    var total = parseFloat(d.setup && d.setup.budget) || 0;
    var pct = total > 0 ? Math.round((spent / total) * 100) + '%' : '—';

    return pcsHead('Dashboard', 'This page') +
      pcsStats([
        { val: String(days), lbl: 'Days left' },
        { val: pct, lbl: 'Budget used' },
        { val: String(yes), lbl: 'Guests yes' },
        { val: done + '/' + tasks.length, lbl: 'Tasks done' }
      ]) +
      '<div class="pcs-block"><div class="pcs-block__title">Quick links</div><div class="pcs-actions">' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'setup\')">Wedding Setup</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'tasks\')">Timeline</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'calendar\')">Calendar</button></div></div>';
  }

  function buildBudgetContext() {
    var d = plannerData() || {};
    var total = parseFloat(d.setup && d.setup.budget) || 0;
    var spent = typeof budgetTotalActual === 'function' ? budgetTotalActual() : 0;
    var left = Math.max(0, total - spent);
    var pct = total > 0 ? Math.round((spent / total) * 100) + '%' : '—';
    var fmtFn = typeof fmt === 'function' ? fmt : function (v) { return '$' + (parseFloat(v) || 0).toLocaleString(); };

    return pcsHead('Budget', 'This page') +
      pcsStats([
        { val: fmtFn(total), lbl: 'Target' },
        { val: fmtFn(spent), lbl: 'Spent' },
        { val: fmtFn(left), lbl: 'Remaining' },
        { val: pct, lbl: 'Used' }
      ]) +
      pcsLinks([
        { panel: 'payments', label: 'Payments' },
        { panel: 'contracts', label: 'Contracts' },
        { action: "openDataHub('finances','budgetHub')", label: 'Budget tables' }
      ]) +
      '<div class="pcs-block"><div class="pcs-actions"><button type="button" class="ued-btn" onclick="openDataHub(\'finances\',\'budgetHub\')">Database Hub</button></div></div>';
  }

  function buildPaymentsContext() {
    var d = plannerData() || {};
    var rows = typeof safeArray === 'function' ? safeArray(d.payments) : [];
    var paid = rows.filter(function (p) { return /paid/i.test(p.status || ''); }).length;
    var fmtFn = typeof fmt === 'function' ? fmt : function (v) { return '$' + (parseFloat(v) || 0).toLocaleString(); };
    var dueSoon = rows.filter(function (p) { return !/paid/i.test(p.status || ''); }).slice(0, 4);

    return pcsHead('Payments', 'This page') +
      pcsStats([
        { val: String(rows.length), lbl: 'Total' },
        { val: String(paid), lbl: 'Paid' },
        { val: String(rows.length - paid), lbl: 'Outstanding' }
      ]) +
      (dueSoon.length ? '<div class="pcs-block"><div class="pcs-block__title">Outstanding</div><ul class="pcs-queue">' +
        dueSoon.map(function (p) { return '<li><span>' + esc(p.vendor || p.desc || 'Payment') + '</span><span>' + fmtFn(p.amount) + '</span></li>'; }).join('') +
        '</ul></div>' : '') +
      pcsLinks([{ panel: 'budget', label: 'Budget' }, { panel: 'contracts', label: 'Contracts' }]);
  }

  function buildTasksContext() {
    var d = plannerData() || {};
    var tasks = typeof safeArray === 'function' ? safeArray(d.tasks) : [];
    var done = tasks.filter(function (t) { return t.status === 'Complete'; }).length;
    var overdue = typeof taskIsOverdue === 'function' ? tasks.filter(function (t) { return taskIsOverdue(t); }).length : 0;

    return pcsHead('Planning Timeline', 'This page') +
      pcsStats([
        { val: String(tasks.length - done), lbl: 'Open' },
        { val: String(done), lbl: 'Complete' },
        { val: String(overdue), lbl: 'Overdue' }
      ]) +
      pcsLinks([{ panel: 'calendar', label: 'Calendar' }, { panel: 'vendors', label: 'Vendors' }]);
  }

  function buildCateringContext() {
    var d = plannerData() || {};
    var target = parseInt(d.setup && d.setup.guests, 10) || 0;
    var guests = typeof safeArray === 'function' ? safeArray(d.guests) : [];
    var yes = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || ''); }).length;
    var mealsMissing = guests.filter(function (g) { return /yes|accepted/i.test(g.rsvp || '') && !String(g.meal || '').trim(); }).length;

    return pcsHead('Catering & Menu', 'This page') +
      pcsStats([
        { val: String(target || yes), lbl: 'Target' },
        { val: String(yes), lbl: 'Confirmed' },
        { val: String(mealsMissing), lbl: 'Meals TBD' }
      ]) +
      pcsLinks([{ panel: 'guests', label: 'Guest list' }, { action: "openDataHub('catering','menu')", label: 'Menu tables' }]);
  }

  function buildDataHubContext() {
    var cat = typeof _dataHub !== 'undefined' && _dataHub.category ? _dataHub.category : 'people';
    var tabId = typeof _dataHub !== 'undefined' && _dataHub.table ? _dataHub.table : '';
    var reg = typeof DATA_HUB_REGISTRY !== 'undefined' ? DATA_HUB_REGISTRY : {};
    var catsHtml = Object.keys(reg).map(function (id) {
      var c = reg[id];
      return '<button type="button" class="pcs-chip' + (id === cat ? ' is-active' : '') + '" onclick="openDataHub(\'' + id + '\')">' + esc(c.label) + '</button>';
    }).join('');
    var tables = reg[cat] && reg[cat].tables ? reg[cat].tables : [];
    var tabsHtml = tables.map(function (t) {
      var k = t.key;
      return '<button type="button" class="pcs-chip' + (k === tabId ? ' is-active' : '') + '" onclick="setDataHubContext(\'' + cat + '\',\'' + k + '\');renderDataHub();if(typeof renderContextSidebar===\'function\')renderContextSidebar(\'data-hub\');">' + esc(t.label) + '</button>';
    }).join('');

    return pcsHead('Database Hub', 'This page') +
      '<div class="pcs-block"><div class="pcs-block__title">Category</div><div class="pcs-chip-row">' + catsHtml + '</div></div>' +
      (tabsHtml ? '<div class="pcs-block"><div class="pcs-block__title">Table</div><div class="pcs-chip-row">' + tabsHtml + '</div></div>' : '') +
      '<div class="pcs-block"><div class="pcs-actions"><button type="button" class="ued-btn" onclick="autoFitDataHubTables()">Auto-fit columns</button></div></div>';
  }

  function buildGenericContext(panelId) {
    var title = panelLabel(panelId);
    return pcsHead(title, 'This page') +
      '<div class="pcs-block"><p class="pcs-empty">Page-specific stats and quick actions for ' + esc(title) + ' appear here as the sidebar expands.</p></div>' +
      pcsLinks([{ action: "openDataHub()", label: 'Database Hub' }, { panel: 'dashboard', label: 'Dashboard' }]);
  }

  var CONTEXT_BUILDERS = {
    guests: buildGuestContext,
    dashboard: buildDashboardContext,
    budget: buildBudgetContext,
    payments: buildPaymentsContext,
    tasks: buildTasksContext,
    catering: buildCateringContext,
    'data-hub': buildDataHubContext
  };

  function renderContextSidebarPageContext(panelId) {
    var host = document.getElementById('planner-sidebar-context');
    if (!host) return;
    var build = CONTEXT_BUILDERS[panelId] || function () { return buildGenericContext(panelId); };
    host.innerHTML = build(panelId);

    var rail = document.getElementById('planner-context-sidebar-rail');
    if (rail) rail.innerHTML = '';
  }

  function renderContextSidebarGlobal() {
    var host = document.getElementById('planner-sidebar-global');
    if (!host) return;
    var active = document.body.getAttribute('data-active-panel') || 'dashboard';
    var ob = typeof ensureOnboardData === 'function' ? ensureOnboardData() : {};
    var favs = Array.isArray(ob.favoritePages) ? ob.favoritePages.filter(function (p) { return typeof QJ_PAGES !== 'undefined' && QJ_PAGES[p]; }) : [];
    var recents = Array.isArray(ob.recentPages) ? ob.recentPages.filter(function (p) { return typeof QJ_PAGES !== 'undefined' && QJ_PAGES[p]; }).slice(0, 6) : [];

    function favRow(id) {
      return '<li><button type="button" onclick="quickJumpTo(\'' + id + '\')">' + esc(panelLabel(id)) + '</button>' +
        '<button type="button" class="pcs-star-btn is-fav" onclick="event.stopPropagation();toggleFavoritePage(\'' + id + '\');renderContextSidebarGlobal();" title="Remove favorite">★</button></li>';
    }
    function recentRow(id) {
      var isFav = favs.indexOf(id) >= 0;
      return '<li><button type="button" onclick="quickJumpTo(\'' + id + '\')">' + esc(panelLabel(id)) + '</button>' +
        '<button type="button" class="pcs-star-btn' + (isFav ? ' is-fav' : '') + '" onclick="event.stopPropagation();toggleFavoritePage(\'' + id + '\');renderContextSidebarGlobal();" title="Toggle favorite">' + (isFav ? '★' : '☆') + '</button></li>';
    }

    var favHtml = favs.length ? favs.map(favRow).join('') : '<li><p class="pcs-empty">Star pages from recents below.</p></li>';
    var recentHtml = recents.length ? recents.map(recentRow).join('') : '<li><p class="pcs-empty">Visit pages to build recents.</p></li>';
    var isFavActive = favs.indexOf(active) >= 0;

    host.innerHTML =
      '<div class="pcs-block"><div class="pcs-global-alert"><strong>Quick access</strong> — favorites, recents, and common actions. Use the category labels above for full navigation.</div></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">★ Favorites</div><ul class="pcs-global-list">' + favHtml + '</ul></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">Recent</div><ul class="pcs-global-list">' + recentHtml + '</ul></div>' +
      '<div class="pcs-block"><div class="pcs-block__title">Common actions</div><div class="pcs-global-actions">' +
      '<button type="button" class="ued-btn" onclick="openDataHub()">Database Hub</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'setup\')">Wedding Setup</button>' +
      '<button type="button" class="ued-btn" onclick="downloadSqliteBackup()">Backup</button>' +
      '<button type="button" class="ued-btn" onclick="addGuestRow();showPanel(\'guests\')">+ Guest</button>' +
      '<button type="button" class="ued-btn" onclick="showPanel(\'tasks\')">+ Task</button></div></div>' +
      '<div class="pcs-block"><button type="button" class="ued-btn" style="width:100%" onclick="toggleFavoritePage(\'' + active + '\');renderContextSidebarGlobal();">' +
      (isFavActive ? '★ Remove from favorites' : '☆ Add page to favorites') + '</button></div>';
  }

  function renderContextSidebarShortcuts() {
    var host = document.getElementById('planner-sidebar-shortcuts');
    if (!host || !isActive()) return;
    var sections = typeof getPlannerKeyboardShortcuts === 'function' ? getPlannerKeyboardShortcuts() : [];
    if (!sections.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = sections.map(function (section) {
      var rows = section.items.map(function (item) {
        return '<li class="pcs-shortcut-row"><kbd class="pcs-shortcut-keys">' + esc(item.keys) + '</kbd><span class="pcs-shortcut-label">' + esc(item.label) + '</span></li>';
      }).join('');
      return '<div class="pcs-shortcuts-group"><div class="pcs-shortcuts-group__title">' + esc(section.group) + '</div><ul class="pcs-shortcut-list">' + rows + '</ul></div>';
    }).join('');
  }

  function renderContextSidebarNav() {
    var host = document.getElementById('planner-sidebar-nav');
    if (!host || !isActive()) return;
    if (typeof NAV_CATEGORIES === 'undefined' || !NAV_CATEGORIES.length) {
      host.innerHTML = '';
      return;
    }
    var active = document.body.getAttribute('data-active-panel') || '';
    var d = plannerData();
    if (d) {
      if (!d.setup) d.setup = {};
      if (!d.setup.navDrawerOpen || typeof d.setup.navDrawerOpen !== 'object') d.setup.navDrawerOpen = {};
    }
    var setup = (d && d.setup) || { navDrawerOpen: {} };

    host.replaceChildren();
    NAV_CATEGORIES.forEach(function (cat) {
      var visiblePages = cat.pages.filter(function (p) {
        return typeof navCategoryPageVisible === 'function' ? navCategoryPageVisible(p) : true;
      });
      if (!visiblePages.length) return;

      var hasActive = visiblePages.some(function (p) {
        var pid = typeof navCategoryPageId === 'function' ? navCategoryPageId(p) : p.id;
        return pid === active || (pid === 'reflect' && active === 'reflect');
      });
      var isOpen = setup.navDrawerOpen[cat.id] === true || (setup.navDrawerOpen[cat.id] == null && hasActive);

      var section = document.createElement('div');
      section.className = 'nav-drawer-section';
      section.dataset.cat = cat.id;

      var catBtn = document.createElement('button');
      catBtn.type = 'button';
      catBtn.className = 'nav-drawer-cat';
      catBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      catBtn.setAttribute('onclick', "toggleNavDrawerCategory('" + cat.id + "')");
      catBtn.innerHTML = (cat.icon ? '<span class="material-symbols-sharp nav-drawer-cat-icon">' + cat.icon + '</span>' : '') +
        '<span class="nav-drawer-cat-text"><span class="nav-drawer-cat-label">' + esc(cat.label) + '</span>' +
        (cat.subtitle ? '<span class="nav-drawer-cat-sub">' + esc(cat.subtitle) + '</span>' : '') + '</span>' +
        '<span class="nav-drawer-cat-chevron" aria-hidden="true">▾</span>';
      section.appendChild(catBtn);

      var pagesWrap = document.createElement('div');
      pagesWrap.className = 'nav-drawer-pages';
      if (!isOpen) pagesWrap.setAttribute('hidden', '');

      visiblePages.forEach(function (p) {
        var pid = typeof navCategoryPageId === 'function' ? navCategoryPageId(p) : p.id;
        var action = typeof navCategoryPageAction === 'function' ? navCategoryPageAction(p) : ("showPanel('" + pid + "')");
        var isActivePage = pid === active || (pid === 'reflect' && active === 'reflect');
        var locked = typeof isPageSoftLocked === 'function' && isPageSoftLocked(pid);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-item' + (isActivePage ? ' active' : '') + (locked ? ' nav-item-locked' : '');
        btn.setAttribute('onclick', action);
        if (isActivePage) btn.setAttribute('aria-current', 'page');
        btn.innerHTML = '<span class="nav-item-label">' + esc(p.label) + '</span>' +
          (p.subtitle ? '<span class="nav-item-sub">' + esc(p.subtitle) + '</span>' : '');
        pagesWrap.appendChild(btn);
      });

      section.appendChild(pagesWrap);
      host.appendChild(section);
    });
  }

  function renderContextSidebar(panelId) {
    if (!isActive()) return;
    panelId = panelId || document.body.getAttribute('data-active-panel') || 'dashboard';
    renderContextSidebarPageContext(panelId);
    renderContextSidebarGlobal();
    renderContextSidebarShortcuts();
    renderContextSidebarNav();
  }

  function applyContextSidebarCollapse(collapsed, opts) {
    opts = opts || {};
    document.body.classList.toggle('context-sidebar-collapsed', !!collapsed);
    document.documentElement.classList.remove('context-sidebar-collapsed-early');
    var btn = document.getElementById('context-sidebar-collapse-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
      btn.setAttribute('aria-label', collapsed ? 'Show sidebar' : 'Hide sidebar');
      btn.setAttribute('title', collapsed ? 'Show sidebar ( [ )' : 'Hide sidebar ( [ )');
    }
    var expandTab = document.getElementById('context-sidebar-expand-tab');
    if (expandTab) {
      expandTab.hidden = !collapsed;
    }
    var d = plannerData();
    if (!opts.skipSave && d && d.setup) {
      d.setup.contextSidebarCollapsed = collapsed;
      if (typeof save === 'function') save();
    }
    if (typeof syncPlannerChromeAfterNavChange === 'function') syncPlannerChromeAfterNavChange();
  }

  function toggleContextSidebarCollapse() {
    applyContextSidebarCollapse(!document.body.classList.contains('context-sidebar-collapsed'));
  }

  function toggleContextSidebarMobile(open) {
    var on = open != null ? open : !document.body.classList.contains('context-sidebar-mobile-open');
    document.body.classList.toggle('context-sidebar-mobile-open', on);
    var scrim = document.getElementById('context-sidebar-scrim');
    if (scrim) scrim.classList.toggle('is-visible', on);
  }

  function contextSidebarHighlightGuest(idx) {
    if (typeof showPanel === 'function') showPanel('guests');
    requestAnimationFrame(function () {
      var card = document.querySelector('#guest-card-grid .hub-record-card[data-record-index="' + idx + '"]');
      if (card) {
        card.classList.add('is-sidebar-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { card.classList.remove('is-sidebar-highlight'); }, 2400);
      }
    });
  }

  function toggleContextSidebarFromButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.matchMedia('(max-width: 900px)').matches) toggleContextSidebarMobile();
    else toggleContextSidebarCollapse();
  }

  function wireContextSidebarControls() {
    var collapseBtn = document.getElementById('context-sidebar-collapse-btn');
    if (collapseBtn && !collapseBtn.dataset.bound) {
      collapseBtn.addEventListener('click', toggleContextSidebarFromButton);
      collapseBtn.dataset.bound = '1';
    }

    var expandTab = document.getElementById('context-sidebar-expand-tab');
    if (expandTab && !expandTab.dataset.bound) {
      expandTab.addEventListener('click', toggleContextSidebarFromButton);
      expandTab.dataset.bound = '1';
    }

    var mobileBtn = document.getElementById('context-sidebar-mobile-btn');
    if (mobileBtn && !mobileBtn.dataset.bound) {
      mobileBtn.addEventListener('click', toggleContextSidebarFromButton);
      mobileBtn.dataset.bound = '1';
    }

    var scrim = document.getElementById('context-sidebar-scrim');
    if (scrim && !scrim.dataset.bound) {
      scrim.addEventListener('click', function () { toggleContextSidebarMobile(false); });
      scrim.dataset.bound = '1';
    }

    var navHost = document.getElementById('planner-sidebar-nav');
    if (navHost && !navHost.dataset.bound) {
      navHost.addEventListener('click', function (e) {
        if (e.target.closest('.nav-item') && window.matchMedia('(max-width: 900px)').matches) {
          toggleContextSidebarMobile(false);
        }
      });
      navHost.dataset.bound = '1';
    }

    if (!document.body.dataset.contextSidebarKeyBound) {
      document.body.dataset.contextSidebarKeyBound = '1';
      document.addEventListener('keydown', function (e) {
        if (!isActive()) return;
        if (e.key !== '[' || e.ctrlKey || e.metaKey || e.altKey) return;
        var el = document.activeElement;
        var tag = el && el.tagName ? el.tagName : '';
        if (tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (tag === 'INPUT' && el.id !== 'context-sidebar-collapse-btn') return;
        e.preventDefault();
        toggleContextSidebarCollapse();
      });
    }
  }

  function initContextSidebar() {
    if (!document.getElementById('planner-context-sidebar')) return;
    document.body.classList.add('context-sidebar-mode');
    if (typeof closeNavMenuDrawer === 'function') closeNavMenuDrawer();
    if (typeof scheduleCategoryMenubarRender === 'function') scheduleCategoryMenubarRender();

    wireContextSidebarControls();

    var d = plannerData();
    var collapsed = !!(d && d.setup && d.setup.contextSidebarCollapsed);
    applyContextSidebarCollapse(collapsed, { skipSave: true });

    renderContextSidebar(document.body.getAttribute('data-active-panel') || 'dashboard');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireContextSidebarControls);
  } else {
    wireContextSidebarControls();
  }

  window.renderContextSidebar = renderContextSidebar;
  window.renderContextSidebarGlobal = renderContextSidebarGlobal;
  window.renderContextSidebarNav = renderContextSidebarNav;
  window.renderContextSidebarShortcuts = renderContextSidebarShortcuts;
  window.toggleContextSidebarCollapse = toggleContextSidebarCollapse;
  window.toggleContextSidebarMobile = toggleContextSidebarMobile;
  window.toggleContextSidebarFromButton = toggleContextSidebarFromButton;
  window.contextSidebarHighlightGuest = contextSidebarHighlightGuest;
  window.initContextSidebar = initContextSidebar;
})();
