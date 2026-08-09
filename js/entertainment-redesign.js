/* Entertainment — All.dc #10d + Views #30j/#30k + Drawers batch 24 (Song).
   Views: Set list | Performers | Timeline.
   Rail: Full set list · Must play · Do not play · Unplaced · Ceremony music
         + Coverage meters + Group by Moment/Performer/Source.
   Stats: Performers · Songs · Must play · Do not play · Music spend.
   Set list columns: Song · Artist · Moment · Performer · Source · Flag.
   Drawer tabs: Song · Moment · Performer · History.
   Data: entertainment (acts) · recSongs · receptionPlaylist · doNotPlay · mustPlay · speeches. */
(function () {
  'use strict';

  window._entMode = window._entMode || 'setlist';
  window._entRailView = window._entRailView || 'full';
  window._entGroupBy = window._entGroupBy || 'moment';
  window._entUiFilters = window._entUiFilters || { moment: 'all', performer: 'all', source: 'all', type: 'all', status: 'all', act: 'all' };
  window._entRowHeight = window._entRowHeight || 'compact';
  window._entDrawerId = window._entDrawerId || null;
  window._entDrawerTab = window._entDrawerTab || 0;
  window._entShowUnfilled = window._entShowUnfilled !== false;
  window._entShowLoadIn = window._entShowLoadIn !== false;
  window._entSel = window._entSel instanceof Set ? window._entSel : new Set();

  const ENT_COL_SCOPE = 'entertainment-10d';
  const ENT_COLUMNS = [
    { key: 'song', label: 'Song', width: '220px' },
    { key: 'artist', label: 'Artist', width: '140px' },
    { key: 'moment', label: 'Moment', width: '140px' },
    { key: 'performer', label: 'Performer', width: '140px' },
    { key: 'source', label: 'Source', width: '100px' },
    { key: 'flag', label: 'Flag', width: '110px' }
  ];
  if (window.rdColumns) {
    window.rdColumns.register(ENT_COL_SCOPE, ENT_COLUMNS.slice(), () => {
      if (typeof renderEntertainmentPage === 'function') renderEntertainmentPage();
    });
  }

  const DRAWER_TABS = ['Song', 'Moment', 'Performer', 'History'];
  const CEREMONY_MOMENTS = /ceremony|processional|recessional|prelude|unity|vows|interlude|aisle|kora/i;
  const RECEPTION_MOMENTS = /reception|first dance|father|mother|party|entrance|cake|bouquet|last dance|cocktail|dinner|bouquet|garter/i;

  const esc = s => (typeof escapeHtml === 'function'
    ? escapeHtml(s == null ? '' : String(s))
    : String(s == null ? '' : s));
  function money0(n) {
    return '$' + Math.round(parseFloat(n) || 0).toLocaleString();
  }
  function arr(key) {
    if (!window.data) window.data = {};
    if (!Array.isArray(data[key])) data[key] = [];
    return data[key];
  }

  /* ── unified song model ──────────────────────────────────────────────── */

  function songId(src, row, i) {
    if (row && row._id) return src + ':' + row._id;
    return src + ':idx:' + i;
  }
  function parseSongId(id) {
    if (!id) return null;
    const m = String(id).match(/^(recSongs|receptionPlaylist|doNotPlay|mustPlay):(.*)$/);
    if (!m) return null;
    return { src: m[1], key: m[2] };
  }
  function findSongById(id) {
    const p = parseSongId(id);
    if (!p) return null;
    const rows = arr(p.src);
    if (p.key.indexOf('idx:') === 0) {
      const i = parseInt(p.key.slice(4), 10);
      const row = rows[i];
      return row ? unifySong(p.src, row, i) : null;
    }
    const i = rows.findIndex(r => String(r._id) === p.key);
    return i >= 0 ? unifySong(p.src, rows[i], i) : null;
  }

  function unifySong(src, row, i) {
    const title = String((row.song || row.title || '')).trim() || 'Untitled song';
    const artist = String(row.artist || '').trim() || '—';
    let moment = String(row.moment || row.assignment || '').trim();
    let flag = '';
    let source = String(row.source || '').trim();
    let performer = String(row.performer || row.assignment || '').trim();

    if (src === 'doNotPlay') {
      flag = 'Do not play';
      moment = moment || '—';
      source = source || 'Couple';
    } else if (src === 'mustPlay') {
      flag = 'Must play';
      moment = moment || '';
      source = source || 'Couple';
    } else if (src === 'receptionPlaylist') {
      if (row.must) flag = 'Must play';
      moment = moment || String(row.assignment || 'Reception Playlist');
      if (/playlist/i.test(moment) && !RECEPTION_MOMENTS.test(moment) && !CEREMONY_MOMENTS.test(moment)) {
        /* keep assignment as moment label */
      }
      source = source || 'Playlist';
      performer = String(row.performer || row.assignment || 'DJ').trim();
      if (/playlist|reception playlist/i.test(performer)) performer = 'DJ';
    } else {
      /* recSongs */
      source = source || 'Couple';
      if (row.must || row.mustPlay) flag = 'Must play';
      if (!moment) flag = flag || 'Unplaced';
    }

    /* Cross-check mustPlay list by title */
    if (!flag && arr('mustPlay').some(m => String(m.song || '').trim().toLowerCase() === title.toLowerCase())) {
      flag = 'Must play';
    }
    if (arr('doNotPlay').some(m => String(m.song || '').trim().toLowerCase() === title.toLowerCase()) && src !== 'doNotPlay') {
      flag = 'Do not play';
    }
    if (!moment || moment === '—') {
      if (flag !== 'Do not play') flag = flag || 'Unplaced';
      moment = moment || '—';
    }

    if (!performer || /playlist/i.test(performer)) {
      performer = guessPerformer(moment, src);
    }

    return {
      id: songId(src, row, i),
      src: src,
      index: i,
      row: row,
      title: title,
      artist: artist,
      moment: moment,
      performer: performer,
      source: source,
      flag: flag,
      length: row.length || row.duration || '',
      key: row.key || '',
      notes: row.notes || row.reason || '',
      cue: row.cue || ''
    };
  }

  function guessPerformer(moment, src) {
    const acts = arr('entertainment');
    if (/ceremony|processional|recessional|prelude|kora/i.test(moment)) {
      const a = acts.find(x => /kora|choir|ceremony|music/i.test(String(x.type || '') + ' ' + String(x.name || '')));
      return a ? a.name : 'Ceremony';
    }
    if (/first dance|father|mother|last dance|reception|cocktail|dinner/i.test(moment) || src === 'receptionPlaylist') {
      const a = acts.find(x => /dj/i.test(String(x.type || '') + ' ' + String(x.name || '')));
      return a ? a.name : 'DJ';
    }
    const band = acts.find(x => /band/i.test(String(x.type || '')));
    return band ? band.name : '—';
  }

  function allSongs() {
    const out = [];
    arr('recSongs').forEach((r, i) => out.push(unifySong('recSongs', r, i)));
    arr('receptionPlaylist').forEach((r, i) => out.push(unifySong('receptionPlaylist', r, i)));
    arr('mustPlay').forEach((r, i) => {
      const title = String(r.song || '').trim().toLowerCase();
      if (title && out.some(s => s.title.toLowerCase() === title && s.flag === 'Must play')) return;
      out.push(unifySong('mustPlay', r, i));
    });
    arr('doNotPlay').forEach((r, i) => out.push(unifySong('doNotPlay', r, i)));
    return out;
  }

  function songGroup(s) {
    if (s.flag === 'Do not play' || s.src === 'doNotPlay') return 'Do not play';
    if (CEREMONY_MOMENTS.test(s.moment)) return 'Ceremony';
    return 'Reception';
  }

  function isMust(s) { return s.flag === 'Must play'; }
  function isDnp(s) { return s.flag === 'Do not play'; }
  function isUnplaced(s) { return s.flag === 'Unplaced' || s.moment === '—' || !s.moment; }
  function isCeremony(s) { return songGroup(s) === 'Ceremony' && !isDnp(s); }

  /* ── performers ──────────────────────────────────────────────────────── */

  function actRows() {
    return arr('entertainment').map((r, i) => ({
      id: r._id ? 'act:' + r._id : 'act:idx:' + i,
      index: i,
      row: r,
      name: String(r.name || '').trim() || 'Untitled act',
      type: String(r.type || 'Performer').trim() || 'Performer',
      fee: parseFloat(r.cost) || 0,
      contact: r.contact || '',
      phone: r.phone || '',
      email: r.email || '',
      notes: r.notes || '',
      status: r.contract || r.status || (r.contractSigned ? 'Signed' : 'Confirmed'),
      hours: r.hours || '',
      onSite: r.onSite || r.window || '',
      soundcheck: r.soundcheck || '',
      power: r.power || '',
      arrival: r.arrival || r.arrives || ''
    }));
  }

  function musicSpend() {
    return actRows().reduce((s, a) => s + (a.fee || 0), 0);
  }

  /* ── figures / rail ──────────────────────────────────────────────────── */

  function entertainmentFigures() {
    const songs = allSongs();
    const acts = actRows();
    const must = songs.filter(isMust).length;
    const dnp = songs.filter(isDnp).length;
    const unplaced = songs.filter(s => isUnplaced(s) && !isDnp(s)).length;
    const ceremony = songs.filter(isCeremony).length;
    const moments = new Set(songs.filter(s => s.moment && s.moment !== '—').map(s => s.moment));
    return {
      performers: acts.length,
      songs: songs.length,
      must: must,
      dnp: dnp,
      unplaced: unplaced,
      ceremony: ceremony,
      spend: musicSpend(),
      momentsFilled: moments.size,
      momentsTarget: Math.max(moments.size, 13)
    };
  }

  function entertainmentRailCounts() {
    const f = entertainmentFigures();
    return {
      full: f.songs,
      must: f.must,
      dnp: f.dnp,
      unplaced: f.unplaced,
      ceremony: f.ceremony
    };
  }

  function matchesRail(s, view) {
    view = view || window._entRailView || 'full';
    if (view === 'full') return true;
    if (view === 'must') return isMust(s);
    if (view === 'dnp') return isDnp(s);
    if (view === 'unplaced') return isUnplaced(s) && !isDnp(s);
    if (view === 'ceremony') return isCeremony(s);
    return true;
  }
  function matchesFilters(s) {
    const ui = window._entUiFilters || {};
    if (ui.moment && ui.moment !== 'all' && String(s.moment).toLowerCase() !== String(ui.moment).toLowerCase()) return false;
    if (ui.performer && ui.performer !== 'all' && String(s.performer).toLowerCase() !== String(ui.performer).toLowerCase()) return false;
    if (ui.source && ui.source !== 'all' && String(s.source).toLowerCase() !== String(ui.source).toLowerCase()) return false;
    return true;
  }

  /* ── shell ───────────────────────────────────────────────────────────── */

  function pageheadActionsHtml() {
    const mode = window._entMode || 'setlist';
    const starter = '<button type="button" class="rd-btn" onclick="rdEntLoadStarter()">Load a starter list</button>';
    if (mode === 'performers') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdEntPrintTech()">Print tech sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Entertainment\',data.entertainment)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddPerformer()">Add performer</button>';
    }
    if (mode === 'timeline') {
      return starter
        + '<button type="button" class="rd-btn" onclick="rdEntPrintRun()">Print run sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Entertainment\',data.entertainment)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddPerformer()">Add performer</button>';
    }
    return starter
      + '<button type="button" class="rd-btn" onclick="rdEntSendSetList()">Send set list</button>'
      + '<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdEntExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddSong()">Add song</button>';
  }

  async function rdEntLoadStarter() {
    if (typeof loadRecSongPreset === 'function') await loadRecSongPreset();
    renderEntertainmentRd();
  }
  window.rdEntLoadStarter = rdEntLoadStarter;

  function uedEntertainmentShellRd() {
    const panel = document.getElementById('panel-entertainment');
    if (!panel) return;
    panel.classList.add('ued-scope', 'entertainment-mockup');
    if (panel.dataset.uedShell === 'entertainment-rd10d') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'entertainment-rd10d';
    panel.innerHTML = `<div class="rd-page">
      <div class="rd-pagehead">
        <div>
          <div class="rd-pagehead__eyebrow">Vendors</div>
          <div class="rd-pagehead__title-row">
            <h1 class="rd-pagehead__title">Entertainment</h1>
          </div>
        </div>
        <div class="rd-pagehead__actions">${pageheadActionsHtml()}</div>
      </div>
      <div class="rd-stats m-stats" id="entertainment-stats" aria-label="Entertainment summary"></div>
      <div class="rd-toolbar" id="entertainment-toolbar"></div>
      <div class="rd-bulkbar" id="entertainment-bulk-bar" hidden></div>
      <div class="rd-surface">
        <div class="rd-surface__row" id="entertainment-surface-row">
          <div class="rd-surface__main" id="entertainment-view-host">
            <div class="rd-view" id="ent-view-setlist" data-ent-view="setlist">
              <div id="entertainment-act-strip" class="rd-ent-actstrip"></div>
              <div class="rd-table-wrap ued-table-wrap" id="entertainment-10d-table"></div>
              <span class="rd-table-foot ued-soft" id="entertainment-10d-foot"></span>
            </div>
            <div class="rd-view" id="ent-view-performers" data-ent-view="performers" hidden>
              <div id="entertainment-performers-view" class="rd-ent-cardgrid"></div>
            </div>
            <div class="rd-view" id="ent-view-timeline" data-ent-view="timeline" hidden>
              <div id="entertainment-timeline-view" class="rd-ent-gantt"></div>
            </div>
          </div>
          <div id="entertainment-drawer-slot"></div>
        </div>
      </div>
    </div>`;
    if (typeof window.covenantShell !== 'undefined' && window.covenantShell.drawer) {
      window.covenantShell.drawer();
    }
  }

  function renderEntertainmentStatsRd() {
    const host = document.getElementById('entertainment-stats');
    if (!host) return;
    const f = entertainmentFigures();
    const mode = window._entMode || 'setlist';
    const acts = actRows();

    if (mode === 'performers') {
      const contracted = acts.filter(a => /sign|confirm|book/i.test(String(a.status || ''))).length;
      const unfilled = window._entShowUnfilled ? 1 : 0;
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Acts', value: String(Math.max(acts.length, acts.length + unfilled)) },
          { label: 'Contracted', value: String(contracted) },
          { label: 'Fees', value: money0(f.spend) },
          { label: 'Unfilled roles', value: String(unfilled), attention: unfilled ? 'sound engineer · cue 1 blocked' : undefined },
          { label: 'Total power draw', value: acts.length ? 'Venue confirmed' : '—' }
        ]);
        return;
      }
    }
    if (mode === 'timeline') {
      if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
        RdDepth.renderStats(host, [
          { label: 'Acts on the day', value: String(acts.length) },
          { label: 'Music covered', value: acts.length ? 'Set windows' : '—' },
          { label: 'Silent gaps', value: '0' },
          { label: 'Unfilled roles', value: window._entShowUnfilled ? '1' : '0', attention: window._entShowUnfilled ? 'sound desk' : undefined },
          { label: 'Stage changeovers', value: String(Math.max(0, acts.length - 1)) }
        ]);
        return;
      }
    }
    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      RdDepth.renderStats(host, [
        { label: 'Performers', value: String(f.performers) },
        { label: 'Songs', value: String(f.songs) },
        { label: 'Must play', value: String(f.must) },
        { label: 'Do not play', value: String(f.dnp) },
        { label: 'Music spend', value: money0(f.spend) }
      ]);
      return;
    }
    host.innerHTML = [
      ['Performers', f.performers],
      ['Songs', f.songs],
      ['Must play', f.must],
      ['Do not play', f.dnp],
      ['Music spend', money0(f.spend)]
    ].map(([l, v]) =>
      `<div class="m-stat"><div class="m-stat-label">${esc(l)}</div><div class="m-stat-val">${esc(String(v))}</div></div>`
    ).join('');
  }

  function filterChip(label, field) {
    const ui = window._entUiFilters || {};
    const cur = ui[field];
    const on = cur && cur !== 'all';
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><path d="m6 9 6 6 6-6"/></svg>';
    return `<button type="button" class="rd-chip${on ? ' is-active' : ''}" onclick="rdEntCycleFilter('${field}')">${esc(on ? label + ': ' + cur : label + ': all')}`
      + (on ? `<span class="rd-chip__clear" onclick="event.stopPropagation();rdEntClearFilter('${field}')">&#10005;</span>` : chev)
      + '</button>';
  }

  function renderEntertainmentToolbar() {
    const host = document.getElementById('entertainment-toolbar');
    if (!host) return;
    const mode = window._entMode || 'setlist';
    let left = '';
    if (mode === 'performers') {
      left = filterChip('Type', 'type') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip${window._entShowUnfilled ? ' is-active' : ''}" onclick="rdEntToggleUnfilled()">Show unfilled${window._entShowUnfilled ? ' ✕' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by arrival time</button>`;
    } else if (mode === 'timeline') {
      left = filterChip('Act', 'act') + filterChip('Type', 'type') +
        `<button type="button" class="rd-chip${window._entShowLoadIn ? ' is-active' : ''}" onclick="rdEntToggleLoadIn()">Load-in shown${window._entShowLoadIn ? ' ✕' : ''}</button>` +
        `<span class="rd-ent-toolbar-note">Run of show</span>`;
    } else {
      left = filterChip('Moment', 'moment') + filterChip('Performer', 'performer') + filterChip('Source', 'source') +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by running order</button>` +
        `<button type="button" class="rd-chip" onclick="rdEntOpenColumns()">Columns · 6 of 6</button>` +
        `<button type="button" class="rd-chip" onclick="rdEntAutoFit()">Auto-fit columns</button>` +
        `<button type="button" class="rd-chip" onclick="rdEntCycleRowHeight()">Row height · ${esc(window._entRowHeight || 'compact')}</button>`;
    }
    host.innerHTML = left +
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Entertainment view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'setlist' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('setlist')">Set list</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'performers' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('performers')">Performers</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'timeline' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('timeline')">Timeline</button>` +
      `</div></div>`;
  }

  function renderBulkBar() {
    const host = document.getElementById('entertainment-bulk-bar');
    if (!host) return;
    const n = window._entSel.size;
    if (!n || (window._entMode || 'setlist') !== 'setlist') {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<span class="rd-bulkbar__count">${n} selected</span><span class="rd-bulkbar__sep"></span>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEntBulk('moment')">Assign moment</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEntBulk('performer')">Set performer</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEntBulk('must')">Mark must-play</button>` +
      `<button type="button" class="rd-bulkbar__action" onclick="rdEntBulk('remove')">Remove from list</button>` +
      `<button type="button" class="rd-bulkbar__clear" onclick="rdEntBulkClear()">Clear selection</button>`;
  }

  function applyViewMode() {
    const mode = window._entMode || 'setlist';
    ['setlist', 'performers', 'timeline'].forEach(name => {
      const el = document.getElementById('ent-view-' + name);
      if (el) el.hidden = name !== mode;
    });
  }

  function rdSetEntertainmentView(mode) {
    window._entMode = (mode === 'performers' || mode === 'timeline') ? mode : 'setlist';
    renderEntertainmentRd();
  }
  function applyEntertainmentRailView(viewId) {
    window._entRailView = viewId || 'full';
    if (typeof setSavedView === 'function') setSavedView('entertainment', window._entRailView);
    window._entMode = 'setlist';
    renderEntertainmentRd();
  }
  function applyEntertainmentGroupBy(g) {
    window._entGroupBy = g || 'moment';
    renderEntertainmentRd();
  }

  /* ── Set list ────────────────────────────────────────────────────────── */

  function renderActStrip() {
    const host = document.getElementById('entertainment-act-strip');
    if (!host) return;
    const acts = actRows();
    if (!acts.length) {
      host.innerHTML = '<p class="rd-help" style="padding:8px 4px">No performers yet — add one from the Performers view.</p>';
      return;
    }
    host.innerHTML = acts.map(a => {
      const st = String(a.status || 'Confirmed');
      return `<article class="rd-ent-actcard" onclick="rdSetEntertainmentView('performers')">` +
        `<div class="rd-ent-actcard__name">${esc(a.name)}</div>` +
        `<div class="rd-ent-actcard__type">${esc(a.type)}${a.hours ? ' · ' + esc(a.hours) : ''}</div>` +
        `<div class="rd-ent-actcard__meta">Fee ${a.fee ? money0(a.fee) : 'Included'}${a.onSite ? ' · On site ' + esc(a.onSite) : ''}</div>` +
        `<span class="status-pill" data-pillscheme="${/sign/i.test(st) ? 'green' : 'gold'}">${esc(st)}</span>` +
        `</article>`;
    }).join('');
  }

  function groupedSongs(songs) {
    const by = window._entGroupBy || 'moment';
    if (by === 'performer') {
      const map = {};
      songs.forEach(s => {
        const k = s.performer || '—';
        if (!map[k]) map[k] = [];
        map[k].push(s);
      });
      return Object.keys(map).sort().map(k => ({ label: k, rows: map[k] }));
    }
    if (by === 'source') {
      const map = {};
      songs.forEach(s => {
        const k = s.source || '—';
        if (!map[k]) map[k] = [];
        map[k].push(s);
      });
      return Object.keys(map).sort().map(k => ({ label: k, rows: map[k] }));
    }
    /* moment → Ceremony / Reception / Do not play */
    const order = ['Ceremony', 'Reception', 'Do not play'];
    const map = { Ceremony: [], Reception: [], 'Do not play': [] };
    songs.forEach(s => {
      const g = songGroup(s);
      map[g].push(s);
    });
    return order.filter(k => map[k].length).map(k => {
      const rows = map[k];
      const must = rows.filter(isMust).length;
      const unplaced = rows.filter(s => isUnplaced(s) && !isDnp(s)).length;
      let sub = rows.length + ' song' + (rows.length === 1 ? '' : 's');
      if (must) sub += ' · ' + must + ' must play';
      if (unplaced) sub += ' · ' + unplaced + ' unplaced';
      return { label: k + ' · ' + sub, rows: rows };
    });
  }

  function flagPill(flag) {
    if (!flag) return '—';
    const scheme = flag === 'Must play' ? 'green' : flag === 'Do not play' ? 'red' : 'gold';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(flag)}</span>`;
  }

  function renderSetListTable() {
    const host = document.getElementById('entertainment-10d-table');
    const foot = document.getElementById('entertainment-10d-foot');
    if (!host) return;
    const songs = allSongs().filter(s => matchesRail(s) && matchesFilters(s));
    const groups = groupedSongs(songs);
    const dens = window._entRowHeight || 'compact';

    let html = `<table class="rd-ent-table rd-ent-table--${esc(dens)}"><thead><tr>` +
      ENT_COLUMNS.map(c => `<th>${esc(c.label)}</th>`).join('') +
      `</tr></thead><tbody>`;

    if (!groups.length) {
      html += `<tr class="rd-ent-empty"><td colspan="6">No songs in this view yet. <button type="button" class="rd-btn rd-btn--quiet" onclick="rdEntLoadStarter()">Load a starter list</button></td></tr>`;
    } else {
      groups.forEach(g => {
        html += `<tr class="rd-ent-group"><td colspan="6">${esc(g.label)}</td></tr>`;
        g.rows.forEach(s => {
          const selected = window._entSel.has(s.id);
          html += `<tr class="rd-ent-row${selected ? ' is-selected' : ''}" data-id="${esc(s.id)}" onclick="rdEntOpenDrawer('${esc(s.id)}')">` +
            `<td><div class="rd-ent-name">${esc(s.title)}</div>` +
            `<div class="rd-ent-row__actions">` +
            `<button type="button" onclick="event.stopPropagation();rdEntToggleSel('${esc(s.id)}')">Select</button>` +
            `<button type="button" onclick="event.stopPropagation();rdEntOpenDrawer('${esc(s.id)}')">Open</button>` +
            `<button type="button" onclick="event.stopPropagation();rdEntFullEditor('${esc(s.id)}')">Full editor</button>` +
            `</div></td>` +
            `<td>${esc(s.artist)}</td>` +
            `<td>${esc(s.moment === '—' ? '—' : s.moment)}</td>` +
            `<td>${esc(s.performer)}</td>` +
            `<td>${esc(s.source)}</td>` +
            `<td>${flagPill(s.flag)}</td>` +
            `</tr>`;
        });
      });
    }
    html += `<tr class="rd-ent-add"><td colspan="6"><button type="button" class="rd-ent-addbtn" onclick="rdEntAddSong()"><span>+</span> Add a song</button></td></tr>`;
    html += `</tbody></table>`;
    host.innerHTML = html;
    if (foot) foot.textContent = songs.length + ' song' + (songs.length === 1 ? '' : 's') + ' · Music spend ' + money0(musicSpend());
  }

  /* ── Performers view (30j) ───────────────────────────────────────────── */

  function renderPerformersView() {
    const host = document.getElementById('entertainment-performers-view');
    if (!host) return;
    const acts = actRows().filter(a => {
      const ui = window._entUiFilters || {};
      if (ui.type && ui.type !== 'all' && String(a.type).toLowerCase() !== String(ui.type).toLowerCase()) return false;
      if (ui.status && ui.status !== 'all' && String(a.status).toLowerCase() !== String(ui.status).toLowerCase()) return false;
      return true;
    });
    let html = acts.map(a => {
      return `<article class="rd-ent-perfcard" onclick="typeof openRecordEditor==='function'&&openRecordEditor('entertainment',${a.index})">` +
        `<div class="rd-ent-perfcard__name">${esc(a.name)}</div>` +
        `<div class="rd-ent-perfcard__type">${esc(a.type)}</div>` +
        `<div class="rd-ent-perfcard__meta">Fee ${a.fee ? money0(a.fee) : 'Included'}</div>` +
        `<div class="rd-ent-perfcard__meta">Soundcheck ${esc(a.soundcheck || '—')}</div>` +
        `<div class="rd-ent-perfcard__meta">Window ${esc(a.onSite || '—')}</div>` +
        `<div class="rd-ent-perfcard__meta">Power ${esc(a.power || '—')}</div>` +
        `<span class="status-pill" data-pillscheme="${/sign/i.test(a.status) ? 'green' : 'gold'}">${esc(a.status)}</span>` +
        `</article>`;
    }).join('');
    if (window._entShowUnfilled) {
      html += `<article class="rd-ent-perfcard is-missing">` +
        `<div class="rd-ent-perfcard__name">— Sound engineer</div>` +
        `<div class="rd-ent-perfcard__type">Not booked</div>` +
        `<div class="rd-ent-perfcard__meta">Missing · cue 1 blocked</div>` +
        `<div class="rd-ent-missingbar" aria-hidden="true"></div>` +
        `<span class="status-pill" data-pillscheme="red">Missing</span>` +
        `</article>`;
    }
    if (!acts.length && !window._entShowUnfilled) {
      html = '<div class="rd-ent-empty-block">No performers yet. Add a band, DJ, or ceremony musician.</div>';
    }
    host.innerHTML = html;
  }

  /* ── Timeline view (30k) ─────────────────────────────────────────────── */

  function renderTimelineView() {
    const host = document.getElementById('entertainment-timeline-view');
    if (!host) return;
    const acts = actRows();
    const hours = [];
    for (let h = 13; h <= 23; h++) hours.push(h);

    if (!acts.length) {
      host.innerHTML = '<div class="rd-ent-empty-block">Add performers to see the run-of-show timeline.</div>';
      return;
    }

    const parseWindow = (a, i) => {
      /* Fallback staggered windows when onSite is free text without times */
      const start = 15 + i * 1.5;
      const end = start + (a.hours && parseFloat(a.hours) ? parseFloat(a.hours) : 2);
      const load = window._entShowLoadIn ? Math.max(13, start - 0.75) : null;
      return { start: start, end: Math.min(23, end), load: load };
    };

    let html = `<div class="rd-ent-gantt__axis">` +
      hours.map(h => {
        const label = h === 12 ? '12pm' : h < 12 ? h + 'am' : (h === 24 ? '12am' : (h - 12) + 'pm');
        return `<span>${label}</span>`;
      }).join('') +
      `</div><div class="rd-ent-gantt__rows">`;

    acts.forEach((a, i) => {
      const w = parseWindow(a, i);
      const left = ((w.start - 13) / 10) * 100;
      const width = ((w.end - w.start) / 10) * 100;
      const loadLeft = w.load != null ? ((w.load - 13) / 10) * 100 : 0;
      const loadWidth = w.load != null ? ((w.start - w.load) / 10) * 100 : 0;
      html += `<div class="rd-ent-gantt__row">` +
        `<div class="rd-ent-gantt__label">${esc(a.name)}<span>${esc(a.type)}</span></div>` +
        `<div class="rd-ent-gantt__track">` +
        (w.load != null ? `<span class="rd-ent-gantt__bar is-loadin" style="left:${loadLeft}%;width:${Math.max(loadWidth, 2)}%" title="Load-in / soundcheck"></span>` : '') +
        `<span class="rd-ent-gantt__bar is-perf" style="left:${left}%;width:${Math.max(width, 3)}%" title="Performance"></span>` +
        `</div></div>`;
    });
    if (window._entShowUnfilled) {
      html += `<div class="rd-ent-gantt__row is-missing">` +
        `<div class="rd-ent-gantt__label">Sound engineer<span>Unfilled</span></div>` +
        `<div class="rd-ent-gantt__track"><span class="rd-ent-gantt__bar is-missing" style="left:35%;width:40%"></span></div></div>`;
    }
    html += `</div><p class="rd-help" style="padding:12px 4px">Solid = performance · hatched = load-in or soundcheck. Windows follow performer notes when set; otherwise a provisional sequence.</p>`;
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

  function renderEntertainmentDrawer() {
    const slot = document.getElementById('entertainment-drawer-slot');
    if (!slot) return;
    const shared = document.getElementById('record-drawer');
    if (shared && slot.contains(shared) && !shared.hasAttribute('hidden')) {
      slot.classList.add('is-open');
      return;
    }
    const id = window._entDrawerId;
    const song = findSongById(id);
    if (!song) {
      if (!(shared && slot.contains(shared) && !shared.hasAttribute('hidden'))) {
        parkSharedDrawerAway(slot);
        slot.innerHTML = '';
        slot.classList.remove('is-open');
      }
      return;
    }
    parkSharedDrawerAway(slot);
    const tab = Math.max(0, Math.min(DRAWER_TABS.length - 1, parseInt(window._entDrawerTab, 10) || 0));
    const acts = actRows();

    let body = '';
    if (tab === 0) {
      body =
        field('Title', song.title) +
        field('Artist', song.artist) +
        field('Length', song.length || '—') +
        field('Key', song.key || '—') +
        field('Source', song.source || '—') +
        field('Flag', song.flag || '—') +
        (isMust(song)
          ? `<p class="rd-drawer__note">A must-play is a promise to the couple, not a preference. The DJ’s printed set list separates must-plays from the rest so a full dance floor never overrides one.</p>`
          : '') +
        `<div class="rd-drawer__section"><div class="rd-drawer__section-title">Notes</div><p>${esc(song.notes || '—')}</p></div>`;
    } else if (tab === 1) {
      body =
        field('Placed at', song.moment === '—' ? 'Unplaced' : song.moment) +
        field('Timeline', song.moment !== '—' ? 'Wedding Day Timeline →' : '—', "typeof showPanel==='function'&&showPanel('timeline')") +
        field('Cue', song.cue || '—') +
        field('Length fits', song.length || '—') +
        (isUnplaced(song) && !isDnp(song)
          ? `<p class="rd-drawer__note">A song with a moment appears on the Wedding Day Timeline and in the Ceremony order of service. Songs without a moment read Unplaced.</p>`
          : '');
    } else if (tab === 2) {
      body =
        field('Assigned', song.performer || '—') +
        field('Fee', 'See performer card') +
        `<div class="rd-drawer__section-title">Performers · ${acts.length}</div>` +
        acts.map(a => `<div class="rd-drawer__guest">${esc(a.name)} <span>${esc(a.status)}</span></div>`).join('') ||
        '<p class="rd-drawer__note">No performers on file.</p>';
    } else {
      body = `<div class="rd-drawer__hist"><strong>—</strong> · Planner<div>Added${song.flag ? ' · ' + esc(song.flag) : ''}${song.moment && song.moment !== '—' ? ' · ' + esc(song.moment) : ''}</div></div>`;
    }

    slot.classList.add('is-open');
    slot.innerHTML =
      `<aside class="rd-drawer rd-ent-drawer" aria-label="Song">` +
      `<div class="rd-drawer__head">` +
      `<div class="rd-drawer__eyebrow">Song · ${esc(songGroup(song).toLowerCase())}</div>` +
      `<h2 class="rd-drawer__title">${esc(song.title)}</h2>` +
      `<div class="rd-drawer__chips">` +
      (song.flag ? flagPill(song.flag) : '') +
      (song.moment && song.moment !== '—' ? `<span class="status-pill" data-pillscheme="gold">${esc(song.moment)}</span>` : '') +
      `</div>` +
      `<button type="button" class="rd-drawer__close" onclick="rdEntCloseDrawer()" aria-label="Close">×</button>` +
      `<div class="rd-drawer__tabs" role="tablist">` +
      DRAWER_TABS.map((label, i) =>
        `<button type="button" class="rd-drawer__tab${i === tab ? ' is-active' : ''}" onclick="rdEntSetDrawerTab(${i})">${esc(label)}</button>`
      ).join('') +
      `</div></div>` +
      `<div class="rd-drawer__body">${body}</div>` +
      `<div class="rd-drawer__foot">` +
      `<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntCloseDrawer()">Save</button>` +
      `<button type="button" class="rd-btn" onclick="rdEntFullEditor('${esc(song.id)}')">Full editor</button>` +
      `</div></aside>`;
  }

  function field(label, value, onclick) {
    const click = onclick ? ` class="rd-drawer__link" onclick="${onclick}"` : '';
    return `<div class="rd-drawer__field"><span>${esc(label)}</span><strong${click}>${esc(value)}</strong></div>`;
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function rdEntOpenDrawer(id) {
    window._entDrawerId = id;
    window._entDrawerTab = 0;
    renderEntertainmentDrawer();
  }
  function rdEntCloseDrawer() {
    window._entDrawerId = null;
    const slot = document.getElementById('entertainment-drawer-slot');
    if (slot) {
      parkSharedDrawerAway(slot);
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
  }
  function rdEntSetDrawerTab(i) {
    window._entDrawerTab = i;
    renderEntertainmentDrawer();
  }
  function rdEntAddSong() {
    if (typeof openRecordEditor === 'function') openRecordEditor('recSongs');
    else if (typeof addRecSongRow === 'function') addRecSongRow();
  }
  function rdEntAddPerformer() {
    if (typeof openRecordEditor === 'function') openRecordEditor('entertainment');
    else if (typeof addEntRow === 'function') addEntRow();
  }
  function rdEntFullEditor(id) {
    const song = id ? findSongById(id) : findSongById(window._entDrawerId);
    window._entDrawerId = null;
    const slot = document.getElementById('entertainment-drawer-slot');
    if (slot && !slot.querySelector('#record-drawer')) {
      slot.innerHTML = '';
      slot.classList.remove('is-open');
    }
    if (typeof openRecordEditor === 'function') {
      if (song) openRecordEditor(song.src, song.index);
      else if ((window._entMode || 'setlist') !== 'setlist') openRecordEditor('entertainment');
      else openRecordEditor('recSongs');
    }
  }
  function rdEntSendSetList() {
    if (typeof openPrintView === 'function') {
      const songs = allSongs().filter(s => !isDnp(s));
      let html = '<h2 class="pv-section">Set list</h2><table class="pv-table"><thead><tr><th>Song</th><th>Artist</th><th>Moment</th><th>Flag</th></tr></thead><tbody>';
      songs.forEach(s => {
        html += `<tr><td>${esc(s.title)}</td><td>${esc(s.artist)}</td><td>${esc(s.moment)}</td><td>${esc(s.flag || '')}</td></tr>`;
      });
      html += '</tbody></table>';
      const dnp = allSongs().filter(isDnp);
      if (dnp.length) {
        html += '<h2 class="pv-section">Do not play</h2><ul>' + dnp.map(s => `<li>${esc(s.title)}${s.artist !== '—' ? ' — ' + esc(s.artist) : ''}</li>`).join('') + '</ul>';
      }
      openPrintView('Entertainment set list', html, { subtitle: 'Send to DJ / band' });
    } else printCurrentPage();
  }
  function rdEntPrintTech() { printCurrentPage(); }
  function rdEntPrintRun() { printCurrentPage(); }
  function rdEntExport() {
    if (typeof exportSectionCSV === 'function') exportSectionCSV('Set list', allSongs().map(s => ({
      song: s.title, artist: s.artist, moment: s.moment, performer: s.performer, source: s.source, flag: s.flag
    })));
  }
  function rdEntCycleFilter(field) {
    const songs = allSongs();
    const options = { all: true };
    if (field === 'moment') songs.forEach(s => { if (s.moment && s.moment !== '—') options[s.moment] = true; });
    if (field === 'performer') songs.forEach(s => { if (s.performer && s.performer !== '—') options[s.performer] = true; });
    if (field === 'source') songs.forEach(s => { if (s.source) options[s.source] = true; });
    if (field === 'type') actRows().forEach(a => { options[a.type] = true; });
    if (field === 'status') actRows().forEach(a => { options[a.status] = true; });
    if (field === 'act') actRows().forEach(a => { options[a.name] = true; });
    const list = Object.keys(options);
    const cur = (window._entUiFilters || {})[field] || 'all';
    const i = list.indexOf(cur);
    window._entUiFilters[field] = list[(i + 1) % list.length];
    renderEntertainmentRd();
  }
  function rdEntClearFilter(field) {
    window._entUiFilters[field] = 'all';
    renderEntertainmentRd();
  }
  function rdEntToggleUnfilled() {
    window._entShowUnfilled = !window._entShowUnfilled;
    renderEntertainmentRd();
  }
  function rdEntToggleLoadIn() {
    window._entShowLoadIn = !window._entShowLoadIn;
    renderEntertainmentRd();
  }
  function rdEntOpenColumns() {
    if (window.rdColumns && window.rdColumns.open) window.rdColumns.open(ENT_COL_SCOPE);
  }
  function rdEntAutoFit() {
    if (typeof autoFitColumns === 'function') {
      const table = document.querySelector('#entertainment-10d-table table');
      if (table) autoFitColumns(table);
    }
  }
  function rdEntCycleRowHeight() {
    const order = ['compact', 'default', 'comfortable'];
    const i = order.indexOf(window._entRowHeight || 'compact');
    window._entRowHeight = order[(i + 1) % order.length];
    renderEntertainmentRd();
  }
  function rdEntToggleSel(id) {
    if (window._entSel.has(id)) window._entSel.delete(id);
    else window._entSel.add(id);
    renderSetListTable();
    renderBulkBar();
  }
  function rdEntBulkClear() {
    window._entSel.clear();
    renderSetListTable();
    renderBulkBar();
  }
  async function rdEntBulk(action) {
    const ids = Array.from(window._entSel);
    if (!ids.length) return;
    if (action === 'must') {
      ids.forEach(id => {
        const s = findSongById(id);
        if (!s || s.src === 'doNotPlay') return;
        s.row.must = true;
        s.row.mustPlay = true;
        if (s.src === 'receptionPlaylist') s.row.must = true;
      });
    } else if (action === 'remove') {
      if (typeof covConfirm === 'function' && !(await covConfirm('Remove selected songs from the set list?', { title: 'Remove songs?', danger: true, okText: 'Remove' }))) return;
      ids.forEach(id => {
        const s = findSongById(id);
        if (!s) return;
        arr(s.src).splice(s.index, 1);
      });
      window._entSel.clear();
    } else if (action === 'moment' || action === 'performer') {
      const label = action === 'moment' ? 'Moment' : 'Performer';
      const val = typeof covPrompt === 'function'
        ? await covPrompt('Set ' + label.toLowerCase() + ' for selected songs', { defaultValue: '', title: label })
        : '';
      if (val == null) return;
      ids.forEach(id => {
        const s = findSongById(id);
        if (!s || s.src === 'doNotPlay') return;
        if (action === 'moment') {
          s.row.moment = val;
          if (s.src === 'receptionPlaylist') s.row.assignment = val;
        } else s.row.performer = val;
      });
    }
    if (typeof save === 'function') save();
    renderEntertainmentRd();
  }

  /* ── main ────────────────────────────────────────────────────────────── */

  function renderEntertainmentRd() {
    uedEntertainmentShellRd();
    if (typeof renderPageUxChrome === 'function') renderPageUxChrome('entertainment');
    applyViewMode();
    renderEntertainmentStatsRd();
    renderEntertainmentToolbar();
    renderBulkBar();

    const mode = window._entMode || 'setlist';
    if (mode === 'performers') renderPerformersView();
    else if (mode === 'timeline') renderTimelineView();
    else {
      renderActStrip();
      renderSetListTable();
    }
    renderEntertainmentDrawer();

    if (typeof renderContextSidebar === 'function'
      && document.body.getAttribute('data-active-panel') === 'entertainment'
      && document.body.classList.contains('context-sidebar-mode')) {
      renderContextSidebar('entertainment');
    }
    if (typeof uxRevealPanel === 'function') uxRevealPanel('entertainment');
  }

  window.uedEntertainmentShell = uedEntertainmentShellRd;
  window.renderEntertainmentPage = renderEntertainmentRd;
  window.renderEntertainmentRd = renderEntertainmentRd;
  window.rdSetEntertainmentView = rdSetEntertainmentView;
  window.applyEntertainmentRailView = applyEntertainmentRailView;
  window.applyEntertainmentGroupBy = applyEntertainmentGroupBy;
  window.entertainmentRailCounts = entertainmentRailCounts;
  window.entertainmentFigures = entertainmentFigures;
  window.rdEntOpenDrawer = rdEntOpenDrawer;
  window.rdEntCloseDrawer = rdEntCloseDrawer;
  window.rdEntSetDrawerTab = rdEntSetDrawerTab;
  window.rdEntAddSong = rdEntAddSong;
  window.rdEntAddPerformer = rdEntAddPerformer;
  window.rdEntFullEditor = rdEntFullEditor;
  window.rdEntSendSetList = rdEntSendSetList;
  window.rdEntPrintTech = rdEntPrintTech;
  window.rdEntPrintRun = rdEntPrintRun;
  window.rdEntExport = rdEntExport;
  window.rdEntCycleFilter = rdEntCycleFilter;
  window.rdEntClearFilter = rdEntClearFilter;
  window.rdEntToggleUnfilled = rdEntToggleUnfilled;
  window.rdEntToggleLoadIn = rdEntToggleLoadIn;
  window.rdEntOpenColumns = rdEntOpenColumns;
  window.rdEntAutoFit = rdEntAutoFit;
  window.rdEntCycleRowHeight = rdEntCycleRowHeight;
  window.rdEntToggleSel = rdEntToggleSel;
  window.rdEntBulkClear = rdEntBulkClear;
  window.rdEntBulk = rdEntBulk;

  /* Bridge legacy entTab to views */
  window.entTab = function (name) {
    if (name === 'vendors') rdSetEntertainmentView('performers');
    else if (name === 'playlist' || name === 'cues') rdSetEntertainmentView('setlist');
    else rdSetEntertainmentView('setlist');
  };

  function hookEntertainmentPanelRenderer() {
    if (window.SYSTEM_PANEL_RENDERERS) {
      window.SYSTEM_PANEL_RENDERERS.entertainment = function () { renderEntertainmentRd(); };
    }
  }
  hookEntertainmentPanelRenderer();
  var _showPanelEnt = window.showPanel;
  if (typeof _showPanelEnt === 'function') {
    window.showPanel = function (id, forceOpen) {
      var out = _showPanelEnt.call(window, id, forceOpen);
      hookEntertainmentPanelRenderer();
      return out;
    };
  }
})();
