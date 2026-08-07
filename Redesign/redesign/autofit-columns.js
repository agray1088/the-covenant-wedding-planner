/* ═══════════════════════════════════════════════════════════════════════
   autoFitColumns(btn) — the per-table replacement for the app's global
   autoFitActivePanelTables().

   WHY THIS EXISTS
   The current planner puts auto-fit in the top bar, where it acts on
   "the active panel". That misfires on the several pages that carry two or
   three tables — catering has nine sections, ceremony has eight. Scoping the
   control to the toolbar directly above one table removes the ambiguity.

   CONTRACT
   - Called from a toolbar chip: onclick="autoFitColumns(this)"
   - Finds the nearest table AFTER the toolbar, inside the same .rd-main
   - Sizes each column to its widest rendered cell
   - Honours the name-column floor from the design spec (§08 column budget)
   - Does NOT persist: it writes the same widths a drag would write

   Drop this into js/ and add it to the script list in each page shell, or
   fold it into planner.js — it has no dependencies.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var NAME_COLUMN_FLOOR = 240;   /* §08: below this a table stops being readable */
  var MIN_COLUMN        = 64;
  var MAX_COLUMN        = 420;
  var CELL_PADDING      = 24;    /* 12px each side, matches --table-cell-x */

  function findTable(btn) {
    var toolbar = btn.closest('.rd-toolbar');
    if (!toolbar) return null;
    var scope = btn.closest('.rd-main') || document;
    /* the first table after this toolbar, in document order */
    var tables = scope.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      if (toolbar.compareDocumentPosition(tables[i]) & Node.DOCUMENT_POSITION_FOLLOWING) {
        return tables[i];
      }
    }
    return tables[0] || null;
  }

  /* measure text without reflowing the document */
  var canvas = null;
  function measure(text, font) {
    canvas = canvas || document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text || '').width;
  }

  function isNameColumn(th, index) {
    if (index === 0) return true;
    var label = (th.textContent || '').trim().toLowerCase();
    return /name|guest|task|item|vendor|contact|title|description|song|shot/.test(label);
  }

  window.autoFitColumns = function (btn) {
    var table = findTable(btn);
    if (!table) return;

    var headCells = table.querySelectorAll('thead th');
    if (!headCells.length) return;

    var bodyRows  = table.querySelectorAll('tbody tr');
    var headFont  = getComputedStyle(headCells[0]).font;
    var bodyFont  = bodyRows.length
      ? getComputedStyle(bodyRows[0].querySelector('td, th') || headCells[0]).font
      : headFont;

    for (var c = 0; c < headCells.length; c++) {
      var th = headCells[c];

      /* a checkbox or action column is not text — leave it alone */
      if (th.dataset.autofit === 'off' || th.classList.contains('rd-table__check')) continue;

      var widest = measure(th.textContent.trim(), headFont);

      for (var r = 0; r < bodyRows.length; r++) {
        var cell = bodyRows[r].children[c];
        if (!cell) continue;
        var w = measure(cell.textContent.trim(), bodyFont);
        if (w > widest) widest = w;
      }

      var target = Math.ceil(widest) + CELL_PADDING;
      var floor  = isNameColumn(th, c) ? NAME_COLUMN_FLOOR : MIN_COLUMN;

      target = Math.max(floor, Math.min(MAX_COLUMN, target));
      th.style.width = target + 'px';
    }

    /* let the rest of the app know, in case anything is listening */
    table.dispatchEvent(new CustomEvent('cwp:columns-fitted', { bubbles: true }));
  };
})();
