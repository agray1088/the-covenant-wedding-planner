/* Share Packets — All.dc #12b + Views Cards/Activity + Dark.dc rail
   + Drawers batch (Share packet · Packet · Sections · Link · Activity).
   Views: Table | Cards | Activity.
   Rail: All packets · Live · Expired · Draft · Opened this week
         + Activity meters + Group by Recipient type / Status / Created.
   Stats (Table): Packets · Live · Total opens · Expiring in 7 days · Revoked.
   Columns: Packet · Recipient · Contains · Mode · Opens · Expires · Status.
   Data: data.packets[] (+ legacy vendorPackets / partyPackets / coordPacket untouched). */
(function () {
  'use strict';

  window._pktMode = window._pktMode || 'table';
  window._pktRailView = window._pktRailView || 'all';
  window._pktGroupBy = window._pktGroupBy || 'recipient';
  window._pktUiFilters = window._pktUiFilters || { status: 'all', recipient: 'all', expiry: 'all', packet: 'all' };
  window._pktLiveOnly = !!window._pktLiveOnly;
  window._pktDrawerId = window._pktDrawerId || null;
  window._pktDrawerTab = window._pktDrawerTab || 0;
  window._pktSel = window._pktSel instanceof Set ? window._pktSel : new Set();
  window._pktPreviewId = window._pktPreviewId || null;

  const DRAWER_TABS = ['Packet', 'Sections', 'Link', 'Activity'];
  const NEVER_SHARE = [
    'Covenant pages',
    'Budget totals',
    'Guest addresses',
    'Internal notes',
    'Planner history',
    'Other vendors’ pricing'
  ];
  const DEFAULT_SECTIONS = [
    'Wedding Day Timeline',
    'Table Layout · plan only',
    'Contacts · vendors',
    'Ceremony & Reception'
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function ensurePkt() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.packets)) data.packets = [];
    if (!data.vendorPackets || typeof data.vendorPackets !== 'object') data.vendorPackets = {};
    if (!data.partyPackets || typeof data.partyPackets !== 'object') data.partyPackets = {};
    if (!data.coordPacket || typeof data.coordPacket !== 'object') data.coordPacket = {};
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).split('T')[0] + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtShort(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
  function fmtLong(value) {
    const d = parseDate(value);
    if (!d) return String(value || '—');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function daysUntil(value) {
    const d = parseDate(value);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
  }
  function slugLink(seed) {
    const s = String(seed || Math.random().toString(36).slice(2, 8)).replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();
    return 'covenant.link/g/' + (s || 'packet');
  }

  function recipientType(row) {
    const t = String(row.recipientType || row.type || '').toLowerCase();
    if (/vendor|venue|cater|photo|film|music|florist/.test(t + ' ' + (row.recipient || ''))) return 'Vendors';
    if (/family|party|parent|officiant|member/.test(t + ' ' + (row.recipient || ''))) return 'Family & party';
    if (/closed|expired|revoked/.test(t + ' ' + (row.status || ''))) return 'Closed';
    if (/draft/.test(row.status || '')) return 'Draft';
    return String(row.recipientType || 'Other');
  }

  function deriveStatus(row) {
    const raw = String(row.status || '').trim();
    if (/revoked/i.test(raw) || row.revoked) return 'Revoked';
    if (/draft/i.test(raw)) return 'Draft';
    const days = daysUntil(row.expires);
    if (days != null && days < 0) return 'Expired';
    if (/expired/i.test(raw)) return 'Expired';
    if ((Number(row.opens) || 0) === 0 && /never|live|snapshot/i.test(raw || 'live')) {
      if (/never/i.test(raw)) return 'Never opened';
    }
    if (days != null && days <= 7 && days >= 0) return 'Expiring';
    if (/expir/i.test(raw)) return 'Expiring';
    if ((Number(row.opens) || 0) === 0) return 'Never opened';
    if (/live/i.test(raw) || !raw) return 'Live';
    return raw;
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'packets');
    const sections = Array.isArray(row.sections) ? row.sections.slice()
      : String(row.contains || '').split(/[·|,]/).map(s => s.trim()).filter(Boolean);
    const status = deriveStatus(row);
    const opens = Number(row.opens) || 0;
    const mode = /snapshot/i.test(String(row.mode || '')) ? 'Snapshot' : 'Live';
    const rType = recipientType(Object.assign({}, row, { status: status }));
    return {
      id: row._id ? ('packets:' + row._id) : ('packets:idx:' + i),
      index: i,
      row: row,
      name: String(row.name || row.packet || 'Untitled packet').trim() || 'Untitled packet',
      recipient: String(row.recipient || '—').trim() || '—',
      contact: String(row.contact || '').trim(),
      contains: sections.length ? sections.join(' · ') : (String(row.contains || '—').trim() || '—'),
      sections: sections.length ? sections : DEFAULT_SECTIONS.slice(),
      withheld: Array.isArray(row.withheld) ? row.withheld : [],
      mode: mode,
      opens: opens,
      expires: row.expires || '',
      expiresLabel: fmtShort(row.expires),
      status: status,
      recipientType: rType,
      created: row.created || '',
      link: row.link || slugLink(row._id || row.name || i),
      passcode: row.passcode || 'None · anyone with the link',
      lastOpen: row.lastOpen || '',
      activity: Array.isArray(row.activity) ? row.activity : [],
      revoked: !!(row.revoked || status === 'Revoked'),
      openedThisWeek: !!(row.openedThisWeek || (row.lastOpen && /hour|day|yesterday|this week/i.test(String(row.lastOpen))))
    };
  }

  function allPackets() {
    ensurePkt();
    return (data.packets || []).map(unify);
  }

  function pktFigures() {
    const items = allPackets();
    const live = items.filter(x => x.status === 'Live' || x.status === 'Never opened' || x.status === 'Expiring');
    const liveStrict = items.filter(x => x.status === 'Live');
    const expired = items.filter(x => x.status === 'Expired');
    const draft = items.filter(x => x.status === 'Draft');
    const revoked = items.filter(x => x.status === 'Revoked');
    const opened = items.filter(x => x.opens > 0);
    const never = items.filter(x => x.opens === 0 && x.status !== 'Draft' && x.status !== 'Revoked');
    const expiring7 = items.filter(x => {
      const d = daysUntil(x.expires);
      return d != null && d >= 0 && d <= 7 && x.status !== 'Revoked' && x.status !== 'Expired';
    });
    const openedWeek = items.filter(x => x.openedThisWeek);
    const totalOpens = items.reduce((n, x) => n + x.opens, 0);
    let lastOpen = '—';
    items.forEach(x => { if (x.lastOpen) lastOpen = x.lastOpen; });
    return {
      packets: items.length,
      live: liveStrict.length || live.filter(x => x.status === 'Live').length,
      liveLoose: live.length,
      totalOpens: totalOpens,
      expiring7: expiring7.length,
      revoked: revoked.length,
      expired: expired.length,
      draft: draft.length,
      opened: opened.length,
      never: never.length,
      openedWeek: openedWeek.length,
      lastOpen: lastOpen,
      recipients: new Set(items.map(x => x.recipient)).size
    };
  }

  function pktRailCounts() {
    const f = pktFigures();
    return {
      all: f.packets,
      live: f.live,
      expired: f.expired,
      draft: f.draft,
      week: f.openedWeek
    };
  }

  function matchesRail(x) {
    const v = window._pktRailView || 'all';
    if (v === 'live') return x.status === 'Live' || x.status === 'Never opened' || x.status === 'Expiring';
    if (v === 'expired') return x.status === 'Expired';
    if (v === 'draft') return x.status === 'Draft';
    if (v === 'week') return x.openedThisWeek;
    return true;
  }
  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    if (window._pktLiveOnly && x.status !== 'Live') return false;
    const ui = window._pktUiFilters || {};
    if (ui.status && ui.status !== 'all' && x.status.toLowerCase() !== String(ui.status).toLowerCase()) return false;
    if (ui.recipient && ui.recipient !== 'all') {
      if (x.recipientType.toLowerCase() !== String(ui.recipient).toLowerCase()
        && x.recipient.toLowerCase() !== String(ui.recipient).toLowerCase()) return false;
    }
    if (ui.expiry && ui.expiry !== 'all') {
      const d = daysUntil(x.expires);
      if (ui.expiry === '7' && !(d != null && d >= 0 && d <= 7)) return false;
      if (ui.expiry === 'expired' && x.status !== 'Expired') return false;
    }
    if (ui.packet && ui.packet !== 'all' && x.name.toLowerCase() !== String(ui.packet).toLowerCase()) return false;
    return true;
  }
  function filteredPackets() {
    const items = allPackets().filter(matchesFilters);
    items.sort((a, b) => (b.opens - a.opens) || a.name.localeCompare(b.name));
    return items;
  }

  function statusPill(status) {
    let scheme = 'muted';
    if (status === 'Live') scheme = 'green';
    else if (status === 'Expiring' || status === 'Never opened') scheme = 'gold';
    else if (status === 'Expired' || status === 'Revoked') scheme = 'coral';
    else if (status === 'Draft') scheme = 'muted';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._pktMode || 'table';
    if (mode === 'cards') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdPktPrint()">Print manifest</button>'
        + '<button type="button" class="rd-btn" onclick="rdPktFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdPktRevokeAll()">Revoke all</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">Build a packet</button>';
    }
    if (mode === 'activity') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdPktPrint()">Print log</button>'
        + '<button type="button" class="rd-btn" onclick="rdPktExport()">Export log</button>'
        + '<button type="button" class="rd-btn" onclick="rdPktRevokeAll()">Revoke all</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">Build a packet</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdPktRevokeAll()">Revoke all</button>'
      + '<button type="button" class="rd-btn" onclick="rdPktPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdPktFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdPktExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">New packet</button>';
  }

  function uedPacketsShellRd() {
    const panel = document.getElementById('panel-packets');
    if (!panel) return;
    panel.classList.add('ued-scope', 'packets-mockup');
    if (panel.dataset.uedShell === 'pkt-rd12b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'pkt-rd12b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Documents</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Share Packets</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="packets-stats" aria-label="Share packets summary"></div>
      <div class="rd-toolbar" id="packets-toolbar"></div>
      <div class="rd-bulkbar" id="packets-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="packets-surface-row">
          <div class="rd-surface__main" id="packets-view-host">
            <div class="rd-view" id="pkt-view-table" data-pkt-view="table"></div>
            <div class="rd-view" id="pkt-view-cards" data-pkt-view="cards" hidden></div>
            <div class="rd-view" id="pkt-view-activity" data-pkt-view="activity" hidden></div>
          </div>
          <div id="packets-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderPktStatsRd() {
    const host = document.getElementById('packets-stats');
    if (!host) return;
    const f = pktFigures();
    const mode = window._pktMode || 'table';
    let stats;
    if (mode === 'cards') {
      stats = [
        { label: 'Packets', value: String(f.packets) },
        { label: 'Live', value: String(f.live) },
        { label: 'Opens', value: String(f.totalOpens), attention: f.openedWeek ? ('↑' + f.openedWeek + ' this week') : undefined },
        { label: 'Never opened', value: String(f.never), attention: f.never ? 'still waiting' : undefined },
        { label: 'Revoked', value: String(f.revoked) }
      ];
    } else if (mode === 'activity') {
      stats = [
        { label: 'Opens', value: String(f.totalOpens) },
        { label: 'This week', value: String(f.openedWeek) },
        { label: 'Recipients', value: String(f.recipients) },
        { label: 'Never opened', value: String(f.never), attention: f.never ? 'send again' : undefined },
        { label: 'Excluded categories', value: String(NEVER_SHARE.length), attention: 'permanently' }
      ];
    } else {
      stats = [
        { label: 'Packets', value: String(f.packets) },
        { label: 'Live', value: String(f.live) },
        { label: 'Total opens', value: String(f.totalOpens) },
        { label: 'Expiring in 7 days', value: String(f.expiring7), attention: f.expiring7 ? 'extend or revoke' : undefined },
        { label: 'Revoked', value: String(f.revoked) }
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
    const ui = window._pktUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPktCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPktClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderPktToolbar() {
    const host = document.getElementById('packets-toolbar');
    if (!host) return;
    const mode = window._pktMode || 'table';
    let left = '';
    if (mode === 'activity') {
      left = filterChip('Packet', 'packet') + filterChip('Recipient', 'recipient') +
        `<span class="rd-pkt-toolbar-note">Newest first · ${pktFigures().totalOpens} opens</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Status', 'status') + filterChip('Recipient', 'recipient') +
        `<button type="button" class="rd-chip${window._pktLiveOnly ? ' is-active' : ''}" onclick="rdPktToggleLiveOnly()">Live only${window._pktLiveOnly ? '<span class="rd-chip__clear">✕</span>' : ''}</button>`;
    } else {
      left = filterChip('Status', 'status') + filterChip('Recipient', 'recipient') + filterChip('Expiry', 'expiry') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by last opened', "rdPktOpenSort(this)") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('packets') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Share Packets view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPktView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetPktView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'activity' ? ' is-active' : ''}" onclick="rdSetPktView('activity')">Activity</button>` +
      `</div></div>`;
  }

  function renderPktBulk() {
    const host = document.getElementById('packets-bulk-bar');
    if (!host) return;
    const n = window._pktSel.size;
    if (!n || window._pktMode === 'activity') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdPktBulk('extend')">Extend expiry</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdPktBulk('revoke')">Revoke link</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdPktBulk('copy')">Copy links</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdPktBulk('resend')">Resend</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdPktBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._pktMode || 'table';
    ['table', 'cards', 'activity'].forEach(name => {
      const el = document.getElementById('pkt-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }
  function rdSetPktView(mode) {
    window._pktMode = (mode === 'cards' || mode === 'activity') ? mode : 'table';
    renderPacketsRd();
  }
  function applyPacketsRailView(viewId) {
    window._pktRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('packets', window._pktRailView);
    window._pktMode = 'table';
    renderPacketsRd();
  }
  function applyPacketsGroupBy(id) {
    window._pktGroupBy = id || 'recipient';
    renderPacketsRd();
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function groupPackets(items, by) {
    const map = new Map();
    items.forEach(x => {
      let key = x.recipientType || 'Other';
      if (by === 'status') key = x.status;
      else if (by === 'created') key = x.created ? fmtShort(x.created) : 'Undated';
      else {
        if (x.status === 'Expired' || x.status === 'Revoked') key = 'Closed';
        else if (x.recipientType === 'Vendors') key = 'Vendors';
        else if (x.recipientType === 'Family & party') key = 'Family & party';
        else key = x.recipientType || 'Other';
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(x);
    });
    const order = ['Vendors', 'Family & party', 'Closed', 'Draft', 'Other'];
    const keys = Array.from(map.keys()).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      return a.localeCompare(b);
    });
    return keys.map(k => ({ key: k, items: map.get(k) }));
  }

  function renderPreviewPanel(x) {
    if (!x) return '';
    const cards = (x.sections.length ? x.sections : DEFAULT_SECTIONS).slice(0, 4);
    return `<section class="rd-pkt-preview">` +
      `<div class="rd-pkt-preview__head">` +
      `<div><div class="rd-pagehead__eyebrow">packet · ${esc(x.link)} · no login, no editing</div>` +
      `<h3>What the recipient sees</h3></div>` +
      `<button type="button" class="rd-btn" onclick="rdPktOpenPortal('${esc(x.id)}')">Open portal preview</button>` +
      `<button type="button" class="rd-btn" onclick="rdPktPreview('${esc(x.id)}')">Sections preview</button>` +
      `</div>` +
      `<div class="rd-pkt-preview__cards">` +
      cards.map(c => `<article><strong>${esc(c)}</strong><span>Included</span></article>`).join('') +
      `</div>` +
      `<p class="rd-pkt-preview__foot">Read only · ${x.mode === 'Live' ? 'updates live' : 'snapshot'} · expires ${esc(fmtLong(x.expires))}</p>` +
      `<p class="rd-help"><strong>Not included:</strong> Money, guest names beyond the head table, notes, and every Covenant page.</p>` +
      `<div class="rd-pkt-preview__meta">` +
      fieldPlain('Address', x.link) +
      fieldPlain('Passcode', x.passcode) +
      fieldPlain('Mode', x.mode === 'Live' ? 'Live — edits appear immediately' : 'Snapshot — frozen at send') +
      fieldPlain('Expiry', fmtLong(x.expires)) +
      fieldPlain('Opens', x.opens + (x.lastOpen ? (' · last ' + x.lastOpen) : '')) +
      `</div></section>`;
  }
  function fieldPlain(label, value) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function renderTableView() {
    const host = document.getElementById('pkt-view-table');
    if (!host) return;
    const items = filteredPackets();
    if (!items.length) {
      host.innerHTML = `<div class="rd-pkt-empty">` +
        `<h3>Nothing shared yet</h3>` +
        `<p>A packet is a filtered projection, never a copy.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">Build a packet</button>` +
        `</div>`;
      return;
    }
    const groups = groupPackets(items, window._pktGroupBy || 'recipient');
    let html = `<table class="rd-pkt-table"><thead><tr>` +
      `<th class="rd-pkt-check"></th><th>Packet</th><th>Recipient</th><th>Contains</th><th>Mode</th><th>Opens</th><th>Expires</th><th>Status</th>` +
      `</tr></thead><tbody>`;
    groups.forEach(g => {
      html += `<tr class="rd-pkt-group"><td colspan="8"><span>${esc(g.key)} · ${g.items.length} packet${g.items.length === 1 ? '' : 's'}</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._pktSel.has(x.id);
        html += `<tr class="rd-pkt-row${sel ? ' is-selected' : ''}" onclick="rdPktOpenDrawer('${esc(x.id)}')">` +
          `<td class="rd-pkt-check" onclick="event.stopPropagation();rdPktToggleSel('${esc(x.id)}')">` +
          `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.name)}"></td>` +
          `<td class="rd-pkt-name">${esc(x.name)}` +
          `<span class="rd-pkt-row__actions">` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPktOpenDrawer('${esc(x.id)}')">Open</button>` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPktFullEditor('${esc(x.id)}')">Full editor</button>` +
          `</span></td>` +
          `<td>${esc(x.recipient)}</td>` +
          `<td>${esc(x.contains)}</td>` +
          `<td>${esc(x.mode)}</td>` +
          `<td>${x.opens}</td>` +
          `<td>${esc(x.expiresLabel)}</td>` +
          `<td>${statusPill(x.status)}</td>` +
          `</tr>`;
      });
    });
    html += `</tbody></table>` +
      `<button type="button" class="rd-pkt-addbtn" onclick="rdPktAdd()"><span>+</span> New packet — pick a recipient, then the sections</button>`;

    const preview = items.find(x => x.id === window._pktPreviewId) || items.find(x => x.status === 'Live') || items[0];
    window._pktPreviewId = preview ? preview.id : null;
    html += renderPreviewPanel(preview);
    host.innerHTML = html;
  }

  /* ── Cards ───────────────────────────────────────────────────────────── */

  function renderCardsView() {
    const host = document.getElementById('pkt-view-cards');
    if (!host) return;
    const items = filteredPackets();
    if (!items.length) {
      host.innerHTML = `<div class="rd-pkt-empty"><h3>Nothing shared yet</h3><p>A packet is a filtered projection, never a copy.</p><button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">Build a packet</button></div>`;
      return;
    }
    let html = `<div class="rd-pkt-cardgrid">`;
    items.forEach(x => {
      const hides = (x.withheld.length ? x.withheld : NEVER_SHARE).slice(0, 3).join(' · ');
      html += `<article class="rd-pkt-card${x.status === 'Never opened' ? ' is-amber' : ''}${x.status === 'Draft' ? ' is-draft' : ''}" onclick="rdPktOpenDrawer('${esc(x.id)}')">` +
        `<div class="rd-pkt-card__top">${statusPill(x.status)}<span>${esc(x.mode)}</span></div>` +
        `<h3>${esc(x.name)}</h3>` +
        `<div class="rd-pkt-card__recip">${esc(x.recipient)}</div>` +
        `<div class="rd-pkt-card__block"><span>Contains</span><p>${esc(x.contains)}</p></div>` +
        `<div class="rd-pkt-card__block"><span>Hides</span><p>${esc(hides)}</p></div>` +
        `<div class="rd-pkt-card__meta"><span>${x.opens} open${x.opens === 1 ? '' : 's'}</span><span>Expires ${esc(x.expiresLabel)}</span></div>` +
        `</article>`;
    });
    html += `</div>`;
    host.innerHTML = html;
  }

  /* ── Activity ────────────────────────────────────────────────────────── */

  function renderActivityView() {
    const host = document.getElementById('pkt-view-activity');
    if (!host) return;
    const items = filteredPackets();
    const events = [];
    items.forEach(x => {
      if (x.activity.length) {
        x.activity.forEach(a => events.push({ when: a.when || a.at || '—', where: a.where || a.city || '—', browser: a.browser || '—', packet: x.name, recipient: x.recipient, id: x.id }));
      } else if (x.opens > 0) {
        events.push({ when: x.lastOpen || 'Recently', where: '—', browser: '—', packet: x.name, recipient: x.recipient, id: x.id });
      }
    });
    let html = `<div class="rd-pkt-activity">` +
      `<div class="rd-pkt-activity__log">` +
      `<div class="rd-section__head"><div class="rd-pagehead__eyebrow">Access log · ${events.length}</div>` +
      `<p class="rd-help">Newest first</p></div>`;
    if (!events.length) {
      html += `<div class="rd-pkt-empty"><p>No opens recorded yet.</p></div>`;
    } else {
      events.forEach(e => {
        html += `<button type="button" class="rd-pkt-activity__row" onclick="rdPktOpenDrawer('${esc(e.id)}')">` +
          `<strong>${esc(e.when)}</strong>` +
          `<span>${esc(e.packet)} · ${esc(e.recipient)}</span>` +
          `<em>${esc(e.where)} · ${esc(e.browser)}</em>` +
          `</button>`;
      });
    }
    html += `</div>` +
      `<aside class="rd-pkt-activity__side">` +
      `<div class="rd-drawer__section-title">What a packet can never contain</div>` +
      NEVER_SHARE.map(n => `<div class="rd-drawer__guest">${esc(n)} <span>Never</span></div>`).join('') +
      `<div class="rd-drawer__section-title">Revocation</div>` +
      fieldPlain('Effect', 'Immediate') +
      fieldPlain('Downloaded PDFs', 'Cannot be recalled') +
      fieldPlain('All packets expire', items[0] ? fmtLong(items[0].expires) : '—') +
      `</aside></div>`;
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

  function renderPktDrawer() {
    const slot = document.getElementById('packets-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const x = allPackets().find(i => i.id === window._pktDrawerId);
    if (!x) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._pktDrawerTab, 10) || 0));
    const f = pktFigures();
    let body = '';
    if (tab === 0) {
      body =
        field('Recipient', x.recipient) +
        field('Contact', x.contact || '—') +
        field('Mode', x.mode) +
        field('Created', fmtLong(x.created)) +
        field('Expires', fmtLong(x.expires)) +
        `<p class="rd-drawer__note">Live versus snapshot — the difference only matters after you edit. A live packet updates as you change the planner; a snapshot stays frozen at send.</p>`;
    } else if (tab === 1) {
      const included = x.sections;
      const withheld = x.withheld.length ? x.withheld : ['Budget', 'Guest List', 'Prayer Journal'];
      body =
        `<div class="rd-drawer__section-title">Sections · ${included.length} of 30</div>` +
        included.map(s => `<div class="rd-drawer__guest">${esc(s)} <span>Included</span></div>`).join('') +
        `<div class="rd-drawer__section-title">Withheld · ${Math.max(0, 30 - included.length)}</div>` +
        withheld.map(s => {
          const never = /prayer|covenant|budget/i.test(s);
          return `<div class="rd-drawer__guest">${esc(s)} <span>${never ? 'Never shareable' : 'Greyed, not hidden'}</span></div>`;
        }).join('') +
        `<p class="rd-drawer__note">Four of thirty. Withheld sections are greyed, not hidden — the recipient sees that something exists, not what it contains.</p>`;
    } else if (tab === 2) {
      body =
        field('Address', x.link) +
        field('Passcode', x.passcode) +
        field('Expires', fmtLong(x.expires)) +
        field('Revoked', x.revoked ? 'Yes' : 'No') +
        `<p class="rd-drawer__note rd-pkt-drawer__warn">No passcode, and the tab says why — anyone with the link can open a read-only slice. Revoke the link if it leaves the room it was meant for.</p>` +
        field('Expiry default', '30 days after the wedding') +
        field('This packet', fmtShort(x.expires));
    } else {
      const acts = x.activity.length ? x.activity : (x.opens
        ? [{ when: x.lastOpen || 'Recently', where: '—', browser: '—' }]
        : []);
      body =
        `<div class="rd-drawer__section-title">Opens · ${x.opens}</div>` +
        (acts.length
          ? acts.map(a => `<div class="rd-drawer__hist"><strong>${esc(a.when || a.at || '—')}</strong> · ${esc(a.where || a.city || '—')}<div>${esc(a.browser || 'Browser')}</div></div>`).join('')
          : `<p class="rd-drawer__note">No opens yet.</p>`) +
        `<div class="rd-drawer__section-title">Across all packets</div>` +
        field('Opened at least once', f.opened + ' of ' + f.packets) +
        field('Never opened', String(f.never)) +
        field('Total opens', String(f.totalOpens));
    }

    const foot = tab === 2
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktCopyLink('${esc(x.id)}')">Copy link</button>` +
        `<button type="button" class="rd-btn" onclick="rdPktFullEditor('${esc(x.id)}')">Full editor</button>`
      : `<button type="button" class="rd-btn" onclick="rdPktCloseDrawer()">Save</button>` +
        `<button type="button" class="rd-btn" onclick="rdPktFullEditor('${esc(x.id)}')">Full editor</button>`;

    const typeEyebrow = /vendor/i.test(x.recipientType) ? 'vendor' : (/family|party/i.test(x.recipientType) ? 'family' : 'packet');
    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-pkt-drawer" aria-label="Share packet">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Packet · ${esc(typeEyebrow)}</div>` +
      `<h2 class="rd-drawer__title">${esc(x.name)}</h2>` +
      `<div class="rd-drawer__chips">` +
      statusPill(x.status) +
      `<span class="status-pill" data-pillscheme="gold">${x.opens} open${x.opens === 1 ? '' : 's'}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdPktCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdPktSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">${foot}</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdPktOpenDrawer(id) {
    window._pktDrawerId = id;
    window._pktDrawerTab = 0;
    window._pktPreviewId = id;
    renderPktDrawer();
    if (window._pktMode === 'table') renderTableView();
  }
  function rdPktCloseDrawer() {
    window._pktDrawerId = null;
    const slot = document.getElementById('packets-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdPktSetDrawerTab(i) {
    window._pktDrawerTab = i;
    renderPktDrawer();
  }
  function rdPktAdd() {
    ensurePkt();
    const wedding = (data.setup && (data.setup.weddingDate || data.setup.date)) || '';
    let expires = '';
    const d = parseDate(wedding);
    if (d) {
      const e = new Date(d);
      e.setDate(e.getDate() + 30);
      expires = e.toISOString().slice(0, 10);
    }
    const row = {
      name: 'New packet',
      recipient: '',
      recipientType: 'Vendors',
      contains: 'Timeline · contacts',
      sections: DEFAULT_SECTIONS.slice(),
      mode: 'Live',
      opens: 0,
      expires: expires,
      status: 'Draft',
      created: new Date().toISOString().slice(0, 10),
      link: slugLink('new'),
      passcode: 'None · anyone with the link',
      activity: []
    };
    if (typeof nextRecordId === 'function') row._id = nextRecordId('packets');
    data.packets.push(row);
    if (typeof save === 'function') save();
    const created = unify(row, data.packets.length - 1);
    window._pktDrawerId = created.id;
    window._pktDrawerTab = 0;
    window._pktMode = 'table';
    renderPacketsRd();
  }
  function rdPktFullEditor(id) {
    const x = id ? allPackets().find(i => i.id === id) : allPackets().find(i => i.id === window._pktDrawerId);
    if (typeof openRecordEditor === 'function' && x) {
      try {
        openRecordEditor('packets', x.index);
        return;
      } catch (e) { /* fall through */ }
    }
    if (x) {
      window._pktDrawerId = x.id;
      window._pktDrawerTab = 0;
      renderPktDrawer();
    } else rdPktAdd();
  }
  function rdPktPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdPktExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Share Packets', allPackets().map(x => ({
        packet: x.name, recipient: x.recipient, contains: x.contains, mode: x.mode,
        opens: x.opens, expires: x.expires, status: x.status, link: x.link
      })));
    }
  }
  async function rdPktRevokeAll() {
    const ok = typeof covConfirm === 'function'
      ? await covConfirm('Revoke every live packet link? Recipients will lose access immediately.')
      : window.confirm('Revoke every live packet link?');
    if (!ok) return;
    ensurePkt();
    data.packets.forEach(r => { r.revoked = true; r.status = 'Revoked'; });
    if (typeof save === 'function') save();
    renderPacketsRd();
  }
  function rdPktCopyLink(id) {
    const x = allPackets().find(i => i.id === id);
    if (!x) return;
    const text = x.link;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof covAlert === 'function') covAlert('Link copied: ' + text);
      }).catch(() => { if (typeof covAlert === 'function') covAlert(text); });
    } else if (typeof covAlert === 'function') covAlert(text);
  }
  function rdPktPreview(id) {
    window._pktPreviewId = id;
    window._pktDrawerId = id;
    window._pktDrawerTab = 1;
    renderPacketsRd();
  }
  function rdPktOpenPortal(id) {
    const x = id ? allPackets().find(p => p.id === id) : null;
    let token = 'cat9';
    if (x && x.link) {
      const m = String(x.link).match(/\/g\/([A-Za-z0-9_-]+)/);
      if (m) token = m[1];
    }
    const expired = x && (/expir/i.test(x.status) || x.revoked) ? '&expired=1' : '';
    const url = 'vendor-portal.html?g=' + encodeURIComponent(token) + expired;
    window.open(url, '_blank', 'noopener');
  }
  function rdPktToggleLiveOnly() {
    window._pktLiveOnly = !window._pktLiveOnly;
    renderPacketsRd();
  }
  function rdPktToggleSel(id) {
    if (window._pktSel.has(id)) window._pktSel.delete(id);
    else window._pktSel.add(id);
    renderPktBulk();
    renderTableView();
  }
  function rdPktBulkClear() {
    window._pktSel.clear();
    renderPacketsRd();
  }
  async function rdPktBulk(action) {
    const ids = Array.from(window._pktSel);
    const rows = allPackets().filter(x => ids.includes(x.id));
    if (!rows.length) return;
    if (action === 'extend') {
      rows.forEach(x => {
        const d = parseDate(x.expires) || new Date();
        d.setDate(d.getDate() + 30);
        x.row.expires = d.toISOString().slice(0, 10);
        if (x.row.status === 'Expired' || x.row.status === 'Expiring') x.row.status = 'Live';
        x.row.revoked = false;
      });
    } else if (action === 'revoke') {
      rows.forEach(x => { x.row.revoked = true; x.row.status = 'Revoked'; });
    } else if (action === 'copy') {
      const links = rows.map(x => x.link).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(links);
      }
      if (typeof covAlert === 'function') covAlert(rows.length + ' link(s) copied.');
    } else if (action === 'resend') {
      if (typeof covAlert === 'function') covAlert('Marked for resend. Attach the link from the Link tab when you write to the recipient.');
      rows.forEach(x => { if (x.row.status === 'Never opened') x.row.status = 'Live'; });
    }
    if (typeof save === 'function') save();
    renderPacketsRd();
  }
  function rdPktCycleFilter(field) {
    const options = { all: true };
    if (field === 'status') allPackets().forEach(x => { options[x.status] = true; });
    if (field === 'recipient') {
      allPackets().forEach(x => { options[x.recipientType] = true; options[x.recipient] = true; });
    }
    if (field === 'expiry') { options['7'] = true; options.expired = true; }
    if (field === 'packet') allPackets().forEach(x => { options[x.name] = true; });
    const list = Object.keys(options);
    const cur = (window._pktUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._pktUiFilters[field] = list[(i + 1) % list.length];
    renderPacketsRd();
  }
  function rdPktClearFilter(field) {
    window._pktUiFilters[field] = 'all';
    renderPacketsRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderPacketsRd() {
    ensurePkt();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('packets', window._pktRailView || 'all');
      if (saved) window._pktRailView = saved;
    }
    uedPacketsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('packets');
    applyViewMode();
    renderPktStatsRd();
    renderPktToolbar();
    renderPktBulk();

    const mode = window._pktMode || 'table';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'activity') renderActivityView();
    else renderTableView();
    renderPktDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'packets'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('packets');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('packets');
  }

  window.uedPacketsShell = uedPacketsShellRd;
  window.renderPacketsPage = renderPacketsRd;
  window.renderPacketsRd = renderPacketsRd;
  window.rdSetPktView = rdSetPktView;
  window.applyPacketsRailView = applyPacketsRailView;
  window.applyPacketsGroupBy = applyPacketsGroupBy;
  window.pktRailCounts = pktRailCounts;
  window.pktFigures = pktFigures;
  window.rdPktOpenDrawer = rdPktOpenDrawer;
  window.rdPktCloseDrawer = rdPktCloseDrawer;
  window.rdPktSetDrawerTab = rdPktSetDrawerTab;
  window.rdPktAdd = rdPktAdd;
  window.rdPktFullEditor = rdPktFullEditor;
  window.rdPktPrint = rdPktPrint;
  window.rdPktExport = rdPktExport;
  window.rdPktRevokeAll = rdPktRevokeAll;
  window.rdPktCopyLink = rdPktCopyLink;
  window.rdPktPreview = rdPktPreview;
  window.rdPktOpenPortal = rdPktOpenPortal;
  window.rdPktToggleLiveOnly = rdPktToggleLiveOnly;
  window.rdPktToggleSel = rdPktToggleSel;
  window.rdPktBulkClear = rdPktBulkClear;
  window.rdPktBulk = rdPktBulk;
  window.rdPktCycleFilter = rdPktCycleFilter;
  window.rdPktClearFilter = rdPktClearFilter;

  function hookPktPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.packets = function () { renderPacketsRd(); };
    }
    window.renderPackets = renderPacketsRd;
  }
  hookPktPanelRenderer();
  var _showPanelPkt = window.showPanel;
  if (typeof _showPanelPkt === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelPkt.call(window, id, forceOpen);
      hookPktPanelRenderer();
      return out;
    };
  }
})();
