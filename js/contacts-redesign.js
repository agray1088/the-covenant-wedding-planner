/* Contacts — Master s22 / 14c
   Derived from guests + vendors (and party) — this page stores nothing of its own
   except who calls whom (reaches / escalates), written back to the source record.
   Views: Table · Day-of sheet · Cards
   Rail: Everyone · Day-of numbers · Vendors · Wedding party · Family · No number
   Group by: Role · Side · On the day-of sheet
   Drawer tabs: Contact · Reaches · Day-of · Source
   Primary: Add contact (creates a guest or a vendor). */
(function () {
  'use strict';

  window._ctMode = window._ctMode || 'table';
  window._ctRailView = window._ctRailView || 'everyone';
  window._ctGroupBy = window._ctGroupBy || 'role';
  window._ctUiFilters = window._ctUiFilters || { role: 'all', side: 'all', dayof: 'all' };
  window._ctSort = window._ctSort || 'role';
  window._ctDrawerId = window._ctDrawerId || null;
  window._ctDrawerTab = window._ctDrawerTab || 0;
  window._ctSel = window._ctSel instanceof Set ? window._ctSel : new Set();

  const DRAWER_TABS = ['Contact', 'Reaches', 'Day-of', 'Source'];
  const SHELL_VER = 'ct-rd14c-s22';
  const COL_SCOPE = 'contacts';
  const CT_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'contact', label: 'Contact' },
    { key: 'role', label: 'Role', width: '170px' },
    { key: 'phone', label: 'Phone', width: '150px' },
    { key: 'email', label: 'Email', width: '210px' },
    { key: 'reaches', label: 'Reaches', width: '170px' },
    { key: 'dayof', label: 'Day-of', width: '110px' },
    { key: 'source', label: 'Source', width: '130px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(COL_SCOPE, CT_COLUMNS.slice(), function () {
      renderContactsRd();
    });
  }

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

  function jsId(id) {
    return String(id == null ? '' : id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function rawRows() {
    return typeof masterContactRows === 'function' ? masterContactRows() : [];
  }

  function liveRecord(row) {
    if (!row || !window.data) return null;
    if (row._source === 'Manual' && row._manualIndex != null && Array.isArray(data.contacts)) {
      return data.contacts[row._manualIndex] || null;
    }
    const key = row._sourceKey;
    const idx = row._sourceIndex;
    if (key && idx != null && Array.isArray(data[key])) return data[key][idx] || null;
    return null;
  }

  function setup() {
    return (window.data && data.setup) || {};
  }

  function coupleFirst(which) {
    const s = setup();
    const n = which === 'groom' ? s.groom : s.bride;
    const first = String(n || '').trim().split(/\s+/)[0];
    return first || (which === 'groom' ? 'Groom' : 'Bride');
  }

  function coupleLine() {
    const s = setup();
    const names = [s.bride, s.groom].filter(Boolean).join(' & ') || 'Wedding day';
    const raw = s.weddingDate || s.date || '';
    if (!raw) return names;
    const d = typeof humanDate === 'function'
      ? humanDate(raw, { day: 'numeric', month: 'short', year: 'numeric' })
      : raw;
    return d && d !== '—' ? (names + ' · ' + d) : names;
  }

  function firstName(name) {
    return String(name || '').trim().split(/\s+/)[0] || '';
  }

  function shortPerson(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return parts[0] || '';
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }

  function partyNameSet() {
    const set = new Set();
    (typeof safeArray === 'function' ? safeArray(data.party) : (data.party || [])).forEach(p => {
      if (p && p.name) set.add(String(p.name).trim().toLowerCase());
    });
    return set;
  }

  function plannerContact(rows) {
    return rows.find(x => /planner|coordinator/i.test(x.role)) || null;
  }

  function displayNameFrom(row, live) {
    const src = String(row._source || '');
    if (src === 'Vendors') {
      const company = String((live && live.name) || row.company || '').trim();
      const contact = String((live && live.contact) || row.name || '').trim();
      if (company && contact && company.toLowerCase() !== contact.toLowerCase()) {
        if (/office|coordinator|owner|sales|team|manager|boutique|agent|front desk/i.test(contact)) {
          return company;
        }
        return company + ' · ' + firstName(contact);
      }
      return company || contact || 'Untitled';
    }
    return String(row.name || (live && live.name) || '').trim() || 'Untitled';
  }

  function roleFrom(row, live) {
    if (live && live.role) return String(live.role).trim();
    if (row._source === 'Vendors' && live && live.cat) return String(live.cat).trim();
    return String(row.role || row.category || 'Contact').trim() || 'Contact';
  }

  function sideFrom(row, live) {
    const raw = String((live && (live.side || live.group)) || row.side || row.category || '').trim();
    if (/bride/i.test(raw) && !/groom/i.test(raw)) return 'Bride';
    if (/groom/i.test(raw) && !/bride/i.test(raw)) return 'Groom';
    if (/both/i.test(raw)) return 'Both';
    if (typeof partyMemberSide === 'function' && row._source === 'Wedding Party' && live) {
      const s = partyMemberSide(live);
      if (s === 'Bride' || s === 'Groom') return s;
    }
    return raw && !/^guest|vendor|wedding party|appointment|travel|transport|location|other$/i.test(raw)
      ? raw
      : '—';
  }

  function unify(row, i, partyNames) {
    const live = liveRecord(row);
    const phone = String((live && live.phone) || row.phone || '').trim();
    const email = String((live && live.email) || row.email || '').trim();
    const role = roleFrom(row, live);
    const company = String((live && (live.name || live.company || live.household)) || row.company || '').trim();
    const source = String(row._source || 'Manual').trim() || 'Manual';
    const name = displayNameFrom(row, live);
    const side = sideFrom(row, live);
    const isVendor = source === 'Vendors' || /vendor/i.test(String(row.category || ''));
    const isParty = source === 'Wedding Party'
      || /maid of honou?r|best man|bridesmaid|groomsman|flower girl|page boy|usher/i.test(role)
      || partyNames.has(String(row.name || '').trim().toLowerCase());
    const isFamily = !!(live && live.family)
      || /family|parent|mother|father|sibling|aunt|uncle|cousin|in-?law|grand/i.test([role, row.category, row.notes, (live && live.notes) || ''].join(' '));
    const explicitSheet = live && (live.onSheet === true || live.dayOf === true || live.emergency === true
      || row.emergency === true || row.dayOf === true || row.onSheet === true);
    const explicitOff = live && (live.onSheet === false || live.dayOf === false);
    const booked = !!(live && (/booked|paid|complete/i.test(String(live.status || '')) || live.contract));
    const dayRole = /planner|coordinator|venue|officiant|pastor|transport|mc\b/i.test(role);
    let dayof = false;
    if (explicitOff) dayof = false;
    else if (explicitSheet) dayof = true;
    else if (phone && (isVendor && booked || isParty || dayRole)) dayof = true;

    const verifiedRaw = (live && (live.phoneVerified || live.verifiedOn || live.verified)) || row.phoneVerified || '';
    const verified = verifiedRaw === true ? 'yes' : String(verifiedRaw || '').trim();

    const id = source === 'Manual' && row._manualIndex != null
      ? ('manual:' + row._manualIndex)
      : (source + ':' + (row._sourceIndex != null ? row._sourceIndex : i) + ':' + name.toLowerCase());

    return {
      id: id,
      index: i,
      row: row,
      live: live,
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
      side: side,
      dayof: dayof,
      emergency: !!(live && live.emergency) || !!row.emergency,
      notes: String((live && live.notes) || row.notes || '').trim(),
      lastContact: String((live && live.lastContact) || row.lastContact || '').trim(),
      hasPhone: !!phone,
      hasEmail: !!email,
      neither: !phone && !email,
      isManual: source === 'Manual',
      isVendor: isVendor,
      isParty: isParty,
      isFamily: isFamily,
      verified: verified,
      reachesRaw: String((live && (live.reaches || live.reachesTo)) || row.reaches || '').trim(),
      escalatesRaw: String((live && live.escalatesTo) || row.escalatesTo || '').trim(),
      onSiteRaw: String((live && (live.onSiteFrom || live.arrive || live.arrival || live.callTime)) || row.onSiteFrom || '').trim(),
      dayOfOrder: live && live.dayOfOrder != null ? Number(live.dayOfOrder) : (row.dayOfOrder != null ? Number(row.dayOfOrder) : null)
    };
  }

  function allContacts() {
    const partyNames = partyNameSet();
    const rows = rawRows().map((r, i) => unify(r, i, partyNames));
    const planner = plannerContact(rows);
    rows.forEach(x => {
      x.reaches = deriveReaches(x, planner);
      x.reachesShort = shortReaches(x.reaches);
      x.escalatesTo = deriveEscalates(x);
      x.onSiteFrom = x.onSiteRaw || '';
      x.roleFamily = roleFamilyOf(x);
      x.sourceKind = sourceKindOf(x);
      x.verifiedLabel = verifiedLabel(x);
    });
    return rows;
  }

  function deriveReaches(x, planner) {
    if (x.reachesRaw) return x.reachesRaw;
    if (/planner|coordinator/i.test(x.role)) return 'Everyone';
    if (x.isVendor && planner) return shortPerson(planner.name) || firstName(planner.name);
    if (x.isVendor) return 'Both';
    if (/officiant|pastor/i.test(x.role)) return 'Both';
    if (x.side === 'Bride') return coupleFirst('bride');
    if (x.side === 'Groom') return coupleFirst('groom');
    if (x.side === 'Both') return 'Both';
    if (x.isParty) return coupleFirst('bride');
    return '—';
  }

  function shortReaches(val) {
    const v = String(val || '').trim();
    if (!v || v === '—' || /^(everyone|both)$/i.test(v)) return v;
    if (v.length <= 12 && !/\s/.test(v)) return v;
    return shortPerson(v) || v;
  }

  function deriveEscalates(x) {
    if (x.escalatesRaw) return x.escalatesRaw;
    if (/^everyone$/i.test(x.reaches) || /planner|coordinator/i.test(x.role)) {
      return 'Nobody — they are the top';
    }
    if (!x.reaches || x.reaches === '—') return '—';
    return x.reaches;
  }

  function roleFamilyOf(x) {
    if (x.isParty && !/mc\b|transport|officiant|planner/i.test(x.role)) return 'party';
    if (x.isVendor || /planner|venue|cater|photo|video|film|band|dj|floral|officiant|pastor|transport|coordinator|mc\b/i.test(x.role)) {
      return 'day';
    }
    if (x.isParty) return 'party';
    return 'family';
  }

  function sourceKindOf(x) {
    if (x.isVendor) return 'Vendor';
    if (x.isManual) return 'Typed';
    return 'Guest';
  }

  function verifiedLabel(x) {
    if (!x.verified || x.verified === 'no') return '';
    if (x.verified === 'yes') return 'Yes';
    const d = typeof humanDate === 'function'
      ? humanDate(x.verified, { day: 'numeric', month: 'short' })
      : x.verified;
    return d && d !== '—' ? ('Yes · ' + d) : 'Yes';
  }

  function isVerified(x) {
    return !!(x.verified && x.verified !== 'no');
  }

  function sheetPrintedLabel() {
    const raw = (data && (data.contactSheetPrinted || (data.setup && data.setup.contactSheetPrinted))) || '';
    if (!raw) return '';
    if (typeof humanDate === 'function') {
      const d = humanDate(raw, { day: 'numeric', month: 'short' });
      return d && d !== '—' ? d : String(raw);
    }
    return String(raw);
  }

  function ctFigures() {
    const rows = allContacts();
    const onSheet = rows.filter(r => r.dayof);
    const withPhone = rows.filter(r => r.hasPhone);
    return {
      contacts: rows.length,
      withPhone: withPhone.length,
      withEmail: rows.filter(r => r.hasEmail).length,
      neither: rows.filter(r => r.neither).length,
      nonumber: rows.filter(r => !r.hasPhone).length,
      dayof: onSheet.length,
      onSheet: onSheet.length,
      vendors: rows.filter(r => r.isVendor).length,
      party: rows.filter(r => r.isParty).length,
      family: rows.filter(r => r.isFamily).length,
      verified: rows.filter(r => isVerified(r) && r.hasPhone).length,
      sheetVerified: onSheet.filter(r => isVerified(r)).length,
      sheetUnverified: onSheet.filter(r => !isVerified(r)).length,
      sheetWithPhone: onSheet.filter(r => r.hasPhone).length,
      sheetVendors: onSheet.filter(r => r.isVendor).length,
      sheetParty: onSheet.filter(r => r.isParty).length,
      sheetPlanner: onSheet.filter(r => /planner|coordinator/i.test(r.role)).length,
      sheetFromVendors: onSheet.filter(r => r.isVendor).length,
      sheetFromGuests: onSheet.filter(r => !r.isVendor && !r.isManual).length,
      sheetTyped: onSheet.filter(r => r.isManual).length,
      printed: sheetPrintedLabel()
    };
  }

  function ctRailCounts() {
    const f = ctFigures();
    return {
      everyone: f.contacts,
      dayof: f.dayof,
      vendors: f.vendors,
      party: f.party,
      family: f.family,
      nonumber: f.nonumber
    };
  }

  function matchesRail(x) {
    const v = window._ctRailView || 'everyone';
    if (!v || v === 'everyone' || v === 'all') return true;
    if (v === 'vendors') return x.isVendor;
    if (v === 'party') return x.isParty;
    if (v === 'family') return x.isFamily;
    if (v === 'dayof') return x.dayof;
    if (v === 'nonumber') return !x.hasPhone;
    return true;
  }

  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    const ui = window._ctUiFilters || {};
    if (ui.role && ui.role !== 'all' && x.role.toLowerCase() !== String(ui.role).toLowerCase()) return false;
    if (ui.side && ui.side !== 'all' && String(x.side).toLowerCase() !== String(ui.side).toLowerCase()) return false;
    if (ui.dayof && ui.dayof !== 'all') {
      if (ui.dayof === 'on sheet' && !x.dayof) return false;
      if (ui.dayof === 'not on sheet' && x.dayof) return false;
      if (ui.dayof === 'no number' && x.hasPhone) return false;
    }
    return true;
  }

  function sortContacts(rows) {
    const by = window._ctSort || 'role';
    const famOrder = { day: 0, party: 1, family: 2 };
    const copy = rows.slice();
    copy.sort((a, b) => {
      if (by === 'name' || by === 'az') return a.name.localeCompare(b.name);
      if (by === 'za') return b.name.localeCompare(a.name);
      if (by === 'dayof') {
        if (a.dayof !== b.dayof) return a.dayof ? -1 : 1;
        const oa = a.dayOfOrder != null ? a.dayOfOrder : 99;
        const ob = b.dayOfOrder != null ? b.dayOfOrder : 99;
        if (oa !== ob) return oa - ob;
        return a.name.localeCompare(b.name);
      }
      const fa = famOrder[a.roleFamily] != null ? famOrder[a.roleFamily] : 9;
      const fb = famOrder[b.roleFamily] != null ? famOrder[b.roleFamily] : 9;
      if (fa !== fb) return fa - fb;
      const rr = a.role.localeCompare(b.role);
      if (rr) return rr;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }

  function filteredContacts() {
    return sortContacts(allContacts().filter(matchesFilters));
  }

  function dayOfOrdered() {
    const rows = allContacts().filter(x => x.dayof && x.hasPhone);
    const rank = x => {
      if (x.dayOfOrder != null && !isNaN(x.dayOfOrder)) return Number(x.dayOfOrder);
      if (/planner|coordinator/i.test(x.role)) return 1;
      if (/venue/i.test(x.role)) return 2;
      if (/cater/i.test(x.role)) return 3;
      if (/photo/i.test(x.role)) return 4;
      if (/video|film/i.test(x.role)) return 5;
      if (/band/i.test(x.role)) return 6;
      if (/\bdj\b/i.test(x.role)) return 7;
      if (/floral/i.test(x.role)) return 8;
      if (/officiant|pastor/i.test(x.role)) return 9;
      if (/transport/i.test(x.role)) return 10;
      if (x.isVendor) return 20;
      if (x.isParty) return 30;
      return 40;
    };
    return rows.slice().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }

  function groupContacts(rows, by) {
    const map = new Map();
    rows.forEach(x => {
      let key;
      if (by === 'side') {
        key = x.side === 'Bride' ? "Bride's side" : (x.side === 'Groom' ? "Groom's side" : (x.side === 'Both' ? 'Both sides' : 'No side'));
      } else if (by === 'dayof' || by === 'sheet') {
        key = x.dayof ? 'On the sheet' : 'Not on the sheet';
      } else {
        key = x.roleFamily === 'day' ? 'Runs something on the day'
          : (x.roleFamily === 'party' ? 'Wedding party' : 'Family & other');
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(x);
    });
    const keys = Array.from(map.keys());
    if (by === 'side') {
      const order = ["Bride's side", "Groom's side", 'Both sides', 'No side'];
      keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else if (by === 'dayof' || by === 'sheet') {
      keys.sort((a, b) => (a === 'On the sheet' ? 0 : 1) - (b === 'On the sheet' ? 0 : 1));
    } else {
      const order = ['Runs something on the day', 'Wedding party', 'Family & other'];
      keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  function groupBanner(g) {
    const n = g.items.length;
    const on = g.items.filter(x => x.dayof).length;
    if (g.key === 'Runs something on the day') {
      const all = on === n && n > 0;
      return g.key + ' · ' + n + ' contact' + (n === 1 ? '' : 's') + ' · ' + (all ? 'all on the sheet' : (on + ' on the sheet'));
    }
    if (g.key === 'Wedding party') {
      return g.key + ' · ' + n + ' contact' + (n === 1 ? '' : 's') + ' · ' + on + ' on the sheet';
    }
    return g.key + ' · ' + n + ' contact' + (n === 1 ? '' : 's');
  }

  function colVisible(key) {
    if (!window.rdColumns) return true;
    if (key === '_sel') return true;
    return window.rdColumns.isVisible(COL_SCOPE, key);
  }

  function visCols() {
    return window.rdColumns ? window.rdColumns.visible(COL_SCOPE) : CT_COLUMNS;
  }

  function svgIco(paths) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round">'
      + paths + '</svg>';
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._ctMode || 'table';
    const printIco = svgIco('<path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/>');
    const fullIco = svgIco('<path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/>');
    if (mode === 'dayof') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
        + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdCtFullEditor()">' + fullIco + 'Full editor</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtPrintSheet()">Print sheet</button>';
    }
    if (mode === 'cards') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
        + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdCtFullEditor()">' + fullIco + 'Full editor</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd(this)">Add contact</button>';
    }
    return ''
      + '<button type="button" class="rd-btn rd-btn--quiet" onclick="rdCtImportPhone()">Import from phone</button>'
      + '<button type="button" class="rd-btn" onclick="printCurrentPage()">' + printIco + 'Print section</button>'
      + '<button type="button" class="rd-btn" data-rd-full-editor onclick="rdCtFullEditor()">' + fullIco + 'Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdCtExportVCards()">Export vCards</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd(this)">Add contact</button>';
  }

  function uedContactsShellRd() {
    const panel = document.getElementById('panel-contacts');
    if (!panel) return;
    panel.classList.add('ued-scope', 'contacts-mockup');
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
            <div class="rd-view" id="ct-view-dayof" data-ct-view="dayof" hidden></div>
            <div class="rd-view" id="ct-view-cards" data-ct-view="cards" hidden></div>
          </div>
          <div id="contacts-drawer-slot"></div>
        </div>
      </div>
      <input id="ct-vcf-input" type="file" accept=".vcf,.vcard,.csv,text/vcard,text/csv" hidden>
    </div>`;
    const file = panel.querySelector('#ct-vcf-input');
    if (file && !file._ctBound) {
      file._ctBound = true;
      file.addEventListener('change', function () {
        const f = file.files && file.files[0];
        file.value = '';
        if (f) rdCtImportFile(f);
      });
    }
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderCtStats() {
    const host = document.getElementById('contacts-stats');
    if (!host) return;
    const f = ctFigures();
    const stats = [
      { label: 'Contacts', value: String(f.contacts) },
      { label: 'Day-of sheet', value: String(f.dayof) },
      { label: 'Vendors', value: String(f.vendors) },
      { label: 'Verified', value: String(f.verified) },
      { label: 'No number', value: String(f.nonumber), attention: f.nonumber ? 'add a number' : undefined }
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
    const ui = window._ctUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdCtOpenFilter(this,'${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdCtClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Contacts view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetContactsView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'dayof' ? ' is-active' : ''}" onclick="rdSetContactsView('dayof')">Day-of sheet</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetContactsView('cards')">Cards</button>` +
      `</div></div>`;
  }

  function sortChipLabel() {
    const by = window._ctSort || 'role';
    if (by === 'name' || by === 'az') return 'Sort A–Z';
    if (by === 'za') return 'Sort Z–A';
    if (by === 'dayof') return 'Sort by day-of order';
    return 'Sort by role';
  }

  function renderCtToolbar() {
    const host = document.getElementById('contacts-toolbar');
    if (!host) return;
    const mode = window._ctMode || 'table';
    const f = ctFigures();
    const first = dayOfOrdered()[0];
    let left = '';
    if (mode === 'dayof') {
      left = `<span class="rd-ess-toolbar-note">${f.dayof} number${f.dayof === 1 ? '' : 's'} on the sheet${first ? ' · call ' + esc(firstName(first.name)) + ' first' : ''}</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Role', 'role');
    } else {
      left = filterChip('Role', 'role') + filterChip('Side', 'side') + filterChip('Day-of', 'dayof') +
        (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml(sortChipLabel(), 'rdCtOpenSort(this)')
          : `<button type="button" class="rd-chip" onclick="rdCtOpenSort(this)">${esc(sortChipLabel())}</button>`) +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '');
    }
    host.innerHTML = left + viewSwitchHtml(mode);
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
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtBulk('verify')">Verify number</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtBulk('text')">Send a text</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdCtExportVCards()">Export vCards</button>` +
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

  function sourcePill(x) {
    const scheme = x.isVendor ? 'forest' : (x.isManual ? 'gold' : 'muted');
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(x.sourceKind)}</span>`;
  }

  function roleChip(x) {
    const scheme = x.isVendor || /planner|coordinator/i.test(x.role) ? 'forest'
      : (x.isParty ? 'gold' : 'gray');
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(x.role)}</span>`;
  }

  function dayofCell(x) {
    if (x.dayof) return `<span class="status-pill" data-pillscheme="gold">On sheet</span>`;
    if (!x.hasPhone) return `<span class="rd-ct-nonumber">No number</span>`;
    return '';
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function cellFor(x, key, safeId) {
    if (key === '_sel') {
      const sel = window._ctSel.has(x.id);
      return `<td class="rd-ct-td--check" onclick="event.stopPropagation();rdCtToggleSel('${esc(safeId)}')">` +
        `<input type="checkbox" class="rd-ct-checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.name)}"></td>`;
    }
    if (key === 'contact') {
      return `<td><b class="rd-guest-name__primary">${esc(x.name)}</b></td>`;
    }
    if (key === 'role') return `<td class="rd-guest-td--muted">${esc(x.role)}</td>`;
    if (key === 'phone') {
      return `<td class="${x.hasPhone ? '' : 'rd-guest-td--quiet'}">${esc(x.phone || '—')}</td>`;
    }
    if (key === 'email') {
      return `<td class="${x.hasEmail ? '' : 'rd-guest-td--quiet'}">${esc(x.email || '—')}</td>`;
    }
    if (key === 'reaches') return `<td class="rd-guest-td--muted">${esc(x.reachesShort || x.reaches || '—')}</td>`;
    if (key === 'dayof') return `<td>${dayofCell(x)}</td>`;
    if (key === 'source') return `<td>${sourcePill(x)}</td>`;
    return '<td></td>';
  }

  function renderTableView() {
    const host = document.getElementById('ct-view-table');
    if (!host) return;
    const rows = filteredContacts();
    const cols = visCols();
    const span = cols.length;
    if (!rows.length) {
      host.innerHTML = `<div class="rd-ess-empty"><p>No contacts yet — add a guest or a vendor and they appear here. This page does not keep a list of its own.</p>
        <button type="button" class="rd-btn rd-btn--primary" onclick="rdCtAdd(this)">Add contact</button></div>`;
      return;
    }
    const groups = groupContacts(rows, window._ctGroupBy || 'role');
    const th = cols.map(c => {
      const w = c.width ? ` style="width:${c.width}"` : '';
      const af = c.fixed ? ' data-autofit="off"' : '';
      return `<th${w}${af}>${esc(c.label || '')}</th>`;
    }).join('');
    let html = `<div class="rd-table-wrap"><table class="rd-ct-table rd-guest-mini-table rd-table"><thead><tr>${th}</tr></thead><tbody>`;
    groups.forEach(g => {
      html += `<tr class="rd-guest-side-banner"><td colspan="${span}">${esc(groupBanner(g))}</td></tr>`;
      g.items.forEach(x => {
        const sel = window._ctSel.has(x.id);
        const safeId = jsId(x.id);
        html += `<tr class="rd-ct-row${sel ? ' is-selected' : ''}" onclick="rdCtOpen('${esc(safeId)}')">`;
        cols.forEach(c => { html += cellFor(x, c.key, safeId); });
        html += `</tr>`;
      });
    });
    html += `<tr class="rd-ct-addrow" onclick="rdCtAdd(this)"><td class="rd-ct-addrow__plus">+</td><td colspan="${Math.max(1, span - 1)}">Add a contact — creates a guest or a vendor record</td></tr>`;
    html += `</tbody></table></div>`;
    html += sheetPreviewHtml();
    host.innerHTML = html;
    if (typeof window.rdStdApplyRowHeight === 'function') {
      window.rdStdApplyRowHeight(COL_SCOPE, host);
    }
  }

  function sheetPreviewHtml() {
    const list = dayOfOrdered();
    const n = list.length;
    const printed = sheetPrintedLabel();
    const printedBit = printed ? ' · printed ' + printed : '';
    const first = list[0];
    const rows = list.map(x =>
      `<div class="rd-ct-sheet-preview__row"><span class="rd-ct-sheet-preview__name">${esc(x.name)}</span>` +
      `<span class="rd-ct-sheet-preview__role">${esc(x.role)}</span>` +
      `<span class="rd-ct-sheet-preview__phone">${esc(x.phone)}</span></div>`
    ).join('');
    return `<div class="rd-ct-sheet-preview-wrap">` +
      `<div class="rd-ct-sheet-preview__bar">` +
      `<div class="rd-ct-sheet-preview__kicker">Day-of contact sheet</div>` +
      `<div class="rd-ct-sheet-preview__meta">${n} number${n === 1 ? '' : 's'} · one page, black on white, Class A${printedBit}</div>` +
      `<button type="button" class="rd-ct-sheet-preview__print" onclick="event.stopPropagation();rdCtPrintSheet()">Print the sheet</button>` +
      `</div>` +
      `<div class="rd-ct-sheet-preview__paper">` +
      `<div class="rd-ct-sheet__couple">${esc(coupleLine())}</div>` +
      `<div class="rd-ct-sheet__title">Day-of contacts</div>` +
      (first
        ? `<div class="rd-ct-sheet__first">Call this person first: ${esc(first.name)} · ${esc(first.phone)}</div>`
        : '') +
      `<div class="rd-ct-sheet-preview__grid">${rows}</div>` +
      `<div class="rd-ct-sheet__foot"><span>Printed ${esc(printed || '—')}</span><span>Page 1 of 1</span></div>` +
      `</div></div>`;
  }

  /* ── Cards ───────────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('ct-view-cards');
    if (!host) return;
    host.classList.remove('rd-cardgrid');
    host.classList.add('rd-ct-cards');
    const rows = filteredContacts();
    if (!rows.length) {
      host.innerHTML = `<p class="rd-help" style="grid-column:1/-1">No contacts match this view.</p>`;
      return;
    }
    host.innerHTML = rows.map(x => {
      const safeId = jsId(x.id);
      return `<article class="rd-ct-card${window._ctSel.has(x.id) ? ' is-selected' : ''}" onclick="rdCtOpen('${esc(safeId)}')">` +
        `<strong>${esc(x.name)}</strong>` +
        `<div class="rd-ct-card__role">${roleChip(x)}</div>` +
        `<p class="rd-ct-card__phone">${esc(x.phone || '—')}</p>` +
        `<div class="rd-ct-card__sheet${x.dayof ? ' is-on' : ''}">${x.dayof ? 'On the sheet' : 'Not on sheet'}</div>` +
        `</article>`;
    }).join('');
  }

  /* ── Day-of sheet ────────────────────────────────────────────────────── */

  function dayOfViewGroups(rows) {
    const buckets = [
      { key: 'Wedding party', items: rows.filter(x => x.isParty && !x.isVendor) },
      { key: 'Vendors', items: rows.filter(x => x.isVendor || /planner|coordinator|officiant|pastor/i.test(x.role)) },
      { key: 'Family', items: rows.filter(x => !x.isVendor && !x.isParty && !/planner|coordinator|officiant|pastor/i.test(x.role)) }
    ];
    return buckets.filter(b => b.items.length);
  }

  function renderDayOfView() {
    const host = document.getElementById('ct-view-dayof');
    if (!host) return;
    const rows = dayOfOrdered();
    const first = rows[0];
    const printed = sheetPrintedLabel();
    let body = '';
    if (!rows.length) {
      body = `<p class="rd-help">No numbers on the day-of sheet yet. Flag a vendor or guest from Table view.</p>`;
    } else {
      dayOfViewGroups(rows).forEach(g => {
        body += `<div class="rd-ct-sheet__group"><div class="rd-ct-sheet__group-h">${esc(g.key)}<span>${g.items.length} number${g.items.length === 1 ? '' : 's'}</span></div>`;
        g.items.forEach(x => {
          const safeId = jsId(x.id);
          body += `<button type="button" class="rd-ct-sheet__row" onclick="rdCtOpen('${esc(safeId)}')">` +
            `<span class="rd-ct-sheet__name">${esc(x.name)}</span>` +
            `<span class="rd-ct-sheet__role">${esc(x.role)}</span>` +
            `<span class="rd-ct-sheet__phone">${esc(x.phone)}</span>` +
            `</button>`;
        });
        body += `</div>`;
      });
    }
    host.innerHTML = `<div class="rd-ct-sheet"><div class="rd-ct-sheet__paper">
      <div class="rd-ct-sheet__couple">${esc(coupleLine())}</div>
      <div class="rd-ct-sheet__title">Day-of contacts</div>
      ${first ? `<div class="rd-ct-sheet__first">Call this person first: ${esc(first.name)} · ${esc(first.phone)}</div>` : ''}
      ${body}
      <div class="rd-ct-sheet__foot"><span>Printed ${esc(printed || '—')}</span><span>Page 1 of 1</span></div>
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

  function field(label, value, opts) {
    opts = opts || {};
    const click = opts.onclick ? ` class="rd-drawer__link" onclick="${opts.onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${value == null || value === '' ? '—' : (opts.html ? value : esc(value))}</strong></div>`;
  }

  function fieldInput(label, name, value) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span>` +
      `<input class="rd-ct-input" data-ct-field="${esc(name)}" value="${esc(value == null ? '' : value)}"></div>`;
  }

  function findContact(id) {
    return allContacts().find(x => x.id === id) || null;
  }

  function writeLive(x, patch) {
    if (!x) return false;
    let rec = x.live;
    if (!rec) {
      if (x.isManual && x.manualIndex != null && Array.isArray(data.contacts)) rec = data.contacts[x.manualIndex];
      else if (x.sourceKey && x.sourceIndex != null && Array.isArray(data[x.sourceKey])) rec = data[x.sourceKey][x.sourceIndex];
    }
    if (!rec) return false;
    Object.keys(patch).forEach(k => { rec[k] = patch[k]; });
    if (typeof save === 'function') save();
    return true;
  }

  function packetFor(x) {
    const packs = (typeof safeArray === 'function' ? safeArray(data.packets) : (data.packets || []));
    const hay = [x.name, x.companyRaw, x.row && x.row.company, x.live && x.live.name].filter(Boolean).join(' ').toLowerCase();
    return packs.find(p => {
      const rec = String(p.recipient || p.name || '').toLowerCase();
      return rec && hay && (hay.indexOf(rec) !== -1 || rec.indexOf(String(x.companyRaw || x.name).toLowerCase()) !== -1);
    }) || null;
  }

  function contractFor(x) {
    const list = (typeof safeArray === 'function' ? safeArray(data.contracts) : (data.contracts || []));
    const keys = [x.companyRaw, x.live && x.live.name, x.name].filter(Boolean).map(s => String(s).toLowerCase());
    return list.find(c => {
      const v = String(c.vendor || c.name || '').toLowerCase();
      return v && keys.some(k => k && (v.indexOf(k) !== -1 || k.indexOf(v) !== -1));
    }) || null;
  }

  function sourceCompanyLabel(x) {
    if (x.isVendor) return (x.companyRaw || x.name || 'Vendor');
    return x.name;
  }

  function openLabel(x) {
    if (x.isVendor) return 'Open the vendor';
    if (x.source === 'Wedding Party') return 'Open the member';
    if (x.isManual) return 'Open record';
    return 'Open the guest';
  }

  function ownsLabel(x) {
    if (x.isVendor) return 'Vendor record';
    if (x.source === 'Wedding Party') return 'Wedding party record';
    if (x.isManual) return 'Typed on this page';
    return 'Guest record';
  }

  function recordTypeLabel(x) {
    if (x.isVendor) return 'Vendor';
    if (x.source === 'Wedding Party') return 'Wedding party';
    if (x.isManual) return 'Typed here';
    return 'Guest';
  }

  function derivedFromLabel(x) {
    if (x.isVendor) return 'Vendors · ' + sourceCompanyLabel(x);
    if (x.source === 'Wedding Party') return 'Wedding Party · ' + x.name;
    if (x.isManual) return 'Typed here';
    return 'Guest List · ' + x.name;
  }

  function sheetPosition(x) {
    const list = dayOfOrdered();
    const i = list.findIndex(r => r.id === x.id);
    return { i: i, n: list.length, pos: i >= 0 ? (i + 1) : 0 };
  }

  function drawerContactBody(x) {
    const noteName = x.isVendor ? sourceCompanyLabel(x) : x.name;
    const kind = x.isVendor ? 'vendor' : (x.isManual ? 'typed' : 'guest');
    const lead = x.isVendor
      ? `A contact is a projection of a guest or vendor record. Saving here writes to the vendor record for ${esc(noteName)}.`
      : (x.isManual
        ? 'This row was typed on Contacts. Prefer adding a guest or a vendor so the number lives on an owning record.'
        : `A contact is a projection of a guest or vendor record. Saving here writes to the ${kind} record underneath.`);
    return `<p class="rd-drawer__note rd-ct-drawer-lead">${lead}</p>` +
      fieldInput('Name', 'name', x.isVendor && x.live && x.live.contact ? x.live.contact : x.name) +
      fieldInput('Role', 'role', x.role) +
      fieldInput('Phone', 'phone', x.phone) +
      fieldInput('Email', 'email', x.email) +
      fieldInput('Verified', 'phoneVerified', x.verified && x.verified !== 'yes' ? x.verified : (isVerified(x) ? x.verifiedLabel : ''));
  }

  function drawerReachesBody(x) {
    const audience = /^everyone$/i.test(x.reaches) ? 'Vendors and party' : (x.isVendor ? 'Vendors' : (x.isParty ? 'Wedding party' : 'Family'));
    const wa = x.hasPhone ? 'Same number' : '—';
    const em = x.hasEmail ? 'Not for the day' : '—';
    const phoneRight = isVerified(x) ? ('Verified ' + (x.verifiedLabel.replace(/^Yes\s*·\s*/i, '') || '')) : (x.hasPhone ? 'Unverified' : '—');
    return fieldInput('Reaches', 'reaches', x.reaches === '—' ? '' : x.reaches) +
      field('Audience', audience) +
      fieldInput('Escalates to', 'escalatesTo', x.escalatesTo === '—' ? '' : x.escalatesTo) +
      fieldInput('On site from', 'onSiteFrom', x.onSiteFrom) +
      `<p class="rd-drawer__note">The escalation chain is what makes the contact sheet useful at 7am on the day. A contact with nobody above them is the end of the chain, and the sheet says so rather than leaving a blank.</p>` +
      `<div class="rd-drawer__section-label">Reachable by</div>` +
      field('Phone', phoneRight) +
      field('WhatsApp', wa) +
      field('Email', em);
  }

  function drawerDayOfBody(x) {
    const f = ctFigures();
    const pos = sheetPosition(x);
    const pkt = packetFor(x);
    const posLabel = x.dayof && pos.pos ? (pos.pos + ' of ' + pos.n) : 'Not on the sheet';
    const note = x.dayof && pos.pos
      ? `Position ${pos.pos} because the sheet is ordered by who you call first, not alphabetically. ${pos.n} contact${pos.n === 1 ? '' : 's'} fit on one printed page.`
      : 'Ordered by who you call first, not alphabetically. Twelve fit on one printed page.';
    return field('Position', posLabel) +
      field('Class', 'A · black on white') +
      field('Also in', pkt ? (pkt.name || pkt.recipient) : '—', pkt ? { onclick: "showPanel('packets')" } : {}) +
      `<p class="rd-drawer__note">${esc(note)}</p>` +
      `<div class="rd-drawer__section-label">On the sheet</div>` +
      field('Vendors', String(f.sheetVendors)) +
      field('Wedding party', String(f.sheetParty)) +
      field('Planner', String(f.sheetPlanner));
  }

  function drawerSourceBody(x) {
    const f = ctFigures();
    const openFn = `rdCtOpenSource('${esc(jsId(x.id))}')`;
    const con = contractFor(x);
    return field('Derived from', derivedFromLabel(x), { onclick: openFn }) +
      field('Record type', recordTypeLabel(x)) +
      field('Owns the fields', ownsLabel(x)) +
      (x.isVendor ? field('Contracts', con ? (con.name || 'On file') : 'No contract on file') : '') +
      `<p class="rd-drawer__note">This page cannot create a contact. Every row is a guest or a vendor seen through one lens — so to add someone, add the vendor or the guest.</p>` +
      `<div class="rd-drawer__section-label">The ${f.dayof} come from</div>` +
      field('Vendor records', String(f.sheetFromVendors)) +
      field('Guest records', String(f.sheetFromGuests)) +
      field('Typed here', String(f.sheetTyped));
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
    const safeId = jsId(x.id);
    let body = '';
    let primaryLabel = x.isVendor ? 'Save to vendor' : 'Save';
    let primaryAction = `rdCtSaveDrawer('${esc(safeId)}')`;
    let secondaryLabel = 'Full editor';
    let secondaryAction = `rdCtFullEditor('${esc(safeId)}')`;
    if (tab === 0) body = drawerContactBody(x);
    else if (tab === 1) body = drawerReachesBody(x);
    else if (tab === 2) body = drawerDayOfBody(x);
    else {
      body = drawerSourceBody(x);
      primaryLabel = openLabel(x);
      primaryAction = `rdCtOpenSource('${esc(safeId)}')`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-ct-drawer" aria-label="Contact">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Contact · derived</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdCtCloseDrawer()" aria-label="Close">×</button>` +
      `<h2 class="rd-drawer__title">${esc(x.name)}</h2>` +
      `<div class="rd-drawer__chips">` +
      roleChip(x) +
      (x.dayof ? `<span class="status-pill" data-pillscheme="gold">On the sheet</span>` : '') +
      `</div>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdCtSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="${primaryAction}">${esc(primaryLabel)}</button>` +
      `<button type="button" class="rd-btn" onclick="${secondaryAction}">${esc(secondaryLabel)}</button>` +
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

  function readDrawerFields() {
    const slot = document.getElementById('contacts-drawer-slot');
    if (!slot) return {};
    const out = {};
    slot.querySelectorAll('[data-ct-field]').forEach(el => {
      out[el.getAttribute('data-ct-field')] = el.value;
    });
    return out;
  }

  function rdCtSaveDrawer(id) {
    const x = findContact(id || window._ctDrawerId);
    if (!x) return;
    const fields = readDrawerFields();
    const patch = {};
    if (fields.name != null) {
      if (x.isVendor) patch.contact = fields.name;
      else patch.name = fields.name;
    }
    if (fields.role != null) {
      if (x.isVendor) patch.cat = fields.role;
      else patch.role = fields.role;
    }
    if (fields.phone != null) patch.phone = fields.phone;
    if (fields.email != null) patch.email = fields.email;
    if (fields.phoneVerified != null) patch.phoneVerified = fields.phoneVerified;
    if (fields.reaches != null) patch.reaches = fields.reaches;
    if (fields.escalatesTo != null) patch.escalatesTo = fields.escalatesTo;
    if (fields.onSiteFrom != null) patch.onSiteFrom = fields.onSiteFrom;
    if (!writeLive(x, patch)) {
      if (typeof showToast === 'function') showToast('Could not save — no source record.', 'warn');
      return;
    }
    if (typeof showToast === 'function') {
      showToast(x.isVendor ? 'Saved to vendor' : (x.isManual ? 'Saved' : 'Saved to source record'));
    }
    renderContactsRd();
  }

  function openSourceRecord(x) {
    if (!x) return false;
    if (x.isManual && x.manualIndex != null && typeof openRecordEditor === 'function') {
      openRecordEditor('contacts', x.manualIndex);
      return true;
    }
    if (x.sourceKey && x.sourceIndex != null) {
      if (typeof openRecordEditor === 'function') {
        openRecordEditor(x.sourceKey, x.sourceIndex);
        return true;
      }
      if (typeof showPanel === 'function' && x.sourcePage) showPanel(x.sourcePage);
    }
    return false;
  }

  function rdCtOpenSource(id) {
    const x = findContact(id);
    if (!x) return;
    if (!openSourceRecord(x) && typeof showToast === 'function') {
      showToast('Could not open the source record.', 'warn');
    }
  }

  function rdCtFullEditor(id) {
    const x = id ? findContact(id) : (window._ctDrawerId ? findContact(window._ctDrawerId) : null);
    if (x && openSourceRecord(x)) return;
    const sel = selectedContacts()[0];
    if (sel && openSourceRecord(sel)) return;
    const first = filteredContacts()[0];
    if (first && openSourceRecord(first)) return;
    rdCtAdd();
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

  function todayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function rdCtBulk(action) {
    const rows = selectedContacts();
    if (!rows.length) return;
    if (action === 'dayof') {
      rows.forEach(x => writeLive(x, { onSheet: true, emergency: true }));
      if (typeof showToast === 'function') showToast('Added to day-of sheet · ' + rows.length);
      rdCtBulkClear();
      return;
    }
    if (action === 'verify') {
      const iso = todayIso();
      rows.forEach(x => { if (x.hasPhone) writeLive(x, { phoneVerified: iso }); });
      if (typeof showToast === 'function') showToast('Numbers verified · ' + rows.filter(r => r.hasPhone).length);
      rdCtBulkClear();
      return;
    }
    if (action === 'text') {
      const phones = rows.map(x => x.phone.replace(/[^\d+]/g, '')).filter(Boolean);
      if (!phones.length) {
        if (typeof showToast === 'function') showToast('No phone numbers on the selection.', 'warn');
        return;
      }
      window.location.href = 'sms:' + phones.join(',');
    }
  }

  function rdCtAdd(btn) {
    const opts = [
      { value: 'guests', label: 'Add a guest' },
      { value: 'vendors', label: 'Add a vendor' }
    ];
    const go = function (val) {
      if (val === 'vendors') {
        if (typeof openRecordEditor === 'function') openRecordEditor('vendors');
        else if (typeof addVendorRow === 'function') addVendorRow();
        return;
      }
      if (typeof openRecordEditor === 'function') openRecordEditor('guests');
      else if (typeof addGuestRow === 'function') addGuestRow();
    };
    if (btn && typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, '', go);
      return;
    }
    go('guests');
  }

  function markSheetPrinted() {
    const iso = todayIso();
    if (!window.data) window.data = {};
    data.contactSheetPrinted = iso;
    if (!data.setup) data.setup = {};
    data.setup.contactSheetPrinted = iso;
    if (typeof save === 'function') save();
  }

  function rdCtPrintSheet() {
    window._ctMode = 'dayof';
    markSheetPrinted();
    renderContactsRd();
    setTimeout(function () {
      if (typeof printCurrentPage === 'function') printCurrentPage();
      else window.print();
    }, 60);
  }

  function vcardFor(x) {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + String(x.name || 'Contact').replace(/\n/g, ' ')];
    if (x.role) lines.push('TITLE:' + String(x.role).replace(/\n/g, ' '));
    if (x.companyRaw) lines.push('ORG:' + String(x.companyRaw).replace(/\n/g, ' '));
    if (x.phone) lines.push('TEL;TYPE=CELL:' + String(x.phone).replace(/\n/g, ' '));
    if (x.email) lines.push('EMAIL:' + String(x.email).replace(/\n/g, ' '));
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  function rdCtExportVCards() {
    const rows = selectedContacts().length ? selectedContacts() : filteredContacts();
    const list = rows.filter(x => x.hasPhone || x.hasEmail);
    if (!list.length) {
      if (typeof showToast === 'function') showToast('No phone or email to export');
      return;
    }
    const blob = new Blob([list.map(vcardFor).join('\r\n')], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wedding-contacts.vcf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function rdCtImportPhone() {
    const input = document.getElementById('ct-vcf-input');
    if (input) input.click();
  }

  function parseVCards(text) {
    const blocks = String(text || '').split(/BEGIN:VCARD/i).slice(1);
    return blocks.map(b => {
      const fn = (b.match(/^FN[^:]*:(.+)$/mi) || [])[1];
      const tel = (b.match(/^TEL[^:]*:(.+)$/mi) || [])[1];
      const em = (b.match(/^EMAIL[^:]*:(.+)$/mi) || [])[1];
      const org = (b.match(/^ORG[^:]*:(.+)$/mi) || [])[1];
      return {
        name: String(fn || org || '').trim(),
        phone: String(tel || '').trim(),
        email: String(em || '').trim()
      };
    }).filter(r => r.name || r.phone || r.email);
  }

  function parseCsvContacts(text) {
    const lines = String(text || '').split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const split = line => line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
    const heads = split(lines[0]).map(h => h.toLowerCase());
    const ni = heads.findIndex(h => /name|fn|contact/.test(h));
    const pi = heads.findIndex(h => /phone|tel|mobile/.test(h));
    const ei = heads.findIndex(h => /email/.test(h));
    return lines.slice(1).map(line => {
      const c = split(line);
      return { name: c[ni] || '', phone: c[pi] || '', email: c[ei] || '' };
    }).filter(r => r.name || r.phone || r.email);
  }

  function rdCtImportFile(file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      const text = String(ev.target.result || '');
      const people = /BEGIN:VCARD/i.test(text) ? parseVCards(text) : parseCsvContacts(text);
      if (!people.length) {
        if (typeof showToast === 'function') showToast('No contacts found in that file.', 'warn');
        return;
      }
      if (!Array.isArray(data.guests)) data.guests = [];
      people.forEach(p => {
        data.guests.push({
          name: p.name || 'Imported contact',
          phone: p.phone || '',
          email: p.email || '',
          side: 'Both',
          role: 'Guest',
          invited: false,
          rsvp: 'Pending'
        });
      });
      if (typeof save === 'function') save();
      if (typeof showToast === 'function') {
        showToast('Imported ' + people.length + ' as guests · they appear here because Contacts is derived');
      }
      renderContactsRd();
    };
    reader.readAsText(file);
  }

  function rdCtOpenFilter(btn, field) {
    const options = [{ value: 'all', label: 'All' }];
    if (field === 'dayof') {
      ['on sheet', 'not on sheet', 'no number'].forEach(v => options.push({ value: v, label: v }));
    } else {
      const seen = {};
      allContacts().forEach(x => {
        if (field === 'role' && x.role) seen[x.role] = true;
        if (field === 'side' && x.side && x.side !== '—') seen[x.side] = true;
      });
      Object.keys(seen).sort().forEach(v => options.push({ value: v, label: v }));
    }
    const cur = (window._ctUiFilters || {})[field] || 'all';
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, options, cur, function (val) {
        window._ctUiFilters[field] = val || 'all';
        renderContactsRd();
      });
      return;
    }
    const list = options.map(o => o.value);
    const i = list.indexOf(cur);
    window._ctUiFilters[field] = list[(i + 1) % list.length];
    renderContactsRd();
  }
  function rdCtClearFilter(field) {
    window._ctUiFilters[field] = 'all';
    renderContactsRd();
  }
  function rdCtOpenSort(btn) {
    const opts = [
      { value: 'role', label: 'Sort by role' },
      { value: 'name', label: 'A–Z' },
      { value: 'za', label: 'Z–A' },
      { value: 'dayof', label: 'Day-of order' }
    ];
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, window._ctSort || 'role', function (val) {
        window._ctSort = val || 'role';
        renderContactsRd();
      });
      return;
    }
    const list = opts.map(o => o.value);
    const i = list.indexOf(window._ctSort || 'role');
    window._ctSort = list[(i + 1) % list.length];
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
    if (window.rdColumns) {
      window.rdColumns.register(COL_SCOPE, CT_COLUMNS.slice(), function () { renderContactsRd(); });
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
  window.rdCtSaveDrawer = rdCtSaveDrawer;
  window.rdCtFullEditor = rdCtFullEditor;
  window.rdCtToggleSel = rdCtToggleSel;
  window.rdCtBulkClear = rdCtBulkClear;
  window.rdCtBulk = rdCtBulk;
  window.rdCtAdd = rdCtAdd;
  window.rdCtPrintSheet = rdCtPrintSheet;
  window.rdCtExportVCards = rdCtExportVCards;
  window.rdCtExport = rdCtExportVCards;
  window.rdCtImportPhone = rdCtImportPhone;
  window.rdCtOpenFilter = rdCtOpenFilter;
  window.rdCtClearFilter = rdCtClearFilter;
  window.rdCtOpenSort = rdCtOpenSort;

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
