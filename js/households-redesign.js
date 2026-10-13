/* Households — Master s21 / All.dc #14b
   Derived from guests via guestAggregatedHouseholds() — never a separate array.
   Views: Table · Labels · Cards
   Rail: All households · Invited · Fully replied · Partly replied · No reply · No address
   Group by: Side · Reply status · City
   Drawer tabs: Guests · Address · Invitation · History
   Primary action: Add guest (no household add — households are derived). */
(function () {
  'use strict';

  window._hhMode = window._hhMode || 'table';
  window._hhRailView = window._hhRailView || 'all';
  window._hhGroupBy = window._hhGroupBy || 'side';
  window._hhUiFilters = window._hhUiFilters || { side: 'all', reply: 'all', city: 'all' };
  window._hhSort = window._hhSort || 'surname';
  window._hhDrawerKey = window._hhDrawerKey || null;
  window._hhDrawerTab = window._hhDrawerTab || 0;
  window._hhSel = window._hhSel instanceof Set ? window._hhSel : new Set();
  window._hhLabelSize = window._hhLabelSize || 'Avery 5160';

  const DRAWER_TABS = ['Guests', 'Address', 'Invitation', 'History'];
  const SHELL_VER = 'hh-rd14b-s21';
  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

  function allHouseholds() {
    return typeof guestAggregatedHouseholds === 'function'
      ? guestAggregatedHouseholds({ all: true })
      : [];
  }

  function hhDisplayName(h) {
    const members = h.members || [];
    const isGroup = members.some(g => /group/i.test(String(g.role || '')));
    if (isGroup) return h.name;
    return /household$/i.test(h.name) ? h.name : (h.name + ' household');
  }

  function hhIsInvited(h) {
    return (h.members || []).some(g =>
      g.invited || (typeof guestIsInvited === 'function' && guestIsInvited(g)));
  }

  function hhRepliedCount(h) {
    const total = (h.members || []).length || 0;
    const pending = h.pending || 0;
    return Math.max(0, total - pending);
  }

  function hhReplyBucket(h) {
    const total = (h.members || []).length || 0;
    const pending = h.pending || 0;
    if (!total) return 'none';
    if (pending === 0) return 'fully';
    if (pending < total && (h.accepted || h.declined)) return 'partly';
    return 'none';
  }

  function hhReplyLabel(h) {
    const b = hhReplyBucket(h);
    if (b === 'fully') return 'Fully replied';
    if (b === 'partly') return 'Partly replied';
    return 'No reply';
  }

  /* Master status chips: All replied · N outstanding · No reply (table);
     All replied · Partial · No reply (cards). */
  function hhStatusLabel(h) {
    const total = (h.members || []).length || 0;
    const pending = h.pending || 0;
    if (!total || pending === 0) return 'All replied';
    if (pending === total) return 'No reply';
    if (pending === 1) return '1 outstanding';
    return pending + ' outstanding';
  }

  function hhCardStatusLabel(h) {
    const b = hhReplyBucket(h);
    if (b === 'fully') return 'All replied';
    if (b === 'partly') return 'Partial';
    return 'No reply';
  }

  function hhStatusScheme(h) {
    const b = hhReplyBucket(h);
    if (b === 'fully') return 'green';
    if (b === 'partly') return 'gold';
    return 'gray';
  }

  function hhCity(h) {
    for (const g of (h.members || [])) {
      const c = String(g.city || '').trim();
      if (c) return c;
    }
    return 'No city';
  }

  function hhSideLabel(h) {
    const side = typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : 'Both';
    if (side === 'Bride') return 'Bride';
    if (side === 'Groom') return 'Groom';
    return 'Both';
  }

  function hhAddressGuest(h) {
    return (h.members || []).find(g =>
      typeof guestHasAddress === 'function' ? guestHasAddress(g) : !!(g.address1 || g.address || g.city));
  }

  function hhStreet(h) {
    const g = hhAddressGuest(h);
    if (!g) return '';
    return String(g.address1 || g.address || '').trim();
  }

  function hhCountry(h) {
    const g = hhAddressGuest(h);
    return g ? String(g.country || '').trim() : '';
  }

  function hhAddressSummary(h) {
    const g = hhAddressGuest(h);
    if (!g) return { text: 'No address on file', danger: true, street: '', city: '' };
    const street = String(g.address1 || g.address || '').trim();
    const city = String(g.city || '').trim();
    if (!street && !city) return { text: 'Address on file', danger: false, street: '', city: '' };
    return {
      text: street || city,
      danger: false,
      street: street,
      city: city
    };
  }

  function hhCardAddress(h) {
    const g = hhAddressGuest(h);
    if (!g) return 'No address on file';
    const street = String(g.address1 || g.address || '').trim();
    const city = String(g.city || '').trim();
    if (street && city) return street + ', ' + city;
    return street || city || 'Address on file';
  }

  function hhMembersSubline(h) {
    const members = h.members || [];
    const names = members.map(g => g.name || 'Guest');
    if (members.some(g => /group/i.test(String(g.role || '')))) {
      return members.length + ' guests, one invitation to the group';
    }
    return names.length > 3
      ? (names.slice(0, 3).join(', ') + ' +' + (names.length - 3) + ' more')
      : names.join(', ');
  }

  function hhGuestRsvpLabel(g) {
    if (typeof guestIsAccepted === 'function' && guestIsAccepted(g)) return 'Accepted';
    if (typeof guestIsDeclined === 'function' && guestIsDeclined(g)) return 'Declined';
    const raw = String(g.rsvp || g.status || '').trim();
    if (/accept|yes|coming/i.test(raw)) return 'Accepted';
    if (/decline|no|regret/i.test(raw)) return 'Declined';
    if (/pending|await/i.test(raw)) return 'Pending';
    return raw || 'Pending';
  }

  function hhSeatsNeeded(g) {
    const kids = Number(g.children) || 0;
    const plus = g.plusone ? 1 : 0;
    const base = 1;
    return base + kids + plus;
  }

  function hhInviteField(h, key) {
    for (const g of (h.members || [])) {
      const v = String(g[key] || '').trim();
      if (v) return v;
    }
    return '';
  }

  function hhFormatSent(raw, fallbackNot) {
    if (!raw) return fallbackNot || 'Not sent';
    if (typeof guestFormatInviteSentPill === 'function' && /sent|^\d{4}/i.test(raw)) {
      const pill = guestFormatInviteSentPill(raw);
      return pill || raw;
    }
    if (/^sent\b/i.test(raw)) return raw.replace(/^sent\s+/i, 'Sent ');
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const d = typeof humanDate === 'function' ? humanDate(raw, { day: 'numeric', month: 'short' }) : raw;
      return (d && d !== '—') ? ('Sent ' + d) : ('Sent ' + raw);
    }
    return raw;
  }

  function hhLabelPrinted(h) {
    for (const g of (h.members || [])) {
      if (g.labelPrinted || g.labelsPrinted) {
        const d = String(g.labelPrintedDate || g.labelPrinted || '').trim();
        return d && !/^(1|true|yes)$/i.test(d) ? ('Yes · ' + d.replace(/^yes\s*·?\s*/i, '')) : 'Yes';
      }
    }
    return 'No';
  }

  function hhChased(h) {
    return (h.members || []).some(g =>
      g.chased || g.reminderSent || /chased|reminder/i.test(String(g.notes || '')));
  }

  function hhFigures() {
    const rows = allHouseholds();
    const invited = rows.filter(hhIsInvited);
    const fully = rows.filter(h => hhReplyBucket(h) === 'fully');
    const partly = rows.filter(h => hhReplyBucket(h) === 'partly');
    const none = rows.filter(h => hhReplyBucket(h) === 'none');
    const noAddr = rows.filter(h => !h.hasAddress);
    const withAddr = rows.filter(h => h.hasAddress);
    const seats = rows.reduce((s, h) => s + (h.members || []).length, 0);
    const confirmed = rows.reduce((s, h) => s + (h.accepted || 0), 0);
    const chased = rows.filter(hhChased).length;
    const labelsPrinted = rows.filter(h => hhLabelPrinted(h) !== 'No').length;
    return {
      households: rows.length,
      guests: seats,
      invited: invited.length,
      fully: fully.length,
      partly: partly.length,
      none: none.length,
      noAddress: noAddr.length,
      withAddress: withAddr.length,
      seats: seats,
      confirmed: confirmed,
      chased: chased,
      labelsPrinted: labelsPrinted || withAddr.length
    };
  }

  function hhRailCounts() {
    const f = hhFigures();
    return {
      all: f.households,
      invited: f.invited,
      fully: f.fully,
      partly: f.partly,
      none: f.none,
      noAddress: f.noAddress
    };
  }

  function matchesRail(h) {
    const v = window._hhRailView || 'all';
    if (!v || v === 'all') return true;
    if (v === 'invited') return hhIsInvited(h);
    if (v === 'fully') return hhReplyBucket(h) === 'fully';
    if (v === 'partly') return hhReplyBucket(h) === 'partly';
    if (v === 'none') return hhReplyBucket(h) === 'none';
    if (v === 'noAddress' || v === 'no-address') return !h.hasAddress;
    return true;
  }

  function matchesFilters(h) {
    if (!matchesRail(h)) return false;
    const ui = window._hhUiFilters || {};
    if (ui.side && ui.side !== 'all') {
      const side = hhSideLabel(h);
      if (String(side).toLowerCase() !== String(ui.side).toLowerCase()) return false;
    }
    if (ui.reply && ui.reply !== 'all' && hhReplyBucket(h) !== ui.reply) return false;
    if (ui.city && ui.city !== 'all' && hhCity(h).toLowerCase() !== String(ui.city).toLowerCase()) return false;
    return true;
  }

  function surnameKey(h) {
    const name = hhDisplayName(h).replace(/\s+household$/i, '').trim();
    const parts = name.split(/\s+/);
    return (parts[parts.length - 1] || name).toLowerCase();
  }

  function sortHouseholds(rows) {
    const sort = window._hhSort || 'surname';
    const out = rows.slice();
    if (sort === 'za') out.sort((a, b) => surnameKey(b).localeCompare(surnameKey(a)));
    else if (sort === 'guests') out.sort((a, b) => (b.members || []).length - (a.members || []).length);
    else if (sort === 'city') out.sort((a, b) => hhCity(a).localeCompare(hhCity(b)));
    else out.sort((a, b) => surnameKey(a).localeCompare(surnameKey(b)));
    return out;
  }

  function filteredHouseholds() {
    return sortHouseholds(allHouseholds().filter(matchesFilters));
  }

  function groupHouseholds(rows, by) {
    const map = new Map();
    rows.forEach(h => {
      let key = 'All';
      if (by === 'city') key = hhCity(h);
      else if (by === 'reply') key = hhReplyLabel(h);
      else {
        const side = typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : 'Both';
        key = side === 'Bride' ? "Bride's side" : (side === 'Groom' ? "Groom's side" : 'Both sides');
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    });
    const keys = Array.from(map.keys());
    if (by === 'side') {
      const order = ["Bride's side", "Groom's side", 'Both sides'];
      keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else if (by === 'reply') {
      const order = ['Fully replied', 'Partly replied', 'No reply'];
      keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else {
      keys.sort((a, b) => {
        if (a === 'No city') return 1;
        if (b === 'No city') return -1;
        return a.localeCompare(b);
      });
    }
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  function svgIco(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round">'
      + paths + '</svg>';
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._hhMode || 'table';
    const printIco = svgIco('<path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/>');
    const fullIco = svgIco('<path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/>');
    if (mode === 'labels') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
        + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdHhFullEditor()">' + fullIco + 'Full editor</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhPrintLabels()">Print labels</button>';
    }
    if (mode === 'cards') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
        + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdHhFullEditor()">' + fullIco + 'Full editor</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhAddGuest()">Add guest</button>';
    }
    return ''
      + '<button type="button" class="rd-btn rd-btn--quiet" onclick="rdHhMergeDuplicates()">Merge duplicates</button>'
      + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
      + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdHhFullEditor()">' + fullIco + 'Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdHhExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhAddGuest()">Add guest</button>';
  }

  function uedHouseholdsShellRd() {
    const panel = document.getElementById('panel-households');
    if (!panel) return;
    panel.classList.add('ued-scope', 'households-mockup');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">People</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Households</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="households-stats" aria-label="Households summary"></div>
      <div class="rd-toolbar" id="households-toolbar"></div>
      <div class="rd-bulkbar" id="households-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="households-surface-row">
          <div class="rd-surface__main" id="households-view-host">
            <div class="rd-view" id="hh-view-table" data-hh-view="table"></div>
            <div class="rd-view" id="hh-view-labels" data-hh-view="labels" hidden></div>
            <div class="rd-view" id="hh-view-cards" data-hh-view="cards" hidden></div>
          </div>
          <div id="households-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderHhStats() {
    const host = document.getElementById('households-stats');
    if (!host) return;
    const f = hhFigures();
    const stats = [
      { label: 'Households', value: String(f.households) },
      { label: 'Guests', value: String(f.guests) },
      { label: 'Replied in full', value: String(f.fully) },
      { label: 'No reply', value: String(f.none), attention: f.none ? 'chase' : undefined },
      { label: 'No address', value: String(f.noAddress), attention: f.noAddress ? 'before print' : undefined }
    ];
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, stats);
      return;
    }
    host.innerHTML = stats.map(s =>
      `<div class="m-stat"><div class="m-stat-label">${esc(s.label)}</div><div class="m-stat-val">${esc(s.value)}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._hhUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2"><path d="m6 9 6 6 6-6"/></svg>';
    const shown = field === 'reply' && on
      ? (cur === 'fully' ? 'fully replied' : cur === 'partly' ? 'partly replied' : 'no reply')
      : cur;
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHhCycleFilter('${field}')">${esc(on ? label + ': ' + shown : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHhClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Households view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'labels' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('labels')">Labels</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('cards')">Cards</button>` +
      `</div></div>`;
  }

  function renderHhToolbar() {
    const host = document.getElementById('households-toolbar');
    if (!host) return;
    const mode = window._hhMode || 'table';
    const f = hhFigures();
    let left = '';
    if (mode === 'labels') {
      left = `<button type="button" class="rd-chip" onclick="rdHhCycleLabelSize()">Label size: ${esc(window._hhLabelSize)}</button>` +
        `<span class="rd-ess-toolbar-note">${f.withAddress} addressed · ${f.noAddress} with no address, excluded</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Side', 'side') + filterChip('Reply', 'reply');
    } else {
      left = filterChip('Side', 'side') + filterChip('Reply', 'reply') + filterChip('City', 'city') +
        (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml('Sort by last name', "rdHhOpenSortMenu(this)")
          : '<button type="button" class="rd-chip" onclick="rdHhOpenSortMenu(this)">Sort by last name</button>') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('households') : '');
    }
    host.innerHTML = left + viewSwitchHtml(mode);
  }

  function renderHhBulk() {
    const host = document.getElementById('households-bulk-bar');
    if (!host) return;
    const n = window._hhSel.size;
    if (!n || window._hhMode === 'labels') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('labels')">Print address labels</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('reminder')">Send reminder</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('city')">Set city</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('merge')">Merge selected</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdHhBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._hhMode || 'table';
    ['table', 'labels', 'cards'].forEach(name => {
      const el = document.getElementById('hh-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetHouseholdsView(mode) {
    window._hhMode = (mode === 'cards' || mode === 'labels') ? mode : 'table';
    renderHouseholdsRd();
  }
  function applyHouseholdsRailView(viewId) {
    window._hhRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('households', window._hhRailView);
    renderHouseholdsRd();
  }
  function applyHouseholdsGroupBy(id) {
    window._hhGroupBy = id || 'side';
    renderHouseholdsRd();
  }

  function statusPillHtml(h, card) {
    const label = card ? hhCardStatusLabel(h) : hhStatusLabel(h);
    return `<span class="status-pill" data-pillscheme="${esc(hhStatusScheme(h))}">${esc(label)}</span>`;
  }

  /* ── Table (Master columns: Household · Guests · Replied · Side · Address · City · Status) ── */

  function renderTableView() {
    const host = document.getElementById('hh-view-table');
    if (!host) return;
    const rows = filteredHouseholds();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No households yet — add guests to build one row per household for addressing and RSVP chasing.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdHhAddGuest()">Add guest</button></div>`;
      return;
    }
    const groups = groupHouseholds(rows, window._hhGroupBy || 'side');
    let html = `<div class="rd-table-wrap"><table class="rd-hh-table rd-guest-mini-table"><thead><tr>
      <th style="width:34px"></th>
      <th>Household</th>
      <th class="is-num" style="width:80px">Guests</th>
      <th style="width:100px">Replied</th>
      <th style="width:90px">Side</th>
      <th>Address</th>
      <th style="width:110px">City</th>
      <th style="width:130px">Status</th>
    </tr></thead><tbody>`;
    groups.forEach(g => {
      const guests = g.items.reduce((s, h) => s + (h.members || []).length, 0);
      html += `<tr class="rd-guest-side-banner"><td colspan="8">${esc(g.key)} · ${g.items.length} household${g.items.length === 1 ? '' : 's'} · ${guests} guest${guests === 1 ? '' : 's'}</td></tr>`;
      g.items.forEach(h => {
        const key = h.key;
        const sel = window._hhSel.has(key);
        const addr = hhAddressSummary(h);
        const seats = (h.members || []).length;
        const replied = hhRepliedCount(h);
        const safeKey = String(key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `<tr class="rd-hh-row${sel ? ' is-selected' : ''}" data-hh-key="${esc(key)}" onclick="rdHhOpen('${esc(safeKey)}')">` +
          `<td class="rd-hh-td--check" onclick="event.stopPropagation();rdHhToggleSel('${esc(safeKey)}')">` +
          `<input type="checkbox" class="rd-hh-checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(hhDisplayName(h))}"></td>` +
          `<td><b class="rd-guest-name__primary">${esc(hhDisplayName(h))}</b><div class="rd-guest-name__sub">${esc(hhMembersSubline(h))}</div></td>` +
          `<td class="is-num">${seats}</td>` +
          `<td class="rd-guest-td--muted">${replied} of ${seats}</td>` +
          `<td class="rd-guest-td--muted">${esc(hhSideLabel(h))}</td>` +
          `<td class="rd-guest-td--muted${addr.danger ? ' is-danger' : ''}">${esc(addr.street || addr.text)}</td>` +
          `<td class="rd-guest-td--muted">${esc(hhCity(h) === 'No city' ? '—' : hhCity(h))}</td>` +
          `<td>${statusPillHtml(h, false)}</td></tr>`;
      });
    });
    html += `</tbody></table></div>`;
    host.innerHTML = html;
  }

  /* ── Cards — Household, address, guest count, reply-status chip only ── */

  function renderCardsView() {
    const host = document.getElementById('hh-view-cards');
    if (!host) return;
    host.classList.remove('rd-cardgrid');
    host.classList.add('rd-hh-cards');
    const rows = filteredHouseholds();
    if (!rows.length) {
      host.innerHTML = `<p class="rd-help" style="grid-column:1/-1">No households match this view.</p>`;
      return;
    }
    host.innerHTML = rows.map(h => {
      const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const n = (h.members || []).length;
      return `<article class="rd-hh-card${window._hhSel.has(h.key) ? ' is-selected' : ''}" onclick="rdHhOpen('${esc(safeKey)}')">` +
        `<strong>${esc(hhDisplayName(h))}</strong>` +
        `<p class="rd-hh-card__addr">${esc(hhCardAddress(h))}</p>` +
        `<p class="rd-hh-card__meta">${n} guest${n === 1 ? '' : 's'}</p>` +
        `<div class="rd-hh-card__chip">${statusPillHtml(h, true)}</div>` +
        `</article>`;
    }).join('');
  }

  /* ── Labels ──────────────────────────────────────────────────────────── */

  function renderLabelsView() {
    const host = document.getElementById('hh-view-labels');
    if (!host) return;
    const withAddr = filteredHouseholds().filter(h => h.hasAddress && hhAddressGuest(h));
    if (!withAddr.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No printable labels — every household in this view is missing an address.</p>
        <button type="button" class="rd-btn" onclick="rdHhPrintLabels()">Open print labels</button></div>`;
      return;
    }
    host.innerHTML = `<div class="rd-labelsheet rd-hh-labelsheet">` + withAddr.map(h => {
      const g = hhAddressGuest(h);
      const lines = typeof guestAddressLines === 'function' ? guestAddressLines(g) : [];
      const n = (h.members || []).length;
      const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="rd-labelsheet__label rd-hh-label" onclick="rdHhOpen('${esc(safeKey)}')">` +
        `<strong>${esc(hhDisplayName(h))}</strong>` +
        (lines.length ? `<div class="rd-hh-label__addr">${lines.map(l => esc(l)).join('<br>')}</div>` : '') +
        `<div class="rd-hh-label__count">${n} guest${n === 1 ? '' : 's'}</div>` +
        `</div>`;
    }).join('') + `</div>`;
  }

  /* ── Drawer ──────────────────────────────────────────────────────────── */

  function parkSharedDrawerAway(slot) {
    const shared = document.getElementById('record-drawer');
    if (shared && slot && slot.contains(shared)) {
      const park = document.getElementById('layout') || document.body;
      park.appendChild(shared);
    }
  }

  function field(label, value, opts) {
    opts = opts || {};
    const click = opts.onclick ? ` class="rd-drawer__link" onclick="${opts.onclick}"` : '';
    const muted = opts.muted ? ' class="rd-drawer__field-val--muted"' : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}${muted}>${value == null || value === '' ? '—' : value}</strong></div>`;
  }

  function findHousehold(key) {
    return allHouseholds().find(h => h.key === key) || null;
  }

  function openFirstGuestEditor(h) {
    const guest = (h.members || [])[0];
    if (!guest || !Array.isArray(data.guests)) return false;
    const gi = data.guests.indexOf(guest);
    if (gi < 0) return false;
    if (typeof openRecordEditor === 'function') {
      openRecordEditor('guests', gi);
      return true;
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
      window.covenantShell.openDrawer('guests', gi);
      return true;
    }
    if (typeof rdOpenDrawer === 'function') {
      rdOpenDrawer('guests', gi);
      return true;
    }
    return false;
  }

  function drawerGuestsBody(h) {
    const members = h.members || [];
    const n = members.length;
    let seated = 0;
    const tableCounts = {};
    members.forEach(g => {
      if (typeof guestIsSeated === 'function' ? guestIsSeated(g) : !!g.table) {
        seated++;
        const t = String(g.table || '').trim() || '?';
        tableCounts[t] = (tableCounts[t] || 0) + 1;
      }
    });
    const seatedBits = Object.keys(tableCounts).map(t => {
      const lab = typeof guestTableLabelShort === 'function' ? guestTableLabelShort(t) : ('T' + t);
      return tableCounts[t] + ' at ' + lab;
    }).join(' · ') || '—';
    const list = members.map(g => {
      const seats = hhSeatsNeeded(g);
      const rsvp = hhGuestRsvpLabel(g);
      const right = seats > 1 ? (esc(rsvp) + ' · ' + seats + ' seats') : esc(rsvp);
      return `<div class="rd-hh-drawer-member"><span class="rd-hh-drawer-member__name">${esc(g.name || 'Guest')}</span><span class="rd-hh-drawer-member__rsvp">${right}</span></div>`;
    }).join('');
    return `<p class="rd-drawer__note rd-hh-drawer-lead">This is a group, not a record.<br>The fields below write to the ${n} guest${n === 1 ? '' : 's'} inside it.</p>` +
      `<div class="rd-drawer__section-label">Guests · ${n}</div>` +
      `<div class="rd-hh-drawer-members">${list || '<p class="rd-drawer__note">No members.</p>'}</div>` +
      `<div class="rd-drawer__section-label">Seats needed</div>` +
      field('Total', String(n)) +
      field('Seated', seatedBits) +
      field('Unseated', String(Math.max(0, n - seated)));
  }

  function drawerAddressBody(h) {
    const g = hhAddressGuest(h) || (h.members || [])[0] || {};
    const n = (h.members || []).length;
    const street = String(g.address1 || g.address || '').trim() || '—';
    const city = String(g.city || '').trim() || '—';
    const country = String(g.country || '').trim() || '—';
    const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const std = hhFormatSent(hhInviteField(h, 'saveTheDate'), 'Not sent');
    const inv = hhIsInvited(h)
      ? hhFormatSent(hhInviteField(h, 'inviteSentDate') || 'Sent', 'Sent')
      : 'Not sent';
    const label = hhLabelPrinted(h);
    const thanks = (h.members || []).every(m => m.thankyou) ? 'Sent' : 'Not yet';
    return field('Street', esc(street)) +
      field('City', esc(city)) +
      field('Country', esc(country)) +
      field('Applies to', n + ' guest record' + (n === 1 ? '' : 's')) +
      `<p class="rd-drawer__note">Editing any line here rewrites the address on <b>all ${n === 1 ? 'guest' : n + ' guests'}</b>. To change one person only, edit them on the Guest List instead.</p>` +
      `<div class="rd-drawer__section-label">Used for</div>` +
      field('Save the date', esc(std)) +
      field('Invitation', esc(inv)) +
      field('Address label', esc(label === 'No' ? 'Not printed' : label)) +
      field('Thank-you', esc(thanks)) +
      `<button type="button" class="rd-btn rd-btn--quiet rd-hh-edit-addr" onclick="rdHhEditAddress('${esc(safeKey)}')">Edit address for all ${n}</button>`;
  }

  function drawerInvitationBody(h) {
    const f = hhFigures();
    const std = hhFormatSent(hhInviteField(h, 'saveTheDate'), 'Not sent');
    const inv = hhIsInvited(h)
      ? hhFormatSent(hhInviteField(h, 'inviteSentDate') || 'Sent', 'Sent')
      : 'Not sent';
    const label = hhLabelPrinted(h);
    const pending = h.pending || 0;
    const reminder = pending === 0 ? 'Not needed' : (hhChased(h) ? 'Chased' : 'Due');
    return field('Save the date', esc(std)) +
      field('Invitation', esc(inv)) +
      field('Label printed', esc(label)) +
      field('Reminder', esc(reminder)) +
      `<p class="rd-drawer__note">One envelope, ${(h.members || []).length} guests. The invitation is sent once and the RSVPs come back separately — which is why the household shows “${esc(hhStatusLabel(h))}” and the guests show individual states.</p>` +
      `<div class="rd-drawer__section-label">Across all households</div>` +
      field('Sent', f.invited + ' of ' + f.households) +
      field('Not sent', String(Math.max(0, f.households - f.invited))) +
      field('No address', String(f.noAddress));
  }

  function drawerHistoryBody(h) {
    const name = 'Ama';
    const events = [];
    const label = hhLabelPrinted(h);
    if (label !== 'No') events.push({ when: label.replace(/^Yes\s*·\s*/i, '') || '—', who: name, what: 'Label printed' });
    if (hhIsInvited(h)) {
      const inv = hhInviteField(h, 'inviteSentDate') || '—';
      events.push({ when: String(inv).replace(/^sent\s+/i, '') || '—', who: name, what: 'Invitation sent' });
    }
    const std = hhInviteField(h, 'saveTheDate');
    if (std) events.push({ when: String(std).replace(/^sent\s+/i, '') || '—', who: name, what: 'Save the date sent' });
    events.push({ when: '—', who: name, what: 'Created from ' + (h.members || []).length + ' guests' });
    const list = events.map(e =>
      `<div class="rd-drawer__hist"><strong>${esc(e.when)} · ${esc(e.who)}</strong><div>${esc(e.what)}</div></div>`
    ).join('');
    return `<div class="rd-drawer__section-label">This household</div>` + list +
      `<p class="rd-drawer__note">A household is derived, so its history records only envelope events. Guest-level changes are logged on each guest.</p>`;
  }

  function renderHhDrawer() {
    const slot = document.getElementById('households-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const h = findHousehold(window._hhDrawerKey);
    if (!h) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._hhDrawerTab, 10) || 0));
    const n = (h.members || []).length;
    const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let body = '';
    let primaryLabel = 'Save';
    let primaryAction = `rdHhSaveDrawer('${esc(safeKey)}')`;
    if (tab === 0) body = drawerGuestsBody(h);
    else if (tab === 1) {
      body = drawerAddressBody(h);
      primaryLabel = 'Save to ' + n + ' guest' + (n === 1 ? '' : 's');
      primaryAction = `rdHhEditAddress('${esc(safeKey)}')`;
    } else if (tab === 2) body = drawerInvitationBody(h);
    else body = drawerHistoryBody(h);

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hh-drawer" aria-label="Household">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Household · derived</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdHhCloseDrawer()" aria-label="Close">×</button>` +
      `<h2 class="rd-drawer__title">${esc(hhDisplayName(h))}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="gray">${n} guest${n === 1 ? '' : 's'}</span>` +
      statusPillHtml(h, true) +
      `</div>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdHhSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="${primaryAction}">${esc(primaryLabel)}</button>` +
      `<button type="button" class="rd-btn" onclick="rdHhFullEditor('${esc(safeKey)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdHhOpen(key) {
    const h = findHousehold(key);
    if (!h) return;
    window._hhDrawerKey = key;
    window._hhDrawerTab = 0;
    renderHhDrawer();
  }
  function rdHhCloseDrawer() {
    window._hhDrawerKey = null;
    const slot = document.getElementById('households-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdHhSetDrawerTab(i) {
    window._hhDrawerTab = i;
    renderHhDrawer();
  }
  function rdHhToggleSel(key) {
    if (window._hhSel.has(key)) window._hhSel.delete(key);
    else window._hhSel.add(key);
    renderHhBulk();
    const mode = window._hhMode || 'table';
    if (mode === 'table') renderTableView();
    else if (mode === 'cards') renderCardsView();
  }
  function rdHhBulkClear() {
    window._hhSel.clear();
    renderHhBulk();
    renderHouseholdsRd();
  }
  function selectedRows() {
    return allHouseholds().filter(h => window._hhSel.has(h.key));
  }

  function mergeHouseholdKeys(keys) {
    if (!keys || keys.length < 2) return 0;
    const rows = allHouseholds().filter(h => keys.includes(h.key));
    if (rows.length < 2) return 0;
    const target = rows[0];
    const targetName = String(target.members[0] && (target.members[0].household || target.name) || target.name).trim();
    const addrG = hhAddressGuest(target);
    rows.slice(1).forEach(h => {
      (h.members || []).forEach(g => {
        g.household = targetName;
        if (addrG) {
          if (addrG.address1 || addrG.address) {
            g.address1 = addrG.address1 || addrG.address;
            if (addrG.address) g.address = addrG.address;
          }
          if (addrG.address2) g.address2 = addrG.address2;
          if (addrG.city) g.city = addrG.city;
          if (addrG.state) g.state = addrG.state;
          if (addrG.zip) g.zip = addrG.zip;
          if (addrG.country) g.country = addrG.country;
        }
      });
    });
    if (typeof save === 'function') save();
    return rows.length;
  }

  function rdHhBulk(action) {
    const rows = selectedRows();
    if (!rows.length && action !== 'labels') return;
    if (action === 'labels') {
      rdHhPrintLabels();
      return;
    }
    if (action === 'reminder') {
      rows.forEach(h => (h.members || []).forEach(g => {
        if (h.pending) g.chased = true;
      }));
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') showToast('Reminder marked · ' + rows.length + ' household' + (rows.length === 1 ? '' : 's'));
      rdHhBulkClear();
      return;
    }
    if (action === 'city') {
      const city = prompt('Set city for ' + rows.length + ' household' + (rows.length === 1 ? '' : 's') + ':', '');
      if (city == null) return;
      rows.forEach(h => (h.members || []).forEach(g => { g.city = city; }));
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') showToast('City set · ' + rows.length);
      rdHhBulkClear();
      return;
    }
    if (action === 'merge') {
      if (rows.length < 2) {
        if (typeof showToast === 'function') showToast('Select at least two households to merge.', 'warn');
        return;
      }
      const n = mergeHouseholdKeys(rows.map(h => h.key));
      if (typeof showToast === 'function') showToast('Merged ' + n + ' households into one envelope');
      rdHhBulkClear();
    }
  }

  function rdHhMergeDuplicates() {
    const rows = allHouseholds();
    const byAddr = new Map();
    rows.forEach(h => {
      if (!h.hasAddress) return;
      const g = hhAddressGuest(h);
      if (!g) return;
      const key = [
        String(g.address1 || g.address || '').trim().toLowerCase(),
        String(g.city || '').trim().toLowerCase(),
        String(g.zip || '').trim().toLowerCase()
      ].join('|');
      if (!key || key === '||') return;
      if (!byAddr.has(key)) byAddr.set(key, []);
      byAddr.get(key).push(h.key);
    });
    let merged = 0;
    byAddr.forEach(keys => {
      if (keys.length > 1) merged += mergeHouseholdKeys(keys);
    });
    if (typeof showToast === 'function') {
      showToast(merged
        ? ('Merged duplicate addresses · ' + merged + ' households touched')
        : 'No duplicate addresses found');
    }
    renderHouseholdsRd();
  }

  function rdHhEditAddress(key) {
    const h = findHousehold(key);
    if (!h) return;
    const g0 = hhAddressGuest(h) || (h.members || [])[0] || {};
    const a1 = prompt('Street / address line 1:', String(g0.address1 || g0.address || ''));
    if (a1 == null) return;
    const city = prompt('City:', String(g0.city || ''));
    if (city == null) return;
    const country = prompt('Country:', String(g0.country || ''));
    if (country == null) return;
    (h.members || []).forEach(g => {
      g.address1 = a1;
      g.city = city;
      if (country) g.country = country;
    });
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') {
      showToast('Address saved to ' + (h.members || []).length + ' guest' + ((h.members || []).length === 1 ? '' : 's'));
    }
    renderHouseholdsRd();
  }

  function rdHhSaveDrawer(key) {
    if (typeof showToast === 'function') showToast('Household is derived — guest fields already saved');
    renderHhDrawer();
  }

  function rdHhAddGuest() {
    if (typeof showPanel === 'function') showPanel('guests');
    if (typeof addGuestRow === 'function') addGuestRow();
    else if (typeof showToast === 'function') showToast('Open Guest List to add a guest');
  }

  function rdHhFullEditor(key) {
    const h = key ? findHousehold(key) : (window._hhDrawerKey ? findHousehold(window._hhDrawerKey) : null);
    if (h && openFirstGuestEditor(h)) return;
    const rows = selectedRows();
    if (rows[0] && openFirstGuestEditor(rows[0])) return;
    const first = filteredHouseholds()[0];
    if (first && openFirstGuestEditor(first)) return;
    if (typeof showPanel === 'function') showPanel('guests');
  }

  function rdHhPrintLabels() {
    if (typeof openAddressLabels === 'function') openAddressLabels(true);
    else if (typeof showToast === 'function') showToast('Address labels are not available yet.', 'warn');
  }

  function rdHhExport() {
    const rows = filteredHouseholds();
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Households', rows.map(h => ({
        household: hhDisplayName(h),
        guests: (h.members || []).length,
        replied: hhRepliedCount(h) + ' of ' + (h.members || []).length,
        side: hhSideLabel(h),
        address: hhAddressSummary(h).street || hhAddressSummary(h).text,
        city: hhCity(h),
        status: hhStatusLabel(h),
        members: (h.members || []).map(g => g.name).join('; ')
      })));
      return;
    }
    if (typeof exportAddressCSV === 'function') exportAddressCSV();
  }

  function rdHhCycleFilter(field) {
    const options = { all: true };
    allHouseholds().forEach(h => {
      if (field === 'side') options[hhSideLabel(h)] = true;
      else if (field === 'reply') options[hhReplyBucket(h)] = true;
      else if (field === 'city') options[hhCity(h)] = true;
    });
    const list = Object.keys(options);
    const cur = (window._hhUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._hhUiFilters[field] = list[(i + 1) % list.length];
    renderHouseholdsRd();
  }
  function rdHhClearFilter(field) {
    window._hhUiFilters[field] = 'all';
    renderHouseholdsRd();
  }
  function rdHhCycleLabelSize() {
    const sizes = ['Avery 5160', 'Avery 5163', 'A4 L7160'];
    const i = sizes.indexOf(window._hhLabelSize);
    window._hhLabelSize = sizes[(i + 1) % sizes.length];
    renderHouseholdsRd();
  }
  function rdHhOpenSortMenu(btn) {
    const opts = [
      { value: 'surname', label: 'Sort by last name' },
      { value: 'az', label: 'A–Z' },
      { value: 'za', label: 'Z–A' },
      { value: 'guests', label: 'Guest count' },
      { value: 'city', label: 'City' }
    ];
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, window._hhSort || 'surname', function (val) {
        window._hhSort = val || 'surname';
        renderHouseholdsRd();
      });
      return;
    }
    if (typeof window.rdHhOpenSort === 'function') window.rdHhOpenSort(btn);
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderHouseholdsRd() {
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('households', window._hhRailView || 'all');
      if (saved) window._hhRailView = saved;
    }
    uedHouseholdsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('households');
    applyViewMode();
    renderHhStats();
    renderHhToolbar();
    renderHhBulk();
    const mode = window._hhMode || 'table';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'labels') renderLabelsView();
    else renderTableView();
    renderHhDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'households'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('households');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('households');
  }

  window.uedHouseholdsShell = uedHouseholdsShellRd;
  window.uedHouseholdsShellRd = uedHouseholdsShellRd;
  window.renderHouseholdsPage = renderHouseholdsRd;
  window.renderHouseholdsRd = renderHouseholdsRd;
  window.renderHouseholds = renderHouseholdsRd;
  window.rdSetHouseholdsView = rdSetHouseholdsView;
  window.applyHouseholdsRailView = applyHouseholdsRailView;
  window.applyHouseholdsGroupBy = applyHouseholdsGroupBy;
  window.hhRailCounts = hhRailCounts;
  window.hhFigures = hhFigures;
  window.rdHhOpen = rdHhOpen;
  window.rdHhCloseDrawer = rdHhCloseDrawer;
  window.rdHhSetDrawerTab = rdHhSetDrawerTab;
  window.rdHhToggleSel = rdHhToggleSel;
  window.rdHhBulkClear = rdHhBulkClear;
  window.rdHhBulk = rdHhBulk;
  window.rdHhAddGuest = rdHhAddGuest;
  window.rdHhAdd = rdHhAddGuest;
  window.rdHhPrintLabels = rdHhPrintLabels;
  window.rdHhExport = rdHhExport;
  window.rdHhCycleFilter = rdHhCycleFilter;
  window.rdHhClearFilter = rdHhClearFilter;
  window.rdHhMergeDuplicates = rdHhMergeDuplicates;
  window.rdHhEditAddress = rdHhEditAddress;
  window.rdHhSaveDrawer = rdHhSaveDrawer;
  window.rdHhFullEditor = rdHhFullEditor;
  window.rdHhCycleLabelSize = rdHhCycleLabelSize;
  window.rdHhOpenSortMenu = rdHhOpenSortMenu;

  function hookHhPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.households = function () { renderHouseholdsRd(); };
    }
  }
  hookHhPanelRenderer();
  var _showPanelHh = window.showPanel;
  if (typeof _showPanelHh === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelHh.call(window, id, forceOpen);
      hookHhPanelRenderer();
      return out;
    };
  }
})();
