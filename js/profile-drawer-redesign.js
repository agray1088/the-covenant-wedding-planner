/* Profile & Display + Theme Builder — Master s39 · 49a · 49b (+ night variants)
   Additive shell over the live #profile-drawer and #theme-builder-overlay:
   forest header at 460px, planning-view segmented control, category cards two-up,
   and the theme builder colour grid (4×3) with component preview. */
(function () {
  'use strict';

  var VER = 'pd-rd-s39b';
  var PLANNING_VIEWS = [
    ['essentials', 'Essentials'],
    ['standard', 'Standard'],
    ['full', 'Full']
  ];

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s);
  }

  /* ── Profile drawer (49a) ─────────────────────────────────────────────── */

  function ensurePlanningSeg() {
    var field = document.querySelector('#profile-drawer .pd-field:has(#planning-view-select)');
    if (!field) {
      var sel = document.getElementById('planning-view-select');
      field = sel ? sel.closest('.pd-field') : null;
    }
    if (!field || field.querySelector('.rd-pd-planning-seg')) return;
    var select = document.getElementById('planning-view-select');
    if (!select) return;

    var seg = document.createElement('div');
    seg.className = 'rd-pd-planning-seg rd-seg';
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Planning view');
    seg.innerHTML = PLANNING_VIEWS.map(function (pair) {
      return '<button type="button" class="rd-seg__opt" data-planning-view="' + pair[0] + '">' + esc(pair[1]) + '</button>';
    }).join('');
    field.appendChild(seg);
    select.classList.add('rd-pd-native-hide');

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

  function ensureProfileCount() {
    var sec = document.querySelector('#profile-drawer .pd-sec:has(#profile-select)');
    if (!sec || sec.querySelector('.rd-pd-profile-count')) return;
    var select = document.getElementById('profile-select');
    if (!select) return;
    var n = select.options ? select.options.length : 0;
    var meta = document.createElement('div');
    meta.className = 'rd-pd-profile-count';
    meta.textContent = n ? (n + ' profile' + (n === 1 ? '' : 's')) : '';
    var field = sec.querySelector('.pd-field');
    if (field) field.appendChild(meta);
  }

  function applyProfileDrawerRd() {
    var drawer = document.getElementById('profile-drawer');
    if (!drawer || drawer.dataset.pdRd === VER) {
      syncPlanningSeg();
      ensureProfileCount();
      return;
    }
    drawer.dataset.pdRd = VER;
    drawer.classList.add('rd-profile-drawer');

    var head = drawer.querySelector('.profile-drawer-head');
    if (head && !head.querySelector('.rd-pd__eyebrow')) {
      var eyebrow = document.createElement('div');
      eyebrow.className = 'rd-pd__eyebrow';
      eyebrow.innerHTML = '<span>Profile &amp; Display</span>';
      var closeBtn = head.querySelector('.profile-drawer-close');
      if (closeBtn) {
        closeBtn.classList.add('rd-pd__x');
        eyebrow.appendChild(closeBtn);
      }
      head.insertBefore(eyebrow, head.firstChild);
    }

    var templatesSec = document.getElementById('profile-templates-sec');
    if (templatesSec) {
      var hint = templatesSec.querySelector('.pd-hint');
      if (hint && !templatesSec.querySelector('.rd-pd-cat-hint')) {
        var short = document.createElement('p');
        short.className = 'rd-pd-cat-hint';
        short.textContent = 'Choose No Preset to skip starter rows.';
        templatesSec.querySelector('.pd-sec-head')?.appendChild(short);
      }
    }

    ensurePlanningSeg();
    ensureProfileCount();
    syncPlanningSeg();
  }

  function hookProfileOpen() {
    var orig = window.openProfileDrawer;
    if (typeof orig !== 'function' || orig._pdRdHooked) return;
    window.openProfileDrawer = function () {
      applyProfileDrawerRd();
      return orig.apply(this, arguments);
    };
    window.openProfileDrawer._pdRdHooked = true;
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
    applyProfileDrawerRd();
    applyThemeBuilderRd();
    hookProfileOpen();
    hookThemeOpen();
    if (typeof renderTemplatesGalleryHosts === 'function') {
      var origTpl = window.renderTemplatesGalleryHosts;
      if (!origTpl._pdRdHooked) {
        window.renderTemplatesGalleryHosts = function () {
          var out = origTpl.apply(this, arguments);
          applyProfileDrawerRd();
          return out;
        };
        window.renderTemplatesGalleryHosts._pdRdHooked = true;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
  } else {
    setTimeout(boot, 300);
  }
})();
