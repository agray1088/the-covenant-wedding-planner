/* Vendor — planner-side manager for the Vendor Portal (a separate product,
   vendor-portal.html) plus a vendor document library. Lives in the Documents
   category beside Share Packets, because a vendor link and a vendor's paperwork
   are both things the couple hand off.

   Two views on one tab:
     · Share links — who holds a portal link, its state and expiry, with copy /
       preview / revoke; below it the scope contract (what a vendor can ever
       see) and the access lifecycle, the same rules the portal itself states.
     · Documents — the vendor-scoped paperwork already on file, derived live
       from Contracts, Invoices and Rentals. A view, not a second copy.

   Same-records contract: vendors come from data.vendors; documents from
   data.contracts / data.rentals; nothing is typed twice. Share state (revoked,
   sharedOn, token) is per-vendor housekeeping kept in data._vendorShares. */
(function () {
  'use strict';

  window._vendorView = window._vendorView || 'links';
  window._vendorRulesOpen = window._vendorRulesOpen || false;
  window._vendorDocFilter = window._vendorDocFilter || 'all';

  function esc(s) {
    return (typeof escapeHtml === 'function')
      ? escapeHtml(s == null ? '' : String(s))
      : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
  }

  function d() { return (typeof data !== 'undefined' && data) ? data : {}; }
  function vendors() { var v = d().vendors; return Array.isArray(v) ? v : []; }
  function contracts() { var c = d().contracts; return Array.isArray(c) ? c : []; }
  function rentals() { var r = d().rentals; return Array.isArray(r) ? r : []; }

  function weddingISO() { try { return (d().setup && d().setup.date) || ''; } catch (e) { return ''; } }
  function coupleNames() {
    try {
      var s = d().setup || {};
      var a = s.partner1 || s.brideName || s.bride || '';
      var b = s.partner2 || s.groomName || s.groom || '';
      if (a && b) return a + ' & ' + b;
      return s.coupleNames || s.weddingName || 'Your wedding';
    } catch (e) { return 'Your wedding'; }
  }

  /* Access ends four days after the wedding, by design (matches the portal). */
  function expiryLabel() {
    var iso = weddingISO();
    if (!iso) return 'four days after the wedding';
    var dt = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    if (isNaN(dt.getTime())) return 'four days after the wedding';
    dt.setDate(dt.getDate() + 4);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function slug(name) {
    return String(name || 'vendor').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'vendor';
  }

  /* Per-vendor share housekeeping — created lazily, not a tracked CWP table. */
  function shareStore() {
    var data = d();
    if (!data._vendorShares || typeof data._vendorShares !== 'object') data._vendorShares = {};
    return data._vendorShares;
  }
  function shareFor(name) {
    var store = shareStore();
    if (!store[name]) {
      store[name] = { token: slug(name) + '-' + Math.random().toString(36).slice(2, 6), revoked: false, sharedOn: '' };
    }
    return store[name];
  }

  /* A vendor is "shared" once a portal link exists (any active packet to them,
     or an explicit share here). Booked/contracted vendors are the natural
     candidates; researching ones are offered but not yet shared. */
  function shareState(v) {
    var sh = shareFor(v.name);
    if (sh.revoked) return 'revoked';
    var st = String(v.status || '').toLowerCase();
    if (sh.sharedOn) return 'active';
    if (/book|signed|confirm|quote received|meeting/.test(st)) return 'ready';
    return 'none';
  }

  function stateChip(state) {
    if (state === 'active') return '<span class="rd-vn-pill is-ok">Link active</span>';
    if (state === 'revoked') return '<span class="rd-vn-pill is-danger">Revoked</span>';
    if (state === 'ready') return '<span class="rd-vn-pill is-warn">Ready to share</span>';
    return '<span class="rd-vn-pill">Not shared</span>';
  }

  function portalUrl(v) {
    return 'vendor-portal.html?g=' + encodeURIComponent(shareFor(v.name).token);
  }

  function notify(msg) {
    if (typeof toast === 'function') { toast(msg); return; }
    if (typeof etShowToast === 'function') { etShowToast(msg); return; }
  }

  /* ── the scope contract (V6) and access lifecycle (V7) — the same rules the
        portal states, shown here for the planner deciding to share. ───────── */
  var SCOPE_ROWS = [
    { data: 'Their own contract', v: '✓', c: '✓', p: '✓', why: 'It is theirs. Withholding it creates email.' },
    { data: 'Their instalments and invoices', v: '✓', c: '✓', p: '✓', why: 'Both parties must see the same schedule.' },
    { data: 'Their slice of the run sheet', v: '✓', c: '✓', p: '✓', why: 'Derived live, so a moved dinner moves their page.' },
    { data: 'Headcount and dietary counts', v: 'counts', c: '✓', p: '✓', why: 'The kitchen needs numbers, not identities.' },
    { data: 'Venue access, loading, power', v: '✓', c: '✓', p: '✓', why: 'Operational, and the venue already told them.' },
    { data: 'Day-of contact for them', v: '2 numbers', c: '✓', p: '✓', why: 'The planner and the venue. Not the full list.' },
    { data: 'Guest names and addresses', v: '✕', c: '✓', p: '✓', why: 'No catering decision requires a name.' },
    { data: 'Budget totals and targets', v: '✕', c: '✓', p: '✓', why: 'Knowing the pot changes the next quote.' },
    { data: "Other vendors' pricing", v: '✕', c: '✓', p: '✓', why: 'Commercially theirs, not shared.' },
    { data: "Other vendors' run sheets", v: '✕', c: '✓', p: '✓', why: 'Only their own dependencies are surfaced.' },
    { data: 'The Covenant tab', v: '✕', c: '✓', p: 'granted', why: 'Private to the couple; planner access is opt-in.' },
    { data: 'Internal notes', v: '✕', c: '✓', p: '✓', why: 'Notes are candid by design.' },
    { data: 'Planner history', v: '✕', c: '✓', p: '✓', why: 'An audit log is not a shared artefact.' },
    { data: 'Saved views', v: '✕', c: 'own', p: 'own', why: 'Per person, never travels.' },
    { data: 'Share-packet activity', v: '✕', c: '✓', p: '✓', why: "Who opened what is the couple's business." }
  ];
  var LIFECYCLE = [
    { n: 1, t: 'Planner builds the packet', b: 'From Share Packets. Picks the vendor; the portal decides the contents from the scope contract — there is no content picker.' },
    { n: 2, t: 'Link is sent', b: 'A URL with an embedded token. No account, no password — the same trust model as a calendar invite.' },
    { n: 3, t: 'Vendor opens it', b: "Provenance banner names who shared it and when access ends. First open is logged in the couple's Share Packets · Activity view." },
    { n: 4, t: 'Vendor works from it', b: 'Reads their brief, accepts the schedule, uploads what they owe. Every write is attributed and lands as a note on their vendor record.' },
    { n: 5, t: 'Access expires', b: 'Four days after the wedding, automatically. Downloaded files stay theirs; the live view closes.' }
  ];
  var REVOKE = [
    { l: 'Stops the live link', v: 'immediately', ok: true },
    { l: 'Ends further downloads', v: 'immediately', ok: true },
    { l: 'Removes them from activity', v: 'no · the log is kept', ok: false },
    { l: 'Recalls a downloaded PDF', v: 'no · impossible', ok: false },
    { l: 'Deletes what they uploaded', v: "no · it is the couple's now", ok: false }
  ];

  function scopeMk(m) {
    if (m === '✓') return 'rd-vn-mk is-yes';
    if (m === '✕') return 'rd-vn-mk is-no';
    return 'rd-vn-mk is-part';
  }

  /* ── documents library — derived from Contracts / Invoices / Rentals ────── */
  function docRows() {
    var rows = [];
    contracts().forEach(function (c) {
      rows.push({
        name: c.name || (c.type || 'Document'),
        vendor: c.vendor || '—',
        type: c.type || 'Contract',
        status: c.status || '',
        amount: (c.amount != null && c.amount !== '') ? c.amount : (c.due || ''),
        date: c.date || '',
        where: c.where || '',
        source: 'Contracts'
      });
    });
    rentals().forEach(function (r) {
      rows.push({
        name: r.item || r.name || 'Rental',
        vendor: r.vendor || '—',
        type: 'Rental',
        status: r.status || '',
        amount: (r.amount != null && r.amount !== '') ? r.amount : (r.cost || ''),
        date: r.pickup || r.date || '',
        where: r.where || '',
        source: 'Rentals'
      });
    });
    return rows;
  }
  function fmtAmount(a) {
    if (a == null || a === '') return '—';
    if (typeof a === 'number') return '$' + a.toLocaleString();
    return String(a);
  }
  function docStatusChip(s) {
    var t = String(s || '').toLowerCase();
    if (/paid|signed|accepted|received/.test(t)) return '<span class="rd-vn-pill is-ok">' + esc(s) + '</span>';
    if (/invoiced|partial|pending|sent/.test(t)) return '<span class="rd-vn-pill is-warn">' + esc(s) + '</span>';
    if (/not signed|overdue|missing|unsigned/.test(t)) return '<span class="rd-vn-pill is-danger">' + esc(s) + '</span>';
    return s ? '<span class="rd-vn-pill">' + esc(s) + '</span>' : '<span class="rd-vn-muted">—</span>';
  }

  /* ── views ─────────────────────────────────────────────────────────────── */
  function linksViewHtml() {
    var vs = vendors();
    var rows = vs.map(function (v) {
      var state = shareState(v);
      var canShare = state !== 'none';
      var url = portalUrl(v);
      var actions = '';
      if (state === 'active') {
        actions =
          '<button type="button" class="rd-vn-act" onclick="rdVendorCopy(\'' + esc(v.name) + '\')">Copy link</button>' +
          '<button type="button" class="rd-vn-act" onclick="rdVendorPreview(\'' + esc(v.name) + '\')">Preview</button>' +
          '<button type="button" class="rd-vn-act is-danger" onclick="rdVendorRevoke(\'' + esc(v.name) + '\')">Revoke</button>';
      } else if (state === 'revoked') {
        actions = '<button type="button" class="rd-vn-act" onclick="rdVendorReshare(\'' + esc(v.name) + '\')">Re-share</button>';
      } else if (state === 'ready') {
        actions =
          '<button type="button" class="rd-vn-act is-primary" onclick="rdVendorShare(\'' + esc(v.name) + '\')">Create link</button>' +
          '<button type="button" class="rd-vn-act" onclick="rdVendorPreview(\'' + esc(v.name) + '\')">Preview</button>';
      } else {
        actions = '<span class="rd-vn-muted">Book or quote first</span>';
      }
      return '<div class="rd-vn-row rd-vn-row--links" role="row">'
        + '<div class="rd-vn-cell" role="cell"><div class="rd-vn-vname">' + esc(v.name) + '</div><div class="rd-vn-vsub">' + esc(v.cat || 'Vendor') + ' · ' + esc(v.status || '') + '</div></div>'
        + '<div class="rd-vn-cell" role="cell">' + stateChip(state) + '</div>'
        + '<div class="rd-vn-cell rd-vn-exp" role="cell">' + (state === 'active' ? esc(expiryLabel()) : '<span class="rd-vn-muted">—</span>') + '</div>'
        + '<div class="rd-vn-cell rd-vn-link" role="cell">' + (canShare ? '<code>' + esc(url) + '</code>' : '<span class="rd-vn-muted">—</span>') + '</div>'
        + '<div class="rd-vn-cell rd-vn-actions" role="cell">' + actions + '</div>'
        + '</div>';
    }).join('');

    if (!rows) rows = '<div class="rd-vn-empty">No vendors yet. Add vendors on the Venue &amp; Vendors page, then share a portal link here.</div>';

    var scope = window._vendorRulesOpen ? rulesHtml() : '';

    return ''
      + '<div class="rd-vn-card">'
      + '<div class="rd-vn-cardhead"><strong>Who holds a link</strong><span>' + vs.length + ' vendor' + (vs.length === 1 ? '' : 's') + ' · access expires ' + esc(expiryLabel()) + '</span></div>'
      + '<div class="rd-vn-grid rd-vn-grid--links" role="table">'
      + '<div class="rd-vn-row rd-vn-head" role="row"><div role="columnheader">Vendor</div><div role="columnheader">State</div><div role="columnheader">Expires</div><div role="columnheader">Portal link</div><div role="columnheader">Actions</div></div>'
      + rows
      + '</div>'
      + '</div>'
      + '<div class="rd-vn-rulesbar"><button type="button" class="rd-vn-rulesbtn" onclick="rdVendorToggleRules()">'
      + (window._vendorRulesOpen ? '▾ Hide the rules — scope contract &amp; access lifecycle' : '▸ The rules underneath — what a vendor can see, and how a link lives and dies')
      + '</button></div>'
      + scope;
  }

  function rulesHtml() {
    var scope = SCOPE_ROWS.map(function (r) {
      return '<div class="rd-vn-row rd-vn-row--scope" role="row">'
        + '<div class="rd-vn-cell rd-vn-scopedata" role="cell">' + esc(r.data) + '</div>'
        + '<div class="rd-vn-cell rd-vn-scopemk" role="cell"><span class="' + scopeMk(r.v) + '">' + esc(r.v) + '</span></div>'
        + '<div class="rd-vn-cell rd-vn-scopemk" role="cell"><span class="' + scopeMk(r.c) + '">' + esc(r.c) + '</span></div>'
        + '<div class="rd-vn-cell rd-vn-scopemk" role="cell"><span class="' + scopeMk(r.p) + '">' + esc(r.p) + '</span></div>'
        + '<div class="rd-vn-cell rd-vn-scopewhy" role="cell">' + esc(r.why) + '</div>'
        + '</div>';
    }).join('');
    var steps = LIFECYCLE.map(function (s) {
      return '<li class="rd-vn-step"><span class="rd-vn-stepn">' + s.n + '</span><div><strong>' + esc(s.t) + '</strong><em>' + esc(s.b) + '</em></div></li>';
    }).join('');
    var revoke = REVOKE.map(function (r) {
      return '<div class="rd-vn-revrow"><span>' + esc(r.l) + '</span><span class="rd-vn-pill ' + (r.ok ? 'is-ok' : 'is-danger') + '">' + esc(r.v) + '</span></div>';
    }).join('');

    return ''
      + '<div class="rd-vn-rules">'
      + '<div class="rd-vn-rulesec">'
      + '<div class="rd-pagehead__eyebrow">The scope contract</div>'
      + '<h3 class="rd-vn-rulesh">Fifteen rows deciding what a vendor can ever see</h3>'
      + '<p class="rd-vn-ruleslead">This is the security model, not a settings screen. Every ✕ is <b>absent from the query</b>, not filtered from a response — the reasons are what let you extend this table correctly in a year.</p>'
      + '<div class="rd-vn-grid rd-vn-grid--scope" role="table">'
      + '<div class="rd-vn-row rd-vn-head rd-vn-row--scope" role="row"><div role="columnheader">Data</div><div role="columnheader">Vendor</div><div role="columnheader">Couple</div><div role="columnheader">Planner</div><div role="columnheader">Why</div></div>'
      + scope
      + '</div>'
      + '</div>'
      + '<div class="rd-vn-rulesec">'
      + '<div class="rd-pagehead__eyebrow">Access lifecycle</div>'
      + '<h3 class="rd-vn-rulesh">How a vendor gets in, and out</h3>'
      + '<p class="rd-vn-ruleslead">Five steps from packet to expiry. No account creation anywhere — a caterer should not need a password to read their own call time.</p>'
      + '<ol class="rd-vn-steps">' + steps + '</ol>'
      + '<div class="rd-vn-revhead">What revoking actually achieves <span>stated in the revoke dialog too</span></div>'
      + revoke
      + '<p class="rd-vn-note">Honest revocation: it stops the link, it does not recall a PDF, and it does not delete what they uploaded.</p>'
      + '</div>'
      + '</div>';
  }

  function docsViewHtml() {
    var all = docRows();
    var vendorNames = [];
    all.forEach(function (r) { if (r.vendor && r.vendor !== '—' && vendorNames.indexOf(r.vendor) < 0) vendorNames.push(r.vendor); });
    var filter = window._vendorDocFilter || 'all';
    var rows = all.filter(function (r) { return filter === 'all' || r.vendor === filter; });

    var opts = '<option value="all"' + (filter === 'all' ? ' selected' : '') + '>All vendors</option>'
      + vendorNames.map(function (n) { return '<option value="' + esc(n) + '"' + (filter === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');

    var body = rows.map(function (r) {
      return '<div class="rd-vn-row rd-vn-row--docs" role="row">'
        + '<div class="rd-vn-cell" role="cell"><div class="rd-vn-vname">' + esc(r.name) + '</div>' + (r.where ? '<div class="rd-vn-vsub">' + esc(r.where) + '</div>' : '') + '</div>'
        + '<div class="rd-vn-cell" role="cell">' + esc(r.vendor) + '</div>'
        + '<div class="rd-vn-cell" role="cell">' + esc(r.type) + '</div>'
        + '<div class="rd-vn-cell" role="cell">' + docStatusChip(r.status) + '</div>'
        + '<div class="rd-vn-cell rd-vn-amt" role="cell">' + esc(fmtAmount(r.amount)) + '</div>'
        + '<div class="rd-vn-cell rd-vn-exp" role="cell">' + (r.date ? esc(r.date) : '<span class="rd-vn-muted">—</span>') + '</div>'
        + '</div>';
    }).join('');
    if (!body) body = '<div class="rd-vn-empty">No vendor documents on file yet. Contracts, invoices and rentals added on the Contracts page appear here.</div>';

    return ''
      + '<div class="rd-vn-card">'
      + '<div class="rd-vn-cardhead"><strong>Vendor paperwork on file</strong><span>' + rows.length + ' of ' + all.length + ' · from Contracts, Invoices &amp; Rentals — a view, not a copy</span>'
      + '<label class="rd-vn-filter">Vendor <select onchange="rdVendorDocFilter(this.value)">' + opts + '</select></label></div>'
      + '<div class="rd-vn-grid rd-vn-grid--docs" role="table">'
      + '<div class="rd-vn-row rd-vn-head rd-vn-row--docs" role="row"><div role="columnheader">Document</div><div role="columnheader">Vendor</div><div role="columnheader">Type</div><div role="columnheader">Status</div><div role="columnheader">Amount</div><div role="columnheader">Date</div></div>'
      + body
      + '</div>'
      + '<p class="rd-vn-note">Edit any document on the Contracts page — this list reflects it. The vendor sees only their own paperwork, in their portal.</p>'
      + '</div>';
  }

  function statsHtml() {
    var vs = vendors();
    var active = 0, revoked = 0;
    vs.forEach(function (v) { var s = shareState(v); if (s === 'active') active++; else if (s === 'revoked') revoked++; });
    var docs = docRows().length;
    function stat(label, val) {
      return '<div class="rd-stat"><div class="rd-stat__label">' + label + '</div><div class="rd-stat__value">' + val + '</div></div>';
    }
    return stat('Vendors', vs.length) + stat('Active links', active) + stat('Revoked', revoked) + stat('Documents on file', docs);
  }

  /* ── shell + render ────────────────────────────────────────────────────── */
  function render() {
    var panel = document.getElementById('panel-vendor');
    if (!panel) return;
    var view = window._vendorView || 'links';
    var token = vendors().length ? shareFor(vendors()[0].name).token : 'cat9';

    panel.innerHTML = '<div class="rd-page">'
      + '<div class="rd-pagehead">'
      + '<div><div class="rd-pagehead__eyebrow">Documents</div>'
      + '<div class="rd-pagehead__title-row"><h1 class="rd-pagehead__title">Vendor</h1></div>'
      + '<p class="rd-pagehead__sub">Portal links and paperwork for the people working your day — ' + esc(coupleNames()) + '</p></div>'
      + '<div class="rd-pagehead__actions">'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVendorOpenPortal()">Open Vendor Portal</button>'
      + '</div>'
      + '</div>'
      + '<div class="rd-stats rd-vn-stats">' + statsHtml() + '</div>'
      + '<div class="rd-viewswitch" role="group" aria-label="Vendor view">'
      + '<button type="button" class="rd-viewswitch__item' + (view === 'links' ? ' is-active' : '') + '" onclick="rdVendorSetView(\'links\')">Share links</button>'
      + '<button type="button" class="rd-viewswitch__item' + (view === 'documents' ? ' is-active' : '') + '" onclick="rdVendorSetView(\'documents\')">Documents</button>'
      + '</div>'
      + '<div class="rd-vn-body">' + (view === 'documents' ? docsViewHtml() : linksViewHtml()) + '</div>'
      + '</div>';
  }

  /* ── actions ───────────────────────────────────────────────────────────── */
  function setView(v) { window._vendorView = (v === 'documents') ? 'documents' : 'links'; render(); }
  function toggleRules() { window._vendorRulesOpen = !window._vendorRulesOpen; render(); }
  function docFilter(v) { window._vendorDocFilter = v || 'all'; render(); }

  function openPortal() {
    var token = vendors().length ? shareFor(vendors()[0].name).token : 'cat9';
    window.open('vendor-portal.html?g=' + encodeURIComponent(token), '_blank', 'noopener');
  }
  function preview(name) {
    window.open(portalUrl({ name: name }), '_blank', 'noopener');
  }
  function copyLink(name) {
    var url = new URL(portalUrl({ name: name }), window.location.href).toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { notify('Portal link copied for ' + name); })
        .catch(function () { if (typeof covPrompt === 'function') covPrompt('Copy the portal link:', { defaultValue: url }); });
    } else if (typeof covPrompt === 'function') {
      covPrompt('Copy the portal link:', { defaultValue: url });
    }
  }
  function share(name) {
    var sh = shareFor(name);
    sh.revoked = false;
    sh.sharedOn = new Date().toISOString().slice(0, 10);
    if (typeof save === 'function') save();
    notify('Portal link created for ' + name);
    render();
  }
  function reshare(name) { share(name); }
  function revoke(name) {
    var go = (typeof covConfirm === 'function')
      ? covConfirm('Revoke ' + name + "'s portal link? It stops the live link immediately. It does not recall anything they downloaded, and it does not delete what they uploaded — that is the couple's now.")
      : Promise.resolve(window.confirm('Revoke ' + name + "'s portal link?\n\nIt stops the live link immediately. It does not recall a downloaded PDF and does not delete their uploads."));
    Promise.resolve(go).then(function (ok) {
      if (!ok) return;
      var sh = shareFor(name);
      sh.revoked = true;
      if (typeof save === 'function') save();
      notify(name + "'s link revoked. Downloaded files stay theirs.");
      render();
    });
  }

  window.renderVendorRd = render;
  window.rdVendorSetView = setView;
  window.rdVendorToggleRules = toggleRules;
  window.rdVendorDocFilter = docFilter;
  window.rdVendorOpenPortal = openPortal;
  window.rdVendorPreview = preview;
  window.rdVendorCopy = copyLink;
  window.rdVendorShare = share;
  window.rdVendorReshare = reshare;
  window.rdVendorRevoke = revoke;

  function hookRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) window.SYSTEM_PANEL_RENDERERS.vendor = function () { render(); };
  }
  hookRenderer();
  var _showPanelVn = window.showPanel;
  if (typeof _showPanelVn === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelVn.call(window, id, forceOpen);
      hookRenderer();
      return out;
    };
  }
})();
