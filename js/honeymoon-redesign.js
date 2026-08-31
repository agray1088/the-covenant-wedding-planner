/* Honeymoon & After — Master s32 · 17b · 47a · 47b · 19b
   Views: Bookings (17b default) · Itinerary view (47a) · Budget view (47b).
   Section tabs (19b): Overview · Details · Transportation · Itinerary · Packing ·
     Budget · Daily Journal — seven tabs on the Bookings view only.
   Rail: Details & bookings · Itinerary · Packing · Budget · Daily journal ·
     Thank-you notes · Post-wedding tasks · Newlywed Homecoming.
   Stats (17b): Days until trip · Bookings complete · Post-wedding tasks ·
     Thank-you notes due · Trip budget.
   Booking drawer tabs: Booking · Cost · Documents · History.
   Post-wedding counts read from Gifts and Homecoming — never typed here. */
(function () {
  'use strict';

  window._hmPageView = window._hmPageView || 'bookings';
  window._hmSection = window._hmSection || 'bookings';
  window._hmUiFilters = window._hmUiFilters || { type: 'all', status: 'all', day: 'all' };
  window._hmDrawerId = window._hmDrawerId || null;
  window._hmDrawerTab = window._hmDrawerTab || 0;
  window._hmSel = window._hmSel instanceof Set ? window._hmSel : new Set();

  /* View switcher (47a / 47b) — exact labels per fidelity pass. */
  const PAGE_VIEWS = [
    ['bookings', 'Honeymoon & After'],
    ['itineraryView', 'Itinerary view'],
    ['budgetView', 'Budget view']
  ];

  /* Seven section tabs (Master 19b). Details and Transportation are two
     filtered views of the one booking table — the same records the Overview
     tab shows in full — not separate datasets (17b full-page + same-records
     contract). Overview is the trip summary. */
  const SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'transport', label: 'Transportation' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'packing', label: 'Packing' },
    { id: 'budget', label: 'Budget' },
    { id: 'journal', label: 'Daily Journal' }
  ];
  /* Sections that show the booking table and open the booking drawer. */
  const BOOKING_SECTIONS = ['bookings', 'overview', 'details', 'transport'];
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
      stamp('honeyDetails', { item: 'Kilindi Zanzibar · 9 nights', section: 'Hotel', vendor: 'Kilindi Zanzibar', timeline: '19–28 Nov', cost: 1980, reference: 'KLD-99214', status: 'Deposit paid', paidBy: 'Both' }),
      stamp('honeyDetails', { item: 'Travel insurance', section: 'Insurance', vendor: '', timeline: '19–28 Nov', cost: 0, reference: '', status: 'Not booked' }),
      stamp('honeyDetails', { item: 'Mnemba atoll snorkelling', section: 'Excursion', vendor: 'Resort desk', timeline: '23 Nov', cost: 200, reference: '', status: 'Held, unpaid' })
    ];
    if (!data.honeyItinerary || !data.honeyItinerary.length) {
      data.honeyItinerary = [
        stamp('honeyItinerary', { date: '2026-11-19', day: 'Thursday', plan: 'Land, transfer, check in', time: '14:20', confirmation: 'Resort car', status: 'Confirmed' }),
        stamp('honeyItinerary', { date: '2026-11-20', day: 'Friday', plan: 'Nothing planned', time: '', confirmation: '', status: 'Nothing planned' }),
        stamp('honeyItinerary', { date: '2026-11-21', day: 'Saturday', plan: 'Stone Town & the spice farm', time: '09:00 – 17:00', confirmation: 'Resort desk', status: 'Confirmed' }),
        stamp('honeyItinerary', { date: '2026-11-22', day: 'Sunday', plan: 'Church, then rest', time: 'Morning', confirmation: '', status: 'Planned, nothing to book' }),
        stamp('honeyItinerary', { date: '2026-11-23', day: 'Monday', plan: 'Snorkelling · Mnemba atoll', time: '08:00 – 14:00', confirmation: 'Resort desk', status: 'Held, unpaid' }),
        stamp('honeyItinerary', { date: '2026-11-24', day: 'Tuesday', plan: 'Nothing planned', time: '', confirmation: '', status: 'Nothing planned' }),
        stamp('honeyItinerary', { date: '2026-11-25', day: 'Wednesday', plan: 'Sunset dhow cruise', time: '16:30', confirmation: 'Resort desk', status: 'Confirmed' }),
        stamp('honeyItinerary', { date: '2026-11-26', day: 'Thursday', plan: 'Jozani forest', time: '09:00', confirmation: 'Resort desk', status: 'Confirmed' }),
        stamp('honeyItinerary', { date: '2026-11-27', day: 'Friday', plan: 'Nothing planned', time: '', confirmation: '', status: 'Nothing planned' }),
        stamp('honeyItinerary', { date: '2026-11-28', day: 'Saturday', plan: 'Return flight · ZNZ → ACC', time: '14:15', confirmation: 'Kenya Airways · KQ 479', status: 'Confirmed' })
      ];
    }
    if (!num(data.hmBudget.total)) data.hmBudget.total = 5400;
    if (!data.honeymoon.depart) data.honeymoon.depart = '2026-11-19';
    if (!data.honeymoon.return) data.honeymoon.return = '2026-11-28';
    if (!data.honeymoon.destination) data.honeymoon.destination = 'Zanzibar';
    ensureMasterGiftFundRows();
    data._hmMasterS32 = true;
    if (typeof save === 'function') save();
  }

  /* Gift-fund contributions live on Gifts — honeymoon budget view reads them. */
  function ensureMasterGiftFundRows() {
    if (data._hmGiftFundSeeded) return;
    if (!Array.isArray(data.gifts)) return;
    const has = data.gifts.some(g => /honeymoon fund/i.test(String(g.registryCategory || '')));
    if (has) { data._hmGiftFundSeeded = true; return; }
    const rows = [
      ['Asante cousins', 90, '2026-07-08'], ['Church youth group', 80, '2026-07-10'],
      ['Nana Afua', 120, '2026-07-12'], ['Michael Whitfield', 100, '2026-07-14'],
      ['Grace Bennett', 85, '2026-07-15'], ['Daniel Carter', 95, '2026-07-16'],
      ['Emma Foster', 75, '2026-07-18'], ['Caleb Anderson', 110, '2026-07-19'],
      ['Sarah Whitfield', 90, '2026-07-20'], ['Thomas Carter', 100, '2026-07-22'],
      ['Carol Carter', 85, '2026-07-23'], ['Linda Whitfield', 95, '2026-07-24'],
      ['Robert Whitfield', 110, '2026-07-25'], ['Pastor David Reynolds', 105, '2026-07-26']
    ];
    rows.forEach(([from, value, date]) => {
      const row = {
        from: from, desc: 'Honeymoon fund contribution', value: value, date: date,
        category: 'Cash', registryCategory: 'Honeymoon fund',
        thankyou: true, thankyouStatus: 'Sent', thankyouDate: date
      };
      if (typeof nextRecordId === 'function') row._id = nextRecordId('gifts');
      data.gifts.push(row);
    });
    data._hmGiftFundSeeded = true;
  }

  function giftFundContributions() {
    ensureHm();
    const gifts = Array.isArray(data.gifts) ? data.gifts : [];
    const rows = gifts.filter(g => {
      const cat = String(g.registryCategory || '').toLowerCase();
      const earmark = String(g.earmark || '').toLowerCase();
      const desc = String(g.desc || g.description || '').toLowerCase();
      return /honeymoon fund/.test(cat) || /honeymoon/.test(earmark) || /honeymoon fund/.test(desc);
    });
    return {
      total: rows.reduce((s, g) => s + num(g.value), 0),
      count: rows.length,
      rows: rows
    };
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
  /* Two "after the day" counts read from Gifts and Tasks, never typed here. */
  function thankYouPending() {
    const gifts = (window.data && Array.isArray(data.gifts)) ? data.gifts : [];
    return gifts.filter(g => {
      const t = String(g.thankYou || g.thankYouStatus || g.thanked || '').trim().toLowerCase();
      return !/^sent$|^written$|^done$|^complete/.test(t);
    }).length;
  }
  function postWeddingTaskCounts() {
    const hc = (window.data && Array.isArray(data.homecoming)) ? data.homecoming : [];
    const nc = (window.data && Array.isArray(data.nameChange)) ? data.nameChange : [];
    const all = hc.length + nc.length;
    const openHc = hc.filter(r => {
      const s = String(r.status || (r.done ? 'Done' : '')).trim().toLowerCase();
      return !/^done$|^complete/.test(s);
    }).length;
    const openNc = nc.filter(r => {
      const s = String(r.status || (r.done ? 'Done' : '')).trim().toLowerCase();
      return !/^done$|^complete/.test(s);
    }).length;
    const open = openHc + openNc;
    return { total: all, open: open, complete: Math.max(0, all - open) };
  }
  function postWeddingTasks() {
    return postWeddingTaskCounts().open;
  }

  function honeymoonRailCounts() {
    const f = honeymoonFigures();
    ensureHm();
    return {
      overview: f.bookingsTotal,
      bookings: f.bookingsTotal,
      details: (data.honeyDetails || []).length,
      transport: (data.honeyTransport || []).length,
      bookings: f.bookingsTotal,
      itinerary: f.itineraryTotal,
      packing: f.packingTotal,
      budget: f.budgetLines,
      journal: f.journalCount,
      thankyou: thankYouPending(),
      postwedding: postWeddingTasks()
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
    if (panel.dataset.uedShell === 'honeymoon-rd-s32b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'honeymoon-rd-s32b';
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
          <div class="rd-surface__main" id="honeymoon-view-host">
            <div class="rd-view" id="hm-view-bookings"></div>
            <div class="rd-view" id="hm-view-itineraryView" hidden></div>
            <div class="rd-view" id="hm-view-budgetView" hidden></div>
          </div>
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
    const postTasks = postWeddingTaskCounts();
    const thankDue = thankYouPending();
    const bookingsPct = f.bookingsTotal
      ? Math.round((f.bookingsComplete / f.bookingsTotal) * 100)
      : 0;
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Days until trip', value: daysVal },
        {
          label: 'Bookings complete',
          value: bookingsVal,
          target: { pct: bookingsPct }
        },
        { label: 'Post-wedding tasks', value: postTasks.complete + ' of ' + Math.max(postTasks.total, postTasks.complete) },
        { label: 'Thank-you notes due', value: String(thankDue), attention: thankDue ? 'from Gifts' : undefined },
        { label: 'Trip budget', value: money0(f.budgetTarget) }
      ]);
      return;
    }
    host.innerHTML = [
      ['Days until trip', daysVal],
      ['Bookings complete', bookingsVal],
      ['Post-wedding tasks', postTasks.complete + ' of ' + Math.max(postTasks.total, postTasks.complete)],
      ['Thank-you notes due', String(thankDue)],
      ['Trip budget', money0(f.budgetTarget)]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function renderSectionTabs() {
    const host = document.getElementById('honeymoon-section-tabs');
    if (!host) return;
    const pageView = window._hmPageView || 'bookings';
    if (pageView !== 'bookings') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    const cur = window._hmSection || 'bookings';
    const tabActive = SECTIONS.some(s => s.id === cur) ? cur : '';
    host.innerHTML = SECTIONS.map(s =>
      `<button type="button" class="rd-sectiontabs__item${tabActive === s.id ? ' is-active' : ''}" role="tab" aria-selected="${tabActive === s.id}" onclick="applyHoneymoonSection('${s.id}')">${esc(s.label)}</button>`
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
    const pageView = window._hmPageView || 'bookings';
    const sec = window._hmSection || 'bookings';
    let left = '';
    if (pageView === 'itineraryView') {
      left = `<span class="rd-ess-toolbar-note">Gaps are shown as gaps — a day with nothing booked says so instead of inheriting the day before</span>`;
    } else if (pageView === 'budgetView') {
      left = `<span class="rd-ess-toolbar-note">Gift-fund contributions are contributions, not budget — totalled separately below</span>`;
    } else if (sec === 'overview' || sec === 'bookings') {
      left = filterChip('Type', 'type') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by date</button>`;
    } else if (sec === 'details' || sec === 'transport') {
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
    if (pageView === 'bookings' && (sec === 'overview' || sec === 'bookings' || sec === 'details' || sec === 'transport')) {
      left += (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('honeymoon') : '');
    }
    const pv = pageView || 'bookings';
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Honeymoon view">` +
      PAGE_VIEWS.map(([id, label]) =>
        `<button type="button" class="rd-viewswitch__item${pv === id ? ' is-active' : ''}" onclick="rdSetHmPageView('${id}')">${esc(label)}</button>`
      ).join('') +
      `</div></div>`;
  }

  function normalizeSection(id) {
    if (id === 'after') return 'overview';
    if (id === 'bookings') return 'bookings';
    return SECTIONS.some(s => s.id === id) ? id : 'bookings';
  }
  function applyHoneymoonSection(id) {
    window._hmPageView = 'bookings';
    window._hmSection = normalizeSection(id);
    if (typeof setSavedView === 'function') setSavedView('honeymoon', window._hmSection);
    window._hmDrawerId = null;
    renderHoneymoonRd();
  }
  function rdSetHmPageView(mode) {
    window._hmPageView = (mode === 'itineraryView' || mode === 'budgetView') ? mode : 'bookings';
    if (window._hmPageView === 'bookings' && !BOOKING_SECTIONS.includes(window._hmSection) &&
        !SECTIONS.some(s => s.id === window._hmSection)) {
      window._hmSection = 'bookings';
    }
    window._hmDrawerId = null;
    renderHoneymoonRd();
  }
  function applyPageViewMode() {
    const mode = window._hmPageView || 'bookings';
    ['bookings', 'itineraryView', 'budgetView'].forEach(name => {
      const el = document.getElementById('hm-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  /* ── section surfaces ────────────────────────────────────────────────── */

  function sectionHead(title, help, ctaLabel, ctaOnclick) {
    return `<div class="rd-section__head">` +
      `<div><div class="rd-pagehead__eyebrow">${esc(title)}</div>` +
      `<p class="rd-help">${esc(help)}</p></div>` +
      (ctaLabel ? `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="${ctaOnclick}">${esc(ctaLabel)}</button>` : '') +
      `</div>`;
  }

  function renderOverviewView() {
    ensureHm();
    const f = honeymoonFigures();
    const hm = data.honeymoon || {};
    const dest = String(hm.destination || 'the honeymoon').trim() || 'the honeymoon';
    const depart = shortDate(hm.depart);
    const back = shortDate(hm.return);
    const openBookings = allBookings().filter(b => !b.complete);
    const daysVal = f.daysUntil == null ? '—' : String(Math.max(f.daysUntil, 0));

    let html = sectionHead(
      'Overview · ' + dest,
      (depart !== '—' ? depart + ' – ' + back + ' · ' : '') + daysVal + ' days until the trip · the page that starts the day the rest of the planner stops',
      'Add a booking', 'rdHmAddBooking()'
    );
    html += `<div class="rd-hm-overview">`;
    [
      ['Days until trip', daysVal],
      ['Bookings complete', f.bookingsComplete + ' of ' + f.bookingsTotal],
      ['Packed', f.packed + ' of ' + f.packingTotal],
      ['Itinerary days', f.itineraryPlanned + ' of ' + f.itineraryTotal],
      ['Committed', money0(f.budgetCommitted)],
      ['Trip budget', money0(f.budgetTarget)]
    ].forEach(([l, v]) => {
      html += `<div class="rd-hm-overview__card"><div class="rd-hm-overview__label">${esc(l)}</div><div class="rd-hm-overview__val">${esc(String(v))}</div></div>`;
    });
    html += `</div>`;

    html += `<div class="rd-hm-overview__open">`;
    html += `<div class="rd-section__head"><div><div class="rd-pagehead__eyebrow">Still open</div>` +
      `<p class="rd-help">${openBookings.length ? (openBookings.length + ' booking' + (openBookings.length === 1 ? '' : 's') + ' not settled yet') : 'Every booking is settled'}</p></div></div>`;
    if (openBookings.length) {
      html += `<div class="rd-hm-openlist">` + openBookings.map(b =>
        `<button type="button" class="rd-hm-openrow" onclick="rdHmOpenDrawer('${esc(b.id)}')">` +
        `<span class="rd-hm-openrow__name">${esc(b.title)}</span>` +
        `<span class="rd-hm-openrow__meta">${esc(b.type)} · ${esc(money0(b.cost))}</span>` +
        `<span class="status-pill" data-pillscheme="red">${esc(b.status)}</span>` +
        `</button>`
      ).join('') + `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderBookingsView(sourceFilter) {
    const src = sourceFilter || 'all';
    const bookings = allBookings().filter(matchesBookingFilters).filter(b =>
      src === 'all' ? true : (src === 'transport' ? b.src === 'honeyTransport' : b.src === 'honeyDetails')
    );
    const f = honeymoonFigures();
    const openN = bookings.filter(b => b.open || !b.complete).length;
    const settledMsg = src === 'transport' ? 'all travel booked' : (src === 'details' ? 'all details settled' : 'all bookings settled');
    const heading = src === 'transport' ? 'Transportation' : (src === 'details' ? 'Details' : 'Details & bookings');
    const confirmed = bookings.filter(b => b.complete).length;
    const help = confirmed + ' confirmed · ' +
      (openN ? openN + ' still open' : settledMsg);
    /* Complete Travel/Lodging stay in group; incomplete → Open */
    const buckets = { Travel: [], Lodging: [], Open: [] };
    bookings.forEach(b => {
      if (!b.complete) buckets.Open.push(b);
      else if (b.group === 'Lodging') buckets.Lodging.push(b);
      else if (b.group === 'Travel') buckets.Travel.push(b);
      else buckets.Open.push(b);
    });

    let html = sectionHead(
      heading + ' · ' + bookings.length + ' row' + (bookings.length === 1 ? '' : 's'),
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

  function bookingPaidAmount(b) {
    if (!b) return 0;
    const st = String(b.status || '').toLowerCase();
    if (/\bpaid\b/.test(st) && !/\bunpaid\b|\bnot\b/.test(st)) return b.cost;
    if (/deposit/.test(st)) return Math.round(b.cost * 0.5);
    return 0;
  }
  function bookingOutstanding(b) {
    return Math.max(0, b.cost - bookingPaidAmount(b));
  }
  function bookingPaidBy(b) {
    if (!b || !b.row) return '—';
    return String(b.row.paidBy || b.row.owner || b.row.assigned || '').trim() || '—';
  }
  function budgetBucketLabel(type) {
    const t = String(type || '').toLowerCase();
    if (/flight|transfer|transport/.test(t)) return 'Travel';
    if (/hotel|lodging/.test(t)) return 'Accommodation';
    return 'Experiences';
  }

  /* ── 47a · Itinerary view — day-by-day, gaps shown as gaps ─────────── */

  function buildDayByDayItinerary() {
    ensureHm();
    const dep = parseDate(data.honeymoon.depart);
    const ret = parseDate(data.honeymoon.return);
    if (!dep || !ret) return (data.honeyItinerary || []).map((r, i) => ({ r, i, date: r.date }));
    const days = [];
    const cur = new Date(dep);
    while (cur <= ret) {
      const iso = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
      const iti = (data.honeyItinerary || []).find(r => String(r.date || '').startsWith(iso) || shortDate(r.date) === shortDate(iso));
      const bookings = allBookings().filter(b => {
        const d = parseDate(b.row.date || b.dates);
        return d && d.toDateString() === cur.toDateString();
      });
      days.push({ date: iso, dt: new Date(cur), iti: iti, bookings: bookings });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  function renderItineraryView47a() {
    const host = document.getElementById('hm-view-itineraryView');
    if (!host) return;
    ensureHm();
    const hm = data.honeymoon || {};
    const dest = String(hm.destination || 'the trip').trim();
    const days = buildDayByDayItinerary();
    const unplanned = days.filter(d => {
      const plan = d.iti ? String(d.iti.plan || '').trim() : '';
      return !plan || /^nothing planned$/i.test(plan);
    }).length;

    let html = sectionHead(
      dest + ' · ' + days.length + ' day' + (days.length === 1 ? '' : 's'),
      unplanned
        ? (unplanned + ' day' + (unplanned === 1 ? '' : 's') + ' with nothing planned · shown, not chased')
        : 'Every day has a plan',
      'Print itinerary', 'rdHmPrint()'
    );

    html += `<div class="rd-hm-daylist">`;
    let weekLabel = '';
    days.forEach((d, idx) => {
      const mid = days.length > 1 ? Math.floor(days.length / 2) : 0;
      const wk = idx <= mid ? 'Arrival week' : 'Second week';
      if (wk !== weekLabel) {
        weekLabel = wk;
        const range = idx === 0
          ? shortDate(days[0].date) + ' – ' + shortDate(days[Math.min(mid, days.length - 1)].date)
          : shortDate(days[mid + 1] ? days[mid + 1].date : d.date) + ' – ' + shortDate(days[days.length - 1].date);
        html += `<div class="rd-hm-daylist__week">${esc(wk)} · ${esc(range)}</div>`;
      }
      const plan = d.iti ? String(d.iti.plan || '').trim() : '';
      const nothing = !plan || /^nothing planned$/i.test(plan);
      const dayName = weekday(d.date) || (d.iti && d.iti.day) || '—';
      const dateLabel = shortDate(d.date);
      const time = d.iti ? String(d.iti.time || '').trim() : '';
      const through = d.iti ? String(d.iti.confirmation || d.iti.location || '').trim() : '';
      const status = nothing ? 'Nothing planned' : String((d.iti && d.iti.status) || 'Planned');

      html += `<article class="rd-hm-day${nothing ? ' is-gap' : ''}">` +
        `<div class="rd-hm-day__head">` +
        `<span class="rd-hm-day__title">${esc(dayName)} · ${esc(dateLabel)}</span>` +
        `<span class="status-pill" data-pillscheme="${nothing ? 'red' : 'gold'}">${esc(status)}</span>` +
        `</div>`;

      if (nothing && !d.bookings.length) {
        html += `<p class="rd-hm-day__gap">Nothing booked</p>`;
        if (idx > 0 && idx < days.length - 1) {
          html += `<p class="rd-hm-day__note">Deliberately open — rest day</p>`;
        }
      } else {
        if (plan && !nothing) {
          html += `<div class="rd-hm-day__plan">${esc(plan)}` +
            (time ? `<span class="rd-hm-day__time">${esc(time)}</span>` : '') +
            (through ? `<span class="rd-hm-day__through">${esc(through)}</span>` : '') +
            `</div>`;
        }
        d.bookings.forEach(b => {
          html += `<div class="rd-hm-day__booking" onclick="rdHmOpenDrawer('${esc(b.id)}')">` +
            `<span>${esc(b.title)}</span>` +
            `<span class="rd-hm-day__meta">${esc(b.type)} · ${esc(b.dates)}</span>` +
            `</div>`;
        });
      }
      html += `</article>`;
    });
    html += `</div>`;
    host.innerHTML = html;
  }

  /* ── 47b · Budget view — bookings + gift fund separate ─────────────── */

  function renderBudgetView47b() {
    const host = document.getElementById('hm-view-budgetView');
    if (!host) return;
    ensureHm();
    const target = tripBudgetTarget();
    const committed = budgetCommitted();
    const bookings = allBookings();
    const paid = bookings.reduce((s, b) => s + bookingPaidAmount(b), 0);
    const gift = giftFundContributions();

    let html = sectionHead(
      'Trip budget · all bookings',
      money0(committed) + ' committed of ' + money0(target) + ' set aside · entirely separate from the wedding budget',
      'Export', 'rdHmExport()'
    );

    html += `<div class="rd-hm-budgetsum">` +
      `<div class="rd-hm-budgetsum__card"><span>Set aside</span><strong>${esc(money0(target))}</strong></div>` +
      `<div class="rd-hm-budgetsum__card"><span>Committed</span><strong>${esc(money0(committed))}</strong></div>` +
      `<div class="rd-hm-budgetsum__card"><span>Paid</span><strong>${esc(money0(paid))}</strong></div>` +
      `<div class="rd-hm-budgetsum__card rd-hm-budgetsum__card--gift"><span>Gift fund received</span><strong>${esc(money0(gift.total))}</strong></div>` +
      `</div>`;

    const buckets = { Travel: [], Accommodation: [], Experiences: [] };
    bookings.forEach(b => {
      buckets[budgetBucketLabel(b.type)].push(b);
    });

    Object.keys(buckets).forEach(label => {
      const list = buckets[label];
      if (!list.length) return;
      const sum = list.reduce((s, b) => s + b.cost, 0);
      html += `<div class="rd-hm-budgetgrp"><div class="rd-hm-budgetgrp__head">${esc(label)} · ${esc(money0(sum))}</div>`;
      list.forEach(b => {
        const paidAmt = bookingPaidAmount(b);
        const out = bookingOutstanding(b);
        const who = bookingPaidBy(b);
        const ref = b.reference !== '—' ? b.reference : '';
        let payLine = '';
        if (paidAmt >= b.cost) payLine = esc(money0(paidAmt)) + ' paid';
        else if (paidAmt > 0) payLine = esc(money0(b.cost)) + ' · ' + esc(money0(paidAmt)) + ' paid';
        else if (b.cost > 0) payLine = esc(money0(out)) + ' due';
        else payLine = 'Estimate only';
        const pill = paidAmt >= b.cost ? 'Paid' : (paidAmt > 0 ? 'Part paid' : (/not booked|held|open/i.test(b.status) ? 'Estimate' : 'Due'));
        html += `<button type="button" class="rd-hm-budgetrow" onclick="rdHmOpenDrawer('${esc(b.id)}')">` +
          `<span class="rd-hm-budgetrow__name">${esc(b.title)}</span>` +
          `<span class="rd-hm-budgetrow__meta">${who !== '—' ? ('Paid by ' + esc(who) + (ref ? ' · ' + esc(ref) : '')) : esc(b.status)}</span>` +
          `<span class="rd-hm-budgetrow__amt">${payLine}</span>` +
          `<span class="status-pill" data-pillscheme="${paidAmt >= b.cost ? 'gold' : 'red'}">${esc(pill)}</span>` +
          `</button>`;
      });
      html += `</div>`;
    });

    html += `<div class="rd-hm-budgetgrp rd-hm-budgetgrp--gift">` +
      `<div class="rd-hm-budgetgrp__head">Gift fund · ${esc(money0(gift.total))} received</div>` +
      `<p class="rd-help">Contributions, not budget — shown separately by design</p>` +
      `<div class="rd-hm-budgetrow rd-hm-budgetrow--static">` +
      `<span class="rd-hm-budgetrow__name">Honeymoon fund · ${gift.count} contribution${gift.count === 1 ? '' : 's'}</span>` +
      `<span class="rd-hm-budgetrow__meta"><button type="button" class="rd-link-quiet" onclick="typeof showPanel==='function'&&showPanel('gifts')">Gifts page · registry</button></span>` +
      `<span class="rd-hm-budgetrow__amt">${esc(money0(gift.total))}</span>` +
      `<span class="status-pill" data-pillscheme="gold">Contributions</span>` +
      `</div></div>`;

    host.innerHTML = html;
  }

  function renderMainSurface() {
    applyPageViewMode();
    const pageView = window._hmPageView || 'bookings';
    if (pageView === 'itineraryView') {
      renderItineraryView47a();
      return;
    }
    if (pageView === 'budgetView') {
      renderBudgetView47b();
      return;
    }
    const host = document.getElementById('hm-view-bookings');
    if (!host) return;
    const sec = window._hmSection || 'bookings';
    if (sec === 'overview') host.innerHTML = renderOverviewView();
    else if (sec === 'bookings') host.innerHTML = renderBookingsView('all');
    else if (sec === 'details') host.innerHTML = renderBookingsView('details');
    else if (sec === 'transport') host.innerHTML = renderBookingsView('transport');
    else if (sec === 'itinerary') host.innerHTML = renderItineraryView();
    else if (sec === 'packing') host.innerHTML = renderPackingView();
    else if (sec === 'budget') host.innerHTML = renderBudgetView();
    else if (sec === 'journal') host.innerHTML = renderJournalView();
    else host.innerHTML = renderBookingsView('all');
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
    const pageView = window._hmPageView || 'bookings';
    const drawerAllowed = BOOKING_SECTIONS.includes(window._hmSection || 'bookings') ||
      pageView === 'budgetView' || pageView === 'itineraryView';
    if (!b || !drawerAllowed) {
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
    const pageView = window._hmPageView || 'bookings';
    if (!BOOKING_SECTIONS.includes(window._hmSection) && pageView === 'bookings') {
      window._hmSection = 'bookings';
    }
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
    if (!n || !BOOKING_SECTIONS.includes(window._hmSection || 'overview')) {
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
      window._hmSection = normalizeSection(getSavedView('honeymoon', window._hmSection || 'bookings'));
    }
    window._hmSection = normalizeSection(window._hmSection || 'bookings');
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
  window.rdSetHmPageView = rdSetHmPageView;
  window.giftFundContributions = giftFundContributions;

  window.hmTab = function (name) {
    const map = {
      overview: 'overview', details: 'details', transport: 'transport',
      transportation: 'transport', bookings: 'bookings', after: 'overview',
      itinerary: 'itinerary', packing: 'packing', budget: 'budget', journal: 'journal'
    };
    window._hmPageView = 'bookings';
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
