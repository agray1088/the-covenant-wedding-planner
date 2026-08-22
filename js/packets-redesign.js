/* Share Packets — Master s24 / 12b · Cards 33c · Activity 33d · Tabs 19m
   Table: Packet · Recipient · Contains · Mode · Opens · Expires · Status
   Views: Table · Cards · Activity
   Section tabs: packet strip + Editing / Sections / Recipients / Link & expiry / Activity
   Rail: All packets · Live · Expired · Draft · Opened this week
         · Group by Recipient type / Status / Created
   Drawer: Packet · Sections · Link · Activity
   Primary: New packet (Table) / Build a packet (Cards · Activity)
   Data: data.packets[] — figures from the packet record, never typed twice. */
(function () {
  'use strict';

  window._pktMode = window._pktMode || 'table';
  window._pktRailView = window._pktRailView || 'all';
  window._pktGroupBy = window._pktGroupBy || 'recipient';
  window._pktSort = window._pktSort || 'lastOpened';
  window._pktChapter = window._pktChapter || 'editing';
  window._pktUiFilters = window._pktUiFilters || { status: 'all', recipient: 'all', expiry: 'all', packet: 'all', included: 'all' };
  window._pktLiveOnly = !!window._pktLiveOnly;
  window._pktDrawerId = window._pktDrawerId || null;
  window._pktDrawerTab = window._pktDrawerTab || 0;
  window._pktSel = window._pktSel instanceof Set ? window._pktSel : new Set();
  window._pktPreviewId = window._pktPreviewId || null;
  window._pktActiveId = window._pktActiveId || null;

  const DRAWER_TABS = ['Packet', 'Sections', 'Link', 'Activity'];
  const CHAPTERS = [
    { id: 'editing', label: 'Editing' },
    { id: 'sections', label: 'Sections' },
    { id: 'recipients', label: 'Recipients' },
    { id: 'link', label: 'Link & expiry' },
    { id: 'activity', label: 'Activity' }
  ];
  const NEVER_SHARE = [
    'Covenant pages',
    'Budget totals',
    'Guest addresses',
    'Internal notes',
    'Planner history',
    'Other vendors’ pricing'
  ];
  const PAGE_SECTIONS = [
    { id: 'timeline', name: 'Wedding day timeline', source: 'Wedding Day Timeline', preview: '14 events · 8:00am – 11:45pm', never: false },
    { id: 'floor', name: 'Reception floor plan', source: 'Table Layout', preview: '15 tables · no guest names', never: false },
    { id: 'contacts', name: 'Vendor contacts', source: 'Contacts', preview: '9 numbers', never: false },
    { id: 'ceremony', name: 'Order of the evening', source: 'Ceremony & Reception', preview: '14 elements', never: false },
    { id: 'shots', name: 'Shot lists', source: 'Shot Lists', preview: 'Must-haves and windows', never: false },
    { id: 'catering', name: 'Menu · headcount · dietary', source: 'Catering & Menu', preview: 'Covers and meals', never: false },
    { id: 'party', name: 'Wedding party duties', source: 'Wedding Party', preview: 'Roles and attire', never: false },
    { id: 'weekend', name: 'Weekend logistics', source: 'Weekend Logistics', preview: 'Hotels and transport', never: false },
    { id: 'entertainment', name: 'Set times and power', source: 'Entertainment', preview: 'Band and DJ windows', never: false },
    { id: 'budget', name: 'Budget', source: 'Budget', preview: '—', never: false, defaultWithheld: true },
    { id: 'guests', name: 'Guest List', source: 'Guest List', preview: '—', never: false, defaultWithheld: true },
    { id: 'payments', name: 'Payments', source: 'Payments', preview: '—', never: false, defaultWithheld: true },
    { id: 'contracts', name: 'Contracts', source: 'Contracts & Invoices', preview: '—', never: false, defaultWithheld: true },
    { id: 'households', name: 'Households', source: 'Households', preview: '—', never: false, defaultWithheld: true },
    { id: 'gifts', name: 'Gifts', source: 'Gifts', preview: '—', never: false, defaultWithheld: true },
    { id: 'emails', name: 'Email templates', source: 'Email Templates', preview: '—', never: false, defaultWithheld: true },
    { id: 'print', name: 'Print Centre', source: 'Print Centre', preview: '—', never: false, defaultWithheld: true },
    { id: 'appointments', name: 'Appointments', source: 'Appointments', preview: '—', never: false, defaultWithheld: true },
    { id: 'tasks', name: 'Planning timeline', source: 'Planning Timeline & Tasks', preview: '—', never: false, defaultWithheld: true },
    { id: 'calendar', name: 'Smart Calendar', source: 'Smart Calendar', preview: '—', never: false, defaultWithheld: true },
    { id: 'honeymoon', name: 'Honeymoon', source: 'Honeymoon & After', preview: '—', never: false, defaultWithheld: true },
    { id: 'essentials', name: 'Essentials checklist', source: 'Essentials Checklist', preview: '—', never: false, defaultWithheld: true },
    { id: 'notes', name: 'Internal notes', source: 'Notes', preview: '—', never: true },
    { id: 'history', name: 'Planner history', source: 'Planner History', preview: '—', never: true },
    { id: 'prayer', name: 'Prayer Journal', source: 'Covenant', preview: 'Private by design', never: true },
    { id: 'vision', name: 'Vision & Foundation', source: 'Covenant', preview: 'Private by design', never: true },
    { id: 'counseling', name: 'Premarital Counseling', source: 'Covenant', preview: 'Private by design', never: true },
    { id: 'rhythms', name: 'First-month rhythms', source: 'Covenant', preview: 'Private by design', never: true },
    { id: 'homecoming', name: 'Newlywed Homecoming', source: 'Covenant', preview: 'Private by design', never: true },
    { id: 'setup', name: 'Wedding Setup', source: 'Wedding Setup', preview: '—', never: true }
  ];
  const SHELL_VER = 'pkt-rd12b-s24';
  const COL_SCOPE = 'packets';
  const PKT_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'packet', label: 'Packet' },
    { key: 'recipient', label: 'Recipient', width: '160px' },
    { key: 'contains', label: 'Contains' },
    { key: 'mode', label: 'Mode', width: '90px' },
    { key: 'opens', label: 'Opens', width: '70px' },
    { key: 'expires', label: 'Expires', width: '90px' },
    { key: 'status', label: 'Status', width: '110px' }
  ];
  const SEC_COLUMNS = [
    { key: '_sel', label: '', width: '34px', fixed: true },
    { key: 'section', label: 'Section' },
    { key: 'source', label: 'Source page', width: '180px' },
    { key: 'included', label: 'Included', width: '120px' },
    { key: 'sees', label: 'What the recipient sees' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(COL_SCOPE, PKT_COLUMNS.slice(), function () { renderPacketsRd(); });
    window.rdColumns.register('packets-sections', SEC_COLUMNS.slice(), function () { renderPacketsRd(); });
  }

  const MASTER_PACKETS = [
    {
      name: 'Grace Hall day-of packet', tabLabel: 'Grace Hall day-of', cardTitle: 'Grace Hall · venue packet',
      recipient: 'Grace Hall events', contact: 'events@gracehall.gh', recipientType: 'Vendors',
      contains: 'Timeline · floor plan · contacts',
      sections: ['timeline', 'floor', 'contacts', 'ceremony'],
      mode: 'Live', opens: 14, expires: '2026-12-08', status: 'Live', created: '2026-07-12',
      sent: '2026-03-14', lastOpen: '2 hours ago', openedThisWeek: true, link: 'covenant.link/g/4kq9',
      hides: 'Budget, guest names', cardMeta: 'Sent 14 Mar · opened 6 times',
      previewCards: [
        { name: 'Wedding day timeline', detail: '14 events · 8:00am – 11:45pm' },
        { name: 'Reception floor plan', detail: '15 tables · 118 seated' },
        { name: 'Vendor contacts', detail: '9 numbers' },
        { name: 'Order of the evening', detail: '14 elements' }
      ],
      activity: [
        { when: '2 hours ago', where: 'Accra', browser: 'Chrome', who: 'Nana Ama', device: 'desktop', viewed: 'Downloaded run sheet' },
        { when: 'Yesterday', where: 'Accra', browser: 'Chrome' },
        { when: '26 Jul', where: 'Accra', browser: 'Safari' },
        { when: '18 Jul 11:22', where: 'Accra', browser: 'Chrome', who: 'Nana Ama', device: 'desktop', viewed: 'Downloaded run sheet', packetHint: 'Grace Hall · venue packet' }
      ]
    },
    {
      name: 'Catering brief', tabLabel: 'Catering brief', cardTitle: 'Adom Catering · catering packet',
      recipient: 'Adom Catering', contact: 'yaa@adom.gh', recipientType: 'Vendors',
      contains: 'Menu · headcount · dietary',
      sections: ['catering', 'timeline', 'contacts'],
      mode: 'Live', opens: 9, expires: '2026-12-08', status: 'Live', created: '2026-04-04',
      sent: '2026-04-04', lastOpen: 'yesterday', openedThisWeek: true, link: 'covenant.link/g/adom',
      hides: 'Names, budget, other vendors', cardMeta: 'Sent 4 Apr · opened 11 times',
      activity: [
        { when: 'Yesterday 16:40', where: 'Adenta', browser: 'Chrome', who: 'Yaa', device: 'desktop', viewed: 'Viewed dietary counts' },
        { when: '14 Jul 08:31', where: 'Adenta', browser: 'Safari', who: 'Yaa', device: 'mobile', viewed: 'Viewed timings' }
      ]
    },
    {
      name: 'Photography brief', tabLabel: 'Photography brief', cardTitle: 'Nii Photography · shot packet',
      recipient: 'Nii Photography', contact: 'nii@osu.gh', recipientType: 'Vendors',
      contains: 'Shot lists · timeline',
      sections: ['shots', 'timeline', 'contacts'],
      mode: 'Snapshot', opens: 6, expires: '2026-08-04', status: 'Expiring', created: '2026-04-22',
      sent: '2026-04-22', lastOpen: '2 Jul', openedThisWeek: false, link: 'covenant.link/g/nii',
      hides: 'Budget, addresses', cardMeta: 'Sent 22 Apr · opened 3 times',
      activity: [
        { when: '2 Jul 19:48', where: 'Osu', browser: 'Safari', who: 'Nii', device: 'mobile', viewed: 'Viewed shot lists' }
      ]
    },
    {
      name: 'Wedding party brief', tabLabel: 'Wedding party', cardTitle: 'Wedding party · duties packet',
      recipient: '10 members', contact: '', recipientType: 'Family & party',
      contains: 'Duties · attire · weekend',
      sections: ['party', 'weekend', 'ceremony'],
      mode: 'Live', opens: 7, expires: '2026-11-09', status: 'Live', created: '2026-06-01',
      sent: '2026-06-01', lastOpen: '3 days ago', openedThisWeek: true, link: 'covenant.link/g/party',
      hides: 'Budget, Covenant, notes', cardMeta: 'Sent 1 Jun · opened 7 times'
    },
    {
      name: 'Parents’ overview', tabLabel: 'Parents’ overview', cardTitle: 'Both mothers · guest packet',
      recipient: 'Both sets of parents', contact: '', recipientType: 'Family & party',
      contains: 'Timeline · order of service',
      sections: ['timeline', 'ceremony', 'guests'],
      mode: 'Snapshot', opens: 2, expires: '2026-08-03', status: 'Expiring', created: '2026-06-02',
      sent: '2026-06-02', lastOpen: 'today', openedThisWeek: true, link: 'covenant.link/g/parents',
      hides: 'Budget, Covenant, notes', cardMeta: 'Sent 2 Jun · opened 24 times', mostOpened: true,
      activity: [
        { when: 'Today 07:12', where: 'Accra', browser: 'Safari', who: 'Mrs Owusu', device: 'mobile', viewed: 'Viewed guest list, RSVP status' },
        { when: 'Yesterday 09:05', where: 'Accra', browser: 'Safari', who: 'Mrs Adjei', device: 'mobile', viewed: 'Viewed guest list' }
      ]
    },
    {
      name: 'Officiant packet', tabLabel: 'Officiant', cardTitle: 'Officiant packet',
      recipient: 'Rev. Mensah', contact: '', recipientType: 'Family & party',
      contains: 'Order of service · vows',
      sections: ['ceremony', 'timeline'],
      mode: 'Live', opens: 0, expires: '2026-11-09', status: 'Never opened', created: '2026-05-06',
      sent: '2026-05-06', lastOpen: '', openedThisWeek: false, link: 'covenant.link/g/rev',
      hides: 'Budget, guest names, Covenant', cardMeta: 'Sent 6 May · never opened', neverAgeDays: 82
    },
    {
      name: 'Venue shortlist comparison', tabLabel: 'Venue shortlist', cardTitle: 'Venue shortlist comparison',
      recipient: 'Mr & Mrs Owusu', contact: '', recipientType: 'Family & party',
      contains: 'Venue comparison only',
      sections: ['timeline'],
      mode: 'Snapshot', opens: 0, expires: '2026-03-14', status: 'Expired', created: '2026-02-01',
      sent: '2026-03-14', lastOpen: '', openedThisWeek: false, link: 'covenant.link/g/owusu',
      hides: 'Budget, guest names', cardMeta: 'Sent 14 Mar · never opened'
    }
  ];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));
  function jsId(id) { return String(id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  function ensurePkt() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.packets)) data.packets = [];
    if (!data.vendorPackets || typeof data.vendorPackets !== 'object') data.vendorPackets = {};
    if (!data.partyPackets || typeof data.partyPackets !== 'object') data.partyPackets = {};
    if (!data.coordPacket || typeof data.coordPacket !== 'object') data.coordPacket = {};
  }

  function stampMaster(p) {
    const copy = Object.assign({}, p);
    if (typeof nextRecordId === 'function') copy._id = nextRecordId('packets');
    copy.passcode = copy.passcode || 'None · anyone with the link';
    copy.withheld = copy.withheld || [];
    return copy;
  }

  function ensureMasterPackets() {
    ensurePkt();
    if (data.packetsMaster12b) return;
    const rows = data.packets || [];
    const starter = rows.length === 0 || rows.every(r =>
      /^(new packet|vendor packet|untitled)/i.test(String(r.name || r.packet || ''))
    );
    if (starter) {
      data.packets = MASTER_PACKETS.map(stampMaster);
    } else {
      const byName = {};
      MASTER_PACKETS.forEach(p => { byName[String(p.name).trim().toLowerCase()] = p; });
      rows.forEach(function (row) {
        const m = byName[String(row.name || row.packet || '').trim().toLowerCase()];
        if (!m) return;
        ['tabLabel', 'cardTitle', 'hides', 'cardMeta', 'sent', 'contact', 'previewCards', 'mostOpened', 'blockedBy', 'draftReason', 'neverAgeDays'].forEach(function (k) {
          if (row[k] == null && m[k] != null) row[k] = m[k];
        });
        if ((!row.activity || !row.activity.length) && m.activity) row.activity = m.activity.slice();
        if ((!row.sections || !row.sections.length) && m.sections) row.sections = m.sections.slice();
      });
      const have = new Set(rows.map(r => String(r.name || r.packet || '').trim().toLowerCase()));
      MASTER_PACKETS.forEach(p => {
        if (!have.has(String(p.name).trim().toLowerCase())) data.packets.push(stampMaster(p));
      });
    }
    data.packetsMaster12b = true;
    if (typeof save === 'function') save();
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
  function daysSince(value) {
    const d = parseDate(value);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((today - d) / 86400000);
  }
  function slugLink(seed) {
    const s = String(seed || Math.random().toString(36).slice(2, 8)).replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();
    return 'covenant.link/g/' + (s || 'packet');
  }
  function coupleLine() {
    const s = (window.data && data.setup) || {};
    const a = s.partner1Name || s.brideName || s.partner1 || 'Ama';
    const b = s.partner2Name || s.groomName || s.partner2 || 'Kwesi';
    const dt = fmtLong(s.weddingDate || s.date || '2026-11-08');
    return a + ' & ' + b + ' · ' + dt;
  }

  function recipientType(row) {
    const t = String(row.recipientType || row.type || '').toLowerCase();
    if (/vendor|venue|cater|photo|film|music|florist|grace hall|adom|nii/.test(t + ' ' + (row.recipient || '') + ' ' + (row.name || ''))) return 'Vendors';
    if (/family|party|parent|officiant|member|rev\.|owusu/.test(t + ' ' + (row.recipient || '') + ' ' + (row.name || ''))) return 'Family & party';
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
    if (/never/i.test(raw)) return 'Never opened';
    if (days != null && days <= 7 && days >= 0) return 'Expiring';
    if (/expir/i.test(raw)) return 'Expiring';
    if ((Number(row.opens) || 0) === 0 && !/draft/i.test(raw)) return 'Never opened';
    if (/live/i.test(raw) || !raw) return 'Live';
    return raw;
  }

  function sectionIdsFor(row) {
    if (Array.isArray(row.sections) && row.sections.length && typeof row.sections[0] === 'string' && PAGE_SECTIONS.some(s => s.id === row.sections[0])) {
      return row.sections.slice();
    }
    const names = Array.isArray(row.sections) ? row.sections : String(row.contains || '').split(/[·|,]/).map(s => s.trim()).filter(Boolean);
    const ids = [];
    names.forEach(n => {
      const hit = PAGE_SECTIONS.find(s => s.id === n || s.name.toLowerCase() === String(n).toLowerCase()
        || s.source.toLowerCase() === String(n).toLowerCase()
        || String(n).toLowerCase().indexOf(s.name.toLowerCase().slice(0, 8)) >= 0);
      if (hit && ids.indexOf(hit.id) < 0) ids.push(hit.id);
    });
    return ids.length ? ids : ['timeline', 'floor', 'contacts', 'ceremony'];
  }

  function unify(row, i) {
    if (typeof ensureRowId === 'function') ensureRowId(row, 'packets');
    const secIds = sectionIdsFor(row);
    const status = deriveStatus(row);
    const opens = Number(row.opens) || 0;
    const mode = /snapshot/i.test(String(row.mode || '')) ? 'Snapshot' : 'Live';
    const rType = recipientType(Object.assign({}, row, { status: status }));
    const containsLabel = String(row.contains || '').trim() || secIds.map(id => {
      const s = PAGE_SECTIONS.find(p => p.id === id);
      return s ? s.name : id;
    }).join(' · ');
    const sentDays = row.neverAgeDays != null ? Number(row.neverAgeDays) : daysSince(row.sent || row.created);
    return {
      id: row._id ? ('packets:' + row._id) : ('packets:idx:' + i),
      index: i,
      row: row,
      name: String(row.name || row.packet || 'Untitled packet').trim() || 'Untitled packet',
      tabLabel: String(row.tabLabel || row.name || 'Packet').trim(),
      cardTitle: String(row.cardTitle || row.name || 'Packet').trim(),
      recipient: String(row.recipient || '—').trim() || '—',
      contact: String(row.contact || '').trim(),
      contains: containsLabel,
      sectionIds: secIds,
      sections: secIds.map(id => {
        const s = PAGE_SECTIONS.find(p => p.id === id);
        return s ? (s.source === 'Table Layout' ? 'Table Layout · plan only' : s.source === 'Contacts' ? 'Contacts · vendors' : s.source) : id;
      }),
      withheld: Array.isArray(row.withheld) ? row.withheld : [],
      hides: String(row.hides || '').trim() || NEVER_SHARE.slice(0, 3).join(', '),
      mode: mode,
      opens: opens,
      expires: row.expires || '',
      expiresLabel: fmtShort(row.expires),
      status: status,
      recipientType: rType,
      created: row.created || '',
      sent: row.sent || row.created || '',
      link: row.link || slugLink(row._id || row.name || i),
      passcode: row.passcode || 'None · anyone with the link',
      lastOpen: row.lastOpen || '',
      activity: Array.isArray(row.activity) ? row.activity : [],
      revoked: !!(row.revoked || status === 'Revoked'),
      openedThisWeek: !!(row.openedThisWeek || (row.lastOpen && /hour|day|yesterday|this week|today/i.test(String(row.lastOpen)))),
      previewCards: Array.isArray(row.previewCards) ? row.previewCards : [],
      cardMeta: row.cardMeta || '',
      mostOpened: !!row.mostOpened,
      blockedBy: row.blockedBy || '',
      draftReason: row.draftReason || '',
      neverAgeDays: sentDays
    };
  }

  function allPackets() {
    ensurePkt();
    return (data.packets || []).map(unify);
  }

  function pktFigures() {
    const items = allPackets();
    const live = items.filter(x => x.status === 'Live');
    const expired = items.filter(x => x.status === 'Expired');
    const draft = items.filter(x => x.status === 'Draft');
    const revoked = items.filter(x => x.status === 'Revoked');
    const opened = items.filter(x => x.opens > 0);
    const never = items.filter(x => x.status === 'Never opened' || (x.opens === 0 && x.status !== 'Draft' && x.status !== 'Revoked' && x.status !== 'Expired'));
    const expiring7 = items.filter(x => {
      const d = daysUntil(x.expires);
      return d != null && d >= 0 && d <= 7 && x.status !== 'Revoked' && x.status !== 'Expired';
    });
    const openedWeek = items.filter(x => x.openedThisWeek);
    const totalOpens = items.reduce((n, x) => n + x.opens, 0);
    let lastOpen = '—';
    items.forEach(x => { if (x.lastOpen) lastOpen = x.lastOpen; });
    const neverHint = never[0] ? ((never[0].cardTitle || never[0].name).split('·')[0].trim().split(' ')[0].toLowerCase() + ' · ' + (never[0].neverAgeDays || 0) + ' days') : '';
    const expireDates = items.filter(x => x.expires && x.status !== 'Expired' && x.status !== 'Revoked').map(x => x.expires).sort();
    const allExpire = expireDates.length ? expireDates[expireDates.length - 1] : '';
    const weekPrior = Math.max(0, openedWeek.length - 3);
    return {
      packets: items.length,
      live: live.length,
      liveLoose: items.filter(x => x.status === 'Live' || x.status === 'Never opened' || x.status === 'Expiring').length,
      totalOpens: totalOpens,
      expiring7: expiring7.length,
      revoked: revoked.length,
      expired: expired.length,
      draft: draft.length,
      opened: opened.length,
      never: never.length,
      neverHint: neverHint,
      openedWeek: openedWeek.length,
      weekDelta: openedWeek.length - weekPrior,
      lastOpen: lastOpen,
      recipients: new Set(items.map(x => x.recipient)).size,
      allExpire: allExpire,
      allExpireLabel: allExpire ? fmtShort(allExpire) : '—'
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
    if (v === 'live') return x.status === 'Live' || x.status === 'Never opened';
    if (v === 'expired') return x.status === 'Expired' || x.status === 'Expiring';
    if (v === 'draft') return x.status === 'Draft';
    if (v === 'week') return x.openedThisWeek;
    return true;
  }
  function matchesFilters(x) {
    if (!matchesRail(x)) return false;
    if (window._pktLiveOnly && (x.status === 'Expired' || x.status === 'Revoked')) return false;
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
  function sortPackets(items) {
    const by = window._pktSort || 'lastOpened';
    const copy = items.slice();
    copy.sort((a, b) => {
      if (by === 'name') return a.name.localeCompare(b.name);
      if (by === 'expires') return String(a.expires).localeCompare(String(b.expires));
      if (by === 'opens') return b.opens - a.opens;
      return (b.opens - a.opens) || a.name.localeCompare(b.name);
    });
    return copy;
  }
  function filteredPackets() {
    return sortPackets(allPackets().filter(matchesFilters));
  }

  function statusPill(status) {
    let scheme = 'muted';
    if (status === 'Live') scheme = 'green';
    else if (status === 'Expiring' || status === 'Never opened') scheme = 'gold';
    else if (status === 'Expired' || status === 'Revoked') scheme = 'coral';
    else if (status === 'Draft') scheme = 'muted';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  function visCols(scope) {
    const cols = scope === 'packets-sections' ? SEC_COLUMNS : PKT_COLUMNS;
    if (window.rdColumns && window.rdColumns.visible) {
      const vis = window.rdColumns.visible(scope || COL_SCOPE);
      if (vis && vis.length) return vis;
    }
    return cols;
  }

  function activePacket() {
    const items = allPackets();
    if (!items.length) return null;
    let x = items.find(i => i.id === window._pktActiveId)
      || items.find(i => i.id === window._pktPreviewId)
      || items.find(i => i.id === window._pktDrawerId);
    if (!x) x = items.find(i => /grace hall/i.test(i.name)) || items[0];
    window._pktActiveId = x.id;
    window._pktPreviewId = x.id;
    return x;
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
    panel.classList.add('ued-scope', 'packets-mockup', 'packets-rd');
    if (panel.dataset.uedShell === SHELL_VER) {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = SHELL_VER;
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
      <div class="rd-sectiontabs rd-pkt-packettabs" id="packets-packet-tabs" role="tablist" aria-label="Packet"></div>
      <div class="rd-pkt-liststrip" id="packets-chapter-tabs" role="tablist" aria-label="Packet chapter"></div>
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
        { label: 'Never opened', value: String(f.never), attention: f.neverHint || (f.never ? 'still waiting' : undefined) },
        { label: 'All expire', value: f.allExpireLabel, attention: f.allExpire ? 'four days after' : undefined }
      ];
    } else if (mode === 'activity') {
      const weekAtt = f.weekDelta > 0 ? ('↑' + f.weekDelta + ' on last week') : (f.weekDelta < 0 ? ('↓' + Math.abs(f.weekDelta) + ' on last week') : undefined);
      stats = [
        { label: 'Opens', value: String(f.totalOpens) },
        { label: 'This week', value: String(f.openedWeek), attention: weekAtt },
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

  function renderPacketTabs() {
    const host = document.getElementById('packets-packet-tabs');
    if (!host) return;
    const mode = window._pktMode || 'table';
    if (mode !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    const items = allPackets();
    const active = activePacket();
    const label = '<span class="rd-pkt-liststrip__label">packet · level 1</span>';
    host.innerHTML = items.map(x =>
      `<button type="button" class="rd-sectiontabs__item${active && x.id === active.id ? ' is-active' : ''}" role="tab" aria-selected="${active && x.id === active.id}" onclick="rdPktSelectPacket('${esc(jsId(x.id))}')">${esc(x.tabLabel)}</button>`
    ).join('') + label;
  }

  function renderChapterTabs() {
    const host = document.getElementById('packets-chapter-tabs');
    if (!host) return;
    const mode = window._pktMode || 'table';
    if (mode !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    const ch = window._pktChapter || 'editing';
    host.innerHTML = CHAPTERS.map(t =>
      `<button type="button" class="rd-pkt-liststrip__item${ch === t.id ? ' is-active' : ''}" role="tab" aria-selected="${ch === t.id}" onclick="rdPktSetChapter('${t.id}')">${esc(t.label)}</button>`
    ).join('') + '<span class="rd-pkt-liststrip__label">chapter · level 2</span>';
  }

  function filterChip(label, field) {
    const ui = window._pktUiFilters || {};
    const cur = ui[field] || 'all';
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdPktOpenFilter(this,'${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdPktClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function sortChipLabel() {
    const by = window._pktSort || 'lastOpened';
    if (by === 'name') return 'Sort by name';
    if (by === 'expires') return 'Sort by expiry';
    if (by === 'opens') return 'Sort by opens';
    return 'Sort by last opened';
  }

  function viewSwitchHtml(mode) {
    return `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Share Packets view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetPktView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetPktView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'activity' ? ' is-active' : ''}" onclick="rdSetPktView('activity')">Activity</button>` +
      `</div></div>`;
  }

  function renderPktToolbar() {
    const host = document.getElementById('packets-toolbar');
    if (!host) return;
    const mode = window._pktMode || 'table';
    const chapter = window._pktChapter || 'editing';
    let left = '';
    if (mode === 'activity') {
      left = filterChip('Packet', 'packet') + filterChip('Recipient', 'recipient') +
        `<span class="rd-pkt-toolbar-note">Newest first · ${pktFigures().totalOpens} opens</span>`;
    } else if (mode === 'cards') {
      left = filterChip('Recipient', 'recipient') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip${window._pktLiveOnly ? ' is-active' : ''}" onclick="rdPktToggleLiveOnly()">Live only${window._pktLiveOnly ? '<span class="rd-chip__clear">✕</span>' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml(sortChipLabel(), 'rdPktOpenSort(this)') : '');
    } else if (chapter === 'sections') {
      left = filterChip('Included', 'included') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('packets-sections') : '');
    } else {
      left = filterChip('Status', 'status') + filterChip('Recipient', 'recipient') + filterChip('Expiry', 'expiry') +
        (typeof rdSortChipHtml === 'function'
          ? rdSortChipHtml(sortChipLabel(), 'rdPktOpenSort(this)')
          : `<button type="button" class="rd-chip" onclick="rdPktOpenSort(this)">${esc(sortChipLabel())}</button>`) +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml(COL_SCOPE) : '');
    }
    const showSwitch = !(mode === 'table' && chapter !== 'editing');
    host.innerHTML = left + (showSwitch ? viewSwitchHtml(mode) : '');
  }

  function renderPktBulk() {
    const host = document.getElementById('packets-bulk-bar');
    if (!host) return;
    const n = window._pktSel.size;
    const chapter = window._pktChapter || 'editing';
    if (!n || window._pktMode === 'activity' || (window._pktMode === 'table' && chapter !== 'editing')) {
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
    if (window._pktMode !== 'table') window._pktChapter = 'editing';
    renderPacketsRd();
  }
  function applyPacketsRailView(viewId) {
    window._pktRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('packets', window._pktRailView);
    window._pktMode = 'table';
    window._pktChapter = 'editing';
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
    const cards = x.previewCards.length ? x.previewCards : x.sectionIds.slice(0, 4).map(id => {
      const s = PAGE_SECTIONS.find(p => p.id === id);
      return { name: s ? s.name : id, detail: s ? s.preview : 'Included' };
    });
    const shortName = /day-of/i.test(x.name) ? 'Day-of packet' : x.name;
    return `<section class="rd-pkt-preview">` +
      `<div class="rd-pkt-preview__head">` +
      `<div><div class="rd-pkt-preview__kicker">What the recipient sees</div>` +
      `<div class="rd-pkt-preview__sub">${esc(x.name)} · ${esc(x.link)} · no login, no editing</div></div>` +
      `<button type="button" class="rd-pkt-preview__as" onclick="rdPktOpenPortal('${esc(jsId(x.id))}')">Preview as recipient</button>` +
      `</div>` +
      `<div class="rd-pkt-preview__body">` +
      `<div class="rd-pkt-portalcard">` +
      `<div class="rd-pkt-portalcard__bar"><span aria-hidden="true">✦</span><span>${esc(coupleLine())}</span></div>` +
      `<div class="rd-pkt-portalcard__pad">` +
      `<div class="rd-pkt-portalcard__shared">Shared with ${esc(x.recipient)}</div>` +
      `<h3>${esc(shortName)}</h3>` +
      `<div class="rd-pkt-portalcard__list">` +
      cards.map(c => `<div><strong>${esc(c.name)}</strong><span>${esc(c.detail)}</span></div>`).join('') +
      `</div>` +
      `<p class="rd-pkt-preview__foot">Read only · ${x.mode === 'Live' ? 'updates live' : 'snapshot'} · expires ${esc(fmtLong(x.expires))}</p>` +
      `</div></div>` +
      `<div class="rd-pkt-preview__aside">` +
      `<div class="rd-pkt-preview__kicker">Not included</div>` +
      `<p>Money, guest names beyond the head table, notes, and every Covenant page. A packet never carries a field the recipient has no reason to see — the section picker greys those out rather than hiding them, so you can see what you withheld.</p>` +
      `<div class="rd-pkt-preview__kicker">Link behaviour</div>` +
      fieldPlain('Address', x.link) +
      fieldPlain('Passcode', x.passcode) +
      fieldPlain('Mode', x.mode === 'Live' ? 'Live — edits appear immediately' : 'Snapshot — frozen at send') +
      fieldPlain('Expiry', fmtLong(x.expires) + ' · 30 days after the wedding') +
      fieldPlain('Opens', x.opens + (x.lastOpen ? (' · last ' + x.lastOpen + (/accra/i.test(String((x.activity[0] || {}).where)) ? ' from Accra' : '')) : '')) +
      `</div></div></section>`;
  }
  function fieldPlain(label, value) {
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function cellFor(x, key, safeId) {
    if (key === '_sel') {
      const sel = window._pktSel.has(x.id);
      return `<td class="rd-pkt-check" onclick="event.stopPropagation();rdPktToggleSel('${esc(safeId)}')">` +
        `<input type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(x.name)}"></td>`;
    }
    if (key === 'packet') {
      return `<td class="rd-pkt-name">${esc(x.name)}` +
        `<span class="rd-pkt-row__actions">` +
        `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPktOpenDrawer('${esc(safeId)}')">Open</button>` +
        `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdPktFullEditor('${esc(safeId)}')">Full editor</button>` +
        `</span></td>`;
    }
    if (key === 'recipient') return `<td>${esc(x.recipient)}</td>`;
    if (key === 'contains') return `<td>${esc(x.contains)}</td>`;
    if (key === 'mode') return `<td>${esc(x.mode)}</td>`;
    if (key === 'opens') return `<td>${x.opens}</td>`;
    if (key === 'expires') return `<td>${esc(x.expiresLabel)}</td>`;
    if (key === 'status') return `<td>${statusPill(x.status)}</td>`;
    return '<td></td>';
  }

  function renderTableView() {
    const host = document.getElementById('pkt-view-table');
    if (!host) return;
    const chapter = window._pktChapter || 'editing';
    if (chapter === 'sections') { renderSectionsChapter(host); return; }
    if (chapter === 'recipients') { renderRecipientsChapter(host); return; }
    if (chapter === 'link') { renderLinkChapter(host); return; }
    if (chapter === 'activity') { renderPacketActivityChapter(host); return; }

    const items = filteredPackets();
    const cols = visCols(COL_SCOPE);
    const span = cols.length;
    if (!items.length) {
      host.innerHTML = `<div class="rd-pkt-empty">` +
        `<h3>Nothing shared yet</h3>` +
        `<p>A packet is a filtered projection, never a copy.</p>` +
        `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktAdd()">New packet</button>` +
        `</div>`;
      return;
    }
    const groups = groupPackets(items, window._pktGroupBy || 'recipient');
    const th = cols.map(c => {
      const w = c.width ? ` style="width:${c.width}"` : '';
      const af = c.fixed ? ' data-autofit="off"' : '';
      return `<th${w}${af}>${esc(c.label || '')}</th>`;
    }).join('');
    let html = `<div class="rd-table-wrap"><table class="rd-pkt-table rd-table"><thead><tr>${th}</tr></thead><tbody>`;
    groups.forEach(g => {
      const noun = g.items.length === 1 ? 'packet' : 'packets';
      html += `<tr class="rd-pkt-group"><td colspan="${span}"><span>${esc(g.key)} · ${g.items.length} ${noun}</span></td></tr>`;
      g.items.forEach(x => {
        const sel = window._pktSel.has(x.id);
        const open = window._pktDrawerId === x.id;
        const safeId = jsId(x.id);
        html += `<tr class="rd-pkt-row${sel ? ' is-selected' : ''}${open ? ' is-open' : ''}" onclick="rdPktOpenDrawer('${esc(safeId)}')">`;
        cols.forEach(c => { html += cellFor(x, c.key, safeId); });
        html += `</tr>`;
      });
    });
    html += `<tr class="rd-pkt-addrow" onclick="rdPktAdd()"><td class="rd-pkt-check">+</td>` +
      `<td colspan="${Math.max(1, span - 1)}">New packet — pick a recipient, then the sections</td></tr>`;
    html += `</tbody></table></div>`;
    const preview = items.find(x => x.id === window._pktPreviewId) || items.find(x => /grace hall/i.test(x.name)) || items.find(x => x.status === 'Live') || items[0];
    window._pktPreviewId = preview ? preview.id : null;
    html += renderPreviewPanel(preview);
    host.innerHTML = html;
    if (typeof window.rdStdApplyRowHeight === 'function') window.rdStdApplyRowHeight(COL_SCOPE, host);
  }

  function packetSectionRows(x) {
    const includedSet = new Set(x.sectionIds);
    return PAGE_SECTIONS.map(s => {
      const included = includedSet.has(s.id);
      return Object.assign({}, s, { included: included && !s.never, withheld: !included || s.never });
    });
  }

  function renderSectionsChapter(host) {
    const x = activePacket();
    if (!x) { host.innerHTML = `<div class="rd-pkt-empty"><p>Pick a packet.</p></div>`; return; }
    const ui = window._pktUiFilters || {};
    let rows = packetSectionRows(x);
    if (ui.included === 'Included') rows = rows.filter(s => s.included);
    if (ui.included === 'Withheld') rows = rows.filter(s => !s.included);
    const inc = rows.filter(s => s.included);
    const held = rows.filter(s => !s.included);
    const cols = visCols('packets-sections');
    const span = cols.length;
    function cells(s) {
      const never = s.never;
      const on = s.included;
      return cols.map(c => {
        if (c.key === '_sel') {
          if (never) return `<td class="rd-pkt-check"></td>`;
          return `<td class="rd-pkt-check" onclick="event.stopPropagation();rdPktToggleSection('${esc(jsId(x.id))}','${s.id}')">` +
            `<input type="checkbox" ${on ? 'checked' : ''} aria-label="${esc(s.name)}"></td>`;
        }
        if (c.key === 'section') return `<td>${esc(s.name)}</td>`;
        if (c.key === 'source') return `<td>${esc(s.source)}</td>`;
        if (c.key === 'included') {
          const lab = never ? 'Never shareable' : (on ? 'Included' : 'Withheld');
          return `<td>${esc(lab)}</td>`;
        }
        if (c.key === 'sees') return `<td>${esc(on ? s.preview : (never ? s.preview : '—'))}</td>`;
        return '<td></td>';
      }).join('');
    }
    let html = `<div class="rd-table-wrap"><table class="rd-pkt-table rd-pkt-sectable rd-table"><thead><tr>` +
      cols.map(c => `<th${c.width ? ` style="width:${c.width}"` : ''}>${esc(c.label || '')}</th>`).join('') +
      `</tr></thead><tbody>`;
    html += `<tr class="rd-pkt-group"><td colspan="${span}">Included · ${inc.length} of 30 sections</td></tr>`;
    inc.forEach(s => { html += `<tr class="rd-pkt-row">${cells(s)}</tr>`; });
    html += `<tr class="rd-pkt-group"><td colspan="${span}">Withheld · ${held.length} sections · greyed, not hidden, so you can see what you kept back</td></tr>`;
    held.forEach(s => { html += `<tr class="rd-pkt-row is-withheld${s.never ? ' is-never' : ''}">${cells(s)}</tr>`; });
    html += `<tr class="rd-pkt-addrow" onclick="rdPktAddSection()"><td class="rd-pkt-check">+</td>` +
      `<td colspan="${Math.max(1, span - 1)}">Add a section</td></tr>`;
    html += `</tbody></table></div>`;
    host.innerHTML = html;
    if (typeof window.rdStdApplyRowHeight === 'function') window.rdStdApplyRowHeight('packets-sections', host);
  }

  function renderRecipientsChapter(host) {
    const x = activePacket();
    if (!x) { host.innerHTML = `<div class="rd-pkt-empty"><p>Pick a packet.</p></div>`; return; }
    host.innerHTML = `<div class="rd-pkt-chapter">` +
      `<div class="rd-pkt-preview__kicker">Recipients</div>` +
      `<h3>${esc(x.name)}</h3>` +
      fieldPlain('Recipient', x.recipient) +
      fieldPlain('Contact', x.contact || '—') +
      fieldPlain('Recipient type', x.recipientType) +
      `<p class="rd-help">The link is the product. Anyone with the address can read this slice — there is no login, and no editing on their side.</p>` +
      `</div>`;
  }

  function renderLinkChapter(host) {
    const x = activePacket();
    if (!x) { host.innerHTML = `<div class="rd-pkt-empty"><p>Pick a packet.</p></div>`; return; }
    host.innerHTML = `<div class="rd-pkt-chapter">` +
      `<div class="rd-pkt-preview__kicker">Link &amp; expiry</div>` +
      `<h3>${esc(x.name)}</h3>` +
      fieldPlain('Address', x.link) +
      fieldPlain('Passcode', x.passcode) +
      fieldPlain('Expires', fmtLong(x.expires)) +
      fieldPlain('Revoked', x.revoked ? 'Yes' : 'No') +
      `<p class="rd-help">No passcode, so anyone with the address can read it. Acceptable for a floor plan and a timeline; it is why the Budget and the Guest List are withheld.</p>` +
      fieldPlain('Expiry default', '30 days after the wedding') +
      fieldPlain('This packet', fmtShort(x.expires)) +
      `<div class="rd-pkt-chapter__actions">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktCopyLink('${esc(jsId(x.id))}')">Copy link</button>` +
      `<button type="button" class="rd-btn" onclick="rdPktFullEditor('${esc(jsId(x.id))}')">Full editor</button>` +
      `</div></div>`;
  }

  function renderPacketActivityChapter(host) {
    const x = activePacket();
    if (!x) { host.innerHTML = `<div class="rd-pkt-empty"><p>Pick a packet.</p></div>`; return; }
    const acts = x.activity.length ? x.activity : [];
    const f = pktFigures();
    host.innerHTML = `<div class="rd-pkt-chapter">` +
      `<div class="rd-pkt-preview__kicker">Activity</div>` +
      `<h3>Opens · ${x.opens}</h3>` +
      (acts.length
        ? acts.map(a => `<div class="rd-drawer__hist"><strong>${esc(a.when || '—')}</strong> · ${esc(a.where || '—')} · ${esc(a.browser || 'Browser')}${a.viewed ? `<div>${esc(a.viewed)}</div>` : ''}</div>`).join('')
        : `<p class="rd-help">No opens yet. A sent packet nobody read is functionally an unsent packet.</p>`) +
      (x.opens >= 8
        ? `<p class="rd-help">${x.opens} opens from one city and two browsers reads like one team using it, which is the point — a day-of packet should be opened repeatedly, not once.</p>`
        : '') +
      `<div class="rd-pkt-preview__kicker">Across all packets</div>` +
      fieldPlain('Opened at least once', f.opened + ' of ' + f.packets) +
      fieldPlain('Never opened', String(f.never)) +
      fieldPlain('Total opens', String(f.totalOpens)) +
      `</div>`;
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
    const maxOpens = items.reduce((n, x) => Math.max(n, x.opens), 0);
    let html = `<div class="rd-pkt-cardgrid">`;
    items.forEach(x => {
      const hides = x.hides || NEVER_SHARE.slice(0, 3).join(', ');
      const never = x.status === 'Never opened';
      const draft = x.status === 'Draft' || !!x.blockedBy;
      const most = x.mostOpened || (x.opens === maxOpens && x.opens > 0 && items.filter(i => i.opens === maxOpens).length === 1);
      const sentLine = x.cardMeta || (x.sent
        ? ('Sent ' + fmtShort(x.sent) + (x.opens ? (' · opened ' + x.opens + ' times') : (never ? ' · never opened' : '')))
        : x.recipient);
      let metaLeft = x.lastOpen ? ('Last opened ' + x.lastOpen) : '';
      let metaRight = x.expiresLabel ? ('Expires ' + x.expiresLabel) : '';
      if (never) {
        metaLeft = '';
        metaRight = x.neverAgeDays != null ? ('Sent ' + x.neverAgeDays + ' days ago') : metaRight;
      }
      if (x.blockedBy) {
        metaLeft = '';
        metaRight = x.draftReason || '';
      }
      html += `<article class="rd-pkt-card${never ? ' is-amber' : ''}${draft ? ' is-draft' : ''}" onclick="rdPktOpenDrawer('${esc(jsId(x.id))}')">` +
        `<h3>${esc(x.cardTitle)}</h3>` +
        `<div class="rd-pkt-card__recip">${esc(sentLine)}</div>` +
        `<div class="rd-pkt-card__top">${statusPill(draft && x.blockedBy ? 'Draft' : x.status)}${most ? '<span class="rd-pkt-card__badge">Most opened</span>' : ''}</div>` +
        `<div class="rd-pkt-card__block"><span>Contains</span><p>${esc(x.contains)}</p></div>` +
        `<div class="rd-pkt-card__block"><span>Hides</span><p>${esc(hides)}</p></div>` +
        (x.blockedBy ? `<div class="rd-pkt-card__block"><span>Blocked by</span><p>${esc(x.blockedBy)}</p></div>` : '') +
        `<div class="rd-pkt-card__meta"><span>${esc(metaLeft)}</span><span>${esc(metaRight)}</span></div>` +
        `</article>`;
    });
    html += `</div>`;
    host.innerHTML = html;
  }

  /* ── Activity ────────────────────────────────────────────────────────── */

  function allActivityEvents() {
    const items = filteredPackets();
    const events = [];
    items.forEach(x => {
      if (x.activity.length) {
        x.activity.forEach(a => {
          events.push({
            when: a.when || a.at || '—',
            where: a.where || a.city || '—',
            browser: a.browser || '—',
            who: a.who || x.recipient,
            device: a.device || '',
            viewed: a.viewed || '',
            packet: a.packetHint || x.cardTitle || x.name,
            recipient: x.recipient,
            id: x.id
          });
        });
      } else if (x.opens > 0) {
        events.push({
          when: x.lastOpen || 'Recently', where: '—', browser: '—', who: x.recipient,
          device: '', viewed: '', packet: x.cardTitle || x.name, recipient: x.recipient, id: x.id
        });
      }
    });
    return events;
  }

  function renderActivityView() {
    const host = document.getElementById('pkt-view-activity');
    if (!host) return;
    const events = allActivityEvents();
    const items = filteredPackets();
    let html = `<div class="rd-pkt-activity">` +
      `<div class="rd-pkt-activity__log">` +
      `<div class="rd-section__head"><div class="rd-pkt-preview__kicker">Access log</div>` +
      `<p class="rd-help">Every open, by packet · newest first · IP and device recorded, shown on the record</p></div>` +
      `<button type="button" class="rd-btn rd-pkt-activity__export" onclick="rdPktExport()">Export log</button>`;
    if (!events.length) {
      html += `<div class="rd-pkt-empty"><p>No opens recorded yet.</p></div>`;
    } else {
      events.forEach(e => {
        const loc = [e.who, e.where, e.device].filter(Boolean).join(' · ');
        html += `<button type="button" class="rd-pkt-activity__row" onclick="rdPktOpenDrawer('${esc(jsId(e.id))}')">` +
          `<strong>${esc(e.packet)}</strong>` +
          `<span>${esc(loc)}</span>` +
          (e.viewed ? `<em>${esc(e.viewed)}</em>` : `<em>${esc(e.where)} · ${esc(e.browser)}</em>`) +
          `<time>${esc(e.when)}</time>` +
          `</button>`;
      });
    }
    html += `</div>` +
      `<aside class="rd-pkt-activity__side">` +
      `<div class="rd-drawer__section-title">What a packet can never contain</div>` +
      NEVER_SHARE.map(n => `<div class="rd-drawer__guest">${esc(n)} <span>Never</span></div>`).join('') +
      `<p class="rd-help">These are not defaults that can be switched on. The packet builder has no control for them, because a control implies a case where it would be correct.</p>` +
      `<div class="rd-drawer__section-title">Revocation</div>` +
      fieldPlain('Effect', 'Immediate') +
      fieldPlain('Downloaded PDFs', 'Cannot be recalled') +
      fieldPlain('All packets expire', items[0] ? fmtLong(pktFigures().allExpire || items[0].expires) : '—') +
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
        `<p class="rd-drawer__note"><strong>Live</strong> means the recipient sees edits as you make them. A snapshot freezes at the moment it was created — the row on the page says which, because the difference matters after a change.</p>`;
    } else if (tab === 1) {
      const catalog = packetSectionRows(x);
      const included = catalog.filter(s => s.included);
      const withheld = catalog.filter(s => !s.included).slice(0, 8);
      body =
        `<div class="rd-drawer__section-title">Sections · ${included.length} of 30</div>` +
        included.map(s => `<div class="rd-drawer__guest">${esc(s.source === 'Table Layout' ? 'Table Layout · plan only' : s.source === 'Contacts' ? 'Contacts · vendors' : s.source)} <span>Included</span></div>`).join('') +
        `<div class="rd-drawer__section-title">Withheld · ${30 - included.length}</div>` +
        withheld.map(s => `<div class="rd-drawer__guest is-withheld">${esc(s.name)} <span>${s.never ? 'Never shareable' : 'Greyed, not hidden'}</span></div>`).join('') +
        `<p class="rd-drawer__note">Withheld sections are <strong>greyed rather than hidden</strong>, so you can see what you kept back. Prayer is the one that cannot be included at all.</p>`;
    } else if (tab === 2) {
      body =
        field('Address', x.link) +
        field('Passcode', x.passcode) +
        field('Expires', fmtLong(x.expires)) +
        field('Revoked', x.revoked ? 'Yes' : 'No') +
        `<p class="rd-drawer__note rd-pkt-drawer__warn">No passcode, so anyone with the address can read it. Acceptable for a floor plan and a timeline; it is why the Budget and the Guest List are withheld.</p>` +
        `<div class="rd-drawer__section-title">Expiry</div>` +
        field('Default', '30 days after the wedding') +
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
        `<p class="rd-drawer__note">${x.opens >= 8 ? (x.opens + ' opens from one city and two browsers reads like one team using it, which is the point — a day-of packet should be opened repeatedly, not once.') : (x.opens ? 'Opens are recorded with city and browser on this tab.' : 'A sent packet nobody read is functionally an unsent packet.')}</p>` +
        `<div class="rd-drawer__section-title">Across all packets</div>` +
        field('Opened at least once', f.opened + ' of ' + f.packets) +
        field('Never opened', String(f.never)) +
        field('Total opens', String(f.totalOpens));
    }

    const foot = tab === 2
      ? `<button type="button" class="rd-btn rd-btn--primary" onclick="rdPktCopyLink('${esc(jsId(x.id))}')">Copy link</button>` +
        `<button type="button" class="rd-btn" onclick="rdPktFullEditor('${esc(jsId(x.id))}')">Full editor</button>`
      : `<button type="button" class="rd-btn" onclick="rdPktCloseDrawer()">Save</button>` +
        `<button type="button" class="rd-btn" onclick="rdPktFullEditor('${esc(jsId(x.id))}')">Full editor</button>`;

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

  /* ── Full editor (§16 popout) ─────────────────────────────────────────── */

  const PKT_MODE_OPTS = ['Live', 'Snapshot'];
  const PKT_STATUS_OPTS = ['Draft', 'Live', 'Expiring', 'Never opened', 'Expired', 'Revoked'];
  const PKT_RECIPIENT_TYPES = ['Vendors', 'Family & party', 'Other'];

  function syncPktDraftContains(draft) {
    if (!draft) return;
    const ids = sectionIdsFor(draft);
    draft.sections = ids.slice();
    draft.contains = ids.map(id => {
      const s = PAGE_SECTIONS.find(p => p.id === id);
      if (!s) return id;
      return String(s.name).split(' ·')[0].trim();
    }).filter(Boolean).join(' · ') || draft.contains || '';
  }

  function renderPacketsRecordEditorRd() {
    const d = recordEditorState && recordEditorState.draft;
    if (!d) return '';
    if (!Array.isArray(d.sections)) d.sections = sectionIdsFor(d);
    const secIds = new Set(sectionIdsFor(d));
    const sectionChecks = PAGE_SECTIONS.filter(s => !s.never).map(s => {
      const on = secIds.has(s.id);
      return `<label class="record-editor-check"><input type="checkbox"${on ? ' checked' : ''} onchange="rdPktEditorToggleSection('${s.id}',this.checked)"><span>${esc(s.name)}</span></label>`;
    }).join('');
    const neverNote = PAGE_SECTIONS.filter(s => s.never).map(s => esc(s.name)).join(' · ');
    return `<section class="record-editor-section"><h4>Share packet</h4><p class="record-editor-note">Live means the recipient sees edits as you make them. Snapshot freezes at send. Covenant records cannot be included — ${neverNote || 'Prayer, notes, and setup'}.</p><div class="record-editor-grid">`
      + (typeof recordInput === 'function' ? recordInput('Packet name', 'name', 'text', true) : '')
      + (typeof recordInput === 'function' ? recordInput('Tab label', 'tabLabel') : '')
      + (typeof recordInput === 'function' ? recordInput('Card title', 'cardTitle') : '')
      + (typeof recordInput === 'function' ? recordInput('Recipient', 'recipient', 'text', true) : '')
      + (typeof recordInput === 'function' ? recordInput('Contact', 'contact') : '')
      + (typeof recordSelect === 'function' ? recordSelect('Recipient type', 'recipientType', PKT_RECIPIENT_TYPES) : '')
      + (typeof recordInput === 'function' ? recordInput('Contains summary', 'contains', 'text', true) : '')
      + (typeof recordInput === 'function' ? recordInput('Hides summary', 'hides', 'text', true) : '')
      + (typeof recordSelect === 'function' ? recordSelect('Mode', 'mode', PKT_MODE_OPTS) : '')
      + (typeof recordSelect === 'function' ? recordSelect('Status', 'status', PKT_STATUS_OPTS) : '')
      + (typeof recordInput === 'function' ? recordInput('Share link', 'link', 'text', true) : '')
      + (typeof recordInput === 'function' ? recordInput('Passcode', 'passcode') : '')
      + (typeof recordInput === 'function' ? recordInput('Expires', 'expires', 'date') : '')
      + (typeof recordInput === 'function' ? recordInput('Created', 'created', 'date') : '')
      + (typeof recordInput === 'function' ? recordInput('Sent', 'sent', 'date') : '')
      + (typeof recordInput === 'function' ? recordInput('Opens', 'opens', 'number') : '')
      + (typeof recordInput === 'function' ? recordInput('Last opened', 'lastOpen') : '')
      + `</div><div class="record-editor-section"><h4>Sections included</h4><div class="record-editor-grid">${sectionChecks || '<p class="record-editor-note">No sections available.</p>'}</div></div>`;
  }

  function rdPktEditorToggleSection(secId, on) {
    if (!recordEditorState || !recordEditorState.draft) return;
    const spec = PAGE_SECTIONS.find(s => s.id === secId);
    if (spec && spec.never) return;
    const set = new Set(sectionIdsFor(recordEditorState.draft));
    if (on) set.add(secId);
    else set.delete(secId);
    recordEditorState.draft.sections = Array.from(set);
    syncPktDraftContains(recordEditorState.draft);
    if (typeof renderRecordEditor === 'function') renderRecordEditor();
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdPktSelectPacket(id) {
    window._pktActiveId = id;
    window._pktPreviewId = id;
    renderPacketsRd();
  }
  function rdPktSetChapter(id) {
    window._pktChapter = CHAPTERS.some(c => c.id === id) ? id : 'editing';
    renderPacketsRd();
  }
  function rdPktOpenDrawer(id) {
    window._pktDrawerId = id;
    window._pktDrawerTab = 0;
    window._pktPreviewId = id;
    window._pktActiveId = id;
    renderPacketTabs();
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
    const wedding = (data.setup && (data.setup.weddingDate || data.setup.date)) || '2026-11-08';
    let expires = '';
    const d = parseDate(wedding);
    if (d) {
      const e = new Date(d);
      e.setDate(e.getDate() + 30);
      expires = e.toISOString().slice(0, 10);
    }
    const row = {
      name: 'New packet',
      tabLabel: 'New packet',
      recipient: '',
      recipientType: 'Vendors',
      contains: 'Timeline · contacts',
      sections: ['timeline', 'contacts'],
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
    window._pktActiveId = created.id;
    window._pktDrawerTab = 0;
    window._pktMode = 'table';
    window._pktChapter = 'editing';
    renderPacketsRd();
  }
  function rdPktToggleSection(id, secId) {
    const spec = PAGE_SECTIONS.find(s => s.id === secId);
    if (spec && spec.never) return;
    const x = allPackets().find(i => i.id === id);
    if (!x) return;
    const set = new Set(x.sectionIds);
    if (set.has(secId)) set.delete(secId);
    else set.add(secId);
    x.row.sections = Array.from(set);
    if (typeof save === 'function') save();
    renderPacketsRd();
  }
  function rdPktAddSection() {
    const x = activePacket();
    if (!x) return;
    window._pktChapter = 'sections';
    const next = PAGE_SECTIONS.find(s => !s.never && x.sectionIds.indexOf(s.id) < 0 && !s.defaultWithheld);
    if (next) rdPktToggleSection(x.id, next.id);
    else if (typeof covAlert === 'function') covAlert('Covenant records cannot be added to any packet.');
  }
  function rdPktFullEditor(id) {
    const x = id ? allPackets().find(i => i.id === id) : allPackets().find(i => i.id === window._pktDrawerId) || activePacket();
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
      ? await covConfirm('Revoke every live packet link? Recipients will lose access immediately. Downloaded PDFs cannot be recalled.')
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
  function rdPktOpenFilter(btn, field) {
    const options = [{ value: 'all', label: 'All' }];
    if (field === 'included') {
      options.push({ value: 'Included', label: 'Included' });
      options.push({ value: 'Withheld', label: 'Withheld' });
    } else if (field === 'expiry') {
      options.push({ value: '7', label: 'Next 7 days' });
      options.push({ value: 'expired', label: 'Expired' });
    } else {
      const seen = {};
      allPackets().forEach(x => {
        if (field === 'status') seen[x.status] = true;
        if (field === 'recipient') { seen[x.recipientType] = true; seen[x.recipient] = true; }
        if (field === 'packet') seen[x.name] = true;
      });
      Object.keys(seen).sort().forEach(v => options.push({ value: v, label: v }));
    }
    const cur = (window._pktUiFilters || {})[field] || 'all';
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, options, cur, function (val) {
        window._pktUiFilters[field] = val || 'all';
        renderPacketsRd();
      });
      return;
    }
    const list = options.map(o => o.value);
    const i = list.indexOf(cur);
    window._pktUiFilters[field] = list[(i + 1) % list.length];
    renderPacketsRd();
  }
  function rdPktCycleFilter(field) { rdPktOpenFilter(null, field); }
  function rdPktClearFilter(field) {
    window._pktUiFilters[field] = 'all';
    renderPacketsRd();
  }
  function rdPktOpenSort(btn) {
    const opts = [
      { value: 'lastOpened', label: 'Sort by last opened' },
      { value: 'opens', label: 'Sort by opens' },
      { value: 'expires', label: 'Sort by expiry' },
      { value: 'name', label: 'Sort by name' }
    ];
    if (typeof window.rdPickOne === 'function') {
      window.rdPickOne(btn, opts, window._pktSort || 'lastOpened', function (val) {
        window._pktSort = val || 'lastOpened';
        renderPacketsRd();
      });
      return;
    }
    const list = opts.map(o => o.value);
    const i = list.indexOf(window._pktSort || 'lastOpened');
    window._pktSort = list[(i + 1) % list.length];
    renderPacketsRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderPacketsRd() {
    ensureMasterPackets();
    if (typeof getSavedView === 'function') {
      const saved = getSavedView('packets', window._pktRailView || 'all');
      if (saved) window._pktRailView = saved;
    }
    if (window.rdColumns) {
      window.rdColumns.register(COL_SCOPE, PKT_COLUMNS.slice(), function () { renderPacketsRd(); });
      window.rdColumns.register('packets-sections', SEC_COLUMNS.slice(), function () { renderPacketsRd(); });
    }
    uedPacketsShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('packets');
    applyViewMode();
    renderPktStatsRd();
    renderPacketTabs();
    renderChapterTabs();
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
  window.rdPktSelectPacket = rdPktSelectPacket;
  window.rdPktSetChapter = rdPktSetChapter;
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
  window.rdPktToggleSection = rdPktToggleSection;
  window.rdPktAddSection = rdPktAddSection;
  window.rdPktBulkClear = rdPktBulkClear;
  window.rdPktBulk = rdPktBulk;
  window.rdPktOpenFilter = rdPktOpenFilter;
  window.rdPktCycleFilter = rdPktCycleFilter;
  window.rdPktClearFilter = rdPktClearFilter;
  window.rdPktOpenSort = rdPktOpenSort;
  window.rdPktEditorToggleSection = rdPktEditorToggleSection;
  window.__packetsRenderRecordEditorRd = renderPacketsRecordEditorRd;

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
