/* Wedding Day Timeline — All.dc #6b + Views #31a/#31b + Drawers batch 25 (Event).
   Views: Table | Ribbon | By vendor.
   Rail: Full day · Vendor calls · Couple only · Wedding party · Unassigned
         + Blocks meters + Checks.
   Stats (table): Events · First call · Ceremony · Send-off · Gaps.
   Columns: Time · Length · Event · Vendor · Status.
   Drawer tabs: Event · People · Run sheet · History.
   Data: data.timeline (+ synced vendor arrivals via wdayTimelineRows). */
(function () {
  'use strict';

  window._wdayMode = window._wdayMode || 'table';
  /* Migrate older Vertical/Details modes */
  if (window._wdayMode === 'vertical') window._wdayMode = 'table';
  if (window._wdayMode === 'details') window._wdayMode = 'table';
  window._wdayRailView = window._wdayRailView || 'full';
  if (window._wdayRailView === 'all') window._wdayRailView = 'full';
  if (window._wdayRailView === 'unowned') window._wdayRailView = 'unassigned';
  window._wdayUiFilters = window._wdayUiFilters || { block: 'all', owner: 'all', vendor: 'all' };
  window._wdayRowHeight = window._wdayRowHeight || 'compact';
  window._wdayShowSlack = window._wdayShowSlack !== false;
  window._wdayShowUnowned = window._wdayShowUnowned !== false;
  window._wdayDrawerId = window._wdayDrawerId || null;
  window._wdayDrawerTab = window._wdayDrawerTab || 0;
  window._wdaySel = window._wdaySel instanceof Set ? window._wdaySel : new Set();

  const WDAY_COL_SCOPE = 'timeline-6b';
  const WDAY_COLUMNS = [
    { key: 'time', label: 'Time', width: '90px' },
    { key: 'length', label: 'Length', width: '90px' },
    { key: 'event', label: 'Event', width: '260px' },
    { key: 'vendor', label: 'Vendor', width: '140px' },
    { key: 'status', label: 'Status', width: '120px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(WDAY_COL_SCOPE, WDAY_COLUMNS.slice(), () => {
      if (typeof renderTimelinePage === 'function') renderTimelinePage();
    });
  }

  const DRAWER_TABS = ['Event', 'People', 'Run sheet', 'History'];
  const BLOCK_ORDER = ['morning', 'portraits', 'ceremony', 'reception', 'close'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function rawRows() {
    if (typeof wdayTimelineRows === 'function') return wdayTimelineRows();
    if (!window.data) window.data = {};
    if (!Array.isArray(data.timeline)) data.timeline = [];
    return data.timeline.map((row, i) => Object.assign({}, row, { _index: i, _source: 'timeline' }));
  }

  function minsOf(value) {
    if (typeof timelineMinutes === 'function') return timelineMinutes(value);
    const v = String(value || '').trim();
    const m = v.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
  function fmtTime(t) {
    if (typeof formatTimelineTime === 'function') {
      const f = formatTimelineTime(t);
      return f === 'Time TBD' ? '—' : f.replace(/\s*(AM|PM)/i, (_, s) => s.toLowerCase()).replace(/^0/, '');
    }
    return t || '—';
  }
  function parseDurationMins(d) {
    const s = String(d || '').trim().toLowerCase();
    if (!s) return null;
    let m = s.match(/(\d+(?:\.\d+)?)\s*h/);
    if (m) {
      const hours = parseFloat(m[1]);
      const mm = s.match(/(\d+)\s*m/);
      return Math.round(hours * 60) + (mm ? parseInt(mm[1], 10) : 0);
    }
    m = s.match(/^(\d+)\s*min/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/^(\d+)$/);
    if (m) return parseInt(m[1], 10);
    return null;
  }
  function fmtLength(mins, raw) {
    if (raw && String(raw).trim()) return String(raw).trim();
    if (mins == null) return '—';
    if (mins < 60) return mins + ' min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (!m) return h + (h === 1 ? ' hr' : ' hrs');
    return h + ' hr ' + m + ' min';
  }

  function matchVendor(name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    const vendors = Array.isArray(data.vendors) ? data.vendors : [];
    return vendors.find(v => {
      const hay = [v.name, v.company, v.contact, v.cat, v.type].join(' ').toLowerCase();
      return hay.includes(n) || n.includes(String(v.name || '').toLowerCase());
    }) || null;
  }

  function eventBlockKey(row) {
    const hay = [row.event, row.location, row.notes].join(' ').toLowerCase();
    const mins = minsOf(row.time);
    if (/send-?off|getaway|carriage|curfew|close|last dance/i.test(hay)) return 'close';
    if (/first look|portrait|formal|photo/i.test(hay) && !/ceremony|reception|cocktail/i.test(hay)) return 'portraits';
    if (/ceremony|processional|officiant|vow|ring|recess|guest.*arriv|seating|sound check/i.test(hay)) return 'ceremony';
    if (/reception|cocktail|dinner|toast|cake|bouquet|dance|speech/i.test(hay)) return 'reception';
    if (mins != null) {
      if (mins < 13 * 60) return 'morning';
      if (mins < 15 * 60) return 'portraits';
      if (mins < 17 * 60 + 30) return 'ceremony';
      if (mins < 23 * 60) return 'reception';
      return 'close';
    }
    return 'morning';
  }
  function blockLabel(key) {
    return ({
      morning: 'Morning prep',
      portraits: 'Portraits',
      ceremony: 'Ceremony',
      reception: 'Reception',
      close: 'Close'
    })[key] || 'Day';
  }

  function isVendorCall(row) {
    const hay = [row.event, row.notes, row.responsible].join(' ').toLowerCase();
    return /vendor|arriv|load-?in|deliver|setup|sound check|install|unlock|access|florist|caterer|photographer|dj|band|baker/i.test(hay)
      || row._source === 'vendor-arrival';
  }
  function isCoupleOnly(row) {
    const hay = [row.event, row.notes].join(' ').toLowerCase();
    return /first look|couple|vow|first dance|last dance|cake|getaway|private/i.test(hay);
  }
  function isWeddingParty(row) {
    const hay = [row.event, row.responsible, row.notes].join(' ').toLowerCase();
    return /wedding party|bridesmaid|groomsmen|maid of honor|best man|usher|party photo|getting ready/i.test(hay);
  }

  function unifyEvent(row, i) {
    const title = String(row.event || '').trim() || 'Untitled event';
    const owner = String(row.responsible || row.owner || '').trim();
    const durMins = parseDurationMins(row.duration);
    const startMins = minsOf(row.time);
    let endMins = startMins != null && durMins != null ? startMins + durMins : null;
    const vendorRec = matchVendor(owner) || matchVendor(row.vendor) || matchVendor(title);
    let vendor = String(row.vendor || '').trim();
    if (!vendor && vendorRec) vendor = vendorRec.name || vendorRec.company || '';
    if (!vendor && owner && /hall|studio|photo|film|sound|cater|kitchen|bloom|pastor|baker|dj|band|beauty|venue/i.test(owner)) {
      vendor = owner.split(/[·•|]/)[0].trim();
    }

    let status = String(row.status || '').trim();
    if (!status) {
      if (!owner && !vendor) status = 'No owner';
      else if (vendorRec && /not booked|research|contact/i.test(String(vendorRec.status || ''))) status = 'Not booked';
      else if (vendorRec && /not sign|unsigned/i.test(String(vendorRec.status || '') + ' ' + String(vendorRec.contract || ''))) status = 'Unsigned';
      else if (/baker|cake/i.test(title) && !matchVendor('baker') && !matchVendor('cake')) status = 'Not booked';
      else if (!owner) status = 'No owner';
      else status = 'Confirmed';
    }

    const unowned = !owner || status === 'No owner';
    const block = eventBlockKey(row);
    const id = row._id
      ? (row._source || 'timeline') + ':' + row._id
      : (row._source || 'timeline') + ':idx:' + (row._index != null ? row._index : i);

    return {
      id: id,
      src: row._source || 'timeline',
      index: row._index != null ? row._index : i,
      row: row,
      title: title,
      time: row.time || '',
      timeLabel: fmtTime(row.time),
      startMins: startMins,
      endMins: endMins,
      length: fmtLength(durMins, row.duration),
      lengthMins: durMins,
      location: String(row.location || '').trim(),
      owner: owner,
      vendor: vendor || '—',
      vendorRec: vendorRec,
      status: status,
      notes: String(row.notes || '').trim(),
      block: block,
      unowned: unowned,
      isVendorCall: isVendorCall(row),
      isCouple: isCoupleOnly(row),
      isParty: isWeddingParty(row),
      sub: [row.location, row.notes].filter(Boolean).join(' · ') || owner
    };
  }

  function allEvents() {
    return rawRows().map((r, i) => unifyEvent(r, i));
  }

  function findEventById(id) {
    return allEvents().find(e => e.id === id) || null;
  }

  function computeGaps(events) {
    const timed = events.filter(e => e.startMins != null).slice().sort((a, b) => a.startMins - b.startMins);
    const gaps = [];
    for (let i = 0; i < timed.length - 1; i++) {
      const a = timed[i];
      const b = timed[i + 1];
      const aEnd = a.endMins != null ? a.endMins : a.startMins;
      const gap = b.startMins - aEnd;
      if (gap >= 30) {
        gaps.push({
          afterId: a.id,
          beforeId: b.id,
          mins: gap,
          startMins: aEnd,
          endMins: b.startMins,
          label: gap + '-minute gap · ' + fmtTimeFromMins(aEnd) + ' – ' + fmtTimeFromMins(b.startMins)
        });
      }
    }
    return gaps;
  }
  function fmtTimeFromMins(m) {
    if (m == null) return '—';
    let h = Math.floor(m / 60);
    const min = m % 60;
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + ':' + String(min).padStart(2, '0') + ' ' + suffix;
  }

  /* ── figures / rail ──────────────────────────────────────────────────── */

  function timelineFigures() {
    const events = allEvents();
    const gaps = computeGaps(events);
    const timed = events.filter(e => e.startMins != null).sort((a, b) => a.startMins - b.startMins);
    const ceremony = events.find(e => /^ceremony$/i.test(e.title) || (/ceremony/i.test(e.title) && e.block === 'ceremony' && (e.lengthMins || 0) >= 30));
    const sendOff = [...events].reverse().find(e => /send-?off|getaway|last dance/i.test(e.title)) || timed[timed.length - 1];
    const first = timed[0];
    const vendorCalls = events.filter(e => e.isVendorCall);
    const couple = events.filter(e => e.isCouple);
    const party = events.filter(e => e.isParty);
    const unassigned = events.filter(e => e.unowned);
    const blocks = {};
    BLOCK_ORDER.forEach(k => { blocks[k] = events.filter(e => e.block === k); });
    const vendorsOnDay = new Set(events.map(e => e.vendor).filter(v => v && v !== '—'));
    const unsigned = events.filter(e => /unsigned/i.test(e.status)).length;
    const confirmed = events.filter(e => /confirm|contract/i.test(e.status)).length;
    let slack = 0;
    gaps.forEach(g => { slack += g.mins; });
    return {
      count: events.length,
      first: first ? first.timeLabel : '—',
      firstHint: first ? first.title : '',
      ceremony: ceremony ? ceremony.timeLabel : '—',
      sendOff: sendOff ? sendOff.timeLabel : '—',
      gaps: gaps.length,
      gapList: gaps,
      slack: slack,
      blocks: Object.keys(blocks).filter(k => blocks[k].length).length,
      blockCounts: Object.fromEntries(Object.keys(blocks).map(k => [k, blocks[k].length])),
      blockRows: blocks,
      vendorCalls: vendorCalls.length,
      couple: couple.length,
      party: party.length,
      unassigned: unassigned.length,
      vendorsOnDay: vendorsOnDay.size,
      confirmed: confirmed,
      unsigned: unsigned,
      curfew: '1:00am'
    };
  }

  function timelineRailCounts() {
    const f = timelineFigures();
    return {
      full: f.count,
      vendorCalls: f.vendorCalls,
      couple: f.couple,
      party: f.party,
      unassigned: f.unassigned,
      /* legacy aliases for older rail helpers */
      all: f.count,
      morning: f.blockCounts.morning || 0,
      ceremony: f.blockCounts.ceremony || 0,
      evening: (f.blockCounts.reception || 0) + (f.blockCounts.close || 0),
      unowned: f.unassigned
    };
  }

  function matchesRail(e, view) {
    view = view || window._wdayRailView || 'full';
    if (view === 'full' || view === 'all') return true;
    if (view === 'vendorCalls' || view === 'vendor') return e.isVendorCall;
    if (view === 'couple') return e.isCouple;
    if (view === 'party') return e.isParty;
    if (view === 'unassigned' || view === 'unowned') return e.unowned;
    if (view === 'morning' || view === 'ceremony' || view === 'evening') {
      if (view === 'evening') return e.block === 'reception' || e.block === 'close';
      if (view === 'morning') return e.block === 'morning' || e.block === 'portraits';
      return e.block === 'ceremony';
    }
    return true;
  }
  function matchesFilters(e) {
    if (!matchesRail(e)) return false;
    const ui = window._wdayUiFilters || {};
    if (ui.block && ui.block !== 'all' && e.block !== ui.block) return false;
    if (ui.owner && ui.owner !== 'all') {
      if (ui.owner === '__none__') { if (!e.unowned) return false; }
      else if (e.owner !== ui.owner) return false;
    }
    if (ui.vendor && ui.vendor !== 'all') {
      if (String(e.vendor).toLowerCase() !== String(ui.vendor).toLowerCase()) return false;
    }
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._wdayMode || 'table';
    if (mode === 'ribbon') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdWdayPrint()">Print run sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdWdayFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdWdayExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdWdayAdd()">Add event</button>';
    }
    if (mode === 'vendor') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdWdayPrint()">Print call sheets</button>'
        + '<button type="button" class="rd-btn" onclick="rdWdayFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdWdaySendVendors()">Send to vendors</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdWdayAdd()">Add event</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdWdayLoadPreset()">Load a standard day</button>'
      + '<button type="button" class="rd-btn" onclick="rdWdayPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdWdayFullEditor()">Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdWdayVendorPacket()">Vendor packet</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdWdayAdd()">+ New event</button>';
  }

  function uedTimelineShellRd() {
    const panel = document.getElementById('panel-timeline');
    if (!panel) return;
    panel.classList.add('ued-scope', 'wday-mockup');
    if (panel.dataset.uedShell === 'timeline-rd6b-v3') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'timeline-rd6b-v3';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">The Day</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Wedding Day Timeline</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="wday-stats" aria-label="Timeline summary"></div>
      <div class="rd-toolbar" id="wday-toolbar"></div>
      <div class="rd-bulkbar" id="wday-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="wday-surface-row">
          <div class="rd-surface__main" id="wday-view-host">
            <div class="rd-view" id="wday-view-table" data-wday-view="table">
              <div class="rd-table-wrap ued-table-wrap" id="wday-6b-table"></div>
              <span class="rd-table-foot ued-soft" id="wday-6b-foot"></span>
            </div>
            <div class="rd-view" id="wday-view-ribbon" data-wday-view="ribbon" hidden>
              <div id="wday-ribbon-view" class="rd-wday-ribbon"></div>
            </div>
            <div class="rd-view" id="wday-view-vendor" data-wday-view="vendor" hidden>
              <div id="wday-vendor-view" class="rd-wday-vendors"></div>
            </div>
          </div>
          <div id="timeline-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderWdayStatsRd() {
    const host = document.getElementById('wday-stats');
    if (!host) return;
    const f = timelineFigures();
    const mode = window._wdayMode || 'table';

    if (mode === 'ribbon') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Blocks', value: String(f.blocks) },
          { label: 'Events', value: String(f.count) },
          { label: 'First call', value: f.first, attention: f.firstHint || undefined },
          { label: 'Slack in the day', value: f.slack ? (f.slack + ' min') : '0', attention: f.slack ? 'before ceremony' : undefined },
          { label: 'Venue curfew', value: f.curfew, attention: 'carriages' }
        ]);
        return;
      }
    }
    if (mode === 'vendor') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Vendors on the day', value: String(f.vendorsOnDay) },
          { label: 'Obligations', value: String(f.count) },
          { label: 'Confirmed', value: String(f.confirmed) },
          { label: 'Unowned', value: String(f.unassigned), attention: f.unassigned ? 'day-of critical' : undefined },
          { label: 'On unsigned paper', value: String(f.unsigned) }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Events', value: String(f.count) },
        { label: 'First call', value: f.first },
        { label: 'Ceremony', value: f.ceremony },
        { label: 'Send-off', value: f.sendOff },
        { label: 'Gaps', value: String(f.gaps), attention: f.gaps ? 'buffer or move earlier' : undefined }
      ]);
      return;
    }
    host.innerHTML = [
      ['Events', f.count], ['First call', f.first], ['Ceremony', f.ceremony],
      ['Send-off', f.sendOff], ['Gaps', f.gaps]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._wdayUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const display = cur === '__none__' ? 'Unowned' : cur;
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdWdayCycleFilter('${field}')">${esc(on ? label + ': ' + display : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdWdayClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderWdayToolbar() {
    const host = document.getElementById('wday-toolbar');
    if (!host) return;
    const mode = window._wdayMode || 'table';
    let left = '';
    if (mode === 'ribbon') {
      left = filterChip('Block', 'block') + filterChip('Owner', 'owner') +
        `<button type="button" class="rd-chip${window._wdayShowSlack ? ' is-active' : ''}" onclick="rdWdayToggleSlack()">Slack shown${window._wdayShowSlack ? ' ✕' : ''}</button>`;
    } else if (mode === 'vendor') {
      left = filterChip('Vendor', 'vendor') + filterChip('Block', 'block') +
        `<button type="button" class="rd-chip${window._wdayShowUnowned ? ' is-active' : ''}" onclick="rdWdayToggleUnowned()">Show unowned${window._wdayShowUnowned ? ' ✕' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by arrival', "rdWdayOpenSort(this)") : '');
    } else {
      left = filterChip('Block', 'block') + filterChip('Owner', 'owner') + filterChip('Vendor', 'vendor') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('wdayTimeline') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Timeline view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetTimelineView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'ribbon' ? ' is-active' : ''}" onclick="rdSetTimelineView('ribbon')">Ribbon</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'vendor' ? ' is-active' : ''}" onclick="rdSetTimelineView('vendor')">By vendor</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('wday-bulk-bar');
    if (!host) return;
    const n = window._wdaySel.size;
    if (!n || (window._wdayMode || 'table') !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdWdayBulkOwner()">Set owner</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdWdayPrint()">Print run sheet</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdWdayBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._wdayMode || 'table';
    ['table', 'ribbon', 'vendor'].forEach(name => {
      const el = document.getElementById('wday-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetTimelineView(mode) {
    window._wdayMode = (mode === 'ribbon' || mode === 'vendor') ? mode : 'table';
    window._wdayTab = window._wdayMode;
    renderTimelineRd();
  }
  function applyTimelineRailView(viewId) {
    let v = viewId || 'full';
    if (v === 'all') v = 'full';
    if (v === 'unowned') v = 'unassigned';
    window._wdayRailView = v;
    if (typeof setSavedView === 'function') setSavedView('timeline', window._wdayRailView);
    window._wdayMode = 'table';
    renderTimelineRd();
    if (typeof renderContextSidebar === 'function') renderContextSidebar('timeline');
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function statusPill(status) {
    if (!status) return '—';
    let scheme = 'gold';
    if (/confirm|contract/i.test(status)) scheme = 'green';
    if (/no owner|not booked|unsigned|at risk/i.test(status)) scheme = 'red';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(status)}</span>`;
  }

  function groupedByBlock(events) {
    const gaps = computeGaps(allEvents());
    const gapAfter = {};
    gaps.forEach(g => { gapAfter[g.afterId] = g; });
    const map = {};
    BLOCK_ORDER.forEach(k => { map[k] = []; });
    events.forEach(e => {
      if (!map[e.block]) map[e.block] = [];
      map[e.block].push(e);
    });
    const groups = [];
    BLOCK_ORDER.forEach(k => {
      const rows = (map[k] || []).slice().sort((a, b) => (a.startMins ?? 9999) - (b.startMins ?? 9999));
      if (!rows.length) return;
      const first = rows[0];
      const last = rows[rows.length - 1];
      const endLabel = last.endMins != null ? fmtTimeFromMins(last.endMins) : last.timeLabel;
      groups.push({
        key: k,
        label: blockLabel(k) + ' · ' + first.timeLabel + ' – ' + endLabel + ' · ' + rows.length + ' event' + (rows.length === 1 ? '' : 's'),
        rows: rows,
        gapsAfter: rows.map(r => gapAfter[r.id]).filter(Boolean)
      });
    });
    return groups;
  }

  function renderTableView() {
    const host = document.getElementById('wday-6b-table');
    const foot = document.getElementById('wday-6b-foot');
    if (!host) return;
    const events = allEvents().filter(matchesFilters);
    const groups = groupedByBlock(events);
    const dens = window._wdayRowHeight || 'compact';

    let html = `<table class="rd-wday-table rd-wday-table--${esc(dens)}"><thead><tr>` +
      WDAY_COLUMNS.map(c => `<th>${esc(c.label)}</th>`).join('') +
      `</tr></thead><tbody>`;

    if (!groups.length) {
      html += `<tr class="rd-wday-empty"><td colspan="5">No events in this view. Load a standard day or add an event.</td></tr>`;
    } else {
      groups.forEach(g => {
        html += `<tr class="rd-wday-group"><td colspan="5">${esc(g.label)}</td></tr>`;
        g.rows.forEach(e => {
          const sel = window._wdaySel.has(e.id);
          html += `<tr class="rd-wday-row${sel ? ' is-selected' : ''}${e.unowned ? ' is-unowned' : ''}" data-wday-id="${esc(e.id)}" onclick="rdWdayOpenDrawer('${esc(e.id)}')">` +
            `<td>${esc(e.timeLabel)}</td>` +
            `<td>${esc(e.length)}</td>` +
            `<td><div class="rd-wday-name">${esc(e.title)}` +
            (e.sub ? `<div class="rd-wday-sub">${esc(e.sub)}</div>` : '') +
            `<span class="rd-wday-row__actions">` +
            `<button type="button" onclick="event.stopPropagation();rdWdayOpenDrawer('${esc(e.id)}')">Open</button>` +
            `<button type="button" onclick="event.stopPropagation();rdWdayFullEditor('${esc(e.id)}')">Full editor</button>` +
            `</span></div></td>` +
            `<td>${esc(e.vendor)}</td>` +
            `<td>${statusPill(e.status)}</td>` +
            `</tr>`;
          const gap = g.gapsAfter.find(x => x.afterId === e.id);
          if (gap) {
            html += `<tr class="rd-wday-gap"><td colspan="5">` +
              `<div class="rd-wday-gap__label">${esc(gap.label)}</div>` +
              `<div class="rd-wday-gap__note">Nothing scheduled. Buffer, or move the next call earlier.</div>` +
              `<button type="button" class="rd-btn rd-btn--quiet" onclick="rdWdayFillGap('${esc(gap.afterId)}')">Fill the gap →</button>` +
              `</td></tr>`;
          }
        });
      });
    }
    html += `<tr class="rd-wday-add"><td colspan="5"><button type="button" class="rd-wday-addbtn" onclick="rdWdayAdd()"><span>+</span> Add an event…</button></td></tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = events.length ? (events.length + ' event' + (events.length === 1 ? '' : 's') + ' in view') : '';
  }

  /* ── Ribbon (#31a) ───────────────────────────────────────────────────── */

  function renderRibbonView() {
    const host = document.getElementById('wday-ribbon-view');
    if (!host) return;
    const events = allEvents().filter(matchesFilters);
    const f = timelineFigures();
    const dayStart = 7 * 60;
    const dayEnd = 25 * 60; /* 1am */
    const span = dayEnd - dayStart;

    const axis = [7, 9, 11, 13, 15, 17, 19, 21, 23, 25].map(h => {
      const label = h === 25 ? '1am' : (h < 12 ? h + 'am' : (h === 12 ? '12pm' : (h - 12) + 'pm'));
      return `<span style="left:${((h * 60 - dayStart) / span) * 100}%">${label}</span>`;
    }).join('');

    const blocks = BLOCK_ORDER.map(k => {
      const rows = (f.blockRows[k] || []).filter(e => matchesFilters(e));
      if (!rows.length) return null;
      const starts = rows.map(e => e.startMins).filter(m => m != null);
      const ends = rows.map(e => e.endMins != null ? e.endMins : e.startMins).filter(m => m != null);
      if (!starts.length) return null;
      const start = Math.min(...starts);
      const end = Math.max(...ends);
      const left = ((Math.max(start, dayStart) - dayStart) / span) * 100;
      const width = Math.max(2.5, ((Math.min(end, dayEnd) - Math.max(start, dayStart)) / span) * 100);
      const tight = k === 'portraits' || (k === 'close');
      const sample = rows.slice(0, 3).map(e => e.title).join(' · ');
      return `<button type="button" class="rd-wday-ribbon__bar${tight ? ' is-tight' : ''}" style="left:${left}%;width:${width}%" onclick="applyTimelineRailView('full');rdSetTimelineView('table')">` +
        `<strong>${esc(blockLabel(k))}</strong>` +
        `<span>${esc(fmtTimeFromMins(start) + ' – ' + fmtTimeFromMins(end))}</span>` +
        `<span>${esc(sample)}</span>` +
        `</button>`;
    }).filter(Boolean).join('');

    let gapsHtml = '';
    if (window._wdayShowSlack) {
      gapsHtml = f.gapList.map(g => {
        const left = ((g.startMins - dayStart) / span) * 100;
        const width = Math.max(1.2, (g.mins / span) * 100);
        return `<div class="rd-wday-ribbon__gap" style="left:${left}%;width:${width}%" title="${esc(g.label)}"></div>`;
      }).join('');
    }

    host.innerHTML =
      `<div class="rd-wday-ribbon__axis">${axis}</div>` +
      `<div class="rd-wday-ribbon__track">${gapsHtml}${blocks}</div>` +
      `<p class="rd-help">Amber marks a block with no slack. Block start times follow the durations inside them.</p>`;
  }

  /* ── By vendor (#31b) ────────────────────────────────────────────────── */

  function vendorGroups(events) {
    const map = {};
    events.forEach(e => {
      const key = (!e.vendor || e.vendor === '—' || e.unowned) ? '__none__' : e.vendor;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    const keys = Object.keys(map).sort((a, b) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return a.localeCompare(b);
    });
    return keys.map(k => {
      const rows = map[k].slice().sort((a, b) => (a.startMins ?? 9999) - (b.startMins ?? 9999));
      const start = rows.find(r => r.startMins != null);
      const end = [...rows].reverse().find(r => r.endMins != null || r.startMins != null);
      const windowLabel = start
        ? ('on site ' + start.timeLabel + (end ? ' – ' + (end.endMins != null ? fmtTimeFromMins(end.endMins) : end.timeLabel) : ''))
        : 'window TBD';
      return {
        key: k,
        title: k === '__none__' ? 'No vendor attached' : k,
        risk: k === '__none__',
        meta: k === '__none__'
          ? (rows.length + ' obligation' + (rows.length === 1 ? '' : 's') + ' nobody owns')
          : (windowLabel + ' · ' + rows.length + ' obligation' + (rows.length === 1 ? '' : 's')),
        rows: rows
      };
    }).filter(g => window._wdayShowUnowned || !g.risk);
  }

  function renderVendorView() {
    const host = document.getElementById('wday-vendor-view');
    if (!host) return;
    const events = allEvents().filter(matchesFilters);
    const groups = vendorGroups(events);
    if (!groups.length) {
      host.innerHTML = '<p class="rd-wday-empty-block">No vendor obligations in this view.</p>';
      return;
    }
    host.innerHTML = groups.map(g =>
      `<section class="rd-wday-vgroup${g.risk ? ' is-risk' : ''}">` +
      `<div class="rd-wday-vgroup__head">` +
      `<div class="rd-wday-vgroup__title">${esc(g.title)}</div>` +
      `<div class="rd-wday-vgroup__meta">${esc(g.meta)}</div>` +
      `</div>` +
      g.rows.map(e =>
        `<button type="button" class="rd-wday-vrow" onclick="rdWdayOpenDrawer('${esc(e.id)}')">` +
        `<span class="rd-wday-vrow__event">${esc(e.title)}</span>` +
        `<span class="rd-wday-vrow__owner">${esc(e.owner || '—')}</span>` +
        `<span class="rd-wday-vrow__time">${esc(e.timeLabel)}</span>` +
        `<span>${statusPill(e.status)}</span>` +
        `</button>`
      ).join('') +
      `</section>`
    ).join('');
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

  function runSheetCues(e) {
    /* Prefer ceremony order when this is the ceremony block */
    if (/ceremony/i.test(e.title) && Array.isArray(data.ceremonyOrder) && data.ceremonyOrder.length) {
      return data.ceremonyOrder.slice(0, 8).map((c, i) => ({
        time: c.time || c.start || e.timeLabel,
        label: c.moment || c.item || c.event || ('Cue ' + (i + 1))
      }));
    }
    if (Array.isArray(e.row.cues) && e.row.cues.length) {
      return e.row.cues.map(c => ({ time: c.time || '', label: c.label || c.cue || '' }));
    }
    /* Synthesize light cues from notes / duration */
    const cues = [];
    if (e.notes) {
      e.notes.split(/[;|]/).map(s => s.trim()).filter(Boolean).slice(0, 4).forEach((part, i) => {
        cues.push({ time: e.timeLabel, label: part });
      });
    }
    if (!cues.length) {
      cues.push({ time: e.timeLabel, label: e.title + ' begins' });
      if (e.endMins != null) cues.push({ time: fmtTimeFromMins(e.endMins), label: e.title + ' ends' });
    }
    return cues;
  }

  function renderTimelineDrawer() {
    const slot = document.getElementById('timeline-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._wdayDrawerId;
    const e = findEventById(id);
    if (!e) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._wdayDrawerTab, 10) || 0));
    const endLabel = e.endMins != null ? fmtTimeFromMins(e.endMins) : '—';

    let body = '';
    if (tab === 0) {
      body =
        field('Start', e.timeLabel) +
        field('Length', e.length) +
        field('Ends', endLabel) +
        field('Location', e.location || '—') +
        field('Owner', e.owner || 'Needs an owner') +
        field('Vendor', e.vendor !== '—' ? e.vendor + ' →' : '—', "typeof showPanel==='function'&&showPanel('vendors')") +
        `<p class="rd-drawer__note">A day event is a block, not a list of cues. The cues live on the Run sheet tab, which is what the coordinator prints.</p>`;
    } else if (tab === 1) {
      const people = [];
      if (e.owner) people.push({ name: e.owner, role: 'Owner' });
      if (e.vendor && e.vendor !== '—' && e.vendor !== e.owner) people.push({ name: e.vendor, role: 'Vendor' });
      if (e.isParty) people.push({ name: 'Wedding party', role: 'Present' });
      const guests = Array.isArray(data.guests) ? data.guests : [];
      const accepted = guests.filter(g => /^(yes|accept)/i.test(String(g.rsvp || ''))).length;
      body =
        `<div class="rd-drawer__section-title">Who is needed</div>` +
        (people.length ? people.map(p => `<div class="rd-drawer__guest">${esc(p.name)} <span>${esc(p.role)}</span></div>`).join('')
          : '<p class="rd-drawer__note">Nobody assigned yet.</p>') +
        `<p class="rd-drawer__note">Every name resolves to a guest or a vendor record, so the day-of contact sheet is generated rather than typed.</p>` +
        field('Guests invited', String(guests.length)) +
        field('Expected', String(accepted || '—'));
    } else if (tab === 2) {
      const cues = runSheetCues(e);
      body =
        `<div class="rd-drawer__section-title">Run sheet · ${cues.length} cue${cues.length === 1 ? '' : 's'}</div>` +
        cues.map(c => `<div class="rd-drawer__guest"><span>${esc(c.time)}</span><span style="color:#23211c;text-align:right">${esc(c.label)}</span></div>`).join('') +
        `<p class="rd-drawer__note">The run sheet is the Class A print for this block. Cues are minute-level; the block above is the only thing the timeline shows.</p>` +
        (e.unowned || /sound/i.test(e.title)
          ? `<p class="rd-drawer__note">Confirm who presses play / owns the cue before the day.</p>`
          : '');
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Created · ${esc(e.title)}</div></div>` +
        (e.lengthMins ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Length · ${esc(e.length)}</div></div>` : '') +
        `<p class="rd-drawer__note">History is provisional until change tracking lands for timeline rows. Length edits should shift later events as one change.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-wday-drawer" aria-label="Event">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Event · ${esc(blockLabel(e.block).toLowerCase())} block</div>` +
      `<h2 class="rd-drawer__title">${esc(e.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      statusPill(e.status) +
      `<span class="status-pill" data-pillscheme="gold">${esc(e.timeLabel)}${e.endMins != null ? ' – ' + esc(endLabel) : ''}</span>` +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdWdayCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdWdaySetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdWdayCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdWdayFullEditor('${esc(e.id)}')">Full editor</button>` +
      (tab === 0 ? `<button type="button" class="rd-btn" onclick="rdWdayShiftLater('${esc(e.id)}')">Shift later events</button>` : '') +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdWdayOpenDrawer(id) {
    window._wdayDrawerId = id;
    window._wdayDrawerTab = 0;
    renderTimelineDrawer();
  }
  function rdWdayCloseDrawer() {
    window._wdayDrawerId = null;
    const slot = document.getElementById('timeline-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdWdaySetDrawerTab(i) {
    window._wdayDrawerTab = i;
    renderTimelineDrawer();
  }
  function rdWdayAdd() {
    if (typeof addTimelineRow === 'function') addTimelineRow();
    else if (typeof openRecordEditor === 'function') openRecordEditor('timeline');
  }
  function rdWdayFullEditor(id) {
    const e = id ? findEventById(id) : findEventById(window._wdayDrawerId);
    window._wdayDrawerId = null;
    const slot = document.getElementById('timeline-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (e && e.src === 'vendor-arrival') {
      if (typeof showPanel === 'function') showPanel('vendors');
      return;
    }
    if (typeof openRecordEditor === 'function') {
      if (e && e.index != null) openRecordEditor('timeline', e.index);
      else openRecordEditor('timeline');
    }
  }
  function rdWdayLoadPreset() {
    if (typeof loadWdayTimelinePreset === 'function') loadWdayTimelinePreset();
  }
  function rdWdayPrint() {
    if (typeof openWdayTimelinePrint === 'function') openWdayTimelinePrint();
    else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdWdayExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Wedding Day Timeline', allEvents().map(e => ({
        time: e.timeLabel, length: e.length, event: e.title, vendor: e.vendor, status: e.status, owner: e.owner, location: e.location
      })));
    }
  }
  function rdWdayVendorPacket() {
    if (typeof showPanel === 'function') showPanel('packets');
  }
  function rdWdaySendVendors() {
    rdWdayPrint();
  }
  function rdWdayFillGap(afterId) {
    rdWdayOpenDrawer(afterId);
  }
  function rdWdayShiftLater(id) {
    const e = findEventById(id);
    if (!e || e.lengthMins == null) {
      if (typeof covAlert === 'function') covAlert('Set a length on this event before shifting later blocks.');
      return;
    }
    /* Soft note — real cascade lives with duration editing in Full editor */
    if (typeof showToast === 'function') showToast('Length changes shift later events when saved from the Full editor.', 'ok');
    rdWdayFullEditor(id);
  }
  function rdWdayCycleFilter(field) {
    const events = allEvents();
    const options = { all: true };
    if (field === 'block') BLOCK_ORDER.forEach(k => { options[k] = true; });
    if (field === 'owner') {
      options.__none__ = true;
      events.forEach(e => { if (e.owner) options[e.owner] = true; });
    }
    if (field === 'vendor') events.forEach(e => { if (e.vendor && e.vendor !== '—') options[e.vendor] = true; });
    const list = Object.keys(options);
    const cur = (window._wdayUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._wdayUiFilters[field] = list[(i + 1) % list.length];
    renderTimelineRd();
  }
  function rdWdayClearFilter(field) {
    window._wdayUiFilters[field] = 'all';
    renderTimelineRd();
  }
  function rdWdayToggleSlack() {
    window._wdayShowSlack = !window._wdayShowSlack;
    renderTimelineRd();
  }
  function rdWdayToggleUnowned() {
    window._wdayShowUnowned = !window._wdayShowUnowned;
    renderTimelineRd();
  }
  function rdWdayOpenColumns() {
    if (window.rdColumns && window.rdColumns.open) window.rdColumns.open(WDAY_COL_SCOPE);
  }
  function rdWdayAutoFit() {
    if (typeof autoFitColumns === 'function') {
      const table = document.querySelector('#wday-6b-table table');
      if (table) autoFitColumns(table);
    }
  }
  function rdWdayCycleRowHeight() {
    const order = ['compact', 'default', 'comfortable'];
    const i = order.indexOf(window._wdayRowHeight || 'compact');
    window._wdayRowHeight = order[(i + 1) % order.length];
    renderTimelineRd();
  }
  function rdWdayBulkClear() {
    window._wdaySel.clear();
    renderTableView();
    renderBulkBar();
  }
  async function rdWdayBulkOwner() {
    const ids = Array.from(window._wdaySel);
    if (!ids.length) return;
    const val = typeof covPrompt === 'function'
      ? await covPrompt('Set owner for selected events', { defaultValue: '', title: 'Owner' })
      : window.prompt('Set owner to:', '');
    if (val == null || val === '') return;
    ids.forEach(id => {
      const e = findEventById(id);
      if (!e || e.src !== 'timeline') return;
      e.row.responsible = val;
    });
    if (typeof save === 'function') save();
    renderTimelineRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderTimelineRd() {
    uedTimelineShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('timeline');
    applyViewMode();
    renderWdayStatsRd();
    renderWdayToolbar();
    renderBulkBar();

    const mode = window._wdayMode || 'table';
    if (mode === 'ribbon') renderRibbonView();
    else if (mode === 'vendor') renderVendorView();
    else renderTableView();
    renderTimelineDrawer();

    /* Scrub any leftover Auto-fit columns | Auto-fit rows twin buttons.
       Keep Sort / Filters / Columns · N of M / Auto-fit chip / Row height. */
    const panel = document.getElementById('panel-timeline');
    if (typeof window.removeLegacyAutofitPairButtons === 'function') {
      window.removeLegacyAutofitPairButtons(panel || document);
    }

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'timeline'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('timeline');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('timeline');
  }

  window.uedTimelineShell = uedTimelineShellRd;
  window.renderTimeline = renderTimelineRd;
  window.renderTimelinePage = renderTimelineRd;
  window.renderTimelineRd = renderTimelineRd;
  window.rdSetTimelineView = rdSetTimelineView;
  window.applyTimelineRailView = applyTimelineRailView;
  window.timelineRailCounts = timelineRailCounts;
  window.timelineFigures = timelineFigures;
  window.rdWdayOpenDrawer = rdWdayOpenDrawer;
  window.rdWdayCloseDrawer = rdWdayCloseDrawer;
  window.rdWdaySetDrawerTab = rdWdaySetDrawerTab;
  window.rdWdayAdd = rdWdayAdd;
  window.rdWdayFullEditor = rdWdayFullEditor;
  window.rdWdayLoadPreset = rdWdayLoadPreset;
  window.rdWdayPrint = rdWdayPrint;
  window.rdWdayExport = rdWdayExport;
  window.rdWdayVendorPacket = rdWdayVendorPacket;
  window.rdWdaySendVendors = rdWdaySendVendors;
  window.rdWdayFillGap = rdWdayFillGap;
  window.rdWdayShiftLater = rdWdayShiftLater;
  window.rdWdayCycleFilter = rdWdayCycleFilter;
  window.rdWdayClearFilter = rdWdayClearFilter;
  window.rdWdayToggleSlack = rdWdayToggleSlack;
  window.rdWdayToggleUnowned = rdWdayToggleUnowned;
  window.rdWdayOpenColumns = rdWdayOpenColumns;
  window.rdWdayAutoFit = rdWdayAutoFit;
  window.rdWdayCycleRowHeight = rdWdayCycleRowHeight;
  window.rdWdayBulkClear = rdWdayBulkClear;
  window.rdWdayBulkOwner = rdWdayBulkOwner;

  /* Bridge legacy helpers */
  window.wdayTab = function (name) {
    if (name === 'details' || name === 'table') rdSetTimelineView('table');
    else if (name === 'ribbon') rdSetTimelineView('ribbon');
    else if (name === 'vendor' || name === 'byvendor') rdSetTimelineView('vendor');
    else rdSetTimelineView('table');
  };
  if (typeof window.addWdayRow !== 'function') {
    window.addWdayRow = function () { rdWdayAdd(); };
  }
  if (typeof window.emailDaySchedule !== 'function') {
    window.emailDaySchedule = function () { rdWdayPrint(); };
  }

  function hookTimelinePanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.timeline = function () { renderTimelineRd(); };
    }
  }
  hookTimelinePanelRenderer();
  var _showPanelTimeline = window.showPanel;
  if (typeof _showPanelTimeline === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelTimeline.call(window, id, forceOpen);
      hookTimelinePanelRenderer();
      return out;
    };
  }
})();
