/* Venue Comparison — live nav key `venue` / #panel-venue.
   Inventory (§11.1a): no dedicated All.dc / Views / Drawers badge.
   Sources used:
     · §07 page anatomy (rd-page · stats · toolbar · surface · 360 drawer)
     · Live legacy stats + VENUE_FIELDS + shortlist/compare/notes/reminders
     · redesign/pages/vendors.html “Venue arrangements” + “Reminders” copy
   Views: Compare | Details | Notes (Compare is the page’s job).
   Rail: All venues · Ceremony · Reception · Shortlist · Incomplete details.
   Full editor: no §16 venue entity — focuses Details with all fields shown. */
(function () {
  'use strict';

  window._venMode = window._venMode || 'compare';
  window._venRailView = window._venRailView || 'all';
  window._venDetailKind = window._venDetailKind || (typeof currentVenueView === 'string' ? currentVenueView : 'c');
  window._venDrawerKind = window._venDrawerKind || null;
  window._venShowFull = window._venShowFull || false;
  window._venTypeFilter = window._venTypeFilter || 'all';

  const DETAIL_FIELDS = [
    { key: 'name', label: 'Venue Name', span: false },
    { key: 'contact', label: 'Contact Name', span: false },
    { key: 'address', label: 'Address', span: true },
    { key: 'phone', label: 'Phone / Email', span: false },
    { key: 'capacity', label: 'Capacity', span: false },
    { key: 'space', label: 'Venue Type', span: false, ph: 'Indoor, Outdoor, Garden, Chapel…' },
    { key: 'hours', label: 'Rental Hours', span: false, ph: 'e.g. 3pm–6pm' },
    { key: 'cost', label: 'Total Cost', span: false, ph: '$2,500' },
    { key: 'deposit', label: 'Deposit Paid', span: false, ph: '$500' },
    { key: 'setup', label: 'Setup Time', span: false },
    { key: 'parking', label: 'Parking Info', span: true },
    { key: 'best', label: 'Best For', span: true },
    { key: 'amenities', label: 'Amenities', span: true, area: true },
    { key: 'food', label: 'Food & Drink Rules', span: true, area: true },
    { key: 'cancel', label: 'Cancellation Policy', span: true, area: true },
    { key: 'other', label: 'Other Important Info', span: true, area: true }
  ];

  const COMPARE_ROWS = [
    ['Type', 'type'],
    ['Indoor / Outdoor', 'space'],
    ['Capacity', 'cap'],
    ['Rental Hours', 'hours'],
    ['Cost', 'cost'],
    ['Deposit', 'depositLabel'],
    ['Contact', 'phone']
  ];

  const REMINDER_CHECKS = [
    ['name', 'Venue name added'],
    ['contact', 'Contact name saved'],
    ['address', 'Address saved'],
    ['capacity', 'Capacity listed'],
    ['hours', 'Rental hours added'],
    ['cost', 'Cost / deposit noted'],
    ['setup', 'Setup time added'],
    ['parking', 'Parking info included'],
    ['best', 'Best for notes added'],
    ['amenities', 'Amenities listed'],
    ['food', 'Food & drink rules reviewed'],
    ['cancel', 'Cancellation policy reviewed']
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function venueData() {
    if (!window.data) window.data = {};
    if (!data.venue || typeof data.venue !== 'object') data.venue = {};
    if (!Array.isArray(data.venue.shortlist)) data.venue.shortlist = [];
    return data.venue;
  }

  function text(v, fallback) {
    if (typeof venueText === 'function') return venueText(v, fallback == null ? '—' : fallback);
    const s = v == null ? '' : String(v).trim();
    return s || (fallback == null ? '—' : fallback);
  }

  function currency(v) {
    if (typeof venueCurrency === 'function') return venueCurrency(v);
    const raw = String(v || '').trim();
    if (!raw) return '—';
    const m = raw.match(/\$[\d,]+(?:\.\d{2})?/);
    return m ? m[0] : raw;
  }

  function num(v) {
    if (typeof venueNumber === 'function') return venueNumber(v);
    const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function depositLabel(costText, depositText) {
    if (typeof venueDepositLabel === 'function') return venueDepositLabel(costText, depositText);
    const deposit = num(depositText);
    const cost = num(costText);
    if (deposit && cost) return 'Deposit Paid (' + Math.round(deposit / cost * 100) + '%)';
    if (deposit || String(depositText || '').trim()) return 'Deposit Paid';
    return 'Deposit not added';
  }

  function fieldFilled(prefix, key) {
    const v = venueData();
    if (key === 'cost') {
      return !!(String(v[prefix + '-cost'] || '').trim() || String(v[prefix + '-deposit'] || '').trim());
    }
    return !!String(v[prefix + '-' + key] || '').trim();
  }

  function incompleteCount(prefix) {
    return REMINDER_CHECKS.filter(([key]) => !fieldFilled(prefix, key)).length;
  }

  function venueCards() {
    if (typeof compareVenueCards === 'function') return compareVenueCards();
    const v = venueData();
    const setup = (window.data && data.setup) || {};
    const builtIns = [
      {
        kind: 'c', builtin: true,
        title: text(v['c-name'], setup['venue-ceremony'] || 'Ceremony Venue'),
        type: 'Ceremony',
        space: text(v['c-space'], 'Indoor / Outdoor'),
        cap: text(v['c-capacity'], 'Add capacity'),
        address: text(v['c-address'], 'Add address'),
        cost: currency(v['c-cost']),
        deposit: currency(v['c-deposit']),
        depositLabel: depositLabel(v['c-cost'], v['c-deposit']),
        hours: text(v['c-hours'], 'Add hours'),
        phone: text(v['c-phone'], 'Add phone / email')
      },
      {
        kind: 'r', builtin: true,
        title: text(v['r-name'], setup['venue-reception'] || 'Reception Venue'),
        type: 'Reception',
        space: text(v['r-space'], 'Indoor / Outdoor'),
        cap: text(v['r-capacity'], 'Add capacity'),
        address: text(v['r-address'], 'Add address'),
        cost: currency(v['r-cost']),
        deposit: currency(v['r-deposit']),
        depositLabel: depositLabel(v['r-cost'], v['r-deposit']),
        hours: text(v['r-hours'], 'Add hours'),
        phone: text(v['r-phone'], 'Add phone / email')
      }
    ];
    const extra = (v.shortlist || []).map((x, i) => ({
      kind: 'x' + i, idx: i, builtin: false,
      title: text(x.name, 'Additional Venue'),
      type: text(x.type, 'Comparison'),
      space: text(x.space, 'Indoor / Outdoor'),
      cap: text(x.capacity, 'Add capacity'),
      address: text(x.address, 'Add address'),
      cost: currency(x.cost),
      deposit: currency(x.deposit),
      depositLabel: depositLabel(x.cost, x.deposit),
      hours: text(x.hours, 'Add hours'),
      phone: text(x.contact, 'Add contact / notes')
    }));
    return builtIns.concat(extra);
  }

  function cardByKind(kind) {
    return venueCards().find(c => c.kind === kind) || null;
  }

  function venueFigures() {
    const v = venueData();
    const setup = (window.data && data.setup) || {};
    const ceremonyName = text(v['c-name'], setup['venue-ceremony'] || '—');
    const receptionName = text(v['r-name'], setup['venue-reception'] || '—');
    const cSub = text(v['c-address'], 'Add ceremony venue details');
    const rSub = text(v['r-address'], 'Add reception venue details');
    const cCap = num(v['c-capacity']);
    const rCap = num(v['r-capacity']);
    const maxCap = cCap || rCap ? Math.max(cCap || 0, rCap || 0) : num(setup.guests);
    const costText = [currency(v['c-cost']), currency(v['r-cost'])].filter(x => x && x !== '—');
    const costSummary = costText.length ? costText.join(' · ') : '—';
    const depositText = [currency(v['c-deposit']), currency(v['r-deposit'])].filter(x => x && x !== '—');
    const shortlist = (v.shortlist || []).length;
    const incomplete = incompleteCount('c') + incompleteCount('r');
    const all = 2 + shortlist;
    return {
      ceremonyName: ceremonyName,
      receptionName: receptionName,
      cSub: cSub,
      rSub: rSub,
      maxCap: maxCap,
      costSummary: costSummary,
      depositText: depositText,
      shortlist: shortlist,
      incomplete: incomplete,
      all: all,
      ceremonyIncomplete: incompleteCount('c'),
      receptionIncomplete: incompleteCount('r')
    };
  }

  function venueRailCounts() {
    const f = venueFigures();
    return {
      all: f.all,
      ceremony: 1,
      reception: 1,
      shortlist: f.shortlist,
      incomplete: f.incomplete
    };
  }

  function matchesRail(card, view) {
    view = view || window._venRailView || 'all';
    if (view === 'all') return true;
    if (view === 'ceremony') return card.kind === 'c';
    if (view === 'reception') return card.kind === 'r';
    if (view === 'shortlist') return !card.builtin;
    if (view === 'incomplete') {
      if (card.kind === 'c') return incompleteCount('c') > 0;
      if (card.kind === 'r') return incompleteCount('r') > 0;
      if (!card.builtin) {
        const x = venueData().shortlist[card.idx] || {};
        return !String(x.name || '').trim() || !String(x.capacity || '').trim() || !String(x.cost || '').trim();
      }
    }
    return true;
  }

  function matchesTypeFilter(card) {
    const f = window._venTypeFilter || 'all';
    if (f === 'all') return true;
    if (f === 'ceremony') return card.kind === 'c' || /ceremony/i.test(String(card.type || ''));
    if (f === 'reception') return card.kind === 'r' || /reception/i.test(String(card.type || ''));
    if (f === 'comparison') return !card.builtin;
    return true;
  }

  function pageheadActionsHtml() {
    const mode = window._venMode || 'compare';
    let html = '';
    html += '<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>';
    html += '<button type="button" class="rd-btn" onclick="rdVenFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>';
    if (mode === 'details') {
      html += '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'contracts\')">Open the contract</button>';
    }
    if (mode === 'compare' || mode === 'details') {
      html += '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVenAddVenue()">+ Add venue</button>';
    } else {
      html += '<button type="button" class="rd-btn rd-btn--primary" onclick="rdVenEditNote()">Edit note</button>';
    }
    return html;
  }

  function uedVenueShellRd() {
    const panel = document.getElementById('panel-venue');
    if (!panel) return;
    panel.classList.add('ued-scope', 'venue-mockup');
    if (panel.dataset.uedShell === 'venue-rd') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'venue-rd';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Vendors</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Venue Comparison</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="venue-stats" aria-label="Venue summary"></div>
      <div class="rd-toolbar" id="venue-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="venue-surface-row">
          <div class="rd-surface__main" id="venue-view-host">
            <div class="rd-view" id="ven-view-compare" data-ven-view="compare">
              <div id="venue-shortlist-grid" class="rd-ven-cards"></div>
              <div id="venue-compare-table" class="rd-ven-compare"></div>
              <div id="venue-extra-list" class="rd-ven-extra" hidden></div>
            </div>
            <div class="rd-view" id="ven-view-details" data-ven-view="details" hidden>
              <div class="rd-section__head">
                <div class="rd-pagehead__eyebrow">Venue arrangements</div>
                <p class="rd-help">Rooms, timings and what the hire includes.</p>
                <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="typeof showPanel==='function'&&showPanel('contracts')">Open the contract</button>
              </div>
              <div class="rd-ven-detail-toggle" id="venue-detail-toggle"></div>
              <div id="venue-details-form" class="rd-ven-details"></div>
            </div>
            <div class="rd-view" id="ven-view-notes" data-ven-view="notes" hidden>
              <div class="rd-section__head">
                <div class="rd-pagehead__eyebrow">Notes</div>
                <p class="rd-help">Comparison thoughts, questions to ask, and follow-ups.</p>
                <button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdVenEditNote()">Edit note</button>
              </div>
              <div id="venue-note-stack" class="rd-ven-notes"></div>
              <div class="rd-section__head" style="margin-top:22px">
                <div class="rd-pagehead__eyebrow">Reminders</div>
                <p class="rd-help">Dates the venue has set that nothing else tracks.</p>
              </div>
              <div id="venue-reminder-list" class="venue-reminder-list rd-ven-reminders"></div>
              <div id="venue-reminder-summary" class="rd-ven-reminder-summary"></div>
            </div>
          </div>
          <div id="venue-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderVenueStatsRd() {
    const host = document.getElementById('venue-stats');
    if (!host) return;
    const f = venueFigures();
    const mode = window._venMode || 'compare';
    const costSub = f.depositText.length
      ? 'Deposit paid: ' + f.depositText.join(' · ')
      : (f.costSummary !== '—' ? 'Ceremony and reception costs' : 'Track your venue investment');

    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      if (mode === 'compare') {
        RdDepth.renderStats(host, [
          { label: 'Ceremony venue', value: f.ceremonyName, filter: 'Ceremony', onFilter: () => applyVenueRailView('ceremony') },
          { label: 'Reception venue', value: f.receptionName, filter: 'Reception', onFilter: () => applyVenueRailView('reception') },
          { label: 'Shortlist', value: String(f.shortlist), filter: 'Shortlist', onFilter: () => applyVenueRailView('shortlist') },
          {
            label: 'Incomplete',
            value: String(f.incomplete),
            filter: 'Incomplete details',
            attention: f.incomplete ? 'Venue fields still missing' : undefined,
            onFilter: () => applyVenueRailView('incomplete')
          },
          { label: 'Cost / deposit', value: f.costSummary, filter: 'Costs' }
        ]);
        return;
      }
      if (mode === 'notes') {
        RdDepth.renderStats(host, [
          { label: 'Ceremony venue', value: f.ceremonyName, filter: 'Ceremony' },
          { label: 'Reception venue', value: f.receptionName, filter: 'Reception' },
          {
            label: 'Ceremony gaps',
            value: String(f.ceremonyIncomplete),
            filter: 'Ceremony',
            attention: f.ceremonyIncomplete ? 'Ceremony details incomplete' : undefined
          },
          {
            label: 'Reception gaps',
            value: String(f.receptionIncomplete),
            filter: 'Reception',
            attention: f.receptionIncomplete ? 'Reception details incomplete' : undefined
          },
          { label: 'Guest capacity', value: f.maxCap ? String(f.maxCap) : '—', filter: 'Capacity' }
        ]);
        return;
      }
      RdDepth.renderStats(host, [
        { label: 'Ceremony venue', value: f.ceremonyName, filter: 'Ceremony', onFilter: () => { window._venDetailKind = 'c'; applyVenueRailView('ceremony'); } },
        { label: 'Reception venue', value: f.receptionName, filter: 'Reception', onFilter: () => { window._venDetailKind = 'r'; applyVenueRailView('reception'); } },
        { label: 'Guest capacity', value: f.maxCap ? String(f.maxCap) : '—', filter: 'Capacity' },
        { label: 'Cost / deposit', value: f.costSummary, filter: 'Costs' }
      ]);
      return;
    }

    host.innerHTML = [
      ['Ceremony venue', f.ceremonyName, f.cSub],
      ['Reception venue', f.receptionName, f.rSub],
      ['Guest capacity', f.maxCap ? String(f.maxCap) : '—', f.maxCap ? 'Largest listed capacity' : 'Comfortable seating overview'],
      ['Cost / deposit', f.costSummary, costSub]
    ].map(([l, v, s]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(v)}</div><div class="m-stat-sub">${esc(s)}</div></div>`
    ).join('');
  }

  function renderVenueToolbar() {
    const host = document.getElementById('venue-toolbar');
    if (!host) return;
    const mode = window._venMode || 'compare';
    const type = window._venTypeFilter || 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    const typeLabel = type === 'all' ? 'Type: all' : 'Type: ' + type;
    host.innerHTML =
      `<button type="button" class="rd-chip${type !== 'all' ? ' is-active' : ''}" onclick="rdVenCycleTypeFilter()">${esc(typeLabel)}${chev}</button>` +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVenFocusCeremony()">Ceremony</button>` +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="rdVenFocusReception()">Reception</button>` +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Venue view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'compare' ? ' is-active' : ''}" onclick="rdSetVenueView('compare')">Compare</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'details' ? ' is-active' : ''}" onclick="rdSetVenueView('details')">Details</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'notes' ? ' is-active' : ''}" onclick="rdSetVenueView('notes')">Notes</button>` +
      `</div></div>`;
  }

  function applyViewMode() {
    const mode = window._venMode || 'compare';
    ['compare', 'details', 'notes'].forEach(name => {
      const el = document.getElementById('ven-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetVenueView(mode) {
    window._venMode = mode || 'compare';
    if (mode === 'details' && (window._venRailView === 'ceremony' || window._venRailView === 'reception')) {
      window._venDetailKind = window._venRailView === 'reception' ? 'r' : 'c';
    }
    if (typeof _venTab !== 'undefined') {
      window._venTab = mode === 'notes' ? 'notes' : (mode === 'details' ? 'details' : 'details');
    }
    renderVenueRd();
  }

  function applyVenueRailView(viewId) {
    window._venRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('venue', window._venRailView);
    if (viewId === 'ceremony') {
      window._venDetailKind = 'c';
      if (window._venMode === 'notes') { /* keep */ }
      else if (window._venMode !== 'compare') window._venMode = 'details';
    } else if (viewId === 'reception') {
      window._venDetailKind = 'r';
      if (window._venMode !== 'compare' && window._venMode !== 'notes') window._venMode = 'details';
    } else if (viewId === 'shortlist') {
      window._venMode = 'compare';
    } else if (viewId === 'incomplete') {
      window._venMode = window._venMode === 'notes' ? 'notes' : 'details';
    }
    renderVenueRd();
  }

  function rdVenCycleTypeFilter() {
    const order = ['all', 'ceremony', 'reception', 'comparison'];
    const i = order.indexOf(window._venTypeFilter || 'all');
    window._venTypeFilter = order[(i + 1) % order.length];
    renderVenueRd();
  }

  function rdVenFocusCeremony() {
    window._venDetailKind = 'c';
    window._venRailView = 'ceremony';
    if (window._venMode === 'compare') {
      rdVenOpenDrawer('c');
      return;
    }
    window._venMode = 'details';
    renderVenueRd();
  }

  function rdVenFocusReception() {
    window._venDetailKind = 'r';
    window._venRailView = 'reception';
    if (window._venMode === 'compare') {
      rdVenOpenDrawer('r');
      return;
    }
    window._venMode = 'details';
    renderVenueRd();
  }

  function rdVenAddVenue() {
    if (typeof addBlankCompareVenue === 'function') {
      addBlankCompareVenue();
      window._venMode = 'compare';
      window._venRailView = 'shortlist';
      const list = venueData().shortlist || [];
      if (list.length) rdVenOpenDrawer('x' + (list.length - 1));
      else renderVenueRd();
      return;
    }
    venueData().shortlist.push({
      name: 'New Venue', type: 'Comparison', space: 'Indoor / Outdoor',
      capacity: '', address: '', cost: '', deposit: '', contact: '', hours: ''
    });
    if (typeof save === 'function') save();
    window._venMode = 'compare';
    renderVenueRd();
  }

  function rdVenFullEditor() {
    window._venMode = 'details';
    window._venShowFull = true;
    if (window._venRailView === 'reception') window._venDetailKind = 'r';
    else if (window._venRailView === 'ceremony') window._venDetailKind = 'c';
    renderVenueRd();
    const form = document.getElementById('venue-details-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function rdVenEditNote() {
    window._venNoteEditing = true;
    window._venMode = 'notes';
    renderVenueRd();
  }

  function syncBuiltinFieldsFromDom() {
    const v = venueData();
    DETAIL_FIELDS.forEach(f => {
      ['c', 'r'].forEach(prefix => {
        const el = document.getElementById('ven-' + prefix + '-' + f.key);
        if (el) v[prefix + '-' + f.key] = el.value;
      });
    });
  }

  function rdVenSaveField(prefix, key, value) {
    const v = venueData();
    v[prefix + '-' + key] = value;
    if (typeof save === 'function') save();
    if (typeof renderWhenInputComplete === 'function') {
      renderWhenInputComplete(renderVenueRd);
    } else {
      renderVenueStatsRd();
      if (typeof renderContextSidebar === 'function'
        && document.body.getAttribute('data-active-panel') === 'venue') {
        renderContextSidebar('venue');
      }
    }
  }

  function rdVenSaveExtra(idx, key, value) {
    const list = venueData().shortlist;
    if (!list[idx]) return;
    list[idx][key] = value;
    if (typeof save === 'function') save();
    if (typeof renderWhenInputComplete === 'function') {
      renderWhenInputComplete(function () {
        renderVenueCompareView();
        renderVenueDrawer();
        renderVenueStatsRd();
      });
    } else {
      renderVenueCompareView();
      renderVenueDrawer();
    }
  }

  function renderVenueCompareView() {
    const wrap = document.getElementById('venue-shortlist-grid');
    const compare = document.getElementById('venue-compare-table');
    if (!wrap || !compare) return;
    const cards = venueCards().filter(c => matchesRail(c) && matchesTypeFilter(c));
    const allCards = venueCards().filter(c => matchesRail(c, window._venRailView === 'incomplete' ? 'all' : window._venRailView) && matchesTypeFilter(c));
    const matrixCards = allCards.length ? allCards : venueCards().filter(matchesTypeFilter);

    if (!cards.length) {
      wrap.innerHTML = '<div class="rd-ven-empty">No venues match this view. Add a comparison venue or clear the rail filter.</div>';
    } else {
      wrap.innerHTML = cards.map(card => {
        const photoKey = 'venuePhoto_' + card.kind;
        const photo = venueData()[photoKey] || '';
        const active = window._venDrawerKind === card.kind || (!window._venDrawerKind && window._venDetailKind === card.kind);
        const media = photo
          ? `<img class="rd-ven-card__photo" src="${esc(photo)}" alt="${esc(card.title)}">`
          : `<span class="rd-ven-card__photo-ph">Add photo</span>`;
        return `<article class="rd-ven-card${active ? ' is-active' : ''}" data-kind="${esc(card.kind)}" onclick="rdVenOpenDrawer('${esc(card.kind)}')">
          <div class="rd-ven-card__media" onclick="event.stopPropagation();this.querySelector('input[type=file]')?.click()">
            ${media}
            <input type="file" accept="image/*" hidden onchange="typeof uploadVenuePhoto==='function'&&uploadVenuePhoto('${esc(card.kind)}',event)">
          </div>
          <div class="rd-ven-card__body">
            <div class="rd-ven-card__title">${esc(card.title)}</div>
            <div class="rd-ven-card__type">${esc(card.type)}</div>
            <div class="rd-ven-card__meta">${esc(card.space)}</div>
            <div class="rd-ven-card__meta">Capacity: ${esc(card.cap)}</div>
            <div class="rd-ven-card__meta">${esc(card.address)}</div>
            <div class="rd-ven-card__price">${esc(card.cost)}</div>
            <div class="rd-ven-card__deposit">${esc(card.depositLabel)}</div>
            <div class="rd-ven-card__actions">
              <button type="button" class="rd-ven-card__link" onclick="event.stopPropagation();rdVenOpenDrawer('${esc(card.kind)}')">Open <span class="rd-kbd">↵</span></button>
              <button type="button" class="rd-ven-card__link" onclick="event.stopPropagation();rdVenOpenDetails('${esc(card.kind)}')">Full editor <span class="rd-kbd">⌘↵</span></button>
              ${card.builtin ? '' : `<button type="button" class="rd-ven-card__link is-danger" onclick="event.stopPropagation();rdVenRemoveExtra(${card.idx})">Remove</button>`}
            </div>
          </div>
        </article>`;
      }).join('');
    }

    compare.innerHTML =
      `<div class="rd-ven-compare__row rd-ven-compare__head"><strong>Detail</strong>${matrixCards.map(c => `<strong>${esc(c.title)}</strong>`).join('')}</div>` +
      COMPARE_ROWS.map(([label, key]) =>
        `<div class="rd-ven-compare__row"><strong>${esc(label)}</strong>${matrixCards.map(c => `<span>${esc(c[key])}</span>`).join('')}</div>`
      ).join('');
    compare.classList.add('is-active');
  }

  function renderVenueDetailsView() {
    const toggle = document.getElementById('venue-detail-toggle');
    const form = document.getElementById('venue-details-form');
    if (!toggle || !form) return;
    let kind = window._venDetailKind || 'c';
    if (kind !== 'c' && kind !== 'r') kind = 'c';
    window._venDetailKind = kind;
    if (typeof currentVenueView !== 'undefined') {
      try { currentVenueView = kind; } catch (e) { /* ok */ }
    }
    const v = venueData();
    const setup = (window.data && data.setup) || {};
    const name = kind === 'r'
      ? text(v['r-name'], setup['venue-reception'] || 'Reception Venue')
      : text(v['c-name'], setup['venue-ceremony'] || 'Ceremony Venue');
    const pill = kind === 'r' ? 'Reception' : 'Ceremony';

    toggle.innerHTML =
      `<button type="button" class="rd-chip${kind === 'c' ? ' is-active' : ''}" onclick="rdVenSetDetailKind('c')">Ceremony</button>` +
      `<button type="button" class="rd-chip${kind === 'r' ? ' is-active' : ''}" onclick="rdVenSetDetailKind('r')">Reception</button>` +
      `<span class="rd-ven-detail-name">${esc(name === '—' ? pill + ' Venue' : name)} <span class="rd-ven-pill">${esc(pill)}</span></span>`;

    const coreKeys = new Set(['name', 'contact', 'address', 'phone', 'capacity', 'space', 'hours', 'cost', 'deposit', 'setup', 'parking']);
    const fields = window._venShowFull ? DETAIL_FIELDS : DETAIL_FIELDS.filter(f => coreKeys.has(f.key) || window._venShowFull);
    form.innerHTML =
      `<div class="rd-ven-detail-grid">` +
      fields.map(f => {
        const id = 'ven-' + kind + '-' + f.key;
        const val = v[kind + '-' + f.key] || '';
        const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
        const control = f.area
          ? `<textarea id="${id}" rows="2"${ph} oninput="rdVenSaveField('${kind}','${f.key}',this.value)">${esc(val)}</textarea>`
          : `<input type="text" id="${id}" value="${esc(val)}"${ph} oninput="rdVenSaveField('${kind}','${f.key}',this.value)">`;
        return `<div class="rd-ven-detail-row${f.span ? ' span-2' : ''}"><label class="rd-ven-detail-label" for="${id}">${esc(f.label)}</label>${control}</div>`;
      }).join('') +
      `</div>` +
      /* Keep opposite-prefix fields mounted (hidden) so legacy loadVenue/saveVenue stay whole. */
      `<div hidden aria-hidden="true">` +
      DETAIL_FIELDS.map(f => {
        const other = kind === 'c' ? 'r' : 'c';
        const id = 'ven-' + other + '-' + f.key;
        const val = v[other + '-' + f.key] || '';
        return f.area
          ? `<textarea id="${id}">${esc(val)}</textarea>`
          : `<input id="${id}" value="${esc(val)}">`;
      }).join('') +
      `</div>` +
      `<div class="rd-ven-detail-actions">` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdVenToggleFull()">${window._venShowFull ? 'Hide full details' : 'View full details'} →</button>` +
      `<button type="button" class="rd-btn" onclick="rdVenOpenDrawer('${kind}')">Open drawer</button>` +
      `</div>`;
  }

  function rdVenSetDetailKind(kind) {
    window._venDetailKind = kind === 'r' ? 'r' : 'c';
    window._venRailView = kind === 'r' ? 'reception' : 'ceremony';
    syncBuiltinFieldsFromDom();
    renderVenueRd();
  }

  function rdVenToggleFull() {
    window._venShowFull = !window._venShowFull;
    syncBuiltinFieldsFromDom();
    renderVenueDetailsView();
  }

  function rdVenOpenDetails(kind) {
    if (kind === 'c' || kind === 'r') {
      window._venDetailKind = kind;
      window._venMode = 'details';
      window._venShowFull = true;
      window._venRailView = kind === 'r' ? 'reception' : 'ceremony';
      renderVenueRd();
      return;
    }
    const m = String(kind || '').match(/^x(\d+)$/);
    if (m) {
      window._venMode = 'compare';
      rdVenOpenDrawer(kind);
      return;
    }
    window._venMode = 'details';
    window._venShowFull = true;
    renderVenueRd();
  }

  function renderVenueNotesView() {
    const noteHost = document.getElementById('venue-note-stack');
    const list = document.getElementById('venue-reminder-list');
    const summary = document.getElementById('venue-reminder-summary');
    if (!noteHost || !list || !summary) return;

    if (typeof renderVenueNotes === 'function' && document.getElementById('venue-edit-note-btn')) {
      /* legacy path if chrome still present */
    }

    const v = venueData();
    const editing = !!window._venNoteEditing;
    const savedText = v.notesText || '';
    if (editing) {
      noteHost.innerHTML =
        `<div class="rd-ven-note-editor">` +
        `<textarea id="venue-note-input" placeholder="Write notes about your venues, comparison thoughts, questions to ask, or follow-up reminders…">${esc(savedText)}</textarea>` +
        `<div class="rd-ven-note-actions">` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVenSaveNote()">Save note</button>` +
        `<button type="button" class="rd-btn" onclick="rdVenCancelNote()">Cancel</button>` +
        `</div></div>`;
    } else {
      let display = savedText.trim();
      if (!display && typeof venueDefaultNoteText === 'function') display = venueDefaultNoteText();
      if (!display) display = 'Click Edit note to add your venue notes here.';
      let updated = '';
      if (v.notesUpdated) {
        const d = new Date(v.notesUpdated);
        if (!Number.isNaN(d.getTime())) {
          updated = `<span class="rd-ven-note-updated">Updated ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>`;
        }
      }
      noteHost.innerHTML =
        `<div class="rd-ven-note-display${!savedText.trim() ? ' is-empty' : ''}"><p>${esc(display)}</p>${updated}</div>`;
    }

    const prefix = (window._venDetailKind === 'r' || window._venRailView === 'reception') ? 'r' : 'c';
    const nice = prefix === 'r' ? 'reception' : 'ceremony';
    const items = REMINDER_CHECKS.map(([key, label]) => [label, fieldFilled(prefix, key)]);
    list.innerHTML = items.map(([label, done]) =>
      `<div class="venue-reminder-item rd-ven-reminder${done ? ' done is-done' : ''}">` +
      `<span class="venue-reminder-mark rd-ven-reminder__mark" aria-hidden="true">${done ? '✓' : '○'}</span>` +
      `<span class="venue-reminder-label">${esc(label)}</span>` +
      `<span class="venue-reminder-state">${done ? 'Complete' : 'Pending'}</span></div>`
    ).join('');
    const doneCount = items.filter(item => item[1]).length;
    summary.innerHTML = `${doneCount} of ${items.length} ${nice} venue details are complete. Finish the remaining fields so your venue page, budget, and timeline stay aligned.`;
  }

  function rdVenSaveNote() {
    const v = venueData();
    const input = document.getElementById('venue-note-input');
    v.notesText = input ? input.value : '';
    v.notesUpdated = new Date().toISOString();
    window._venNoteEditing = false;
    if (typeof save === 'function') save();
    renderVenueNotesView();
  }

  function rdVenCancelNote() {
    window._venNoteEditing = false;
    renderVenueNotesView();
  }

  function rdVenOpenDrawer(kind) {
    window._venDrawerKind = kind || null;
    if (kind === 'c' || kind === 'r') window._venDetailKind = kind;
    renderVenueDrawer();
    renderVenueCompareView();
  }

  function rdVenCloseDrawer() {
    window._venDrawerKind = null;
    const slot = document.getElementById('venue-drawer-slot');
    if (slot) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
    }
    renderVenueCompareView();
  }

  function rdVenRemoveExtra(idx) {
    if (typeof deleteCompareVenue === 'function') {
      deleteCompareVenue(idx).then(function () {
        window._venDrawerKind = null;
        renderVenueRd();
      }).catch(function () { /* cancelled */ });
      return;
    }
    venueData().shortlist.splice(idx, 1);
    if (typeof save === 'function') save();
    window._venDrawerKind = null;
    renderVenueRd();
  }

  function renderVenueDrawer() {
    const slot = document.getElementById('venue-drawer-slot');
    if (!slot) return;
    const kind = window._venDrawerKind;
    if (!kind) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
      return;
    }
    const card = cardByKind(kind);
    if (!card) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
      return;
    }
    slot.classList.add('is-open');

    let fieldsHtml = '';
    if (card.builtin) {
      const prefix = card.kind;
      const v = venueData();
      const pairs = [
        ['Contact', v[prefix + '-contact'] || '—'],
        ['Phone / Email', v[prefix + '-phone'] || '—'],
        ['Address', v[prefix + '-address'] || '—'],
        ['Capacity', v[prefix + '-capacity'] || '—'],
        ['Venue type', v[prefix + '-space'] || '—'],
        ['Rental hours', v[prefix + '-hours'] || '—'],
        ['Total cost', currency(v[prefix + '-cost'])],
        ['Deposit', depositLabel(v[prefix + '-cost'], v[prefix + '-deposit'])],
        ['Setup time', v[prefix + '-setup'] || '—'],
        ['Parking', v[prefix + '-parking'] || '—']
      ];
      fieldsHtml = pairs.map(([l, val]) =>
        `<div class="rd-drawer__field"><span>${esc(l)}</span><strong>${esc(val)}</strong></div>`
      ).join('');
    } else {
      const x = venueData().shortlist[card.idx] || {};
      const i = card.idx;
      fieldsHtml =
        `<label class="rd-drawer__field"><span>Venue name</span><input value="${esc(x.name || '')}" oninput="rdVenSaveExtra(${i},'name',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Type</span><input value="${esc(x.type || '')}" placeholder="Ceremony, Reception, Both…" oninput="rdVenSaveExtra(${i},'type',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Indoor / Outdoor</span><input value="${esc(x.space || '')}" oninput="rdVenSaveExtra(${i},'space',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Capacity</span><input value="${esc(x.capacity || '')}" oninput="rdVenSaveExtra(${i},'capacity',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Address</span><input value="${esc(x.address || '')}" oninput="rdVenSaveExtra(${i},'address',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Cost</span><input value="${esc(x.cost || '')}" oninput="rdVenSaveExtra(${i},'cost',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Deposit</span><input value="${esc(x.deposit || '')}" oninput="rdVenSaveExtra(${i},'deposit',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Contact / notes</span><input value="${esc(x.contact || '')}" oninput="rdVenSaveExtra(${i},'contact',this.value)"></label>` +
        `<label class="rd-drawer__field"><span>Rental hours</span><input value="${esc(x.hours || '')}" oninput="rdVenSaveExtra(${i},'hours',this.value)"></label>`;
    }

    slot.innerHTML =
      `<aside class="rd-drawer rd-ven-drawer" role="dialog" aria-label="Venue details">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Vendors / Venue</div>` +
      `<div class="rd-drawer__title">${esc(card.title)}</div>` +
      `<div class="rd-drawer__chips"><span class="rd-chip is-active">${esc(card.type)}</span></div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdVenCloseDrawer()" aria-label="Close">×</button>` +
      `</div>` +
      `<div class="rd-drawer__body">${fieldsHtml}</div>` +
      `<div class="rd-drawer__foot">` +
      (card.builtin
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdVenOpenDetails('${esc(card.kind)}')">Full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdVenRemoveExtra(${card.idx})">Remove</button>`) +
      `<button type="button" class="rd-btn" onclick="rdVenCloseDrawer()">Close</button>` +
      `</div></aside>`;
  }

  function venTabBridge(name) {
    const map = { details: 'details', notes: 'notes', reminders: 'notes', shortlist: 'compare', compare: 'compare' };
    rdSetVenueView(map[name] || 'compare');
  }

  function renderVenueRd() {
    venueData();
    uedVenueShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('venue');
    applyViewMode();
    renderVenueStatsRd();
    renderVenueToolbar();

    const mode = window._venMode || 'compare';
    if (mode === 'details') renderVenueDetailsView();
    else if (mode === 'notes') {
      window._venNoteEditing = !!window._venNoteEditing;
      if (typeof editVenueNote === 'function' && window._venNoteEditing) {
        /* keep flag */
      }
      renderVenueNotesView();
    } else renderVenueCompareView();

    renderVenueDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'venue'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('venue');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('venue');
  }

  window.uedVenueShell = uedVenueShellRd;
  window.renderVenuePage = renderVenueRd;
  window.renderVenueRd = renderVenueRd;
  window.rdSetVenueView = rdSetVenueView;
  window.applyVenueRailView = applyVenueRailView;
  window.venueRailCounts = venueRailCounts;
  window.venueFigures = venueFigures;
  window.rdVenOpenDrawer = rdVenOpenDrawer;
  window.rdVenCloseDrawer = rdVenCloseDrawer;
  window.rdVenOpenDetails = rdVenOpenDetails;
  window.rdVenAddVenue = rdVenAddVenue;
  window.rdVenFullEditor = rdVenFullEditor;
  window.rdVenCycleTypeFilter = rdVenCycleTypeFilter;
  window.rdVenFocusCeremony = rdVenFocusCeremony;
  window.rdVenFocusReception = rdVenFocusReception;
  window.rdVenSaveField = rdVenSaveField;
  window.rdVenSaveExtra = rdVenSaveExtra;
  window.rdVenSetDetailKind = rdVenSetDetailKind;
  window.rdVenToggleFull = rdVenToggleFull;
  window.rdVenRemoveExtra = rdVenRemoveExtra;
  window.rdVenSaveNote = rdVenSaveNote;
  window.rdVenCancelNote = rdVenCancelNote;
  window.venTab = venTabBridge;

  /* Prefer redesign when legacy helpers re-render. */
  const _standardizeVenuePageShell = window.standardizeVenuePageShell;
  window.standardizeVenuePageShell = function () {
    const panel = document.getElementById('panel-venue');
    if (panel && panel.dataset.uedShell === 'venue-rd') return;
    if (typeof _standardizeVenuePageShell === 'function') return _standardizeVenuePageShell.apply(this, arguments);
  };

  function hookVenuePanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.venue = function () { renderVenueRd(); };
    }
  }
  hookVenuePanelRenderer();
  var _showPanelVenue = window.showPanel;
  if (typeof _showPanelVenue === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelVenue.call(window, id, forceOpen);
      hookVenuePanelRenderer();
      return out;
    };
  }
})();
