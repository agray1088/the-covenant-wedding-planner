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
  window._entSection = window._entSection || 'overview';
  window._entRailView = window._entRailView || 'full';
  window._entGroupBy = window._entGroupBy || 'moment';
  window._entUiFilters = window._entUiFilters || { moment: 'all', performer: 'all', source: 'all', type: 'all', status: 'all', act: 'all' };
  const ENT_SECTION_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'cues', label: 'Reception Cues' },
    { id: 'speeches', label: 'Speeches' },
    { id: 'playlist', label: 'Playlist' }
  ];
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

  function ensureEntertainmentDemoSeed() {
    let changed = false;
    if (!arr('entertainment').length) {
      const seed = [
        {
          name: 'Highlife Collective', type: 'Band', detail: 'Band · 7 pieces', cost: 2000, hours: '3 × 45 min',
          status: 'Contracted', soundcheck: '5:00pm', onSite: '8:00pm–10:15pm', arrival: '5:00pm', firstSet: '8:00pm',
          power: '2 × 16A', feeLabel: '$2,000', shortLabel: 'Highlife Collective',
          blocks: [
            { kind: 'loadin', start: '5:00pm', end: '5:45pm', label: '5:00 soundcheck' },
            { kind: 'perf', start: '8:00pm', end: '8:45pm', label: '8:00 set 1' },
            { kind: 'break', start: '8:45pm', end: '9:30pm', label: '8:45 break' },
            { kind: 'perf', start: '9:30pm', end: '10:15pm', label: '9:30 set 2' }
          ]
        },
        {
          name: 'DJ Mensah', type: 'DJ', detail: 'DJ · fills between sets', cost: 450, status: 'Contracted',
          arrival: '4:30pm', onSite: '7:00pm–1:00am', power: '1 × 13A', feeLabel: '$450', shortLabel: 'DJ Mensah',
          blocks: [
            { kind: 'loadin', start: '4:30pm', end: '5:00pm', label: 'Arrive 4:30' },
            { kind: 'perf', start: '7:00pm', end: '10:30pm', label: '7:00 dinner set' },
            { kind: 'perf', start: '10:30pm', end: '11:00pm', label: '10:30 late set' }
          ]
        },
        {
          name: 'Adowa troupe', type: 'Traditional', detail: 'Traditional · procession', cost: 300, hours: '20 min',
          status: 'Confirmed', arrival: '2:00pm', onSite: '3:00pm', power: 'None', feeLabel: '$300',
          shortLabel: 'Adowa troupe', detailShort: 'Procession · 20 min',
          blocks: [
            { kind: 'loadin', start: '2:00pm', end: '3:00pm', label: 'Arrive 2:00pm' },
            { kind: 'perf', start: '3:00pm', end: '3:20pm', label: '3:00pm procession' }
          ]
        },
        {
          name: 'Kwame · saxophone', type: 'Ceremony', detail: 'Ceremony & cocktail', cost: 250, status: 'Confirmed',
          arrival: '2:30pm', onSite: '3:15pm, 6:00pm', power: '1 × 13A', feeLabel: '$250',
          shortLabel: 'Kwame · sax', detailShort: 'Ceremony + cocktail',
          blocks: [
            { kind: 'loadin', start: '2:30pm', end: '3:15pm', label: 'Arrive 2:30' },
            { kind: 'perf', start: '3:15pm', end: '3:45pm', label: '3:15 prelude' },
            { kind: 'perf', start: '6:00pm', end: '6:45pm', label: '6:00 cocktail' }
          ]
        },
        {
          name: 'MC · Uncle Kojo', type: 'MC', detail: 'Reception host', cost: 0, status: 'Family, unpaid',
          arrival: '6:00pm', onSite: '6:45pm', power: 'shared', feeLabel: '$0',
          shortLabel: 'MC · Uncle Kojo', detailShort: 'Reception host',
          blocks: [
            { kind: 'loadin', start: '6:00pm', end: '6:45pm', label: 'Arrive 6:00' },
            { kind: 'perf', start: '6:45pm', end: '8:00pm', label: '6:45 on mic' }
          ]
        }
      ];
      seed.forEach(r => {
        if (typeof ensureRowId === 'function') ensureRowId(r, 'entertainment');
        data.entertainment.push(r);
      });
      changed = true;
    }
    if (!arr('speeches').length) {
      [
        { order: '1', speaker: 'Yaw Darko', role: 'Best man', moment: 'Toast', limit: '6 min' },
        { order: '2', speaker: 'Efua Mensah', role: 'Maid of honour', moment: 'Toast', limit: '5 min' },
        { order: '3', speaker: 'Mr Owusu', role: 'Father of the bride', moment: 'Welcome', limit: '3 min' }
      ].forEach(r => {
        if (typeof ensureRowId === 'function') ensureRowId(r, 'speeches');
        data.speeches.push(r);
      });
      changed = true;
    }
    if (changed && typeof save === 'function') save();
  }

  function actInitials(name) {
    if (typeof RdDepth !== 'undefined' && RdDepth.initials) return RdDepth.initials(name || '');
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '—';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function actRows() {
    ensureEntertainmentDemoSeed();
    return arr('entertainment').map((r, i) => ({
      id: r._id ? 'act:' + r._id : 'act:idx:' + i,
      index: i,
      row: r,
      name: String(r.name || '').trim() || 'Untitled act',
      shortLabel: String(r.shortLabel || r.name || '').trim(),
      type: String(r.type || 'Performer').trim() || 'Performer',
      detail: String(r.detail || r.type || 'Performer').trim(),
      detailShort: String(r.detailShort || r.detail || r.type || '').trim(),
      fee: parseFloat(r.cost) || 0,
      feeLabel: r.feeLabel || '',
      contact: r.contact || '',
      phone: r.phone || '',
      email: r.email || '',
      notes: r.notes || '',
      status: r.contract || r.status || (r.contractSigned ? 'Signed' : 'Confirmed'),
      hours: r.hours || '',
      onSite: r.onSite || r.window || '',
      soundcheck: r.soundcheck || '',
      power: r.power || '',
      arrival: r.arrival || r.arrives || '',
      firstSet: r.firstSet || '',
      blocks: Array.isArray(r.blocks) ? r.blocks : [],
      missing: !!r.missing
    }));
  }

  function unfilledRoles() {
    /* Master rule: an unfilled role gets a red card with a zero bar rather than being absent. */
    return [
      {
        id: 'act:missing:sound',
        index: -1,
        name: 'Sound engineer',
        shortLabel: 'Sound engineer',
        type: 'Not booked',
        detail: 'Not booked · blocks cue 1',
        detailShort: 'Not booked · blocks cue 1',
        fee: 0,
        feeLabel: '—',
        status: 'Missing',
        arrival: 'Needed 4:30pm',
        onSite: 'nobody assigned',
        power: '—',
        neededFrom: '4:30pm',
        cueNote: 'this role',
        blocks: [
          { kind: 'missing', start: '4:30pm', end: '11:00pm', label: 'Needed 4:30pm' }
        ],
        missing: true
      }
    ];
  }

  function parseEntHour(str) {
    const m = String(str || '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2] || '0', 10);
    const ap = m[3].toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h + min / 60;
  }

  function formatEntHour(h) {
    const hour = Math.floor(h);
    if (hour === 0 || hour === 24) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return hour + 'am';
    return (hour - 12) + 'pm';
  }

  const ENT_GANTT_START = 13; /* 1pm */
  const ENT_GANTT_END = 23;   /* 11pm */
  const ENT_GANTT_SPAN = ENT_GANTT_END - ENT_GANTT_START;

  function entGanttPct(hour) {
    const clipped = Math.max(ENT_GANTT_START, Math.min(ENT_GANTT_END, hour));
    return ((clipped - ENT_GANTT_START) / ENT_GANTT_SPAN) * 100;
  }

  function receptionCueRows() {
    const fromSongs = allSongs().filter(s => !isDnp(s) && s.moment && s.moment !== '—').map((s, i) => ({
      id: 'cue:' + s.id,
      order: i + 1,
      cue: s.moment,
      song: s.title,
      performer: s.performer,
      flag: s.flag || '',
      notes: s.cue || ''
    }));
    if (fromSongs.length) return fromSongs;
    return [
      { id: 'cue:demo:1', order: 1, cue: 'Grand entrance', song: 'Yeeko', performer: 'Highlife Collective', flag: 'Must play', notes: '' },
      { id: 'cue:demo:2', order: 2, cue: 'First dance', song: 'Yeeko', performer: 'Highlife Collective', flag: 'Must play', notes: '' },
      { id: 'cue:demo:3', order: 3, cue: 'Parents’ dance', song: 'Sweet Mother', performer: 'Highlife Collective', flag: 'Must play', notes: '' },
      { id: 'cue:demo:4', order: 4, cue: 'Cake cutting', song: 'Angela', performer: 'Highlife Collective', flag: '', notes: '' },
      { id: 'cue:demo:5', order: 5, cue: 'Dance floor open', song: 'Kwaku the Traveller', performer: 'DJ Mensah', flag: '', notes: '' }
    ];
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
    const contracted = acts.filter(a => /contract|sign|confirm|book/i.test(String(a.status || ''))).length;
    const powerBits = acts.map(a => a.power).filter(p => p && p !== '—' && !/^none$/i.test(p) && !/^shared$/i.test(p));
    const guestReq = songs.filter(s => /guest/i.test(String(s.source || ''))).length;
    return {
      performers: acts.length,
      songs: songs.length,
      must: must,
      dnp: dnp,
      unplaced: unplaced,
      ceremony: ceremony,
      spend: musicSpend(),
      momentsFilled: moments.size,
      momentsTarget: Math.max(moments.size, 13),
      contracted: contracted,
      unfilled: window._entShowUnfilled !== false ? unfilledRoles().length : 0,
      powerLabel: powerBits.length ? powerBits.slice(0, 2).join(' + ') : '—',
      guestRequests: guestReq,
      cues: receptionCueRows().length,
      speeches: arr('speeches').length
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
    const section = window._entSection || 'overview';
    const showPerformerPrimary = section === 'vendors' || (section === 'overview' && (mode === 'performers' || mode === 'timeline'));
    if (showPerformerPrimary && mode === 'timeline' && section === 'overview') {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEntPrintRun()">Print run sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Entertainment\',data.entertainment)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddPerformer()">Add performer</button>';
    }
    if (showPerformerPrimary) {
      return ''
        + '<button type="button" class="rd-btn" onclick="rdEntPrintTech()">Print tech sheet</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Entertainment\',data.entertainment)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddPerformer()">Add performer</button>';
    }
    if (section === 'speeches') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">Print section</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()">Full editor</button>'
        + '<button type="button" class="rd-btn" onclick="exportSectionCSV(\'Speeches\',data.speeches)">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="typeof addSpeechRow===\'function\'?addSpeechRow():rdEntAddSong()">Add speech</button>';
    }
    if (section === 'cues') {
      return ''
        + '<button type="button" class="rd-btn" onclick="printCurrentPage()">Print section</button>'
        + '<button type="button" class="rd-btn" onclick="typeof showPanel===\'function\'&&showPanel(\'timeline\')">Open timeline</button>'
        + '<button type="button" class="rd-btn" onclick="rdEntExport()">Export</button>'
        + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddSong()">Add song</button>';
    }
    return ''
      + '<button type="button" class="rd-btn" onclick="rdEntSendSetList()">Send set list</button>'
      + '<button type="button" class="rd-btn" onclick="printCurrentPage()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 16h10v4H7z"/></svg>Print section</button>'
      + '<button type="button" class="rd-btn" onclick="rdEntFullEditor()"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>Full editor</button>'
      + '<button type="button" class="rd-btn" onclick="rdEntExport()">Export</button>'
      + '<button type="button" class="rd-btn rd-btn--primary" onclick="rdEntAddSong()">Add song</button>';
  }

  function uedEntertainmentShellRd() {
    const panel = document.getElementById('panel-entertainment');
    if (!panel) return;
    panel.classList.add('ued-scope', 'entertainment-mockup');
    if (panel.dataset.uedShell === 'entertainment-rd10d-v3') {
      const actions = panel.querySelector('.rd-pagehead__actions');
      if (actions) actions.innerHTML = pageheadActionsHtml();
      return;
    }
    panel.dataset.uedShell = 'entertainment-rd10d-v3';
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
      <div class="rd-sectiontabs" id="entertainment-section-tabs" role="tablist" aria-label="Entertainment sections"></div>
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
            <div class="rd-view" id="ent-view-cues" data-ent-view="cues" hidden>
              <div class="rd-ent-sectionhead">
                <div class="rd-ent-sectionhead__eyebrow">Reception cues</div>
                <p class="rd-help">Each cue owns a moment on the Wedding Day Timeline.</p>
                <button type="button" class="rd-btn rd-btn--quiet" onclick="typeof showPanel==='function'&&showPanel('timeline')">Open the timeline</button>
              </div>
              <div class="rd-table-wrap ued-table-wrap" id="entertainment-cues-table"></div>
            </div>
            <div class="rd-view" id="ent-view-speeches" data-ent-view="speeches" hidden>
              <div class="rd-ent-sectionhead">
                <div class="rd-ent-sectionhead__eyebrow">Speeches</div>
                <p class="rd-help" id="entertainment-speeches-help">Speeches sit inside the reception block on the Wedding Day Timeline.</p>
                <button type="button" class="rd-btn rd-btn--quiet" onclick="typeof showPanel==='function'&&showPanel('timeline')">Open the timeline</button>
              </div>
              <div class="rd-table-wrap ued-table-wrap" id="entertainment-speeches-table"></div>
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

  function renderEntertainmentSectionTabs() {
    const host = document.getElementById('entertainment-section-tabs');
    if (!host) return;
    const active = window._entSection || 'overview';
    const f = entertainmentFigures();
    const counts = {
      overview: '',
      vendors: f.performers,
      cues: f.cues,
      speeches: f.speeches,
      playlist: f.songs
    };
    host.innerHTML = ENT_SECTION_TABS.map(tab => {
      const n = counts[tab.id];
      const countHtml = n === '' || n == null ? '' : `<span class="rd-sectiontabs__count">${n}</span>`;
      return `<button type="button" class="rd-sectiontabs__item${active === tab.id ? ' is-active' : ''}" role="tab" aria-selected="${active === tab.id}" onclick="rdSetEntertainmentSection('${tab.id}')">${esc(tab.label)}${countHtml}</button>`;
    }).join('') + `<span class="rd-ent-sectiontabs-note">5 sections</span>`;
  }

  function renderEntertainmentStatsRd() {
    const host = document.getElementById('entertainment-stats');
    if (!host) return;
    const f = entertainmentFigures();
    const mode = window._entMode || 'setlist';
    const section = window._entSection || 'overview';
    const acts = actRows();
    const showPerf = section === 'vendors' || (section === 'overview' && mode === 'performers');
    const showTl = section === 'overview' && mode === 'timeline';

    if (typeof RdDepth !== 'undefined' && RdDepth.renderStats) {
      let items;
      if (showPerf) {
        items = [
          { label: 'Acts', value: String(acts.length + (f.unfilled || 0)) },
          { label: 'Contracted', value: String(f.contracted) },
          { label: 'Fees', value: money0(f.spend) },
          { label: 'Unfilled roles', value: String(f.unfilled), attention: f.unfilled ? 'sound engineer · cue 1 blocked' : undefined },
          { label: 'Total power draw', value: f.powerLabel !== '—' ? f.powerLabel : '—', attention: acts.length ? 'venue confirmed capacity' : undefined }
        ];
      } else if (showTl) {
        items = [
          { label: 'Acts on the day', value: String(acts.length + (f.unfilled || 0)) },
          { label: 'Music covered', value: '3:00pm–1:00am' },
          { label: 'Silent gaps', value: '0', attention: 'DJ fills every break' },
          { label: 'Unfilled roles', value: String(f.unfilled), attention: f.unfilled ? 'sound desk from 4:30pm' : undefined },
          { label: 'Stage changeovers', value: '5', attention: '15 min minimum honoured' }
        ];
      } else if (section === 'speeches') {
        items = [
          { label: 'Speeches', value: String(f.speeches) },
          { label: 'Must play', value: String(f.must) },
          { label: 'Do not play', value: String(f.dnp) },
          { label: 'Unplaced', value: String(f.unplaced) },
          { label: 'Music spend', value: money0(f.spend) }
        ];
      } else if (section === 'cues') {
        items = [
          { label: 'Reception cues', value: String(f.cues) },
          { label: 'Moments filled', value: f.momentsFilled + ' of ' + f.momentsTarget },
          { label: 'Must play', value: String(f.must) },
          { label: 'Unplaced', value: String(f.unplaced) },
          { label: 'Music spend', value: money0(f.spend) }
        ];
      } else {
        items = [
          { label: 'Performers', value: String(f.performers) },
          { label: 'Songs', value: String(f.songs) },
          { label: 'Must play', value: String(f.must) },
          { label: 'Do not play', value: String(f.dnp) },
          { label: 'Music spend', value: money0(f.spend) }
        ];
      }
      RdDepth.renderStats(host, items);
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
    const section = window._entSection || 'overview';
    const switcher =
      `<div class="rd-toolbar__right">` +
      `<div class="rd-viewswitch" role="group" aria-label="Entertainment view">` +
      `<button type="button" class="rd-viewswitch__item${mode === 'setlist' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('setlist')">Set list</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'performers' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('performers')">Performers</button>` +
      `<button type="button" class="rd-viewswitch__item${mode === 'timeline' ? ' is-active' : ''}" onclick="rdSetEntertainmentView('timeline')">Timeline</button>` +
      `</div></div>`;

    if (section === 'vendors' || (section === 'overview' && mode === 'performers')) {
      host.innerHTML = filterChip('Type', 'type') + filterChip('Status', 'status') +
        `<button type="button" class="rd-chip${window._entShowUnfilled !== false ? ' is-active' : ''}" onclick="rdEntToggleUnfilled()">Show unfilled${window._entShowUnfilled !== false ? '<span class="rd-chip__clear">&#10005;</span>' : ''}</button>` +
        `<button type="button" class="rd-chip rd-chip--ghost">Sort by arrival time</button>` +
        (section === 'overview' ? switcher : '');
      return;
    }
    if (section === 'overview' && mode === 'timeline') {
      host.innerHTML = filterChip('Act', 'act') + filterChip('Type', 'type') +
        `<button type="button" class="rd-chip${window._entShowLoadIn !== false ? ' is-active' : ''}" onclick="rdEntToggleLoadIn()">Load-in shown${window._entShowLoadIn !== false ? '<span class="rd-chip__clear">&#10005;</span>' : ''}</button>` +
        `<span class="rd-ent-toolbar-note">1pm to 11pm · Sunday 8 Nov</span>` +
        switcher;
      return;
    }
    if (section === 'speeches') {
      host.innerHTML = `<button type="button" class="rd-chip">Speaker: all</button>` +
        `<span class="rd-help" style="margin-left:8px">Speech order · reception</span>`;
      return;
    }
    if (section === 'cues') {
      host.innerHTML = filterChip('Moment', 'moment') + filterChip('Performer', 'performer') +
        `<span class="rd-help" style="margin-left:8px">Cues follow the set list moments</span>`;
      return;
    }
    /* overview setlist + playlist */
    host.innerHTML = filterChip('Moment', 'moment') + filterChip('Performer', 'performer') + filterChip('Source', 'source') +
      (typeof rdSortChipHtml === 'function' ? rdSortChipHtml('Sort by running order', "rdEntOpenSort(this)") : '<button type="button" class="rd-chip rd-chip--ghost">Sort by running order</button>') +
      (typeof rdStandardRightHtml === 'function' ? rdStandardRightHtml('entertainment') : '') +
      (section === 'overview' ? switcher : '');
  }

  function renderBulkBar() {
    const host = document.getElementById('entertainment-bulk-bar');
    if (!host) return;
    const n = window._entSel.size;
    const section = window._entSection || 'overview';
    const mode = window._entMode || 'setlist';
    const showBulk = n && (section === 'overview' || section === 'playlist') && mode === 'setlist';
    if (!showBulk) {
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
    const section = window._entSection || 'overview';
    let active = 'setlist';
    if (section === 'vendors') active = 'performers';
    else if (section === 'cues') active = 'cues';
    else if (section === 'speeches') active = 'speeches';
    else if (section === 'playlist') active = 'setlist';
    else {
      /* overview — honour view switcher */
      active = (mode === 'performers' || mode === 'timeline') ? mode : 'setlist';
    }
    ['setlist', 'performers', 'timeline', 'cues', 'speeches'].forEach(name => {
      const el = document.getElementById('ent-view-' + name);
      if (el) el.hidden = name !== active;
    });
    const strip = document.getElementById('entertainment-act-strip');
    if (strip) strip.hidden = !(section === 'overview' && active === 'setlist');
  }

  function rdSetEntertainmentView(mode) {
    window._entSection = 'overview';
    window._entMode = (mode === 'performers' || mode === 'timeline') ? mode : 'setlist';
    renderEntertainmentRd();
  }
  function rdSetEntertainmentSection(id) {
    const ok = ENT_SECTION_TABS.some(t => t.id === id);
    window._entSection = ok ? id : 'overview';
    if (window._entSection === 'vendors') window._entMode = 'performers';
    else if (window._entSection === 'playlist' || window._entSection === 'overview') {
      if (window._entSection === 'playlist') window._entMode = 'setlist';
    }
    renderEntertainmentRd();
  }
  function applyEntertainmentRailView(viewId) {
    window._entRailView = viewId || 'full';
    if (typeof setSavedView === 'function') setSavedView('entertainment', window._entRailView);
    window._entSection = 'overview';
    window._entMode = 'setlist';
    renderEntertainmentRd();
  }
  function applyEntertainmentGroupBy(g) {
    window._entGroupBy = g || 'moment';
    window._entSection = window._entSection === 'playlist' ? 'playlist' : 'overview';
    window._entMode = 'setlist';
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
      html += `<tr class="rd-ent-empty"><td colspan="6">No songs in this view yet.</td></tr>`;
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

  function perfCardRow(label, value) {
    return `<div class="rd-ent-perfcard__row"><span>${esc(label)}</span><strong>${esc(value || '—')}</strong></div>`;
  }

  function renderPerformersView() {
    const host = document.getElementById('entertainment-performers-view');
    if (!host) return;
    const ui = window._entUiFilters || {};
    const acts = actRows().filter(a => {
      if (ui.type && ui.type !== 'all' && String(a.type).toLowerCase() !== String(ui.type).toLowerCase()) return false;
      if (ui.status && ui.status !== 'all' && String(a.status).toLowerCase() !== String(ui.status).toLowerCase()) return false;
      return true;
    });

    let html = acts.map(a => {
      const initials = actInitials(a.name);
      const fee = a.feeLabel || (a.fee ? money0(a.fee) : 'Included');
      const st = String(a.status || 'Confirmed');
      const scheme = /missing/i.test(st) ? 'red' : /sign|contract/i.test(st) ? 'green' : 'gold';
      const hoursBit = a.hours ? `<span class="rd-ent-perfcard__hours">${esc(a.hours)}</span>` : '';
      /* Master card fields: Fee · Soundcheck/Arrives · First set/Plays · Power */
      const row2Label = a.soundcheck ? 'Soundcheck' : 'Arrives';
      const row2Val = a.soundcheck || a.arrival || '—';
      const row3Label = a.firstSet ? 'First set' : 'Plays';
      const row3Val = a.firstSet || a.onSite || '—';
      return `<article class="rd-ent-perfcard" onclick="typeof openRecordEditor==='function'&&openRecordEditor('entertainment',${a.index})">` +
        `<div class="rd-ent-perfcard__top">` +
        `<span class="rd-ent-perfcard__avatar" aria-hidden="true">${esc(initials)}</span>` +
        `<div class="rd-ent-perfcard__who">` +
        `<div class="rd-ent-perfcard__name">${esc(a.name)}</div>` +
        `<div class="rd-ent-perfcard__type">${esc(a.detail || a.type)}</div>` +
        `</div></div>` +
        `<div class="rd-ent-perfcard__pills">` +
        `<span class="status-pill" data-pillscheme="${scheme}">${esc(st)}</span>${hoursBit}` +
        `</div>` +
        `<div class="rd-ent-perfcard__rows">` +
        perfCardRow('Fee', fee) +
        perfCardRow(row2Label, row2Val) +
        perfCardRow(row3Label, row3Val) +
        perfCardRow('Power', a.power || '—') +
        `</div></article>`;
    }).join('');

    if (window._entShowUnfilled !== false) {
      unfilledRoles().forEach(m => {
        html += `<article class="rd-ent-perfcard is-missing">` +
          `<div class="rd-ent-perfcard__top">` +
          `<span class="rd-ent-perfcard__avatar is-empty" aria-hidden="true">—</span>` +
          `<div class="rd-ent-perfcard__who">` +
          `<div class="rd-ent-perfcard__name">${esc(m.name)}</div>` +
          `<div class="rd-ent-perfcard__type">${esc(m.type)}</div>` +
          `</div></div>` +
          `<div class="rd-ent-perfcard__pills"><span class="status-pill" data-pillscheme="red">Missing</span></div>` +
          `<div class="rd-ent-missingbar" role="presentation" title="Unfilled · zero progress"></div>` +
          `<div class="rd-ent-perfcard__rows">` +
          perfCardRow('Fee', m.feeLabel || '—') +
          perfCardRow('Needed from', m.neededFrom || '4:30pm') +
          perfCardRow('Cue 1 depends on', m.cueNote || 'this role') +
          perfCardRow('Power', m.power || '—') +
          `</div></article>`;
      });
    }
    if (!acts.length && window._entShowUnfilled === false) {
      html = '<div class="rd-ent-empty-block">No performers yet. Add a band, DJ, or ceremony musician.</div>';
    }
    host.innerHTML = html;
  }

  /* ── Timeline view (30k) ─────────────────────────────────────────────── */

  function actTimelineBlocks(a) {
    if (a.blocks && a.blocks.length) {
      return a.blocks.map(b => ({
        kind: b.kind || 'perf',
        start: parseEntHour(b.start),
        end: parseEntHour(b.end),
        label: b.label || ''
      })).filter(b => b.start != null && b.end != null);
    }
    /* Derive from arrival / soundcheck / onSite when blocks are absent */
    const out = [];
    const arrH = parseEntHour(a.arrival);
    const scH = parseEntHour(a.soundcheck);
    const loadStart = scH != null ? scH : arrH;
    let perfStart = parseEntHour(a.firstSet);
    let perfEnd = null;
    if (a.onSite) {
      const range = String(a.onSite).match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[–—\-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      if (range) {
        perfStart = perfStart != null ? perfStart : parseEntHour(range[1]);
        perfEnd = parseEntHour(range[2]);
      } else {
        const single = parseEntHour(a.onSite);
        if (single != null && perfStart == null) perfStart = single;
      }
    }
    if (window._entShowLoadIn !== false && loadStart != null && perfStart != null && loadStart < perfStart) {
      out.push({ kind: 'loadin', start: loadStart, end: perfStart, label: a.arrival ? ('Arrive ' + a.arrival) : (a.soundcheck || '') });
    } else if (window._entShowLoadIn !== false && loadStart != null && !perfStart) {
      out.push({ kind: 'loadin', start: loadStart, end: Math.min(loadStart + 0.75, ENT_GANTT_END), label: a.arrival || a.soundcheck || '' });
    }
    if (perfStart != null) {
      out.push({ kind: 'perf', start: perfStart, end: perfEnd != null ? perfEnd : Math.min(perfStart + 1.5, ENT_GANTT_END), label: a.firstSet || a.onSite || '' });
    }
    return out;
  }

  function renderTimelineView() {
    const host = document.getElementById('entertainment-timeline-view');
    if (!host) return;
    const ui = window._entUiFilters || {};
    let acts = actRows().filter(a => {
      if (ui.type && ui.type !== 'all' && String(a.type).toLowerCase() !== String(ui.type).toLowerCase()) return false;
      if (ui.act && ui.act !== 'all' && String(a.name).toLowerCase() !== String(ui.act).toLowerCase()) return false;
      return true;
    });
    /* Master order: Adowa → Kwame → (Sound) → DJ → Highlife → MC */
    const orderHint = [/adowa/i, /kwame/i, /dj/i, /highlife/i, /mc|uncle/i];
    acts = acts.slice().sort((a, b) => {
      const ai = orderHint.findIndex(re => re.test(a.name));
      const bi = orderHint.findIndex(re => re.test(b.name));
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });

    const hours = [];
    for (let h = ENT_GANTT_START; h <= ENT_GANTT_END; h++) hours.push(h);

    if (!acts.length && window._entShowUnfilled === false) {
      host.innerHTML = '<div class="rd-ent-empty-block">Add performers to see the run-of-show timeline.</div>';
      return;
    }

    let html = `<div class="rd-ent-gantt__axis">` +
      `<span class="rd-ent-gantt__axis-spacer" aria-hidden="true"></span>` +
      `<div class="rd-ent-gantt__axis-hours">` +
      hours.map(h => `<span>${formatEntHour(h)}</span>`).join('') +
      `</div></div><div class="rd-ent-gantt__rows">`;

    const renderRow = (a, isMissing) => {
      let blocks = actTimelineBlocks(a);
      if (isMissing) {
        blocks = [{ kind: 'missing', start: 16.5, end: 23, label: 'Needed 4:30pm' }];
      }
      if (window._entShowLoadIn === false) {
        blocks = blocks.filter(b => b.kind !== 'loadin');
      }
      const bars = blocks.map(b => {
        if (b.kind === 'break') return '';
        const left = entGanttPct(b.start);
        const right = entGanttPct(b.end);
        const width = Math.max(right - left, 1.5);
        const cls = b.kind === 'missing' ? 'is-missing' : b.kind === 'loadin' ? 'is-loadin' : 'is-perf';
        return `<span class="rd-ent-gantt__bar ${cls}" style="left:${left}%;width:${width}%" title="${esc(b.label || '')}"></span>`;
      }).join('');
      const notes = blocks.filter(b => b.label).map(b => {
        const cls = b.kind === 'loadin' ? ' is-loadin' : b.kind === 'missing' ? ' is-missing' : '';
        return `<span class="rd-ent-gantt__note${cls}">${esc(b.label)}</span>`;
      }).join('');
      const sub = a.detailShort || a.detail || a.type;
      return `<div class="rd-ent-gantt__row${isMissing ? ' is-missing' : ''}">` +
        `<div class="rd-ent-gantt__label"><strong>${esc(a.shortLabel || a.name)}</strong><span>${esc(sub)}</span></div>` +
        `<div class="rd-ent-gantt__trackwrap">` +
        `<div class="rd-ent-gantt__track">${bars}</div>` +
        (notes ? `<div class="rd-ent-gantt__notes">${notes}</div>` : '') +
        `</div></div>`;
    };

    /* Insert unfilled sound row after Kwame / before DJ (Master order) */
    let insertedMissing = false;
    acts.forEach(a => {
      if (window._entShowUnfilled !== false && !insertedMissing && /dj/i.test(a.name)) {
        unfilledRoles().forEach(m => { html += renderRow(m, true); });
        insertedMissing = true;
      }
      html += renderRow(a, !!a.missing);
    });
    if (window._entShowUnfilled !== false && !insertedMissing) {
      unfilledRoles().forEach(m => { html += renderRow(m, true); });
    }

    html += `</div><p class="rd-help rd-ent-gantt__legend">Solid = performance · hatched = load-in or soundcheck. Windows follow Wedding Day Timeline blocks when set.</p>`;
    host.innerHTML = html;
  }

  /* ── Reception Cues + Speeches ───────────────────────────────────────── */

  function renderCuesTable() {
    const host = document.getElementById('entertainment-cues-table');
    if (!host) return;
    const rows = receptionCueRows();
    let html = `<table class="rd-ent-table rd-ent-table--compact"><thead><tr>` +
      `<th>#</th><th>Cue</th><th>Song</th><th>Performer</th><th>Flag</th><th>Notes</th>` +
      `</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr class="rd-ent-empty"><td colspan="6">No reception cues yet — place songs on moments to build the cue sheet.</td></tr>`;
    } else {
      rows.forEach(r => {
        html += `<tr class="rd-ent-row" onclick="typeof showPanel==='function'&&showPanel('timeline')">` +
          `<td>${esc(String(r.order))}</td>` +
          `<td><div class="rd-ent-name">${esc(r.cue)}</div></td>` +
          `<td>${esc(r.song || '—')}</td>` +
          `<td>${esc(r.performer || '—')}</td>` +
          `<td>${flagPill(r.flag)}</td>` +
          `<td>${esc(r.notes || '—')}</td>` +
          `</tr>`;
      });
    }
    html += `</tbody></table>`;
    host.innerHTML = html;
  }

  function renderSpeechesTable() {
    const host = document.getElementById('entertainment-speeches-table');
    if (!host) return;
    ensureEntertainmentDemoSeed();
    const rows = arr('speeches');
    let html = `<table class="rd-ent-table rd-ent-table--compact"><thead><tr>` +
      `<th>#</th><th>Speaker</th><th>Role</th><th>Moment</th><th>Limit</th>` +
      `</tr></thead><tbody>`;
    if (!rows.length) {
      html += `<tr class="rd-ent-empty"><td colspan="5">No speeches yet.</td></tr>`;
    } else {
      rows.forEach((r, i) => {
        html += `<tr class="rd-ent-row" onclick="typeof openRecordEditor==='function'&&openRecordEditor('speeches',${i})">` +
          `<td>${esc(String(r.order != null ? r.order : i + 1))}</td>` +
          `<td><div class="rd-ent-name">${esc(r.speaker || r.name || '—')}</div></td>` +
          `<td>${esc(r.role || '—')}</td>` +
          `<td>${esc(r.moment || r.slot || '—')}</td>` +
          `<td>${esc(r.limit || r.timeLimit || '—')}</td>` +
          `</tr>`;
      });
    }
    html += `<tr class="rd-ent-add"><td colspan="5"><button type="button" class="rd-ent-addbtn" onclick="typeof addSpeechRow==='function'&&addSpeechRow()"><span>+</span> Add a speech</button></td></tr>`;
    html += `</tbody></table>`;
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
    renderEntertainmentSectionTabs();
    applyViewMode();
    renderEntertainmentStatsRd();
    renderEntertainmentToolbar();
    renderBulkBar();

    const section = window._entSection || 'overview';
    const mode = window._entMode || 'setlist';

    if (section === 'vendors' || (section === 'overview' && mode === 'performers')) {
      renderPerformersView();
    } else if (section === 'overview' && mode === 'timeline') {
      renderTimelineView();
    } else if (section === 'cues') {
      renderCuesTable();
    } else if (section === 'speeches') {
      renderSpeechesTable();
    } else {
      /* overview setlist + playlist */
      if (section === 'overview') renderActStrip();
      else {
        const strip = document.getElementById('entertainment-act-strip');
        if (strip) strip.innerHTML = '';
      }
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
  window.rdSetEntertainmentSection = rdSetEntertainmentSection;
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

  /* Bridge legacy entTab to section tabs (19c) */
  window.entTab = function (name) {
    const map = {
      overview: 'overview',
      vendors: 'vendors',
      cues: 'cues',
      speeches: 'speeches',
      playlist: 'playlist',
      songs: 'playlist',
      setlist: 'overview'
    };
    rdSetEntertainmentSection(map[name] || 'overview');
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
