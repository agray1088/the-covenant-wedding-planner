/* Vision Board — All.dc #8b + Dark.dc #8b rail + Drawers batch (Vision pin · 8b).
   Views: Board | Palette | List (Palette/List are switcher surfaces; no Views.dc drawings).
   Rail: All pins · Linked to a vendor · Linked to budget · Not categorised · Shared with vendors
         + Categories meters + Ecclesiastes note.
   Stats: Pins · Categories · Palette · Linked to a vendor · Uncategorised.
   Board: palette strip + pin grid with drop wells.
   Drawer tabs: Pin · Colours · Links · History.
   Data: moodPhotos · moodItems · palettes · visionBoard · moodFavorites. */
(function () {
  'use strict';

  window._moodMode = window._moodMode || 'board';
  window._moodRailView = window._moodRailView || 'all';
  window._moodUiFilters = window._moodUiFilters || { category: 'all', linked: 'all' };
  window._moodDrawerId = window._moodDrawerId || null;
  window._moodDrawerTab = window._moodDrawerTab || 0;

  const DRAWER_TABS = ['Pin', 'Colours', 'Links', 'History'];
  const DEFAULT_PALETTE = [
    { name: 'Forest', hex: '#2D4A3E', note: 'Groomsmen, greenery' },
    { name: 'Antique gold', hex: '#B89968', note: 'Stationery, candles' },
    { name: 'Champagne', hex: '#E8D9C5', note: 'Bridesmaids' },
    { name: 'Terracotta', hex: '#9C6B5A', note: 'Table runners' },
    { name: 'Ivory', hex: '#F4EFE6', note: 'Linens, florals' }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensureMood() {
    if (typeof ensureMoodData === 'function') ensureMoodData();
    else {
      if (!window.data) window.data = {};
      ['moodPhotos', 'moodItems', 'palettes', 'moodFavorites'].forEach(k => {
        if (!Array.isArray(data[k])) data[k] = [];
      });
      if (!data.visionBoard || typeof data.visionBoard !== 'object') data.visionBoard = {};
    }
  }

  function pinCategory(section) {
    const s = String(section || '').toLowerCase();
    if (!s || /other|unsorted|misc|uncategor/.test(s)) return 'Uncategorised';
    if (/ceremon|aisle|altar|arch/.test(s)) return 'Ceremony';
    if (/reception|table|layout|floor/.test(s)) return 'Reception';
    if (/floral|flower|bouquet|greenery/.test(s)) return 'Florals';
    if (/attire|dress|bridal|bridesmaid|suit|groom/.test(s)) return 'Attire';
    if (/station|invit|paper|menu/.test(s)) return 'Stationery';
    if (/cake|food|drink|dessert/.test(s)) return 'Reception';
    if (/color|palette/.test(s)) return 'Uncategorised';
    if (/venue|architect/.test(s)) return 'Ceremony';
    return String(section || 'Uncategorised').split(/[&/]/)[0].trim() || 'Uncategorised';
  }

  function vendorLink(row) {
    const v = String(row.vendor || row.vendorMatch || row.linkedVendor || '').trim();
    if (!v || /needed|not needed|matched/i.test(v) && !/[A-Za-z]{3,}/.test(v.replace(/needed|matched|not/ig, ''))) {
      /* Try to resolve from vendors list by name fragment in notes/caption */
      const hay = [row.notes, row.caption, row.item].join(' ');
      const vendors = (data.vendors || []);
      const hit = vendors.find(x => x.name && hay.toLowerCase().includes(String(x.name).toLowerCase()));
      if (hit) return { kind: 'vendor', label: hit.name, ref: hit };
      return null;
    }
    if (/^matched$/i.test(v)) return null;
    return { kind: 'vendor', label: v, ref: null };
  }
  function budgetLink(row) {
    const b = String(row.budgetLine || row.budget || '').trim();
    if (b) return { kind: 'budget', label: b };
    const hay = [row.section, row.item, row.notes, row.caption].join(' ').toLowerCase();
    if (/floral|bouquet|decor|greenery|candle/.test(hay)) return { kind: 'budget', label: 'Florals & decor' };
    if (/attire|dress|bridesmaid|suit/.test(hay)) return { kind: 'budget', label: 'Attire' };
    if (/cake|dessert/.test(hay)) return { kind: 'budget', label: 'Cake' };
    return null;
  }

  function unifyPhoto(row, i) {
    const cat = pinCategory(row.section);
    const title = String(row.caption || row.title || row.section || 'Untitled pin').trim() || 'Untitled pin';
    const vLink = vendorLink(row);
    const bLink = budgetLink(row);
    const shared = !!(row.shared || row.sharedOn);
    return {
      id: row._id ? ('moodPhotos:' + row._id) : ('moodPhotos:idx:' + i),
      src: 'moodPhotos', index: i, row: row,
      title: title,
      note: String(row.notes || row.colorStory || '').trim(),
      category: cat,
      image: row.src || '',
      vendor: vLink,
      budget: bLink,
      shared: shared,
      sharedOn: row.sharedOn || '',
      colors: Array.isArray(row.colors) ? row.colors : []
    };
  }
  function unifyItem(row, i) {
    const cat = pinCategory(row.section);
    const title = String(row.item || row.title || 'Untitled pin').trim() || 'Untitled pin';
    const vLink = vendorLink(Object.assign({}, row, { vendor: row.vendorMatch === 'Matched' ? (row.vendor || row.notes) : row.vendor }));
    /* If vendorMatch is Matched, try notes for name */
    let vendor = vLink;
    if (!vendor && /matched/i.test(String(row.vendorMatch || ''))) {
      const vendors = data.vendors || [];
      const hit = vendors.find(x => x.name && String(row.notes || '').toLowerCase().includes(String(x.name).toLowerCase()));
      if (hit) vendor = { kind: 'vendor', label: hit.name, ref: hit };
      else if (row.notes && /^[A-Z]/.test(row.notes)) vendor = { kind: 'vendor', label: String(row.notes).split(/[.—]/)[0].trim(), ref: null };
    }
    const budget = budgetLink(row);
    return {
      id: row._id ? ('moodItems:' + row._id) : ('moodItems:idx:' + i),
      src: 'moodItems', index: i, row: row,
      title: title,
      note: String(row.notes || row.colorStory || '').trim(),
      category: cat,
      image: row.src || row.image || '',
      vendor: vendor,
      budget: budget,
      shared: !!(row.shared || row.sharedOn),
      sharedOn: row.sharedOn || '',
      colors: Array.isArray(row.colors) ? row.colors : [],
      finalized: row.finalized || ''
    };
  }

  function allPins() {
    ensureMood();
    const out = [];
    (data.moodPhotos || []).forEach((r, i) => out.push(unifyPhoto(r, i)));
    (data.moodItems || []).forEach((r, i) => {
      /* Prefer items that look like pin titles; skip pure tracker fluff if photos already cover */
      out.push(unifyItem(r, i));
    });
    return out;
  }
  function findById(id) {
    return allPins().find(p => p.id === id) || null;
  }

  function paletteColors() {
    ensureMood();
    const pals = data.palettes || [];
    if (pals.length && Array.isArray(pals[0].colors) && pals[0].colors.length) {
      return pals[0].colors.map((c, i) => {
        if (typeof c === 'string') {
          return { name: DEFAULT_PALETTE[i] ? DEFAULT_PALETTE[i].name : ('Colour ' + (i + 1)), hex: c, note: DEFAULT_PALETTE[i] ? DEFAULT_PALETTE[i].note : '' };
        }
        return {
          name: c.name || (DEFAULT_PALETTE[i] ? DEFAULT_PALETTE[i].name : 'Colour'),
          hex: c.hex || c.color || '#ccc',
          note: c.note || c.use || (DEFAULT_PALETTE[i] ? DEFAULT_PALETTE[i].note : '')
        };
      });
    }
    return DEFAULT_PALETTE.slice();
  }

  function moodFigures() {
    const pins = allPins();
    const cats = new Set(pins.map(p => p.category).filter(c => c && c !== 'Uncategorised'));
    const linkedVendor = pins.filter(p => p.vendor);
    const linkedBudget = pins.filter(p => p.budget);
    const uncategorised = pins.filter(p => p.category === 'Uncategorised');
    const shared = pins.filter(p => p.shared);
    const byCat = {};
    pins.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    return {
      pins: pins.length,
      categories: cats.size,
      palette: paletteColors().length,
      linkedVendor: linkedVendor.length,
      linkedBudget: linkedBudget.length,
      uncategorised: uncategorised.length,
      shared: shared.length,
      byCat: byCat
    };
  }
  function moodRailCounts() {
    const f = moodFigures();
    return {
      all: f.pins,
      vendor: f.linkedVendor,
      budget: f.linkedBudget,
      uncategorised: f.uncategorised,
      shared: f.shared
    };
  }

  function matchesRail(p) {
    const v = window._moodRailView || 'all';
    if (v === 'vendor') return !!p.vendor;
    if (v === 'budget') return !!p.budget;
    if (v === 'uncategorised') return p.category === 'Uncategorised';
    if (v === 'shared') return !!p.shared;
    return true;
  }
  function matchesFilters(p) {
    if (!matchesRail(p)) return false;
    const ui = window._moodUiFilters || {};
    if (ui.category && ui.category !== 'all' && p.category.toLowerCase() !== String(ui.category).toLowerCase()) return false;
    if (ui.linked && ui.linked !== 'all') {
      if (ui.linked === 'vendor' && !p.vendor) return false;
      if (ui.linked === 'budget' && !p.budget) return false;
      if (ui.linked === 'none' && (p.vendor || p.budget)) return false;
    }
    return true;
  }
  function filteredPins() {
    return allPins().filter(matchesFilters);
  }

  function linkLabel(p) {
    if (p.vendor) {
      const cost = p.vendor.ref && (p.vendor.ref.quote || p.vendor.ref.cost);
      return p.vendor.label + (cost ? (' · $' + Math.round(Number(cost) || 0).toLocaleString()) : '') + ' →';
    }
    if (p.budget) return 'Budget · ' + p.budget.label + ' →';
    return 'Not linked';
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdMoodShareVendor()">Share with a vendor</button>'
      + '<button type="button" class="rd-btn" onclick="rdMoodPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdMoodFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdMoodExport()">Export as PDF</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdMoodAdd()">+ Add a pin</button>';
  }

  function uedMoodShellRd() {
    const panel = document.getElementById('panel-mood');
    if (!panel) return;
    panel.classList.add('ued-scope', 'mood-mockup');
    if (panel.dataset.uedShell === 'mood-rd8b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'mood-rd8b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Vision Board</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="mood-stats" aria-label="Vision board summary"></div>
      <div class="rd-toolbar" id="mood-toolbar"></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="mood-surface-row">
          <div class="rd-surface__main" id="mood-view-host">
            <div class="rd-view" id="mood-view-board" data-mood-view="board"></div>
            <div class="rd-view" id="mood-view-palette" data-mood-view="palette" hidden></div>
            <div class="rd-view" id="mood-view-list" data-mood-view="list" hidden></div>
          </div>
          <div id="mood-drawer-slot"></div>
        </div>
      </div>
      <input type="file" id="mood-pin-file" accept="image/*" hidden multiple onchange="rdMoodFileChosen(event)">
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderMoodStatsRd() {
    const host = document.getElementById('mood-stats');
    if (!host) return;
    const f = moodFigures();
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Pins', value: String(f.pins) },
        { label: 'Categories', value: String(f.categories) },
        { label: 'Palette', value: String(f.palette) },
        { label: 'Linked to a vendor', value: String(f.linkedVendor) },
        { label: 'Uncategorised', value: String(f.uncategorised), attention: f.uncategorised ? 'needs a home' : undefined }
      ]);
      return;
    }
    host.innerHTML = [
      ['Pins', f.pins], ['Categories', f.categories], ['Palette', f.palette],
      ['Linked to a vendor', f.linkedVendor], ['Uncategorised', f.uncategorised]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._moodUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdMoodCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdMoodClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderMoodToolbar() {
    const host = document.getElementById('mood-toolbar');
    if (!host) return;
    const mode = window._moodMode || 'board';
    host.innerHTML = filterChip('Category', 'category') + filterChip('Linked', 'linked') +
      (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by category', "rdStdOpenSort(this,'mood')") : '') +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('mood') : '') +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Vision Board view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'board' ? ' is-active' : ''}" onclick="rdSetMoodView('board')">Board</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'palette' ? ' is-active' : ''}" onclick="rdSetMoodView('palette')">Palette</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'list' ? ' is-active' : ''}" onclick="rdSetMoodView('list')">List</button>` +
      `</div></div>`;
  }

  function applyViewMode() {
    const mode = window._moodMode || 'board';
    ['board', 'palette', 'list'].forEach(name => {
      const el = document.getElementById('mood-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetMoodView(mode) {
    window._moodMode = (mode === 'palette' || mode === 'list') ? mode : 'board';
    renderMoodRd();
  }
  function applyMoodRailView(viewId) {
    window._moodRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('mood', window._moodRailView);
    window._moodMode = 'board';
    renderMoodRd();
  }

  /* ── Board ───────────────────────────────────────────────────────────── */

  function floristVendorLabel() {
    const vendors = (typeof data !== 'undefined' && data.vendors) || [];
    const hit = vendors.find(v => /floral|florist|bloom|flower/i.test([v.name, v.category, v.type, v.role].join(' ')));
    return hit && hit.name ? hit.name : 'florist';
  }

  function renderPaletteStrip(compact) {
    const colors = paletteColors();
    const sendLabel = 'Send to ' + floristVendorLabel();
    let html = `<section class="rd-mood-palette${compact ? ' is-compact' : ''}">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">Palette · ${colors.length} colour${colors.length === 1 ? '' : 's'}</div>` +
      `<p class="rd-help">Drawn from the pins, and what the florist and stationer work to</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdMoodSendFlorist()">${esc(sendLabel)}</button>` +
      `</div>` +
      `<div class="rd-mood-palette__swatches">`;
    colors.forEach(c => {
      html += `<button type="button" class="rd-mood-swatch" onclick="rdSetMoodView('palette')" title="${esc(c.hex)}">` +
        `<span class="rd-mood-swatch__chip" style="background:${esc(c.hex)}"></span>` +
        `<strong>${esc(c.name)}</strong>` +
        `<span class="rd-mood-swatch__hex">${esc(c.hex)}</span>` +
        `<span class="rd-mood-swatch__note">${esc(c.note || '')}</span>` +
        `</button>`;
    });
    html += `</div></section>`;
    return html;
  }

  function pinCard(p) {
    const linked = !!(p.vendor || p.budget);
    return `<article class="rd-mood-pin${p.category === 'Uncategorised' ? ' is-uncat' : ''}" onclick="rdMoodOpenDrawer('${esc(p.id)}')">` +
      `<div class="rd-mood-pin__well${p.image ? ' has-image' : ''}" onclick="event.stopPropagation();rdMoodDrop('${esc(p.id)}')">` +
      (p.image
        ? `<img src="${esc(p.image)}" alt="">`
        : `<span>Drop an image</span>`) +
      `</div>` +
      `<div class="rd-mood-pin__cat">${esc(p.category)}</div>` +
      `<h3>${esc(p.title)}</h3>` +
      `<p>${esc(p.note || '—')}</p>` +
      `<div class="rd-mood-pin__link${linked ? '' : ' is-none'}">${esc(linkLabel(p))}</div>` +
      `</article>`;
  }

  function renderBoardView() {
    const host = document.getElementById('mood-view-board');
    if (!host) return;
    const pins = filteredPins();
    let html = renderPaletteStrip(false);
    html += `<section class="rd-mood-pins">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">Pins · ${pins.length}</div>` +
      `<p class="rd-help">Each well takes an image you drop in</p>` +
      `</div>` +
      `<div class="rd-mood-grid">`;
    if (!pins.length) {
      html += `<div class="rd-mood-empty">` +
        `<p>Nothing on the board yet. Drop images or add a palette.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdMoodAdd()">Add an image</button>` +
        `</div>`;
    } else {
      pins.forEach(p => { html += pinCard(p); });
    }
    html += `</div>` +
      `<button type="button" class="rd-mood-addbtn" onclick="rdMoodAdd()"><span>+</span> Add a pin</button>` +
      `</section>`;
    host.innerHTML = html;
  }

  function renderPaletteView() {
    const host = document.getElementById('mood-view-palette');
    if (!host) return;
    const colors = paletteColors();
    const pins = filteredPins();
    let html = `<section class="rd-mood-palette-page">` +
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">Palette · ${colors.length}</div>` +
      `<p class="rd-help">The approved colours every pin and vendor packet should work to</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdMoodAddColour()">Add a colour</button>` +
      `</div>` +
      `<div class="rd-mood-palette__swatches is-large">`;
    colors.forEach(c => {
      html += `<article class="rd-mood-swatch is-large">` +
        `<span class="rd-mood-swatch__chip" style="background:${esc(c.hex)}"></span>` +
        `<strong>${esc(c.name)}</strong>` +
        `<span class="rd-mood-swatch__hex">${esc(c.hex)}</span>` +
        `<span class="rd-mood-swatch__note">${esc(c.note || '')}</span>` +
        `</article>`;
    });
    html += `</div>` +
      `<p class="rd-help" style="margin-top:18px">${pins.filter(p => p.vendor).length} pin${pins.filter(p => p.vendor).length === 1 ? '' : 's'} linked to a vendor · send the palette with a share packet, not as a free-floating file</p>` +
      `</section>`;
    host.innerHTML = html;
  }

  function renderListView() {
    const host = document.getElementById('mood-view-list');
    if (!host) return;
    const pins = filteredPins();
    let html = `<table class="rd-mood-table"><thead><tr>` +
      `<th>Pin</th><th>Category</th><th>Linked</th><th>Shared</th><th>Note</th>` +
      `</tr></thead><tbody>`;
    if (!pins.length) {
      html += `<tr><td colspan="5" class="rd-mood-empty-cell">No pins in this view yet.</td></tr>`;
    } else {
      pins.forEach(p => {
        html += `<tr class="rd-mood-row" onclick="rdMoodOpenDrawer('${esc(p.id)}')">` +
          `<td class="rd-mood-name">${esc(p.title)}</td>` +
          `<td>${esc(p.category)}</td>` +
          `<td>${esc(linkLabel(p))}</td>` +
          `<td>${esc(p.shared ? ('Yes' + (p.sharedOn ? ' · ' + p.sharedOn : '')) : '—')}</td>` +
          `<td>${esc(p.note || '—')}</td>` +
          `</tr>`;
      });
    }
    html += `</tbody></table>` +
      `<button type="button" class="rd-mood-addbtn" onclick="rdMoodAdd()"><span>+</span> Add a pin</button>`;
    host.innerHTML = html;
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

  function renderMoodDrawer() {
    const slot = document.getElementById('mood-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const p = findById(window._moodDrawerId);
    if (!p) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._moodDrawerTab, 10) || 0));
    const f = moodFigures();
    const palette = paletteColors();
    let body = '';
    if (tab === 0) {
      body =
        `<div class="rd-mood-drawer__well${p.image ? ' has-image' : ''}" onclick="rdMoodDrop('${esc(p.id)}')">` +
        (p.image ? `<img src="${esc(p.image)}" alt="">` : `<span>Drop an image</span>`) +
        `</div>` +
        field('Category', p.category) +
        field('Vendor', p.vendor ? (p.vendor.label + ' →') : '—', p.vendor ? "typeof showPanel==='function'&&showPanel('vendors')" : '') +
        field('Budget line', p.budget ? (p.budget.label + ' →') : '—', p.budget ? "typeof showPanel==='function'&&showPanel('budget')" : '') +
        field('Shared', p.shared ? ('Yes' + (p.sharedOn ? ' · ' + p.sharedOn : '')) : 'No') +
        `<p class="rd-drawer__note">A pin is only useful once it is attached to a vendor. ${f.linkedVendor} of the ${f.pins} are; the rest are still just pictures.</p>`;
    } else if (tab === 1) {
      const pinColors = p.colors.length ? p.colors : palette.slice(0, 3).map(c => c.name);
      const offPalette = [];
      body =
        `<div class="rd-drawer__section-title">Colours in this pin</div>` +
        pinColors.map(name => {
          const label = typeof name === 'string' ? name : (name.name || name.hex || 'Colour');
          const match = palette.find(c => c.name.toLowerCase() === String(label).toLowerCase() || c.hex.toLowerCase() === String(label).toLowerCase());
          if (!match) offPalette.push(label);
          return `<div class="rd-drawer__guest">${esc(label)} <span>${match ? 'matches the palette' : 'not in the palette'}</span></div>`;
        }).join('') +
        (offPalette.length
          ? `<p class="rd-drawer__note">${esc(offPalette[0])} is not one of the palette colours. Either add it to the palette or tell ${esc(floristVendorLabel())} to substitute — a colour that reaches a vendor unapproved becomes the wedding’s colour by accident.</p>`
          : `<p class="rd-drawer__note">An off-palette colour should not reach a vendor without being added to the board’s palette first.</p>`) +
        field('Palette', String(palette.length)) +
        field('In use across pins', Math.min(palette.length, Math.max(1, f.pins)) + ' of ' + palette.length) +
        field('Never used', String(Math.max(0, palette.length - Math.min(palette.length, f.pins)))) +
        field('Off-palette found', offPalette.length ? (offPalette.length + ' colour' + (offPalette.length === 1 ? '' : 's')) : 'None');
    } else if (tab === 2) {
      const also = p.vendor
        ? allPins().filter(x => x.id !== p.id && x.vendor && x.vendor.label === p.vendor.label).slice(0, 4)
        : [];
      body =
        `<div class="rd-drawer__section-title">Linked to</div>` +
        field('Vendors', p.vendor ? (p.vendor.label + (p.shared ? (' · Sent' + (p.sharedOn ? ' ' + p.sharedOn : '')) : '')) : '—', p.vendor ? "typeof showPanel==='function'&&showPanel('vendors')" : '') +
        field('Budget', p.budget ? p.budget.label : '—', p.budget ? "typeof showPanel==='function'&&showPanel('budget')" : '') +
        field('Ceremony & Reception', /ceremon|floral|aisle|arch|reception/i.test(p.category + ' ' + p.title) ? 'Related element →' : '—', "typeof showPanel==='function'&&showPanel('ceremony')") +
        field('Share packet', 'Not included') +
        `<p class="rd-drawer__note">Sharing a pin sends the image and the approved colours, not the note. The vendor sees what to make, not what the couple said about it.</p>` +
        (also.length
          ? `<div class="rd-drawer__section-title">Also pinned to ${esc(p.vendor.label)}</div>` +
            also.map(x => `<div class="rd-drawer__guest">${esc(x.title)} <span>${x.shared ? ('Shared' + (x.sharedOn ? ' ' + x.sharedOn : '')) : 'Not shared'}</span></div>`).join('')
          : '');
    } else {
      body =
        (p.shared ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Shared with ${esc(p.vendor ? p.vendor.label : 'vendor')}${p.sharedOn ? (' · ' + esc(p.sharedOn)) : ''}</div></div>` : '') +
        (p.budget ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Linked to ${esc(p.budget.label)}</div></div>` : '') +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added · ${esc(p.title)}</div></div>` +
        `<p class="rd-drawer__note">Once shared, a pin cannot be un-shared — withdraw the packet instead. Changing it after means telling the vendor.</p>`;
    }

    const foot =
      tab === 1
        ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdMoodAddColour()">Add to palette</button>` +
          `<button type="button" class="rd-btn" onclick="rdMoodFullEditor('${esc(p.id)}')">Full editor</button>`
        : `<button type="button" class="rd-btn" onclick="rdMoodCloseDrawer()">Save</button>` +
          (tab === 0
            ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdMoodSharePin('${esc(p.id)}')">Share pin</button>`
            : '') +
          `<button type="button" class="rd-btn" onclick="rdMoodFullEditor('${esc(p.id)}')">Full editor</button>`;

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-mood-drawer" aria-label="Vision pin">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Pin · ${esc(p.category.toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(p.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="${p.vendor ? 'gold' : 'muted'}">${esc(p.vendor ? 'Vendor linked' : 'Not linked')}</span>` +
      (p.shared ? `<span class="status-pill" data-pillscheme="gold">Shared${p.sharedOn ? ' ' + esc(p.sharedOn) : ''}</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdMoodCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdMoodSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdMoodOpenDrawer(id) {
    window._moodDrawerId = id;
    window._moodDrawerTab = 0;
    renderMoodDrawer();
  }
  function rdMoodCloseDrawer() {
    window._moodDrawerId = null;
    const slot = document.getElementById('mood-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdMoodSetDrawerTab(i) {
    window._moodDrawerTab = i;
    renderMoodDrawer();
  }
  function rdMoodAdd() {
    const input = document.getElementById('mood-pin-file');
    if (input) input.click();
    else if (typeof openRecordEditor === 'function') openRecordEditor('moodItems');
  }
  function rdMoodDrop(id) {
    window._moodDrawerId = id;
    const input = document.getElementById('mood-pin-file');
    if (input) input.click();
  }
  function rdMoodFileChosen(ev) {
    const files = Array.from(ev.target.files || []);
    ev.target.value = '';
    if (!files.length) return;
    ensureMood();
    const target = findById(window._moodDrawerId);
    function readOne(file, cb) {
      if (typeof readShrunkImage === 'function') {
        readShrunkImage(file, 1000, cb);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => cb(reader.result);
      reader.readAsDataURL(file);
    }
    let done = 0;
    files.forEach(file => {
      readOne(file, src => {
        if (target && target.src === 'moodPhotos') {
          target.row.src = src;
        } else if (target && target.src === 'moodItems') {
          target.row.src = src;
          target.row.image = src;
        } else {
          data.moodPhotos.push({
            section: 'Ceremony & Reception Layouts',
            src: src,
            caption: file.name.replace(/\.[^.]+$/, ''),
            favorite: false,
            notes: ''
          });
        }
        done++;
        if (done === files.length) {
          if (typeof save === 'function') save();
          renderMoodRd();
        }
      });
    });
  }
  function rdMoodFullEditor(id) {
    const p = id ? findById(id) : findById(window._moodDrawerId);
    window._moodDrawerId = null;
    const slot = document.getElementById('mood-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (p) openRecordEditor(p.src, p.index);
      else openRecordEditor('moodItems');
    }
  }
  function rdMoodShareVendor() {
    const linked = allPins().find(p => p.vendor) || allPins()[0];
    if (linked) {
      window._moodDrawerId = linked.id;
      window._moodDrawerTab = 2;
      renderMoodRd();
    } else if (typeof covAlert === 'function') {
      covAlert('Add a pin and link it to a vendor before sharing.');
    }
  }
  function rdMoodSharePin(id) {
    const p = findById(id);
    if (!p) return;
    p.row.shared = true;
    p.row.sharedOn = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    if (typeof save === 'function') save();
    if (typeof covAlert === 'function') covAlert('Pin marked shared. Attach it to a share packet from Share Packets when you are ready.');
    renderMoodRd();
  }
  function rdMoodSendFlorist() {
    if (typeof showPanel === 'function') showPanel('vendors');
  }
  function rdMoodAddColour() {
    ensureMood();
    if (!data.palettes.length) {
      data.palettes.push({ name: 'Wedding palette', colors: DEFAULT_PALETTE.map(c => ({ name: c.name, hex: c.hex, note: c.note })) });
    } else {
      const colors = data.palettes[0].colors || (data.palettes[0].colors = []);
      colors.push({ name: 'New colour', hex: '#C4B8A5', note: '' });
    }
    if (typeof save === 'function') save();
    window._moodMode = 'palette';
    renderMoodRd();
  }
  function rdMoodPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdMoodExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Vision Board', allPins().map(p => ({
        pin: p.title, category: p.category, linked: linkLabel(p), note: p.note, shared: p.shared ? 'Yes' : 'No'
      })));
    }
  }
  function rdMoodCycleFilter(field) {
    const options = { all: true };
    if (field === 'category') allPins().forEach(p => { options[p.category] = true; });
    if (field === 'linked') { options.vendor = true; options.budget = true; options.none = true; }
    const list = Object.keys(options);
    const cur = (window._moodUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._moodUiFilters[field] = list[(i + 1) % list.length];
    renderMoodRd();
  }
  function rdMoodClearFilter(field) {
    window._moodUiFilters[field] = 'all';
    renderMoodRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderMoodRd() {
    ensureMood();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('mood', window._moodRailView || 'all');
      if (saved) window._moodRailView = saved;
    }
    uedMoodShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('mood');
    applyViewMode();
    renderMoodStatsRd();
    renderMoodToolbar();

    const mode = window._moodMode || 'board';
    if (mode === 'palette') renderPaletteView();
    else if (mode === 'list') renderListView();
    else renderBoardView();
    renderMoodDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'mood'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('mood');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('mood');
  }

  window.uedMoodShell = uedMoodShellRd;
  window.renderMoodPage = renderMoodRd;
  window.renderMoodRd = renderMoodRd;
  window.rdSetMoodView = rdSetMoodView;
  window.applyMoodRailView = applyMoodRailView;
  window.moodRailCounts = moodRailCounts;
  window.moodFigures = moodFigures;
  window.rdMoodOpenDrawer = rdMoodOpenDrawer;
  window.rdMoodCloseDrawer = rdMoodCloseDrawer;
  window.rdMoodSetDrawerTab = rdMoodSetDrawerTab;
  window.rdMoodAdd = rdMoodAdd;
  window.rdMoodDrop = rdMoodDrop;
  window.rdMoodFileChosen = rdMoodFileChosen;
  window.rdMoodFullEditor = rdMoodFullEditor;
  window.rdMoodShareVendor = rdMoodShareVendor;
  window.rdMoodSharePin = rdMoodSharePin;
  window.rdMoodSendFlorist = rdMoodSendFlorist;
  window.rdMoodAddColour = rdMoodAddColour;
  window.rdMoodPrint = rdMoodPrint;
  window.rdMoodExport = rdMoodExport;
  window.rdMoodCycleFilter = rdMoodCycleFilter;
  window.rdMoodClearFilter = rdMoodClearFilter;
  window.visionTab = function () { rdSetMoodView('board'); };

  function hookMoodPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.mood = function () { renderMoodRd(); };
    }
  }
  hookMoodPanelRenderer();
  var _showPanelMood = window.showPanel;
  if (typeof _showPanelMood === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelMood.call(window, id, forceOpen);
      hookMoodPanelRenderer();
      return out;
    };
  }
})();
