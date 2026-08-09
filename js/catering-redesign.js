/* Catering & Menu — All.dc #7a + Views #30h/#30i + Drawers batch 24 (Menu item).
   Views: Menu | Tasting notes | Allergens.
   Rail: Full menu · Not yet chosen · Allergen-relevant · Cake & dessert · Drinks · Rentals
         + Dietary needs meters (live from Guest List).
   Stats: Covers contracted · Guests accepted · Shortfall · Food committed · Catering target.
   Drawer tabs: Item | Guests | Costing | History.
   Data: keep menu / beverages / kidsMenu / placeSettings / cateringRentals / snacks /
   vendorMeals / cateringMeta; map display statuses onto legacy CATERING_STATUS. */
(function () {
  'use strict';

  window._catMode = window._catMode || 'menu';
  window._catRailView = window._catRailView || 'full';
  window._catUiFilters = window._catUiFilters || { course: 'all', status: 'all', allergen: 'all' };
  window._catRowHeight = window._catRowHeight || 'compact';
  window._catDrawerId = window._catDrawerId || null;
  window._catDrawerTab = window._catDrawerTab || 0;
  window._catShowRejected = window._catShowRejected !== false;
  window._catConflictsOnly = !!window._catConflictsOnly;

  const CAT_COL_SCOPE = 'catering-7a';
  const CAT_COLUMNS = [
    { key: 'item', label: 'Item', width: '240px' },
    { key: 'serves', label: 'Serves', width: '72px', num: true },
    { key: 'unit', label: 'Unit', width: '80px', num: true },
    { key: 'total', label: 'Line total', width: '96px', num: true },
    { key: 'allergens', label: 'Allergens', width: '120px' },
    { key: 'status', label: 'Status', width: '110px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(CAT_COL_SCOPE, CAT_COLUMNS.map(c => ({
      key: c.key, label: c.label, width: c.width, num: !!c.num
    })), () => { if (typeof renderCateringPage === 'function') renderCateringPage(); });
  }

  const DRAWER_TABS = ['Item', 'Guests', 'Costing', 'History'];
  const ALLERGEN_COLS = ['Nut', 'Gluten', 'Dairy', 'Shellfish', 'Egg', 'Pork', 'Veg', 'Vegan'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));
  function money0(n) {
    if (typeof cateringMoney === 'function') return cateringMoney(n);
    return '$' + Math.round(parseFloat(n) || 0).toLocaleString();
  }
  function moneyOrDash(n) {
    const v = parseFloat(n) || 0;
    return v ? money0(v) : '—';
  }
  function num(v) {
    if (typeof cateringNumber === 'function') return cateringNumber(v);
    const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function menuRows() {
    const rows = typeof safeArray === 'function' ? safeArray(data.menu) : (data.menu || []);
    return rows.map(r => (typeof normalizeMenuRow === 'function' ? normalizeMenuRow(r) : r));
  }
  function bevRows() {
    const rows = typeof safeArray === 'function' ? safeArray(data.beverages) : (data.beverages || []);
    return rows.map(r => (typeof normalizeBeverageRow === 'function' ? normalizeBeverageRow(r) : r));
  }
  function rentalRows() {
    const rows = typeof safeArray === 'function' ? safeArray(data.cateringRentals) : (data.cateringRentals || []);
    return rows.map(r => (typeof normalizeRentalRow === 'function' ? normalizeRentalRow(r) : r));
  }
  function mid(row, i) {
    if (row && row._id) return String(row._id);
    return 'idx:' + i;
  }
  function findMenuById(id) {
    if (!id) return null;
    const rows = data.menu || [];
    if (String(id).indexOf('idx:') === 0) {
      const i = parseInt(String(id).slice(4), 10);
      return rows[i] || null;
    }
    return rows.find(r => String(r._id) === String(id)) || null;
  }
  function menuIndex(row) {
    return (data.menu || []).indexOf(row);
  }

  /* ── status mapping (mock labels ↔ legacy) ───────────────────────────── */

  function displayStatus(row) {
    const raw = String((row && row.status) || 'Idea');
    if (/no vendor|unbooked/i.test(raw)) return 'No vendor';
    if (/quote|quoted/i.test(raw) && !/needs quote/i.test(raw)) return 'Quoted';
    if (/needs quote/i.test(raw)) return 'No vendor';
    if (/confirm|book|include|chosen|chosen/i.test(raw)) return 'Chosen';
    if (/tast/i.test(raw)) return 'Quoted';
    if (/idea|pending|not chosen/i.test(raw)) return 'Not chosen';
    return 'Not chosen';
  }
  function statusPillClass(label) {
    if (label === 'Chosen') return 'green';
    if (label === 'Quoted') return 'gold';
    if (label === 'No vendor') return 'red';
    return 'blue';
  }
  function isChosen(row) { return displayStatus(row) === 'Chosen'; }
  function isNotChosen(row) { return displayStatus(row) === 'Not chosen' || displayStatus(row) === 'No vendor'; }
  function hasAllergen(row) {
    return !!String((row && row.dietary) || '').trim();
  }
  function isCakeCourse(row) {
    return /dessert|cake|sweet/i.test(String((row && row.course) || '') + ' ' + String((row && row.dish) || ''));
  }
  function courseGroup(row) {
    const c = String((row && row.course) || 'Main').toLowerCase();
    if (/app|canap|cocktail|passed/i.test(c)) return 'Canapés · cocktail hour';
    if (/dessert|cake|sweet/i.test(c)) return 'Cake & dessert';
    if (/late|other/i.test(c)) return 'Late night & other';
    return 'Main buffet';
  }
  function lineUnit(row) {
    const unit = num(row.unitCost);
    if (unit) return unit;
    const basis = String(row.costBasis || '');
    const parsed = num(basis);
    return parsed || 0;
  }
  function lineTotal(row) {
    if (typeof cateringLineCost === 'function') return cateringLineCost(row);
    return lineUnit(row) * (num(row.servings) || 0);
  }
  function allergenLabel(row) {
    const d = String((row && row.dietary) || '').trim();
    return d || '—';
  }
  function dishName(row) {
    return String((row && (row.dish || row.item)) || '').trim() || 'Untitled dish';
  }

  /* ── figures ─────────────────────────────────────────────────────────── */

  function acceptedGuests() {
    const g = typeof cateringGuests === 'function' ? cateringGuests('rsvp') : { total: 0, adults: 0, kids: 0 };
    return g;
  }
  function contractedCovers() {
    const mains = menuRows().filter(r => /main|buffet|entree|entrée/i.test(String(r.course || 'Main')) && isChosen(r));
    if (mains.length) {
      return Math.max.apply(null, mains.map(r => num(r.servings) || 0));
    }
    const any = menuRows().filter(isChosen);
    if (any.length) return Math.max.apply(null, any.map(r => num(r.servings) || 0));
    const planned = typeof cateringGuests === 'function' ? cateringGuests('target') : { adults: 0 };
    return planned.adults || planned.total || 0;
  }
  function foodCommitted() {
    return typeof menuSubtotal === 'function' ? menuSubtotal() : menuRows().reduce((s, r) => s + lineTotal(r), 0);
  }
  function cateringTarget() {
    const budget = typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || []);
    const owned = (typeof CATERING_OWNED_CATS !== 'undefined' ? CATERING_OWNED_CATS : ['Food', 'Cake & Desserts', 'Drinks', 'Rentals']);
    let sum = 0;
    let found = false;
    budget.forEach(b => {
      if (owned.indexOf(b.cat) >= 0 || b.cateringOwned) {
        found = true;
        sum += num(b.target != null ? b.target : b.planned);
      }
    });
    if (found && sum) return sum;
    const setupBudget = num(data.setup && data.setup.budget);
    return setupBudget ? Math.round(setupBudget * 0.18) : 0;
  }

  function cateringFigures() {
    const accepted = acceptedGuests();
    const contracted = contractedCovers();
    const shortfall = Math.max(0, (accepted.total || 0) - contracted);
    const food = foodCommitted();
    const target = cateringTarget();
    const menu = menuRows();
    const notChosen = menu.filter(isNotChosen).length;
    const allergen = menu.filter(hasAllergen).length;
    const cake = menu.filter(isCakeCourse).length;
    const drinks = bevRows().length || menu.filter(r => /drink|beverage|punch|coffee|tea|bar/i.test(String(r.course || '') + ' ' + dishName(r))).length;
    const rentals = rentalRows().length;
    return {
      contracted: contracted,
      accepted: accepted.total || 0,
      acceptedAdults: accepted.adults || 0,
      acceptedKids: accepted.kids || 0,
      shortfall: shortfall,
      food: food,
      target: target,
      menuCount: menu.length,
      notChosen: notChosen,
      allergen: allergen,
      cake: cake,
      drinks: drinks,
      rentals: rentals
    };
  }

  function dietaryMeters() {
    const guests = typeof safeArray === 'function' ? safeArray(data.guests) : (data.guests || []);
    const accepted = guests.filter(g => /yes|accepted/i.test(String(g.rsvp || '')));
    const pool = accepted.length ? accepted : guests;
    const meters = [
      { key: 'vegetarian', label: 'Vegetarian', re: /vegetarian|^v$|veg(?!an)/i },
      { key: 'shellfish', label: 'Shellfish allergy', re: /shellfish|shrimp|crab|lobster/i },
      { key: 'gluten', label: 'Gluten-free', re: /gluten|gf\b/i },
      { key: 'nut', label: 'Nut allergy', re: /nut/i },
      { key: 'nomeal', label: 'No meal chosen', re: null }
    ];
    return meters.map(m => {
      let count = 0;
      if (m.key === 'nomeal') {
        count = pool.filter(g => /yes|accepted/i.test(String(g.rsvp || '')) && !String(g.meal || '').trim()).length;
      } else {
        count = pool.filter(g => m.re.test(String(g.dietary || '') + ' ' + String(g.meal || ''))).length;
      }
      return { label: m.label, count: count };
    });
  }

  function cateringRailCounts() {
    const f = cateringFigures();
    return {
      full: f.menuCount,
      notchosen: f.notChosen,
      allergen: f.allergen,
      cake: f.cake,
      drinks: f.drinks,
      rentals: f.rentals
    };
  }

  function matchesRail(row, view) {
    view = view || window._catRailView || 'full';
    if (view === 'full') return true;
    if (view === 'notchosen') return isNotChosen(row);
    if (view === 'allergen') return hasAllergen(row);
    if (view === 'cake') return isCakeCourse(row);
    if (view === 'drinks') return /drink|beverage|punch|coffee|tea|bar/i.test(String(row.course || '') + ' ' + dishName(row));
    if (view === 'rentals') return false;
    return true;
  }
  function matchesFilters(row) {
    const ui = window._catUiFilters || {};
    if (ui.course && ui.course !== 'all') {
      const g = courseGroup(row);
      if (!g.toLowerCase().includes(String(ui.course).toLowerCase()) &&
          String(row.course || '').toLowerCase() !== String(ui.course).toLowerCase()) return false;
    }
    if (ui.status && ui.status !== 'all') {
      if (displayStatus(row).toLowerCase() !== String(ui.status).toLowerCase()) return false;
    }
    if (ui.allergen && ui.allergen !== 'all') {
      if (!new RegExp(ui.allergen, 'i').test(String(row.dietary || ''))) return false;
    }
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._catMode || 'menu';
    const starter = '<button type="button" class="rd-btn" onclick="rdCatLoadStarter()">Load a starter list</button>';
    if (mode === 'tasting') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdCatPrintTasting()">Print tasting sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdCatFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Menu\',data.menu)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCatAddTasting()">Add tasting</button>';
    }
    if (mode === 'allergens') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdCatPrintKitchen()">Print for kitchen</button>'
        + '<button type="button" class="rd-btn" onclick="rdCatFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Menu\',data.menu)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCatAddItem()">Add dish</button>';
    }
    return starter
      + '<button type="button" class="rd-btn" onclick="rdCatSendToCaterer()">Send to caterer</button>'
      + '<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdCatFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Menu\',data.menu)">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCatAddItem()">+ New item</button>';
  }

  async function rdCatLoadStarter() {
    if (typeof rdChoose !== 'function') {
      if (typeof loadMenuPreset === 'function') await loadMenuPreset();
      renderCateringRd();
      return;
    }
    const choice = await rdChoose('Load a starter list', [
      'Starter menu',
      'Kids menu',
      'Beverages',
      'Place settings',
      'Rentals'
    ]);
    if (choice === 'Starter menu' && typeof loadMenuPreset === 'function') await loadMenuPreset();
    else if (choice === 'Kids menu' && typeof loadKidsMenuPreset === 'function') await loadKidsMenuPreset();
    else if (choice === 'Beverages' && typeof loadBeveragePreset === 'function') await loadBeveragePreset();
    else if (choice === 'Place settings' && typeof loadPlaceSettingPreset === 'function') await loadPlaceSettingPreset();
    else if (choice === 'Rentals' && typeof loadRentalPreset === 'function') await loadRentalPreset();
    renderCateringRd();
  }
  window.rdCatLoadStarter = rdCatLoadStarter;

  function uedCateringShellRd() {
    const panel = document.getElementById('panel-catering');
    if (!panel) return;
    panel.classList.add('ued-scope', 'catering-mockup');
    if (panel.dataset.uedShell === 'catering-rd7a') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'catering-rd7a';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Vendors</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Catering &amp; Menu</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="catering-stats" aria-label="Catering summary"></div>
      <div id="catering-headcount" class="rd-cat-headcount"></div>
      <div class="rd-toolbar" id="catering-toolbar"></div>
      <div class="rd-bulkbar" id="catering-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="catering-surface-row">
          <div class="rd-surface__main" id="catering-view-host">
            <div class="rd-view" id="cat-view-menu" data-cat-view="menu">
              <div class="rd-table-wrap ued-table-wrap" id="catering-7a-table"></div>
              <span class="rd-table-foot ued-soft" id="catering-7a-foot"></span>
              <div id="catering-menu-sections" class="rd-cat-sections"></div>
            </div>
            <div class="rd-view" id="cat-view-tasting" data-cat-view="tasting" hidden>
              <div id="catering-tasting-view" class="rd-cat-tasting"></div>
            </div>
            <div class="rd-view" id="cat-view-allergens" data-cat-view="allergens" hidden>
              <div id="catering-allergens-view" class="rd-cat-allergens"></div>
            </div>
          </div>
          <div id="catering-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderCateringStatsRd() {
    const host = document.getElementById('catering-stats');
    if (!host) return;
    const f = cateringFigures();
    const mode = window._catMode || 'menu';

    if (mode === 'tasting') {
      const rows = menuRows();
      const tasted = rows.filter(r => /tast|approved|reject|amend|pending/i.test(String(r.tastingVerdict || r.status || ''))).length;
      const approved = rows.filter(r => /approved/i.test(String(r.tastingVerdict || '')) || (isChosen(r) && /tast/i.test(String(r.status || '')))).length;
      const rejected = rows.filter(r => /reject/i.test(String(r.tastingVerdict || ''))).length;
      const awaiting = rows.filter(r => displayStatus(r) === 'Not chosen' || /pending|idea|tast/i.test(String(r.tastingVerdict || r.status || ''))).length;
      const waiting = guestNeedVegetarian().length;
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Dishes tasted', value: tasted + ' of ' + Math.max(rows.length, 12) },
          { label: 'Approved', value: String(approved) },
          { label: 'Rejected', value: String(rejected) },
          { label: 'Awaiting tasting', value: String(awaiting) },
          { label: 'Guests waiting', value: String(waiting), attention: waiting ? 'No vegetarian main yet' : undefined }
        ]);
        return;
      }
    }
    if (mode === 'allergens') {
      const rows = menuRows().filter(r => matchesRail(r, 'full'));
      const flags = dietaryMeters().reduce((s, m) => s + (m.key === 'nomeal' ? 0 : m.count), 0);
      const nut = dietaryMeters().find(m => m.key === 'nut');
      const gf = dietaryMeters().find(m => m.key === 'gluten');
      const veg = dietaryMeters().find(m => m.key === 'vegetarian');
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Dishes', value: rows.length + ' on the menu' },
          { label: 'Guests with flags', value: String(flags) },
          { label: 'Nut allergy', value: String(nut ? nut.count : 0), attention: nut && nut.count ? 'Check nut dishes' : undefined },
          { label: 'Gluten-free needed', value: String(gf ? gf.count : 0) },
          { label: 'Vegetarian covers', value: String(veg ? veg.count : 0) }
        ]);
        return;
      }
    }

    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Covers contracted', value: String(f.contracted || '—') },
        { label: 'Guests accepted', value: String(f.accepted || '—') },
        {
          label: 'Shortfall',
          value: String(f.shortfall),
          attention: f.shortfall ? 'Covers short of accepted guests' : undefined
        },
        { label: 'Food committed', value: money0(f.food) },
        { label: 'Catering target', value: money0(f.target) }
      ]);
      return;
    }
    host.innerHTML = [
      ['Covers contracted', f.contracted],
      ['Guests accepted', f.accepted],
      ['Shortfall', f.shortfall],
      ['Food committed', money0(f.food)],
      ['Catering target', money0(f.target)]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function renderHeadcountPanel() {
    const host = document.getElementById('catering-headcount');
    if (!host) return;
    if ((window._catMode || 'menu') !== 'menu') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    const f = cateringFigures();
    const short = f.shortfall;
    const contracted = f.contracted || 0;
    const accepted = f.accepted || 0;
    const adults = f.acceptedAdults || Math.max(0, accepted - (f.acceptedKids || 0));
    const kids = f.acceptedKids || 0;
    const perAdult = contracted ? Math.round(f.food / Math.max(1, contracted)) : 58;
    const adultCost = adults * perAdult;
    const kidCost = kids * 28;
    const cakeLine = menuRows().filter(isCakeCourse).reduce((s, r) => s + lineTotal(r), 0);
    const committed = f.food;
    const addCost = short * perAdult;
    const projected = committed + addCost;
    const left = Math.max(0, f.target - projected);
    const pctContract = accepted ? Math.min(100, Math.round((contracted / accepted) * 100)) : 0;
    const pctShort = accepted ? Math.min(100, Math.round((short / accepted) * 100)) : 0;

    host.innerHTML =
      `<div class="rd-cat-headcount__top">` +
      `<div class="rd-cat-headcount__title">Headcount &amp; cost` +
      (short ? `<span class="rd-cat-badge">${short} covers short</span>` : '') +
      `</div></div>` +
      `<div class="rd-cat-headcount__bar" aria-hidden="true">` +
      `<span class="rd-cat-headcount__fill" style="width:${pctContract}%"></span>` +
      `<span class="rd-cat-headcount__gap" style="width:${pctShort}%"></span>` +
      `</div>` +
      `<div class="rd-cat-headcount__barlabels">` +
      `<span>${contracted} contracted</span>` +
      (short ? `<span>${short} to add</span>` : `<span>Headcount covered</span>`) +
      `</div>` +
      `<div class="rd-cat-headcount__grid">` +
      `<div><div class="rd-cat-kicker">Per head</div>` +
      `<div class="rd-cat-line">${adults || contracted} adults × $${perAdult} → ${money0(adultCost || committed)}</div>` +
      `<div class="rd-cat-line">${kids} children × $28 → ${money0(kidCost)}</div>` +
      `<div class="rd-cat-line">Cake &amp; dessert → ${money0(cakeLine)}</div>` +
      `<div class="rd-cat-line is-strong">Committed ${money0(committed)}</div></div>` +
      `<div><div class="rd-cat-kicker">If the ${short || 0} are added</div>` +
      `<div class="rd-cat-line">${short} adults × $${perAdult} → +${money0(addCost)}</div>` +
      `<div class="rd-cat-line">Projected food ${money0(projected)}</div>` +
      `<div class="rd-cat-line">Left in Catering target ${money0(left)}</div>` +
      `<p class="rd-cat-foot">Absorbed by the target — the committed and true-total figures on Budget do not change until this is agreed.</p></div>` +
      `</div>`;
  }

  function filterChip(label, field) {
    const ui = window._catUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCatOpenFilter('${field}',this)">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCatClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderCateringToolbar() {
    const host = document.getElementById('catering-toolbar');
    if (!host) return;
    const mode = window._catMode || 'menu';
    const cols = window.rdColumns ? window.rdColumns.visible(CAT_COL_SCOPE) : CAT_COLUMNS;
    const colLabel = 'Columns · ' + cols.length + ' of ' + CAT_COLUMNS.length;
    const height = window._catRowHeight || 'compact';

    let left = '';
    if (mode === 'tasting') {
      left =
        filterChip('Tasting', 'course') +
        filterChip('Verdict', 'status') +
        `<button type="button" class="rd-chip${window._catShowRejected ? ' is-active' : ''}" onclick="rdCatToggleRejected()">Show rejected${window._catShowRejected ? ' ✕' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by tasting date</button>`;
    } else if (mode === 'allergens') {
      left =
        filterChip('Allergen', 'allergen') +
        filterChip('Course', 'course') +
        `<button type="button" class="rd-chip${window._catConflictsOnly ? ' is-active' : ''}" onclick="rdCatToggleConflicts()">Conflicts only${window._catConflictsOnly ? ' ✕' : ''}</button>` +
        `<span class="rd-cat-toolbar-note">${menuRows().length} dishes · ${ALLERGEN_COLS.length} allergens</span>`;
    } else {
      left =
        filterChip('Course', 'course') +
        filterChip('Status', 'status') +
        filterChip('Allergen', 'allergen');
    }

    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      (mode === 'menu'
        ? `<button type="button" class="rd-chip" onclick="rdCatOpenColumns()">${esc(colLabel)}</button>` +
          `<button type="button" class="rd-chip" onclick="rdCatAutoFit()">Auto-fit columns</button>` +
          `<button type="button" class="rd-chip" onclick="rdCatCycleRowHeight()">Row height · ${esc(height)}</button>`
        : '') +
      `<div class="rd-viewswitch" role="group" aria-label="Catering view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'menu' ? ' is-active' : ''}" onclick="rdSetCateringView('menu')">Menu</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'tasting' ? ' is-active' : ''}" onclick="rdSetCateringView('tasting')">Tasting notes</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'allergens' ? ' is-active' : ''}" onclick="rdSetCateringView('allergens')">Allergens</button>` +
      `</div></div>`;
  }

  function applyViewMode() {
    const mode = window._catMode || 'menu';
    ['menu', 'tasting', 'allergens'].forEach(name => {
      const el = document.getElementById('cat-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetCateringView(mode) {
    window._catMode = (mode === 'tasting' || mode === 'allergens') ? mode : 'menu';
    if (window._catMode === 'allergens') window._catRailView = 'allergen';
    renderCateringRd();
  }

  function applyCateringRailView(viewId) {
    window._catRailView = viewId || 'full';
    if (typeof setSavedView === 'function') setSavedView('catering', window._catRailView);
    if (viewId === 'rentals') {
      window._catMode = 'menu';
    } else if (viewId === 'allergen' && window._catMode === 'menu') {
      /* stay on menu with filter */
    } else if (viewId === 'drinks') {
      window._catMode = 'menu';
    }
    renderCateringRd();
  }

  /* ── Menu table (7a) ─────────────────────────────────────────────────── */

  function visibleMenuRows() {
    const rail = window._catRailView || 'full';
    if (rail === 'rentals') return [];
    if (rail === 'drinks') {
      const drinkMenu = menuRows().filter(r => matchesRail(r, 'drinks') && matchesFilters(r));
      return drinkMenu;
    }
    return menuRows().filter(r => matchesRail(r, rail) && matchesFilters(r));
  }

  function groupedMenu(rows) {
    const order = ['Canapés · cocktail hour', 'Main buffet', 'Cake & dessert', 'Late night & other'];
    const map = {};
    rows.forEach((r, i) => {
      const g = courseGroup(r);
      if (!map[g]) map[g] = { label: g, rows: [], total: 0 };
      map[g].rows.push({ row: r, index: menuIndex(r) });
      map[g].total += lineTotal(r);
    });
    return order.filter(k => map[k]).map(k => map[k]).concat(
      Object.keys(map).filter(k => order.indexOf(k) < 0).map(k => map[k])
    );
  }

  function renderCateringMenuTable() {
    const host = document.getElementById('catering-7a-table');
    const foot = document.getElementById('catering-7a-foot');
    if (!host) return;
    const rail = window._catRailView || 'full';

    if (rail === 'rentals') {
      renderRentalsInlineTable(host, foot);
      return;
    }
    if (rail === 'drinks' && !visibleMenuRows().length) {
      renderBeveragesInlineTable(host, foot);
      return;
    }

    const rows = visibleMenuRows();
    const groups = groupedMenu(rows);
    const dens = window._catRowHeight || 'compact';

    let html = `<table class="rd-cat-table rd-cat-table--${esc(dens)}"><thead><tr>` +
      CAT_COLUMNS.map(c => `<th data-col="${esc(c.key)}"${c.num ? ' class="rd-cat-th--num"' : ''}>${esc(c.label)}</th>`).join('') +
      `</tr></thead><tbody>`;

    if (!groups.length) {
      html += `<tr class="rd-cat-empty"><td colspan="6">No menu items in this view yet. <button type="button" class="rd-btn rd-btn--quiet" onclick="rdCatLoadStarter()">Load a starter list</button></td></tr>`;
    } else {
      groups.forEach(g => {
        const chosen = g.rows.filter(x => isChosen(x.row)).length;
        const sub = g.label.indexOf('Main') === 0
          ? `${contractedCovers()} contracted covers · ${money0(g.total)}`
          : (g.label.indexOf('Cake') === 0
            ? `${money0(g.total)} · baker not booked`
            : money0(g.total));
        html += `<tr class="rd-cat-group"><td colspan="6">${esc(g.label)} · ${esc(sub)}</td></tr>`;
        g.rows.forEach(({ row, index }) => {
          const id = mid(row, index);
          const st = displayStatus(row);
          const unit = lineUnit(row);
          const total = lineTotal(row);
          const subline = String(row.notes || '').split(/[.\n]/)[0].trim();
          html += `<tr class="rd-cat-row" data-id="${esc(id)}" onclick="rdCatOpenDrawer('${esc(id)}')">` +
            `<td><div class="rd-cat-name__primary">${esc(dishName(row))}</div>` +
            (subline ? `<div class="rd-cat-name__sub">${esc(subline)}</div>` : '') +
            `<div class="rd-cat-row__actions">` +
            `<button type="button" onclick="event.stopPropagation();rdCatOpenDrawer('${esc(id)}')">Open</button>` +
            `<button type="button" onclick="event.stopPropagation();rdCatFullEditor(${index})">Full editor</button>` +
            `</div></td>` +
            `<td class="rd-cat-num">${esc(String(row.servings || '—'))}</td>` +
            `<td class="rd-cat-num">${unit ? money0(unit).replace('$', '$') : '—'}</td>` +
            `<td class="rd-cat-num">${total ? money0(total) : '—'}</td>` +
            `<td>${esc(allergenLabel(row))}</td>` +
            `<td><span class="status-pill" data-pillscheme="${statusPillClass(st)}">${esc(st)}</span></td>` +
            `</tr>`;
        });
      });
    }
    html += `<tr class="rd-cat-add"><td colspan="6"><button type="button" class="rd-cat-addbtn" onclick="rdCatAddItem()"><span>+</span> Add an item…</button></td></tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = rows.length + ' item' + (rows.length === 1 ? '' : 's') + ' · Food committed ' + money0(foodCommitted());
  }

  function renderBeveragesInlineTable(host, foot) {
    const rows = bevRows();
    let html = `<table class="rd-cat-table"><thead><tr>` +
      ['Line', 'Category', 'Qty', 'Unit', 'Total', 'Supplier', 'Status'].map(h => `<th>${esc(h)}</th>`).join('') +
      `</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr class="rd-cat-empty"><td colspan="7">No bar lines yet.</td></tr>`;
    } else {
      html += `<tr class="rd-cat-group"><td colspan="7">Drinks · ${money0(typeof beverageSubtotal === 'function' ? beverageSubtotal() : 0)}</td></tr>`;
      rows.forEach((r, i) => {
        const tot = r.included ? 0 : (typeof cateringLineCost === 'function' ? cateringLineCost(r) : num(r.unitCost) * num(r.qty || 1));
        html += `<tr class="rd-cat-row" onclick="typeof openRecordEditor==='function'&&openRecordEditor('beverages',${i})">` +
          `<td>${esc(r.name || 'Bar line')}</td><td>${esc(r.barType || r.type || '—')}</td>` +
          `<td class="rd-cat-num">${esc(String(r.qty || '—'))}</td>` +
          `<td class="rd-cat-num">${r.unitCost ? money0(r.unitCost) : '—'}</td>` +
          `<td class="rd-cat-num">${tot ? money0(tot) : (r.included ? 'Included' : '—')}</td>` +
          `<td>${esc(r.vendor || '—')}</td>` +
          `<td>${esc(r.status || 'Idea')}</td></tr>`;
      });
    }
    html += `<tr class="rd-cat-add"><td colspan="7"><button type="button" class="rd-cat-addbtn" onclick="typeof addBeverageRow==='function'&&addBeverageRow()"><span>+</span> Add a bar line</button></td></tr></tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = rows.length + ' bar line' + (rows.length === 1 ? '' : 's');
  }

  function renderRentalsInlineTable(host, foot) {
    const rows = rentalRows();
    let html = `<table class="rd-cat-table"><thead><tr>` +
      ['Item', 'From the setting', 'Qty', 'Unit', 'Total', 'Supplier', 'Status'].map(h => `<th>${esc(h)}</th>`).join('') +
      `</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr class="rd-cat-empty"><td colspan="7">No rental lines yet.</td></tr>`;
    } else {
      html += `<tr class="rd-cat-group"><td colspan="7">Tableware &amp; rentals · ${money0(typeof rentalSubtotal === 'function' ? rentalSubtotal() : 0)}</td></tr>`;
      rows.forEach((r, i) => {
        html += `<tr class="rd-cat-row" onclick="typeof openRecordEditor==='function'&&openRecordEditor('cateringRentals',${i})">` +
          `<td>${esc(r.item || 'Rental')}</td><td>${esc(r.material || '—')}</td>` +
          `<td class="rd-cat-num">${esc(String(r.qty || '—'))}</td>` +
          `<td class="rd-cat-num">—</td>` +
          `<td class="rd-cat-num">${money0(r.cost)}</td>` +
          `<td>${esc(r.vendor || '—')}</td>` +
          `<td>${esc(r.status || r.source || '—')}</td></tr>`;
      });
    }
    html += `<tr class="rd-cat-add"><td colspan="7"><button type="button" class="rd-cat-addbtn" onclick="typeof addCateringRentalRow==='function'&&addCateringRentalRow()"><span>+</span> Add a rental line</button></td></tr></tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = rows.length + ' rental' + (rows.length === 1 ? '' : 's');
  }

  function renderMenuSections() {
    const host = document.getElementById('catering-menu-sections');
    if (!host) return;
    if ((window._catMode || 'menu') !== 'menu' || (window._catRailView || 'full') !== 'full') {
      host.innerHTML = '';
      return;
    }
    const groups = groupedMenu(menuRows());
    const courseCards = groups.map(g => {
      const chosen = g.rows.filter(x => isChosen(x.row)).length;
      return `<article class="rd-cat-course-card">` +
        `<div class="rd-cat-course-card__title">${esc(g.label.split('·')[0].trim())}</div>` +
        `<div class="rd-cat-course-card__meta">${money0(g.total)} · ${chosen} of ${g.rows.length} chosen</div>` +
        `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCatOpenFilter('course',null,'${esc(g.label.split('·')[0].trim())}')">Edit course</button>` +
        `</article>`;
    }).join('');

    const meta = data.cateringMeta || {};
    const kids = typeof safeArray === 'function' ? safeArray(data.kidsMenu) : (data.kidsMenu || []);
    const snacks = typeof safeArray === 'function' ? safeArray(data.snacks) : (data.snacks || []);
    const vendors = typeof safeArray === 'function' ? safeArray(data.vendorMeals) : (data.vendorMeals || []);
    const places = typeof safeArray === 'function' ? safeArray(data.placeSettings) : (data.placeSettings || []);
    const g = acceptedGuests();

    host.innerHTML =
      sectionHead('Menu builder', 'Compose each course from the tasting shortlist · the table above is what this builder has settled', 'Open the tasting shortlist', "rdSetCateringView('tasting')") +
      `<div class="rd-cat-course-grid">${courseCards || '<p class="rd-help">Add menu items to build courses.</p>'}</div>` +
      sectionHead('Beverage & bar detail', 'Cash bar on the couple’s account, then guest-paid · venue supplies the bar staff', 'Print the bar sheet', "typeof openMealCountSheet==='function'&&openMealCountSheet()") +
      `<div class="rd-cat-summary-cards">` +
      summaryCard('Bar model', meta.barType || 'Beer & Wine', meta.toast || 'Toast pour') +
      summaryCard('Coffee & tea', meta.coffeeStation || 'Included', meta.signature || '') +
      summaryCard('Drinks total', money0(typeof beverageSubtotal === 'function' ? beverageSubtotal() : 0), bevRows().length + ' lines') +
      `</div>` +
      `<div class="rd-table-wrap" id="cwp-beverages-preview"></div>` +
      sectionHead('Children’s menu', `${g.kids || 0} children on the list`, 'Print the kids’ card', "typeof openMenuCard==='function'&&openMenuCard()") +
      `<div class="rd-cat-kids">${kids.length ? kids.map(k => `<div class="rd-cat-line"><strong>${esc(k.option || 'Kids plate')}</strong> · ${esc(String(k.count || 0))} · ${money0(num(k.count) * num(k.costChild))}</div>`).join('') : '<p class="rd-help">No children’s plate yet.</p>'}` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="typeof addKidsMenuRow==='function'&&addKidsMenuRow()">+ Add kids item</button></div>` +
      sectionHead('Pre-wedding snacks', 'Getting-ready food and the cocktail-hour gap · sits outside the cover contract', 'Add to the weekend brief', "typeof showPanel==='function'&&showPanel('logistics')") +
      miniTable(['Item', 'When', 'Cost'], snacks.map(s => [s.item, s.when, money0(num(s.qty || 1) * num(s.cost))]), "typeof addSnackRow==='function'&&addSnackRow()", '+ Add a snack line') +
      sectionHead('Vendor meals', `${vendors.reduce((s, r) => s + num(r.count || 1), 0)} crew meals`, 'Email the vendor count', "rdCatSendToCaterer()") +
      miniTable(['Vendor', 'Crew', 'Cost'], vendors.map(v => [v.vendor, v.count, money0(num(v.count || 1) * num(v.cost))]), "typeof addVendorMealRow==='function'&&addVendorMealRow()", '+ Add a vendor meal') +
      sectionHead('Place setting designer', `One setting, repeated ${g.total || '—'} times · every element becomes a line on the rentals order`, 'Push to rentals order', "applyCateringRailView('rentals')") +
      `<div class="rd-cat-place-grid">${places.slice(0, 6).map(p => `<div class="rd-cat-place-card"><strong>${esc(p.item || 'Element')}</strong><span>${esc(p.color || '')} · ${esc(p.material || '')}</span></div>`).join('') || '<p class="rd-help">No place-setting elements yet.</p>'}</div>` +
      `<button type="button" class="rd-btn rd-btn--quiet" onclick="typeof addPlaceSettingRow==='function'&&addPlaceSettingRow()">Add an element</button>` +
      sectionHead('Tableware & rentals', `${money0(typeof rentalSubtotal === 'function' ? rentalSubtotal() : 0)} on the rentals order`, 'Print the rentals order', "applyCateringRailView('rentals')") +
      sectionHead('Catering costs', 'Everything this page owns, reconciled to the Budget · Food, Cake, Drinks and Rentals are read-only there', 'Open the Budget', "typeof showPanel==='function'&&showPanel('budget')") +
      `<div class="rd-cat-summary-cards">` +
      summaryCard('Food', money0(foodCommitted()), 'Committed') +
      summaryCard('Drinks', money0(typeof beverageSubtotal === 'function' ? beverageSubtotal() : 0), 'Bar') +
      summaryCard('Rentals', money0(typeof rentalSubtotal === 'function' ? rentalSubtotal() : 0), 'Hire') +
      summaryCard('True catering total', money0(typeof cateringTotal === 'function' ? cateringTotal() : foodCommitted()), 'All sections') +
      `</div>` +
      sectionHead('Dietary summary', 'From the Guest List, not typed here', 'Print the kitchen sheet', 'rdCatPrintKitchen()') +
      dietarySummaryTable();

    const bevPreview = document.getElementById('cwp-beverages-preview');
    if (bevPreview) renderBeveragesInlineTable(bevPreview, null);
  }

  function sectionHead(title, help, cta, onclick) {
    return `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">${esc(title)}</div>` +
      `<p class="rd-help">${esc(help)}</p>` +
      (cta ? `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="${onclick}">${esc(cta)}</button>` : '') +
      `</div>`;
  }
  function summaryCard(title, value, sub) {
    return `<div class="rd-cat-summary-card"><div class="rd-cat-kicker">${esc(title)}</div><div class="rd-cat-summary-card__val">${esc(value)}</div><div class="rd-cat-summary-card__sub">${esc(sub || '')}</div></div>`;
  }
  function miniTable(headers, rows, addOnclick, addLabel) {
    let html = `<div class="rd-table-wrap"><table class="rd-cat-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>`;
    if (!rows.length) html += `<tr class="rd-cat-empty"><td colspan="${headers.length}">None yet.</td></tr>`;
    else rows.forEach(r => { html += `<tr>${r.map(c => `<td>${esc(String(c == null ? '' : c))}</td>`).join('')}</tr>`; });
    html += `<tr class="rd-cat-add"><td colspan="${headers.length}"><button type="button" class="rd-cat-addbtn" onclick="${addOnclick}"><span>+</span> ${esc(addLabel)}</button></td></tr></tbody></table></div>`;
    return html;
  }
  function dietarySummaryTable() {
    const meters = dietaryMeters().filter(m => m.count > 0);
    if (!meters.length) return '<p class="rd-help">No dietary flags on the Guest List yet.</p>';
    let html = `<div class="rd-table-wrap"><table class="rd-cat-table"><thead><tr><th>Requirement</th><th>Guests</th><th>Covered by</th><th>Kitchen note</th><th>Status</th></tr></thead><tbody>`;
    meters.forEach(m => {
      const cover = menuRows().find(r => new RegExp(m.label.split(' ')[0], 'i').test(String(r.dietary || '') + ' ' + dishName(r)));
      html += `<tr><td>${esc(m.label)}</td><td class="rd-cat-num">${m.count}</td>` +
        `<td>${esc(cover ? dishName(cover) : '—')}</td>` +
        `<td>${esc(cover ? (cover.notes || '—') : 'Needs a dish')}</td>` +
        `<td>${cover && isChosen(cover) ? 'Covered' : 'Open'}</td></tr>`;
    });
    html += `</tbody></table></div>` +
      `<button type="button" class="rd-btn" style="margin-top:10px" onclick="rdCatSendToCaterer()">Send the kitchen sheet</button>`;
    return html;
  }

  /* ── Tasting view (30h) ──────────────────────────────────────────────── */

  function tastingVerdict(row) {
    const v = String((row && row.tastingVerdict) || '').trim();
    if (v) return v;
    const st = displayStatus(row);
    if (st === 'Chosen') return 'Approved';
    if (/reject/i.test(String(row.notes || ''))) return 'Rejected';
    if (st === 'Quoted') return 'Pending';
    if (st === 'Not chosen' || st === 'No vendor') return 'Pending';
    return 'Pending';
  }

  function renderCateringTastingView() {
    const host = document.getElementById('catering-tasting-view');
    if (!host) return;
    let rows = menuRows().filter(matchesFilters);
    if (!window._catShowRejected) rows = rows.filter(r => tastingVerdict(r) !== 'Rejected');

    const t1 = rows.filter((_, i) => i % 2 === 0);
    const t2 = rows.filter((_, i) => i % 2 === 1);
    const blocks = [
      { title: 'Tasting 1', sub: 'Decision record', rows: t1.length ? t1 : rows.slice(0, Math.ceil(rows.length / 2)) },
      { title: 'Tasting 2', sub: 'Open loop', rows: t2.length ? t2 : rows.slice(Math.ceil(rows.length / 2)) }
    ];

    if (!rows.length) {
      host.innerHTML = '<div class="rd-cat-empty-block">No tasting notes yet. Add dishes on the Menu view, then score them here.</div>';
      return;
    }

    host.innerHTML = blocks.map(b => {
      if (!b.rows.length) return '';
      return `<section class="rd-cat-tasting-block">` +
        `<div class="rd-cat-tasting-block__head"><strong>${esc(b.title)}</strong><span>${esc(b.sub)} · ${b.rows.length} dishes</span></div>` +
        b.rows.map(r => {
          const idx = menuIndex(r);
          const id = mid(r, idx);
          const verdict = tastingVerdict(r);
          const score = r.tastingScore || r.rating || '—';
          return `<article class="rd-cat-tasting-card" onclick="rdCatOpenDrawer('${esc(id)}')">` +
            `<div class="rd-cat-tasting-card__title">${esc(dishName(r))}</div>` +
            `<div class="rd-cat-tasting-card__quote">${esc(r.notes || r.costBasis || 'No quote note yet')}</div>` +
            `<div class="rd-cat-tasting-card__meta">Score ${esc(String(score))} · <span class="status-pill" data-pillscheme="${verdict === 'Approved' ? 'green' : verdict === 'Rejected' ? 'red' : 'gold'}">${esc(verdict)}</span></div>` +
            `</article>`;
        }).join('') +
        `</section>`;
    }).join('');
  }

  /* ── Allergens view (30i) ────────────────────────────────────────────── */

  function allergenMark(row, col) {
    const diet = String((row && row.dietary) || '').toLowerCase();
    const name = dishName(row).toLowerCase();
    const hay = diet + ' ' + name + ' ' + String(row.notes || '').toLowerCase();
    const map = {
      Nut: /nut|peanut|groundnut|suya/,
      Gluten: /gluten|wheat|bread|pastry|cake|jollof|spring roll/,
      Dairy: /dairy|milk|cream|butter|cheese|coffee/,
      Shellfish: /shellfish|shrimp|crab|lobster/,
      Egg: /egg/,
      Pork: /pork|bacon|ham/,
      Veg: /vegetarian|^v\b|veggie/,
      Vegan: /vegan|vg\b/
    };
    const re = map[col];
    if (!re) return '—';
    if (col === 'Veg' || col === 'Vegan') {
      if (re.test(hay)) return '✓';
      if (/beef|chicken|fish|tilapia|meat|suya/.test(hay)) return '—';
      return '○';
    }
    if (re.test(hay)) return '●';
    if (/may contain|shared kitchen|trace/i.test(String(row.notes || ''))) return '○';
    return '—';
  }

  function renderCateringAllergensView() {
    const host = document.getElementById('catering-allergens-view');
    if (!host) return;
    let rows = menuRows().filter(matchesFilters);
    if (window._catConflictsOnly) {
      rows = rows.filter(r => {
        const nutGuests = dietaryMeters().find(m => m.key === 'nut');
        return nutGuests && nutGuests.count && allergenMark(r, 'Nut') === '●';
      });
    }
    let html = `<div class="rd-table-wrap"><table class="rd-cat-table rd-cat-allergen-matrix"><thead><tr>` +
      `<th>Dish</th><th>Covers</th>${ALLERGEN_COLS.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr class="rd-cat-empty"><td colspan="${2 + ALLERGEN_COLS.length}">No dishes to matrix yet.</td></tr>`;
    } else {
      rows.forEach(r => {
        const idx = menuIndex(r);
        const id = mid(r, idx);
        html += `<tr class="rd-cat-row" onclick="rdCatOpenDrawer('${esc(id)}')">` +
          `<td>${esc(dishName(r))}</td><td class="rd-cat-num">${esc(String(r.servings || '—'))}</td>` +
          ALLERGEN_COLS.map(c => {
            const m = allergenMark(r, c);
            return `<td class="rd-cat-mark rd-cat-mark--${m === '●' ? 'yes' : m === '○' ? 'maybe' : m === '✓' ? 'ok' : 'no'}">${m}</td>`;
          }).join('') +
          `</tr>`;
      });
    }
    html += `</tbody></table></div>` +
      `<p class="rd-help" style="padding:12px 4px">● contains · ○ may contain, shared kitchen · — free of · ✓ suitable for that diet. “May contain” is never collapsed into “free of”.</p>`;
    host.innerHTML = html;
  }

  /* ── Drawer (batch 24) ───────────────────────────────────────────────── */

  function guestNeedVegetarian() {
    const guests = typeof safeArray === 'function' ? safeArray(data.guests) : (data.guests || []);
    return guests.filter(g => /vegetarian|^v\b|veggie/i.test(String(g.dietary || '') + ' ' + String(g.meal || '')));
  }
  function guestsForDish(row) {
    const diet = String((row && row.dietary) || '');
    if (/vegetarian|vegan/i.test(diet + ' ' + dishName(row)) || /vegetarian main/i.test(dishName(row))) {
      return guestNeedVegetarian();
    }
    if (!diet) return [];
    const guests = typeof safeArray === 'function' ? safeArray(data.guests) : (data.guests || []);
    const re = new RegExp(diet.split(/[;,]/)[0].trim(), 'i');
    return guests.filter(g => re.test(String(g.dietary || '') + ' ' + String(g.meal || '')));
  }
  function budgetLineForMenu(row) {
    const bucket = isCakeCourse(row) ? 'Cake & Desserts' : 'Food';
    const budget = typeof safeArray === 'function' ? safeArray(data.budget) : (data.budget || []);
    return budget.find(b => String(b.cat || '') === bucket) || { cat: 'Catering · ' + bucket };
  }
  function vendorForMenu(row) {
    const vendors = typeof safeArray === 'function' ? safeArray(data.vendors) : (data.vendors || []);
    const v = vendors.find(x => /cater|food|kitchen|baker|cake/i.test(String(x.cat || '') + ' ' + String(x.name || '')));
    return v || null;
  }

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }

  function renderCateringDrawer() {
    const slot = document.getElementById('catering-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._catDrawerId;
    const row = findMenuById(id);
    if (!row) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const idx = menuIndex(row);
    const st = displayStatus(row);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, windowInt(window._catDrawerTab, 10) || 0));
    const guests = guestsForDish(row);
    const budget = budgetLineForMenu(row);
    const vendor = vendorForMenu(row);
    const unit = lineUnit(row);
    const total = lineTotal(row);

    let body = '';
    if (tab === 0) {
      body =
        field('Course', courseGroup(row).split('·')[0].trim()) +
        field('Dish', dishName(row) === 'Untitled dish' || /not decided/i.test(dishName(row)) ? 'Not decided' : dishName(row)) +
        field('Serves', (row.servings || '—') + (guests.length ? ' · from Guest List' : '')) +
        field('Unit price', unit ? money0(unit) : (isNotChosen(row) ? 'Awaiting dish' : '—')) +
        field('Budget line', (budget.cat || 'Catering · Food') + ' →', "typeof showPanel==='function'&&showPanel('budget')") +
        field('Vendor', (vendor ? vendor.name : 'Add…') + ' →', vendor ? `typeof showPanel==='function'&&showPanel('vendors')` : '') +
        (isNotChosen(row)
          ? `<p class="rd-drawer__note">This line has a headcount but may be missing a price. Choosing a dish lets Budget cost the Catering category.</p>`
          : '') +
        `<div class="rd-drawer__section"><div class="rd-drawer__section-title">Tasting note</div><p>${esc(row.notes || 'Add what you learned at tasting.')}</p></div>`;
    } else if (tab === 1) {
      const list = guests.slice(0, 8).map(g =>
        `<div class="rd-drawer__guest">${esc(g.name || 'Guest')} <span>${esc(g.rsvp || 'Pending')}</span></div>`
      ).join('');
      const meters = dietaryMeters();
      body =
        `<div class="rd-drawer__section-title">Who needs it · ${guests.length}</div>` +
        (list || '<p class="rd-drawer__note">No matching guests on the Guest List.</p>') +
        (guests.length > 8 ? `<div class="rd-drawer__note">+ ${guests.length - 8} more</div>` : '') +
        `<button type="button" class="rd-btn rd-btn--quiet" onclick="typeof showPanel==='function'&&showPanel('guests')">View in Guest List →</button>` +
        `<div class="rd-drawer__chips" style="margin-top:12px">${meters.filter(m => m.count).map(m =>
          `<span class="rd-chip">${esc(m.label)} ${m.count}</span>`
        ).join('')}</div>`;
    } else if (tab === 2) {
      const estimate = unit ? '' : (num(row.servings) ? `If priced at the buffet rate · ${row.servings} × $14.00 = ${money0(num(row.servings) * 14)}` : '');
      body =
        field('Serves', String(row.servings || '—')) +
        field('Unit price', unit ? money0(unit) : '—') +
        field('Line total', total ? money0(total) : '—') +
        field('Allowance', 'Inside ' + (budget.cat || 'Catering · Food')) +
        (estimate ? `<div class="rd-drawer__section"><div class="rd-drawer__section-title">Estimate</div><p>${esc(estimate)}</p></div>` : '');
    } else {
      const hist = Array.isArray(row.history) ? row.history : [];
      body = hist.length
        ? hist.map(h => `<div class="rd-drawer__hist"><strong>${esc(h.date || '')}</strong> · ${esc(h.who || '')}<div>${esc(h.note || '')}</div></div>`).join('')
        : `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Created${row.notes ? ' · ' + esc(String(row.notes).slice(0, 80)) : ''}</div></div>`;
    }

    const footPrimary = isNotChosen(row)
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCatFullEditor(${idx})">Choose a dish</button>`
      : `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCatCloseDrawer()">Save</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-cat-drawer" aria-label="Menu item">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Menu item · ${esc(String(row.course || 'main').toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(dishName(row))}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${statusPillClass(st)}">${esc(st)}</span>` +
      (guests.length ? `<span class="status-pill" data-pillscheme="gold">${guests.length} guests</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdCatCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdCatSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      footPrimary +
      `<button type="button" class="rd-btn" onclick="rdCatFullEditor(${idx})">Full editor</button>` +
      (tab === 0 && isNotChosen(row)
        ? `<button type="button" class="rd-btn" onclick="rdSetCateringView('tasting')">Add to tasting</button>`
        : '') +
      `</div></aside>`;
  }

  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdCatOpenDrawer(id) {
    window._catDrawerId = id;
    window._catDrawerTab = 0;
    renderCateringDrawer();
  }
  function rdCatCloseDrawer() {
    window._catDrawerId = null;
    const slot = document.getElementById('catering-drawer-slot');
    if (slot) {
      slot.classList.remove('is-open');
      slot.innerHTML = '';
    }
  }
  function rdCatSetDrawerTab(i) {
    window._catDrawerTab = i;
    renderCateringDrawer();
  }
  function rdCatAddItem() {
    if (typeof openRecordEditor === 'function') openRecordEditor('menu');
    else if (typeof addMenuRow === 'function') addMenuRow();
  }
  function rdCatAddTasting() {
    if (typeof ensureCateringDefaults === 'function') ensureCateringDefaults(false);
    if (!Array.isArray(data.menu)) data.menu = [];
    const row = typeof defaultMenuRow === 'function'
      ? defaultMenuRow({ dish: 'New tasting dish', status: 'Tasting', tastingVerdict: 'Pending' })
      : { dish: 'New tasting dish', status: 'Tasting', tastingVerdict: 'Pending' };
    if (typeof ensureRowId === 'function') ensureRowId(row, 'menu');
    data.menu.push(row);
    if (typeof save === 'function') save();
    window._catMode = 'tasting';
    renderCateringRd();
  }
  function rdCatFullEditor(idx) {
    if (typeof openRecordEditor === 'function') {
      if (idx == null || idx < 0) {
        const row = findMenuById(window._catDrawerId);
        idx = row ? menuIndex(row) : null;
      }
      /* Clear the page-local decision drawer so §16 can own the slot. */
      window._catDrawerId = null;
      const slot = document.getElementById('catering-drawer-slot');
      if (slot && !slot.querySelector('#record-drawer')) {
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      openRecordEditor('menu', idx);
      return;
    }
    rdCatAddItem();
  }
  function rdCatSendToCaterer() {
    if (typeof openMealCountSheet === 'function') openMealCountSheet();
    else if (typeof emailKitchenSheet === 'function') emailKitchenSheet();
  }
  function rdCatPrintKitchen() {
    if (typeof openMealCountSheet === 'function') openMealCountSheet();
    else printCurrentPage();
  }
  function rdCatPrintTasting() {
    printCurrentPage();
  }
  function rdCatOpenFilter(field, el, forceValue) {
    if (forceValue) {
      window._catUiFilters[field] = forceValue;
      renderCateringRd();
      return;
    }
    const options = {
      course: ['all', 'Appetizer', 'Main', 'Dessert', 'Canapés', 'Salad', 'Side'],
      status: ['all', 'Chosen', 'Not chosen', 'Quoted', 'No vendor', 'Approved', 'Rejected', 'Pending'],
      allergen: ['all', 'Nuts', 'Gluten', 'Dairy', 'Fish', 'Vegetarian', 'Vegan']
    }[field] || ['all'];
    const cur = (window._catUiFilters || {})[field] || 'all';
    const i = options.indexOf(cur);
    window._catUiFilters[field] = options[(i + 1) % options.length];
    renderCateringRd();
  }
  function rdCatClearFilter(field) {
    window._catUiFilters[field] = 'all';
    renderCateringRd();
  }
  function rdCatToggleRejected() {
    window._catShowRejected = !window._catShowRejected;
    renderCateringRd();
  }
  function rdCatToggleConflicts() {
    window._catConflictsOnly = !window._catConflictsOnly;
    renderCateringRd();
  }
  function rdCatOpenColumns() {
    if (window.rdColumns && window.rdColumns.open) window.rdColumns.open(CAT_COL_SCOPE);
  }
  function rdCatAutoFit() {
    if (typeof autoFitColumns === 'function') {
      const table = document.querySelector('#catering-7a-table table');
      if (table) autoFitColumns(table);
    }
  }
  function rdCatCycleRowHeight() {
    const order = ['compact', 'default', 'comfortable'];
    const i = order.indexOf(window._catRowHeight || 'compact');
    window._catRowHeight = order[(i + 1) % order.length];
    renderCateringRd();
  }

  /* ── main render ─────────────────────────────────────────────────────── */

  function renderCateringRd() {
    if (typeof ensureCateringDefaults === 'function') ensureCateringDefaults(false);
    if (typeof syncCateringToBudget === 'function') syncCateringToBudget();
    uedCateringShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('catering');
    applyViewMode();
    renderCateringStatsRd();
    renderHeadcountPanel();
    renderCateringToolbar();

    const mode = window._catMode || 'menu';
    if (mode === 'tasting') renderCateringTastingView();
    else if (mode === 'allergens') renderCateringAllergensView();
    else {
      renderCateringMenuTable();
      renderMenuSections();
    }
    renderCateringDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'catering'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('catering');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('catering');
  }

  window.uedCateringShell = uedCateringShellRd;
  window.renderCateringPage = renderCateringRd;
  window.renderCateringRd = renderCateringRd;
  window.renderCateringStats = renderCateringStatsRd;
  window.rdSetCateringView = rdSetCateringView;
  window.applyCateringRailView = applyCateringRailView;
  window.cateringRailCounts = cateringRailCounts;
  window.cateringFigures = cateringFigures;
  window.cateringDietaryMeters = dietaryMeters;
  window.rdCatOpenDrawer = rdCatOpenDrawer;
  window.rdCatCloseDrawer = rdCatCloseDrawer;
  window.rdCatSetDrawerTab = rdCatSetDrawerTab;
  window.rdCatAddItem = rdCatAddItem;
  window.rdCatAddTasting = rdCatAddTasting;
  window.rdCatFullEditor = rdCatFullEditor;
  window.rdCatSendToCaterer = rdCatSendToCaterer;
  window.rdCatPrintKitchen = rdCatPrintKitchen;
  window.rdCatPrintTasting = rdCatPrintTasting;
  window.rdCatOpenFilter = rdCatOpenFilter;
  window.rdCatClearFilter = rdCatClearFilter;
  window.rdCatToggleRejected = rdCatToggleRejected;
  window.rdCatToggleConflicts = rdCatToggleConflicts;
  window.rdCatOpenColumns = rdCatOpenColumns;
  window.rdCatAutoFit = rdCatAutoFit;
  window.rdCatCycleRowHeight = rdCatCycleRowHeight;

  const _addMenuRow = window.addMenuRow;
  window.addMenuRow = function () {
    if (document.body.getAttribute('data-active-panel') === 'catering'
      && document.getElementById('catering-7a-table')) {
      rdCatAddItem();
      return;
    }
    if (typeof _addMenuRow === 'function') return _addMenuRow.apply(this, arguments);
  };

  function hookCateringPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.catering = function () { renderCateringRd(); };
    }
  }
  hookCateringPanelRenderer();
  var _showPanelCatering = window.showPanel;
  if (typeof _showPanelCatering === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelCatering.call(window, id, forceOpen);
      hookCateringPanelRenderer();
      return out;
    };
  }
})();
