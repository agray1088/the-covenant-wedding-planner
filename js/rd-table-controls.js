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
  function chipLabel(scope) {
    var r = reg(scope);
    var choosable = r.columns.filter(function (c) { return !c.fixed; });
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
    var r = reg(scope);
    var choosable = r.columns.filter(function (c) { return !c.fixed; });
    var opts = choosable.map(function (c) {
      return { value: c.key, label: c.label || c.key, checked: !r.hidden.has(c.key) };
    });
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
})();
