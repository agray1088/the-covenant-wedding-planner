/* ============================================================================
   TABLE STATUS PILLS — planner-wide
   Makes every table's status-type column render as a colored pill per
   m3-planner-mockup/components.html → "Status pills" (lines 72–124):
     schemes: green | blue | gold | red | neutral
     semantics: green  = complete, paid, confirmed, booked, accepted
                blue   = in progress, optional, tentative, 1 week
                gold   = pending, due, partial, maybe, medium
                red    = overdue, cancelled, declined, missing, high
                neutral= not started, waitlist, default / unset
   Editable cells (a <select>) are tagged so CSS paints the select as an
   interactive pill; read-only text cells are wrapped in span.status-pill.
   Purely additive — planner.js is not modified and existing change handlers
   on the selects are preserved (no DOM re-parenting of selects).
   ============================================================================ */
(function () {
  'use strict';

  /* Column headers that carry status semantics.
     Contains-based so variants match too ("RSVP Status", "Invite Decision",
     "Payment Status", "Booking Status"…), with a deny-list for look-alikes. */
  var COL_INCLUDE = /(status|priority|phase|rsvp|decision|invited|thank\s*you|thanks|packed|attending)/i;
  var COL_DENY = /(date|name|note|amount|total|cost|price|qty|quantity|count|email|phone|address|category|vendor|guest|task|link|url|time)/i;
  function isStatusCol(header) {
    var h = String(header || '').trim();
    if (!h) return false;
    if (COL_DENY.test(h)) return false;
    return COL_INCLUDE.test(h) || /^(done|completed|paid|payment)$/i.test(h);
  }

  /* ---- scheme resolvers (mirror the spec's semantics table) ---- */
  function priorityScheme(v) {
    v = norm(v);
    if (!v) return 'neutral';
    if (v.indexOf('high') > -1) return 'red';
    if (v.indexOf('low') > -1) return 'green';
    if (v.indexOf('medium') > -1 || v.indexOf('med') > -1) return 'gold';
    return 'neutral';
  }
  function phaseScheme(v) {
    v = norm(v);
    if (!v) return 'neutral';
    /* ranged phases first — "9-12 Months" also contains "12 month", so the
       specific ranges must be tested before the 12+ / wedding-day checks. */
    if (v.indexOf('9-12') > -1) return 'gold';
    if (v.indexOf('6-9') > -1) return 'red';
    if (v.indexOf('3-6') > -1 || v.indexOf('3 month') > -1) return 'blue';
    if (v.indexOf('week') > -1) return 'blue';
    if (v.indexOf('12+') > -1 || v.indexOf('12 month') > -1) return 'green';
    if (v.indexOf('wedding day') > -1 || v.indexOf('after') > -1) return 'green';
    if (v.indexOf('month') > -1) return 'gold';
    return 'neutral';
  }
  function statusScheme(v) {
    v = norm(v);
    if (!v || v === '—' || v === '-') return 'neutral';
    if (/not started|unconfirmed|not paid|not booked|waitlist|n\/a/.test(v)) return 'neutral';
    if (/overdue|cancel|declin|missing|do not|past due/.test(v)) return 'red';
    if (/complete|completed|paid|confirm|booked|accept|signed|sent|packed|\bdone\b|\byes\b/.test(v)) return 'green';
    if (/in progress|progress|optional|tentative|scheduled|contacted|considering|meeting/.test(v)) return 'blue';
    if (/pending|partial|\bdue\b|maybe|upcoming|quote|research|follow/.test(v)) return 'gold';
    if (/\bno\b/.test(v)) return 'red';
    return 'neutral';
  }
  function norm(v) { return String(v == null ? '' : v).trim().toLowerCase(); }

  function schemeFor(header, value) {
    var h = norm(header);
    if (h.indexOf('priority') > -1) return priorityScheme(value);
    if (h.indexOf('phase') > -1) return phaseScheme(value);
    return statusScheme(value);
  }

  /* ---- header lookup: map a cell to its column header text ---- */
  function headersOf(table) {
    if (table.__pillHeads && table.__pillHeadsRows === table.rows.length) return table.__pillHeads;
    var hr = table.querySelector('thead tr');
    var heads = hr ? Array.prototype.map.call(hr.children, function (th) {
      return String(th.textContent || '').replace(/[▾▴▲▼↑↓]/g, '').replace(/\s+/g, ' ').trim();
    }) : [];
    table.__pillHeads = heads;
    table.__pillHeadsRows = table.rows.length;
    return heads;
  }

  function colIndex(cell) {
    var i = 0, sib = cell;
    while ((sib = sib.previousElementSibling)) i += (sib.colSpan || 1);
    return i;
  }

  /* ---- apply to one table ---- */
  function doTable(table) {
    var heads = headersOf(table);
    if (!heads.length) return;
    var body = table.tBodies && table.tBodies[0];
    if (!body) return;

    Array.prototype.forEach.call(body.rows, function (tr) {
      Array.prototype.forEach.call(tr.cells, function (td) {
        var header = heads[colIndex(td)];
        if (!isStatusCol(header)) return;

        /* cell the planner already pilled (incl. its legacy task-status-wrap /
           task-priority-wrap spans) → OVERWRITE the scheme with the spec's and
           let CSS render the WRAP as the single spec pill. Tagging the inner
           select too would produce a pill inside a pill. */
        var existing = td.querySelector(LEGACY_PILL_SEL);
        if (existing) {
          respecPill(existing, header);
          return;
        }

        /* editable cell → tag the select (CSS paints it as a pill) */
        var sel = td.querySelector('select');
        if (sel) {
          paintSelect(sel, header);
          return;
        }

        /* skip cells holding other controls */
        if (td.querySelector('input, button, a')) return;

        /* read-only text → wrap once in a pill span */
        var txt = String(td.textContent || '').trim();
        if (!txt) return;
        if (td.firstElementChild && td.firstElementChild.hasAttribute &&
            td.firstElementChild.hasAttribute('data-pillscheme')) {
          var span = td.firstElementChild;
          if (span.textContent.trim() === txt) {
            span.setAttribute('data-pillscheme', schemeFor(header, txt));
            return;
          }
        }
        if (txt === '—' || txt === '-') return;
        var s = document.createElement('span');
        s.className = 'status-pill status-pill--compact';
        s.setAttribute('data-pillscheme', schemeFor(header, txt));
        s.textContent = txt;
        td.textContent = '';
        td.appendChild(s);
      });
    });
  }

  /* ---- overwrite a planner-rendered .status-pill with the spec scheme ----
     The planner emits aliases (--forest/--success/--amber/--warning/--danger/
     --muted/--grey/--info) and, because pillSchemeFor() is not defined in this
     build, often falls back to 'neutral'. We recompute from the pill's own
     value and rewrite the scheme class to the spec's 5 canonical schemes. */
  var SCHEME_ALIASES = /^status-pill--(green|blue|gold|red|neutral|forest|success|amber|warning|danger|muted|grey|gray|info)$/;

  /* Every legacy status pill/wrap the planner renders, across all pages. */
  var LEGACY_PILL_SEL = '.status-pill, .task-status-wrap, .task-priority-wrap, .task-phase-pill,' +
    ' .payment-status-pill, .guest-decision-pill, .gift-pill, .contract-status-pill, .budget-status-pill';
  var LEGACY_WRAP_RE = /\b(task-(status|priority)-wrap|task-phase-pill|payment-status-pill|guest-decision-pill|gift-pill|contract-status-pill|budget-status-pill)\b/;

  function respecPill(pill, header) {
    var sel = pill.querySelector('select');
    var value = sel ? sel.value : String(pill.textContent || '').trim();
    var scheme = schemeFor(header, value);

    /* the wrap is the pill — make sure the inner select isn't ALSO pilled
       (that produced the old-pill-behind-new-pill double border) */
    if (sel && sel.hasAttribute('data-pillscheme')) sel.removeAttribute('data-pillscheme');

    if (pill.getAttribute('data-pillscheme') !== scheme) {
      pill.setAttribute('data-pillscheme', scheme);
      var isLegacyWrap = LEGACY_WRAP_RE.test(pill.className || '');
      var keep = String(pill.className || '').split(/\s+/).filter(function (c) {
        if (!c) return false;
        if (SCHEME_ALIASES.test(c)) return false;                 // status-pill--<old scheme>
        if (/^task-(status|priority)-(?!wrap$)/.test(c)) return false; // task-status-complete etc.
        if (/^phase-/.test(c)) return false;                      // phase-12 / phase-9 / phase-month
        return true;
      });
      /* only add .status-pill to real pills; legacy wraps are styled by their
         own class + [data-pillscheme] so we don't change planner behaviour. */
      if (!isLegacyWrap && keep.indexOf('status-pill') === -1) keep.unshift('status-pill');
      if (!isLegacyWrap) keep.push('status-pill--' + scheme);
      /* marker so CSS can style wraps-with-a-select (interactive) vs plain pills
         generically, without listing every legacy class name. */
      keep = keep.filter(function (c) { return c !== 'spec-pill-wrap' && c !== 'spec-pill-plain'; });
      keep.push(sel ? 'spec-pill-wrap' : 'spec-pill-plain');
      pill.className = keep.join(' ');
    }

    /* keep it correct when the user changes the inner select */
    if (sel && sel.dataset.pillRespecBound !== '1') {
      sel.dataset.pillRespecBound = '1';
      sel.addEventListener('change', function () { respecPill(pill, header); });
      sel.addEventListener('input', function () { respecPill(pill, header); });
    }
  }

  function paintSelect(sel, header) {
    var scheme = schemeFor(header, sel.value);
    if (sel.getAttribute('data-pillscheme') !== scheme) sel.setAttribute('data-pillscheme', scheme);
    if (sel.dataset.pillBound !== '1') {
      sel.dataset.pillBound = '1';
      var repaint = function () { paintSelect(sel, header); };
      sel.addEventListener('change', repaint);
      sel.addEventListener('input', repaint);
    }
  }

  function run() {
    try {
      document.querySelectorAll('table').forEach(function (t) {
        // tables without a header row give us no column context
        if (!t.tHead) return;
        doTable(t);
      });
      /* pills outside tables (record cards, dashboard, hub previews) — no column
         header available, so use the generic status semantics. */
      document.querySelectorAll(LEGACY_PILL_SEL).forEach(function (p) {
        if (p.closest('table')) return;      // handled with column context above
        if (p.hasAttribute('data-pillscheme')) return;
        var cls = String(p.className || '');
        var ctx = /priorit/i.test(cls) ? 'priority' : (/phase/i.test(cls) ? 'phase' : 'status');
        respecPill(p, ctx);
      });
    } catch (e) { /* non-fatal */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  /* Tables re-render constantly (filters, saves, panel switches) — re-apply. */
  try {
    var pending = null;
    new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = null; run(); }, 80);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  window.plannerTableStatusPills = { refresh: run, schemeFor: schemeFor };
})();
