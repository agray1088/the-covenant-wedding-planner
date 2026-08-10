/* Shot Lists — All.dc #11b + Views #30l/#30m + Drawers batch 24 (Shot).
   Views: Table | Cards | By window.
   Rail: All shots · Must have · Group shots · At risk · Video only
         + By window meters + Group by List / Window / Supplier.
   Stats (table): Lists · Shots · Must have · Group shots · At risk.
   Columns: Shot · People · Window · Supplier · Priority.
   Drawer tabs: Shot · People · Timing · History.
   Data: shotlist (photo) · videoShots / videoShotlist (video). */
(function () {
  'use strict';

  window._shotMode = window._shotMode || 'table';
  window._shotRailView = window._shotRailView || 'all';
  window._shotGroupBy = window._shotGroupBy || 'list';
  window._shotUiFilters = window._shotUiFilters || { list: 'all', window: 'all', supplier: 'all', priority: 'all' };
  window._shotRowHeight = window._shotRowHeight || 'compact';
  window._shotDrawerId = window._shotDrawerId || null;
  window._shotDrawerTab = window._shotDrawerTab || 0;
  window._shotShowUnsched = window._shotShowUnsched !== false;
  window._shotMustOnly = !!window._shotMustOnly;
  window._shotSel = window._shotSel instanceof Set ? window._shotSel : new Set();

  const SHOT_COL_SCOPE = 'shotlist-11b';
  const SHOT_COLUMNS = [
    { key: 'shot', label: 'Shot', width: '240px' },
    { key: 'people', label: 'People', width: '200px' },
    { key: 'window', label: 'Window', width: '130px' },
    { key: 'supplier', label: 'Supplier', width: '140px' },
    { key: 'priority', label: 'Priority', width: '110px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(SHOT_COL_SCOPE, SHOT_COLUMNS.slice(), () => {
      if (typeof renderShotlistPage === 'function') renderShotlistPage();
    });
  }

  const DRAWER_TABS = ['Shot', 'People', 'Timing', 'History'];

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));

  function photoRows() {
    if (!window.data) window.data = {};
    if (!Array.isArray(data.shotlist)) data.shotlist = [];
    return data.shotlist;
  }
  function videoRows() {
    if (!window.data) window.data = {};
    if (Array.isArray(data.videoShots) && data.videoShots.length) return data.videoShots;
    if (!Array.isArray(data.videoShotlist)) data.videoShotlist = [];
    if (!Array.isArray(data.videoShots)) data.videoShots = data.videoShotlist;
    return data.videoShotlist;
  }

  function vendorName(kind) {
    const rows = Array.isArray(data.vendors) ? data.vendors : [];
    if (kind === 'video') {
      const v = rows.find(x => /video|film/i.test(String(x.cat || '') + ' ' + String(x.name || '')));
      return v ? (v.name || 'Videographer') : 'Videographer';
    }
    const v = rows.find(x => /photo/i.test(String(x.cat || '') + ' ' + String(x.name || '')));
    return v ? (v.name || 'Photographer') : 'Photographer';
  }

  function shotId(src, row, i) {
    if (row && row._id) return src + ':' + row._id;
    return src + ':idx:' + i;
  }
  function parseShotId(id) {
    if (!id) return null;
    const m = String(id).match(/^(shotlist|videoShots):(.*)$/);
    if (!m) return null;
    return { src: m[1], key: m[2] };
  }
  function findShotById(id) {
    const p = parseShotId(id);
    if (!p) return null;
    const rows = p.src === 'videoShots' ? videoRows() : photoRows();
    if (p.key.indexOf('idx:') === 0) {
      const i = parseInt(p.key.slice(4), 10);
      const row = rows[i];
      return row ? unifyShot(p.src, row, i) : null;
    }
    const i = rows.findIndex(r => String(r._id) === p.key);
    return i >= 0 ? unifyShot(p.src, rows[i], i) : null;
  }

  function parsePeople(text) {
    return String(text || '').split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean);
  }

  function guestByName(name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    const guests = Array.isArray(data.guests) ? data.guests : [];
    let g = guests.find(x => String(x.name || '').trim().toLowerCase() === n);
    if (g) return g;
    for (let i = 0; i < guests.length; i++) {
      const companions = Array.isArray(guests[i].companions) ? guests[i].companions : [];
      const c = companions.find(x => String(x.name || '').trim().toLowerCase() === n);
      if (c) return Object.assign({}, c, { rsvp: c.rsvp || guests[i].rsvp, _parent: guests[i] });
    }
    const party = Array.isArray(data.party) ? data.party : [];
    return party.find(x => String(x.name || '').trim().toLowerCase() === n) || null;
  }

  function isDeclined(g) {
    return !!(g && /^(no|declined|regret)/i.test(String(g.rsvp || '')));
  }
  function isAccepted(g) {
    return !!(g && /^(yes|accept)/i.test(String(g.rsvp || '')));
  }

  function listLabel(section, src) {
    if (src === 'videoShots') {
      const s = String(section || '').trim();
      if (/drone|exterior|message|guest/i.test(s)) return s || 'Video only';
      return s ? ('Video · ' + s) : 'Video only';
    }
    const s = String(section || '').trim();
    if (/family/i.test(s)) return 'Family formals';
    if (/detail|decor|décor/i.test(s)) return 'Detail & décor';
    if (/ceremony/i.test(s)) return 'Ceremony moments';
    if (/getting/i.test(s)) return 'Getting ready';
    if (/couple|portrait|golden/i.test(s)) return 'Couple portraits';
    if (/reception|cocktail/i.test(s)) return 'Reception';
    if (/send/i.test(s)) return 'Send-off';
    return s || 'Unlisted';
  }

  function windowLabel(timing, section) {
    const t = String(timing || '').trim();
    if (t) return t;
    if (typeof shotDefaultTiming === 'function') {
      const d = shotDefaultTiming(section);
      if (d) return d;
    }
    return '';
  }

  function windowBucket(win) {
    const w = String(win || '').toLowerCase();
    if (!w) return 'unscheduled';
    if (/getting|ready|pre-ceremony|detail|before/i.test(w)) return 'getting';
    if (/ceremony/i.test(w)) return 'ceremony';
    if (/golden|portrait|couple|family/i.test(w)) return 'golden';
    if (/reception|cocktail|send/i.test(w)) return 'reception';
    return 'other';
  }

  function unifyShot(src, row, i) {
    if (typeof normalizeShotRow === 'function') normalizeShotRow(row);
    const title = String(row.shot || '').trim() || 'Untitled shot';
    const peopleRaw = String(row.people || '').trim();
    const names = parsePeople(peopleRaw);
    const declined = [];
    names.forEach(n => {
      const g = guestByName(n);
      if (isDeclined(g)) declined.push(n);
    });
    const win = windowLabel(row.timing, row.section);
    const list = listLabel(row.section, src);
    let supplier = String(row.supplier || row.vendor || '').trim();
    if (!supplier) supplier = src === 'videoShots' ? vendorName('video') : vendorName('photo');

    let priority = '';
    if (typeof shotDefaultPriority === 'function') priority = shotDefaultPriority(row);
    else priority = row.priority || (row.must === 'Yes' ? 'Must-Have' : 'Important');
    const must = /must/i.test(priority) || row.must === 'Yes' || row.must === true;
    let displayPriority = must ? 'Must have' : (/optional/i.test(priority) ? 'Nice to have' : (priority || 'Important'));

    let atRisk = declined.length > 0;
    const notes = String(row.notes || '');
    if (/drone|permission|no (drone|permit)|cannot|won'?t happen|at risk/i.test(notes + ' ' + title)) atRisk = true;
    if (atRisk) displayPriority = 'At risk';

    const isGroup = names.length >= 3 || /family|household|both families|wedding party|group/i.test(title + ' ' + list);

    return {
      id: shotId(src, row, i),
      src: src,
      index: i,
      row: row,
      title: title,
      people: peopleRaw || '—',
      peopleNames: names,
      declined: declined,
      window: win,
      list: list,
      section: String(row.section || '').trim(),
      supplier: supplier,
      priority: displayPriority,
      must: must,
      atRisk: atRisk,
      isGroup: isGroup,
      isVideo: src === 'videoShots',
      unscheduled: !win,
      setting: row.setting || row.location || '',
      notes: notes,
      completed: typeof shotIsCompleted === 'function' ? shotIsCompleted(row) : !!row.completed,
      slot: row.slot || row.time || '',
      gatheredBy: row.gatheredBy || row.coordinator || ''
    };
  }

  function allShots() {
    const out = [];
    photoRows().forEach((r, i) => out.push(unifyShot('shotlist', r, i)));
    videoRows().forEach((r, i) => out.push(unifyShot('videoShots', r, i)));
    return out;
  }

  function uniqueLists(shots) {
    const set = new Set();
    shots.forEach(s => set.add(s.list));
    return set.size;
  }

  function namedPeopleStats(shots) {
    const named = new Set();
    shots.forEach(s => s.peopleNames.forEach(n => named.add(n.toLowerCase())));
    const guests = Array.isArray(data.guests) ? data.guests : [];
    let guestPool = guests.length;
    guests.forEach(g => {
      if (Array.isArray(g.companions)) guestPool += g.companions.length;
    });
    return { named: named.size, pool: Math.max(guestPool, named.size) };
  }

  /* ── figures / rail ──────────────────────────────────────────────────── */

  function shotlistFigures() {
    const shots = allShots();
    const must = shots.filter(s => s.must).length;
    const groups = shots.filter(s => s.isGroup).length;
    const risk = shots.filter(s => s.atRisk).length;
    const video = shots.filter(s => s.isVideo).length;
    const unscheduled = shots.filter(s => s.unscheduled).length;
    const unscheduledMust = shots.filter(s => s.unscheduled && s.must).length;
    const windows = new Set(shots.filter(s => s.window).map(s => s.window));
    const people = namedPeopleStats(shots);
    const byWin = { getting: 0, ceremony: 0, golden: 0, reception: 0 };
    shots.forEach(s => {
      const b = windowBucket(s.window);
      if (byWin[b] != null) byWin[b]++;
    });
    /* Tightest window heuristic: formals-heavy lists */
    const formals = shots.filter(s => /formal|family/i.test(s.list));
    let tightest = '—';
    let tightestHint = '';
    if (formals.length >= 8) {
      const secs = Math.max(30, Math.round((20 * 60) / formals.length));
      tightest = secs + ' sec / group';
      tightestHint = 'family formals';
    } else if (formals.length) {
      tightest = Math.round((20 * 60) / Math.max(formals.length, 1)) + ' sec / group';
      tightestHint = 'family formals';
    }
    return {
      lists: uniqueLists(shots),
      shots: shots.length,
      must: must,
      groups: groups,
      risk: risk,
      video: video,
      unscheduled: unscheduled,
      unscheduledMust: unscheduledMust,
      windows: windows.size,
      scheduled: shots.length - unscheduled,
      peopleNamed: people.named,
      peoplePool: people.pool,
      byWin: byWin,
      tightest: tightest,
      tightestHint: tightestHint,
      secondShooter: 'Not booked'
    };
  }

  function shotlistRailCounts() {
    const f = shotlistFigures();
    return {
      all: f.shots,
      must: f.must,
      groups: f.groups,
      risk: f.risk,
      video: f.video
    };
  }

  function matchesRail(s, view) {
    view = view || window._shotRailView || 'all';
    if (view === 'all') return true;
    if (view === 'must') return s.must;
    if (view === 'groups') return s.isGroup;
    if (view === 'risk') return s.atRisk;
    if (view === 'video') return s.isVideo;
    return true;
  }
  function matchesFilters(s) {
    const ui = window._shotUiFilters || {};
    if (ui.list && ui.list !== 'all' && String(s.list).toLowerCase() !== String(ui.list).toLowerCase()) return false;
    if (ui.window && ui.window !== 'all' && String(s.window || '').toLowerCase() !== String(ui.window).toLowerCase()) return false;
    if (ui.supplier && ui.supplier !== 'all' && String(s.supplier).toLowerCase() !== String(ui.supplier).toLowerCase()) return false;
    if (ui.priority && ui.priority !== 'all') {
      if (ui.priority === 'must-have' && !s.must) return false;
      else if (ui.priority !== 'must-have' && String(s.priority).toLowerCase() !== String(ui.priority).toLowerCase()) return false;
    }
    if (window._shotMustOnly && !s.must) return false;
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._shotMode || 'table';
    const starter = '<button type="button" class="rd-btn" onclick="rdShotLoadStarter()">Load a starter list</button>';
    if (mode === 'cards') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdShotPrint()">Print shot list</button>'
        + '<button type="button" class="rd-btn" onclick="rdShotFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdShotExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdShotAdd()">Add shot</button>';
    }
    if (mode === 'window') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdShotPrint()">Print by window</button>'
        + '<button type="button" class="rd-btn" onclick="rdShotFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="rdShotExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdShotAdd()">Add shot</button>';
    }
    return starter
      + '<button type="button" class="rd-btn" onclick="rdShotSendPhoto()">Send to photographer</button>'
      + '<button type="button" class="rd-btn" onclick="rdShotPrint()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdShotFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdShotExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdShotAdd()">Add shot</button>';
  }

  async function rdShotLoadStarter() {
    if (typeof rdChoose !== 'function') {
      if (typeof loadShotPreset === 'function') await loadShotPreset();
      renderShotlistRd();
      return;
    }
    const choice = await rdChoose('Load a starter list', ['Photo shot list', 'Video shot list']);
    if (choice === 'Photo shot list' && typeof loadShotPreset === 'function') await loadShotPreset();
    else if (choice === 'Video shot list' && typeof loadVideoShotPreset === 'function') await loadVideoShotPreset();
    renderShotlistRd();
  }
  window.rdShotLoadStarter = rdShotLoadStarter;

  function uedShotlistShellRd() {
    const panel = document.getElementById('panel-shotlist');
    if (!panel) return;
    panel.classList.add('ued-scope', 'shotlist-mockup');
    if (panel.dataset.uedShell === 'shotlist-rd11b') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'shotlist-rd11b';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Vendors</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Shot Lists</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="shotlist-stats" aria-label="Shot list summary"></div>
      <div class="rd-toolbar" id="shotlist-toolbar"></div>
      <div class="rd-bulkbar" id="shotlist-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="shotlist-surface-row">
          <div class="rd-surface__main" id="shotlist-view-host">
            <div class="rd-view" id="shot-view-table" data-shot-view="table">
              <div class="rd-table-wrap ued-table-wrap" id="shotlist-11b-table"></div>
              <div id="shotlist-risk-section" class="rd-shot-risk"></div>
              <span class="rd-table-foot ued-soft" id="shotlist-11b-foot"></span>
            </div>
            <div class="rd-view" id="shot-view-cards" data-shot-view="cards" hidden>
              <div id="shotlist-cards-view" class="rd-shot-cardgrid"></div>
            </div>
            <div class="rd-view" id="shot-view-window" data-shot-view="window" hidden>
              <div id="shotlist-window-view" class="rd-shot-windows"></div>
            </div>
          </div>
          <div id="shotlist-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderShotlistStatsRd() {
    const host = document.getElementById('shotlist-stats');
    if (!host) return;
    const f = shotlistFigures();
    const mode = window._shotMode || 'table';

    if (mode === 'cards') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Shots', value: String(f.shots) },
          { label: 'Must-have', value: String(f.must) },
          { label: 'People named', value: f.peopleNamed + ' of ' + f.peoplePool },
          { label: 'Unscheduled', value: String(f.unscheduled), attention: f.unscheduled ? 'no window' : undefined },
          { label: 'Tightest window', value: f.tightest, attention: f.tightestHint || undefined }
        ]);
        return;
      }
    }
    if (mode === 'window') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Shots', value: String(f.shots) },
          { label: 'Windows', value: String(f.windows) },
          { label: 'Scheduled', value: String(f.scheduled) },
          { label: 'Unscheduled must-haves', value: String(f.unscheduledMust), attention: f.unscheduledMust ? 'needs a window' : undefined },
          { label: 'Second shooter', value: f.secondShooter, attention: 'two locations' }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Lists', value: String(f.lists) },
        { label: 'Shots', value: String(f.shots) },
        { label: 'Must have', value: String(f.must) },
        { label: 'Group shots', value: String(f.groups) },
        { label: 'At risk', value: String(f.risk), attention: f.risk ? 'resolve before the day' : undefined }
      ]);
      return;
    }
    host.innerHTML = [
      ['Lists', f.lists],
      ['Shots', f.shots],
      ['Must have', f.must],
      ['Group shots', f.groups],
      ['At risk', f.risk]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._shotUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdShotCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdShotClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderShotlistToolbar() {
    const host = document.getElementById('shotlist-toolbar');
    if (!host) return;
    const mode = window._shotMode || 'table';
    let left = '';
    if (mode === 'cards') {
      left = filterChip('List', 'list') + filterChip('Priority', 'priority') +
        `<button type="button" class="rd-chip${window._shotMustOnly ? ' is-active' : ''}" onclick="rdShotToggleMustOnly()">Must-have only${window._shotMustOnly ? ' ✕' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by window', "rdShotOpenSort(this)") : '');
    } else if (mode === 'window') {
      left = filterChip('Window', 'window') + filterChip('Priority', 'priority') +
        `<button type="button" class="rd-chip${window._shotShowUnsched ? ' is-active' : ''}" onclick="rdShotToggleUnsched()">Show unscheduled${window._shotShowUnsched ? ' ✕' : ''}</button>` +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by time', "rdShotOpenSort(this)") : '');
    } else {
      left = filterChip('List', 'list') + filterChip('Window', 'window') + filterChip('Supplier', 'supplier') +
        (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by window', "rdShotOpenSort(this)") : '') +
        (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('shotlist') : '');
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Shot list view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'table' ? ' is-active' : ''}" onclick="rdSetShotlistView('table')">Table</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'cards' ? ' is-active' : ''}" onclick="rdSetShotlistView('cards')">Cards</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'window' ? ' is-active' : ''}" onclick="rdSetShotlistView('window')">By window</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('shotlist-bulk-bar');
    if (!host) return;
    const n = window._shotSel.size;
    if (!n || (window._shotMode || 'table') !== 'table') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdShotBulk('must')">Mark must-have</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdShotBulk('window')">Set window</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdShotBulk('supplier')">Assign supplier</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdShotPrint()">Print call sheet</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdShotBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._shotMode || 'table';
    ['table', 'cards', 'window'].forEach(name => {
      const el = document.getElementById('shot-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetShotlistView(mode) {
    window._shotMode = (mode === 'cards' || mode === 'window') ? mode : 'table';
    renderShotlistRd();
  }
  function applyShotlistRailView(viewId) {
    window._shotRailView = viewId || 'all';
    if (typeof setSavedView === 'function') setSavedView('shotlist', window._shotRailView);
    window._shotMode = 'table';
    renderShotlistRd();
  }
  function applyShotlistGroupBy(g) {
    window._shotGroupBy = g || 'list';
    renderShotlistRd();
  }

  /* ── Table ───────────────────────────────────────────────────────────── */

  function LIST_ORDER() {
    return [
      'Getting ready', 'Family formals', 'Detail & décor', 'Ceremony moments',
      'Couple portraits', 'Reception', 'Send-off', 'Video only'
    ];
  }

  function groupedShots(shots) {
    const by = window._shotGroupBy || 'list';
    if (by === 'window') {
      const map = {};
      shots.forEach(s => {
        const k = s.window || 'No window assigned';
        if (!map[k]) map[k] = [];
        map[k].push(s);
      });
      return Object.keys(map).sort((a, b) => {
        if (a === 'No window assigned') return 1;
        if (b === 'No window assigned') return -1;
        return a.localeCompare(b);
      }).map(k => ({ label: k + ' · ' + map[k].length + ' shot' + (map[k].length === 1 ? '' : 's'), rows: map[k], risk: k === 'No window assigned' }));
    }
    if (by === 'supplier') {
      const map = {};
      shots.forEach(s => {
        const k = s.supplier || '—';
        if (!map[k]) map[k] = [];
        map[k].push(s);
      });
      return Object.keys(map).sort().map(k => ({
        label: k + ' · ' + map[k].length + ' shot' + (map[k].length === 1 ? '' : 's'),
        rows: map[k]
      }));
    }
    /* list */
    const map = {};
    shots.forEach(s => {
      const k = s.list || 'Unlisted';
      if (!map[k]) map[k] = [];
      map[k].push(s);
    });
    const order = LIST_ORDER();
    const keys = Object.keys(map).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map(k => {
      const rows = map[k];
      const must = rows.filter(s => s.must).length;
      let sub = rows.length + ' shot' + (rows.length === 1 ? '' : 's');
      if (/formal/i.test(k) && rows.length >= 8) sub += ' · 12 min allowed';
      else if (must) sub += ' · ' + must + ' must have';
      return { label: k + ' · ' + sub, rows: rows, risk: /video only/i.test(k) && rows.some(s => s.atRisk) };
    });
  }

  function priorityPill(p) {
    if (!p) return '—';
    const scheme = p === 'Must have' ? 'green' : p === 'At risk' ? 'red' : (/nice|optional/i.test(p) ? 'gold' : 'gold');
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(p)}</span>`;
  }

  function peopleCell(s) {
    if (!s.peopleNames.length) return '—';
    if (s.declined.length) {
      return `${esc(s.peopleNames.length + ' named guests')} · <span class="rd-shot-warn">${esc(s.declined.length + ' declined')}</span>`;
    }
    if (s.peopleNames.length > 4) return esc(s.peopleNames.length + ' named guests');
    return esc(s.people);
  }

  function renderShotTable() {
    const host = document.getElementById('shotlist-11b-table');
    const foot = document.getElementById('shotlist-11b-foot');
    if (!host) return;
    const shots = allShots().filter(s => matchesRail(s) && matchesFilters(s));
    const groups = groupedShots(shots);
    const dens = window._shotRowHeight || 'compact';

    let html = `<table class="rd-shot-table rd-shot-table--${esc(dens)}"><thead><tr>` +
      `<th class="rd-shot-th-check"></th>` +
      SHOT_COLUMNS.map(c => `<th>${esc(c.label)}</th>`).join('') +
      `</tr></thead><tbody>`;

    if (!groups.length) {
      html += `<tr class="rd-shot-empty"><td colspan="6">No shots in this view yet. <button type="button" class="rd-btn rd-btn--quiet" onclick="rdShotLoadStarter()">Load a starter list</button> or add a shot.</td></tr>`;
    } else {
      groups.forEach(g => {
        html += `<tr class="rd-shot-group${g.risk ? ' is-risk' : ''}"><td colspan="6">${esc(g.label)}</td></tr>`;
        g.rows.forEach(s => {
          const sel = window._shotSel.has(s.id);
          html += `<tr class="rd-shot-row${sel ? ' is-selected' : ''}${s.atRisk ? ' is-risk' : ''}" data-shot-id="${esc(s.id)}" onclick="rdShotOpenDrawer('${esc(s.id)}')">` +
            `<td class="rd-shot-check" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="rdShotToggleSel('${esc(s.id)}')" aria-label="Select shot"></td>` +
            `<td><div class="rd-shot-name">${esc(s.title)}` +
            `<span class="rd-shot-row__actions">` +
            `<button type="button" onclick="event.stopPropagation();rdShotOpenDrawer('${esc(s.id)}')" title="Open · O">Open</button>` +
            `<button type="button" onclick="event.stopPropagation();rdShotFullEditor('${esc(s.id)}')" title="Full editor · E">Full editor</button>` +
            `</span></div></td>` +
            `<td>${peopleCell(s)}</td>` +
            `<td>${esc(s.window || '—')}</td>` +
            `<td>${esc(s.supplier)}</td>` +
            `<td>${priorityPill(s.priority)}</td>` +
            `</tr>`;
        });
      });
    }
    html += `<tr class="rd-shot-add"><td colspan="6"><button type="button" class="rd-shot-addbtn" onclick="rdShotAdd()"><span>+</span> Add a shot</button></td></tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = shots.length ? (shots.length + ' shot' + (shots.length === 1 ? '' : 's') + ' in view') : '';
    renderRiskSection();
  }

  function riskCards() {
    return allShots().filter(s => s.atRisk);
  }

  function renderRiskSection() {
    const host = document.getElementById('shotlist-risk-section');
    if (!host) return;
    const risks = riskCards();
    if (!risks.length) {
      host.innerHTML = '';
      return;
    }
    const resolveLabel = risks.length === 1 ? 'Resolve' : 'Resolve both';
    host.innerHTML =
      `<div class="rd-section__head">` +
      `<div class="rd-pagehead__eyebrow">At risk · ${risks.length}</div>` +
      `<p class="rd-help">The photographer cannot fix these on the day</p>` +
      `<button type="button" class="rd-btn rd-btn--quiet" style="margin-left:auto" onclick="rdShotResolveRisks()">${esc(resolveLabel)}</button>` +
      `</div>` +
      `<div class="rd-shot-riskgrid">` +
      risks.slice(0, 6).map(s => {
        let body = s.notes || '';
        if (s.declined.length) {
          body = 'One named person declined — ' + s.declined.join(', ') + '. The shot as written cannot be taken.';
        } else if (!body) {
          body = 'This shot is flagged at risk. Open it to resolve the constraint before the day.';
        }
        const cta = s.declined.length ? 'Edit the people list' : (/drone|permission/i.test(s.title + ' ' + s.notes) ? 'Request permission' : 'Open shot');
        return `<article class="rd-shot-riskcard" onclick="rdShotOpenDrawer('${esc(s.id)}')">` +
          `<div class="rd-shot-riskcard__title">${esc(s.title)}</div>` +
          `<p>${esc(body)}</p>` +
          `<button type="button" class="rd-btn rd-btn--quiet" onclick="event.stopPropagation();rdShotOpenDrawer('${esc(s.id)}')">${esc(cta)}</button>` +
          `</article>`;
      }).join('') +
      `</div>`;
  }

  /* ── Cards view (#30l) ───────────────────────────────────────────────── */

  function cardGroups(shots) {
    const buckets = [
      { id: 'ready-bride', title: 'Getting ready · bride', match: s => /getting/i.test(s.list + ' ' + s.window) && /bride|her|suite/i.test(s.title + ' ' + s.people), meta: 'suite' },
      { id: 'ready-groom', title: 'Getting ready · groom', match: s => /getting/i.test(s.list + ' ' + s.window) && /groom|his|house|ties|brothers/i.test(s.title + ' ' + s.people), meta: 'house' },
      { id: 'ceremony', title: 'Ceremony', match: s => /ceremony/i.test(s.list + ' ' + s.window) && !s.isVideo, meta: 'chapel' },
      { id: 'formals', title: 'Family formals', match: s => /formal|family/i.test(s.list), meta: 'after ceremony' },
      { id: 'portraits', title: 'Couple portraits', match: s => /couple|portrait|golden/i.test(s.list + ' ' + s.window), meta: 'garden' },
      { id: 'reception', title: 'Reception', match: s => /reception|cocktail/i.test(s.list + ' ' + s.window), meta: 'hall' },
      { id: 'details', title: 'Details & decor', match: s => /detail|décor|decor/i.test(s.list), meta: 'before guests arrive' },
      { id: 'unscheduled', title: 'Not assigned to a window', match: s => s.unscheduled, meta: '', risk: true }
    ];
    const used = new Set();
    const cards = [];
    buckets.forEach(b => {
      const rows = shots.filter(s => {
        if (used.has(s.id) && b.id !== 'unscheduled') return false;
        const ok = b.match(s);
        if (ok && b.id !== 'unscheduled') used.add(s.id);
        return ok;
      });
      if (!rows.length && b.id !== 'unscheduled') return;
      if (!rows.length) return;
      rows.forEach(s => used.add(s.id));
      const people = new Set();
      rows.forEach(s => s.peopleNames.forEach(n => people.add(n)));
      const must = rows.filter(s => s.must).length;
      const done = rows.filter(s => s.completed).length;
      let status = 'On track';
      if (b.risk) status = 'No time';
      else if (/formal/i.test(b.title) && rows.length >= 10) status = 'Tight window';
      else if (rows.some(s => s.isVideo) && /ceremony/i.test(b.title)) status = 'Photographer + film';
      cards.push({
        id: b.id,
        title: b.title,
        count: rows.length,
        meta: b.meta,
        status: status,
        people: people.size,
        must: must,
        done: done,
        risk: !!b.risk || status === 'Tight window',
        rows: rows,
        windowHint: rows.find(s => s.window)?.window || (b.risk ? '' : '—'),
        feasibility: /formal/i.test(b.title) && rows.length >= 8
          ? { label: 'Time per group', value: Math.round((20 * 60) / rows.length) + ' sec' }
          : null
      });
    });
    /* leftover */
    const leftover = shots.filter(s => !used.has(s.id));
    if (leftover.length) {
      const people = new Set();
      leftover.forEach(s => s.peopleNames.forEach(n => people.add(n)));
      cards.push({
        id: 'other',
        title: 'Other lists',
        count: leftover.length,
        meta: '',
        status: 'On track',
        people: people.size,
        must: leftover.filter(s => s.must).length,
        done: leftover.filter(s => s.completed).length,
        risk: false,
        rows: leftover,
        windowHint: leftover.find(s => s.window)?.window || '—',
        feasibility: null
      });
    }
    return cards;
  }

  function renderCardsView() {
    const host = document.getElementById('shotlist-cards-view');
    if (!host) return;
    const shots = allShots().filter(s => matchesRail(s) && matchesFilters(s));
    const cards = cardGroups(shots);
    if (!cards.length) {
      host.innerHTML = '<p class="rd-shot-empty-block">No lists to brief yet. Add shots to build photographer cards.</p>';
      return;
    }
    host.innerHTML = cards.map(c => {
      const cls = c.risk ? ' is-risk' : '';
      return `<article class="rd-shot-listcard${cls}" onclick="rdSetShotlistView('table');applyShotlistRailView('${c.risk ? 'risk' : 'all'}')">` +
        `<div class="rd-shot-listcard__head">` +
        `<div class="rd-shot-listcard__title">${esc(c.title)}</div>` +
        `<span class="status-pill" data-pillscheme="${c.risk ? 'red' : 'green'}">${esc(c.status)}</span>` +
        `</div>` +
        `<div class="rd-shot-listcard__sub">${esc(c.count + ( /formal/i.test(c.title) ? ' groupings' : ' shots'))}${c.meta ? ' · ' + esc(c.meta) : ''}</div>` +
        `<div class="rd-shot-listcard__grid">` +
        `<div><span>People named</span><strong>${c.people}</strong></div>` +
        `<div><span>Must-have</span><strong>${c.must}</strong></div>` +
        (c.feasibility
          ? `<div><span>${esc(c.feasibility.label)}</span><strong>${esc(c.feasibility.value)}</strong></div>`
          : `<div><span>Window</span><strong>${esc(c.windowHint || '—')}</strong></div>`) +
        `<div><span>Shot</span><strong>${c.done} of ${c.count}</strong></div>` +
        `</div>` +
        (c.risk ? `<p class="rd-shot-listcard__warn">Risk · may not happen</p>` : '') +
        `</article>`;
    }).join('');
  }

  /* ── By window view (#30m) ───────────────────────────────────────────── */

  function windowGroups(shots) {
    const order = [
      { key: 'getting', label: 'Getting ready', match: s => windowBucket(s.window) === 'getting' },
      { key: 'details', label: 'Details & arrivals', match: s => /before|detail|pre-ceremony|arrival/i.test(s.window) && windowBucket(s.window) !== 'getting' },
      { key: 'ceremony', label: 'Ceremony', match: s => windowBucket(s.window) === 'ceremony' },
      { key: 'formals', label: 'Family formals', match: s => /family|formal|portrait/i.test(s.window) || (/formal|family/i.test(s.list) && s.window) },
      { key: 'golden', label: 'Golden hour', match: s => /golden/i.test(s.window) },
      { key: 'reception', label: 'Reception', match: s => windowBucket(s.window) === 'reception' },
      { key: 'unscheduled', label: 'No window assigned', match: s => s.unscheduled, risk: true }
    ];
    const used = new Set();
    const groups = [];
    order.forEach(o => {
      const rows = shots.filter(s => {
        if (o.risk) return o.match(s);
        if (used.has(s.id)) return false;
        const ok = o.match(s);
        if (ok) used.add(s.id);
        return ok;
      });
      if (o.risk) {
        if (!window._shotShowUnsched && !rows.length) return;
        if (!rows.length) return;
      } else if (!rows.length) return;
      const locs = new Set(rows.map(s => s.setting || s.list).filter(Boolean));
      let constraint = '';
      if (o.risk) constraint = rows.filter(s => s.must).length + ' of them must-have';
      else if (o.key === 'formals') constraint = rows.length + ' groupings · tight window';
      else if (o.key === 'ceremony') constraint = 'both photographer and film';
      else if (o.key === 'getting') constraint = locs.size + ' location' + (locs.size === 1 ? '' : 's') + ' · 1 photographer';
      else if (o.key === 'details') constraint = 'blocked until florals are installed';
      else constraint = rows.length + ' shot' + (rows.length === 1 ? '' : 's');
      const winLabel = rows.find(s => s.window)?.window || o.label;
      groups.push({
        key: o.key,
        label: (o.risk ? 'No window assigned' : winLabel) + ' · ' + o.label,
        count: rows.length,
        locs: [...locs].slice(0, 3).join(', ') || '—',
        constraint: constraint,
        risk: !!o.risk,
        rows: rows
      });
    });
    return groups;
  }

  function renderWindowView() {
    const host = document.getElementById('shotlist-window-view');
    if (!host) return;
    let shots = allShots().filter(s => matchesRail(s) && matchesFilters(s));
    if (!window._shotShowUnsched) shots = shots.filter(s => !s.unscheduled);
    const groups = windowGroups(shots).filter(g => window._shotShowUnsched || !g.risk);
    if (!groups.length) {
      host.innerHTML = '<p class="rd-shot-empty-block">No timed windows yet. Set a window on each shot for the day-of order.</p>';
      return;
    }
    host.innerHTML = groups.map(g => {
      return `<section class="rd-shot-wingroup${g.risk ? ' is-risk' : ''}">` +
        `<div class="rd-shot-wingroup__head">` +
        `<div class="rd-shot-wingroup__title">${esc(g.label)}</div>` +
        `<div class="rd-shot-wingroup__meta">${esc(g.count + ' shots · ' + g.locs + ' · ' + g.constraint)}</div>` +
        `</div>` +
        `<div class="rd-shot-wintable">` +
        g.rows.slice(0, 8).map(s =>
          `<button type="button" class="rd-shot-winrow" onclick="rdShotOpenDrawer('${esc(s.id)}')">` +
          `<span class="rd-shot-winrow__shot">${esc(s.title)}${s.must ? ' · must-have' : ''}</span>` +
          `<span class="rd-shot-winrow__people">${esc(s.peopleNames.length ? s.peopleNames.length + ' people' : 'Nobody needed')}</span>` +
          `<span class="rd-shot-winrow__time">${esc(s.slot || s.window || '—')}</span>` +
          `<span>${priorityPill(s.priority)}</span>` +
          `</button>`
        ).join('') +
        (g.rows.length > 8 ? `<div class="rd-shot-winmore">${g.rows.length - 8} further shots · listed in the table view</div>` : '') +
        `</div></section>`;
    }).join('');
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

  function renderShotlistDrawer() {
    const slot = document.getElementById('shotlist-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._shotDrawerId;
    const shot = findShotById(id);
    if (!shot) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._shotDrawerTab, 10) || 0));

    let body = '';
    if (tab === 0) {
      body =
        field('List', shot.list) +
        field('Window', shot.window || '—') +
        field('Supplier', shot.supplier + (shot.supplier !== '—' ? ' →' : ''), "typeof showPanel==='function'&&showPanel('vendors')") +
        field('Priority', shot.priority) +
        field('Setting', shot.setting || '—') +
        (shot.notes
          ? `<p class="rd-drawer__note">${esc(shot.notes)}</p>`
          : `<p class="rd-drawer__note">The setting matters more than the shot list realises — note light direction and gather points on the call sheet.</p>`);
    } else if (tab === 1) {
      const peopleHtml = shot.peopleNames.length
        ? shot.peopleNames.map(n => {
          const g = guestByName(n);
          let st = '—';
          if (g) {
            if (isDeclined(g)) st = 'Declined';
            else if (isAccepted(g)) st = 'Accepted';
            else st = String(g.rsvp || 'Pending');
          }
          const scheme = st === 'Declined' ? 'red' : st === 'Accepted' ? 'green' : 'gold';
          return `<div class="rd-drawer__guest">${esc(n)} <span class="status-pill" data-pillscheme="${scheme}">${esc(st)}</span></div>`;
        }).join('')
        : '<p class="rd-drawer__note">Nobody named yet — pick guests so a declined RSVP surfaces before the day.</p>';
      const f = shotlistFigures();
      body =
        `<div class="rd-drawer__section-title">People · ${shot.peopleNames.length}</div>` +
        peopleHtml +
        `<p class="rd-drawer__note">Every name is a guest record, so a declined RSVP shows here before the day rather than on the chapel steps.</p>` +
        `<div class="rd-drawer__section-title">Elsewhere on the list</div>` +
        field('Group shots', String(f.groups)) +
        field('At risk', String(f.risk));
    } else if (tab === 2) {
      body =
        field('Slot', shot.slot || shot.window || '—') +
        field('Gathered by', shot.gatheredBy || '—') +
        field('Window', shot.window || 'Unscheduled') +
        field('Timeline', shot.window ? 'Wedding Day Timeline →' : '—', "typeof showPanel==='function'&&showPanel('timeline')") +
        (shot.unscheduled
          ? `<p class="rd-drawer__note">A must-have shot with no time is the highest-value warning this page can give.</p>`
          : `<p class="rd-drawer__note">Reordering inside a fixed window only changes who waits — the window itself is set by the Wedding Day Timeline.</p>`);
    } else {
      body =
        `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added${shot.must ? ' · must have' : ''}${shot.window ? ' · ' + esc(shot.window) : ''}</div></div>` +
        (shot.setting ? `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Setting · ${esc(shot.setting)}</div></div>` : '') +
        `<p class="rd-drawer__note">History is provisional until change tracking lands for shot rows.</p>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-shot-drawer" aria-label="Shot">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Shot · ${esc(shot.list.toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(shot.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      priorityPill(shot.priority) +
      (shot.peopleNames.length ? `<span class="status-pill" data-pillscheme="gold">${shot.peopleNames.length} people</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdShotCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdShotSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdShotCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdShotFullEditor('${esc(shot.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdShotOpenDrawer(id) {
    window._shotDrawerId = id;
    window._shotDrawerTab = 0;
    renderShotlistDrawer();
  }
  function rdShotCloseDrawer() {
    window._shotDrawerId = null;
    const slot = document.getElementById('shotlist-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdShotSetDrawerTab(i) {
    window._shotDrawerTab = i;
    renderShotlistDrawer();
  }
  function rdShotAdd() {
    if (typeof openRecordEditor === 'function') openRecordEditor('shotlist');
    else if (typeof addShotRow === 'function') addShotRow();
  }
  function rdShotFullEditor(id) {
    const shot = id ? findShotById(id) : findShotById(window._shotDrawerId);
    window._shotDrawerId = null;
    const slot = document.getElementById('shotlist-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (shot) openRecordEditor(shot.src, shot.index);
      else openRecordEditor('shotlist');
    }
  }
  function rdShotSendPhoto() {
    if (typeof openPrintView === 'function') {
      const shots = allShots().filter(s => !s.isVideo);
      let html = '<h2 class="pv-section">Photo shot list</h2><table class="pv-table"><thead><tr><th>Shot</th><th>People</th><th>Window</th><th>Priority</th></tr></thead><tbody>';
      shots.forEach(s => {
        html += `<tr><td>${esc(s.title)}</td><td>${esc(s.people)}</td><td>${esc(s.window || '—')}</td><td>${esc(s.priority)}</td></tr>`;
      });
      html += '</tbody></table>';
      openPrintView('Shot list for photographer', html, { subtitle: vendorName('photo') });
    } else if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdShotPrint() {
    if (typeof printCurrentPage === 'function') printCurrentPage();
    else window.print();
  }
  function rdShotExport() {
    if (typeof exportSectionCSV === 'function') {
      exportSectionCSV('Shot Lists', allShots().map(s => ({
        shot: s.title, people: s.people, window: s.window, supplier: s.supplier, priority: s.priority, list: s.list, type: s.isVideo ? 'Video' : 'Photo'
      })));
    }
  }
  function rdShotResolveRisks() {
    const risks = riskCards();
    if (risks[0]) rdShotOpenDrawer(risks[0].id);
  }
  function rdShotCycleFilter(field) {
    const shots = allShots();
    const options = { all: true };
    if (field === 'list') shots.forEach(s => { if (s.list) options[s.list] = true; });
    if (field === 'window') shots.forEach(s => { if (s.window) options[s.window] = true; });
    if (field === 'supplier') shots.forEach(s => { if (s.supplier) options[s.supplier] = true; });
    if (field === 'priority') {
      options['must-have'] = true;
      shots.forEach(s => { if (s.priority) options[s.priority] = true; });
    }
    const list = Object.keys(options);
    const cur = (window._shotUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._shotUiFilters[field] = list[(i + 1) % list.length];
    renderShotlistRd();
  }
  function rdShotClearFilter(field) {
    window._shotUiFilters[field] = 'all';
    renderShotlistRd();
  }
  function rdShotToggleMustOnly() {
    window._shotMustOnly = !window._shotMustOnly;
    renderShotlistRd();
  }
  function rdShotToggleUnsched() {
    window._shotShowUnsched = !window._shotShowUnsched;
    renderShotlistRd();
  }
  function rdShotOpenColumns() {
    if (window.rdColumns && window.rdColumns.open) window.rdColumns.open(SHOT_COL_SCOPE);
  }
  function rdShotAutoFit() {
    if (typeof autoFitColumns === 'function') {
      const table = document.querySelector('#shotlist-11b-table table');
      if (table) autoFitColumns(table);
    }
  }
  function rdShotCycleRowHeight() {
    const order = ['compact', 'default', 'comfortable'];
    const i = order.indexOf(window._shotRowHeight || 'compact');
    window._shotRowHeight = order[(i + 1) % order.length];
    renderShotlistRd();
  }
  function rdShotToggleSel(id) {
    if (window._shotSel.has(id)) window._shotSel.delete(id);
    else window._shotSel.add(id);
    renderShotTable();
    renderBulkBar();
  }
  function rdShotBulkClear() {
    window._shotSel.clear();
    renderShotTable();
    renderBulkBar();
  }
  async function rdShotBulk(action) {
    const ids = Array.from(window._shotSel);
    if (!ids.length) return;
    if (action === 'must') {
      ids.forEach(id => {
        const s = findShotById(id);
        if (!s) return;
        s.row.must = 'Yes';
        s.row.priority = 'Must-Have';
      });
    } else if (action === 'window' || action === 'supplier') {
      const label = action === 'window' ? 'Window' : 'Supplier';
      const val = typeof covPrompt === 'function'
        ? await covPrompt('Set ' + label.toLowerCase() + ' for selected shots', { defaultValue: '', title: label })
        : '';
      if (val == null) return;
      ids.forEach(id => {
        const s = findShotById(id);
        if (!s) return;
        if (action === 'window') s.row.timing = val;
        else s.row.supplier = val;
      });
    }
    if (typeof save === 'function') save();
    renderShotlistRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderShotlistRd() {
    uedShotlistShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('shotlist');
    applyViewMode();
    renderShotlistStatsRd();
    renderShotlistToolbar();
    renderBulkBar();

    const mode = window._shotMode || 'table';
    if (mode === 'cards') renderCardsView();
    else if (mode === 'window') renderWindowView();
    else renderShotTable();
    renderShotlistDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'shotlist'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('shotlist');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('shotlist');
  }

  window.uedShotlistShell = uedShotlistShellRd;
  window.renderShotlistPage = renderShotlistRd;
  window.renderShotlistRd = renderShotlistRd;
  window.rdSetShotlistView = rdSetShotlistView;
  window.applyShotlistRailView = applyShotlistRailView;
  window.applyShotlistGroupBy = applyShotlistGroupBy;
  window.shotlistRailCounts = shotlistRailCounts;
  window.shotlistFigures = shotlistFigures;
  window.rdShotOpenDrawer = rdShotOpenDrawer;
  window.rdShotCloseDrawer = rdShotCloseDrawer;
  window.rdShotSetDrawerTab = rdShotSetDrawerTab;
  window.rdShotAdd = rdShotAdd;
  window.rdShotFullEditor = rdShotFullEditor;
  window.rdShotSendPhoto = rdShotSendPhoto;
  window.rdShotPrint = rdShotPrint;
  window.rdShotExport = rdShotExport;
  window.rdShotResolveRisks = rdShotResolveRisks;
  window.rdShotCycleFilter = rdShotCycleFilter;
  window.rdShotClearFilter = rdShotClearFilter;
  window.rdShotToggleMustOnly = rdShotToggleMustOnly;
  window.rdShotToggleUnsched = rdShotToggleUnsched;
  window.rdShotOpenColumns = rdShotOpenColumns;
  window.rdShotAutoFit = rdShotAutoFit;
  window.rdShotCycleRowHeight = rdShotCycleRowHeight;
  window.rdShotToggleSel = rdShotToggleSel;
  window.rdShotBulkClear = rdShotBulkClear;
  window.rdShotBulk = rdShotBulk;

  /* Bridge legacy photo/video tabs into rail filters */
  window.shotlistTab = function (name) {
    if (name === 'video') applyShotlistRailView('video');
    else applyShotlistRailView('all');
  };

  function hookShotlistPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.shotlist = function () { renderShotlistRd(); };
    }
  }
  hookShotlistPanelRenderer();
  var _showPanelShot = window.showPanel;
  if (typeof _showPanelShot === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelShot.call(window, id, forceOpen);
      hookShotlistPanelRenderer();
      return out;
    };
  }
})();
