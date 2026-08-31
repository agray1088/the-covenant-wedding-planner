/**
 * Furniture overlays — CURSOR-IMPLEMENTATION-GUIDE batches 34–36
 * Pixel structure follows Planner Screens Views.dc.html furniture mocks.
 * Tokens only: forest / ivory / gold via redesign CSS variables.
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

  function closeAll() {
    [
      'rd-filter-builder-overlay',
      'rd-views-mgr-overlay',
      'rd-kbd-overlay',
      'rd-bulk-edit-overlay',
      'rd-share-overlay',
      'rd-unsaved-view-overlay',
      'rd-template-overlay',
      'rd-trash-overlay',
      'rd-merge-overlay'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function overlayShell(id, className, panelHtml) {
    closeAll();
    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = className;
    overlay.innerHTML = panelHtml;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.addEventListener(
      'keydown',
      function onEsc(ev) {
        if (ev.key === 'Escape') {
          overlay.remove();
          document.removeEventListener('keydown', onEsc);
        }
      },
      true
    );
    document.body.appendChild(overlay);
    return overlay;
  }

  /* ── Filter builder (Views · S2 · 620px) ─────────────────────────────── */
  function openFilterBuilder(opts) {
    opts = opts || {};
    var pageLabel = opts.pageLabel || 'Guest List';
    var totalRows = opts.totalRows != null ? opts.totalRows : 0;
    var fields = opts.fields || [];
    var state = JSON.parse(JSON.stringify(opts.state || { conditions: [], nested: null }));

    if (!state.conditions || !state.conditions.length) {
      state.conditions = fields.slice(0, 2).map(function (f, i) {
        return {
          field: f.key,
          op: 'is',
          value: (opts.state && opts.state[f.key] && opts.state[f.key] !== 'all') ? opts.state[f.key] : (f.options && f.options[0]) || ''
        };
      });
      if (state.conditions.length === 1 && fields[1]) {
        state.conditions.push({ field: fields[1].key, op: 'is', value: '' });
      }
    }
    if (!state.nested) {
      state.nested = {
        mode: 'or',
        conditions: [
          { field: fields[0] ? fields[0].key : 'field', op: 'is', value: '' },
          { field: fields[0] ? fields[0].key : 'field', op: 'before', value: '' }
        ]
      };
    }

    function fieldMeta(key) {
      return fields.find(function (f) { return f.key === key; }) || { key: key, label: key, options: [] };
    }

    function estimateMatch() {
      if (typeof opts.estimateMatch === 'function') return opts.estimateMatch(state);
      /* Heuristic until page supplies a real counter. */
      var active = state.conditions.filter(function (c) { return c.value; }).length;
      if (!totalRows) return 0;
      return Math.max(1, Math.round(totalRows / Math.max(2, active + 1)));
    }

    function condChip(c, idx, nested) {
      var meta = fieldMeta(c.field);
      var fieldOpts = fields
        .map(function (f) {
          return '<option value="' + esc(f.key) + '"' + (f.key === c.field ? ' selected' : '') + '>' + esc(f.label || f.key) + '</option>';
        })
        .join('');
      var valueOpts = ['<option value="">Choose…</option>']
        .concat(
          (meta.options || []).map(function (o) {
            return '<option value="' + esc(o) + '"' + (String(o) === String(c.value) ? ' selected' : '') + '>' + esc(o) + '</option>';
          })
        )
        .join('');
      var prefix =
        idx === 0 && !nested
          ? '<span class="rd-filter-builder__where">Where</span>'
          : '<span class="rd-filter-builder__join' + (nested ? ' is-or' : '') + '">' + (nested ? 'or' : 'and') + '</span>';
      return (
        '<div class="rd-filter-builder__cond" data-fb-idx="' +
        idx +
        '"' +
        (nested ? ' data-fb-nested="1"' : '') +
        '>' +
        prefix +
        '<select class="rd-filter-builder__chip" data-fb-part="field">' +
        fieldOpts +
        '</select>' +
        '<span class="rd-filter-builder__chip is-op">' +
        esc(c.op || 'is') +
        '</span>' +
        '<select class="rd-filter-builder__chip" data-fb-part="value">' +
        valueOpts +
        '</select>' +
        '<button type="button" class="rd-filter-builder__x" data-fb-remove aria-label="Remove">&#10005;</button>' +
        '</div>'
      );
    }

    function readsAs() {
      var parts = state.conditions
        .filter(function (c) { return c.value; })
        .map(function (c) {
          return (fieldMeta(c.field).label || c.field) + ' is ' + c.value;
        });
      var nest = (state.nested.conditions || [])
        .filter(function (c) { return c.value; })
        .map(function (c) {
          return (fieldMeta(c.field).label || c.field) + ' ' + (c.op || 'is') + ' ' + c.value;
        });
      if (nest.length) parts.push('(' + nest.join(' or ') + ')');
      return parts.length ? parts.join(' and ') : 'No conditions yet';
    }

    function paint(overlay) {
      var match = estimateMatch();
      var panel = overlay.querySelector('.rd-filter-builder');
      if (!panel) return;
      panel.querySelector('[data-fb-body]').innerHTML =
        '<div class="rd-filter-builder__eyebrow"><span>Conditions</span><span>applies to ' +
        esc(pageLabel) +
        ' · ' +
        totalRows +
        ' rows</span></div>' +
        state.conditions.map(function (c, i) { return condChip(c, i, false); }).join('') +
        '<div class="rd-filter-builder__nested">' +
        '<div class="rd-filter-builder__nested-title">Nested group · any of these</div>' +
        state.nested.conditions.map(function (c, i) { return condChip(c, i, true); }).join('') +
        '<button type="button" class="rd-filter-builder__link" data-fb-add-nested>+ Add to this group</button>' +
        '</div>' +
        '<div class="rd-filter-builder__adds">' +
        '<button type="button" class="rd-filter-builder__link" data-fb-add>+ Add condition</button>' +
        '<button type="button" class="rd-filter-builder__link" data-fb-add-group>+ Add nested group</button>' +
        '</div>';

      panel.querySelector('[data-fb-readas]').innerHTML =
        '<div><b>Reads as:</b> ' +
        esc(readsAs()) +
        '</div><div class="rd-filter-builder__match">' +
        match +
        ' of ' +
        totalRows +
        ' rows match</div>';

      var applyBtn = panel.querySelector('[data-fb-apply]');
      if (applyBtn) applyBtn.textContent = 'Apply · ' + match + ' rows';

      bind(overlay);
    }

    function syncFromDom(overlay) {
      overlay.querySelectorAll('.rd-filter-builder__cond').forEach(function (row) {
        var idx = parseInt(row.getAttribute('data-fb-idx'), 10);
        var nested = row.getAttribute('data-fb-nested') === '1';
        var target = nested ? state.nested.conditions[idx] : state.conditions[idx];
        if (!target) return;
        var fieldSel = row.querySelector('[data-fb-part="field"]');
        var valueSel = row.querySelector('[data-fb-part="value"]');
        if (fieldSel) target.field = fieldSel.value;
        if (valueSel) target.value = valueSel.value;
      });
    }

    function bind(overlay) {
      overlay.querySelectorAll('[data-fb-part]').forEach(function (sel) {
        sel.onchange = function () {
          syncFromDom(overlay);
          paint(overlay);
        };
      });
      overlay.querySelectorAll('[data-fb-remove]').forEach(function (btn) {
        btn.onclick = function () {
          var row = btn.closest('.rd-filter-builder__cond');
          var idx = parseInt(row.getAttribute('data-fb-idx'), 10);
          if (row.getAttribute('data-fb-nested') === '1') state.nested.conditions.splice(idx, 1);
          else state.conditions.splice(idx, 1);
          paint(overlay);
        };
      });
      var add = overlay.querySelector('[data-fb-add]');
      if (add) {
        add.onclick = function () {
          var f = fields[0] || { key: 'field', options: [] };
          state.conditions.push({ field: f.key, op: 'is', value: '' });
          paint(overlay);
        };
      }
      var addN = overlay.querySelector('[data-fb-add-nested]');
      if (addN) {
        addN.onclick = function () {
          var f = fields[0] || { key: 'field', options: [] };
          state.nested.conditions.push({ field: f.key, op: 'is', value: '' });
          paint(overlay);
        };
      }
      var addG = overlay.querySelector('[data-fb-add-group]');
      if (addG) {
        addG.onclick = function () {
          /* One nested group in v1 — focus it. */
          paint(overlay);
        };
      }
    }

    var match0 = estimateMatch();
    var overlay = overlayShell(
      'rd-filter-builder-overlay',
      'rd-filter-builder-overlay',
      '<div class="rd-filter-builder" role="dialog" aria-modal="true" aria-label="Filter builder">' +
        '<div class="rd-filter-builder__head">' +
        '<div class="rd-filter-builder__title">Filter · ' +
        esc(pageLabel) +
        '</div>' +
        '<div class="rd-filter-builder__sub">Conditions apply to the current view. Saving turns this into a rail entry.</div>' +
        '</div>' +
        '<div class="rd-filter-builder__body" data-fb-body></div>' +
        '<div class="rd-filter-builder__readas" data-fb-readas></div>' +
        '<div class="rd-filter-builder__foot">' +
        '<button type="button" class="rd-btn rd-btn--quiet" data-fb-reset>Reset</button>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<button type="button" class="rd-btn" data-fb-save>Save as a view</button>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-fb-apply>Apply · ' +
        match0 +
        ' rows</button>' +
        '</div></div>'
    );

    paint(overlay);

    overlay.querySelector('[data-fb-reset]').onclick = function () {
      state.conditions = [];
      state.nested = { mode: 'or', conditions: [] };
      fields.forEach(function (f) {
        if (opts.state) opts.state[f.key] = 'all';
      });
      if (typeof opts.onApply === 'function') opts.onApply(flattenState(state), state);
      overlay.remove();
    };
    overlay.querySelector('[data-fb-save]').onclick = function () {
      syncFromDom(overlay);
      var name = window.prompt('Name this view', pageLabel + ' filter');
      if (!name) return;
      if (typeof opts.onSaveView === 'function') opts.onSaveView(name, flattenState(state), state);
      else if (typeof global.setSavedView === 'function' && opts.panelId) {
        global.setSavedView(opts.panelId, name);
      }
      if (typeof opts.onApply === 'function') opts.onApply(flattenState(state), state);
      overlay.remove();
      if (typeof showToast === 'function') showToast('Saved view “' + name + '”');
    };
    overlay.querySelector('[data-fb-apply]').onclick = function () {
      syncFromDom(overlay);
      if (typeof opts.onApply === 'function') opts.onApply(flattenState(state), state);
      overlay.remove();
    };

    return overlay;
  }

  function flattenState(state) {
    var out = {};
    (state.conditions || []).forEach(function (c) {
      if (c.field && c.value) out[c.field] = c.value;
    });
    return out;
  }

  function closeFilterBuilder() {
    var el = document.getElementById('rd-filter-builder-overlay');
    if (el) el.remove();
  }

  /* ── Saved views manager (Views · S3 · 520px) ────────────────────────── */
  function openSavedViewsManager(opts) {
    opts = opts || {};
    var pageLabel = opts.pageLabel || 'Guest List';
    var panelId = opts.panelId || 'guests';
    var pinned = opts.pinned || [
      { id: 'all', label: 'All guests', badge: 'Default' },
      { id: 'no-reply', label: 'No reply', badge: 'Pinned', selected: true },
      { id: 'chase', label: 'Chase list' },
      { id: 'dietary', label: 'Dietary flags' }
    ];
    var unpinned = opts.unpinned || [
      { id: 'kumasi', label: 'Kumasi guests' },
      { id: 'top-table', label: 'Top table' }
    ];
    var shared = opts.shared || [{ id: 'mary', label: 'Mary’s working list', badge: 'Read-only' }];
    var cur = typeof global.getSavedView === 'function' ? global.getSavedView(panelId, 'all') : 'all';

    function rowHtml(v, group) {
      var selected = v.selected || v.id === cur;
      var badge = v.badge
        ? '<span class="rd-views-mgr__badge' +
          (v.badge === 'Read-only' ? ' is-gold' : v.badge === 'Pinned' ? ' is-blue' : '') +
          '">' +
          esc(v.badge) +
          '</span>'
        : '';
      return (
        '<button type="button" class="rd-views-mgr__row' +
        (selected ? ' is-selected' : '') +
        '" data-view-id="' +
        esc(v.id) +
        '" data-group="' +
        esc(group) +
        '"><span class="rd-views-mgr__label">' +
        esc(v.label) +
        '</span>' +
        badge +
        '</button>'
      );
    }

    var overlay = overlayShell(
      'rd-views-mgr-overlay',
      'rd-views-mgr-overlay',
      '<div class="rd-views-mgr" role="dialog" aria-modal="true" aria-label="Saved views">' +
        '<div class="rd-views-mgr__head">' +
        '<div class="rd-views-mgr__title">Views · ' +
        esc(pageLabel) +
        '</div>' +
        '<div class="rd-views-mgr__sub">Pinned views appear in the rail in this order.</div>' +
        '</div>' +
        '<div class="rd-views-mgr__eyebrow"><span>Pinned to the rail</span><span>drag to reorder · order is per person, not shared</span></div>' +
        '<div class="rd-views-mgr__list" data-list="pinned">' +
        pinned.map(function (v) { return rowHtml(v, 'pinned'); }).join('') +
        '</div>' +
        '<div class="rd-views-mgr__eyebrow"><span>Not pinned</span></div>' +
        '<div class="rd-views-mgr__list" data-list="unpinned">' +
        unpinned.map(function (v) { return rowHtml(v, 'unpinned'); }).join('') +
        '</div>' +
        '<div class="rd-views-mgr__eyebrow"><span>Shared with you</span></div>' +
        '<div class="rd-views-mgr__list" data-list="shared">' +
        shared.map(function (v) { return rowHtml(v, 'shared'); }).join('') +
        '</div>' +
        '<div class="rd-views-mgr__foot">' +
        '<button type="button" class="rd-btn rd-btn--quiet" data-vm-reset>Reset order</button>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<button type="button" class="rd-btn" data-vm-new>New view from filter</button>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-vm-done>Done</button>' +
        '</div></div>'
    );

    overlay.querySelectorAll('[data-view-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('data-group') === 'shared') return;
        var id = btn.getAttribute('data-view-id');
        if (typeof global.setSavedView === 'function') global.setSavedView(panelId, id);
        if (typeof opts.onSelect === 'function') opts.onSelect(id);
        overlay.querySelectorAll('.rd-views-mgr__row').forEach(function (r) {
          r.classList.toggle('is-selected', r === btn);
        });
      });
    });
    overlay.querySelector('[data-vm-done]').onclick = function () { overlay.remove(); };
    overlay.querySelector('[data-vm-new]').onclick = function () {
      overlay.remove();
      if (typeof opts.onNewFromFilter === 'function') opts.onNewFromFilter();
      else if (typeof global.RdFurniture !== 'undefined') {
        openFilterBuilder({
          pageLabel: pageLabel,
          panelId: panelId,
          fields: opts.fields || [],
          totalRows: opts.totalRows || 0,
          onApply: opts.onApply
        });
      }
    };
    overlay.querySelector('[data-vm-reset]').onclick = function () {
      if (typeof opts.onResetOrder === 'function') opts.onResetOrder();
      if (typeof showToast === 'function') showToast('Rail order reset');
    };
    return overlay;
  }

  /* ── Keyboard shortcuts (Views · S6 · 760px) ─────────────────────────── */
  function openShortcutSheet() {
    var cols = [
      {
        title: 'Everywhere',
        rows: [
          ['⌘K', 'Command palette'],
          ['?', 'This sheet'],
          ['⌘Z', 'Undo'],
          ['⇧⌘Z', 'Redo'],
          ['⌘S', 'Force a save'],
          ['esc', 'Close drawer or overlay']
        ]
      },
      {
        title: 'In a table',
        rows: [
          ['↑↓', 'Move row'],
          ['↵', 'Open drawer'],
          ['⌘↵', 'Full editor'],
          ['space', 'Select row'],
          ['⇧ click', 'Select range'],
          ['⌘F', 'Filter builder']
        ]
      },
      {
        title: 'In a drawer',
        rows: [
          ['tab', 'Next field'],
          ['⌘↵', 'Save and close'],
          ['⌥↑↓', 'Prev/next record'],
          ['⌘⌫', 'Delete'],
          ['⌘D', 'Duplicate'],
          ['esc', 'Close without saving']
        ]
      }
    ];
    var body = cols
      .map(function (c) {
        return (
          '<div class="rd-kbd__col"><div class="rd-kbd__col-title">' +
          esc(c.title) +
          '</div>' +
          c.rows
            .map(function (r) {
              return (
                '<div class="rd-kbd__row"><kbd>' +
                esc(r[0]) +
                '</kbd><span>' +
                esc(r[1]) +
                '</span></div>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('');

    var overlay = overlayShell(
      'rd-kbd-overlay',
      'rd-kbd-overlay',
      '<div class="rd-kbd" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">' +
        '<div class="rd-kbd__head">' +
        '<div class="rd-kbd__title">Keyboard shortcuts</div>' +
        '<div class="rd-kbd__sub">Press ? anywhere to open this. Press esc to close it.</div>' +
        '</div>' +
        '<div class="rd-kbd__body">' +
        body +
        '</div>' +
        '<div class="rd-kbd__rule">Consistency rule: no page-specific shortcuts. A key means the same thing everywhere.</div>' +
        '<div class="rd-kbd__foot">' +
        '<span>18 shortcuts</span>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<button type="button" class="rd-btn" data-kbd-print>Print this sheet</button>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-kbd-close>Close</button>' +
        '</div></div>'
    );
    overlay.querySelector('[data-kbd-close]').onclick = function () { overlay.remove(); };
    overlay.querySelector('[data-kbd-print]').onclick = function () { window.print(); };
    return overlay;
  }

  /* ── Bulk edit (Views · S4 · 620px) ──────────────────────────────────── */
  function openBulkEdit(opts) {
    opts = opts || {};
    var count = opts.count || 0;
    var names = opts.names || [];
    var fields = opts.fields || [{ key: 'meal', label: 'Meal choice', options: ['Beef', 'Chicken', 'Fish', 'Vegetarian'] }];
    var more = Math.max(0, count - Math.min(names.length, 6));
    var named = names.slice(0, 6).join(', ') + (more ? ' and ' + more + ' more' : '');
    var conflictCount = opts.conflictCount || 0;
    var changeCount = Math.max(0, count - conflictCount);
    var downstream =
      opts.downstream ||
      ('Downstream: ' +
        changeCount +
        ' rows update live counts on linked pages. It does not change the budget — figures elsewhere stay owned by their own records.');

    var fieldRows = fields
      .map(function (f, i) {
        var label = i === 0 ? 'Set field' : 'Also set';
        var optsHtml = (f.options || [])
          .map(function (o) {
            return '<option value="' + esc(o) + '">' + esc(o) + '</option>';
          })
          .join('');
        return (
          '<div class="rd-bulk-edit__field"><span>' +
          esc(label) +
          '</span><select data-be-field="' +
          esc(f.key) +
          '"><option value="">' +
          esc(f.label) +
          '</option>' +
          optsHtml +
          '</select></div>'
        );
      })
      .join('');

    var conflictBlock = '';
    if (conflictCount) {
      conflictBlock =
        '<div class="rd-bulk-edit__conflict">' +
        '<div class="rd-bulk-edit__conflict-note">' +
        esc(
          opts.conflictNote ||
            (conflictCount +
              ' of the ' +
              count +
              ' already have a value. Overwriting is a choice, not a side effect.')
        ) +
        '</div>' +
        '<label><input type="checkbox" checked data-be-skip> Skip the ' +
        conflictCount +
        ' rows that already have a value</label></div>';
    }

    var overlay = overlayShell(
      'rd-bulk-edit-overlay',
      'rd-bulk-edit-overlay',
      '<div class="rd-bulk-edit" role="dialog" aria-modal="true" aria-label="Bulk edit">' +
        '<div class="rd-bulk-edit__head">' +
        '<div class="rd-bulk-edit__title">Bulk edit · ' +
        count +
        ' guests</div>' +
        '<div class="rd-bulk-edit__sub">Every field set here applies to all selected rows unless skipped.</div>' +
        '</div>' +
        '<div class="rd-bulk-edit__eyebrow"><span>Editing ' +
        count +
        ' guests</span><span>selected in Table view · the list is shown so nobody edits blind</span></div>' +
        '<div class="rd-bulk-edit__names">' +
        esc(named || count + ' selected') +
        '</div>' +
        '<div class="rd-bulk-edit__fields">' +
        fieldRows +
        '<button type="button" class="rd-filter-builder__link">+ Set another field</button></div>' +
        conflictBlock +
        '<div class="rd-bulk-edit__downstream">' +
        esc(downstream) +
        '</div>' +
        '<div class="rd-bulk-edit__foot">' +
        '<button type="button" class="rd-btn rd-btn--quiet" data-be-cancel>Cancel</button>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<span class="rd-bulk-edit__hint">' +
        changeCount +
        ' rows will change · undoes as one ⌘Z</span>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-be-apply>Apply to ' +
        changeCount +
        '</button>' +
        '</div></div>'
    );
    overlay.querySelector('[data-be-cancel]').onclick = function () { overlay.remove(); };
    overlay.querySelector('[data-be-apply]').onclick = function () {
      var values = {};
      overlay.querySelectorAll('[data-be-field]').forEach(function (sel) {
        if (sel.value) values[sel.getAttribute('data-be-field')] = sel.value;
      });
      var skip = !!(overlay.querySelector('[data-be-skip]') && overlay.querySelector('[data-be-skip]').checked);
      if (typeof opts.onApply === 'function') opts.onApply(values, { skipConflicts: skip });
      overlay.remove();
    };
    return overlay;
  }

  /* ── Share dialog (Views · S8 · 560px) ───────────────────────────────── */
  function openShareDialog(opts) {
    opts = opts || {};
    var pageLabel = opts.pageLabel || 'Guest List';
    var link = opts.link || (location.href.split('#')[0] + '#share/' + (opts.panelId || 'guests'));
    /* Master 35d: Never list is fixed — no control to include budget, guest
       names or Covenant. They-see chips stay page-specific via opts.see. */
    var neverList =
      opts.never ||
      ['Guest names', 'Addresses', 'Budget', "Other vendors' pricing", 'Covenant', 'Notes'];
    var seeList = opts.see || ['Names', 'RSVP', 'Table'];
    var withName = opts.withName || 'Add a recipient';
    var note =
      opts.note ||
      ('The link shows live records, not a copy. Editing this page updates what ' +
        (withName.indexOf('Add a') === 0 ? 'they' : withName.split('·')[0].trim().split(' ')[0]) +
        ' see. Revoking stops the link immediately — but it cannot recall a PDF already downloaded.');
    var overlay = overlayShell(
      'rd-share-overlay',
      'rd-share-overlay',
      '<div class="rd-share" role="dialog" aria-modal="true" aria-label="Share">' +
        '<div class="rd-share__head">' +
        '<div class="rd-share__title">Share this page</div>' +
        '<div class="rd-share__sub">One page, one recipient, live for a fixed window.</div>' +
        '</div>' +
        '<div class="rd-share__body">' +
        '<div class="rd-share__row"><span>Sharing</span><strong>' +
        esc(pageLabel) +
        '</strong></div>' +
        '<div class="rd-share__row"><span>With</span><span class="rd-share__chip">' +
        esc(withName) +
        '</span></div>' +
        '<div class="rd-share__row"><span>They see</span><span class="rd-share__chips is-ok">' +
        seeList.map(function (t) {
          return '<i>' + esc(t) + '</i>';
        }).join('') +
        '</span></div>' +
        '<div class="rd-share__row"><span>Never</span><span class="rd-share__chips is-never">' +
        neverList.map(function (t) {
          return '<i>' + esc(t) + '</i>';
        }).join('') +
        '</span></div>' +
        '<div class="rd-share__row"><span>Access</span><span>View only · Expires 12 Nov</span></div>' +
        '<div class="rd-share__link"><code>' +
        esc(link) +
        '</code><button type="button" class="rd-btn rd-btn--quiet" data-share-copy>Copy</button></div>' +
        '<div class="rd-share__note">' +
        esc(note) +
        '</div>' +
        '</div>' +
        '<div class="rd-share__foot">' +
        '<button type="button" class="rd-btn rd-btn--quiet" data-share-cancel>Cancel</button>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<button type="button" class="rd-btn" data-share-packet>Build a full packet instead</button>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-share-go>Share</button>' +
        '</div></div>'
    );
    overlay.querySelector('[data-share-cancel]').onclick = function () { overlay.remove(); };
    overlay.querySelector('[data-share-copy]').onclick = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link);
      if (typeof showToast === 'function') showToast('Link copied');
    };
    overlay.querySelector('[data-share-packet]').onclick = function () {
      overlay.remove();
      if (typeof showPanel === 'function') showPanel('packets', true);
    };
    overlay.querySelector('[data-share-go]').onclick = function () {
      overlay.remove();
      if (typeof showToast === 'function') showToast('Share link ready');
    };
    return overlay;
  }

  /* ── Undo toast (Views · S9) ─────────────────────────────────────────── */
  function showUndoToast(opts) {
    opts = opts || {};
    var existing = document.getElementById('rd-undo-toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'rd-undo-toast';
    el.className = 'rd-undo-toast';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="rd-undo-toast__text"><strong>' +
      esc(opts.title || 'Change applied') +
      '</strong>' +
      (opts.detail ? '<span>' + esc(opts.detail) + '</span>' : '') +
      '</div>' +
      '<button type="button" class="rd-undo-toast__action" data-undo>Undo ⌘Z</button>';
    document.body.appendChild(el);
    var timer = setTimeout(function () { el.remove(); }, opts.ms || 6000);
    el.querySelector('[data-undo]').onclick = function () {
      clearTimeout(timer);
      el.remove();
      if (typeof opts.onUndo === 'function') opts.onUndo();
      else if (typeof global.plannerUndo === 'function') global.plannerUndo();
    };
    return el;
  }

  function listSavedViews(panelId) {
    if (typeof global.getSavedView !== 'function') return [{ id: 'all', label: 'All' }];
    var cur = global.getSavedView(panelId, 'all');
    return [
      { id: 'all', label: 'All', active: cur === 'all' },
      { id: cur, label: cur === 'all' ? 'All' : String(cur), active: true }
    ].filter(function (v, i, arr) {
      return (
        arr.findIndex(function (x) {
          return x.id === v.id;
        }) === i
      );
    });
  }

  function saveCurrentView(panelId, viewId) {
    if (typeof global.setSavedView === 'function') global.setSavedView(panelId, viewId);
  }

  /* ── Templates / Trash / Merge (Views · S10 · 480px) ─────────────────── */
  function openTemplatePicker(opts) {
    opts = opts || {};
    var title = opts.title || 'New from template · budget line';
    var templates = opts.templates || [
      { id: 'instalments', title: 'Vendor with instalments', sub: 'Deposit + balance schedule', used: 12 },
      { id: 'single', title: 'Single payment on delivery', sub: 'One due date, one amount', used: 8 },
      { id: 'percover', title: 'Per-cover cost', sub: 'Amount × guest count', used: 3 },
      { id: 'blank', title: 'Blank line', sub: 'Start empty' }
    ];
    var overlay = overlayShell(
      'rd-template-overlay',
      'rd-template-overlay',
      '<div class="rd-template-picker" role="dialog" aria-modal="true" aria-label="Templates">' +
        '<div class="rd-template-picker__head"><div class="rd-template-picker__title">' +
        esc(title) +
        '</div><div class="rd-template-picker__sub">Shapes, not values — empty amounts only.</div></div>' +
        '<div class="rd-template-picker__list">' +
        templates
          .map(function (t) {
            return (
              '<button type="button" class="rd-template-picker__row" data-tpl="' +
              esc(t.id) +
              '"><span class="rd-template-picker__main"><strong>' +
              esc(t.title) +
              '</strong><span>' +
              esc(t.sub || '') +
              '</span></span>' +
              (t.used != null ? '<span class="rd-template-picker__used">Used ' + t.used + '×</span>' : '') +
              '</button>'
            );
          })
          .join('') +
        '</div>' +
        '<div class="rd-template-picker__foot">Templates set structure only. They never invent figures.</div></div>'
    );
    overlay.querySelectorAll('[data-tpl]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tpl');
        overlay.remove();
        if (typeof opts.onPick === 'function') opts.onPick(id, templates.find(function (t) { return t.id === id; }));
      });
    });
    return overlay;
  }

  function openTrash(opts) {
    opts = opts || {};
    var items = opts.items || [];
    var overlay = overlayShell(
      'rd-trash-overlay',
      'rd-trash-overlay',
      '<div class="rd-trash" role="dialog" aria-modal="true" aria-label="Trash">' +
        '<div class="rd-trash__head"><div class="rd-trash__title">Trash · 30 days</div>' +
        '<div class="rd-trash__sub">Restore children with their parent. Missing parent → restore into the parent’s trash, never orphan.</div></div>' +
        '<div class="rd-trash__list">' +
        (items.length
          ? items
              .map(function (it) {
                var chip =
                  it.expired
                    ? '<span class="rd-trash__chip is-expired">Expired</span>'
                    : '<span class="rd-trash__chip">' + esc(it.daysLeft != null ? it.daysLeft + ' days left' : '') + '</span>';
                return (
                  '<button type="button" class="rd-trash__row" data-trash-id="' +
                  esc(it.id || '') +
                  '"><span class="rd-trash__main"><strong>' +
                  esc(it.title || 'Item') +
                  '</strong><span>' +
                  esc(it.meta || '') +
                  '</span></span>' +
                  chip +
                  '</button>'
                );
              })
              .join('')
          : '<div class="rd-trash__empty">Trash is empty. Deleted records stay here for 30 days.</div>') +
        '</div>' +
        '<div class="rd-trash__foot"><button type="button" class="rd-btn rd-btn--primary" data-trash-close>Close</button></div></div>'
    );
    overlay.querySelector('[data-trash-close]').onclick = function () { overlay.remove(); };
    overlay.querySelectorAll('[data-trash-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-trash-id');
        if (typeof opts.onRestore === 'function') opts.onRestore(id);
        if (typeof showToast === 'function') showToast('Restored from trash');
        overlay.remove();
      });
    });
    return overlay;
  }

  function openMergeReview(opts) {
    opts = opts || {};
    var left = opts.left || {};
    var right = opts.right || {};
    var fields = opts.fields || ['Name', 'Email', 'Household', 'Reply', 'Seat'];
    var map = opts.map || {
      Name: [left.name, right.name],
      Email: [left.email, right.email],
      Household: [left.household, right.household],
      Reply: [left.rsvp, right.rsvp],
      Seat: [left.table, right.table]
    };
    var rows = fields
      .map(function (f) {
        var pair = map[f] || ['—', '—'];
        var l = pair[0] == null || pair[0] === '' ? '—' : pair[0];
        var r = pair[1] == null || pair[1] === '' ? '—' : pair[1];
        return (
          '<div class="rd-merge__row"><span class="rd-merge__lab">' +
          esc(f) +
          '</span><span class="rd-merge__val' +
          (l === '—' ? ' is-empty' : '') +
          '">' +
          esc(l) +
          '</span><span class="rd-merge__val' +
          (r === '—' ? ' is-empty' : '') +
          '">' +
          esc(r) +
          '</span></div>'
        );
      })
      .join('');
    var overlay = overlayShell(
      'rd-merge-overlay',
      'rd-merge-overlay',
      '<div class="rd-merge" role="dialog" aria-modal="true" aria-label="Duplicate review">' +
        '<div class="rd-merge__head"><div class="rd-merge__title">Possible duplicate · review</div>' +
        '<div class="rd-merge__sub">Keep the left record and its seat. Right-side email becomes an alternate. Discarded values go to history.</div></div>' +
        '<div class="rd-merge__grid"><div class="rd-merge__row is-head"><span></span><span>Keep</span><span>Other</span></div>' +
        rows +
        '</div>' +
        '<div class="rd-merge__foot">' +
        '<button type="button" class="rd-btn rd-btn--quiet" data-merge-cancel>Cancel</button>' +
        '<span class="rd-filter-builder__spacer"></span>' +
        '<button type="button" class="rd-btn rd-btn--primary" data-merge-keep>Keep left · merge</button>' +
        '</div></div>'
    );
    overlay.querySelector('[data-merge-cancel]').onclick = function () { overlay.remove(); };
    overlay.querySelector('[data-merge-keep]').onclick = function () {
      overlay.remove();
      if (typeof opts.onMerge === 'function') opts.onMerge({ keep: 'left', left: left, right: right });
      if (typeof showToast === 'function') showToast('Merged — discarded values kept in history');
    };
    return overlay;
  }

  /* ── Notifications panel HTML (Views · S7) — used by topbar drop ───── */
  function notificationsHtml(model) {
    model = model || { needsYou: [], activity: [], quiet: '' };
    function row(item, selected) {
      var chip = item.chip
        ? '<span class="rd-notif__chip' +
          (item.chipTone === 'gold' ? ' is-gold' : item.chipTone === 'red' || item.urgent ? ' is-red' : '') +
          '">' +
          esc(item.chip) +
          '</span>'
        : item.when
          ? '<span class="rd-notif__when">' + esc(item.when) + '</span>'
          : '';
      return (
        '<button type="button" class="rd-notif__row' +
        (selected ? ' is-selected' : '') +
        '" data-notif-action="' +
        esc(item.action || '') +
        '"><span class="rd-notif__copy"><strong>' +
        esc(item.title || '') +
        '</strong><span>' +
        esc(item.note || '') +
        '</span></span>' +
        chip +
        '</button>'
      );
    }
    var needs = model.needsYou || [];
    var act = model.activity || [];
    return (
      '<div class="rd-notif">' +
      '<div class="rd-notif__head"><div class="rd-notif__title">Notifications</div>' +
      '<div class="rd-notif__sub">Two kinds: what needs you, and what other people did.</div></div>' +
      '<div class="rd-notif__eyebrow"><span>Needs you</span><span>' +
      needs.length +
      ' · derived from the records, not a message queue</span></div>' +
      '<div class="rd-notif__list">' +
      (needs.length
        ? needs.map(function (it, i) { return row(it, i === 0); }).join('')
        : '<div class="rd-notif__empty">Nothing needs you right now.</div>') +
      '</div>' +
      '<div class="rd-notif__eyebrow"><span>Changed since you last looked</span><span>' +
      esc(model.activityMeta || 'recently') +
      '</span></div>' +
      '<div class="rd-notif__list">' +
      (act.length
        ? act.map(function (it) { return row(it, false); }).join('')
        : '<div class="rd-notif__empty">No activity yet.</div>') +
      '</div>' +
      '<div class="rd-notif__eyebrow"><span>Quiet</span><span>things the planner is deliberately not telling you</span></div>' +
      '<div class="rd-notif__quiet">' +
      esc(
        model.quiet ||
          'No alert is raised for a guest replying, a payment coming due more than 14 days out, or a vendor opening a packet. Those are visible on their own pages and would train you to ignore this panel.'
      ) +
      '</div>' +
      '<div class="rd-notif__foot">' +
      '<button type="button" class="rd-btn rd-btn--quiet" data-notif-read>Mark activity as read</button>' +
      '<span class="rd-filter-builder__spacer"></span>' +
      '<button type="button" class="rd-btn" data-notif-settings>Notification settings</button>' +
      '</div></div>'
    );
  }

  global.RdFurniture = {
    openFilterBuilder: openFilterBuilder,
    closeFilterBuilder: closeFilterBuilder,
    openSavedViewsManager: openSavedViewsManager,
    openShortcutSheet: openShortcutSheet,
    openBulkEdit: openBulkEdit,
    openShareDialog: openShareDialog,
    showUndoToast: showUndoToast,
    openTemplatePicker: openTemplatePicker,
    openTrash: openTrash,
    openMergeReview: openMergeReview,
    notificationsHtml: notificationsHtml,
    listSavedViews: listSavedViews,
    saveCurrentView: saveCurrentView,
    closeAll: closeAll
  };

  global.openShortcutSheet = openShortcutSheet;
})(typeof window !== 'undefined' ? window : globalThis);
