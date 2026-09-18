/* Responsive · Views #41a (≤1240 tablet) · #42a (≤720 mobile) · #42b Day-of mode.
   Shell-level: rail collapse, drawer overlay/fullscreen, tab fade, mobile chrome,
   canvas read-only, day-of Now/Next/Call. Per-page card polish can follow. */
(function () {
  'use strict';

  var MQ_TABLET = '(max-width: 1240px)';
  var MQ_MOBILE = '(max-width: 720px)';
  var dayOfTimer = null;
  var offerDismissed = false;

  function body() { return document.body; }

  function isRd() {
    return body() && body().classList.contains('rd-scope');
  }

  function weddingDate() {
    try {
      var d = (typeof data !== 'undefined' && data && data.setup) ? data.setup.date : '';
      return String(d || '').slice(0, 10);
    } catch (e) { return ''; }
  }

  function isWeddingToday() {
    var wd = weddingDate();
    if (!wd) return false;
    var today = new Date();
    var iso = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return wd === iso;
  }

  function heldCount() {
    try {
      if (typeof window.offlineHeldCount === 'function') return window.offlineHeldCount() || 0;
      if (typeof data !== 'undefined' && data && Array.isArray(data.offlineQueue)) return data.offlineQueue.length;
    } catch (e) { /* soft */ }
    return 0;
  }

  function timelineRows() {
    var rows = [];
    try {
      if (typeof data !== 'undefined' && data) {
        if (Array.isArray(data.wdayTimeline) && data.wdayTimeline.length) rows = data.wdayTimeline.slice();
        else if (Array.isArray(data.timeline)) rows = data.timeline.slice();
      }
    } catch (e) { rows = []; }
    return rows.map(function (r, i) {
      return {
        index: i,
        row: r,
        time: String(r.time || r.start || r.when || '').slice(0, 5),
        title: String(r.event || r.title || r.name || 'Untitled').trim() || 'Untitled',
        meta: String(r.who || r.owner || r.notes || r.location || '').trim(),
        done: !!(r.done || r.status === 'Done' || r.status === 'Complete'),
        minutes: parseInt(r.duration || r.mins || r.length || 0, 10) || 0
      };
    }).filter(function (x) { return x.time || x.title; })
      .sort(function (a, b) { return String(a.time).localeCompare(String(b.time)); });
  }

  function parseMinutes(t) {
    var m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function nowLabel() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function callTargets() {
    var out = [];
    try {
      var contacts = (typeof data !== 'undefined' && data && Array.isArray(data.contacts)) ? data.contacts : [];
      contacts.forEach(function (c) {
        var role = String(c.role || c.type || c.category || '').toLowerCase();
        var phone = String(c.phone || c.mobile || '').trim();
        if (!phone) return;
        if (/planner|coordinator|venue|cater/.test(role) || out.length < 3) {
          out.push({
            name: String(c.name || c.fullName || 'Contact'),
            role: String(c.role || c.type || c.category || 'Contact'),
            phone: phone
          });
        }
      });
      var vendors = (typeof data !== 'undefined' && data && Array.isArray(data.vendors)) ? data.vendors : [];
      vendors.forEach(function (v) {
        var phone = String(v.phone || v.mobile || '').trim();
        if (!phone) return;
        out.push({
          name: String(v.name || v.vendor || 'Vendor'),
          role: String(v.type || v.category || 'Vendor'),
          phone: phone
        });
      });
    } catch (e) { /* soft */ }
    var seen = {};
    return out.filter(function (x) {
      if (seen[x.phone]) return false;
      seen[x.phone] = true;
      return true;
    }).slice(0, 3);
  }

  /* ── breakpoint classes ──────────────────────────────────────────────── */

  function syncBreakpoint() {
    if (!isRd()) return;
    var tablet = window.matchMedia(MQ_TABLET).matches;
    var mobile = window.matchMedia(MQ_MOBILE).matches;
    body().classList.toggle('rd-bp-tablet', tablet && !mobile);
    body().classList.toggle('rd-bp-mobile', mobile);
    body().classList.toggle('rd-bp-narrow', tablet);

    /* Suppress legacy Phase-C chrome under redesign breakpoints */
    var legacyNav = document.getElementById('ux-mobile-bottom-nav');
    var legacyRail = document.getElementById('ux-tablet-rail');
    var legacyFab = document.getElementById('ux-mobile-fab');
    if (legacyNav) legacyNav.hidden = true;
    if (legacyRail) legacyRail.hidden = true;
    if (legacyFab) legacyFab.hidden = true;

    if (mobile) {
      ensureMobileChrome();
      updateMobileChrome();
      closeRailOverlay();
    } else {
      hideMobileChrome();
      if (tablet) ensureIconRail();
      else teardownIconRail();
    }

    demoteFifthStat();
    markCanvasReadonly(mobile);
    syncDayOfOffer();
    if (body().classList.contains('rd-dayof')) renderDayOf();
  }

  /* ── 41a · icon rail ─────────────────────────────────────────────────── */

  function ensureIconRail() {
    var aside = document.getElementById('planner-context-sidebar');
    if (!aside) return;
    aside.classList.add('rd-rail--icons');
    var strip = document.getElementById('rd-rail-icon-strip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'rd-rail-icon-strip';
      strip.className = 'rd-rail-icon-strip';
      strip.setAttribute('aria-label', 'Page rail');
      aside.insertBefore(strip, aside.firstChild);
    }
    var items = aside.querySelectorAll('#planner-sidebar-context .rd-rail__item');
    var html = '<button type="button" class="rd-rail-icon-strip__btn" data-rd-rail-menu aria-label="Open rail">☰</button>';
    var n = 0;
    items.forEach(function (btn, i) {
      if (n >= 4) return;
      if (btn.classList.contains('rd-rail__item--source')) return;
      var active = btn.classList.contains('is-active');
      html += '<button type="button" class="rd-rail-icon-strip__btn' + (active ? ' is-active' : '') +
        '" data-rd-rail-icon="' + i + '" aria-label="' + (btn.textContent || 'View').trim().replace(/"/g, '') + '">◉</button>';
      n++;
    });
    strip.innerHTML = html;
    strip.onclick = function (e) {
      var t = e.target.closest('[data-rd-rail-menu], [data-rd-rail-icon]');
      if (!t) return;
      if (t.hasAttribute('data-rd-rail-menu')) {
        toggleRailOverlay();
        return;
      }
      var idx = parseInt(t.getAttribute('data-rd-rail-icon'), 10);
      var list = aside.querySelectorAll('#planner-sidebar-context .rd-rail__item');
      if (list[idx]) {
        list[idx].click();
        openRailOverlay();
      }
    };
  }

  function teardownIconRail() {
    var aside = document.getElementById('planner-context-sidebar');
    if (aside) aside.classList.remove('rd-rail--icons', 'is-rail-overlay');
    var strip = document.getElementById('rd-rail-icon-strip');
    if (strip) strip.remove();
    closeRailOverlay();
  }

  function openRailOverlay() {
    var aside = document.getElementById('planner-context-sidebar');
    if (!aside) return;
    aside.classList.add('is-rail-overlay');
    body().classList.add('rd-rail-overlay-open');
    ensureRailScrim();
  }
  function closeRailOverlay() {
    var aside = document.getElementById('planner-context-sidebar');
    if (aside) aside.classList.remove('is-rail-overlay');
    body().classList.remove('rd-rail-overlay-open');
    var scrim = document.getElementById('rd-rail-scrim');
    if (scrim) scrim.hidden = true;
  }
  function toggleRailOverlay() {
    var aside = document.getElementById('planner-context-sidebar');
    if (aside && aside.classList.contains('is-rail-overlay')) closeRailOverlay();
    else openRailOverlay();
  }
  function ensureRailScrim() {
    var scrim = document.getElementById('rd-rail-scrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.id = 'rd-rail-scrim';
      scrim.className = 'rd-rail-scrim';
      scrim.addEventListener('click', closeRailOverlay);
      document.body.appendChild(scrim);
    }
    scrim.hidden = false;
  }

  /* ── stats demote (5th → toolbar chip) ───────────────────────────────── */

  function demoteFifthStat() {
    var narrow = body().classList.contains('rd-bp-narrow');
    document.querySelectorAll('.panel.active .rd-stats, .panel.active .m-stats').forEach(function (strip) {
      var cells = strip.querySelectorAll(':scope > .m-stat, :scope > .rd-stat');
      if (cells.length < 5) return;
      var fifth = cells[4];
      var panel = strip.closest('.panel');
      var host = panel && panel.querySelector('.rd-toolbar, .rd-pagehead__actions');
      var chipId = 'rd-stat-overflow-chip';
      var existing = panel && panel.querySelector('#' + chipId);
      if (!narrow) {
        fifth.hidden = false;
        if (existing) existing.remove();
        return;
      }
      fifth.hidden = true;
      var label = (fifth.querySelector('.m-stat-label, .rd-stat__label') || {}).textContent || 'Stat';
      var value = (fifth.querySelector('.m-stat-val, .rd-stat__value') || {}).textContent || '';
      var text = (label + ' · ' + value).replace(/\s+/g, ' ').trim();
      if (!host) return;
      if (!existing) {
        existing = document.createElement('button');
        existing.type = 'button';
        existing.id = chipId;
        existing.className = 'rd-chip rd-stat-overflow-chip';
        host.appendChild(existing);
      }
      existing.textContent = text;
    });
  }

  /* ── 42a · mobile chrome ─────────────────────────────────────────────── */

  function ensureMobileChrome() {
    var nav = document.getElementById('rd-mobile-tabbar');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'rd-mobile-tabbar';
      nav.className = 'rd-mobile-tabbar';
      nav.setAttribute('aria-label', 'Mobile destinations');
      document.body.appendChild(nav);
    }
    var fab = document.getElementById('rd-mobile-fab');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'rd-mobile-fab';
      fab.type = 'button';
      fab.className = 'rd-mobile-fab';
      fab.setAttribute('aria-label', 'Primary action');
      fab.textContent = '＋';
      document.body.appendChild(fab);
    }
    var sheet = document.getElementById('rd-mobile-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'rd-mobile-sheet';
      sheet.className = 'rd-mobile-sheet';
      sheet.hidden = true;
      sheet.innerHTML =
        '<div class="rd-mobile-sheet__scrim" data-rd-sheet-close></div>' +
        '<div class="rd-mobile-sheet__panel" role="dialog" aria-label="Navigation">' +
        '<div class="rd-mobile-sheet__handle"></div>' +
        '<div class="rd-mobile-sheet__title">Pages</div>' +
        '<div class="rd-mobile-sheet__list" id="rd-mobile-sheet-list"></div>' +
        '</div>';
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('[data-rd-sheet-close]')) closeMobileSheet();
      });
      document.body.appendChild(sheet);
    }
  }

  function hideMobileChrome() {
    ['rd-mobile-tabbar', 'rd-mobile-fab', 'rd-mobile-sheet'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        if (id === 'rd-mobile-sheet') el.hidden = true;
        else el.hidden = true;
      }
    });
    body().classList.remove('rd-mobile-sheet-open');
  }

  function updateMobileChrome() {
    var nav = document.getElementById('rd-mobile-tabbar');
    var fab = document.getElementById('rd-mobile-fab');
    if (!nav || !fab) return;
    nav.hidden = false;
    fab.hidden = false;
    var active = body().getAttribute('data-active-panel') || 'guests';
    var items = [
      { id: 'guests', label: 'Guests', panel: 'guests' },
      { id: 'budget', label: 'Money', panel: 'budget' },
      { id: 'timeline', label: 'Day', panel: 'timeline' },
      { id: 'more', label: 'More', action: 'sheet' }
    ];
    nav.innerHTML = items.map(function (it) {
      var on = it.panel === active || (it.id === 'more' && false);
      return '<button type="button" class="rd-mobile-tabbar__item' + (on ? ' is-active' : '') +
        '" data-rd-mob="' + it.id + '">' + it.label + '</button>';
    }).join('');
    nav.onclick = function (e) {
      var btn = e.target.closest('[data-rd-mob]');
      if (!btn) return;
      var id = btn.getAttribute('data-rd-mob');
      if (id === 'more') { openMobileSheet(); return; }
      var map = { guests: 'guests', budget: 'budget', timeline: 'timeline' };
      if (typeof showPanel === 'function') showPanel(map[id] || id);
      closeMobileSheet();
    };

    /* FAB — reuse legacy panel fab map when present */
    var cfg = (typeof UX_PANEL_FAB !== 'undefined' && UX_PANEL_FAB[active]) ? UX_PANEL_FAB[active] : null;
    if (cfg && cfg.fn) {
      fab.onclick = function () {
        try { (new Function(cfg.fn))(); } catch (err) { console.warn('[rd FAB]', err); }
      };
      fab.title = cfg.title || 'Add';
      fab.hidden = false;
    } else {
      fab.onclick = function () {
        if (typeof showPanel === 'function') showPanel(active);
      };
    }
  }

  function openMobileSheet() {
    ensureMobileChrome();
    var sheet = document.getElementById('rd-mobile-sheet');
    var list = document.getElementById('rd-mobile-sheet-list');
    if (!sheet || !list) return;
    var railItems = document.querySelectorAll('#planner-sidebar-context .rd-rail__item');
    var html = '';
    if (railItems.length) {
      var cat = document.querySelector('.rd-tab.is-active, .rd-tabs .is-active');
      html += '<div class="rd-mobile-sheet__kicker">' +
        ((cat && cat.textContent) || 'This page') + '</div>';
      railItems.forEach(function (btn) {
        var countEl = btn.querySelector('.rd-rail__count');
        var label = btn.childNodes[0] ? (btn.childNodes[0].textContent || btn.textContent) : btn.textContent;
        label = String(label || '').replace(/\s+/g, ' ').trim();
        var count = countEl ? countEl.textContent.trim() : '';
        html += '<button type="button" class="rd-mobile-sheet__row' +
          (btn.classList.contains('is-active') ? ' is-active' : '') +
          '" data-rd-sheet-rail>' +
          '<span><strong>' + escapeHtmlLite(label) + '</strong>' +
          (count ? '<em>' + escapeHtmlLite(count) + '</em>' : '') +
          '</span><span aria-hidden="true">›</span></button>';
      });
      list.innerHTML = html;
      list.querySelectorAll('[data-rd-sheet-rail]').forEach(function (row, i) {
        row.addEventListener('click', function () {
          if (railItems[i]) railItems[i].click();
          closeMobileSheet();
        });
      });
    } else if (typeof TABS !== 'undefined' || window.CovenantShell) {
      /* Fall back to category pages from shell TABS if exposed */
      html = '<div class="rd-mobile-sheet__kicker">Go to</div>';
      ['guests', 'budget', 'timeline', 'tasks', 'vendors', 'notes', 'dashboard'].forEach(function (pid) {
        html += '<button type="button" class="rd-mobile-sheet__row" data-panel="' + pid + '">' +
          '<span><strong>' + pid + '</strong></span><span>›</span></button>';
      });
      list.innerHTML = html;
      list.querySelectorAll('[data-panel]').forEach(function (row) {
        row.addEventListener('click', function () {
          if (typeof showPanel === 'function') showPanel(row.getAttribute('data-panel'));
          closeMobileSheet();
        });
      });
    }
    sheet.hidden = false;
    body().classList.add('rd-mobile-sheet-open');
  }

  function closeMobileSheet() {
    var sheet = document.getElementById('rd-mobile-sheet');
    if (sheet) sheet.hidden = true;
    body().classList.remove('rd-mobile-sheet-open');
  }

  function escapeHtmlLite(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ── canvas read-only below 720 ──────────────────────────────────────── */

  function markCanvasReadonly(mobile) {
    ['tables', 'mood'].forEach(function (id) {
      var panel = document.getElementById('panel-' + id);
      if (!panel) return;
      panel.classList.toggle('rd-canvas-readonly', !!mobile);
      var banner = panel.querySelector('.rd-canvas-readonly-banner');
      if (mobile && !banner) {
        banner = document.createElement('div');
        banner.className = 'rd-canvas-readonly-banner';
        banner.innerHTML = '<strong>Read-only on this screen</strong><span>Open on a larger display to arrange the plan.</span>';
        panel.insertBefore(banner, panel.firstChild);
      }
      if (!mobile && banner) banner.remove();
    });
  }

  /* ── 42b · Day-of mode ───────────────────────────────────────────────── */

  function ensureDayOfHost() {
    var host = document.getElementById('rd-dayof');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'rd-dayof';
    host.className = 'rd-dayof';
    host.hidden = true;
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-label', 'Day-of mode');
    document.body.appendChild(host);
    return host;
  }

  function enterDayOf() {
    body().classList.add('rd-dayof');
    var host = ensureDayOfHost();
    host.hidden = false;
    if (typeof closeProfileDrawer === 'function') closeProfileDrawer();
    hideDayOfOffer();
    renderDayOf();
    if (dayOfTimer) clearInterval(dayOfTimer);
    dayOfTimer = setInterval(renderDayOf, 30000);
  }

  function exitDayOf() {
    body().classList.remove('rd-dayof');
    var host = document.getElementById('rd-dayof');
    if (host) host.hidden = true;
    if (dayOfTimer) { clearInterval(dayOfTimer); dayOfTimer = null; }
  }

  function toggleDayOf() {
    if (body().classList.contains('rd-dayof')) exitDayOf();
    else enterDayOf();
  }

  function markTimelineDone(index) {
    try {
      var rows = (data.wdayTimeline && data.wdayTimeline.length) ? data.wdayTimeline : data.timeline;
      if (!rows || !rows[index]) return;
      rows[index].done = true;
      rows[index].status = 'Done';
      if (typeof save === 'function') save();
      renderDayOf();
    } catch (e) { console.warn('[day-of]', e); }
  }

  function renderDayOf() {
    var host = ensureDayOfHost();
    if (!body().classList.contains('rd-dayof')) return;
    var rows = timelineRows();
    var nowMin = parseMinutes(nowLabel());
    var current = null;
    var next = [];
    rows.forEach(function (r) {
      if (r.done) return;
      var m = parseMinutes(r.time);
      if (m == null) {
        if (!current) current = r;
        else next.push(r);
        return;
      }
      if (nowMin != null && m <= nowMin) current = r;
      else next.push(r);
    });
    if (!current && rows.length) current = rows.find(function (r) { return !r.done; }) || rows[0];
    next = next.filter(function (r) { return !current || r.index !== current.index; }).slice(0, 3);

    var ends = '';
    if (current && current.minutes && current.time) {
      var sm = parseMinutes(current.time);
      if (sm != null) {
        var em = sm + current.minutes;
        ends = ' · ends ' + String(Math.floor(em / 60)).padStart(2, '0') + ':' + String(em % 60).padStart(2, '0');
      }
    }

    var held = heldCount();
    var offline = !navigator.onLine;
    var statusBits = [];
    if (offline) statusBits.push('offline');
    if (held) statusBits.push(held + ' held');
    if (!statusBits.length) statusBits.push('live');

    var calls = callTargets();
    var callHtml = calls.length ? calls.map(function (c) {
      return '<a class="rd-dayof__call" href="tel:' + escapeHtmlLite(c.phone) + '">' +
        '<div><div class="rd-dayof__call-name">' + escapeHtmlLite(c.name) + '</div>' +
        '<div class="rd-dayof__call-role">' + escapeHtmlLite(c.role) + '</div></div>' +
        '<span>Call</span></a>';
    }).join('') : '<p class="rd-dayof__empty">Add planner or vendor phone numbers to call from here.</p>';

    host.innerHTML =
      '<div class="rd-dayof__bar">' +
      '<span class="rd-dayof__dot" aria-hidden="true"></span>' +
      '<span class="rd-dayof__mode">Day-of mode</span>' +
      '<span class="rd-dayof__status">' + escapeHtmlLite(statusBits.join(' · ')) + '</span>' +
      '<button type="button" class="rd-dayof__exit" onclick="rdExitDayOf()">Exit</button>' +
      '</div>' +
      '<div class="rd-dayof__now">' +
      '<div class="rd-dayof__kicker">Now · ' + escapeHtmlLite(nowLabel()) + '</div>' +
      '<div class="rd-dayof__title">' + escapeHtmlLite(current ? current.title : 'Nothing scheduled yet') + '</div>' +
      '<div class="rd-dayof__meta">' + escapeHtmlLite(
        current
          ? ((current.meta || 'On the timeline') + (current.minutes ? (' · ' + current.minutes + ' minutes') : '') + ends)
          : 'Open Wedding Day Timeline to load cues'
      ) + '</div>' +
      (current ? '<button type="button" class="rd-dayof__done" onclick="rdDayOfMarkDone(' + current.index + ')">Mark done</button>' : '') +
      '</div>' +
      '<div class="rd-dayof__next">' +
      '<div class="rd-dayof__kicker">Next</div>' +
      (next.length ? next.map(function (r) {
        return '<div class="rd-dayof__next-row">' +
          '<span class="rd-dayof__time">' + escapeHtmlLite(r.time || '—') + '</span>' +
          '<div><div class="rd-dayof__next-title">' + escapeHtmlLite(r.title) + '</div>' +
          (r.meta ? '<div class="rd-dayof__next-meta">' + escapeHtmlLite(r.meta) + '</div>' : '') +
          '</div></div>';
      }).join('') : '<p class="rd-dayof__empty">No upcoming cues.</p>') +
      '</div>' +
      '<div class="rd-dayof__calls">' +
      '<div class="rd-dayof__kicker">One tap to call</div>' +
      callHtml +
      '</div>';
  }

  function syncDayOfOffer() {
    if (!isRd() || offerDismissed || body().classList.contains('rd-dayof')) {
      hideDayOfOffer();
      return;
    }
    if (!isWeddingToday()) {
      hideDayOfOffer();
      return;
    }
    var bar = document.querySelector('.rd-topbar');
    if (!bar) return;
    var chip = document.getElementById('rd-dayof-offer');
    if (!chip) {
      chip = document.createElement('button');
      chip.type = 'button';
      chip.id = 'rd-dayof-offer';
      chip.className = 'rd-dayof-offer';
      chip.innerHTML = 'Enter Day-of mode <span aria-hidden="true">✕</span>';
      chip.addEventListener('click', function (e) {
        if (e.target.tagName === 'SPAN') {
          offerDismissed = true;
          hideDayOfOffer();
          return;
        }
        enterDayOf();
      });
      var right = bar.querySelector('.rd-topbar__right');
      if (right) bar.insertBefore(chip, right);
      else bar.appendChild(chip);
    }
    chip.hidden = false;
  }

  function hideDayOfOffer() {
    var chip = document.getElementById('rd-dayof-offer');
    if (chip) chip.hidden = true;
  }

  function injectProfileDayOf() {
    var sec = document.querySelector('#profile-drawer .pd-sec .pd-sec-head');
    if (!sec) return;
    var section = sec.closest('.pd-sec');
    if (!section || section.querySelector('[data-rd-dayof-enter]')) return;
    var row = document.createElement('div');
    row.className = 'pd-toggle-row';
    row.innerHTML =
      '<span class="pd-tr-icon" aria-hidden="true">◉</span>' +
      '<div class="pd-tr-text"><strong>Day-of mode</strong><span>Dark, large, read-only cues for the corridor.</span></div>' +
      '<button type="button" class="btn btn-forest btn-sm" data-rd-dayof-enter>Enter</button>';
    row.querySelector('[data-rd-dayof-enter]').addEventListener('click', function () {
      enterDayOf();
    });
    section.appendChild(row);
  }

  /* ── public + boot ───────────────────────────────────────────────────── */

  window.rdEnterDayOf = enterDayOf;
  window.rdExitDayOf = exitDayOf;
  window.rdToggleDayOf = toggleDayOf;
  window.rdDayOfMarkDone = markTimelineDone;
  window.rdOpenRailOverlay = openRailOverlay;
  window.rdCloseRailOverlay = closeRailOverlay;
  window.rdOpenMobileSheet = openMobileSheet;
  window.rdCloseMobileSheet = closeMobileSheet;
  window.rdSyncResponsive = syncBreakpoint;

  function boot() {
    if (!isRd()) {
      /* Wait for redesign shell to add rd-scope */
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (isRd() || tries > 40) {
          clearInterval(t);
          if (isRd()) boot();
        }
      }, 100);
      return;
    }
    injectProfileDayOf();
    syncBreakpoint();
    window.addEventListener('resize', function () {
      window.clearTimeout(window.__rdBpTimer);
      window.__rdBpTimer = window.setTimeout(syncBreakpoint, 80);
    });
    if (window.matchMedia) {
      try {
        window.matchMedia(MQ_TABLET).addEventListener('change', syncBreakpoint);
        window.matchMedia(MQ_MOBILE).addEventListener('change', syncBreakpoint);
      } catch (e) {
        window.matchMedia(MQ_TABLET).addListener(syncBreakpoint);
        window.matchMedia(MQ_MOBILE).addListener(syncBreakpoint);
      }
    }
    var _show = window.showPanel;
    if (typeof _show === 'function' && !_show.__rdResponsiveWrapped) {
      window.showPanel = function (id, forceOpen) {
        var out = _show.call(window, id, forceOpen);
        setTimeout(syncBreakpoint, 0);
        return out;
      };
      window.showPanel.__rdResponsiveWrapped = true;
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (body().classList.contains('rd-dayof')) exitDayOf();
        closeRailOverlay();
        closeMobileSheet();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
