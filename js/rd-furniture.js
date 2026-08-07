/**
 * Furniture foundations — CURSOR-IMPLEMENTATION-GUIDE batches 34–36
 * Filter builder shell + saved-view helpers. ⌘K lives in planner.js.
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Open a lightweight filter-builder popover anchored to `anchor`.
   * fields: [{ key, label, options: string[] }]
   * state: { [key]: value }  — 'all' means unset
   * onApply(nextState)
   */
  function openFilterBuilder(opts) {
    opts = opts || {};
    closeFilterBuilder();
    var fields = opts.fields || [];
    var state = Object.assign({}, opts.state || {});
    var overlay = document.createElement('div');
    overlay.className = 'rd-filter-builder-overlay';
    overlay.id = 'rd-filter-builder-overlay';
    overlay.innerHTML =
      '<div class="rd-filter-builder" role="dialog" aria-modal="true" aria-label="Filter builder">' +
      '<div class="rd-filter-builder__head">Filter builder</div>' +
      '<div class="rd-filter-builder__body">' +
      fields
        .map(function (f) {
          var cur = state[f.key] != null ? state[f.key] : 'all';
          var optsHtml = ['<option value="all">Any</option>']
            .concat(
              (f.options || []).map(function (o) {
                return (
                  '<option value="' +
                  esc(o) +
                  '"' +
                  (String(o) === String(cur) ? ' selected' : '') +
                  '>' +
                  esc(o) +
                  '</option>'
                );
              })
            )
            .join('');
          return (
            '<label class="rd-filter-builder__row"><span>' +
            esc(f.label || f.key) +
            '</span><select data-fb-key="' +
            esc(f.key) +
            '">' +
            optsHtml +
            '</select></label>'
          );
        })
        .join('') +
      '</div>' +
      '<div class="rd-filter-builder__foot">' +
      '<button type="button" class="rd-btn" data-fb-clear>Clear</button>' +
      '<button type="button" class="rd-btn rd-btn--primary" data-fb-apply>Apply</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeFilterBuilder();
    });
    overlay.querySelector('[data-fb-clear]').addEventListener('click', function () {
      fields.forEach(function (f) {
        state[f.key] = 'all';
      });
      if (typeof opts.onApply === 'function') opts.onApply(state);
      closeFilterBuilder();
    });
    overlay.querySelector('[data-fb-apply]').addEventListener('click', function () {
      overlay.querySelectorAll('[data-fb-key]').forEach(function (sel) {
        state[sel.getAttribute('data-fb-key')] = sel.value;
      });
      if (typeof opts.onApply === 'function') opts.onApply(state);
      closeFilterBuilder();
    });
    return overlay;
  }

  function closeFilterBuilder() {
    var el = document.getElementById('rd-filter-builder-overlay');
    if (el) el.remove();
  }

  /** List saved views for a panel from data.setup.savedViews. */
  function listSavedViews(panelId) {
    if (typeof global.getSavedView !== 'function') return [{ id: 'all', label: 'All' }];
    var cur = global.getSavedView(panelId, 'all');
    return [
      { id: 'all', label: 'All', active: cur === 'all' },
      { id: cur, label: cur === 'all' ? 'All' : String(cur), active: true }
    ].filter(function (v, i, arr) {
      return arr.findIndex(function (x) {
        return x.id === v.id;
      }) === i;
    });
  }

  function saveCurrentView(panelId, viewId) {
    if (typeof global.setSavedView === 'function') global.setSavedView(panelId, viewId);
  }

  global.RdFurniture = {
    openFilterBuilder: openFilterBuilder,
    closeFilterBuilder: closeFilterBuilder,
    listSavedViews: listSavedViews,
    saveCurrentView: saveCurrentView
  };
})(typeof window !== 'undefined' ? window : globalThis);
