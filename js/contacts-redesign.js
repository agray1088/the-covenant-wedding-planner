/* Contacts — All.dc #14c + Views batch 28 (Table | Cards | Day-of sheet).
   Derived via masterContactRows() — manual edits → data.contacts; sourced rows open source panel.
   Rail: Everyone · Vendors · Wedding party · Family · Day-of only
   Group by: Role · Side · Company
   Drawer: Contact · Reach · Source · History */
(function () {
  'use strict';

  window._ctMode = window._ctMode || 'table';
  window._ctRailView = window._ctRailView || 'everyone';
  window._ctGroupBy = window._ctGroupBy || 'role';
  window._ctUiFilters = window._ctUiFilters || { role: 'all', side: 'all', reachable: 'all' };
  window._ctDrawerId = window._ctDrawerId || null;
  window._ctDrawerTab = window._ctDrawerTab || 0;
  window._ctSel = window._ctSel instanceof Set ? window._ctSel : new Set();

  const DRAWER_TABS = ['Contact', 'Reach', 'Source', 'History'];
  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function rawRows() {
    return typeof masterContactRows === 'function' ? masterContactRows() : [];
  }

  function unify(row, i) {
    const phone = String(row.phone || '').trim();
    const email = String(row.email || '').trim();
    const role = String(row.role || row.category || 'Contact').trim() || 'Contact';
    const company = String(row.company || '').trim();
    const source = String(row._source || 'Manual').trim() || 'Manual';
    const name = String(row.name || company || 'Untitled').trim() || 'Untitled';
    const side = String(row.side || row.category || '').trim();
    const dayof = !!(row.emergency || row.dayOf || row.dayof ||
      /day.?of|emergency|coordinator|venue|officiant/i.test([role, row.category, row.notes].join(' ')));
    const id = source === 'Manual' && row._manualIndex != null
      ? ('manual:' + row._manualIndex)
      : (source + ':' + (row._sourceIndex != null ? row._sourceIndex : i) + ':' + name.toLowerCase());
    return {
      id: id,
      index: i,
      row: row,
      name: name,
      role: role,
      phone: phone,
      email: email,
      company: company || '—',
      companyRaw: company,
      source: source,
      sourcePage: row._sourcePage || '',
      sourceKey: row._sourceKey || '',
      sourceIndex: row._sourceIndex,
      manualIndex: row._manualIndex,
      side: /bride/i.test(side) ? 'Bride' : (/groom/i.test(side) ? 'Groom' : (side || '—')),
      dayof: dayof,
      emergency: !!row.emergency,
      notes: String(row.notes || '').trim(),
      lastContact: String(row.lastContact || '').trim(),
      hasPhone: !!phone,
      hasEmail: !!email,
      neither: !phone && !email,
      isManual: source === 'Manual',
      isVendor: source === 'Vendors' || /vendor/i.test(String(row.category || '')),
      isParty: source === 'Wedding Party',
      isFamily: /family|parent|mother|father|sibling|aunt|uncle|cousin|in-?law/i.test([role, row.category, company].join(' '))
        || (source === 'Guest List' && /family|parent/i.test(role))
    };
  }

  function allContacts() {
    return rawRows().map(unify);
  }

  function ctFigures() {
    const rows = allContacts();
    const withPhone = rows.filter(r => r.hasPhone);
    const withEmail = rows.filter(r => r.hasEmail);
    const neither = rows.filter(r => r.neither);
    const dayof = rows.filter(r => r.dayof);
    return {
      contacts: rows.length,
      withPhone: withPhone.length,
      withEmail: withEmail.length,
      neither: neither.length,
      dayof: dayof.length,
      vendors: rows.filter(r => r.isVendor).length,
      party: rows.filter(r => r.isParty).length,
      family: rows.filter(r => r.isFamily).length
    };
  }

  function ctRailCounts() {
    const f = ctFigures();
    return {
      everyone: f.contacts,
      vendors: f.vendors,
      party: f.party,
      family: f.family,
      dayof: f.dayof
    };
  }

  function matchesRail(x) {
    const v = window._ctRailView || 'everyone';
    if (!v || v === 'everyone' || v === 'all') return true;
    if (v === 'vendors') return x.isVendor;
    if (v === 'party') return x.isParty;
    if (v === 'family') return x.isFamily;
    if (v === 'dayof') return x.dayof;
    return true;
  }

  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const ui = window._ctUiFilters || {};
    if (ui.role && ui.role !== 'all' && x.role.toLowerCase() !== String(ui.role).toLowerCase()) return false;
    if (ui.side && ui.side !== 'all' && String(x.side).toLowerCase() !== String(ui.side).toLowerCase()) return false;
    if (ui.reachable && ui.reachable !== 'all') {
      if (ui.reachable === 'phone' && !x.hasPhone) return false;
      if (ui.reachable === 'email' && !x.hasEmail) return false;
      if (ui.reachable === 'neither' && !x.neither) return false;
      if (ui.reachable === 'both' && !(x.hasPhone && x.hasEmail)) return false;
    }
    return true;
  }

  function filteredContacts() {
    return allContacts().filter(matchesFilters);
  }

  function groupContacts(rows, by) {
    const map = new Map();
    rows.forEach(x => {
      let key = x.role;
      if (by === 'side') key = x.side === '—' ? 'No side' : (x.side === 'Bride' ? "Bride's side" : (x.side === 'Groom' ? "Groom's side" : x.side));
      else if (by === 'company') key = x.companyRaw || 'No company';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(x);
    });
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === 'No company' || a === 'No side') return 1;
      if (b === 'No company' || b === 'No side') return -1;
      return a.localeCompare(b);
    });
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._ctMode || 'table';
    if (mode === 'dayof') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdCtPrintSheet()">Print sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdCtExport()">Export CSV</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd()">+ Add contact</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdCtPrintSheet()">Print sheet</button>'
      + '<button type="button" class="rd-btn" onclick="rdCtExport()">Export CSV</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd()">+ Add contact</button>';
  }

  function uedContactsShellRd() {
    const panel = document.getElementById('panel-contacts');
    if (!panel) return;
    panel.classList.add('ued-scope', 'contacts-mockup');
    if (panel.dataset.uedShell === 'ct-rd14c') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'ct-rd14c';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">People</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Contacts</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="contacts-stats" aria-label="Contacts summary"></div>
      <div class="rd-toolbar" id="contacts-toolbar"></div>
      <div class="rd-bulkbar" id="contacts-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="contacts-surface-row">
          <div class="rd-surface__main" id="contacts-view-host">
            <div class="rd-view" id="ct-view-table" data-ct-view="table"></div>
            <div class="rd-view" id="ct-view-cards" data-ct-view="cards" hidden></div>
            <div class="rd-view" id="ct-view-dayof" data-ct-view="dayof" hidden></div>
          </div>
          <div id="contacts-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderCtStats() {
    const host = document.getElementById('contacts-stats');
    if (!host) return;
    const f = ctFigures();
    const mode = window._ctMode || 'table';
    let stats;
    if (mode === 'dayof') {
      stats = [
        { label: 'Day-of sheet', value: String(f.dayof) },
        { label: 'With phone', value: String(f.withPhone) },
        { label: 'Neither', value: String(f.neither), attention: f.neither ? 'unreachable' : undefined },
        { label: 'Vendors', value: String(f.vendors) },
        { label: 'Print class', value: 'A · working' }
      ];
    } else if (mode === 'cards') {
      stats = [
        { label: 'Contacts', value: String(f.contacts) },
        { label: 'With phone', value: String(f.withPhone) },
        { label: 'With email', value: String(f.withEmail) },
        { label: 'Day-of sheet', value: String(f.dayof) },
        { label: 'Neither', value: String(f.neither), attention: f.neither ? 'add a number' : undefined }
      ];
    } else {
      stats = [
        { label: 'Contacts', value: String(f.contacts) },
        { label: 'With phone', value: String(f.withPhone) },
        { label: 'With email', value: String(f.withEmail) },
        { label: 'Neither', value: String(f.neither), attention: f.neither ? 'unreachable' : undefined },
        { label: 'Day-of sheet', value: String(f.dayof) }
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
    const ui = window._ctUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCtCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCtClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderCtToolbar() {
    const host = document.getElementById('contacts-toolbar');
    if (!host) return;
    const mode = window._ctMode || 'table';
    let left = '';
    if (mode === 'dayof') {
      left = `<span class="rd-ess-toolbar-note">Phone and role only · grouped by role</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Role', 'role') + filterChip('Reachable', 'reachable') +
        `<span class="rd-ess-toolbar-note">One card per person</span>`;
    } else {
      left = filterChip('Role', 'role') + filterChip('Side', 'side') + filterChip('Reachable', 'reachable') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by name', "rdContactsOpenSort(this)") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('contacts') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Contacts view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetContactsView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetContactsView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'dayof' ? ' is-active' : ''}" onclick="rdSetContactsView('dayof')">Day-of sheet</button>` +
      `</div></div>`;
  }

  function renderCtBulk() {
    const host = document.getElementById('contacts-bulk-bar');
    if (!host) return;
    const n = window._ctSel.size;
    if (!n || window._ctMode === 'dayof') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtBulk('dayof')">Add to day-of sheet</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtBulk('role')">Set role</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtPrintSheet()">Print sheet</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdCtBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._ctMode || 'table';
    ['table', 'cards', 'dayof'].forEach(name => {
      const el = document.getElementById('ct-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetContactsView(mode) {
    window._ctMode = (mode === 'cards' || mode === 'dayof') ? mode : 'table';
    renderContactsRd();
  }
  function applyContactsRailView(viewId) {
    window._ctRailView = viewId || 'everyone';
    if (typeof setSavedView === 'function') setSavedView('contacts', window._ctRailView);
    renderContactsRd();
  }
  function applyContactsGroupBy(id) {
    window._ctGroupBy = id || 'role';
    renderContactsRd();
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function sourcePill(x) {
    const scheme = x.isManual ? 'gold' : (x.isVendor ? 'forest' : 'muted');
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(x.source)}</span>`;
  }

  function renderTableView() {
    const host = document.getElementById('ct-view-table');
    if (!host) return;
    const rows = filteredContacts();
    if (!rows.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No contacts yet — add a manual contact or they will appear from guests, vendors, and the wedding party.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd()">+ Add contact</button></div>`;
      return;
    }
    const groups = groupContacts(rows, window._ctGroupBy || 'role');
    let html = `<div class="rd-table-wrap"><table class="rd-guest-mini-table"><thead><tr>
      <th style="width:34px"></th><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Company</th><th>Source</th>
    </tr></thead><tbody>`;
    groups.forEach(g => {
      html += `<tr class="rd-guest-side-banner"><td colspan="7">${esc(g.key)} · ${g.items.length}</td></tr>`;
      g.items.forEach(x => {
        const sel = window._ctSel.has(x.id);
        const safeId = String(x.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `<tr class="${sel ? 'is-selected' : ''}" onclick="rdCtOpen('${esc(safeId)}')">` +
          `<td onclick="event.stopPropagation();rdCtToggleSel('${esc(safeId)}')">` +
          `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.name)}"></td>` +
          `<td><b class="rd-guest-name__primary">${esc(x.name)}</b>` +
          (x.dayof ? `<div class="rd-guest-name__sub">Day-of sheet</div>` : '') +
          `</td>` +
          `<td>${esc(x.role)}</td>` +
          `<td class="${x.hasPhone ? '' : 'rd-guest-td--quiet'}">${esc(x.phone || '—')}</td>` +
          `<td class="${x.hasEmail ? '' : 'rd-guest-td--quiet'}">${esc(x.email || '—')}</td>` +
          `<td>${esc(x.company)}</td>` +
          `<td>${sourcePill(x)}</td></tr>`;
      });
    });
    html += `</tbody></table></div>` +
      `<button type="button" class="rd-ess-addbtn" onclick="rdCtAdd()"><span>+</span> Add a contact</button>`;
    host.innerHTML = html;
  }

  /* ── Cards ───────────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('ct-view-cards');
    if (!host) return;
    host.classList.add('rd-cardgrid');
    const rows = filteredContacts();
    if (!rows.length) {
      host.innerHTML = `<p class="rd-help" style="grid-column:1/-1">No contacts match this view.</p>`;
      return;
    }
    host.innerHTML = rows.map(x => {
      const safeId = String(x.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const reach = x.hasPhone ? x.phone : (x.hasEmail ? x.email : 'No reach');
      return `<article class="rd-cardgrid__card${window._ctSel.has(x.id) ? ' is-selected' : ''}" onclick="rdCtOpen('${esc(safeId)}')">` +
        `<div class="rd-cardgrid__title">${esc(x.name)}</div>` +
        `<div class="rd-cardgrid__meta">${esc(x.role)}${x.companyRaw ? ' · ' + esc(x.companyRaw) : ''}</div>` +
        `<div class="rd-cardgrid__meta">${esc(reach)}</div>` +
        `<div class="rd-cardgrid__meta">${sourcePill(x)}${x.dayof ? ' · day-of' : ''}</div>` +
        `</article>`;
    }).join('');
  }

  /* ── Day-of sheet ────────────────────────────────────────────────────── */

  function dayOfRows() {
    const rows = filteredContacts().filter(x => x.dayof || window._ctRailView === 'dayof');
    if (window._ctRailView === 'dayof') return filteredContacts();
    return rows.length ? rows : filteredContacts().filter(x => x.isVendor || x.isParty || x.emergency);
  }

  function renderDayOfView() {
    const host = document.getElementById('ct-view-dayof');
    if (!host) return;
    const rows = dayOfRows();
    const groups = groupContacts(rows, 'role');
    const couple = (data.setup && (data.setup.bride || data.setup.groom))
      ? [data.setup.bride, data.setup.groom].filter(Boolean).join(' & ')
      : 'Wedding day';
    let body = '';
    if (!rows.length) {
      body = `<p>No day-of contacts yet. Mark emergency contacts or filter to Day-of only.</p>`;
    } else {
      groups.forEach(g => {
        body += `<h3 style="margin:18px 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6b645d">${esc(g.key)}</h3>`;
        body += `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>
          <th style="text-align:left;padding:6px 0;border-bottom:1px solid #d9cfba">Name</th>
          <th style="text-align:left;padding:6px 0;border-bottom:1px solid #d9cfba">Role</th>
          <th style="text-align:left;padding:6px 0;border-bottom:1px solid #d9cfba">Phone</th>
        </tr></thead><tbody>`;
        g.items.forEach(x => {
          const safeId = String(x.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          body += `<tr onclick="rdCtOpen('${esc(safeId)}')" style="cursor:pointer">` +
            `<td style="padding:7px 0;border-bottom:1px solid #eee">${esc(x.name)}</td>` +
            `<td style="padding:7px 0;border-bottom:1px solid #eee">${esc(x.role)}</td>` +
            `<td style="padding:7px 0;border-bottom:1px solid #eee">${esc(x.phone || '—')}</td></tr>`;
        });
        body += `</tbody></table>`;
      });
    }
    host.innerHTML = `<div class="rd-printsheet"><div class="rd-printsheet__paper">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a7e6b;font-weight:700">Day-of contacts</div>
      <h2 style="margin:6px 0 4px;font-family:Georgia,serif;font-weight:500">${esc(couple)}</h2>
      <p style="margin:0 0 16px;color:#6b645d;font-size:13px">${rows.length} contact${rows.length === 1 ? '' : 's'} · phone and role only</p>
      ${body}
      <div style="margin-top:28px;display:flex;justify-content:space-between;font-size:11px;color:#8a7e6b">
        <span>Working sheet — not a guest list</span>
        <span>Printed ${esc(new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }))}</span>
      </div>
    </div></div>`;
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
  function findContact(id) {
    return allContacts().find(x => x.id === id) || null;
  }

  function openSourceRecord(x) {
    if (!x) return false;
    if (x.isManual && x.manualIndex != null && typeof openRecordEditor === 'function') {
      openRecordEditor('contacts', x.manualIndex);
      return true;
    }
    if (x.sourceKey && x.sourceIndex != null) {
      if (typeof showPanel === 'function' && x.sourcePage) showPanel(x.sourcePage);
      if (typeof window.covenantShell !== 'undefined' && window.covenantShell.openDrawer) {
        window.covenantShell.openDrawer(x.sourceKey, x.sourceIndex);
        return true;
      }
      if (typeof openRecordEditor === 'function') {
        openRecordEditor(x.sourceKey, x.sourceIndex);
        return true;
      }
    }
    return false;
  }

  function renderCtDrawer() {
    const slot = document.getElementById('contacts-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = findContact(window._ctDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._ctDrawerTab, 10) || 0));
    let body = '';
    if (tab === 0) {
      body = field('Name', x.name) +
        field('Role', x.role) +
        field('Company', x.company) +
        field('Side', x.side) +
        field('On day-of sheet', x.dayof ? 'Yes' : 'No') +
        `<p class="rd-drawer__note">${x.isManual
          ? 'A manual contact — edits save to the Contacts list.'
          : 'A derived contact. The phone number lives on the original ' + x.source + ' record.'}</p>`;
    } else if (tab === 1) {
      body = field('Phone', x.phone || '—') +
        field('Email', x.email || '—') +
        field('Last contact', x.lastContact || '—') +
        (x.notes ? `<div class="rd-ess-drawer__noteblock">${esc(x.notes)}</div>` : '') +
        `<p class="rd-drawer__note">${x.neither ? 'Neither phone nor email — unreachable until one is added on the source record.' : 'Reach details are mirrored from the source record.'}</p>`;
    } else if (tab === 2) {
      const openFn = `rdCtOpenSource('${esc(String(x.id).replace(/'/g, "\\'"))}')`;
      body = field('Source', x.source, openFn) +
        field('Source page', x.sourcePage || 'contacts') +
        field('Kind', x.isManual ? 'Manual row' : 'Projected row') +
        `<p class="rd-drawer__note">${x.isManual
          ? 'Edit here or in the full editor — both write to data.contacts.'
          : 'Open the source panel to change this person.'}</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="${openFn}">Open source</button>`;
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Listed from ${esc(x.source)}</div></div>` +
        (x.lastContact
          ? `<div class="rd-drawer__hist"><strong>${esc(x.lastContact)}</strong> · Planner<div>Last contact noted</div></div>`
          : '') +
        (x.dayof
          ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>On the day-of sheet</div></div>`
          : '') +
        `<p class="rd-drawer__note">History is provisional until contact audit tracking lands.</p>`;
    }
    const safeId = String(x.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-ct-drawer" aria-label="Contact">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Contact · derived</div>` +
      `<h2 class="rd-drawer__title">${esc(x.name)}</h2>` +
      `<div class="rd-drawer__chips">` +
      sourcePill(x) +
      (x.dayof ? `<span class="status-pill" data-pillscheme="coral">Day-of</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdCtCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdCtSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtOpenSource('${esc(safeId)}')">Open source</button>` +
      `<button type="button" class="rd-btn" onclick="rdCtCloseDrawer()">Close</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdCtOpen(id) {
    window._ctDrawerId = id;
    window._ctDrawerTab = 0;
    renderCtDrawer();
  }
  function rdCtCloseDrawer() {
    window._ctDrawerId = null;
    const slot = document.getElementById('contacts-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdCtSetDrawerTab(i) {
    window._ctDrawerTab = i;
    renderCtDrawer();
  }
  function rdCtOpenSource(id) {
    const x = findContact(id);
    if (!x) return;
    window._ctDrawerId = null;
    const slot = document.getElementById('contacts-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (!openSourceRecord(x) && typeof showToast === 'function') {
      showToast('Could not open the source record.', 'warn');
    }
  }
  function rdCtToggleSel(id) {
    if (window._ctSel.has(id)) window._ctSel.delete(id);
    else window._ctSel.add(id);
    renderCtBulk();
    const mode = window._ctMode || 'table';
    if (mode === 'table') renderTableView();
    else if (mode === 'cards') renderCardsView();
  }
  function rdCtBulkClear() {
    window._ctSel.clear();
    renderCtBulk();
    renderContactsRd();
  }
  function selectedContacts() {
    return allContacts().filter(x => window._ctSel.has(x.id));
  }
  function rdCtBulk(action) {
    const rows = selectedContacts();
    if (!rows.length) return;
    if (action === 'dayof') {
      rows.forEach(x => {
        if (x.isManual && x.manualIndex != null && data.contacts[x.manualIndex]) {
          data.contacts[x.manualIndex].emergency = true;
        } else if (x.row) {
          x.row.emergency = true;
        }
      });
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') showToast('Added to day-of sheet · ' + rows.length);
      rdCtBulkClear();
      return;
    }
    if (action === 'role') {
      const role = prompt('Set role for ' + rows.length + ' contact' + (rows.length === 1 ? '' : 's') + ':', rows[0].role || '');
      if (!role) return;
      rows.forEach(x => {
        if (x.isManual && x.manualIndex != null && data.contacts[x.manualIndex]) {
          data.contacts[x.manualIndex].role = role;
        } else if (x.row) {
          x.row.role = role;
        }
      });
      if (typeof save === 'function') save();
      rdCtBulkClear();
    }
  }
  function rdCtAdd() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.contacts)) data.contacts = [];
    const name = prompt('Contact name:', '');
    if (!name) return;
    const role = prompt('Role (optional):', 'Contact') || 'Contact';
    const phone = prompt('Phone (optional):', '') || '';
    const email = prompt('Email (optional):', '') || '';
    const row = {
      name: name,
      role: role,
      category: role,
      phone: phone,
      email: email,
      company: '',
      emergency: false,
      lastContact: '',
      notes: ''
    };
    if (typeof ensureRowId === 'function') ensureRowId(row, 'contacts');
    else if (typeof nextRecordId === 'function') row._id = nextRecordId('contacts');
    data.contacts.push(row);
    if (typeof save === 'function') save();
    if (typeof showToast === 'function') showToast('Added contact · ' + name);
    renderContactsRd();
  }
  function rdCtPrintSheet() {
    window._ctMode = 'dayof';
    renderContactsRd();
    setTimeout(function () {
      if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
    }, 60);
  }
  function rdCtExport() {
    if (typeof logExportContacts === 'function') {
      logExportContacts();
      return;
    }
    const rows = filteredContacts();
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Contacts', rows.map(x => ({
        name: x.name, role: x.role, phone: x.phone, email: x.email,
        company: x.companyRaw, source: x.source, dayof: x.dayof ? 'Yes' : 'No'
      })));
    }
  }
  function rdCtCycleFilter(field) {
    const options = { all: true };
    if (field === 'reachable') {
      options.phone = true;
      options.email = true;
      options.both = true;
      options.neither = true;
    } else {
      allContacts().forEach(x => {
        if (field === 'role' && x.role) options[x.role] = true;
        if (field === 'side' && x.side && x.side !== '—') options[x.side] = true;
      });
    }
    const list = Object.keys(options);
    const cur = (window._ctUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._ctUiFilters[field] = list[(i + 1) % list.length];
    renderContactsRd();
  }
  function rdCtClearFilter(field) {
    window._ctUiFilters[field] = 'all';
    renderContactsRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderContactsRd() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.contacts)) data.contacts = [];
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('contacts', window._ctRailView || 'everyone');
      if (saved) window._ctRailView = saved;
    }
    uedContactsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('contacts');
    applyViewMode();
    renderCtStats();
    renderCtToolbar();
    renderCtBulk();
    const mode = window._ctMode || 'table';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'dayof') renderDayOfView();
    else renderTableView();
    renderCtDrawer();
    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'contacts'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('contacts');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('contacts');
  }

  window.uedContactsShell = uedContactsShellRd;
  window.uedContactsShellRd = uedContactsShellRd;
  window.renderContactsPage = renderContactsRd;
  window.renderContactsRd = renderContactsRd;
  window.renderContacts = renderContactsRd;
  window.rdSetContactsView = rdSetContactsView;
  window.applyContactsRailView = applyContactsRailView;
  window.applyContactsGroupBy = applyContactsGroupBy;
  window.ctRailCounts = ctRailCounts;
  window.ctFigures = ctFigures;
  window.rdCtOpen = rdCtOpen;
  window.rdCtCloseDrawer = rdCtCloseDrawer;
  window.rdCtSetDrawerTab = rdCtSetDrawerTab;
  window.rdCtOpenSource = rdCtOpenSource;
  window.rdCtToggleSel = rdCtToggleSel;
  window.rdCtBulkClear = rdCtBulkClear;
  window.rdCtBulk = rdCtBulk;
  window.rdCtAdd = rdCtAdd;
  window.rdCtPrintSheet = rdCtPrintSheet;
  window.rdCtExport = rdCtExport;
  window.rdCtCycleFilter = rdCtCycleFilter;
  window.rdCtClearFilter = rdCtClearFilter;

  function hookCtPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.contacts = function () { renderContactsRd(); };
    }
  }
  hookCtPanelRenderer();
  var _showPanelCt = window.showPanel;
  if (typeof _showPanelCt === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelCt.call(window, id, forceOpen);
      hookCtPanelRenderer();
      return out;
    };
  }
})();
