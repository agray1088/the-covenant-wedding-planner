/* ============================================================================
   INLINE / POP-OUT EDITOR — color-code Phase / Priority / Status selects
   Tags matching selects inside .record-editor-field with
   data-fieldscheme="green|blue|gold|red|neutral"; planner-inline-editor-color.css
   paints them as colored pills. Re-runs on change + when editors re-render.
   Purely additive: no planner.js functions are modified.
   ============================================================================ */
(function () {
  'use strict';

  /* Which fields get color-coded, by their visible label text. */
  var FIELD_MATCH = /^(phase|priority|status|rsvp( status)?|invite decision|payment status)$/i;

  function priorityScheme(v) {
    v = String(v || '').toLowerCase();
    if (!v) return 'neutral';
    if (v.indexOf('high') > -1) return 'red';
    if (v.indexOf('low') > -1) return 'green';
    return 'gold'; // medium
  }

  function phaseScheme(v) {
    v = String(v || '').toLowerCase();
    if (!v) return 'neutral';
    if (v.indexOf('12+') > -1 || v.indexOf('12 month') > -1) return 'green';
    if (v.indexOf('wedding day') > -1 || v.indexOf('after') > -1) return 'green';
    if (v.indexOf('9-12') > -1) return 'gold';
    if (v.indexOf('6-9') > -1) return 'red';
    if (v.indexOf('week') > -1) return 'blue';
    if (v.indexOf('3 month') > -1 || v.indexOf('3-6') > -1) return 'blue';
    if (v.indexOf('1 month') > -1 || v.indexOf('month') > -1) return 'gold';
    return 'neutral';
  }

  function statusScheme(v) {
    v = String(v || '').toLowerCase();
    if (!v) return 'neutral';
    if (/complete|completed|paid|booked|confirm|accept|\byes\b|done/.test(v)) return 'green';
    if (/in progress|progress|scheduled|tentative|contacted|considering/.test(v)) return 'blue';
    if (/pending|partial|due|maybe|upcoming|quote|research|waitlist\b/.test(v)) return 'gold';
    if (/overdue|cancel|declin|\bno\b|not booked|do not/.test(v)) return 'red';
    if (/not started|unconfirmed|not paid/.test(v)) return 'neutral';
    return 'neutral';
  }

  function schemeFor(labelText, value) {
    var l = String(labelText || '').trim().toLowerCase();
    if (l.indexOf('priority') > -1) return priorityScheme(value);
    if (l.indexOf('phase') > -1) return phaseScheme(value);
    return statusScheme(value); // status / rsvp / invite decision / payment status
  }

  function labelOf(field) {
    var lab = field.querySelector(':scope > label');
    return lab ? lab.textContent : '';
  }

  function paint(sel, labelText) {
    var scheme = schemeFor(labelText, sel.value);
    if (sel.getAttribute('data-fieldscheme') !== scheme) sel.setAttribute('data-fieldscheme', scheme);
  }

  function enhance(root) {
    root = root || document;
    var fields = root.querySelectorAll ? root.querySelectorAll('.record-editor-field') : [];
    Array.prototype.forEach.call(fields, function (field) {
      var sel = field.querySelector(':scope > select');
      if (!sel) return;
      var labelText = labelOf(field).trim();
      if (!FIELD_MATCH.test(labelText)) return;
      paint(sel, labelText);
      if (sel.dataset.schemeBound !== '1') {
        sel.dataset.schemeBound = '1';
        sel.addEventListener('change', function () { paint(sel, labelText); });
        sel.addEventListener('input', function () { paint(sel, labelText); });
      }
    });
  }

  function run() { try { enhance(document); } catch (e) { /* non-fatal */ } }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  /* Editors are re-rendered dynamically — re-tag when the DOM changes. */
  try {
    var pending = null;
    new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = null; run(); }, 60);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  window.plannerInlineEditorColors = { refresh: run, enhance: enhance };
})();
