/* Profile & Display + Theme Builder — Master s39 · 49a · 49b (+ night variants)
   Rebuilds #profile-drawer chrome to match Master 49a / 49a-n at 460px:
   forest header, gold subtitle, flat ivory body, two-up category cards,
   segmented planning view, mock-style select rows, square toggles, footer note. */
(function () {
  'use strict';

  var VER = 'pd-rd-49a2';
  var CHEVRON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  var PLANNING_VIEWS = [
    ['essentials', 'Essentials'],
    ['standard', 'Standard'],
    ['full', 'Full']
  ];

  /* Mock 49a category labels mapped to live template ids */
  var MOCK_CATS = [
    { id: 'classic', name: 'Faith-centred', desc: 'Ceremony, counselling, prayer' },
    { id: 'garden-romantic', name: 'Classic formal', desc: 'Full vendor and budget set' },
    { id: 'backyard', name: 'Garden intimate', desc: 'Smaller guest and table set' },
    { id: 'no-preset', name: 'No Preset', desc: 'Start with empty tables' }
  ];

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s);
  }

  function currentStyleTemplate() {
    try {
      if (typeof data !== 'undefined' && data.setup) {
        return data.setup.styleTemplate || 'no-preset';
      }
    } catch (e) { /* ignore */ }
    return 'no-preset';
  }

  /* ── Header (49a — no eyebrow; title + gold sub + boxed ×) ─────────────── */

  function fixProfileHeader(drawer) {
    var head = drawer.querySelector('.profile-drawer-head');
    if (!head) return;

    head.querySelector('.rd-pd__eyebrow')?.remove();

    var closeBtn = head.querySelector('.profile-drawer-close');
    if (closeBtn) closeBtn.classList.add('rd-pd__x');

    if (!head.classList.contains('rd-pd__head')) {
      head.classList.add('rd-pd__head');
      var titleWrap = head.querySelector(':scope > div');
      if (titleWrap) titleWrap.classList.add('rd-pd__head-copy');
    }
  }

  /* ── Footer note ─────────────────────────────────────────────────────── */

  function ensureFooter(drawer) {
    if (drawer.querySelector('.rd-pd__save-note')) return;
    var body = drawer.querySelector('.profile-drawer-body');
    if (!body) return;
    var foot = document.createElement('div');
    foot.className = 'rd-pd__save-note';
    foot.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>' +
      '<span>Every change here saves to this device only, the moment you make it.</span>';
    body.appendChild(foot);
  }

  /* ── Hide extras not drawn in 49a ────────────────────────────────────── */

  function hideNonMockExtras(drawer) {
    drawer.querySelector('.rd-roles-block')?.setAttribute('hidden', '');
    drawer.querySelectorAll('.pd-toggle-row').forEach(function (row) {
      if (row.querySelector('[onclick*="rdEnterDayOf"]')) row.setAttribute('hidden', '');
    });
  }

  /* ── Planning view segmented control ─────────────────────────────────── */

  function ensurePlanningSeg() {
    var field = document.querySelector('#profile-drawer .pd-field:has(#planning-view-select)');
    if (!field) {
      var sel = document.getElementById('planning-view-select');
      field = sel ? sel.closest('.pd-field') : null;
    }
    if (!field) return;

    var select = document.getElementById('planning-view-select');
    if (!select) return;

    select.classList.add('rd-pd-native-hide');

    var seg = field.querySelector('.rd-pd-planning-seg');
    if (!seg) {
      seg = document.createElement('div');
      seg.className = 'rd-pd-planning-seg rd-seg';
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Planning view');
      seg.innerHTML = PLANNING_VIEWS.map(function (pair) {
        return '<button type="button" class="rd-seg__opt" data-planning-view="' + pair[0] + '">' + esc(pair[1]) + '</button>';
      }).join('');
      field.appendChild(seg);
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-planning-view]');
        if (!btn) return;
        var v = btn.getAttribute('data-planning-view');
        if (select.value !== v) {
          select.value = v;
          if (typeof applyPlanningView === 'function') applyPlanningView(v);
          else select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncPlanningSeg();
      });
    }
    syncPlanningSeg();
  }

  function syncPlanningSeg() {
    var select = document.getElementById('planning-view-select');
    if (!select) return;
    var v = select.value || 'standard';
    document.querySelectorAll('#profile-drawer .rd-pd-planning-seg .rd-seg__opt').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-planning-view') === v);
    });
  }

  /* ── Select rows (profile, focus preset) ─────────────────────────────── */

  function ensureSelectRow(selectId, metaFn) {
    var select = document.getElementById(selectId);
    if (!select) return;
    var field = select.closest('.pd-field');
    if (!field || field.querySelector('.rd-pd-select-row')) return;

    select.classList.add('rd-pd-native-hide');

    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'rd-pd-select-row';
    row.setAttribute('aria-haspopup', 'listbox');
    row.innerHTML =
      '<span class="rd-pd-select-row__val"></span>' +
      '<span class="rd-pd-select-row__meta"></span>' +
      '<span class="rd-pd-select-row__chev">' + CHEVRON + '</span>';

    field.appendChild(row);

    row.addEventListener('click', function () {
      select.focus();
      try {
        if (typeof select.showPicker === 'function') select.showPicker();
        else select.click();
      } catch (e) {
        select.click();
      }
    });

    select.addEventListener('change', function () { syncSelectRow(selectId, metaFn); });
    syncSelectRow(selectId, metaFn);
  }

  function syncSelectRow(selectId, metaFn) {
    var select = document.getElementById(selectId);
    if (!select) return;
    var field = select.closest('.pd-field');
    if (!field) return;
    var val = field.querySelector('.rd-pd-select-row__val');
    var meta = field.querySelector('.rd-pd-select-row__meta');
    if (val) {
      var opt = select.options[select.selectedIndex];
      val.textContent = opt ? opt.textContent : '';
    }
    if (meta && metaFn) meta.textContent = metaFn(select);
  }

  function syncProfileSelectRow() {
    ensureSelectRow('profile-select', function (sel) {
      var n = sel.options ? sel.options.length : 0;
      return n ? (n + ' profile' + (n === 1 ? '' : 's')) : '';
    });
  }

  function syncFocusSelectRow() {
    ensureSelectRow('focus-preset-select', function (sel) {
      var n = sel.options ? sel.options.length : 0;
      return n ? (n + ' preset' + (n === 1 ? '' : 's')) : '';
    });
  }

  /* ── Font picker meta ("8 available") ────────────────────────────────── */

  function ensureFontMeta() {
    var picker = document.getElementById('font-picker');
    if (!picker) return;
    var btn = picker.querySelector('.font-picker-btn');
    if (!btn || btn.querySelector('.rd-pd-font-meta')) return;
    var select = document.getElementById('font-select');
    var n = select && select.options ? select.options.length : 0;
    var meta = document.createElement('span');
    meta.className = 'rd-pd-font-meta';
    meta.textContent = n ? (n + ' available') : '';
    var chev = btn.querySelector('.font-picker-chevron');
    if (chev) btn.insertBefore(meta, chev);
    else btn.appendChild(meta);
  }

  function polishPickers() {
    var themePicker = document.getElementById('theme-picker');
    if (themePicker) {
      themePicker.classList.add('rd-pd-theme-picker');
      var tchev = themePicker.querySelector('.theme-picker-chevron');
      if (tchev && !tchev.innerHTML.trim()) tchev.innerHTML = CHEVRON;
    }
    var fontPicker = document.getElementById('font-picker');
    if (fontPicker) {
      fontPicker.classList.add('rd-pd-font-picker');
      var fchev = fontPicker.querySelector('.font-picker-chevron');
      if (fchev && fchev.textContent === '⌄') fchev.innerHTML = CHEVRON;
    }
    ensureFontMeta();
  }

  /* ── Category cards (flat 2-up grid, mock labels) ────────────────────── */

  function renderCategoryCards() {
    var host = document.getElementById('profile-templates-gallery');
    if (!host || !document.body.classList.contains('rd-scope')) return;

    var active = currentStyleTemplate();
    var grid = host.querySelector('.rd-pd-cat-grid');
    if (!grid) {
      host.innerHTML = '';
      grid = document.createElement('div');
      grid.className = 'rd-pd-cat-grid';
      host.appendChild(grid);
    }

    grid.innerHTML = MOCK_CATS.map(function (cat) {
      var on = active === cat.id;
      return '<button type="button" class="rd-pd-cat-card' + (on ? ' is-active' : '') + '" data-template-id="' + esc(cat.id) + '">' +
        '<span class="rd-pd-cat-card__top">' +
          '<span class="rd-pd-cat-card__check" aria-hidden="true">' + (on ? '&#10003;' : '') + '</span>' +
          '<span class="rd-pd-cat-card__name">' + esc(cat.name) + '</span>' +
        '</span>' +
        '<span class="rd-pd-cat-card__desc">' + esc(cat.desc) + '</span>' +
      '</button>';
    }).join('');

    if (!grid.dataset.bound) {
      grid.dataset.bound = '1';
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-template-id]');
        if (!card) return;
        var id = card.getAttribute('data-template-id');
        if (typeof applyStyleTemplate === 'function') {
          applyStyleTemplate(id).then(function () { renderCategoryCards(); }).catch(function () { renderCategoryCards(); });
        }
      });
    }
  }

  /* ── Apply all 49a chrome ────────────────────────────────────────────── */

  function applyProfileDrawerRd() {
    if (!document.body.classList.contains('rd-scope')) return;

    var drawer = document.getElementById('profile-drawer');
    if (!drawer) return;

    var fresh = drawer.dataset.pdRd !== VER;
    drawer.dataset.pdRd = VER;
    drawer.classList.add('rd-profile-drawer');

    fixProfileHeader(drawer);
    hideNonMockExtras(drawer);
    ensureFooter(drawer);
    ensurePlanningSeg();
    syncProfileSelectRow();
    syncFocusSelectRow();
    polishPickers();
    renderCategoryCards();

    if (fresh) syncPlanningSeg();
  }

  function hookProfileOpen() {
    var origOpen = window.openProfileDrawer;
    if (typeof origOpen === 'function' && !origOpen._pdRdHooked) {
      window.openProfileDrawer = function () {
        applyProfileDrawerRd();
        return origOpen.apply(this, arguments);
      };
      window.openProfileDrawer._pdRdHooked = true;
    }

    var origToggle = window.toggleProfileDrawer;
    if (typeof origToggle === 'function' && !origToggle._pdRdHooked) {
      window.toggleProfileDrawer = function () {
        var wasOpen = document.getElementById('profile-drawer')?.classList.contains('open');
        var out = origToggle.apply(this, arguments);
        if (!wasOpen) applyProfileDrawerRd();
        return out;
      };
      window.toggleProfileDrawer._pdRdHooked = true;
    }
  }

  function hookTemplateGallery() {
    if (typeof renderTemplatesGalleryHosts !== 'function') return;
    var orig = window.renderTemplatesGalleryHosts;
    if (orig._pdRdHooked) return;
    window.renderTemplatesGalleryHosts = function () {
      var out = orig.apply(this, arguments);
      applyProfileDrawerRd();
      return out;
    };
    window.renderTemplatesGalleryHosts._pdRdHooked = true;
  }

  function hookProfileSwitch() {
    if (typeof switchProfile !== 'function' || switchProfile._pdRdHooked) return;
    var orig = window.switchProfile;
    window.switchProfile = function () {
      var out = orig.apply(this, arguments);
      syncSelectRow('profile-select', function (sel) {
        var n = sel.options ? sel.options.length : 0;
        return n ? (n + ' profile' + (n === 1 ? '' : 's')) : '';
      });
      return out;
    };
    window.switchProfile._pdRdHooked = true;
  }

  function hookThemeFontSync() {
    if (typeof saveAppearance === 'function' && !saveAppearance._pdRdHooked) {
      var origA = window.saveAppearance;
      window.saveAppearance = function () {
        var out = origA.apply(this, arguments);
        polishPickers();
        return out;
      };
      window.saveAppearance._pdRdHooked = true;
    }
    if (typeof renderThemePicker === 'function' && !renderThemePicker._pdRdHooked) {
      var origT = window.renderThemePicker;
      window.renderThemePicker = function () {
        var out = origT.apply(this, arguments);
        polishPickers();
        return out;
      };
      window.renderThemePicker._pdRdHooked = true;
    }
    if (typeof renderFontPicker === 'function' && !renderFontPicker._pdRdHooked) {
      var origF = window.renderFontPicker;
      window.renderFontPicker = function () {
        var out = origF.apply(this, arguments);
        polishPickers();
        return out;
      };
      window.renderFontPicker._pdRdHooked = true;
    }
  }

  /* ── Theme builder (49b) ──────────────────────────────────────────────── */

  function enhanceThemePreview() {
    var wrap = document.getElementById('tb-preview');
    if (!wrap || wrap.dataset.rdTb === VER) return;
    var orig = window.renderThemeBuilderPreview;
    if (typeof orig !== 'function') return;
    window.renderThemeBuilderPreview = function () {
      orig.apply(this, arguments);
      var w = document.getElementById('tb-preview');
      if (!w) return;
      var card = w.querySelector('.tb-prev-card');
      if (!card) return;
      w.dataset.rdTb = VER;
      w.classList.add('rd-tb-preview');
      if (!w.querySelector('.rd-tb-preview__label')) {
        var lab = document.createElement('div');
        lab.className = 'rd-tb-preview__label';
        lab.textContent = 'Live preview';
        w.insertBefore(lab, w.firstChild);
      }
      if (!card.querySelector('.rd-tb-preview__btn')) {
        var btnRow = document.createElement('div');
        btnRow.className = 'rd-tb-preview__btns';
        btnRow.innerHTML =
          '<span class="rd-tb-preview__btn rd-tb-preview__btn--primary">Primary button</span>' +
          '<span class="rd-tb-preview__btn">Secondary</span>' +
          '<span class="rd-tb-preview__chip">Confirmed</span>';
        card.appendChild(btnRow);
      }
    };
    window.renderThemeBuilderPreview._pdRdHooked = true;
  }

  function applyThemeBuilderRd() {
    var ov = document.getElementById('theme-builder-overlay');
    if (!ov) return;
    ov.classList.add('rd-theme-builder');
    var rad = document.getElementById('tb-radius');
    if (rad && !rad.dataset.rdDefault) {
      rad.dataset.rdDefault = '1';
      if (!rad.value || rad.value === '6px') rad.value = '0';
    }
    enhanceThemePreview();
  }

  function hookThemeOpen() {
    var orig = window.openThemeBuilder;
    if (typeof orig !== 'function' || orig._pdRdHooked) return;
    window.openThemeBuilder = function () {
      applyThemeBuilderRd();
      return orig.apply(this, arguments);
    };
    window.openThemeBuilder._pdRdHooked = true;
  }

  function boot() {
    if (!document.body.classList.contains('rd-scope')) {
      setTimeout(boot, 400);
      return;
    }
    hookProfileOpen();
    hookTemplateGallery();
    hookProfileSwitch();
    hookThemeFontSync();
    hookThemeOpen();
    applyProfileDrawerRd();
    applyThemeBuilderRd();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
  } else {
    setTimeout(boot, 300);
  }
})();
