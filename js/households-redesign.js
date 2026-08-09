/* Households — All.dc #14b + Views batch 28 (Table | Cards | Labels).
   Derived from guests via guestAggregatedHouseholds() — never a separate array.
   Rail: All · Invited · Fully replied · Partly replied · No reply
   Group by: Side · City · Reply status
   Drawer: Guests · Address · Invitation · History (or open first guest drawer).
   Guests — the people inside the envelope, folding the old overview fields
     (side, member count, reply status) into the header chips.
   Address — one address, every guest; editing here rewrites all of them.
   Invitation — the envelope/RSVP aggregate: invite status, sent date, and
     all-replied vs per-guest reply states.
   History — envelope-level events only; guest-level changes log on the guest. */
(function () {
  'use strict';

  window._hhMode = window._hhMode || 'table';
  window._hhRailView = window._hhRailView || 'all';
  window._hhGroupBy = window._hhGroupBy || 'side';
  window._hhUiFilters = window._hhUiFilters || { side: 'all', reply: 'all', city: 'all' };
  window._hhDrawerKey = window._hhDrawerKey || null;
  window._hhDrawerTab = window._hhDrawerTab || 0;
  window._hhSel = window._hhSel instanceof Set ? window._hhSel : new Set();

  const DRAWER_TABS = ['Guests', 'Address', 'Invitation', 'History'];
  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

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

  function hhCity(h) {
    for (const g of (h.members || [])) {
      const c = String(g.city || '').trim();
      if (c) return c;
    }
    return 'No city';
  }

  function hhAddressGuest(h) {
    return (h.members || []).find(g =>
      typeof guestHasAddress === 'function' ? guestHasAddress(g) : !!(g.address1 || g.address || g.city));
  }

  function hhAddressSummary(h) {
    const g = hhAddressGuest(h);
    if (!g) return { text: 'No address on file', danger: true };
    const lines = typeof guestAddressLines === 'function' ? guestAddressLines(g) : [];
    if (!lines.length) return { text: 'Address on file', danger: false };
    const short = lines[0] + (lines[1] ? (', ' + String(lines[1]).split(',')[0]) : '');
    return { text: short, danger: false };
  }

  function hhGuestSeatsForMember(g) {
    if (typeof guestExtra === 'function') {
      const extra = guestExtra(g) || {};
      return 1 + (extra.adults || 0) + (extra.kids || 0);
    }
    return 1 + (g.plusone ? 1 : 0) + (parseInt(g.children, 10) || 0);
  }

  function hhSeatsSummary(h) {
    const members = h.members || [];
    const seatedMembers = members.filter(g => !!g.table);
    const tables = new Set(seatedMembers.map(g => String(g.table)));
    let seatedLabel = String(seatedMembers.length);
    if (seatedMembers.length && tables.size === 1) {
      const tbl = typeof guestTableLabelShort === 'function'
        ? guestTableLabelShort(seatedMembers[0].table)
        : ('Table ' + seatedMembers[0].table);
      seatedLabel += ' at ' + tbl;
    }
    return {
      total: members.length,
      seated: seatedMembers.length,
      seatedLabel: seatedLabel,
      unseated: members.length - seatedMembers.length
    };
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

  function hhFigures() {
    const rows = allHouseholds();
    const invited = rows.filter(hhIsInvited);
    const fully = rows.filter(h => hhReplyBucket(h) === 'fully');
    const partly = rows.filter(h => hhReplyBucket(h) === 'partly');
    const none = rows.filter(h => hhReplyBucket(h) === 'none');
    const noAddr = rows.filter(h => !h.hasAddress);
    const seats = rows.reduce((s, h) => s + (h.members || []).length, 0);
    const confirmed = rows.reduce((s, h) => s + (h.accepted || 0), 0);
    return {
      households: rows.length,
      invited: invited.length,
      fully: fully.length,
      partly: partly.length,
      none: none.length,
      noAddress: noAddr.length,
      seats: seats,
      confirmed: confirmed
    };
  }

  function hhRailCounts() {
    const f = hhFigures();
    return {
      all: f.households,
      invited: f.invited,
      fully: f.fully,
      partly: f.partly,
      none: f.none
    };
  }

  function matchesRail(h) {
    const v = window._hhRailView || 'all';
    if (!v || v === 'all') return true;
    if (v === 'invited') return hhIsInvited(h);
    if (v === 'fully') return hhReplyBucket(h) === 'fully';
    if (v === 'partly') return hhReplyBucket(h) === 'partly';
    if (v === 'none') return hhReplyBucket(h) === 'none';
    return true;
  }

  function matchesFilters(h) {
    if (!matchesRail(h)) return false;
    const ui = window._hhUiFilters || {};
    if (ui.side && ui.side !== 'all') {
      const side = typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : 'Both';
      if (String(side).toLowerCase() !== String(ui.side).toLowerCase()) return false;
    }
    if (ui.reply && ui.reply !== 'all' && hhReplyBucket(h) !== ui.reply) return false;
    if (ui.city && ui.city !== 'all' && hhCity(h).toLowerCase() !== String(ui.city).toLowerCase()) return false;
    return true;
  }

  function filteredHouseholds() {
    return allHouseholds().filter(matchesFilters);
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

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    return ''
      + '<button type="button" class="rd-btn" onclick="rdHhPrintLabels()">Print labels</button>'
      + '<button type="button" class="rd-btn" onclick="rdHhExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhAdd()">+ Add household</button>';
  }

  function uedHouseholdsShellRd() {
    const panel = document.getElementById('panel-households');
    if (!panel) return;
    panel.classList.add('ued-scope', 'households-mockup');
    if (panel.dataset.uedShell === 'hh-rd14b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'hh-rd14b';
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
            <div class="rd-view" id="hh-view-cards" data-hh-view="cards" hidden></div>
            <div class="rd-view" id="hh-view-labels" data-hh-view="labels" hidden></div>
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
    const mode = window._hhMode || 'table';
    let stats;
    if (mode === 'labels') {
      stats = [
        { label: 'Households', value: String(f.households) },
        { label: 'With address', value: String(f.households - f.noAddress) },
        { label: 'Skipped · no address', value: String(f.noAddress), attention: f.noAddress ? 'blank labels skipped' : undefined },
        { label: 'Invited', value: String(f.invited) },
        { label: 'Print class', value: 'A · labels' }
      ];
    } else if (mode === 'cards') {
      stats = [
        { label: 'Households', value: String(f.households) },
        { label: 'Invited', value: String(f.invited) },
        { label: 'Fully replied', value: String(f.fully) },
        { label: 'Partly replied', value: String(f.partly), attention: f.partly ? 'chase' : undefined },
        { label: 'Seats', value: String(f.seats) }
      ];
    } else {
      stats = [
        { label: 'Households', value: String(f.households) },
        { label: 'Invited', value: String(f.invited) },
        { label: 'Fully replied', value: String(f.fully) },
        { label: 'Partly replied', value: String(f.partly), attention: f.partly ? 'needs a nudge' : undefined },
        { label: 'No address', value: String(f.noAddress), attention: f.noAddress ? 'before print' : undefined }
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
    const ui = window._hhUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdHhCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdHhClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderHhToolbar() {
    const host = document.getElementById('households-toolbar');
    if (!host) return;
    const mode = window._hhMode || 'table';
    let left = '';
    if (mode === 'labels') {
      left = `<span class="rd-ess-toolbar-note">Skips households with no address</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Side', 'side') + filterChip('Reply', 'reply') +
        `<span class="rd-ess-toolbar-note">One card per envelope</span>`;
    } else {
      left = filterChip('Side', 'side') + filterChip('Reply', 'reply') + filterChip('City', 'city') +
        `<span class="rd-ess-toolbar-note">Sort by surname · Columns · 6 of 6 · Row height · compact</span>`;
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Households view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'labels' ? ' is-active' : ''}" onclick="rdSetHouseholdsView('labels')">Labels</button>` +
      `</div></div>`;
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
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('address')">Set address</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('invited')">Mark invited</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdHhBulk('labels')">Print labels</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdHhBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._hhMode || 'table';
    ['table', 'cards', 'labels'].forEach(name => {
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

  /* ── Table ───────────────────────────────────────────────────────────── */

  function invPillHtml(h) {
    const pill = typeof guestHouseholdInvitationPill === 'function'
      ? guestHouseholdInvitationPill(h)
      : { scheme: 'gray', label: 'Not sent' };
    return `<span class="status-pill" data-pillscheme="${esc(pill.scheme)}">${esc(pill.label)}</span>`;
  }

  function tableCellHtml(h) {
    const disp = typeof guestHouseholdTableDisplay === 'function'
      ? guestHouseholdTableDisplay(h)
      : { html: '—', amber: false };
    return `<span class="${disp.amber ? 'is-amber' : ''}">${disp.html}</span>`;
  }

  function renderTableView() {
    const host = document.getElementById('hh-view-table');
    if (!host) return;
    const rows = filteredHouseholds();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No households yet — add guests to build one row per household for addressing and RSVP chasing.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdHhAdd()">+ Add household</button></div>`;
      return;
    }
    const groups = groupHouseholds(rows, window._hhGroupBy || 'side');
    let html = `<div class="rd-table-wrap"><table class="rd-guest-mini-table rd-guest-hh-table"><thead><tr>
      <th style="width:34px"></th><th>Household</th><th>Members</th><th class="is-num" style="width:90px">Seats</th>
      <th>Address</th><th style="width:150px">Invitation</th><th style="width:110px">Table</th>
    </tr></thead><tbody>`;
    groups.forEach(g => {
      const guests = g.items.reduce((s, h) => s + (h.members || []).length, 0);
      html += `<tr class="rd-guest-side-banner"><td colspan="7">${esc(g.key)} · ${g.items.length} household${g.items.length === 1 ? '' : 's'} · ${guests} guest${guests === 1 ? '' : 's'}</td></tr>`;
      g.items.forEach(h => {
        const key = h.key;
        const sel = window._hhSel.has(key);
        const addr = hhAddressSummary(h);
        const seats = (h.members || []).length;
        const membersLbl = seats + ' guest' + (seats === 1 ? '' : 's') + ' · ' + hhReplyLabel(h).toLowerCase();
        const safeKey = String(key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `<tr class="rd-hh-row${sel ? ' is-selected' : ''}" data-hh-key="${esc(key)}" onclick="rdHhOpen('${esc(safeKey)}')">` +
          `<td class="rd-hh-td--check" onclick="event.stopPropagation();rdHhToggleSel('${esc(safeKey)}')">` +
          `<input type="checkbox" class="rd-hh-checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(hhDisplayName(h))}"></td>` +
          `<td><b class="rd-guest-name__primary">${esc(hhDisplayName(h))}</b><div class="rd-guest-name__sub">${esc(hhMembersSubline(h))}</div></td>` +
          `<td class="rd-guest-td--muted">${esc(membersLbl)}</td>` +
          `<td class="is-num">${seats}</td>` +
          `<td class="rd-guest-td--muted${addr.danger ? ' is-danger' : ''}">${esc(addr.text)}</td>` +
          `<td>${invPillHtml(h)}</td>` +
          `<td>${tableCellHtml(h)}</td></tr>`;
      });
    });
    html += `</tbody></table></div>` +
      `<button type="button" class="rd-ess-addbtn" onclick="rdHhAdd()"><span>+</span> Create a household from selected guests</button>`;
    host.innerHTML = html;
  }

  /* ── Cards ───────────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('hh-view-cards');
    if (!host) return;
    host.classList.add('rd-cardgrid');
    const rows = filteredHouseholds();
    if (!rows.length) {
      host.innerHTML = `<p class="rd-help" style="grid-column:1/-1">No households match this view.</p>`;
      return;
    }
    host.innerHTML = rows.map(h => {
      const side = typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : 'Both';
      const addr = hhAddressSummary(h);
      const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<article class="rd-cardgrid__card${window._hhSel.has(h.key) ? ' is-selected' : ''}" onclick="rdHhOpen('${esc(safeKey)}')">` +
        `<div class="rd-cardgrid__title">${esc(hhDisplayName(h))}</div>` +
        `<div class="rd-cardgrid__meta">${(h.members || []).length} guest${(h.members || []).length === 1 ? '' : 's'} · ${esc(side)}</div>` +
        `<div class="rd-cardgrid__meta">${esc(hhReplyLabel(h))} · ${esc(addr.text)}</div>` +
        `<div class="rd-cardgrid__meta">${invPillHtml(h)}</div>` +
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
    host.innerHTML = `<div class="rd-labelsheet">` + withAddr.map(h => {
      const g = hhAddressGuest(h);
      const lines = typeof guestAddressLines === 'function' ? guestAddressLines(g) : [];
      const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="rd-labelsheet__label" onclick="rdHhOpen('${esc(safeKey)}')">` +
        `<strong>${esc(hhDisplayName(h))}</strong><br>` +
        lines.map(l => esc(l)).join('<br>') +
        `</div>`;
    }).join('') + `</div>` +
      `<span class="rd-table-foot ued-soft">${withAddr.length} label${withAddr.length === 1 ? '' : 's'} · households without an address were skipped</span>`;
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

  function findHousehold(key) {
    return allHouseholds().find(h => h.key === key) || null;
  }

  /* Depth · drawer quick actions (§7.1) — Call/Email/WhatsApp for whichever
     member carries the household's contact details (the address guest, or
     failing that the first member). */
  function hhQuickActions(h) {
    const g = hhAddressGuest(h) || (h.members || [])[0] || {};
    const digits = String(g.phone || '').replace(/[^0-9+]/g, '');
    const email = String(g.email || '').trim().replace(/'/g, '');
    return [
      { label: 'Call', onclick: digits ? "location.href='tel:" + digits + "'" : '', title: digits ? '' : 'No phone on file' },
      { label: 'Email', onclick: email ? "location.href='mailto:" + email + "'" : '', title: email ? '' : 'No email on file' },
      { label: 'WhatsApp', onclick: digits ? "window.open('https://wa.me/" + digits.replace(/^\+/, '') + "','_blank')" : '', title: digits ? '' : 'No phone on file' }
    ];
  }

  function openFirstGuestDrawer(h) {
    const guest = (h.members || [])[0];
    if (!guest || !Array.isArray(data.guests)) return false;
    const gi = data.guests.indexOf(guest);
    if (gi < 0) return false;
    window._hhDrawerKey = null;
    const slot = document.getElementById('households-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
      window.covenantShell.openDrawer('guests', gi);
      return true;
    }
    if (typeof rdOpenDrawer === 'function') {
      rdOpenDrawer('guests', gi);
      return true;
    }
    if (typeof openRecordEditor === 'function') {
      openRecordEditor('guests', gi);
      return true;
    }
    return false;
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
    const addrG = hhAddressGuest(h);
    const lines = addrG && typeof guestAddressLines === 'function' ? guestAddressLines(addrG) : [];
    const members = h.members || [];
    const rdDepth = typeof RdDepth !== 'undefined' ? RdDepth : null;
    let body = '';
    if (tab === 0) {
      /* Guests — the people inside the envelope. This is a group, not a record of its own. */
      const seats = hhSeatsSummary(h);
      const memberRows = members.map(g => {
        const memberSeats = hhGuestSeatsForMember(g);
        return { left: g.name || 'Guest', right: (g.rsvp || 'Pending') + (memberSeats > 1 ? ' · ' + memberSeats + ' seats' : '') };
      });
      body = `<p class="rd-drawer__note"><b>This is a group, not a record.</b> The fields below write to the ${members.length} guest${members.length === 1 ? '' : 's'} inside it.</p>` +
        (rdDepth && rdDepth.relatedList
          ? rdDepth.relatedList('Guests · ' + members.length, memberRows, { id: 'hh-guests', empty: 'No members.' })
          : (`<div class="rd-drawer__note" style="font-weight:600;color:#23211c;margin-top:6px">Guests · ${members.length}</div>` +
            (memberRows.map(r => field(r.left, r.right)).join('') || `<p class="rd-drawer__note">No members.</p>`))) +
        `<div class="rd-drawer__note" style="font-weight:600;color:#23211c;margin-top:10px">Seats needed</div>` +
        field('Total', String(seats.total)) +
        field('Seated', seats.seatedLabel) +
        field('Unseated', String(seats.unseated));
    } else if (tab === 1) {
      /* Address — one address, every guest. Editing it rewrites the whole household. */
      body = lines.length
        ? lines.map(l => field('Line', l)).join('') +
          field('Applies to', members.length + ' guest record' + (members.length === 1 ? '' : 's')) +
          `<p class="rd-drawer__note">Editing any line here rewrites the address on all ${members.length} guest${members.length === 1 ? '' : 's'}. To change one person only, edit them on the Guest List instead.</p>`
        : (rdDepth && rdDepth.emptyField ? rdDepth.emptyField('Address') : `<p class="rd-drawer__note">No address on file. Add one before printing labels.</p>`) +
          `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhSetAddressForKey('${esc(String(h.key).replace(/'/g, "\\'"))}')">Set address</button>`;
    } else if (tab === 2) {
      /* Invitation — the envelope/RSVP aggregate: one envelope, several separate RSVPs. */
      const invPill = typeof guestHouseholdInvitationPill === 'function' ? guestHouseholdInvitationPill(h) : { label: '—' };
      const sentRaw = typeof guestHouseholdInviteSentRaw === 'function' ? guestHouseholdInviteSentRaw(h) : '';
      const bucket = hhReplyBucket(h);
      body = field('Invitation', invPill.label) +
        field('Sent', sentRaw && typeof guestFormatInviteSentPill === 'function' ? guestFormatInviteSentPill(sentRaw) : (hhIsInvited(h) ? 'Sent' : 'Not sent')) +
        `<div class="rd-drawer__note" style="font-weight:600;color:#23211c;margin-top:6px">RSVPs · ${members.length}</div>` +
        (members.map(g => field(g.name || 'Guest', g.rsvp || 'Pending')).join('') || `<p class="rd-drawer__note">No members.</p>`) +
        (bucket === 'fully'
          ? `<p class="rd-drawer__note">All ${members.length} guest${members.length === 1 ? '' : 's'} have replied.</p>`
          : `<p class="rd-drawer__note">One envelope, ${members.length} separate RSVP${members.length === 1 ? '' : 's'} — the invitation is sent once and each reply comes back on its own guest record.</p>`);
    } else {
      /* History — envelope-level events only; guest-level changes are logged on each guest. */
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Created from ${members.length} guest${members.length === 1 ? '' : 's'}</div></div>` +
        (hhIsInvited(h)
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Marked invited</div></div>`
          : `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Not invited yet</div></div>`) +
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>${esc(hhReplyLabel(h))}</div></div>` +
        `<p class="rd-drawer__note">A household is derived, so its history records only envelope events. Guest-level changes are logged on each guest.</p>`;
    }
    const safeKey = String(h.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const list = filteredHouseholds();
    const pos = list.findIndex(x => x.key === h.key);
    const headerExtras = rdDepth && rdDepth.drawerHeaderExtras
      ? rdDepth.drawerHeaderExtras({
        avatarName: hhDisplayName(h),
        position: pos >= 0 ? (pos + 1) + ' of ' + list.length : '',
        onPrev: pos > 0 ? 'rdHhDrawerNav(-1)' : '',
        onNext: pos >= 0 && pos < list.length - 1 ? 'rdHhDrawerNav(1)' : '',
        quickActions: hhQuickActions(h)
      })
      : '';
    const provenance = rdDepth && rdDepth.provenance
      ? rdDepth.provenance({
        created: 'Derived from ' + members.length + ' guest' + (members.length === 1 ? '' : 's'),
        modified: hhReplyLabel(h)
      })
      : '';
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-hh-drawer" aria-label="Household">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Household · derived</div>` +
      `<h2 class="rd-drawer__title">${esc(hhDisplayName(h))}</h2>` +
      `<div class="rd-drawer__chips">` +
      `<span class="status-pill" data-pillscheme="blue">${members.length} guest${members.length === 1 ? '' : 's'}</span>` +
      `<span class="status-pill" data-pillscheme="gold">${esc(hhReplyLabel(h))}</span>` +
      `</div>` +
      headerExtras +
      `<button type="button" class="rd-drawer__close" onclick="rdHhCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdHhSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}${provenance}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdHhOpenGuest('${esc(safeKey)}')">Open guest</button>` +
      `<button type="button" class="rd-btn" onclick="rdHhCloseDrawer()">Close</button>` +
      `</div></aside>`;
    if (rdDepth && rdDepth.decorateDrawer) rdDepth.decorateDrawer(slot);
  }
  function rdHhDrawerNav(delta) {
    const list = filteredHouseholds();
    const idx = list.findIndex(x => x.key === window._hhDrawerKey);
    if (idx < 0) return;
    const next = idx + delta;
    if (next < 0 || next >= list.length) return;
    window._hhDrawerKey = list[next].key;
    renderHhDrawer();
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdHhOpen(key) {
    const h = findHousehold(key);
    if (!h) return;
    if (openFirstGuestDrawer(h)) return;
    window._hhDrawerKey = key;
    window._hhDrawerTab = 0;
    renderHhDrawer();
  }
  function rdHhOpenGuest(key) {
    const h = findHousehold(key);
    if (h) openFirstGuestDrawer(h);
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
  function rdHhSetAddressForKey(key) {
    window._hhSel = new Set([key]);
    rdHhBulk('address');
  }
  function rdHhBulk(action) {
    const rows = selectedRows();
    if (!rows.length && action !== 'labels') return;
    if (action === 'labels') {
      if (typeof openAddressLabels === 'function') openAddressLabels(true);
      return;
    }
    if (action === 'invited') {
      rows.forEach(h => (h.members || []).forEach(g => { g.invited = true; }));
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') showToast('Marked invited · ' + rows.length);
      rdHhBulkClear();
      return;
    }
    if (action === 'address') {
      const a1 = prompt('Set address line 1 for ' + rows.length + ' household' + (rows.length === 1 ? '' : 's') + ':', '');
      if (a1 == null) return;
      const city = prompt('City (optional):', '') || '';
      rows.forEach(h => (h.members || []).forEach(g => {
        g.address1 = a1;
        if (city) g.city = city;
      }));
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') showToast('Address set · ' + rows.length);
      rdHhBulkClear();
    }
  }
  async function rdHhAdd() {
    if (typeof guestCreateHouseholdFromSelectedGuests === 'function') {
      const ids = typeof cwpSelectedIds === 'function' ? cwpSelectedIds('guests') : [];
      if (ids && ids.length) {
        await guestCreateHouseholdFromSelectedGuests();
        renderHouseholdsRd();
        return;
      }
    }
    const name = prompt('Name the new household:', '');
    if (!name) return;
    if (!window.data) window.data = {};
    if (!Array.isArray(data.guests)) data.guests = [];
    const row = { name: name, household: name, rsvp: '', invited: false, side: 'Bride' };
    if (typeof ensureRowId === 'function') ensureRowId(row, 'guests');
    else if (typeof nextRecordId === 'function') row._id = nextRecordId('guests');
    data.guests.push(row);
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') showToast('Created household · ' + name);
    renderHouseholdsRd();
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
        members: (h.members || []).map(g => g.name).join('; '),
        seats: (h.members || []).length,
        side: typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : '',
        city: hhCity(h),
        reply: hhReplyLabel(h),
        address: hhAddressSummary(h).text,
        invited: hhIsInvited(h) ? 'Yes' : 'No'
      })));
      return;
    }
    if (typeof exportAddressCSV === 'function') exportAddressCSV();
  }
  function rdHhCycleFilter(field) {
    const options = { all: true };
    allHouseholds().forEach(h => {
      if (field === 'side') {
        const s = typeof guestHouseholdSide === 'function' ? guestHouseholdSide(h) : 'Both';
        options[s] = true;
      } else if (field === 'reply') {
        options[hhReplyBucket(h)] = true;
      } else if (field === 'city') {
        options[hhCity(h)] = true;
      }
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
  window.rdHhOpenGuest = rdHhOpenGuest;
  window.rdHhCloseDrawer = rdHhCloseDrawer;
  window.rdHhSetDrawerTab = rdHhSetDrawerTab;
  window.rdHhDrawerNav = rdHhDrawerNav;
  window.rdHhToggleSel = rdHhToggleSel;
  window.rdHhBulkClear = rdHhBulkClear;
  window.rdHhBulk = rdHhBulk;
  window.rdHhAdd = rdHhAdd;
  window.rdHhPrintLabels = rdHhPrintLabels;
  window.rdHhExport = rdHhExport;
  window.rdHhCycleFilter = rdHhCycleFilter;
  window.rdHhClearFilter = rdHhClearFilter;
  window.rdHhSetAddressForKey = rdHhSetAddressForKey;

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
