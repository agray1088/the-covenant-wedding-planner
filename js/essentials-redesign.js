/* Essentials Checklist — All.dc #17a + Views By person / Print + Dark.dc rail
   + Drawers batch (Essentials item · Item · Who & where · Note · History).
   Views: Checklist | By person | Print view.
   Rail Kits: Everything · Bride essentials · Groom essentials · Emergency kit ·
     Ceremony documents · Reception bag · Beauty & medicine · Exit / send-off · Tech kit
     + Packed meters + Group by Kit / Person / Where it lives.
   Stats (Checklist): Items · Packed · Bought, not packed · Not bought · Unassigned.
   Columns: Item · Kit · Who carries it · Where it lives · Status · Note.
   Data: data.essentials[] — cat, item, packed, assigned, location, notes (+ status). */
(function () {
  'use strict';

  window._essMode = window._essMode || 'checklist';
  window._essRailView = window._essRailView || 'all';
  window._essGroupBy = window._essGroupBy || 'kit';
  window._essUiFilters = window._essUiFilters || { kit: 'all', person: 'all', status: 'all' };
  window._essShowUnassigned = window._essShowUnassigned !== false;
  window._essDrawerId = window._essDrawerId || null;
  window._essDrawerTab = window._essDrawerTab || 0;
  window._essSel = window._essSel instanceof Set ? window._essSel : new Set();

  const DRAWER_TABS = ['Item', 'Who & where', 'Note', 'History'];
  const KIT_ORDER = [
    'Bride essentials',
    'Groom essentials',
    'Emergency kit',
    'Ceremony documents',
    'Reception bag',
    'Beauty & medicine',
    'Exit / send-off',
    'Tech kit'
  ];
  const KIT_HINTS = {
    'Ceremony documents': 'nothing can start without these',
    'Emergency kit': '',
    'Bride essentials': '',
    'Exit / send-off': ''
  };
  const PRESET_CHIPS = [
    { id: 'wedding', label: 'Wedding day essentials', fn: 'rdEssLoadPreset' },
    { id: 'groom', label: 'Groom packing', fn: 'rdEssLoadGroom' },
    { id: 'emergency', label: 'Emergency kit', fn: 'rdEssLoadEmergency' },
    { id: 'beauty', label: 'Beauty & medicine', fn: 'rdEssLoadBeauty' }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  /* Master s31 · 17a example checklist. Every row the drawing shows, with its
     exact carrier, kit, bag, status and note. The seven items with no carrier
     are the drawn "Nobody is carrying these" residual (5 not bought, 2 bought
     but in nobody's kit) — including the sparklers that also sit unowned on
     Weekend Logistics. Aggregate counts derive from these rows, never typed. */
  const MASTER_ESSENTIALS = [
    ['Ceremony documents', 'Marriage licence', 'Kwesi', 'Document folder', 'In the bag', 'Rev. Mensah signs it'],
    ['Ceremony documents', 'Both ID cards', 'Kwesi', 'Document folder', 'In the bag', ''],
    ['Ceremony documents', 'Rings · two boxes', 'Yaw Darko', "Best man's jacket", 'In the bag', 'Kojo carries them down'],
    ['Ceremony documents', 'Printed vows · both', 'Efua Mensah', 'Document folder', 'In the bag', 'Backup copy with Rev. Mensah'],
    ['Ceremony documents', 'Order of service · 130', 'Kofi Asante', 'Chapel entrance table', 'In the bag', 'From Print Centre'],
    ['Emergency kit', 'Sewing kit & safety pins', 'Efua Mensah', 'Bridal suite', 'In the bag', ''],
    ['Emergency kit', 'Stain remover pen', 'Efua Mensah', 'Bridal suite', 'Bought, not packed', ''],
    ['Emergency kit', 'Plasters & blister pads', 'Akosua', 'Bridal suite', 'In the bag', ''],
    ['Emergency kit', 'Spare tights · 2 pairs', '', '', 'Not bought', ''],
    ['Emergency kit', 'Double-sided tape', '', '', 'Not bought', ''],
    ['Bride essentials', 'Dress · in the garment bag', 'Ama', 'Bridal suite wardrobe', 'In the bag', 'Collected 12 Sep'],
    ['Bride essentials', 'Veil', 'Efua Mensah', 'Bridal suite wardrobe', 'In the bag', ''],
    ['Bride essentials', 'Shoes · plus flats for dancing', 'Ama', 'Bridal suite', 'In the bag', 'Flats go under Table 1'],
    ['Bride essentials', "Something borrowed · grandmother's brooch", 'Nana Afua', 'She is bringing it', 'Bought, not packed', 'Collect Friday at the rehearsal'],
    ['Exit / send-off', 'Sparklers · 60', '', '', 'Not bought', 'Also unowned on Weekend Logistics'],
    ['Exit / send-off', 'Long lighters · 4', 'Michael Tetteh', "Groom's car", 'In the bag', ''],
    ['Exit / send-off', 'Going-away outfits · both', 'Akosua', 'Bridal suite', 'Bought, not packed', ''],
    ['Beauty & medicine', 'Hairspray', '', '', 'Not bought', ''],
    ['Groom essentials', 'Spare cufflinks', '', '', 'Not bought', ''],
    ['Beauty & medicine', 'Blotting papers', '', '', 'Bought, not packed', ''],
    ['Tech kit', 'Phone battery pack', '', '', 'Bought, not packed', '']
  ];
  const LEGACY_ESS_CAT = /Marriage Essentials|Quick Fixes|Personal & Health|Decor & Signage|Misc/i;

  function ensureEss() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.essentials)) data.essentials = [];
  }

  function ensureMasterEssentials() {
    ensureEss();
    if (data._essMasterS31) return;
    const rows = data.essentials;
    const legacyMajority = rows.length > 0
      && rows.filter(r => LEGACY_ESS_CAT.test(String(r.cat || ''))).length >= rows.length / 2;
    if (rows.length === 0 || legacyMajority) {
      data.essentials = MASTER_ESSENTIALS.map(([cat, item, assigned, location, status, notes]) => {
        const row = {
          cat: cat, item: item, assigned: assigned || '', location: location || '',
          notes: notes || '', status: status, packed: status === 'In the bag'
        };
        if (typeof nextRecordId === 'function') row._id = nextRecordId('essentials');
        return row;
      });
    }
    data._essMasterS31 = true;
    if (typeof save === 'function') save();
  }

  function normalizeKit(cat) {
    const c = String(cat || '').trim();
    const lower = c.toLowerCase();
    if (!c) return 'Unassigned kit';
    if (/bride essential/.test(lower)) return 'Bride essentials';
    if (/groom essential|groom —|groom packing/.test(lower)) return 'Groom essentials';
    if (/emergency|quick fix/.test(lower)) return 'Emergency kit';
    if (/ceremony document|marriage essential|^ceremony$/.test(lower)) return 'Ceremony documents';
    if (/reception|decor|signage|guest book|card|gift/.test(lower)) return 'Reception bag';
    if (/beauty|medicine|personal|health|snack/.test(lower)) return 'Beauty & medicine';
    if (/exit|send-?off/.test(lower)) return 'Exit / send-off';
    if (/tech/.test(lower)) return 'Tech kit';
    return c;
  }

  function statusOf(row) {
    const raw = String(row.status || '').trim();
    /* Exact Master states first — note "Bought, not packed" contains "packed"
       and "Not bought" contains "bought", so substring tests must not lead. */
    if (/^in the bag$/i.test(raw)) return 'In the bag';
    if (/^bought,?\s*not packed$/i.test(raw)) return 'Bought, not packed';
    if (/^not bought$/i.test(raw)) return 'Not bought';
    /* Fuzzy fallback for legacy / user-typed values. */
    if (/not bought|to buy|need to buy/i.test(raw)) return 'Not bought';
    if (/in the bag/i.test(raw) || row.packed === true) return 'In the bag';
    if (/bought|purchased|have it/i.test(raw)) return 'Bought, not packed';
    if (row.packed) return 'In the bag';
    return 'Not bought';
  }
  function setStatus(row, status) {
    row.status = status;
    row.packed = status === 'In the bag';
  }
  function carrierOf(row) {
    return String(row.assigned || row.who || row.carrier || '').trim();
  }
  function isUnassigned(row) {
    return !carrierOf(row);
  }
  function coupleNames() {
    const s = data.setup || {};
    const bride = String(s.brideFirst || s.bride || 'Bride').trim() || 'Bride';
    const groom = String(s.groomFirst || s.groom || 'Groom').trim() || 'Groom';
    return { bride, groom };
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'essentials');
    const kit = normalizeKit(row.cat);
    const status = statusOf(row);
    const who = carrierOf(row);
    const where = String(row.location || '').trim() || '—';
    return {
      id: row._id ? ('essentials:' + row._id) : ('essentials:idx:' + i),
      index: i,
      row: row,
      item: String(row.item || row.name || 'Untitled item').trim() || 'Untitled item',
      kit: kit,
      who: who || '—',
      whoRaw: who,
      where: where,
      status: status,
      note: String(row.notes || '').trim(),
      unassigned: !who,
      critical: /ring|licence|license|marriage/i.test([row.item, row.notes, row.cat].join(' '))
    };
  }

  function allItems() {
    ensureEss();
    return (data.essentials || []).map(unify);
  }

  function essFigures() {
    const items = allItems();
    const packed = items.filter(x => x.status === 'In the bag');
    const bought = items.filter(x => x.status === 'Bought, not packed');
    const notBought = items.filter(x => x.status === 'Not bought');
    const unassigned = items.filter(x => x.unassigned);
    const byKit = {};
    KIT_ORDER.forEach(k => { byKit[k] = { total: 0, packed: 0 }; });
    items.forEach(x => {
      if (!byKit[x.kit]) byKit[x.kit] = { total: 0, packed: 0 };
      byKit[x.kit].total++;
      if (x.status === 'In the bag') byKit[x.kit].packed++;
    });
    const carriers = new Set(items.filter(x => !x.unassigned).map(x => x.whoRaw));
    const bags = new Set(items.map(x => x.where).filter(w => w && w !== '—'));
    const criticalOpen = items.filter(x => x.critical && x.status !== 'In the bag');
    return {
      items: items.length,
      packed: packed.length,
      bought: bought.length,
      notBought: notBought.length,
      unassigned: unassigned.length,
      byKit: byKit,
      carriers: carriers.size,
      bags: bags.size,
      criticalOpen: criticalOpen.length,
      pages: Math.max(1, Math.ceil(items.length / 22))
    };
  }

  function essRailCounts() {
    const f = essFigures();
    const out = { all: f.items };
    KIT_ORDER.forEach(k => { out[k] = (f.byKit[k] && f.byKit[k].total) || 0; });
    return out;
  }

  function matchesRail(x) {
    const v = window._essRailView || 'all';
    if (!v || v === 'all') return true;
    return x.kit === v;
  }
  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const ui = window._essUiFilters || {};
    if (ui.kit && ui.kit !== 'all' && x.kit.toLowerCase() !== String(ui.kit).toLowerCase()) return false;
    if (ui.person && ui.person !== 'all') {
      if (ui.person === 'unassigned') {
        if (!x.unassigned) return false;
      } else if (x.whoRaw.toLowerCase() !== String(ui.person).toLowerCase()) return false;
    }
    if (ui.status && ui.status !== 'all' && x.status.toLowerCase() !== String(ui.status).toLowerCase()) return false;
    if (window._essMode === 'byPerson' && !window._essShowUnassigned && x.unassigned) return false;
    return true;
  }
  function filteredItems() {
    return allItems().filter(matchesFilters);
  }

  function statusPill(status) {
    let scheme = 'muted';
    if (status === 'In the bag') scheme = 'green';
    else if (status === 'Bought, not packed') scheme = 'gold';
    else if (status === 'Not bought') scheme = 'coral';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._essMode || 'checklist';
    if (mode === 'byPerson') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEssPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print packing list</button>'
        + '<button type="button" class="rd-btn" onclick="rdEssFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdEssExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssAssignCarrier()">Assign a carrier</button>';
    }
    if (mode === 'print') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEssPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print packing list</button>'
        + '<button type="button" class="rd-btn" onclick="rdEssExport()">Export PDF</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssPrint()">Print</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdEssLoadPreset()">Load a starter list</button>'
      + '<button type="button" class="rd-btn" onclick="rdEssPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdEssFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdEssExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssAdd()">Add item</button>';
  }

  function uedEssentialsShellRd() {
    const panel = document.getElementById('panel-essentials');
    if (!panel) return;
    panel.classList.add('ued-scope', 'essentials-mockup');
    panel.removeAttribute('data-essentials-v2');
    if (panel.dataset.uedShell === 'ess-rd-s31b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'ess-rd-s31b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Essentials Checklist</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="essentials-stats" aria-label="Essentials summary"></div>
      <div class="rd-toolbar" id="essentials-toolbar"></div>
      <div class="rd-bulkbar" id="essentials-bulk-bar" hidden></div>
      <div class="rd-ess-presets" id="essentials-presets"></div>
      <div class="rd-ess-kitmeters" id="essentials-kitmeters"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="essentials-surface-row">
          <div class="rd-surface__main" id="essentials-view-host">
            <div class="rd-view" id="ess-view-checklist" data-ess-view="checklist"></div>
            <div class="rd-view" id="ess-view-byPerson" data-ess-view="byPerson" hidden></div>
            <div class="rd-view" id="ess-view-print" data-ess-view="print" hidden></div>
          </div>
          <div id="essentials-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderEssStatsRd() {
    const host = document.getElementById('essentials-stats');
    if (!host) return;
    const f = essFigures();
    const mode = window._essMode || 'checklist';
    let stats;
    if (mode === 'byPerson') {
      const unassignedItems = allItems().filter(x => x.unassigned);
      const cardBoxUnassigned = unassignedItems.some(x => /card box|guest book/i.test([x.item, x.note, x.where].join(' ')));
      const ringsCritical = allItems().some(x => x.critical && x.status !== 'In the bag' && /ring/i.test(x.item));
      stats = [
        { label: 'Items', value: String(f.items) },
        { label: 'Packed', value: String(f.packed) },
        { label: 'Carriers', value: String(f.carriers) },
        { label: 'Unassigned', value: String(f.unassigned), attention: f.unassigned ? (cardBoxUnassigned ? 'incl. the card box' : 'needs a name') : undefined },
        { label: 'Day-of critical', value: String(f.criticalOpen), attention: f.criticalOpen ? (ringsCritical ? 'the rings' : 'open') : undefined }
      ];
    } else if (mode === 'print') {
      stats = [
        { label: 'Items printing', value: String(f.items) },
        { label: 'Bags', value: String(f.bags) },
        { label: 'Pages', value: String(f.pages) },
        { label: 'Unassigned printed', value: String(f.unassigned), attention: f.unassigned ? 'still on the list' : undefined },
        { label: 'Print class', value: 'A · working' }
      ];
    } else {
      stats = [
        { label: 'Items', value: String(f.items) },
        { label: 'Packed', value: String(f.packed) },
        { label: 'Bought, not packed', value: String(f.bought) },
        { label: 'Not bought', value: String(f.notBought) },
        { label: 'Unassigned', value: String(f.unassigned), attention: f.unassigned ? 'nobody carrying' : undefined }
      ];
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._essUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdEssCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdEssClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderEssToolbar() {
    const host = document.getElementById('essentials-toolbar');
    if (!host) return;
    const mode = window._essMode || 'checklist';
    let left = '';
    if (mode === 'print') {
      left = `<button type="button" class="rd-chip is-active">Group by: bag</button>` +
        `<button type="button" class="rd-chip">Paper: A4</button>` +
        `<span class="rd-ess-toolbar-note">Tick boxes · ${essFigures().pages} pages</span>`;
    } else if (mode === 'byPerson') {
      left = filterChip('Person', 'person') + filterChip('Kit', 'kit') +
        `<button type="button" class="rd-chip${window._essShowUnassigned ? ' is-active' : ''}" onclick="rdEssToggleUnassigned()">Show unassigned${window._essShowUnassigned ? '<span class="rd-chip__clear">✕</span>' : ''}</button>` +
        `<span class="rd-ess-toolbar-note">Sort by carrier</span>`;
    } else {
      left = filterChip('Kit', 'kit') + filterChip('Person', 'person') + filterChip('Status', 'status') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by kit', "rdEssOpenSort(this)") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('essentials') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Essentials view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'checklist' ? ' is-active' : ''}" onclick="rdSetEssView('checklist')">Essentials Checklist</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'byPerson' ? ' is-active' : ''}" onclick="rdSetEssView('byPerson')">By person view</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'print' ? ' is-active' : ''}" onclick="rdSetEssView('print')">Print view</button>` +
      `</div></div>`;
  }

  function renderEssBulk() {
    const host = document.getElementById('essentials-bulk-bar');
    if (!host) return;
    const n = window._essSel.size;
    if (!n || window._essMode === 'print') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEssBulk('packed')">Mark packed</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEssBulk('assign')">Assign to a person</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEssBulk('kit')">Move to a kit</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEssBulk('location')">Set location</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEssPrintKitCard()">Print kit card</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdEssBulkClear()">Clear selection</button>`;
  }

  function renderEssPresets() {
    const host = document.getElementById('essentials-presets');
    const meters = document.getElementById('essentials-kitmeters');
    if (!host || !meters) return;
    if (window._essMode !== 'checklist') {
      host.innerHTML = '';
      meters.innerHTML = '';
      return;
    }
    host.innerHTML =
      `<span class="rd-ess-presets__label">Start from a list:</span>` +
      PRESET_CHIPS.map(p =>
        `<button type="button" class="rd-chip" onclick="${p.fn}()">${esc(p.label)}</button>`
      ).join('') +
      `<span class="rd-ess-presets__hint">A preset adds rows you can edit or delete — it never replaces what is already here</span>`;

    const f = essFigures();
    meters.innerHTML = KIT_ORDER.map(k => {
      const m = f.byKit[k] || { total: 0, packed: 0 };
      if (!m.total) return '';
      const pct = Math.round((m.packed / m.total) * 100);
      return `<div class="rd-ess-kitmeter">` +
        `<div class="rd-ess-kitmeter__top"><span>${esc(k)}</span><span>${m.packed}/${m.total}</span></div>` +
        `<div class="rd-ess-kitmeter__bar"><i style="width:${pct}%"></i></div>` +
        `</div>`;
    }).join('');
  }

  function applyViewMode() {
    const mode = window._essMode || 'checklist';
    ['checklist', 'byPerson', 'print'].forEach(name => {
      const el = document.getElementById('ess-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetEssView(mode) {
    window._essMode = (mode === 'byPerson' || mode === 'print') ? mode : 'checklist';
    renderEssentialsRd();
  }
  function applyEssentialsRailView(viewId) {
    window._essRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('essentials', window._essRailView);
    renderEssentialsRd();
  }
  function applyEssentialsGroupBy(id) {
    window._essGroupBy = id || 'kit';
    renderEssentialsRd();
  }

  /* ── Checklist ───────────────────────────────────────────────────────── */

  function groupItems(items, by) {
    const map = new Map();
    items.forEach(x => {
      let key = x.kit;
      if (by === 'person') key = x.unassigned ? 'Unassigned' : x.whoRaw;
      else if (by === 'where') key = x.where === '—' ? 'No location' : x.where;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(x);
    });
    const keys = Array.from(map.keys());
    if (by === 'kit') {
      keys.sort((a, b) => {
        const ia = KIT_ORDER.indexOf(a);
        const ib = KIT_ORDER.indexOf(b);
        if (ia >= 0 || ib >= 0) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
        return a.localeCompare(b);
      });
    } else if (by === 'person') {
      keys.sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return a.localeCompare(b);
      });
    } else {
      keys.sort((a, b) => a.localeCompare(b));
    }
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  function renderChecklistView() {
    const host = document.getElementById('ess-view-checklist');
    if (!host) return;
    const items = filteredItems();
    const groups = groupItems(items, window._essGroupBy || 'kit');
    const f = essFigures();
    let html = '';

    if (f.unassigned > 0 && (window._essRailView === 'all' || !window._essRailView)) {
      const un = allItems().filter(x => x.unassigned);
      const notBought = un.filter(x => x.status === 'Not bought');
      const boughtNoName = un.filter(x => x.status === 'Bought, not packed');
      const clash = un.filter(x => /weekend logistics|another page|two lists/i.test(x.note));
      const nameList = list => list.map(x => x.item.split(' · ')[0]).join(', ');
      let facts = '';
      if (notBought.length) {
        facts += `<li><b>${notBought.length} not bought</b> · ${esc(nameList(notBought))}</li>`;
      }
      if (boughtNoName.length) {
        facts += `<li><b>${boughtNoName.length} bought, nobody named</b> · ${esc(nameList(boughtNoName))} — bought, but in nobody's kit</li>`;
      }
      if (clash.length) {
        facts += `<li><b>${clash.length} clash${clash.length === 1 ? 'es' : ''} with another page</b> · ${esc(nameList(clash))} — same box, two lists</li>`;
      }
      html += `<div class="rd-ess-callout">` +
        `<div class="rd-ess-callout__main"><strong>Nobody is carrying these · ${f.unassigned} item${f.unassigned === 1 ? '' : 's'}</strong>` +
        `<p>An item with no name against it will not arrive</p>` +
        (facts ? `<ul class="rd-ess-callout__facts">${facts}</ul>` : '') +
        `</div>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssAssignUnassigned()">Assign all ${f.unassigned <= 10 ? ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][f.unassigned] : f.unassigned}</button>` +
        `</div>`;
    }

    if (!items.length) {
      html += `<div class="rd-ess-empty"><p>Nothing on the packing list yet. Load a starter list or add an item.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssLoadPreset()">Load a starter list</button></div>`;
      host.innerHTML = html;
      return;
    }

    html += `<table class="rd-ess-table"><thead><tr>` +
      `<th class="rd-ess-check"></th><th>Item</th><th>Kit</th><th>Who carries it</th><th>Where it lives</th><th>Status</th><th>Note</th>` +
      `</tr></thead><tbody>`;

    groups.forEach(g => {
      const packed = g.items.filter(x => x.status === 'In the bag').length;
      const outstanding = g.items.length - packed;
      const hint = KIT_HINTS[g.key] || (outstanding ? (outstanding + ' outstanding') : '');
      html += `<tr class="rd-ess-group"><td colspan="7">` +
        `<span>${esc(g.key)} · ${g.items.length} item${g.items.length === 1 ? '' : 's'} · ${packed} packed` +
        (hint ? ` · ${esc(hint)}` : '') +
        `</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._essSel.has(x.id);
        html += `<tr class="rd-ess-row${sel ? ' is-selected' : ''}${x.unassigned ? ' is-unassigned' : ''}" onclick="rdEssOpenDrawer('${esc(x.id)}')">` +
          `<td class="rd-ess-check" onclick="event.stopPropagation();rdEssToggleSel('${esc(x.id)}')">` +
          `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.item)}"></td>` +
          `<td class="rd-ess-name">${esc(x.item)}` +
          `<span class="rd-ess-row__actions">` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdEssOpenDrawer('${esc(x.id)}')" title="Open">Open</button>` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdEssFullEditor('${esc(x.id)}')" title="Full editor">Full editor</button>` +
          `</span></td>` +
          `<td>${esc(x.kit)}</td>` +
          `<td>${esc(x.who)}</td>` +
          `<td>${esc(x.where)}</td>` +
          `<td>${statusPill(x.status)}</td>` +
          `<td>${esc(x.note || '—')}</td>` +
          `</tr>`;
      });
    });

    html += `</tbody></table>` +
      `<button type="button" class="rd-ess-addbtn" onclick="rdEssAdd()"><span>+</span> Add an item — kit first, then who carries it</button>`;
    host.innerHTML = html;
  }

  /* ── By person ───────────────────────────────────────────────────────── */

  function personBagStatus(items) {
    const packed = items.filter(x => x.status === 'In the bag').length;
    const total = items.length;
    if (!total) return 'Not started';
    if (packed === total) return 'Packed';
    if (items.some(x => x.critical && x.status !== 'In the bag')) return 'Day-of critical';
    if (packed === 0) return 'Not started';
    if (packed / total >= 0.7) return 'Nearly';
    return 'Outstanding';
  }

  function renderByPersonView() {
    const host = document.getElementById('ess-view-byPerson');
    if (!host) return;
    const items = filteredItems();
    const groups = groupItems(items, 'person');
    let html = '';
    if (!items.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No carriers to show in this filter.</p></div>`;
      return;
    }
    groups.forEach(g => {
      const packed = g.items.filter(x => x.status === 'In the bag').length;
      const isUn = g.key === 'Unassigned';
      const note = isUn
        ? 'in the checklist, nobody carrying them'
        : (g.items.length > 12 ? 'carries what nobody else can lose' : 'packing by bag');
      html += `<section class="rd-ess-person${isUn ? ' is-unassigned' : ''}">` +
        `<div class="rd-ess-person__head">` +
        `<span>${esc(g.key)} · ${g.items.length} item${g.items.length === 1 ? '' : 's'}${isUn ? '' : ' · ' + packed + ' packed'}</span>` +
        `<em>${esc(note)}</em></div>`;

      /* Collapse into kit+bag bundles for denser reading (Views.dc shape). */
      const bundles = new Map();
      g.items.forEach(x => {
        const key = x.kit + '|' + x.where;
        if (!bundles.has(key)) bundles.set(key, []);
        bundles.get(key).push(x);
      });
      bundles.forEach((list, key) => {
        const [kit, where] = key.split('|');
        const p = list.filter(x => x.status === 'In the bag').length;
        const st = isUn ? 'Nobody' : personBagStatus(list);
        const scheme = st === 'Packed' ? 'green'
          : (st === 'Nearly' || st === 'Outstanding' || st === 'Blocked' ? 'gold'
            : (st === 'Day-of critical' || st === 'Nobody' ? 'coral' : 'muted'));
        html += `<article class="rd-ess-bundle" onclick="rdEssOpenDrawer('${esc(list[0].id)}')">` +
          `<div class="rd-ess-bundle__main">` +
          `<div class="rd-ess-bundle__title">${esc(kit)} · ${list.length} item${list.length === 1 ? '' : 's'}</div>` +
          `<div class="rd-ess-bundle__sub">${esc(list.map(x => x.item).slice(0, 4).join(', '))}</div>` +
          `</div>` +
          `<div class="rd-ess-bundle__where">${esc(isUn ? '—' : where)}</div>` +
          `<div class="rd-ess-bundle__count">${isUn ? '—' : (p + ' of ' + list.length)}</div>` +
          `<div><span class="status-pill" data-pillscheme="${scheme}">${esc(st)}</span></div>` +
          `</article>`;
      });
      html += `</section>`;
    });
    host.innerHTML = html;
  }

  /* ── Print view ──────────────────────────────────────────────────────── */

  function renderPrintView() {
    const host = document.getElementById('ess-view-print');
    if (!host) return;
    const items = filteredItems();
    const names = coupleNames();
    const wedding = (data.setup && (data.setup.weddingDate || data.setup.date)) || '';
    let dateLabel = wedding;
    if (wedding) {
      const d = new Date(String(wedding).split('T')[0] + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
    /* Prefer person + bag grouping for print */
    const printGroups = new Map();
    items.forEach(x => {
      const person = x.unassigned ? 'Nobody assigned' : x.whoRaw;
      const bag = x.where === '—' ? 'no bag named' : x.where;
      const key = person + ' · ' + bag;
      if (!printGroups.has(key)) printGroups.set(key, { person: person, bag: bag, items: [] });
      printGroups.get(key).items.push(x);
    });
    const keys = Array.from(printGroups.keys()).sort((a, b) => {
      if (a.startsWith('Nobody')) return 1;
      if (b.startsWith('Nobody')) return -1;
      return a.localeCompare(b);
    });

    let html = `<div class="rd-ess-printsheet__head">` +
      `<span>${esc(names.bride)} &amp; ${esc(names.groom)}${dateLabel ? ' · ' + esc(dateLabel) : ''}</span>` +
      `<span>Essentials · packing list</span></div>`;

    keys.forEach(key => {
      const g = printGroups.get(key);
      const outstanding = g.items.filter(x => x.status !== 'In the bag').length;
      let meta = g.person === 'Nobody assigned'
        ? (g.items.length + ' items · assign before the rehearsal')
        : (g.items.length + ' items' + (outstanding ? ' · ' + outstanding + ' outstanding' : ''));
      const critical = g.person !== 'Nobody assigned'
        && g.items.some(x => x.critical && x.status !== 'In the bag');
      if (critical && !outstanding) meta = g.items.length + ' items · day-of critical';
      html += `<div class="rd-ess-printsheet__group">` +
        `<div class="rd-ess-printsheet__gtitle"><span>${esc(g.person)} · ${esc(g.bag)}</span><em>${esc(meta)}</em></div>`;
      g.items.forEach(x => {
        const mark = x.status === 'In the bag' ? 'packed'
          : (x.unassigned ? 'no carrier' : (x.status === 'Bought, not packed' ? 'outstanding' : '—'));
        html += `<div class="rd-ess-printsheet__row">` +
          `<span class="rd-ess-printsheet__item">☐ ${esc(x.item)}</span>` +
          `<span class="rd-ess-printsheet__kit">${esc(x.kit)}</span>` +
          `<span class="rd-ess-printsheet__mark">${esc(mark)}</span>` +
          `</div>`;
      });
      html += `</div>`;
    });

    if (!items.length) {
      html += `<p class="rd-help">Nothing to print yet.</p>`;
    }
    html += `<div class="rd-ess-printsheet__foot"><span>Printed ${esc(new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }))}</span><span>Page 1 of ${essFigures().pages}</span></div>`;
    host.innerHTML =
      `<div class="rd-ess-proof"><div class="rd-ess-printsheet">${html}</div></div>` +
      `<p class="rd-ess-proof__note">Print always renders light, even when the app is in dark mode. Unassigned items print under their own heading — a packing list that drops what nobody claimed is worse than no list. Class A · working · real ☐ boxes · grouped by bag.</p>`;
  }

  /* ── Drawer ──────────────────────────────────────────────────────────── */

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

  function renderEssDrawer() {
    const slot = document.getElementById('essentials-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = allItems().find(i => i.id === window._essDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._essDrawerTab, 10) || 0));
    const kitItems = allItems().filter(i => i.kit === x.kit);
    const kitPacked = kitItems.filter(i => i.status === 'In the bag').length;
    const kitBought = kitItems.filter(i => i.status === 'Bought, not packed').length;
    const kitNot = kitItems.filter(i => i.status === 'Not bought').length;
    let body = '';
    if (tab === 0) {
      body =
        field('Item', x.item) +
        field('Kit', x.kit) +
        field('Status', x.status) +
        field('Quantity', String(x.row.qty || x.row.quantity || 1)) +
        field('Cost', String(x.row.cost != null && x.row.cost !== '' ? ('$' + x.row.cost) : '$0 · already paid')) +
        `<p class="rd-drawer__note">An item is ready only when it is bought and in a kit. Both columns must be true, which is why bought does not mean ready.</p>`;
    } else if (tab === 1) {
      body =
        field('Carried by', x.unassigned ? '—' : (x.who + ' →'), x.unassigned ? '' : "typeof showPanel==='function'&&showPanel('party')") +
        field('Lives in', x.where) +
        field('Needed at', String(x.row.neededAt || (/document|licence|license|ring/i.test(x.item) ? 'Ceremony' : '—'))) +
        field('Handed to', String(x.row.handedTo || (/licence|license/i.test(x.item) ? 'Officiant' : '—'))) +
        `<p class="rd-drawer__note">${x.critical ? 'Without this one item there is no legal wedding. It is the only row in the planner where a missing object stops the day.' : 'A named bag and a named person are what make this list useful on the morning.'}</p>` +
        `<div class="rd-drawer__section-title">This kit · ${kitItems.length} items</div>` +
        field('In the bag', String(kitPacked)) +
        field('Bought, not packed', String(kitBought)) +
        field('Not bought', String(kitNot));
    } else if (tab === 2) {
      body =
        `<div class="rd-ess-drawer__noteblock">${esc(x.note || 'No note yet.')}</div>` +
        `<p class="rd-drawer__note">A self-contradicting note nobody has corrected — which is exactly what a note is for.</p>`;
    } else {
      body =
        (x.status === 'In the bag'
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Marked in the bag · ${esc(x.item)}</div></div>`
          : '') +
        (x.whoRaw
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Assigned to ${esc(x.whoRaw)}</div></div>`
          : `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Still unassigned</div></div>`) +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added to ${esc(x.kit)}</div></div>` +
        `<p class="rd-drawer__note">Marked in the bag is a claim until someone collects it. History is provisional until item audit tracking lands.</p>`;
    }

    const foot =
      tab === 2
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEssFullEditor('${esc(x.id)}')">Fix the note</button>` +
          `<button type="button" class="rd-btn" onclick="rdEssFullEditor('${esc(x.id)}')">Full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdEssCloseDrawer()">Save</button>` +
          `<button type="button" class="rd-btn" onclick="rdEssFullEditor('${esc(x.id)}')">Full editor</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-ess-drawer" aria-label="Essentials item">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Essentials item · ${esc(x.kit.toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(x.item)}</h2>` +
      `<div class="rd-drawer__chips">` +
      statusPill(x.status) +
      (x.whoRaw ? `<span class="status-pill" data-pillscheme="gold">${esc(x.whoRaw)}</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdEssCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdEssSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdEssOpenDrawer(id) {
    window._essDrawerId = id;
    window._essDrawerTab = 0;
    renderEssDrawer();
  }
  function rdEssCloseDrawer() {
    window._essDrawerId = null;
    const slot = document.getElementById('essentials-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdEssSetDrawerTab(i) {
    window._essDrawerTab = i;
    renderEssDrawer();
  }
  function rdEssAdd() {
    if (typeof openRecordEditor === 'function') openRecordEditor('essentials');
    else if (typeof addEssentialRow === 'function') addEssentialRow();
  }
  function rdEssFullEditor(id) {
    const x = id ? allItems().find(i => i.id === id) : allItems().find(i => i.id === window._essDrawerId);
    window._essDrawerId = null;
    const slot = document.getElementById('essentials-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (x) openRecordEditor('essentials', x.index);
      else openRecordEditor('essentials');
    }
  }
  function rdEssPrint() {
    window._essMode = 'print';
    renderEssentialsRd();
    setTimeout(() => {
      if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
    }, 50);
  }
  function rdEssExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Essentials Checklist', allItems().map(x => ({
        item: x.item, kit: x.kit, who: x.who, where: x.where, status: x.status, note: x.note
      })));
    }
  }
  function rdEssAssignCarrier() {
    const un = allItems().find(x => x.unassigned) || allItems()[0];
    if (un) {
      window._essDrawerId = un.id;
      window._essDrawerTab = 1;
      renderEssentialsRd();
    }
  }
  function rdEssAssignUnassigned() {
    window._essUiFilters.person = 'unassigned';
    window._essMode = 'byPerson';
    renderEssentialsRd();
  }
  function rdEssToggleUnassigned() {
    window._essShowUnassigned = !window._essShowUnassigned;
    renderEssentialsRd();
  }
  function rdEssToggleSel(id) {
    if (window._essSel.has(id)) window._essSel.delete(id);
    else window._essSel.add(id);
    renderEssBulk();
    renderChecklistView();
  }
  function rdEssBulkClear() {
    window._essSel.clear();
    renderEssentialsRd();
  }
  async function rdEssBulk(action) {
    const ids = Array.from(window._essSel);
    if (!ids.length) return;
    const rows = allItems().filter(x => ids.includes(x.id));
    if (action === 'packed') {
      rows.forEach(x => setStatus(x.row, 'In the bag'));
    } else if (action === 'assign') {
      const who = (typeof covPrompt === 'function'
        ? await covPrompt('Assign to which person?', coupleNames().bride)
        : window.prompt('Assign to which person?', coupleNames().bride));
      if (!who) return;
      rows.forEach(x => { x.row.assigned = who; });
    } else if (action === 'kit') {
      const kit = (typeof covPrompt === 'function'
        ? await covPrompt('Move to which kit?', 'Emergency kit')
        : window.prompt('Move to which kit?', 'Emergency kit'));
      if (!kit) return;
      rows.forEach(x => { x.row.cat = kit; });
    } else if (action === 'location') {
      const loc = (typeof covPrompt === 'function'
        ? await covPrompt('Set location / bag name', 'Bridal suite bag')
        : window.prompt('Set location / bag name', 'Bridal suite bag'));
      if (!loc) return;
      rows.forEach(x => { x.row.location = loc; });
    }
    if (typeof save === 'function') save();
    renderEssentialsRd();
  }
  function rdEssPrintKitCard() {
    window._essMode = 'print';
    renderEssentialsRd();
    setTimeout(() => { if (typeof printCurrentPage === 'function') printCurrentPage(); else window.print(); }, 50);
  }
  function rdEssCycleFilter(field) {
    const options = { all: true };
    if (field === 'kit') allItems().forEach(x => { options[x.kit] = true; });
    if (field === 'person') {
      options.unassigned = true;
      allItems().forEach(x => { if (x.whoRaw) options[x.whoRaw] = true; });
    }
    if (field === 'status') {
      options['In the bag'] = true;
      options['Bought, not packed'] = true;
      options['Not bought'] = true;
    }
    const list = Object.keys(options);
    const cur = (window._essUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._essUiFilters[field] = list[(i + 1) % list.length];
    renderEssentialsRd();
  }
  function rdEssClearFilter(field) {
    window._essUiFilters[field] = 'all';
    renderEssentialsRd();
  }

  function appendPresetRows(rows) {
    ensureEss();
    rows.forEach(([cat, item, assigned, location, notes]) => {
      if (data.essentials.some(r => String(r.item || '').toLowerCase() === String(item).toLowerCase())) return;
      const row = {
        cat: cat,
        item: item,
        packed: false,
        assigned: assigned || '',
        location: location || '',
        notes: notes || '',
        status: 'Not bought'
      };
      if (typeof nextRecordId === 'function') row._id = nextRecordId('essentials');
      data.essentials.push(row);
    });
    if (typeof save === 'function') save();
    renderEssentialsRd();
  }
  async function rdEssLoadPreset() {
    if (typeof loadEssentialsPreset === 'function') {
      await loadEssentialsPreset();
      renderEssentialsRd();
      return;
    }
    if (typeof ESSENTIALS_PRESET !== 'undefined') appendPresetRows(ESSENTIALS_PRESET);
  }
  async function rdEssLoadGroom() {
    if (typeof loadGroomPackingPreset === 'function') {
      await loadGroomPackingPreset();
      renderEssentialsRd();
      return;
    }
  }
  function rdEssLoadEmergency() {
    appendPresetRows([
      ['Emergency kit', 'Sewing kit', 'Coordinator', 'Emergency kit', ''],
      ['Emergency kit', 'Safety pins', 'Coordinator', 'Emergency kit', ''],
      ['Emergency kit', 'Stain remover pen', 'Coordinator', 'Emergency kit', ''],
      ['Emergency kit', 'Pain reliever', 'Coordinator', 'Emergency kit', ''],
      ['Emergency kit', 'Band-aids', 'Coordinator', 'Emergency kit', '']
    ]);
  }
  function rdEssLoadBeauty() {
    appendPresetRows([
      ['Beauty & medicine', 'Makeup touch-up kit', 'Bride', 'Beauty bag', ''],
      ['Beauty & medicine', 'Hairbrush & pins', 'Bride', 'Beauty bag', ''],
      ['Beauty & medicine', 'Setting spray', 'Bride', 'Beauty bag', ''],
      ['Beauty & medicine', 'Allergy medicine', 'Coordinator', 'Emergency kit', ''],
      ['Beauty & medicine', 'Pain reliever', 'Coordinator', 'Emergency kit', '']
    ]);
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderEssentialsRd() {
    ensureMasterEssentials();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('essentials', window._essRailView || 'all');
      if (saved) window._essRailView = saved;
    }
    uedEssentialsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('essentials');
    applyViewMode();
    renderEssStatsRd();
    renderEssToolbar();
    renderEssBulk();
    renderEssPresets();

    const mode = window._essMode || 'checklist';
    if (mode === 'byPerson') renderByPersonView();
    else if (mode === 'print') renderPrintView();
    else renderChecklistView();
    renderEssDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'essentials'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('essentials');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('essentials');
  }

  window.uedEssentialsShell = uedEssentialsShellRd;
  window.renderEssentialsPage = renderEssentialsRd;
  window.renderEssentialsRd = renderEssentialsRd;
  window.rdSetEssView = rdSetEssView;
  window.applyEssentialsRailView = applyEssentialsRailView;
  window.applyEssentialsGroupBy = applyEssentialsGroupBy;
  window.essRailCounts = essRailCounts;
  window.essFigures = essFigures;
  window.rdEssOpenDrawer = rdEssOpenDrawer;
  window.rdEssCloseDrawer = rdEssCloseDrawer;
  window.rdEssSetDrawerTab = rdEssSetDrawerTab;
  window.rdEssAdd = rdEssAdd;
  window.rdEssFullEditor = rdEssFullEditor;
  window.rdEssPrint = rdEssPrint;
  window.rdEssExport = rdEssExport;
  window.rdEssAssignCarrier = rdEssAssignCarrier;
  window.rdEssAssignUnassigned = rdEssAssignUnassigned;
  window.rdEssToggleUnassigned = rdEssToggleUnassigned;
  window.rdEssToggleSel = rdEssToggleSel;
  window.rdEssBulkClear = rdEssBulkClear;
  window.rdEssBulk = rdEssBulk;
  window.rdEssPrintKitCard = rdEssPrintKitCard;
  window.rdEssCycleFilter = rdEssCycleFilter;
  window.rdEssClearFilter = rdEssClearFilter;
  window.rdEssLoadPreset = rdEssLoadPreset;
  window.rdEssLoadGroom = rdEssLoadGroom;
  window.rdEssLoadEmergency = rdEssLoadEmergency;
  window.rdEssLoadBeauty = rdEssLoadBeauty;

  function hookEssPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.essentials = function () { renderEssentialsRd(); };
    }
    window.renderEssentials = renderEssentialsRd;
  }
  hookEssPanelRenderer();
  var _showPanelEss = window.showPanel;
  if (typeof _showPanelEss === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelEss.call(window, id, forceOpen);
      hookEssPanelRenderer();
      return out;
    };
  }
})();
