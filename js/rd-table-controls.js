/* ═══════════════════════════════════════════════════════════════════════
   rd-table-controls.js — the three toolbar controls every redesigned table
   shares: an anchored picker, a column chooser, and auto-fit.

   WHY THIS EXISTS
   Five redesign modules (budget, gifts, party, tables, payments) each call a
   global rdOpenPicker() that was never defined anywhere in the codebase. Every
   one of them silently fell through to a "jump to the next value" fallback, so
   no filter or sort chip ever opened a menu, and several Columns chips were a
   hardcoded label with no handler. Defining rdOpenPicker() here repairs all of
   them at once.

   Auto-fit is separate. The planner has its own fitter, but it skips any cell
   with colSpan > 1 and skips plan sub-rows, so a group heading or an "add a
   row…" line never counts toward a width and can end up clipped. rdAutoFitTable
   measures those rows too — spanning text raises the table's minimum width
   rather than any one column — and it writes through the same <colgroup> the
   planner uses so the widths actually take effect.

   The column registry and auto-fit are opt-in per table.

   Load this BEFORE the per-page redesign modules.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function profile() {
    return typeof window.activeProfile !== 'undefined' && window.activeProfile != null
      ? window.activeProfile : 'default';
  }

  /* ── anchored picker ───────────────────────────────────────────────────
     Single-select for filters and sort; multi-select stays open so several
     columns can be toggled in one pass. Lives on <body> so it escapes the
     table wrapper's overflow clipping. */

  var el = null;
  var onOutside = null;
  var onKey = null;

  function close() {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null;
    if (onOutside) document.removeEventListener('mousedown', onOutside, true);
    if (onKey) document.removeEventListener('keydown', onKey, true);
    onOutside = null;
    onKey = null;
  }

  function normalise(opts) {
    return (opts || []).map(function (o) {
      if (o == null) return null;
      if (typeof o === 'string') return { value: o, label: o };
      return {
        value: o.value !== undefined ? o.value : o.id,
        label: o.label !== undefined ? o.label : String(o.value !== undefined ? o.value : o.id),
        checked: !!o.checked
      };
    }).filter(Boolean);
  }

  /* Place any body-level popup under its trigger button.
     Shrink-wrap first — a block div on <body> reads as full viewport width,
     which made left-clamps pin menus to 8px (far left of the page). */
  function anchorToButton(pop, anchor, opts) {
    opts = opts || {};
    if (!pop || !anchor || !anchor.getBoundingClientRect) return null;
    var margin = opts.margin != null ? opts.margin : 8;
    var gap = opts.gap != null ? opts.gap : 4;
    var minW = opts.minWidth != null ? opts.minWidth : 180;
    var mode = opts.mode === 'absolute' ? 'absolute' : 'fixed';
    var flip = opts.flip !== false;

    pop.style.boxSizing = 'border-box';
    if (!opts.keepDisplay) pop.style.display = 'inline-block';
    if (!opts.keepWidth) {
      pop.style.width = 'max-content';
      pop.style.maxWidth = 'min(320px, calc(100vw - ' + (margin * 2) + 'px))';
    }
    pop.style.visibility = 'hidden';
    pop.style.left = '0';
    pop.style.top = '0';
    pop.style.position = mode;
    if (!pop.parentNode) document.body.appendChild(pop);

    var r = anchor.getBoundingClientRect();
    var w = Math.max(pop.offsetWidth || 0, pop.getBoundingClientRect().width || 0, minW);
    var h = Math.max(pop.offsetHeight || 0, pop.getBoundingClientRect().height || 0, 40);
    var left;
    var top;

    if (mode === 'fixed') {
      left = Math.max(margin, Math.min(r.left, window.innerWidth - w - margin));
      if (flip && r.bottom + h + gap + 4 > window.innerHeight && r.top - h - gap > margin) {
        top = r.top - h - gap;
      } else {
        top = Math.max(margin, Math.min(r.bottom + gap, window.innerHeight - h - margin));
      }
    } else {
      left = window.scrollX + r.left;
      var maxLeft = window.scrollX + document.documentElement.clientWidth - w - margin;
      if (left > maxLeft) left = Math.max(window.scrollX + margin, maxLeft);
      top = window.scrollY + r.bottom + gap;
    }

    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
    if (!pop.style.zIndex) pop.style.zIndex = String(opts.zIndex || 12000);
    pop.style.visibility = '';
    return { left: left, top: top, width: w, height: h };
  }
  window.rdAnchorToButton = anchorToButton;

  function open(btn, opts, current, onPick, multi) {
    close();
    var list = normalise(opts);
    if (!btn || !list.length) return;

    el = document.createElement('div');
    el.className = 'rd-picker';
    el.setAttribute('role', 'menu');
    el.innerHTML = list.map(function (o) {
      var on = multi ? o.checked : String(o.value) === String(current);
      return '<button type="button" class="rd-picker__item' + (on ? ' is-on' : '') + '"'
        + ' data-val="' + esc(o.value) + '" role="menuitem">'
        + '<span class="rd-picker__tick" aria-hidden="true">' + (on ? '&#10003;' : '') + '</span>'
        + '<span class="rd-picker__label">' + esc(o.label) + '</span></button>';
    }).join('');
    document.body.appendChild(el);
    anchorToButton(el, btn, { minWidth: 190, gap: 4, zIndex: 4000 });

    el.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.rd-picker__item') : null;
      if (!item) return;
      var val = item.getAttribute('data-val');
      if (multi) {
        /* a rejected toggle (the last visible column) must not flip the tick */
        if (onPick(val) === false) return;
        var nowOn = !item.classList.contains('is-on');
        item.classList.toggle('is-on', nowOn);
        var tick = item.querySelector('.rd-picker__tick');
        if (tick) tick.innerHTML = nowOn ? '&#10003;' : '';
        return;
      }
      close();
      onPick(val);
    });

    onOutside = function (e) { if (el && !el.contains(e.target)) close(); };
    onKey = function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    /* defer so the click that opened the menu does not immediately close it */
    setTimeout(function () {
      document.addEventListener('mousedown', onOutside, true);
      document.addEventListener('keydown', onKey, true);
    }, 0);
  }

  window.rdOpenPicker = open;
  window.rdClosePicker = close;

  /* Single-select convenience used by the pages that live in planner.js, so a
     missing picker degrades to no menu rather than a thrown error mid-toolbar. */
  window.rdPickOne = function (btn, opts, current, onPick) {
    if (typeof window.rdOpenPicker !== 'function') return;
    window.rdOpenPicker(btn, opts, current, onPick, false);
  };
  window.rdPickMany = function (btn, opts, onToggle) {
    if (typeof window.rdOpenPicker !== 'function') return;
    window.rdOpenPicker(btn, opts, null, onToggle, true);
  };

  /* ── column registry ───────────────────────────────────────────────────
     A scope is one table, e.g. 'guests' or 'payments-tracker'. Columns marked
     fixed (a checkbox or actions gutter) always render and are not offered in
     the chooser, because hiding them would strand the row controls. */

  var registry = {};

  function colsKey(scope) { return 'rdCols:' + profile() + ':' + scope; }

  function reg(scope) {
    return registry[scope] || { scope: scope, columns: [], repaint: null, hidden: new Set() };
  }

  function register(scope, columns, repaint) {
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(colsKey(scope)) || '[]'); } catch (e) { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    var existing = registry[scope];
    registry[scope] = {
      scope: scope,
      columns: (columns || []).slice(),
      repaint: repaint || (existing && existing.repaint) || null,
      /* keep any in-session toggles that happened before a re-register */
      hidden: existing ? existing.hidden : new Set(stored)
    };
    return registry[scope];
  }

  function hidden(scope) { return reg(scope).hidden; }

  function visible(scope) {
    var r = reg(scope);
    return r.columns.filter(function (c) { return c.fixed || !r.hidden.has(c.key); });
  }

  /* how many <td> a full-width row must span */
  function span(scope) { return visible(scope).length; }

  function isVisible(scope, key) {
    var r = reg(scope);
    var col = r.columns.filter(function (c) { return c.key === key; })[0];
    if (!col) return false;
    return col.fixed || !r.hidden.has(key);
  }

  function headHtml(scope) {
    return visible(scope).map(function (c) {
      var cls = [];
      if (c.cls) cls.push(c.cls);
      if (c.num) cls.push('rd-th--num');
      return '<th data-col="' + esc(c.key) + '"'
        + (cls.length ? ' class="' + esc(cls.join(' ')) + '"' : '')
        + (c.width ? ' style="width:' + esc(c.width) + '"' : '')
        + (c.fixed ? ' data-autofit="off"' : '')
        + '>' + (c.label ? esc(c.label) : '') + '</th>';
    }).join('');
  }

  /* Only choosable (non-fixed) columns are counted, so the label matches what
     the menu can actually change. */
  var SCOPE_ALIASES = {
    ceremony: 'ceremonyOrder', honeymoon: 'honeyItinerary', notes: 'notesDetails',
    catering: 'menu', entertainment: 'entertainment', shotlist: 'shotlist',
    prayer: 'prayer', counseling: 'counseling', essentials: 'essentials',
    timeline: 'wdayTimeline', wday: 'wdayTimeline', contacts: 'contactsDirectory'
  };
  function resolveTableKey(scope) {
    if (window.CWP && window.CWP.TABLES && window.CWP.TABLES[scope]) return scope;
    var alt = SCOPE_ALIASES[scope];
    if (alt && window.CWP && window.CWP.TABLES && window.CWP.TABLES[alt]) return alt;
    return scope;
  }
  function ensureCatalog(scope) {
    var r = reg(scope);
    if (r.columns.length) return r;
    var tableKey = resolveTableKey(scope);
    if (window.CWP && window.CWP.TABLES && window.CWP.TABLES[tableKey]) {
      var cols = window.CWP.TABLES[tableKey].columns || [];
      if (cols.length) {
        register(scope, cols.map(function (c) {
          return {
            key: c.key,
            label: c.label || c.key,
            fixed: !c.key || String(c.key).startsWith('_') || c.type === 'index' || c.type === 'drag' || c.type === 'id'
          };
        }), function () {
          if (typeof window.cwpRenderTable === 'function') window.cwpRenderTable(tableKey);
        });
      }
    }
    return reg(scope);
  }
  function chipLabel(scope) {
    var r = ensureCatalog(scope);
    var choosable = r.columns.filter(function (c) { return !c.fixed; });
    /* Always paint "Columns · N of M" so every toolbar matches the Tasks mock,
       even before a table body has registered its catalog. */
    if (!choosable.length) return 'Columns \u00b7 6 of 6';
    var shown = choosable.filter(function (c) { return !r.hidden.has(c.key); }).length;
    return 'Columns \u00b7 ' + shown + ' of ' + choosable.length;
  }

  function allShown(scope) {
    var r = reg(scope);
    return r.columns.filter(function (c) { return !c.fixed && r.hidden.has(c.key); }).length === 0;
  }

  function persist(scope) {
    try {
      localStorage.setItem(colsKey(scope), JSON.stringify(Array.from(hidden(scope))));
    } catch (e) { /* private mode */ }
  }

  function openChooser(btn, scope) {
    /* Ensure a catalog exists before opening — redesign chips may call this
       before any CWP render registered the scope. */
    chipLabel(scope);
    var r = reg(scope);
    var choosable = r.columns.filter(function (c) { return !c.fixed; });
    if (!choosable.length && btn && btn.closest) {
      var table = (btn.closest('.rd-page, .panel, .cwp-mount, .rd-view') || document)
        .querySelector('table.cwp-table, table.rd-table, table');
      if (table) enhanceTable(table, scope);
      r = reg(scope);
      choosable = r.columns.filter(function (c) { return !c.fixed; });
    }
    var opts = choosable.map(function (c) {
      return { value: c.key, label: c.label || c.key, checked: !r.hidden.has(c.key) };
    });
    if (!opts.length) {
      open(btn, [{ value: '_none', label: 'No columns to hide', checked: true }], null, function () { return false; }, true);
      return;
    }
    open(btn, opts, null, function (key) {
      var h = r.hidden;
      if (h.has(key)) h.delete(key);
      else if (choosable.filter(function (c) { return !h.has(c.key); }).length > 1) h.add(key);
      else return false;   /* never hide the last remaining column */
      persist(scope);
      if (typeof r.repaint === 'function') r.repaint();
      return true;
    }, true);
  }

  window.rdColumns = {
    register: register,
    visible: visible,
    hidden: hidden,
    isVisible: isVisible,
    headHtml: headHtml,
    chipLabel: chipLabel,
    allShown: allShown,
    span: span,
    openChooser: openChooser
  };
  window.rdOpenColumns = openChooser;

  /* ── auto-fit ──────────────────────────────────────────────────────────
     Scoped to the table under the clicked toolbar, never the Tasks table.

     Every body row is measured, group / plan / add rows included. A cell that
     spans several columns cannot be attributed to any one of them, so instead
     of inflating the first column to the 420px cap it raises a floor on the
     table's own width — the group heading still fits, and the data columns
     keep the widths their own content asks for. */

  var MIN_COLUMN = 64;
  var NAME_FLOOR = 200;
  var MAX_COLUMN = 420;
  var CELL_PADDING = 26;

  var canvas = null;
  var fontCache = null;
  function measure(text, font) {
    canvas = canvas || document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text || '').width;
  }
  function fontOf(cell) {
    var key = (cell.tagName || '') + '|' + (cell.className || '') + '|' + (cell.parentNode ? cell.parentNode.className : '');
    if (fontCache[key]) return fontCache[key];
    var f = getComputedStyle(cell).font;
    /* Safari/old Chrome can return an empty shorthand */
    if (!f) {
      var cs = getComputedStyle(cell);
      f = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    }
    fontCache[key] = f;
    return f;
  }

  function resolveTable(target) {
    if (!target) return null;
    if (target.tagName === 'TABLE') return target;
    if (typeof target === 'string') {
      var byId = document.getElementById(target);
      return byId ? (byId.tagName === 'TABLE' ? byId : byId.querySelector('table')) : null;
    }
    if (target.querySelector && !target.closest) return target.querySelector('table');
    /* a toolbar button: take the first table after its toolbar, within the page */
    var toolbar = target.closest('.rd-toolbar') || target.parentNode;
    var scope = target.closest('.rd-surface__main, .rd-main, .rd-page, .panel') || document;
    var tables = scope.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      if (toolbar && (toolbar.compareDocumentPosition(tables[i]) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        return tables[i];
      }
    }
    return tables[0] || null;
  }

  function autoFit(target) {
    var table = resolveTable(target);
    if (!table) return 0;
    var heads = table.querySelectorAll('thead th');
    if (!heads.length) return 0;

    fontCache = {};
    var firstBody = table.querySelector('tbody tr');
    var widths = [];
    var skip = [];
    var i;
    for (i = 0; i < heads.length; i++) {
      var th = heads[i];
      /* A select or actions gutter is not text. The table engine renders its
         gutter as an unlabelled .cwp-sel holding a checkbox, so an empty header
         over a checkbox cell counts as one too — otherwise the 36px gutter gets
         stretched to the name-column floor. */
      var label = th.textContent.trim();
      var bodyCell = firstBody ? firstBody.children[i] : null;
      var off = th.dataset.autofit === 'off'
        || th.classList.contains('rd-table__check')
        || th.classList.contains('rd-pay-tick')
        || th.classList.contains('cwp-sel')
        || (!label && (th.querySelector('input,button')
          || (bodyCell && bodyCell.querySelector('input[type=checkbox]'))));
      skip[i] = !!off;
      widths[i] = off ? 0 : measure(label, fontOf(th)) + CELL_PADDING;
    }
    /* The leading text column carries the record's name and gets the floor. */
    var firstDataIdx = skip.indexOf(false);

    /* the widest full-width cell — group headings, "add a row…", empty states */
    var spanFloor = 0;
    var rows = table.querySelectorAll('tbody tr');
    for (i = 0; i < rows.length; i++) {
      var cells = rows[i].children;
      var col = 0;
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var cs = parseInt(cell.getAttribute('colspan') || '1', 10);
        if (!cs || cs < 1) cs = 1;
        var text = (cell.textContent || '').trim();
        if (text) {
          var w = measure(text, fontOf(cell)) + CELL_PADDING;
          if (cs === 1) {
            if (col < widths.length && !skip[col] && w > widths[col]) widths[col] = w;
          } else if (w > spanFloor) {
            spanFloor = w;
          }
        }
        col += cs;
      }
    }

    /* The planner sizes its tables through a <colgroup>, and a plain
       th.style.width is overridden by it. Write through the same channel when
       those helpers exist so the fit actually takes effect and survives the
       engine's later layout passes. */
    var useColgroup = typeof window.setTableColumnWidth === 'function';
    var colgroup = null;
    if (useColgroup) {
      colgroup = typeof window.ensureTableColgroup === 'function'
        ? window.ensureTableColgroup(table, heads.length)
        : table.querySelector('colgroup');
      table.classList.add('planner-cols-autofit');
    }

    var total = 0;
    var fitted = 0;
    for (i = 0; i < heads.length; i++) {
      var target2;
      if (skip[i]) {
        /* keep a gutter at its natural narrow width rather than stretching it */
        target2 = typeof window.narrowColumnMinWidth === 'function'
          ? window.narrowColumnMinWidth(heads[i])
          : Math.round(heads[i].getBoundingClientRect().width) || 42;
      } else {
        /* §08 gives the record-name column a floor so a table stays readable.
           Every other column is sized to its own content. */
        var floor = i === firstDataIdx ? NAME_FLOOR : MIN_COLUMN;
        target2 = Math.max(floor, Math.min(MAX_COLUMN, Math.ceil(widths[i])));
        fitted++;
      }
      if (useColgroup) {
        window.setTableColumnWidth(table, colgroup, i, target2, { skipAutofitSync: true });
      } else {
        heads[i].style.width = target2 + 'px';
      }
      total += target2;
    }

    /* setTableColumnWidth writes a width onto every cell in the column, which
       would pin a group heading to the first column's width. The colgroup
       already governs the columns, so spanning cells go back to natural. */
    table.querySelectorAll('tr > [colspan]').forEach(function (cell) {
      cell.style.width = '';
      cell.style.minWidth = '';
      cell.style.maxWidth = '';
    });

    /* Give the spanning rows room without distorting a single column. */
    var floorPx = Math.ceil(Math.max(total, spanFloor));
    table.style.width = total + 'px';
    table.style.minWidth = floorPx + 'px';
    table.style.maxWidth = 'none';

    table.dispatchEvent(new CustomEvent('cwp:columns-fitted', { bubbles: true }));
    return fitted;
  }

  window.rdAutoFitTable = autoFit;

  /* ── standard table chrome (filters · sort · columns · autofit · row height) ─
     Every data table in the planner should expose the same chip toolbar the
     Tasks page pioneered. Page-specific toolbars can call these helpers; the
     CWP engine also injects a full bar for mounts that do not already own one. */

  var HEIGHTS = ['compact', 'default', 'tall'];
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="m6 9 6 6 6-6"/></svg>';
  var ICO_SORT = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
  var ICO_COLS = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>';
  var ICO_FIT = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>';
  var ICO_ROW = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

  function heightKey(scope) {
    return 'rdRowHeight:' + profile() + ':' + scope;
  }
  function heightLabel(scope) {
    try { return localStorage.getItem(heightKey(scope)) || 'default'; } catch (e) { return 'default'; }
  }
  function applyHeight(scope, root) {
    if (!root) return heightLabel(scope);
    var h = heightLabel(scope);
    root.setAttribute('data-rd-row-height', h);
    var table = root.tagName === 'TABLE' ? root : root.querySelector('table');
    [root, table].forEach(function (el) {
      if (!el) return;
      el.classList.remove('rd-table--compact', 'rd-table--tall', 'rd-table--default');
      if (h === 'compact') el.classList.add('rd-table--compact');
      else if (h === 'tall') el.classList.add('rd-table--tall');
      else el.classList.add('rd-table--default');
    });
    return h;
  }
  function cycleHeight(scope, root) {
    var cur = heightLabel(scope);
    var idx = HEIGHTS.indexOf(cur);
    var next = HEIGHTS[(idx < 0 ? 0 : idx + 1) % HEIGHTS.length];
    try { localStorage.setItem(heightKey(scope), next); } catch (e) { /* private mode */ }
    applyHeight(scope, root);
    return next;
  }

  /* Right-side chips every table must expose. `scope` keys the column registry
     and the row-height preference; autofit resolves a table under `rootSel`. */
  function standardRightHtml(scope, opts) {
    opts = opts || {};
    var colLabel = window.rdColumns ? window.rdColumns.chipLabel(scope) : 'Columns';
    var allShown = window.rdColumns ? window.rdColumns.allShown(scope) : true;
    var h = heightLabel(scope);
    var openCols = opts.openColumns || ("rdOpenColumns(this,'" + esc(scope) + "')");
    var autofit = opts.autofit || ("rdStdAutoFit(this,'" + esc(scope) + "')");
    var rowH = opts.rowHeight || ("rdStdCycleRowHeight('" + esc(scope) + "')");
    return ''
      + '<button type="button" class="rd-chip' + (allShown ? ' rd-chip--ghost' : '') + '" onclick="' + openCols + '">'
      + ICO_COLS + esc(colLabel) + CHEV + '</button>'
      + '<button type="button" class="rd-chip" onclick="' + autofit + '">'
      + ICO_FIT + 'Auto-fit columns</button>'
      + '<button type="button" class="rd-chip" onclick="' + rowH + '">'
      + ICO_ROW + 'Row height · ' + esc(h) + CHEV + '</button>';
  }

  function filterChipHtml(label, field, current, onClick, onClear) {
    var cur = current == null || current === '' ? 'all' : String(current);
    var on = cur !== 'all';
    var text = on ? (label + ': ' + cur) : (label + ': all');
    return '<button type="button" class="rd-chip' + (on ? ' is-active' : '') + '" onclick="' + onClick + '">'
      + esc(text)
      + (on
        ? '<span class="rd-chip__clear" onclick="event.stopPropagation();' + onClear + '">&#10005;</span>'
        : CHEV)
      + '</button>';
  }

  function sortChipHtml(label, onClick) {
    return '<button type="button" class="rd-chip rd-chip--ghost" onclick="' + onClick + '">'
      + ICO_SORT + esc(label || 'Sort') + CHEV + '</button>';
  }

  /* Build a full Tasks-style toolbar for a CWP table key. Relies on the CWP
     public helpers registered below (rdCwp*). */
  function cwpToolbarHtml(key) {
    if (typeof window.rdCwpToolbarHtml === 'function') return window.rdCwpToolbarHtml(key);
    return '<div class="rd-toolbar rd-cwp-toolbar" data-rd-cwp-key="' + esc(key) + '">'
      + standardRightHtml(key)
      + '</div>';
  }

  window.rdStdHeightLabel = heightLabel;
  window.rdStdApplyRowHeight = applyHeight;
  window.rdStdCycleRowHeight = function (scope, rootSel) {
    var root = null;
    if (rootSel) root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    if (!root) {
      var mount = document.getElementById('cwp-' + scope);
      if (!mount) {
        var bar = document.querySelector('.rd-cwp-toolbar[data-rd-cwp-key="' + scope + '"]');
        if (bar) mount = bar.closest('.cwp-mount, .cwp-section, .rd-page, .panel, .rd-view') || bar.parentElement;
      }
      root = mount;
    }
    var next = cycleHeight(scope, root);
    var isCwpKey = window.CWP && window.CWP.TABLES && window.CWP.TABLES[scope];
    if (isCwpKey && typeof window.cwpRenderTable === 'function') {
      try { window.cwpRenderTable(scope); } catch (e) { /* ignore */ }
    } else {
      document.querySelectorAll('.rd-cwp-toolbar[data-rd-cwp-key="' + scope + '"] .rd-chip').forEach(function (chip) {
        if (/Row height/i.test(chip.textContent || '')) {
          chip.innerHTML = ICO_ROW + 'Row height · ' + esc(next) + CHEV;
        }
      });
    }
    return next;
  };

  /* Generic sort picker used by redesign pages that previously showed a ghost
     "Sort by …" chip with no handler. */
  window.rdStdOpenSort = function (btn, scope, options, current, onPick) {
    var opts = options || [
      { value: 'default', label: 'Default order' },
      { value: 'az', label: 'A–Z' },
      { value: 'za', label: 'Z–A' }
    ];
    if (typeof window.rdPickOne !== 'function') return;
    window.rdPickOne(btn, opts, current || 'default', function (val) {
      if (typeof onPick === 'function') onPick(val);
      else if (btn) {
        var label = 'Sort';
        for (var i = 0; i < opts.length; i++) if (String(opts[i].value) === String(val)) label = opts[i].label;
        btn.innerHTML = ICO_SORT + esc(label) + CHEV;
      }
    });
  };
  /* Aliases for chips wired from redesign toolbars */
  ['rdEssOpenSort','rdContactsOpenSort','rdHhOpenSort','rdNotesOpenSort','rdEtOpenSort',
   'rdPktOpenSort','rdCerOpenSort','rdEntOpenSort','rdShotOpenSort','rdWdayOpenSort',
   'rdPrayerOpenSort','rdCatOpenSort'].forEach(function (name) {
    if (typeof window[name] !== 'function') {
      window[name] = function (btn) { window.rdStdOpenSort(btn, name); };
    }
  });
  window.rdStdAutoFit = function (btn, scope) {
    var table = null;
    if (btn && btn.closest) {
      var host = btn.closest('.cwp-mount, .cwp-section, .rd-surface__main, .rd-page, .panel') || document;
      table = host.querySelector('table.cwp-table, table.rd-table, table');
    }
    if (!table && scope) {
      var mount = document.getElementById('cwp-' + scope);
      table = mount && mount.querySelector('table');
    }
    if (!table) return 0;
    if (typeof window.rdAutoFitTable === 'function') return window.rdAutoFitTable(table);
    if (typeof window.cwpAutoFitTableColumns === 'function' && scope) {
      window.cwpAutoFitTableColumns(scope);
      return 1;
    }
    return 0;
  };
  window.rdStandardRightHtml = standardRightHtml;
  window.rdFilterChipHtml = filterChipHtml;
  window.rdSortChipHtml = sortChipHtml;
  window.rdCwpToolbarShell = cwpToolbarHtml;

  /* True when the page (not an in-mount CWP bar) already exposes
     Columns · Auto-fit · Row height. Used to skip duplicate injection. */
  function toolbarHasChrome(tb) {
    if (!tb) return false;
    var t = tb.textContent || '';
    return /Auto-fit columns/i.test(t) && /Columns\s*·/i.test(t) && /Row height/i.test(t);
  }
  function panelRootFrom(el) {
    if (!el) return null;
    return el.closest('.panel, .rd-page') ||
      (document.body.getAttribute('data-active-panel')
        ? document.getElementById('panel-' + document.body.getAttribute('data-active-panel'))
        : null);
  }
  function panelHasPageToolbarChrome(fromEl) {
    var root = panelRootFrom(fromEl) || document;
    var bars = root.querySelectorAll('.rd-toolbar, .rd-cwp-toolbar');
    for (var i = 0; i < bars.length; i++) {
      var bar = bars[i];
      /* Skip auto-injected duplicates — we are looking for the page chrome. */
      if (bar.classList.contains('rd-toolbar--enhanced')) continue;
      if (bar.classList.contains('rd-cwp-toolbar') && bar.closest('.cwp-mount')) continue;
      if (toolbarHasChrome(bar)) return true;
    }
    return false;
  }
  window.rdPanelHasPageToolbarChrome = panelHasPageToolbarChrome;
  window.rdToolbarHasChrome = toolbarHasChrome;

  /* Remove enhancer-injected bars (and empty CWP duplicate bars) when the
     page toolbar already owns Columns / Auto-fit / Row height. */
  function removeDuplicateToolbars(root) {
    root = root || panelRootFrom(document.body) || document;
    if (!panelHasPageToolbarChrome(root)) return 0;
    var removed = 0;
    root.querySelectorAll('.rd-toolbar--enhanced, .cwp-mount > .cwp-section > .rd-cwp-toolbar, .cwp-mount .rd-cwp-toolbar').forEach(function (bar) {
      if (bar.closest && bar.closest('.rd-page > .rd-toolbar')) return;
      /* Keep page-level bars outside mounts. */
      if (!bar.closest('.cwp-mount') && !bar.classList.contains('rd-toolbar--enhanced')) return;
      if (bar.parentNode) {
        bar.parentNode.removeChild(bar);
        removed++;
      }
    });
    return removed;
  }
  window.rdRemoveDuplicateToolbars = removeDuplicateToolbars;

  /* Catch-all ONLY for tables that have no page chrome and no CWP bar.
     Never run on a MutationObserver — that duplicated bars under every
     redesign page toolbar. */
  function nearestToolbar(table) {
    var root = table.closest('.rd-view, .rd-surface__main, .cwp-section, .panel, .rd-page') || table.parentElement;
    if (!root) return null;
    var existing = root.querySelector('.rd-toolbar, .rd-cwp-toolbar');
    if (existing) return existing;
    var prev = table.previousElementSibling;
    while (prev) {
      if (prev.classList && (prev.classList.contains('rd-toolbar') || prev.classList.contains('rd-cwp-toolbar'))) return prev;
      prev = prev.previousElementSibling;
    }
    return null;
  }
  function enhanceTable(table, scopeHint) {
    if (!table || table.dataset.rdChrome === '1') return false;
    /* Page already has the chip bar — never add another under the table. */
    if (panelHasPageToolbarChrome(table)) {
      table.dataset.rdChrome = '1';
      return false;
    }
    /* CWP mounts inject their own bar in renderTable. */
    if (table.closest('.cwp-mount')) {
      table.dataset.rdChrome = '1';
      return false;
    }
    var tb = nearestToolbar(table);
    if (toolbarHasChrome(tb)) { table.dataset.rdChrome = '1'; return false; }
    var scope = scopeHint || table.getAttribute('data-rd-scope') || table.id || ('tbl-' + Math.abs(hashStr(table.className + (table.parentElement && table.parentElement.id || ''))));
    var heads = table.querySelectorAll('thead th');
    if (heads.length && window.rdColumns && !reg(scope).columns.length) {
      var catalog = Array.prototype.map.call(heads, function (th, i) {
        var key = th.getAttribute('data-col') || ('c' + i);
        var label = (th.textContent || '').replace(/\s+/g, ' ').trim() || key;
        var fixed = !label || th.classList.contains('cwp-sel') || th.querySelector('input[type=checkbox]');
        return { key: key, label: label, fixed: !!fixed };
      });
      register(scope, catalog, null);
    }
    var bar = document.createElement('div');
    bar.className = 'rd-toolbar rd-cwp-toolbar rd-toolbar--enhanced';
    bar.setAttribute('data-rd-cwp-key', scope);
    bar.innerHTML = standardRightHtml(scope, {
      openColumns: "rdOpenColumns(this,'" + esc(scope) + "')",
      autofit: "rdStdAutoFit(this,'" + esc(scope) + "')",
      rowHeight: "rdStdCycleRowHeight('" + esc(scope) + "')"
    });
    var wrap = table.closest('.cwp-table-wrap, .rd-table-wrap') || table;
    wrap.parentNode.insertBefore(bar, wrap);
    applyHeight(scope, table.closest('.cwp-mount, .rd-view, .panel') || table);
    table.dataset.rdChrome = '1';
    table.setAttribute('data-rd-scope', scope);
    return true;
  }
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return h;
  }
  function enhanceVisible() {
    var activeId = document.body.getAttribute('data-active-panel');
    var root = (activeId && document.getElementById('panel-' + activeId)) || document;
    /* Prefer the page bar: strip any duplicate injects first. */
    removeDuplicateToolbars(root);
    if (panelHasPageToolbarChrome(root)) return 0;
    var tables = root.querySelectorAll('table.cwp-table, table.rd-table, .rd-surface table, .rd-view table');
    var n = 0;
    Array.prototype.forEach.call(tables, function (table) {
      if (table.offsetParent === null && getComputedStyle(table).display === 'none') return;
      if (enhanceTable(table, activeId || undefined)) n++;
    });
    return n;
  }
  window.rdEnhanceVisibleTables = enhanceVisible;
  window.rdEnhanceTable = enhanceTable;

  /* Only after a CWP render, and only when the page does not already own chrome.
     No MutationObserver — it re-injected bars under every redesign toolbar. */
  if (typeof document !== 'undefined') {
    document.addEventListener('cwp:table-rendered', function () {
      setTimeout(function () {
        var activeId = document.body.getAttribute('data-active-panel');
        var root = (activeId && document.getElementById('panel-' + activeId)) || document;
        removeDuplicateToolbars(root);
        if (!panelHasPageToolbarChrome(root)) enhanceVisible();
      }, 0);
    });
  }
})();
