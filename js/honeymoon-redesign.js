/* Honeymoon — All.dc #17b + Dark.dc #17b rail + Drawers batch 25 (Booking).
   Sections: Details & bookings · Itinerary · Packing · Budget · Daily journal.
   Rail: Sections counts + Readiness meters + budget note.
   Stats: Days until trip · Bookings complete · Packed · Itinerary days · Trip budget.
   Booking drawer tabs: Booking · Cost · Documents · History.
   Data: honeymoon · honeyDetails · honeyTransport · honeyItinerary · packing ·
         hmBudget / hmBudgetItems · hmJournal.
   Post-wedding / After the day lives on Newlywed Homecoming. */
(function () {
  'use strict';

  window._hmSection = window._hmSection || 'bookings';
  window._hmUiFilters = window._hmUiFilters || { type: 'all', status: 'all', day: 'all' };
  window._hmDrawerId = window._hmDrawerId || null;
  window._hmDrawerTab = window._hmDrawerTab || 0;
  window._hmSel = window._hmSel instanceof Set ? window._hmSel : new Set();

  const SECTIONS = [
    { id: 'bookings', label: 'Details & bookings' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'packing', label: 'Packing' },
    { id: 'budget', label: 'Budget' },
    { id: 'journal', label: 'Daily journal' }
  ];
  const DRAWER_TABS = ['Booking', 'Cost', 'Documents', 'History'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function money0(n) {
    const v = Math.round(parseFloat(n) || 0);
    if (typeof fmt === 'function') {
      try { return fmt(v); } catch (e) { /* fall through */ }
    }
    return '$' + v.toLocaleString();
  }
  function num(v) {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  function ensureHm() {
    if (!window.data) window.data = {};
    if (!data.honeymoon || typeof data.honeymoon !== 'object') data.honeymoon = {};
    ['honeyDetails', 'honeyTransport', 'honeyItinerary', 'packing', 'hmBudgetItems', 'hmJournal'].forEach(k => {
      if (!Array.isArray(data[k])) data[k] = [];
    });
    if (!data.hmBudget || typeof data.hmBudget !== 'object') data.hmBudget = {};
    if (typeof hmEnsureData === 'function') hmEnsureData();
    ensureMasterHoneymoon();
  }

  /* Master s32 · 17b bookings — the drawn Zanzibar trip, exact rows: the two
     Kenya Airways flights and the airport transfer (Travel · $2,000), the
     Kilindi hotel (Lodging · $1,980), and travel insurance + the Mnemba
     snorkelling still open (Open · $200). Seeded once when no bookings exist. */
  function ensureMasterHoneymoon() {
    if (data._hmMasterS32) return;
    if ((data.honeyTransport && data.honeyTransport.length) ||
        (data.honeyDetails && data.honeyDetails.length)) {
      data._hmMasterS32 = true;
      return;
    }
    const stamp = (src, row) => {
      if (typeof nextRecordId === 'function') row._id = nextRecordId(src);
      return row;
    };
    data.honeyTransport = [
      stamp('honeyTransport', { leg: 'Outbound · ACC → ZNZ', type: 'Flight', company: 'Kenya Airways', flight: 'KQ 476', date: '2026-11-19', departTime: '06:40', cost: 920, ticket: 'KQ-4TT8B', status: 'Paid' }),
      stamp('honeyTransport', { leg: 'Return · ZNZ → ACC', type: 'Flight', company: 'Kenya Airways', flight: 'KQ 479', date: '2026-11-28', departTime: '14:15', cost: 920, ticket: 'KQ-4TT8B', status: 'Paid' }),
      stamp('honeyTransport', { leg: 'Airport transfer, both ways', type: 'Transfer', company: 'Kilindi shuttle', flight: '', date: '2026-11-19', departTime: '', cost: 160, ticket: '', status: 'Booked' })
    ];
    data.honeyDetails = [
      stamp('honeyDetails', { item: 'Kilindi Zanzibar · 9 nights', section: 'Hotel', vendor: 'Kilindi Zanzibar', timeline: '19–28 Nov', cost: 1980, reference: 'KLD-99214', status: 'Deposit paid' }),
      stamp('honeyDetails', { item: 'Travel insurance', section: 'Insurance', vendor: '', timeline: '19–28 Nov', cost: 0, reference: '', status: 'Not booked' }),
      stamp('honeyDetails', { item: 'Mnemba atoll snorkelling', section: 'Excursion', vendor: 'Resort desk', timeline: '23 Nov', cost: 200, reference: '', status: 'Held, unpaid' })
    ];
    if (!data.honeymoon.depart) data.honeymoon.depart = '2026-11-19';
    if (!data.honeymoon.return) data.honeymoon.return = '2026-11-28';
    if (!data.honeymoon.destination) data.honeymoon.destination = 'Zanzibar';
    data._hmMasterS32 = true;
    if (typeof save === 'function') save();
  }

  function parseDate(value) {
    if (!value) return null;
    if (typeof hmDate === 'function') return hmDate(value);
    const d = new Date(String(value).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function daysUntil(value) {
    if (typeof hmDaysUntil === 'function') return hmDaysUntil(value);
    const d = parseDate(value);
    if (!d) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / 86400000);
  }
  function shortDate(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function weekday(value) {
    const d = parseDate(value);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  function bookingType(row, src) {
    if (src === 'honeyTransport') {
      const t = String(row.type || '').toLowerCase();
      if (/flight/.test(t)) return 'Flight';
      if (/transfer|shuttle|car|taxi/.test(t)) return 'Transfer';
      return String(row.type || 'Transport') || 'Transport';
    }
    const s = String(row.section || row.item || '').toLowerCase();
    if (/flight/.test(s)) return 'Flight';
    if (/hotel|lodging|resort/.test(s)) return 'Hotel';
    if (/transfer|transport|shuttle|car/.test(s)) return 'Transfer';
    if (/insurance/.test(s)) return 'Insurance';
    if (/excurs|activ|snork|spa|tour/.test(s)) return 'Excursion';
    return String(row.section || 'Booking') || 'Booking';
  }
  function bookingGroup(type) {
    const t = String(type || '').toLowerCase();
    if (/flight|transfer|transport/.test(t)) return 'Travel';
    if (/hotel|lodging/.test(t)) return 'Lodging';
    return 'Open';
  }
  function isBookingComplete(status) {
    const s = String(status || '').toLowerCase();
    /* Negatives first — "Not booked" contains "booked", "Held, unpaid"
       contains "paid", so substring tests must not lead. */
    if (/\bnot\b|\bun(paid|booked|confirmed)\b|pending|planned|\bheld\b|\bopen\b|outstanding|to book/.test(s)) return false;
    return /\b(paid|booked|confirmed|purchased|deposit|complete|checked)\b/.test(s);
  }
  function isOpenBooking(status) {
    return !isBookingComplete(status);
  }

  function unifyBooking(src, row, i) {
    const type = bookingType(row, src);
    let title = '';
    let provider = '';
    let dates = '';
    let cost = 0;
    let reference = '';
    let status = '';
    if (src === 'honeyTransport') {
      title = String(row.leg || ((row.from && row.to) ? (row.from + ' → ' + row.to) : '') || row.type || 'Transport').trim();
      provider = [row.company, row.flight].filter(Boolean).join(' · ') || '—';
      dates = [shortDate(row.date), row.departTime].filter(Boolean).join(' · ') || '—';
      cost = num(row.cost);
      reference = String(row.ticket || row.reference || '').trim() || '—';
      status = String(row.status || 'Planned').trim() || 'Planned';
    } else {
      title = String(row.item || row.label || 'Untitled booking').trim();
      provider = String(row.vendor || '').trim() || '—';
      dates = String(row.timeline || '').trim() || '—';
      cost = num(row.cost != null ? row.cost : row.actual);
      reference = String(row.reference || '').trim() || '—';
      status = String(row.status || 'Planned').trim() || 'Planned';
    }
    const id = row._id ? (src + ':' + row._id) : (src + ':idx:' + i);
    return {
      id: id, src: src, index: i, row: row,
      title: title, type: type, group: bookingGroup(type),
      provider: provider, dates: dates, cost: cost,
      reference: reference, status: status,
      complete: isBookingComplete(status),
      open: isOpenBooking(status) && !isBookingComplete(status)
    };
  }

  function allBookings() {
    ensureHm();
    const out = [];
    data.honeyDetails.forEach((r, i) => out.push(unifyBooking('honeyDetails', r, i)));
    data.honeyTransport.forEach((r, i) => out.push(unifyBooking('honeyTransport', r, i)));
    /* Prefer transport when both describe the same flight/hotel to avoid double-count noise —
       keep both; rail counts use total rows as mock does. */
    return out;
  }
  function findBooking(id) {
    return allBookings().find(b => b.id === id) || null;
  }

  function tripBudgetTarget() {
    ensureHm();
    if (num(data.hmBudget.total)) return num(data.hmBudget.total);
    const items = data.hmBudgetItems || [];
    if (items.length) return items.reduce((s, r) => s + num(r.budgeted), 0);
    return 5400;
  }
  function budgetCommitted() {
    ensureHm();
    const fromLines = (data.hmBudgetItems || []).reduce((s, r) => {
      const st = String(r.status || '').toLowerCase();
      if (/paid|booked|confirmed|deposit|committed/.test(st) || num(r.actual) > 0) {
        return s + (num(r.actual) || num(r.budgeted));
      }
      return s;
    }, 0);
    if (fromLines) return fromLines;
    /* No separate budget lines yet — the committed trip spend is what the
       bookings themselves have locked in (paid or deposited). */
    return allBookings().filter(b => b.complete).reduce((s, b) => s + b.cost, 0);
  }

  function honeymoonFigures() {
    ensureHm();
    const bookings = allBookings();
    const complete = bookings.filter(b => b.complete).length;
    const packing = data.packing || [];
    const packed = packing.filter(r => r.packed || /packed/i.test(String(r.status || ''))).length;
    const iti = data.honeyItinerary || [];
    const plannedDays = iti.filter(r => {
      const plan = String(r.plan || '').trim();
      return plan && !/^nothing planned$/i.test(plan);
    }).length;
    const items = data.hmBudgetItems || [];
    const days = daysUntil(data.honeymoon.depart);
    return {
      daysUntil: days,
      bookingsTotal: bookings.length,
      bookingsComplete: complete,
      packingTotal: packing.length,
      packed: packed,
      itineraryTotal: iti.length,
      itineraryPlanned: plannedDays,
      budgetLines: items.length,
      budgetTarget: tripBudgetTarget(),
      budgetCommitted: budgetCommitted(),
      journalCount: (data.hmJournal || []).length
    };
  }
  function honeymoonRailCounts() {
    const f = honeymoonFigures();
    return {
      bookings: f.bookingsTotal,
      itinerary: f.itineraryTotal,
      packing: f.packingTotal,
      budget: f.budgetLines,
      journal: f.journalCount
    };
  }

  function matchesBookingFilters(b) {
    const ui = window._hmUiFilters || {};
    if (ui.type && ui.type !== 'all' && String(b.type).toLowerCase() !== String(ui.type).toLowerCase()) return false;
    if (ui.status && ui.status !== 'all' && String(b.status).toLowerCase() !== String(ui.status).toLowerCase()) return false;
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHmAddPhoto()">Add destination photo</button>'
      + '<button type="button" class="rd-btn" onclick="rdHmPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdHmFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdHmExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHmAddBooking()">Add booking</button>';
  }

  function uedHoneymoonShellRd() {
    const panel = document.getElementById('panel-honeymoon');
    if (!panel) return;
    panel.classList.add('ued-scope', 'honeymoon-mockup');
    if (panel.dataset.uedShell === 'honeymoon-rd-s32') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'honeymoon-rd-s32';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">The Day</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Honeymoon &amp; After</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="honeymoon-stats" aria-label="Honeymoon summary"></div>
      <div class="rd-sectiontabs" id="honeymoon-section-tabs" role="tablist" aria-label="Honeymoon sections"></div>
      <div class="rd-toolbar" id="honeymoon-toolbar"></div>
      <div class="rd-bulkbar" id="honeymoon-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="honeymoon-surface-row">
          <div class="rd-surface__main" id="honeymoon-view-host"></div>
          <div id="honeymoon-drawer-slot"></div>
        </div>
      </div>
      <input type="file" id="hm-dest-photo-input" accept="image/*" hidden onchange="typeof uploadHoneymoonDestPhoto==='function'&&uploadHoneymoonDestPhoto(event)">
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderHmStatsRd() {
    const host = document.getElementById('honeymoon-stats');
    if (!host) return;
    const f = honeymoonFigures();
    const daysVal = f.daysUntil == null ? '—' : String(Math.max(f.daysUntil, 0));
    const bookingsVal = f.bookingsComplete + ' of ' + Math.max(f.bookingsTotal, f.bookingsComplete);
    const packedVal = f.packed + ' of ' + Math.max(f.packingTotal, f.packed || 0);
    const itiVal = f.itineraryPlanned + ' of ' + Math.max(f.itineraryTotal, f.itineraryPlanned || 0);
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Days until trip', value: daysVal },
        { label: 'Bookings complete', value: bookingsVal },
        { label: 'Packed', value: packedVal },
        { label: 'Itinerary days', value: itiVal },
        { label: 'Trip budget', value: money0(f.budgetTarget) }
      ]);
      return;
    }
    host.innerHTML = [
      ['Days until trip', daysVal],
      ['Bookings complete', bookingsVal],
      ['Packed', packedVal],
      ['Itinerary days', itiVal],
      ['Trip budget', money0(f.budgetTarget)]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function renderSectionTabs() {
    const host = document.getElementById('honeymoon-section-tabs');
    if (!host) return;
    const cur = window._hmSection || 'bookings';
    host.innerHTML = SECTIONS.map(s =>
      `<button type="button" class="rd-sectiontabs__item${cur === s.id ? ' is-active' : ''}" role="tab" aria-selected="${cur === s.id}" onclick="applyHoneymoonSection('${s.id}')">${esc(s.label)}</button>`
    ).join('');
  }

  function filterChip(label, field, options) {
    const ui = window._hmUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHmCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHmClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderHmToolbar() {
    const host = document.getElementById('honeymoon-toolbar');
    if (!host) return;
    const sec = window._hmSection || 'bookings';
    let left = '';
    if (sec === 'bookings') {
      left = filterChip('Type', 'type') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by date</button>`;
    } else if (sec === 'itinerary') {
      left = filterChip('Day', 'day') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by date</button>`;
    } else if (sec === 'packing') {
      left = filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by kit</button>`;
    } else if (sec === 'budget') {
      left = filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by category</button>`;
    } else if (sec === 'journal') {
      left = `<button type="button" class="rd-chip rd-chip--ghost">Sort by date</button>`;
    } else {
      left = filterChip('Type', 'type') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by date</button>`;
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('honeymoon') : '') +
      `</div>`;
  }

  function applyHoneymoonSection(id) {
    const ok = SECTIONS.some(s => s.id === id);
    /* Retired After the day section — post-wedding work lives on Homecoming. */
    window._hmSection = ok ? id : 'bookings';
    if (typeof setSavedView === 'function') setSavedView('honeymoon', window._hmSection);
    window._hmDrawerId = null;
    renderHoneymoonRd();
  }

  /* ── section surfaces ────────────────────────────────────────────────── */

  function sectionHead(title, help, ctaLabel, ctaOnclick) {
    return `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">${esc(title)}</div>` +
      `<p class="rd-help">${esc(help)}</p></div>` +
      (ctaLabel ? `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="${ctaOnclick}">${esc(ctaLabel)}</button>` : '') +
      `</div>`;
  }

  function renderBookingsView() {
    const bookings = allBookings().filter(matchesBookingFilters);
    const f = honeymoonFigures();
    const openN = bookings.filter(b => b.open || !b.complete).length;
    const help = f.bookingsComplete + ' confirmed · ' +
      (openN ? openN + ' still open' : 'all bookings settled');
    /* Complete Travel/Lodging stay in group; incomplete → Open */
    const buckets = { Travel: [], Lodging: [], Open: [] };
    bookings.forEach(b => {
      if (!b.complete) buckets.Open.push(b);
      else if (b.group === 'Lodging') buckets.Lodging.push(b);
      else if (b.group === 'Travel') buckets.Travel.push(b);
      else buckets.Open.push(b);
    });

    let html = sectionHead(
      'Details & bookings · ' + bookings.length + ' row' + (bookings.length === 1 ? '' : 's'),
      help, 'Add a booking', 'rdHmAddBooking()'
    );
    html += `<table class="rd-hm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Booking</th><th>Type</th><th>Provider</th><th>Dates</th><th>Cost</th><th>Reference</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    ['Travel', 'Lodging', 'Open'].forEach(g => {
      const rows = buckets[g];
      if (!rows.length) return;
      const sum = rows.reduce((s, r) => s + r.cost, 0);
      html += `<tr class="rd-hm-group"><td colspan="8">${esc(g)} · ${rows.length} row${rows.length === 1 ? '' : 's'} · ${esc(money0(sum))}</td></tr>`;
      rows.forEach(b => {
        const sel = window._hmSel.has(b.id);
        html += `<tr class="rd-hm-row${sel ? ' is-selected' : ''}${!b.complete ? ' is-open' : ''}" data-hm-id="${esc(b.id)}" onclick="rdHmOpenDrawer('${esc(b.id)}')">` +
          `<td onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdHmToggleSel('${esc(b.id)}')"></td>` +
          `<td class="rd-hm-name">${esc(b.title)}` +
          `<span class="rd-hm-row__actions"><button type="button" onclick="event.stopPropagation();rdHmOpenDrawer('${esc(b.id)}')">Open</button>` +
          `<button type="button" onclick="event.stopPropagation();rdHmFullEditor('${esc(b.id)}')">Full editor</button></span></td>` +
          `<td>${esc(b.type)}</td><td>${esc(b.provider)}</td><td>${esc(b.dates)}</td>` +
          `<td>${esc(money0(b.cost))}</td><td>${esc(b.reference)}</td>` +
          `<td><span class="status-pill" data-pillscheme="${b.complete ? 'gold' : 'red'}">${esc(b.status)}</span></td>` +
          `</tr>`;
      });
    });
    if (!bookings.length) {
      html += `<tr class="rd-hm-empty"><td colspan="8">No bookings yet. Add flights, lodging, and the open items that still need a deposit.</td></tr>`;
    }
    html += `</tbody></table>`;
    html += `<button type="button" class="rd-hm-addbtn" onclick="rdHmAddBooking()"><span>+</span> Add a booking</button>`;
    return html;
  }

  function itineraryWeek(r) {
    const d = parseDate(r.date || r.day);
    if (!d) {
      const day = String(r.day || '');
      if (/arrival|19|20|21|22|23/i.test(day)) return 'Arrival week';
      return 'Second week';
    }
    /* Split trip roughly at midpoint of depart/return when available */
    const dep = parseDate(data.honeymoon.depart);
    const ret = parseDate(data.honeymoon.return);
    if (dep && ret) {
      const mid = new Date((dep.getTime() + ret.getTime()) / 2);
      return d <= mid ? 'Arrival week' : 'Second week';
    }
    return 'Trip days';
  }

  function renderItineraryView() {
    ensureHm();
    const rows = (data.honeyItinerary || []).slice();
    const unplanned = rows.filter(r => !String(r.plan || '').trim() || /^nothing planned$/i.test(String(r.plan || ''))).length;
    let html = sectionHead(
      'Itinerary · ' + rows.length + ' entr' + (rows.length === 1 ? 'y' : 'ies') + (rows.length ? ' over ' + rows.length + ' days' : ''),
      unplanned
        ? (unplanned + ' day' + (unplanned === 1 ? '' : 's') + ' with nothing planned · shown, not chased')
        : 'Every day has a plan — keep a few blank if you want rest',
      'Add an entry', 'rdHmAddIti()'
    );
    html += `<table class="rd-hm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Day</th><th>Date</th><th>Plan</th><th>Time</th><th>Booked through</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    const groups = {};
    rows.forEach((r, i) => {
      const g = itineraryWeek(r);
      if (!groups[g]) groups[g] = [];
      groups[g].push({ r, i });
    });
    Object.keys(groups).forEach(g => {
      html += `<tr class="rd-hm-group"><td colspan="7">${esc(g)}</td></tr>`;
      groups[g].forEach(({ r, i }) => {
        const plan = String(r.plan || '').trim() || 'Nothing planned';
        const nothing = /^nothing planned$/i.test(plan);
        const dayLabel = weekday(r.date) || String(r.day || '—');
        const dateLabel = shortDate(r.date || r.day);
        html += `<tr class="rd-hm-row${nothing ? ' is-unplanned' : ''}" onclick="rdHmOpenIti(${i})">` +
          `<td></td>` +
          `<td>${esc(dayLabel)}</td><td>${esc(dateLabel)}</td>` +
          `<td class="rd-hm-name">${esc(plan)}</td>` +
          `<td>${esc(r.time || '—')}</td>` +
          `<td>${esc(r.confirmation || r.location || '—')}</td>` +
          `<td>${esc(nothing ? 'Nothing planned' : (r.status || 'Planned'))}</td>` +
          `</tr>`;
      });
    });
    if (!rows.length) {
      html += `<tr class="rd-hm-empty"><td colspan="7">No itinerary days yet. Add an entry for each day of the trip — blank days are allowed.</td></tr>`;
    }
    html += `</tbody></table>`;
    html += `<button type="button" class="rd-hm-addbtn" onclick="rdHmAddIti()"><span>+</span> Add an itinerary entry</button>`;
    return html;
  }

  function packingKit(r) {
    const c = String(r.category || r.kit || '').toLowerCase();
    if (/doc|passport|visa|ticket|insurance|card/.test(c) || /passport|visa|ticket|insurance/i.test(String(r.item || ''))) {
      return 'Documents';
    }
    return 'Clothing & kit';
  }

  function renderPackingView() {
    ensureHm();
    const rows = data.packing || [];
    const packed = rows.filter(r => r.packed || /packed/i.test(String(r.status || ''))).length;
    let html = sectionHead(
      'Packing · ' + rows.length + ' item' + (rows.length === 1 ? '' : 's'),
      packed + ' packed · documents first, because three of them gate the trip',
      'Load a starter list', 'rdHmLoadPacking()'
    );
    html += `<table class="rd-hm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Item</th><th>Kit</th><th>Who</th><th>Qty</th><th>Status</th><th>Note</th>` +
      `</tr></thead><tbody>`;
    const kits = { Documents: [], 'Clothing & kit': [] };
    rows.forEach((r, i) => {
      const k = packingKit(r);
      kits[k].push({ r, i });
    });
    Object.keys(kits).forEach(k => {
      const list = kits[k];
      if (!list.length) return;
      const nPacked = list.filter(({ r }) => r.packed || /packed/i.test(String(r.status || ''))).length;
      const sub = k === 'Documents'
        ? (nPacked + ' packed · nothing flies without these')
        : (nPacked + ' packed');
      html += `<tr class="rd-hm-group"><td colspan="7">${esc(k)} · ${list.length} item${list.length === 1 ? '' : 's'} · ${esc(sub)}</td></tr>`;
      list.forEach(({ r, i }) => {
        const isPacked = !!(r.packed || /packed/i.test(String(r.status || '')));
        html += `<tr class="rd-hm-row" onclick="rdHmOpenPacking(${i})">` +
          `<td onclick="event.stopPropagation()"><input type="checkbox" ${isPacked ? 'checked' : ''} onchange="rdHmTogglePacked(${i}, this.checked)"></td>` +
          `<td class="rd-hm-name">${esc(r.item || 'Item')}</td>` +
          `<td>${esc(r.category || packingKit(r))}</td>` +
          `<td>${esc(r.who || r.owner || '—')}</td>` +
          `<td>${esc(r.qty != null ? r.qty : '1')}</td>` +
          `<td>${esc(isPacked ? 'Packed' : (r.status || 'Not packed'))}</td>` +
          `<td>${esc(r.notes || '—')}</td>` +
          `</tr>`;
      });
    });
    if (!rows.length) {
      html += `<tr class="rd-hm-empty"><td colspan="7">No packing items yet. Load a starter list or add the documents that gate the trip.</td></tr>`;
    }
    html += `</tbody></table>`;
    html += `<button type="button" class="rd-hm-addbtn" onclick="rdHmAddPacking()"><span>+</span> Add a packing item</button>`;
    return html;
  }

  function renderBudgetView() {
    ensureHm();
    const rows = data.hmBudgetItems || [];
    const target = tripBudgetTarget();
    const committed = budgetCommitted();
    let html = sectionHead(
      'Trip budget · ' + rows.length + ' line' + (rows.length === 1 ? '' : 's'),
      money0(committed) + ' committed of ' + money0(target) + ' · entirely separate from the wedding budget',
      'Print the budget', 'rdHmPrint()'
    );
    html += `<table class="rd-hm-table"><thead><tr>` +
      `<th style="width:34px"></th><th>Line</th><th>Category</th><th>Budgeted</th><th>Committed</th><th>Paid</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    const booked = [];
    const open = [];
    rows.forEach((r, i) => {
      const st = String(r.status || '').toLowerCase();
      if (/paid|booked|confirmed|deposit|committed/.test(st) || num(r.actual) > 0) booked.push({ r, i });
      else open.push({ r, i });
    });
    function renderBucket(label, list) {
      if (!list.length) return;
      html += `<tr class="rd-hm-group"><td colspan="7">${esc(label)} · ${list.length} line${list.length === 1 ? '' : 's'}</td></tr>`;
      list.forEach(({ r, i }) => {
        const paid = /paid/i.test(String(r.status || '')) ? num(r.actual || r.budgeted) : num(r.actual);
        html += `<tr class="rd-hm-row" onclick="rdHmOpenBudget(${i})">` +
          `<td></td>` +
          `<td class="rd-hm-name">${esc(r.item || 'Line')}</td>` +
          `<td>${esc(r.category || '—')}</td>` +
          `<td>${esc(money0(r.budgeted))}</td>` +
          `<td>${esc(money0(num(r.actual) || (/booked|paid|confirmed/i.test(String(r.status || '')) ? r.budgeted : 0)))}</td>` +
          `<td>${esc(money0(paid))}</td>` +
          `<td>${esc(r.status || 'Planned')}</td>` +
          `</tr>`;
      });
    }
    renderBucket('Booked', booked);
    renderBucket('Not committed', open);
    const budgetedSum = rows.reduce((s, r) => s + num(r.budgeted), 0);
    const over = budgetedSum - target;
    html += `<tr class="rd-hm-total"><td colspan="3">Total</td><td>${esc(money0(budgetedSum))}</td><td>${esc(money0(committed))}</td><td colspan="2">${over > 0 ? esc(money0(over) + ' over the ' + money0(target) + ' target') : esc(money0(target) + ' target')}</td></tr>`;
    if (!rows.length) {
      html += `<tr class="rd-hm-empty"><td colspan="7">No trip budget lines yet. Add flights, lodging, and a buffer — this total never appears on the wedding Budget page.</td></tr>`;
    }
    html += `</tbody></table>`;
    html += `<button type="button" class="rd-hm-addbtn" onclick="rdHmAddBudget()"><span>+</span> Add a budget line</button>`;
    return html;
  }

  function renderJournalView() {
    ensureHm();
    const rows = data.hmJournal || [];
    let html = sectionHead(
      'Daily journal · ' + rows.length + ' entr' + (rows.length === 1 ? 'y' : 'ies'),
      'Written on the trip, not before · one entry per day, and it prints as a Class B keepsake',
      'Start an entry', 'rdHmAddJournal()'
    );
    if (!rows.length) {
      html += `<div class="rd-hm-journal-empty">` +
        `<p>Empty days wait for the trip. The planner will not prompt you to write ahead of time — an unwritten journal is not a task in arrears.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHmAddJournal()">Start an entry</button>` +
        `</div>`;
      return html;
    }
    html += `<div class="rd-hm-journal">` + rows.map((r, i) =>
      `<article class="rd-hm-journal__card" onclick="rdHmOpenJournal(${i})">` +
      `<div class="rd-hm-journal__date">${esc(shortDate(r.date) || '—')}</div>` +
      `<h3>${esc(r.title || 'Untitled')}</h3>` +
      `<p>${esc(r.entry || '')}</p>` +
      (r.grateful ? `<p class="rd-hm-journal__grateful">Grateful · ${esc(r.grateful)}</p>` : '') +
      `</article>`
    ).join('') + `</div>`;
    return html;
  }

  function renderMainSurface() {
    const host = document.getElementById('honeymoon-view-host');
    if (!host) return;
    const sec = window._hmSection || 'bookings';
    if (sec === 'itinerary') host.innerHTML = renderItineraryView();
    else if (sec === 'packing') host.innerHTML = renderPackingView();
    else if (sec === 'budget') host.innerHTML = renderBudgetView();
    else if (sec === 'journal') host.innerHTML = renderJournalView();
    else host.innerHTML = renderBookingsView();
  }

  /* ── drawer ──────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }
  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  function renderHmDrawer() {
    const slot = document.getElementById('honeymoon-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const b = findBooking(window._hmDrawerId);
    if (!b || (window._hmSection || 'bookings') !== 'bookings') {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._hmDrawerTab, 10) || 0));
    const f = honeymoonFigures();
    const pct = f.budgetCommitted ? Math.round((b.cost / f.budgetCommitted) * 100) : 0;
    let body = '';
    if (tab === 0) {
      body =
        field('Type', b.type) +
        field('Provider', b.provider) +
        field('Dates', b.dates) +
        field('Reference', b.reference) +
        field('Status', b.status) +
        `<p class="rd-drawer__note">Bookings bind to the trip dates on the honeymoon overview — changing departure moves every bound row’s window.</p>`;
    } else if (tab === 1) {
      const isFlight = /flight/i.test(b.type);
      const budgetLine = 'Trip budget · ' + (isFlight ? 'Flights' : b.type);
      const refundable = isFlight ? 'No' : (/deposit/i.test(b.status) ? 'Deposit only' : '—');
      body =
        field('Cost', money0(b.cost)) +
        field('Status', b.status) +
        field('Budget line', budgetLine) +
        field('Refundable', refundable) +
        (isFlight ? field('Change fee', money0(120) + ' per ticket') : '') +
        field('This booking', (pct || 0) + '% of committed') +
        field('Trip budget committed', money0(f.budgetCommitted)) +
        field('Target', money0(f.budgetTarget)) +
        `<p class="rd-drawer__note">${isFlight
          ? 'Non-refundable, ' + (pct || 0) + '% of the committed trip budget — the largest single exposure in either budget.'
          : 'The honeymoon is real money in no wedding total. This booking never appears on the wedding Budget page.'}</p>`;
    } else if (tab === 2) {
      const missing = [];
      if (/insurance/i.test(b.type) && !b.complete) missing.push('Travel insurance');
      if (/flight/i.test(b.type)) missing.push('Yellow fever / entry cards (if required)');
      body =
        `<div class="rd-drawer__section-title">Documents</div>` +
        `<div class="rd-drawer__guest">E-ticket / confirmation <span>${esc(b.reference !== '—' ? 'Attached' : 'Missing')}</span></div>` +
        `<div class="rd-drawer__guest">Receipt <span>${b.complete ? 'On file' : '—'}</span></div>` +
        (missing.length
          ? `<p class="rd-drawer__note">Missing: ${esc(missing.join(' · '))}</p>`
          : `<p class="rd-drawer__note">Documents resolve from the booking reference when one exists.</p>`);
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>${esc(b.status)} · ${esc(b.title)}</div></div>` +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Cost · ${esc(money0(b.cost))}</div></div>` +
        `<p class="rd-drawer__note">History is provisional until honeymoon booking audit lands. This spend stays off the wedding budget.</p>`;
    }

    const domainCta = tab === 2
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHmBookInsurance()">Book insurance</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHmCloseDrawer()">Save</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hm-drawer" aria-label="Honeymoon booking">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Honeymoon booking</div>` +
      `<h2 class="rd-drawer__title">${esc(b.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="gold">${esc(b.type)}</span>` +
      `<span class="status-pill" data-pillscheme="${b.complete ? 'gold' : 'red'}">${esc(b.status)}</span>` +
      `<span class="status-pill" data-pillscheme="gold">${esc(money0(b.cost))}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdHmCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdHmSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}` +
      field('Trip budget', 'Open →', "applyHoneymoonSection('budget')") +
      field('Itinerary', 'Open →', "applyHoneymoonSection('itinerary')") +
      field('Packing', 'Open →', "applyHoneymoonSection('packing')") +
      `</div>` +
      `<div class="rd-drawer__foot">` +
      domainCta +
      `<button type="button" class="rd-btn" onclick="rdHmFullEditor('${esc(b.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdHmOpenDrawer(id) {
    window._hmSection = 'bookings';
    window._hmDrawerId = id;
    window._hmDrawerTab = 0;
    renderHoneymoonRd();
  }
  function rdHmCloseDrawer() {
    window._hmDrawerId = null;
    const slot = document.getElementById('honeymoon-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdHmSetDrawerTab(i) {
    window._hmDrawerTab = i;
    renderHmDrawer();
  }
  function rdHmAddBooking() {
    if (typeof openRecordEditor === 'function') openRecordEditor('honeyDetails');
    else if (typeof addHoneyDetailRow === 'function') addHoneyDetailRow();
  }
  function rdHmFullEditor(id) {
    const b = id ? findBooking(id) : findBooking(window._hmDrawerId);
    window._hmDrawerId = null;
    const slot = document.getElementById('honeymoon-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (b) openRecordEditor(b.src, b.index);
      else {
        const sec = window._hmSection || 'bookings';
        if (sec === 'itinerary') openRecordEditor('honeyItinerary');
        else if (sec === 'packing') openRecordEditor('packing');
        else if (sec === 'budget') openRecordEditor('hmBudgetItems');
        else if (sec === 'journal') openRecordEditor('hmJournal');
        else openRecordEditor('honeyDetails');
      }
    }
  }
  function rdHmAddPhoto() {
    const input = document.getElementById('hm-dest-photo-input');
    if (input) input.click();
    else if (typeof covAlert === 'function') covAlert('Add a destination photo from the honeymoon overview fields when available.');
  }
  function rdHmPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdHmExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Honeymoon bookings', allBookings().map(b => ({
        booking: b.title, type: b.type, provider: b.provider, dates: b.dates, cost: b.cost, reference: b.reference, status: b.status
      })));
    }
  }
  function rdHmAddIti() {
    if (typeof openRecordEditor === 'function') openRecordEditor('honeyItinerary');
    else if (typeof addHoneyItiRow === 'function') addHoneyItiRow();
  }
  function rdHmOpenIti(i) {
    if (typeof openRecordEditor === 'function') openRecordEditor('honeyItinerary', i);
  }
  function rdHmAddPacking() {
    if (typeof openRecordEditor === 'function') openRecordEditor('packing');
    else if (typeof addPackingRow === 'function') addPackingRow();
  }
  function rdHmOpenPacking(i) {
    if (typeof openRecordEditor === 'function') openRecordEditor('packing', i);
  }
  function rdHmLoadPacking() {
    if (typeof loadPackingPreset === 'function') loadPackingPreset();
  }
  function rdHmTogglePacked(i, on) {
    ensureHm();
    if (!data.packing[i]) return;
    data.packing[i].packed = !!on;
    data.packing[i].status = on ? 'Packed' : 'Not Packed';
    if (typeof save === 'function') save();
    renderHoneymoonRd();
  }
  function rdHmAddBudget() {
    if (typeof openRecordEditor === 'function') openRecordEditor('hmBudgetItems');
  }
  function rdHmOpenBudget(i) {
    if (typeof openRecordEditor === 'function') openRecordEditor('hmBudgetItems', i);
  }
  function rdHmAddJournal() {
    if (typeof addHmJournalEntry === 'function') addHmJournalEntry();
    else if (typeof openRecordEditor === 'function') openRecordEditor('hmJournal');
  }
  function rdHmOpenJournal(i) {
    if (typeof openRecordEditor === 'function') openRecordEditor('hmJournal', i);
  }
  function rdHmBookInsurance() {
    ensureHm();
    const existing = allBookings().find(b => /insurance/i.test(b.type + b.title));
    if (existing) rdHmOpenDrawer(existing.id);
    else rdHmAddBooking();
  }
  function rdHmCycleFilter(field) {
    const options = { all: true };
    if (field === 'type') allBookings().forEach(b => { options[b.type] = true; });
    if (field === 'status') {
      allBookings().forEach(b => { options[b.status] = true; });
      (data.honeyItinerary || []).forEach(r => { if (r.status) options[r.status] = true; });
      (data.packing || []).forEach(r => { options[r.packed ? 'Packed' : (r.status || 'Not packed')] = true; });
      (data.hmBudgetItems || []).forEach(r => { if (r.status) options[r.status] = true; });
    }
    if (field === 'day') (data.honeyItinerary || []).forEach(r => { if (r.day) options[r.day] = true; });
    const list = Object.keys(options);
    const cur = (window._hmUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._hmUiFilters[field] = list[(i + 1) % list.length];
    renderHoneymoonRd();
  }
  function rdHmClearFilter(field) {
    window._hmUiFilters[field] = 'all';
    renderHoneymoonRd();
  }
  function rdHmToggleSel(id) {
    if (window._hmSel.has(id)) window._hmSel.delete(id);
    else window._hmSel.add(id);
    renderMainSurface();
    renderBulkBar();
  }
  function renderBulkBar() {
    const host = document.getElementById('honeymoon-bulk-bar');
    if (!host) return;
    const n = window._hmSel.size;
    if (!n || (window._hmSection || 'bookings') !== 'bookings') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHmBulkStatus('Paid')">Mark paid</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHmBulkStatus('Not booked')">Mark not booked</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdHmBulkClear()">Clear selection</button>`;
  }
  function rdHmBulkClear() {
    window._hmSel.clear();
    renderMainSurface();
    renderBulkBar();
  }
  function rdHmBulkStatus(status) {
    Array.from(window._hmSel).forEach(id => {
      const b = findBooking(id);
      if (b && b.row) b.row.status = status;
    });
    if (typeof save === 'function') save();
    renderHoneymoonRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderHoneymoonRd() {
    ensureHm();
    if (typeof getSavedView === 'function') {
      let saved = getSavedView('honeymoon', window._hmSection || 'bookings');
      if (saved === 'after') saved = 'bookings';
      if (SECTIONS.some(s => s.id === saved)) window._hmSection = saved;
      else window._hmSection = 'bookings';
    }
    if (window._hmSection === 'after') window._hmSection = 'bookings';
    uedHoneymoonShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('honeymoon');
    renderHmStatsRd();
    renderSectionTabs();
    renderHmToolbar();
    renderBulkBar();
    renderMainSurface();
    renderHmDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'honeymoon'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('honeymoon');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('honeymoon');
  }

  window.uedHoneymoonShell = uedHoneymoonShellRd;
  window.renderHoneymoonPage = renderHoneymoonRd;
  window.renderHoneymoonRd = renderHoneymoonRd;
  window.applyHoneymoonSection = applyHoneymoonSection;
  window.honeymoonRailCounts = honeymoonRailCounts;
  window.honeymoonFigures = honeymoonFigures;
  window.rdHmOpenDrawer = rdHmOpenDrawer;
  window.rdHmCloseDrawer = rdHmCloseDrawer;
  window.rdHmSetDrawerTab = rdHmSetDrawerTab;
  window.rdHmAddBooking = rdHmAddBooking;
  window.rdHmFullEditor = rdHmFullEditor;
  window.rdHmAddPhoto = rdHmAddPhoto;
  window.rdHmPrint = rdHmPrint;
  window.rdHmExport = rdHmExport;
  window.rdHmAddIti = rdHmAddIti;
  window.rdHmOpenIti = rdHmOpenIti;
  window.rdHmAddPacking = rdHmAddPacking;
  window.rdHmOpenPacking = rdHmOpenPacking;
  window.rdHmLoadPacking = rdHmLoadPacking;
  window.rdHmTogglePacked = rdHmTogglePacked;
  window.rdHmAddBudget = rdHmAddBudget;
  window.rdHmOpenBudget = rdHmOpenBudget;
  window.rdHmAddJournal = rdHmAddJournal;
  window.rdHmOpenJournal = rdHmOpenJournal;
  window.rdHmBookInsurance = rdHmBookInsurance;
  window.rdHmCycleFilter = rdHmCycleFilter;
  window.rdHmClearFilter = rdHmClearFilter;
  window.rdHmToggleSel = rdHmToggleSel;
  window.rdHmBulkClear = rdHmBulkClear;
  window.rdHmBulkStatus = rdHmBulkStatus;

  window.hmTab = function (name) {
    const map = {
      overview: 'bookings', details: 'bookings', transport: 'bookings',
      itinerary: 'itinerary', packing: 'packing', budget: 'budget', journal: 'journal'
    };
    applyHoneymoonSection(map[name] || 'bookings');
  };

  function hookHoneymoonPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.honeymoon = function () { renderHoneymoonRd(); };
    }
  }
  hookHoneymoonPanelRenderer();
  var _showPanelHm = window.showPanel;
  if (typeof _showPanelHm === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelHm.call(window, id, forceOpen);
      hookHoneymoonPanelRenderer();
      return out;
    };
  }
})();
