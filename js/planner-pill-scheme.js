/* ============================================================================
   pillSchemeFor() — the five status schemes
   ----------------------------------------------------------------------------
   planner.js calls this in eight places behind `typeof pillSchemeFor ===
   'function'` guards, but never defines it, so every pill has been falling
   back to neutral. This defines it.

   Written fresh from the semantics table in Redesign/covenant-design-spec.md.
   It is NOT a port of the deleted js/planner-table-status-pills.js, whose
   mapping contradicted the redesign: that file read blue as "in progress"
   and red as "declined". Here in-progress is GOLD and declined is GRAY, and
   blue is never a status at all.

     green  done, settled, confirmed, nothing owed
            Complete · Paid · Accepted · Confirmed · Booked
     gold   in motion, or needs a decision soon
            In progress · Due · Pending · Held, unpaid · Deposit only
     gray   not started, or deliberately inert
            Not started · Scheduled · Declined · Left open · Aged out
     red    wrong, late, or blocking something
            Overdue · Unowned · At risk · No vendor · Not booked
     blue   a fact, not a status
            counts, roles, categories, quantities

   If a state fits none of these it is a wording problem — rename the state
   rather than adding a colour.
   ========================================================================= */
(function (global) {
  'use strict';

  /* Order is load-bearing. "Not paid" contains "paid"; "partially paid"
     contains "paid"; "overdue" contains "due". Specific before general. */
  var RED = /(overdue|past due|\blate\b|at risk|unowned|no vendor|not booked|unbooked|not paid|unpaid|missing|blocked|conflict|cancell?ed|expired|failed|rejected|lapsed)/;
  var GOLD = /(in progress|in-progress|partial|deposit|\bheld\b|pending|\bdue\b|awaiting|in review|follow[ -]?up|upcoming|tentative|\bmaybe\b|\bquote\b|contacted|considering|negotiat|\bdraft\b|on hold|researching)/;
  var GRAY = /(not started|not scheduled|left open|aged out|declin|scheduled|waitlist|not set|unset|unassigned|inactive|archived|skipped|\bnone\b|\btbd\b|n\/a)/;
  var GREEN = /(complete|\bdone\b|paid in full|\bpaid\b|settled|accept|confirm|booked|signed|delivered|\bsent\b|received|approved|closed|attending|reserved|ready)/;

  /* Contexts whose values are facts rather than states: a gift category, a
     party role, a count. These are blue, and only blue. */
  var FACT_CONTEXTS = { gift: 1, category: 1, role: 1, count: 1, quantity: 1, type: 1 };

  function pillSchemeFor(value, context) {
    var v = String(value == null ? '' : value).trim().toLowerCase();
    var ctx = String(context == null ? 'status' : context).trim().toLowerCase();

    if (!v || v === '—' || v === '-' || v === '–') return 'gray';

    /* a fact, not a status */
    if (FACT_CONTEXTS[ctx]) return 'blue';
    if (/^\d+([.,]\d+)?$/.test(v)) return 'blue';

    /* explicit yes/no columns (Thank-you sent, Invited, Packed…) */
    if (v === 'yes' || v === 'y' || v === 'true') return 'green';
    if (v === 'no' || v === 'n' || v === 'false') return 'gray';

    if (RED.test(v)) return 'red';
    if (GOLD.test(v)) return 'gold';
    if (GRAY.test(v)) return 'gray';
    if (GREEN.test(v)) return 'green';

    /* Priority is a decision-urgency scale, not a lifecycle state. */
    if (ctx.indexOf('priority') > -1) {
      if (v.indexOf('high') > -1 || v.indexOf('urgent') > -1) return 'red';
      if (v.indexOf('medium') > -1 || v.indexOf('med') > -1) return 'gold';
      if (v.indexOf('low') > -1) return 'gray';
    }

    return 'gray';
  }

  global.pillSchemeFor = pillSchemeFor;

  /* ==========================================================================
     Tagging the planner's own wrappers
     --------------------------------------------------------------------------
     planner.js emits status controls as <span class="task-status-wrap">…</span>
     and friends, and those render paths never call pillSchemeFor. Neutralising
     the wrappers without tagging them leaves a bare select where the screens
     draw a pill, so this walks them and writes data-pillscheme.

     WHICH COLUMNS GET A PILL is taken from the screens, not guessed:
     in 9a (Planning Timeline & Tasks) only STATUS is a pill. Priority and
     Owner are plain 13px --text-muted text; Linked is a --text-link. Blue is
     used across the 44 screens only for facts — "4 guests", "Planner",
     "$1,840" — never for a lifecycle state.
     ====================================================================== */
  var PILLED = {
    'task-status-wrap':     'status',
    'payment-status-pill':  'payment',
    'guest-decision-pill':  'status',
    'contract-status-pill': 'contract',
    'budget-status-pill':   'status',
    'gift-pill':            'gift'
  };
  /* Drawn as plain text in the screens — deliberately absent from PILLED:
     task-priority-wrap, task-phase-pill. */

  function valueOf(el) {
    var sel = el.querySelector('select');
    if (sel) return sel.value;
    var inp = el.querySelector('input');
    if (inp) return inp.value;
    return el.textContent || '';
  }

  function tagOne(el, context) {
    var scheme = pillSchemeFor(valueOf(el), context);
    if (el.getAttribute('data-pillscheme') !== scheme) el.setAttribute('data-pillscheme', scheme);
    var sel = el.querySelector('select');
    if (sel && sel.dataset.pillBound !== '1') {
      sel.dataset.pillBound = '1';
      var repaint = function () { tagOne(el, context); };
      sel.addEventListener('change', repaint);
      sel.addEventListener('input', repaint);
    }
  }

  function tagAll(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    Object.keys(PILLED).forEach(function (cls) {
      scope.querySelectorAll('.' + cls).forEach(function (el) { tagOne(el, PILLED[cls]); });
    });
    /* .status-pill elements the planner renders itself, where the scheme class
       is missing or stale because pillSchemeFor was undefined when they were
       built. Only retag ones carrying no explicit scheme. */
    scope.querySelectorAll('.status-pill').forEach(function (p) {
      if (p.getAttribute('data-pillscheme')) return;
      if (/status-pill--(green|gold|gray|grey|red|blue)\b/.test(p.className || '')) return;
      tagOne(p, 'status');
    });
  }

  var busy = false;
  function run() {
    if (busy) return;
    busy = true;
    try { tagAll(document.getElementById('main') || document); }
    catch (e) { /* non-fatal */ }
    finally { busy = false; }
  }

  function start() {
    run();
    /* Tables re-render on every filter, sort, save and panel switch. Scoped to
       #main and debounced: the planner carries 41 tables and an unscoped
       observer re-walks all of them on any DOM change. */
    try {
      var target = document.getElementById('main') || document.body;
      var pending = null;
      new MutationObserver(function () {
        if (pending) return;
        pending = setTimeout(function () { pending = null; run(); }, 120);
      }).observe(target, { childList: true, subtree: true });
    } catch (e) { /* no observer; the initial pass still applied */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  global.covenantPillSchemes = { refresh: run, schemeFor: pillSchemeFor };
})(typeof window !== 'undefined' ? window : this);
