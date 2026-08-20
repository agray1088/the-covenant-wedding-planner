/* Gifts page - mock 10b · grouped table · rail · drawer · Table | Registry | Notes */
(function () {
  'use strict';

  const GIFTS_DRAWER_TABS = ['Gift', 'Giver', 'Thank-you', 'History'];
  const GIFT_THANK_STATUSES = ['Sent', 'Drafted', 'Not started'];
  const GIFT_TYPES = ['Cash', 'Registry', 'Handmade', 'Gift Card', 'Other'];
  const RD_GIFTS_COLUMNS = [
    { key: 'desc', label: 'Gift', width: '190px' },
    { key: 'from', label: 'From', width: '170px' },
    { key: 'category', label: 'Type', width: '110px' },
    { key: 'value', label: 'Value', width: '100px' },
    { key: 'date', label: 'Received', width: '110px' },
    { key: 'thankyou', label: 'Thank-you', width: '130px' }
  ];

  /* The table engine builds the header, the group rows and the select gutter
     from d.columns, so hiding a column is a matter of handing it a shorter
     list — the colspans downstream follow the live header count. */
  const GIFTS_COL_SCOPE = 'gifts';
  if (window.rdColumns) {
    window.rdColumns.register(GIFTS_COL_SCOPE, RD_GIFTS_COLUMNS.slice(), () => {
      renderGiftsPreviewTable();
      renderGiftsToolbar();
    });
  }
  function giftsVisibleColumns() {
    return window.rdColumns ? window.rdColumns.visible(GIFTS_COL_SCOPE) : RD_GIFTS_COLUMNS;
  }

  window._giftsUiFilters = window._giftsUiFilters || {
    type: 'all', thankyou: 'all', received: 'all',
    category: 'all', status: 'all', household: 'all', agedOver14: false
  };
  window._giftsAssignSort = window._giftsAssignSort || 'date';
  window._giftsRailView = window._giftsRailView || 'all';
  window._giftsRailGroupBy = window._giftsRailGroupBy || 'type';

  function giftRows() { return safeArray(data.gifts); }

  function ensureGiftRegistryCategories() {
    if (Array.isArray(data.giftRegistryCategories) && data.giftRegistryCategories.length) {
      return data.giftRegistryCategories;
    }
    /* Registry view (29e) categories — item cards vs contribution cards (honesty rule). */
    data.giftRegistryCategories = [
      {
        name: 'Kitchen & dining', items: 18, claimed: 11, valueClaimed: 1240, openValue: 860, pace: 'On track',
        store: 'Homestore Ghana · Kitchen list',
        openItems: [
          { name: 'Dutch oven, 5 qt', value: 95 },
          { name: 'Chef knife set', value: 140 },
          { name: 'Serving bowls, set of 3', value: 68 }
        ]
      },
      {
        name: 'Bedroom & linen', items: 12, claimed: 4, valueClaimed: 380, openValue: 720, pace: 'Slow',
        store: 'Homestore Ghana · Linen',
        openItems: [
          { name: 'Percale sheet set, queen', value: 160 },
          { name: 'Duvet insert', value: 190 },
          { name: 'Bath towel pair', value: 48 }
        ]
      },
      {
        name: 'Home & decor', items: 9, claimed: 7, valueClaimed: 690, openValue: 210, pace: 'On track',
        store: 'Kitchen & Table',
        openItems: [
          { name: 'Ceramic vase', value: 55 },
          { name: 'Wall mirror, round', value: 120 }
        ]
      },
      {
        name: 'Honeymoon fund', kind: 'fund', raised: 1150, goal: 2000, contributors: 9, average: 128,
        store: 'Honeymoon · open contributions',
        contributions: [
          { from: 'Mr & Mrs Owusu', amount: 400, date: '2026-07-14' },
          { from: 'Auntie Akua', amount: 200, date: '2026-07-21' },
          { from: 'Church friends', amount: 150, date: '2026-07-18' }
        ]
      },
      {
        name: 'Experiences', items: 6, claimed: 2, valueClaimed: 300, openValue: 480, pace: 'Slow',
        store: 'Experiences registry',
        openItems: [
          { name: 'Cooking class for two', value: 160 },
          { name: 'Weekend stay voucher', value: 220 }
        ]
      },
      {
        name: 'Charity in lieu', kind: 'charity', causes: 2, raised: 420, donors: 7, average: 60,
        store: 'Charity in lieu · two causes',
        contributions: [
          { from: 'Darko family', amount: 100, date: '2026-07-02' },
          { from: 'Office colleagues', amount: 80, date: '2026-07-16' }
        ]
      }
    ];
    return data.giftRegistryCategories;
  }

  function giftRegistryCategoryHints(name) {
    const n = String(name || '').toLowerCase();
    if (/kitchen|dining/.test(n)) return /cast iron|dinner|mixer|kitchen|plate|cook|service|dutch|knife|bowl/i;
    if (/bedroom|linen/.test(n)) return /linen|bedding|sheet|pillow|towel|duvet|percale/i;
    if (/home|decor/.test(n)) return /decor|frame|lamp|vase|mirror|scripture/i;
    if (/experience/.test(n)) return /experience|voucher|class|stay/i;
    if (/honeymoon/.test(n)) return /honeymoon|fund/i;
    if (/charity/.test(n)) return /charity|cause|donate|lieu/i;
    return null;
  }

  function giftMatchesRegistryCategory(row, catName) {
    const re = giftRegistryCategoryHints(catName);
    if (!re) return false;
    return re.test(String((row && row.desc) || '') + ' ' + String((row && row.from) || ''));
  }

  function registryCategoryRelatedGifts(cat) {
    const name = cat && cat.name;
    if (!name) return [];
    return giftRows().filter(r => {
      if (cat.kind === 'fund' || cat.kind === 'charity') {
        return giftMatchesRegistryCategory(r, name) || (giftType(r) === 'Cash' && giftMatchesRegistryCategory(r, name));
      }
      return giftType(r) === 'Registry' && giftMatchesRegistryCategory(r, name);
    });
  }

  function moneyFmt(n) {
    const v = parseFloat(n) || 0;
    if (typeof fmt === 'function') return fmt(v);
    return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function giftShortDate(d) {
    if (!d) return '—';
    if (typeof humanDate === 'function') {
      try { return humanDate(d, { month: 'short', day: 'numeric' }); } catch (e) { /* keep */ }
    }
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const dt = new Date(s.slice(0, 10) + 'T12:00:00');
      if (!isNaN(dt)) return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return s;
  }

  function giftType(row) {
    if (typeof inferGiftCategory === 'function') return inferGiftCategory(row);
    return row && row.category ? row.category : 'Registry';
  }

  function giftTypeGroupTitle(type) {
    const t = String(type || '').toLowerCase();
    if (t === 'cash') return 'Cash & transfers';
    if (t === 'registry') return 'Registry';
    if (t === 'handmade') return 'Given in person';
    if (t === 'gift card') return 'Gift cards';
    return type || 'Other';
  }

  function giftThankStatus(row) {
    if (!row) return 'Not started';
    if (row.thankyouStatus) return row.thankyouStatus;
    if (row.thankyou) return 'Sent';
    if (row.thankyouDraft) return 'Drafted';
    return 'Not started';
  }

  function giftThankLabel(row) {
    const st = giftThankStatus(row);
    if (st === 'Sent') {
      const d = row.thankyouDate || row.thankyouSentDate;
      return d ? ('Sent ' + giftShortDate(d)) : 'Sent';
    }
    return st;
  }

  function giftThankPillHtml(row) {
    const st = giftThankStatus(row);
    const scheme = st === 'Sent' ? 'green' : (st === 'Drafted' ? 'amber' : 'red');
    const lab = giftThankLabel(row);
    if (typeof guestRsvpPillHtml === 'function') {
      return guestRsvpPillHtml(lab).replace(/data-pillscheme="[^"]+"/, 'data-pillscheme="' + scheme + '"');
    }
    const cls = scheme === 'green' ? 'pill-ok' : (scheme === 'amber' ? 'pill-warn' : 'pill-danger');
    return '<span class="status-pill ' + cls + '">' + escapeHtml(lab) + '</span>';
  }

  function giftLinkedGuest(row) {
    if (!row) return null;
    if (row.guestId && typeof findRecordById === 'function') {
      const g = findRecordById('guests', row.guestId);
      if (g) return g;
    }
    if (typeof findGuestByLabel === 'function') return findGuestByLabel(row.from);
    const name = String(row.from || '').trim().toLowerCase();
    if (!name) return null;
    return safeArray(data.guests).find(g =>
      String(g.name || '').trim().toLowerCase() === name ||
      String(g.household || '').trim().toLowerCase() === name
    ) || null;
  }

  function ensureGiftsDemoSeed() {
    if (giftRows().length) return;
    const seed = [
      { from: 'Mr & Mrs Owusu', desc: 'Momo transfer', value: 1200, date: '2026-07-14', category: 'Cash', typeDetail: 'Cash · mobile money', thankyou: true, thankyouStatus: 'Sent', thankyouDate: '2026-07-18', writtenBy: 'Ama', thankMethod: 'Handwritten card', loggedBy: 'Ama', earmark: 'Budget · Venue', earmarkNote: 'A cash gift can be earmarked. This one went to the Grace Hall balance.', address: '12 Ridge Rd, Accra', notes: 'Mentioned the deposit it covered — Grace Hall balance.' },
      { from: 'Auntie Akua', desc: 'Bank transfer', value: 650, date: '2026-07-21', category: 'Cash', typeDetail: 'Cash · bank transfer', thankyou: false, thankyouStatus: 'Drafted', thankyouDraft: true, noteReady: true, address: '14 Ring Road, Accra', loggedBy: 'Ama' },
      { from: 'Darko family', desc: 'Envelope at engagement', value: 300, date: '2026-07-02', category: 'Cash', thankyou: true, thankyouStatus: 'Sent', thankyouDate: '2026-07-09', loggedBy: 'Ama', address: 'Darko household' },
      { from: 'Efua Mensah', desc: 'Cast iron set', value: 220, date: '2026-07-19', category: 'Registry', thankyou: true, thankyouStatus: 'Sent', thankyouDate: '2026-07-24', address: 'Efua Mensah' },
      { from: 'Asante household', desc: 'Dinner service, 8', value: 310, date: '2026-07-23', category: 'Registry', thankyou: false, thankyouStatus: 'Not started' },
      { from: 'Boateng household', desc: 'Linen bundle', value: 180, date: '2026-07-26', category: 'Registry', thankyou: false, thankyouStatus: 'Drafted', thankyouDraft: true },
      { from: 'Church small group', desc: 'Stand mixer', value: 130, date: '2026-07-28', category: 'Registry', thankyou: false, thankyouStatus: 'Not started' },
      { from: 'Amponsah household', desc: 'Experience voucher', value: 140, date: '2026-07-20', category: 'Registry', thankyou: false, thankyouStatus: 'Drafted', thankyouDraft: true, noteReady: true },
      { from: 'Nana Osei', desc: 'Kente cloth, two panels', value: 180, date: '2026-07-12', category: 'Handmade', thankyou: true, thankyouStatus: 'Sent', thankyouDate: '2026-07-15' },
      { from: 'Adjoa Sarpong', desc: 'Framed wedding scripture', value: 80, date: '2026-07-20', category: 'Handmade', thankyou: true, thankyouStatus: 'Sent', thankyouDate: '2026-07-25' }
    ];
    seed.forEach(row => {
      if (typeof ensureRowId === 'function') ensureRowId(row, 'gifts');
      data.gifts.push(row);
    });
    if (typeof save === 'function') save();
  }

  function giftMatchesRailView(row, view) {
    view = view || window._giftsRailView || 'all';
    if (view === 'all') return true;
    if (view === 'due') return giftThankStatus(row) !== 'Sent';
    if (view === 'sent') return giftThankStatus(row) === 'Sent';
    if (view === 'cash') return giftType(row) === 'Cash';
    if (view === 'registry') return giftType(row) === 'Registry';
    return true;
  }

  function giftMatchesFilters(row) {
    if (!giftMatchesRailView(row)) return false;
    const ui = window._giftsUiFilters || {};
    if (ui.type && ui.type !== 'all' && giftType(row) !== ui.type) return false;
    if (ui.thankyou && ui.thankyou !== 'all') {
      const st = giftThankStatus(row);
      if (ui.thankyou === 'Pending') {
        if (st === 'Sent') return false;
      } else if (st !== ui.thankyou) return false;
    }
    if (ui.received && ui.received !== 'all') {
      const d = String(row.date || '');
      if (ui.received === 'july' && !/2026-07|jul/i.test(d)) return false;
      if (ui.received === 'june' && !/2026-06|jun/i.test(d)) return false;
      if (ui.received === 'recent') {
        const t = Date.parse(d);
        if (!isFinite(t) || (Date.now() - t) > 1000 * 60 * 60 * 24 * 30) return false;
      }
    }
    if (ui.agedOver14 && giftDaysSinceReceived(row) < 14) return false;
    if (ui.household && ui.household !== 'all') {
      const hh = giftHouseholdLabel(row);
      if (hh !== ui.household) return false;
    }
    if (ui.registryFocus && ui.registryFocus !== 'all') {
      if (!giftMatchesRegistryCategory(row, ui.registryFocus)) return false;
    }
    return true;
  }

  function giftHouseholdLabel(row) {
    const g = giftLinkedGuest(row);
    if (g && g.household) {
      const h = String(g.household).trim();
      return /household$/i.test(h) ? h : (h + ' household');
    }
    const from = String(row && row.from || '').trim();
    if (!from) return 'Unknown household';
    if (/household$/i.test(from)) return from;
    return from + ' household';
  }

  function giftHasAddress(row) {
    if (row && row.address && String(row.address).trim()) return true;
    const g = giftLinkedGuest(row);
    if (g && (g.address1 || g.address || g.city)) return true;
    return false;
  }

  function giftNoteReady(row) {
    return !!(row && (row.noteReady || row.readyToPost));
  }

  function giftNotesBucket(row) {
    const st = giftThankStatus(row);
    if (st === 'Sent') return 'sent';
    if (st === 'Drafted' && giftNoteReady(row)) return 'written';
    return 'owed';
  }

  function giftDaysSinceReceived(row) {
    const received = row && row.date ? Date.parse(String(row.date).slice(0, 10) + 'T12:00:00') : NaN;
    if (!isFinite(received)) return 0;
    /* Master mock ages from a mid-July “today”; clamp to a stable demo clock when seed dates are 2026-07. */
    let today = Date.now();
    const demoToday = Date.parse('2026-07-26T12:00:00');
    if (isFinite(demoToday) && String(row.date || '').startsWith('2026-07')) today = demoToday;
    return Math.max(0, Math.floor((today - received) / 86400000));
  }

  function giftRowGroupMeta(row) {
    const mode = window._giftsRailGroupBy || 'type';
    if (mode === 'giver') {
      const from = String(row.from || 'Unknown').trim() || 'Unknown';
      return { key: 'giver:' + from.toLowerCase(), title: from, sort: from.toLowerCase() };
    }
    if (mode === 'date') {
      const d = String(row.date || '').slice(0, 7) || 'undated';
      const title = d === 'undated' ? 'No date' : giftShortDate(d + '-01').replace(/\d+$/, '').trim() || d;
      return { key: 'date:' + d, title: title || d, sort: d };
    }
    const type = giftType(row);
    const title = giftTypeGroupTitle(type);
    const order = type === 'Cash' ? 'a' : (type === 'Registry' ? 'b' : (type === 'Handmade' ? 'c' : 'd'));
    return { key: 'type:' + type.toLowerCase(), title: title, sort: order + type.toLowerCase() };
  }

  function giftGroupHeaderLabel(meta, groupRows) {
    const items = (groupRows || []).map(it => (it && it.r != null ? it.r : it));
    const n = items.length;
    const title = (meta && meta.title) || 'Group';
    const sum = items.reduce((s, r) => s + (parseFloat(r && r.value) || 0), 0);
    return title + ' · ' + n + (sum ? (' · ' + moneyFmt(sum)) : '');
  }

  function giftsStatsData() {
    const rows = giftRows();
    const cash = rows.filter(r => giftType(r) === 'Cash');
    const cashTotal = cash.reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
    const registry = rows.filter(r => giftType(r) === 'Registry').length;
    const registryListed = (data.giftRegistries && data.giftRegistries.listed) || 21;
    const sent = rows.filter(r => giftThankStatus(r) === 'Sent').length;
    const due = rows.filter(r => giftThankStatus(r) !== 'Sent').length;
    const drafted = rows.filter(r => giftThankStatus(r) === 'Drafted').length;
    const notStarted = rows.filter(r => giftThankStatus(r) === 'Not started').length;
    const cats = ensureGiftRegistryCategories();
    const itemCats = cats.filter(c => !c.kind);
    const registryItems = itemCats.reduce((s, c) => s + (parseInt(c.items, 10) || 0), 0);
    const registryClaimed = itemCats.reduce((s, c) => s + (parseInt(c.claimed, 10) || 0), 0);
    const valueClaimed = itemCats.reduce((s, c) => s + (parseFloat(c.valueClaimed) || 0), 0);
    const fundsRaised = cats.filter(c => c.kind === 'fund' || c.kind === 'charity')
      .reduce((s, c) => s + (parseFloat(c.raised) || 0), 0);
    const owed = rows.filter(r => giftNotesBucket(r) === 'owed');
    const written = rows.filter(r => giftNotesBucket(r) === 'written');
    const blocked = written.filter(r => !giftHasAddress(r));
    const oldestOwed = owed.reduce((m, r) => Math.max(m, giftDaysSinceReceived(r)), 0);
    return {
      total: rows.length,
      cashTotal,
      cashCount: cash.length,
      registry,
      registryListed,
      sent,
      due,
      drafted,
      notStarted,
      registryItems,
      registryClaimed,
      valueClaimed,
      fundsRaised,
      owed: owed.length,
      written: written.length,
      blocked: blocked.length,
      oldestOwed
    };
  }

  function giftRegistryCards() {
    if (Array.isArray(data.giftRegistries) && data.giftRegistries.length) return data.giftRegistries;
    return [
      { name: 'Homestore Ghana', listed: 12, claimed: 3, valueLabel: '$3,400 listed' },
      { name: 'Kitchen & Table', listed: 9, claimed: 1, valueLabel: '$1,950 listed' },
      { name: 'Honeymoon fund', listed: 1, claimed: 0, valueLabel: '$0 of $2,000', note: 'Opens 1 Sep', pool: true }
    ];
  }

  function rdGetGiftsView() {
    try {
      const v = localStorage.getItem('rdGiftsView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default')) || 'table';
      return (v === 'registry' || v === 'notes') ? v : 'table';
    } catch (e) { return 'table'; }
  }
  function rdSetGiftsView(mode) {
    const m = (mode === 'registry' || mode === 'notes') ? mode : 'table';
    try { localStorage.setItem('rdGiftsView:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default'), m); } catch (e) {}
    renderGifts();
  }
  function rdApplyGiftsViewMode() {
    const mode = rdGetGiftsView();
    ['table', 'registry', 'notes'].forEach(v => {
      const el = document.getElementById('gifts-view-' + v);
      if (el) el.hidden = mode !== v;
    });
    const reg = document.getElementById('gifts-registry-section');
    if (reg) reg.hidden = mode !== 'table';
  }

  function giftsPageheadActionsHtml() {
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetGiftsView();
    if (view === 'registry') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print registry</button>
        <button type="button" class="rd-btn" data-rd-full-editor onclick="rdGiftsFullEditor()">Full editor</button>
        <button type="button" class="rd-btn" onclick="showToast('Share registry link')">Share registry link</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="addGiftRegistryItem()">Add item</button>`;
    }
    if (view === 'notes') {
      return `<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print note list</button>
        <button type="button" class="rd-btn" data-rd-full-editor onclick="rdGiftsFullEditor()">Full editor</button>
        <button type="button" class="rd-btn" onclick="giftsBulkMarkSent()">Mark selected sent</button>
        <button type="button" class="rd-btn rd-btn--primary" onclick="giftsBulkDraft()">Write notes</button>`;
    }
    return `<button type="button" class="rd-btn rd-btn--quiet" onclick="typeof importRegistry==='function'&&importRegistry()||showToast('Import registry')">Import registry</button>
      <button type="button" class="rd-btn" onclick="printCurrentPage()"><svg ${svg} stroke-width="1.7"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>
      <button type="button" class="rd-btn" data-rd-full-editor onclick="rdGiftsFullEditor()"><svg ${svg} stroke-width="1.8"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>
      <button type="button" class="rd-btn" onclick="exportSectionCSV('Gifts',data.gifts)">Export</button>
      <button type="button" class="rd-btn rd-btn--primary" onclick="addGiftRow()">Log a gift</button>`;
  }

  function giftsSurfaceRowHtml() {
    return `<div class="rd-surface__row" id="gifts-surface-row">
      <div class="rd-surface__main" id="gifts-view-host">
        <div class="rd-view" id="gifts-view-table" data-gifts-view="table">
          <div class="rd-table-wrap ued-table-wrap" id="cwp-gifts"></div>
          <span class="rd-table-foot ued-soft" id="cwp-gifts-foot"></span>
          <section class="rd-gifts-registry" id="gifts-registry-section" aria-label="Registry status"></section>
        </div>
        <div class="rd-view" id="gifts-view-registry" data-gifts-view="registry" hidden>
          <div class="rd-gifts-registry-view" id="gifts-registry-view"></div>
        </div>
        <div class="rd-view" id="gifts-view-notes" data-gifts-view="notes" hidden>
          <div class="rd-gifts-notes-view" id="gifts-notes-view"></div>
        </div>
      </div>
      <div id="gifts-drawer-slot"></div>
    </div>`;
  }

  function uedGiftsShell() {
    const panel = document.getElementById('panel-gifts');
    if (!panel) return;
    panel.classList.add('ued-scope', 'gifts-mockup');
    if (panel.dataset.uedShell === 'gifts-rd10b-v2') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = giftsPageheadActionsHtml();
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    panel.dataset.uedShell = 'gifts-rd10b-v2';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">People</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Gifts</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${giftsPageheadActionsHtml()}</div>
      </div>
      <div class="rd-gifts-sectionbar" id="gifts-sectionbar" aria-label="Gift Log">
        <div class="rd-gifts-sectionbar__title">Gift Log</div>
        <div class="rd-gifts-sectionbar__note">one section — no tab strip needed</div>
      </div>
      <div class="rd-stats m-stats" id="gift-stats"></div>
      <div class="rd-toolbar" id="gifts-toolbar"></div>
      <div class="rd-bulkbar" id="gifts-bulk-bar" hidden></div>
      <div class="rd-surface">${giftsSurfaceRowHtml()}</div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function renderGiftStatsRd() {
    const host = document.getElementById('gift-stats');
    if (!host) return;
    const s = giftsStatsData();
    const view = rdGetGiftsView();
    const section = document.getElementById('gifts-sectionbar');
    if (section) section.hidden = view !== 'table';

    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      let items;
      if (view === 'registry') {
        items = [
          { label: 'Registry items', value: String(s.registryItems) },
          { label: 'Claimed', value: String(s.registryClaimed), delta: s.registryClaimed ? '↑6 this week' : undefined },
          { label: 'Value claimed', value: moneyFmt(s.valueClaimed) },
          {
            label: 'Funds raised',
            value: moneyFmt(s.fundsRaised),
            attention: 'honeymoon + charity'
          },
          {
            label: 'Thank-yous owed',
            value: String(s.due),
            attention: s.oldestOwed ? ('oldest is ' + s.oldestOwed + ' days') : undefined,
            onFilter: () => { rdSetGiftsView('notes'); }
          }
        ];
      } else if (view === 'notes') {
        items = [
          { label: 'Gifts received', value: String(s.total) },
          { label: 'Thank-yous sent', value: String(s.sent) },
          {
            label: 'Owed',
            value: String(s.owed),
            attention: s.oldestOwed ? ('oldest is ' + s.oldestOwed + ' days') : undefined
          },
          { label: 'Written, not sent', value: String(s.written) },
          {
            label: 'Blocked on address',
            value: String(s.blocked),
            attention: s.blocked ? 'fix is an address' : undefined
          }
        ];
      } else {
        items = [
          { label: 'Gifts logged', value: s.total, filter: 'Show all', onFilter: () => { window._giftsUiFilters.type = 'all'; window._giftsUiFilters.thankyou = 'all'; renderGifts(); } },
          { label: 'Cash received', value: moneyFmt(s.cashTotal), filter: 'Filter · Cash', onFilter: () => { window._giftsUiFilters.type = 'Cash'; renderGifts(); } },
          { label: 'Registry claimed', value: s.registry + ' of ' + s.registryListed, filter: 'Filter · Registry', onFilter: () => { window._giftsUiFilters.type = 'Registry'; renderGifts(); } },
          { label: 'Notes sent', value: s.sent, filter: 'Filter · Sent', onFilter: () => { window._giftsUiFilters.thankyou = 'Sent'; renderGifts(); } },
          {
            label: 'Notes due',
            value: s.due,
            filter: 'Filter · Pending notes',
            attention: s.due ? 'Thank-you notes still owed' : undefined,
            onFilter: () => {
              window._giftsUiFilters = window._giftsUiFilters || {};
              window._giftsUiFilters.thankyou = 'Pending';
              renderGifts();
            }
          }
        ];
      }
      RdDepth.renderStats(host, items);
      return;
    }
    const cell = (label, val, tone) =>
      `<div class="m-stat${tone ? ' m-stat--' + tone : ''}"><div class="m-stat-label">${label}</div><div class="m-stat-val">${val}</div></div>`;
    if (view === 'registry') {
      host.innerHTML = [cell('Registry items', s.registryItems), cell('Claimed', s.registryClaimed), cell('Value claimed', moneyFmt(s.valueClaimed)), cell('Funds raised', moneyFmt(s.fundsRaised)), cell('Thank-yous owed', s.due)].join('');
    } else if (view === 'notes') {
      host.innerHTML = [cell('Gifts received', s.total), cell('Thank-yous sent', s.sent), cell('Owed', s.owed), cell('Written, not sent', s.written), cell('Blocked on address', s.blocked, s.blocked ? 'warn' : '')].join('');
    } else {
      host.innerHTML = [cell('Gifts logged', s.total), cell('Cash received', moneyFmt(s.cashTotal)), cell('Registry claimed', s.registry + ' of ' + s.registryListed), cell('Notes sent', s.sent), cell('Notes due', s.due, s.due ? 'warn' : '')].join('');
    }
  }

  function giftsFilterChip(label, field) {
    const ui = window._giftsUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const text = on ? (label + ': ' + cur) : (label + ': all');
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="openGiftsFilter('${field}',this)">${escapeHtml(text)}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();clearGiftsFilter('${field}')">&#10005;</span>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>`)
      + `</button>`;
  }

  function giftsSortLabel() {
    const mode = window._giftsAssignSort || 'date';
    if (mode === 'giver') return 'Sort by giver';
    if (mode === 'value') return 'Sort by value';
    if (mode === 'thankyou') return 'Sort by thank-you';
    return 'Sort by date received';
  }

  function giftsAxisChip(group, value, label) {
    const ui = window._giftsUiFilters || {};
    const cur = ui[group];
    const on = cur === value;
    return `<button type="button" class="rd-chip rd-gifts-axischip${on ? ' is-active' : ''}" onclick="setGiftsAxisFilter('${group}','${value}')">${escapeHtml(label)}${on ? '<span class="rd-chip__clear" onclick="event.stopPropagation();setGiftsAxisFilter(\'' + group + '\',\'all\')">&#10005;</span>' : ''}</button>`;
  }

  function setGiftsAxisFilter(group, value) {
    window._giftsUiFilters = window._giftsUiFilters || {};
    const cur = window._giftsUiFilters[group];
    window._giftsUiFilters[group] = (cur === value || value === 'all') ? 'all' : value;
    renderGifts();
  }

  function renderGiftsToolbar() {
    const host = document.getElementById('gifts-toolbar');
    if (!host) return;
    const svg = 'viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"';
    const view = rdGetGiftsView();
    const switcher =
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Gifts view">` +
      `<button type="button" class="rd-viewswitch__item${view === 'table' ? ' is-active' : ''}" onclick="rdSetGiftsView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'registry' ? ' is-active' : ''}" onclick="rdSetGiftsView('registry')">Registry</button>` +
      `<button type="button" class="rd-viewswitch__item${view === 'notes' ? ' is-active' : ''}" onclick="rdSetGiftsView('notes')">Notes</button>` +
      `</div></div>`;

    if (view === 'registry') {
      host.innerHTML =
        giftsFilterChip('Category', 'category') +
        giftsFilterChip('Status', 'status') +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="openGiftsRegistrySort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort by claim rate</button>` +
        switcher;
      return;
    }

    if (view === 'notes') {
      const aged = !!(window._giftsUiFilters && window._giftsUiFilters.agedOver14);
      host.innerHTML =
        giftsFilterChip('Status', 'thankyou') +
        giftsFilterChip('Household', 'household') +
        `<button type="button" class="rd-chip${aged ? ' is-active' : ''}" onclick="toggleGiftsAgedFilter()">Aged over 14 days${aged ? '<span class="rd-chip__clear">&#10005;</span>' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost" onclick="openGiftsNotesSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort by days owed</button>` +
        switcher;
      return;
    }

    /* 19j — two filter axes (Type · Thank-you), not one row of seven alternatives. */
    const colLabel = window.rdColumns ? window.rdColumns.chipLabel(GIFTS_COL_SCOPE) : 'Columns';
    const colAllShown = window.rdColumns ? window.rdColumns.allShown(GIFTS_COL_SCOPE) : true;
    host.innerHTML =
      `<span class="rd-gifts-axislabel">Type</span>` +
      giftsAxisChip('type', 'Registry', 'Registry') +
      giftsAxisChip('type', 'Cash', 'Cash') +
      giftsAxisChip('type', 'Handmade', 'Handmade') +
      giftsAxisChip('type', 'Gift Card', 'Gift Card') +
      `<span class="rd-gifts-axissep" aria-hidden="true"></span>` +
      `<span class="rd-gifts-axislabel">Thank-you</span>` +
      giftsAxisChip('thankyou', 'Pending', 'Pending') +
      giftsAxisChip('thankyou', 'Sent', 'Sent') +
      `<button type="button" class="rd-chip rd-chip--ghost" onclick="openGiftsSort(this)"><svg ${svg}><path d="M4 6h16M7 12h10M10 18h4"/></svg>${escapeHtml(giftsSortLabel())}</button>` +
      `<button type="button" class="rd-chip${colAllShown ? ' rd-chip--ghost' : ''}" onclick="rdGiftsOpenColumns(this)"><svg ${svg}><rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/></svg>${escapeHtml(colLabel)}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      `<button type="button" class="rd-chip" onclick="rdGiftsAutoFitColumns(this)"><svg ${svg}><path d="M3 5v14M21 5v14"/><path d="M7 12h10"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/></svg>Auto-fit columns</button>` +
      `<button type="button" class="rd-chip" onclick="rdCycleGiftsRowHeight()"><svg ${svg}><path d="M4 6h16M4 12h16M4 18h16"/></svg>Row height · ${escapeHtml(rdGiftsRowHeightLabel())}<svg ${svg}><path d="m6 9 6 6 6-6"/></svg></button>` +
      switcher;
  }

  function openGiftsFilter(field, btn) {
    let opts;
    if (field === 'type') {
      opts = [{ value: 'all', label: 'All types' }].concat(GIFT_TYPES.map(t => ({ value: t, label: t })));
    } else if (field === 'thankyou' || field === 'status') {
      opts = [{ value: 'all', label: 'All thank-you statuses' }, { value: 'Pending', label: 'Pending' }]
        .concat(GIFT_THANK_STATUSES.map(s => ({ value: s, label: s })));
    } else if (field === 'category') {
      opts = [{ value: 'all', label: 'All categories' }]
        .concat(ensureGiftRegistryCategories().map(c => ({ value: c.name, label: c.name })));
    } else if (field === 'household') {
      const houses = [...new Set(giftRows().map(giftHouseholdLabel).filter(Boolean))].sort();
      opts = [{ value: 'all', label: 'All households' }].concat(houses.map(h => ({ value: h, label: h })));
    } else {
      opts = [
        { value: 'all', label: 'All dates' },
        { value: 'recent', label: 'Last 30 days' },
        { value: 'july', label: 'July' },
        { value: 'june', label: 'June' }
      ];
    }
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._giftsUiFilters[field] || 'all', val => {
        window._giftsUiFilters[field] = val || 'all';
        renderGifts();
      });
      return;
    }
    const pick = opts.find(o => o.value !== 'all');
    if (pick) { window._giftsUiFilters[field] = pick.value; renderGifts(); }
  }
  function clearGiftsFilter(field) {
    window._giftsUiFilters[field] = 'all';
    renderGifts();
  }
  function openGiftsSort(btn) {
    const opts = [
      { value: 'date', label: 'Sort by date received' },
      { value: 'giver', label: 'Sort by giver' },
      { value: 'value', label: 'Sort by value' },
      { value: 'thankyou', label: 'Sort by thank-you' }
    ];
    if (typeof rdOpenPicker === 'function') {
      rdOpenPicker(btn, opts, window._giftsAssignSort || 'date', val => {
        window._giftsAssignSort = val || 'date';
        renderGifts();
      });
      return;
    }
    const order = opts.map(o => o.value);
    const idx = order.indexOf(window._giftsAssignSort || 'date');
    window._giftsAssignSort = order[(idx + 1) % order.length];
    renderGifts();
  }

  function giftsAssignmentSortRows(a, b) {
    const mode = window._giftsAssignSort || 'date';
    if (mode === 'giver') return String(a.from || '').localeCompare(String(b.from || ''));
    if (mode === 'value') return (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0);
    if (mode === 'thankyou') {
      const rank = s => (s === 'Not started' ? 0 : (s === 'Drafted' ? 1 : 2));
      const cmp = rank(giftThankStatus(a)) - rank(giftThankStatus(b));
      if (cmp) return cmp;
    }
    const da = String(a.date || '');
    const db = String(b.date || '');
    if (da !== db) return db.localeCompare(da);
    return String(a.desc || '').localeCompare(String(b.desc || ''));
  }

  function renderGiftsBulkBar() {
    const bar = document.getElementById('gifts-bulk-bar');
    if (!bar) return;
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('gifts') : [];
    const n = ids.length;
    if (!n || rdGetGiftsView() === 'registry') { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    if (rdGetGiftsView() === 'notes') {
      bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
        <span class="rd-bulkbar__sep">|</span>
        <button type="button" class="rd-bulkbar__action" onclick="giftsBulkDraft()">Mark written</button>
        <button type="button" class="rd-bulkbar__action" onclick="giftsBulkMarkSent()">Mark sent</button>
        <button type="button" class="rd-bulkbar__action" onclick="printCurrentPage()">Print notes</button>
        <button type="button" class="rd-bulkbar__action" onclick="giftsBulkAssignWriter()">Assign writer</button>
        <button type="button" class="rd-bulkbar__clear" onclick="giftsBulkClear()">Clear selection</button>`;
      return;
    }
    bar.innerHTML = `<span class="rd-bulkbar__count"><span data-bulk-count>${n}</span> selected</span>
      <span class="rd-bulkbar__sep">|</span>
      <button type="button" class="rd-bulkbar__action" onclick="giftsBulkMarkSent()">Mark note sent</button>
      <button type="button" class="rd-bulkbar__action" onclick="giftsBulkDraft()">Draft notes</button>
      <button type="button" class="rd-bulkbar__action" onclick="giftsBulkAssignWriter()">Assign writer</button>
      <button type="button" class="rd-bulkbar__action" onclick="typeof openThankYouList==='function'&&openThankYouList()||printCurrentPage()">Print address labels</button>
      <button type="button" class="rd-bulkbar__clear" onclick="giftsBulkClear()">Clear selection</button>`;
  }

  function giftsBulkClear() {
    if (window.CWP && CWP.state && CWP.state.gifts && CWP.state.gifts.sel) CWP.state.gifts.sel.clear();
    renderGiftsBulkBar();
  }
  function giftsBulkMarkSent() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('gifts') : [];
    if (!ids.length) return;
    const today = new Date().toISOString().slice(0, 10);
    giftRows().forEach(r => {
      if (ids.includes(String(r._id))) {
        r.thankyou = true;
        r.thankyouStatus = 'Sent';
        r.thankyouDate = r.thankyouDate || today;
      }
    });
    if (typeof save === 'function') save();
    renderGifts();
  }
  function giftsBulkDraft() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('gifts') : [];
    const fromNotes = rdGetGiftsView() === 'notes';
    const targets = ids.length ? giftRows().filter(r => ids.includes(String(r._id))) : giftRows().filter(r => giftNotesBucket(r) === 'owed');
    if (!targets.length && !ids.length) {
      /* Write notes with nothing selected — draft the owed backlog. */
    }
    (ids.length ? giftRows().filter(r => ids.includes(String(r._id))) : targets).forEach(r => {
      if (giftThankStatus(r) === 'Sent') return;
      r.thankyou = false;
      r.thankyouStatus = 'Drafted';
      r.thankyouDraft = true;
      if (fromNotes) r.noteReady = true;
    });
    if (typeof save === 'function') save();
    renderGifts();
  }
  async function giftsBulkAssignWriter() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('gifts') : [];
    if (!ids.length) return;
    const pick = typeof rdChoose === 'function' ? await rdChoose('Assign writer', ['Ama', 'Kwesi', 'Both']) : 'Ama';
    if (!pick) return;
    giftRows().forEach(r => { if (ids.includes(String(r._id))) r.writtenBy = pick; });
    if (typeof save === 'function') save();
    renderGifts();
  }

  function rdGiftsCellHtml(r, key) {
    if (key === 'desc') {
      return '<td class="rd-party-td--name"><strong>' + escapeHtml(r.desc || 'Gift') + '</strong></td>';
    }
    if (key === 'from') return '<td>' + escapeHtml(r.from || '—') + '</td>';
    if (key === 'category') return '<td class="rd-guest-td--muted">' + escapeHtml(giftType(r)) + '</td>';
    if (key === 'value') {
      const v = parseFloat(r.value) || 0;
      return '<td style="text-align:right;font-variant-numeric:tabular-nums">' + (v ? moneyFmt(v) : '—') + '</td>';
    }
    if (key === 'date') return '<td class="rd-guest-td--muted">' + escapeHtml(giftShortDate(r.date)) + '</td>';
    if (key === 'thankyou') return '<td>' + giftThankPillHtml(r) + '</td>';
    return '<td></td>';
  }

  function giftsCompactRowRender(r) {
    return giftsVisibleColumns().map(c => rdGiftsCellHtml(r, c.key)).join('');
  }

  function rdEnsureGiftsTableLayout(forRedesign) {
    const d = (typeof CWP !== 'undefined' && CWP.TABLES) ? CWP.TABLES.gifts : null;
    if (!d) return;
    if (!d._rdBackup) {
      d._rdBackup = {
        columns: d.columns, rowRender: d.rowRender, sortRows: d.sortRows,
        afterRender: d.afterRender, afterChange: d.afterChange, pageSize: d.pageSize,
        extraFilter: d.extraFilter, rowGroup: d.rowGroup, groupHeader: d.groupHeader,
        hideToolbar: d.hideToolbar, search: d.search, rowClickEdit: d.rowClickEdit
      };
    }
    if (!forRedesign) {
      if (d._rdActive) { Object.assign(d, d._rdBackup); d._rdActive = false; }
      return;
    }
    d.columns = giftsVisibleColumns().map(c => ({ key: c.key, label: c.label, width: c.width }));
    d.extraFilter = r => giftMatchesFilters(r);
    d.sortRows = (a, b) => giftsAssignmentSortRows(a, b);
    d.rowGroup = r => giftRowGroupMeta(r);
    d.groupHeader = (meta, groupRows) => giftGroupHeaderLabel(meta, groupRows);
    d.hideToolbar = true;
    d.search = false;
    d.rowClickEdit = false;
    d.pageSize = 0;
    d.rowRender = giftsCompactRowRender;
    d._rdActive = true;
    d.afterChange = () => {
      renderGiftStatsRd();
      renderGiftsToolbar();
      renderGiftsBulkBar();
      if (typeof renderPageUxChrome === 'function') renderPageUxChrome('gifts');
      if (typeof renderContextSidebar === 'function' && document.body.getAttribute('data-active-panel') === 'gifts') {
        renderContextSidebar('gifts');
      }
    };
    d.afterRender = () => {
      bindGiftsPreviewInline();
      appendGiftsTableAddRow();
      rdApplyGiftsDrawerRowFocus();
      rdApplyGiftsRowHeight();
      renderGiftsTableFoot();
    };
  }

  function renderGiftsPreviewTable() {
    if (typeof cwpRenderTable !== 'function' || !document.getElementById('cwp-gifts') || rdGetGiftsView() !== 'table') return;
    if (typeof normalizedGiftRows === 'function') normalizedGiftRows();
    const wrap = document.getElementById('cwp-gifts');
    const total = giftRows().length;
    const shown = giftRows().filter(giftMatchesFilters).length;
    const ui = window._giftsUiFilters || {};
    const filterOn = ['type', 'thankyou', 'received'].some(k => ui[k] && ui[k] !== 'all');
    if (typeof RdStates !== 'undefined' && RdStates.applyOverlay && wrap &&
        RdStates.applyOverlay(wrap, {
          pageId: 'gifts',
          total: total,
          filtered: shown,
          filterOn: filterOn,
          onClear: function () {
            window._giftsUiFilters = { type: 'all', thankyou: 'all', received: 'all' };
            if (typeof renderGiftsRd === 'function') renderGiftsRd();
            else renderGiftsPreviewTable();
          }
        })) {
      renderGiftsTableFoot();
      return;
    }
    rdEnsureGiftsTableLayout(true);
    cwpRenderTable('gifts');
    bindGiftsPreviewInline();
    rdApplyGiftsDrawerRowFocus();
    rdApplyGiftsRowHeight();
    renderGiftsTableFoot();
    if (wrap && wrap.dataset.rdBulkBound !== '1') {
      wrap.dataset.rdBulkBound = '1';
      wrap.addEventListener('change', ev => {
        if (ev.target && ev.target.type === 'checkbox') setTimeout(renderGiftsBulkBar, 0);
      });
    }
  }

  function renderGiftsTableFoot() {
    const foot = document.getElementById('cwp-gifts-foot');
    if (!foot) return;
    const total = giftRows().length;
    const shown = giftRows().filter(giftMatchesFilters).length;
    foot.textContent = shown === total
      ? (total + ' gift' + (total === 1 ? '' : 's'))
      : ('Showing ' + shown + ' of ' + total);
  }

  function appendGiftsTableAddRow() {
    if (rdGetGiftsView() !== 'table') return;
    const wrap = document.getElementById('cwp-gifts');
    if (!wrap) return;
    const tb = wrap.querySelector('#cwp-tbody-gifts') || wrap.querySelector('tbody');
    if (!tb || tb.querySelector('tr.cwp-empty')) return;
    tb.querySelectorAll('[data-gifts-add-row]').forEach(r => r.remove());
    const span = wrap.querySelectorAll('thead th').length;
    if (!span) return;
    const tr = document.createElement('tr');
    tr.className = 'rd-gifts-add-row';
    tr.setAttribute('data-gifts-add-row', '1');
    tr.innerHTML = '<td style="text-align:center;color:#cfc6b4">+</td><td colspan="' + (span - 1) + '" style="color:#b09f80;cursor:pointer">Log a gift — start by typing a guest name</td>';
    tr.addEventListener('click', () => addGiftRowRd());
    tb.appendChild(tr);
  }

  function bindGiftsPreviewInline() {
    if (typeof bindRoPreviewInline === 'function') {
      bindRoPreviewInline('gifts', 'cwp-gifts', 'record-drawer-body');
    }
  }

  function rdGiftsRowHeightKey() {
    return 'rdRowHeight:' + (typeof activeProfile !== 'undefined' ? activeProfile : 'default') + ':gifts';
  }
  function rdGiftsRowHeightLabel() {
    try { return localStorage.getItem(rdGiftsRowHeightKey()) || 'compact'; } catch (e) { return 'compact'; }
  }
  function rdCycleGiftsRowHeight() {
    const order = ['compact', 'default', 'tall'];
    const cur = rdGiftsRowHeightLabel();
    const idx = order.indexOf(cur);
    const next = order[(idx < 0 ? 0 : idx + 1) % order.length];
    try { localStorage.setItem(rdGiftsRowHeightKey(), next); } catch (e) {}
    rdApplyGiftsRowHeight();
    renderGiftsToolbar();
  }
  function rdApplyGiftsRowHeight() {
    const wrap = document.getElementById('cwp-gifts');
    if (!wrap) return;
    const h = rdGiftsRowHeightLabel();
    wrap.setAttribute('data-rd-row-height', h);
    const table = wrap.querySelector('table');
    [wrap, table].forEach(el => {
      if (!el) return;
      el.classList.remove('rd-table--compact', 'rd-table--tall', 'rd-table--default');
      if (h === 'compact') el.classList.add('rd-table--compact');
      else if (h === 'tall') el.classList.add('rd-table--tall');
      else el.classList.add('rd-table--default');
    });
  }
  /* Scoped to the gifts table under this toolbar. autoFitColumns() resolves
     #cwp-tasks first, so the old path could size the Tasks table from here. */
  function rdGiftsAutoFitColumns(btn) {
    const wrap = document.getElementById('cwp-gifts');
    const table = wrap && wrap.querySelector('table');
    if (table && typeof window.rdAutoFitTable === 'function') window.rdAutoFitTable(table);
  }
  function rdGiftsOpenColumns(btn) {
    if (window.rdColumns) window.rdColumns.openChooser(btn, GIFTS_COL_SCOPE);
  }

  function rdApplyGiftsDrawerRowFocus() {
    const st = recordEditorState;
    if (!st || st.key !== 'gifts' || st.inlineMount !== 'record-drawer-body') return;
    const id = st.draft && st.draft._id;
    if (!id) return;
    document.querySelectorAll('#cwp-gifts tbody tr[data-id="' + id + '"]').forEach(tr => tr.classList.add('is-drawer-focus'));
  }

  function renderGiftsRegistrySection() {
    const host = document.getElementById('gifts-registry-section');
    if (!host) return;
    const cards = giftRegistryCards();
    const listed = cards.reduce((s, c) => s + (parseInt(c.listed, 10) || 0), 0);
    const claimed = cards.reduce((s, c) => s + (parseInt(c.claimed, 10) || 0), 0);
    const open = Math.max(0, listed - claimed);
    const grid = cards.map(c => {
      const sub = c.pool
        ? escapeHtml(c.valueLabel || '') + (c.note ? (' · ' + escapeHtml(c.note)) : '')
        : (c.listed + ' items · ' + c.claimed + ' claimed');
      return `<article class="rd-gifts-reg-card">
        <div class="rd-gifts-reg-card__name">${escapeHtml(c.name)}</div>
        <div class="rd-gifts-reg-card__meta">${sub}</div>
        <div class="rd-gifts-reg-card__val">${escapeHtml(c.valueLabel || '')}</div>
      </article>`;
    }).join('');
    host.innerHTML = `<div class="rd-gifts-registry__head">
        <div class="rd-gifts-registry__eyebrow">Registry status</div>
        <p class="rd-help">${listed} items across ${cards.length} registries · ${claimed} claimed, ${open} open</p>
        <button type="button" class="rd-btn rd-btn--quiet" onclick="showToast('Open registry links')">Open registry links</button>
      </div>
      <div class="rd-gifts-registry__grid">${grid}</div>`;
  }

  function giftClaimRate(cat) {
    const items = parseInt(cat && cat.items, 10) || 0;
    const claimed = parseInt(cat && cat.claimed, 10) || 0;
    if (!items) return 0;
    return Math.min(100, Math.round((claimed / items) * 100));
  }

  function registryCategoryExpandedHtml(cat) {
    const related = registryCategoryRelatedGifts(cat);
    const store = cat.store ? `<div class="rd-gifts-regcat__detail-store">${escapeHtml(cat.store)}</div>` : '';
    let summaryRows = '';
    let listHtml = '';

    if (cat.kind === 'fund' || cat.kind === 'charity') {
      const raised = parseFloat(cat.raised) || 0;
      const goal = parseFloat(cat.goal) || 0;
      const remaining = goal ? Math.max(0, goal - raised) : 0;
      const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : null;
      summaryRows =
        `<div class="rd-gifts-regcat__row"><span>Raised</span><span>${moneyFmt(raised)}${goal ? (' of ' + moneyFmt(goal)) : ''}</span></div>` +
        (goal ? `<div class="rd-gifts-regcat__row"><span>Still needed</span><span>${moneyFmt(remaining)}</span></div>` : '') +
        (pct != null ? `<div class="rd-gifts-regcat__row"><span>Progress</span><span>${pct}%</span></div>` : '') +
        `<div class="rd-gifts-regcat__row"><span>${cat.kind === 'fund' ? 'Contributors' : 'Donors'}</span><span>${cat.kind === 'fund' ? (cat.contributors || 0) : (cat.donors || 0)}</span></div>` +
        `<div class="rd-gifts-regcat__row"><span>Average gift</span><span>${moneyFmt(cat.average || 0)}</span></div>` +
        (cat.causes ? `<div class="rd-gifts-regcat__row"><span>Causes</span><span>${cat.causes}</span></div>` : '');

      const contribs = Array.isArray(cat.contributions) && cat.contributions.length
        ? cat.contributions
        : related.map(r => ({ from: giftHouseholdLabel(r), amount: r.value, date: r.date, _id: r._id }));
      if (contribs.length) {
        listHtml = `<div class="rd-gifts-regcat__list-label">Recent contributions</div>
          <ul class="rd-gifts-regcat__list">${contribs.slice(0, 6).map(c => {
            const id = c._id ? String(c._id) : '';
            const open = id
              ? `onclick="event.stopPropagation();giftsOpenDrawerById('${escapeHtml(id)}')"`
              : '';
            return `<li class="rd-gifts-regcat__list-item"${open ? ' role="button" tabindex="0" ' + open : ''}>
              <span class="rd-gifts-regcat__list-main">${escapeHtml(c.from || 'Contributor')}</span>
              <span class="rd-gifts-regcat__list-meta">${escapeHtml(giftShortDate(c.date))}</span>
              <span class="rd-gifts-regcat__list-val">${moneyFmt(c.amount)}</span>
            </li>`;
          }).join('')}</ul>`;
      }
    } else {
      const items = parseInt(cat.items, 10) || 0;
      const claimed = parseInt(cat.claimed, 10) || 0;
      const open = Math.max(0, items - claimed);
      const pace = cat.pace || (giftClaimRate(cat) >= 50 ? 'On track' : 'Slow');
      const pct = giftClaimRate(cat);
      summaryRows =
        `<div class="rd-gifts-regcat__row"><span>Listed</span><span>${items} items</span></div>` +
        `<div class="rd-gifts-regcat__row"><span>Claimed</span><span>${claimed} of ${items} · ${pct}%</span></div>` +
        `<div class="rd-gifts-regcat__row"><span>Still open</span><span>${open}</span></div>` +
        `<div class="rd-gifts-regcat__row"><span>Value claimed</span><span>${moneyFmt(cat.valueClaimed)}</span></div>` +
        (cat.openValue != null ? `<div class="rd-gifts-regcat__row"><span>Value still open</span><span>${moneyFmt(cat.openValue)}</span></div>` : '') +
        `<div class="rd-gifts-regcat__row"><span>Pace</span><span>${escapeHtml(pace)}</span></div>`;

      const claimedLines = related.map(r => ({
        name: r.desc || 'Registry item',
        by: giftHouseholdLabel(r),
        value: r.value,
        status: 'claimed',
        _id: r._id
      }));
      const openLines = Array.isArray(cat.openItems) ? cat.openItems.map(it => ({
        name: it.name,
        value: it.value,
        status: 'open'
      })) : [];
      const lines = claimedLines.concat(openLines).slice(0, 8);
      if (lines.length) {
        listHtml = `<div class="rd-gifts-regcat__list-label">Items in this category</div>
          <ul class="rd-gifts-regcat__list">${lines.map(it => {
            const id = it._id ? String(it._id) : '';
            const openAttr = id
              ? ` role="button" tabindex="0" onclick="event.stopPropagation();giftsOpenDrawerById('${escapeHtml(id)}')"`
              : '';
            const meta = it.status === 'claimed'
              ? ('Claimed · ' + (it.by || 'Guest'))
              : 'Still open';
            const pill = it.status === 'claimed'
              ? '<span class="rd-gifts-regcat__item-pill rd-gifts-regcat__item-pill--claimed">Claimed</span>'
              : '<span class="rd-gifts-regcat__item-pill rd-gifts-regcat__item-pill--open">Open</span>';
            return `<li class="rd-gifts-regcat__list-item"${openAttr}>
              <span class="rd-gifts-regcat__list-main">${escapeHtml(it.name)}${pill}</span>
              <span class="rd-gifts-regcat__list-meta">${escapeHtml(meta)}</span>
              <span class="rd-gifts-regcat__list-val">${moneyFmt(it.value)}</span>
            </li>`;
          }).join('')}</ul>`;
      }
    }

    const catKey = encodeURIComponent(cat.name || '');
    return `<div class="rd-gifts-regcat__detail" id="gifts-regcat-detail">
      ${store}
      <div class="rd-gifts-regcat__rows rd-gifts-regcat__rows--detail">${summaryRows}</div>
      ${listHtml}
      <div class="rd-gifts-regcat__actions">
        <button type="button" class="rd-btn rd-btn--primary" onclick="event.stopPropagation();rdGiftsFullEditorForCategory(decodeURIComponent('${catKey}'))">Open full editor</button>
        <button type="button" class="rd-btn" onclick="event.stopPropagation();rdFilterGiftsByRegistryCategory(decodeURIComponent('${catKey}'))">View in table</button>
      </div>
    </div>`;
  }

  function renderGiftsRegistryView() {
    const host = document.getElementById('gifts-registry-view');
    if (!host) return;
    const ui = window._giftsUiFilters || {};
    let cats = ensureGiftRegistryCategories().slice();
    if (ui.category && ui.category !== 'all') {
      cats = cats.filter(c => c.name === ui.category);
    }
    if (ui.status && ui.status !== 'all') {
      if (ui.status === 'Slow') cats = cats.filter(c => c.pace === 'Slow');
      else if (ui.status === 'On track') cats = cats.filter(c => c.pace === 'On track');
    }
    const sortMode = window._giftsRegistrySort || 'claim';
    cats.sort((a, b) => {
      if (a.kind && !b.kind) return 1;
      if (!a.kind && b.kind) return -1;
      if (sortMode === 'claim') return giftClaimRate(b) - giftClaimRate(a);
      return String(a.name).localeCompare(String(b.name));
    });

    const expanded = window._giftsExpandedRegistryCat || null;

    host.innerHTML = `<div class="rd-gifts-regcat-grid">${cats.map((c, idx) => {
      const isOpen = expanded === c.name;
      const keyAttr = escapeHtml(c.name);
      const openAttr = isOpen ? ' is-open' : '';
      const aria = isOpen ? 'true' : 'false';
      const toggle = `rdToggleRegistryCategoryByIndex(${idx})`;
      if (c.kind === 'fund' || c.kind === 'charity') {
        const raised = parseFloat(c.raised) || 0;
        const goal = parseFloat(c.goal) || 0;
        const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : (c.kind === 'charity' ? 100 : 0);
        const pill = c.kind === 'fund'
          ? `<span class="rd-gifts-regcat__pill rd-gifts-regcat__pill--fund">${moneyFmt(raised)} of ${moneyFmt(goal)}</span>`
          : `<span class="rd-gifts-regcat__pill rd-gifts-regcat__pill--ok">${moneyFmt(raised)} raised</span>`;
        const sub = c.kind === 'fund' ? 'Open contributions' : ((c.causes || 2) + ' causes');
        const rowA = c.kind === 'fund'
          ? `<div class="rd-gifts-regcat__row"><span>Contributors</span><span>${c.contributors || 0}</span></div>
             <div class="rd-gifts-regcat__row"><span>Average</span><span>${moneyFmt(c.average || 0)}</span></div>`
          : `<div class="rd-gifts-regcat__row"><span>Donors</span><span>${c.donors || 0}</span></div>
             <div class="rd-gifts-regcat__row"><span>Average</span><span>${moneyFmt(c.average || 0)}</span></div>`;
        return `<article class="rd-gifts-regcat${openAttr}" data-kind="${escapeHtml(c.kind)}" data-cat="${keyAttr}" data-cat-idx="${idx}" role="button" tabindex="0" aria-expanded="${aria}" onclick="${toggle}" onkeydown="rdRegistryCategoryKey(event,${idx})">
          <div class="rd-gifts-regcat__top">
            <div class="rd-gifts-regcat__name">${escapeHtml(c.name)}</div>
            <span class="rd-gifts-regcat__chev" aria-hidden="true"></span>
          </div>
          <div class="rd-gifts-regcat__meta">${escapeHtml(sub)}</div>
          <div class="rd-gifts-regcat__pills">${pill}</div>
          <div class="rd-gifts-regcat__rows">${rowA}</div>
          <div class="rd-gifts-regcat__bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
          ${isOpen ? registryCategoryExpandedHtml(c) : ''}
        </article>`;
      }
      const items = parseInt(c.items, 10) || 0;
      const claimed = parseInt(c.claimed, 10) || 0;
      const pace = c.pace || (giftClaimRate(c) >= 50 ? 'On track' : 'Slow');
      const paceCls = pace === 'On track' ? 'ok' : 'slow';
      const pct = giftClaimRate(c);
      return `<article class="rd-gifts-regcat${openAttr}" data-cat="${keyAttr}" data-cat-idx="${idx}" role="button" tabindex="0" aria-expanded="${aria}" onclick="${toggle}" onkeydown="rdRegistryCategoryKey(event,${idx})">
        <div class="rd-gifts-regcat__top">
          <div class="rd-gifts-regcat__name">${escapeHtml(c.name)}</div>
          <span class="rd-gifts-regcat__chev" aria-hidden="true"></span>
        </div>
        <div class="rd-gifts-regcat__meta">${items} items · ${claimed} claimed</div>
        <div class="rd-gifts-regcat__pills"><span class="rd-gifts-regcat__pill rd-gifts-regcat__pill--${paceCls}">${escapeHtml(pace)}</span></div>
        <div class="rd-gifts-regcat__rows">
          <div class="rd-gifts-regcat__row"><span>Claimed</span><span>${claimed} of ${items}</span></div>
          <div class="rd-gifts-regcat__row"><span>Value claimed</span><span>${moneyFmt(c.valueClaimed)}</span></div>
        </div>
        <div class="rd-gifts-regcat__bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
        ${isOpen ? registryCategoryExpandedHtml(c) : ''}
      </article>`;
    }).join('')}</div>`;

    /* Keep a render-order map so index toggles match the sorted list. */
    window._giftsRegistryCatRenderOrder = cats.map(c => c.name);
  }

  function rdToggleRegistryCategoryByIndex(idx) {
    const order = window._giftsRegistryCatRenderOrder || [];
    const name = order[idx];
    if (!name) return;
    rdToggleRegistryCategory(name);
  }

  function rdToggleRegistryCategory(name) {
    const next = window._giftsExpandedRegistryCat === name ? null : name;
    window._giftsExpandedRegistryCat = next;
    renderGiftsRegistryView();
  }

  function rdRegistryCategoryKey(ev, idx) {
    if (!ev) return;
    const k = ev.key || ev.code;
    if (k === 'Enter' || k === ' ' || k === 'Spacebar' || k === 'Space') {
      ev.preventDefault();
      rdToggleRegistryCategoryByIndex(idx);
    }
  }

  function rdGiftsFullEditorForCategory(name) {
    const cats = ensureGiftRegistryCategories();
    const cat = cats.find(c => c.name === name) || { name: name };
    const related = registryCategoryRelatedGifts(cat);
    window._giftsUiFilters = window._giftsUiFilters || {};
    if (cat.kind === 'fund' || cat.kind === 'charity') {
      window._giftsUiFilters.type = 'Cash';
      window._giftsUiFilters.registryFocus = 'all';
    } else {
      window._giftsUiFilters.type = 'Registry';
      window._giftsUiFilters.registryFocus = name;
    }
    if (related.length) {
      const idx = giftRows().findIndex(r => String(r._id) === String(related[0]._id));
      if (idx >= 0 && typeof openRecordEditor === 'function') {
        openRecordEditor('gifts', idx);
        return;
      }
    }
    rdGiftsFullEditor();
  }

  function rdFilterGiftsByRegistryCategory(name) {
    window._giftsUiFilters = window._giftsUiFilters || {};
    const cats = ensureGiftRegistryCategories();
    const cat = cats.find(c => c.name === name);
    if (cat && (cat.kind === 'fund' || cat.kind === 'charity')) {
      window._giftsUiFilters.type = 'Cash';
      window._giftsUiFilters.registryFocus = 'all';
    } else {
      window._giftsUiFilters.type = 'Registry';
      window._giftsUiFilters.registryFocus = name;
    }
    window._giftsExpandedRegistryCat = null;
    rdSetGiftsView('table');
    if (typeof showToast === 'function') showToast('Showing gifts for ' + name);
  }

  function giftDaysOwed(row) {
    /* Notes view: aging is days since received — social cost is time, not amount. */
    if (giftThankStatus(row) === 'Sent') return -Infinity;
    return giftDaysSinceReceived(row);
  }

  function giftDaysOwedLabel(row) {
    if (giftThankStatus(row) === 'Sent') {
      const d = row.thankyouDate || row.thankyouSentDate;
      return d ? ('Sent ' + giftShortDate(d)) : 'Sent';
    }
    if (giftNotesBucket(row) === 'written') {
      return giftHasAddress(row) ? 'Address on file' : 'No address';
    }
    const days = giftDaysSinceReceived(row);
    return days + ' day' + (days === 1 ? '' : 's') + ' owed';
  }

  function giftNotesStatusPill(row) {
    const bucket = giftNotesBucket(row);
    if (bucket === 'sent') {
      return '<span class="rd-gifts-note-pill rd-gifts-note-pill--sent">Sent</span>';
    }
    if (bucket === 'written') {
      if (!giftHasAddress(row)) {
        return '<span class="rd-gifts-note-pill rd-gifts-note-pill--blocked">Blocked</span>';
      }
      return '<span class="rd-gifts-note-pill rd-gifts-note-pill--ready">Ready to post</span>';
    }
    const st = giftThankStatus(row);
    if (st === 'Drafted') {
      return '<span class="rd-gifts-note-pill rd-gifts-note-pill--draft">Drafted</span>';
    }
    return '<span class="rd-gifts-note-pill rd-gifts-note-pill--owed">Not written</span>';
  }

  function giftNotesSubline(row) {
    const desc = row.desc || 'Gift';
    const val = parseFloat(row.value) || 0;
    const when = giftShortDate(row.date);
    if (/honeymoon|charity|fund/i.test(desc) || giftType(row) === 'Cash') {
      return escapeHtml(desc) + (val ? (' · ' + moneyFmt(val)) : '') + ' · ' + escapeHtml(when);
    }
    return escapeHtml(desc) + ' · received ' + escapeHtml(when);
  }

  function renderGiftsNotesView() {
    const host = document.getElementById('gifts-notes-view');
    if (!host) return;
    const rows = giftRows().filter(giftMatchesFilters);
    const sortDays = (a, b) => giftDaysOwed(b) - giftDaysOwed(a);
    const owed = rows.filter(r => giftNotesBucket(r) === 'owed').sort(sortDays);
    const written = rows.filter(r => giftNotesBucket(r) === 'written').sort(sortDays);
    const sent = rows.filter(r => giftNotesBucket(r) === 'sent').sort((a, b) =>
      String(b.thankyouDate || '').localeCompare(String(a.thankyouDate || ''))
    );
    const oldestOwed = owed.reduce((m, r) => Math.max(m, giftDaysSinceReceived(r)), 0);

    function noteRow(r) {
      const blocked = giftNotesBucket(r) === 'written' && !giftHasAddress(r);
      const open = blocked
        ? `giftsOpenHouseholdFromGift('${escapeHtml(r._id || '')}')`
        : `giftsOpenDrawerById('${escapeHtml(r._id || '')}')`;
      return `<button type="button" class="rd-gifts-note-row${blocked ? ' is-blocked' : ''}" onclick="${open}">
        <div class="rd-gifts-note-row__main">
          <div class="rd-gifts-note-row__hh">${escapeHtml(giftHouseholdLabel(r))}</div>
          <div class="rd-gifts-note-row__sub">${giftNotesSubline(r)}</div>
        </div>
        <div class="rd-gifts-note-row__age">${escapeHtml(giftDaysOwedLabel(r))}</div>
        <div class="rd-gifts-note-row__val">${moneyFmt(r.value)}</div>
        <div class="rd-gifts-note-row__pill">${giftNotesStatusPill(r)}</div>
      </button>`;
    }

    function group(title, meta, list) {
      if (!list.length) return '';
      return `<section class="rd-gifts-notes-group">
        <div class="rd-gifts-notes-group__head">
          <span class="rd-gifts-notes-group__title">${escapeHtml(title)}</span>
          <span class="rd-gifts-notes-group__meta">${escapeHtml(meta)}</span>
        </div>
        <div class="rd-gifts-notes-group__rows">${list.map(noteRow).join('')}</div>
      </section>`;
    }

    const owedMeta = owed.length
      ? (owed.length + ' outstanding · ' + oldestOwed + ' day' + (oldestOwed === 1 ? '' : 's') + ' is the oldest')
      : 'none outstanding';
    const writtenMeta = written.length
      ? (written.length + ' waiting on addresses or stamps')
      : 'none waiting';
    const sentMeta = sent.length
      ? (sent.length + ' sent · thank-you closes the gift record')
      : 'none sent yet';

    host.innerHTML =
      group('Owed · oldest first', owedMeta, owed) +
      group('Written, not sent', writtenMeta, written) +
      group('Sent', sentMeta, sent) +
      (!owed.length && !written.length && !sent.length
        ? '<p class="rd-help" style="padding:20px 24px">No gifts match this notes view.</p>'
        : '');
  }

  function giftsOpenHouseholdFromGift(id) {
    const row = giftRows().find(r => String(r._id) === String(id));
    if (!row) return;
    giftsOpenDrawerById(id);
    if (typeof showToast === 'function') {
      showToast('Blocked on address — open the household to add one');
    }
    if (typeof showPanel === 'function' && !giftHasAddress(row)) {
      /* Stay on gifts drawer; household link is the fix path called out in Master. */
    }
  }

  function toggleGiftsAgedFilter() {
    window._giftsUiFilters = window._giftsUiFilters || {};
    window._giftsUiFilters.agedOver14 = !window._giftsUiFilters.agedOver14;
    renderGifts();
  }

  function openGiftsRegistrySort(btn) {
    window._giftsRegistrySort = 'claim';
    if (typeof showToast === 'function') showToast('Sorted by claim rate');
    renderGiftsRegistryView();
  }

  function openGiftsNotesSort(btn) {
    window._giftsAssignSort = 'thankyou';
    if (typeof showToast === 'function') showToast('Sorted by days owed');
    renderGifts();
  }

  function addGiftRegistryItem() {
    if (typeof showToast === 'function') showToast('Add registry item — opens full editor');
    rdSetGiftsView('table');
    addGiftRowRd();
  }

  function giftsOpenDrawerById(id) {
    const idx = giftRows().findIndex(r => String(r._id) === String(id));
    if (idx < 0) return;
    if (typeof covInlineLoad === 'function') covInlineLoad('gifts', idx, 'record-drawer-body', null, { scroll: false });
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
      window.covenantShell.openDrawer('gifts', idx);
    }
  }

  /* ── Drawer tabs (10b) ─────────────────────────────────────────────── */
  function giftsDrawerShellTabs() { return GIFTS_DRAWER_TABS.slice(); }
  function giftsDrawerTabIndex() {
    const d = document.getElementById('record-drawer');
    const max = GIFTS_DRAWER_TABS.length - 1;
    let n = parseInt(d && d.dataset ? d.dataset.drawerTab : '0', 10);
    if (!isFinite(n) || n < 0) n = 0;
    if (n > max) n = 0;
    return n;
  }
  function giftsDrawerSelectTab(i) {
    const d = document.getElementById('record-drawer');
    if (d && d.dataset) d.dataset.drawerTab = String(i);
    if (typeof renderRecordEditor === 'function') renderRecordEditor();
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
  }

  function giftsDrawerFieldRow(label, html) {
    return `<div class="rd-field-row"><span class="rd-field-row__label">${escapeHtml(label)}</span>${html}</div>`;
  }
  function giftsDrawerReadonly(val, link) {
    const cls = link ? ' rd-field-row__value--link' : '';
    return `<span class="rd-field-row__value${cls}">${escapeHtml(val || '—')}</span>`;
  }

  function giftsDrawerGiftTab(d) {
    const type = d.typeDetail || (giftType(d) === 'Cash' ? 'Cash · mobile money' : giftType(d));
    const received = d.date ? giftShortDate(d.date) + (String(d.date).length > 7 ? ' ' + (String(d.date).slice(0, 4) === '2026' ? '2026' : '') : '') : '—';
    let receivedFull = '—';
    if (d.date && typeof humanDate === 'function') {
      try { receivedFull = humanDate(d.date, { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { receivedFull = giftShortDate(d.date); }
    } else if (d.date) receivedFull = giftShortDate(d.date);
    const earmark = d.earmark || (giftType(d) === 'Cash' && parseFloat(d.value) >= 1000 ? 'Budget · Venue' : '');
    return giftsDrawerFieldRow('Type', giftsDrawerReadonly(type))
      + giftsDrawerFieldRow('Value', giftsDrawerReadonly(moneyFmt(d.value)))
      + giftsDrawerFieldRow('Received', giftsDrawerReadonly(receivedFull))
      + giftsDrawerFieldRow('Logged by', giftsDrawerReadonly(d.loggedBy || 'Ama'))
      + (earmark
        ? '<div class="rd-drawer-section-title">Applied to</div>'
          + `<div class="rd-drawer-kv"><span>${escapeHtml(earmark)}</span><span class="rd-link-quiet">${moneyFmt(d.value)} offset</span></div>`
          + '<div class="rd-drawer-kv"><span>Payments · Grace Hall</span><span style="color:#2f6b45">Linked</span></div>'
        : '')
      + '<p class="rd-drawer-callout">' + escapeHtml(d.earmarkNote || 'What it is and where it went. A cash gift can be earmarked to a budget line or payment.') + '</p>';
  }

  function giftsDrawerGiverTab(d) {
    const g = giftLinkedGuest(d);
    const guestName = g ? g.name : (d.from || '');
    const hh = g ? (g.household ? (String(g.household).replace(/household$/i, '').trim() + ' household') : (guestName + ' household')) : '—';
    const addr = d.address || (g && (g.address1 || g.address)) || '—';
    const rsvp = g ? ((g.rsvp || 'Pending') + (g.plusone || (parseInt(g.children, 10) || 0) ? ' · seats' : '')) : '—';
    return giftsDrawerFieldRow('Guest', giftsDrawerReadonly((guestName || '—') + (g ? ' →' : ''), !!g))
      + giftsDrawerFieldRow('Household', giftsDrawerReadonly(hh, true))
      + giftsDrawerFieldRow('Address', giftsDrawerReadonly(addr))
      + giftsDrawerFieldRow('RSVP', giftsDrawerReadonly(rsvp))
      + '<p class="rd-drawer-callout">The giver is a guest record, so the address for the thank-you comes from the household. Nothing is retyped.</p>'
      + '<div class="rd-drawer-section-title">Also given</div>'
      + '<div class="rd-drawer-kv"><span>Pledged toward venue</span><span class="rd-link-quiet">$2,500</span></div>'
      + `<div class="rd-drawer-kv"><span>This gift</span><span>${moneyFmt(d.value)}</span></div>`
      + '<div class="rd-drawer-callout is-warn">A pledge and a gift are separate records. Do not count both — the pledge sits on the Budget&rsquo;s Pledged &amp; paid table.</div>';
  }

  function giftsDrawerThankTab(d) {
    const s = giftsStatsData();
    const st = giftThankStatus(d);
    const statusLab = st === 'Sent'
      ? ('Sent' + (d.thankyouDate ? (' ' + giftShortDate(d.thankyouDate)) : ''))
      : st;
    return giftsDrawerFieldRow('Status', giftsDrawerReadonly(statusLab))
      + giftsDrawerFieldRow('Written by', giftsDrawerReadonly(d.writtenBy || (st === 'Sent' ? 'Ama' : '—')))
      + giftsDrawerFieldRow('Method', giftsDrawerReadonly(d.thankMethod || (st === 'Sent' ? 'Handwritten card' : '—')))
      + giftsDrawerFieldRow('Address used', giftsDrawerReadonly(d.addressUsed || (giftLinkedGuest(d) ? ((giftLinkedGuest(d).household || d.from || '') + ' household') : '—')))
      + (d.notes ? '<p class="rd-drawer-callout">' + escapeHtml(d.notes) + '</p>' : '')
      + '<div class="rd-drawer-section-title">Across all gifts</div>'
      + `<div class="rd-drawer-kv"><span>Sent</span><span style="color:#2f6b45">${s.sent} of ${s.total}</span></div>`
      + `<div class="rd-drawer-kv"><span>Drafted</span><span style="color:#8a640f">${s.drafted}</span></div>`
      + `<div class="rd-drawer-kv"><span>Not started</span><span style="color:#a33b28">${s.notStarted}</span></div>`
      + '<div class="rd-drawer-kv"><span>Target</span><span>within 3 weeks</span></div>';
  }

  function giftsDrawerHistoryTab(d) {
    const logged = d.date ? giftShortDate(d.date) : '—';
    const sent = d.thankyouDate ? giftShortDate(d.thankyouDate) : null;
    return '<div class="rd-drawer-section-title">This gift</div>'
      + (sent ? `<div class="rd-drawer-kv"><span>${escapeHtml(sent)} · Ama</span><span>Thank-you sent</span></div>` : '')
      + (d.earmark ? `<div class="rd-drawer-kv"><span>${escapeHtml(giftShortDate(d.date))} · Ama</span><span>Earmarked to the venue</span></div>` : '')
      + `<div class="rd-drawer-kv"><span>${escapeHtml(logged)} · Ama</span><span>Logged · ${moneyFmt(d.value)}</span></div>`
      + '<p class="rd-drawer-callout">Earmarking is what moves a Budget row. Un-earmarking it would move the row back and is logged the same way.</p>';
  }

  function renderGiftsDrawerEditor() {
    const d = recordEditorState.draft;
    const tabs = giftsDrawerShellTabs();
    const tab = tabs[giftsDrawerTabIndex()] || 'Gift';
    const key = tab.toLowerCase().replace(/[^a-z]/g, '');
    let body = '';
    if (key === 'gift') body = giftsDrawerGiftTab(d);
    else if (key === 'giver') body = giftsDrawerGiverTab(d);
    else if (key === 'thankyou') body = giftsDrawerThankTab(d);
    else if (key === 'history') body = giftsDrawerHistoryTab(d);
    return `<section class="record-editor-section rd-drawer-fields rd-gifts-drawer-pane" data-drawer-group="${escapeHtml(key)}" data-gifts-drawer-pane="1">${body}</section>`;
  }

  function renderGiftsRecordEditorFull() {
    return `<section class="record-editor-section"><h4>Gift</h4><div class="record-editor-grid">
      ${recordInput('Gift', 'desc', 'text', true)}
      ${recordInput('From', 'from', 'text', true)}
      ${recordSelect('Type', 'category', GIFT_TYPES)}
      ${recordInput('Value', 'value', 'number')}
      ${recordInput('Received', 'date', 'date')}
      ${recordSelect('Thank-you', 'thankyouStatus', GIFT_THANK_STATUSES)}
      ${recordInput('Thank-you date', 'thankyouDate', 'date')}
      ${recordInput('Written by', 'writtenBy')}
      ${recordInput('Address', 'address')}
      ${recordTextarea('Notes', 'notes')}
    </div></section>`;
  }

  function renderGiftsRecordEditorRd() {
    if (recordEditorState?.inlineMount === 'record-drawer-body') return renderGiftsDrawerEditor();
    return renderGiftsRecordEditorFull();
  }

  function rdGiftsFullEditor() {
    const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('gifts') : [];
    const rows = giftRows();
    let idx = ids.length ? rows.findIndex(r => String(r._id) === String(ids[0])) : -1;
    if (idx < 0 && recordEditorState && recordEditorState.key === 'gifts' && recordEditorState.index != null) idx = recordEditorState.index;
    if (idx < 0) idx = 0;
    if (!rows.length) { openRecordEditor('gifts'); return; }
    openRecordEditor('gifts', idx);
  }

  function addGiftRowRd() {
    if (document.body.getAttribute('data-active-panel') === 'gifts' && document.getElementById('record-drawer-body')) {
      covInlineLoad('gifts', null, 'record-drawer-body', null, { scroll: false });
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
      return;
    }
    openRecordEditor('gifts');
  }

  function applyGiftsRailView(viewId) {
    window._giftsRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('gifts', window._giftsRailView);
    renderGifts();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('gifts');
  }
  function applyGiftsRailGroupBy(groupId) {
    window._giftsRailGroupBy = groupId || 'type';
    if (typeof setSavedView === 'function') setSavedView('giftsGroupBy', window._giftsRailGroupBy);
    renderGifts();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('gifts');
  }

  function renderGiftsRd() {
    ensureGiftsDemoSeed();
    ensureGiftRegistryCategories();
    giftRows().forEach(g => {
      if (!g.thankyouStatus) g.thankyouStatus = giftThankStatus(g);
      if (g.thankyouStatus === 'Sent') g.thankyou = true;
    });
    uedGiftsShell();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('gifts');
    rdApplyGiftsViewMode();
    renderGiftStatsRd();
    renderGiftsToolbar();
    renderGiftsBulkBar();
    const view = rdGetGiftsView();
    if (view === 'table') {
      renderGiftsPreviewTable();
      renderGiftsRegistrySection();
    } else if (view === 'registry') {
      renderGiftsRegistryView();
    } else if (view === 'notes') {
      renderGiftsNotesView();
    }
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'gifts'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('gifts');
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) window.covenantShell.drawer();
    rdApplyGiftsDrawerRowFocus();
  }

  window.__giftsRenderRd = renderGiftsRd;
  window.__uedGiftsShellRd = uedGiftsShell;
  window.uedGiftsShell = uedGiftsShell;
  window.renderGifts = renderGiftsRd;
  window.renderGiftStats = renderGiftStatsRd;
  window.renderGiftsRecordEditor = renderGiftsRecordEditorRd;
  window.__giftsRenderRecordEditorRd = renderGiftsRecordEditorRd;
  window.addGiftRow = addGiftRowRd;
  window.rdGiftsFullEditor = rdGiftsFullEditor;
  window.rdSetGiftsView = rdSetGiftsView;
  window.rdGetGiftsView = rdGetGiftsView;
  window.applyGiftsRailView = applyGiftsRailView;
  window.applyGiftsRailGroupBy = applyGiftsRailGroupBy;
  window.giftsDrawerShellTabs = giftsDrawerShellTabs;
  window.giftsDrawerSelectTab = giftsDrawerSelectTab;
  window.giftGroupHeaderLabel = giftGroupHeaderLabel;
  window.giftRowGroupMeta = giftRowGroupMeta;
  window.giftMatchesFilters = giftMatchesFilters;
  window.giftThankStatus = giftThankStatus;
  window.giftType = giftType;
  window.giftsStatsData = giftsStatsData;
  window.giftsOpenDrawerById = giftsOpenDrawerById;
  window.openGiftsFilter = openGiftsFilter;
  window.clearGiftsFilter = clearGiftsFilter;
  window.openGiftsSort = openGiftsSort;
  window.setGiftsAxisFilter = setGiftsAxisFilter;
  window.toggleGiftsAgedFilter = toggleGiftsAgedFilter;
  window.openGiftsRegistrySort = openGiftsRegistrySort;
  window.openGiftsNotesSort = openGiftsNotesSort;
  window.addGiftRegistryItem = addGiftRegistryItem;
  window.rdToggleRegistryCategory = rdToggleRegistryCategory;
  window.rdToggleRegistryCategoryByIndex = rdToggleRegistryCategoryByIndex;
  window.rdRegistryCategoryKey = rdRegistryCategoryKey;
  window.rdGiftsFullEditorForCategory = rdGiftsFullEditorForCategory;
  window.rdFilterGiftsByRegistryCategory = rdFilterGiftsByRegistryCategory;
  window.giftsOpenHouseholdFromGift = giftsOpenHouseholdFromGift;
  window.giftHouseholdLabel = giftHouseholdLabel;
  window.giftsBulkClear = giftsBulkClear;
  window.giftsBulkMarkSent = giftsBulkMarkSent;
  window.giftsBulkDraft = giftsBulkDraft;
  window.giftsBulkAssignWriter = giftsBulkAssignWriter;
  window.rdCycleGiftsRowHeight = rdCycleGiftsRowHeight;
  window.rdGiftsAutoFitColumns = rdGiftsAutoFitColumns;
  window.rdGiftsOpenColumns = rdGiftsOpenColumns;
  window.rdApplyGiftsDrawerRowFocus = rdApplyGiftsDrawerRowFocus;

  function hookGiftsPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.gifts = function () { renderGiftsRd(); };
    }
  }
  hookGiftsPanelRenderer();
  var _showPanelGifts = window.showPanel;
  if (typeof _showPanelGifts === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelGifts.call(window, id, forceOpen);
      hookGiftsPanelRenderer();
      return out;
    };
  }
})();
